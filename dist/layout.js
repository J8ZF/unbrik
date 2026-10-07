// Geometry only: research prices, prerequisites and level caps are independent.
export const BRANCHES=[
 {chapters:[0,1],angle:-90},
 {chapters:[2],angle:-18},
 {chapters:[3,4],angle:54},
 {chapters:[5],angle:126},
 {chapters:[6,7],angle:198},
];
export const CENTER={x:0,y:0,radius:154};
// Ordered research layers follow each island's own course. These coordinates
// change presentation only; data.js owns every prerequisite and price.
const ISLAND_ROWS=[
 [[0,-390,0],[0,-570,128],[18,-760,145],[12,-950,120],[0,-1130,0]],
 [[0,-1480,0],[-20,-1700,125],[-105,-1930,140],[-290,-2110,135],[-525,-2190,125],[-765,-2140,120],[-970,-1990,0]],
 [[455,-155,0],[665,-205,0],[880,-275,125],[1105,-400,135],[1360,-420,140],[1600,-320,135],[1770,-110,120],[1795,120,0],[1690,315,0]],
 [[290,420,0],[485,630,120],[700,835,155],[930,990,170],[1150,1180,145],[1340,1390,120],[1460,1610,0],[1450,1830,0]],
 [[1400,2180,0],[1160,2195,130],[920,2310,135],[670,2330,130],[420,2330,115],[175,2380,125],[-55,2530,135],[-180,2750,0]],
 [[-350,440,0],[-450,665,108],[-485,890,116],[-505,1120,118],[-590,1355,110],[-755,1550,112],[-955,1710,105],[-1190,1760,0]],
 [[-455,-105,0],[-685,-140,125],[-920,-105,125],[-1160,-90,130],[-1365,-270,145],[-1450,-530,130],[-1320,-780,120],[-1070,-905,0],[-840,-920,0]],
 [[-1130,-1260,0],[-1370,-1340,130],[-1610,-1470,140],[-1845,-1630,180],[-2070,-1840,155],[-2200,-2090,125],[-2140,-2340,115],[-1920,-2510,0],[-1700,-2600,0]],
];
export function boundsOf(nodes,padX=100,padY=90){return {minX:Math.min(...nodes.map(n=>n.x))-padX,maxX:Math.max(...nodes.map(n=>n.x))+padX,minY:Math.min(...nodes.map(n=>n.y))-padY,maxY:Math.max(...nodes.map(n=>n.y))+padY};}
function hull(points){
 const sorted=points.slice().sort((a,b)=>a.x-b.x||a.y-b.y),cross=(o,a,b)=>(a.x-o.x)*(b.y-o.y)-(a.y-o.y)*(b.x-o.x);
 const half=list=>{const result=[];for(const p of list){while(result.length>1&&cross(result.at(-2),result.at(-1),p)<=0)result.pop();result.push(p);}return result;};
 return [...half(sorted).slice(0,-1),...half(sorted.slice().reverse()).slice(0,-1)];
}
export function createRadialLayout(nodes){
 const sectors=[];
 BRANCHES.forEach((branch,branchIndex)=>{
  const a=branch.angle*Math.PI/180,direction={x:Math.cos(a),y:Math.sin(a)};
  for(const chapter of branch.chapters){
   const members=nodes.filter(n=>n.chapter===chapter),rows=ISLAND_ROWS[chapter];
   const groups=[...new Set(members.map(n=>n.localY))].map(y=>members.filter(n=>n.localY===y));
   groups.forEach((group,i)=>{
    const [x,y,width]=rows[i],before=rows[Math.max(0,i-1)],after=rows[Math.min(rows.length-1,i+1)];
    const dx=after[0]-before[0],dy=after[1]-before[1],length=Math.hypot(dx,dy),normal={x:-dy/length,y:dx/length};
    group.forEach((n,j)=>{const side=group.length===1?0:(j?1:-1);n.x=Math.round(x+normal.x*width*side);n.y=Math.round(y+normal.y*width*side);n.branch=branchIndex;n.mapRow=i;n.rowCenter={x,y};});
   });
   const envelopes=groups.map(group=>group.flatMap(n=>[-105,105].flatMap(dx=>[-86,86].map(dy=>({x:n.x+dx,y:n.y+dy})))));
   const coast=envelopes.slice(1).map((points,i)=>hull([...envelopes[i],...points]));
   const polygon=coastline(coast),bounds=boundsOf(polygon,0,0);
   sectors[chapter]={chapter,branch:branchIndex,direction,members,bounds,polygon,path:polygon.map((p,i)=>`${i?'L':'M'} ${p.x} ${p.y}`).join(' ')+' Z',label:{x:(bounds.minX+bounds.maxX)/2,y:bounds.minY-76}};
  }
 });
 return {sectors,bounds:boundsOf(nodes,200,180)};
}
const cross=(a,b)=>a.x*b.y-a.y*b.x;
const sub=(a,b)=>({x:a.x-b.x,y:a.y-b.y});
const inside=(p,poly)=>poly.every((a,i)=>cross(sub(poly[(i+1)%poly.length],a),sub(p,a))>=-1e-7);
// Union of the padded strips between neighbouring research layers. The coast
// follows the actual course, preserving bays instead of filling a convex blob.
function coastline(polygons){
 const edges=polygons.flatMap(poly=>poly.map((a,i)=>({a,b:poly[(i+1)%poly.length],poly}))),pieces=new Map();
 const key=p=>`${Math.round(p.x*1000)},${Math.round(p.y*1000)}`;
 for(const edge of edges){
  const {a,b}=edge,d=sub(b,a),length=Math.hypot(d.x,d.y),cuts=[0,1];
  for(const other of edges){const e=sub(other.b,other.a),den=cross(d,e);if(Math.abs(den)<1e-8)continue;const delta=sub(other.a,a),t=cross(delta,e)/den,u=cross(delta,d)/den;if(t>1e-8&&t<1-1e-8&&u>=-1e-8&&u<=1+1e-8)cuts.push(t);}
  cuts.sort((x,y)=>x-y);
  for(let i=1;i<cuts.length;i++){
   if(cuts[i]-cuts[i-1]<1e-8)continue;
   const point=t=>({x:a.x+d.x*t,y:a.y+d.y*t}),p=point(cuts[i-1]),q=point(cuts[i]),mid=point((cuts[i-1]+cuts[i])/2);
   mid.x+=d.y/length*.01;mid.y-=d.x/length*.01;
   if(polygons.some(poly=>poly!==edge.poly&&inside(mid,poly)))continue;
   pieces.set(key(p)+'>'+key(q),{p,q});
  }
 }
 const remaining=[...pieces.values()],result=[];
 let current=remaining.shift();if(!current)return [];
 const start=key(current.p);result.push(current.p);
 for(let guard=0;guard<1000;guard++){
  if(key(current.q)===start)break;result.push(current.q);
  const index=remaining.findIndex(e=>key(e.p)===key(current.q));
  if(index<0)throw new Error('Unclosed island coastline');
  current=remaining.splice(index,1)[0];
 }
 return result;
}
function port(node,towards){const dx=towards.x-node.x,dy=towards.y-node.y,t=Math.min(78/Math.max(.001,Math.abs(dx)),64/Math.max(.001,Math.abs(dy)));return {x:node.x+dx*t,y:node.y+dy*t};}
const CROSS_ROUTES={
 21:[[-650,-1780],[-400,-1500],[-400,-600],[-360,-440],[-180,-235],[260,-230]],
 62:[[-460,2690],[-420,2050],[-40,1910],[-80,600],[-200,350]],
 76:[[-1420,1530],[-1520,850],[-1050,240],[-700,170]],
};
function channelPath(from,to,channel){
 const points=channel.map(([x,y])=>({x,y}));points.unshift(port(from,points[0]));points.push(port(to,points.at(-1)));
 let path=`M ${points[0].x} ${points[0].y}`;
 for(let i=1;i<points.length-1;i++){
  const a=points[i-1],p=points[i],b=points[i+1],da=Math.hypot(a.x-p.x,a.y-p.y),db=Math.hypot(b.x-p.x,b.y-p.y),r=Math.min(65,da/3,db/3);
  const before={x:p.x+(a.x-p.x)*r/da,y:p.y+(a.y-p.y)*r/da},after={x:p.x+(b.x-p.x)*r/db,y:p.y+(b.y-p.y)*r/db};
  path+=` L ${before.x} ${before.y} Q ${p.x} ${p.y}, ${after.x} ${after.y}`;
 }
 return path+` L ${points.at(-1).x} ${points.at(-1).y}`;
}
export function connectionPath(from,to,sectors){
 if(from.chapter===to.chapter){
  const p=from.rowCenter,q=to.rowCenter,joint={x:(p.x+q.x)/2,y:(p.y+q.y)/2};
  const a=port(from,joint),b=port(to,joint),dx=q.x-p.x,dy=q.y-p.y;
  return `M ${a.x} ${a.y} Q ${joint.x-dx*.18} ${joint.y-dy*.18}, ${joint.x} ${joint.y} Q ${joint.x+dx*.18} ${joint.y+dy*.18}, ${b.x} ${b.y}`;
 }
 const a=port(from,to),b=port(to,from);
 if(from.branch!==to.branch){if(CROSS_ROUTES[to.id])return channelPath(from,to,CROSS_ROUTES[to.id]);const da=sectors[from.chapter].direction,db=sectors[to.chapter].direction;return `M ${a.x} ${a.y} C ${da.x*240} ${da.y*240}, ${db.x*240} ${db.y*240}, ${b.x} ${b.y}`;}
 return `M ${a.x} ${a.y} L ${b.x} ${b.y}`;
}
export function centerPath(node){const distance=Math.hypot(node.x,node.y),end=port(node,CENTER);return `M ${node.x/distance*(CENTER.radius+16)} ${node.y/distance*(CENTER.radius+16)} L ${end.x} ${end.y}`;}
