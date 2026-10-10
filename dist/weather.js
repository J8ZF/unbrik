// Weather on screen follows the game's weather (worldState().weather):
//  rain  → rain streaks; light on AXIOM, heavy on the prestige map
//  snow  → snowflakes on AXIOM, falling flowers on the prestige map
//  clear → nothing
// When the weather changes, particles of the old kind finish their fall and
// are not replaced, and the new kind drifts in from the top. The loop runs
// only while something is falling and motion is allowed.
const SLANT=Math.tan(17*Math.PI/180);   // rain leans 17° from vertical
export const WEATHER_MODES={
 none:{rain:0,snow:0,petals:0},
 'rain-light':{rain:'light'},
 'rain-heavy':{rain:'heavy'},
 snow:{snow:1},
 petals:{petals:1},
};
// Particle counts for a w×h viewport (CSS pixels).
export function weatherTargets(mode,w,h){
 const area=w*h,clamp=(v,a,b)=>Math.round(Math.min(b,Math.max(a,v))),m=WEATHER_MODES[mode]||WEATHER_MODES.none;
 return {
  rain:m.rain==='heavy'?clamp(area/14000,10,36):m.rain==='light'?clamp(area/60000,3,9):0,
  snow:m.snow?clamp(area/9000,16,48):0,
  petals:m.petals?clamp(area/16000,10,26):0,
 };
}
export function createWeatherFx(canvas,isEnabled,modeOf=()=>'none',{raf=globalThis.requestAnimationFrame,caf=globalThis.cancelAnimationFrame,random=Math.random}={}){
 const ctx=canvas.getContext?.('2d');
 const lists={rain:[],snow:[],petals:[]};
 let frame=0,w=0,h=0,last=0,running=false,spawnDebt={rain:0,snow:0,petals:0};
 const rnd=(a,b)=>a+random()*(b-a);
 function resize(){const rect=canvas.getBoundingClientRect(),dpr=Math.min(2,globalThis.devicePixelRatio||1);w=Math.max(1,rect.width);h=Math.max(1,rect.height);canvas.width=Math.round(w*dpr);canvas.height=Math.round(h*dpr);ctx?.setTransform(dpr,0,0,dpr,0,0);}
 // fresh: enters from above the top edge; otherwise anywhere on screen.
 const make={
  rain(fresh){const vy=rnd(1050,1450);return {x:rnd(-40,w+h*SLANT),y:fresh?rnd(-h*.4,-20):rnd(-h*.2,h),len:rnd(50,110),vy,vx:-vy*SLANT,width:rnd(.8,1.3),alpha:rnd(.22,.42)};},
  snow(fresh){return {x:rnd(-10,w+10),y:fresh?rnd(-40,-6):rnd(-20,h),r:rnd(1,2.4),vy:rnd(22,48),sway:rnd(0,Math.PI*2),swayAmp:rnd(8,20),swaySpeed:rnd(.5,1.2),alpha:rnd(.45,.9)};},
  petals(fresh){return {x:rnd(-30,w+30),y:fresh?rnd(-60,-10):rnd(-h*.2,h),len:rnd(6,9.5),a:rnd(0,Math.PI*2),spin:rnd(-1.4,1.4),flip:rnd(0,Math.PI*2),flipSpeed:rnd(2,4.2),vx:rnd(-18,10),vy:rnd(34,62),sway:rnd(0,Math.PI*2),swayAmp:rnd(10,26),swaySpeed:rnd(.6,1.4),tint:random()<.6?'#f9c6da':'#fde6ef',alpha:rnd(.55,.85)};},
 };
 const gone={
  rain:d=>d.y-d.len>h||d.x<-60,
  snow:s=>s.y-s.r>h,
  petals:p=>p.y>h+20||p.x<-50||p.x>w+50,
 };
 function move(kind,p,dt){
  if(kind==='rain'){p.y+=p.vy*dt;p.x+=p.vx*dt;}
  else if(kind==='snow'){p.sway+=p.swaySpeed*dt;p.x+=Math.cos(p.sway)*p.swayAmp*dt;p.y+=p.vy*dt;}
  else{p.sway+=p.swaySpeed*dt;p.flip+=p.flipSpeed*dt;p.x+=(p.vx+Math.cos(p.sway)*p.swayAmp)*dt;p.y+=p.vy*dt;p.a+=p.spin*dt;}
 }
 function drawPetal(p){
  const L=p.len,W=L*.62*Math.max(.18,Math.abs(Math.cos(p.flip)));
  ctx.save();ctx.translate(p.x,p.y);ctx.rotate(p.a);ctx.globalAlpha=p.alpha;ctx.fillStyle=p.tint;
  ctx.beginPath();ctx.moveTo(0,L*.5);
  ctx.bezierCurveTo(W*.55,L*.28,W*.55,-L*.32,W*.22,-L*.5);ctx.lineTo(0,-L*.42);ctx.lineTo(-W*.22,-L*.5);
  ctx.bezierCurveTo(-W*.55,-L*.32,-W*.55,L*.28,0,L*.5);ctx.fill();ctx.restore();
 }
 function step(dt){
  const target=weatherTargets(modeOf(),w,h);
  for(const kind of Object.keys(lists)){
   const list=lists[kind];
   // Move; a particle that leaves the screen is replaced only while the
   // weather still wants that many of its kind.
   for(let i=list.length-1;i>=0;i--){const p=list[i];move(kind,p,dt);if(gone[kind](p)){if(list.length>target[kind])list.splice(i,1);else Object.assign(p,make[kind](true));}}
   // New weather drifts in over about two seconds.
   if(list.length<target[kind]){spawnDebt[kind]+=dt*target[kind]/2;while(spawnDebt[kind]>=1&&list.length<target[kind]){list.push(make[kind](true));spawnDebt[kind]-=1;}}
   else spawnDebt[kind]=0;
  }
 }
 function draw(){
  ctx.clearRect(0,0,w,h);ctx.lineCap='butt';
  for(const d of lists.rain){const dx=d.len*SLANT;ctx.strokeStyle=`rgba(206,218,248,${d.alpha})`;ctx.lineWidth=d.width;ctx.beginPath();ctx.moveTo(d.x+dx,d.y-d.len);ctx.lineTo(d.x,d.y);ctx.stroke();}
  for(const s of lists.snow){ctx.globalAlpha=s.alpha;ctx.fillStyle='#eef3ff';ctx.beginPath();ctx.arc(s.x,s.y,s.r,0,Math.PI*2);ctx.fill();}
  ctx.globalAlpha=1;
  for(const p of lists.petals)drawPetal(p);
 }
 const idle=()=>Object.values(weatherTargets(modeOf(),w||1,h||1)).every(v=>v===0)&&Object.values(lists).every(l=>l.length===0);
 function loop(now){
  if(!running)return;
  const dt=Math.min(.05,last?(now-last)/1000:0);last=now;step(dt);draw();
  if(idle()){stop();return;}
  frame=raf(loop);
 }
 function start(){
  if(running||!ctx)return;running=true;resize();last=0;
  // Opening the page mid-weather: the screen is already full.
  if(Object.values(lists).every(l=>l.length===0)){const t=weatherTargets(modeOf(),w,h);for(const kind of Object.keys(lists))lists[kind]=Array.from({length:t[kind]},()=>make[kind](false));}
  frame=raf(loop);
 }
 function stop(clear=false){if(running){running=false;caf(frame);frame=0;}if(clear)for(const kind of Object.keys(lists))lists[kind]=[];ctx?.clearRect(0,0,w,h);}
 // Called whenever the weather, the map or the motion setting may have changed.
 function refresh(){if(!isEnabled()){stop(true);return;}if(!running&&!idle())start();}
 const observer=globalThis.ResizeObserver?new ResizeObserver(()=>{if(running)resize();}):null;observer?.observe(canvas);
 return {refresh,stop,resize,get running(){return running;},get counts(){return {rain:lists.rain.length,snow:lists.snow.length,petals:lists.petals.length};}};
}
