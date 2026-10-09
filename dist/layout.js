// Geometry only: research prices, prerequisites and level caps are independent.
//
// Studies are laid out by their flow (SECTOR_ROWS in data.js) along eight
// directions around the center. The eight sectors are packed so their borders
// touch: five sit against the center, the three second sectors of a branch
// fill the bays between them. All eight together form one mainland. The land
// itself is derived from the cards: every point near a card is land, narrow
// water between neighbouring sectors is closed, and each land cell belongs to
// the sector of its nearest card. The coast and the sector borders are traced
// from that grid and straightened into irregular, angular polygons. Sector
// headings sit outside the coast so the island interior stays clear.
export const BRANCHES=[
 {chapters:[0,1],angle:-90},
 {chapters:[2],angle:-18},
 {chapters:[3,4],angle:54},
 {chapters:[5],angle:126},
 {chapters:[6,7],angle:198},
];
import {OBS_ART} from './observatory-art.js?v=4.0.0-dev.1';
// The centre node sits in the observatory's eye.
export const CENTER={x:OBS_ART.center[0],y:OBS_ART.center[1],radius:154,reach:OBS_ART.radius,core:OBS_ART.core};
export const CARD={halfWidth:73,halfHeight:59};
// Direction and distance from the center of each sector's first row.
export const PLACEMENT=[
 {angle:-90,radius:430},
 {angle:-54,radius:1170},
 {angle:-18,radius:430},
 {angle:54,radius:430},
 {angle:90,radius:1170},
 {angle:126,radius:430},
 {angle:198,radius:430},
 {angle:162,radius:1170},
];
// Land generation: grid cell size, how far the coast stands off the cards,
// the widest water channel that is closed between neighbouring sectors, the
// land disc around the center and how much the traced outlines are
// straightened. All in map units.
const CELL=40,COAST=84,CLOSE=230,CENTER_LAND=520,STRAIGHTEN=46,LABEL_OFFSET=70;
const DEFAULT_LAND={cell:CELL,coast:COAST,close:CLOSE,centerLand:CENTER_LAND,straighten:STRAIGHTEN,regionOf:n=>n.chapter};
export function boundsOf(nodes,padX=100,padY=90){
 return {minX:Math.min(...nodes.map(n=>n.x))-padX,maxX:Math.max(...nodes.map(n=>n.x))+padX,minY:Math.min(...nodes.map(n=>n.y))-padY,maxY:Math.max(...nodes.map(n=>n.y))+padY};
}
const cardDistance=(x,y,n)=>Math.hypot(Math.max(0,Math.abs(x-n.x)-CARD.halfWidth),Math.max(0,Math.abs(y-n.y)-CARD.halfHeight));
function offsets(radius,cell){const r=Math.ceil(radius/cell),list=[];for(let dj=-r;dj<=r;dj++)for(let di=-r;di<=r;di++)if(Math.hypot(di,dj)*cell<=radius)list.push([di,dj]);return list;}
// Grid of sector ids (-1 is water). Dilate the cards, erode back so only
// channels narrower than CLOSE stay filled, then keep COAST around the cards.
function rasterize(nodes,o=DEFAULT_LAND){
 const CELL=o.cell,COAST=o.coast,CLOSE=o.close,CENTER_LAND=o.centerLand;
 const reach=COAST+CLOSE+CELL*2,b=boundsOf(nodes,CARD.halfWidth+reach,CARD.halfHeight+reach);
 b.minX=Math.min(b.minX,-CENTER_LAND-reach);b.minY=Math.min(b.minY,-CENTER_LAND-reach);b.maxX=Math.max(b.maxX,CENTER_LAND+reach);b.maxY=Math.max(b.maxY,CENTER_LAND+reach);
 const originX=Math.floor(b.minX/CELL)*CELL,originY=Math.floor(b.minY/CELL)*CELL,cols=Math.ceil((b.maxX-originX)/CELL)+1,rows=Math.ceil((b.maxY-originY)/CELL)+1;
 const nearest=new Int16Array(cols*rows),distance=new Float32Array(cols*rows);
 for(let j=0;j<rows;j++)for(let i=0;i<cols;i++){
  const x=originX+(i+.5)*CELL,y=originY+(j+.5)*CELL;let best=Infinity,who=-1;
  for(const n of nodes){const d=cardDistance(x,y,n);if(d<best){best=d;who=o.regionOf(n);}}
  const k=j*cols+i;nearest[k]=who;distance[k]=Math.hypot(x,y)<=CENTER_LAND?Math.min(best,COAST):best;
 }
 const wide=new Uint8Array(cols*rows);for(let k=0;k<wide.length;k++)wide[k]=distance[k]<=COAST+CLOSE?1:0;
 const erode=offsets(CLOSE,CELL),land=new Int16Array(cols*rows).fill(-1);
 for(let j=0;j<rows;j++)for(let i=0;i<cols;i++){
  const k=j*cols+i;if(!wide[k])continue;let solid=true;
  for(const [di,dj] of erode){const ii=i+di,jj=j+dj;if(ii<0||jj<0||ii>=cols||jj>=rows||!wide[jj*cols+ii]){solid=false;break;}}
  if(solid)land[k]=nearest[k];
 }
 return {originX,originY,cols,rows,land,cell:CELL};
}
// Boundary segments between cells of different ids, chained between junctions
// (vertices where three or more areas meet) so a border shared by two sectors
// is straightened once and fits both of them exactly.
function trace(grid){
 const {originX,originY,cols,rows,land,cell:CELL}=grid,at=(i,j)=>(i<0||j<0||i>=cols||j>=rows)?-1:land[j*cols+i];
 const key=(i,j)=>i+','+j,edges=[];
 for(let j=0;j<=rows;j++)for(let i=0;i<=cols;i++){
  // Horizontal edge from (i,j) to (i+1,j): cells above (j-1) and below (j).
  if(i<cols){const up=at(i,j-1),down=at(i,j);if(up!==down)edges.push({a:[i,j],b:[i+1,j],left:up,right:down});}
  // Vertical edge from (i,j) to (i,j+1): cells left (i-1) and right (i).
  if(j<rows){const l=at(i-1,j),r=at(i,j);if(l!==r)edges.push({a:[i,j],b:[i,j+1],left:r,right:l});}
 }
 const degree=new Map();for(const e of edges)for(const v of [e.a,e.b]){const k=key(...v);degree.set(k,(degree.get(k)||0)+1);}
 const adjacency=new Map();for(const e of edges)for(const v of [e.a,e.b]){const k=key(...v);if(!adjacency.has(k))adjacency.set(k,[]);adjacency.get(k).push(e);}
 const used=new Set(),chains=[];
 const walk=(start,first)=>{
  const points=[start],pair=first.left+'|'+first.right;let v=start,e=first;
  while(true){
   used.add(e);const next=key(...e.a)===key(...v)?e.b:e.a;points.push(next);v=next;
   if(degree.get(key(...v))!==2||key(...v)===key(...start))break;
   // A vertex with exactly two boundary edges separates the same two areas
   // on both, so the chain simply continues along the other edge.
   e=adjacency.get(key(...v)).find(c=>!used.has(c));
   if(!e)break;
  }
  chains.push({points:points.map(([i,j])=>({x:originX+i*CELL,y:originY+j*CELL})),left:first.left,right:first.right});
 };
 for(const e of edges)if(!used.has(e)&&(degree.get(key(...e.a))!==2))walk(e.a,e);
 for(const e of edges)if(!used.has(e))walk(e.a,e);
 return chains;
}
function straighten(points,tolerance){
 if(points.length<3)return points;
 const closed=points[0].x===points.at(-1).x&&points[0].y===points.at(-1).y;
 const simplify=(list)=>{
  if(list.length<3)return list;
  const a=list[0],b=list.at(-1);let best=0,index=-1;
  const len=Math.hypot(b.x-a.x,b.y-a.y);
  for(let i=1;i<list.length-1;i++){const p=list[i];const d=len?Math.abs((b.x-a.x)*(a.y-p.y)-(a.x-p.x)*(b.y-a.y))/len:Math.hypot(p.x-a.x,p.y-a.y);if(d>best){best=d;index=i;}}
  if(best<=tolerance)return [a,b];
  return [...simplify(list.slice(0,index+1)).slice(0,-1),...simplify(list.slice(index))];
 };
 if(!closed)return simplify(points);
 // Closed loop without junctions: split at the farthest point from the start.
 let far=1,d=0;for(let i=1;i<points.length-1;i++){const dd=Math.hypot(points[i].x-points[0].x,points[i].y-points[0].y);if(dd>d){d=dd;far=i;}}
 return [...simplify(points.slice(0,far+1)).slice(0,-1),...simplify(points.slice(far))];
}
// Assemble each sector's outline from the chains that border it.
function assemble(chains,chapter){
 const mine=chains.filter(c=>c.left===chapter||c.right===chapter).map(c=>{
  // Orient so the sector lies on the left while walking.
  const points=c.left===chapter?c.points:c.points.slice().reverse();
  return {points,coast:c.left===-1||c.right===-1};
 });
 const loops=[],pool=mine.slice();
 while(pool.length){
  let current=pool.shift();const loop=[...current.points],coast=[];if(current.coast)coast.push(...current.points);
  const same=(p,q)=>Math.abs(p.x-q.x)<.5&&Math.abs(p.y-q.y)<.5;
  while(!same(loop[0],loop.at(-1))){
   const end=loop.at(-1),k=pool.findIndex(c=>same(c.points[0],end));
   if(k<0)break;
   current=pool.splice(k,1)[0];loop.push(...current.points.slice(1));if(current.coast)coast.push(...current.points);
  }
  if(same(loop[0],loop.at(-1)))loop.pop();
  loops.push({points:loop,coast});
 }
 const area=l=>Math.abs(l.points.reduce((s,p,i)=>{const q=l.points[(i+1)%l.points.length];return s+p.x*q.y-q.x*p.y;},0))/2;
 loops.sort((a,b)=>area(b)-area(a));
 return loops;
}
const pathOf=points=>points.map((p,i)=>`${i?'L':'M'} ${p.x} ${p.y}`).join(' ')+' Z';
export function createRadialLayout(nodes){
 const sectors=[];
 PLACEMENT.forEach((slot,chapter)=>{
  const a=slot.angle*Math.PI/180,direction={x:Math.cos(a),y:Math.sin(a)},side={x:-direction.y,y:direction.x};
  const branch=BRANCHES.findIndex(b=>b.chapters.includes(chapter)),members=nodes.filter(n=>n.chapter===chapter);
  for(const n of members){
   n.x=Math.round(direction.x*(slot.radius+n.localY)+side.x*n.localX);
   n.y=Math.round(direction.y*(slot.radius+n.localY)+side.y*n.localX);
   n.branch=branch;
  }
  sectors[chapter]={chapter,branch,direction,members};
 });
 const regions=buildLand(nodes,sectors.map(s=>({key:s.chapter,direction:s.direction})));
 for(const sector of sectors)Object.assign(sector,regions[sector.chapter]);
 return {sectors,bounds:boundsOf(nodes,260,240),mainland:sectors.map(s=>s.polygon)};
}
// Land for any set of cards: regions keyed by `regionOf(node)`, tiling one
// landmass, with an angular outline and a heading anchor outside the coast
// for each region. Used by the mainland and by the prestige flower.
export function buildLand(nodes,regionList,options={}){
 const o={...DEFAULT_LAND,...options},grid=rasterize(nodes,o),chains=trace(grid);
 for(const c of chains)c.points=straighten(c.points,o.straighten);
 const out={};
 for(const region of regionList){
  const loops=assemble(chains,region.key),outline=loops[0];
  if(!outline){out[region.key]={polygon:[],path:'',bounds:{minX:0,maxX:0,minY:0,maxY:0},label:{x:0,y:0,align:'center'},loops:0};continue;}
  const polygon=outline.points,bounds=boundsOf(polygon,0,0);
  // Heading: outside the coast, past the region's farthest coastal point.
  const centroid=polygon.reduce((s,p)=>({x:s.x+p.x/polygon.length,y:s.y+p.y/polygon.length}),{x:0,y:0});
  const coast=outline.coast.length?outline.coast:polygon;
  let anchor=coast[0],far=-Infinity;
  for(const p of coast){const d=p.x*region.direction.x+p.y*region.direction.y;if(d>far){far=d;anchor=p;}}
  const len=Math.hypot(anchor.x-centroid.x,anchor.y-centroid.y)||1,nx=(anchor.x-centroid.x)/len,ny=(anchor.y-centroid.y)/len;
  // Text hangs away from the coast: centered when the coast is above or
  // below, otherwise starting (or ending) at the anchor.
  const sideways=Math.abs(nx)>.55,align=sideways?(nx>0?'left':'right'):'center';
  const label={x:Math.round(anchor.x+nx*LABEL_OFFSET),y:Math.round(anchor.y+ny*LABEL_OFFSET-15),align};
  out[region.key]={bounds,polygon,path:pathOf(polygon),label,loops:loops.length};
 }
 return out;
}
// Where a link leaves a card: on the card border, aimed at the other card.
function port(node,towards){
 const dx=towards.x-node.x,dy=towards.y-node.y,t=Math.min(78/Math.max(.001,Math.abs(dx)),64/Math.max(.001,Math.abs(dy)));
 return {x:node.x+dx*t,y:node.y+dy*t};
}
export function connectionPath(from,to,sectors){
 const a=port(from,to),b=port(to,from),distance=Math.hypot(b.x-a.x,b.y-a.y);
 if(from.chapter!==to.chapter){
  // Gate to the next sector's root: leave along the finished sector's flow,
  // arrive along the new sector's flow.
  const da=sectors[from.chapter].direction,db=sectors[to.chapter].direction,bend=Math.min(420,distance*.4);
  return `M ${a.x} ${a.y} C ${a.x+da.x*bend} ${a.y+da.y*bend}, ${b.x-db.x*bend} ${b.y-db.y*bend}, ${b.x} ${b.y}`;
 }
 const d=sectors[to.chapter].direction,bend=Math.min(150,distance*.45);
 return `M ${a.x} ${a.y} C ${a.x+d.x*bend} ${a.y+d.y*bend}, ${b.x-d.x*bend} ${b.y-d.y*bend}, ${b.x} ${b.y}`;
}
export function centerPath(node){
 const distance=Math.hypot(node.x,node.y),end=port(node,CENTER);
 return `M ${node.x/distance*(CENTER.radius+16)} ${node.y/distance*(CENTER.radius+16)} L ${end.x} ${end.y}`;
}
