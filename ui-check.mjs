import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import * as data from './dist/data.js';
import {iconSvg,setIcon} from './dist/icons.js';
import * as layout from './dist/layout.js';
import * as updates from './dist/updates.js';

// Run the actual renderers and controls against a minimal element adapter.
// This verifies state/DOM wiring, not browser layout or physical touch input.
const html=readFileSync('dist/index.html','utf8'),app=readFileSync('dist/app.js','utf8');
function element(){const classes=new Set(),queries=new Map();return {dataset:{},style:{setProperty(k,v){this[k]=v;}},attributes:{},children:[],hidden:false,textContent:'',innerHTML:'',checked:false,open:false,
 querySelector(k){if(!queries.has(k))queries.set(k,element());return queries.get(k);},addEventListener(){},showModal(){this.open=true;},close(){this.open=false;},
 classList:{toggle(k,v){v?classes.add(k):classes.delete(k);},contains:k=>classes.has(k),add:k=>classes.add(k),remove:k=>classes.delete(k)},
 setAttribute(k,v){this.attributes[k]=v;},append(v){this.children.push(v);},replaceChildren(){this.children=[];}};}
const elements=new Map([...html.matchAll(/\bid="([^"]+)"/g)].map(([,id])=>[id,element()]));
const $=id=>{assert(elements.has(id),`Missing element ${id}`);return elements.get(id);};
const slice=(start,end)=>{const a=app.indexOf(start),b=app.indexOf(end,a);assert(a>=0&&b>a);return app.slice(a,b);};
const source=[slice('const CENTER_SELECTION','const KEY='),slice('function renderChrome(){','function save('),slice('function discovery(','const visibility='),slice('function createGraph(){','function renderPanel(){'),slice('function openCenter(){','function ripple('),slice('function renderPanel(){','function render(){'),slice('function animatePanel(','function transform('),slice('function buySelected(){','const pointers='),slice('function renderUpdates(','function renderStats('),
 slice("$('toggleHud').onclick=", "$('settings').onclick="),slice("$('purchaseCheat').onchange=", "$('saveNow').onclick=")].join('\n');
const createUI=new Function('deps','$','document',`
 const {NODES,CHAPTERS,byId,defaultState,level,unlocked,economy,cost,effectText,validateSave,MAP_LAYOUT,sectorProgress,BRANCHES,CENTER,connectionPath,centerPath,iconSvg,setIcon,UPDATES,updatePage}=deps;
 let state=defaultState(),selected=1,econ=economy(state),saved=null,focused=null,camera=null,cameraMoving=false,updatesPage=1;
 const nodeEls=new Map(),edgeEls=[],chapterEls=[],sectorEls=[],spokeEls=[],visibility=new Map(),viewport={clientWidth:390,clientHeight:440};
 const moveCamera=value=>camera=value,focusNode=id=>focused=id,stopCamera=()=>{};
 const format=String,time=String,toast=()=>{};
 function save(){saved=validateSave(JSON.parse(JSON.stringify(state)));}
 function render(){econ=economy(state);renderChrome();graph();renderPanel();}
 ${source}
 createGraph();renderUpdates();
 return {render,selectNode,selectCenter,buySelected,openCenter,openNavigator,jumpToSector,renderUpdates,sectorEls,get focused(){return focused},get state(){return state},get selected(){return selected},get saved(){return saved}};
`);
const ui=createUI({...data,...layout,...updates,iconSvg,setIcon},$,{createElement:element,createElementNS:element,body:element()});
ui.render();assert.equal($('toggleHud').attributes['aria-expanded'],'true');assert(!$('hudDetails').hidden);
$('toggleHud').onclick();assert.equal($('toggleHud').attributes['aria-expanded'],'false');assert($('hudDetails').hidden);assert.equal(ui.saved.settings.hudCollapsed,true);
$('toggleHud').onclick();assert.equal($('toggleHud').attributes['aria-label'],'상단 접기');assert(!html.includes('id="hudToggleText"'));assert(!ui.saved.settings.hudCollapsed);
assert(!$('panelDetails').hidden);$('togglePanel').onclick();assert.equal(ui.selected,1);assert($('panelDetails').hidden);assert.equal($('panelToggleText').textContent,'연구 정보 펼치기');assert.equal($('collapsedName').textContent,'START');assert(ui.saved.settings.panelCollapsed);
$('togglePanel').onclick();assert(!$('panelDetails').hidden);assert.equal(ui.selected,1);
$('togglePanel').onclick();ui.state.levels[1]=1;assert(ui.selectNode(2));assert.equal(ui.selected,2);assert(!$('panelDetails').hidden);assert.equal($('togglePanel').attributes['aria-expanded'],'true');
const displayedPrice=$('panelCost').textContent;assert(ui.state.currencies.money<data.cost(ui.state,data.byId.get(2)));$('purchaseCheat').checked=true;$('purchaseCheat').onchange();assert(ui.state.settings.purchaseCheat);assert(ui.saved.settings.purchaseCheat);assert(!$('cheatBadge').hidden);assert.equal($('panelCost').textContent,displayedPrice);assert.equal($('costLabel').textContent,'RESEARCH COST');assert.equal($('buyDetail').textContent,'무료 연구');assert.equal($('buy').className,'');assert(!$('buy').disabled);
$('purchaseCheat').checked=false;$('purchaseCheat').onchange();assert(!ui.state.settings.purchaseCheat);assert($('cheatBadge').hidden);assert.equal($('costLabel').textContent,'RESEARCH COST');assert.equal($('panelCost').textContent,displayedPrice);assert.equal($('buy').className,'waiting');
ui.openCenter();assert.equal(ui.selected,-1);assert.equal($('panelName').textContent,'UNBRIK');assert(!$('sectorDialog').open);assert.equal($('buyText').textContent,'내비게이터');assert($('panelEffect').hidden);assert($('requirements').hidden);assert($('purchaseTrack').hidden);ui.buySelected();assert($('sectorDialog').open);ui.jumpToSector(7);assert($('sectorDialog').open,'Undiscovered sector cannot navigate');ui.jumpToSector(0);assert(!$('sectorDialog').open);assert.equal(ui.focused,2);
for(const n of data.MAP_LAYOUT.sectors[0].members)ui.state.levels[n.id]=1;ui.render();assert.equal(ui.sectorEls[0].style.display,'none');
for(const n of data.MAP_LAYOUT.sectors[0].members)ui.state.levels[n.id]=n.max;ui.render();assert.equal(ui.sectorEls[0].style.display,'');assert.equal($('centerProgress').textContent,'1 / 8 SECTORS');
for(const n of data.NODES)ui.state.levels[n.id]=n.max;ui.state.levels[31]--;ui.render();assert.equal(ui.sectorEls[3].style.display,'none');ui.openCenter();ui.buySelected();ui.jumpToSector(3);assert.equal(ui.focused,31);assert.equal(ui.selected,31);assert(!$('sectorDialog').open);
assert($('hubSector0').classList.contains('complete'));assert(!$('hubSector3').classList.contains('complete'));
assert.equal($('updateEntries').children.length,2);assert.equal($('updatePages').children.length,3);assert($('updatesPrev').disabled);$('updatesNext').onclick();assert(!$('updatesPrev').disabled);$('updatesNext').onclick();assert($('updatesNext').disabled);assert.equal($('updateEntries').children.length,1);
$('updateContents').hidden=true;$('toggleUpdates').onclick();assert(!$('updateContents').hidden);$('toggleUpdates').onclick();assert($('updateContents').hidden);
console.log(JSON.stringify({uiControls:'passed',collapseKeepsSelection:'passed',nodeSelectionReopens:'passed',settingsSave:'passed',cheatIndicator:'passed',centerNavigation:'passed',completionRegions:'passed',centerSelection:'passed',completionSegments:'passed',updatePagination:'passed'}));
