// Builds the island art and layout modules for the game from the island 1 design.
//   node scripts/islands/build-art.mjs          uses the traced geometry in geom.json
//   node scripts/islands/build-art.mjs --geom   re-traces it first (python3 + OpenCV)
import fs from 'node:fs';
import {execFileSync} from 'node:child_process';
import * as G from './island1.mjs';
import * as BLD from './buildings.mjs';
import {rng,f1,poly,inside,edgeDist,blobPath} from './art.mjs';
const here=f=>new URL(f,import.meta.url),dist=f=>new URL('../../dist/'+f,import.meta.url);
if(process.argv.includes('--geom')){
 fs.writeFileSync(here('island1.json'),JSON.stringify({coast:G.COAST,small:G.SMALL,nodes:G.NODES,sandBands:G.SAND_BANDS,beach:G.BEACH,smallBeach:G.SMALL_BEACH,rockZones:G.ROCK_ZONES,terrain:G.TERRAIN}));
 execFileSync('python3',[new URL('geom.py',import.meta.url).pathname],{stdio:'inherit'});
}
const SEA=JSON.parse(fs.readFileSync(here('sea_v1.json')));
const GM=JSON.parse(fs.readFileSync(here('geom.json')));
const B=SEA.bounds,CW=G.CARD.w,CH=G.CARD.h;
const nodes=G.NODES.map(([id,x,y,req])=>({id,x,y,req,zone:GM.zones[id]}));
const nodeOf=id=>nodes.find(n=>n.id===id),root=nodes[0];
const WX0=B.x0-1500,WY0=B.y0-1500,WW=B.x1-B.x0+3000,WH=B.y1-B.y0+3000;

// ---- sea: v1 depth bands, shallows round the final outline, v1 triangles, canvas paths ----
let sea=SEA.bands;for(const p of GM.near)sea+=poly(p,'fill="#112530"');
const tri=SEA.tri.split('<g class="drift"').slice(1).map(g=>{const style=g.match(/style="([^"]*)"/)[1],pts=[...g.matchAll(/points="([^"]*)"/g)].flatMap(m=>m[1].split(' ').map(s=>s.split(',').map(Number)));
 const xs=pts.map(p=>p[0]),ys=pts.map(p=>p[1]),x0=Math.floor(Math.min(...xs))-30,y0=Math.floor(Math.min(...ys))-30,x1=Math.ceil(Math.max(...xs))+30,y1=Math.ceil(Math.max(...ys))+30;
 return {x0,y0,w:x1-x0,h:y1-y0,style,body:g.slice(g.indexOf('>')+1).replace(/<\/g>$/,'')};});
// sea grid: the game draws the dots over the whole view; their tone follows the depth bands
const DOT_TONE={'#0c1620':'#283845','#0e1c26':'#2d3f4d','#112530':'#334858'};
const depth=[...SEA.bands.matchAll(/points="([^"]+)" fill="([^"]+)"/g)].map(m=>({c:DOT_TONE[m[2]],pts:m[1].split(' ').map(q=>q.split(',').map(Number))})).concat(GM.near.map(p=>({c:DOT_TONE['#112530'],pts:p})));
if(depth.some(d=>!d.c))throw Error('unknown sea band colour');
const fx={surfIn:GM.surf[16],surfOut:GM.surf[38],waves:GM.waveRuns,mask:[...GM.land,...SEA.reefs.flatMap(r=>r.parts)],scan:[B.x0,B.x1],depth};

// ---- land: v1 reefs, grass, sand, rocks ----
let land='';
for(const p of [G.COAST,G.SMALL])land+=poly(p,'fill="#2f5b3b" stroke="#4f8a5a" stroke-width="3" stroke-linejoin="round"');
const LAYER={'#7fd68a':['#3d6d48','#6cae76'],'#b9f36d':['#4f7d40','#8fc25c'],'#d8f78f':['#62904f','#a6d07a'],'#5cc6a0':['#3b6b51','#62a27c']};
for(const l of GM.layers)for(const p of l.polys)land+=poly(p,`fill="${LAYER[l.c][0]}" stroke="${LAYER[l.c][1]}" stroke-width="3" stroke-linejoin="round"`);
for(const p of GM.sand)land+=poly(p,'fill="#c9af7f" stroke="#e1cb9d" stroke-width="3" stroke-linejoin="round"');
for(const p of GM.wet)land+=poly(p,'fill="#ad9466"');
for(const d of GM.dunes){for(const p of d.polys)land+=poly(p,'fill="#d6be8e" stroke="#e9d8ae" stroke-width="2.5" stroke-linejoin="round"');for(const p of d.top)land+=poly(p,'fill="#e2cfa3" stroke="#f1e5c6" stroke-width="2" stroke-linejoin="round"');}
const ROCK=[['#4b535b','#646d76'],['#58616a','#717b84'],['#666f78','#808a93'],['#757e87','#909aa2'],['#868f97','#a3acb3']];
for(const p of GM.rockBase)land+=poly(p,`fill="${ROCK[0][0]}" stroke="${ROCK[0][1]}" stroke-width="3" stroke-linejoin="round"`);
for(const r of GM.rocks){const [f,s]=ROCK[r.tone];land+=poly(r.pts,`fill="${f}" stroke="${s}" stroke-width="2.6" stroke-linejoin="miter"`);
 if(r.cap){const [f2,s2]=ROCK[Math.min(4,r.tone+1)];land+=poly(r.cap,`fill="${f2}" stroke="${s2}" stroke-width="2.2" stroke-linejoin="miter"`);}}
land=SEA.reefsSvg+land;
const back=`<svg xmlns="http://www.w3.org/2000/svg" width="${WW}" height="${WH}" viewBox="${WX0} ${WY0} ${WW} ${WH}">`+sea+land+`</svg>`;

// ---- landmark buildings (built when their study reaches MAX) ----
const BUILD={harbor:n=>BLD.harbor(n,CW,CH),hall:n=>BLD.hall(n,CW,CH),radio:n=>BLD.radio(n,CW,CH),lighthouse:(n,l)=>BLD.lighthouse(n,CW,CH,l.oct)};
const landmarks=G.LANDMARKS.map(l=>{const n=nodeOf(l.node);return {node:l.node,kind:l.kind,svg:BUILD[l.kind](n,l),beam:l.kind==='lighthouse'?[n.x,n.y]:null};});
// decoration keeps the confirmed placement (placed round the v3 frames), then the
// final footprints clear what they cover
const frameBox=l=>{const n=nodeOf(l.node);if(l.oct)return [n.x-l.oct,n.y-l.oct,n.x+l.oct,n.y+l.oct];const [px,py]=l.pad;let b=[n.x-CW/2-px,n.y-CH/2-py,n.x+CW/2+px,n.y+CH/2+py];
 if(l.kind==='harbor')b=[b[0]-110,b[1],b[2],1420];if(l.kind==='hall')b[3]+=40;if(l.kind==='radio'){const [dx,dy,dr]=l.dish;b=[b[0]-90,b[1],Math.max(b[2],n.x+dx+dr),b[3]];}return b;};
const frames=G.LANDMARKS.map(frameBox);
const footprint={harbor:n=>[n.x-296,n.y-122,n.x+156,1278],hall:n=>[n.x-225,n.y-133,n.x+169,n.y+180],radio:n=>[n.x-224,n.y-104,n.x+254,n.y+104],lighthouse:(n,l)=>[n.x-l.oct-4,n.y-l.oct-4,n.x+l.oct+4,n.y+l.oct+66]};
const boxes=G.LANDMARKS.map(l=>footprint[l.kind](nodeOf(l.node),l));

// ---- decoration (grows outward from the first study) ----
const sandPolys=GM.sand,rockPolys=[...GM.rockBase,...GM.rocks.map(r=>r.pts)];
const onSand=(x,y)=>sandPolys.some(p=>inside(x,y,p)),onRock=(x,y)=>rockPolys.some(p=>inside(x,y,p));
const onIsland=(x,y)=>[G.COAST,G.SMALL].find(p=>inside(x,y,p));
const nearCard=(x,y,pad)=>nodes.some(n=>Math.abs(x-n.x)<CW/2+pad&&Math.abs(y-n.y)<CH/2+pad);
const nearFrame=(x,y,pad)=>frames.some(b=>x>b[0]-pad&&x<b[2]+pad&&y>b[1]-pad&&y<b[3]+pad);
const labelBox=[G.LABEL[0]-20,G.LABEL[1]-40,G.LABEL[0]+260,G.LABEL[1]+110];
const decor=[],taken=[];
const free=(x,y,rad)=>!taken.some(t=>Math.hypot(t[0]-x,t[1]-y)<t[2]+rad);
const leafFan=(r,x,y,len,count,cols,rib)=>{let s='';const a0=r()*6.283;for(let i=0;i<count;i++){const a=a0+i/count*6.283+(r()-.5)*.5,L=len*(.72+r()*.32),w=L*.17,dx=Math.cos(a),dy=Math.sin(a),px=-dy,py=dx;
  const tip=[x+dx*L,y+dy*L],m1=[x+dx*L*.45+px*w*1.6,y+dy*L*.45+py*w*1.6],m2=[x+dx*L*.45-px*w*1.6,y+dy*L*.45-py*w*1.6];
  s+=`<path d="M${f1(x)} ${f1(y)}Q${f1(m1[0])} ${f1(m1[1])} ${f1(tip[0])} ${f1(tip[1])}Q${f1(m2[0])} ${f1(m2[1])} ${f1(x)} ${f1(y)}Z" fill="${cols[i%cols.length]}"/>`;
  if(rib)s+=`<path d="M${f1(x)} ${f1(y)}L${f1(x+dx*L*.86)} ${f1(y+dy*L*.86)}" stroke="${rib}" stroke-width="1.8" stroke-linecap="round"/>`;}
 return s;};
const tree=(r,x,y,R)=>`<path d="${blobPath(r,x,y,R,9,.1)}" fill="#235a36"/><path d="${blobPath(r,x+(r()-.5)*R*.2,y+(r()-.5)*R*.2,R*.74,8,.12)}" fill="#2f7345"/><path d="${blobPath(r,x+(r()-.5)*R*.3,y+(r()-.5)*R*.3,R*.42,7,.15)}" fill="#418d52"/>`;
const flower=(x,y,s,c)=>{let o='';for(let i=0;i<5;i++){const a=i/5*6.283;o+=`<circle cx="${f1(x+Math.cos(a)*s*.55)}" cy="${f1(y+Math.sin(a)*s*.55)}" r="${f1(s*.48)}" fill="${c}"/>`;}return o+`<circle cx="${f1(x)}" cy="${f1(y)}" r="${f1(s*.36)}" fill="#f2c94c"/>`;};
function place(kind,count,rad,ok,draw,seed){const r=rng(seed);let made=0;for(let tries=0;made<count&&tries<6000;tries++){const x=B.x0+r()*(B.x1-B.x0),y=B.y0+r()*(B.y1-B.y0);
  if(!ok(x,y,rad,r)||!free(x,y,rad))continue;taken.push([x,y,rad]);decor.push({x,y,kind,svg:draw(r,x,y)});made++;}}
const grassOK=(x,y,rad)=>{const isl=onIsland(x,y);return isl&&edgeDist(x,y,isl)>rad+26&&!onSand(x,y)&&!onRock(x,y)&&!nearCard(x,y,rad*.5+14)&&!nearFrame(x,y,rad*.5+8);};
place('grove',11,120,grassOK,(r,x,y)=>{let s='';const k=2+Math.floor(r()*3),parts=[];for(let i=0;i<k;i++){const R=34+r()*30;parts.push([x+(r()-.5)*130,y+(r()-.5)*100,R]);}parts.sort((a,b)=>a[1]-b[1]);for(const [px,py,R] of parts)s+=tree(r,px,py,R);return s;},21);
place('bush',9,70,grassOK,(r,x,y)=>{let s='';const k=3+Math.floor(r()*4);for(let i=0;i<k;i++){const bx=x+(r()-.5)*110,by=y+(r()-.5)*60,R=13+r()*11;s+=`<path d="${blobPath(r,bx,by,R,7,.12)}" fill="#2a6b3f"/><path d="${blobPath(r,bx,by,R*.55,6,.15)}" fill="#3f8a4f"/>`;}return s;},22);
place('fan',7,60,grassOK,(r,x,y)=>leafFan(r,x,y,62+r()*34,5+Math.floor(r()*3),['#4f9a4f','#3f8644'],'#2c6136'),23);
place('tuft',24,26,grassOK,(r,x,y)=>leafFan(r,x,y,26+r()*16,6+Math.floor(r()*3),['#86b85a','#6fa34d'],null),24);
place('flowers',9,44,grassOK,(r,x,y)=>{let s='';const k=3+Math.floor(r()*5);for(let i=0;i<k;i++)s+=flower(x+(r()-.5)*70,y+(r()-.5)*50,8+r()*4,r()<.75?'#f4f1e6':'#f4d9a8');return s;},25);
const sandOK=(x,y,rad)=>onSand(x,y)&&!nearCard(x,y,rad*.5+14)&&!nearFrame(x,y,rad*.5+8)&&sandPolys.some(p=>inside(x,y,p)&&edgeDist(x,y,p)>rad*.6+10);
place('beachgrass',10,30,sandOK,(r,x,y)=>leafFan(r,x,y,24+r()*16,7,['#b8bf73','#9fae5e'],null),31);
place('driftwood',4,50,sandOK,(r,x,y)=>{const a=(r()-.5)*1.4,L=70+r()*40,c=Math.cos(a),s=Math.sin(a);const pts=[[-L/2,-7],[L/2,-5],[L/2+4,0],[L/2,5],[-L/2,7],[-L/2-3,0]].map(([u,v])=>[x+c*u-s*v,y+s*u+c*v]);
  const br=[[L*.15,-4],[L*.3,-20]].map(([u,v])=>[x+c*u-s*v,y+s*u+c*v]);return poly(pts,'fill="#8b7357"')+`<path d="M${f1(br[0][0])} ${f1(br[0][1])}L${f1(br[1][0])} ${f1(br[1][1])}" stroke="#8b7357" stroke-width="6" stroke-linecap="round"/>`+`<path d="M${f1(pts[5][0])} ${f1(pts[5][1])}L${f1(pts[2][0])} ${f1(pts[2][1])}" stroke="#a58c6c" stroke-width="2"/>`;},32);
place('shells',8,26,sandOK,(r,x,y)=>{let s='';for(let i=0;i<4;i++){const sx=x+(r()-.5)*40,sy=y+(r()-.5)*30;s+=`<ellipse cx="${f1(sx)}" cy="${f1(sy)}" rx="${f1(4+r()*4)}" ry="${f1(3+r()*3)}" fill="${['#efe6d2','#e8d7c4','#d9cdb8'][i%3]}"/>`;}return s;},33);
const rockOK=(x,y,rad)=>onRock(x,y)&&!nearCard(x,y,rad*.4+10)&&!nearFrame(x,y,rad*.4+6)&&!(x>labelBox[0]&&x<labelBox[2]&&y>labelBox[1]&&y<labelBox[3]);
place('moss',14,40,rockOK,(r,x,y)=>{let s='';const k=2+Math.floor(r()*3);for(let i=0;i<k;i++){const R=12+r()*18;s+=`<path d="${blobPath(r,x+(r()-.5)*50,y+(r()-.5)*36,R,7,.18)}" fill="${['#5b8a45','#6e9f50','#4f7d3d'][i%3]}"/>`;}for(let i=0;i<5;i++)s+=`<circle cx="${f1(x+(r()-.5)*70)}" cy="${f1(y+(r()-.5)*50)}" r="${f1(2+r()*2.5)}" fill="#9cc073"/>`;return s;},41);
decor.sort((a,b)=>Math.hypot(a.x-root.x,a.y-root.y)-Math.hypot(b.x-root.x,b.y-root.y));
decor.forEach((d,i)=>d.t=+(.03+.9*i/decor.length).toFixed(3));
const cleared=decor.filter(d=>!boxes.some(b=>d.x>b[0]-24&&d.x<b[2]+24&&d.y>b[1]-24&&d.y<b[3]+24));

// ---- modules ----
const head='// Generated by scripts/islands/build-art.mjs from the island 1 design. Do not edit.\n';
const islandNodes=nodes.map(n=>({id:n.id,content:G.CONTENT[n.id]||n.id,island:G.ISLAND.id,x:n.x,y:n.y,req:n.req,zone:n.zone}));
const xs=nodes.map(n=>n.x),ys=nodes.map(n=>n.y);
const islands=[{...G.ISLAND,label:G.LABEL,landmarks:G.LANDMARKS.map(l=>({node:l.node,kind:l.kind})),bounds:{minX:B.x0,minY:B.y0,maxX:B.x1,maxY:B.y1}}];
fs.writeFileSync(dist('islands.js'),head+`export const ISLANDS=${JSON.stringify(islands)};\nexport const ISLAND_NODES=${JSON.stringify(islandNodes)};\n`);
const art={world:[WX0,WY0,WW,WH],back,tri,fx,decor:cleared.map(d=>({t:d.t,svg:d.svg})),landmarks,label:G.LABEL};
fs.writeFileSync(dist('island-art.js'),head+`export const ISLAND_ART=${JSON.stringify(art)};\n`);
console.log('islands.js',(fs.statSync(dist('islands.js')).size/1024).toFixed(1)+'KB','island-art.js',(fs.statSync(dist('island-art.js')).size/1024).toFixed(0)+'KB','decor',cleared.length);
