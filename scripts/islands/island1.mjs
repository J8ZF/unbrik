// Island 1 layout (confirmed design). The coastline and small island are the first preview's
// (v1) polygons; zones and node positions are new.
import fs from 'node:fs';
const V1=JSON.parse(fs.readFileSync(new URL('./v1data.json',import.meta.url)));
export const COAST=V1.coast,SMALL=V1.small,CARD={w:146,h:118},LABEL=V1.label;
// [id, x, y, requires]
export const NODES=[
 [1,900,1800,[]],[2,1260,1790,[1]],[3,1000,1560,[1]],[4,1280,1560,[2]],[5,1560,1560,[4]],
 [6,800,1350,[3]],[7,1090,1330,[3]],[8,1360,1340,[4]],[9,1910,1110,[5]],[10,780,1110,[6]],
 [11,1060,1110,[7]],[12,1350,1150,[8]],[13,1950,860,[9]],[14,2170,1110,[13]],[15,800,870,[10]],
 [16,1060,880,[11]],[17,1380,880,[12]],[18,1690,830,[13]],[19,2190,1300,[14]],[20,1990,640,[18]],
 [21,830,620,[15]],[22,1030,690,[16]],[23,1580,660,[17]],[24,1790,590,[18]],[25,2220,560,[20]],
 [26,2470,540,[25]],[27,2760,560,[26]],[28,2640,1690,[19]],[29,1110,1960,[1]],[30,1270,520,[22]],
];
// Landmarks: building frames around advanced nodes, built at MAX.
// pad = frame margin around the card; extra = parts outside the frame (for checks).
export const LANDMARKS=[
 {kind:'harbor',node:9,max:10,pad:[78,58]},
 {kind:'hall',node:17,max:20,pad:[92,70]},
 {kind:'radio',node:30,max:10,pad:[62,44],dish:[176,6,58]},
 {kind:'lighthouse',node:27,max:5,oct:136},
];
// Sand: beaches along the shores marked on the v4 review — the west coast down round the
// south lobe to the bay, the cove under the north-east cape, the small island's west shore.
// [polygon, [[vertex, depth], …] along the shore, seed]
export const SAND_BANDS=[
 ['coast',[[33,0],[32,80],[31,110],[30,110],[29,230],[28,330],[27,300],[26,240],[25,190],[24,120],[23,70],[22,0]],7],
 ['coast',[[12,0],[13,85],[14,125],[15,115],[16,55],[17,0]],8],
 ['small',[[0,0],[6,80],[5,110],[4,100],[3,30]],9],
];
// Beach widening beyond the coast: [x0,x1,width] slices along the south shore.
export const BEACH=[[700,860,26],[860,1040,58],[1040,1240,44],[1240,1400,24]];
export const SMALL_BEACH=[[2480,2880,30]];
// Rock zones: rectangles are placed inside `area`; `core` lists hand-placed big blocks [cx,cy,w,h,deg].
export const ROCK_ZONES=[
 {name:'ne',area:[[2380,290],[2640,280],[3010,360],[3020,770],[2780,790],[2600,750],[2470,730],[2410,600],[2390,420]],count:34,size:[110,330],
  core:[[2760,560,300,250,-12],[2860,470,210,170,18],[2600,520,240,190,8],[2470,560,220,200,-6],[2700,690,230,120,-20],[2900,640,170,150,30]]},
 {name:'w',area:[[470,560],[700,520],[930,560],[960,700],[930,1010],[760,1050],[470,1040]],count:26,size:[90,260],
  core:[[800,620,240,190,-10],[790,870,250,200,6],[620,780,200,230,14]]},
 {name:'e',area:[[2150,1190],[2300,1060],[2425,1110],[2425,1440],[2300,1490],[2150,1440]],count:18,size:[90,240],
  core:[[2220,1330,250,200,10],[2330,1200,170,170,-18]]},
];
// Grass contour layers (v2 shapes) in the 3.0 sector colours, drawn opaque-ish.
const F=1.15,C=[1650,1150],T=([x,y])=>[Math.round(C[0]+(x-C[0])*F),Math.round(C[1]+(y-C[1])*F)],TT=l=>l.map(T);
export const TERRAIN=[
 {c:'#7fd68a',pts:TT([[860,700],[1060,600],[1300,580],[1520,600],[1760,580],[1900,660],[1880,840],[1700,980],[1500,1040],[1300,1100],[1100,1160],[940,1120],[860,960]])},
 {c:'#b9f36d',pts:TT([[980,760],[1180,680],[1420,700],[1600,720],[1660,820],[1520,920],[1300,960],[1120,980],[1000,900]])},
 {c:'#d8f78f',pts:TT([[1150,760],[1330,730],[1450,770],[1420,860],[1260,880],[1160,840]])},
 {c:'#5cc6a0',pts:TT([[900,1250],[1200,1150],[1500,1200],[1700,1340],[1520,1480],[1150,1450],[960,1400]])},
 {c:'#7fd68a',pts:TT([[1900,950],[2100,900],[2200,1100],[2120,1300],[1960,1220],[1880,1080]])},
 {c:'#b9f36d',pts:TT([[2000,600],[2300,560],[2520,610],[2420,670],[2150,690]])},
 {c:'#7fd68a',pts:TT([[2400,1540],[2530,1510],[2640,1580],[2620,1690],[2520,1740],[2410,1700]])},
];
// Island metadata for the game. Node ids are the positions above; until the 4.0
// content list is written, each position borrows a 3.x study (CONTENT maps the
// position to the research id it borrows). The coin studies sit downstream of
// BASIS, which unlocks coin.
export const ISLAND={id:1,name:'섬 1',last:30};
export const CONTENT={18:22,22:24,24:29,25:30,29:18,30:25};
