// Four small working shop sites on a CSS 3D cover-flow. Only the front one takes clicks;
// turn the ring with the arrows, the chips, a drag on the background or the browser bar.
const P = 'assets/img/';
const sar = (n) => n.toLocaleString('en-US') + ' ر.س';

function h(tag, attrs = {}, ...kids) {
  const el = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs)) {
    if (v == null) continue;
    if (k === 'class') el.className = v;
    else if (k.startsWith('on')) el.addEventListener(k.slice(2), v);
    else if (k === 'style') el.style.cssText = v;
    else el.setAttribute(k, v);
  }
  for (const c of kids.flat()) if (c != null) el.append(c.nodeType ? c : document.createTextNode(c));
  return el;
}
const img = (f, alt = '') => h('img', { src: P + f + '.jpg', alt, loading: 'lazy', decoding: 'async' });

function shell(key, name, url, links, cartIcon, body) {
  const count = h('b', { class: 'ms__count' }, '0');
  const toast = h('div', { class: 'ms__toast', role: 'status' });
  const ctx = {
    say(t) { toast.textContent = t; toast.classList.remove('is-in'); void toast.offsetWidth; toast.classList.add('is-in'); clearTimeout(ctx.tt); ctx.tt = setTimeout(() => toast.classList.remove('is-in'), 2200); },
    bump(n = 1) { count.textContent = String(+count.textContent + n); count.classList.remove('is-bump'); void count.offsetWidth; count.classList.add('is-bump'); },
  };
  return h('div', { class: 'ms ms--' + key, 'aria-label': 'موقع تجريبي: ' + name },
    h('div', { class: 'ms__bar' }, h('i'), h('i'), h('i'), h('span', {}, url)),
    h('nav', { class: 'ms__nav' }, h('b', { class: 'ms__logo' }, name), h('span', { class: 'ms__links' }, ...links.map((l) => h('span', {}, l))), h('span', { class: 'ms__cart' }, cartIcon + ' ', count)),
    h('div', { class: 'ms__scroll', tabindex: '0' }, ...body(ctx)),
    toast);
}
const hero = (f, kicker, title, cta) => h('header', { class: 'ms__hero' }, img(f), h('div', {}, h('small', {}, kicker), h('h4', {}, title), cta && h('span', { class: 'ms__btn' }, cta)));

/* 1 · Dar Living – furniture store with colour swatches */
function darLiving() {
  const items = [
    { n: 'كنبة لوفت', p: 6450, v: [['sofa-green', '#2f5a45'], ['sofa-grey', '#8a94a3'], ['sofa-orange', '#c2532a']] },
    { n: 'كنبة كلاسيك جلد', p: 8900, v: [['sofa-leather', '#9a6034']] },
    { n: 'كرسي سَكَن', p: 1850, v: [['chair-yellow', '#d9a52c'], ['chair-black', '#222']] },
    { n: 'سرير مخمل', p: 7200, v: [['bed-velvet', '#cfc9c0'], ['bed-classic', '#b9a891']] },
  ];
  return shell('dar', 'دار ليفينج', 'dar-living.sa', ['صالات', 'نوم', 'عروض'], '🛒', (ctx) => [
    hero('living-green', 'تشكيلة الشتاء 2026', 'بيتك يستاهل يبقى أحلى', 'تسوّق الآن'),
    h('h5', {}, 'الأكثر مبيعًا'),
    h('div', { class: 'ms__grid' }, ...items.map((it) => {
      const pic = img(it.v[0][0], it.n);
      let pick = 0;
      const sw = h('div', { class: 'ms__sw' }, ...it.v.map(([f, c], i) => {
        const b = h('button', { type: 'button', 'aria-pressed': String(i === 0), 'aria-label': 'لون ' + (i + 1), style: '--c:' + c, onclick: () => { pick = i; pic.src = P + f + '.jpg'; [...sw.children].forEach((x) => x.setAttribute('aria-pressed', String(x === b))); } });
        return b;
      }));
      return h('div', { class: 'ms__card' }, pic, h('b', {}, it.n), h('span', {}, sar(it.p)), sw,
        h('button', { type: 'button', class: 'ms__add', onclick: () => { ctx.bump(); ctx.say('✓ أُضيف ' + it.n + ' للسلة' + (it.v.length > 1 ? ' · لون ' + (pick + 1) : '')); } }, '+ أضف للسلة'));
    })),
    h('div', { class: 'ms__banner' }, '🚚 توصيل وتركيب مجاني · تقسيط حتى 12 شهر'),
    h('footer', { class: 'ms__foot' }, '© دار ليفينج · الرياض · موقع تجريبي من Magmafy'),
  ]);
}

/* 2 · Nook – decor shop with category filters */
function nook() {
  const items = [['lamp', 'أباجورة نورد', 690, 'light'], ['stool', 'كرسي بار خشبي', 420, 'seat'], ['chair-black', 'كرسي إيمز', 560, 'seat'], ['decor-corner', 'طقم ركن القراءة', 2450, 'decor'], ['living-mini', 'كومود أبيض', 1320, 'decor'], ['chair-yellow', 'كرسي مخمل', 1850, 'seat']];
  const cats = [['all', 'الكل'], ['light', 'إضاءة'], ['seat', 'مقاعد'], ['decor', 'ديكور']];
  return shell('nook', 'نوك ديكور', 'nook-decor.com', ['جديد', 'أفكار'], '♡', (ctx) => {
    const grid = h('div', { class: 'ms__grid' });
    const draw = (c) => grid.replaceChildren(...items.filter((x) => c === 'all' || x[3] === c).map(([f, n, p]) =>
      h('div', { class: 'ms__card' }, img(f, n), h('b', {}, n), h('span', {}, sar(p)),
        h('button', { type: 'button', class: 'ms__add', onclick: () => { ctx.bump(); ctx.say('♡ ' + n + ' في المفضلة'); } }, '♡ احفظ'))));
    const filters = h('div', { class: 'ms__filters' }, ...cats.map(([k, l], i) => {
      const b = h('button', { type: 'button', 'aria-pressed': String(i === 0), onclick: () => { [...filters.children].forEach((x) => x.setAttribute('aria-pressed', String(x === b))); draw(k); } }, l);
      return b;
    }));
    draw('all');
    return [hero('decor-corner', 'تفاصيل صغيرة', 'ركن يشبهك', 'اكتشف'), h('h5', {}, 'تسوّق حسب الفئة'), filters, grid,
      h('footer', { class: 'ms__foot' }, '© نوك ديكور · دبي · موقع تجريبي من Magmafy')];
  });
}

/* 3 · Atelier – interior design studio with booking */
function atelier() {
  const days = ['الأحد', 'الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس'];
  const slots = ['10:00', '12:00', '2:00', '4:00', '6:00', '8:00'];
  return shell('atelier', 'أتيليه نور', 'atelier-noor.qa', ['مشاريع', 'خدمات'], '📅', (ctx) => {
    let d = null, s = null;
    const base = new Date(); base.setDate(base.getDate() + 1);
    const dayBtns = h('div', { class: 'ms__days' }, ...days.map((n, i) => {
      const dt = new Date(base); dt.setDate(base.getDate() + i);
      const b = h('button', { type: 'button', 'aria-pressed': 'false', onclick: () => { d = n; [...dayBtns.children].forEach((x) => x.setAttribute('aria-pressed', String(x === b))); } }, h('b', {}, String(dt.getDate())), n);
      return b;
    }));
    const slotBtns = h('div', { class: 'ms__slots' }, ...slots.map((t) => {
      const b = h('button', { type: 'button', 'aria-pressed': 'false', onclick: () => { s = t; [...slotBtns.children].forEach((x) => x.setAttribute('aria-pressed', String(x === b))); } }, t);
      return b;
    }));
    return [hero('interior-classic', 'تصميم داخلي وتشطيبات', 'نصمم بيتك من أول خط', null),
      h('h5', {}, 'من مشاريعنا'),
      h('div', { class: 'ms__gallery' }, img('bed-velvet'), img('bed-hotel'), img('interior-open')),
      h('h5', {}, 'احجز زيارة للموقع'), dayBtns, slotBtns,
      h('button', { type: 'button', class: 'ms__cta', onclick: () => { if (!d || !s) { ctx.say('اختر اليوم والوقت أولًا'); return; } ctx.bump(); ctx.say('✓ تم حجز زيارتك يوم ' + d + ' الساعة ' + s); } }, 'أكّد الحجز'),
      h('footer', { class: 'ms__foot' }, '© أتيليه نور · الدوحة · موقع تجريبي من Magmafy')];
  });
}

/* 4 · Maktabi – office furniture, quote builder */
function maktabi() {
  const items = [['chair-black', 'كرسي موظف مريح', 640], ['office-lounge', 'ركن استقبال', 5400], ['office-hall', 'طاولة اجتماعات 10 أشخاص', 7800], ['loft-cafe', 'ركن استراحة الموظفين', 4200]];
  return shell('office', 'مكتبي', 'maktabi.com.kw', ['شركات', 'مشاريع'], '📄', (ctx) => {
    const qty = items.map((_, i) => (i === 0 ? 12 : 0));
    const total = h('b', { class: 'num' }, '');
    const upd = () => { total.textContent = sar(items.reduce((a, it, i) => a + it[2] * qty[i], 0)); };
    const rows = items.map(([f, n, p], i) => {
      const v = h('b', { class: 'num' }, String(qty[i]));
      const step = (d) => { qty[i] = Math.max(0, qty[i] + d); v.textContent = String(qty[i]); upd(); };
      return h('div', { class: 'ms__qty' }, img(f, n), h('div', {}, n, h('small', {}, sar(p) + ' للوحدة')),
        h('div', { class: 'ms__stepper' }, h('button', { type: 'button', 'aria-label': 'زيادة', onclick: () => step(1) }, '+'), v, h('button', { type: 'button', 'aria-label': 'نقص', onclick: () => step(-1) }, '−')));
    });
    upd();
    return [hero('office-lounge', 'أثاث مكتبي للشركات', 'جهّز مكتبك كله بعرض واحد', null),
      h('h5', {}, 'كوّن عرض السعر'), ...rows,
      h('div', { class: 'ms__total' }, h('span', {}, 'الإجمالي التقديري'), total),
      h('button', { type: 'button', class: 'ms__cta', onclick: () => { ctx.bump(); ctx.say('✓ وصل طلب عرض السعر، سنرد خلال 24 ساعة'); } }, 'اطلب عرض سعر رسمي'),
      h('footer', { class: 'ms__foot' }, '© مكتبي · الكويت · موقع تجريبي من Magmafy')];
  });
}

export function initRing() {
  const ringEl = document.getElementById('ring');
  const stage = document.getElementById('ring-stage');
  const dots = document.getElementById('ring-dots');
  const sites = [darLiving(), nook(), atelier(), maktabi()];
  const names = ['دار ليفينج', 'نوك ديكور', 'أتيليه نور', 'مكتبي'];
  sites.forEach((s) => stage.append(s));
  const n = sites.length;
  let idx = 0, w = 520;

  const dotBtns = names.map((nm, i) => {
    const b = h('button', { type: 'button', onclick: () => go(i) }, nm);
    dots.append(h('li', {}, b));
    return b;
  });

  // cover-flow arc: front site flat, neighbours turned away and pushed back
  function layout() {
    w = Math.min(520, innerWidth * .84);
    const ht = Math.min(600, Math.max(500, innerHeight * .68));
    sites.forEach((s) => { s.style.setProperty('--w', w + 'px'); s.style.setProperty('--h', ht + 'px'); });
    ringEl.style.height = ht + 70 + 'px';
    apply();
  }
  function apply(live = 0) {
    const shift = live / (w * .72);
    sites.forEach((s, i) => {
      let k = i - idx; if (k > n / 2) k -= n; if (k < -n / 2) k += n;
      k -= shift;
      const a = Math.max(-1.6, Math.min(1.6, k));
      s.style.transition = live ? 'none' : 'transform .9s cubic-bezier(.2,.8,.2,1), filter .5s, opacity .5s';
      s.style.transform = `translateX(${-a * w * .72}px) translateZ(${-Math.abs(a) * 320}px) rotateY(${a * 38}deg)`;
      s.style.zIndex = String(10 - Math.round(Math.abs(k) * 2));
      s.style.opacity = Math.abs(k) > 1.6 ? '0' : '1';
      s.classList.toggle('is-front', i === idx);
    });
    dotBtns.forEach((b, i) => b.setAttribute('aria-current', String(i === idx)));
  }
  function go(i) {
    const target = ((i % n) + n) % n;
    idx = target; apply();
  }
  document.getElementById('ring-next').addEventListener('click', () => go(idx + 1));
  document.getElementById('ring-prev').addEventListener('click', () => go(idx - 1));

  // drag on the ring background or on a site's browser bar
  let sx = null, dx = 0;
  ringEl.addEventListener('pointerdown', (e) => {
    const front = e.target.closest('.ms.is-front');
    if (front && !e.target.closest('.ms__bar')) return;
    sx = e.clientX; dx = 0; ringEl.setPointerCapture(e.pointerId);
  });
  ringEl.addEventListener('pointermove', (e) => { if (sx == null) return; dx = e.clientX - sx; apply(dx); });
  const up = () => { if (sx == null) return; sx = null; if (Math.abs(dx) > 40) go(idx + (dx > 0 ? 1 : -1)); else apply(); };
  ringEl.addEventListener('pointerup', up); ringEl.addEventListener('pointercancel', up);

  addEventListener('resize', layout);
  layout();
}
