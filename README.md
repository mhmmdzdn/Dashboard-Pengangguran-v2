# Dashboard Pengangguran Indonesia — versi 2

Versi 2 adalah revisi tampilan dan tata letak dari [Dashboard Pengangguran](../Dashboard%20Pengangguran/README.md) (versi 1). Data, prinsip, dan sumbernya sama: **seluruh angka resmi** BPS, Kemnaker, dan Bappenas, tanpa hitungan mandiri. Versi 1 tetap utuh di foldernya sendiri.

**Membuka:** klik dua kali `index.html`. Tidak perlu server atau internet.

## Yang berubah dari versi 1

| Bagian | Versi 1 | Versi 2 |
| :--- | :--- | :--- |
| Identitas | Kepala halaman putih polos | Kepala halaman biru tua dengan logo, tab berbentuk pil berikon, dan label "v2" |
| Halaman awal | Peta | **Beranda** bercerita, berisi: *hero* gradasi (kalimat utama dari angka resmi, angka TPT besar, sparkline 1986–2025); 6 kartu KPI berikon dengan sparkline; dan 6 bagian bernomor (Tren & sebaran, Siapa yang menganggur, Struktur penganggur, Sebaran wilayah, Setengah pengangguran, Penduduk menurut kegiatan) dalam kisi 2–3 kolom |
| Beranda: peta | — | Peta mini TPT provinsi dengan daftar 5 tertinggi dan 5 terendah; klik wilayah untuk membuka profil |
| Peta | Rel 10 lapisan tanpa ikon; legenda kotak kecil | Rel berikon dengan dua kelompok (Pengangguran / Konteks pasar kerja); daratan berbayangan, latar laut bergradasi; legenda gradasi; garis waktu berbentuk pil |
| Panel peta | Daftar angka | Kartu sorotan dengan angka besar dan lencana peringkat (#n dari N), kotak Tertinggi/Terendah, area di bawah garis tren, nomor peringkat berbentuk lencana |
| Profil | Kepala polos, kartu satu baris | *Hero* wilayah dengan peta lokasi mini dan chip informasi; kartu KPI berikon dengan lencana peringkat dan sparkline; bagian bernomor; sumbu grafik dimulai dari tahun pertama yang memiliki data |
| Sasaran RPJMN | Batang dengan pita sempit | *Hero* dan kartu KPI; **bullet chart** per wilayah (titik = TPT provinsi; pita biru = sasaran 2025; pita oranye bergaris = sasaran 2029) dengan skala bersama di semua kartu |
| Metodologi | Satu kolom panjang | Kartu prinsip dalam kisi; lapisan peta dalam bentuk akordeon (definisi, catatan, sumber, CSV) |
| Ponsel | Legenda menutupi label peta; panel terbuka setengah layar | Rel lapisan dapat dilipat; legenda di atas garis waktu; panel dimulai tertutup dan terbuka saat wilayah dipilih; tidak ada gulir horizontal |
| Warna | — | Palet data sama (tervalidasi) pada permukaan baru #ffffff / #111827; mode gelap memakai langkah warnanya sendiri |

## Halaman

Beranda · Peta · Profil Wilayah · Sasaran RPJMN · Metodologi. Status tampilan tersimpan di URL, misalnya `index.html#peta?lap=tpt&lv=kab&sel=3273` atau `#profil?wil=35`.

## Memperbarui

```
cd Data/_skrip
node bangun_dashboard_pengangguran.js --versi 2   # data → data/*.js; inti tampilan disalin dari Dashboard/_inti_v2
```

Tanpa `--versi 2`, skrip membangun versi 1.

## Berkas

| Berkas | Isi |
| :--- | :--- |
| `index.html` | Kepala halaman, tab, kerangka peta |
| `assets/app.js` | Logika halaman v2 |
| `assets/style.css` | Gaya khusus halaman v2 |
| `assets/inti.js`, `assets/inti.css` | Inti tampilan v2. **Sumbernya `Dashboard/_inti_v2/`**; jangan diedit di sini. Inti v2 terpisah dari `_inti` (yang dipakai versi 1 dan Dashboard Investasi) |
| `data/pengangguran.js`, `data/wilayah.js` | Data, sama dengan versi 1 |

## Uji (2 Oktober 2026)

152 kasus lolos tanpa galat JS. Cakupannya:
- semua lapisan × tingkat × frekuensi;
- interaksi peta: klik, zoom, putar, cari, tabel, keyboard;
- Beranda dengan semua tab rincian;
- 38 profil provinsi dan 13 kab/kota;
- Sasaran dan Metodologi;
- ponsel 390 px, tanpa gulir horizontal dan tanpa elemen terpotong;
- mode terang dan gelap.

**12 angka dicocokkan persis dengan berkas sumber**, sama seperti uji versi 1.
