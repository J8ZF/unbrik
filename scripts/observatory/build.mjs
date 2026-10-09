// Builds the observatory sample page: node scripts/observatory/build.mjs → docs/observatory-handoff/sample-v6.html
// a bigger fit box, a "완료한 섬" count and an island-1 size overlay in the bar.
import fs from 'node:fs';
import {COAST,SMALL} from '/home/claude/unbrik/scripts/islands/island1.mjs';
const here=f=>new URL(f,import.meta.url);
let html=fs.readFileSync(here('base-gpt.html'),'utf8');
const scene=fs.readFileSync(here('scene.js'),'utf8');
// island 1 outline centred on the origin (its bounding box centre is 1656,1179)
const cx=(546+2766)/2,cy=(288+2070)/2,shift=pts=>pts.map(([x,y])=>[+(x-cx).toFixed(1),+(y-cy).toFixed(1)]);
const coast=`window.ISLAND1_COAST=${JSON.stringify([shift(COAST),shift(SMALL)])};`;
const rep=(a,b)=>{if(!html.includes(a))throw Error('missing: '+a.slice(0,60));html=html.replace(a,b);};
// scene
const i0=html.indexOf('<script>\n/* All visual architecture'),i1=html.indexOf('</script>',i0)+9;
html=html.slice(0,i0)+'<script>\n'+coast+'\n'+scene+'\n</script>'+html.slice(i1);
// styles for the lamps and the extra controls
rep('</style>',`.station .lamp{transition:fill .5s}.station.on .lamp{fill:var(--hi)}.station .halo{opacity:0;transition:opacity .5s}.station.on .halo{opacity:.85}select{appearance:none;-webkit-appearance:none;height:44px;padding:0 10px;border:0;border-radius:4px;background:transparent;color:#c5d5d8;font:inherit;font-size:12px;cursor:pointer}select:focus-visible{outline:1px solid #7dcfe7;outline-offset:-2px}
.lbl{font-size:11px;color:#9cb3bc;letter-spacing:.04em;padding-left:6px}
</style>`);
// controls: done-island count, island-1 outline
rep('<button id="pause"','<span class="divider"></span><span class="lbl">완료한 섬</span><select id="done" aria-label="완료한 섬">'+[0,1,2,3,4,5,6].map(n=>`<option value="${n}"${n===2?' selected':''}>${n}</option>`).join('')+'</select><button id="ref" aria-label="섬 1 크기 비교" aria-pressed="false" title="섬 1 크기 비교"><svg viewBox="0 0 24 24"><path d="M4 14l4-7 5 2 4-4 3 6-3 6-6-1-4 3Z"/></svg></button><button id="pause"');
// runtime: bigger fit box, done state, overlay toggle, relic lamps
rep("base=Math.min((w-22)/3140,(h-180)/3140)","base=Math.min((w-22)/4760,(h-180)/4760)");
rep("next=Math.max(.65,Math.min(12,next))","next=Math.max(.6,Math.min(16,next))");
rep("  pauseBtn.onclick=()=>{paused=!paused;syncPause();};syncPause();",
`  pauseBtn.onclick=()=>{paused=!paused;syncPause();};syncPause();
  const doneSel=document.getElementById('done');
  function syncDone(){const n=+doneSel.value;svg.querySelectorAll('.station').forEach(el=>el.classList.toggle('on',+el.dataset.i<n));}
  doneSel.onchange=syncDone;syncDone();
  const refBtn=document.getElementById('ref'),refG=document.getElementById('island-ref');
  refBtn.onclick=()=>{const on=refG.style.display==='none';refG.style.display=on?'':'none';refBtn.setAttribute('aria-pressed',String(on));};`);
rep('<span class="edition">01</span>','<span class="edition">06</span>');
rep("  function animate(now){\n    if(last&&!paused&&!document.hidden)time+=Math.min((now-last)/1000,.06);last=now;",
"  let drawn=0;function animate(now){\n    if(last&&!paused&&!document.hidden)time+=Math.min((now-last)/1000,.06);last=now;\n    if(now-drawn<30){requestAnimationFrame(animate);return;}drawn=now;");
fs.writeFileSync(here('../../docs/observatory-handoff/sample-v6.html'),html);
console.log('observatory.html',(html.length/1024).toFixed(0)+'KB');
