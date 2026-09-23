"use strict";
/* ============ AKSI PEMAIN (beli, jual, rekrut, dll) ============ */

/* ---------- Bus ---------- */
function buyNew(id){
  const m=modelOf(id);
  if(S.uang<m.harga)return alert('Uang tidak cukup.');
  S.uang-=m.harga;
  S.bus.push({
    id:uid(),model:m.id,livery:pickedColor,
    plat:'B '+ri(7000,8999)+' '+pick(['UY','IS','IZ','OA','KE','RU','SG','JA','TE','AN']),
    kondisi:100,kualitas:m.kursi>50?3:4,km:0,harga:m.harga,bekas:false
  });
  logEv(`Membeli unit baru: ${m.nama} (${rpF(m.harga)}).`,'good');
  closeModal();save();render();
}
function buyUsed(i){
  const b=S.pasar.bus[i];if(!b)return;
  if(S.uang<b.harga)return alert('Uang tidak cukup.');
  S.uang-=b.harga;
  S.bus.push(b);
  S.pasar.bus.splice(i,1);
  logEv(`Membeli bus bekas ${modelOf(b.model).nama} plat ${b.plat} (${rpF(b.harga)}).`);
  save();render();
}
function sellBus(id){
  const b=S.bus.find(x=>x.id===id);if(!b)return;
  const v=busValue(b);
  if(!confirm(`Jual bus ${b.plat} seharga ${rpF(v)}?`))return;
  S.rute.forEach(r=>{if(r.busId===id)r.busId=null;});
  S.uang+=v;
  S.bus=S.bus.filter(x=>x.id!==id);
  logEv(`Menjual bus ${b.plat} seharga ${rpF(v)}.`,'warn');
  save();render();
}
function repairBus(id){
  const b=S.bus.find(x=>x.id===id),m=modelOf(b.model);
  if(b.kondisi>=100)return;
  const biaya=Math.max(1e5,Math.round((100-b.kondisi)*m.wear*4/1e5)*1e5);
  if(S.uang<biaya)return alert('Uang tidak cukup untuk servis.');
  S.uang-=biaya;b.kondisi=100;
  logEv(`Servis penuh bus ${b.plat}: ${rpF(biaya)}.`);
  save();render();
}
function upgradeBus(id){
  const b=S.bus.find(x=>x.id===id);
  if(b.kualitas>=5)return alert('Kualitas sudah maksimal.');
  const biaya=25e6+b.kualitas*20e6;
  if(S.uang<biaya)return alert('Uang tidak cukup.');
  S.uang-=biaya;b.kualitas++;
  logEv(`Upgrade layanan bus ${b.plat} ke kualitas ${b.kualitas} (${rpF(biaya)}).`,'good');
  save();render();
}

/* ---------- Sopir ---------- */
function hire(i){
  const d=S.pasar.sopir[i];if(!d)return;
  S.sopir.push(d);
  S.pasar.sopir.splice(i,1);
  logEv(`Merekrut sopir ${d.nama} (skill ${d.skill}, gaji ${rpF(d.gaji)}/bln).`);
  save();render();
}
function fire(id){
  const d=S.sopir.find(x=>x.id===id);
  if(!d||!confirm(`PHK sopir ${d.nama}?`))return;
  S.rute.forEach(r=>{if(r.sopirId===id)r.sopirId=null;});
  S.sopir=S.sopir.filter(x=>x.id!==id);
  logEv(`Sopir ${d.nama} di-PHK.`,'warn');
  save();render();
}
function rest(id){
  const d=S.sopir.find(x=>x.id===id);
  if(d.libur>0)return;
  d.libur=2;
  logEv(`${d.nama} diistirahatkan 2 hari.`);
  save();render();
}

/* ---------- Trayek ---------- */
function openTrayek(i){
  const t=S.trayekTersedia[i];
  if(S.uang<t.izin)return alert('Uang tidak cukup untuk izin trayek.');
  S.uang-=t.izin;
  S.rute.push({...t,id:uid(),aktif:false,busId:null,sopirId:null,tarifMult:1,last:null});
  S.trayekTersedia.splice(i,1);
  logEv(`Izin trayek ${t.a}-${t.b} dibuka (${rpF(t.izin)}).`,'good');
  save();render();
}
function closeTrayek(id){
  const r=S.rute.find(x=>x.id===id);
  if(!r||!confirm(`Tutup trayek ${r.a}-${r.b}? Izin hangus.`))return;
  S.rute=S.rute.filter(x=>x.id!==id);
  logEv(`Trayek ${r.a}-${r.b} ditutup.`,'warn');
  save();render();
}
function assignBus(rid,v){
  const r=S.rute.find(x=>x.id===rid);
  S.rute.forEach(o=>{if(o!==r&&o.busId===v)o.busId=null;});
  r.busId=v||null;save();render();
}
function assignSop(rid,v){
  const r=S.rute.find(x=>x.id===rid);
  S.rute.forEach(o=>{if(o!==r&&o.sopirId===v)o.sopirId=null;});
  r.sopirId=v||null;save();render();
}
function setTarif(rid,v){
  S.rute.find(x=>x.id===rid).tarifMult=+v;
  save();
}
function toggleAktif(rid){
  const r=S.rute.find(x=>x.id===rid);
  r.aktif=!r.aktif;save();render();
}

/* ---------- Pinjaman bank ---------- */
function pinjaman(j){
  if(j>0){
    j=Math.min(j,LIMIT_PINJAMAN-S.pinjaman);
    if(j<=0)return alert(`Limit pinjaman maksimal ${rp(LIMIT_PINJAMAN)}.`);
    S.pinjaman+=j;S.uang+=j;
    logEv(`Mencairkan pinjaman ${rpF(j)} (bunga ${BUNGA_PINJAMAN*100}%/bulan).`,'warn');
  }else{
    if(S.uang<-j)return alert('Uang tidak cukup untuk melunasi.');
    S.uang+=j;S.pinjaman+=j;
    logEv(`Melunasi pinjaman ${rpF(-j)}.`,'good');
  }
  save();render();
}

/* ---------- Lewati banyak hari ---------- */
function runDays(n){
  for(let i=0;i<n;i++){
    if(S.uang<AMBANG_BANGKRUT)break;
    runDay();
  }
}
