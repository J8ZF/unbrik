import {economy,MAX_VALUE} from './data.js?v=2.0-mobile';
export const OFFLINE_FULL_SECONDS=1800;
export const OFFLINE_DECAY_SECONDS=600;
export function offlineEfficiency(seconds){return seconds<=OFFLINE_FULL_SECONDS?1:Math.exp(-(seconds-OFFLINE_FULL_SECONDS)/OFFLINE_DECAY_SECONDS);}
export function effectiveOfflineSeconds(seconds){const t=Math.max(0,Number.isFinite(seconds)?seconds:0);return Math.min(t,OFFLINE_FULL_SECONDS)+OFFLINE_DECAY_SECONDS*-Math.expm1(-Math.max(0,t-OFFLINE_FULL_SECONDS)/OFFLINE_DECAY_SECONDS);}
export function productionSnapshot(state){const e=economy(state);return Math.min(MAX_VALUE,e.rate*(1+e.burst/e.interval));}
export function checkpointOffline(state,now=Date.now()){
 const e=economy(state);state.offline={since:now,through:now,rate:productionSnapshot(state),coinRate:Math.min(MAX_VALUE,e.coinRate*(1+e.coinBurst/e.interval))};
}
export function settleOffline(state,now=Date.now()){
 const o=state.offline;
 if(!o||!Number.isFinite(now)||now<=o.through)return {elapsed:0,effectiveSeconds:0,amount:0,coin:0,efficiency:1};
 const a=Math.max(0,(o.through-o.since)/1000),b=Math.max(a,(now-o.since)/1000);
 // Integrate only the unsettled interval. The tail retains its original origin
 // even when the same absence is settled in multiple chunks.
 const full=Math.max(0,Math.min(b,OFFLINE_FULL_SECONDS)-Math.min(a,OFFLINE_FULL_SECONDS));
 const tailStart=Math.max(a,OFFLINE_FULL_SECONDS);
 const tail=b>tailStart?OFFLINE_DECAY_SECONDS*Math.exp(-(tailStart-OFFLINE_FULL_SECONDS)/OFFLINE_DECAY_SECONDS)*-Math.expm1(-(b-tailStart)/OFFLINE_DECAY_SECONDS):0;
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
 return {elapsed:b-a,effectiveSeconds,amount,coin,efficiency:offlineEfficiency(b)};
}
