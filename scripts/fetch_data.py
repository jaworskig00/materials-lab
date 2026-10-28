"""Fetch only the reviewed CC BY 4.0 dataset version, validating before replacement."""
import hashlib
import subprocess
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]
URL='https://data.mendeley.com/public-files/datasets/b6br4yk6r3/files/bc98e0d7-6c56-42dc-aa54-d689cbfe1230/file_downloaded'
SHA='a3dd4f5091e485cf4db90308babcad38831174ddafbb6ae03df4ca3d4a647906'
if __name__=='__main__':
    result=subprocess.run(['curl','--fail','--silent','--show-error','--location',URL],check=True,capture_output=True)
    assert hashlib.sha256(result.stdout).hexdigest()==SHA,'Source checksum changed; do not replace the pinned snapshot.'
    destination=ROOT/'data/raw/al_data.csv'
    destination.parent.mkdir(parents=True,exist_ok=True)
    destination.write_bytes(result.stdout)
    print('Verified publisher checksum; stored original CC BY 4.0 snapshot.')
