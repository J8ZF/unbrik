// AXIOM island map: the painted islands behind the studies.
//
// Every island is one picture (so is the observatory); a picture is shown only
// once its island is open (the island before it finished), and a newly opened
// island fades in. Layers, back to front:
//  back   (world space, same transform as #world) — per picture: its drifting
//         sea triangles, a coarse copy of the whole picture, and sharp 512 px
//         tiles drawn for the visible area once the view settles. Zooming and
//         panning only move textures; nothing is redrawn.
//  canvas (screen space) — the moving sea: the grid sweep, surf lines along the
//         shores and waves on the beaches of the open islands. It is drawn in
//         the same call that moves the camera, so the shore never lags behind.
//  #world — growth layers around the HTML studies: decoration and grass, the
//         lighthouse beam, landmark buildings, moss over bought cards.
//  The observatory's moving parts: the machinery under its painted city goes
//  on one more screen-space canvas below the painted layer (sized 1×1 while
//  the observatory is off screen); what floats above the sea round it is
//  drawn on the sea canvas after the sea (see observatory-view.js).
import {ISLAND_ART as ART} from './island-art.js?v=4.0.0-dev.1';
import {createObservatory} from './observatory-view.js?v=4.0.0-dev.1';

const NS='http://www.w3.org/2000/svg';
const f1=v=>(Math.round(v*10)/10).toString();
function rng(seed){return()=>{seed|=0;seed=seed+0x6D2B79F5|0;let t=Math.imul(seed^seed>>>15,1|seed);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296;};}
function smoothPath(pts){const n=pts.length;let d=`M${f1(pts[0][0])} ${f1(pts[0][1])}`;for(let i=0;i<n;i++){const p0=pts[(i-1+n)%n],p1=pts[i],p2=pts[(i+1)%n],p3=pts[(i+2)%n];d+=`C${f1(p1[0]+(p2[0]-p0[0])/6)} ${f1(p1[1]+(p2[1]-p0[1])/6)} ${f1(p2[0]-(p3[0]-p1[0])/6)} ${f1(p2[1]-(p3[1]-p1[1])/6)} ${f1(p2[0])} ${f1(p2[1])}`;}return d+'Z';}
function blobPath(r,cx,cy,rad,k=7,jit=.16){const a0=r()*6.283,pts=[];for(let i=0;i<k;i++){const a=a0+i/k*6.283+(r()-.5)*.35,rr=rad*(1-jit+r()*jit*2);pts.push([cx+Math.cos(a)*rr,cy+Math.sin(a)*rr]);}return smoothPath(pts);}
function leafFan(r,x,y,len,count,cols){let s='';const a0=r()*6.283;for(let i=0;i<count;i++){const a=a0+i/count*6.283+(r()-.5)*.5,L=len*(.72+r()*.32),w=L*.17,dx=Math.cos(a),dy=Math.sin(a),px=-dy,py=dx;
 s+=`<path d="M${f1(x)} ${f1(y)}Q${f1(x+dx*L*.45+px*w*1.6)} ${f1(y+dy*L*.45+py*w*1.6)} ${f1(x+dx*L)} ${f1(y+dy*L)}Q${f1(x+dx*L*.45-px*w*1.6)} ${f1(y+dy*L*.45-py*w*1.6)} ${f1(x)} ${f1(y)}Z" fill="${cols[i%cols.length]}"/>`;}return s;}
const CW=146,CH=118;
const BEHIND={grass:['#5d9653','#4b8046'],sand:['#b8bf73','#9fae5e'],rock:['#6e9f50','#5b8a45']};
function grassBehind(n){const r=rng(n.id*97);let s='';const spots=[[-1,-1],[1,-1],[1,1],[-1,1]];for(let i=0;i<2;i++){const sp=spots[Math.floor(r()*4)];s+=leafFan(r,n.x+sp[0]*(CW/2-10),n.y+sp[1]*(CH/2-12),38+r()*22,6,BEHIND[n.zone]);}return s;}
function moss(n){if(n.zone==='sand')return '';const r=rng(n.id*13);let s='';const cx=n.x+CW/2-10,cy=n.y+CH/2-10;
 for(let i=0;i<5;i++)s+=`<path d="${blobPath(r,cx+(r()-.5)*34-r()*10,cy+(r()-.5)*24-r()*8,6+r()*8)}" fill="${['#6f9d4c','#5a8a40','#83b05c'][i%3]}"/>`;
 for(let i=0;i<4;i++)s+=`<circle cx="${f1(cx+(r()-.5)*36)}" cy="${f1(cy+(r()-.5)*26)}" r="${f1(1.5+r()*2)}" fill="#b6d886"/>`;return s;}
const REVEAL_MS=2600;

export function createIslandView({viewport,back,canvas,world,decorSvg,beamSvg,buildSvg,mossSvg,overSvg=null,nodes,level,seen=()=>true,islandsDone=()=>[],islandOpen=()=>true}){
 const obs=createObservatory(),obsUnder=document.createElement('canvas');
 obsUnder.className='obs-canvas';obsUnder.setAttribute('aria-hidden','true');viewport.insertBefore(obsUnder,back);
 const ctxU=obsUnder.getContext('2d');let underLive=false,obsMotion=true;
 function sizeUnder(on){if(on===underLive)return;underLive=on;obsUnder.width=on?canvas.width:1;obsUnder.height=on?canvas.height:1;}
 const [WX0,WY0,WW,WH]=ART.world;
 let cam={x:0,y:0,scale:1},motion=true,visible=true,W=0,H=0,dpr=1,revealing=null;
 // ---- world-space sheets ----
 // sizes go in style: the game's base CSS gives every svg 24×24 px
 const sheet=el=>{el.setAttribute('viewBox',`${WX0} ${WY0} ${WW} ${WH}`);Object.assign(el.style,{left:WX0+'px',top:WY0+'px',width:WW+'px',height:WH+'px'});};
 for(const el of [decorSvg,buildSvg,mossSvg,overSvg])if(el)sheet(el);
 // moving parts of buildings (the fountain's rings) live in small HTML elements just above the buildings: animated
 // inside the world-sized SVG sheet they would repaint the whole sheet every frame
 const fxEl=document.createElement('div');fxEl.className='fx-layer';fxEl.setAttribute('aria-hidden','true');
 try{buildSvg.parentNode.insertBefore(fxEl,buildSvg.nextSibling);}catch(e){world.append?.(fxEl);}
 const bbox=pts=>{let a=1e9,b=1e9,c=-1e9,d=-1e9;for(const [x,y] of pts){if(x<a)a=x;if(y<b)b=y;if(x>c)c=x;if(y>d)d=y;}return [a,b,c,d];};
 const mkPath=(pts,close)=>{const p=new Path2D();p.moveTo(pts[0][0],pts[0][1]);for(let i=1;i<pts.length;i++)p.lineTo(pts[i][0],pts[i][1]);if(close)p.closePath();return p;};
 // ---- pictures: one element per island holding its triangles, coarse copy and tiles ----
 const T=512,LEVELS=[.5,1,2,4,8],MAX_TILES=48;
 const pics=ART.pictures.map(p=>{const [x0,y0,w,h]=p.bounds,el=document.createElement('div');el.className='island-pic';Object.assign(el.style,{left:x0+'px',top:y0+'px',width:w+'px',height:h+'px'});
  el.innerHTML=p.tri.map(t=>`<svg class="tri" style="left:${t.x0-x0}px;top:${t.y0-y0}px;width:${t.w}px;height:${t.h}px;${t.style}" viewBox="${t.x0} ${t.y0} ${t.w} ${t.h}">${t.body}</svg>`).join('');
  const coarse=document.createElement('canvas'),tilesEl=document.createElement('div');coarse.className='island-coarse';tilesEl.className='island-tiles';el.append(coarse,tilesEl);
  const fx=p.fx;
  return {island:p.island,sat:p.sat||null,art:p,x0,y0,w,h,el,coarse,tilesEl,img:null,ready:false,shown:false,alpha:0,fading:0,tiles:new Map(),
   surfOut:fx.surfOut.map(q=>({p:mkPath(q,true),b:bbox(q)})),surfIn:fx.surfIn.map(q=>({p:mkPath(q,true),b:bbox(q)})),
   waves:fx.waves.map(q=>({i:q.i,p:mkPath(q.pts,false),b:bbox(q.pts)})),mask:fx.mask.map(q=>({p:mkPath(q,true),b:bbox(q)})),coast:fx.coast,depth:fx.depth,
   landmarks:p.landmarks,pairs:p.pairs||[],decor:p.decor};});
 back.append(...pics.map(p=>p.el));
 const open=p=>p.island===0||(revealing&&revealing.island===p.island)||islandOpen(p.island);
 // the picture bitmap loads when the island first opens; the coarse copy is drawn then
 function load(p){if(p.img)return;const img=new Image();img.decoding='async';p.img=img;
  img.onload=()=>{p.ready=true;const q=Math.min(.25,1000/Math.max(p.w,p.h));p.coarse.width=Math.round(p.w*q);p.coarse.height=Math.round(p.h*q);Object.assign(p.coarse.style,{left:'0px',top:'0px',width:p.w+'px',height:p.h+'px'});p.coarse.getContext('2d').drawImage(img,0,0,p.coarse.width,p.coarse.height);scheduleTiles();};
  img.onerror=()=>{const holder=document.createElement('div');holder.innerHTML=p.art.back;const svg=holder.firstElementChild;svg.setAttribute('class','island-sheet');Object.assign(svg.style,{left:'0px',top:'0px',width:p.w+'px',height:p.h+'px'});p.tilesEl.append(svg);};
  img.src='data:image/svg+xml;charset=utf-8,'+encodeURIComponent(p.art.back);}
 const lh=ART.pictures.flatMap(p=>p.landmarks).find(l=>l.beam);
 if(lh){const [cx,cy]=lh.beam,L=760;Object.assign(beamSvg.style,{left:(cx-L)+'px',top:(cy-L)+'px',width:2*L+'px',height:2*L+'px'});beamSvg.setAttribute('viewBox',`${cx-L} ${cy-L} ${2*L} ${2*L}`);
  beamSvg.innerHTML=[[.13,.13],[.07,.12]].map(([a,o])=>`<polygon points="${cx},${cy} ${cx+L},${cy-L*a} ${cx+L},${cy+L*a}" fill="#fff3b0" fill-opacity="${o}"/>`).join('');}

 // ---- sharp tiles for the visible part of the shown pictures ----
 let queue=[],pumping=false,moving=false,settleTimer=0,tileCount=0;
 const viewRect=(m=0)=>{const w=W/cam.scale,h=H/cam.scale,x=-cam.x/cam.scale,y=-cam.y/cam.scale;return [x-w*m,y-h*m,x+w*(1+m),y+h*(1+m)];};
 function neededLevel(){const need=cam.scale*dpr;if(need<=.3)return 0;for(const L of LEVELS)if(L>=need*.9)return L;return LEVELS.at(-1);}
 function scheduleTiles(){if(!visible)return;const L=neededLevel();queue=[];const now=performance.now();if(!L)return;const span=T/L,v=viewRect(.2),cx=(v[0]+v[2])/2,cy=(v[1]+v[3])/2;
  for(const p of pics){if(!p.ready||!p.shown)continue;if(p.x0>v[2]||p.x0+p.w<v[0]||p.y0>v[3]||p.y0+p.h<v[1])continue;
   const i0=Math.max(0,Math.floor((v[0]-p.x0)/span)),i1=Math.min(Math.ceil(p.w/span)-1,Math.floor((v[2]-p.x0)/span)),j0=Math.max(0,Math.floor((v[1]-p.y0)/span)),j1=Math.min(Math.ceil(p.h/span)-1,Math.floor((v[3]-p.y0)/span));
   for(let i=i0;i<=i1;i++)for(let j=j0;j<=j1;j++){const k=L+':'+i+':'+j,t=p.tiles.get(k);if(t){t.used=now;continue;}queue.push({p,L,i,j,k,d:Math.hypot(p.x0+(i+.5)*span-cx,p.y0+(j+.5)*span-cy)});}}
  queue.sort((a,b)=>a.d-b.d);pump();}
 function pump(){if(pumping||!queue.length)return;pumping=true;requestAnimationFrame(function step(){const t0=performance.now();
  while(queue.length&&performance.now()-t0<10&&!moving)renderTile(queue.shift());
  if(queue.length)requestAnimationFrame(step);else{pumping=false;evict();}});}
 function renderTile({p,L,i,j,k}){const span=T/L,b=1/L,wx=i*span-b,wy=j*span-b,cv=document.createElement('canvas');cv.width=cv.height=T+2;
  cv.getContext('2d').drawImage(p.img,wx,wy,span+2*b,span+2*b,0,0,T+2,T+2);
  Object.assign(cv.style,{left:wx+'px',top:wy+'px',width:(span+2*b)+'px',height:(span+2*b)+'px',zIndex:String(LEVELS.indexOf(L)+1)});
  p.tilesEl.append(cv);p.tiles.set(k,{cv,used:performance.now()});tileCount++;}
 function evict(){if(tileCount<=MAX_TILES)return;const list=[];for(const p of pics)for(const [k,t] of p.tiles)list.push([p,k,t]);list.sort((a,b)=>a[2].used-b[2].used);for(const [p,k,t] of list.slice(0,tileCount-MAX_TILES)){t.cv.remove();p.tiles.delete(k);tileCount--;}}
 function dropTiles(p){for(const [,t] of p.tiles)t.cv.remove();tileCount-=p.tiles.size;p.tiles.clear();}

 // ---- moving sea ----
 const ctx=canvas.getContext('2d');
 const hit=(b,v)=>b[2]>=v[0]&&b[0]<=v[2]&&b[3]>=v[1]&&b[1]<=v[3];
 // ---- sea floor ----
 // Under everything painted: the basin inside the ring of islands (a faint dark
 // blue, the map's edge stays black), and for every open island the shelf it
 // stands on as hand-drawn depth contours, with reefs lying on it. Still, so it
 // is drawn only when the camera or the open islands change.
 const bed=document.createElement('canvas');bed.className='obs-canvas';bed.setAttribute('aria-hidden','true');viewport.insertBefore(bed,obsUnder);
 const bctx=bed.getContext('2d'),SB=ART.seabed,BT=SB.tone;let bedDirty=true;
 const basin=SB.basin.map((pts,i)=>({p:mkPath(pts,true),a:BT.basin[1][i]-(i?BT.basin[1][i-1]:0)}));
 const floors=Object.entries(SB.islands).map(([id,f])=>({island:+id,b:bbox(f.shelf.flat()),shelf:f.shelf.map(pts=>mkPath(pts,true)),shallow:(()=>{const p=new Path2D();for(const q of f.shallows)p.addPath(mkPath(q,true));return p;})(),lagoon:(()=>{const p=new Path2D();for(const q of f.lagoon||[])p.addPath(mkPath(q,true));return p;})(),water:f.shallow,
  reefs:[3,2,1].map(k=>{const p=new Path2D();for(const r of f.reefs)if(r.t===k)p.addPath(mkPath(r.pts,true));return {p,a:BT.reef[1][k]};})}));
 function drawBed(v){bedDirty=false;bctx.setTransform(1,0,0,1,0,0);bctx.clearRect(0,0,bed.width,bed.height);if(!visible)return;
  const s=cam.scale*dpr;bctx.setTransform(s,0,0,s,cam.x*dpr,cam.y*dpr);
  bctx.fillStyle=BT.basin[0];for(const b of basin){bctx.globalAlpha=b.a;bctx.fill(b.p);}
  for(const f of floors){const pic=pics.find(q=>q.island===f.island&&!q.sat);if(!pic||!pic.shown||!hit(f.b,v))continue;
   bctx.fillStyle=BT.shelf[0];bctx.globalAlpha=BT.shelf[1]*pic.alpha;for(const p of f.shelf)bctx.fill(p);
   bctx.fillStyle=BT.reef[0];for(const r of f.reefs){bctx.globalAlpha=r.a*pic.alpha;bctx.fill(r.p);}
   bctx.fillStyle=f.water[0];if(f.lagoon){bctx.globalAlpha=f.water[1]*.8*pic.alpha;bctx.fill(f.lagoon);}bctx.globalAlpha=f.water[1]*pic.alpha;bctx.fill(f.shallow);}
  bctx.globalAlpha=1;}
 const ease=u=>u*u*(3-2*u);
 const waveAlpha=(t,i)=>{const u=(((t/1000-i*1.1)%6.6)+6.6)%6.6/6.6;if(u<.22)return .62*ease(u/.22);if(u<.55)return .62+(.1-.62)*ease((u-.22)/.33);return .1*(1-ease((u-.55)/.45));};
 // ---- sea grid ----
 // Small crosses cover the whole view at any zoom. They sit on a world lattice
 // (so they move with the map) whose step doubles or halves with the zoom: the
 // screen gap stays between GRID_MIN and twice that, and the next finer set
 // fades in as you zoom. Their tone follows the depth bands round the islands
 // (one small canvas per picture); waves of light run out from the coasts.
 const GRID_MIN=48,ARM=3.5,LW=1.3,DEEP='#2a3844',DQ=1/20;
 for(const p of pics){const d=document.createElement('canvas');d.width=Math.ceil(p.w*DQ)+2;d.height=Math.ceil(p.h*DQ)+2;const g=d.getContext('2d');g.setTransform(DQ,0,0,DQ,-p.x0*DQ+1,-p.y0*DQ+1);if('filter' in g)g.filter='blur(1.5px)';for(const b of p.depth){g.fillStyle=b.c;g.fill(mkPath(b.pts,true));}p.depthCv=d;}
 const tiles2=new Map();
 function crossPattern(P,arm,lw){const key=P+':'+arm+':'+lw;let pat=tiles2.get(key);if(!pat){const c=document.createElement('canvas');c.width=c.height=P;const g=c.getContext('2d');g.fillStyle='#fff';
  g.fillRect(P/2-arm,P/2-lw/2,arm*2,lw);g.fillRect(P/2-lw/2,P/2-arm,lw,arm*2);pat=ctx.createPattern(c,'repeat');if(tiles2.size>80)tiles2.clear();tiles2.set(key,pat);}return pat;}
 // ---- waves: distance to the open coasts on a coarse grid, soft bands moving outward ----
 const WQ=24,DW=Math.ceil(WW/WQ),DH=Math.ceil(WH/WQ),coastDist=new Float32Array(DW*DH),waveCv=document.createElement('canvas');waveCv.width=DW;waveCv.height=DH;
 const waveCtx=waveCv.getContext('2d'),waveImg=waveCtx.createImageData(DW,DH);let coastKey='';
 function buildCoast(){const key=pics.filter(p=>p.shown&&!p.fading).map(p=>p.island).join(',');if(key===coastKey)return;coastKey=key;
  const d=waveCtx;d.setTransform(1,0,0,1,0,0);d.clearRect(0,0,DW,DH);d.setTransform(1/WQ,0,0,1/WQ,-WX0/WQ,-WY0/WQ);d.fillStyle='#000';for(const p of pics)if(p.shown&&!p.fading)for(const c of p.coast)d.fill(mkPath(c,true));d.setTransform(1,0,0,1,0,0);
  const px=d.getImageData(0,0,DW,DH).data,D=coastDist,R2=Math.SQRT2;for(let i=0;i<DW*DH;i++)D[i]=px[i*4+3]>127?0:1e9;
  for(let y=0;y<DH;y++)for(let x=0;x<DW;x++){const i=y*DW+x;let v=D[i];if(!v)continue;if(x>0)v=Math.min(v,D[i-1]+1);if(y>0){v=Math.min(v,D[i-DW]+1);if(x>0)v=Math.min(v,D[i-DW-1]+R2);if(x<DW-1)v=Math.min(v,D[i-DW+1]+R2);}D[i]=v;}
  for(let y=DH-1;y>=0;y--)for(let x=DW-1;x>=0;x--){const i=y*DW+x;let v=D[i];if(!v)continue;if(x<DW-1)v=Math.min(v,D[i+1]+1);if(y<DH-1){v=Math.min(v,D[i+DW]+1);if(x<DW-1)v=Math.min(v,D[i+DW+1]+R2);if(x>0)v=Math.min(v,D[i+DW-1]+R2);}D[i]=v;}
  for(let i=0;i<DW*DH;i++){waveImg.data[i*4]=169;waveImg.data[i*4+1]=191;waveImg.data[i*4+2]=207;waveImg.data[i*4+3]=0;}}
 const WAVE_P=7.5,WAVE_V=55,WAVE_D=620,WAVE_W=95,LUT=new Float32Array(Math.ceil((WAVE_D+WAVE_W)/WQ*4)+2);
 function waves(t){const ph=(t/1000)%WAVE_P;for(let j=0;j<LUT.length;j++){const d=j/4*WQ;let b=0;for(let k=0;;k++){const p=(ph+k*WAVE_P)*WAVE_V;if(p>WAVE_D+WAVE_W*2)break;const u=(d-p)/WAVE_W;b+=Math.exp(-u*u);}
   const f=d<WAVE_D?(1-d/WAVE_D)**1.6:0,inn=Math.min(1,d/50);LUT[j]=Math.min(1,b)*f*inn*inn*(3-2*inn);}
  const a=waveImg.data,n=LUT.length;for(let i=0;i<DW*DH;i++){const j=Math.round(coastDist[i]*4);a[i*4+3]=j<n?LUT[j]*255:0;}waveCtx.putImageData(waveImg,0,0);}
 function drawGrid(t,v){
  const s=cam.scale*dpr,G=40*2**Math.ceil(Math.log2(GRID_MIN/cam.scale/40)),fade=Math.min(1,Math.max(0,G*cam.scale/GRID_MIN-1)),arm=Math.round(ARM*dpr*2)/2,lw=Math.round(LW*dpr*2)/2;
  ctx.setTransform(1,0,0,1,0,0);
  for(const [g,a] of [[G,1],[G/2,fade]]){if(a<.02)continue;const step=g*s,P=Math.max(8,Math.round(step)),pat=crossPattern(P,Math.min(arm,P/2-1),lw);
   pat.setTransform(new DOMMatrix([step/P,0,0,step/P,cam.x*dpr+(20-g/2)*s,cam.y*dpr+(20-g/2)*s]));ctx.globalAlpha=a;ctx.fillStyle=pat;ctx.fillRect(0,0,canvas.width,canvas.height);}
  ctx.globalAlpha=1;ctx.globalCompositeOperation='source-atop';ctx.fillStyle=DEEP;ctx.fillRect(0,0,canvas.width,canvas.height);
  ctx.setTransform(s,0,0,s,cam.x*dpr,cam.y*dpr);
  for(const p of pics){if(!p.shown||p.x0>v[2]||p.x0+p.w<v[0]||p.y0>v[3]||p.y0+p.h<v[1])continue;ctx.globalAlpha=p.alpha;ctx.drawImage(p.depthCv,p.x0-1/DQ,p.y0-1/DQ,p.depthCv.width/DQ,p.depthCv.height/DQ);}
  ctx.globalAlpha=1;
  if(motion){waves(t);ctx.globalAlpha=.6;ctx.drawImage(waveCv,WX0,WY0,DW*WQ,DH*WQ);
   // the band also lifts the water a little, so it reads between sparse crosses
   ctx.globalCompositeOperation='destination-over';ctx.globalAlpha=.045;ctx.drawImage(waveCv,WX0,WY0,DW*WQ,DH*WQ);ctx.globalAlpha=1;}
  ctx.globalCompositeOperation='destination-out';ctx.fillStyle=ctx.strokeStyle='#000';ctx.lineWidth=6;
  for(const p of pics){if(!p.shown)continue;ctx.globalAlpha=p.alpha;for(const m of p.mask)if(hit(m.b,v)){ctx.fill(m.p);ctx.stroke(m.p);}}
  ctx.globalAlpha=1;ctx.globalCompositeOperation='source-over';}
 function size(){const r=viewport.getBoundingClientRect();dpr=Math.min(2,window.devicePixelRatio||1);W=r.width;H=r.height;canvas.width=Math.round(W*dpr);canvas.height=Math.round(H*dpr);bed.width=canvas.width;bed.height=canvas.height;bedDirty=true;underLive=false;sizeUnder(false);}
 function draw(t){ctx.setTransform(1,0,0,1,0,0);ctx.clearRect(0,0,canvas.width,canvas.height);if(!visible){sizeUnder(false);if(bedDirty)drawBed();return;}
  const fading=!!revealing;stepReveal(t);
  const s=cam.scale*dpr;const v=viewRect(),near=obs.inView(v);
  if(bedDirty||fading)drawBed(v);
  obs.tick(t,obsMotion);sizeUnder(near);
  if(near){ctxU.setTransform(1,0,0,1,0,0);ctxU.clearRect(0,0,obsUnder.width,obsUnder.height);ctxU.setTransform(s,0,0,s,cam.x*dpr,cam.y*dpr);obs.drawUnder(ctxU,v,cam.scale);}
  ctx.setTransform(s,0,0,s,cam.x*dpr,cam.y*dpr);drawGrid(t,v);ctx.setTransform(s,0,0,s,cam.x*dpr,cam.y*dpr);
  ctx.strokeStyle='#eef4f5';ctx.lineJoin='round';ctx.lineCap='butt';
  const ph=(t/5000)%2,br=.12+.34*ease(ph<1?ph:2-ph);
  for(const p of pics){if(!p.shown||p.x0>v[2]||p.x0+p.w<v[0]||p.y0>v[3]||p.y0+p.h<v[1])continue;const a=p.alpha;
   ctx.lineWidth=3;ctx.setLineDash([90,70,40,60,150,78]);ctx.lineDashOffset=motion?488*((t/28000)%1):0;ctx.globalAlpha=(motion?br:.3)*a;for(const o of p.surfOut)if(hit(o.b,v))ctx.stroke(o.p);
   ctx.lineWidth=3.6;ctx.setLineDash([170,46,70,38,240,60,110,52]);ctx.lineDashOffset=motion?-786*((t/40000)%1):0;ctx.globalAlpha=.62*a;for(const o of p.surfIn)if(hit(o.b,v))ctx.stroke(o.p);
   ctx.setLineDash([]);ctx.lineCap='round';
   for(const w of p.waves)if(hit(w.b,v)){ctx.globalAlpha=(motion?waveAlpha(t,w.i):.28)*a;ctx.lineWidth=3.4-w.i*.3;ctx.stroke(w.p);}
   ctx.lineCap='butt';}
  ctx.globalAlpha=1;if(near)obs.drawOver(ctx,v,cam.scale,dpr);}
 let queued=false,last=0;
 function loop(t){queued=false;if(!(motion||obsMotion||revealing)||!visible)return;if(t-last>=32){last=t;draw(t);}queue2();}
 function queue2(){if(!queued&&(motion||obsMotion||revealing)&&visible){queued=true;requestAnimationFrame(loop);}}

 // ---- open islands and the reveal of a new one ----
 function syncOpen(){let changed=false;for(const p of pics){const on=open(p);if(on&&!p.shown){p.shown=true;p.alpha=revealing&&revealing.island===p.island?0:1;p.el.style.opacity=String(p.alpha);p.el.hidden=false;load(p);changed=true;}
  else if(!on&&p.shown){p.shown=false;p.alpha=0;p.el.hidden=true;dropTiles(p);changed=true;}}
  if(changed){bedDirty=true;buildCoast();scheduleTiles();}}
 // the island fades in over REVEAL_MS; `done` runs when it is fully there
 // (an island's satellites are pictures of their own; they fade in with it)
 const group=island=>pics.filter(q=>q.island===island);
 function reveal(island,done){const p=pics.find(q=>q.island===island&&!q.sat);if(!p||p.shown){done?.();return;}
  revealing={island,t0:0,done};for(const q of group(island))q.fading=1;syncOpen();void p.el.offsetWidth;for(const q of group(island))q.el.style.transition=`opacity ${REVEAL_MS}ms ease-in-out`;
  requestAnimationFrame(()=>{for(const q of group(island))q.el.style.opacity='1';});queue2();draw(performance.now());}
 function stepReveal(t){if(!revealing)return;const g=group(revealing.island);if(!revealing.t0)revealing.t0=t;const u=Math.min(1,(t-revealing.t0)/REVEAL_MS);for(const q of g)q.alpha=ease(u);
  if(u>=1){for(const q of g){q.alpha=1;q.fading=0;q.el.style.transition='';}const done=revealing.done;revealing=null;buildCoast();done?.();}}
 const revealTarget=island=>{const p=pics.find(q=>q.island===island&&!q.sat);return p?{minX:p.x0,minY:p.y0,maxX:p.x0+p.w,maxY:p.y0+p.h}:null;};

 // ---- camera: called by the game whenever it moves the world ----
 function setCamera(c){cam={x:c.x,y:c.y,scale:c.scale};bedDirty=true;back.style.transform=`translate(${c.x}px,${c.y}px) scale(${c.scale})`;last=performance.now();draw(last);
  if(!moving){moving=true;world.classList.add('moving');}
  clearTimeout(settleTimer);settleTimer=setTimeout(()=>{moving=false;world.classList.remove('moving');scheduleTiles();},220);}
 function resize(){size();draw(performance.now());scheduleTiles();}
 function setMotion(on){motion=on;viewport.classList.toggle('sea-still',!on);draw(performance.now());queue2();}
 // the observatory's machinery follows the animation setting, not the sea's
 function setObsMotion(on){obsMotion=on;draw(performance.now());queue2();}
 // the deck lights round the eye turn pink while a rebirth is ready
 let obsReady=false;function setReady(on){on=!!on;if(on===obsReady)return;obsReady=on;obs.setReady(on);draw(performance.now());queue2();}
 function setVisible(on){visible=on;bedDirty=true;back.hidden=!on;canvas.hidden=obsUnder.hidden=bed.hidden=!on;for(const el of [decorSvg,beamSvg,buildSvg,mossSvg,overSvg,fxEl])if(el)el.style.visibility=on?'':'hidden';draw(performance.now());if(on){scheduleTiles();queue2();}}

 // ---- growth: decoration by island progress, buildings at MAX, grass and moss ----
 let growthKey='';
 function render(){syncOpen();obs.setLit(islandsDone());const owned=nodes.filter(n=>level(n)>0);
  const shown=new Set(pics.filter(p=>p.shown&&!p.fading).map(p=>p.island));
  const lms=pics.flatMap(p=>shown.has(p.island)?p.landmarks:[]),node=id=>nodes.find(m=>m.id===id);
  const built=lms.filter(l=>{if(l.frame)return false;const n=node(l.node);return n&&level(n)>=n.max;});
  // frame nodes (섬 3) stand round their card once it is seen: dark until researched, the lamp lit at MAX
  const frames=lms.filter(l=>l.frame).map(l=>{const n=node(l.node);if(!n||!seen(n))return null;const lv=level(n);return {l,st:lv>=n.max?'max':lv>0?'on':'dormant'};}).filter(Boolean);
  // an A/B pair drawn together: dark until its prerequisite is researched, then open, then the chosen side
  const pairs=pics.flatMap(p=>shown.has(p.island)?p.pairs:[]).map(q=>{const a=node(q.a),b=node(q.b);if(!a||!b||(!seen(a)&&!seen(b)))return null;const par=a.req[0]&&node(a.req[0].id);
   return {q,st:level(a)>0?'a':level(b)>0?'b':par&&level(par)>0?'open':'dormant'};}).filter(Boolean);
  const key=owned.map(n=>n.id).join(',')+'|'+built.map(l=>l.node).join(',')+'|'+[...shown].join(',')+'|'+frames.map(f=>f.l.node+f.st).join(',')+'|'+pairs.map(p=>p.q.a+p.st).join(',');if(key===growthKey)return;growthKey=key;
  const framed=new Set(built.map(l=>l.node));
  let dec='';
  for(const p of pics){if(!shown.has(p.island)||!p.decor.length)continue;const mine=nodes.filter(n=>n.island===p.island),ownedHere=mine.filter(n=>level(n)>0),q=ownedHere.length/Math.max(1,mine.length),rank=new Map(mine.map((n,i)=>[n.id,i]));
   for(const d of p.decor)if(q>=d.t)dec+=d.svg;
   for(const n of ownedHere)if(!framed.has(n.id)&&!n.tint&&ownedHere.length>=rank.get(n.id)+1)dec+=grassBehind(n);}
  decorSvg.innerHTML=dec;
  buildSvg.innerHTML=pairs.map(p=>p.q.states[p.st]).join('')+frames.map(f=>f.l.frame.under[f.st]).join('')+built.map(l=>l.svg).join('');
  if(overSvg)overSvg.innerHTML=frames.map(f=>f.l.frame.over[f.st]).join('')+built.map(l=>l.over||'').join('');
  fxEl.innerHTML=built.flatMap(l=>l.fx||[]).map(([x,y,r,d,dl,w,o])=>`<i class="fx-ring" style="left:${x-r}px;top:${y-r}px;width:${2*r}px;height:${2*r}px;border-width:${w}px;border-color:rgba(232,246,246,${o});animation-duration:${d}s;animation-delay:${dl}s"></i>`).join('');
  beamSvg.style.display=built.some(l=>l.beam)?'':'none';
  let mo='';for(const p of pics){if(!shown.has(p.island))continue;const mine=nodes.filter(n=>n.island===p.island),ownedHere=mine.filter(n=>level(n)>0),rank=new Map(mine.map((n,i)=>[n.id,i]));mo+=ownedHere.filter(n=>!n.tint&&ownedHere.length>=rank.get(n.id)+4).map(moss).join('');}
  mossSvg.innerHTML=mo;}

 size();syncOpen();queue2();
 // The map area changes size when the panel or header folds, or the phone's
 // browser bars move. The FX bitmap must follow, or it stretches off the coast.
 if(typeof ResizeObserver==='function')new ResizeObserver(()=>{const r=viewport.getBoundingClientRect();if(Math.round(r.width*dpr)!==canvas.width||Math.round(r.height*dpr)!==canvas.height||Math.min(2,window.devicePixelRatio||1)!==dpr)resize();}).observe(viewport);
 return {setCamera,resize,setMotion,setObsMotion,setReady,setVisible,render,reveal,revealTarget,isRevealing:()=>!!revealing};
}
