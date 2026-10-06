import assert from 'node:assert/strict';
import {NODES,defaultState,economy,unlocked,level,cost,purchase,tick,validateSave} from './dist/data.js';
export function simulate({cadence=5,policy='cheapest',auto=false}={}){
 const s=defaultState();let seconds=0,last=0,maxGap=0;
 const gates=[],maxes=[];
 while(economy(s).count<80&&seconds<3600*5){
 tick(s,1);seconds++;
 if(auto&&economy(s).auto)s.settings.auto=true;
 if(seconds%cadence)continue;
 const e=economy(s),eligible=NODES.filter(n=>unlocked(s,n)&&level(s,n)<n.max);
 let n=eligible.sort((a,b)=>cost(s,a,e)-cost(s,b,e))[0];
 if(policy==='new-first')n=eligible.find(x=>!level(s,x)&&cost(s,x,e)<=s.currencies.money)||n;
 if(!n||!purchase(s,n))continue;
 maxGap=Math.max(maxGap,seconds-last);last=seconds;
 if(n.gate)gates.push({id:n.id,minutes:+(seconds/60).toFixed(1),levels:{...s.levels}});
 if(n.max>1&&level(s,n)===n.max)maxes.push({id:n.id,region:Math.max(...NODES.filter(x=>level(s,x)).map(x=>x.chapter))+1,minutes:+(seconds/60).toFixed(1)});
 }
 return {state:s,minutes:+(seconds/60).toFixed(1),maxGap,unique:economy(s).count,gates,maxes};
}
for(const n of NODES){
 assert.equal(n.costs.length,n.max);
 for(let l=0;l<n.max;l++){assert(Number.isFinite(n.costs[l])&&n.costs[l]>0);if(l)assert(n.costs[l]>n.costs[l-1]);}
}
assert.equal(NODES[0].baseCost,10);
assert(NODES[3].baseCost<500,'First convergence must remain an early purchase');
const baseline=simulate();
assert.equal(baseline.unique,80);assert(baseline.minutes>=120&&baseline.minutes<=180);
assert(baseline.gates[0].minutes<=3);assert(baseline.gates[2].minutes<=20);
assert(baseline.gates[0].levels[2]<10&&baseline.gates[0].levels[3]<8,'Region one must not require near-MAX repeats');
assert(baseline.gates[1].levels[2]<20&&baseline.gates[1].levels[3]<15,'First-region repeats must survive region two');
for(const id of [2,3])assert.equal(baseline.maxes.find(m=>m.id===id).region,3);
for(const id of [6,7,12])assert.equal(baseline.maxes.find(m=>m.id===id).region,4);
for(const id of [16,19])assert.equal(baseline.maxes.find(m=>m.id===id).region,5);
assert(baseline.maxGap<=120,'No long idle wall on the baseline path');
// A late additive level remains useful after reaching a stronger additive node.
const crossover=defaultState();crossover.levels={...baseline.gates[1].levels,16:1};
const before=economy(crossover).rate;crossover.levels[2]++;assert(economy(crossover).rate/before>=1.05);
// Save schema 1 is deliberately retained: no lost money, levels or play time.
const legacy=defaultState();legacy.contentVersion=1;legacy.currencies.money=174321;legacy.levels={1:1,2:13,3:7};legacy.stats={earned:234321,spent:60000,purchases:21,seconds:520,peak:1600};legacy.settings.format='scientific';legacy.timers.cache=12;legacy.camera={x:130,y:-300,scale:.6};
const restored=validateSave(JSON.parse(JSON.stringify(legacy)));
for(const key of ['currencies','levels','stats','settings','timers','camera'])assert.deepEqual(restored[key],legacy[key]);assert.equal(restored.contentVersion,2);
const outputs=[];
for(const options of [{cadence:3},{cadence:5},{cadence:10},{cadence:5,policy:'new-first'},{cadence:5,auto:true}]){
 const r=options.cadence===5&&!options.policy&&!options.auto?baseline:simulate(options);
 assert.equal(r.unique,80);assert(r.minutes>=120&&r.minutes<=180,JSON.stringify({options,minutes:r.minutes}));
 outputs.push({...options,minutes:r.minutes,purchases:r.state.stats.purchases,maxWaitSeconds:r.maxGap,regionCompletions:r.gates.map(g=>g.minutes),earlyRepeatMax:r.maxes.filter(m=>[2,3,6,7,12].includes(m.id))});
}
console.log(JSON.stringify({version:'1.1.0',checks:'passed',accumulator:NODES[3].baseCost,simulations:outputs},null,2));
