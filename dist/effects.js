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

export function opalDefinitions(){return `<defs><linearGradient id="opal-region-wash" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#f2f4f7"/><stop offset=".3" stop-color="#bee9ed"/><stop offset=".52" stop-color="#ead0ef"/><stop offset=".75" stop-color="#f5e7c8"/><stop offset="1" stop-color="#f2f4f7"/></linearGradient><linearGradient id="opal-region-edge" x1="0" y1="0" x2="1" y2=".6"><stop offset="0" stop-color="#f2f4f7"/><stop offset=".25" stop-color="#bee9ed"/><stop offset=".5" stop-color="#ead0ef"/><stop offset=".75" stop-color="#f5e7c8"/><stop offset="1" stop-color="#f2f4f7"/></linearGradient></defs>`;}
