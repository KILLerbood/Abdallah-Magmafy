// Legal pages: show Arabic or English (same choice as the main site) and switch between them.
const KEY = 'mg-lang', root = document.documentElement;
let l = null;
try { l = new URLSearchParams(location.search).get('lang') || localStorage.getItem(KEY); } catch { /* private mode */ }
const set = (v) => {
  root.lang = v; root.dir = v === 'en' ? 'ltr' : 'rtl';
  document.title = document.querySelector(`meta[name="title-${v}"]`).content;
  document.querySelectorAll('[data-lang-switch]').forEach((b) => { b.textContent = v === 'en' ? 'عربي' : 'EN'; });
  // keep the language when moving between the legal pages and back to the site
  document.querySelectorAll('a[data-keep]').forEach((a) => { const u = new URL(a.getAttribute('href'), location.href); if (v === 'en') u.searchParams.set('lang', 'en'); else u.searchParams.delete('lang'); a.href = u.pathname.split('/').pop() + u.search + u.hash; });
};
set(l === 'en' ? 'en' : 'ar');
document.querySelectorAll('[data-lang-switch]').forEach((b) => b.addEventListener('click', () => {
  const v = root.lang === 'en' ? 'ar' : 'en';
  try { localStorage.setItem(KEY, v); } catch { /* private mode */ }
  const u = new URL(location.href); if (v === 'en') u.searchParams.set('lang', 'en'); else u.searchParams.delete('lang');
  history.replaceState(null, '', u); set(v);
}));
