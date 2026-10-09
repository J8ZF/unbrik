// Writes observatory.html (v5): a white terrace over a dark machine — pan/zoom, states, motion.
import fs from 'node:fs';
import {build} from './art5.mjs';
const {sea,s,anim}=build();
const V='-1100 -1100 2200 2200';
const html=`<title>관측소 시안</title>
<style>
:root{color-scheme:dark;--bg:#0b1017;--panel:#111922;--line:#29343e;--text:#e6edf1;--muted:#8b9da9;--accent:#b9f36d;--mono:ui-monospace,SFMono-Regular,Consolas,'Liberation Mono',monospace;--sans:Arial,'Apple SD Gothic Neo','Malgun Gothic',sans-serif}
body{background:var(--bg);color:var(--text);font-family:var(--sans);margin:0}
.wrap{max-width:1180px;margin:0 auto;padding-inline:16px;padding-block:18px 28px;display:grid;gap:14px}
header{display:flex;flex-wrap:wrap;align-items:end;justify-content:space-between;gap:10px 24px}
.eyebrow{font-family:var(--mono);font-size:11px;letter-spacing:.14em;color:var(--muted);text-transform:uppercase}
h1{margin:4px 0 0;font-size:22px;letter-spacing:.02em;text-wrap:balance}
.status{font-family:var(--mono);font-size:12px;color:var(--muted);font-variant-numeric:tabular-nums}
.controls{display:flex;flex-wrap:wrap;align-items:center;gap:10px 16px}
.group{display:flex;align-items:center;gap:8px;font-size:13px;color:var(--muted)}
.seg{display:flex;border:1px solid var(--line);border-radius:10px;overflow:hidden}
.seg button{background:var(--panel);color:var(--muted);border:0;border-right:1px solid var(--line);min-width:34px;padding:8px 10px;font:13px var(--mono);cursor:pointer}
.seg button:last-child{border-right:0}
.seg button[aria-pressed="true"]{color:var(--bg);background:var(--accent)}
.group input[type=range]{width:120px;accent-color:var(--accent)}
label.tog{display:flex;align-items:center;gap:7px;font-size:13px;color:var(--muted);cursor:pointer}
label.tog input{accent-color:var(--accent)}
button:focus-visible,input:focus-visible{outline:2px solid var(--accent);outline-offset:2px}
.map{position:relative;border:1px solid var(--line);border-radius:14px;overflow:hidden;height:clamp(380px,74vh,880px);background:#0a1017;touch-action:none;cursor:grab;contain:strict}
.map.dragging{cursor:grabbing}
.layer{position:absolute;left:0;top:0;transform-origin:0 0;pointer-events:none}
.sheet{position:absolute;left:-1100px;top:-1100px;width:2200px;height:2200px;overflow:visible}
#dots{position:absolute;left:0;top:0;width:100%;height:100%;pointer-events:none}
.zoom{position:absolute;right:12px;bottom:12px;display:grid;gap:6px;z-index:2}
.zoom button{width:38px;height:38px;border-radius:10px;border:1px solid var(--line);background:#111922e6;color:var(--text);font-size:18px;cursor:pointer}
.legend{display:flex;flex-wrap:wrap;gap:6px 18px;font-size:12.5px;color:var(--muted);margin:0;padding:0;list-style:none}
.legend b{color:var(--text);font-weight:600;margin-right:6px}
/* observatory */
.hs{transform:scale(var(--hud,1))}
.core path{stroke-width:1;stroke-linejoin:round}
.hud{font-family:var(--mono);fill:#c9d1d7;letter-spacing:.08em;paint-order:stroke;stroke:#0a0f14;stroke-width:3px;stroke-linejoin:round}
.hud.word{fill:#f2f4f7;font-weight:700;letter-spacing:.16em}
.hud.sub{fill:#a4adb4}.hud.bno{fill:#9aa4ab;font-weight:600}
.ln{transition:fill .4s}.ready .ln{fill:#f3a1c8}
.ready-ring{opacity:0;transition:opacity .4s}.ready .ready-ring{opacity:1}
.sel-ring{opacity:0;transition:opacity .25s}.selected .sel-ring{opacity:.9}
.station .lamp{transition:fill .5s}.station.on .lamp{fill:var(--hi)}
.glow{opacity:0;transition:opacity .5s}.glow.on{opacity:.16}
.rune{transition:fill .5s}.isle.on .rune{fill:#ffbf4a}
@media (max-width:560px){h1{font-size:19px}.map{height:clamp(360px,64vh,660px)}}
</style>
<div class="wrap">
 <header>
  <div><div class="eyebrow">AXIOM 4.0 · VISUAL STUDY</div><h1>관측소 시안</h1></div>
  <div class="status" id="status" aria-live="polite"></div>
 </header>
 <div class="controls">
  <div class="group">완료한 섬<div class="seg" role="group" aria-label="완료한 섬">${[0,1,2,3,4,5].map(i=>`<button type="button" data-done="${i}" aria-pressed="${i===2}">${i}</button>`).join('')}</div></div>
  <label class="group">연구<input type="range" id="prog" min="0" max="30" value="12" aria-label="연구 진행"></label>
  <label class="tog"><input type="checkbox" id="ready">환생 가능</label>
  <label class="tog"><input type="checkbox" id="selected">선택</label>
  <label class="tog"><input type="checkbox" id="motion" checked>움직임</label>
 </div>
 <div class="map" id="map" role="img" aria-label="관측소 지도 시안">
  <div class="layer" id="seaL"><svg class="sheet" viewBox="${V}" aria-hidden="true">${sea}</svg></div>
  <canvas id="dots"></canvas>
  <div class="layer" id="obsL"><svg class="sheet" id="obs" viewBox="${V}" aria-hidden="true">${s}</svg></div>
  <div class="zoom"><button type="button" id="zin" aria-label="확대">+</button><button type="button" id="zout" aria-label="축소">−</button><button type="button" id="zfit" aria-label="전체 보기">⤢</button></div>
 </div>
 <ul class="legend">
  <li><b>01–05</b>하위 관측소: 완료한 섬 색으로 불이 들어옴</li>
  <li><b>연두 선</b>연구 진행</li>
  <li><b>분홍</b>환생 가능</li>
  <li><b>가운데</b>코어(지금의 정십이면체)</li>
 </ul>
</div>
<script>
(()=>{
const ANIM=${JSON.stringify(anim)};
const map=document.getElementById('map'),seaL=document.getElementById('seaL'),obsL=document.getElementById('obsL'),obs=document.getElementById('obs'),cv=document.getElementById('dots'),ctx=cv.getContext('2d');
let cam={x:0,y:0,s:.4},W=0,H=0,dpr=1,motion=!matchMedia('(prefers-reduced-motion: reduce)').matches;
// ---- core: the regular dodecahedron of the old centre ----
const phi=(1+Math.sqrt(5))/2,inv=1/phi,VT=[];for(const x of [-1,1])for(const y of [-1,1])for(const z of [-1,1])VT.push([x,y,z]);
for(const a of [-1,1])for(const b of [-1,1])VT.push([0,a*inv,b*phi],[a*inv,b*phi,0],[a*phi,0,b*inv]);
const sub=(a,b)=>a.map((v,i)=>v-b[i]),dot=(a,b)=>a.reduce((s,v,i)=>s+v*b[i],0),cross=(a,b)=>[a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]];
const FM=new Map();for(let i=0;i<18;i++)for(let j=i+1;j<19;j++)for(let k=j+1;k<20;k++){let n=cross(sub(VT[j],VT[i]),sub(VT[k],VT[i]));const l=Math.hypot(...n);if(l<1e-8)continue;n=n.map(v=>v/l);if(dot(n,VT[i])<0)n=n.map(v=>-v);const d=dot(n,VT[i]);if(VT.some(v=>dot(n,v)>d+1e-7))continue;const ids=VT.map((v,id)=>Math.abs(dot(n,v)-d)<1e-7?id:-1).filter(id=>id>=0);if(ids.length===5)FM.set(ids.join(','),{ids,n,c:n.map(v=>v*d)});}
const FA=[...FM.values()];
// faces ordered round their centres; drawn as flat tones, lit from the upper left
FA.forEach(f=>{const u=sub(VT[f.ids[0]],f.c),l=Math.hypot(...u),e1=u.map(v=>v/l),e2=cross(f.n,e1);f.ids.sort((p,q)=>Math.atan2(dot(sub(VT[p],f.c),e2),dot(sub(VT[p],f.c),e1))-Math.atan2(dot(sub(VT[q],f.c),e2),dot(sub(VT[q],f.c),e1)));});
const CF=FA.map((_,i)=>document.getElementById('cf'+i)),LT=[-.45,-.6,.66],TONES=['#47515a','#5e6973','#7b8790','#9aa5ae','#bcc6cd','#dbe2e7','#f4f7f9'];
function core(t){const a=.55+t*.12,b=.4+t*.19,ca=Math.cos(a),sa=Math.sin(a),cB=Math.cos(b),sB=Math.sin(b);
 const rt=([x,y,z])=>{const u=x*cB+z*sB,v=-x*sB+z*cB;return [u,y*ca-v*sa,y*sa+v*ca];};
 const pts=VT.map(rt).map(([x,y,z])=>{const k=18*5/(5-z);return [x*k,y*k];});
 FA.forEach((f,i)=>{const n=rt(f.n);if(dot(n,sub([0,0,5],rt(f.c)))<=0){CF[i].setAttribute('d','');return;}
  CF[i].setAttribute('d','M'+f.ids.map(id=>pts[id][0].toFixed(1)+','+pts[id][1].toFixed(1)).join('L')+'Z');
  const lv=Math.max(0,dot(n,LT)/Math.hypot(...LT));{const t=TONES[Math.min(6,Math.round(1+lv*5.5))];CF[i].setAttribute('fill',t);CF[i].setAttribute('stroke',t);}});}
const spinEls=ANIM.map(([id,cx,cy,v,s0])=>[document.getElementById(id),cx,cy,v,s0]);
function spin(t){for(const [el,cx,cy,v,s0] of spinEls)el.setAttribute('transform','rotate('+((s0+v*t)%360).toFixed(2)+' '+cx+' '+cy+')');}
// ---- sea grid: small crosses on a world lattice (as in the game), waves of light running out from the rim ----
const tiles=new Map();function pat(P,arm,lw){const k=P+':'+arm;let p=tiles.get(k);if(!p){const c=document.createElement('canvas');c.width=c.height=P;const g=c.getContext('2d');g.fillStyle='#fff';g.fillRect(P/2-arm,P/2-lw/2,arm*2,lw);g.fillRect(P/2-lw/2,P/2-arm,lw,arm*2);p=ctx.createPattern(c,'repeat');if(tiles.size>80)tiles.clear();tiles.set(k,p);}return p;}
let clock=0;
function dots(){ctx.setTransform(1,0,0,1,0,0);ctx.clearRect(0,0,cv.width,cv.height);const s=cam.s*dpr,G=40*2**Math.ceil(Math.log2(48/cam.s/40)),fade=Math.min(1,Math.max(0,G*cam.s/48-1)),arm=Math.round(3.5*dpr*2)/2,lw=Math.round(1.3*dpr*2)/2;
 for(const [g,a] of [[G,1],[G/2,fade]]){if(a<.02)continue;const step=g*s,P=Math.max(8,Math.round(step)),p=pat(P,Math.min(arm,P/2-1),lw);p.setTransform(new DOMMatrix([step/P,0,0,step/P,cam.x*dpr+(20-g/2)*s,cam.y*dpr+(20-g/2)*s]));ctx.globalAlpha=a;ctx.fillStyle=p;ctx.fillRect(0,0,cv.width,cv.height);}
 ctx.globalAlpha=1;ctx.globalCompositeOperation='source-atop';ctx.fillStyle='#2f3f4c';ctx.fillRect(0,0,cv.width,cv.height);
 ctx.setTransform(s,0,0,s,cam.x*dpr,cam.y*dpr);
 if(motion){const P=7.5,V=55,D=620,Wd=95,R0=620,ph=(clock/1000)%P,gr=ctx.createRadialGradient(0,0,R0,0,0,R0+D+Wd);
  for(let j=0;j<=40;j++){const d=j/40*(D+Wd);let b=0;for(let k=0;;k++){const p=(ph+k*P)*V;if(p>D+Wd*2)break;const u=(d-p)/Wd;b+=Math.exp(-u*u);}const inn=Math.min(1,d/50),f=(d<D?(1-d/D)**1.6:0)*inn*inn*(3-2*inn);gr.addColorStop(j/40,'rgba(169,191,207,'+(Math.min(1,b)*f*.6).toFixed(3)+')');}
  ctx.fillStyle=gr;ctx.fillRect(-1600,-1600,3200,3200);ctx.globalCompositeOperation='destination-over';ctx.globalAlpha=.075;ctx.fillRect(-1600,-1600,3200,3200);ctx.globalAlpha=1;}
 ctx.globalCompositeOperation='source-over';}
// ---- camera ----
const status=document.getElementById('status');
function apply(){const t='translate('+cam.x+'px,'+cam.y+'px) scale('+cam.s+')';seaL.style.transform=obsL.style.transform=t;obs.style.setProperty('--hud',Math.max(1,1/cam.s).toFixed(3));dots();status.textContent=Math.round(cam.s*100)+'%';}
function size(){const r=map.getBoundingClientRect();W=r.width;H=r.height;dpr=Math.min(2,devicePixelRatio||1);cv.width=Math.round(W*dpr);cv.height=Math.round(H*dpr);}
function fit(){cam.s=Math.min(W,H)/2000;cam.x=W/2;cam.y=H/2;apply();}
function zoomAt(f,px,py){const s=Math.min(4,Math.max(.08,cam.s*f));cam.x=px-(px-cam.x)*s/cam.s;cam.y=py-(py-cam.y)*s/cam.s;cam.s=s;apply();}
new ResizeObserver(()=>{const fresh=!W;size();fresh?fit():apply();}).observe(map);
map.addEventListener('wheel',e=>{e.preventDefault();const r=map.getBoundingClientRect();zoomAt(Math.exp(-e.deltaY*.0015),e.clientX-r.left,e.clientY-r.top);},{passive:false});
const ptr=new Map();let moved=0,pinch=null;
map.addEventListener('pointerdown',e=>{if(e.target.closest('button'))return;map.setPointerCapture(e.pointerId);ptr.set(e.pointerId,[e.clientX,e.clientY]);moved=0;map.classList.add('dragging');if(ptr.size===2){const [a,b]=[...ptr.values()];pinch={d:Math.hypot(a[0]-b[0],a[1]-b[1]),s:cam.s};}});
map.addEventListener('pointermove',e=>{if(!ptr.has(e.pointerId))return;const [px,py]=ptr.get(e.pointerId);ptr.set(e.pointerId,[e.clientX,e.clientY]);const r=map.getBoundingClientRect();
 if(ptr.size===2&&pinch){const [a,b]=[...ptr.values()],d=Math.hypot(a[0]-b[0],a[1]-b[1]);zoomAt(pinch.s*d/pinch.d/cam.s,(a[0]+b[0])/2-r.left,(a[1]+b[1])/2-r.top);moved+=9;return;}
 cam.x+=e.clientX-px;cam.y+=e.clientY-py;moved+=Math.abs(e.clientX-px)+Math.abs(e.clientY-py);apply();});
const up=e=>{if(!ptr.has(e.pointerId))return;ptr.delete(e.pointerId);if(ptr.size<2)pinch=null;if(!ptr.size)map.classList.remove('dragging');
 if(e.type==='pointerup'&&moved<6&&!ptr.size){const r=map.getBoundingClientRect(),wx=(e.clientX-r.left-cam.x)/cam.s,wy=(e.clientY-r.top-cam.y)/cam.s;if(Math.hypot(wx,wy)<560){sel.checked=!sel.checked;state();}}};
map.addEventListener('pointerup',up);map.addEventListener('pointercancel',up);
document.getElementById('zin').onclick=()=>zoomAt(1.4,W/2,H/2);document.getElementById('zout').onclick=()=>zoomAt(1/1.4,W/2,H/2);document.getElementById('zfit').onclick=fit;
// ---- states ----
const ready=document.getElementById('ready'),sel=document.getElementById('selected'),mot=document.getElementById('motion'),prog=document.getElementById('prog');mot.checked=motion;
let done=2;function state(){obs.classList.toggle('ready',ready.checked);obs.classList.toggle('selected',sel.checked);map.classList.toggle('still',!motion);
 document.querySelectorAll('.station,.glow,.isle').forEach(b=>b.classList.toggle('on',+b.dataset.i<done));document.querySelectorAll('[data-done]').forEach(b=>b.setAttribute('aria-pressed',String(+b.dataset.done===done)));
 const p=+prog.value/30,a1=-90+360*Math.min(p,.9999),r=322,pt=a=>(r*Math.cos(a*Math.PI/180)).toFixed(1)+' '+(r*Math.sin(a*Math.PI/180)).toFixed(1);
 document.getElementById('progArc').setAttribute('d',p>0?'M'+pt(-90)+'A'+r+' '+r+' 0 '+(a1+90>180?1:0)+' 1 '+pt(a1):'');
 document.getElementById('hudProgress').textContent=prog.value+' / 30 연구';}
document.querySelectorAll('[data-done]').forEach(b=>b.onclick=()=>{done=+b.dataset.done;state();});
ready.onchange=sel.onchange=prog.oninput=state;mot.onchange=()=>{motion=mot.checked;state();dots();if(motion)loop(performance.now());};
let last=0;function loop(now){if(!motion)return;if(now-last>=33){last=now;clock=now;const t=now/1000;core(t);spin(t);dots();}requestAnimationFrame(loop);}
core(2);spin(2);state();requestAnimationFrame(loop);
})();
</script>
`;
fs.writeFileSync(new URL('observatory.html',import.meta.url),html);
console.log('observatory.html',(html.length/1024).toFixed(0)+'KB');
