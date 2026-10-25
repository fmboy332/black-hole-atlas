/* Equations panel for pulsar3d.html, built from Oraly's spec (13 formulas). cgs inside, friendly units out. */
(function(){
const c=2.998e10,G=6.674e-8,MSUN=1.989e33,I=1e45,YR=3.156e7,LSUN=3.828e33;
function calc(v){
 const P=v.period,B=v.bfield,M=v.mass*MSUN,R=v.radius*1e5; // s, G, g, cm
 const Pd=Math.pow(B/3.2e19,2)/P; // implied by the field slider (the page treats B as the input)
 const f=1/P,W=2*Math.PI/P,vEq=W*R,RLC=c*P/(2*Math.PI),Erot=0.5*I*W*W,Edot=4*Math.PI*Math.PI*I*Pd/Math.pow(P,3);
 const age=Pd>0?P/(2*Pd)/YR:Infinity,rho=Math.sqrt(3*Math.PI*R/(2*RLC)),rhoStd=1.5*Math.sqrt(R/RLC);
 const g=G*M/(R*R),vesc=Math.sqrt(2*G*M/R),comp=G*M/(R*c*c),z1=1/Math.sqrt(1-2*comp),dens=3*M/(4*Math.PI*R*R*R),Edip=B*B*Math.pow(R,6)*Math.pow(W,4)*Math.pow(Math.sin(v.tilt*Math.PI/180),2)/(6*c*c*c),nGJ=W*B/(2*Math.PI*c*4.803e-10),fmax=Math.sqrt(G*M/(R*R*R))/(2*Math.PI);
 return {Edip,nGJ,P,B,Pd,f,W,vEq,RLC,Erot,Edot,age,rho,rhoStd,g,vesc,comp,z1,dens,fmax,v};
}
const n=(x,d=3)=>{if(!isFinite(x))return"∞";const a=Math.abs(x);if(a!==0&&(a>=1e6||a<1e-2)){const [m,e]=x.toExponential(d-1).split("e");return m+" × 10<sup>"+(+e)+"</sup>"}return Number(x.toPrecision(d)).toLocaleString("en-US")};
const T={in:'<span class="tag t-in">input</span>',est:'<span class="tag t-est">estimate</span>',mod:'<span class="tag t-mod">model assumption</span>',th:'<span class="tag t-th">theory limit</span>'};
function rows(r){const v=r.v,D=180/Math.PI;return [
 ["1. Spin rate",T.in,"f = 1 / P &nbsp;&nbsp; Ω = 2π / P","How many turns per second (f), and the same thing as an angle per second (Ω).",n(r.f)+" turns/s (Hz), Ω = "+n(r.W)+" rad/s"+" <span class=\"eq-p\">(uses: P)</span>"],
 ["2. Surface speed at the equator","","v = Ω R = 2πR / P","How fast the equator moves. Even the fastest pulsars stay well below light speed.",n(r.vEq/1e5)+" km/s = "+n(r.vEq/c*100)+" % of light speed"+(r.vEq/c>0.5?" ⚠️ unphysically fast":"")+" <span class=\"eq-p\">(uses: P, radius)</span>"],
 ["3. Light cylinder",T.est,"R<sub>LC</sub> = c / Ω = cP / 2π","The distance where something spinning with the star would have to move at light speed. Field lines that reach it can't keep up, so they open and carry the wind and beams.",n(r.RLC/1e5,4)+" km ("+n(r.RLC/(v.radius*1e5))+" × the star's radius)"+" <span class=\"eq-p\">(uses: P)</span>"],
 ["4. Rotational energy",T.mod,"E = ½ I Ω²","The energy stored in the spin. I ≈ 10<sup>45</sup> g cm² is an assumed standard moment of inertia.",n(r.Erot)+" erg"+" <span class=\"eq-p\">(uses: P (+ assumed I))</span>"],
 ["5. Spin-down power",T.mod,"Ė = −I Ω Ω̇ = 4π² I Ṗ / P³","Energy lost each second as the spin slows (it powers the wind and beams). Ṗ here is the slow-down rate implied by the field slider: Ṗ = (B / 3.2×10<sup>19</sup>)² / P = "+n(r.Pd)+" s/s.",(r.Pd>0?n(r.Edot)+" erg/s ≈ "+n(r.Edot/LSUN)+" × the Sun's power":"no spin-down set")+" <span class=\"eq-p\">(uses: Ṗ from B slider and P, assumed I)</span>"],
 ["6. Surface magnetic field",T.est,"B ≈ 3.2 × 10<sup>19</sup> √(P Ṗ) gauss","Inferred from how fast the spin slows (magnetic-dipole braking, vacuum estimate). B is never measured directly this way. On this page the B slider is the input and Ṗ is worked out from it.",n(r.B)+" G ("+n(r.B/1e4)+" tesla)"+" <span class=\"eq-p\">(uses: B slider)</span>"],
 ["7. Characteristic age",T.est,"τ = P / (2Ṗ)","Characteristic age, a rough upper-style estimate: it assumes braking index n = 3 and a tiny starting spin. Real ages can differ a lot (the Crab is really about 970 years old, from the supernova of 1054).",n(r.age)+" years"+" <span class=\"eq-p\">(uses: P, Ṗ)</span>"],
 ["8. Braking index",T.mod,"Ω̇ ∝ −Ωⁿ &nbsp; (so Ṗ ∝ P<sup>2−n</sup>)","How the slow-down depends on spin. n = 3 is the idealised pure-dipole value. Measured values are mostly below 3 (the Crab is about 2.5), so the simple model is not exact.","n = 3 assumed (note only)"],
 ["9. Beam geometry",T.est,"pulse seen if |ζ − α| ≲ ρ","ζ = angle from the spin axis to Earth, α = magnetic tilt, ρ = beam half-width. Textbook polar-cap beam half-width, for emission near the surface: ρ ≈ 1.5 √(R / R<sub>LC</sub>) radians. Real beams are often wider because the emission comes from higher up.","|ζ − α| = "+n(Math.abs(v.view-v.tilt))+"°, slider ρ = "+v.width+"° → "+(r.v._seen?"pulses seen":"beams miss Earth")+". Width for emission near the surface (formula): ρ ≈ "+n(r.rhoStd*D)+"°"+" <span class=\"eq-p\">(uses: tilt α, viewing angle ζ, beam width ρ, P, radius)</span>"],
 ["10. Gravity at the surface",T.mod,"g = GM / R² &nbsp; v<sub>esc</sub> = √(2GM / R) &nbsp; compactness = GM / (Rc²)","Crushing gravity, an escape speed that is a big fraction of light speed, and how close the star is to being a black hole (0.5 would be one). Newtonian forms.","g = "+n(r.g)+" cm/s² (≈ "+n(r.g/981)+" × Earth), v<sub>esc</sub> = "+n(r.vesc/c)+" c, compactness = "+n(r.comp)+" <span class=\"eq-p\">(uses: mass, radius)</span>"],
 ["11. Gravitational redshift",T.mod,"1 + z = (1 − 2GM / Rc²)<sup>−1/2</sup>","Light climbing out of the gravity loses energy; clocks on the surface run slow by this factor. Same square-root form as the black hole time-dilation slider.","1 + z = "+n(r.z1)+" <span class=\"eq-p\">(uses: mass, radius)</span>"],
 ["12. Mean density","","ρ = 3M / (4πR³)","Average density of the whole star.",n(r.dens)+" g/cm³ ≈ "+n(r.dens*5/1e6/1e9)+" billion tonnes per teaspoon (5 cm³)"+" <span class=\"eq-p\">(uses: mass, radius)</span>"],
 ["13. Breakup spin",T.th,"f<sub>max</sub> ≈ (1/2π) √(GM / R³)","Rough Newtonian limit where the equator would fly apart. The real limit is lower (about 1.2 kHz with general relativity); the fastest known pulsar spins at 716 Hz.",n(r.fmax)+" Hz (estimate); you are at "+n(r.f/r.fmax*100)+" % of it"+" <span class=\"eq-p\">(uses: mass, radius, P)</span>"],
 ["Extra: magnetic dipole radiation",T.mod,"Ė<sub>dip</sub> = B<sub>p</sub>² R⁶ Ω⁴ sin²α / (6c³)","Power radiated by a tilted spinning magnet in a vacuum, using the B slider directly as the polar field, your radius and tilt. It need not match line 5 exactly: line 5 uses the slow-down rate Ṗ, and the 3.2×10<sup>19</sup> rule assumes R = 10 km and a 90° tilt. Both are consistent order-of-magnitude estimates.",n(r.Edip)+" erg/s <span class=\"eq-p\">(uses: B = "+n(r.B)+" G from the preset/B slider, radius, tilt α = "+n(v.tilt)+"°, P)</span>"],
 ["Extra: Goldreich–Julian density",T.mod,"n<sub>GJ</sub> ≈ Ω B / (2π c e)","The charge density needed to screen the electric field along the magnetic field, for an aligned rotator near the poles.",n(r.nGJ)+" charges per cm³ <span class=\"eq-p\">(uses: P, B slider)</span>"]
];}
function render(){
 if(!window.P3||!P3.vals)return;const box=document.getElementById("eq-body");if(!box||document.getElementById("eq").hidden)return;
 const r=calc(P3.vals);r.v._seen=P3.d&&P3.d.seen;
 box.innerHTML='<p class="eq-p">Live values from your sliders. Inputs are '+T.in.replace("input","the sliders")+'; '+T.est+' marks inferred numbers; '+T.mod+' marks simplified physics (I = 10<sup>45</sup> g cm², pure dipole, Newtonian gravity). cgs units inside, as astronomers use.</p>'+
 rows(r).map(x=>'<div class="eq-row"><b>'+x[0]+'</b>'+x[1]+'<div class="eq-f">'+x[2]+'</div><div class="eq-p">'+x[3]+'</div><div>Now: <span class="eq-v">'+x[4]+'</span></div></div>').join("")+
 '<p class="eq-p">History: Jocelyn Bell Burnell found the first pulsar (PSR B1919+21, period 1.337 s) in 1967. The Crab pulsar was discovered in 1968. Fastest known: PSR J1748−2446ad, 716 Hz.</p>';
}
window.PulsarEq={calc,render};
document.addEventListener("DOMContentLoaded",()=>{const b=document.getElementById("eq-btn"),s=document.getElementById("eq");
 b.addEventListener("click",()=>{s.hidden=!s.hidden;b.setAttribute("aria-expanded",String(!s.hidden));b.setAttribute("aria-pressed",String(!s.hidden));render();if(!s.hidden)s.scrollIntoView({behavior:"smooth",block:"start"})});});
})();
