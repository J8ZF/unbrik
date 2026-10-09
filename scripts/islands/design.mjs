// Loads an island design in local coordinates (scaled if the design says so).
// A design may give one outline and crack lines instead of finished pieces;
// the pieces are then cut with split.py (OpenCV). Island 1 is the confirmed
// hand layout; its module keeps its own exports.
import fs from 'node:fs';
import {execFileSync} from 'node:child_process';
import * as I1 from './island1.mjs';
const here=f=>new URL(f,import.meta.url);
const S=(pts,k)=>pts.map(([x,y])=>[Math.round(x*k),Math.round(y*k)]);
export async function loadDesign(name){
 if(name==='island1'){
  return {id:1,name:I1.ISLAND.name,theme:'meadow',origin:[0,0],land:{coast:I1.COAST,small:I1.SMALL},label:I1.LABEL,nodes:I1.NODES,content:I1.CONTENT,last:I1.ISLAND.last,
   landmarks:I1.LANDMARKS,sandBands:I1.SAND_BANDS,beach:[...I1.BEACH.map(([x0,x1,w])=>[x0,1700,x1,2600,w]),...I1.SMALL_BEACH.map(([x0,x1,w])=>[x0,1780,x1,2600,w])],
   rockZones:I1.ROCK_ZONES,terrain:I1.TERRAIN,geom:{raster:[300,400,3800,3100],seeds:{rocks:11,dunes:5},duneBox:[450,300,2950,2200],rockAlign:['coast']},seaFile:'sea_v1.json'};
 }
 const m=await import(`./${name}.mjs`),D=JSON.parse(JSON.stringify(m.DESIGN)),k=D.scale||1;
 if(k!==1){
  if(D.outline){D.outline=S(D.outline,k);for(const c of D.cracks||[]){c.pts=S(c.pts,k);c.w=Math.round(c.w*k);}}
  for(const key of Object.keys(D.land||{}))D.land[key]=S(D.land[key],k);
  D.holes=(D.holes||[]).map(p=>S(p,k));D.sandHoles=(D.sandHoles||[]).map(p=>S(p,k));D.avoid=(D.avoid||[]).map(b=>b.map(v=>Math.round(v*k)));
  D.label=D.label.map(v=>Math.round(v*k));
  for(const key of ['root','gate'])D.tree[key]=D.tree[key].map(v=>Math.round(v*k));D.tree.marks=D.tree.marks.map(p=>p.at?{...p,at:p.at.map(v=>Math.round(v*k))}:p.map(v=>Math.round(v*k)));
  D.beach=(D.beach||[]).map(([x0,y0,x1,y1,w])=>[x0*k,y0*k,x1*k,y1*k,w]);
  D.sandBands=(D.sandBands||[]).map(b=>Array.isArray(b)?b:{...b,from:b.from.map(v=>v*k),to:b.to.map(v=>v*k),depths:b.depths.map(v=>v*k)});
  for(const z of D.rockZones||[]){z.area=S(z.area,k);z.core=(z.core||[]).map(([cx,cy,w,h,a])=>[cx*k,cy*k,w*k,h*k,a]);z.size=z.size.map(v=>v*k);z.count=Math.round(z.count*k*k);}
  for(const t of D.terrain||[])t.pts=S(t.pts,k);
  for(const key of Object.keys(D.extras||{}))D.extras[key]=D.extras[key].map(e=>e.pts?{...e,pts:S(e.pts,k)}:Array.isArray(e[0])?S(e,k):e.map(v=>typeof v==='number'?v*k:v));
 }
 if(D.outline){
  const inp=here(`${name}.split.json`),out=here(`${name}.pieces.json`);
  fs.writeFileSync(inp,JSON.stringify({outline:D.outline,cracks:D.cracks||[],eps:D.eps||10}));
  execFileSync('python3',[here('split.py').pathname,inp.pathname,out.pathname],{stdio:['ignore','ignore','inherit']});
  const pieces=JSON.parse(fs.readFileSync(out)).pieces;D.land={};pieces.forEach((p,i)=>{D.land[String.fromCharCode(97+i)]=p;});
  fs.unlinkSync(inp);
 }
 return D;
}
