// Interactive sections: market study, client journey (6 live steps), explainer film, booking.
import { CONFIG } from './config.js';

const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const fmt = (n) => Math.round(n).toLocaleString('en-US');
const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
const press = (group, btn, attr = 'aria-pressed') => $$('button', group).forEach((b) => b.setAttribute(attr, String(b === btn)));

/* ============ market study ============ */
const STUDY = {
  sa: { city: 'الرياض', cur: 'ر.س', rows: [['منافس أ · سلسلة كبرى', '4,200 – 6,800', 5, '6 ساعات', false], ['منافس ب · معرض محلي', '5,500 – 9,000', 2, 'يوم كامل', false], ['منافس ج · متجر أونلاين', '3,900 – 5,200', 7, 'ساعتان', false]],
    gaps: ['لا أحد منهم يعرض القطعة 3D أو داخل غرفة العميل', 'الرد على الرسائل بطيء، والعميل يذهب لمن يرد أولًا', 'محتوى موسم الزواج ضعيف رغم أنه أكبر موسم شراء', 'لا توجد صفحات هبوط للإعلانات، كلها تذهب للصفحة الرئيسية'] },
  ae: { city: 'دبي', cur: 'د.إ', rows: [['منافس أ · علامة عالمية', '3,900 – 7,500', 6, '3 ساعات', true], ['منافس ب · بوتيك ديكور', '6,000 – 11,000', 3, '8 ساعات', false], ['منافس ج · متجر أونلاين', '2,800 – 4,500', 9, 'ساعة', false]],
    gaps: ['المحتوى بالإنجليزية فقط، والجمهور العربي مهمل', 'إعلانات الكتالوج بدون إعادة استهداف', 'لا يوجد حجز زيارة أونلاين للمعرض', 'قصص العملاء الحقيقية شبه غائبة'] },
  qa: { city: 'الدوحة', cur: 'ر.ق', rows: [['منافس أ · معرض كبير', '4,500 – 8,000', 3, '5 ساعات', false], ['منافس ب · مصمم داخلي', 'حسب المشروع', 1, 'يومان', false], ['منافس ج · متجر أونلاين', '3,600 – 5,900', 4, '4 ساعات', false]],
    gaps: ['النشر غير منتظم، وأغلب الحسابات صامتة أيامًا', 'لا أحد يستخدم ريلز الغرفة الكاملة', 'السعر غير واضح، والعميل يضطر للسؤال', 'لا يوجد تقسيط معلن في الإعلانات'] },
  kw: { city: 'الكويت', cur: 'د.ك', rows: [['منافس أ · سلسلة محلية', '390 – 720', 4, '6 ساعات', false], ['منافس ب · معرض فاخر', '850 – 1,600', 2, 'يوم كامل', false], ['منافس ج · متجر انستجرام', '280 – 450', 8, 'ساعتان', false]],
    gaps: ['الاعتماد على الواتساب فقط بدون موقع أو كتالوج', 'لا يوجد قياس لزيارات المعرض من السوشيال', 'صور المنتجات بخلفيات عادية بلا ديكور', 'لا يوجد استهداف للمكاتب والشركات'] },
  bh: { city: 'المنامة', cur: 'د.ب', rows: [['منافس أ · معرض عائلي', '420 – 780', 2, '8 ساعات', false], ['منافس ب · متجر أونلاين', '300 – 520', 5, '3 ساعات', false], ['منافس ج · وكيل علامة', '650 – 1,200', 3, '5 ساعات', false]],
    gaps: ['سوق صغير يعني أن أول من يتحرك بقوة يكسب', 'لا توجد حملات للعملاء من السعودية عبر الجسر', 'محتوى الفيديو شبه معدوم', 'لا توجد مراجعات أو محتوى عملاء'] },
  om: { city: 'مسقط', cur: 'ر.ع', rows: [['منافس أ · معرض كبير', '380 – 700', 3, '6 ساعات', false], ['منافس ب · مصنع محلي', '290 – 560', 1, 'يومان', false], ['منافس ج · متجر أونلاين', '320 – 480', 4, '4 ساعات', false]],
    gaps: ['المصانع المحلية لا تسوّق منتجها مباشرة للعميل', 'لا توجد إعلانات زيارة معرض بموقع جغرافي', 'الكابشن بدون سعر أو دعوة واضحة', 'الحسابات لا ترد على التعليقات'] },
};
function initStudy() {
  const rows = $('#study-rows'), bars = $('#study-bars'), gaps = $('#study-gaps'), city = $('#study-city'), group = $('#study-countries');
  const render = (k) => {
    const d = STUDY[k];
    city.textContent = d.city;
    const you = ['أنت مع Magmafy', 'حسب تسعيرك', 14, '< 15 دقيقة', true];
    rows.replaceChildren(...[...d.rows, you].map((r, i) => {
      const tr = document.createElement('tr');
      if (i === d.rows.length) tr.className = 'is-you';
      tr.innerHTML = `<td>${r[0]}</td><td class="num">${r[1]}${/\d/.test(r[1]) ? ' ' + d.cur : ''}</td><td class="num">${r[2]}</td><td>${r[3]}</td><td class="${r[4] ? 'ok' : 'no'}">${r[4] ? '✓' : '✕'}</td>`;
      return tr;
    }));
    const score = [...d.rows.map((r, i) => [r[0].split(' · ')[0], 30 + r[2] * 5 + (r[4] ? 12 : 0) - i * 3]), ['Magmafy', 94]];
    bars.replaceChildren(...score.map(([n, v], i) => {
      const el = document.createElement('div'); el.className = 'sbar' + (i === score.length - 1 ? ' is-you' : '');
      el.innerHTML = `<span>${n}</span><i><span></span></i><b class="num">${v}</b>`;
      requestAnimationFrame(() => requestAnimationFrame(() => { el.querySelector('i span').style.width = v + '%'; }));
      return el;
    }));
    const lbl = document.createElement('p'); lbl.className = 'fine'; lbl.textContent = 'مؤشر الحضور الرقمي (من 100) · أرقام العينة توضيحية، والتقرير الحقيقي يُبنى على منافسيك أنت.';
    bars.append(lbl);
    gaps.replaceChildren(...d.gaps.map((g) => { const li = document.createElement('li'); li.textContent = g; return li; }));
  };
  group.addEventListener('click', (e) => { const b = e.target.closest('button'); if (!b) return; press(group, b, 'aria-selected'); render(b.dataset.c); });
  render('sa');
}

/* ============ journey ============ */
function initJourney() {
  const tabs = $$('.jy__tabs [role=tab]'), panels = $$('.jy__panel'), bar = $('#jy-bar');
  const show = (i) => {
    tabs.forEach((t, k) => { t.setAttribute('aria-selected', String(k === i)); t.tabIndex = k === i ? 0 : -1; });
    panels.forEach((p, k) => { p.hidden = k !== i; p.classList.toggle('is-on', k === i); });
    bar.style.width = ((i + 1) / tabs.length) * 100 + '%';
    if (window.gsap && !reduced) gsap.from(panels[i].children, { y: 24, opacity: 0, duration: .6, stagger: .08, ease: 'power3.out' });
    if (i === 5) drawDash(+$('#m-range').value);
  };
  tabs.forEach((t, i) => {
    t.addEventListener('click', () => show(i));
    t.addEventListener('keydown', (e) => {
      const d = e.key === 'ArrowLeft' ? 1 : e.key === 'ArrowRight' ? -1 : 0;
      if (d) { const j = (i + d + tabs.length) % tabs.length; tabs[j].focus(); show(j); }
    });
  });

  // 1 personas
  const P = [
    { av: 'س', name: 'سارة ومحمد، 27', role: 'عرسان جدد · يجهّزون أول بيت', q: '«عايزين صالة شيك بميزانية معقولة، ومحتاجين نشوف القطعة في بيت حقيقي قبل ما نقرر.»', where: 'Instagram · Pinterest', hook: 'ريلز للغرفة كاملة + تقسيط' },
    { av: 'ع', name: 'عائلة أبو خالد، 41', role: 'تنتقل إلى فيلا جديدة', q: '«عندنا 4 غرف محتاجة تتفرش مرة واحدة، عايزين حد يدينا عرض متكامل وتوصيل وتركيب.»', where: 'Snapchat · Google', hook: 'باقة بيت كامل + زيارة مصمم' },
    { av: 'م', name: 'مها، مديرة مكتب، 35', role: 'تجهّز مقر شركة جديد', q: '«محتاجة 40 كرسي ومكاتب وركن استقبال، وعرض سعر رسمي قبل آخر الشهر.»', where: 'LinkedIn · Google', hook: 'صفحة عرض سعر + رد خلال ساعة' },
  ];
  $('.persona-pick').addEventListener('click', (e) => {
    const b = e.target.closest('button'); if (!b) return; press(b.parentElement, b);
    const p = P[+b.dataset.p];
    $('#persona-av').textContent = p.av; $('#persona-name').textContent = p.name; $('#persona-role').textContent = p.role;
    $('#persona-quote').textContent = p.q; $('#persona-where').textContent = p.where; $('#persona-hook').textContent = p.hook;
    if (window.gsap && !reduced) gsap.fromTo('#persona', { rotateY: -12, opacity: .3 }, { rotateY: 0, opacity: 1, duration: .6, ease: 'power3.out' });
  });

  // 2 before / after
  const ba = $('#ba'), range = $('.ba__range', ba);
  range.addEventListener('input', () => ba.style.setProperty('--x', range.value + '%'));
  const BA = [['sofa-leather', 'interior-sun'], ['chair-yellow', 'living-boho'], ['sofa-grey', 'living-soft']];
  $('#jy-2 .jy__chips').addEventListener('click', (e) => {
    const b = e.target.closest('button'); if (!b) return; press(b.parentElement, b);
    const [bf, af] = BA[+b.dataset.ba];
    $('#ba-before').src = `assets/img/${bf}.jpg`; $('#ba-after').src = `assets/img/${af}.jpg`;
    if (!reduced && window.gsap) gsap.fromTo(range, { value: 85 }, { value: 50, duration: 1.2, ease: 'power3.inOut', onUpdate: () => ba.style.setProperty('--x', range.value + '%') });
  });

  // 3 calendar
  const types = { insp: ['إلهام', '#962fbf'], prod: ['منتج', '#fa7e1e'], offer: ['عرض', '#d62976'], story: ['قصة عميل', '#4f5bd5'] };
  const posts = {
    2: ['insp', 'living-cream', 'كاروسيل', '5 أفكار لصالة دافئة', 'الصالة اللي بتحضن العيلة كلها. اسحب للآخر واختار المفضلة 👇'],
    4: ['prod', 'sofa-green', 'ريل', 'كنبة لوفت · 3 ألوان', 'مخمل ناعم، أرجل خشب جوز، ومقاس يناسب الشقق. اطلب السعر في الرسائل 💬'],
    7: ['story', 'living-boho', 'ستوري', 'من بيت عميلتنا نورة', 'نورة فرشت صالتها معانا في أسبوعين. شوف النتيجة ✨'],
    9: ['insp', 'decor-corner', 'كاروسيل', 'ركن قراءة في متر واحد', 'مش محتاج مساحة كبيرة عشان يبقى عندك ركن خاص بيك.'],
    11: ['prod', 'bed-velvet', 'ريل', 'سرير مخمل · جولة 15 ثانية', 'التفاصيل اللي بتفرق: خياطة يدوية وقماش مقاوم للبقع.'],
    14: ['offer', 'living-soft', 'منشور', 'باقة العرسان', 'صالة + سفرة + غرفة نوم بخصم 15% وتقسيط 12 شهر 💍'],
    16: ['story', 'dining', 'ريل', 'سفرة عيلة أبو خالد', 'عزومة الجمعة بقت أحلى على سفرة دار ليفينج 🍽️'],
    18: ['prod', 'chair-yellow', 'منشور', 'كرسي سَكَن', 'لون يفتح الركن كله. متوفر بـ 4 ألوان.'],
    21: ['insp', 'interior-sun', 'كاروسيل', 'ألوان الشتاء في بيتك', 'البني الدافئ راجع بقوة هذا الموسم. احفظ البوست للإلهام 📌'],
    24: ['offer', 'sofa-orange', 'ريل', 'الجمعة البيضاء تبدأ', 'خصومات حتى 30% لمدة 72 ساعة فقط. احجز زيارتك الآن 🛋️'],
    27: ['offer', 'living-teal', 'ستوري', 'آخر 24 ساعة', 'العد التنازلي بدأ ⏳ القطع المتبقية محدودة.'],
    29: ['story', 'living-green', 'منشور', 'شكرًا لكم', '186 عائلة اختارت دار ليفينج هذا الشهر 💛'],
  };
  const grid = $('#cal-grid');
  grid.append(document.createElement("span")); // 1 Nov 2026 is a Sunday; the week starts on Saturday
  for (let d = 1; d <= 30; d++) {
    const b = document.createElement('button'); b.type = 'button'; b.textContent = d; b.className = 'num';
    const p = posts[d];
    if (p) { b.dataset.t = p[0]; b.style.setProperty('--c', types[p[0]][1]); b.setAttribute('aria-label', `${d} نوفمبر: ${types[p[0]][0]}`); }
    else b.setAttribute('aria-label', `${d} نوفمبر: لا يوجد منشور`);
    b.addEventListener('click', () => {
      $$('button', grid).forEach((x) => x.classList.toggle('is-on', x === b));
      const q = p || ['', 'living-calm', 'تفاعل', 'يوم للرد والتفاعل', 'اليوم مخصص للرد على التعليقات والرسائل وجمع محتوى العملاء.'];
      const imgEl = $('#cal-img'); imgEl.style.opacity = 0;
      setTimeout(() => { imgEl.src = `assets/img/${q[1]}.jpg`; imgEl.style.opacity = 1; }, 200);
      $('#cal-type').textContent = q[2]; $('#cal-over').textContent = q[3];
      $('#cal-cap').innerHTML = '<b>dar.living</b> ' + q[4];
    });
    grid.append(b);
  }
  grid.children[2]?.classList.add('is-on');

  // 4 ad builder
  const AUD = [
    { img: 'living-soft', over: 'أول بيت؟ نجهّز صالتك كاملة', cap: 'باقة العرسان: صالة + سفرة + غرفة نوم، تقسيط حتى 12 شهر وتركيب مجاني.', reach: 48000, cpl: 18 },
    { img: 'living-green', over: 'بيت جديد؟ فرشه كله من مكان واحد', cap: 'مصمم يزورك مجانًا، ويجهز لك عرضًا لكل الغرف مع التوصيل والتركيب.', reach: 72000, cpl: 24 },
    { img: 'office-lounge', over: 'مكتب جديد؟ عرض سعر خلال 24 ساعة', cap: 'كراسي ومكاتب وركن استقبال بأسعار الشركات، وتوريد وتركيب في أسبوع.', reach: 21000, cpl: 46 },
  ];
  const GOAL = [['احجز زيارة للمعرض', 1, 'زيارة'], ['أرسل رسالة', .62, 'محادثة'], ['تسوّق الكتالوج', .8, 'نقرة شراء']];
  let aud = 0, goal = 0;
  const tween = (el, to, suffix = '') => {
    const from = parseFloat(el.textContent.replace(/,/g, '')) || 0;
    if (!window.gsap || reduced) { el.textContent = fmt(to) + suffix; return; }
    const o = { v: from }; gsap.to(o, { v: to, duration: .8, ease: 'power2.out', onUpdate: () => { el.textContent = fmt(o.v) + suffix; } });
  };
  const renderAd = () => {
    const a = AUD[aud], g = GOAL[goal];
    const imgEl = $('#ad-img'); imgEl.style.opacity = 0; setTimeout(() => { imgEl.src = `assets/img/${a.img}.jpg`; imgEl.style.opacity = 1; }, 180);
    $('#ad-over').textContent = a.over; $('#ad-cap').textContent = a.cap; $('#ad-cta').textContent = g[0];
    const cpl = a.cpl * g[1];
    tween($('#ad-reach'), a.reach); tween($('#ad-cpl'), cpl, ' ر.س'); tween($('#ad-res'), 3000 / cpl);
  };
  $('#jy-4').addEventListener('click', (e) => {
    const b = e.target.closest('button[data-aud],button[data-goal]'); if (!b) return; press(b.parentElement, b);
    if (b.dataset.aud) aud = +b.dataset.aud; else goal = +b.dataset.goal;
    renderAd();
  });

  // 5 DMs
  const QA = [
    ['كم سعر الكنبة الجلد؟', ['أهلًا بيك 👋 الكنبة الجلد الكلاسيك بـ 8,900 ر.س، ومتاحة بالتقسيط على 12 شهر بدون فوائد.', 'تحب أبعتلك صور ليها في صالات عملائنا؟']],
    ['في ألوان تانية؟', ['أكيد! متوفرة كونياك، بني غامق، وأسود ✨', { card: ['الألوان المتاحة', 'كونياك · بني غامق · أسود'] }]],
    ['التوصيل بياخد قد إيه؟', ['داخل الرياض من 3 لـ 5 أيام، والتوصيل والتركيب مجاني 🚚']],
    ['ممكن أشوفها في المعرض؟', ['يسعدنا! 😊 حجزتلك موعد يوم الخميس الساعة 6 مساءً، وهتلاقي المصمم أحمد مستنيك.', { card: ['📍 موعد زيارة مؤكد', 'الخميس 6:00 م · معرض دار ليفينج، طريق الملك فهد'] }]],
  ];
  const body = $('#dm-body'), quick = $('#dm-quick');
  const bubble = (cls, content) => {
    const el = document.createElement('div'); el.className = 'msg ' + cls;
    if (typeof content === 'string') el.textContent = content; else el.innerHTML = `<b>${content.card[0]}</b><span>${content.card[1]}</span>`;
    body.append(el); body.scrollTop = body.scrollHeight; return el;
  };
  bubble('msg--out', 'أهلًا بيك في دار ليفينج 🛋️ اسألني عن أي قطعة.');
  quick.addEventListener('click', async (e) => {
    const b = e.target.closest('button'); if (!b || b.disabled) return;
    $$('button', quick).forEach((x) => (x.disabled = true));
    const [q, answers] = QA[+b.dataset.q];
    bubble('msg--in', q);
    for (const a of answers) {
      const t = bubble('msg--typing', ''); t.innerHTML = '<i></i><i></i><i></i>';
      await new Promise((r) => setTimeout(r, reduced ? 50 : 900));
      t.remove(); bubble(typeof a === 'string' ? 'msg--out' : 'msg--card', a);
    }
    b.remove();
    $$('button', quick).forEach((x) => (x.disabled = false));
  });

  // 6 dashboard
  const M = { f: [312, 980, 2100, 3900, 6200, 8640], i: [8, 24, 51, 92, 138, 186], v: [0, 4, 11, 26, 44, 64], c: [62, 48, 39, 31, 25, 21] };
  const range6 = $('#m-range');
  function drawDash(m) {
    $('#m-val').textContent = m;
    tween($('#k-f'), M.f[m - 1]); tween($('#k-i'), M.i[m - 1]); tween($('#k-v'), M.v[m - 1]); tween($('#k-c'), M.c[m - 1], ' ر.س');
    const pts = M.i.slice(0, m).map((v, k) => [320 - (k / 5) * 320, 118 - (v / 186) * 100]);
    let d = `M${pts[0][0]} ${pts[0][1]}`;
    for (let k = 1; k < pts.length; k++) { const [x0, y0] = pts[k - 1], [x1, y1] = pts[k]; const cx = (x0 + x1) / 2; d += ` C${cx} ${y0} ${cx} ${y1} ${x1} ${y1}`; }
    $('#dash-line').setAttribute('d', d);
    const last = pts[pts.length - 1];
    $('#dash-area').setAttribute('d', d + ` L${last[0]} 130 L320 130 Z`);
    $('#dash-dot').setAttribute('cx', last[0]); $('#dash-dot').setAttribute('cy', last[1]);
  }
  range6.addEventListener('input', () => drawDash(+range6.value));
  drawDash(6);
}

/* ============ explainer film ============ */
const CAPTIONS = [
  'معرضك عنده قطع رائعة… لكن الحساب صامت.',
  'أول خطوة: ندرس سوقك ومنافسيك في الخليج، ونعرف أين الفجوة.',
  'نحوّل صور الجوال إلى مشاهد واقعية بالذكاء الاصطناعي.',
  'إعلانات تصل لمن يجهّز بيته الآن، لا لكل الناس.',
  'موقع ثلاثي الأبعاد يلفّ فيه العميل القطعة ويختار لونها.',
  'والنتيجة: استفسارات وزيارات وطلبات تقدر تعدّها.',
];
function initFilm() {
  if (!window.gsap) return;
  const section = $('#film'), cap = $('#film-caption'), scenes = $$('.fs'), chapters = $$('#film-chapters button');
  const toggle = $('#film-toggle'), time = $('#film-time');
  const DUR = 8;
  const tl = gsap.timeline({ paused: true, onUpdate: tick, onComplete: () => { section.classList.remove('is-playing'); toggle.textContent = '↺'; } });

  const scene = (i, build) => {
    const s = scenes[i], at = i * DUR;
    tl.set(s, { autoAlpha: 1 }, at).fromTo(s, { opacity: 0 }, { opacity: 1, duration: .5 }, at);
    tl.call(() => { cap.textContent = CAPTIONS[i]; gsap.fromTo(cap, { y: 14, opacity: 0 }, { y: 0, opacity: 1, duration: .5 }); scenes.forEach((x, k) => x.classList.toggle('is-on', k === i)); }, null, at + .05);
    build(at, s);
    if (i < scenes.length - 1) tl.to(s, { opacity: 0, duration: .5 }, at + DUR - .5).set(s, { autoAlpha: 0 }, at + DUR);
  };
  scene(0, (at, s) => {
    tl.from($('.fs1__phone', s), { y: 60, rotate: -6, opacity: 0, duration: 1, ease: 'power3.out' }, at + .2)
      .from($$('.fs1__grid img', s), { scale: 0, opacity: 0, stagger: .08, duration: .4 }, at + .8)
      .from($$('.fs1__zzz span', s), { y: 20, opacity: 0, stagger: .35, duration: .6, repeat: 2, yoyo: true }, at + 2);
  });
  scene(1, (at, s) => {
    tl.fromTo($('.fs2__land', s), { strokeDashoffset: 900 }, { strokeDashoffset: 0, duration: 2, ease: 'power2.inOut' }, at + .2)
      .from($$('.fs2__pins g', s), { scale: 0, opacity: 0, transformOrigin: 'center', stagger: .2, duration: .5, ease: 'back.out(2)' }, at + 1)
      .from($$('.fs2__card', s), { x: -40, opacity: 0, stagger: .5, duration: .6, ease: 'power3.out' }, at + 2.6);
  });
  scene(2, (at, s) => {
    tl.from($('.fs3__wrap', s), { scale: .85, opacity: 0, duration: .8, ease: 'power3.out' }, at + .2)
      .fromTo($('.fs3__after', s), { clipPath: 'inset(0 0 0 100%)' }, { clipPath: 'inset(0 0 0 0%)', duration: 2.6, ease: 'power2.inOut' }, at + 1.8)
      .fromTo($('.fs3__scan', s), { left: '100%' }, { left: '0%', duration: 2.6, ease: 'power2.inOut' }, at + 1.8)
      .to($('.fs3__scan', s), { opacity: 0, duration: .3 }, at + 4.5);
  });
  scene(3, (at, s) => {
    tl.from($$('.fs4__target i', s), { scale: 0, opacity: 0, stagger: .2, duration: .6, ease: 'back.out(1.6)' }, at + .2)
      .from($$('.fs4__people span', s), { scale: 0, opacity: 0, stagger: .25, duration: .5, ease: 'back.out(2)' }, at + 1.2)
      .from($('.fs4__ad', s), { x: 80, rotate: 6, opacity: 0, duration: .8, ease: 'power3.out' }, at + 3)
      .to($$('.fs4__target i', s), { scale: 1.08, duration: .5, yoyo: true, repeat: 5, stagger: .1 }, at + 3.5);
  });
  scene(4, (at, s) => {
    tl.from($('.fs5__browser', s), { y: 60, opacity: 0, duration: .8, ease: 'power3.out' }, at + .2)
      .fromTo($('.fs5__cube', s), { rotateY: 0 }, { rotateY: -360, duration: 6, ease: 'power1.inOut' }, at + 1)
      .from($$('.fs5__sw i', s), { scale: 0, stagger: .15, duration: .4, ease: 'back.out(2)' }, at + 1.4);
  });
  scene(5, (at, s) => {
    tl.from($$('.fs6__kpis div', s), { y: 40, opacity: 0, stagger: .2, duration: .6, ease: 'power3.out' }, at + .2);
    $$('.fs6__kpis b', s).forEach((b) => { const o = { v: 0 }; tl.to(o, { v: +b.dataset.to, duration: 2.2, ease: 'power2.out', onUpdate: () => { b.textContent = fmt(o.v); } }, at + .6); });
    tl.to($('.fs6__chart path', s), { strokeDashoffset: 0, duration: 2.4, ease: 'power2.inOut' }, at + .8)
      .set($('.fs6__cta', s), { display: 'inline-flex' }, at + 3)
      .from($('.fs6__cta', s), { scale: .6, opacity: 0, duration: .6, ease: 'back.out(2)' }, at + 3);
  });
  const total = scenes.length * DUR;
  tl.set({}, {}, total);
  function tick() {
    const t = tl.time();
    const cur = Math.min(scenes.length - 1, Math.floor(t / DUR));
    chapters.forEach((c, i) => {
      c.classList.toggle('is-on', i === cur);
      c.querySelector('span').style.width = Math.max(0, Math.min(1, (t - i * DUR) / DUR)) * 100 + '%';
    });
    const f = (x) => `${Math.floor(x / 60)}:${String(Math.floor(x % 60)).padStart(2, '0')}`;
    time.textContent = `${f(t)} / ${f(total)}`;
  }
  const play = () => { if (tl.progress() >= 1) tl.restart(); else tl.play(); section.classList.add('is-playing'); toggle.textContent = '❚❚'; };
  const pause = () => { tl.pause(); toggle.textContent = '▶'; };
  $('#film-play').addEventListener('click', play);
  toggle.addEventListener('click', () => (tl.isActive() ? pause() : play()));
  chapters.forEach((c, i) => c.addEventListener('click', () => { tl.seek(i * DUR + .01); play(); }));
  // show scene 1 as poster
  tl.seek(.6).pause(); tick();
  // auto-play once when scrolled into view
  let auto = false;
  new IntersectionObserver(([e]) => {
    if (e.isIntersecting && !auto && !reduced) { auto = true; tl.seek(0); play(); }
    if (!e.isIntersecting && tl.isActive()) pause();
  }, { threshold: .55 }).observe($('#film-stage'));
}

/* ============ booking ============ */
const MONTHS = ['يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو', 'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'];
const DAYS = ['الأحد', 'الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'];
const SLOTS = ['10:00', '10:30', '11:00', '11:30', '12:00', '13:00', '13:30', '14:00', '15:00', '15:30', '16:00', '17:00'];
const ar12 = (t) => { const [hh, mm] = t.split(':').map(Number); return `${((hh + 11) % 12) + 1}:${String(mm).padStart(2, '0')} ${hh < 12 ? 'ص' : 'م'}`; };

function initBooking() {
  const form = $('#book'), grid = $('#bcal-grid'), title = $('#bcal-title'), times = $('#bt-grid'), btTitle = $('#bt-title');
  const sel = $('#book-sel b'), note = $('#book-note'), steps = $$('.book__steps span');
  // "now" in Riyadh time
  const nowKSA = () => new Date(Date.now() + (new Date().getTimezoneOffset() + 180) * 60000);
  const today = nowKSA(); today.setHours(0, 0, 0, 0);
  let view = new Date(today.getFullYear(), today.getMonth(), 1);
  { // jump to next month when this one has fewer than 3 bookable days left
    let left = 0; for (let d = new Date(today); d.getMonth() === today.getMonth(); d.setDate(d.getDate() + 1)) if (d > today && d.getDay() < 5) left++;
    if (left < 3) view = new Date(today.getFullYear(), today.getMonth() + 1, 1);
  }
  let day = null, slot = null, mtype = 'Google Meet';
  const maxView = new Date(today.getFullYear(), today.getMonth() + 2, 1);

  const setStep = () => steps.forEach((s, i) => s.classList.toggle('is-on', i === (day ? (slot ? 2 : 1) : 0)));
  const updateSel = () => { sel.textContent = day ? `${DAYS[day.getDay()]} ${day.getDate()} ${MONTHS[day.getMonth()]}${slot ? ' · ' + ar12(slot) + ' (بتوقيت السعودية)' : ''} · ${mtype}` : 'لم يتم الاختيار بعد'; setStep(); };
  // deterministic "booked" slots so it feels real
  const busy = (d, s) => ((d.getDate() * 7 + SLOTS.indexOf(s) * 3) % 9) === 0;

  function drawCal() {
    title.textContent = `${MONTHS[view.getMonth()]} ${view.getFullYear()}`;
    $('#bcal-prev').disabled = view <= new Date(today.getFullYear(), today.getMonth(), 1);
    $('#bcal-next').disabled = view >= maxView;
    const first = view.getDay(), days = new Date(view.getFullYear(), view.getMonth() + 1, 0).getDate();
    const cells = [];
    for (let i = 0; i < first; i++) cells.push(document.createElement('span'));
    for (let d = 1; d <= days; d++) {
      const dt = new Date(view.getFullYear(), view.getMonth(), d);
      const b = document.createElement('button'); b.type = 'button'; b.textContent = d; b.className = 'num';
      const off = dt.getDay() === 5 || dt.getDay() === 6 || dt <= today;
      b.disabled = off;
      b.setAttribute('aria-label', `${DAYS[dt.getDay()]} ${d} ${MONTHS[dt.getMonth()]}${off ? ' (غير متاح)' : ''}`);
      if (+dt === +today) b.classList.add('is-today');
      b.setAttribute('aria-pressed', String(day && +dt === +day));
      b.addEventListener('click', () => { day = dt; slot = null; drawCal(); drawTimes(); updateSel(); if (innerWidth < 640) times.scrollIntoView({ behavior: 'smooth', block: 'center' }); });
      cells.push(b);
    }
    grid.replaceChildren(...cells);
  }
  function drawTimes() {
    if (!day) { btTitle.textContent = 'اختر يومًا أولًا'; times.replaceChildren(Object.assign(document.createElement('p'), { textContent: 'الأيام المتاحة من الأحد إلى الخميس.' })); return; }
    btTitle.textContent = `المواعيد المتاحة · ${DAYS[day.getDay()]} ${day.getDate()} ${MONTHS[day.getMonth()]}`;
    times.replaceChildren(...SLOTS.map((s) => {
      const b = document.createElement('button'); b.type = 'button'; b.setAttribute('role', 'radio'); b.textContent = ar12(s);
      b.setAttribute('aria-checked', String(s === slot)); b.disabled = busy(day, s);
      b.addEventListener('click', () => { slot = s; drawTimes(); updateSel(); });
      return b;
    }));
    if (window.gsap && !reduced) gsap.from(times.children, { y: 12, opacity: 0, stagger: .03, duration: .35 });
  }
  $('#bcal-prev').addEventListener('click', () => { view = new Date(view.getFullYear(), view.getMonth() - 1, 1); drawCal(); });
  $('#bcal-next').addEventListener('click', () => { view = new Date(view.getFullYear(), view.getMonth() + 1, 1); drawCal(); });
  $('.bt__type').addEventListener('click', (e) => { const b = e.target.closest('button'); if (!b) return; press(b.parentElement, b, 'aria-checked'); mtype = b.dataset.mt; updateSel(); });
  // pricing buttons preselect topic
  $$('[data-plan]').forEach((a) => a.addEventListener('click', () => { const t = $('#book-topic'); [...t.options].forEach((o) => { if (o.text === a.dataset.plan) t.value = o.value; }); }));

  const pad = (n) => String(n).padStart(2, '0');
  const utcStamp = (d) => `${d.getUTCFullYear()}${pad(d.getUTCMonth() + 1)}${pad(d.getUTCDate())}T${pad(d.getUTCHours())}${pad(d.getUTCMinutes())}00Z`;

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    note.classList.remove('is-err');
    const fd = new FormData(form);
    let bad = false;
    ['name', 'email', 'biz'].forEach((k) => { const el = form.elements[k]; const ok = el.value.trim() && (k !== 'email' || /^\S+@\S+\.\S+$/.test(el.value)); el.classList.toggle('is-bad', !ok); if (!ok) bad = true; });
    if (!day || !slot) { note.textContent = 'اختر اليوم والوقت من التقويم أولًا.'; note.classList.add('is-err'); return; }
    if (bad) { note.textContent = 'من فضلك أكمل الحقول المطلوبة.'; note.classList.add('is-err'); return; }
    const [hh, mm] = slot.split(':').map(Number);
    const start = new Date(Date.UTC(day.getFullYear(), day.getMonth(), day.getDate(), hh - 3, mm));
    const end = new Date(start.getTime() + 30 * 60000);
    const when = `${DAYS[day.getDay()]} ${day.getDate()} ${MONTHS[day.getMonth()]} ${day.getFullYear()} · ${ar12(slot)} بتوقيت السعودية`;
    const payload = {
      _subject: `حجز اجتماع Magmafy · ${fd.get('biz')} · ${when}`,
      _template: 'table', _captcha: 'false',
      'الاسم': fd.get('name'), 'البريد': fd.get('email'), 'الجوال': fd.get('phone') || '-', 'النشاط': fd.get('biz'),
      'الموضوع': fd.get('topic'), 'الموعد': when, 'نوع الاجتماع': mtype, _replyto: fd.get('email'),
    };
    const btn = $('#book-submit'); btn.disabled = true; btn.textContent = 'جارٍ تأكيد الموعد…';
    let sent = false;
    try {
      const r = await fetch(`https://formsubmit.co/ajax/${encodeURIComponent(CONFIG.bookingEmail)}`, { method: 'POST', headers: { 'Content-Type': 'application/json', Accept: 'application/json' }, body: JSON.stringify(payload) });
      sent = r.ok;
    } catch { sent = false; }
    btn.disabled = false; btn.textContent = 'أكّد الموعد';
    const details = `اجتماع Magmafy (${mtype}) مع ${fd.get('name')} · ${fd.get('biz')} · ${fd.get('topic')}`;
    const gcal = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent('اجتماع مع Magmafy')}&dates=${utcStamp(start)}/${utcStamp(end)}&details=${encodeURIComponent(details)}`;
    const ics = ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//Magmafy//Booking//AR', 'BEGIN:VEVENT', `UID:${Date.now()}@magmafy`, `DTSTAMP:${utcStamp(new Date())}`, `DTSTART:${utcStamp(start)}`, `DTEND:${utcStamp(end)}`, 'SUMMARY:اجتماع مع Magmafy', `DESCRIPTION:${details}`, `ORGANIZER:mailto:${CONFIG.bookingEmail}`, 'END:VEVENT', 'END:VCALENDAR'].join('\r\n');
    $('#book-gcal').href = gcal;
    $('#book-ics').href = URL.createObjectURL(new Blob([ics], { type: 'text/calendar' }));
    if (sent) {
      $('#book-done-text').textContent = `موعدك ${when} عبر ${mtype}. أرسلنا التفاصيل لفريقنا، وسيصلك رابط الاجتماع على ${fd.get('email')} قبل الموعد.`;
    } else {
      const mail = `mailto:${CONFIG.bookingEmail}?subject=${encodeURIComponent(payload._subject)}&body=${encodeURIComponent(Object.entries(payload).filter(([k]) => !k.startsWith('_')).map(([k, v]) => `${k}: ${v}`).join('\n'))}`;
      $('#book-done-text').innerHTML = `اخترت ${when}. لم نتمكن من الإرسال تلقائيًا، <a href="${mail}" style="text-decoration:underline">اضغط هنا لإرسال الحجز بالبريد</a> وسنؤكده فورًا.`;
    }
    form.classList.add('is-done'); $('#book-done').hidden = false;
    form.scrollIntoView({ behavior: 'smooth', block: 'center' });
  });
  $('#book-again').addEventListener('click', () => { form.classList.remove('is-done'); $('#book-done').hidden = true; day = slot = null; drawCal(); drawTimes(); updateSel(); });
  drawCal(); drawTimes(); updateSel();
}

export function initDemos() {
  initStudy();
  initJourney();
  initFilm();
  initBooking();
}
