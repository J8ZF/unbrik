import {createRadialLayout} from './layout.js?v=2.1-island';
import {RESEARCH} from './research.js?v=2.1-island';
import {PRICES} from './prices.js?v=2.1-island';
export const CHAPTERS = [
 {name:'INITIALIZATION',ko:'초기화',color:'#b9f36d'},
 {name:'ARITHMETIC',ko:'산술',color:'#65e2cc'},
 {name:'ALGEBRA',ko:'대수',color:'#77baff'},
 {name:'LOGIC',ko:'논리',color:'#bba1ff'},
 {name:'MEMORY',ko:'메모리',color:'#f5be72'},
 {name:'ALGORITHMS',ko:'알고리즘',color:'#fa93bd'},
 {name:'ARCHITECTURE',ko:'아키텍처',color:'#F2DA5B'},
 {name:'COMPUTATION',ko:'연산',color:'#F2F4F7'},
];
export const MAX_VALUE=1e100;
export const ECONOMY_EPOCH='unbrik-2.0-rework';
export const CURRENCIES=['money','coin'];
export const NODES=RESEARCH.map(n=>({...n,effects:n.effects.map(e=>({...e})),costs:PRICES[n.id]||Array.from({length:n.max},()=>Object.fromEntries(n.payment.map(k=>[k,10])))}));
// Each sector is a flow: one root fans out into rows of two or three parallel
// studies, then narrows back into a single gate that opens the next sector.
// A study requires the parents directly "upstream" of it (the ones whose span
// in the previous row overlaps its own), so links never cross. Sector 3 keeps
// BASIS alone in row 2 because every coin study must descend from it.
// Row widths per sector; sums equal the sector sizes 8/12/14/13/14/14/15/15.
export const SECTOR_ROWS=[
 [1,2,2,2,1],
 [1,2,3,3,2,1],
 [1,1,2,3,3,3,1],
 [1,2,3,3,3,1],
 [1,2,3,3,2,2,1],
 [1,2,2,3,3,2,1],
 [1,2,3,3,3,2,1],
 [1,2,3,3,3,2,1],
];
export const ROW_PITCH=190,COLUMN_PITCH=252;
const upstream=(j,width,previousWidth)=>{
 const lo=j/width,hi=(j+1)/width,parents=[];
 for(let i=0;i<previousWidth;i++){const a=i/previousWidth,b=(i+1)/previousWidth;if(Math.min(hi,b)-Math.max(lo,a)>1e-9)parents.push(i);}
 return parents;
};
for(let chapter=0;chapter<8;chapter++){
 const members=NODES.filter(n=>n.chapter===chapter),previous=NODES.filter(n=>n.chapter===chapter-1).at(-1),rows=SECTOR_ROWS[chapter];
 if(rows.reduce((a,b)=>a+b,0)!==members.length)throw Error(`Sector ${chapter+1} row plan does not match ${members.length} studies.`);
 let index=0,lastRow=[];
 rows.forEach((width,row)=>{
  const current=[];
  for(let j=0;j<width;j++){
   const n=members[index++];
   n.localX=Math.round((j-(width-1)/2)*COLUMN_PITCH);n.localY=row*ROW_PITCH;n.row=row;n.column=j;
   const parents=row?upstream(j,width,lastRow.length).map(i=>lastRow[i].id):previous?[previous.id]:[];
   n.req=parents.map(id=>({id,level:1}));n.any=n.name==='OR GATE';n.gate=index===members.length;n.currency=n.payment.length===1?n.payment[0]:'both';n.baseCost=n.costs[0];
   current.push(n);
  }
  lastRow=current;
 });
}
export const byId=new Map(NODES.map(n=>[n.id,n]));
export const MAP_LAYOUT=createRadialLayout(NODES);
export const level=(s,n)=>s.levels[typeof n==='number'?n:n.id]||0;
export function unlocked(s,n){return n.req.length===0||(n.any?n.req.some(r=>level(s,r.id)>=r.level):n.req.every(r=>level(s,r.id)>=r.level));}
export function sectorProgress(s,chapter){const nodes=MAP_LAYOUT.sectors[chapter].members;const total=nodes.reduce((a,n)=>a+n.max,0),done=nodes.reduce((a,n)=>a+level(s,n),0);return {done,total,complete:done===total};}
export function defaultState(){const now=Date.now();return {version:2,economyEpoch:ECONOMY_EPOCH,contentVersion:4,layoutVersion:3,currencies:{money:0,coin:0},levels:{},stats:{earned:0,spent:0,coinEarned:0,coinSpent:0,purchases:0,seconds:0,peak:1,coinPeak:0,offlineSeconds:0,offlineEarned:0,offlineCoinEarned:0,offlineEffectiveSeconds:0},timers:{cache:0},settings:{motion:true,touch:true,haptic:true,format:'short',purchaseCheat:false,mapControls:false,hudCollapsed:false,panelCollapsed:false},camera:null,offline:{since:now,through:now,rate:1,coinRate:0},savedAt:now};}
export function economy(s){
 const owned=NODES.filter(n=>level(s,n)>0),count=owned.length,total=owned.reduce((a,n)=>a+level(s,n),0),coinUnlocked=level(s,22)>0;
 const v={money:{base:1,mul:1,baseMul:1,discount:1,scaling:1,cache:0,cacheMul:1},coin:{base:0,mul:1,baseMul:1,discount:1,scaling:1,cache:0,cacheMul:1}};
 let interval=30;
 const counts={money:owned.filter(n=>n.payment.includes('money')).length,coin:owned.filter(n=>n.payment.includes('coin')).length};
 const completed=CHAPTERS.filter((_,i)=>sectorProgress(s,i).complete).length,maxed=owned.filter(n=>n.max>1&&level(s,n)===n.max).length;
 for(const n of owned){const l=level(s,n);for(const e of n.effects){const a=v[e.currency],x=e.value;
  switch(e.type){
   case 'unlock':a.base+=x;break;
   case 'add':a.base+=x*l;break;
   case 'mul':case 'recursive':a.mul*=x**l*(e.type==='recursive'?1+.08*l*l:1);break;
   case 'base':a.baseMul*=x**l;break;
   case 'count':a.mul*=1+(e.source?counts[e.source]:count)*x*l;break;
   case 'levels':a.mul*=1+(e.source==='sector'?owned.filter(p=>p.chapter===n.chapter).reduce((a,p)=>a+level(s,p),0):total)*x*l;break;
   case 'balance':a.mul*=1+x*l*Math.log10(1+Math.max(0,s.currencies[e.source]));break;
   case 'completed':a.mul*=1+x*completed;break;
   case 'maxed':a.mul*=1+x*maxed;break;
   case 'discount':a.discount*=x**l;break;
   case 'scaling':a.scaling*=x**l;break;
   case 'cache':a.cache+=x*l;break;
   case 'cacheMul':a.cacheMul*=x**l;break;
   case 'speed':if(e.currency==='money')interval*=x**l;break;
  }
 }}
 if(coinUnlocked)v.coin.cache+=3;
 const rate=Math.min(MAX_VALUE,v.money.base*v.money.baseMul*v.money.mul),coinRate=coinUnlocked?Math.min(MAX_VALUE,v.coin.base*v.coin.baseMul*v.coin.mul):0;
 const burst=v.money.cache*v.money.cacheMul,coinBurst=coinUnlocked?v.coin.cache*v.coin.cacheMul:0;
 return {rate,coinRate,rates:{money:rate,coin:coinRate},burst,coinBurst,bursts:{money:burst,coin:coinBurst},interval,coinUnlocked,count,total,discount:v.money.discount,scaling:v.money.scaling,discounts:{money:v.money.discount,coin:v.coin.discount},scalings:{money:v.money.scaling,coin:v.coin.scaling}};
}
export function cost(s,n,e=economy(s)){const l=level(s,n),raw=n.costs[Math.min(l,n.max-1)];return Object.fromEntries(n.payment.map(k=>[k,Math.min(MAX_VALUE,Math.max(1,raw[k]*e.discounts[k]*e.scalings[k]**l))]));}
export function affordable(s,n,e=economy(s)){const p=cost(s,n,e);return s.settings.purchaseCheat||Object.entries(p).every(([k,x])=>s.currencies[k]+x*1e-12>=x);}
export function waitTime(s,n,e=economy(s)){return Math.max(0,...Object.entries(cost(s,n,e)).map(([k,p])=>{const deficit=Math.max(0,p-s.currencies[k]);return deficit?deficit/(e.rates[k]*(1+e.bursts[k]/e.interval)||0):0;}));}
export function normalizedCost(s,n,e=economy(s)){return Math.max(...Object.entries(cost(s,n,e)).map(([k,p])=>p/(e.rates[k]*(1+e.bursts[k]/e.interval)||0)));}
export function purchase(s,n){
 if(!n||!unlocked(s,n)||level(s,n)>=n.max)return false;
 const e=economy(s);if(!affordable(s,n,e))return false;
 const prices=cost(s,n,e);
 if(!s.settings.purchaseCheat)for(const [k,p]of Object.entries(prices)){s.currencies[k]=Math.max(0,s.currencies[k]-p);const stat=k==='money'?'spent':'coinSpent';s.stats[stat]=Math.min(MAX_VALUE,s.stats[stat]+p);}
 s.levels[n.id]=level(s,n)+1;s.stats.purchases++;return true;
}
export function tick(s,dt){
 if(!Number.isFinite(dt)||dt<=0)return [];dt=Math.min(dt,5);
 const e=economy(s),events=[],gains={money:e.rate*dt,coin:e.coinRate*dt};s.stats.seconds+=dt;
 if(e.burst||e.coinBurst){s.timers.cache+=dt;while(s.timers.cache>=e.interval){s.timers.cache-=e.interval;const money=e.rate*e.burst,coin=e.coinRate*e.coinBurst;gains.money+=money;gains.coin+=coin;events.push({type:'cache',amount:money,money,coin});}}
 for(const k of CURRENCIES){const earned=k==='money'?'earned':'coinEarned',peak=k==='money'?'peak':'coinPeak';s.currencies[k]=Math.min(MAX_VALUE,s.currencies[k]+gains[k]);s.stats[earned]=Math.min(MAX_VALUE,s.stats[earned]+gains[k]);s.stats[peak]=Math.max(s.stats[peak],e.rates[k]);}
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
 case 'levels':return `${e.source==='sector'?'이 섹터':'총'} 연구 레벨마다 ${symbol} 생산 +${+(v*100).toFixed(2)}%${per}`;
 case 'balance':return `${symbol} 생산 ×(1 + ${v} × log₁₀(1 + 보유 ${source}))`;
 case 'completed':return `완료 섹터마다 ${symbol} 생산 +${v*100}%`;
 case 'maxed':return `MAX 반복 연구마다 ${symbol} 생산 +${v*100}%`;
 case 'discount':return `${symbol} 연구 비용 −${+((1-v)*100).toFixed(2)}%${per}`;
 case 'scaling':return `${symbol} 반복 연구 비용 ×${v}^현재 Lv.${per}`;
 case 'cache':return `${symbol} 캐시 생산 ${v}초분 추가`;
 case 'cacheMul':return `${symbol} 캐시 지급량 ×${v}${per}`;
 case 'speed':return e.currency==='money'?`캐시 주기 −${Math.round((1-v)*100)}%`:'';
 case 'recursive':return `${symbol} 생산 ×(${v}^Lv × (1 + 0.08 × Lv²))`;
 }
}).filter(Boolean).join(' · ');}
export function copyPreferences(input){const s=defaultState();for(const k of ['motion','touch','haptic','purchaseCheat','mapControls','hudCollapsed','panelCollapsed'])if(typeof input?.settings?.[k]==='boolean')s.settings[k]=input.settings[k];if(['short','scientific','engineering'].includes(input?.settings?.format))s.settings.format=input.settings.format;return s;}
export function validateSave(input,now=Date.now()){
 if(!input||input.version!==2||input.economyEpoch!==ECONOMY_EPOCH)throw Error('2.0 리워크 이전 저장은 호환되지 않습니다.');
 const s=copyPreferences(input),num=(v,max=MAX_VALUE)=>typeof v==='number'&&Number.isFinite(v)&&v>=0&&v<=max;
 if(!input.currencies||!CURRENCIES.every(k=>num(input.currencies[k]))||!input.levels||Array.isArray(input.levels)||typeof input.levels!=='object')throw Error('저장 데이터가 올바르지 않습니다.');
 s.currencies={...input.currencies};
 for(const [key,value]of Object.entries(input.levels)){const n=byId.get(Number(key));if(!n||String(n.id)!==key||!Number.isInteger(value)||value<0||value>n.max)throw Error('연구 레벨이 올바르지 않습니다.');if(value)s.levels[key]=value;}
 for(const n of NODES)if(level(s,n)&&!unlocked(s,n))throw Error('선행 연구가 누락되었습니다.');
 if(!level(s,22)&&s.currencies.coin)throw Error('해금 전 코인 데이터가 올바르지 않습니다.');
 if(!input.stats||!Object.keys(s.stats).every(k=>num(input.stats[k])))throw Error('통계가 올바르지 않습니다.');
 for(const k of Object.keys(s.stats))s.stats[k]=input.stats[k];
 if(num(input.timers?.cache,30))s.timers.cache=input.timers.cache;
 if(input.layoutVersion===3&&input.camera&&['x','y','scale'].every(k=>Number.isFinite(input.camera[k]))&&input.camera.scale>=.035&&input.camera.scale<=1.7&&Math.abs(input.camera.x)<1e6&&Math.abs(input.camera.y)<1e6)s.camera={...input.camera};
 const stamp=v=>num(v,now);s.savedAt=stamp(input.savedAt)?input.savedAt:now;
 const e=economy(s);s.offline={since:s.savedAt,through:s.savedAt,rate:e.rate*(1+e.burst/e.interval),coinRate:e.coinRate*(1+e.coinBurst/e.interval)};
 const o=input.offline;if(o&&stamp(o.since)&&stamp(o.through)&&o.through>=o.since&&num(o.rate)&&num(o.coinRate))s.offline={since:o.since,through:o.through,rate:o.rate,coinRate:e.coinUnlocked?o.coinRate:0};
 return s;
}
