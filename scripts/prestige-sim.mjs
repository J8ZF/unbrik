// Pacing of the prestige loop: repeated runs through the mainland with the
// balance simulation's purchase policy, prestiging once the balance clears the
// threshold and the tokens cover the next prestige purchases, then buying the
// cheapest affordable prestige nodes. Reports total time to max every
// purchasable prestige node. Usage: node scripts/prestige-sim.mjs [cadence]
import {NODES,defaultState,economy,level,unlocked,cost,purchase,tick,normalizedCost,affordable,treeComplete,prestigeReady,prestige,tokensFor,PRESTIGE_THRESHOLD,autoResearch,prestigeBonuses} from '../dist/data.js';
import {PRESTIGE_NODES,prestigeLevel,prestigeUnlocked,prestigeCost,prestigeAffordable,prestigePurchase} from '../dist/prestige.js';
export function simulatePrestige({cadence=5,maxMinutes=900,maxWaitMinutes=15,log=false}={}){
 const s=defaultState();let t=0;const runs=[];let runStart=0;
 const purchasable=PRESTIGE_NODES.filter(n=>!n.reserved),totalLevels=purchasable.reduce((a,n)=>a+n.max,0);
 const prestigeDone=()=>purchasable.every(n=>prestigeLevel(s,n)>=n.max);
 const nextPrestigeTargets=()=>purchasable.filter(n=>prestigeUnlocked(s,n)&&prestigeLevel(s,n)<n.max).map(n=>prestigeCost(s,n).token).sort((a,b)=>a-b).slice(0,2).reduce((a,b)=>a+b,0);
 let completedAt=null;
 while(t<maxMinutes*60){
  t++;tick(s,1);
  if(t%cadence&&!(treeComplete(s)===false&&prestigeBonuses(s).auto.size&&t%1===0))continue;
  if(!treeComplete(s)){
   // Automation (AUTOPILOT petals) buys up to six studies per second in its
   // sectors; the player buys one study per cadence elsewhere.
   const auto=prestigeBonuses(s).auto;
   for(const c of auto)s.prestige.auto[c]=true;
   const autoBought=autoResearch(s,6);
   const e=economy(s),eligible=NODES.filter(n=>!auto.has(n.chapter)&&unlocked(s,n)&&level(s,n)<n.max&&affordable(s,n,e)).sort((a,b)=>normalizedCost(s,a,e)-normalizedCost(s,b,e));
   if(eligible[0])purchase(s,eligible[0]);
   if(treeComplete(s))completedAt=t;
   continue;
  }
  if(prestigeDone())return {minutes:t/60,runs,totalLevels,done:true};
  // Wait for the threshold, then for enough tokens for the next two purchases,
  // but never longer than maxWaitMinutes after completion.
  const waited=(t-completedAt)/60,need=Math.max(10,nextPrestigeTargets());
  if(!prestigeReady(s))continue;
  const e=economy(s),incomePerMinute=(e.rate*(1+e.burst/e.interval))*60,now=tokensFor(s),later=tokensFor(s,s.currencies.money+incomePerMinute*5);
  const runEstimate=runs.length?runs.at(-1).minutes:120,marginal=(later-now)/5,restartRate=now/Math.max(20,runEstimate*.8);
  const remaining=purchasable.reduce((a,n)=>a+n.cost.slice(prestigeLevel(s,n)).reduce((x,y)=>x+y,0),0);
  if(now<need)continue;
  if(now+s.currencies.token<remaining&&marginal>restartRate&&waited<maxWaitMinutes)continue;
  const tokens=prestige(s);
  const run={run:runs.length+1,minutes:(t-runStart)/60,waited:+waited.toFixed(1),tokens,money:s.prestige.last.money,bought:[]};
  // Spend: cheapest affordable unlocked node first, repeatedly.
  for(;;){const e=purchasable.filter(n=>prestigeUnlocked(s,n)&&prestigeLevel(s,n)<n.max&&prestigeAffordable(s,n)).sort((a,b)=>prestigeCost(s,a).token-prestigeCost(s,b).token);if(!e[0])break;prestigePurchase(s,e[0]);run.bought.push(e[0].name+(e[0].max>1?' L'+prestigeLevel(s,e[0]):''));}
  run.tokensLeft=s.currencies.token;runs.push(run);runStart=t;completedAt=null;s.map='main';
  if(log)console.log(JSON.stringify(run));
 }
 return {minutes:t/60,runs,totalLevels,done:false,owned:purchasable.reduce((a,n)=>a+prestigeLevel(s,n),0)};
}
if(process.argv[1]&&import.meta.url.endsWith(process.argv[1].replace(/^.*\//,''))){
 const r=simulatePrestige({cadence:Number(process.argv[2]||5),log:true});
 console.log(JSON.stringify({minutes:+r.minutes.toFixed(1),hours:+(r.minutes/60).toFixed(2),runs:r.runs.length,done:r.done,owned:r.owned,totalLevels:r.totalLevels,threshold:PRESTIGE_THRESHOLD}));
}
