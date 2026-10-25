// 3D pulsar view (three.js r160, vendored). Illustration only; physics comes from sim.js via window.P3.
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/OrbitControls.js';
const wrap=document.getElementById('p3-wrap'),msg=document.getElementById('p3-msg'),strip=document.getElementById('p3-strip');
const reduce=matchMedia('(prefers-reduced-motion: reduce)').matches;
const lite=/[?&]lite/.test(location.search)||(navigator.hardwareConcurrency||8)<=4;
let renderer;
try{renderer=new THREE.WebGLRenderer({antialias:!lite,powerPreference:'high-performance'});}catch(e){renderer=null}
if(!renderer){msg.innerHTML='Your browser could not start 3D graphics (WebGL), so the 3D view is off. <a href="pulsar.html">Use the 2D pulsar simulator</a>; the sliders, sound and equations below still work.';wrap.style.display='none';}
else{
let pr=Math.min(devicePixelRatio||1,lite?1:2);renderer.setPixelRatio(pr);wrap.appendChild(renderer.domElement);
const scene=new THREE.Scene(),camera=new THREE.PerspectiveCamera(45,1,0.1,2000);camera.position.set(16,9,26);
const controls=new OrbitControls(camera,renderer.domElement);controls.enableDamping=true;controls.enablePan=false;controls.minDistance=5;controls.maxDistance=90;
controls.autoRotate=!reduce;controls.autoRotateSpeed=0.6;controls.addEventListener('start',()=>{controls.autoRotate=false});
// glow sprite texture
function glowTex(inner='rgba(255,255,255,1)',mid='rgba(140,180,255,.35)'){const c=document.createElement('canvas');c.width=c.height=128;const g=c.getContext('2d');const gr=g.createRadialGradient(64,64,0,64,64,64);gr.addColorStop(0,inner);gr.addColorStop(.25,mid);gr.addColorStop(1,'rgba(0,0,0,0)');g.fillStyle=gr;g.fillRect(0,0,128,128);const t=new THREE.CanvasTexture(c);t.colorSpace=THREE.SRGBColorSpace;return t}
const GLOW=glowTex();
const sprite=(tex,s,col=0xffffff,op=1)=>{const m=new THREE.Sprite(new THREE.SpriteMaterial({map:tex,color:col,transparent:true,opacity:op,blending:THREE.AdditiveBlending,depthWrite:false}));m.scale.set(s,s,1);return m};
// starfield
{const N=lite?1200:3000,p=new Float32Array(N*3),col=new Float32Array(N*3);for(let i=0;i<N;i++){const v=new THREE.Vector3().randomDirection().multiplyScalar(400+Math.random()*500);p.set([v.x,v.y,v.z],i*3);const w=.6+Math.random()*.4,t=Math.random();col.set([w*(t<.2?1:.85),w*.9,w*(t>.8?.7:1)],i*3)}
 const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.BufferAttribute(p,3));g.setAttribute('color',new THREE.BufferAttribute(col,3));
 scene.add(new THREE.Points(g,new THREE.PointsMaterial({size:1.6,sizeAttenuation:false,vertexColors:true,transparent:true,opacity:.85})));}
// spin frame (rotates about y = spin axis) -> tilt frame (y = magnetic axis)
const spinG=new THREE.Group(),tiltG=new THREE.Group();scene.add(spinG);spinG.add(tiltG);
// star with subtle surface shading (fresnel + hot-spot noise), unlit glowing look
const starMat=new THREE.ShaderMaterial({uniforms:{t:{value:0}},vertexShader:`varying vec3 vN;varying vec3 vP;varying vec3 vL;void main(){vN=normalize(normalMatrix*normal);vL=position;vec4 mv=modelViewMatrix*vec4(position,1.);vP=-mv.xyz;gl_Position=projectionMatrix*mv;}`,
 fragmentShader:`varying vec3 vN;varying vec3 vP;varying vec3 vL;uniform float t;
 float h(vec3 p){return fract(sin(dot(p,vec3(12.9898,78.233,37.719)))*43758.5453);}
 float nz(vec3 p){vec3 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);return mix(mix(mix(h(i),h(i+vec3(1,0,0)),f.x),mix(h(i+vec3(0,1,0)),h(i+vec3(1,1,0)),f.x),f.y),mix(mix(h(i+vec3(0,0,1)),h(i+vec3(1,0,1)),f.x),mix(h(i+vec3(0,1,1)),h(i+vec3(1,1,1)),f.x),f.y),f.z);}
 void main(){float fr=pow(1.-max(dot(normalize(vN),normalize(vP)),0.),2.);float n=nz(vL*4.)*.6+nz(vL*9.)*.4;float pole=pow(abs(normalize(vL).y),12.);
 vec3 c=mix(vec3(.62,.75,1.),vec3(.95,.97,1.),n*.55)+pole*vec3(.6,.7,1.)+fr*vec3(.4,.55,1.);gl_FragColor=vec4(c,1.);}`});
const star=new THREE.Mesh(new THREE.SphereGeometry(1,lite?32:64,lite?24:48),starMat);tiltG.add(star);
const halo=sprite(GLOW,7,0x9fc0ff,.9);scene.add(halo);const halo2=sprite(GLOW,16,0x5070ff,.35);scene.add(halo2);
// spin axis
const axisGeo=new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(0,-14,0),new THREE.Vector3(0,14,0)]);
const axis=new THREE.Line(axisGeo,new THREE.LineDashedMaterial({color:0x9fb4ff,dashSize:.6,gapSize:.5,transparent:true,opacity:.45}));axis.computeLineDistances();scene.add(axis);
// field lines (rebuilt when R_LC changes)
const fieldG=new THREE.Group();tiltG.add(fieldG);
const lineMat=new THREE.LineBasicMaterial({color:0xa58cff,transparent:true,opacity:.42,blending:THREE.AdditiveBlending,depthWrite:false});
const openMat=new THREE.LineBasicMaterial({color:0x7fb0ff,transparent:true,opacity:.35,blending:THREE.AdditiveBlending,depthWrite:false});
let rlcDisp=10;
function buildField(){fieldG.clear();const nAz=lite?6:10,shells=lite?[1.8,3,4.6]:[1.7,2.5,3.6,5,6.8];
 for(const L0 of shells){const L=Math.min(L0,rlcDisp*.92);for(let k=0;k<nAz;k++){const ph=k/nAz*Math.PI*2+L0;const pts=[];const th0=Math.asin(Math.min(1,Math.sqrt(1/L)));
  for(let i=0;i<=60;i++){const th=th0+(Math.PI-2*th0)*i/60;const r=L*Math.sin(th)**2;pts.push(new THREE.Vector3(r*Math.sin(th)*Math.cos(ph),r*Math.cos(th),r*Math.sin(th)*Math.sin(ph)))}
  fieldG.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(pts),lineMat))}}
 // open field lines from the polar caps, out to the light cylinder and beyond
 for(const sg of[1,-1])for(let k=0;k<(lite?4:8);k++){const ph=k/(lite?4:8)*Math.PI*2;const pts=[];const L=rlcDisp*1.6;const th0=Math.asin(Math.sqrt(1/L));
  for(let i=0;i<=50;i++){const th=th0+(Math.PI/2-th0)*0.75*i/50;const r=L*Math.sin(th)**2;const y=r*Math.cos(th)*sg;pts.push(new THREE.Vector3(r*Math.sin(th)*Math.cos(ph),y,r*Math.sin(th)*Math.sin(ph)))}
  fieldG.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(pts),openMat))}}
// beams: additive cones along ±y in tilt frame, fading with distance
const beamMat=new THREE.ShaderMaterial({transparent:true,depthWrite:false,blending:THREE.AdditiveBlending,side:THREE.DoubleSide,uniforms:{len:{value:22}},
 vertexShader:`varying float d;varying vec3 vN;varying vec3 vV;void main(){d=length(position);vN=normalize(normalMatrix*normal);vec4 mv=modelViewMatrix*vec4(position,1.);vV=normalize(-mv.xyz);gl_Position=projectionMatrix*mv;}`,
 fragmentShader:`varying float d;varying vec3 vN;varying vec3 vV;uniform float len;void main(){float a=(1.-smoothstep(0.,len,d))*0.55;float edge=pow(abs(dot(vN,vV)),1.5);gl_FragColor=vec4(vec3(.55,.75,1.)*a*edge,a*edge);}`});
const beams=[];for(const sg of[1,-1]){const g=new THREE.Group();const cone=new THREE.Mesh(new THREE.ConeGeometry(1,1,48,1,true),beamMat);cone.position.y=.5;cone.rotation.x=Math.PI;g.add(cone);
 const core=new THREE.Mesh(new THREE.ConeGeometry(.35,1,24,1,true),beamMat);core.position.y=.5;core.rotation.x=Math.PI;g.add(core);if(sg<0)g.rotation.z=Math.PI;tiltG.add(g);beams.push({g,cone,core})}
// light cylinder + label
const lcMat=new THREE.MeshBasicMaterial({color:0x6c8cff,transparent:true,opacity:.07,side:THREE.DoubleSide,depthWrite:false});
const lc=new THREE.Mesh(new THREE.CylinderGeometry(1,1,1,64,1,true),lcMat);scene.add(lc);
const ringMat=new THREE.LineBasicMaterial({color:0x8fa8ff,transparent:true,opacity:.5});const rings=[];
for(const y of[-1,0,1]){const pts=[];for(let i=0;i<=96;i++){const a=i/96*Math.PI*2;pts.push(new THREE.Vector3(Math.cos(a),0,Math.sin(a)))}const r=new THREE.LineLoop(new THREE.BufferGeometry().setFromPoints(pts),ringMat);r.userData.y=y;scene.add(r);rings.push(r)}
function label(text,col='#cfd8ff'){const c=document.createElement('canvas');c.width=512;c.height=64;const g=c.getContext('2d');g.font='28px system-ui,sans-serif';g.fillStyle=col;g.fillText(text,6,40);const t=new THREE.CanvasTexture(c);t.colorSpace=THREE.SRGBColorSpace;const s=new THREE.Sprite(new THREE.SpriteMaterial({map:t,transparent:true,depthWrite:false}));s.scale.set(8,1,1);s.center.set(0,.5);return s}
const lcLabel=label('Light cylinder (not to scale)');scene.add(lcLabel);
// Earth marker
const EARTH_D=17;const earth=new THREE.Mesh(new THREE.SphereGeometry(.45,24,16),new THREE.MeshBasicMaterial({color:0x4fa3ff}));scene.add(earth);
const flash=sprite(GLOW,1,0xfff3c0,1);scene.add(flash);const eLabel=label('Earth','#cfeeff');eLabel.scale.set(5,.62,1);scene.add(eLabel);
const sight=new THREE.Line(new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(),new THREE.Vector3(1,0,0)]),new THREE.LineDashedMaterial({color:0x4fa3ff,dashSize:.4,gapSize:.4,transparent:true,opacity:.35}));scene.add(sight);
let key='';
function applyParams(){const v=P3.vals,d=P3.d;if(!v)return;const D=Math.PI/180;
 tiltG.rotation.z=-v.tilt*D;
 const Rkm=v.radius;const ratio=(d.rlc/1000)/Rkm; // R_LC in star radii
 const nd=Math.max(3.2,2.4+3.2*Math.log10(ratio)); // compressed log scale for display
 if(Math.abs(nd-rlcDisp)>.05){rlcDisp=nd;buildField()}
 const H=Math.max(24,rlcDisp*2.4);lc.scale.set(rlcDisp,H,rlcDisp);rings.forEach(r=>{r.scale.set(rlcDisp,1,rlcDisp);r.position.y=r.userData.y*H/2});
 lcLabel.position.set(rlcDisp*.72,H/2*.55,rlcDisp*.72);
 const len=Math.max(20,rlcDisp*1.6);beamMat.uniforms.len.value=len;const w=v.width*D;
 for(const b of beams){b.cone.scale.set(Math.tan(w)*len,len,Math.tan(w)*len);b.core.scale.set(Math.tan(w)*len,len,Math.tan(w)*len);b.cone.position.y=len/2;b.core.position.y=len/2}
 const z=v.view*D,e=new THREE.Vector3(Math.sin(z),Math.cos(z),0).multiplyScalar(EARTH_D);earth.position.copy(e);flash.position.copy(e);eLabel.position.copy(e).add(new THREE.Vector3(.8,.6,0));
 sight.geometry.setFromPoints([new THREE.Vector3(),e]);sight.computeLineDistances();
}
P3.onChange=applyParams;buildField();applyParams();
// pulse strip (synced to the same phase as the 3D star)
const sctx=strip.getContext('2d');
function drawStrip(ph,d){const r=strip.getBoundingClientRect(),dpr=Math.min(devicePixelRatio||1,2);if(strip.width!==Math.round(r.width*dpr)){strip.width=r.width*dpr;strip.height=r.height*dpr}
 sctx.setTransform(dpr,0,0,dpr,0,0);const w=r.width,h=r.height;sctx.fillStyle='#141428';sctx.fillRect(0,0,w,h);sctx.strokeStyle='#ffcf8a';sctx.lineWidth=1.5;sctx.beginPath();const pad=8,ww=w-2*pad;
 for(let i=0;i<=300;i++){const p=i/300*4*Math.PI;const y=h-8-Math.min(1,d.prof(p))*(h-26);i?sctx.lineTo(pad+i/300*ww,y):sctx.moveTo(pad,y)}sctx.stroke();
 const x=pad+(ph/(4*Math.PI))*ww;sctx.strokeStyle='rgba(255,255,255,.7)';sctx.beginPath();sctx.moveTo(x,4);sctx.lineTo(x,h-4);sctx.stroke();
 sctx.fillStyle='#aab';sctx.font='12px system-ui';sctx.fillText('Pulse profile seen from Earth (2 turns)'+(d.seen?'':' · beams miss Earth'),pad,15)}
function resize(){const w=wrap.clientWidth,h=wrap.clientHeight;renderer.setSize(w,h,false);camera.aspect=w/h;camera.updateProjectionMatrix();camera.fov=w<500?55:45;camera.updateProjectionMatrix();if(!resize.done){resize.done=1;camera.position.setLength(w/h<1?52:32)}}
addEventListener('resize',resize);resize();
// frame-rate watchdog: drop detail on weak devices
let frames=0,t0=performance.now()+1500,downgraded=false,checks=0;window.P3fps=0;
const clock=new THREE.Clock();
renderer.setAnimationLoop(()=>{
 const dt=clock.getDelta();const st=P3.api.st,d=P3.d;if(!d)return;
 const ph=st.phase||0; // advanced by sim.js (true rate, capped at 1.5 turns/s on screen)
 spinG.rotation.y=-ph;starMat.uniforms.t.value+=dt;
 const I=Math.min(1,d.prof(ph));flash.scale.setScalar(.6+6*I);flash.material.opacity=I>0.1?I:0;earth.material.color.setHex(I>0.1?0xffffff:0x4fa3ff);
 controls.update();renderer.render(scene,camera);drawStrip(ph,d);
 frames++;const now=performance.now();if(now-t0>2000){checks++;P3fps=frames*1000/(now-t0);frames=0;t0=now;
  if(checks>1&&P3fps<30&&!downgraded){downgraded=true;renderer.setPixelRatio(1);resize();msg.textContent='Running in lower detail to keep the animation smooth on this device.'}}
});
}
