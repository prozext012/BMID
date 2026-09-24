"use strict";
/* ============ FUNGSI BANTU UMUM ============ */

const el=id=>document.getElementById(id);
const rnd=(a,b)=>a+Math.random()*(b-a);
const ri=(a,b)=>Math.floor(rnd(a,b+1));
const pick=a=>a[ri(0,a.length-1)];
const uid=()=>Math.random().toString(36).slice(2,9);
const clampN=(v,lo=.15,hi=1)=>Math.max(lo,Math.min(hi,v));
const modelOf=id=>MODELS.find(m=>m.id===id);

/* Format uang ringkas: Rp 1.5 M / Rp 250.0 jt */
const rp=n=>{
  n=Math.round(n);const s=n<0?'-':'';n=Math.abs(n);
  if(n>=1e9)return s+'Rp '+(n/1e9).toFixed(2)+' M';
  if(n>=1e6)return s+'Rp '+(n/1e6).toFixed(1)+' jt';
  return s+'Rp '+n.toLocaleString('id');
};
/* Format uang penuh: Rp 1.500.000 */
const rpF=n=>'Rp '+Math.round(n).toLocaleString('id');

/* Gelapkan/terangkan warna hex untuk efek bodi bus */
function shade(hex,p){
  const n=parseInt(hex.slice(1),16);
  let r=(n>>16)+p,g=((n>>8)&255)+p,b=(n&255)+p;
  r=Math.max(0,Math.min(255,r));
  g=Math.max(0,Math.min(255,g));
  b=Math.max(0,Math.min(255,b));
  return '#'+((r<<16)|(g<<8)|b).toString(16).padStart(6,'0');
}

/* Bintang kualitas (1-5) */
const stars=q=>'<span style="color:var(--warn);letter-spacing:2px">'
  +'&#9733;'.repeat(q)+'<span style="color:#d4dbe6">'+'&#9733;'.repeat(5-q)+'</span></span>';

/* Bar kondisi berwarna */
function condBar(v){
  const col=v>60?'var(--ok)':v>30?'var(--warn)':'var(--bad)';
  return `<div class="bar"><div style="width:${v}%;background:${col}"></div></div>`;
}
