/* Inti tampilan v2 — Dashboard Pengangguran versi 2 (turunan dari Dashboard/_inti/inti.js)
   Sumber tunggal: Dashboard/_inti_v2/inti.js (disalin ke assets/ oleh bangun_dashboard_pengangguran.js --versi 2).
   Komponen: elemen DOM/SVG, format angka, tooltip, kelas warna tetap, peta geser/zoom + label,
   garis waktu, grafik garis (patahan seri, pita sasaran), batang bertumpuk, kecil-banyak,
   daftar batang, tabel + unduh CSV, status URL, tema.
   PRINSIP: komponen hanya menggambar angka yang diberikan — tidak menghitung angka turunan. */
(function () {
  'use strict';
  const NS = 'http://www.w3.org/2000/svg';
  const $ = id => document.getElementById(id);
  const kurangGerak = () => matchMedia('(prefers-reduced-motion: reduce)').matches;

  function h(tag, attrs, ...anak) {
    const e = document.createElement(tag);
    for (const k in attrs || {}) {
      const v = attrs[k];
      if (v == null || v === false) continue;
      if (k === 'class') e.className = v;
      else if (k === 'text') e.textContent = v;
      else if (k === 'html') e.innerHTML = v;
      else if (k.startsWith('on')) e.addEventListener(k.slice(2), v);
      else e.setAttribute(k, v === true ? '' : v);
    }
    anak.flat(Infinity).forEach(c => c != null && c !== false && e.append(c instanceof Node ? c : document.createTextNode(String(c))));
    return e;
  }
  function s(tag, attrs, ...anak) {
    const e = document.createElementNS(NS, tag);
    for (const k in attrs || {}) {
      const v = attrs[k];
      if (v == null) continue;
      if (k === 'text') e.textContent = v;
      else if (k.startsWith('on')) e.addEventListener(k.slice(2), v);
      else e.setAttribute(k, v);
    }
    anak.flat(Infinity).forEach(c => c != null && e.append(c));
    return e;
  }

  // ---------- format ----------
  const nfC = {};
  const nf = d => (nfC[d] = nfC[d] || new Intl.NumberFormat('id-ID', { minimumFractionDigits: d, maximumFractionDigits: d }));
  const fmtAngka = (v, d = 0) => (v == null || Number.isNaN(v) ? '—' : nf(d).format(v));
  const nfKompak = new Intl.NumberFormat('id-ID', { notation: 'compact', maximumFractionDigits: 1 });
  const nfSumbu = new Intl.NumberFormat('id-ID', { maximumFractionDigits: 2 });
  const fmtSumbu = v => (Math.abs(v) >= 10000 ? nfKompak.format(v) : nfSumbu.format(v));
  const BLN = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
  const BLN_PANJANG = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];
  // periode: '2025' | '2025-08' (bulan) | '2025-Q1' (triwulan)
  function lblPer(p, panjang) {
    if (!p) return '—';
    let m = /^(\d{4})-(\d{2})$/.exec(p);
    if (m) return (panjang ? BLN_PANJANG : BLN)[+m[2] - 1] + ' ' + m[1];
    m = /^(\d{4})-Q(\d)$/.exec(p);
    if (m) return 'Tw ' + ['I', 'II', 'III', 'IV'][+m[2] - 1] + ' ' + m[1];
    return p;
  }

  // ---------- tooltip ----------
  let tip = null;
  function tampilTip(ev, isi) {
    tip = tip || $('tip');
    if (!tip) return;
    tip.replaceChildren(...isi.filter(Boolean));
    tip.style.display = 'block';
    const pad = 14, r = tip.getBoundingClientRect();
    const cx = ev.clientX, cy = ev.clientY;
    let x = cx + pad, y = cy + pad;
    if (x + r.width > innerWidth - 8) x = cx - r.width - pad;
    if (y + r.height > innerHeight - 8) y = cy - r.height - pad;
    tip.style.left = Math.max(4, x) + 'px';
    tip.style.top = Math.max(4, y) + 'px';
  }
  const sembunyiTip = () => { tip = tip || $('tip'); if (tip) tip.style.display = 'none'; };
  const tipNama = t => h('div', { class: 't-nm', text: t });
  const tipBaris = (nilaiTeks, label, warna, kotak) => h('div', { class: 't-row' }, warna ? h('i', { class: kotak ? 'kotak' : null, style: (kotak ? 'background:' : 'border-color:') + warna }) : null, h('b', { text: nilaiTeks }), label ? h('span', { text: label }) : null);
  const tipSub = t => h('div', { class: 't-sub', text: t });

  // ---------- kelas warna tetap ----------
  // br = batas naik (n-1 angka) → n kelas; warna var(--seq-1..7) disebar merata
  function kelasTetap(br) {
    const n = br.length + 1;
    const langkah = i => (n === 1 ? 4 : 1 + Math.round(i * 6 / (n - 1)));
    const idx = v => { let i = 0; while (i < br.length && v >= br[i]) i++; return i; };
    return {
      br, n, idx,
      warna: v => (v == null ? null : `var(--seq-${langkah(idx(v))})`),
      warnaIdx: i => `var(--seq-${langkah(i)})`,
    };
  }
  function legendaKelas(host, { kelas, fmt, judul, nilaiAktif, adaKosong, ket }) {
    const sk = h('div', { class: 'skala', role: 'list', 'aria-label': 'Skala warna' });
    for (let i = 0; i < kelas.n; i++) {
      const lo = i === 0 ? null : kelas.br[i - 1], hi = i === kelas.n - 1 ? null : kelas.br[i];
      const teks = lo == null ? '< ' + fmt(hi) : hi == null ? '≥ ' + fmt(lo) : fmt(lo) + '–' + fmt(hi);
      const pendek = lo == null ? '<' + fmt(hi) : fmt(lo);
      sk.append(h('span', { role: 'listitem', 'aria-label': teks, class: nilaiAktif != null && kelas.idx(nilaiAktif) === i ? 'aktif' : null, title: teks }, h('i', { style: 'background:' + kelas.warnaIdx(i) }), h('small', { text: pendek })));
    }
    host.replaceChildren(...[judul ? h('div', { class: 'jdl', text: judul }) : null, sk,
      adaKosong ? h('div', { class: 'ket' }, h('span', { class: 'kosong-kotak' }), 'Tidak ada angka resmi') : null,
      h('div', { class: 'ket', text: 'Angka di bawah warna = batas bawah kelas.' + (ket ? ' ' + ket : '') })].filter(Boolean));
  }

  // =====================================================================
  // PETA geser/zoom + label
  // =====================================================================
  // opsi: { wil, onPilih(k), onHover(ev,k|null), sisipan: () => ({kiri,kanan,atas,bawah}), statis (tanpa geser/zoom) }
  function Peta(host, opsi) {
    const WIL = opsi.wil;
    const [bx, by, bw, bh] = WIL.viewBox.split(' ').map(Number);
    host.replaceChildren();
    const svg = s('svg', { class: 'peta', role: 'img', 'aria-label': 'Peta Indonesia', preserveAspectRatio: 'none' });
    const gLain = s('g', { class: 'darat-lain' }), gW = s('g', { class: 'darat' }), gSorot = s('g', { class: 'sorot' });
    svg.append(gLain, gW, gSorot);
    const lab = s('svg', { class: 'label-lapis', 'aria-hidden': 'true' });
    host.append(svg, lab);
    let level = null, paths = {}, P = null;
    let vb = { x: bx, y: by, w: bw, h: bh };
    let pilihK = null, hoverK = null, provBatas = null;
    let labelKand = [], labelMaks = 30;
    const ukuran = () => ({ cw: host.clientWidth || 800, ch: host.clientHeight || 600 });
    const skala = () => ukuran().cw / vb.w;
    function terapkan() {
      const { cw, ch } = ukuran();
      vb.h = vb.w * ch / cw; // rasio viewBox = rasio kotak → tidak ada sela
      svg.setAttribute('viewBox', `${vb.x} ${vb.y} ${vb.w} ${vb.h}`);
      jadwalLabel();
    }
    function sisip() { const o = (opsi.sisipan && opsi.sisipan()) || {}; return { kiri: o.kiri || 0, kanan: o.kanan || 0, atas: o.atas || 0, bawah: o.bawah || 0 }; }
    // tampilan yang memuat kotak [x0,y0,x1,y1] di area yang tidak tertutup panel
    function vbUntuk(bb, padF = 0.08) {
      const { cw, ch } = ukuran(), S = sisip();
      const aw = Math.max(80, cw - S.kiri - S.kanan), ah = Math.max(80, ch - S.atas - S.bawah);
      const w = (bb[2] - bb[0]) * (1 + 2 * padF) + 4, hh = (bb[3] - bb[1]) * (1 + 2 * padF) + 4;
      const k = Math.min(aw / w, ah / hh);
      const cx = (bb[0] + bb[2]) / 2, cy = (bb[1] + bb[3]) / 2;
      return { x: cx - (S.kiri + aw / 2) / k, y: cy - (S.atas + ah / 2) / k, w: cw / k, h: ch / k };
    }
    let anim = null;
    function keVb(t, animasi = true) {
      cancelAnimationFrame(anim);
      if (!animasi || kurangGerak()) { vb = t; terapkan(); return; }
      const a = { ...vb }, t0 = performance.now(), D = 480;
      const ease = x => 1 - Math.pow(1 - x, 3);
      const step = now => {
        const p = Math.min(1, (now - t0) / D), e = ease(p);
        // interpolasi skala secara logaritmik agar zoom terasa rata
        const w = Math.exp(Math.log(a.w) + (Math.log(t.w) - Math.log(a.w)) * e);
        const cxA = a.x + a.w / 2, cyA = a.y + a.h / 2, cxT = t.x + t.w / 2, cyT = t.y + t.h / 2;
        const cx = cxA + (cxT - cxA) * e, cy = cyA + (cyT - cyA) * e;
        const { cw, ch } = ukuran();
        vb = { x: cx - w / 2, y: cy - w * ch / cw / 2, w, h: w * ch / cw };
        terapkan();
        if (p < 1) anim = requestAnimationFrame(step);
      };
      anim = requestAnimationFrame(step);
    }
    const semua = () => vbUntuk([bx, by, bx + bw, by + bh], 0.01);
    function zoomDi(f, px, py) { // f < 1 = perbesar; (px,py) piksel di host
      const { cw } = ukuran();
      const nw = Math.min(bw * 1.6, Math.max(bw / 60, vb.w * f));
      const k0 = cw / vb.w, k1 = cw / nw;
      const mx = vb.x + px / k0, my = vb.y + py / k0;
      vb = { x: mx - px / k1, y: my - py / k1, w: nw, h: vb.h };
      terapkan();
    }
    // --- interaksi: seret, roda, cubit, klik ---
    const ptr = new Map();
    let seret = null, cubit = null, gerak = 0;
    const posHost = ev => { const r = host.getBoundingClientRect(); return [ev.clientX - r.left, ev.clientY - r.top]; };
    host.addEventListener('pointerdown', ev => {
      if (ev.button !== 0 && ev.pointerType === 'mouse') return;
      ptr.set(ev.pointerId, posHost(ev));
      host.setPointerCapture && host.setPointerCapture(ev.pointerId);
      gerak = 0;
      if (ptr.size === 1) seret = { p: posHost(ev), vb: { ...vb } };
      if (ptr.size === 2) { const [a, b] = [...ptr.values()]; cubit = { d: Math.hypot(a[0] - b[0], a[1] - b[1]), w: vb.w }; seret = null; }
    });
    host.addEventListener('pointermove', ev => {
      if (ptr.has(ev.pointerId)) ptr.set(ev.pointerId, posHost(ev));
      if (cubit && ptr.size === 2) {
        const [a, b] = [...ptr.values()], d = Math.hypot(a[0] - b[0], a[1] - b[1]);
        const f = (cubit.w * cubit.d / Math.max(10, d)) / vb.w;
        zoomDi(f, (a[0] + b[0]) / 2, (a[1] + b[1]) / 2); gerak = 99; return;
      }
      if (seret && ptr.size === 1 && !opsi.statis) {
        const [x, y] = posHost(ev), dx = x - seret.p[0], dy = y - seret.p[1];
        gerak = Math.max(gerak, Math.hypot(dx, dy));
        if (gerak > 4) {
          host.classList.add('geser');
          const k = skala();
          vb = { ...seret.vb, x: seret.vb.x - dx / k, y: seret.vb.y - dy / k, h: vb.h };
          terapkan(); sembunyiTip(); return;
        }
      }
      if (!ptr.size) { const k = kodeDari(ev); setHover(k); opsi.onHover && opsi.onHover(ev, k); }
    });
    const lepas = ev => {
      const klik = ptr.size === 1 && gerak <= 4 && ev.type === 'pointerup';
      ptr.delete(ev.pointerId);
      if (ptr.size < 2) cubit = null;
      if (!ptr.size) { seret = null; host.classList.remove('geser'); }
      if (klik) { const k = kodeDari(ev); opsi.onPilih && opsi.onPilih(k); }
    };
    host.addEventListener('pointerup', lepas);
    host.addEventListener('pointercancel', lepas);
    host.addEventListener('pointerleave', () => { if (!ptr.size) { setHover(null); opsi.onHover && opsi.onHover(null, null); } });
    if (!opsi.statis) host.addEventListener('wheel', ev => {
      ev.preventDefault();
      const [x, y] = posHost(ev);
      zoomDi(Math.exp(ev.deltaY * (ev.deltaMode === 1 ? 0.05 : 0.0016)), x, y);
    }, { passive: false });
    if (!opsi.statis) host.addEventListener('dblclick', ev => { const [x, y] = posHost(ev); zoomDi(0.5, x, y); });
    function kodeDari(ev) {
      const el = document.elementFromPoint(ev.clientX, ev.clientY);
      const t = el && el.closest && el.closest('path.w');
      return t && svg.contains(t) ? t.getAttribute('data-k') : null;
    }
    // keyboard: wilayah dapat difokus (provinsi) → Enter memilih
    svg.addEventListener('keydown', ev => {
      const t = ev.target.closest && ev.target.closest('path.w'); if (!t) return;
      if (ev.key === 'Enter' || ev.key === ' ') { ev.preventDefault(); opsi.onPilih && opsi.onPilih(t.getAttribute('data-k')); }
    });
    svg.addEventListener('focusin', ev => {
      const t = ev.target.closest && ev.target.closest('path.w'); if (!t) return;
      const r = t.getBoundingClientRect(); setHover(t.getAttribute('data-k'));
      opsi.onHover && opsi.onHover({ clientX: r.right, clientY: r.top }, t.getAttribute('data-k'));
    });
    svg.addEventListener('focusout', () => { setHover(null); sembunyiTip(); });

    function gambarSorot() {
      gSorot.replaceChildren();
      if (provBatas && WIL.peta.prov.paths[provBatas]) gSorot.append(s('path', { class: 'prov-batas', d: WIL.peta.prov.paths[provBatas] }));
      if (pilihK && P && P.paths[pilihK]) gSorot.append(s('path', { class: 'sel-luar', d: P.paths[pilihK] }), s('path', { class: 'sel-dalam', d: P.paths[pilihK] }));
      if (hoverK && hoverK !== pilihK && P && P.paths[hoverK]) gSorot.append(s('path', { class: 'hov', d: P.paths[hoverK] }));
    }
    function setHover(k) { if (k === hoverK) return; hoverK = k; gambarSorot(); }

    // --- label ---
    let rafL = 0;
    function jadwalLabel() { cancelAnimationFrame(rafL); rafL = requestAnimationFrame(gambarLabel); }
    const ukurTeks = (t, px) => t.length * px * 0.56 + 4;
    function gambarLabel() {
      lab.replaceChildren();
      if (!P || !labelKand.length) return;
      const { cw, ch } = ukuran(), S = sisip(), k = cw / vb.w;
      const ditempat = [];
      const tabrak = b => ditempat.some(a => !(b[2] < a[0] || b[0] > a[2] || b[3] < a[1] || b[1] > a[3]));
      const bebas = b => b[0] >= S.kiri + 2 && b[2] <= cw - S.kanan - 2 && b[1] >= S.atas + 2 && b[3] <= ch - S.bawah - 2;
      let n = 0;
      for (const c of labelKand) {
        if (n >= labelMaks && !c.wajib) continue;
        const t = P.titik[c.kode]; if (!t) continue;
        const ax = (t[0] - vb.x) * k, ay = (t[1] - vb.y) * k, rBebas = t[2] * k;
        if (ax < S.kiri || ax > cw - S.kanan || ay < S.atas || ay > ch - S.bawah) continue;
        const w = Math.max(ukurTeks(c.nama, 11.5), c.nilai ? ukurTeks(c.nilai, 11) : 0), hh = c.nilai ? 28 : 15;
        // kandidat posisi: di tengah (bila wilayah cukup lega) lalu bergeser dengan garis penunjuk
        const pos = [];
        if (rBebas * 2.2 >= Math.min(w, 60) || c.wajib) pos.push([ax, ay, false]);
        const off = 26;
        pos.push([ax + off + w / 2, ay - off * 0.6, true], [ax - off - w / 2, ay - off * 0.6, true], [ax, ay - off - hh / 2, true], [ax, ay + off + hh / 2, true]);
        for (const [x, y, garis] of pos) {
          const b = [x - w / 2, y - hh / 2, x + w / 2, y + hh / 2];
          if (tabrak(b) || !bebas(b)) continue;
          ditempat.push(b, [ax - 3, ay - 3, ax + 3, ay + 3]);
          if (garis) {
            const ex = Math.max(b[0], Math.min(ax, b[2])), ey = Math.max(b[1], Math.min(ay, b[3]));
            lab.append(s('line', { x1: ax, y1: ay, x2: ex, y2: ey }), s('circle', { cx: ax, cy: ay, r: 2.5 }));
          }
          const tx = s('text', { x, y: y + (c.nilai ? -2 : 4), 'text-anchor': 'middle' });
          tx.append(s('tspan', { class: 'nm', text: c.nama }));
          if (c.nilai) tx.append(s('tspan', { class: 'v', x, dy: 13, text: c.nilai }));
          lab.append(tx);
          n++;
          break;
        }
      }
    }
    new ResizeObserver(() => terapkan()).observe(host);

    const api = {
      svg,
      setLevel(lv) {
        if (lv === level) return;
        level = lv; P = WIL.peta[lv];
        gLain.replaceChildren(); gW.replaceChildren(); paths = {};
        (P.lain || []).forEach(d => gLain.append(s('path', { class: 'lain', d })));
        const kode = lv === 'kab' ? WIL.kabkota.map(k => k.kode) : WIL.provinsi.map(p => p.kode).sort();
        for (const k of kode) {
          const d = P.paths[k]; if (!d) continue;
          const p = s('path', { class: 'w' + (lv === 'kab' ? ' kab' : ''), d, 'data-k': k });
          if (lv === 'prov') { p.setAttribute('tabindex', '0'); p.setAttribute('aria-label', (WIL.provinsi.find(x => x.kode === k) || {}).nama || k); }
          gW.append(p); paths[k] = p;
        }
        gambarSorot();
      },
      warnai(fn) { for (const k in paths) { const w = fn(k); paths[k].style.fill = w || 'url(#arsir)'; } },
      redupkan(fn) { for (const k in paths) paths[k].classList.toggle('redup', !!fn && !fn(k)); },
      pilih(k) { pilihK = k; gambarSorot(); },
      batasProv(k) { provBatas = k; gambarSorot(); },
      label(kand, maks = 30) { labelKand = kand; labelMaks = maks; jadwalLabel(); },
      zoomKe(bb, animasi = true) { keVb(bb ? vbUntuk(bb) : semua(), animasi); },
      zoomDi(f) { const { cw, ch } = ukuran(), S = sisip(); zoomDi(f, S.kiri + (cw - S.kiri - S.kanan) / 2, S.atas + (ch - S.atas - S.bawah) / 2); },
      semua(animasi = true) { keVb(semua(), animasi); },
      tampilan: () => ({ ...vb }),
      setTampilan(v) { vb = { ...v }; terapkan(); },
      skala,
    };
    // pola arsiran untuk "tidak ada data"
    svg.prepend(s('defs', {}, s('pattern', { id: 'arsir', width: 6, height: 6, patternUnits: 'userSpaceOnUse', patternTransform: 'rotate(45)' },
      s('rect', { width: 6, height: 6, fill: 'var(--nodata)' }), s('line', { x1: 0, y1: 0, x2: 0, y2: 6, stroke: 'var(--nodata-line)', 'stroke-width': 1.4 }))));
    vb = semua(); terapkan();
    return api;
  }

  // =====================================================================
  // GARIS WAKTU
  // =====================================================================
  // host berisi kontrol; opsi.onUbah(periode); setPeriode(list, aktif)
  function GarisWaktu(host, { onUbah, lbl = lblPer }) {
    let daftar = [], aktif = null, timer = null, cepat = 1;
    const tombol = h('button', { class: 'putar', type: 'button', 'aria-label': 'Putar deret waktu', text: '▶' });
    const label = h('output', { class: 'lbl', 'aria-live': 'polite' });
    const rg = h('input', { type: 'range', min: 0, max: 0, step: 1, 'aria-label': 'Periode' });
    const cepatEl = h('div', { class: 'cepat', role: 'group', 'aria-label': 'Kecepatan' });
    const tanda = h('div', { class: 'tanda', 'aria-hidden': 'true' });
    [1, 2, 4].forEach(c => cepatEl.append(h('button', { type: 'button', 'aria-pressed': c === 1 ? 'true' : 'false', text: c + '×', onclick: ev => { cepat = c; [...cepatEl.children].forEach(b => b.setAttribute('aria-pressed', b === ev.currentTarget ? 'true' : 'false')); if (timer) { berhenti(); mulai(); } } })));
    host.replaceChildren(tombol, h('div', { class: 'baris' }, rg), h('div', { class: 'baris' }, label, cepatEl), tanda);
    rg.addEventListener('input', () => { aktif = daftar[+rg.value]; perbarui(); onUbah(aktif); });
    tombol.addEventListener('click', () => (timer ? berhenti() : mulai()));
    function mulai() {
      if (!daftar.length) return;
      if (daftar.indexOf(aktif) >= daftar.length - 1) { aktif = daftar[0]; perbarui(); onUbah(aktif); }
      tombol.textContent = '❚❚'; tombol.setAttribute('aria-label', 'Hentikan');
      timer = setInterval(() => {
        const i = daftar.indexOf(aktif);
        if (i < 0 || i >= daftar.length - 1) { berhenti(); return; }
        aktif = daftar[i + 1]; perbarui(); onUbah(aktif);
      }, 1100 / cepat);
    }
    function berhenti() { clearInterval(timer); timer = null; tombol.textContent = '▶'; tombol.setAttribute('aria-label', 'Putar deret waktu'); }
    function perbarui() {
      rg.max = Math.max(0, daftar.length - 1);
      rg.value = Math.max(0, daftar.indexOf(aktif));
      rg.setAttribute('aria-valuetext', lbl(aktif));
      label.textContent = lbl(aktif);
    }
    function gambarTanda() {
      tanda.replaceChildren();
      if (daftar.length < 2) return;
      // tanda tahun (maks ±7 label)
      const tahun = []; daftar.forEach((p, i) => { const y = p.slice(0, 4); if (!tahun.length || tahun[tahun.length - 1][0] !== y) tahun.push([y, i]); });
      const step = Math.ceil(tahun.length / 7);
      // label terakhir selalu tampil; label lain dilewati bila terlalu dekat (< 9% lebar)
      const pos = i => (i / (daftar.length - 1)) * 100;
      const akhir = tahun[tahun.length - 1];
      tahun.forEach(([y, i], j) => {
        if (j !== tahun.length - 1 && (j % step || pos(akhir[1]) - pos(i) < 9)) return;
        tanda.append(h('span', { style: `left:${pos(i)}%`, text: y }));
      });
    }
    return {
      set(list, a) { const beda = list.join() !== daftar.join(); daftar = list; aktif = a; if (beda) gambarTanda(); perbarui(); },
      berhenti, sedangPutar: () => !!timer,
    };
  }

  // =====================================================================
  // GRAFIK
  // =====================================================================
  function ticks(min, max, n) {
    const span = max - min || 1, st0 = span / n, mag = 10 ** Math.floor(Math.log10(st0)), e = st0 / mag;
    const st = (e >= 7.5 ? 10 : e >= 3.5 ? 5 : e >= 1.5 ? 2 : 1) * mag;
    const out = [];
    for (let v = Math.floor(min / st) * st; v <= Math.ceil(max / st) * st + st / 2; v += st) out.push(+v.toFixed(10));
    return out;
  }
  // sumbu x periode: label disaring agar tidak bertumpuk
  function labelSumbuX(svg, periode, X, H, lebarMin, kecil) {
    const n = periode.length;
    if (kecil) {
      const t = p => (/^\d{4}$/.test(p) ? p : p.slice(0, 4));
      svg.append(s('text', { x: X(0), y: H - 6, 'text-anchor': 'start', text: t(periode[0]) }));
      if (n > 1 && t(periode[n - 1]) !== t(periode[0])) svg.append(s('text', { x: X(n - 1), y: H - 6, 'text-anchor': 'end', text: t(periode[n - 1]) }));
      return;
    }
    const tahunan = periode.every(p => /^\d{4}$/.test(p));
    const subTahun = !tahunan && n > 10 && periode.every(p => /^\d{4}-(Q\d|\d{2})$/.test(p));
    if (!tahunan && !subTahun) lebarMin = Math.max(lebarMin, Math.max(...periode.map(p => String(lblPer(p)).length)) * 6.2 + 10);
    let akhir = -Infinity;
    periode.forEach((p, i) => {
      const x = X(i);
      const t = tahunan || subTahun ? p.slice(0, 4) : lblPer(p);
      if (subTahun && i > 0 && periode[i - 1].slice(0, 4) === p.slice(0, 4)) return;
      if (x - akhir < lebarMin && i !== n - 1) return;
      if (i === n - 1 && x - akhir < lebarMin * 0.8) return;
      svg.append(s('text', { x, y: H - 6, 'text-anchor': i === 0 ? 'start' : i === n - 1 ? 'end' : 'middle', text: t }));
      akhir = x;
    });
  }

  // Highcharts-style Catmull-Rom smooth spline path builder
  function catmullRomSpline(pts, closed = false) {
    if (!pts || pts.length < 2) return '';
    if (pts.length === 2) return `M${pts[0][0].toFixed(1)} ${pts[0][1].toFixed(1)}L${pts[1][0].toFixed(1)} ${pts[1][1].toFixed(1)}`;
    let d = `M${pts[0][0].toFixed(1)} ${pts[0][1].toFixed(1)}`;
    const tension = 0.28;
    for (let i = 0; i < pts.length - 1; i++) {
      const p0 = i > 0 ? pts[i - 1] : pts[i];
      const p1 = pts[i];
      const p2 = pts[i + 1];
      const p3 = i < pts.length - 2 ? pts[i + 2] : p2;

      const cp1x = p1[0] + (p2[0] - p0[0]) * tension;
      const cp1y = p1[1] + (p2[1] - p0[1]) * tension;
      const cp2x = p2[0] - (p3[0] - p1[0]) * tension;
      const cp2y = p2[1] - (p3[1] - p1[1]) * tension;

      d += ` C${cp1x.toFixed(1)} ${cp1y.toFixed(1)}, ${cp2x.toFixed(1)} ${cp2y.toFixed(1)}, ${p2[0].toFixed(1)} ${p2[1].toFixed(1)}`;
    }
    return d;
  }

  // seri: [{nama, warna, data:[[per,v]], utama, asal:{per:'D'}, putus}] ;
  // opsi: patahan [{antara:[p1,p2], ket}], pita [{dari, sampai, lo, hi, label}], periodeTambahan [], aktif, onKlik, fmt, tinggi, kecil, nol, legenda
  function grafikGaris(host, o) {
    let animId = 0;
    function gambar() {
      host.replaceChildren();
      const daftar = o.seri.filter(x => x.data && x.data.length);
      const fmt = o.fmt || (v => fmtAngka(v, 2));
      let periode = [...new Set(daftar.flatMap(x => x.data.map(d => d[0])).concat(o.periodeTambahan || []))].sort();
      const ada = daftar.some(x => x.data.some(d => d[1] != null));
      if (!periode.length || !ada) { host.append(h('div', { class: 'kecil', text: 'Tidak ada angka resmi.' })); return; }
      let legEl = null;
      if ((o.legenda !== false) && (daftar.length >= 2 || (o.pita && o.pita.length) || (o.patahan && o.patahan.length)) && !o.kecil) {
        const legPita = [];
        const seenLeg = new Set();
        (o.pita || []).forEach(p => {
          const lbl = p.legenda || 'Rentang sasaran';
          if (seenLeg.has(lbl)) return;
          seenLeg.add(lbl);
          legPita.push(h('span', {}, h('i', { class: 'pita' + (p.cls ? ' ' + p.cls : '') }), lbl));
        });
        legEl = h('div', { class: 'leg' },
          daftar.length >= 2 ? daftar.map((x, idx) => h('span', { class: 'leg-item', 'data-seri-idx': String(idx), tabindex: '0', role: 'button', title: 'Klik atau arahkan kursor untuk menyorot ' + x.nama }, h('i', { class: x.putus ? 'putus' : null, style: 'border-color:' + x.warna }), x.nama)) : null,
          ...legPita,
          (o.patahan || []).some(p => periode.includes(p.antara[0]) && periode.includes(p.antara[1])) ? h('span', {}, h('i', { class: 'putus', style: 'border-color:var(--context)' }), 'Patahan seri (tidak sepenuhnya sebanding)') : null,
          daftar.some(x => x.asal && Object.keys(x.asal).length) ? h('span', {}, h('i', { class: 'kotak', style: 'border:1.6px solid var(--accent);border-radius:50%;background:var(--surface)' }), o.asalLabel || 'Sumber lain') : null);
        host.append(legEl);
      }
      const hostW = host.clientWidth;
      const W = Math.max(200, hostW || 520), H = o.tinggi || 220;
      const isSempit = W < 420;
      const m = o.kecil ? { l: 36, r: 24, t: 8, b: 18 } : { l: isSempit ? 42 : 52, r: isSempit ? 32 : 64, t: 14, b: 24 };
      let vals = daftar.flatMap(x => x.data.map(d => d[1])).filter(v => v != null);
      (o.pita || []).forEach(p => vals.push(p.lo, p.hi));
      if (o.rentangY) vals.push(...o.rentangY); // skala bersama (kecil-banyak)
      let lo = Math.min(...vals), hi = Math.max(...vals);
      if (o.nol) lo = Math.min(0, lo);
      if (lo === hi) { lo -= Math.abs(lo) * 0.1 || 1; hi += Math.abs(hi) * 0.1 || 1; }
      const tk = ticks(lo, hi, o.kecil || isSempit ? 3 : 4);
      lo = Math.min(lo, tk[0]); hi = Math.max(hi, tk[tk.length - 1]);
      const X = i => m.l + (periode.length === 1 ? (W - m.l - m.r) / 2 : i * (W - m.l - m.r) / (periode.length - 1));
      const Y = v => m.t + (hi - v) / (hi - lo) * (H - m.t - m.b);
      const svg = s('svg', { class: 'chart', viewBox: `0 0 ${W} ${H}`, width: '100%', height: H, preserveAspectRatio: 'xMidYMid meet', role: 'img', 'aria-label': o.label || 'Grafik garis' });
      (o.kecil ? [tk[0], tk[tk.length - 1]] : tk).forEach(t => {
        svg.append(s('line', { class: 'gridline', x1: m.l, x2: W - m.r, y1: Y(t), y2: Y(t) }));
        svg.append(s('text', { x: m.l - 6, y: Y(t) + 4, 'text-anchor': 'end', text: (o.fmtSumbu || fmtSumbu)(t) }));
      });
      labelSumbuX(svg, periode, X, H, o.kecil ? 34 : (isSempit ? 42 : 56), o.kecil);
      // pita sasaran
      (o.pita || []).forEach(p => {
        const i0 = periode.indexOf(p.dari), i1 = periode.indexOf(p.sampai);
        if (i0 < 0 || i1 < 0) return;
        const dx = p.dx || 0;
        const hw = p.lebar || 6;
        const x0 = X(i0) - (i0 === i1 ? hw : 0) + dx, x1 = X(i1) + (i0 === i1 ? hw : 0) + dx;
        const clsPita = 'pita' + (p.cls ? ' ' + p.cls : '');
        const clsTepi = 'pita-tepi' + (p.cls ? ' ' + p.cls : '');
        svg.append(s('rect', { class: clsPita, x: x0, y: Y(p.hi), width: Math.max(2, x1 - x0), height: Math.max(2, Y(p.lo) - Y(p.hi)) }));
        svg.append(s('rect', { class: clsTepi, x: x0, y: Y(p.hi), width: Math.max(2, x1 - x0), height: Math.max(2, Y(p.lo) - Y(p.hi)) }));
        if (p.label && !o.kecil && !isSempit) svg.append(s('text', { class: 'anot', x: (x0 + x1) / 2, y: Y(p.hi) - (p.dyLabel || 5), 'text-anchor': x1 > W - m.r - 30 ? 'end' : 'middle', text: p.label }));
      });
      // patahan seri: garis vertikal tipis di antara dua periode
      const patah = new Set();
      (o.patahan || []).forEach(p => {
        const i0 = periode.indexOf(p.antara[0]), i1 = periode.indexOf(p.antara[1]);
        if (i0 < 0 || i1 < 0) return;
        patah.add(p.antara[0] + '|' + p.antara[1]);
        const x = (X(i0) + X(i1)) / 2;
        svg.append(s('line', { class: 'patah', x1: x, x2: x, y1: m.t, y2: H - m.b }));
        if (!o.kecil && !isSempit) svg.append(s('text', { class: 'anot', x: x + 4, y: m.t + 8, text: 'patahan seri' }));
      });
      // penanda periode aktif
      if (o.aktif && periode.includes(o.aktif)) { const x = X(periode.indexOf(o.aktif)); svg.append(s('line', { class: 'aktif-garis', x1: x, x2: x, y1: m.t, y2: H - m.b })); }
      const mp = daftar.map(x => new Map(x.data));
      const ujung = [];
      daftar.map((x, j) => [x, j]).sort((a, b) => (a[0].utama ? 1 : 0) - (b[0].utama ? 1 : 0)).forEach(([x, j]) => {
        const M = mp[j];
        const titik = periode.map((p, i) => (M.get(p) == null ? null : [X(i), Y(M.get(p)), p]));
        const validPts = titik.filter(Boolean);
        let d = '', dPutus = '';
        if (validPts.length >= 2) {
          if (x.putus) {
            dPutus = catmullRomSpline(validPts);
          } else {
            d = catmullRomSpline(validPts);
          }
        }

        // Highcharts Area Gradient Fill
        if (o.area && x.utama && daftar.length === 1 && validPts.length > 1) {
          const gradId = 'area-grad-' + Math.random().toString(36).slice(2, 7);
          const defs = s('defs');
          const grad = s('linearGradient', { id: gradId, x1: '0', y1: '0', x2: '0', y2: '1' });
          grad.append(
            s('stop', { offset: '0%', 'stop-color': x.warna, 'stop-opacity': '0.35' }),
            s('stop', { offset: '100%', 'stop-color': x.warna, 'stop-opacity': '0.02' })
          );
          defs.append(grad);
          svg.prepend(defs);

          const splinePath = catmullRomSpline(validPts);
          const areaD = splinePath + ` L${validPts[validPts.length - 1][0].toFixed(1)} ${(H - m.b).toFixed(1)} L${validPts[0][0].toFixed(1)} ${(H - m.b).toFixed(1)} Z`;
          svg.append(s('path', { class: 'area-smooth', fill: `url(#${gradId})`, d: areaD }));
        }

        const gSeri = s('g', { class: 'seri-grup', 'data-seri-idx': String(j) });
        if (d) gSeri.append(s('path', { class: 'ln', d, stroke: x.warna }));
        if (dPutus) gSeri.append(s('path', { class: 'ln putus', d: dPutus, stroke: x.warna }));

        // Titik-titik data (markers) dengan efek Highcharts
        validPts.forEach((a) => {
          gSeri.append(s('circle', { class: 'dot-marker', cx: a[0], cy: a[1], r: isSempit ? 2.5 : 3.2, fill: '#ffffff', stroke: x.warna, 'stroke-width': isSempit ? 1.5 : 2 }));
        });

        for (let i = titik.length - 1; i >= 0; i--) {
          if (!titik[i]) continue;
          gSeri.append(s('circle', { class: 'dot-pulse', cx: titik[i][0], cy: titik[i][1], r: isSempit ? 3.5 : 4.5, fill: x.warna, stroke: '#ffffff', 'stroke-width': 2 }));
          if (x.utama && o.labelUjung !== false && !isSempit) ujung.push({ x: titik[i][0] + 7, y: titik[i][1] + 4, t: fmt(M.get(periode[i])) });
          break;
        }
        svg.append(gSeri);
      });

      // Interaktivitas Legenda Multi-Garis (Hover & Klik untuk menyorot 1 seri)
      if (legEl && daftar.length >= 2) {
        let lockedIdx = null;
        const terapkanSorot = idxAktif => {
          svg.querySelectorAll('.seri-grup').forEach(gEl => {
            const idx = gEl.getAttribute('data-seri-idx');
            gEl.classList.toggle('seri-redup', idxAktif != null && idx !== idxAktif);
            gEl.classList.toggle('seri-sorot', idxAktif != null && idx === idxAktif);
          });
          legEl.querySelectorAll('.leg-item').forEach(sp => {
            const idx = sp.getAttribute('data-seri-idx');
            sp.classList.toggle('redup', idxAktif != null && idx !== idxAktif);
            sp.classList.toggle('aktif', idxAktif != null && idx === idxAktif);
          });
        };
        legEl.querySelectorAll('.leg-item').forEach(sp => {
          const idx = sp.getAttribute('data-seri-idx');
          sp.addEventListener('mouseenter', () => { if (lockedIdx == null) terapkanSorot(idx); });
          sp.addEventListener('mouseleave', () => { if (lockedIdx == null) terapkanSorot(null); });
          sp.addEventListener('click', () => {
            lockedIdx = (lockedIdx === idx) ? null : idx;
            terapkanSorot(lockedIdx);
          });
          sp.addEventListener('keydown', ev => {
            if (ev.key === 'Enter' || ev.key === ' ') {
              ev.preventDefault();
              lockedIdx = (lockedIdx === idx) ? null : idx;
              terapkanSorot(lockedIdx);
            }
          });
        });
      }
      ujung.sort((a, b) => a.y - b.y).forEach((u, i, arr) => { if (i && u.y - arr[i - 1].y < 13) u.y = arr[i - 1].y + 13; svg.append(s('text', { class: 'endlbl', x: u.x, y: u.y, text: u.t })); });
      // garis bantu & tooltip; klik memindah periode
      const cross = s('line', { class: 'cross', y1: m.t, y2: H - m.b, visibility: 'hidden' });
      const hit = s('rect', { class: 'hit', x: m.l - 10, y: 0, width: W - m.l - m.r + 20, height: H, tabindex: o.kecil ? null : '0', style: o.onKlik ? null : 'cursor:default' });
      svg.append(cross, hit);
      const idxDari = ev => {
        const r = svg.getBoundingClientRect(), x = (ev.clientX - r.left) * (W / r.width);
        let best = 0, bd = Infinity;
        periode.forEach((p, i) => { const d0 = Math.abs(X(i) - x); if (d0 < bd) { bd = d0; best = i; } });
        return best;
      };
      const tampil = (ev, i) => {
        cross.setAttribute('x1', X(i)); cross.setAttribute('x2', X(i)); cross.setAttribute('visibility', 'visible');
        const p = periode[i];
        const pitaDi = (o.pita || []).filter(q => periode.indexOf(q.dari) <= i && i <= periode.indexOf(q.sampai));
        tampilTip(ev, [tipNama(lblPer(p, true)),
          ...daftar.map((x, j) => tipBaris(fmt(mp[j].get(p)), daftar.length > 1 ? x.nama : (x.asal && x.asal[p] ? o.asalLabel || 'sumber lain' : null), daftar.length > 1 ? x.warna : null)),
          ...pitaDi.map(q => tipSub((q.legenda || 'Sasaran') + ': ' + fmt(q.lo) + '–' + fmt(q.hi))),
          (o.patahan || []).filter(q => q.antara[1] === p).map(q => tipSub('Patahan seri: ' + q.ket)),
          o.onKlik ? tipSub('Klik untuk memilih periode ini') : null]);
      };
      hit.addEventListener('pointermove', ev => tampil(ev, idxDari(ev)));
      hit.addEventListener('pointerleave', () => { cross.setAttribute('visibility', 'hidden'); sembunyiTip(); });
      if (o.onKlik) hit.addEventListener('click', ev => o.onKlik(periode[idxDari(ev)]));
      let fi = periode.length - 1;
      hit.addEventListener('keydown', ev => {
        if (ev.key === 'Enter' && o.onKlik) { o.onKlik(periode[fi]); return; }
        if (ev.key !== 'ArrowLeft' && ev.key !== 'ArrowRight') return;
        ev.preventDefault();
        fi = Math.max(0, Math.min(periode.length - 1, fi + (ev.key === 'ArrowRight' ? 1 : -1)));
        const r = svg.getBoundingClientRect();
        tampil({ clientX: r.left + X(fi) * r.width / W, clientY: r.top + 20 }, fi);
      });
      hit.addEventListener('blur', () => { cross.setAttribute('visibility', 'hidden'); sembunyiTip(); });
      host.append(svg);
    }
    gambar();
    if (!o.kecil && typeof ResizeObserver !== 'undefined') {
      let lastW = host.clientWidth;
      const ro = new ResizeObserver(entries => {
        for (const entry of entries) {
          const newW = entry.contentRect.width;
          if (newW > 0 && Math.abs(newW - lastW) > 8) {
            lastW = newW;
            cancelAnimationFrame(animId);
            animId = requestAnimationFrame(gambar);
          }
        }
      });
      ro.observe(host);
    }
  }
  function garisMini(data, { tinggi = 34, lebar = 180 } = {}) {
    const W = lebar, H = tinggi, d = data.filter(x => x[1] != null);
    const svg = s('svg', { class: 'chart spark-chart', viewBox: `0 0 ${W} ${H}`, width: '100%', height: H, 'aria-hidden': 'true', preserveAspectRatio: 'none' });
    if (d.length < 2) return svg;
    const v = d.map(x => x[1]), lo = Math.min(...v), hi = Math.max(...v) === lo ? lo + 1 : Math.max(...v);
    const X = i => 3 + i * (W - 6) / (data.length - 1), Y = x => 4 + (hi - x) / (hi - lo) * (H - 8);
    const validPts = [];
    data.forEach((x, i) => { if (x[1] != null) validPts.push([X(i), Y(x[1])]); });
    const path = catmullRomSpline(validPts);
    svg.append(s('path', { d: path, fill: 'none', stroke: 'var(--accent)', 'stroke-width': 1.8, 'vector-effect': 'non-scaling-stroke', 'stroke-linecap': 'round' }));
    let li = data.length - 1; while (li > 0 && data[li][1] == null) li--;
    svg.append(s('circle', { cx: X(li), cy: Y(data[li][1]), r: 3.2, fill: 'var(--accent)', stroke: '#ffffff', 'stroke-width': 1.5 }));
    return svg;
  }

  // kolom bertumpuk: periode[], seri [{nama, nilai[]}] (urut tetap → warna slot tetap), total (opsional, angka resmi) []
  function grafikKolom(host, o) {
    let animId = 0;
    function gambar() {
      host.replaceChildren();
      const periode = o.periode, seri = o.seri, fmt = o.fmt || (v => fmtAngka(v, 0));
      const warna = o.warna || (j => `var(--cat-${(j % 8) + 1})`);
      if (!periode.length) { host.append(h('div', { class: 'kecil', text: 'Tidak ada angka resmi.' })); return; }
      if (seri.length > 1 || o.total) host.append(h('div', { class: 'leg' }, seri.length > 1 ? seri.map((x, j) => h('span', {}, h('i', { class: 'kotak', style: 'background:' + warna(j) }), x.nama)) : null,
        o.total ? h('span', {}, h('i', { style: 'border-color:var(--ink)' }), o.totalLabel || 'Total (angka resmi)') : null));
      const hostW = host.clientWidth;
      const W = Math.max(220, hostW || 560), H = o.tinggi || 260;
      const isSempit = W < 420;
      const m = { l: isSempit ? 44 : 56, r: 14, t: 12, b: 24 };
      const tumpuk = periode.map((p, i) => seri.reduce((a, x) => a + (x.nilai[i] || 0), 0));
      const hi0 = Math.max(...tumpuk, ...(o.total || []).filter(v => v != null), 1);
      const tk = ticks(0, hi0, 4), hi = tk[tk.length - 1];
      const bw = (W - m.l - m.r) / periode.length;
      const X = i => m.l + i * bw, Y = v => m.t + (hi - v) / hi * (H - m.t - m.b);
      const svg = s('svg', { class: 'chart', viewBox: `0 0 ${W} ${H}`, width: '100%', height: H, preserveAspectRatio: 'xMidYMid meet', role: 'img', 'aria-label': o.label || 'Grafik kolom bertumpuk' });
      tk.forEach(t => { svg.append(s('line', { class: 'gridline', x1: m.l, x2: W - m.r, y1: Y(t), y2: Y(t) }), s('text', { x: m.l - 6, y: Y(t) + 4, 'text-anchor': 'end', text: (o.fmtSumbu || fmtSumbu)(t) })); });
      labelSumbuX(svg, periode, i => X(i) + bw / 2, H, isSempit ? 34 : 44, false);
      const gap = Math.min(3, bw * 0.12), lebarK = Math.max(2, bw - Math.max(3, bw * 0.20));
      periode.forEach((p, i) => {
        let y0 = Y(0);
        seri.forEach((x, j) => {
          const v = x.nilai[i]; if (v == null || v <= 0) return;
          const hgt = Y(0) - Y(v);
          svg.append(s('rect', { class: 'kolom kolom-highchart', x: X(i) + (bw - lebarK) / 2, y: y0 - hgt + (j ? gap / 2 : 0), width: lebarK, height: Math.max(1, hgt - (j ? gap / 2 : 0)), fill: warna(j), rx: 3, ry: 3 }));
          y0 -= hgt;
        });
        if (o.total && o.total[i] != null) svg.append(s('line', { x1: X(i) + 1, x2: X(i) + bw - 1, y1: Y(o.total[i]), y2: Y(o.total[i]), stroke: 'var(--ink)', 'stroke-width': 1.5 }));
        if (o.aktif === p) svg.append(s('rect', { x: X(i), y: m.t - 4, width: bw, height: H - m.t - m.b + 4, fill: 'none', stroke: 'var(--ink-2)', 'stroke-dasharray': '2 2' }));
        const hitR = s('rect', { class: 'hit', x: X(i), y: 0, width: bw, height: H - m.b, style: o.onKlik ? null : 'cursor:default' });
        hitR.addEventListener('pointermove', ev => tampilTip(ev, [tipNama(lblPer(p, true)),
          ...seri.map((x, j) => tipBaris(fmt(x.nilai[i]), x.nama, warna(j), true)).reverse(),
          o.total ? tipBaris(fmt(o.total[i]), o.totalLabel || 'Total (angka resmi)') : null]));
        hitR.addEventListener('pointerleave', sembunyiTip);
        if (o.onKlik) hitR.addEventListener('click', () => o.onKlik(p));
        svg.append(hitR);
      });
      host.append(svg);
    }
    gambar();
    if (typeof ResizeObserver !== 'undefined') {
      let lastW = host.clientWidth;
      const ro = new ResizeObserver(entries => {
        for (const entry of entries) {
          const newW = entry.contentRect.width;
          if (newW > 0 && Math.abs(newW - lastW) > 8) {
            lastW = newW;
            cancelAnimationFrame(animId);
            animId = requestAnimationFrame(gambar);
          }
        }
      });
      ro.observe(host);
    }
  }

  // kecil-banyak: satu grafik garis per seri, skala y bersama
  function kecilBanyak(host, { periode, seri, fmt, aktif, onKlik, pita, patahan, tinggi = 90, bersama = true }) {
    host.replaceChildren();
    host.classList.add('kecil-banyak');
    const vals = seri.flatMap(x => x.nilai).filter(v => v != null);
    const lo = Math.min(...vals), hi = Math.max(...vals);
    seri.forEach(x => {
      const g = h('div');
      let li = x.nilai.length - 1; while (li > 0 && x.nilai[li] == null) li--;
      const sel = h('div');
      sel.append(h('h4', { title: x.nama, text: x.nama }), h('div', { class: 'angka', text: fmt(x.nilai[li]) }), h('div', { class: 'kecil', text: lblPer(periode[li]) }), g);
      host.append(sel);
      grafikGaris(g, { seri: [{ nama: x.nama, warna: 'var(--accent)', data: periode.map((p, i) => [p, x.nilai[i]]), utama: true }], kecil: true, tinggi, fmt, aktif, onKlik, labelUjung: false, rentangY: bersama ? [lo, hi] : null, pita, patahan });
    });
  }

  // daftar batang horizontal: baris [{kode?, nama, v, grup?, sel?}], ref (garis acuan, opsional), pita [lo,hi] (opsional)
  function daftarBatang(host, { baris, fmt, ref, pita, onPilih, grup = false, infoGrup }) {
    host.replaceChildren();
    host.classList.add('bars');
    const ada = baris.filter(b => b.v != null);
    if (!ada.length) { host.append(h('div', { class: 'kecil', style: 'grid-column:1/-1', text: 'Tidak ada angka resmi pada periode ini.' })); return; }
    const vals = ada.map(b => b.v).concat(ref != null ? [ref] : [], pita || []);
    const hi = Math.max(0, ...vals) || 1;
    const pos = v => Math.max(0, v) / hi * 100;
    let grpAkhir = null;
    for (const b of baris) {
      if (grup && b.grup !== grpAkhir) { host.append(h('div', { class: 'grp' }, h('span', { text: b.grup }), infoGrup ? h('small', { text: infoGrup(b.grup) || '' }) : null)); grpAkhir = b.grup; }
      const pilih = onPilih && b.kode ? () => onPilih(b.kode) : null;
      host.append(h('div', { class: 'nm' + (b.sel ? ' sel' : '') + (pilih ? ' klik' : ''), title: b.nama, onclick: pilih, text: b.nama }));
      const trk = h('div', { class: 'trk' });
      const pt = b.pita || pita;
      if (pt) trk.append(h('div', { class: 'pita', style: `left:${pos(pt[0])}%;width:${Math.max(0.5, pos(pt[1]) - pos(pt[0]))}%` }));
      if (b.v != null) trk.append(h('div', { class: 'br' + (b.sel ? ' sel' : ''), style: `left:0;width:${Math.max(0.4, pos(b.v))}%` }));
      if (ref != null) trk.append(h('div', { class: 'ref', style: `left:${pos(ref)}%` }));
      trk.addEventListener('pointermove', ev => tampilTip(ev, [tipNama(b.nama), tipBaris(fmt(b.v)), b.tip ? tipSub(b.tip) : null]));
      trk.addEventListener('pointerleave', sembunyiTip);
      if (pilih) { trk.style.cursor = 'pointer'; trk.addEventListener('click', pilih); }
      host.append(trk, h('div', { class: 'v' + (b.v == null ? ' kosong' : ''), text: fmt(b.v) }));
    }
  }

  // ---------- tabel + CSV ----------
  // kolom [{label, num}], baris [[{teks, sort, csv?}]] (baris.kode opsional untuk sorotan & onPilih)
  function tabel(host, { kolom, baris, sel, maks, onPilih }) {
    host.replaceChildren();
    let urut = { i: -1, naik: true };
    let kataKunci = '';

    let toolbar = null, infoJml = null;
    if (baris.length > 8) {
      const inpCari = h('input', {
        type: 'search',
        class: 'tbl-cari-input',
        placeholder: 'Cari wilayah atau kata kunci di tabel…',
        'aria-label': 'Saring baris tabel'
      });
      infoJml = h('span', { class: 'tbl-cari-info' });
      inpCari.addEventListener('input', () => {
        kataKunci = inpCari.value.trim().toLowerCase();
        gambar();
      });
      toolbar = h('div', { class: 'tbl-toolbar' }, inpCari, infoJml);
    }

    const wrap = h('div', { class: 'tbl-wrap', style: maks ? 'max-height:' + maks + 'px' : null });
    const t = h('table', { class: 'tbl' }), thead = h('thead'), tbody = h('tbody');
    const gambar = () => {
      const tersaring = !kataKunci
        ? baris
        : baris.filter(r => r.some(c => String(c.teks || '').toLowerCase().includes(kataKunci)));
      const b = urut.i < 0 ? tersaring : tersaring.slice().sort((x, y) => {
        const a = x[urut.i].sort, c = y[urut.i].sort;
        if (a == null && c == null) return 0; if (a == null) return 1; if (c == null) return -1;
        return (a < c ? -1 : a > c ? 1 : 0) * (urut.naik ? 1 : -1);
      });
      if (infoJml) {
        infoJml.textContent = kataKunci
          ? `Menampilkan ${b.length} dari ${baris.length} baris`
          : `${baris.length} baris · klik judul kolom untuk mengurutkan`;
      }
      if (!b.length) {
        tbody.replaceChildren(h('tr', {}, h('td', { colspan: String(kolom.length), class: 'tbl-kosong', text: 'Tidak ada baris yang cocok dengan pencarian.' })));
      } else {
        tbody.replaceChildren(...b.map(r => {
          const klik = onPilih && r.kode ? () => onPilih(r.kode) : null;
          const cls = [r.kode && r.kode === sel ? 'sel' : '', klik ? 'klik-baris' : ''].filter(Boolean).join(' ') || null;
          return h('tr', { class: cls, onclick: klik, title: klik ? 'Klik untuk membuka wilayah ini' : null }, r.map((c, j) => h('td', { class: kolom[j].num ? 'num' : null, text: c.teks })));
        }));
      }
      thead.replaceChildren(h('tr', {}, kolom.map((k, j) => h('th', { class: k.num ? 'num' : null, scope: 'col', 'aria-sort': urut.i === j ? (urut.naik ? 'ascending' : 'descending') : null,
        onclick: () => { urut = { i: j, naik: urut.i === j ? !urut.naik : !k.num }; gambar(); } }, k.label + (urut.i === j ? (urut.naik ? ' ▲' : ' ▼') : '')))));
    };
    gambar();
    t.append(thead, tbody); wrap.append(t);
    if (toolbar) host.append(toolbar);
    host.append(wrap);
  }
  function unduhCsv(namaFile, kolom, baris) {
    const esc = v => { const t = v == null ? '' : String(v); return /[",\n;]/.test(t) ? '"' + t.replace(/"/g, '""') + '"' : t; };
    const isi = '﻿' + [kolom.map(esc).join(','), ...baris.map(r => r.map(esc).join(','))].join('\n');
    const a = h('a', { href: URL.createObjectURL(new Blob([isi], { type: 'text/csv;charset=utf-8' })), download: namaFile });
    document.body.append(a); a.click(); setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 500);
  }

  // ---------- status URL & tema ----------
  function bacaHash(S, halaman) {
    const raw = decodeURIComponent(location.hash.slice(1));
    if (!raw) return;
    const [pg, q] = raw.split('?');
    if (halaman.includes(pg)) S.page = pg;
    new URLSearchParams(q || '').forEach((v, k) => { if (k in S && k !== 'page') S[k] = v; });
  }
  function tulisHash(S, kunci) {
    const q = new URLSearchParams();
    kunci.forEach(k => { if (S[k] != null && S[k] !== '') q.set(k, S[k]); });
    try { history.replaceState(null, '', '#' + S.page + '?' + q.toString()); } catch (e) { /* abaikan */ }
  }
  function pasangTema(tombol, kunciSimpan) {
    try { const t = localStorage.getItem(kunciSimpan); if (t === 'light' || t === 'dark') document.documentElement.dataset.theme = t; } catch (e) { /* abaikan */ }
    tombol.addEventListener('click', () => {
      const gelap = document.documentElement.dataset.theme ? document.documentElement.dataset.theme === 'dark' : matchMedia('(prefers-color-scheme: dark)').matches;
      const t = gelap ? 'light' : 'dark';
      document.documentElement.dataset.theme = t;
      try { localStorage.setItem(kunciSimpan, t); } catch (e) { /* abaikan */ }
    });
  }
  // kotak cari dengan saran (provinsi + kab/kota)
  function kotakCari(host, { daftar, onPilih, placeholder }) {
    const id = 'cari-' + Math.random().toString(36).slice(2, 7);
    const inp = h('input', { type: 'search', placeholder: placeholder || 'Cari wilayah…', 'aria-label': placeholder || 'Cari wilayah', role: 'combobox', 'aria-expanded': 'false', 'aria-controls': id, autocomplete: 'off' });
    const ul = h('ul', { id, role: 'listbox', class: 'hidden' });
    let hasil = [], fokus = -1;
    const norm = t => t.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/^(kab\.?|kota|kabupaten|provinsi)\s+/, '');
    const tutup = () => { ul.classList.add('hidden'); inp.setAttribute('aria-expanded', 'false'); fokus = -1; };
    const gambar = () => {
      ul.replaceChildren(...hasil.map((x, i) => h('li', { role: 'option', 'aria-selected': i === fokus ? 'true' : 'false', onmousedown: ev => { ev.preventDefault(); pilih(x); } }, h('span', { text: x.nama }), h('small', { text: x.ket || '' }))));
      ul.classList.toggle('hidden', !hasil.length); inp.setAttribute('aria-expanded', hasil.length ? 'true' : 'false');
    };
    const pilih = x => { inp.value = ''; tutup(); onPilih(x.kode); };
    inp.addEventListener('input', () => {
      const q = norm(inp.value.trim());
      if (!q) { hasil = []; gambar(); return; }
      const dl = daftar();
      hasil = dl.filter(x => norm(x.nama).startsWith(q)).concat(dl.filter(x => !norm(x.nama).startsWith(q) && norm(x.nama).includes(q))).slice(0, 12);
      fokus = hasil.length ? 0 : -1; gambar();
    });
    inp.addEventListener('keydown', ev => {
      if (ev.key === 'ArrowDown') { fokus = Math.min(hasil.length - 1, fokus + 1); gambar(); ev.preventDefault(); }
      else if (ev.key === 'ArrowUp') { fokus = Math.max(0, fokus - 1); gambar(); ev.preventDefault(); }
      else if (ev.key === 'Enter' && hasil[fokus]) { pilih(hasil[fokus]); ev.preventDefault(); }
      else if (ev.key === 'Escape') tutup();
    });
    inp.addEventListener('blur', () => setTimeout(tutup, 120));
    host.replaceChildren(inp, ul);
    return inp;
  }
  function segmen(host, pilihan, aktif, onPilih, label) {
    host.setAttribute('role', 'radiogroup'); if (label) host.setAttribute('aria-label', label);
    host.replaceChildren(...pilihan.map(([v, teks, ok = true, judul]) => h('button', { type: 'button', role: 'radio', 'aria-checked': v === aktif ? 'true' : 'false', disabled: !ok, title: ok ? judul || null : 'Tidak tersedia', onclick: () => onPilih(v), text: teks })));
  }

  // rel lapisan dapat dilipat di layar sempit
  document.querySelectorAll('.rel').forEach(r => {
    const b = h('button', { class: 'rel-tombol', type: 'button', 'aria-expanded': 'false', text: '☰ Lapisan & filter' });
    b.addEventListener('click', () => { const buka = r.classList.toggle('buka'); b.setAttribute('aria-expanded', buka ? 'true' : 'false'); });
    r.prepend(b);
  });

  window.Inti = {
    $, h, s, nf, fmtAngka, fmtSumbu, lblPer, BLN, BLN_PANJANG,
    tampilTip, sembunyiTip, tipNama, tipBaris, tipSub,
    kelasTetap, legendaKelas, Peta, GarisWaktu,
    grafikGaris, garisMini, grafikKolom, kecilBanyak, daftarBatang, tabel, unduhCsv,
    bacaHash, tulisHash, pasangTema, kotakCari, segmen, kurangGerak,
  };
})();
