import * as ort from 'onnxruntime-web/wasm';
import { checkedAsset, loadBundle } from '../lib/artifacts';
import { assemblePrediction } from '../lib/prediction';
import { properties, type Property, type WorkerRequest, type WorkerResponse } from '../lib/types';
ort.env.wasm.numThreads = 1;
ort.env.wasm.wasmPaths = new URL(`${import.meta.env.BASE_URL}runtime/`, self.location.origin).href;
ort.env.logLevel = 'error';
async function initialize() {
  const bundle = await loadBundle();
  const entries = await Promise.all(properties.map(async key => {
    const info = bundle.manifest.targets[key];
    const bytes = await checkedAsset(`${import.meta.env.BASE_URL}models/${info.file}`, info.sha256, bundle.manifest.modelVersion);
    return [key, await ort.InferenceSession.create(bytes, { executionProviders: ['wasm'] })] as const;
  }));
  return { ...bundle, sessions: Object.fromEntries(entries) as Record<Property, ort.InferenceSession> };
}
let initialized: ReturnType<typeof initialize> | undefined;
self.onmessage = async ({ data }: MessageEvent<WorkerRequest>) => {
  try {
    initialized ??= initialize();
    const { manifest, catalogue, sessions } = await initialized;
    const sample = catalogue.samples.find(s => s.id === data.sampleId);
    if (!sample || sample.features.length !== manifest.featureCount || !sample.features.every(Number.isFinite)) throw new Error('Unknown or incomplete catalogue record.');
    const tensor = new ort.Tensor('float32', Float32Array.from(sample.features), [1, manifest.featureCount]);
    const pairs = await Promise.all(properties.map(async key => {
      const t = manifest.targets[key];
      const result = await sessions[key].run({ [t.input]: tensor });
      return [key, Number(result[t.output].data[0])];
    }));
    const prediction = assemblePrediction(sample, Object.fromEntries(pairs) as Record<Property, number>, manifest);
    self.postMessage({ requestId: data.requestId, prediction } satisfies WorkerResponse);
  } catch (error) {
    initialized = undefined;
    self.postMessage({ requestId: data.requestId, error: error instanceof Error ? error.message : 'Model inference failed.' } satisfies WorkerResponse);
  }
};
