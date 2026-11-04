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
 ,pulsar:{
  name:"Pulsar",noSpag:true,
  sliders:[
   {id:"period",label:"Spin period P",min:-2.854,max:1,default:-1.4815,step:0.001,log:true,unit:"s",fmt:x=>x<1?fmt(x*1000,1)+" ms":fmt(x,2)+" s",tooltip:"Time for one full turn (log scale, 1.4 ms to 10 s). Fastest known pulsar: about 1.4 ms (716 turns per second). Crab: about 33 ms."},
   {id:"bfield",label:"Magnetic field B",min:8,max:15,default:12.6,step:0.01,log:true,unit:"gauss",fmt:x=>fmt(x,0)+" G",tooltip:"Surface field. Normal pulsars ~1e12 G, millisecond pulsars ~1e8–1e9 G, magnetars 1e14–1e15 G. (1 tesla = 10,000 gauss.)"},
   {id:"tilt",label:"Beam tilt α",min:0,max:90,default:45,step:1,unit:"°",tooltip:"Angle between the magnetic axis (where the beams come out) and the spin axis."},
   {id:"width",label:"Beam half-width ρ",min:2,max:30,default:10,step:1,unit:"°",tooltip:"How wide each beam cone is (half-angle). Real beams are roughly a few to tens of degrees."},
   {id:"view",label:"Viewing angle ζ",min:0,max:180,default:50,step:1,unit:"°",tooltip:"Angle between the spin axis and the direction to Earth. You only see pulses if a beam sweeps across Earth: |ζ − α| < ρ."},
   {id:"mass",label:"Mass",min:1.1,max:2.2,default:1.4,step:0.01,unit:"suns",tooltip:"Neutron star mass. Most are near 1.4 suns; the heaviest well-measured ones are around 2 suns."},
   {id:"radius",label:"Radius",min:10,max:12,default:12,step:0.1,unit:"km",tooltip:"Neutron star radius, roughly 10–12 km (the exact value is still being measured)."}
  ],
  presets:[
   {name:"Crab Pulsar",v:{period:0.0335,bfield:3.8e12,tilt:45,width:12,view:49},note:"Crab: P ≈ 33.5 ms (~29.9 turns/s), B ≈ 4×10¹² G, slowing by about 4.2×10⁻¹³ s every second, about 6,500 light-years away. Clicks blur into a buzzing growl."},
   {name:"Vela",v:{period:0.0893,bfield:3.4e12,tilt:45,width:12,view:49},note:"Vela: P ≈ 89 ms (~11 turns/s). A fast rattle."},
   {name:"Slow pulsar (~1 s)",v:{period:1.0,bfield:1e12,tilt:30,width:10,view:38},note:"P ≈ 1 s. Ticks are clearly separate, like a clock."},
   {name:"Millisecond pulsar (716 Hz)",v:{period:0.0013963,bfield:3e8,tilt:60,width:20,view:70},note:"PSR J1748−2446ad, about 716 turns per second: the ticks merge into a musical note (roughly F5)."}
  ],
  compute(v){
   const P=v.period,R=v.radius*1e3,M=v.mass*MSUN,I=1e45; // I in g cm^2
   const f=1/P,vs=2*Math.PI*R/P,rlc=C*P/(2*Math.PI);
   const Pdot=Math.pow(v.bfield/3.2e19,2)/P; // from B ≈ 3.2e19 √(P Pdot) G
   const Edot=4*Math.PI*Math.PI*I*Pdot/Math.pow(P,3); // erg/s
   const age=P/(2*Pdot)/3.156e7;
   const vesc=Math.sqrt(2*G*M/R),gs=G*M/(R*R);
   const D=Math.PI/180,a=v.tilt*D,z=v.view*D,w=v.width*D;
   const prof=ph=>{const ct=Math.cos(a)*Math.cos(z)+Math.sin(a)*Math.sin(z)*Math.cos(ph);const th=Math.acos(Math.max(-1,Math.min(1,ct)));
     return Math.exp(-Math.pow(th/w,2)*2.3)+Math.exp(-Math.pow((Math.PI-th)/w,2)*2.3)}; // two poles; ~10% at beam edge
   const main=prof(0),inter=prof(Math.PI);
   return {P,f,vs,rlc,Pdot,Edot,age,vesc,gs,prof,main,inter,seen:Math.max(main,inter)>0.1};
  },
  readouts:[
   {label:"Spin frequency",val:d=>fmt(d.f,d.f<10?2:1)+" turns per second (Hz)",formula:"f = 1/P"},
   {label:"Equator surface speed",val:d=>fmt(d.vs/1e3,0)+" km/s ("+fmt(d.vs/C*100,d.vs/C<0.01?3:1)+"% of c)",formula:"v = 2πR / P"},
   {label:"Light cylinder radius",val:d=>fmtLen(d.rlc),formula:"R_LC = cP / 2π (where co-rotating field would have to move at light speed)"},
   {label:"Do we see pulses?",val:d=>d.seen?(d.inter>0.1&&d.main>0.1?"Yes, both beams (main pulse + interpulse)":"Yes, one beam per turn"):"No. Beams miss Earth (|ζ − α| > ρ)",formula:"visible if |ζ − α| < ρ (or the opposite pole: |180° − ζ − α| < ρ)"},
   {label:"Spin-down rate Ṗ (implied)",val:d=>fmt(d.Pdot,2)+" s/s",formula:"from B ≈ 3.2×10¹⁹ √(P Ṗ) G → Ṗ = (B / 3.2×10¹⁹)² / P",note:"Estimate from the dipole model"},
   {label:"Spin-down power",val:d=>fmt(d.Edot,2)+" erg/s ("+fmt(d.Edot*1e-7,2)+" W)",formula:"Ė = 4π² I Ṗ / P³, I ≈ 10⁴⁵ g cm²",note:"Approximate"},
   {label:"Characteristic age",val:d=>fmt(d.age,2)+" years",formula:"τ = P / (2Ṗ)",note:"Rough only; overestimates real ages (the Crab is really ~970 years old, supernova seen in 1054)"},
   {label:"Escape velocity",val:d=>fmt(d.vesc/1e3,0)+" km/s ("+fmt(d.vesc/C*100,0)+"% of c)",formula:"v_esc = √(2GM/R) (Newtonian; GR changes this somewhat)"},
   {label:"Surface gravity",val:d=>fmt(d.gs,2)+" m/s² (~"+fmt(d.gs/9.81,2)+" × Earth)",formula:"g = GM/R² (Newtonian)"}
  ],
  draw:drawPulsar
 }
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

function drawPulsar(ctx,st,v,d,dt){
 const {w,h}=st;const stripH=Math.min(70,h*0.16);const cx=w/2,cy=(h-stripH)/2;const D=Math.PI/180;
 // visual rotation: real rate if slow, capped at ~1.5 turns/s for display (true rate is used for sound)
 const visRate=Math.min(1/d.P,1.5);st.phase=((st.phase||0)+dt*visRate*2*Math.PI*(st.spinMul||1))%(2*Math.PI);
 const ph=st.phase,a=v.tilt*D,z=v.view*D,wd=v.width*D;
 const Rpx=Math.min(w,h)*0.07,L=Math.min(w,h-stripH)*0.46;
 // spin axis
 ctx.strokeStyle="rgba(159,180,255,.35)";ctx.setLineDash([4,6]);ctx.beginPath();ctx.moveTo(cx,cy-L);ctx.lineTo(cx,cy+L);ctx.stroke();ctx.setLineDash([]);
 // Earth direction marker (in screen plane, angle ζ from the spin axis)
 const ex=cx+Math.sin(z)*L*0.98,ey=cy-Math.cos(z)*L*0.98;
 // magnetic axis in 3D: x right, y up, zz toward viewer
 const mx=Math.sin(a)*Math.cos(ph),my=Math.cos(a),mz=Math.sin(a)*Math.sin(ph);
 const I=d.prof(ph);
 ctx.save();ctx.globalCompositeOperation="lighter";
 for(const sg of[1,-1]){
  const bx=mx*sg,by=my*sg,bz=mz*sg;const ang=Math.atan2(-by,bx);const len=L*Math.hypot(bx,by)+1;
  const depth=0.55+0.45*bz;
  const gr=ctx.createRadialGradient(cx,cy,Rpx*0.5,cx,cy,len);gr.addColorStop(0,`rgba(170,210,255,${0.55*depth})`);gr.addColorStop(1,"rgba(120,160,255,0)");
  ctx.fillStyle=gr;ctx.beginPath();ctx.moveTo(cx,cy);ctx.arc(cx,cy,len,ang-wd,ang+wd);ctx.closePath();ctx.fill();
 }
 // magnetic field loops (visual)
 ctx.strokeStyle="rgba(140,120,255,.25)";ctx.lineWidth=1;
 for(const k of[1.8,2.6,3.6]){for(const sg of[1,-1]){ctx.beginPath();for(let t=0;t<=40;t++){const th=t/40*Math.PI;const r=Rpx*k*Math.pow(Math.sin(th),2)+Rpx*0.9;
   const px=r*Math.sin(th)*sg,py=r*Math.cos(th);const ax=Math.atan2(mx,my);const xx=px*Math.cos(ax)+py*Math.sin(ax),yy=-px*Math.sin(ax)+py*Math.cos(ax);
   t?ctx.lineTo(cx+xx,cy-yy):ctx.moveTo(cx+xx,cy-yy)}ctx.stroke()}}
 // star
 const sg2=ctx.createRadialGradient(cx,cy,0,cx,cy,Rpx*2.2);sg2.addColorStop(0,"rgba(230,240,255,1)");sg2.addColorStop(0.45,"rgba(150,190,255,.6)");sg2.addColorStop(1,"rgba(80,120,255,0)");
 ctx.fillStyle=sg2;ctx.beginPath();ctx.arc(cx,cy,Rpx*2.2,0,6.283);ctx.fill();
 ctx.restore();
 // Earth + flash
 if(I>0.1){ctx.fillStyle=`rgba(255,255,220,${Math.min(1,I)*0.5})`;ctx.beginPath();ctx.arc(ex,ey,10+20*I,0,6.283);ctx.fill();}
 ctx.fillStyle="#4fa3ff";ctx.beginPath();ctx.arc(ex,ey,6,0,6.283);ctx.fill();ctx.fillStyle="#cfe";ctx.font="12px system-ui";ctx.fillText("Earth",ex+9,ey+4);
 // pulse profile strip: 2 turns
 const y0=h-stripH;ctx.fillStyle="rgba(20,20,40,.85)";ctx.fillRect(0,y0,w,stripH);
 ctx.strokeStyle="#ffcf8a";ctx.lineWidth=1.5;ctx.beginPath();const pad=8,ww=w-2*pad;
 for(let i=0;i<=400;i++){const p=i/400*4*Math.PI;const yy=y0+stripH-8-Math.min(1,d.prof(p))*(stripH-24);i?ctx.lineTo(pad+i/400*ww,yy):ctx.moveTo(pad,yy)}ctx.stroke();
 const cxp=pad+(ph/(4*Math.PI))*ww;ctx.strokeStyle="rgba(255,255,255,.6)";ctx.beginPath();ctx.moveTo(cxp,y0+4);ctx.lineTo(cxp,h-4);ctx.stroke();
 ctx.fillStyle="#aab";ctx.fillText("Pulse profile (brightness seen from Earth over 2 turns)",pad,y0+14);
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
  if(!obj.noSpag){
  // spaghettification check
  const sp=document.createElement("div");sp.className="bhsim-spag";
  sp.innerHTML='<h3>Spaghettification check</h3><label>Your height (m) <input type="number" id="sim-height" value="1.8" min="0.1" step="0.1"></label><p class="bhsim-spag-out"></p><p class="bhsim-small">Uses the Distance slider. Tidal stretch ≈ 2GML / r³ (Newtonian estimate).</p>';
  panel.appendChild(sp);
  sp.querySelector("input").addEventListener("input",update);
  }
  root.appendChild(panel);
  adv.querySelector("input").addEventListener("change",e=>{root.classList.toggle("bhsim-advanced",e.target.checked)});
 }
 const st={w:0,h:0,phase:0,particles:makeParticles(full?320:220),stars:[],showMarker:full};
 function resize(){const dpr=Math.min(window.devicePixelRatio||1,2);const r=canvas.getBoundingClientRect();st.w=r.width;st.h=r.height;canvas.width=r.width*dpr;canvas.height=r.height*dpr;ctx.setTransform(dpr,0,0,dpr,0,0);st.stars=makeStars(Math.round(r.width*r.height/1800),r.width,r.height)}
 window.addEventListener("resize",resize);resize();
 function update(){
  if(!full)return;const d=obj.compute(vals);
  obj.sliders.forEach(s=>{const b=panel.querySelector(`[data-v="${s.id}"]`);b.textContent=s.fmt?s.fmt(vals[s.id]):(s.log?fmt(vals[s.id],0):fmt(vals[s.id],2))+" "+s.unit});
  readEl.innerHTML=obj.readouts.map(r=>`<div class="bhsim-ro"><span>${r.label}</span><b>${r.val(d)}</b>${r.note?`<em>${r.note}</em>`:""}<code class="bhsim-f">${r.formula}</code></div>`).join("");
  if(opts.onUpdate)opts.onUpdate(d,vals);
  if(obj.noSpag)return;
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
 function set(nv){Object.assign(vals,nv);if(full)obj.sliders.forEach(s=>{if(s.id in nv){root.querySelector("#sim-"+s.id).value=s.log?Math.log10(nv[s.id]):nv[s.id]}});update()}
 return {vals,update,set,st,obj};
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
