/* Dashboard Pengangguran Indonesia — versi 2 (logika halaman)
   Data: window.PENG_WIL (wilayah & peta), window.PENG_DATA (lapisan, rincian, Kemnaker, sasaran) dari data/*.js.
   PRINSIP: hanya angka resmi BPS/Kemnaker/Bappenas. Tidak ada selisih, pertumbuhan, pangsa, rata-rata, atau
   penjumlahan. Urutan (peringkat) dan kelas warna hanya pengurutan/pengelompokan tampilan.
   Perubahan dari v1: Beranda bercerita (hero + kartu KPI + bagian bernomor), panel peta & rel berikon,
   profil ber-hero dengan peta lokasi, sasaran sebagai bullet chart, metodologi berbentuk akordeon. */
(function () {
  'use strict';
  const I = window.Inti, WIL = window.PENG_WIL, D = window.PENG_DATA;
  if (!I || !WIL || !D) { document.body.textContent = 'Berkas data (data/wilayah.js, data/pengangguran.js) atau assets/inti.js tidak ditemukan.'; return; }
  const { h, s: sv, $, fmtAngka, lblPer } = I;

  // ---------- ikon (garis 24×24) ----------
  const IK = {
    tpt: 'M19 5 5 19M7 9a2 2 0 1 0 0-4 2 2 0 0 0 0 4zM17 19a2 2 0 1 0 0-4 2 2 0 0 0 0 4z',
    pria: 'M14 10a5 5 0 1 1-10 0 5 5 0 0 1 10 0zM13 7l6-6M15 1h4v4',
    wanita: 'M12 13a5 5 0 1 0 0-10 5 5 0 0 0 0 10zM12 13v8M9 18h6',
    neet: 'M2 9l10-5 10 5-10 5zM6 11v5c3 2 9 2 12 0v-5',
    jam: 'M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18zM12 7v5l3 2',
    orang: 'M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM2 21v-1a6 6 0 0 1 12 0v1M16 3.5a4 4 0 0 1 0 7M22 21v-1a6 6 0 0 0-4-5.6',
    tpak: 'M3 8h18v12H3zM8 8V5h8v3M3 13h18',
    pencaker: 'M3 5h18v14H3zM7 10h5M7 14h7M16.5 9v6',
    loker: 'M4 7h16v13H4zM9 7V4h6v3M12 11v5M9.5 13.5h5',
    penempatan: 'M4 12l4 4 8-8M20 6v12a2 2 0 0 1-2 2H6',
    naik: 'M3 17l6-6 4 4 8-8M15 7h6v6', turun: 'M3 7l6 6 4-4 8 8M15 17h6v-6',
    peta: 'M9 4 3 6v14l6-2 6 2 6-2V4l-6 2-6-2zM9 4v14M15 6v14', target: 'M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18zM12 17a5 5 0 1 0 0-10 5 5 0 0 0 0 10z',
    tautan: 'M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71',
    info: 'M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18zM12 11v6M12 7.5v.5', unduh: 'M12 3v12M7 10l5 5 5-5M4 21h16', panah: 'M5 12h14M13 6l6 6-6 6',
  };
  const ikon = (k, cls) => { const e = sv('svg', { class: 'ikon' + (cls ? ' ' + cls : ''), viewBox: '0 0 24 24', 'aria-hidden': 'true' }); e.append(sv('path', { d: IK[k] || IK.info })); return e; };

  let toastTimer = null;
  function tampilToast(pesan) {
    let el = document.getElementById('v2-toast');
    if (!el) {
      el = h('div', { id: 'v2-toast', class: 'v2-toast', role: 'status', 'aria-live': 'polite' });
      document.body.append(el);
    }
    el.textContent = pesan;
    el.classList.add('tampil');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => el.classList.remove('tampil'), 2600);
  }
  function salinTautan(labelKonteks) {
    tulis();
    const url = location.href;
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(url).then(() => {
        tampilToast(`Tautan ${labelKonteks || 'tampilan ini'} berhasil disalin!`);
      }).catch(() => tampilToast('Tautan siap dibagikan dari bilah alamat browser'));
    } else {
      tampilToast('Tautan siap dibagikan dari bilah alamat browser');
    }
  }
  const IKON_LAP = { tpt: 'tpt', tpt_l: 'pria', tpt_p: 'wanita', neet: 'neet', setengah: 'jam', penganggur: 'orang', tpak: 'tpak', pencaker: 'pencaker', loker: 'loker', penempatan: 'penempatan' };
  const TEMA_LAP = {
    tpt:        { utama: '#0f766e', lembut: 'rgba(15, 118, 110, 0.14)', seq: ['#d1f2eb', '#a3e4d7', '#76d7c4', '#48c9b0', '#1abc9c', '#0f766e', '#064e3b'] },
    tpt_l:      { utama: '#2563eb', lembut: 'rgba(37, 99, 235, 0.14)',  seq: ['#dbeafe', '#bfdbfe', '#93c5fd', '#60a5fa', '#3b82f6', '#2563eb', '#1e3a8a'] },
    tpt_p:      { utama: '#db2777', lembut: 'rgba(219, 39, 119, 0.14)', seq: ['#fce7f3', '#fbcfe8', '#f9a8d4', '#f472b6', '#ec4899', '#db2777', '#831843'] },
    neet:       { utama: '#7c3aed', lembut: 'rgba(124, 58, 237, 0.14)', seq: ['#ede9fe', '#ddd6fe', '#c4b5fd', '#a78bfa', '#8b5cf6', '#7c3aed', '#4c1d95'] },
    setengah:   { utama: '#d97706', lembut: 'rgba(217, 119, 6, 0.15)',  seq: ['#fef3c7', '#fde68a', '#fcd34d', '#fbbf24', '#f59e0b', '#d97706', '#78350f'] },
    penganggur: { utama: '#dc2626', lembut: 'rgba(220, 38, 38, 0.14)',  seq: ['#fee2e2', '#fecaca', '#fca5a5', '#f87171', '#ef4444', '#dc2626', '#7f1d1d'] },
    tpak:       { utama: '#059669', lembut: 'rgba(5, 150, 105, 0.14)',  seq: ['#dcfce7', '#bbf7d0', '#86efac', '#4ade80', '#22c55e', '#16a34a', '#14532d'] },
    pencaker:   { utama: '#0284c7', lembut: 'rgba(2, 132, 199, 0.14)',  seq: ['#e0f2fe', '#bae6fd', '#7dd3fc', '#38bdf8', '#0ea5e9', '#0284c7', '#0c4a6e'] },
    loker:      { utama: '#4f46e5', lembut: 'rgba(79, 70, 229, 0.14)',  seq: ['#e0e7ff', '#c7d2fe', '#a5b4fc', '#818cf8', '#6366f1', '#4f46e5', '#312e81'] },
    penempatan: { utama: '#0d9488', lembut: 'rgba(13, 148, 136, 0.14)', seq: ['#ccfbf1', '#99f6e4', '#5eead4', '#2dd4bf', '#14b8a6', '#0d9488', '#134e4a'] }
  };

  // ---------- data dasar ----------
  const LAP = D.lapisan, BY = Object.fromEntries(LAP.map(l => [l.id, l]));
  const PROV = Object.fromEntries(WIL.provinsi.map(p => [p.kode, p]));
  const KAB = Object.fromEntries(WIL.kabkota.map(k => [k.kode, k]));
  const PROV_URUT = WIL.provinsi.slice().sort((a, b) => a.kode.localeCompare(b.kode));
  const URUT_WIL = ['Sumatera', 'Jawa', 'Kalimantan', 'Bali-Nusa Tenggara', 'Sulawesi', 'Maluku', 'Papua'];
  const FREK = { tahunan: 'Tahunan', semesteran: 'Semesteran' };
  const LEVEL = { prov: 'Provinsi', kab: 'Kab/kota' };
  const namaW = k => (k === '00' ? 'Indonesia' : PROV[k] ? PROV[k].nama : KAB[k] ? KAB[k].nama : k);
  const namaPendek = k => (KAB[k] ? KAB[k].nama.replace(/^Kab\.\s+(Adm\.\s+)?/, '') : namaW(k));
  const lvDari = k => (k && k.length === 4 ? 'kab' : 'prov');
  const provDari = k => (k && k.length === 4 ? KAB[k].prov : k);
  const ASAL = { D: 'tabel BPS provinsi' };

  // ---------- akses data ----------
  const seri = (id, f, lv) => (BY[id] && BY[id].frek[f] && BY[id].frek[f][lv]) || null;
  function potong(id, f, lv, per) {
    const sr = seri(id, f, lv), o = {};
    if (!sr) return o;
    const j = sr.periode.indexOf(per);
    if (j < 0) return o;
    for (const k in sr.nilai) { const v = sr.nilai[k][j]; if (v != null) o[k] = v; }
    return o;
  }
  function deret(id, f, kode) { const sr = seri(id, f, lvDari(kode)); if (!sr || !sr.nilai[kode]) return null; return sr.periode.map((p, i) => [p, sr.nilai[kode][i]]); }
  function nilai(id, f, kode, per) { const sr = seri(id, f, lvDari(kode)); if (!sr || !sr.nilai[kode]) return null; const j = sr.periode.indexOf(per); return j < 0 ? null : sr.nilai[kode][j]; }
  function asalMap(id, f, kode) { const sr = seri(id, f, lvDari(kode)); if (!sr || !sr.asal || !sr.asal[kode]) return null; const o = {}; sr.periode.forEach((p, j) => { if (sr.asal[kode][j] !== '.') o[p] = sr.asal[kode][j]; }); return o; }
  const asalDi = (id, f, kode, per) => { const a = asalMap(id, f, kode); return a ? a[per] || null : null; };
  function daftarPeriode(id, f, lv) { const sr = seri(id, f, lv); if (!sr) return []; return sr.periode.filter((p, j) => Object.keys(sr.nilai).some(k => k !== '00' && sr.nilai[k][j] != null)); }
  function terakhir(id, f, kode, batas) { const d = deret(id, f, kode) || []; for (let i = d.length - 1; i >= 0; i--) if (d[i][1] != null && (!batas || d[i][0] <= batas)) return d[i]; return null; }
  const frekTersedia = (id, lv) => Object.keys(FREK).filter(f => BY[id].frek[f] && BY[id].frek[f][lv]);
  const punyaLv = (id, lv) => frekTersedia(id, lv).length > 0;
  function selaraskan(p, daftar) {
    if (!daftar.length) return '';
    if (daftar.includes(p)) return p;
    const th = (p || '').slice(0, 4), sama = daftar.filter(x => x.slice(0, 4) === th);
    if (sama.length) return sama.find(x => x.endsWith('-08')) || sama[sama.length - 1];
    const sebelum = daftar.filter(x => x <= (p || ''));
    return sebelum.length ? sebelum[sebelum.length - 1] : daftar[daftar.length - 1];
  }
  const lblTahunan = p => (/^\d{4}$/.test(p) ? (+p >= 2005 ? 'Agustus ' + p : p + ' (Sakernas tahunan)') : lblPer(p, true));
  const lblP = (p, f) => (f === 'tahunan' ? lblTahunan(p) : lblPer(p, true));
  // peringkat (urutan) wilayah dalam satu potongan — hanya pengurutan tampilan
  function urutan(id, f, kode, per) {
    const lv = lvDari(kode), pot = potong(id, f, lv, per);
    const kodeL = Object.keys(pot).filter(x => x !== '00' && (lv === 'prov' || KAB[x].prov === KAB[kode].prov)).sort((a, b) => pot[b] - pot[a]);
    const i = kodeL.indexOf(kode);
    return i < 0 ? null : [i + 1, kodeL.length];
  }

  // ---------- format ----------
  const nfKompak = new Intl.NumberFormat('id-ID', { notation: 'compact', maximumFractionDigits: 1 });
  function fmtL(l, v, kompak) {
    if (v == null) return '—';
    if (l.satuan === '%') return fmtAngka(v, l.desimal) + '%';
    if (kompak && Math.abs(v) >= 10000) return nfKompak.format(v);
    return fmtAngka(v, l.desimal) + (l.satuan ? ' ' + l.satuan : '');
  }
  const fmtLeg = l => v => (l.satuan === '%' ? fmtAngka(v, v % 1 ? 1 : 0) : nfKompak.format(v));
  const fmtR = (r, d) => v => (v == null ? '—' : r.satuan === '%' ? fmtAngka(v, d != null ? d : r.desimal) + '%' : fmtAngka(v, d != null ? d : r.desimal));
  const kelasCache = {};
  const kelasL = (l, lv) => {
    const br = Array.isArray(l.kelas) ? l.kelas : l.kelas[lv];
    const palet = TEMA_LAP[l.id] ? TEMA_LAP[l.id].seq : null;
    return (kelasCache[l.id + lv] = kelasCache[l.id + lv] || I.kelasTetap(br, palet));
  };
  const satuanTeks = l => (l.satuan === '%' ? 'persen' : l.satuan);

  // ---------- komponen tampilan ----------
  function kartu(judul, sub, ...isi) { return h('div', { class: 'card' }, h('div', { class: 'card-head' }, h('div', {}, h('h3', { text: judul }), sub ? h('div', { class: 'sub', text: sub }) : null)), ...isi); }
  function kartuAksi(judul, sub, aksi, ...isi) { return h('div', { class: 'card' }, h('div', { class: 'card-head' }, h('div', {}, h('h3', { text: judul }), sub ? h('div', { class: 'sub', text: sub }) : null), aksi), ...isi); }
  function bagian(no, judul, sub) { return h('div', { class: 'bagian-kepala' }, h('div', {}, h('h2', {}, h('span', { class: 'no', text: String(no).padStart(2, '0') }), judul), sub ? h('p', { text: sub }) : null)); }
  function kpi({ ik, oranye, label, val, per, lencana, spark, onKlik }) {
    const e = h('div', { class: 'kpi' + (onKlik ? ' klik' : ''), onclick: onKlik || null, role: onKlik ? 'button' : null, tabindex: onKlik ? '0' : null },
      h('div', { class: 'atas' }, h('span', { class: 'bulat' + (oranye ? ' oranye' : '') }, ikon(ik)), h('span', { text: label })),
      h('div', { class: 'val', text: val }), h('div', { class: 'per', text: per || '' }),
      lencana ? h('div', { class: 'peringkat-lencana' }, h('span', { class: 'lencana ' + (lencana.warna || 'biru'), text: lencana.teks })) : null);
    if (spark) e.append(I.garisMini(spark, { tinggi: 30 }));
    return e;
  }
  // potong periode awal yang kosong pada semua seri (mis. jumlah penganggur provinsi baru ada sejak 2020)
  const potongAwal = ser => { const p0 = ser.map(x => (x.data.find(d => d[1] != null) || [''])[0]).filter(Boolean).sort()[0]; return p0 ? ser.map(x => ({ ...x, data: x.data.filter(d => d[0] >= p0) })) : ser; };
  const catatanR = r => ((r.catatan || []).length ? h('ul', { class: 'catatan' }, r.catatan.map(c => h('li', { text: c }))) : null);
  const sumberR = r => h('div', { class: 'kecil' }, 'Sumber: ', ...r.sumber.map((x, i) => [i ? '; ' : '', x.url ? h('a', { href: x.url, target: '_blank', rel: 'noopener', text: x.label }) : x.label]));
  const R = D.rincian;
  const rinc = (id, f) => (R[id] && R[id].frek[f]) || null;
  const tombolCsvRinc = (id, f) => h('button', { class: 'btn', type: 'button', onclick: () => { const r = rinc(id, f); I.unduhCsv(`${id}_${f}.csv`, ['seri', ...r.periode], r.seri.map(x => [x.nama, ...x.nilai])); } }, ikon('unduh'), 'CSV');
  const kakiKartu = (r, id, f) => h('div', { class: 'kaki-kartu' }, sumberR(r), id ? tombolCsvRinc(id, f) : null);

  // ---------- status ----------
  const S = { page: 'profil', lap: 'tpt', lv: 'prov', frek: 'tahunan', per: '', sel: '', fokus: '',
    dper: '', dfrek: 'tahunan', drinc: 'pendidikan', dmode: 'garis', dsp: 'pendidikan', dspmode: 'garis', dpend: 'tahunan', dumur: '',
    wil: '00', pfrek: 'tahunan', pkar: 'pendidikan', pkper: '', ptahun: '', infomode: 'insight', mskategori: 'makro' };
  const KUNCI = {
    profil: ['wil', 'pfrek', 'pkar', 'pkper', 'ptahun', 'dper', 'dfrek', 'drinc', 'dmode', 'dsp', 'dspmode', 'dpend', 'dumur'],
    peta: ['lap', 'lv', 'frek', 'per', 'sel', 'fokus'],
    sasaran: [], insight: ['infomode', 'mskategori'], metode: []
  };
  const HALAMAN = Object.keys(KUNCI);
  const tulis = () => I.tulisHash(S, KUNCI[S.page]);
  function normalisasiPeta() {
    if (!BY[S.lap]) S.lap = 'tpt';
    if (!LEVEL[S.lv]) S.lv = 'prov';
    if (S.lv === 'kab' && !punyaLv(S.lap, 'kab')) S.lv = 'prov';
    const fr = frekTersedia(S.lap, S.lv);
    if (!fr.includes(S.frek)) S.frek = fr[0];
    S.per = selaraskan(S.per, daftarPeriode(S.lap, S.frek, S.lv));
    if (S.sel && !(PROV[S.sel] || KAB[S.sel])) S.sel = '';
    if (S.lv === 'prov' && S.sel && KAB[S.sel]) S.sel = KAB[S.sel].prov;
    if (S.lv === 'kab' && S.sel && PROV[S.sel]) { S.fokus = S.sel; S.sel = ''; }
    if (S.fokus && !PROV[S.fokus]) S.fokus = '';
    if (S.lv === 'prov') S.fokus = '';
  }

  // =====================================================================
  // PETA
  // =====================================================================
  let peta = null, waktu = null;
  function sisipan() {
    if (innerWidth <= 980) { const p = $('panel'); return { atas: 60, bawah: (p ? p.offsetHeight : 200) + 140, kiri: 8, kanan: 8 }; }
    return { kiri: 276, kanan: 404, atas: 16, bawah: 96 };
  }
  const perluas = (bb, min) => { const w = bb[2] - bb[0], hh = bb[3] - bb[1], dx = Math.max(0, min - w) / 2, dy = Math.max(0, min * 0.6 - hh) / 2; return [bb[0] - dx, bb[1] - dy, bb[2] + dx, bb[3] + dy]; };
  function zoomWilayah(k) {
    if (!k) { peta.semua(); return; }
    const bb = lvDari(k) === 'kab' ? WIL.peta.kab.bbox[k] : WIL.peta.prov.bbox[k];
    if (!bb) { if (KAB[k]) zoomWilayah(KAB[k].prov); return; }
    peta.zoomKe(perluas(bb, lvDari(k) === 'kab' ? 70 : 40));
  }
  const daftarCari = () => PROV_URUT.map(p => ({ kode: p.kode, nama: p.nama, ket: 'Provinsi' })).concat(WIL.kabkota.map(k => ({ kode: k.kode, nama: k.nama, ket: namaW(k.prov) })));
  function initPeta() {
    peta = I.Peta($('peta'), {
      wil: WIL, sisipan,
      onPilih: k => { if (k) pilihWilayah(k); },
      onHover: (ev, k) => {
        if (!k) { I.sembunyiTip(); return; }
        const l = BY[S.lap], v = potong(S.lap, S.frek, S.lv, S.per)[k], nas = nilai(S.lap, S.frek, '00', S.per), a = asalDi(S.lap, S.frek, k, S.per);
        I.tampilTip(ev, [I.tipNama(namaW(k) + (KAB[k] ? ', ' + namaW(KAB[k].prov) : '')), I.tipBaris(fmtL(l, v), l.singkat), I.tipSub(lblP(S.per, S.frek)),
          nas != null && l.jenis !== 'jumlah' ? I.tipSub('Indonesia: ' + fmtL(l, nas)) : null, a ? I.tipSub('Sumber titik ini: ' + ASAL[a]) : null, v == null ? I.tipSub('Tidak ada angka resmi') : null]);
      },
    });
    waktu = I.GarisWaktu($('waktu'), { onUbah: p => { S.per = p; renderPeta(true); tulis(); }, lbl: p => lblP(p, S.frek) });
    $('z-plus').onclick = () => peta.zoomDi(0.6);
    $('z-minus').onclick = () => peta.zoomDi(1.6);
    $('z-home').onclick = () => peta.semua();
    $('z-full').onclick = () => { if (document.fullscreenElement) document.exitFullscreen(); else if (document.documentElement.requestFullscreen) document.documentElement.requestFullscreen(); };
    $('btn-tabel').onclick = bukaTabel;
    $('laci-tutup').onclick = () => $('laci').close();
    $('pegangan').onclick = () => { $('panel').classList.toggle('ciut'); document.body.classList.toggle('panel-ciut', $('panel').classList.contains('ciut')); };
    if (innerWidth <= 980) { $('panel').classList.add('ciut'); document.body.classList.add('panel-ciut'); }
    I.kotakCari($('cari'), { daftar: daftarCari, onPilih: kodeCari, placeholder: 'Cari provinsi atau kab/kota…' });
    document.addEventListener('keydown', ev => {
      if (S.page !== 'peta' || /input|select|textarea/i.test(ev.target.tagName || '')) return;
      if (ev.key === 'Escape') { S.sel = ''; S.fokus = ''; peta.semua(); renderPeta(); tulis(); }
      if (ev.key === 'ArrowLeft' || ev.key === 'ArrowRight') {
        const d = daftarPeriode(S.lap, S.frek, S.lv), i = d.indexOf(S.per) + (ev.key === 'ArrowRight' ? 1 : -1);
        if (i >= 0 && i < d.length) { S.per = d[i]; renderPeta(true); tulis(); }
      }
    });
  }
  function kodeCari(k) {
    if (S.page === 'profil') { S.wil = k; render(); return; }
    if (KAB[k] && S.lv === 'prov') { if (punyaLv(S.lap, 'kab')) S.lv = 'kab'; else { pilihWilayah(KAB[k].prov); return; } }
    pilihWilayah(k);
  }
  function pilihWilayah(k) {
    if (S.lv === 'kab' && PROV[k]) { S.fokus = k; S.sel = ''; } else { S.sel = k; if (KAB[k]) S.fokus = KAB[k].prov; }
    if (S.lv === 'prov' && KAB[k]) S.sel = KAB[k].prov;
    if (innerWidth <= 980) { $('panel').classList.remove('ciut'); document.body.classList.remove('panel-ciut'); }
    renderPeta(); zoomWilayah(S.sel || S.fokus); tulis();
  }
  function renderPeta(cepat) {
    normalisasiPeta();
    const l = BY[S.lap], lv = S.lv, data = potong(S.lap, S.frek, lv, S.per), K = kelasL(l, lv);
    peta.setLevel(lv);
    peta.warnai(k => K.warna(data[k]));
    peta.pilih(S.sel || null);
    peta.batasProv(lv === 'kab' && S.fokus ? S.fokus : null);
    const urut = Object.keys(data).filter(k => k !== '00').sort((a, b) => data[b] - data[a]);
    const kand = [], ada = new Set();
    const tambah = (k, wajib) => { if (ada.has(k) || data[k] == null) return; ada.add(k); kand.push({ kode: k, nama: namaPendek(k), nilai: fmtL(l, data[k], true), wajib }); };
    if (S.sel) tambah(S.sel, true);
    if (lv === 'kab' && S.fokus) urut.filter(k => KAB[k].prov === S.fokus).forEach(k => tambah(k));
    urut.slice(0, 10).forEach(k => tambah(k)); urut.slice(-5).forEach(k => tambah(k)); urut.forEach(k => tambah(k));
    peta.label(kand, lv === 'kab' ? 45 : 16);
    const kode = lv === 'kab' ? WIL.kabkota.map(k => k.kode) : PROV_URUT.map(p => p.kode);
    const nKosong = kode.filter(k => data[k] == null).length, nAsal = lv === 'kab' ? kode.filter(k => asalDi(S.lap, S.frek, k, S.per)).length : 0;
    I.legendaKelas($('legenda'), { kelas: K, fmt: fmtLeg(l), judul: `${l.singkat} (${satuanTeks(l)}) · ${lblP(S.per, S.frek)}`, nilaiAktif: S.sel ? data[S.sel] : null, adaKosong: nKosong > 0,
      ket: [nKosong ? `${nKosong} dari ${kode.length} ${lv === 'kab' ? 'kab/kota' : 'provinsi'} tanpa angka resmi.` : '', nAsal ? `${nAsal} kab/kota dari tabel BPS provinsi.` : '', 'Kelas warna tetap untuk semua periode.'].filter(Boolean).join(' ') });
    // rel lapisan berikon, dua kelompok dengan warna identitas masing-masing
    const tmAktif = TEMA_LAP[S.lap] || TEMA_LAP.tpt;
    const pagePetaEl = $('page-peta');
    if (pagePetaEl) {
      pagePetaEl.style.setProperty('--lap-color', tmAktif.utama);
      pagePetaEl.style.setProperty('--lap-soft', tmAktif.lembut);
    }
    const tombol = x => {
      const th = frekTersedia(x.id, 'prov').flatMap(f => seri(x.id, f, 'prov').periode).map(p => p.slice(0, 4)).sort();
      const tm = TEMA_LAP[x.id] || TEMA_LAP.tpt;
      return h('button', {
        type: 'button',
        role: 'radio',
        'aria-checked': x.id === S.lap ? 'true' : 'false',
        'data-lap': x.id,
        style: `--lap-c:${tm.utama};--lap-bg:${tm.lembut}`,
        title: x.nama,
        onclick: () => { S.lap = x.id; renderPeta(); tulis(); }
      },
        h('span', { class: 'ik' }, ikon(IKON_LAP[x.id] || 'info')),
        h('span', { class: 'tx' }, h('span', { text: x.singkat }), h('small', { text: `${th[0]}–${th[th.length - 1]}${punyaLv(x.id, 'kab') ? ' · kab/kota' : ''}` })));
    };
    $('lapisan').replaceChildren(h('div', { class: 'grp-lap', text: 'Pengangguran' }), ...LAP.filter(x => !x.konteks).map(tombol), h('div', { class: 'grp-lap', text: 'Konteks pasar kerja' }), ...LAP.filter(x => x.konteks).map(tombol));
    I.segmen($('seg-level'), [['prov', 'Provinsi'], ['kab', 'Kab/kota', punyaLv(S.lap, 'kab')]], lv, v => { S.lv = v; if (v === 'kab' && PROV[S.sel]) { S.fokus = S.sel; S.sel = ''; } renderPeta(); tulis(); }, 'Tingkat wilayah');
    I.segmen($('seg-frek'), Object.keys(FREK).map(f => [f, FREK[f], frekTersedia(S.lap, lv).includes(f), lv === 'kab' ? 'Kab/kota hanya tahunan' : null]), S.frek, f => { S.frek = f; renderPeta(); tulis(); }, 'Frekuensi');
    waktu.set(daftarPeriode(S.lap, S.frek, lv), S.per);
    renderPanel(data);
    if (!cepat) I.sembunyiTip();
  }
  function peringkat(urut, data, l, sel) {
    const n = urut.length, idx = new Set([...Array(Math.min(10, n)).keys(), ...[...Array(Math.min(5, n)).keys()].map(i => n - 1 - i)]);
    const iSel = urut.indexOf(sel); if (iSel >= 0) idx.add(iSel);
    const maks = Math.max(...urut.map(k => data[k]), 0) || 1;
    const ol = h('ol', { class: 'peringkat' }); let akhir = -1;
    [...idx].sort((a, b) => a - b).forEach(i => {
      if (i - akhir > 1) ol.append(h('li', { class: 'sela', 'aria-hidden': 'true', text: '⋯' }));
      const k = urut[i];
      ol.append(h('li', { class: k === sel ? 'sel' : null, onclick: () => pilihWilayah(k), title: namaW(k) }, h('span', { class: 'no', text: i + 1 }), h('span', { class: 'nm', text: namaW(k) }), h('span', { class: 'v', text: fmtL(l, data[k], true) }),
        h('span', { class: 'batang', style: `width:${Math.max(1, data[k] / maks * 100)}%` })));
      akhir = i;
    });
    return ol;
  }
  function nilaiPadanan(id, kode) {
    const lv = lvDari(kode);
    if (!punyaLv(id, lv)) return null;
    for (const f of [S.frek, 'tahunan']) { if (!seri(id, f, lv)) continue; const p = f === S.frek ? S.per : S.per.slice(0, 4); const v = nilai(id, f, kode, p); if (v != null) return [p, v, f]; }
    const t = terakhir(id, 'tahunan', kode, S.per.slice(0, 4));
    return t ? [t[0], t[1], 'tahunan'] : null;
  }
  function renderPanel(data) {
    const l = BY[S.lap], lv = S.lv, B = $('panel-badan');
    const lingkup = lv === 'kab' && S.fokus ? WIL.kabkota.filter(k => k.prov === S.fokus).map(k => k.kode) : null;
    const semua = Object.keys(data).filter(k => k !== '00').sort((a, b) => data[b] - data[a] || namaW(a).localeCompare(namaW(b)));
    const nas = data['00'], isi = [];
    const trenMini = (seriL, tinggi = 150) => { const g = h('div', { style: 'margin-top:6px' }); setTimeout(() => I.grafikGaris(g, { seri: seriL, tinggi, fmt: v => fmtL(l, v), patahan: (l.patahan || {})[S.frek], aktif: S.per, onKlik: p => { S.per = p; renderPeta(true); tulis(); }, asalLabel: 'tabel BPS provinsi', legenda: seriL.length > 1, area: seriL.length === 1 }), 0); return g; };
    const ekstrem = urut => h('div', { class: 'dua-kotak' },
      h('div', { class: 'kotak-ekstrem klik', role: 'button', tabindex: '0', title: 'Klik untuk menyorot ' + namaW(urut[0]) + ' di peta', onclick: () => pilihWilayah(urut[0]) }, h('div', { class: 'lbl' }, ikon('naik'), ' Tertinggi'), h('div', { class: 'val', text: fmtL(l, data[urut[0]], true) }), h('div', { class: 'nm', title: namaW(urut[0]), text: namaW(urut[0]) })),
      h('div', { class: 'kotak-ekstrem klik', role: 'button', tabindex: '0', title: 'Klik untuk menyorot ' + namaW(urut[urut.length - 1]) + ' di peta', onclick: () => pilihWilayah(urut[urut.length - 1]) }, h('div', { class: 'lbl' }, ikon('turun'), ' Terendah'), h('div', { class: 'val', text: fmtL(l, data[urut[urut.length - 1]], true) }), h('div', { class: 'nm', title: namaW(urut[urut.length - 1]), text: namaW(urut[urut.length - 1]) })));
    if (!S.sel) {
      const urut = lingkup ? semua.filter(k => lingkup.includes(k)) : semua;
      isi.push(h('div', { class: 'kecil', text: l.nama }), h('h2', { text: lingkup ? namaW(S.fokus) : 'Seluruh Indonesia' }), h('div', { class: 'sub', text: `${lv === 'kab' ? 'Kab/kota' : 'Provinsi'} · ${lblP(S.per, S.frek)}` }));
      if (lingkup) isi.push(h('div', { class: 'aksi' }, h('button', { class: 'btn', type: 'button', text: '← Seluruh Indonesia', onclick: () => { S.fokus = ''; renderPeta(); peta.semua(); tulis(); } }), h('button', { class: 'btn', type: 'button', onclick: () => { S.wil = S.fokus; gantiHalaman('profil'); } }, 'Profil provinsi ', ikon('panah'))));
      const vRef = lingkup ? nilai(S.lap, S.frek, S.fokus, S.per) : nas;
      if (vRef != null) isi.push(h('div', { class: 'sorot-kartu' }, h('div', { class: 'lbl', text: lingkup ? namaW(S.fokus) + ' (provinsi)' : 'Indonesia' }), h('div', { class: 'val', text: fmtL(l, vRef) }), h('div', { class: 'per', text: l.singkat + ' · ' + lblP(S.per, S.frek) })));
      if (urut.length) isi.push(ekstrem(urut));
      const total = lingkup ? lingkup.length : (lv === 'kab' ? WIL.kabkota.length : WIL.provinsi.length);
      const dl = h('dl', { class: 'statlist' }, h('dt', { text: 'Wilayah dengan angka resmi' }), h('dd', { text: `${urut.length} dari ${total}` }));
      if (S.lap.startsWith('tpt') && !lingkup) { const pg = nilai('penganggur', S.frek, '00', S.per); if (pg != null) dl.append(h('dt', { text: 'Jumlah penganggur Indonesia' }), h('dd', { text: fmtAngka(pg) + ' orang' })); }
      isi.push(dl);
      const dRef = deret(S.lap, S.frek, lingkup ? S.fokus : '00');
      const wLap = (TEMA_LAP[S.lap] || TEMA_LAP.tpt).utama;
      if (dRef) isi.push(h('div', { class: 'bagian-jdl', text: 'Tren ' + (lingkup ? namaW(S.fokus) : 'Indonesia') + ' · klik untuk memilih periode' }), trenMini([{ nama: lingkup ? namaW(S.fokus) : 'Indonesia', warna: wLap, data: dRef, utama: true }]));
      if (urut.length) isi.push(h('div', { class: 'bagian-jdl', text: `Peringkat ${lv === 'kab' ? 'kab/kota' : 'provinsi'} · tertinggi = 1` }), peringkat(urut, data, l, null));
    } else {
      const k = S.sel, lvK = lvDari(k), v = data[k], iAll = semua.indexOf(k);
      isi.push(h('div', { class: 'kecil', text: lvK === 'kab' ? namaW(KAB[k].prov) + ' · ' + KAB[k].jenis : 'Provinsi · wilayah ' + PROV[k].wilayah }), h('h2', { text: namaW(k) }));
      isi.push(h('div', { class: 'aksi' },
        h('button', { class: 'btn', type: 'button', text: '← Indonesia', onclick: () => { S.sel = ''; S.fokus = ''; renderPeta(); peta.semua(); tulis(); } }),
        h('button', { class: 'btn utama', type: 'button', onclick: () => { S.wil = k; gantiHalaman('profil'); } }, 'Profil ', ikon('panah')),
        lvK === 'prov' && punyaLv(S.lap, 'kab') ? h('button', { class: 'btn', type: 'button', text: 'Kab/kota', onclick: () => { S.lv = 'kab'; S.fokus = k; S.sel = ''; renderPeta(); zoomWilayah(k); tulis(); } }) : null));
      isi.push(h('div', { class: 'sorot-kartu' }, h('div', { class: 'lbl', text: l.singkat + ' · ' + lblP(S.per, S.frek) }), h('div', { class: 'val', text: fmtL(l, v) }),
        h('div', { class: 'per' }, iAll >= 0 ? h('span', { class: 'lencana biru', text: `#${iAll + 1} dari ${semua.length}` }) : null, ' ', nas != null && l.jenis !== 'jumlah' ? 'Indonesia ' + fmtL(l, nas) : '')));
      const dl = h('dl', { class: 'statlist' });
      if (lvK === 'kab') {
        const dalam = semua.filter(x => KAB[x].prov === KAB[k].prov), iP = dalam.indexOf(k);
        if (iP >= 0) dl.append(h('dt', { text: 'Urutan di provinsi' }), h('dd', { text: `${iP + 1} dari ${dalam.length}` }));
        const vp = nilai(S.lap, S.frek, KAB[k].prov, S.per); if (vp != null) dl.append(h('dt', { text: namaW(KAB[k].prov) }), h('dd', { text: fmtL(l, vp) }));
      }
      if (dl.children.length) isi.push(dl);
      const a = asalDi(S.lap, S.frek, k, S.per);
      if (a) isi.push(h('div', { class: 'catatan-kecil' }, h('span', { class: 'lencana oranye', text: 'Sumber titik ini' }), ' ' + ASAL[a] + ' (bukan tabel BPS pusat).'));
      if (v == null) isi.push(h('div', { class: 'catatan-kecil', text: 'Tidak ada angka resmi pada periode ini.' }));
      const lain = LAP.filter(x => x.id !== S.lap).map(x => [x, nilaiPadanan(x.id, k)]).filter(([, r]) => r);
      if (lain.length) { const dl2 = h('dl', { class: 'statlist' }); lain.forEach(([x, [p, vv]]) => dl2.append(h('dt', {}, x.singkat), h('dd', {}, fmtL(x, vv, x.jenis === 'jumlah'), ' ', h('small', { text: lblPer(p) })))); isi.push(h('div', { class: 'bagian-jdl', text: 'Lapisan lain' }), dl2); }
      const wLap = (TEMA_LAP[S.lap] || TEMA_LAP.tpt).utama;
      const ser = [{ nama: namaW(k), warna: wLap, data: deret(S.lap, S.frek, k) || [], utama: true, asal: asalMap(S.lap, S.frek, k) }];
      if (lvK === 'kab' && deret(S.lap, S.frek, KAB[k].prov)) ser.push({ nama: namaW(KAB[k].prov), warna: 'var(--cat-2)', data: deret(S.lap, S.frek, KAB[k].prov) });
      if (l.jenis !== 'jumlah' && deret(S.lap, S.frek, '00')) ser.push({ nama: 'Indonesia', warna: 'var(--context)', data: deret(S.lap, S.frek, '00') });
      isi.push(h('div', { class: 'bagian-jdl', text: 'Tren' }), trenMini(ser, 170));
      const urut = lvK === 'kab' ? semua.filter(x => KAB[x].prov === KAB[k].prov) : semua;
      if (urut.length) isi.push(h('div', { class: 'bagian-jdl', text: lvK === 'kab' ? 'Peringkat di ' + namaW(KAB[k].prov) : 'Peringkat provinsi' }), peringkat(urut, data, l, k));
    }
    isi.push(h('details', {}, h('summary', { text: 'Tentang lapisan ini' }), h('p', { class: 'kecil', style: 'color:var(--ink-2)', text: l.uraian }), h('ul', { class: 'catatan' }, l.catatan.map(c => h('li', { text: c }))),
      h('ul', { class: 'sumber' }, l.sumber.map(x => h('li', {}, x.url ? h('a', { href: x.url, target: '_blank', rel: 'noopener', text: x.label }) : x.label, x.peran ? h('span', { class: 'kecil', text: ' — ' + x.peran }) : null)))));
    B.replaceChildren(...isi);
  }
  function bukaTabel() {
    const l = BY[S.lap], lv = S.lv, data = potong(S.lap, S.frek, lv, S.per);
    const kode = lv === 'kab' ? WIL.kabkota.map(k => k.kode) : ['00'].concat(PROV_URUT.map(p => p.kode));
    $('laci-judul').textContent = `${l.nama} — ${LEVEL[lv]}`;
    $('laci-sub').textContent = `${lblP(S.per, S.frek)} · ${satuanTeks(l)} · klik judul kolom untuk mengurutkan`;
    const kol = [{ label: 'Kode' }, { label: lv === 'kab' ? 'Kab/kota' : 'Wilayah' }].concat(lv === 'kab' ? [{ label: 'Provinsi' }] : []).concat([{ label: l.singkat, num: true }, { label: 'Sumber titik' }]);
    const baris = kode.map(k => {
      const r = [{ teks: k, sort: k }, { teks: namaW(k), sort: namaW(k) }];
      if (lv === 'kab') r.push({ teks: namaW(KAB[k].prov), sort: namaW(KAB[k].prov) });
      const a = asalDi(S.lap, S.frek, k, S.per);
      r.push({ teks: data[k] == null ? '—' : fmtAngka(data[k], l.desimal), sort: data[k] == null ? null : data[k] }, { teks: data[k] == null ? '' : a ? ASAL[a] : 'BPS pusat / sumber utama', sort: a || '' });
      r.kode = k; return r;
    });
    I.tabel($('laci-badan'), { kolom: kol, baris, sel: S.sel, maks: 520, onPilih: kk => { if (kk && kk !== '00') { $('laci').close(); pilihWilayah(kk); } } });
    $('laci-csv').onclick = () => { const sr = seri(S.lap, S.frek, lv); const kk = Object.keys(sr.nilai).sort(); I.unduhCsv(`${S.lap}_${lv}_${S.frek}.csv`, ['kode', 'wilayah', 'provinsi', ...sr.periode, 'periode_dari_tabel_bps_provinsi'], kk.map(k => [k, namaW(k), lvDari(k) === 'kab' ? namaW(KAB[k].prov) : '', ...sr.nilai[k], Object.keys(asalMap(S.lap, S.frek, k) || {}).join(' ')])); };
    $('laci').showModal();
  }

  // =====================================================================
  // KONTEN NASIONAL & WILAYAH (PROFIL)
  // =====================================================================
  const RINC_TPT = { pendidikan: 'tpt_pendidikan', umur: 'tpt_umur', daerah: 'tpt_daerah', jk: 'tpt_jk' };
  const RINC_SP = { pendidikan: 'setengah_pendidikan', umur: 'setengah_umur', daerah: 'setengah_daerah', jk: 'setengah_jk' };
  const NAMA_RINC = { pendidikan: 'Pendidikan', umur: 'Kelompok umur', daerah: 'Kota/desa', jk: 'Jenis kelamin' };
  function petaMini(host, { lv = 'prov', warna, label, onPilih, onHover, zoom }) {
    const pm = I.Peta(host, { wil: WIL, statis: true, onPilih: onPilih || (() => {}), onHover: onHover || ((ev, k) => { if (!k) I.sembunyiTip(); }) });
    pm.setLevel(lv); pm.warnai(warna);
    if (zoom) pm.zoomKe(zoom, false);
    if (label) pm.label(label, 8);
    return pm;
  }

  function renderKontenNasional(host, tunda, segLingkup) {
    const perTpt = daftarPeriode('tpt', 'tahunan', 'prov').filter(p => p >= '2015');
    if (!perTpt.includes(S.dper)) S.dper = perTpt[perTpt.length - 1];
    const per = S.dper, iPer = perTpt.indexOf(per), perSeb = perTpt[iPer - 1];
    const L_ = BY.tpt, tpt = nilai('tpt', 'tahunan', '00', per), tptSeb = perSeb ? nilai('tpt', 'tahunan', '00', perSeb) : null;
    const pot = potong('tpt', 'tahunan', 'prov', per), urutP = Object.keys(pot).filter(k => k !== '00').sort((a, b) => pot[b] - pot[a]);
    const potK = potong('tpt', 'tahunan', 'kab', per), urutK = Object.keys(potK).sort((a, b) => potK[b] - potK[a]);
    const pg = nilai('penganggur', 'tahunan', '00', per), neet = nilai('neet', 'tahunan', '00', per), sp = nilai('setengah', 'tahunan', '00', per), tpak = nilai('tpak', 'tahunan', '00', per);
    const pilihPer = p => { if (perTpt.includes(p)) { S.dper = p; renderProfil(); tulis(); } };

    // --- hero ---
    const p2 = [];
    if (tptSeb != null) {
      const diff = tpt - tptSeb;
      p2.push(`Periode sebelumnya ${fmtL(L_, tptSeb)} (${Math.abs(diff) >= 0.01 ? (diff > 0 ? '▲ +' : '▼ -') + fmtAngka(Math.abs(diff), 2) + ' poin %-ase YoY' : 'tetap'}).`);
    }
    if (pg != null) p2.push(`Penganggur: ${fmtAngka(pg)} orang.`);
    if (urutK.length) p2.push(`Tingkat kab/kota: tertinggi ${namaW(urutK[0])} (${fmtL(L_, potK[urutK[0]])}), terendah ${namaW(urutK[urutK.length - 1])} (${fmtL(L_, potK[urutK[urutK.length - 1]])}).`);
    const selPer = h('select', { 'aria-label': 'Periode nasional', onchange: ev => pilihPer(ev.target.value) }, perTpt.slice().reverse().map(p => h('option', { value: p, selected: p === per ? true : null, text: lblTahunan(p) })));
    const spark = h('div');

    // Bangun elemen floating sticky bar untuk mode Nasional saat di-scroll
    const stickyBarNas = h('div', { class: 'sticky-wilayah-bar', 'aria-hidden': 'true' },
      h('div', { class: 'dalam' },
        h('div', { class: 'sticky-wilayah-kiri' },
          h('div', { class: 'sticky-wilayah-remah' }, `Sakernas ${lblTahunan(per)} › Nasional`),
          h('div', { class: 'sticky-wilayah-judul', text: 'Indonesia' })
        ),
        h('div', { class: 'sticky-wilayah-kanan' },
          h('span', { class: 'sticky-wilayah-chip', text: 'Nasional' }),
          tpt != null ? h('span', { class: 'sticky-wilayah-tpt', text: `TPT ${fmtL(L_, tpt)}` }) : null,
          h('button', {
            class: 'sticky-wilayah-ganti',
            type: 'button',
            title: 'Beralih ke Profil Wilayah (Provinsi / Kab-Kota)',
            onclick: () => {
              S.wil = '31';
              renderProfil();
              tulis();
              window.scrollTo({ top: 0, behavior: 'smooth' });
              setTimeout(() => {
                const btnPilih = host.querySelector('.pilih-wil-btn');
                if (btnPilih) btnPilih.click();
              }, 320);
            }
          }, 'Pilih Wilayah ▾')
        )
      )
    );

    const heroNas = h('div', { class: 'hero' },
      h('div', { class: 'hero-lingkup-bar' }, segLingkup),
      h('div', { class: 'dalam hero-kisi' },
        h('div', {},
          h('div', { class: 'alis' }, h('span', { class: 'titik' }), 'Angka resmi BPS · ' + lblTahunan(per)),
          h('h1', {}, 'Tingkat pengangguran terbuka Indonesia ', h('em', { text: fmtL(L_, tpt) }), urutP.length ? [`; tertinggi di ${namaW(urutP[0])} (${fmtL(L_, pot[urutP[0]])}), terendah di ${namaW(urutP[urutP.length - 1])} (${fmtL(L_, pot[urutP[urutP.length - 1]])}).`] : '.'),
          h('p', { text: p2.join(' ') })),
        h('div', { class: 'hero-angka' },
          h('div', { class: 'lbl', text: 'TPT Indonesia · ' + lblTahunan(per) }),
          h('div', { class: 'val', text: fmtL(L_, tpt) }),
          h('div', { class: 'per', text: 'Tren 2015–' + perTpt[perTpt.length - 1] }),
          spark)));

    host.replaceChildren(stickyBarNas, heroNas);
    if ('IntersectionObserver' in window) {
      obsProfil = new IntersectionObserver(([entry]) => {
        stickyBarNas.classList.toggle('tampil', !entry.isIntersecting);
      }, { rootMargin: '-52px 0px 0px 0px', threshold: 0 });
      obsProfil.observe(heroNas);
    }

    spark.append(I.garisMini((deret('tpt', 'tahunan', '00') || []).filter(d => d[0] <= per), { tinggi: 46, lebar: 320 }));

    // --- KPI ---
    const sparkN = id => (deret(id, 'tahunan', '00') || []).filter(d => d[0] <= per).slice(-12);
    
    // Kartu gabungan TPT Tertinggi & Terendah
    const kpiEkstremGabung = h('div', { class: 'kpi kpi-rentang-gabung kpi-rentang-horiz' },
      h('div', { class: 'kpi-sub-item klik', onclick: () => { if (urutP.length) { S.wil = urutP[0]; renderProfil(); tulis(); } }, role: 'button', tabindex: '0' },
        h('div', { class: 'atas' }, h('span', { class: 'bulat oranye' }, ikon('naik')), h('span', { text: 'TPT tertinggi' })),
        h('div', { class: 'val', text: urutP.length ? fmtL(L_, pot[urutP[0]]) : '—' }),
        h('div', { class: 'per', text: urutP.length ? namaW(urutP[0]) : '' })
      ),
      h('div', { class: 'kpi-divider-vert' }),
      h('div', { class: 'kpi-sub-item klik', onclick: () => { if (urutP.length) { S.wil = urutP[urutP.length - 1]; renderProfil(); tulis(); } }, role: 'button', tabindex: '0' },
        h('div', { class: 'atas' }, h('span', { class: 'bulat' }, ikon('turun')), h('span', { text: 'TPT terendah' })),
        h('div', { class: 'val', text: urutP.length ? fmtL(L_, pot[urutP[urutP.length - 1]]) : '—' }),
        h('div', { class: 'per', text: urutP.length ? namaW(urutP[urutP.length - 1]) : '' })
      )
    );

    host.append(h('div', { class: 'kpi-kisi kpi-nasional-kisi' },
      kpi({ ik: 'orang', label: 'Jumlah penganggur', val: pg != null ? nfKompak.format(pg) : '—', per: pg != null ? fmtAngka(pg) + ' orang' : 'tidak tersedia', spark: sparkN('penganggur') }),
      kpiEkstremGabung,
      kpi({ ik: 'neet', label: 'NEET usia 15–24', val: fmtL(BY.neet, neet), per: neet != null ? lblTahunan(per) : 'tersedia 2015–2025', spark: sparkN('neet') }),
      kpi({ ik: 'jam', label: 'Setengah pengangguran', val: fmtL(BY.setengah, sp), per: sp != null ? lblTahunan(per) : 'tersedia 2015–2025', spark: sparkN('setengah') }),
      kpi({ ik: 'tpak', label: 'TPAK', val: fmtL(BY.tpak, tpak), per: tpak != null ? lblTahunan(per) : 'tersedia 2021–2026', spark: sparkN('tpak') })));

    // 01 tren + peta
    {
      const g = h('div'), seg = h('div', { class: 'seg' }), pmEl = h('div', { class: 'peta-host' }), legEl = h('div', { class: 'legenda-mini' }), ekstrem = h('div', { class: 'daftar-ekstrem' });
      I.segmen(seg, Object.keys(FREK).map(f => [f, FREK[f]]), S.dfrek, f => { S.dfrek = f; renderProfil(); tulis(); }, 'Frekuensi');
      host.append(h('section', { class: 'bagian' }, bagian(1, 'Tren dan sebaran', 'TPT Indonesia sejak 2015 dengan rentang sasaran RPJMN, serta peta TPT provinsi pada periode terpilih.'),
        h('div', { class: 'kisi kisi-2 kisi-tren-sebaran' },
          kartuAksi('Tren TPT Indonesia', S.dfrek === 'tahunan' ? '2015–2025 · pita = rentang sasaran RPJMN 2025–2029 · klik titik untuk memilih periode' : FREK[S.dfrek], seg, g, catatanR({ catatan: [BY.tpt.catatan[0]] })),
          kartuAksi('TPT provinsi', lblTahunan(per) + ' · klik untuk membuka profil', h('button', { class: 'btn', type: 'button', onclick: () => { S.lap = 'tpt'; S.lv = 'prov'; S.frek = 'tahunan'; S.per = per; gantiHalaman('peta'); } }, 'Peta penuh ', ikon('panah')),
            h('div', { class: 'peta-mini' }, pmEl), legEl, ekstrem))));
      const sn = D.sasaran.find(x => x.level === 'nasional');
      tunda.push(() => {
        let d = deret('tpt', S.dfrek, '00') || [];
        if (S.dfrek === 'tahunan') d = d.filter(x => x[0] >= '2015');
        const pita = S.dfrek === 'tahunan' && sn ? [{ dari: '2025', sampai: '2025', lo: sn.target2025[0], hi: sn.target2025[1], label: 'Sasaran 2025', legenda: 'Rentang sasaran RPJMN' }, { dari: '2029', sampai: '2029', lo: sn.target2029[0], hi: sn.target2029[1], label: 'Sasaran 2029', legenda: 'Rentang sasaran RPJMN' }] : [];
        I.grafikGaris(g, { seri: [{ nama: 'Indonesia', warna: 'var(--accent)', data: d, utama: true }], tinggi: 350, fmt: v => fmtL(L_, v), patahan: (BY.tpt.patahan || {})[S.dfrek], pita, area: true,
          periodeTambahan: S.dfrek === 'tahunan' ? ['2026', '2027', '2028', '2029'] : [], aktif: S.dfrek === 'tahunan' ? per : null, onKlik: S.dfrek === 'tahunan' ? pilihPer : null, label: 'Tren TPT Indonesia' });
        const K = kelasL(L_, 'prov');
        petaMini(pmEl, { warna: k => K.warna(pot[k]), onPilih: k => { if (k) { S.wil = k; renderProfil(); tulis(); } },
          onHover: (ev, k) => { if (!k) { I.sembunyiTip(); return; } I.tampilTip(ev, [I.tipNama(namaW(k)), I.tipBaris(fmtL(L_, pot[k]), 'TPT'), I.tipSub(lblTahunan(per))]); } });
        I.legendaKelas(legEl, { kelas: K, fmt: fmtLeg(L_), judul: 'TPT (%)' });
        const li = k => h('li', { onclick: () => { S.wil = k; renderProfil(); tulis(); } }, h('span', { text: (urutP.indexOf(k) + 1) + '. ' + namaW(k) }), h('b', { text: fmtL(L_, pot[k]) }));
        ekstrem.replaceChildren(h('div', {}, h('h4', { text: '5 tertinggi' }), h('ol', {}, urutP.slice(0, 5).map(li))), h('div', {}, h('h4', { text: '5 terendah' }), h('ol', {}, urutP.slice(-5).reverse().map(li))));
      });
    }

    // 02 siapa yang menganggur
    {
      const segRinc = h('div', { class: 'seg' }), segMode = h('div', { class: 'seg' }), id = RINC_TPT[S.drinc], r = R[id], g = h('div');
      I.segmen(segRinc, Object.keys(RINC_TPT).map(k => [k, NAMA_RINC[k]]), S.drinc, v => { S.drinc = v; renderProfil(); tulis(); }, 'Rincian');
      I.segmen(segMode, [['garis', 'Garis Tunggal'], ['grid', 'Panel Kisi']], S.dmode, v => { S.dmode = v; renderProfil(); tulis(); }, 'Tampilan');
      
      const tabWrap = h('div', { class: 'tab-rincian', style: 'display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:10px' },
        segRinc,
        h('div', { style: 'display:flex;align-items:center;gap:8px' }, h('span', { class: 'kecil', text: 'Tampilan: ' }), segMode));

      host.append(h('section', { class: 'bagian' }, bagian(2, 'Siapa yang menganggur?', S.dmode === 'garis' ? 'Perbandingan multi-garis TPT Indonesia menurut karakteristik penduduk (2015–2025). Hover garis untuk sorotan data.' : 'TPT Indonesia menurut karakteristik penduduk, tahunan (Agustus) 2015–2025. Skala sumbu sama di semua panel; klik grafik untuk memilih periode.'),
        h('div', { class: 'card' }, tabWrap, g, catatanR(r), kakiKartu(r, id, 'tahunan'))));

      tunda.push(() => {
        const f = rinc(id, 'tahunan');
        if (S.dmode === 'garis') {
          const warnaPalet = ['#0f766e', '#c2410c', '#2563eb', '#d97706', '#8b5cf6', '#10b981', '#06b6d4', '#ec4899', '#64748b', '#f97316', '#14b8a6'];
          const seriGaris = f.seri.map((s, idx) => ({
            nama: s.nama,
            warna: warnaPalet[idx % warnaPalet.length],
            data: f.periode.map((p, i) => [p, s.nilai[i]]),
            utama: idx === 0
          }));
          I.grafikGaris(g, {
            seri: seriGaris,
            tinggi: 360,
            fmt: fmtR(r),
            aktif: per,
            onKlik: pilihPer,
            legenda: true,
            label: 'Perbandingan TPT menurut ' + NAMA_RINC[S.drinc]
          });
        } else {
          I.kecilBanyak(g, { periode: f.periode, seri: f.seri, fmt: fmtR(r), aktif: per, onKlik: pilihPer, tinggi: 96 });
        }
      });
    }

    // 03 struktur penganggur
    {
      const id = 'penganggur_pendidikan', r = R[id], seg = h('div', { class: 'seg' }), g = h('div');
      I.segmen(seg, [['tahunan', 'Tahunan'], ['semesteran', 'Semesteran']], S.dpend, v => { S.dpend = v; renderProfil(); tulis(); }, 'Frekuensi');
      const idU = 'penganggur_umur', rU = R[idU], fU = rinc(idU, 'semesteran');
      if (!fU.periode.includes(S.dumur)) S.dumur = selaraskan(per + '-08', fU.periode);
      const selU = h('select', { 'aria-label': 'Periode', onchange: ev => { S.dumur = ev.target.value; renderProfil(); tulis(); } }, fU.periode.slice().reverse().map(p => h('option', { value: p, selected: p === S.dumur ? true : null, text: lblPer(p, true) })));
      const gU = h('div');
      host.append(h('section', { class: 'bagian' }, bagian(3, 'Struktur penganggur', 'Jumlah penganggur menurut pendidikan (2015–2025) serta menurut umur dan pengalaman kerja. Garis hitam = total resmi BPS.'),
        h('div', { class: 'kisi kisi-7-5' },
          kartuAksi('Menurut pendidikan tertinggi', S.dpend === 'tahunan' ? '2015–2025 · orang' : 'Februari & Agustus 2015–2025 · orang', seg, g, kakiKartu(r, id, S.dpend)),
          kartuAksi('Menurut umur & pengalaman kerja', 'Indonesia · orang', h('label', { class: 'kecil' }, 'Periode ', selU), gU, kakiKartu(rU)))));
      tunda.push(() => {
        const f = rinc(id, S.dpend), tot = f.seri.find(x => x.nama === r.total);
        I.grafikKolom(g, { periode: f.periode, seri: f.seri.filter(x => x.nama !== r.total), total: tot ? tot.nilai : null, totalLabel: 'Total (angka resmi BPS)', fmt: v => (v == null ? '—' : fmtAngka(v) + ' orang'), tinggi: 320, aktif: S.dpend === 'tahunan' ? per : null, onKlik: S.dpend === 'tahunan' ? pilihPer : null });
        const j = fU.periode.indexOf(S.dumur), umur = [...new Set(fU.seri.map(x => x.nama.split(' | ')[0]))].filter(u => u !== 'Total');
        const ambil = (u, kat) => { const x = fU.seri.find(z => z.nama === u + ' | ' + kat); return x ? x.nilai[j] : null; };
        I.grafikKolom(gU, { periode: umur, seri: [{ nama: 'Pernah bekerja', nilai: umur.map(u => ambil(u, 'Pernah Bekerja')) }, { nama: 'Tidak pernah bekerja', nilai: umur.map(u => ambil(u, 'Tidak Pernah Bekerja')) }],
          total: umur.map(u => ambil(u, 'Jumlah Pengangguran')), totalLabel: 'Jumlah (angka resmi)', fmt: v => (v == null ? '—' : fmtAngka(v) + ' orang'), tinggi: 320, label: 'Penganggur menurut umur' });
      });
    }

    // 04 setengah pengangguran
    {
      const segRinc = h('div', { class: 'seg' }), segMode = h('div', { class: 'seg' }), id = RINC_SP[S.dsp], r = R[id], g = h('div');
      I.segmen(segRinc, Object.keys(RINC_SP).map(k => [k, NAMA_RINC[k]]), S.dsp, v => { S.dsp = v; renderProfil(); tulis(); }, 'Rincian');
      I.segmen(segMode, [['garis', 'Garis Tunggal'], ['grid', 'Panel Kisi']], S.dspmode, v => { S.dspmode = v; renderProfil(); tulis(); }, 'Tampilan');

      const tabWrap = h('div', { class: 'tab-rincian', style: 'display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:10px' },
        segRinc,
        h('div', { style: 'display:flex;align-items:center;gap:8px' }, h('span', { class: 'kecil', text: 'Tampilan: ' }), segMode));

      host.append(h('section', { class: 'bagian' }, bagian(4, 'Setengah pengangguran', S.dspmode === 'garis' ? 'Perbandingan multi-garis tingkat setengah pengangguran menurut karakteristik penduduk (2015–2025).' : 'Pekerja di bawah jam kerja normal (< 35 jam/minggu) yang masih mencari atau bersedia menerima pekerjaan lain, tahunan 2015–2025.'),
        h('div', { class: 'card' }, tabWrap, g, kakiKartu(r, id, 'tahunan'))));

      tunda.push(() => {
        const f = rinc(id, 'tahunan');
        if (S.dspmode === 'garis') {
          const warnaPalet = ['#0f766e', '#c2410c', '#2563eb', '#d97706', '#8b5cf6', '#10b981', '#06b6d4', '#ec4899', '#64748b'];
          const seriGaris = f.seri.map((s, idx) => ({
            nama: s.nama,
            warna: warnaPalet[idx % warnaPalet.length],
            data: f.periode.map((p, i) => [p, s.nilai[i]]),
            utama: idx === 0
          }));
          I.grafikGaris(g, {
            seri: seriGaris,
            tinggi: 360,
            fmt: fmtR(r),
            aktif: per,
            onKlik: pilihPer,
            legenda: true,
            label: 'Perbandingan Setengah Pengangguran menurut ' + NAMA_RINC[S.dsp]
          });
        } else {
          I.kecilBanyak(g, { periode: f.periode, seri: f.seri, fmt: fmtR(r), aktif: per, onKlik: pilihPer, tinggi: 96 });
        }
      });
    }

    // 05 kegiatan penduduk
    {
      const r = R.kegiatan, f = rinc('kegiatan', 'tahunan');
      const jml = f.seri.filter(x => !/%|Tingkat/.test(x.nama)), tkt = f.seri.filter(x => /%|Tingkat/.test(x.nama));
      const g1 = h('div'), g2 = h('div');
      host.append(h('section', { class: 'bagian' }, bagian(5, 'Penduduk 15+ menurut kegiatan', 'Indonesia, 2015–2025 (Sakernas Agustus) · tiap panel berskala sendiri · angka resmi BPS.'),
        h('div', { class: 'kisi kisi-5-7' }, kartu('Tingkat (persen)', 'TPAK, TPT, tingkat kesempatan kerja', g2), kartu('Jumlah (orang)', 'Penduduk 15+, angkatan kerja, bekerja, penganggur, bukan angkatan kerja', g1)), h('div', { class: 'jarak' }, sumberR(r))));
      tunda.push(() => {
        I.kecilBanyak(g1, { periode: f.periode, seri: jml, fmt: v => (v == null ? '—' : nfKompak.format(v)), aktif: per, tinggi: 80, bersama: false });
        I.kecilBanyak(g2, { periode: f.periode, seri: tkt.map(x => ({ ...x, nama: x.nama.replace(/\s*\(%\)/, '') })), fmt: v => (v == null ? '—' : fmtAngka(v, 2) + '%'), aktif: per, tinggi: 80, bersama: false });
      });
    }
  }

  // =====================================================================
  // PROFIL
  // =====================================================================
  let obsProfil = null;
  function renderProfil() {
    if (obsProfil) {
      obsProfil.disconnect();
      obsProfil = null;
    }
    const host = $('profil');
    if (S.wil !== '00' && !PROV[S.wil] && !KAB[S.wil]) S.wil = '00';
    const k = S.wil, isKab = !!KAB[k], isNas = k === '00', pk = provDari(k);
    const lokasi = h('div', { class: 'peta-host' });

    // Toggle Utama: Nasional vs Wilayah Daerah
    const segLingkup = h('div', { class: 'seg seg-lingkup-profil' });
    I.segmen(segLingkup, [['nasional', 'Nasional'], ['wilayah', 'Wilayah']], isNas ? 'nasional' : 'wilayah', lingkupBaru => {
      if (lingkupBaru === 'nasional') {
        S.wil = '00';
      } else {
        S.wil = (pk && pk !== '00') ? pk : '31';
      }
      render();
    }, 'Cakupan Profil');

    // Toggle Sub-tingkat Wilayah: Provinsi vs Kab/kota (hanya saat mode Wilayah)
    let segLevel = null;
    let modeLevel = isKab ? 'kab' : 'prov';
    if (!isNas) {
      segLevel = h('div', { class: 'seg seg-level-profil' });
      I.segmen(segLevel, [['prov', 'Provinsi'], ['kab', 'Kab/kota']], modeLevel, lvBaru => {
        if (lvBaru === 'prov') {
          S.wil = isKab ? pk : k;
        } else {
          const kabs = WIL.kabkota.filter(x => x.prov === pk);
          S.wil = kabs.length ? kabs[0].kode : '3101';
        }
        render();
      }, 'Tingkat Wilayah');
    }

    // Dropdown seleksi wilayah searchable sesuai mode tingkat (hanya saat mode Wilayah)
    let pilihWil = null;
    if (!isNas) {
      const wrap = h('div', { class: 'pilih-wil-wrap' });
      const tombol = h('button', {
        class: 'pilih-wil-btn',
        type: 'button',
        'aria-haspopup': 'listbox',
        'aria-expanded': 'false'
      },
        h('span', { class: 'label-teks', text: namaW(k) }),
        h('span', { class: 'panah-bawah', text: '▼' })
      );
      const panel = h('div', { class: 'pilih-wil-panel hidden' });
      const inputCari = h('input', {
        type: 'text',
        placeholder: modeLevel === 'kab' ? 'Cari kab/kota…' : 'Cari provinsi…',
        'aria-label': 'Cari wilayah'
      });
      const cariBox = h('div', { class: 'pilih-wil-cari-box' }, inputCari);
      const daftarUl = h('ul', { class: 'pilih-wil-daftar', role: 'listbox' });
      panel.append(cariBox, daftarUl);
      wrap.append(tombol, panel);

      const items = [];
      if (modeLevel === 'kab') {
        URUT_WIL.forEach(w => {
          const provs = WIL.provinsi.filter(p => p.wilayah === w).sort((a, b) => a.nama.localeCompare(b.nama));
          provs.forEach(p => {
            const kabs = WIL.kabkota.filter(x => x.prov === p.kode).sort((a, b) => a.nama.localeCompare(b.nama));
            if (kabs.length) {
              items.push({ tipe: 'grup', nama: `${p.nama} (${w})` });
              kabs.forEach(kb => {
                items.push({ tipe: 'item', kode: kb.kode, nama: kb.nama, sub: p.nama });
              });
            }
          });
        });
      } else {
        URUT_WIL.forEach(w => {
          const provs = WIL.provinsi.filter(p => p.wilayah === w).sort((a, b) => a.nama.localeCompare(b.nama));
          if (provs.length) {
            items.push({ tipe: 'grup', nama: `Wilayah ${w}` });
            provs.forEach(p => {
              items.push({ tipe: 'item', kode: p.kode, nama: p.nama, sub: `Wilayah ${w}` });
            });
          }
        });
      }

      const tutup = () => {
        wrap.classList.remove('buka');
        panel.classList.add('hidden');
        tombol.setAttribute('aria-expanded', 'false');
        inputCari.value = '';
      };

      const buka = () => {
        wrap.classList.add('buka');
        panel.classList.remove('hidden');
        tombol.setAttribute('aria-expanded', 'true');
        filter('');
        setTimeout(() => inputCari.focus(), 50);
      };

      const norm = t => (t || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/^(kab\.?|kota|kabupaten|provinsi)\s+/, '');

      const filter = q => {
        daftarUl.replaceChildren();
        const nq = norm(q.trim());
        let adaItem = false;

        let grupPending = null;
        items.forEach(it => {
          if (it.tipe === 'grup') {
            grupPending = it;
          } else {
            const cocok = !nq || norm(it.nama).includes(nq) || (it.sub && norm(it.sub).includes(nq));
            if (cocok) {
              adaItem = true;
              if (grupPending) {
                daftarUl.append(h('li', { class: 'pilih-wil-grup-jdl', text: grupPending.nama }));
                grupPending = null;
              }
              const li = h('li', {
                class: 'pilih-wil-item' + (it.kode === k ? ' terpilih' : ''),
                role: 'option',
                onclick: () => {
                  tutup();
                  S.wil = it.kode;
                  render();
                }
              },
                h('span', { text: it.nama }),
                it.sub ? h('span', { class: 'sub-teks', text: it.sub }) : null
              );
              daftarUl.append(li);
            }
          }
        });

        if (!adaItem) {
          daftarUl.append(h('li', { class: 'pilih-wil-kosong', text: 'Tidak ada wilayah yang cocok' }));
        }
      };

      tombol.addEventListener('click', ev => {
        ev.stopPropagation();
        if (wrap.classList.contains('buka')) tutup(); else buka();
      });

      inputCari.addEventListener('input', () => filter(inputCari.value));
      inputCari.addEventListener('click', ev => ev.stopPropagation());
      inputCari.addEventListener('keydown', ev => {
        if (ev.key === 'Escape') {
          tutup();
          tombol.focus();
        } else if (ev.key === 'Enter') {
          const first = daftarUl.querySelector('.pilih-wil-item');
          if (first) {
            first.click();
            ev.preventDefault();
          }
        }
      });

      document.addEventListener('click', ev => {
        if (!wrap.contains(ev.target)) tutup();
      });

      pilihWil = wrap;
    }

    const tTpt = terakhir('tpt', 'tahunan', k);
    const chipLevel = isNas ? 'Nasional' : isKab ? (KAB[k].jenis + ' · Provinsi ' + namaW(pk)) : 'Provinsi ' + namaW(k);
    const chipWilayah = isNas ? 'Seluruh Indonesia' : ('Wilayah ' + (PROV[pk] ? PROV[pk].wilayah : ''));
    const remahWil = isNas
      ? ['Indonesia (Nasional)']
      : isKab
        ? [h('button', { class: 'btn-tautan', type: 'button', text: 'Indonesia', onclick: () => { S.wil = '00'; render(); } }), ' › ', h('button', { class: 'btn-tautan', type: 'button', text: namaW(pk), onclick: () => { S.wil = pk; render(); } }), ' › ', KAB[k].jenis]
        : [h('button', { class: 'btn-tautan', type: 'button', text: 'Indonesia', onclick: () => { S.wil = '00'; render(); } }), ' › ', 'Provinsi'];

    const alatProfil = [];
    if (segLevel) alatProfil.push(segLevel);
    if (pilihWil) alatProfil.push(pilihWil);

    const tunda = [];
    if (isNas) {
      renderKontenNasional(host, tunda, segLingkup);
      requestAnimationFrame(() => tunda.forEach(x => x()));
      return;
    }

    // Bangun narasi fakta / ringkasan analitis daerah
    const faktaParts = [];
    if (tTpt) {
      const [th, vTpt] = tTpt;
      const dWil = deret('tpt', 'tahunan', k) || [];
      const dSeb = dWil.find(x => x[0] === String(+th - 1));
      const uTpt = urutan('tpt', 'tahunan', k, th);
      const vNas = nilai('tpt', 'tahunan', '00', th);
      const vProv = isKab ? nilai('tpt', 'tahunan', pk, th) : null;
      const tPeng = terakhir('penganggur', 'tahunan', k);
      const sas = D.sasaran.find(x => x.level === 'wilayah' && x.wilayah === (PROV[pk] ? PROV[pk].wilayah : ''));
      const sasProv = D.sasaran.find(x => x.level === 'provinsi' && x.kode === pk);
      const rgSas = r => (r ? `${fmtAngka(r[0], 2)}%–${fmtAngka(r[1], 2)}%` : '—');
      const kabs = WIL.kabkota.filter(x => x.prov === pk);

      if (isKab) {
        let s = `TPT ${fmtAngka(vTpt, 2)}% (${lblTahunan(th)})`;
        if (dSeb) {
          const diff = vTpt - dSeb[1];
          if (Math.abs(diff) >= 0.01) {
            s += ` (${diff > 0 ? '▲ +' : '▼ -'}${fmtAngka(Math.abs(diff), 2)} poin %-ase YoY)`;
          }
        }
        if (uTpt) s += ` — peringkat ke-${uTpt[0]} dari ${uTpt[1]} kab/kota di Provinsi ${namaW(pk)}.`;
        faktaParts.push(s);

        if (vProv != null || vNas != null) {
          const comp = [];
          if (vProv != null) comp.push(`${vTpt > vProv ? 'di atas' : 'di bawah'} provinsi (${fmtAngka(vProv, 2)}%)`);
          if (vNas != null) comp.push(`${vTpt > vNas ? 'di atas' : 'di bawah'} nasional (${fmtAngka(vNas, 2)}%)`);
          faktaParts.push(`Posisi ${comp.join(' & ')}.`);
        }
        if (sasProv && sasProv.target2025) {
          faktaParts.push(`Target RPJMN Provinsi ${namaW(pk)}: ${rgSas(sasProv.target2025)} (2025) & ${rgSas(sasProv.target2029)} (2029).`);
        }
      } else {
        let s = `TPT ${fmtAngka(vTpt, 2)}% (${lblTahunan(th)})`;
        if (dSeb) {
          const diff = vTpt - dSeb[1];
          if (Math.abs(diff) >= 0.01) {
            s += ` (${diff > 0 ? '▲ +' : '▼ -'}${fmtAngka(Math.abs(diff), 2)} poin %-ase YoY)`;
          }
        }
        if (uTpt) s += ` — peringkat ke-${uTpt[0]} dari ${uTpt[1]} provinsi.`;
        if (vNas != null) {
          s += ` ${vTpt > vNas ? 'Di atas' : 'Di bawah'} rata-rata nasional (${fmtAngka(vNas, 2)}%).`;
        }
        faktaParts.push(s);

        const targetParts = [];
        if (sasProv && sasProv.target2025) {
          targetParts.push(`Target Provinsi: ${rgSas(sasProv.target2025)} (2025) · ${rgSas(sasProv.target2029)} (2029)`);
        }
        if (sas && sas.target2025) {
          targetParts.push(`Target Wilayah ${sas.wilayah}: ${rgSas(sas.target2025)} (2025) · ${rgSas(sas.target2029)} (2029)`);
        }
        if (targetParts.length) {
          faktaParts.push(`Sasaran RPJMN — ${targetParts.join(' | ')}.`);
        }
      }
    }

    // Bangun elemen floating sticky bar untuk navigasi cepat saat di-scroll
    const stickyBar = h('div', { class: 'sticky-wilayah-bar', 'aria-hidden': 'true' },
      h('div', { class: 'dalam' },
        h('div', { class: 'sticky-wilayah-kiri' },
          h('div', { class: 'sticky-wilayah-remah' }, ...remahWil),
          h('div', { class: 'sticky-wilayah-judul', text: namaW(k) })
        ),
        h('div', { class: 'sticky-wilayah-kanan' },
          h('span', { class: 'sticky-wilayah-chip', text: isKab ? KAB[k].jenis : 'Provinsi' }),
          tTpt ? h('span', { class: 'sticky-wilayah-tpt', text: `TPT ${fmtAngka(tTpt[1], 2)}%` }) : null,
          h('button', {
            class: 'sticky-wilayah-ganti',
            type: 'button',
            title: 'Ganti wilayah atau kembali ke pemilih di atas',
            onclick: () => {
              window.scrollTo({ top: 0, behavior: 'smooth' });
              setTimeout(() => {
                const btnPilih = host.querySelector('.pilih-wil-btn');
                if (btnPilih) btnPilih.click();
              }, 320);
            }
          }, 'Ganti Wilayah ▾')
        )
      )
    );

    const heroEl = h('div', { class: 'hero' },
      h('div', { class: 'hero-lingkup-bar' }, segLingkup),
      h('div', { class: 'dalam hero-profil' },
        h('div', {},
          h('div', { class: 'remah' }, ...remahWil),
          h('h1', { text: namaW(k) }),
          h('div', { class: 'chip-baris' },
            h('span', { class: 'chip', text: chipLevel }),
            h('span', { class: 'chip', text: chipWilayah }),
            h('span', { class: 'chip', text: 'Kode BPS ' + k }),
            h('button', { class: 'chip', type: 'button', style: 'cursor:pointer', title: 'Salin tautan langsung ke profil ' + namaW(k), onclick: () => salinTautan(namaW(k)) }, ikon('tautan'), 'Bagikan')),
          faktaParts.length ? h('p', { class: 'hero-fakta', text: faktaParts.join(' ') }) : null,
          alatProfil.length ? h('div', { class: 'hero-alat' }, ...alatProfil) : null),
        h('div', { class: 'lokasi', 'aria-hidden': 'true' }, lokasi)));

    host.replaceChildren(stickyBar, heroEl);
    if ('IntersectionObserver' in window) {
      obsProfil = new IntersectionObserver(([entry]) => {
        stickyBar.classList.toggle('tampil', !entry.isIntersecting);
      }, { rootMargin: '-52px 0px 0px 0px', threshold: 0 });
      obsProfil.observe(heroEl);
    }
    tunda.push(() => petaMini(lokasi, {
      warna: x => (isNas ? '#f5a37f' : x === pk ? '#f5a37f' : 'rgba(255,255,255,.22)'),
      zoom: isNas ? [7.9, 5.9, 924.4, 342.6] : null,
      onPilih: x => { if (x) { S.wil = x; render(); tulis(); } }
    }));
    // KPI
    // Gabungkan TPT & Penganggur, serta TPT Laki-laki & Perempuan
    const tTptMain = terakhir('tpt', 'tahunan', k);
    const uTptMain = tTptMain ? urutan('tpt', 'tahunan', k, tTptMain[0]) : null;
    const vNTptMain = tTptMain ? nilai('tpt', 'tahunan', '00', tTptMain[0]) : null;
    const sparkTptMain = (deret('tpt', 'tahunan', k) || []).slice(-12);

    const tPengMain = terakhir('penganggur', 'tahunan', k);
    const sparkPengMain = (deret('penganggur', 'tahunan', k) || []).slice(-12);

    // Kartu Gabungan 1: TPT & Jumlah Penganggur (Gambar 2 & Gambar 3)
    const kpiTptPengGabung = h('div', { class: 'kpi kpi-rentang-gabung' },
      h('div', { class: 'kpi-sub-item' },
        h('div', { class: 'atas' }, h('span', { class: 'bulat' }, ikon('tpt')), h('span', { text: 'TPT' })),
        h('div', { class: 'val', text: tTptMain ? fmtL(BY.tpt, tTptMain[1]) : '—' }),
        h('div', { class: 'per', text: tTptMain ? lblTahunan(tTptMain[0]) + (vNTptMain != null ? ' · Indonesia ' + fmtL(BY.tpt, vNTptMain) : '') : 'tidak ada angka resmi' }),
        uTptMain ? h('div', { class: 'peringkat-lencana' }, h('span', { class: 'lencana biru', text: `#${uTptMain[0]} dari ${uTptMain[1]}${isKab ? ' di provinsi' : ''}` })) : null,
        sparkTptMain.length ? I.garisMini(sparkTptMain, { tinggi: 22 }) : null
      ),
      h('div', { class: 'kpi-divider-horiz' }),
      h('div', { class: 'kpi-sub-item' },
        h('div', { class: 'atas' }, h('span', { class: 'bulat' }, ikon('orang')), h('span', { text: 'Jumlah penganggur' })),
        h('div', { class: 'val', text: tPengMain ? fmtL(BY.penganggur, tPengMain[1], true) : '—' }),
        h('div', { class: 'per', text: tPengMain ? lblTahunan(tPengMain[0]) : 'tidak ada angka resmi' }),
        sparkPengMain.length ? I.garisMini(sparkPengMain, { tinggi: 22 }) : null
      )
    );

    // Kartu Gabungan 2: TPT Laki-laki & Perempuan (Gambar 1)
    const tL = terakhir('tpt_l', 'tahunan', k), uL = tL ? urutan('tpt_l', 'tahunan', k, tL[0]) : null, vNL = tL ? nilai('tpt_l', 'tahunan', '00', tL[0]) : null, spkL = (deret('tpt_l', 'tahunan', k) || []).slice(-12);
    const tP = terakhir('tpt_p', 'tahunan', k), uP = tP ? urutan('tpt_p', 'tahunan', k, tP[0]) : null, vNP = tP ? nilai('tpt_p', 'tahunan', '00', tP[0]) : null, spkP = (deret('tpt_p', 'tahunan', k) || []).slice(-12);

    const kpiGenderGabung = h('div', { class: 'kpi kpi-rentang-gabung' },
      h('div', { class: 'kpi-sub-item' },
        h('div', { class: 'atas' }, h('span', { class: 'bulat' }, ikon('pria')), h('span', { text: 'TPT laki-laki' })),
        h('div', { class: 'val', text: tL ? fmtL(BY.tpt_l, tL[1]) : '—' }),
        h('div', { class: 'per', text: tL ? lblTahunan(tL[0]) + (vNL != null ? ' · Indonesia ' + fmtL(BY.tpt_l, vNL) : '') : 'tidak ada angka resmi' }),
        uL ? h('div', { class: 'peringkat-lencana' }, h('span', { class: 'lencana biru', text: `#${uL[0]} dari ${uL[1]}${isKab ? ' di provinsi' : ''}` })) : null,
        spkL.length ? I.garisMini(spkL, { tinggi: 22 }) : null
      ),
      h('div', { class: 'kpi-divider-horiz' }),
      h('div', { class: 'kpi-sub-item' },
        h('div', { class: 'atas' }, h('span', { class: 'bulat oranye' }, ikon('wanita')), h('span', { text: 'TPT perempuan' })),
        h('div', { class: 'val', text: tP ? fmtL(BY.tpt_p, tP[1]) : '—' }),
        h('div', { class: 'per', text: tP ? lblTahunan(tP[0]) + (vNP != null ? ' · Indonesia ' + fmtL(BY.tpt_p, vNP) : '') : 'tidak ada angka resmi' }),
        uP ? h('div', { class: 'peringkat-lencana' }, h('span', { class: 'lencana biru', text: `#${uP[0]} dari ${uP[1]}${isKab ? ' di provinsi' : ''}` })) : null,
        spkP.length ? I.garisMini(spkP, { tinggi: 22 }) : null
      )
    );

    // Kartu Gabungan 3: NEET & Setengah Pengangguran (Gambar 1)
    const tNeet = terakhir('neet', 'tahunan', k), uNeet = tNeet ? urutan('neet', 'tahunan', k, tNeet[0]) : null, vNNeet = tNeet ? nilai('neet', 'tahunan', '00', tNeet[0]) : null, spkNeet = (deret('neet', 'tahunan', k) || []).slice(-12);
    const tSet = terakhir('setengah', 'tahunan', k), uSet = tSet ? urutan('setengah', 'tahunan', k, tSet[0]) : null, vNSet = tSet ? nilai('setengah', 'tahunan', '00', tSet[0]) : null, spkSet = (deret('setengah', 'tahunan', k) || []).slice(-12);

    const kpiNeetSetGabung = !isKab ? h('div', { class: 'kpi kpi-rentang-gabung' },
      h('div', { class: 'kpi-sub-item' },
        h('div', { class: 'atas' }, h('span', { class: 'bulat' }, ikon('neet')), h('span', { text: 'NEET' })),
        h('div', { class: 'val', text: tNeet ? fmtL(BY.neet, tNeet[1]) : '—' }),
        h('div', { class: 'per', text: tNeet ? lblTahunan(tNeet[0]) + (vNNeet != null ? ' · Indonesia ' + fmtL(BY.neet, vNNeet) : '') : 'tidak ada angka resmi' }),
        uNeet ? h('div', { class: 'peringkat-lencana' }, h('span', { class: 'lencana biru', text: `#${uNeet[0]} dari ${uNeet[1]}` })) : null,
        spkNeet.length ? I.garisMini(spkNeet, { tinggi: 22 }) : null
      ),
      h('div', { class: 'kpi-divider-horiz' }),
      h('div', { class: 'kpi-sub-item' },
        h('div', { class: 'atas' }, h('span', { class: 'bulat' }, ikon('jam')), h('span', { text: 'Setengah pengangguran' })),
        h('div', { class: 'val', text: tSet ? fmtL(BY.setengah, tSet[1]) : '—' }),
        h('div', { class: 'per', text: tSet ? lblTahunan(tSet[0]) + (vNSet != null ? ' · Indonesia ' + fmtL(BY.setengah, vNSet) : '') : 'tidak ada angka resmi' }),
        uSet ? h('div', { class: 'peringkat-lencana' }, h('span', { class: 'lencana biru', text: `#${uSet[0]} dari ${uSet[1]}` })) : null,
        spkSet.length ? I.garisMini(spkSet, { tinggi: 22 }) : null
      )
    ) : null;

    const cards = [kpiTptPengGabung, kpiGenderGabung];
    if (kpiNeetSetGabung) cards.push(kpiNeetSetGabung);

    host.append(h('div', { class: `kpi-kisi kpi-profil-kisi kpi-count-${cards.length}` }, ...cards));
    // 01 tren
    {
      const fr = frekTersedia('tpt', lvDari(k)); if (!fr.includes(S.pfrek)) S.pfrek = 'tahunan';
      const seg = h('div', { class: 'seg' }); I.segmen(seg, fr.map(f => [f, FREK[f]]), S.pfrek, f => { S.pfrek = f; renderProfil(); tulis(); }, 'Frekuensi');
      const g = h('div'), gLP = h('div'), am = asalMap('tpt', S.pfrek, k);
      const sasWil = D.sasaran.find(x => x.level === 'wilayah' && x.wilayah === (PROV[pk] ? PROV[pk].wilayah : ''));
      const sasPrv = D.sasaran.find(x => x.level === 'provinsi' && x.kode === pk);
      const subTren = S.pfrek === 'tahunan'
        ? `2015–2025 · pita = rentang Target Provinsi (${namaW(pk)}) & Target Wilayah (${PROV[pk] ? PROV[pk].wilayah : ''}) RPJMN 2025–2029`
        : FREK[S.pfrek];
      host.append(h('section', { class: 'bagian' }, bagian(1, 'Tingkat pengangguran terbuka', `${namaW(k)}${isKab ? ' dibandingkan ' + namaW(pk) : ''} dan Indonesia, beserta sasaran RPJMN 2025–2029 serta TPT laki-laki dan perempuan.`),
        h('div', { class: 'kisi kisi-2' },
          kartuAksi('Tren TPT & Sasaran RPJMN', subTren, fr.length > 1 ? seg : null, g, am ? h('div', { class: 'catatan-kecil', text: 'Titik berongga = angka tabel BPS provinsi (' + Object.keys(am).join(', ') + '). Garis putus-putus = pergantian sumber/patahan seri.' }) : null),
          kartu('Laki-laki & perempuan', 'Tahunan (Agustus) 2017–2025', gLP))));
      tunda.push(() => {
        let dWil = deret('tpt', S.pfrek, k) || [];
        if (S.pfrek === 'tahunan') dWil = dWil.filter(x => x[0] >= '2015');
        const ser = [{ nama: namaW(k), warna: 'var(--accent)', data: dWil, utama: true, asal: am }];
        if (isKab && deret('tpt', S.pfrek, pk)) {
          let dPk = deret('tpt', S.pfrek, pk) || [];
          if (S.pfrek === 'tahunan') dPk = dPk.filter(x => x[0] >= '2015');
          ser.push({ nama: namaW(pk), warna: 'var(--cat-2)', data: dPk });
        }
        if (deret('tpt', S.pfrek, '00')) {
          let dNat = deret('tpt', S.pfrek, '00') || [];
          if (S.pfrek === 'tahunan') dNat = dNat.filter(x => x[0] >= '2015');
          ser.push({ nama: 'Indonesia', warna: 'var(--cat-3)', data: dNat });
        }
        const pitaProfil = [];
        if (S.pfrek === 'tahunan') {
          if (sasWil && sasWil.target2025) {
            pitaProfil.push(
              { dari: '2025', sampai: '2025', lo: sasWil.target2025[0], hi: sasWil.target2025[1], cls: 'pita-wil', dx: 6, lebar: 5, legenda: `Target Wilayah ${sasWil.wilayah} (2025–2029)` },
              { dari: '2029', sampai: '2029', lo: sasWil.target2029[0], hi: sasWil.target2029[1], cls: 'pita-wil', dx: 6, lebar: 5, label: 'Wil 2029', dyLabel: -12, legenda: `Target Wilayah ${sasWil.wilayah} (2025–2029)` }
            );
          }
          if (sasPrv && sasPrv.target2025) {
            pitaProfil.push(
              { dari: '2025', sampai: '2025', lo: sasPrv.target2025[0], hi: sasPrv.target2025[1], cls: 'pita-prov', dx: -4, lebar: 5, label: 'Prov 2025', legenda: `Target Provinsi ${namaW(pk)} (2025–2029)` },
              { dari: '2029', sampai: '2029', lo: sasPrv.target2029[0], hi: sasPrv.target2029[1], cls: 'pita-prov', dx: -4, lebar: 5, label: 'Prov 2029', legenda: `Target Provinsi ${namaW(pk)} (2025–2029)` }
            );
          }
        }
        I.grafikGaris(g, {
          seri: potongAwal(ser),
          tinggi: 340,
          fmt: v => fmtL(BY.tpt, v),
          patahan: (BY.tpt.patahan || {})[S.pfrek],
          pita: pitaProfil,
          periodeTambahan: S.pfrek === 'tahunan' ? ['2026', '2027', '2028', '2029'] : [],
          asalLabel: 'tabel BPS provinsi'
        });
        I.grafikGaris(gLP, { seri: [{ nama: 'Laki-laki', warna: 'var(--cat-1)', data: deret('tpt_l', 'tahunan', k) || [], utama: true }, { nama: 'Perempuan', warna: 'var(--cat-2)', data: deret('tpt_p', 'tahunan', k) || [], utama: true }], tinggi: 340, fmt: v => fmtL(BY.tpt, v) });
      });
    }
    // 02 indikator pendukung
    {
      const pend = isKab ? ['penganggur', 'tpak'] : ['neet', 'setengah', 'penganggur'];
      const grid = h('div', { class: 'kisi kisi-' + pend.length });
      host.append(h('section', { class: 'bagian' }, bagian(2, 'Indikator pendukung', isKab ? 'Jumlah penganggur (Kemnaker) dan TPAK (tabel BPS provinsi).' : 'NEET, setengah pengangguran, dan jumlah penganggur — dibandingkan dengan Indonesia bila berupa tingkat.'), grid));
      pend.forEach(id => {
        const l = BY[id], g = h('div');
        grid.append(kartu(l.singkat, l.jenis === 'jumlah' ? 'orang · tahunan' : 'tahunan · vs ' + (isKab ? namaW(pk) : 'Indonesia'), g));
        tunda.push(() => {
          const ser = [{ nama: namaW(k), warna: 'var(--accent)', data: deret(id, 'tahunan', k) || [], utama: true }], pemb = isKab ? pk : '00';
          if (l.jenis !== 'jumlah' && deret(id, 'tahunan', pemb)) ser.push({ nama: namaW(pemb), warna: isKab ? 'var(--cat-2)' : 'var(--cat-3)', data: deret(id, 'tahunan', pemb) });
          I.grafikGaris(g, { seri: potongAwal(ser), tinggi: 210, fmt: v => fmtL(l, v), nol: l.jenis === 'jumlah', area: ser.length === 1 });
        });
      });
    }
    let no = 3;
    if (!isKab) profilKemnaker(host, k, tunda, no++);
    profilKabkota(host, k, pk, isKab, tunda, no);
    requestAnimationFrame(() => tunda.forEach(x => x()));
  }
  function profilKemnaker(host, k, tunda, no) {
    const K = D.kemnaker, data = K.data[S.pkar] || {}, per = Object.keys(data).filter(p => data[p][k]).sort();
    if (!per.includes(S.pkper)) S.pkper = per[per.length - 1] || '';
    const seg = h('div', { class: 'seg' }); I.segmen(seg, Object.keys(K.karakteristik).map(x => [x, K.karakteristik[x]]), S.pkar, v => { S.pkar = v; renderProfil(); tulis(); }, 'Karakteristik');
    const sel = h('select', { 'aria-label': 'Periode', onchange: ev => { S.pkper = ev.target.value; renderProfil(); tulis(); } }, per.slice().reverse().map(p => h('option', { value: p, selected: p === S.pkper ? true : null, text: lblPer(p, true) })));
    const g = h('div'), baris = (data[S.pkper] || {})[k] || [], tot = baris.find(r => /^total$/i.test(r[0])), ket = D.ketPeriode.find(x => x.periode === S.pkper), src = (K.sumber[S.pkper] || [])[0];
    host.append(h('section', { class: 'bagian' }, bagian(no, 'Siapa penganggurnya?', 'Jumlah penganggur menurut karakteristik (olahan Sakernas Kemnaker) dan NEET menurut jenis kelamin — angka apa adanya, tidak dijumlahkan atau dibagi.'),
      h('div', { class: `kisi kisi-2 kisi-karakteristik kar-${S.pkar}` },
        h('div', { class: 'card' }, h('div', { class: 'tab-rincian' }, seg, h('label', {}, 'Periode ', sel)), g,
          tot ? h('div', { class: 'catatan-kecil' }, h('span', { class: 'lencana biru', text: 'Total resmi ' + fmtAngka(tot[1]) + ' orang' }), ` · laki-laki ${fmtAngka(tot[2])} · perempuan ${fmtAngka(tot[3])}`) : null,
          S.pkar === 'pendidikan' && ket && ket.kategori ? h('div', { class: 'catatan-kecil', text: 'Kategori pendidikan periode ini: ' + ket.kategori + '. Kategori dapat berbeda antarperiode sesuai sumber.' }) : null,
          src ? h('div', { class: 'kaki-kartu' }, h('div', { class: 'kecil' }, 'Sumber: ', h('a', { href: src, target: '_blank', rel: 'noopener', text: 'Kemnaker Satu Data — Pengangguran Terbuka (' + lblPer(S.pkper, true) + ')' }))) : null),
        kartuNeet(k))));
    const kapitalHurufAwal = str => (!str ? '' : str.charAt(0).toUpperCase() + str.slice(1));
    tunda.push(() => I.daftarBatang(g, { baris: baris.filter(r => !/^total$/i.test(r[0])).map(r => ({ nama: kapitalHurufAwal(r[0]), v: r[1], tip: `Laki-laki ${fmtAngka(r[2])} · Perempuan ${fmtAngka(r[3])}` })), fmt: v => (v == null ? '—' : fmtAngka(v)) }));
  }
  function kartuNeet(k) {
    const N = D.neetKemnaker, d = N.data[k];
    if (!d) return kartu('NEET menurut jenis kelamin', 'Tidak ada data Kemnaker untuk wilayah ini.');
    const per = N.periode.filter(p => d[p]).reverse();
    const fmtP = (v, p) => (v == null ? '—' : /proporsi/.test(N.satuan[p]) ? fmtAngka(v, 4) + ' (proporsi)' : fmtAngka(v, 2) + '%');
    const t = h('div');
    I.tabel(t, { kolom: [{ label: 'Periode' }, { label: 'Jumlah', num: true }, { label: 'NEET', num: true }, { label: 'Laki-laki', num: true }, { label: 'Perempuan', num: true }],
      baris: per.map(p => { const r = d[p]; return [{ teks: lblPer(p, true), sort: p }, { teks: fmtAngka(r[0]), sort: r[0] }, { teks: fmtP(r[1], p), sort: r[1] }, { teks: fmtP(r[3], p), sort: r[3] }, { teks: fmtP(r[5], p), sort: r[5] }]; }), maks: 330 });
    return kartu('NEET (15–24) menurut jenis kelamin', 'Kemnaker (olahan Sakernas) · semesteran', t,
      h('div', { class: 'catatan-kecil', text: 'Sebagian periode diterbitkan sebagai proporsi 0–1 (bukan persen) — ditampilkan apa adanya tanpa konversi.' }),
      h('div', { class: 'kaki-kartu' }, h('div', { class: 'kecil' }, 'Sumber: ', h('a', { href: N.sumber[per[0]], target: '_blank', rel: 'noopener', text: 'Kemnaker Satu Data — NEET' }))));
  }
  function profilKabkota(host, k, pk, isKab, tunda, no) {
    if (pk === '00' || k === '00') {
      profilProvinsiNasional(host, tunda, no);
      return;
    }
    const kabs = WIL.kabkota.filter(x => x.prov === pk);
    const perAda = daftarPeriode('tpt', 'tahunan', 'kab').filter(p => kabs.some(x => nilai('tpt', 'tahunan', x.kode, p) != null));
    if (!perAda.includes(S.ptahun)) S.ptahun = perAda[perAda.length - 1] || '';
    const th = S.ptahun;
    const sel = h('select', { 'aria-label': 'Tahun', onchange: ev => { S.ptahun = ev.target.value; renderProfil(); tulis(); } }, perAda.slice().reverse().map(p => h('option', { value: p, selected: p === th ? true : null, text: p })));
    const petaEl = h('div', { class: 'peta-host' }), leg = h('div', { class: 'legenda-mini' }), tb = h('div');
    const batangWrap = h('div', { class: 'batang-scroll-wrap' });
    const batang = h('div');
    batangWrap.append(batang);
    const kol = ['tpt', 'tpt_l', 'tpt_p', 'penganggur', 'tpak'];
    const jmlKab = kabs.length;
    const kelasJmlKab = jmlKab <= 5 ? 'kab-sedikit' : jmlKab <= 10 ? 'kab-sedang' : 'kab-banyak';
    host.append(h('section', { class: 'bagian' }, bagian(no, `Kabupaten/kota di ${namaW(pk)}`, `${kabs.length} kab/kota · TPT dan indikator lain pada tahun terpilih · klik untuk membuka profil kab/kota.`),
      h('div', { class: 'card' }, h('div', { class: 'tab-rincian' }, h('label', {}, 'Tahun ', sel)),
        h('div', { class: `kisi kisi-2 kisi-kabkota ${kelasJmlKab}` }, h('div', { class: 'peta-kolom' }, h('div', { class: 'peta-mini tinggi' }, petaEl), leg), batangWrap), h('div', { class: 'jarak' }, tb))));
    tunda.push(() => {
      const pm = I.Peta(petaEl, { wil: WIL, statis: true, onPilih: kk => { if (KAB[kk]) { S.wil = kk; render(); tulis(); } }, onHover: (ev, kk) => {
        if (!kk || !KAB[kk]) { I.sembunyiTip(); return; }
        I.tampilTip(ev, [I.tipNama(namaW(kk)), I.tipBaris(fmtL(BY.tpt, nilai('tpt', 'tahunan', kk, th)), 'TPT'), I.tipSub(lblTahunan(th))]);
      } });
      pm.setLevel('kab');
      const K = kelasL(BY.tpt, 'kab');
      pm.warnai(kk => (KAB[kk].prov === pk ? K.warna(nilai('tpt', 'tahunan', kk, th)) : 'var(--surface-3)'));
      pm.redupkan(kk => KAB[kk].prov === pk); pm.pilih(isKab ? k : null);
      if (WIL.peta.prov.bbox[pk]) pm.zoomKe(WIL.peta.prov.bbox[pk], false);
      pm.label(kabs.map(x => ({ kode: x.kode, nama: namaPendek(x.kode), nilai: fmtL(BY.tpt, nilai('tpt', 'tahunan', x.kode, th)), wajib: x.kode === k })).filter(x => x.nilai !== '—'), 30);
      I.legendaKelas(leg, { kelas: K, fmt: fmtLeg(BY.tpt), judul: 'TPT (%) · ' + lblTahunan(th), adaKosong: kabs.some(x => nilai('tpt', 'tahunan', x.kode, th) == null) });
      const vP = nilai('tpt', 'tahunan', pk, th);
      I.daftarBatang(batang, { baris: kabs.map(x => ({ kode: x.kode, nama: x.nama, v: nilai('tpt', 'tahunan', x.kode, th), sel: x.kode === k, tip: asalDi('tpt', 'tahunan', x.kode, th) ? 'Sumber: tabel BPS provinsi' : null })).sort((a, b) => (a.v == null) - (b.v == null) || b.v - a.v), fmt: v => fmtL(BY.tpt, v), ref: vP, onPilih: kk => { S.wil = kk; render(); tulis(); } });
      if (vP != null) batang.prepend(h('div', { class: 'legend-ref', style: 'grid-column:1/-1;margin-bottom:6px' }, h('i'), namaW(pk) + ' ' + fmtL(BY.tpt, vP)));
      I.tabel(tb, { kolom: [{ label: 'Kab/kota' }].concat(kol.map(id => ({ label: BY[id].singkat + (BY[id].satuan === '%' ? ' (%)' : ' (orang)'), num: true }))),
        baris: kabs.map(x => { const r = [{ teks: x.nama, sort: x.nama }].concat(kol.map(id => { const v = nilai(id, 'tahunan', x.kode, th); return { teks: v == null ? '—' : fmtAngka(v, BY[id].desimal), sort: v }; })); r.kode = x.kode; return r; }), sel: isKab ? k : null, maks: 420, onPilih: kk => { S.wil = kk; render(); tulis(); window.scrollTo({ top: 0, behavior: 'smooth' }); } });
    });
  }

  function profilProvinsiNasional(host, tunda, no) {
    const provs = WIL.provinsi.slice().sort((a, b) => a.kode.localeCompare(b.kode));
    const perAda = daftarPeriode('tpt', 'tahunan', 'prov').filter(p => provs.some(x => nilai('tpt', 'tahunan', x.kode, p) != null));
    if (!perAda.includes(S.ptahun)) S.ptahun = perAda[perAda.length - 1] || '';
    const th = S.ptahun;
    const sel = h('select', { 'aria-label': 'Tahun', onchange: ev => { S.ptahun = ev.target.value; renderProfil(); tulis(); } }, perAda.slice().reverse().map(p => h('option', { value: p, selected: p === th ? true : null, text: p })));
    const petaEl = h('div', { class: 'peta-host' }), leg = h('div', { class: 'legenda-mini' }), tb = h('div');
    const batangWrap = h('div', { class: 'batang-scroll-wrap' });
    const batang = h('div');
    batangWrap.append(batang);
    const kol = ['tpt', 'tpt_l', 'tpt_p', 'penganggur', 'tpak', 'neet', 'setengah'];
    host.append(h('section', { class: 'bagian' }, bagian(no, 'Provinsi di seluruh Indonesia', `${provs.length} provinsi · TPT dan indikator lain pada tahun terpilih · klik untuk membuka profil provinsi.`),
      h('div', { class: 'card' }, h('div', { class: 'tab-rincian' }, h('label', {}, 'Tahun ', sel)),
        h('div', { class: 'kisi kisi-2 kisi-kabkota kab-banyak' }, h('div', { class: 'peta-kolom' }, h('div', { class: 'peta-mini tinggi' }, petaEl), leg), batangWrap), h('div', { class: 'jarak' }, tb))));
    tunda.push(() => {
      const pm = I.Peta(petaEl, { wil: WIL, statis: true, onPilih: kk => { if (PROV[kk]) { S.wil = kk; render(); tulis(); } }, onHover: (ev, kk) => {
        if (!kk || !PROV[kk]) { I.sembunyiTip(); return; }
        I.tampilTip(ev, [I.tipNama(namaW(kk)), I.tipBaris(fmtL(BY.tpt, nilai('tpt', 'tahunan', kk, th)), 'TPT'), I.tipSub(lblTahunan(th))]);
      } });
      pm.setLevel('prov');
      const K = kelasL(BY.tpt, 'prov');
      pm.warnai(kk => K.warna(nilai('tpt', 'tahunan', kk, th)));
      pm.label(provs.map(x => ({ kode: x.kode, nama: x.nama, nilai: fmtL(BY.tpt, nilai('tpt', 'tahunan', x.kode, th)), wajib: false })).filter(x => x.nilai !== '—'), 38);
      I.legendaKelas(leg, { kelas: K, fmt: fmtLeg(BY.tpt), judul: 'TPT (%) · ' + lblTahunan(th), adaKosong: provs.some(x => nilai('tpt', 'tahunan', x.kode, th) == null) });
      const vN = nilai('tpt', 'tahunan', '00', th);
      I.daftarBatang(batang, { baris: provs.map(x => ({ kode: x.kode, nama: x.nama, v: nilai('tpt', 'tahunan', x.kode, th) })).sort((a, b) => (a.v == null) - (b.v == null) || b.v - a.v), fmt: v => fmtL(BY.tpt, v), ref: vN, onPilih: kk => { S.wil = kk; render(); tulis(); } });
      if (vN != null) batang.prepend(h('div', { class: 'legend-ref', style: 'grid-column:1/-1;margin-bottom:6px' }, h('i'), 'Indonesia ' + fmtL(BY.tpt, vN)));
      I.tabel(tb, { kolom: [{ label: 'Provinsi' }].concat(kol.map(id => ({ label: BY[id].singkat + (BY[id].satuan === '%' ? ' (%)' : ' (orang)'), num: true }))),
        baris: provs.map(x => { const r = [{ teks: x.nama, sort: x.nama }].concat(kol.map(id => { const v = nilai(id, 'tahunan', x.kode, th); return { teks: v == null ? '—' : fmtAngka(v, BY[id].desimal), sort: v }; })); r.kode = x.kode; return r; }), maks: 420, onPilih: kk => { S.wil = kk; render(); tulis(); window.scrollTo({ top: 0, behavior: 'smooth' }); } });
    });
  }

  // =====================================================================
  // SASARAN
  // =====================================================================
  function renderSasaran() {
    const host = $('sasaran'), L_ = BY.tpt, sn = D.sasaran.find(x => x.level === 'nasional');
    const perT = daftarPeriode('tpt', 'tahunan', 'prov'), pT = perT[perT.length - 1];
    const fmt = v => fmtL(L_, v), rg = r => (r ? fmtAngka(r[0], 2) + '–' + fmtAngka(r[1], 2) + '%' : '—');
    const vT = nilai('tpt', 'tahunan', '00', pT);
    host.replaceChildren(h('div', { class: 'hero' }, h('div', { class: 'dalam hero-kisi' },
      h('div', {}, h('div', { class: 'alis' }, h('span', { class: 'titik' }), 'Bappenas · RPJMN 2025–2029'), h('h1', {}, 'Sasaran TPT nasional ', h('em', { text: rg(sn.target2025) }), ' pada 2025 dan ', h('em', { text: rg(sn.target2029) }), ' pada 2029.'),
        h('p', {}, `Baseline 2024: ${fmtAngka(sn.baseline2024, 2)}%. Halaman ini menampilkan angka TPT resmi berdampingan dengan rentang sasaran sesuai `, h('a', { href: D.sumberRpjmn.url, target: '_blank', rel: 'noopener', style: 'color:#5eead4;font-weight:700;text-decoration:underline', text: 'Perpres No. 12 Tahun 2025 (RPJMN 2025–2029)' }), ' — tanpa menghitung jarak atau selisih.')),
      h('div', { class: 'hero-angka' }, h('div', { class: 'lbl', text: 'TPT Indonesia · ' + lblTahunan(pT) }), h('div', { class: 'val', text: fmt(vT) })))));
    host.append(h('div', { class: 'kpi-kisi auto kpi-sasaran-kisi' },
      kpi({ ik: 'info', label: 'Baseline 2024', val: fmtAngka(sn.baseline2024, 2) + '%', per: 'RPJMN (Bappenas)' }),
      kpi({ ik: 'tpt', label: 'TPT ' + lblTahunan(pT), val: fmt(vT), per: 'Realisasi resmi BPS' }),
      kpi({ ik: 'target', label: 'Sasaran 2025', val: rg(sn.target2025), per: 'Rentang Perpres No. 12/2025' }),
      kpi({ ik: 'target', oranye: true, label: 'Sasaran 2029', val: rg(sn.target2029), per: 'Rentang Perpres No. 12/2025' })));
    const g = h('div');
    host.append(h('section', { class: 'bagian' }, bagian(1, 'TPT Indonesia dan rentang sasaran', 'Tahunan (Agustus) 2015–2025 · pita = rentang sasaran RPJMN 2025 dan 2029.'), h('div', { class: 'card' }, g)));
    const tunda = [() => I.grafikGaris(g, { seri: [{ nama: 'Indonesia', warna: 'var(--accent)', data: (deret('tpt', 'tahunan', '00') || []).filter(d => d[0] >= '2015'), utama: true }], tinggi: 300, fmt, area: true,
      pita: [{ dari: '2025', sampai: '2025', lo: sn.target2025[0], hi: sn.target2025[1], label: 'Sasaran 2025', legenda: 'Rentang sasaran RPJMN' }, { dari: '2029', sampai: '2029', lo: sn.target2029[0], hi: sn.target2029[1], label: 'Sasaran 2029', legenda: 'Rentang sasaran RPJMN' }],
      periodeTambahan: ['2026', '2027', '2028', '2029'] })];
    // bullet chart per wilayah & provinsi, skala bersama
    const wil = D.sasaran.filter(x => x.level === 'wilayah');
    const provSas = Object.fromEntries(D.sasaran.filter(x => x.level === 'provinsi').map(x => [x.kode, x]));
    const semuaV = WIL.provinsi.map(p => nilai('tpt', 'tahunan', p.kode, pT)).filter(v => v != null)
      .concat(D.sasaran.flatMap(x => [...(x.target2025 || []), ...(x.target2029 || [])]));
    const maks = Math.ceil(Math.max(...semuaV) + 0.5), pos = v => Math.max(0, Math.min(100, v / maks * 100));
    const grid = h('div', { class: 'wil-kisi lebar' });
    const tbSasaran = h('div');
    const tombolCsvSasaran = h('button', {
      class: 'btn',
      type: 'button',
      onclick: () => {
        const rows = [];
        URUT_WIL.forEach(w => {
          const sw = wil.find(z => z.wilayah === w);
          WIL.provinsi.filter(p => p.wilayah === w).forEach(p => {
            const sp = provSas[p.kode];
            const vNow = nilai('tpt', 'tahunan', p.kode, pT);
            rows.push([
              p.kode,
              p.nama,
              w,
              vNow != null ? vNow : '',
              sp && sp.target2025 ? sp.target2025[0] : '',
              sp && sp.target2025 ? sp.target2025[1] : '',
              sp && sp.target2029 ? sp.target2029[0] : '',
              sp && sp.target2029 ? sp.target2029[1] : '',
              sw && sw.target2025 ? sw.target2025[0] : '',
              sw && sw.target2025 ? sw.target2025[1] : '',
              sw && sw.target2029 ? sw.target2029[0] : '',
              sw && sw.target2029 ? sw.target2029[1] : ''
            ]);
          });
        });
        I.unduhCsv('sasaran_rpjmn_provinsi_dan_wilayah.csv', [
          'kode_bps', 'provinsi', 'wilayah_rpjmn', `tpt_${pT}`,
          'target_prov_2025_min', 'target_prov_2025_max', 'target_prov_2029_min', 'target_prov_2029_max',
          'target_wil_2025_min', 'target_wil_2025_max', 'target_wil_2029_min', 'target_wil_2029_max'
        ], rows);
      }
    }, ikon('unduh'), 'Unduh CSV Target Provinsi & Wilayah');

    host.append(h('section', { class: 'bagian' }, bagian(2, 'Sasaran wilayah dan provinsi', `Baris teratas pada setiap kartu menampilkan rentang Target Wilayah (2025 & 2029) tanpa titik TPT, diikuti baris tiap provinsi dengan TPT ${lblTahunan(pT)} (titik) dan rentang Target Provinsi masing-masing (2025 & 2029). Skala 0–${maks}% sama untuk semua kartu.`),
      h('div', { class: 'bullet-leg' },
        h('span', {}, h('i', { class: 'lt' }), 'TPT Provinsi (' + lblTahunan(pT) + ')'),
        h('span', {}, h('i', { class: 'l25' }), 'Target 2025 (Wilayah / Provinsi)'),
        h('span', {}, h('i', { class: 'l29' }), 'Target 2029 (Wilayah / Provinsi)')
      ),
      grid,
      h('section', { class: 'bagian' }, bagian(3, 'Tabel rincian sasaran TPT 38 provinsi & 7 wilayah', 'Perbandingan lengkap realisasi TPT terkini dengan rentang sasaran RPJMN 2025 dan 2029 tingkat provinsi maupun wilayah. Klik baris untuk membuka profil provinsi.'),
        kartuAksi('Matriks Sasaran RPJMN 2025–2029 per Provinsi & Wilayah', 'Angka resmi Bappenas (RPJMN 2025–2029) & BPS (' + lblTahunan(pT) + ')', tombolCsvSasaran, tbSasaran)),
      h('div', { class: 'card jarak' }, h('ul', { class: 'catatan', style: 'margin:0' },
        h('li', { text: 'Baris pertama pada tiap kartu adalah bar chart Target Koridor Wilayah (2025 & 2029) tanpa titik TPT, sedangkan baris-baris di bawahnya menampilkan TPT dan Target masing-masing Provinsi.' }),
        h('li', { text: 'Arahkan kursor atau sentuh grafik batang untuk melihat rincian angka rentang sasaran 2025 dan 2029.' }),
        h('li', {}, 'Sumber sasaran: ', h('a', { href: D.sumberRpjmn.url, target: '_blank', rel: 'noopener', text: D.sumberRpjmn.label }), ' (Lampiran Target Capaian Provinsi & Wilayah RPJMN 2025–2029). Sumber TPT: BPS.')))));

    const barisTabelSas = [];
    URUT_WIL.forEach(w => {
      const x = wil.find(z => z.wilayah === w); if (!x) return;
      const b = h('div', { class: 'bullet' });

      // 1. Baris khusus Wilayah (Target 2025 & 2029 tanpa titik TPT saat ini)
      const trkWil = h('div', { class: 'trk trk-wil' },
        x.target2029 ? h('div', { class: 'pita29', style: `left:${pos(x.target2029[0])}%;width:${Math.max(0.8, pos(x.target2029[1]) - pos(x.target2029[0]))}%` }) : null,
        x.target2025 ? h('div', { class: 'pita25', style: `left:${pos(x.target2025[0])}%;width:${Math.max(0.8, pos(x.target2025[1]) - pos(x.target2025[0]))}%` }) : null
      );
      trkWil.addEventListener('pointermove', ev => I.tampilTip(ev, [
        I.tipNama('Target Wilayah ' + w),
        x.target2025 ? I.tipBaris(rg(x.target2025), 'Target Wilayah 2025', '#0f766e', true) : null,
        x.target2029 ? I.tipBaris(rg(x.target2029), 'Target Wilayah 2029', '#ea580c', true) : null
      ]));
      trkWil.addEventListener('pointerleave', I.sembunyiTip);
      b.append(
        h('div', { class: 'nm nm-wil', title: 'Target Wilayah ' + w, text: 'Wilayah ' + w }),
        trkWil,
        h('div', { class: 'v v-wil', text: '—', title: 'Tidak ada angka TPT agregat wilayah resmi BPS' })
      );
      b.append(h('div', { class: 'bullet-pemisah' }));

      // 2. Baris masing-masing Provinsi (murni Target Provinsi 2025 & 2029 + titik TPT Provinsi)
      WIL.provinsi.filter(p => p.wilayah === w).map(p => [p, nilai('tpt', 'tahunan', p.kode, pT)]).sort((a, c) => (c[1] || 0) - (a[1] || 0)).forEach(([p, v]) => {
        const sp = provSas[p.kode];
        const tProv25 = sp && sp.target2025 ? sp.target2025 : null;
        const tProv29 = sp && sp.target2029 ? sp.target2029 : null;
        const trk = h('div', { class: 'trk' },
          tProv29 ? h('div', { class: 'pita29', style: `left:${pos(tProv29[0])}%;width:${Math.max(0.8, pos(tProv29[1]) - pos(tProv29[0]))}%` }) : null,
          tProv25 ? h('div', { class: 'pita25', style: `left:${pos(tProv25[0])}%;width:${Math.max(0.8, pos(tProv25[1]) - pos(tProv25[0]))}%` }) : null,
          v != null ? h('div', { class: 'titik', style: `left:${pos(v)}%` }) : null);
        trk.addEventListener('pointermove', ev => I.tampilTip(ev, [
          I.tipNama(p.nama),
          I.tipBaris(fmt(v), 'TPT ' + lblTahunan(pT)),
          tProv25 ? I.tipBaris(rg(tProv25), 'Target Provinsi 2025', '#0f766e', true) : null,
          tProv29 ? I.tipBaris(rg(tProv29), 'Target Provinsi 2029', '#ea580c', true) : null
        ]));
        trk.addEventListener('pointerleave', I.sembunyiTip);
        b.append(
          h('div', { class: 'nm', title: p.nama, text: p.nama, onclick: () => { S.wil = p.kode; gantiHalaman('profil'); } }),
          trk,
          h('div', { class: 'v', text: fmt(v) })
        );

        const rBaris = [
          { teks: p.nama, sort: p.nama },
          { teks: w, sort: w },
          { teks: fmt(v), sort: v },
          { teks: rg(tProv25), sort: tProv25 ? tProv25[0] : null },
          { teks: rg(tProv29), sort: tProv29 ? tProv29[0] : null },
          { teks: rg(x.target2025), sort: x.target2025 ? x.target2025[0] : null },
          { teks: rg(x.target2029), sort: x.target2029 ? x.target2029[0] : null }
        ];
        rBaris.kode = p.kode;
        barisTabelSas.push(rBaris);
      });
      grid.append(h('div', { class: 'card wil-kartu' }, h('div', { class: 'card-head' }, h('div', {}, h('h3', { text: 'Wilayah ' + w }))),
        h('div', { class: 'rentang' },
          h('span', {}, h('span', { class: 'lencana biru', text: 'Target Wilayah 2025' }), ' ', h('b', { text: rg(x.target2025) })),
          h('span', {}, h('span', { class: 'lencana oranye', text: 'Target Wilayah 2029' }), ' ', h('b', { text: rg(x.target2029) }))
        ), b));
    });

    tunda.push(() => {
      I.tabel(tbSasaran, {
        kolom: [
          { label: 'Provinsi' },
          { label: 'Koridor Wilayah' },
          { label: 'TPT ' + pT, num: true },
          { label: 'Target Provinsi 2025', num: true },
          { label: 'Target Provinsi 2029', num: true },
          { label: 'Target Wilayah 2025', num: true },
          { label: 'Target Wilayah 2029', num: true }
        ],
        baris: barisTabelSas,
        maks: 480,
        onPilih: kk => { S.wil = kk; gantiHalaman('profil'); }
      });
    });
    requestAnimationFrame(() => tunda.forEach(f => f()));
  }

  // =====================================================================
  // METODOLOGI
  // =====================================================================
  function renderMetode() {
    const host = $('metode');
    const tautan = x => h('li', {}, x.url ? h('a', { href: x.url, target: '_blank', rel: 'noopener', text: x.label }) : x.label, x.peran ? h('span', { class: 'kecil', text: ' — ' + x.peran }) : null);
    const csvLapisan = l => () => {
      const rows = [];
      for (const f in l.frek) for (const lv in l.frek[f]) { const sr = l.frek[f][lv]; for (const k in sr.nilai) sr.periode.forEach((p, j) => { const v = sr.nilai[k][j]; if (v != null) rows.push([k, namaW(k), lv === 'kab' ? 'kab/kota' : k === '00' ? 'nasional' : 'provinsi', f, p, v, sr.asal && sr.asal[k] && sr.asal[k][j] !== '.' ? ASAL[sr.asal[k][j]] : '']); }); }
      I.unduhCsv(l.id + '_lengkap.csv', ['kode_bps', 'wilayah', 'tingkat', 'frekuensi', 'periode', 'nilai', 'sumber_titik'], rows);
    };
    const blok = (ik, judul, ...li) => h('div', { class: 'card blok-metode' }, h('h3', {}, ikon(ik), judul), h('ul', { class: 'catatan' }, li.map(t => h('li', { text: t }))));
    host.replaceChildren(h('div', { class: 'hero' }, h('div', { class: 'dalam' }, h('div', { class: 'alis' }, h('span', { class: 'titik' }), 'Metodologi & data'),
      h('h1', {}, 'Seluruh angka adalah ', h('em', { text: 'angka resmi' }), ' BPS, Kemnaker, dan Bappenas — ditampilkan apa adanya.'),
      h('p', { text: 'Seluruh indikator utama disajikan langsung dari publikasi resmi tanpa interpolasi. Perbandingan selisih poin persentase atau proporsi pada ringkasan naratif disediakan murni sebagai konteks bantu baca; data yang tidak diterbitkan dibiarkan kosong (arsiran di peta).' }))));
    host.append(h('div', { class: 'metode-kisi', style: 'margin-top:20px;position:relative;z-index:2' },
      blok('info', 'Prinsip', 'Hanya angka resmi; peringkat dan kelas warna peta hanya pengurutan/pengelompokan tampilan.', 'Kosong = tidak ada angka resmi; tidak diisi perkiraan atau interpolasi (garis grafik terputus).', 'Garis putus-putus menandai deret yang tidak sepenuhnya sebanding (patahan seri atau pergantian sumber).', 'Kelas warna peta tetap untuk semua periode.'),
      blok('jam', 'Frekuensi & periode', 'Tahunan = Sakernas Agustus periode 2015–2025 (metodologi konsisten Sakernas modern BPS).', 'Semesteran = Februari & Agustus sejak 2015.', 'Seluruh data telah diselaraskan pada rentang 10 tahun terakhir yang memiliki tingkat konfidensi dan kelengkapan tertinggi.'),
      blok('peta', 'TPT kab/kota', '2017–2025: tabel BPS pusat (514 kab/kota).', 'Sebelum 2017: tabel BPS provinsi untuk 16–18 provinsi; nama dipadankan ke kode BPS, kode lama Papua dipetakan ke kode setelah pemekaran.', 'Bila keduanya memuat tahun yang sama, dipakai tabel BPS pusat (tidak dirata-rata); ±460 titik tumpang tindih dicatat di data/_log_bangun.txt.'),
      blok('peta', 'Peta', 'Batas provinsi: CC BY 4.0 (denyherianto/indonesia-geojson-topojson-maps-with-38-provinces). Batas kab/kota: ardian28/GeoJson-Indonesia-38-Provinsi. Disederhanakan untuk tampilan.', `${WIL.tanpaPoligon.length} kota kecil tanpa poligon di peta sumber (${WIL.tanpaPoligon.join(', ')}); angkanya tetap ada di tabel, peringkat, dan profil.`),
      blok('target', 'Sasaran RPJMN 2025–2029', 'Target TPT Nasional, 7 Koridor Wilayah, dan 38 Provinsi mengacu pada Peraturan Presiden Nomor 12 Tahun 2025 tentang RPJMN Tahun 2025–2029.', 'Tautan dokumen resmi: https://peraturan.bpk.go.id/Details/314638/perpres-no-12-tahun-2025')));
    const rpjmnCard = host.querySelector('.metode-kisi .blok-metode:last-child li:last-child');
    if (rpjmnCard) {
      rpjmnCard.innerHTML = `Dokumen regulasi resmi: <a href="${D.sumberRpjmn.url}" target="_blank" rel="noopener">${D.sumberRpjmn.label}</a>.`;
    }
    host.append(h('section', { class: 'bagian' }, bagian(1, 'Lapisan peta', 'Definisi, catatan, sumber dengan tautan, dan unduhan CSV lengkap per lapisan.'),
      ...LAP.map(l => h('details', { class: 'lapisan-det' }, h('summary', {}, h('span', { style: 'display:flex;align-items:center;gap:10px' }, h('span', { class: 'lencana biru' }, ikon(IKON_LAP[l.id])), h('b', { text: l.nama })), h('span', { class: 'kecil', text: Object.keys(l.frek).map(f => FREK[f]).join(' · ') })),
        h('div', { class: 'isi-det' }, h('div', { style: 'display:flex;justify-content:space-between;gap:12px;flex-wrap:wrap' }, h('p', { class: 'kecil', style: 'color:var(--ink-2);margin:0;max-width:820px', text: l.uraian + ' Satuan: ' + satuanTeks(l) + '.' }), h('button', { class: 'btn', type: 'button', onclick: csvLapisan(l) }, ikon('unduh'), 'CSV lengkap')),
          h('ul', { class: 'catatan' }, l.catatan.map(c => h('li', { text: c }))),
          l.definisiBps ? h('details', {}, h('summary', { text: 'Definisi resmi BPS' }), h('p', { class: 'kecil', style: 'color:var(--ink-2)', text: l.definisiBps })) : null,
          l.catatanBps.length ? h('details', {}, h('summary', { text: 'Catatan resmi BPS' }), h('ul', { class: 'catatan' }, l.catatanBps.map(c => h('li', { text: c })))) : null,
          h('div', { class: 'bagian-jdl', text: 'Sumber & tautan unduh' }), h('ul', { class: 'sumber' }, l.sumber.map(tautan)))))));
    const kat = h('div', { class: 'card' });
    Object.values(R).forEach(r => {
      const tb = h('div', { class: 'hidden', style: 'grid-column:1/-1' }), f0 = Object.keys(r.frek)[0];
      kat.append(h('div', { class: 'katalog-baris' },
        h('div', {}, h('b', { text: r.judul }), h('div', { class: 'kecil', text: Object.entries(r.frek).map(([f, o]) => FREK[f] + ' ' + o.periode[0] + '–' + o.periode[o.periode.length - 1] + ' (' + o.seri.length + ' seri)').join(' · ') + ' · satuan: ' + (r.satuan === '%' ? 'persen' : r.satuan) }),
          (r.catatan || []).length ? h('ul', { class: 'catatan' }, r.catatan.map(c => h('li', { text: c }))) : null, h('ul', { class: 'sumber' }, r.sumber.map(tautan))),
        h('div', { style: 'display:flex;gap:6px;flex-wrap:wrap;justify-content:flex-end' },
          h('button', { class: 'btn', type: 'button', text: 'Tabel', onclick: () => { tb.classList.toggle('hidden'); if (!tb.firstChild) { const o = r.frek[f0]; I.tabel(tb, { kolom: [{ label: 'Seri' }].concat(o.periode.map(p => ({ label: lblPer(p), num: true }))), baris: o.seri.map(x => [{ teks: x.nama, sort: x.nama }].concat(x.nilai.map(v => ({ teks: v == null ? '—' : fmtAngka(v, r.desimal), sort: v })))), maks: 360 }); } } }),
          ...Object.keys(r.frek).map(f => h('button', { class: 'btn', type: 'button', onclick: () => { const o = r.frek[f]; I.unduhCsv(`${r.id}_${f}.csv`, ['seri', ...o.periode], o.seri.map(x => [x.nama, ...x.nilai])); } }, ikon('unduh'), FREK[f].toLowerCase()))), tb));
    });
    host.append(h('section', { class: 'bagian' }, bagian(2, 'Rincian nasional', 'Tabel BPS yang dipakai grafik Beranda, dengan tabel dan unduhan CSV.'), kat));
    host.append(h('section', { class: 'bagian' }, bagian(3, 'Rincian Kemnaker per provinsi', 'Kategori pendidikan berbeda antarperiode sesuai sumber.'),
      h('div', { class: 'card' }, (() => { const t = h('div'); I.tabel(t, { kolom: [{ label: 'Periode' }, { label: 'Kategori pendidikan' }, { label: 'Catatan sumber' }], baris: D.ketPeriode.map(x => [{ teks: lblPer(x.periode, true), sort: x.periode }, { teks: x.kategori || '—', sort: x.kategori }, { teks: x.catatan, sort: x.catatan }]), maks: 360 }); return t; })())));
  }

  // =====================================================================
  // TAB INSIGHT — Storytelling Naratif ala Apple HIG / Clean Admin
  // =====================================================================
  const GLOSS_INSIGHT = {
    tpt: { t: 'TPT (Tingkat Pengangguran Terbuka)', k: 1, d: 'Persentase jumlah penganggur terhadap jumlah seluruh angkatan kerja. Menurut konsep resmi BPS (Sakernas), penganggur terbuka mencakup penduduk usia kerja yang tidak bekerja dan: (1) sedang mencari pekerjaan, (2) sedang mempersiapkan usaha baru, (3) merasa tidak mungkin mendapat pekerjaan (hopeless), atau (4) sudah diterima bekerja/punya usaha tetapi belum mulai.' },
    angkatan: { t: 'Angkatan Kerja', k: 1, d: 'Penduduk usia kerja (15 tahun ke atas) yang aktif bekerja atau sedang menganggur mencari pekerjaan.' },
    tpak: { t: 'TPAK (Tingkat Partisipasi Angkatan Kerja)', k: 1, d: 'Persentase jumlah angkatan kerja terhadap seluruh penduduk usia kerja (15 tahun ke atas). Menunjukkan seberapa besar porsi penduduk produktif yang aktif dalam pasar tenaga kerja.' },
    neet: { t: 'NEET', k: 1, d: 'Not in Employment, Education, or Training — persentase pemuda usia 15–24 tahun yang sedang tidak bekerja, tidak menempuh pendidikan sekolah/kuliah, dan tidak sedang mengikuti pelatihan kerja.' },
    setengah: { t: 'Setengah Pengangguran', k: 1, d: 'Pekerja yang jam kerjanya kurang dari 35 jam per minggu dan masih mencari pekerjaan tambahan atau masih bersedia menerima pekerjaan lain.' },
    smk: { t: 'Paradoks SMK', k: 1, d: 'Kondisi di mana lulusan SMK yang disiapkan langsung siap kerja justru memiliki tingkat pengangguran tertinggi dibandingkan jenjang pendidikan lainnya karena ketidaksesuaian (mismatch) dengan kebutuhan industri.' },
    sakernas: { t: 'Sakernas', k: 1, d: 'Survei Angkatan Kerja Nasional oleh Badan Pusat Statistik (BPS), sumber data ketenagakerjaan resmi di Indonesia yang dilaksanakan secara berkala.' },
    rpjmn: { t: 'Sasaran RPJMN', k: 1, d: 'Rencana Pembangunan Jangka Menengah Nasional 2025–2029 yang menetapkan target batas atas TPT nasional dan koridor wilayah.' },
    gendergap: { t: 'Disparitas Gender Ketenagakerjaan', k: 1, d: 'Perbedaan tingkat pengangguran atau partisipasi kerja antara laki-laki dan perempuan di suatu wilayah, sering kali dipengaruhi oleh struktur industri lokal dan beban pengurusan rumah tangga.' }
  };

  const termI = (k, label) => `<span class="term" data-tip-key="${k}" tabindex="0" role="button" aria-label="Penjelasan istilah ${label || GLOSS_INSIGHT[k].t}">${label || GLOSS_INSIGHT[k].t}</span>`;

  let insightDibuat = false;
  let insightCharts = [];

  function insNiceTicks(min, max, n = 4) {
    if (min === max) max = min + 1;
    const raw = (max - min) / n, mag = Math.pow(10, Math.floor(Math.log10(raw))), nm = raw / mag;
    const step = (nm < 1.5 ? 1 : nm < 3 ? 2 : nm < 7 ? 5 : 10) * mag;
    const lo = Math.floor(min / step) * step, hi = Math.ceil(max / step) * step, t = [];
    for (let v = lo; v <= hi + step / 2; v += step) t.push(+v.toFixed(10));
    return t;
  }

  function insStoryChart(el, o) {
    if (!el) return;
    const W0 = Math.max(260, Math.round(el.clientWidth || 460)), H0 = o.h || 240, pad = { l: 44, r: 24, t: 20, b: 28 };
    const X = t => pad.l + (t - o.t0) / (o.t1 - o.t0) * (W0 - pad.l - pad.r);
    const tk = insNiceTicks(o.lo, o.hi, 4), lo = tk[0], hi = tk[tk.length - 1];
    const Y = v => pad.t + (hi - v) / (hi - lo) * (H0 - pad.t - pad.b);
    let g = '';
    tk.forEach(t => {
      g += `<line class="grd" x1="${pad.l}" x2="${W0 - pad.r}" y1="${Y(t).toFixed(1)}" y2="${Y(t).toFixed(1)}"${t === 0 ? ' style="stroke:var(--ink-2)"' : ''}/><text class="ax" x="${pad.l - 8}" y="${(Y(t) + 4).toFixed(1)}" text-anchor="end">${o.yf(t)}</text>`;
    });
    const xs = typeof o.xs === 'function' ? o.xs(W0) : (o.xs || 5);
    for (let y = Math.ceil(o.t0 / xs) * xs; y <= o.t1; y += xs) {
      g += `<text class="ax" x="${X(y).toFixed(1)}" y="${H0 - 8}" text-anchor="middle">${y}</text>`;
    }
    g += o.body({ X, Y, lo, W0, pad });
    (o.marks || []).forEach(m => {
      const x = X(m.t), y = Y(m.y);
      g += `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="4.5" fill="var(--surface, #ffffff)" stroke="var(--accent, #0f766e)" stroke-width="2.5"/><text class="mk" x="${(x + m.dx).toFixed(1)}" y="${(y + m.dy).toFixed(1)}" text-anchor="${m.anc}">${m.txt}</text>`;
    });
    el.innerHTML = `<svg width="${W0}" height="${H0}" viewBox="0 0 ${W0} ${H0}" role="img" aria-label="${o.label || 'Grafik'}">${g}</svg>`;
  }

  function renderInsight() {
    const host = $('insight');
    if (!host) return;

    if (S.infomode === 'milestone') {
      renderMilestone(host);
      return;
    }

    if (insightDibuat) {
      // Re-attach segmen jika host telah diubah oleh Milestone
      const bar = host.querySelector('.hero-lingkup-bar');
      if (bar && !bar.querySelector('.seg-lingkup-profil')) {
        const segInfo = h('div', { class: 'seg seg-lingkup-profil' });
        I.segmen(segInfo, [['insight', 'Insight'], ['milestone', 'Milestone']], S.infomode, modeBaru => {
          S.infomode = modeBaru;
          render();
        }, 'Pilihan Informasi');
        bar.replaceChildren(segInfo);
      }
      insightCharts.forEach(fn => fn());
      return;
    }

    renderInsightContent(host);
  }

  function renderMilestone(host) {
    insightDibuat = false;
    if (S.mskategori !== 'makro' && S.mskategori !== 'pemerintah') S.mskategori = 'makro';
    const isGov = S.mskategori === 'pemerintah';

    // Toggle Utama: Insight vs Milestone
    const segInfo = h('div', { class: 'seg seg-lingkup-profil' });
    I.segmen(segInfo, [['insight', 'Insight'], ['milestone', 'Milestone']], S.infomode, modeBaru => {
      S.infomode = modeBaru;
      render();
    }, 'Pilihan Informasi');

    // Sub-Toggle Milestone: Dinamika Makro & Global vs Langkah & Kebijakan Pemerintah
    const segKat = h('div', { class: 'seg seg-level-profil' });
    I.segmen(segKat, [['makro', 'Dinamika Makro & Global'], ['pemerintah', 'Langkah & Kebijakan Pemerintah']], S.mskategori, katBaru => {
      S.mskategori = katBaru;
      render();
    }, 'Kategori Milestone');

    // Data 1: Dinamika Makro & Global (tanpa Intervensi Pemerintah)
    const milestonesMakro = [
      {
        id: 'ms-makro-2015',
        tahun: '2015',
        tahunPer: '2015',
        tpt: '6,18%',
        delta: 'Awal Seri',
        status: 'waspada',
        badge: 'Guncangan Komoditas',
        judul: 'Akhir Boom Komoditas & Perlambatan Ekonomi Tiongkok',
        pemicuLabel: 'Kejadian Makro (Pemicu Naik)',
        kejadian: 'Penurunan harga komoditas global (batu bara dan CPO) serta perlambatan ekonomi Tiongkok menekan sektor pertambangan dan perkebunan di luar Jawa, memicu gelombang PHK di sektor primer.',
        tags: ['Harga Batu Bara & CPO', 'Perlambatan Tiongkok', 'Sektor Primer Luar Jawa'],
        warna: '#d97706',
        img: 'https://images.unsplash.com/photo-1578575437130-527eed3abbec?auto=format&fit=crop&w=400&q=80',
        imgAlt: 'Pelabuhan kargo ekspor dan komoditas batu bara/kontainer',
        svg: `<svg viewBox="0 0 120 90" fill="none" class="ms-illus-svg">
          <rect x="8" y="10" width="104" height="70" rx="10" fill="var(--surface-2)"/>
          <path d="M22 28 L46 52 L64 40 L94 64" stroke="#d97706" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round"/>
          <path d="M84 64 H94 V54" stroke="#d97706" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round"/>
          <rect x="22" y="56" width="12" height="14" rx="2" fill="#0f766e" opacity="0.8"/>
          <rect x="40" y="48" width="12" height="22" rx="2" fill="#0f766e" opacity="0.9"/>
          <rect x="58" y="38" width="12" height="32" rx="2" fill="#0f766e"/>
          <circle cx="22" cy="28" r="4" fill="#d97706"/>
        </svg>`
      },
      {
        id: 'ms-makro-2016',
        tahun: '2016 – 2017',
        tahunPer: '2017',
        tpt: '5,61% – 5,50%',
        delta: '-0,68 poin',
        status: 'positif',
        badge: 'Transformasi Digital',
        judul: 'Ekspansi Gig Economy & Pergeseran Ritel Digital',
        pemicuLabel: 'Kejadian Makro & Disrupsi Sektor',
        kejadian: 'Ledakan awal <i>ride-hailing</i> (Gojek, Grab) dan <i>e-commerce</i> yang menyerap jutaan tenaga kerja ke sektor informal/kemitraan. Di sisi lain, otomatisasi perbankan dan pergeseran ritel konvensional ke digital mulai mengurangi serapan tenaga kerja formal di perkotaan.',
        tags: ['Ledakan Ride-Hailing', 'E-Commerce', 'Otomatisasi Perbankan & Ritel'],
        warna: '#0f766e',
        img: 'https://images.unsplash.com/photo-1526304640581-d334cdbbf45e?auto=format&fit=crop&w=400&q=80',
        imgAlt: 'Pengiriman paket e-commerce dan aplikasi digital ride hailing',
        svg: `<svg viewBox="0 0 120 90" fill="none" class="ms-illus-svg">
          <rect x="8" y="10" width="104" height="70" rx="10" fill="var(--surface-2)"/>
          <rect x="42" y="18" width="36" height="54" rx="6" stroke="#0f766e" stroke-width="3" fill="var(--surface)"/>
          <circle cx="60" cy="64" r="2.5" fill="#0f766e"/>
          <path d="M50 34 H70 M50 42 H64" stroke="#2dd4bf" stroke-width="3" stroke-linecap="round"/>
          <circle cx="26" cy="45" r="8" fill="#0f766e" opacity="0.2"/>
          <circle cx="26" cy="45" r="4" fill="#0f766e"/>
          <circle cx="94" cy="35" r="8" fill="#0f766e" opacity="0.2"/>
          <circle cx="94" cy="35" r="4" fill="#0f766e"/>
          <path d="M34 45 H42 M78 38 L86 35" stroke="#0f766e" stroke-width="2" stroke-dasharray="2 2"/>
        </svg>`
      },
      {
        id: 'ms-makro-2018',
        tahun: '2018 – 2019',
        tahunPer: '2019',
        tpt: '5,34% – 5,23%',
        delta: 'Terendah Pra-Pandemi',
        status: 'positif',
        badge: 'Geopolitik Dagang',
        judul: 'Perang Dagang AS-Tiongkok & Titik Terendah Pra-Pandemi',
        pemicuLabel: 'Kejadian Makro Global',
        kejadian: 'Ketegangan perang dagang AS-Tiongkok mengganggu rantai pasok global dan menahan ekspansi manufaktur berorientasi ekspor. Namun, struktur pasar kerja domestik mampu bertahan sehingga TPT berhasil menyentuh titik terendah pra-pandemi pada Agustus 2019 (<b>5,23%</b>).',
        tags: ['Perang Dagang AS-Tiongkok', 'Disrupsi Rantai Pasok', 'Titik Terendah Pra-Pandemi'],
        warna: '#2563eb',
        img: 'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?auto=format&fit=crop&w=400&q=80',
        imgAlt: 'Peti kemas kargo logistik perdagangan internasional',
        svg: `<svg viewBox="0 0 120 90" fill="none" class="ms-illus-svg">
          <rect x="8" y="10" width="104" height="70" rx="10" fill="var(--surface-2)"/>
          <circle cx="45" cy="45" r="18" stroke="#2563eb" stroke-width="2.5" fill="#2563eb" fill-opacity="0.12"/>
          <circle cx="75" cy="45" r="18" stroke="#d97706" stroke-width="2.5" fill="#d97706" fill-opacity="0.12"/>
          <path d="M52 38 H68 M62 33 L68 38 L62 43" stroke="#2563eb" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/>
          <path d="M68 52 H52 M58 47 L52 52 L58 57" stroke="#d97706" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>`
      },
      {
        id: 'ms-makro-2020',
        tahun: '2020',
        tahunPer: '2020',
        tpt: '7,07%',
        delta: '+1,84 poin (Puncak)',
        status: 'kritis',
        badge: 'Lonjakan Ekstrem Pandemi',
        judul: 'Guncangan Pandemi COVID-19 & Puncak TPT Nasional',
        pemicuLabel: 'Kejadian Makro (Pemicu Lonjakan Ekstrem)',
        kejadian: 'Pembatasan Sosial Berskala Besar (PSBB) melumpuhkan sektor pariwisata, akomodasi, transportasi, dan manufaktur. Terjadi kontraksi ekonomi (<b>-2,07%</b>) yang memicu gelombang PHK massal dan merumahkan jutaan pekerja, melambungkan TPT ke <b>7,07%</b> (sekitar 9,77 juta orang).',
        tags: ['Pandemi COVID-19', 'PSBB Nasional', 'Kontraksi Ekonomi -2,07%'],
        warna: '#dc2626',
        img: 'https://images.unsplash.com/photo-1584483766114-2cea6facdf57?auto=format&fit=crop&w=400&q=80',
        imgAlt: 'Protokol darurat masker dan krisis masa pandemi',
        svg: `<svg viewBox="0 0 120 90" fill="none" class="ms-illus-svg">
          <rect x="8" y="10" width="104" height="70" rx="10" fill="rgba(220, 38, 38, 0.08)"/>
          <circle cx="60" cy="45" r="18" fill="#dc2626" opacity="0.18" stroke="#dc2626" stroke-width="2.5"/>
          <path d="M60 20 V27 M60 63 V70 M35 45 H42 M78 45 H85 M42 27 L47 32 M73 58 L78 63 M78 27 L73 32 M47 58 L42 63" stroke="#dc2626" stroke-width="2.5" stroke-linecap="round"/>
          <path d="M52 46 L58 52 L70 38" stroke="#dc2626" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>`
      },
      {
        id: 'ms-makro-2021',
        tahun: '2021',
        tahunPer: '2021',
        tpt: '6,49%',
        delta: '-0,58 poin',
        status: 'waspada',
        badge: 'Gelombang Kedua Pandemi',
        judul: 'Gelombang Varian Delta & Pembatasan Mobilitas Darurat',
        pemicuLabel: 'Kejadian Makro (Penahan Pemulihan)',
        kejadian: 'Munculnya varian Delta pada pertengahan 2021 memaksa penerapan <b>PPKM Darurat</b>, yang kembali menahan laju rekrutmen di sektor jasa, transportasi, dan perdagangan ritel.',
        tags: ['Varian Delta', 'PPKM Darurat', 'Penahanan Rekrutmen Ritel'],
        warna: '#ea580c',
        img: 'https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?auto=format&fit=crop&w=400&q=80',
        imgAlt: 'Transportasi publik dan pengetatan mobilitas',
        svg: `<svg viewBox="0 0 120 90" fill="none" class="ms-illus-svg">
          <rect x="8" y="10" width="104" height="70" rx="10" fill="var(--surface-2)"/>
          <path d="M22 52 H42 L50 28 L62 66 L72 42 L80 52 H98" stroke="#ea580c" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>
          <circle cx="50" cy="28" r="4" fill="#ea580c"/>
        </svg>`
      },
      {
        id: 'ms-makro-2022',
        tahun: '2022',
        tahunPer: '2022',
        tpt: '5,86%',
        delta: '-0,63 poin',
        status: 'positif',
        badge: 'Guncangan Suku Bunga & Geopolitik',
        judul: 'Tech Winter, Krisis Geopolitik Rusia-Ukraina & Pengetatan Global',
        pemicuLabel: 'Kejadian Makro Global',
        kejadian: 'Perang Rusia-Ukraina memicu inflasi energi dan pangan global. Pengetatan suku bunga The Fed memicu fenomena <i>Tech Winter</i> (efisiensi dan PHK besar-besaran di sektor startup teknologi nasional) serta penurunan pesanan ekspor tekstil dan alas kaki dari pasar Eropa/AS.',
        tags: ['Perang Rusia-Ukraina', 'Suku Bunga The Fed', 'Fenomena Tech Winter'],
        warna: '#0f766e',
        img: 'https://images.unsplash.com/photo-1504384308090-c894fdcc538d?auto=format&fit=crop&w=400&q=80',
        imgAlt: 'Kantor startup teknologi informasi masa pergeseran efisiensi',
        svg: `<svg viewBox="0 0 120 90" fill="none" class="ms-illus-svg">
          <rect x="8" y="10" width="104" height="70" rx="10" fill="var(--surface-2)"/>
          <circle cx="60" cy="45" r="22" stroke="#0f766e" stroke-width="2.5" fill="var(--surface)"/>
          <ellipse cx="60" cy="45" rx="10" ry="22" stroke="#0f766e" stroke-width="2"/>
          <line x1="38" y1="45" x2="82" y2="45" stroke="#0f766e" stroke-width="2"/>
          <circle cx="76" cy="30" r="6" fill="#d97706"/>
        </svg>`
      },
      {
        id: 'ms-makro-2023',
        tahun: '2023',
        tahunPer: '2023',
        tpt: '5,32%',
        delta: '-0,54 poin',
        status: 'positif',
        badge: 'Tekanan Ekspor Manufaktur',
        judul: 'Pelemahan Permintaan Global & Tekanan Industri Padat Karya',
        pemicuLabel: 'Kejadian Makro & Perdagangan',
        kejadian: 'Pelemahan permintaan global dan banjir barang impor murah menekan industri padat karya berorientasi ekspor—khususnya Tekstil dan Produk Tekstil (TPT) serta alas kaki di Jawa Barat dan Jawa Tengah—yang memicu gelombang penutupan pabrik.',
        tags: ['Pelemahan Permintaan Global', 'Banjir Impor Murah', 'Tekanan Industri Tekstil'],
        warna: '#0d9488',
        img: 'https://images.unsplash.com/photo-1587293852726-70cdb56c2866?auto=format&fit=crop&w=400&q=80',
        imgAlt: 'Pabrik manufaktur dan mesin tekstil industri garmen',
        svg: `<svg viewBox="0 0 120 90" fill="none" class="ms-illus-svg">
          <rect x="8" y="10" width="104" height="70" rx="10" fill="var(--surface-2)"/>
          <path d="M26 66 V40 L44 50 V40 L62 50 V30 H88 V66 Z" fill="#0d9488" opacity="0.16" stroke="#0d9488" stroke-width="2.5" stroke-linejoin="round"/>
          <path d="M36 26 L56 38 M50 38 H56 V32" stroke="#dc2626" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>`
      },
      {
        id: 'ms-makro-2024',
        tahun: '2024',
        tahunPer: '2024',
        tpt: '4,91%',
        delta: 'Di Bawah Pra-Pandemi',
        status: 'positif',
        badge: 'Dinamika Struktural & Demografi',
        judul: 'Deindustrialisasi Dini & Isu Pengangguran Muda / Gen-Z',
        pemicuLabel: 'Kejadian Makro & Struktural',
        kejadian: 'Walaupun TPT secara agregat turun di bawah level pra-pandemi (<b>4,91%</b> pada Agustus 2024), muncul fenomena struktural: proporsi pekerja informal tetap tinggi (sekitar 58–59%), maraknya PHK di manufaktur tekstil, dan sorotan tajam terhadap tingginya TPT usia muda (15–24 tahun) akibat <i>skill mismatch</i> serta syarat rekrutmen yang ketat.',
        tags: ['Pekerja Informal 58–59%', 'Pengangguran Muda / Gen-Z', 'Skill Mismatch'],
        warna: '#7c3aed',
        img: 'https://images.unsplash.com/photo-1521737604893-d14cc237f11d?auto=format&fit=crop&w=400&q=80',
        imgAlt: 'Pencari kerja usia muda, interview dan rekrutmen tenaga kerja',
        svg: `<svg viewBox="0 0 120 90" fill="none" class="ms-illus-svg">
          <rect x="8" y="10" width="104" height="70" rx="10" fill="var(--surface-2)"/>
          <circle cx="46" cy="38" r="10" fill="#7c3aed" opacity="0.2" stroke="#7c3aed" stroke-width="2.5"/>
          <path d="M30 64 C30 53 62 53 62 64" stroke="#7c3aed" stroke-width="2.5" stroke-linecap="round"/>
          <circle cx="76" cy="34" r="8" fill="#0f766e" opacity="0.2" stroke="#0f766e" stroke-width="2.5"/>
          <path d="M64 58 C64 49 88 49 88 58" stroke="#0f766e" stroke-width="2.5" stroke-linecap="round"/>
        </svg>`
      },
      {
        id: 'ms-makro-2025',
        tahun: '2025 – 2026',
        tahunPer: '2025',
        tpt: '4,85% – 4,68%',
        delta: 'Rekor Terendah Dekade',
        status: 'unggulan',
        badge: 'Disrupsi Teknologi AI & Tarif Global',
        judul: 'Disrupsi Otomasi/AI & Dinamika Tarif Perdagangan Global',
        pemicuLabel: 'Kejadian Makro & Teknologi',
        kejadian: 'TPT terus melandai ke <b>4,85%</b> (Agustus 2025), <b>4,74%</b> (November 2025), hingga <b>4,68%</b> (Februari 2026). Namun, pasar kerja menghadapi tantangan adopsi kecerdasan buatan (AI) dan otomasi yang mengurangi lowongan <i>entry-level</i> administratif (memicu tingginya pengangguran lulusan sarjana di bidang manajemen, ekonomi, dan hukum) serta dinamika tarif perdagangan global.',
        tags: ['Disrupsi Kecerdasan Buatan (AI)', 'Otomasi Entry-Level', 'Dinamika Tarif Global'],
        warna: '#059669',
        img: 'https://images.unsplash.com/photo-1558494949-ef010cbdcc31?auto=format&fit=crop&w=400&q=80',
        imgAlt: 'Pusat data digital dan otomasi kecerdasan buatan',
        svg: `<svg viewBox="0 0 120 90" fill="none" class="ms-illus-svg">
          <rect x="8" y="10" width="104" height="70" rx="10" fill="rgba(5, 150, 105, 0.08)"/>
          <rect x="42" y="27" width="36" height="36" rx="8" fill="#059669" opacity="0.18" stroke="#059669" stroke-width="2.5"/>
          <circle cx="60" cy="45" r="7" fill="#059669"/>
          <path d="M50 20 V27 M70 20 V27 M50 63 V70 M70 63 V70 M35 35 H42 M35 55 H42 M78 35 H85 M78 55 H85" stroke="#059669" stroke-width="2.5" stroke-linecap="round"/>
        </svg>`
      }
    ];

    // Data 2: Langkah & Kebijakan Pemerintah (dari milestone Pemerintah.md)
    const milestonesGov = [
      {
        id: 'ms-gov-2015',
        tahun: '2015',
        tahunPer: '2015',
        tpt: '6,18%',
        delta: 'Deregulasi & Desa',
        status: 'waspada',
        badge: 'Paket Ekonomi & Dana Desa',
        judul: 'Peluncuran Dana Desa & Paket Kebijakan Ekonomi Jilid I–VIII',
        fokus: 'Gelombang PHK di sektor tambang dan perkebunan luar Jawa akibat jatuhnya harga batu bara dan CPO global.',
        langkah: [
          'Memulai penyaluran <b>Dana Desa</b> dengan pendekatan swakelola untuk membangun infrastruktur dasar desa.',
          'Meluncurkan <b>Paket Kebijakan Ekonomi Jilid I–VIII</b> (deregulasi ratusan aturan investasi, insentif pajak industri padat karya, dan penetapan formula upah minimum baru melalui <b>PP No. 78 Tahun 2015</b>).'
        ],
        mekanisme: 'Menahan arus urbanisasi pencari kerja desa ke kota dengan menciptakan pekerjaan konstruksi skala mikro di perdesaan, sembari memberikan kepastian biaya upah bagi pabrik manufaktur.',
        tags: ['Dana Desa Swakelola', 'Paket Ekonomi I–VIII', 'PP No. 78/2015'],
        warna: '#d97706',
        img: 'https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?auto=format&fit=crop&w=400&q=80',
        imgAlt: 'Pemberdayaan dan pembangunan perdesaan swakelola',
        svg: `<svg viewBox="0 0 120 90" fill="none" class="ms-illus-svg">
          <rect x="8" y="10" width="104" height="70" rx="10" fill="var(--surface-2)"/>
          <path d="M30 52 L60 26 L90 52" stroke="#d97706" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>
          <rect x="38" y="48" width="44" height="22" rx="3" fill="#0f766e" opacity="0.2" stroke="#0f766e" stroke-width="2.5"/>
          <rect x="54" y="56" width="12" height="14" fill="#0f766e"/>
        </svg>`
      },
      {
        id: 'ms-gov-2016',
        tahun: '2016',
        tahunPer: '2016',
        tpt: '5,61%',
        delta: '-0,57 poin',
        status: 'positif',
        badge: 'Infrastruktur & UMKM',
        judul: 'Akselerasi Proyek Strategis Nasional (PSN) & Penurunan Bunga KUR',
        fokus: 'Perlambatan serapan tenaga kerja formal dan tingginya biaya modal bagi usaha mikro-kecil.',
        langkah: [
          'Percepatan eksekusi <b>Proyek Strategis Nasional (PSN)</b> (jalan tol, bendungan, pelabuhan, dan pembangkit listrik).',
          'Pemangkasan suku bunga <b>Kredit Usaha Rakyat (KUR)</b> secara drastis dari 12% menjadi 9% per tahun melalui subsidi bunga APBN.'
        ],
        mekanisme: 'Efek pengganda (<i>multiplier effect</i>) proyek konstruksi menyerap ratusan ribu pekerja bangunan dan logistik, sementara KUR murah memacu penciptaan lapangan kerja mandiri (<i>self-employment</i>) di sektor UMKM.',
        tags: ['Proyek Strategis Nasional (PSN)', 'Bunga KUR 9%', 'Multiplier Konstruksi'],
        warna: '#0f766e',
        img: 'https://images.unsplash.com/photo-1503387762-592deb58ef4e?auto=format&fit=crop&w=400&q=80',
        imgAlt: 'Pembangunan proyek strategis nasional dan infrastruktur sipil',
        svg: `<svg viewBox="0 0 120 90" fill="none" class="ms-illus-svg">
          <rect x="8" y="10" width="104" height="70" rx="10" fill="var(--surface-2)"/>
          <path d="M22 64 H98 M34 64 V36 M86 64 V36" stroke="#0f766e" stroke-width="3" stroke-linecap="round"/>
          <path d="M34 36 Q60 56 86 36" stroke="#2dd4bf" stroke-width="2.5" fill="none"/>
          <circle cx="60" cy="30" r="8" fill="#d97706" opacity="0.2" stroke="#d97706" stroke-width="2"/>
        </svg>`
      },
      {
        id: 'ms-gov-2017',
        tahun: '2017',
        tahunPer: '2017',
        tpt: '5,50%',
        delta: '-0,11 poin',
        status: 'positif',
        badge: 'Padat Karya Perdesaan',
        judul: 'Masifikasi Program Padat Karya Tunai (Cash for Work)',
        fokus: 'Tingginya angka setengah pengangguran di kantong-kantong kemiskinan perdesaan dan tergerusnya ritel konvensional perkotaan.',
        langkah: [
          'Menginstruksikan kementerian teknis (Kementerian PUPR, Kemenhub, Kementan, dan Kemendes) menjalankan skema <b>Padat Karya Tunai (PKT)</b>.',
          'Mewajibkan minimal <b>30% dari Dana Desa</b> digunakan khusus untuk membayar upah pekerja lokal secara harian/mingguan.'
        ],
        mekanisme: 'Mengganti penggunaan alat berat/kontraktor pada proyek pemeliharaan irigasi, jalan lingkungan, dan jembatan desa dengan tenaga manusia lokal yang sedang menganggur.',
        tags: ['Padat Karya Tunai (PKT)', 'Cash for Work', '30% Upah Dana Desa'],
        warna: '#0d9488',
        img: 'https://images.unsplash.com/photo-1579621970563-ebec7560ff3e?auto=format&fit=crop&w=400&q=80',
        imgAlt: 'Penyaluran program cash for work dan permodalan kerja mikro',
        svg: `<svg viewBox="0 0 120 90" fill="none" class="ms-illus-svg">
          <rect x="8" y="10" width="104" height="70" rx="10" fill="var(--surface-2)"/>
          <rect x="30" y="32" width="60" height="32" rx="6" fill="#0d9488" opacity="0.18" stroke="#0d9488" stroke-width="2.5"/>
          <circle cx="60" cy="48" r="8" stroke="#0d9488" stroke-width="2.5"/>
          <path d="M38 40 H44 M76 56 H82" stroke="#0d9488" stroke-width="2.5" stroke-linecap="round"/>
        </svg>`
      },
      {
        id: 'ms-gov-2018',
        tahun: '2018',
        tahunPer: '2018',
        tpt: '5,34%',
        delta: '-0,16 poin',
        status: 'positif',
        badge: 'Reformasi Perizinan & Industri 4.0',
        judul: 'Digitalisasi Perizinan OSS & Peta Jalan Making Indonesia 4.0',
        fokus: 'Ketidakpastian investasi akibat Perang Dagang AS-Tiongkok dan lambatnya birokrasi pembukaan usaha baru di daerah.',
        langkah: [
          'Peluncuran sistem perizinan berusaha terintegrasi secara elektronik atau <b>Online Single Submission (OSS)</b> untuk memangkas waktu pendirian perusahaan/pabrik.',
          'Peluncuran peta jalan <b>Making Indonesia 4.0</b> yang memfokuskan insentif pada 5 sektor manufaktur utama penyerap tenaga kerja (makanan-minuman, tekstil, otomotif, kimia, dan elektronik).'
        ],
        mekanisme: 'Mempercepat realisasi investasi pabrik baru (PMA/PMDN) sehingga pembukaan lowongan kerja formal tetap tumbuh di tengah gejolak perdagangan global.',
        tags: ['Sistem Perizinan OSS', 'Making Indonesia 4.0', '5 Sektor Manufaktur Utama'],
        warna: '#2563eb',
        img: 'https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?auto=format&fit=crop&w=400&q=80',
        imgAlt: 'Digitalisasi perizinan online single submission dan perencanaan industri',
        svg: `<svg viewBox="0 0 120 90" fill="none" class="ms-illus-svg">
          <rect x="8" y="10" width="104" height="70" rx="10" fill="var(--surface-2)"/>
          <rect x="32" y="24" width="56" height="38" rx="5" stroke="#2563eb" stroke-width="2.5" fill="var(--surface)"/>
          <path d="M46 43 L55 51 L74 34" stroke="#059669" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>
          <path d="M24 66 H96" stroke="#2563eb" stroke-width="3" stroke-linecap="round"/>
        </svg>`
      },
      {
        id: 'ms-gov-2019',
        tahun: '2019',
        tahunPer: '2019',
        tpt: '5,23%',
        delta: 'Terendah Pra-Pandemi',
        status: 'positif',
        badge: 'Insentif Fiskal Vokasi',
        judul: 'Insentif Super Deduction Tax 200% & Fokus Vokasi SDM',
        fokus: '<i>Skill mismatch</i> (ketidaksesuaian keahlian) yang membuat lulusan SMK dan SMA menjadi penyumbang angka TPT tertinggi meskipun ekonomi tumbuh stabil.',
        langkah: [
          'Penerbitan <b>PP No. 45 Tahun 2019</b> tentang <i>Super Deduction Tax</i> (pengurangan penghasilan bruto pajak hingga 200% bagi perusahaan yang menyelenggarakan praktik kerja, pemagangan, atau pembelajaran vokasi).',
          'Revitalisasi <b>Balai Latihan Kerja (BLK)</b> dengan program <i>3-in-1</i> (pelatihan, sertifikasi, dan penempatan kerja langsung di industri).'
        ],
        mekanisme: 'Mendorong perusahaan swasta terlibat langsung melatih calon pekerja sesuai standar mesin/industri mereka, sehingga lulusan vokasi langsung terserap (<i>link and match</i>).',
        tags: ['Super Deduction Tax 200%', 'PP No. 45/2019', 'BLK 3-in-1 Link & Match'],
        warna: '#4f46e5',
        img: 'https://images.unsplash.com/photo-1524178232363-1fb2b075b655?auto=format&fit=crop&w=400&q=80',
        imgAlt: 'Pelatihan vokasi terstandarisasi dan pendidikan keahlian industri',
        svg: `<svg viewBox="0 0 120 90" fill="none" class="ms-illus-svg">
          <rect x="8" y="10" width="104" height="70" rx="10" fill="var(--surface-2)"/>
          <path d="M60 22 L88 34 L60 46 L32 34 Z" fill="#4f46e5" opacity="0.2" stroke="#4f46e5" stroke-width="2.5" stroke-linejoin="round"/>
          <path d="M42 40 V56 C42 62 78 62 78 56 V40" stroke="#4f46e5" stroke-width="2.5" stroke-linecap="round"/>
          <path d="M88 34 V52" stroke="#d97706" stroke-width="2.5" stroke-linecap="round"/>
          <circle cx="88" cy="54" r="3" fill="#d97706"/>
        </svg>`
      },
      {
        id: 'ms-gov-2020',
        tahun: '2020',
        tahunPer: '2020',
        tpt: '7,07%',
        delta: 'Respons Darurat Krisis',
        status: 'kritis',
        badge: 'Bantalan Sosial & Reformasi',
        judul: 'Program PEN, Kartu Prakerja, BSU & Pengesahan UU Cipta Kerja',
        fokus: 'Guncangan ekstrem pandemi COVID-19 dan pembatasan mobilitas (PSBB) yang memicu gelombang PHK serta merumahkan jutaan pekerja formal dan informal.',
        langkah: [
          'Peluncuran <b>Pemulihan Ekonomi Nasional (PEN)</b> yang mencakup <b>Bantuan Subsidi Upah (BSU)</b> bagi pekerja bergaji di bawah Rp5 juta dan restrukturisasi kredit perbankan agar perusahaan tidak bangkrut.',
          'Peluncuran <b>Kartu Prakerja</b> (skema semi-bansos) yang menggabungkan insentif tunai dan pelatihan daring bagi korban PHK.',
          'Pengesahan <b>UU No. 11 Tahun 2020 tentang Cipta Kerja</b> untuk mereformasi aturan ketenagakerjaan dan kemudahan berusaha.'
        ],
        mekanisme: 'BSU dan relaksasi kredit menahan laju PHK lebih dalam di sektor formal, sementara Prakerja dan Bantuan Produktif Usaha Mikro (BPUM) menopang pekerja yang beralih ke sektor informal selama krisis.',
        tags: ['Program PEN', 'Subsidi Upah (BSU)', 'Kartu Prakerja', 'UU Cipta Kerja'],
        warna: '#dc2626',
        img: 'https://images.unsplash.com/photo-1584483766114-2cea6facdf57?auto=format&fit=crop&w=400&q=80',
        imgAlt: 'Bantuan darurat ekonomi dan perlindungan sosial masa krisis',
        svg: `<svg viewBox="0 0 120 90" fill="none" class="ms-illus-svg">
          <rect x="8" y="10" width="104" height="70" rx="10" fill="rgba(220, 38, 38, 0.08)"/>
          <path d="M36 44 C36 30 84 30 84 44 Z" fill="#dc2626" opacity="0.2" stroke="#dc2626" stroke-width="2.5"/>
          <path d="M60 44 V64 C60 68 54 68 54 64" stroke="#dc2626" stroke-width="2.5" stroke-linecap="round"/>
        </svg>`
      },
      {
        id: 'ms-gov-2021',
        tahun: '2021',
        tahunPer: '2021',
        tpt: '6,49%',
        delta: '-0,58 poin',
        status: 'waspada',
        badge: 'Proteksi Korban PHK',
        judul: 'Implementasi Jaminan Kehilangan Pekerjaan (JKP) & KUR Super Mikro',
        fokus: 'Tertahannya pemulihan lapangan kerja akibat gelombang varian Delta (PPKM Darurat) dan kerentanan pekerja pasca-PHK.',
        langkah: [
          'Penerbitan <b>PP No. 35, 36, dan 37 Tahun 2021</b> sebagai aturan turunan UU Cipta Kerja, yang resmi membentuk program <b>Jaminan Kehilangan Pekerjaan (JKP)</b>.',
          'Peluncuran <b>KUR Super Mikro</b> dengan plafon hingga Rp10 juta dan bunga sangat rendah (3% per tahun) khusus bagi pekerja yang terkena PHK dan ibu rumah tangga yang membuka usaha.'
        ],
        mekanisme: 'JKP memberikan jaring pengaman berupa uang tunai 6 bulan, konseling pasar kerja, dan pelatihan <i>reskilling</i> agar korban PHK cepat kembali bekerja, sementara KUR Super Mikro menyerap korban PHK menjadi wirausaha mikro.',
        tags: ['Jaminan Kehilangan Pekerjaan (JKP)', 'PP No. 37/2021', 'KUR Super Mikro 3%'],
        warna: '#ea580c',
        img: 'https://images.unsplash.com/photo-1582213782179-e0d53f98f2ca?auto=format&fit=crop&w=400&q=80',
        imgAlt: 'Jaminan perlindungan tenaga kerja dan advokasi sosial terpadu',
        svg: `<svg viewBox="0 0 120 90" fill="none" class="ms-illus-svg">
          <rect x="8" y="10" width="104" height="70" rx="10" fill="var(--surface-2)"/>
          <path d="M60 20 L84 30 V46 C84 60 73 70 60 74 C47 70 36 60 36 46 V30 L60 20 Z" fill="#ea580c" opacity="0.16" stroke="#ea580c" stroke-width="2.5" stroke-linejoin="round"/>
          <path d="M52 47 L58 53 L70 40" stroke="#0f766e" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>`
      },
      {
        id: 'ms-gov-2022',
        tahun: '2022',
        tahunPer: '2022',
        tpt: '5,86%',
        delta: '-0,63 poin',
        status: 'positif',
        badge: 'Hilirisasi & Produk Dalam Negeri',
        judul: 'Hilirisasi Mineral, Perpres Revitalisasi Vokasi & Afirmasi Produk Lokal',
        fokus: 'Fenomena <i>Tech Winter</i> (PHK di sektor startup digital) serta inflasi global akibat perang Rusia-Ukraina yang menekan industri manufaktur berorientasi ekspor.',
        langkah: [
          'Akselerasi kebijakan <b>Hilirisasi Industri Mineral</b> (pelarangan ekspor bijih nikel dan pembangunan kawasan industri smelter di Sulawesi dan Maluku).',
          'Penerbitan <b>Perpres No. 68 Tahun 2022</b> tentang Revitalisasi Pendidikan dan Pelatihan Vokasi (penguatan SMK Pusat Keunggulan).',
          'Kewajiban instansi pemerintah dan BUMN mengalokasikan minimal <b>40% belanja pengadaan untuk Produk Dalam Negeri (PDN)</b> dan UMKM.'
        ],
        mekanisme: 'Kawasan industri hilirisasi menciptakan pusat penyerapan tenaga kerja manufaktur baru di luar Pulau Jawa, sedangkan belanja wajib produk lokal menjaga keberlangsungan pabrik dan UMKM domestik.',
        tags: ['Smelter Hilirisasi Nikel', 'Perpres No. 68/2022 Vokasi', '40% Belanja PDN & UMKM'],
        warna: '#0f766e',
        img: 'https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?auto=format&fit=crop&w=400&q=80',
        imgAlt: 'Industri smelter pengolahan mineral dan manufaktur berat',
        svg: `<svg viewBox="0 0 120 90" fill="none" class="ms-illus-svg">
          <rect x="8" y="10" width="104" height="70" rx="10" fill="var(--surface-2)"/>
          <path d="M28 66 V38 L46 48 V38 L64 48 V26 H86 V66 Z" fill="#0f766e" opacity="0.18" stroke="#0f766e" stroke-width="2.5" stroke-linejoin="round"/>
          <circle cx="75" cy="46" r="7" stroke="#d97706" stroke-width="2.5"/>
          <path d="M75 36 V39 M75 53 V56 M65 46 H68 M82 46 H85" stroke="#d97706" stroke-width="2" stroke-linecap="round"/>
        </svg>`
      },
      {
        id: 'ms-gov-2023',
        tahun: '2023',
        tahunPer: '2023',
        tpt: '5,32%',
        delta: '-0,54 poin',
        status: 'positif',
        badge: 'Upskilling & Insentif Konstruksi',
        judul: 'Kartu Prakerja Skema Normal, Ekosistem SIAPkerja & PPN DTP Properti',
        fokus: 'Pelemahan ekspor pabrik padat karya (tekstil dan alas kaki) di Pulau Jawa serta kebutuhan peningkatan keahlian pasca-pencabutan status pandemi (PPKM).',
        langkah: [
          'Mengubah <b>Kartu Prakerja ke Skema Normal</b> (fokus murni pada peningkatan kompetensi/<i>upskilling</i> berstandar industri dengan bantuan biaya pelatihan Rp3,5 juta per peserta).',
          'Integrasi layanan ketenagakerjaan digital melalui portal <b>SIAPkerja (Kemnaker)</b> yang menghubungkan pelatihan, sertifikasi, dan bursa kerja (Karirhub).',
          'Pemberian insentif <b>PPN Ditanggung Pemerintah (DTP) 100%</b> untuk pembelian rumah guna memacu sektor konstruksi dan 170+ industri turunannya.'
        ],
        mekanisme: 'Menghidupkan kembali serapan tenaga kerja di sektor pariwisata, perhotelan, dan konstruksi properti, sekaligus meningkatkan daya saing pencari kerja muda di bidang digital dan teknis.',
        tags: ['Prakerja Skema Normal', 'Portal SIAPkerja', 'PPN DTP 100% Properti'],
        warna: '#0d9488',
        img: 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=400&q=80',
        imgAlt: 'Pelatihan upskilling platform digital dan sertifikasi keahlian',
        svg: `<svg viewBox="0 0 120 90" fill="none" class="ms-illus-svg">
          <rect x="8" y="10" width="104" height="70" rx="10" fill="var(--surface-2)"/>
          <path d="M26 58 C38 58 44 34 60 34 C76 34 82 26 96 26" stroke="#0f766e" stroke-width="3.5" stroke-linecap="round"/>
          <circle cx="60" cy="34" r="5" fill="#0f766e"/>
          <circle cx="96" cy="26" r="5" fill="#2dd4bf" stroke="#0f766e" stroke-width="2"/>
          <rect x="30" y="54" width="60" height="12" rx="6" fill="#0f766e" opacity="0.15"/>
        </svg>`
      },
      {
        id: 'ms-gov-2024',
        tahun: '2024',
        tahunPer: '2024',
        tpt: '4,91%',
        delta: '-0,41 poin',
        status: 'positif',
        badge: 'Kawasan Industri & Tata Niaga',
        judul: 'Proteksi Industri Padat Karya & Operasionalisasi Kawasan Industri Baru',
        fokus: 'Tekanan berat pada industri Tekstil dan Produk Tekstil (TPT) akibat banjir barang impor murah serta sorotan tingginya pengangguran usia muda (15–24 tahun / Gen-Z).',
        langkah: [
          'Pengetatan pengawasan barang impor (pembentukan <b>Satgas Impor Ilegal</b> dan penyesuaian regulasi impor/Permendag) untuk melindungi pabrik garmen dan alas kaki domestik dari penutupan.',
          'Perluasan operasional <b>Kawasan Industri Terpadu Batang (KITB)</b> dan <b>Kawasan Ekonomi Khusus (KEK) Kendal</b> di Jawa Tengah untuk menampung relokasi pabrik asing.',
          'Perluasan cakupan perlindungan <b>BPJS Ketenagakerjaan</b> bagi pekerja rentan dan pekerja kemitraan/<i>gig economy</i>.'
        ],
        mekanisme: 'Mencegah pemutusan hubungan kerja lebih lanjut di sektor manufaktur Jawa Barat dan Jawa Tengah, sekaligus membuka kantong penyerapan tenaga kerja pabrik baru di koridor utara Jawa.',
        tags: ['Satgas Impor Ilegal', 'KIT Batang & KEK Kendal', 'BPJS Pekerja Rentan'],
        warna: '#7c3aed',
        img: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=400&q=80',
        imgAlt: 'Kawasan industri modern dan manufaktur koridor ekonomi',
        svg: `<svg viewBox="0 0 120 90" fill="none" class="ms-illus-svg">
          <rect x="8" y="10" width="104" height="70" rx="10" fill="var(--surface-2)"/>
          <rect x="28" y="34" width="28" height="32" rx="3" fill="#7c3aed" opacity="0.18" stroke="#7c3aed" stroke-width="2.5"/>
          <rect x="64" y="24" width="28" height="42" rx="3" fill="#0f766e" opacity="0.18" stroke="#0f766e" stroke-width="2.5"/>
          <path d="M36 44 H48 M36 52 H48 M72 34 H84 M72 42 H84 M72 50 H84" stroke="var(--ink-2)" stroke-width="2" stroke-linecap="round"/>
        </svg>`
      },
      {
        id: 'ms-gov-2025',
        tahun: '2025 – 2026',
        tahunPer: '2025',
        tpt: '4,85% – 4,68%',
        delta: 'Stimulus & Ekonomi Lokal',
        status: 'unggulan',
        badge: 'Program Prioritas & Insentif Padat Karya',
        judul: 'Program Makan Bergizi Gratis (MBG), Stimulus PPh 21 DTP & Vokasi AI',
        fokus: 'Disrupsi otomasi dan kecerdasan buatan (AI) yang menyempitkan lowongan kerja administratif (<i>entry-level</i> sarjana), serta tantangan menjaga daya beli pekerja manufaktur.',
        langkah: [
          'Pelaksanaan <b>Program Makan Bergizi Gratis (MBG)</b> secara bertahap di seluruh daerah melalui pembangunan ribuan Satuan Pelayanan Pemenuhan Gizi (dapur umum).',
          'Peluncuran <b>Paket Stimulus Ekonomi Penyerapan Tenaga Kerja</b>, termasuk insentif <b>PPh Pasal 21 Ditanggung Pemerintah (DTP)</b> bagi pekerja di sektor industri padat karya (tekstil, pakaian jadi, kulit/alas kaki, dan furnitur) serta subsidi iuran JKP.',
          'Penyesuaian program pemagangan industri dan <b>pelatihan vokasi digital/AI</b> serta penguatan ekosistem koperasi dan hilirisasi pangan.'
        ],
        mekanisme: 'Ekosistem dapur MBG menyerap ratusan ribu tenaga kerja operasional lokal, petani, dan UMKM katering di daerah, sementara insentif pajak PPh 21 DTP meringankan beban arus kas industri padat karya agar tetap mempertahankan pekerjanya.',
        tags: ['Makan Bergizi Gratis (MBG)', 'Insentif PPh 21 DTP', 'Vokasi Digital & AI'],
        warna: '#059669',
        img: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=400&q=80',
        imgAlt: 'Pelayanan dapur nutrisi Makan Bergizi Gratis dan katering lokal',
        svg: `<svg viewBox="0 0 120 90" fill="none" class="ms-illus-svg">
          <rect x="8" y="10" width="104" height="70" rx="10" fill="rgba(5, 150, 105, 0.08)"/>
          <circle cx="46" cy="46" r="14" fill="#059669" opacity="0.18" stroke="#059669" stroke-width="2.5"/>
          <path d="M40 46 L44 50 L52 42" stroke="#059669" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>
          <rect x="68" y="32" width="24" height="28" rx="4" stroke="#0f766e" stroke-width="2.5" fill="var(--surface)"/>
          <path d="M74 42 H86 M74 48 H82" stroke="#0f766e" stroke-width="2" stroke-linecap="round"/>
        </svg>`
      }
    ];

    const dataAktif = isGov ? milestonesGov : milestonesMakro;

    host.innerHTML = `
      <div class="hero">
        <div class="hero-lingkup-bar" style="flex-direction:column;gap:12px">
          <div id="ms-bar-utama"></div>
          <div id="ms-bar-sub"></div>
        </div>
        <div class="dalam hero-kisi">
          <div>
            <div class="alis"><span class="titik"></span>${isGov ? 'Rekam Jejak Intervensi &amp; Regulasi · 2015–2026' : 'Dinamika Eksternal &amp; Struktural · 2015–2026'}</div>
            <h1>${isGov ? 'Linimasa Langkah &amp; Kebijakan Pemerintah <em>Menekan Pengangguran</em>.' : 'Linimasa Dinamika Makro &amp; <em>Kejadian Global</em> Ketenagakerjaan.'}</h1>
            <p>${isGov
              ? 'Menelusuri bauran kebijakan fiskal, program padat karya, reformasi regulasi, hingga jaring pengaman sosial dan hilirisasi yang dijalankan pemerintah dalam menurunkan TPT dari 6,18% (2015) ke 4,68% (2026).'
              : 'Menelusuri guncangan eksternal, pergeseran lanskap teknologi digital, gejolak geopolitik, pandemi COVID-19, hingga dinamika demografi yang membentuk kurva pengangguran Indonesia sejak 2015.'}</p>
          </div>
          <div class="hero-angka">
            <div class="lbl">${isGov ? 'Cakupan Kebijakan' : 'Rentang Kejadian'}</div>
            <div class="val">${dataAktif.length} Fase</div>
            <div class="per">${isGov ? '2015–2026 · Fokus Masalah, Langkah &amp; Mekanisme' : '2015–2026 · Pemicu Makro &amp; Disrupsi Pasar Kerja'}</div>
          </div>
        </div>
      </div>

      <div class="story-in ms-container">
        <!-- Ringkasan Eksekutif 4 Metrik Kunci Linimasa -->
        <div class="ms-summary-grid">
          <div class="ms-stat-card">
            <span class="ms-stat-lbl">Awal Dekade (Agu 2015)</span>
            <strong class="ms-stat-val" style="color:#d97706">6,18%</strong>
            <span class="ms-stat-sub">${isGov ? 'Dana Desa &amp; Paket Ekonomi I–VIII' : 'Akhir Boom Komoditas Global'}</span>
          </div>
          <div class="ms-stat-card">
            <span class="ms-stat-lbl">Titik Pra-Pandemi (Agu 2019)</span>
            <strong class="ms-stat-val" style="color:#2563eb">5,23%</strong>
            <span class="ms-stat-sub">${isGov ? 'Super Deduction Tax 200% &amp; BLK' : 'Perang Dagang AS-Tiongkok'}</span>
          </div>
          <div class="ms-stat-card ms-stat-danger">
            <span class="ms-stat-lbl">Puncak Krisis (Agu 2020)</span>
            <strong class="ms-stat-val" style="color:#dc2626">7,07%</strong>
            <span class="ms-stat-sub">${isGov ? 'Program PEN, BSU &amp; Kartu Prakerja' : 'Guncangan Pandemi COVID-19 (9,77 Juta)'}</span>
          </div>
          <div class="ms-stat-card ms-stat-success">
            <span class="ms-stat-lbl">Capaian Terkini (2025–2026)</span>
            <strong class="ms-stat-val" style="color:#059669">4,85% → 4,68%</strong>
            <span class="ms-stat-sub">${isGov ? 'Program MBG &amp; Stimulus PPh 21 DTP' : 'Disrupsi Otomasi/AI &amp; Tarif Global'}</span>
          </div>
        </div>

        <!-- Grafik Interaktif Trajektori TPT dengan Titik Milestone -->
        <div class="card ms-chart-card">
          <div class="card-head">
            <div>
              <h2>${isGov ? 'Peta Trajektori TPT &amp; Tonggak Intervensi Pemerintah (2015–2026)' : 'Peta Trajektori TPT &amp; Penanda Kejadian Makro (2015–2026)'}</h2>
              <p class="sub">Klik pada titik tahun pada grafik linimasa di bawah untuk melompat langsung ke kartu rincian periode terkait.</p>
            </div>
          </div>
          <div id="ms-Interactive-Chart" class="ms-chart-box"></div>
        </div>

        <!-- Daftar Kartu Linimasa Kronologis -->
        <div class="ms-timeline">
          ${dataAktif.map((m, idx) => `
            <article class="ms-item status-${m.status}" id="${m.id}" style="--ms-accent:${m.warna}">
              <div class="ms-marker">
                <div class="ms-dot"><span>${idx + 1}</span></div>
                <div class="ms-line"></div>
              </div>
              <div class="ms-card">
                <div class="ms-card-top">
                  <div class="ms-card-meta">
                    <span class="ms-year-badge">${m.tahun}</span>
                    <span class="ms-cat-badge">${m.badge}</span>
                    <span class="ms-tpt-pill">TPT: <b>${m.tpt}</b> <small>(${m.delta})</small></span>
                  </div>
                  <button type="button" class="ms-map-btn" data-ms-per="${m.tahunPer}" title="Lihat kondisi peta pada tahun ${m.tahunPer}">
                    Lihat Peta ${m.tahunPer} <span aria-hidden="true">→</span>
                  </button>
                </div>

                <div class="ms-card-head-row">
                  <div class="ms-card-title-wrap">
                    <h3>${m.judul}</h3>
                    <div class="ms-tags">
                      ${m.tags.map(t => `<span class="ms-tag"># ${t}</span>`).join('')}
                    </div>
                  </div>
                  <div class="ms-illus" aria-hidden="true">
                    ${m.img ? `
                      <img class="ms-thumb-img" src="${m.img}" alt="${m.imgAlt || m.judul}" loading="lazy" onerror="this.style.display='none';this.nextElementSibling.style.display='block';">
                      <div class="ms-illus-fallback" style="display:none;width:100%;height:100%">${m.svg}</div>
                    ` : m.svg}
                  </div>
                </div>

                ${!isGov ? `
                  <div class="ms-single-box">
                    <div class="ms-box ms-box-makro">
                      <div class="ms-box-hdr">
                        <svg viewBox="0 0 24 24" class="ms-box-ico"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
                        <span>${m.pemicuLabel}</span>
                      </div>
                      <p>${m.kejadian}</p>
                    </div>
                  </div>
                ` : `
                  <div class="ms-gov-grid">
                    <div class="ms-box ms-box-fokus">
                      <div class="ms-box-hdr">
                        <svg viewBox="0 0 24 24" class="ms-box-ico"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                        <span>Fokus Masalah</span>
                      </div>
                      <p>${m.fokus}</p>
                    </div>

                    <div class="ms-box ms-box-kebijakan">
                      <div class="ms-box-hdr">
                        <svg viewBox="0 0 24 24" class="ms-box-ico"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><path d="m9 12 2 2 4-4"/></svg>
                        <span>Langkah &amp; Bauran Kebijakan Pemerintah</span>
                      </div>
                      <ul class="ms-step-list">
                        ${m.langkah.map(st => `<li>${st}</li>`).join('')}
                      </ul>
                    </div>

                    <div class="ms-box ms-box-mekanisme">
                      <div class="ms-box-hdr">
                        <svg viewBox="0 0 24 24" class="ms-box-ico"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/></svg>
                        <span>Mekanisme Penurunan Pengangguran</span>
                      </div>
                      <p>${m.mekanisme}</p>
                    </div>
                  </div>
                `}
              </div>
            </article>
          `).join('')}
        </div>
      </div>
    `;

    const barUtama = host.querySelector('#ms-bar-utama');
    const barSub = host.querySelector('#ms-bar-sub');
    if (barUtama) barUtama.append(segInfo);
    if (barSub) barSub.append(segKat);

    // Render SVG Chart Trajektori Milestone
    const chartBox = host.querySelector('#ms-Interactive-Chart');
    if (chartBox) {
      const pts = [
        { yr: '2015', v: 6.18, id: isGov ? 'ms-gov-2015' : 'ms-makro-2015', c: '#d97706' },
        { yr: '2016', v: 5.61, id: isGov ? 'ms-gov-2016' : 'ms-makro-2016', c: '#0f766e' },
        { yr: '2017', v: 5.50, id: isGov ? 'ms-gov-2017' : 'ms-makro-2016', c: '#0d9488' },
        { yr: '2018', v: 5.34, id: isGov ? 'ms-gov-2018' : 'ms-makro-2018', c: '#2563eb' },
        { yr: '2019', v: 5.23, id: isGov ? 'ms-gov-2019' : 'ms-makro-2018', c: '#4f46e5' },
        { yr: '2020', v: 7.07, id: isGov ? 'ms-gov-2020' : 'ms-makro-2020', c: '#dc2626' },
        { yr: '2021', v: 6.49, id: isGov ? 'ms-gov-2021' : 'ms-makro-2021', c: '#ea580c' },
        { yr: '2022', v: 5.86, id: isGov ? 'ms-gov-2022' : 'ms-makro-2022', c: '#0f766e' },
        { yr: '2023', v: 5.32, id: isGov ? 'ms-gov-2023' : 'ms-makro-2023', c: '#0d9488' },
        { yr: '2024', v: 4.91, id: isGov ? 'ms-gov-2024' : 'ms-makro-2024', c: '#7c3aed' },
        { yr: '2025', v: 4.85, id: isGov ? 'ms-gov-2025' : 'ms-makro-2025', c: '#059669' },
        { yr: '2026*', v: 4.68, id: isGov ? 'ms-gov-2025' : 'ms-makro-2025', c: '#059669' }
      ];
      const W = 880, H = 290, padL = 48, padR = 36, padT = 52, padB = 40;
      const minY = 4.0, maxY = 7.7;
      const X = i => padL + (i * (W - padL - padR) / (pts.length - 1));
      const Y = v => padT + (maxY - v) / (maxY - minY) * (H - padT - padB);

      const dLine = pts.map((p, i) => (i === 0 ? 'M' : 'L') + X(i).toFixed(1) + ',' + Y(p.v).toFixed(1)).join(' ');
      const dArea = dLine + ` L${X(pts.length - 1).toFixed(1)},${(H - padB).toFixed(1)} L${X(0).toFixed(1)},${(H - padB).toFixed(1)} Z`;

      let gridSvg = '';
      [4.5, 5.0, 5.5, 6.0, 6.5, 7.0, 7.5].forEach(gv => {
        const gy = Y(gv).toFixed(1);
        gridSvg += `<line x1="${padL}" x2="${W - padR}" y1="${gy}" y2="${gy}" stroke="var(--grid)" stroke-dasharray="3 3" stroke-width="1"/>`;
        gridSvg += `<text x="${padL - 8}" y="${Number(gy) + 4}" text-anchor="end" fill="var(--muted)" font-size="11" font-weight="600">${gv.toFixed(1).replace('.', ',')}%</text>`;
      });

      const x2020 = X(5), x2021 = X(6);
      const zoneSvg = `<rect x="${(x2020 - 20).toFixed(1)}" y="${padT - 28}" width="${(x2021 - x2020 + 40).toFixed(1)}" height="${H - padT - padB + 28}" rx="8" fill="rgba(220, 38, 38, 0.06)" stroke="rgba(220, 38, 38, 0.22)" stroke-dasharray="3 3"/>
      <rect x="${((x2020 + x2021) / 2 - 85).toFixed(1)}" y="${padT - 40}" width="170" height="20" rx="10" fill="rgba(220, 38, 38, 0.12)"/>
      <text x="${((x2020 + x2021) / 2).toFixed(1)}" y="${padT - 26}" text-anchor="middle" fill="#dc2626" font-size="9.5" font-weight="800" letter-spacing="0.4">${isGov ? 'INTERVENSI DARURAT PEN & JKP' : 'GUNCANGAN PANDEMI'}</text>`;

      let nodesSvg = '';
      pts.forEach((p, i) => {
        const cx = X(i).toFixed(1), cy = Y(p.v).toFixed(1);
        const isPeak = p.yr === '2020';
        const isLow = p.yr === '2019' || p.yr === '2025' || p.yr === '2026*';
        const dyVal = isPeak ? -13 : (i % 2 === 0 ? -12 : 18);
        nodesSvg += `
          <g class="ms-chart-node" data-ms-jump="${p.id}" style="cursor:pointer">
            <line x1="${cx}" x2="${cx}" y1="${cy}" y2="${H - padB}" stroke="${p.c}" stroke-width="1" stroke-dasharray="2 3" opacity="0.45"/>
            <circle cx="${cx}" cy="${cy}" r="${isPeak || isLow ? 6.5 : 5}" fill="${p.c}" stroke="var(--surface)" stroke-width="2"/>
            <text x="${cx}" y="${Number(cy) + dyVal}" text-anchor="middle" fill="var(--ink)" font-size="11" font-weight="800">${p.v.toFixed(2).replace('.', ',')}%</text>
            <text x="${cx}" y="${H - 12}" text-anchor="middle" fill="var(--ink-2)" font-size="11.5" font-weight="700">${p.yr}</text>
          </g>
        `;
      });

      chartBox.innerHTML = `
        <svg viewBox="0 0 ${W} ${H}" width="100%" height="100%" role="img" aria-label="Grafik linimasa TPT 2015 hingga 2026">
          <defs>
            <linearGradient id="msGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stop-color="var(--accent)" stop-opacity="0.28"/>
              <stop offset="100%" stop-color="var(--accent)" stop-opacity="0.02"/>
            </linearGradient>
          </defs>
          ${gridSvg}
          ${zoneSvg}
          <path d="${dArea}" fill="url(#msGrad)"/>
          <path d="${dLine}" fill="none" stroke="var(--accent)" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>
          ${nodesSvg}
        </svg>
      `;
    }

    // Interaktivitas klik ke bagian milestone
    host.querySelectorAll('[data-ms-jump]').forEach(el => {
      el.addEventListener('click', ev => {
        ev.preventDefault();
        const targetId = el.getAttribute('data-ms-jump');
        const targetEl = host.querySelector('#' + targetId);
        if (targetEl) {
          targetEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
          host.querySelectorAll('.ms-pill').forEach(p => p.classList.toggle('aktif', p.getAttribute('data-ms-jump') === targetId));
          targetEl.classList.add('ms-sorot-klik');
          setTimeout(() => targetEl.classList.remove('ms-sorot-klik'), 1400);
        }
      });
    });

    // Tombol lihat peta tahun terkait
    host.querySelectorAll('.ms-map-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const th = btn.getAttribute('data-ms-per');
        S.lap = 'tpt';
        S.lv = 'prov';
        S.frek = 'tahunan';
        S.per = th;
        gantiHalaman('peta');
      });
    });
  }

  function renderInsightContent(host) {
    const tptSr = seri('tpt', 'tahunan', 'prov');
    const tptKabSr = seri('tpt', 'tahunan', 'kab');
    const tptLSr = seri('tpt_l', 'tahunan', 'prov');
    const tptPSr = seri('tpt_p', 'tahunan', 'prov');
    const pengSr = seri('penganggur', 'tahunan', 'prov');
    const neetSr = seri('neet', 'tahunan', 'prov');
    const setSr = seri('setengah', 'tahunan', 'prov');
    const rPend = D.rincian.tpt_pendidikan.frek.tahunan;
    const rUmur = D.rincian.tpt_umur.frek.tahunan;
    const rDaerah = D.rincian.tpt_daerah.frek.tahunan;

    const lastIdx = tptSr.periode.length - 1;
    const lastPer = tptSr.periode[lastIdx];
    const natTpt = tptSr.nilai['00'][lastIdx];
    const natPeng = pengSr.nilai['00'][lastIdx];
    const natNeet = neetSr ? neetSr.nilai['00'][neetSr.nilai['00'].length - 1] : 19.44;
    const natSet = setSr ? setSr.nilai['00'][setSr.nilai['00'].length - 1] : 7.91;

    // Kalkulasi dinamis Bab 6: Gender Gap Provinsi
    const lIdx = tptLSr ? tptLSr.periode.indexOf(lastPer) : -1;
    const pIdx = tptPSr ? tptPSr.periode.indexOf(lastPer) : -1;
    const natTptL = (tptLSr && lIdx >= 0 && tptLSr.nilai['00']) ? tptLSr.nilai['00'][lIdx] : 4.85;
    const natTptP = (tptPSr && pIdx >= 0 && tptPSr.nilai['00']) ? tptPSr.nilai['00'][pIdx] : 4.84;
    const genderGapProvs = WIL.provinsi.map(pr => {
      const vl = (tptLSr && lIdx >= 0 && tptLSr.nilai[pr.kode]) ? tptLSr.nilai[pr.kode][lIdx] : null;
      const vp = (tptPSr && pIdx >= 0 && tptPSr.nilai[pr.kode]) ? tptPSr.nilai[pr.kode][pIdx] : null;
      return (vl != null && vp != null) ? { kode: pr.kode, prov: pr.nama, p: vp, l: vl, diff: vp - vl } : null;
    }).filter(Boolean).sort((a, b) => b.diff - a.diff);
    const topGender = genderGapProvs.slice(0, 3);

    // Kalkulasi dinamis Bab 8: Kab/Kota Ekstrem & Rata-rata Kota vs Kabupaten
    const kabIdx = tptKabSr ? tptKabSr.periode.indexOf(lastPer) : -1;
    const allKabs = WIL.kabkota.map(kb => {
      const v = (tptKabSr && kabIdx >= 0 && tptKabSr.nilai[kb.kode]) ? tptKabSr.nilai[kb.kode][kabIdx] : null;
      return v != null ? { kode: kb.kode, nama: kb.nama, prov: namaW(kb.prov), jenis: kb.jenis, val: v } : null;
    }).filter(Boolean).sort((a, b) => b.val - a.val);
    const listKota = allKabs.filter(x => x.jenis === 'Kota');
    const listKab = allKabs.filter(x => x.jenis !== 'Kota');
    const avgKota = listKota.length ? listKota.reduce((s, x) => s + x.val, 0) / listKota.length : 5.89;
    const avgKab = listKab.length ? listKab.reduce((s, x) => s + x.val, 0) / listKab.length : 3.78;
    const top3Kab = allKabs.slice(0, 3);
    const bot2Kab = allKabs.slice(-2);

    // Kalkulasi Waffle Jawa vs Luar Jawa
    const jawaCodes = ['32', '33', '35', '31', '36', '34'];
    let jawaPeng = 0;
    jawaCodes.forEach(c => { jawaPeng += (pengSr.nilai[c] ? pengSr.nilai[c][lastIdx] || 0 : 0); });
    const jbPeng = pengSr.nilai['32'] ? pengSr.nilai['32'][lastIdx] || 0 : 0;
    const restJawaPeng = jawaPeng - jbPeng;
    const luarJawaPeng = natPeng - jawaPeng;

    const n_jb = Math.round(jbPeng / natPeng * 100);
    const n_rj = Math.round(restJawaPeng / natPeng * 100);
    const n_lj = 100 - n_jb - n_rj;

    // Bab Cerita
    const chapters = [
      {
        id: 'tren-40-tahun',
        title: '1. Dari Pandemi 2020 ke 4,85%: Dinamika TPT Indonesia Sejak 2015',
        go: 'tpt|prov|tahunan|2025|00',
        aria: 'Lihat tren TPT nasional di peta',
        text: `<p>Pada Sakernas ${lastPer}, ${termI('tpt')} nasional berada di level <b>${fmtAngka(natTpt, 2)}%</b>, dengan total <b>${fmtAngka(natPeng)} jiwa</b> penganggur terbuka. Angka ini menunjukkan pemulihan ketenagakerjaan yang konsisten.</p>` +
          `<p>Dalam rentang 2015–${lastPer}, TPT Indonesia sempat melonjak signifikan saat pandemi Covid-19 (2020) hingga mencapai puncak <b>7,07%</b> (9,77 juta jiwa). Setelah itu, laju pengangguran berangsur melandai secara konsisten hingga menyentuh <b>${fmtAngka(natTpt, 2)}%</b> pada ${lastPer}.</p>` +
          `<p class="note"><b>Catatan Resmi BPS.</b> BPS mengukur tingkat pengangguran terbuka mencakup empat kelompok: penduduk yang aktif mencari kerja, sedang mempersiapkan usaha baru, merasa tidak mungkin mendapat pekerjaan (<i>hopeless</i>), serta yang sudah punya pekerjaan/usaha tetapi belum mulai bekerja.</p>`,
        fig: `<div class="fig-t">Tren TPT Nasional 2015–${lastPer} (%)</div><div class="chart" id="chart-ins-tren"></div><div class="fig-c">Garis menunjukkan laju TPT nasional. Titik menandai awal seri 2015 (${fmtAngka(tptSr.nilai['00'][0], 2)}%), lonjakan pandemi 2020 (7,07%), dan kondisi terkini ${lastPer} (${fmtAngka(natTpt, 2)}%).</div>`
      },
      {
        id: 'konsentrasi-jawa',
        title: '2. 6 dari 10 Penganggur Indonesia Berada di Pulau Jawa',
        go: 'penganggur|prov|tahunan|2025|32',
        aria: 'Lihat jumlah penganggur Jawa Barat di peta',
        text: `<p>Bayangkan seluruh penganggur di Indonesia diwakili oleh <b>100 kotak</b>. Pulau Jawa sendirian memegang <b>${n_jb + n_rj} kotak</b> (${((jawaPeng / natPeng) * 100).toFixed(1)}%), atau setara <b>${fmtAngka(jawaPeng)} jiwa</b>.</p>` +
          `<p>Jawa Barat adalah episentrum terbesar dengan <b>${n_jb} kotak</b> (${((jbPeng / natPeng) * 100).toFixed(1)}% total nasional atau <b>${fmtAngka(jbPeng)} jiwa</b>). Angka penganggur di satu provinsi Jawa Barat lebih banyak daripada seluruh gabungan provinsi di luar Jawa.</p>` +
          `<p>Sebaliknya, seluruh 32 provinsi di luar Pulau Jawa jika digabungkan hanya mencakup <b>${n_lj} kotak</b> (${((luarJawaPeng / natPeng) * 100).toFixed(1)}%). Ini menunjukkan besarnya konsentrasi tantangan ketenagakerjaan di sentra industri Pulau Jawa.</p>`,
        fig: `<div class="fig-t">Distribusi 100 Kotak Penganggur Indonesia (${lastPer})</div>` +
          `<div class="waffle">${'<i style="--wc:#0f766e"></i>'.repeat(n_jb)}${'<i style="--wc:#2dd4bf"></i>'.repeat(n_rj)}${'<i style="--wc:#94a3b8"></i>'.repeat(n_lj)}</div>` +
          `<ul class="wkey">` +
          `  <li style="--wc:#0f766e"><i></i><span><b>Jawa Barat</b> (${n_jb} kotak)</span><b>${fmtAngka(jbPeng)} jiwa</b><small>Provinsi dengan jumlah penganggur terbanyak di Indonesia</small></li>` +
          `  <li style="--wc:#2dd4bf"><i></i><span><b>Provinsi Jawa Lainnya</b> (${n_rj} kotak)</span><b>${fmtAngka(restJawaPeng)} jiwa</b><small>Jateng, Jatim, Banten, DKI Jakarta, DIY</small></li>` +
          `  <li style="--wc:#94a3b8"><i></i><span><b>Luar Pulau Jawa (32 Provinsi)</b> (${n_lj} kotak)</span><b>${fmtAngka(luarJawaPeng)} jiwa</b><small>Sumatera, Kalimantan, Sulawesi, Bali-Nusa, Maluku, Papua</small></li>` +
          `</ul>`
      },
      {
        id: 'paradoks-smk',
        title: '3. Paradoks Pendidikan: SMK Tertinggi, Lulusan SD Terendah',
        go: 'tpt|prov|tahunan|2025|',
        aria: 'Buka peta TPT per wilayah',
        text: `<p>Data resmi Sakernas memperlihatkan anomali struktural: semakin tinggi jenjang pendidikan dasar-menengah, tingkat penganggurannya justru cenderung semakin besar.</p>` +
          `<p>Lulusan <b>SMK (Sekolah Menengah Kejuruan)</b> mencatat TPT tertinggi di Indonesia yaitu <b>${fmtAngka(rPend.seri[3].nilai.slice(-1)[0], 2)}%</b>, disusul SMA umum sebesar <b>${fmtAngka(rPend.seri[2].nilai.slice(-1)[0], 2)}%</b>.</p>` +
          `<p>Sebaliknya, tenaga kerja berpendidikan <b>SD ke bawah</b> memiliki TPT paling rendah, hanya <b>${fmtAngka(rPend.seri[0].nilai.slice(-1)[0], 2)}%</b>. Fenomena ini terjadi karena pekerja berpendidikan rendah tidak memiliki bantalan ekonomi sehingga terpaksa mengambil pekerjaan apa saja di sektor informal.</p>`,
        fig: `<div class="fig-t">Tingkat Pengangguran Terbuka Berdasarkan Pendidikan (${lastPer})</div>` +
          `<div class="hb">` +
          rPend.seri.map(s => {
            const val = s.nilai.slice(-1)[0];
            const maxVal = 9.5;
            const isHighest = s.nama.includes('Kejuruan');
            return `<div class="hb-r">` +
              `<div class="hb-h"><b>${s.nama}</b><span>${fmtAngka(val, 2)}%</span></div>` +
              `<div class="hb-t"><div class="hb-bg"><span class="hb-b" style="--k:${(val / maxVal).toFixed(3)};--wc:${isHighest ? '#ea580c' : 'var(--accent, #0f766e)'}"></span></div><span class="hb-v">${fmtAngka(val, 2)}%</span></div>` +
              `</div>`;
          }).join('') +
          `</div>`
      },
      {
        id: 'generasi-muda-neet',
        title: '4. Usia Muda & Jeratan NEET: 1 dari 5 Pemuda Tidak Terhubung',
        go: 'neet|prov|tahunan|2025|',
        aria: 'Lihat sebaran NEET pemuda di peta',
        text: `<p>Pengangguran di Indonesia didominasi kelompok usia muda. TPT pada kelompok usia <b>15–19 tahun</b> mencapai <b>${fmtAngka(rUmur.seri[0].nilai.slice(-1)[0], 2)}%</b>, dan usia <b>20–24 tahun</b> sebesar <b>${fmtAngka(rUmur.seri[1].nilai.slice(-1)[0], 2)}%</b> — jauh melampaui rata-rata nasional (${fmtAngka(natTpt, 2)}%).</p>` +
          `<p>Lebih dari itu, indikator ${termI('neet')} mencatat <b>${fmtAngka(natNeet, 2)}%</b> pemuda Indonesia (hampir 1 dari 5 orang usia 15–24 tahun) berada dalam posisi rentan: tidak sedang sekolah, tidak bekerja, dan tidak mengikuti pelatihan keterampilan.</p>` +
          `<p class="note"><b>Tantangan Bonus Demografi.</b> Tingginya angka NEET pemuda menuntut transisi mulus dari bangku sekolah ke dunia kerja agar peluang bonus demografi Indonesia dapat dimanfaatkan optimal.</p>`,
        fig: `<div class="fig-t">Perbandingan TPT Kelompok Umur Muda vs Rata-rata (${lastPer})</div>` +
          `<div class="hb">` +
          [
            { label: 'Kelompok 15–19 Tahun', val: rUmur.seri[0].nilai.slice(-1)[0], color: '#ea580c' },
            { label: 'Kelompok 20–24 Tahun', val: rUmur.seri[1].nilai.slice(-1)[0], color: '#f97316' },
            { label: 'Kelompok 25–29 Tahun', val: rUmur.seri[2].nilai.slice(-1)[0], color: '#3b82f6' },
            { label: 'Rata-rata Seluruh Umur', val: natTpt, color: '#64748b' }
          ].map(item => `
            <div class="hb-r">
              <div class="hb-h"><b>${item.label}</b><span>${fmtAngka(item.val, 2)}%</span></div>
              <div class="hb-t"><div class="hb-bg"><span class="hb-b" style="--k:${(item.val / 25).toFixed(3)};--wc:${item.color}"></span></div><span class="hb-v">${fmtAngka(item.val, 2)}%</span></div>
            </div>
          `).join('') +
          `</div>`
      },
      {
        id: 'kota-vs-desa',
        title: '5. Kota vs Desa: Pengangguran Lebih Pekat di Wilayah Perkotaan',
        go: 'tpt|prov|tahunan|2025|',
        aria: 'Buka peta sebaran TPT per provinsi',
        text: `<p>Karakteristik geografis menunjukkan TPT di wilayah <b>perkotaan (${fmtAngka(rDaerah.seri[0].nilai.slice(-1)[0], 2)}%)</b> konsisten jauh lebih tinggi daripada di <b>perdesaan (${fmtAngka(rDaerah.seri[1].nilai.slice(-1)[0], 2)}%)</b>.</p>` +
          `<p>Di desa, sektor pertanian menyerap sebagian besar tenaga kerja keluarga atau pekerja lepas, sehingga angka pengangguran terbuka tampak rendah. Namun demikian, persoalan di desa bergeser ke bentuk ${termI('setengah')} (bekerja di bawah 35 jam seminggu).</p>` +
          `<p>Secara nasional, tingkat setengah pengangguran mencapai <b>${fmtAngka(natSet, 2)}%</b>, mengindikasikan bahwa banyak penduduk yang tercatat bekerja sebenarnya masih kekurangan jam kerja dan produktivitas.</p>`,
        fig: `<div class="fig-t">TPT Wilayah Perkotaan vs Perdesaan (${lastPer})</div>` +
          `<div class="hb">` +
          [
            { label: 'Perkotaan (Urban)', val: rDaerah.seri[0].nilai.slice(-1)[0], color: '#2563eb' },
            { label: 'Perdesaan (Rural)', val: rDaerah.seri[1].nilai.slice(-1)[0], color: '#10b981' },
            { label: 'Nasional (Gabungan)', val: natTpt, color: '#64748b' },
            { label: 'Tingkat Setengah Pengangguran', val: natSet, color: '#8b5cf6' }
          ].map(item => `
            <div class="hb-r">
              <div class="hb-h"><b>${item.label}</b><span>${fmtAngka(item.val, 2)}%</span></div>
              <div class="hb-t"><div class="hb-bg"><span class="hb-b" style="--k:${(item.val / 9).toFixed(3)};--wc:${item.color}"></span></div><span class="hb-v">${fmtAngka(item.val, 2)}%</span></div>
            </div>
          `).join('') +
          `</div>`
      },
      {
        id: 'disparitas-gender',
        title: '6. Potret Gender: Kesetaraan Angka Nasional vs Kesenjangan Wilayah',
        go: `tpt_p|prov|tahunan|${lastPer}|${topGender[0] ? topGender[0].kode : '11'}`,
        aria: 'Lihat TPT perempuan di peta',
        text: `<p>Secara agregat nasional, TPT laki-laki (<b>${fmtAngka(natTptL, 2)}%</b>) dan perempuan (<b>${fmtAngka(natTptP, 2)}%</b>) terlihat sangat seimbang. Namun, angka nasional ini menutupi ketimpangan gender yang sangat kontras di tingkat daerah.</p>` +
          (topGender.length >= 2 ? `<p>Di provinsi seperti <b>${topGender[0].prov}</b> dan <b>${topGender[1].prov}</b>, TPT perempuan jauh lebih tinggi daripada laki-laki dengan selisih lebih dari <b>${fmtAngka(topGender[1].diff, 2)} hingga ${fmtAngka(topGender[0].diff, 2)} poin persentase</b> (${topGender[0].prov}: Perempuan ${fmtAngka(topGender[0].p, 2)}% vs Laki-laki ${fmtAngka(topGender[0].l, 2)}%).</p>` : '') +
          `<p>Sementara itu, dari sisi keaktifan pasar kerja, ${termI('tpak')} perempuan nasional masih berada di kisaran <b>55%</b>, jauh di bawah TPAK laki-laki yang mencapai lebih dari <b>84%</b>. Sebagian besar perempuan bukan angkatan kerja tercatat sedang mengurus rumah tangga.</p>`,
        fig: `<div class="fig-t">Provinsi dengan Selisih TPT Perempuan Tertinggi di Atas Laki-laki (${lastPer})</div>` +
          `<div class="hb">` +
          [
            ...topGender.map(g => ({ prov: g.prov, p: g.p, l: g.l, gap: (g.diff >= 0 ? '+' : '') + fmtAngka(g.diff, 2) + ' pp' })),
            { prov: 'Rata-rata Nasional', p: natTptP, l: natTptL, gap: ((natTptP - natTptL) >= 0 ? '+' : '') + fmtAngka(natTptP - natTptL, 2) + ' pp' }
          ].map(item => `
            <div class="hb-r">
              <div class="hb-h"><b>${item.prov}</b><span>Perempuan ${fmtAngka(item.p, 2)}% vs Laki-laki ${fmtAngka(item.l, 2)}% (${item.gap})</span></div>
              <div class="hb-t"><div class="hb-bg"><span class="hb-b" style="--k:${(item.p / 9).toFixed(3)};--wc:#ec4899"></span></div><span class="hb-v">${fmtAngka(item.p, 2)}%</span></div>
            </div>
          `).join('') +
          `</div>`
      },
      {
        id: 'koridor-rpjmn',
        title: '7. Evaluasi Sasaran RPJMN 2025: Siapa Melampaui, Siapa Masih Tertinggal?',
        go: 'tpt|prov|tahunan|2025|',
        aria: 'Buka peta TPT per wilayah',
        text: `<p>Dokumen <a href="${D.sumberRpjmn.url}" target="_blank" rel="noopener"><b>RPJMN 2025–2029 (Perpres No. 12 Tahun 2025)</b></a> menetapkan koridor sasaran TPT untuk 7 wilayah pembangunan serta 38 provinsi Indonesia. Target nasional tahun 2025 dipatok pada rentang <b>4,50% – 5,00%</b>, dan realisasi Sakernas 2025 sebesar <b>4,85%</b> resmi berada di dalam rentang target tersebut.</p>` +
          `<p>Namun di tingkat wilayah, capaian bervariasi tajam:</p>` +
          `<ul style="margin:8px 0 12px 18px;font-size:0.95rem;line-height:1.6;color:var(--ink-2)">` +
          `  <li><b>Wilayah Berhasil di Bawah Target:</b> Bali (1,49%), Nusa Tenggara Barat, Jawa Tengah (4,66%), Jawa Timur (3,88%), dan Kalimantan Selatan (4,16%) sukses menekan pengangguran jauh di batas aman target wilayahnya.</li>` +
          `  <li><b>Wilayah yang Melampaui Batas Maksimal:</b> Jawa Barat (6,77% vs target koridor Jawa maks 5,62%), Banten (6,69%), DKI Jakarta (6,05%), Maluku (6,27% vs target maks 5,18%), dan Papua (6,96% vs target maks 3,59%).</li>` +
          `</ul>` +
          `<p>Tantangan terbesar pencapaian sasaran akhir 2029 (target nasional 4,00% – 4,71%) berada pada revitalisasi penyerapan tenaga kerja di koridor industri barat dan percepatan inklusi ekonomi Indonesia Timur.</p>`,
        fig: `<div class="fig-t">Status Realisasi TPT Provinsi 2025 terhadap Batas Koridor RPJMN 2025</div>` +
          `<div class="hb">` +
          [
            { prov: 'Jawa Barat (Koridor Jawa maks 5,62%)', val: 6.77, status: 'Melampaui Target', color: '#ea580c' },
            { prov: 'Banten (Koridor Jawa maks 5,62%)', val: 6.69, status: 'Melampaui Target', color: '#ea580c' },
            { prov: 'Kepulauan Riau (Koridor Sumatera maks 4,73%)', val: 6.45, status: 'Melampaui Target', color: '#ea580c' },
            { prov: 'Nasional (Target 4,50% – 5,00%)', val: 4.85, status: 'Memenuhi Target', color: '#10b981' },
            { prov: 'Jawa Timur (Koridor Jawa maks 5,62%)', val: 3.88, status: 'Memenuhi Target', color: '#10b981' },
            { prov: 'Bali (Koridor Bali-Nusra maks 2,72%)', val: 1.49, status: 'Memenuhi Target', color: '#10b981' }
          ].map(item => `
            <div class="hb-r">
              <div class="hb-h"><b>${item.prov}</b><span>${item.status}</span></div>
              <div class="hb-t"><div class="hb-bg"><span class="hb-b" style="--k:${(item.val / 7.5).toFixed(3)};--wc:${item.color}"></span></div><span class="hb-v">${fmtAngka(item.val, 2)}%</span></div>
            </div>
          `).join('') +
          `</div>`
      },
      {
        id: 'kabkota-ekstrem',
        title: `8. Disparitas Tajam ${allKabs.length} Daerah: Kota Pusat Jasa vs Lumbung Agraris`,
        go: `tpt|kab|tahunan|${lastPer}|${top3Kab[0] ? top3Kab[0].kode : '8171'}`,
        aria: 'Lihat daerah tertinggi di peta kab/kota',
        text: `<p>Melihat tingkat agregat provinsi sering kali menyembunyikan kontras ekstrem antar-kabupaten/kota. Dari ${allKabs.length} daerah di Indonesia, TPT tertinggi tercatat di <b>${top3Kab[0] ? `${top3Kab[0].nama} (${fmtAngka(top3Kab[0].val, 2)}%)` : 'Kota Ambon (11,37%)'}</b> dan <b>${top3Kab[1] ? `${top3Kab[1].nama} (${fmtAngka(top3Kab[1].val, 2)}%)` : 'Kota Sorong (10,35%)'}</b>.</p>` +
          `<p>Secara umum, rata-rata TPT di <b>${listKota.length} wilayah Kota (${fmtAngka(avgKota, 2)}%)</b> jauh lebih tinggi dibandingkan rata-rata <b>${listKab.length} Kabupaten (${fmtAngka(avgKab, 2)}%)</b>. Kota-kota besar menjadi magnet migrasi angkatan kerja terdidik, namun daya serap sektor formal terbatas sehingga menciptakan antrean pencari kerja yang panjang.</p>` +
          `<p>Sebaliknya, kabupaten dengan TPT terendah berada di wilayah pegunungan dan agraris seperti <b>${bot2Kab[1] ? `${bot2Kab[1].nama} (${fmtAngka(bot2Kab[1].val, 2)}%)` : 'Kab. Puncak (0,14%)'}</b> dan <b>${bot2Kab[0] ? `${bot2Kab[0].nama} (${fmtAngka(bot2Kab[0].val, 2)}%)` : 'Kab. Lanny Jaya (0,50%)'}</b>, di mana hampir seluruh penduduk aktif bekerja di pertanian subsisten mandiri.</p>`,
        fig: `<div class="fig-t">Rentang Ekstrem TPT Kabupaten/Kota di Indonesia (${lastPer})</div>` +
          `<div class="hb">` +
          [
            ...(top3Kab[0] ? [{ nama: `${top3Kab[0].nama} (${top3Kab[0].prov})`, val: top3Kab[0].val, ket: 'Tertinggi #1 di Indonesia', color: '#dc2626' }] : []),
            ...(top3Kab[1] ? [{ nama: `${top3Kab[1].nama} (${top3Kab[1].prov})`, val: top3Kab[1].val, ket: 'Tertinggi #2 di Indonesia', color: '#ea580c' }] : []),
            ...(top3Kab[2] ? [{ nama: `${top3Kab[2].nama} (${top3Kab[2].prov})`, val: top3Kab[2].val, ket: 'Tertinggi #3 di Indonesia', color: '#f97316' }] : []),
            { nama: `Rata-rata ${listKota.length} Kota`, val: avgKota, ket: 'Agregat Daerah Kota', color: '#2563eb' },
            { nama: `Rata-rata ${listKab.length} Kabupaten`, val: avgKab, ket: 'Agregat Daerah Kabupaten', color: '#059669' },
            ...(bot2Kab[0] ? [{ nama: `${bot2Kab[0].nama} (${bot2Kab[0].prov})`, val: bot2Kab[0].val, ket: 'Salah satu terendah', color: '#10b981' }] : []),
            ...(bot2Kab[1] ? [{ nama: `${bot2Kab[1].nama} (${bot2Kab[1].prov})`, val: bot2Kab[1].val, ket: 'Terendah di Indonesia', color: '#10b981' }] : [])
          ].map(item => `
            <div class="hb-r">
              <div class="hb-h"><b>${item.nama}</b><span>${item.ket}</span></div>
              <div class="hb-t"><div class="hb-bg"><span class="hb-b" style="--k:${(item.val / 12).toFixed(3)};--wc:${item.color}"></span></div><span class="hb-v">${fmtAngka(item.val, 2)}%</span></div>
            </div>
          `).join('') +
          `</div>`
      }
    ];

    const kamusList = Object.values(GLOSS_INSIGHT)
      .sort((a, b) => a.t.localeCompare(b.t, 'id'))
      .map(g => `<div><dt>${g.t}</dt><dd>${g.d}</dd></div>`)
      .join('');

    host.innerHTML = `
      <div class="hero">
        <div class="hero-lingkup-bar"></div>
        <div class="dalam hero-kisi">
          <div>
            <div class="alis"><span class="titik"></span>Cerita &amp; Wawasan Data · Sakernas ${lastPer}</div>
            <h1>Wawasan Analitis di Balik Angka <em>${fmtAngka(natTpt, 2)}%</em> Pengangguran Terbuka Indonesia.</h1>
            <p>Di balik <b>${fmtAngka(natPeng)} jiwa</b> penganggur terbuka nasional, terdapat dinamika struktural antarwilayah, kelompok umur, kesetaraan gender, hingga capaian koridor RPJMN. Halaman ini merangkum 8 bab temuan terkurasi dari angka resmi BPS dan Bappenas.</p>
          </div>
          <div class="hero-angka">
            <div class="lbl">Ringkasan Wawasan</div>
            <div class="val">8 Bab</div>
            <div class="per">Sentuh istilah bergaris bawah titik-titik untuk penjelasan</div>
          </div>
        </div>
      </div>

      <div class="story-in">
        <div class="insight-sticky-pills" role="navigation" aria-label="Lompat cepat bab wawasan">
          ${chapters.map((c, idx) => `<a href="#${c.id}" data-jump="${c.id}" class="ins-pill${idx === 0 ? ' aktif' : ''}">Bab ${idx + 1}</a>`).join('')}
          <a href="#s-kamus" data-jump="s-kamus" class="ins-pill">Kamus</a>
        </div>
        <nav class="toc" aria-label="Daftar Isi Cerita">
          <div class="toc-title">Daftar 8 Bab Wawasan Data</div>
          <ul>
            ${chapters.map(c => `<li><a href="#${c.id}" data-jump="${c.id}">${c.title}</a></li>`).join('')}
            <li><a href="#s-kamus" data-jump="s-kamus">Kamus Istilah Ketenagakerjaan</a></li>
          </ul>
        </nav>

        ${chapters.map(c => `
          <article class="chap" id="${c.id}">
            <h2>${c.title}</h2>
            <div class="chap-body">
              <div class="chap-text">
                ${c.text}
                <button type="button" class="maplink" data-go="${c.go}" aria-label="${c.aria}">
                  Lihat di peta <span aria-hidden="true">&rarr;</span>
                </button>
              </div>
              <figure class="chap-fig">${c.fig}</figure>
            </div>
          </article>
        `).join('')}

        <article class="chap" id="s-kamus">
          <h2>Kamus Singkat Istilah Ketenagakerjaan</h2>
          <dl class="kamus">${kamusList}</dl>
        </article>
      </div>
    `;

    // Interaktivitas jump link & maplink
    host.querySelectorAll('a[data-jump]').forEach(a => {
      a.addEventListener('click', e => {
        e.preventDefault();
        const target = host.querySelector('#' + a.dataset.jump);
        if (target) target.scrollIntoView({ behavior: 'smooth', block: 'start' });
      });
    });

    if ('IntersectionObserver' in window) {
      const pills = host.querySelectorAll('.ins-pill');
      const obsChap = new IntersectionObserver(entries => {
        entries.forEach(en => {
          if (en.isIntersecting) {
            const idAktif = en.target.id;
            pills.forEach(p => p.classList.toggle('aktif', p.dataset.jump === idAktif));
          }
        });
      }, { rootMargin: '-20% 0px -65% 0px', threshold: 0 });
      host.querySelectorAll('article.chap').forEach(art => obsChap.observe(art));
    }

    host.querySelectorAll('.maplink').forEach(btn => {
      btn.addEventListener('click', () => {
        const [lap, lv, frek, per, sel] = btn.dataset.go.split('|');
        if (lap) S.lap = lap;
        if (lv) S.lv = lv;
        if (frek) S.frek = frek;
        if (per) S.per = per;
        if (sel) S.sel = sel;
        gantiHalaman('peta');
      });
    });

    // Tooltip interaktif untuk istilah ketenagakerjaan (Mouse, Sentuh, & Keyboard)
    const bukaTipTerm = (el, ev) => {
      const k = el.dataset.tipKey;
      if (!GLOSS_INSIGHT[k]) return;
      const rc = el.getBoundingClientRect();
      const fakeEv = (ev && typeof ev.clientX === 'number' && ev.clientX > 0)
        ? ev
        : { clientX: Math.round(rc.left + rc.width / 2), clientY: Math.round(rc.bottom) };
      I.tampilTip(fakeEv, [I.tipNama(GLOSS_INSIGHT[k].t), I.tipSub(GLOSS_INSIGHT[k].d)]);
    };
    host.querySelectorAll('.term').forEach(el => {
      el.addEventListener('mouseenter', ev => bukaTipTerm(el, ev));
      el.addEventListener('mouseleave', () => I.sembunyiTip());
      el.addEventListener('focus', ev => bukaTipTerm(el, ev));
      el.addEventListener('blur', () => I.sembunyiTip());
      el.addEventListener('click', ev => {
        ev.stopPropagation();
        bukaTipTerm(el, ev);
      });
      el.addEventListener('keydown', ev => {
        if (ev.key === 'Enter' || ev.key === ' ') {
          ev.preventDefault();
          bukaTipTerm(el, ev);
        } else if (ev.key === 'Escape') {
          I.sembunyiTip();
        }
      });
    });

    // Inisialisasi SVG chart tren 2015-2025
    const pts = tptSr.periode.map((p, i) => ({ t: +p, y: tptSr.nilai['00'][i] })).filter(p => p.y != null);
    const drawChartTren = () => {
      const cEl = host.querySelector('#chart-ins-tren');
      if (!cEl) return;
      insStoryChart(cEl, {
        t0: 2015,
        t1: 2025,
        lo: 0,
        hi: 9,
        xs: 2,
        yf: v => v + '%',
        body: ({ X, Y, lo, pad }) => {
          const dStr = pts.map((p, k) => (k ? 'L' : 'M') + X(p.t).toFixed(1) + ' ' + Y(p.y).toFixed(1)).join('');
          const base = Y(0).toFixed(1);
          const area = `<path d="${dStr}L${X(pts[pts.length - 1].t).toFixed(1)} ${base}L${X(pts[0].t).toFixed(1)} ${base}Z" fill="var(--accent-soft, rgba(15, 118, 110, 0.14))"/>`;
          const line = `<path class="ln" d="${dStr}" fill="none" stroke="var(--accent, #0f766e)" stroke-width="2.5" stroke-linejoin="round" stroke-linecap="round"/>`;
          return area + line;
        },
        marks: [
          { t: 2015, y: tptSr.nilai['00'][0], txt: `2015: ${fmtAngka(tptSr.nilai['00'][0], 2)}%`, anc: 'start', dx: 6, dy: -10 },
          { t: 2020, y: 7.07, txt: '2020 (Pandemi): 7,07%', anc: 'middle', dx: 0, dy: -12 },
          { t: 2025, y: natTpt, txt: `2025: ${fmtAngka(natTpt, 2)}%`, anc: 'end', dx: -8, dy: 16 }
        ],
        label: `Grafik garis tren TPT nasional 2015 sampai 2025`
      });
    };

    const segInfo = h('div', { class: 'seg seg-lingkup-profil' });
    I.segmen(segInfo, [['insight', 'Insight'], ['milestone', 'Milestone']], S.infomode, modeBaru => {
      S.infomode = modeBaru;
      render();
    }, 'Pilihan Informasi');
    const bar = host.querySelector('.hero-lingkup-bar');
    if (bar) bar.append(segInfo);

    insightCharts = [drawChartTren];
    drawChartTren();
    insightDibuat = true;
  }

  // =====================================================================
  // NAVIGASI
  // =====================================================================
  function gantiHalaman(pg) { if (waktu) waktu.berhenti(); S.page = pg; render(); window.scrollTo({ top: 0 }); }
  function render() {
    I.sembunyiTip();
    document.querySelectorAll('.tabs button').forEach(b => b.setAttribute('aria-selected', b.dataset.page === S.page ? 'true' : 'false'));
    document.querySelectorAll('.page').forEach(p => p.classList.toggle('aktif', p.id === 'page-' + S.page));
    document.body.classList.toggle('mode-peta', S.page === 'peta');
    if (S.page === 'peta') { if (!peta) { initPeta(); renderPeta(); if (S.sel || S.fokus) zoomWilayah(S.sel || S.fokus); } else renderPeta(); }
    else if (S.page === 'beranda') { S.page = 'profil'; S.wil = '00'; renderProfil(); }
    else if (S.page === 'profil') renderProfil();
    else if (S.page === 'sasaran') renderSasaran();
    else if (S.page === 'insight') renderInsight();
    else renderMetode();
    tulis();
  }
  I.bacaHash(S, HALAMAN);
  I.pasangTema($('tema'), 'peng2-tema');
  document.querySelectorAll('.tabs button').forEach(b => b.addEventListener('click', () => gantiHalaman(b.dataset.page)));
  document.querySelector('.nav .logo').addEventListener('click', ev => { ev.preventDefault(); S.wil = '00'; gantiHalaman('profil'); });
  $('kaki').replaceChildren(
    h('div', { text: `Versi 2 · data dibangun ${D.dibuat} oleh Data/_skrip/bangun_dashboard_pengangguran.js --versi 2. Angka indikator utama resmi BPS, Kemnaker, dan Bappenas disajikan apa adanya tanpa interpolasi; data kosong dibiarkan kosong.` }),
    h('div', { text: 'Peringkat, kelas warna peta, serta ringkasan selisih/proporsi naratif disajikan sebagai konteks bantu baca. Lihat Metodologi untuk sumber, tautan unduh, dan catatan per lapisan.' }));
  let tRes = null, lebarAkhir = innerWidth;
  window.addEventListener('resize', () => { clearTimeout(tRes); tRes = setTimeout(() => { if (S.page !== 'peta' && Math.abs(innerWidth - lebarAkhir) > 15) { lebarAkhir = innerWidth; render(); } }, 100); });
  render();
})();
