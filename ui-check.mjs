import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import * as data from './dist/data.js';
import {iconSvg,setIcon} from './dist/icons.js';
import * as layout from './dist/layout.js';
import * as updates from './dist/updates.js';
import * as cameraHelpers from './dist/camera.js';
import * as prestigeModule from './dist/prestige.js';
import * as hub from './dist/hub.js';
import * as units from './dist/units.js';
// Amounts are Big values; any implicit numeric use of one (big > 0) throws here.
globalThis.BIG_STRICT=true;
const N=v=>data.Big.from(v).toNumber();

// Run the actual renderers and controls against a minimal element adapter.
// This verifies state/DOM wiring, not browser layout or physical touch input.
const html=readFileSync('dist/index.html','utf8'),app=readFileSync('dist/app.js','utf8');
function element(){const classes=new Set(),queries=new Map(),listeners=new Map(),captures=new Set();return {dataset:{},style:{setProperty(k,v){this[k]=v;}},attributes:{},children:[],hidden:false,textContent:'',innerHTML:'',checked:false,open:false,scrollHeight:720,clientHeight:450,scrollTop:0,
 querySelector(k){if(!queries.has(k))queries.set(k,element());return queries.get(k);},addEventListener(type,fn){if(!listeners.has(type))listeners.set(type,[]);listeners.get(type).push(fn);},emit(type,event){for(const fn of listeners.get(type)||[])fn(event);},getBoundingClientRect(){return {left:0,top:0};},setPointerCapture(id){captures.add(id);},hasPointerCapture(id){return captures.has(id);},releasePointerCapture(id){captures.delete(id);},showModal(){this.open=true;},close(){this.open=false;},
 classList:{toggle(k,v){v?classes.add(k):classes.delete(k);},contains:k=>classes.has(k),add:k=>classes.add(k),remove:k=>classes.delete(k)},
 setAttribute(k,v){this.attributes[k]=v;},toggleAttribute(k,force){if(force)this.attributes[k]='';else delete this.attributes[k];return !!force;},append(v){this.children.push(v);},replaceChildren(){this.children=[];}};}
const elements=new Map([...html.matchAll(/\bid="([^"]+)"/g)].map(([,id])=>[id,element()]));
const $=id=>{assert(elements.has(id),`Missing element ${id}`);return elements.get(id);};
const slice=(start,end)=>{const a=app.indexOf(start),b=app.indexOf(end,a);assert(a>=0&&b>a);return app.slice(a,b);};
const source=[slice('const CENTER_SELECTION','const KEY='),slice('function compactFormat(', 'function time('),slice('function syncOpalMotion(){','function save('),slice('function sectorUnlocked(','const visibility='),slice('function createGraph(){','function animatePanel('),slice('function animatePanel(','function ripple('),slice('function buySelected(){','const pointers='),slice('const pointers=',"$('zoomIn').onclick="),slice('let previousWidth=','new ResizeObserver(reframeViewport)'),slice('function renderUpdates(','function suspend('),
 slice("$('toggleHud').onclick=", "$('settings').onclick="),slice("for(const k of ['motion','sea','touch','haptic','mapControls'])", "$('format').onchange="),slice("$('purchaseCheat').onchange=", "$('saveNow').onclick="),slice('let autoClock=0;','function frame(now){'),slice('function applyMapTheme(){',"$('maps').onclick="),slice('function openPrestigeDialog(){','function weatherMode(){')].join('\n');
const createUI=new Function('deps','$','document',`
 const {createIslandView,zoneColor,islandOpen,ISLANDS,NODES,CHAPTERS,byId,defaultState,level,unlocked,economy,cost,affordable,waitTime,normalizedCost,purchase,effectText,validateSave,MAP_LAYOUT,sectorProgress,choiceTaken,CURRENCY_DEFS,MAPS,currentMap,worldState,BRANCHES,CENTER,boundsOf,connectionPath,centerPath,iconSvg,setIcon,UPDATES,updatePage,interpolateCamera,overviewMode,farMode,mapFrames,fitCamera,PRESTIGE_NODES,prestigeById,prestigeBonuses,tokensFor,PRESTIGE_THRESHOLD,treeComplete,prestigeGateMet,PRESTIGE_GATE,prestigeReady,prestige,autoResearch,PRESTIGE_BRANCHES,PRESTIGE_LAYOUT,prestigeLevel,prestigeUnlocked,prestigeCost,prestigeAffordable,prestigePurchase,petalProgress,wireframePaths,formatNumber,compactNumber,Big}=deps;
 let sessionSeconds=0;let state=defaultState(),selected=1,econ=economy(state),saved=null,camera={x:0,y:0,scale:1},cameraMoving=false,updatesPage=1;
 let suspended=false,opalMotion={refresh(){}},weatherFx=null,islandView=null,motionPreference={matches:false};
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
 return {sectorUnlocked,renderStats,fit,render,showCacheReward,selectNode,selectCenter,buySelected,openCenter,openNavigator,jumpToSector,jumpToPetal,interruptMapMotion,renderUpdates,sectorEls,chapterEls,nodeEls,edgeEls,spokeEls,visibility,applySettings,applyMapTheme,switchMap,openMaps,runPrestige,runAutomation,toggleAuto,pNodeEls,pEdgeEls,petalEls,osReduce(value){motionPreference.matches=value;applySettings();},
 advance(now){clock=now;for(const [id,timer]of timers){if(timer.at<=clock){timers.delete(id);timer.fn();}}const pending=[...frames.values()];frames.clear();for(const frame of pending)frame(now);},
 resize(width,height){viewport.clientWidth=width;viewport.clientHeight=height;reframeViewport();},reduced(value){document.body.classList.toggle('reduced-motion',value)},get activePointers(){return pointers.size},get cameraNow(){return camera},get moving(){return cameraMoving},get pending(){return selectionPending},get state(){return state},get selected(){return selected},get saved(){return saved}};
`);
const documentAdapter={...element(),createElement:element,createElementNS:element,body:element()};
// The island picture is drawn by island-view.js in the browser; here a stub records what the app asks of it.
const islandCalls=[];let islandsDone=()=>[],islandOpenHook=()=>true;const createIslandView=o=>({...(islandsDone=o.islandsDone||islandsDone,islandOpenHook=o.islandOpen||islandOpenHook,{}),setCamera(c){islandCalls.push(['camera',{...c}]);},resize(){},setMotion(v){islandCalls.push(['motion',v]);},setObsMotion(v){islandCalls.push(['obsMotion',v]);},setReady(v){islandCalls.push(['ready',v]);},setVisible(v){islandCalls.push(['visible',v]);},render(){islandCalls.push(['render']);},reveal(id,done){islandCalls.push(['reveal',id]);done&&done();},revealTarget:()=>null,isRevealing:()=>false});
const ui=createUI({...data,...layout,...updates,...cameraHelpers,...prestigeModule,wireframePaths:hub.wireframePaths,...units,iconSvg,setIcon,createIslandView},$,documentAdapter);
// 4.0 stage 1: one island. LONG is an upgradeable study deep in it, LAST its final study, CACHE the cache study.
const LONG=data.byId.get(23),LAST=data.byId.get(data.ISLANDS[0].last),CACHE=data.NODES.find(n=>n.effects.some(e=>e.type==='cache'));assert(LONG.max>1&&LAST.gate&&LAST.id===30);
// every level of every study, taking the first side of each A/B pair
const maxAll=st=>{for(const n of data.NODES)if(!data.choiceTaken(st,n))st.levels[n.id]=n.max;};
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
const displayedPrice=$('panelCost').textContent;assert(data.Big.from(ui.state.currencies.money).lt(data.cost(ui.state,data.byId.get(2)).money));$('purchaseCheat').checked=true;$('purchaseCheat').onchange();assert(ui.state.settings.purchaseCheat);assert(ui.saved.settings.purchaseCheat);assert(!$('cheatBadge').hidden);assert.equal($('panelCost').textContent,displayedPrice);assert.equal($('costLabel').textContent,'RESEARCH COST');assert.equal($('buyDetail').textContent,'무료 연구');assert.equal($('buy').className,'');assert(!$('buy').disabled);assert(ui.nodeEls.get(2).className.includes('available'));assert(!ui.nodeEls.get(1).className.includes('available'));
$('purchaseCheat').checked=false;$('purchaseCheat').onchange();assert(!ui.state.settings.purchaseCheat);assert($('cheatBadge').hidden);assert.equal($('costLabel').textContent,'RESEARCH COST');assert.equal($('panelCost').textContent,displayedPrice);assert.equal($('buy').className,'waiting');
ui.openCenter();assert.equal(ui.selected,-1);assert.equal($('panelName').textContent,'UNBRIK');assert(!$('sectorDialog').open);assert.equal($('buyText').textContent,'내비게이터');assert($('panelEffect').hidden);assert($('requirements').hidden);assert($('purchaseTrack').hidden);ui.buySelected();assert($('sectorDialog').open);assert.equal(ui.jumpToSector(1),false);assert($('sectorDialog').open,'A closed island cannot navigate');assert(!islandOpenHook(2),'island 2 is closed at the start');ui.jumpToSector(0);assert.equal($('buy').className,'pending');assert($('buy').disabled);assert.equal($('buyText').textContent,'…');assert.equal(ui.buySelected(),false);finishNavigation();assert(!$('sectorDialog').open);assert.equal(ui.selected,2);assert(!ui.pending);assert.equal($('buy').className,'waiting');
for(const n of data.MAP_LAYOUT.sectors[0].members)ui.state.levels[n.id]=1;ui.render();assert.equal(ui.sectorEls[0].style.display,'none');
for(const n of data.MAP_LAYOUT.sectors[0].members)ui.state.levels[n.id]=n.max;ui.render();assert.equal(ui.sectorEls[0].style.display,'');assert.equal($('centerProgress').textContent,'30 / 253 연구');assert.deepEqual(islandsDone(),[true,false,false,false,false],'a finished island lights its relic');assert(islandOpenHook(2)&&!islandOpenHook(3),'the next island opens with the last study');assert(ui.sectorUnlocked(1)&&!ui.sectorUnlocked(2));
assert.equal(ui.chapterEls[0].querySelector('.island-progress').textContent,'30/30 (107/107)');
maxAll(ui.state);ui.state.levels[LONG.id]--;ui.render();assert.equal(ui.sectorEls[0].style.display,'none');ui.openCenter();ui.buySelected();ui.jumpToSector(0);assert(ui.pending);finishNavigation();assert.equal(ui.selected,LONG.id);assert(!$('sectorDialog').open);
assert.deepEqual(islandsDone(),[false,true,true,true,true],'a relic lamp needs every level of its island');
// Update log: two entries per page, page numbers five at a time; previous/next step to the neighbouring set.
{const P=updates.updatePage(1).pages,nums=()=>$('updatePages').children.map(b=>b.textContent),cur=()=>$('updatePages').children.find(b=>b.attributes['aria-current']==='page').textContent;assert(P>10);
 assert.equal($('updateEntries').children.length,2);assert.deepEqual(nums(),['1','2','3','4','5']);assert($('updatesPrev').disabled);assert(!$('updatesNext').disabled);
 $('updatePages').children[2].onclick();assert.equal(cur(),'3');assert.deepEqual(nums(),['1','2','3','4','5']);assert.equal($('updateEntries').children.length,2);
 $('updatesNext').onclick();assert.deepEqual(nums(),['6','7','8','9','10']);assert.equal(cur(),'6');assert(!$('updatesPrev').disabled);
 $('updatesPrev').onclick();assert.deepEqual(nums(),['1','2','3','4','5']);assert.equal(cur(),'5');
 for(let i=0;i<10&&!$('updatesNext').disabled;i++)$('updatesNext').onclick();
 assert($('updatesNext').disabled);assert(!$('updatesPrev').disabled);assert.equal(nums().at(-1),String(P));assert(nums().length<=5&&Number(nums()[0])%5===1);
 $('updatePages').children.at(-1).onclick();assert.equal(cur(),String(P));assert.equal($('updateEntries').children.length,updates.updatePage(99).entries.length);}
$('updateContents').hidden=true;$('toggleUpdates').onclick();assert(!$('updateContents').hidden);$('toggleUpdates').onclick();assert($('updateContents').hidden);
// One final state after navigation, even with money changes, interruption or a newer request.
ui.state.currencies.money=0;ui.state.settings.purchaseCheat=false;ui.jumpToSector(0);ui.advance(now+=16);
ui.state.currencies.money=1e90;ui.state.currencies.coin=1e90;ui.render();assert.equal($('buy').className,'pending');ui.advance(now+=500);assert.equal($('buy').className,'');
ui.jumpToSector(0);ui.advance(now+=16);ui.state.levels[LONG.id]=LONG.max;ui.jumpToSector(0);assert.equal($('buy').className,'pending');finishNavigation();assert.equal(ui.selected,1);assert.equal($('buy').className,'completed');ui.state.levels[LONG.id]--;
ui.jumpToSector(0);ui.advance(now+=16);ui.interruptMapMotion();assert(!ui.pending);assert(!$('buy').disabled);ui.advance(now+=500);assert.equal(ui.selected,LONG.id);
ui.state.settings.purchaseCheat=true;ui.jumpToSector(0);finishNavigation();assert.equal($('buyDetail').textContent,'무료 연구');
ui.jumpToSector(0);ui.advance(now+=16);ui.resize(360,240);assert(ui.pending);ui.advance(now+=500);assert(!ui.pending);assert.equal($('buyDetail').textContent,'무료 연구');
ui.state.levels[LONG.id]=LONG.max;ui.render();assert.equal($('navigatorHint').textContent,'섬으로 이동');
ui.state.levels[LONG.id]--;ui.jumpToSector(0);ui.advance(now+=16);for(const r of LONG.req)ui.state.levels[r.id]=0;ui.advance(now+=500);assert.equal($('buy').className,'blocked');assert($('buy').disabled);
maxAll(ui.state);ui.state.levels[LONG.id]--;ui.reduced(true);ui.jumpToSector(0);ui.advance(now+=16);assert(!ui.pending);assert(!ui.moving);assert.equal($('buyDetail').textContent,'무료 연구');
// Actual settings changes while a navigation is in flight must settle the action once.
ui.reduced(false);ui.state.settings.motion=true;ui.jumpToSector(0);ui.advance(now+=16);assert(ui.pending&&ui.moving);
ui.state.settings.motion=false;ui.applySettings();assert(!ui.pending&&!ui.moving);assert.equal($('buyDetail').textContent,'무료 연구');assert(!$('motion').checked);
ui.state.settings.motion=true;ui.applySettings();ui.jumpToSector(0);ui.advance(now+=16);assert(ui.moving);ui.osReduce(true);assert(!ui.pending&&!ui.moving);assert($('motion').checked,'System reduce motion must not overwrite the saved preference');ui.osReduce(false);
// Changing toolbar dimensions must retain the pending navigation and final button state.
ui.jumpToSector(0);ui.advance(now+=16);assert(ui.pending&&ui.moving);
$('mapControls').checked=true;$('mapControls').onchange();assert(ui.pending&&ui.moving);ui.advance(now+=500);assert(!ui.pending&&!ui.moving);assert.equal($('buyDetail').textContent,'무료 연구');
// Islands: links are straight white lines over a dark casing that follows them; cards take the color of their ground.
for(const {el,casing}of ui.edgeEls){assert.equal(el.style['--edge-color'],undefined);assert.equal(casing.attributes.d,el.attributes.d);assert.equal(casing.style.display,el.style.display);assert(/^M[-\d.]+ [-\d.]+L[-\d.]+ [-\d.]+$/.test(el.attributes.d));}
assert(readFileSync('dist/style.css','utf8').includes('body:not(.theme-bloom) #edges{--edge-color:#f2f4f7}'));
assert.deepEqual(data.ZONE_COLORS,{grass:'#b9f36d',sand:'#ecd29a',rock:'#93a9be'});for(const n of data.NODES)assert.equal(ui.nodeEls.get(n.id).style['--node-color'],n.tint||data.zoneColor(n));assert(data.NODES.some(n=>n.tint)&&data.NODES.filter(n=>n.tint).every(n=>n.chapter===2),'only island 3\'s drawn studies take a tint');for(const n of data.NODES.filter(n=>n.chapter===0))assert.equal(data.zoneColor(n),data.ZONE_COLORS[n.zone],'island 1 keeps its colours');assert.notEqual(data.zoneColor(data.NODES.find(n=>n.chapter===1&&n.zone==='grass')),data.ZONE_COLORS.grass,'islands tint their ground colours');
assert(islandCalls.some(c=>c[0]==='render'),'The island picture follows every render');
// Border decoration belongs only to sector 8 and becomes eligible after purchase.
for(const n of data.NODES){const border=ui.nodeEls.get(n.id).children.find(el=>el.className==='opal-border');assert.equal(!!border,n.chapter===7);if(border)assert.equal(border.attributes['aria-hidden'],'true');}
ui.state.levels={};for(const n of data.NODES)if(n.id<LAST.id)ui.state.levels[n.id]=n.max;
ui.state.settings.purchaseCheat=false;ui.state.currencies.money=0;ui.selectNode(LAST.id);ui.render();assert(!ui.nodeEls.get(LAST.id).className.includes('bought'));assert(!ui.nodeEls.get(LAST.id).className.includes('available'));
ui.state.settings.purchaseCheat=true;ui.render();assert(ui.nodeEls.get(LAST.id).className.includes('available'));assert(!ui.nodeEls.get(LAST.id).className.includes('bought'));
assert(data.purchase(ui.state,LAST));ui.render();assert(ui.nodeEls.get(LAST.id).className.includes('bought'));assert(!ui.nodeEls.get(LAST.id).className.includes('available'));
maxAll(ui.state);
// Original detail panel/center interfaces have no added opal decorations.
ui.selectNode(LAST.id);assert(!app.includes('opal-surface'));ui.selectCenter();
ui.state.levels[LAST.id]=0;ui.render();assert.equal(ui.sectorEls[0].style.display,'none');
for(const {el,from,to}of ui.edgeEls)if(ui.visibility.get(from.id)<2||ui.visibility.get(to.id)<2)assert.equal(el.style.display,'none');
assert.equal(iconSvg('brand').includes('<svg'),true);assert(!iconSvg('brand').includes('⟁'));assert.deepEqual(data.CHAPTERS.map(c=>c.name),['섬 1','섬 2','섬 3','섬 4','섬 5']);
// Island discovery: island 1 is open from the start, cards appear one step ahead of what is owned.
for(const through of [0,1,2,12,17,18,29,30]){
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
 assert(ui.sectorUnlocked(0));for(const n of data.NODES){assert.equal(ui.nodeEls.get(n.id).hidden,!ui.visibility.get(n.id));if(data.level(ui.state,n))assert.equal(ui.visibility.get(n.id),3);}
}
// Opening the next island: buying island 1's last study holds island 2 back, glides the camera over, fades the island in, then shows its studies.
{ui.interruptMapMotion();ui.state.levels={};for(const n of data.MAP_LAYOUT.sectors[0].members)if(!n.gate)ui.state.levels[n.id]=n.max;ui.state.settings.purchaseCheat=true;ui.reduced(false);ui.state.settings.motion=true;ui.applySettings();
 ui.selectNode(LAST.id);ui.render();const before=islandCalls.length;assert(ui.buySelected());assert(data.islandOpen(ui.state,1));
 assert(!ui.sectorUnlocked(1),'island 2 waits for its reveal');assert(!islandOpenHook(2));assert(documentAdapter.body.classList.contains('cutscene'),'the interface folds away for the cutscene');
 for(let i=0;i<3;i++)ui.advance(now+=16);assert(ui.moving,'the camera glides to the island');
 const held={...ui.cameraNow};pointer('pointerdown',1,2);pointer('pointermove',1,2,160,160);pointer('pointerup',1,2,160,160);assert.equal(ui.activePointers,0,'gestures are ignored during the cutscene');assert(ui.moving,'a touch does not stop the glide');
 for(let i=0;i<90;i++)ui.advance(now+=16);
 assert(islandCalls.slice(before).some(c=>c[0]==='reveal'&&c[1]===2),'the island picture fades in once the camera is there');
 assert(ui.sectorUnlocked(1)&&islandOpenHook(2)&&!documentAdapter.body.classList.contains('cutscene'),'island 2 shows after the reveal');assert(!ui.chapterEls[1].hidden);
 const root=data.MAP_LAYOUT.sectors[1].members[0];assert.equal(ui.visibility.get(root.id),2,'the first study of island 2 is open');
 for(let i=0;i<120;i++)ui.advance(now+=16);assert.equal(ui.selected,root.id,'the camera settles on the island\'s first study');
 ui.state.settings.purchaseCheat=false;}
// Fresh application instances: the very first map tap after loading saved UI preferences.
for(const restoredCollapsed of [true,false]){
 const freshElements=new Map([...html.matchAll(/\bid="([^"]+)"/g)].map(([,id])=>[id,element()])),get=id=>freshElements.get(id);
 const doc={...element(),createElement:element,createElementNS:element,body:element()};
 const fresh=createUI({...data,...layout,...updates,...cameraHelpers,...prestigeModule,wireframePaths:hub.wireframePaths,...units,iconSvg,setIcon,createIslandView},get,doc);
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
 const hud=createUI({...data,...layout,...updates,...cameraHelpers,...prestigeModule,wireframePaths:hub.wireframePaths,...units,iconSvg,setIcon,createIslandView},get,doc);
 hud.render();assert(get('cacheMeter').hidden);assert.deepEqual(Object.fromEntries(Object.entries(hud.state.currencies).map(([k,v])=>[k,N(v)])),{money:0,coin:0,token:0});
 hud.state.levels=Object.fromEntries(data.NODES.filter(n=>n.id<=17||n===CACHE).map(n=>[n.id,1]));
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
 assert.equal(JSON.stringify(hud.state),before);assert.equal(N(hud.state.currencies.coin),0);
 hud.advance(4802);hud.render();assert(!get('compactCacheCoin').classList.contains('is-visible'));
 for(const motion of [true,false])for(const os of [true,false]){
  hud.state.settings.motion=motion;hud.osReduce(os);hud.state.timers.cache=15;hud.render();
  assert.equal(get('cacheTrack').attributes['aria-valuenow'],'50');
  assert.equal(doc.body.classList.contains('reduced-motion'),!motion||os);
 }
}
console.log(JSON.stringify({uiControls:'passed',updatePager:'5 per set',cacheHud:'passed',dualCurrencyRewardDisplay:'no duplicate economy mutations',cacheSettingsCases:4,nativeClickReopens:'passed',lowerTapClickThrough:'blocked',targetBeforeRepaint:'passed',initialPanelLayoutCases:8,freshSessionCases:2,lostCaptureRecovery:'passed',dragPinchCancellation:'passed',inputSettingsCombinations:24,saveCompatibility:'passed',originalNodeMarkup:'restored',islandDiscoveryCases:8,islandReveal:"passed",lockedSectorMenuAndStats:'hidden',crossPrerequisiteLeaks:'blocked',invalidNavigation:'blocked',atomicFinalButton:'passed',motionToggleDuringNavigation:'passed'}));

// Coin visibility, data wiring, and real dual-currency cache awards in both HUD states.
ui.interruptMapMotion();ui.state.levels={};ui.state.currencies={money:0,coin:0,token:0};ui.render();
assert($('coinCard').hidden&&$('compactCoinCard').hidden);
// BASIS and the studies leading to it, plus the cache study: coins start at exactly 1 per second.
const basisPath=new Set();(function walk(id){basisPath.add(id);for(const r of data.byId.get(id).req)walk(r.id);})(data.COIN_UNLOCK);
for(const n of data.NODES.filter(n=>basisPath.has(n.id)||n===CACHE))ui.state.levels[n.id]=1;
ui.render();assert(!$('coinCard').hidden&&!$('compactCoinCard').hidden);assert($('hud').classList.contains('has-coin'));
assert.equal($('compactCoinRate').innerHTML,'+1'+'<span class="per">/s</span>');
ui.state.timers.cache=29.9;const payout=data.tick(ui.state,.2).find(e=>e.type==='cache');assert(payout.coin.gt(0)&&payout.money.gt(0));
ui.render();const awarded=JSON.stringify(ui.state.currencies);ui.showCacheReward(payout);
for(const collapsed of [true,false]){ui.state.settings.hudCollapsed=collapsed;ui.render();assert(!$('cacheMeter').hidden);assert($('cacheCoin').classList.contains('is-visible'));assert($('compactCacheCoin').classList.contains('is-visible'));assert.equal(JSON.stringify(ui.state.currencies),awarded);}
ui.selectNode(data.COIN_UNLOCK);ui.selectCenter();ui.selectNode(data.COIN_UNLOCK);assert.equal($('panelCost').innerHTML,'완료','Panel markup cache must survive center/research switching');
console.log(JSON.stringify({coinHeaderUnlock:'passed',actualDualPayout:'passed',headerTogglePreservesReward:'passed',centerPanelMarkup:'passed'}));
// 2.2: world clock, ledger pages and the map-aware cache strip.
{
 const map=new Map([...html.matchAll(/\bid="([^"]+)"/g)].map(([,id])=>[id,element()])),get=id=>{assert(map.has(id),`Missing ${id}`);return map.get(id);};
 const doc={...element(),createElement:element,createElementNS:element,body:element()};
 const ui2=createUI({...data,...layout,...updates,...cameraHelpers,...prestigeModule,wireframePaths:hub.wireframePaths,...units,iconSvg,setIcon,createIslandView},get,doc);
 ui2.render();
 assert.equal(get('worldClock').textContent,'07:00');assert.equal(get('worldPhase').textContent,'낮');assert.equal(get('worldWeather').textContent,'맑음');
 assert.equal(get('pageDots').children.length,2,'Main page plus one ledger page');
 assert.equal(get('ledger').children.filter(r=>!r.hidden).length,1,'Only dollars before BASIS');
 for(let i=0;i<130;i++)data.tick(ui2.state,5);ui2.render();
 assert.equal(get('worldClock').textContent,'17:50');assert.equal(get('worldPhase').textContent,'석양');assert(['맑음','비','눈'].includes(get('worldWeather').textContent));
 assert.equal(ui2.state.world.weatherUntil,1200);
 ui2.state.levels=Object.fromEntries(data.NODES.filter(n=>n.id<=22||n===CACHE).map(n=>[n.id,1]));ui2.render();
 assert.equal(get('ledger').children.filter(r=>!r.hidden).length,2,'Coins join the ledger on unlock');
 assert(!get('cacheMeter').hidden);assert.equal(get('cacheMeter').style['--cache-color'],data.CURRENCY_DEFS.money.color);
 assert(get('cacheYield').innerHTML.includes('$')&&get('cacheYield').innerHTML.includes('¢'),'Both cache yields are listed');
 get('hudNext').onclick();assert.equal(get('pageDots').children[1].className,'is-current');assert(get('hudNext').disabled);
 get('hudPrev').onclick();assert.equal(get('pageDots').children[0].className,'is-current');assert(get('hudPrev').disabled);
 const saved=data.validateSave(JSON.parse(JSON.stringify(ui2.state)));assert.equal(saved.world.seconds,650);assert.equal(saved.map,'main');
 console.log(JSON.stringify({worldClock:'passed',weatherRoll:'passed',ledgerPages:'passed',mapAwareCache:'passed',pagerControls:'passed',worldSaved:'passed'}));
}
// 3.0: prestige row, the rebirth flow, the flower map, buying with tokens, automation checks.
{
 const map=new Map([...html.matchAll(/\bid="([^"]+)"/g)].map(([,id])=>[id,element()])),get=id=>{assert(map.has(id),`Missing ${id}`);return map.get(id);};
 const doc={...element(),createElement:element,createElementNS:element,body:element()};
 const ui3=createUI({...data,...layout,...updates,...cameraHelpers,...prestigeModule,wireframePaths:hub.wireframePaths,...units,iconSvg,setIcon,createIslandView},get,doc);
 ui3.reduced(true);ui3.applyMapTheme();ui3.render();
 assert(get('tokenCard').hidden&&get('compactTokenCard').hidden,'No token card before the first prestige');
 ui3.selectNode(1);assert(get('prestigeButton').hidden,'The prestige button belongs to the center panel');
 ui3.selectCenter();assert(get('prestigeButton').hidden,'No prestige button before the tree is complete');assert(!get('centerNode').classList.contains('ready'));assert(!ui3.state.prestige.noticed);
 assert.equal(get('tokenNote').textContent,'환생 0회');
 // Map dialog: the flower is locked until the first prestige.
 ui3.openMaps();assert.equal(get('mapMenu').children.length,2);assert.equal(data.MAPS[1].ko,'환생');assert(get('mapMenu').children[1].disabled);assert(!get('mapMenu').children[0].disabled);
 assert.equal(ui3.switchMap('prestige'),false,'Locked map cannot be entered');
 // Finish the tree and clear the threshold: the button appears, the note changes.
 maxAll(ui3.state);ui3.state.currencies.money=data.PRESTIGE_THRESHOLD/2;
 ui3.selectCenter();assert(!get('prestigeButton').hidden&&get('prestigeButton').disabled,'Tree complete but short: the button waits');assert(get('prestigeDetail').innerHTML.includes('더'));assert(!get('centerNode').classList.contains('ready'));
 ui3.state.currencies.money=data.PRESTIGE_THRESHOLD*4;ui3.state.currencies.coin=50;
 ui3.selectCenter();assert(!get('prestigeButton').hidden&&!get('prestigeButton').disabled);assert.equal(get('tokenNote').textContent,'환생 가능');assert(get('prestigeDetail').innerHTML.includes('20'),'Four times the threshold doubles the tokens');
 assert(get('centerNode').classList.contains('ready'),'Deck lights turn pink while prestige is available');assert(islandCalls.some(c=>c[0]==='ready'&&c[1]===true),'The island view is told a rebirth is ready');assert(ui3.state.prestige.noticed,'One availability notice per run');
 get('prestigeButton').onclick();assert(get('prestigeDialog').open);assert(get('prestigeSummary').innerHTML.includes('1번째'));
 get('confirmPrestige').onclick();assert(!get('prestigeDialog').open);assert(!get('prestigeOverlay').hidden);
 assert.equal(ui3.state.map,'prestige','Reduced motion commits at once');assert.equal(N(ui3.state.currencies.token),20);assert.deepEqual(ui3.state.levels,{});assert.equal(N(ui3.state.currencies.money),0);assert.equal(N(ui3.state.currencies.coin),0);
 assert(doc.body.classList.contains('theme-bloom'));assert(!get('prestigeLayer').hidden);assert(get('nodes').attributes.hidden!==undefined&&get('centerNode').attributes.hidden!==undefined);
 for(const id of ['sectorRegions','spokes','edges'])assert(get(id).attributes.hidden!==undefined,'Mainland SVG layers are hidden by attribute on the flower');assert.equal(ui3.selected,-1);assert(get('pCenter').classList.contains('selected'));assert(get('prestigeButton').hidden,'No prestige button on the flower');assert(!get('centerNode').classList.contains('ready'));assert(!ui3.state.prestige.noticed,'The notice flag resets with the run');
 ui3.advance(1000);assert(get('prestigeOverlay').hidden,'Overlay lifts after the hold');
 assert(!get('tokenCard').hidden);assert.equal(get('token').textContent,'20');assert.equal(get('tokenNote').textContent,'환생 1회');
 assert(get('moneyCard').hidden,'The flower page shows only tokens');
 // Discovery on the flower: roots open, their children ghosted, the rest hidden.
 const roots=prestigeModule.PRESTIGE_NODES.filter(n=>n.row===0),second=prestigeModule.PRESTIGE_NODES.filter(n=>n.row===1),third=prestigeModule.PRESTIGE_NODES.filter(n=>n.row===2);
 for(const n of roots)assert.equal(ui3.visibility.get(n.id),2);for(const n of second)assert.equal(ui3.visibility.get(n.id),1);for(const n of third)assert.equal(ui3.visibility.get(n.id),0);
 assert(ui3.pEdgeEls.every(e=>e.el.style.display==='none'),'No link is shown before a root is owned');
 assert(!ui3.selectNode(1),'Mainland nodes are not selectable on the flower');assert(ui3.selectNode(1001));
 assert.equal(get('panelMeta').textContent,'001 / DORMANT · LV.0/4');assert.equal(get('buyText').textContent,'연구','Prestige studies use the mainland verb');
 assert(ui3.buySelected());assert.equal(prestigeModule.prestigeLevel(ui3.state,1001),1);assert.equal(N(ui3.state.currencies.token),17);
 assert(ui3.pNodeEls.get(1001).className.includes('bought'));assert.equal(ui3.visibility.get(1002),2);assert.equal(ui3.visibility.get(1004),1);
 assert(ui3.pEdgeEls.some(e=>e.from.id===1001&&e.el.style.display===''),'Links appear once the parent is owned');
 // Reserved nodes are visible but never purchasable; a locked node cannot be bought.
 const reserved=prestigeModule.PRESTIGE_NODES.find(n=>n.reserved);assert(!ui3.selectNode(reserved.id)||!ui3.buySelected());
 assert(!ui3.selectNode(1004),'Ghost nodes stay unselectable');
 // AUTOPILOT I unlocks the sector-1 automation check on the mainland.
 assert(ui3.selectNode(1017));assert.equal(get('panelName').textContent,'AUTOPILOT I');assert(ui3.buySelected());assert.equal(N(ui3.state.currencies.token),14);
 assert(ui3.jumpToPetal(1));assert.equal(ui3.selected,1009,'Petal jump picks the open root');
 ui3.openNavigator();assert(get('sectorMenu').hidden&&!get('petalMenu').hidden);
 assert.equal(get('petalMenu').children.length,5);
 assert(ui3.switchMap('main'));assert.equal(ui3.state.map,'main');for(const id of ['sectorRegions','spokes','edges'])assert.equal(get(id).attributes.hidden,undefined,'Mainland layers return');assert(!doc.body.classList.contains('theme-bloom'));assert(get('prestigeLayer').hidden&&get('nodes').attributes.hidden===undefined);
 assert.equal(ui3.selected,1,'Mainland selection starts at the first study after a rebirth');
 assert(get('tokenCard').hidden&&!get('moneyCard').hidden,'Page 1 shows the mainland currencies');assert(!get('ledger').children[2].hidden,'The ledger page still lists tokens');
 const toggle=ui3.chapterEls[0].querySelector('.auto-toggle');
 assert(!toggle.hidden,'Island 1 shows its automation check');
 assert(ui3.toggleAuto(0));assert.deepEqual(ui3.state.prestige.auto,{0:true});assert(toggle.classList.contains('is-on'));
 assert(!ui3.toggleAuto(1),'Checks need the matching AUTOPILOT node');
 ui3.state.currencies.money=1e12;ui3.runAutomation();assert(data.level(ui3.state,1)>0,'Automation buys sector-1 studies');
 ui3.state.currencies.money=1e30;ui3.state.currencies.coin=1e12;for(let i=0;i<40;i++)ui3.runAutomation();assert(data.sectorProgress(ui3.state,0).complete,'Island 1 completes under automation');
 assert(toggle.hidden,'A finished sector hides its check');
 // Stats show the rebirth block; the save round-trips with the prestige data.
 ui3.renderStats();assert(get('petalStats').innerHTML.includes('1 / 8'),'Prestige sector rows count bought research (DORMANT: 1 of 8)');assert(get('petalStats').innerHTML.includes('예약'));assert.equal(data.MAPS[0].ko,'AXIOM');assert(get('stats').children.some(c=>c.textContent==='REBIRTH'));assert(!get('petalStatsLabel').hidden);assert.equal(get('stats').children[0].children[0].textContent,'구매한 노드','2.2.2 stat labels are kept');
 const saved=data.validateSave(JSON.parse(JSON.stringify(ui3.state)));assert.equal(saved.prestige.count,1);assert.equal(N(saved.currencies.token),14);assert.deepEqual(saved.prestige.auto,{0:true});
 // The flower keeps its selection when the player returns.
 assert(ui3.switchMap('prestige'));assert.equal(ui3.selected,1009);
 console.log(JSON.stringify({prestigeRow:'passed',rebirthFlow:'passed',flowerDiscovery:'passed',tokenPurchases:'passed',reservedNodes:'blocked',mapSwitch:'passed',automationChecks:'passed',rebirthStats:'passed',prestigeSaved:'passed'}));
}
// 3.1: amounts past the double limit render in the header, the ledger, the panel and the stats.
{
 const map=new Map([...html.matchAll(/\bid="([^"]+)"/g)].map(([,id])=>[id,element()])),get=id=>{assert(map.has(id),`Missing ${id}`);return map.get(id);};
 const doc={...element(),createElement:element,createElementNS:element,body:element()};
 const ui4=createUI({...data,...layout,...updates,...cameraHelpers,...prestigeModule,wireframePaths:hub.wireframePaths,...units,iconSvg,setIcon,createIslandView},get,doc);
 const B=data.Big.from;
 maxAll(ui4.state);
 ui4.state.currencies.money=B('1.5e400');ui4.state.currencies.coin=B('2.5e330');ui4.state.stats.earned=B('3e400');ui4.state.stats.coinEarned=B('4e330');
 ui4.reduced(true);ui4.applyMapTheme();ui4.selectCenter();ui4.render();
 assert.equal(get('compactMoneyValue').textContent,'1.50e400');assert.equal(get('compactCoin').textContent,'2.50e330');
 assert(!get('prestigeButton').hidden&&!get('prestigeButton').disabled,'A huge balance clears the threshold');
 assert(data.tokensFor(ui4.state).eq(B('1.5e400').div(5e33).sqrt().mul(10).round(2)),'Tokens = 10 · √(1.5e400 / 5e33)');
 ui4.state.settings.format='named';ui4.render();assert.equal(get('compactMoneyValue').textContent,'1.50e400','Past Ce the exponent shows');
 ui4.state.currencies.money=B('4.2e300');ui4.render();assert.equal(get('compactMoneyValue').textContent,'4.20NoNog');
 ui4.state.currencies.money=B('1.5e400');ui4.renderStats();
 ui4.runPrestige();
 assert(ui4.state.currencies.token.gt('1e184')&&ui4.state.currencies.money.isZero(),'Prestige pays astronomical tokens');
 const saved=data.validateSave(JSON.parse(JSON.stringify(ui4.state)));assert(saved.currencies.token.eq(ui4.state.currencies.token)&&saved.prestige.last.money.eq('1.5e400'));
 ui4.render();assert.equal(get('compactMoneyValue').textContent,'0');
 console.log(JSON.stringify({bigHeader:'passed',bigPrestige:'passed',bigSave:'passed'}));
}
