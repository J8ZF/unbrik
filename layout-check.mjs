import assert from 'node:assert/strict';
import {NODES,CHAPTERS,MAP_LAYOUT,defaultState,validateSave,sectorProgress} from './dist/data.js';
import {BRANCHES,CENTER,connectionPath,centerPath} from './dist/layout.js';
assert.equal(NODES.length,105);assert.equal(NODES.at(-1).name,'AXIOM');
assert.deepEqual(BRANCHES.map(b=>b.chapters),[[0,1],[2],[3,4],[5],[6,7]]);
// Coastlines are concave. A convex-only half-plane test cannot describe bays.
const within=(p,polygon)=>{let hit=false;for(let i=0,j=polygon.length-1;i<polygon.length;j=i++){
 const a=polygon[i],b=polygon[j];if((a.y>p.y)!==(b.y>p.y)&&p.x<(b.x-a.x)*(p.y-a.y)/(b.y-a.y)+a.x)hit=!hit;
}return hit;};
const cross=(a,b,c)=>(b.x-a.x)*(c.y-a.y)-(b.y-a.y)*(c.x-a.x);
const crosses=(a,b,c,d)=>cross(a,b,c)*cross(a,b,d)<-1e-8&&cross(c,d,a)*cross(c,d,b)<-1e-8;
const separated=(a,b)=>!a.some(p=>within(p,b))&&!b.some(p=>within(p,a))&&!a.some((p,i)=>b.some((q,j)=>crosses(p,a[(i+1)%a.length],q,b[(j+1)%b.length])));
for(let i=0;i<NODES.length;i++)for(let j=i+1;j<NODES.length;j++){const a=NODES[i],b=NODES[j];assert(Math.abs(a.x-b.x)>=158||Math.abs(a.y-b.y)>=130,`Cards overlap: ${a.id}, ${b.id}`);}
for(const sector of MAP_LAYOUT.sectors){
 for(const n of sector.members){assert(Math.hypot(n.x,n.y)>CENTER.radius+100);for(const dx of [-73,73])for(const dy of [-59,59])assert(within({x:n.x+dx,y:n.y+dy},sector.polygon));}
 for(const other of MAP_LAYOUT.sectors)if(sector.chapter<other.chapter)assert(separated(sector.polygon,other.polygon),`Sector regions overlap: ${sector.chapter}, ${other.chapter}`);
}
for(const n of NODES)for(const req of n.req){const path=connectionPath(NODES[req.id-1],n,MAP_LAYOUT.sectors);assert(!/NaN|Infinity/.test(path));}
// Sample the actual SVG paths against unrelated cards, including the optional
// cross-sector prerequisite shown when one endpoint is selected.
function samples(path){
 const tokens=path.match(/[MLQC]|-?\d+(?:\.\d+)?(?:e[+-]?\d+)?/g);let i=0,p,result=[];
 const point=()=>({x:+tokens[i++],y:+tokens[i++]});
 while(i<tokens.length){const command=tokens[i++];if(command==='M'){p=point();result.push(p);continue;}
  const a=p,c=point(),d=command==='C'?point():null,b=command==='L'?c:point();
  for(let step=1;step<=120;step++){const v=step/120,u=1-v;
   p=Object.fromEntries(['x','y'].map(k=>[k,command==='L'?a[k]*u+b[k]*v:command==='Q'?u*u*a[k]+2*u*v*c[k]+v*v*b[k]:u**3*a[k]+3*u*u*v*c[k]+3*u*v*v*d[k]+v**3*b[k]]));result.push(p);
  }
 }return result;
}
const edgeCollisions=[];
for(const to of NODES)for(const r of to.req){
 const from=NODES[r.id-1],points=samples(connectionPath(from,to,MAP_LAYOUT.sectors));
 for(const n of NODES)if(n!==from&&n!==to&&points.some(p=>Math.abs(p.x-n.x)<76&&Math.abs(p.y-n.y)<62))edgeCollisions.push(`${from.id}->${to.id} over ${n.id}`);
}
assert.deepEqual(edgeCollisions,[],'Connections must leave unrelated research cards clear');
const labels=MAP_LAYOUT.sectors.map(s=>{const width=`0${s.chapter+1} / ${CHAPTERS[s.chapter].name} · COMPLETE`.length*21;return {chapter:s.chapter,minX:s.label.x-width/2,maxX:s.label.x+width/2,minY:s.label.y,maxY:s.label.y+58};});
for(const label of labels){
 for(const sector of MAP_LAYOUT.sectors)for(let x=label.minX;x<label.maxX;x+=8)for(let y=label.minY;y<label.maxY;y+=8)assert(!within({x,y},sector.polygon),`Sector ${label.chapter+1} label touches island ${sector.chapter+1}`);
 for(const other of labels)if(label.chapter<other.chapter)assert(label.maxX<other.minX||other.maxX<label.minX||label.maxY<other.minY||other.maxY<label.minY,'Sector labels overlap');
}
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
