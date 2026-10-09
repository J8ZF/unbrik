// Builds the island art and layout modules for the game from the island designs.
//   node scripts/islands/build-art.mjs            uses the cached trees and traced geometry
//   node scripts/islands/build-art.mjs --geom     re-traces the geometry (python3 + OpenCV)
//   node scripts/islands/build-art.mjs --tree     regrows the study trees of islands 2+ (then re-traces)
// Each island is one picture: its sea, land and still decoration, with the
// moving-sea data (surf, waves, grid mask, depth) and the decoration that grows
// with progress. The observatory is one more picture. Island 1 reproduces the
// confirmed design exactly.
import fs from 'node:fs';
import {execFileSync} from 'node:child_process';
import * as BLD from './buildings.mjs';
import {rng,f1,poly,inside,edgeDist,rectPts} from './art.mjs';
import {buildObservatory} from './observatory.mjs';
import {loadDesign} from './design.mjs';
import {genTree} from './treegen.mjs';
import {buildSea,bandsSvg,triFragments} from './sea.mjs';
import {THEMES} from './themes.mjs';
import {BASIN,SEABED,TONE} from './seabed.mjs';
import {SATELLITES} from './satellites.mjs';
import {RESEARCH} from '../../dist/research.js';
const MAX_OF=new Map(RESEARCH.map(r=>[r.id,r.max]));
const here=f=>new URL(f,import.meta.url),dist=f=>new URL('../../dist/'+f,import.meta.url);
const REGEOM=process.argv.includes('--geom'),RETREE=process.argv.includes('--tree');
const CW=146,CH=118;
const DESIGNS=['island1','island2','island3','island4','island5'].filter(n=>fs.existsSync(here(n+'.mjs')));
const OBS=buildObservatory(),[OCX,OCY]=OBS.center,OR=OBS.radius+120;
// 3.x studies borrowed by islands 2+ until the 4.0 content list exists: islands 2–3
// take #31–65 and #66–105 in order; islands 4–5 cycle through the catalogue
// (no second coin unlock), island 5 ending on AXIOM.
const BORROW={2:Array.from({length:35},(_,i)=>31+i),3:Array.from({length:40},(_,i)=>66+i),4:Array.from({length:60},(_,i)=>31+i),5:[...Array.from({length:21},(_,i)=>1+i),...Array.from({length:66},(_,i)=>23+i),105]};
// The ground of a piece of land from its traced geometry, in the island's theme: sunken rock, land, terrain layers, sand, rock.
function groundSvg(GM,T,pieces){
 let ground='';
 // sunken rock: the big coast blocks go on under the water in steps, each step deeper and fainter (the deepest first)
 if(GM.sunken?.length&&T.sunken)for(const b of [...GM.sunken].sort((a,c)=>c.level-a.level)){const [f,op]=T.sunken[Math.min(T.sunken.length,b.level)-1];ground+=poly(b.pts,`fill="${f}" fill-opacity="${op}"`);}
 for(const p of pieces)ground+=poly(p,`fill="${T.land[0]}" stroke="${T.land[1]}" stroke-width="3" stroke-linejoin="round"`);
 if(T.plateau)for(const p of GM.rockBase)ground+=T.plateau(p);
 const layersSvg=()=>{let g='';for(const l of GM.layers)for(const p of l.polys){const c=T.layer[l.c];if(!c)throw Error('unknown layer '+l.c);g+=poly(p,`fill="${c[0]}" stroke="${c[1]}" stroke-width="3" stroke-linejoin="round"`);}return g;};
 if(!T.layersOverSand)ground+=layersSvg();
 for(const p of GM.sand)ground+=poly(p,`fill="${T.sand[0]}" stroke="${T.sand[1]}" stroke-width="3" stroke-linejoin="round"`);
 for(const p of GM.wet)ground+=poly(p,`fill="${T.wet}"`);
 for(const d of GM.dunes){for(const p of d.polys)ground+=poly(p,`fill="${T.dune[0]}" stroke="${T.dune[1]}" stroke-width="2.5" stroke-linejoin="round"`);for(const p of d.top)ground+=poly(p,`fill="${T.duneTop[0]}" stroke="${T.duneTop[1]}" stroke-width="2" stroke-linejoin="round"`);}
 if(T.layersOverSand)ground+=layersSvg();
 const ROCK=T.rock;
 // the rock masses part from the land with the game's dark rim where the theme asks (the sky islands' band)
 if(T.rockRim)for(const p of GM.rockBase)ground+=poly(p,'fill="none" stroke="#04080c" stroke-opacity=".5" stroke-width="44" stroke-linejoin="round"');
 if(!T.plateau)for(const p of GM.rockBase)ground+=poly(p,`fill="${ROCK[0][0]}" stroke="${ROCK[0][1]}" stroke-width="3" stroke-linejoin="round"`);
 for(const r of GM.rocks){const [f,s]=ROCK[r.tone];ground+=poly(r.pts,`fill="${f}" stroke="${s}" stroke-width="2.6" stroke-linejoin="miter"`);
  if(r.cap){const [f2,s2]=ROCK[Math.min(4,r.tone+1)];ground+=poly(r.cap,`fill="${f2}" stroke="${s2}" stroke-width="2.2" stroke-linejoin="miter"`);}}
 return ground;}
const pictures=[],islands=[],allNodes=[],shallowsOf={};let firstId=1,prevGate=null;
const W2=(pts,o)=>pts.map(([x,y])=>[x+o[0],y+o[1]]);
for(const name of DESIGNS){
 const D=await loadDesign(name),T=THEMES[D.theme],o=D.origin;
 // ---- land in world coordinates ----
 const land={};for(const [k,p] of Object.entries(D.land))land[k]=W2(p,o);
 const pieces=Object.values(land),holes=(D.holes||[]).map(p=>W2(p,o)),avoid=(D.avoid||[]).map(b=>[b[0]+o[0],b[1]+o[1],b[2]+o[0],b[3]+o[1]]);
 const label=[D.label[0]+o[0],D.label[1]+o[1]];
 // ---- studies: island 1's hand layout, or a grown tree (cached) ----
 let nodes,landmarks,choice=null,levelReq=null,borrow=null;
 if(D.nodes){nodes=D.nodes.map(([id,x,y,req])=>({id,x,y,req}));landmarks=D.landmarks.map(l=>({...l}));}
 else{
  const cache=here(name+'.tree.json');let tree;
  if(!RETREE&&fs.existsSync(cache))tree=JSON.parse(fs.readFileSync(cache));
  else{const t=D.tree;tree=genTree({land:pieces,holes,avoid,root:[t.root[0]+o[0],t.root[1]+o[1]],gate:[t.gate[0]+o[0],t.gate[1]+o[1]],marks:t.marks.map(m=>m.at?{...m,at:[m.at[0]+o[0],m.at[1]+o[1]]}:[m[0]+o[0],m[1]+o[1]]),count:t.count,seed:t.seed,spacing:t.spacing,link:t.link,bridge:t.bridge});
   fs.writeFileSync(cache,JSON.stringify(tree));console.log(name,'tree',tree.used,'of',tree.spots,'spots,',tree.bridges,'bridges');}
  nodes=tree.nodes.map(([id,x,y,req])=>({id,x,y,req}));
  landmarks=tree.marks.map((id,i)=>({...D.landmarks[i],node:id}));
  // borrowed content: landmark studies get an upgradeable study (a building rises at MAX), swapping with a later study if needed
  borrow=BORROW[D.id].slice();
  for(const l of landmarks){const i=l.node-1;if((MAX_OF.get(borrow[i])||0)>=5)continue;const j=borrow.findIndex((c,k)=>k>i&&(MAX_OF.get(c)||0)>=5&&!landmarks.some(m=>m.node===k+1));if(j<0)throw Error(name+': no upgradeable study left for a landmark');[borrow[i],borrow[j]]=[borrow[j],borrow[i]];}
  // one A/B pair: the first two siblings that are neither landmarks nor the last study
  const hasKids=id=>nodes.some(n=>n.req[0]===id);
  const byParent=new Map();for(const n of nodes){if(!n.req.length||landmarks.some(l=>l.node===n.id)||n.id===tree.gate||hasKids(n.id))continue;const p=n.req[0];if(!byParent.has(p))byParent.set(p,[]);byParent.get(p).push(n.id);}
  for(const [,kids] of byParent)if(kids.length>=2){choice=kids.slice(0,2);break;}
  // islands 3+: one study asks for its prerequisite at a level (the prerequisite must have levels)
  if(D.id>=3){const cand=nodes.find(n=>n.req.length&&n.id>3&&!(choice||[]).includes(n.id)&&(MAX_OF.get(borrow[n.req[0]-1])||0)>=5);if(cand)levelReq={id:cand.id,level:3};}
 }
 const nodeOf=id=>nodes.find(n=>n.id===id),root=nodes[0];
 // ---- sea ----
 let SEA;
 if(D.seaFile)SEA=JSON.parse(fs.readFileSync(here(D.seaFile)));
 else{const all=pieces.flat(),xs=all.map(p=>p[0]),ys=all.map(p=>p[1]);const bounds={x0:Math.min(...xs)-420,y0:Math.min(...ys)-360,x1:Math.max(...xs)+380,y1:Math.max(...ys)+360};
  SEA={bounds,...buildSea(pieces,bounds,{seed:D.id*7,water:T.sea,reefCount:D.reefs||14})};}
 const B=SEA.bounds;
 // ---- geometry (traced with OpenCV, cached) ----
 const gfile=here(name+'.geom.json'),gin=here(name+'.geom-in.json');
 if(REGEOM||RETREE||!fs.existsSync(gfile)){
  const sandBands=(D.sandBands||[]).map(b=>Array.isArray(b)?b:{...b,from:[b.from[0]+o[0],b.from[1]+o[1]],to:[b.to[0]+o[0],b.to[1]+o[1]]});
  fs.writeFileSync(gin,JSON.stringify({land,nodes:nodes.map(n=>[n.id,n.x,n.y]),sandBands,sandPieces:D.sandPieces||[],beach:(D.beach||[]).map(([x0,y0,x1,y1,w])=>[x0+o[0],y0+o[1],x1+o[0],y1+o[1],w]),
   rockZones:(D.rockZones||[]).map(z=>({...z,area:W2(z.area,o),core:(z.core||[]).map(([cx,cy,w,h,a])=>[cx+o[0],cy+o[1],w,h,a])})),rockPolys:(D.extras?.plateau||[]).map(p=>W2(p.pts||p,o)),
   sandHoles:(D.sandHoles||[]).map(p=>W2(p,o)),terrain:(D.terrain||[]).map(t=>({c:t.c,pts:W2(t.pts,o)})),reefs:SEA.reefs.flatMap(r=>r.parts),...(D.geom||{}),duneCount:D.duneCount}));
  execFileSync('python3',[here('geom.py').pathname,gin.pathname,gfile.pathname],{stdio:'inherit'});fs.unlinkSync(gin);}
 const GM=JSON.parse(fs.readFileSync(gfile));
 for(const n of nodes)n.zone=GM.zones[n.id];
 if(GM.offLand.length)console.warn(name,'cards too close to the water:',GM.offLand.join(','));
 // ---- sea picture: depth bands, shallows round the final outline, reefs ----
 const bands=D.seaFile?{bands:SEA.bands,depth:[...SEA.bands.matchAll(/points="([^"]+)" fill="([^"]+)"/g)].map(m=>({c:{'#0c1620':'#304250','#0e1c26':'#374b5b','#112530':'#3f5466'}[m[2]],pts:m[1].split(' ').map(q=>q.split(',').map(Number))}))}:bandsSvg(GM,T.sea,D.id*3);
 // the far and middle bands are no longer painted here: the sea floor is drawn under the pictures (seabed.mjs);
 // only the shallows hugging the shore stay in the picture. The bands still tone the sea grid (depth, below).
 let sea=bands.bands;for(const c of new Set([T.sea.far,T.sea.mid,'#0c1620','#0e1c26'])){const n=sea.length;sea=sea.split(`fill="${c}"/>`).map((s,i,a)=>i<a.length-1?s.slice(0,s.lastIndexOf('<polygon ')):s).join('');}
 for(const p of GM.near)sea+=poly(p,`fill="${T.sea.near}"`);
 // an island whose sea floor is drawn (seabed.mjs) gives its shallows to that layer too: the ring round the shore is then a
 // veil over the shelf instead of an opaque band that would hide it; the picture keeps only what stands in the water
 const shallows=[];
 if(SEABED[D.id]){for(const m of sea.matchAll(/<polygon points="([^"]+)"/g))shallows.push(m[1].split(' ').map(q=>q.split(',').map(Number)));sea='';}
 // the drifting shapes were opaque near-black; over the tinted sea they are the same shapes as faint light veils
 const VEIL={'#0c141c':.03,'#0d1620':.045,'#0f1a24':.065,'#111e29':.09};
 const tri=triFragments(SEA.tri).map(f=>({...f,body:f.body.replace(/ fill="(#[0-9a-f]{6})" stroke="\1" stroke-width="1"/g,(m,c)=>{if(!(c in VEIL))throw Error('unknown drift colour '+c);return ` fill="#8fb0cc" fill-opacity="${VEIL[c]}"`;})}));
 const depth=bands.depth;depth.push(...GM.near.map(p=>({c:T.sea.tones.near,pts:p})));
 if(depth.some(d=>!d.c))throw Error('unknown sea band colour');
 // ---- land: reefs, ground, grass layers, sand, rocks ----
 const ground=groundSvg(GM,T,pieces);
 let extras='';if(T.extras)extras=T.extras({D,o,nodes,GM,land:pieces,rng});
 const picture=SEA.reefsSvg+ground+extras;
 const PW=B.x1-B.x0,PH=B.y1-B.y0;
 const back=`<svg xmlns="http://www.w3.org/2000/svg" width="${PW}" height="${PH}" viewBox="${B.x0} ${B.y0} ${PW} ${PH}">`+sea+picture+`</svg>`;
 // ---- landmark buildings (built when their study reaches MAX) ----
 const built=landmarks.map(l=>{const n=nodeOf(l.node),f=BLD.KINDS[l.kind];if(!f)throw Error('unknown landmark '+l.kind);return {node:l.node,kind:l.kind,svg:f(n,CW,CH,l,{coast:pieces,rock:T.rock}),over:BLD.OVER[l.kind]?BLD.OVER[l.kind](n,CW,CH):'',beam:l.kind==='lighthouse'?[n.x,n.y]:null,box:BLD.FOOTPRINT[l.kind](n,l)};});
 // decoration keeps clear of the cards and frames, then the final footprints clear what they cover
 const frames=landmarks.map(l=>{const n=nodeOf(l.node);if(l.oct)return [n.x-l.oct,n.y-l.oct,n.x+l.oct,n.y+l.oct];const [px,py]=l.pad||[90,70];let b=[n.x-CW/2-px,n.y-CH/2-py,n.x+CW/2+px,n.y+CH/2+py];
  if(l.kind==='harbor')b=[b[0]-110,b[1],b[2],1420];if(l.kind==='hall')b[3]+=40;if(l.kind==='radio'){const [dx,dy,dr]=l.dish;b=[b[0]-90,b[1],Math.max(b[2],n.x+dx+dr),b[3]];}return b;});
 const sandPolys=GM.sand,rockPolys=[...GM.rockBase,...GM.rocks.map(r=>r.pts)];
 const onSand=(x,y)=>sandPolys.some(p=>inside(x,y,p)),onRock=(x,y)=>rockPolys.some(p=>inside(x,y,p));
 const onIsland=(x,y)=>pieces.find(p=>inside(x,y,p));
 const inHole=(x,y)=>holes.some(p=>inside(x,y,p)||edgeDist(x,y,p)<30)||avoid.some(b=>x>b[0]-20&&x<b[2]+20&&y>b[1]-20&&y<b[3]+20);
 const nearCard=(x,y,pad)=>nodes.some(n=>Math.abs(x-n.x)<CW/2+pad&&Math.abs(y-n.y)<CH/2+pad);
 const nearFrame=(x,y,pad)=>frames.some(b=>x>b[0]-pad&&x<b[2]+pad&&y>b[1]-pad&&y<b[3]+pad);
 const labelBox=[label[0]-20,label[1]-40,label[0]+260,label[1]+110];
 const decor=[],taken=[];
 const free=(x,y,rad)=>!taken.some(t=>Math.hypot(t[0]-x,t[1]-y)<t[2]+rad);
 function place(kind,count,rad,ok,draw,seed){const r=rng(seed);let made=0;for(let tries=0;made<count&&tries<6000;tries++){const x=B.x0+r()*(B.x1-B.x0),y=B.y0+r()*(B.y1-B.y0);
  if(!ok(x,y,rad,r)||!free(x,y,rad))continue;taken.push([x,y,rad]);decor.push({x,y,kind,svg:draw(r,x,y)});made++;}}
 const grassOK=(x,y,rad)=>{const isl=onIsland(x,y);return isl&&edgeDist(x,y,isl)>rad+26&&!onSand(x,y)&&!onRock(x,y)&&!inHole(x,y)&&!nearCard(x,y,rad*.5+14)&&!nearFrame(x,y,rad*.5+8);};
 const sandOK=(x,y,rad)=>onSand(x,y)&&!inHole(x,y)&&!nearCard(x,y,rad*.5+14)&&!nearFrame(x,y,rad*.5+8)&&sandPolys.some(p=>inside(x,y,p)&&edgeDist(x,y,p)>rad*.6+10);
 const rockOK=(x,y,rad)=>onRock(x,y)&&!inHole(x,y)&&!nearCard(x,y,rad*.4+10)&&!nearFrame(x,y,rad*.4+6)&&!(x>labelBox[0]&&x<labelBox[2]&&y>labelBox[1]&&y<labelBox[3]);
 const OK={grass:grassOK,sand:sandOK,rock:rockOK};
 // a decoration may keep to the heart of its piece ('core') or to the outer ring ('edge')
 const pieceInfo=pieces.map(p=>{const c=[p.reduce((a,q)=>a+q[0],0)/p.length,p.reduce((a,q)=>a+q[1],0)/p.length];return {c,r:Math.max(...p.map(q=>Math.hypot(q[0]-c[0],q[1]-c[1])))};});
 const region=(x,y,where)=>{const i=pieces.findIndex(p=>inside(x,y,p));if(i<0)return false;const {c,r}=pieceInfo[i],d=Math.hypot(x-c[0],y-c[1])/r;return where==='core'?d<.5:where==='edge'?d>=.42:true;};
 // the counts are for island 1's size; bigger islands get more
 const areaScale=D.seaFile?1:Math.max(1,Math.min(2.2,(PW*PH)/(3112*2502)));
 for(const [kind,count,rad,ground2,draw,seed,where] of T.decor)place(kind,Math.round(count*areaScale),rad,where?(x,y,r2,r3)=>OK[ground2](x,y,r2,r3)&&region(x,y,where):OK[ground2],draw,seed);
 decor.sort((a,b)=>Math.hypot(a.x-root.x,a.y-root.y)-Math.hypot(b.x-root.x,b.y-root.y));
 decor.forEach((d,i)=>d.t=+(.03+.9*i/decor.length).toFixed(3));
 const boxes=built.map(b=>b.box);
 const cleared=decor.filter(d=>!boxes.some(b=>d.x>b[0]-24&&d.x<b[2]+24&&d.y>b[1]-24&&d.y<b[3]+24));
 // islands 2+: whole-unit coordinates in the decoration (a tenth of a unit is invisible; the module shrinks by a third)
 const terse=svg=>svg.replace(/ (d|points)="([^"]*)"/g,(m,k,v)=>` ${k}="${v.replace(/-?\d+\.\d+/g,n=>String(Math.round(+n)))}"`).replace(/ (cx|cy|x|y|x1|y1|x2|y2)="(-?\d+)\.\d+"/g,' $1="$2"');
 if(!D.seaFile)for(const d of cleared)d.svg=terse(d.svg);
 // ---- moving-sea data ----
 const fx={surfIn:GM.surf[16],surfOut:GM.surf[38],waves:GM.waveRuns,mask:[...GM.land,...SEA.reefs.flatMap(r=>r.parts),...(T.maskExtra?T.maskExtra({D,o,nodes,land:pieces}):[])],coast:GM.land,depth};
 // ---- game data ----
 const content=D.nodes?D.content||{}:null;
 const idOf=id=>firstId-1+id;
 const gateLocal=D.nodes?D.last:nodes.at(-1).id;
 const islandNodes=nodes.map(n=>({id:idOf(n.id),content:content?(content[n.id]||n.id):borrow[n.id-1],island:D.id,x:n.x,y:n.y,zone:n.zone,
  req:n.req.length?n.req.map(r=>levelReq&&levelReq.id===n.id?{id:idOf(r),level:levelReq.level}:idOf(r)):(prevGate?[prevGate]:[]),
  ...(choice&&choice.includes(n.id)?{choice:'c'+D.id}:{})}));
 if(islandNodes.some(n=>n.content===undefined))throw Error(name+': content ran out');
 const last=idOf(gateLocal);
 islands.push({id:D.id,name:D.name,last,first:firstId,label,landmarks:landmarks.map(l=>({node:idOf(l.node),kind:l.kind})),bounds:{minX:B.x0,minY:B.y0,maxX:B.x1,maxY:B.y1},color:T.color,zones:T.zones});
 allNodes.push(...islandNodes);
 pictures.push({island:D.id,bounds:[B.x0,B.y0,PW,PH],back,tri,fx,decor:cleared.map(d=>({t:d.t,svg:d.svg})),landmarks:built.map(b=>({node:idOf(b.node),kind:b.kind,svg:b.svg,over:b.over||'',beam:b.beam})),label});
 firstId=last+1;prevGate=last;
 // ---- the island's satellites: small islands and rock fragments of its own, each a small picture shown with the island ----
 const SAT=SATELLITES[D.id];
 if(SAT){
  const ST=THEMES[SAT.theme||D.theme],sfile=here(name+'.sat.geom.json'),stamp=here(name+'.sat.in.json'),sin=here(name+'.sat.geom-in.json');
  const input=JSON.stringify({land:SAT.land,nodes:[],sandBands:SAT.sandBands||[],sandPieces:SAT.sandPieces||[],beach:SAT.beach||[],
   rockZones:(SAT.rockZones||[]).map(z=>({count:0,size:[100,200],area:[[0,0],[1,0],[1,1]],...z})),rockPolys:[],sandHoles:[],terrain:SAT.terrain||[],reefs:[],duneCount:0,seeds:{rocks:31+D.id,dunes:5}});
  if(REGEOM||!fs.existsSync(sfile)||!fs.existsSync(stamp)||fs.readFileSync(stamp,'utf8')!==input){fs.writeFileSync(sin,input);execFileSync('python3',[here('geom.py').pathname,sin.pathname,sfile.pathname],{stdio:'inherit'});fs.unlinkSync(sin);fs.writeFileSync(stamp,input);}
  const SG=JSON.parse(fs.readFileSync(sfile)),cen=pts=>[pts.reduce((a,q)=>a+q[0],0)/pts.length,pts.reduce((a,q)=>a+q[1],0)/pts.length];
  const keys=Object.keys(SAT.land),centre=Object.fromEntries(keys.map(k=>[k,cen(SAT.land[k])]));
  const owner=pts=>{const c=cen(pts);return keys.reduce((b,k)=>Math.hypot(c[0]-centre[k][0],c[1]-centre[k][1])<Math.hypot(c[0]-centre[b][0],c[1]-centre[b][1])?k:b,keys[0]);};
  for(const key of keys){const mine=pts=>owner(pts)===key,frags=(SAT.fragments||[]).filter(f=>mine(f[0][0])),shards=frags.flatMap(f=>f.map(s=>s[0]));
   const G2={land:SG.land.filter(mine),rockBase:SG.rockBase.filter(mine),rocks:SG.rocks.filter(r=>mine(r.pts)),sand:SG.sand.filter(mine),wet:SG.wet.filter(mine),dunes:[],layers:SG.layers.map(l=>({c:l.c,polys:l.polys.filter(mine)})),near:SG.near.filter(mine),sunken:(SG.sunken||[]).filter(b=>mine(b.pts))};
   const all=[...G2.near,...shards].flat(),bx0=Math.floor(Math.min(...all.map(q=>q[0])))-40,by0=Math.floor(Math.min(...all.map(q=>q[1])))-40,bx1=Math.ceil(Math.max(...all.map(q=>q[0])))+40,by1=Math.ceil(Math.max(...all.map(q=>q[1])))+40;
   let sea2='';if(SEABED[D.id])shallows.push(...G2.near);else for(const q of G2.land)sea2+=poly(q,`fill="${ST.sea.near}" stroke="${ST.sea.near}" stroke-width="92" stroke-linejoin="miter" stroke-miterlimit="2"`);if(!SEABED[D.id])for(const q of G2.near)sea2+=poly(q,`fill="${ST.sea.near}"`);
   // a fragment: shards of bare rock breaking the surface, foam round them
   let fr='';for(const f of frags){for(const [q] of f)fr+=poly(q,'fill="none" stroke="#e8f0f2" stroke-opacity=".42" stroke-width="5" stroke-linejoin="miter"');for(const [q,tone] of f)fr+=poly(q,`fill="${ST.rock[tone][0]}" stroke="${ST.rock[tone][1]}" stroke-width="2" stroke-linejoin="miter"`);}
   const sback=`<svg xmlns="http://www.w3.org/2000/svg" width="${bx1-bx0}" height="${by1-by0}" viewBox="${bx0} ${by0} ${bx1-bx0} ${by1-by0}">`+sea2+fr+groundSvg(G2,ST,[SAT.land[key]])+`</svg>`;
   const sdepth=[...SG.bands.far.filter(mine).map(q=>({c:ST.sea.tones.far,pts:q})),...SG.bands.mid.filter(mine).map(q=>({c:ST.sea.tones.mid,pts:q})),...G2.land.map(q=>({c:ST.sea.tones.near,pts:q})),...G2.near.map(q=>({c:ST.sea.tones.near,pts:q}))];
   pictures.push({island:D.id,sat:key,bounds:[bx0,by0,bx1-bx0,by1-by0],back:sback,tri:[],fx:{surfIn:SG.surf['16'].filter(mine),surfOut:SG.surf['38'].filter(mine),waves:SG.waveRuns.filter(w=>mine(w.pts)),mask:[...G2.land,...shards],coast:G2.land,depth:sdepth},decor:[],landmarks:[],label:null});}
  console.log(name,'satellites',keys.join('/'),'fragments',(SAT.fragments||[]).length);
 }
 if(SEABED[D.id])shallowsOf[D.id]=shallows.map(q=>q.map(([x,y])=>[Math.round(x),Math.round(y)]));
 console.log(name,'nodes',nodes.length,'decor',cleared.length,'picture',PW+'×'+PH,'landmarks',landmarks.map(l=>l.kind).join('/'));
}
// ---- the observatory picture ----
pictures.push({island:0,bounds:[OCX-OR,OCY-OR,2*OR,2*OR],back:`<svg xmlns="http://www.w3.org/2000/svg" width="${2*OR}" height="${2*OR}" viewBox="${OCX-OR} ${OCY-OR} ${2*OR} ${2*OR}">`+OBS.svg+`</svg>`,tri:OBS.tri,fx:{surfIn:[],surfOut:[],waves:[],mask:OBS.fx.mask,coast:OBS.fx.coast,depth:OBS.fx.depth},decor:[],landmarks:[],label:null});
const WX0=Math.min(...pictures.map(p=>p.bounds[0]))-800,WY0=Math.min(...pictures.map(p=>p.bounds[1]))-800,WX1=Math.max(...pictures.map(p=>p.bounds[0]+p.bounds[2]))+800,WY1=Math.max(...pictures.map(p=>p.bounds[1]+p.bounds[3]))+800;
// ---- modules ----
const head='// Generated by scripts/islands/build-art.mjs from the island designs. Do not edit.\n';
fs.writeFileSync(dist('islands.js'),head+`export const ISLANDS=${JSON.stringify(islands)};\nexport const ISLAND_NODES=${JSON.stringify(allNodes)};\n`);
// the hand-drawn sea floor: the basin, and each island's shelf contours and reefs
const seabed={tone:TONE,basin:BASIN,islands:Object.fromEntries(Object.entries(SEABED).map(([id,f])=>[id,{...f,shallows:shallowsOf[id]||[]}]))};
fs.writeFileSync(dist('island-art.js'),head+`export const ISLAND_ART=${JSON.stringify({world:[WX0,WY0,WX1-WX0,WY1-WY0],pictures,seabed})};\n`);
fs.writeFileSync(dist('observatory-art.js'),head+`export const OBS_ART=${JSON.stringify(OBS.art)};\n`);
console.log('islands.js',(fs.statSync(dist('islands.js')).size/1024).toFixed(1)+'KB','island-art.js',(fs.statSync(dist('island-art.js')).size/1024).toFixed(0)+'KB','observatory-art.js',(fs.statSync(dist('observatory-art.js')).size/1024).toFixed(0)+'KB','world',[WX0,WY0,WX1-WX0,WY1-WY0].join(','));
