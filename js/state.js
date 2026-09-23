"use strict";
/* ============ STATE GAME & SAVE/LOAD ============ */

let S=null;          // state utama
let tab='dash';      // halaman aktif
let pickedColor=LIVERY[0];

/* ---------- Generator ---------- */
function genDriver(lo,hi){
  const sk=+rnd(lo,hi).toFixed(1);
  return {
    id:uid(),
    nama:pick(NDEPAN)+' '+pick(NBLK),
    skill:sk,
    gaji:Math.round((2.2e6+sk*900e3)/1e5)*1e5,
    lelah:ri(0,25),
    libur:0
  };
}

function genUsedBus(){
  const m=pick(MODELS),k=ri(35,80);
  return {
    id:uid(),model:m.id,livery:pick(LIVERY),
    plat:'B '+ri(7000,8999)+' '+pick(['UY','IS','IZ','OA','KE','RU','SG','JA','TE','AN']),
    kondisi:k,
    kualitas:Math.max(1,(m.kursi>50?2:3)+ri(-1,1)),
    km:ri(80e3,600e3),
    harga:Math.round(m.harga*(0.35+k/100*0.35)/1e6)*1e6,
    bekas:true
  };
}

function busValue(b){
  return Math.round(b.harga*(0.35+b.kondisi/100*0.45)/1e6)*1e6;
}

/* ---------- Siklus permainan baru ---------- */
function newGame(){
  const nama=prompt('Nama perusahaan otobus kamu:','PO Sumber Rejeki')||'PO Sumber Rejeki';
  S={
    po:nama, uang:280e6, hari:1, rep:50, bbm:6800,
    bus:[], sopir:[], rute:[], log:[], hist:[], pinjaman:0,
    boost:0, boostSisa:0,
    pasar:{bus:[],sopir:[],refBus:0,refSop:0},
    trayekTersedia:[]
  };
  // modal awal: 1 bus bekas + 1 sopir
  S.bus.push({
    id:uid(),model:'ekonomi',livery:LIVERY[0],plat:'B 7412 UY',
    kondisi:96,kualitas:3,km:12000,harga:250e6,bekas:true
  });
  S.sopir.push(genDriver(2.5,3.5));
  refreshPasar(true);refreshSopir(true);refreshTrayek(true);
  logEv(`Perusahaan <b>${S.po}</b> resmi berdiri. Modal awal ${rp(S.uang)}. Selamat berbisnis!`,'good');
  save();
}

/* ---------- Pasar (refresh berkala) ---------- */
function refreshPasar(f){
  if(!f&&S.hari<S.pasar.refBus)return;
  S.pasar.bus=[genUsedBus(),genUsedBus(),genUsedBus(),genUsedBus()];
  S.pasar.refBus=S.hari+7;
}
function refreshSopir(f){
  if(!f&&S.hari<S.pasar.refSop)return;
  S.pasar.sopir=[genDriver(1.5,3),genDriver(2,3.8),genDriver(2.8,4.5),genDriver(3.5,5)];
  S.pasar.refSop=S.hari+3;
}
function refreshTrayek(f){
  if(!f&&S.trayekTersedia.length)return;
  const own=S.rute.map(r=>r.key);
  const pool=TRAYEK.filter(t=>!own.includes(t.a+'-'+t.b));
  S.trayekTersedia=pool.sort(()=>Math.random()-.5).slice(0,6)
    .map(t=>({...t,key:t.a+'-'+t.b}));
}

/* ---------- Log ---------- */
function logEv(t,c){
  S.log.unshift({h:S.hari,t,c:c||''});
  if(S.log.length>40)S.log.length=40;
}

/* ---------- Save / Load ---------- */
function save(){
  try{localStorage.setItem(SAVE_KEY,JSON.stringify(S));}catch(e){}
}
function load(){
  try{
    const r=localStorage.getItem(SAVE_KEY);
    if(r){S=JSON.parse(r);return true;}
  }catch(e){}
  return false;
}
