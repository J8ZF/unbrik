// Only intersecting opal borders animate. No independent timers or SMIL.
export function createOpalMotion(groups,isEnabled,Observer=globalThis.IntersectionObserver){
 const targets=groups.flatMap(g=>g.elements),visible=new Set(),observers=[];
 function update(el){const value=isEnabled()&&visible.has(el)?'running':'paused';if(el.dataset.opalMotion!==value){el.dataset.opalMotion=value;el.style.setProperty('--opal-play-state',value);}}
 if(Observer)for(const {root,elements}of groups){const observer=new Observer(entries=>{for(const {target,isIntersecting,intersectionRatio}of entries){if(isIntersecting&&intersectionRatio>0)visible.add(target);else visible.delete(target);update(target);}},{root,threshold:0});for(const el of elements)observer.observe(el);observers.push(observer);}
 function refresh(){targets.forEach(update);}
 refresh();return {refresh,disconnect(){observers.forEach(o=>o.disconnect());visible.clear();targets.forEach(update);}};
}

const editableSelector='input,textarea,select,[contenteditable]:not([contenteditable="false"])';
const elementFor=node=>node?.nodeType===3?node.parentElement:node;
const isEditable=node=>!!elementFor(node)?.closest?.(editableSelector);

// Protect every game surface, including notifications, footer and dialog copy.
// Do not cancel pointer/touch events: repeated purchases, links and pinch still work.
export function preventGameSelection(event){
 const target=elementFor(event.target);
 if(!target?.closest?.('#game')||isEditable(target))return;
 if(event.type==='contextmenu'&&target.closest('a'))return;
 event.preventDefault();
}
export function clearGameSelection(doc=globalThis.document){
 const selection=doc.getSelection();if(!selection||selection.isCollapsed)return;
 const ends=[selection.anchorNode,selection.focusNode];
 if(ends.every(isEditable))return;
 // Textarea selections can be reported against body in some engines.
 if(isEditable(doc.activeElement)&&!ends.some(n=>elementFor(n)?.closest?.('#game')&&!isEditable(n)))return;
 if(ends.some(n=>elementFor(n)?.closest?.('#game')))selection.removeAllRanges();
}
export function installGameSelectionGuard(doc=globalThis.document){
 for(const type of ['selectstart','contextmenu','dblclick'])doc.addEventListener(type,preventGameSelection,true);
 const clear=()=>clearGameSelection(doc);
 doc.addEventListener('selectionchange',clear);
 doc.addEventListener('pointerdown',event=>{if(!isEditable(event.target))clear();},true);
 clear();
}
