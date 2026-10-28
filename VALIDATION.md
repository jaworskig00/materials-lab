# Private candidate validation

Date: 2026-10-28. Scope: the local civilian catalogue research application and frozen model version 0.1.0. No independent laboratory validation is claimed.

## Local checks

- ESLint and TypeScript: passed.
- Vitest: 11 tests passed, including CSV validation, absent measurements, inconsistent predictions, manifest contracts and export metadata.
- Python/pytest: 4 tests passed, including composition units, repeatable group partitions, calibration, frozen metrics and ONNX parity.
- Model verification: all three ONNX models agree with Python reference predictions over all 972 audited records (rtol 1e-5, absolute tolerance 0.02); checksums and release gates pass.
- Production Vite build: passed with base `/materials-lab/`.
- Playwright: 12 tests passed, six each in Chromium and WebKit. Tests exercise real model inference, 3D controls, persistence, CSV import, export, asset failure/retry, incompatible manifest, WebGL fallback, reduced motion, keyboard focus and a mocked-worker fixture.
- Network assertion: the browser inference test made no HTTP requests outside the local app origin.
- Captured desktop (1440 px), mobile (390 px), evidence and four-record comparison views: no script errors or page overflow in the capture run. Comparison labels retain 13 px screen size.
- Impeccable finish-review verdict: **ship**, scoped to its three listed fixes (contract applicability, static eyebrow removal, comparison label legibility). The precisely pinned user brief governs the direction; no historical concept-roll seed is invented.
- React Doctor source-only review: no correctness/security/accessibility findings; two maintainability warnings for control-flow complexity in App/PredictionPanel remain.
- Dependency audit at preparation: npm reported zero known vulnerabilities. This is a point-in-time check, not a security certification.

## Frozen model evidence

Accepted rows: 972; unique composition groups: 398. Training: 639 rows / 278 groups. Calibration: 180 rows / 60 groups. Test: 153 rows / 60 groups. Missing target values mean test sample counts differ per target.

- Yield strength: MAE 35.75 MPa; median baseline 122.51 MPa; nominal 90% interval coverage 96.8%.
- Tensile strength: MAE 32.29 MPa; median baseline 131.27 MPa; interval coverage 94.4%.
- Elongation: MAE 2.87 percentage points; median baseline 5.73 points; interval coverage 98.5%.

All meet the project gates (at least 10% MAE improvement and at least 85% coverage). Three ONNX files total 4,528,009 bytes. Full precision, subgroup metrics and limitations are in `public/models/metrics.json` and the model card. Test data comes from the same published dataset; these results do not establish external validity or material certification.

## Reproduce and identify

Run `npm run check`, `.venv/bin/python -m pytest -q`, `.venv/bin/python scripts/verify_model.py`, then `npm run test:e2e`. CI repeats these checks on Ubuntu with Node 24 and Python 3.12. See the repository Actions run for the exact tested commit and its result; this local record does not pre-claim remote CI success.

`python scripts/package_model.py` creates an allowlisted model archive under `work/releases/`. Its `release.json` records the source commit. Deployment never retrains.

## Publication boundary

The requested first remote is private `jaworskig00/materials-lab`. GitHub Pages stays disabled. The publication workflow is manual and refuses private repositories. Making the repository public, creating the public v1.0.0 release and enabling Pages require the owner's separate decision.

Local generated environments, runtime copies, imports, browser traces and scratch files are ignored. Only the public source snapshot and authored project assets belong in Git history. No user-imported laboratory records are included.

## 3D illustration refinement

The subsequent scene update adds jaw closure, fixed lower/moving upper grips, visible gauge separation, an original-outline overlay, three camera presets, phase jumps and variable playback speed. It is identical for every material and does not consume prediction values.

Local lint, TypeScript, 11 unit tests and production build passed. Browser coverage increased to 14 passing tests (seven per browser); the added test checks visibly changed canvas captures, camera presets, outline selection, replay, pause, direct phase selection and live reduced-motion preferences. React Doctor found no issues in the changed scene and playback hook. Desktop and mobile captures report no script errors and a 390px mobile document width. Model files and their calibration are unchanged. GitHub Actions provides the result for the exact updated commit.
