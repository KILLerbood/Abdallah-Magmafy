// Page orchestration: preloader, header, hero 3D + scroll, pinned services, reveals,
// micro-interactions, and lazy start of the heavier sections.
import './i18n.js';
import { initHero } from './hero3d.js';
import { initDemos } from './demos.js';
import { initEffects } from './effects.js';

const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
const fine = matchMedia('(hover: hover) and (pointer: fine)').matches;
const desktop = () => innerWidth > 960;

initEffects();

// gsap is loaded with `defer`, modules run after deferred scripts, but guard anyway
const gs = window.gsap;
const ST = window.ScrollTrigger;
if (gs && ST) gs.registerPlugin(ST);

document.body.classList.add('is-loading');

/* ---------- preloader ---------- */
const bar = $('#preloader-bar'), pct = $('#preloader-pct');
let shown = 0, target = 0, finished = false;
const setLoad = (v) => { target = Math.max(target, v); };
(function tickLoad() {
  shown += (target - shown) * .12;
  bar.style.width = shown * 100 + '%'; pct.textContent = Math.round(shown * 100) + '%';
  if (!finished) requestAnimationFrame(tickLoad);
})();
function finishLoad() {
  if (finished) return;
  finished = true; target = 1; bar.style.width = '100%'; pct.textContent = '100%';
  setTimeout(() => { $('#preloader').classList.add('is-done'); document.body.classList.remove('is-loading'); intro(); }, 250);
}
setTimeout(finishLoad, 4500); // never block the page

/* ---------- hero 3D ---------- */
let hero = null;
try {
  hero = initHero($('#hero-canvas'), { onLoad: (p) => { setLoad(.2 + p * .8); if (p >= 1) Promise.race([document.fonts.ready, new Promise((r) => setTimeout(r, 800))]).then(finishLoad); } });
} catch (err) {
  console.warn('WebGL unavailable', err);
  $('#hero-canvas').style.background = 'radial-gradient(50% 60% at 30% 50%, rgba(214,41,118,.45), transparent 70%)';
  finishLoad();
}
setLoad(.15);

function intro() {
  if (!gs || reduced) return;
  gs.from('.hero__title .line > span', { yPercent: 110, duration: 1.1, ease: 'power4.out', stagger: .12 });
  gs.from('.hero .reveal-up', { y: 30, opacity: 0, duration: 1, ease: 'power3.out', stagger: .1, delay: .35 });
  gs.from('.htag', { scale: .6, opacity: 0, duration: .8, ease: 'back.out(1.8)', stagger: .15, delay: .8 });
  gs.from('.header', { y: -40, opacity: 0, duration: .8, ease: 'power3.out', delay: .2 });
}

/* ---------- header ---------- */
const header = $('#header'), burger = $('#burger');
let lastY = 0;
const sbar = $('#scrollbar');
addEventListener('scroll', () => {
  const y = scrollY;
  header.classList.toggle('is-scrolled', y > 30);
  header.classList.toggle('is-hidden', y > 600 && y > lastY && !header.classList.contains('is-open'));
  lastY = y;
  sbar.style.transform = `scaleX(${y / Math.max(1, document.documentElement.scrollHeight - innerHeight)})`;
  $('.fab').classList.toggle('is-in', y > innerHeight * 1.2 && y < document.body.scrollHeight - innerHeight * 1.8);
}, { passive: true });
burger.addEventListener('click', () => { const o = header.classList.toggle('is-open'); burger.setAttribute('aria-expanded', String(o)); });
$$('#nav a').forEach((a) => a.addEventListener('click', () => { header.classList.remove('is-open'); burger.setAttribute('aria-expanded', 'false'); }));
// active link
const navLinks = $$('#nav a');
const io = new IntersectionObserver((es) => es.forEach((e) => { if (e.isIntersecting) navLinks.forEach((a) => a.classList.toggle('is-active', a.getAttribute('href') === '#' + e.target.id)); }), { rootMargin: '-45% 0px -50% 0px' });
navLinks.forEach((a) => { const s = $(a.getAttribute('href')); if (s) io.observe(s); });

/* ---------- scroll choreography ---------- */
if (gs && ST && !reduced) {
  document.documentElement.classList.add('js');

  // hero: scene opens up while the copy drifts away
  ST.create({ trigger: '.hero', start: 'top top', end: 'bottom bottom', scrub: true, onUpdate: (s) => hero && hero.setProgress(s.progress) });
  gs.to('.hero__inner', { opacity: 0, y: -80, ease: 'none', scrollTrigger: { trigger: '.hero', start: 'top top', end: '55% bottom', scrub: true } });
  gs.to('.hero__tags, .hero__scroll', { opacity: 0, ease: 'none', scrollTrigger: { trigger: '.hero', start: 'top top', end: '30% bottom', scrub: true } });

  // services: horizontal pinned strip on desktop, native swipe on mobile
  const mm = gs.matchMedia();
  mm.add('(min-width: 961px)', () => {
    const strip = $('#services-strip');
    const dist = () => Math.max(0, strip.scrollWidth - innerWidth);
    const tw = gs.to(strip, {
      x: () => (document.dir === 'rtl' ? 1 : -1) * dist(), ease: 'none',
      scrollTrigger: { trigger: '.services', pin: '.services__pin', start: 'top top', end: () => '+=' + dist(), scrub: .6, invalidateOnRefresh: true,
        onUpdate: (s) => { $('#services-bar').style.width = s.progress * 100 + '%'; } },
    });
    return () => tw.scrollTrigger && tw.scrollTrigger.kill();
  });

  // reveals
  const revealSel = '.calc__box, .head, .study__box, .cmp__wrap, .jy, .cfg, .ring__ctl, .stat, .step, .pk__box, .faq__intro, .faq details, .book, .process__intro, .film__frame, .footer__grid';
  $$(revealSel).forEach((el) => el.classList.add('reveal'));
  ST.batch('.reveal', { start: 'top 88%', once: true, onEnter: (els) => gs.to(els, { opacity: 1, y: 0, duration: 1, ease: 'power3.out', stagger: .08, overwrite: true }) });

  // process line fill
  gs.to('.steps', { '--fill': '100%', ease: 'none', scrollTrigger: { trigger: '.steps', start: 'top 70%', end: 'bottom 60%', scrub: true } });

  // footer wordmark parallax
  gs.from('.footer__big, .pword', { yPercent: 40, opacity: 0, ease: 'none', scrollTrigger: { trigger: '.footer', start: 'top bottom', end: 'top 40%', scrub: true } });

  addEventListener('load', () => ST.refresh());
}

/* ---------- counters ---------- */
const cio = new IntersectionObserver((es) => es.forEach((e) => {
  if (!e.isIntersecting) return;
  cio.unobserve(e.target);
  const el = e.target, to = +el.dataset.count, pre = el.dataset.prefix || '', suf = el.dataset.suffix || '';
  if (reduced || !gs) return;
  const o = { v: 0 };
  gs.to(o, { v: to, duration: 1.8, ease: 'power3.out', onUpdate: () => { el.textContent = pre + Math.round(o.v).toLocaleString('en-US') + suf; } });
}), { threshold: .6 });
$$('[data-count]').forEach((el) => cio.observe(el));

/* ---------- micro-interactions (desktop pointer only) ---------- */
if (fine && !reduced) {
  const cur = $('.cursor'), dot = $('.cursor__dot'), ring = $('.cursor__ring');
  let mx = innerWidth / 2, my = innerHeight / 2, rx = mx, ry = my;
  addEventListener('pointermove', (e) => { cur.classList.add('is-on'); mx = e.clientX; my = e.clientY; dot.style.transform = `translate(${mx}px, ${my}px)`; }, { passive: true });
  (function loop() { rx += (mx - rx) * .18; ry += (my - ry) * .18; ring.style.transform = `translate(${rx}px, ${ry}px)`; requestAnimationFrame(loop); })();
  document.addEventListener('pointerover', (e) => cur.classList.toggle('is-hover', !!e.target.closest('a, button, input, select, label, .cfg__stage')));

  $$('.magnetic').forEach((b) => {
    b.addEventListener('pointermove', (e) => { const r = b.getBoundingClientRect(); b.style.transform = `translate(${(e.clientX - r.left - r.width / 2) * .25}px, ${(e.clientY - r.top - r.height / 2) * .35}px)`; });
    b.addEventListener('pointerleave', () => { b.style.transform = ''; });
  });
  $$('.tilt').forEach((c) => {
    c.addEventListener('pointermove', (e) => { const r = c.getBoundingClientRect(); const x = (e.clientX - r.left) / r.width - .5, y = (e.clientY - r.top) / r.height - .5; c.style.transform = `perspective(900px) rotateY(${x * 8}deg) rotateX(${-y * 8}deg) translateZ(0)`; });
    c.addEventListener('pointerleave', () => { c.style.transition = 'transform .6s cubic-bezier(.2,.8,.2,1)'; c.style.transform = ''; setTimeout(() => (c.style.transition = ''), 600); });
  });
}

/* ---------- interactive sections ---------- */
initDemos();

/* ---------- lazy heavy sections ---------- */
const lazy = (sel, fn) => { const el = $(sel); const o = new IntersectionObserver(([e]) => { if (e.isIntersecting) { o.disconnect(); fn(); } }, { rootMargin: '600px' }); o.observe(el); };

lazy('#sites3d', async () => {
  const { initSofa, FABRICS, LEGS } = await import('./sofa3d.js');
  const stage = $('#cfg-stage'), loading = $('#cfg-loading');
  const fallback = () => { stage.style.background = 'center/cover url(assets/img/sofa-green.webp)'; };
  let sofa;
  try { sofa = initSofa($('#cfg-canvas'), { onLoad: (err) => { loading.classList.add('is-done'); if (err) fallback(); } }); } catch (err) { console.warn(err); loading.classList.add('is-done'); fallback(); }
  const state = { f: 0, l: 0 };
  const sw = $('#cfg-fabrics');
  FABRICS.forEach((f, i) => {
    const b = document.createElement('button'); b.type = 'button'; b.setAttribute('role', 'radio'); b.setAttribute('aria-checked', String(i === 0)); b.setAttribute('aria-label', f.name); b.title = f.name; b.style.setProperty('--c', f.c);
    b.addEventListener('click', () => { state.f = i; $$('button', sw).forEach((x) => x.setAttribute('aria-checked', String(x === b))); sofa && sofa.setFabric(i); render(); });
    sw.append(b);
  });
  $('#cfg-legs').addEventListener('click', (e) => { const b = e.target.closest('button'); if (!b) return; $$('button', $('#cfg-legs')).forEach((x) => x.setAttribute('aria-checked', String(x === b))); state.l = +b.dataset.leg; sofa && sofa.setLegs(state.l); render(); });
  const isEn = () => document.documentElement.lang === 'en';
  function render() { $('#cfg-fabric-name').textContent = isEn() ? FABRICS[state.f].en : FABRICS[state.f].name; }
  document.addEventListener('langchange', render);
  render();
  $('#cfg-rooms').addEventListener('click', (e) => { const b = e.target.closest('button'); if (!b) return; $$('button', $('#cfg-rooms')).forEach((x) => x.setAttribute('aria-checked', String(x === b))); stage.dataset.room = b.dataset.room; });
  $('#cfg-dimsbtn').addEventListener('click', (e) => { const on = e.currentTarget.getAttribute('aria-pressed') !== 'true'; e.currentTarget.setAttribute('aria-pressed', String(on)); $('#cfg-dims').classList.toggle('is-on', on); });
  const toast = $('#cfg-toast');
  const summary = () => isEn() ? `Frankie velvet sofa · ${FABRICS[state.f].en} · ${LEGS[state.l].en} legs` : `كنبة فرانكي · ${FABRICS[state.f].name} · أرجل ${LEGS[state.l].name}`;
  $('#cfg-book').addEventListener('click', () => { toast.textContent = isEn() ? '✓ On your client’s site, this books a showroom visit directly: ' + summary() : '✓ في موقع عميلك، الزر ده بيحجز زيارة للمعرض مباشرة: ' + summary(); });
  $('#cfg-quote').addEventListener('click', () => { toast.textContent = isEn() ? '✓ A request for ' + summary() + ' reaches the sales team instantly.' : '✓ طلب ' + summary() + ' يوصل لفريق المبيعات فورًا.'; });
});

lazy('#minis', async () => { const { initRing } = await import('./minisites.js'); initRing(); });
