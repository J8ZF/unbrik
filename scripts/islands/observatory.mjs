// The central observatory of AXIOM. Centre (0,0) in local units; the game
// places it at OBS_CENTER. Angles in degrees, 0 = east, clockwise on screen.
//
// Three kinds of output:
//  svg      the still architecture (arms, city, inner sanctuary, eye) for the
//           painted back layer
//  under    the machinery below it, drawn on a canvas under the painted layer:
//           floor and dark pillars (still), gear rings (turning), the sunken
//           ring and the giant machine out in the water (turning, reef-grey)
//  orbit    what floats above the sea round it, drawn on a canvas over the map:
//           light tracks, the big neon ring, the rim half rings, and six relic
//           islands in orbit, each carrying a station lit in its island's colour
import {rng,f1,blobPath,rectPts,inside} from './art.mjs';

export const OBS_CENTER=[-2900,1150];
export const OBS_RADIUS=2450;// the giant machine's reach

const C={stone:'#d0dcd7',light:'#e5eae1',edge:'#849e9f',mid:'#a8bcba',dark:'#263e4b',machine:'#1b303e',steel:'#466575',blue:'#2463a5',roof:'#387bbb',cyan:'#73d3ed',moss:'#647d59',mossDark:'#445e4a',win:'#6d757c'};
// reef-grey tones for what lies under the water, nearest the surface last
const DEEP=['#142230','#182a38','#1d3242','#223a4b'],DEEP_LIGHT='#2f6a80',DEEP_LIGHT2='#3f8aa6';
const R=d=>d*Math.PI/180;
const p=(r,a)=>[Math.cos(R(a))*r,Math.sin(R(a))*r];
const xy=q=>q.map(n=>+n.toFixed(2)).join(',');

// ---------- SVG string helpers (the still picture and the island bitmaps) ----------
const circle=(r,fill,stroke='none',sw=1,extra='')=>`<circle r="${r}" fill="${fill}" stroke="${stroke}" stroke-width="${sw}" ${extra}/>`;
const ngon=(n,r,fill,stroke='none',sw=1,offset=0)=>`<polygon points="${Array.from({length:n},(_,i)=>xy(p(r,i*360/n+offset))).join(' ')}" fill="${fill}" stroke="${stroke}" stroke-width="${sw}"/>`;
const rect=(x,y,w,h,fill,stroke='none',sw=1)=>`<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="${fill}" stroke="${stroke}" stroke-width="${sw}"/>`;
const arc=(r,w,a,b,fill,stroke='none',sw=1)=>{const q=[p(r+w/2,a),p(r+w/2,b),p(r-w/2,b),p(r-w/2,a)],large=b-a>180?1:0;
 return `<path d="M${xy(q[0])} A${r+w/2},${r+w/2} 0 ${large} 1 ${xy(q[1])} L${xy(q[2])} A${r-w/2},${r-w/2} 0 ${large} 0 ${xy(q[3])}Z" fill="${fill}" stroke="${stroke}" stroke-width="${sw}"/>`;};
const group=(inner,trans='',extra='')=>`<g${trans?` transform="${trans}"`:''}${extra?' '+extra:''}>${inner}</g>`;
const shape=(pts,fill,stroke='none',sw=3)=>`<polygon points="${pts.map(q=>f1(q[0])+','+f1(q[1])).join(' ')}" fill="${fill}" stroke="${stroke}" stroke-width="${sw}" stroke-linejoin="round"/>`;
const chamfer=(r,c)=>[[-r+c,-r],[r-c,-r],[r,-r+c],[r,r-c],[r-c,r],[-r+c,r],[-r,r-c],[-r,-r+c]];
const moss=(seed=0)=>`<path d="M-42,-8l18,-10 10,7 11,-9 20,6 9,18 -16,4 -7,-6 -18,10 -11,-6 -13,3Z" fill="${seed%2?C.moss:C.mossDark}" opacity=".76"/>`;
const fins=(n,r,h,w,fill,offset=0)=>Array.from({length:n},(_,i)=>group(rect(-w/2,-r-h/2,w,h,fill),`rotate(${i*360/n+offset})`)).join('');
const flower=(x,y,s,c)=>{let o='';for(let i=0;i<5;i++){const a=i/5*6.283;o+=`<circle cx="${f1(x+Math.cos(a)*s*.55)}" cy="${f1(y+Math.sin(a)*s*.55)}" r="${f1(s*.48)}" fill="${c}"/>`;}return o+`<circle cx="${f1(x)}" cy="${f1(y)}" r="${f1(s*.36)}" fill="#f2c94c"/>`;};
const tree=(r,x,y,Rr,cols=['#235a36','#2f7345','#418d52'])=>`<path d="${blobPath(r,x,y,Rr,9,.1)}" fill="${cols[0]}"/><path d="${blobPath(r,x+(r()-.5)*Rr*.2,y+(r()-.5)*Rr*.2,Rr*.74,8,.12)}" fill="${cols[1]}"/><path d="${blobPath(r,x+(r()-.5)*Rr*.3,y+(r()-.5)*Rr*.3,Rr*.42,7,.15)}" fill="${cols[2]}"/>`;
const bush=(r,x,y,Rr,c0='#2a6b3f',c1='#3f8a4f')=>`<path d="${blobPath(r,x,y,Rr,7,.12)}" fill="${c0}"/><path d="${blobPath(r,x,y,Rr*.55,6,.15)}" fill="${c1}"/>`;
const mossPatch=(r,x,y,n=3,cols=['#5b8a45','#6e9f50','#4f7d3d'])=>{let s='';for(let i=0;i<n;i++){const Rr=22+r()*26;s+=`<path d="${blobPath(r,x+(r()-.5)*70,y+(r()-.5)*50,Rr,7,.18)}" fill="${cols[i%3]}"/>`;}return s;};
const leafFan=(r,x,y,len,count,cols,rib)=>{let s='';const a0=r()*6.283;for(let i=0;i<count;i++){const a=a0+i/count*6.283+(r()-.5)*.5,L=len*(.72+r()*.32),w=L*.17,dx=Math.cos(a),dy=Math.sin(a),px=-dy,py=dx;
 s+=`<path d="M${f1(x)} ${f1(y)}Q${f1(x+dx*L*.45+px*w*1.6)} ${f1(y+dy*L*.45+py*w*1.6)} ${f1(x+dx*L)} ${f1(y+dy*L)}Q${f1(x+dx*L*.45-px*w*1.6)} ${f1(y+dy*L*.45-py*w*1.6)} ${f1(x)} ${f1(y)}Z" fill="${cols[i%cols.length]}"/>`;
 if(rib)s+=`<path d="M${f1(x)} ${f1(y)}L${f1(x+dx*L*.86)} ${f1(y+dy*L*.86)}" stroke="${rib}" stroke-width="${len>60?2.6:1.8}" stroke-linecap="round"/>`;}return s;};

// ---------- buildings: the same footprints, different structures ----------
// The round temple of the study: a drum with twelve pillars and a blue dome.
const roundTemple=(r=45,blue=true)=>{let s=circle(r,C.stone,C.edge,1.8)+circle(r*.83,'#344b54')+circle(r*.72,C.light);
 for(let i=0;i<12;i++)s+=group(rect(-r*.07,-r*.95,r*.14,r*.22,C.light),`rotate(${i*30})`);
 return s+circle(r*.5,blue?C.blue:C.mid)+circle(r*.37,blue?C.roof:C.stone)+arc(r*.36,2,194,305,blue?'#6fa0c5':C.light);};
// An octagonal column carrying a round dome: a spire.
const spire=r=>{let s=ngon(8,r,C.stone,C.edge,2,22.5)+ngon(8,r*.8,C.light,'none',0,22.5);
 for(let i=0;i<8;i++)s+=group(rect(-r*.09,-r*1.04,r*.18,r*.2,C.mid),`rotate(${i*45+22.5})`);
 return s+circle(r*.56,C.blue)+circle(r*.42,C.roof)+arc(r*.4,2,194,305,'#6fa0c5')+circle(r*.13,C.light);};
// A roofless tower: a thick ring wall round an open floor.
const openTower=r=>{let s=circle(r,C.stone,C.edge,2)+circle(r*.8,C.light)+circle(r*.66,'#1f3340')+circle(r*.52,'#2a4150')+circle(r*.26,'#344b54');
 for(let i=0;i<4;i++)s+=group(rect(-r*.11,-r*1.1,r*.22,r*.42,C.stone,C.edge,1.4)+rect(-r*.05,-r*1.04,r*.1,r*.3,C.light),`rotate(${i*90+45})`);
 return s+rect(-r*.06,-r*.66,r*.12,r*.4,C.mid);};
// A watchtower: a square with its corners cut, galleries reaching out on four sides.
const watchtower=r=>{let s='';for(let i=0;i<4;i++)s+=group(rect(-r*.24,-r*1.3,r*.48,r*.36,C.stone,C.edge,1.5)+rect(-r*.16,-r*1.24,r*.32,r*.2,C.light)+rect(-r*.06,-r*1.19,r*.12,r*.1,C.win),`rotate(${i*90})`);
 s+=shape(chamfer(r,r*.32),C.stone,C.edge,2)+shape(chamfer(r*.8,r*.26),C.light,'none',0)+shape(chamfer(r*.56,r*.18),'#263e4b','none',0)+shape(chamfer(r*.3,r*.1),C.mid,'none',0);
 for(let i=0;i<4;i++)s+=group(rect(-r*.05,-r*.74,r*.1,r*.1,C.win),`rotate(${i*90+45})`);return s;};
// An astronomical dome with its slit open, a telescope inside.
const astroDome=r=>circle(r,C.stone,C.edge,2)+circle(r*.86,C.light)+Array.from({length:8},(_,i)=>group(rect(-r*.06,-r*.98,r*.12,r*.16,C.mid),`rotate(${i*45})`)).join('')
 +circle(r*.66,C.blue)+circle(r*.56,C.roof)+arc(r*.55,2,194,305,'#6fa0c5')+rect(-r*.09,-r*.64,r*.18,r*.66,'#17262f')+rect(-r*.045,-r*.5,r*.09,r*.42,C.light)+circle(r*.1,C.light);
// A garden terrace: lawn, paths, flowers, moss and a tree on a cut-corner platform.
const garden=(r,seed=1)=>{const q=rng(seed*31+7);let s=shape(chamfer(r,r*.25),C.stone,C.edge,2)+shape(chamfer(r*.9,r*.22),C.light,'none',0)+shape(chamfer(r*.76,r*.18),'#3d6d48','#6cae76',2);
 s+=rect(-r*.08,-r*.76,r*.16,r*1.52,C.light)+rect(-r*.76,-r*.08,r*1.52,r*.16,C.light)+circle(r*.16,C.mid);
 s+=tree(q,-r*.42,-r*.4,r*.24)+bush(q,r*.42,r*.44,r*.14)+bush(q,-r*.38,r*.4,r*.1);
 for(let i=0;i<4;i++)s+=flower(r*.46+(q()-.5)*r*.22,-r*.42+(q()-.5)*r*.24,r*.05+q()*r*.02,q()<.7?'#f4f1e6':'#f4d9a8');
 s+=`<path d="${blobPath(q,r*.3,-r*.1,r*.1,6,.2)}" fill="#6e9f50"/><path d="${blobPath(q,-r*.2,r*.22,r*.08,6,.2)}" fill="#5b8a45"/>`;return s;};
const KINDS={round:roundTemple,spire,open:openTower,watch:watchtower,astro:astroDome,garden:r=>garden(r)};
const building=(kind,r,seed=0)=>kind==='garden'?garden(r,seed):KINDS[kind](r);

// ---------- path helpers (shapes the canvases draw) ----------
// A painter collects shapes into groups by style, in draw order, as SVG path
// data: the game turns each group into one Path2D.
function painter(){const groups=[];return {groups,add(d,f,s='none',w=0){const g=groups.at(-1);if(g&&g.f===f&&g.s===s&&g.w===w)g.d+=d;else groups.push({d,f,s,w});}};}
const M=(deg=0,tx=0,ty=0)=>{const c=Math.cos(R(deg)),s=Math.sin(R(deg));return [c,s,-s,c,tx,ty];};
const mul=(a,b)=>[a[0]*b[0]+a[2]*b[1],a[1]*b[0]+a[3]*b[1],a[0]*b[2]+a[2]*b[3],a[1]*b[2]+a[3]*b[3],a[0]*b[4]+a[2]*b[5]+a[4],a[1]*b[4]+a[3]*b[5]+a[5]];
const ap=(m,[x,y])=>[m[0]*x+m[2]*y+m[4],m[1]*x+m[3]*y+m[5]];
const ang=m=>Math.atan2(m[1],m[0])*180/Math.PI;
const I=M();
const dPoly=(pts,m=I)=>'M'+pts.map(q=>xy(ap(m,q))).join('L')+'Z';
const dRect=(x,y,w,h,m=I)=>dPoly([[x,y],[x+w,y],[x+w,y+h],[x,y+h]],m);
const dNgon=(n,r,offset=0,m=I)=>dPoly(Array.from({length:n},(_,i)=>p(r,i*360/n+offset)),m);
const dCircle=(r,m=I,cw=true)=>{const [cx,cy]=ap(m,[0,0]);return `M${xy([cx-r,cy])}A${r},${r} 0 1 ${cw?1:0} ${xy([cx+r,cy])}A${r},${r} 0 1 ${cw?1:0} ${xy([cx-r,cy])}Z`;};
const dRing=(r0,r1,m=I)=>dCircle(r1,m,true)+dCircle(r0,m,false);
const dArc=(r,w,a,b,m=I)=>{const o=ang(m),c=ap(m,[0,0]),P=(rr,aa)=>{const q=p(rr,aa+o);return [q[0]+c[0],q[1]+c[1]];},large=b-a>180?1:0;
 return `M${xy(P(r+w/2,a))}A${r+w/2},${r+w/2} 0 ${large} 1 ${xy(P(r+w/2,b))}L${xy(P(r-w/2,b))}A${r-w/2},${r-w/2} 0 ${large} 0 ${xy(P(r-w/2,a))}Z`;};

// The game's shadow: a thick translucent dark band hugging a silhouette. One path,
// one stroke, so overlaps do not darken twice.
const RIM='#04080c',RIM_W=44;
const ARM_PTS=[[-126,-340],[-126,-472],[-164,-510],[-164,-652],[-124,-692],[-124,-810],[-82,-859],[-82,-969],[-47,-1004],[47,-1004],[82,-969],[82,-859],[124,-810],[124,-692],[164,-652],[164,-510],[126,-472],[126,-340]];
function cityRim(){let d='';
 for(let i=0;i<4;i++)d+=dPoly(ARM_PTS,M(i*90));
 for(let q=0;q<4;q++){d+=dArc(644,99,14+q*90,76+q*90);
  for(let i=0;i<3;i++){const a=28+i*17+q*90,[x,y]=p(724,a);d+=dRect(-46,-82,92,164,mul(M(0,x,y),M(a+90)));d+=dCircle(38,M(0,...p(747,a)));}}
 return `<path d="${d}" fill="none" stroke="${RIM}" stroke-opacity=".5" stroke-width="${RIM_W}" stroke-linejoin="round"/>`;}

// ---------- the still architecture ----------
function architecture(){
 let arms=cityRim();
 const ARM_BIG=['astro','spire','watch','garden'],ARM_SMALL=['open','garden','spire','watch'];
 for(let i=0;i<4;i++){
  let arm=`<path d="M-126 -340 L-126 -472 -164 -510 -164 -652 -124 -692 -124 -810 -82 -859 -82 -969 -47 -1004 47 -1004 82 -969 82 -859 124 -810 124 -692 164 -652 164 -510 126 -472 126 -340Z" fill="${C.stone}" stroke="${C.edge}" stroke-width="3"/>`;
  arm+=rect(-94,-750,188,324,'#a5b8b6')+rect(-83,-743,166,305,C.light)+rect(-58,-740,116,255,'#263e4b')+rect(-40,-735,80,255,C.blue)+rect(-29,-735,58,255,C.roof);
  arm+=rect(-145,-617,290,49,C.mid)+rect(-149,-602,298,17,C.light)+rect(-144,-546,288,17,C.light);
  arm+=group(rect(-52,-115,104,230,C.stone,C.edge,2)+rect(-36,-92,72,155,C.light)+rect(-21,-88,42,110,C.blue),`translate(130 -550) rotate(28)`);
  arm+=group(rect(-48,-106,96,212,C.stone,C.edge,2)+rect(-33,-83,66,164,C.light),`translate(-124 -675) rotate(-24)`);
  arm+=group(building(ARM_BIG[i],99,i+1),`translate(0 -805) rotate(${-i*90})`)+group(building(ARM_SMALL[i],45,i+5),`translate(0 -951) rotate(${-i*90})`);
  for(const side of [-1,1])for(let k=0;k<6;k++)arm+=rect(side===1?88:-111,-744+k*43,23,28,C.light);
  arm+=group(moss(i),`translate(-66 -850) rotate(${i*19})`)+group(moss(i+1),`translate(113 -609) scale(.8)`);
  arms+=group(arm,`rotate(${i*90})`);}
 // Concentric inhabited terraces, split into districts by the cross.
 let city='';
 const T620=['spire','open','garden','watch'],T560=['garden','round','spire'],T747=['watch','open','astro'];
 for(let q=0;q<4;q++){
  let d='';
  d+=arc(644,99,14,76,C.stone,C.edge,3)+arc(641,71,15.2,74.8,'#9fb4b2')+arc(643,58,15.8,74.2,C.light);
  d+=arc(565,26,14,76,C.stone,C.edge,2)+arc(485,97,19,71,C.stone,C.edge,3)+arc(485,73,20,70,C.light)+arc(387,42,24,66,C.stone,C.edge,2);
  for(let i=0;i<7;i++){const a=18+i*8,outer=p(652,a),inner=p(474,a+2);
   d+=group(rect(-26,-43,52,86,'#bacbc4',C.edge,1.5)+rect(-18,-37,36,55,i%3===0?C.blue:C.light),`translate(${xy(outer)}) rotate(${a+90})`);
   if(i%2===0)d+=group(building(T620[(i/2+q)%4],31+i%3*4,q*7+i),`translate(${xy(p(620,a+2))}) rotate(${a-90})`);
   d+=group(rect(-25,-36,50,72,C.mid,C.edge,1.5)+rect(-17,-26,34,52,i%2===0?C.blue:C.light),`translate(${xy(inner)}) rotate(${a+90})`);}
  for(let i=0;i<3;i++){const a=26+i*19;
   d+=group(rect(-18,-97,36,194,C.stone,C.edge,2)+rect(-7,-88,14,178,C.mid),`translate(${xy(p(542,a))}) rotate(${a+90})`);
   d+=group(building(T560[(i+q)%3],52,q*3+i+20),`translate(${xy(p(560,a))}) rotate(${a-90})`);
   d+=group(moss(i+q),`translate(${xy(p(683,a+3))}) rotate(${a}) scale(.85)`);}
  for(let i=0;i<3;i++){const a=28+i*17;
   let out=rect(-46,-82,92,164,C.stone,C.edge,2)+rect(-32,-70,64,120,C.light)+rect(-23,-61,46,69,C.blue);
   out+=group(rect(-26,-53,52,106,C.stone,C.edge,2),`translate(48 15) rotate(-22)`);
   d+=group(out,`translate(${xy(p(724,a))}) rotate(${a+90})`);
   d+=group(building(T747[(i+q*2)%3],35,q*5+i+40),`translate(${xy(p(747,a))}) rotate(${a-90})`);}
  d+=group(moss(q),`translate(${xy(p(498,56))}) rotate(60) scale(1.4)`)+group(moss(q+1),`translate(${xy(p(606,36))}) rotate(-25)`);
  city+=group(d,`rotate(${q*90})`);}
 // Inner sanctuary: eight promenades and eight different towers round the eye.
 const INNER=['spire','watch','garden','open','astro','watch','spire','garden'];
 let inner=circle(397,'none',C.dark,38)+circle(397,'none',C.steel,2)+circle(347,C.machine,C.edge,3);
 inner+=circle(252,C.stone,C.edge,3)+circle(229,'#344e57')+circle(205,C.light)+fins(32,231,35,12,C.light,5.625);
 for(let i=0;i<8;i++){inner+=group(rect(-20,-408,40,192,C.stone,C.edge,2)+rect(-8,-405,16,144,C.mid),`rotate(${i*45})`);
  inner+=group(building(INNER[i],i%2===0?48:33,i+60),`translate(${xy(p(374,i*45))}) rotate(${i*45-90})`);}
 inner+=circle(182,C.dark,C.edge,2)+circle(172,'none',C.cyan,2);
 let iris='';for(let i=0;i<8;i++)iris+=group(`<path d="M-27 -159L17 -159 44 -132 31 -110 -8 -114 -26 -137Z" fill="${C.steel}" stroke="${C.edge}" stroke-width="1.5"/>`,`rotate(${i*45})`);
 inner+=iris+ngon(8,134,C.stone,C.edge,3,22.5)+ngon(8,123,'#173241','#537c8e',2,22.5)+ngon(8,113,'#07111a','#04090d',3,22.5)+ngon(8,109,'none','#72bed6',1,22.5);
 return arms+city+inner;}

// ---------- the machinery under the painted layer ----------
function machinery(){
 const layers=[];
 // floor and the sunken rings the city stands on (still)
 {const P=painter();
  P.add(dCircle(770),'#0e1e28',C.steel,3);P.add(dRing(719.5,746.5),'#34596c');P.add(dRing(746.5,751.5),'#9caeaf');
  P.add(dCircle(572),'#101f28',C.edge,3);P.add(dRing(551.5,554.5),C.cyan);
  layers.push({spin:0,groups:P.groups});}
 // the ring of arcs under the districts, turning
 {const P=painter();for(let i=0;i<16;i++)P.add(dArc(668,44,i*22.5+1,i*22.5+20),C.dark,C.steel,2);layers.push({spin:-2,groups:P.groups});}
 // the dark pillars between the arms: bent slopes going down into the water,
 // the deep end sea-dark, the top light; a hub and two struts on each
 {const P=painter(),ms=Array.from({length:8},(_,i)=>M(i*45+22.5)),each=f=>ms.forEach(m=>f(m,mul(m,M(0,0,-828)),mul(m,M(24,103,-822)),mul(m,M(-30,-110,-794))));
  each(m=>P.add(dPoly([[-80,-905],[-62,-950],[-30,-1015],[66,-1015],[96,-950],[118,-905]],m),'#13232f','#2d4150',2));
  each(m=>P.add(dPoly([[-104,-782],[-110,-860],[-92,-905],[106,-905],[122,-860],[104,-782]],m),C.machine,C.steel,2.5));
  each(m=>P.add(dPoly([[-78,-640],[-96,-700],[-104,-782],[104,-782],[96,-700],[78,-640]],m),'#2c4557',C.steel,2.5));
  each(m=>P.add(dRect(-34,-997,68,204,m),'#314d60'));each(m=>P.add(dRect(-16,-982,32,170,m),'#0a1b27'));each(m=>P.add(dRect(-4,-975,8,135,m),C.cyan));
  each((m,h,s1,s2)=>{P.add(dRect(-32,-135,64,270,s1),C.machine,C.steel,2);P.add(dRect(-27,-115,54,230,s2),C.machine,C.steel,2);});
  each((m,h,s1,s2)=>{P.add(dRect(-18,-125,36,200,s1),'#4b6677');P.add(dRect(-11,-100,22,165,s2),'#4b6677');});each((m,h,s1)=>P.add(dRect(-3,-110,6,150,s1),C.cyan));
  each((m,h)=>P.add(dNgon(8,97,0,h),C.machine,C.steel,3));each((m,h)=>P.add(dCircle(75,h),'#0b1b27',C.edge,3));each((m,h)=>P.add(dRing(49.5,64.5,h),C.blue));each((m,h)=>P.add(dRing(52.5,55.5,h),C.cyan));each((m,h)=>P.add(dCircle(31,h),'#193747',C.steel,3));
  layers.push({spin:0,groups:P.groups});}
 // the gear ring under the terraces, turning
 {const P=painter();for(let i=0;i<32;i++)P.add(dArc(726,32,i*11.25+1,i*11.25+8.8),C.machine);for(let i=0;i<32;i++)P.add(dArc(735,3,i*11.25+1,i*11.25+7.5),C.cyan);
  for(let i=0;i<24;i++)P.add(dRect(-10.5,-788.5,21,49,M(i*15+7.5)),C.steel);layers.push({spin:3,groups:P.groups});}
 return layers;}

// What lies under the water round the observatory, in reef-grey: the sunken
// outer ring of overlapping blocks, and the giant machine beyond it. Dark
// pillars continue down from the observatory into the ring.
function sunken(){
 const layers=[],q=rng(77);
 {const P=painter();
  P.add(dRing(1160,1440),DEEP[0]);
  const blocks=Array.from({length:28},(_,i)=>({a:i*360/28+(q()-.5)*4,w:8+q()*6,r0:1180+q()*40,r1:1380+q()*60,t:1+i%3}));
  for(const t of [1,2,3])for(const b of blocks)if(b.t===t)P.add(dArc((b.r0+b.r1)/2,b.r1-b.r0,b.a-b.w/2,b.a+b.w/2),DEEP[t]);
  for(let i=0;i<14;i++){const a=i*360/14+13+(q()-.5)*8,r0=1150+q()*60;P.add(dPoly([p(r0,a-4),p(r0+150+q()*90,a-1+q()*2),p(r0+40,a+6)]),DEEP[3]);}
  for(let i=0;i<12;i++)P.add(dRect(-44,-1300,88,200,M(i*30+15)),DEEP[2]);for(let i=0;i<12;i++)P.add(dRect(-30,-1180,60,110,M(i*30+15)),DEEP[1]);for(let i=0;i<12;i++)P.add(dRect(-5,-1270,10,120,M(i*30+15)),DEEP_LIGHT);
  for(let i=0;i<24;i++)P.add(dRect(-14,-1412,28,22,M(i*15+7.5)),DEEP_LIGHT);
  layers.push({spin:-1.2,groups:P.groups});}
 {const P=painter();
  const G8=Array.from({length:8},(_,i)=>M(i*45+22.5)),G4=Array.from({length:4},(_,i)=>M(i*90));
  for(const m of G8){P.add(dRect(-80,-2260,160,1300,m),DEEP[1]);P.add(dRect(-190,-2300,380,130,m),DEEP[1]);}for(const m of G4)P.add(dRect(-60,-2150,120,620,m),DEEP[1]);
  for(const m of G8){P.add(dRect(-150,-1700,300,220,m),DEEP[2]);P.add(dRect(-116,-1330,232,90,m),DEEP[2]);P.add(dNgon(8,150,0,mul(m,M(0,0,-2060))),DEEP[2]);P.add(dRect(-40,-110,80,220,mul(m,M(32,150,-1500))),DEEP[2]);P.add(dRect(-40,-110,80,220,mul(m,M(-32,-150,-1500))),DEEP[2]);}
  for(const m of G4){P.add(dRect(-130,-2230,260,110,m),DEEP[2]);P.add(dNgon(8,70,0,mul(m,M(0,0,-1880))),DEEP[2]);}
  for(const m of G8)P.add(dNgon(8,100,0,mul(m,M(0,0,-2060))),'#0d161e');for(const m of G4)P.add(dNgon(8,42,0,mul(m,M(0,0,-1880))),'#0d161e');
  for(const m of G8)P.add(dRect(-14,-2200,28,1060,m),DEEP_LIGHT);for(const m of G8)P.add(dRect(-6,-2200,12,1060,m),DEEP_LIGHT2);
  layers.push({spin:.6,groups:P.groups});}
 {const P=painter();
  P.add(dRing(1850,1990),DEEP[1]);
  for(let i=0;i<16;i++)P.add(dRect(-70,-2080,140,150,M(i*22.5+11.25)),DEEP[2]);for(let i=0;i<16;i++)P.add(dRect(-40,-1860,80,80,M(i*22.5+11.25)),DEEP[0]);for(let i=0;i<16;i++)P.add(dRect(-26,-2060,52,14,M(i*22.5+11.25)),DEEP_LIGHT2);
  P.add(dRing(1675,1725),DEEP[0]);for(let i=0;i<32;i++)P.add(dRect(-16,-1740,32,60,M(i*11.25)),DEEP[2]);
  layers.push({spin:-.9,groups:P.groups});}
 {const P=painter();P.add(dRing(2300,2360),DEEP[0]);for(let i=0;i<12;i++)P.add(dRect(-90,-2380,180,110,M(i*30)),DEEP[1]);layers.push({spin:.4,groups:P.groups});}
 return layers;}

// The iris blades round the eye, turning.
function iris(){const P=painter();for(let i=0;i<8;i++)P.add(dPoly([[-27,-159],[17,-159],[44,-132],[31,-110],[-8,-114],[-26,-137]],M(i*45)),C.steel,C.edge,1.5);return [{spin:5,groups:P.groups}];}
// Canvas versions of the towers, for the upper ring (fewer shapes than the painted ones).
const MOSS_PTS=[[-42,-8],[-24,-18],[-14,-11],[-3,-20],[17,-14],[26,4],[10,8],[3,2],[-15,12],[-26,6],[-39,9]];
function towerShapes(kind,r,m){const o=[],a=(d,f,s='none',w=0)=>o.push([d,f,s,w]);
 if(kind==='spire'){a(dNgon(8,r,22.5,m),C.stone,C.edge,2);a(dNgon(8,r*.8,22.5,m),C.light);a(dCircle(r*.56,m),C.blue);a(dCircle(r*.42,m),C.roof);a(dCircle(r*.13,m),C.light);}
 else if(kind==='watch'){let g='';for(let i=0;i<4;i++)g+=dRect(-r*.24,-r*1.3,r*.48,r*.36,mul(m,M(i*90)));a(g,C.stone,C.edge,1.5);a(dPoly(chamfer(r,r*.32),m),C.stone,C.edge,2);a(dPoly(chamfer(r*.8,r*.26),m),C.light);a(dPoly(chamfer(r*.56,r*.18),m),'#263e4b');a(dPoly(chamfer(r*.3,r*.1),m),C.mid);}
 else if(kind==='astro'){a(dCircle(r,m),C.stone,C.edge,2);a(dCircle(r*.86,m),C.light);let g='';for(let i=0;i<8;i++)g+=dRect(-r*.06,-r*.98,r*.12,r*.16,mul(m,M(i*45)));a(g,C.mid);a(dCircle(r*.66,m),C.blue);a(dCircle(r*.56,m),C.roof);a(dRect(-r*.09,-r*.64,r*.18,r*.66,m),'#17262f');a(dRect(-r*.045,-r*.5,r*.09,r*.42,m),C.light);a(dCircle(r*.1,m),C.light);}
 else if(kind==='open'){a(dCircle(r,m),C.stone,C.edge,2);a(dCircle(r*.8,m),C.light);a(dCircle(r*.66,m),'#1f3340');a(dCircle(r*.52,m),'#2a4150');a(dCircle(r*.26,m),'#344b54');let g='';for(let i=0;i<4;i++)g+=dRect(-r*.11,-r*1.1,r*.22,r*.42,mul(m,M(i*90+45)));a(g,C.stone,C.edge,1.4);}
 else{a(dPoly(chamfer(r,r*.25),m),C.stone,C.edge,2);a(dPoly(chamfer(r*.9,r*.22),m),C.light);a(dPoly(chamfer(r*.76,r*.18),m),'#3d6d48','#6cae76',2);a(dRect(-r*.08,-r*.76,r*.16,r*1.52,m)+dRect(-r*.76,-r*.08,r*1.52,r*.16,m),C.light);
  a(dCircle(r*.24,mul(m,M(0,-r*.42,-r*.4))),'#235a36');a(dCircle(r*.16,mul(m,M(0,-r*.38,-r*.44))),'#2f7345');a(dCircle(r*.14,mul(m,M(0,r*.42,r*.44))),'#2a6b3f');a(dCircle(r*.08,mul(m,M(0,r*.46,r*.4))),'#3f8a4f');
  let g='';for(const [u,v] of [[.44,-.44],[.52,-.36],[.4,-.32]])g+=dCircle(r*.045,mul(m,M(0,r*u,r*v)));a(g,'#f4f1e6');}
 return o;}
// towers stand apart, so drawing the k-th shape of every tower, k by k, keeps each tower's own order
function towersD(P,list){const all=list.map(([kind,r,m])=>towerShapes(kind,r,m)),n=Math.max(...all.map(t=>t.length));for(let k=0;k<n;k++)for(const t of all)if(t[k])P.add(...t[k]);}
// The upper ring over the sunken one: a dark inner ring turning one way, and three
// curved blocks of white architecture turning the other, each bulging out in a
// cross at its middle, with a black stripe carrying a broken ring of light.
// The upper ring, out where the relic islands fly: they pass half over it. A dark
// inner ring turning one way; outside it three short, thick curved blocks of white
// architecture turning the other, each with a big cross-shaped platform bulging
// out of its middle, inward over the dark ring and outward under the islands.
export const UPPER={inner:[1470,1545],band:[1560,1860],chunks:[60,180,300],half:34};
function upperRing(){
 const layers=[],[R0,R1]=UPPER.band,RM=(R0+R1)/2,W=R1-R0,cs=UPPER.chunks,h=UPPER.half;
 {const P=painter();P.add(dRing(1470,1545),C.machine,C.steel,3);P.add(dRing(1490,1525),'#243d4e');for(let i=0;i<48;i++)P.add(dRect(-7,-1542,14,66,M(i*7.5)),'#0a1b27');for(let i=0;i<24;i++)P.add(dRect(-3,-1512,6,12,M(i*15+7.5)),C.cyan);
  layers.push({spin:-1.5,groups:P.groups});}
 // the cross at each block's middle: a radial bar from over the dark ring out past the band, a tangential bar across it
 const CROSS=[[1470,2000,-100,100],[1620,1800,-300,300]],cx=(c,[u0,u1,v0,v1])=>dRect(u0,v0,u1-u0,v1-v0,M(c));
 // the rim first, then the band, the stripe and its lights (chasing along the stripe), then what stands on it
 const base=painter();let rim='';
 for(const c of cs)rim+=dArc(RM,W,c-h,c+h)+dArc(RM,W*.56,c-h-3,c-h)+dArc(RM,W*.56,c+h,c+h+3)+CROSS.map(b=>cx(c,b)).join('');
 base.add(rim,'none',RIM,RIM_W);base.groups[0].alpha=.5;
 for(const c of cs){base.add(dArc(RM,W,c-h,c+h),C.stone,C.edge,3);base.add(dArc(RM,W*.56,c-h-3,c-h),C.stone,C.edge,3);base.add(dArc(RM,W*.56,c+h,c+h+3),C.stone,C.edge,3);}
 for(const c of cs)base.add(dArc(RM,W-44,c-h+1,c+h-1),'#9fb4b2');for(const c of cs)base.add(dArc(RM,W-76,c-h+1.5,c+h-1.5),C.light);
 for(const c of cs)base.add(dArc(R0+42,30,c-h+4,c+h-4),C.blue);for(const c of cs)base.add(dArc(R0+42,12,c-h+4,c+h-4),C.roof);
 const RS=R1-78;for(const c of cs)base.add(dArc(RS,36,c-h+3,c+h-3),'#0a1b27',C.steel,2);for(const c of cs)base.add(dArc(RS,16,c-h+3.5,c+h-3.5),'#141f29');
 let clip='';for(const c of cs)clip+=dArc(RS,22,c-h+3.5,c+h-3.5);
 const lights=painter();for(let i=0;i<30;i++)lights.add(dArc(RS,12,i*12,i*12+5.5),C.cyan);
 layers.push({spin:1.5,groups:base.groups,sub:{clip,spin:4,groups:lights.groups}});
 const top=painter();
 for(const c of cs)for(const b of CROSS)top.add(cx(c,b),C.stone,C.edge,3);
 for(const c of cs){top.add(cx(c,[1492,1978,-78,78]),C.light);top.add(cx(c,[1642,1778,-278,278]),C.light);}
 for(const c of cs){top.add(cx(c,[1500,1580,-40,40]),C.blue);top.add(cx(c,[1890,1970,-40,40]),C.blue);top.add(cx(c,[1660,1760,-270,-200]),C.blue);top.add(cx(c,[1660,1760,200,270]),C.blue);top.add(cx(c,[1600,1820,-14,14]),C.blue);top.add(cx(c,[1600,1820,-6,6]),C.roof);}
 const BLK=[[-16,1650,12,0],[16,1650,-12,1],[-27,1770,-9,1],[27,1770,9,0],[-31,1630,16,1],[31,1630,-16,0],[-20,1800,20,0],[20,1800,-20,1]],bm=(c,[da,r,tilt])=>mul(M(c+da),M(tilt,r,0));
 for(const c of cs)for(const b of BLK)top.add(dRect(-45,-75,90,150,bm(c,b)),C.stone,C.edge,2.5);
 for(const c of cs)for(const b of BLK)if(!b[3])top.add(dRect(-31,-56,62,100,bm(c,b)),C.light);for(const c of cs)for(const b of BLK)if(b[3])top.add(dRect(-31,-56,62,100,bm(c,b)),C.blue);
 for(const c of cs)for(const [da,r,k] of [[-28,1830,1.6],[30,1590,1.4],[-8,1840,1.2]])top.add(dPoly(MOSS_PTS.map(([x,y])=>[x*k,y*k]),mul(M(c+da),M(c+da+40,r,0))),C.moss);
 const at=(c,da,r)=>mul(M(c+da),M(c+da-90,r,0));
 towersD(top,cs.flatMap(c=>[['astro',110,at(c,0,RM)],['spire',60,at(c,0,1950)],['open',54,at(c,0,1500)],['watch',70,at(c,-24,1700)],['garden',72,at(c,24,1700)],['open',50,at(c,-12,1815)],['spire',46,at(c,12,1600)]]));
 layers.push({spin:1.5,groups:top.groups});
 return layers;}

// ---------- the relic islands ----------
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
// ground [fill,stroke], two terraces, the island's lamp colour
export const THEME=[
 {g:['#2f5b3b','#4f8a5a'],t1:['#3d6d48','#6cae76'],t2:['#4f7d40','#8fc25c'],hi:'#b9f36d'},
 {g:['#4b8a4f','#7bb86a'],t1:['#5e9c56','#93c874'],t2:['#7fb45f','#b2d98a'],hi:'#4fe0cf'},
 {g:['#2b5f5b','#46908a'],t1:['#346f68','#5aa39b'],t2:['#3f8078','#6db7ad'],hi:'#ff6b86'},
 {g:['#b89660','#d8bb87'],t1:['#c7a872','#e2c99a'],t2:['#d6bb87','#eddbb3'],hi:'#ffbf4a'},
 {g:['#5f666c','#7c848b'],t1:['#6c737a','#8d959c'],t2:['#7c838a','#9ea6ad'],hi:'#8fcf5a'},
 {g:['#6b6f74','#8a9096'],t1:['#7b8187','#9ba2a8'],t2:['#8b9298','#aab1b7'],hi:'#5fa8ff'},
];
const ROCK=[['#4b535b','#646d76'],['#58616a','#717b84'],['#666f78','#808a93'],['#757e87','#909aa2'],['#868f97','#a3acb3']];
const rocks=(r,x,y,n,size,tones=[1,2,3])=>{let s='';for(let i=0;i<n;i++){const w=size*(.6+r()*.7),h=size*(.5+r()*.6),[f,st]=ROCK[tones[i%tones.length]];s+=shape(rectPts(x+(r()-.5)*size*1.6,y+(r()-.5)*size*1.3,w,h,r()*180),f,st,2.6);}return s;};
const scalePts=(pts,k,ox,oy,r,jit=0)=>pts.map(([x,y])=>[ox+(x-ox)*k*(1+(r?(r()-.5)*jit:0)),oy+(y-oy)*k*(1+(r?(r()-.5)*jit:0))]);
export function relicIsland(i){
 const r=rng(600+i*17),T=THEME[i],land=LAND[i],hx=(r()-.5)*S*.8,hy=(r()-.5)*S*.8;
 let s='';
 // the engine under the rock, its rim showing round the land
 s+=ngon(8,292,C.machine,C.steel,3,22.5)+ngon(8,250,'#243d4e','none',0,22.5);
 for(let k=0;k<8;k++)s+=group(rect(-9,-282,18,34,C.cyan),`rotate(${k*45+22.5})`);
 s+=fins(16,270,22,12,C.steel,11.25);
 s+=shape(scalePts(land,1.13,0,0),ROCK[0][0],ROCK[0][1]);if(i===0)s+=shape(scalePts(ISLET,1.2,310,165),ROCK[0][0],ROCK[0][1]);
 // a thick translucent dark rim round the floating rock: the game's shadow, parting the island from what is below
 const rim=pts=>`<polygon points="${pts.map(q=>f1(q[0])+','+f1(q[1])).join(' ')}" fill="none" stroke="#04080c" stroke-opacity=".5" stroke-width="44" stroke-linejoin="round"/>`;
 s+=rim(scalePts(land,1.13,0,0));if(i===0)s+=rim(scalePts(ISLET,1.2,310,165));
 s+=shape(land,T.g[0],T.g[1]);if(i===0)s+=shape(ISLET,T.g[0],T.g[1]);
 s+=shape(scalePts(land,.7,hx,hy,r,.05),T.t1[0],T.t1[1])+shape(scalePts(land,.42,hx,hy,r,.06),T.t2[0],T.t2[1]);
 if(i===0){s+=shape([[90,150],[200,100],[250,170],[160,260],[40,240]],'#c9af7f','#e1cb9d')+shape([[120,170],[190,150],[200,200],[140,220]],'#d6be8e','#e9d8ae');s+=rocks(r,-215,-120,6,110,[0,1,2]);}
 else if(i===1){s+=shape([[-100,-90],[80,-130],[200,-50],[150,70],[-20,90],[-130,20]],'#c9af7f','#e1cb9d');s+=shape([[-30,-70],[90,-90],[170,-30],[130,50],[10,60],[-60,0]],'#2a8c86','#4fb8b0')+shape([[10,-50],[90,-60],[130,-20],[100,30],[30,30],[-10,-5]],'#4fd1c0','none',0);s+=rocks(r,230,-110,4,90,[2,3]);}
 else if(i===2){s+=shape(rectPts(120,-110,150,70,-30),'#a07840','#c49a5a')+shape(rectPts(160,-60,90,120,20),'#8c6a3a','#b08a4e')+shape(rectPts(60,-140,80,60,10),'#b08a4e','#d2ad6a');s+=rocks(r,-230,80,4,100,[1,2]);}
 else if(i===3){for(const [x,y,w,h,a,c] of [[-150,-120,170,30,0,'#c9cfd3'],[60,-150,120,30,0,'#bcc3c8'],[-190,-20,30,150,0,'#c9cfd3'],[-170,120,110,30,0,'#bcc3c8'],[150,110,120,30,0,'#c9cfd3'],[190,-40,30,120,0,'#bcc3c8'],[20,150,70,34,-70,'#b3bbc1'],[-60,-200,90,26,25,'#b3bbc1']])s+=shape(rectPts(x,y,w,h,a),c,'#e2e6e9',2.2);
  s+=shape(rectPts(-110,-110,36,36,0),'#d5dadd','#e9edef',2)+shape(rectPts(170,120,36,36,0),'#d5dadd','#e9edef',2);s+=rocks(r,220,120,5,96,[2,3,4]);}
 else if(i===4){s+=shape(rectPts(0,40,420,36,-12),'#3a4046','#4a5157',2)+shape(rectPts(-40,-60,36,300,78),'#3a4046','#4a5157',2);
  for(const [x,y,w,h,a,t] of [[-160,-130,120,80,20,4],[80,-160,100,70,-25,3],[180,40,100,64,15,4],[-130,130,90,100,-40,2],[60,150,120,54,30,3]])s+=shape(rectPts(x,y,w,h,a),ROCK[t][0],ROCK[t][1]);
  s+=shape(rectPts(130,-60,30,190,-62),'#9aa1a7','#b7bdc2')+shape(rectPts(-40,-90,24,24,0),'#9aa1a7','#b7bdc2',2);}
 else{s+=rocks(r,-200,-90,5,110,[0,1,2])+rocks(r,160,150,4,100,[1,2]);s+=shape([[-120,-40],[60,-90],[170,-20],[120,100],[-60,110],[-150,40]],'#9aa0a6','#b8bec4');s+=shape(rectPts(90,60,60,36,-15),'#3b7fc4','#6fa9dd',2);}
 // the station: an octagonal platform on a machine ring, two wings, a dome, the lamp (dark until the island is done)
 const sx=-hx*.4,sy=-hy*.4;
 const station=ngon(8,96,C.stone,C.edge,3,22.5)+circle(70,C.machine,C.steel,3)+circle(58,'none',C.cyan,3)
  +group(rect(-30,-60,60,120,C.stone,C.edge,2)+rect(-18,-44,36,70,C.light)+rect(-12,-38,24,30,C.blue),'translate(88 -40) rotate(30)')
  +group(rect(-26,-56,52,112,C.stone,C.edge,2)+rect(-16,-40,32,66,C.light),'translate(-80 50) rotate(-40)')
  +fins(8,84,18,14,C.light,22.5)+roundTemple(42)+ngon(8,16,'#0b1b27',C.edge,1.5,22.5);
 let nature='';
 if(i===0){nature+=tree(r,-120,80,78)+tree(r,-60,150,62)+tree(r,-170,160,54)+tree(r,60,-190,58)+tree(r,120,-150,46);
  nature+=leafFan(r,180,-60,118,6,['#4f9a4f','#3f8644'],'#2c6136')+leafFan(r,-200,-30,96,6,['#4f9a4f','#3f8644'],'#2c6136')+leafFan(r,-20,-120,70,6,['#4f9a4f','#3f8644'],'#2c6136');
  for(let k=0;k<4;k++)nature+=bush(r,60+(r()-.5)*90,-60+(r()-.5)*60,18+r()*12);
  for(let k=0;k<5;k++)nature+=flower(10+(r()-.5)*80,120+(r()-.5)*50,9+r()*4,r()<.75?'#f4f1e6':'#f4d9a8');nature+=mossPatch(r,-200,-100,3);}
 else if(i===1){nature+=leafFan(r,-170,-120,118,7,['#9cc455','#78a843'],'#4f7a32')+leafFan(r,-220,60,100,7,['#9cc455','#78a843'],'#4f7a32')+leafFan(r,140,130,108,7,['#9cc455','#78a843'],'#4f7a32');
  for(let k=0;k<3;k++)nature+=leafFan(r,-20+(r()-.5)*160,10+(r()-.5)*40,34,7,['#b8bf73','#9fae5e'],null);nature+=shape(rectPts(60,-110,96,12,-25),'#8b7357','none',0);}
 else if(i===2){const Mp=['#8f2d49','#b8365c','#d9476d'];nature+=tree(r,-150,-60,84,Mp)+tree(r,-60,110,70,Mp)+tree(r,180,80,66,Mp)+tree(r,40,-150,56,Mp);
  for(let k=0;k<3;k++)nature+=leafFan(r,-200+(r()-.5)*60,140+(r()-.5)*40,42,6,['#5ab0a4','#3f8f85'],null);nature+=mossPatch(r,150,-90,2,['#6e9a68','#5a8560','#7fae73']);}
 else if(i===3){for(let k=0;k<5;k++){const a=k*72+20,[x,y]=p(150,a);nature+=group(rect(-12,-34,24,68,ROCK[2][0],ROCK[2][1],2.4)+rect(-4,-20,8,30,T.hi)+rect(-2,-16,4,22,'#fff3d6'),`translate(${x.toFixed(1)} ${y.toFixed(1)}) rotate(${a+90})`);}
  nature+=leafFan(r,-200,140,44,7,['#b8bf73','#9fae5e'],null)+leafFan(r,200,-150,40,7,['#b8bf73','#9fae5e'],null);}
 else if(i===4){const Mo=['#6f9a3f','#4f7a32','#86b04a'];nature+=mossPatch(r,-140,-100,4,Mo)+mossPatch(r,150,40,3,Mo)+mossPatch(r,-90,150,3,Mo)+mossPatch(r,60,-150,2,Mo);nature+=tree(r,-220,60,58)+bush(r,120,150,26,'#4f7a32','#6f9a3f');}
 else{const cube=(x,y,w,h,a,dome)=>{let c=shape(rectPts(x,y,w,h,a),'#f1f4f5','#c4ccd2',2.2);const d=a*Math.PI/180,cs=Math.cos(d),sn=Math.sin(d);
   for(let k=0;k<Math.floor(w/26);k++){const u=-w/2+16+k*26,v=h/2-9;c+=shape(rectPts(x+cs*u-sn*v,y+sn*u+cs*v,12,7,a),C.win,'none',0);}
   if(dome)c+=`<circle cx="${(x+cs*(w*.2)).toFixed(1)}" cy="${(y+sn*(w*.2)-h*.1).toFixed(1)}" r="${dome}" fill="${C.blue}"/><circle cx="${(x+cs*(w*.2)).toFixed(1)}" cy="${(y+sn*(w*.2)-h*.1).toFixed(1)}" r="${dome*.55}" fill="${C.roof}"/>`;return c;};
  nature+=cube(-70,-130,120,70,-12,22)+cube(40,-70,90,60,8,0)+cube(-160,-10,80,90,20,18)+cube(130,-130,70,50,-30,14)+cube(-40,160,120,56,5,20)+cube(170,70,60,46,40,0)+cube(-150,90,70,50,-20,14)+cube(100,150,80,50,15,0)+cube(190,-40,56,70,0,12);
  nature+=tree(r,-200,110,46)+bush(r,90,120,22);}
 s+=nature+group(station,`translate(${sx.toFixed(1)} ${sy.toFixed(1)})`);
 const E=372;
 return {svg:`<svg xmlns="http://www.w3.org/2000/svg" viewBox="${-E} ${-E} ${2*E} ${2*E}" width="${2*E}" height="${2*E}">${s}</svg>`,size:2*E,lamp:[sx,sy],color:T.hi};}

// ---------- everything, placed in the world ----------
export function buildObservatory(cx=OBS_CENTER[0],cy=OBS_CENTER[1]){

 const ring=(r,n=48)=>Array.from({length:n},(_,i)=>{const [x,y]=p(r,i*360/n);return [+(cx+x).toFixed(1),+(cy+y).toFixed(1)];});
 const islands=Array.from({length:6},(_,i)=>({...relicIsland(i),orbit:{r:1960,a0:i*60+30,speed:.45},spin:i%2===0?1.6:-1.3}));
 // drifting reef triangles in the water round it, as the island sea has
 const q=rng(909),tri=[];
 for(let k=0;k<6;k++){const a=k*60+q()*20,rad=1560+q()*1000,[tx,ty]=p(rad,a);let b=q()*360,body='';const n=4+Math.floor(q()*3),pts=[];
  for(let j=0;j<n;j++){const d=50+q()*70,a1=b+30+q()*45,[x1,y1]=p(d,b),[x2,y2]=p(d*(.8+q()*.4),a1),c=['#111e29','#0c141c','#0f1a24','#0d1620'][Math.floor(q()*4)];
   const P3=[[cx+tx,cy+ty],[cx+tx+x1,cy+ty+y1],[cx+tx+x2,cy+ty+y2]];pts.push(...P3);body+=`<polygon points="${P3.map(v=>f1(v[0])+','+f1(v[1])).join(' ')}" fill="${c}" stroke="${c}" stroke-width="1"/>`;b=a1;}
  const xs=pts.map(v=>v[0]),ys=pts.map(v=>v[1]),x0=Math.floor(Math.min(...xs))-30,y0=Math.floor(Math.min(...ys))-30;
  tri.push({x0,y0,w:Math.ceil(Math.max(...xs))+30-x0,h:Math.ceil(Math.max(...ys))+30-y0,style:`animation-delay:${f1(-q()*20)}s;animation-duration:${f1(24+q()*6)}s`,body});}
 // the reef triangles stay still here (each drifting group is a composited layer on the phone)
 const svg=tri.map(t=>t.body).join('')+`<g transform="translate(${cx} ${cy})">${architecture()}</g>`;
 return {
  center:[cx,cy],radius:OBS_RADIUS,core:1020,
  svg,tri:[],
  fx:{mask:[ring(1020)],coast:[ring(1020)],depth:[{c:'#304250',pts:ring(2000)},{c:'#374b5b',pts:ring(1600)},{c:'#3f5466',pts:ring(1250)}]},
  art:{center:[cx,cy],radius:OBS_RADIUS,core:1020,halo:{r:920,c:'#1c7eb7'},
   under:[...sunken(),...machinery()],upper:upperRing(),iris:iris(),
   tracks:[433,594,804].map((r,i)=>({r,spin:[6,-3.6,2.4][i],w:.9+i*.2,gap:i*17,alpha:.56})),
   neon:{r:1120,w:3,orbit:1095,speed:8},
   islands:islands.map(i=>({svg:i.svg,size:i.size,lamp:i.lamp,color:i.color,orbit:i.orbit,spin:i.spin}))}};}
