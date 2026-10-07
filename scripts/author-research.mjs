import fs from 'node:fs';
const catalog=JSON.parse(fs.readFileSync(new URL('./rework-catalog.json',import.meta.url)));
const {ICON_NAMES}=await import('../dist/icons.js');
// Each tuple is [effect, currency, value, optional counter/source]. No global
// exponent: every multiplier, balance bonus and cache effect is visible in UI.
const effects={
1:[['mul','money',2]],2:[['add','money',2]],3:[['add','money',1],['mul','money',1.08]],4:[['mul','money',1.7]],5:[['base','money',2]],6:[['levels','money',.09,'sector']],7:[['count','money',.12]],8:[['mul','money',3]],
9:[['add','money',6]],10:[['mul','money',1.7]],11:[['levels','money',.045]],12:[['base','money',2]],13:[['mul','money',3]],14:[['base','money',2.5]],15:[['discount','money',.9]],16:[['balance','money',.12,'money']],17:[['mul','money',1.14]],18:[['cache','money',3]],19:[['balance','money',.16,'money']],20:[['mul','money',4]],
21:[['add','money',30]],22:[['unlock','coin',1]],23:[['add','coin',.3]],24:[['base','coin',1.8]],25:[['balance','money',.2,'money']],26:[['mul','money',2]],27:[['count','money',.12]],28:[['mul','coin',2]],29:[['balance','coin',.06,'money']],30:[['balance','money',.45,'coin']],31:[['mul','money',3],['mul','coin',1.8]],32:[['levels','coin',.012]],33:[['cache','both',4]],34:[['balance','money',.3,'coin'],['balance','coin',.04,'money']],
35:[['mul','money',4]],36:[['count','both',.08]],37:[['mul','money',1.9]],38:[['count','coin',.025,'money']],39:[['discount','money',.88]],40:[['count','money',.3,'coin']],41:[['levels','money',.0018]],42:[['mul','coin',1.15]],43:[['cache','money',4]],44:[['cache','coin',4]],45:[['base','coin',1.3]],46:[['balance','money',.4,'coin'],['balance','coin',.04,'money']],47:[['mul','money',4],['mul','coin',2]],
48:[['add','money',200],['mul','money',1.1]],49:[['cache','money',5]],50:[['add','coin',5]],51:[['cache','coin',5]],52:[['base','coin',1.12]],53:[['base','money',4]],54:[['levels','money',.035]],55:[['count','coin',.03]],56:[['cacheMul','both',1.12]],57:[['speed','both',.9]],58:[['cacheMul','money',1.6]],59:[['cacheMul','coin',1.6]],60:[['scaling','both',.98]],61:[['base','money',4],['base','coin',2]],
62:[['scaling','money',.98]],63:[['mul','coin',3]],64:[['cacheMul','money',1.5]],65:[['scaling','coin',.992]],66:[['mul','money',1.6]],67:[['levels','coin',.002]],68:[['count','money',.1]],69:[['recursive','coin',1.35]],70:[['discount','both',.9]],71:[['discount','coin',.88]],72:[['balance','money',.5,'coin']],73:[['scaling','money',.98]],74:[['completed','both',.5]],75:[['balance','money',.5,'coin'],['balance','coin',.055,'money']],
76:[['mul','money',1.17]],77:[['base','money',4]],78:[['levels','coin',.015]],79:[['cacheMul','both',1.4]],80:[['cacheMul','coin',1.5]],81:[['base','money',4]],82:[['scaling','coin',.97]],83:[['maxed','both',.15]],84:[['add','coin',250]],85:[['mul','money',2]],86:[['balance','coin',.065,'money']],87:[['speed','both',.85]],88:[['balance','money',.6,'coin'],['balance','coin',.06,'money']],89:[['count','money',.14,'coin']],90:[['mul','money',5],['mul','coin',3]],
91:[['mul','coin',3]],92:[['levels','money',.03]],93:[['mul','coin',1.6]],94:[['recursive','money',1.8]],95:[['count','both',.08]],96:[['balance','coin',.07,'money']],97:[['discount','money',.82]],98:[['scaling','coin',.97]],99:[['mul','money',5],['mul','coin',3]],100:[['balance','money',.7,'coin'],['balance','coin',.08,'money']],101:[['cacheMul','both',1.6]],102:[['balance','money',.7,'coin']],103:[['base','money',3],['base','coin',2]],104:[['mul','money',6],['mul','coin',4]],105:[['mul','money',2],['mul','coin',2]]
};
const newIcons=['Unit','Buffer','Counter','Summation','CommonFactor','Basis','Scalar','Transform','InnerProduct','Implication','Demux','Decoder','BufferPool','CacheLine','Writeback','Paging','BinaryHeap','Amortization','StableSort','TopologicalSort','Superscalar','LoadBalancer','Invariant','Duality','Conservation'];
let next=0;
const moneyStrength=Number(process.env.MONEY_STRENGTH||.475),lastStrength=Number(process.env.LAST_STRENGTH||.2);
const nodes=catalog.map(n=>{
 const list=effects[n.id].flatMap(([type,target,value,source])=>(target==='both'?['money','coin']:[target]).map(currency=>{
  // Authoring-only tuning, frozen into explicit effect values in the catalog.
  let tuned=value;
  const strength=currency==='money'?(n.sector===8?lastStrength:moneyStrength):Number(process.env.COIN_STRENGTH||.6);
  if(['mul','base','recursive'].includes(type)&&n.id!==1)tuned=+(value**strength).toFixed(4);
  if(['count','levels','balance','completed','maxed'].includes(type))tuned=+(value*strength).toFixed(5);
  return {type,currency,value:tuned,...(source?{source}:{})};
 }));
 return {id:n.id,name:n.name,chapter:n.sector-1,max:n.max,icon:n.old?ICON_NAMES[n.old-1]:newIcons[next++],payment:n.payment==='$'?['money']:n.payment==='¢'?['coin']:['money','coin'],effects:list,longTerm:[41,67].includes(n.id)};
});
fs.writeFileSync(new URL('../dist/research.js',import.meta.url),'// Authored research definitions. Prices are frozen separately in prices.js.\nexport const RESEARCH='+JSON.stringify(nodes,null,1)+';\n');
