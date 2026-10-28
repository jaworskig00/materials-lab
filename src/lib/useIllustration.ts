import { useCallback, useEffect, useRef, useState } from 'react';

/** Playback time is illustrative; it is not material strain or test duration. */
export function useIllustration() {
  const [stage, setStage] = useState(0);
  const [running, setRunning] = useState(false);
  const [speed, setSpeed] = useState(1);
  const [reducedMotion, setReducedMotion] = useState(() => window.matchMedia('(prefers-reduced-motion: reduce)').matches);
  const progress = useRef(0);
  const container = useRef<HTMLElement>(null);
  const seek = useCallback((value: number) => {
    setRunning(false);
    progress.current = value;
    setStage(value);
  }, []);
  useEffect(() => {
    const media = window.matchMedia('(prefers-reduced-motion: reduce)');
    const preference = () => { setReducedMotion(media.matches); if (media.matches) setRunning(false); };
    const visibility = () => { if (document.hidden) setRunning(false); };
    const observer = new IntersectionObserver(([entry]) => { if (!entry.isIntersecting) setRunning(false); });
    if (container.current) observer.observe(container.current);
    media.addEventListener('change', preference);
    document.addEventListener('visibilitychange', visibility);
    return () => { media.removeEventListener('change', preference); document.removeEventListener('visibilitychange', visibility); observer.disconnect(); };
  }, []);
  useEffect(() => {
    if (!running || reducedMotion) return;
    let frame: number;
    let last: number | undefined;
    const tick = (now: number) => {
      if (last === undefined) last = now;
      if (now - last >= 32) {
        progress.current = Math.min(1, progress.current + Math.min(now - last, 100) * speed / 12000);
        last = now;
        setStage(progress.current);
        if (progress.current >= 1) { setRunning(false); return; }
      }
      frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [running, speed, reducedMotion]);
  const toggle = () => {
    if (reducedMotion) return;
    if (progress.current >= 1) { progress.current = 0; setStage(0); }
    setRunning(v => !v);
  };
  return { stage, running, speed, setSpeed, reducedMotion, seek, toggle, container };
}
