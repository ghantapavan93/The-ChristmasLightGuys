/* =====================================================================
   The Christmas Light Guys — interactions
   ===================================================================== */
(function () {
  'use strict';
  const $  = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => Array.from(c.querySelectorAll(s));
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- Year ---------- */
  const yEl = $('#year'); if (yEl) yEl.textContent = new Date().getFullYear();

  /* ---------- Loader + lights-on hero ---------- */
  const loader = $('#loader');
  const hero   = $('#hero');
  let poweredOn = false;
  function lightUp() {
    if (loader) {
      loader.classList.add('done');
      // hard guarantee it's gone even if the fade transition is interrupted
      setTimeout(() => { if (loader) loader.style.display = 'none'; }, 900);
    }
    if (hero) hero.classList.add('lit');
    document.body.classList.add('ready');
    // one-time "power-on" surge synced with the lights coming up
    if (!poweredOn && !reduceMotion) {
      poweredOn = true;
      const po = $('#poweron');
      if (po) { po.classList.add('fire'); po.addEventListener('animationend', () => po.remove(), { once: true }); }
    }
  }
  window.addEventListener('load', () => setTimeout(lightUp, reduceMotion ? 0 : 650));
  // Safety net in case 'load' is slow
  setTimeout(lightUp, 2600);

  /* ---------- Hero slideshow (cross-fade + Ken Burns) ---------- */
  const heroSlides = $$('#heroSlides .hero__slide');
  if (heroSlides.length > 1 && !reduceMotion) {
    let si = 0;
    setInterval(() => {
      if (document.hidden) return;
      heroSlides[si].classList.remove('is-active');
      si = (si + 1) % heroSlides.length;
      // restart Ken Burns by forcing reflow on the newly-active slide
      const next = heroSlides[si];
      next.classList.add('is-active');
      void next.offsetWidth;
    }, 6500);
  }

  /* ---------- Nav: scrolled state + mobile toggle ---------- */
  const nav = $('#nav');
  const onScroll = () => nav && nav.classList.toggle('scrolled', window.scrollY > 24);
  onScroll();
  window.addEventListener('scroll', onScroll, { passive: true });

  const toggle = $('#navToggle');
  const links  = $('#navLinks');
  if (toggle && links) {
    toggle.addEventListener('click', () => {
      const open = links.classList.toggle('open');
      toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
      toggle.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
    });
    links.addEventListener('click', (e) => {
      if (e.target.tagName === 'A') {
        links.classList.remove('open');
        toggle.setAttribute('aria-expanded', 'false');
      }
    });
  }

  /* ---------- Scroll reveals ---------- */
  if ('IntersectionObserver' in window && !reduceMotion) {
    const io = new IntersectionObserver((entries) => {
      entries.forEach((en) => {
        if (en.isIntersecting) {
          const t = en.target;
          t.classList.add('in');
          if (t.classList.contains('kicker')) t.classList.add('lit');
          else if (t.tagName === 'H2') t.classList.add('glow-in');
          io.unobserve(t);
        }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -8% 0px' });
    $$('.reveal').forEach((el) => io.observe(el));
  } else {
    $$('.reveal').forEach((el) => el.classList.add('in'));
  }

  /* ---------- Sticky mobile CTA (hide while estimate in view) ---------- */
  const mobcta = $('#mobcta');
  const estimate = $('#estimate');
  if (mobcta) {
    const show = () => {
      const past = window.scrollY > window.innerHeight * 0.6;
      let inEstimate = false;
      if (estimate) {
        const r = estimate.getBoundingClientRect();
        inEstimate = r.top < window.innerHeight && r.bottom > 0;
      }
      mobcta.classList.toggle('show', past && !inEstimate);
    };
    show();
    window.addEventListener('scroll', show, { passive: true });
  }

  /* ---------- Snow (hero only, lightweight canvas) ---------- */
  const canvas = $('#snow');
  if (canvas && !reduceMotion) {
    const ctx = canvas.getContext('2d');
    let w, h, flakes, raf;
    const COUNT = window.innerWidth < 720 ? 26 : 50;
    function size() {
      const host = canvas.parentElement;
      w = canvas.width  = host.offsetWidth;
      h = canvas.height = host.offsetHeight;
    }
    function make() {
      flakes = Array.from({ length: COUNT }, () => ({
        x: Math.random() * w, y: Math.random() * h,
        r: Math.random() * 2.4 + 0.8,
        sp: Math.random() * 0.5 + 0.25,
        dr: Math.random() * 0.6 - 0.3,
        o: Math.random() * 0.5 + 0.25
      }));
    }
    function tick() {
      ctx.clearRect(0, 0, w, h);
      for (const f of flakes) {
        ctx.beginPath();
        ctx.arc(f.x, f.y, f.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255,250,240,${f.o})`;
        ctx.shadowColor = 'rgba(255,240,210,.8)';
        ctx.shadowBlur = 6;
        ctx.fill();
        f.y += f.sp; f.x += f.dr;
        if (f.y > h + 5) { f.y = -5; f.x = Math.random() * w; }
        if (f.x > w + 5) f.x = -5; if (f.x < -5) f.x = w + 5;
      }
      raf = requestAnimationFrame(tick);
    }
    function start() { size(); make(); cancelAnimationFrame(raf); tick(); }
    start();
    let to; window.addEventListener('resize', () => { clearTimeout(to); to = setTimeout(start, 250); });
    // pause when hero off-screen
    if ('IntersectionObserver' in window) {
      new IntersectionObserver((e) => {
        if (e[0].isIntersecting) tick(); else cancelAnimationFrame(raf);
      }, { threshold: 0 }).observe(canvas.parentElement);
    }
  }

  /* ---------- Style selector ---------- */
  const picker  = $('#stylePicker');
  const styleImg = $('#styleImg');
  const cap = $('#styleCaption');
  let chosenStyle = 'Warm White Classic';
  if (picker && styleImg && cap) {
    const stage = $('.styles__stage');
    picker.addEventListener('click', (e) => {
      const chip = e.target.closest('.chip');
      if (!chip) return;
      $$('.chip', picker).forEach((c) => c.classList.remove('is-active'));
      chip.classList.add('is-active');
      chosenStyle = chip.dataset.title.replace(/&amp;/g, '&');
      const next = new Image();
      next.onload = () => {
        styleImg.src = next.src;
        if (stage) { stage.classList.remove('swap'); }
      };
      if (stage) stage.classList.add('swap');
      setTimeout(() => { next.src = chip.dataset.img; }, reduceMotion ? 0 : 280);
      cap.querySelector('h3').innerHTML = chip.dataset.title;
      cap.querySelector('p').innerHTML  = chip.dataset.desc;
    });
    // Carry style into quote when CTA clicked
    const styleCta = $('[data-style-cta]');
    if (styleCta) styleCta.addEventListener('click', () => preselectStyle(chosenStyle));
  }
  function preselectStyle(title) {
    const radios = $$('input[name="style"]');
    radios.forEach((r) => {
      if (r.value.replace(/&amp;/g, '&') === title) r.checked = true;
    });
  }

  /* ---------- Lights-on compare slider ---------- */
  const compare = $('#compare');
  if (compare) {
    const before = $('#compareBefore');
    const handle = $('#compareHandle');
    let dragging = false;
    const setPos = (clientX) => {
      const rect = compare.getBoundingClientRect();
      let pct = ((clientX - rect.left) / rect.width) * 100;
      pct = Math.max(2, Math.min(98, pct));
      before.style.width = pct + '%';
      handle.style.left = pct + '%';
      handle.setAttribute('aria-valuenow', Math.round(pct));
    };
    const start = () => (dragging = true);
    const end   = () => (dragging = false);
    const move  = (x) => dragging && setPos(x);
    handle.addEventListener('mousedown', start);
    window.addEventListener('mouseup', end);
    window.addEventListener('mousemove', (e) => move(e.clientX));
    handle.addEventListener('touchstart', start, { passive: true });
    window.addEventListener('touchend', end);
    window.addEventListener('touchmove', (e) => move(e.touches[0].clientX), { passive: true });
    compare.addEventListener('click', (e) => { if (e.target !== handle) setPos(e.clientX); });
    handle.addEventListener('keydown', (e) => {
      const cur = parseFloat(handle.getAttribute('aria-valuenow')) || 50;
      if (e.key === 'ArrowLeft')  { e.preventDefault(); setByPct(cur - 4); }
      if (e.key === 'ArrowRight') { e.preventDefault(); setByPct(cur + 4); }
    });
    function setByPct(pct) {
      pct = Math.max(2, Math.min(98, pct));
      before.style.width = pct + '%'; handle.style.left = pct + '%';
      handle.setAttribute('aria-valuenow', Math.round(pct));
    }
    // gentle auto-hint on first view
    if (!reduceMotion && 'IntersectionObserver' in window) {
      let teased = false;
      new IntersectionObserver((en) => {
        if (en[0].isIntersecting && !teased) {
          teased = true;
          let p = 50, dir = -1, steps = 0;
          const id = setInterval(() => {
            p += dir * 2; steps++;
            if (p <= 35) dir = 1; if (p >= 60) dir = -1;
            setByPct(p);
            if (steps > 22) { clearInterval(id); setByPct(50); }
          }, 28);
        }
      }, { threshold: 0.4 }).observe(compare);
    }
  }

  /* ---------- Gallery filter ---------- */
  const filters = $('#galleryFilters');
  const gitems  = $$('#galleryGrid .gitem');
  if (filters) {
    filters.addEventListener('click', (e) => {
      const b = e.target.closest('.filter'); if (!b) return;
      $$('.filter', filters).forEach((f) => f.classList.remove('is-active'));
      b.classList.add('is-active');
      const f = b.dataset.filter;
      gitems.forEach((it) => {
        const show = f === 'all' || it.dataset.cat.includes(f);
        it.classList.toggle('hide', !show);
      });
    });
  }

  /* ---------- Lightbox ---------- */
  const lb = $('#lightbox');
  if (lb) {
    const lbImg = $('#lbImg');
    const lbCap = $('#lbCap');
    const lbRequest = $('#lbRequest');
    const decode = (s) => (s || '').replace(/&amp;/g, '&');
    let order = [], idx = 0;
    const render = () => {
      const it = order[idx];
      lbImg.src = it.dataset.src;
      lbImg.alt = it.querySelector('img') ? it.querySelector('img').alt : '';
      if (lbCap) lbCap.textContent = decode(it.dataset.cap || '');
    };
    const open = (it) => {
      order = gitems.filter((g) => !g.classList.contains('hide'));
      idx = Math.max(0, order.indexOf(it));
      render();
      lb.classList.add('open'); lb.setAttribute('aria-hidden', 'false');
      document.body.style.overflow = 'hidden';
    };
    const close = () => { lb.classList.remove('open'); lb.setAttribute('aria-hidden', 'true'); document.body.style.overflow = ''; };
    const step = (d) => { idx = (idx + d + order.length) % order.length; render(); };
    gitems.forEach((it) => it.addEventListener('click', () => open(it)));
    $('#lbClose').addEventListener('click', close);
    $('#lbPrev').addEventListener('click', () => step(-1));
    $('#lbNext').addEventListener('click', () => step(1));
    lb.addEventListener('click', (e) => { if (e.target === lb) close(); });
    if (lbRequest) lbRequest.addEventListener('click', () => {
      const style = decode(order[idx] && order[idx].dataset.style);
      if (style) preselectStyle(style);
      close();
      const est = $('#estimate');
      if (est) window.scrollTo({ top: est.getBoundingClientRect().top + window.scrollY - 64, behavior: reduceMotion ? 'auto' : 'smooth' });
    });
    document.addEventListener('keydown', (e) => {
      if (!lb.classList.contains('open')) return;
      if (e.key === 'Escape') close();
      if (e.key === 'ArrowLeft') step(-1);
      if (e.key === 'ArrowRight') step(1);
    });
  }

  /* ---------- Design Your Glow ---------- */
  const dgChips = $('#dgChips');
  if (dgChips) {
    const hint = $('#dgHint');
    const summaryText = $('#dgSummaryText');
    const cta = $('#dgToEstimate');
    const decode = (s) => (s || '').replace(/&amp;/g, '&');
    const labels = { roofline: 'roofline', windows: 'windows & doors', trees: 'trees', hedges: 'hedges', walkways: 'walkways', wreaths: 'wreaths & garlands' };
    const areaChips = () => $$('.dchip:not(.dchip--all)', dgChips);
    const allChip = $('.dchip--all', dgChips);

    const setChip = (chip, on) => {
      chip.classList.toggle('on', on);
      chip.setAttribute('aria-pressed', on ? 'true' : 'false');
      const g = $('#g-' + chip.dataset.area);
      if (g) g.classList.toggle('on', on);
    };
    const listJoin = (a) => a.length === 1 ? a[0] : a.length === 2 ? a[0] + ' and ' + a[1] : a.slice(0, -1).join(', ') + ', and ' + a[a.length - 1];
    const updateSummary = () => {
      const active = areaChips().filter((c) => c.classList.contains('on'));
      if (hint && active.length) hint.classList.add('hide');
      const all = areaChips().every((c) => c.classList.contains('on'));
      allChip.classList.toggle('on', all);
      allChip.setAttribute('aria-pressed', all ? 'true' : 'false');
      if (!active.length) { summaryText.textContent = 'Nothing selected yet — tap an area to begin.'; cta.disabled = true; return; }
      cta.disabled = false;
      summaryText.textContent = all ? 'Full-property display — the works! ✨'
        : 'Warm-white ' + listJoin(active.map((c) => labels[c.dataset.area])) + '.';
    };

    dgChips.addEventListener('click', (e) => {
      const chip = e.target.closest('.dchip'); if (!chip) return;
      if (chip.dataset.area === 'all') {
        const turnOn = !areaChips().every((c) => c.classList.contains('on'));
        areaChips().forEach((c) => setChip(c, turnOn));
      } else {
        setChip(chip, !chip.classList.contains('on'));
      }
      updateSummary();
    });

    cta.addEventListener('click', () => {
      const boxes = $$('input[name="areas"]');
      const active = areaChips().filter((c) => c.classList.contains('on'));
      const all = areaChips().every((c) => c.classList.contains('on'));
      if (all) {
        const ent = boxes.find((b) => b.value === 'Entire Property'); if (ent) ent.checked = true;
      } else {
        active.forEach((c) => {
          const box = boxes.find((b) => decode(b.value) === decode(c.dataset.q));
          if (box) box.checked = true;
        });
      }
      const est = $('#estimate');
      if (est) window.scrollTo({ top: est.getBoundingClientRect().top + window.scrollY - 64, behavior: reduceMotion ? 'auto' : 'smooth' });
    });
  }

  /* ---------- Photo upload previews ---------- */
  const photos = $('#photos');
  const previews = $('#previews');
  if (photos && previews) {
    photos.addEventListener('change', () => {
      previews.innerHTML = '';
      Array.from(photos.files).slice(0, 6).forEach((file) => {
        if (!file.type.startsWith('image/')) return;
        const img = document.createElement('img');
        img.src = URL.createObjectURL(file);
        img.onload = () => URL.revokeObjectURL(img.src);
        previews.appendChild(img);
      });
    });
  }

  /* ---------- Guided quote flow ---------- */
  const form = $('#quoteForm');
  if (form) {
    const steps = $$('.qstep', form).filter((s) => !s.classList.contains('qdone'));
    const done  = $('.qdone', form);
    const dots  = $$('#quoteProgress span');
    const back  = $('#qback'), next = $('#qnext'), submit = $('#qsubmit'), qnav = $('#qnav');
    const LAST = steps.length - 1;
    let cur = 0;

    function render() {
      steps.forEach((s, i) => s.classList.toggle('is-active', i === cur));
      done.classList.remove('is-active');
      dots.forEach((d, i) => {
        d.classList.toggle('is-active', i === cur);
        d.classList.toggle('done', i < cur);
      });
      back.hidden = cur === 0;
      next.hidden = cur === LAST;
      submit.hidden = cur !== LAST;
    }
    function validateStep() {
      const active = steps[cur];
      const required = $$('[required]', active);
      for (const f of required) {
        if (!f.value.trim() || (f.type === 'radio' && !$(`input[name="${f.name}"]:checked`, active))) {
          f.reportValidity ? f.reportValidity() : f.focus();
          f.focus();
          return false;
        }
      }
      // step 0 also needs a property radio
      if (cur === 0 && !$('input[name="property"]:checked')) {
        alert('Please choose Residential or Commercial.');
        return false;
      }
      return true;
    }
    next.addEventListener('click', () => {
      if (!validateStep()) return;
      cur = Math.min(LAST, cur + 1);
      render();
      form.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth', block: 'start' });
    });
    back.addEventListener('click', () => { cur = Math.max(0, cur - 1); render(); });

    // ── LEAD DELIVERY ────────────────────────────────────────────────
    // Where quote requests are sent. Easiest option, no signup:
    //   FormSubmit — the FIRST submission triggers a one-time activation
    //   email to the address below; click it once and the form is live.
    //   (Alternatively use Web3Forms/Formspree/Netlify Forms.)
    // Whatever happens, a local backstop is saved and an email fallback is
    // offered, so a lead is NEVER lost silently.
    const LEAD_ENDPOINT = 'https://formsubmit.co/ajax/guys@thechristmaslightguys.com';
    const BIZ_EMAIL = 'guys@thechristmaslightguys.com';

    function celebrate() {
      if (reduceMotion) return;
      const host = form.closest('.quote') || form;
      const cv = document.createElement('canvas');
      cv.className = 'burst';
      host.appendChild(cv);
      const c = cv.getContext('2d');
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const r = host.getBoundingClientRect();
      const W = cv.width = r.width * dpr, H = cv.height = r.height * dpr;
      const cx = W / 2, cy = H * 0.32;
      const COLORS = ['255,206,107', '255,241,194', '239,59,59', '47,158,111', '154,215,255'];
      const N = window.innerWidth < 720 ? 70 : 120;
      const ps = Array.from({ length: N }, () => {
        const a = Math.random() * Math.PI * 2, sp = (Math.random() * 6 + 3) * dpr;
        return { x: cx, y: cy, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp - 3 * dpr,
          life: 1, r: (Math.random() * 3 + 1.5) * dpr, c: COLORS[(Math.random() * COLORS.length) | 0] };
      });
      let t = 0;
      const tick = () => {
        c.clearRect(0, 0, W, H);
        c.globalCompositeOperation = 'lighter';
        let alive = false;
        for (const p of ps) {
          p.vx *= 0.97; p.vy = p.vy * 0.97 + 0.15 * dpr; p.x += p.vx; p.y += p.vy; p.life -= 0.016;
          if (p.life <= 0) continue;
          alive = true;
          c.fillStyle = `rgba(${p.c},${p.life})`;
          c.shadowColor = `rgba(${p.c},${p.life})`; c.shadowBlur = 10 * p.life;
          c.beginPath(); c.arc(p.x, p.y, p.r * p.life, 0, 6.2832); c.fill();
        }
        t++;
        if (alive && t < 140) requestAnimationFrame(tick); else cv.remove();
      };
      tick();
    }

    function showDone(kind, mailtoHref) {
      steps.forEach((s) => s.classList.remove('is-active'));
      done.classList.add('is-active');
      celebrate();
      dots.forEach((d) => { d.classList.add('done'); d.classList.remove('is-active'); });
      qnav.style.display = 'none';
      const msg = $('#qdoneMsg'), emailBtn = $('#qdoneEmail');
      if (kind === 'ok') {
        if (msg) msg.textContent = "Thanks! Your request just landed in our inbox — we'll review your property and reach out with a custom plan. Prefer to talk now?";
        if (emailBtn) emailBtn.hidden = true;
      } else {
        if (msg) msg.textContent = "Thanks! Your details are saved. To finish, tap “Finish by email” (it's pre-filled — just hit send), or call us now.";
        if (emailBtn && mailtoHref) { emailBtn.href = mailtoHref; emailBtn.hidden = false; }
      }
      done.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth', block: 'center' });
    }

    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      if (!validateStep()) return;

      const data = new FormData(form);
      const get = (k) => (data.get(k) || '').toString().trim() || '—';
      const dec = (s) => s.replace(/&amp;/g, '&');
      const areas = data.getAll('areas').map((a) => dec(a)).join(', ') || '—';

      // Silently drop bots (honeypot filled)
      if ((data.get('_honey') || '').toString().trim()) { showDone('ok'); return; }

      const payload = {
        _subject: `New estimate request — ${get('property')} — ${get('name')}`,
        Name: get('name'), Phone: get('phone'), Email: get('email'),
        Property: get('property'), Address_or_ZIP: get('zip'), Size: get('size'),
        Outdoor_outlets: get('outlets'), Areas: areas,
        Style: dec((data.get('style') || '—').toString()),
        Preferred_timing: get('timing'), Best_time_to_reach: get('besttime'),
        Notes: get('notes'), Source: 'Website quote form'
      };

      // Email fallback (always available)
      const lines = Object.entries(payload).filter(([k]) => k !== '_subject')
        .map(([k, v]) => `${k.replace(/_/g, ' ')}: ${v}`).join('\n')
        + '\n\n(Photos: please attach the images you selected before sending.)';
      const mailtoHref = `mailto:${BIZ_EMAIL}?subject=${encodeURIComponent(payload._subject)}&body=${encodeURIComponent(lines)}`;

      // Local backstop — never lose a lead
      try {
        const saved = JSON.parse(localStorage.getItem('tclg_leads') || '[]');
        saved.push({ ...payload, at: new Date().toISOString() });
        localStorage.setItem('tclg_leads', JSON.stringify(saved));
      } catch (_) { /* ignore */ }

      submit.disabled = true;
      const label = submit.textContent;
      submit.textContent = 'Sending…';

      let ok = false;
      if (LEAD_ENDPOINT) {
        try {
          const r = await fetch(LEAD_ENDPOINT, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
            body: JSON.stringify(payload)
          });
          const j = await r.json().catch(() => ({}));
          ok = r.ok && j.success !== false && j.success !== 'false';
        } catch (_) { ok = false; }
      }

      submit.disabled = false;
      submit.textContent = label;
      showDone(ok ? 'ok' : 'fallback', mailtoHref);
    });

    render();
  }

  /* ---------- Depth: hanging light garland ---------- */
  const NS = 'http://www.w3.org/2000/svg';
  function buildGarland(el, o) {
    if (!el) return;
    o = o || {};
    const W = el.offsetWidth || window.innerWidth;
    const H = parseFloat(getComputedStyle(el).height) || 82;
    const spacing = window.innerWidth < 720 ? 32 : 46;
    const count = Math.max(6, Math.round(W / spacing));
    const baseY = o.baseY != null ? o.baseY : 12;
    const dip = o.dip != null ? o.dip : 26;
    const colors = ['#ffce6b', '#ff5e5e', '#5ec8ff', '#7ce07c', '#c98bff', '#fff1c2'];

    const svg = document.createElementNS(NS, 'svg');
    svg.setAttribute('preserveAspectRatio', 'none');
    svg.setAttribute('viewBox', `0 0 ${W} ${H}`);
    let d = `M 0 ${baseY}`;
    for (let i = 0; i < count; i++) {
      const x1 = ((i + 1) / count) * W;
      const cx = ((i + 0.5) / count) * W;
      d += ` Q ${cx} ${baseY + dip} ${x1} ${baseY}`;
    }
    const path = document.createElementNS(NS, 'path');
    path.setAttribute('d', d);
    path.setAttribute('class', 'gwire');
    svg.appendChild(path);

    el.innerHTML = '';
    el.appendChild(svg);
    for (let i = 0; i < count; i++) {
      const x = ((i + 0.5) / count) * 100;
      const b = document.createElement('div');
      b.className = 'gbulb';
      b.style.left = x + '%';
      b.style.top = (baseY + dip - 2) + 'px';
      b.style.marginLeft = '-6px';
      b.style.color = colors[i % colors.length];
      b.style.setProperty('--td', (Math.random() * 3).toFixed(2) + 's');
      b.style.setProperty('--tw', (2.4 + Math.random() * 1.8).toFixed(2) + 's');
      b.style.setProperty('--sw', (4 + Math.random() * 2).toFixed(2) + 's');
      el.appendChild(b);
    }
  }

  /* ---------- Depth: floating bokeh orbs ---------- */
  function buildBokeh(el, o) {
    if (!el) return;
    o = o || {};
    const n = o.count || (window.innerWidth < 720 ? 8 : 14);
    const min = o.min || 18, max = o.max || 82;
    const topMin = o.topMin || 0, topRange = o.topRange != null ? o.topRange : 100;
    const oMin = o.oMin != null ? o.oMin : 0.18, oRange = o.oRange != null ? o.oRange : 0.4;
    const colors = ['rgba(255,206,107,1)', 'rgba(255,120,120,.85)', 'rgba(255,241,194,1)', 'rgba(126,200,255,.8)'];
    el.innerHTML = '';
    for (let i = 0; i < n; i++) {
      const s = document.createElement('span');
      const size = min + Math.random() * (max - min);
      s.style.width = s.style.height = size.toFixed(0) + 'px';
      s.style.left = (Math.random() * 100).toFixed(1) + '%';
      s.style.top = (topMin + Math.random() * topRange).toFixed(1) + '%';
      s.style.background = colors[i % colors.length];
      s.style.opacity = (oMin + Math.random() * oRange).toFixed(2);
      s.style.setProperty('--bx', (Math.random() * 30 - 15).toFixed(0) + 'px');
      s.style.setProperty('--by', (-18 - Math.random() * 30).toFixed(0) + 'px');
      s.style.animationDuration = (6 + Math.random() * 8).toFixed(1) + 's';
      s.style.animationDelay = (-Math.random() * 8).toFixed(1) + 's';
      el.appendChild(s);
    }
  }

  const garland = $('#garland');
  const garland2 = $('#garland2');
  const bokeh = $('#bokeh');
  const bokehFront = $('#bokehFront');
  function buildDepth() {
    buildGarland(garland, { baseY: 12, dip: 28 });
    buildGarland(garland2, { baseY: 10, dip: 20 });
    buildBokeh(bokeh);
    buildBokeh(bokehFront, { count: window.innerWidth < 720 ? 4 : 6, min: 90, max: 240, topMin: 45, topRange: 55, oMin: 0.1, oRange: 0.22 });
  }
  buildDepth();
  let dt; window.addEventListener('resize', () => { clearTimeout(dt); dt = setTimeout(buildDepth, 300); });

  /* ---------- Depth: hero parallax (mouse + scroll) ---------- */
  const coarse = window.matchMedia('(pointer:coarse)').matches;
  const heroSec = $('#hero'), heroMedia = $('#heroMedia'), heroContent = $('#heroContent');
  if (heroSec && !reduceMotion) {
    let tmx = 0, tmy = 0, mx = 0, my = 0;
    if (!coarse) {
      heroSec.addEventListener('pointermove', (e) => {
        const r = heroSec.getBoundingClientRect();
        tmx = (e.clientX - r.left) / r.width - 0.5;
        tmy = (e.clientY - r.top) / r.height - 0.5;
      });
      heroSec.addEventListener('pointerleave', () => { tmx = 0; tmy = 0; });
    }
    const loop = () => {
      mx += (tmx - mx) * 0.06; my += (tmy - my) * 0.06;
      const sc = window.scrollY;
      if (sc < window.innerHeight) {
        if (heroMedia)  heroMedia.style.transform  = `translate3d(${(mx * -18).toFixed(1)}px,${(my * -12 + sc * 0.18).toFixed(1)}px,0) scale(1.07)`;
        if (bokeh)      bokeh.style.transform       = `translate3d(${(mx * 32).toFixed(1)}px,${(my * 24).toFixed(1)}px,0)`;
        if (bokehFront) bokehFront.style.transform  = `translate3d(${(mx * 60).toFixed(1)}px,${(my * 46 + sc * -0.12).toFixed(1)}px,0)`;
        if (garland)    garland.style.transform     = `translate3d(${(mx * -10).toFixed(1)}px,0,0)`;
        if (heroContent)heroContent.style.transform = `translate3d(${(mx * 10).toFixed(1)}px,${(my * 8).toFixed(1)}px,0)`;
      }
      requestAnimationFrame(loop);
    };
    loop();
  }

  /* ---------- Depth: 3D tilt on cards ---------- */
  if (!reduceMotion && !coarse) {
    $$('.svc, .showcase__tile, .gitem, .step, .review, .why__item').forEach((el) => {
      el.classList.add('tilt');
      el.addEventListener('pointerenter', () => el.classList.add('is-tilting'));
      el.addEventListener('pointermove', (e) => {
        const r = el.getBoundingClientRect();
        const px = (e.clientX - r.left) / r.width - 0.5;
        const py = (e.clientY - r.top) / r.height - 0.5;
        el.style.transform = `perspective(900px) rotateX(${(py * -7).toFixed(2)}deg) rotateY(${(px * 9).toFixed(2)}deg) translateY(-6px) scale(1.015)`;
        el.style.boxShadow = `${(px * -24).toFixed(0)}px ${(20 - py * 12).toFixed(0)}px 52px rgba(0,0,0,.55)`;
      });
      const reset = () => { el.classList.remove('is-tilting'); el.style.transform = ''; el.style.boxShadow = ''; };
      el.addEventListener('pointerleave', reset);
    });
  }

  /* ---------- Depth: lit scroll-progress wire ---------- */
  const scrollGlow = $('#scrollGlow');
  if (scrollGlow) {
    const upd = () => {
      const h = document.documentElement.scrollHeight - window.innerHeight;
      scrollGlow.style.width = (h > 0 ? (window.scrollY / h) * 100 : 0) + '%';
    };
    upd();
    window.addEventListener('scroll', upd, { passive: true });
    window.addEventListener('resize', upd);
  }

  /* (lights flicker-on + heading glow are wired into the reveal observer above) */

  /* ---------- Depth: magnetic buttons ---------- */
  if (!reduceMotion && !coarse) {
    $$('.btn--primary, .nav__cta').forEach((b) => {
      b.addEventListener('pointermove', (e) => {
        const r = b.getBoundingClientRect();
        const x = (e.clientX - r.left - r.width / 2) / r.width;
        const y = (e.clientY - r.top - r.height / 2) / r.height;
        b.style.transform = `translate(${(x * 10).toFixed(1)}px,${(y * 8 - 3).toFixed(1)}px)`;
      });
      b.addEventListener('pointerleave', () => { b.style.transform = ''; });
    });
  }

  /* ---------- Depth: cursor light trail ---------- */
  const trail = $('#trail');
  if (trail && !reduceMotion && !coarse) {
    const tctx = trail.getContext('2d');
    let tw, th, parts = [], lastX = 0, lastY = 0, running = false;
    const COLORS = ['255,206,107', '255,241,194', '255,150,90', '255,120,120'];
    const sizeTrail = () => { tw = trail.width = window.innerWidth; th = trail.height = window.innerHeight; };
    sizeTrail();
    window.addEventListener('resize', sizeTrail);
    // Don't sprinkle sparks over forms/controls — reads as clutter there
    const trailBlocked = 'input, select, textarea, button, .quote, #estimate, .faq__q, .opt, .chip, .dchip, .field';
    window.addEventListener('pointermove', (e) => {
      if (e.pointerType === 'touch') return;
      if (e.target && e.target.closest && e.target.closest(trailBlocked)) { lastX = e.clientX; lastY = e.clientY; return; }
      const dx = e.clientX - lastX, dy = e.clientY - lastY;
      const dist = Math.hypot(dx, dy);
      const n = Math.min(2, Math.floor(dist / 10));
      for (let i = 0; i < n + 1; i++) {
        if (parts.length > 140) break;
        parts.push({
          x: e.clientX + (Math.random() * 8 - 4),
          y: e.clientY + (Math.random() * 8 - 4),
          vx: (Math.random() * 0.6 - 0.3), vy: (Math.random() * 0.6 - 0.3) + 0.2,
          life: 1, r: Math.random() * 2.2 + 0.8,
          c: COLORS[(Math.random() * COLORS.length) | 0]
        });
      }
      lastX = e.clientX; lastY = e.clientY;
      if (!running) { running = true; requestAnimationFrame(drawTrail); }
    }, { passive: true });
    function drawTrail() {
      tctx.clearRect(0, 0, tw, th);
      for (let i = parts.length - 1; i >= 0; i--) {
        const p = parts[i];
        p.x += p.vx; p.y += p.vy; p.life -= 0.022;
        if (p.life <= 0) { parts.splice(i, 1); continue; }
        tctx.beginPath();
        tctx.arc(p.x, p.y, p.r * p.life, 0, Math.PI * 2);
        tctx.fillStyle = `rgba(${p.c},${(p.life * 0.9).toFixed(2)})`;
        tctx.shadowColor = `rgba(${p.c},${p.life.toFixed(2)})`;
        tctx.shadowBlur = 12 * p.life;
        tctx.fill();
      }
      if (parts.length) { requestAnimationFrame(drawTrail); }
      else { tctx.clearRect(0, 0, tw, th); running = false; }
    }
  }

  /* ---------- FAQ accordion ---------- */
  const faqList = $('#faqList');
  if (faqList) {
    const items = $$('.faq__item', faqList);
    items.forEach((item) => {
      const q = $('.faq__q', item);
      const a = $('.faq__a', item);
      q.addEventListener('click', () => {
        const open = item.classList.toggle('open');
        q.setAttribute('aria-expanded', open ? 'true' : 'false');
        a.style.maxHeight = open ? a.scrollHeight + 'px' : '0px';
      });
    });
    window.addEventListener('resize', () => {
      items.forEach((item) => {
        if (item.classList.contains('open')) {
          const a = $('.faq__a', item);
          a.style.maxHeight = a.scrollHeight + 'px';
        }
      });
    });
  }

  /* ---------- Roofline draw-on (scroll-reactive) ---------- */
  const roofSec = $('#roofdraw'), rfRect = $('#rfClipRect');
  if (roofSec && rfRect && !reduceMotion) {
    rfRect.setAttribute('width', '0');
    const onRoof = () => {
      const r = roofSec.getBoundingClientRect();
      const vh = window.innerHeight;
      const p = Math.max(0, Math.min(1, (vh - r.top) / (vh * 0.85)));
      rfRect.setAttribute('width', Math.round(p * 1200));
    };
    onRoof();
    window.addEventListener('scroll', onRoof, { passive: true });
    window.addEventListener('resize', onRoof);
  }

  /* ---------- Particle light-words (ported from a 21st.dev concept, branded) ---------- */
  const sparkCanvas = $('#sparkCanvas');
  const sparkSec = $('#spark');
  if (sparkCanvas && sparkSec && !reduceMotion) {
    const ctx = sparkCanvas.getContext('2d');
    const WORDS = ['WE DO LIGHTS RIGHT', 'AUSTIN, TEXAS', 'MERRY CHRISTMAS', "LET'S LIGHT IT UP"];
    // Warm-weighted festive palette (mostly gold/warm-white, hints of red/green/blue)
    const P = [[246,200,99],[255,241,194],[255,210,120],[255,225,160],[239,59,59],[47,158,111],[154,215,255]];
    const WEIGHTED = [0,0,1,1,2,2,3,3,4,5,6].map((i) => P[i]);
    let W = 0, H = 0, dpr = 1, particles = [], frame = 0, wordIdx = 0, raf = null, running = false;
    const mouse = { x: -9999, y: -9999, down: false };
    const rand = (a, b) => a + Math.random() * (b - a);
    const randPos = (cx, cy, mag) => {
      let dx = Math.random() * W - cx, dy = Math.random() * H - cy; const m = Math.hypot(dx, dy) || 1;
      return { x: cx + dx / m * mag, y: cy + dy / m * mag };
    };
    const size = () => {
      dpr = Math.min(window.devicePixelRatio || 1, 1.6);
      const r = sparkCanvas.getBoundingClientRect();
      W = sparkCanvas.width = Math.max(1, Math.round(r.width * dpr));
      H = sparkCanvas.height = Math.max(1, Math.round(r.height * dpr));
    };
    const makeParticle = () => {
      const p = { pos: {}, vel: { x: 0, y: 0 }, acc: { x: 0, y: 0 }, target: { x: 0, y: 0 },
        maxSpeed: rand(4, 10), maxForce: 0, sz: rand(2, 4.5) * dpr, near: 100 * dpr,
        sc: { r: 0, g: 0, b: 0 }, tc: { r: 0, g: 0, b: 0 }, cw: 0, cbr: rand(0.004, 0.03), killed: false };
      p.maxForce = p.maxSpeed * 0.05;
      const rp = randPos(W / 2, H / 2, (W + H) / 2); p.pos.x = rp.x; p.pos.y = rp.y;
      return p;
    };
    const killParticle = (p) => {
      if (p.killed) return;
      const rp = randPos(W / 2, H / 2, (W + H) / 2); p.target.x = rp.x; p.target.y = rp.y;
      p.sc = { r: p.sc.r + (p.tc.r - p.sc.r) * p.cw, g: p.sc.g + (p.tc.g - p.sc.g) * p.cw, b: p.sc.b + (p.tc.b - p.sc.b) * p.cw };
      p.tc = { r: 0, g: 0, b: 0 }; p.cw = 0; p.killed = true;
    };
    const nextWord = (word) => {
      const off = document.createElement('canvas'); off.width = W; off.height = H;
      const o = off.getContext('2d');
      o.fillStyle = '#fff'; o.textAlign = 'center'; o.textBaseline = 'middle';
      let fs = Math.floor(H * 0.46);
      do { o.font = `800 ${fs}px Inter, Arial, sans-serif`; if (o.measureText(word).width < W * 0.86) break; fs -= 2; } while (fs > 12);
      o.font = `800 ${fs}px Inter, Arial, sans-serif`;
      o.fillText(word, W / 2, H / 2);
      const data = o.getImageData(0, 0, W, H).data;
      const col = WEIGHTED[(Math.random() * WEIGHTED.length) | 0];
      const nc = { r: col[0], g: col[1], b: col[2] };
      const step = (window.innerWidth < 720 ? 12 : 8) * Math.round(dpr);
      const coords = [];
      for (let i = 0; i < data.length; i += step * 4) { if (data[i + 3] > 0) coords.push(i); }
      for (let i = coords.length - 1; i > 0; i--) { const j = (Math.random() * (i + 1)) | 0; const t = coords[i]; coords[i] = coords[j]; coords[j] = t; }
      let pi = 0;
      for (const ci of coords) {
        const x = (ci / 4) % W, y = Math.floor((ci / 4) / W);
        let p;
        if (pi < particles.length) { p = particles[pi]; p.killed = false; } else { p = makeParticle(); particles.push(p); }
        pi++;
        p.sc = { r: p.sc.r + (p.tc.r - p.sc.r) * p.cw, g: p.sc.g + (p.tc.g - p.sc.g) * p.cw, b: p.sc.b + (p.tc.b - p.sc.b) * p.cw };
        p.tc = nc; p.cw = 0; p.target.x = x; p.target.y = y;
      }
      for (let i = pi; i < particles.length; i++) killParticle(particles[i]);
    };
    const move = (p) => {
      const dx = p.target.x - p.pos.x, dy = p.target.y - p.pos.y, dist = Math.hypot(dx, dy);
      const prox = dist < p.near ? dist / p.near : 1, m = dist || 1;
      let tx = dx / m * p.maxSpeed * prox, ty = dy / m * p.maxSpeed * prox;
      let sx = tx - p.vel.x, sy = ty - p.vel.y; const sm = Math.hypot(sx, sy) || 1;
      sx = sx / sm * p.maxForce; sy = sy / sm * p.maxForce;
      p.vel.x += sx; p.vel.y += sy; p.pos.x += p.vel.x; p.pos.y += p.vel.y;
    };
    const tick = () => {
      ctx.globalCompositeOperation = 'source-over';
      ctx.fillStyle = 'rgba(7,11,22,0.20)'; ctx.fillRect(0, 0, W, H);
      ctx.globalCompositeOperation = 'lighter';
      for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        move(p);
        if (p.cw < 1) p.cw = Math.min(p.cw + p.cbr, 1);
        const r = (p.sc.r + (p.tc.r - p.sc.r) * p.cw) | 0;
        const g = (p.sc.g + (p.tc.g - p.sc.g) * p.cw) | 0;
        const b = (p.sc.b + (p.tc.b - p.sc.b) * p.cw) | 0;
        ctx.fillStyle = `rgb(${r},${g},${b})`;
        ctx.beginPath(); ctx.arc(p.pos.x, p.pos.y, p.sz * 0.5, 0, 6.2832); ctx.fill();
        if (p.killed && (p.pos.x < -10 || p.pos.x > W + 10 || p.pos.y < -10 || p.pos.y > H + 10)) particles.splice(i, 1);
      }
      if (mouse.down) {
        const rad = 60 * dpr;
        for (const p of particles) if (Math.hypot(p.pos.x - mouse.x, p.pos.y - mouse.y) < rad) killParticle(p);
      }
      frame++;
      if (frame % 260 === 0) { wordIdx = (wordIdx + 1) % WORDS.length; nextWord(WORDS[wordIdx]); }
      raf = requestAnimationFrame(tick);
    };
    const start = () => { if (running) return; running = true; raf = requestAnimationFrame(tick); };
    const stop = () => { running = false; if (raf) cancelAnimationFrame(raf); raf = null; };

    size(); sparkSec.classList.add('spark--anim'); nextWord(WORDS[0]);
    if ('IntersectionObserver' in window) {
      new IntersectionObserver((e) => { e[0].isIntersecting ? start() : stop(); }, { threshold: 0.04 }).observe(sparkSec);
    } else start();
    let rs; window.addEventListener('resize', () => { clearTimeout(rs); rs = setTimeout(() => { const was = running; stop(); size(); particles = []; nextWord(WORDS[wordIdx]); if (was) start(); }, 300); });
    sparkCanvas.addEventListener('pointermove', (e) => { const r = sparkCanvas.getBoundingClientRect(); mouse.x = (e.clientX - r.left) * dpr; mouse.y = (e.clientY - r.top) * dpr; });
    sparkCanvas.addEventListener('pointerdown', () => { mouse.down = true; });
    window.addEventListener('pointerup', () => { mouse.down = false; });
    sparkCanvas.addEventListener('pointerleave', () => { mouse.x = -9999; mouse.y = -9999; mouse.down = false; });
  }

  /* ---------- Smooth-scroll offset for sticky nav on hash links ---------- */
  $$('a[href^="#"]').forEach((a) => {
    a.addEventListener('click', (e) => {
      const id = a.getAttribute('href');
      if (id.length < 2) return;
      const target = $(id);
      if (!target) return;
      e.preventDefault();
      const y = target.getBoundingClientRect().top + window.scrollY - 64;
      window.scrollTo({ top: y, behavior: reduceMotion ? 'auto' : 'smooth' });
    });
  });
})();
