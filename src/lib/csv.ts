import { csvParse, csvFormat } from 'd3';
import { properties, type Measurement, type Sample, type SavedSample } from './types';
const fields = { yield: 'yield_mpa', tensile: 'tensile_mpa', elongation: 'elongation_percent' } as const;
export function parseMeasurements(text: string, samples: Sample[]): Measurement[] {
  const rows = csvParse(text.replace(/^\uFEFF/, ''));
  if (!rows.length || rows.length > 10000) throw new Error('Provide between 1 and 10,000 measurement rows.');
  for (const c of ['sample_id', 'catalogue_id']) if (!rows.columns.includes(c)) throw new Error(`Missing required column: ${c}. Download the CSV template.`);
  if (!Object.values(fields).some(c => rows.columns.includes(c))) throw new Error('Include at least one measurement column: yield_mpa, tensile_mpa or elongation_percent.');
  const catalogue = new Set(samples.map(s => s.id));
  const seen = new Set<string>();
  return rows.map((row, index) => {
    const sampleId = row.sample_id?.trim(); const catalogueId = row.catalogue_id?.trim();
    if (!sampleId || sampleId.length > 100 || seen.has(sampleId)) throw new Error(`Row ${index + 2}: sample_id must be unique and 1–100 characters.`);
    seen.add(sampleId);
    if (!catalogue.has(catalogueId)) throw new Error(`Row ${index + 2}: unknown catalogue_id ${catalogueId}.`);
    const values = Object.fromEntries(properties.map(key => {
      const raw = row[fields[key]]?.trim();
      const value = raw ? Number(raw) : null;
      if (value !== null && (!Number.isFinite(value) || value <= 0)) throw new Error(`Row ${index + 2}: ${fields[key]} must be a positive number or empty.`);
      return [key, value];
    })) as Measurement['values'];
    if (properties.every(k => values[k] === null)) throw new Error(`Row ${index + 2}: add at least one measured value.`);
    if (values.yield !== null && values.tensile !== null && values.yield > values.tensile) throw new Error(`Row ${index + 2}: yield strength exceeds tensile strength.`);
    return { sampleId, catalogueId, values };
  });
}
export function comparisonCsv(saved: SavedSample[]): string {
  return csvFormat(saved.flatMap(({ sample, prediction }) => properties.map(k => ({
    catalogue_id: sample.id, property: k, unit: k === 'elongation' ? '%' : 'MPa',
    predicted: prediction.estimates[k].value, lower_90: prediction.estimates[k].lower, upper_90: prediction.estimates[k].upper,
    measured: sample.measured[k] ?? '', support: prediction.support, dataset_split: sample.split, model_version: prediction.modelVersion,
  }))));
}
export function download(name: string, text: string, mime = 'text/plain') {
  const url = URL.createObjectURL(new Blob([text], { type: mime }));
  const link = document.createElement('a'); link.href = url; link.download = name; link.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
