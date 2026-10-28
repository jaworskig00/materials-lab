export const properties = ['yield', 'tensile', 'elongation'] as const;
export type Property = typeof properties[number];
export const labels: Record<Property, string> = { yield: 'Yield strength', tensile: 'Tensile strength', elongation: 'Elongation' };
export const units: Record<Property, string> = { yield: 'MPa', tensile: 'MPa', elongation: '%' };
export type Values = Record<Property, number | null>;
export type Support = 'supported' | 'limited' | 'unsupported';
export interface Sample {
  id: string; label: string; processing: string; sourceProcessing: string;
  sourceRow: number; group: string; split: 'train' | 'calibration' | 'test';
  features: number[]; composition: Record<string, number>; measured: Values;
  support: Support; distance: number; processingTrainN: number;
}
export interface Audit {
  sourceRows: number; acceptedRows: number; compositionGroups: number; sourceSha256: string;
  excluded: { sourceRow: number; reason: string }[]; missingTargets: Record<Property, number>;
  splits: Record<string, { rows: number; groups: number }>; grouping: string; testPolicy: string;
}
export interface Catalogue { samples: Sample[]; source: { title: string; authors: string; url: string; doi: string; license: string }; audit: Audit }
export interface TargetManifest { file: string; sha256: string; bytes: number; input: string; output: string; radius: number; unit: string }
export interface Manifest { schemaVersion: number; modelVersion: string; featureCount: number; ready: boolean; features: string[]; nominalCoverage: number; targets: Record<Property, TargetManifest>; assets: Record<string, string>; calibrationMethod: string; sourceSha256: string }
export interface TargetMetrics { label: string; unit: string; selectedModel: string; mae: number; rmse: number; r2: number; baselineMae: number; improvement: number; coverage: number; intervalWidth: number; trainN: number; calibrationN: number; testN: number; ready: boolean; byProcessing: Record<string, { n: number; mae: number; coverage: number }> }
export interface Metrics { version: string; ready: boolean; targets: Record<Property, TargetMetrics>; audit: Audit }
export interface Estimate { value: number; lower: number; upper: number }
export interface Prediction { sampleId: string; modelVersion: string; support: Support; estimates: Record<Property, Estimate>; valid: boolean; reason?: string }
export interface Measurement { sampleId: string; catalogueId: string; values: Values }
export interface SavedSample { sample: Sample; prediction: Prediction; savedAt: string }
export interface Bundle { manifest: Manifest; catalogue: Catalogue; metrics: Metrics }
export interface WorkerRequest { requestId: number; sampleId: string }
export type WorkerResponse = { requestId: number; prediction: Prediction } | { requestId: number; error: string };
