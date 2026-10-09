import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createOpalMotion,preventGameSelection,clearGameSelection,installGameSelectionGuard} from './dist/effects.js';
import {NODES,defaultState} from './dist/data.js';

// Actual application settings/setup, with controlled intersection and lifecycle signals.
// This exercises scheduling boundaries, not browser CSS or device touch rendering.
const observers=[];
class Observer{
 constructor(callback,options){this.callback=callback;this.options=options;this.targets=[];observers.push(this);}
 observe(target){this.targets.push(target);}
 disconnect(){this.disconnected=true;}
 emit(target,visible){this.callback([{target,isIntersecting:visible,intersectionRatio:visible?1:0}]);}
}
function element(){const classes=new Set();return {dataset:{},style:{setProperty(k,v){this[k]=v;}},classList:{toggle(k,v){v?classes.add(k):classes.delete(k);},contains:k=>classes.has(k)}};}
const elements=new Map(),$=id=>{if(!elements.has(id))elements.set(id,element());return elements.get(id);};
const app=readFileSync('dist/app.js','utf8');
const actual=app.slice(app.indexOf('function syncOpalMotion(){'),app.indexOf('function renderChrome(){'));
const setup=new Function('createOpalMotion','NODES','defaultState','$','element',`
 let state=defaultState(),opalMotion=null,weatherFx=null,suspended=false,panelAnimation=null,cameraMoving=false,cameraIntent=null;
 const seaCalls=[],islandView={setMotion(v){seaCalls.push(v);}};
 const motionPreference={matches:false},document={hidden:false,body:element()},viewport=element();
 const nodeEls=new Map(NODES.map(n=>[n.id,element()])),sectorEls=Array.from({length:8},element);
 ${actual}
 setupOpalMotion();applySettings();
 return {state,nodeEls,sectorEls,viewport,body:document.body,controller:opalMotion,seaCalls,
 setting(k,v){state.settings[k]=v;applySettings();},osReduce(v){motionPreference.matches=v;applySettings();},
 hidden(v){document.hidden=v;syncOpalMotion();},suspend(v){suspended=v;syncOpalMotion();}};
`);
// Island 1 has no opal cards (3.x sector 8); a fixture keeps the controller covered.
const OPAL=NODES.slice(-8).map(n=>n.id),FIXTURE=NODES.map(n=>OPAL.includes(n.id)?{...n,chapter:7}:n);
const ui=setup((groups,enabled)=>createOpalMotion(groups,enabled,Observer),FIXTURE,defaultState,$,element);
assert.equal(observers.length,1);assert.equal(observers[0].options.root,ui.viewport);
assert.equal(observers[0].targets.length,OPAL.length);
const node=ui.nodeEls.get(OPAL[0]),offscreen=ui.nodeEls.get(OPAL[1]),status=el=>el.style['--opal-play-state'];
assert.equal(status(node),'paused');observers[0].emit(node,true);assert.equal(status(node),'running');assert.equal(status(offscreen),'paused');
ui.setting('touch',false);assert.equal(status(node),'running','Touch toggle must remain independent of ambient motion');
ui.setting('motion',false);assert.equal(status(node),'paused');assert(ui.body.classList.contains('reduced-motion'));assert(!$('motion').checked);
ui.setting('motion',true);assert.equal(status(node),'running');ui.osReduce(true);assert.equal(status(node),'paused');assert($('motion').checked);ui.osReduce(false);assert.equal(status(node),'running');
ui.hidden(true);assert.equal(status(node),'paused');assert(ui.body.classList.contains('effects-paused'));ui.hidden(false);assert.equal(status(node),'running');
ui.suspend(true);assert.equal(status(node),'paused');ui.suspend(false);assert.equal(status(node),'running');
observers[0].emit(node,false);assert.equal(status(node),'paused');ui.setting('motion',false);ui.setting('motion',true);assert.equal(status(node),'paused','Restoring motion must not restart offscreen effects');
ui.controller.disconnect();assert(observers.every(o=>o.disconnected));assert.equal(status(node),'paused');
// Sea motion follows its own switch and stops whenever motion is reduced; the switch is disabled then.
{const last=()=>ui.seaCalls.at(-1);ui.setting('motion',true);assert.equal(last(),true);assert(!$('sea').disabled);
 ui.setting('sea',false);assert.equal(last(),false);assert(!$('sea').checked);ui.setting('sea',true);assert.equal(last(),true);assert($('sea').checked);
 ui.setting('motion',false);assert.equal(last(),false);assert($('sea').disabled);assert($('sea').checked,'Reduced motion does not overwrite the sea preference');ui.setting('motion',true);
 ui.osReduce(true);assert.equal(last(),false);assert($('sea').disabled);ui.osReduce(false);assert.equal(last(),true);
 assert.equal(defaultState().settings.sea,true);}
const staticTarget=element();createOpalMotion([{root:null,elements:[staticTarget]}],()=>true,null);assert.equal(status(staticTarget),'paused');

// Lightweight nodes reproduce the selection targets from the Android report.
function domNode(tag,parent=null,id=''){
 const el={nodeType:1,tag,parentElement:parent,id,editable:false};
 el.closest=selector=>{for(let p=el;p;p=p.parentElement){if(selector.split(',').some(s=>s==='#game'?p.id==='game':s.startsWith('[contenteditable]')?p.editable:s===p.tag))return p;}return null;};return el;
}
const game=domNode('main',null,'game'),toastCopy=domNode('div',game,'toastMessage'),footer=domNode('footer',game),settingCopy=domNode('p',game),button=domNode('button',game),link=domNode('a',game),textarea=domNode('textarea',game),input=domNode('input',game),select=domNode('select',game),editable=domNode('div',game);editable.editable=true;
const editChild=domNode('span',editable),text=el=>({nodeType:3,parentElement:el});
for(const type of ['selectstart','contextmenu','dblclick']){
 for(const target of [toastCopy,footer,settingCopy,button,text(toastCopy),link]){
  let prevented=false;preventGameSelection({type,target,preventDefault(){prevented=true;}});
  assert.equal(prevented,!(type==='contextmenu'&&target===link));
 }
 for(const target of [textarea,input,select,editable,editChild,text(editChild),domNode('div')]){
  let prevented=false;preventGameSelection({type,target,preventDefault(){prevented=true;}});assert(!prevented);
 }
}
let clears=0;
const selection={isCollapsed:false,anchorNode:text(toastCopy),focusNode:text(toastCopy),removeAllRanges(){clears++;this.isCollapsed=true;}};
const listeners=new Map(),doc={activeElement:button,getSelection:()=>selection,addEventListener(type,fn,capture){listeners.set(type,{fn,capture});}};
installGameSelectionGuard(doc);assert.equal(clears,1,'Stray offline-notification selection is removed at installation');
for(const type of ['selectstart','contextmenu','dblclick','pointerdown'])assert(listeners.get(type).capture);
selection.isCollapsed=false;listeners.get('selectionchange').fn();assert.equal(clears,2);
selection.isCollapsed=false;listeners.get('pointerdown').fn({target:button});assert.equal(clears,3);
for(const field of [textarea,input,editChild]){
 selection.isCollapsed=false;selection.anchorNode=selection.focusNode=text(field);doc.activeElement=field;clearGameSelection(doc);assert.equal(clears,3,'Save and editable selections are preserved');
}
selection.anchorNode=text(toastCopy);selection.focusNode=text(footer);selection.isCollapsed=false;clearGameSelection(doc);assert.equal(clears,4,'A field retaining focus must not protect a stray game selection');
selection.anchorNode=selection.focusNode=domNode('body');selection.isCollapsed=false;doc.activeElement=textarea;clearGameSelection(doc);assert.equal(clears,4,'Native textarea selection reported at body remains available for copying');
// Only a purchased node gets the masked border; the old colored surface is absent.
const css=readFileSync('dist/style.css','utf8'),html=readFileSync('dist/index.html','utf8');
assert(css.includes('html,body,#game,#game *{-webkit-user-select:none;user-select:none;'));assert(css.includes('#game textarea'));
assert(!css.includes('opalFields'));assert(!css.includes('.node.opal:not(.ghost):not(.locked):before'));
const ring=css.match(/\.node\.opal\.bought>\.opal-border\{([^}]+)\}/)[1];
assert(ring.includes('mask-composite:exclude'));assert(ring.includes('-webkit-mask-composite:xor'));
assert(ring.includes('content-box'));assert(ring.includes('animation:opalBorderFlow 14s linear infinite'));
assert(ring.includes('animation-play-state:var(--opal-play-state,paused)'));
const stops=[...ring.matchAll(/(#[0-9a-f]{6}) (\d+)deg/g)].map(m=>({color:m[1],angle:Number(m[2])}));
assert(new Set(stops.map(s=>s.color)).size>=4);
assert.equal(stops[0].color,stops.at(-1).color,'The loop seam must blend back into the same color');
assert.equal(stops[0].angle,0);assert.equal(stops.at(-1).angle,360);
for(let i=1;i<stops.length;i++)assert(stops[i].angle-stops[i-1].angle>=45,'Broad transitions, no hard color steps');
assert(css.includes("@property --opal-angle{syntax:'<angle>';inherits:false;initial-value:0deg}"));
assert(css.includes('@keyframes opalBorderFlow{from{--opal-angle:0deg}to{--opal-angle:360deg}}'),'One positive turn, with no dwell keyframes');
const buy=css.match(/#buy\{([^}]+)\}/)[1];assert(buy.includes('background:var(--accent)'));assert(buy.includes('border:1px solid #b9f36d'));assert(buy.includes('color:#1c2b10'));
assert(css.includes('.cheat-badge{color:#f5d58b;font:inherit;letter-spacing:inherit}'));
assert(html.includes('<span class="network-meta"><span>RESEARCH NETWORK</span><span id="cheatBadge" class="cheat-badge" hidden>CHEAT</span></span>'));
console.log(JSON.stringify({opalVisibility:'passed',seaMotion:'passed',borderOnly:'passed',continuousClockwiseSpectrum:'passed',originalResearchButton:'passed',cheatMetadataAlignment:'passed',motionAndOSSettings:'passed',independentTouchPreference:'passed',backgroundPause:'passed',staticFallback:'passed',selectionProtection:'passed',saveInputsAndLinks:'preserved'}));
