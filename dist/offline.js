import {economy,MAX_VALUE,prestigeBonuses} from './data.js?v=3.0.9';
export const OFFLINE_FULL_SECONDS=1800;
export const OFFLINE_DECAY_SECONDS=600;
// Prestige DORMANT nodes extend the full-rate window, slow the decay and
// multiply the snapshot rate. The window and decay used for a settlement are
// the ones stored at departure, so a purchase while away cannot re-settle.
export function offlineParams(state){const b=prestigeBonuses(state);return {full:OFFLINE_FULL_SECONDS+b.offlineFull,decay:OFFLINE_DECAY_SECONDS+b.offlineDecay,rateMul:b.offlineRate};}
export function offlineEfficiency(seconds,full=OFFLINE_FULL_SECONDS,decay=OFFLINE_DECAY_SECONDS){return seconds<=full?1:Math.exp(-(seconds-full)/decay);}
export function effectiveOfflineSeconds(seconds,full=OFFLINE_FULL_SECONDS,decay=OFFLINE_DECAY_SECONDS){const t=Math.max(0,Number.isFinite(seconds)?seconds:0);return Math.min(t,full)+decay*-Math.expm1(-Math.max(0,t-full)/decay);}
export function productionSnapshot(state){const e=economy(state),p=offlineParams(state);return Math.min(MAX_VALUE,e.rate*(1+e.burst/e.interval)*p.rateMul);}
export function checkpointOffline(state,now=Date.now()){
 const e=economy(state),p=offlineParams(state);state.offline={since:now,through:now,rate:productionSnapshot(state),coinRate:Math.min(MAX_VALUE,e.coinRate*(1+e.coinBurst/e.interval)*p.rateMul),full:p.full,decay:p.decay};
}
export function settleOffline(state,now=Date.now()){
 const o=state.offline;
 if(!o||!Number.isFinite(now)||now<=o.through)return {elapsed:0,effectiveSeconds:0,amount:0,coin:0,efficiency:1};
 const a=Math.max(0,(o.through-o.since)/1000),b=Math.max(a,(now-o.since)/1000);
 // Integrate only the unsettled interval. The tail retains its original origin
 // even when the same absence is settled in multiple chunks.
 const FULL=Number.isFinite(o.full)&&o.full>0?o.full:OFFLINE_FULL_SECONDS,DECAY=Number.isFinite(o.decay)&&o.decay>0?o.decay:OFFLINE_DECAY_SECONDS;
 const full=Math.max(0,Math.min(b,FULL)-Math.min(a,FULL));
 const tailStart=Math.max(a,FULL);
 const tail=b>tailStart?DECAY*Math.exp(-(tailStart-FULL)/DECAY)*-Math.expm1(-(b-tailStart)/DECAY):0;
 const effectiveSeconds=full+tail,amount=Math.min(MAX_VALUE,Math.max(0,o.rate*effectiveSeconds));
 const coin=Math.min(MAX_VALUE,Math.max(0,(o.coinRate||0)*effectiveSeconds));
 state.currencies.money=Math.min(MAX_VALUE,state.currencies.money+amount);
 state.stats.earned=Math.min(MAX_VALUE,state.stats.earned+amount);
 state.stats.offlineEarned=Math.min(MAX_VALUE,state.stats.offlineEarned+amount);
 state.currencies.coin=Math.min(MAX_VALUE,state.currencies.coin+coin);
 state.stats.coinEarned=Math.min(MAX_VALUE,state.stats.coinEarned+coin);
 state.stats.offlineCoinEarned=Math.min(MAX_VALUE,state.stats.offlineCoinEarned+coin);
 state.stats.offlineSeconds+=b-a;state.stats.offlineEffectiveSeconds+=effectiveSeconds;
 o.through=now;
 return {elapsed:b-a,effectiveSeconds,amount,coin,efficiency:offlineEfficiency(b,FULL,DECAY)};
}
