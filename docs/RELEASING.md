# Release procedure

Application and model versions are independent. Application v1.0.0 uses the frozen model 0.1.0. Do not retrain as a publication step.

1. Review source changes, licenses, data provenance, model card, README and repository metadata. Inspect Git history and CI artifacts for accidental private files or credentials.
2. Run local checks and push the candidate. Require a successful **Validate research release** run for its exact commit.
3. Create an annotated application tag, then run `python scripts/package_model.py`. The model archive records HEAD; do not package a dirty checkout.
4. Attach the model ZIP and its SHA-256 file to the matching GitHub release. Preserve already published release assets.
5. With owner approval, make the repository public and configure Pages to use GitHub Actions. The original private-first preparation was completed before public release.
6. Run **Publish approved release** with the reviewed tag. This workflow does not change visibility or retrain; it validates, builds and deploys the tagged sources.
7. Check the live URL, manifest, model/WASM loading and real inference. Confirm the About website and README links point to the live deployment.

Rollback: manually run the publication workflow for a previously verified application tag. Recheck its live model version after deployment. Ordinary pushes do not deploy.

Publication makes Git history and Actions logs public. Public release is a hosting milestone, not independent laboratory validation or material certification.
