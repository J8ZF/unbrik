import assert from 'node:assert/strict';
import {simulate,authorPrices} from './scripts/balance-v2.mjs';
import {PRICES} from './dist/prices.js';
const results=[];
for(const options of [{cadence:3},{cadence:5},{cadence:10,strategy:'frontier'}]){
 const r=simulate(options);assert(!r.failed);assert(r.minutes>=105&&r.minutes<=140);assert(r.purchases===316);assert(r.coinAt>=8&&r.coinAt<=13);assert(r.completed[0]<r.entries[2]);assert(r.entryBalances[7].money>=1e27&&r.entryBalances[7].money<1e30);assert(r.finalBalance.money>=1e33&&r.finalBalance.money<1e36);assert(r.maxGap<=100);
 results.push({...options,minutes:r.minutes,coinAt:r.coinAt,sector8Money:r.entryBalances[7].money,completionMoney:r.finalBalance.money,maxWait:r.maxGap});
}
assert.deepEqual(authorPrices(),PRICES,'Authoring is deterministic and matches the deployed fixed price table');
console.log(JSON.stringify({balance:'passed',results}));
