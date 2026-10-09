// Island 3 (단풍): east and west islands either side of a strait (the east one
// turned a little). Pink-red maples on teal grass, blue-grey rock, dark earth shores. Local coordinates, scaled; the pieces
// are cut from the outline by split.py.
export const DESIGN={
 id:3,name:'섬 3',theme:'maple',origin:[-9100,3100],scale:1.45,eps:16,
 outline:[[200,1100],[320,420],[760,250],[1100,330],[1250,160],[1800,140],[2200,300],[2340,700],[2160,960],[2360,1300],[2080,1620],[1560,1580],[1420,1820],[900,1700],[620,1860],[380,1580],[440,1380]],
 cracks:[{pts:[[1230,100],[1160,500],[1280,900],[1180,1300],[1320,1900]],w:230}],
 // the east piece turns a little so the strait is no longer a straight vertical cut
 rotate:[{at:[1800,900],ccw:22.5,shift:[230,30]}],
 label:[1900,60],
 tree:{root:[2140,560],gate:[360,1180],marks:[{at:[700,900],free:'side'},{at:[1900,1440],free:'none'},{at:[640,1560],free:'side'}],count:40,seed:9,bridge:820},
 landmarks:[{kind:'library',max:20},{kind:'mill',max:10},{kind:'pavilion',max:5}],
 sandBands:[{from:[620,1860],to:[1120,1700],depths:[0,130,180,120,0],seed:7},{from:[1420,1820],to:[2080,1620],depths:[0,110,170,90,0],seed:8}],
 beach:[[500,1500,1250,2100,30],[1300,1500,2000,2100,26]],
 // the island sits on blue-grey rock: a ledge shows above the water all round (wide, in big blocks, on the
 // upper-left of each piece), a shelf lies under the water beyond it; nothing stacked on the grass
 rockShelf:{ledge:44,shelf:210,
  blocks:[[300,420,360,250,-14],[180,760,300,230,12],[560,250,330,210,20],[1320,220,340,240,-10],[1660,120,360,230,8],[1180,540,260,220,24]],
  shelfBlocks:[[140,520,420,300,-12],[80,1000,380,280,18],[1240,60,420,300,-6],[1900,40,400,280,14],[2300,420,360,300,30]]},
 rockZones:[],
 terrain:[
  {c:'a',pts:[[320,900],[520,640],[860,560],[1140,660],[1160,1000],[1020,1300],[760,1480],[460,1400],[300,1180]]},
  {c:'b',pts:[[440,960],[640,760],[900,720],[1060,860],[1020,1120],[800,1300],[560,1260],[420,1120]]},
  {c:'c',pts:[[600,980],[760,860],[940,900],[920,1060],[760,1160],[620,1100]]},
  {c:'a',pts:[[1400,420],[1640,320],[1900,500],[2160,760],[2200,1100],[2060,1440],[1760,1540],[1460,1420],[1360,1120],[1420,760]]},
  {c:'b',pts:[[1500,620],[1760,520],[2040,840],[2100,1120],[1900,1380],[1600,1340],[1480,1060]]},
  {c:'c',pts:[[1640,760],[1860,720],[1980,960],[1860,1200],[1660,1180],[1580,960]]},
 ],
};
