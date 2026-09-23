# Nusantara Bus Manager

Game simulasi manajemen perusahaan otobus (PO) berbasis web, terinspirasi dari
Bus Manager Indonesia (BMID). Bermain sebagai pemilik PO: beli armada, buka
trayek antar kota, rekrut sopir, kelola keuangan, dan bangun reputasi.

## Fitur

- **Armada**: 7 model bus (Ekonomi sampai Double Decker) dengan foto bus asli
- **Trayek**: 18 rute antar kota lintas Sumatra, Jawa, Bali, dan Sulawesi
- **Sopir**: bursa sopir, sistem skill, kelelahan, pengalaman, dan PHK
- **Ekonomi**: tarif dinamis, harga BBM berfluktuasi, pinjaman bank berbunga
- **Kejadian acak**: musim liburan, bus mogok, kecelakaan, razia KIR, borongan
- **Keuangan**: grafik omzet vs biaya, nilai aset, laporan harian
- **Reputasi PO** yang memengaruhi okupansi penumpang
- **Save otomatis** di browser (localStorage)
- Responsif: navigasi berubah menjadi bottom-bar di HP

## Struktur Proyek

```
bus-manager/
├── index.html          # Kerangka halaman
├── vercel.json         # Konfigurasi deploy Vercel
├── README.md           # Dokumentasi ini
├── .gitignore
├── assets/bus/         # FOTO BUS ASLI (lihat bagian di bawah)
├── css/
│   ├── base.css        # Variabel warna, reset, utilitas
│   ├── layout.css      # Sidebar, topbar, grid
│   ├── components.css  # Tombol, kartu, tabel, modal, grafik
│   └── mobile.css      # Penyesuaian tampilan HP
└── js/
    ├── config.js       # Data statis (model bus, trayek, konstanta)
    ├── utils.js        # Fungsi bantu (format uang, acak, dll.)
    ├── state.js        # State game, generator, save/load
    ├── busImage.js     # Render foto bus + fallback SVG
    ├── sim.js          # Simulasi harian & kejadian acak
    ├── actions.js      # Aksi pemain (beli, jual, rekrut, dll.)
    ├── ui.js           # Render semua halaman
    └── app.js          # Entry point
```

## Menambahkan Foto Bus Asli

Game memakai foto dari folder `assets/bus/`. Siapkan 7 foto dengan nama persis:

| File            | Untuk model           |
|-----------------|-----------------------|
| `ekonomi.jpg`   | Bus Ekonomi 2-2       |
| `patas.jpg`     | Bus Patas AC          |
| `eksekutif.jpg` | Bus Eksekutif 2-2     |
| `legrest.jpg`   | Bus Legacy Sky SR-2   |
| `shd.jpg`       | Bus Super High Deck   |
| `suite.jpg`     | Bus Suite Class       |
| `dd.jpg`        | Bus Double Decker     |

Saran:
- Ukuran ideal: landscape, minimal 800x450 px, di bawah 300 KB per foto
  (kompres dulu via squoosh.app atau tinypng.com)
- Sumber foto gratis dan legal: **Unsplash.com**, **Pexels.com**,
  **Pixabay.com** (cari kata kunci: "indonesian bus", "coach bus",
  "double decker bus"). Perhatikan lisensinya.
- Jika foto belum ada, game otomatis menampilkan gambar bus SVG sementara,
  jadi tidak akan pernah blank atau error.

## Menjalankan Secara Lokal

Tidak butuh build tool. Cukup server statis:

```bash
# Pilihan 1: Python
python -m http.server 8000

# Pilihan 2: Node.js
npx serve .
```

Lalu buka http://localhost:8000.
(Catatan: jangan buka index.html langsung lewat double-click agar foto
dan save berfungsi konsisten — gunakan server lokal.)

## Deploy ke Vercel

**Cara termudah (dashboard):**
1. Push folder ini ke repository GitHub
2. Buka vercel.com/new, impor repository
3. Framework Preset: **Other** (situs statis murni)
4. Klik **Deploy** — selesai

**Cara CLI:**
```bash
npm i -g vercel
vercel
```

## Menyeimbangkan Game (Opsional)

Semua angka ekonomi terpusat di `js/config.js`:
harga bus, tarif trayek, bunga pinjaman, biaya operasional.
Ubah di sana tanpa menyentuh logika game.

## Cara Bermain Singkat

1. Saat pertama dibuka, beri nama perusahaan otobus (PO) kamu
2. Modal awal: Rp 280 juta, 1 bus ekonomi bekas, 1 sopir
3. Buka tab **Trayek / Rute**, beli izin trayek Jakarta-Bandung
4. Pasang bus dan sopir ke trayek itu, lalu klik **Aktifkan**
5. Kembali ke **Dashboard**, klik **Jalankan 1 Hari** berulang kali
6. Kumpulkan laba, servis bus sebelum kondisi di bawah 30%,
   istirahatkan sopir sebelum kelelahan di atas 88%
7. Bangkrut jika kas tembus -Rp 50 juta
