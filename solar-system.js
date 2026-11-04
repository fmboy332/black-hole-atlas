// Solar System viewer (Mochi). Data path constants: Oraly's checked file first, Mochi's draft as fallback.
const DATA_PATHS = ['./data/solar-system.json'];  // Oraly's checked data (single source)
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/OrbitControls.js';

async function loadData(){
  for (const p of DATA_PATHS){ try{ const r=await fetch(p); if(!r.ok) continue; const j=await r.json(); const b=Array.isArray(j)?j:j.bodies?j.bodies:[{...j.sun,type:'star'},...(j.planets||[]).map(x=>({type:'planet',...x})),...(j.dwarf_planets||[]).map(x=>({type:'dwarf planet',...x})),...(j.notable_moons||[]).map(x=>({type:'moon',...x}))]; if(b&&b.length) return {path:p,json:j,bodies:b}; }catch(e){} }
  throw new Error('no data');
}
const fmt=(v,u,d=3)=>v==null||v===''?'not measured':(typeof v==='number'?(Math.abs(v)>=1e5||Math.abs(v)<1e-3&&v!==0?v.toExponential(2).replace('e+',' × 10^').replace('e-',' × 10^-'):(+v.toPrecision(d)).toLocaleString()):v)+(u?' '+u:'');
const phone=matchMedia('(max-width:700px)').matches;
const hasGL=()=>{try{const c=document.createElement('canvas');return !!(c.getContext('webgl2')||c.getContext('webgl'));}catch(e){return false;}};
const g=k=>(b=>b[k]);

(async()=>{
  const statusEl=document.getElementById('ss-status'), card=document.getElementById('ss-card');
  let D; try{ D=await loadData(); }catch(e){ statusEl.textContent='Could not load solar system data.'; return; }
  const draft=false;
  statusEl.innerHTML=`Facts: NASA NSSDC fact sheets and JPL Solar System Dynamics, checked by Oraly. Values can be revised; moon counts keep changing. <a href="sources.html">Sources</a>`;
  const COL={Sun:'#ffd27a',Mercury:'#a9a29b',Venus:'#e8c27a',Earth:'#4f8fe0',Mars:'#d0603a',Jupiter:'#d9b38c',Saturn:'#e3d29b',Uranus:'#9fe3e8',Neptune:'#4a6fe3',Pluto:'#cbb79a',Ceres:'#8d8a85',Moon:'#cfcfcf'};
  const rot=b=>{ if(typeof b.rotation_hours==='number') return b.rotation_hours; const m=typeof b.rotation==='string'&&b.rotation.match(/(-?[\d.]+)\s*(hours|days)/); return m?(+m[1])*(m[2]==='days'?24:1)*(/retro/i.test(b.rotation)?-1:1):null; };
  const B=D.bodies.map(b=>({...b, color:b.color||COL[b.name]||'#b9b2a8', rotation_hours:rot(b), r:b.radius_km??b.radius, P:b.orbital_period_days??b.period_days??(b.orbital_period_years!=null?b.orbital_period_years*365.25:null), a:b.semi_major_axis_au??b.semimajor_au}));
  const sunB=B.find(b=>/^sun$/i.test(b.name)), earthB=B.find(b=>/^earth/i.test(b.name));
  function showCard(b){
    const rows=[['Type',b.type],['Mean radius',fmt(b.r,'km')],['Radius vs Earth',b.r&&earthB?.r?fmt(b.r/earthB.r,'×',3):'not measured'],['Mass',fmt(b.mass_kg,'kg')],
      ['Orbital period',b.P!=null?fmt(b.P,'days')+(b.P>700?` (${(b.P/365.25).toFixed(1)} years)`:''):(b.type==='star'?'—':'not measured')],['Orbits',b.parent||(b.type==='star'?'—':'Sun')],
      [b.parent?'Distance from '+b.parent:'Avg distance from Sun',b.parent?fmt(b.distance_km,'km'):(b.a!=null?fmt(b.a,'AU')+' ('+fmt(b.a*149.6,'million km')+')':'—')],
      ['Day length (rotation)',typeof b.rotation==='string'?b.rotation:(b.rotation_hours!=null?fmt(Math.abs(b.rotation_hours),'hours')+(b.rotation_hours<0?' (retrograde)':''):'not measured')],['Temperature',b.temp_C!=null?fmt(b.temp_C,'°C'):b.surface_temp_K!=null?fmt(b.surface_temp_K,'K (surface)'):'not measured'],['Known moons',b.moons!=null?b.moons:(b.type==='planet'?'many; the count keeps rising (see NASA)':'—')]].filter(r=>!(r[1]==='—'&&b.type==='moon'));
    card.innerHTML=`<h2>${b.name}</h2>${b.fact?`<p>${b.fact} ${b.confidence?`<span class="ctag" title="confidence">${b.confidence}</span>`:''}</p>`:''}<dl>${rows.map(r=>`<dt>${r[0]}</dt><dd>${r[1]}</dd>`).join('')}</dl>
    <p class="v3-note">${draft?"Unverified — awaiting Oraly's check. ":''}${b.source?`Source: <a href="${b.source}" target="_blank" rel="noopener">${new URL(b.source).hostname}</a>`:''}</p>`;
  }
  const bar=document.getElementById('ss-bodies');
  const stage=document.getElementById('ss-stage');
  if(!hasGL()){
    stage.innerHTML='<p style="padding:1rem">3D needs WebGL, which is not available. Here are the facts as a table.</p>'; stage.style.height='auto';
    stage.insertAdjacentHTML('beforeend',`<table class="v3-t"><tr><th>Body</th><th>Radius (km)</th><th>Period (days)</th><th>Distance (AU)</th></tr>${B.map(b=>`<tr><td>${b.name}</td><td>${fmt(b.r)}</td><td>${fmt(b.P)}</td><td>${fmt(b.a)}</td></tr>`).join('')}</table>`);
    B.forEach(b=>{const x=document.createElement('button');x.textContent=b.name;x.onclick=()=>showCard(b);bar.appendChild(x);}); showCard(earthB||B[0]); return;
  }
  const renderer=new THREE.WebGLRenderer({antialias:!phone}); renderer.setPixelRatio(Math.min(devicePixelRatio,phone?1.5:2)); stage.prepend(renderer.domElement);
  renderer.domElement.setAttribute('aria-label','3D orbit view of the solar system');
  const scene=new THREE.Scene(), camera=new THREE.PerspectiveCamera(50,1,.01,2000); camera.position.set(0,14,22);
  const controls=new OrbitControls(camera,renderer.domElement); controls.enableDamping=true; controls.minDistance=.3; controls.maxDistance=120;
  scene.add(new THREE.AmbientLight(0x404050,1.2)); const sunLight=new THREE.PointLight(0xffffff,3,0,0); scene.add(sunLight);
  { const n=phone?800:2500,p=[]; for(let i=0;i<n;i++){const v=new THREE.Vector3().randomDirection().multiplyScalar(300+Math.random()*400);p.push(v.x,v.y,v.z);} const geo=new THREE.BufferGeometry(); geo.setAttribute('position',new THREE.Float32BufferAttribute(p,3)); scene.add(new THREE.Points(geo,new THREE.PointsMaterial({size:1.2,color:0xbfcfff,sizeAttenuation:false}))); }
  const dist=a=>2.2*Math.sqrt(a)*2;   // compressed: sqrt(AU)
  let trueScale=false;
  // true scale: Sun radius = 1.2 units, others proportional. Exaggerated: log-ish
  const size=b=>trueScale?1.2*b.r/sunB.r:(b.type==='star'?1.2:0.12+0.09*Math.log2(b.r/1000+1));
  const labelEls=[];
  const B3=B.filter(b=>b.type==='star'||(b.r!=null&&(b.a!=null||(b.parent==='Earth'&&b.P!=null))));
  const objs=B3.map(b=>{
    const mat=b.type==='star'?new THREE.MeshBasicMaterial({color:b.color||'#ffd27a'}):new THREE.MeshStandardMaterial({color:b.color||'#aaa',roughness:.9});
    const m=new THREE.Mesh(new THREE.SphereGeometry(1,phone?20:40,phone?12:24),mat); m.userData.b=b; scene.add(m);
    if(/saturn/i.test(b.name)){ const ring=new THREE.Mesh(new THREE.RingGeometry(1.3,2.2,64),new THREE.MeshBasicMaterial({color:0xd8c89a,side:THREE.DoubleSide,transparent:true,opacity:.55})); ring.rotation.x=Math.PI/2.3; m.add(ring); }
    if(b.a!=null&&!b.parent){ const R=dist(b.a); scene.add(new THREE.LineLoop(new THREE.BufferGeometry().setFromPoints(Array.from({length:160},(_,k)=>new THREE.Vector3(Math.cos(k/160*6.2832)*R,0,Math.sin(k/160*6.2832)*R))),new THREE.LineBasicMaterial({color:0x2a3a6a}))); }
    const el=document.createElement('span'); el.className='v3-label'; el.textContent=b.name.replace(' (dwarf planet)',''); stage.appendChild(el); labelEls.push([el,m]);
    m.userData.ph=Math.random()*6.2832; return m; });
  const rescale=()=>objs.forEach(m=>m.scale.setScalar(Math.max(size(m.userData.b),trueScale?0.0008:0)));
  rescale();
  let sel=null;
  B.forEach((b,i)=>{const x=document.createElement('button');x.textContent=b.name.replace(' (dwarf planet)','');x.setAttribute('aria-pressed','false');x.onclick=()=>{select(i)};if(!B3.includes(b))x.title='facts only (not drawn in 3D)';bar.appendChild(x);});
  function select(i){ sel=objs[B3.indexOf(B[i])]||null; [...bar.children].forEach((x,k)=>x.setAttribute('aria-pressed',k===i)); showCard(B[i]); }
  const sc=document.getElementById('ss-scale'); sc.onclick=()=>{trueScale=!trueScale; sc.textContent='Sizes: '+(trueScale?'true scale':'exaggerated'); sc.setAttribute('aria-pressed',trueScale); rescale();};
  let paused=false; const pb=document.getElementById('ss-pause'); pb.onclick=()=>{paused=!paused;pb.textContent=paused?'Play':'Pause';pb.setAttribute('aria-pressed',paused);};
  const sp=document.getElementById('ss-speed'), rate=document.getElementById('ss-rate');
  const dps=()=>Math.pow(10,+sp.value); const showRate=()=>rate.textContent=`1 second = ${fmt(dps(),'days',2)}`; sp.oninput=showRate; showRate();
  const ray=new THREE.Raycaster(), mv=new THREE.Vector2();
  renderer.domElement.addEventListener('click',e=>{const r=renderer.domElement.getBoundingClientRect(); mv.set((e.clientX-r.left)/r.width*2-1,-(e.clientY-r.top)/r.height*2+1); ray.setFromCamera(mv,camera); const h=ray.intersectObjects(objs,false)[0]; if(h) select(B.indexOf(h.object.userData.b));});
  function resize(){const w=stage.clientWidth,h=stage.clientHeight;renderer.setSize(w,h,false);camera.aspect=w/h;camera.updateProjectionMatrix();}
  new ResizeObserver(resize).observe(stage); resize();
  select(Math.max(0,B.indexOf(earthB)));
  let days=0,last=performance.now(); const v=new THREE.Vector3(); const earthObj=objs[B3.indexOf(earthB)];
  renderer.setAnimationLoop(now=>{ const dt=Math.min(.05,(now-last)/1000); last=now; if(document.hidden) return; if(!paused) days+=dt*dps();
    objs.forEach(m=>{const b=m.userData.b; if(b.type==='star'||b.P==null) return; const ang=m.userData.ph+days/b.P*6.2832;
      if(b.parent&&earthObj){ const R=Math.max(earthObj.scale.x*2.5,.25); m.position.set(earthObj.position.x+Math.cos(ang)*R,0,earthObj.position.z+Math.sin(ang)*R); }
      else m.position.set(Math.cos(ang)*dist(b.a),0,Math.sin(ang)*dist(b.a));
      if(b.rotation_hours) m.rotation.y+=dt*dps()*24/b.rotation_hours*0.05; });
    if(sel){ controls.target.lerp(sel.position,.08); }
    controls.update(); renderer.render(scene,camera);
    const w=stage.clientWidth,h=stage.clientHeight; labelEls.forEach(([el,m])=>{v.copy(m.position);v.project(camera);const ok=v.z<1&&Math.abs(v.x)<1&&Math.abs(v.y)<1;el.style.display=ok?'block':'none';if(ok){el.style.left=(v.x+1)/2*w+'px';el.style.top=(1-v.y)/2*h+'px';}});
  });
})();
