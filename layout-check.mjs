import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {NODES,byId,MAP_LAYOUT,CHAPTERS,COIN_UNLOCK,defaultState,validateSave,sectorProgress} from './dist/data.js';
import {CENTER} from './dist/layout.js';
import {ISLANDS,ISLAND_NODES} from './dist/islands.js';
import {ISLAND_ART} from './dist/island-art.js';
// 4.0 stage 1: the map is island 1 (30 studies) in the sea, the center sits off its coast.
const geom=JSON.parse(readFileSync('scripts/islands/geom.json','utf8'));
assert.equal(NODES.length,30);assert.equal(ISLANDS.length,1);assert.equal(MAP_LAYOUT.sectors.length,CHAPTERS.length);
assert.deepEqual(MAP_LAYOUT.sectors.map(s=>s.members.length),[30]);
// Flow: every study but START has a prerequisite placed before it, coin studies descend from BASIS.
for(const n of NODES){assert(n.req.length>0||n.id===1,`${n.name} has no prerequisite`);for(const r of n.req)assert(byId.has(r.id)&&r.id<n.id&&r.level>=1);}
const reaches=(n,id)=>n.id===id||n.req.some(r=>reaches(byId.get(r.id),id));
for(const n of NODES.filter(n=>n.payment.includes('coin')))assert(reaches(n,COIN_UNLOCK),`${n.name} does not descend from BASIS`);
// Cards never overlap, links are straight and never cross or pass under another card.
for(let i=0;i<NODES.length;i++)for(let j=i+1;j<NODES.length;j++){const a=NODES[i],b=NODES[j];assert(Math.abs(a.x-b.x)>=158||Math.abs(a.y-b.y)>=130,`Cards overlap: ${a.id}, ${b.id}`);}
const links=NODES.flatMap(n=>n.req.map(r=>[byId.get(r.id),n]));
const side=(a,b,c)=>Math.sign((b.x-a.x)*(c.y-a.y)-(b.y-a.y)*(c.x-a.x));
for(let i=0;i<links.length;i++)for(let j=i+1;j<links.length;j++){const [a,b]=links[i],[c,d]=links[j];if(new Set([a.id,b.id,c.id,d.id]).size<4)continue;
 assert(!(side(a,b,c)*side(a,b,d)<0&&side(c,d,a)*side(c,d,b)<0),`Links cross: ${a.id}-${b.id}, ${c.id}-${d.id}`);}
for(const [a,b]of links)for(const n of NODES)if(n!==a&&n!==b)for(let t=0;t<=1;t+=.01)assert(!(Math.abs(a.x+(b.x-a.x)*t-n.x)<73&&Math.abs(a.y+(b.y-a.y)*t-n.y)<59),`Link ${a.id}-${b.id} passes under card ${n.id}`);
// Land: every card sits on the island, the center and the heading sit in the sea.
const inside=(p,poly)=>{let hit=false;for(let i=0,j=poly.length-1;i<poly.length;j=i++){const a=poly[i],b=poly[j];if((a[1]>p.y)!==(b[1]>p.y)&&p.x<(b[0]-a[0])*(p.y-a[1])/(b[1]-a[1])+a[0])hit=!hit;}return hit;};
const onLand=p=>geom.land.some(poly=>inside(p,poly));
for(const n of NODES)for(const dx of [-73,73])for(const dy of [-59,59])assert(onLand({x:n.x+dx,y:n.y+dy}),`Card ${n.id} leaves the island`);
assert(!onLand(CENTER));assert(NODES.every(n=>Math.hypot(n.x-CENTER.x,n.y-CENTER.y)>CENTER.radius+300),'The center keeps clear of the island');
for(const s of MAP_LAYOUT.sectors)assert(!onLand(s.label),'Island heading sits in the sea');
// Zones: the card color follows the ground under it (grass, sand, rock) as built into the art.
for(const p of ISLAND_NODES)assert.equal(p.zone,geom.zones[p.id],`Zone of ${p.id}`);
assert.deepEqual([...new Set(NODES.map(n=>n.zone))].sort(),['grass','rock','sand']);
// Art: one picture per island, landmarks frame existing studies, the sheet covers the map.
const [WX,WY,WW,WH]=ISLAND_ART.world;
for(const n of NODES)assert(n.x>WX&&n.x<WX+WW&&n.y>WY&&n.y<WY+WH);assert(CENTER.x>WX&&CENTER.y>WY);
for(const l of ISLAND_ART.landmarks)assert(byId.has(l.node));assert.deepEqual(ISLAND_ART.landmarks.map(l=>l.node).sort((a,b)=>a-b),ISLANDS[0].landmarks.map(l=>l.node??l).sort((a,b)=>a-b));
assert(ISLAND_ART.back.startsWith('<svg')&&!/NaN|Infinity/.test(ISLAND_ART.back));
// Completion: an island is complete only at every level.
const state=defaultState();
assert.equal(state.settings.hudCollapsed,false);
for(const n of MAP_LAYOUT.sectors[0].members)state.levels[n.id]=1;
assert(!sectorProgress(state,0).complete,'First purchase of every node must not complete an island');
for(const n of MAP_LAYOUT.sectors[0].members)state.levels[n.id]=n.max;
assert(sectorProgress(state,0).complete);
state.levels[3]--;assert(!sectorProgress(state,0).complete,'Upgradeable levels count toward completion');
// Saves: layout changes discard the stored camera, the current layout keeps it.
const old=defaultState();
delete old.layoutVersion;
old.camera={x:100,y:-9000,scale:.8};
old.settings.hudCollapsed=true;
old.currencies.money=3456;
old.levels[1]=1;
const migrated=validateSave(old);
assert.equal(migrated.camera,null);
assert.equal(migrated.settings.hudCollapsed,true);
assert(migrated.currencies.money.eq(3456));
assert.deepEqual(migrated.levels,old.levels);
const previousLayout=defaultState();
previousLayout.layoutVersion=2;previousLayout.camera={x:-200,y:400,scale:.6};
assert.equal(validateSave(previousLayout).camera,null,'Layout-2 camera positions are discarded');
const current=defaultState();
current.camera={x:-200,y:400,scale:.6};
current.settings.hudCollapsed=true;
const restored=validateSave(current);
assert.deepEqual(restored.camera,current.camera);
assert.equal(restored.settings.hudCollapsed,true);
console.log(JSON.stringify({islands:ISLANDS.length,nodes:NODES.length,links:links.length,crossingLinks:0,cardOverlap:false,cardsOnLand:'passed',centerAndHeadingAtSea:'passed',zones:Object.fromEntries(['grass','sand','rock'].map(z=>[z,NODES.filter(n=>n.zone===z).length])),landmarks:ISLAND_ART.landmarks.length,completionRequiresAllLevels:'passed',oldSaveMigration:'passed'}));
