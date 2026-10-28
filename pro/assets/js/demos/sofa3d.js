// 3D sofa configurator: a real scanned-product model (velvet sofa, glTF with material variants),
// lit with a studio environment on a soft shadow. Drag to turn it, pick fabric / legs. Renders only while on screen.
import * as THREE from '../../vendor/three.module.min.js';
import { GLTFLoader } from '../../vendor/GLTFLoader.js';
import { RoomEnvironment } from '../../vendor/RoomEnvironment.js';
import { buildRoom } from './room3d.js';

// v = glTF variant index; tint = extra colour made from the grey velvet
export const FABRICS = [
  { name: 'مخمل شامبين', en: 'Champagne velvet', c: '#d6bf98', v: 0 },
  { name: 'مخمل وردي', en: 'Blush velvet', c: '#d9a3a6', v: 4 },
  { name: 'مخمل كحلي', en: 'Navy velvet', c: '#25335c', v: 1 },
  { name: 'مخمل رمادي', en: 'Grey velvet', c: '#8d8c86', v: 2 },
  { name: 'مخمل زيتوني', en: 'Olive velvet', c: '#5d6a35', v: 2, tint: ['#262c10', '#8f9a55'] },
  { name: 'مخمل تيراكوتا', en: 'Terracotta velvet', c: '#b4613f', v: 2, tint: ['#3d160a', '#e08a62'] },
  { name: 'مخمل أسود', en: 'Black velvet', c: '#1b1b1d', v: 3 },
];
export const LEGS = [
  { name: 'أسود بأطراف ذهبية', en: 'Black, brass tips', leg: ['#050505', 0, .4], foot: ['#ffccb3', 1, .3] },
  { name: 'ذهبي بالكامل', en: 'All brass', leg: ['#e8b77a', 1, .28], foot: ['#e8b77a', 1, .28] },
  { name: 'خشب جوز', en: 'Walnut wood', leg: ['#4a2c17', 0, .6], foot: ['#4a2c17', 0, .6] },
];

export function initSofa(canvas, { onLoad } = {}) {
  const mobile = matchMedia('(max-width: 960px)').matches;
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(devicePixelRatio, mobile ? 1.5 : 2));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.1;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(30, 1, .1, 60);
  const pmrem = new THREE.PMREMGenerator(renderer);
  scene.environment = pmrem.fromScene(new RoomEnvironment(), .04).texture;
  scene.environmentIntensity = .9;

  const key = new THREE.DirectionalLight('#fff3e6', 2.4);
  key.position.set(2.5, 5, 3.5); key.castShadow = true;
  key.shadow.mapSize.set(mobile ? 1024 : 2048, mobile ? 1024 : 2048);
  Object.assign(key.shadow.camera, { left: -3, right: 3, top: 3, bottom: -3 });
  key.shadow.radius = 8; key.shadow.bias = -.0004;
  scene.add(key);
  const rim = new THREE.DirectionalLight('#f3b6dc', 1); rim.position.set(-4, 2.5, -3); scene.add(rim);

  const floor = new THREE.Mesh(new THREE.PlaneGeometry(20, 20), new THREE.ShadowMaterial({ opacity: .28 }));
  floor.rotation.x = -Math.PI / 2; floor.receiveShadow = true; scene.add(floor);

  // the furnished room (day / evening); 'studio' hides it and keeps the soft shadow floor
  const room = buildRoom({ mobile }); room.group.visible = false; scene.add(room.group);
  const view = { studio: null, room: null }, camTo = new THREE.Vector3(), lookTo = new THREE.Vector3(), look = new THREE.Vector3();
  let mode = 'studio';

  const pivot = new THREE.Group(); scene.add(pivot);
  let fabricMesh = null, variants = [], legMat = null, footMat = null, pop = 1;
  const tinted = new Map();

  new GLTFLoader().load(new URL('../../models/sofa.glb', import.meta.url).href, async (gltf) => {
    const model = gltf.scene;
    model.traverse((o) => {
      if (!o.isMesh) return;
      o.castShadow = o.receiveShadow = true;
      if (o.material.name.endsWith('_legs')) legMat = o.material;
      if (o.material.name.endsWith('_feet')) footMat = o.material;
      const ext = o.userData.gltfExtensions?.KHR_materials_variants;
      if (ext) fabricMesh = o, variants = ext.mappings;
    });
    model.children.filter((c) => c.isLight).forEach((l) => l.removeFromParent());
    // centre on the floor and frame it
    const box = new THREE.Box3().setFromObject(model), size = box.getSize(new THREE.Vector3()), c = box.getCenter(new THREE.Vector3());
    model.position.set(-c.x, -box.min.y, -c.z);
    pivot.add(model);
    const fit = size.x / 2.1;
    room.group.scale.setScalar(size.x / 2.18);
    view.studio = [new THREE.Vector3(0, size.y * 1.15 + .25 * fit, 4.6 * fit), new THREE.Vector3(0, size.y * .42, 0)];
    view.room = [new THREE.Vector3(.45 * fit, size.y * 1.25 + .2 * fit, 6.9 * fit), new THREE.Vector3(0, size.y * .95, -.6 * fit)];
    api.setRoom(mode, true);
    // preload every variant material so switching is instant
    const mats = await Promise.all(variants.map((m) => gltf.parser.getDependency('material', m.material)));
    variants.forEach((m, i) => { m.mat = mats[i]; });
    api.setFabric(cur.f); api.setLegs(cur.l);
    onLoad && onLoad();
  }, undefined, (err) => { console.warn(err); onLoad && onLoad(err); });

  /* drag to rotate with inertia */
  let rotY = -.45, vel = 0, dragging = false, lastX = 0, idle = 0, touched = false;
  const stage = canvas.parentElement;
  stage.addEventListener('pointerdown', (e) => { if (e.target.closest('button')) return; dragging = true; lastX = e.clientX; vel = 0; touched = true; stage.setPointerCapture(e.pointerId); stage.querySelector('.cfg__hint')?.style.setProperty('opacity', '0'); });
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
  const clock = new THREE.Clock();
  (function frame() {
    requestAnimationFrame(frame);
    const dt = Math.min(clock.getDelta(), .05);
    if (!visible || document.hidden) return;
    if (!dragging) { vel *= .94; rotY += vel; idle += dt; if (mode === 'studio' && (idle > 2.5 || !touched)) rotY += dt * .22; else if (mode !== 'studio' && !touched) rotY += (-.18 - rotY) * .05; }
    pivot.rotation.y = rotY;
    if (view.room) { camera.position.lerp(camTo, .07); look.lerp(lookTo, .07); camera.lookAt(look); }
    pop += (1 - pop) * .12;
    pivot.scale.setScalar(pop);
    renderer.render(scene, camera);
  })();

  const setMat = (m, [c, metal, rough]) => { if (!m) return; m.color.set(c); m.metalness = metal; m.roughness = rough; m.needsUpdate = true; };
  const cur = { f: 0, l: 0 };
  const api = {
    setFabric(i) {
      cur.f = i;
      const f = FABRICS[i], base = variants.find((m) => m.variants.includes(f.v))?.mat;
      if (!fabricMesh || !base) return;
      let mat = base;
      if (f.tint) {
        if (!tinted.has(i)) { const t = base.clone(); t.color.set(f.tint[0]); t.sheenColor.set(f.tint[1]); tinted.set(i, t); }
        mat = tinted.get(i);
      }
      fabricMesh.material = mat; pop = .97;
    },
    // studio = clean backdrop; day / night = the sofa standing in a real lit living room
    setRoom(m, snap = false) {
      mode = m;
      const inRoom = m !== 'studio';
      room.group.visible = inRoom; floor.visible = !inRoom; key.visible = rim.visible = !inRoom;
      const M = inRoom ? room.setMode(m) : null;
      scene.background = inRoom ? new THREE.Color(M.bg) : null;
      scene.environmentIntensity = inRoom ? M.env : .9;
      renderer.toneMappingExposure = inRoom ? M.exposure : 1.1;
      const v = view[inRoom ? 'room' : 'studio'];
      if (v) { camTo.copy(v[0]); lookTo.copy(v[1]); if (snap) { camera.position.copy(camTo); look.copy(lookTo); camera.lookAt(look); } }
    },
    setLegs(i) { cur.l = i; setMat(legMat, LEGS[i].leg); setMat(footMat, LEGS[i].foot); },
  };
  return api;
}
