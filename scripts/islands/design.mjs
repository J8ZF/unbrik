// Loads an island design in local coordinates (scaled if the design says so).
// A design may give one outline and crack lines instead of finished pieces;
// the pieces are then cut with split.py (OpenCV). Island 1 is the confirmed
// hand layout; its module keeps its own exports.
import fs from 'node:fs';
import {execFileSync} from 'node:child_process';
import * as I1 from './island1.mjs';
const here=f=>new URL(f,import.meta.url);
const S=(pts,k)=>pts.map(([x,y])=>[Math.round(x*k),Math.round(y*k)]);
const inside=(x,y,poly)=>{let c=false;for(let i=0,j=poly.length-1;i<poly.length;j=i++){const [xi,yi]=poly[i],[xj,yj]=poly[j];if(((yi>y)!==(yj>y))&&(x<(xj-xi)*(y-yi)/(yj-yi)+xi))c=!c;}return c;};
const centroid=pts=>[pts.reduce((a,p)=>a+p[0],0)/pts.length,pts.reduce((a,p)=>a+p[1],0)/pts.length];
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
  if(D.rockShelf){const sh=D.rockShelf;sh.ledge=Math.round((sh.ledge||40)*k);sh.shelf=Math.round((sh.shelf||200)*k);for(const key of ['blocks','shelfBlocks'])sh[key]=(sh[key]||[]).map(([cx,cy,w,h,a])=>[cx*k,cy*k,w*k,h*k,a]);}
  for(const key of Object.keys(D.extras||{}))D.extras[key]=D.extras[key].map(e=>e.pts?{...e,pts:S(e.pts,k)}:Array.isArray(e[0])?S(e,k):e.map(v=>typeof v==='number'?v*k:v));
 }
 if(D.outline){
  const inp=here(`${name}.split.json`),out=here(`${name}.pieces.json`);
  fs.writeFileSync(inp,JSON.stringify({outline:D.outline,cracks:D.cracks||[],eps:D.eps||10}));
  execFileSync('python3',[here('split.py').pathname,inp.pathname,out.pathname],{stdio:['ignore','ignore','inherit']});
  const pieces=JSON.parse(fs.readFileSync(out)).pieces;D.land={};pieces.forEach((p,i)=>{D.land[String.fromCharCode(97+i)]=p;});
  fs.unlinkSync(inp);
 }
 // a piece may turn: {at:[x,y] (local, inside the piece), ccw:deg (visually counter-clockwise), shift:[dx,dy]} — the piece and
 // every feature drawn on it (terrain, rock zones, tree anchors, sand bands, beach boxes) turn about the piece's centroid
 for(const rt of D.rotate||[]){
  const at=[rt.at[0]*k,rt.at[1]*k],key=Object.keys(D.land).find(n=>inside(at[0],at[1],D.land[n]));if(!key)throw Error('rotate: no piece at '+rt.at);
  const poly=D.land[key],c=centroid(poly),th=-rt.ccw*Math.PI/180,cos=Math.cos(th),sin=Math.sin(th),sh=(rt.shift||[0,0]).map(v=>v*k);
  const R=([x,y])=>[Math.round(c[0]+(x-c[0])*cos-(y-c[1])*sin+sh[0]),Math.round(c[1]+(x-c[0])*sin+(y-c[1])*cos+sh[1])];
  // inside the old piece, or (for shore features that sit on its outline) nearer to it than to any other piece
  const vdist=(pg,p)=>Math.min(...pg.map(q=>Math.hypot(q[0]-p[0],q[1]-p[1])));
  const was=p=>inside(p[0],p[1],poly)||Object.keys(D.land).every(n=>n===key||vdist(poly,p)<vdist(D.land[n],p));
  D.land[key]=poly.map(R);
  for(const t of D.terrain||[])if(was(centroid(t.pts)))t.pts=t.pts.map(R);
  for(const z of D.rockZones||[])if(was(centroid(z.area))){z.area=z.area.map(R);z.core=(z.core||[]).map(([cx,cy,w,h,a])=>{const [nx,ny]=R([cx,cy]);return [nx,ny,w,h,a-rt.ccw];});}
  for(const key2 of ['root','gate'])if(was(D.tree[key2]))D.tree[key2]=R(D.tree[key2]);
  D.tree.marks=D.tree.marks.map(m=>{const pt=m.at||m;if(!was(pt))return m;const q=R(pt);return m.at?{...m,at:q}:q;});
  D.sandBands=(D.sandBands||[]).map(b=>Array.isArray(b)||!was(b.from)?b:{...b,from:R(b.from),to:R(b.to)});
  D.beach=(D.beach||[]).map(([x0,y0,x1,y1,w])=>{if(!was([(x0+x1)/2,(y0+y1)/2]))return [x0,y0,x1,y1,w];const cs=[[x0,y0],[x1,y0],[x1,y1],[x0,y1]].map(R);return [Math.min(...cs.map(q=>q[0])),Math.min(...cs.map(q=>q[1])),Math.max(...cs.map(q=>q[0])),Math.max(...cs.map(q=>q[1])),w];});
  for(const key2 of ['holes','sandHoles'])D[key2]=(D[key2]||[]).map(pg=>was(centroid(pg))?pg.map(R):pg);
  if(D.rockShelf)for(const key2 of ['blocks','shelfBlocks'])D.rockShelf[key2]=(D.rockShelf[key2]||[]).map(([cx,cy,w,h,a])=>{if(!was([cx,cy]))return [cx,cy,w,h,a];const [nx,ny]=R([cx,cy]);return [nx,ny,w,h,a-rt.ccw];});
 }
 return D;
}
