// Working sheet for hand-drawing: the built island pictures under a labelled world grid, as a PNG.
// The sea floor and the islets are placed by eye against this (seabed.mjs, satellites.mjs).
//   node scripts/islands/sheet.mjs out.png x0 y0 x1 y1 pxPerUnit      (GRID=0 hides the grid)
// Needs Playwright (here: /opt/npm-tools/node_modules) and a Chromium.
import {createRequire} from 'module';
import fs from 'fs';
const require=createRequire('/opt/npm-tools/node_modules/');
const {chromium}=require('playwright');
const [,, out,X0,Y0,X1,Y1,K]=process.argv;const x0=+X0,y0=+Y0,x1=+X1,y1=+Y1,k=+K;
const {ISLAND_ART:A}=await import(new URL('../../dist/island-art.js',import.meta.url).href);
// the sea floor as the game draws it
const P=pts=>pts.map(p=>p[0]+','+p[1]).join(' '),SB=A.seabed,T=SB.tone;let under='';
SB.basin.forEach((b,i)=>{under+=`<polygon points="${P(b)}" fill="${T.basin[0]}" fill-opacity="${T.basin[1][i]-(i?T.basin[1][i-1]:0)}"/>`;});
for(const f of Object.values(SB.islands)){for(const s of f.shelf)under+=`<polygon points="${P(s)}" fill="${T.shelf[0]}" fill-opacity="${T.shelf[1]}"/>`;
 for(const t of [3,2,1])for(const r of f.reefs)if(r.t===t)under+=`<polygon points="${P(r.pts)}" fill="${T.reef[0]}" fill-opacity="${T.reef[1][t]}"/>`;
 under+=`<path d="${f.shallows.map(q=>'M'+P(q)+'Z').join('')}" fill="${f.shallow[0]}" fill-opacity="${f.shallow[1]}"/>`;}
const overlay={under,over:''};
const W=Math.round((x1-x0)*k),H=Math.round((y1-y0)*k);
let pics='';for(const p of A.pictures){const [bx,by,bw,bh]=p.bounds;if(bx>x1||bx+bw<x0||by>y1||by+bh<y0)continue;
 pics+=`<div style="position:absolute;left:${(bx-x0)*k}px;top:${(by-y0)*k}px;width:${bw*k}px;height:${bh*k}px">${p.back.replace('<svg ','<svg style="width:100%;height:100%;display:block" ')}</div>`;
 for(const t of p.tri)pics+=`<svg style="position:absolute;left:${(t.x0-x0)*k}px;top:${(t.y0-y0)*k}px;width:${t.w*k}px;height:${t.h*k}px" viewBox="${t.x0} ${t.y0} ${t.w} ${t.h}">${t.body}</svg>`;}
const step=(x1-x0)>6000?500:200;let grid='';
for(let x=Math.ceil(x0/step)*step;x<=x1;x+=step)grid+=`<line x1="${x}" y1="${y0}" x2="${x}" y2="${y1}" stroke="#fff" stroke-opacity="${x%1000===0?.28:.12}" stroke-width="${1/k}"/><text x="${x+4/k}" y="${y0+13/k}" font-size="${11/k}" fill="#ffd27a">${x}</text><text x="${x+4/k}" y="${y1-5/k}" font-size="${11/k}" fill="#ffd27a">${x}</text>`;
for(let y=Math.ceil(y0/step)*step;y<=y1;y+=step)grid+=`<line x1="${x0}" y1="${y}" x2="${x1}" y2="${y}" stroke="#fff" stroke-opacity="${y%1000===0?.28:.12}" stroke-width="${1/k}"/><text x="${x0+4/k}" y="${y-3/k}" font-size="${11/k}" fill="#8fe0ff">${y}</text><text x="${x1-44/k}" y="${y-3/k}" font-size="${11/k}" fill="#8fe0ff">${y}</text>`;
const showGrid=process.env.GRID!=='0';
const html=`<!doctype html><body style="margin:0;background:#0a1017;width:${W}px;height:${H}px;position:relative;overflow:hidden">
<svg style="position:absolute;left:0;top:0" width="${W}" height="${H}" viewBox="${x0} ${y0} ${x1-x0} ${y1-y0}">${overlay.under||''}</svg>${pics}
<svg style="position:absolute;left:0;top:0" width="${W}" height="${H}" viewBox="${x0} ${y0} ${x1-x0} ${y1-y0}" font-family="monospace">${overlay.over||(typeof overlay==='string'?overlay:'')}${showGrid?grid:''}</svg></body>`;
fs.writeFileSync(out.replace(/\.png$/,'.html'),html);
const browser=await chromium.launch({executablePath:'/opt/pw-browsers/chromium'}).catch(()=>chromium.launch());
const page=await (await browser.newContext({viewport:{width:W,height:H},deviceScaleFactor:1})).newPage();
await page.goto('file://'+out.replace(/\.png$/,'.html'));await page.waitForTimeout(600);await page.screenshot({path:out});await browser.close();console.log('sheet',out,W+'x'+H);
