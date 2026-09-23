"use strict";
/* ============ SIMULASI HARIAN & EVENT ============ */

function runDay(){
  S.hari++;
  let rev=0,cost=0;
  refreshPasar();refreshSopir();
  if(S.hari%14===0)refreshTrayek(true);

  /* Bunga pinjaman tiap 30 hari */
  if(S.pinjaman>0&&S.hari%30===0){
    const bunga=Math.round(S.pinjaman*BUNGA_PINJAMAN);
    S.uang-=bunga;cost+=bunga;
    logEv('Bunga pinjaman dibayar: '+rpF(bunga),'warn');
  }
  /* Fluktuasi harga BBM tiap 7 hari */
  if(S.hari%7===0){
    const lama=S.bbm;
    S.bbm=Math.round(S.bbm*rnd(.94,1.06)/50)*50;
    if(Math.abs(S.bbm-lama)>150)
      logEv(`Harga BBM berubah menjadi ${rpF(S.bbm)}/liter.`,S.bbm>lama?'warn':'good');
  }
  /* Hitung mundur musim liburan */
  if(S.boostSisa>0){S.boostSisa--;if(S.boostSisa===0)S.boost=0;}

  /* --- Operasikan setiap trayek aktif --- */
  for(const r of S.rute){
    if(!r.aktif||!r.busId||!r.sopirId)continue;
    const bus=S.bus.find(b=>b.id===r.busId);
    const sop=S.sopir.find(d=>d.id===r.sopirId);
    if(!bus||!sop)continue;

    if(bus.kondisi<=5){
      logEv(`Bus ${bus.plat} tidak bisa jalan (rusak parah). Servis dulu!`,'bad');
      continue;
    }
    if(sop.libur>0){sop.libur--;sop.lelah=Math.max(0,sop.lelah-35);continue;}

    const m=modelOf(bus.model);
    const tripJam=(r.dist*2)/m.kec;
    const trips=Math.max(1,Math.min(8,Math.floor(15/tripJam)));

    /* Risiko mogok (kondisi < 30%) */
    if(bus.kondisi<30&&Math.random()<(30-bus.kondisi)/30*0.35){
      const rugi=ri(6e6,16e6);
      S.uang-=rugi;cost+=rugi;
      bus.kondisi=Math.max(2,bus.kondisi-8);
      S.rep=Math.max(5,S.rep-2);
      logEv(`Bus ${bus.plat} MOGOK di trayek ${r.a}-${r.b}! Biaya darurat ${rpF(rugi)}.`,'bad');
      S.autoPause=true;
      sop.lelah=Math.min(100,sop.lelah+20);
      continue;
    }
    /* Risiko kecelakaan (sopir kelelahan > 88%) */
    if(sop.lelah>88&&Math.random()<0.12){
      const rugi=ri(10e6,30e6);
      S.uang-=rugi;cost+=rugi;
      S.rep=Math.max(5,S.rep-4);
      sop.lelah=60;
      logEv(`Kecelakaan kecil: sopir ${sop.nama} kelelahan. Biaya ${rpF(rugi)}, reputasi turun.`,'bad');
      S.autoPause=true;
      continue;
    }

    /* Hitung okupansi penumpang */
    const fareF=Math.max(.45,Math.min(1.3,1.65-0.65*r.tarifMult));
    const repF=.55+S.rep/220;
    const qualF=.72+bus.kualitas*.07+(m.deck==='dd'?.08:m.deck==='shd'?.05:0);
    const drivF=.82+sop.skill*.055-(sop.lelah>70?(sop.lelah-70)/300:0);
    const demF=(r.demand+S.boost)*rnd(.86,1.1);
    const occ=clampN(demF*fareF*repF*qualF*drivF);

    const pnp=Math.round(m.kursi*occ);
    const fare=pnp*r.fare*r.tarifMult*trips;
    const km=r.dist*2*trips;
    const bbm=(km/m.eff)*S.bbm;
    const wear=km*m.wear/1000;
    rev+=fare;cost+=bbm+wear;

    bus.kondisi=Math.max(0,bus.kondisi-km/2800);
    bus.km+=km;
    sop.lelah=Math.min(100,sop.lelah+6+trips*3);
    if(sop.lelah>70&&Math.random()<.1)
      sop.skill=+Math.min(5,sop.skill+0.1).toFixed(1); // pengalaman naik

    if(occ>.75){
      S.rep=Math.min(100,S.rep+.15);
      if(Math.random()<.08)
        logEv(`Penumpang memuji layanan trayek ${r.a}-${r.b}. Reputasi naik.`,'good');
    }
    r.last={pnp,trips,omset:Math.round(fare)};
  }

  /* --- Gaji sopir (dipotong harian) --- */
  for(const d of S.sopir){
    cost+=d.gaji/30;
    if(d.libur===0&&!S.rute.some(r=>r.sopirId===d.id&&r.aktif))
      d.lelah=Math.max(0,d.lelah-22); // pulih jika tidak bertugas
  }
  cost+=BIAYA_KANTOR_HARIAN;

  S.uang+=rev-cost;
  S.hist.push({h:S.hari,rev:Math.round(rev),cost:Math.round(cost)});
  S.hist=S.hist.slice(-30);

  if(Math.random()<.14)randomEvent();

  if(rev>0)
    logEv(`Hari ${S.hari}: omzet ${rpF(rev)} | biaya ${rpF(cost)} | `
      +`<b>${rev-cost>=0?'laba ':'rugi '}${rpF(Math.abs(rev-cost))}</b>`,
      rev-cost>=0?'good':'bad');
  else
    logEv(`Hari ${S.hari}: tanpa pemasukan. Biaya ${rpF(cost)}.`,'warn');

  if(S.uang<AMBANG_BANGKRUT){bankrupt();return;}
  save();render();
}

/* ---------- Event acak ---------- */
function randomEvent(){
  const r=Math.random();
  if(r<.30){
    S.boost=.3;S.boostSisa=3;
    logEv('LIBUR PANJANG! Permintaan tiket melonjak 3 hari ke depan.','good');
  }else if(r<.50){
    const n=Math.round(rnd(300,900)/50)*50;
    S.bbm+=n;
    logEv(`BBM naik ${rpF(n)}/liter mendadak.`,'warn');
  }else if(r<.62&&S.bus.length){
    const b=pick(S.bus);
    b.kondisi=Math.max(5,b.kondisi-rnd(8,18));
    logEv(`Bus ${b.plat} terserempet di terminal, kondisi menurun.`,'bad');
  }else if(r<.75){
    const n=ri(15e6,60e6);
    S.uang+=n;
    logEv(`Rombongan sewa mendadak! Pemasukan tambahan ${rpF(n)}.`,'good');
  }else if(r<.87){
    S.rep=Math.min(100,S.rep+3);
    logEv('PO kamu diliput media lokal. Reputasi +3.','good');
  }else{
    const n=ri(5e6,20e6);
    S.uang-=n;
    logEv(`Razia uji KIR: denda ${rpF(n)}.`,'bad');
  }
}

/* ---------- Bangkrut ---------- */
function bankrupt(){
  if(S.auto)setAuto(false);
  showModal(
    '<h2 style="color:var(--bad)">BANGKRUT</h2>'
    +`<p style="margin:12px 0" class="dim">Kas menembus ${rpF(S.uang)}. `
    +`${S.po} ditutup kreditur pada hari ke-${S.hari}.</p>`
    +`<button class="btn" onclick="hardReset()">Mulai Perusahaan Baru</button>`
  );
}
function hardReset(){
  localStorage.removeItem(SAVE_KEY);
  closeModal();
  newGame();
  render();
}
