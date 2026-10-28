# License scope and attribution

Application code and authored documentation are copyright © 2026 Grzegorz Jaworski and licensed under the root MIT LICENSE. The following assets have separate terms; the MIT license does not replace them.

## Data and derived models — CC BY 4.0

Ninad Bhat, Amanda S. Barnard and Nick Birbilis (2023), *Aluminium alloy dataset for supervised learning*, Mendeley Data, V1. https://doi.org/10.17632/b6br4yk6r3.1

Original dataset license: Creative Commons Attribution 4.0 International, https://creativecommons.org/licenses/by/4.0/. An offline copy is in licenses/CC-BY-4.0.txt.

This applies to data/raw/al_data.csv. The derived catalogue, source-derived audit/split/reference records and ONNX weights are also distributed under CC BY 4.0. Preserve the dataset credit, license link and transformation notice when redistributing. Changes: duplicate and inconsistent records excluded; processing display labels normalised; percentages calculated from mass fractions; composition groups and partitions assigned; regression models fitted and calibrated. Full details are in data/SOURCES.md and public/models/MODEL_CARD.md.

The dataset authors and publisher do not endorse this application. No private user-imported measurements are included in the repository or release.

## Fonts and software dependencies

Manrope and IBM Plex Mono retain their bundled SIL Open Font License 1.1 notices. Bundled JavaScript, WASM and other dependency components retain their upstream terms.

public/THIRD_PARTY_NOTICES.txt is generated from installed production dependency metadata and license files plus pinned upstream notices where the npm package omits them. It intentionally includes the full production dependency closure; not every listed module is used in every tree-shaken build. ONNX Runtime's upstream third-party notice covers multiple build variants and is retained in full.

See licenses/vendor/SOURCES.md for upstream provenance. No dependency is relicensed by Materials Lab.
