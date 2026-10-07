export const CHAPTERS = [
 {name:'INITIALIZATION',ko:'초기화',color:'#b9f36d'},
 {name:'ARITHMETIC',ko:'산술',color:'#65e2cc'},
 {name:'ALGEBRA',ko:'대수',color:'#77baff'},
 {name:'LOGIC',ko:'논리',color:'#bba1ff'},
 {name:'MEMORY',ko:'메모리',color:'#f5be72'},
 {name:'ALGORITHMS',ko:'알고리즘',color:'#fa93bd'},
 {name:'ARCHITECTURE',ko:'아키텍처',color:'#79e6ef'},
 {name:'COMPUTATION',ko:'연산',color:'#c0f57c'},
];
// [name, symbol, effect type, magnitude, max level]
const catalog = [
 [ ['START','⏻','mul',2], ['INCREMENT','+1','add',2,20], ['MULTIPLY','×','mul',1.6,15], ['ACCUMULATOR','Σ','count',.035], ['BOOTSTRAP','λ','mul',2.2] ],
 [ ['ADDITION','+','add',12,20], ['PRODUCT','×','mul',1.7,15], ['SERIES','∑n','levels',.012], ['FACTORIAL','n!','mul',2.1], ['DISTRIBUTIVE','a(b+c)','addBoost',1.7], ['RATIO','a:b','discount',.92], ['GEOMETRIC','rⁿ','mul',1.24,20], ['REMAINDER','mod','burst',1.2], ['CONVERGENCE','lim','mul',2.2], ['ARITHMETIC CORE','ℝ','mul',2.8] ],
 [ ['VARIABLE','x','add',120,20], ['LINEAR','ax+b','addBoost',1.8], ['LOGARITHM','ln x','balance',.065], ['POLYNOMIAL','x²','mul',1.23,20], ['MATRIX','[A]','count',.05], ['VECTOR','v̂','mul',1.9], ['EIGENVALUE','λI','mul',2.3], ['DERIVATIVE','d/dx','levels',.015], ['INTEGRAL','∫','burst',2], ['ALGEBRA CORE','∇','power',1.025] ],
 [ ['BOOLEAN','01','mul',2], ['AND GATE','∧','count',.04], ['OR GATE','∨','mul',1.3,20], ['NEGATION','¬','discount',.92], ['XOR','⊕','mul',2.4], ['TRUTH TABLE','T/F','levels',.016], ['BITSHIFT','≪','mul',1.35,20], ['MUX','2:1','burst',2], ['SAT SOLVER','⊨','mul',3], ['LOGIC CORE','⊢','power',1.025] ],
 [ ['REGISTER','R₀','add',1500,25], ['L1 CACHE','L1','burst',2.5], ['MEMORY BUS','↔','mul',1.28,25], ['L2 CACHE','L2','burstBoost',1.5], ['POINTER','*p','addBoost',2.2], ['STACK','LIFO','levels',.018], ['HEAP','H','count',.04], ['PREFETCH','pf','burstSpeed',.85], ['GARBAGE COLLECTOR','gc','discount',.9], ['MEMORY CORE','RAM','mul',3.5] ],
 [ ['BINARY SEARCH','log₂','scaling',.975], ['DIVIDE & CONQUER','÷','mul',2.5], ['MEMOIZATION','f(x)','burstBoost',1.7], ['QUICKSORT','n log n','mul',1.35,25], ['DYNAMIC PROGRAM','DP','levels',.023], ['GREEDY','max','count',.055], ['RECURSION','f(f)','recursive',1.25,20], ['HASH MAP','#','discount',.88], ['OPTIMIZATION','O(log n)','scaling',.975], ['ALGORITHM CORE','O(1)','power',1.025] ],
 [ ['CLOCK','Hz','mul',1.3,30], ['PIPELINE','▰▱▱','mul',2.6], ['THREAD','T₁','levels',.02], ['SCHEDULER','sched','automation',1], ['PARALLELISM','∥','burstBoost',2], ['SIMD','4×','addBoost',2.5], ['BRANCH PREDICTOR','?','discount',.87], ['MULTICORE','8C','count',.065], ['INSTRUCTION SET','ISA','mul',1.3,25], ['SPECULATION','if','mul',3], ['CLOCK DOMAIN','GHz','burstSpeed',.8], ['INTERCONNECT','mesh','mul',3], ['ARCHITECTURE CORE','CPU','power',1.025] ],
 [ ['FINITE STATE','q₀','mul',3], ['TURING MACHINE','TM','levels',.02], ['LAMBDA CALCULUS','λx.x','mul',1.3,30], ['FIXED POINT','Y','recursive',1.3,20], ['INFORMATION','H(X)','count',.06], ['ENTROPY','S','discount',.85], ['COMPLEXITY','P≟NP','scaling',.97], ['SUPERPOSITION','|ψ⟩','mul',4], ['FOURIER','ℱ','burstBoost',2.5], ['UNIVERSAL','U','power',1.035], ['SINGULARITY','∞','mul',5], ['AXIOM','⊙','power',1.06] ]
];
const pattern10 = [[0,0,[]],[-126,185,[0]],[126,185,[0]],[-220,370,[1]],[0,370,[1,2]],[220,370,[2]],[-126,555,[3,4]],[126,555,[4,5]],[0,740,[6,7]],[0,925,[8]]];
const pattern13 = [[0,0,[]],[-126,185,[0]],[126,185,[0]],[-250,370,[1]],[0,370,[1,2]],[250,370,[2]],[-250,555,[3]],[0,555,[4]],[250,555,[5]],[-126,740,[6,7]],[126,740,[7,8]],[0,925,[9,10]],[0,1110,[11]]];
const pattern12 = [[0,0,[]],[-126,185,[0]],[126,185,[0]],[-250,370,[1]],[0,370,[1,2]],[250,370,[2]],[-250,555,[3]],[0,555,[4]],[250,555,[5]],[-126,740,[6,7]],[126,740,[7,8]],[0,925,[9,10]]];
export const NODES=[];
let yBase=0;
catalog.forEach((items,chapter)=>{
 const start=NODES.length;
 const pattern=chapter===0?[[0,0,[]],[-126,190,[0]],[126,190,[0]],[0,380,[1,2]],[0,565,[3]]]:items.length===13?pattern13:items.length===12?pattern12:pattern10;
 items.forEach(([name,symbol,type,value,max=1],i)=>{
 const [x,y,parents]=pattern[i];
 const req=parents.length?parents.map(p=>({id:start+p+1,level:1})):start?[{id:start,level:1}]:[];
 const id=NODES.length+1;
 const n={id,name,symbol,type,value,max,chapter,x,y:yBase+y,req,any:false,gate:i===items.length-1,currency:'money',baseCost:0,costs:[],permanent:false};
 if(name==='OR GATE') {n.req=[{id:26,level:1},{id:27,level:1}];n.any=true;}
 if(name==='EIGENVALUE') n.req.push({id:9,level:1});
 if(name==='MEMOIZATION') n.req.push({id:37,level:1});
 if(name==='UNIVERSAL') n.req.push({id:25,level:1});
 NODES.push(n);
 });
 yBase+=pattern.at(-1)[1]+310;
});
// Finite local research finishes in the following region. Two late studies
// are intentionally long-term. Legacy maxima also define save migration.
export const LEGACY_MAX = {2:20,3:15,6:20,7:15,12:20,16:20,19:20,28:20,32:20,36:25,38:25,49:25,52:20,56:30,64:25,71:30,72:20};
const caps={2:20,3:5,6:10,7:5,12:20,16:10,19:5,28:5,32:10,36:20,38:10,49:10,52:5,56:20,64:5,71:5,72:5};
for(const n of NODES){
 n.addGrowth=1.05;n.recursiveStep=.045;
 if(caps[n.id]){const ratio=n.max/caps[n.id];n.max=caps[n.id];
  if(n.type==='add'){n.value*=ratio;n.addGrowth=1.05**ratio;}
  else n.value=n.value**ratio;
  n.recursiveStep*=ratio;
 }
 if(n.id===31||n.id===50){n.longTerm=true;n.max=n.id===31?20:10;n.value=n.id===31?.0015:.004;}
}
export const byId=new Map(NODES.map(n=>[n.id,n]));
export const MAX_VALUE=1e280;
export function defaultState(){const now=Date.now();return {version:1,contentVersion:3,currencies:{money:0},levels:{},stats:{earned:0,spent:0,purchases:0,seconds:0,peak:1,offlineSeconds:0,offlineEarned:0,offlineEffectiveSeconds:0},timers:{cache:0,auto:0},settings:{motion:true,touch:true,haptic:true,format:'short',auto:false,purchaseCheat:false,hudCollapsed:true,panelCollapsed:false},camera:null,offline:{since:now,through:now,rate:1},savedAt:now};}
export const level=(s,n)=>s.levels[typeof n==='number'?n:n.id]||0;
export function unlocked(s,n){return n.req.length===0||(n.any?n.req.some(r=>level(s,r.id)>=r.level):n.req.every(r=>level(s,r.id)>=r.level));}
export function economy(s){
 let add=1,mul=1,addBoost=1,discount=1,scaling=1,burst=0,burstBoost=1,interval=30,power=1,auto=false;
 const count=Object.values(s.levels).filter(v=>v>0).length,total=Object.values(s.levels).reduce((a,b)=>a+b,0);
 for(const n of NODES){const l=level(s,n);if(!l)continue;const v=n.value;
 switch(n.type){
 case 'add':add+=v*l;mul*=n.addGrowth**l;break;case 'mul':mul*=v**l;break;case 'addBoost':addBoost*=v**l;break;
 case 'count':mul*=1+count*v*l;break;case 'levels':mul*=1+total*v*l;break;
 case 'balance':mul*=1+Math.log10(1+s.currencies.money)*v*l;break;
 case 'power':power+=((v-1)*l);break;case 'discount':discount*=v**l;break;
 case 'scaling':scaling*=v**l;break;case 'burst':burst+=v*l;break;
 case 'burstBoost':burstBoost*=v**l;break;case 'burstSpeed':interval*=v**l;break;
 case 'recursive':mul*=v**l*(1+l*n.recursiveStep);break;case 'automation':auto=true;break;
 }
 }
 const rate=Math.min(MAX_VALUE,(add*addBoost*mul)**power);
 return {rate,discount,scaling,burst:burst*burstBoost,interval,auto,count,total};
}
export function cost(s,n,e=economy(s)){return Math.min(MAX_VALUE,Math.max(1,(n.costs?.[level(s,n)]??n.baseCost)*e.discount*e.scaling**level(s,n)));}
export function purchase(s,n){
 const e=economy(s),p=cost(s,n,e);
 if(!unlocked(s,n)||level(s,n)>=n.max||s.currencies.money+Math.max(1,p)*1e-12<p)return false;
 if(s.settings.purchaseCheat){const grant=Math.min(p,MAX_VALUE-s.currencies.money);s.currencies.money+=grant;s.stats.earned=Math.min(MAX_VALUE,s.stats.earned+grant);}
 else{s.currencies.money=Math.max(0,s.currencies.money-p);s.stats.spent=Math.min(MAX_VALUE,s.stats.spent+p);}
 s.levels[n.id]=level(s,n)+1;s.stats.purchases++;return true;
}
export function tick(s,dt){
 if(!Number.isFinite(dt)||dt<=0)return [];
 dt=Math.min(dt,5);
 const e=economy(s);let gain=e.rate*dt,events=[];
 s.stats.seconds+=dt;
 if(e.burst){s.timers.cache+=dt;while(s.timers.cache>=e.interval){s.timers.cache-=e.interval;gain+=e.rate*e.burst;events.push({type:'cache',amount:e.rate*e.burst});}}
 s.currencies.money=Math.min(MAX_VALUE,s.currencies.money+gain);s.stats.earned=Math.min(MAX_VALUE,s.stats.earned+gain);s.stats.peak=Math.max(s.stats.peak,e.rate);
 if(e.auto&&s.settings.auto){s.timers.auto+=dt;if(s.timers.auto>=5){s.timers.auto%=5;const candidates=NODES.filter(n=>n.max>1&&level(s,n)>0&&level(s,n)<n.max&&unlocked(s,n)).sort((a,b)=>cost(s,a,e)-cost(s,b,e));if(candidates[0]&&purchase(s,candidates[0]))events.push({type:'auto',id:candidates[0].id});}}
 return events;
}
// Price each level at its intended position along the research graph.
const reference=defaultState();
const events=[];
const waits=[5,8,14,21,30,37,44,50];
// Each research has fixed prices. Later repeatable levels target the region
// one step after acquisition; buying a new node never requires MAX levels.
// This timeline is only used to author prices, never to lock purchases.
for(const n of NODES){
 n.costs=[];
 const own=NODES.filter(p=>p.chapter===n.chapter),target=NODES.filter(p=>p.chapter===Math.min(7,n.chapter+1));
 const progress=(n.id-own[0].id)/Math.max(1,own.length-1);
 const finish=n.longTerm?(n.id===31?79.2:79.6):Math.max(n.id+.15,Math.min(79.8,target[0].id+(target.length-1)*(.25+.65*progress)));
 for(let l=0;l<n.max;l++)events.push({n,l,at:l===0?n.id:n.id+(finish-n.id)*l/(n.max-1)});
}
events.sort((a,b)=>a.at-b.at||a.n.id-b.n.id);
for(const {n,l,at} of events){
 const chapter=NODES[Math.min(79,Math.floor(at)-1)].chapter;
 const wait=n.id===1?10:waits[chapter]*(n.max===1?1.5:1);
 const before=economy(reference);reference.currencies.money=before.rate*wait*.5;
 const e=economy(reference);const effective=e.rate*(1+e.burst/e.interval);
 const raw=effective*wait/(e.discount*e.scaling**l);
 const unit=10**Math.max(0,Math.floor(Math.log10(raw))-2);
 const price=Math.ceil(raw/unit)*unit;
 n.costs[l]=Math.max(l>0?n.costs[l-1]*1.12:1,price);
 n.baseCost=n.costs[0];reference.levels[n.id]=l+1;
}
export function effectText(n){const v=+n.value.toFixed(3),growth=+n.addGrowth.toFixed(3);
 switch(n.type){
 case 'add':return `기본 생산 +${v.toLocaleString()} $/s · 생산 ×${growth} / Lv.`;
 case 'mul':return `생산 ×${v}${n.max>1?' / Lv.':''}`;
 case 'addBoost':return `기본 생산 합계 ×${v}`;
 case 'count':return `구매한 노드마다 생산 +${+(v*100).toFixed(1)}%`;
 case 'levels':return `총 연구 레벨마다 생산 +${+(n.value*100).toFixed(2)}%${n.max>1?' / Lv.':''}`;
 case 'balance':return `생산 ×(1 + ${v} × log₁₀(1 + $))`;
 case 'power':return `생산식 지수 +${+(v-1).toFixed(3)}`;
 case 'discount':return `모든 연구 비용 −${Math.round((1-v)*100)}%`;
 case 'scaling':return `반복 연구 가격 증가율 −${+((1-v)*100).toFixed(1)}%`;
 case 'burst':return `캐시 주기마다 생산량 ${v}초분 추가`;
 case 'burstBoost':return `캐시 보너스 ×${v}`;
 case 'burstSpeed':return `캐시 주기 −${Math.round((1-v)*100)}%`;
 case 'recursive':return `생산 ×(${v}^Lv × (1 + ${+n.recursiveStep.toFixed(3)} × Lv))`;
 case 'automation':return '5초마다 구매한 반복 연구 자동 구매';
 }
}
export function validateSave(input,now=Date.now()){
 if(!input||typeof input!=='object'||input.version!==1)throw Error('지원하지 않는 저장 버전입니다.');
 const revision=input.contentVersion??1;
 if(!Number.isInteger(revision)||revision<1||revision>3)throw Error('지원하지 않는 콘텐츠 버전입니다.');
 const s=defaultState();
 const num=(v,max=MAX_VALUE)=>typeof v==='number'&&Number.isFinite(v)&&v>=0&&v<=max;
 if(!input.currencies||!num(input.currencies.money)||!input.levels||Array.isArray(input.levels)||typeof input.levels!=='object')throw Error('저장 데이터가 올바르지 않습니다.');
 s.currencies.money=input.currencies.money;
 for(const [key,value] of Object.entries(input.levels)){
  const n=byId.get(Number(key)),previousMax=LEGACY_MAX[Number(key)]||1,limit=revision<3?previousMax:n?.max;
  if(!n||String(n.id)!==key||!Number.isInteger(value)||value<0||value>limit)throw Error('연구 레벨이 올바르지 않습니다.');
  if(value){
   if(revision<3&&n.longTerm)s.levels[key]=Math.min(n.max,Math.ceil((n.id===31?.016:.023)/n.value));
   else s.levels[key]=revision<3?Math.min(n.max,Math.ceil(value*n.max/previousMax)):value;
  }
 }
 for(const n of NODES)if(level(s,n)&&!unlocked(s,n))throw Error('선행 연구가 누락되었습니다.');
 const required=['earned','spent','purchases','seconds','peak'];
 if(!input.stats||!required.every(k=>num(input.stats[k])))throw Error('통계가 올바르지 않습니다.');
 for(const k of required)s.stats[k]=input.stats[k];
 for(const k of ['offlineSeconds','offlineEarned','offlineEffectiveSeconds']){if(input.stats[k]!==undefined&&!num(input.stats[k]))throw Error('오프라인 통계가 올바르지 않습니다.');s.stats[k]=input.stats[k]??0;}
 for(const k of ['cache','auto'])if(num(input.timers?.[k],30))s.timers[k]=input.timers[k];
 for(const k of ['motion','touch','haptic','auto','purchaseCheat','hudCollapsed','panelCollapsed'])if(typeof input.settings?.[k]==='boolean')s.settings[k]=input.settings[k];
 if(['short','scientific','engineering'].includes(input.settings?.format))s.settings.format=input.settings.format;
 if(input.camera&&['x','y','scale'].every(k=>Number.isFinite(input.camera[k]))&&input.camera.scale>=.035&&input.camera.scale<=1.7&&Math.abs(input.camera.x)<1e6&&Math.abs(input.camera.y)<1e6)s.camera={...input.camera};
 const stamp=v=>typeof v==='number'&&Number.isFinite(v)&&v>=0&&v<=now;
 s.savedAt=stamp(input.savedAt)?input.savedAt:now;
 const e=economy(s);s.offline={since:s.savedAt,through:s.savedAt,rate:Math.min(MAX_VALUE,e.rate*(1+e.burst/e.interval))};
 const o=input.offline;
 if(revision===3&&o&&stamp(o.since)&&stamp(o.through)&&o.through>=o.since&&num(o.rate))s.offline={since:o.since,through:o.through,rate:o.rate};
 return s;
}
