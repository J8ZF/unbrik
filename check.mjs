import assert from 'node:assert/strict';
import fs from 'node:fs';
import {NODES,byId,defaultState,unlocked,level,economy,cost,purchase,tick,validateSave} from './dist/data.js';
assert.equal(NODES.length,80);assert.equal(new Set(NODES.map(n=>n.id)).size,80);
let s=defaultState();assert.equal(economy(s).rate,1);tick(s,5);tick(s,5);assert.equal(s.currencies.money,10);assert(purchase(s,NODES[0]));assert.equal(economy(s).rate,2);assert.equal(s.currencies.money,0);assert.equal(purchase(s,NODES[0]),false);
s.currencies.money=1e200;assert(!unlocked(s,NODES[3]));assert(purchase(s,NODES[1]));assert(!unlocked(s,NODES[3]));assert(purchase(s,NODES[2]));assert(unlocked(s,NODES[3]));assert.equal(level(s,NODES[1]),1);assert(purchase(s,NODES[1]));assert.equal(level(s,NODES[1]),2);
for(const n of NODES){assert(n.baseCost>0&&Number.isFinite(n.baseCost));for(const r of n.req){assert(byId.has(r.id));assert(r.id<n.id,'Graph must be acyclic');}assert(unlocked(s,n),`${n.name} unreachable`);if(!level(s,n))assert(purchase(s,n));}
assert.equal(economy(s).count,80);assert(economy(s).auto);assert(Number.isFinite(economy(s).rate));
const saved=JSON.parse(JSON.stringify(s));assert.deepEqual(validateSave(saved).levels,s.levels);
for(const corrupt of [{...saved,version:2},{...saved,currencies:{money:-1}},{...saved,levels:{80:1}},{...saved,levels:{1:99}},{...saved,currencies:{money:NaN}}])assert.throws(()=>validateSave(corrupt));
const before=s.stats.earned, money=s.currencies.money;s.timers.cache=0;const e=economy(s);for(let t=0;t<30;t++)tick(s,1);assert(s.stats.earned-before>e.rate*30*.999);assert(s.currencies.money>=money);
s.settings.auto=true;const purchases=s.stats.purchases;for(let t=0;t<10;t++)tick(s,1);assert(s.stats.purchases>purchases);
for(const n of NODES){s.currencies.money=1e280;while(level(s,n)<n.max)assert(purchase(s,n));}assert.equal(NODES.filter(n=>n.max>1).length,17);assert(Number.isFinite(economy(s).rate));
const initial=defaultState();const firstOnly={seconds:0,finalRate:0};for(const n of NODES){const ec=economy(initial);const wait=cost(initial,n)/ec.rate;firstOnly.seconds+=wait;initial.currencies.money=cost(initial,n);assert(purchase(initial,n));}firstOnly.finalRate=economy(initial).rate;
const simulation=defaultState();let elapsed=0,buys=0;while(economy(simulation).count<80&&elapsed<60*60*24*10){tick(simulation,5);elapsed+=5;for(let p=0;p<3;p++){const ec=economy(simulation);const candidates=NODES.filter(n=>unlocked(simulation,n)&&level(simulation,n)<n.max).sort((a,b)=>cost(simulation,a,ec)-cost(simulation,b,ec));if(candidates[0]&&purchase(simulation,candidates[0]))buys++;else break;}}
assert.equal(economy(simulation).count,80,'Progression should reach 80 nodes');
for(const file of ['dist/index.html','dist/style.css','dist/data.js','dist/app.js'])assert(fs.statSync(file).size>100);
const html=fs.readFileSync('dist/index.html','utf8'), app=fs.readFileSync('dist/app.js','utf8');const ids=[...html.matchAll(/\bid="([^"]+)"/g)].map(m=>m[1]);assert.equal(ids.length,new Set(ids).size,'duplicate DOM ID');for(const match of app.matchAll(/\$\('([^']+)'\)/g))if(!match[1].endsWith('-'))assert(ids.includes(match[1]),`Missing DOM id ${match[1]}`);
console.log(JSON.stringify({checks:'passed',nodes:80,repeatables:NODES.filter(n=>n.max>1).length,totalLevels:NODES.reduce((a,n)=>a+n.max,0),firstLevelOnlyHours:Math.round(firstOnly.seconds/3600*10)/10,greedyHours:Math.round(elapsed/3600*10)/10,greedyPurchases:buys,finalRate:firstOnly.finalRate,maxedRate:economy(s).rate},null,2));
