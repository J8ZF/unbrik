// Landmark buildings for island 1 v4: top-down, flat, white/grey. Footprints
// are chamfered (cut corners), with L/T shapes and annexes; glass is dark grey.
import {f1,P,poly} from './art.mjs';

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
