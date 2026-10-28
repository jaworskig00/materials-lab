import { properties, type Manifest, type Prediction, type Property, type Sample } from './types';
export function assemblePrediction(sample: Sample, values: Record<Property, number>, manifest: Manifest): Prediction {
  const estimates = Object.fromEntries(properties.map(key => [key, { value: values[key], lower: Math.max(0, values[key] - manifest.targets[key].radius), upper: values[key] + manifest.targets[key].radius }])) as Prediction['estimates'];
  const invalid = properties.some(k => !Number.isFinite(values[k]) || values[k] <= 0) || values.yield > values.tensile;
  const reason = sample.support === 'unsupported' ? 'This record is outside the supported training region.' : invalid ? 'The model returned physically inconsistent properties.' : undefined;
  return { sampleId: sample.id, modelVersion: manifest.modelVersion, support: sample.support, estimates, valid: !reason, reason };
}
