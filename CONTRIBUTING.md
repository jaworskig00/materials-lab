# Contributing

Materials Lab focuses on documented civilian tensile-property research. Please open an issue before broad changes to its scientific scope, data contract or user experience.

## Development

Follow README.md for setup. Use Node.js 24 and Python 3.12, install from package-lock.json and requirements.lock, and run:

```bash
npm run check
python scripts/verify_model.py
python -m pytest -q
npx playwright install --with-deps chromium webkit
npm run test:e2e
```

Describe the problem, resulting behaviour and validation in your pull request. Preserve keyboard operation, reduced motion, mobile layout and the WebGL fallback. DESIGN.md records the visual system; PRODUCT.md records product scope.

## Scientific changes

Provide provenance, redistribution terms, units and transformation details for new public data. Keep related compositions in the same split, preserve missing labels, and separate model selection, calibration and final evaluation. Do not tune against the frozen test set. Retrained models need an updated model card, version, checksums and evaluation report.

Imported laboratory files are never training data by default. Use a small synthetic CSV to reproduce import bugs; do not attach confidential measurements or personal information to public issues.

## Licenses

Code contributions use the repository's MIT license. Source data and model assets retain their separately documented terms; do not assume MIT covers every file. Include required attribution with new assets. No contributor license agreement is required.
