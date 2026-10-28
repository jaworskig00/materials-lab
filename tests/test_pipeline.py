import json
import numpy as np
from scripts.train import ROOT, TARGETS, prepare, conformal_radius
from scripts.verify_model import verify

def test_partition_and_units():
    df,elements,categories,X,audit=prepare()
    assert len(elements)==25 and len(categories)==10 and X.shape[1]==35
    assert np.allclose(X[:,:25].sum(axis=1),1,atol=1e-4)
    assert df.groupby('group')['split'].nunique().max()==1
    recorded=json.loads((ROOT/'data/splits.json').read_text())
    assert recorded==df.rename(columns={'sampleId':'id'})[['id','group','split']].to_dict('records')
    assert len(df)+len(audit['excluded'])==audit['sourceRows']

def test_independent_group_calibration():
    residuals=np.array([1.,10.,2.,3.,4.,5.,6.,7.,8.,9.])
    radius,n=conformal_radius(residuals,np.array(['a','a','b','c','d','e','f','g','h','i']))
    assert n==9 and radius==10

def test_recompute_frozen_metrics():
    df,*_=prepare()
    reference={r['id']:r['expected'] for r in json.loads((ROOT/'tests/model-reference.json').read_text())}
    metrics=json.loads((ROOT/'public/models/metrics.json').read_text())
    manifest=json.loads((ROOT/'public/models/manifest.json').read_text())
    for key,(column,_,_) in TARGETS.items():
        test=df[(df['split']=='test')&df[column].notna()]
        error=np.abs(np.array([reference[r][key] for r in test['sampleId']])-test[column].to_numpy())
        assert abs(float(error.mean())-metrics['targets'][key]['mae'])<.02
        assert abs(float((error<=manifest['targets'][key]['radius']).mean())-metrics['targets'][key]['coverage'])<1e-6

def test_export_and_release_gates():
    verify()
