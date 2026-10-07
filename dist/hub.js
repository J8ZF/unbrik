// A true regular dodecahedron: 20 vertices and 30 equal-length edges.
const phi=(1+Math.sqrt(5))/2,inv=1/phi;
export const VERTICES=[];
for(const x of [-1,1])for(const y of [-1,1])for(const z of [-1,1])VERTICES.push([x,y,z]);
for(const a of [-1,1])for(const b of [-1,1])VERTICES.push([0,a*inv,b*phi],[a*inv,b*phi,0],[a*phi,0,b*inv]);
export const EDGES=[];
for(let i=0;i<VERTICES.length;i++)for(let j=i+1;j<VERTICES.length;j++)if(Math.abs(Math.hypot(...VERTICES[i].map((v,k)=>v-VERTICES[j][k]))-2*inv)<1e-6)EDGES.push([i,j]);
export function wireframePaths(seconds=0){
 const a=.55+seconds*.12,b=.4+seconds*.19,ca=Math.cos(a),sa=Math.sin(a),cb=Math.cos(b),sb=Math.sin(b);
 const points=VERTICES.map(([x,y,z])=>{const u=x*cb+z*sb,v=-x*sb+z*cb,yy=y*ca-v*sa,zz=y*sa+v*ca,k=35*5/(5-zz);return {x:u*k,y:yy*k-42,z:zz};});
 const paths={front:'',back:''};
 for(const [i,j]of EDGES){const a=points[i],b=points[j],key=a.z+b.z>0?'front':'back';paths[key]+=`M${a.x.toFixed(2)},${a.y.toFixed(2)}L${b.x.toFixed(2)},${b.y.toFixed(2)}`;}
 return paths;
}
const point=(radius,angle)=>[Math.cos(angle)*radius,Math.sin(angle)*radius];
const polygon=(sides,radius)=>Array.from({length:sides},(_,i)=>point(radius,-Math.PI/2-Math.PI/sides+i*Math.PI*2/sides).map(v=>v.toFixed(2)).join(',')).join(' ');
export function hubArtwork(colors){
 const wire=wireframePaths();
 const markers=colors.map((color,i)=>{const a=-Math.PI/2-Math.PI/8+i*Math.PI/4,p=point(154,a+.035),q=point(154,a+Math.PI/4-.035);return `<path id="hubSector${i}" class="hub-sector" style="--sector-color:${color}" d="M${p.join(',')}L${q.join(',')}"/>`;}).join('');
 return `<svg class="hub-art" viewBox="-200 -200 400 400" aria-hidden="true"><g class="hub-orbit orbit-a"><ellipse rx="176" ry="71"/></g><g class="hub-orbit orbit-b"><ellipse rx="184" ry="96"/></g><g class="hub-orbit orbit-c"><ellipse rx="171" ry="151"/></g><polygon class="hub-shell" points="${polygon(8,144)}"/><polygon class="hub-inset" points="${polygon(8,132)}"/><polygon class="hub-ticks" points="${polygon(24,165)}"/><g class="hub-sectors">${markers}</g><g class="hub-wire"><path id="hubWireBack" class="wire-back" d="${wire.back}"/><path id="hubWireFront" class="wire-front" d="${wire.front}"/></g></svg>`;
}
