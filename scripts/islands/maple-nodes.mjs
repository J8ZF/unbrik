// 섬 3 special studies (sample canvas, 2nd round, 2026-10-10): two frame nodes, the fountain square, the observatory, the A/B pair.
// Every part is placed by hand. A drawing is written in its sample's own coordinates and moved onto the card:
// the samples tilted the card a few degrees, the game's cards are square to the screen, so each drawing turns back by that tilt.
// The game's shadow is the translucent black rim (stroke 12, .45) under each plate. Icons are white.
// Maple is not drawn as leaves: a few translucent maple-red octagons, big/middle/small with falling opacity.
import {f1} from './art.mjs';

const RIM='stroke="rgba(4,8,12,0.45)" stroke-width="12" paint-order="stroke"';
const R8='stroke="rgba(4,8,12,0.45)" stroke-width="8" paint-order="stroke"';
// a regular octagon (flat sides top and bottom), as points
const octPts=(cx,cy,r)=>Array.from({length:8},(_,i)=>{const a=(22.5+45*i)*Math.PI/180;return f1(cx+Math.cos(a)*r)+','+f1(cy+Math.sin(a)*r);}).join(' ');
const oct=(cx,cy,r,fill,op)=>`<polygon points="${octPts(cx,cy,r)}" fill="${fill}" fill-opacity="${op}"/>`;
// a faceted roof seen from above: eight triangles from the top, lit from the north (the top facets light, the bottom ones dark)
const FACET=['#2f7c70','#22625a','#1a4f48','#22625a','#2f7c70','#3f9283','#4fa392','#3f9283'];// facets centred east, SE, S, SW, W, NW, N, NE
function domeFacets(cx,cy,r,edge='#18443f',w=3){let s='';for(let i=0;i<8;i++){const a0=(22.5+45*(i-1))*Math.PI/180,a1=(22.5+45*i)*Math.PI/180;
  s+=`<polygon points="${f1(cx)},${f1(cy)} ${f1(cx+Math.cos(a0)*r)},${f1(cy+Math.sin(a0)*r)} ${f1(cx+Math.cos(a1)*r)},${f1(cy+Math.sin(a1)*r)}" fill="${FACET[i]}"/>`;}
 return s+`<polygon points="${octPts(cx,cy,r)}" fill="none" stroke="${edge}" stroke-width="${w}" stroke-linejoin="miter"/>`;}
// a birch log: pale bark, its navy marks, a cut end (sample coordinates, before the log's own turn)
const log=(tf,L,marks,cut,c)=>`<g transform="${tf}"><rect x="${-L/2}" y="-8" width="${L}" height="16" rx="2" fill="${c.bk}" ${RIM}/><rect x="${-L/2}" y="-8" width="${L}" height="16" rx="2" fill="none" stroke="${c.bks}" stroke-width="1.6"/>`+
 marks.map(([x,y,w,h])=>`<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="${c.bm}"/>`).join('')+(cut===null?'':`<ellipse cx="${cut}" cy="0" rx="4.5" ry="8" fill="${c.cut}"/>`)+'</g>';

// ---- frame nodes: rock plates, birch logs, a red plate under the card, and a lamp — dark until the study reaches MAX ----
const FRAME={
 dormant:{r1:'#17262d',r2:'#1f323a',r3:'#294049',bk:'#3a4650',bks:'#4a5864',bm:'#26323d',cut:'#4a5560',m:'#2a3540',mi:'#34505a',k1:'#4a2e36',k2:'#3e2730',k3:'#5a3640',line:'#3a2a30'},
 on:{r1:'#35506a',r2:'#4a6a8a',r3:'#6688a6',bk:'#ece8df',bks:'#b9b2a6',bm:'#1d3046',cut:'#d8c7a4',m:'#b3202f',mi:'#e2475a',k1:'#d8343e',k2:'#b3202f',k3:'#e2475a',line:'#c42633'}};
// the lamp: a red block with a white icon; unlit it is dark, at MAX it turns a brighter red
const LAMP={dead:{lb:'#222a32',li:'#2c3640',lw:'#3c4852'},off:{lb:'#3a1c23',li:'#4e2830',lw:'#7d6a6e'},lit:{lb:'#e0303f',li:'#f2737c',lw:'#ffffff'}};
const STATES={dormant:[FRAME.dormant,LAMP.dead],on:[FRAME.on,LAMP.off],max:[FRAME.on,LAMP.lit]};

// 1 (073 CLOCK): the lamp sits on the frame's top-right corner, one piece with it; a clock tower seen from the front
function clockUnder(c){return `<g transform="translate(166 219) rotate(-12)"><rect x="-113" y="-75" width="226" height="150" rx="3" fill="${c.r1}" ${RIM}/></g>`+
 `<g transform="translate(196 201) rotate(7)"><rect x="-95" y="-98" width="190" height="196" rx="3" fill="${c.r2}" ${RIM}/><rect x="-83" y="-86" width="166" height="172" fill="none" stroke="${c.r3}" stroke-width="2"/></g>`+
 log('translate(140 115) rotate(-4)',170,[[-62,-8,9,7],[-24,1,13,7],[22,-8,7,10],[52,-2,11,6]],85,c)+
 log('translate(74 205) rotate(86)',170,[[-70,0,12,8],[-30,-8,8,9],[14,-3,14,7],[60,-8,7,8]],-85,c)+
 log('translate(292 267) rotate(92)',90,[[-28,-8,10,8],[8,1,13,7]],45,c)+
 `<g transform="translate(180 205) rotate(-3)"><rect x="-98" y="-80" width="196" height="160" rx="5" fill="${c.m}" ${RIM}/><rect x="-91" y="-73" width="182" height="146" rx="2" fill="none" stroke="${c.mi}" stroke-width="2"/></g>`+
 oct(60,238,26,c.k1,.72)+oct(320,200,17,c.k2,.6)+oct(244,318,13,c.k1,.55)+oct(196,104,9,c.k3,.5);}
function clockLamp(c){return `<g transform="translate(284 106) rotate(6)"><rect x="-52" y="-52" width="104" height="104" rx="4" fill="${c.lb}" ${RIM}/><rect x="-44" y="-44" width="88" height="88" rx="2" fill="none" stroke="${c.li}" stroke-width="2"/>`+
 `<g transform="translate(0 3)"><rect x="-25" y="26" width="50" height="6" fill="${c.lw}"/><rect x="-19" y="19" width="38" height="5.5" fill="${c.lw}"/><rect x="-13" y="-11" width="26" height="28.5" fill="${c.lw}"/><rect x="-17" y="-18" width="34" height="5.5" fill="${c.lw}"/>`+
 `<polygon points="-13,-20 13,-20 0,-41" fill="${c.lw}"/><rect x="-3" y="-31" width="6" height="5" fill="${c.lb}"/><circle cx="0" cy="-44.5" r="2.6" fill="${c.lw}"/>`+
 `<circle cx="0" cy="-1" r="8.5" fill="${c.lb}"/><rect x="-1.1" y="-7" width="2.2" height="6.5" fill="${c.lw}"/><rect x="-1.1" y="-1.6" width="2.2" height="6" fill="${c.lw}" transform="rotate(-62 0 -1)"/>`+
 `<path d="M-4.5 17.5V12a4.5 4.5 0 0 1 9 0v5.5z" fill="${c.lb}"/></g></g>`;}
export function frameClock(n){const at=`translate(${n.x} ${n.y}) rotate(3) translate(-180 -205)`,under={},over={};
 for(const [k,[f,l]] of Object.entries(STATES)){under[k]=`<g transform="${at}">${clockUnder(f)}</g>`;over[k]=`<g transform="${at}">${clockLamp(l)}</g>`;}return {under,over};}

// 2 (081 LAMBDA CALCULUS): a diamond lamp off the frame, joined by a red ㄴ-shaped line; a temple front with λ in its pediment
function lambdaUnder(c,l){return `<g transform="translate(184 202) rotate(10)"><rect x="-110" y="-80" width="220" height="160" rx="3" fill="${c.r1}" ${RIM}/></g>`+
 `<g transform="translate(150 182) rotate(-6)"><rect x="-90" y="-100" width="180" height="200" rx="3" fill="${c.r2}" ${RIM}/><rect x="-78" y="-88" width="156" height="176" fill="none" stroke="${c.r3}" stroke-width="2"/></g>`+
 log('translate(112 284) rotate(-2)',180,[[-66,0,12,8],[-28,-8,8,10],[12,-2,14,7],[56,-8,8,8]],-90,c)+
 log('translate(64 226) rotate(80)',140,[[-50,-8,9,8],[-8,1,12,7],[36,-6,8,10]],-70,c)+
 log('translate(276 138) rotate(94)',110,[[-36,-8,10,9],[4,0,13,8]],55,c)+
 `<g transform="translate(170 190) rotate(4)"><rect x="-98" y="-80" width="196" height="160" rx="5" fill="${c.m}" ${RIM}/><rect x="-91" y="-73" width="182" height="146" rx="2" fill="none" stroke="${c.mi}" stroke-width="2"/></g>`+
 `<path d="M268 200H374V258" fill="none" stroke="rgba(4,8,12,0.45)" stroke-width="16" stroke-linejoin="miter"/><path d="M268 200H374V258" fill="none" stroke="${c.line}" stroke-width="7" stroke-linejoin="miter"/>`+
 `<rect x="-7" y="-7" width="14" height="14" transform="translate(268 200) rotate(45)" fill="${c.line}" stroke="rgba(4,8,12,0.45)" stroke-width="4" paint-order="stroke"/>`+
 oct(56,272,24,c.k1,.7)+oct(262,104,15,c.k2,.6)+oct(204,294,12,c.k1,.55)+oct(374,200,8,c.k3,.5)+
 `<g transform="translate(374 318)"><g transform="rotate(45)"><rect x="-46" y="-46" width="92" height="92" rx="4" fill="${l.lb}" ${RIM}/><rect x="-38" y="-38" width="76" height="76" rx="2" fill="none" stroke="${l.li}" stroke-width="2"/></g>`+
 `<g transform="translate(0 4) scale(1.12)"><rect x="-23" y="17" width="46" height="5" fill="${l.lw}"/><rect x="-20" y="11" width="40" height="5" fill="${l.lw}"/>`+
 [-17,-7.5,2,11.5].map(x=>`<rect x="${x}" y="-7" width="5.5" height="17" fill="${l.lw}"/>`).join('')+
 `<rect x="-20" y="-13" width="40" height="5" fill="${l.lw}"/><polygon points="-23,-14.5 23,-14.5 0,-31" fill="${l.lw}"/>`+
 `<text x="0" y="-16.6" text-anchor="middle" font-size="13" font-weight="700" font-family="Georgia, 'Times New Roman', serif" fill="${l.lb}">λ</text></g></g>`;}
export function frameLambda(n){const at=`translate(${n.x} ${n.y}) rotate(-4) translate(-170 -190)`,under={},over={};
 for(const [k,[f,l]] of Object.entries(STATES)){under[k]=`<g transform="${at}">${lambdaUnder(f,l)}</g>`;over[k]='';}return {under,over};}

// ---- 078 INSTRUCTION SET: a small square of grey stone — the card on a white plinth, the fountain to its north-east,
// three small white buildings with verdigris roofs round it. The ground between is stone: a few darker slabs say so. ----
// The square fits between the neighbouring cards (083 above, 077 up right, 094 down left, 092 left) and the south shore.
// The fountain's rings are not drawn here: animating anything inside the world-sized SVG sheet repaints the sheet every
// frame (v41 measured: dragging fell from ~45 to ~32 fps). They are small HTML rings of their own (compositor only), see fountainFx.
export function fountain(n){
 let s=`<g transform="translate(${n.x} ${n.y})">`;
 // the square: an outer band and the paved floor
 s+=`<polygon points="-292,-190 205,-190 240,-155 240,85 207,118 -292,118 -330,80 -330,-152" fill="#9aa1a4" ${RIM}/>`;
 s+=`<polygon points="-286,-179 200,-179 229,-150 229,80 202,107 -287,107 -319,75 -319,-147" fill="#bfc4c6"/>`;
 // slabs a shade darker (and two lighter), set one by one where nothing stands
 for(const [x,y,w,h,a,c] of [[-300,-60,34,18,0,'#acb2b4'],[-262,-26,22,14,4,'#b2b7b9'],[-150,-170,40,16,-3,'#acb2b4'],[-112,-140,18,12,0,'#b2b7b9'],
  [-40,-168,30,14,2,'#acb2b4'],[18,-150,22,12,0,'#cfd3d4'],[-136,-14,20,26,0,'#acb2b4'],[-128,40,32,16,-4,'#b2b7b9'],[-160,80,26,14,0,'#acb2b4'],
  [-58,88,40,14,2,'#acb2b4'],[22,78,24,16,0,'#b2b7b9'],[96,-4,30,14,-3,'#acb2b4'],[204,-40,18,26,0,'#b2b7b9'],[100,88,26,12,0,'#cfd3d4'],[214,40,14,20,3,'#acb2b4'],[-226,94,30,12,0,'#b2b7b9']])
  s+=`<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="${c}" transform="rotate(${a} ${x+w/2} ${y+h/2})"/>`;
 // the paved ring round the fountain, lighter
 s+=`<polygon points="${octPts(158,-100,78)}" fill="#cfd3d4"/>`;
 // temple (west, up): white walls, a gabled roof (north slope light, south slope dark), its portico and steps facing the card
 s+=`<g transform="translate(-222 -114)"><rect x="56" y="-24" width="10" height="48" fill="#c9c5ba"/><rect x="46" y="-28" width="10" height="56" fill="#e1ded4"/>`+
  `<rect x="-52" y="-32" width="100" height="64" fill="#f4f2ec" ${R8.replace('8"','10"')}/><rect x="-48" y="-28" width="84" height="28" fill="#3f9283"/><rect x="-48" y="0" width="84" height="28" fill="#22625a"/><rect x="-48" y="-2" width="84" height="4" fill="#18443f"/>`+
  [-26,-12,2,16].map(y=>`<rect x="38" y="${y}" width="8" height="8" fill="#ffffff" stroke="#c9c5ba" stroke-width="1.5"/>`).join('')+'</g>';
 // tempietto (west, down): a round drum with six columns and a faceted octagonal dome
 s+=`<g transform="translate(-232 40)"><circle cx="0" cy="0" r="40" fill="#e1ded4" ${R8.replace('8"','10"')}/><circle cx="0" cy="0" r="34" fill="#f4f2ec"/>`+
  [0,60,120,180,240,300].map(a=>`<rect x="-5" y="-5" width="10" height="10" fill="#ffffff" stroke="#c9c5ba" stroke-width="1.5" transform="rotate(${a}) translate(34 0) rotate(45)"/>`).join('')+
  domeFacets(0,0,25,'#18443f',2.4)+`<circle cx="0" cy="0" r="4.5" fill="#f6f4ee"/></g>`;
 // pavilion (east, down): a pyramid roof in four faces, a lantern, steps towards the card
 s+=`<g transform="translate(162 62)"><rect x="-48" y="-18" width="9" height="36" fill="#c9c5ba"/><rect x="-40" y="-22" width="9" height="44" fill="#e1ded4"/>`+
  `<rect x="-30" y="-30" width="60" height="60" fill="#f4f2ec" ${R8.replace('8"','10"')}/>`+
  `<polygon points="-26,-26 26,-26 0,0" fill="#4fa392"/><polygon points="26,-26 26,26 0,0" fill="#2f7c70"/><polygon points="26,26 -26,26 0,0" fill="#1a4f48"/><polygon points="-26,26 -26,-26 0,0" fill="#3f9283"/>`+
  `<rect x="-26" y="-26" width="52" height="52" fill="none" stroke="#18443f" stroke-width="2.4"/><rect x="-5" y="-5" width="10" height="10" fill="#f6f4ee" stroke="#18443f" stroke-width="1.5"/></g>`;
 // the fountain: a stone basin, its water with rings running out, the pedestal, the upper bowl with its own rings, the jet
 s+=`<g transform="translate(158 -100)"><polygon points="${octPts(0,0,66)}" fill="#868d90" ${RIM}/><polygon points="${octPts(0,0,57)}" fill="#2f8f9a"/>`+
  `<polygon points="${octPts(0,0,29)}" fill="#a3aaac" stroke="rgba(4,8,12,0.3)" stroke-width="6" paint-order="stroke"/><polygon points="${octPts(0,0,23)}" fill="#47b3bd"/>`+
  `<polygon points="${octPts(0,0,11.5)}" fill="#c3c8c9"/><circle cx="0" cy="0" r="5.5" fill="#ffffff"/>`+
  `<polygon points="16,-3.5 21,0 16,3.5" fill="#ffffff" fill-opacity=".8"/><polygon points="-16,-3.5 -21,0 -16,3.5" fill="#ffffff" fill-opacity=".8"/><polygon points="-3.5,16 0,21 3.5,16" fill="#ffffff" fill-opacity=".8"/><polygon points="-3.5,-16 0,-21 3.5,-16" fill="#ffffff" fill-opacity=".8"/></g>`;
 // the card's plinth
 s+=`<rect x="-83" y="-69" width="166" height="138" fill="#e1ded4" ${R8}/><rect x="-78" y="-64" width="156" height="128" fill="#f9f8f4"/>`;
 return s+'</g>';}

// the rings running out over the basin water and in the upper bowl: [x, y, radius, seconds, delay, ring width, opacity]
export function fountainFx(n){const x=n.x+158,y=n.y-100;return [[x,y,54,3.6,0,2.4,.85],[x,y,54,3.6,-1.2,2.4,.85],[x,y,54,3.6,-2.4,2.4,.85],[x,y,21,2.4,0,1.8,.9],[x,y,21,2.4,-1.2,1.8,.9]];}

// ---- 104 SINGULARITY: the observatory on the rock at the west island's upper-left edge — a white rotunda whose faceted
// verdigris dome opens on a lens, an annex, a chamfered terrace. Drawn as in the sample and turned round (mirrored) so the
// rotunda stands out over the rock, away from the neighbouring cards. Sample coordinates: the card's centre is (-95, 48). ----
export function astro(n){
 let s=`<g transform="translate(${n.x} ${n.y}) scale(-1 1) translate(95 -48)">`;
 s+=`<rect x="-232" y="-30" width="16" height="60" fill="#b5b1a5"/><rect x="-218" y="-40" width="16" height="80" fill="#c9c5ba"/><rect x="-204" y="-50" width="16" height="100" fill="#e1ded4"/>`+
  `<rect x="-150" y="128" width="110" height="12" fill="#e1ded4"/><rect x="-140" y="140" width="90" height="10" fill="#c9c5ba"/>`+
  `<polygon points="-160,-130 160,-130 190,-100 190,100 160,130 -160,130 -190,100 -190,-100" fill="#e1ded4" ${RIM}/>`+
  `<polygon points="-151,-118 151,-118 178,-91 178,91 151,118 -151,118 -178,91 -178,-91" fill="#f4f2ec"/>`;
 // the annex: white walls, a gabled roof, north slope light, south slope dark
 s+=`<rect x="-176" y="-114" width="132" height="88" fill="#f4f2ec" ${R8.replace('8"','10"')}/><rect x="-170" y="-108" width="120" height="38" fill="#3f9283"/><rect x="-170" y="-70" width="120" height="38" fill="#22625a"/><rect x="-170" y="-72" width="120" height="4" fill="#18443f"/>`;
 // the rotunda: drum, eight column caps, the dome in eight faces, the slit, the lens
 s+=`<circle cx="85" cy="-25" r="105" fill="#e1ded4" ${RIM}/><circle cx="85" cy="-25" r="92" fill="#f4f2ec"/>`+
  `<g transform="translate(85 -25)">${[0,45,90,135,180,225,270,315].map(a=>`<rect x="-7" y="-7" width="14" height="14" fill="#ffffff" stroke="#c9c5ba" stroke-width="2" transform="rotate(${a}) translate(98 0)"/>`).join('')}</g>`+
  domeFacets(85,-25,80,'#18443f',5)+
  `<rect x="72" y="-100" width="26" height="150" fill="#1b2730" transform="rotate(35 85 -25)"/>`+
  `<circle cx="85" cy="-25" r="31" fill="#18443f"/><circle cx="85" cy="-25" r="24" fill="#10202c"/><circle cx="85" cy="-25" r="18" fill="#2b4a5e"/><circle cx="85" cy="-25" r="11" fill="#3f6f8a"/>`+
  `<ellipse cx="78" cy="-32" rx="6" ry="3" fill="#ffffff" fill-opacity=".85" transform="rotate(-35 78 -32)"/>`;
 // the card's plate
 s+=`<rect x="-178" y="-21" width="166" height="138" fill="#e1ded4" ${R8}/><rect x="-173" y="-16" width="156" height="128" fill="#f9f8f4"/>`;
 return s+'</g>';}

// ---- A/B pair, design 2 (갈림 마름모) stood upright for the pair's places: one plate above the other, the line between them
// through a diamond that shows the choice; the link from the shared prerequisite comes into the diamond.
// A (the first study) is teal like the brush, B is maple red. Colours per state: dormant (the prerequisite not yet researched),
// open (nothing chosen), a or b (chosen). ----
const PAIR={
 dormant:{ra:'#2c3e4c',rb:'#26323d',pa:'#24343a',pai:'#2f4249',ta:'#2c3640',taw:'#5d6b76',la:'#2c3640',g1:'#24443e',g2:'#2a524a',
  pb:'#2e2a33',pbi:'#3a3540',tb:'#2c3640',tbw:'#5d6b76',lb:'#2c3640',k1:'#4a2e36',k2:'#3e2730',k3:'#5a3640',k:'#1d3046',ki:'#2c4560',split:.45,A:0,B:0},
 open:{ra:'#4a6a8a',rb:'#35506a',pa:'#2f8577',pai:'#5ab0a4',ta:'#3fa595',taw:'#ffffff',la:'#3fa595',g1:'#2f8577',g2:'#5ab0a4',
  pb:'#b3202f',pbi:'#e2475a',tb:'#e0303f',tbw:'#ffffff',lb:'#d8343e',k1:'#d8343e',k2:'#b3202f',k3:'#e2475a',k:'#1d3046',ki:'#35506a',split:1,A:0,B:0},
 a:{ra:'#4a6a8a',rb:'#35506a',pa:'#2f8577',pai:'#5ab0a4',ta:'#3fa595',taw:'#ffffff',la:'#3fa595',g1:'#2f8577',g2:'#5ab0a4',
  pb:'#26323b',pbi:'#34424d',tb:'#2c3640',tbw:'#5d6b76',lb:'#2c3640',k1:'#4a2e36',k2:'#3e2730',k3:'#5a3640',k:'#3fa595',ki:'#7fd0c2',split:0,A:1,B:0},
 b:{ra:'#4a6a8a',rb:'#35506a',pa:'#26323b',pai:'#34424d',ta:'#2c3640',taw:'#5d6b76',la:'#2c3640',g1:'#24443e',g2:'#2a524a',
  pb:'#b3202f',pbi:'#e2475a',tb:'#e0303f',tbw:'#ffffff',lb:'#d8343e',k1:'#d8343e',k2:'#b3202f',k3:'#e2475a',k:'#e0303f',ki:'#f2737c',split:0,A:0,B:1}};
export const PAIR_TINT={a:'#5fd3b8',b:'#e2475a'};
// a and b are the two studies (a first); returns the diamond's centre and the drawing per state
export function pairDiamond(a,b){
 const top=a.y<b.y?a:b,bot=top===a?b:a,hx=Math.round((a.x+b.x)/2),hy=Math.round(top.y+86+(bot.y-top.y-172)*.34);// a third of the way down: clear of the link that runs under it
 const plate=(m,rock,rot,p,pi)=>`<g transform="translate(${m.x} ${m.y})"><rect x="-108" y="-96" width="216" height="192" rx="3" fill="${rock}" transform="rotate(${rot})" ${RIM}/>`+
  `<rect x="-98" y="-86" width="196" height="172" rx="4" fill="${p}" ${R8}/><rect x="-91" y="-79" width="182" height="158" fill="none" stroke="${pi}" stroke-width="2"/></g>`;
 const tag=(x,y,fill,ink,ch)=>`<rect x="${x-16}" y="${y-16}" width="32" height="32" rx="3" fill="${fill}" ${R8}/><text x="${x}" y="${y+6}" text-anchor="middle" font-size="16" font-weight="700" font-family="ui-monospace, SFMono-Regular, Consolas, monospace" fill="${ink}">${ch}</text>`;
 const states={};
 for(const [k,c] of Object.entries(PAIR)){
  const ca=a===top?{p:c.pa,pi:c.pai,t:c.ta,tw:c.taw,l:c.la,r:c.ra,ch:'A'}:{p:c.pb,pi:c.pbi,t:c.tb,tw:c.tbw,l:c.lb,r:c.rb,ch:'B'},cb=a===top?{p:c.pb,pi:c.pbi,t:c.tb,tw:c.tbw,l:c.lb,r:c.rb,ch:'B'}:{p:c.pa,pi:c.pai,t:c.ta,tw:c.taw,l:c.la,r:c.ra,ch:'A'};
  let s='';
  // brush blobs by A, maple octagons by B (big / middle / small)
  const A=a,B=b;s+=oct(A.x-122,A.y+(A===bot?84:-84),22,c.g1,.8)+oct(A.x-96,A.y+(A===bot?104:-104),14,c.g2,.75);
  s+=oct(B.x+116,B.y+(B===top?-70:70),22,c.k1,.7)+oct(B.x+124,B.y+(B===top?36:-36),13,c.k2,.58)+oct(B.x-66,B.y+(B===top?-104:104),9,c.k3,.5);
  // the line between the plates, each half the colour of its side, over a dark casing
  s+=`<path d="M${hx} ${top.y+86}V${bot.y-86}" fill="none" stroke="rgba(4,8,12,0.45)" stroke-width="17"/><path d="M${hx} ${top.y+86}V${hy}" fill="none" stroke="${ca.l}" stroke-width="8"/><path d="M${hx} ${hy}V${bot.y-86}" fill="none" stroke="${cb.l}" stroke-width="8"/>`;
  s+=plate(top,ca.r,4,ca.p,ca.pi)+plate(bot,cb.r,-4,cb.p,cb.pi);
  s+=tag(top.x+90,top.y-72,ca.t,ca.tw,ca.ch)+tag(bot.x+90,bot.y+72,cb.t,cb.tw,cb.ch);
  // the diamond: dark with the split sign until a side is chosen, then that side's colour with its letter
  s+=`<g transform="translate(${hx} ${hy})"><rect x="-25" y="-25" width="50" height="50" rx="3" transform="rotate(45)" fill="${c.k}" ${RIM}/><rect x="-19" y="-19" width="38" height="38" transform="rotate(45)" fill="none" stroke="${c.ki}" stroke-width="2"/>`+
   (c.split?`<g transform="translate(-16.8 -16.8) scale(1.4)" fill="none" stroke="#ffffff" stroke-opacity="${c.split}" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M16 3h5v5"/><path d="M8 3H3v5"/><path d="M12 22v-8.3a4 4 0 0 0-1.172-2.872L3 3"/><path d="m15 9 6-6"/></g>`:'')+
   (c.A||c.B?`<text x="0" y="9" text-anchor="middle" font-size="25" font-weight="700" font-family="ui-monospace, SFMono-Regular, Consolas, monospace" fill="#ffffff">${c.A?'A':'B'}</text>`:'')+'</g>';
  states[k]=s;}
 return {hub:[hx,hy],states,box:[Math.min(a.x,b.x)-150,top.y-130,Math.max(a.x,b.x)+150,bot.y+130]};}

// the cards of these studies take the drawing's colours (and white icons)
export const TINT={frameClock:'#e2475a',frameLambda:'#e2475a',fountain:'#4f9d8f',astro:'#4f9d8f'};
// what each drawing covers, round the card (world units): decoration keeps out of it
export const BOX={frameClock:[-168,-172,184,140],frameLambda:[-196,-120,292,206],fountain:[-342,-202,252,130],astro:[-298,-192,146,112]};
