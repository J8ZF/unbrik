// The sea round an island, in the first preview's manner: angular depth bands
// stepping out from every piece of land, a few drifting triangles, reefs near
// the shore. Island 1 keeps the preview's own output (sea_v1.json); the other
// islands are generated here with their own seeds and water colours.
import {rng,inside,edgeDist,poly} from './art.mjs';
const P=pts=>pts.map(p=>p[0].toFixed(1)+','+p[1].toFixed(1)).join(' ');
function area(p){let a=0;for(let i=0;i<p.length;i++){const q=p[i],s=p[(i+1)%p.length];a+=q[0]*s[1]-s[0]*q[1];}return a/2;}
// vertex offset outward (d<0) or inward, by a per-vertex distance
function inset(p,d,clamp=2.2){const s=area(p)>0?1:-1,n=p.length,out=[];
 const nrm=(a,b)=>{const dx=b[0]-a[0],dy=b[1]-a[1],l=Math.hypot(dx,dy);return [-dy/l*s,dx/l*s];};
 for(let i=0;i<n;i++){const a=p[(i-1+n)%n],v=p[i],b=p[(i+1)%n],n1=nrm(a,v),n2=nrm(v,b);let mx=n1[0]+n2[0],my=n1[1]+n2[1];const ml=Math.hypot(mx,my)||1;mx/=ml;my/=ml;const dd=typeof d==='function'?d(i):d,L=Math.abs(dd),len=Math.sign(dd)*Math.min(L*clamp,L/Math.max(.35,mx*n1[0]+my*n1[1]));out.push([v[0]+mx*len,v[1]+my*len]);}
 return out;}
function blob(r,cx,cy,rad,k){const pts=[],a0=r()*Math.PI*2;for(let i=0;i<k;i++){const a=a0+i/k*Math.PI*2+(r()-.5)*.5,rr=rad*(.72+r()*.3);pts.push([cx+Math.cos(a)*rr,cy+Math.sin(a)*rr]);}return pts;}
export const SEA_DEFAULT={far:'#0c1620',mid:'#0e1c26',near:'#112530',tones:{far:'#304250',mid:'#374b5b',near:'#3f5466'}};
// pieces: land polygons; bounds: the island's sea rectangle; water: colours
export function buildSea(pieces,bounds,{seed=7,water=SEA_DEFAULT,triCount=9,reefCount=14,nearReefs=10}={}){
 const r=rng(seed),b=bounds,distLand=(x,y)=>Math.min(...pieces.map(pl=>inside(x,y,pl)?0:edgeDist(x,y,pl)));
 let tri='',reefsSvg='';const reefs=[];
 let made=0,tries=0;while(made<triCount&&tries<400){tries++;const cx=b.x0+r()*(b.x1-b.x0),cy=b.y0+r()*(b.y1-b.y0);
  if(distLand(cx,cy)<300)continue;
  const k=5+Math.floor(r()*4),R=90+r()*90,c=[cx+(r()-.5)*30,cy+(r()-.5)*30],ring=[];const a0=r()*6.28;for(let i=0;i<k;i++){const a=a0+i/k*6.28+(r()-.5)*.6;ring.push([cx+Math.cos(a)*R*(.6+r()*.5),cy+Math.sin(a)*R*(.6+r()*.5)]);}
  let g='';for(let i=0;i<k;i++){if(r()<.25)continue;const col=['#0d1620','#0f1a24','#111e29','#0c141c'][Math.floor(r()*4)];g+=poly([c,ring[i],ring[(i+1)%k]],`fill="${col}" stroke="${col}" stroke-width="1"`);}
  tri+=`<g class="drift" style="animation-delay:-${(r()*26).toFixed(1)}s;animation-duration:${(22+r()*14).toFixed(1)}s">${g}</g>`;made++;}
 let reefN=0;tries=0;while(reefN<reefCount&&tries<600){tries++;const x=b.x0+r()*(b.x1-b.x0),y=b.y0+r()*(b.y1-b.y0);const d=distLand(x,y);const near=reefN<nearReefs;if(near?(d<70||d>210):d<360)continue;
  if(reefs.some(q=>Math.hypot(q.x-x,q.y-y)<140))continue;
  const k=2+Math.floor(r()*3);let foam='',rock='';const parts=[];for(let j=0;j<k;j++){const bl=blob(r,x+(r()-.5)*46,y+(r()-.5)*34,10+r()*16,5+Math.floor(r()*2));parts.push(bl);foam+=poly(bl,'fill="none" stroke="#e8f0f2" stroke-opacity=".42" stroke-width="5" stroke-linejoin="miter"');rock+=poly(bl,'fill="#3b444c"')+poly(bl.map(p=>[p[0]*.6+x*.4-3,p[1]*.6+y*.4-3]),'fill="#4d5761"');}
  reefsSvg+=foam+rock;reefs.push({x,y,parts});reefN++;}
 return {tri,reefsSvg,reefs};
}
// depth bands from the traced geometry: the coarse outlines, jittered a little so no two edges run parallel
export function bandsSvg(gm,water,seed=3){const r=rng(seed);let bands='';const depth=[];
 const jit=(pts,amp)=>{const n=pts.length;return pts.map((p,i)=>{const a=pts[(i-1+n)%n],b=pts[(i+1)%n];let nx=-(b[1]-a[1]),ny=b[0]-a[0];const l=Math.hypot(nx,ny)||1;nx/=l;ny/=l;const d=(r()-.5)*2*amp;return [p[0]+nx*d,p[1]+ny*d];});};
 for(const [key,amp] of [['far',40],['mid',22]])for(const p of gm.bands[key]){const q=jit(p,amp);bands+=poly(q,`fill="${water[key]}"`);depth.push({c:water.tones[key],pts:q});}
 for(const p of gm.land){bands+=poly(p,`fill="${water.near}" stroke="${water.near}" stroke-width="92" stroke-linejoin="miter" stroke-miterlimit="2"`);depth.push({c:water.tones.near,pts:p});}
 return {bands,depth};}
// the v1 triangle groups as placed svg fragments for the game
export function triFragments(tri){return tri.split('<g class="drift"').slice(1).map(g=>{const style=g.match(/style="([^"]*)"/)[1],pts=[...g.matchAll(/points="([^"]*)"/g)].flatMap(m=>m[1].split(' ').map(s=>s.split(',').map(Number)));
 const xs=pts.map(p=>p[0]),ys=pts.map(p=>p[1]),x0=Math.floor(Math.min(...xs))-30,y0=Math.floor(Math.min(...ys))-30,x1=Math.ceil(Math.max(...xs))+30,y1=Math.ceil(Math.max(...ys))+30;
 return {x0,y0,w:x1-x0,h:y1-y0,style,body:g.slice(g.indexOf('>')+1).replace(/<\/g>$/,'')};});}
