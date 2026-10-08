import assert from 'node:assert/strict';
import fs from 'node:fs';
import {NODES,byId,defaultState,unlocked,level,economy,cost,purchase,tick,validateSave,affordable,prestige,tokensFor,PRESTIGE_THRESHOLD,Big} from './dist/data.js';
// Amounts are Big values; any implicit numeric use of one (big > 0) throws here.
globalThis.BIG_STRICT=true;
const N=v=>Big.from(v).toNumber(),Ns=o=>Object.fromEntries(Object.entries(o).map(([k,v])=>[k,N(v)]));
// Deep copy that keeps Big values (they are immutable) instead of flattening them.
const clone=o=>o instanceof Big?o:Array.isArray(o)?o.map(clone):o&&typeof o==='object'?Object.fromEntries(Object.entries(o).map(([k,v])=>[k,clone(v)])):o;
import {iconSvg} from './dist/icons.js';
import {checkpointOffline,settleOffline,effectiveOfflineSeconds} from './dist/offline.js';
assert.equal(NODES.length,105);assert.equal(new Set(NODES.map(n=>n.id)).size,105);
assert.deepEqual(Array.from({length:8},(_,i)=>NODES.filter(n=>n.chapter===i).length),[8,12,14,13,14,14,15,15]);
assert.equal(NODES.reduce((a,n)=>a+n.max,0),316);assert.equal(NODES.at(-1).name,'AXIOM');
let s=defaultState();assert.deepEqual(Ns(economy(s).rates),{money:1,coin:0});tick(s,5);tick(s,5);assert.equal(N(s.currencies.money),10);assert(purchase(s,NODES[0]));assert.equal(N(economy(s).rate),2);assert.equal(N(s.currencies.money),0);assert(!purchase(s,NODES[0]));
for(const n of NODES){assert.equal(n.costs.length,n.max);assert(n.effects.length);assert(!n.effects.some(e=>e.type==='automation'||e.type==='power'));for(const p of n.costs)for(const k of n.payment)assert(Number.isFinite(p[k])&&p[k]>0);for(const r of n.req)assert(byId.has(r.id)&&r.id<n.id);}
const cheat=defaultState();cheat.settings.purchaseCheat=true;assert(!purchase(cheat,byId.get(22)));const zero={...cheat.currencies};
for(const n of NODES){assert(unlocked(cheat,n));assert(purchase(cheat,n));assert.deepEqual(cheat.currencies,zero);if(n.id===21)assert.equal(N(economy(cheat).coinRate),0);if(n.id===22)assert.equal(N(economy(cheat).coinRate),1);}
for(const n of NODES){while(level(cheat,n)<n.max)assert(purchase(cheat,n));assert(!purchase(cheat,n));}
assert.equal(N(cheat.stats.spent),0);assert.equal(N(cheat.stats.coinSpent),0);assert.equal(cheat.stats.purchases,316);assert(Number.isFinite(N(economy(cheat).rate)));
assert.deepEqual(validateSave(JSON.parse(JSON.stringify(cheat))).levels,cheat.levels);
const dual=defaultState();dual.settings.purchaseCheat=true;for(const n of NODES.filter(n=>n.id<30))assert(purchase(dual,n));dual.settings.purchaseCheat=false;
// Either shortage aborts the complete transaction, including levels and stats.
for(const missing of ['money','coin']){dual.currencies={money:1e50,coin:1e50};dual.currencies[missing]=0;const before=JSON.stringify(dual);assert(!affordable(dual,byId.get(30)));assert(!purchase(dual,byId.get(30)));assert.equal(JSON.stringify(dual),before);}
dual.currencies={money:1e20,coin:1e20};const prices=cost(dual,byId.get(30)),before={...dual.currencies};assert(purchase(dual,byId.get(30)));for(const k of ['money','coin'])assert.equal(N(dual.currencies[k]),before[k]-N(prices[k]));
// Both cache amounts use the same pre-payment production snapshot.
const cache=clone(cheat);cache.settings.purchaseCheat=false;cache.currencies={money:1e31,coin:1e15};cache.timers.cache=economy(cache).interval-.1;const e=economy(cache),old={...cache.currencies},event=tick(cache,.2)[0];assert(event&&event.money.gt(0)&&event.coin.gt(0));assert.equal(N(event.money),N(e.rate)*e.burst);assert.equal(N(event.coin),N(e.coinRate)*e.coinBurst);
for(const k of ['money','coin'])assert.equal(N(cache.currencies[k]),old[k]+N(e.rates[k])*.2+N(event[k]));
// Split offline settlements, reloads, and full settlement agree for both currencies.
const start=100000,whole=clone(cache),split=clone(cache);checkpointOffline(whole,start);checkpointOffline(split,start);const snapshot={...whole.offline};settleOffline(whole,start+7200000);for(let t=60;t<=7200;t+=60)settleOffline(split,start+t*1000);
for(const k of ['money','coin'])assert(Math.abs(N(whole.currencies[k])-N(split.currencies[k]))/N(whole.currencies[k])<1e-12);assert.equal(N(settleOffline(whole,start+7200000).coin),0);assert.equal(N(settleOffline(validateSave(JSON.parse(JSON.stringify(whole)),start+7200000),start+7200000).amount),0);assert.equal(N(snapshot.coinRate),N(economy(cache).coinRate)*(1+economy(cache).coinBurst/economy(cache).interval));assert(effectiveOfflineSeconds(86400)<=2400);
const saved=JSON.parse(JSON.stringify(cheat));for(const corrupt of [{...saved,version:1},{...saved,economyEpoch:'old'},{...saved,currencies:{money:-1,coin:0}},{...saved,levels:{105:1}},{...saved,levels:{1:99}},{...saved,currencies:{money:NaN,coin:0}},{...saved,currencies:{money:0,coin:Infinity}}])assert.throws(()=>validateSave(corrupt));
const icons=NODES.map(n=>iconSvg(n.icon));assert.equal(new Set(icons).size,105);for(const svg of icons){assert(svg.includes('viewBox="0 0 24 24"'));assert(!/<text|<image|<foreignObject|href=/.test(svg));assert.notEqual(svg,iconSvg('LockKeyhole'));}
const html=fs.readFileSync('dist/index.html','utf8'),app=fs.readFileSync('dist/app.js','utf8');const ids=[...html.matchAll(/(?<![\w-])id="([^"]+)"/g)].map(m=>m[1]);assert.equal(ids.length,new Set(ids).size);for(const match of app.matchAll(/\$\('([^']+)'\)/g))if(!match[1].endsWith('-'))assert(ids.includes(match[1]),`Missing ${match[1]}`);
for(const ref of html.matchAll(/(?:src|href)="([^"?#]+)(?:\?[^"#]*)?"/g))if(!/^(https?:|data:|#)/.test(ref[1]))assert(fs.existsSync('dist/'+ref[1]),`Missing ${ref[1]}`);
for(const [,name]of html.matchAll(/data-ui-icon="([^"]+)"/g))assert.notEqual(iconSvg(name),iconSvg('LockKeyhole'));
assert(!html.includes('id="progressBar"'));assert(!html.includes('coin-mark'));assert(html.includes('>¢</span>'));assert(!html.includes('autoSetting'));
// Named units (default notation): K … Dc, UDc, DDc, TDc … Vg … Ce (1e303).
{const u=await import('./dist/units.js');const S=u.UNIT_SUFFIXES;
 assert.equal(S.length,102);assert.deepEqual(S.slice(1,12),['K','M','B','T','Qa','Qi','Sx','Sp','Oc','No','Dc']);
 assert.deepEqual([S[12],S[13],S[14],S[15],S[20],S[21],S[22],S[31],S[100],S[101]],['UDc','DDc','TDc','QaDc','NoDc','Vg','UVg','Tg','NoNog','Ce']);
 assert.equal(new Set(S).size,S.length,'Every unit is distinct');
 for(const [n,full,compact]of [[1234,'1.23K','1.23K'],[5e33,'5Dc','5.00Dc'],[1.89e36,'1.89UDc','1.89UDc'],[1e39,'1DDc','1.00DDc'],[4.2e40,'42DDc','42.0DDc'],[1e63,'1Vg','1.00Vg'],[1e303,'1Ce','1.00Ce']]){assert.equal(u.formatNamed(n),full);assert.equal(u.compactNamed(n,3),compact);}
 for(let e=3;e<303;e++)for(const f of [1,9.99,999.99]){const m=u.formatNamed(f*10**e).match(/^([0-9.]+)[A-Za-z]+$/);assert(m&&+m[1]>=1&&+m[1]<1000,`${f}e${e}`);}
 assert.equal(defaultState().settings.format,'named','Named units are the default');
 const old=defaultState();old.settings.format='short';delete old.settings.formatV2;assert.equal(validateSave(JSON.parse(JSON.stringify(old))).settings.format,'named','Old default saves move to named units once');
 const chosen=defaultState();chosen.settings.format='short';assert.equal(validateSave(JSON.parse(JSON.stringify(chosen))).settings.format,'short','Choosing short again sticks');
 const sci=defaultState();sci.settings.format='scientific';delete sci.settings.formatV2;assert.equal(validateSave(JSON.parse(JSON.stringify(sci))).settings.format,'scientific');}
// Big numbers: no cap at 1e100 or at the double limit (~1.8e308).
{const B=Big.from,u=await import('./dist/units.js');
 assert.equal(String(B('1e308').mul(1000)),'1e311');assert.equal(N(B('1e308').mul(1000)),Infinity);
 assert(B('2e400').gt('1.9e400')&&B('1e400').gt(1e300)&&B(-5).lt('1e400')&&B('-1e400').lt('-9e399'));
 assert.equal(String(B('2e400').add('3e399')),'2.3e400');assert(B('1e400').add(1).eq('1e400'));assert(B('5e400').sub('5e400').isZero());
 assert.equal(String(B('1e800').sqrt()),'1e400');assert.equal(String(B(10).pow(500)),'1e500');assert.equal(B('1e293910').log10(),293910);
 assert(B('1e400').div('1e399').eq(10));assert.equal(N(B(0.1).add(0.2)),0.1+0.2,'Below 1e300 a Big computes exactly like a double');
 // Saves: plain numbers while they fit, strings above, both read back.
 assert.equal(JSON.stringify({a:B(12.5),b:B('1.5e400')}),'{"a":12.5,"b":"1.5e400"}');
 for(const v of ['1.5e400','1e+293910','9.99e305',123,0])assert(Big.parse(JSON.parse(JSON.stringify(B(v)))).eq(B(v)));
 for(const bad of ['abc','-1e400','1e99999999999999999999',NaN,Infinity,null,{}])assert.equal(Big.parse(bad)?.sign>=0?'ok':'rejected','rejected');
 // A save past the old cap and past the double limit loads, ticks, buys and saves again.
 const huge=defaultState();for(const n of NODES)huge.levels[n.id]=n.max;huge.currencies.money=B('1.5e400');huge.currencies.coin=B('2e350');huge.stats.earned=B('3e400');
 const loaded=validateSave(JSON.parse(JSON.stringify(huge)));assert(loaded.currencies.money.eq('1.5e400')&&loaded.currencies.coin.eq('2e350')&&loaded.stats.earned.eq('3e400'));
 assert(Number.isFinite(economy(loaded).rate.log10()),'Balance-based bonuses stay finite with a huge balance');
 tick(loaded,1);assert(loaded.currencies.money.gte('1.5e400')&&loaded.stats.earned.gte('3e400'));
 const small=defaultState();small.currencies.money=1e200;assert(validateSave(JSON.parse(JSON.stringify(small))).currencies.money.eq(1e200),'1e100 is no longer a ceiling');
 // A 3.0.9 save (plain numbers everywhere) reads as Big values.
 const old=JSON.parse(JSON.stringify(defaultState()));old.currencies.money=4.2e40;old.stats.earned=5e40;const oldLoaded=validateSave(old);assert(oldLoaded.currencies.money instanceof Big&&oldLoaded.currencies.money.eq(4.2e40)&&oldLoaded.stats.earned.eq(5e40));
 // Prestige with an astronomical balance: tokens = 10 · √(balance / threshold).
 assert(tokensFor(loaded,B(PRESTIGE_THRESHOLD).mul('1e1000')).eq('1e501'));
 const rich=validateSave(JSON.parse(JSON.stringify(huge)));rich.currencies.money=B(PRESTIGE_THRESHOLD).mul('1e800');const granted=prestige(rich,1000);
 assert(granted.eq('1e401')&&rich.currencies.token.eq('1e401')&&rich.prestige.last.money.gt('1e800'));
 const reborn=validateSave(JSON.parse(JSON.stringify(rich)));assert(reborn.currencies.token.eq('1e401')&&reborn.prestige.tokensEarned.eq('1e401'));
 // Display: named units through Ce (1e303), then the exponent.
 const f=v=>u.formatNamed(B(v)),c=v=>u.compactNamed(B(v),3);
 assert.deepEqual(['1e303','9.99e305','1e306','1.5e400','1e293910'].map(f),['1Ce','999Ce','1.00e306','1.50e400','1.00e293910']);
 assert.deepEqual(['1e303','1.234e293910','4.2e40'].map(c),['1.00Ce','1.23e293910','42.0DDc']);
 assert.deepEqual(['short','scientific','engineering'].map(m=>u.formatNumber(B('1.5e400'),m)),['1.50e400','1.50e400','15.00e399']);
 assert.deepEqual(['short','scientific','engineering'].map(m=>u.compactNumber(B('1.5e400'),m,3)),['1.50e400','1.50e400','15.0e399']);
 for(let e=300;e<=320;e++){const text=f(`1.234e${e}`);assert(e<306?/^[0-9.]+(Ce|[A-Za-z]+)$/.test(text):text===`1.23e${e}`,text);}
}
console.log(JSON.stringify({economy:'passed',nodes:105,totalLevels:316,icons:105,dualCurrencyAtomicPurchase:'passed',coinUnlock:'1 per second',cacheSnapshot:'passed',offlineTwoCurrencies:'passed',saveEpoch:'passed',DOMReferences:'passed',bigNumbers:'passed'}));
