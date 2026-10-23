/* =====================================================================
   v2_enhancements.js — Interaksi Ergonomis & Progressive Disclosure
   Fokus:
   - Minimalist Progressive Disclosure (Mengelompokkan 6 modul Beranda menjadi Tab Terfokus)
   - Eliminasi Information Overload & Whitespace berlebihan
   - Desktop Panel Toggle & Keyboard Navigation
   - Guided Map Tour Interaktif
   ===================================================================== */

(function () {
  'use strict';

  let activeBerandaTab = 'tren'; // bawaan: Modul 1 (Tren & Peta Spasial)

  function applyBerandaTabs() {
    const beranda = document.getElementById('profil') || document.getElementById('beranda');
    if (!beranda) return;
    const sections = beranda.querySelectorAll('section.bagian');
    if (sections.length < 6) {
      const oldNav = document.getElementById('beranda-focus-nav');
      if (oldNav) oldNav.remove();
      return;
    }

    // Cek apakah tab switcher sudah ada
    let nav = document.getElementById('beranda-focus-nav');
    if (!nav) {
      nav = document.createElement('nav');
      nav.id = 'beranda-focus-nav';
      nav.className = 'beranda-focus-nav';
      nav.setAttribute('role', 'tablist');
      nav.setAttribute('aria-label', 'Modul Analisis Beranda');

      const tabs = [
        { id: 'tren', label: '1. Tren & Peta Wilayah', desc: 'Seri 2015–2025 & Peta Provinsi' },
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
      btn.title = 'Buka/Tutup Panel Analisis (F)';
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

    if (!fsBtn && temaBtn) {
      fsBtn = document.createElement('button');
      fsBtn.id = 'btn-fullscreen';
      fsBtn.className = 'btn-icon';
      fsBtn.type = 'button';
      fsBtn.title = 'Layar Penuh (F11)';
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
      if (e.ctrlKey || e.altKey || e.metaKey) return;
      if (['INPUT', 'SELECT', 'TEXTAREA'].includes(document.activeElement?.tagName)) return;
      if (e.key === 'p' || e.key === 'P') {
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
      } else if (e.key === 'm' || e.key === 'M') {
        const btn = document.querySelector('[data-page="metode"]');
        if (btn) btn.click();
      } else if (e.key === 'f' || e.key === 'F') {
        const panelBtn = document.getElementById('panel-toggle-desktop');
        if (panelBtn) panelBtn.click();
      } else if (e.key === '?') {
        e.preventDefault();
        toggleShortcutModal();
      }
    });
  }

  function initBackToTopAndShortcuts() {
    if (document.getElementById('v2-fab-stack')) return;

    const stack = document.createElement('div');
    stack.id = 'v2-fab-stack';
    stack.className = 'v2-fab-stack';
    stack.innerHTML = `
      <button type="button" id="btn-back-top" class="v2-fab-btn hidden" title="Kembali ke Atas" aria-label="Kembali ke bagian atas halaman">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M18 15l-6-6-6 6"/></svg>
        <span>Ke Atas</span>
      </button>
      <button type="button" id="btn-kbd-help" class="v2-fab-btn v2-fab-icon" title="Pintasan Keyboard (?)" aria-label="Tampilkan daftar pintasan keyboard">
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="4" width="20" height="16" rx="2"/><path d="M6 8h.01M10 8h.01M14 8h.01M18 8h.01M8 12h.01M12 12h.01M16 12h.01M7 16h10"/></svg>
      </button>
    `;
    document.body.appendChild(stack);

    const topBtn = document.getElementById('btn-back-top');
    const kbdBtn = document.getElementById('btn-kbd-help');

    let progBar = document.getElementById('v2-scroll-progress');
    if (!progBar) {
      progBar = document.createElement('div');
      progBar.id = 'v2-scroll-progress';
      progBar.className = 'v2-scroll-progress';
      progBar.setAttribute('aria-hidden', 'true');
      document.body.appendChild(progBar);
    }

    let ticking = false;
    window.addEventListener('scroll', () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          const isMap = document.body.classList.contains('mode-peta');
          if (!isMap && window.scrollY > 420) {
            topBtn.classList.remove('hidden');
          } else {
            topBtn.classList.add('hidden');
          }
          if (!isMap) {
            const docH = document.documentElement.scrollHeight - window.innerHeight;
            const pct = docH > 80 ? Math.min(100, Math.max(0, (window.scrollY / docH) * 100)) : 0;
            progBar.style.transform = `scaleX(${(pct / 100).toFixed(4)})`;
            progBar.style.opacity = pct > 1 ? '1' : '0';
          } else {
            progBar.style.opacity = '0';
          }
          ticking = false;
        });
        ticking = true;
      }
    }, { passive: true });

    topBtn.addEventListener('click', () => {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });

    kbdBtn.addEventListener('click', () => {
      toggleShortcutModal();
    });
  }

  function toggleShortcutModal(forceClose) {
    let modal = document.getElementById('v2-kbd-modal');
    if (!modal) {
      modal = document.createElement('div');
      modal.id = 'v2-kbd-modal';
      modal.className = 'v2-kbd-modal hidden';
      modal.setAttribute('role', 'dialog');
      modal.setAttribute('aria-modal', 'true');
      modal.setAttribute('aria-label', 'Daftar Pintasan Keyboard');
      modal.innerHTML = `
        <div class="v2-kbd-backdrop"></div>
        <div class="v2-kbd-card">
          <div class="v2-kbd-head">
            <h3>Pintasan Navigasi Cepat</h3>
            <button type="button" class="v2-kbd-close" aria-label="Tutup">&times;</button>
          </div>
          <div class="v2-kbd-grid">
            <div><kbd>R</kbd><span>Buka tab <b>Profil</b></span></div>
            <div><kbd>P</kbd><span>Buka tab <b>Peta Spasial</b></span></div>
            <div><kbd>S</kbd><span>Buka tab <b>Sasaran RPJMN</b></span></div>
            <div><kbd>I</kbd><span>Buka tab <b>Insight</b></span></div>
            <div><kbd>M</kbd><span>Buka tab <b>Metodologi</b></span></div>
            <div><kbd>F</kbd><span>Lipat/buka <b>Panel Peta</b></span></div>
            <div><kbd>?</kbd><span>Buka/tutup <b>Bantuan Pintasan</b></span></div>
            <div><kbd>Esc</kbd><span>Tutup dialog / keluar tur</span></div>
          </div>
        </div>
      `;
      document.body.appendChild(modal);

      modal.querySelector('.v2-kbd-backdrop').addEventListener('click', () => toggleShortcutModal(true));
      modal.querySelector('.v2-kbd-close').addEventListener('click', () => toggleShortcutModal(true));
      window.addEventListener('keydown', (ev) => {
        if (ev.key === 'Escape' && !modal.classList.contains('hidden')) {
          toggleShortcutModal(true);
        }
      });
    }

    if (forceClose === true) {
      modal.classList.add('hidden');
    } else {
      modal.classList.toggle('hidden');
    }
  }

  // Menambahkan aksen status & konteks pada KPI Card Nasional
  function enhanceKpiCards() {
    const beranda = document.getElementById('profil') || document.getElementById('beranda');
    if (!beranda) return;
    const kpiCards = beranda.querySelectorAll('.kpi-kisi .kpi');
    if (!kpiCards || kpiCards.length === 0) return;

    kpiCards.forEach((card) => {
      if (card.querySelector('.kpi-delta-pill') || card.classList.contains('kpi-rentang-gabung')) return;

      const labelEl = card.querySelector('.atas span:last-child');
      const judul = (labelEl?.textContent || '').toLowerCase();
      const badge = document.createElement('div');

      if (judul.includes('jumlah penganggur')) {
        badge.className = 'kpi-delta-pill turun';
        badge.innerHTML = `<svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><path d="M7 7l10 10M17 7v10H7"/></svg> Sasaran RPJMN 2025: 4,50%–5,00%`;
        card.appendChild(badge);
      } else if (judul.includes('neet')) {
        badge.className = 'kpi-delta-pill turun';
        badge.innerHTML = `<svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><circle cx="12" cy="12" r="9"/></svg> Pemuda 15–24 Tahun`;
        card.appendChild(badge);
      } else if (judul.includes('setengah pengangguran')) {
        badge.className = 'kpi-delta-pill turun';
        badge.innerHTML = `<svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><path d="M12 6v6l4 2"/></svg> Jam Kerja &lt; 35 Jam/Minggu`;
        card.appendChild(badge);
      } else if (judul.includes('tpak')) {
        badge.className = 'kpi-delta-pill turun';
        badge.innerHTML = `<svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><path d="M7 17L17 7M7 7h10v10"/></svg> Partisipasi Angkatan Kerja`;
        card.appendChild(badge);
      }
    });
  }

  function setupObserver() {
    const targets = [document.getElementById('profil'), document.getElementById('beranda')].filter(Boolean);
    targets.forEach(tgt => {
      const obs = new MutationObserver(() => {
        applyBerandaTabs();
        enhanceKpiCards();
      });
      obs.observe(tgt, { childList: true, subtree: false });
    });
  }

  function init() {
    initDesktopPanel();
    initFullscreen();
    initKeyboard();
    initBackToTopAndShortcuts();
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
   Guided Map Tour (Inspired by Kredit Indonesia)
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
      d: 'Gunakan penggeser waktu atau tombol Putar (▶) di sebelah kiri penggeser untuk melihat evolusi tingkat pengangguran Indonesia dari tahun ke tahun.'
    },
    {
      t: 'Kontrol Peta & Panduan',
      el: () => document.querySelector('.zoom-alat'),
      side: 'left',
      d: 'Perbesar (+), perkecil (−), reset tampilan nusantara, atau nikmati mode Layar Penuh. Anda dapat memanggil kembali panduan ini kapan saja lewat tombol tanda tanya (?).'
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

  function init() {
    const guideBtn = document.getElementById('z-guide');
    if (guideBtn) guideBtn.addEventListener('click', tourStart);

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
