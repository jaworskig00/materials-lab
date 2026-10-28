"""Verify the frozen release package without retraining or changing test splits."""
import hashlib
import json
from pathlib import Path
import numpy as np
import onnxruntime as ort

ort.disable_telemetry_events()

ROOT = Path(__file__).resolve().parents[1]

def verify():
    folder = ROOT / 'public/models'
    manifest = json.loads((folder / 'manifest.json').read_text())
    metrics = json.loads((folder / 'metrics.json').read_text())
    fixtures = json.loads((ROOT / 'tests/model-reference.json').read_text())
    X = np.array([f['features'] for f in fixtures], dtype=np.float32)
    for file, checksum in manifest['assets'].items():
        assert hashlib.sha256((folder / file).read_bytes()).hexdigest() == checksum
    for key, info in manifest['targets'].items():
        blob = (folder / info['file']).read_bytes()
        assert hashlib.sha256(blob).hexdigest() == info['sha256']
        pred = ort.InferenceSession(blob, providers=['CPUExecutionProvider']).run([info['output']], {info['input']: X})[0].ravel()
        np.testing.assert_allclose(pred, [f['expected'][key] for f in fixtures], rtol=1e-5, atol=.02)
        m = metrics['targets'][key]
        assert m['mae'] <= .9*m['baselineMae'], f'{key}: MAE release gate failed'
        assert m['coverage'] >= .85, f'{key}: coverage gate failed'
    assert manifest['ready'] and metrics['ready']
    print(f'Verified three ONNX models against {len(fixtures)} reference records; all release gates pass.')

if __name__ == '__main__':
    verify()
