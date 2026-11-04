// The UniVast — 3D fly-through (Mochi). Illustration; large-scale positions are schematic.
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/OrbitControls.js';

const OBJECTS_PATH = './data/objects.json';  // Oraly's checked facts (single path constant)
const root = document.getElementById('universe-canvas');
// Stops: real distance scale in light-years (rounded, approximate; awaiting Oraly's check).
// cam = camera distance in scene units for that stop (schematic log layout).
const STOPS = [
  { id:'solar', name:'Solar System', ly:4.8e-4, cam:6, info:'Sun and planets; Neptune orbits about 30 AU (≈ 0.00048 light-years) out.' },
  { id:'near', name:'Nearest stars', ly:4.24, cam:28, info:'Proxima Centauri, the nearest known star, is about 4.24 light-years away.' },
  { id:'mw', name:'Milky Way', ly:1.0e5, cam:140, info:'Our galaxy is roughly 100,000 light-years across (estimates vary); the Sun is about 26,000 ly from the centre.' },
  { id:'lg', name:'Local Group', ly:1.0e7, cam:520, info:'Andromeda is about 2.5 million ly away; the Local Group spans roughly 10 million ly.' },
  { id:'web', name:'Clusters & cosmic web', ly:5.2e8, cam:1500, info:'Galaxies gather into clusters (Virgo ≈ 54 million ly) and filaments; our supercluster Laniakea is ≈ 520 million ly across.' },
  { id:'edge', name:'Observable universe', ly:4.65e10, cam:4200, info:'The edge of what we can see is about 46.5 billion ly away (comoving), even though the universe is 13.8 billion years old.' },
];
STOPS.forEach(s => s.status = "stop text written by Mochi; distances approximate, for Oraly to check");

const phone = matchMedia('(max-width:700px)').matches || (navigator.hardwareConcurrency || 8) <= 4;
const N = phone ? 0.35 : 1;

function hasGL(){ try{ const c=document.createElement('canvas'); return !!(window.WebGLRenderingContext && (c.getContext('webgl2')||c.getContext('webgl'))); }catch(e){ return false; } }

const css = `#universe-canvas{position:relative;max-width:1200px;margin:0 auto 1.5rem;padding:0 1rem}
.u3-stage{position:relative;height:min(70vh,620px);border-radius:16px;overflow:hidden;background:#000;border:1px solid #ffffff1a}
.u3-stage canvas{display:block;width:100%;height:100%;touch-action:none}
.u3-tag{position:absolute;left:10px;top:10px;font-size:.78rem;background:#000a;color:#cfd8f5;padding:3px 9px;border-radius:8px;pointer-events:none;max-width:70%}
.u3-read{position:absolute;right:10px;top:10px;text-align:right;background:#000a;padding:6px 10px;border-radius:10px;font-size:.85rem;pointer-events:none}
.u3-read b{display:block;font-size:1.15rem;color:#ffd27a}
.u3-scale{position:absolute;left:10px;right:10px;bottom:10px;height:6px;background:#ffffff22;border-radius:3px;pointer-events:none}.u3-scale i{position:absolute;top:-3px;width:12px;height:12px;border-radius:50%;background:#7fb2ff;transform:translateX(-50%)}
.u3-bar{display:flex;flex-wrap:wrap;gap:.4rem;margin:.7rem 0}
.u3-bar button{min-height:44px;padding:.45rem .9rem;border-radius:999px;border:1px solid #ffffff33;background:#0e1636;color:#e8ecf8;font:inherit;font-size:.92rem;cursor:pointer}
.u3-bar button[aria-pressed=true]{background:#2f56c9;border-color:#7fb2ff}.u3-bar button:focus-visible{outline:3px solid #ffd27a;outline-offset:2px}
.u3-info{min-height:3em;color:#cfd8f5}.u3-label{position:absolute;color:#fff;font-size:.75rem;text-shadow:0 0 4px #000;pointer-events:none;white-space:nowrap;transform:translate(-50%,-140%)}
.ctag{display:inline-block;font-size:.75rem;padding:1px 8px;border-radius:9px;margin-left:.3rem;background:#1f4d2e}.ctag.debated{background:#6b4a10}.ctag.candidate{background:#5a1f3a}.ctag.hypothesis{background:#4a2a6b}.ctag.interpretation{background:#33336b}#u3-objs button{font-size:.82rem;min-height:44px}
.u3-note{font-size:.85rem;color:#9aa6c8}.u3-fallback li{margin:.3rem 0}`;
const st=document.createElement('style'); st.textContent=css; document.head.appendChild(st);

function fmtLy(ly){
  if (ly < 0.01) return (ly*63241).toFixed(ly*63241<10?1:0)+' AU';
  if (ly < 1000) return ly.toFixed(ly<10?2:0)+' light-years';
  const u=[[1e9,'billion'],[1e6,'million'],[1e3,'thousand']];
  for (const [v,n] of u) if (ly>=v) return (+(ly/v).toPrecision(3)).toString()+' '+n+' light-years';
}

if (!hasGL()) {
  root.innerHTML = `<h2>Journey outward (text view)</h2><p class="u3-note">3D needs WebGL, which isn't available here, so here is the tour as a list.</p><ol class="u3-fallback">${STOPS.map(s=>`<li><b>${s.name}</b> — ~${fmtLy(s.ly)}. ${s.info}</li>`).join('')}</ol><p class="u3-note">Distances are approximate.</p>`;
} else build();

function build(){
  root.innerHTML = `<div class="u3-stage"><span class="u3-tag">Illustration, not a photograph · large-scale positions are schematic (log scale)</span>
  <div class="u3-read" aria-live="polite"><span>Field of view ≈</span><b id="u3-dist">—</b><span id="u3-stop"></span></div><div class="u3-scale"><i id="u3-dot"></i></div></div>
  <div class="u3-bar" role="group" aria-label="Tour stops">${STOPS.map((s,i)=>`<button data-i="${i}" aria-pressed="false">${i+1}. ${s.name}</button>`).join('')}
  <button id="u3-tour">▶ Full tour</button><button id="u3-spin" aria-pressed="true">Auto-rotate</button></div>
  <p class="u3-info" id="u3-info" aria-live="polite"></p>
  <p class="u3-note">Drag to orbit, scroll/pinch to zoom, or use the buttons (keys 1–6, T for tour). Each zoom step jumps by a huge factor: the distance readout is logarithmic and uses real approximate distances. Sizes and positions of the Milky Way, galaxies and the cosmic web are artistic and schematic. Distances are approximate. Object facts come from Oraly's checked list; tap an object to read it (with its confidence tag). Space is silent: for sonifications see <a href="sounds.html">Sounds</a>.</p>
  <div class="u3-bar" id="u3-objs" role="group" aria-label="Objects"></div><div class="u3-info" id="u3-obj" aria-live="polite"></div>`;
  const stage = root.querySelector('.u3-stage');
  const renderer = new THREE.WebGLRenderer({ antialias: !phone, powerPreference:'high-performance' });
  renderer.setPixelRatio(Math.min(devicePixelRatio, phone?1.5:2));
  stage.prepend(renderer.domElement);
  renderer.domElement.setAttribute('aria-label','3D view of the universe from the solar system outward');
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(55, 1, 0.01, 40000);
  camera.position.set(0, 3, 6);
  const controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true; controls.minDistance = 1.5; controls.maxDistance = 6000; controls.autoRotate = true; controls.autoRotateSpeed = 0.35;

  const dotTex = (() => { const c=document.createElement('canvas'); c.width=c.height=64; const g=c.getContext('2d'); const r=g.createRadialGradient(32,32,0,32,32,32); r.addColorStop(0,'#fff'); r.addColorStop(.25,'#fffc'); r.addColorStop(1,'#0000'); g.fillStyle=r; g.fillRect(0,0,64,64); return new THREE.CanvasTexture(c); })();
  function points(pos, col, size, opacity=1){ const g=new THREE.BufferGeometry(); g.setAttribute('position',new THREE.Float32BufferAttribute(pos,3)); g.setAttribute('color',new THREE.Float32BufferAttribute(col,3));
    return new THREE.Points(g,new THREE.PointsMaterial({size,map:dotTex,vertexColors:true,transparent:true,opacity,depthWrite:false,blending:THREE.AdditiveBlending,sizeAttenuation:true})); }
  const rnd=(a,b)=>a+Math.random()*(b-a), gauss=()=>{let u=0;for(let i=0;i<4;i++)u+=Math.random();return u/2-1;};
  const labels=[];
  function label(text,obj,minD,maxD){ const el=document.createElement('span'); el.className='u3-label'; el.textContent=text; stage.appendChild(el); labels.push({el,obj,minD,maxD}); }

  // Solar system (sizes exaggerated; spacing compressed)
  const sun = new THREE.Mesh(new THREE.SphereGeometry(0.18,32,16), new THREE.MeshBasicMaterial({color:0xffd27a}));
  scene.add(sun); label('Sun', sun, 0, 60);
  const glow = new THREE.Sprite(new THREE.SpriteMaterial({map:dotTex,color:0xffb347,transparent:true,blending:THREE.AdditiveBlending,depthWrite:false})); glow.scale.set(1.2,1.2,1); scene.add(glow);
  const PL=[['Mercury',0xa9a29b,.035,88],['Venus',0xe8c27a,.05,224.7],['Earth',0x4f8fe0,.052,365.2],['Mars',0xd0603a,.04,687],['Jupiter',0xd9b38c,.12,4331],['Saturn',0xe3d29b,.1,10747],['Uranus',0x9fe3e8,.075,30589],['Neptune',0x4a6fe3,.073,59800]];
  const planets = PL.map(([n,c,r,p],i)=>{ const a=0.45+i*0.32; const m=new THREE.Mesh(new THREE.SphereGeometry(r,16,8),new THREE.MeshBasicMaterial({color:c})); m.userData={a,p,ph:Math.random()*6.28}; scene.add(m);
    const ring=new THREE.LineLoop(new THREE.BufferGeometry().setFromPoints(Array.from({length:96},(_,k)=>new THREE.Vector3(Math.cos(k/96*6.283)*a,0,Math.sin(k/96*6.283)*a))),new THREE.LineBasicMaterial({color:0x335,transparent:true,opacity:.6})); scene.add(ring);
    if(n==='Earth'||n==='Jupiter'||n==='Neptune') label(n,m,0,14); return m; });

  // Nearby stars shell
  { const n=Math.round(1500*N),p=[],c=[]; for(let i=0;i<n;i++){ const v=new THREE.Vector3(gauss(),gauss(),gauss()).normalize().multiplyScalar(rnd(8,40)); p.push(v.x,v.y,v.z); const t=Math.random(); c.push(1,.8+.2*t,.6+.4*t);} scene.add(points(p,c,.35,.9));
    const prox=new THREE.Object3D(); prox.position.set(9,1,-5); scene.add(prox); label('Proxima Centauri (4.24 ly)',prox,10,90); }

  // Milky Way (schematic barred spiral), Sun offset from centre
  const MW=new THREE.Group(); MW.position.set(-70,-4,0); scene.add(MW);
  { const n=Math.round(40000*N),p=[],c=[]; for(let i=0;i<n;i++){ const arm=i%4, r=Math.pow(Math.random(),.6)*100, th=arm*Math.PI/2+r*0.055+gauss()*0.35; const core=Math.exp(-r/18);
      p.push(Math.cos(th)*r+gauss()*3, gauss()*(1.2+4*core), Math.sin(th)*r+gauss()*3); c.push(.6+.4*core,.65+.3*core,1-.45*core);} const pts=points(p,c,1.4,.75); MW.add(pts); }
  { const o=new THREE.Object3D(); MW.add(o); label('Milky Way centre',o,90,900); }
  const youAre=new THREE.Object3D(); scene.add(youAre); label('You are here',youAre,100,700);

  // Local Group galaxies (schematic positions)
  function galaxy(x,y,z,rad,n,col,name,tilt=0){ const g=new THREE.Group(); g.position.set(x,y,z); g.rotation.set(tilt,0,tilt*.6); const p=[],c=[];
    for(let i=0;i<n;i++){ const r=Math.pow(Math.random(),.7)*rad,th=(i%2)*Math.PI+r/rad*5+gauss()*.5; p.push(Math.cos(th)*r,gauss()*rad*.05,Math.sin(th)*r); c.push(...col);} g.add(points(p,c,rad*.05,.8)); scene.add(g); if(name) label(name,g,300,3000); return g; }
  galaxy(260,40,-160,70,Math.round(9000*N),[.85,.85,1],'Andromeda (≈2.5 million ly)',.7);
  galaxy(230,-60,-60,28,Math.round(2500*N),[.7,.8,1],'Triangulum',.3);
  galaxy(-120,-50,60,12,Math.round(800*N),[1,.9,.85],'Large Magellanic Cloud',.9);
  // Cosmic web: clusters on filaments
  { const nodes=[]; for(let i=0;i<40;i++) nodes.push(new THREE.Vector3(gauss()*1400,gauss()*1400,gauss()*1400));
    const p=[],c=[], n=Math.round(60000*N);
    for(let i=0;i<n;i++){ const a=nodes[i%40], b=nodes[(i*7+3)%40]; const t=Math.random(); const v=a.clone().lerp(b,t).add(new THREE.Vector3(gauss(),gauss(),gauss()).multiplyScalar(40));
      if(i%5===0) v.copy(a).add(new THREE.Vector3(gauss(),gauss(),gauss()).multiplyScalar(60)); if(v.length()<500) continue; p.push(v.x,v.y,v.z); c.push(.55,.6+.3*Math.random(),1);} scene.add(points(p,c,9,.55));
    const virgo=new THREE.Object3D(); virgo.position.copy(nodes[0]); scene.add(virgo); label('A galaxy cluster (schematic)',virgo,900,5000); }
  // Observable-universe edge: CMB-like shell
  { const g=new THREE.SphereGeometry(3000,phone?32:64,phone?16:32); const cols=[]; const P=g.attributes.position; for(let i=0;i<P.count;i++){ const t=.5+.5*Math.sin(P.getX(i)*.01+P.getY(i)*.013)*Math.cos(P.getZ(i)*.009); cols.push(.25+.6*t,.12+.3*t,.35-.2*t);} g.setAttribute('color',new THREE.Float32BufferAttribute(cols,3));
    const shell=new THREE.Mesh(g,new THREE.MeshBasicMaterial({vertexColors:true,side:THREE.BackSide,transparent:true,opacity:.0,depthWrite:false})); scene.add(shell); scene.userData.shell=shell;
    const o=new THREE.Object3D(); o.position.set(0,3000,0); scene.add(o); label('Cosmic microwave background, the oldest light we can see, near the edge of the observable universe',o,3000,9000); }

  // log-scale readout: interpolate log10(ly) by log camera distance between stops
  function lyAt(d){ const S=STOPS; if(d<=S[0].cam) return S[0].ly*d/S[0].cam; for(let i=1;i<S.length;i++) if(d<=S[i].cam){ const t=Math.log(d/S[i-1].cam)/Math.log(S[i].cam/S[i-1].cam); return Math.pow(10,Math.log10(S[i-1].ly)+t*(Math.log10(S[i].ly)-Math.log10(S[i-1].ly))); } return S[S.length-1].ly; }
  const distEl=root.querySelector('#u3-dist'), stopEl=root.querySelector('#u3-stop'), dot=root.querySelector('#u3-dot'), info=root.querySelector('#u3-info');
  const btns=[...root.querySelectorAll('[data-i]')];
  let tween=null, touring=false;
  function go(i){ const s=STOPS[i]; btns.forEach((b,k)=>b.setAttribute('aria-pressed',k===i)); info.innerHTML=`<b>${s.name}</b> — ${s.info}`;
    const from=camera.position.clone(), dir=from.clone().sub(controls.target).normalize(); if(dir.y<.15) dir.y=.35; dir.normalize();
    tween={t0:performance.now(),dur:2600,from,fromT:controls.target.clone(),toD:s.cam,dir}; }
  btns.forEach(b=>b.onclick=()=>{touring=false;go(+b.dataset.i);});
  const tourBtn=root.querySelector('#u3-tour');
  tourBtn.onclick=async()=>{ if(touring){touring=false;tourBtn.textContent='▶ Full tour';return;} touring=true; tourBtn.textContent='■ Stop tour';
    for(let i=0;i<STOPS.length&&touring;i++){ go(i); await new Promise(r=>setTimeout(r,4800)); } touring=false; tourBtn.textContent='▶ Full tour'; };
  const spinB=root.querySelector('#u3-spin'); spinB.onclick=()=>{controls.autoRotate=!controls.autoRotate;spinB.setAttribute('aria-pressed',controls.autoRotate);};
  addEventListener('keydown',e=>{ if(e.target.matches('input,textarea'))return; const k=+e.key; if(k>=1&&k<=6){touring=false;go(k-1);} if(e.key==='t'||e.key==='T') tourBtn.click(); });

  function resize(){ const w=stage.clientWidth,h=stage.clientHeight; renderer.setSize(w,h,false); camera.aspect=w/h; camera.updateProjectionMatrix(); }
  new ResizeObserver(resize).observe(stage); resize();
  let visible=true; new IntersectionObserver(e=>visible=e[0].isIntersecting).observe(stage);
  const v=new THREE.Vector3(); let last=performance.now(), days=0;
  go(0);
  // Objects from Oraly's objects.json: markers at schematic positions matching their (approximate) distance on the log scale
  function camFor(ly){ const S=STOPS; if(ly<=S[0].ly) return S[0].cam; for(let i=1;i<S.length;i++) if(ly<=S[i].ly){ const t=(Math.log10(ly)-Math.log10(S[i-1].ly))/(Math.log10(S[i].ly)-Math.log10(S[i-1].ly)); return Math.exp(Math.log(S[i-1].cam)+t*Math.log(S[i].cam/S[i-1].cam)); } return S[S.length-1].cam; }
  const esc=t=>String(t??'').replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
  fetch(OBJECTS_PATH).then(r=>r.json()).then(j=>{ const O=(Array.isArray(j)?j:j.objects)||[]; const bar=root.querySelector('#u3-objs'), box=root.querySelector('#u3-obj');
    const colors={'black-hole':0xff9d3c,pulsar:0x7fd8ff,magnetar:0xff6bd6,galaxy:0xc9b8ff,quasar:0xfff27a,nebula:0xff7f9f,star:0xffe0a0,universe:0xffffff};
    O.forEach((o,i)=>{ const ly=o.distance_ly??o.radius_ly??(o.id==='milky-way'?26000:null);
      const b=document.createElement('button'); b.textContent=o.name; bar.appendChild(b);
      let marker=null;
      if(ly){ const r=camFor(ly)*0.55, th=i*2.399, ph=Math.acos(1-2*((i*0.618)%1));
        marker=new THREE.Sprite(new THREE.SpriteMaterial({map:dotTex,color:colors[o.category]||0xffffff,transparent:true,blending:THREE.AdditiveBlending,depthWrite:false}));
        marker.position.set(r*Math.sin(ph)*Math.cos(th),r*Math.cos(ph)*.4,r*Math.sin(ph)*Math.sin(th)); marker.scale.setScalar(r*.04); scene.add(marker);
        label(o.name,marker,camFor(ly)*.3,camFor(ly)*3); }
      b.onclick=()=>{ touring=false; const dtxt=o.distance_ly!=null?`≈ ${fmtLy(o.distance_ly)} away (approximate)`:o.radius_ly!=null?`radius ≈ ${fmtLy(o.radius_ly)} (approximate)`:o.diameter_ly!=null?`≈ ${fmtLy(o.diameter_ly)} across (approximate)`:'';
        box.innerHTML=`<b>${esc(o.name)}</b> <span class="u3-note">${esc(o.category)}${dtxt?' · '+dtxt:''}</span><br>${esc(o.fact)} <span class="ctag ${esc(o.confidence)}" title="Confidence">${esc(o.confidence||'untagged')}</span>${o.source?` <span class="u3-note">Source: ${esc(o.source)}</span>`:''}`;
        if(ly){ let k=0; STOPS.forEach((s,n)=>{ if(Math.abs(Math.log10(s.ly/ly))<Math.abs(Math.log10(STOPS[k].ly/ly))) k=n; }); const from=camera.position.clone(); tween={t0:performance.now(),dur:2400,from,fromT:controls.target.clone(),toD:camFor(ly)*1.1,dir:from.clone().sub(controls.target).normalize()}; } };
    }); }).catch(e=>console.warn('objects.json not loaded',e));
  renderer.setAnimationLoop(now=>{
    const dt=Math.min(.05,(now-last)/1000); last=now; if(!visible||document.hidden) return;
    days+=dt*60; // 60 days per second, real relative periods
    planets.forEach(m=>{const u=m.userData,a=u.ph+days/u.p*6.2832; m.position.set(Math.cos(a)*u.a,0,Math.sin(a)*u.a);});
    if(tween){ const t=Math.min(1,(now-tween.t0)/tween.dur), e=t<.5?4*t*t*t:1-Math.pow(-2*t+2,3)/2;
      const d0=tween.from.distanceTo(tween.fromT), d=Math.exp(Math.log(d0)+(Math.log(tween.toD)-Math.log(d0))*e);
      controls.target.lerpVectors(tween.fromT,new THREE.Vector3(),e); camera.position.copy(controls.target).addScaledVector(tween.dir,d); if(t>=1) tween=null; }
    controls.update();
    const d=camera.position.distanceTo(controls.target); const ly=lyAt(d);
    distEl.textContent=fmtLy(ly); const lo=Math.log10(STOPS[0].ly), hi=Math.log10(STOPS[5].ly); dot.style.left=(Math.max(0,Math.min(1,(Math.log10(ly)-lo)/(hi-lo)))*100)+'%';
    let near=STOPS[0]; STOPS.forEach(s=>{ if(Math.abs(Math.log(d/s.cam))<Math.abs(Math.log(d/near.cam))) near=s; }); stopEl.textContent=near.name;
    scene.userData.shell.material.opacity=Math.max(0,Math.min(.85,(d-1500)/2200));
    glow.scale.setScalar(Math.max(1.2,d*.05));
    const w=stage.clientWidth,h=stage.clientHeight;
    labels.forEach(L=>{ L.obj.getWorldPosition(v); const show=d>=L.minD&&d<=L.maxD; v.project(camera); const ok=show&&v.z<1&&Math.abs(v.x)<1&&Math.abs(v.y)<1;
      L.el.style.display=ok?'block':'none'; if(ok){ L.el.style.left=((v.x+1)/2*w)+'px'; L.el.style.top=((1-v.y)/2*h)+'px'; } });
    renderer.render(scene,camera);
  });
}
