import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createNotifications} from './dist/notifications.js';

let clock=0,motion=true,sequence=0;
const timers=new Map();
function element(){const classes=new Set();return {hidden:true,style:{},children:[],classList:{add:k=>classes.add(k),remove:k=>classes.delete(k),toggle(k,v){v?classes.add(k):classes.delete(k);},contains:k=>classes.has(k)},append(v){this.children.push(v);},remove(){this.removed=true;}};}
const container=element();
function build(){const closeButton=element();const callbacks=new Map();closeButton.addEventListener=(type,fn)=>callbacks.set(type,fn);closeButton.click=()=>callbacks.get('click')();return {element:element(),message:{},closeButton,bar:{style:{}}};}
const notification=createNotifications({container,build},()=>motion,{
 now:()=>clock,schedule(fn,delay){const id=++sequence;timers.set(id,{fn,at:clock+delay});return id;},cancel:id=>timers.delete(id)
});
function advance(to){clock=to;for(const [id,timer]of [...timers])if(timer.at<=clock){timers.delete(id);timer.fn();}}
const fraction=entry=>Number(entry.bar.style.transform.match(/scaleX\(([^)]+)\)/)[1]);
const first=notification.show('오프라인 생산',8500);
assert(!first.element.hidden);assert.equal(fraction(first),1);assert.equal(first.message.textContent,'오프라인 생산');
advance(4250);assert.equal(fraction(first),.5);
// A different notice stacks below; the first keeps its own deadline.
const second=notification.show('진행 상황을 저장했습니다.',4000);
assert.equal(notification.count,2);assert.equal(container.children[1],second.element);
assert.equal(fraction(second),1);assert.equal(fraction(first),.5);
// The same text refreshes in place instead of stacking.
const again=notification.show('진행 상황을 저장했습니다.',4000);
assert.equal(again,second);assert.equal(notification.count,2);
advance(6250);assert.equal(fraction(second),.5);
second.closeButton.click();
assert(second.element.hidden);assert(second.element.removed);assert.equal(notification.count,1);
advance(8500);assert(first.element.hidden);assert.equal(notification.count,0);assert.equal(timers.size,0);
// Motion off: coarse timer steps still hit the deadline.
const third=notification.show('새 알림',2000);motion=false;
advance(9500);assert.equal(fraction(third),.5);assert.equal([...timers.values()][0].at,9750);
advance(10500);assert(third.element.hidden);
// Background throttling respects the absolute deadline.
const fourth=notification.show('백그라운드 타이머',4000);advance(30000);assert(fourth.element.hidden,'Returning after a throttled timer respects the absolute deadline');
// Sticky notices have no deadline and no timer; only the close button removes them.
const sticky=notification.show('105개 노드 연구 완료.',{kind:'important',sticky:true});
assert.equal(timers.size,0);assert(sticky.element.classList.contains('sticky'));assert(sticky.element.classList.contains('kind-important'));
advance(90000);assert(!sticky.element.hidden);
sticky.closeButton.click();assert(sticky.element.hidden);assert.equal(notification.count,0);
// Weather notices carry their kind; the stack is capped for timed notices.
const rain=notification.show('날씨 · 비',{kind:'weather-rain',duration:6000});assert(rain.element.classList.contains('kind-weather-rain'));
for(let i=0;i<6;i++)notification.show('알림 '+i,4000);
assert(notification.count<=5,'Timed notices are capped');assert(!rain.element.hidden||rain.element.removed);
notification.dismiss();assert.equal(notification.count,0);assert.equal(timers.size,0);

const css=readFileSync('dist/style.css','utf8'),html=readFileSync('dist/index.html','utf8');
assert(css.includes('.edge.researched{stroke:var(--edge-color);stroke-opacity:.38;'));
assert(css.includes('.edge.flashing{stroke:var(--edge-color);stroke-opacity:1;'));
assert(css.includes('.map-tools.is-compact{grid-template-columns:38px}'));
assert(html.includes('hidden>CHEAT</span>'));
assert(html.includes('<div id="toasts" class="toasts" aria-label="알림"></div>'));
for(const kind of ['important','weather-rain','weather-snow','weather-clear'])assert(css.includes(`.toast.kind-${kind}{`),`Missing style for ${kind}`);
console.log(JSON.stringify({notificationStack:'passed',sameTextRefreshes:'passed',immediateDismiss:'passed',remainingTime:'passed',motionOff:'passed',backgroundDeadline:'passed',stickyNotices:'passed',weatherKinds:'passed',sectorConnectionColors:'passed'}));
