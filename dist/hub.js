import {BRAND_PATH} from './brand.js?v=2.2-prep';
// Regular dodecahedron. Face adjacency, not vertex depth, determines visibility.
const phi=(1+Math.sqrt(5))/2,inv=1/phi;
export const VERTICES=[];
for(const x of [-1,1])for(const y of [-1,1])for(const z of [-1,1])VERTICES.push([x,y,z]);
for(const a of [-1,1])for(const b of [-1,1])VERTICES.push([0,a*inv,b*phi],[a*inv,b*phi,0],[a*phi,0,b*inv]);
const sub=(a,b)=>a.map((v,i)=>v-b[i]);
const dot=(a,b)=>a.reduce((s,v,i)=>s+v*b[i],0);
const cross=(a,b)=>[a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]];
export const EDGES=[];
for(let i=0;i<20;i++)for(let j=i+1;j<20;j++)if(Math.abs(Math.hypot(...sub(VERTICES[i],VERTICES[j]))-2*inv)<1e-6)EDGES.push([i,j]);
const faces=new Map();
for(let i=0;i<18;i++)for(let j=i+1;j<19;j++)for(let k=j+1;k<20;k++){
 let normal=cross(sub(VERTICES[j],VERTICES[i]),sub(VERTICES[k],VERTICES[i]));const length=Math.hypot(...normal);if(length<1e-8)continue;
 normal=normal.map(v=>v/length);if(dot(normal,VERTICES[i])<0)normal=normal.map(v=>-v);
 const distance=dot(normal,VERTICES[i]);if(VERTICES.some(v=>dot(normal,v)>distance+1e-7))continue;
 const indices=VERTICES.map((v,id)=>Math.abs(dot(normal,v)-distance)<1e-7?id:-1).filter(id=>id>=0);if(indices.length===5)faces.set(indices.join(','),{indices,normal,center:normal.map(v=>v*distance)});
}
export const FACES=[...faces.values()];
export const EDGE_FACES=EDGES.map(([a,b])=>FACES.flatMap((f,i)=>f.indices.includes(a)&&f.indices.includes(b)?[i]:[]));
export function projectHub(seconds=0){
 const a=.55+seconds*.12,b=.4+seconds*.19,ca=Math.cos(a),sa=Math.sin(a),cb=Math.cos(b),sb=Math.sin(b);
 const rotate=([x,y,z])=>{const u=x*cb+z*sb,v=-x*sb+z*cb;return [u,y*ca-v*sa,y*sa+v*ca];};
 const points=VERTICES.map(rotate).map(([x,y,z])=>{const k=35*5/(5-z);return {x:x*k,y:y*k-46,z};});
 const facing=FACES.map(f=>dot(rotate(f.normal),sub([0,0,5],rotate(f.center)))>0);
 const kinds=EDGE_FACES.map(([a,b])=>facing[a]!==facing[b]?'outline':facing[a]?'front':'back');
 return {points,facing,kinds};
}
export function wireframePaths(seconds=0){
 const {points,kinds}=projectHub(seconds),paths={outline:'',front:'',back:''};
 EDGES.forEach(([i,j],edge)=>{const a=points[i],b=points[j];paths[kinds[edge]]+=`M${a.x.toFixed(3)},${a.y.toFixed(3)}L${b.x.toFixed(3)},${b.y.toFixed(3)}`;});
 return paths;
}
const point=(r,a)=>[Math.cos(a)*r,Math.sin(a)*r];
const polygon=(sides,r)=>Array.from({length:sides},(_,i)=>point(r,-Math.PI/2-Math.PI/sides+i*Math.PI*2/sides).map(v=>v.toFixed(3)).join(',')).join(' ');
export const ORBIT_PATH='M'+polygon(8,178).split(' ').join('L')+'Z';
export function hubArtwork(colors){
 const wire=wireframePaths();
 const markers=colors.map((color,i)=>{const a=-Math.PI/2-Math.PI/8+i*Math.PI/4,p=point(154,a+.035),q=point(154,a+Math.PI/4-.035);return `<path id="hubSector${i}" class="hub-sector" style="--sector-color:${color}" d="M${p.join(',')}L${q.join(',')}"/>`;}).join('');
 return `<svg class="hub-art" viewBox="-200 -200 400 400" aria-hidden="true"><path class="hub-orbit-track" d="${ORBIT_PATH}"/><path class="hub-orbit-trail" d="${ORBIT_PATH}" pathLength="1000"/><path class="hub-orbit-head" d="${ORBIT_PATH}" pathLength="1000"/><polygon class="hub-shell" points="${polygon(8,144)}"/><polygon class="hub-inset" points="${polygon(8,132)}"/><g class="hub-sectors">${markers}</g><path class="hub-background-brand" transform="translate(-99 -154) scale(3.09375)" d="${BRAND_PATH}"/><g class="hub-wire"><path id="hubWireBack" class="wire-back" d="${wire.back}"/><path id="hubWireFront" class="wire-front" d="${wire.front}"/><path id="hubWireOutline" class="wire-outline" d="${wire.outline}"/></g></svg>`;
}
