/* Gravitational-wave chirp for the black hole + neutron star merger sim. Silent until the user presses a button.
   Physics (Oraly's spec): f(tau) = (1/pi) * (5/(256 tau))^(3/8) * (G Mc / c^3)^(-5/8), Mc = (m1 m2)^(3/5)/(m1+m2)^(1/5).
   Use:  <script src="merger-sound.js"></script>
         MergerSound.mount(document.getElementById('sound'), () => ({m1:bhMass, m2:nsMass, disrupted:bool}), duration => startAnimation(duration));
   onPlay gets the sound length in seconds so the animation can match it. Simplified illustration, not real data. */
(function(){
  const TSUN=4.925491e-6; // G*Msun/c^3 in seconds
  let ctx=null, master=null, vol=0.5, pitch=1, nodes=[];
  function chirpPlan(m1,m2){
    const mt=m1+m2, mc=Math.pow(m1*m2,0.6)/Math.pow(mt,0.2), gm=mc*TSUN;
    const fIsco=1/(Math.pow(6,1.5)*Math.PI*mt*TSUN);  // GW frequency at the innermost stable orbit
    const f0=Math.min(30,fIsco*0.5);
    const tau0=(5/256)*Math.pow(Math.PI*f0,-8/3)*Math.pow(gm,-5/3);
    return {mc,fIsco,f0,tau0,gm};
  }
  function fOf(tau,gm){ return (1/Math.PI)*Math.pow(5/(256*tau),3/8)*Math.pow(gm,-5/8); }
  function play(p){
    stop();
    if(!ctx){ const AC=window.AudioContext||window.webkitAudioContext; if(!AC) return 0;
      ctx=new AC(); master=ctx.createGain(); master.connect(ctx.destination); }
    if(ctx.state==="suspended") ctx.resume();
    master.gain.value=vol;
    const m1=Math.max(1,+p.m1||10), m2=Math.max(0.5,+p.m2||1.4), pl=chirpPlan(m1,m2);
    const tauEnd=Math.max(1e-3, (5/256)*Math.pow(Math.PI*pl.fIsco,-8/3)*Math.pow(pl.gm,-5/3));
    // compress very long inspirals so the sound never exceeds 12 s, keeping the rising shape
    const real=pl.tau0-tauEnd, dur=Math.min(12,Math.max(2,real)), k=real/dur;
    const N=400, freq=new Float32Array(N), amp=new Float32Array(N);
    for(let i=0;i<N;i++){
      const tt=i/(N-1)*dur, tau=Math.max(tauEnd,pl.tau0-tt*k);
      const f=fOf(tau,pl.gm); freq[i]=Math.min(2000,f*pitch);
      amp[i]=Math.pow(f/pl.f0,2/3)/Math.pow(pl.fIsco/pl.f0,2/3);   // loudness grows as f^(2/3), 1 at merger
    }
    const t0=ctx.currentTime+0.05, osc=ctx.createOscillator(), g=ctx.createGain();
    osc.type="sine"; osc.frequency.setValueCurveAtTime(freq,t0,dur);
    g.gain.setValueCurveAtTime(amp.map(a=>0.05+0.9*a),t0,dur);
    osc.connect(g); g.connect(master); osc.start(t0);
    let total=dur;
    if(p.disrupted){ // star torn apart before the plunge: the signal fades out, no clean ringdown
      g.gain.setValueAtTime(0.0001,t0+dur+0.001); osc.stop(t0+dur+0.05);
    } else {         // swallowed whole: brief ringdown, a decaying tone a bit above the last chirp frequency
      const fr=Math.min(2000,pl.fIsco*1.4*pitch), r=ctx.createOscillator(), rg=ctx.createGain();
      r.type="sine"; r.frequency.value=fr; rg.gain.setValueAtTime(0.0001,t0+dur);
      rg.gain.linearRampToValueAtTime(0.9,t0+dur+0.01); rg.gain.exponentialRampToValueAtTime(0.0005,t0+dur+0.4);
      r.connect(rg); rg.connect(master); r.start(t0+dur); r.stop(t0+dur+0.45);
      g.gain.setValueAtTime(0.0001,t0+dur+0.01); osc.stop(t0+dur+0.05); nodes.push(r); total=dur+0.4;
    }
    nodes.push(osc);
    return total;
  }
  function stop(){ nodes.forEach(n=>{try{n.stop();}catch(e){}}); nodes=[]; }
  function mount(el,getParams,onPlay){
    el.innerHTML='<button type="button" class="ms-btn">🔊 Play chirp</button> '+
      '<label style="display:block;margin:8px 0 0;font-weight:400">Volume <input type="range" class="ms-vol" min="0" max="1" step="0.01" value="0.5"></label>'+
      '<label style="display:block;margin:8px 0 0;font-weight:400"><input type="checkbox" class="ms-pitch"> Raise pitch ×4 (phone speakers cannot play deep bass)</label>'+
      '<p class="muted">The chirp is the gravitational-wave signal speeding up and getting louder as the two objects spiral together. Simplified illustration; the real signal was only heard after processing. Sound plays only when you press the button.</p>';
    const b=el.querySelector('.ms-btn');
    b.style.cssText='padding:10px 16px;border-radius:10px;border:1px solid #ff9d3c;background:#10122a;color:#ff9d3c;font-weight:700;cursor:pointer;min-height:44px';
    el.querySelector('.ms-vol').addEventListener('input',e=>{vol=+e.target.value; if(master) master.gain.value=vol;});
    el.querySelector('.ms-pitch').addEventListener('change',e=>{pitch=e.target.checked?4:1;});
    b.addEventListener('click',()=>{
      const d=play(getParams()); if(!d){ b.textContent="Sound not supported here"; return; }
      if(onPlay) onPlay(d);
    });
    window.addEventListener('pagehide',stop);
  }
  window.MergerSound={mount,play,stop,plan:chirpPlan};
})();
