// Hero scene: a molten "magma" core in the brand gradient, orbited by a tilted ring of real
// furniture photos (the feed), with embers rising around it. Scroll progress opens the ring
// and pulls the camera in; the pointer adds parallax. Paused whenever the hero is off screen.
import * as THREE from 'three';

const NOISE = /* glsl */`
vec3 mod289(vec3 x){return x-floor(x*(1./289.))*289.;}
vec4 mod289(vec4 x){return x-floor(x*(1./289.))*289.;}
vec4 permute(vec4 x){return mod289(((x*34.)+1.)*x);}
vec4 taylorInvSqrt(vec4 r){return 1.79284291400159-.85373472095314*r;}
float snoise(vec3 v){
  const vec2 C=vec2(1./6.,1./3.);const vec4 D=vec4(0.,.5,1.,2.);
  vec3 i=floor(v+dot(v,C.yyy));vec3 x0=v-i+dot(i,C.xxx);
  vec3 g=step(x0.yzx,x0.xyz);vec3 l=1.-g;vec3 i1=min(g.xyz,l.zxy);vec3 i2=max(g.xyz,l.zxy);
  vec3 x1=x0-i1+C.xxx;vec3 x2=x0-i2+C.yyy;vec3 x3=x0-D.yyy;
  i=mod289(i);
  vec4 p=permute(permute(permute(i.z+vec4(0.,i1.z,i2.z,1.))+i.y+vec4(0.,i1.y,i2.y,1.))+i.x+vec4(0.,i1.x,i2.x,1.));
  float n_=.142857142857;vec3 ns=n_*D.wyz-D.xzx;
  vec4 j=p-49.*floor(p*ns.z*ns.z);vec4 x_=floor(j*ns.z);vec4 y_=floor(j-7.*x_);
  vec4 x=x_*ns.x+ns.yyyy;vec4 y=y_*ns.x+ns.yyyy;vec4 h=1.-abs(x)-abs(y);
  vec4 b0=vec4(x.xy,y.xy);vec4 b1=vec4(x.zw,y.zw);
  vec4 s0=floor(b0)*2.+1.;vec4 s1=floor(b1)*2.+1.;vec4 sh=-step(h,vec4(0.));
  vec4 a0=b0.xzyw+s0.xzyw*sh.xxyy;vec4 a1=b1.xzyw+s1.xzyw*sh.zzww;
  vec3 p0=vec3(a0.xy,h.x);vec3 p1=vec3(a0.zw,h.y);vec3 p2=vec3(a1.xy,h.z);vec3 p3=vec3(a1.zw,h.w);
  vec4 norm=taylorInvSqrt(vec4(dot(p0,p0),dot(p1,p1),dot(p2,p2),dot(p3,p3)));
  p0*=norm.x;p1*=norm.y;p2*=norm.z;p3*=norm.w;
  vec4 m=max(.6-vec4(dot(x0,x0),dot(x1,x1),dot(x2,x2),dot(x3,x3)),0.);m=m*m;
  return 42.*dot(m*m,vec4(dot(p0,x0),dot(p1,x1),dot(p2,x2),dot(p3,x3)));
}`;

const PHOTOS = ['living-boho', 'sofa-orange', 'bed-velvet', 'chair-yellow', 'living-green', 'dining',
  'living-cream', 'lamp', 'sofa-green', 'interior-sun', 'decor-corner', 'living-dark', 'stool', 'living-teal'];

export function initHero(canvas, { onLoad } = {}) {
  const mobile = matchMedia('(max-width: 960px)').matches;
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: !mobile, alpha: true, powerPreference: 'high-performance' });
  renderer.setPixelRatio(Math.min(devicePixelRatio, mobile ? 1.5 : 2));
  renderer.outputColorSpace = THREE.SRGBColorSpace;

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(40, 1, .1, 100);
  camera.position.set(0, 0, 10);

  const world = new THREE.Group();
  scene.add(world);

  /* ---- magma core ---- */
  const coreU = { uTime: { value: 0 }, uAmp: { value: .16 }, uHeat: { value: 0 } };
  const core = new THREE.Mesh(
    new THREE.IcosahedronGeometry(1.05, mobile ? 24 : 64),
    new THREE.ShaderMaterial({
      uniforms: coreU,
      vertexShader: NOISE + /* glsl */`
        uniform float uTime; uniform float uAmp;
        varying float vN; varying vec3 vNormal; varying vec3 vView;
        void main(){
          float n = snoise(normal*1.25 + vec3(0., uTime*.35, uTime*.18));
          float n2 = snoise(normal*2.6 - vec3(uTime*.5));
          vN = n*.75 + n2*.25;
          vec3 p = position + normal * vN * uAmp;
          vec4 mv = modelViewMatrix * vec4(p,1.);
          vNormal = normalize(normalMatrix * normal);
          vView = normalize(-mv.xyz);
          gl_Position = projectionMatrix * mv;
        }`,
      fragmentShader: /* glsl */`
        uniform float uHeat; varying float vN; varying vec3 vNormal; varying vec3 vView;
        vec3 ramp(float t){
          vec3 c1=vec3(.31,.36,.84), c2=vec3(.59,.18,.75), c3=vec3(.84,.16,.46), c4=vec3(.98,.49,.12), c5=vec3(1.,.86,.46);
          t=clamp(t,0.,1.);
          if(t<.25) return mix(c1,c2,t/.25);
          if(t<.5) return mix(c2,c3,(t-.25)/.25);
          if(t<.75) return mix(c3,c4,(t-.5)/.25);
          return mix(c4,c5,(t-.75)/.25);
        }
        void main(){
          float fres = pow(1. - max(dot(vNormal, vView), 0.), 2.2);
          float t = vN*.5 + .5;
          vec3 col = ramp(t*.9 + .08 + uHeat*.15);
          col += vec3(1.,.85,.6) * smoothstep(.72,1.,t) * .6;
          col = mix(col*.55, col, smoothstep(-.2,.6,vN));
          col += ramp(.15 + fres*.6) * fres * 1.1;
          gl_FragColor = vec4(col, 1.);
        }`
    })
  );
  world.add(core);

  // soft glow halo
  const glowTex = (() => {
    const c = document.createElement('canvas'); c.width = c.height = 256;
    const g = c.getContext('2d'); const gr = g.createRadialGradient(128, 128, 0, 128, 128, 128);
    gr.addColorStop(0, 'rgba(250,126,30,.9)'); gr.addColorStop(.25, 'rgba(214,41,118,.55)'); gr.addColorStop(.55, 'rgba(150,47,191,.18)'); gr.addColorStop(1, 'rgba(79,91,213,0)');
    g.fillStyle = gr; g.fillRect(0, 0, 256, 256);
    const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t;
  })();
  const glow = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTex, blending: THREE.AdditiveBlending, depthWrite: false, transparent: true }));
  glow.scale.setScalar(6.5);
  world.add(glow);

  /* ---- photo ring ---- */
  const ring = new THREE.Group();
  ring.rotation.set(.32, 0, -.12);
  world.add(ring);
  const R = 3.3;
  const count = mobile ? 8 : 12; // four threads, the same number of photos on each
  const cardW = 1.05, cardH = 1.32;
  const geo = new THREE.PlaneGeometry(cardW, cardH, 20, 1);
  { // bend along the ring so cards sit on the cylinder
    const pos = geo.attributes.position;
    for (let i = 0; i < pos.count; i++) { const x = pos.getX(i); const a = x / R; pos.setX(i, Math.sin(a) * R); pos.setZ(i, Math.cos(a) * R - R); }
    geo.computeVertexNormals();
  }
  const cards = [];
  const manager = new THREE.LoadingManager();
  let loaded = 0;
  manager.onProgress = (_, l, t) => onLoad && onLoad(l / t);
  const loader = new THREE.TextureLoader(manager);
  for (let i = 0; i < count; i++) {
    const u = { map: { value: null }, uAspect: { value: 1 }, uFade: { value: 0 }, uHover: { value: 0 } };
    const mat = new THREE.ShaderMaterial({
      uniforms: u, transparent: true, side: THREE.DoubleSide, depthWrite: false,
      vertexShader: /* glsl */`varying vec2 vUv; void main(){ vUv=uv; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.); }`,
      fragmentShader: /* glsl */`
        uniform sampler2D map; uniform float uAspect; uniform float uFade; uniform float uHover; varying vec2 vUv;
        float rbox(vec2 p, vec2 b, float r){ vec2 q=abs(p)-b+r; return length(max(q,0.))+min(max(q.x,q.y),0.)-r; }
        void main(){
          vec2 p = vUv - .5;
          float d = rbox(p*vec2(${(cardW / cardH).toFixed(3)},1.), vec2(${(cardW / cardH / 2).toFixed(3)},.5), .07);
          float a = 1. - smoothstep(-.004, .002, d);
          float planeA = ${(cardW / cardH).toFixed(3)};
          vec2 uv = vUv - .5;
          if (uAspect > planeA) uv.x *= planeA / uAspect; else uv.y *= uAspect / planeA;
          vec3 col = texture2D(map, uv + .5).rgb;
          float edge = 1. - smoothstep(-.03, -.004, d);
          col = mix(vec3(1.,.85,.6), col, edge*(.92 - uHover*.5) + .08 + uHover*.5);
          col *= 1. + uHover*.18;
          if(!gl_FrontFacing) col *= .35;
          gl_FragColor = vec4(col, a * uFade);
        }`
    });
    const mesh = new THREE.Mesh(geo, mat);
    const holder = new THREE.Group();
    const ang = (i / count) * Math.PI * 2;
    holder.add(mesh);
    ring.add(holder);
    cards.push({ mesh, holder, u, ang, i, bob: Math.random() * Math.PI * 2, next: null, photo: null });
    loader.load(`assets/img/${mobile ? 's/' : ''}${PHOTOS[i % PHOTOS.length]}.webp`, (tex) => {
      tex.colorSpace = THREE.SRGBColorSpace; tex.anisotropy = 4;
      u.map.value = tex; u.uAspect.value = tex.image.width / tex.image.height;
      cards[i].photo = tex;
      loaded++;
    });
  }

  const orbits = [];

  /* ---- tap themes: every tap moves the photos onto a new path and swaps them for one service ---- */
  const en = () => document.documentElement.lang === 'en';
  const CW = 420, CH = 528;
  const BRAND = ['#feda75', '#fa7e1e', '#d62976', '#962fbf', '#4f5bd5'];
  const extra = {};
  ['ba-v-after', 'ba-c-after', 'ba-l-after', 'ba-v-before', 'ba-c-before', 'ba-l-before', 'analytics', 'dashboard'].forEach((k) => {
    const im = new Image(); im.src = `assets/img/${k}.webp`; extra[k] = im;
  });
  const cover = (g, im, x, y, w, h) => {
    if (!im || !im.width) { g.fillStyle = '#2a1838'; g.fillRect(x, y, w, h); return; }
    const r = Math.max(w / im.width, h / im.height), sw = w / r, sh = h / r;
    g.drawImage(im, (im.width - sw) / 2, (im.height - sh) / 2, sw, sh, x, y, w, h);
  };
  const rr = (g, x, y, w, h, r) => { g.beginPath(); g.roundRect(x, y, w, h, r); };
  const grad = (g, x0, y0, x1, y1) => { const gr = g.createLinearGradient(x0, y0, x1, y1); BRAND.forEach((c, i) => gr.addColorStop(i / 4, c)); return gr; };
  const font = (g, w, px) => { g.font = `${w} ${px}px Tajawal, "El Messiri", sans-serif`; g.textAlign = en() ? 'left' : 'right'; g.direction = en() ? 'ltr' : 'rtl'; };
  const tx = () => (en() ? 30 : CW - 30);
  const photoOf = (i) => cards[i % cards.length].photo?.image;
  function drawStudy(g, i) {
    { const bg = g.createLinearGradient(0, 0, 0, CH); bg.addColorStop(0, '#3a2150'); bg.addColorStop(1, '#1f1230'); g.fillStyle = bg; g.fillRect(0, 0, CW, CH); }
    const kind = i % 4;
    font(g, 700, 30); g.fillStyle = '#fff';
    g.fillText(en() ? ['Market share', 'Price map', 'Demand trend', 'Competitors'][kind] : ['حصة السوق', 'خريطة الأسعار', 'اتجاه الطلب', 'المنافسون'][kind], tx(), 62);
    font(g, 400, 20); g.fillStyle = '#b9a6cc';
    g.fillText(en() ? ['Riyadh · furniture', 'Sofas · SAR', 'Last 12 months', 'Reply speed'][kind] : ['الرياض · أثاث', 'الكنب · ريال', 'آخر 12 شهر', 'سرعة الرد'][kind], tx(), 96);
    if (kind === 0) {
      [.55, .8, .4, .95, .65].forEach((v, k) => { g.fillStyle = k === 3 ? grad(g, 0, 480, 0, 200) : 'rgba(255,255,255,.14)'; rr(g, 40 + k * 72, 470 - v * 300, 50, v * 300, 10); g.fill(); });
      font(g, 800, 34); g.fillStyle = '#feda75'; g.textAlign = 'center'; g.direction = 'ltr'; g.fillText('+38%', 40 + 3 * 72 + 25, 470 - .95 * 300 - 16);
    } else if (kind === 1) {
      for (let k = 0; k < 18; k++) { const x = 50 + (k * 97) % 320, y = 160 + (k * 61) % 280; g.fillStyle = k % 5 ? 'rgba(255,255,255,.25)' : BRAND[k % 5]; g.beginPath(); g.arc(x, y, k % 5 ? 7 : 12, 0, 7); g.fill(); }
      g.strokeStyle = '#fa7e1e'; g.lineWidth = 3; g.setLineDash([8, 8]); g.beginPath(); g.moveTo(40, 440); g.lineTo(380, 170); g.stroke(); g.setLineDash([]);
    } else if (kind === 2) {
      g.strokeStyle = grad(g, 40, 0, 380, 0); g.lineWidth = 7; g.lineJoin = 'round'; g.beginPath();
      [430, 400, 410, 360, 330, 340, 280, 250, 230, 200, 170, 150].forEach((y, k) => (k ? g.lineTo(40 + k * 31, y) : g.moveTo(40, y))); g.stroke();
      g.fillStyle = '#feda75'; g.beginPath(); g.arc(40 + 11 * 31, 150, 11, 0, 7); g.fill();
    } else {
      [['A', .9], ['B', .62], ['C', .45], [en() ? 'You' : 'أنت', 1]].forEach(([n, v], k) => {
        const y = 150 + k * 82; font(g, 700, 22); g.fillStyle = k === 3 ? '#feda75' : '#fff'; g.fillText(k === 3 ? n : (en() ? 'Rival ' : 'منافس ') + n, tx(), y);
        g.fillStyle = 'rgba(255,255,255,.1)'; rr(g, 30, y + 14, 360, 16, 8); g.fill();
        g.fillStyle = k === 3 ? grad(g, 30, 0, 390, 0) : 'rgba(255,255,255,.35)'; rr(g, en() ? 30 : 390 - 360 * v, y + 14, 360 * v, 16, 8); g.fill();
      });
    }
  }
  function drawAd(g, i) {
    g.fillStyle = '#fff'; g.fillRect(0, 0, CW, CH);
    cover(g, photoOf(i), 0, 70, CW, 330);
    g.fillStyle = grad(g, 0, 0, 60, 60); g.beginPath(); g.arc(en() ? 44 : CW - 44, 35, 20, 0, 7); g.fill();
    font(g, 700, 20); g.fillStyle = '#1a0f27'; g.fillText('your.showroom', en() ? 76 : CW - 76, 32);
    font(g, 400, 16); g.fillStyle = '#8a7a99'; g.fillText(en() ? 'Sponsored' : 'ممول', en() ? 76 : CW - 76, 54);
    g.fillStyle = grad(g, 0, 0, CW, 0); rr(g, 20, 418, CW - 40, 54, 14); g.fill();
    font(g, 800, 22); g.fillStyle = '#fff'; g.textAlign = 'center'; g.fillText(en() ? ['Book a visit', 'Shop now', 'Get the offer'][i % 3] : ['احجز زيارة', 'تسوّق الآن', 'اطلب العرض'][i % 3], CW / 2, 453);
    font(g, 400, 18); g.fillStyle = '#5a4b66'; g.direction = 'ltr'; g.textAlign = en() ? 'left' : 'right'; g.fillText(`♥ ${(1.2 + (i % 7) * .7).toFixed(1)}K   💬 ${40 + i * 13}`, tx(), 505);
  }
  function drawWeb(g, i) {
    g.fillStyle = '#f7f2ec'; g.fillRect(0, 0, CW, CH);
    g.fillStyle = '#e6ddd2'; g.fillRect(0, 0, CW, 40);
    ['#ff5f57', '#febc2e', '#28c840'].forEach((c, k) => { g.fillStyle = c; g.beginPath(); g.arc(22 + k * 20, 20, 6, 0, 7); g.fill(); });
    g.fillStyle = '#fff'; rr(g, 90, 10, 300, 20, 10); g.fill();
    cover(g, photoOf(i + 3), 0, 40, CW, 200);
    g.fillStyle = 'rgba(14,7,22,.45)'; g.fillRect(0, 40, CW, 200);
    font(g, 800, 30); g.fillStyle = '#fff'; g.fillText(en() ? 'Your home, finer' : 'بيتك يستاهل أحلى', tx(), 140);
    g.fillStyle = grad(g, 0, 0, 160, 0); rr(g, en() ? 30 : CW - 170, 165, 140, 40, 20); g.fill();
    font(g, 700, 18); g.fillStyle = '#fff'; g.textAlign = 'center'; g.fillText(en() ? 'Shop now' : 'تسوّق الآن', en() ? 100 : CW - 100, 191);
    [0, 1].forEach((k) => { const x = 20 + k * 200; g.fillStyle = '#fff'; rr(g, x, 260, 180, 240, 14); g.fill(); cover(g, photoOf(i + 5 + k), x + 10, 270, 160, 140);
      font(g, 700, 18); g.fillStyle = '#1a0f27'; g.textAlign = 'center'; g.fillText(en() ? 'Loft sofa' : 'كنبة لوفت', x + 90, 440); g.fillStyle = '#d62976'; g.direction = 'ltr'; g.fillText((4 + k * 2 + i % 3) + ',450 SAR', x + 90, 470); });
  }
  function drawAI(g, i) {
    const keys = ['ba-v-after', 'ba-c-after', 'ba-l-after', 'ba-v-before', 'ba-c-before', 'ba-l-before'];
    const before = i % 2 === 1, k = keys[(i >> 1) % 3 + (before ? 3 : 0)];
    cover(g, extra[k], 0, 0, CW, CH);
    g.fillStyle = before ? 'rgba(14,7,22,.7)' : grad(g, 0, 0, CW, 0); rr(g, en() ? 20 : CW - 170, 20, 150, 40, 20); g.fill();
    font(g, 800, 19); g.fillStyle = '#fff'; g.textAlign = 'center';
    g.fillText(before ? (en() ? 'Phone photo' : 'صورة جوال') : (en() ? '✦ AI scene' : '✦ مشهد AI'), en() ? 95 : CW - 95, 47);
  }
  const THEMES = [
    { key: 'feed', layout: 'ring' },
    { key: 'study', layout: 'wheel', draw: drawStudy },
    { key: 'ads', layout: 'helix', draw: drawAd },
    { key: 'web', layout: 'wave', draw: drawWeb },
    { key: 'ai', layout: 'infinity', draw: drawAI },
  ];
  const texCache = {};
  function themeTex(t, i) {
    const id = t.key + i + (en() ? 'e' : 'a');
    if (texCache[id]) return texCache[id];
    const c = document.createElement('canvas'); c.width = CW; c.height = CH;
    t.draw(c.getContext('2d'), i);
    const tex = new THREE.CanvasTexture(c); tex.colorSpace = THREE.SRGBColorSpace; tex.anisotropy = 4;
    return (texCache[id] = tex);
  }
  let theme = 0, layoutK = 0, pulse = 0, turn = 0;
  // build and upload every theme's cards ahead of time, one per idle slot, so a tap never stalls a frame
  const idle = window.requestIdleCallback || ((f) => setTimeout(f, 60));
  function prebuild() {
    const jobs = [];
    THEMES.forEach((T) => T.draw && cards.forEach((_, i) => jobs.push([T, i])));
    const next = () => { const j = jobs.shift(); if (!j) return; renderer.initTexture(themeTex(j[0], j[1])); idle(next); };
    idle(next);
  }
  manager.onLoad = () => Promise.all(Object.values(extra).map((im) => im.decode?.().catch(() => {}))).then(() => setTimeout(prebuild, 1500));
  function setTheme(n) {
    theme = n;
    const T = THEMES[n];
    cards.forEach((c, i) => {
      const tex = T.draw ? themeTex(T, i) : c.photo;
      if (tex) c.next = tex;
    });
    pulse = 1; layoutK = 0;
  }
  // card placement on each path, in the ring's space: [x, y, z, rotY, scale]
  const out = new THREE.Vector4();
  /* ---- four threads: every photo is strung on one of them and travels along it ---- */
  const THREADS = 4, perThread = count / THREADS;
  // point on thread j of a layout at a ∈ [0, 2π), in the ring's space: [x, y, z] (+ rotY for the card)
  function thread(name, j, a, t, spread) {
    const o = j - (THREADS - 1) / 2; // -1.5 … 1.5
    switch (name) {
      case 'wheel': { // four upright wheels side by side: photos roll top to bottom ("lengthwise")
        const r = R * .56; return out.set(o * (mobile ? 1.02 : 1.3), Math.sin(a) * r, Math.cos(a) * r - .6, 0); }
      case 'helix': { // four meridians of a globe, each turned 45° from the last
        const r = R * .82, f = (j / THREADS) * Math.PI; return out.set(Math.sin(a) * r * Math.cos(f), Math.cos(a) * r * 1.05, Math.sin(a) * r * Math.sin(f), f + (Math.sin(a) < 0 ? Math.PI : 0)); }
      case 'wave': { // four flat ribbons stacked like rows of a website
        const w = mobile ? 1.9 : 2.9; return out.set(Math.sin(a) * w, -o * 1.18 + Math.sin(a * 2 + t * 1.2 + j) * .14, Math.cos(a) * .9 - 1.1, Math.sin(a) * -.25); }
      case 'infinity': { // four nested infinity loops
        const k = .72 + j * .12; return out.set(Math.sin(a) * R * k, Math.sin(a) * Math.cos(a) * R * .85 * k + o * .12, Math.cos(a) * R * .42, Math.sin(a) * .3); }
      default: { // four stacked rings around the core, like the feed going round
        const r = R * (.82 + j * .09) * spread; return out.set(Math.sin(a) * r, o * .55 + Math.sin(a * 2 + t * .6 + j) * .08, Math.cos(a) * r, a); }
    }
  }
  const SCALE = { ring: .82, wheel: .74, helix: .7, wave: .7, infinity: .72 };
  function place(name, c, n, t, spread) {
    const j = c.i % THREADS, slot = Math.floor(c.i / THREADS), dir = j % 2 ? -1 : 1;
    const a = (slot / perThread) * Math.PI * 2 + j * .7 + dir * turn;
    thread(name, j, a, t, spread);
    return name === 'ring' ? SCALE.ring / Math.max(.85, spread * .92) : SCALE[name];
  }
  // the threads themselves: glowing lines that morph with the layout, drawn under the photos
  const SEG = 180, threadCol = ['#feda75', '#fa7e1e', '#d62976', '#4f5bd5'];
  const threads = threadCol.map((col) => {
    const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.BufferAttribute(new Float32Array((SEG + 1) * 3), 3));
    const line = new THREE.Line(g, new THREE.LineBasicMaterial({ color: col, transparent: true, opacity: .6, blending: THREE.AdditiveBlending, depthWrite: false }));
    line.renderOrder = -1; line.frustumCulled = false; ring.add(line);
    return { line, pos: g.attributes.position, ready: false };
  });
  function drawThreads(name, t, spread, e) {
    threads.forEach((th, j) => {
      const arr = th.pos.array;
      for (let k = 0; k <= SEG; k++) {
        thread(name, j, (k / SEG) * Math.PI * 2, t, spread);
        const q = k * 3;
        if (!th.ready) { arr[q] = out.x; arr[q + 1] = out.y; arr[q + 2] = out.z; }
        else { arr[q] += (out.x - arr[q]) * e; arr[q + 1] += (out.y - arr[q + 1]) * e; arr[q + 2] += (out.z - arr[q + 2]) * e; }
      }
      th.ready = true; th.pos.needsUpdate = true;
      th.line.material.opacity = .62 + pulse * .35;
    });
  }

  /* ---- embers ---- */
  const N = mobile ? 420 : 1300;
  const pg = new THREE.BufferGeometry();
  const pos = new Float32Array(N * 3), seed = new Float32Array(N), col = new Float32Array(N * 3);
  const palette = ['#feda75', '#fa7e1e', '#d62976', '#962fbf', '#4f5bd5'].map((c) => new THREE.Color(c));
  for (let i = 0; i < N; i++) {
    const r = 1.6 + Math.random() * 5.5, a = Math.random() * Math.PI * 2;
    pos[i * 3] = Math.cos(a) * r; pos[i * 3 + 1] = (Math.random() - .5) * 9; pos[i * 3 + 2] = Math.sin(a) * r - 1;
    seed[i] = Math.random();
    const c = palette[(Math.random() * palette.length) | 0]; col[i * 3] = c.r; col[i * 3 + 1] = c.g; col[i * 3 + 2] = c.b;
  }
  pg.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  pg.setAttribute('aSeed', new THREE.BufferAttribute(seed, 1));
  pg.setAttribute('color', new THREE.BufferAttribute(col, 3));
  const pU = { uTime: { value: 0 }, uPx: { value: renderer.getPixelRatio() } };
  const embers = new THREE.Points(pg, new THREE.ShaderMaterial({
    uniforms: pU, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, vertexColors: true,
    vertexShader: /* glsl */`
      uniform float uTime; uniform float uPx; attribute float aSeed; varying vec3 vC; varying float vA;
      void main(){
        vec3 p = position;
        p.y = mod(p.y + uTime*(.25 + aSeed*.45) + 4.5, 9.) - 4.5;
        p.x += sin(uTime*.6 + aSeed*20.)*.25;
        vec4 mv = modelViewMatrix*vec4(p,1.);
        gl_Position = projectionMatrix*mv;
        gl_PointSize = (2. + aSeed*5.) * uPx * (6. / -mv.z);
        vC = color; vA = smoothstep(4.5,2.5,abs(p.y)) * (.35 + aSeed*.65);
      }`,
    fragmentShader: /* glsl */`
      varying vec3 vC; varying float vA;
      void main(){ float d = length(gl_PointCoord-.5); float a = smoothstep(.5,0.,d); gl_FragColor = vec4(vC, a*a*vA); }`
  }));
  world.add(embers);

  /* ---- layout + interaction ---- */
  let base = { x: 0, y: 0, s: 1 };
  function resize() {
    const w = canvas.clientWidth, h = canvas.clientHeight;
    renderer.setSize(w, h, false);
    camera.aspect = w / h; camera.updateProjectionMatrix();
    if (w > 960) base = { x: (document.dir === "ltr" ? -1 : 1) * (-3.3 * Math.min(1, w / 1440) - .5), y: -.1, s: .88 };
    else base = { x: 0, y: 2.35, s: .7 };
  }
  resize();
  addEventListener('resize', resize);

  const mouse = { x: 0, y: 0, tx: 0, ty: 0 };
  addEventListener('pointermove', (e) => { mouse.tx = e.clientX / innerWidth - .5; mouse.ty = e.clientY / innerHeight - .5; }, { passive: true });

  const ray = new THREE.Raycaster(), ndc = new THREE.Vector2(9, 9);
  let hovered = null;
  if (!mobile) canvas.parentElement.addEventListener('pointermove', (e) => {
    const r = canvas.getBoundingClientRect();
    ndc.set(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1);
  }, { passive: true });

  // adaptive quality: if the first ~2 s run slow, drop resolution and half the embers
  let samples = 0, acc = 0, degraded = false;

  let progress = 0, lastP = 0, spin = 0, visible = true, running = true;
  new IntersectionObserver(([e]) => { visible = e.isIntersecting; }, { rootMargin: '100px' }).observe(canvas);
  document.addEventListener('visibilitychange', () => { running = !document.hidden; });

  const clock = new THREE.Clock();
  let t = 0;
  function frame() {
    requestAnimationFrame(frame);
    const dt = Math.min(clock.getDelta(), .05);
    if (!visible || !running) return;
    t += reduced ? 0 : dt;
    mouse.x += (mouse.tx - mouse.x) * .05; mouse.y += (mouse.ty - mouse.y) * .05;
    const p = progress;
    spin += (p - lastP) * 6; lastP = p; spin *= .92;
    if (!degraded && !reduced) {
      acc += dt; samples++;
      if (samples === 120) {
        if (acc / samples > 1 / 42) { degraded = true; renderer.setPixelRatio(1); pU.uPx.value = 1; embers.geometry.setDrawRange(0, N / 2); resize(); }
        samples = 0; acc = 0;
      }
    }
    coreU.uTime.value = t; coreU.uHeat.value = p;
    coreU.uAmp.value = .14 + Math.sin(t * .8) * .025 + p * .08;
    pU.uTime.value = t;
    core.scale.setScalar(1 + p * .25);
    core.rotation.y = t * .15;
    glow.material.opacity = .85 + Math.sin(t * 1.3) * .1;
    turn += dt * .12 + spin * .04;
    const L = THEMES[theme].layout;
    ring.rotation.x += ((L === 'ring' ? .32 - p * .25 : .06) - ring.rotation.x) * .06;
    ring.rotation.y = 0;
    pulse *= .95; layoutK = Math.min(1, layoutK + dt * .9);
    const spread = 1 + p * .38;
    orbits.forEach((o, i) => {
      const a = t * o.speed + i * 2; o.dot.position.set(Math.cos(a) * o.r, Math.sin(a) * o.r, 0); o.m.rotation.y = t * .1 * (i % 2 ? -1 : 1);
      o.m.material.opacity = .55 + pulse * .4; o.dot.scale.setScalar(1 + pulse * 2);
    });
    coreU.uAmp.value += pulse * .2;
    if (!mobile) {
      ray.setFromCamera(ndc, camera);
      const hit = ray.intersectObjects(cards.map((c) => c.mesh))[0];
      hovered = hit ? hit.object : null;
      canvas.parentElement.style.cursor = hovered ? 'grab' : '';
    }
    drawThreads(L, t, spread, 1 - Math.exp(-dt * (2.2 + layoutK * 5)));
    cards.forEach((c) => {
      c.u.uHover.value += ((c.mesh === hovered ? 1 : 0) - c.u.uHover.value) * .12;
      const sc = place(L, c, cards.length, t, spread);
      // ease towards the new path (a little faster as the morph settles)
      const e = 1 - Math.exp(-dt * (2.2 + layoutK * 5));
      c.mesh.position.x += (out.x - c.mesh.position.x) * e; c.mesh.position.y += (out.y - c.mesh.position.y) * e; c.mesh.position.z += (out.z - c.mesh.position.z) * e;
      let dr = out.w - c.mesh.rotation.y; dr = Math.atan2(Math.sin(dr), Math.cos(dr)); c.mesh.rotation.y += dr * e;
      c.cs = (c.cs ?? sc) + (sc - (c.cs ?? sc)) * e;
      c.mesh.scale.setScalar(c.cs * (1 + c.u.uHover.value * .14));
      // swap the picture while it is faded out
      if (c.next) { c.u.uFade.value *= Math.exp(-dt * 12); if (c.u.uFade.value < .04) { c.u.map.value = c.next; c.u.uAspect.value = c.next.image.width / c.next.image.height; c.next = null; } }
      else c.u.uFade.value += ((c.u.map.value ? 1 : 0) - c.u.uFade.value) * (1 - Math.exp(-dt * 5));
    });
    world.position.x = base.x * (1 - p * .55);
    world.position.y = base.y + p * .6;
    world.scale.setScalar(base.s);
    camera.position.x = mouse.x * 1.2;
    camera.position.y = -mouse.y * .8;
    camera.position.z = 10 - p * 2.6;
    camera.lookAt(world.position.x * .3, world.position.y * .3, 0);
    renderer.render(scene, camera);
  }
  frame();

  return {
    setProgress(v) { progress = v; },
    // each tap: a new path for the photos and a new set of pictures for one service
    tap() { setTheme((theme + 1) % THEMES.length); spin += .6; return theme; },
  };
}
