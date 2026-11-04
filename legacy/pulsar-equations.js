/* "Show the physics" button for the pulsar page. Plain HTML, no libraries.
   Use:  <script src="pulsar-equations.js"></script>
         PulsarEquations.mount(document.getElementById('equations'), () => ({P:0.0335, B:4e12, tiltDeg:45}));
   P = spin period in seconds, B = surface field in gauss (optional), Pdot (optional, overrides B), tiltDeg = angle between spin and magnetic axes.
   Read live each time the panel is open, so call PulsarEquations.refresh() after a slider moves. cgs units, as astronomers use. */
(function(){
  const c=2.998e10, I=1e45, R=1e6; // cm/s, g cm^2 (standard value), cm (10 km)
  function calc(p){
    const P=Math.max(1e-4,+p.P||0.0335);
    let B=+p.B||0, Pd=+p.Pdot||0;
    if(Pd>0 && !B) B=3.2e19*Math.sqrt(P*Pd);
    if(!B) B=4e12;
    if(!(Pd>0)) Pd=Math.pow(B/3.2e19,2)/P;
    const W=2*Math.PI/P, tilt=((p.tiltDeg==null?45:+p.tiltDeg)*Math.PI)/180;
    return {P,B,Pd,W,tilt,
      RLC:c*P/(2*Math.PI),
      Edot:4*Math.PI*Math.PI*I*Pd/Math.pow(P,3),
      age:P/(2*Pd)/3.156e7,
      Edip:2*Math.pow(B,2)*Math.pow(R,6)*Math.pow(W,4)*Math.pow(Math.sin(tilt),2)/(3*Math.pow(c,3)),
      rhoGJ:W*B/(2*Math.PI*c)/4.803e-10, // number density, cm^-3 (|rho|/e at the pole)
      vEq:W*R/c};
  }
  const f=(x,d=3)=>x===0?"0":(Math.abs(x)>=1e4||Math.abs(x)<1e-2?x.toExponential(d-1):Number(x.toPrecision(d)).toLocaleString());
  let box=null, getP=null;
  function render(){
    if(!box||!getP) return;
    const r=calc(getP()), rows=[
      ["Light cylinder","R<sub>LC</sub> = cP / 2π","where the magnetic field would have to spin at the speed of light; beams leave from inside it",f(r.RLC/1e5)+" km"],
      ["Spin-down power","Ė = 4π² I Ṗ / P³","the energy the pulsar loses per second as it slows (I ≈ 10<sup>45</sup> g cm²)",f(r.Edot)+" erg/s"],
      ["Magnetic dipole radiation","Ė = 2 B² R⁶ Ω⁴ sin²α / (3c³)","a spinning tilted magnet radiates energy (B is the equatorial field); α is the tilt angle. A pulsar with no tilt would radiate none this way",f(r.Edip)+" erg/s"],
      ["Surface magnetic field","B ≈ 3.2×10<sup>19</sup> √(P Ṗ) gauss","estimated from how fast the spin slows",f(r.B)+" G"],
      ["Characteristic age","τ = P / (2Ṗ)","an estimate that assumes the slowdown never changes, so the real age can differ",f(r.age)+" years"],
      ["Spin rate","Ω = 2π / P","how fast the star turns",f(r.W)+" rad/s ("+f(1/r.P)+" per second)"],
      ["Surface speed at the equator","v = Ω R","for a 10 km radius star; the fastest known pulsars get a good fraction of c",f(r.vEq*100)+" % of light speed"],
      ["Charge density around the star","n<sub>GJ</sub> ≈ Ω B / (2π c e)","the minimum plasma needed to screen the electric field (Goldreich-Julian)",f(r.rhoGJ)+" per cm³"],
      ["Spin-down law","Ω̇ = −K Ωⁿ","n is the braking index; pure dipole slowing gives n = 3 (real pulsars measure less)","n = 3 for ideal dipole"]
    ];
    box.querySelector('.pe-body').innerHTML='<p class="muted">Live values for your current sliders. Textbook formulas in cgs units; the star is treated as a 10 km sphere with moment of inertia 10<sup>45</sup> g cm². These are estimates, not precision measurements.</p>'+
      rows.map(x=>'<div class="fact" style="margin:10px 0"><b>'+x[0]+'</b><br><span style="font-size:1.1rem;font-family:Georgia,serif">'+x[1]+'</span><br><span class="muted">'+x[2]+'</span><br>Now: <span class="val" style="color:#ff9d3c;font-weight:700">'+x[3]+'</span></div>').join('');
  }
  function mount(el,fn){
    getP=fn; box=el;
    el.innerHTML='<button type="button" class="pe-btn" aria-expanded="false">∑ Show the physics</button><div class="pe-body" hidden></div>';
    const b=el.querySelector('.pe-btn'), body=el.querySelector('.pe-body');
    b.style.cssText='padding:10px 16px;border-radius:10px;border:1px solid #ff9d3c;background:#10122a;color:#ff9d3c;font-weight:700;cursor:pointer;min-height:44px';
    b.addEventListener('click',()=>{ const o=body.hidden; body.hidden=!o; b.setAttribute('aria-expanded',o); b.textContent=o?"∑ Hide the physics":"∑ Show the physics"; if(o) render(); });
  }
  window.PulsarEquations={mount,refresh:()=>{ if(box&&!box.querySelector('.pe-body').hidden) render(); },calc};
})();
