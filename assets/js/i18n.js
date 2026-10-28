// Arabic / English. Arabic is the source; English is applied by translating the DOM in place
// (static text, attributes, and anything the demos write later). Switching reloads the page so
// every direction-aware layout starts clean.
import EN from './i18n-en.js';

const KEY = 'mg-lang';
const AR = /[؀-ۿ]/;
const MONTHS = ['يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو', 'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'];
const MONTHS_EN = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const DAYS = ['الأحد', 'الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'];
const DAYS_EN = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const CUR = { 'ر.س': 'SAR', 'د.إ': 'AED', 'ر.ق': 'QAR', 'د.ك': 'KWD', 'د.ب': 'BHD', 'ر.ع': 'OMR' };
const M = MONTHS.join('|'), D = DAYS.join('|'), C = Object.keys(CUR).map((c) => c.replace('.', '\\.')).join('|');
const mo = (m) => MONTHS_EN[MONTHS.indexOf(m)], dy = (d) => DAYS_EN[DAYS.indexOf(d)];
const time = (t, ap) => `${t} ${ap === 'ص' ? 'AM' : 'PM'}`;

const RULES = [
  [new RegExp(`^([<\\d,.\\s–-]+?)\\s*(${C})( للوحدة)?$`), (_, n, c, u) => `${CUR[c]} ${n.trim()}${u ? ' / unit' : ''}`],
  [new RegExp(`^(${C}) مبيعات$`), (_, c) => `${CUR[c]} in sales`],
  [/^الدور (\d)$/, (_, n) => `Floor ${n}`],
  [/^كل ما في «(.+)»$/, (_, x) => `Everything in “${tr(x) || x}”`],
  [new RegExp(`^(${M}) (\\d{4})$`), (_, m, y) => `${mo(m)} ${y}`],
  [new RegExp(`^(${D}) (\\d+) (${M})( \\(غير متاح\\))?$`), (_, d, n, m, u) => `${dy(d)}, ${n} ${mo(m)}${u ? ' (unavailable)' : ''}`],
  [new RegExp(`^(\\d+) (${M}): (.+)$`), (_, n, m, x) => `${n} ${mo(m)}: ${tr(x) || x}`],
  [/^(\d+:\d\d) (ص|م)( \(بتوقيت السعودية\))?$/, (_, t, ap, k) => time(t, ap) + (k ? ' (Saudi time)' : '')],
  [/^المواعيد المتاحة · (.+)$/, (_, x) => `Available times · ${tr(x) || x}`],
  [/^✓ أُضيف (.+?) للسلة(?: · لون (\d))?$/, (_, x, c) => `✓ Added ${tr(x) || x} to cart${c ? ` · Colour ${c}` : ''}`],
  [/^♡ (.+) في المفضلة$/, (_, x) => `♡ ${tr(x) || x} saved`],
  [new RegExp(`^✓ تم حجز زيارتك يوم (${D}) الساعة (.+)$`), (_, d, t) => `✓ Your visit is booked for ${dy(d)} at ${t}`],
  [/^\+ (.+)$/, (_, x) => { const p = x.split(' + ').map((s) => tr(s)); return p.every(Boolean) ? '+ ' + p.join(' + ') : null; }],
];

const norm = (s) => s.replace(/\s+/g, ' ').trim();
export function tr(s) {
  const t = norm(s);
  if (!t || !AR.test(t)) return null;
  if (EN[t]) return EN[t];
  for (const [re, fn] of RULES) { const m = t.match(re); if (m) { const r = fn(...m); if (r) return r; } }
  for (const sep of [' · ', ' + ', ' – ']) {
    if (!t.includes(sep)) continue;
    const parts = t.split(sep).map((p) => (AR.test(p) ? tr(p) : p));
    if (parts.every((p) => p != null)) return parts.join(sep);
  }
  return null;
}

let params; try { params = new URLSearchParams(location.search).get('lang'); } catch { params = null; }
let stored = null; try { stored = localStorage.getItem(KEY); } catch { /* private mode */ }
export const lang = (params || stored) === 'en' ? 'en' : 'ar';

const ATTRS = ['placeholder', 'aria-label', 'title', 'alt'];
const SKIP = new Set(['SCRIPT', 'STYLE', 'NOSCRIPT', 'TEXTAREA']);
const missing = new Set();
function textNode(n) {
  const v = n.nodeValue; if (!AR.test(v)) return;
  const t = tr(v);
  if (t == null) { missing.add(norm(v)); return; }
  const lead = v.match(/^\s*/)[0], trail = v.match(/\s*$/)[0];
  n.nodeValue = lead + t + trail;
}
function el(e) {
  for (const a of ATTRS) { const v = e.getAttribute(a); if (v && AR.test(v)) { const t = tr(v); if (t) e.setAttribute(a, t); } }
}
function walk(root) {
  if (root.nodeType === 3) { if (!SKIP.has(root.parentNode?.nodeName)) textNode(root); return; }
  if (root.nodeType !== 1 || SKIP.has(root.nodeName)) return;
  el(root);
  const w = document.createTreeWalker(root, NodeFilter.SHOW_ELEMENT | NodeFilter.SHOW_TEXT, { acceptNode: (n) => (SKIP.has(n.nodeName) ? NodeFilter.FILTER_REJECT : NodeFilter.FILTER_ACCEPT) });
  for (let n = w.nextNode(); n; n = w.nextNode()) n.nodeType === 3 ? (SKIP.has(n.parentNode.nodeName) || textNode(n)) : el(n);
}

function applyEnglish() {
  const html = document.documentElement;
  html.lang = 'en'; html.dir = 'ltr';
  const t = tr(document.title); if (t) document.title = t;
  document.querySelectorAll('meta[name="description"], meta[property^="og:"], meta[name^="twitter:"]').forEach((m) => { const v = m.getAttribute('content'); const x = v && tr(v); if (x) m.setAttribute('content', x); });
  walk(document.body);
  new MutationObserver((ms) => {
    for (const m of ms) {
      if (m.type === 'characterData') textNode(m.target);
      else if (m.type === 'attributes') el(m.target);
      else m.addedNodes.forEach(walk);
    }
  }).observe(document.body, { subtree: true, childList: true, characterData: true, attributes: true, attributeFilter: ATTRS });
  window.__i18nMissing = missing;
}

export function setLang(l) {
  try { localStorage.setItem(KEY, l); } catch { /* ignore */ }
  const u = new URL(location.href); u.searchParams.set('lang', l); location.replace(u.href);
}

if (lang === 'en') applyEnglish();
document.querySelectorAll('[data-lang-switch]').forEach((b) => {
  b.textContent = lang === 'en' ? 'عربي' : 'EN';
  b.setAttribute('aria-label', lang === 'en' ? 'التبديل إلى العربية' : 'Switch to English');
  b.setAttribute('lang', lang === 'en' ? 'ar' : 'en');
  b.addEventListener('click', () => setLang(lang === 'en' ? 'ar' : 'en'));
});
