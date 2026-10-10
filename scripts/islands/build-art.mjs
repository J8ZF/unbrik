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
// A crag: one big bare rock out of the sea, every part a hand-cut shape (satellites.mjs), in the theme's own
// crag tones. From below: the rock under the water (fainter the deeper), the low rock at the waterline, broken
// slabs on it, then the rock proper and its lighter layers. No dark rim and no dark cracks: the user had them out.
const cragSvg=(c,T)=>{const R=c.stone==='rock'?T.rock:T.cragRock||T.rock,rk=(q,tone)=>poly(q,`fill="${R[tone][0]}" stroke="${R[tone][1]}" stroke-width="2.6" stroke-linejoin="miter"`);
 return (c.sunken||[]).map(([q,step])=>poly(q,`fill="${T.sunken[step][0]}" fill-opacity="${T.sunken[step][1]}"`)).join('')+rk(c.base,0)+(c.talus||[]).map(([q,tone])=>rk(q,tone)).join('')+rk(c.body,1)+c.slabs.map(([q,tone])=>rk(q,tone)).join('');};
// A stack: an islet built like the sky islands (observatory.mjs relicIsland): the rock, the game's broad translucent
// dark rim round it, lighter rock on its ledges, then the one thing that lies on it (grass or earth) with its patches.
const stackSvg=(rock,s,T)=>{const rk=(q,tone)=>poly(q,`fill="${T.rock[tone][0]}" stroke="${T.rock[tone][1]}" stroke-width="2.6" stroke-linejoin="miter"`);
 const top=s.top==='earth'?T.sand:T.land,shade=c=>s.top==='earth'?(c==='duneTop'?T.duneTop:T.dune):T.layer[c];
 return rk(rock,1)+poly(rock,'fill="none" stroke="#04080c" stroke-opacity=".5" stroke-width="44" stroke-linejoin="round"')+(s.slabs||[]).map(([q,tone])=>rk(q,tone)).join('')
  +(s.top?poly(s.topPts,`fill="${top[0]}" stroke="${top[1]}" stroke-width="3" stroke-linejoin="round"`)+(s.patches||[]).map(([q,c])=>{const k=shade(c);if(!k)throw Error('unknown patch '+c);return poly(q,`fill="${k[0]}" stroke="${k[1]}" stroke-width="3" stroke-linejoin="round"`);}).join(''):'');};
// Spires: the pointed reefs standing out of the sea round an island, a group of them to a picture. Each is its rock at
// the waterline (tone 0, traced like land so it has surf) and the layers above it, every one smaller and lighter, so how
// high a rock rises shows as how light it gets: a low reef stops at the dark tones, a tall one runs up to a light tip.
// Under them, the same rock going on beneath the water (fainter the deeper, the deepest drawn first). No dark rim.
const spireSvg=(list,T)=>{const R=T.cragRock,rk=(q,t)=>poly(q,`fill="${R[t][0]}" stroke="${R[t][1]}" stroke-width="2.6" stroke-linejoin="miter"`);
 return list.flatMap(s=>s.sunken||[]).sort((a,b)=>b[1]-a[1]).map(([q,st])=>poly(q,`fill="${T.sunken[st][0]}" fill-opacity="${T.sunken[st][1]}"`)).join('')
  +list.map(s=>rk(s.base,0)+(s.layers||[]).map(([q,t])=>rk(q,t)).join('')).join('');};
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
  for(const e of D.extraLandmarks||[])landmarks.push({...e,extra:true});
  // islands 3+: one study asks for its prerequisite at a level (the prerequisite must have levels)
  if(D.id>=3){const cand=nodes.find(n=>n.req.length&&n.id>3&&!(choice||[]).includes(n.id)&&(MAX_OF.get(borrow[n.req[0]-1])||0)>=5);if(cand)levelReq={id:cand.id,level:3};}
 }
 const nodeOf=id=>nodes.find(n=>n.id===id),root=nodes[0];
 // ---- sea ----
 let SEA;
 if(D.seaFile)SEA=JSON.parse(fs.readFileSync(here(D.seaFile)));
 else{const all=pieces.flat(),xs=all.map(p=>p[0]),ys=all.map(p=>p[1]);const bounds={x0:Math.min(...xs)-420,y0:Math.min(...ys)-360,x1:Math.max(...xs)+380,y1:Math.max(...ys)+360};
  SEA={bounds,...buildSea(pieces,bounds,{seed:D.id*7,water:T.sea,reefCount:D.reefs??14})};}
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
 // the picture's frame: the sea bounds, grown where rock goes on under the water past them (it was being cut off straight)
 const SK=(GM.sunken||[]).flatMap(b=>b.pts),FX0=Math.min(B.x0,...SK.map(q=>Math.floor(q[0])-40)),FY0=Math.min(B.y0,...SK.map(q=>Math.floor(q[1])-40)),FX1=Math.max(B.x1,...SK.map(q=>Math.ceil(q[0])+40)),FY1=Math.max(B.y1,...SK.map(q=>Math.ceil(q[1])+40)),FW=FX1-FX0,FH=FY1-FY0;
 const back=`<svg xmlns="http://www.w3.org/2000/svg" width="${FW}" height="${FH}" viewBox="${FX0} ${FY0} ${FW} ${FH}">`+sea+picture+`</svg>`;
 // ---- landmark buildings (built when their study reaches MAX) ----
 const built=landmarks.map(l=>{const n=nodeOf(l.node);if(BLD.FRAMES[l.kind])return {node:l.node,kind:l.kind,frame:BLD.FRAMES[l.kind](n),svg:'',over:'',beam:null,box:BLD.FOOTPRINT[l.kind](n)};const f=BLD.KINDS[l.kind];if(!f)throw Error('unknown landmark '+l.kind);return {node:l.node,kind:l.kind,...(BLD.FX[l.kind]?{fx:BLD.FX[l.kind](n)}:{}),svg:f(n,CW,CH,l,{coast:pieces,rock:T.rock}),over:BLD.OVER[l.kind]?BLD.OVER[l.kind](n,CW,CH):'',beam:l.kind==='lighthouse'?[n.x,n.y]:null,box:BLD.FOOTPRINT[l.kind](n,l)};});
 // decoration keeps clear of the cards and frames, then the final footprints clear what they cover
 const pairArt=D.pairArt&&choice?BLD.PAIR_ART[D.pairArt](nodeOf(choice[0]),nodeOf(choice[1])):null;
 const frames=landmarks.map(l=>{const n=nodeOf(l.node);if(BLD.TINT[l.kind])return BLD.FOOTPRINT[l.kind](n);if(l.oct)return [n.x-l.oct,n.y-l.oct,n.x+l.oct,n.y+l.oct];const [px,py]=l.pad||[90,70];let b=[n.x-CW/2-px,n.y-CH/2-py,n.x+CW/2+px,n.y+CH/2+py];
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
 if(pairArt)frames.push(pairArt.box);
 const boxes=[...built.map(b=>b.box),...(pairArt?[pairArt.box]:[])];
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
 const tintOf=new Map(landmarks.filter(l=>BLD.TINT[l.kind]).map(l=>[l.node,BLD.TINT[l.kind]]));if(pairArt){tintOf.set(choice[0],BLD.PAIR_TINT.a);tintOf.set(choice[1],BLD.PAIR_TINT.b);}
 const islandNodes=nodes.map(n=>({id:idOf(n.id),content:content?(content[n.id]||n.id):borrow[n.id-1],island:D.id,x:n.x,y:n.y,zone:n.zone,
  req:n.req.length?n.req.map(r=>levelReq&&levelReq.id===n.id?{id:idOf(r),level:levelReq.level}:idOf(r)):(prevGate?[prevGate]:[]),
  ...(choice&&choice.includes(n.id)?{choice:'c'+D.id}:{}),...(tintOf.has(n.id)?{tint:tintOf.get(n.id)}:{})}));
 if(islandNodes.some(n=>n.content===undefined))throw Error(name+': content ran out');
 const last=idOf(gateLocal);
 islands.push({id:D.id,name:D.name,last,first:firstId,label,landmarks:landmarks.map(l=>({node:idOf(l.node),kind:l.kind,...(l.extra?{extra:true}:{})})),...(pairArt?{pairs:[{a:idOf(choice[0]),b:idOf(choice[1]),hub:pairArt.hub}]}:{}),bounds:{minX:B.x0,minY:B.y0,maxX:B.x1,maxY:B.y1},color:T.color,zones:T.zones});
 allNodes.push(...islandNodes);
 pictures.push({island:D.id,bounds:[FX0,FY0,FW,FH],back,tri,fx,decor:cleared.map(d=>({t:d.t,svg:d.svg})),landmarks:built.map(b=>({node:idOf(b.node),kind:b.kind,svg:b.svg,over:b.over||'',beam:b.beam,...(b.frame?{frame:b.frame}:{}),...(b.fx?{fx:b.fx}:{})})),pairs:pairArt?[{a:idOf(choice[0]),b:idOf(choice[1]),states:pairArt.states}]:[],label});
 firstId=last+1;prevGate=last;
 // ---- the island's satellites: small islands and rock fragments of its own, each a small picture shown with the island ----
 const SAT=SATELLITES[D.id];
 if(SAT){
  const ST=THEMES[SAT.theme||D.theme],sfile=here(name+'.sat.geom.json'),stamp=here(name+'.sat.in.json'),sin=here(name+'.sat.geom-in.json');
  // a crag's waterline is traced like a piece of land (surf, shallows); its rock is drawn from its own slabs
  // so is each spire's; the spires of a group share one picture
  const CRAGS=SAT.crags||{},SPIRES=SAT.spires||{},spireLand=Object.entries(SPIRES).flatMap(([k,list])=>list.map((s,i)=>[k+'~'+i,s.base]));
  const satLand={...SAT.land,...Object.fromEntries(Object.entries(CRAGS).map(([k,c])=>[k,c.base])),...Object.fromEntries(spireLand)};
  const input=JSON.stringify({land:satLand,nodes:[],sandBands:SAT.sandBands||[],sandPieces:SAT.sandPieces||[],beach:SAT.beach||[],
   rockZones:(SAT.rockZones||[]).map(z=>({count:0,size:[100,200],area:[[0,0],[1,0],[1,1]],...z})),rockPolys:[],sandHoles:[],terrain:SAT.terrain||[],reefs:[],duneCount:0,seeds:{rocks:31+D.id,dunes:5}});
  if(REGEOM||!fs.existsSync(sfile)||!fs.existsSync(stamp)||fs.readFileSync(stamp,'utf8')!==input){fs.writeFileSync(sin,input);execFileSync('python3',[here('geom.py').pathname,sin.pathname,sfile.pathname],{stdio:'inherit'});fs.unlinkSync(sin);fs.writeFileSync(stamp,input);}
  const SG=JSON.parse(fs.readFileSync(sfile)),cen=pts=>[pts.reduce((a,q)=>a+q[0],0)/pts.length,pts.reduce((a,q)=>a+q[1],0)/pts.length];
  const keys=Object.keys(satLand),centre=Object.fromEntries(keys.map(k=>[k,cen(satLand[k])]));
  const owner=pts=>{const c=cen(pts);return keys.reduce((b,k)=>Math.hypot(c[0]-centre[k][0],c[1]-centre[k][1])<Math.hypot(c[0]-centre[b][0],c[1]-centre[b][1])?k:b,keys[0]);};
  const groups=[...Object.keys(SAT.land||{}),...Object.keys(CRAGS)].map(k=>[k,[k]]).concat(Object.entries(SPIRES).map(([k,list])=>[k,list.map((_,i)=>k+'~'+i)]));
  for(const [key,members] of groups){const mine=pts=>members.includes(owner(pts)),frags=[...(SAT.fragments||[]),...(SAT.cragRocks||[])].filter(f=>mine(f[0][0])),shards=frags.flatMap(f=>f.map(s=>s[0]));
   const G2={land:SG.land.filter(mine),rockBase:SG.rockBase.filter(mine),rocks:SG.rocks.filter(r=>mine(r.pts)),sand:SG.sand.filter(mine),wet:SG.wet.filter(mine),dunes:[],layers:SG.layers.map(l=>({c:l.c,polys:l.polys.filter(mine)})),near:SG.near.filter(mine),sunken:(SG.sunken||[]).filter(b=>mine(b.pts))};
   const STACK=SAT.stacks?.[key];
   const all=[...G2.land,...G2.near,...shards,...(CRAGS[key]?.sunken||[]).map(s=>s[0]),...(SPIRES[key]||[]).flatMap(s=>(s.sunken||[]).map(q=>q[0]))].flat(),bx0=Math.floor(Math.min(...all.map(q=>q[0])))-40,by0=Math.floor(Math.min(...all.map(q=>q[1])))-40,bx1=Math.ceil(Math.max(...all.map(q=>q[0])))+40,by1=Math.ceil(Math.max(...all.map(q=>q[1])))+40;
   let sea2='';if(SEABED[D.id])shallows.push(...G2.near);else for(const q of G2.land)sea2+=poly(q,`fill="${ST.sea.near}" stroke="${ST.sea.near}" stroke-width="92" stroke-linejoin="miter" stroke-miterlimit="2"`);if(!SEABED[D.id])for(const q of G2.near)sea2+=poly(q,`fill="${ST.sea.near}"`);
   // a fragment: shards of bare rock breaking the surface, foam round them
   const FR=CRAGS[key]||SPIRES[key]?ST.cragRock||ST.rock:ST.rock;let fr='';for(const f of frags){for(const [q] of f)fr+=poly(q,'fill="none" stroke="#e8f0f2" stroke-opacity=".42" stroke-width="5" stroke-linejoin="miter"');for(const [q,tone] of f)fr+=poly(q,`fill="${FR[tone][0]}" stroke="${FR[tone][1]}" stroke-width="2" stroke-linejoin="miter"`);}
   const sback=`<svg xmlns="http://www.w3.org/2000/svg" width="${bx1-bx0}" height="${by1-by0}" viewBox="${bx0} ${by0} ${bx1-bx0} ${by1-by0}">`+sea2+fr+(SPIRES[key]?spireSvg(SPIRES[key],ST):CRAGS[key]?cragSvg(CRAGS[key],ST):STACK?stackSvg(SAT.land[key],STACK,ST):groundSvg(G2,ST,[SAT.land[key]]))+`</svg>`;
   const sdepth=[...SG.bands.far.filter(mine).map(q=>({c:ST.sea.tones.far,pts:q})),...SG.bands.mid.filter(mine).map(q=>({c:ST.sea.tones.mid,pts:q})),...G2.land.map(q=>({c:ST.sea.tones.near,pts:q})),...G2.near.map(q=>({c:ST.sea.tones.near,pts:q}))];
   // where the picture has anything on it (each shape's box, grown for its strokes, overlapping boxes merged): the view
   // makes tiles only there, so a group of reefs spread over open water is not a sheet of empty tiles
   let parts=null;if(!sea2&&!/<(path|circle|rect|ellipse|line|image|g)[ >]/.test(sback)){parts=[...sback.matchAll(/points="([^"]+)"/g)].map(m=>{const b=[1e9,1e9,-1e9,-1e9];for(const q of m[1].split(' ')){const [x,y]=q.split(',').map(Number);b[0]=Math.min(b[0],x);b[1]=Math.min(b[1],y);b[2]=Math.max(b[2],x);b[3]=Math.max(b[3],y);}return [b[0]-24,b[1]-24,b[2]+24,b[3]+24];});
    for(let merged=true;merged;){merged=false;for(let a=0;a<parts.length&&!merged;a++)for(let c=a+1;c<parts.length;c++){const A=parts[a],C=parts[c];if(A[0]<=C[2]&&C[0]<=A[2]&&A[1]<=C[3]&&C[1]<=A[3]){parts[a]=[Math.min(A[0],C[0]),Math.min(A[1],C[1]),Math.max(A[2],C[2]),Math.max(A[3],C[3])];parts.splice(c,1);merged=true;break;}}}
    parts=parts.map(b=>b.map(Math.round));}
   pictures.push({island:D.id,sat:key,bounds:[bx0,by0,bx1-bx0,by1-by0],...(parts?{parts}:{}),back:sback,tri:[],fx:{surfIn:SG.surf['16'].filter(mine),surfOut:SG.surf['38'].filter(mine),waves:SG.waveRuns.filter(w=>mine(w.pts)),mask:[...G2.land,...shards],coast:G2.land,depth:sdepth},decor:[],landmarks:[],label:null});}
  // an island ringed by a reef zone (frameReefs) takes the zone into its frame: the camera fits it and the zoomed-out title
  // stands clear of it
  if(D.frameReefs){const bb=islands.at(-1).bounds;for(const p of pictures.filter(q=>q.island===D.id&&q.sat)){const [x,y,w,h]=p.bounds;bb.minX=Math.min(bb.minX,x);bb.minY=Math.min(bb.minY,y);bb.maxX=Math.max(bb.maxX,x+w);bb.maxY=Math.max(bb.maxY,y+h);}}
  console.log(name,'satellites',groups.map(g=>g[0]).join('/'),'fragments',(SAT.fragments||[]).length+(SAT.cragRocks||[]).length,'crags',Object.keys(CRAGS).join('/')||'-','spires',Object.entries(SPIRES).map(([k,l])=>k+':'+l.length).join(' ')||'-');
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
