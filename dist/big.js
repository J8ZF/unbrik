// Big numbers for the economy. A value is m × 10^e.
// Below 1e300 a Big is a plain double (e = 0), so ordinary amounts compute
// exactly as plain numbers did. From 1e300 up, 1 ≤ |m| < 10 and e is an
// integer exponent that can grow far past the double limit (1e308), e.g.
// 1.2 × 10^293910. Values are immutable; every operation returns a new Big.
// Methods accept a Big, a number or a numeric string.
const LIMIT=1e300,SPLIT=300;
// Shared across module copies (e.g. the same file loaded with and without a
// cache-busting query), so a Big from one copy is accepted by another.
const BRAND=Symbol.for('unbrik.big');
export class Big{
 constructor(m,e=0){this.m=m;this.e=e;}
 get [BRAND](){return true;}
 static from(v){
  if(v instanceof Big)return v;
  // Another copy's Big, or a structured clone of one ({m, e}).
  if(v?.[BRAND]||(typeof v?.m==='number'&&Number.isInteger(v?.e)))return new Big(v.m,v.e);
  if(typeof v==='number'){if(!Number.isFinite(v))throw RangeError('Big: not a finite number');return fromNumber(v);}
  if(typeof v==='string'){const b=Big.parse(v);if(!b)throw RangeError('Big: not a number: '+v);return b;}
  throw TypeError('Big: unsupported value');
 }
 // Lenient reader for saves: a finite number or a numeric string, else null.
 static parse(v){
  if(v instanceof Big)return v;
  if(v?.[BRAND])return new Big(v.m,v.e);
  if(typeof v==='number')return Number.isFinite(v)?fromNumber(v):null;
  if(typeof v!=='string')return null;
  const match=/^\s*(-?(?:\d+\.?\d*|\.\d+))(?:e([+-]?\d+))?\s*$/i.exec(v);if(!match)return null;
  const m=Number(match[1]),e=match[2]?Number(match[2]):0;
  if(!Number.isFinite(m)||!Number.isSafeInteger(e))return null;
  const n=Number(v);if(Number.isFinite(n)&&Math.abs(n)<LIMIT)return fromNumber(n);
  return m===0?ZERO:make(m,e);
 }
 static max(a,b){a=Big.from(a);b=Big.from(b);return a.cmp(b)>=0?a:b;}
 static min(a,b){a=Big.from(a);b=Big.from(b);return a.cmp(b)<=0?a:b;}
 // [mantissa, exponent] with 1 ≤ |mantissa| < 10 ([0, 0] for zero).
 sci(){
  if(this.e)return [this.m,this.e];
  if(this.m===0)return [0,0];
  const [a,b]=this.m.toExponential().split('e');return [Number(a),Number(b)];
 }
 get sign(){return Math.sign(this.m);}
 isZero(){return this.m===0;}
 neg(){return new Big(-this.m,this.e);}
 abs(){return this.m<0?this.neg():this;}
 add(v){
  const b=Big.from(v);
  if(!this.e&&!b.e){const r=this.m+b.m;if(Math.abs(r)<LIMIT)return new Big(r);}
  if(this.m===0)return b;if(b.m===0)return this;
  const [m1,e1]=this.sci(),[m2,e2]=b.sci();
  if(e1-e2>17)return this;if(e2-e1>17)return b;
  return e1>=e2?make(m1+m2*10**(e2-e1),e1):make(m2+m1*10**(e1-e2),e2);
 }
 sub(v){return this.add(Big.from(v).neg());}
 mul(v){
  const b=Big.from(v);
  if(!this.e&&!b.e){const r=this.m*b.m;if(Math.abs(r)<LIMIT)return new Big(r);}
  if(this.m===0||b.m===0)return ZERO;
  const [m1,e1]=this.sci(),[m2,e2]=b.sci();return make(m1*m2,e1+e2);
 }
 div(v){
  const b=Big.from(v);if(b.m===0)throw RangeError('Big: division by zero');
  if(!this.e&&!b.e){const r=this.m/b.m;if(Math.abs(r)<LIMIT)return new Big(r);}
  if(this.m===0)return ZERO;
  const [m1,e1]=this.sci(),[m2,e2]=b.sci();return make(m1/m2,e1-e2);
 }
 pow(p){
  if(!this.e){const r=this.m**p;if(Number.isFinite(r)&&Math.abs(r)<LIMIT)return new Big(r);}
  if(this.m===0)return ZERO;if(this.m<0)throw RangeError('Big: power of a negative value');
  const [m,e]=this.sci(),t=p*e,ti=Math.floor(t),f=t-ti+p*Math.log10(m),fi=Math.floor(f);
  return make(10**(f-fi),ti+fi);
 }
 sqrt(){if(!this.e&&this.m>=0)return new Big(Math.sqrt(this.m));return this.pow(.5);}
 log10(){if(!this.e)return Math.log10(this.m);return this.e+Math.log10(Math.abs(this.m));}
 // Rounds to `digits` decimals while the value is a plain double.
 round(digits=0){if(this.e)return this;const f=10**digits;return new Big(Math.round(this.m*f)/f);}
 cmp(v){
  const b=Big.from(v);
  if(!this.e&&!b.e)return this.m<b.m?-1:this.m>b.m?1:0;
  const sa=Math.sign(this.m),sb=Math.sign(b.m);
  if(sa!==sb)return sa<sb?-1:1;
  const [m1,e1]=this.sci(),[m2,e2]=b.sci(),x=Math.abs(m1),y=Math.abs(m2);
  const c=e1!==e2?(e1<e2?-1:1):x<y?-1:x>y?1:0;
  return sa>0?c:-c;
 }
 eq(v){return this.cmp(v)===0;}
 gt(v){return this.cmp(v)>0;}
 gte(v){return this.cmp(v)>=0;}
 lt(v){return this.cmp(v)<0;}
 lte(v){return this.cmp(v)<=0;}
 // A double; Infinity once the value passes ~1.8e308.
 toNumber(){return this.e?this.m*10**this.e:this.m;}
 // Saves keep plain numbers while they fit, so they read like before.
 toJSON(){return this.e?`${this.m}e${this.e}`:this.m;}
 toString(){return String(this.toJSON());}
 // Implicit arithmetic or comparison (big > 0, big + 1) is a bug; the checks
 // set globalThis.BIG_STRICT to catch it. Otherwise it falls back to toNumber().
 valueOf(){if(globalThis.BIG_STRICT)throw TypeError('Big: implicit numeric conversion');return this.toNumber();}
}
function fromNumber(n){
 if(Math.abs(n)<LIMIT)return new Big(n);
 const [a,b]=n.toExponential().split('e');return new Big(Number(a),Number(b));
}
// Normalizes any finite mantissa and integer exponent.
function make(m,e){
 if(m===0)return ZERO;
 if(!Number.isFinite(m))throw RangeError('Big: mantissa overflow');
 const d=Math.floor(Math.log10(Math.abs(m)));m/=10**d;e+=d;
 if(Math.abs(m)>=10){m/=10;e++;}else if(Math.abs(m)<1){m*=10;e--;}
 if(e<SPLIT)return new Big(m*10**e);
 return new Big(m,e);
}
export const ZERO=new Big(0),ONE=new Big(1);
export const big=v=>Big.from(v);
