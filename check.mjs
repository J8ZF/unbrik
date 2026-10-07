import assert from 'node:assert/strict';
import fs from 'node:fs';
import {NODES,byId,defaultState,unlocked,level,economy,cost,purchase,tick,validateSave,LEGACY_MAX} from './dist/data.js';
import {iconSvg,ICON_NAMES} from './dist/icons.js';
assert.equal(NODES.length,80);assert.equal(new Set(NODES.map(n=>n.id)).size,80);
let s=defaultState();assert.equal(economy(s).rate,1);tick(s,5);tick(s,5);assert.equal(s.currencies.money,10);assert(purchase(s,NODES[0]));assert.equal(economy(s).rate,2);assert.equal(s.currencies.money,0);assert(!purchase(s,NODES[0]));
s.currencies.money=1e200;assert(!unlocked(s,NODES[3]));assert(purchase(s,NODES[1]));assert(!unlocked(s,NODES[3]));assert(purchase(s,NODES[2]));assert(unlocked(s,NODES[3]));assert(purchase(s,NODES[1]));assert.equal(level(s,2),2);
for(const n of NODES){
 assert(n.baseCost>0&&Number.isFinite(n.baseCost));assert.equal(n.costs.length,n.max);
 for(let i=0;i<n.max;i++){assert(Number.isFinite(n.costs[i]));if(i)assert(n.costs[i]>n.costs[i-1]);}
 for(const r of n.req){assert(byId.has(r.id));assert(r.id<n.id);}
 assert(unlocked(s,n),`${n.name} unreachable`);if(!level(s,n))assert(purchase(s,n));
}
assert.equal(economy(s).count,80);assert(economy(s).auto);
const saved=JSON.parse(JSON.stringify(s));assert.deepEqual(validateSave(saved).levels,s.levels);
for(const corrupt of [{...saved,version:2},{...saved,contentVersion:99},{...saved,currencies:{money:-1}},{...saved,levels:{80:1}},{...saved,levels:{1:99}},{...saved,currencies:{money:NaN}}])assert.throws(()=>validateSave(corrupt));
const old=defaultState();old.contentVersion=2;old.currencies.money=123456;old.levels=Object.fromEntries(NODES.map(n=>[n.id,LEGACY_MAX[n.id]||1]));const migrated=validateSave(old);assert.equal(migrated.currencies.money,123456);for(const n of NODES){if(LEGACY_MAX[n.id])assert.equal(level(migrated,n),n.max);}assert.equal(level(migrated,31),11);assert.equal(level(migrated,50),6);assert.equal(migrated.contentVersion,3);
const before=s.stats.earned;s.timers.cache=0;const e=economy(s);for(let i=0;i<30;i++)tick(s,1);assert(s.stats.earned-before>e.rate*30*.999);s.settings.auto=true;const purchases=s.stats.purchases;for(let i=0;i<10;i++)tick(s,1);assert(s.stats.purchases>purchases);
for(const n of NODES){s.currencies.money=1e280;while(level(s,n)<n.max)assert(purchase(s,n));}assert(Number.isFinite(economy(s).rate));assert.equal(NODES.filter(n=>n.max>1).length,19);assert.equal(NODES.reduce((a,n)=>a+n.max,0),261);
assert.equal(ICON_NAMES.length,80);const icons=NODES.map(n=>iconSvg(n.id));assert.equal(new Set(icons).size,80);for(const svg of icons){assert(svg.includes('viewBox="0 0 24 24"'));assert(!/<text|<image|<foreignObject|href=/.test(svg));}assert(iconSvg(7).includes('10.5'),'PRODUCT uses embedded factory paths');
const html=fs.readFileSync('dist/index.html','utf8'),app=fs.readFileSync('dist/app.js','utf8'),css=fs.readFileSync('dist/style.css','utf8');const ids=[...html.matchAll(/\bid="([^"]+)"/g)].map(m=>m[1]);assert.equal(ids.length,new Set(ids).size);for(const match of app.matchAll(/\$\('([^']+)'\)/g))if(!match[1].endsWith('-'))assert(ids.includes(match[1]),`Missing ${match[1]}`);assert(!app.includes('.textContent=n.symbol'));assert(!html.includes('>Λ')&&!html.includes('>⏻'));assert(css.includes('.panel-symbol .glyph{width:30px;height:30px'));for(const ref of html.matchAll(/(?:src|href)="([^"?#]+)(?:\?[^"#]*)?"/g)){if(!/^(https?:|data:|#)/.test(ref[1]))assert(fs.existsSync('dist/'+ref[1]),`Missing ${ref[1]}`);}
console.log(JSON.stringify({checks:'passed',nodes:80,repeatables:19,totalLevels:261,uniqueFontFreeIcons:80,maxedRate:economy(s).rate}));
