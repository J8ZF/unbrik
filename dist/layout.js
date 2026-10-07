// Geometry only: research prices, prerequisites and level caps are independent.
export const BRANCHES=[
 {chapters:[0,1],angle:-90},
 {chapters:[2],angle:-18},
 {chapters:[3,4],angle:54},
 {chapters:[5],angle:126},
 {chapters:[6,7],angle:198},
];
export const CENTER={x:0,y:0,radius:154};
// Broad, staggered research clusters. Empty space between rows and around the
// outer shoulders remains available for future bonus research.
const SECTOR_ROWS={8:[1,3,3,1],12:[1,3,4,3,1],13:[1,4,3,4,1],14:[1,4,4,4,1],15:[1,4,5,4,1]};
// Within each row, related branches sit together to keep links short.
const SECTOR_ORDER={
 2:[0,3,1,2,4,5,8,6,7,10,12,11,9,13],
 3:[0,3,2,4,1,5,6,7,8,9,11,10,12],
 4:[0,2,3,4,1,7,6,8,5,11,10,9,12,13],
 6:[0,2,3,4,1,7,6,8,5,9,10,11,13,12,14],
 7:[0,2,3,4,1,7,6,8,5,9,10,11,13,12,14]
};
export function arrangeSector(members){
 if(members[0].chapter===5){
  // ALGORITHMS follows its two-branch dependency levels. A narrow, gently
  // varying spine separates its heading from ARCHITECTURE above it.
  const widths=[0,165,185,170,190,170,180,0];let index=0;
  for(let row=0;row<widths.length;row++){
   const count=row===0||row===widths.length-1?1:2;
   for(let col=0;col<count;col++){const n=members[index++];n.localX=count===1?0:(col?1:-1)*widths[row];n.localY=row*190;}
  }return;
 }
 const rows=SECTOR_ROWS[members.length];if(!rows)throw Error('Missing sector layout');
 const order=SECTOR_ORDER[members[0].chapter],arranged=order?order.map(i=>members[i]):members;
 let i=0;rows.forEach((count,row)=>{for(let col=0;col<count;col++){
  const n=arranged[i++];n.localX=(col-(count-1)/2)*250;n.localY=row*240;
 }});
}
export function boundsOf(nodes,padX=100,padY=90){return {minX:Math.min(...nodes.map(n=>n.x))-padX,maxX:Math.max(...nodes.map(n=>n.x))+padX,minY:Math.min(...nodes.map(n=>n.y))-padY,maxY:Math.max(...nodes.map(n=>n.y))+padY};}
function hull(points){
 const sorted=points.slice().sort((a,b)=>a.x-b.x||a.y-b.y),cross=(o,a,b)=>(a.x-o.x)*(b.y-o.y)-(a.y-o.y)*(b.x-o.x);
 const half=list=>{const result=[];for(const p of list){while(result.length>1&&cross(result.at(-2),result.at(-1),p)<=0)result.pop();result.push(p);}return result;};
 return [...half(sorted).slice(0,-1),...half(sorted.slice().reverse()).slice(0,-1)];
}
export function createRadialLayout(nodes){
 const sectors=[];
 BRANCHES.forEach((branch,branchIndex)=>{
  const a=branch.angle*Math.PI/180,direction={x:Math.cos(a),y:Math.sin(a)},side={x:-direction.y,y:direction.x};let radius=branchIndex===3?600:480;
  for(const chapter of branch.chapters){
   const members=nodes.filter(n=>n.chapter===chapter);
   arrangeSector(members);
   for(const n of members){n.x=Math.round(direction.x*(radius+n.localY)+side.x*n.localX);n.y=Math.round(direction.y*(radius+n.localY)+side.y*n.localX);n.branch=branchIndex;}
   const points=members.flatMap(n=>[-108,108].flatMap(dx=>[-91,91].map(dy=>({x:n.x+dx,y:n.y+dy}))));
   const polygon=hull(points),bounds=boundsOf(polygon,0,0);
   sectors[chapter]={chapter,branch:branchIndex,direction,members,bounds,polygon,path:polygon.map((p,i)=>`${i?'L':'M'} ${p.x} ${p.y}`).join(' ')+' Z',label:{x:(bounds.minX+bounds.maxX)/2,y:bounds.minY-(chapter===3?30:46)}};
   radius+=Math.max(...members.map(n=>n.localY))+340;
  }
 });
 return {sectors,bounds:boundsOf(nodes,200,180)};
}
function port(node,towards){const dx=towards.x-node.x,dy=towards.y-node.y;return Math.abs(dx)/85>Math.abs(dy)/71?{x:node.x+Math.sign(dx)*85,y:node.y}:{x:node.x,y:node.y+Math.sign(dy)*71};}
const routeCache=new WeakMap();
export function segmentHitsBox(a,b,r){
 let low=0,high=1;
 for(const [key,min,max]of [['x',r.minX,r.maxX],['y',r.minY,r.maxY]]){
  const d=b[key]-a[key];if(Math.abs(d)<1e-8){if(a[key]<=min||a[key]>=max)return false;continue;}
  let t0=(min-a[key])/d,t1=(max-a[key])/d;if(t0>t1)[t0,t1]=[t1,t0];low=Math.max(low,t0);high=Math.min(high,t1);if(high<=low)return false;
 }return high>0&&low<1;
}
function cubicPoint(a,c,d,b,t){const u=1-t;return {x:u*u*u*a.x+3*u*u*t*c.x+3*u*t*t*d.x+t*t*t*b.x,y:u*u*u*a.y+3*u*u*t*c.y+3*u*t*t*d.y+t*t*t*b.y};}
function roundedPath(points){
 let path=`M ${points[0].x} ${points[0].y}`;
 for(let i=1;i<points.length-1;i++){const a=points[i-1],b=points[i],c=points[i+1],ab=Math.hypot(b.x-a.x,b.y-a.y),bc=Math.hypot(c.x-b.x,c.y-b.y),r=Math.min(8,ab/3,bc/3),before={x:b.x+(a.x-b.x)*r/ab,y:b.y+(a.y-b.y)*r/ab},after={x:b.x+(c.x-b.x)*r/bc,y:b.y+(c.y-b.y)*r/bc};path+=` L ${before.x} ${before.y} Q ${b.x} ${b.y} ${after.x} ${after.y}`;}
 return path+` L ${points.at(-1).x} ${points.at(-1).y}`;
}
function routeAroundCards(a,b,obstacles){
 const clear=(p,q)=>!obstacles.some(o=>segmentHitsBox(p,q,o));
 const points=[a,b,...obstacles.flatMap(o=>[o.minX-1,o.maxX+1].flatMap(x=>[o.minY-1,o.maxY+1].map(y=>({x,y}))))].filter((p,i)=>i<2||!obstacles.some(o=>p.x>o.minX&&p.x<o.maxX&&p.y>o.minY&&p.y<o.maxY));
 const distance=points.map(()=>Infinity),previous=points.map(()=>-1),visited=new Set();distance[0]=0;
 for(let count=0;count<points.length;count++){
  let current=-1;for(let i=0;i<points.length;i++)if(!visited.has(i)&&(current<0||distance[i]<distance[current]))current=i;
  if(current<0||!Number.isFinite(distance[current]))break;if(current===1)break;visited.add(current);
  for(let next=0;next<points.length;next++){if(visited.has(next))continue;const d=distance[current]+Math.hypot(points[next].x-points[current].x,points[next].y-points[current].y);if(d<distance[next]&&clear(points[current],points[next])){distance[next]=d;previous[next]=current;}}
 }
 if(!Number.isFinite(distance[1]))throw Error('Research path has no clear route');
 const result=[];for(let i=1;i>=0;i=previous[i]){result.unshift(points[i]);if(i===0)break;}return roundedPath(result);
}
export function connectionPath(from,to,sectors){
 let cache=routeCache.get(sectors);if(!cache){cache=new Map();routeCache.set(sectors,cache);}const key=from.id+':'+to.id;if(cache.has(key))return cache.get(key);
 const a=port(from,to),b=port(to,from),bend=Math.min(130,Math.hypot(b.x-a.x,b.y-a.y)*.4),c={x:a.x+Math.sign(a.x-from.x)*bend,y:a.y+Math.sign(a.y-from.y)*bend},d={x:b.x+Math.sign(b.x-to.x)*bend,y:b.y+Math.sign(b.y-to.y)*bend};
 const nodes=sectors.flatMap(s=>s.members),obstacles=nodes.map(n=>{const endpoint=n.id===from.id||n.id===to.id,px=endpoint?79:91,py=endpoint?65:77;return {minX:n.x-px,maxX:n.x+px,minY:n.y-py,maxY:n.y+py};});
 // Retain short cubic links when clear; route longer links through the reserved
 // gutters. Research dependencies are never changed to make the map fit.
 let last=a,blocked=false;for(let i=1;i<=40;i++){const next=cubicPoint(a,c,d,b,i/40);if(obstacles.some(o=>segmentHitsBox(last,next,o))){blocked=true;break;}last=next;}
 const corridor={minX:Math.min(a.x,b.x)-280,maxX:Math.max(a.x,b.x)+280,minY:Math.min(a.y,b.y)-280,maxY:Math.max(a.y,b.y)+280};
 const relevant=obstacles.filter(o=>o.maxX>corridor.minX&&o.minX<corridor.maxX&&o.maxY>corridor.minY&&o.minY<corridor.maxY);
 const path=blocked?routeAroundCards(a,b,relevant):`M ${a.x} ${a.y} C ${c.x} ${c.y}, ${d.x} ${d.y}, ${b.x} ${b.y}`;cache.set(key,path);return path;
}
export function centerPath(node){const distance=Math.hypot(node.x,node.y),end=port(node,CENTER);return `M ${node.x/distance*(CENTER.radius+16)} ${node.y/distance*(CENTER.radius+16)} L ${end.x} ${end.y}`;}
