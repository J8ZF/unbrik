// A stack of notices under the header. Each notice owns one deadline and one
// timer for both dismissal and its remaining-time bar. A notice with the same
// text and kind refreshes in place instead of stacking; otherwise new notices
// are added below the existing ones. Sticky notices (important events) have
// no deadline and leave only through their close button.
export function createNotifications({container,build},motionEnabled,{now=Date.now,schedule=setTimeout,cancel=clearTimeout,limit=4}={}){
 const active=[];
 function remove(entry){
  cancel(entry.timer);entry.timer=null;entry.ticket++;
  entry.element.hidden=true;entry.element.classList.remove('show');entry.bar.style.transform='scaleX(0)';
  if(typeof entry.element.remove==='function')entry.element.remove();
  const index=active.indexOf(entry);if(index>=0)active.splice(index,1);
 }
 function update(entry,ticket){
  if(entry.ticket!==ticket)return;
  const remaining=entry.deadline-now();
  if(remaining<=0){remove(entry);return;}
  entry.bar.style.transform=`scaleX(${Math.min(1,remaining/entry.duration)})`;
  entry.timer=schedule(()=>update(entry,ticket),Math.min(remaining,motionEnabled()?32:250));
 }
 function show(text,options={}){
  const {duration=4000,kind='info',sticky=false}=typeof options==='number'?{duration:options}:options;
  text=String(text);
  let entry=active.find(e=>e.text===text&&e.kind===kind);
  if(!entry){
   const parts=build();
   entry={...parts,text,kind,sticky:false,timer:null,ticket:0,deadline:0,duration:0};
   parts.element.classList.add('toast');parts.element.classList.add('kind-'+kind);
   parts.closeButton.addEventListener('click',()=>remove(entry));
   container.append(parts.element);active.push(entry);
   while(active.filter(e=>!e.sticky&&e!==entry).length>=limit)remove(active.find(e=>!e.sticky&&e!==entry));
  }
  cancel(entry.timer);entry.timer=null;const ticket=++entry.ticket;
  entry.message.textContent=text;entry.sticky=!!sticky;entry.element.classList.toggle('sticky',entry.sticky);
  entry.element.hidden=false;entry.element.classList.add('show');
  if(entry.sticky){entry.bar.style.transform='scaleX(1)';return entry;}
  entry.duration=Math.max(1,Number(duration)||4000);entry.deadline=now()+entry.duration;
  update(entry,ticket);
  return entry;
 }
 function dismiss(){for(const entry of active.slice())remove(entry);}
 return {show,dismiss,get count(){return active.length;},get entries(){return active.slice();}};
}
