// Island themes: ground colours and the decoration sets that grow on each
// island. Island 1's theme reproduces its confirmed look exactly; the others
// follow the plan (섬 2 열대, 섬 3 단풍, 섬 4 고대 유적지, 섬 5 이끼 낀 도시).
import {f1,poly,blobPath,rectPts,inside,rng as mkRng} from './art.mjs';
import {SEA_DEFAULT} from './sea.mjs';

// ---- shared drawings (top-down, flat, no shadows) ----
export const leafFan=(r,x,y,len,count,cols,rib,wide=1.6)=>{let s='';const a0=r()*6.283;for(let i=0;i<count;i++){const a=a0+i/count*6.283+(r()-.5)*.5,L=len*(.72+r()*.32),w=L*.17,dx=Math.cos(a),dy=Math.sin(a),px=-dy,py=dx;
  const tip=[x+dx*L,y+dy*L],m1=[x+dx*L*.45+px*w*wide,y+dy*L*.45+py*w*wide],m2=[x+dx*L*.45-px*w*wide,y+dy*L*.45-py*w*wide];
  s+=`<path d="M${f1(x)} ${f1(y)}Q${f1(m1[0])} ${f1(m1[1])} ${f1(tip[0])} ${f1(tip[1])}Q${f1(m2[0])} ${f1(m2[1])} ${f1(x)} ${f1(y)}Z" fill="${cols[i%cols.length]}"/>`;
  if(rib)s+=`<path d="M${f1(x)} ${f1(y)}L${f1(x+dx*L*.86)} ${f1(y+dy*L*.86)}" stroke="${rib}" stroke-width="1.8" stroke-linecap="round"/>`;}
 return s;};
export const tree=(r,x,y,R,cols=['#235a36','#2f7345','#418d52'])=>`<path d="${blobPath(r,x,y,R,9,.1)}" fill="${cols[0]}"/><path d="${blobPath(r,x+(r()-.5)*R*.2,y+(r()-.5)*R*.2,R*.74,8,.12)}" fill="${cols[1]}"/><path d="${blobPath(r,x+(r()-.5)*R*.3,y+(r()-.5)*R*.3,R*.42,7,.15)}" fill="${cols[2]}"/>`;
export const flower=(x,y,s,c,heart='#f2c94c')=>{let o='';for(let i=0;i<5;i++){const a=i/5*6.283;o+=`<circle cx="${f1(x+Math.cos(a)*s*.55)}" cy="${f1(y+Math.sin(a)*s*.55)}" r="${f1(s*.48)}" fill="${c}"/>`;}return o+`<circle cx="${f1(x)}" cy="${f1(y)}" r="${f1(s*.36)}" fill="${heart}"/>`;};
const dot=(x,y,R,c)=>`<circle cx="${f1(x)}" cy="${f1(y)}" r="${f1(R)}" fill="${c}"/>`;
const grove=(r,x,y,cols)=>{let s='';const k=2+Math.floor(r()*3),parts=[];for(let i=0;i<k;i++){const R=34+r()*30;parts.push([x+(r()-.5)*130,y+(r()-.5)*100,R]);}parts.sort((a,b)=>a[1]-b[1]);for(const [px,py,R] of parts)s+=tree(r,px,py,R,cols);return s;};
const bushes=(r,x,y,cols)=>{let s='';const k=3+Math.floor(r()*4);for(let i=0;i<k;i++){const bx=x+(r()-.5)*110,by=y+(r()-.5)*60,R=13+r()*11;s+=`<path d="${blobPath(r,bx,by,R,7,.12)}" fill="${cols[0]}"/><path d="${blobPath(r,bx,by,R*.55,6,.15)}" fill="${cols[1]}"/>`;}return s;};
const flowers=(r,x,y,cols,heart)=>{let s='';const k=3+Math.floor(r()*5);for(let i=0;i<k;i++)s+=flower(x+(r()-.5)*70,y+(r()-.5)*50,8+r()*4,cols[r()<.75?0:1],heart);return s;};
const driftwood=(r,x,y)=>{const a=(r()-.5)*1.4,L=70+r()*40,c=Math.cos(a),s=Math.sin(a);const pts=[[-L/2,-7],[L/2,-5],[L/2+4,0],[L/2,5],[-L/2,7],[-L/2-3,0]].map(([u,v])=>[x+c*u-s*v,y+s*u+c*v]);
 const br=[[L*.15,-4],[L*.3,-20]].map(([u,v])=>[x+c*u-s*v,y+s*u+c*v]);return poly(pts,'fill="#8b7357"')+`<path d="M${f1(br[0][0])} ${f1(br[0][1])}L${f1(br[1][0])} ${f1(br[1][1])}" stroke="#8b7357" stroke-width="6" stroke-linecap="round"/>`+`<path d="M${f1(pts[5][0])} ${f1(pts[5][1])}L${f1(pts[2][0])} ${f1(pts[2][1])}" stroke="#a58c6c" stroke-width="2"/>`;};
const shells=(r,x,y)=>{let s='';for(let i=0;i<4;i++){const sx=x+(r()-.5)*40,sy=y+(r()-.5)*30;s+=`<ellipse cx="${f1(sx)}" cy="${f1(sy)}" rx="${f1(4+r()*4)}" ry="${f1(3+r()*3)}" fill="${['#efe6d2','#e8d7c4','#d9cdb8'][i%3]}"/>`;}return s;};
const moss=(r,x,y,cols=['#5b8a45','#6e9f50','#4f7d3d'],spot='#9cc073')=>{let s='';const k=2+Math.floor(r()*3);for(let i=0;i<k;i++){const R=12+r()*18;s+=`<path d="${blobPath(r,x+(r()-.5)*50,y+(r()-.5)*36,R,7,.18)}" fill="${cols[i%3]}"/>`;}for(let i=0;i<5;i++)s+=dot(x+(r()-.5)*70,y+(r()-.5)*50,2+r()*2.5,spot);return s;};
// a palm: fronds round a trunk dot, coconuts at the heart
const palm=(r,x,y,L=74)=>{let s=leafFan(r,x,y,L+r()*30,7+Math.floor(r()*3),['#3f9a4a','#2f7f3f','#52ab55'],'#1f5a30',1.1);s+=dot(x,y,7,'#6b4a2a');for(let i=0;i<3;i++)s+=dot(x+(r()-.5)*14,y+(r()-.5)*14,3.6,'#a9814c');return s;};
const palms=(r,x,y)=>{let s='';const k=2+Math.floor(r()*2);for(let i=0;i<k;i++)s+=palm(r,x+(r()-.5)*120,y+(r()-.5)*90,66+r()*24);return s;};
const bigleaf=(r,x,y)=>leafFan(r,x,y,52+r()*22,5+Math.floor(r()*2),['#2f8f55','#3fa868','#1f7045'],'#145a35',2.6);
// a maple: three pink-red crowns, fallen leaves round it
const maple=(r,x,y,R)=>tree(r,x,y,R,['#9c3a52','#c74c68','#e86f86'])+Array.from({length:5},()=>dot(x+(r()-.5)*R*3.2,y+(r()-.5)*R*3.2,2.2+r()*2,['#e86f86','#f29aa8','#c74c68'][Math.floor(r()*3)])).join('');
const mapleGrove=(r,x,y)=>{let s='';const k=2+Math.floor(r()*3),parts=[];for(let i=0;i<k;i++){const R=30+r()*30;parts.push([x+(r()-.5)*130,y+(r()-.5)*100,R]);}parts.sort((a,b)=>a[1]-b[1]);for(const [px,py,R] of parts)s+=maple(r,px,py,R);return s;};
// ---- island 3: a fantasy autumn forest. Translucent shapes laid in chains, so the overlaps thicken into dense foliage ----
// classic autumn maple red (the user: red, not pink and not orange), light to dark so the overlaps read
const MAPLE_COLS=['#c42633','#e2475a','#ef6a6f','#a51d2c','#f08a84','#d8343e'];
const BRUSH_COLS=['#2f6b5c','#48927c','#5fb39a','#3a7f6c','#6fc4a8'];
const BIRCH_COLS=['#e3c56a','#f0d98a','#cfae55','#f6e3a0'];
// n blobs of radius about R, each stepping on from the last, colours cycling through cols with a random start
const blobChain=(r,x,y,n,R,cols,op,step=.9)=>{let s='',px=x,py=y,a=r()*6.283;const k0=Math.floor(r()*cols.length);
 for(let i=0;i<n;i++){const rad=R*(.72+r()*.56);s+=`<path d="${blobPath(r,px,py,rad,8,.14)}" fill="${cols[(k0+i)%cols.length]}" fill-opacity="${op}"/>`;a+=(r()-.5)*1.7;px+=Math.cos(a)*rad*step;py+=Math.sin(a)*rad*step;}return s;};
const mapleCanopy=(r,x,y,k=1)=>blobChain(r,x,y,4+Math.floor(r()*3),(42+r()*20)*k,MAPLE_COLS,.74);
const tealBrush=(r,x,y)=>blobChain(r,x,y,3+Math.floor(r()*3),30+r()*16,BRUSH_COLS,.64);
const rockMoss=(r,x,y)=>blobChain(r,x,y,2+Math.floor(r()*2),22+r()*14,['#3f9a86','#5fb39a','#2f7f6f'],.6,.8);
// a fallen birch: a pale log with its black bark marks and a cut end
const birchLog=(r,x,y)=>{const a=r()*Math.PI,L=110+r()*60,w=16+r()*5,c=Math.cos(a),sn=Math.sin(a),g=(u,v)=>[x+c*u-sn*v,y+sn*u+c*v];
 let s=poly([g(-L/2,-w/2),g(L/2,-w/2),g(L/2,w/2),g(-L/2,w/2)],'fill="#ece8df" stroke="#b9b2a6" stroke-width="1.6" stroke-linejoin="miter"');
 for(let u=-L/2+12;u<L/2-10;u+=16+r()*14){const bw=5+r()*9,bh=w*(.35+r()*.45),off=(r()-.5)*(w-bh);s+=poly([g(u,off-bh/2),g(u+bw,off-bh/2),g(u+bw,off+bh/2),g(u,off+bh/2)],'fill="#262626"');}
 const e=g(L/2,0);s+=`<ellipse cx="${f1(e[0])}" cy="${f1(e[1])}" rx="${f1(w*.28)}" ry="${f1(w*.5)}" transform="rotate(${f1(a*180/Math.PI)} ${f1(e[0])} ${f1(e[1])})" fill="#d8c7a4" stroke="#b9a680" stroke-width="1.4"/>`;return s;};
// a stand of birches: pale trunks seen from above under a gold canopy chain
const birchStand=(r,x,y)=>{let s=blobChain(r,x,y,3+Math.floor(r()*2),26+r()*12,BIRCH_COLS,.6,1);const k=2+Math.floor(r()*2);
 for(let i=0;i<k;i++){const tx=x+(r()-.5)*70,ty=y+(r()-.5)*54;s+=dot(tx,ty,6.5,'#f1efe8')+`<path d="M${f1(tx-5)} ${f1(ty+1)}a5.5 5.5 0 0 0 9 3" stroke="#2b2b2b" stroke-width="2.2" fill="none"/>`;}return s;};
const leafLitter=(r,x,y)=>{let s='';for(let i=0;i<9;i++){const px=x+(r()-.5)*90,py=y+(r()-.5)*64,a=r()*180,c=['#e86f86','#f29aa8','#d4556e','#f5b7c0'][i%4];s+=poly(rectPts(px,py,7+r()*5,4+r()*3,a),`fill="${c}"`);}return s;};
// ruins: a rune stone (angular standing stone, an amber glyph), broken walls, dead scrub
const runeStone=(r,x,y)=>{const a=r()*180,w=30+r()*16,h=60+r()*34,pts=rectPts(x,y,w,h,a).map(([px,py],i)=>i===1?[px+(r()-.5)*6,py-6]:[px,py]);let s=poly(pts,'fill="#3e3f49" stroke="#5c5e6a" stroke-width="2.2" stroke-linejoin="miter"');
 const c=Math.cos(a*Math.PI/180),sn=Math.sin(a*Math.PI/180),g=(u,v)=>[x+c*u-sn*v,y+sn*u+c*v],p1=g(0,-h*.32),p2=g(0,h*.3),p3=g(-w*.22,-h*.05),p4=g(w*.22,h*.08);
 s+=`<path d="M${f1(p1[0])} ${f1(p1[1])}L${f1(p2[0])} ${f1(p2[1])}M${f1(p3[0])} ${f1(p3[1])}L${f1(p4[0])} ${f1(p4[1])}" stroke="#ffbf4a" stroke-width="2.4" stroke-linecap="round"/>`+dot(p1[0],p1[1],4.5,'#ffd98a')+`<circle cx="${f1(p1[0])}" cy="${f1(p1[1])}" r="11" fill="#ffbf4a" fill-opacity=".22"/>`;return s;};
const runeRing=(r,x,y)=>{let s='';const k=3+Math.floor(r()*3),R=40+r()*26,a0=r()*6.283;for(let i=0;i<k;i++){const a=a0+i/k*6.283;s+=runeStone(r,x+Math.cos(a)*R,y+Math.sin(a)*R);}return s;};
const wall=(r,x,y)=>{let s='';const a=r()*180,c=Math.cos(a*Math.PI/180),sn=Math.sin(a*Math.PI/180),k=2+Math.floor(r()*3);let u=-110-r()*40;
 for(let i=0;i<k;i++){const L=50+r()*70,gap=12+r()*26,cx=x+c*(u+L/2),cy=y+sn*(u+L/2),w=20+r()*6;s+=poly(rectPts(cx,cy,L,w,a),'fill="#d9c9a0" stroke="#a89470" stroke-width="2" stroke-linejoin="miter"');
  if(r()<.5)s+=poly(rectPts(cx+(r()-.5)*L*.5,cy,8+r()*8,w*.7,a),'fill="#efe3bf"');u+=L+gap;}
 if(r()<.6){const bx=x+c*(u)-sn*20,by=y+sn*(u)+c*20;s+=poly(rectPts(bx,by,12+r()*4,40+r()*30,a+90),'fill="#d9c9a0" stroke="#a89470" stroke-width="2" stroke-linejoin="miter"');}return s;};
const scrub=(r,x,y)=>leafFan(r,x,y,18+r()*12,6+Math.floor(r()*3),['#8a8a52','#737342'],null);
const sandStone=(r,x,y)=>{let s='';const k=2+Math.floor(r()*3);for(let i=0;i<k;i++)s+=poly(rectPts(x+(r()-.5)*60,y+(r()-.5)*44,16+r()*22,10+r()*14,r()*180),`fill="${['#b89a66','#c9ad78','#a88a58'][i%3]}" stroke="#8d7449" stroke-width="1.6" stroke-linejoin="miter"`);return s;};
// city: moss sheets, puddles, rubble, cracks with grass, young trees
const mossSheet=(r,x,y)=>{let s='';const k=3+Math.floor(r()*3);for(let i=0;i<k;i++){const R=18+r()*26;s+=`<path d="${blobPath(r,x+(r()-.5)*90,y+(r()-.5)*70,R,8,.2)}" fill="${['#4f7d3a','#5f9144','#6ea24c'][i%3]}"/>`;}for(let i=0;i<6;i++)s+=dot(x+(r()-.5)*110,y+(r()-.5)*80,2+r()*3,'#9ccf6a');return s;};
const puddle=(r,x,y)=>{const R=22+r()*20;return `<path d="${blobPath(r,x,y,R,8,.22,1.5,.8)}" fill="#1f2a33" stroke="#39505c" stroke-width="2"/>`+`<path d="${blobPath(r,x-R*.2,y-R*.15,R*.45,6,.2,1.5,.8)}" fill="#2a3a46"/>`;};
const rubble=(r,x,y)=>{let s='';const k=4+Math.floor(r()*5);for(let i=0;i<k;i++)s+=poly(rectPts(x+(r()-.5)*70,y+(r()-.5)*50,10+r()*18,7+r()*10,r()*180),`fill="${['#7d858c','#8f979d','#6a7279'][i%3]}" stroke="#4e565c" stroke-width="1.4" stroke-linejoin="miter"`);return s;};
const crack=(r,x,y)=>{const a=r()*180,c=Math.cos(a*Math.PI/180),sn=Math.sin(a*Math.PI/180);let d='',u=-40-r()*30;const pts=[];while(u<40+r()*30){pts.push([x+c*u-sn*(r()-.5)*10,y+sn*u+c*(r()-.5)*10]);u+=14+r()*12;}
 d=pts.map((p,i)=>(i?'L':'M')+f1(p[0])+' '+f1(p[1])).join('');let s=`<path d="${d}" stroke="#2e353b" stroke-width="2.4" fill="none" stroke-linejoin="round"/>`;for(let i=0;i<3;i++){const p=pts[Math.floor(r()*pts.length)];s+=leafFan(r,p[0],p[1],12+r()*10,5,['#86b85a','#6fa34d'],null);}return s;};
const youngTrees=(r,x,y)=>{let s='';const k=1+Math.floor(r()*3);for(let i=0;i<k;i++)s+=tree(r,x+(r()-.5)*90,y+(r()-.5)*70,18+r()*16,['#2b5e3a','#3a7a48','#4f9657']);return s;};

// ---- the city's built parts: flat roofs on the slabs, roads, bridges along the links over the water ----
const CARD_W=146,CARD_H=118;
function roof(r,b,i){const [x0,y0,x1,y1]=b,w=x1-x0,h=y1-y0,c=18;let s='';
 const base=[[x0+c,y0],[x1-c,y0],[x1,y0+c],[x1,y1-c],[x1-c,y1],[x0+c,y1],[x0,y1-c],[x0,y0+c]];
 const kind=i%3;// 0 a glass band and plant, 1 a broken corner, 2 a caved-in roof
 if(kind===1){base.splice(2,2,[x1,y0+c],[x1-w*.3,y0+h*.35],[x1-w*.34,y1-h*.3],[x1,y1-c]);}
 s+=poly(base,'fill="#3b4248" stroke="#262c31" stroke-width="3" stroke-linejoin="miter"');
 const inner=base.map(([x,y])=>[x+(x<x0+w/2?10:-10),y+(y<y0+h/2?10:-10)]);s+=poly(inner,'fill="#6f777e"');
 if(kind===0){s+=`<rect x="${f1(x0+28)}" y="${f1(y0+h*.42)}" width="${f1(w-56)}" height="${f1(h*.16)}" fill="#2a3035" stroke="#4b5359" stroke-width="1.6"/>`;
  for(let k=0;k<3;k++)s+=`<rect x="${f1(x0+30+k*34)}" y="${f1(y0+24)}" width="22" height="16" fill="#9aa3aa" stroke="#4b5359" stroke-width="1.4"/>`;
  s+=`<circle cx="${f1(x1-40)}" cy="${f1(y1-40)}" r="13" fill="#8a939b" stroke="#4b5359" stroke-width="1.8"/><circle cx="${f1(x1-40)}" cy="${f1(y1-40)}" r="4" fill="#2a3035"/>`;}
 if(kind===1){for(let k=0;k<3;k++)s+=`<rect x="${f1(x0+30)}" y="${f1(y0+30+k*40)}" width="16" height="26" fill="#9aa3aa" stroke="#4b5359" stroke-width="1.4"/>`;
  for(let k=0;k<6;k++)s+=poly(rectPts(x1-w*.2+(r()-.5)*70,y0+h*.5+(r()-.5)*90,10+r()*16,7+r()*9,r()*180),'fill="#8f979d" stroke="#4e565c" stroke-width="1.4"');}
 if(kind===2){const cx=x0+w*.5,cy=y0+h*.52;s+=`<path d="${blobPath(r,cx,cy,Math.min(w,h)*.3,7,.25)}" fill="#1f252a" stroke="#4b5359" stroke-width="2"/>`;
  for(let k=0;k<3;k++)s+=`<path d="${blobPath(r,cx+(r()-.5)*w*.3,cy+(r()-.5)*h*.3,8+r()*10,6,.2)}" fill="#3f6a30"/>`;
  s+=`<circle cx="${f1(x1-36)}" cy="${f1(y0+34)}" r="14" fill="#8a939b" stroke="#4b5359" stroke-width="1.8"/><circle cx="${f1(x1-66)}" cy="${f1(y0+40)}" r="9" fill="#8a939b" stroke="#4b5359" stroke-width="1.6"/>`;}
 for(let k=0;k<4;k++)s+=`<path d="${blobPath(r,x0+20+r()*(w-40),y0+20+r()*(h-40),10+r()*14,7,.2)}" fill="${['#4f7d3a','#5f9144'][k%2]}"/>`;
 return s;}
function road(p){let s='';const d=p.pts.map((q,i)=>(i?'L':'M')+f1(q[0])+' '+f1(q[1])).join('');
 s+=`<path d="${d}" stroke="#30373d" stroke-width="${p.w}" fill="none" stroke-linecap="butt" stroke-linejoin="miter"/><path d="${d}" stroke="#4b5359" stroke-width="${p.w-6}" fill="none" stroke-linecap="butt" stroke-linejoin="miter"/>`;
 s+=`<path d="${d}" stroke="#b9b58a" stroke-opacity=".7" stroke-width="3" fill="none" stroke-dasharray="26 22"/>`;return s;}
function bridges(nodes,land){const piece=n=>land.findIndex(p=>inside(n.x,n.y,p));const out=[];
 for(const n of nodes)for(const rid of n.req){const p=nodes.find(m=>m.id===rid);if(!p||piece(p)===piece(n))continue;
  const dx=n.x-p.x,dy=n.y-p.y,L=Math.hypot(dx,dy),ux=dx/L,uy=dy/L,px=-uy,py=ux;const t0=Math.min(CARD_W/2/Math.max(.001,Math.abs(ux)),CARD_H/2/Math.max(.001,Math.abs(uy)))-6;
  const a=[p.x+ux*t0,p.y+uy*t0],b=[n.x-ux*t0,n.y-uy*t0],w=34;
  out.push({pts:[[a[0]+px*w,a[1]+py*w],[b[0]+px*w,b[1]+py*w],[b[0]-px*w,b[1]-py*w],[a[0]-px*w,a[1]-py*w]],a,b,ux,uy,px,py,L:Math.hypot(b[0]-a[0],b[1]-a[1])});}
 return out;}
function bridgeSvg(bg){let s=poly(bg.pts,'fill="#5c646b" stroke="#2c3338" stroke-width="4" stroke-linejoin="miter"');
 const {a,ux,uy,px,py,L}=bg;for(let t=18;t<L;t+=26){const x=a[0]+ux*t,y=a[1]+uy*t;s+=`<path d="M${f1(x+px*30)} ${f1(y+py*30)}L${f1(x-px*30)} ${f1(y-py*30)}" stroke="#4b5359" stroke-width="2"/>`;}
 for(const sd of [1,-1]){s+=`<path d="M${f1(a[0]+px*sd*27)} ${f1(a[1]+py*sd*27)}L${f1(a[0]+ux*L+px*sd*27)} ${f1(a[1]+uy*L+py*sd*27)}" stroke="#8a939b" stroke-width="3"/>`;}
 return s;}
const cityExtras=({D,o,nodes,land})=>{const r=mkRng(55);let s='';
 for(const rd of D.extras?.roads||[])s+=road({pts:rd.pts.map(([x,y])=>[x+o[0],y+o[1]]),w:rd.w});
 for(const bg of bridges(nodes,land))s+=bridgeSvg(bg);
 (D.avoid||[]).forEach((b,i)=>{s+=roof(r,[b[0]+o[0],b[1]+o[1],b[2]+o[0],b[3]+o[1]],i);});
 return s;};
const cityMask=({nodes,land})=>bridges(nodes,land).map(b=>b.pts);

// ---- Hawaii: big symbolic flowers (hibiscus, plumeria), plants at three sizes, loungers under parasols ----
const FLOWER_COLS=[['#ff6f95','#e24e78'],['#e8475f','#c0344a'],['#ff7a5c','#dd5a3e'],['#ffd23f','#e8b32a'],['#ffe27a','#f0c84a'],['#f7f2e8','#ead9b8']];
const petalPath=(cx,cy,a,L,w)=>{const dx=Math.cos(a),dy=Math.sin(a),px=-dy,py=dx;return `M${f1(cx)} ${f1(cy)}C${f1(cx+dx*L*.25+px*w)} ${f1(cy+dy*L*.25+py*w)} ${f1(cx+dx*L*.95+px*w*.7)} ${f1(cy+dy*L*.95+py*w*.7)} ${f1(cx+dx*L)} ${f1(cy+dy*L)}C${f1(cx+dx*L*.95-px*w*.7)} ${f1(cy+dy*L*.95-py*w*.7)} ${f1(cx+dx*L*.25-px*w)} ${f1(cy+dy*L*.25-py*w)} ${f1(cx)} ${f1(cy)}Z`;};
const bigFlower=(r,x,y,scale=1)=>{const R=(38+r()*20)*scale,k=5+Math.floor(r()*2),a0=r()*6.283,cols=FLOWER_COLS[Math.floor(r()*FLOWER_COLS.length)],heart=cols[0]==='#f7f2e8'?'#ffd23f':r()<.55?'#ffd166':'#5b3a2a';let s='';
 for(let i=0;i<k;i++){const a=a0+i/k*6.283;s+=`<path d="${petalPath(x,y,a,R,R*.42)}" fill="${cols[0]}"/>`;}
 for(let i=0;i<k;i++){const a=a0+i/k*6.283;s+=`<path d="${petalPath(x,y,a+.08,R*.62,R*.2)}" fill="${cols[1]}"/>`;}
 s+=dot(x,y,R*.2,heart);for(let i=0;i<k;i++){const a=a0+(i+.5)/k*6.283;s+=dot(x+Math.cos(a)*R*.3,y+Math.sin(a)*R*.3,R*.05,heart==='#5b3a2a'?'#ffd166':'#5b3a2a');}return s;};
const flowerBed=(r,x,y)=>{let s=bigFlower(r,x,y,1);if(r()<.5)s+=bigFlower(r,x+(r()-.5)*150,y+(r()-.5)*110,.6+r()*.3);return s;};
const giantLeaf=(r,x,y)=>leafFan(r,x,y,96+r()*44,5+Math.floor(r()*3),['#2f8f55','#3fa868','#1f7045'],'#145a35',2.8);
const midLeaf=(r,x,y)=>leafFan(r,x,y,56+r()*26,5+Math.floor(r()*2),['#3fa868','#2f8f55','#52b874'],'#1f6a40',2.4);
const smallLeaf=(r,x,y)=>leafFan(r,x,y,30+r()*14,5+Math.floor(r()*2),['#52b874','#3fa868'],null,2);
const palmBig=(r,x,y)=>palm(r,x,y,112+r()*30),palmSmall=(r,x,y)=>palm(r,x,y,56+r()*14);
const lounger=(x,y,a)=>{const c=Math.cos(a),sn=Math.sin(a),g=(u,v)=>[x+c*u-sn*v,y+sn*u+c*v];let s=poly([g(-12,-24),g(12,-24),g(12,24),g(-12,24)],'fill="#f2f4f7" stroke="#8c99a2" stroke-width="1.6" stroke-linejoin="miter"');
 for(const v of [-6,4,14]){const p1=g(-12,v),p2=g(12,v);s+=`<path d="M${f1(p1[0])} ${f1(p1[1])}L${f1(p2[0])} ${f1(p2[1])}" stroke="#8c99a2" stroke-width="1.6"/>`;}
 const h=[g(-9,-21),g(9,-21),g(9,-12),g(-9,-12)];return s+poly(h,'fill="#4fe0cf"');};
const parasol=(x,y,col)=>{let s='';for(let i=0;i<8;i++){const a0=i/8*6.283,a1=(i+1)/8*6.283,R=27;s+=`<path d="M${f1(x)} ${f1(y)}L${f1(x+Math.cos(a0)*R)} ${f1(y+Math.sin(a0)*R)}A${R} ${R} 0 0 1 ${f1(x+Math.cos(a1)*R)} ${f1(y+Math.sin(a1)*R)}Z" fill="${i%2?'#f2f4f7':col}" stroke="#c9d2d8" stroke-width="1"/>`;}return s+dot(x,y,3.5,'#5b3a2a');};
const beachSet=(r,x,y)=>{const a=(r()-.5)*.6,col=['#e8475f','#4fe0cf','#ffd23f'][Math.floor(r()*3)];let s=parasol(x,y-30,col);s+=lounger(x-22,y+18,a)+lounger(x+24,y+18,a);if(r()<.5)s+=lounger(x+70,y+14,a+.15);return s;};
// the lagoon: a sand rim, deep water, a lighter shallow heart, two surf dashes
const lagoonSvg=pts=>{const cx=pts.reduce((a,p)=>a+p[0],0)/pts.length,cy=pts.reduce((a,p)=>a+p[1],0)/pts.length,sh=k=>pts.map(([x,y])=>[cx+(x-cx)*k,cy+(y-cy)*k]);
 return poly(sh(1.18),'fill="#e2cc98" stroke="#f0e2b8" stroke-width="3" stroke-linejoin="round"')+poly(sh(1.08),'fill="#c4ad7c"')+poly(pts,'fill="#1d5a5c" stroke="#3f9aa0" stroke-width="3" stroke-linejoin="round"')+poly(sh(.62),'fill="#2a7f82"')+poly(sh(.3),'fill="#3fa0a2"')
  +`<path d="M${f1(cx-40)} ${f1(cy-18)}L${f1(cx+10)} ${f1(cy-26)}M${f1(cx-6)} ${f1(cy+22)}L${f1(cx+44)} ${f1(cy+14)}" stroke="#eef4f5" stroke-opacity=".6" stroke-width="3" stroke-linecap="round"/>`;};
// The volcano, seen from above in the island's own flat language: a shield of
// three uneven brown terraces, a cinder cone on one flank, two cooled lava flows
// winding down from the rim with incandescent cracks, fissure vents, and a
// jagged crater round a lava lake. The whole thing is a raised layer, so it
// carries the game's translucent dark rim, and it is clipped to the land.
let volcN=0;
const volcanoSvg=(r,cx,cy,R,clipPoly)=>{
 const jag=(ox,oy,rad,n,jit,a0=r()*6.283)=>{const o=[];for(let i=0;i<n;i++){const a=a0+i/n*6.283+(r()-.5)*.5/n*6.283,rr=rad*(1-jit+r()*jit*2);o.push([cx+ox+Math.cos(a)*rr,cy+oy+Math.sin(a)*rr]);}return o;};
 const band=(pts,w,stroke)=>poly(pts,`fill="none" stroke="${stroke}" stroke-width="${w}" stroke-linejoin="round"`);
 // a flow: a winding centre line from the rim, offset into a band that narrows then fans out
 const flow=(a,len,w)=>{const line=[];let x=cx+Math.cos(a)*R*.33,y=cy+Math.sin(a)*R*.33,h=a;const n=5,seg=len/n;
  for(let i=0;i<=n;i++){line.push([x,y,h]);h+=(r()-.5)*.7;x+=Math.cos(h)*seg;y+=Math.sin(h)*seg;}
  const L=[],Rr=[];line.forEach(([x,y,h],i)=>{const t=i/n,ww=w*(t<.5?1-t*.35:.82+(t-.5)*1.3)*(.9+r()*.2),px=-Math.sin(h),py=Math.cos(h);L.push([x+px*ww,y+py*ww]);Rr.push([x-px*ww,y-py*ww]);});
  const [ex,ey,eh]=line[n],we=w*1.5,px=-Math.sin(eh),py=Math.cos(eh),dx=Math.cos(eh),dy=Math.sin(eh);
  const foot=[[ex+dx*we*.5+px*we*.75,ey+dy*we*.5+py*we*.75],[ex+dx*we*.95+px*we*.2,ey+dy*we*.95+py*we*.2],[ex+dx*we*.8-px*we*.45,ey+dy*we*.8-py*we*.45]];
  const body=[...L,...foot,...Rr.reverse()];
  const mid=line[Math.floor(n*.55)];const crust=body.map(([x,y])=>[mid[0]+(x-mid[0])*.6,mid[1]+(y-mid[1])*.6]);
  // incandescent cracks along the upper half: slivers across the band, fading down the flow
  let cracks='';for(let i=0;i<4;i++){const t=.08+i*.14,k=Math.min(n-1,Math.floor(t*n)),f=t*n-k,[x0,y0,h0]=line[k],[x1,y1]=line[k+1],x=x0+(x1-x0)*f,y=y0+(y1-y0)*f,qx=-Math.sin(h0),qy=Math.cos(h0),ww=w*(.55-i*.1),ll=w*.16;
   cracks+=poly([[x+qx*ww+Math.cos(h0)*ll,y+qy*ww+Math.sin(h0)*ll],[x-qx*ww*.8,y-qy*ww*.8],[x+qx*ww-Math.cos(h0)*ll,y+qy*ww-Math.sin(h0)*ll]],`fill="${i<2?'#e0583a':'#b23a22'}"`);}
  return {body,svg:poly(body,'fill="#2f2622" stroke="#1b1512" stroke-width="3" stroke-linejoin="round"')+poly(crust,'fill="#3d322b"')+cracks};};
 const base=jag(0,0,R,11,.15),step1=jag(R*.06,R*.05,R*.74,9,.13),step2=jag(R*.1,R*.08,R*.5,8,.11);
 const a1=r()*6.283,fl=[flow(a1,R*.78,R*.15),flow(a1+2.4+r()*.8,R*.62,R*.12)];
 const cone2=[cx+Math.cos(a1+4.4)*R*.8,cy+Math.sin(a1+4.4)*R*.8],c2=jag(cone2[0]-cx,cone2[1]-cy,R*.24,8,.14),c2b=jag(cone2[0]-cx,cone2[1]-cy,R*.14,7,.14);
 const id='vc'+(++volcN);let s=`<clipPath id="${id}">${poly(clipPoly,'')}</clipPath><g clip-path="url(#${id})">`;
 // the translucent dark rim: the game's shadow, round the whole silhouette
 for(const sh of [base,c2,...fl.map(f=>f.body)])s+=band(sh,30,'rgba(4,8,12,.5)');
 s+=poly(base,'fill="#5a4332" stroke="#6f5541" stroke-width="3" stroke-linejoin="round"');
 // ash fields on the lower slope
 for(let i=0;i<2;i++){const a=a1+1.3+i*2.6+(r()-.5)*.6,d=R*.72;s+=poly(jag(Math.cos(a)*d,Math.sin(a)*d,R*.2,6,.3),'fill="#3f3732"');}
 s+=poly(step1,'fill="#6b5040" stroke="#846757" stroke-width="3" stroke-linejoin="round"')+poly(step2,'fill="#7a5c4a" stroke="#957565" stroke-width="2.5" stroke-linejoin="round"');
 // the cinder cone on the flank
 s+=poly(c2,'fill="#4e3c30" stroke="#64503f" stroke-width="2.5" stroke-linejoin="round"')+poly(c2b,'fill="#5e4a3c"')+poly(jag(cone2[0]-cx,cone2[1]-cy,R*.055,6,.2),'fill="#2a1d16"')+dot(cone2[0],cone2[1],R*.02,'#d8512f');
 // fissure vents on the upper slope
 for(let i=0;i<3;i++){const a=a1+1.1+i*.5+(r()-.5)*.3,d0=R*.4,d1=R*(.52+r()*.1),dx=Math.cos(a),dy=Math.sin(a),px=-dy,py=dx,w=R*.02;
  s+=poly([[cx+dx*d0+px*w,cy+dy*d0+py*w],[cx+dx*d1,cy+dy*d1],[cx+dx*d0-px*w,cy+dy*d0-py*w]],'fill="#2a1d16"');if(i===1)s+=dot(cx+dx*(d0+R*.02),cy+dy*(d0+R*.02),R*.016,'#e0583a');}
 for(const f of fl)s+=f.svg;
 // the crater: dark rim, jagged inner wall, two benches, the lava lake
 s+=poly(jag(0,0,R*.36,9,.1),'fill="#3a2a22" stroke="#20160f" stroke-width="4" stroke-linejoin="round"')+poly(jag(0,0,R*.27,8,.15),'fill="#231812"');
 for(let i=0;i<2;i++){const a=r()*6.283;s+=poly([[cx+Math.cos(a)*R*.26,cy+Math.sin(a)*R*.26],[cx+Math.cos(a+.9)*R*.25,cy+Math.sin(a+.9)*R*.25],[cx+Math.cos(a+.6)*R*.17,cy+Math.sin(a+.6)*R*.17]],'fill="#4a3a32"');}
 s+=poly(jag(0,0,R*.17,7,.2),'fill="#8a2d1f"')+poly(jag(R*.01,-R*.01,R*.11,6,.25),'fill="#c8432a"')+poly(jag(R*.02,-R*.02,R*.055,5,.3),'fill="#f08a4a"')+dot(cx+R*.025,cy-R*.025,R*.02,'#ffd38a');
 return s+'</g>';};
const tropicExtras=({D,o,land})=>{const r=mkRng(21);let s='';for(const l of D.extras?.lagoon||[])s+=lagoonSvg((l.pts||l).map(([x,y])=>[x+o[0],y+o[1]]));
 for(const v of D.extras?.volcano||[]){const cx=v[0]+o[0],cy=v[1]+o[1],piece=land.find(p=>inside(cx,cy,p))||land[0];s+=volcanoSvg(r,cx,cy,v[2],piece);}return s;};

export const THEMES={
 meadow:{
  land:['#2f5b3b','#4f8a5a'],
  layer:{'#7fd68a':['#3d6d48','#6cae76'],'#b9f36d':['#4f7d40','#8fc25c'],'#d8f78f':['#62904f','#a6d07a'],'#5cc6a0':['#3b6b51','#62a27c']},
  sand:['#c9af7f','#e1cb9d'],wet:'#ad9466',dune:['#d6be8e','#e9d8ae'],duneTop:['#e2cfa3','#f1e5c6'],
  rock:[['#4b535b','#646d76'],['#58616a','#717b84'],['#666f78','#808a93'],['#757e87','#909aa2'],['#868f97','#a3acb3']],
  sea:SEA_DEFAULT,color:'#b9f36d',zones:{grass:'#b9f36d',sand:'#ecd29a',rock:'#93a9be'},
  decor:[
   ['grove',11,120,'grass',(r,x,y)=>grove(r,x,y),21],['bush',9,70,'grass',(r,x,y)=>bushes(r,x,y,['#2a6b3f','#3f8a4f']),22],
   ['fan',7,60,'grass',(r,x,y)=>leafFan(r,x,y,62+r()*34,5+Math.floor(r()*3),['#4f9a4f','#3f8644'],'#2c6136'),23],
   ['tuft',24,26,'grass',(r,x,y)=>leafFan(r,x,y,26+r()*16,6+Math.floor(r()*3),['#86b85a','#6fa34d'],null),24],
   ['flowers',9,44,'grass',(r,x,y)=>flowers(r,x,y,['#f4f1e6','#f4d9a8']),25],
   ['beachgrass',10,30,'sand',(r,x,y)=>leafFan(r,x,y,24+r()*16,7,['#b8bf73','#9fae5e'],null),31],['driftwood',4,50,'sand',driftwood,32],['shells',8,26,'sand',shells,33],
   ['moss',14,40,'rock',(r,x,y)=>moss(r,x,y),41]]},
 tropic:{
  land:['#3a6a35','#6fa352'],
  layer:{a:['#4d8a3a','#8ac85a'],b:['#5f9a3e','#a4d862'],c:['#73ac47','#bde86e'],lagoon:['#1d5a5c','#3f9aa0']},
  sand:['#d8c08a','#ecdcaa'],wet:'#b9a070',dune:['#e2cc98','#f0e2b8'],duneTop:['#ecd9ab','#f6ecd0'],
  // volcanic rock: basalt browns
  rock:[['#4a3a30','#6a5648'],['#5a4638','#7c6656'],['#6b5343','#8f7563'],['#7c6150','#a1866f'],['#8d6f5c','#b3977e']],sunken:[['#3f4a55',.75],['#2c4152',.55],['#1f3447',.36]],
  // the crag out in the sea (satellites.mjs): the island's basalt, a little greyer
  cragRock:[['#463b36','#655850'],['#554840','#76685f'],['#64554c','#88776d'],['#756359','#99887a'],['#857166','#ab998a']],
  sea:{far:'#0c1a22',mid:'#0e2a30',near:'#124042',tones:{far:'#2f4452',mid:'#355a62',near:'#427478'}},color:'#4fe0cf',zones:{grass:'#bfe85a',sand:'#f0d8a0',rock:'#b39a7c'},
  extras:tropicExtras,
  // fewer, bigger things: flowers two thirds of a card, plants at three sizes, loungers on the beaches
  decor:[
   ['flowers',9,78,'grass',flowerBed,25],['palms',7,120,'grass',(r,x,y)=>palmBig(r,x,y),21],['palmsmall',6,80,'grass',(r,x,y)=>palmSmall(r,x,y)+(r()<.5?palmSmall(r,x+(r()-.5)*90,y+(r()-.5)*70):''),26],
   ['giantleaf',5,100,'grass',giantLeaf,22],['midleaf',7,66,'grass',midLeaf,27],['smallleaf',8,40,'grass',smallLeaf,28],['bush',5,70,'grass',(r,x,y)=>bushes(r,x,y,['#2d7a45','#45a05a']),23],
   ['beachset',5,76,'sand',beachSet,34],['beachflower',3,70,'sand',(r,x,y)=>bigFlower(r,x,y,.9),35],['beachpalm',4,100,'sand',(r,x,y)=>palm(r,x,y,90),30],['driftwood',3,50,'sand',driftwood,32],['shells',3,26,'sand',shells,33],
   ['rockflower',3,70,'rock',(r,x,y)=>bigFlower(r,x,y,.85),42],['moss',6,40,'rock',(r,x,y)=>moss(r,x,y),41]]},
 maple:{
  land:['#2f5a52','#4f8a7a'],
  layer:{a:['#3d6d5f','#62a08c'],b:['#4b7f68','#7fb996'],c:['#5f9470','#9fcf9a']},
  // the shores are dark earth, not sand; the island rests on blue-grey rock
  sand:['#6b593b','#8c7850'],wet:'#4f4230',dune:['#7c6844','#9e8a5a'],duneTop:['#8d7850','#b09b66'],
  // five blue-grey tones a step apart you can see; under the water the rock goes on in three steps that fade into the sea
  rock:[['#243649','#3a5168'],['#35506a','#4f6d8a'],['#4a6a8a','#6f90ad'],['#6688a6','#8fb0cc'],['#86a7c2','#b3cde0']],rockRim:true,sunken:[['#2f4a60',.82],['#243a4c',.58],['#1b2f40',.36]],
  sea:{far:'#0c1620',mid:'#0f1d27',near:'#142a33',tones:{far:'#304250',mid:'#3a4c5c',near:'#44586a'}},color:'#ff6b86',zones:{grass:'#5fd3b8',sand:'#c9a86a',rock:'#9fbbd6'},
  // fewer, bigger, translucent: maple canopies and teal brush in chains, gold birches, fallen birch logs on the grass
  decor:[
   ['maple',14,104,'grass',(r,x,y)=>mapleCanopy(r,x,y),21,'core'],['maplebig',5,140,'grass',(r,x,y)=>mapleCanopy(r,x,y,1.45),29,'core'],
   ['brush',9,74,'grass',tealBrush,23,'edge'],['birch',4,90,'grass',birchStand,27],['birchlog',4,80,'grass',birchLog,26],
   ['shorebrush',3,70,'sand',tealBrush,31],
   ['moss',7,50,'rock',rockMoss,41]]},
 ruins:{
  land:['#8a7448','#a8905c'],
  layer:{oasis:['#4f7d40','#8fc25c'],oasis2:['#62904f','#a6d07a'],high:['#b08a52','#c9a66a'],high2:['#bf9a5e','#d6b47a']},
  sand:['#c8a86a','#e0c48a'],wet:'#a88a55',dune:['#d6b878','#eadca0'],duneTop:['#e4ca8e','#f3e6b8'],
  rock:[['#6b5538','#8a7250'],['#7a6342','#9b835a'],['#8a714a','#ad9465'],['#9a7f54','#bda572'],['#aa8e60','#ccb37e']],
  // the reefs round the island (satellites.mjs, spires): grey with a little dark brown in it, six steps from the waterline
  // to the tip, so the height of a rock shows as how light it gets; under the water three steps that fade into the sea
  cragRock:[['#3f3936','#57504b'],['#514a45','#6c645e'],['#665d57','#827870'],['#7c726a','#998e85'],['#938880','#b0a59b'],['#ada195','#c9beb2']],
  sunken:[['#45484a',.7],['#323e48',.5],['#243442',.32]],
  sea:{far:'#0c1620',mid:'#0f1b24',near:'#15262d',tones:{far:'#304250',mid:'#3a4a58',near:'#4a5a62'}},color:'#ffbf4a',zones:{grass:'#b9f36d',sand:'#ffd98a',rock:'#c9a86a'},
  layersOverSand:true,
  // the highland: a raised sand table with a dark cliff line round it
  plateau:p=>poly(p,'fill="#b89258" stroke="#6b4f30" stroke-width="18" stroke-linejoin="round"')+poly(p,'fill="none" stroke="#d6b276" stroke-width="3" stroke-linejoin="round"'),
  decor:[
   ['runes',7,80,'sand',runeRing,21],['rune',10,44,'sand',runeStone,22],['walls',12,110,'sand',wall,23],['scrub',22,26,'sand',scrub,24],['stones',12,44,'sand',sandStone,25],
   ['palms',6,110,'grass',palms,26],['bush',6,70,'grass',(r,x,y)=>bushes(r,x,y,['#2a6b3f','#3f8a4f']),27],['tuft',10,26,'grass',(r,x,y)=>leafFan(r,x,y,26+r()*16,6+Math.floor(r()*3),['#86b85a','#6fa34d'],null),28],
   ['highrune',5,44,'rock',runeStone,41],['highwall',6,110,'rock',wall,42],['highscrub',10,26,'rock',scrub,43]]},
 city:{
  land:['#59616a','#7c858e'],
  layer:{moss:['#4f7d3a','#7fb24f'],moss2:['#5f8f44','#93c25a'],slab:['#646c75','#848d96']},
  sand:['#8e8470','#a89d86'],wet:'#766d5c',dune:['#9a9078','#b2a890'],duneTop:['#a79d84','#bfb59d'],
  rock:[['#4b535b','#646d76'],['#58616a','#717b84'],['#666f78','#808a93'],['#757e87','#909aa2'],['#868f97','#a3acb3']],
  sea:{far:'#0c1620',mid:'#0e1c26',near:'#112530',tones:{far:'#304250',mid:'#374b5b',near:'#3f5466'}},color:'#8fcf5a',zones:{grass:'#8fcf5a',sand:'#c9bd9a',rock:'#a9b4bd'},
  extras:cityExtras,maskExtra:cityMask,
  decor:[
   ['moss',26,70,'grass',mossSheet,21],['trees',10,70,'grass',youngTrees,22],['crack',16,46,'grass',crack,23],['puddle',10,40,'grass',puddle,24],['rubble',14,44,'grass',rubble,25],
   ['tuft',16,26,'grass',(r,x,y)=>leafFan(r,x,y,22+r()*14,6+Math.floor(r()*3),['#86b85a','#6fa34d'],null),26],
   ['sandrubble',6,44,'sand',rubble,31],['sandpuddle',4,40,'sand',puddle,32],
   ['rockmoss',12,40,'rock',(r,x,y)=>moss(r,x,y),41],['rockrubble',8,44,'rock',rubble,42]]},
};
