import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import * as data from './dist/data.js';
import {iconSvg,setIcon} from './dist/icons.js';
import * as layout from './dist/layout.js';
import * as updates from './dist/updates.js';
import * as cameraHelpers from './dist/camera.js';

// Run the actual renderers and controls against a minimal element adapter.
// This verifies state/DOM wiring, not browser layout or physical touch input.
const html=readFileSync('dist/index.html','utf8'),app=readFileSync('dist/app.js','utf8');
function element(){const classes=new Set(),queries=new Map(),listeners=new Map(),captures=new Set();return {dataset:{},style:{setProperty(k,v){this[k]=v;}},attributes:{},children:[],hidden:false,textContent:'',innerHTML:'',checked:false,open:false,scrollHeight:720,clientHeight:450,scrollTop:0,
 querySelector(k){if(!queries.has(k))queries.set(k,element());return queries.get(k);},addEventListener(type,fn){if(!listeners.has(type))listeners.set(type,[]);listeners.get(type).push(fn);},emit(type,event){for(const fn of listeners.get(type)||[])fn(event);},getBoundingClientRect(){return {left:0,top:0};},setPointerCapture(id){captures.add(id);},hasPointerCapture(id){return captures.has(id);},releasePointerCapture(id){captures.delete(id);},showModal(){this.open=true;},close(){this.open=false;},
 classList:{toggle(k,v){v?classes.add(k):classes.delete(k);},contains:k=>classes.has(k),add:k=>classes.add(k),remove:k=>classes.delete(k)},
 setAttribute(k,v){this.attributes[k]=v;},append(v){this.children.push(v);},replaceChildren(){this.children=[];}};}
const elements=new Map([...html.matchAll(/\bid="([^"]+)"/g)].map(([,id])=>[id,element()]));
const $=id=>{assert(elements.has(id),`Missing element ${id}`);return elements.get(id);};
const slice=(start,end)=>{const a=app.indexOf(start),b=app.indexOf(end,a);assert(a>=0&&b>a);return app.slice(a,b);};
const source=[slice('const CENTER_SELECTION','const KEY='),slice('function syncOpalMotion(){','function save('),slice('function sectorUnlocked(','const visibility='),slice('function createGraph(){','function animatePanel('),slice('function animatePanel(','function ripple('),slice('function buySelected(){','const pointers='),slice('const pointers=',"$('zoomIn').onclick="),slice('let previousWidth=','new ResizeObserver(reframeViewport)'),slice('function renderUpdates(','function suspend('),
 slice("$('toggleHud').onclick=", "$('settings').onclick="),slice("for(const k of ['motion','touch','haptic','auto','mapControls'])", "$('format').onchange="),slice("$('purchaseCheat').onchange=", "$('saveNow').onclick=")].join('\n');
const createUI=new Function('deps','$','document',`
 const {NODES,CHAPTERS,byId,defaultState,level,unlocked,economy,cost,purchase,effectText,validateSave,MAP_LAYOUT,sectorProgress,BRANCHES,CENTER,boundsOf,connectionPath,centerPath,iconSvg,setIcon,UPDATES,updatePage,interpolateCamera,overviewMode,mapFrames,fitCamera}=deps;
 let sessionSeconds=0;let state=defaultState(),selected=1,econ=economy(state),saved=null,camera={x:0,y:0,scale:1},cameraMoving=false,updatesPage=1;
 let suspended=false,opalMotion={refresh(){}},motionPreference={matches:false};
 let selectionPending=false,selectionEpoch=0,navigationFrame=0,panelAnimation=null,navigatorCloseTimer=0,cameraIntent=null;
 let clock=0,seed=0;const frames=new Map(),timers=new Map(),performance={now:()=>clock};
 const requestAnimationFrame=fn=>{frames.set(++seed,fn);return seed},cancelAnimationFrame=id=>frames.delete(id);
 const setTimeout=(fn,ms)=>{timers.set(++seed,{fn,at:clock+ms});return seed},clearTimeout=id=>timers.delete(id);
 const nodeEls=new Map(),edgeEls=[],chapterEls=[],sectorEls=[],spokeEls=[],visibility=new Map(),viewport=$('viewport'),world=$('world');
 viewport.clientWidth=390;viewport.clientHeight=440;const originalQuery=viewport.querySelector;viewport.querySelector=k=>k==='.map-tools'?$('mapTools'):originalQuery(k);Object.defineProperties($('mapTools'),{offsetLeft:{get:()=>viewport.clientWidth-($('mapTools').classList.contains('is-compact')?50:94)},offsetTop:{get:()=>viewport.clientHeight-($('mapTools').classList.contains('is-compact')?110:170)}});
 const format=String,time=String,toast=()=>{},ripple=()=>{};let gestureUsed=false;
 function save(){saved=validateSave(JSON.parse(JSON.stringify(state)));}
 ${source}
 createGraph();renderUpdates();
 return {sectorUnlocked,renderStats,fit,render,showCacheReward,selectNode,selectCenter,buySelected,openCenter,openNavigator,jumpToSector,interruptMapMotion,renderUpdates,sectorEls,chapterEls,nodeEls,edgeEls,spokeEls,visibility,applySettings,osReduce(value){motionPreference.matches=value;applySettings();},
 advance(now){clock=now;for(const [id,timer]of timers){if(timer.at<=clock){timers.delete(id);timer.fn();}}const pending=[...frames.values()];frames.clear();for(const frame of pending)frame(now);},
 resize(width,height){viewport.clientWidth=width;viewport.clientHeight=height;reframeViewport();},reduced(value){document.body.classList.toggle('reduced-motion',value)},get activePointers(){return pointers.size},get moving(){return cameraMoving},get pending(){return selectionPending},get state(){return state},get selected(){return selected},get saved(){return saved}};
`);
const documentAdapter={...element(),createElement:element,createElementNS:element,body:element()};
const ui=createUI({...data,...layout,...updates,...cameraHelpers,iconSvg,setIcon},$,documentAdapter);
let now=0;function finishNavigation(){ui.advance(now+=16);ui.advance(now+=500);}
ui.applySettings();ui.render();
// Actual click and captured-pointer event paths, including reselecting the same node.
function targetFor(id){const el=id===-1?$('centerNode'):ui.nodeEls.get(id);el.dataset.id=String(id);return {closest:selector=>selector==='.node,.hub-node'?el:null};}
function pointer(type,id,node=1,x=100,y=100,pointerType='touch'){const event={pointerId:id,pointerType,button:0,clientX:x,clientY:y,target:targetFor(node),preventDefault(){}};documentAdapter.emit(type,event);$('viewport').emit(type,event);}
function closePanel(){if(!ui.state.settings.panelCollapsed)$('togglePanel').onclick();}
function nativeClick(target,detail=1){
 const event={target,detail,preventDefault(){this.defaultPrevented=true;},stopImmediatePropagation(){this.stopped=true;},stopPropagation(){this.stopped=true;}};
 documentAdapter.emit('click',event);if(!event.stopped){target.emit?.('click',event);target.onclick?.(event);}return event;
}
// A lower tap can be followed by a compatibility click aimed at the newly raised panel.
// The previous harness only sent the second click to the original node.
closePanel();pointer('pointerdown',81,1,100,400);pointer('pointerup',81,1,100,400);
ui.resize(390,260);nativeClick($('togglePanel'));const lowerTapStaysOpen=!$('panelDetails').hidden;
ui.resize(390,440);
// Interruption can replace a descendant SVG/text target before its ancestor is resolved.
ui.state.levels[1]=1;ui.jumpToSector(0);assert(ui.pending);
const replacedTarget={closest:selector=>selector==='.node,.hub-node'&&ui.pending?ui.nodeEls.get(1):null};
const event={pointerId:82,pointerType:'touch',button:0,clientX:100,clientY:400,target:replacedTarget,preventDefault(){}};
documentAdapter.emit('pointerdown',event);$('viewport').emit('pointerdown',event);pointer('pointerup',82);
const originalTargetRetained=ui.selected===1;
assert.deepEqual({lowerTapStaysOpen,originalTargetRetained},{lowerTapStaysOpen:true,originalTargetRetained:true});
// A separate real press must work immediately, without a 500 ms dead period.
let result=nativeClick($('togglePanel'),0);assert(!result.defaultPrevented,'Keyboard activation is never consumed');
documentAdapter.emit('pointerdown',{target:$('togglePanel')});const before=ui.state.settings.panelCollapsed;
result=nativeClick($('togglePanel'));assert(!result.defaultPrevented);assert.notEqual(ui.state.settings.panelCollapsed,before);
// Initial/restored collapsed state, upper/lower taps, HUD state and motion settings.
for(const motion of [true,false])for(const hudCollapsed of [true,false])for(const y of [80,400]){
 Object.assign(ui.state.settings,{motion,hudCollapsed,panelCollapsed:true});ui.applySettings();ui.render();ui.resize(390,440);
 pointer('pointerdown',90,1,100,y);pointer('pointerup',90,1,100,y);ui.resize(390,260);
 const click=nativeClick(y===400?$('togglePanel'):$('viewport'));
 assert(click.defaultPrevented);assert(!$('panelDetails').hidden);assert(!ui.state.settings.panelCollapsed);
 documentAdapter.emit('pointerdown',{target:$('togglePanel')});nativeClick($('togglePanel'));assert($('panelDetails').hidden);
}
ui.resize(390,440);Object.assign(ui.state.settings,{motion:true,hudCollapsed:false});ui.applySettings();
ui.state.levels={};ui.selectNode(1);ui.advance(now+=600);

closePanel();ui.nodeEls.get(1).emit('click',{detail:1});const nativeClickReopens=!$('panelDetails').hidden;
ui.selectNode(1);closePanel();pointer('pointerdown',101);pointer('lostpointercapture',101);pointer('pointerdown',102);pointer('pointerup',102);const lostCaptureReopens=!$('panelDetails').hidden;
assert.deepEqual({nativeClickReopens,lostCaptureReopens},{nativeClickReopens:true,lostCaptureReopens:true});
assert.equal(ui.activePointers,0);
// Preserve drag/pinch/cancel semantics and ignore the compatibility click after pointer-up.
for(const mode of ['drag','pinch','cancel']){
 closePanel();pointer('pointerdown',201);
 if(mode==='drag')pointer('pointermove',201,1,130,100);
 if(mode==='pinch'){pointer('pointerdown',202,1,150,100);pointer('pointerup',202,1,150,100);}
 pointer(mode==='cancel'?'pointercancel':'pointerup',201);
 ui.nodeEls.get(1).emit('click',{detail:1});assert($('panelDetails').hidden,mode+' must not reopen the panel');assert.equal(ui.activePointers,0);
}
for(const motion of [true,false])for(const touch of [true,false])for(const mapControls of [true,false]){
 Object.assign(ui.state.settings,{motion,touch,mapControls});ui.applySettings();
 for(const pointerType of ['touch','mouse','pen']){
  ui.selectNode(1);closePanel();pointer('pointerdown',301,1,100,100,pointerType);pointer('pointerup',301,1,100,100,pointerType);
  assert(!$('panelDetails').hidden);assert.equal(ui.selected,1);assert.equal($('togglePanel').attributes['aria-expanded'],'true');
  closePanel();ui.nodeEls.get(1).emit('click',{detail:1});assert($('panelDetails').hidden,'Compatibility click must not reopen a panel that was closed after the tap');
 }
 ui.selectCenter();closePanel();pointer('pointerdown',401,-1);pointer('pointerup',401,-1);assert(!$('panelDetails').hidden);assert.equal($('buyText').textContent,'내비게이터');
 closePanel();$('centerNode').emit('click',{detail:0});assert(!$('panelDetails').hidden,'Keyboard activation remains available');
}
ui.advance(now+=600);ui.selectNode(1);closePanel();ui.nodeEls.get(1).emit('click',{detail:1});assert(!$('panelDetails').hidden,'A later native click must not retain an old gesture suppression');
Object.assign(ui.state.settings,{motion:true,touch:true,mapControls:false});ui.applySettings();

assert($('mapTools').classList.contains('is-compact'));assert(!$('mapControls').checked);
for(const id of ['fit','zoomOut','zoomIn'])assert($(id).hidden);
$('mapControls').checked=true;$('mapControls').onchange();assert(ui.saved.settings.mapControls);assert(!$('mapTools').classList.contains('is-compact'));
for(const id of ['fit','zoomOut','zoomIn'])assert(!$(id).hidden);
$('mapControls').checked=false;$('mapControls').onchange();assert(!ui.saved.settings.mapControls);
assert(ui.edgeEls.every(({el})=>el.style.display==='none'),'Fresh game must not show paths to undiscovered research');
assert(ui.spokeEls.every(({el,root})=>el.style.display===(root.id===1?'':'none')),'Fresh game shows only its discovered center arm');
assert(!app.includes('node-ready'));assert(!app.includes('node-meta'));assert(!html.includes('hubOpalLight'));
assert.equal($('toggleHud').attributes['aria-expanded'],'true');assert(!$('hudDetails').hidden);
$('toggleHud').onclick();assert.equal($('toggleHud').attributes['aria-expanded'],'false');assert($('hudDetails').hidden);assert.equal(ui.saved.settings.hudCollapsed,true);
$('toggleHud').onclick();assert.equal($('toggleHud').attributes['aria-label'],'상단 접기');assert(!html.includes('id="hudToggleText"'));assert(!ui.saved.settings.hudCollapsed);
assert(!$('panelDetails').hidden);$('togglePanel').onclick();assert.equal(ui.selected,1);assert($('panelDetails').hidden);assert.equal($('panelToggleText').textContent,'연구 정보 펼치기');assert.equal($('collapsedName').textContent,'START');assert(ui.saved.settings.panelCollapsed);
$('togglePanel').onclick();assert(!$('panelDetails').hidden);assert.equal(ui.selected,1);
$('togglePanel').onclick();ui.state.levels[1]=1;assert(ui.selectNode(2));assert.equal(ui.selected,2);assert(!$('panelDetails').hidden);assert.equal($('togglePanel').attributes['aria-expanded'],'true');
const displayedPrice=$('panelCost').textContent;assert(ui.state.currencies.money<data.cost(ui.state,data.byId.get(2)));$('purchaseCheat').checked=true;$('purchaseCheat').onchange();assert(ui.state.settings.purchaseCheat);assert(ui.saved.settings.purchaseCheat);assert(!$('cheatBadge').hidden);assert.equal($('panelCost').textContent,displayedPrice);assert.equal($('costLabel').textContent,'RESEARCH COST');assert.equal($('buyDetail').textContent,'무료 연구');assert.equal($('buy').className,'');assert(!$('buy').disabled);assert(ui.nodeEls.get(2).className.includes('available'));assert(!ui.nodeEls.get(1).className.includes('available'));
$('purchaseCheat').checked=false;$('purchaseCheat').onchange();assert(!ui.state.settings.purchaseCheat);assert($('cheatBadge').hidden);assert.equal($('costLabel').textContent,'RESEARCH COST');assert.equal($('panelCost').textContent,displayedPrice);assert.equal($('buy').className,'waiting');
ui.openCenter();assert.equal(ui.selected,-1);assert.equal($('panelName').textContent,'UNBRIK');assert(!$('sectorDialog').open);assert.equal($('buyText').textContent,'내비게이터');assert($('panelEffect').hidden);assert($('requirements').hidden);assert($('purchaseTrack').hidden);ui.buySelected();assert($('sectorDialog').open);ui.jumpToSector(7);assert($('sectorDialog').open,'Undiscovered sector cannot navigate');ui.jumpToSector(0);assert.equal($('buy').className,'pending');assert($('buy').disabled);assert.equal($('buyText').textContent,'…');assert.equal(ui.buySelected(),false);finishNavigation();assert(!$('sectorDialog').open);assert.equal(ui.selected,2);assert(!ui.pending);assert.equal($('buy').className,'waiting');
for(const n of data.MAP_LAYOUT.sectors[0].members)ui.state.levels[n.id]=1;ui.render();assert.equal(ui.sectorEls[0].style.display,'none');
for(const n of data.MAP_LAYOUT.sectors[0].members)ui.state.levels[n.id]=n.max;ui.render();assert.equal(ui.sectorEls[0].style.display,'');assert.equal($('centerProgress').textContent,'1 / 8 SECTORS');
for(const n of data.NODES)ui.state.levels[n.id]=n.max;ui.state.levels[31]--;ui.render();assert.equal(ui.sectorEls[3].style.display,'none');ui.openCenter();ui.buySelected();ui.jumpToSector(3);assert(ui.pending);finishNavigation();assert.equal(ui.selected,31);assert(!$('sectorDialog').open);
assert($('hubSector0').classList.contains('complete'));assert(!$('hubSector3').classList.contains('complete'));
assert.equal($('updateEntries').children.length,2);assert.equal($('updatePages').children.length,updates.updatePage(1).pages);assert($('updatesPrev').disabled);for(let i=1;i<updates.updatePage(1).pages;i++)$('updatesNext').onclick();assert(!$('updatesPrev').disabled);assert($('updatesNext').disabled);assert.equal($('updateEntries').children.length,updates.updatePage(99).entries.length);
$('updateContents').hidden=true;$('toggleUpdates').onclick();assert(!$('updateContents').hidden);$('toggleUpdates').onclick();assert($('updateContents').hidden);
// One final state after navigation, even with money changes, interruption or a newer request.
ui.state.currencies.money=0;ui.state.settings.purchaseCheat=false;ui.jumpToSector(3);ui.advance(now+=16);
ui.state.currencies.money=1e200;ui.render();assert.equal($('buy').className,'pending');ui.advance(now+=500);assert.equal($('buy').className,'');
ui.jumpToSector(3);ui.advance(now+=16);ui.jumpToSector(0);assert.equal($('buy').className,'pending');finishNavigation();assert.equal(ui.selected,1);assert.equal($('buy').className,'completed');
ui.jumpToSector(3);ui.advance(now+=16);ui.interruptMapMotion();assert(!ui.pending);assert(!$('buy').disabled);ui.advance(now+=500);assert.equal(ui.selected,31);
ui.state.settings.purchaseCheat=true;ui.jumpToSector(3);finishNavigation();assert.equal($('buyDetail').textContent,'무료 연구');
ui.jumpToSector(3);ui.advance(now+=16);ui.resize(360,240);assert(ui.pending);ui.advance(now+=500);assert(!ui.pending);assert.equal($('buyDetail').textContent,'무료 연구');
ui.state.levels[31]=data.byId.get(31).max;ui.render();assert.equal($('navigatorHint').textContent,'섹터로 이동');
ui.state.levels[31]--;ui.jumpToSector(3);ui.advance(now+=16);for(const r of data.byId.get(31).req)ui.state.levels[r.id]=0;ui.advance(now+=500);assert.equal($('buy').className,'blocked');assert($('buy').disabled);
for(const n of data.NODES)ui.state.levels[n.id]=n.max;ui.state.levels[31]--;ui.reduced(true);ui.jumpToSector(3);ui.advance(now+=16);assert(!ui.pending);assert(!ui.moving);assert.equal($('buyDetail').textContent,'무료 연구');
// Actual settings changes while a navigation is in flight must settle the action once.
ui.reduced(false);ui.state.settings.motion=true;ui.jumpToSector(3);ui.advance(now+=16);assert(ui.pending&&ui.moving);
ui.state.settings.motion=false;ui.applySettings();assert(!ui.pending&&!ui.moving);assert.equal($('buyDetail').textContent,'무료 연구');assert(!$('motion').checked);
ui.state.settings.motion=true;ui.applySettings();ui.jumpToSector(3);ui.advance(now+=16);assert(ui.moving);ui.osReduce(true);assert(!ui.pending&&!ui.moving);assert($('motion').checked,'System reduce motion must not overwrite the saved preference');ui.osReduce(false);
// Changing toolbar dimensions must retain the pending navigation and final button state.
ui.jumpToSector(3);ui.advance(now+=16);assert(ui.pending&&ui.moving);
$('mapControls').checked=true;$('mapControls').onchange();assert(ui.pending&&ui.moving);ui.advance(now+=500);assert(!ui.pending&&!ui.moving);assert.equal($('buyDetail').textContent,'무료 연구');
for(const {el,to}of ui.edgeEls)assert.equal(el.style['--edge-color'],data.CHAPTERS[to.chapter].color);
// Border decoration belongs only to sector 8 and becomes eligible after purchase.
for(const n of data.NODES){const border=ui.nodeEls.get(n.id).children.find(el=>el.className==='opal-border');assert.equal(!!border,n.chapter===7);if(border)assert.equal(border.attributes['aria-hidden'],'true');}
for(const n of data.NODES)ui.state.levels[n.id]=n.id<69?n.max:0;
ui.state.settings.purchaseCheat=false;ui.state.currencies.money=0;ui.selectNode(69);ui.render();assert(!ui.nodeEls.get(69).className.includes('bought'));assert(!ui.nodeEls.get(69).className.includes('available'));
ui.state.settings.purchaseCheat=true;ui.render();assert(ui.nodeEls.get(69).className.includes('available'));assert(!ui.nodeEls.get(69).className.includes('bought'));
assert(data.purchase(ui.state,data.byId.get(69)));ui.render();assert(ui.nodeEls.get(69).className.includes('bought'));assert(!ui.nodeEls.get(69).className.includes('available'));
for(const n of data.NODES)ui.state.levels[n.id]=n.max;
// Original detail panel/center interfaces have no added opal decorations.
ui.selectNode(80);assert(!app.includes('opal-surface'));ui.selectCenter();
ui.state.levels[80]=0;ui.render();assert.equal(ui.sectorEls[7].style.display,'none');
for(const {el,from,to}of ui.edgeEls)if(ui.visibility.get(from.id)<2||ui.visibility.get(to.id)<2)assert.equal(el.style.display,'none');
assert.equal(iconSvg('brand').includes('<svg'),true);assert(!iconSvg('brand').includes('⟁'));assert.equal(data.CHAPTERS[6].color,'#F2DA5B');assert.equal(data.CHAPTERS[7].color,'#F2F4F7');
// Sector boundaries: cross-sector prerequisites must not reveal a later sector.
for(const through of [0,4,5,9,15,25,35,37,45,55,68,80]){
 ui.interruptMapMotion();ui.state.levels={};for(const n of data.NODES)if(n.id<=through)ui.state.levels[n.id]=1;
 ui.selectNode(1);ui.render();ui.renderStats();
 for(const sector of data.MAP_LAYOUT.sectors){
  const chapter=sector.chapter,root=sector.members[0],opened=root.id===1||root.req.every(r=>data.level(ui.state,r.id)>=r.level);
  assert.equal(ui.sectorUnlocked(chapter),opened);
  assert.equal($('sectorMenu').children[chapter].hidden,!opened);
  assert.equal(ui.chapterEls[chapter].hidden,!opened);
  assert.equal($('sectorStats').innerHTML.includes(data.CHAPTERS[chapter].name),opened);
  if(!opened){
   for(const n of sector.members){assert.equal(ui.visibility.get(n.id),0);assert(ui.nodeEls.get(n.id).hidden);}
   const selected=ui.selected;assert.equal(ui.jumpToSector(chapter),false);assert.equal(ui.selected,selected);assert(!ui.moving&&!ui.pending);
  }
 }
 for(const {el,from,to}of ui.edgeEls)if(!ui.sectorUnlocked(from.chapter)||!ui.sectorUnlocked(to.chapter))assert.equal(el.style.display,'none');
}
// Fresh application instances: the very first map tap after loading saved UI preferences.
for(const restoredCollapsed of [true,false]){
 const freshElements=new Map([...html.matchAll(/\bid="([^"]+)"/g)].map(([,id])=>[id,element()])),get=id=>freshElements.get(id);
 const doc={...element(),createElement:element,createElementNS:element,body:element()};
 const fresh=createUI({...data,...layout,...updates,...cameraHelpers,iconSvg,setIcon},get,doc);
 const saved=data.defaultState();saved.settings.panelCollapsed=restoredCollapsed;
 Object.assign(fresh.state,data.validateSave(JSON.parse(JSON.stringify(saved))));fresh.applySettings();fresh.render();
 if(!restoredCollapsed)get('togglePanel').onclick();
 const target={closest:selector=>selector==='.node,.hub-node'?fresh.nodeEls.get(1):null};
 const down={pointerId:1,pointerType:'touch',button:0,clientX:140,clientY:410,target,preventDefault(){}};
 doc.emit('pointerdown',down);get('viewport').emit('pointerdown',down);get('viewport').emit('pointerup',down);fresh.resize(390,260);
 const click={detail:1,target:get('togglePanel'),preventDefault(){this.defaultPrevented=true;},stopImmediatePropagation(){this.stopped=true;}};
 doc.emit('click',click);if(!click.stopped)get('togglePanel').onclick();
 assert(click.defaultPrevented);assert(!get('panelDetails').hidden);assert.equal(fresh.selected,1);
}
// 2.0: the real cache award is visible through header toggles and expires
// without moving progress or inventing a second currency in the save.
{
 const map=new Map([...html.matchAll(/\bid="([^"]+)"/g)].map(([,id])=>[id,element()]));
 const get=id=>{assert(map.has(id),`Missing ${id}`);return map.get(id);};
 const doc={...element(),createElement:element,createElementNS:element,body:element()};
 const hud=createUI({...data,...layout,...updates,...cameraHelpers,iconSvg,setIcon},get,doc);
 hud.render();assert(get('cacheMeter').hidden);assert.deepEqual(hud.state.currencies,{money:0});
 hud.state.levels=Object.fromEntries(data.NODES.filter(n=>n.id<=13).map(n=>[n.id,1]));
 hud.state.timers.cache=7.5;hud.render();
 assert(!get('cacheMeter').hidden);assert.equal(get('cacheInfo').textContent,'22.5s');
 assert.equal(get('cacheTrack').attributes['aria-valuenow'],'25');
 get('toggleHud').onclick();assert(get('hudDetails').hidden);assert(!get('cacheMeter').hidden);
 hud.state.timers.cache=29.9;
 const events=data.tick(hud.state,.2),award=events.find(e=>e.type==='cache');assert(award);
 hud.render();hud.showCacheReward({money:award.amount});
 assert.equal(get('cacheProgress').style.transition,'none','A new cache cycle must reset without sweeping backward');
 assert(get('cacheMoney').classList.contains('is-visible'));
 assert(get('compactCacheMoney').classList.contains('is-visible'));
 assert(!get('cacheCoin').classList.contains('is-visible'));
 get('toggleHud').onclick();assert(get('cacheMoney').classList.contains('is-visible'));
 hud.advance(2399);hud.render();assert(get('compactCacheMoney').classList.contains('is-visible'));
 hud.advance(2401);hud.render();assert(!get('cacheMoney').classList.contains('is-visible'));
 const before=JSON.stringify(hud.state);
 // Rendering future simultaneous awards must itself never credit a currency.
 hud.showCacheReward({money:100,coin:12});
 assert(get('cacheCoin').classList.contains('is-visible'));assert.equal(get('compactCacheCoin').textContent,'+12');
 assert.equal(JSON.stringify(hud.state),before);assert(!('coin' in hud.state.currencies));
 hud.advance(4802);hud.render();assert(!get('compactCacheCoin').classList.contains('is-visible'));
 for(const motion of [true,false])for(const os of [true,false]){
  hud.state.settings.motion=motion;hud.osReduce(os);hud.state.timers.cache=15;hud.render();
  assert.equal(get('cacheTrack').attributes['aria-valuenow'],'50');
  assert.equal(doc.body.classList.contains('reduced-motion'),!motion||os);
 }
}
console.log(JSON.stringify({uiControls:'passed',cacheHud:'passed',coinPlaceholder:'no economy mutations',cacheSettingsCases:4,nativeClickReopens:'passed',lowerTapClickThrough:'blocked',targetBeforeRepaint:'passed',initialPanelLayoutCases:8,freshSessionCases:2,lostCaptureRecovery:'passed',dragPinchCancellation:'passed',inputSettingsCombinations:24,saveCompatibility:'passed',originalNodeMarkup:'restored',sectorBoundaryCases:12,lockedSectorMenuAndStats:'hidden',crossPrerequisiteLeaks:'blocked',invalidNavigation:'blocked',atomicFinalButton:'passed',motionToggleDuringNavigation:'passed'}));
