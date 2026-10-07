// Night bloom: cherry petals drifting over the prestige map, with a light rain
// that thickens when the world's weather is rain and stops for snow. Runs only
// while the map is shown and motion is allowed; nothing is drawn otherwise.
export function createBloom(canvas,isEnabled,weatherOf=()=>'clear',{raf=globalThis.requestAnimationFrame,caf=globalThis.cancelAnimationFrame,random=Math.random}={}){
 const ctx=canvas.getContext?.('2d');
 let frame=0,petals=[],drops=[],w=0,h=0,last=0,running=false;
 const rnd=(a,b)=>a+random()*(b-a);
 function resize(){const rect=canvas.getBoundingClientRect(),dpr=Math.min(2,globalThis.devicePixelRatio||1);w=Math.max(1,rect.width);h=Math.max(1,rect.height);canvas.width=Math.round(w*dpr);canvas.height=Math.round(h*dpr);ctx?.setTransform(dpr,0,0,dpr,0,0);}
 function petal(fresh){return {x:rnd(-40,w+40),y:fresh?rnd(-80,-12):rnd(-h*.2,h),r:rnd(3.5,7.5),a:rnd(0,Math.PI*2),spin:rnd(-1.8,1.8),vx:rnd(-10,28),vy:rnd(26,58),sway:rnd(0,Math.PI*2),swayAmp:rnd(8,28),swaySpeed:rnd(.7,1.7),tint:random()<.55?'#f7a8c4':'#ffcfe0',alpha:rnd(.38,.8)};}
 function drop(fresh){return {x:rnd(-60,w+60),y:fresh?rnd(-h*.5,-10):rnd(-h,h),len:rnd(9,20),vy:rnd(480,720),vx:rnd(-46,-22),alpha:rnd(.08,.22)};}
 function populate(){const count=Math.round(Math.min(96,Math.max(26,w*h/13000)));petals=Array.from({length:count},()=>petal(false));drops=[];}
 function rainTarget(){const weather=weatherOf();if(weather==='snow')return 0;return Math.round(w*h/(weather==='rain'?4200:24000));}
 function draw(dt){
  const target=rainTarget();while(drops.length<target)drops.push(drop(true));if(drops.length>target)drops.length=target;
  ctx.clearRect(0,0,w,h);ctx.lineCap='round';ctx.lineWidth=1;
  for(const d of drops){d.y+=d.vy*dt;d.x+=d.vx*dt;if(d.y>h+30||d.x<-80)Object.assign(d,drop(true));ctx.strokeStyle=`rgba(188,204,255,${d.alpha})`;ctx.beginPath();ctx.moveTo(d.x,d.y);ctx.lineTo(d.x-d.vx*.028,d.y-d.len);ctx.stroke();}
  for(const p of petals){
   p.sway+=p.swaySpeed*dt;p.x+=(p.vx+Math.cos(p.sway)*p.swayAmp)*dt;p.y+=p.vy*dt;p.a+=p.spin*dt;
   if(p.y>h+24||p.x<-70||p.x>w+70)Object.assign(p,petal(true));
   const r=p.r;ctx.save();ctx.translate(p.x,p.y);ctx.rotate(p.a);ctx.globalAlpha=p.alpha;ctx.fillStyle=p.tint;
   // A cherry petal: rounded body with a small notch at the tip.
   ctx.beginPath();ctx.moveTo(0,r);ctx.bezierCurveTo(r*1.15,r*.25,r*.95,-r*.95,0,-r*.5);ctx.bezierCurveTo(-r*.95,-r*.95,-r*1.15,r*.25,0,r);ctx.fill();ctx.restore();
  }
 }
 function step(now){if(!running)return;const dt=Math.min(.05,last?(now-last)/1000:0);last=now;draw(dt);frame=raf(step);}
 function start(){if(running||!ctx)return;running=true;resize();populate();last=0;frame=raf(step);}
 function stop(){if(!running)return;running=false;caf(frame);frame=0;ctx?.clearRect(0,0,w,h);}
 function refresh(){if(isEnabled())start();else stop();}
 const observer=globalThis.ResizeObserver?new ResizeObserver(()=>{if(running){resize();populate();}}):null;observer?.observe(canvas);
 return {refresh,start,stop,resize,get running(){return running;},get count(){return {petals:petals.length,drops:drops.length};}};
}
