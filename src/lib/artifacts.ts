import { properties, type Bundle, type Manifest } from './types';
export async function sha256(bytes: ArrayBuffer): Promise<string> {
  return Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256', bytes)), b => b.toString(16).padStart(2, '0')).join('');
}
export function validateManifest(m: Manifest) {
  if (m.schemaVersion !== 1 || !m.modelVersion || !Array.isArray(m.features) || m.featureCount !== m.features.length || m.featureCount !== 35) throw new Error('Incompatible model manifest. Reload or contact the maintainer.');
  for (const key of properties) {
    const t = m.targets?.[key];
    if (!t || t.file !== `${key}.onnx` || !/^[a-f0-9]{64}$/.test(t.sha256) || !Number.isFinite(t.radius) || t.radius < 0) throw new Error('Invalid model manifest. Predictions are disabled.');
  }
  if (!m.assets?.['catalogue.json'] || !m.assets?.['metrics.json']) throw new Error('Missing model data checksums.');
}
export async function checkedAsset(url: string, checksum: string, cacheKey: string): Promise<ArrayBuffer> {
  let cache: Cache | undefined;
  try { cache = await caches.open(`materials-lab-${cacheKey}`); } catch { /* Cache unavailable: use network. */ }
  const cached = await cache?.match(url);
  if (cached) {
    const bytes = await cached.arrayBuffer();
    if (await sha256(bytes) === checksum) return bytes;
    await cache?.delete(url);
  }
  const response = await fetch(url);
  if (!response.ok) throw new Error(`Could not load research assets (${response.status}). Check your connection and retry.`);
  const bytes = await response.arrayBuffer();
  if (await sha256(bytes) !== checksum) throw new Error('Asset checksum mismatch. Reload to get a consistent model release.');
  try { await cache?.put(url, new Response(bytes)); } catch { /* Storage quota must not prevent inference. */ }
  return bytes;
}
export async function loadBundle(): Promise<Bundle> {
  const base = `${import.meta.env.BASE_URL}models/`;
  const response = await fetch(`${base}manifest.json`, { cache: 'no-cache' });
  if (!response.ok) throw new Error('The model manifest is unavailable. Check your connection and retry.');
  const manifest = await response.json() as Manifest;
  validateManifest(manifest);
  const [catalogue, metrics] = await Promise.all(['catalogue.json', 'metrics.json'].map(async name => {
    const bytes = await checkedAsset(`${base}${name}`, manifest.assets[name], manifest.modelVersion);
    return JSON.parse(new TextDecoder().decode(bytes));
  }));
  if (metrics.version !== manifest.modelVersion || !Array.isArray(catalogue.samples)) throw new Error('The model and catalogue versions do not match.');
  return { manifest, catalogue, metrics };
}
