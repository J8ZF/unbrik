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
 if(i%3===1){base.splice(2,2,[x1,y0+c],[x1-w*.3,y0+h*.35],[x1-w*.34,y1-h*.3],[x1,y1-c]);}// a broken corner
 s+=poly(base,'fill="#3b4248" stroke="#262c31" stroke-width="3" stroke-linejoin="miter"');
 const inner=base.map(([x,y])=>[x+(x<x0+w/2?10:-10),y+(y<y0+h/2?10:-10)]);s+=poly(inner,'fill="#6f777e"');
 s+=`<rect x="${f1(x0+28)}" y="${f1(y0+h*.42)}" width="${f1(w-56)}" height="${f1(h*.16)}" fill="#2a3035" stroke="#4b5359" stroke-width="1.6"/>`;
 for(let k=0;k<3;k++)s+=`<rect x="${f1(x0+30+k*34)}" y="${f1(y0+24)}" width="22" height="16" fill="#9aa3aa" stroke="#4b5359" stroke-width="1.4"/>`;
 s+=`<circle cx="${f1(x1-40)}" cy="${f1(y1-40)}" r="13" fill="#8a939b" stroke="#4b5359" stroke-width="1.8"/><circle cx="${f1(x1-40)}" cy="${f1(y1-40)}" r="4" fill="#2a3035"/>`;
 for(let k=0;k<4;k++)s+=`<path d="${blobPath(r,x0+20+r()*(w-40),y0+20+r()*(h-40),10+r()*14,7,.2)}" fill="${['#4f7d3a','#5f9144'][k%2]}"/>`;
 if(i%3===1)for(let k=0;k<5;k++)s+=poly(rectPts(x1-w*.2+(r()-.5)*60,y0+h*.5+(r()-.5)*80,10+r()*16,7+r()*9,r()*180),'fill="#8f979d" stroke="#4e565c" stroke-width="1.4"');
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
  rock:[['#4b535b','#646d76'],['#58616a','#717b84'],['#666f78','#808a93'],['#757e87','#909aa2'],['#868f97','#a3acb3']],
  sea:{far:'#0c1a22',mid:'#0e2a30',near:'#124042',tones:{far:'#2f4452',mid:'#355a62',near:'#427478'}},color:'#4fe0cf',zones:{grass:'#bfe85a',sand:'#f0d8a0',rock:'#93a9be'},
  decor:[
   ['palms',14,110,'grass',palms,21],['bigleaf',10,62,'grass',bigleaf,22],['bush',8,70,'grass',(r,x,y)=>bushes(r,x,y,['#2d7a45','#45a05a']),23],
   ['tuft',22,26,'grass',(r,x,y)=>leafFan(r,x,y,24+r()*16,6+Math.floor(r()*3),['#a6d85a','#8fc24e'],null),24],
   ['flowers',10,44,'grass',(r,x,y)=>flowers(r,x,y,['#ff7b9c','#ffd166'],'#fff1c1'),25],
   ['beachpalm',6,90,'sand',(r,x,y)=>palm(r,x,y,80),30],['beachgrass',12,30,'sand',(r,x,y)=>leafFan(r,x,y,24+r()*16,7,['#c3c67a','#a9b463'],null),31],['driftwood',5,50,'sand',driftwood,32],['shells',10,26,'sand',shells,33],
   ['moss',10,40,'rock',(r,x,y)=>moss(r,x,y),41]]},
 maple:{
  land:['#2f5a52','#4f8a7a'],
  layer:{a:['#3d6d5f','#62a08c'],b:['#4b7f68','#7fb996'],c:['#5f9470','#9fcf9a']},
  sand:['#c2b08a','#dccba3'],wet:'#a69068',dune:['#d0bf98','#e4d7b4'],duneTop:['#dfd0ab','#efe5c9'],
  rock:[['#5a4a32','#7a6646'],['#6b593b','#8c7850'],['#7c6844','#9e8a5a'],['#8d7850','#b09b66'],['#9f8a5e','#c2ad74']],
  sea:{far:'#0c1620',mid:'#0f1d27',near:'#142a33',tones:{far:'#304250',mid:'#3a4c5c',near:'#44586a'}},color:'#ff6b86',zones:{grass:'#5fd3b8',sand:'#e8d6ad',rock:'#c9a86a'},
  decor:[
   ['maples',13,120,'grass',mapleGrove,21],['litter',12,46,'grass',leafLitter,22],['bush',8,70,'grass',(r,x,y)=>bushes(r,x,y,['#2f6b5c','#48927c']),23],
   ['fan',7,60,'grass',(r,x,y)=>leafFan(r,x,y,56+r()*30,5+Math.floor(r()*3),['#3f9a86','#2f7f6f'],'#1f5a50'),24],
   ['tuft',24,26,'grass',(r,x,y)=>leafFan(r,x,y,26+r()*16,6+Math.floor(r()*3),['#4fb39a','#3f9a86'],null),25],
   ['beachgrass',8,30,'sand',(r,x,y)=>leafFan(r,x,y,24+r()*16,7,['#b8bf73','#9fae5e'],null),31],['driftwood',3,50,'sand',driftwood,32],['shells',6,26,'sand',shells,33],
   ['moss',14,40,'rock',(r,x,y)=>moss(r,x,y,['#6b8a45','#7e9f50','#5f7d3d'],'#b0c073'),41]]},
 ruins:{
  land:['#8a7448','#a8905c'],
  layer:{oasis:['#4f7d40','#8fc25c'],oasis2:['#62904f','#a6d07a'],high:['#b08a52','#c9a66a'],high2:['#bf9a5e','#d6b47a']},
  sand:['#c8a86a','#e0c48a'],wet:'#a88a55',dune:['#d6b878','#eadca0'],duneTop:['#e4ca8e','#f3e6b8'],
  rock:[['#6b5538','#8a7250'],['#7a6342','#9b835a'],['#8a714a','#ad9465'],['#9a7f54','#bda572'],['#aa8e60','#ccb37e']],
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
