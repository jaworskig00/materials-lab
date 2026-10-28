# Materials Lab tensile surrogate 0.1.0

## Intended use

Research exploration of documented aluminium tensile-property records. Inputs are constrained to the catalogue. Outputs are yield strength (MPa), tensile strength (MPa) and elongation (%). This package is not independently laboratory-validated and is not a certification or a finite-element simulation. The UI does not expose inverse design or arbitrary composition optimisation.

## Data and attribution

Bhat, N.; Barnard, A. S.; Birbilis, N. (2023). *Aluminium alloy dataset for supervised learning*. Mendeley Data, V1, [doi:10.17632/b6br4yk6r3.1](https://doi.org/10.17632/b6br4yk6r3.1). CC BY 4.0. Original SHA256: `a3dd4f5091e485cf4db90308babcad38831174ddafbb6ae03df4ca3d4a647906`.

972 audited records from 1,154 original rows; 398 composition groups. 181 exact duplicates and one physically inconsistent measured record were removed. Missing measurements are not imputed. The data and derived model weights retain [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/) attribution. No private laboratory data is included.

## Training

One regressor per property. Ridge and two bounded Random Forest configurations were compared using five-fold GroupKFold MAE within the training partition. The depth-12, 96-tree Random Forest was selected for each property. Inputs are 25 mass fractions plus 10 documented processing indicators. The source class column is excluded.

Composition fingerprints group all processing states together. GroupShuffleSplit seeds 42 and 43 produce approximately 70% training, 15% calibration and 15% test groups. All fitted statistics and model selection use training data only. The final test partition is frozen and not used for calibration. See `metrics.json` for actual sample counts, baselines, all CV scores and per-state metrics.

## Frozen test results

- Yield strength: MAE 35.75 MPa; median baseline 122.51 MPa; observed interval coverage 96.8%.
- Tensile strength: MAE 32.29 MPa; median baseline 131.27 MPa; observed interval coverage 94.4%.
- Elongation: MAE 2.87 percentage points; median baseline 5.73 percentage points; observed interval coverage 98.5%.

All three pass the project thresholds: at least 10% MAE improvement over the median baseline and at least 85% empirical coverage of nominal 90% intervals. These thresholds are project-level release checks, not engineering qualification.

## Uncertainty and support

Split-conformal intervals use the maximum absolute residual in each calibration composition group, with a finite-sample-corrected 90% quantile. This yields conservative, sometimes wide intervals. Lower bounds are clipped at zero, consistent with positive properties; all original calibration radii and unclipped widths remain in the manifest/metrics. Reported coverage is empirical, not a guarantee for a new laboratory or shifted population.

A training-only distance heuristic and processing support count flag limited or unsupported records. This flag is a screening aid, not a calibrated probability. Unsupported records and nonpositive/nonfinite/internally inconsistent predictions are not shown as valid predictions. Being in the supported region does not establish physical validity. The UI identifies records used in training separately from calibration and held-out test records.

## Limitations

Single compiled dataset; no external laboratory validation. Processing labels omit full histories, microstructure, test orientation, defects and other conditions. No arbitrary temperature, strain-rate or geometry inputs are supported. Predictions of three scalar properties cannot reconstruct a stress–strain curve or fracture trajectory. The 3D specimen is a schematic illustration with an arbitrary stage parameter, independent of model predictions.

## Reproduction and serving

Pinned dependencies are in `requirements.lock`. Run `python scripts/train.py` to reproduce the package from the original CSV. Run `python scripts/verify_model.py` and `python -m pytest` to validate the frozen package. Browser inference runs the same ONNX weights in a dedicated single-thread WASM worker. Numerical parity tolerance is 0.02 in the output unit plus relative tolerance 1e-5.

Models total 4,528,009 bytes. `manifest.json` contains file hashes, feature order, input/output names and calibration radii. User CSVs remain in browser IndexedDB and are never added to training automatically.
