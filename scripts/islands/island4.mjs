// Island 4 (고대 유적지): one big desert island, a highland plateau in the
// north-west over the lowland, an oasis, ruins and rune stones. Local
// coordinates, scaled.
export const DESIGN={
 // reefs:0 — no scattered reefs: the reef zone round this island is drawn by hand (satellites.mjs, seabed.mjs), and
 // the island's frame takes it in (frameReefs)
 id:4,name:'섬 4',theme:'ruins',origin:[-10500,-2700],scale:1.42,eps:16,reefs:0,frameReefs:true,
 outline:[[160,900],[260,560],[640,300],[1200,340],[1500,180],[2100,160],[2560,420],[2520,760],[2700,1040],[2600,1440],[2200,1740],[1700,1700],[1480,1860],[1000,1800],[720,1960],[420,1720],[480,1400],[160,1260]],
 sandPieces:['a'],
 label:[2300,60],
 duneCount:12,
 tree:{root:[2420,1180],gate:[380,760],marks:[{at:[1900,1500],free:'side'},{at:[1400,1000],free:'all'},{at:[700,560],free:'side'}],count:60,seed:31},
 landmarks:[{kind:'dig',max:10},{kind:'ziggurat',max:20},{kind:'cistern',max:10}],
 extras:{plateau:[{pts:[[160,900],[260,560],[640,300],[1200,340],[1320,520],[1180,760],[1260,1000],[1040,1140],[760,1120],[520,1260],[480,1400],[160,1260]]}]},
 sandHoles:[[[1500,1160],[1760,1080],[1960,1200],[1900,1440],[1640,1500],[1460,1360]]],
 terrain:[
  {c:'oasis',pts:[[1500,1160],[1760,1080],[1960,1200],[1900,1440],[1640,1500],[1460,1360]]},
  {c:'oasis2',pts:[[1600,1200],[1780,1160],[1860,1300],[1740,1400],[1580,1340]]},
  {c:'high',pts:[[300,840],[420,560],[760,420],[1100,440],[1200,640],[1100,860],[900,1000],[600,1060],[380,1000]]},
  {c:'high2',pts:[[460,800],[600,620],[880,580],[1020,700],[940,860],[700,920],[500,900]]},
 ],
 beach:[[1500,1600,2400,2200,34],[2300,300,2900,1500,30]],
 sandBands:[],
 rockZones:[],
};
