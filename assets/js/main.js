// Page orchestration: preloader, header, hero 3D + scroll, reveals,
// micro-interactions, and lazy start of the heavier sections.
import './i18n.js';
import { initHero } from './hero3d.js';
import { initDemos } from './demos.js';
import { initEffects } from './effects.js';
import { initBackdrop } from './bg3d.js';
import { initVolcano } from './volcano.js';

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

/* ---------- preloader: the volcano ---------- */
const pct = $('#preloader-pct');
const volcano = initVolcano($('#preloader'), { reduced });
let shown = 0, target = 0, finished = false;
const setLoad = (v) => { target = Math.max(target, v); volcano.set(v); };
(function tickLoad() {
  shown += (target - shown) * .12;
  pct.textContent = Math.round(shown * 100) + '%';
  if (!finished) requestAnimationFrame(tickLoad);
})();
function finishLoad() {
  if (finished) return;
  // let the volcano be seen for a moment, even on a fast connection
  const wait = (reduced ? 0 : 2000) - performance.now();
  if (wait > 0) { setLoad(1); setTimeout(finishLoad, wait); return; }
  finished = true; target = 1; pct.textContent = '100%';
  volcano.finish(() => {
    $('#preloader').classList.add('is-revealing'); document.body.classList.remove('is-loading'); intro();
  }, () => {
    $('#preloader').classList.add('is-done');
    // start the site-wide wave only once the reveal is over and the page is idle, so nothing stutters
    const idle = window.requestIdleCallback || ((f) => setTimeout(f, 200));
    setTimeout(() => idle(() => { try { initBackdrop(); } catch (err) { console.warn(err); } }), 1200);
  });
}
setTimeout(finishLoad, 6000); // never block the page

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

// hero taps: each tap moves the photos onto a new path and shows one service
if (hero) {
  const TAP = ['اضغط على المشهد', 'دراسة السوق', 'الإعلانات', 'مواقع 3D', 'صور AI'];
  const tapLabel = (n) => { $('#hero-tap-t').textContent = TAP[n]; $('#hero-tap-n').textContent = `${n + 1}/${TAP.length}`; };
  $('.hero__pin').addEventListener('click', (e) => {
    if (e.target.closest('a, .hero__inner p, .hero__title, .hero__stats') || scrollY > innerHeight * .6) return;
    const n = hero.tap();
    tapLabel(n);
    $('#hero-tap').classList.remove('is-pop'); void $('#hero-tap').offsetWidth; $('#hero-tap').classList.add('is-pop');
  });
}

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
// the link of the last section whose top has passed 40% of the screen stays lit; none in the hero or the booking form
const spy = navLinks.map((a) => [a, $(a.getAttribute('href'))]).filter(([, s]) => s);
const stopAt = $('#contact');
let spyRaf = 0;
const updateSpy = () => {
  spyRaf = 0;
  const line = innerHeight * .4;
  let cur = null;
  for (const [a, s] of spy) if (s.getBoundingClientRect().top <= line) cur = a;
  if (stopAt && stopAt.getBoundingClientRect().top <= line) cur = null;
  navLinks.forEach((a) => a.classList.toggle('is-active', a === cur));
};
addEventListener('scroll', () => { if (!spyRaf) spyRaf = requestAnimationFrame(updateSpy); }, { passive: true });
updateSpy();

/* ---------- scroll choreography ---------- */
if (gs && ST && !reduced) {
  document.documentElement.classList.add('js');

  // hero: scene opens up while the copy drifts away
  ST.create({ trigger: '.hero', start: 'top top', end: 'bottom bottom', scrub: true, onUpdate: (s) => hero && hero.setProgress(s.progress) });
  gs.to('.hero__inner', { opacity: 0, y: -80, ease: 'none', scrollTrigger: { trigger: '.hero', start: 'top top', end: '55% bottom', scrub: true } });
  gs.to('.hero__tags, .hero__scroll, .hero__tap', { opacity: 0, ease: 'none', scrollTrigger: { trigger: '.hero', start: 'top top', end: '30% bottom', scrub: true } });

  // reveals
  const revealSel = '.dial, .calc__box, .head, .study__box, .cmp__wrap, .jy, .cfg, .ring__ctl, .stat, .step, .pk__box, .faq__intro, .faq details, .book, .process__intro, .film__frame, .footer__grid';
  $$(revealSel).forEach((el) => el.classList.add('reveal'));
  ST.batch('.reveal', { start: 'top 88%', once: true, onEnter: (els) => gs.to(els, { opacity: 1, y: 0, duration: 1, ease: 'power3.out', stagger: .08, overwrite: true }) });

  // process line fill
  gs.to('.steps', { '--fill': '100%', ease: 'none', scrollTrigger: { trigger: '.steps', start: 'top 70%', end: 'bottom 60%', scrub: true } });

  // footer wordmark parallax
  gs.from('.footer__big, .pword', { yPercent: 40, opacity: 0, ease: 'none', scrollTrigger: { trigger: '.footer', start: 'top bottom', end: 'top 40%', scrub: true } });

  addEventListener('load', () => ST.refresh());
  // browser zoom, late fonts and lazily built sections all change the page height: re-measure every trigger
  let rT = 0, lastH = 0;
  const reMeasure = () => { clearTimeout(rT); rT = setTimeout(() => { const h = document.body.scrollHeight; if (h !== lastH) { lastH = h; ST.refresh(); } }, 250); };
  new ResizeObserver(reMeasure).observe(document.body);
  document.fonts?.ready.then(reMeasure);
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
  const fallback = () => { loading.textContent = isEn() ? 'Could not load the 3D sofa. Please refresh the page.' : 'تعذّر تحميل الكنبة ثلاثية الأبعاد، حدّث الصفحة.'; loading.classList.remove('is-done'); };
  let sofa;
  try { sofa = initSofa($('#cfg-canvas'), { onLoad: (err) => { if (err) fallback(); else loading.classList.add('is-done'); } }); } catch (err) { console.warn(err); loading.classList.add('is-done'); fallback(); }
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
  $('#cfg-rooms').addEventListener('click', (e) => { const b = e.target.closest('button'); if (!b) return; $$('button', $('#cfg-rooms')).forEach((x) => x.setAttribute('aria-checked', String(x === b))); stage.dataset.room = b.dataset.room; sofa && sofa.setRoom(b.dataset.room); });
  $('#cfg-dimsbtn').addEventListener('click', (e) => { const on = e.currentTarget.getAttribute('aria-pressed') !== 'true'; e.currentTarget.setAttribute('aria-pressed', String(on)); $('#cfg-dims').classList.toggle('is-on', on); });
  const toast = $('#cfg-toast');
  const summary = () => isEn() ? `Frankie velvet sofa · ${FABRICS[state.f].en} · ${LEGS[state.l].en} legs` : `كنبة فرانكي · ${FABRICS[state.f].name} · أرجل ${LEGS[state.l].name}`;
  $('#cfg-book').addEventListener('click', () => { toast.textContent = isEn() ? '✓ On your client’s site, this books a showroom visit directly: ' + summary() : '✓ في موقع عميلك، الزر ده بيحجز زيارة للمعرض مباشرة: ' + summary(); });
  $('#cfg-quote').addEventListener('click', () => { toast.textContent = isEn() ? '✓ A request for ' + summary() + ' reaches the sales team instantly.' : '✓ طلب ' + summary() + ' يوصل لفريق المبيعات فورًا.'; });
});

lazy('#minis', async () => { const { initRing } = await import('./minisites.js'); initRing(); });
