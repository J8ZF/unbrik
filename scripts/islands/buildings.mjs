// Landmark buildings for island 1 v4: top-down, flat, white/grey. Footprints
// are chamfered (cut corners), with L/T shapes and annexes; glass is dark grey.
import {f1,P,poly,rectPts} from './art.mjs';

export const K={ground:'#c3cace',groundLine:'#9ea8ae',seam:'#b3bcc1',wall:'#d2d8db',wallLine:'#828d95',roof:'#edf0f2',roofSeam:'#dce1e4',
 raised:'#e2e6e9',raisedLine:'#a1abb2',glass:'#3e4449',glassLine:'#596066',glassFrame:'#7f8990',solar:'#454b51',solarLine:'#5f666c',
 equip:'#cdd3d7',equipLine:'#87929a',dark:'#5f6870',rail:'#7a848b',leaf:'#4f8a4f',leaf2:'#64a05c',red:'#c8553d'};

// ---- geometry helpers ----
const area=p=>{let a=0;for(let i=0;i<p.length;i++){const q=p[i],r=p[(i+1)%p.length];a+=q[0]*r[1]-r[0]*q[1];}return a/2;};
export function chamfer(pts,c){const n=pts.length,out=[];for(let i=0;i<n;i++){const a=pts[(i-1+n)%n],v=pts[i],b=pts[(i+1)%n],cc=Array.isArray(c)?c[i]:c;
 if(!cc){out.push(v);continue;}const la=Math.hypot(a[0]-v[0],a[1]-v[1]),lb=Math.hypot(b[0]-v[0],b[1]-v[1]),k=Math.min(cc,la/2.2,lb/2.2);
 out.push([v[0]+(a[0]-v[0])/la*k,v[1]+(a[1]-v[1])/la*k],[v[0]+(b[0]-v[0])/lb*k,v[1]+(b[1]-v[1])/lb*k]);}return out;}
export function inset(poly,d){const s=area(poly)>0?1:-1,n=poly.length,out=[];const nrm=(a,b)=>{const dx=b[0]-a[0],dy=b[1]-a[1],l=Math.hypot(dx,dy);return [-dy/l*s,dx/l*s];};
 for(let i=0;i<n;i++){const a=poly[(i-1+n)%n],v=poly[i],b=poly[(i+1)%n],n1=nrm(a,v),n2=nrm(v,b);let mx=n1[0]+n2[0],my=n1[1]+n2[1];const ml=Math.hypot(mx,my)||1;mx/=ml;my/=ml;const len=Math.min(d*2.2,d/Math.max(.35,mx*n1[0]+my*n1[1]));out.push([v[0]+mx*len,v[1]+my*len]);}return out;}
export const box=(x0,y0,x1,y1)=>[[x0,y0],[x1,y0],[x1,y1],[x0,y1]];
const cbox=(x0,y0,x1,y1,c)=>chamfer(box(x0,y0,x1,y1),c);
const oct=(cx,cy,r,rot=.3927)=>Array.from({length:8},(_,i)=>[cx+Math.cos(i/8*6.2832+rot)*r,cy+Math.sin(i/8*6.2832+rot)*r]);
let clipN=0;const clip=(pts,body)=>{const id='bc'+(++clipN);return `<clipPath id="${id}">${poly(pts,'')}</clipPath><g clip-path="url(#${id})">${body}</g>`;};
const line=(x1,y1,x2,y2,c,w,extra='')=>`<line x1="${f1(x1)}" y1="${f1(y1)}" x2="${f1(x2)}" y2="${f1(y2)}" stroke="${c}" stroke-width="${w}" ${extra}/>`;
const circ=(x,y,r,fill,stroke,w=1.6)=>`<circle cx="${f1(x)}" cy="${f1(y)}" r="${f1(r)}" fill="${fill}"${stroke?` stroke="${stroke}" stroke-width="${w}"`:''}/>`;
const shape=(pts,fill,stroke,w=2.5)=>poly(pts,`fill="${fill}"${stroke?` stroke="${stroke}" stroke-width="${w}" stroke-linejoin="miter"`:''}`);

// ---- parts ----
// a building mass: wall band, roof, optional roof seams in one direction
function mass(pts,{seams=0,dir='h',roof=K.roof,wall=K.wall}={}){const r=inset(pts,8);let s=shape(pts,wall,K.wallLine,3)+shape(r,roof,null);
 if(seams){const xs=pts.map(p=>p[0]),ys=pts.map(p=>p[1]),x0=Math.min(...xs),x1=Math.max(...xs),y0=Math.min(...ys),y1=Math.max(...ys);let g='';
  if(dir==='h')for(let y=y0+seams;y<y1;y+=seams)g+=line(x0,y,x1,y,K.roofSeam,1.6);else for(let x=x0+seams;x<x1;x+=seams)g+=line(x,y0,x,y1,K.roofSeam,1.6);s+=clip(r,g);}
 return s;}
const raised=(pts)=>shape(pts,K.raised,K.raisedLine,2)+shape(inset(pts,6),'none',K.roofSeam,1.4);
// skylight / glass panel: dark grey with lighter mullions
function glass(x,y,w,h,cols=1,rows=1){let s=`<rect x="${f1(x)}" y="${f1(y)}" width="${f1(w)}" height="${f1(h)}" fill="${K.glass}" stroke="${K.glassFrame}" stroke-width="1.8"/>`;
 for(let i=1;i<cols;i++)s+=line(x+w*i/cols,y,x+w*i/cols,y+h,K.glassLine,1.3);for(let j=1;j<rows;j++)s+=line(x,y+h*j/rows,x+w,y+h*j/rows,K.glassLine,1.3);return s;}
function solar(x,y,w,h,cols,rows){let s=`<rect x="${f1(x)}" y="${f1(y)}" width="${f1(w)}" height="${f1(h)}" fill="${K.solar}" stroke="${K.equipLine}" stroke-width="1.8"/>`;
 for(let i=1;i<cols;i++)s+=line(x+w*i/cols,y,x+w*i/cols,y+h,K.solarLine,1.2);for(let j=1;j<rows;j++)s+=line(x,y+h*j/rows,x+w,y+h*j/rows,K.solarLine,1.2);return s;}
const ac=(x,y,rot=0)=>`<g transform="translate(${f1(x)} ${f1(y)}) rotate(${rot})"><rect x="-17" y="-12" width="34" height="24" fill="${K.equip}" stroke="${K.equipLine}" stroke-width="1.6"/>${circ(-5,0,8,K.raised,K.dark,1.4)}${line(-10,-5,0,5,K.dark,1.2)}${line(-10,5,0,-5,K.dark,1.2)}${line(10,-8,10,8,K.equipLine,1.4)}</g>`;
const vent=(x,y,r=7)=>circ(x,y,r,K.equip,K.equipLine,1.5)+circ(x,y,r*.4,K.dark);
const hatch=(x,y)=>`<rect x="${f1(x-8)}" y="${f1(y-8)}" width="16" height="16" fill="${K.raised}" stroke="${K.equipLine}" stroke-width="1.5"/>`+line(x-8,y-8,x+8,y+8,K.equipLine,1.2);
const tank=(x,y,r=15)=>circ(x,y,r,K.raised,K.equipLine,2)+circ(x,y,r*.62,'none',K.roofSeam,1.5)+circ(x,y,3,K.dark);
const lamp=(x,y)=>circ(x,y,4.5,'#eef1f3',K.dark,1.3);
const bollard=(x,y)=>circ(x,y,3.2,K.dark);
const planter=(x,y,w,h,trees=2)=>`<rect x="${f1(x)}" y="${f1(y)}" width="${f1(w)}" height="${f1(h)}" fill="${K.leaf}" stroke="${K.groundLine}" stroke-width="1.6"/>`+Array.from({length:trees},(_,i)=>circ(x+w*(i+.5)/trees,y+h/2,Math.min(h*.42,w/trees*.4),K.leaf2)).join('');
function stairs(x,y,w,h,steps,dir='v'){let s=`<rect x="${f1(x)}" y="${f1(y)}" width="${f1(w)}" height="${f1(h)}" fill="${K.ground}" stroke="${K.groundLine}" stroke-width="1.6"/>`;
 for(let i=1;i<steps;i++)s+=dir==='v'?line(x,y+h*i/steps,x+w,y+h*i/steps,K.groundLine,1.3):line(x+w*i/steps,y,x+w*i/steps,y+h,K.groundLine,1.3);return s;}
function paving(pts,step=24){const xs=pts.map(p=>p[0]),ys=pts.map(p=>p[1]),x0=Math.min(...xs),x1=Math.max(...xs),y0=Math.min(...ys),y1=Math.max(...ys);let g='';
 for(let x=x0+step;x<x1;x+=step)g+=line(x,y0,x,y1,K.seam,1.1);for(let y=y0+step;y<y1;y+=step)g+=line(x0,y,x1,y,K.seam,1.1);return shape(pts,K.ground,K.groundLine,2.2)+clip(pts,g);}
// recessed well the node card sits in
function well(n,CW,CH,pad=14){const p=cbox(n.x-CW/2-pad,n.y-CH/2-pad,n.x+CW/2+pad,n.y+CH/2+pad,16);return shape(p,'#aab3b9',K.wallLine,2.5)+shape(inset(p,5),'#8d979e',null)+shape(inset(p,8),'none','#5f6870',1.5);}

// ---- buildings ----
export function harbor(n,CW,CH){const x=n.x,y=n.y;let s='';
 // quay apron along the bay shore, the v1 pier and boats unchanged on top
 const quay=cbox(1792,1232,2046,1274,10);s+=paving(quay,22);for(let bx=1806;bx<2040;bx+=30)s+=bollard(bx,1268);
 const qx=1915,qy=1265;s+=`<rect x="${qx-14}" y="${qy}" width="28" height="118" fill="#7d6a52"/>`;for(let i=0;i<9;i++)s+=`<line x1="${qx-14}" y1="${qy+8+i*12}" x2="${qx+14}" y2="${qy+8+i*12}" stroke="#5c4c3a" stroke-width="2"/>`;
 s+=`<rect x="${qx-64}" y="${qy+112}" width="128" height="22" fill="#7d6a52"/><line x1="${qx-64}" y1="${qy+123}" x2="${qx+64}" y2="${qy+123}" stroke="#5c4c3a" stroke-width="2"/>`;
 const boat=(bx,by,rot)=>`<g transform="translate(${bx} ${by}) rotate(${rot})">${poly([[-34,0],[-22,-11],[26,-11],[38,0],[26,11],[-22,11]],'fill="#d9dfe1"')}${poly([[-14,-6],[14,-6],[18,0],[14,6],[-14,6]],'fill="#8c99a2"')}</g>`;
 s+=boat(qx+44,qy+96,-8)+boat(qx-56,qy+150,14);
 // container yard with a gantry crane, west of the warehouse
 const yard=cbox(x-292,y+2,x-146,y+104,12);s+=paving(yard,26);
 const cont=(cx,cy,c)=>`<rect x="${f1(cx)}" y="${f1(cy)}" width="46" height="19" fill="${c}" stroke="#2f363b" stroke-opacity=".45" stroke-width="1.5"/>`+[1,2,3].map(i=>line(cx+i*11.5,cy+3,cx+i*11.5,cy+16,'#000',1.1,'stroke-opacity=".22"')).join('');
 [[x-282,y+14,'#b5533f'],[x-282,y+36,'#3f6584'],[x-282,y+58,'#b5533f'],[x-232,y+14,'#c99b45'],[x-232,y+58,'#57806a'],[x-282,y+80,'#7a8a96'],[x-232,y+80,'#3f6584']].forEach(([cx,cy,c])=>{s+=cont(cx,cy,c);});
 s+=line(x-290,y+8,x-150,y+8,K.rail,3)+line(x-290,y+98,x-150,y+98,K.rail,3);
 s+=`<rect x="${x-196}" y="${y+2}" width="16" height="102" fill="#d9a441" stroke="#9c7426" stroke-width="1.6"/>`+`<rect x="${x-200}" y="${y+44}" width="24" height="18" fill="#5f6870"/>`;
 // T-shaped warehouse: main hall round the card, loading hall down to the quay, office at the east end
 const T=chamfer([[x-152,y-118],[x+152,y-118],[x+152,y+100],[x+58,y+100],[x+58,1240],[x-50,1240],[x-50,y+100],[x-152,y+100]],[18,18,18,10,12,12,10,18]);
 s+=mass(T);
 // sawtooth roof: dark glass bands across the main hall
 const r=inset(T,8);let saw='';for(let yy=y-104;yy<y+92;yy+=30)saw+=`<rect x="${x-146}" y="${yy}" width="292" height="9" fill="${K.glass}"/>`+line(x-146,yy+9,x+146,yy+9,K.glassFrame,1.2);
 s+=clip(r,saw);
 // loading hall roof seams and dock doors
 let lh='';for(let xx=x-42;xx<x+56;xx+=14)lh+=line(xx,y+100,xx,1236,K.roofSeam,1.4);s+=clip(r,lh);
 for(const dx of [-38,-8,22])s+=`<rect x="${x+dx}" y="1238" width="20" height="7" fill="${K.glass}" stroke="${K.glassFrame}" stroke-width="1.2"/>`;
 const office=cbox(x+96,y-110,x+146,y+94,10);s+=raised(office)+glass(x+104,y-96,34,40,2,3)+glass(x+104,y+36,34,40,2,3)+hatch(x+121,y+6);
 s+=ac(x-118,y-90)+ac(x-118,y+70)+vent(x-80,y-92)+vent(x-80,y+76)+tank(x+70,y-84,13);
 for(const [lx,ly] of [[1800,1250],[1860,1250],[1990,1250],[2040,1250]])s+=lamp(lx,ly);
 return s+well(n,CW,CH);}

export function hall(n,CW,CH){const x=n.x,y=n.y;let s='';
 // front plaza and steps, rotunda at the south-west corner, main block with stair towers
 const plaza=cbox(x-118,y+104,x+118,y+176,14);s+=paving(plaza,20);s+=stairs(x-96,y+136,192,32,5);
 for(let i=0;i<5;i++)s+=lamp(x-106+i*53,y+168);
 const body=chamfer(box(x-165,y-129,x+165,y+110),[24,24,24,24]);s+=mass(body);
 // portico with columns
 s+=`<rect x="${x-98}" y="${y+104}" width="196" height="30" fill="${K.raised}" stroke="${K.raisedLine}" stroke-width="2"/>`;for(let i=0;i<8;i++)s+=circ(x-87+i*24.9,y+119,6,K.roof,K.raisedLine,1.6);
 // atrium glass around the card, solar wings, planted roof terrace, stair towers
 s+=glass(x-CW/2-22,y-CH/2-20,CW+44,CH+40,9,7);
 s+=solar(x-150,y-82,40,92,2,4)+solar(x+110,y-82,40,92,2,4);
 let sm='';for(let xx=x-150;xx<x+152;xx+=20)sm+=line(xx,y+20,xx,y+82,K.roofSeam,1.5);s+=clip(chamfer(box(x-156,y+16,x-100,y+86),6),sm)+clip(chamfer(box(x+100,y+16,x+156,y+86),6),sm);
 s+=vent(x-128,y+38)+vent(x+128,y+38)+hatch(x-128,y+66)+hatch(x+128,y+66);
 const terr=cbox(x-96,y-120,x+96,y-90,8);s+=shape(terr,'#d9dee1',K.raisedLine,1.8);for(let i=0;i<4;i++)s+=planter(x-88+i*46,y-114,38,18,2);
 for(const [tx,ty] of [[x-150,y-114],[x+150,y-114],[x+150,y+95],[x-150,y+95]]){const t=cbox(tx-20,ty-20,tx+20,ty+20,7);s+=raised(t)+hatch(tx,ty);}
 s+=ac(x-104,y+90)+ac(x+104,y+90)+vent(x-60,y+93)+vent(x+60,y+93);
 // rotunda: octagonal drum with a ribbed dome and dark oculus
 const rc=[x-165,y+110],R=56;s+=shape(oct(rc[0],rc[1],R),K.wall,K.wallLine,3)+shape(oct(rc[0],rc[1],R-8),K.roof,null);
 for(let i=0;i<8;i++){const a=i/8*6.2832+.3927;s+=line(rc[0]+Math.cos(a)*16,rc[1]+Math.sin(a)*16,rc[0]+Math.cos(a)*(R-9),rc[1]+Math.sin(a)*(R-9),K.roofSeam,1.8);}
 s+=shape(oct(rc[0],rc[1],34),'none',K.raisedLine,1.8)+circ(rc[0],rc[1],15,K.glass,K.glassFrame,1.8);
 return s+well(n,CW,CH);}

export function radio(n,CW,CH){const x=n.x,y=n.y;let s='';const dx=x+190,dy=y+6,dr=54;
 // fenced dish pad and the lattice mast with its hut
 const pad=cbox(x+134,y-50,x+246,y+62,14);s+=paving(pad,18)+poly(inset(pad,-6),`fill="none" stroke="${K.rail}" stroke-width="1.8" stroke-dasharray="6 5" stroke-linejoin="miter"`);
 const mx=x-176,my=y-18;for(const [gx,gy] of [[-1,-1],[1,-1],[1,1],[-1,1]])s+=line(mx,my,mx+gx*44,my+gy*44,K.rail,1.8)+circ(mx+gx*44,my+gy*44,4,K.equip,K.equipLine,1.3);
 s+=`<rect x="${mx-16}" y="${my-16}" width="32" height="32" fill="${K.dark}"/><rect x="${mx-11}" y="${my-11}" width="22" height="22" fill="${K.equip}"/>`+line(mx-11,my-11,mx+11,my+11,K.dark,2.2)+line(mx+11,my-11,mx-11,my+11,K.dark,2.2)+circ(mx,my,4.5,'#f2f4f7')+circ(mx,my,2,K.red);
 const hut=cbox(x-196,y+30,x-150,y+76,7);s+=raised(hut)+vent(x-173,y+53,6);
 s+=line(x-150,y+40,x-126,y+40,K.rail,5)+line(mx+16,my,x-126,my,K.rail,5);
 // L-shaped station: main block round the card, equipment wing reaching the dish
 const L=chamfer([[x-126,y-100],[x+102,y-100],[x+102,y-36],[x+146,y-36],[x+146,y+58],[x+102,y+58],[x+102,y+100],[x-126,y+100]],[16,16,8,10,10,8,16,16]);
 s+=mass(L,{seams:22,dir:'v'});
 s+=glass(x-114,y-88,30,176,1,6);
 for(let i=0;i<4;i++)s+=`<rect x="${x+108}" y="${y-28+i*21}" width="30" height="15" fill="${K.glass}" stroke="${K.glassFrame}" stroke-width="1.3"/>`+circ(x+132,y-20+i*21,2,'#b9f36d');
 s+=ac(x-60,y-84)+ac(x+70,y-84)+ac(x+70,y+84)+hatch(x-60,y+86)+vent(x-24,y+88)+vent(x+24,y+88);
 for(const [ax,ay] of [[x-118,y-92],[x+94,y+92]])s+=circ(ax,ay,5,K.equip,K.dark,1.4)+line(ax,ay,ax+12,ay-12,K.dark,1.6);
 // dish (top view): white bowl, rings, three struts to a dark feed
 s+=circ(dx,dy,dr,K.roof,K.wallLine,3)+circ(dx,dy,dr*.72,'none',K.roofSeam,2)+circ(dx,dy,dr*.44,'none',K.roofSeam,2);
 for(let i=0;i<3;i++){const a=i/3*6.2832+.5;s+=line(dx+Math.cos(a)*dr*.92,dy+Math.sin(a)*dr*.92,dx,dy,K.dark,2.4);}
 s+=circ(dx,dy,9,K.dark)+circ(dx,dy,3.5,'#f2f4f7');
 return s+well(n,CW,CH);}

export function lighthouse(n,CW,CH,R){const x=n.x,y=n.y;let s='';
 // keeper's annex to the south, path round the tower
 const an=chamfer([[x-58,y+R-24],[x+64,y+R-24],[x+64,y+R+62],[x+10,y+R+62],[x+10,y+R+30],[x-58,y+R+30]],[8,8,8,6,6,8]);
 s+=mass(an,{seams:14,dir:'v'})+glass(x+20,y+R+8,34,44,2,3)+vent(x-34,y+R+12,6)+hatch(x-8,y+R+12);
 s+=shape(oct(x,y,R),K.equip,K.equipLine,3)+shape(oct(x,y,R-16),K.wall,K.wallLine,2);
 const rail=oct(x,y,R-26);s+=poly(rail,`fill="none" stroke="${K.dark}" stroke-width="2.2" stroke-dasharray="3 11" stroke-linejoin="miter"`);
 s+=shape(oct(x,y,R-34),K.roof,K.red,7)+shape(oct(x,y,R-48),'none',K.roofSeam,2);
 for(let i=0;i<8;i++){const a=i/8*6.2832+.3927;s+=line(x+Math.cos(a)*(R-52),y+Math.sin(a)*(R-52),x+Math.cos(a)*(R-38),y+Math.sin(a)*(R-38),K.raisedLine,1.6);}
 return s+well(n,CW,CH);}

// ---- more landmarks for islands 2–5, same flat top-down manner ----
// a coast stretch's outward direction from a point: away from the nearest shore segment
function seaward(n,coast){let best=1e9,dir=[1,0];for(const p of coast){for(let i=0;i<p.length;i++){const a=p[i],b=p[(i+1)%p.length],dx=b[0]-a[0],dy=b[1]-a[1],t=Math.max(0,Math.min(1,((n.x-a[0])*dx+(n.y-a[1])*dy)/(dx*dx+dy*dy))),qx=a[0]+t*dx,qy=a[1]+t*dy,d=Math.hypot(n.x-qx,n.y-qy);if(d<best){best=d;dir=[(qx-n.x)/d,(qy-n.y)/d];}}}return dir;}
const rot=(pts,cx,cy,a)=>{const c=Math.cos(a),s=Math.sin(a);return pts.map(([x,y])=>[cx+c*(x-cx)-s*(y-cy),cy+s*(x-cx)+c*(y-cy)]);};
// 섬 2: marine station — L-shaped block round the card, a round tank and a solar yard
export function station(n,CW,CH){const x=n.x,y=n.y;let s='';
 const yard=cbox(x-150,y+86,x+40,y+170,10);s+=paving(yard,20)+solar(x-140,y+96,80,64,3,3)+solar(x-50,y+96,80,64,3,3);
 const L=chamfer([[x-150,y-108],[x+108,y-108],[x+108,y-20],[x+160,y-20],[x+160,y+84],[x+108,y+84],[x+108,y+96],[x-150,y+96]],[16,16,6,10,10,6,10,16]);
 s+=mass(L,{seams:24,dir:'h'});
 s+=glass(x-138,y-96,44,70,2,4)+glass(x+116,y-10,36,84,2,5)+ac(x+60,y-90)+vent(x-20,y-92)+hatch(x+80,y+80)+vent(x-110,y+82);
 s+=tank(x+128,y+130,24)+tank(x+88,y+150,14)+line(x+104,y+134,x+114,y+134,K.rail,4);
 for(const [lx,ly] of [[x-160,y+180],[x+50,y+180]])s+=lamp(lx,ly);
 return s+well(n,CW,CH);}
// 섬 2: greenhouse — a long glass hall beside the card, a white service block round it
export function greenhouse(n,CW,CH){const x=n.x,y=n.y;let s='';
 const body=cbox(x-118,y-104,x+118,y+104,18);s+=mass(body);
 const hall=cbox(x+128,y-120,x+300,y+70,10);s+=shape(hall,K.wall,K.wallLine,3);
 let g='';for(let yy=y-112;yy<y+70;yy+=18)g+=line(x+128,yy,x+300,yy,K.glassLine,1.3);for(let xx=x+150;xx<x+300;xx+=22)g+=line(xx,y-120,xx,y+70,K.glassLine,1.3);
 s+=`<rect x="${x+136}" y="${y-112}" width="156" height="174" fill="${K.glass}"/>`+clip(hall,g)+line(x+214,y-120,x+214,y+70,K.roofSeam,2.5);
 const bed=cbox(x+136,y+84,x+300,y+124,6);s+=planter(x+136,y+84,164,40,5);
 s+=glass(x-104,y-90,46,40,2,2)+glass(x+58,y-90,46,40,2,2)+ac(x-70,y+86)+vent(x+40,y+88)+hatch(x+92,y-92)+tank(x-96,y+78,13);
 s+=line(x+118,y-30,x+128,y-30,K.rail,6)+line(x+118,y+30,x+128,y+30,K.rail,6);
 return s+well(n,CW,CH);}
// 섬 2: pier — a stilt boardwalk out over the water from a coast card, a hut at the end
export function pier(n,CW,CH,l,{coast}){const x=n.x,y=n.y,[dx,dy]=seaward(n,coast),a=Math.atan2(dy,dx);let s='';
 const g=(u,v)=>[x+dx*u-dy*v,y+dy*u+dx*v];
 const deck=[g(60,-26),g(330,-26),g(330,26),g(60,26)];s+=poly(deck,'fill="#7d6a52"');for(let u=70;u<330;u+=14){const p=g(u,-26),q=g(u,26);s+=line(p[0],p[1],q[0],q[1],'#5c4c3a',2);}
 for(const u of [120,200,280])for(const v of [-32,32]){const p=g(u,v);s+=circ(p[0],p[1],4.5,'#5c4c3a');}
 const hut=rot(box(x+300,y-62,x+380,y+62),x,y,a);s+=mass(hut,{seams:14,dir:'v'});const hc=g(340,0);s+=vent(hc[0],hc[1],7);
 const boat=(u,v,r2)=>{const c=g(u,v);return `<g transform="translate(${f1(c[0])} ${f1(c[1])}) rotate(${(a*180/Math.PI+r2).toFixed(1)})">${poly([[-34,0],[-22,-11],[26,-11],[38,0],[26,11],[-22,11]],'fill="#d9dfe1"')}${poly([[-14,-6],[14,-6],[18,0],[14,6],[-14,6]],'fill="#8c99a2"')}</g>`;};
 s+=boat(180,-66,-6)+boat(260,70,10);
 const apron=rot(cbox(x-100,y-96,x+70,y+96,12),x,y,0);s+=paving(apron,22)+lamp(x-86,y-82)+lamp(x-86,y+82);
 return s+well(n,CW,CH);}
// 섬 3: library — a big hall with a cloister court, reading wings either side
export function library(n,CW,CH){const x=n.x,y=n.y;let s='';
 const body=chamfer([[x-200,y-120],[x+200,y-120],[x+200,y+120],[x-200,y+120]],[22,22,22,22]);s+=mass(body);
 const court=cbox(x-CW/2-24,y-CH/2-22,x+CW/2+24,y+CH/2+22,10);s+=paving(court,18)+poly(inset(court,-8),`fill="none" stroke="${K.rail}" stroke-width="2.2" stroke-dasharray="4 8"`);
 for(const sx of [-1,1]){const wing=cbox(x+sx*120-40,y-100,x+sx*120+40,y+100,8);s+=raised(wing);for(let i=0;i<4;i++)s+=glass(x+sx*120-30,y-88+i*48,60,30,3,1);}
 s+=ac(x-60,y-104)+ac(x+60,y-104)+vent(x,y-106)+hatch(x-60,y+104)+hatch(x+60,y+104)+vent(x,y+106);
 for(const [tx,ty] of [[x-186,y-106],[x+186,y-106],[x+186,y+106],[x-186,y+106]])s+=raised(cbox(tx-16,ty-16,tx+16,ty+16,6));
 const steps=stairs(x-60,y+122,120,26,4);s+=steps;for(let i=0;i<3;i++)s+=lamp(x-50+i*50,y+156);
 return s+well(n,CW,CH);}
// 섬 3: mill — a water wheel on the shore side of a round mill house, a store beside the card
export function mill(n,CW,CH,l,{coast}){const x=n.x,y=n.y,[dx,dy]=seaward(n,coast);let s='';
 const store=cbox(x-120,y-100,x+120,y+100,14);s+=mass(store,{seams:20,dir:'v'})+glass(x-104,y-86,36,50,2,3)+vent(x+96,y-86)+hatch(x+96,y+84)+ac(x-96,y+80);
 const mx=x+dx*196,my=y+dy*196,R=58;s+=shape(oct(mx,my,R),K.wall,K.wallLine,3)+shape(oct(mx,my,R-8),K.roof,null);
 for(let i=0;i<8;i++){const a=i/8*6.2832+.3927;s+=line(mx+Math.cos(a)*14,my+Math.sin(a)*14,mx+Math.cos(a)*(R-10),my+Math.sin(a)*(R-10),K.roofSeam,1.8);}
 s+=circ(mx,my,12,K.glass,K.glassFrame,1.8);
 const wx=mx+dx*74,wy=my+dy*74,px=-dy,py=dx;s+=line(wx-px*48,wy-py*48,wx+px*48,wy+py*48,'#6b5a42',14)+line(wx-px*48,wy-py*48,wx+px*48,wy+py*48,'#8b7357',8);
 for(let i=-4;i<=4;i++)s+=line(wx+px*i*11-dx*8,wy+py*i*11-dy*8,wx+px*i*11+dx*8,wy+py*i*11+dy*8,'#4f4030',2.2);
 s+=line(x+dx*120,y+dy*120,mx-dx*R,my-dy*R,K.rail,6)+line(x+dx*120,y+dy*120,mx-dx*R,my-dy*R,K.ground,3);
 return s+well(n,CW,CH);}
// 섬 3: pavilion — an open octagonal hall on a terrace, a pond and a footbridge
export function pavilion(n,CW,CH){const x=n.x,y=n.y;let s='';
 const terr=cbox(x-150,y-120,x+150,y+120,20);s+=paving(terr,24);
 s+=shape(oct(x,y,118),K.wall,K.wallLine,3)+shape(oct(x,y,106),K.roof,null);for(let i=0;i<8;i++){const a=i/8*6.2832+.3927;s+=line(x+Math.cos(a)*92,y+Math.sin(a)*92,x+Math.cos(a)*104,y+Math.sin(a)*104,K.raisedLine,2);s+=circ(x+Math.cos(a)*98,y+Math.sin(a)*98,5,K.roof,K.raisedLine,1.6);}
 const pond=[[x+150,y-40],[x+230,y-70],[x+300,y-20],[x+292,y+60],[x+220,y+96],[x+156,y+50]];s+=shape(pond,'#1f3a46','#3f6a78',2.5)+circ(x+236,y+10,10,'#5f8f44')+circ(x+262,y+36,8,'#5f8f44');
 s+=line(x+150,y+10,x+300,y+16,'#8b7357',10)+line(x+150,y+10,x+300,y+16,'#a58c6c',3);
 for(const [lx,ly] of [[x-136,y-106],[x+136,y-106],[x-136,y+106],[x+136,y+106]])s+=lamp(lx,ly);
 for(let i=0;i<3;i++)s+=planter(x-140+i*40,y+100,30,16,1);
 return s+well(n,CW,CH);}
// 섬 4: dig site — a gridded excavation beside the card, the finds' store and a crane
export function dig(n,CW,CH){const x=n.x,y=n.y;let s='';
 const store=cbox(x-118,y-100,x+118,y+100,16);s+=mass(store,{seams:22,dir:'h'})+glass(x-100,y-84,40,56,2,3)+ac(x+80,y-84)+hatch(x+92,y+82)+vent(x-92,y+84)+tank(x+40,y-80,12);
 const pit=cbox(x+136,y-130,x+330,y+120,8);s+=shape(pit,'#8a6f44','#5f4a2c',3);
 let g='';for(let xx=x+160;xx<x+330;xx+=28)g+=line(xx,y-130,xx,y+120,'#5f4a2c',1.4);for(let yy=y-106;yy<y+120;yy+=28)g+=line(x+136,yy,x+330,yy,'#5f4a2c',1.4);s+=clip(pit,g);
 s+=shape(cbox(x+170,y-96,x+250,y-30,4),'#6b5434','#4a3822',2)+shape(cbox(x+262,y+10,x+312,y+84,4),'#6b5434','#4a3822',2)+shape(cbox(x+160,y+40,x+230,y+100,4),'#7a6140','#4a3822',2);
 s+=poly([[x+190,y-80],[x+226,y-74],[x+222,y-48],[x+186,y-52]],'fill="#c9b07c"')+circ(x+288,y+48,10,'#c9b07c');
 s+=line(x+140,y-150,x+140,y+140,K.rail,4)+line(x+120,y-150,x+330,y-150,K.rail,4)+circ(x+140,y-150,8,K.equip,K.equipLine,1.5)+line(x+140,y-150,x+200,y-110,K.dark,2.2);
 for(const [lx,ly] of [[x-130,y-112],[x-130,y+112]])s+=lamp(lx,ly);
 return s+well(n,CW,CH);}
// 섬 4: ziggurat — stepped terraces round the card, a stair up the front
export function ziggurat(n,CW,CH){const x=n.x,y=n.y;let s='';
 const tiers=[[200,160,'#b89a66','#8d7449'],[164,130,'#c6a974','#9a8050'],[128,100,'#d2b885','#a88a58']];
 for(const [w,h,f,st] of tiers)s+=shape(cbox(x-w,y-h,x+w,y+h,18),f,st,3);
 for(const [w,h] of [[200,160],[164,130],[128,100]])s+=poly(inset(cbox(x-w,y-h,x+w,y+h,18),8),'fill="none" stroke="#e5d2a3" stroke-width="1.6"');
 s+=stairs(x-22,y+100,44,60,6)+stairs(x-22,y-160,44,60,6);
 for(const [sx,sy] of [[-1,-1],[1,-1],[1,1],[-1,1]])s+=shape(oct(x+sx*176,y+sy*136,16),'#4a3f32','#2f2822',2)+circ(x+sx*176,y+sy*136,5,'#ffbf4a');
 return s+well(n,CW,CH);}
// 섬 4: cistern — a sunken round water store with a pump house, channels to the card
export function cistern(n,CW,CH){const x=n.x,y=n.y;let s='';
 const house=cbox(x-112,y-96,x+112,y+96,14);s+=mass(house,{seams:20,dir:'v'})+glass(x-96,y-80,34,46,2,3)+vent(x+88,y-80)+hatch(x+88,y+78)+ac(x-88,y+76);
 const cx=x+220,cy=y+20,R=84;s+=circ(cx,cy,R,'#b89a66','#8d7449',3)+circ(cx,cy,R-14,'#1f3a46','#3f6a78',2.5)+circ(cx,cy,R-40,'#27485a');
 for(let i=0;i<6;i++){const a=i/6*6.2832;s+=line(cx+Math.cos(a)*(R-14),cy+Math.sin(a)*(R-14),cx+Math.cos(a)*R,cy+Math.sin(a)*R,'#8d7449',3);}
 s+=line(x+112,y+20,cx-R,cy,'#8d7449',12)+line(x+112,y+20,cx-R,cy,'#27485a',5);
 s+=shape(cbox(cx-20,cy-R-36,cx+20,cy-R+6,4),K.equip,K.equipLine,2)+circ(cx,cy-R-15,7,K.dark);
 return s+well(n,CW,CH);}
// 섬 5: tower block — a tall building's roof: lift house, vents, a dark glass band
export function tower(n,CW,CH){const x=n.x,y=n.y;let s='';
 const body=cbox(x-170,y-130,x+170,y+130,14);s+=shape(body,'#7a838b','#525a61',3)+shape(inset(body,10),'#8a939b',null);
 for(let i=-1;i<=1;i+=2)s+=`<rect x="${x-160}" y="${y+i*96-10}" width="320" height="20" fill="${K.glass}" stroke="${K.glassFrame}" stroke-width="1.4"/>`;
 s+=raised(cbox(x-40,y-CH/2-56,x+40,y-CH/2-16,6))+hatch(x,y-CH/2-36);
 s+=ac(x-130,y-110)+ac(x+130,y-110)+ac(x-130,y+110)+ac(x+130,y+110)+vent(x-100,y)+vent(x+100,y)+tank(x+140,y+40,14)+tank(x-140,y-40,12);
 s+=`<rect x="${x-120}" y="${y+CH/2+18}" width="240" height="30" fill="${K.solar}" stroke="${K.equipLine}" stroke-width="1.6"/>`;for(let i=1;i<8;i++)s+=line(x-120+i*30,y+CH/2+18,x-120+i*30,y+CH/2+48,K.solarLine,1.2);
 s+=circ(x-150,y+2,9,'#4f7d3a')+circ(x+148,y-2,11,'#4f7d3a')+circ(x+40,y+118,8,'#4f7d3a');
 return s+well(n,CW,CH);}
// 섬 5: power plant — turbine hall, two cooling towers, pipes
export function plant(n,CW,CH){const x=n.x,y=n.y;let s='';
 const hall=cbox(x-150,y-104,x+150,y+104,14);s+=mass(hall,{seams:20,dir:'h'});
 let saw='';for(let yy=y-90;yy<y+90;yy+=30)saw+=`<rect x="${x-140}" y="${yy}" width="280" height="8" fill="${K.glass}"/>`;s+=clip(inset(hall,8),saw);
 for(const tx of [x+230,x+230]){}
 for(const [tx,ty] of [[x+222,y-50],[x+222,y+62]]){s+=circ(tx,ty,46,'#9aa3aa','#5f6870',3)+circ(tx,ty,30,'#2a3238',null)+circ(tx,ty,22,'#3b4a52');}
 s+=line(x+150,y-20,x+176,y-50,K.rail,7)+line(x+150,y+20,x+176,y+62,K.rail,7);
 s+=ac(x-120,y-88)+vent(x-80,y+88)+hatch(x+120,y+86)+tank(x-120,y+78,14)+vent(x+110,y-88);
 for(let i=0;i<3;i++)s+=line(x-150,y-60+i*50,x-176,y-60+i*50,K.rail,5);
 s+=circ(x-166,y+96,10,'#4f7d3a')+circ(x+140,y+120,8,'#4f7d3a');
 return s+well(n,CW,CH);}
// 섬 5: stadium — an oval bowl beside the card, moss on the pitch
export function stadium(n,CW,CH){const x=n.x,y=n.y;let s='';
 const gate=cbox(x-110,y-96,x+110,y+96,14);s+=mass(gate,{seams:18,dir:'v'})+glass(x-94,y-80,40,44,2,2)+ac(x+76,y-80)+hatch(x+88,y+78)+vent(x-88,y+80);
 const cx=x+256,cy=y;const ell=(rx,ry,f,st,w)=>`<ellipse cx="${f1(cx)}" cy="${f1(cy)}" rx="${f1(rx)}" ry="${f1(ry)}" fill="${f}"${st?` stroke="${st}" stroke-width="${w}"`:''}/>`;
 s+=ell(132,98,'#7a838b','#525a61',3)+ell(120,86,'#8a939b',null)+ell(96,64,'#5f9144','#3f6a30',2)+ell(80,50,'none','#9ccf6a',1.6);
 s+=line(cx,cy-50,cx,cy+50,'#9ccf6a',1.6)+circ(cx,cy,12,'none','#9ccf6a',1.6);
 for(let i=0;i<12;i++){const a=i/12*6.2832;s+=line(cx+Math.cos(a)*100,cy+Math.sin(a)*70,cx+Math.cos(a)*130,cy+Math.sin(a)*96,'#525a61',1.6);}
 s+=line(x+110,y,cx-132,cy,K.rail,8)+line(x+110,y,cx-132,cy,K.ground,4);
 s+=circ(cx-60,cy-82,7,'#4f7d3a')+circ(cx+70,cy+84,9,'#4f7d3a');
 return s+well(n,CW,CH);}
// ---- 섬 2 (하와이): not buildings — a thatched village, a pool the card sinks into, basalt blocks holding the card ----
// a thatched hut from above: a round straw roof with a frayed edge, two eave rings, loose straw strokes, the smoke hole, a doorway awning
const frayed=(cx,cy,R,n,rot)=>Array.from({length:n},(_,i)=>{const a=i/n*6.2832+rot,r=R*(i%2?.93:1);return [cx+Math.cos(a)*r,cy+Math.sin(a)*r];});
const hut=(hx,hy,R,rot)=>{let g=poly(frayed(hx,hy,R+5,26,rot),'fill="rgba(4,8,12,.22)"');
 g+=shape(frayed(hx,hy,R,26,rot),'#c9a65a','#8a6a32',2.2)+shape(frayed(hx,hy,R*.7,22,rot+.2),'#d6b66c','#8a6a32',1.5)+shape(frayed(hx,hy,R*.42,18,rot+.5),'#c9a65a','#8a6a32',1.3);
 for(let i=0;i<9;i++){const a=i/9*6.2832+rot+.17+(i%2)*.12,r0=R*(.72+(i%3)*.05);g+=line(hx+Math.cos(a)*r0,hy+Math.sin(a)*r0,hx+Math.cos(a+.05)*R*.96,hy+Math.sin(a+.05)*R*.96,'#8a6a32',1.3);}
 g+=circ(hx,hy,R*.13,'#5a3e26');
 const a=rot+.55;g+=shape([[hx+Math.cos(a-.32)*R*.86,hy+Math.sin(a-.32)*R*.86],[hx+Math.cos(a-.2)*R*1.22,hy+Math.sin(a-.2)*R*1.22],[hx+Math.cos(a+.2)*R*1.22,hy+Math.sin(a+.2)*R*1.22],[hx+Math.cos(a+.32)*R*.86,hy+Math.sin(a+.32)*R*.86]],'#dcc07a','#8a6a32',1.5);return g;};
export function village(n,CW,CH){const x=n.x,y=n.y;let s='';
 const yard=cbox(x-156,y-124,x+156,y+124,24);s+=shape(yard,'#d8c08a','#c4ad7c',2.5);
 // a trodden path across the yard
 s+=poly([[x-156,y+26],[x-60,y+14],[x+40,y+30],[x+156,y+8],[x+156,y+36],[x+40,y+56],[x-60,y+40],[x-156,y+52]],'fill="#c4ad7c"');
 s+=hut(x-122,y-82,40,.2)+hut(x+118,y-74,34,.6)+hut(x-116,y+86,30,0)+hut(x+112,y+88,42,.35)+hut(x+10,y-112,24,.1);
 // tiki torches and a fire ring
 for(const [tx,ty] of [[x-56,y-112],[x+62,y+116],[x-146,y+6]])s+=circ(tx,ty,7,'#5b3a2a')+circ(tx,ty,4,'#ff9a3c')+circ(tx,ty,1.8,'#ffe08a');
 s+=circ(x+146,y+2,15,'#6b4a2a','#4a3220',2)+circ(x+146,y+2,9,'#e0583a')+circ(x+146,y+2,4,'#ffd38a');
 return s;}
// the pool: a tiled deck, the basin exactly round the card (its water goes OVER the card: poolOver), a ladder and loungers
const basinOf=(n,CW,CH)=>cbox(n.x-CW/2-16,n.y-CH/2-16,n.x+CW/2+16,n.y+CH/2+16,12);
export function pool(n,CW,CH){const x=n.x,y=n.y;let s='';
 const deck=cbox(x-CW/2-80,y-CH/2-62,x+CW/2+80,y+CH/2+62,16);{const [dx0,dy0,dx1,dy1]=[x-CW/2-80,y-CH/2-62,x+CW/2+80,y+CH/2+62];let g='';for(let gx=dx0+26;gx<dx1;gx+=26)g+=line(gx,dy0,gx,dy1,'#d4c3a0',1.1);for(let gy=dy0+26;gy<dy1;gy+=26)g+=line(dx0,gy,dx1,gy,'#d4c3a0',1.1);s+=shape(deck,'#e8dcc2','#c9b78f',2.2)+clip(deck,g);}
 s+=shape(basinOf(n,CW,CH),'#1d8a90','#eef3f5',4);
 s+=line(x+CW/2+6,y-22,x+CW/2+26,y-22,'#dfe5e8',3)+line(x+CW/2+6,y-8,x+CW/2+26,y-8,'#dfe5e8',3)+line(x+CW/2+8,y-30,x+CW/2+8,y,'#dfe5e8',2)+line(x+CW/2+24,y-30,x+CW/2+24,y,'#dfe5e8',2);
 const chair=(cx,cy)=>{let g=`<rect x="${f1(cx-11)}" y="${f1(cy-22)}" width="22" height="44" fill="#f2f4f7" stroke="#8c99a2" stroke-width="1.6"/>`;for(const v of [-6,4,14])g+=line(cx-11,cy+v,cx+11,cy+v,'#8c99a2',1.6);return g+`<rect x="${f1(cx-8)}" y="${f1(cy-19)}" width="16" height="9" fill="#4fe0cf"/>`;};
 s+=chair(x-CW/2-56,y-26)+chair(x-CW/2-56,y+30);
 for(let i=0;i<8;i++){const a=i/8*6.2832,R=22,a1=(i+1)/8*6.2832,px=x+CW/2+54,py=y+CH/2+30;s+=`<path d="M${f1(px)} ${f1(py)}L${f1(px+Math.cos(a)*R)} ${f1(py+Math.sin(a)*R)}A${R} ${R} 0 0 1 ${f1(px+Math.cos(a1)*R)} ${f1(py+Math.sin(a1)*R)}Z" fill="${i%2?'#f2f4f7':'#e8475f'}" stroke="#c9d2d8" stroke-width="1"/>`;}
 return s;}
// over the card: translucent water, so its text reads as sunk, and three ripples
export function poolOver(n,CW,CH){const x=n.x,y=n.y;let s=poly(basinOf(n,CW,CH),'fill="#2ab0b6" fill-opacity=".46"');
 const ripple=(ry,len)=>`<path d="M${f1(x-len)} ${f1(ry)}q12 -7 24 0t24 0t24 0t24 0t24 0" stroke="#eef9fa" stroke-opacity=".55" stroke-width="2.4" fill="none" stroke-linecap="round"/>`;
 s+=ripple(y-28,54)+ripple(y+6,66)+ripple(y+38,48);
 s+=poly([[x-CW/2-2,y-CH/2-2],[x-CW/2+40,y-CH/2-2],[x-CW/2+10,y+CH/2+2],[x-CW/2-2,y+CH/2+2]],'fill="#ffffff" fill-opacity=".12"');return s;}
// basalt blocks holding the card: big blocks of several tones behind it, one or two beside, in the island's rock tones
export function boulders(n,CW,CH,l,{rock}){const x=n.x,y=n.y,T=rock;let s='';
 const blk=(cx,cy,w,h,a,t)=>{const [f,st]=T[t];let g=poly(rectPts(cx,cy,w,h,a),`fill="${f}" stroke="${st}" stroke-width="2.6" stroke-linejoin="miter"`);if(w>120){const [f2,s2]=T[Math.min(4,t+1)];g+=poly(rectPts(cx+w*.06,cy-h*.08,w*.5,h*.5,a+6),`fill="${f2}" stroke="${s2}" stroke-width="2.2" stroke-linejoin="miter"`);}return g;};
 const stack=[[x-30,y+10,250,200,-9,0],[x+40,y-24,230,170,14,1],[x-10,y+40,200,150,4,2],[x+20,y-10,190,140,-18,3]],loose=[[x-172,y+54,96,70,22,1],[x+168,y-60,80,64,-14,2],[x+150,y+86,60,44,30,3]];
 for(const [cx,cy,w,h,a] of [...stack,...loose])s+=poly(rectPts(cx,cy,w,h,a),'fill="rgba(4,8,12,.4)" stroke="rgba(4,8,12,.4)" stroke-width="18" stroke-linejoin="miter"');
 for(const b of [...stack,...loose])s+=blk(...b);
 return s;}
// ---- 섬 3: the observatory's building language on the island — white stone in two tones, chamfered and octagonal,
// bronze roofs (two bronze tones and a dark edge), the game's dark rim round each platform ----
const W={stone:'#d0dcd7',light:'#e5eae1',edge:'#849e9f',mid:'#a8bcba',bronze:'#b5813f',bronzeL:'#d4a05a',bronzeD:'#7d5526',bronzeEdge:'#5e3f1c',grass:'#3f9a86',grassL:'#5fb39a',water:'#1d4b4b',ripple:'#4fb3b0'};
const rimOf=pts=>poly(pts,'fill="none" stroke="#04080c" stroke-opacity=".5" stroke-width="26" stroke-linejoin="round"');
const platform=pts=>shape(pts,W.stone,W.edge,3)+shape(inset(pts,10),W.light,null);
// a bronze dome from above: octagons stepping lighter to the cap
const dome=(cx,cy,R,rot=.3927)=>shape(oct(cx,cy,R,rot),W.bronzeD,W.bronzeEdge,2.4)+shape(oct(cx,cy,R*.72,rot),W.bronze,null)+shape(oct(cx,cy,R*.42,rot),W.bronzeL,null)+circ(cx,cy,R*.12,W.light,W.bronzeEdge,1.4);
// a bronze gable roof from above: two slopes, the ridge, rafters
const gable=(x0,y0,x1,y1,dir='h')=>{const pts=cbox(x0,y0,x1,y1,Math.min(18,(x1-x0)*.2,(y1-y0)*.2));let g=shape(pts,W.bronze,null),inner='';
 if(dir==='h'){const ym=(y0+y1)/2;inner+=shape(box(x0,y0,x1,ym),W.bronzeL,null)+line(x0,ym,x1,ym,W.bronzeD,3);for(let x=x0+24;x<x1;x+=28)inner+=line(x,y0,x,y1,W.bronzeD,1.4,'stroke-opacity=".55"');}
 else{const xm=(x0+x1)/2;inner+=shape(box(x0,y0,xm,y1),W.bronzeL,null)+line(xm,y0,xm,y1,W.bronzeD,3);for(let y=y0+24;y<y1;y+=28)inner+=line(x0,y,x1,y,W.bronzeD,1.4,'stroke-opacity=".55"');}
 return g+clip(pts,inner)+shape(pts,'none',W.bronzeEdge,2.6);};
// the card sits in a light court with a thin bronze frame
const court=(n,CW,CH)=>shape(cbox(n.x-CW/2-16,n.y-CH/2-16,n.x+CW/2+16,n.y+CH/2+16,12),W.light,W.bronze,3);
// 도서관: a long bronze-gabled hall, an octagonal reading tower with a dome, a garden terrace, a colonnade
export function scriptorium(n,CW,CH){const x=n.x,y=n.y;const base=cbox(x-260,y-170,x+260,y+170,40);let s=rimOf(base)+platform(base);
 s+=gable(x-238,y-128,x-104,y+128,'h');
 s+=shape(oct(x+184,y-44,68),W.stone,W.edge,2.6)+dome(x+184,y-44,50);
 s+=shape(cbox(x+106,y+58,x+244,y+152,14),W.grass,W.light,2.4)+circ(x+150,y+104,20,W.grassL)+circ(x+206,y+98,15,W.grassL);
 for(let k=0;k<7;k++)s+=`<rect x="${f1(x-88+k*28)}" y="${f1(y-156)}" width="12" height="12" fill="${W.light}" stroke="${W.edge}" stroke-width="1.6"/>`;
 return s+court(n,CW,CH);}
// 물레방아: an octagonal mill house under a bronze cone, the race running through, the wheel beside it, a shed
export function watermill(n,CW,CH){const x=n.x,y=n.y;const base=cbox(x-200,y-150,x+230,y+150,32);let s=rimOf(base)+platform(base);
 s+=`<rect x="${f1(x+22)}" y="${f1(y-150)}" width="36" height="300" fill="${W.water}" stroke="${W.edge}" stroke-width="1.6"/>`+line(x+32,y-130,x+32,y+130,W.ripple,1.6,'stroke-dasharray="14 10"')+line(x+48,y-120,x+48,y+140,W.ripple,1.2,'stroke-dasharray="10 12"');
 s+=shape(oct(x-116,y-32,76,0),W.stone,W.edge,2.6)+dome(x-116,y-32,58,0);
 s+=circ(x+150,y+34,66,'none',W.bronzeD,12)+circ(x+150,y+34,66,'none',W.bronzeEdge,2);for(let k=0;k<8;k++){const a=k/8*6.2832;s+=line(x+150,y+34,x+150+Math.cos(a)*60,y+34+Math.sin(a)*60,W.bronzeL,4);}s+=circ(x+150,y+34,13,W.bronzeD,W.bronzeEdge,1.6)+circ(x+150,y+34,5,W.light);
 s+=shape(cbox(x-190,y+66,x-104,y+132,10),W.stone,W.edge,2.2)+gable(x-182,y+74,x-112,y+124,'v');
 return s+court(n,CW,CH);}
// 정자: an open octagonal pavilion — a white platform, a bronze roof ring round the open centre, ribs, steps
export function gazebo(n,CW,CH){const x=n.x,y=n.y;const plat=oct(x,y,190),outer=oct(x,y,150);let s=rimOf(plat)+shape(plat,W.stone,W.edge,3)+shape(oct(x,y,172),W.light,null);
 s+=shape(outer,W.bronze,W.bronzeEdge,2.6)+shape(oct(x,y,120),'none',W.bronzeD,2);
 const open=cbox(x-CW/2-18,y-CH/2-18,x+CW/2+18,y+CH/2+18,14);
 for(let k=0;k<8;k++){const [ox,oy]=outer[k];s+=line(x+(ox-x)*.56,y+(oy-y)*.56,ox,oy,W.bronzeL,3.5);s+=circ(ox,oy,4.5,W.bronzeL,W.bronzeEdge,1.2);}
 s+=shape(open,W.light,W.bronzeEdge,2.4);
 for(const [sx,sy,w,h] of [[x-24,y-190,48,16],[x-24,y+174,48,16],[x-190,y-24,16,48],[x+174,y-24,16,48]])s+=`<rect x="${f1(sx)}" y="${f1(sy)}" width="${w}" height="${h}" fill="${W.stone}" stroke="${W.edge}" stroke-width="1.6"/>`;
 return s;}
export const KINDS={harbor:(n,CW,CH)=>harbor(n,CW,CH),hall:(n,CW,CH)=>hall(n,CW,CH),radio:(n,CW,CH)=>radio(n,CW,CH),lighthouse:(n,CW,CH,l)=>lighthouse(n,CW,CH,l.oct),
 station,greenhouse,pier,library,mill,pavilion,dig,ziggurat,cistern,tower,plant,stadium,village,pool,boulders,scriptorium,watermill,gazebo};
// landmarks drawn over the cards too (water over a sunk card)
export const OVER={pool:poolOver};
// footprints: what the still decoration clears under a building (world box)
export const FOOTPRINT={harbor:n=>[n.x-296,n.y-122,n.x+156,1278],hall:n=>[n.x-225,n.y-133,n.x+169,n.y+180],radio:n=>[n.x-224,n.y-104,n.x+254,n.y+104],lighthouse:(n,l)=>[n.x-l.oct-4,n.y-l.oct-4,n.x+l.oct+4,n.y+l.oct+66],
 station:n=>[n.x-164,n.y-112,n.x+166,n.y+184],greenhouse:n=>[n.x-122,n.y-124,n.x+304,n.y+128],pier:n=>[n.x-104,n.y-100,n.x+74,n.y+100],
 library:n=>[n.x-204,n.y-124,n.x+204,n.y+160],mill:n=>[n.x-124,n.y-104,n.x+124,n.y+104],pavilion:n=>[n.x-154,n.y-124,n.x+304,n.y+124],
 dig:n=>[n.x-134,n.y-154,n.x+334,n.y+144],ziggurat:n=>[n.x-204,n.y-164,n.x+204,n.y+164],cistern:n=>[n.x-116,n.y-100,n.x+308,n.y+108],
 tower:n=>[n.x-174,n.y-134,n.x+174,n.y+134],plant:n=>[n.x-180,n.y-108,n.x+272,n.y+112],stadium:n=>[n.x-114,n.y-100,n.x+392,n.y+100],
 village:n=>[n.x-160,n.y-140,n.x+160,n.y+128],pool:n=>[n.x-157,n.y-125,n.x+157,n.y+125],boulders:n=>[n.x-224,n.y-140,n.x+214,n.y+140],
 scriptorium:n=>[n.x-274,n.y-184,n.x+274,n.y+184],watermill:n=>[n.x-214,n.y-164,n.x+244,n.y+164],gazebo:n=>[n.x-204,n.y-204,n.x+204,n.y+204]};
