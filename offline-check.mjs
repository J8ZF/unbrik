import assert from 'node:assert/strict';
import {defaultState,validateSave,economy,Big,NODES} from './dist/data.js';
globalThis.BIG_STRICT=true;
const N=v=>Big.from(v).toNumber();
import {offlineEfficiency,effectiveOfflineSeconds,checkpointOffline,settleOffline,productionSnapshot} from './dist/offline.js';
const near=(a,b)=>{a=N(a);b=N(b);assert(Math.abs(a-b)<=Math.max(1,Math.abs(b))*1e-10,`${a} != ${b}`);};
for(const seconds of [0,1,59,600,1799,1800])near(effectiveOfflineSeconds(seconds),seconds);
near(offlineEfficiency(1800),1);near(offlineEfficiency(2400),Math.exp(-1));near(offlineEfficiency(3600),Math.exp(-3));
assert(effectiveOfflineSeconds(1800)<effectiveOfflineSeconds(3600));assert(effectiveOfflineSeconds(3600)<effectiveOfflineSeconds(7200));assert(effectiveOfflineSeconds(7200)<2400);assert(offlineEfficiency(7200)>0);
near(effectiveOfflineSeconds(3600),1800+600*(1-Math.exp(-3)));
const start=100000;
const s=defaultState();s.currencies.money=0;checkpointOffline(s,start);const a=settleOffline(s,start+3600000);near(a.amount,effectiveOfflineSeconds(3600));near(s.stats.offlineSeconds,3600);near(s.stats.seconds,0);near(s.stats.earned,a.amount);assert.equal(N(settleOffline(s,start+3600000).amount),0);assert.equal(N(settleOffline(s,start+2000000).amount),0);
const chunked=defaultState();checkpointOffline(chunked,start);for(let t=10;t<=3600;t+=10)settleOffline(chunked,start+t*1000);near(chunked.currencies.money,s.currencies.money);near(chunked.stats.offlineEffectiveSeconds,s.stats.offlineEffectiveSeconds);
const recovered=validateSave(JSON.parse(JSON.stringify(chunked)),start+3600000);assert.equal(N(settleOffline(recovered,start+3600000).amount),0);near(settleOffline(recovered,start+7200000).amount,effectiveOfflineSeconds(7200)-effectiveOfflineSeconds(3600));
const preBoundary=defaultState();checkpointOffline(preBoundary,start);settleOffline(preBoundary,start+1799000);near(settleOffline(preBoundary,start+1801000).effectiveSeconds,1+600*(1-Math.exp(-1/600)));
const CACHE=NODES.find(n=>n.effects.some(e=>e.type==='cache'));const cache=defaultState();cache.levels=Object.fromEntries([...Array.from({length:22},(_,i)=>i+1),CACHE.id].map(id=>[id,1]));checkpointOffline(cache,start);const rate=productionSnapshot(cache);assert(rate.gt(economy(cache).rate));near(settleOffline(cache,start+1800000).amount,N(rate)*1800);assert.equal(cache.timers.cache,0);
console.log(JSON.stringify({checks:'passed',minutesOfFullProduction:{30:effectiveOfflineSeconds(1800)/60,60:effectiveOfflineSeconds(3600)/60,120:effectiveOfflineSeconds(7200)/60},duplicateAndSplitSettlement:'passed',version2Saves:'passed'}));
// Exercise the actual app's save/suspend/resume functions with a controlled
// clock and in-memory storage; no browser or alternate game implementation.
const {readFileSync}=await import('node:fs');
const app=readFileSync('dist/app.js','utf8');
const saveCode=app.slice(app.indexOf('function save('),app.indexOf('function discovery('));
const lifecycleCode=app.slice(app.indexOf('function suspend('),app.indexOf("document.addEventListener('visibilitychange'"));
const createSession=new Function('deps','initial','clock','storage',`
 const {format:unused,...helpers}=deps;
 let state=helpers.validateSave(initial,clock.now),suspended=true,lastFrame=0,gesture=null,storageOK=true,cacheReward={};
 let camera=state.camera;const KEY='unbrik-save-v2',BACKUP=KEY+'-backup';const document={hidden:false};const pointers=new Map();
 const Date={now:()=>clock.now},performance={now:()=>clock.now};
 const localStorage={getItem:k=>storage.get(k)||null,setItem:(k,v)=>storage.set(k,v)};
 const validateSave=s=>helpers.validateSave(s,clock.now),checkpointOffline=s=>helpers.checkpointOffline(s,clock.now),settleOffline=s=>helpers.settleOffline(s,clock.now);
 const syncOpalMotion=()=>{},applySettings=()=>{},renderCacheHud=()=>{};const el={};const $=()=>el;const toast=()=>{};const render=()=>{};const format=String,time=String,priceText=p=>Object.entries(p).map(([k,v])=>k+String(v)).join(' / ');
 ${saveCode}\n${lifecycleCode}
 return {resume,suspend,save,get state(){return state},get suspended(){return suspended},set hidden(v){document.hidden=v}};
`);
const clock={now:start},storage=new Map();const first=defaultState();checkpointOffline(first,start);first.savedAt=start;
const session=createSession({validateSave,checkpointOffline,settleOffline},first,clock,storage);session.resume();near(session.state.currencies.money,0);
clock.now=start+1000;session.hidden=true;session.suspend();const since=session.state.offline.since;
clock.now+=60000;session.suspend();assert.equal(session.state.offline.since,since);
clock.now=since+1800000;session.save();assert.equal(session.state.offline.since,since);
clock.now=since+3600000;session.hidden=false;session.resume();near(session.state.currencies.money,effectiveOfflineSeconds(3600));const paid=session.state.currencies.money;
session.resume();near(session.state.currencies.money,paid);
const reload=createSession({validateSave,checkpointOffline,settleOffline},JSON.parse(storage.get('unbrik-save-v2')),clock,storage);reload.resume();near(reload.state.currencies.money,paid);
console.log(JSON.stringify({appLifecycle:'passed',duplicatePagehide:'passed',hiddenSaveKeepsDecayOrigin:'passed',reloadDoesNotDoublePay:'passed'}));
