/* =====================================================================
   v2_enhancements.js â€” Interaksi Ergonomis & Progressive Disclosure
   Fokus:
   - Minimalist Progressive Disclosure (Mengelompokkan 6 modul Beranda menjadi Tab Terfokus)
   - Eliminasi Information Overload & Whitespace berlebihan
   - Desktop Panel Toggle & Keyboard Navigation
   ===================================================================== */

(function () {
  'use strict';

  let activeBerandaTab = 'tren'; // bawaan: Modul 1 (Tren & Peta Spasial)

  function applyBerandaTabs() {
    const beranda = document.getElementById('beranda');
    if (!beranda) return;
    const sections = beranda.querySelectorAll('section.bagian');
    if (sections.length < 6) return;

    // Cek apakah tab switcher sudah ada
    let nav = document.getElementById('beranda-focus-nav');
    if (!nav) {
      nav = document.createElement('nav');
      nav.id = 'beranda-focus-nav';
      nav.className = 'beranda-focus-nav';
      nav.setAttribute('role', 'tablist');
      nav.setAttribute('aria-label', 'Modul Analisis Beranda');

      const tabs = [
        { id: 'tren', label: '1. Tren & Peta Wilayah', desc: 'Seri 2015â€“2025 & Peta Provinsi' },
        { id: 'demografi', label: '2. Karakteristik & Struktur', desc: 'Pendidikan, Umur, Gender' },
        { id: 'wilayah', label: '3. Koridor RPJMN', desc: '7 Wilayah Pembangunan' },
        { id: 'kegiatan', label: '4. Dinamika Pasar Kerja', desc: 'Setengah Pengangguran & Kegiatan' },
        { id: 'semua', label: 'Tampilkan Lengkap', desc: 'Seluruh 6 Modul' }
      ];

      nav.innerHTML = tabs.map(t => `
        <button type="button" role="tab" class="focus-pill ${t.id === activeBerandaTab ? 'active' : ''}" data-target="${t.id}" title="${t.desc}">
          <span class="pill-title">${t.label}</span>
          <span class="pill-desc">${t.desc}</span>
        </button>
      `).join('');

      // Pasang di antara KPI grid dan Section pertama
      const kpiKisi = beranda.querySelector('.kpi-kisi');
      if (kpiKisi && kpiKisi.nextSibling) {
        beranda.insertBefore(nav, kpiKisi.nextSibling);
      } else if (sections[0]) {
        beranda.insertBefore(nav, sections[0]);
      }

      nav.addEventListener('click', (e) => {
        const btn = e.target.closest('button[data-target]');
        if (!btn) return;
        activeBerandaTab = btn.getAttribute('data-target');
        nav.querySelectorAll('.focus-pill').forEach(b => {
          b.classList.toggle('active', b.getAttribute('data-target') === activeBerandaTab);
        });
        updateSectionVisibility(sections);
      });
    }

    updateSectionVisibility(sections);
  }

  function updateSectionVisibility(sections) {
    // Mapping 6 section:
    // 0: Tren & Peta
    // 1: Siapa yang menganggur
    // 2: Struktur penganggur
    // 3: Sebaran menurut wilayah
    // 4: Setengah pengangguran
    // 5: Kegiatan penduduk
    sections.forEach((sec, idx) => {
      let visible = false;
      if (activeBerandaTab === 'semua') {
        visible = true;
      } else if (activeBerandaTab === 'tren') {
        visible = (idx === 0);
      } else if (activeBerandaTab === 'demografi') {
        visible = (idx === 1 || idx === 2);
      } else if (activeBerandaTab === 'wilayah') {
        visible = (idx === 3);
      } else if (activeBerandaTab === 'kegiatan') {
        visible = (idx === 4 || idx === 5);
      }
      sec.style.display = visible ? '' : 'none';
      if (visible) {
        sec.classList.remove('v2-fade-in');
        // trigger reflow untuk animasi halus
        void sec.offsetWidth;
        sec.classList.add('v2-fade-in');
      }
    });
  }

  function initDesktopPanel() {
    const panel = document.getElementById('panel');
    if (panel && !document.getElementById('panel-toggle-desktop')) {
      const btn = document.createElement('button');
      btn.id = 'panel-toggle-desktop';
      btn.className = 'panel-toggle-btn';
      btn.type = 'button';
      btn.title = 'Buka/Tutup Panel Analisis';
      btn.setAttribute('aria-label', 'Buka atau tutup panel analisis');
      btn.innerHTML = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
        <path id="panel-chevron" d="M9 18l6-6-6-6"/>
      </svg>`;

      let terlipat = false;
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        terlipat = !terlipat;
        panel.classList.toggle('desktop-ciut', terlipat);
        document.body.classList.toggle('panel-terlipat', terlipat);
        const ch = document.getElementById('panel-chevron');
        if (ch) ch.setAttribute('d', terlipat ? 'M15 18l-6-6 6-6' : 'M9 18l6-6-6-6');
      });

      panel.prepend(btn);
    }
  }

  function initFullscreen() {
    let fsBtn = document.getElementById('btn-fullscreen');
    const temaBtn = document.getElementById('tema');

    // Jika belum ada di DOM (misal HTML belum di-hard-reload), buat secara dinamis tepat di sebelah tombol tema
    if (!fsBtn && temaBtn) {
      fsBtn = document.createElement('button');
      fsBtn.id = 'btn-fullscreen';
      fsBtn.className = 'btn-icon';
      fsBtn.type = 'button';
      fsBtn.title = 'Layar Penuh (F11 / Alt+F)';
      fsBtn.setAttribute('aria-label', 'Layar Penuh');
      fsBtn.innerHTML = `
        <svg class="ikon ikon-fs-buka" viewBox="0 0 24 24"><path d="M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5"/></svg>
        <svg class="ikon ikon-fs-tutup" viewBox="0 0 24 24" style="display:none"><path d="M9 4v5H4M15 4v5h5M9 20v-5H4M15 20v-5h5"/></svg>
      `;
      temaBtn.parentNode.insertBefore(fsBtn, temaBtn);
    }

    if (!fsBtn) return;

    const iconBuka = fsBtn.querySelector('.ikon-fs-buka');
    const iconTutup = fsBtn.querySelector('.ikon-fs-tutup');

    function updateIcons() {
      const isFs = !!document.fullscreenElement;
      if (iconBuka && iconTutup) {
        iconBuka.style.display = isFs ? 'none' : '';
        iconTutup.style.display = isFs ? '' : 'none';
      }
      fsBtn.title = isFs ? 'Keluar Layar Penuh (Esc)' : 'Layar Penuh (F11)';
    }

    fsBtn.addEventListener('click', () => {
      if (!document.fullscreenElement) {
        if (document.documentElement.requestFullscreen) {
          document.documentElement.requestFullscreen().catch(() => {});
        }
      } else {
        if (document.exitFullscreen) {
          document.exitFullscreen().catch(() => {});
        }
      }
    });

    document.addEventListener('fullscreenchange', updateIcons);
  }

  function initKeyboard() {
    window.addEventListener('keydown', (e) => {
      if (['INPUT', 'SELECT', 'TEXTAREA'].includes(document.activeElement.tagName)) return;
      if (e.key === 'b' || e.key === 'B') {
        const btn = document.querySelector('[data-page="beranda"]');
        if (btn) btn.click();
      } else if (e.key === 'p' || e.key === 'P') {
        const btn = document.querySelector('[data-page="peta"]');
        if (btn) btn.click();
      } else if (e.key === 'r' || e.key === 'R') {
        const btn = document.querySelector('[data-page="profil"]');
        if (btn) btn.click();
      } else if (e.key === 's' || e.key === 'S') {
        const btn = document.querySelector('[data-page="sasaran"]');
        if (btn) btn.click();
      } else if (e.key === 'i' || e.key === 'I') {
        const btn = document.querySelector('[data-page="insight"]');
        if (btn) btn.click();
      } else if (e.key === 'f' || e.key === 'F') {
        const panelBtn = document.getElementById('panel-toggle-desktop');
        if (panelBtn) panelBtn.click();
      } else if (e.key === 'Escape') {
        const panel = document.getElementById('panel');
        if (panel && !panel.classList.contains('desktop-ciut')) {
          const panelBtn = document.getElementById('panel-toggle-desktop');
          if (panelBtn) panelBtn.click();
        }
      }
    });
  }

  // Menambahkan aksen status & ketercapaian target RPJMN pada KPI Card
  function enhanceKpiCards() {
    const beranda = document.getElementById('beranda');
    if (!beranda) return;
    const kpiCards = beranda.querySelectorAll('.kpi-kisi .kpi');
    if (!kpiCards || kpiCards.length === 0) return;

    kpiCards.forEach((card) => {
      if (card.querySelector('.kpi-delta-pill')) return; // Sudah di-enhance

      const judul = (card.querySelector('.judul')?.textContent || '').toLowerCase();
      const badge = document.createElement('div');

      if (judul.includes('tingkat pengangguran terbuka') || judul.includes('tpt')) {
        badge.className = 'kpi-delta-pill turun';
        badge.innerHTML = `<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round"><path d="M7 7l10 10M17 7v10H7"/></svg> Target RPJMN 2029: 4.5%â€“5.0% (On Track)`;
        card.appendChild(badge);
      } else if (judul.includes('neet')) {
        badge.className = 'kpi-delta-pill turun';
        badge.innerHTML = `<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round"><path d="M7 7l10 10M17 7v10H7"/></svg> Usia Muda 15â€“24 Thn`;
        card.appendChild(badge);
      } else if (judul.includes('tpak')) {
        badge.className = 'kpi-delta-pill naik';
        badge.innerHTML = `<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round"><path d="M7 17L17 7M7 7h10v10"/></svg> Partisipasi Angkatan Kerja Aktif`;
        card.appendChild(badge);
      }
    });
  }

  // Observe mutasi DOM beranda agar tetap rapi saat renderBeranda dipanggil ulang
  function setupObserver() {
    const beranda = document.getElementById('beranda');
    if (!beranda) return;
    const obs = new MutationObserver(() => {
      applyBerandaTabs();
      enhanceKpiCards();
    });
    obs.observe(beranda, { childList: true, subtree: false });
  }

  function init() {
    initDesktopPanel();
    initFullscreen();
    applyBerandaTabs();
    enhanceKpiCards();
    setupObserver();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();

/* =====================================================================
   Guided Map Tour & Auto-Play Timeline (Inspired by Kredit Indonesia)
   ===================================================================== */
(function() {
  const TOURSTEPS = [
    {
      t: 'Selamat datang di Peta Pengangguran',
      d: 'Peta ini menyajikan visualisasi data resmi ketenagakerjaan terkini dari BPS dan target sasaran RPJMN Bappenas untuk 38 Provinsi serta 514 Kabupaten/Kota. Panduan singkat ini menunjukkan cara mengeksplorasinya.'
    },
    {
      t: 'Peta Spasial Indonesia',
      el: () => document.getElementById('peta'),
      side: 'bottom',
      d: 'Arahkan kursor atau sentuh wilayah provinsi/kabupaten untuk melihat angka pengangguran serta tren lokal. Geser (drag) dan gunakan scroll/cubit untuk memperbesar.'
    },
    {
      t: 'Lapisan & Pilihan Analisis',
      el: () => document.getElementById('rel'),
      side: 'right',
      d: 'Gunakan panel ini untuk mengganti indikator (TPT, Gender, NEET, Setengah Penganggur), mengubah tingkat wilayah (Provinsi / Kab-Kota), serta mengunduh data CSV.'
    },
    {
      t: 'Panel Analisis Mendalam',
      el: () => document.getElementById('panel'),
      side: 'left',
      d: 'Panel ringkasan menampilkan nilai nasional, grafik historis, peringkat tertinggi/terendah, serta kotak pencarian cepat provinsi/kabupaten.'
    },
    {
      t: 'Jelajahi Deret Waktu',
      el: () => document.getElementById('waktu'),
      side: 'top',
      d: 'Gunakan penggeser waktu atau tombol Putar Otomatis di bawah untuk melihat evolusi tingkat pengangguran Indonesia dari tahun ke tahun.'
    },
    {
      t: 'Kontrol Peta & Layar Penuh',
      el: () => document.querySelector('.zoom-alat'),
      side: 'left',
      d: 'Perbesar (+), perkecil (-), reset tampilan nusantara, atau nikmati mode Layar Penuh. Anda dapat memanggil kembali panduan ini kapan saja lewat tombol tanya (?).'
    }
  ];

  let TS = { open: false, i: 0, steps: [], nodes: null };

  function roundRect(x, y, w, h, r) {
    r = Math.max(0, Math.min(r, w / 2, h / 2));
    return `M${x + r} ${y}H${x + w - r}A${r} ${r} 0 0 1 ${x + w} ${y + r}V${y + h - r}A${r} ${r} 0 0 1 ${x + w - r} ${y + h}H${x + r}A${r} ${r} 0 0 1 ${x} ${y + h - r}V${y + r}A${r} ${r} 0 0 1 ${x + r} ${y}Z`;
  }

  function tourBuild() {
    if (TS.nodes) return TS.nodes;
    const root = document.createElement('div');
    root.className = 'tour';
    root.hidden = true;
    root.innerHTML = `
      <div class="tour-dim"></div>
      <div class="tour-ring"></div>
      <section class="tour-card" role="dialog" aria-modal="true" tabindex="-1">
        <p class="tour-n"><span id="tourN"></span><span class="tour-dots" aria-hidden="true"></span></p>
        <h2 id="tourT"></h2>
        <div class="tour-d" id="tourD"></div>
        <div class="tour-foot">
          <button type="button" class="tbtn ghost" data-a="skip">Lewati</button>
          <div class="tour-nav">
            <button type="button" class="tbtn" data-a="back">Kembali</button>
            <button type="button" class="tbtn pri" data-a="next">Lanjut</button>
          </div>
        </div>
      </section>
    `;
    document.body.appendChild(root);
    const q = s => root.querySelector(s);
    TS.nodes = {
      root, card: q('.tour-card'), dim: q('.tour-dim'), ring: q('.tour-ring'),
      num: q('#tourN'), dots: q('.tour-dots'), title: q('#tourT'),
      body: q('#tourD'), back: q('[data-a="back"]'), next: q('[data-a="next"]')
    };

    root.addEventListener('click', e => {
      const b = e.target.closest('[data-a]');
      if (!b) return;
      if (b.dataset.a === 'skip') tourEnd();
      else tourGo(b.dataset.a === 'back' ? -1 : 1);
    });

    return TS.nodes;
  }

  function tourLayout() {
    if (!TS.open) return;
    const n = TS.nodes, s = TS.steps[TS.i], el = s.el ? s.el() : null;
    const vw = window.innerWidth, vh = window.innerHeight, M = 16;
    let rc = null;

    if (el) {
      const r = el.getBoundingClientRect();
      if (r.width > 0 && r.height > 0) {
        const pad = 8;
        const x0 = Math.max(4, r.left - pad), y0 = Math.max(4, r.top - pad);
        const x1 = Math.min(vw - 4, r.right + pad), y1 = Math.min(vh - 4, r.bottom + pad);
        rc = { x: x0, y: y0, w: x1 - x0, h: y1 - y0 };
      }
    }

    const h = rc || { x: vw / 2, y: vh / 2, w: 0, h: 0 };
    const E = rc ? 2 : 0;
    n.dim.style.clipPath = `path(evenodd,"M0 0H${vw}V${vh}H0Z${roundRect(h.x - E, h.y - E, h.w + 2 * E, h.h + 2 * E, 16 + E)}")`;
    n.ring.style.clipPath = `path(evenodd,"${roundRect(h.x - E, h.y - E, h.w + 2 * E, h.h + 2 * E, 16 + E)}${roundRect(h.x, h.y, h.w, h.h, 16)}")`;

    const cw = n.card.offsetWidth || 340, ch = n.card.offsetHeight || 220;
    const clampX = x => Math.max(M, Math.min(vw - cw - M, x));
    const clampY = y => Math.max(M, Math.min(vh - ch - M, y));
    let x, y;

    if (!rc) {
      x = (vw - cw) / 2;
      y = clampY((vh - ch) / 2 - 20);
    } else {
      if (s.side === 'right' && rc.x + rc.w + M + cw <= vw - M) {
        x = rc.x + rc.w + M; y = clampY(rc.y + rc.h / 2 - ch / 2);
      } else if (s.side === 'left' && rc.x - M - cw >= M) {
        x = rc.x - M - cw; y = clampY(rc.y + rc.h / 2 - ch / 2);
      } else if (s.side === 'top' && rc.y - M - ch >= M) {
        x = clampX(rc.x + rc.w / 2 - cw / 2); y = rc.y - M - ch;
      } else {
        x = clampX(rc.x + rc.w / 2 - cw / 2); y = Math.min(vh - ch - M, rc.y + rc.h + M);
      }
    }

    n.card.style.transform = `translate(${Math.round(x)}px, ${Math.round(y)}px)`;
  }

  function tourShow() {
    const n = TS.nodes, s = TS.steps[TS.i], last = TS.i === TS.steps.length - 1;
    n.num.textContent = `Langkah ${TS.i + 1} dari ${TS.steps.length}`;
    n.dots.innerHTML = TS.steps.map((_, k) => `<i${k === TS.i ? ' class="on"' : ''}></i>`).join('');
    n.title.textContent = s.t;
    n.body.innerHTML = s.d;
    n.back.hidden = (TS.i === 0);
    n.next.textContent = last ? 'Mulai Jelajah' : 'Lanjut';
    tourLayout();
  }

  function tourGo(d) {
    const i = TS.i + d;
    if (i < 0) return;
    if (i >= TS.steps.length) { tourEnd(); return; }
    TS.i = i;
    tourShow();
  }

  function tourStart() {
    const n = tourBuild();
    TS.steps = TOURSTEPS.filter(s => !s.el || s.el());
    TS.i = 0;
    TS.open = true;
    n.root.hidden = false;
    tourShow();
    setTimeout(tourLayout, 50);
  }

  function tourEnd() {
    if (!TS.open) return;
    TS.open = false;
    if (TS.nodes) TS.nodes.root.hidden = true;
    try { localStorage.setItem('peng2-tour-seen', 'true'); } catch(e){}
  }

  // Auto Timeline Player
  function initAutoTimeline() {
    const waktuEl = document.getElementById('waktu');
    if (!waktuEl || document.getElementById('btn-play-pause')) return;

    const playBtn = document.createElement('button');
    playBtn.id = 'btn-play-pause';
    playBtn.className = 'btn-play-pause';
    playBtn.type = 'button';
    playBtn.title = 'Putar Perubahan Waktu Otomatis';
    playBtn.innerHTML = `<svg viewBox="0 0 24 24"><polygon points="6 4 20 12 6 20 6 4"/></svg>`;

    let timer = null;
    playBtn.addEventListener('click', () => {
      const slider = waktuEl.querySelector('input[type="range"]');
      if (!slider) return;

      if (timer) {
        clearInterval(timer);
        timer = null;
        playBtn.innerHTML = `<svg viewBox="0 0 24 24"><polygon points="6 4 20 12 6 20 6 4"/></svg>`;
        playBtn.title = 'Putar Perubahan Waktu Otomatis';
      } else {
        playBtn.innerHTML = `<svg viewBox="0 0 24 24"><rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/></svg>`;
        playBtn.title = 'Jeda (Pause)';
        timer = setInterval(() => {
          let curr = parseInt(slider.value, 10);
          let max = parseInt(slider.max, 10);
          let min = parseInt(slider.min, 10);
          let next = curr + 1;
          if (next > max) next = min;
          slider.value = next;
          slider.dispatchEvent(new Event('input', { bubbles: true }));
          slider.dispatchEvent(new Event('change', { bubbles: true }));
        }, 800);
      }
    });

    waktuEl.prepend(playBtn);
  }

  // Hooking tombol ? dan inisialisasi
  function init() {
    initAutoTimeline();
    const guideBtn = document.getElementById('z-guide');
    if (guideBtn) guideBtn.addEventListener('click', tourStart);

    // Buka otomatis jika baru pertama kali membuka tab peta
    const tabPeta = document.querySelector('[data-page="peta"]');
    if (tabPeta) {
      tabPeta.addEventListener('click', () => {
        try {
          if (!localStorage.getItem('peng2-tour-seen')) {
            setTimeout(tourStart, 600);
          }
        } catch(e){}
      });
    }

    window.addEventListener('resize', () => { if (TS.open) tourLayout(); });
    window.addEventListener('keydown', (e) => {
      if (TS.open && e.key === 'Escape') tourEnd();
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();

