// Shared drawing helpers for island 1 v3 (build time, Node).
export function rng(seed){return()=>{seed|=0;seed=seed+0x6D2B79F5|0;let t=Math.imul(seed^seed>>>15,1|seed);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296;};}
export const f1=v=>(Math.round(v*10)/10).toString();
export const P=pts=>pts.map(p=>f1(p[0])+','+f1(p[1])).join(' ');
export const poly=(pts,attrs)=>`<polygon points="${P(pts)}" ${attrs}/>`;
export const pline=(pts,attrs)=>`<polyline points="${P(pts)}" ${attrs}/>`;
export const inside=(x,y,poly)=>{let c=false;for(let i=0,j=poly.length-1;i<poly.length;j=i++){const [xi,yi]=poly[i],[xj,yj]=poly[j];if(((yi>y)!==(yj>y))&&(x<(xj-xi)*(y-yi)/(yj-yi)+xi))c=!c;}return c;};
export const segDist=(px,py,a,b)=>{const dx=b[0]-a[0],dy=b[1]-a[1],t=Math.max(0,Math.min(1,((px-a[0])*dx+(py-a[1])*dy)/(dx*dx+dy*dy)));return Math.hypot(px-a[0]-t*dx,py-a[1]-t*dy);};
export const edgeDist=(x,y,poly)=>{let m=1e9;for(let i=0;i<poly.length;i++)m=Math.min(m,segDist(x,y,poly[i],poly[(i+1)%poly.length]));return m;};
// Smooth closed outline through jittered radial points (Catmull-Rom → cubic Bézier).
export function smoothPath(pts){const n=pts.length;let d=`M${f1(pts[0][0])} ${f1(pts[0][1])}`;
 for(let i=0;i<n;i++){const p0=pts[(i-1+n)%n],p1=pts[i],p2=pts[(i+1)%n],p3=pts[(i+2)%n];
  const c1=[p1[0]+(p2[0]-p0[0])/6,p1[1]+(p2[1]-p0[1])/6],c2=[p2[0]-(p3[0]-p1[0])/6,p2[1]-(p3[1]-p1[1])/6];
  d+=`C${f1(c1[0])} ${f1(c1[1])} ${f1(c2[0])} ${f1(c2[1])} ${f1(p2[0])} ${f1(p2[1])}`;}
 return d+'Z';}
export function ring(r,cx,cy,rad,k,jit=.14,sx=1,sy=1){const a0=r()*6.283,pts=[];for(let i=0;i<k;i++){const a=a0+i/k*6.283+(r()-.5)*.35,rr=rad*(1-jit+r()*jit*2);pts.push([cx+Math.cos(a)*rr*sx,cy+Math.sin(a)*rr*sy]);}return pts;}
export const blobPath=(r,cx,cy,rad,k=8,jit=.14,sx=1,sy=1)=>smoothPath(ring(r,cx,cy,rad,k,jit,sx,sy));
export function mix(a,b,t){const h=s=>[1,3,5].map(i=>parseInt(s.slice(i,i+2),16)),A=h(a),B=h(b);return '#'+A.map((v,i)=>Math.round(v+(B[i]-v)*t).toString(16).padStart(2,'0')).join('');}
export const rectPts=(cx,cy,w,h,deg=0)=>{const a=deg*Math.PI/180,c=Math.cos(a),s=Math.sin(a);return [[-w/2,-h/2],[w/2,-h/2],[w/2,h/2],[-w/2,h/2]].map(([x,y])=>[cx+c*x-s*y,cy+s*x+c*y]);};
