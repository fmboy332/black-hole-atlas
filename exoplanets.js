// Exoplanet viewer (Mochi). Single data path constant (Oraly's checked file).
const DATA_PATH = './data/exoplanets.json';
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/OrbitControls.js';
const FEATURED = ['Proxima Cen b','TRAPPIST-1 e','Kepler-452 b','51 Peg b','HD 209458 b','55 Cnc e','Kepler-16 b','WASP-12 b','TOI-700 d','K2-18 b','LHS 1140 b','HD 189733 b'];
const phone=matchMedia('(max-width:700px)').matches;
const NM='not measured';
const num=(v,d=3)=>v==null?NM:(+(+v).toPrecision(d)).toLocaleString();
const esc=s=>String(s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
function teffColor(T){ if(!T) return new THREE.Color(0xffffff); // approximate blackbody tint (Tanner Helland fit), illustrative
  const t=T/100; let r,g,b; r=t<=66?255:329.7*Math.pow(t-60,-.1332); g=t<=66?99.47*Math.log(t)-161.1:288.1*Math.pow(t-60,-.0755); b=t>=66?255:t<=19?0:138.5*Math.log(t-10)-305;
  const c=x=>Math.max(0,Math.min(255,x))/255; return new THREE.Color(c(r),c(g),c(b)); }
const hasGL=()=>{try{const c=document.createElement('canvas');return !!(c.getContext('webgl2')||c.getContext('webgl'));}catch(e){return false;}};

(async()=>{
  const card=document.getElementById('ex-card');
  let P; try{ const j=await (await fetch(DATA_PATH)).json(); P=Array.isArray(j)?j:j.planets; if(!P?.length) throw 0; }catch(e){ card.textContent='Could not load exoplanet data.'; return; }
  const feat=document.getElementById('ex-feat'), pick=document.getElementById('ex-pick');
  P.slice().sort((a,b)=>a.name.localeCompare(b.name)).forEach(p=>pick.add(new Option(p.name+(p.label?' — '+p.label:''),p.name)));
  FEATURED.filter(n=>P.some(p=>p.name===n)).forEach(n=>{const b=document.createElement('button');b.textContent=n;b.setAttribute('aria-pressed','false');b.onclick=()=>show(n);feat.appendChild(b);});
  pick.onchange=()=>show(pick.value);
  const stage=document.getElementById('ex-stage'), gl=hasGL();
  let three=null; if(gl) three=initThree(); else stage.insertAdjacentHTML('beforeend','<p style="padding:3rem 1rem">3D needs WebGL, which is not available here. Facts and the size comparison still work.</p>');
  function show(name){
    const p=P.find(x=>x.name===name); if(!p) return; pick.value=name; [...feat.children].forEach(b=>b.setAttribute('aria-pressed',b.textContent===name));
    const dly=p.distance_ly??(p.distance_pc!=null?p.distance_pc*3.26156:null);
    const rows=[['Type',p.label||'—'],['Host star',p.host],['Distance',dly!=null?'≈ '+num(dly)+' light-years':NM],['Orbital period',p.period_days!=null?num(p.period_days,4)+' days'+(p.period_days>730?` (${num(p.period_days/365.25)} years)`:''):NM],
      ['Orbit size',p.semimajor_au!=null?num(p.semimajor_au)+' AU':NM],['Radius',p.radius_earth!=null?num(p.radius_earth)+' × Earth':NM],['Mass',p.mass_earth!=null?num(p.mass_earth)+' × Earth'+(/radial/i.test(p.method||'')?' (may be a minimum mass)':''):NM],
      ['Equilibrium temp.',p.eq_temp_K!=null?num(p.eq_temp_K)+' K (calculated)':NM],['Star temperature',p.star_teff_K!=null?num(p.star_teff_K)+' K':NM],['Planets in system',p.planets_in_system??NM],
      ['Discovered',p.discovered??NM],['Method',p.method||NM],['Surface look','<span class="look">artist\'s impression</span>']];
    card.innerHTML=`<h2>${esc(p.name)}</h2>${p.fact?`<p>${esc(p.fact)}<span class="ctag c-${esc(p.confidence||'')}" title="Confidence">${esc(p.confidence||'untagged')}</span></p>`:''}
      <dl>${rows.map(r=>`<dt>${r[0]}</dt><dd>${typeof r[1]==='string'&&r[1].startsWith('<span')?r[1]:esc(r[1])}</dd>`).join('')}</dl>
      <p class="v3-note">Source: <a href="https://exoplanetarchive.ipac.caltech.edu/overview/${encodeURIComponent(p.host)}" target="_blank" rel="noopener">NASA Exoplanet Archive</a></p>`;
    drawCmp(p); if(three) three.set(p);
  }
  function drawCmp(p){
    const c=document.getElementById('ex-cmp'), d=devicePixelRatio||1, w=c.clientWidth, h=c.clientHeight; c.width=w*d; c.height=h*d; const g=c.getContext('2d'); g.scale(d,d); g.clearRect(0,0,w,h);
    const J=11.21, items=[['Earth',1,'#4f8fe0'],[p.name,p.radius_earth,'#ffb86b'],['Jupiter',J,'#d9b38c']];
    const maxR=Math.max(J,p.radius_earth||0), k=(h*0.42)/maxR; let x=20; g.font='13px system-ui'; g.textAlign='center';
    items.forEach(([n,r,col])=>{ const R=r!=null?Math.max(1,r*k):h*0.2; const cx=x+R; g.beginPath(); g.arc(cx,h*0.48,R,0,7);
      if(r==null){ g.setLineDash([4,4]); g.strokeStyle='#888'; g.stroke(); g.setLineDash([]); g.fillStyle='#aaa'; g.fillText('radius',cx,h*0.46); g.fillText(NM,cx,h*0.46+15);} else { g.fillStyle=col; g.fill(); }
      g.fillStyle='#e8ecf8'; g.fillText(n+(r!=null?` (${num(r)}× Earth)`:''),cx,h-8); x=cx+R+Math.max(30,g.measureText(n).width/2+30); });
  }
  function initThree(){
    const renderer=new THREE.WebGLRenderer({antialias:!phone}); renderer.setPixelRatio(Math.min(devicePixelRatio,phone?1.5:2)); stage.prepend(renderer.domElement);
    renderer.domElement.setAttribute('aria-label','3D view of the selected planet orbiting its star');
    const scene=new THREE.Scene(), cam=new THREE.PerspectiveCamera(45,1,.01,500); cam.position.set(0,3.5,8);
    const ctl=new OrbitControls(cam,renderer.domElement); ctl.enableDamping=true; ctl.minDistance=2; ctl.maxDistance=40;
    { const n=phone?700:2000,a=[]; for(let i=0;i<n;i++){const v=new THREE.Vector3().randomDirection().multiplyScalar(150+Math.random()*100);a.push(v.x,v.y,v.z);} const g=new THREE.BufferGeometry(); g.setAttribute('position',new THREE.Float32BufferAttribute(a,3)); scene.add(new THREE.Points(g,new THREE.PointsMaterial({size:1.1,color:0xcfd8ff,sizeAttenuation:false}))); }
    const star=new THREE.Mesh(new THREE.SphereGeometry(1,48,24),new THREE.MeshBasicMaterial()); scene.add(star);
    const tc=document.createElement('canvas'); tc.width=tc.height=64; { const g=tc.getContext('2d'),r=g.createRadialGradient(32,32,0,32,32,32); r.addColorStop(0,'#fff');r.addColorStop(.3,'#fff8');r.addColorStop(1,'#0000'); g.fillStyle=r; g.fillRect(0,0,64,64); }
    const glow=new THREE.Sprite(new THREE.SpriteMaterial({map:new THREE.CanvasTexture(tc),blending:THREE.AdditiveBlending,transparent:true,depthWrite:false})); glow.scale.setScalar(4); scene.add(glow);
    const light=new THREE.PointLight(0xffffff,4,0,0); scene.add(light); scene.add(new THREE.AmbientLight(0x223,1));
    const tex=document.createElement('canvas'); tex.width=512; tex.height=256; const texT=new THREE.CanvasTexture(tex); texT.colorSpace=THREE.SRGBColorSpace;
    const planet=new THREE.Mesh(new THREE.SphereGeometry(1,phone?32:64,phone?16:32),new THREE.MeshStandardMaterial({map:texT,roughness:.85})); scene.add(planet);
    const orbit=new THREE.LineLoop(new THREE.BufferGeometry(),new THREE.LineBasicMaterial({color:0x3a4f8a})); scene.add(orbit);
    function paint(p){ const g=tex.getContext('2d'); const gas=(p.radius_earth??(p.mass_earth>50?10:1.5))>4, hot=(p.eq_temp_K||300)>1000;
      let s=[...p.name].reduce((a,c)=>a*31+c.charCodeAt(0)>>>0,7); const R=()=>(s=(s*1664525+1013904223)>>>0)/4294967296;
      const base=hot?[200,90,50]:gas?[190+R()*40|0,150+R()*50|0,110+R()*60|0]:(p.eq_temp_K||300)<250?[170,190,215]:[110+R()*60|0,100+R()*40|0,80+R()*40|0];
      g.fillStyle=`rgb(${base})`; g.fillRect(0,0,512,256);
      if(gas){ for(let y=0;y<256;y+=2){ const k=Math.sin(y*.09+R()*.4)*30+Math.sin(y*.31)*12; g.fillStyle=`rgba(${base[0]+k|0},${base[1]+k|0},${base[2]+k*.6|0},.55)`; g.fillRect(0,y,512,2);} }
      else for(let i=0;i<260;i++){ const x=R()*512,y=R()*256,r=4+R()*30,k=R()<.5?-35:30; g.fillStyle=`rgba(${base[0]+k},${base[1]+k},${base[2]+k},.35)`; g.beginPath(); g.ellipse(x,y,r*1.6,r,0,0,7); g.fill(); }
      if(hot){ g.fillStyle='rgba(255,200,80,.25)'; for(let i=0;i<40;i++){ g.fillRect(R()*512,R()*256,30*R(),2);} }
      texT.needsUpdate=true; }
    let cur=null, ang=0;
    function set(p){ cur=p; const col=teffColor(p.star_teff_K); star.material.color.copy(col); glow.material.color.copy(col); light.color.copy(col);
      const T=p.star_teff_K||5000; const sr=Math.max(.5,Math.min(1.4,T/5772)); star.scale.setScalar(sr); glow.scale.setScalar(sr*4.5);
      const a=3.2+Math.log10((p.semimajor_au||.05)/.01+1)*1.2; orbit.geometry.dispose(); orbit.geometry=new THREE.BufferGeometry().setFromPoints(Array.from({length:128},(_,k)=>new THREE.Vector3(Math.cos(k/128*6.2832)*a,0,Math.sin(k/128*6.2832)*a))); orbit.userData.a=a;
      planet.scale.setScalar(Math.max(.18,Math.min(.75,.18+.05*(p.radius_earth??(p.mass_earth>50?11:1.5))))); paint(p); }
    function resize(){const w=stage.clientWidth,h=stage.clientHeight;renderer.setSize(w,h,false);cam.aspect=w/h;cam.updateProjectionMatrix();}
    new ResizeObserver(resize).observe(stage); resize();
    let last=performance.now();
    renderer.setAnimationLoop(now=>{ const dt=Math.min(.05,(now-last)/1000); last=now; if(document.hidden||!cur) return; ang+=dt*.5; const a=orbit.userData.a||4;
      planet.position.set(Math.cos(ang)*a,0,Math.sin(ang)*a); planet.rotation.y+=dt*.4; ctl.update(); renderer.render(scene,cam); });
    return {set};
  }
  show(FEATURED.find(n=>P.some(p=>p.name===n))||P[0].name);
})();
