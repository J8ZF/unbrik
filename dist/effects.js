// Only intersecting opal surfaces animate. No independent timers or SMIL.
export function createOpalMotion(groups,isEnabled,Observer=globalThis.IntersectionObserver){
 const targets=groups.flatMap(g=>g.elements),visible=new Set(),observers=[];
 function update(el){const value=isEnabled()&&visible.has(el)?'running':'paused';if(el.dataset.opalMotion!==value){el.dataset.opalMotion=value;el.style.setProperty('--opal-play-state',value);}}
 if(Observer)for(const {root,elements}of groups){const observer=new Observer(entries=>{for(const {target,isIntersecting,intersectionRatio}of entries){if(isIntersecting&&intersectionRatio>0)visible.add(target);else visible.delete(target);update(target);}},{root,threshold:0});for(const el of elements)observer.observe(el);observers.push(observer);}
 function refresh(){targets.forEach(update);}
 refresh();return {refresh,disconnect(){observers.forEach(o=>o.disconnect());visible.clear();targets.forEach(update);}};
}

// Text entry, copying saves and reading credits retain browser defaults.
export function preventGameSelection(event){
 const target=event.target;if(!target?.closest)return;
 if(target.closest('input,textarea,select,[contenteditable="true"],a'))return;
 if(target.closest('#hud,#viewport,#nodePanel,#sectorDialog,button'))event.preventDefault();
}
