import { create } from 'zustand';
import { loadBundle } from './artifacts';
import { predict } from './client';
import { readLocal, writeLocal } from './storage';
import type { Bundle, Measurement, Prediction, SavedSample } from './types';
export type Tab = 'laboratory' | 'compare' | 'measurements' | 'evidence';
interface State {
  bundle?: Bundle; selectedId: string; prediction?: Prediction; loading: boolean; error?: string;
  bootError?: string; tab: Tab; saved: SavedSample[]; measurements: Measurement[]; notice?: string; storageError?: string;
  select: (id: string) => Promise<void>; save: () => void; remove: (id: string) => void;
  setTab: (tab: Tab) => void; importMeasurements: (rows: Measurement[]) => void; clearMeasurements: () => void;
}
let active = 0;
export const useLab = create<State>((set, get) => ({
  selectedId: '', loading: false, tab: 'laboratory', saved: [], measurements: [],
  setTab: tab => { set({ tab }); window.location.hash = tab; },
  select: async selectedId => {
    const request = ++active;
    set({ selectedId, loading: true, prediction: undefined, error: undefined, notice: undefined });
    try { const prediction = await predict(selectedId); if (request === active) set({ prediction, loading: false }); }
    catch (error) { if (request === active) set({ loading: false, error: error instanceof Error ? error.message : 'Prediction failed.' }); }
  },
  save: () => {
    const { bundle, prediction, selectedId, saved } = get();
    if (!prediction?.valid || !bundle) return;
    if (saved.some(s => s.sample.id === selectedId)) { set({ notice: 'This record is already in your comparison.' }); return; }
    if (saved.length >= 4) { set({ notice: 'Comparison is full. Remove a record to add another.' }); return; }
    const sample = bundle.catalogue.samples.find(s => s.id === selectedId)!;
    set({ saved: [...saved, { sample, prediction, savedAt: new Date().toISOString() }], notice: `${selectedId} added to comparison.` }); persist();
  },
  remove: id => { set({ saved: get().saved.filter(s => s.sample.id !== id) }); persist(); },
  importMeasurements: measurements => { set({ measurements, notice: `${measurements.length} measurements imported on this device.` }); persist(); },
  clearMeasurements: () => { set({ measurements: [], notice: 'Local measurements cleared.' }); persist(); },
}));
function persist() {
  const { saved, measurements } = useLab.getState();
  void writeLocal({ saved, measurements }).catch(() => useLab.setState({ storageError: 'Browser storage is unavailable. Export your work before closing this tab.' }));
}
export async function boot() {
  useLab.setState({ bootError: undefined });
  try {
    const bundle = await loadBundle();
    useLab.setState({ bundle });
    try {
      const local = await readLocal();
      if (local && Array.isArray(local.saved) && Array.isArray(local.measurements)) {
        const known = new Set(bundle.catalogue.samples.map(s => s.id));
        useLab.setState({ saved: local.saved.filter(s => known.has(s.sample?.id) && s.prediction?.modelVersion === bundle.manifest.modelVersion).slice(0, 4), measurements: local.measurements.filter(m => known.has(m.catalogueId)) });
      }
    } catch { useLab.setState({ storageError: 'Local storage is unavailable. Export your work before closing this tab.' }); }
    const hash = window.location.hash.slice(1);
    if (['laboratory', 'compare', 'measurements', 'evidence'].includes(hash)) useLab.setState({ tab: hash as Tab });
    const sample = bundle.catalogue.samples.find(s => s.split === 'test' && s.support === 'supported') ?? bundle.catalogue.samples[0];
    await useLab.getState().select(sample.id);
  } catch (error) { useLab.setState({ bootError: error instanceof Error ? error.message : 'Could not load the research data.' }); }
}
