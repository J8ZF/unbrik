// One deadline and one timer own both dismissal and the remaining-time bar.
export function createNotification({element,message,bar,closeButton},motionEnabled,{now=Date.now,schedule=setTimeout,cancel=clearTimeout}={}){
 let timer=null,epoch=0,deadline=0,duration=0;
 function dismiss(){epoch++;cancel(timer);timer=null;element.hidden=true;element.classList.remove('show');bar.style.transform='scaleX(0)';}
 function update(ticket){
  if(ticket!==epoch)return;
  const remaining=deadline-now();
  if(remaining<=0){dismiss();return;}
  bar.style.transform=`scaleX(${Math.min(1,remaining/duration)})`;
  timer=schedule(()=>update(ticket),Math.min(remaining,motionEnabled()?32:250));
 }
 function show(text,milliseconds=4000){
  cancel(timer);const ticket=++epoch;
  duration=Math.max(1,Number(milliseconds)||4000);deadline=now()+duration;
  message.textContent=String(text);element.hidden=false;element.classList.add('show');
  update(ticket);
 }
 closeButton.addEventListener('click',dismiss);
 return {show,dismiss};
}
