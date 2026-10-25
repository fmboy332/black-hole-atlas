/* Pulsar ticking sound for Black Hole Atlas. Off by default, never autoplays.
   Use:  <script src="pulsar-sound.js"></script>
         PulsarSound.mount(document.getElementById('sound'), () => spinHz);
   getHz returns the current spin rate in Hz (spins per second). Read live, so sliders just work. */
(function(){
  let vol0=0.5, interOn=true, ctx=null, timer=null, nextT=0, getHz=()=>29.6, slow=1, gain=null, clickBuf=null;
  const PRESETS=[
    {name:"Crab pulsar (P = 33.5 ms, about 29.9 spins per second)", hz:29.9},
    {name:"Vela pulsar (about 11 spins per second)", hz:11.2},
    {name:"Fastest known (about 716 spins per second)", hz:716},
    {name:"Slow one (1 spin per second)", hz:1}
  ];
  function makeClick(){
    const len=Math.floor(ctx.sampleRate*0.012), b=ctx.createBuffer(1,len,ctx.sampleRate), d=b.getChannelData(0);
    for(let i=0;i<len;i++) d[i]=(Math.random()*2-1)*Math.exp(-i/(len*0.18));
    return b;
  }
  function tick(){
    const hz=Math.max(0.05,getHz())/slow, period=1/hz, ahead=ctx.currentTime+0.12;
    if(nextT<ctx.currentTime) nextT=ctx.currentTime+0.02;
    let n=0;
    while(nextT<ahead && n++<200){
      const s=ctx.createBufferSource(); s.buffer=clickBuf; s.connect(gain); s.start(nextT);
      if(interOn){ // Crab-style weaker interpulse about half a period later
        const q=ctx.createBufferSource(), g2=ctx.createGain(); g2.gain.value=0.4; q.buffer=clickBuf; q.connect(g2); g2.connect(gain); q.start(nextT+period/2);
      }
      nextT+=period;
    }
  }
  function start(){
    if(!ctx){ const AC=window.AudioContext||window.webkitAudioContext; if(!AC) return false;
      ctx=new AC(); gain=ctx.createGain(); gain.gain.value=vol0; gain.connect(ctx.destination); clickBuf=makeClick(); }
    if(ctx.state==="suspended") ctx.resume();
    nextT=0; if(!timer) timer=setInterval(tick,25); return true;
  }
  function stop(){ if(timer){clearInterval(timer);timer=null;} }
  function mount(el,hzFn,onPreset){
    if(hzFn) getHz=hzFn;
    el.innerHTML='<button type="button" class="ps-btn" aria-pressed="false">🔊 Sound: off</button> '+
      '<label style="display:block;margin:8px 0 0;font-weight:400"><input type="checkbox" class="ps-inter" checked> Add weaker interpulse (Crab style)</label>'+
      '<label style="display:block;margin:8px 0 0;font-weight:400">Volume <input type="range" class="ps-vol" min="0" max="1" step="0.01" value="0.5"></label>'+
      '<label class="ps-slow" style="display:inline-block;margin-left:10px;font-weight:400"><input type="checkbox"> Slow motion (÷10) so you can hear single ticks</label>'+
      '<p class="muted ps-note">Each tick is one flash of the beam sweeping past Earth. Sound is off until you press the button.</p>';
    const btn=el.querySelector('.ps-btn'), cb=el.querySelector('.ps-slow input');
    el.querySelector('.ps-inter').addEventListener('change',e=>{interOn=e.target.checked;});
    el.querySelector('.ps-vol').addEventListener('input',e=>{ if(gain) gain.gain.value=+e.target.value; else vol0=+e.target.value; });
    btn.style.cssText='padding:10px 16px;border-radius:10px;border:1px solid #ff9d3c;background:#10122a;color:#ff9d3c;font-weight:700;cursor:pointer';
    btn.addEventListener('click',()=>{
      const on=btn.getAttribute('aria-pressed')!=="true";
      if(on){ if(!start()){ btn.textContent="Sound not supported here"; return; } } else stop();
      btn.setAttribute('aria-pressed',on); btn.textContent=on?"🔇 Sound: on (tap to stop)":"🔊 Sound: off";
    });
    cb.addEventListener('change',()=>{ slow=cb.checked?10:1; });
    window.addEventListener('pagehide',stop);
  }
  window.PulsarSound={mount,start,stop,presets:PRESETS,setGetHz:f=>{getHz=f;}};
})();
