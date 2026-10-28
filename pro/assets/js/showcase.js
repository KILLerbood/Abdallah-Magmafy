// Live covers for the homepage project cards: a 3D showroom site, an Instagram account that
// grows, and an ad campaign. Each runs only while it is on screen, so the page never lags.
import { h, getLang } from './core.js';
import { money, num, onVisible, reduced } from './demos/kit.js';

const IMG = 'assets/img/f/';
const L = (d) => d[getLang()] || d.ar;
const pic = (file, alt = '', cls = '') => h('img', { src: IMG + file + '.webp', alt, class: cls, loading: 'lazy', decoding: 'async' });
const replay = (el, cls) => { el.classList.remove(cls); void el.offsetWidth; el.classList.add(cls); };

/* ---------- 1. Dar Living 3D showroom ---------- */
function showroomCover() {
  const t = L({ ar: { nav: 'غرف المعيشة · النوم · السفرة', visit: 'احجز زيارة', toast: 'حجز زيارة جديد من', cities: ['الرياض', 'جدة', 'الدمام', 'الخبر', 'مكة'], spin: 'اسحب للتدوير 360°' }, en: { nav: 'Living · Bedroom · Dining', visit: 'Book a visit', toast: 'New showroom visit from', cities: ['Riyadh', 'Jeddah', 'Dammam', 'Khobar', 'Makkah'], spin: 'Drag to spin 360°' } });
  const items = [['sofa-green', { ar: 'كنبة «ليان»', en: '“Layan” sofa' }, 6900, '#1f5a4c'], ['sofa-orange', { ar: 'كنبة «جوري»', en: '“Joury” sofa' }, 5200, '#d9572c'], ['sofa-grey', { ar: 'كنبة «غيم»', en: '“Ghaim” sofa' }, 4800, '#9ba3ad'], ['chair-yellow', { ar: 'كرسي «شمس»', en: '“Shams” chair' }, 1450, '#e2b33b']];
  const imgs = items.map(([f], i) => pic(f, '', 'sc-room__img' + (i ? '' : ' is-on')));
  const name = h('b', {}, L(items[0][1])), price = h('span', {}, money(items[0][2]));
  const sw = items.map(([, , , c], i) => { const s = h('i', { class: i ? '' : 'is-on' }); s.style.setProperty('--sw', c); return s; });
  const toast = h('div', { class: 'sc-toast' });
  let i = 0, n = 0;
  const step = () => {
    i = (i + 1) % items.length;
    imgs.forEach((el, k) => el.classList.toggle('is-on', k === i));
    sw.forEach((el, k) => el.classList.toggle('is-on', k === i));
    name.textContent = L(items[i][1]); price.textContent = money(items[i][2]);
    if (i % 2 === 0) { n++; toast.textContent = '📍 ' + t.toast + ' ' + t.cities[n % t.cities.length]; replay(toast, 'is-in'); }
  };
  const root = h('div', { class: 'sc sc-room' },
    h('div', { class: 'sc-room__nav' }, h('b', {}, 'DAR LIVING'), h('span', {}, t.nav)),
    h('div', { class: 'sc-room__stage' }, h('span', { class: 'sc-room__floor', 'aria-hidden': 'true' }), ...imgs, h('small', { class: 'sc-room__spin' }, '⟲ ' + t.spin)),
    h('div', { class: 'sc-room__bar' }, h('div', {}, name, price), h('div', { class: 'sc-room__sw' }, ...sw), h('span', { class: 'sc-room__cta' }, t.visit)),
    toast);
  let timer;
  onVisible(root, () => { if (!reduced && !timer) timer = setInterval(step, 2300); root.classList.add('is-run'); }, () => { clearInterval(timer); timer = null; root.classList.remove('is-run'); });
  return root;
}

/* ---------- 2. Bayt Alreem Instagram ---------- */
function socialCover() {
  const t = L({ ar: { posts: 'منشور', fol: 'متابع', saves: 'حفظ هذا الأسبوع', reel: 'ريل' }, en: { posts: 'posts', fol: 'followers', saves: 'saves this week', reel: 'Reel' } });
  const pool = ['living-boho', 'living-cream', 'dining', 'bed-classic', 'living-green', 'decor-corner', 'interior-sun', 'living-soft', 'bed-hotel', 'living-teal', 'loft-cafe', 'living-calm'];
  const cells = pool.slice(0, 9).map((f, i) => h('span', { class: 'sc-ig__cell' + (i % 4 === 0 ? ' is-reel' : '') }, pic('s/' + f, '')));
  const fol = h('b', {}, '4,180'), posts = h('b', {}, '128'), saves = h('b', {}, '1,240');
  let f = 4180, p = 128, sv = 1240, k = 9;
  const grid = h('div', { class: 'sc-ig__grid' }, ...cells);
  const step = () => {
    const cell = h('span', { class: 'sc-ig__cell is-new' + (k % 3 === 0 ? ' is-reel' : '') }, pic('s/' + pool[k % pool.length], ''));
    grid.prepend(cell); grid.lastElementChild.remove(); k++;
    f += 60 + Math.round(Math.random() * 90); p++; sv += 30 + Math.round(Math.random() * 40);
    fol.textContent = num(f); posts.textContent = num(p); saves.textContent = num(sv);
  };
  const root = h('div', { class: 'sc sc-ig' },
    h('div', { class: 'sc-ig__head' }, h('span', { class: 'sc-ig__av' }, 'BR'), h('div', { class: 'sc-ig__stats' }, h('div', {}, posts, h('small', {}, t.posts)), h('div', {}, fol, h('small', {}, t.fol)))),
    h('p', { class: 'sc-ig__name' }, h('b', {}, 'bayt.alreem'), ' · ', h('span', {}, '♥ ', saves, ' ', t.saves)),
    grid);
  let timer;
  onVisible(root, () => { if (!reduced && !timer) timer = setInterval(step, 1900); }, () => { clearInterval(timer); timer = null; });
  return root;
}

/* ---------- 3. Nukhba Office campaign ---------- */
function adsCover() {
  const t = L({ ar: { camp: 'حملة · زيارة المعرض', live: 'نشطة', reach: 'الوصول', leads: 'استفسارات', visits: 'زيارات', cpl: 'تكلفة الاستفسار', aud: ['مكاتب وشركات', 'مدراء مشتريات', 'رواد أعمال'] }, en: { camp: 'Campaign · showroom visits', live: 'Live', reach: 'Reach', leads: 'Enquiries', visits: 'Visits', cpl: 'Cost / enquiry', aud: ['Offices & companies', 'Procurement managers', 'Founders'] } });
  const v = { reach: 38400, leads: 96, visits: 31, cpl: 24 };
  const cells = Object.keys(v).map((k) => { const b = h('b'); return [k, b, h('div', { class: 'sc-ads__kpi' }, h('small', {}, t[k]), b)]; });
  const paint = () => cells.forEach(([k, b]) => { b.textContent = k === 'cpl' ? money(v[k]) : num(v[k]); });
  paint();
  const aud = t.aud.map((a, i) => h('span', { class: i ? '' : 'is-on' }, a));
  const bars = [32, 40, 37, 52, 58, 55, 70, 76, 74, 88].map((x) => { const i = h('i'); i.style.setProperty('--h', x + '%'); return i; });
  const root = h('div', { class: 'sc sc-ads' },
    h('div', { class: 'sc-ads__head' }, h('span', { class: 'sc-ads__logo' }, pic('s/office-lounge', '')), h('div', {}, h('b', {}, 'Nukhba Office'), h('small', {}, t.camp)), h('span', { class: 'sc-ads__live' }, '● ' + t.live)),
    h('div', { class: 'sc-ads__aud' }, ...aud),
    h('div', { class: 'sc-ads__grid' }, ...cells.map((c) => c[2])),
    h('div', { class: 'sc-ads__chart', dir: 'ltr' }, ...bars));
  let k = 0, timer;
  const step = () => {
    k++;
    aud.forEach((a, i) => a.classList.toggle('is-on', i === k % aud.length));
    v.reach += 420 + Math.round(Math.random() * 300); v.leads += Math.random() < 0.7 ? 1 : 2; if (k % 3 === 0) v.visits++;
    v.cpl = Math.max(19, v.cpl - (Math.random() < 0.3 ? 1 : 0));
    paint();
  };
  onVisible(root, () => { if (!reduced && !timer) timer = setInterval(step, 1600); }, () => { clearInterval(timer); timer = null; });
  return root;
}

export const SHOWCASES = { showroom: showroomCover, social: socialCover, ads: adsCover };
