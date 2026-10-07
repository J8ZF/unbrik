import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createOpalMotion,preventGameSelection} from './dist/effects.js';
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
const icon=element();$('sectorMenu').children=Array.from({length:8},()=>({querySelector:()=>icon}));
const app=readFileSync('dist/app.js','utf8');
const actual=app.slice(app.indexOf('function syncOpalMotion(){'),app.indexOf('function renderChrome(){'));
const setup=new Function('createOpalMotion','NODES','defaultState','$','element',`
 let state=defaultState(),opalMotion=null,suspended=false,panelAnimation=null,cameraMoving=false,cameraIntent=null;
 const motionPreference={matches:false},document={hidden:false,body:element()},viewport=element();
 const nodeEls=new Map(NODES.map(n=>[n.id,element()])),sectorEls=Array.from({length:8},element);
 ${actual}
 setupOpalMotion();applySettings();
 return {state,nodeEls,sectorEls,viewport,body:document.body,controller:opalMotion,
 setting(k,v){state.settings[k]=v;applySettings();},osReduce(v){motionPreference.matches=v;applySettings();},
 hidden(v){document.hidden=v;syncOpalMotion();},suspend(v){suspended=v;syncOpalMotion();}};
`);
const ui=setup((groups,enabled)=>createOpalMotion(groups,enabled,Observer),NODES,defaultState,$,element);
assert.equal(observers.length,2);assert.equal(observers[0].options.root,ui.viewport);assert.equal(observers[1].options.root,null);
assert.equal(observers[0].targets.length,NODES.filter(n=>n.chapter===7).length+2);
const node=ui.nodeEls.get(71),offscreen=ui.nodeEls.get(72),status=el=>el.style['--opal-play-state'];
assert.equal(status(node),'paused');observers[0].emit(node,true);assert.equal(status(node),'running');assert.equal(status(offscreen),'paused');
ui.setting('touch',false);assert.equal(status(node),'running','Touch toggle must remain independent of ambient motion');
ui.setting('motion',false);assert.equal(status(node),'paused');assert(ui.body.classList.contains('reduced-motion'));assert(!$('motion').checked);
ui.setting('motion',true);assert.equal(status(node),'running');ui.osReduce(true);assert.equal(status(node),'paused');assert($('motion').checked);ui.osReduce(false);assert.equal(status(node),'running');
ui.hidden(true);assert.equal(status(node),'paused');assert(ui.body.classList.contains('effects-paused'));ui.hidden(false);assert.equal(status(node),'running');
ui.suspend(true);assert.equal(status(node),'paused');ui.suspend(false);assert.equal(status(node),'running');
observers[0].emit(node,false);assert.equal(status(node),'paused');ui.setting('motion',false);ui.setting('motion',true);assert.equal(status(node),'paused','Restoring motion must not restart offscreen effects');
observers[1].emit(icon,true);assert.equal(status(icon),'running');observers[1].emit(icon,false);assert.equal(status(icon),'paused');
ui.controller.disconnect();assert(observers.every(o=>o.disconnected));assert.equal(status(node),'paused');
const staticTarget=element();createOpalMotion([{root:null,elements:[staticTarget]}],()=>true,null);assert.equal(status(staticTarget),'paused');

for(const type of ['selectstart','contextmenu']){
 for(const scope of ['#hud','#viewport','#nodePanel','#sectorDialog','button']){
  let prevented=false;preventGameSelection({type,target:{closest:s=>s.split(',').includes(scope)?{}:null},preventDefault(){prevented=true;}});assert(prevented,scope);
 }
 for(const scope of ['input','textarea','select','[contenteditable="true"]','a']){
  let prevented=false;preventGameSelection({type,target:{closest:s=>s.split(',').includes(scope)||s.includes('#hud')?{}:null},preventDefault(){prevented=true;}});assert(!prevented,scope);
 }
 let prevented=false;preventGameSelection({type,target:{closest:()=>null},preventDefault(){prevented=true;}});assert(!prevented);
}
console.log(JSON.stringify({opalVisibility:'passed',motionAndOSSettings:'passed',independentTouchPreference:'passed',backgroundPause:'passed',staticFallback:'passed',selectionProtection:'passed',saveInputsAndLinks:'preserved'}));
