import assert from 'node:assert/strict';
import {readFileSync,existsSync} from 'node:fs';
import {NODES,byId,MAP_LAYOUT,CHAPTERS,COIN_UNLOCK,defaultState,validateSave,sectorProgress,islandOpen} from './dist/data.js';
import {CENTER} from './dist/layout.js';
import {ISLANDS,ISLAND_NODES} from './dist/islands.js';
import {ISLAND_ART} from './dist/island-art.js';
// 4.0: five islands round the observatory, each a picture of its own; island 1 is the confirmed hand layout.
assert.equal(NODES.length,253);assert.equal(ISLANDS.length,5);assert.equal(MAP_LAYOUT.sectors.length,CHAPTERS.length);
assert.deepEqual(MAP_LAYOUT.sectors.map(s=>s.members.length),[30,35,40,60,88]);
const geoms=ISLANDS.map(i=>JSON.parse(readFileSync(`scripts/islands/island${i.id}.geom.json`,'utf8')));
// Flow: every study but the first has a prerequisite placed before it; an island's first study asks for the island before.
for(const n of NODES){assert(n.req.length>0||n.id===1,`${n.name} has no prerequisite`);for(const r of n.req)assert(byId.has(r.id)&&r.id<n.id&&r.level>=1);}
const reaches=(n,id)=>n.id===id||n.req.some(r=>reaches(byId.get(r.id),id));
// coin studies of island 1 descend from BASIS; later islands open only after island 1's last study (BASIS stays reachable there)
for(const n of NODES.filter(n=>n.payment.includes('coin')&&n.chapter===0))assert(reaches(n,COIN_UNLOCK),`${n.name} does not descend from BASIS`);
for(const n of NODES.filter(n=>n.chapter>0))assert(reaches(n,ISLANDS[n.chapter-1].last),`${n.id} is not downstream of the island before`);
// Cards never overlap, links are straight and never cross or pass under another card (links stay within an island).
for(let i=0;i<NODES.length;i++)for(let j=i+1;j<NODES.length;j++){const a=NODES[i],b=NODES[j];assert(Math.abs(a.x-b.x)>=158||Math.abs(a.y-b.y)>=130,`Cards overlap: ${a.id}, ${b.id}`);}
const links=NODES.flatMap(n=>n.req.map(r=>[byId.get(r.id),n])).filter(([a,b])=>a.chapter===b.chapter);
const side=(a,b,c)=>Math.sign((b.x-a.x)*(c.y-a.y)-(b.y-a.y)*(c.x-a.x));
for(let i=0;i<links.length;i++)for(let j=i+1;j<links.length;j++){const [a,b]=links[i],[c,d]=links[j];if(new Set([a.id,b.id,c.id,d.id]).size<4)continue;
 assert(!(side(a,b,c)*side(a,b,d)<0&&side(c,d,a)*side(c,d,b)<0),`Links cross: ${a.id}-${b.id}, ${c.id}-${d.id}`);}
for(const [a,b]of links)for(const n of NODES)if(n!==a&&n!==b&&n.chapter===a.chapter)for(let t=0;t<=1;t+=.01)assert(!(Math.abs(a.x+(b.x-a.x)*t-n.x)<73&&Math.abs(a.y+(b.y-a.y)*t-n.y)<59),`Link ${a.id}-${b.id} passes under card ${n.id}`);
assert.equal(NODES.filter(n=>n.chapter>0&&n.req.some(r=>byId.get(r.id).chapter!==n.chapter)).length,4,'only the four island roots link across islands');
// Land: every card sits on its island, the center and the headings sit in the sea, islands keep clear of each other and of the observatory.
const inside=(p,poly)=>{let hit=false;for(let i=0,j=poly.length-1;i<poly.length;j=i++){const a=poly[i],b=poly[j];if((a[1]>p.y)!==(b[1]>p.y)&&p.x<(b[0]-a[0])*(p.y-a[1])/(b[1]-a[1])+a[0])hit=!hit;}return hit;};
const onLand=(p,k)=>geoms[k].land.some(poly=>inside(p,poly));
for(const n of NODES)for(const dx of [-73,73])for(const dy of [-59,59])assert(onLand({x:n.x+dx,y:n.y+dy},n.chapter),`Card ${n.id} leaves its island`);
for(let k=0;k<ISLANDS.length;k++){assert(!onLand(CENTER,k));assert(!onLand(MAP_LAYOUT.sectors[k].label,k),'Island heading sits in the sea');
 const b=ISLANDS[k].bounds;for(const c of [[b.minX,b.minY],[b.maxX,b.minY],[b.minX,b.maxY],[b.maxX,b.maxY]])assert(Math.hypot(c[0]-CENTER.x,c[1]-CENTER.y)>CENTER.reach,`Island ${k+1} overlaps the observatory`);
 for(let j=k+1;j<ISLANDS.length;j++){const c=ISLANDS[j].bounds;assert(b.maxX<c.minX||c.maxX<b.minX||b.maxY<c.minY||c.maxY<b.minY,`Islands ${k+1} and ${j+1} overlap`);}}
assert(NODES.every(n=>Math.hypot(n.x-CENTER.x,n.y-CENTER.y)>CENTER.reach+300),'Cards keep clear of the observatory');
// Zones: the card color follows the ground under it (grass, sand, rock) as built into the art.
for(const p of ISLAND_NODES)assert.equal(p.zone,geoms[ISLANDS.findIndex(i=>i.id===p.island)].zones[p.id-ISLANDS.find(i=>i.id===p.island).first+1],`Zone of ${p.id}`);
assert.deepEqual([...new Set(NODES.map(n=>n.zone))].sort(),['grass','rock','sand']);
// Art: one picture per island plus the observatory, and a small picture for each satellite islet of an island; landmarks frame existing studies (3–4 per island); the world covers everything.
const [WX,WY,WW,WH]=ISLAND_ART.world,SATS=ISLAND_ART.pictures.filter(p=>p.sat);
assert.equal(ISLAND_ART.pictures.length-SATS.length,ISLANDS.length+1);
// A satellite belongs to an island, stands clear of that island's own picture land and of every study, and has shore data of its own.
for(const s of SATS){assert(ISLANDS.some(i=>i.id===s.island)&&s.back.startsWith('<svg')&&!/NaN|Infinity|undefined/.test(s.back));assert(!s.decor.length&&!s.landmarks.length);if(s.rocks)assert(s.fx.mask.length>=1&&!s.fx.coast.length,'bare rocks have no shore of their own');else assert(s.fx.coast.length>=1&&s.fx.surfIn.length>=1);
 const [x,y,w,h]=s.bounds;assert(x>WX&&y>WY&&x+w<WX+WW&&y+h<WY+WH);for(const n of NODES)assert(!(n.x>x&&n.x<x+w&&n.y>y&&n.y<y+h),`study ${n.id} under satellite ${s.island}/${s.sat}`);}
// The sea floor: the basin steps inward, and an island's shelf contours and reefs come with shallows traced round its land.
const SBD=ISLAND_ART.seabed;assert(SBD.basin.length===SBD.tone.basin[1].length&&SBD.basin.every(b=>b.length>=8));
for(const [id,f] of Object.entries(SBD.islands)){assert(ISLANDS.some(i=>i.id===+id));assert(f.shelf.length>=3&&f.reefs.length>=3&&f.shallows.length>=1&&f.shallow.length===2);for(const r of f.reefs)assert([1,2,3].includes(r.t)&&r.pts.length>=4);}
for(const n of NODES)assert(n.x>WX&&n.x<WX+WW&&n.y>WY&&n.y<WY+WH);assert(CENTER.x>WX&&CENTER.y>WY);
for(const isl of ISLANDS){const pic=ISLAND_ART.pictures.find(p=>p.island===isl.id&&!p.sat);assert(pic&&pic.back.startsWith('<svg')&&!/NaN|Infinity|undefined/.test(pic.back));
 assert.deepEqual(pic.landmarks.map(l=>l.node).sort((a,b)=>a-b),isl.landmarks.map(l=>l.node).sort((a,b)=>a-b));assert(isl.landmarks.length>=3&&isl.landmarks.length<=5);
 for(const l of pic.landmarks){const n=byId.get(l.node);assert(n&&n.chapter===ISLANDS.indexOf(isl)&&(n.chapter===0||n.max>1),`landmark ${l.kind} frames an upgradeable study`);}
 assert(pic.decor.length>50,`island ${isl.id} has decoration`);}
// Opening: an island opens with the last study of the one before; completion needs every level.
const state=defaultState();
assert.equal(state.settings.hudCollapsed,false);
for(const n of MAP_LAYOUT.sectors[0].members)state.levels[n.id]=1;
assert(!sectorProgress(state,0).complete,'First purchase of every node must not complete an island');assert(islandOpen(state,1));assert(!islandOpen(state,2));
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
console.log(JSON.stringify({islands:ISLANDS.length,nodes:NODES.length,links:links.length,crossingLinks:0,cardOverlap:false,cardsOnLand:'passed',centerAndHeadingAtSea:'passed',zones:Object.fromEntries(['grass','sand','rock'].map(z=>[z,NODES.filter(n=>n.zone===z).length])),landmarks:ISLANDS.map(i=>i.landmarks.length),pictures:ISLAND_ART.pictures.length,completionRequiresAllLevels:'passed',oldSaveMigration:'passed'}));
