// Small UI effects adapted to this vanilla stack (ideas from React Bits, Magic UI, Aceternity and
// interactive-particle libraries): click sparks, spotlight cards, border beams, shiny eyebrows,
// blur-in headings, an interactive dot grid, a particle wordmark and meteors.
// Every canvas pauses off screen, and all of it is skipped for reduced motion.
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
const fine = matchMedia('(hover: hover) and (pointer: fine)').matches;
const COLORS = ['#feda75', '#fa7e1e', '#d62976', '#962fbf', '#4f5bd5'];
const onScreen = (el, cb, margin = '100px') => new IntersectionObserver(([e]) => cb(e.isIntersecting), { rootMargin: margin }).observe(el);

/* click sparks: short gradient rays from every click/tap */
function clickSpark() {
  document.addEventListener('pointerdown', (e) => {
    if (e.button !== 0 || e.target.closest('input, select, textarea, #cfg-stage, #ring')) return;
    for (let i = 0; i < 8; i++) {
      const s = document.createElement('i');
      s.className = 'spark';
      s.style.cssText = `left:${e.clientX}px;top:${e.clientY}px;background:${COLORS[i % 5]};rotate:${i * 45}deg`;
      document.body.append(s);
      s.animate([{ transform: 'translateY(0) scaleY(1)', opacity: 1 }, { transform: 'translateY(-26px) scaleY(.2)', opacity: 0 }], { duration: 420, easing: 'cubic-bezier(.2,.7,.3,1)' }).onfinish = () => s.remove();
    }
  }, { passive: true });
}

/* spotlight: a soft glow that follows the pointer inside cards */
function spotlight() {
  const sel = '.svc, .stat, .pk__panel, .book, .calc__box, .study__box, .cfg__panel, .faq details, .step, .cmp__wrap';
  $$(sel).forEach((el) => { el.classList.add('spot'); el.prepend(Object.assign(document.createElement('i'), { className: 'spot__glow', ariaHidden: 'true' })); });
  document.addEventListener('pointermove', (e) => {
    const el = e.target.closest?.('.spot'); if (!el) return;
    const r = el.getBoundingClientRect();
    el.style.setProperty('--mx', `${e.clientX - r.left}px`); el.style.setProperty('--my', `${e.clientY - r.top}px`);
  }, { passive: true });
}

/* border beam: a light that travels around the edge of the key boxes */
function beams() {
  $$('.pk__box, .book, .film__frame, .calc__box').forEach((el, i) => {
    el.classList.add('has-beam');
    el.append(Object.assign(document.createElement('i'), { className: 'beam', ariaHidden: 'true', style: `--delay:${-i * 2.3}s` }));
  });
}

/* shiny eyebrow text + shimmer sweep on gradient buttons */
function shine() {
  $$('.eyebrow').forEach((p) => {
    [...p.childNodes].filter((n) => n.nodeType === 3 && n.nodeValue.trim()).forEach((n) => {
      const s = document.createElement('span'); s.className = 'shiny'; n.replaceWith(s); s.append(n);
    });
  });
  $$('.btn--grad').forEach((b) => b.append(Object.assign(document.createElement('i'), { className: 'shimmer', ariaHidden: 'true' })));
}

/* blur-in headings: words sharpen one after another as the heading enters */
function blurHeadings() {
  $$('.head h2, .faq__intro h2, .process__intro h2').forEach((h) => {
    let k = 0;
    const split = (node) => {
      [...node.childNodes].forEach((n) => {
        if (n.nodeType === 3) {
          const frag = document.createDocumentFragment();
          n.nodeValue.split(/(\s+)/).forEach((w) => {
            if (!w) return;
            if (/^\s+$/.test(w)) { frag.append(w); return; }
            const s = document.createElement('span'); s.className = 'bw'; s.style.setProperty('--i', k++); s.textContent = w; frag.append(s);
          });
          n.replaceWith(frag);
        } else if (n.nodeType === 1 && !n.classList.contains('grad')) split(n);
        else if (n.nodeType === 1) { n.classList.add('bw'); n.style.setProperty('--i', k++); }
      });
    };
    split(h);
    h.classList.add('blurin');
    const o = new IntersectionObserver(([e]) => { if (e.isIntersecting) { h.classList.add('is-in'); o.disconnect(); } }, { threshold: .4 });
    o.observe(h);
  });
}

/* interactive dot grid behind the growth calculator */
function dotGrid() {
  const host = $('#calc'); if (!host) return;
  const c = document.createElement('canvas'); c.className = 'dotgrid'; c.setAttribute('aria-hidden', 'true'); host.prepend(c);
  const ctx = c.getContext('2d');
  const gap = innerWidth < 700 ? 30 : 26, dpr = Math.min(devicePixelRatio, 1.5);
  let w, h, dots = [], mx = -999, my = -999, run = false, raf = 0;
  const size = () => {
    w = host.clientWidth; h = host.clientHeight; c.width = w * dpr; c.height = h * dpr; c.style.height = h + 'px';
    dots = []; for (let y = gap / 2; y < h; y += gap) for (let x = gap / 2; x < w; x += gap) dots.push({ x, y, ox: x, oy: y });
  };
  size(); new ResizeObserver(size).observe(host);
  host.addEventListener('pointermove', (e) => { const r = c.getBoundingClientRect(); mx = e.clientX - r.left; my = e.clientY - r.top; }, { passive: true });
  host.addEventListener('pointerleave', () => { mx = my = -999; });
  const grd = () => { const g = ctx.createLinearGradient(0, 0, w, h); COLORS.forEach((col, i) => g.addColorStop(i / 4, col)); return g; };
  function frame(t) {
    if (!run) return; raf = requestAnimationFrame(frame);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0); ctx.clearRect(0, 0, w, h);
    const hot = grd();
    for (const d of dots) {
      const dx = d.ox - mx, dy = d.oy - my, dist = Math.hypot(dx, dy), R = 140;
      const f = dist < R ? (1 - dist / R) : 0;
      d.x += (d.ox + (f ? dx / dist * f * 18 : 0) - d.x) * .15; d.y += (d.oy + (f ? dy / dist * f * 18 : 0) - d.y) * .15;
      const wave = .5 + .5 * Math.sin(t / 900 + d.ox * .01 + d.oy * .013);
      ctx.globalAlpha = .1 + wave * .08 + f * .8;
      ctx.fillStyle = f > .05 ? hot : '#c7b6d6';
      ctx.beginPath(); ctx.arc(d.x, d.y, 1.3 + f * 2.2, 0, 6.283); ctx.fill();
    }
  }
  onScreen(host, (v) => { run = v; cancelAnimationFrame(raf); if (v) raf = requestAnimationFrame(frame); });
}

/* particle wordmark in the footer: "Magmafy" made of gradient dots that scatter from the pointer */
function particleWord() {
  const big = $('.footer__big'); if (!big) return;
  const c = document.createElement('canvas'); c.className = 'pword'; c.setAttribute('aria-hidden', 'true');
  big.after(c); big.classList.add('is-canvas');
  const ctx = c.getContext('2d'), dpr = Math.min(devicePixelRatio, 2);
  let w, h, pts = [], mx = -999, my = -999, run = false, raf = 0;
  function build() {
    w = c.clientWidth; h = Math.round(Math.min(260, Math.max(110, w * .2))); c.style.height = h + 'px';
    c.width = w * dpr; c.height = h * dpr;
    const off = document.createElement('canvas'); off.width = w; off.height = h; const o = off.getContext('2d');
    o.font = `700 ${Math.round(h * .82)}px "El Messiri", "Tajawal", sans-serif`; o.textAlign = 'center'; o.textBaseline = 'middle';
    o.fillText('Magmafy', w / 2, h * .54);
    const data = o.getImageData(0, 0, w, h).data, step = w < 700 ? 4 : 5;
    const old = pts; pts = [];
    for (let y = 0; y < h; y += step) for (let x = 0; x < w; x += step) if (data[(y * w + x) * 4 + 3] > 140) {
      const p = old[pts.length];
      pts.push({ tx: x, ty: y, x: p ? p.x : Math.random() * w, y: p ? p.y : h + Math.random() * h, vx: 0, vy: 0, c: COLORS[Math.min(4, Math.floor((x / w) * 5))] });
    }
  }
  document.fonts?.ready.then(build); build(); addEventListener('resize', build);
  const move = (e) => { const r = c.getBoundingClientRect(); mx = e.clientX - r.left; my = e.clientY - r.top; };
  c.addEventListener('pointermove', move, { passive: true }); c.addEventListener('pointerdown', move, { passive: true });
  c.addEventListener('pointerleave', () => { mx = my = -999; });
  function frame() {
    if (!run) return; raf = requestAnimationFrame(frame);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0); ctx.clearRect(0, 0, w, h);
    for (const p of pts) {
      const dx = p.x - mx, dy = p.y - my, d2 = dx * dx + dy * dy;
      if (d2 < 6400) { const f = (6400 - d2) / 6400 * 3.2, d = Math.sqrt(d2) || 1; p.vx += dx / d * f; p.vy += dy / d * f; }
      p.vx = (p.vx + (p.tx - p.x) * .06) * .82; p.vy = (p.vy + (p.ty - p.y) * .06) * .82;
      p.x += p.vx; p.y += p.vy;
      ctx.fillStyle = p.c; ctx.fillRect(p.x, p.y, 2.2, 2.2);
    }
  }
  onScreen(c, (v) => { run = v; cancelAnimationFrame(raf); if (v) raf = requestAnimationFrame(frame); }, '50px');
}

/* meteors falling behind the booking section */
function meteors() {
  const host = $('#contact'); if (!host) return;
  const box = document.createElement('div'); box.className = 'meteors'; box.setAttribute('aria-hidden', 'true');
  for (let i = 0; i < (innerWidth < 700 ? 8 : 16); i++) {
    const m = document.createElement('i');
    m.style.cssText = `left:${Math.random() * 110}%;top:${-10 + Math.random() * 30}%;animation-delay:${(Math.random() * 8).toFixed(2)}s;animation-duration:${(3 + Math.random() * 5).toFixed(2)}s`;
    box.append(m);
  }
  host.prepend(box);
}

export function initEffects() {
  shine();
  beams();
  if (reduced) return;
  blurHeadings();
  meteors();
  clickSpark();
  particleWord();
  if (fine) { spotlight(); dotGrid(); }
}
