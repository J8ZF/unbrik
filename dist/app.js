import {NODES,CHAPTERS,byId,defaultState,level,unlocked,economy,cost,affordable,waitTime,normalizedCost,copyPreferences,purchase,tick,effectText,validateSave,MAP_LAYOUT,sectorProgress,CURRENCY_DEFS,MAPS,currentMap,worldState,PRESTIGE_NODES,prestigeById,prestigeBonuses,tokensFor,PRESTIGE_THRESHOLD,treeComplete,prestigeReady,prestige,autoResearch} from './data.js?v=3.0-bloom';
import {PRESTIGE_BRANCHES,PRESTIGE_LAYOUT,prestigeLevel,prestigeUnlocked,prestigeCost,prestigeAffordable,prestigePurchase,petalProgress} from './prestige.js?v=3.0-bloom';
import {createBloom} from './bloom.js?v=3.0-bloom';
import {iconSvg,setIcon} from './icons.js?v=3.0-bloom';
import {checkpointOffline,settleOffline} from './offline.js?v=3.0-bloom';
import {BRANCHES,CENTER,boundsOf,connectionPath,centerPath} from './layout.js?v=3.0-bloom';
import {wireframePaths} from './hub.js?v=3.0-bloom';
import {UPDATES,updatePage} from './updates.js?v=3.0-bloom';
import {interpolateCamera,overviewMode,mapFrames,fitCamera} from './camera.js?v=3.0-bloom';
import {createOpalMotion,installGameSelectionGuard} from './effects.js?v=3.0-bloom';
import {createNotifications} from './notifications.js?v=3.0-bloom';
const $=id=>document.getElementById(id);
const CENTER_SELECTION=-1;
// Two maps share the viewport: the mainland (research ids 1-105) and the
// prestige flower (ids 1001+). `state.map` says which one is shown.
const onPrestige=()=>state.map==='prestige';
const lookupNode=id=>prestigeById.get(id)||byId.get(id);
const activeNodes=()=>onPrestige()?PRESTIGE_NODES:NODES;
const activeBounds=()=>onPrestige()?PRESTIGE_LAYOUT.bounds:MAP_LAYOUT.bounds;
const selectionByMap={};
const SYMBOLS={money:'$',coin:'¢',token:'✿'};
function defaultSelection(){if(state.map==='prestige')return PRESTIGE_NODES.filter(n=>prestigeLevel(state,n)).at(-1)?.id||CENTER_SELECTION;return NODES.filter(n=>level(state,n)).at(-1)?.id||1;}
const setText=(el,value)=>{const next=String(value);if(el.textContent!==next)el.textContent=next;};
const setHtml=(el,value)=>{if(el.dataset.html!==value){el.innerHTML=value;el.dataset.html=value;}};
// The reward display reads the same atomic payout as the economy.
let cacheReward={money:0,coin:0,until:0};
const KEY='unbrik-save-v2',BACKUP=KEY+'-backup';
let loadNotice='',storageOK=true;
function load(){
 try{const raw=localStorage.getItem(KEY);if(!raw){const legacy=localStorage.getItem('axiom-save-v1');if(legacy){loadNotice='2.0 리워크 · 새로운 연구를 시작합니다.';try{return copyPreferences(JSON.parse(legacy));}catch{}}return defaultState();}try{return validateSave(JSON.parse(raw));}catch{const b=localStorage.getItem(BACKUP);if(b){loadNotice='이전 자동 저장에서 복구했습니다.';return validateSave(JSON.parse(b));}loadNotice='저장 데이터를 읽지 못했습니다. 내보낸 파일이 있다면 설정에서 복원해 주세요.';return defaultState();}}
 catch{storageOK=false;loadNotice='브라우저 저장을 사용할 수 없습니다. 설정에서 저장 데이터를 내보내 주세요.';return defaultState();}
}
let state=load(),selected=defaultSelection(),econ=economy(state),lastRender=0,lastSave=0,lastFrame=performance.now(),sessionSeconds=0;
const viewport=$('viewport'),world=$('world'),nodeEls=new Map(),edgeEls=[],chapterEls=[],sectorEls=[],spokeEls=[];
function initialCamera(){const n=lookupNode(selected)||activeNodes()[0];const started=onPrestige()?state.prestige.purchases>0:econ.count>0;if(started)return {x:viewport.clientWidth/2-n.x*.78,y:viewport.clientHeight*.4-n.y*.78,scale:.78};const scale=Math.max(.22,Math.min(.55,(viewport.clientHeight-65)/600));return {x:viewport.clientWidth/2,y:viewport.clientHeight*.78,scale};}
let camera=state.camera||initialCamera();
let gestureUsed=false,suspended=true,cameraMoving=false,lastHubFrame=0,updatesPage=1;
const motionPreference=matchMedia('(prefers-reduced-motion: reduce)');
let opalMotion=null,bloom=null;
let selectionPending=false,selectionEpoch=0,navigationFrame=0,panelAnimation=null,navigatorCloseTimer=0,cameraIntent=null;
function format(n,decimals=2){
 if(!Number.isFinite(n))return '∞';
 if(n<1000)return n.toLocaleString('en-US',{minimumFractionDigits:n<10?decimals:0,maximumFractionDigits:n<100?decimals:0});
 const mode=state.settings.format;
 if(mode==='scientific')return n.toExponential(2).replace('+','');
 if(mode==='engineering'){const exp=Math.floor(Math.log10(n)/3)*3;return `${(n/10**exp).toFixed(2)}e${exp}`;}
 const units=['','K','M','B','T','Qa','Qi','Sx','Sp','Oc','No','Dc'];
 const k=Math.floor(Math.log10(n)/3);return k<units.length?`${(n/1000**k).toFixed(2).replace(/\.00$/,'')}${units[k]}`:n.toExponential(2).replace('+','');
}
function compactFormat(n,digits=3){if(n<1000)return format(n,n<10?1:0);n=Number(n.toPrecision(digits));const exp=Math.floor(Math.log10(n)/3)*3,m=n/10**exp,decimals=Math.max(0,digits-1-Math.floor(Math.log10(m)));if(state.settings.format==='scientific')return n.toExponential(digits-1).replace('+','');if(state.settings.format==='engineering')return m.toFixed(decimals)+'e'+exp;const units=['','K','M','B','T','Qa','Qi','Sx','Sp','Oc','No','Dc'];return exp/3<units.length?m.toFixed(decimals)+units[exp/3]:n.toExponential(digits-1).replace('+','');}
// Tokens keep two decimals (the prestige formula yields fractions).
function tokenFormat(n){if(!Number.isFinite(n))return '∞';if(n<1000)return n.toLocaleString('en-US',{minimumFractionDigits:0,maximumFractionDigits:2});return format(n);}
const amountFormat=(k,v)=>k==='token'?tokenFormat(v):format(v);
function priceMarkup(prices){return Object.entries(prices).map(([k,v])=>'<span class="price-'+k+'"><i class="sym sym-'+k+'">'+SYMBOLS[k]+'</i>'+amountFormat(k,v)+'</span>').join('');}
// Currency symbols in numeric displays take their currency color.
function symbolMarkup(text){return String(text).replace(/\$(?=[0-9])/g,'<i class="sym sym-money">$</i>').replace(/¢(?=[0-9])/g,'<i class="sym sym-coin">¢</i>').replace(/✿(?=[0-9])/g,'<i class="sym sym-token">✿</i>');}
function priceText(prices){return Object.entries(prices).map(([k,v])=>SYMBOLS[k]+amountFormat(k,v)).join(' · ');}
function time(n){if(!Number.isFinite(n))return '생산 해금 필요';if(n<1)return '곧';if(n<60)return `${Math.ceil(n)}초`;if(n<3600)return `${Math.floor(n/60)}분 ${Math.floor(n%60)}초`;if(n<86400)return `${(n/3600).toFixed(1)}시간`;return `${(n/86400).toFixed(1)}일`;}
// Notices stack downward under the header. 'important' notices (finishing the
// tree, starting over) stay until closed; weather notices take the weather's
// color.
const notification=createNotifications({container:$('toasts'),build(){
 const element=document.createElement('div'),message=document.createElement('div'),closeButton=document.createElement('button'),track=document.createElement('div'),bar=document.createElement('i');
 message.className='toast-message';message.setAttribute('role','status');message.setAttribute('aria-live','polite');message.setAttribute('aria-atomic','true');
 closeButton.className='toast-close';closeButton.type='button';closeButton.setAttribute('aria-label','알림 닫기');setIcon(closeButton,'X');
 track.className='toast-track';track.setAttribute('aria-hidden','true');track.append(bar);
 element.append(message);element.append(closeButton);element.append(track);
 return {element,message,closeButton,bar};
}},()=>state.settings.motion&&!motionPreference.matches);
function toast(message,duration=4000,kind='info'){notification.show(message,{duration,kind,sticky:kind==='important'});}
const WEATHER_NOTICES={rain:'날씨 · 비가 내리기 시작합니다.',snow:'날씨 · 눈이 내리기 시작합니다.',clear:'날씨 · 하늘이 맑게 갰습니다.'};
function syncOpalMotion(){document.body.classList.toggle('effects-paused',document.hidden||suspended);opalMotion?.refresh();bloom?.refresh();}
function applySettings(){
 const reduced=!state.settings.motion||motionPreference.matches;document.body.classList.toggle('reduced-motion',reduced);
 for(const k of ['motion','touch','haptic','purchaseCheat','mapControls'])$(k).checked=state.settings[k];$('format').value=state.settings.format;
 const controls=$('mapTools'),expanded=state.settings.mapControls,changed=controls.dataset.expanded!==String(expanded);
 controls.dataset.expanded=String(expanded);controls.classList.toggle('is-compact',!expanded);
 for(const id of ['fit','zoomOut','zoomIn'])$(id).hidden=!expanded;
 if(changed&&cameraIntent)moveCamera(cameraForIntent(),cameraComplete);
 if(reduced){panelAnimation?.cancel();panelAnimation=null;if(cameraMoving&&cameraIntent)moveCamera(cameraForIntent(),cameraComplete);}
 syncOpalMotion();
}
function setupOpalMotion(){
 opalMotion=createOpalMotion([{root:viewport,elements:NODES.filter(n=>n.chapter===7).map(n=>nodeEls.get(n.id))}],()=>state.settings.motion&&!motionPreference.matches&&!document.hidden&&!suspended);
}
function renderChrome(){
 const compact=state.settings.hudCollapsed;
 $('hud').classList.toggle('is-collapsed',compact);$('hudDetails').hidden=compact;
 $('toggleHud').setAttribute('aria-expanded',String(!compact));$('toggleHud').setAttribute('aria-label',compact?'상단 펼치기':'상단 접기');
 const mapCurrencies=currentMap(state).currencies,showMoney=mapCurrencies.includes('money'),showCoin=mapCurrencies.includes('coin')&&econ.coinUnlocked,showToken=mapCurrencies.includes('token')&&CURRENCY_DEFS.token.shown(state,econ);
 $('hud').classList.toggle('has-coin',[showMoney,showCoin,showToken].filter(Boolean).length>1);
 for(const id of ['moneyCard','compactMoneyCard'])$(id).hidden=!showMoney;
 for(const id of ['coinCard','compactCoinCard'])$(id).hidden=!showCoin;
 for(const id of ['tokenCard','compactTokenCard'])$(id).hidden=!showToken;
 setText($('compactToken'),tokenFormat(state.currencies.token));setText($('compactTokenNote'),tokenNote());
 setText($('compactMoneyValue'),compactFormat(state.currencies.money));setText($('compactRate'),'+'+compactFormat(econ.rate)+' /s');
 setText($('compactCoin'),compactFormat(state.currencies.coin));setText($('compactCoinRate'),'+'+compactFormat(econ.coinRate)+' /s');
 renderCacheHud();
 if(!compact){renderWorld();renderLedger();}
 $('cheatBadge').hidden=!state.settings.purchaseCheat;
}
function tokenNote(){if(!onPrestige()&&prestigeReady(state))return '환생 가능';return `환생 ${state.prestige.count}회`;}
function showCacheReward({money=0,coin=0}){
 cacheReward={money,coin,until:performance.now()+2400};
 const amounts=[];
 if(money>0)amounts.push(`달러 ${format(money)}`);
 if(coin>0)amounts.push(`코인 ${format(coin)}`);
 setText($('cacheAnnouncement'),amounts.length?'캐시 획득: '+amounts.join(', '):'');
 renderCacheHud();
}
function renderCacheHud(){
 // The cache strip belongs to the current map: it shows when one of the
 // map's currencies has cache production and takes that currency's color.
 const bursts={money:econ.burst,coin:econ.coinUnlocked?econ.coinBurst:0},cached=currentMap(state).currencies.filter(k=>bursts[k]>0),active=cached.length>0;
 $('cacheMeter').hidden=!active;
 if(active)$('cacheMeter').style.setProperty('--cache-color',CURRENCY_DEFS[cached[0]].color);
 if(active){
  const progress=Math.max(0,Math.min(1,state.timers.cache/econ.interval));
  const bar=$('cacheProgress'),previous=Number(bar.dataset.progress||0);
  if(progress!==previous){
   bar.style.transition=progress<previous?'none':'';
   bar.style.transform=`scaleX(${progress})`;bar.dataset.progress=String(progress);
  }
  const remaining=Math.max(0,econ.interval-state.timers.cache);
  setText($('cacheInfo'),remaining.toFixed(1)+'s');
  const yields=cached.map(k=>`<b style="--yield-color:${CURRENCY_DEFS[k].color}">+${compactFormat(econ.rates[k]*bursts[k])} ${CURRENCY_DEFS[k].symbol}</b>`);setHtml($('cacheYield'),yields.join('<span class="cache-sep">·</span>'));
  $('cacheTrack').setAttribute('aria-valuenow',String(Math.round(progress*100)));
  $('cacheTrack').setAttribute('aria-valuetext',`다음 캐시까지 ${remaining.toFixed(1)}초`);
 }
 const visible=performance.now()<cacheReward.until;
 for(const [currency,ids]of [['money',['cacheMoney','compactCacheMoney']],['coin',['cacheCoin','compactCacheCoin']]]){
  const amount=cacheReward[currency],show=visible&&amount>0;
  for(const id of ids){
   const el=$(id),compact=id.startsWith('compact');
   // Compact gains stay beside the balance even with late-game exponents.
   const value=compactFormat(amount,2);
   if(show)setText(el,'+'+value);el.classList.toggle('is-visible',show);
  }
 }
}
function save(notify=false){
 state.camera={...camera};state.savedAt=Date.now();if(!suspended)checkpointOffline(state,state.savedAt);
 try{const previous=localStorage.getItem(KEY);if(previous){try{validateSave(JSON.parse(previous));localStorage.setItem(BACKUP,previous);}catch{}}
 localStorage.setItem(KEY,JSON.stringify(state));storageOK=true;$('saveState').innerHTML='<i></i> 자동 저장';if(notify)toast('진행 상황을 저장했습니다.');}
 catch{storageOK=false;setText($('saveState'),'저장 불가 · 설정에서 내보내기');if(notify)toast('브라우저 저장에 실패했습니다. 저장 데이터를 내보내 주세요.');}
}
function sectorUnlocked(chapter){const root=MAP_LAYOUT.sectors[chapter]?.members[0];return !!root&&(level(state,root)>0||unlocked(state,root));}
function discovery(n){if(!sectorUnlocked(n.chapter))return 0;if(level(state,n))return 3;if(n.id===1||n.req.some(r=>level(state,r.id)>0))return 2;if(n.req.some(r=>{const p=byId.get(r.id);return p.id===1||p.req.some(q=>level(state,q.id)>0);}))return 1;return 0;}
const visibility=new Map();
function createGraph(){
 const b=MAP_LAYOUT.bounds;for(const id of ['edges','sectorRegions','spokes']){const svg=$(id);svg.setAttribute('viewBox',`${b.minX} ${b.minY} ${b.maxX-b.minX} ${b.maxY-b.minY}`);svg.style.left=b.minX+'px';svg.style.top=b.minY+'px';svg.style.width=(b.maxX-b.minX)+'px';svg.style.height=(b.maxY-b.minY)+'px';}
 for(const n of NODES){
 const el=document.createElement('button');el.className='node';el.hidden=true;el.id=`node-${n.id}`;el.dataset.id=n.id;el.style.left=n.x+'px';el.style.top=n.y+'px';el.style.setProperty('--node-color',CHAPTERS[n.chapter].color);
 el.innerHTML='<div class="node-top"><span class="symbol"></span><span class="node-id"></span></div><span class="node-name"></span><span class="node-price"><span></span><span class="node-status"></span></span><i class="level-dots"></i>';
 if(n.chapter===7){const border=document.createElement('span');border.className='opal-border';border.setAttribute('aria-hidden','true');el.append(border);}
 el.addEventListener('click',ev=>handleMapClick(ev,n.id));
 $('nodes').append(el);nodeEls.set(n.id,el);
 for(const r of n.req){const p=byId.get(r.id),path=document.createElementNS('http://www.w3.org/2000/svg','path');
 path.style.display='none';path.setAttribute('d',connectionPath(p,n,MAP_LAYOUT.sectors));path.style.setProperty('--edge-color',CHAPTERS[n.chapter].color);$('edges').append(path);edgeEls.push({el:path,from:p,to:n,cross:p.branch!==n.branch});}
 }
 for(const sector of MAP_LAYOUT.sectors){
 const i=sector.chapter,c=CHAPTERS[i],el=document.createElement('div');el.className='chapter-mark';el.hidden=true;el.style.left=sector.label.x+'px';el.style.top=sector.label.y+'px';if(sector.label.align==='left')el.style.transform='none';else if(sector.label.align==='right')el.style.transform='translateX(-100%)';el.style.setProperty('--sector-color',c.color);el.innerHTML='<span class="mark-text"></span><button class="auto-toggle" type="button" hidden aria-pressed="false"></button>';el.querySelector('.mark-text').textContent=`0${i+1} / ${c.name}`;const toggle=el.querySelector('.auto-toggle');toggle.dataset.chapter=i;toggle.addEventListener('click',ev=>{if(ev.detail!==0&&performance.now()<suppressMapClickUntil)return;toggleAuto(i);});$('chapterMarks').append(el);chapterEls.push(el);
 const region=document.createElementNS('http://www.w3.org/2000/svg','path');region.setAttribute('d',sector.path);region.setAttribute('class','sector-region');region.style.setProperty('--sector-color',c.color);region.style.display='none';$('sectorRegions').append(region);sectorEls.push(region);
 const jump=document.createElement('button');jump.className='sector-jump';jump.hidden=true;jump.style.setProperty('--sector-color',c.color);jump.innerHTML=`<span class="sector-jump-icon">${iconSvg(sector.members[0].icon)}</span><span class="sector-jump-copy"><span class="sector-jump-name">${c.name}</span><span class="sector-jump-progress"></span></span><span class="sector-jump-state" aria-hidden="true"></span>`;jump.onclick=()=>jumpToSector(i);$('sectorMenu').append(jump);
 }
 for(const branch of BRANCHES){const root=MAP_LAYOUT.sectors[branch.chapters[0]].members[0],path=document.createElementNS('http://www.w3.org/2000/svg','path');path.setAttribute('d',centerPath(root));path.setAttribute('class','center-spoke');path.style.display='none';path.style.setProperty('--sector-color',CHAPTERS[root.chapter].color);$('spokes').append(path);spokeEls.push({el:path,root});}
 $('centerNode').addEventListener('click',ev=>handleMapClick(ev,CENTER_SELECTION));
 createHeader();createPrestigeGraph();
}
// Automation checks live beside the sector headings (AUTOPILOT nodes).
function toggleAuto(chapter){if(!prestigeBonuses(state).auto.has(chapter))return false;const on=!state.prestige.auto[chapter];if(on)state.prestige.auto[chapter]=true;else delete state.prestige.auto[chapter];render();save();toast(`${CHAPTERS[chapter].name} 자동 연구 ${on?'ON':'OFF'}`,2500);if(on)runAutomation();return true;}
// The prestige flower: five petals around a pentagon center, same card
// and link styling as the mainland, its own layer in the same world.
const pNodeEls=new Map(),pEdgeEls=[],petalEls=[],petalMarkEls=[];
function prestigeDiscovery(n){if(prestigeLevel(state,n))return 3;if(n.row===0||n.req.some(r=>prestigeLevel(state,r.id)>0))return 2;if(n.req.some(r=>{const p=prestigeById.get(r.id);return p.row===0||p.req.some(q=>prestigeLevel(state,q.id)>0);}))return 1;return 0;}
function discoveryOf(n){return n.prestige?prestigeDiscovery(n):discovery(n);}
function createPrestigeGraph(){
 const b=PRESTIGE_LAYOUT.bounds;for(const id of ['pRegions','pSpokes','pEdges']){const svg=$(id);svg.setAttribute('viewBox',`${b.minX} ${b.minY} ${b.maxX-b.minX} ${b.maxY-b.minY}`);svg.style.left=b.minX+'px';svg.style.top=b.minY+'px';svg.style.width=(b.maxX-b.minX)+'px';svg.style.height=(b.maxY-b.minY)+'px';}
 for(const n of PRESTIGE_NODES){
  const color=PRESTIGE_BRANCHES[n.branch].color,el=document.createElement('button');el.className='node bloom';el.hidden=true;el.id=`node-${n.id}`;el.dataset.id=n.id;el.style.left=n.x+'px';el.style.top=n.y+'px';el.style.setProperty('--node-color',color);
  el.innerHTML='<div class="node-top"><span class="symbol"></span><span class="node-id"></span></div><span class="node-name"></span><span class="node-price"><span></span><span class="node-status"></span></span><i class="level-dots"></i>';
  el.addEventListener('click',ev=>handleMapClick(ev,n.id));
  $('pNodes').append(el);pNodeEls.set(n.id,el);
  for(const r of n.req){const p=prestigeById.get(r.id),path=document.createElementNS('http://www.w3.org/2000/svg','path');path.style.display='none';path.setAttribute('d',connectionPath(p,n,PRESTIGE_LAYOUT.petals));path.style.setProperty('--edge-color',color);$('pEdges').append(path);pEdgeEls.push({el:path,from:p,to:n});}
 }
 PRESTIGE_LAYOUT.petals.forEach((petal,i)=>{
  const c=PRESTIGE_BRANCHES[i],mark=document.createElement('div');mark.className='chapter-mark petal-mark';mark.style.left=petal.label.x+'px';mark.style.top=petal.label.y+'px';mark.style.transform=petal.label.align==='left'?'none':petal.label.align==='right'?'translateX(-100%)':'';mark.style.setProperty('--sector-color',c.color);mark.textContent=`0${i+1} / ${c.name}`;$('pMarks').append(mark);petalMarkEls.push(mark);
  const region=document.createElementNS('http://www.w3.org/2000/svg','path');region.setAttribute('d',petal.path);region.setAttribute('class','sector-region petal-region');region.style.setProperty('--sector-color',c.color);$('pRegions').append(region);petalEls.push(region);
  const root=petal.members[0],spoke=document.createElementNS('http://www.w3.org/2000/svg','path');spoke.setAttribute('d',centerPath(root));spoke.setAttribute('class','center-spoke discovered');spoke.style.setProperty('--sector-color',c.color);$('pSpokes').append(spoke);
  const jump=document.createElement('button');jump.className='sector-jump';jump.style.setProperty('--sector-color',c.color);jump.innerHTML=`<span class="sector-jump-icon">${iconSvg(root.icon)}</span><span class="sector-jump-copy"><span class="sector-jump-name">${c.name} · ${c.ko}</span><span class="sector-jump-progress"></span></span><span class="sector-jump-state" aria-hidden="true"></span>`;jump.onclick=()=>jumpToPetal(i);$('petalMenu').append(jump);
 });
 $('pCenter').addEventListener('click',ev=>handleMapClick(ev,CENTER_SELECTION));
}
function prestigeGraph(){
 for(const n of PRESTIGE_NODES){
  const d=prestigeDiscovery(n);visibility.set(n.id,d);const el=pNodeEls.get(n.id);el.hidden=!d;if(!d)continue;
  const l=prestigeLevel(state,n),can=prestigeUnlocked(state,n),p=prestigeCost(state,n),afford=can&&prestigeAffordable(state,n)&&l<n.max;
  const key=[d,l,can,afford,p.token,selected===n.id,state.settings.format].join(':');if(el.dataset.viewKey===key)continue;el.dataset.viewKey=key;
  const cls=`node bloom ${n.reserved?'reserved ':''}${n.gate?'gate ':''}${l?'bought ':''}${can?'unlocked ':'locked '}${afford?'available ':''}${selected===n.id?'selected ':''}${d===1?'ghost ':''}`;
  const popping=el.classList.contains('pop');if(el.className!==cls+(popping?'pop':''))el.className=cls+(popping?'pop':'');
  el.disabled=d===1;el.tabIndex=d>1?0:-1;
  setIcon(el.querySelector('.symbol'),d===1?'LockKeyhole':n.icon);
  el.querySelector('.node-id').textContent=d===1?'???':`P${String(n.id-1000).padStart(2,'0')}`;
  el.querySelector('.node-name').textContent=d===1?'UNEXPLORED':n.name;
  const priceEl=el.querySelector('.node-price>span');el.classList.remove('dual-cost');setHtml(priceEl,d===1?'미발견':n.reserved?'<span class="locked">예약</span>':l>=n.max?'완료':can?priceMarkup(p):'<span class="locked">선행 노드 필요</span>');
  const status=el.querySelector('.node-status');if(d!==1&&l>=n.max)setIcon(status,'Check');else{status.textContent=d===1?'':n.max>1?`${l}/${n.max}`:'';delete status.dataset.icon;}
  el.querySelector('.level-dots').style.width=(l/n.max*100)+'%';
  el.setAttribute('aria-label',d===1?'미발견 노드':`${n.name}. ${n.ko}. ${n.reserved?'예약 노드':l>=n.max?'완료':`레벨 ${l}/${n.max}, 비용 ${priceText(p)}, ${can?'구매 조건 충족':'선행 노드 필요'}`}`);
 }
 for(const {el,from,to}of pEdgeEls){const visible=visibility.get(from.id)>1&&visibility.get(to.id)>1;const flash=el.classList.contains('flashing'),cls=`edge ${prestigeLevel(state,to)?'researched':prestigeLevel(state,from)?'active':'ghost'}${flash?' flashing':''}`,key=visible+cls;if(el.dataset.viewKey===key)continue;el.dataset.viewKey=key;el.style.display=visible?'':'none';if(visible)el.setAttribute('class',cls);}
 let finished=0;
 $('pCenter').classList.toggle('selected',selected===CENTER_SELECTION);$('pCenter').setAttribute('aria-pressed',String(selected===CENTER_SELECTION));
 PRESTIGE_LAYOUT.petals.forEach((petal,i)=>{const progress=petalProgress(state,i);if(progress.complete)finished++;const current=prestigeById.get(selected)?.branch===i,key=`${progress.done}:${current}`;if(petalEls[i].dataset.viewKey===key)return;petalEls[i].dataset.viewKey=key;
  petalEls[i].classList.toggle('complete',progress.complete);petalMarkEls[i].classList.toggle('complete',progress.complete);petalMarkEls[i].textContent=`0${i+1} / ${PRESTIGE_BRANCHES[i].name}${progress.complete?' · COMPLETE':''}`;$('pPetal'+i).classList.toggle('complete',progress.complete);
  const button=$('petalMenu').children[i];button.classList.toggle('complete',progress.complete);button.classList.toggle('is-current',current);button.setAttribute('aria-current',current?'true':'false');setText(button.querySelector('.sector-jump-progress'),progress.complete?'완성':progress.total?`${progress.done} / ${progress.total} 레벨${progress.reserved?` · 예약 ${progress.reserved}`:''}`:`설계 대기 · 예약 ${progress.reserved}`);setIcon(button.querySelector('.sector-jump-state'),progress.complete?'Check':'Circle');button.setAttribute('aria-label',`${PRESTIGE_BRANCHES[i].ko} 꽃잎. ${progress.complete?'완성':`레벨 ${progress.done}/${progress.total}. 남은 노드로 이동`}`);
 });
 const purchasable=PRESTIGE_NODES.filter(n=>!n.reserved),owned=purchasable.filter(n=>prestigeLevel(state,n)>0).length;
 setText($('pCenterProgress'),`${owned} / ${purchasable.length} 노드`);
 if($('sectorDialog').open)updateNavigatorScroll();
 setText($('navigatorHint'),finished===5?'꽃잎으로 이동':'남은 노드로 이동');$('pCenter').setAttribute('aria-label',`UNBRIK 블룸 센터. ${owned}/${purchasable.length} 노드, ${finished}개 꽃잎 완성. 선택하여 내비게이터 열기`);
}
// Header pages: page 1 is the current map (clock, weather, its currencies);
// the following pages list every shown currency, four per page. Swiping the
// header or the arrows move between pages; the dots show the position.
const LEDGER_PER_PAGE=4,ledgerEls=new Map();let hudPage=0,hudPageCount=2;
const WORLD_ICONS={
 dawn:'<svg viewBox="0 0 24 24"><path d="M12 10V3"/><path d="m9 6 3-3 3 3"/><path d="M3 20h18"/><path d="M6 17a6 6 0 0 1 12 0"/></svg>',
 day:'<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/></svg>',
 dusk:'<svg viewBox="0 0 24 24"><path d="M12 3v7"/><path d="m9 7 3 3 3-3"/><path d="M3 20h18"/><path d="M6 17a6 6 0 0 1 12 0"/></svg>',
 night:'<svg viewBox="0 0 24 24"><path d="M20 14.5A8 8 0 0 1 9.5 4a8 8 0 1 0 10.5 10.5z"/></svg>',
 clear:'<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="5"/></svg>',
 rain:'<svg viewBox="0 0 24 24"><path d="M6.5 15a4.5 4.5 0 1 1 .9-8.9A6 6 0 0 1 19 8a3.5 3.5 0 0 1-.5 7z"/><path d="M8 18l-1 3M12 18l-1 3M16 18l-1 3"/></svg>',
 snow:'<svg viewBox="0 0 24 24"><path d="M6.5 15a4.5 4.5 0 1 1 .9-8.9A6 6 0 0 1 19 8a3.5 3.5 0 0 1-.5 7z"/><path d="M8 18v3M6.7 19.5h2.6M12 18v3M10.7 19.5h2.6M16 18v3M14.7 19.5h2.6"/></svg>',
};
function createHeader(){
 const ledger=$('ledger');ledger.replaceChildren();ledgerEls.clear();
 for(const [key,def] of Object.entries(CURRENCY_DEFS)){
  const row=document.createElement('div');row.className='ledger-row';row.hidden=true;row.style.setProperty('--currency-color',def.color);row.setAttribute('aria-label',def.name);
  const symbol=document.createElement('span'),balance=document.createElement('span'),rate=document.createElement('span');
  symbol.className='ledger-symbol';symbol.textContent=def.symbol;balance.className='ledger-balance';rate.className='ledger-rate';
  row.append(symbol);row.append(balance);row.append(rate);ledger.append(row);ledgerEls.set(key,{row,balance,rate});
 }
 const pages=$('hudPages');
 pages.addEventListener('scroll',()=>{const width=pages.clientWidth||1,page=Math.round((pages.scrollLeft||0)/width);if(page!==hudPage){hudPage=page;renderPageDots();}},{passive:true});
 $('hudPrev').onclick=()=>goToPage(hudPage-1);$('hudNext').onclick=()=>goToPage(hudPage+1);
 renderPageDots();
}
function goToPage(page){
 const pages=$('hudPages');hudPage=Math.max(0,Math.min(hudPageCount-1,page));
 if(typeof pages.scrollTo==='function')pages.scrollTo({left:hudPage*(pages.clientWidth||0),behavior:state.settings.motion&&!motionPreference.matches?'smooth':'auto'});
 renderPageDots();
}
function renderPageDots(){
 const dots=$('pageDots'),key=hudPage+'/'+hudPageCount;if(dots.dataset.key===key)return;dots.dataset.key=key;
 dots.replaceChildren();for(let i=0;i<hudPageCount;i++){const dot=document.createElement('i');if(i===hudPage)dot.className='is-current';dots.append(dot);}
 $('hudPrev').disabled=hudPage===0;$('hudNext').disabled=hudPage>=hudPageCount-1;
}
function renderWorld(){
 const w=worldState(state),line=$('worldLine');
 setText($('worldClock'),w.clock);setText($('worldPhase'),w.phaseKo);setText($('worldWeather'),w.weatherKo);
 if(line.dataset.phase!==w.phase){line.dataset.phase=w.phase;setHtml($('worldIcon'),WORLD_ICONS[w.phase]);}
 if(line.dataset.weather!==w.weather){line.dataset.weather=w.weather;setHtml($('weatherIcon'),WORLD_ICONS[w.weather]);}
 line.setAttribute('aria-label',`${w.day}일째 ${w.clock}, ${w.phaseKo}, ${w.weatherKo}`);
}
function renderLedger(){
 let shown=0;
 for(const [key,def] of Object.entries(CURRENCY_DEFS)){
  const els=ledgerEls.get(key);if(!els)continue;
  const visible=def.shown(state,econ);els.row.hidden=!visible;if(!visible)continue;shown++;
  setText(els.balance,amountFormat(key,state.currencies[key]));setText(els.rate,key==='token'?tokenNote():'+'+compactFormat(econ.rates[key])+' /s');
 }
 setText($('ledgerTitle'),`재화 목록 · ${shown}`);
 hudPageCount=1+Math.max(1,Math.ceil(shown/LEDGER_PER_PAGE));
 renderPageDots();
}
// Sector headings follow the unlocked frontier: until a sector is complete the
// heading sits just past its farthest visible row, then moves to its place
// outside the coast.
const HEADING_LEAD=135;
function placeHeading(i,sector,complete){
 const el=chapterEls[i];let {x,y,align}=sector.label;
 if(!complete){
  const visible=sector.members.filter(n=>visibility.get(n.id)>0);
  if(visible.length){
   const row=Math.max(...visible.map(n=>n.row)),front=visible.filter(n=>n.row===row);
   const cx=front.reduce((sum,n)=>sum+n.x,0)/front.length,cy=front.reduce((sum,n)=>sum+n.y,0)/front.length,d=sector.direction;
   x=Math.round(cx+d.x*HEADING_LEAD);y=Math.round(cy+d.y*HEADING_LEAD-15);align=Math.abs(d.x)>.55?(d.x>0?'left':'right'):'center';
  }
 }
 const posKey=`${x},${y},${align}`;if(el.dataset.posKey===posKey)return;el.dataset.posKey=posKey;
 el.style.left=x+'px';el.style.top=y+'px';el.style.transform=align==='left'?'none':align==='right'?'translateX(-100%)':'';
}
function graph(){if(onPrestige())prestigeGraph();else mainGraph();}
function mainGraph(){
 const autoSectors=prestigeBonuses(state).auto;
 for(const n of NODES){
 const d=discovery(n);visibility.set(n.id,d);const el=nodeEls.get(n.id);el.hidden=!d;if(!d)continue;
 const l=level(state,n),can=unlocked(state,n),p=cost(state,n,econ),afford=can&&affordable(state,n,econ)&&l<n.max;
 const key=[d,l,can,afford,JSON.stringify(p),selected===n.id,state.settings.format].join(':');if(el.dataset.viewKey===key)continue;el.dataset.viewKey=key;
 const cls=`node ${n.chapter===7?'opal ':''}${n.gate?'gate ':''}${l?'bought ':''}${can?'unlocked ':'locked '}${afford?'available ':''}${selected===n.id?'selected ':''}${d===1?'ghost ':''}`;
 const popping=el.classList.contains('pop');if(el.className!==cls+(popping?'pop':''))el.className=cls+(popping?'pop':'');
 el.disabled=d===1;el.tabIndex=d>1?0:-1;
 setIcon(el.querySelector('.symbol'),d===1?'LockKeyhole':n.icon);
 el.querySelector('.node-id').textContent=d===1?'???':String(n.id).padStart(3,'0');
 el.querySelector('.node-name').textContent=d===1?'UNEXPLORED':n.name;
 const priceEl=el.querySelector('.node-price>span');el.classList.toggle('dual-cost',n.payment.length>1&&l<n.max&&can);setHtml(priceEl,d===1?'미발견':l>=n.max?'완료':can?priceMarkup(p):'<span class="locked">선행 연구 필요</span>');
 const status=el.querySelector('.node-status');if(d!==1&&l>=n.max)setIcon(status,'Check');else{status.textContent=d===1?'':n.max>1?`${l}/${n.max}`:'';delete status.dataset.icon;}
 el.querySelector('.level-dots').style.width=(l/n.max*100)+'%';
 el.setAttribute('aria-label',d===1?'미발견 연구':`${n.name}. ${effectText(n)}. ${l>=n.max?'완료':`레벨 ${l}/${n.max}, 비용 ${priceText(p)}, ${can?'구매 조건 충족':'선행 연구 필요'}`}`);
 }
 for(const {el,from,to,cross}of edgeEls){const visible=visibility.get(from.id)>1&&visibility.get(to.id)>1&&(!cross||selected===from.id||selected===to.id);const flash=el.classList.contains('flashing'),cls=`edge ${cross?'cross-link ':''}${level(state,to)?'researched':level(state,from)?'active':'ghost'}${flash?' flashing':''}`,key=visible+cls;if(el.dataset.viewKey===key)continue;el.dataset.viewKey=key;el.style.display=visible?'':'none';if(visible)el.setAttribute('class',cls);}
 let finished=0;
 $('centerNode').classList.toggle('selected',selected===CENTER_SELECTION);$('centerNode').setAttribute('aria-pressed',String(selected===CENTER_SELECTION));
 MAP_LAYOUT.sectors.forEach((sector,i)=>{const found=sectorUnlocked(i),progress=sectorProgress(state,i);if(progress.complete)finished++;const autoAvail=autoSectors.has(i)&&!progress.complete,autoOn=!!state.prestige.auto[i],key=`${found}:${progress.done}:${byId.get(selected)?.chapter===i}:${autoAvail}:${autoOn}`;if(sectorEls[i].dataset.viewKey===key)return;sectorEls[i].dataset.viewKey=key;chapterEls[i].hidden=!found;placeHeading(i,sector,progress.complete);chapterEls[i].classList.toggle('complete',progress.complete);setText(chapterEls[i].querySelector('.mark-text'),`0${i+1} / ${CHAPTERS[i].name}${progress.complete?' · COMPLETE':''}`);
  const toggle=chapterEls[i].querySelector('.auto-toggle');toggle.hidden=!(found&&autoAvail);toggle.classList.toggle('is-on',autoOn);toggle.setAttribute('aria-pressed',String(autoOn));toggle.setAttribute('aria-label',`${CHAPTERS[i].ko} 섹터 자동 연구 ${autoOn?'켜짐':'꺼짐'}`);setHtml(toggle,iconSvg(autoOn?'Check':'Circle')+'<span>AUTO</span>');
  sectorEls[i].style.display=progress.complete?'':'none';$('hubSector'+i).classList.toggle('complete',progress.complete);
 const button=$('sectorMenu').children[i];button.hidden=!found;button.disabled=!found;button.classList.toggle('complete',progress.complete);button.classList.toggle('is-current',byId.get(selected)?.chapter===i);button.setAttribute('aria-current',byId.get(selected)?.chapter===i?'true':'false');setText(button.querySelector('.sector-jump-progress'),progress.complete?'완료':found?`${progress.done} / ${progress.total} 레벨`:'미발견');setIcon(button.querySelector('.sector-jump-state'),progress.complete?'Check':found?'Circle':'LockKeyhole');button.setAttribute('aria-label',`${CHAPTERS[i].ko} 섹터. ${progress.complete?'완료':found?`연구 레벨 ${progress.done}/${progress.total}. 남은 연구로 이동`:'미발견'}`);
 });
 for(const {el,root}of spokeEls){const found=visibility.get(root.id)>1;el.classList.toggle('discovered',found);el.style.display=found?'':'none';}
 if($('sectorDialog').open)updateNavigatorScroll();
 setText($('navigatorHint'),finished===8?'섹터로 이동':'남은 연구로 이동');setText($('centerProgress'),`${econ.count} / ${NODES.length} 연구`);$('centerResearchProgress').style.width=(econ.count/NODES.length*100)+'%';$('centerNode').setAttribute('aria-label',`UNBRIK 센터. ${econ.count}/${NODES.length} 연구, ${finished}개 섹터 완료.${prestigeReady(state)?' 환생 가능.':''} 선택하여 내비게이터 열기`);
}
function setBuyState(kind,label,detail,disabled){
 const button=$('buy');if(button.dataset.state!==kind){button.dataset.state=kind;button.className=kind;}
 button.disabled=disabled;button.setAttribute('aria-busy',String(kind==='pending'));setText($('buyText'),label);setText($('buyDetail'),detail);
}
function renderPanel(){
 const center=selected===CENTER_SELECTION,n=center?{name:'UNBRIK'}:lookupNode(selected);$('nodePanel').hidden=!n;if(!n)return;
 const collapsed=state.settings.panelCollapsed;$('nodePanel').classList.toggle('is-center',center);
 $('nodePanel').classList.toggle('is-collapsed',collapsed);$('panelDetails').hidden=collapsed;
 $('togglePanel').setAttribute('aria-expanded',String(!collapsed));setText($('panelToggleText'),collapsed?'연구 정보 펼치기':'연구 정보 접기');
 setText($('collapsedName'),n.name);$('collapsedName').hidden=!collapsed;setIcon($('panelToggleIcon'),collapsed?'ChevronUp':'ChevronDown');
 if(collapsed)return;
 $('requirements').hidden=center;$('purchaseTrack').hidden=center;$('panelEffect').hidden=center;
 renderPrestigeButton(center);
 if(center){setIcon($('panelSymbol'),'brand');$('panelSymbol').style.color='#f2f4f7';$('panelSymbol').style.setProperty('--sector-color','#f2f4f7');setText($('panelName'),'UNBRIK');
  if(onPrestige()){const complete=PRESTIGE_BRANCHES.filter((_,i)=>petalProgress(state,i).complete).length;setText($('panelMeta'),'CENTER / 00');setText($('costLabel'),'완성한 꽃잎');setHtml($('panelCost'),`${complete} / 5`);}
  else{const complete=CHAPTERS.filter((_,i)=>sectorProgress(state,i).complete).length;setText($('panelMeta'),'CENTER / 00');setText($('costLabel'),'완료한 섹터');setHtml($('panelCost'),`${complete} / 8`);}
  setBuyState('navigator','내비게이터','열기',false);return;}
 if(n.prestige){renderPrestigeNode(n);return;}
 const l=level(state,n),p=cost(state,n,econ),can=unlocked(state,n),max=l>=n.max,afford=affordable(state,n,econ);
 setIcon($('panelSymbol'),n.icon);$('panelSymbol').style.color=CHAPTERS[n.chapter].color;$('panelSymbol').style.setProperty('--sector-color',CHAPTERS[n.chapter].color);
 setText($('panelMeta'),`${String(n.id).padStart(3,'0')} / ${CHAPTERS[n.chapter].name}${n.max>1?` · LV.${l}/${n.max}`:''}${n.longTerm?' · 장기 연구':''}`);
 setText($('panelName'),n.name);setHtml($('panelEffect'),effectText(n).replace(/\$/g,'<i class="sym sym-money">$</i>').replace(/¢/g,'<i class="sym sym-coin">¢</i>'));
 const reqKey=n.req.map(r=>`${r.id}:${level(state,r.id)>=r.level}`).join(',')+n.any;
 if($('requirements').dataset.key!==reqKey){$('requirements').dataset.key=reqKey;$('requirements').replaceChildren();if(n.any){const label=document.createElement('span');label.className='req';label.textContent='둘 중 하나';$('requirements').append(label);}
 for(const r of n.req){const b=document.createElement('button'),done=level(state,r.id)>=r.level;b.className=`req ${done?'done':''}`;b.innerHTML=iconSvg(done?'Check':'Circle');const label=document.createElement('span');label.textContent=byId.get(r.id).name;b.append(label);b.onclick=()=>{if(selectNode(r.id))focusNode(r.id);};$('requirements').append(b);}}
 setText($('costLabel'),max?'RESEARCH COMPLETE':'RESEARCH COST');setHtml($('panelCost'),max?'완료':priceMarkup(p));
 if(selectionPending)setBuyState('pending','…','이동 중',true);
 else setBuyState(max?'completed':!can?'blocked':afford?'':'waiting',max?'연구 완료':!can?'잠김':n.max>1&&l>0?'레벨 업':'연구',max?'MAX':!can?'조건 미충족':state.settings.purchaseCheat?'무료 연구':afford?l?`Lv.${l+1}`:'구매 가능':time(waitTime(state,n,econ))+' 후',max||!can);
 $('purchaseProgress').style.width=(max?100:Math.min(100,...Object.entries(p).map(([k,x])=>state.currencies[k]/x*100)))+'%';
}
function renderPrestigeNode(n){
 const l=prestigeLevel(state,n),p=prestigeCost(state,n),can=prestigeUnlocked(state,n),max=l>=n.max,afford=prestigeAffordable(state,n),branch=PRESTIGE_BRANCHES[n.branch];
 setIcon($('panelSymbol'),n.icon);$('panelSymbol').style.color=branch.color;$('panelSymbol').style.setProperty('--sector-color',branch.color);
 setText($('panelMeta'),`P${String(n.id-1000).padStart(2,'0')} / ${branch.name}${n.max>1?` · LV.${l}/${n.max}`:''}${n.reserved?' · 예약':''}`);
 setText($('panelName'),n.name);setHtml($('panelEffect'),symbolMarkup(n.ko));
 const reqKey='p'+n.req.map(r=>`${r.id}:${prestigeLevel(state,r.id)>=r.level}`).join(',');
 if($('requirements').dataset.key!==reqKey){$('requirements').dataset.key=reqKey;$('requirements').replaceChildren();
 for(const r of n.req){const b=document.createElement('button'),done=prestigeLevel(state,r.id)>=r.level;b.className=`req ${done?'done':''}`;b.innerHTML=iconSvg(done?'Check':'Circle');const label=document.createElement('span');label.textContent=prestigeById.get(r.id).name;b.append(label);b.onclick=()=>{if(selectNode(r.id))focusNode(r.id);};$('requirements').append(b);}}
 setText($('costLabel'),n.reserved?'RESERVED':max?'RESEARCH COMPLETE':'RESEARCH COST');setHtml($('panelCost'),n.reserved?'설계 대기':max?'완료':priceMarkup(p));
 if(selectionPending)setBuyState('pending','…','이동 중',true);
 else if(n.reserved)setBuyState('blocked','예약','설계 전',true);
 else setBuyState(max?'completed':!can?'blocked':afford?'':'waiting',max?'연구 완료':!can?'잠김':n.max>1&&l>0?'레벨 업':'연구',max?'MAX':!can?'조건 미충족':state.settings.purchaseCheat?'무료 연구':afford?l?`Lv.${l+1}`:'구매 가능':`✿${tokenFormat(Math.max(0,p.token-state.currencies.token))} 더 필요`,max||!can);
 $('purchaseProgress').style.width=(max||n.reserved?100:Math.min(100,state.currencies.token/p.token*100))+'%';
}
// The center panel's prestige button, left of the navigator: shown once the
// tree is complete, enabled when the balance clears the threshold.
function renderPrestigeButton(center){
 const button=$('prestigeButton');
 if(!center||onPrestige()||!treeComplete(state)){button.hidden=true;return;}
 const ready=prestigeReady(state),left=PRESTIGE_THRESHOLD-state.currencies.money;
 button.hidden=false;button.disabled=!ready;
 setHtml($('prestigeDetail'),symbolMarkup(ready?`✿${tokenFormat(tokensFor(state))}`:`$${compactFormat(left)} 더`));
 button.setAttribute('aria-label',ready?`환생. 지금 환생하면 토큰 ${tokenFormat(tokensFor(state))}`:`환생까지 $${format(left)} 더 필요`);
}
// Prestige availability: a badge on the center node and one notice per run.
function syncPrestigeReady(){
 const ready=!onPrestige()&&prestigeReady(state);$('hubBadge').hidden=!ready;
 if(ready&&!state.prestige.noticed){state.prestige.noticed=true;toast('환생 가능 · UNBRIK 센터에서 환생',0,'important');}
}
function render(){
 econ=economy(state);setText($('money'),format(state.currencies.money));setHtml($('rate'),`+${format(econ.rate)}<span> /s</span>`);
 setText($('token'),tokenFormat(state.currencies.token));setText($('tokenNote'),tokenNote());syncPrestigeReady();
 setText($('coin'),format(state.currencies.coin));setHtml($('coinRate'),`+${format(econ.coinRate)}<span> /s</span>`);
 renderChrome();if(!cameraMoving){graph();renderPanel();}if($('settingsDialog').open&&!$('pane-stats').hidden)renderStats();
}
function animatePanel(){
 panelAnimation?.cancel();panelAnimation=null;
 if(!document.body.classList.contains('reduced-motion'))panelAnimation=$('panelDetails').animate?.([{opacity:.7,transform:'translateY(4px)'},{opacity:1,transform:'none'}],{duration:180,easing:'ease-out'});
}
function cancelSelection(){selectionEpoch++;cancelAnimationFrame(navigationFrame);navigationFrame=0;selectionPending=false;stopCamera(false);}
function commitSelection(epoch,refresh=true){if(epoch!==selectionEpoch)return;selectionPending=false;if(refresh)render();}
function selectNode(id,{pending=false,animate=true}={}){const n=lookupNode(id);if(!n||!!n.prestige!==onPrestige()||discoveryOf(n)<2)return false;cancelSelection();cameraIntent=null;selected=id;selectionPending=pending;state.settings.panelCollapsed=false;render();if(animate)animatePanel();return true;}
function selectCenter(){cancelSelection();cameraIntent=null;selected=CENTER_SELECTION;state.settings.panelCollapsed=false;render();animatePanel();return true;}
function transform(){world.style.transform=`translate(${camera.x}px,${camera.y}px) scale(${camera.scale})`;if(!cameraMoving)world.classList.toggle('overview',overviewMode(camera.scale,world.classList.contains('overview')));setText($('zoomLabel'),`${Math.round(camera.scale*100)}%`);setText($('coords'),`X ${Math.round(-camera.x/camera.scale)} · Y ${Math.round(-camera.y/camera.scale)}`);viewport.style.backgroundPosition=`${camera.x}px ${camera.y}px`;viewport.style.backgroundSize=`${24*Math.max(.5,camera.scale)}px ${24*Math.max(.5,camera.scale)}px`;}
function constrain(){const w=viewport.clientWidth,h=viewport.clientHeight,b=activeBounds();camera.x=Math.min(w-b.minX*camera.scale,Math.max(-b.maxX*camera.scale,camera.x));camera.y=Math.min(h-b.minY*camera.scale,Math.max(-b.maxY*camera.scale,camera.y));}
function zoomAt(scale,x,y){const next=Math.max(.035,Math.min(1.7,scale)),ratio=next/camera.scale;camera.x=x-(x-camera.x)*ratio;camera.y=y-(y-camera.y)*ratio;camera.scale=next;constrain();transform();}
let cameraAnim=0,cameraEpoch=0,cameraComplete=null;
function stopCamera(settle=true){
 cancelAnimationFrame(cameraAnim);cameraAnim=0;cameraEpoch++;cameraMoving=false;viewport.classList.remove('camera-moving');
 const done=cameraComplete;cameraComplete=null;if(settle&&done){done();render();}
}
function moveCamera(target,onComplete=null){
 stopCamera(false);const epoch=cameraEpoch;cameraComplete=onComplete;
 world.classList.toggle('overview',overviewMode(target.scale,world.classList.contains('overview')));
 const finish=()=>{const done=cameraComplete;stopCamera(false);state.camera={...camera};done?.();render();};
 if(document.body.classList.contains('reduced-motion')){camera={...target};transform();finish();return;}
 const start={...camera},t0=performance.now();cameraMoving=true;viewport.classList.add('camera-moving');
 function step(now){if(epoch!==cameraEpoch)return;const t=Math.min(1,(now-t0)/380);camera=t===1?{...target}:interpolateCamera(start,target,t);transform();if(t<1)cameraAnim=requestAnimationFrame(step);else finish();}
 cameraAnim=requestAnimationFrame(step);
}
function freeMapFrames(){const controls=viewport.querySelector('.map-tools');return mapFrames(viewport.clientWidth,viewport.clientHeight,{left:controls.offsetLeft,top:controls.offsetTop},state.settings.purchaseCheat?44:32);}
function cameraForIntent(){
 if(cameraIntent?.type==='center')return fitCamera({minX:-184,maxX:184,minY:-184,maxY:184},freeMapFrames(),.82);
 if(cameraIntent?.type==='node'){const n=lookupNode(cameraIntent.id);return fitCamera(boundsOf([n],86,66),freeMapFrames(),.88);}
 const visible=[...activeNodes().filter(n=>discoveryOf(n)>0),{x:-184,y:-184},{x:184,y:184}];return fitCamera(boundsOf(visible),freeMapFrames(),1);
}
function focusNode(id,onComplete=null){cameraIntent={type:'node',id};moveCamera(cameraForIntent(),onComplete);}
function fit(){cancelSelection();render();cameraIntent={type:'fit'};moveCamera(cameraForIntent());}
function openCenter(){selectCenter();cameraIntent={type:'center'};moveCamera(cameraForIntent());}
function updateNavigatorScroll(){const content=$('sectorDialog').querySelector('.navigator-content');$('navigatorScrollHint').hidden=content.scrollHeight-content.clientHeight-content.scrollTop<12;}
function openNavigator(){clearTimeout(navigatorCloseTimer);const p=onPrestige();$('sectorMenu').hidden=p;$('petalMenu').hidden=!p;setText($('navigatorSummary'),p?'꽃잎 선택':'섹터 선택');const unlocked=state.prestige.count>0;setText($('navMapsHint'),unlocked?(p?'본섬으로':'환생 지도로'):'환생 지도 · 잠김');$('sectorDialog').classList.remove('closing');if(!$('sectorDialog').open)$('sectorDialog').showModal();requestAnimationFrame(updateNavigatorScroll);}
function closeNavigator(){const dialog=$('sectorDialog');if(!dialog.open)return;clearTimeout(navigatorCloseTimer);dialog.classList.add('closing');const finish=()=>{dialog.close();dialog.classList.remove('closing');};if(document.body.classList.contains('reduced-motion'))finish();else navigatorCloseTimer=setTimeout(finish,160);}
function jumpToSector(chapter){
 if(!sectorUnlocked(chapter))return false;const members=MAP_LAYOUT.sectors[chapter].members;
 return jumpTo(members.find(n=>unlocked(state,n)&&level(state,n)<n.max)||members[0]);
}
function jumpToPetal(branch){const members=PRESTIGE_LAYOUT.petals[branch].members;return jumpTo(members.find(n=>!n.reserved&&prestigeUnlocked(state,n)&&prestigeLevel(state,n)<n.max)||members[0]);}
function jumpTo(n){
 if(!selectNode(n.id,{pending:true,animate:false}))return false;const epoch=selectionEpoch;closeNavigator();
 navigationFrame=requestAnimationFrame(()=>{navigationFrame=0;if(epoch!==selectionEpoch)return;animatePanel();focusNode(n.id,()=>commitSelection(epoch,false));});
 return true;
}
function interruptMapMotion(){cameraIntent=null;cancelAnimationFrame(navigationFrame);navigationFrame=0;stopCamera();if(selectionPending)commitSelection(selectionEpoch);}
function ripple(x,y){if(!state.settings.touch||!state.settings.motion)return;const el=document.createElement('i');el.className='ripple';el.style.left=x+'px';el.style.top=y+'px';viewport.append(el);el.addEventListener('animationend',()=>el.remove());setTimeout(()=>el.remove(),650);}
function buySelected(){if(selectionPending)return false;if(selected===CENTER_SELECTION){openNavigator();return true;}const n=lookupNode(selected);if(!n)return false;if(n.prestige)return buyPrestige(n);const before=economy(state).count;
 if(!purchase(state,n)){if(state.settings.motion){$('buy').classList.remove('shake');void $('buy').offsetWidth;$('buy').classList.add('shake');}if(unlocked(state,n)&&level(state,n)<n.max)toast(`${priceText(Object.fromEntries(Object.entries(cost(state,n)).map(([k,v])=>[k,Math.max(0,v-state.currencies[k])]).filter(([,v])=>v>0)))} 더 필요합니다.`);return false;}
 if(state.settings.haptic&&navigator.vibrate)navigator.vibrate(14);
 const el=nodeEls.get(n.id);if(state.settings.motion){el.classList.add('pop');setTimeout(()=>el.classList.remove('pop'),550);for(const edge of edgeEls.filter(e=>e.from.id===n.id)){edge.el.classList.add('flashing');setTimeout(()=>edge.el.classList.remove('flashing'),1250);}}
 if(n.id===22&&level(state,n)===1)toast('코인 해금 · 1 ¢/s 생산을 시작합니다.');
 render();save();if(econ.count===NODES.length&&before<NODES.length)toast(`${NODES.length}개 노드 연구 완료. AXIOM에 도달했습니다.`,0,'important');return true;
}
function buyPrestige(n){
 const petalBefore=petalProgress(state,n.branch).complete;
 if(!prestigePurchase(state,n)){if(state.settings.motion){$('buy').classList.remove('shake');void $('buy').offsetWidth;$('buy').classList.add('shake');}if(n.reserved)toast('예약 노드 · 설계 전');else if(prestigeUnlocked(state,n)&&prestigeLevel(state,n)<n.max)toast(`✿${tokenFormat(Math.max(0,prestigeCost(state,n).token-state.currencies.token))} 더 필요합니다.`);return false;}
 if(state.settings.haptic&&navigator.vibrate)navigator.vibrate(14);
 const el=pNodeEls.get(n.id);if(state.settings.motion){el.classList.add('pop');setTimeout(()=>el.classList.remove('pop'),550);for(const edge of pEdgeEls.filter(e=>e.from.id===n.id)){edge.el.classList.add('flashing');setTimeout(()=>edge.el.classList.remove('flashing'),1250);}}
 render();save();
 if(n.effect.type==='auto'&&prestigeLevel(state,n)===1)toast(`${CHAPTERS[n.effect.value].name} 자동 연구 해금 · 본섬 섹터 이름 옆 AUTO 체크`,7000);
 if(!petalBefore&&petalProgress(state,n.branch).complete)toast(`${PRESTIGE_BRANCHES[n.branch].name} 꽃잎 완성`,6000);
 return true;
}
// Pointer-up handles captured taps. Native clicks are a fallback, with no duplicate
// activation or accidental selection after a drag, pinch or canceled contact.
function handleMapClick(event,id){
 if(event.detail!==0&&performance.now()<suppressMapClickUntil)return;
 if(id===CENTER_SELECTION)selectCenter();else selectNode(id);
}
const pointers=new Map();let gesture=null,suppressMapClickUntil=0;
// A map pointer-up may open a panel under the finger. Consume its follow-up
// click before ANY newly positioned control sees it, not just node buttons.
// A real new press (including a quick panel/toolbar press) starts a fresh action.
document.addEventListener('pointerdown',()=>{suppressMapClickUntil=0;},true);
document.addEventListener('click',event=>{
 if(event.detail===0||performance.now()>=suppressMapClickUntil)return;
 event.preventDefault();event.stopImmediatePropagation();
},true);
function point(ev){const rect=viewport.getBoundingClientRect();return {x:ev.clientX-rect.left,y:ev.clientY-rect.top};}
function resetGesture(pinched=false){const p=[...pointers.values()];if(p.length>=2){const mid={x:(p[0].x+p[1].x)/2,y:(p[0].y+p[1].y)/2};gesture={pinched:true,moved:true,distance:Math.hypot(p[0].x-p[1].x,p[0].y-p[1].y),scale:camera.scale,anchor:{x:(mid.x-camera.x)/camera.scale,y:(mid.y-camera.y)/camera.scale}};}else if(p.length){gesture={start:p[0],base:{...camera},moved:pinched,pinched,id:p[0].node,control:p[0].control||null,time:performance.now()};}}
viewport.addEventListener('pointerdown',ev=>{if(ev.target.closest('.map-tools'))return;if(ev.pointerType==='mouse'&&ev.button!==0)return;suppressMapClickUntil=0;const node=Number(ev.target.closest('.node,.hub-node')?.dataset.id)||null,control=ev.target.closest('.auto-toggle');interruptMapMotion();const p={...point(ev),node,control};pointers.set(ev.pointerId,p);viewport.setPointerCapture(ev.pointerId);resetGesture(pointers.size>1);ev.preventDefault();});
viewport.addEventListener('pointermove',ev=>{if(!pointers.has(ev.pointerId))return;const prev=pointers.get(ev.pointerId);pointers.set(ev.pointerId,{...point(ev),node:prev.node,control:prev.control});const ps=[...pointers.values()];if(ps.length>=2&&gesture){const a=ps[0],b=ps[1],mid={x:(a.x+b.x)/2,y:(a.y+b.y)/2};camera.scale=Math.max(.035,Math.min(1.7,gesture.scale*Math.hypot(a.x-b.x,a.y-b.y)/Math.max(1,gesture.distance)));camera.x=mid.x-gesture.anchor.x*camera.scale;camera.y=mid.y-gesture.anchor.y*camera.scale;}else if(gesture){const p=ps[0],dx=p.x-gesture.start.x,dy=p.y-gesture.start.y;if(Math.hypot(dx,dy)>7)gesture.moved=true;if(gesture.moved){camera.x=gesture.base.x+dx;camera.y=gesture.base.y+dy;}}if(gesture?.moved){constrain();transform();$('hint').style.opacity='0';gestureUsed=true;}ev.preventDefault();});
function endPointer(ev,cancelled=false){if(!pointers.has(ev.pointerId))return;suppressMapClickUntil=performance.now()+500;const p=pointers.get(ev.pointerId),tap=!cancelled&&pointers.size===1&&gesture&&!gesture.moved&&!gesture.pinched&&performance.now()-gesture.time<900,id=gesture?.id;pointers.delete(ev.pointerId);if(tap){ripple(p.x,p.y);if(gesture.control)toggleAuto(Number(gesture.control.dataset.chapter));else if(id===CENTER_SELECTION)selectCenter();else if(id)selectNode(id);}if(pointers.size)resetGesture(true);else{gesture=null;state.camera={...camera};}if(viewport.hasPointerCapture(ev.pointerId))viewport.releasePointerCapture(ev.pointerId);}
viewport.addEventListener('pointerup',e=>endPointer(e));viewport.addEventListener('pointercancel',e=>endPointer(e,true));
viewport.addEventListener('lostpointercapture',e=>endPointer(e,true));
viewport.addEventListener('wheel',e=>{e.preventDefault();interruptMapMotion();const p=point(e);zoomAt(camera.scale*Math.exp(-e.deltaY*.002),p.x,p.y);},{passive:false});
viewport.addEventListener('keydown',e=>{if(e.target!==viewport)return;interruptMapMotion();const steps={ArrowLeft:[70,0],ArrowRight:[-70,0],ArrowUp:[0,70],ArrowDown:[0,-70]};if(steps[e.key]){e.preventDefault();camera.x+=steps[e.key][0];camera.y+=steps[e.key][1];constrain();transform();}else if(['+','=','-'].includes(e.key)){e.preventDefault();zoomAt(camera.scale*(e.key==='-'?.8:1.25),viewport.clientWidth/2,viewport.clientHeight/2);}});
$('zoomIn').onclick=()=>{interruptMapMotion();zoomAt(camera.scale*1.25,viewport.clientWidth/2,viewport.clientHeight/2);};$('zoomOut').onclick=()=>{interruptMapMotion();zoomAt(camera.scale*.8,viewport.clientWidth/2,viewport.clientHeight/2);};$('fit').onclick=fit;$('center').onclick=openCenter;$('closeSectors').onclick=closeNavigator;$('sectorDialog').addEventListener('cancel',event=>{event.preventDefault();closeNavigator();});
$('focus').onclick=()=>{let n;if(onPrestige()){const open=PRESTIGE_NODES.filter(n=>!n.reserved&&prestigeUnlocked(state,n)&&prestigeLevel(state,n)<n.max);n=open.sort((a,b)=>prestigeCost(state,a).token-prestigeCost(state,b).token)[0]||PRESTIGE_NODES[0];}else{const candidates=NODES.filter(n=>unlocked(state,n)&&level(state,n)===0);n=candidates.sort((a,b)=>normalizedCost(state,a)-normalizedCost(state,b))[0]||NODES.find(n=>unlocked(state,n)&&level(state,n)<n.max)||NODES.at(-1);}selectNode(n.id);focusNode(n.id);};
$('buy').onclick=buySelected;
$('toggleHud').onclick=()=>{state.settings.hudCollapsed=!state.settings.hudCollapsed;renderChrome();save();};
$('togglePanel').onclick=()=>{state.settings.panelCollapsed=!state.settings.panelCollapsed;renderPanel();save();};
$('settings').onclick=()=>{applySettings();renderStats();$('settingsDialog').showModal();};$('closeSettings').onclick=()=>$('settingsDialog').close();
$('settingsDialog').addEventListener('click',e=>{if(e.target===$('settingsDialog')){const r=e.target.getBoundingClientRect();if(e.clientY<r.top||e.clientX<r.left||e.clientX>r.right)$('settingsDialog').close();}});
for(const button of document.querySelectorAll('[data-tab]')){button.onclick=()=>{for(const b of document.querySelectorAll('[data-tab]')){const active=b===button;b.setAttribute('aria-selected',String(active));$('pane-'+b.dataset.tab).hidden=!active;}if(button.dataset.tab==='stats')renderStats();};}
for(const k of ['motion','touch','haptic','mapControls'])$(k).onchange=()=>{state.settings[k]=$(k).checked;applySettings();save();};$('format').onchange=()=>{state.settings.format=$('format').value;render();save();};
$('purchaseCheat').onchange=()=>{state.settings.purchaseCheat=$('purchaseCheat').checked;render();save();toast(state.settings.purchaseCheat?'테스트 치트 ON · 자금 소모 없이 연구합니다.':'테스트 치트 OFF · 구매 시 정상 차감됩니다.');};
$('saveNow').onclick=()=>save(true);
function exportText(){save();$('transfer').hidden=false;$('saveText').value=JSON.stringify(state);setText($('transferStatus'),'파일을 저장하거나 위 데이터를 복사해 보관하세요.');return $('saveText').value;}
$('exportSave').onclick=()=>{const txt=exportText();const blob=new Blob([txt],{type:'application/json'}),url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download='unbrik-save-'+new Date().toISOString().slice(0,10)+'.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);};
$('importSave').onclick=()=>{$('transfer').hidden=false;$('saveText').value='';setText($('transferStatus'),'현재 진행을 교체할 저장 파일을 선택하거나 데이터를 붙여넣으세요.');$('saveText').focus();};
$('copySave').onclick=async()=>{try{await navigator.clipboard.writeText($('saveText').value);setText($('transferStatus'),'복사했습니다.');}catch{$('saveText').select();setText($('transferStatus'),'선택한 데이터를 직접 복사해 주세요.');}};
$('loadFile').onclick=()=>$('saveFile').click();$('saveFile').onchange=async()=>{const f=$('saveFile').files[0];if(!f)return;if(f.size>1000000){setText($('transferStatus'),'저장 파일이 너무 큽니다.');return;}$('saveText').value=await f.text();setText($('transferStatus'),'데이터를 읽었습니다. 아래 복원 버튼을 누르면 적용됩니다.');$('saveFile').value='';};
function restore(input){cacheReward={money:0,coin:0,until:0};cancelSelection();cameraIntent=null;const next=validateSave(input);checkpointOffline(next);state=next;suspended=document.hidden;econ=economy(state);for(const k of Object.keys(selectionByMap))delete selectionByMap[k];selected=defaultSelection();applyMapTheme();camera=state.camera||initialCamera();applySettings();render();transform();lastFrame=performance.now();save();}
$('applySave').onclick=()=>{try{const txt=$('saveText').value;if(txt.length>1000000)throw Error('저장 데이터가 너무 큽니다.');restore(JSON.parse(txt));setText($('transferStatus'),'저장 데이터를 복원했습니다.');toast('저장 데이터를 복원했습니다.');}catch(e){setText($('transferStatus'),e instanceof SyntaxError?'JSON 형식을 확인해 주세요.':e.message);}};
$('resetButton').onclick=()=>{$('resetConfirm').hidden=!$('resetConfirm').hidden;$('resetInput').value='';$('confirmReset').disabled=true;};$('resetInput').oninput=()=>$('confirmReset').disabled=$('resetInput').value!=='RESET';
$('confirmReset').onclick=()=>{if($('resetInput').value!=='RESET')return;restore(defaultState());try{localStorage.removeItem(BACKUP);}catch{}sessionSeconds=0;$('resetConfirm').hidden=true;$('transfer').hidden=true;$('saveText').value='';$('settingsDialog').close();toast('새 연구를 시작합니다.',0,'important');focusNode(1);};
function renderUpdates(page=updatesPage){const result=updatePage(page);updatesPage=result.current;$('updateEntries').replaceChildren();for(const update of result.entries){const article=document.createElement('article');article.className='update-entry';const heading=document.createElement('h3');heading.textContent=`v${update.version} · ${update.title}`;const list=document.createElement('ul');for(const text of update.items){const item=document.createElement('li');item.textContent=text;list.append(item);}article.append(heading,list);$('updateEntries').append(article);}$('updatePages').replaceChildren();for(let page=1;page<=result.pages;page++){const button=document.createElement('button');button.textContent=String(page);button.setAttribute('aria-label',`${page}페이지`);if(page===result.current)button.setAttribute('aria-current','page');button.onclick=()=>renderUpdates(page);$('updatePages').append(button);}$('updatesPrev').disabled=result.current===1;$('updatesNext').disabled=result.current===result.pages;}
$('toggleUpdates').onclick=()=>{const open=$('updateContents').hidden;$('updateContents').hidden=!open;$('toggleUpdates').setAttribute('aria-expanded',String(open));};
$('updatesPrev').onclick=()=>renderUpdates(updatesPage-1);$('updatesNext').onclick=()=>renderUpdates(updatesPage+1);
function renderStats(){
 const e=economy(state),pb=prestigeBonuses(state),pr=state.prestige,purchasable=PRESTIGE_NODES.filter(n=>!n.reserved),owned=purchasable.filter(n=>prestigeLevel(state,n)>0).length,levels=purchasable.reduce((a,n)=>a+prestigeLevel(state,n),0),levelsTotal=purchasable.reduce((a,n)=>a+n.max,0);
 // Lifetime coin totals stay listed after a prestige locks coins again.
 const coinStats=e.coinUnlocked||state.stats.coinEarned>0;
 const condition=prestigeReady(state)?`충족 · ✿${tokenFormat(tokensFor(state))}`:treeComplete(state)?`$${format(PRESTIGE_THRESHOLD-state.currencies.money)} 더`:`${NODES.length}개 연구 + $${format(PRESTIGE_THRESHOLD)}`;
 // 2.2.2 entries and order, minus the removed ones; prestige entries follow.
 const entries=[['구매한 노드',`${e.count} / ${NODES.length}`],['총 연구 레벨',format(e.total,0)],['총 달러 획득','$'+format(state.stats.earned)],...(coinStats?[['총 코인 획득','¢'+format(state.stats.coinEarned)]]:[]),...(e.coinUnlocked?[['코인 생산','¢'+format(e.coinRate)+' /s']]:[]),['현재 생산','$'+format(e.rate)+' /s'],['캐시 보너스',e.burst?`${priceText({money:e.rate*e.burst,...(e.coinUnlocked?{coin:e.coinRate*e.coinBurst}:{})})} / ${Math.round(e.interval)}s`:'미해금'],['총 플레이 시간',time(state.stats.seconds)],['오프라인 경과',time(state.stats.offlineSeconds)],['오프라인 수입',priceText({money:state.stats.offlineEarned,...(coinStats?{coin:state.stats.offlineCoinEarned}:{})})]];
 const rebirth=[['환생 횟수',`${pr.count}회`],['환생 조건',condition],...(pr.count?[['보유 토큰','✿'+tokenFormat(state.currencies.token)],['누적 토큰','✿'+tokenFormat(pr.tokensEarned)],['환생 노드',`${owned} / ${purchasable.length} · ${levels} / ${levelsTotal} 레벨`],['생산 배율',`$ ×${format(pb.moneyMul*pb.allMul)} · ¢ ×${format(pb.coinMul*pb.allMul)}`],['자동 연구 섹터',`${pb.auto.size} / 8 해금 · ${Object.keys(pr.auto).length} 켜짐`],['이번 회차',time(state.stats.seconds-(state.stats.runStart||0))],...(pr.last?[['마지막 환생',`$${format(pr.last.money)} → ✿${tokenFormat(pr.last.tokens)}`]]:[])]:[])];
 const row=([a,b])=>{const div=document.createElement('div');div.className='stat';const span=document.createElement('span'),strong=document.createElement('strong');span.textContent=a;strong.innerHTML=symbolMarkup(b);div.append(span,strong);return div;};
 $('stats').replaceChildren();for(const entry of entries)$('stats').append(row(entry));
 const label=document.createElement('div');label.className='section-label';label.textContent='REBIRTH';$('stats').append(label);for(const entry of rebirth)$('stats').append(row(entry));
 $('sectorStats').innerHTML=CHAPTERS.flatMap((c,i)=>{if(!sectorUnlocked(i))return [];const nodes=NODES.filter(n=>n.chapter===i),count=nodes.filter(n=>level(state,n)).length;return `<div class="sector-row" style="--sector-color:${c.color}"><div><span>${c.name}${pr.auto[i]?' · AUTO':''}</span><span>${count} / ${nodes.length}</span></div><span class="bar"><i style="width:${count/nodes.length*100}%"></i></span></div>`;}).join('');
 $('petalStatsLabel').hidden=!pr.count;$('petalStats').innerHTML=pr.count?PRESTIGE_BRANCHES.map((c,i)=>{const p=petalProgress(state,i);return `<div class="sector-row" style="--sector-color:${c.color}"><div><span>${c.name}</span><span>${p.done} / ${p.total}</span></div><span class="bar"><i style="width:${p.total?p.done/p.total*100:0}%"></i></span></div>`;}).join(''):'';
}
function suspend(){
 if(suspended)return;
 cacheReward={money:0,coin:0,until:0};renderCacheHud();
 checkpointOffline(state);suspended=true;syncOpalMotion();pointers.clear();gesture=null;save();
}
function resume(){
 if(document.hidden||!suspended)return;
 // Prefer a newer checkpoint if another window saved while this one was away.
 try{const raw=localStorage.getItem(KEY);if(raw){const input=JSON.parse(raw);if(input.savedAt>state.savedAt)state=validateSave(input);}}catch{}
 const reward=settleOffline(state);suspended=false;applySettings();lastFrame=performance.now();checkpointOffline(state);save();render();
 if(reward.elapsed>=5&&reward.amount>0)toast(`오프라인 생산 +${priceText({money:reward.amount,...(reward.coin?{coin:reward.coin}:{})})}\n${time(reward.elapsed)} 경과 · ${time(reward.effectiveSeconds)}에 해당하는 생산`,8500);
}
document.addEventListener('visibilitychange',()=>{if(document.hidden)suspend();else resume();});
window.addEventListener('pagehide',suspend);window.addEventListener('pageshow',resume);
window.addEventListener('blur',suspend);window.addEventListener('focus',resume);
window.addEventListener('storage',ev=>{if(ev.key!==KEY||!ev.newValue)return;try{const incoming=validateSave(JSON.parse(ev.newValue));const settings=state.settings,mapChanged=incoming.map!==state.map;state=incoming;state.settings=settings;if(!suspended)checkpointOffline(state);if(mapChanged){cancelSelection();cameraIntent=null;selected=defaultSelection();applyMapTheme();}render();lastFrame=performance.now();}catch{}});
let previousWidth=viewport.clientWidth,previousHeight=viewport.clientHeight;
function reframeViewport(){
 const hudHeight=$('hud').getBoundingClientRect().height;
 if(hudHeight>0)$('game').style.setProperty('--hud-height',hudHeight+'px');
 const w=viewport.clientWidth,h=viewport.clientHeight,dw=w-previousWidth,dh=h-previousHeight;previousWidth=w;previousHeight=h;
 if(dw||dh){if(cameraIntent){const done=cameraComplete;moveCamera(cameraForIntent(),done);}else{camera.x+=dw/2;camera.y+=dh/2;constrain();transform();}}
 if($('sectorDialog').open)updateNavigatorScroll();
}
new ResizeObserver(reframeViewport).observe(viewport);
$('sectorDialog').querySelector('.navigator-content').addEventListener('scroll',updateNavigatorScroll,{passive:true});
function animateHub(now){if(now-lastHubFrame<33||cameraMoving||document.hidden||suspended||document.body.classList.contains('reduced-motion')||camera.scale<.32)return;const r=205*camera.scale;if(camera.x+r<0||camera.x-r>viewport.clientWidth||camera.y+r<0||camera.y-r>viewport.clientHeight)return;lastHubFrame=now;const p=wireframePaths(now/1000),prefix=onPrestige()?'pWire':'hubWire';$(prefix+'Back').setAttribute('d',p.back);$(prefix+'Front').setAttribute('d',p.front);$(prefix+'Outline').setAttribute('d',p.outline);}
let autoClock=0;
function runAutomation(){
 if(!state.prestige.count||!prestigeBonuses(state).auto.size)return;
 const before=econ.count,sectorsBefore=CHAPTERS.map((_,i)=>sectorProgress(state,i).complete),bought=autoResearch(state,6);if(!bought.length)return;
 econ=economy(state);
 if(!onPrestige()&&state.settings.motion)for(const n of bought){const el=nodeEls.get(n.id);el.classList.add('pop');setTimeout(()=>el.classList.remove('pop'),550);}
 CHAPTERS.forEach((c,i)=>{if(!sectorsBefore[i]&&sectorProgress(state,i).complete)toast(`AUTO · ${c.name} 섹터 완료`,6000);});
 if(econ.count===NODES.length&&before<NODES.length)toast(`${NODES.length}개 노드 연구 완료. AXIOM에 도달했습니다.`,0,'important');
 render();
}
function frame(now){animateHub(now);const dt=Math.max(0,Math.min(1,(now-lastFrame)/1000));lastFrame=now;if(!document.hidden&&!suspended){sessionSeconds+=dt;const events=tick(state,dt);for(const e of events){if(e.type==='cache')showCacheReward({money:e.money,coin:e.coin});else if(e.type==='weather')toast(WEATHER_NOTICES[e.weather],6000,'weather-'+e.weather);}
 autoClock+=dt;if(autoClock>=1){autoClock=0;runAutomation();}
 if(now-lastRender>160){render();lastRender=now;}if(now-lastSave>10000){save();lastSave=now;}}
 requestAnimationFrame(frame);
}
motionPreference.addEventListener?.('change',applySettings);
installGameSelectionGuard();
for(const el of document.querySelectorAll('[data-ui-icon]'))setIcon(el,el.dataset.uiIcon);
// Map switching and the night theme. The flower keeps the grid, turns the
// logo pink and the background blue-gray; every surface follows body.theme-bloom.
function applyMapTheme(){const p=onPrestige();document.body.dataset.map=state.map;document.body.classList.toggle('theme-bloom',p);world.classList.toggle('map-prestige',p);$('prestigeLayer').hidden=!p;for(const id of ['sectorRegions','spokes','edges','centerNode','chapterMarks','nodes'])$(id).toggleAttribute('hidden',p);$('maps').classList.toggle('is-bloom',p);bloom?.refresh();}
const cameraByMap={};
function presentMap(){selected=selectionByMap[state.map]??defaultSelection();state.settings.panelCollapsed=false;applyMapTheme();econ=economy(state);render();const kept=cameraByMap[state.map];if(kept)camera={...kept};else{cameraIntent={type:'fit'};camera=cameraForIntent();cameraIntent=null;}constrain();transform();state.camera={...camera};}
let themeTimer=0;
function switchMap(id){
 const target=MAPS.find(m=>m.id===id);if(!target||id===state.map||target.locked?.(state))return false;
 cancelSelection();cameraIntent=null;selectionByMap[state.map]=selected;cameraByMap[state.map]={...camera};closeNavigator();closeMaps();
 const apply=()=>{state.map=id;presentMap();save();};
 if(document.body.classList.contains('reduced-motion')){apply();return true;}
 clearTimeout(themeTimer);document.body.classList.add('theme-tween');$('game').classList.add('map-fading');
 setTimeout(()=>{apply();requestAnimationFrame(()=>$('game').classList.remove('map-fading'));themeTimer=setTimeout(()=>document.body.classList.remove('theme-tween'),900);},230);
 return true;
}
function renderMapMenu(){
 const menu=$('mapMenu');menu.replaceChildren();const purchasable=PRESTIGE_NODES.filter(n=>!n.reserved),owned=purchasable.filter(n=>prestigeLevel(state,n)>0).length;
 for(const m of MAPS){const locked=!!m.locked?.(state),current=state.map===m.id,main=m.id==='main',b=document.createElement('button');b.className='sector-jump map-jump';b.disabled=locked;b.classList.toggle('is-current',current);b.setAttribute('aria-current',current?'true':'false');b.style.setProperty('--sector-color',main?'#b9f36d':'#f7a8c4');
  const progress=main?`${econ.count} / ${NODES.length} 연구 · $${format(state.currencies.money)}`:locked?`${NODES.length}개 연구 완료 후 $${format(PRESTIGE_THRESHOLD)} 보유 시 환생`:`✿${tokenFormat(state.currencies.token)} · ${owned} / ${purchasable.length} 노드`;
  b.innerHTML=`<span class="sector-jump-icon">${iconSvg(main?'brand':'Flower')}</span><span class="sector-jump-copy"><span class="sector-jump-name">${m.ko}${current?' · 현재':''}</span><span class="sector-jump-progress"></span></span><span class="sector-jump-state" aria-hidden="true">${iconSvg(current?'Check':locked?'LockKeyhole':'ChevronRight')}</span>`;
  b.querySelector('.sector-jump-progress').innerHTML=symbolMarkup(progress);b.onclick=()=>{closeMaps();if(!current)switchMap(m.id);};menu.append(b);}
}
function openMaps(){renderMapMenu();if(!$('mapDialog').open)$('mapDialog').showModal();}
function closeMaps(){if($('mapDialog').open)$('mapDialog').close();}
$('maps').onclick=openMaps;$('closeMaps').onclick=closeMaps;$('mapDialog').addEventListener('cancel',e=>{e.preventDefault();closeMaps();});$('mapDialog').addEventListener('click',e=>{if(e.target===$('mapDialog')){const r=e.target.getBoundingClientRect();if(e.clientY<r.top||e.clientX<r.left||e.clientX>r.right)closeMaps();}});
$('navMaps').onclick=()=>{closeNavigator();openMaps();};
// Prestige: confirm, then a blackout with the spinning UNBRIK polyhedron
// while the mainland resets underneath; the flower is shown when it lifts.
function openPrestigeDialog(){if(!prestigeReady(state))return;setHtml($('prestigeSummary'),symbolMarkup(`보유 $${format(state.currencies.money)} → ✿${tokenFormat(tokensFor(state))} 토큰 · ${state.prestige.count+1}번째 환생`));$('prestigeDialog').showModal();}
function closePrestigeDialog(){if($('prestigeDialog').open)$('prestigeDialog').close();}
$('prestigeButton').onclick=openPrestigeDialog;$('cancelPrestige').onclick=closePrestigeDialog;$('closePrestige').onclick=closePrestigeDialog;$('prestigeDialog').addEventListener('cancel',e=>{e.preventDefault();closePrestigeDialog();});
$('confirmPrestige').onclick=()=>{closePrestigeDialog();runPrestige();};
let prestigeRunning=false;
function runPrestige(){
 if(prestigeRunning||!prestigeReady(state))return false;prestigeRunning=true;
 cancelSelection();cameraIntent=null;closeNavigator();closeMaps();if($('settingsDialog').open)$('settingsDialog').close();
 const overlay=$('prestigeOverlay'),run=state.prestige.count+1,reduced=document.body.classList.contains('reduced-motion'),t0=performance.now();let raf=0,granted=0;
 setText($('overlayTitle'),`${run}번째 환생`);setHtml($('overlayCaption'),symbolMarkup(`✿${tokenFormat(tokensFor(state))} 토큰`));
 overlay.hidden=false;overlay.classList.remove('is-in','is-out');void overlay.offsetWidth;overlay.classList.add('is-in');
 const spin=now=>{const p=wireframePaths((now-t0)/1000*2.4);$('oWireBack').setAttribute('d',p.back);$('oWireFront').setAttribute('d',p.front);$('oWireOutline').setAttribute('d',p.outline);raf=requestAnimationFrame(spin);};
 if(reduced)spin(t0+400);else raf=requestAnimationFrame(spin);if(reduced)cancelAnimationFrame(raf);
 const commit=()=>{cacheReward={money:0,coin:0,until:0};for(const k of Object.keys(selectionByMap))delete selectionByMap[k];for(const k of Object.keys(cameraByMap))delete cameraByMap[k];granted=prestige(state);presentMap();save();};
 const finish=()=>{cancelAnimationFrame(raf);overlay.classList.remove('is-in');overlay.classList.add('is-out');setTimeout(()=>{overlay.hidden=true;overlay.classList.remove('is-out');},reduced?0:700);prestigeRunning=false;toast(`${run}번째 환생 · ✿${tokenFormat(granted)} 토큰 획득`,0,'important');};
 if(reduced){commit();setTimeout(finish,900);}else{setTimeout(commit,1700);setTimeout(finish,2900);}
 return true;
}
bloom=createBloom($('bloom'),()=>onPrestige()&&state.settings.motion&&!motionPreference.matches&&!document.hidden&&!suspended);
createGraph();setupOpalMotion();renderUpdates();applyMapTheme();applySettings();render();if(!state.camera)camera=initialCamera();transform();resume();requestAnimationFrame(frame);if(loadNotice)setTimeout(()=>toast(loadNotice,0,'important'),500);if(!storageOK)setText($('saveState'),'저장 불가 · 설정에서 내보내기');
// Optional browser agent tools use exactly the same state and purchase guard as the UI.
if(document.modelContext?.registerTool){const lifecycle=new AbortController();const register=tool=>{try{Promise.resolve(document.modelContext.registerTool(tool,{signal:lifecycle.signal})).catch(()=>{});}catch{}};
 register({name:'read_research_state',title:'연구 상태 읽기',description:'현재 자원, 생산량, 발견한 연구와 구매 조건을 읽습니다.',inputSchema:{type:'object',properties:{},additionalProperties:false},annotations:{readOnlyHint:true},execute(){const e=economy(state);return {money:state.currencies.money,coin:state.currencies.coin,rate:e.rate,coinRate:e.coinRate,purchased:e.count,nodes:NODES.filter(n=>discovery(n)>1).map(n=>({id:n.id,name:n.name,level:level(state,n),max:n.max,cost:cost(state,n,e),unlocked:unlocked(state,n)}))};}});
 register({name:'select_research',title:'연구 선택',description:'발견한 연구를 선택하고 화면을 이동합니다. 구매하지 않습니다.',inputSchema:{type:'object',properties:{id:{type:'integer',minimum:1,maximum:NODES.length}},required:['id'],additionalProperties:false},annotations:{readOnlyHint:false},execute(input){if(!input||!Number.isInteger(input.id)||!selectNode(input.id))throw Error('발견한 연구 ID가 필요합니다.');focusNode(input.id);return {selected:input.id};}});
 register({name:'purchase_research',title:'연구 구매',description:'발견한 연구를 1레벨 구매합니다. 선행 조건과 최대 레벨을 검사합니다. 무료 연구 치트가 켜져 있으면 자금을 소모하지 않으며, 꺼져 있으면 보유 금액을 검사하고 구매 금액을 차감합니다.',inputSchema:{type:'object',properties:{id:{type:'integer',minimum:1,maximum:NODES.length}},required:['id'],additionalProperties:false},annotations:{readOnlyHint:false},execute(input){if(!input||!Number.isInteger(input.id)||!selectNode(input.id))throw Error('발견한 연구 ID가 필요합니다.');if(!buySelected())throw Error('자원이 부족하거나 연구가 잠겼거나 최대 레벨입니다.');return {id:input.id,level:level(state,input.id),money:state.currencies.money,coin:state.currencies.coin};}});
 window.addEventListener('pagehide',()=>lifecycle.abort(),{once:true});}
