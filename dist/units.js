// Named large-number units (short scale), the way idle games such as Miner's
// Haven write them: K, M, B, T, Qa, Qi, Sx, Sp, Oc, No, Dc, then UDc, DDc,
// TDc … NoDc, Vg (vigintillion), UVg … NoNog, and Ce (centillion, 1e303).
// UNIT_SUFFIXES[k] names 1000^k.
const FIRST=['M','B','T','Qa','Qi','Sx','Sp','Oc','No'];
const ONES=['','U','D','T','Qa','Qi','Sx','Sp','Oc','No'];
const TENS=['','Dc','Vg','Tg','Qag','Qig','Sxg','Spg','Ocg','Nog'];
export const UNIT_SUFFIXES=['','K',...Array.from({length:99},(_,j)=>{const i=j+1;return i<10?FIRST[i-1]:ONES[i%10]+TENS[Math.floor(i/10)];}),'Ce'];
// Split n into a mantissa below 1000 and its unit index, guarding the float
// edge where log10 lands a hair under a power of ten.
function split(n){let k=Math.floor((Math.log10(n)+1e-9)/3),m=n/1000**k;if(m<1&&m>.999999)m=1;else if(m<1){k--;m*=1000;}if(m>=999.9995){k++;m/=1000;}return {k,m};}
// Full form: two decimals, trailing .00 dropped (5Dc, 1.89UDc).
export function formatNamed(n){
 let {k,m}=split(n),text=m.toFixed(2);
 if(Number(text)>=1000){k++;m=n/1000**k;text=m.toFixed(2);}
 if(k>=UNIT_SUFFIXES.length)return n.toExponential(2).replace('+','');
 return text.replace(/\.00$/,'')+UNIT_SUFFIXES[k];
}
// Compact form: `digits` significant digits (1.89UDc, 42.0DDc).
export function compactNamed(n,digits=3){
 n=Number(n.toPrecision(digits));
 const {k,m}=split(n),decimals=Math.max(0,digits-1-Math.floor(Math.log10(m)));
 if(k>=UNIT_SUFFIXES.length)return n.toExponential(digits-1).replace('+','');
 return m.toFixed(decimals)+UNIT_SUFFIXES[k];
}
