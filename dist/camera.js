export function interpolateCamera(start,target,progress){const t=Math.max(0,Math.min(1,progress)),e=1-(1-t)**3;return {x:start.x+(target.x-start.x)*e,y:start.y+(target.y-start.y)*e,scale:start.scale+(target.scale-start.scale)*e};}
// Hysteresis prevents repeated detail changes at the overview boundary.
export function overviewMode(scale,wasOverview){return wasOverview?scale<.4:scale<.32;}
