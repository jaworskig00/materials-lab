# Data provenance

Ninad Bhat, Amanda S. Barnard and Nick Birbilis (2023), **Aluminium alloy dataset for supervised learning**, Mendeley Data, V1. DOI: [10.17632/b6br4yk6r3.1](https://doi.org/10.17632/b6br4yk6r3.1).

- Landing page: https://data.mendeley.com/datasets/b6br4yk6r3/1
- Accessed: 2026-10-28.
- License: [Creative Commons Attribution 4.0 International](https://creativecommons.org/licenses/by/4.0/). Retain this attribution, link the license and identify changes when redistributing.
- Publisher file ID: `bc98e0d7-6c56-42dc-aa54-d689cbfe1230` (`al_data.csv`).
- Publisher and local SHA256: `a3dd4f5091e485cf4db90308babcad38831174ddafbb6ae03df4ca3d4a647906`.
- Original snapshot: `data/raw/al_data.csv`, unchanged.

## Changes in the derived catalogue

The original 1,154 records contain 25 elemental mass fractions, a categorical processing description, three measured properties, and a class column. Elemental fractions sum to approximately one; the UI multiplies by 100 for mass percent. The class column is excluded from predictors. Display names normalise spelling only; original processing labels are preserved. Source IDs are assigned from the original zero-based row ID. Display composition names are summaries, not certified alloy designations.

The audit excludes 181 exact duplicate records and one record whose measured yield strength exceeds measured tensile strength. The remaining 972 records span 398 composition groups. Missing target values are preserved and excluded only from the corresponding target's training. No synthetic measurement labels, unreported test conditions or inferred manufacturing instructions are introduced.

See `audit.json` for each excluded source row and `splits.json` for the frozen partition. The app's derived catalogue and released model weights are distributed with CC BY 4.0 attribution; the application code is MIT.

## Additional implementation references

- [Group-wise validation, scikit-learn](https://scikit-learn.org/stable/modules/cross_validation.html#group-k-fold)
- [ONNX model persistence, scikit-learn](https://scikit-learn.org/stable/model_persistence.html#onnx)
- [ONNX Runtime Web environment flags](https://onnxruntime.ai/docs/tutorials/web/env-flags-and-session-options.html)
- [Vite deployment to GitHub Pages](https://vite.dev/guide/static-deploy.html#github-pages)

These references support software and evaluation methods; they are not extra experimental datasets.
