// 환생 (prestige): finishing all 105 studies and holding enough dollars lets
// the player start over for tokens, spent on this flower-shaped tree. Five
// petals grow from a pentagon center; each petal is a small flow like the
// mainland sectors. Node names use AI vocabulary. Nodes marked `reserved`
// are placeholders for designs that do not exist yet: visible, not purchasable.
import {buildLand,boundsOf,CARD} from './layout.js?v=3.0.8';
export const PRESTIGE_THRESHOLD=5e33;     // $5.00Dc held after finishing the tree
export const PRESTIGE_BASE_TOKENS=10;    // tokens at exactly the threshold
export const PRESTIGE_BRANCHES=[
 {id:'dormant',name:'DORMANT',ko:'오프라인',color:'#9fb6ff',angle:-90},
 {id:'scaling',name:'SCALING',ko:'생산',color:'#f7a8c4',angle:-18},
 {id:'agent',name:'AGENT',ko:'자동화',color:'#ffd27a',angle:54},
 {id:'expansion',name:'EXPANSION',ko:'해금',color:'#9be7d6',angle:126},
 {id:'reward',name:'REWARD',ko:'보상',color:'#d9b8ff',angle:198},
];
// Row plan per petal (1 → 2 → 2 → … → 1), same upstream rule as the mainland.
export const PETAL_ROWS=[[1,2,2,2,1],[1,2,2,2,1],[1,2,2,2,1],[1,2,2,1],[1,2,2,1]];
// effect: {type,value} applied per level in prestigeBonuses(). cost: tokens per level.
const DEF=[
 // 0 DORMANT — offline reward
 ['RNN','Bookmark',4,[3,4,5,8],{type:'offlineFull',value:900},'오프라인 100% 생산 구간 +15분 / Lv'],
 ['GRU','Coffee',3,[3,5,7],{type:'offlineDecay',value:300},'오프라인 감쇠 시간 상수 +5분 / Lv'],
 ['HOPFIELD NET','Moon',1,[4],{type:'offlineRate',value:1.5},'오프라인 생산 ×1.5'],
 ['KV CACHE','Hourglass',3,[5,7,10],{type:'offlineFull',value:600},'오프라인 100% 생산 구간 +10분 / Lv'],
 ['BOLTZMANN MACHINE','Anchor',2,[6,9],{type:'offlineRate',value:1.5},'오프라인 생산 ×1.5 / Lv'],
 ['NEURAL TURING MACHINE','BookOpen',2,[7,11],{type:'offlineDecay',value:600},'오프라인 감쇠 시간 상수 +10분 / Lv'],
 ['WAKE-SLEEP','Camera',1,[10],{type:'offlineFull',value:1800},'오프라인 100% 생산 구간 +30분'],
 ['LSTM','CloudMoon',1,[16],{type:'offlineRate',value:2},'오프라인 생산 ×2'],
 // 1 SCALING — production
 ['PERCEPTRON','Sprout',1,[3],{type:'allMul',value:3},'$ · ¢ 전체 생산 ×3'],
 ['ADAM','Flame',10,[2,3,4,5,6,7,8,9,10,11],{type:'moneyMul',value:1.15},'$ 생산 +15% / Lv'],
 ['WORD2VEC','Gem',5,[3,4,5,6,7],{type:'baseAdd',value:5},'$ 기본 생산 +5 /s / Lv'],
 ['BACKPROP','Footprints',3,[5,7,9],{type:'coinMul',value:1.5},'¢ 생산 ×1.5 / Lv'],
 ['RESNET','Eye',4,[5,6,8,10],{type:'cacheMul',value:1.25},'캐시 지급량 ×1.25 / Lv'],
 ['BPE','Tag',5,[4,5,6,7,8],{type:'discount',value:.95},'$ 연구 비용 −5% / Lv'],
 ['LORA','SlidersHorizontal',3,[8,11,16],{type:'moneyMul',value:1.5},'$ 생산 ×1.5 / Lv'],
 ['TRANSFORMER','Zap',1,[17],{type:'allMul',value:4},'$ · ¢ 전체 생산 ×4'],
 // 2 AGENT — automation, one node per mainland sector
 ['AUTOPILOT I','Bike',1,[3],{type:'auto',value:0},'1섹터 INITIALIZATION 자동 연구'],
 ['AUTOPILOT II','Car',1,[4],{type:'auto',value:1},'2섹터 ARITHMETIC 자동 연구'],
 ['AUTOPILOT III','Bus',1,[5],{type:'auto',value:2},'3섹터 ALGEBRA 자동 연구'],
 ['AUTOPILOT IV','Truck',1,[6],{type:'auto',value:3},'4섹터 LOGIC 자동 연구'],
 ['AUTOPILOT V','TrainFront',1,[7],{type:'auto',value:4},'5섹터 MEMORY 자동 연구'],
 ['AUTOPILOT VI','Ship',1,[8],{type:'auto',value:5},'6섹터 ALGORITHMS 자동 연구'],
 ['AUTOPILOT VII','Plane',1,[10],{type:'auto',value:6},'7섹터 ARCHITECTURE 자동 연구'],
 ['AUTOPILOT VIII','Rocket',1,[13],{type:'auto',value:7},'8섹터 COMPUTATION 자동 연구'],
 // 3 EXPANSION — reserved for studies that are not designed yet
 ['BERT','DoorOpen',1,[5],{type:'reserved'},'예약 · 설계 전'],
 ['RAG','Compass',1,[6],{type:'reserved'},'예약 · 설계 전'],
 ['TOOLFORMER','Hammer',1,[6],{type:'reserved'},'예약 · 설계 전'],
 ['CLIP','Palette',1,[8],{type:'reserved'},'예약 · 설계 전'],
 ['DIFFUSION','Telescope',1,[8],{type:'reserved'},'예약 · 설계 전'],
 ['MIXTURE OF EXPERTS','Scale',1,[11],{type:'reserved'},'예약 · 설계 전'],
 // 4 REWARD — tokens; the rest reserved until the branch is designed
 ['Q-LEARNING','Star',4,[3,5,7,10],{type:'tokenMul',value:.25},'환생 토큰 +25% / Lv'],
 ['DQN','CakeSlice',5,[3,4,5,6,7],{type:'tokenAdd',value:1},'환생마다 토큰 +1 / Lv'],
 ['ALPHAGO','Lollipop',1,[6],{type:'reserved'},'예약 · 설계 전'],
 ['MCTS','Cookie',1,[6],{type:'reserved'},'예약 · 설계 전'],
 ['PPO','IceCreamCone',1,[8],{type:'reserved'},'예약 · 설계 전'],
 ['MUZERO','Gift',1,[11],{type:'reserved'},'예약 · 설계 전'],
];
const ROW_PITCH=190,COLUMN_PITCH=252,FIRST_RADIUS=430;
const upstream=(j,width,previousWidth)=>{const lo=j/width,hi=(j+1)/width,parents=[];for(let i=0;i<previousWidth;i++){const a=i/previousWidth,b=(i+1)/previousWidth;if(Math.min(hi,b)-Math.max(lo,a)>1e-9)parents.push(i);}return parents;};
export const PRESTIGE_NODES=[];
{
 let id=1001,index=0;
 PETAL_ROWS.forEach((rows,branch)=>{
  const a=PRESTIGE_BRANCHES[branch].angle*Math.PI/180,direction={x:Math.cos(a),y:Math.sin(a)},side={x:-direction.y,y:direction.x};
  let lastRow=[];
  rows.forEach((width,row)=>{
   const current=[];
   for(let j=0;j<width;j++){
    const [name,icon,max,cost,effect,ko]=DEF[index++];
    const localX=Math.round((j-(width-1)/2)*COLUMN_PITCH),localY=row*ROW_PITCH;
    const n={id:id++,name,icon,max,cost,effect,ko,branch,chapter:branch,row,column:j,prestige:true,reserved:effect.type==='reserved',
     localX,localY,x:Math.round(direction.x*(FIRST_RADIUS+localY)+side.x*localX),y:Math.round(direction.y*(FIRST_RADIUS+localY)+side.y*localX),
     req:(row?upstream(j,width,lastRow.length).map(i=>lastRow[i].id):[]).map(id=>({id,level:1})),any:false,gate:row===rows.length-1};
    if(n.cost.length!==n.max)throw Error(`${name}: cost table does not match max level`);
    current.push(n);PRESTIGE_NODES.push(n);
   }
   lastRow=current;
  });
 });
 if(index!==DEF.length)throw Error('Prestige row plans do not match the node list');
}
export const prestigeById=new Map(PRESTIGE_NODES.map(n=>[n.id,n]));
export const PRESTIGE_LAYOUT=(()=>{
 const petals=PRESTIGE_BRANCHES.map((b,i)=>{const a=b.angle*Math.PI/180;return {branch:i,direction:{x:Math.cos(a),y:Math.sin(a)},members:PRESTIGE_NODES.filter(n=>n.branch===i)};});
 // Separate lobes around a bare pentagon center: no center land, and the
 // closing radius is kept below the gap between neighboring petals.
 const regions=buildLand(PRESTIGE_NODES,petals.map(p=>({key:p.branch,direction:p.direction})),{centerLand:0,close:70,coast:80});
 for(const p of petals)Object.assign(p,regions[p.branch]);
 return {petals,bounds:boundsOf(PRESTIGE_NODES,260,240)};
})();
export const prestigeLevel=(s,n)=>s.prestige?.levels?.[typeof n==='number'?n:n.id]||0;
export function prestigeUnlocked(s,n){return n.req.every(r=>prestigeLevel(s,r.id)>=r.level);}
export function prestigeCost(s,n){const l=prestigeLevel(s,n);return {token:n.cost[Math.min(l,n.max-1)]};}
export function prestigeAffordable(s,n){if(n.reserved)return false;return s.settings.purchaseCheat||(s.currencies.token||0)+1e-9>=prestigeCost(s,n).token;}
export function prestigePurchase(s,n){
 if(!n||n.reserved||!prestigeUnlocked(s,n)||prestigeLevel(s,n)>=n.max||!prestigeAffordable(s,n))return false;
 const price=prestigeCost(s,n).token;
 if(!s.settings.purchaseCheat){s.currencies.token=Math.round(Math.max(0,(s.currencies.token||0)-price)*100)/100;s.prestige.tokensSpent=Math.round(((s.prestige.tokensSpent||0)+price)*100)/100;}
 s.prestige.levels[n.id]=prestigeLevel(s,n)+1;s.prestige.purchases=(s.prestige.purchases||0)+1;
 return true;
}
export function petalProgress(s,branch){const nodes=PRESTIGE_NODES.filter(n=>n.branch===branch&&!n.reserved);const total=nodes.reduce((a,n)=>a+n.max,0),done=nodes.reduce((a,n)=>a+prestigeLevel(s,n),0);return {done,total,complete:total>0&&done===total,reserved:PRESTIGE_NODES.filter(n=>n.branch===branch&&n.reserved).length};}
// Aggregated bonuses from owned prestige nodes. Neutral when nothing is owned.
export function prestigeBonuses(s){
 const b={moneyMul:1,coinMul:1,allMul:1,baseAdd:0,cacheMul:1,discount:1,offlineFull:0,offlineDecay:0,offlineRate:1,tokenMul:1,tokenAdd:0,auto:new Set()};
 if(!s.prestige)return b;
 for(const n of PRESTIGE_NODES){const l=prestigeLevel(s,n);if(!l)continue;const {type,value}=n.effect;
  switch(type){
   case 'moneyMul':b.moneyMul*=value**l;break;
   case 'coinMul':b.coinMul*=value**l;break;
   case 'allMul':b.allMul*=value**l;break;
   case 'baseAdd':b.baseAdd+=value*l;break;
   case 'cacheMul':b.cacheMul*=value**l;break;
   case 'discount':b.discount*=value**l;break;
   case 'offlineFull':b.offlineFull+=value*l;break;
   case 'offlineDecay':b.offlineDecay+=value*l;break;
   case 'offlineRate':b.offlineRate*=value**l;break;
   case 'tokenMul':b.tokenMul+=value*l;break;
   case 'tokenAdd':b.tokenAdd+=value*l;break;
   case 'auto':b.auto.add(value);break;
  }
 }
 return b;
}
// Tokens for a prestige with the given dollar balance: 10 at the threshold,
// growing with the square root of the balance, then the REWARD petal.
// tokens = 10 · √(balance / $5.00Dc) · (1 + Q-LEARNING) + DQN
export function tokensFor(s,money=s.currencies.money){
 if(!(money>=PRESTIGE_THRESHOLD))return 0;
 const b=prestigeBonuses(s);
 // Tokens are fractional: the balance keeps two decimals, costs are whole numbers.
 return Math.max(PRESTIGE_BASE_TOKENS,Math.round((PRESTIGE_BASE_TOKENS*Math.sqrt(money/PRESTIGE_THRESHOLD)*b.tokenMul+b.tokenAdd)*100)/100);
}
