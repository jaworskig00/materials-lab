import type { Measurement, SavedSample } from './types';
export interface LocalData { saved: SavedSample[]; measurements: Measurement[] }
const open = () => new Promise<IDBDatabase>((resolve, reject) => {
  const request = indexedDB.open('materials-lab', 1);
  request.onupgradeneeded = () => request.result.createObjectStore('workspace');
  request.onsuccess = () => resolve(request.result); request.onerror = () => reject(request.error);
});
export async function readLocal(): Promise<LocalData | undefined> {
  const db = await open();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('workspace', 'readonly'); const req = tx.objectStore('workspace').get('data');
    req.onsuccess = () => resolve(req.result); req.onerror = () => reject(req.error); tx.oncomplete = () => db.close();
  });
}
export async function writeLocal(data: LocalData) {
  const db = await open();
  return new Promise<void>((resolve, reject) => {
    const tx = db.transaction('workspace', 'readwrite'); tx.objectStore('workspace').put(data, 'data');
    tx.oncomplete = () => { db.close(); resolve(); }; tx.onerror = () => { db.close(); reject(tx.error); };
  });
}
