"""Reproducible, catalogue-only tensile-property surrogate. Never fit on test data."""
from __future__ import annotations

import hashlib
import json
import math
from pathlib import Path

import numpy as np
import pandas as pd
import onnxruntime as ort
from sklearn.ensemble import RandomForestRegressor
from sklearn.linear_model import Ridge
from sklearn.pipeline import make_pipeline
from sklearn.preprocessing import StandardScaler
from sklearn.model_selection import GroupKFold, GroupShuffleSplit, cross_val_score
from sklearn.metrics import mean_absolute_error, mean_squared_error, r2_score
from skl2onnx import to_onnx

ort.disable_telemetry_events()

ROOT = Path(__file__).resolve().parents[1]
RAW_SHA = 'a3dd4f5091e485cf4db90308babcad38831174ddafbb6ae03df4ca3d4a647906'
VERSION = '0.1.0'
TARGETS = {
    'yield': ('Yield Strength (MPa)', 'Yield strength', 'MPa'),
    'tensile': ('Tensile Strength (MPa)', 'Tensile strength', 'MPa'),
    'elongation': ('Elongation (%)', 'Elongation', '%'),
}
PROCESS_NAMES = {
    'Solutionised  + Artificially peak aged': 'Solutionised + peak aged',
    'Solutionised + Artificially over aged': 'Solutionised + over aged',
    'Strain Harderned (Hard)': 'Strain hardened (hard)',
    'No Processing': 'No processing recorded',
    'Solutionised + Naturally aged': 'Solutionised + naturally aged',
    'Solutionised + Cold Worked + Naturally aged': 'Solutionised + cold worked + naturally aged',
    'Strain hardened': 'Strain hardened',
    'Artificial aged': 'Artificially aged',
    'Naturally aged': 'Naturally aged',
    'Solutionised': 'Solutionised',
}


def dump(path, value):
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(value, indent=2, allow_nan=False) + '\n')


def fingerprint(values):
    return hashlib.sha256(np.round(values, 8).astype('<f8').tobytes()).hexdigest()[:16]


def prepare():
    raw = ROOT / 'data/raw/al_data.csv'
    assert hashlib.sha256(raw.read_bytes()).hexdigest() == RAW_SHA, 'Source checksum mismatch'
    df = pd.read_csv(raw)
    elements = list(df.columns[2:-4])
    assert len(elements) == 25
    df['sampleId'] = [f'AL-{int(i) + 1:04d}' for i in df.iloc[:, 0]]
    df['sourceRow'] = df.iloc[:, 0].astype(int)
    comps = df[elements].to_numpy(dtype=float)
    valid = np.isfinite(comps).all(axis=1) & (comps >= 0).all(axis=1) & np.isclose(comps.sum(axis=1), 1, atol=1e-4)
    reasons = {i: 'Invalid composition or fraction sum' for i in df.index[~valid]}
    inconsistent = df['Yield Strength (MPa)'].gt(df['Tensile Strength (MPa)'])
    for i in df.index[inconsistent]:
        reasons[i] = 'Measured yield exceeds tensile strength'
    for column, _, _ in TARGETS.values():
        bad = df[column].notna() & (~np.isfinite(df[column]) | df[column].le(0))
        for i in df.index[bad]:
            reasons[i] = f'Invalid measured value: {column}'
    df = df.drop(index=list(reasons)).copy()
    dedup_cols = ['Processing'] + elements + [t[0] for t in TARGETS.values()]
    duplicate = df.duplicated(subset=dedup_cols)
    for i in df.index[duplicate]:
        reasons[i] = 'Exact duplicate record'
    df = df.loc[~duplicate].reset_index(drop=True)
    df['group'] = [fingerprint(x) for x in df[elements].to_numpy()]
    groups = df['group'].to_numpy()
    develop, test = next(GroupShuffleSplit(n_splits=1, test_size=.15, random_state=42).split(df, groups=groups))
    train_local, cal_local = next(GroupShuffleSplit(n_splits=1, test_size=.15/.85, random_state=43).split(develop, groups=groups[develop]))
    split = np.full(len(df), 'test', dtype=object)
    split[develop[train_local]] = 'train'
    split[develop[cal_local]] = 'calibration'
    df['split'] = split
    categories = sorted(PROCESS_NAMES.keys())  # Fixed documented vocabulary, no learned test statistics.
    vectors = np.column_stack([df[elements].to_numpy(dtype=np.float32), *[(df['Processing'] == c).astype(np.float32) for c in categories]]).astype(np.float32)
    audit = {
        'sourceRows': 1154, 'acceptedRows': len(df), 'compositionGroups': int(df['group'].nunique()),
        'sourceSha256': RAW_SHA, 'compositionUnit': 'mass fraction; displayed as mass %',
        'excluded': [{'sourceRow': int(i), 'reason': reason} for i, reason in sorted(reasons.items())],
        'missingTargets': {key: int(df[c].isna().sum()) for key, (c, _, _) in TARGETS.items()},
        'splits': {part: {'rows': int((split == part).sum()), 'groups': int(df.loc[split == part, 'group'].nunique())} for part in ['train', 'calibration', 'test']},
        'grouping': 'SHA256 of composition mass fractions rounded to eight decimals; all processing states kept together.',
        'testPolicy': 'Fixed seeds 42/43; test data never used for tuning or calibration.'
    }
    return df, elements, categories, vectors, audit


def conformal_radius(residuals, groups, coverage=.9):
    # Maximum residual per independent composition group, not pseudo-independent rows.
    scores = np.array([np.max(residuals[groups == g]) for g in np.unique(groups)])
    rank = min(len(scores), math.ceil((len(scores) + 1) * coverage))
    return float(np.sort(scores)[rank - 1]), len(scores)


def main():
    df, elements, categories, X, audit = prepare()
    out = ROOT / 'public/models'
    out.mkdir(parents=True, exist_ok=True)
    train_all = (df['split'] == 'train').to_numpy()
    metrics, manifest_targets, references = {}, {}, {}
    for key, (column, label, unit) in TARGETS.items():
        available = df[column].notna().to_numpy()
        masks = {p: ((df['split'] == p).to_numpy() & available) for p in ['train', 'calibration', 'test']}
        tr, ca, te = [masks[p] for p in ['train', 'calibration', 'test']]
        y = df[column].to_numpy()
        candidates = {
            'ridge': make_pipeline(StandardScaler(), Ridge(alpha=10)),
            'forest-depth8': RandomForestRegressor(n_estimators=96, max_depth=8, min_samples_leaf=2, random_state=42, n_jobs=1),
            'forest-depth12': RandomForestRegressor(n_estimators=96, max_depth=12, min_samples_leaf=1, random_state=42, n_jobs=1),
        }
        cv = GroupKFold(n_splits=5)
        scores = {name: float(-cross_val_score(model, X[tr], y[tr], groups=df.loc[tr, 'group'], cv=cv, scoring='neg_mean_absolute_error', n_jobs=1).mean()) for name, model in candidates.items()}
        winner = min(scores, key=scores.get)
        model = candidates[winner].fit(X[tr], y[tr])
        radius, calibration_groups = conformal_radius(np.abs(model.predict(X[ca]) - y[ca]), df.loc[ca, 'group'].to_numpy())
        pred = model.predict(X[te])
        mae = float(mean_absolute_error(y[te], pred))
        baseline = float(mean_absolute_error(y[te], np.full(te.sum(), np.median(y[tr]))))
        coverage = float(np.mean(np.abs(pred - y[te]) <= radius))
        by_state = {}
        test_states = df.loc[te, 'Processing'].to_numpy()
        for c in categories:
            m = test_states == c
            if m.sum():
                by_state[PROCESS_NAMES[c]] = {'n': int(m.sum()), 'mae': float(mean_absolute_error(y[te][m], pred[m])), 'coverage': float(np.mean(np.abs(pred[m] - y[te][m]) <= radius))}
        metric = {
            'label': label, 'unit': unit, 'selectedModel': winner, 'cvMae': scores,
            'mae': mae, 'rmse': float(np.sqrt(mean_squared_error(y[te], pred))), 'r2': float(r2_score(y[te], pred)),
            'baselineMae': baseline, 'improvement': 1 - mae/baseline,
            'coverage': coverage, 'intervalWidth': 2 * radius, 'nominalCoverage': .9,
            'trainN': int(tr.sum()), 'calibrationN': int(ca.sum()), 'testN': int(te.sum()), 'calibrationGroups': calibration_groups,
            'byProcessing': by_state, 'ready': bool(mae <= .9 * baseline and coverage >= .85),
        }
        metrics[key] = metric
        exported = to_onnx(model, X[tr][:1], target_opset={'': 17, 'ai.onnx.ml': 3})
        binary = exported.SerializeToString()
        (out / f'{key}.onnx').write_bytes(binary)
        session = ort.InferenceSession(binary, providers=['CPUExecutionProvider'])
        exported_pred = session.run(None, {session.get_inputs()[0].name: X})[0].ravel()
        assert np.allclose(exported_pred, model.predict(X), atol=.02, rtol=1e-5), 'ONNX parity failed'
        references[key] = [float(p) for p in exported_pred]
        manifest_targets[key] = {'file': f'{key}.onnx', 'sha256': hashlib.sha256(binary).hexdigest(), 'bytes': len(binary), 'input': session.get_inputs()[0].name, 'output': session.get_outputs()[0].name, 'radius': radius, 'unit': unit}
        print(f'{label}: {winner}; MAE {mae:.2f} vs baseline {baseline:.2f}; coverage {coverage:.1%}; ready={metric["ready"]}', flush=True)

    train_counts = df.loc[train_all, 'Processing'].value_counts().to_dict()
    train_comps = df.loc[train_all, elements].to_numpy(dtype=float)
    scale = np.std(train_comps, axis=0)
    scale[scale < 1e-6] = 1
    z = train_comps / scale
    distances = np.sqrt(np.mean((z[:, None, :] - z[None, :, :])**2, axis=2))
    distances[distances < 1e-8] = np.inf
    threshold = max(.25, float(np.quantile(distances.min(axis=1), .95)))
    samples = []
    for i, row in df.iterrows():
        d = float(np.sqrt(np.mean(((train_comps - row[elements].to_numpy(dtype=float)) / scale)**2, axis=1)).min())
        count = int(train_counts.get(row['Processing'], 0))
        status = 'unsupported' if count == 0 or d > 2 * threshold else ('limited' if count < 20 or d > threshold else 'supported')
        major = sorted([(e, float(row[e])) for e in elements if e != 'Al' and row[e] >= .002], key=lambda x: -x[1])[:3]
        samples.append({
            'id': row['sampleId'], 'label': 'Al' + ''.join('–' + e for e, _ in major),
            'processing': PROCESS_NAMES[row['Processing']], 'sourceProcessing': row['Processing'],
            'sourceRow': int(row['sourceRow']), 'group': row['group'], 'split': row['split'],
            'features': X[i].tolist(), 'composition': {e: round(float(row[e])*100, 6) for e in elements if row[e] > 0},
            'measured': {key: None if pd.isna(row[c]) else float(row[c]) for key, (c, _, _) in TARGETS.items()},
            'support': status, 'distance': d, 'processingTrainN': count,
        })
    catalogue = {'source': {'title': 'Aluminium alloy dataset for supervised learning', 'authors': 'N. Bhat, A. S. Barnard, N. Birbilis', 'url': 'https://data.mendeley.com/datasets/b6br4yk6r3/1', 'doi': '10.17632/b6br4yk6r3.1', 'license': 'CC BY 4.0'}, 'samples': samples, 'audit': audit}
    dump(out / 'catalogue.json', catalogue)
    dump(out / 'metrics.json', {'version': VERSION, 'ready': all(m['ready'] for m in metrics.values()), 'targets': metrics, 'audit': audit})
    dump(ROOT / 'data/audit.json', audit)
    dump(ROOT / 'data/splits.json', [{'id': row['sampleId'], 'group': row['group'], 'split': row['split']} for _, row in df.iterrows()])
    fixtures = [{'id': s['id'], 'features': s['features'], 'expected': {k: references[k][i] for k in TARGETS}} for i, s in enumerate(samples)]
    dump(ROOT / 'tests/model-reference.json', fixtures)
    assets = {f: hashlib.sha256((out/f).read_bytes()).hexdigest() for f in ['catalogue.json', 'metrics.json']}
    manifest = {'schemaVersion': 1, 'modelVersion': VERSION, 'ready': all(m['ready'] for m in metrics.values()), 'featureCount': X.shape[1], 'features': elements + [f'processing:{c}' for c in categories], 'compositionUnit': 'mass fraction', 'nominalCoverage': .9, 'calibrationMethod': 'Split conformal; maximum absolute residual per composition group; finite-sample corrected quantile.', 'targets': manifest_targets, 'assets': assets, 'sourceSha256': RAW_SHA, 'oodThreshold': threshold}
    assert sum(t['bytes'] for t in manifest_targets.values()) <= 15 * 1024**2
    dump(out / 'manifest.json', manifest)
    print(f'Saved {len(samples)} catalogue records; {audit["compositionGroups"]} groups. Release ready: {manifest["ready"]}')


if __name__ == '__main__':
    main()
