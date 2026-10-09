import assert from 'node:assert/strict';
import {simulate} from './scripts/balance-v2.mjs';
import {NODES,ISLANDS,defaultState,choiceTaken} from './dist/data.js';
// 4.0: the islands borrow 3.x prices, so this only checks that every island can
// be played through in order. Balance targets (and price authoring with
// --author) return when the 4.0 content is written.
const results=[];
for(const options of [{cadence:3},{cadence:5},{cadence:10,strategy:'frontier'}]){
 const r=simulate({...options,maxSeconds:80000});assert(!r.failed,'Every island can be completed');
 // every level but the untaken side of each A/B pair
 const closed=NODES.filter(n=>n.choice&&!r.history.some(h=>h.id===n.id));assert.equal(closed.length,NODES.filter(n=>n.choice).length/2);
 assert.equal(r.purchases,NODES.reduce((a,n)=>a+n.max,0)-closed.reduce((a,n)=>a+n.max,0));assert(r.coinAt!==null);assert.equal(r.gates.length,ISLANDS.length);
 for(let i=1;i<r.gates.length;i++)assert(r.gates[i].min>r.gates[i-1].min,'Islands open in order');
 results.push({...options,minutes:r.minutes,coinAt:r.coinAt,gatesAt:r.gates.map(g=>+g.min.toFixed(1)),completionMoney:r.finalBalance.money,maxWait:r.maxGap});
}
console.log(JSON.stringify({balance:'islands playable in order (borrowed prices)',results}));
