// Geometry only: research prices, prerequisites and level caps are independent.
export const BRANCHES=[
 {chapters:[0,1],angle:-90},
 {chapters:[2],angle:-18},
 {chapters:[3,4],angle:54},
 {chapters:[5],angle:126},
 {chapters:[6,7],angle:198},
];
export const CENTER={x:0,y:0,radius:154};
export function boundsOf(nodes,padX=100,padY=90){return {minX:Math.min(...nodes.map(n=>n.x))-padX,maxX:Math.max(...nodes.map(n=>n.x))+padX,minY:Math.min(...nodes.map(n=>n.y))-padY,maxY:Math.max(...nodes.map(n=>n.y))+padY};}
function hull(points){
 const sorted=points.slice().sort((a,b)=>a.x-b.x||a.y-b.y),cross=(o,a,b)=>(a.x-o.x)*(b.y-o.y)-(a.y-o.y)*(b.x-o.x);
 const half=list=>{const result=[];for(const p of list){while(result.length>1&&cross(result.at(-2),result.at(-1),p)<=0)result.pop();result.push(p);}return result;};
 return [...half(sorted).slice(0,-1),...half(sorted.slice().reverse()).slice(0,-1)];
}
export function createRadialLayout(nodes){
 const sectors=[];
 BRANCHES.forEach((branch,branchIndex)=>{
  const a=branch.angle*Math.PI/180,direction={x:Math.cos(a),y:Math.sin(a)},side={x:-direction.y,y:direction.x};let radius=430;
  for(const chapter of branch.chapters){
   const members=nodes.filter(n=>n.chapter===chapter);
   for(const n of members){n.x=Math.round(direction.x*(radius+n.localY)+side.x*n.localX);n.y=Math.round(direction.y*(radius+n.localY)+side.y*n.localX);n.branch=branchIndex;}
   const points=members.flatMap(n=>[-108,108].flatMap(dx=>[-91,91].map(dy=>({x:n.x+dx,y:n.y+dy}))));
   const polygon=hull(points),bounds=boundsOf(polygon,0,0);
   sectors[chapter]={chapter,branch:branchIndex,direction,members,bounds,polygon,path:polygon.map((p,i)=>`${i?'L':'M'} ${p.x} ${p.y}`).join(' ')+' Z',label:{x:(bounds.minX+bounds.maxX)/2,y:bounds.minY-46}};
   radius+=Math.max(...members.map(n=>n.localY))+340;
  }
 });
 return {sectors,bounds:boundsOf(nodes,200,180)};
}
function port(node,towards){const dx=towards.x-node.x,dy=towards.y-node.y,t=Math.min(78/Math.max(.001,Math.abs(dx)),64/Math.max(.001,Math.abs(dy)));return {x:node.x+dx*t,y:node.y+dy*t};}
export function connectionPath(from,to,sectors){
 const a=port(from,to),b=port(to,from),distance=Math.hypot(b.x-a.x,b.y-a.y);
 if(from.branch!==to.branch){const da=sectors[from.chapter].direction,db=sectors[to.chapter].direction;return `M ${a.x} ${a.y} C ${da.x*240} ${da.y*240}, ${db.x*240} ${db.y*240}, ${b.x} ${b.y}`;}
 const d=sectors[to.chapter].direction,bend=Math.min(150,distance*.45);
 return `M ${a.x} ${a.y} C ${a.x+d.x*bend} ${a.y+d.y*bend}, ${b.x-d.x*bend} ${b.y-d.y*bend}, ${b.x} ${b.y}`;
}
export function centerPath(node){const distance=Math.hypot(node.x,node.y),end=port(node,CENTER);return `M ${node.x/distance*(CENTER.radius+16)} ${node.y/distance*(CENTER.radius+16)} L ${end.x} ${end.y}`;}
