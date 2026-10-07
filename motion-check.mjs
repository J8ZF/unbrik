import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {VERTICES,EDGES,wireframePaths} from './dist/hub.js';
import {interpolateCamera,overviewMode} from './dist/camera.js';
import {updatePage} from './dist/updates.js';
assert.equal(VERTICES.length,20);assert.equal(EDGES.length,30);
for(let i=0;i<20;i++)assert.equal(EDGES.filter(pair=>pair.includes(i)).length,3);
for(let t=0;t<100;t+=.5){const paths=wireframePaths(t);assert(!/NaN|Infinity/.test(paths.front+paths.back));assert.equal((paths.front+paths.back).match(/M/g).length,30);}
assert.notDeepEqual(wireframePaths(0),wireframePaths(5));
assert(overviewMode(.31,false));assert(overviewMode(.39,true));assert(!overviewMode(.41,true));assert(!overviewMode(.35,false));
const app=readFileSync('dist/app.js','utf8'),code=app.slice(app.indexOf('let cameraAnim='),app.indexOf('function focusNode'));
const harness=new Function('interpolateCamera','overviewMode',`
 let camera={x:0,y:0,scale:1},cameraMoving=false,clock=0,seed=0,renderCount=0;const state={},queue=new Map();
 const classes=new Set(),world={classList:{toggle(k,v){v?classes.add(k):classes.delete(k)},contains:k=>classes.has(k)}};
 const moving=new Set(),viewport={classList:{add:k=>moving.add(k),remove:k=>moving.delete(k)}};
 const document={body:{classList:{contains:()=>false}}},performance={now:()=>clock};
 const requestAnimationFrame=fn=>{queue.set(++seed,fn);return seed;},cancelAnimationFrame=id=>queue.delete(id),transform=()=>{},render=()=>renderCount++;
 ${code}
 return {moveCamera,stopCamera,advance(now){clock=now;const pending=[...queue.values()];queue.clear();for(const cb of pending)cb(now);},get camera(){return camera},get moving(){return cameraMoving},get frames(){return queue.size},get renders(){return renderCount}};
`);
const h=harness(interpolateCamera,overviewMode);h.moveCamera({x:100,y:100,scale:.1});h.advance(150);assert(h.moving);h.moveCamera({x:200,y:-300,scale:.8});h.advance(530);assert.deepEqual(h.camera,{x:200,y:-300,scale:.8});assert(!h.moving);assert.equal(h.frames,0);assert.equal(h.renders,1);
h.moveCamera({x:50,y:50,scale:.3});h.advance(600);const stopped={...h.camera};h.stopCamera();h.advance(1200);assert.deepEqual(h.camera,stopped);assert.equal(h.frames,0);
assert.equal(updatePage(99).current,3);assert.equal(updatePage(-1).current,1);assert.equal(updatePage(8,Array.from({length:41},(_,i)=>i)).pages,21);
console.log(JSON.stringify({dodecahedron:'20 vertices / 30 edges',finiteAnimation:'passed',latestCameraWins:'passed',gestureCancelsTween:'passed',overviewHysteresis:'passed',futureUpdatePagination:'passed'}));
