import assert from 'node:assert/strict';
import {simulate} from './scripts/balance-v2.mjs';
import {NODES} from './dist/data.js';
// 4.0 stage 1: island 1 borrows the 3.x prices of studies 1–30, so this only
// checks that the island can be played through. Balance targets (and price
// authoring with --author) return when the 4.0 content is written.
const results=[];
for(const options of [{cadence:3},{cadence:5},{cadence:10,strategy:'frontier'}]){
 const r=simulate(options);assert(!r.failed,'Island 1 can be completed');assert.equal(r.purchases,NODES.reduce((a,n)=>a+n.max,0));assert(r.coinAt!==null);assert(r.gates.length===1);
 results.push({...options,minutes:r.minutes,coinAt:r.coinAt,gateAt:r.gates[0].min,completionMoney:r.finalBalance.money,maxWait:r.maxGap});
}
console.log(JSON.stringify({balance:'island 1 playable',results}));
