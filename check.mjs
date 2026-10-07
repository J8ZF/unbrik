import assert from 'node:assert/strict';
import fs from 'node:fs';
import {NODES,byId,defaultState,unlocked,level,economy,cost,purchase,tick,validateSave,MAX_VALUE,affordable} from './dist/data.js';
import {iconSvg} from './dist/icons.js';
import {checkpointOffline,settleOffline,effectiveOfflineSeconds} from './dist/offline.js';
assert.equal(NODES.length,105);assert.equal(new Set(NODES.map(n=>n.id)).size,105);
assert.deepEqual(Array.from({length:8},(_,i)=>NODES.filter(n=>n.chapter===i).length),[8,12,14,13,14,14,15,15]);
assert.equal(NODES.reduce((a,n)=>a+n.max,0),316);assert.equal(NODES.at(-1).name,'AXIOM');
let s=defaultState();assert.deepEqual(economy(s).rates,{money:1,coin:0});tick(s,5);tick(s,5);assert.equal(s.currencies.money,10);assert(purchase(s,NODES[0]));assert.equal(economy(s).rate,2);assert.equal(s.currencies.money,0);assert(!purchase(s,NODES[0]));
for(const n of NODES){assert.equal(n.costs.length,n.max);assert(n.effects.length);assert(!n.effects.some(e=>e.type==='automation'||e.type==='power'));for(const p of n.costs)for(const k of n.payment)assert(Number.isFinite(p[k])&&p[k]>0);for(const r of n.req)assert(byId.has(r.id)&&r.id<n.id);}
const cheat=defaultState();cheat.settings.purchaseCheat=true;assert(!purchase(cheat,byId.get(22)));const zero={...cheat.currencies};
for(const n of NODES){assert(unlocked(cheat,n));assert(purchase(cheat,n));assert.deepEqual(cheat.currencies,zero);if(n.id===21)assert.equal(economy(cheat).coinRate,0);if(n.id===22)assert.equal(economy(cheat).coinRate,1);}
for(const n of NODES){while(level(cheat,n)<n.max)assert(purchase(cheat,n));assert(!purchase(cheat,n));}
assert.equal(cheat.stats.spent,0);assert.equal(cheat.stats.coinSpent,0);assert.equal(cheat.stats.purchases,316);assert(Number.isFinite(economy(cheat).rate));
assert.deepEqual(validateSave(JSON.parse(JSON.stringify(cheat))).levels,cheat.levels);
const dual=defaultState();dual.settings.purchaseCheat=true;for(const n of NODES.filter(n=>n.id<30))assert(purchase(dual,n));dual.settings.purchaseCheat=false;
// Either shortage aborts the complete transaction, including levels and stats.
for(const missing of ['money','coin']){dual.currencies={money:1e50,coin:1e50};dual.currencies[missing]=0;const before=structuredClone(dual);assert(!affordable(dual,byId.get(30)));assert(!purchase(dual,byId.get(30)));assert.deepEqual(dual,before);}
dual.currencies={money:1e20,coin:1e20};const prices=cost(dual,byId.get(30)),before={...dual.currencies};assert(purchase(dual,byId.get(30)));for(const k of ['money','coin'])assert.equal(dual.currencies[k],before[k]-prices[k]);
// Both cache amounts use the same pre-payment production snapshot.
const cache=structuredClone(cheat);cache.settings.purchaseCheat=false;cache.currencies={money:1e31,coin:1e15};cache.timers.cache=economy(cache).interval-.1;const e=economy(cache),old={...cache.currencies},event=tick(cache,.2)[0];assert(event&&event.money>0&&event.coin>0);assert.equal(event.money,e.rate*e.burst);assert.equal(event.coin,e.coinRate*e.coinBurst);
for(const k of ['money','coin'])assert.equal(cache.currencies[k],Math.min(MAX_VALUE,old[k]+e.rates[k]*.2+event[k]));
// Split offline settlements, reloads, and full settlement agree for both currencies.
const start=100000,whole=structuredClone(cache),split=structuredClone(cache);checkpointOffline(whole,start);checkpointOffline(split,start);const snapshot={...whole.offline};settleOffline(whole,start+7200000);for(let t=60;t<=7200;t+=60)settleOffline(split,start+t*1000);
for(const k of ['money','coin'])assert(Math.abs(whole.currencies[k]-split.currencies[k])/whole.currencies[k]<1e-12);assert.equal(settleOffline(whole,start+7200000).coin,0);assert.equal(settleOffline(validateSave(whole,start+7200000),start+7200000).amount,0);assert.equal(snapshot.coinRate,economy(cache).coinRate*(1+economy(cache).coinBurst/economy(cache).interval));assert(effectiveOfflineSeconds(86400)<=2400);
const saved=JSON.parse(JSON.stringify(cheat));for(const corrupt of [{...saved,version:1},{...saved,economyEpoch:'old'},{...saved,currencies:{money:-1,coin:0}},{...saved,levels:{105:1}},{...saved,levels:{1:99}},{...saved,currencies:{money:NaN,coin:0}},{...saved,currencies:{money:0,coin:Infinity}}])assert.throws(()=>validateSave(corrupt));
const icons=NODES.map(n=>iconSvg(n.icon));assert.equal(new Set(icons).size,105);for(const svg of icons){assert(svg.includes('viewBox="0 0 24 24"'));assert(!/<text|<image|<foreignObject|href=/.test(svg));assert.notEqual(svg,iconSvg('LockKeyhole'));}
const html=fs.readFileSync('dist/index.html','utf8'),app=fs.readFileSync('dist/app.js','utf8');const ids=[...html.matchAll(/\bid="([^"]+)"/g)].map(m=>m[1]);assert.equal(ids.length,new Set(ids).size);for(const match of app.matchAll(/\$\('([^']+)'\)/g))if(!match[1].endsWith('-'))assert(ids.includes(match[1]),`Missing ${match[1]}`);
for(const ref of html.matchAll(/(?:src|href)="([^"?#]+)(?:\?[^"#]*)?"/g))if(!/^(https?:|data:|#)/.test(ref[1]))assert(fs.existsSync('dist/'+ref[1]),`Missing ${ref[1]}`);
for(const [,name]of html.matchAll(/data-ui-icon="([^"]+)"/g))assert.notEqual(iconSvg(name),iconSvg('LockKeyhole'));
assert(!html.includes('id="progressBar"'));assert(!html.includes('coin-mark'));assert(html.includes('>¢</span>'));assert(!html.includes('autoSetting'));
console.log(JSON.stringify({economy:'passed',nodes:105,totalLevels:316,icons:105,dualCurrencyAtomicPurchase:'passed',coinUnlock:'1 per second',cacheSnapshot:'passed',offlineTwoCurrencies:'passed',saveEpoch:'passed',DOMReferences:'passed'}));
