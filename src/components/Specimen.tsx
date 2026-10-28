import { Canvas, useThree } from '@react-three/fiber';
import { Component, Suspense, useEffect, useLayoutEffect, useMemo, useState, type ReactNode } from 'react';
import { ExtrudeGeometry, Shape, Vector3, EdgesGeometry, DynamicDrawUsage, type BufferAttribute } from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { Pause, Play, RotateCcw, Move, Maximize2 } from 'lucide-react';
import { useIllustration } from '../lib/useIllustration';

type View = 'apparatus' | 'front' | 'detail';
const phases = [
  { name: 'Mount', at: 0, description: 'The jaws close around the ends of the specimen.' },
  { name: 'Pull', at: .52, description: 'The upper grip moves. Watch the two gauge marks separate.' },
  { name: 'Hold', at: 1, description: 'Compare the extended coupon with its original outline.' },
];
const smooth = (v: number) => { const x = Math.max(0, Math.min(1, v)); return x * x * (3 - 2 * x); };
const shiftedY = (y: number, pull: number) => y + pull * smooth((y + .60) / 1.20);

class SceneBoundary extends Component<{ children: ReactNode; fallback: ReactNode }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() { return { failed: true }; }
  render() { return this.state.failed ? this.props.fallback : this.props.children; }
}
function CameraControls({ reset, view }: { reset: number; view: View }) {
  const { camera, gl, invalidate } = useThree();
  useEffect(() => {
    const position: [number, number, number] = view === 'front' ? [0, .35, 8.2] : view === 'detail' ? [1.5, .75, 3.3] : [3.8, 2.6, 6.6];
    camera.position.set(...position); camera.lookAt(0, .35, 0);
    const c = new OrbitControls(camera, gl.domElement);
    c.target = new Vector3(0, .35, 0); c.enablePan = false; c.minDistance = 2.4; c.maxDistance = 11;
    const refresh = () => invalidate();
    c.maxPolarAngle = Math.PI * .75; c.addEventListener('change', refresh); c.update(); invalidate();
    return () => { c.removeEventListener('change', refresh); c.dispose(); };
  }, [camera, gl, invalidate, reset, view]);
  return null;
}
function Block({ position, size, color = '#48534e', metal = .65 }: { position: [number, number, number]; size: [number, number, number]; color?: string; metal?: number }) {
  return <mesh position={position} castShadow receiveShadow><boxGeometry args={size}/><meshStandardMaterial color={color} metalness={metal} roughness={.38}/></mesh>;
}
function Coupon({ pull, outline }: { pull: number; outline: boolean }) {
  const geometry = useMemo(() => {
    const s = new Shape();
    s.moveTo(-.31, 1.14); s.lineTo(.31, 1.14); s.lineTo(.31, .69);
    s.bezierCurveTo(.31, .47, .13, .49, .13, .30); s.lineTo(.13, -.30);
    s.bezierCurveTo(.13, -.49, .31, -.47, .31, -.69); s.lineTo(.31, -1.14);
    s.lineTo(-.31, -1.14); s.lineTo(-.31, -.69);
    s.bezierCurveTo(-.31, -.47, -.13, -.49, -.13, -.30); s.lineTo(-.13, .30);
    s.bezierCurveTo(-.13, .49, -.31, .47, -.31, .69); s.closePath();
    const g = new ExtrudeGeometry(s, { depth: .065, bevelEnabled: true, bevelThickness: .009, bevelSize: .009, bevelSegments: 3, steps: 1, curveSegments: 20 });
    g.translate(0, 0, -.0325); return g;
  }, []);
  const initial = useMemo(() => new Float32Array(geometry.attributes.position.array), [geometry]);
  const edges = useMemo(() => new EdgesGeometry(geometry, 25), [geometry]);
  const { invalidate } = useThree();
  useLayoutEffect(() => {
    const position = geometry.attributes.position as BufferAttribute;
    position.setUsage(DynamicDrawUsage);
    for (let i = 0; i < position.count; i++) {
      const x = initial[i * 3], y = initial[i * 3 + 1], z = initial[i * 3 + 2];
      const middle = 1 - smooth(Math.abs(y) / .65);
      position.setXYZ(i, x * (1 - middle * pull * .14), shiftedY(y, pull), z);
    }
    position.needsUpdate = true;
    geometry.computeVertexNormals();
    geometry.computeBoundingSphere();
    invalidate();
  }, [geometry, initial, pull, invalidate]);
  useEffect(() => () => { geometry.dispose(); edges.dispose(); }, [geometry, edges]);
  return <group>
    <mesh geometry={geometry} castShadow><meshStandardMaterial color="#e3bc72" metalness={.65} roughness={.3}/></mesh>
    {outline && <lineSegments geometry={edges} position={[0, 0, .08]} renderOrder={2}><lineBasicMaterial color="#d8e4d7" transparent opacity={.35} depthTest={false}/></lineSegments>}
    {[-.25, .25].map(y => <Block key={y} position={[0, shiftedY(y, pull), .046]} size={[.22, .018, .006]} color="#493820" metal={.1}/>)}
    <Block position={[.46, (shiftedY(-.25,pull)+shiftedY(.25,pull))/2, .05]} size={[.009, shiftedY(.25,pull)-shiftedY(-.25,pull), .009]} color="#c3d7ba" metal={0}/>
    {[-.25,.25].map(y=><Block key={y} position={[.41, shiftedY(y,pull), .05]} size={[.12,.012,.01]} color="#c3d7ba" metal={0}/>)}
  </group>;
}
function Rig({ stage, outline }: { stage: number; outline: boolean }) {
  const offset = .72 * smooth((stage - .2) / .65);
  const jawGap = .17 * (1 - smooth(stage / .2));
  return <group>
    <Block position={[0, -1.78, -.2]} size={[2.9, .26, 1.4]} color="#202b26"/>
    <Block position={[0, 2.5, -.2]} size={[2.9, .22, .9]} color="#25322c"/>
    {[-1.08, 1.08].map(x => <group key={x}>
      <mesh position={[x, .35, -.2]} castShadow><cylinderGeometry args={[.075, .075, 4.25, 24]}/><meshStandardMaterial color="#aab6ae" metalness={.9} roughness={.25}/></mesh>
      <Block position={[x, .35, -.45]} size={[.18, 4.2, .14]} color="#202b26"/>
      {[-1.63, 2.32].map(y => <mesh key={y} position={[x,y,-.2]}><cylinderGeometry args={[.13,.13,.11,6]}/><meshStandardMaterial color="#78877d" metalness={.7} roughness={.35}/></mesh>)}
    </group>)}
    <Block position={[0, 1.36 + offset, -.2]} size={[2.5, .20, .66]} color="#35463c"/>
    {[1,-1].map(sign => <group key={sign} position={[0, sign*.97 + (sign === 1 ? offset : 0), 0]}>
      <Block position={[0, 0, -.12]} size={[.82,.45,.4]} color="#778880"/>
      <Block position={[0, 0, .17 + jawGap]} size={[.72,.36,.16]} color="#37473e"/>
      {[-.24,.24].map(x => <mesh key={x} position={[x,0,.265 + jawGap]} rotation={[Math.PI/2,0,0]}><cylinderGeometry args={[.048,.048,.03,6]}/><meshStandardMaterial color="#c2cbc1" metalness={.8}/></mesh>)}
    </group>)}
    <Block position={[0, -1.38, -.2]} size={[1.1,.3,.65]} color="#35463c"/>
    <Block position={[0, 1.925 + offset/2, -.2]} size={[.13,.93-offset,.13]} color="#aab6ae"/>
    <Coupon pull={offset} outline={outline}/>
    {stage > .2 && <group position={[.72, 1.04 + offset, .1]}>
      <Block position={[0,.08,0]} size={[.016,.26,.016]} color="#d8bc87" metal={0}/>
      <mesh position={[0,.25,0]}><coneGeometry args={[.065,.14,16]}/><meshBasicMaterial color="#d8bc87"/></mesh>
    </group>}
    {Array.from({ length: 21 }, (_, i) => <Block key={i} position={[-.62, (i-10)*.064, -.02]} size={[i%5===0 ? .11 : .05,.007,.009]} color="#718377" metal={0}/>)}
    <mesh rotation={[-Math.PI/2,0,0]} position={[0,-1.93,0]} receiveShadow><planeGeometry args={[50,50]}/><meshStandardMaterial color="#161e19" roughness={1}/></mesh>
    <gridHelper args={[20, 40, '#334638', '#223027']} position={[0,-1.925,0]}/>
  </group>;
}
export function SpecimenFallback() {
  return <div className="scene-fallback"><svg viewBox="0 0 200 280" role="img" aria-label="Schematic tensile specimen between two grips"><path d="M65 30H135V90Q135 110 115 120V160Q135 170 135 190V250H65V190Q65 170 85 160V120Q65 110 65 90Z" fill="#d5b17a"/><path d="M45 35H155V70H45ZM45 210H155V245H45Z" fill="#6d8174"/></svg><p>3D is unavailable. Predictions remain available.</p></div>;
}
export function Specimen({ sampleId }: { sampleId: string }) {
  const { stage, running, speed, setSpeed, reducedMotion, seek, toggle, container } = useIllustration();
  const [reset, setReset] = useState(0);
  const [view, setView] = useState<View>('apparatus');
  const [outline, setOutline] = useState(true);
  const phase = stage < .2 ? 0 : stage < .85 ? 1 : 2;
  const complete = stage >= 1;
  return <section ref={container} className="specimen-panel" aria-label="Schematic 3D tensile test">
    <div className="scene-heading"><span><span className="live-dot"/>Tensile specimen</span><span className="mono">{sampleId}</span></div>
    <div className="scene-area" data-testid="specimen-view">
      <SceneBoundary fallback={<SpecimenFallback/>}><Suspense fallback={<SpecimenFallback/>}>
        <Canvas aria-label="Interactive 3D tensile test apparatus" shadows dpr={[1,1.5]} frameloop="demand" camera={{ position: [3.8,2.6,6.6], fov: 38 }} fallback={<SpecimenFallback/>}>
          <color attach="background" args={['#161e19']}/><fog attach="fog" args={['#161e19', 12, 27]}/>
          <ambientLight intensity={1.3}/><hemisphereLight args={['#e6eedf','#252b1e',2]}/>
          <directionalLight castShadow position={[3,6,5]} intensity={3} shadow-mapSize={[1024,1024]} shadow-camera-left={-5} shadow-camera-right={5} shadow-camera-top={5} shadow-camera-bottom={-5}/>
          <directionalLight position={[-3,2,-1]} intensity={2} color="#b8d4bd"/>
          <Rig stage={stage} outline={outline}/><CameraControls reset={reset} view={view}/>
        </Canvas>
      </Suspense></SceneBoundary>
      <div className="scene-views" role="group" aria-label="Camera view">
        {(['apparatus','front','detail'] as const).map(v=><button key={v} aria-pressed={view===v} onClick={()=>{setView(v);setReset(r=>r+1);}}>{v==='apparatus'?'Apparatus':v==='front'?'Front':'Specimen close-up'}</button>)}
      </div>
      <span className="scene-note">Schematic animation · motion exaggerated<br/>Not a deformation simulation</span>
      <span className="scene-hint"><Move size={13}/>Drag to orbit · scroll to zoom</span>
      <button className="icon-button camera-reset" onClick={() => setReset(r=>r+1)} aria-label="Reset camera"><Maximize2 size={16}/></button>
    </div>
    <div className="scene-phase" aria-live="polite" aria-atomic="true"><strong>{phases[phase].name}</strong><p>{phases[phase].description}</p></div>
    <div className="scene-controls">
      <button className="button subtle small" disabled={reducedMotion} onClick={toggle} aria-label={running ? 'Pause illustration' : 'Play illustration'}>{running ? <Pause size={14}/> : <Play size={14}/>} {running ? 'Pause' : complete ? 'Replay' : 'Play'}</button>
      <input aria-label="Illustration stage" aria-valuetext={Math.round(stage*100)+'% of illustration, '+phases[phase].name} type="range" min="0" max="1" step=".01" value={stage} onChange={e=>seek(Number(e.target.value))}/>
      <button className="icon-button" onClick={()=>seek(0)} aria-label="Reset illustration"><RotateCcw size={15}/></button>
    </div>
    <div className="scene-options">
      <div className="scene-steps" role="group" aria-label="Illustration phases">{phases.map((p,i)=><button key={p.name} aria-pressed={phase===i} onClick={()=>seek(p.at)}><span>{i+1}</span>{p.name}</button>)}</div>
      <label className="scene-speed">Speed<select aria-label="Playback speed" value={speed} onChange={e=>setSpeed(Number(e.target.value))}><option value="0.5">0.5×</option><option value="1">1×</option><option value="2">2×</option></select></label>
      <label className="scene-outline"><input type="checkbox" checked={outline} onChange={e=>setOutline(e.target.checked)}/>Original outline</label>
    </div>
    <p className="motion-note">Illustration only. The same sequence is used for every material; it does not use model predictions.</p>
    {reducedMotion && <p className="motion-note">Reduced motion is on. Use the stage slider or phase buttons to inspect the specimen.</p>}
  </section>;
}
