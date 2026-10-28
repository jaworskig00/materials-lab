import { lazy, Suspense, useEffect, useMemo, useRef, useState } from 'react';
import { ArrowDownToLine, ArrowRight, ArrowUpRight, Check, CircleHelp, Database, FileUp, FlaskConical, GitCompareArrows, LoaderCircle, Plus, Search, ShieldCheck, Trash2, X, AlertCircle, RotateCcw } from 'lucide-react';
import { boot, useLab, type Tab } from './lib/store';
import { labels, properties, units, type Measurement, type Prediction, type Sample } from './lib/types';
import { comparisonCsv, download, parseMeasurements } from './lib/csv';
import { predict } from './lib/client';
import { MeasurementSummary, PropertyPlot } from './components/Charts';
const Specimen = lazy(() => import('./components/Specimen').then(m => ({ default: m.Specimen })));
const format = (n: number | null | undefined, digits=1) => n == null ? 'Not recorded' : n.toLocaleString('en-US', { maximumFractionDigits: digits, minimumFractionDigits: digits });
const pct = (n: number) => `${(n*100).toFixed(1)}%`;

function Catalogue({ sample }: { sample: Sample }) {
  const bundle = useLab(s=>s.bundle)!; const select=useLab(s=>s.select);
  const listRef=useRef<HTMLUListElement>(null); const selectedRef=useRef<HTMLButtonElement>(null);
  useEffect(()=>{if(listRef.current&&selectedRef.current)listRef.current.scrollTop=Math.max(0,selectedRef.current.offsetTop-listRef.current.clientHeight/2+selectedRef.current.offsetHeight/2);},[sample.id]);
  const [query,setQuery]=useState(''); const [processing,setProcessing]=useState('all'); const [limit,setLimit]=useState(30);
  const samples=bundle.catalogue.samples;
  const filtered = useMemo(()=>samples.filter(s=>(processing==='all'||s.processing===processing) && `${s.id} ${s.label} ${s.processing}`.toLowerCase().includes(query.toLowerCase())),[samples,query,processing]);
  return <aside className="catalogue-panel" aria-label="Material catalogue">
    <div className="panel-title"><h2>Material library</h2><span className="count">{samples.length}</span></div>
    <p className="small muted">Documented aluminium specimens</p>
    <label className="search-field"><Search size={16}/><input aria-label="Search materials" placeholder="Find a record or composition" value={query} onChange={e=>{setQuery(e.target.value);setLimit(30);}}/></label>
    <label className="field-label" htmlFor="processing">Material state</label>
    <select id="processing" value={processing} onChange={e=>{setProcessing(e.target.value);setLimit(30);}}><option value="all">All documented states</option>{Array.from(new Set(samples.map(s=>s.processing))).sort().map(s=><option key={s}>{s}</option>)}</select>
    <div className="catalogue-count"><span>{filtered.length} matching records</span><span>Source ID</span></div>
    <ul ref={listRef} className="catalogue-list" aria-label="Catalogue records">
      {filtered.slice(0,limit).map(s=><li key={s.id}><button ref={s.id===sample.id?selectedRef:undefined} className={`sample-option ${s.id===sample.id?'selected':''}`} onClick={()=>void select(s.id)} aria-pressed={s.id===sample.id} aria-label={`Select ${s.id}, ${s.label}`}><span className="sample-top"><strong>{s.label}</strong><span className="mono">{s.id}</span></span><span className="sample-state">{s.processing}</span><span className="sample-bottom"><span className={`support-dot ${s.support}`}/>{s.split==='test'?'Held-out test record':s.split==='calibration'?'Calibration record':'Training record'}{s.id===sample.id&&<Check size={13}/>}</span></button></li>)}
      {!filtered.length&&<li className="empty-small">No matching records. Try a source ID such as AL-0001.</li>}
      {filtered.length>limit&&<li><button className="button subtle full small" onClick={()=>setLimit(l=>l+30)}>Show 30 more</button></li>}
    </ul>
    <div className="library-foot"><Database size={15}/><span>Public measurements<br/><a href={bundle.catalogue.source.url} target="_blank" rel="noreferrer">Bhat et al. · 2023 <ArrowUpRight size={11}/></a></span></div>
  </aside>;
}

function PredictionPanel({ sample }: { sample: Sample }) {
  const { prediction,loading,error,select,saved,save }=useLab();
  const exists=saved.some(s=>s.sample.id===sample.id);
  return <section className="results-panel" aria-label="Surrogate predictions">
    <div className="panel-title"><h2>Predicted properties</h2><span className="tiny-label">90% PI</span></div>
    <p className="small muted">Estimates with calibrated prediction intervals</p>
    {loading?<div className="prediction-loading" role="status"><LoaderCircle className="spin" size={22}/><h3>Evaluating specimen</h3><p>Loading verified model assets on this device.</p></div>:
      error?<div className="error-box" role="alert"><AlertCircle size={19}/><p>{error}</p><button className="button subtle small" onClick={()=>void select(sample.id)}><RotateCcw size={14}/>Retry prediction</button></div>:
      prediction&&!prediction.valid?<div className="error-box" role="status"><AlertCircle size={19}/><h3>Prediction unavailable</h3><p>{prediction.reason}</p><p>Choose a record with support in the training data.</p></div>:
      prediction&&<>
        <div className="prediction-values" data-testid="prediction-ready">{properties.map(k=><section className="property-row" key={k}><div className="property-name"><h3>{labels[k]}</h3><span>{units[k]}</span></div><div className="property-value">{format(prediction.estimates[k].value)}<span>{format(prediction.estimates[k].lower)}–{format(prediction.estimates[k].upper)}</span></div><PropertyPlot sample={sample} prediction={prediction} property={k}/><div className="measured-line"><span className="diamond"/>Recorded measurement <strong>{format(sample.measured[k])}{sample.measured[k]!==null&&` ${units[k]}`}</strong></div></section>)}</div>
        <div className={`trust-note ${prediction.support==='limited'?'limited':''}`}><ShieldCheck size={16}/><div><strong>{prediction.support==='limited'?'Limited data support':'Within the supported region'}</strong><p>{sample.processingTrainN} training records share this material state. {sample.split==='train'?'This record was used for training; it is not validation evidence.':sample.split==='test'?'This composition was held out of training and calibration.':'This composition was used only for uncertainty calibration.'}</p></div></div>
      </>}
    <button className="button primary full compare-add" disabled={loading||!prediction?.valid||exists||saved.length>=4} onClick={save}>{exists?<Check size={16}/>:<Plus size={16}/>} {exists?'Added to comparison':saved.length>=4?'Comparison full (4/4)':'Add to comparison'}</button>
    <div className="chart-legend"><span><i className="legend-dot"/> Prediction</span><span><i className="diamond"/> Measurement</span></div>
  </section>;
}

function Laboratory() {
  const {bundle,selectedId,setTab}=useLab();
  const sample=bundle!.catalogue.samples.find(s=>s.id===selectedId);
  if(!sample)return <div className="loading-page" role="status">Preparing the material library…</div>;
  const composition=Object.entries(sample.composition).sort((a,b)=>b[1]-a[1]);
  return <>
    <div className="page-intro"><div><h1>Explore the material.</h1><p>Measured evidence. Modelled properties. A clearer view of uncertainty.</p></div><button className="text-button" onClick={()=>setTab('evidence')}><CircleHelp size={16}/>How to read this lab <ArrowRight size={14}/></button></div>
    <div className="lab-layout">
      <Catalogue sample={sample}/>
      <div className="specimen-column">
        <Suspense fallback={<div className="scene-fallback" role="status">Loading specimen viewer…</div>}><Specimen sampleId={sample.id}/></Suspense>
        <section className="sample-detail"><div className="detail-heading"><div><h2>{sample.label} <span className="muted">/</span> <span className="mono">{sample.id}</span></h2><p>{sample.processing}</p></div><span className="tag">{sample.split==='test'?'Held-out test':sample.split==='train'?'Training':'Calibration'}</span></div>
          <div className="composition-heading"><h3>Documented composition</h3><span>Mass %</span></div>
          <div className="composition-strip" aria-label="Recorded composition">{composition.slice(0,6).map(([e,v])=><div key={e}><strong>{e}</strong><span>{format(v,v>=10?2:3)}</span></div>)}</div>
          {composition.length>6&&<details className="trace-elements"><summary>Show {composition.length-6} trace elements</summary><p>{composition.slice(6).map(([e,v])=>`${e} ${v}%`).join(' · ')}</p></details>}
          <p className="provenance-line">Source record {sample.sourceRow} · Composition group <span className="mono">{sample.group.slice(0,8)}</span><br/>The display label summarises the composition; it is not a certified alloy designation.</p>
        </section>
      </div>
      <PredictionPanel sample={sample}/>
    </div>
    <div className="research-note"><ShieldCheck size={16}/><p>Research estimates, with limits made visible. Composition and recorded processing do not describe every microstructural or test condition. <button onClick={()=>setTab('evidence')}>Read model limitations <ArrowRight size={12}/></button></p></div>
  </>;
}

function Compare() {
  const {saved,remove,setTab}=useLab();
  return <>
    <div className="page-intro"><div><h1>Compare the evidence.</h1><p>Up to four specimens, on the same scales. Intervals show model uncertainty.</p></div>{saved.length>0&&<div className="button-group"><button className="button subtle" onClick={()=>download('materials-comparison.csv',comparisonCsv(saved),'text/csv')}><ArrowDownToLine size={15}/>CSV</button><button className="button subtle" onClick={()=>download('materials-comparison.json',JSON.stringify(saved,null,2),'application/json')}>JSON</button></div>}</div>
    {!saved.length?<div className="empty-state"><GitCompareArrows size={38}/><h2>A comparison starts with a specimen.</h2><p>Add records from the laboratory to compare predictions, measurements and their intervals.</p><button className="button primary" onClick={()=>setTab('laboratory')}>Explore materials <ArrowRight size={16}/></button></div>:<>
      <div className="saved-strip">{saved.map(({sample,prediction})=><article key={sample.id}><div><span className="mono">{sample.id}</span><button className="icon-button" onClick={()=>remove(sample.id)} aria-label={`Remove ${sample.id}`}><X size={15}/></button></div><h2>{sample.label}</h2><p>{sample.processing}</p><span className="small muted">Model {prediction.modelVersion} · {sample.split}</span></article>)}</div>
      <div className="chart-legend"><span><i className="legend-dot"/> Predicted value and 90% interval</span><span><i className="diamond"/> Recorded measurement</span></div>
      <MeasurementSummary saved={saved}/>
      <div className="table-wrap"><table><caption>Exact comparison values</caption><thead><tr><th>Record</th><th>Property</th><th>Prediction</th><th>90% interval</th><th>Measurement</th></tr></thead><tbody>{saved.flatMap(({sample,prediction})=>properties.map(k=><tr key={`${sample.id}-${k}`}><th>{sample.id}</th><td>{labels[k]}</td><td>{format(prediction.estimates[k].value)} {units[k]}</td><td>{format(prediction.estimates[k].lower)}–{format(prediction.estimates[k].upper)}</td><td>{format(sample.measured[k])}</td></tr>))}</tbody></table></div>
    </>}
  </>;
}

function MeasurementTable({rows}:{rows:Measurement[]}) {
  const [page,setPage]=useState(0); const [results,setResults]=useState<Record<string,Prediction>>({}); const [error,setError]=useState('');
  const visible=useMemo(()=>rows.slice(page*25,(page+1)*25),[rows,page]);
  useEffect(()=>{let cancelled=false; Promise.all([...new Set(visible.map(m=>m.catalogueId))].map(async id=>[id,await predict(id)] as const)).then(pairs=>{if(!cancelled)setResults(Object.fromEntries(pairs));}).catch(e=>{if(!cancelled)setError(String(e));});return()=>{cancelled=true;};},[visible]);
  return <>{error&&<p className="error-box" role="alert">{error}</p>}<div className="table-wrap"><table><caption>Local measurements · Δ is measured minus predicted</caption><thead><tr><th>Your sample</th><th>Catalogue</th>{properties.map(k=><th key={k}>{labels[k]} ({units[k]})</th>)}</tr></thead><tbody>{visible.map(m=><tr key={m.sampleId}><th>{m.sampleId}</th><td className="mono">{m.catalogueId}</td>{properties.map(k=>{const r=results[m.catalogueId]; const delta=m.values[k]!==null&&r?.valid?m.values[k]!-r.estimates[k].value:null;return <td key={k}>{format(m.values[k])}<small className="table-sub">{!r?'Evaluating…':!r.valid?'Prediction unavailable':delta===null?'—':`Δ ${delta>=0?'+':''}${format(delta)}`}</small></td>;})}</tr>)}</tbody></table></div><div className="pagination"><span>{page*25+1}–{Math.min((page+1)*25,rows.length)} of {rows.length}</span><button className="button subtle small" disabled={page===0} onClick={()=>setPage(p=>p-1)}>Previous</button><button className="button subtle small" disabled={(page+1)*25>=rows.length} onClick={()=>setPage(p=>p+1)}>Next</button></div></>;
}
function Measurements() {
  const {bundle,selectedId,measurements,importMeasurements,clearMeasurements}=useLab(); const input=useRef<HTMLInputElement>(null); const [error,setError]=useState('');
  async function upload(file?:File) {
    if(!file)return; setError('');
    try { if(file.size>2*1024*1024)throw new Error('The file is too large. Use a CSV smaller than 2 MB.'); importMeasurements(parseMeasurements(await file.text(),bundle!.catalogue.samples)); }
    catch(e){setError(e instanceof Error?e.message:'Could not read this file.');}
    if(input.current)input.current.value='';
  }
  function template() {
    const sample=bundle!.catalogue.samples.find(s=>s.id===selectedId)!;
    download('materials-measurement-template.csv',`sample_id,catalogue_id,yield_mpa,tensile_mpa,elongation_percent\nmy-specimen-01,${sample.id},${sample.measured.yield??''},${sample.measured.tensile??''},${sample.measured.elongation??''}\n`,'text/csv');
  }
  return <>
    <div className="page-intro"><div><h1>Bring your measurements.</h1><p>Compare laboratory results with the same catalogue-constrained model.</p></div><button className="button subtle" onClick={template}><ArrowDownToLine size={15}/>CSV template</button></div>
    <div className="import-layout"><div className="import-zone" onDragOver={e=>e.preventDefault()} onDrop={e=>{e.preventDefault();void upload(e.dataTransfer.files[0]);}}><FileUp size={32}/><h2>Drop a measurement CSV</h2><p>Up to 10,000 rows · 2 MB maximum</p><button className="button primary" onClick={()=>input.current?.click()}>Choose a CSV file <Plus size={16}/></button><input ref={input} type="file" accept=".csv,text/csv" aria-label="Import measurement CSV" onChange={e=>void upload(e.target.files?.[0])} hidden/></div><div className="import-guidance"><h2>Your data stays here.</h2><p>Files are processed and saved in this browser. They are never uploaded or added to the training dataset.</p><p>Use a catalogue ID and at least one measured property. Leave unmeasured values blank.</p><p className="small muted">The template contains the selected record’s published measurements as an example. Replace them with your own observations. A new import replaces the local measurement list.</p><div className="tag"><ShieldCheck size={13}/>On-device processing</div></div></div>
    {error&&<p className="error-box" role="alert">{error}</p>}
    {measurements.length>0&&<><div className="section-title"><h2>{measurements.length} local measurements</h2><button className="text-button" onClick={clearMeasurements}><Trash2 size={14}/>Clear local measurements</button></div><MeasurementTable key={measurements.map(m=>m.sampleId).join('|')} rows={measurements}/></>}
  </>;
}

function Evidence() {
  const {bundle}=useLab(); const {catalogue,manifest,metrics}=bundle!;
  return <>
    <div className="page-intro"><div><h1>Know what the model knows.</h1><p>A traceable dataset, a frozen test set and an explicit account of uncertainty.</p></div><span className="tag"><ShieldCheck size={14}/>{metrics.ready?'Internal release gates passed':'Release gates not passed'}</span></div>
    <div className="evidence-layout"><section className="evidence-main"><h2>Held-out performance</h2><p>All compositions in the test set were excluded from fitting, model selection and interval calibration. These are internal dataset results, not independent laboratory validation.</p>
      <div className="table-wrap"><table><caption>Frozen test results · model {manifest.modelVersion}</caption><thead><tr><th>Property</th><th>MAE</th><th>Median baseline</th><th>R²</th><th>PI coverage</th><th>Test n</th></tr></thead><tbody>{properties.map(k=>{const m=metrics.targets[k];return <tr key={k}><th>{labels[k]}</th><td>{format(m.mae)} {units[k]}</td><td>{format(m.baselineMae)} {units[k]}</td><td>{format(m.r2,3)}</td><td>{pct(m.coverage)}</td><td>{m.testN}</td></tr>;})}</tbody></table></div>
      <div className="method-note"><h3>What a 90% interval means here</h3><p>Intervals are calibrated using the largest error within each calibration composition group. This protects against treating related records as independent observations and can produce wide, conservative intervals. Coverage is measured on the held-out test set, not guaranteed for a new laboratory or an underrepresented material.</p></div>
      {properties.map(k=><details className="metric-details" key={k}><summary>{labels[k]} — state-level errors and coverage</summary><p className="small">Selected model: {metrics.targets[k].selectedModel} · RMSE {format(metrics.targets[k].rmse)} {units[k]} · Unclipped interval width {format(metrics.targets[k].intervalWidth)} {units[k]}</p><div className="table-wrap"><table><thead><tr><th>Material state</th><th>n</th><th>MAE</th><th>Coverage</th></tr></thead><tbody>{Object.entries(metrics.targets[k].byProcessing).map(([s,m])=><tr key={s}><th>{s}</th><td>{m.n}</td><td>{format(m.mae)}</td><td>{pct(m.coverage)}</td></tr>)}</tbody></table></div></details>)}
      <section className="limitations"><h2>Boundaries of the evidence</h2><ul><li>Only the documented aluminium catalogue and processing categories are supported.</li><li>Composition and processing labels do not capture grain structure, defects, orientation or all test conditions.</li><li>The model predicts three scalar properties. It does not reconstruct a stress–strain curve, fracture process or finite-element simulation.</li><li>The model has no independent laboratory validation. Training-record predictions are not validation evidence.</li><li>Release gates are project checks: at least 10% lower MAE than the median baseline and at least 85% observed coverage for nominal 90% intervals.</li></ul></section>
    </section><aside className="evidence-aside"><h2>The source record</h2><a className="source-title" href={catalogue.source.url} target="_blank" rel="noreferrer">{catalogue.source.title}<ArrowUpRight size={17}/></a><p>{catalogue.source.authors}<br/>Mendeley Data · Version 1 · 2023</p><dl><div><dt>Original records</dt><dd>{catalogue.audit.sourceRows}</dd></div><div><dt>Accepted records</dt><dd>{catalogue.audit.acceptedRows}</dd></div><div><dt>Composition groups</dt><dd>{catalogue.audit.compositionGroups}</dd></div><div><dt>Excluded records</dt><dd>{catalogue.audit.excluded.length}</dd></div><div><dt>Data license</dt><dd>CC BY 4.0</dd></div></dl><p className="small">DOI: {catalogue.source.doi}</p><h3>Split by composition</h3><dl>{Object.entries(catalogue.audit.splits).map(([key,v])=><div key={key}><dt>{key}</dt><dd>{v.rows} rows / {v.groups} groups</dd></div>)}</dl><button className="button subtle full small" onClick={()=>download('materials-data-audit.json',JSON.stringify(catalogue.audit,null,2),'application/json')}><ArrowDownToLine size={14}/>Download data audit</button><button className="button subtle full small" onClick={()=>download('materials-model-metrics.json',JSON.stringify(metrics,null,2),'application/json')}><ArrowDownToLine size={14}/>Download model metrics</button><h3>Reproducible assets</h3><p className="small">Versioned ONNX models, input schema and checksums travel together. Inference happens in your browser.</p><a className="text-button" href={`${import.meta.env.BASE_URL}models/manifest.json`} target="_blank" rel="noreferrer">Model manifest <ArrowUpRight size={14}/></a></aside></div>
  </>;
}

const tabs:{id:Tab;label:string}[]=[{id:'laboratory',label:'Laboratory'},{id:'compare',label:'Compare'},{id:'measurements',label:'Measurements'},{id:'evidence',label:'Data & model'}];
export function App() {
  const {bundle,tab,setTab,saved,notice,storageError,bootError}=useLab();
  useEffect(()=>{const listener=()=>{const t=window.location.hash.slice(1); if(tabs.some(v=>v.id===t))useLab.setState({tab:t as Tab});};window.addEventListener('hashchange',listener);return()=>window.removeEventListener('hashchange',listener);},[]);
  return <>
    <a className="skip-link" href="#main">Skip to content</a>
    <header className="app-header"><button className="brand" onClick={()=>setTab('laboratory')}><span className="brand-mark"><FlaskConical size={21} strokeWidth={1.5}/></span><span>Materials<span className="brand-light"> Lab</span></span></button><nav aria-label="Main navigation">{tabs.map(t=><button key={t.id} className={tab===t.id?'active':''} aria-current={tab===t.id?'page':undefined} onClick={()=>setTab(t.id)}>{t.label}{t.id==='compare'&&saved.length>0&&<span className="nav-count">{saved.length}</span>}</button>)}</nav><div className="header-status"><span className="live-dot"/>Local inference <span className="header-version">Model v{bundle?.manifest.modelVersion??'0.1.0'}</span></div></header>
    <main id="main" tabIndex={-1}>
      {storageError&&<p className="error-box" role="alert">{storageError}</p>}
      {bootError?<div className="empty-state" role="alert"><AlertCircle size={32}/><h1>Research assets could not load.</h1><p>{bootError}</p><button className="button primary" onClick={()=>void boot()}>Retry loading</button></div>:!bundle?<div className="loading-page" role="status"><LoaderCircle className="spin"/>Loading verified research assets…</div>:tab==='laboratory'?<Laboratory/>:tab==='compare'?<Compare/>:tab==='measurements'?<Measurements/>:<Evidence/>}
    </main>
    <footer><span>Materials Lab <span className="muted">/</span> Research preview · <a href={`${import.meta.env.BASE_URL}THIRD_PARTY_NOTICES.txt`} target="_blank" rel="noreferrer">Licenses</a></span><span>Public data. Traceable predictions. <span className="muted">No independent laboratory validation.</span></span><span className="mono">Al · 13</span></footer>
    {notice&&<div className="toast" role="status"><Check size={16}/>{notice}<button className="icon-button" onClick={()=>useLab.setState({notice:undefined})} aria-label="Dismiss notification"><X size={15}/></button></div>}
  </>;
}
