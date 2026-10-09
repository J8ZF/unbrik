// AXIOM island map: the painted islands behind the studies.
//
// Layers, back to front:
//  back   (world space, same transform as #world) — v1 sea triangles, then the
//         static island picture as bitmap tiles: a coarse copy of the whole
//         world plus sharp 512 px tiles drawn for the visible area once the view
//         settles. Zooming and panning only move textures; nothing is redrawn.
//  canvas (screen space) — the moving sea: the grid sweep, surf lines along the
//         shore and waves on the beaches. It is drawn in the same call that moves
//         the camera, so the shore never lags behind the island.
//  #world — growth layers around the HTML studies: decoration and grass, the
//         lighthouse beam, landmark buildings, moss over bought cards.
import {ISLAND_ART as ART} from './island-art.js?v=4.0.0-dev.1';

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

export function createIslandView({viewport,back,canvas,world,decorSvg,beamSvg,buildSvg,mossSvg,nodes,level}){
 const [WX0,WY0,WW,WH]=ART.world;
 let cam={x:0,y:0,scale:1},motion=true,visible=true,W=0,H=0,dpr=1;
 // ---- world-space sheets ----
 // sizes go in style: the game's base CSS gives every svg 24×24 px
 const sheet=el=>{el.setAttribute('viewBox',`${WX0} ${WY0} ${WW} ${WH}`);Object.assign(el.style,{left:WX0+'px',top:WY0+'px',width:WW+'px',height:WH+'px'});};
 for(const el of [decorSvg,buildSvg,mossSvg])sheet(el);
 const triEl=document.createElement('div'),coarse=document.createElement('canvas'),tilesEl=document.createElement('div');
 triEl.className='island-tri';tilesEl.className='island-tiles';coarse.className='island-coarse';
 triEl.innerHTML=ART.tri.map(t=>`<svg class="tri" style="left:${t.x0}px;top:${t.y0}px;width:${t.w}px;height:${t.h}px;${t.style}" viewBox="${t.x0} ${t.y0} ${t.w} ${t.h}">${t.body}</svg>`).join('');
 back.append(triEl,coarse,tilesEl);
 const lh=ART.landmarks.find(l=>l.beam);
 if(lh){const [cx,cy]=lh.beam,L=760;Object.assign(beamSvg.style,{left:(cx-L)+'px',top:(cy-L)+'px',width:2*L+'px',height:2*L+'px'});beamSvg.setAttribute('viewBox',`${cx-L} ${cy-L} ${2*L} ${2*L}`);
  beamSvg.innerHTML=[[.13,.13],[.07,.12]].map(([a,o])=>`<polygon points="${cx},${cy} ${cx+L},${cy-L*a} ${cx+L},${cy+L*a}" fill="#fff3b0" fill-opacity="${o}"/>`).join('');}

 // ---- static picture as bitmap tiles ----
 const T=512,LEVELS=[.5,1,2,4,8],MAX_TILES=90,tiles=new Map();let backImg=null,queue=[],pumping=false,moving=false,settleTimer=0;
 const viewRect=(m=0)=>{const w=W/cam.scale,h=H/cam.scale,x=-cam.x/cam.scale,y=-cam.y/cam.scale;return [x-w*m,y-h*m,x+w*(1+m),y+h*(1+m)];};
 function neededLevel(){const need=cam.scale*dpr;if(need<=.3)return 0;for(const L of LEVELS)if(L>=need*.9)return L;return LEVELS.at(-1);}
 function scheduleTiles(){if(!backImg||!visible)return;const L=neededLevel();queue=[];const now=performance.now();if(!L)return;const span=T/L,v=viewRect(.2),cx=(v[0]+v[2])/2,cy=(v[1]+v[3])/2;
  const i0=Math.max(0,Math.floor((v[0]-WX0)/span)),i1=Math.min(Math.ceil(WW/span)-1,Math.floor((v[2]-WX0)/span)),j0=Math.max(0,Math.floor((v[1]-WY0)/span)),j1=Math.min(Math.ceil(WH/span)-1,Math.floor((v[3]-WY0)/span));
  for(let i=i0;i<=i1;i++)for(let j=j0;j<=j1;j++){const k=L+':'+i+':'+j,t=tiles.get(k);if(t){t.used=now;continue;}queue.push({L,i,j,k,d:Math.hypot(WX0+(i+.5)*span-cx,WY0+(j+.5)*span-cy)});}
  queue.sort((a,b)=>a.d-b.d);pump();}
 function pump(){if(pumping||!queue.length)return;pumping=true;requestAnimationFrame(function step(){const t0=performance.now();
  while(queue.length&&performance.now()-t0<10&&!moving)renderTile(queue.shift());
  if(queue.length)requestAnimationFrame(step);else{pumping=false;evict();}});}
 function renderTile({L,i,j,k}){const span=T/L,b=1/L,wx=WX0+i*span-b,wy=WY0+j*span-b,cv=document.createElement('canvas');cv.width=cv.height=T+2;
  cv.getContext('2d').drawImage(backImg,wx-WX0,wy-WY0,span+2*b,span+2*b,0,0,T+2,T+2);
  Object.assign(cv.style,{left:wx+'px',top:wy+'px',width:(span+2*b)+'px',height:(span+2*b)+'px',zIndex:String(LEVELS.indexOf(L)+1)});
  tilesEl.append(cv);tiles.set(k,{cv,used:performance.now()});}
 function evict(){if(tiles.size<=MAX_TILES)return;const list=[...tiles.entries()].sort((a,b)=>a[1].used-b[1].used);for(const [k,t] of list.slice(0,tiles.size-MAX_TILES)){t.cv.remove();tiles.delete(k);}}
 {const img=new Image();img.decoding='async';
  img.onload=()=>{backImg=img;const q=.25;coarse.width=Math.round(WW*q);coarse.height=Math.round(WH*q);Object.assign(coarse.style,{left:WX0+'px',top:WY0+'px',width:WW+'px',height:WH+'px'});coarse.getContext('2d').drawImage(img,0,0,coarse.width,coarse.height);scheduleTiles();};
  // fallback: if the picture cannot load as an image, keep it as live SVG
  img.onerror=()=>{const holder=document.createElement('div');holder.innerHTML=ART.back;const svg=holder.firstElementChild;svg.setAttribute('class','island-sheet');Object.assign(svg.style,{left:WX0+'px',top:WY0+'px',width:WW+'px',height:WH+'px'});tilesEl.append(svg);};
  img.src='data:image/svg+xml;charset=utf-8,'+encodeURIComponent(ART.back);}

 // ---- moving sea ----
 const ctx=canvas.getContext('2d');
 const bbox=pts=>{let a=1e9,b=1e9,c=-1e9,d=-1e9;for(const [x,y] of pts){if(x<a)a=x;if(y<b)b=y;if(x>c)c=x;if(y>d)d=y;}return [a,b,c,d];};
 const mkPath=(pts,close)=>{const p=new Path2D();p.moveTo(pts[0][0],pts[0][1]);for(let i=1;i<pts.length;i++)p.lineTo(pts[i][0],pts[i][1]);if(close)p.closePath();return p;};
 const SURF_OUT=ART.fx.surfOut.map(p=>({p:mkPath(p,true),b:bbox(p)})),SURF_IN=ART.fx.surfIn.map(p=>({p:mkPath(p,true),b:bbox(p)}));
 const WAVES=ART.fx.waves.map(w=>({i:w.i,p:mkPath(w.pts,false),b:bbox(w.pts)})),MASK=ART.fx.mask.map(p=>({p:mkPath(p,true),b:bbox(p)}));
 const hit=(b,v)=>b[2]>=v[0]&&b[0]<=v[2]&&b[3]>=v[1]&&b[1]<=v[3];
 const ease=u=>u*u*(3-2*u);
 const waveAlpha=(t,i)=>{const u=(((t/1000-i*1.1)%6.6)+6.6)%6.6/6.6;if(u<.22)return .62*ease(u/.22);if(u<.55)return .62+(.1-.62)*ease((u-.22)/.33);return .1*(1-ease((u-.55)/.45));};
 // ---- sea grid ----
 // Small crosses cover the whole view at any zoom. They sit on a world lattice
 // (so they move with the map) whose step doubles or halves with the zoom: the
 // screen gap stays between GRID_MIN and twice that, and the next finer set
 // fades in as you zoom. Their tone follows the depth bands round the island;
 // waves of light run out from the coast across them.
 const GRID_MIN=48,ARM=3.5,LW=1.3,DEEP='#2a3844',DQ=1/20;
 const depth=document.createElement('canvas');depth.width=Math.ceil(WW*DQ);depth.height=Math.ceil(WH*DQ);
 {const d=depth.getContext('2d');d.setTransform(DQ,0,0,DQ,-WX0*DQ,-WY0*DQ);if('filter' in d)d.filter='blur(1.5px)';for(const b of ART.fx.depth){d.fillStyle=b.c;d.fill(mkPath(b.pts,true));}}
 const tiles2=new Map();
 function crossPattern(P,arm,lw){const key=P+':'+arm+':'+lw;let pat=tiles2.get(key);if(!pat){const c=document.createElement('canvas');c.width=c.height=P;const g=c.getContext('2d');g.fillStyle='#fff';
  g.fillRect(P/2-arm,P/2-lw/2,arm*2,lw);g.fillRect(P/2-lw/2,P/2-arm,lw,arm*2);pat=ctx.createPattern(c,'repeat');if(tiles2.size>80)tiles2.clear();tiles2.set(key,pat);}return pat;}
 // ---- waves: distance to the coast on a coarse grid, soft bands moving outward ----
 const WQ=24,DW=Math.ceil(WW/WQ),DH=Math.ceil(WH/WQ),coastDist=new Float32Array(DW*DH),waveCv=document.createElement('canvas');waveCv.width=DW;waveCv.height=DH;
 const waveCtx=waveCv.getContext('2d'),waveImg=waveCtx.createImageData(DW,DH);
 {const d=waveCtx;d.setTransform(1/WQ,0,0,1/WQ,-WX0/WQ,-WY0/WQ);d.fillStyle='#000';for(const p of ART.fx.coast)d.fill(mkPath(p,true));d.setTransform(1,0,0,1,0,0);
  const px=d.getImageData(0,0,DW,DH).data,D=coastDist,R2=Math.SQRT2;for(let i=0;i<DW*DH;i++)D[i]=px[i*4+3]>127?0:1e9;
  for(let y=0;y<DH;y++)for(let x=0;x<DW;x++){const i=y*DW+x;let v=D[i];if(!v)continue;if(x>0)v=Math.min(v,D[i-1]+1);if(y>0){v=Math.min(v,D[i-DW]+1);if(x>0)v=Math.min(v,D[i-DW-1]+R2);if(x<DW-1)v=Math.min(v,D[i-DW+1]+R2);}D[i]=v;}
  for(let y=DH-1;y>=0;y--)for(let x=DW-1;x>=0;x--){const i=y*DW+x;let v=D[i];if(!v)continue;if(x<DW-1)v=Math.min(v,D[i+1]+1);if(y<DH-1){v=Math.min(v,D[i+DW]+1);if(x<DW-1)v=Math.min(v,D[i+DW+1]+R2);if(x>0)v=Math.min(v,D[i+DW-1]+R2);}D[i]=v;}
  for(let i=0;i<DW*DH;i++){waveImg.data[i*4]=169;waveImg.data[i*4+1]=191;waveImg.data[i*4+2]=207;}}
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
  ctx.setTransform(s,0,0,s,cam.x*dpr,cam.y*dpr);ctx.drawImage(depth,WX0,WY0,depth.width/DQ,depth.height/DQ);
  if(motion){waves(t);ctx.globalAlpha=.6;ctx.drawImage(waveCv,WX0,WY0,DW*WQ,DH*WQ);
   // the band also lifts the water a little, so it reads between sparse crosses
   ctx.globalCompositeOperation='destination-over';ctx.globalAlpha=.045;ctx.drawImage(waveCv,WX0,WY0,DW*WQ,DH*WQ);ctx.globalAlpha=1;}
  ctx.globalCompositeOperation='destination-out';ctx.fillStyle=ctx.strokeStyle='#000';ctx.lineWidth=6;for(const m of MASK)if(hit(m.b,v)){ctx.fill(m.p);ctx.stroke(m.p);}
  ctx.globalCompositeOperation='source-over';}
 function size(){const r=viewport.getBoundingClientRect();dpr=Math.min(2,window.devicePixelRatio||1);W=r.width;H=r.height;canvas.width=Math.round(W*dpr);canvas.height=Math.round(H*dpr);}
 function draw(t){ctx.setTransform(1,0,0,1,0,0);ctx.clearRect(0,0,canvas.width,canvas.height);if(!visible)return;
  const s=cam.scale*dpr;ctx.setTransform(s,0,0,s,cam.x*dpr,cam.y*dpr);const v=viewRect();
  drawGrid(t,v);ctx.setTransform(s,0,0,s,cam.x*dpr,cam.y*dpr);
  ctx.strokeStyle='#eef4f5';ctx.lineJoin='round';ctx.lineCap='butt';
  const ph=(t/5000)%2,br=.12+.34*ease(ph<1?ph:2-ph);
  ctx.lineWidth=3;ctx.setLineDash([90,70,40,60,150,78]);ctx.lineDashOffset=motion?488*((t/28000)%1):0;ctx.globalAlpha=motion?br:.3;for(const o of SURF_OUT)if(hit(o.b,v))ctx.stroke(o.p);
  ctx.lineWidth=3.6;ctx.setLineDash([170,46,70,38,240,60,110,52]);ctx.lineDashOffset=motion?-786*((t/40000)%1):0;ctx.globalAlpha=.62;for(const o of SURF_IN)if(hit(o.b,v))ctx.stroke(o.p);
  ctx.setLineDash([]);ctx.lineCap='round';
  for(const w of WAVES)if(hit(w.b,v)){ctx.globalAlpha=motion?waveAlpha(t,w.i):.28;ctx.lineWidth=3.4-w.i*.3;ctx.stroke(w.p);}
  ctx.globalAlpha=1;}
 let queued=false,last=0;
 function loop(t){queued=false;if(!motion||!visible)return;if(t-last>=32){last=t;draw(t);}queue2();}
 function queue2(){if(!queued&&motion&&visible){queued=true;requestAnimationFrame(loop);}}

 // ---- camera: called by the game whenever it moves the world ----
 function setCamera(c){cam={x:c.x,y:c.y,scale:c.scale};back.style.transform=`translate(${c.x}px,${c.y}px) scale(${c.scale})`;last=performance.now();draw(last);
  if(!moving){moving=true;world.classList.add('moving');}
  clearTimeout(settleTimer);settleTimer=setTimeout(()=>{moving=false;world.classList.remove('moving');scheduleTiles();},220);}
 function resize(){size();draw(performance.now());scheduleTiles();}
 function setMotion(on){motion=on;viewport.classList.toggle('sea-still',!on);draw(performance.now());queue2();}
 function setVisible(on){visible=on;back.hidden=!on;canvas.hidden=!on;for(const el of [decorSvg,beamSvg,buildSvg,mossSvg])el.style.visibility=on?'':'hidden';draw(performance.now());if(on){scheduleTiles();queue2();}}

 // ---- growth: decoration by island progress, buildings at MAX, grass and moss ----
 let growthKey='';
 function render(){const owned=nodes.filter(n=>level(n)>0),p=owned.length/nodes.length,built=ART.landmarks.filter(l=>{const n=nodes.find(m=>m.id===l.node);return n&&level(n)>=n.max;});
  const key=owned.map(n=>n.id).join(',')+'|'+built.map(l=>l.node).join(',');if(key===growthKey)return;growthKey=key;
  const framed=new Set(built.map(l=>l.node)),rank=new Map(nodes.map((n,i)=>[n.id,i]));
  let dec='';for(const d of ART.decor)if(p>=d.t)dec+=d.svg;
  for(const n of owned)if(!framed.has(n.id)&&owned.length>=rank.get(n.id)+1)dec+=grassBehind(n);
  decorSvg.innerHTML=dec;
  buildSvg.innerHTML=built.map(l=>l.svg).join('');
  beamSvg.style.display=built.some(l=>l.beam)?'':'none';
  mossSvg.innerHTML=owned.filter(n=>owned.length>=rank.get(n.id)+4).map(moss).join('');}

 size();queue2();
 // The map area changes size when the panel or header folds, or the phone's
 // browser bars move. The FX bitmap must follow, or it stretches off the coast.
 if(typeof ResizeObserver==='function')new ResizeObserver(()=>{const r=viewport.getBoundingClientRect();if(Math.round(r.width*dpr)!==canvas.width||Math.round(r.height*dpr)!==canvas.height||Math.min(2,window.devicePixelRatio||1)!==dpr)resize();}).observe(viewport);
 return {setCamera,resize,setMotion,setVisible,render};
}
