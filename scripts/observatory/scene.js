/* Observatory scene. The centre is the GPT study as delivered; around it: an outer
   ring of architecture the four arms pass through, rotating half rings at the rim,
   a far larger machine under the water, and six floating relic islands in orbit.
   All native SVG in world units; z-order is explicit. */
function createObservatoryScene(){
  const C={stone:'#d0dcd7',light:'#e5eae1',edge:'#849e9f',mid:'#a8bcba',dark:'#263e4b',machine:'#1b303e',steel:'#466575',blue:'#2463a5',roof:'#387bbb',cyan:'#73d3ed',moss:'#647d59',mossDark:'#445e4a'};
  const p=(r,a)=>[Math.cos(a*Math.PI/180)*r,Math.sin(a*Math.PI/180)*r];
  const xy=q=>q.map(n=>+n.toFixed(2)).join(',');
  const circle=(r,fill,stroke='none',sw=1,extra='')=>`<circle r="${r}" fill="${fill}" stroke="${stroke}" stroke-width="${sw}" ${extra}/>`;
  const poly=(n,r,fill,stroke='none',sw=1,offset=0)=>`<polygon points="${Array.from({length:n},(_,i)=>xy(p(r,i*360/n+offset))).join(' ')}" fill="${fill}" stroke="${stroke}" stroke-width="${sw}"/>`;
  const rect=(x,y,w,h,fill,stroke='none',sw=1)=>`<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="${fill}" stroke="${stroke}" stroke-width="${sw}"/>`;
  const arc=(r,w,a,b,fill,stroke='none',sw=1)=>{
    const q=[p(r+w/2,a),p(r+w/2,b),p(r-w/2,b),p(r-w/2,a)];
    const large=b-a>180?1:0;
    return `<path d="M${xy(q[0])} A${r+w/2},${r+w/2} 0 ${large} 1 ${xy(q[1])} L${xy(q[2])} A${r-w/2},${r-w/2} 0 ${large} 0 ${xy(q[3])}Z" fill="${fill}" stroke="${stroke}" stroke-width="${sw}"/>`;
  };
  const group=(inner,trans='',extra='')=>`<g ${trans?`transform="${trans}"`:''} ${extra}>${inner}</g>`;
  const roundTemple=(r=45,blue=true)=>{
    let s=circle(r,C.stone,C.edge,1.8)+circle(r*.83,'#344b54')+circle(r*.72,C.light);
    for(let i=0;i<12;i++)s+=group(rect(-r*.07,-r*.95,r*.14,r*.22,C.light),`rotate(${i*30})`);
    s+=circle(r*.5,blue?C.blue:C.mid)+circle(r*.37,blue?C.roof:C.stone)+arc(r*.36,2,194,305,blue?'#6fa0c5':C.light);
    return s;
  };
  const moss=(seed=0)=>`<path d="M-42,-8l18,-10 10,7 11,-9 20,6 9,18 -16,4 -7,-6 -18,10 -11,-6 -13,3Z" fill="${seed%2?C.moss:C.mossDark}" opacity=".76"/>`;
  const fins=(n,r,h,w,fill,offset=0)=>Array.from({length:n},(_,i)=>group(rect(-w/2,-r-h/2,w,h,fill),`rotate(${i*360/n+offset})`)).join('');
  let defs=`<defs>
    <radialGradient id="halo"><stop stop-color="#1c7eb7" stop-opacity=".22"/><stop offset=".55" stop-color="#18709c" stop-opacity=".09"/><stop offset="1" stop-color="#1b6589" stop-opacity="0"/></radialGradient>
    <radialGradient id="fog"><stop stop-color="#819a9c" stop-opacity=".10"/><stop offset=".45" stop-color="#6a888c" stop-opacity=".04"/><stop offset="1" stop-color="#617e82" stop-opacity="0"/></radialGradient>
    <radialGradient id="subFade"><stop stop-color="#6c8089" stop-opacity=".08"/><stop offset=".67" stop-color="#6c8089" stop-opacity=".12"/><stop offset="1" stop-color="#6c8089" stop-opacity="0"/></radialGradient>
    <radialGradient id="deepGlow"><stop stop-color="#2d7fae" stop-opacity=".16"/><stop offset=".6" stop-color="#1f5f84" stop-opacity=".06"/><stop offset="1" stop-color="#1b6589" stop-opacity="0"/></radialGradient>
    <radialGradient id="pupil"><stop stop-color="#10202e"/><stop offset="1" stop-color="#03080d"/></radialGradient>
    <g id="temple">${roundTemple()}</g>
  </defs>`;
  let submerged='';
  for(let i=0;i<12;i++){
    let rib=rect(-44,-1190,88,410,'#607783')+rect(-71,-1075,142,160,'#607783')+rect(-28,-1270,56,120,'#607783');
    rib+=group(rect(-39,-95,78,190,'#607783'),`translate(74 -1100) rotate(31)`);
    rib+=group(rect(-31,-80,62,160,'#607783'),`translate(-70 -1040) rotate(-29)`);
    rib+=group(poly(8,88,'#617886')+poly(8,62,'#07121a'),`translate(0 -1154)`);
    submerged+=group(rib,`rotate(${i*30+15})`);
  }
  for(let i=0;i<16;i++)submerged+=arc(1158,39,i*22.5+1,i*22.5+19,'#697d86')+arc(1025,15,i*22.5+2,i*22.5+20,'#75878c');
  submerged+=circle(1255,'none','#617886',2)+circle(969,'none','#71868c',20)+circle(842,'none','#5e7987',32);
  for(let i=0;i<8;i++)submerged+=group(rect(-72,-1455,144,170,'#5b7281')+rect(-106,-1390,212,46,'#5b7281')+rect(-45,-1455,90,28,'#7298a9'),`rotate(${i*45+22.5})`);
  let water=group(submerged,'','id="submerged-structure" opacity=".18"')+circle(1600,'url(#subFade)');
  water+=circle(1325,'none','#598097',1.4,'opacity=".25"')+circle(1340,'none','#496b80',.7,'opacity=".22"');
  for(let i=0;i<3;i++)water+=arc(1420+i*36,1,i*80+8,i*80+145,'#376477');
  // Large, articulated mechanical base. The gaps between arms remain open water.
  let machines=circle(920,'url(#halo)');
  for(let i=0;i<8;i++){
    let m=`<path d="M-95 -637 L-125 -734 -105 -903 -67 -944 -37 -1015 37 -1015 67 -944 105 -903 125 -734 95 -637Z" fill="${C.machine}" stroke="${C.steel}" stroke-width="3"/>`;
    m+=rect(-34,-997,68,204,'#314d60')+rect(-16,-982,32,170,'#0a1b27')+rect(-4,-975,8,135,C.cyan);
    m+=group(poly(8,97,C.machine,C.steel,3)+circle(75,'#0b1b27',C.edge,3)+circle(57,'none',C.blue,15)+circle(54,'none',C.cyan,3)+circle(31,'#193747',C.steel,3),`translate(0 -828)`);
    m+=group(rect(-32,-135,64,270,C.machine,C.steel,2)+rect(-18,-125,36,200,'#4b6677')+rect(-3,-110,6,150,C.cyan),`translate(103 -822) rotate(24)`);
    m+=group(rect(-27,-115,54,230,C.machine,C.steel,2)+rect(-11,-100,22,165,'#4b6677'),`translate(-110 -794) rotate(-30)`);
    machines+=group(m,`rotate(${i*45+22.5})`);
  }
  machines+=circle(770,'#0e1e28',C.steel,3)+circle(733,'none','#34596c',27)+circle(749,'none','#9caeaf',5);
  let mechanicalRing='';
  for(let i=0;i<32;i++)mechanicalRing+=arc(726,32,i*11.25+1,i*11.25+8.8,C.machine)+arc(735,3,i*11.25+1,i*11.25+7.5,C.cyan);
  mechanicalRing+=fins(24,764,49,21,C.steel,7.5);
  machines+=group(mechanicalRing,'','data-spin="0.25"');
  for(let i=0;i<16;i++)machines+=arc(668,44,i*22.5+1,i*22.5+20,C.dark,C.steel,2);
  machines+=circle(572,'#101f28',C.edge,3)+circle(553,'none',C.cyan,3);
  // Four massive architectural arms. Interlocked platforms create the silhouette.
  let arms='';
  for(let i=0;i<4;i++){
    let arm=`<path d="M-126 -340 L-126 -472 -164 -510 -164 -652 -124 -692 -124 -810 -82 -859 -82 -969 -47 -1004 47 -1004 82 -969 82 -859 124 -810 124 -692 164 -652 164 -510 126 -472 126 -340Z" fill="${C.stone}" stroke="${C.edge}" stroke-width="3"/>`;
    arm+=rect(-94,-750,188,324,'#a5b8b6')+rect(-83,-743,166,305,C.light)+rect(-58,-740,116,255,'#263e4b')+rect(-40,-735,80,255,C.blue)+rect(-29,-735,58,255,C.roof);
    arm+=rect(-145,-617,290,49,C.mid)+rect(-149,-602,298,17,C.light)+rect(-144,-546,288,17,C.light);
    arm+=group(rect(-52,-115,104,230,C.stone,C.edge,2)+rect(-36,-92,72,155,C.light)+rect(-21,-88,42,110,C.blue),`translate(130 -550) rotate(28)`);
    arm+=group(rect(-48,-106,96,212,C.stone,C.edge,2)+rect(-33,-83,66,164,C.light),`translate(-124 -675) rotate(-24)`);
    arm+=group(roundTemple(99),`translate(0 -805)`)+group(roundTemple(45,false),`translate(0 -951)`);
    for(let side of [-1,1])for(let k=0;k<6;k++)arm+=rect(side===1?88:-111,-744+k*43,23,28,C.light);
    arm+=group(moss(i),`translate(-66 -850) rotate(${i*19})`)+group(moss(i+1),`translate(113 -609) scale(.8)`);
    arms+=group(arm,`rotate(${i*90})`);
  }
  // Concentric inhabited terraces, split into distinct districts by the cross.
  let city='';
  for(let q=0;q<4;q++){
    let district='';
    district+=arc(644,99,14,76,C.stone,C.edge,3)+arc(641,71,15.2,74.8,'#9fb4b2')+arc(643,58,15.8,74.2,C.light);
    district+=arc(565,26,14,76,C.stone,C.edge,2)+arc(485,97,19,71,C.stone,C.edge,3)+arc(485,73,20,70,C.light);
    district+=arc(387,42,24,66,C.stone,C.edge,2);
    for(let i=0;i<7;i++){
      const a=18+i*8;
      const outer=p(652,a),inner=p(474,a+2);
      district+=group(rect(-26,-43,52,86,'#bacbc4',C.edge,1.5)+rect(-18,-37,36,55,i%3===0?C.blue:C.light),`translate(${xy(outer)}) rotate(${a+90})`);
      if(i%2===0)district+=group(roundTemple(31+i%3*4),`translate(${xy(p(620,a+2))})`);
      district+=group(rect(-25,-36,50,72,C.mid,C.edge,1.5)+rect(-17,-26,34,52,i%2===0?C.blue:C.light),`translate(${xy(inner)}) rotate(${a+90})`);
    }
    for(let i=0;i<3;i++){
      const a=26+i*19;
      district+=group(rect(-18,-97,36,194,C.stone,C.edge,2)+rect(-7,-88,14,178,C.mid),`translate(${xy(p(542,a))}) rotate(${a+90})`);
      district+=group(roundTemple(52),`translate(${xy(p(560,a))})`);
      district+=group(moss(i+q),`translate(${xy(p(683,a+3))}) rotate(${a}) scale(.85)`);
    }
    // Architectural masses extend the perimeter, giving each quadrant a stepped edge.
    for(let i=0;i<3;i++){
      const a=28+i*17;
      let out=rect(-46,-82,92,164,C.stone,C.edge,2)+rect(-32,-70,64,120,C.light)+rect(-23,-61,46,69,C.blue);
      out+=group(rect(-26,-53,52,106,C.stone,C.edge,2),`translate(48 15) rotate(-22)`);
      district+=group(out,`translate(${xy(p(724,a))}) rotate(${a+90})`);
      district+=group(roundTemple(35),`translate(${xy(p(747,a))})`);
    }
    district+=group(moss(q),`translate(${xy(p(498,56))}) rotate(60) scale(1.4)`);
    district+=group(moss(q+1),`translate(${xy(p(606,36))}) rotate(-25)`);
    city+=group(district,`rotate(${q*90})`);
  }
  // Inner sanctuary: machines, colonnades, four radial promenades and the black eye.
  let inner=circle(397,'none',C.dark,38)+circle(397,'none',C.steel,2)+circle(347,C.machine,C.edge,3);
  let rotor='';
  for(let i=0;i<12;i++)rotor+=arc(332,22,i*30+2,i*30+25,C.steel)+arc(331,3,i*30+3,i*30+23,C.cyan)+arc(288,18,i*30+7,i*30+22,'#21455a');
  inner+=group(rotor,'','data-spin="-0.8"');
  inner+=circle(252,C.stone,C.edge,3)+circle(229,'#344e57')+circle(205,C.light);
  inner+=fins(32,231,35,12,C.light,5.625);
  for(let i=0;i<8;i++){
    inner+=group(rect(-20,-408,40,192,C.stone,C.edge,2)+rect(-8,-405,16,144,C.mid),`rotate(${i*45})`);
    inner+=group(roundTemple(i%2===0?48:33),`translate(${xy(p(374,i*45))})`);
  }
  inner+=circle(182,C.dark,C.edge,2)+circle(172,'none',C.cyan,2);
  let iris='';for(let i=0;i<8;i++)iris+=group(`<path d="M-27 -159L17 -159 44 -132 31 -110 -8 -114 -26 -137Z" fill="${C.steel}" stroke="${C.edge}" stroke-width="1.5"/>`,`rotate(${i*45})`);
  inner+=group(iris,'','data-spin="1.2"');
  inner+=poly(8,134,C.stone,C.edge,3,22.5)+poly(8,123,'#173241','#537c8e',2,22.5)+poly(8,113,'url(#pupil)','#04090d',3,22.5)+poly(8,109,'none','#72bed6',1,22.5);
  inner+='<g id="polyhedron"></g>';
  // Luminous tracks run both around and across built terraces.
  let orbital='';
  [433,594,804,1098].forEach((r,i)=>{let t='';for(let j=0;j<3;j++)t+=arc(r,.9+i*.2,j*120+i*17,j*120+84+i*17,C.cyan);t+=group(circle(7,'#a7edfc')+circle(19,'none','#58aaca',1),`translate(${xy(p(r,50))})`);orbital+=group(t,'',`data-spin="${[.6,-.32,.2,-.15][i]}" opacity="${i===3?.38:.56}"`);});

  /* ---------- additions ---------- */

  // The machine under the water: eight girders between the arms, four on the arm axes,
  // a layered ring of blocks and hubs. Grey through the water, with blue light bars.
  const DG='#2f3d46',DG2='#25323b',DH='#0c161d',RIM='#25323a',RIM2='#1e2a32';
  let deep='';
  for(let i=0;i<8;i++){
    let g=rect(-80,-2260,160,1340,DG)+rect(-150,-1700,300,220,DG2)+rect(-190,-2300,380,130,DG)+rect(-116,-1330,232,90,DG2);
    g+=group(poly(8,150,DG)+poly(8,100,DH),'translate(0 -2060)');
    g+=group(rect(-40,-110,80,220,DG2),'translate(150 -1500) rotate(32)')+group(rect(-40,-110,80,220,DG2),'translate(-150 -1500) rotate(-32)');
    deep+=group(g,`rotate(${i*45+22.5})`);
  }
  for(let i=0;i<4;i++)deep+=group(rect(-60,-2150,120,620,DG2)+rect(-130,-2230,260,110,DG)+group(poly(8,70,DG)+poly(8,42,DH),'translate(0 -1880)'),`rotate(${i*90})`);
  let deepRing=circle(1920,'none',DG,140);
  for(let i=0;i<16;i++)deepRing+=group(rect(-70,-2080,140,150,DG)+rect(-40,-1860,80,80,DG2),`rotate(${i*22.5+11.25})`);
  deepRing+=circle(1700,'none',DG2,50);
  for(let i=0;i<32;i++)deepRing+=group(rect(-16,-1740,32,60,DG),`rotate(${i*11.25})`);
  let deepRim=circle(2330,'none',RIM,60);
  for(let i=0;i<12;i++)deepRim+=group(rect(-90,-2380,180,110,RIM2),`rotate(${i*30})`);
  let deepLights='';
  for(let i=0;i<8;i++)deepLights+=group(rect(-14,-2200,28,1060,'#264d61')+rect(-6,-2200,12,1060,'#456471'),`rotate(${i*45+22.5})`);
  let ringLights='';
  for(let i=0;i<16;i++)ringLights+=group(rect(-26,-2060,52,14,'#396a7a'),`rotate(${i*22.5+11.25})`);
  const deepMachine=circle(2400,'url(#deepGlow)')
    +group(deep+deepLights,'','data-spin=".05"')
    +group(deepRing+ringLights,'','data-spin="-.08"')
    +group(deepRim,'','data-spin=".03"');

  // Outer ring: a machine band, four quarter rings of white architecture between the
  // arms, the arms bridging through to octagonal terminals, and two half rings turning
  // at the rim.
  let outer=circle(1215,'none',C.machine,72)+circle(1251,'none',C.steel,2)+circle(1179,'none',C.steel,2);
  for(let i=0;i<24;i++)outer+=arc(1215,48,i*15+3,i*15+11,'#0a1b27')+arc(1215,5,i*15+5,i*15+9,C.cyan);
  for(let q=0;q<4;q++){
    const a0=q*90;
    let seg=arc(1316,150,a0+9,a0+81,C.stone,C.edge,3)+arc(1316,118,a0+10.5,a0+79.5,'#9fb4b2')+arc(1316,100,a0+11,a0+79,C.light);
    seg+=arc(1262,14,a0+13,a0+77,'#263e4b');for(let k=0;k<6;k++)seg+=arc(1262,4,a0+16+k*10.5,a0+16+k*10.5+6,C.cyan);
    seg+=arc(1300,26,a0+20,a0+70,C.blue)+arc(1300,10,a0+20,a0+70,C.roof);
    for(let k=0;k<9;k++)seg+=group(rect(-12,-1382,24,22,C.light),`rotate(${a0+15+k*7.5})`);
    for(const [a,w,h,r] of [[a0+22,104,190,1316],[a0+45,130,220,1320],[a0+68,104,190,1316]])seg+=group(rect(-w/2,-h/2,w,h,C.stone,C.edge,2)+rect(-w/2+16,-h/2+14,w-32,h*.55,C.light)+rect(-w/2+26,-h/2+24,w-52,h*.3,C.blue)+rect(-w/2+16,h/2-40,w-32,22,C.mid),`translate(${xy(p(r,a))}) rotate(${a+90+(a===a0+45?0:(a<a0+45?-14:14))})`);
    seg+=group(roundTemple(52),`translate(${xy(p(1316,a0+33.5))})`)+group(roundTemple(52),`translate(${xy(p(1316,a0+56.5))})`);
    seg+=group(roundTemple(34,false),`translate(${xy(p(1362,a0+45))})`)+group(roundTemple(26,false),`translate(${xy(p(1270,a0+45))})`);
    seg+=group(moss(q),`translate(${xy(p(1290,a0+30))}) rotate(${a0+30}) scale(1.1)`)+group(moss(q+1),`translate(${xy(p(1345,a0+62))}) rotate(${a0-40})`);
    outer+=seg;
  }
  for(let i=0;i<4;i++){
    let br=rect(-66,-1500,132,520,C.stone,C.edge,3)+rect(-48,-1492,96,500,C.light)+rect(-22,-1486,44,470,C.blue)+rect(-14,-1486,28,470,C.roof);
    br+=rect(-128,-1282,256,40,C.mid)+rect(-132,-1270,264,14,C.light)+rect(-128,-1178,256,30,C.mid)+rect(-132,-1168,264,12,C.light);
    br+=group(rect(-40,-80,80,160,C.stone,C.edge,2)+rect(-26,-62,52,110,C.light),'translate(104 -1395) rotate(22)')+group(rect(-40,-80,80,160,C.stone,C.edge,2)+rect(-26,-62,52,110,C.light)+rect(-16,-52,32,60,C.blue),'translate(-104 -1395) rotate(-22)');
    let term=poly(8,100,C.stone,C.edge,3,22.5)+circle(74,C.machine,C.steel,3)+circle(60,'none',C.cyan,3)+group(roundTemple(46),'')+fins(8,86,18,16,C.light,22.5);
    br+=group(term,'translate(0 -1500)')+group(moss(i+2),'translate(-30 -1240) rotate(40)');
    outer+=group(br,`rotate(${i*90})`);
  }
  let halves='';
  for(const h of [0,180]){
    halves+=arc(1434,72,h+9,h+171,C.machine,C.steel,2.5)+arc(1434,40,h+12,h+168,'#243d4e')+arc(1414,8,h+12,h+168,'#4b6677');
    for(let k=0;k<12;k++)halves+=arc(1440,9,h+16+k*13,h+16+k*13+6,C.cyan);
    for(let k=0;k<5;k++)halves+=group(rect(-30,-1486,60,46,C.steel,C.edge,1.5)+rect(-14,-1480,28,30,'#0a1b27')+rect(-4,-1476,8,20,C.cyan),`rotate(${h+28+k*31})`);
  }
  outer+=group(halves,'','data-spin=".12"');
  let rimOrbit='';for(let j=0;j<4;j++)rimOrbit+=arc(1478,1.2,j*90+6,j*90+70,C.cyan);rimOrbit+=group(circle(8,'#a7edfc')+circle(22,'none','#58aaca',1),`translate(${xy(p(1478,6))})`);
  outer+=group(rimOrbit,'','data-spin="-.1" opacity=".5"');

  // Floating relic islands: land in the game's island style on a dark engine, carrying an
  // octagonal station, with the island's own big plants and objects as accents.
  const f1=v=>(Math.round(v*10)/10).toString();
  function rng(seed){return()=>{seed|=0;seed=seed+0x6D2B79F5|0;let t=Math.imul(seed^seed>>>15,1|seed);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296;};}
  const ptsStr=pts=>pts.map(q=>f1(q[0])+','+f1(q[1])).join(' ');
  const shape=(pts,fill,stroke='none',sw=3)=>`<polygon points="${ptsStr(pts)}" fill="${fill}" stroke="${stroke}" stroke-width="${sw}" stroke-linejoin="round"/>`;
  function smoothPath(pts){const n=pts.length;let d=`M${f1(pts[0][0])} ${f1(pts[0][1])}`;
    for(let i=0;i<n;i++){const p0=pts[(i-1+n)%n],p1=pts[i],p2=pts[(i+1)%n],p3=pts[(i+2)%n];
      const c1=[p1[0]+(p2[0]-p0[0])/6,p1[1]+(p2[1]-p0[1])/6],c2=[p2[0]-(p3[0]-p1[0])/6,p2[1]-(p3[1]-p1[1])/6];
      d+=`C${f1(c1[0])} ${f1(c1[1])} ${f1(c2[0])} ${f1(c2[1])} ${f1(p2[0])} ${f1(p2[1])}`;}
    return d+'Z';}
  const blobPath=(r,cx,cy,rad,k=8,jit=.14)=>{const a0=r()*6.283,pts=[];for(let i=0;i<k;i++){const a=a0+i/k*6.283+(r()-.5)*.35,rr=rad*(1-jit+r()*jit*2);pts.push([cx+Math.cos(a)*rr,cy+Math.sin(a)*rr]);}return smoothPath(pts);};
  const rectPts=(cx,cy,w,h,deg=0)=>{const a=deg*Math.PI/180,c=Math.cos(a),s=Math.sin(a);return [[-w/2,-h/2],[w/2,-h/2],[w/2,h/2],[-w/2,h/2]].map(([x,y])=>[cx+c*x-s*y,cy+s*x+c*y]);};
  const leafFan=(r,x,y,len,count,cols,rib)=>{let s='';const a0=r()*6.283;for(let i=0;i<count;i++){const a=a0+i/count*6.283+(r()-.5)*.5,L=len*(.72+r()*.32),w=L*.17,dx=Math.cos(a),dy=Math.sin(a),px=-dy,py=dx;
    const tip=[x+dx*L,y+dy*L],m1=[x+dx*L*.45+px*w*1.6,y+dy*L*.45+py*w*1.6],m2=[x+dx*L*.45-px*w*1.6,y+dy*L*.45-py*w*1.6];
    s+=`<path d="M${f1(x)} ${f1(y)}Q${f1(m1[0])} ${f1(m1[1])} ${f1(tip[0])} ${f1(tip[1])}Q${f1(m2[0])} ${f1(m2[1])} ${f1(x)} ${f1(y)}Z" fill="${cols[i%cols.length]}"/>`;
    if(rib)s+=`<path d="M${f1(x)} ${f1(y)}L${f1(x+dx*L*.86)} ${f1(y+dy*L*.86)}" stroke="${rib}" stroke-width="${len>60?2.6:1.8}" stroke-linecap="round"/>`;}
    return s;};
  const tree=(r,x,y,R,cols=['#235a36','#2f7345','#418d52'])=>`<path d="${blobPath(r,x,y,R,9,.1)}" fill="${cols[0]}"/><path d="${blobPath(r,x+(r()-.5)*R*.2,y+(r()-.5)*R*.2,R*.74,8,.12)}" fill="${cols[1]}"/><path d="${blobPath(r,x+(r()-.5)*R*.3,y+(r()-.5)*R*.3,R*.42,7,.15)}" fill="${cols[2]}"/>`;
  const bush=(r,x,y,R,c0='#2a6b3f',c1='#3f8a4f')=>`<path d="${blobPath(r,x,y,R,7,.12)}" fill="${c0}"/><path d="${blobPath(r,x,y,R*.55,6,.15)}" fill="${c1}"/>`;
  const flower=(x,y,s,c)=>{let o='';for(let i=0;i<5;i++){const a=i/5*6.283;o+=`<circle cx="${f1(x+Math.cos(a)*s*.55)}" cy="${f1(y+Math.sin(a)*s*.55)}" r="${f1(s*.48)}" fill="${c}"/>`;}return o+`<circle cx="${f1(x)}" cy="${f1(y)}" r="${f1(s*.36)}" fill="#f2c94c"/>`;};
  const mossPatch=(r,x,y,n=3,cols=['#5b8a45','#6e9f50','#4f7d3d'])=>{let s='';for(let i=0;i<n;i++){const R=22+r()*26;s+=`<path d="${blobPath(r,x+(r()-.5)*70,y+(r()-.5)*50,R,7,.18)}" fill="${cols[i%3]}"/>`;}return s;};
  const ROCK=[['#4b535b','#646d76'],['#58616a','#717b84'],['#666f78','#808a93'],['#757e87','#909aa2'],['#868f97','#a3acb3']];
  const rocks=(r,x,y,n,size,tones=[1,2,3])=>{let s='';for(let i=0;i<n;i++){const w=size*(.6+r()*.7),h=size*(.5+r()*.6),[f,st]=ROCK[tones[i%tones.length]];s+=shape(rectPts(x+(r()-.5)*size*1.6,y+(r()-.5)*size*1.3,w,h,r()*180),f,st,2.6);}return s;};
  const scalePts=(pts,k,ox,oy,r,jit=0)=>pts.map(([x,y])=>[ox+(x-ox)*k*(1+(r?(r()-.5)*jit:0)),oy+(y-oy)*k*(1+(r?(r()-.5)*jit:0))]);
  const S=100;
  const LAND=[
    [[-2.6,-0.4],[-2.1,-1.5],[-1.2,-2.2],[0.1,-2.5],[1.3,-2.1],[2.3,-1.6],[2.6,-0.6],[2.2,0.3],[1.4,0.6],[1.2,1.4],[1.8,2.0],[1.0,2.5],[-0.3,2.4],[-1.3,2.6],[-2.2,1.9],[-2.5,0.8]],
    [[-3.0,-0.8],[-2.2,-1.6],[-1.0,-1.9],[0.2,-1.6],[1.4,-2.1],[2.6,-1.5],[3.1,-0.5],[2.7,0.6],[1.8,0.9],[1.5,1.7],[0.6,2.0],[-0.4,1.4],[-1.4,1.9],[-2.5,1.3],[-3.1,0.3]],
    [[-2.9,-0.9],[-2.2,-2.0],[-1.0,-2.3],[-0.4,-1.4],[0.3,-1.9],[1.4,-2.4],[2.6,-1.8],[3.0,-0.6],[2.5,0.7],[1.6,1.5],[0.5,1.2],[-0.2,1.9],[-1.3,2.4],[-2.4,1.8],[-2.9,0.6]],
    [[-2.4,-1.8],[-0.8,-2.3],[0.9,-2.2],[2.2,-1.9],[2.6,-0.9],[2.3,0.2],[3.3,0.9],[3.0,1.6],[1.9,1.3],[1.2,2.1],[-0.2,2.4],[-1.6,2.2],[-2.6,1.3],[-2.8,-0.3]],
    [[-2.5,-2.0],[-0.6,-2.3],[-0.6,-1.6],[1.2,-1.7],[1.3,-2.4],[2.7,-2.2],[2.8,-0.4],[2.0,-0.2],[2.2,1.3],[1.0,1.5],[0.9,2.5],[-1.4,2.4],[-1.5,1.3],[-2.7,1.2]],
    [[-2.2,-1.4],[-1.0,-2.3],[0.6,-2.4],[2.0,-1.7],[2.5,-0.4],[2.1,0.9],[1.2,1.1],[0.9,1.9],[-0.2,2.3],[-1.6,1.9],[-2.5,0.7]],
  ].map(pts=>pts.map(([x,y])=>[x*S,y*S]));
  const ISLET=[[2.6,1.4],[3.2,1.1],[3.6,1.6],[3.3,2.2],[2.7,2.1]].map(([x,y])=>[x*S,y*S]);
  // ground [fill,stroke], terrace 1, terrace 2, station lamp colour, name
  const THEME=[
    {g:['#2f5b3b','#4f8a5a'],t1:['#3d6d48','#6cae76'],t2:['#4f7d40','#8fc25c'],hi:'#b9f36d',name:'01'},
    {g:['#4b8a4f','#7bb86a'],t1:['#5e9c56','#93c874'],t2:['#7fb45f','#b2d98a'],hi:'#4fe0cf',name:'02'},
    {g:['#2b5f5b','#46908a'],t1:['#346f68','#5aa39b'],t2:['#3f8078','#6db7ad'],hi:'#ff6b86',name:'03'},
    {g:['#b89660','#d8bb87'],t1:['#c7a872','#e2c99a'],t2:['#d6bb87','#eddbb3'],hi:'#ffbf4a',name:'04'},
    {g:['#5f666c','#7c848b'],t1:['#6c737a','#8d959c'],t2:['#7c838a','#9ea6ad'],hi:'#8fcf5a',name:'05'},
    {g:['#6b6f74','#8a9096'],t1:['#7b8187','#9ba2a8'],t2:['#8b9298','#aab1b7'],hi:'#5fa8ff',name:'06'},
  ];
  function relicIsland(i){
    const r=rng(600+i*17),T=THEME[i],land=LAND[i];
    const hx=(r()-.5)*S*.8,hy=(r()-.5)*S*.8;
    let s='';
    // engine under the rock: a dark octagon with its rim showing round the land
    s+=circle(360,'url(#halo)');
    s+=poly(8,292,C.machine,C.steel,3,22.5)+poly(8,250,'#243d4e','none',0,22.5);
    for(let k=0;k<8;k++)s+=group(rect(-9,-282,18,34,C.cyan),`rotate(${k*45+22.5})`);
    s+=fins(16,270,22,12,C.steel,11.25);
    // rock base, land, terraces
    s+=shape(scalePts(land,1.13,0,0),ROCK[0][0],ROCK[0][1]);
    if(i===0)s+=shape(scalePts(ISLET,1.2,310,165),ROCK[0][0],ROCK[0][1]);
    s+=shape(land,T.g[0],T.g[1]);
    if(i===0)s+=shape(ISLET,T.g[0],T.g[1]);
    s+=shape(scalePts(land,.7,hx,hy,r,.05),T.t1[0],T.t1[1])+shape(scalePts(land,.42,hx,hy,r,.06),T.t2[0],T.t2[1]);
    // theme ground features
    if(i===0){// sand cove, rocks
      s+=shape([[90,150],[200,100],[250,170],[160,260],[40,240]],'#c9af7f','#e1cb9d')+shape([[120,170],[190,150],[200,200],[140,220]],'#d6be8e','#e9d8ae');
      s+=rocks(r,-215,-120,6,110,[0,1,2]);
    }else if(i===1){// lagoon and beach
      s+=shape([[-100,-90],[80,-130],[200,-50],[150,70],[-20,90],[-130,20]],'#c9af7f','#e1cb9d');
      s+=shape([[-30,-70],[90,-90],[170,-30],[130,50],[10,60],[-60,0]],'#2a8c86','#4fb8b0')+shape([[10,-50],[90,-60],[130,-20],[100,30],[30,30],[-10,-5]],'#4fd1c0','none',0);
      s+=rocks(r,230,-110,4,90,[2,3]);
    }else if(i===2){// bronze ridge
      s+=shape(rectPts(120,-110,150,70,-30),'#a07840','#c49a5a')+shape(rectPts(160,-60,90,120,20),'#8c6a3a','#b08a4e')+shape(rectPts(60,-140,80,60,10),'#b08a4e','#d2ad6a');
      s+=rocks(r,-230,80,4,100,[1,2]);
    }else if(i===3){// dunes and a ruin
      for(const [x,y,w,h,a,c] of [[-150,-120,170,30,0,'#c9cfd3'],[60,-150,120,30,0,'#bcc3c8'],[-190,-20,30,150,0,'#c9cfd3'],[-170,120,110,30,0,'#bcc3c8'],[150,110,120,30,0,'#c9cfd3'],[190,-40,30,120,0,'#bcc3c8'],[20,150,70,34,-70,'#b3bbc1'],[-60,-200,90,26,25,'#b3bbc1']])s+=shape(rectPts(x,y,w,h,a),c,'#e2e6e9',2.2);
      s+=shape(rectPts(-110,-110,36,36,0),'#d5dadd','#e9edef',2)+shape(rectPts(170,120,36,36,0),'#d5dadd','#e9edef',2);
      s+=rocks(r,220,120,5,96,[2,3,4]);
    }else if(i===4){// road and slabs
      s+=shape(rectPts(0,40,420,36,-12),'#3a4046','#4a5157',2)+shape(rectPts(-40,-60,36,300,78),'#3a4046','#4a5157',2);
      for(const [x,y,w,h,a,t] of [[-160,-130,120,80,20,4],[80,-160,100,70,-25,3],[180,40,100,64,15,4],[-130,130,90,100,-40,2],[60,150,120,54,30,3]])s+=shape(rectPts(x,y,w,h,a),ROCK[t][0],ROCK[t][1]);
      s+=shape(rectPts(130,-60,30,190,-62),'#9aa1a7','#b7bdc2')+shape(rectPts(-40,-90,24,24,0),'#9aa1a7','#b7bdc2',2);
    }else{// cliffs, a terrace, a pool
      s+=rocks(r,-200,-90,5,110,[0,1,2])+rocks(r,160,150,4,100,[1,2]);
      s+=shape([[-120,-40],[60,-90],[170,-20],[120,100],[-60,110],[-150,40]],'#9aa0a6','#b8bec4');
      s+=shape(rectPts(90,60,60,36,-15),'#3b7fc4','#6fa9dd',2);
    }
    // the station: an octagonal platform on a machine ring, a blue-roofed drum, a lamp
    const station=poly(8,96,C.stone,C.edge,3,22.5)+circle(70,C.machine,C.steel,3)+circle(58,'none',C.cyan,3)
      +group(rect(-30,-60,60,120,C.stone,C.edge,2)+rect(-18,-44,36,70,C.light)+rect(-12,-38,24,30,C.blue),'translate(88 -40) rotate(30)')
      +group(rect(-26,-56,52,112,C.stone,C.edge,2)+rect(-16,-40,32,66,C.light),'translate(-80 50) rotate(-40)')
      +fins(8,84,18,14,C.light,22.5)+roundTemple(42)
      +`<g class="station" data-i="${i}" style="--hi:${T.hi}">${circle(34,'none',T.hi,4,'class="halo"')}${poly(8,16,'#0b1b27',C.edge,1.5,22.5).replace('<polygon','<polygon class="lamp"')}</g>`;
    const sx=-hx*.4,sy=-hy*.4;
    // accents: big plants and objects of the island
    let nature='';
    if(i===0){
      nature+=tree(r,-120,80,78)+tree(r,-60,150,62)+tree(r,-170,160,54)+tree(r,60,-190,58)+tree(r,120,-150,46);
      nature+=leafFan(r,180,-60,118,6,['#4f9a4f','#3f8644'],'#2c6136')+leafFan(r,-200,-30,96,6,['#4f9a4f','#3f8644'],'#2c6136')+leafFan(r,-20,-120,70,6,['#4f9a4f','#3f8644'],'#2c6136');
      for(let k=0;k<4;k++)nature+=bush(r,60+(r()-.5)*90,-60+(r()-.5)*60,18+r()*12);
      for(let k=0;k<5;k++)nature+=flower(10+(r()-.5)*80,120+(r()-.5)*50,9+r()*4,r()<.75?'#f4f1e6':'#f4d9a8');
      nature+=mossPatch(r,-200,-100,3);
    }else if(i===1){
      nature+=leafFan(r,-170,-120,118,7,['#9cc455','#78a843'],'#4f7a32')+leafFan(r,-220,60,100,7,['#9cc455','#78a843'],'#4f7a32')+leafFan(r,140,130,108,7,['#9cc455','#78a843'],'#4f7a32');
      for(let k=0;k<3;k++)nature+=leafFan(r,-20+(r()-.5)*160,10+(r()-.5)*40,34,7,['#b8bf73','#9fae5e'],null);
      nature+=shape(rectPts(60,-110,96,12,-25),'#8b7357','none',0);
    }else if(i===2){
      const M=['#8f2d49','#b8365c','#d9476d'];
      nature+=tree(r,-150,-60,84,M)+tree(r,-60,110,70,M)+tree(r,180,80,66,M)+tree(r,40,-150,56,M);
      for(let k=0;k<3;k++)nature+=leafFan(r,-200+(r()-.5)*60,140+(r()-.5)*40,42,6,['#5ab0a4','#3f8f85'],null);
      nature+=mossPatch(r,150,-90,2,['#6e9a68','#5a8560','#7fae73']);
    }else if(i===3){
      for(let k=0;k<5;k++){const a=k*72+20,[x,y]=p(150,a);nature+=group(rect(-12,-34,24,68,ROCK[2][0],ROCK[2][1],2.4)+rect(-4,-20,8,30,T.hi)+rect(-2,-16,4,22,'#fff3d6'),`translate(${x.toFixed(1)} ${y.toFixed(1)}) rotate(${a+90})`);}
      nature+=leafFan(r,-200,140,44,7,['#b8bf73','#9fae5e'],null)+leafFan(r,200,-150,40,7,['#b8bf73','#9fae5e'],null);
    }else if(i===4){
      nature+=mossPatch(r,-140,-100,4,['#6f9a3f','#4f7a32','#86b04a'])+mossPatch(r,150,40,3,['#6f9a3f','#4f7a32','#86b04a'])+mossPatch(r,-90,150,3,['#6f9a3f','#4f7a32','#86b04a'])+mossPatch(r,60,-150,2,['#6f9a3f','#4f7a32','#86b04a']);
      nature+=tree(r,-220,60,58)+bush(r,120,150,26,'#4f7a32','#6f9a3f');
    }else{
      const cube=(x,y,w,h,a,dome)=>{let c=shape(rectPts(x,y,w,h,a),'#f1f4f5','#c4ccd2',2.2);const d=(a*Math.PI/180),cs=Math.cos(d),sn=Math.sin(d);
        for(let k=0;k<Math.floor(w/26);k++){const u=-w/2+16+k*26,v=h/2-9;c+=shape(rectPts(x+cs*u-sn*v,y+sn*u+cs*v,12,7,a),'#6d757c','none',0);}
        if(dome)c+=`<circle cx="${(x+cs*(w*.2)).toFixed(1)}" cy="${(y+sn*(w*.2)-h*.1).toFixed(1)}" r="${dome}" fill="${C.blue}"/><circle cx="${(x+cs*(w*.2)).toFixed(1)}" cy="${(y+sn*(w*.2)-h*.1).toFixed(1)}" r="${dome*.55}" fill="${C.roof}"/>`;return c;};
      nature+=cube(-70,-130,120,70,-12,22)+cube(40,-70,90,60,8,0)+cube(-160,-10,80,90,20,18)+cube(130,-130,70,50,-30,14)+cube(-40,160,120,56,5,20)+cube(170,70,60,46,40,0)+cube(-150,90,70,50,-20,14)+cube(100,150,80,50,15,0)+cube(190,-40,56,70,0,12);
      nature+=tree(r,-200,110,46)+bush(r,90,120,22);
    }
    s+=nature+group(station,`translate(${sx.toFixed(1)} ${sy.toFixed(1)})`);
    return s;
  }
  let relics='';
  for(let i=0;i<6;i++)relics+=group(group(group(relicIsland(i),'',`data-satellite-spin="${i%2===0?.35:-.28}"`),'translate(1960 0)'),`rotate(${i*60+30})`);
  // Island 1 at true scale, for size comparison (toggled from the bar).
  const ISL1=window.ISLAND1_COAST||[];
  let ref='';for(const poly1 of ISL1)ref+=`<polygon points="${ptsStr(poly1)}" fill="none" stroke="#b9f36d" stroke-width="16" stroke-dasharray="40 24" opacity=".8"/>`;
  let fog='';
  [{x:-580,y:-850,rx:920,ry:440},{x:690,y:780,rx:1060,ry:460},{x:-920,y:520,rx:760,ry:340}].forEach((f,i)=>fog+=`<g data-fog="${i}"><ellipse cx="${f.x}" cy="${f.y}" rx="${f.rx}" ry="${f.ry}" fill="url(#fog)" transform="rotate(${i*27-20} ${f.x} ${f.y})"/></g>`);
  return defs+`<g id="world"><g id="deep-machine">${deepMachine}</g>${water}<g id="mechanical-foundation">${machines}</g><g id="outer-ring">${outer}</g><g id="architecture">${arms}${city}${inner}</g><g id="luminous-orbits">${orbital}</g><g id="relics" data-spin=".2">${relics}</g><g id="island-ref" style="display:none">${ref}</g><g id="sea-mist" pointer-events="none">${fog}</g></g>`;
}
if(typeof module!=='undefined')module.exports={createObservatoryScene};
