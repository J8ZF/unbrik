// Runs the first preview's sea code unchanged (same seeds, same order) so the
// triangles, depth bands and reefs come out exactly as in v1.
import fs from 'node:fs';
const D=JSON.parse(fs.readFileSync(new URL('./v1data.json',import.meta.url)));
function rng(seed){return()=>{seed|=0;seed=seed+0x6D2B79F5|0;let t=Math.imul(seed^seed>>>15,1|seed);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296;};}
const P=pts=>pts.map(p=>p[0].toFixed(1)+','+p[1].toFixed(1)).join(' ');
const inside=(x,y,poly)=>{let c=false;for(let i=0,j=poly.length-1;i<poly.length;j=i++){const [xi,yi]=poly[i],[xj,yj]=poly[j];if(((yi>y)!==(yj>y))&&(x<(xj-xi)*(y-yi)/(yj-yi)+xi))c=!c;}return c;};
const segDist=(px,py,a,b)=>{const dx=b[0]-a[0],dy=b[1]-a[1],t=Math.max(0,Math.min(1,((px-a[0])*dx+(py-a[1])*dy)/(dx*dx+dy*dy)));return Math.hypot(px-a[0]-t*dx,py-a[1]-t*dy);};
const edgeDist=(x,y,poly)=>{let m=1e9;for(let i=0;i<poly.length;i++)m=Math.min(m,segDist(x,y,poly[i],poly[(i+1)%poly.length]));return m;};
function area(poly){let a=0;for(let i=0;i<poly.length;i++){const p=poly[i],q=poly[(i+1)%poly.length];a+=p[0]*q[1]-q[0]*p[1];}return a/2;}
function inset(poly,d,clamp=2.2){const s=area(poly)>0?1:-1,n=poly.length,out=[];
 const nrm=(a,b)=>{const dx=b[0]-a[0],dy=b[1]-a[1],l=Math.hypot(dx,dy);return [-dy/l*s,dx/l*s];};
 for(let i=0;i<n;i++){const a=poly[(i-1+n)%n],v=poly[i],b=poly[(i+1)%n],n1=nrm(a,v),n2=nrm(v,b);let mx=n1[0]+n2[0],my=n1[1]+n2[1];const ml=Math.hypot(mx,my)||1;mx/=ml;my/=ml;const dd=typeof d==='function'?d(i):d,L=Math.abs(dd),len=Math.sign(dd)*Math.min(L*clamp,L/Math.max(.35,mx*n1[0]+my*n1[1]));out.push([v[0]+mx*len,v[1]+my*len]);}
 return out;}
function blob(r,cx,cy,rad,k){const pts=[],a0=r()*Math.PI*2;for(let i=0;i<k;i++){const a=a0+i/k*Math.PI*2+(r()-.5)*.5,rr=rad*(.72+r()*.3);pts.push([cx+Math.cos(a)*rr,cy+Math.sin(a)*rr]);}return pts;}
const poly=(pts,attrs)=>`<polygon points="${P(pts)}" ${attrs}/>`;
const coast=D.coast,small=D.small,islands=[coast,small];
const bounds=(()=>{const all=[...coast,...small];const xs=all.map(p=>p[0]),ys=all.map(p=>p[1]);return {x0:Math.min(...xs)-420,y0:Math.min(...ys)-360,x1:Math.max(...xs)+380,y1:Math.max(...ys)+360};})();
let tri='',bands='',reefsSvg='';const reefs=[];
{const r=rng(7);
 let made=0,tries=0;while(made<9&&tries<400){tries++;const cx=bounds.x0+r()*(bounds.x1-bounds.x0),cy=bounds.y0+r()*(bounds.y1-bounds.y0);
  if(Math.min(...islands.map(pl=>inside(cx,cy,pl)?0:edgeDist(cx,cy,pl)))<300)continue;
  const k=5+Math.floor(r()*4),R=90+r()*90,c=[cx+(r()-.5)*30,cy+(r()-.5)*30],ring=[];const a0=r()*6.28;for(let i=0;i<k;i++){const a=a0+i/k*6.28+(r()-.5)*.6;ring.push([cx+Math.cos(a)*R*(.6+r()*.5),cy+Math.sin(a)*R*(.6+r()*.5)]);}
  let g='';for(let i=0;i<k;i++){if(r()<.25)continue;const col=['#0d1620','#0f1a24','#111e29','#0c141c'][Math.floor(r()*4)];g+=poly([c,ring[i],ring[(i+1)%k]],`fill="${col}" stroke="${col}" stroke-width="1"`);}
  tri+=`<g class="drift" style="animation-delay:-${(r()*26).toFixed(1)}s;animation-duration:${(22+r()*14).toFixed(1)}s">${g}</g>`;made++;}
 const nz=(seed)=>{const rr=rng(seed),v=[];for(let i=0;i<64;i++)v.push(rr()*2-1);return i=>v[i%64];};
 const bandSets=[[D.bandFar,170,60,'#0c1620',3],[D.bandMid,98,32,'#0e1c26',4],[null,46,16,'#112530',5]];
 for(const [sub,base,amp,col,seed] of bandSets){const z=nz(seed);
  if(!sub){for(const pl of islands)bands+=poly(pl,`fill="${col}" stroke="${col}" stroke-width="${base*2}" stroke-linejoin="miter" stroke-miterlimit="2"`);continue;}
  bands+=poly(inset(sub.map(i=>coast[i]),i=>-(base+amp*z(i))),`fill="${col}"`)+poly(inset(small,i=>-(base*.85+amp*z(i+30))),`fill="${col}"`);}
 let reefN=0;tries=0;while(reefN<14&&tries<600){tries++;const x=bounds.x0+r()*(bounds.x1-bounds.x0),y=bounds.y0+r()*(bounds.y1-bounds.y0);const d=Math.min(...islands.map(pl=>inside(x,y,pl)?0:edgeDist(x,y,pl)));const near=reefN<10;if(near?(d<70||d>210):d<360)continue;
  const k=2+Math.floor(r()*3);let foam='',rock='';const parts=[];for(let j=0;j<k;j++){const b=blob(r,x+(r()-.5)*46,y+(r()-.5)*34,10+r()*16,5+Math.floor(r()*2));parts.push(b);foam+=poly(b,'fill="none" stroke="#e8f0f2" stroke-opacity=".42" stroke-width="5" stroke-linejoin="miter"');rock+=poly(b,'fill="#3b444c"')+poly(b.map(p=>[p[0]*.6+(x)*.4-3,p[1]*.6+(y)*.4-3]),'fill="#4d5761"');}
  reefsSvg+=foam+rock;reefs.push({x,y,parts});reefN++;}
}
fs.writeFileSync(new URL('./sea_v1.json',import.meta.url),JSON.stringify({bounds,tri,bands,reefsSvg,reefs}));
console.log('bounds',bounds,'reefs',reefs.length,reefs.map(r=>[Math.round(r.x),Math.round(r.y)]).join(' '));
