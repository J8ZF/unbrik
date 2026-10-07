import assert from 'node:assert/strict';
import {NODES,CHAPTERS,MAP_LAYOUT,defaultState,validateSave,sectorProgress} from './dist/data.js';
import {BRANCHES,CENTER,connectionPath,centerPath,segmentHitsBox} from './dist/layout.js';
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
// Overview doubles caption type to 30px. Reserve the complete caption, not
// just its anchor, including the decorative rule and some metric tolerance.
const captions=MAP_LAYOUT.sectors.map(s=>{
 const text=`0${s.chapter+1} / ${CHAPTERS[s.chapter].name} · COMPLETE`,half=text.length*21/2+8,{x,y}=s.label;
 return {chapter:s.chapter,polygon:[{x:x-half,y:y-4},{x:x+half,y:y-4},{x:x+half,y:y+52},{x:x-half,y:y+52}]};
});
for(const a of captions){
 for(const s of MAP_LAYOUT.sectors)if(s.chapter!==a.chapter)assert(separated(a.polygon,s.polygon),`Caption ${a.chapter+1} overlaps sector ${s.chapter+1}`);
 for(const b of captions)if(a.chapter<b.chapter)assert(separated(a.polygon,b.polygon),`Captions overlap: ${a.chapter+1}, ${b.chapter+1}`);
 for(const n of NODES){const box=[{x:n.x-77,y:n.y-63},{x:n.x+77,y:n.y-63},{x:n.x+77,y:n.y+63},{x:n.x-77,y:n.y+63}];assert(separated(a.polygon,box),`Caption ${a.chapter+1} overlaps card ${n.id}`);}
}
// Sample the rendered cubic/rounded paths, not just their endpoints. A valid
// node layout can still route research links straight through another card.
function samplePath(path){
 const tokens=path.match(/[MLCQ]|-?\d+(?:\.\d+)?(?:e[+-]?\d+)?/g);let i=0,p=null;const points=[];
 const point=()=>({x:Number(tokens[i++]),y:Number(tokens[i++])});
 while(i<tokens.length){const command=tokens[i++];
  if(command==='M'||command==='L'){p=point();points.push(p);continue;}
  assert(command==='C'||command==='Q');const a=p,c=point(),d=command==='C'?point():null,b=point();
  for(let j=1;j<=60;j++){const t=j/60,u=1-t;p=command==='C'?{x:u**3*a.x+3*u*u*t*c.x+3*u*t*t*d.x+t**3*b.x,y:u**3*a.y+3*u*u*t*c.y+3*u*t*t*d.y+t**3*b.y}:{x:u*u*a.x+2*u*t*c.x+t*t*b.x,y:u*u*a.y+2*u*t*c.y+t*t*b.y};points.push(p);}p=b;
 }return points;
}
let links=0;
for(const n of NODES)for(const req of n.req){
 const path=connectionPath(NODES[req.id-1],n,MAP_LAYOUT.sectors);assert(!/NaN|Infinity/.test(path));
 const points=samplePath(path);links++;
 for(const other of NODES){if(other.id===n.id||other.id===req.id)continue;
  const box={minX:other.x-77,maxX:other.x+77,minY:other.y-63,maxY:other.y+63};
  assert(!points.some((p,i)=>i&&segmentHitsBox(points[i-1],p,box)),`Link ${req.id} → ${n.id} crosses card ${other.id}`);
 }
}
for(const sector of MAP_LAYOUT.sectors){assert(Math.max(...sector.members.map(n=>n.localY))<=(sector.chapter===5?1330:960),'Keep non-06 sector depth');assert(new Set(sector.members.map(n=>n.localY)).size<=(sector.chapter===5?8:5));}
for(const branch of BRANCHES)assert(!/NaN|Infinity/.test(centerPath(MAP_LAYOUT.sectors[branch.chapters[0]].members[0])));
const state=defaultState();assert.equal(state.settings.hudCollapsed,false);
for(const n of MAP_LAYOUT.sectors[0].members)state.levels[n.id]=1;
assert(!sectorProgress(state,0).complete,'First purchase of every node must not complete a sector');
for(const n of MAP_LAYOUT.sectors[0].members)state.levels[n.id]=n.max;
assert(sectorProgress(state,0).complete);assert(!sectorProgress(state,1).complete);
for(const n of NODES)state.levels[n.id]=n.max;
for(let i=0;i<8;i++)assert(sectorProgress(state,i).complete);
state.levels[41]--;assert(!sectorProgress(state,3).complete,'Long-term levels count toward completion');
const old=defaultState();old.layoutVersion=3;old.camera={x:100,y:-9000,scale:.8};old.settings.hudCollapsed=true;old.currencies={money:3456,coin:789};for(const n of NODES.filter(n=>n.id<=22))old.levels[n.id]=1;old.timers.cache=11;
const migrated=validateSave(old);assert.equal(migrated.camera,null);assert.deepEqual(migrated.settings,old.settings);assert.deepEqual(migrated.currencies,old.currencies);assert.deepEqual(migrated.levels,old.levels);assert.deepEqual(migrated.timers,old.timers);
const current=defaultState();current.camera={x:-200,y:400,scale:.6};current.settings.hudCollapsed=true;
const restored=validateSave(current);assert.deepEqual(restored.camera,current.camera);assert.equal(restored.settings.hudCollapsed,true);
console.log(JSON.stringify({radialLayout:'passed',branches:5,sectors:8,cardOverlap:false,regionOverlap:false,overviewCaptionOverlap:false,linksChecked:links,linkCardOverlap:false,completionRequiresAllLevels:'passed',oldSaveMigration:'passed'}));
