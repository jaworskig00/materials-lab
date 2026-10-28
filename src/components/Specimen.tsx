import { Canvas, useThree } from '@react-three/fiber';
import { Component, Suspense, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { ExtrudeGeometry, Shape, Mesh, Vector3 } from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { Pause, Play, RotateCcw, Move, Maximize2 } from 'lucide-react';

class SceneBoundary extends Component<{ children: ReactNode; fallback: ReactNode }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() { return { failed: true }; }
  render() { return this.state.failed ? this.props.fallback : this.props.children; }
}
function CameraControls({ reset }: { reset: number }) {
  const { camera, gl, invalidate } = useThree();
  useEffect(() => {
    camera.position.set(3.7, 2.5, 5.8); camera.lookAt(0, .1, 0);
    const c = new OrbitControls(camera, gl.domElement);
    c.target = new Vector3(0, .1, 0); c.enablePan = false; c.minDistance = 4; c.maxDistance = 11;
    const refresh = () => invalidate();
    c.maxPolarAngle = Math.PI * .75; c.addEventListener('change', refresh); c.update(); invalidate();
    return () => { c.removeEventListener('change', refresh); c.dispose(); };
  }, [camera, gl, invalidate, reset]);
  return null;
}
function Block({ position, size, color = '#48534e', metal = .65 }: { position: [number, number, number]; size: [number, number, number]; color?: string; metal?: number }) {
  return <mesh position={position} castShadow receiveShadow><boxGeometry args={size}/><meshStandardMaterial color={color} metalness={metal} roughness={.38}/></mesh>;
}
function Coupon({ stage }: { stage: number }) {
  const mesh = useRef<Mesh>(null);
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
  useEffect(() => () => geometry.dispose(), [geometry]);
  return <group scale={[1, 1 + stage * .16, 1]}>
    <mesh ref={mesh} geometry={geometry} castShadow><meshStandardMaterial color="#e3bc72" metalness={.78} roughness={.28}/></mesh>
    {[-.25, .25].map(y => <Block key={y} position={[0, y, .046]} size={[.22, .012, .004]} color="#4c3f25" metal={.1}/>)}
  </group>;
}
function Rig({ stage }: { stage: number }) {
  const offset = stage * .18;
  return <group>
    <Block position={[0, -1.78, -.2]} size={[2.9, .26, 1.4]} color="#202b26"/>
    <Block position={[0, 1.8, -.2]} size={[2.9, .22, .9]} color="#25322c"/>
    {[-1.08, 1.08].map(x => <group key={x}>
      <mesh position={[x, 0, -.2]} castShadow><cylinderGeometry args={[.075, .075, 3.5, 24]}/><meshStandardMaterial color="#aab6ae" metalness={.9} roughness={.25}/></mesh>
      <Block position={[x, 0, -.45]} size={[.18, 3.4, .14]} color="#202b26"/>
      {[-1.63, 1.62].map(y => <mesh key={y} position={[x,y,-.2]}><cylinderGeometry args={[.13,.13,.11,6]}/><meshStandardMaterial color="#78877d" metalness={.7} roughness={.35}/></mesh>)}
    </group>)}
    <Block position={[0, 1.36 + offset, -.2]} size={[2.5, .20, .66]} color="#35463c"/>
    {[1,-1].map(sign => <group key={sign} position={[0, sign*(.97 + offset), 0]}>
      <Block position={[0, 0, -.12]} size={[.82,.45,.4]} color="#778880"/>
      <Block position={[0, 0, .17]} size={[.72,.36,.16]} color="#37473e"/>
      {[-.24,.24].map(x => <mesh key={x} position={[x,0,.265]} rotation={[Math.PI/2,0,0]}><cylinderGeometry args={[.048,.048,.03,6]}/><meshStandardMaterial color="#c2cbc1" metalness={.8}/></mesh>)}
    </group>)}
    <Coupon stage={stage}/>
    {Array.from({ length: 21 }, (_, i) => <Block key={i} position={[-.62, (i-10)*.064, -.02]} size={[i%5===0 ? .11 : .05,.007,.009]} color="#718377" metal={0}/>)}
    <mesh rotation={[-Math.PI/2,0,0]} position={[0,-1.93,0]} receiveShadow><planeGeometry args={[50,50]}/><meshStandardMaterial color="#161e19" roughness={1}/></mesh>
    <gridHelper args={[20, 40, '#334638', '#223027']} position={[0,-1.925,0]}/>
  </group>;
}
export function SpecimenFallback() {
  return <div className="scene-fallback"><svg viewBox="0 0 200 280" role="img" aria-label="Schematic tensile specimen between two grips"><path d="M65 30H135V90Q135 110 115 120V160Q135 170 135 190V250H65V190Q65 170 85 160V120Q65 110 65 90Z" fill="#d5b17a"/><path d="M45 35H155V70H45ZM45 210H155V245H45Z" fill="#6d8174"/></svg><p>3D is unavailable. Predictions remain available.</p></div>;
}
export function Specimen({ sampleId }: { sampleId: string }) {
  const [stage, setStage] = useState(0);
  const [running, setRunning] = useState(false);
  const [reset, setReset] = useState(0);
  const reducedMotion = useMemo(() => window.matchMedia('(prefers-reduced-motion: reduce)').matches, []);
  useEffect(() => {
    if (!running || stage >= 1) return;
    const handle = window.setInterval(() => setStage(s => Math.min(1, s + .006)), 40);
    return () => window.clearInterval(handle);
  }, [running, stage]);
  const complete = stage >= 1;
  return <section className="specimen-panel" aria-label="Schematic 3D tensile test">
    <div className="scene-heading"><span><span className="live-dot"/>Tensile specimen</span><span className="mono">{sampleId}</span></div>
    <div className="scene-area" data-testid="specimen-view">
      <SceneBoundary fallback={<SpecimenFallback/>}><Suspense fallback={<SpecimenFallback/>}>
        <Canvas aria-label="Interactive 3D tensile test apparatus" shadows dpr={[1,1.5]} frameloop="demand" camera={{ position: [3.7,2.5,5.8], fov: 38 }} fallback={<SpecimenFallback/>}>
          <color attach="background" args={['#161e19']}/><fog attach="fog" args={['#161e19', 12, 27]}/>
          <ambientLight intensity={1.3}/><hemisphereLight args={['#e6eedf','#252b1e',2]}/>
          <directionalLight castShadow position={[3,6,5]} intensity={3} shadow-mapSize={[1024,1024]} shadow-camera-left={-5} shadow-camera-right={5} shadow-camera-top={5} shadow-camera-bottom={-5}/>
          <directionalLight position={[-3,2,-1]} intensity={2} color="#b8d4bd"/>
          <Rig stage={stage}/><CameraControls reset={reset}/>
        </Canvas>
      </Suspense></SceneBoundary>
      <span className="scene-note">Schematic animation<br/>Not a deformation simulation</span>
      <span className="scene-hint"><Move size={13}/>Drag to orbit · scroll to zoom</span>
      <button className="icon-button camera-reset" onClick={() => setReset(r=>r+1)} aria-label="Reset camera"><Maximize2 size={16}/></button>
    </div>
    <div className="scene-controls">
      <button className="button subtle small" disabled={reducedMotion} onClick={() => { if (complete) setStage(0); setRunning(v => !v || complete); }} aria-label={running && !complete ? 'Pause illustration' : 'Play illustration'}>{running && !complete ? <Pause size={14}/> : <Play size={14}/>} {running && !complete ? 'Pause' : 'Play'}</button>
      <input aria-label="Illustration stage" type="range" min="0" max="1" step=".01" value={stage} onChange={e=>{setRunning(false);setStage(Number(e.target.value));}}/>
      <button className="icon-button" onClick={()=>{setRunning(false);setStage(0);}} aria-label="Reset illustration"><RotateCcw size={15}/></button>
    </div>
    {reducedMotion && <p className="motion-note">Reduced motion is on. Use the stage slider to inspect the specimen.</p>}
  </section>;
}
