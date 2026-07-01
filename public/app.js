// Real Cars ETH — Client App
gsap.registerPlugin(ScrollTrigger);

/* ── DOM refs ─────────────────────────────────────────── */
const header      = document.getElementById('nav');
const carsGrid    = document.getElementById('cars-grid');
const searchInput = document.getElementById('search-input');

const DEFAULT_CHANNEL = 'jossycarmar';
let currentCars = [];


/* ── Hero Entrance ────────────────────────────────────── */
function initHeroAnimations() {
  // Hide everything off-stage — no flash before animation
  gsap.set(['.hero-label','.hero-title','.hero-sub','.hero-actions','.hero-stats','.ctrl-paint','.ctrl-shots','.cam-dpad'], { opacity: 0 });

  // Split .hero-title by <br> lines so each line can curtain-lift independently
  function splitTitleLines() {
    const el = document.querySelector('.hero-title');
    if (!el || el.dataset.lxSplit) return;
    el.dataset.lxSplit = 'true';
    el.innerHTML = el.innerHTML
      .split(/<br\s*\/?>/i)
      .map(line => `<span class="htl-wrap"><span class="htl">${line}</span></span>`)
      .join('');
    if (!document.getElementById('htl-style')) {
      const s = document.createElement('style');
      s.id = 'htl-style';
      s.textContent = '.htl-wrap{display:block;overflow:hidden;padding-bottom:0.05em;}.htl{display:block;}';
      document.head.appendChild(s);
    }
  }

  window.runEntranceTransition = function() {
    const isMobile = window.innerWidth <= 1024;
    const mv = document.getElementById('car-model-viewer');
    if (!mv) return;

    // Keep model-viewer visible — hiding it causes a white flash after the loader fades
    
    // Ensure hero-viewer spans across the left to prevent clipping while positioning the car on the right
    const viewerWrap = document.getElementById('car-viewer-wrap');
    if (viewerWrap) {
      const leftVal = 0;
      const widthVal = isMobile ? '100%' : '135%';
      gsap.set(viewerWrap, { left: leftVal, width: widthVal, backgroundColor: 'transparent', zIndex: 15 });
    }

    // Parameters for flexing the 3D car model directly
    const params = {
      theta: -180, // Start looking from the rear-center of the car
      phi: 88,     // Flat cinematic angle look up
      radius: 18,  // Extremely close camera radius (extreme zooming)
      fov: 7,      // Hyper-close camera zoom (just raw details!)
      tx: 0,       // Center target X
      ty: 0.08,
      tz: 0
    };

    const applyModelSettings = () => {
      mv.cameraOrbit = `${params.theta}deg ${params.phi}deg ${params.radius}%`;
      mv.cameraTarget = `${params.tx}m ${params.ty}m ${params.tz}m`;
      mv.setAttribute('field-of-view', `${params.fov}deg`);
    };

    // Apply starting settings immediately
    applyModelSettings();

    const tl = gsap.timeline({ 
      defaults: { ease: 'power4.inOut' },
      onUpdate: applyModelSettings,
      onComplete: () => {
        // Drop zIndex to 1 at the end so text & buttons are interactive, while background dragging works
        if (viewerWrap) {
          gsap.set(viewerWrap, { zIndex: 1 });
        }
      }
    });

    // Model-viewer stays at full opacity — it's already visible after the loader

    // 2. The Flexing Stage 1: Ultra close-up zoom & rotate
    tl.to(params, {
      theta: 35,
      radius: 12,
      fov: 6,
      phi: 76,
      duration: 1.3,
      ease: 'power3.inOut'
    }, 0.2);

    // 3. The Flexing Stage 2: Final Blow Spin!
    // A high-momentum full 360 rotation that whips the car around
    tl.to(params, {
      theta: 378, // Full 360 spin (loops back to 18 deg modulo 360)
      radius: 50,
      fov: 18,
      phi: 70,
      duration: 1.2,
      ease: 'power2.inOut'
    }, 1.4);

    // 4. Settle Stage: Retreat to the designated spot on the right & zoom out to default
    const targetFov = isMobile ? 45 : 32;
    const targetTx = 0; // Keep the pivot center perfectly on the car for clean rotations

    tl.to(params, {
      theta: 378, // Hold final angle matching 18deg
      phi: 72,
      radius: 105,
      fov: targetFov,
      tx: targetTx,
      duration: 1.8,
      ease: 'power3.out'
    }, 2.5);



    // ── Luxury text entrance — fires immediately when loading ends ──
    splitTitleLines();
    gsap.set('.hero-title', { opacity: 1 });
    gsap.set('.htl', { y: '108%' });

    // Label — letter-spacing collapses inward while car is flexing
    tl.fromTo('.hero-label',
      { opacity: 0, letterSpacing: '0.42em' },
      { opacity: 1, letterSpacing: '0.14em', duration: 1.9, ease: 'power4.out' },
      0.1
    )
    // Title lines — curtain-lift one by one
    .to('.htl',
      { y: '0%', duration: 1.55, stagger: 0.21, ease: 'power4.out' },
      0.4
    )
    // Subtitle — whispers in
    .fromTo('.hero-sub',
      { opacity: 0, y: 10 },
      { opacity: 1, y: 0, duration: 1.4, ease: 'power4.out' },
      1.3
    )
    // CTA buttons — float up softly
    .fromTo('.hero-actions',
      { opacity: 0, y: 8 },
      { opacity: 1, y: 0, duration: 1.2, ease: 'power4.out' },
      1.65
    )
    // Stats — pure fade, no movement
    .fromTo('.hero-stats',
      { opacity: 0 },
      { opacity: 1, duration: 1.1, ease: 'power2.out' },
      1.95
    )
    // Controls — last to arrive
    .fromTo('.ctrl-paint', { opacity: 0, y: 10 }, { opacity: 1, y: 0, duration: 0.9, ease: 'power3.out' }, 2.1)
    .fromTo('.ctrl-shots', { opacity: 0, y: 10 }, { opacity: 1, y: 0, duration: 0.9, ease: 'power3.out' }, 2.2)
    .fromTo('.cam-dpad',   { opacity: 0, x: 10 }, { opacity: 1, x: 0, duration: 0.9, ease: 'power3.out' }, 2.3);
  };

  // Parallax scrolling on the 3D car viewer
  const mv = document.getElementById('car-model-viewer');
  if (mv) {
    gsap.to(mv, {
      yPercent: 12,
      ease: 'none',
      scrollTrigger: {
        trigger: '.hero',
        start: 'top top',
        end: 'bottom top',
        scrub: true
      }
    });
  }
}

/* ── Stat Counters ────────────────────────────────────── */
function initCounters() {
  document.querySelectorAll('[data-target]').forEach((el) => {
    const target = parseInt(el.dataset.target, 10);
    ScrollTrigger.create({
      trigger: el,
      start: 'top 88%',
      once: true,
      onEnter: () => {
        gsap.fromTo(el,
          { textContent: 0 },
          { textContent: target, duration: 2, ease: 'power2.out', snap: { textContent: 1 } }
        );
      },
    });
  });
}

/* ── Scroll Reveal ────────────────────────────────────── */
function initScrollAnimations() {
  // Stagger reveal sections
  gsap.utils.toArray('.inv-heading, .vids-heading, .about-text').forEach((el) => {
    gsap.fromTo(el, { y: 40, opacity: 0 },
      { y: 0, opacity: 1, duration: 1.1, ease: 'power3.out',
        scrollTrigger: { trigger: el, start: 'top 88%' } });
  });

  gsap.utils.toArray('.about-stat-card').forEach((el, i) => {
    gsap.fromTo(el, { y: 30, opacity: 0 },
      { y: 0, opacity: 1, duration: 0.8, ease: 'power3.out', delay: i * 0.08,
        scrollTrigger: { trigger: el, start: 'top 92%' } });
  });
}

/* ── Header scroll + hide on hero ────────────────────── */
function updateHeader() {
  const heroH = document.querySelector('.hero')?.offsetHeight || 0;
  header.classList.toggle('scrolled',       window.scrollY > 60);
  header.classList.toggle('hidden-on-hero', window.scrollY < heroH - 80);
}
window.addEventListener('scroll', updateHeader);
updateHeader(); // run once on load

/* ── Vehicle Feed ─────────────────────────────────────── */
async function fetchCars(channelName) {
  showLoader();
  try {
    const res  = await fetch(`/api/cars?channel=${encodeURIComponent(channelName)}&limit=50`);
    const data = await res.json();
    currentCars = data;
    filteredCars = data;
    applyFilters();
  } catch (err) {
    console.error('Feed error:', err);
    carsGrid.innerHTML = `
      <div style="grid-column:1/-1;text-align:center;padding:80px;color:var(--accent);">
        <i class="fa-solid fa-triangle-exclamation" style="font-size:3rem;margin-bottom:16px;display:block;"></i>
        <h3>Failed to load vehicles</h3>
        <p style="color:var(--w40);margin-top:8px;">Check your connection and try again.</p>
      </div>`;
  }
}

function showLoader() {
  carsGrid.innerHTML = `
    <div class="loader-container" style="grid-column:1/-1;">
      <div class="spinner"></div>
      <p style="color:var(--w40);font-size:0.9rem;letter-spacing:1px;margin-top:12px;">Loading vehicles...</p>
    </div>`;
}

/* ── Render Cards ─────────────────────────────────────── */
function renderCars(cars) {
  if (!cars.length) {
    carsGrid.innerHTML = `
      <div style="grid-column:1/-1;text-align:center;padding:80px;color:var(--w40);">
        <i class="fa-solid fa-car-tunnel" style="font-size:3rem;margin-bottom:16px;display:block;opacity:0.3;"></i>
        <h3 style="font-weight:500;">No vehicles found.</h3>
      </div>`;
    return;
  }

  carsGrid.innerHTML = '';
  cars.forEach((car) => {
    const card = document.createElement('div');
    card.className = 'car-card';
    const photos = car.photos?.length
      ? car.photos
      : ['https://images.unsplash.com/photo-1549399542-7e3f8b79c341?auto=format&fit=crop&q=80&w=800'];
    const multi = photos.length > 1;

    const slidesHtml = photos.map((src, i) =>
      `<img class="slide-img" src="${src}" alt="${car.title}" loading="${i === 0 ? 'eager' : 'lazy'}"
        onerror="this.src='https://images.unsplash.com/photo-1549399542-7e3f8b79c341?auto=format&fit=crop&q=80&w=800'">`
    ).join('');

    const dotsHtml = multi
      ? `<div class="slide-dots">${photos.map((_, i) =>
          `<span class="slide-dot${i === 0 ? ' active' : ''}"></span>`).join('')}</div>` : '';

    const progressHtml = multi
      ? `<div class="slide-progress"><div class="slide-progress-fill"></div></div>` : '';

    const countBadge = multi
      ? `<div class="photo-count-badge"><i class="fa-solid fa-images"></i> ${photos.length}</div>` : '';

    const ago = timeAgo(car.date);
    const agoBadge = ago
      ? `<div class="time-ago-badge"><i class="fa-regular fa-clock"></i> ${ago}</div>` : '';

    card.innerHTML = `
      <div class="car-image-container">
        <div class="slides-track">${slidesHtml}</div>
        ${dotsHtml}
        ${progressHtml}
        ${countBadge}
        ${agoBadge}
        <div class="card-image-overlay"></div>
      </div>
      <div class="car-content">
        <div class="car-meta">
          <h3 class="car-title">${car.title}</h3>
          <span class="car-price-inline">${car.price}</span>
        </div>
        <p class="car-details">${car.details}</p>
        <button class="card-view-btn">
          <span>View Details</span>
          <i class="fa-solid fa-arrow-right"></i>
        </button>
      </div>`;

    if (multi) initCardSlider(card, photos.length);
    card.querySelector('.card-view-btn').addEventListener('click', (e) => {
      e.stopPropagation();
      openDetailPage(car);
    });
    card.addEventListener('click', () => openDetailPage(car));
    carsGrid.appendChild(card);
  });

  animateCards();
}

/* ── Card Image Slider ────────────────────────────────── */
function initCardSlider(card, count) {
  const track    = card.querySelector('.slides-track');
  const dots     = card.querySelectorAll('.slide-dot');
  const fill     = card.querySelector('.slide-progress-fill');
  const INTERVAL = 3800;
  let idx = 0, timer = null;

  function goTo(i, animate = true) {
    idx = i;
    track.style.transition = animate ? 'transform 0.7s cubic-bezier(0.25,0.46,0.45,0.94)' : 'none';
    track.style.transform  = `translateX(-${idx * 100}%)`;
    dots.forEach((d, di) => d.classList.toggle('active', di === idx));
    if (fill) {
      fill.style.transition = 'none';
      fill.style.width = '0%';
      requestAnimationFrame(() => requestAnimationFrame(() => {
        fill.style.transition = `width ${INTERVAL}ms linear`;
        fill.style.width = '100%';
      }));
    }
  }

  function start() {
    stop();
    goTo(idx);
    timer = setInterval(() => { idx = (idx + 1) % count; goTo(idx); }, INTERVAL);
  }

  function stop() {
    clearInterval(timer);
    if (fill) { fill.style.transition = 'none'; fill.style.width = '0%'; }
  }

  const imgBox = card.querySelector('.car-image-container');
  imgBox.addEventListener('mouseenter', stop);
  imgBox.addEventListener('mouseleave', start);

  /* Only run when visible */
  new IntersectionObserver((entries) => {
    entries.forEach(e => { if (e.isIntersecting) start(); else stop(); });
  }, { threshold: 0.25 }).observe(card);
}

/* ── Card stagger ─────────────────────────────────────── */
function animateCards() {
  const cards = carsGrid.querySelectorAll('.car-card');
  if (!cards.length) return;
  gsap.fromTo(cards,
    { y: 35, opacity: 0 },
    { y: 0, opacity: 1, duration: 0.7, stagger: 0.08, ease: 'power3.out' });
}

/* ── Time ago ─────────────────────────────────────────── */
function timeAgo(dateStr) {
  if (!dateStr || dateStr === 'Recently') return '';

  let date = new Date(dateStr);

  // If ISO parse failed, try to reconstruct from "HH:MM" clock text
  if (isNaN(date.getTime()) && /^\d{1,2}:\d{2}$/.test(dateStr.trim())) {
    const [h, m] = dateStr.trim().split(':').map(Number);
    date = new Date();
    date.setHours(h, m, 0, 0);
    // If that's in the future it was posted yesterday
    if (date > new Date()) date.setDate(date.getDate() - 1);
  }

  if (isNaN(date.getTime())) return dateStr; // total fallback

  const s = Math.floor((Date.now() - date) / 1000);
  if (s < 60)       return 'Just now';
  if (s < 3600)     return `${Math.floor(s / 60)}m ago`;
  if (s < 86400)    return `${Math.floor(s / 3600)}h ago`;
  if (s < 604800)   return `${Math.floor(s / 86400)}d ago`;
  if (s < 2592000)  return `${Math.floor(s / 604800)}w ago`;
  return `${Math.floor(s / 2592000)}mo ago`;
}

/* ── Detail page ──────────────────────────────────────── */
function openDetailPage(car) {
  sessionStorage.setItem('rceth_car', JSON.stringify(car));
  if (isLoggedIn()) {
    recordInquiry(car);
    window.location.href = 'car.html';
  } else {
    openAuthModal(() => {
      recordInquiry(car);
      window.location.href = 'car.html';
    });
  }
}

/* ── Filter + Pagination ──────────────────────────────── */
const CARS_PER_PAGE = 12;
let filteredCars  = [];
let currentPage   = 1;

function parsePriceNum(str) {
  const s = (str || '').toLowerCase().replace(/,/g, '');
  const m = s.match(/([\d.]+)\s*(?:million|mill\b|mil\b)/);
  if (m) return parseFloat(m[1]) * 1e6;
  const n = s.match(/([\d]+)/);
  if (n) { const v = parseFloat(n[1]); return v < 10000 ? v * 1e6 : v; }
  return 0;
}

function parseYear(str) {
  const m = (str || '').match(/\b(20\d{2}|19\d{2})\b/);
  return m ? parseInt(m[1]) : 0;
}

function getFilters() {
  return {
    q:       (document.getElementById('search-input')?.value || '').toLowerCase().trim(),
    trans:   document.getElementById('f-transmission')?.value || '',
    fuel:    document.getElementById('f-fuel')?.value || '',
    yearMin: parseInt(document.getElementById('f-year-min')?.value) || 0,
    yearMax: parseInt(document.getElementById('f-year-max')?.value) || 9999,
    priceMin: (parseFloat(document.getElementById('f-price-min')?.value) || 0) * 1e6,
    priceMax: (parseFloat(document.getElementById('f-price-max')?.value) || 0) * 1e6 || Infinity,
  };
}

function applyFilters() {
  const f = getFilters();
  currentPage = 1;

  filteredCars = currentCars.filter(car => {
    const text = `${car.title} ${car.details} ${car.price}`.toLowerCase();

    if (f.q && !text.includes(f.q)) return false;

    if (f.trans === 'automatic' && !/automatic|auto\b/.test(text)) return false;
    if (f.trans === 'manual'    && !/\bmanual\b/.test(text))         return false;

    if (f.fuel === 'diesel'   && !/diesel/.test(text))                   return false;
    if (f.fuel === 'petrol'   && !/petrol|benzene|gasoline/.test(text))  return false;
    if (f.fuel === 'electric' && !/electric|\bev\b/.test(text))          return false;
    if (f.fuel === 'hybrid'   && !/hybrid/.test(text))                   return false;

    if (f.yearMin > 0 || f.yearMax < 9999) {
      const yr = parseYear(text);
      if (yr && (yr < f.yearMin || yr > f.yearMax)) return false;
    }

    if (f.priceMin > 0 || f.priceMax < Infinity) {
      const pr = parsePriceNum(car.price);
      if (pr && (pr < f.priceMin || pr > f.priceMax)) return false;
    }

    return true;
  });

  const countEl = document.getElementById('filter-count');
  if (countEl) countEl.textContent =
    `${filteredCars.length} vehicle${filteredCars.length !== 1 ? 's' : ''} found`;

  renderPage();
}

function renderPage() {
  const start = (currentPage - 1) * CARS_PER_PAGE;
  renderCars(filteredCars.slice(start, start + CARS_PER_PAGE));
  renderPagination();
}

function renderPagination() {
  const el = document.getElementById('pagination');
  if (!el) return;
  const total = Math.ceil(filteredCars.length / CARS_PER_PAGE);
  if (total <= 1) { el.innerHTML = ''; return; }

  let html = '';
  if (currentPage > 1)
    html += `<button class="pg-btn" data-page="${currentPage - 1}"><i class="fa-solid fa-chevron-left"></i></button>`;

  for (let i = 1; i <= total; i++) {
    if (i === 1 || i === total || Math.abs(i - currentPage) <= 1) {
      html += `<button class="pg-btn${i === currentPage ? ' active' : ''}" data-page="${i}">${i}</button>`;
    } else if (Math.abs(i - currentPage) === 2) {
      html += `<span class="pg-dots">…</span>`;
    }
  }

  if (currentPage < total)
    html += `<button class="pg-btn" data-page="${currentPage + 1}"><i class="fa-solid fa-chevron-right"></i></button>`;

  el.innerHTML = html;
  el.querySelectorAll('.pg-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      currentPage = parseInt(btn.dataset.page);
      renderPage();
      document.getElementById('inventory').scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  });
}

/* Wire up all filter inputs + collapsible panel toggle */
function initFilters() {
  // Advanced Filter panel toggle
  const toggleBtn = document.getElementById('f-toggle');
  const panel = document.getElementById('filter-panel');
  
  toggleBtn?.addEventListener('click', () => {
    toggleBtn.classList.toggle('active');
    panel?.classList.toggle('open');
  });

  ['search-input','f-transmission','f-fuel','f-year-min','f-year-max','f-price-min','f-price-max']
    .forEach(id => {
      const el = document.getElementById(id);
      if (el) el.addEventListener('input', applyFilters);
      if (el && el.tagName === 'SELECT') el.addEventListener('change', applyFilters);
    });

  document.getElementById('f-clear')?.addEventListener('click', () => {
    ['search-input','f-year-min','f-year-max','f-price-min','f-price-max']
      .forEach(id => { const e = document.getElementById(id); if (e) e.value = ''; });
    ['f-transmission','f-fuel']
      .forEach(id => { const e = document.getElementById(id); if (e) e.value = ''; });
    applyFilters();
  });
}

/* ── 3D Model Viewer ──────────────────────────────────── */
function init3DShowcase() {
  const mv = document.getElementById('car-model-viewer');
  if (!mv) return;

  const SKIP = ['glass','window','wind','windshield','tire','tyre','rubber','tread',
    'wheel','rim','brake','disc','caliper','interior','seat','dashboard',
    'leather','carpet','chrome','exhaust','underbody','floor','plate'];

  function applyColor(hex, exposure) {
    if (mv.model) {
      const r = parseInt(hex.slice(1,3),16)/255;
      const g = parseInt(hex.slice(3,5),16)/255;
      const b = parseInt(hex.slice(5,7),16)/255;
      mv.model.materials.forEach(mat => {
        const name = (mat.name||'').toLowerCase();
        if (SKIP.some(s => name.includes(s))) return;
        const pbr = mat.pbrMetallicRoughness;
        if (pbr.roughnessFactor > 0.85 && pbr.baseColorFactor?.[0] < 0.08) return;
        pbr.setBaseColorFactor([r,g,b,1]);
      });
    }
    if (exposure) mv.setAttribute('exposure', exposure);
  }

  /* Loading overlay */
  const mlo = document.getElementById('mlo');
  const mloFill = document.getElementById('mlo-fill');
  const mloPct  = document.getElementById('mlo-pct');
  let overlayDismissed = false;

  function dismissOverlay() {
    if (overlayDismissed || !mlo) return;
    overlayDismissed = true;
    mlo.style.transition = 'opacity 0.8s ease';
    mlo.style.opacity = '0';
    setTimeout(() => { 
      mlo.style.display = 'none';
      if (typeof window.runEntranceTransition === 'function') {
        window.runEntranceTransition();
      }
    }, 850);
  }

  mv.addEventListener('progress', e => {
    const pct = Math.round(e.detail.totalProgress * 100);
    if (mloFill) mloFill.style.width = `${pct}%`;
    if (mloPct)  mloPct.textContent  = `${pct}%`;
    if (pct >= 100) setTimeout(dismissOverlay, 600);
  });

  mv.addEventListener('load', () => {
    dismissOverlay();
    const active = document.querySelector('.swatch.active');
    if (active) applyColor(active.dataset.color, active.dataset.exposure);
  });

  /* Color auto-cycle 30 s */
  const swatches = Array.from(document.querySelectorAll('.swatch'));
  let cycleIdx = swatches.findIndex(s => s.classList.contains('active'));
  let cycleTimer = null;

  function activateSwatch(btn, userClick = false) {
    swatches.forEach(s => s.classList.remove('active'));
    btn.classList.add('active');
    cycleIdx = swatches.indexOf(btn);
    applyColor(btn.dataset.color, btn.dataset.exposure);
    if (userClick) startCycle();
  }

  function startCycle() {
    clearInterval(cycleTimer);
    cycleTimer = setInterval(() => {
      cycleIdx = (cycleIdx + 1) % swatches.length;
      activateSwatch(swatches[cycleIdx]);
    }, 30000);
  }

  const paintDot = document.getElementById('paint-dot');
  function activateSwatchAndUpdate(btn, userClick = false) {
    activateSwatch(btn, userClick);
    if (paintDot) paintDot.style.background = btn.dataset.color;
    document.getElementById('ctrl-paint')?.classList.remove('open');
  }

  swatches.forEach(btn => btn.addEventListener('click', () => activateSwatchAndUpdate(btn, true)));
  startCycle();

  /* ── Dropdown toggles ── */
  const shotsWrap   = document.getElementById('ctrl-shots');
  const shotsTrigger= document.getElementById('shots-trigger');
  const paintWrap   = document.getElementById('ctrl-paint');
  const paintTrigger= document.getElementById('paint-trigger');

  shotsTrigger?.addEventListener('click', (e) => {
    e.stopPropagation();
    shotsWrap.classList.toggle('open');
    paintWrap?.classList.remove('open');
  });

  paintTrigger?.addEventListener('click', (e) => {
    e.stopPropagation();
    paintWrap.classList.toggle('open');
    shotsWrap?.classList.remove('open');
  });

  document.addEventListener('click', () => {
    shotsWrap?.classList.remove('open');
    paintWrap?.classList.remove('open');
  });

  shotsWrap?.addEventListener('click', e => e.stopPropagation());
  paintWrap?.addEventListener('click', e => e.stopPropagation());

  /* Cinematic shots */
  let cineTimeline = null;

  function stopCine() {
    if (cineTimeline) { cineTimeline.kill(); cineTimeline = null; }
    document.querySelectorAll('.cine-btn').forEach(b => b.classList.remove('playing'));
  }

  function playCine(shotName, btn) {
    stopCine();
    btn.classList.add('playing');
    const c = { theta:30, phi:75, radius:100, py:0 };
    const push = () => {
      mv.cameraOrbit  = `${c.theta}deg ${c.phi}deg ${c.radius}%`;
      mv.cameraTarget = `0m ${c.py}m 0m`;
    };
    const tl = gsap.timeline({ onUpdate: push, onComplete: () => btn.classList.remove('playing') });

    switch (shotName) {
      case 'reveal':
        Object.assign(c,{theta:5,phi:82,radius:5,py:0.05}); push();
        tl.to(c,{radius:22,phi:80,duration:2,ease:'power1.out'})
          .to(c,{radius:115,theta:28,phi:72,py:0.35,duration:4.5,ease:'power4.out'});
        break;
      case 'drop':
        Object.assign(c,{theta:22,phi:2,radius:135,py:0}); push();
        tl.to(c,{phi:18,radius:120,duration:0.9,ease:'power3.in'})
          .to(c,{phi:74,radius:92,theta:30,py:0.25,duration:2.8,ease:'power2.inOut'})
          .to(c,{radius:100,duration:0.7,ease:'back.out(1.4)'});
        break;
      case 'orbit':
        Object.assign(c,{theta:0,phi:77,radius:90,py:0.22}); push();
        tl.to(c,{theta:360,duration:10,ease:'none',repeat:-1});
        break;
      case 'lowsweep':
        Object.assign(c,{theta:-60,phi:86,radius:45,py:-0.08}); push();
        tl.to(c,{theta:0,phi:85,radius:50,duration:2.2,ease:'power2.in'})
          .to(c,{theta:145,phi:74,radius:88,py:0.3,duration:4.8,ease:'power2.inOut'});
        break;
      case 'driveby':
        Object.assign(c,{theta:-88,phi:86,radius:102,py:0.12}); push();
        tl.to(c,{theta:-12,radius:66,duration:1.4,ease:'power3.in'})
          .to(c,{theta:18,duration:0.5,ease:'linear'})
          .to(c,{theta:90,radius:102,phi:84,duration:2.2,ease:'power3.out'});
        break;
      case 'interior':
        Object.assign(c,{theta:14,phi:72,radius:114,py:0.28}); push();
        tl.to(c,{theta:-89,phi:65,radius:15,py:1.0,duration:3.0,ease:'power3.in'})
          .to(c,{radius:8,phi:63,py:1.2,duration:1.5,ease:'power2.in'})
          .call(() => {
            mv.cameraOrbit  = '-89.1deg 62.6deg 1.184m';
            mv.cameraTarget = '0m 1.2m 0m';
          });
        break;
      case 'wheel':
        // Jump straight to the exact wheel framing the user found
        mv.cameraOrbit  = '-633.8deg 86.9deg 2.663m';
        mv.cameraTarget = '-0.903m 0.25m 1.687m';
        // c approximate match (theta normalised: -633.8+720=86, phi≈87, radius rough %)
        Object.assign(c,{theta:86,phi:87,radius:18,py:0.25});
        tl.to(c,{theta:160,phi:84,radius:16,py:0.1,duration:3.2,ease:'power1.inOut',delay:0.5})
          .to(c,{theta:30,phi:73,radius:104,py:0.3,duration:2.5,ease:'power4.out'});
        break;
    }
    cineTimeline = tl;
  }

  /* Cinematic Auto-Cycle */
  const CINE_SEQUENCE = ['reveal', 'drop', 'lowsweep', 'driveby', 'wheel', 'orbit'];
  let cineSeqIdx = 0;
  let autoCineTimer = null;

  function playNextAutoCine() {
    const shot = CINE_SEQUENCE[cineSeqIdx];
    const btn = document.querySelector(`.cine-btn[data-shot="${shot}"]`);
    if (btn) {
      playCine(shot, btn);
    }
    
    // Custom duration per cinematic transition to allow completion
    let duration = 9000; // default 9 seconds
    if (shot === 'reveal') duration = 9500;
    if (shot === 'lowsweep') duration = 9500;
    if (shot === 'orbit') duration = 15000; // orbit can run longer
    if (shot === 'drop') duration = 7000;
    if (shot === 'driveby') duration = 7000;
    if (shot === 'wheel') duration = 8500;
    
    cineSeqIdx = (cineSeqIdx + 1) % CINE_SEQUENCE.length;
    autoCineTimer = setTimeout(playNextAutoCine, duration);
  }

  function startAutoCine() {
    stopAutoCine();
    cineSeqIdx = 0;
    playNextAutoCine();
  }

  function stopAutoCine() {
    clearTimeout(autoCineTimer);
    autoCineTimer = null;
  }

  // Expose to window for call from the entrance transition
  window.startAutoCine = startAutoCine;
  window.stopAutoCine = stopAutoCine;

  document.querySelectorAll('.cine-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      stopAutoCine(); // stop auto-cycling on manual click
      playCine(btn.dataset.shot, btn);
    });
  });

  const DEFAULT_ORBIT = '0deg 75deg 105%';
  let panY = 0;

  document.getElementById('cine-stop')?.addEventListener('click', () => {
    stopAutoCine(); // stop auto-cycling
    stopCine(); panY = 0;
    mv.cameraOrbit  = DEFAULT_ORBIT;
    mv.cameraTarget = 'auto auto auto';
  });

  // Stop auto-cycling if user drags or interacts with the 3D model manually
  mv?.addEventListener('user-interaction', () => {
    stopAutoCine();
  });

  function rotateCamera(d) {
    const o = mv.getCameraOrbit();
    mv.cameraOrbit = `${(o.theta*180/Math.PI)+d}deg auto auto`;
  }
  function panCamera(dy) {
    panY = Math.max(-1.5, Math.min(1.5, panY+dy));
    mv.cameraTarget = `0m ${panY}m 0m`;
  }

  document.getElementById('cam-up')?.addEventListener('click',    () => panCamera(+0.12));
  document.getElementById('cam-down')?.addEventListener('click',  () => panCamera(-0.12));
  document.getElementById('cam-left')?.addEventListener('click',  () => rotateCamera(-15));
  document.getElementById('cam-right')?.addEventListener('click', () => rotateCamera(+15));
  document.getElementById('cam-reset')?.addEventListener('click', () => {
    panY = 0;
    mv.cameraOrbit  = DEFAULT_ORBIT;
    mv.cameraTarget = 'auto auto auto';
  });
}

/* ── TikTok Videos ────────────────────────────────────── */
async function loadTikTokVideos() {
  const track = document.getElementById('videos-track');
  if (!track) return;
  try {
    const res  = await fetch('/api/tiktok');
    const ids  = await res.json();

    if (!ids.length) {
      track.innerHTML = `
        <div class="video-placeholder">
          <i class="fa-brands fa-tiktok" style="font-size:2rem;color:var(--accent);margin-bottom:10px;display:block;"></i>
          <p style="color:var(--w40);font-size:0.85rem;">Videos coming soon — @jossyautomotive6</p>
        </div>`;
      return;
    }

    track.innerHTML = '';
    ids.forEach(id => {
      const card = document.createElement('div');
      card.className = 'video-card';
      card.innerHTML = `
        <iframe
          src="https://www.tiktok.com/embed/v2/${id}"
          class="video-iframe"
          frameborder="0"
          allow="encrypted-media"
          allowfullscreen
          loading="lazy"
        ></iframe>`;
      track.appendChild(card);
    });
  } catch {
    track.innerHTML = `<div class="video-placeholder"><p style="color:var(--w40);">Could not load videos.</p></div>`;
  }
}

/* ── TEMP Camera Debug HUD ────────────────────────────── */
function initCamHud() {
  const mv = document.getElementById('car-model-viewer');
  const hudTheta  = document.getElementById('hud-theta');
  const hudPhi    = document.getElementById('hud-phi');
  const hudRadius = document.getElementById('hud-radius');
  const hudTy     = document.getElementById('hud-ty');
  if (!mv || !hudTheta) return;

  mv.addEventListener('camera-change', () => {
    const o = mv.getCameraOrbit();
    const t = mv.getCameraTarget();
    hudTheta.textContent  = `${(o.theta  * 180 / Math.PI).toFixed(1)}°`;
    hudPhi.textContent    = `${(o.phi    * 180 / Math.PI).toFixed(1)}°`;
    hudRadius.textContent = `${o.radius.toFixed(3)}m`;
    hudTy.textContent     = `${t.y.toFixed(3)}m`;
  });

  function flashCopied(btn, label) {
    btn.textContent = 'Copied!';
    btn.classList.add('copied');
    setTimeout(() => { btn.textContent = label; btn.classList.remove('copied'); }, 1600);
  }

  document.getElementById('hud-copy-orbit')?.addEventListener('click', (e) => {
    const o = mv.getCameraOrbit();
    const th = (o.theta * 180 / Math.PI).toFixed(1);
    const ph = (o.phi   * 180 / Math.PI).toFixed(1);
    const r  = o.radius.toFixed(3);
    navigator.clipboard.writeText(`camera-orbit="${th}deg ${ph}deg ${r}m"`);
    flashCopied(e.target, 'Copy Orbit');
  });

  document.getElementById('hud-copy-target')?.addEventListener('click', (e) => {
    const t = mv.getCameraTarget();
    navigator.clipboard.writeText(`camera-target="${t.x.toFixed(3)}m ${t.y.toFixed(3)}m ${t.z.toFixed(3)}m"`);
    flashCopied(e.target, 'Copy Target');
  });
}

/* ── Boot ─────────────────────────────────────────────── */
document.addEventListener('DOMContentLoaded', () => {
  initHeroAnimations();
  initCounters();
  initScrollAnimations();
  initFilters();
  init3DShowcase();
  initCamHud();
  fetchCars(DEFAULT_CHANNEL);
  loadTikTokVideos();
});
