/* Event Horizon simulator — config-driven. Add a new object by adding an entry to OBJECTS. */
(function(){
"use strict";
const G=6.674e-11,C=2.998e8,MSUN=1.989e30;
const fmt=(x,d=3)=>{if(!isFinite(x))return"∞";const a=Math.abs(x);if(a!==0&&(a>=1e6||a<1e-2))return x.toExponential(2);return x.toLocaleString(undefined,{maximumFractionDigits:d})};
const fmtLen=m=>m>=1e3?fmt(m/1e3,1)+" km":fmt(m,1)+" m";

const OBJECTS={
 blackhole:{
  name:"Black hole",
  sliders:[
   {id:"mass",label:"Mass",min:0,max:10,default:1,step:0.01,log:true,unit:"suns",tooltip:"Mass in solar masses (log scale, 1 to 10,000,000,000). Horizon size grows directly with mass. Sagittarius A* is about 4 million suns; M87* is about 6.5 billion suns."},
   {id:"spin",label:"Spin a",min:0,max:1,default:0.5,step:0.01,unit:"",tooltip:"Dimensionless spin, 0 = not spinning, 1 = maximum spin. The horizon shrinks as spin rises."},
   {id:"orbit",label:"Orbit speed",min:0,max:3,default:1,step:0.01,unit:"×",tooltip:"Visual speed of orbiting matter (animation multiplier)."},
   {id:"distance",label:"Distance",min:1.05,max:100,default:20,step:0.05,log:false,unit:"horizon radii",tooltip:"Distance from the centre, in horizon radii. Used for the orbital speed and the spaghettification check."}
  ],
  compute(v){
   const M=v.mass*MSUN, gm=G*M/(C*C);
   const rs=2*gm, rplus=gm*(1+Math.sqrt(1-v.spin*v.spin));
   const r=v.distance*rplus;
   const vorb=Math.sqrt(G*M/r);
   return {M,rs,rplus,r,vorb,tidal:L=>2*G*M*L/Math.pow(r,3)};
  },
  readouts:[
   {label:"Schwarzschild radius (no spin)",val:(d)=>fmtLen(d.rs),formula:"r_s = 2GM/c² ≈ 2.95 km × (mass in suns)"},
   {label:"Horizon radius with spin",val:d=>fmtLen(d.rplus),formula:"r₊ = (GM/c²)(1 + √(1 − a²))"},
   {label:"Orbital speed at chosen distance",val:d=>fmt(d.vorb/1e3,0)+" km/s ("+fmt(Math.min(d.vorb/C,9.99)*100,1)+"% of c)",formula:"v ≈ √(GM/r) — Newtonian, rough near the horizon; fine for visuals",note:"Rough approximation near the horizon"}
  ],
  draw:drawBlackHole
 }
 /* pulsar:{ name:"Pulsar", sliders:[...], compute(v){...}, readouts:[...], draw:drawPulsar } */
};

function makeStars(n,w,h){const s=[];for(let i=0;i<n;i++)s.push({x:Math.random()*w,y:Math.random()*h,r:Math.random()*1.3+0.2,t:Math.random()*6.28,s:0.5+Math.random()*2});return s}
function makeParticles(n){const p=[];for(let i=0;i<n;i++)p.push({ang:Math.random()*6.283,rad:1.6+Math.random()*3.4,size:Math.random()*1.8+0.4,hue:20+Math.random()*30});return p}

function drawBlackHole(ctx,st,v,d,dt){
 const {w,h}=st;const cx=w/2,cy=h/2;
 // log mapping: 1 sun -> small, 1e10 -> big, always on screen
 const lm=Math.min(1,Math.log10(v.mass)/10); // 0..1 over 1..1e10 suns
 const base=Math.min(w,h)*(0.06+0.11*lm);
 const R=base*(d.rplus/d.rs)*2*0.5; // spin shrinks horizon (rplus/rs from 1 to 0.5)
 const tilt=0.28; // disc vertical squash
 const inner=R*(3-1.6*v.spin)/1.0*0.75; // ISCO-ish moves inward with spin (visual)
 const outer=Math.min(R*5.2,Math.min(w,h)*0.48/ (1) );
 st.phase+=dt*v.orbit*0.9*(1+v.spin*0.6);
 // back half of disc (behind hole) + lensed arc above
 discHalf(ctx,cx,cy,inner,outer,tilt,st.phase,v.spin,true);
 // lensed image of the far disc arching over the top
 ctx.save();ctx.globalCompositeOperation="lighter";
 for(let i=0;i<6;i++){const rr=R*(1.55+i*0.22);const a=0.18-i*0.025;ctx.strokeStyle=`rgba(255,170,90,${a})`;ctx.lineWidth=R*0.18;ctx.beginPath();ctx.ellipse(cx,cy,rr,rr*(0.95-i*0.03),0,Math.PI*1.05,Math.PI*1.95);ctx.stroke();}
 ctx.restore();
 // photon ring glow
 const g=ctx.createRadialGradient(cx,cy,R*0.95,cx,cy,R*1.7);
 g.addColorStop(0,"rgba(255,230,190,0.95)");g.addColorStop(0.15,"rgba(255,170,90,0.55)");g.addColorStop(1,"rgba(255,120,40,0)");
 ctx.fillStyle=g;ctx.beginPath();ctx.arc(cx,cy,R*1.7,0,6.283);ctx.fill();
 // horizon (shadow)
 ctx.fillStyle="#000";ctx.beginPath();ctx.arc(cx,cy,R*1.02,0,6.283);ctx.fill();
 // front half of disc
 discHalf(ctx,cx,cy,inner,outer,tilt,st.phase,v.spin,false);
 // particles
 ctx.save();ctx.globalCompositeOperation="lighter";
 for(const p of st.particles){
  const rr=inner+(p.rad-1.6)/3.4*(outer-inner);
  p.ang+=dt*v.orbit*2.2*Math.pow(inner/rr,1.5);
  const x=cx+Math.cos(p.ang)*rr, y=cy+Math.sin(p.ang)*rr*tilt;
  const front=Math.sin(p.ang)>0; if(!front&&Math.hypot(x-cx,y-cy)<R*1.05)continue;
  const dop=0.55+0.45*(-Math.cos(p.ang)); // approaching (left side moving toward viewer) brighter
  ctx.fillStyle=`hsla(${p.hue},100%,${55+dop*30}%,${0.3+dop*0.7})`;ctx.beginPath();ctx.arc(x,y,p.size*(0.6+dop),0,6.283);ctx.fill();
 }
 ctx.restore();
 // distance marker (full mode)
 if(st.showMarker){const rr=R*v.distance;if(rr<Math.max(w,h)){ctx.setLineDash([4,6]);ctx.strokeStyle="rgba(159,180,255,0.5)";ctx.lineWidth=1;ctx.beginPath();ctx.ellipse(cx,cy,rr,rr*tilt,0,0,6.283);ctx.stroke();ctx.setLineDash([]);}}
}
function discHalf(ctx,cx,cy,inner,outer,tilt,phase,spin,back){
 ctx.save();ctx.beginPath();
 if(back)ctx.rect(0,0,cx*2,cy);else ctx.rect(0,cy,cx*2,cy*2);
 ctx.clip();ctx.globalCompositeOperation="lighter";
 const rings=26;
 for(let i=0;i<rings;i++){
  const f=i/(rings-1);const rr=inner+(outer-inner)*f;
  const heat=1-f;
  // doppler beaming: left side approaching -> brighter. Use gradient across x.
  const lg=ctx.createLinearGradient(cx-rr,0,cx+rr,0);
  const b=0.25+0.5*heat;
  lg.addColorStop(0,`rgba(255,${200+40*heat|0},${150+80*heat|0},${Math.min(1,b*1.6)})`);
  lg.addColorStop(0.5,`rgba(255,${120+60*heat|0},${40+40*heat|0},${b*0.7})`);
  lg.addColorStop(1,`rgba(200,60,20,${b*0.25})`);
  ctx.strokeStyle=lg;ctx.lineWidth=(outer-inner)/rings*1.6;
  ctx.beginPath();ctx.ellipse(cx,cy,rr,rr*tilt,0,0,6.283);ctx.stroke();
 }
 // turbulent streaks
 for(let k=0;k<14;k++){const rr=inner+(outer-inner)*((k*0.137)%1);const a0=phase*Math.pow(inner/rr,1.5)*2+k;
  ctx.strokeStyle="rgba(255,220,170,0.12)";ctx.lineWidth=1.5;ctx.beginPath();ctx.ellipse(cx,cy,rr,rr*tilt,0,a0,a0+0.9);ctx.stroke();}
 ctx.restore();
}

function mount(root,opts){
 opts=opts||{};const obj=OBJECTS[opts.object||"blackhole"];const full=opts.mode!=="hero";
 root.innerHTML="";root.classList.add("bhsim");
 const canvas=document.createElement("canvas");canvas.className="bhsim-canvas";root.appendChild(canvas);
 const ctx=canvas.getContext("2d");
 const vals={};obj.sliders.forEach(s=>{vals[s.id]=s.log?Math.pow(10,s.default):s.default});
 let panel,readEl,advBox;
 if(full){
  panel=document.createElement("div");panel.className="bhsim-panel";
  const adv=document.createElement("label");adv.className="bhsim-adv";adv.innerHTML='<input type="checkbox"> Advanced (show formulas)';
  obj.sliders.forEach(s=>{
   const l=document.createElement("label");l.title=s.tooltip;l.className="bhsim-row";
   l.innerHTML=`<span>${s.label} <i class="bhsim-q" title="${s.tooltip}">?</i> <b data-v="${s.id}"></b></span><input type="range" id="sim-${s.id}" min="${s.min}" max="${s.max}" step="${s.step}" value="${s.default}" aria-label="${s.label}">`;
   const inp=l.querySelector("input");
   inp.addEventListener("input",()=>{const x=parseFloat(inp.value);vals[s.id]=s.log?Math.pow(10,x):x;update()});
   panel.appendChild(l);
  });
  panel.appendChild(adv);
  readEl=document.createElement("div");readEl.className="bhsim-read";panel.appendChild(readEl);
  // spaghettification check
  const sp=document.createElement("div");sp.className="bhsim-spag";
  sp.innerHTML='<h3>Spaghettification check</h3><label>Your height (m) <input type="number" id="sim-height" value="1.8" min="0.1" step="0.1"></label><p class="bhsim-spag-out"></p><p class="bhsim-small">Uses the Distance slider. Tidal stretch ≈ 2GML / r³ (Newtonian estimate).</p>';
  panel.appendChild(sp);
  sp.querySelector("input").addEventListener("input",update);
  root.appendChild(panel);
  adv.querySelector("input").addEventListener("change",e=>{root.classList.toggle("bhsim-advanced",e.target.checked)});
 }
 const st={w:0,h:0,phase:0,particles:makeParticles(full?320:220),stars:[],showMarker:full};
 function resize(){const dpr=Math.min(window.devicePixelRatio||1,2);const r=canvas.getBoundingClientRect();st.w=r.width;st.h=r.height;canvas.width=r.width*dpr;canvas.height=r.height*dpr;ctx.setTransform(dpr,0,0,dpr,0,0);st.stars=makeStars(Math.round(r.width*r.height/1800),r.width,r.height)}
 window.addEventListener("resize",resize);resize();
 function update(){
  if(!full)return;const d=obj.compute(vals);
  obj.sliders.forEach(s=>{const b=panel.querySelector(`[data-v="${s.id}"]`);b.textContent=(s.log?fmt(vals[s.id],0):fmt(vals[s.id],2))+" "+s.unit});
  readEl.innerHTML=obj.readouts.map(r=>`<div class="bhsim-ro"><span>${r.label}</span><b>${r.val(d)}</b>${r.note?`<em>${r.note}</em>`:""}<code class="bhsim-f">${r.formula}</code></div>`).join("");
  const L=parseFloat(root.querySelector("#sim-height").value)||1.8;const a=d.tidal(L);
  let msg;if(a<10)msg=`✅ Fine. Stretch ≈ ${fmt(a,2)} m/s² across your body (Earth gravity is 9.8).`;
  else if(a<1000)msg=`⚠️ Painful. Stretch ≈ ${fmt(a,0)} m/s² — about ${fmt(a/9.81,0)}× Earth gravity pulling your head and feet apart.`;
  else msg=`🍝 Spaghetti. Stretch ≈ ${fmt(a,0)} m/s² (${fmt(a/9.81,0)} g). Your body would be torn apart.`;
  const hz=obj.compute(Object.assign({},vals,{distance:1}));const ah=hz.tidal(L);
  msg+=` <br><span class="bhsim-small">At the horizon itself: ${fmt(ah,ah<10?2:0)} m/s². Bigger black holes are gentler at the horizon, because tidal stretch falls as 1/M².</span>`;
  root.querySelector(".bhsim-spag-out").innerHTML=msg;
 }
 update();
 let last=performance.now(),vis=true;
 document.addEventListener("visibilitychange",()=>{vis=!document.hidden;last=performance.now()});
 const reduce=window.matchMedia&&matchMedia("(prefers-reduced-motion: reduce)").matches;
 function frame(t){
  const dt=Math.min(0.05,(t-last)/1000)*(reduce?0.2:1);last=t;
  if(vis){
   ctx.fillStyle="#03030a";ctx.fillRect(0,0,st.w,st.h);
   for(const s of st.stars){s.t+=dt*s.s;ctx.fillStyle=`rgba(220,225,255,${0.35+0.35*Math.sin(s.t)})`;ctx.fillRect(s.x,s.y,s.r,s.r)}
   obj.draw(ctx,st,vals,obj.compute(vals),dt);
  }
  requestAnimationFrame(frame);
 }
 requestAnimationFrame(frame);
 return {vals,update};
}
// inject styles once
const css=`.bhsim{display:grid;gap:1rem;margin:1.5rem 0}.bhsim-canvas{width:100%;height:min(60vh,460px);border-radius:12px;display:block;background:#03030a;box-shadow:0 0 40px rgba(108,92,231,.25)}
.bhsim-panel{display:grid;gap:.8rem;background:#0d0d1c;border-radius:12px;padding:1rem}.bhsim-row{display:grid;gap:.2rem}.bhsim-row input{width:100%;min-height:32px;accent-color:#6c5ce7;touch-action:pan-y}
.bhsim-row b{color:#ffcf8a;font-weight:600}.bhsim-q{font-style:normal;display:inline-block;width:1.1em;height:1.1em;line-height:1.1em;text-align:center;border-radius:50%;background:#222244;color:#9fb4ff;font-size:.8em;cursor:help}
.bhsim-read{display:grid;gap:.6rem;grid-template-columns:repeat(auto-fit,minmax(220px,1fr))}.bhsim-ro{background:#141428;border-radius:8px;padding:.6rem .8rem;display:flex;flex-direction:column}
.bhsim-ro span{color:#9aa;font-size:.85em}.bhsim-ro b{font-size:1.15em;color:#fff}.bhsim-ro em{color:#ffb070;font-size:.8em}.bhsim-f{display:none;color:#9fb4ff;font-size:.8em;margin-top:.3rem;white-space:normal}
.bhsim-advanced .bhsim-f{display:block}.bhsim-spag{background:#141428;border-radius:8px;padding:.6rem .8rem}.bhsim-spag h3{margin:.2rem 0;font-size:1rem}.bhsim-spag input{width:6em;background:#07070f;color:#fff;border:1px solid #334;border-radius:6px;padding:.2rem}
.bhsim-small{color:#889;font-size:.82em}@media(min-width:860px){.bhsim-full{grid-template-columns:1.4fr 1fr}.bhsim-full .bhsim-canvas{height:520px}}`;
const style=document.createElement("style");style.textContent=css;document.head.appendChild(style);
window.BHSim={mount,OBJECTS};
})();
