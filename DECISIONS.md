# Implementation decisions

## Product and privacy

The accepted scope is civilian tensile-property research with a catalogue-constrained surrogate and a schematic 3D specimen. The interface is English and code-first, following the approved dark neutral laboratory direction. No material discovery optimizer, ballistic model, cloud inference, user accounts or analytics is included.

All work and local verification precede the first push. The remote must remain private, with Pages disabled, until the owner explicitly approves a public release. No CI workflow changes visibility or publishes on ordinary pushes.

## Data and validation

The publisher-confirmed CSV checksum is pinned. Fractions are stored in [0,1], not percentages; only the display multiplies by 100. The original processing spelling is preserved beside the display label. All 25 composition dimensions are used; the source class label is excluded. Missing target measurements remain missing.

181 exact duplicates and one measured yield/tensile inconsistency are removed. All processing variants of one composition stay in the same partition. Model selection uses training-only grouped CV. Calibration uses group maximum residuals rather than treating related observations as independent. No test-set tuning or synthetic target values are used.

The OOD heuristic uses composition distance scaled by training-only standard deviations, with a threshold based on the 95th percentile of nearest different-composition training distances (floor 0.25). A record is unsupported if its state has no training observations or its distance exceeds twice this threshold; limited support means fewer than 20 state observations or distance above the threshold. This is explicitly a heuristic.

## Model delivery

Three depth-12 Random Forest models were selected by grouped validation from Ridge and two forest configurations. ONNX export retains numerical parity with the fitted estimators. The complete catalogue reference outputs are checked in for cross-runtime regression tests. The runtime validates manifests and file hashes. Both real Chromium and WebKit inference are tested; mocked-worker tests cover UI independently.

The single-thread WASM provider runs inside a dedicated Worker and requires neither cross-origin isolation nor WebGPU. Stale inference results are discarded when the selected record changes. Assets are served under the Vite base path; no release-host CORS dependency is introduced.

## Visualization and storage

The 3D fixture is authored with reusable Three.js geometry. Illustration-stage motion is arbitrary and independent of the surrogate: scalar tensile properties do not provide the information needed for a faithful deformation/fracture simulation. The UI says this next to the scene. Reduced motion disables playback and preserves manual inspection. WebGL failure has an SVG fallback.

Saved comparisons and CSV measurements use IndexedDB. A new import replaces the local measurement list; invalid imports preserve existing data. Persistence failures retain in-memory work and advise export. Comparisons from another model version are not silently reused. Cache writes are optional and never required for inference.

## Release criteria

All three models must improve test MAE over the median baseline by at least 10%, and nominal 90% intervals must achieve at least 85% empirical coverage. These project thresholds passed. They do not certify a material or establish external validity. Public publication additionally requires the owner's explicit decision.
