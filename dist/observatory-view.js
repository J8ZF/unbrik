// The central observatory's moving parts. Its still architecture is painted in
// the island back layer; this draws what moves, on two screen-size canvases
// that the island view clears and calls in the same frame as the camera:
//  under  (below the painted layer) the floor, the dark pillars and the turning
//         gear rings the city stands on; the sunken ring and the giant machine
//         out in the water, reef-grey, turning slowly
//  over   (above the map) light tracks on the terraces, the neon ring and its
//         runner, the half rings at the rim, and six relic islands in orbit,
//         each a bitmap rasterised at the zoom in use, its station lamp lit in
//         the island's colour once that island is done
// Shapes come as SVG path data grouped by style, one Path2D per group.
import {OBS_ART as A} from './observatory-art.js?v=4.0.0-dev.1';

const [CX,CY]=A.center,RAD=A.radius,ISLAND_LEVELS=[.5,1];// bitmaps stay small: they live in GPU memory
const layers=l=>l.map(x=>({spin:x.spin,groups:x.groups.map(g=>({path:new Path2D(g.d),f:g.f,s:g.s,w:g.w}))}));
export function createObservatory(){
 const under=layers(A.under),rims=layers(A.rims),irisL=layers(A.iris);
 const islands=A.islands.map(i=>{const img=new Image();img.decoding='async';img.src='data:image/svg+xml;charset=utf-8,'+encodeURIComponent(i.svg);const o={...i,img,ready:false,bitmaps:new Map()};
  img.onload=()=>{o.ready=true;};return o;});
 const lamp=new Path2D(Array.from({length:8},(_,k)=>{const a=(k*45+22.5)*Math.PI/180;return (k?'L':'M')+(Math.cos(a)*16).toFixed(1)+','+(Math.sin(a)*16).toFixed(1);}).join('')+'Z');
 let lit=[],time=0,lastT=0,halo=null;
 function paint(ctx,ls,t){for(const l of ls){ctx.save();if(l.spin)ctx.rotate(l.spin*t*Math.PI/180);for(const g of l.groups){ctx.fillStyle=g.f;ctx.fill(g.path);if(g.s!=='none'){ctx.strokeStyle=g.s;ctx.lineWidth=g.w;ctx.stroke(g.path);}}ctx.restore();}}
 // a bitmap of an island at a zoom level, built when first needed
 function bitmap(o,L){let cv=o.bitmaps.get(L);if(cv||!o.ready)return cv||null;cv=document.createElement('canvas');const px=Math.round(o.size*L);cv.width=cv.height=px;cv.getContext('2d').drawImage(o.img,0,0,px,px);
  for(const [k,old] of o.bitmaps)if(k!==L){old.width=old.height=1;o.bitmaps.delete(k);}o.bitmaps.set(L,cv);return cv;}
 function levelFor(scale){for(const L of ISLAND_LEVELS)if(L>=scale*.9)return L;return ISLAND_LEVELS.at(-1);}
 // ctx is already in world space (scaled, camera applied); v is the visible world rect
 function inView(v,m){return CX+RAD+m>=v[0]&&CX-RAD-m<=v[2]&&CY+RAD+m>=v[1]&&CY-RAD-m<=v[3];}
 function tick(now,motion){if(motion&&lastT)time+=Math.min(.1,(now-lastT)/1000);lastT=now;}
 function drawUnder(ctx,v,scale){if(!inView(v,0))return;
  ctx.save();ctx.translate(CX,CY);
  if(!halo){halo=ctx.createRadialGradient(0,0,0,0,0,A.halo.r);halo.addColorStop(0,A.halo.c+'38');halo.addColorStop(.55,A.halo.c+'17');halo.addColorStop(1,A.halo.c+'00');}
  ctx.fillStyle=halo;ctx.fillRect(-A.halo.r,-A.halo.r,2*A.halo.r,2*A.halo.r);
  paint(ctx,under,time);ctx.restore();}
 function drawOver(ctx,v,scale,dpr){if(!inView(v,400))return;const t=time;
  ctx.save();ctx.translate(CX,CY);
  paint(ctx,irisL,t);
  // light tracks over the terraces: three arcs each, a runner on one
  ctx.lineCap='butt';for(const k of A.tracks){ctx.save();ctx.rotate(k.spin*t*Math.PI/180);ctx.strokeStyle='#73d3ed';ctx.globalAlpha=k.alpha;ctx.lineWidth=Math.max(k.w,1.2/scale);
   for(let j=0;j<3;j++){const a=(j*120+k.gap)*Math.PI/180;ctx.beginPath();ctx.arc(0,0,k.r,a,a+84*Math.PI/180);ctx.stroke();}
   const a=(50+k.gap)*Math.PI/180;ctx.globalAlpha=1;ctx.fillStyle='#a7edfc';ctx.beginPath();ctx.arc(Math.cos(a)*k.r,Math.sin(a)*k.r,Math.max(5,2/scale),0,7);ctx.fill();ctx.restore();}
  // the big neon ring, thin, with a soft glow, and a runner on a thinner orbit inside it
  const N=A.neon,lw=Math.max(N.w,1.4/scale);ctx.globalAlpha=.16;ctx.strokeStyle='#73d3ed';ctx.lineWidth=lw*4;ctx.beginPath();ctx.arc(0,0,N.r,0,7);ctx.stroke();
  ctx.globalAlpha=.85;ctx.lineWidth=lw;ctx.stroke();
  ctx.globalAlpha=.35;ctx.lineWidth=Math.max(1.2,1/scale);ctx.beginPath();ctx.arc(0,0,N.orbit,0,7);ctx.stroke();
  {const a=N.speed*t*Math.PI/180;ctx.lineCap='round';for(const [len,al,w] of [[.5,.18,10],[.22,.45,6],[.06,1,3]]){ctx.globalAlpha=al;ctx.lineWidth=Math.max(w,w*.35/scale);ctx.beginPath();ctx.arc(0,0,N.orbit,a-len,a);ctx.stroke();}
   ctx.globalAlpha=1;ctx.fillStyle='#e8fbff';ctx.beginPath();ctx.arc(Math.cos(a)*N.orbit,Math.sin(a)*N.orbit,Math.max(7,2.5/scale),0,7);ctx.fill();}
  ctx.globalAlpha=1;ctx.lineCap='butt';
  paint(ctx,rims,t);
  // relic islands in orbit, each turning on its own
  const L=levelFor(scale*dpr);
  islands.forEach((o,i)=>{const a=(o.orbit.a0+o.orbit.speed*t)*Math.PI/180,x=Math.cos(a)*o.orbit.r,y=Math.sin(a)*o.orbit.r;
   const bm=bitmap(o,L)||[...o.bitmaps.values()].at(-1);if(!bm)return;
   ctx.save();ctx.translate(x,y);ctx.rotate(o.spin*t*Math.PI/180);ctx.drawImage(bm,-o.size/2,-o.size/2,o.size,o.size);
   if(lit[i]){ctx.translate(o.lamp[0],o.lamp[1]);ctx.globalAlpha=.3;ctx.fillStyle=o.color;ctx.beginPath();ctx.arc(0,0,46,0,7);ctx.fill();ctx.globalAlpha=1;ctx.strokeStyle=o.color;ctx.lineWidth=4;ctx.beginPath();ctx.arc(0,0,34,0,7);ctx.stroke();ctx.fill(lamp);}
   ctx.restore();});
  ctx.restore();}
 return {tick,drawUnder,drawOver,inView:v=>inView(v,400),setLit(flags){lit=flags;},bounds:{minX:CX-RAD,minY:CY-RAD,maxX:CX+RAD,maxY:CY+RAD}};
}
