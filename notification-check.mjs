import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createNotification} from './dist/notifications.js';

let clock=0,motion=true,sequence=0;
const timers=new Map(),callbacks=new Map(),classes=new Set();
const element={hidden:true,classList:{add:k=>classes.add(k),remove:k=>classes.delete(k)}};
const message={},bar={style:{}},closeButton={addEventListener(type,fn){callbacks.set(type,fn);}};
const notification=createNotification({element,message,bar,closeButton},()=>motion,{
 now:()=>clock,schedule(fn,delay){const id=++sequence;timers.set(id,{fn,at:clock+delay});return id;},cancel:id=>timers.delete(id)
});
function advance(to){clock=to;for(const [id,timer]of [...timers])if(timer.at<=clock){timers.delete(id);timer.fn();}}
function fraction(){return Number(bar.style.transform.match(/scaleX\(([^)]+)\)/)[1]);}
notification.show('오프라인 생산',8500);assert(!element.hidden);assert.equal(fraction(),1);assert.equal(message.textContent,'오프라인 생산');
advance(4250);assert.equal(fraction(),.5);
const stale=[...timers.values()][0].fn;
notification.show('진행 상황을 저장했습니다.',4000);assert.equal(fraction(),1);assert.equal(timers.size,1);
stale();assert(!element.hidden);assert.equal(timers.size,1,'Old notification cannot dismiss or schedule over its replacement');
advance(6250);assert.equal(fraction(),.5);callbacks.get('click')();assert(element.hidden);assert.equal(timers.size,0);assert.equal(fraction(),0);
notification.show('새 알림',2000);assert(!element.hidden);motion=false;advance(7250);assert.equal(fraction(),.5);assert.equal([...timers.values()][0].at,7500);
advance(8250);assert(element.hidden);assert.equal(timers.size,0);
notification.show('백그라운드 타이머',4000);advance(20000);assert(element.hidden,'Returning after a throttled timer respects the absolute deadline');
notification.show('새 알림',1000);const dismissedCallback=[...timers.values()][0].fn;notification.dismiss();notification.show('최신 알림',1000);dismissedCallback();assert(!element.hidden);assert.equal(message.textContent,'최신 알림');advance(21000);assert(element.hidden);

const css=readFileSync('dist/style.css','utf8'),html=readFileSync('dist/index.html','utf8');
assert(css.includes('.edge.researched{stroke:var(--edge-color);stroke-opacity:.38;'));
assert(css.includes('.edge.flashing{stroke:var(--edge-color);stroke-opacity:1;'));
assert(css.includes('.map-tools.is-compact{grid-template-columns:38px}'));
assert(html.includes('hidden>CHEAT</span>'));assert(html.includes('id="closeToast" aria-label="알림 닫기"'));
console.log(JSON.stringify({notificationReplacement:'passed',immediateDismiss:'passed',remainingTime:'passed',motionOff:'passed',backgroundDeadline:'passed',sectorConnectionColors:'passed'}));
