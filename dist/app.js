import {NODES,CHAPTERS,byId,defaultState,level,unlocked,economy,cost,purchase,tick,effectText,validateSave} from './data.js?v=1.3.1';
import {iconSvg,setIcon} from './icons.js?v=1.3.1';
import {checkpointOffline,settleOffline} from './offline.js?v=1.3.1';
const $=id=>document.getElementById(id);
const KEY='axiom-save-v1',BACKUP=KEY+'-backup';
let loadNotice='',storageOK=true;
function load(){
 try{const raw=localStorage.getItem(KEY);if(!raw)return defaultState();try{return validateSave(JSON.parse(raw));}catch{const b=localStorage.getItem(BACKUP);if(b){loadNotice='이전 자동 저장에서 복구했습니다.';return validateSave(JSON.parse(b));}loadNotice='저장 데이터를 읽지 못했습니다. 내보낸 파일이 있다면 설정에서 복원해 주세요.';return defaultState();}}
 catch{storageOK=false;loadNotice='브라우저 저장을 사용할 수 없습니다. 설정에서 저장 데이터를 내보내 주세요.';return defaultState();}
}
let state=load(),selected=NODES.filter(n=>level(state,n)).at(-1)?.id||1,econ=economy(state),lastRender=0,lastSave=0,lastFrame=performance.now(),sessionSeconds=0;
const viewport=$('viewport'),world=$('world'),nodeEls=new Map(),edgeEls=[],chapterEls=[];
let camera=state.camera||{x:viewport.clientWidth/2,y:100,scale:.84};
let toastTimer,burstTimer,gestureUsed=false,suspended=true;
function format(n,decimals=2){
 if(!Number.isFinite(n))return '∞';
 if(n<1000)return n.toLocaleString('en-US',{minimumFractionDigits:n<10?decimals:0,maximumFractionDigits:n<100?decimals:0});
 const mode=state.settings.format;
 if(mode==='scientific')return n.toExponential(2).replace('+','');
 if(mode==='engineering'){const exp=Math.floor(Math.log10(n)/3)*3;return `${(n/10**exp).toFixed(2)}e${exp}`;}
 const units=['','K','M','B','T','Qa','Qi','Sx','Sp','Oc','No','Dc'];
 const k=Math.floor(Math.log10(n)/3);return k<units.length?`${(n/1000**k).toFixed(2).replace(/\.00$/,'')}${units[k]}`:n.toExponential(2).replace('+','');
}
function time(n){if(n<1)return '곧';if(n<60)return `${Math.ceil(n)}초`;if(n<3600)return `${Math.floor(n/60)}분 ${Math.floor(n%60)}초`;if(n<86400)return `${(n/3600).toFixed(1)}시간`;return `${(n/86400).toFixed(1)}일`;}
function toast(message,duration=4000){$('toast').textContent=message;$('toast').classList.add('show');clearTimeout(toastTimer);toastTimer=setTimeout(()=>$('toast').classList.remove('show'),duration);}
function applySettings(){document.body.classList.toggle('reduced-motion',!state.settings.motion||matchMedia('(prefers-reduced-motion: reduce)').matches);for(const k of ['motion','touch','haptic','auto','purchaseCheat'])$(k).checked=state.settings[k];$('format').value=state.settings.format;}
function renderChrome(){
 const compact=state.settings.hudCollapsed;
 $('hud').classList.toggle('is-collapsed',compact);$('hudDetails').hidden=compact;
 $('toggleHud').setAttribute('aria-expanded',String(!compact));$('toggleHud').setAttribute('aria-label',compact?'상단 펼치기':'상단 접기');
 $('compactMoney').textContent='$'+format(state.currencies.money);$('compactRate').textContent='+'+format(econ.rate)+' /s';
 $('cheatBadge').hidden=!state.settings.purchaseCheat;
}
function save(notify=false){
 state.camera={...camera};state.savedAt=Date.now();if(!suspended)checkpointOffline(state,state.savedAt);
 try{const previous=localStorage.getItem(KEY);if(previous){try{validateSave(JSON.parse(previous));localStorage.setItem(BACKUP,previous);}catch{}}
 localStorage.setItem(KEY,JSON.stringify(state));storageOK=true;$('saveState').innerHTML='<i></i> 자동 저장';if(notify)toast('진행 상황을 저장했습니다.');}
 catch{storageOK=false;$('saveState').textContent='저장 불가 · 설정에서 내보내기';if(notify)toast('브라우저 저장에 실패했습니다. 저장 데이터를 내보내 주세요.');}
}
function discovery(n){if(level(state,n))return 3;if(n.id===1||n.req.some(r=>level(state,r.id)>0))return 2;if(n.req.some(r=>{const p=byId.get(r.id);return p.id===1||p.req.some(q=>level(state,q.id)>0);}))return 1;return 0;}
const visibility=new Map();
function createGraph(){
 for(const n of NODES){
 const el=document.createElement('button');el.className='node';el.id=`node-${n.id}`;el.dataset.id=n.id;el.style.left=n.x+'px';el.style.top=n.y+'px';el.style.setProperty('--node-color',CHAPTERS[n.chapter].color);
 el.innerHTML='<div class="node-top"><span class="symbol"></span><span class="node-id"></span></div><span class="node-name"></span><span class="node-price"><span></span><span class="node-status"></span></span><i class="level-dots"></i>';
 el.addEventListener('click',ev=>{if(ev.detail===0)selectNode(n.id);});
 $('nodes').append(el);nodeEls.set(n.id,el);
 for(const r of n.req){const p=byId.get(r.id),path=document.createElementNS('http://www.w3.org/2000/svg','path');
 const x1=p.x,y1=p.y+59,x2=n.x,y2=n.y-59;
 let d;
 if(n.y-p.y>600){const side=p.x<=0?-400:400;d=`M ${x1} ${y1} C ${side} ${y1+70}, ${side} ${y2-70}, ${x2} ${y2}`;}
 else {const mid=(y1+y2)/2;d=`M ${x1} ${y1} C ${x1} ${mid}, ${x2} ${mid}, ${x2} ${y2}`;}
 path.setAttribute('d',d);path.style.setProperty('--edge-color',CHAPTERS[n.chapter].color);$('edges').append(path);edgeEls.push({el:path,from:p,to:n});}
 }
 CHAPTERS.forEach((c,i)=>{const first=NODES.find(n=>n.chapter===i),el=document.createElement('div');el.className='chapter-mark';el.style.left='-310px';el.style.top=(first.y-125)+'px';el.textContent=`0${i+1} / ${c.name}`;$('chapterMarks').append(el);chapterEls.push(el);});
}
function graph(){
 for(const n of NODES){
 const d=discovery(n);visibility.set(n.id,d);const el=nodeEls.get(n.id);el.hidden=!d;if(!d)continue;
 const l=level(state,n),can=unlocked(state,n),p=cost(state,n,econ),afford=can&&(state.settings.purchaseCheat||state.currencies.money>=p)&&l<n.max;
 const cls=`node ${n.gate?'gate ':''}${l?'bought ':''}${can?'unlocked ':'locked '}${afford?'available ':''}${selected===n.id?'selected ':''}${d===1?'ghost ':''}`;
 const popping=el.classList.contains('pop');if(el.className!==cls+(popping?'pop':''))el.className=cls+(popping?'pop':'');
 el.disabled=d===1;el.tabIndex=d>1?0:-1;
 setIcon(el.querySelector('.symbol'),d===1?'LockKeyhole':n.id);
 el.querySelector('.node-id').textContent=d===1?'???':String(n.id).padStart(3,'0');
 el.querySelector('.node-name').textContent=d===1?'UNEXPLORED':n.name;
 el.querySelector('.node-price>span').textContent=d===1?'미발견':l>=n.max?'완료':can?'$'+format(p):'선행 연구 필요';
 const status=el.querySelector('.node-status');if(d!==1&&l>=n.max)setIcon(status,'Check');else{status.textContent=d===1?'':n.max>1?`${l}/${n.max}`:'';delete status.dataset.icon;}
 el.querySelector('.level-dots').style.width=(l/n.max*100)+'%';
 el.setAttribute('aria-label',d===1?'미발견 연구':`${n.name}. ${effectText(n)}. ${l>=n.max?'완료':`레벨 ${l}/${n.max}, 비용 ${format(p)} 달러, ${can?'구매 조건 충족':'선행 연구 필요'}`}`);
 }
 for(const {el,from,to}of edgeEls){const visible=visibility.get(from.id)>0&&visibility.get(to.id)>0;el.style.display=visible?'':'none';if(!visible)continue;const flash=el.classList.contains('flashing');el.setAttribute('class',`edge ${level(state,to)?'researched':level(state,from)?'active':'ghost'}${flash?' flashing':''}`);}
 chapterEls.forEach((el,i)=>el.hidden=!NODES.some(n=>n.chapter===i&&visibility.get(n.id)>1));
}
function renderPanel(){
 const n=byId.get(selected);$('nodePanel').hidden=!n;if(!n)return;
 const collapsed=state.settings.panelCollapsed;
 $('nodePanel').classList.toggle('is-collapsed',collapsed);$('panelDetails').hidden=collapsed;
 $('togglePanel').setAttribute('aria-expanded',String(!collapsed));$('panelToggleText').textContent=collapsed?'연구 정보 펼치기':'연구 정보 접기';
 $('collapsedName').textContent=n.name;$('collapsedName').hidden=!collapsed;setIcon($('panelToggleIcon'),collapsed?'ChevronUp':'ChevronDown');
 if(collapsed)return;
 const l=level(state,n),p=cost(state,n,econ),can=unlocked(state,n),max=l>=n.max,afford=state.settings.purchaseCheat||state.currencies.money>=p;
 setIcon($('panelSymbol'),n.id);$('panelSymbol').style.color=CHAPTERS[n.chapter].color;
 $('panelMeta').textContent=`${String(n.id).padStart(3,'0')} / ${CHAPTERS[n.chapter].name}${n.max>1?` · LV.${l}/${n.max}`:''}${n.longTerm?' · 장기 연구':''}`;
 $('panelName').textContent=n.name;$('panelEffect').textContent=effectText(n);
 const reqKey=n.req.map(r=>`${r.id}:${level(state,r.id)>=r.level}`).join(',')+n.any;
 if($('requirements').dataset.key!==reqKey){$('requirements').dataset.key=reqKey;$('requirements').replaceChildren();if(n.any){const label=document.createElement('span');label.className='req';label.textContent='둘 중 하나';$('requirements').append(label);}
 for(const r of n.req){const b=document.createElement('button'),done=level(state,r.id)>=r.level;b.className=`req ${done?'done':''}`;b.innerHTML=iconSvg(done?'Check':'Circle');const label=document.createElement('span');label.textContent=byId.get(r.id).name;b.append(label);b.onclick=()=>{selectNode(r.id);focusNode(r.id);};$('requirements').append(b);}}
 $('costLabel').textContent=max?'RESEARCH COMPLETE':'RESEARCH COST';$('panelCost').textContent=max?'완료':'$'+format(p);
 $('buy').className=max?'completed':!can?'blocked':afford?'':'waiting';$('buy').disabled=max||!can;
 $('buyText').textContent=max?'연구 완료':!can?'잠김':n.max>1&&l>0?'레벨 업':'연구';
 $('buyDetail').textContent=max?'MAX':!can?'조건 미충족':state.settings.purchaseCheat?'무료 연구':afford?l?`Lv.${l+1}`:'구매 가능':time((p-state.currencies.money)/(econ.rate*(1+econ.burst/econ.interval)))+' 후';
 $('purchaseProgress').style.width=(max?100:Math.min(100,state.currencies.money/p*100))+'%';
}
function render(){
 econ=economy(state);$('money').textContent=format(state.currencies.money);$('rate').innerHTML=`+${format(econ.rate)}<span> /s</span>`;
 $('cacheInfo').textContent=econ.burst?`CACHE ${Math.floor(state.timers.cache)} / ${Math.round(econ.interval)}s`:'BASE CLOCK · 1 Hz';
 $('progressLabel').innerHTML=`${String(econ.count).padStart(2,'0')} <em>/ 80</em>`;$('progressBar').style.width=`${econ.count/80*100}%`;
 const active=NODES.filter(n=>level(state,n)).at(-1);$('chapterLabel').textContent=CHAPTERS[active?.chapter||0].name;
 $('autoSetting').hidden=!econ.auto;$('autoNote').hidden=!econ.auto;
 renderChrome();graph();renderPanel();if($('settingsDialog').open&&!$('pane-stats').hidden)renderStats();
}
function selectNode(id){const n=byId.get(id);if(!n||discovery(n)<2)return false;selected=id;state.settings.panelCollapsed=false;render();return true;}
function transform(){world.style.transform=`translate(${camera.x}px,${camera.y}px) scale(${camera.scale})`;world.classList.toggle('overview',camera.scale<.38);$('zoomLabel').textContent=`${Math.round(camera.scale*100)}%`;$('coords').textContent=`X ${Math.round(-camera.x/camera.scale)} · Y ${Math.round(-camera.y/camera.scale)}`;viewport.style.backgroundPosition=`${camera.x}px ${camera.y}px`;viewport.style.backgroundSize=`${24*Math.max(.5,camera.scale)}px ${24*Math.max(.5,camera.scale)}px`;}
function constrain(){const w=viewport.clientWidth,h=viewport.clientHeight;camera.x=Math.min(w+650*camera.scale,Math.max(-650*camera.scale,camera.x));camera.y=Math.min(h+200*camera.scale,Math.max(-NODES.at(-1).y*camera.scale-200,camera.y));}
function zoomAt(scale,x,y){const next=Math.max(.035,Math.min(1.7,scale)),ratio=next/camera.scale;camera.x=x-(x-camera.x)*ratio;camera.y=y-(y-camera.y)*ratio;camera.scale=next;constrain();transform();}
let cameraAnim=0;
function moveCamera(target){cancelAnimationFrame(cameraAnim);if(!state.settings.motion){camera=target;transform();return;}const start={...camera},t0=performance.now();function step(now){const t=Math.min(1,(now-t0)/380),ease=1-(1-t)**3;camera={x:start.x+(target.x-start.x)*ease,y:start.y+(target.y-start.y)*ease,scale:start.scale+(target.scale-start.scale)*ease};transform();if(t<1)cameraAnim=requestAnimationFrame(step);}cameraAnim=requestAnimationFrame(step);}
function focusNode(id){const n=byId.get(id);moveCamera({x:viewport.clientWidth/2-n.x*.88,y:Math.min(125,viewport.clientHeight*.38)-n.y*.88,scale:.88});}
function fit(){const visible=NODES.filter(n=>discovery(n)>0);const minX=Math.min(...visible.map(n=>n.x))-92,maxX=Math.max(...visible.map(n=>n.x))+92,minY=Math.min(...visible.map(n=>n.y))-95,maxY=Math.max(...visible.map(n=>n.y))+95;const scale=Math.max(.035,Math.min(1,(viewport.clientWidth-55)/(maxX-minX),(viewport.clientHeight-75)/(maxY-minY)));moveCamera({scale,x:(viewport.clientWidth-35)/2-(minX+maxX)/2*scale,y:(viewport.clientHeight-20)/2-(minY+maxY)/2*scale});}
function ripple(x,y){if(!state.settings.touch||!state.settings.motion)return;const el=document.createElement('i');el.className='ripple';el.style.left=x+'px';el.style.top=y+'px';viewport.append(el);el.addEventListener('animationend',()=>el.remove());setTimeout(()=>el.remove(),650);}
function buySelected(){const n=byId.get(selected);if(!n)return false;const before=economy(state).count;
 if(!purchase(state,n)){if(state.settings.motion){$('buy').classList.remove('shake');void $('buy').offsetWidth;$('buy').classList.add('shake');}if(unlocked(state,n)&&level(state,n)<n.max)toast(`$${format(Math.max(0,cost(state,n)-state.currencies.money))} 더 필요합니다.`);return false;}
 if(state.settings.haptic&&navigator.vibrate)navigator.vibrate(14);
 const el=nodeEls.get(n.id);if(state.settings.motion){el.classList.add('pop');setTimeout(()=>el.classList.remove('pop'),550);for(const edge of edgeEls.filter(e=>e.from.id===n.id)){edge.el.classList.add('flashing');setTimeout(()=>edge.el.classList.remove('flashing'),1250);}}
 if(n.type==='automation'&&level(state,n)===1)toast('SCHEDULER 해금 · 설정에서 자동 구매를 켤 수 있습니다.');
 render();save();if(econ.count===80&&before<80)toast('80개 노드 연구 완료. AXIOM에 도달했습니다.');return true;
}
const pointers=new Map();let gesture=null;
function point(ev){const rect=viewport.getBoundingClientRect();return {x:ev.clientX-rect.left,y:ev.clientY-rect.top};}
function resetGesture(pinched=false){const p=[...pointers.values()];if(p.length>=2){const mid={x:(p[0].x+p[1].x)/2,y:(p[0].y+p[1].y)/2};gesture={pinched:true,moved:true,distance:Math.hypot(p[0].x-p[1].x,p[0].y-p[1].y),scale:camera.scale,anchor:{x:(mid.x-camera.x)/camera.scale,y:(mid.y-camera.y)/camera.scale}};}else if(p.length){gesture={start:p[0],base:{...camera},moved:pinched,pinched,id:p[0].node,time:performance.now()};}}
viewport.addEventListener('pointerdown',ev=>{if(ev.target.closest('.map-tools'))return;if(ev.pointerType==='mouse'&&ev.button!==0)return;cancelAnimationFrame(cameraAnim);const p={...point(ev),node:Number(ev.target.closest('.node')?.dataset.id)||null};pointers.set(ev.pointerId,p);viewport.setPointerCapture(ev.pointerId);resetGesture(pointers.size>1);ev.preventDefault();});
viewport.addEventListener('pointermove',ev=>{if(!pointers.has(ev.pointerId))return;const prev=pointers.get(ev.pointerId);pointers.set(ev.pointerId,{...point(ev),node:prev.node});const ps=[...pointers.values()];if(ps.length>=2&&gesture){const a=ps[0],b=ps[1],mid={x:(a.x+b.x)/2,y:(a.y+b.y)/2};camera.scale=Math.max(.035,Math.min(1.7,gesture.scale*Math.hypot(a.x-b.x,a.y-b.y)/Math.max(1,gesture.distance)));camera.x=mid.x-gesture.anchor.x*camera.scale;camera.y=mid.y-gesture.anchor.y*camera.scale;}else if(gesture){const p=ps[0],dx=p.x-gesture.start.x,dy=p.y-gesture.start.y;if(Math.hypot(dx,dy)>7)gesture.moved=true;if(gesture.moved){camera.x=gesture.base.x+dx;camera.y=gesture.base.y+dy;}}if(gesture?.moved){constrain();transform();$('hint').style.opacity='0';gestureUsed=true;}ev.preventDefault();});
function endPointer(ev,cancelled=false){if(!pointers.has(ev.pointerId))return;const p=pointers.get(ev.pointerId),tap=!cancelled&&pointers.size===1&&gesture&&!gesture.moved&&!gesture.pinched&&performance.now()-gesture.time<900,id=gesture?.id;pointers.delete(ev.pointerId);if(tap){ripple(p.x,p.y);if(id)selectNode(id);}if(pointers.size)resetGesture(true);else{gesture=null;state.camera={...camera};}if(viewport.hasPointerCapture(ev.pointerId))viewport.releasePointerCapture(ev.pointerId);}
viewport.addEventListener('pointerup',e=>endPointer(e));viewport.addEventListener('pointercancel',e=>endPointer(e,true));
viewport.addEventListener('wheel',e=>{e.preventDefault();cancelAnimationFrame(cameraAnim);const p=point(e);zoomAt(camera.scale*Math.exp(-e.deltaY*.002),p.x,p.y);},{passive:false});
viewport.addEventListener('keydown',e=>{if(e.target!==viewport)return;const steps={ArrowLeft:[70,0],ArrowRight:[-70,0],ArrowUp:[0,70],ArrowDown:[0,-70]};if(steps[e.key]){e.preventDefault();camera.x+=steps[e.key][0];camera.y+=steps[e.key][1];constrain();transform();}else if(['+','=','-'].includes(e.key)){e.preventDefault();zoomAt(camera.scale*(e.key==='-'?.8:1.25),viewport.clientWidth/2,viewport.clientHeight/2);}});
$('zoomIn').onclick=()=>zoomAt(camera.scale*1.25,viewport.clientWidth/2,viewport.clientHeight/2);$('zoomOut').onclick=()=>zoomAt(camera.scale*.8,viewport.clientWidth/2,viewport.clientHeight/2);$('fit').onclick=fit;
$('focus').onclick=()=>{const candidates=NODES.filter(n=>unlocked(state,n)&&level(state,n)===0);const n=candidates.sort((a,b)=>cost(state,a)-cost(state,b))[0]||NODES.find(n=>unlocked(state,n)&&level(state,n)<n.max)||NODES.at(-1);selectNode(n.id);focusNode(n.id);};
$('buy').onclick=buySelected;
$('toggleHud').onclick=()=>{state.settings.hudCollapsed=!state.settings.hudCollapsed;renderChrome();save();};
$('togglePanel').onclick=()=>{state.settings.panelCollapsed=!state.settings.panelCollapsed;renderPanel();save();};
$('settings').onclick=()=>{applySettings();renderStats();$('settingsDialog').showModal();};$('closeSettings').onclick=()=>$('settingsDialog').close();
$('settingsDialog').addEventListener('click',e=>{if(e.target===$('settingsDialog')){const r=e.target.getBoundingClientRect();if(e.clientY<r.top||e.clientX<r.left||e.clientX>r.right)$('settingsDialog').close();}});
for(const button of document.querySelectorAll('[data-tab]')){button.onclick=()=>{for(const b of document.querySelectorAll('[data-tab]')){const active=b===button;b.setAttribute('aria-selected',String(active));$('pane-'+b.dataset.tab).hidden=!active;}if(button.dataset.tab==='stats')renderStats();};}
for(const k of ['motion','touch','haptic','auto'])$(k).onchange=()=>{state.settings[k]=$(k).checked;applySettings();save();};$('format').onchange=()=>{state.settings.format=$('format').value;render();save();};
$('purchaseCheat').onchange=()=>{state.settings.purchaseCheat=$('purchaseCheat').checked;render();save();toast(state.settings.purchaseCheat?'테스트 치트 ON · 자금 소모 없이 연구합니다.':'테스트 치트 OFF · 구매 시 정상 차감됩니다.');};
$('saveNow').onclick=()=>save(true);
function exportText(){save();$('transfer').hidden=false;$('saveText').value=JSON.stringify(state);$('transferStatus').textContent='파일을 저장하거나 위 데이터를 복사해 보관하세요.';return $('saveText').value;}
$('exportSave').onclick=()=>{const txt=exportText();const blob=new Blob([txt],{type:'application/json'}),url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download='axiom-save-'+new Date().toISOString().slice(0,10)+'.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);};
$('importSave').onclick=()=>{$('transfer').hidden=false;$('saveText').value='';$('transferStatus').textContent='현재 진행을 교체할 저장 파일을 선택하거나 데이터를 붙여넣으세요.';$('saveText').focus();};
$('copySave').onclick=async()=>{try{await navigator.clipboard.writeText($('saveText').value);$('transferStatus').textContent='복사했습니다.';}catch{$('saveText').select();$('transferStatus').textContent='선택한 데이터를 직접 복사해 주세요.';}};
$('loadFile').onclick=()=>$('saveFile').click();$('saveFile').onchange=async()=>{const f=$('saveFile').files[0];if(!f)return;if(f.size>1000000){$('transferStatus').textContent='저장 파일이 너무 큽니다.';return;}$('saveText').value=await f.text();$('transferStatus').textContent='데이터를 읽었습니다. 아래 복원 버튼을 누르면 적용됩니다.';$('saveFile').value='';};
function restore(input){const next=validateSave(input);checkpointOffline(next);state=next;suspended=document.hidden;econ=economy(state);selected=NODES.filter(n=>level(state,n)).at(-1)?.id||1;camera=state.camera||{x:viewport.clientWidth/2,y:100,scale:.84};applySettings();render();transform();lastFrame=performance.now();save();}
$('applySave').onclick=()=>{try{const txt=$('saveText').value;if(txt.length>1000000)throw Error('저장 데이터가 너무 큽니다.');restore(JSON.parse(txt));$('transferStatus').textContent='저장 데이터를 복원했습니다.';toast('저장 데이터를 복원했습니다.');}catch(e){$('transferStatus').textContent=e instanceof SyntaxError?'JSON 형식을 확인해 주세요.':e.message;}};
$('resetButton').onclick=()=>{$('resetConfirm').hidden=!$('resetConfirm').hidden;$('resetInput').value='';$('confirmReset').disabled=true;};$('resetInput').oninput=()=>$('confirmReset').disabled=$('resetInput').value!=='RESET';
$('confirmReset').onclick=()=>{if($('resetInput').value!=='RESET')return;restore(defaultState());try{localStorage.removeItem(BACKUP);}catch{}sessionSeconds=0;$('resetConfirm').hidden=true;$('transfer').hidden=true;$('saveText').value='';$('settingsDialog').close();toast('새 연구를 시작합니다.');focusNode(1);};
function renderStats(){const e=economy(state);const entries=[['구매한 노드',`${e.count} / 80`],['총 연구 레벨',format(e.total,0)],['구매 횟수',format(state.stats.purchases,0)],['총 획득','$'+format(state.stats.earned)],['총 사용','$'+format(state.stats.spent)],['현재 생산','$'+format(e.rate)+' /s'],['최고 생산','$'+format(state.stats.peak)+' /s'],['캐시 보너스',e.burst?`${format(e.rate*e.burst)} / ${Math.round(e.interval)}s`:'미해금'],['총 플레이 시간',time(state.stats.seconds)],['오프라인 경과',time(state.stats.offlineSeconds)],['오프라인 수입','$'+format(state.stats.offlineEarned)],['오프라인 환산 생산',time(state.stats.offlineEffectiveSeconds)],['현재 세션',time(sessionSeconds)],['비용 할인',`${((1-e.discount)*100).toFixed(1)}%`]];$('stats').replaceChildren();for(const [a,b]of entries){const div=document.createElement('div');div.className='stat';const span=document.createElement('span'),strong=document.createElement('strong');span.textContent=a;strong.textContent=b;div.append(span,strong);$('stats').append(div);}$('sectorStats').innerHTML=CHAPTERS.map((c,i)=>{const nodes=NODES.filter(n=>n.chapter===i),count=nodes.filter(n=>level(state,n)).length;return `<div class="sector-row" style="--sector-color:${c.color}"><div><span>${c.name}</span><span>${count} / ${nodes.length}</span></div><span class="bar"><i style="width:${count/nodes.length*100}%"></i></span></div>`;}).join('');}
function suspend(){
 if(suspended)return;
 checkpointOffline(state);suspended=true;pointers.clear();gesture=null;save();
}
function resume(){
 if(document.hidden||!suspended)return;
 // Prefer a newer checkpoint if another window saved while this one was away.
 try{const raw=localStorage.getItem(KEY);if(raw){const input=JSON.parse(raw);if(input.savedAt>state.savedAt)state=validateSave(input);}}catch{}
 const reward=settleOffline(state);suspended=false;lastFrame=performance.now();checkpointOffline(state);save();render();
 if(reward.elapsed>=5&&reward.amount>0)toast(`오프라인 생산 +$${format(reward.amount)}\n${time(reward.elapsed)} 경과 · ${time(reward.effectiveSeconds)}에 해당하는 생산`,8500);
}
document.addEventListener('visibilitychange',()=>{if(document.hidden)suspend();else resume();});
window.addEventListener('pagehide',suspend);window.addEventListener('pageshow',resume);
window.addEventListener('blur',suspend);window.addEventListener('focus',resume);
window.addEventListener('storage',ev=>{if(ev.key!==KEY||!ev.newValue)return;try{const incoming=validateSave(JSON.parse(ev.newValue));const settings=state.settings;state=incoming;state.settings=settings;if(!suspended)checkpointOffline(state);render();lastFrame=performance.now();}catch{}});
let previousWidth=viewport.clientWidth;new ResizeObserver(()=>{const w=viewport.clientWidth;camera.x+=(w-previousWidth)/2;previousWidth=w;constrain();transform();}).observe(viewport);
function frame(now){const dt=Math.max(0,Math.min(1,(now-lastFrame)/1000));lastFrame=now;if(!document.hidden&&!suspended){sessionSeconds+=dt;const events=tick(state,dt);for(const e of events){if(e.type==='cache'){$('burstToast').textContent=`CACHE +$${format(e.amount)}`;$('burstToast').classList.add('show');clearTimeout(burstTimer);burstTimer=setTimeout(()=>$('burstToast').classList.remove('show'),1800);}}
 if(now-lastRender>160){render();lastRender=now;}if(now-lastSave>10000){save();lastSave=now;}}
 requestAnimationFrame(frame);
}
for(const el of document.querySelectorAll('[data-ui-icon]'))setIcon(el,el.dataset.uiIcon);
createGraph();applySettings();render();transform();resume();requestAnimationFrame(frame);if(loadNotice)setTimeout(()=>toast(loadNotice),500);if(!storageOK)$('saveState').textContent='저장 불가 · 설정에서 내보내기';
// Optional browser agent tools use exactly the same state and purchase guard as the UI.
if(document.modelContext?.registerTool){const lifecycle=new AbortController();const register=tool=>{try{Promise.resolve(document.modelContext.registerTool(tool,{signal:lifecycle.signal})).catch(()=>{});}catch{}};
 register({name:'read_research_state',title:'연구 상태 읽기',description:'현재 자원, 생산량, 발견한 연구와 구매 조건을 읽습니다.',inputSchema:{type:'object',properties:{},additionalProperties:false},annotations:{readOnlyHint:true},execute(){const e=economy(state);return {money:state.currencies.money,rate:e.rate,purchased:e.count,nodes:NODES.filter(n=>discovery(n)>1).map(n=>({id:n.id,name:n.name,level:level(state,n),max:n.max,cost:cost(state,n,e),unlocked:unlocked(state,n)}))};}});
 register({name:'select_research',title:'연구 선택',description:'발견한 연구를 선택하고 화면을 이동합니다. 구매하지 않습니다.',inputSchema:{type:'object',properties:{id:{type:'integer',minimum:1,maximum:80}},required:['id'],additionalProperties:false},annotations:{readOnlyHint:false},execute(input){if(!input||!Number.isInteger(input.id)||!selectNode(input.id))throw Error('발견한 연구 ID가 필요합니다.');focusNode(input.id);return {selected:input.id};}});
 register({name:'purchase_research',title:'연구 구매',description:'발견한 연구를 1레벨 구매합니다. 선행 조건과 최대 레벨을 검사합니다. 무료 연구 치트가 켜져 있으면 자금을 소모하지 않으며, 꺼져 있으면 보유 금액을 검사하고 구매 금액을 차감합니다.',inputSchema:{type:'object',properties:{id:{type:'integer',minimum:1,maximum:80}},required:['id'],additionalProperties:false},annotations:{readOnlyHint:false},execute(input){if(!input||!Number.isInteger(input.id)||!selectNode(input.id))throw Error('발견한 연구 ID가 필요합니다.');if(!buySelected())throw Error('자원이 부족하거나 연구가 잠겼거나 최대 레벨입니다.');return {id:input.id,level:level(state,input.id),money:state.currencies.money};}});
 window.addEventListener('pagehide',()=>lifecycle.abort(),{once:true});}
