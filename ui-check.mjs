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
function element(){const classes=new Set(),queries=new Map();return {dataset:{},style:{setProperty(k,v){this[k]=v;}},attributes:{},children:[],hidden:false,textContent:'',innerHTML:'',checked:false,open:false,scrollHeight:720,clientHeight:450,scrollTop:0,
 querySelector(k){if(!queries.has(k))queries.set(k,element());return queries.get(k);},addEventListener(){},showModal(){this.open=true;},close(){this.open=false;},
 classList:{toggle(k,v){v?classes.add(k):classes.delete(k);},contains:k=>classes.has(k),add:k=>classes.add(k),remove:k=>classes.delete(k)},
 setAttribute(k,v){this.attributes[k]=v;},append(v){this.children.push(v);},replaceChildren(){this.children=[];}};}
const elements=new Map([...html.matchAll(/\bid="([^"]+)"/g)].map(([,id])=>[id,element()]));
const $=id=>{assert(elements.has(id),`Missing element ${id}`);return elements.get(id);};
const slice=(start,end)=>{const a=app.indexOf(start),b=app.indexOf(end,a);assert(a>=0&&b>a);return app.slice(a,b);};
const source=[slice('const CENTER_SELECTION','const KEY='),slice('function syncOpalMotion(){','function save('),slice('function discovery(','const visibility='),slice('function createGraph(){','function animatePanel('),slice('function animatePanel(','function ripple('),slice('function buySelected(){','const pointers='),slice('let previousWidth=','new ResizeObserver(reframeViewport)'),slice('function renderUpdates(','function renderStats('),
 slice("$('toggleHud').onclick=", "$('settings').onclick="),slice("$('purchaseCheat').onchange=", "$('saveNow').onclick=")].join('\n');
const createUI=new Function('deps','$','document',`
 const {NODES,CHAPTERS,byId,defaultState,level,unlocked,economy,cost,purchase,effectText,validateSave,MAP_LAYOUT,sectorProgress,BRANCHES,CENTER,boundsOf,connectionPath,centerPath,iconSvg,setIcon,UPDATES,updatePage,interpolateCamera,overviewMode,mapFrames,fitCamera}=deps;
 let state=defaultState(),selected=1,econ=economy(state),saved=null,camera={x:0,y:0,scale:1},cameraMoving=false,updatesPage=1;
 let suspended=false,opalMotion={refresh(){}},motionPreference={matches:false};
 let selectionPending=false,selectionEpoch=0,navigationFrame=0,panelAnimation=null,navigatorCloseTimer=0,cameraIntent=null;
 let clock=0,seed=0;const frames=new Map(),timers=new Map(),performance={now:()=>clock};
 const requestAnimationFrame=fn=>{frames.set(++seed,fn);return seed},cancelAnimationFrame=id=>frames.delete(id);
 const setTimeout=(fn,ms)=>{timers.set(++seed,{fn,at:clock+ms});return seed},clearTimeout=id=>timers.delete(id);
 const nodeEls=new Map(),edgeEls=[],chapterEls=[],sectorEls=[],spokeEls=[],visibility=new Map(),viewport=$('viewport'),world=$('world');
 viewport.clientWidth=390;viewport.clientHeight=440;viewport.querySelector('.map-tools').offsetLeft=296;viewport.querySelector('.map-tools').offsetTop=270;
 const format=String,time=String,toast=()=>{};
 function save(){saved=validateSave(JSON.parse(JSON.stringify(state)));}
 ${source}
 createGraph();renderUpdates();
 return {render,selectNode,selectCenter,buySelected,openCenter,openNavigator,jumpToSector,interruptMapMotion,renderUpdates,sectorEls,nodeEls,edgeEls,spokeEls,visibility,applySettings,osReduce(value){motionPreference.matches=value;applySettings();},
 advance(now){clock=now;for(const [id,timer]of timers){if(timer.at<=clock){timers.delete(id);timer.fn();}}const pending=[...frames.values()];frames.clear();for(const frame of pending)frame(now);},
 resize(width,height){viewport.clientWidth=width;viewport.clientHeight=height;viewport.querySelector('.map-tools').offsetLeft=width-94;viewport.querySelector('.map-tools').offsetTop=height-170;reframeViewport();},reduced(value){document.body.classList.toggle('reduced-motion',value)},get moving(){return cameraMoving},get pending(){return selectionPending},get state(){return state},get selected(){return selected},get saved(){return saved}};
`);
const ui=createUI({...data,...layout,...updates,...cameraHelpers,iconSvg,setIcon},$,{createElement:element,createElementNS:element,body:element()});
let now=0;function finishNavigation(){ui.advance(now+=16);ui.advance(now+=500);}
ui.render();
assert(ui.edgeEls.every(({el})=>el.style.display==='none'),'Fresh game must not show paths to undiscovered research');
assert(ui.spokeEls.every(({el,root})=>el.style.display===(root.id===1?'':'none')),'Fresh game shows only its discovered center arm');
assert.equal($('hubOpalLight').style.display,'none');
ui.state.currencies.money=10;ui.render();assert(!ui.nodeEls.get(1).querySelector('.node-ready').hidden);ui.state.currencies.money=0;ui.render();assert(ui.nodeEls.get(1).querySelector('.node-ready').hidden);
assert.equal($('toggleHud').attributes['aria-expanded'],'true');assert(!$('hudDetails').hidden);
$('toggleHud').onclick();assert.equal($('toggleHud').attributes['aria-expanded'],'false');assert($('hudDetails').hidden);assert.equal(ui.saved.settings.hudCollapsed,true);
$('toggleHud').onclick();assert.equal($('toggleHud').attributes['aria-label'],'상단 접기');assert(!html.includes('id="hudToggleText"'));assert(!ui.saved.settings.hudCollapsed);
assert(!$('panelDetails').hidden);$('togglePanel').onclick();assert.equal(ui.selected,1);assert($('panelDetails').hidden);assert.equal($('panelToggleText').textContent,'연구 정보 펼치기');assert.equal($('collapsedName').textContent,'START');assert(ui.saved.settings.panelCollapsed);
$('togglePanel').onclick();assert(!$('panelDetails').hidden);assert.equal(ui.selected,1);
$('togglePanel').onclick();ui.state.levels[1]=1;assert(ui.selectNode(2));assert.equal(ui.selected,2);assert(!$('panelDetails').hidden);assert.equal($('togglePanel').attributes['aria-expanded'],'true');
const displayedPrice=$('panelCost').textContent;assert(ui.state.currencies.money<data.cost(ui.state,data.byId.get(2)));$('purchaseCheat').checked=true;$('purchaseCheat').onchange();assert(ui.state.settings.purchaseCheat);assert(ui.saved.settings.purchaseCheat);assert(!$('cheatBadge').hidden);assert.equal($('panelCost').textContent,displayedPrice);assert.equal($('costLabel').textContent,'RESEARCH COST');assert.equal($('buyDetail').textContent,'무료 연구');assert.equal($('buy').className,'');assert(!$('buy').disabled);assert(!ui.nodeEls.get(2).querySelector('.node-ready').hidden);assert(ui.nodeEls.get(1).querySelector('.node-ready').hidden);
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
// Opal detail decoration follows selection, and the center reflection requires all levels.
assert.equal($('hubOpalLight').style.display,'');ui.selectNode(80);assert($('panelSymbol').classList.contains('opal-surface'));ui.selectCenter();assert(!$('panelSymbol').classList.contains('opal-surface'));
ui.state.levels[80]=0;ui.render();assert.equal($('hubOpalLight').style.display,'none');assert.equal(ui.sectorEls[7].style.display,'none');
for(const {el,from,to}of ui.edgeEls)if(ui.visibility.get(from.id)<2||ui.visibility.get(to.id)<2)assert.equal(el.style.display,'none');
assert.equal(iconSvg('brand').includes('<svg'),true);assert(!iconSvg('brand').includes('⟁'));assert.equal(data.CHAPTERS[6].color,'#F2DA5B');assert.equal(data.CHAPTERS[7].color,'#F2F4F7');
console.log(JSON.stringify({uiControls:'passed',saveCompatibility:'passed',centerSelection:'passed',completionSegments:'passed',updatePagination:'passed',pendingButtonGuard:'passed',atomicFinalButton:'passed',latestNavigationWins:'passed',interruptedNavigation:'passed',svgBrand:'passed',undiscoveredPaths:'passed',readyBadge:'passed',opalCompletion:'passed',motionToggleDuringNavigation:'passed'}));
