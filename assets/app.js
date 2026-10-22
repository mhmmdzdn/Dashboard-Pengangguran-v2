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
    info: 'M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18zM12 11v6M12 7.5v.5', unduh: 'M12 3v12M7 10l5 5 5-5M4 21h16', panah: 'M5 12h14M13 6l6 6-6 6',
  };
  const ikon = (k, cls) => { const e = sv('svg', { class: 'ikon' + (cls ? ' ' + cls : ''), viewBox: '0 0 24 24', 'aria-hidden': 'true' }); e.append(sv('path', { d: IK[k] || IK.info })); return e; };
  const IKON_LAP = { tpt: 'tpt', tpt_l: 'pria', tpt_p: 'wanita', neet: 'neet', setengah: 'jam', penganggur: 'orang', tpak: 'tpak' };

  // ---------- data dasar ----------
  const LAP = D.lapisan, BY = Object.fromEntries(LAP.map(l => [l.id, l]));
  const PROV = Object.fromEntries(WIL.provinsi.map(p => [p.kode, p]));
  const KAB = Object.fromEntries(WIL.kabkota.map(k => [k.kode, k]));
  const PROV_URUT = WIL.provinsi.slice().sort((a, b) => a.kode.localeCompare(b.kode));
  const URUT_WIL = ['Sumatera', 'Jawa', 'Kalimantan', 'Bali-Nusa Tenggara', 'Sulawesi', 'Maluku', 'Papua'];
  const FREK = { tahunan: 'Tahunan', semesteran: 'Semesteran', triwulanan: 'Triwulanan' };
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
  const kelasL = (l, lv) => { const br = Array.isArray(l.kelas) ? l.kelas : l.kelas[lv]; return (kelasCache[l.id + lv] = kelasCache[l.id + lv] || I.kelasTetap(br)); };
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
  const S = { page: 'beranda', lap: 'tpt', lv: 'prov', frek: 'tahunan', per: '', sel: '', fokus: '',
    dper: '', dfrek: 'tahunan', drinc: 'pendidikan', dmode: 'garis', dsp: 'pendidikan', dspmode: 'garis', dpend: 'tahunan', dumur: '',
    wil: '31', pfrek: 'tahunan', pkar: 'pendidikan', pkper: '', ptahun: '' };
  const KUNCI = { beranda: ['dper', 'dfrek', 'drinc', 'dmode', 'dsp', 'dspmode', 'dpend', 'dumur'], peta: ['lap', 'lv', 'frek', 'per', 'sel', 'fokus'], profil: ['wil', 'pfrek', 'pkar', 'pkper', 'ptahun'], sasaran: [], insight: [], metode: [] };
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
    // rel lapisan berikon, dua kelompok
    const tombol = x => {
      const th = frekTersedia(x.id, 'prov').flatMap(f => seri(x.id, f, 'prov').periode).map(p => p.slice(0, 4)).sort();
      return h('button', { type: 'button', role: 'radio', 'aria-checked': x.id === S.lap ? 'true' : 'false', title: x.nama, onclick: () => { S.lap = x.id; renderPeta(); tulis(); } },
        h('span', { class: 'ik' }, ikon(IKON_LAP[x.id])), h('span', { class: 'tx' }, h('span', { text: x.singkat }), h('small', { text: `${th[0]}–${th[th.length - 1]}${punyaLv(x.id, 'kab') ? ' · kab/kota' : ''}` })));
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
      h('div', {}, h('div', { class: 'lbl' }, ikon('naik'), ' Tertinggi'), h('div', { class: 'val', text: fmtL(l, data[urut[0]], true) }), h('div', { class: 'nm', title: namaW(urut[0]), text: namaW(urut[0]) })),
      h('div', {}, h('div', { class: 'lbl' }, ikon('turun'), ' Terendah'), h('div', { class: 'val', text: fmtL(l, data[urut[urut.length - 1]], true) }), h('div', { class: 'nm', title: namaW(urut[urut.length - 1]), text: namaW(urut[urut.length - 1]) })));
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
      if (dRef) isi.push(h('div', { class: 'bagian-jdl', text: 'Tren ' + (lingkup ? namaW(S.fokus) : 'Indonesia') + ' · klik untuk memilih periode' }), trenMini([{ nama: lingkup ? namaW(S.fokus) : 'Indonesia', warna: 'var(--accent)', data: dRef, utama: true }]));
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
      const ser = [{ nama: namaW(k), warna: 'var(--accent)', data: deret(S.lap, S.frek, k) || [], utama: true, asal: asalMap(S.lap, S.frek, k) }];
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
    I.tabel($('laci-badan'), { kolom: kol, baris, sel: S.sel, maks: 520 });
    $('laci-csv').onclick = () => { const sr = seri(S.lap, S.frek, lv); const kk = Object.keys(sr.nilai).sort(); I.unduhCsv(`${S.lap}_${lv}_${S.frek}.csv`, ['kode', 'wilayah', 'provinsi', ...sr.periode, 'periode_dari_tabel_bps_provinsi'], kk.map(k => [k, namaW(k), lvDari(k) === 'kab' ? namaW(KAB[k].prov) : '', ...sr.nilai[k], Object.keys(asalMap(S.lap, S.frek, k) || {}).join(' ')])); };
    $('laci').showModal();
  }

  // =====================================================================
  // BERANDA
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
  function renderBeranda() {
    const host = $('beranda');
    const perTpt = daftarPeriode('tpt', 'tahunan', 'prov').filter(p => p >= '2015');
    if (!perTpt.includes(S.dper)) S.dper = perTpt[perTpt.length - 1];
    const per = S.dper, iPer = perTpt.indexOf(per), perSeb = perTpt[iPer - 1];
    const L_ = BY.tpt, tpt = nilai('tpt', 'tahunan', '00', per), tptSeb = perSeb ? nilai('tpt', 'tahunan', '00', perSeb) : null;
    const pot = potong('tpt', 'tahunan', 'prov', per), urutP = Object.keys(pot).filter(k => k !== '00').sort((a, b) => pot[b] - pot[a]);
    const potK = potong('tpt', 'tahunan', 'kab', per), urutK = Object.keys(potK).sort((a, b) => potK[b] - potK[a]);
    const pg = nilai('penganggur', 'tahunan', '00', per), neet = nilai('neet', 'tahunan', '00', per), sp = nilai('setengah', 'tahunan', '00', per), tpak = nilai('tpak', 'tahunan', '00', per);
    const pilihPer = p => { if (perTpt.includes(p)) { S.dper = p; renderBeranda(); tulis(); } };
    // --- hero ---
    const p2 = [];
    if (tptSeb != null) p2.push(`Periode sebelumnya ${fmtL(L_, tptSeb)} (${lblTahunan(perSeb)}).`);
    if (pg != null) p2.push(`BPS mencatat ${fmtAngka(pg)} orang penganggur.`);
    if (urutK.length) p2.push(`Di tingkat kab/kota${urutK.length < 500 ? ` (${urutK.length} kab/kota dengan angka resmi)` : ''}, tertinggi ${namaW(urutK[0])} (${fmtL(L_, potK[urutK[0]])}), terendah ${namaW(urutK[urutK.length - 1])} (${fmtL(L_, potK[urutK[urutK.length - 1]])}).`);
    const selPer = h('select', { 'aria-label': 'Periode beranda', onchange: ev => pilihPer(ev.target.value) }, perTpt.slice().reverse().map(p => h('option', { value: p, selected: p === per ? true : null, text: lblTahunan(p) })));
    const spark = h('div');
    host.replaceChildren(h('div', { class: 'hero' }, h('div', { class: 'dalam hero-kisi' },
      h('div', {}, h('div', { class: 'alis' }, h('span', { class: 'titik' }), 'Angka resmi BPS · ' + lblTahunan(per)),
        h('h1', {}, 'Tingkat pengangguran terbuka Indonesia ', h('em', { text: fmtL(L_, tpt) }), urutP.length ? [`; tertinggi di ${namaW(urutP[0])} (${fmtL(L_, pot[urutP[0]])}), terendah di ${namaW(urutP[urutP.length - 1])} (${fmtL(L_, pot[urutP[urutP.length - 1]])}).`] : '.'),
        h('p', { text: p2.join(' ') }),
        h('div', { class: 'chip-baris' }, h('label', { class: 'chip' }, 'Periode ', selPer), h('button', { class: 'chip', type: 'button', style: 'cursor:pointer', onclick: () => gantiHalaman('peta') }, ikon('peta'), 'Jelajahi peta'), h('button', { class: 'chip', type: 'button', style: 'cursor:pointer', onclick: () => gantiHalaman('sasaran') }, ikon('target'), 'Sasaran RPJMN'))),
      h('div', { class: 'hero-angka' }, h('div', { class: 'lbl', text: 'TPT Indonesia · ' + lblTahunan(per) }), h('div', { class: 'val', text: fmtL(L_, tpt) }), h('div', { class: 'per', text: 'Tren 2015–' + perTpt[perTpt.length - 1] }), spark))));
    spark.append(I.garisMini((deret('tpt', 'tahunan', '00') || []).filter(d => d[0] <= per), { tinggi: 46, lebar: 320 }));
    // --- KPI ---
    const sparkN = id => (deret(id, 'tahunan', '00') || []).filter(d => d[0] <= per).slice(-12);
    
    // Kartu gabungan TPT Tertinggi & Terendah
    const kpiEkstremGabung = h('div', { class: 'kpi kpi-rentang-gabung' },
      h('div', { class: 'kpi-sub-item klik', onclick: () => { if (urutP.length) { S.wil = urutP[0]; gantiHalaman('profil'); } }, role: 'button', tabindex: '0' },
        h('div', { class: 'atas' }, h('span', { class: 'bulat oranye' }, ikon('naik')), h('span', { text: 'TPT tertinggi' })),
        h('div', { class: 'val', text: urutP.length ? fmtL(L_, pot[urutP[0]]) : '—' }),
        h('div', { class: 'per', text: urutP.length ? namaW(urutP[0]) : '' })
      ),
      h('div', { class: 'kpi-divider-vert' }),
      h('div', { class: 'kpi-sub-item klik', onclick: () => { if (urutP.length) { S.wil = urutP[urutP.length - 1]; gantiHalaman('profil'); } }, role: 'button', tabindex: '0' },
        h('div', { class: 'atas' }, h('span', { class: 'bulat' }, ikon('turun')), h('span', { text: 'TPT terendah' })),
        h('div', { class: 'val', text: urutP.length ? fmtL(L_, pot[urutP[urutP.length - 1]]) : '—' }),
        h('div', { class: 'per', text: urutP.length ? namaW(urutP[urutP.length - 1]) : '' })
      )
    );

    host.append(h('div', { class: 'kpi-kisi' },
      kpi({ ik: 'orang', label: 'Jumlah penganggur', val: pg != null ? nfKompak.format(pg) : '—', per: pg != null ? fmtAngka(pg) + ' orang' : 'tidak tersedia', spark: sparkN('penganggur') }),
      kpiEkstremGabung,
      kpi({ ik: 'neet', label: 'NEET usia 15–24', val: fmtL(BY.neet, neet), per: neet != null ? lblTahunan(per) : 'tersedia 2015–2025', spark: sparkN('neet') }),
      kpi({ ik: 'jam', label: 'Setengah pengangguran', val: fmtL(BY.setengah, sp), per: sp != null ? lblTahunan(per) : 'tersedia 2015–2025', spark: sparkN('setengah') }),
      kpi({ ik: 'tpak', label: 'TPAK', val: fmtL(BY.tpak, tpak), per: tpak != null ? lblTahunan(per) : 'tersedia 2021–2026', spark: sparkN('tpak') })));
    const tunda = [];
    // 01 tren + peta
    {
      const g = h('div'), seg = h('div', { class: 'seg' }), pmEl = h('div', { class: 'peta-host' }), legEl = h('div', { class: 'legenda-mini' }), ekstrem = h('div', { class: 'daftar-ekstrem' });
      I.segmen(seg, Object.keys(FREK).map(f => [f, FREK[f]]), S.dfrek, f => { S.dfrek = f; renderBeranda(); tulis(); }, 'Frekuensi');
      host.append(h('section', { class: 'bagian' }, bagian(1, 'Tren dan sebaran', 'TPT Indonesia sejak 2015 dengan rentang sasaran RPJMN, serta peta TPT provinsi pada periode terpilih.'),
        h('div', { class: 'kisi kisi-2' },
          kartuAksi('Tren TPT Indonesia', S.dfrek === 'tahunan' ? '2015–2025 · pita = rentang sasaran RPJMN 2025–2029 · klik titik untuk memilih periode' : FREK[S.dfrek], seg, g, catatanR({ catatan: [BY.tpt.catatan[0]] })),
          kartuAksi('TPT provinsi', lblTahunan(per) + ' · klik untuk membuka profil', h('button', { class: 'btn', type: 'button', onclick: () => { S.lap = 'tpt'; S.lv = 'prov'; S.frek = 'tahunan'; S.per = per; gantiHalaman('peta'); } }, 'Peta penuh ', ikon('panah')),
            h('div', { class: 'peta-mini' }, pmEl), legEl, ekstrem))));
      const sn = D.sasaran.find(x => x.level === 'nasional');
      tunda.push(() => {
        let d = deret('tpt', S.dfrek, '00') || [];
        if (S.dfrek === 'tahunan') d = d.filter(x => x[0] >= '2015');
        const pita = S.dfrek === 'tahunan' && sn ? [{ dari: '2025', sampai: '2025', lo: sn.target2025[0], hi: sn.target2025[1], label: 'Sasaran 2025', legenda: 'Rentang sasaran RPJMN' }, { dari: '2029', sampai: '2029', lo: sn.target2029[0], hi: sn.target2029[1], label: 'Sasaran 2029', legenda: 'Rentang sasaran RPJMN' }] : [];
        I.grafikGaris(g, { seri: [{ nama: 'Indonesia', warna: 'var(--accent)', data: d, utama: true }], tinggi: 480, fmt: v => fmtL(L_, v), patahan: (BY.tpt.patahan || {})[S.dfrek], pita, area: true,
          periodeTambahan: S.dfrek === 'tahunan' ? ['2026', '2027', '2028', '2029'] : [], aktif: S.dfrek === 'tahunan' ? per : null, onKlik: S.dfrek === 'tahunan' ? pilihPer : null, label: 'Tren TPT Indonesia' });
        const K = kelasL(L_, 'prov');
        petaMini(pmEl, { warna: k => K.warna(pot[k]), onPilih: k => { if (k) { S.wil = k; gantiHalaman('profil'); } },
          onHover: (ev, k) => { if (!k) { I.sembunyiTip(); return; } I.tampilTip(ev, [I.tipNama(namaW(k)), I.tipBaris(fmtL(L_, pot[k]), 'TPT'), I.tipSub(lblTahunan(per))]); } });
        I.legendaKelas(legEl, { kelas: K, fmt: fmtLeg(L_), judul: 'TPT (%)' });
        const li = k => h('li', { onclick: () => { S.wil = k; gantiHalaman('profil'); } }, h('span', { text: (urutP.indexOf(k) + 1) + '. ' + namaW(k) }), h('b', { text: fmtL(L_, pot[k]) }));
        ekstrem.replaceChildren(h('div', {}, h('h4', { text: '5 tertinggi' }), h('ol', {}, urutP.slice(0, 5).map(li))), h('div', {}, h('h4', { text: '5 terendah' }), h('ol', {}, urutP.slice(-5).reverse().map(li))));
      });
    }
    // 02 siapa yang menganggur
    {
      const segRinc = h('div', { class: 'seg' }), segMode = h('div', { class: 'seg' }), id = RINC_TPT[S.drinc], r = R[id], g = h('div');
      I.segmen(segRinc, Object.keys(RINC_TPT).map(k => [k, NAMA_RINC[k]]), S.drinc, v => { S.drinc = v; renderBeranda(); tulis(); }, 'Rincian');
      I.segmen(segMode, [['garis', 'Garis Tunggal'], ['grid', 'Panel Kisi']], S.dmode, v => { S.dmode = v; renderBeranda(); tulis(); }, 'Tampilan');
      
      const tabWrap = h('div', { class: 'tab-rincian', style: 'display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:10px' },
        segRinc,
        h('div', { style: 'display:flex;align-items:center;gap:8px' }, h('span', { class: 'kecil', text: 'Tampilan: ' }), segMode));

      host.append(h('section', { class: 'bagian' }, bagian(2, 'Siapa yang menganggur?', S.dmode === 'garis' ? 'Perbandingan multi-garis TPT Indonesia menurut karakteristik penduduk (2015–2025). Hover garis untuk sorotan data.' : 'TPT Indonesia menurut karakteristik penduduk, tahunan (Agustus) 2015–2025. Skala sumbu sama di semua panel; klik grafik untuk memilih periode.'),
        h('div', { class: 'card' }, tabWrap, g, catatanR(r), kakiKartu(r, id, 'tahunan'))));

      tunda.push(() => {
        const f = rinc(id, 'tahunan');
        if (S.dmode === 'garis') {
          // Warna palet Highcharts / Editorial Design
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
      I.segmen(seg, [['tahunan', 'Tahunan'], ['semesteran', 'Semesteran']], S.dpend, v => { S.dpend = v; renderBeranda(); tulis(); }, 'Frekuensi');
      const idU = 'penganggur_umur', rU = R[idU], fU = rinc(idU, 'semesteran');
      if (!fU.periode.includes(S.dumur)) S.dumur = selaraskan(per + '-08', fU.periode);
      const selU = h('select', { 'aria-label': 'Periode', onchange: ev => { S.dumur = ev.target.value; renderBeranda(); tulis(); } }, fU.periode.slice().reverse().map(p => h('option', { value: p, selected: p === S.dumur ? true : null, text: lblPer(p, true) })));
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
    // 04 sebaran wilayah
    {
      const grid = h('div', { class: 'wil-kisi' });
      host.append(h('section', { class: 'bagian' }, bagian(4, 'Sebaran menurut wilayah', `TPT provinsi ${lblTahunan(per)}, dikelompokkan menurut wilayah RPJMN · garis vertikal = Indonesia ${fmtL(L_, tpt)} · klik nama untuk membuka profil.`), grid));
      URUT_WIL.forEach(w => {
        const b = h('div'), prov = WIL.provinsi.filter(p => p.wilayah === w);
        grid.append(h('div', { class: 'card wil-kartu' }, h('div', { class: 'card-head' }, h('div', {}, h('h3', { text: w }), h('div', { class: 'sub', text: prov.length + ' provinsi' }))), b));
        tunda.push(() => I.daftarBatang(b, { baris: prov.map(p => ({ kode: p.kode, nama: p.nama, v: pot[p.kode] != null ? pot[p.kode] : null })).sort((a, c) => (a.v == null) - (c.v == null) || c.v - a.v), fmt: v => fmtL(L_, v), ref: tpt, onPilih: k => { S.wil = k; gantiHalaman('profil'); } }));
      });
    }
    // 05 setengah pengangguran
    {
      const segRinc = h('div', { class: 'seg' }), segMode = h('div', { class: 'seg' }), id = RINC_SP[S.dsp], r = R[id], g = h('div');
      I.segmen(segRinc, Object.keys(RINC_SP).map(k => [k, NAMA_RINC[k]]), S.dsp, v => { S.dsp = v; renderBeranda(); tulis(); }, 'Rincian');
      I.segmen(segMode, [['garis', 'Garis Tunggal'], ['grid', 'Panel Kisi']], S.dspmode, v => { S.dspmode = v; renderBeranda(); tulis(); }, 'Tampilan');

      const tabWrap = h('div', { class: 'tab-rincian', style: 'display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:10px' },
        segRinc,
        h('div', { style: 'display:flex;align-items:center;gap:8px' }, h('span', { class: 'kecil', text: 'Tampilan: ' }), segMode));

      host.append(h('section', { class: 'bagian' }, bagian(5, 'Setengah pengangguran', S.dspmode === 'garis' ? 'Perbandingan multi-garis tingkat setengah pengangguran menurut karakteristik penduduk (2015–2025).' : 'Pekerja di bawah jam kerja normal (< 35 jam/minggu) yang masih mencari atau bersedia menerima pekerjaan lain, tahunan 2015–2025.'),
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
    // 06 kegiatan penduduk
    {
      const r = R.kegiatan, f = rinc('kegiatan', 'tahunan');
      const jml = f.seri.filter(x => !/%|Tingkat/.test(x.nama)), tkt = f.seri.filter(x => /%|Tingkat/.test(x.nama));
      const g1 = h('div'), g2 = h('div');
      host.append(h('section', { class: 'bagian' }, bagian(6, 'Penduduk 15+ menurut kegiatan', 'Indonesia, 2015–2025 (Sakernas Agustus) · tiap panel berskala sendiri · angka resmi BPS.'),
        h('div', { class: 'kisi kisi-5-7' }, kartu('Tingkat (persen)', 'TPAK, TPT, tingkat kesempatan kerja', g2), kartu('Jumlah (orang)', 'Penduduk 15+, angkatan kerja, bekerja, penganggur, bukan angkatan kerja', g1)), h('div', { class: 'jarak' }, sumberR(r))));
      tunda.push(() => {
        I.kecilBanyak(g1, { periode: f.periode, seri: jml, fmt: v => (v == null ? '—' : nfKompak.format(v)), aktif: per, patahan: BY.tpt.patahan.tahunan, tinggi: 80, bersama: false });
        I.kecilBanyak(g2, { periode: f.periode, seri: tkt.map(x => ({ ...x, nama: x.nama.replace(/\s*\(%\)/, '') })), fmt: v => (v == null ? '—' : fmtAngka(v, 2) + '%'), aktif: per, patahan: BY.tpt.patahan.tahunan, tinggi: 80, bersama: false });
      });
    }
    requestAnimationFrame(() => tunda.forEach(x => x()));
  }

  // =====================================================================
  // PROFIL
  // =====================================================================
  function renderProfil() {
    const host = $('profil');
    if (!PROV[S.wil] && !KAB[S.wil]) S.wil = '31';
    const k = S.wil, isKab = !!KAB[k], pk = provDari(k);
    const cari = h('div', { class: 'cari' }), lokasi = h('div', { class: 'peta-host' });
    const pilihProv = h('select', { 'aria-label': 'Pilih provinsi', onchange: ev => { S.wil = ev.target.value; render(); } }, PROV_URUT.map(p => h('option', { value: p.kode, selected: p.kode === pk ? true : null, text: p.nama })));
    const tTpt = terakhir('tpt', 'tahunan', k);
    host.replaceChildren(h('div', { class: 'hero' }, h('div', { class: 'dalam hero-profil' },
      h('div', {},
        h('div', { class: 'remah' }, h('button', { class: 'btn-tautan', type: 'button', text: 'Indonesia', onclick: () => gantiHalaman('beranda') }), ' › ', isKab ? [h('button', { class: 'btn-tautan', type: 'button', text: namaW(pk), onclick: () => { S.wil = pk; render(); } }), ' › ', KAB[k].jenis] : 'Provinsi'),
        h('h1', { text: namaW(k) }),
        h('div', { class: 'chip-baris' }, h('span', { class: 'chip', text: isKab ? KAB[k].jenis + ' · ' + namaW(pk) : 'Provinsi' }), h('span', { class: 'chip', text: 'Wilayah ' + PROV[pk].wilayah }), h('span', { class: 'chip', text: 'Kode BPS ' + k }),
          tTpt ? h('span', { class: 'chip', text: 'TPT ' + fmtL(BY.tpt, tTpt[1]) + ' · ' + lblTahunan(tTpt[0]) }) : null),
        h('div', { class: 'hero-alat' }, pilihProv, cari)),
      h('div', { class: 'lokasi', 'aria-hidden': 'true' }, lokasi))));
    I.kotakCari(cari, { daftar: daftarCari, onPilih: kk => { S.wil = kk; render(); tulis(); }, placeholder: 'Cari provinsi atau kab/kota…' });
    const tunda = [() => petaMini(lokasi, { warna: x => (x === pk ? '#f5a37f' : 'rgba(255,255,255,.22)'), onPilih: x => { if (x) { S.wil = x; render(); tulis(); } } })];
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
        sparkTptMain.length ? I.garisMini(sparkTptMain, { tinggi: 26 }) : null
      ),
      h('div', { class: 'kpi-divider-vert' }),
      h('div', { class: 'kpi-sub-item' },
        h('div', { class: 'atas' }, h('span', { class: 'bulat' }, ikon('orang')), h('span', { text: 'Jumlah penganggur' })),
        h('div', { class: 'val', text: tPengMain ? fmtL(BY.penganggur, tPengMain[1], true) : '—' }),
        h('div', { class: 'per', text: tPengMain ? lblTahunan(tPengMain[0]) : 'tidak ada angka resmi' }),
        sparkPengMain.length ? I.garisMini(sparkPengMain, { tinggi: 26 }) : null
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
        spkL.length ? I.garisMini(spkL, { tinggi: 26 }) : null
      ),
      h('div', { class: 'kpi-divider-vert' }),
      h('div', { class: 'kpi-sub-item' },
        h('div', { class: 'atas' }, h('span', { class: 'bulat oranye' }, ikon('wanita')), h('span', { text: 'TPT perempuan' })),
        h('div', { class: 'val', text: tP ? fmtL(BY.tpt_p, tP[1]) : '—' }),
        h('div', { class: 'per', text: tP ? lblTahunan(tP[0]) + (vNP != null ? ' · Indonesia ' + fmtL(BY.tpt_p, vNP) : '') : 'tidak ada angka resmi' }),
        uP ? h('div', { class: 'peringkat-lencana' }, h('span', { class: 'lencana biru', text: `#${uP[0]} dari ${uP[1]}${isKab ? ' di provinsi' : ''}` })) : null,
        spkP.length ? I.garisMini(spkP, { tinggi: 26 }) : null
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
        spkNeet.length ? I.garisMini(spkNeet, { tinggi: 26 }) : null
      ),
      h('div', { class: 'kpi-divider-vert' }),
      h('div', { class: 'kpi-sub-item' },
        h('div', { class: 'atas' }, h('span', { class: 'bulat' }, ikon('jam')), h('span', { text: 'Setengah pengangguran' })),
        h('div', { class: 'val', text: tSet ? fmtL(BY.setengah, tSet[1]) : '—' }),
        h('div', { class: 'per', text: tSet ? lblTahunan(tSet[0]) + (vNSet != null ? ' · Indonesia ' + fmtL(BY.setengah, vNSet) : '') : 'tidak ada angka resmi' }),
        uSet ? h('div', { class: 'peringkat-lencana' }, h('span', { class: 'lencana biru', text: `#${uSet[0]} dari ${uSet[1]}` })) : null,
        spkSet.length ? I.garisMini(spkSet, { tinggi: 26 }) : null
      )
    ) : null;

    const cards = [kpiTptPengGabung, kpiGenderGabung];
    if (kpiNeetSetGabung) cards.push(kpiNeetSetGabung);

    host.append(h('div', { class: 'kpi-kisi' }, ...cards));
    // 01 tren
    {
      const fr = frekTersedia('tpt', lvDari(k)); if (!fr.includes(S.pfrek)) S.pfrek = 'tahunan';
      const seg = h('div', { class: 'seg' }); I.segmen(seg, fr.map(f => [f, FREK[f]]), S.pfrek, f => { S.pfrek = f; renderProfil(); tulis(); }, 'Frekuensi');
      const g = h('div'), gLP = h('div'), am = asalMap('tpt', S.pfrek, k);
      host.append(h('section', { class: 'bagian' }, bagian(1, 'Tingkat pengangguran terbuka', `${namaW(k)}${isKab ? ' dibandingkan ' + namaW(pk) : ''} dan Indonesia, serta TPT laki-laki dan perempuan.`),
        h('div', { class: 'kisi kisi-2' },
          kartuAksi('Tren TPT', FREK[S.pfrek], fr.length > 1 ? seg : null, g, am ? h('div', { class: 'catatan-kecil', text: 'Titik berongga = angka tabel BPS provinsi (' + Object.keys(am).join(', ') + '). Garis putus-putus = pergantian sumber/patahan seri.' }) : null),
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
          ser.push({ nama: 'Indonesia', warna: 'var(--context)', data: dNat });
        }
        I.grafikGaris(g, { seri: potongAwal(ser), tinggi: 300, fmt: v => fmtL(BY.tpt, v), patahan: (BY.tpt.patahan || {})[S.pfrek], asalLabel: 'tabel BPS provinsi' });
        I.grafikGaris(gLP, { seri: [{ nama: 'Laki-laki', warna: 'var(--cat-1)', data: deret('tpt_l', 'tahunan', k) || [], utama: true }, { nama: 'Perempuan', warna: 'var(--cat-2)', data: deret('tpt_p', 'tahunan', k) || [], utama: true }], tinggi: 300, fmt: v => fmtL(BY.tpt, v) });
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
          if (l.jenis !== 'jumlah' && deret(id, 'tahunan', pemb)) ser.push({ nama: namaW(pemb), warna: isKab ? 'var(--cat-2)' : 'var(--context)', data: deret(id, 'tahunan', pemb) });
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
    tunda.push(() => I.daftarBatang(g, { baris: baris.filter(r => !/^total$/i.test(r[0])).map(r => ({ nama: r[0], v: r[1], tip: `Laki-laki ${fmtAngka(r[2])} · Perempuan ${fmtAngka(r[3])}` })), fmt: v => (v == null ? '—' : fmtAngka(v)) }));
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
    host.append(h('section', { class: 'bagian' }, bagian(no, `Kabupaten/kota di ${namaW(pk)}`, `${kabs.length} kab/kota · TPT dan indikator lain pada tahun terpilih · klik untuk membuka profil kab/kota.`),
      h('div', { class: 'card' }, h('div', { class: 'tab-rincian' }, h('label', {}, 'Tahun ', sel)),
        h('div', { class: 'kisi kisi-2' }, h('div', { class: 'peta-kolom' }, h('div', { class: 'peta-mini tinggi' }, petaEl), leg), batangWrap), h('div', { class: 'jarak' }, tb))));
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
        baris: kabs.map(x => { const r = [{ teks: x.nama, sort: x.nama }].concat(kol.map(id => { const v = nilai(id, 'tahunan', x.kode, th); return { teks: v == null ? '—' : fmtAngka(v, BY[id].desimal), sort: v }; })); r.kode = x.kode; return r; }), sel: isKab ? k : null, maks: 420 });
    });
  }

  // =====================================================================
  // SASARAN
  // =====================================================================
  function renderSasaran() {
    const host = $('sasaran'), L_ = BY.tpt, sn = D.sasaran.find(x => x.level === 'nasional');
    const perT = daftarPeriode('tpt', 'tahunan', 'prov'), pT = perT[perT.length - 1], perQ = daftarPeriode('tpt', 'triwulanan', 'prov'), pQ = perQ[perQ.length - 1];
    const fmt = v => fmtL(L_, v), rg = r => (r ? fmtAngka(r[0], 2) + '–' + fmtAngka(r[1], 2) + '%' : '—');
    const vT = nilai('tpt', 'tahunan', '00', pT);
    host.replaceChildren(h('div', { class: 'hero' }, h('div', { class: 'dalam hero-kisi' },
      h('div', {}, h('div', { class: 'alis' }, h('span', { class: 'titik' }), 'Bappenas · RPJMN 2025–2029'), h('h1', {}, 'Sasaran TPT nasional ', h('em', { text: rg(sn.target2025) }), ' pada 2025 dan ', h('em', { text: rg(sn.target2029) }), ' pada 2029.'),
        h('p', { text: `Baseline 2024: ${fmtAngka(sn.baseline2024, 2)}%. Halaman ini menampilkan angka TPT resmi berdampingan dengan rentang sasaran — tanpa menghitung jarak atau selisih.` })),
      h('div', { class: 'hero-angka' }, h('div', { class: 'lbl', text: 'TPT Indonesia · ' + lblTahunan(pT) }), h('div', { class: 'val', text: fmt(vT) }), h('div', { class: 'per', text: pQ ? `Triwulanan terbaru: ${fmt(nilai('tpt', 'triwulanan', '00', pQ))} (${lblPer(pQ, true)})` : '' })))));
    host.append(h('div', { class: 'kpi-kisi auto' },
      kpi({ ik: 'info', label: 'Baseline 2024', val: fmtAngka(sn.baseline2024, 2) + '%', per: 'RPJMN (Bappenas)' }),
      kpi({ ik: 'target', label: 'Sasaran 2025', val: rg(sn.target2025), per: 'rentang' }),
      kpi({ ik: 'target', oranye: true, label: 'Sasaran 2029', val: rg(sn.target2029), per: 'rentang' }),
      kpi({ ik: 'tpt', label: 'TPT ' + lblTahunan(pT), val: fmt(vT), per: 'BPS', spark: (deret('tpt', 'tahunan', '00') || []).slice(-11) }),
      pQ ? kpi({ ik: 'jam', label: 'TPT ' + lblPer(pQ, true), val: fmt(nilai('tpt', 'triwulanan', '00', pQ)), per: 'BPS, triwulanan', spark: deret('tpt', 'triwulanan', '00') }) : null));
    const g = h('div');
    host.append(h('section', { class: 'bagian' }, bagian(1, 'TPT Indonesia dan rentang sasaran', 'Tahunan (Agustus) 2015–2025 · pita = rentang sasaran RPJMN 2025 dan 2029.'), h('div', { class: 'card' }, g)));
    const tunda = [() => I.grafikGaris(g, { seri: [{ nama: 'Indonesia', warna: 'var(--accent)', data: (deret('tpt', 'tahunan', '00') || []).filter(d => d[0] >= '2015'), utama: true }], tinggi: 300, fmt, area: true,
      pita: [{ dari: '2025', sampai: '2025', lo: sn.target2025[0], hi: sn.target2025[1], label: 'Sasaran 2025', legenda: 'Rentang sasaran RPJMN' }, { dari: '2029', sampai: '2029', lo: sn.target2029[0], hi: sn.target2029[1], label: 'Sasaran 2029', legenda: 'Rentang sasaran RPJMN' }],
      periodeTambahan: ['2026', '2027', '2028', '2029'] })];
    // bullet chart per wilayah, skala bersama
    const wil = D.sasaran.filter(x => x.level === 'wilayah');
    const semuaV = WIL.provinsi.map(p => nilai('tpt', 'tahunan', p.kode, pT)).filter(v => v != null).concat(wil.flatMap(x => [...(x.target2025 || []), ...(x.target2029 || [])]));
    const maks = Math.ceil(Math.max(...semuaV) + 0.5), pos = v => Math.max(0, Math.min(100, v / maks * 100));
    const grid = h('div', { class: 'wil-kisi lebar' });
    host.append(h('section', { class: 'bagian' }, bagian(2, 'Provinsi dan sasaran wilayah', `TPT provinsi ${lblTahunan(pT)} (titik) dengan rentang sasaran wilayahnya. Skala 0–${maks}% sama untuk semua kartu.`),
      h('div', { class: 'bullet-leg' }, h('span', {}, h('i', { class: 'lt' }), 'TPT provinsi'), h('span', {}, h('i', { class: 'l25' }), 'Sasaran wilayah 2025'), h('span', {}, h('i', { class: 'l29' }), 'Sasaran wilayah 2029')), grid,
      h('div', { class: 'card jarak' }, h('ul', { class: 'catatan', style: 'margin:0' },
        h('li', { text: 'Sasaran wilayah berlaku untuk wilayah sebagai satu kesatuan, bukan untuk setiap provinsi; provinsi ditampilkan sebagai rincian, bukan penilaian capaian.' }),
        h('li', { text: 'Sasaran wilayah dibaca dari infografis lampiran RPJMN (halaman 70–71); urutan 2025/2029 perlu dicek visual pada dokumen sumber.' }),
        h('li', {}, 'Sumber sasaran: ', h('a', { href: D.sumberRpjmn.url, target: '_blank', rel: 'noopener', text: D.sumberRpjmn.label }), '. Sumber TPT: BPS.')))));
    URUT_WIL.forEach(w => {
      const x = wil.find(z => z.wilayah === w); if (!x) return;
      const b = h('div', { class: 'bullet' });
      WIL.provinsi.filter(p => p.wilayah === w).map(p => [p, nilai('tpt', 'tahunan', p.kode, pT)]).sort((a, c) => (c[1] || 0) - (a[1] || 0)).forEach(([p, v]) => {
        const trk = h('div', { class: 'trk' },
          x.target2029 ? h('div', { class: 'pita29', style: `left:${pos(x.target2029[0])}%;width:${pos(x.target2029[1]) - pos(x.target2029[0])}%` }) : null,
          x.target2025 ? h('div', { class: 'pita25', style: `left:${pos(x.target2025[0])}%;width:${pos(x.target2025[1]) - pos(x.target2025[0])}%` }) : null,
          v != null ? h('div', { class: 'titik', style: `left:${pos(v)}%` }) : null);
        trk.addEventListener('pointermove', ev => I.tampilTip(ev, [I.tipNama(p.nama), I.tipBaris(fmt(v), 'TPT ' + lblTahunan(pT)), I.tipSub('Sasaran wilayah 2025: ' + rg(x.target2025)), I.tipSub('Sasaran wilayah 2029: ' + rg(x.target2029))]));
        trk.addEventListener('pointerleave', I.sembunyiTip);
        b.append(h('div', { class: 'nm', title: p.nama, text: p.nama, onclick: () => { S.wil = p.kode; gantiHalaman('profil'); } }), trk, h('div', { class: 'v', text: fmt(v) }));
      });
      grid.append(h('div', { class: 'card wil-kartu' }, h('div', { class: 'card-head' }, h('div', {}, h('h3', { text: 'Wilayah ' + w }))),
        h('div', { class: 'rentang' }, h('span', {}, h('span', { class: 'lencana biru', text: '2025' }), ' ', h('b', { text: rg(x.target2025) })), h('span', {}, h('span', { class: 'lencana oranye', text: '2029' }), ' ', h('b', { text: rg(x.target2029) }))), b));
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
      h('p', { text: 'Dashboard tidak menghitung tingkat, selisih, pertumbuhan, pangsa, rata-rata, atau jumlah. Data yang tidak diterbitkan dibiarkan kosong (arsiran di peta).' }))));
    host.append(h('div', { class: 'metode-kisi', style: 'margin-top:20px;position:relative;z-index:2' },
      blok('info', 'Prinsip', 'Hanya angka resmi; peringkat dan kelas warna peta hanya pengurutan/pengelompokan tampilan.', 'Kosong = tidak ada angka resmi; tidak diisi perkiraan atau interpolasi (garis grafik terputus).', 'Garis putus-putus menandai deret yang tidak sepenuhnya sebanding (patahan seri atau pergantian sumber).', 'Kelas warna peta tetap untuk semua periode.'),
      blok('jam', 'Frekuensi & periode', 'Tahunan = Sakernas Agustus periode 2015–2025 (metodologi konsisten Sakernas modern BPS).', 'Semesteran = Februari & Agustus sejak 2015. Triwulanan = Februari, Mei, Agustus, November (sejak 2025; Mei 2025 tidak tersedia).', 'Seluruh data telah diselaraskan pada rentang 10 tahun terakhir yang memiliki tingkat konfidensi dan kelengkapan tertinggi.'),
      blok('peta', 'TPT kab/kota', '2017–2025: tabel BPS pusat (514 kab/kota).', 'Sebelum 2017: tabel BPS provinsi untuk 16–18 provinsi; nama dipadankan ke kode BPS, kode lama Papua dipetakan ke kode setelah pemekaran.', 'Bila keduanya memuat tahun yang sama, dipakai tabel BPS pusat (tidak dirata-rata); ±460 titik tumpang tindih dicatat di data/_log_bangun.txt.'),
      blok('peta', 'Peta', 'Batas provinsi: CC BY 4.0 (denyherianto/indonesia-geojson-topojson-maps-with-38-provinces). Batas kab/kota: ardian28/GeoJson-Indonesia-38-Provinsi. Disederhanakan untuk tampilan.', `${WIL.tanpaPoligon.length} kota kecil tanpa poligon di peta sumber (${WIL.tanpaPoligon.join(', ')}); angkanya tetap ada di tabel, peringkat, dan profil.`)));
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
    tpt: { t: 'TPT (Tingkat Pengangguran Terbuka)', k: 1, d: 'Persentase jumlah penganggur terhadap jumlah seluruh angkatan kerja. Penganggur adalah mereka yang tidak punya pekerjaan dan sedang aktif mencari kerja, mempersiapkan usaha, atau sudah diterima kerja tetapi belum mulai.' },
    angkatan: { t: 'Angkatan Kerja', k: 1, d: 'Penduduk usia kerja (15 tahun ke atas) yang aktif bekerja atau sedang menganggur mencari pekerjaan.' },
    tpak: { t: 'TPAK (Tingkat Partisipasi Angkatan Kerja)', k: 1, d: 'Persentase jumlah angkatan kerja terhadap seluruh penduduk usia kerja (15 tahun ke atas). Menunjukkan seberapa besar porsi penduduk produktif yang aktif dalam pasar tenaga kerja.' },
    neet: { t: 'NEET', k: 1, d: 'Not in Employment, Education, or Training — persentase pemuda usia 15–24 tahun yang sedang tidak bekerja, tidak menempuh pendidikan sekolah/kuliah, dan tidak sedang mengikuti pelatihan kerja.' },
    setengah: { t: 'Setengah Pengangguran', k: 1, d: 'Pekerja yang jam kerjanya kurang dari 35 jam per minggu dan masih mencari pekerjaan tambahan atau masih bersedia menerima pekerjaan lain.' },
    smk: { t: 'Paradoks SMK', k: 1, d: 'Kondisi di mana lulusan SMK yang disiapkan langsung siap kerja justru memiliki tingkat pengangguran tertinggi dibandingkan jenjang pendidikan lainnya karena ketidaksesuaian (mismatch) dengan kebutuhan industri.' },
    sakernas: { t: 'Sakernas', k: 1, d: 'Survei Angkatan Kerja Nasional oleh Badan Pusat Statistik (BPS), sumber data ketenagakerjaan resmi di Indonesia yang dilaksanakan secara berkala.' },
    rpjmn: { t: 'Sasaran RPJMN', k: 1, d: 'Rencana Pembangunan Jangka Menengah Nasional 2025–2029 yang menetapkan target batas atas TPT nasional dan koridor wilayah.' },
    gendergap: { t: 'Disparitas Gender Ketenagakerjaan', k: 1, d: 'Perbedaan tingkat pengangguran atau partisipasi kerja antara laki-laki dan perempuan di suatu wilayah, sering kali dipengaruhi oleh struktur industri lokal dan beban pengurusan rumah tangga.' }
  };

  const termI = (k, label) => `<span class="term" data-tip-key="${k}">${label || GLOSS_INSIGHT[k].t}</span>`;

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
      g += `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="4.5" fill="var(--card-bg, #ffffff)" stroke="var(--aksen, #2563eb)" stroke-width="2.5"/><text class="mk" x="${(x + m.dx).toFixed(1)}" y="${(y + m.dy).toFixed(1)}" text-anchor="${m.anc}">${m.txt}</text>`;
    });
    el.innerHTML = `<svg width="${W0}" height="${H0}" viewBox="0 0 ${W0} ${H0}" role="img" aria-label="${o.label || 'Grafik'}">${g}</svg>`;
  }

  function renderInsight() {
    const host = $('insight');
    if (!host) return;

    if (insightDibuat) {
      insightCharts.forEach(fn => fn());
      return;
    }

    const tptSr = seri('tpt', 'tahunan', 'prov');
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
        title: '1. Dari Krisis 1998 ke 4,85%: Perjalanan Panjang TPT Indonesia',
        go: 'tpt|prov|tahunan|2025|00',
        aria: 'Lihat tren TPT nasional di peta',
        text: `<p>Pada Sakernas ${lastPer}, ${termI('tpt')} nasional berada di level <b>${fmtAngka(natTpt, 2)}%</b>, dengan total <b>${fmtAngka(natPeng)} jiwa</b> penganggur terbuka. Angka ini adalah salah satu yang terendah dalam dua dekade terakhir.</p>` +
          `<p>Dalam catatan sejarah 1986–${lastPer}, TPT pernah melonjak tajam saat Krisis Moneter 1998 dan mencapai puncaknya pada 2005 di angka <b>11,24%</b>. Sempat kembali melonjak saat pandemi Covid-19 (2020) ke <b>7,07%</b> sebelum berangsur turun ke tren perbaikan saat ini.</p>` +
          `<p class="note"><b>Catatan Resmi BPS.</b> Sejak 2001, BPS memperluas konsep pengangguran terbuka dengan memasukkan penduduk yang mempersiapkan usaha dan yang merasa putus asa mencari kerja (discouraged workers).</p>`,
        fig: `<div class="fig-t">Tren TPT Nasional 1986–${lastPer} (%)</div><div class="chart" id="chart-ins-tren"></div><div class="fig-c">Garis menunjukkan laju TPT nasional. Titik menandai krisis 2005 (11,24%), pandemi 2020 (7,07%), dan kondisi terkini ${lastPer} (${fmtAngka(natTpt, 2)}%).</div>`
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
          `<div class="waffle">${'<i style="--wc:#2563eb"></i>'.repeat(n_jb)}${'<i style="--wc:#60a5fa"></i>'.repeat(n_rj)}${'<i style="--wc:#94a3b8"></i>'.repeat(n_lj)}</div>` +
          `<ul class="wkey">` +
          `  <li style="--wc:#2563eb"><i></i><span><b>Jawa Barat</b> (${n_jb} kotak)</span><b>${fmtAngka(jbPeng)} jiwa</b><small>Provinsi dengan jumlah penganggur terbanyak di Indonesia</small></li>` +
          `  <li style="--wc:#60a5fa"><i></i><span><b>Provinsi Jawa Lainnya</b> (${n_rj} kotak)</span><b>${fmtAngka(restJawaPeng)} jiwa</b><small>Jateng, Jatim, Banten, DKI Jakarta, DIY</small></li>` +
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
              `<div class="hb-t"><div class="hb-bg"><span class="hb-b" style="--k:${(val / maxVal).toFixed(3)};--wc:${isHighest ? '#ea580c' : '#2563eb'}"></span></div><span class="hb-v">${fmtAngka(val, 2)}%</span></div>` +
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
        go: 'tpt_p|prov|tahunan|2025|11',
        aria: 'Lihat TPT perempuan di Aceh',
        text: `<p>Secara agregat nasional, TPT laki-laki (<b>4,85%</b>) dan perempuan (<b>4,84%</b>) terlihat sangat seimbang. Namun, angka nasional ini menutupi ketimpangan gender yang sangat kontras di tingkat daerah.</p>` +
          `<p>Di provinsi seperti <b>Aceh</b> dan <b>Papua Barat Daya</b>, TPT perempuan jauh lebih tinggi daripada laki-laki dengan selisih lebih dari <b>2,5 hingga 3,0 persen poin</b> (Aceh: Perempuan 7,52% vs Laki-laki 4,48%).</p>` +
          `<p>Sementara itu, dari sisi keaktifan pasar kerja, ${termI('tpak')} perempuan nasional masih berada di kisaran <b>55%</b>, jauh di bawah TPAK laki-laki yang mencapai lebih dari <b>84%</b>. Sebagian besar perempuan bukan angkatan kerja tercatat sedang mengurus rumah tangga.</p>`,
        fig: `<div class="fig-t">Provinsi dengan Selisih TPT Perempuan Tertinggi di Atas Laki-laki (${lastPer})</div>` +
          `<div class="hb">` +
          [
            { prov: 'Aceh', p: 7.52, l: 4.48, gap: '+3,04%' },
            { prov: 'Papua Barat Daya', p: 8.44, l: 5.87, gap: '+2,57%' },
            { prov: 'Sulawesi Utara', p: 7.31, l: 5.23, gap: '+2,08%' },
            { prov: 'Rata-rata Nasional', p: 4.84, l: 4.85, gap: '-0,01%' }
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
        text: `<p>Dokumen RPJMN 2025–2029 menetapkan koridor sasaran TPT untuk 7 wilayah pembangunan Indonesia. Target nasional tahun 2025 dipatok pada rentang <b>4,50% – 5,00%</b>, dan realisasi Sakernas 2025 sebesar <b>4,85%</b> resmi berada di dalam rentang target tersebut.</p>` +
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
        title: '8. Disparitas Tajam 514 Daerah: Kota Pusat Jasa vs Lumbung Agraris',
        go: 'tpt|kab|tahunan|2025|8171',
        aria: 'Lihat Kota Ambon di peta kab/kota',
        text: `<p>Melihat tingkat agregat provinsi sering kali menyembunyikan kontras ekstrem antar-kabupaten/kota. Dari 514 daerah di Indonesia, TPT tertinggi tercatat di <b>Kota Ambon (11,37%)</b> dan <b>Kota Sorong (10,35%)</b>.</p>` +
          `<p>Secara umum, rata-rata TPT di <b>98 wilayah Kota (5,89%)</b> jauh lebih tinggi dibandingkan rata-rata <b>416 Kabupaten (3,78%)</b>. Kota-kota besar menjadi magnet migrasi angkatan kerja terdidik, namun daya serap sektor formal terbatas sehingga menciptakan antrean pencari kerja yang panjang.</p>` +
          `<p>Sebaliknya, kabupaten dengan TPT terendah berada di wilayah pegunungan dan agraris seperti <b>Kab. Puncak (0,14%)</b> dan <b>Kab. Lanny Jaya (0,50%)</b>, di mana hampir seluruh penduduk aktif bekerja di pertanian subsisten mandiri.</p>`,
        fig: `<div class="fig-t">Rentang Ekstrem TPT Kabupaten/Kota di Indonesia (${lastPer})</div>` +
          `<div class="hb">` +
          [
            { nama: 'Kota Ambon (Maluku)', val: 11.37, ket: 'Tertinggi #1 di Indonesia', color: '#dc2626' },
            { nama: 'Kota Sorong (Papua B. Daya)', val: 10.35, ket: 'Tertinggi #2 di Indonesia', color: '#ea580c' },
            { nama: 'Kota Padang (Sumbar)', val: 9.70, ket: 'Tertinggi #3 di Indonesia', color: '#f97316' },
            { nama: 'Rata-rata 98 Kota', val: 5.89, ket: 'Agregat Daerah Kota', color: '#2563eb' },
            { nama: 'Rata-rata 416 Kabupaten', val: 3.78, ket: 'Agregat Daerah Kabupaten', color: '#059669' },
            { nama: 'Kab. Lanny Jaya (Papua Peg.)', val: 0.50, ket: 'Salah satu terendah', color: '#10b981' },
            { nama: 'Kab. Puncak (Papua Tengah)', val: 0.14, ket: 'Terendah di Indonesia', color: '#10b981' }
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
      <div class="story-in">
        <header class="story-head">
          <h1>Cerita &amp; Wawasan di Balik Angka Pengangguran Indonesia</h1>
          <p class="lede">
            Pada Sakernas ${lastPer}, angka ${termI('tpt')} resmi nasional tercatat <b>${fmtAngka(natTpt, 2)}%</b> dengan <b>${fmtAngka(natPeng)} jiwa</b> penganggur terbuka. Di balik angka tunggal tersebut, terdapat dinamika ketenagakerjaan yang kaya antarwilayah, kelompok umur, kesetaraan gender, hingga capaian sasaran RPJMN.
          </p>
          <p class="lede how">
            Halaman ini merangkum <b>8 bab temuan analitis terkurasi</b> dari angka resmi BPS dan Bappenas. Kata dengan garis bawah titik-titik memiliki penjelasan ringkas saat disentuh atau diarahkan kursor.
          </p>
        </header>

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

    // Tooltip interaktif untuk istilah ketenagakerjaan
    host.querySelectorAll('.term').forEach(el => {
      el.addEventListener('mouseenter', ev => {
        const k = el.dataset.tipKey;
        if (GLOSS_INSIGHT[k]) {
          I.tampilTip(ev, [I.tipNama(GLOSS_INSIGHT[k].t), I.tipSub(GLOSS_INSIGHT[k].d)]);
        }
      });
      el.addEventListener('mouseleave', () => I.sembunyiTip());
    });

    // Inisialisasi SVG chart tren 40 tahun
    const pts = tptSr.periode.map((p, i) => ({ t: +p, y: tptSr.nilai['00'][i] })).filter(p => p.y != null);
    const drawChartTren = () => {
      const cEl = host.querySelector('#chart-ins-tren');
      if (!cEl) return;
      insStoryChart(cEl, {
        t0: 1986,
        t1: 2025,
        lo: 0,
        hi: 12,
        xs: 5,
        yf: v => v + '%',
        body: ({ X, Y, lo, pad }) => {
          const dStr = pts.map((p, k) => (k ? 'L' : 'M') + X(p.t).toFixed(1) + ' ' + Y(p.y).toFixed(1)).join('');
          const base = Y(0).toFixed(1);
          const area = `<path d="${dStr}L${X(pts[pts.length - 1].t).toFixed(1)} ${base}L${X(pts[0].t).toFixed(1)} ${base}Z" fill="rgba(37, 99, 235, 0.12)"/>`;
          const line = `<path class="ln" d="${dStr}" fill="none" stroke="#2563eb" stroke-width="2.5" stroke-linejoin="round" stroke-linecap="round"/>`;
          return area + line;
        },
        marks: [
          { t: 2005, y: 11.24, txt: '2005: 11,24%', anc: 'middle', dx: 0, dy: -12 },
          { t: 2020, y: 7.07, txt: '2020 (Pandemi): 7,07%', anc: 'middle', dx: 0, dy: -12 },
          { t: 2025, y: natTpt, txt: `2025: ${fmtAngka(natTpt, 2)}%`, anc: 'end', dx: -8, dy: 16 }
        ],
        label: `Grafik garis tren TPT nasional 1986 sampai 2025`
      });
    };

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
    else if (S.page === 'beranda') renderBeranda();
    else if (S.page === 'profil') renderProfil();
    else if (S.page === 'sasaran') renderSasaran();
    else if (S.page === 'insight') renderInsight();
    else renderMetode();
    tulis();
  }
  I.bacaHash(S, HALAMAN);
  I.pasangTema($('tema'), 'peng2-tema');
  document.querySelectorAll('.tabs button').forEach(b => b.addEventListener('click', () => gantiHalaman(b.dataset.page)));
  document.querySelector('.nav .logo').addEventListener('click', ev => { ev.preventDefault(); gantiHalaman('beranda'); });
  $('kaki').replaceChildren(
    h('div', { text: `Versi 2 · data dibangun ${D.dibuat} oleh Data/_skrip/bangun_dashboard_pengangguran.js --versi 2. Angka resmi BPS, Kemnaker, dan Bappenas apa adanya — tanpa hitungan mandiri; data kosong dibiarkan kosong.` }),
    h('div', { text: 'Peringkat dan kelas warna peta hanya pengurutan tampilan. Lihat Metodologi untuk sumber, tautan unduh, dan catatan per lapisan.' }));
  let tRes = null, lebarAkhir = innerWidth;
  window.addEventListener('resize', () => { clearTimeout(tRes); tRes = setTimeout(() => { if (S.page !== 'peta' && Math.abs(innerWidth - lebarAkhir) > 15) { lebarAkhir = innerWidth; render(); } }, 100); });
  render();
})();
