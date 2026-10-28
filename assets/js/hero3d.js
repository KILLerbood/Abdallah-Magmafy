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
  const count = mobile ? 9 : PHOTOS.length;
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
    const u = { map: { value: null }, uAspect: { value: 1 }, uFade: { value: 0 }, uTime: { value: 0 } };
    const mat = new THREE.ShaderMaterial({
      uniforms: u, transparent: true, side: THREE.DoubleSide, depthWrite: false,
      vertexShader: /* glsl */`varying vec2 vUv; void main(){ vUv=uv; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.); }`,
      fragmentShader: /* glsl */`
        uniform sampler2D map; uniform float uAspect; uniform float uFade; varying vec2 vUv;
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
          col = mix(vec3(1.,.85,.6), col, edge*.92 + .08);
          if(!gl_FrontFacing) col *= .35;
          gl_FragColor = vec4(col, a * uFade);
        }`
    });
    const mesh = new THREE.Mesh(geo, mat);
    const holder = new THREE.Group();
    const ang = (i / count) * Math.PI * 2;
    holder.rotation.y = ang;
    mesh.position.z = R;
    holder.add(mesh);
    ring.add(holder);
    cards.push({ mesh, holder, u, ang, bob: Math.random() * Math.PI * 2 });
    loader.load(`assets/img/${PHOTOS[i % PHOTOS.length]}.jpg`, (tex) => {
      tex.colorSpace = THREE.SRGBColorSpace; tex.anisotropy = 4;
      u.map.value = tex; u.uAspect.value = tex.image.width / tex.image.height;
      loaded++;
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
    if (w > 960) base = { x: -3.3 * Math.min(1, w / 1440) - .5, y: -.1, s: .88 };
    else base = { x: 0, y: 2.35, s: .7 };
  }
  resize();
  addEventListener('resize', resize);

  const mouse = { x: 0, y: 0, tx: 0, ty: 0 };
  addEventListener('pointermove', (e) => { mouse.tx = e.clientX / innerWidth - .5; mouse.ty = e.clientY / innerHeight - .5; }, { passive: true });

  let progress = 0, visible = true, running = true;
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
    coreU.uTime.value = t; coreU.uHeat.value = p;
    coreU.uAmp.value = .14 + Math.sin(t * .8) * .025 + p * .08;
    pU.uTime.value = t;
    core.scale.setScalar(1 + p * .25);
    core.rotation.y = t * .15;
    glow.material.opacity = .85 + Math.sin(t * 1.3) * .1;
    ring.rotation.y = t * .12 + p * Math.PI * .9;
    ring.rotation.x = .32 - p * .25;
    const spread = 1 + p * .38;
    cards.forEach((c) => {
      c.mesh.position.z = R * spread;
      c.mesh.position.y = Math.sin(t * .9 + c.bob) * .12;
      c.mesh.scale.setScalar(1 / Math.max(.85, spread * .92));
      c.u.uFade.value += ((c.u.map.value ? 1 : 0) - c.u.uFade.value) * .05;
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

  return { setProgress(v) { progress = v; } };
}
