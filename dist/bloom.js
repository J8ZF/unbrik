// Prestige map weather: steady rain falling as long, thin, slanted streaks,
// with a few cherry petals drifting through it. Runs only while the prestige
// map is shown and motion is allowed; nothing is drawn otherwise.
const SLANT=Math.tan(17*Math.PI/180);   // streaks lean 17° from vertical
export function createBloom(canvas,isEnabled,{raf=globalThis.requestAnimationFrame,caf=globalThis.cancelAnimationFrame,random=Math.random}={}){
 const ctx=canvas.getContext?.('2d');
 let frame=0,petals=[],drops=[],w=0,h=0,last=0,running=false;
 const rnd=(a,b)=>a+random()*(b-a);
 function resize(){const rect=canvas.getBoundingClientRect(),dpr=Math.min(2,globalThis.devicePixelRatio||1);w=Math.max(1,rect.width);h=Math.max(1,rect.height);canvas.width=Math.round(w*dpr);canvas.height=Math.round(h*dpr);ctx?.setTransform(dpr,0,0,dpr,0,0);}
 // A streak: one thin line, 50–110px long, falling fast along the slant.
 function drop(fresh){const vy=rnd(1050,1450);return {x:rnd(-40,w+h*SLANT),y:fresh?rnd(-h*.6,-20):rnd(-h*.2,h),len:rnd(50,110),vy,vx:-vy*SLANT,width:rnd(.8,1.3),alpha:rnd(.22,.42)};}
 // A cherry petal: longer than wide, a shallow notch at the tip, tumbling
 // so its width keeps changing as it turns in the air.
 function petal(fresh){return {x:rnd(-30,w+30),y:fresh?rnd(-60,-10):rnd(-h*.2,h),len:rnd(6,9.5),a:rnd(0,Math.PI*2),spin:rnd(-1.4,1.4),flip:rnd(0,Math.PI*2),flipSpeed:rnd(2,4.2),vx:rnd(-18,10),vy:rnd(34,62),sway:rnd(0,Math.PI*2),swayAmp:rnd(10,26),swaySpeed:rnd(.6,1.4),tint:random()<.6?'#f9c6da':'#fde6ef',alpha:rnd(.55,.85)};}
 function populate(){drops=Array.from({length:Math.round(Math.min(36,Math.max(10,w*h/14000)))},()=>drop(false));petals=Array.from({length:Math.round(Math.min(26,Math.max(10,w*h/16000)))},()=>petal(false));}
 function drawPetal(p){
  const L=p.len,W=L*.62*Math.max(.18,Math.abs(Math.cos(p.flip)));
  ctx.save();ctx.translate(p.x,p.y);ctx.rotate(p.a);ctx.globalAlpha=p.alpha;ctx.fillStyle=p.tint;
  ctx.beginPath();
  ctx.moveTo(0,L*.5);                                   // narrow base
  ctx.bezierCurveTo(W*.55,L*.28,W*.55,-L*.32,W*.22,-L*.5); // right side up to the tip
  ctx.lineTo(0,-L*.42);                                 // shallow notch
  ctx.lineTo(-W*.22,-L*.5);
  ctx.bezierCurveTo(-W*.55,-L*.32,-W*.55,L*.28,0,L*.5);
  ctx.fill();ctx.restore();
 }
 function draw(dt){
  ctx.clearRect(0,0,w,h);ctx.lineCap='butt';
  for(const d of drops){
   d.y+=d.vy*dt;d.x+=d.vx*dt;if(d.y-d.len>h||d.x<-60)Object.assign(d,drop(true));
   const dx=d.len*SLANT;ctx.strokeStyle=`rgba(206,218,248,${d.alpha})`;ctx.lineWidth=d.width;
   ctx.beginPath();ctx.moveTo(d.x+dx,d.y-d.len);ctx.lineTo(d.x,d.y);ctx.stroke();
  }
  for(const p of petals){
   p.sway+=p.swaySpeed*dt;p.flip+=p.flipSpeed*dt;p.x+=(p.vx+Math.cos(p.sway)*p.swayAmp)*dt;p.y+=p.vy*dt;p.a+=p.spin*dt;
   if(p.y>h+20||p.x<-50||p.x>w+50)Object.assign(p,petal(true));
   drawPetal(p);
  }
 }
 function step(now){if(!running)return;const dt=Math.min(.05,last?(now-last)/1000:0);last=now;draw(dt);frame=raf(step);}
 function start(){if(running||!ctx)return;running=true;resize();populate();last=0;frame=raf(step);}
 function stop(){if(!running)return;running=false;caf(frame);frame=0;ctx?.clearRect(0,0,w,h);}
 function refresh(){if(isEnabled())start();else stop();}
 const observer=globalThis.ResizeObserver?new ResizeObserver(()=>{if(running){resize();populate();}}):null;observer?.observe(canvas);
 return {refresh,start,stop,resize,get running(){return running;},get count(){return {petals:petals.length,drops:drops.length};}};
}
