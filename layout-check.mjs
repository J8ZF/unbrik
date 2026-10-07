import assert from 'node:assert/strict';
import {NODES,MAP_LAYOUT,defaultState,validateSave,sectorProgress} from './dist/data.js';
import {BRANCHES,CENTER,connectionPath,centerPath} from './dist/layout.js';
assert.equal(NODES.length,105);assert.equal(NODES.at(-1).name,'AXIOM');
assert.deepEqual(BRANCHES.map(b=>b.chapters),[[0,1],[2],[3,4],[5],[6,7]]);
const within=(point,polygon)=>polygon.every((a,i)=>{const b=polygon[(i+1)%polygon.length];return (b.x-a.x)*(point.y-a.y)-(b.y-a.y)*(point.x-a.x)>=-1e-6;});
const separated=(a,b)=>[...a,...b].some((p,i)=>{
 const polygon=i<a.length?a:b,index=i<a.length?i:i-a.length,q=polygon[(index+1)%polygon.length],normal={x:p.y-q.y,y:q.x-p.x};
 const aa=a.map(v=>v.x*normal.x+v.y*normal.y),bb=b.map(v=>v.x*normal.x+v.y*normal.y);
 return Math.max(...aa)<Math.min(...bb)||Math.max(...bb)<Math.min(...aa);
});
for(let i=0;i<NODES.length;i++)for(let j=i+1;j<NODES.length;j++){const a=NODES[i],b=NODES[j];assert(Math.abs(a.x-b.x)>=158||Math.abs(a.y-b.y)>=130,`Cards overlap: ${a.id}, ${b.id}`);}
for(const sector of MAP_LAYOUT.sectors){
 for(const n of sector.members){assert(Math.hypot(n.x,n.y)>CENTER.radius+100);for(const dx of [-73,73])for(const dy of [-59,59])assert(within({x:n.x+dx,y:n.y+dy},sector.polygon));}
 for(const other of MAP_LAYOUT.sectors)if(sector.chapter<other.chapter)assert(separated(sector.polygon,other.polygon),`Sector regions overlap: ${sector.chapter}, ${other.chapter}`);
}
for(const n of NODES)for(const req of n.req){const path=connectionPath(NODES[req.id-1],n,MAP_LAYOUT.sectors);assert(!/NaN|Infinity/.test(path));}
for(const branch of BRANCHES)assert(!/NaN|Infinity/.test(centerPath(MAP_LAYOUT.sectors[branch.chapters[0]].members[0])));
const state=defaultState();assert.equal(state.settings.hudCollapsed,false);
for(const n of MAP_LAYOUT.sectors[0].members)state.levels[n.id]=1;
assert(!sectorProgress(state,0).complete,'First purchase of every node must not complete a sector');
for(const n of MAP_LAYOUT.sectors[0].members)state.levels[n.id]=n.max;
assert(sectorProgress(state,0).complete);assert(!sectorProgress(state,1).complete);
for(const n of NODES)state.levels[n.id]=n.max;
for(let i=0;i<8;i++)assert(sectorProgress(state,i).complete);
state.levels[41]--;assert(!sectorProgress(state,3).complete,'Long-term levels count toward completion');
const old=defaultState();delete old.layoutVersion;old.camera={x:100,y:-9000,scale:.8};old.settings.hudCollapsed=true;old.currencies.money=3456;old.levels[1]=1;
const migrated=validateSave(old);assert.equal(migrated.camera,null);assert.equal(migrated.settings.hudCollapsed,true);assert.equal(migrated.currencies.money,3456);assert.deepEqual(migrated.levels,old.levels);
const current=defaultState();current.camera={x:-200,y:400,scale:.6};current.settings.hudCollapsed=true;
const restored=validateSave(current);assert.deepEqual(restored.camera,current.camera);assert.equal(restored.settings.hudCollapsed,true);
console.log(JSON.stringify({radialLayout:'passed',branches:5,sectors:8,cardOverlap:false,regionOverlap:false,completionRequiresAllLevels:'passed',oldSaveMigration:'passed'}));
