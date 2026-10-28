"""Package the frozen model from an explicit allowlist, never user imports."""
import hashlib
import json
import subprocess
import zipfile
from pathlib import Path
from verify_model import verify
ROOT=Path(__file__).resolve().parents[1]
if __name__=='__main__':
    if subprocess.check_output(['git','status','--porcelain'],cwd=ROOT,text=True).strip():
        raise SystemExit('Commit the reviewed changes before packaging a release.')
    verify()
    output=ROOT/'work/releases/model-0.1.0.zip'
    output.parent.mkdir(parents=True,exist_ok=True)
    commit=subprocess.check_output(['git','rev-parse','HEAD'],cwd=ROOT,text=True).strip()
    names=['yield.onnx','tensile.onnx','elongation.onnx','catalogue.json','manifest.json','metrics.json','MODEL_CARD.md']
    files=[ROOT/'public/models'/name for name in names]+[ROOT/'data/SOURCES.md',ROOT/'requirements.lock',ROOT/'NOTICE.md',ROOT/'LICENSE',ROOT/'licenses/CC-BY-4.0.txt']
    with zipfile.ZipFile(output,'w',compression=zipfile.ZIP_DEFLATED) as archive:
        for p in files:
            archive.write(p,p.relative_to(ROOT))
        archive.writestr('release.json',json.dumps({'modelVersion':'0.1.0','sourceCommit':commit,'modelLicense':'CC-BY-4.0','codeLicense':'MIT'},indent=2))
    checksum=hashlib.sha256(output.read_bytes()).hexdigest()
    output.with_suffix('.zip.sha256').write_text(f'{checksum}  {output.name}\n')
    print(f'{output}\nSHA256 {hashlib.sha256(output.read_bytes()).hexdigest()}\nSource commit {commit}')
