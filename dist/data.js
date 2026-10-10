import {CENTER} from './layout.js?v=4.0.0-dev.1';
import {RESEARCH} from './research.js?v=4.0.0-dev.1';
import {ISLANDS,ISLAND_NODES} from './islands.js?v=4.0.0-dev.1';
import {PRICES} from './prices.js?v=4.0.0-dev.1';
import {Big,ZERO,ONE} from './big.js?v=4.0.0-dev.1';
import {PRESTIGE_NODES,prestigeById,prestigeBonuses,tokensFor,PRESTIGE_THRESHOLD,prestigeLevel} from './prestige.js?v=4.0.0-dev.1';
export {PRESTIGE_NODES,prestigeById,prestigeBonuses,tokensFor,PRESTIGE_THRESHOLD,Big,ISLANDS};
// 4.0: AXIOM is a sea of islands. The engine's "sectors" are the islands, in
// order; only the islands that have studies yet are listed.
export const CHAPTERS=ISLANDS.map(i=>({name:i.name,ko:i.name,color:i.color||'#b9f36d',island:i.id}));
// A bought card takes the colour of the ground it stands on, in its island's tones.
export const ZONE_COLORS={grass:'#b9f36d',sand:'#ecd29a',rock:'#93a9be'};
export const zoneColor=n=>(ISLANDS[n.chapter]?.zones||ZONE_COLORS)[n.zone]||ZONE_COLORS[n.zone];
// An island is open once the island before it is finished (its last study bought).
export const islandOpen=(s,chapter)=>chapter===0||level(s,ISLANDS[chapter-1].last)>0;
export const ECONOMY_EPOCH='unbrik-4.0';
export const CURRENCIES=['money','coin'];
// Amounts (balances, rates, costs, earnings) are Big values with no upper
// limit; see big.js. A plain number found in state is read as a Big.
const amount=v=>Big.from(v||0);
export const BIG_STATS=['earned','spent','coinEarned','coinSpent','peak','coinPeak','offlineEarned','offlineCoinEarned'];
// Currency registry for the header. Up to eight are planned; the ledger pages
// show four per page. `shown` decides whether a currency appears at all.
export const CURRENCY_DEFS={
 money:{symbol:'$',name:'달러',color:'#b9f36d',shown:()=>true},
 coin:{symbol:'¢',name:'코인',color:'#d4ae68',shown:(s,e)=>e.coinUnlocked},
 token:{symbol:'✿',name:'환생 토큰',color:'#f7a8c4',shown:s=>(s.prestige?.count||0)>0||amount(s.currencies.token).gt(0)},
};
// Maps. The header's first page and the collapsed header show the currencies
// of the current map; a future prestige map lists its own token here.
export const MAPS=[
 {id:'main',name:'AXIOM',ko:'AXIOM',currencies:['money','coin'],theme:'engine'},
 {id:'prestige',name:'환생',ko:'환생',currencies:['token'],theme:'bloom',locked:s=>(s.prestige?.count||0)===0},
];
export const defaultPrestige=()=>({count:0,tokensEarned:ZERO,tokensSpent:ZERO,purchases:0,levels:{},auto:{},last:null,noticed:false});
export const treeComplete=s=>NODES.every(n=>choiceTaken(s,n)||level(s,n)>=n.max);
// 4.0: ready once study #105 (the last study of island 3) is bought and the
// balance clears the threshold. Until island 3 exists, the last placed study stands in.
export const PRESTIGE_GATE=Math.min(105,ISLANDS.at(-1).last);
export const prestigeGateMet=s=>byId.has(PRESTIGE_GATE)&&level(s,PRESTIGE_GATE)>0;
export const prestigeReady=s=>prestigeGateMet(s)&&amount(s.currencies.money).gte(PRESTIGE_THRESHOLD);
// Start over: studies, dollars and coins reset, tokens are granted, automation
// checks are cleared, lifetime statistics and settings stay. The world clock
// keeps running. Returns the tokens granted, or 0 when not ready.
export function prestige(s,now=Date.now()){
 if(!prestigeReady(s))return 0;
 const tokens=tokensFor(s);
 s.prestige=s.prestige||defaultPrestige();
 s.prestige.count++;s.prestige.tokensEarned=amount(s.prestige.tokensEarned).add(tokens).round(2);s.prestige.last={tokens,money:amount(s.currencies.money),at:now};s.prestige.auto={};s.prestige.noticed=false;
 s.currencies.token=amount(s.currencies.token).add(tokens).round(2);s.currencies.money=ZERO;s.currencies.coin=ZERO;
 s.levels={};s.timers.cache=0;s.camera=null;s.map='prestige';
 s.stats.prestigeRuns=(s.stats.prestigeRuns||0)+1;s.stats.lastRunSeconds=s.stats.seconds-(s.stats.runStart||0);s.stats.runStart=s.stats.seconds;
 s.offline={since:now,through:now,rate:economy(s).rate,coinRate:ZERO};
 return tokens;
}
// Automation: for each sector whose AUTOPILOT node is owned and whose check is
// on, buy the cheapest affordable unlocked study, up to `limit` purchases.
// Locked studies stay locked, so a sector cannot run ahead of its gate.
export function autoResearch(s,limit=6){
 const bought=[];if(!s.prestige)return bought;
 const auto=prestigeBonuses(s).auto;
 for(let i=0;i<limit;i++){
  const e=economy(s);
  const candidates=NODES.filter(n=>auto.has(n.chapter)&&s.prestige.auto[n.chapter]&&level(s,n)<n.max&&unlocked(s,n)&&affordable(s,n,e));
  if(!candidates.length)break;
  const n=candidates.sort((a,b)=>normalizedCost(s,a,e)-normalizedCost(s,b,e))[0];
  if(!purchase(s,n))break;bought.push(n);
 }
 return bought;
}
export const currentMap=s=>MAPS.find(m=>m.id===s.map)||MAPS[0];
// World clock. One game day is 24 minutes of play (one real minute per game
// hour); it does not follow wall-clock time. Dawn 05–07, day 07–17, dusk
// 17–19, night 19–05. Weather is rolled every 10 game-minutes of play:
// rain 20%, snow 10%, otherwise clear. Both are recorded for later systems
// and have no economic effect yet.
export const DAY_SECONDS=24*60,WEATHER_INTERVAL=600,START_HOUR=7;
export const PHASES=[{id:'dawn',ko:'새벽',from:5,to:7},{id:'day',ko:'낮',from:7,to:17},{id:'dusk',ko:'석양',from:17,to:19},{id:'night',ko:'밤',from:19,to:29}];
export const WEATHERS={clear:{ko:'맑음'},rain:{ko:'비'},snow:{ko:'눈'}};
export function rollWeather(random=Math.random()){return random<.2?'rain':random<.3?'snow':'clear';}
export function worldState(s){
 const seconds=s.world?.seconds||0,hours=(START_HOUR+seconds/60)%24,hour=Math.floor(hours),minute=Math.floor((hours-hour)*60);
 const phase=PHASES.find(p=>hours>=p.from&&hours<p.to)||PHASES.find(p=>(hours+24)>=p.from&&(hours+24)<p.to)||PHASES[3];
 const weather=WEATHERS[s.world?.weather]?s.world.weather:'clear';
 return {seconds,hour,minute,clock:`${String(hour).padStart(2,'0')}:${String(minute).padStart(2,'0')}`,phase:phase.id,phaseKo:phase.ko,weather,weatherKo:WEATHERS[weather].ko,day:Math.floor((START_HOUR*60+seconds)/DAY_SECONDS)+1};
}
// Each island study is a position on the island; until the 4.0 content list is
// written it borrows a 3.x study (name, icon, effects, prices) through `content`.
// Prerequisites come from the island design; `choice` groups make A/B studies.
const RESEARCH_BY_ID=new Map(RESEARCH.map(n=>[n.id,n]));
export const NODES=ISLAND_NODES.map(p=>{const r=RESEARCH_BY_ID.get(p.content),island=ISLANDS.findIndex(i=>i.id===p.island);
 const costs=PRICES[r.id]||Array.from({length:r.max},()=>Object.fromEntries(r.payment.map(k=>[k,10])));
 return {...r,id:p.id,content:r.id,chapter:island,island:p.island,zone:p.zone,x:p.x,y:p.y,effects:r.effects.map(e=>({...e})),costs,
  req:p.req.map(id=>typeof id==='number'?{id,level:1}:{id:id.id,level:id.level}),any:r.name==='OR GATE',choice:p.choice||null,
  gate:ISLANDS[island].last===p.id,currency:r.payment.length===1?r.payment[0]:'both',baseCost:costs[0]};});
export const byId=new Map(NODES.map(n=>[n.id,n]));
// Map frame: the islands plus the observatory and everything in orbit round it.
export const MAP_LAYOUT=(()=>{const b=ISLANDS.reduce((a,i)=>({minX:Math.min(a.minX,i.bounds.minX),minY:Math.min(a.minY,i.bounds.minY),maxX:Math.max(a.maxX,i.bounds.maxX),maxY:Math.max(a.maxY,i.bounds.maxY)}),{minX:CENTER.x-CENTER.reach,minY:CENTER.y-CENTER.reach,maxX:CENTER.x+CENTER.reach,maxY:CENTER.y+CENTER.reach});
 return {bounds:b,center:CENTER,sectors:ISLANDS.map((i,k)=>({chapter:k,island:i.id,members:NODES.filter(n=>n.chapter===k),label:{x:i.label[0],y:i.label[1],align:'left'},path:'',direction:{x:0,y:-1}}))};})();
// The study that unlocks coin (3.x BASIS).
export const COIN_UNLOCK=NODES.find(n=>n.effects.some(e=>e.type==='unlock'))?.id;
export const level=(s,n)=>s.levels[typeof n==='number'?n:n.id]||0;
// A study opens when its prerequisites reach their required levels (any one of
// them for OR GATE). In an A/B choice, owning one side closes the other until
// the next prestige resets both.
export const choiceTaken=(s,n)=>!!n.choice&&NODES.some(o=>o.choice===n.choice&&o.id!==n.id&&level(s,o)>0);
export function unlocked(s,n){if(choiceTaken(s,n))return false;return n.req.length===0||(n.any?n.req.some(r=>level(s,r.id)>=r.level):n.req.every(r=>level(s,r.id)>=r.level));}
// Completion counts every level; of an A/B pair only the chosen side counts once one is taken.
export function sectorProgress(s,chapter){const nodes=MAP_LAYOUT.sectors[chapter].members.filter(n=>!choiceTaken(s,n));const total=nodes.reduce((a,n)=>a+n.max,0),done=nodes.reduce((a,n)=>a+level(s,n),0);return {done,total,complete:done===total};}
export function defaultState(){const now=Date.now();return {version:2,economyEpoch:ECONOMY_EPOCH,contentVersion:5,layoutVersion:3,currencies:{money:ZERO,coin:ZERO,token:ZERO},levels:{},prestige:defaultPrestige(),stats:{earned:ZERO,spent:ZERO,coinEarned:ZERO,coinSpent:ZERO,purchases:0,seconds:0,peak:ONE,coinPeak:ZERO,offlineSeconds:0,offlineEarned:ZERO,offlineCoinEarned:ZERO,offlineEffectiveSeconds:0},timers:{cache:0},settings:{motion:true,sea:true,touch:true,haptic:true,format:'named',formatV2:true,purchaseCheat:false,mapControls:false,farView:true,noWordmark:false,hudCollapsed:false,panelCollapsed:false},camera:null,map:'main',world:{seconds:0,weather:'clear',weatherUntil:WEATHER_INTERVAL},offline:{since:now,through:now,rate:ONE,coinRate:ZERO},savedAt:now};}
export function economy(s){
 const owned=NODES.filter(n=>level(s,n)>0),count=owned.length,total=owned.reduce((a,n)=>a+level(s,n),0),coinUnlocked=COIN_UNLOCK!=null&&level(s,COIN_UNLOCK)>0;
 // Products that compound (mul, baseMul) are Big; the factors stay numbers.
 const v={money:{base:1,mul:ONE,baseMul:ONE,discount:1,scaling:1,cache:0,cacheMul:1},coin:{base:0,mul:ONE,baseMul:ONE,discount:1,scaling:1,cache:0,cacheMul:1}};
 let interval=30;
 const counts={money:owned.filter(n=>n.payment.includes('money')).length,coin:owned.filter(n=>n.payment.includes('coin')).length};
 const completed=CHAPTERS.filter((_,i)=>sectorProgress(s,i).complete).length,maxed=owned.filter(n=>n.max>1&&level(s,n)===n.max).length;
 for(const n of owned){const l=level(s,n);for(const e of n.effects){const a=v[e.currency],x=e.value;
  switch(e.type){
   case 'unlock':a.base+=x;break;
   case 'add':a.base+=x*l;break;
   case 'mul':case 'recursive':a.mul=a.mul.mul(x**l*(e.type==='recursive'?1+.08*l*l:1));break;
   case 'base':a.baseMul=a.baseMul.mul(x**l);break;
   case 'count':a.mul=a.mul.mul(1+(e.source?counts[e.source]:count)*x*l);break;
   case 'levels':a.mul=a.mul.mul(1+(e.source==='sector'?owned.filter(p=>p.chapter===n.chapter).reduce((a,p)=>a+level(s,p),0):total)*x*l);break;
   case 'balance':a.mul=a.mul.mul(1+x*l*Big.max(0,amount(s.currencies[e.source])).add(1).log10());break;
   case 'completed':a.mul=a.mul.mul(1+x*completed);break;
   case 'maxed':a.mul=a.mul.mul(1+x*maxed);break;
   case 'discount':a.discount*=x**l;break;
   case 'scaling':a.scaling*=x**l;break;
   case 'cache':a.cache+=x*l;break;
   case 'cacheMul':a.cacheMul*=x**l;break;
   case 'speed':if(e.currency==='money')interval*=x**l;break;
  }
 }}
 if(coinUnlocked)v.coin.cache+=3;
 const pb=prestigeBonuses(s);v.money.base+=pb.baseAdd;v.money.mul=v.money.mul.mul(pb.moneyMul*pb.allMul);v.coin.mul=v.coin.mul.mul(pb.coinMul*pb.allMul);v.money.cacheMul*=pb.cacheMul;v.coin.cacheMul*=pb.cacheMul;v.money.discount*=pb.discount;
 const rate=Big.from(v.money.base).mul(v.money.baseMul).mul(v.money.mul),coinRate=coinUnlocked?Big.from(v.coin.base).mul(v.coin.baseMul).mul(v.coin.mul):ZERO;
 const burst=v.money.cache*v.money.cacheMul,coinBurst=coinUnlocked?v.coin.cache*v.coin.cacheMul:0;
 return {rate,coinRate,rates:{money:rate,coin:coinRate},burst,coinBurst,bursts:{money:burst,coin:coinBurst},interval,coinUnlocked,count,total,discount:v.money.discount,scaling:v.money.scaling,discounts:{money:v.money.discount,coin:v.coin.discount},scalings:{money:v.money.scaling,coin:v.coin.scaling}};
}
export function cost(s,n,e=economy(s)){const l=level(s,n),raw=n.costs[Math.min(l,n.max-1)];return Object.fromEntries(n.payment.map(k=>[k,Big.from(Math.max(1,raw[k]*e.discounts[k]*e.scalings[k]**l))]));}
export function affordable(s,n,e=economy(s)){const p=cost(s,n,e);return s.settings.purchaseCheat||Object.entries(p).every(([k,x])=>amount(s.currencies[k]).add(x.mul(1e-12)).gte(x));}
// Production per second including the cache, used for waits and ordering.
const flow=(e,k)=>e.rates[k].mul(1+e.bursts[k]/e.interval);
// Seconds: Infinity while the currency is not produced.
export function waitTime(s,n,e=economy(s)){return Math.max(0,...Object.entries(cost(s,n,e)).map(([k,p])=>{const deficit=Big.max(0,p.sub(amount(s.currencies[k])));if(deficit.isZero())return 0;const f=flow(e,k);return f.isZero()?Infinity:deficit.div(f).toNumber();}));}
export function normalizedCost(s,n,e=economy(s)){return Math.max(...Object.entries(cost(s,n,e)).map(([k,p])=>{const f=flow(e,k);return f.isZero()?Infinity:p.div(f).toNumber();}));}
export function purchase(s,n){
 if(!n||!unlocked(s,n)||level(s,n)>=n.max)return false;
 const e=economy(s);if(!affordable(s,n,e))return false;
 const prices=cost(s,n,e);
 if(!s.settings.purchaseCheat)for(const [k,p]of Object.entries(prices)){s.currencies[k]=Big.max(0,amount(s.currencies[k]).sub(p));const stat=k==='money'?'spent':'coinSpent';s.stats[stat]=amount(s.stats[stat]).add(p);}
 s.levels[n.id]=level(s,n)+1;s.stats.purchases++;return true;
}
export function tick(s,dt){
 if(!Number.isFinite(dt)||dt<=0)return [];dt=Math.min(dt,5);
 const e=economy(s),events=[],gains={money:e.rate.mul(dt),coin:e.coinRate.mul(dt)};s.stats.seconds+=dt;
 if(!s.world)s.world={seconds:0,weather:'clear',weatherUntil:WEATHER_INTERVAL};
 s.world.seconds+=dt;while(s.world.seconds>=s.world.weatherUntil){const previous=s.world.weather;s.world.weather=rollWeather();s.world.weatherUntil+=WEATHER_INTERVAL;if(s.world.weather!==previous)events.push({type:'weather',weather:s.world.weather,previous});}
 if(e.burst||e.coinBurst){s.timers.cache+=dt;while(s.timers.cache>=e.interval){s.timers.cache-=e.interval;const money=e.rate.mul(e.burst),coin=e.coinRate.mul(e.coinBurst);gains.money=gains.money.add(money);gains.coin=gains.coin.add(coin);events.push({type:'cache',amount:money,money,coin});}}
 for(const k of CURRENCIES){const earned=k==='money'?'earned':'coinEarned',peak=k==='money'?'peak':'coinPeak';s.currencies[k]=amount(s.currencies[k]).add(gains[k]);s.stats[earned]=amount(s.stats[earned]).add(gains[k]);s.stats[peak]=Big.max(amount(s.stats[peak]),e.rates[k]);}
 return events;
}
export function effectText(n){return n.effects.map(e=>{
 const symbol=e.currency==='money'?'$':'¢',v=+e.value.toFixed(4),per=n.max>1?' / Lv.':'',source=e.source==='coin'?'¢':'$';
 switch(e.type){
 case 'unlock':return '코인 해금 · 기본 생산 1 ¢/s · 코인 캐시 3초분';
 case 'add':return `${symbol} 기본 생산 +${v} /s${per}`;
 case 'mul':return `${symbol} 생산 ×${v}${per}`;
 case 'base':return `${symbol} 기본 생산 합계 ×${v}${per}`;
 case 'count':return `${e.source?source+' 결제 ':''}연구마다 ${symbol} 생산 +${+(v*100).toFixed(2)}%${per}`;
 case 'levels':return `${e.source==='sector'?'이 섬':'총'} 연구 레벨마다 ${symbol} 생산 +${+(v*100).toFixed(2)}%${per}`;
 case 'balance':return `${symbol} 생산 ×(1 + ${v} × log₁₀(1 + 보유 ${source}))`;
 case 'completed':return `완료 섬마다 ${symbol} 생산 +${v*100}%`;
 case 'maxed':return `MAX 반복 연구마다 ${symbol} 생산 +${v*100}%`;
 case 'discount':return `${symbol} 연구 비용 −${+((1-v)*100).toFixed(2)}%${per}`;
 case 'scaling':return `${symbol} 반복 연구 비용 ×${v}^현재 Lv.${per}`;
 case 'cache':return `${symbol} 캐시 생산 ${v}초분 추가`;
 case 'cacheMul':return `${symbol} 캐시 지급량 ×${v}${per}`;
 case 'speed':return e.currency==='money'?`캐시 주기 −${Math.round((1-v)*100)}%`:'';
 case 'recursive':return `${symbol} 생산 ×(${v}^Lv × (1 + 0.08 × Lv²))`;
 }
}).filter(Boolean).join(' · ');}
export function copyPreferences(input){const s=defaultState();for(const k of ['motion','sea','touch','haptic','purchaseCheat','mapControls','farView','noWordmark','hudCollapsed','panelCollapsed'])if(typeof input?.settings?.[k]==='boolean')s.settings[k]=input.settings[k];if(['named','short','scientific','engineering'].includes(input?.settings?.format))s.settings.format=input.settings.format;if(input?.settings?.format==='short'&&input?.settings?.formatV2!==true)s.settings.format='named';return s;}
export function validateSave(input,now=Date.now()){
 if(!input||input.version!==2||input.economyEpoch!==ECONOMY_EPOCH)throw Error('4.0 이전 저장은 호환되지 않습니다.');
 // Amounts load from plain numbers (every save before 3.1, and 3.1 saves
 // below 1e300) or from strings such as "1.5e400".
 const s=copyPreferences(input),num=(v,max=Infinity)=>typeof v==='number'&&Number.isFinite(v)&&v>=0&&v<=max,big=v=>{const b=Big.parse(v);return b&&b.sign>=0?b:null;};
 if(!input.currencies||!CURRENCIES.every(k=>big(input.currencies[k]))||!input.levels||Array.isArray(input.levels)||typeof input.levels!=='object')throw Error('저장 데이터가 올바르지 않습니다.');
 s.currencies={money:big(input.currencies.money),coin:big(input.currencies.coin),token:big(input.currencies.token)?.round(2)||ZERO};
 const p=input.prestige;
 if(p&&typeof p==='object'){
  const pr=defaultPrestige();
  for(const k of ['count','purchases'])if(num(p[k])&&Number.isInteger(p[k]))pr[k]=p[k];
  for(const k of ['tokensEarned','tokensSpent'])if(big(p[k]))pr[k]=big(p[k]).round(2);
  if(p.levels&&typeof p.levels==='object'&&!Array.isArray(p.levels))for(const [key,value]of Object.entries(p.levels)){const n=prestigeById.get(Number(key));if(!n||String(n.id)!==key||!Number.isInteger(value)||value<0||value>n.max)throw Error('환생 연구 레벨이 올바르지 않습니다.');if(value)pr.levels[key]=value;}
  for(const n of PRESTIGE_NODES)if(prestigeLevel({prestige:pr},n)&&!n.req.every(r=>prestigeLevel({prestige:pr},r.id)>=r.level))throw Error('환생 선행 연구가 누락되었습니다.');
  if(p.auto&&typeof p.auto==='object')for(const [key,value]of Object.entries(p.auto))if(/^[0-7]$/.test(key)&&value===true)pr.auto[key]=true;
  if(p.noticed===true)pr.noticed=true;
  if(p.last&&typeof p.last==='object'&&big(p.last.tokens)&&big(p.last.money)&&num(p.last.at,now))pr.last={tokens:big(p.last.tokens),money:big(p.last.money),at:p.last.at};
  s.prestige=pr;
 }
 if(!s.prestige.count&&!s.currencies.token.isZero())throw Error('환생 전 토큰 데이터가 올바르지 않습니다.');
 for(const [key,value]of Object.entries(input.levels)){const n=byId.get(Number(key));if(!n||String(n.id)!==key||!Number.isInteger(value)||value<0||value>n.max)throw Error('연구 레벨이 올바르지 않습니다.');if(value)s.levels[key]=value;}
 for(const n of NODES)if(level(s,n)&&(choiceTaken(s,n)||!n.req.every(r=>level(s,r.id)>=r.level)&&!(n.any&&n.req.some(r=>level(s,r.id)>=r.level))))throw Error('선행 연구가 누락되었습니다.');
 if(!(COIN_UNLOCK!=null&&level(s,COIN_UNLOCK))&&!s.currencies.coin.isZero())throw Error('해금 전 코인 데이터가 올바르지 않습니다.');
 if(!input.stats||!Object.keys(s.stats).every(k=>BIG_STATS.includes(k)?big(input.stats[k]):num(input.stats[k])))throw Error('통계가 올바르지 않습니다.');
 for(const k of Object.keys(s.stats))s.stats[k]=BIG_STATS.includes(k)?big(input.stats[k]):input.stats[k];
 for(const k of ['prestigeRuns','lastRunSeconds','runStart'])if(num(input.stats[k]))s.stats[k]=input.stats[k];
 if(num(input.timers?.cache,30))s.timers.cache=input.timers.cache;
 if(MAPS.some(m=>m.id===input.map))s.map=input.map;
 const w=input.world;if(w&&num(w.seconds)&&num(w.weatherUntil)&&w.weatherUntil>w.seconds&&w.weatherUntil-w.seconds<=WEATHER_INTERVAL&&WEATHERS[w.weather])s.world={seconds:w.seconds,weather:w.weather,weatherUntil:w.weatherUntil};
 if(input.layoutVersion===3&&input.camera&&['x','y','scale'].every(k=>Number.isFinite(input.camera[k]))&&input.camera.scale>=.035&&input.camera.scale<=1.7&&Math.abs(input.camera.x)<1e6&&Math.abs(input.camera.y)<1e6)s.camera={...input.camera};
 const stamp=v=>num(v,now);s.savedAt=stamp(input.savedAt)?input.savedAt:now;
 const e=economy(s);s.offline={since:s.savedAt,through:s.savedAt,rate:e.rate.mul(1+e.burst/e.interval),coinRate:e.coinRate.mul(1+e.coinBurst/e.interval)};
 const o=input.offline;if(o&&stamp(o.since)&&stamp(o.through)&&o.through>=o.since&&big(o.rate)&&big(o.coinRate))s.offline={since:o.since,through:o.through,rate:big(o.rate),coinRate:e.coinUnlocked?big(o.coinRate):ZERO,...(num(o.full)&&o.full>0&&num(o.decay)&&o.decay>0?{full:o.full,decay:o.decay}:{})};
 return s;
}
