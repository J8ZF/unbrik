import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {VERTICES,EDGES,FACES,EDGE_FACES,projectHub,wireframePaths,ORBIT_PATH} from './dist/hub.js';
import {interpolateCamera,overviewMode,farMode,mapFrames,fitCamera} from './dist/camera.js';
import {updatePage} from './dist/updates.js';
assert.equal(VERTICES.length,20);assert.equal(EDGES.length,30);assert.equal(FACES.length,12);
for(let i=0;i<20;i++)assert.equal(EDGES.filter(pair=>pair.includes(i)).length,3);
assert(EDGE_FACES.every(f=>f.length===2));assert(FACES.every(f=>f.indices.length===5));
const edgeKey=(a,b)=>[a,b].sort((a,b)=>a-b).join(',');
function hull(points){const sorted=points.map((p,id)=>({...p,id})).sort((a,b)=>a.x-b.x||a.y-b.y),cross=(a,b,c)=>(b.x-a.x)*(c.y-a.y)-(b.y-a.y)*(c.x-a.x);const lower=[],upper=[];for(const p of sorted){while(lower.length>1&&cross(lower.at(-2),lower.at(-1),p)<=0)lower.pop();lower.push(p);}for(const p of sorted.toReversed()){while(upper.length>1&&cross(upper.at(-2),upper.at(-1),p)<=0)upper.pop();upper.push(p);}return [...lower.slice(0,-1),...upper.slice(0,-1)];}
for(let t=0;t<120;t+=.25){
 const paths=wireframePaths(t),all=Object.values(paths).join('');assert(!/NaN|Infinity/.test(all));assert.equal(all.match(/M/g).length,30);
 const {points,kinds}=projectHub(t),outline=hull(points),expected=new Set(outline.map((p,i)=>edgeKey(p.id,outline[(i+1)%outline.length].id)));
 const actual=new Set(EDGES.flatMap(([a,b],i)=>kinds[i]==='outline'?[edgeKey(a,b)]:[]));assert.deepEqual(actual,expected,`Silhouette must equal projected convex hull at ${t}s`);
 assert(Math.max(...points.map(p=>p.y))<25,'Rotating geometry stays above the wordmark');
}
assert.equal((ORBIT_PATH.match(/L/g)||[]).length,7);assert(ORBIT_PATH.endsWith('Z'));
assert(overviewMode(.31,false));assert(overviewMode(.39,true));assert(!overviewMode(.41,true));assert(!overviewMode(.35,false));
const app=readFileSync('dist/app.js','utf8'),code=app.slice(app.indexOf('let cameraAnim='),app.indexOf('function freeMapFrames'));
const harness=new Function('interpolateCamera','overviewMode','farMode',`
 let camera={x:0,y:0,scale:1},cameraMoving=false,clock=0,seed=0,renderCount=0;const state={settings:{farView:true}},queue=new Map();
 const classes=new Set(),world={classList:{toggle(k,v){v?classes.add(k):classes.delete(k)},contains:k=>classes.has(k)}};
 const moving=new Set(),viewport={classList:{add:k=>moving.add(k),remove:k=>moving.delete(k)}};
 const document={body:{classList:{contains:()=>false}}},performance={now:()=>clock};
 const requestAnimationFrame=fn=>{queue.set(++seed,fn);return seed;},cancelAnimationFrame=id=>queue.delete(id),transform=()=>{},render=()=>renderCount++;
 ${code}
 return {moveCamera,stopCamera,advance(now){clock=now;const pending=[...queue.values()];queue.clear();for(const cb of pending)cb(now);},get camera(){return camera},get moving(){return cameraMoving},get frames(){return queue.size},get renders(){return renderCount}};
`);
const h=harness(interpolateCamera,overviewMode,farMode);let obsolete=0,latest=0;
h.moveCamera({x:100,y:100,scale:.1},()=>obsolete++);h.advance(150);assert(h.moving);h.moveCamera({x:200,y:-300,scale:.8},()=>latest++);h.advance(530);assert.deepEqual(h.camera,{x:200,y:-300,scale:.8});assert(!h.moving);assert.equal(h.frames,0);assert.equal(h.renders,1);assert.equal(obsolete,0);assert.equal(latest,1);
h.moveCamera({x:50,y:50,scale:.3},()=>latest++);h.advance(600);const stopped={...h.camera};h.stopCamera();h.advance(1200);assert.deepEqual(h.camera,stopped);assert.equal(h.frames,0);assert.equal(latest,2,'Interrupted navigation completes once');
for(const width of [320,360,390,430,520])for(const height of [170,240,340,440,600])for(const top of [32,68]){
 const tools={left:width-94,top:height-150},frames=mapFrames(width,height,tools,top),bounds={minX:-184,minY:-184,maxX:184,maxY:184},c=fitCamera(bounds,frames,.82);
 const rect={left:c.x-184*c.scale,right:c.x+184*c.scale,top:c.y-184*c.scale,bottom:c.y+184*c.scale};
 assert(rect.left>=0&&rect.right<=width&&rect.top>=0&&rect.bottom<=height);
 assert(rect.right<=tools.left||rect.bottom<=tools.top,`Center must not overlap map tools at ${width}x${height}`);
}
assert.equal(updatePage(99).current,updatePage(1).pages);assert.equal(updatePage(-1).current,1);assert.equal(updatePage(8,Array.from({length:41},(_,i)=>i)).pages,21);
console.log(JSON.stringify({dodecahedron:'20 vertices / 30 edges / 12 faces',silhouetteAcross480Frames:'passed',orbitPath:'octagonal',wordmarkClearance:'passed',latestCameraWins:'passed',interruptedCompletion:'passed',mobileSafeFrames:'passed'}));
