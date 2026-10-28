import type { Prediction, WorkerResponse } from './types';
let worker: Worker | undefined;
let nextId = 0;
const pending = new Map<number, { resolve: (p: Prediction) => void; reject: (e: Error) => void; timer: ReturnType<typeof setTimeout> }>();
export function predict(sampleId: string): Promise<Prediction> {
  if (!worker) {
    worker = new Worker(new URL('../workers/inference.ts', import.meta.url), { type: 'module' });
    worker.onmessage = ({ data }: MessageEvent<WorkerResponse>) => {
      const request = pending.get(data.requestId);
      if (!request) return;
      clearTimeout(request.timer); pending.delete(data.requestId);
      if ('error' in data) request.reject(new Error(data.error)); else request.resolve(data.prediction);
    };
    worker.onerror = () => { for (const p of pending.values()) { clearTimeout(p.timer); p.reject(new Error('The prediction worker stopped. Retry the prediction.')); } pending.clear(); worker?.terminate(); worker = undefined; };
  }
  return new Promise((resolve, reject) => {
    const requestId = ++nextId;
    const timer = setTimeout(() => { pending.delete(requestId); reject(new Error('Model loading timed out. Check your connection and retry.')); }, 60000);
    pending.set(requestId, { resolve, reject, timer });
    worker!.postMessage({ requestId, sampleId });
  });
}
