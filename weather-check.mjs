import assert from 'node:assert/strict';
import {createWeatherFx,weatherTargets} from './dist/weather.js';

// Screen weather follows the game weather on both maps.
const W=412,H=530;
const t=(mode)=>weatherTargets(mode,W,H);
assert.deepEqual(t('none'),{rain:0,snow:0,petals:0},'Clear weather draws nothing');
assert(t('rain-heavy').rain>0&&t('rain-heavy').snow===0&&t('rain-heavy').petals===0,'Prestige rain is rain only');
assert(t('rain-light').rain>0&&t('rain-light').snow===0&&t('rain-light').petals===0,'AXIOM rain is rain only');
assert(t('rain-light').rain*3<=t('rain-heavy').rain,'AXIOM rain is much lighter than prestige rain');
assert(t('snow').snow>0&&t('snow').rain===0&&t('snow').petals===0,'AXIOM snow is snow only');
assert(t('petals').petals>0&&t('petals').snow===0&&t('petals').rain===0,'Prestige snow falls as flowers, not snow');

// The effect itself: a fake canvas and a hand-driven frame clock.
function harness(){
 const calls=[];let queued=null,now=0;
 const ctx=new Proxy({},{get:(o,k)=>k in o?o[k]:(...a)=>calls.push(k),set:(o,k,v)=>{o[k]=v;return true;}});
 const canvas={getContext:()=>ctx,getBoundingClientRect:()=>({width:W,height:H}),width:0,height:0};
 const env={enabled:true,mode:'none'};
 const fx=createWeatherFx(canvas,()=>env.enabled,()=>env.mode,{raf:fn=>{queued=fn;return 1;},caf:()=>{queued=null;},random:Math.random});
 const run=(seconds)=>{for(let i=0;i<seconds*60&&queued;i++){const fn=queued;queued=null;now+=1000/60;fn(now);}};
 return {fx,env,run,get queued(){return !!queued;}};
}
const h=harness();
h.fx.refresh();assert(!h.fx.running,'Nothing runs in clear weather');
h.env.mode='rain-light';h.fx.refresh();assert(h.fx.running);assert.equal(h.fx.counts.rain,t('rain-light').rain,'Opening mid-rain fills the screen at once');
h.env.mode='snow';h.run(4);
assert.equal(h.fx.counts.rain,0,'Old rain finishes its fall and is not replaced');
assert.equal(h.fx.counts.snow,t('snow').snow,'Snow drifts in to its full amount');
h.env.mode='none';h.run(40);
assert.equal(h.fx.counts.snow,0);assert(!h.fx.running,'The loop stops once the sky is clear');
h.env.mode='petals';h.fx.refresh();h.run(3);assert.equal(h.fx.counts.petals,t('petals').petals);assert.equal(h.fx.counts.snow,0);
h.env.enabled=false;h.fx.refresh();assert(!h.fx.running,'Motion off or a hidden page stops the effect');assert.deepEqual(h.fx.counts,{rain:0,snow:0,petals:0});
h.env.enabled=true;h.env.mode='rain-heavy';h.fx.refresh();assert.equal(h.fx.counts.rain,t('rain-heavy').rain);
console.log(JSON.stringify({weatherModes:6,axiomRain:t('rain-light').rain,prestigeRain:t('rain-heavy').rain,axiomSnow:t('snow').snow,prestigeFlowers:t('petals').petals,transitions:'passed',idleStop:'passed'}));
