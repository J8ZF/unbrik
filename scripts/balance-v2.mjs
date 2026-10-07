import fs from 'node:fs';
import {pathToFileURL} from 'node:url';
import {NODES,defaultState,economy,level,unlocked,cost,purchase,tick,normalizedCost,affordable,sectorProgress} from '../dist/data.js';
export function authorPrices(waitScale=1.075){
 const reference=defaultState(),events=[],waits=[3.6,9,17,24,29,35,40,44];
 for(const n of NODES){const own=NODES.filter(x=>x.chapter===n.chapter),next=NODES.filter(x=>x.chapter===Math.min(7,n.chapter+1)),position=own.indexOf(n)/(own.length-1);
  const end=n.longTerm?(n.id===41?102.8:104.2):Math.max(n.id+.1,Math.min(104.6,next[0].id+(next.length-1)*(.15+.6*position)));
  for(let l=0;l<n.max;l++)events.push({n,l,at:l?n.id+(end-n.id)*l/(n.max-1):n.id});n.costs=[];
 }
 events.sort((a,b)=>a.at-b.at||a.n.id-b.n.id);
 for(const {n,l,at}of events){
  const ch=NODES[Math.min(104,Math.max(0,Math.floor(at)-1))].chapter,wait=n.id===1?10:waits[ch]*(n.max===1?1.25:1)*waitScale;
  let e=economy(reference);
  for(const k of ['money','coin'])reference.currencies[k]=e.rates[k]*(1+e.bursts[k]/e.interval)*wait*.5;
  e=economy(reference);const prices={};
  for(const k of n.payment){let raw=e.rates[k]*(1+e.bursts[k]/e.interval)*wait/(e.discounts[k]*e.scalings[k]**l);raw=Math.max(1,raw,l?n.costs[l-1][k]*1.08:0);prices[k]=Number(raw.toPrecision(4));}
  n.costs[l]=prices;n.baseCost=n.costs[0];reference.levels[n.id]=l+1;
 }
 return Object.fromEntries(NODES.map(n=>[n.id,n.costs]));
}
export function simulate({cadence=3,strategy='cost',maxSeconds=22000}={}){
 const s=defaultState(),entries=Array(8).fill(null),completed=Array(8).fill(null),entryBalances=Array(8).fill(null),gates=[],history=[];
 let lastPurchase=0,maxGap=0,coinAt=null,allAt=null,lastBalances={};
 for(let t=1;t<=maxSeconds;t++){
  tick(s,1);if(t%cadence)continue;
  const e=economy(s),eligible=NODES.filter(n=>unlocked(s,n)&&level(s,n)<n.max&&affordable(s,n,e));
  eligible.sort((a,b)=>strategy==='frontier'?((level(s,a)>0)-(level(s,b)>0))||normalizedCost(s,a,e)-normalizedCost(s,b,e):normalizedCost(s,a,e)-normalizedCost(s,b,e));
  const n=eligible[0];if(!n)continue;
  lastBalances={...s.currencies};if(entries[n.chapter]===null){entries[n.chapter]=t/60;entryBalances[n.chapter]={...s.currencies};}
  if(!purchase(s,n))throw Error('Candidate was not purchasable');
  if(n.id===22)coinAt=t/60;if(n.gate&&level(s,n)===1)gates.push({id:n.id,min:t/60,money:lastBalances.money});
  history.push({t,id:n.id,level:level(s,n),money:lastBalances.money,coin:lastBalances.coin,rate:e.rate,coinRate:e.coinRate});
  maxGap=Math.max(maxGap,t-lastPurchase);lastPurchase=t;
  for(let i=0;i<8;i++)if(completed[i]===null&&sectorProgress(s,i).complete)completed[i]=t/60;
  if(economy(s).count===105&&allAt===null)allAt=t/60;
  if(completed.every(x=>x!==null))return {minutes:t/60,allAt,coinAt,entries,completed,entryBalances,gates,maxGap,finalBalance:lastBalances,finalRate:economy(s).rates,purchases:s.stats.purchases,history};
 }
 return {failed:true,minutes:maxSeconds/60,entries,completed,coinAt,purchases:s.stats.purchases,last:history.at(-1)};
}
if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href){
 if(process.argv.includes('--author')){const prices=authorPrices(Number(process.env.WAIT_SCALE||1.075));fs.writeFileSync('dist/prices.js','// Fixed costs, generated offline by scripts/balance-v2.mjs. Never repriced at runtime.\nexport const PRICES='+JSON.stringify(prices)+';\n');}
 const report=simulate({cadence:Number(process.env.CADENCE||3),strategy:process.env.STRATEGY||'cost'});const {history,...summary}=report;console.log(JSON.stringify(summary));
 if(process.argv.includes('--report'))fs.writeFileSync('scripts/balance-report.json',JSON.stringify(report,null,2)+'\n');
}
