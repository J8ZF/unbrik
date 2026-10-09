import assert from 'node:assert/strict';
import {NODES,defaultState,economy,level,unlocked,purchase,tick,validateSave,treeComplete,prestigeReady,prestige,tokensFor,autoResearch,prestigeBonuses,PRESTIGE_THRESHOLD,CURRENCY_DEFS,MAPS,currentMap,sectorProgress,Big} from './dist/data.js';
globalThis.BIG_STRICT=true;
const N=v=>Big.from(v).toNumber();
import {PRESTIGE_NODES,PRESTIGE_BRANCHES,PETAL_ROWS,PRESTIGE_LAYOUT,prestigeById,prestigeLevel,prestigeUnlocked,prestigeCost,prestigeAffordable,prestigePurchase,petalProgress} from './dist/prestige.js';
import {offlineParams,checkpointOffline,settleOffline,OFFLINE_FULL_SECONDS,OFFLINE_DECAY_SECONDS} from './dist/offline.js';
// Node table: five sectors of 6–10 nodes, matching cost tables, non-crossing flows, distinct names and icons.
assert.equal(PRESTIGE_BRANCHES.length,5);
for(let b=0;b<5;b++){const members=PRESTIGE_NODES.filter(n=>n.branch===b);assert(members.length>=6&&members.length<=10,`Petal ${b+1} has ${members.length} nodes`);assert.equal(members.length,PETAL_ROWS[b].reduce((a,x)=>a+x,0));assert.equal(members[0].row,0);assert(members.at(-1).gate);}
assert.equal(new Set(PRESTIGE_NODES.map(n=>n.name)).size,PRESTIGE_NODES.length,'Prestige names are distinct');
// Icons: every prestige study has its own icon, none reused from a mainland study or the interface.
{const {iconSvg}=await import('./dist/icons.js');const fs=await import('node:fs');const lock=iconSvg('LockKeyhole');
 const taken=new Set(NODES.map(n=>iconSvg(n.icon)));for(const [,name]of fs.readFileSync('dist/index.html','utf8').matchAll(/data-ui-icon="([^"]+)"/g))taken.add(iconSvg(name));
 for(const name of ['Check','Circle','LockKeyhole','X','ChevronRight','Flower','brand'])taken.add(iconSvg(name));
 const mine=PRESTIGE_NODES.map(n=>iconSvg(n.icon));assert.equal(new Set(mine).size,PRESTIGE_NODES.length,'Prestige icons are distinct');
 for(const [i,svg]of mine.entries()){assert.notEqual(svg,lock,`${PRESTIGE_NODES[i].name} icon exists`);assert(!taken.has(svg),`${PRESTIGE_NODES[i].name} reuses an icon`);}}
for(const n of PRESTIGE_NODES){
 assert(n.id>=1001&&!NODES.some(m=>m.id===n.id),'Prestige ids never collide with studies');
 assert.equal(n.cost.length,n.max);assert(n.cost.every((c,i)=>Number.isInteger(c)&&c>=1&&(i===0||c>n.cost[i-1])),`${n.name} costs rise per level`);
 for(const r of n.req){const p=prestigeById.get(r.id);assert(p&&p.branch===n.branch&&p.row===n.row-1,`${n.name} depends on the row directly upstream`);}
 if(n.row===0)assert.equal(n.req.length,0);
}
for(let b=0;b<5;b++){const rows=PETAL_ROWS[b];for(let r=1;r<rows.length;r++){const row=PRESTIGE_NODES.filter(n=>n.branch===b&&n.row===r);for(const a of row)for(const c of row)if(a.column<c.column)for(const ra of a.req)for(const rc of c.req)assert(prestigeById.get(ra.id).column<=prestigeById.get(rc.id).column,'Petal links never cross');}}
assert(PRESTIGE_NODES.some(n=>n.max>1),'Some prestige nodes are upgradeable');
assert.equal(PRESTIGE_NODES.filter(n=>n.effect.type==='auto').length,8,'One automation node per mainland sector');
assert.deepEqual([...new Set(PRESTIGE_NODES.filter(n=>n.effect.type==='auto').map(n=>n.effect.value))].sort(),[0,1,2,3,4,5,6,7]);
// Layout: five petal lobes; every card inside its own petal, none inside another.
const inside=(point,polygon)=>{let hit=false;for(let i=0,j=polygon.length-1;i<polygon.length;j=i++){const a=polygon[i],b=polygon[j];if((a.y>point.y)!==(b.y>point.y)&&point.x<(b.x-a.x)*(point.y-a.y)/(b.y-a.y)+a.x)hit=!hit;}return hit;};
for(let i=0;i<PRESTIGE_NODES.length;i++)for(let j=i+1;j<PRESTIGE_NODES.length;j++){const a=PRESTIGE_NODES[i],b=PRESTIGE_NODES[j];assert(Math.abs(a.x-b.x)>=158||Math.abs(a.y-b.y)>=130,`Prestige cards overlap: ${a.name}, ${b.name}`);}
const shared=(a,b)=>a.polygon.filter(p=>b.polygon.some(q=>Math.abs(p.x-q.x)<.5&&Math.abs(p.y-q.y)<.5)).length;
const adjacency=PRESTIGE_LAYOUT.petals.map(()=>new Set());
for(const petal of PRESTIGE_LAYOUT.petals){
 assert.equal(petal.loops,1,`Petal ${petal.branch+1} is one piece`);
 for(const n of petal.members)for(const dx of [-73,73])for(const dy of [-59,59])assert(inside({x:n.x+dx,y:n.y+dy},petal.polygon),`${n.name} leaves its petal`);
 for(const other of PRESTIGE_LAYOUT.petals)if(other!==petal){for(const n of other.members)assert(!inside({x:n.x,y:n.y},petal.polygon));if(shared(petal,other)>=2){adjacency[petal.branch].add(other.branch);adjacency[other.branch].add(petal.branch);}}
 for(const other of PRESTIGE_LAYOUT.petals)assert(!inside(petal.label,other.polygon),'Petal headings are off the land');
}
// Petals are separate lobes around a bare pentagon center: no shared coast,
// a clear gap between neighbors, and each lobe starts near the center.
{const gap=(a,b)=>Math.min(...a.polygon.flatMap(p=>b.polygon.map(q=>Math.hypot(p.x-q.x,p.y-q.y))));
 for(const petal of PRESTIGE_LAYOUT.petals){assert.equal(adjacency[petal.branch].size,0,'Lobes do not touch');
  const near=Math.min(...petal.polygon.map(p=>Math.hypot(p.x,p.y)));assert(near>160&&near<340,`Petal ${petal.branch+1} starts just outside the center (${Math.round(near)})`);
  for(const other of PRESTIGE_LAYOUT.petals)if(other!==petal)assert(gap(petal,other)>=100,`Petals ${petal.branch+1}/${other.branch+1} keep a gap`);}}

// Currency, maps and a fresh state.
assert.equal(CURRENCY_DEFS.token.symbol,'✿');assert.equal(MAPS[1].id,'prestige');
let s=defaultState();assert.equal(N(s.currencies.token),0);assert.equal(s.prestige.count,0);assert(MAPS[1].locked(s));assert(!CURRENCY_DEFS.token.shown(s,economy(s)));
assert.equal(currentMap(s).id,'main');
// Tokens: nothing below the threshold, ten at it, square-root growth above it.
assert.equal(N(tokensFor(s,PRESTIGE_THRESHOLD*.999)),0);assert.equal(N(tokensFor(s,PRESTIGE_THRESHOLD)),10);assert.equal(N(tokensFor(s,PRESTIGE_THRESHOLD*4)),20);assert.equal(N(tokensFor(s,PRESTIGE_THRESHOLD*100)),100);assert.equal(N(tokensFor(s,PRESTIGE_THRESHOLD*2)),14.14,'Tokens keep two decimals');
// Not ready: incomplete tree, or complete but poor.
assert.equal(prestige(s),0);
for(const n of NODES)s.levels[n.id]=n.max;assert(treeComplete(s));s.currencies.money=PRESTIGE_THRESHOLD/2;assert(!prestigeReady(s));assert.equal(prestige(s),0);
// Ready: tokens granted, studies and both currencies reset, checks cleared, settings and world kept, lands on the prestige map.
s.currencies.money=PRESTIGE_THRESHOLD*9;s.currencies.coin=12345;s.settings.format='scientific';s.world.seconds=777;s.prestige.auto={0:true};
const tokens=prestige(s,1000);
assert.equal(N(tokens),30);assert.equal(N(s.currencies.token),30);assert.equal(N(s.currencies.money),0);assert.equal(N(s.currencies.coin),0);assert.deepEqual(s.levels,{});
assert.equal(s.prestige.count,1);assert.equal(N(s.prestige.tokensEarned),30);assert.deepEqual(s.prestige.auto,{});assert.equal(s.map,'prestige');assert.equal(s.settings.format,'scientific');assert.equal(s.world.seconds,777);assert.equal(N(s.prestige.last.tokens),30);
assert(CURRENCY_DEFS.token.shown(s,economy(s)));assert(!MAPS[1].locked(s));assert.equal(currentMap(s).id,'prestige');
assert.equal(N(economy(s).rate),1,'A fresh run starts at $1/s again');
// Buying: roots first, reserved nodes never, costs per level, cheat makes them free.
const scaling=PRESTIGE_NODES.find(n=>n.name==='PERCEPTRON'),rate=PRESTIGE_NODES.find(n=>n.name==='ADAM'),transfer=PRESTIGE_NODES.find(n=>n.name==='BERT'),embedding=PRESTIGE_NODES.find(n=>n.name==='WORD2VEC');
assert(prestigeUnlocked(s,scaling)&&!prestigeUnlocked(s,rate));assert(!prestigePurchase(s,rate),'Upstream first');
assert(prestigePurchase(s,scaling));assert.equal(N(s.currencies.token),27);assert.equal(N(economy(s).rate),3,'PERCEPTRON triples production');
assert(!prestigeAffordable(s,transfer)&&!prestigePurchase(s,transfer),'Reserved nodes cannot be bought');
assert(prestigePurchase(s,rate));assert.equal(prestigeCost(s,rate).token,rate.cost[1]);assert(Math.abs(N(economy(s).rate)-3*1.15)<1e-9);
s.settings.purchaseCheat=true;const before=s.currencies.token;assert(prestigePurchase(s,embedding));assert(s.currencies.token.eq(before),'Cheat buys prestige nodes for free');assert(!prestigePurchase(s,transfer),'Cheat still cannot buy reserved nodes');s.settings.purchaseCheat=false;
assert.equal(N(economy(s).rate),(1+5)*3*1.15);
// Automation: only sectors with an owned AUTOPILOT and a checked box, only unlocked studies, so a sector cannot pass its gate.
const auto1=PRESTIGE_NODES.find(n=>n.name==='AUTOPILOT I');s.currencies.token=s.currencies.token.add(auto1.cost[0]);assert(prestigePurchase(s,auto1));
s.currencies.money=1e15;s.currencies.coin=1e6;assert.deepEqual(autoResearch(s),[],'Nothing happens until the check is on');
s.prestige.auto[0]=true;const bought=autoResearch(s,50);assert(bought.length>0&&bought.every(n=>n.chapter===0),'Only sector 1 is automated');
for(let i=0;i<40;i++)autoResearch(s,50);
assert(sectorProgress(s,0).complete,'Sector 1 completes by itself');assert.equal(NODES.filter(n=>n.chapter>0&&level(s,n)>0).length,0,'Sector 2 is never touched');
s.prestige.auto[1]=true;assert.deepEqual(autoResearch(s,50),[],'A check without the AUTOPILOT node does nothing');
// Offline window grows with DORMANT nodes and is stored at departure.
assert.deepEqual(offlineParams(s),{full:OFFLINE_FULL_SECONDS,decay:OFFLINE_DECAY_SECONDS,rateMul:1});
const checkpoint=PRESTIGE_NODES.find(n=>n.name==='RNN');s.currencies.token=s.currencies.token.add(checkpoint.cost[0]);assert(prestigePurchase(s,checkpoint));
assert.equal(offlineParams(s).full,OFFLINE_FULL_SECONDS+900);checkpointOffline(s,0);assert.equal(s.offline.full,OFFLINE_FULL_SECONDS+900);
const settled=settleOffline(s,(OFFLINE_FULL_SECONDS+900)*1000);assert(Math.abs(settled.effectiveSeconds-(OFFLINE_FULL_SECONDS+900))<1e-6,'The longer window pays in full');
// Saves: the prestige block round-trips, a 2.2 save without it loads, bad blocks are rejected.
const copy=validateSave(JSON.parse(JSON.stringify(s)));assert.equal(copy.prestige.count,1);assert(copy.currencies.token.eq(s.currencies.token));assert.deepEqual(copy.prestige.levels,s.prestige.levels);assert.deepEqual(copy.prestige.auto,{0:true,1:true});assert.equal(copy.map,'prestige');
const old=JSON.parse(JSON.stringify(defaultState()));delete old.prestige;delete old.currencies.token;const loaded=validateSave(old);assert.equal(loaded.prestige.count,0);assert.equal(N(loaded.currencies.token),0);
const bad=JSON.parse(JSON.stringify(s));bad.prestige.levels[String(rate.id)]=1;delete bad.prestige.levels[String(scaling.id)];assert.throws(()=>validateSave(bad),/환생 선행/);
const bad2=JSON.parse(JSON.stringify(defaultState()));bad2.currencies.token=5;assert.throws(()=>validateSave(bad2),/환생 전 토큰/);
// Petal progress ignores reserved nodes so a petal with placeholders can still light up.
const expansion=petalProgress(s,3);assert.equal(expansion.total,0);assert(!expansion.complete);
const reward=petalProgress(s,4);assert.equal(reward.total,PRESTIGE_NODES.filter(n=>n.branch===4&&!n.reserved).reduce((a,n)=>a+n.max,0));
console.log(JSON.stringify({prestigeNodes:PRESTIGE_NODES.length,petals:PETAL_ROWS.map(r=>r.join('-')),purchasableLevels:PRESTIGE_NODES.filter(n=>!n.reserved).reduce((a,n)=>a+n.max,0),reserved:PRESTIGE_NODES.filter(n=>n.reserved).length,tokenFormula:'passed',resetSemantics:'passed',cheatFreePrestige:'passed',automationRespectsGates:'passed',offlineWindow:'passed',saveRoundTrip:'passed',flowerLand:'passed'}));
