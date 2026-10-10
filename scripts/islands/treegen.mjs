// Free-branching study trees on an island. Cards are scattered over the land
// (dart throwing with a minimum spacing, the whole card on one piece of land
// with a margin to the shore), then a tree grows from the start card along
// short links; a link is only taken when it crosses no link already in the
// tree and passes under no card, so the tree stays planar and never merges.
// Pieces of a split island are joined by longer links over the water. The
// last card and the landmark cards are placed first and reached first; a
// landmark keeps room round itself for its building. Ids run in growth
// order; the last card gets the final id.
import {rng,inside,edgeDist} from './art.mjs';
const CW=146,CH=118;
const side=(a,b,c)=>Math.sign((b.x-a.x)*(c.y-a.y)-(b.y-a.y)*(c.x-a.x));
const crosses=(a,b,c,d)=>side(a,b,c)*side(a,b,d)<0&&side(c,d,a)*side(c,d,b)<0;
export function genTree({land,holes=[],avoid=[],root,gate,marks=[],count,seed=1,spacing=262,margin=42,link=440,bridge=620,tries=40000}){
 const r=rng(seed);
 const xs=land.flat().map(p=>p[0]),ys=land.flat().map(p=>p[1]),x0=Math.min(...xs),x1=Math.max(...xs),y0=Math.min(...ys),y1=Math.max(...ys);
 const pieceOf=(x,y)=>{for(let i=0;i<land.length;i++)if(inside(x,y,land[i])&&edgeDist(x,y,land[i])>=margin)return i;return -1;};
 const blocked=(x,y)=>holes.some(p=>inside(x,y,p)||edgeDist(x,y,p)<margin)||avoid.some(b=>x>b[0]-CW/2-margin&&x<b[2]+CW/2+margin&&y>b[1]-CH/2-margin&&y<b[3]+CH/2+margin);
 const fits=(x,y)=>{let piece=-1;for(const fx of [-1,-.5,0,.5,1])for(const fy of [-1,-.5,0,.5,1]){const p=pieceOf(x+fx*CW/2,y+fy*CH/2);if(p<0||(piece>=0&&p!==piece))return -1;piece=p;}return blocked(x,y)?-1:piece;};
 // fixed cards first: the start, the last, the landmarks (snapped to the nearest fitting spot)
 const pts=[];
 const settle=([x,y])=>{for(let R=0;R<400;R+=12)for(let k=0;k<(R?16:1);k++){const a=k/16*6.283,px=Math.round(x+Math.cos(a)*R),py=Math.round(y+Math.sin(a)*R),piece=fits(px,py);if(piece>=0&&pts.every(q=>Math.abs(q.x-px)>=158&&Math.abs(q.y-py)>=130||Math.hypot(q.x-px,q.y-py)>=spacing)){pts.push({x:px,y:py,piece,fixed:true});return pts.length-1;}}throw Error('tree: no room for a required card near '+x+','+y);};
 const R=settle(root),G=settle(gate),M=marks.map(m=>settle(m.at||m)),FREE=marks.map(m=>m.free||'side');
 const roomTaken=(x,y)=>M.some((k,i)=>{const m=pts[k],f=FREE[i];if(f==='none')return false;if(f==='all')return Math.hypot(x-m.x,y-m.y)<spacing*1.35;return Math.abs(x-m.x)<spacing*1.5&&Math.abs(y-m.y)<150;});
 // scatter the rest
 const ok=(x,y)=>pts.every(q=>Math.hypot(q.x-x,q.y-y)>=spacing)&&!roomTaken(x,y);
 for(let t=0;t<tries;t++){const x=Math.round(x0+r()*(x1-x0)),y=Math.round(y0+r()*(y1-y0));if(!ok(x,y))continue;const piece=fits(x,y);if(piece<0)continue;pts.push({x,y,piece,fixed:false});}
 if(pts.length<count)throw Error(`tree: only ${pts.length} cards fit, ${count} wanted`);
 // candidate links: short on land, longer over the water, never passing under a third card
 const underCard=(a,b)=>{for(const p of pts){if(p===a||p===b)continue;for(let t=0;t<=1;t+=.02){const x=a.x+(b.x-a.x)*t,y=a.y+(b.y-a.y)*t;if(Math.abs(x-p.x)<CW/2+28&&Math.abs(y-p.y)<CH/2+26)return true;}}return false;};
 const adj=pts.map(()=>[]);
 pts.forEach((p,u)=>pts.forEach((q,v)=>{if(v<=u)return;const d=Math.hypot(q.x-p.x,q.y-p.y),max=p.piece===q.piece?link:bridge;if(d>max||underCard(p,q))return;adj[u].push({v,d});adj[v].push({v:u,d});}));
 const parent=new Int32Array(pts.length).fill(-1),inTree=new Uint8Array(pts.length),order=[],edges=[];
 const clearOf=(u,v)=>edges.every(([a,b])=>a===u||b===u||a===v||b===v||!crosses(pts[a],pts[b],pts[u],pts[v]));
 const add=(k,p)=>{inTree[k]=1;parent[k]=p;order.push(k);if(p>=0)edges.push([p,k]);};
 add(R,-1);
 const required=new Set([G,...M]);
 // shortest path (by hops) from the tree to a target, over links that cross nothing in the tree
 function reach(target){if(inTree[target])return;const prev=new Int32Array(pts.length).fill(-2),q=[];for(let k=0;k<pts.length;k++)if(inTree[k]&&!required.has(k)){prev[k]=-1;q.push(k);}
  while(q.length){const u=q.shift();for(const {v} of adj[u]){if(prev[v]!==-2||inTree[v])continue;if(v!==target&&required.has(v))continue;if(!clearOf(u,v))continue;prev[v]=u;if(v===target){q.length=0;break;}q.push(v);}}
  if(prev[target]===-2)throw Error('tree: cannot reach a required card at '+pts[target].x+','+pts[target].y);
  const path=[];for(let v=target;prev[v]!==-1;v=prev[v])path.push(v);path.reverse();let p=prev[path[0]];for(const v of path){if(!clearOf(p,v))throw Error('tree: path crosses itself');add(v,p);p=v;}}
 for(const m of M)reach(m);reach(G);
 if(order.length>count)throw Error(`tree: required paths need ${order.length} cards, more than ${count}`);
 // grow: a random frontier link, short links and parents with few children preferred
 const kids=new Int32Array(pts.length);for(const k of order)if(parent[k]>=0)kids[parent[k]]++;
 while(order.length<count){const fr=[];for(const u of order){if(required.has(u))continue;for(const {v,d} of adj[u])if(!inTree[v]&&clearOf(u,v))fr.push([u,v,d]);}
  if(!fr.length)throw Error(`tree: stuck at ${order.length} of ${count} cards (${pts.length} spots)`);
  const w=fr.map(([u,v,d])=>(d<spacing*1.3?1:d<link?.45:.2)/(1+kids[u]*1.4));let t=r()*w.reduce((a,b)=>a+b,0),pick=fr[0];for(let i=0;i<fr.length;i++){t-=w[i];if(t<=0){pick=fr[i];break;}}
  add(pick[1],pick[0]);kids[pick[0]]++;}
 // ids: growth order, the gate last
 const ids=new Map();let n=1;for(const k of order)if(k!==G)ids.set(k,n++);ids.set(G,n);
 const nodes=order.map(k=>[ids.get(k),pts[k].x,pts[k].y,parent[k]>=0?[ids.get(parent[k])]:[]]).sort((a,b)=>a[0]-b[0]);
 return {nodes,gate:ids.get(G),marks:M.map(k=>ids.get(k)),spots:pts.length,used:order.length,bridges:edges.filter(([a,b])=>pts[a].piece!==pts[b].piece).length};
}
