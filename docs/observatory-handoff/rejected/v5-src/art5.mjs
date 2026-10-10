// Observatory v5 — a grand white terrace laid over a dark machine.
// Top: stylobate steps, an amphitheatre of radial sectors with garden sectors,
// a tholos (blue ring, white drum, eight openings, blue cap, black eye) and a
// cluster of white Santorini blocks with blue domes; four white arms with slot
// rows, a blue panel and chevrons, each ending on a round pad with a small tholos.
// Below: a black frame, a notched machine ring with grey blocks and pale-blue
// slots, and giant notched rings turning under the sea, seen through the water.
// Outside: five octagonal island stations in a pentagon, on reefs, each beside a
// flat one-colour plant or object of its island; lit in the island's colour.
// Rules: plates have cut corners, detail boxes do not; fills only — no outlines,
// no rounded corners, no tiny dots. Tone = height: black below, grey, then whites.
import {rng,f1} from '/home/claude/unbrik/scripts/islands/art.mjs';

const R=d=>d*Math.PI/180;
const pol=(r,a)=>[r*Math.cos(R(a)),r*Math.sin(R(a))];
const pd=pts=>'M'+pts.map(p=>f1(p[0])+' '+f1(p[1])).join('L')+'Z';
const arc=(r,a0,a1,step=2)=>{const n=Math.max(1,Math.ceil(Math.abs(a1-a0)/step)),o=[];for(let i=0;i<=n;i++)o.push(pol(r,a0+(a1-a0)*i/n));return o;};
const P=(d,fill,x='')=>`<path d="${d}" fill="${fill}"${x?' '+x:''}/>`;
const C=(x,y,r,fill,x2='')=>`<circle cx="${f1(x)}" cy="${f1(y)}" r="${f1(r)}" fill="${fill}"${x2?' '+x2:''}/>`;
const band=(r0,r1,col,x='')=>`<circle r="${f1((r0+r1)/2)}" fill="none" stroke="${col}" stroke-width="${f1(r1-r0)}"${x?' '+x:''}/>`;
const tf=(u,v,a,x=0,y=0)=>{const c=Math.cos(R(a)),s=Math.sin(R(a));return [x+u*c-v*s,y+u*s+v*c];};
// sharp box in a frame turned to angle a: u (outward) u0..u1, v (sideways) v0..v1
const box=(u0,u1,v0,v1,a,x=0,y=0)=>pd([tf(u0,v0,a,x,y),tf(u1,v0,a,x,y),tf(u1,v1,a,x,y),tf(u0,v1,a,x,y)]);
// plate: the same box with its corners cut by c
const plate=(u0,u1,v0,v1,c,a,x=0,y=0)=>pd([[u0+c,v0],[u1-c,v0],[u1,v0+c],[u1,v1-c],[u1-c,v1],[u0+c,v1],[u0,v1-c],[u0,v0+c]].map(([u,v])=>tf(u,v,a,x,y)));
const ngon=(x,y,rv,n,rot=0)=>pd(Array.from({length:n},(_,i)=>pol(rv,rot+i*360/n)).map(([px,py])=>[x+px,y+py]));
// annular sector centred on c, half-angle h, with a constant linear gap at both sides
const sectG=(r0,r1,c,h,gap)=>{const g=r=>gap/2/r*180/Math.PI;return pd([...arc(r1,c-h+g(r1),c+h-g(r1)),...arc(r0,c+h-g(r0),c-h+g(r0))]);};
const ringPath=(r0,r1)=>pd(arc(r1,0,360,3).slice(0,-1))+pd(arc(r0,360,0,3).slice(0,-1));
const rnd=rng(505);

// palette — blacks, greys, whites, Santorini blues, lights, garden greens
export const K0='#07090c',K1='#10151b',K2='#1b222a',G0='#39424a',G1='#5a646d',G2='#8d98a1',G3='#b3bdc5',W0='#f7f9fa',W1='#e5eaee',W2='#d2dae0',B0='#2a5fc4',B1='#4d88e3',LIGHT='#a9dbff',PINK='#f3a1c8',LIME='#b9f36d',GRASS='#5d8c4c',GRASS2='#4b7540';
// island highlight colours
export const ISL=[{hi:'#b9f36d'},{hi:'#4fe0cf'},{hi:'#ff6b86'},{hi:'#ffbf4a'},{hi:'#b58cff'}];

const anim=[];// [id, cx, cy, deg/s, start]
function spinner(v,body,s0=0){const id='sp'+anim.length;anim.push([id,0,0,v,s0]);return `<g id="${id}">${body}</g>`;}
const hud=(x,y,txt,size,cls='hud',extra='',dy=0)=>`<g transform="translate(${f1(x)} ${f1(y)})"><g class="hs"><text y="${dy}" class="${cls}" font-size="${size}" text-anchor="middle" dominant-baseline="central" ${extra}>${txt}</text></g></g>`;

// a notched machine ring: ring r0..r1 with n radial slots cut through (evenodd),
// and blocks with cut corners standing out of its edges
function machineRing(r0,r1,n,slotW,outBlocks,inBlocks){let d=ringPath(r0,r1);for(let i=0;i<n;i++)d+=box(r0+12,r1-12,-slotW/2,slotW/2,i*360/n);
 let b='';for(let i=0;i<outBlocks;i++)b+=plate(r1-6,r1+54,-44,44,10,(i+.5)*360/outBlocks);for(let i=0;i<inBlocks;i++)b+=plate(r0-46,r0+6,-32,32,8,i*360/inBlocks);return [d,b];}
// tholos seen from above: blue ring, white drum, eight openings, blue cap
const tholos=(x,y,rb,rw,rwin,win,rt)=>{let d=C(x,y,rb,B0)+C(x,y,rw,W0);for(let k=0;k<8;k++)d+=P(box(rwin-win/2,rwin+win/2,-win/2,win/2,k*45+22.5,x,y),K0);return d+C(x,y,rt,B1);};

// ---- island plants and objects: big flat shapes, one colour each ----
const leaf=(x,y,a,L,w,fill)=>{const [tx,ty]=tf(L,0,a,x,y),[m1x,m1y]=tf(L*.45,w*1.6,a,x,y),[m2x,m2y]=tf(L*.45,-w*1.6,a,x,y);
 return `<path d="M${f1(x)} ${f1(y)}Q${f1(m1x)} ${f1(m1y)} ${f1(tx)} ${f1(ty)}Q${f1(m2x)} ${f1(m2y)} ${f1(x)} ${f1(y)}Z" fill="${fill}"/>`;};
// palm frond: a blade notched twice on each side
const FROND=[[.12,.3],[.36,1],[.48,.42],[.7,.82],[.8,.32]];
const frond=(x,y,a,L,w,fill)=>{const pts=[[x,y]];for(const [u,v] of FROND)pts.push(tf(u*L,v*w,a,x,y));pts.push(tf(L,0,a,x,y));for(const [u,v] of FROND.slice().reverse())pts.push(tf(u*L,-v*w,a,x,y));return P(pd(pts),fill);};
// maple leaf: half outline (tip up, stem down), mirrored
const MAPLE=[[0,-1],[.06,-.82],[.17,-.87],[.14,-.64],[.3,-.7],[.5,-.78],[.42,-.58],[.6,-.56],[.38,-.34],[.62,-.3],[.9,-.28],[.74,-.1],[.8,.06],[.5,.08],[.46,.26],[.5,.42],[.3,.34],[.14,.46],[.05,.46],[.05,.8]];
const maple=(x,y,a,r,fill)=>{const pts=[...MAPLE,...MAPLE.slice(1,-1).reverse().map(([u,v])=>[-u,v])];return P(pd(pts.map(([u,v])=>tf(v*r,u*r,a,x,y))),fill);};
// angular blob: a jittered polygon
const blobAt=(x,y,r,n,q)=>pd(Array.from({length:n},(_,i)=>pol(r*(.76+q()*.32),i*360/n+(q()-.5)*16)).map(([px,py])=>[x+px,y+py]));
const poly=(a,x,y,pts)=>pd(pts.map(([u,v])=>tf(u,v,a,x,y)));
// (sx,sy) station centre; (ox,oy) a spot beside it, along the tangent; a = outward angle
function nature(i,sx,sy,ox,oy,a){const q=rng(900+i);let s='';
 if(i===0){// island 1: the broad fan plant of the first island, green with darker and teal leaves across
  for(let k=0;k<5;k++)s+=leaf(ox,oy,a+k*72+10+(q()-.5)*20,122+q()*30,34,'#4f9a4f');
  for(let k=0;k<5;k++)s+=leaf(ox,oy,a+k*72+46+(q()-.5)*20,96+q()*26,26,k%2?'#3f8644':'#2a7f74');}
 else if(i===1){// island 2: shallow turquoise water, a sand bank, one palm
  s+=P(poly(a,ox,oy,[[-160,-70],[-50,-160],[140,-130],[180,20],[70,150],[-120,120]]),'#2f8f86');
  s+=P(poly(a,ox,oy,[[-110,-40],[-20,-110],[110,-80],[122,30],[30,100],[-80,70]]),'#d2c08e');
  for(let k=0;k<5;k++)s+=frond(ox+8,oy-8,a+k*72+20+(q()-.5)*16,112+q()*30,28,k%2?'#78a843':'#9cc455');}
 else if(i===2){// island 3: a bronze stone, teal grass blades, two maple leaves
  s+=P(poly(a,ox,oy,[[-40,-150],[60,-170],[110,-100],[40,-60],[-50,-90]]),'#a9804a');
  for(const [d,L] of [[-150,150],[-120,170],[150,160],[172,130]])s+=P(poly(a+d,ox,oy,[[0,-13],[L,0],[0,13]]),'#2f8f86');
  s+=maple(ox+30,oy+40,a+30,88,'#cf4f6c')+maple(ox-70,oy-20,a-50,66,'#a83a58');}
 else if(i===3){// island 4: sand under the station, a ring of rune stones round it
  s+=P(blobAt(sx,sy,200,10,q),'#cdae76')+P(blobAt(sx+40,sy-30,120,8,q),'#b8924f');
  for(let k=0;k<6;k++){const d=a+k*60+30,[x,y]=pol(142,d),cx=sx+x,cy=sy+y;s+=P(box(-7,7,-17,17,d,cx,cy),G2)+P(box(-3,3,-7,7,d,cx,cy),K1,'class="rune"');}}
 else{// island 5: tilted concrete slabs with moss over their edges
  for(const [u,v,d,w,h,c] of [[-30,-110,24,120,72,G2],[60,40,-14,104,80,G1],[-80,80,10,116,66,G2]])s+=P(box(-w/2,w/2,-h/2,h/2,a+d,ox+u,oy+v),c);
  for(const [u,v,r,c] of [[-60,-70,52,'#6f9a3f'],[90,0,42,'#4f7a32'],[-30,100,48,'#6f9a3f'],[40,120,34,'#4f7a32']])s+=P(blobAt(ox+u,oy+v,r,9,q),c);}
 return s;}
// reef under a station: a fan of sunken triangles
function reef(x,y,seed){const q=rng(seed);let s='',b=q()*360;const T=['#13222d','#172936','#1b2f3d','#112029'];
 for(let i=0;i<7;i++){const a1=b+40+q()*20;s+=P(pd([[x,y],[x+Math.cos(R(b))*(150+q()*70),y+Math.sin(R(b))*(150+q()*70)],[x+Math.cos(R(a1))*(150+q()*70),y+Math.sin(R(a1))*(150+q()*70)]]),T[i%4]);b=a1;}
 return s;}

export const ARMS=[-90,0,90,180];
export const R_ST=830,ST_ANG=[-90,-18,54,126,198];

export function build(){
 let sea='';
 // ---- sea: soft bands and sunken triangles (static, as in the game) ----
 const blob=(rad,jit,k,seed)=>{const q=rng(seed);return Array.from({length:k},(_,i)=>pol(rad*(1-jit+q()*jit*2),i*360/k+(q()-.5)*3));};
 sea+=P(pd(blob(1150,.04,48,3)),'#0c1620')+P(pd(blob(1000,.03,48,4)),'#0e1c26')+P(pd(blob(850,.02,48,5)),'#10212c');
 const TRI=['#111e29','#0c141c','#0f1a24','#0d1620'];
 for(let k=0;k<10;k++){const a=k*36+rnd()*14,rad=960+rnd()*140,[cx,cy]=pol(rad,a);let b=rnd()*360;const n=4+Math.floor(rnd()*3);
  for(let i=0;i<n;i++){const d=50+rnd()*60,a1=b+30+rnd()*45,[x1,y1]=pol(d,b),[x2,y2]=pol(d*(.8+rnd()*.4),a1);sea+=P(pd([[cx,cy],[cx+x1,cy+y1],[cx+x2,cy+y2]]),TRI[Math.floor(rnd()*4)]);b=a1;}}

 // ---- 1. giant machinery under the sea, seen through the water ----
 const UC='#a3bfd3';
 const [dA,bA]=machineRing(560,680,24,14,8,8);
 let under=spinner(.4,P(dA,UC,'fill-rule="evenodd" fill-opacity=".07"')+P(bA,UC,'fill-opacity=".06"'));
 const [dB]=machineRing(730,790,16,12,0,0);let wings='';for(const a of [45,135,225,315])wings+=plate(450,760,-84,84,18,a);
 under+=spinner(-.25,P(dB,UC,'fill-rule="evenodd" fill-opacity=".05"')+P(wings,UC,'fill-opacity=".045"'));

 // ---- 2. stations: reef, glow, island object beside, octagonal tower ----
 let ground='',stations='';
 ST_ANG.forEach((a,i)=>{const [x,y]=pol(R_ST,a),side=i%2?-1:1,[ox,oy]=tf(0,side*132,a,x,y);
  ground+=reef(x,y,700+i)+`<path d="${ngon(x,y,150,8,22.5)}" fill="${ISL[i].hi}" class="glow" data-i="${i}"/>`;
  ground+=`<g class="isle" data-i="${i}">${nature(i,x,y,ox,oy,a)}</g>`;
  stations+=`<g class="station" data-i="${i}" style="--hi:${ISL[i].hi}">`+P(ngon(x,y,100,8,22.5),K1)+P(ngon(x,y,82,8,0),G1)+[0,90,180,270].map(d=>P(box(64,80,-6,6,d,x,y),LIGHT)).join('')+P(ngon(x,y,62,8,22.5),W1)+P(ngon(x,y,44,8,0),W0)+C(x,y,24,G0,'class="lamp"')+'</g>';
  stations+=hud(...pol(R_ST+124,a),String(i+1).padStart(2,'0'),12,'hud bno');});

 // ---- 3. the dark machine ring: black ring, grey cut ring, grey blocks with lighter and darker boxes, pale-blue slots ----
 let cut=band(352,408,G0);for(let k=0;k<16;k++)cut+=P(box(356,404,-6,6,k*22.5+11.25),K0);
 let blocks='';for(let k=0;k<12;k++){const a=k*30;blocks+=P(plate(398,470,-46,46,10,a),G1)+P(box(426,462,-30,6,a),G2)+P(box(410,440,12,32,a),G0)+P(box(404,432,-6,6,a+15),LIGHT,'class="ln"');}
 const ring=band(340,420,K0)+spinner(.6,cut)+spinner(-1.2,blocks);

 // ---- 4. black frame: octagon plinth, four arms, a pad under each arm end ----
 let frame=P(ngon(0,0,340,8,22.5),K1);
 for(const a of ARMS)frame+=P(plate(0,560,-80,80,16,a),K1)+P(plate(436,644,-104,104,26,a),K1);
 const prog=`<path id="progArc" fill="none" stroke="${LIME}" stroke-width="10" d=""/>`;

 // ---- 5. the terrace: sixteen sectors (four of them gardens), the moat, the acropolis disc ----
 let plaza='';
 for(let k=0;k<16;k++){const c=k*22.5,h=11.25;
  if(k%4===2){const q=rng(80+k);plaza+=P(sectG(165,305,c,h,10),K1)+P(sectG(178,292,c,h,36),GRASS)+P(sectG(200,250,c+2,h*.4,30),GRASS2);
   for(let j=0;j<3;j++){const [rx,ry]=pol(190+j*34,c+(j-1)*5.5);plaza+=P(blobAt(rx,ry,13+q()*7,6,q),j%2?W2:W1);}}
  else plaza+=P(sectG(165,305,c,h,10),W2)+P(sectG(165,252,c,h,10),W1);}
 plaza+=C(0,0,150,W1);

 // ---- 6. Santorini: white blocks with blue domes round the tholos ----
 let town='';
 for(const a of [45,135,225,315])town+=P(box(96,140,-22,22,a),W0)+P(box(104,130,22,48,a),W0)+C(...tf(118,0,a),13,B0)+C(...tf(117,35,a),7,B0);
 for(const a of ARMS)town+=P(box(92,142,-15,15,a),W0)+C(...tf(105,0,a),8,B0)+C(...tf(129,0,a),8,B0);
 const tower=tholos(0,0,84,64,50,13,36)+C(0,0,25,K0);
 const core=`<g class="core">${Array.from({length:12},(_,i)=>`<path id="cf${i}"/>`).join('')}</g>`;
 const ready=`<circle r="30" fill="none" stroke="${PINK}" stroke-width="6" class="ready-ring"/>`;

 // ---- 7. arms: white plate and walkway, a slot row, a blue panel with a white stripe, chevrons, the pad with a small tholos ----
 let arms='';
 for(const a of ARMS){
  arms+=P(plate(312,500,-64,64,10,a),W2)+P(box(312,500,-20,20,a),W1);
  for(let i=0;i<5;i++)arms+=P(box(336+i*18,346+i*18,30,54,a),LIGHT,'class="ln"');
  arms+=P(poly(a,0,0,[[340,-56],[430,-56],[418,-28],[328,-28]]),B0)+P(poly(a,0,0,[[372,-56],[380,-56],[368,-28],[360,-28]]),W0);
  for(let i=0;i<3;i++){const u=444+i*16;arms+=P(poly(a,0,0,[[u,-54],[u+7,-54],[u+19,-28],[u+12,-28]]),K1);}
  const [x,y]=pol(540,a);
  arms+=C(x,y,84,K0);for(let k=0;k<8;k++)arms+=P(box(66,80,-7,7,k*45+22.5,x,y),LIGHT,'class="ln"');
  arms+=C(x,y,64,W2)+C(x,y,52,W1)+tholos(x,y,40,29,22,7,16);}
 const selRing=band(656,664,'#f2f4f7','class="sel-ring"');

 const label=hud(0,760,'UNBRIK',15,'hud word','',-8)+hud(0,760,'12 / 30 연구',10,'hud sub','id="hudProgress"',10);
 const s=under+ground+selRing+ring+frame+prog+plaza+town+tower+ready+core+arms+stations+label;
 return {sea,s,anim};
}
