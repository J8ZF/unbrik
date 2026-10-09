// Design aid: draws an island's pieces, the lattice cells where a card fits
// and the generated tree.   node preview-tree.mjs island2 out.svg
import fs from 'node:fs';
import {genTree} from './treegen.mjs';
import {loadDesign} from './design.mjs';
const [,, name, out='/tmp/tree.svg']=process.argv;
const D=await loadDesign(name);
const pieces=Object.values(D.land);
const t=genTree({land:pieces,holes:D.holes||[],avoid:D.avoid||[],...D.tree});
const xs=pieces.flat().map(p=>p[0]),ys=pieces.flat().map(p=>p[1]),x0=Math.min(...xs)-200,y0=Math.min(...ys)-200,x1=Math.max(...xs)+200,y1=Math.max(...ys)+200;
let s=`<svg xmlns="http://www.w3.org/2000/svg" viewBox="${x0} ${y0} ${x1-x0} ${y1-y0}" width="${(x1-x0)/2}" height="${(y1-y0)/2}" style="background:#0a1017">`;
for(const p of pieces)s+=`<polygon points="${p.map(q=>q.join(',')).join(' ')}" fill="#2f5b3b" stroke="#4f8a5a" stroke-width="3"/>`;
for(const h of D.holes||[])s+=`<polygon points="${h.map(q=>q.join(',')).join(' ')}" fill="#1d5a5c"/>`;
for(const b of D.avoid||[])s+=`<rect x="${b[0]}" y="${b[1]}" width="${b[2]-b[0]}" height="${b[3]-b[1]}" fill="#6f777e"/>`;
for(const z of D.rockZones||[])s+=`<polygon points="${z.area.map(q=>q.join(',')).join(' ')}" fill="#666f78" fill-opacity=".5"/>`;
for(const l of D.terrain||[])s+=`<polygon points="${l.pts.map(q=>q.join(',')).join(' ')}" fill="#8fc25c" fill-opacity=".25"/>`;
const by=new Map(t.nodes.map(n=>[n[0],n]));
for(const n of t.nodes)for(const r of n[3]){const p=by.get(r);s+=`<line x1="${p[1]}" y1="${p[2]}" x2="${n[1]}" y2="${n[2]}" stroke="#fff" stroke-width="3"/>`;}
for(const n of t.nodes){const mark=t.marks.includes(n[0]),gate=n[0]===t.gate;s+=`<rect x="${n[1]-73}" y="${n[2]-59}" width="146" height="118" fill="${gate?'#ffbf4a':mark?'#4fe0cf':n[0]===1?'#b9f36d':'#e6edf1'}" stroke="#000" stroke-width="2"/><text x="${n[1]}" y="${n[2]+8}" font-size="34" text-anchor="middle" fill="#000" font-family="monospace">${n[0]}</text>`;}
s+=`<text x="${x0+20}" y="${y0+50}" font-size="40" fill="#fff" font-family="monospace">${name}: ${t.used}/${t.spots} spots, ${t.bridges} bridges</text>`;
if(D.label)s+=`<text x="${D.label[0]}" y="${D.label[1]}" font-size="60" fill="#b9f36d" font-family="monospace">02 / 섬</text>`;
fs.writeFileSync(out,s+'</svg>');
console.log(JSON.stringify({used:t.used,cells:t.cells,bridges:t.bridges,gate:t.gate,marks:t.marks}));
