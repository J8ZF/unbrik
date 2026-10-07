import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import * as data from './dist/data.js';
import {iconSvg,setIcon} from './dist/icons.js';

// Run the actual renderers and controls against a minimal element adapter.
// This verifies state/DOM wiring, not browser layout or physical touch input.
const html=readFileSync('dist/index.html','utf8'),app=readFileSync('dist/app.js','utf8');
function element(){const classes=new Set();return {dataset:{},style:{},attributes:{},children:[],hidden:false,textContent:'',innerHTML:'',checked:false,
 classList:{toggle(k,v){v?classes.add(k):classes.delete(k);},contains:k=>classes.has(k)},
 setAttribute(k,v){this.attributes[k]=v;},append(v){this.children.push(v);},replaceChildren(){this.children=[];}};}
const elements=new Map([...html.matchAll(/\bid="([^"]+)"/g)].map(([,id])=>[id,element()]));
const $=id=>{assert(elements.has(id),`Missing element ${id}`);return elements.get(id);};
const slice=(start,end)=>{const a=app.indexOf(start),b=app.indexOf(end,a);assert(a>=0&&b>a);return app.slice(a,b);};
const source=[slice('function renderChrome(){','function save('),slice('function discovery(','const visibility='),slice('function renderPanel(){','function render(){'),slice('function selectNode(','function transform('),
 slice("$('toggleHud').onclick=", "$('settings').onclick="),slice("$('purchaseCheat').onchange=", "$('saveNow').onclick=")].join('\n');
const createUI=new Function('deps','$','document',`
 const {NODES,CHAPTERS,byId,defaultState,level,unlocked,economy,cost,effectText,validateSave,iconSvg,setIcon}=deps;
 let state=defaultState(),selected=1,econ=economy(state),saved=null;
 const format=String,time=String,toast=()=>{};
 function save(){saved=validateSave(JSON.parse(JSON.stringify(state)));}
 function render(){econ=economy(state);renderChrome();renderPanel();}
 ${source}
 return {render,selectNode,get state(){return state},get selected(){return selected},get saved(){return saved}};
`);
const ui=createUI({...data,iconSvg,setIcon},$,{createElement:element});
ui.render();assert.equal($('toggleHud').attributes['aria-expanded'],'false');assert($('hudDetails').hidden);
$('toggleHud').onclick();assert.equal($('toggleHud').attributes['aria-expanded'],'true');assert(!$('hudDetails').hidden);assert.equal(ui.saved.settings.hudCollapsed,false);
$('toggleHud').onclick();assert.equal($('toggleHud').attributes['aria-label'],'상단 펼치기');assert(!html.includes('id="hudToggleText"'));assert(ui.saved.settings.hudCollapsed);
assert(!$('panelDetails').hidden);$('togglePanel').onclick();assert.equal(ui.selected,1);assert($('panelDetails').hidden);assert.equal($('panelToggleText').textContent,'연구 정보 펼치기');assert.equal($('collapsedName').textContent,'START');assert(ui.saved.settings.panelCollapsed);
$('togglePanel').onclick();assert(!$('panelDetails').hidden);assert.equal(ui.selected,1);
$('togglePanel').onclick();ui.state.levels[1]=1;assert(ui.selectNode(2));assert.equal(ui.selected,2);assert(!$('panelDetails').hidden);assert.equal($('togglePanel').attributes['aria-expanded'],'true');
const displayedPrice=$('panelCost').textContent;assert(ui.state.currencies.money<data.cost(ui.state,data.byId.get(2)));$('purchaseCheat').checked=true;$('purchaseCheat').onchange();assert(ui.state.settings.purchaseCheat);assert(ui.saved.settings.purchaseCheat);assert(!$('cheatBadge').hidden);assert.equal($('panelCost').textContent,displayedPrice);assert.equal($('costLabel').textContent,'RESEARCH COST');assert.equal($('buyDetail').textContent,'무료 연구');assert.equal($('buy').className,'');assert(!$('buy').disabled);
$('purchaseCheat').checked=false;$('purchaseCheat').onchange();assert(!ui.state.settings.purchaseCheat);assert($('cheatBadge').hidden);assert.equal($('costLabel').textContent,'RESEARCH COST');assert.equal($('panelCost').textContent,displayedPrice);assert.equal($('buy').className,'waiting');
console.log(JSON.stringify({uiControls:'passed',collapseKeepsSelection:'passed',nodeSelectionReopens:'passed',settingsSave:'passed',cheatIndicator:'passed'}));
