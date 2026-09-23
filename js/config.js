"use strict";
/* ============ DATA STATIS GAME ============ */

const MODELS=[
 {id:'ekonomi',  nama:'Bus Ekonomi 2-2',     harga:250e6, kursi:52, kec:60, eff:3.4, wear:700,  deck:'std', foto:'ekonomi.jpg'},
 {id:'patas',    nama:'Bus Patas AC',        harga:480e6, kursi:44, kec:70, eff:3.2, wear:900,  deck:'std', foto:'patas.jpg'},
 {id:'eksekutif',nama:'Bus Eksekutif 2-2',   harga:850e6, kursi:36, kec:80, eff:3.0, wear:1200, deck:'std', foto:'eksekutif.jpg'},
 {id:'legrest',  nama:'Bus Legacy Sky SR-2', harga:1150e6,kursi:40, kec:85, eff:2.9, wear:1400, deck:'shd', foto:'legrest.jpg'},
 {id:'shd',      nama:'Bus Super High Deck', harga:1500e6,kursi:42, kec:90, eff:2.7, wear:1700, deck:'shd', foto:'shd.jpg'},
 {id:'suite',    nama:'Bus Suite Class',     harga:1900e6,kursi:24, kec:85, eff:2.6, wear:2000, deck:'shd', foto:'suite.jpg'},
 {id:'dd',       nama:'Bus Double Decker',   harga:2900e6,kursi:64, kec:85, eff:2.3, wear:2500, deck:'dd',  foto:'dd.jpg'}
];

const LIVERY=['#1f5fd0','#c92f2f','#17965a','#e08b1f','#7a34c9','#111a26','#d9dee6','#0e8f9e'];

const TRAYEK=[
 {a:'Jakarta',   b:'Bandung',    dist:150, fare:75e3, demand:.92, izin:40e6},
 {a:'Jakarta',   b:'Semarang',   dist:450, fare:180e3,demand:.75, izin:90e6},
 {a:'Jakarta',   b:'Surabaya',   dist:790, fare:320e3,demand:.68, izin:150e6},
 {a:'Jakarta',   b:'Yogyakarta', dist:560, fare:230e3,demand:.72, izin:110e6},
 {a:'Jakarta',   b:'Palembang',  dist:540, fare:260e3,demand:.55, izin:120e6},
 {a:'Jakarta',   b:'Denpasar',   dist:1150,fare:450e3,demand:.5,  izin:200e6},
 {a:'Bandung',   b:'Yogyakarta', dist:430, fare:190e3,demand:.6,  izin:90e6},
 {a:'Bandung',   b:'Surabaya',   dist:720, fare:300e3,demand:.55, izin:140e6},
 {a:'Semarang',  b:'Surabaya',   dist:350, fare:150e3,demand:.7,  izin:70e6},
 {a:'Semarang',  b:'Denpasar',   dist:780, fare:330e3,demand:.48, izin:150e6},
 {a:'Yogyakarta',b:'Surabaya',   dist:320, fare:140e3,demand:.78, izin:60e6},
 {a:'Yogyakarta',b:'Denpasar',   dist:590, fare:260e3,demand:.52, izin:120e6},
 {a:'Surabaya',  b:'Denpasar',   dist:410, fare:185e3,demand:.66, izin:85e6},
 {a:'Medan',     b:'Padang',     dist:620, fare:270e3,demand:.5,  izin:130e6},
 {a:'Medan',     b:'Pekanbaru',  dist:530, fare:240e3,demand:.52, izin:120e6},
 {a:'Makassar',  b:'Palu',       dist:870, fare:360e3,demand:.4,  izin:170e6},
 {a:'Jakarta',   b:'Medan',      dist:1450,fare:620e3,demand:.42, izin:250e6},
 {a:'Surabaya',  b:'Makassar',   dist:900, fare:420e3,demand:.45, izin:210e6}
];

const NDEPAN=['Agus','Budi','Slamet','Joko','Wawan','Hendra','Yanto','Dedi','Rudi','Eko','Bagus','Firman','Tono','Iwan','Rian','Doni','Surya','Yusuf','Bambang','Arif','Heru','Galih','Nanang','Teguh','Wahyu'];
const NBLK=['Santoso','Wijaya','Pratama','Hidayat','Saputra','Nugroho','Kurniawan','Setiawan','Purnomo','Handoko','Susilo','Pangestu','Utomo','Halim'];

/* Ikon & label menu (6 tab) */
const sv=(p,sz=18)=>`<svg width="${sz}" height="${sz}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${p}</svg>`;
const ICONS={
 dash:sv('<rect x="3" y="3" width="7" height="9" rx="1"/><rect x="14" y="3" width="7" height="5" rx="1"/><rect x="14" y="12" width="7" height="9" rx="1"/><rect x="3" y="16" width="7" height="5" rx="1"/>'),
 armada:sv('<rect x="2" y="5" width="20" height="12" rx="2"/><path d="M5 17v2M19 17v2"/><circle cx="7" cy="19" r="1.5"/><circle cx="17" cy="19" r="1.5"/><path d="M4 9h16"/>'),
 rute:sv('<circle cx="5" cy="19" r="2"/><circle cx="19" cy="5" r="2"/><path d="M7 19h6a4 4 0 0 0 4-4V7"/>'),
 sopir:sv('<circle cx="12" cy="8" r="4"/><path d="M4 21c0-4 3.5-7 8-7s8 3 8 7"/>'),
 bursa:sv('<path d="M3 4h2l2.5 11h11L21 7H6"/><circle cx="9" cy="19" r="1.6"/><circle cx="17" cy="19" r="1.6"/>'),
 keuangan:sv('<path d="M3 20h18"/><rect x="5" y="11" width="3.5" height="7"/><rect x="10.5" y="6" width="3.5" height="12"/><rect x="16" y="9" width="3.5" height="9"/>')
};
const LABELS={dash:'Dashboard',armada:'Armada',rute:'Trayek',sopir:'Sopir',bursa:'Bursa Bus',keuangan:'Keuangan'};

/* Koordinat kota untuk peta dashboard (viewBox 640x280) */
const KOTA={
 'Medan':{x:95,y:62},'Pekanbaru':{x:122,y:96},'Padang':{x:104,y:128},
 'Palembang':{x:152,y:152},'Jakarta':{x:186,y:192},'Bandung':{x:203,y:207},
 'Semarang':{x:238,y:199},'Yogyakarta':{x:236,y:221},'Surabaya':{x:278,y:209},
 'Denpasar':{x:305,y:236},'Makassar':{x:438,y:252},'Palu':{x:452,y:192}
};

/* ============ KONSTANTA SIMULASI ============ */
const BUNGA_PINJAMAN=0.025;
const LIMIT_PINJAMAN=200e6;
const BIAYA_KANTOR_HARIAN=2e6;
const AMBANG_BANGKRUT=-50e6;
const SAVE_KEY='nbm_v3';
