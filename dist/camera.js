export function interpolateCamera(start,target,progress){const t=Math.max(0,Math.min(1,progress)),e=1-(1-t)**3;return {x:start.x+(target.x-start.x)*e,y:start.y+(target.y-start.y)*e,scale:start.scale+(target.scale-start.scale)*e};}
// Hysteresis prevents repeated detail changes at the overview boundary.
export function overviewMode(scale,wasOverview){return wasOverview?scale<.4:scale<.32;}
// Choose an unobstructed rectangle above or beside the map controls.
export function mapFrames(width,height,tools,top=32){
 const pad=14,bottom=Math.max(top+1,height-pad),right=Math.max(pad+1,width-pad);
 const candidates=[{left:pad,top,right:Math.max(pad+1,tools.left-12),bottom},{left:pad,top,right,bottom:Math.max(top+1,tools.top-12)}];
 const valid=candidates.filter(r=>r.right-r.left>48&&r.bottom-r.top>48);
 return valid.length?valid:[{left:8,top:8,right:Math.max(9,width-8),bottom:Math.max(9,height-8)}];
}
export function fitCamera(bounds,frames,maxScale=1){
 const w=Math.max(1,bounds.maxX-bounds.minX),h=Math.max(1,bounds.maxY-bounds.minY);
 const options=frames.map(r=>{const scale=Math.min(maxScale,(r.right-r.left)/w,(r.bottom-r.top)/h);return {scale,x:(r.left+r.right)/2-(bounds.minX+bounds.maxX)*scale/2,y:(r.top+r.bottom)/2-(bounds.minY+bounds.maxY)*scale/2};});
 return options.sort((a,b)=>b.scale-a.scale)[0];
}
