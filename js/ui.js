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

/* ---------- Topbar KPI + kontrol waktu ---------- */
function renderTop(){
  el('topbar').innerHTML=`
  <div class="kpis">
    <div class="kpi"><span class="k-l">Kas</span>
      <span class="k-v ${S.uang<0?'neg':'pos'}">${rp(S.uang)}</span></div>
    <div class="kpi"><span class="k-l">Hari</span><span class="k-v">${S.hari}</span></div>
    <div class="kpi"><span class="k-l">Reputasi</span>
      <span class="k-v">${Math.round(S.rep)}<em>/100</em></span>
      <div class="kbar"><i style="width:${S.rep}%"></i></div></div>
    <div class="kpi"><span class="k-l">BBM</span><span class="k-v">${rpF(S.bbm)}<em>/liter</em></span></div>
  </div>
  <div class="tact">
    <button class="btn sm" onclick="runDay()">+1 Hari</button>
    <button class="btn sm ghost" onclick="runDays(7)">+7 Hari</button>
    <button class="btn sm ${S.auto?'stop':'go'}" onclick="setAuto(!S.auto)">${S.auto?'&#10074;&#10074; Jeda':'&#9654; Auto'}</button>
    <select class="spd" onchange="setSpeed(this.value)" title="Kecepatan auto">
      <option value="1"${S.speed===1?' selected':''}>1x</option>
      <option value="2"${S.speed===2?' selected':''}>2x</option>
      <option value="4"${S.speed===4?' selected':''}>4x</option>
    </select>
  </div>`;
}

/* ---------- SVG peta jaringan (dipakai di dashboard) ---------- */
function mapSVG(){
  const pulau=`
   <path d="M70 40 L110 55 L150 110 L175 165 L160 175 L120 140 L85 90 Z" fill="#dce6f4"/>
   <path d="M175 185 L310 200 L315 215 L240 232 L180 205 Z" fill="#dce6f4"/>
   <path d="M295 240 L320 238 L325 246 L300 248 Z" fill="#dce6f4"/>
   <path d="M300 60 L380 70 L400 130 L360 165 L310 140 Z" fill="#dce6f4"/>
   <path d="M420 150 L450 140 L470 170 L460 210 L480 250 L460 262 L440 220 L430 250 L415 245 L425 190 Z" fill="#dce6f4"/>
   <path d="M560 170 L625 180 L625 260 L575 250 L560 210 Z" fill="#dce6f4"/>`;
  const lines=S.rute.map(r=>{
    const a=KOTA[r.a],b=KOTA[r.b];
    if(!a||!b)return '';
    const siap=r.busId&&r.sopirId;
    const col=!r.aktif?'#cbd5e1':(siap?'#16a34a':'#dc2626');
    const dash=!r.aktif?'stroke-dasharray="5 5"':'';
    let bus='';
    if(r.aktif&&siap){
      const dur=Math.max(2.5,r.dist/140);
      bus=`<circle r="3.5" fill="#f59e0b"><animateMotion dur="${dur}s" repeatCount="indefinite" path="M${a.x} ${a.y} L${b.x} ${b.y}"/></circle>
           <circle r="3.5" fill="#f59e0b"><animateMotion dur="${dur}s" repeatCount="indefinite" path="M${b.x} ${b.y} L${a.x} ${a.y}"/></circle>`;
    }
    return `<line x1="${a.x}" y1="${a.y}" x2="${b.x}" y2="${b.y}" stroke="${col}" stroke-width="2" ${dash} opacity=".9"/>`+bus;
  }).join('');
  const nodes=Object.keys(KOTA).map(n=>{
    const p=KOTA[n];
    const own=S.rute.some(r=>r.a===n||r.b===n);
    const act=S.rute.some(r=>(r.a===n||r.b===n)&&r.aktif&&r.busId&&r.sopirId);
    return `<circle cx="${p.x}" cy="${p.y}" r="${own?6:3.5}" fill="${act?'#16a34a':own?'#2563eb':'#94a3b8'}" stroke="#f4f6fa" stroke-width="2"/>
    <text x="${p.x}" y="${p.y-10}" text-anchor="middle" font-size="11" font-weight="${own?700:400}" fill="${own?'#182135':'#69758c'}">${n}</text>`;
  }).join('');
  return `<svg viewBox="0 0 640 280" xmlns="http://www.w3.org/2000/svg">${pulau}${lines}${nodes}</svg>`;
}

/* ---------- Daftar masalah yang butuh tindakan ---------- */
function buildAlerts(){
  const a=[];
  S.bus.forEach(b=>{if(b.kondisi<35)
    a.push({c:'bad',t:`Bus ${b.plat} kondisi ${Math.round(b.kondisi)}% - segera servis.`,go:'armada',btn:'Servis'});});
  S.sopir.forEach(d=>{if(d.lelah>80&&d.libur===0)
    a.push({c:'warn',t:`Sopir ${d.nama} kelelahan ${Math.round(d.lelah)}%.`,go:'sopir',btn:'Atur'});});
  S.rute.forEach(r=>{if(r.aktif&&(!r.busId||!r.sopirId))
    a.push({c:'warn',t:`Trayek ${r.a}-${r.b} aktif tapi bus/sopir belum lengkap.`,go:'rute',btn:'Lengkapi'});});
  if(S.uang<0)a.push({c:'bad',t:'Kas minus - pertimbangkan pinjaman atau jual aset.',go:'keuangan',btn:'Bank'});
  return a.slice(0,6);
}

/* ---------- Dashboard: peta + alert + ringkasan + log ---------- */
function viewDash(){
  const alerts=buildAlerts();
  const nAktif=S.rute.filter(r=>r.aktif&&r.busId&&r.sopirId).length;
  const last=S.hist[S.hist.length-1];
  return `
  <div class="pagehead"><h2>Dashboard</h2><span class="dim">${S.po}</span></div>
  <div class="dashgrid">
    <div class="card mapcard">
      <div class="chead"><b>Peta Jaringan</b><span class="dim">${nAktif} trayek aktif &middot; ${S.rute.length} dimiliki</span></div>
      ${mapSVG()}
      <div class="maplegend">
        <span><i style="background:#16a34a"></i>Aktif</span>
        <span><i style="background:#dc2626"></i>Belum lengkap</span>
        <span><i style="background:#cbd5e1"></i>Nonaktif</span>
        <span><i style="background:#f59e0b;width:6px;height:6px;border-radius:50%"></i>Bus berjalan</span>
      </div>
    </div>
    <div class="dashside">
      <div class="card">
        <div class="chead"><b>Perlu Tindakan</b>
          ${alerts.length?`<span class="tag bad">${alerts.length} masalah</span>`:'<span class="tag ok">Aman</span>'}</div>
        <div class="alerts">
          ${alerts.length?alerts.map(a=>`<div class="alert ${a.c}"><span>${a.t}</span>
            <button class="btn sm ghost" onclick="go('${a.go}')">${a.btn}</button></div>`).join('')
          :'<p class="dim empty">Semua normal. Tidak ada tindakan mendesak.</p>'}
        </div>
      </div>
      <div class="card">
        <div class="chead"><b>Operasi Terakhir</b><span class="dim">Hari ${last?last.h:'-'}</span></div>
        ${last?`
        <div class="minirow"><span class="dim">Omzet</span><b class="pos">${rpF(last.rev)}</b></div>
        <div class="minirow"><span class="dim">Biaya</span><b class="neg">${rpF(last.cost)}</b></div>
        <div class="minirow"><span class="dim">Laba bersih</span>
          <b class="${last.rev-last.cost>=0?'pos':'neg'}">${rpF(last.rev-last.cost)}</b></div>`
        :'<p class="dim empty">Belum ada data. Jalankan hari pertama.</p>'}
      </div>
    </div>
  </div>
  <div class="card" style="margin-top:12px">
    <div class="chead"><b>Log Aktivitas</b><span class="dim">${S.log.length} entri</span></div>
    <div class="log">${S.log.map(l=>`<p class="${l.c}"><b>[H${l.h}]</b> ${l.t}</p>`).join('')
      ||'<p>Belum ada aktivitas.</p>'}</div>
  </div>`;
}

/* ---------- Armada: baris kompak ---------- */
function viewArmada(){
  return `<div class="pagehead"><h2>Armada (${S.bus.length})</h2>
    <button class="btn sm" onclick="go('bursa')">+ Tambah Bus</button></div>
  <div class="list">
  ${S.bus.map(b=>{
    const m=modelOf(b.model),r=S.rute.find(x=>x.busId===b.id);
    const rep=Math.max(1e5,Math.round((100-b.kondisi)*m.wear*4/1e5)*1e5);
    const up=25e6+b.kualitas*20e6;
    return `<div class="card row">
      <div class="thumb">${busImg(b.model,b.livery)}</div>
      <div class="rinfo">
        <div class="rline"><b>${m.nama}</b>
          <span>${r?`<span class="tag info">${r.a}-${r.b}</span>`:'<span class="tag gray">Standby</span>'}
          ${b.kondisi<35?'<span class="tag bad">Perlu Servis</span>':''}</span></div>
        <div class="rsub dim">${b.plat} &middot; ${Math.round(b.km).toLocaleString('id')} km &middot; ${b.bekas?'Bekas':'Baru'} &middot; Nilai jual ${rp(busValue(b))}</div>
        <div class="rline2"><span class="dim">Kondisi</span>${condBar(b.kondisi)}
          <span class="dim">Layanan</span>${stars(b.kualitas)}</div>
      </div>
      <div class="ract">
        <button class="btn sm warn" ${b.kondisi>=100?'disabled':''} onclick="repairBus('${b.id}')">Servis ${rp(rep)}</button>
        <button class="btn sm ghost" ${b.kualitas>=5?'disabled':''} onclick="upgradeBus('${b.id}')">Upgrade ${rp(up)}</button>
        <button class="btn sm red" onclick="sellBus('${b.id}')">Jual</button>
      </div></div>`;}).join('')}
  ${S.bus.length===0?'<div class="card dim">Kamu tidak punya bus. Beli di Bursa Bus.</div>':''}
  </div>`;
}

/* ---------- Trayek: tabel padat + pasar izin ---------- */
function viewRute(){
  const bO=s=>'<option value="">-- bus --</option>'+S.bus.map(b=>
    `<option value="${b.id}" ${s===b.id?'selected':''}>${modelOf(b.model).nama} (${b.plat}, ${Math.round(b.kondisi)}%)</option>`).join('');
  const sO=s=>'<option value="">-- sopir --</option>'+S.sopir.map(d=>
    `<option value="${d.id}" ${s===d.id?'selected':''}>${d.nama} (skl ${d.skill}, lelah ${Math.round(d.lelah)}%)</option>`).join('');
  return `<div class="pagehead"><h2>Trayek (${S.rute.length})</h2></div>
  ${S.rute.length?`<div class="card tblwrap"><table>
    <tr><th>Rute</th><th>Status</th><th>Bus</th><th>Sopir</th><th>Tarif</th><th>Hasil Terakhir</th><th>Aksi</th></tr>
    ${S.rute.map(r=>{
      const siap=r.busId&&r.sopirId;
      return `<tr>
      <td><b>${r.a} &rarr; ${r.b}</b><div class="dim">${r.dist} km &middot; dasar ${rp(r.fare)} &middot; demand ${Math.round(r.demand*100)}%</div></td>
      <td><span class="tag ${r.aktif?(siap?'ok':'bad'):'gray'}">${r.aktif?(siap?'Aktif':'Belum lengkap'):'Nonaktif'}</span></td>
      <td><select class="cell" onchange="assignBus('${r.id}',this.value)">${bO(r.busId)}</select></td>
      <td><select class="cell" onchange="assignSop('${r.id}',this.value)">${sO(r.sopirId)}</select></td>
      <td><div class="tarif"><input type="range" min="0.8" max="1.5" step="0.05" value="${r.tarifMult}"
        oninput="setTarif('${r.id}',this.value);this.nextElementSibling.textContent='x'+(+this.value).toFixed(2)"><b>x${(+r.tarifMult).toFixed(2)}</b></td>
      <td class="dim">${r.last?`${r.last.pnp} pnp &times;${r.last.trips} trip<br><b class="pos">${rp(r.last.omset)}</b>`:'-'}</td>
      <td><div class="rowact">
        <button class="btn sm ${r.aktif?'stop':'go'}" onclick="toggleAktif('${r.id}')">${r.aktif?'Stop':'Mulai'}</button>
        <button class="btn sm ghost" onclick="closeTrayek('${r.id}')">Tutup</button>
      </div></td></tr>`;}).join('')}
  </table></div>`
  :'<div class="card dim" style="margin-bottom:14px">Belum ada trayek. Buka izin di Pasar Trayek bawah.</div>'}
  <div class="pagehead" style="margin-top:16px"><h2 style="font-size:14px">Pasar Izin Trayek</h2>
    <span class="dim">stok segarkan tiap 14 hari</span></div>
  <div class="card tblwrap"><table>
    <tr><th>Rute</th><th>Jarak</th><th>Tarif Dasar</th><th>Permintaan</th><th>Harga Izin</th><th></th></tr>
    ${S.trayekTersedia.map((t,i)=>`<tr>
      <td><b>${t.a} - ${t.b}</b></td><td>${t.dist} km</td><td>${rp(t.fare)}</td>
      <td>${Math.round(t.demand*100)}%</td><td class="pos">${rp(t.izin)}</td>
      <td><button class="btn sm" onclick="openTrayek(${i})">Buka Izin</button></td></tr>`).join('')}
    ${S.trayekTersedia.length===0?'<tr><td colspan="6" class="dim">Semua trayek tersedia sudah kamu miliki.</td></tr>':''}
  </table></div>`;
}

/* ---------- Sopir: tabel + bursa ---------- */
function viewSopir(){
  const lt=d=>d.lelah>80?'<span class="tag bad">Sangat Lelah</span>'
    :d.lelah>55?'<span class="tag warn">Lelah</span>':'<span class="tag ok">Bugar</span>';
  return `<div class="pagehead"><h2>Sopir (${S.sopir.length})</h2></div>
  <div class="card tblwrap"><table>
    <tr><th>Nama</th><th>Skill</th><th>Gaji/bln</th><th>Kelelahan</th><th>Status</th><th>Tugas</th><th>Aksi</th></tr>
    ${S.sopir.map(d=>{
      const r=S.rute.find(x=>x.sopirId===d.id);
      const st=d.libur>0?`<span class="tag info">Libur ${d.libur} hari</span>`:lt(d);
      return `<tr><td><b>${d.nama}</b></td><td>${stars(Math.round(d.skill))}</td><td>${rpF(d.gaji)}</td>
      <td><div class="bar"><div style="width:${d.lelah}%;background:${d.lelah>80?'var(--bad)':d.lelah>55?'var(--warn)':'var(--ok)'}"></div></div></td>
      <td>${st}</td><td class="dim">${r?r.a+'-'+r.b:'-'}</td>
      <td><div class="rowact">
        <button class="btn sm ghost" onclick="rest('${d.id}')" ${d.libur>0?'disabled':''}>Istirahat</button>
        <button class="btn sm red" onclick="fire('${d.id}')">PHK</button>
      </div></td></tr>`;}).join('')}
    ${S.sopir.length===0?'<tr><td colspan="7" class="dim">Belum ada sopir. Rekrut di bursa bawah.</td></tr>':''}
  </table></div>
  <div class="pagehead" style="margin-top:16px"><h2 style="font-size:14px">Bursa Sopir</h2>
    <span class="dim">segarkan tiap 3 hari</span></div>
  <div class="card tblwrap"><table>
    <tr><th>Nama</th><th>Skill</th><th>Gaji Minta</th><th></th></tr>
    ${S.pasar.sopir.map((d,i)=>`<tr><td><b>${d.nama}</b></td><td>${stars(Math.round(d.skill))}</td>
      <td>${rpF(d.gaji)}/bln</td>
      <td><button class="btn sm go" onclick="hire(${i})">Rekrut</button></td></tr>`).join('')}
  </table></div>`;
}

/* ---------- Bursa bus ---------- */
function viewBursa(){
  return `<div class="pagehead"><h2>Beli Bus Baru</h2></div>
  <div class="statgrid" style="grid-template-columns:repeat(auto-fill,minmax(230px,1fr))">
  ${MODELS.map(m=>`<div class="card">
      ${busImg(m.id,'#2563eb')}
      <b style="font-size:13px">${m.nama}</b>
      <p class="dim" style="margin:4px 0 8px">${m.kursi} kursi &middot; ${m.kec} km/j &middot; ${m.eff} km/l</p>
      <div style="display:flex;justify-content:space-between;align-items:center">
        <b class="pos">${rp(m.harga)}</b>
        <button class="btn sm" onclick="modalBeli('${m.id}')">Beli</button></div>
    </div>`).join('')}
  </div>
  <div class="pagehead" style="margin-top:16px"><h2 style="font-size:14px">Bus Bekas</h2>
    <span class="dim">stok berganti tiap 7 hari</span></div>
  <div class="statgrid" style="grid-template-columns:repeat(auto-fill,minmax(230px,1fr))">
  ${S.pasar.bus.map((b,i)=>`<div class="card">
      ${busImg(b.model,b.livery)}
      <b style="font-size:13px">${modelOf(b.model).nama}</b> <span class="tag warn">Bekas</span>
      <p class="dim" style="margin:4px 0">${b.plat} &middot; ${Math.round(b.km).toLocaleString('id')} km</p>
      <div class="rline2" style="margin-bottom:8px"><span class="dim">Kondisi</span>${condBar(b.kondisi)}
        <span class="dim">${stars(b.kualitas)}</span></div>
      <div style="display:flex;justify-content:space-between;align-items:center">
        <b class="pos">${rp(b.harga)}</b>
        <button class="btn sm go" onclick="buyUsed(${i})">Beli</button></div>
    </div>`).join('')}
  ${S.pasar.bus.length===0?'<div class="card dim">Stok habis, kembali beberapa hari lagi.</div>':''}
  </div>`;
}

/* ---------- Keuangan ---------- */
function viewKeuangan(){
  const h=S.hist.slice(-14);
  const mx=Math.max(1,...h.map(x=>Math.max(x.rev,x.cost)));
  const tR=h.reduce((a,x)=>a+x.rev,0),tC=h.reduce((a,x)=>a+x.cost,0);
  const aset=S.bus.reduce((a,b)=>a+busValue(b),0);
  return `<div class="pagehead"><h2>Keuangan</h2></div>
  <div class="statgrid">
    <div class="card skpi"><span class="k-l">Kas</span>
      <div class="k-v ${S.uang<0?'neg':'pos'}">${rpF(S.uang)}</div></div>
    <div class="card skpi"><span class="k-l">Omzet 14 hari</span><div class="k-v">${rpF(tR)}</div></div>
    <div class="card skpi"><span class="k-l">Biaya 14 hari</span><div class="k-v neg">${rpF(tC)}</div></div>
    <div class="card skpi"><span class="k-l">Laba 14 hari</span>
      <div class="k-v ${tR-tC>=0?'pos':'neg'}">${rpF(tR-tC)}</div></div>
    <div class="card skpi"><span class="k-l">Nilai Aset</span><div class="k-v">${rpF(aset)}</div></div>
  </div>
  <div class="card" style="margin-bottom:12px">
    <div class="chead"><b>Omzet (hijau) vs Biaya (merah) - 14 hari</b></div>
    <div class="chart">${h.map(x=>`<div class="bcol"><div class="bars">
        <div class="b" style="height:${x.rev/mx*100}%;background:#16a34a" title="Omzet ${rpF(x.rev)}"></div>
        <div class="b" style="height:${x.cost/mx*100}%;background:#dc2626" title="Biaya ${rpF(x.cost)}"></div>
      </div><div class="dim" style="text-align:center;font-size:9px;margin-top:3px">H${x.h}</div></div>`).join('')}
    </div>
    ${h.length===0?'<p class="dim" style="margin-top:8px">Jalankan hari terlebih dahulu untuk melihat grafik.</p>':''}
  </div>
  <div class="card">
    <div class="chead"><b>Bank &amp; Pinjaman</b>
      <span class="dim">utang ${rpF(S.pinjaman)} &middot; bunga ${BUNGA_PINJAMAN*100}%/30 hari &middot; limit ${rp(LIMIT_PINJAMAN)}</span></div>
    <div class="rowact">
      <button class="btn sm warn" onclick="pinjaman(50e6)">Pinjam 50 jt</button>
      <button class="btn sm warn" onclick="pinjaman(100e6)">Pinjam 100 jt</button>
      <button class="btn sm go" onclick="pinjaman(-Math.min(S.pinjaman,50e6))" ${S.pinjaman===0?'disabled':''}>Bayar 50 jt</button>
      <button class="btn sm go" onclick="pinjaman(-S.pinjaman)" ${S.pinjaman===0?'disabled':''}>Lunasi Semua</button>
    </div>
  </div>`;
}

/* ---------- Modal ---------- */
function showModal(h){
  el('modal-root').innerHTML=
    `<div class="modal-bg" onclick="if(event.target===this)closeModal()"><div class="modal">${h}</div></div>`;
}
function closeModal(){el('modal-root').innerHTML='';}

function modalBeli(id){
  pickedColor=LIVERY[0];
  const m=modelOf(id);
  const draw=()=>{el('prevBus').innerHTML=busImg(id,pickedColor);};
  showModal(`<h2 style="font-size:16px;margin-bottom:10px">Beli ${m.nama}</h2>
    <div id="prevBus"></div>
    <p class="dim">Harga: <b style="color:var(--txt)">${rpF(m.harga)}</b> &middot; Kursi: ${m.kursi}
      &middot; ${m.kec} km/j &middot; ${m.eff} km/liter</p>
    <p style="margin-top:10px;font-size:12.5px">Pilih warna livery:</p>
    <div class="colorpick">${LIVERY.map(c=>
      `<div class="swatch ${c===pickedColor?'sel':''}" style="background:${c}" data-c="${c}"></div>`).join('')}</div>
    <div class="rowact" style="margin-top:12px">
      <button class="btn go" id="btnBeli">Beli Sekarang</button>
      <button class="btn ghost" onclick="closeModal()">Batal</button>
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

/* ---------- Init menu ---------- */
document.querySelectorAll('.navitem').forEach(n=>{
  n.innerHTML=ICONS[n.dataset.tab]+'<span>'+LABELS[n.dataset.tab]+'</span>';
  n.onclick=()=>go(n.dataset.tab);
});
