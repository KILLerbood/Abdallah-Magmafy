// 3D sofa configurator: a procedural sofa (rounded boxes + tapered legs) on a soft shadow.
// Drag to turn it, pick fabric / legs / size; price updates. Renders only while on screen.
import * as THREE from 'three';

export const FABRICS = [
  { name: 'مخمل زيتوني', c: '#4d5a2e', sheen: 1, add: 0 },
  { name: 'مخمل وردي', c: '#c76b7e', sheen: 1, add: 0 },
  { name: 'كتان رملي', c: '#cdb89a', sheen: .25, add: -350 },
  { name: 'بوكليه أبيض', c: '#ece6dc', sheen: .2, add: 450 },
  { name: 'مخمل كحلي', c: '#26325e', sheen: 1, add: 0 },
  { name: 'جلد كونياك', c: '#8a4b24', sheen: 0, add: 1600, leather: true },
];
export const LEGS = [
  { name: 'خشب جوز', c: '#5b3b22', metal: 0, rough: .55, add: 0 },
  { name: 'معدن ذهبي', c: '#c9a25a', metal: 1, rough: .28, add: 380 },
  { name: 'أسود مطفي', c: '#1b1b1b', metal: .2, rough: .7, add: 120 },
];
export const SIZES = [{ name: 'مقعدين', seats: 2, price: 5950 }, { name: '3 مقاعد', seats: 3, price: 7450 }, { name: '4 مقاعد', seats: 4, price: 8990 }];

function roundedBox(w, h, d, r, s = 6) {
  const g = new THREE.BoxGeometry(w, h, d, s, s, s);
  const p = g.attributes.position, v = new THREE.Vector3(), inner = new THREE.Vector3();
  const hw = w / 2 - r, hh = h / 2 - r, hd = d / 2 - r;
  for (let i = 0; i < p.count; i++) {
    v.fromBufferAttribute(p, i);
    inner.set(THREE.MathUtils.clamp(v.x, -hw, hw), THREE.MathUtils.clamp(v.y, -hh, hh), THREE.MathUtils.clamp(v.z, -hd, hd));
    v.sub(inner).normalize().multiplyScalar(r).add(inner);
    p.setXYZ(i, v.x, v.y, v.z);
  }
  g.computeVertexNormals();
  return g;
}

export function initSofa(canvas) {
  const mobile = matchMedia('(max-width: 960px)').matches;
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(devicePixelRatio, mobile ? 1.5 : 2));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.05;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(32, 1, .1, 60);
  camera.position.set(0, 1.6, 7.4);

  // simple studio environment for reflections
  const pmrem = new THREE.PMREMGenerator(renderer);
  const envScene = new THREE.Scene();
  envScene.add(new THREE.Mesh(new THREE.SphereGeometry(10, 32, 16), new THREE.MeshBasicMaterial({ color: '#d8c9ba', side: THREE.BackSide })));
  const panel = new THREE.Mesh(new THREE.PlaneGeometry(6, 3), new THREE.MeshBasicMaterial({ color: '#ffffff' }));
  panel.position.set(0, 6, 2); panel.lookAt(0, 0, 0); envScene.add(panel);
  const warm = new THREE.Mesh(new THREE.PlaneGeometry(4, 4), new THREE.MeshBasicMaterial({ color: '#ffb36b' }));
  warm.position.set(-7, 2, 2); warm.lookAt(0, 0, 0); envScene.add(warm);
  scene.environment = pmrem.fromScene(envScene, .04).texture;

  scene.add(new THREE.HemisphereLight('#fff6ee', '#8a6f5a', .6));
  const key = new THREE.DirectionalLight('#fff3e6', 2.2);
  key.position.set(3, 6, 4); key.castShadow = true;
  key.shadow.mapSize.set(mobile ? 1024 : 2048, mobile ? 1024 : 2048);
  key.shadow.camera.left = -4; key.shadow.camera.right = 4; key.shadow.camera.top = 4; key.shadow.camera.bottom = -4;
  key.shadow.radius = 6; key.shadow.bias = -.0004;
  scene.add(key);
  const rim = new THREE.DirectionalLight('#f0a6d8', .8); rim.position.set(-4, 3, -4); scene.add(rim);

  const floor = new THREE.Mesh(new THREE.PlaneGeometry(20, 20), new THREE.ShadowMaterial({ opacity: .22 }));
  floor.rotation.x = -Math.PI / 2; floor.receiveShadow = true; scene.add(floor);

  const fabric = new THREE.MeshPhysicalMaterial({ color: FABRICS[0].c, roughness: .82, sheen: 1, sheenRoughness: .45, sheenColor: new THREE.Color('#ffffff') });
  const legMat = new THREE.MeshStandardMaterial({ color: LEGS[0].c, roughness: LEGS[0].rough, metalness: LEGS[0].metal });
  const pillowMat = new THREE.MeshPhysicalMaterial({ color: '#f1e7da', roughness: .9, sheen: .5 });

  const pivot = new THREE.Group(); scene.add(pivot);
  let sofa = null;
  const fabricColor = new THREE.Color(FABRICS[0].c);

  function build(seats) {
    if (sofa) { pivot.remove(sofa); sofa.traverse((o) => o.geometry && o.geometry.dispose()); }
    sofa = new THREE.Group();
    const seatW = .82, armW = .26, depth = 1.02, W = seats * seatW + armW * 2;
    const add = (geo, mat, x, y, z, rx = 0) => { const m = new THREE.Mesh(geo, mat); m.position.set(x, y, z); m.rotation.x = rx; m.castShadow = true; m.receiveShadow = true; sofa.add(m); return m; };
    add(roundedBox(W, .28, depth, .06), fabric, 0, .38, 0); // base
    add(roundedBox(W, .66, .24, .08), fabric, 0, .72, -depth / 2 + .12); // back frame
    for (const s of [-1, 1]) add(roundedBox(armW, .52, depth, .1), fabric, s * (W / 2 - armW / 2), .58, 0); // arms
    const inner = seats * seatW;
    for (let i = 0; i < seats; i++) {
      const x = -inner / 2 + seatW * (i + .5);
      add(roundedBox(seatW - .03, .2, depth - .26, .08, 8), fabric, x, .62, .1); // seat cushion
      add(roundedBox(seatW - .05, .5, .2, .1, 8), fabric, x, .93, -depth / 2 + .32, -.16); // back cushion
    }
    // throw pillows
    for (const s of [-1, 1]) { const p = add(roundedBox(.42, .42, .14, .07, 8), pillowMat, s * (inner / 2 - .32), .92, -.12, -.25); p.rotation.z = s * .12; }
    // tapered legs
    const legGeo = new THREE.CylinderGeometry(.035, .022, .24, 16);
    for (const sx of [-1, 1]) for (const sz of [-1, 1]) {
      const l = add(legGeo, legMat, sx * (W / 2 - .12), .12, sz * (depth / 2 - .1));
      l.rotation.z = sx * .12; l.rotation.x = -sz * .1;
    }
    pivot.add(sofa);
    const fit = Math.max(1, W / 3.2);
    camera.position.set(0, 1.55 * fit, 7.2 * fit);
    camera.lookAt(0, .55, 0);
  }
  build(3);

  /* drag to rotate with inertia */
  let rotY = -.5, vel = 0, dragging = false, lastX = 0, idle = 0, touched = false;
  const stage = canvas.parentElement;
  stage.addEventListener('pointerdown', (e) => { dragging = true; lastX = e.clientX; vel = 0; touched = true; stage.setPointerCapture(e.pointerId); stage.querySelector('.cfg__hint')?.style.setProperty('opacity', '0'); });
  stage.addEventListener('pointermove', (e) => { if (!dragging) return; const dx = e.clientX - lastX; lastX = e.clientX; vel = dx * .008; rotY += vel; });
  const end = () => { dragging = false; idle = 0; };
  stage.addEventListener('pointerup', end); stage.addEventListener('pointercancel', end);

  function resize() {
    const w = stage.clientWidth, h = stage.clientHeight;
    renderer.setSize(w, h, false); camera.aspect = w / h; camera.updateProjectionMatrix();
  }
  resize(); addEventListener('resize', resize);

  let visible = false;
  new IntersectionObserver(([e]) => { visible = e.isIntersecting; }, { rootMargin: '150px' }).observe(stage);
  let pop = 1;
  const clock = new THREE.Clock();
  (function frame() {
    requestAnimationFrame(frame);
    const dt = Math.min(clock.getDelta(), .05);
    if (!visible || document.hidden) return;
    if (!dragging) { vel *= .94; rotY += vel; idle += dt; if (idle > 2.5 || !touched) rotY += dt * .25; }
    pivot.rotation.y = rotY;
    fabric.color.lerp(fabricColor, .12);
    pop += (1 - pop) * .12;
    pivot.scale.setScalar(pop);
    renderer.render(scene, camera);
  })();

  return {
    setFabric(i) { const f = FABRICS[i]; fabricColor.set(f.c); fabric.sheen = f.sheen; fabric.roughness = f.leather ? .42 : .82; fabric.clearcoat = f.leather ? .35 : 0; pop = .97; },
    setLegs(i) { const l = LEGS[i]; legMat.color.set(l.c); legMat.metalness = l.metal; legMat.roughness = l.rough; },
    setSize(i) { build(SIZES[i].seats); pop = .9; },
  };
}
