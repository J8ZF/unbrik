// Number notations for amounts of 1000 and up. Amounts are Big values (or
// plain numbers), so they keep going past the double limit.
//  named (default): short-scale units the way idle games such as Miner's
//   Haven write them — K, M, B, T, Qa, Qi, Sx, Sp, Oc, No, Dc, then UDc, DDc,
//   TDc … NoDc, Vg (vigintillion), UVg … NoNog, and Ce (centillion, 1e303).
//   Each unit is 1000× the previous one. Past Ce the exponent is shown
//   (1.23e293910).
//  short: K … Dc, then the exponent.
//  scientific: 1.23e45.  engineering: 12.3e45 with exponents in steps of 3.
// UNIT_SUFFIXES[k] names 1000^k.
import {Big} from './big.js?v=4.0.0-dev.1';
const FIRST=['M','B','T','Qa','Qi','Sx','Sp','Oc','No'];
const ONES=['','U','D','T','Qa','Qi','Sx','Sp','Oc','No'];
const TENS=['','Dc','Vg','Tg','Qag','Qig','Sxg','Spg','Ocg','Nog'];
export const UNIT_SUFFIXES=['','K',...Array.from({length:99},(_,j)=>{const i=j+1;return i<10?FIRST[i-1]:ONES[i%10]+TENS[Math.floor(i/10)];}),'Ce'];
const SHORT_SUFFIXES=UNIT_SUFFIXES.slice(0,12);
const sciText=(m,e,decimals)=>{let t=m.toFixed(decimals);if(Number(t)>=10){m/=10;e++;t=m.toFixed(decimals);}return t+'e'+e;};
// Full form: two decimals, trailing .00 dropped in unit notations (5Dc, 1.89UDc).
export function formatNumber(n,mode='named'){
 const [m,e]=Big.from(n).sci();
 if(mode==='scientific')return sciText(m,e,2);
 let k=Math.floor(e/3),x=m*10**(e-3*k),t=x.toFixed(2);
 if(Number(t)>=1000){k++;x/=1000;t=x.toFixed(2);}
 if(mode==='engineering')return t+'e'+3*k;
 const units=mode==='short'?SHORT_SUFFIXES:UNIT_SUFFIXES;
 if(k>=units.length)return sciText(m,e,2);
 return t.replace(/\.00$/,'')+units[k];
}
// Compact form: `digits` significant digits (1.89UDc, 42.0DDc).
export function compactNumber(n,mode='named',digits=3){
 let [m,e]=Big.from(n).sci();m=Number(m.toPrecision(digits));if(m>=10){m/=10;e++;}
 if(mode==='scientific')return m.toFixed(digits-1)+'e'+e;
 const k=Math.floor(e/3),r=e-3*k,text=(m*10**r).toFixed(Math.max(0,digits-1-r));
 if(mode==='engineering')return text+'e'+3*k;
 const units=mode==='short'?SHORT_SUFFIXES:UNIT_SUFFIXES;
 if(k>=units.length)return m.toFixed(digits-1)+'e'+e;
 return text+units[k];
}
export const formatNamed=n=>formatNumber(n,'named');
export const compactNamed=(n,digits=3)=>compactNumber(n,'named',digits);
