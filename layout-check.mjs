import assert from 'node:assert/strict';
import {NODES,MAP_LAYOUT,SECTOR_ROWS,defaultState,validateSave,sectorProgress} from './dist/data.js';
import {BRANCHES,CENTER,PLACEMENT,connectionPath,centerPath} from './dist/layout.js';
assert.equal(NODES.length,105);
assert.equal(NODES.at(-1).name,'AXIOM');
assert.deepEqual(BRANCHES.map(b=>b.chapters),[[0,1],[2],[3,4],[5],[6,7]]);
assert.equal(PLACEMENT.length,8);
// Flow: row plans match the sector sizes, every study depends only on the row
// directly before it, links between rows never cross, BASIS gates the coins.
for(let c=0;c<8;c++){
 const members=NODES.filter(n=>n.chapter===c),rows=SECTOR_ROWS[c];
 assert.equal(rows.reduce((a,b)=>a+b,0),members.length,`Sector ${c+1} row plan`);
 assert.equal(rows[0],1);assert.equal(rows.at(-1),1);
 for(const n of members){
  assert(n.req.length>0||n.id===1,`${n.name} has no prerequisite`);
  for(const r of n.req){const p=NODES[r.id-1];assert(n.row===0?p.chapter===c-1:p.chapter===c&&p.row===n.row-1,`${n.name} depends on a study that is not directly upstream`);}
 }
 const byRow=rows.map((_,r)=>members.filter(n=>n.row===r));
 for(let r=1;r<rows.length;r++)for(const a of byRow[r])for(const b of byRow[r])if(a.column<b.column){
  for(const ra of a.req)for(const rb of b.req){const pa=NODES[ra.id-1],pb=NODES[rb.id-1];assert(pa.column<=pb.column,`Links cross between ${a.name} and ${b.name}`);}
 }
}
assert.equal(NODES[21].name,'BASIS');
for(const n of NODES.filter(n=>n.chapter===2&&n.id>22)){
 const reaches=(id)=>id===22||NODES[id-1].req.some(r=>reaches(r.id));
 assert(reaches(n.id),`${n.name} does not descend from BASIS`);
}
const inside=(point,polygon)=>{let hit=false;for(let i=0,j=polygon.length-1;i<polygon.length;j=i++){const a=polygon[i],b=polygon[j];if((a.y>point.y)!==(b.y>point.y)&&point.x<(b.x-a.x)*(point.y-a.y)/(b.y-a.y)+a.x)hit=!hit;}return hit;};
for(let i=0;i<NODES.length;i++)for(let j=i+1;j<NODES.length;j++){const a=NODES[i],b=NODES[j];assert(Math.abs(a.x-b.x)>=158||Math.abs(a.y-b.y)>=130,`Cards overlap: ${a.id}, ${b.id}`);}
// Land: every card sits inside its own sector, outside every other sector,
// headings sit outside the land, and all eight sectors form one mainland.
const shared=(a,b)=>a.polygon.filter(p=>b.polygon.some(q=>Math.abs(p.x-q.x)<.5&&Math.abs(p.y-q.y)<.5)).length;
const adjacency=MAP_LAYOUT.sectors.map(()=>new Set());
for(const sector of MAP_LAYOUT.sectors){
 assert.equal(sector.loops,1,`Sector ${sector.chapter+1} is split into ${sector.loops} pieces`);
 assert(sector.polygon.length>=8,`Sector ${sector.chapter+1} outline is too simple`);
 for(const n of sector.members){
  assert(Math.hypot(n.x,n.y)>CENTER.radius+100);
  for(const dx of [-73,73])for(const dy of [-59,59])assert(inside({x:n.x+dx,y:n.y+dy},sector.polygon),`Card ${n.id} leaves sector ${sector.chapter+1}`);
 }
 for(const other of MAP_LAYOUT.sectors)if(other!==sector){
  for(const n of other.members)assert(!inside({x:n.x,y:n.y},sector.polygon),`Card ${n.id} lies inside sector ${sector.chapter+1}`);
  if(shared(sector,other)>=2){adjacency[sector.chapter].add(other.chapter);adjacency[other.chapter].add(sector.chapter);}
 }
 for(const other of MAP_LAYOUT.sectors)assert(!inside(sector.label,other.polygon),`Heading of sector ${sector.chapter+1} is on land`);
}
const reached=new Set([0]),queue=[0];
while(queue.length){const c=queue.shift();for(const d of adjacency[c])if(!reached.has(d)){reached.add(d);queue.push(d);}}
assert.equal(reached.size,8,'Sectors do not form one mainland');
for(const n of NODES)for(const req of n.req){const path=connectionPath(NODES[req.id-1],n,MAP_LAYOUT.sectors);assert(!/NaN|Infinity/.test(path));}
for(const branch of BRANCHES)assert(!/NaN|Infinity/.test(centerPath(MAP_LAYOUT.sectors[branch.chapters[0]].members[0])));
const state=defaultState();
assert.equal(state.settings.hudCollapsed,false);
for(const n of MAP_LAYOUT.sectors[0].members)state.levels[n.id]=1;
assert(!sectorProgress(state,0).complete,'First purchase of every node must not complete a sector');
for(const n of MAP_LAYOUT.sectors[0].members)state.levels[n.id]=n.max;
assert(sectorProgress(state,0).complete);
assert(!sectorProgress(state,1).complete);
for(const n of NODES)state.levels[n.id]=n.max;
for(let i=0;i<8;i++)assert(sectorProgress(state,i).complete);
state.levels[41]--;
assert(!sectorProgress(state,3).complete,'Long-term levels count toward completion');
const old=defaultState();
delete old.layoutVersion;
old.camera={x:100,y:-9000,scale:.8};
old.settings.hudCollapsed=true;
old.currencies.money=3456;
old.levels[1]=1;
const migrated=validateSave(old);
assert.equal(migrated.camera,null);
assert.equal(migrated.settings.hudCollapsed,true);
assert.equal(migrated.currencies.money,3456);
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
console.log(JSON.stringify({flowLayout:'passed',sectors:8,rowPlans:SECTOR_ROWS.map(r=>r.join('-')),crossingLinks:0,cardOverlap:false,cardsInsideOwnSector:'passed',headingsOffLand:'passed',mainlandConnected:true,outlineVertices:MAP_LAYOUT.sectors.map(s=>s.polygon.length),completionRequiresAllLevels:'passed',oldSaveMigration:'passed'}));
