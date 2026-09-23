"use strict";
/* ============ TAMPILAN (RENDER SEMUA HALAMAN) ============ */

function go(t){tab=t;render();}

function render(){
  if(!S)return;
  document.querySelectorAll('.navitem')
    .forEach(n=>n.classList.toggle('active',n.dataset.tab===tab));
  renderTop();
  const c=el('content');
  if(tab==='dash')c.innerHTML=viewDash();
  else if(tab==='armada')c.innerHTML=viewArmada();
  else if(tab==='rute')c.innerHTML=viewRute();
  else if(tab==='sopir')c.innerHTML=viewSopir();
  else if(tab==='bursa')c.innerHTML=viewBursa();
  else c.innerHTML=viewKeuangan();
}

function renderTop(){
  el('topbar').innerHTML=`
  <div class="stat"><div class="label">Kas</div>
    <div class="value" style="color:${S.uang<0?'var(--bad)':'var(--ok)'}">${rp(S.uang)}</div></div>
  <div class="stat"><div class="label">Hari Ke-</div><div class="value">${S.hari}</div></div>
  <div class="stat"><div class="label">Reputasi PO</div><div class="value">${Math.round(S.rep)} / 100</div>
    <div class="bar" style="width:100%;margin-top:5px"><div style="width:${S.rep}%;background:var(--acc)"></div></div></div>
  <div class="stat"><div class="label">BBM / liter</div><div class="value">${rpF(S.bbm)}</div></div>
  <div class="stat" style="display:flex;align-items:center;gap:8px">
    <button class="btn" onclick="runDay()">Jalankan 1 Hari</button>
    <button class="btn gray" onclick="runDays(7)">Lewati 7 Hari</button>
  </div>`;
}

/* ---------- Dashboard ---------- */
function viewDash(){
  const n=S.bus.length;
  const aktif=S.rute.filter(r=>r.aktif&&r.busId&&r.sopirId).length;
  const avg=n?Math.round(S.bus.reduce((a,b)=>a+b.kondisi,0)/n):0;
  return `
  <h2 class="sec">Dashboard ${S.po}</h2>
  <div class="grid" style="grid-template-columns:repeat(auto-fit,minmax(190px,1fr));margin-bottom:14px">
    <div class="card"><div class="dim">Total Armada</div><div style="font-size:25px;font-weight:700">${n}</div></div>
    <div class="card"><div class="dim">Trayek Aktif</div><div style="font-size:25px;font-weight:700">${aktif} / ${S.rute.length}</div></div>
    <div class="card"><div class="dim">Jumlah Sopir</div><div style="font-size:25px;font-weight:700">${S.sopir.length}</div></div>
    <div class="card"><div class="dim">Rata-rata Kondisi</div><div style="font-size:25px;font-weight:700;color:${avg>60?'var(--ok)':avg>30?'var(--warn)':'var(--bad)'}">${avg}%</div></div>
    <div class="card"><div class="dim">Pinjaman Bank</div><div style="font-size:25px;font-weight:700;color:${S.pinjaman>0?'var(--warn)':'var(--txt)'}">${rp(S.pinjaman)}</div></div>
  </div>
  ${S.boostSisa>0?`<div class="card" style="border-color:var(--ok);margin-bottom:14px">
    <b style="color:var(--ok)">Musim liburan berlangsung!</b>
    <span class="dim">Permintaan penumpang naik ${Math.round(S.boost*100)}% selama ${S.boostSisa} hari lagi.</span></div>`:''}
  <h2 class="sec">Riwayat Aktivitas</h2>
  <div class="log">${S.log.map(l=>`<p class="${l.c}"><b>[Hari ${l.h}]</b> ${l.t}</p>`).join('')
    ||'<p>Belum ada aktivitas.</p>'}</div>`;
}

/* ---------- Armada ---------- */
function viewArmada(){
  return `<h2 class="sec">Armada Bus (${S.bus.length})</h2>
  <div class="grid" style="grid-template-columns:repeat(auto-fill,minmax(310px,1fr))">
  ${S.bus.map(b=>{
    const m=modelOf(b.model),r=S.rute.find(x=>x.busId===b.id);
    const rep=Math.max(1e5,Math.round((100-b.kondisi)*m.wear*4/1e5)*1e5);
    const up=25e6+b.kualitas*20e6;
    return `<div class="card">
      ${busImg(b.model,b.livery)}
      <div class="between"><b>${m.nama}</b>
        <span class="tag ${r?'info':'ok'}">${r?'Tugas: '+r.a+'-'+r.b:'Standby'}</span></div>
      <p class="dim" style="margin:6px 0">Plat: <b style="color:var(--txt)">${b.plat}</b>
        ${b.bekas?'<span class="tag warn">Bekas</span>':'<span class="tag ok">Baru</span>'}
        | KM: ${Math.round(b.km).toLocaleString('id')}</p>
      <div class="flex" style="margin:6px 0"><span class="dim">Kondisi:</span>${condBar(b.kondisi)}
        <span class="dim">Layanan:</span>${stars(b.kualitas)}</div>
      <p class="dim">Kursi ${m.kursi} | ${m.kec} km/j | ${m.eff} km/l | Nilai jual ${rp(busValue(b))}</p>
      <div class="flex" style="margin-top:9px">
        <button class="btn sm warn" ${b.kondisi>=100?'disabled':''} onclick="repairBus('${b.id}')">Servis (${rp(rep)})</button>
        <button class="btn sm" ${b.kualitas>=5?'disabled':''} onclick="upgradeBus('${b.id}')">Upgrade (${rp(up)})</button>
        <button class="btn sm red" onclick="sellBus('${b.id}')">Jual</button>
      </div></div>`;}).join('')}
  ${S.bus.length===0?'<div class="card dim">Kamu tidak punya bus. Beli di Bursa Bus.</div>':''}
  </div>`;
}

/* ---------- Trayek ---------- */
function viewRute(){
  const bO=s=>'<option value="">-- pilih bus --</option>'+S.bus.map(b=>
    `<option value="${b.id}" ${s===b.id?'selected':''}>${modelOf(b.model).nama} (${b.plat}, ${Math.round(b.kondisi)}%)</option>`).join('');
  const sO=s=>'<option value="">-- pilih sopir --</option>'+S.sopir.map(d=>
    `<option value="${d.id}" ${s===d.id?'selected':''}>${d.nama} (skill ${d.skill}, lelah ${Math.round(d.lelah)}%)</option>`).join('');
  return `<h2 class="sec">Trayek Milik (${S.rute.length})</h2>
  ${S.rute.length===0?'<div class="card dim" style="margin-bottom:16px">Belum ada trayek. Buka izin trayek di Pasar Trayek di bawah.</div>':''}
  <div class="grid" style="grid-template-columns:repeat(auto-fill,minmax(420px,1fr));margin-bottom:22px">
  ${S.rute.map(r=>{
    const siap=r.busId&&r.sopirId;
    return `<div class="card" style="border-color:${r.aktif&&siap?'var(--ok)':r.aktif?'var(--bad)':'var(--line)'}">
      <div class="between"><b style="font-size:15px">${r.a} &rarr; ${r.b}</b>
        <div class="flex">
          <button class="btn sm ${r.aktif?'red':'green'}" onclick="toggleAktif('${r.id}')">${r.aktif?'Nonaktifkan':'Aktifkan'}</button>
          <button class="btn sm gray" onclick="closeTrayek('${r.id}')">Tutup</button>
        </div></div>
      <p class="dim" style="margin:5px 0">Jarak ${r.dist} km | Tarif dasar ${rp(r.fare)} | Permintaan ${Math.round(r.demand*100)}%</p>
      ${r.last?`<p class="dim">Operasi terakhir: <b style="color:var(--txt)">${r.last.pnp} pnp x ${r.last.trips} trip = ${rpF(r.last.omset)}</b></p>`:''}
      <div class="grid" style="margin-top:7px">
        <select onchange="assignBus('${r.id}',this.value)">${bO(r.busId)}</select>
        <select onchange="assignSop('${r.id}',this.value)">${sO(r.sopirId)}</select>
        <div class="flex">
          <span class="dim" id="tm-${r.id}">Tarif: x${(+r.tarifMult).toFixed(2)}</span>
          <input type="range" min="0.8" max="1.5" step="0.05" value="${r.tarifMult}" style="flex:1"
            oninput="setTarif('${r.id}',this.value);document.getElementById('tm-${r.id}').textContent='Tarif: x'+(+this.value).toFixed(2)">
          <span class="dim">tarif tinggi = okupansi turun</span>
        </div>
      </div>
      ${r.aktif&&!siap?'<p style="color:var(--bad);font-size:12px;margin-top:6px">Trayek aktif tapi belum ada bus/sopir - tidak akan beroperasi.</p>':''}
    </div>`;}).join('')}
  </div>
  <h2 class="sec">Pasar Trayek (segarkan tiap 14 hari)</h2>
  <div class="grid" style="grid-template-columns:repeat(auto-fill,minmax(290px,1fr))">
  ${S.trayekTersedia.map((t,i)=>`<div class="card">
      <b>${t.a} - ${t.b}</b>
      <p class="dim" style="margin:6px 0">Jarak ${t.dist} km | Tarif dasar ${rp(t.fare)} | Permintaan ${Math.round(t.demand*100)}%</p>
      <button class="btn sm" onclick="openTrayek(${i})">Buka Izin (${rp(t.izin)})</button>
    </div>`).join('')}
  ${S.trayekTersedia.length===0?'<div class="card dim">Semua trayek tersedia sudah kamu miliki.</div>':''}
  </div>`;
}

/* ---------- Sopir ---------- */
function viewSopir(){
  const lt=d=>d.lelah>80?'<span class="tag bad">Sangat Lelah</span>'
    :d.lelah>55?'<span class="tag warn">Lelah</span>':'<span class="tag ok">Bugar</span>';
  return `<h2 class="sec">Sopir (${S.sopir.length})</h2>
  <div class="card" style="margin-bottom:18px;overflow-x:auto"><table>
    <tr><th>Nama</th><th>Skill</th><th>Gaji/bln</th><th>Kelelahan</th><th>Status</th><th>Tugas</th><th>Aksi</th></tr>
    ${S.sopir.map(d=>{
      const r=S.rute.find(x=>x.sopirId===d.id);
      const st=d.libur>0?`<span class="tag info">Libur ${d.libur} hari</span>`:lt(d);
      return `<tr><td><b>${d.nama}</b></td><td>${stars(Math.round(d.skill))}</td><td>${rpF(d.gaji)}</td>
      <td><div class="bar"><div style="width:${d.lelah}%;background:${d.lelah>80?'var(--bad)':d.lelah>55?'var(--warn)':'var(--ok)'}"></div></div></td>
      <td>${st}</td><td class="dim">${r?r.a+'-'+r.b:'-'}</td>
      <td class="flex">
        <button class="btn sm gray" onclick="rest('${d.id}')" ${d.libur>0?'disabled':''}>Istirahatkan</button>
        <button class="btn sm red" onclick="fire('${d.id}')">PHK</button>
      </td></tr>`;}).join('')}
    ${S.sopir.length===0?'<tr><td colspan="7" class="dim">Belum ada sopir. Rekrut di bursa bawah.</td></tr>':''}
  </table></div>
  <h2 class="sec">Bursa Sopir (segarkan tiap 3 hari)</h2>
  <div class="grid" style="grid-template-columns:repeat(auto-fill,minmax(235px,1fr))">
  ${S.pasar.sopir.map((d,i)=>`<div class="card">
      <b>${d.nama}</b>
      <p class="dim" style="margin:6px 0">Skill: ${stars(Math.round(d.skill))}<br>
      Gaji diminta: ${rpF(d.gaji)}/bulan<br>Kelelahan awal: ${d.lelah}%</p>
      <button class="btn sm green" onclick="hire(${i})">Rekrut</button>
    </div>`).join('')}
  </div>`;
}

/* ---------- Bursa Bus ---------- */
function viewBursa(){
  return `<h2 class="sec">Beli Bus Baru</h2>
  <div class="grid" style="grid-template-columns:repeat(auto-fill,minmax(290px,1fr));margin-bottom:24px">
  ${MODELS.map(m=>`<div class="card">
      ${busImg(m.id,'#1f5fd0')}
      <b>${m.nama}</b>
      <p class="dim" style="margin:6px 0">Kursi ${m.kursi} | ${m.kec} km/j | ${m.eff} km/liter | Aus ${rp(m.wear)}/km</p>
      <div class="between"><b style="color:var(--ok)">${rp(m.harga)}</b>
        <button class="btn sm" onclick="modalBeli('${m.id}')">Beli</button></div>
    </div>`).join('')}
  </div>
  <h2 class="sec">Bus Bekas (stok berganti tiap 7 hari)</h2>
  <div class="grid" style="grid-template-columns:repeat(auto-fill,minmax(290px,1fr))">
  ${S.pasar.bus.map((b,i)=>`<div class="card">
      ${busImg(b.model,b.livery)}
      <b>${modelOf(b.model).nama}</b> <span class="tag warn">Bekas</span>
      <p class="dim" style="margin:6px 0">Plat ${b.plat} | KM ${Math.round(b.km).toLocaleString('id')} | Layanan ${stars(b.kualitas)}</p>
      <div class="flex"><span class="dim">Kondisi:</span>${condBar(b.kondisi)}</div>
      <div class="between" style="margin-top:9px"><b style="color:var(--ok)">${rp(b.harga)}</b>
        <button class="btn sm green" onclick="buyUsed(${i})">Beli</button></div>
    </div>`).join('')}
  ${S.pasar.bus.length===0?'<div class="card dim">Stok bus bekas habis, kembali beberapa hari lagi.</div>':''}
  </div>`;
}

/* ---------- Keuangan ---------- */
function viewKeuangan(){
  const h=S.hist.slice(-14);
  const mx=Math.max(1,...h.map(x=>Math.max(x.rev,x.cost)));
  const tR=h.reduce((a,x)=>a+x.rev,0),tC=h.reduce((a,x)=>a+x.cost,0);
  const aset=S.bus.reduce((a,b)=>a+busValue(b),0);
  return `<h2 class="sec">Keuangan</h2>
  <div class="grid" style="grid-template-columns:repeat(auto-fit,minmax(200px,1fr));margin-bottom:14px">
    <div class="card"><div class="dim">Kas saat ini</div><div style="font-size:21px;font-weight:700;color:${S.uang<0?'var(--bad)':'var(--ok)'}">${rpF(S.uang)}</div></div>
    <div class="card"><div class="dim">Omzet 14 hari</div><div style="font-size:21px;font-weight:700">${rpF(tR)}</div></div>
    <div class="card"><div class="dim">Biaya 14 hari</div><div style="font-size:21px;font-weight:700;color:var(--bad)">${rpF(tC)}</div></div>
    <div class="card"><div class="dim">Laba bersih 14 hari</div><div style="font-size:21px;font-weight:700;color:${tR-tC>=0?'var(--ok)':'var(--bad)'}">${rpF(tR-tC)}</div></div>
    <div class="card"><div class="dim">Nilai aset bus</div><div style="font-size:21px;font-weight:700">${rpF(aset)}</div></div>
  </div>
  <div class="card" style="margin-bottom:14px"><b>Grafik Omzet (hijau) vs Biaya (merah) - 14 hari terakhir</b>
    <div class="chart">${h.map(x=>`<div class="bcol"><div class="bars">
        <div class="b" style="height:${x.rev/mx*100}%;background:var(--ok)" title="Omzet ${rpF(x.rev)}"></div>
        <div class="b" style="height:${x.cost/mx*100}%;background:var(--bad)" title="Biaya ${rpF(x.cost)}"></div>
      </div><div class="dim" style="text-align:center;font-size:9px;margin-top:3px">H${x.h}</div></div>`).join('')}
    </div>
    ${h.length===0?'<p class="dim" style="margin-top:8px">Jalankan hari terlebih dahulu untuk melihat grafik.</p>':''}
  </div>
  <div class="card"><b>Bank &amp; Pinjaman</b>
    <p class="dim" style="margin:8px 0">Utang berjalan: <b style="color:var(--txt)">${rpF(S.pinjaman)}</b>
      | Bunga ${BUNGA_PINJAMAN*100}% per 30 hari dipotong otomatis | Limit ${rp(LIMIT_PINJAMAN)}</p>
    <div class="flex">
      <button class="btn warn" onclick="pinjaman(50e6)">Pinjam 50 jt</button>
      <button class="btn warn" onclick="pinjaman(100e6)">Pinjam 100 jt</button>
      <button class="btn green" onclick="pinjaman(-Math.min(S.pinjaman,50e6))" ${S.pinjaman===0?'disabled':''}>Bayar 50 jt</button>
      <button class="btn green" onclick="pinjaman(-S.pinjaman)" ${S.pinjaman===0?'disabled':''}>Lunasi Semua</button>
    </div>
  </div>`;
}

/* ---------- Modal ---------- */
function showModal(h){
  el('modal-root').innerHTML=
    `<div class="modal-bg" onclick="if(event.target===this)closeModal()"><div class="modal">${h}</div></div>`;
}
function closeModal(){el('modal-root').innerHTML='';}

/* Modal beli bus baru (dengan pilihan warna + preview) */
function modalBeli(id){
  pickedColor=LIVERY[0];
  const m=modelOf(id);
  const draw=()=>{el('prevBus').innerHTML=busImg(id,pickedColor);};
  showModal(`<h2>Beli ${m.nama}</h2>
    <div id="prevBus"></div>
    <p class="dim">Harga: <b style="color:var(--txt)">${rpF(m.harga)}</b> | Kursi: ${m.kursi}
      | Kecepatan: ${m.kec} km/j | Konsumsi: ${m.eff} km/liter</p>
    <p style="margin-top:10px;font-size:13px">Pilih warna livery (bingkai foto &amp; identitas PO):</p>
    <div class="colorpick">${LIVERY.map(c=>
      `<div class="swatch ${c===pickedColor?'sel':''}" style="background:${c}" data-c="${c}"></div>`).join('')}</div>
    <div class="flex" style="margin-top:12px">
      <button class="btn green" id="btnBeli">Beli Sekarang</button>
      <button class="btn gray" onclick="closeModal()">Batal</button>
    </div>`);
  draw();
  el('modal-root').querySelectorAll('.swatch').forEach(sw=>sw.onclick=()=>{
    pickedColor=sw.dataset.c;
    el('modal-root').querySelectorAll('.swatch').forEach(x=>x.classList.remove('sel'));
    sw.classList.add('sel');
    draw();
  });
  el('btnBeli').onclick=()=>buyNew(id);
}

/* ---------- Inisialisasi menu navigasi ---------- */
document.querySelectorAll('.navitem').forEach(n=>{
  n.innerHTML=ICONS[n.dataset.tab]+'<span>'+LABELS[n.dataset.tab]+'</span>';
  n.onclick=()=>go(n.dataset.tab);
});
