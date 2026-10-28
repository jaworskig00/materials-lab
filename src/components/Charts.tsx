import { scaleLinear } from 'd3';
import { useEffect, useRef, useState } from 'react';
import { labels, properties, units, type Property, type SavedSample, type Sample, type Prediction } from '../lib/types';

const color = ['#d8bc87', '#b4c9b4', '#9db8d3', '#c7abd2'];
export function PropertyPlot({ sample, prediction, property }: { sample: Sample; prediction: Prediction; property: Property }) {
  const estimate = prediction.estimates[property];
  const measured = sample.measured[property];
  const max = Math.max(estimate.upper, measured ?? 0) * 1.13;
  const scale = scaleLinear().domain([0, max]).nice().range([12, 308]);
  return <svg className="property-plot" viewBox="0 0 320 52" role="img" aria-label={`${labels[property]}: predicted ${estimate.value.toFixed(1)}, interval ${estimate.lower.toFixed(1)} to ${estimate.upper.toFixed(1)} ${units[property]}; measured ${measured?.toFixed(1) ?? 'not recorded'}`}>
    <line x1="12" x2="308" y1="20" y2="20" stroke="#374139"/>
    <line x1={scale(estimate.lower)} x2={scale(estimate.upper)} y1="20" y2="20" stroke="#d8bc87" strokeWidth="3" opacity=".5"/>
    {[estimate.lower, estimate.upper].map((v,i)=><line key={i} x1={scale(v)} x2={scale(v)} y1="15" y2="25" stroke="#d8bc87"/>)}
    <circle cx={scale(estimate.value)} cy="20" r="4.5" fill="#d8bc87"/>
    {measured !== null && <path d={`M${scale(measured)} 2 l4 5 -4 5 -4 -5Z`} fill="#c0d1c3"/>}
    {scale.ticks(4).map(v=><g key={v}><line x1={scale(v)} x2={scale(v)} y1="30" y2="34" stroke="#5c6c61"/><text x={scale(v)} y="47" textAnchor="middle">{v}</text></g>)}
  </svg>;
}
export function ComparisonPlot({ saved, property }: { saved: SavedSample[]; property: Property }) {
  const svgRef = useRef<SVGSVGElement>(null);
  const [width, setWidth] = useState(360);
  useEffect(() => {
    const element = svgRef.current;
    if (!element) return;
    const observer = new ResizeObserver(([entry]) => setWidth(entry.contentRect.width));
    observer.observe(element);
    return () => observer.disconnect();
  }, []);
  const max = Math.max(...saved.map(s => Math.max(s.prediction.estimates[property].upper, s.sample.measured[property] ?? 0))) * 1.06;
  const scale = scaleLinear().domain([0,max]).nice().range([83,Math.max(110, width - 24)]);
  const height = 70 + saved.length*55;
  return <svg ref={svgRef} className="comparison-plot" height={height} role="img" aria-label={`${labels[property]} comparison with 90 percent prediction intervals`}>
    {scale.ticks(width < 400 ? 3 : 5).map(v=><g key={v}><line x1={scale(v)} x2={scale(v)} y1="15" y2={height-32} stroke="#344139"/><text x={scale(v)} y={height-12} textAnchor="middle">{v}</text></g>)}
    {saved.map(({sample,prediction},i)=>{
      const e=prediction.estimates[property]; const y=38+i*55;
      return <g key={sample.id}><text x="5" y={y+5} fill={color[i]}>{sample.id}</text><line x1={scale(e.lower)} x2={scale(e.upper)} y1={y} y2={y} stroke={color[i]} strokeWidth="3"/>
        {[e.lower,e.upper].map((v,j)=><line key={j} x1={scale(v)} x2={scale(v)} y1={y-6} y2={y+6} stroke={color[i]}/>)}
        <circle cx={scale(e.value)} cy={y} r="6" fill={color[i]}/>
        {sample.measured[property]!==null && <path d={`M${scale(sample.measured[property]!)} ${y-20} l4 5 -4 5 -4 -5Z`} fill="#e7eee5"/>}
      </g>;
    })}
  </svg>;
}
export function MeasurementSummary({ saved }: { saved: SavedSample[] }) {
  return <div className="comparison-charts">{properties.map(k=><section key={k} className="comparison-chart"><h3>{labels[k]} <span className="muted">{units[k]}</span></h3><ComparisonPlot saved={saved} property={k}/></section>)}</div>;
}
