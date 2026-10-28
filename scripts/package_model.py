"""Create a private candidate package from an explicit allowlist, never user imports."""
import hashlib
import json
import subprocess
import zipfile
from pathlib import Path
from verify_model import verify
ROOT=Path(__file__).resolve().parents[1]
if __name__=='__main__':
    verify()
    output=ROOT/'work/releases/model-0.1.0.zip'
    output.parent.mkdir(parents=True,exist_ok=True)
    commit=subprocess.check_output(['git','rev-parse','HEAD'],cwd=ROOT,text=True).strip()
    names=['yield.onnx','tensile.onnx','elongation.onnx','catalogue.json','manifest.json','metrics.json','MODEL_CARD.md']
    files=[ROOT/'public/models'/name for name in names]+[ROOT/'data/SOURCES.md',ROOT/'requirements.lock']
    with zipfile.ZipFile(output,'w',compression=zipfile.ZIP_DEFLATED) as archive:
        for p in files:
            archive.write(p,p.relative_to(ROOT))
        archive.writestr('release.json',json.dumps({'modelVersion':'0.1.0','sourceCommit':commit,'publication':'private candidate; requires owner approval'},indent=2))
    print(f'{output}\nSHA256 {hashlib.sha256(output.read_bytes()).hexdigest()}\nSource commit {commit}')
