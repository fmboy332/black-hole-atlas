/* Black hole + neutron star merger: simplified illustration (not numerical relativity). */
(function(){
const G=6.674e-11,C=2.998e8,MS=1.989e30,KM_PER_M=G*MS/C/C/1000,RNS=12; // GM/c^2 ≈ 1.477 km per sun
const P={
 mc:(a,b)=>Math.pow(a*b,0.6)/Math.pow(a+b,0.2),
 isco(m,a){const z1=1+Math.cbrt(1-a*a)*(Math.cbrt(1+a)+Math.cbrt(1-a)),z2=Math.sqrt(3*a*a+z1*z1);return m*KM_PER_M*(3+z2-Math.sqrt((3-z1)*(3+z1+2*z2)))},
 horizon:(m,a)=>m*KM_PER_M*(1+Math.sqrt(1-a*a)),
 rtd:(mb,mn)=>RNS*Math.cbrt(3*mb/mn),
 forb:(M,rkm)=>Math.sqrt(G*M*MS/Math.pow(rkm*1000,3))/(2*Math.PI),
 tmerge:(m1,m2,rkm)=>5/256*Math.pow(C,5)*Math.pow(rkm*1000,4)/(G**3*m1*m2*(m1+m2)*MS**3),
 RAD:0.03 // rough: ~3% of NS mass radiated as gravitational waves
};
P.calc=function(m1,m2,a,r){const M=m1+m2,ri=P.isco(m1,a),rt=P.rtd(m1,m2),dis=rt>=ri;
 return {M,q:m1/m2,mc:P.mc(m1,m2),isco:ri,rtd:rt,dis,rh:P.horizon(m1,a),fgw:2*P.forb(M,r),t:P.tmerge(m1,m2,r),mf:M-P.RAD*m2,rEnd:Math.max(ri,rt)}};
window.MergerPhys=P;

const PRESETS=[
 {name:"GW200105-like (≈9 + 1.9 suns, swallowed whole)",v:{m1:9,m2:1.9,a:0},note:"Roughly the masses LIGO/Virgo reported for GW200105 (approximate). No light was seen, consistent with the star being swallowed whole. Spin set to 0 here as a simplification."},
 {name:"GW200115-like (≈6 + 1.5 suns, probably swallowed whole)",v:{m1:6,m2:1.5,a:0},note:"Roughly the masses reported for GW200115 (approximate). No light was seen; the star was probably swallowed whole. Spin set to 0 here as a simplification."},
 {name:"Light, spinning black hole (disruption)",v:{m1:4,m2:1.3,a:0.9},note:"A made-up example, not a detected event: a light black hole spinning fast in the same direction as the orbit. Here the star is likely torn apart before it falls in (theorised)."}];

function mount(root){
 const $=s=>root.querySelector(s);
 const sl=[["m1","Black hole mass (suns)",3,30,0.1,9],["m2","Neutron star mass (suns)",1.1,2.3,0.05,1.9],["a","Black hole spin a (prograde)",0,0.99,0.01,0],["r0","Starting separation (km)",150,800,10,400],["spd","Playback speed (×)",0.25,3,0.05,1]];
 root.innerHTML='<canvas id="mg-c" aria-label="Animated illustration of a black hole and neutron star merging"></canvas><p id="mg-stage" aria-live="polite"></p>'+
  '<div class="mg-bar"><button id="mg-play">▶ Play</button><button id="mg-pause">⏸ Pause</button><button id="mg-restart">↺ Restart</button></div>'+
  '<div class="mg-bar" id="mg-presets" role="group" aria-label="Presets"></div><p id="mg-note"></p>'+
  '<div class="mg-sl">'+sl.map(s=>`<label>${s[1]}: <b id="mg-${s[0]}-v"></b><input type="range" id="mg-${s[0]}" min="${s[2]}" max="${s[3]}" step="${s[4]}" value="${s[5]}"></label>`).join("")+'</div>'+
  '<p id="mg-verdict"></p><dl id="mg-read" class="mg-read"></dl>';
 const cv=$("#mg-c"),ctx=cv.getContext("2d");const v={};sl.forEach(s=>v[s[0]]=s[5]);
 const reduce=window.matchMedia&&matchMedia("(prefers-reduced-motion: reduce)").matches;
 const st={t:0,playing:false,dur:8,phase:0,stage:"ready",tMerge:0,parts:[],trail:[],shake:0,flash:0,w:0,h:0,stars:[]};
 let d=P.calc(v.m1,v.m2,v.a,v.r0);
 function resize(){const dpr=Math.min(devicePixelRatio||1,2),r=cv.getBoundingClientRect();st.w=r.width;st.h=r.height;cv.width=r.width*dpr;cv.height=r.height*dpr;ctx.setTransform(dpr,0,0,dpr,0,0);
  st.stars=[];for(let i=0;i<st.w*st.h/2500;i++)st.stars.push([Math.random()*st.w,Math.random()*st.h,Math.random()*1.2+.2])}
 addEventListener("resize",resize);resize();
 const fmt=(x,n)=>x.toLocaleString("en",{maximumFractionDigits:n,minimumFractionDigits:n});
 function ft(s){return s<1?fmt(s*1000,0)+" ms":s<120?fmt(s,2)+" s":s<7200?fmt(s/60,1)+" min":fmt(s/3600,1)+" h"}
 function sepNow(){const T=d.t0,re=d.rEnd,tEnd=P.tmerge(v.m1,v.m2,re),real=Math.max(0,T-tEnd),k=Math.min(1,st.t/st.dur);
  const rem=T-k*real;return Math.max(re,Math.pow(rem/T,0.25)*v.r0)}
 function readouts(){const r=st.stage==="inspiral"||st.stage==="ready"?sepNow():d.rEnd,cur=P.calc(v.m1,v.m2,v.a,r);
  const rows=[["Total mass",fmt(d.M,2)+" suns"],["Mass ratio q = M_BH/M_NS",fmt(d.q,2)],["Chirp mass (m₁m₂)^⅗/(m₁+m₂)^⅕",fmt(d.mc,2)+" suns"],
   ["ISCO radius (Bardeen, prograde)",fmt(d.isco,1)+" km"],["Horizon radius",fmt(d.rh,1)+" km"],["Tidal disruption radius ≈ 12 km × (3M_BH/M_NS)^⅓ (rough)",fmt(d.rtd,1)+" km"],
   ["Separation now",fmt(r,0)+" km"],["GW frequency now, 2 × Kepler orbital",fmt(cur.fgw,0)+" Hz"],["Time to merger (Peters, circular orbit)",ft(Math.max(0,cur.t-P.tmerge(v.m1,v.m2,d.rEnd)))+" (real time)"],
   ["Final black hole mass (rough: total − ~3% of NS mass radiated"+(d.dis?"; less if torn-apart matter escapes":"")+")","≈ "+fmt(d.mf,2)+" suns"]];
  $("#mg-read").innerHTML=rows.map(x=>`<div><dt>${x[0]}</dt><dd>${x[1]}</dd></div>`).join("");}
 function update(){sl.forEach(s=>{v[s[0]]=+$("#mg-"+s[0]).value;$("#mg-"+s[0]+"-v").textContent=v[s[0]]});
  d=P.calc(v.m1,v.m2,v.a,v.r0);d.t0=d.t;
  $("#mg-verdict").innerHTML=d.dis?'Verdict: <b>tidal disruption likely</b> (theorised). The star would be torn apart (at about '+fmt(d.rtd,0)+' km) before reaching the ISCO ('+fmt(d.isco,0)+' km). Caution: this is a rough rule; real disruption needs numerical-relativity simulations.':'Verdict: <b>swallowed whole</b>. The ISCO ('+fmt(d.isco,0)+' km) is outside the tidal disruption radius ('+fmt(d.rtd,0)+' km), so the star plunges in before it can be torn apart. No bright flash expected.';
  readouts()}
 root.querySelectorAll("input").forEach(i=>i.addEventListener("input",()=>{update();if(i.id!=="mg-spd")restart(false)}));
 function restart(play,dur){st.t=0;st.phase=0;st.stage="x";setStage(play?"inspiral":"ready");st.parts=[];st.trail=[];st.flash=0;st.shake=0;st.dur=dur||8;st.playing=!!play;update()}
 function setStage(s){if(st.stage!==s){st.stage=s;const L={ready:"Ready. Press Play or pick a preset.",inspiral:"Stage 1: inspiral. The orbit shrinks and speeds up: the gravitational-wave chirp.",stretch:"Stage 2: the star is tidally stretched as it nears the black hole.",swallow:"Stage 3: swallowed whole. The star crosses the horizon. No flash.",disrupt:"Stage 3: tidal disruption (theorised). The star is torn into an arc; some forms a disc, some is flung out. Possible kilonova / gamma-ray burst (theorised).",ring:"Stage 4: ringdown. The final black hole settles into a calm shape.",done:"Finished. Press Restart or Play."};$("#mg-stage").textContent=L[s]||""}}
 $("#mg-play").onclick=()=>{if(st.stage==="ready"||st.stage==="done")restart(true);else st.playing=true};
 $("#mg-pause").onclick=()=>st.playing=false;$("#mg-restart").onclick=()=>restart(true);
 PRESETS.forEach(p=>{const b=document.createElement("button");b.textContent=p.name;b.onclick=()=>{for(const k in p.v)$("#mg-"+k).value=p.v[k];$("#mg-note").textContent=p.note;restart(true)};$("#mg-presets").appendChild(b)});
 let last=performance.now(),fr=[];
 function frame(now){const dt=Math.min(0.05,(now-last)/1000);last=now;fr.push(dt);if(fr.length>120)fr.shift();window.__mgFps=fr.length/fr.reduce((a,b)=>a+b,0);
  if(st.playing)step(dt*v.spd);draw();if(st.playing&&st.stage==="inspiral"&&Math.random()<0.1)readouts();requestAnimationFrame(frame)}
 function step(dt){st.t+=dt;
  if(st.stage==="inspiral"||st.stage==="stretch"){const r=sepNow();st.phase+=dt*2*Math.PI*Math.min(3,0.4*Math.pow(v.r0/r,1.5));
   if(r<d.rEnd*1.8)setStage("stretch");
   if(st.t>=st.dur){st.tMerge=st.t;readouts();if(d.dis){setStage("disrupt");st.flash=1;st.shake=reduce?0:1;spawn()}else{setStage("swallow");st.shake=reduce?0:0.5}}}
  else{const s=st.t-st.tMerge;if(s>2.2&&st.stage!=="ring"&&st.stage!=="done")setStage("ring");if(s>5){setStage("done");st.playing=false}
   st.flash*=Math.pow(0.15,dt);st.shake*=Math.pow(0.05,dt);st.parts.forEach(p=>{if(p.disc){p.ang+=dt*3/Math.sqrt(p.r);p.r=Math.max(d.rh*1.3,p.r-dt*3)}else{p.x+=p.vx*dt;p.y+=p.vy*dt}})}}
 function spawn(){const ang=st.phase;for(let i=0;i<160;i++){const u=Math.random();if(u<0.55)st.parts.push({disc:1,ang:ang+(Math.random()-.5)*2.5,r:d.rEnd*(0.9+Math.random()*1.2)});
  else{const a2=ang+Math.PI/2*(0.5+Math.random())+(Math.random()-.5),sp=40+Math.random()*120;const x=Math.cos(ang)*d.rEnd,y=Math.sin(ang)*d.rEnd;st.parts.push({x,y,vx:Math.cos(a2)*sp,vy:Math.sin(a2)*sp})}}}
 function draw(){const w=st.w,h=st.h;ctx.setTransform(Math.min(devicePixelRatio||1,2),0,0,Math.min(devicePixelRatio||1,2),0,0);
  ctx.fillStyle="#05050d";ctx.fillRect(0,0,w,h);ctx.fillStyle="#fff";st.stars.forEach(s=>{ctx.globalAlpha=.5;ctx.fillRect(s[0],s[1],s[2],s[2])});ctx.globalAlpha=1;
  const sx=st.shake*(Math.random()-.5)*10,sy=st.shake*(Math.random()-.5)*10;ctx.save();ctx.translate(w/2+sx,h/2+sy);
  const S=Math.min(w,h)*0.42/v.r0,merged=!["ready","inspiral","stretch"].includes(st.stage),r=merged?d.rEnd:sepNow();
  const bx=-r*v.m2/d.M*Math.cos(st.phase),by=-r*v.m2/d.M*Math.sin(st.phase),nx=r*v.m1/d.M*Math.cos(st.phase),ny=r*v.m1/d.M*Math.sin(st.phase);
  const cx=merged?0:bx,cy=merged?0:by;let rb=Math.max(8,d.rh*S);
  if(st.stage==="ring"||st.stage==="done"||st.stage==="swallow"||st.stage==="disrupt"){const s=st.t-st.tMerge;rb*=1+0.15*Math.exp(-s*1.5)*Math.sin(s*18);
   for(let k=0;k<3;k++){const rr=(s*120+k*60)%(Math.max(w,h));ctx.strokeStyle=`rgba(150,170,255,${0.25*Math.exp(-s/2.5)})`;ctx.beginPath();ctx.arc(cx,cy,rb+rr,0,7);ctx.stroke()}}
  // trails
  if(!merged&&st.playing){st.trail.push([nx,ny,bx,by]);if(st.trail.length>90)st.trail.shift()}
  ctx.lineWidth=1.5;for(let j=0;j<2;j++){ctx.beginPath();st.trail.forEach((p,i)=>{const X=p[j*2]*S,Y=p[j*2+1]*S;i?ctx.lineTo(X,Y):ctx.moveTo(X,Y)});ctx.strokeStyle=j?"rgba(255,150,60,.35)":"rgba(120,200,255,.45)";ctx.stroke()}
  // BH halo + ring
  const X=cx*S,Y=cy*S,g=ctx.createRadialGradient(X,Y,rb,X,Y,rb*3.2);g.addColorStop(0,"rgba(255,170,80,.55)");g.addColorStop(.35,"rgba(255,120,40,.18)");g.addColorStop(1,"rgba(0,0,0,0)");
  ctx.fillStyle=g;ctx.beginPath();ctx.arc(X,Y,rb*3.2,0,7);ctx.fill();ctx.strokeStyle="rgba(255,210,150,.9)";ctx.lineWidth=2;ctx.beginPath();ctx.ellipse(X,Y,rb*2,rb*0.6,0.2,0,7);ctx.stroke();
  ctx.fillStyle="#000";ctx.beginPath();ctx.arc(X,Y,rb,0,7);ctx.fill();ctx.strokeStyle="rgba(255,230,190,.8)";ctx.lineWidth=1.2;ctx.beginPath();ctx.arc(X,Y,rb*1.05,0,7);ctx.stroke();
  // particles
  st.parts.forEach(p=>{let px,py;if(p.disc){px=Math.cos(p.ang)*p.r*S;py=Math.sin(p.ang)*p.r*S*0.6;ctx.fillStyle="rgba(255,190,110,.8)"}else{px=p.x*S;py=p.y*S;ctx.fillStyle="rgba(160,220,255,.8)"}ctx.fillRect(px-1,py-1,2.2,2.2)});
  // NS
  if(!merged||(st.stage==="swallow"&&st.t-st.tMerge<0.5)){let fade=1,px=nx*S,py=ny*S;if(merged){fade=1-(st.t-st.tMerge)/0.5;px*=fade;py*=fade}
   const str=Math.min(2.5,1+Math.pow(d.rtd/r,3)*(d.dis?1.5:0.6)),rn=Math.max(3,RNS*S);ctx.save();ctx.translate(px,py);
   const bang=st.phase*7+st.t*9;ctx.strokeStyle=`rgba(170,210,255,${0.6*fade})`;ctx.lineWidth=2;for(const s of[1,-1]){ctx.beginPath();ctx.moveTo(0,0);ctx.lineTo(s*Math.cos(bang)*60,s*Math.sin(bang)*60);ctx.stroke()}
   ctx.rotate(st.phase);ctx.scale(str,1/Math.sqrt(str));const gn=ctx.createRadialGradient(0,0,0,0,0,rn*2.5);gn.addColorStop(0,`rgba(255,255,255,${fade})`);gn.addColorStop(.4,`rgba(150,200,255,${.8*fade})`);gn.addColorStop(1,"rgba(0,0,0,0)");
   ctx.fillStyle=gn;ctx.beginPath();ctx.arc(0,0,rn*2.5,0,7);ctx.fill();ctx.restore()}
  ctx.restore();
  if(st.flash>0.02){ctx.fillStyle=`rgba(255,240,210,${(reduce?0.25:0.6)*st.flash})`;ctx.fillRect(0,0,w,h);ctx.fillStyle="#fff";ctx.font="600 14px system-ui";ctx.fillText("Possible kilonova / gamma-ray burst (theorised)",12,24)}
  ctx.fillStyle="rgba(255,255,255,.6)";ctx.font="12px system-ui";ctx.fillText("Simplified illustration, not to scale in time",12,h-10)}
 update();requestAnimationFrame(frame);
 return {st,v,get d(){return d},restart,presets:PRESETS};
}
window.MergerSim={mount,PRESETS};
})();
