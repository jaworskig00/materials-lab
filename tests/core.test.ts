import { describe, expect, it } from 'vitest';
import { parseMeasurements, comparisonCsv } from '../src/lib/csv';
import { assemblePrediction } from '../src/lib/prediction';
import { validateManifest } from '../src/lib/artifacts';
import catalogueData from '../public/models/catalogue.json';
import manifestData from '../public/models/manifest.json';
import type { Catalogue, Manifest } from '../src/lib/types';
const catalogue = catalogueData as unknown as Catalogue; const manifest = manifestData as Manifest;
const sample = catalogue.samples.find(s => s.support === 'supported')!;

describe('measurement contract', () => {
  it('preserves missing values, quoted identifiers and decimal measurements', () => {
    const rows = parseMeasurements(`sample_id,catalogue_id,yield_mpa,tensile_mpa,elongation_percent\n"Sample, 1",${sample.id},123.5,,12.3`,catalogue.samples);
    expect(rows[0]).toMatchObject({sampleId:'Sample, 1', values:{yield:123.5,tensile:null,elongation:12.3}});
  });
  it.each([
    ['x,catalogue_id,yield_mpa\na,AL-0001,1','sample_id'],
    ['sample_id,catalogue_id,yield_mpa\nx,UNKNOWN,1','unknown catalogue'],
    [`sample_id,catalogue_id,yield_mpa\nx,${sample.id},NaN`,'positive number'],
    [`sample_id,catalogue_id,yield_mpa\nx,${sample.id},-1`,'positive number'],
    [`sample_id,catalogue_id,yield_mpa\nx,${sample.id},`,'at least one'],
    [`sample_id,catalogue_id,yield_mpa,tensile_mpa\nx,${sample.id},200,100`,'yield strength exceeds'],
    [`sample_id,catalogue_id,yield_mpa\nx,${sample.id},2\nx,${sample.id},3`,'unique'],
  ])('rejects invalid CSV: %s',(text,reason)=>expect(()=>parseMeasurements(text,catalogue.samples)).toThrow(reason));
});
describe('prediction integrity',()=>{
  it('does not display inconsistent or unsupported predictions',()=>{
    expect(assemblePrediction(sample,{yield:300,tensile:200,elongation:10},manifest).valid).toBe(false);
    expect(assemblePrediction({...sample,support:'unsupported'},{yield:100,tensile:200,elongation:10},manifest).valid).toBe(false);
    expect(assemblePrediction(sample,{yield:NaN,tensile:200,elongation:10},manifest).valid).toBe(false);
  });
  it('keeps calibrated intervals and versions with exported results',()=>{
    const prediction=assemblePrediction(sample,{yield:150,tensile:200,elongation:10},manifest);
    expect(prediction.estimates.tensile.upper).toBe(200+manifest.targets.tensile.radius);
    expect(prediction.estimates.elongation.lower).toBeGreaterThanOrEqual(0);
    const csv=comparisonCsv([{sample,prediction,savedAt:'2026-10-28T00:00:00Z'}]);
    expect(csv).toContain('lower_90');expect(csv).toContain(manifest.modelVersion);expect(csv).toContain(sample.id);
  });
  it('rejects mismatched feature contracts and unsafe model paths',()=>{
    expect(()=>validateManifest({...manifest,featureCount:1})).toThrow('Incompatible');
    expect(()=>validateManifest({...manifest,targets:{...manifest.targets,yield:{...manifest.targets.yield,file:'https://elsewhere/model.onnx'}}})).toThrow('Invalid');
  });
});
