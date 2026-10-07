import assert from 'node:assert/strict';
import {defaultState,validateSave,economy} from './dist/data.js';
import {offlineEfficiency,effectiveOfflineSeconds,checkpointOffline,settleOffline,productionSnapshot} from './dist/offline.js';
const near=(a,b)=>assert(Math.abs(a-b)<=Math.max(1,Math.abs(b))*1e-10,`${a} != ${b}`);
for(const seconds of [0,1,59,600,1799,1800])near(effectiveOfflineSeconds(seconds),seconds);
near(offlineEfficiency(1800),1);near(offlineEfficiency(2400),Math.exp(-1));near(offlineEfficiency(3600),Math.exp(-3));
assert(effectiveOfflineSeconds(1800)<effectiveOfflineSeconds(3600));assert(effectiveOfflineSeconds(3600)<effectiveOfflineSeconds(7200));assert(effectiveOfflineSeconds(7200)<2400);assert(offlineEfficiency(7200)>0);
near(effectiveOfflineSeconds(3600),1800+600*(1-Math.exp(-3)));
const start=100000;
const s=defaultState();s.currencies.money=0;checkpointOffline(s,start);const a=settleOffline(s,start+3600000);near(a.amount,effectiveOfflineSeconds(3600));near(s.stats.offlineSeconds,3600);near(s.stats.seconds,0);near(s.stats.earned,a.amount);assert.equal(settleOffline(s,start+3600000).amount,0);assert.equal(settleOffline(s,start+2000000).amount,0);
const chunked=defaultState();checkpointOffline(chunked,start);for(let t=10;t<=3600;t+=10)settleOffline(chunked,start+t*1000);near(chunked.currencies.money,s.currencies.money);near(chunked.stats.offlineEffectiveSeconds,s.stats.offlineEffectiveSeconds);
const recovered=validateSave(JSON.parse(JSON.stringify(chunked)),start+3600000);assert.equal(settleOffline(recovered,start+3600000).amount,0);near(settleOffline(recovered,start+7200000).amount,effectiveOfflineSeconds(7200)-effectiveOfflineSeconds(3600));
const preBoundary=defaultState();checkpointOffline(preBoundary,start);settleOffline(preBoundary,start+1799000);near(settleOffline(preBoundary,start+1801000).effectiveSeconds,1+600*(1-Math.exp(-1/600)));
const old=defaultState();old.contentVersion=2;old.savedAt=start;delete old.offline;delete old.stats.offlineEarned;delete old.stats.offlineSeconds;delete old.stats.offlineEffectiveSeconds;const oldRestored=validateSave(old,start+600000);near(settleOffline(oldRestored,start+600000).amount,600);
const invalid=JSON.parse(JSON.stringify(old));invalid.savedAt=1e18;invalid.offline={since:1e18,through:-1,rate:Infinity};const normalized=validateSave(invalid,start);assert.equal(settleOffline(normalized,start).amount,0);
const cache=defaultState();cache.levels={1:1,2:1,3:1,4:1,5:1,6:1,7:1,8:1,9:1,10:1,11:1,12:1,13:1};checkpointOffline(cache,start);const rate=productionSnapshot(cache);assert(rate>economy(cache).rate);near(settleOffline(cache,start+1800000).amount,rate*1800);assert.equal(cache.timers.cache,0);
console.log(JSON.stringify({checks:'passed',minutesOfFullProduction:{30:effectiveOfflineSeconds(1800)/60,60:effectiveOfflineSeconds(3600)/60,120:effectiveOfflineSeconds(7200)/60},duplicateAndSplitSettlement:'passed',legacySaves:'passed'}));
// Exercise the actual app's save/suspend/resume functions with a controlled
// clock and in-memory storage; no browser or alternate game implementation.
const {readFileSync}=await import('node:fs');
const app=readFileSync('dist/app.js','utf8');
const saveCode=app.slice(app.indexOf('function save('),app.indexOf('function discovery('));
const lifecycleCode=app.slice(app.indexOf('function suspend('),app.indexOf("document.addEventListener('visibilitychange'"));
const createSession=new Function('deps','initial','clock','storage',`
 const {format:unused,...helpers}=deps;
 let state=helpers.validateSave(initial,clock.now),suspended=true,lastFrame=0,gesture=null,storageOK=true;
 let camera=state.camera;const KEY='axiom-save-v1',BACKUP=KEY+'-backup';const document={hidden:false};const pointers=new Map();
 const Date={now:()=>clock.now},performance={now:()=>clock.now};
 const localStorage={getItem:k=>storage.get(k)||null,setItem:(k,v)=>storage.set(k,v)};
 const validateSave=s=>helpers.validateSave(s,clock.now),checkpointOffline=s=>helpers.checkpointOffline(s,clock.now),settleOffline=s=>helpers.settleOffline(s,clock.now);
 const el={};const $=()=>el;const toast=()=>{};const render=()=>{};const format=String,time=String;
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
const reload=createSession({validateSave,checkpointOffline,settleOffline},JSON.parse(storage.get('axiom-save-v1')),clock,storage);reload.resume();near(reload.state.currencies.money,paid);
console.log(JSON.stringify({appLifecycle:'passed',duplicatePagehide:'passed',hiddenSaveKeepsDecayOrigin:'passed',reloadDoesNotDoublePay:'passed'}));
