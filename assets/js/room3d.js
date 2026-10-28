// A small furnished living room built in code (no photos), so a product model sits *inside* a real
// lit space: oak floor, panelled wall with a window, rug, framed art, side table, floor lamp and a tree.
// buildRoom() returns { group, setMode(mode) } where mode is 'day' or 'night'. Units are metres; the
// product stands at the origin facing +z and the back wall is at z = -WALL.
import * as THREE from 'three';

const WALL = 2.15;

function canvasTex(w, h, draw, srgb = true) {
  const c = document.createElement('canvas'); c.width = w; c.height = h;
  draw(c.getContext('2d'), w, h);
  const t = new THREE.CanvasTexture(c);
  if (srgb) t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 8;
  return t;
}

// seeded random so the room looks the same on every load
function rng(seed) { return () => ((seed = (seed * 16807) % 2147483647) - 1) / 2147483646; }

function woodTex() {
  const r = rng(7);
  return canvasTex(1024, 1024, (g, w, h) => {
    const rows = 8, ph = h / rows;
    for (let y = 0; y < rows; y++) {
      let x = -r() * 600;
      while (x < w) {
        const len = 380 + r() * 520, l = 40 + r() * 12, hue = 30 + r() * 6;
        g.fillStyle = `hsl(${hue} ${38 + r() * 10}% ${l}%)`; g.fillRect(x, y * ph, len, ph);
        // grain
        for (let k = 0; k < 26; k++) {
          const gy = y * ph + r() * ph, a = .05 + r() * .09;
          g.strokeStyle = `rgba(${r() < .5 ? '70,40,20' : '255,235,200'},${a})`; g.lineWidth = .6 + r() * 1.4;
          g.beginPath(); g.moveTo(x, gy);
          for (let s = 0; s <= len; s += 40) g.lineTo(x + s, gy + Math.sin(s * .012 + k) * (1 + r() * 2.5));
          g.stroke();
        }
        g.fillStyle = 'rgba(40,22,10,.55)'; g.fillRect(x, y * ph, 2, ph);
        x += len;
      }
      g.fillStyle = 'rgba(40,22,10,.5)'; g.fillRect(0, y * ph, w, 2);
    }
  });
}

function rugTex() {
  return canvasTex(1024, 704, (g, w, h) => {
    g.fillStyle = '#ddcdb6'; g.fillRect(0, 0, w, h);
    const r = rng(3);
    for (let i = 0; i < 9000; i++) { g.fillStyle = `rgba(${r() < .5 ? '120,90,60' : '255,250,240'},${r() * .08})`; g.fillRect(r() * w, r() * h, 2, 2); }
    g.strokeStyle = '#b4613f'; g.lineWidth = 10; g.strokeRect(34, 34, w - 68, h - 68);
    g.strokeStyle = '#3a2a35'; g.lineWidth = 3; g.strokeRect(58, 58, w - 116, h - 116);
    g.fillStyle = 'rgba(180,97,63,.85)';
    for (let x = 90; x < w - 80; x += 64) { g.beginPath(); g.moveTo(x, 80); g.lineTo(x + 16, 96); g.lineTo(x, 112); g.lineTo(x - 16, 96); g.fill(); g.beginPath(); g.moveTo(x, h - 80); g.lineTo(x + 16, h - 96); g.lineTo(x, h - 112); g.lineTo(x - 16, h - 96); g.fill(); }
    g.strokeStyle = 'rgba(58,42,53,.55)'; g.lineWidth = 4;
    for (let k = 0; k < 3; k++) { g.beginPath(); g.ellipse(w / 2, h / 2, 120 + k * 70, 70 + k * 44, 0, 0, 7); g.stroke(); }
  });
}

function artTex() {
  return canvasTex(640, 800, (g, w, h) => {
    g.fillStyle = '#efe5d6'; g.fillRect(0, 0, w, h);
    const arch = (x, y, rw, rh, c) => { g.fillStyle = c; g.beginPath(); g.moveTo(x - rw, y + rh); g.lineTo(x - rw, y); g.arc(x, y, rw, Math.PI, 0); g.lineTo(x + rw, y + rh); g.fill(); };
    arch(w * .42, h * .42, w * .26, h * .5, '#d9a07c');
    arch(w * .6, h * .55, w * .2, h * .4, '#962fbf55');
    g.fillStyle = '#2f2236'; g.beginPath(); g.arc(w * .68, h * .26, w * .09, 0, 7); g.fill();
    g.fillStyle = '#b4613f'; g.fillRect(w * .12, h * .86, w * .76, h * .025);
  });
}

function roughTex() {
  // subtle plaster variation used as a roughness map for walls
  const r = rng(11);
  return canvasTex(256, 256, (g, w, h) => { g.fillStyle = '#d8d8d8'; g.fillRect(0, 0, w, h); for (let i = 0; i < 3000; i++) { const v = 190 + r() * 60 | 0; g.fillStyle = `rgb(${v},${v},${v})`; g.fillRect(r() * w, r() * h, 3, 3); } }, false);
}

export function buildRoom({ mobile = false } = {}) {
  const group = new THREE.Group();
  const std = (o) => new THREE.MeshStandardMaterial(o);
  const add = (geo, mat, x, y, z, { cast = true, recv = true, parent = group } = {}) => {
    const m = new THREE.Mesh(geo, mat); m.position.set(x, y, z); m.castShadow = cast; m.receiveShadow = recv; parent.add(m); return m;
  };

  /* floor */
  const wood = woodTex(); wood.wrapS = wood.wrapT = THREE.RepeatWrapping; wood.repeat.set(6, 4.3);
  const floor = add(new THREE.PlaneGeometry(12, 8), std({ map: wood, roughness: .48, metalness: 0, envMapIntensity: .7 }), 0, 0, 1.5, { cast: false });
  floor.rotation.x = -Math.PI / 2;

  /* back wall with a window opening, built from boxes so the window throws light on the floor */
  const plaster = roughTex(); plaster.wrapS = plaster.wrapT = THREE.RepeatWrapping; plaster.repeat.set(4, 2);
  const wallMat = std({ color: '#e9dfd2', roughness: .95, roughnessMap: plaster });
  const H = 4.6, T = .12, wx0 = -2.75, wx1 = -1.55, wy0 = .55, wy1 = 2.6, z = -WALL - T / 2;
  const box = (x0, x1, y0, y1) => add(new THREE.BoxGeometry(x1 - x0, y1 - y0, T), wallMat, (x0 + x1) / 2, (y0 + y1) / 2, z);
  box(-6, wx0, 0, H); box(wx1, 6, 0, H); box(wx0, wx1, 0, wy0); box(wx0, wx1, wy1, H);
  // window frame, mullions and the sky behind
  const frameMat = std({ color: '#2b2420', roughness: .5, metalness: .3 });
  const ww = wx1 - wx0, wh = wy1 - wy0, wcx = (wx0 + wx1) / 2, wcy = (wy0 + wy1) / 2;
  [[ww + .08, .05, wcx, wy0], [ww + .08, .05, wcx, wy1], [.05, wh, wx0, wcy], [.05, wh, wx1, wcy], [.035, wh, wcx, wcy], [ww, .035, wcx, wy0 + wh * .62]]
    .forEach(([w, h, x, y]) => add(new THREE.BoxGeometry(w, h, .07), frameMat, x, y, -WALL + .01));
  add(new THREE.BoxGeometry(ww + .2, .04, .22), frameMat, wcx, wy0 - .02, -WALL + .06); // sill
  const skyMat = new THREE.MeshBasicMaterial({ color: '#fff4e2' });
  add(new THREE.PlaneGeometry(ww + .2, wh + .2), skyMat, wcx, wcy, -WALL - .45, { cast: false, recv: false });
  // sheer curtain beside the window
  const curtainMat = std({ color: '#f3ece2', roughness: 1, transparent: true, opacity: .82, side: THREE.DoubleSide });
  const cg = new THREE.PlaneGeometry(.55, 2.7, 24, 1), cp = cg.attributes.position;
  for (let i = 0; i < cp.count; i++) cp.setZ(i, Math.sin(cp.getX(i) * 34) * .035);
  cg.computeVertexNormals();
  add(cg, curtainMat, wx1 + .32, 1.38, -WALL + .09);

  /* panel mouldings, baseboard */
  const trim = std({ color: '#efe7dc', roughness: .8 });
  add(new THREE.BoxGeometry(12, .12, .025), trim, 0, .06, -WALL + .012);
  const panel = (x0, x1, y0, y1) => {
    const t = .04;
    [[x1 - x0, t, (x0 + x1) / 2, y0], [x1 - x0, t, (x0 + x1) / 2, y1], [t, y1 - y0, x0, (y0 + y1) / 2], [t, y1 - y0, x1, (y0 + y1) / 2]]
      .forEach(([w, h, x, y]) => add(new THREE.BoxGeometry(w, h, .02), trim, x, y, -WALL + .014, { cast: false, recv: false }));
  };
  panel(-1.3, 1.3, .4, 2.75); panel(1.55, 2.95, .4, 2.75); panel(3.2, 4.6, .4, 2.75);

  /* framed art above the sofa */
  const art = new THREE.Group(); art.position.set(0, 1.78, -WALL + .03); group.add(art);
  add(new THREE.BoxGeometry(.78, .96, .035), std({ color: '#b48a4d', metalness: .8, roughness: .35 }), 0, 0, 0, { parent: art });
  add(new THREE.PlaneGeometry(.7, .88), std({ map: artTex(), roughness: .9 }), 0, 0, .019, { parent: art, cast: false });

  /* rug */
  add(new THREE.BoxGeometry(3.3, .012, 2.25), std({ map: rugTex(), roughness: 1 }), 0, .006, .35, { cast: false });

  /* side table with books and a vase (left) */
  const gold = std({ color: '#c99a5b', metalness: 1, roughness: .3 });
  const marble = std({ color: '#f1ece6', roughness: .25 });
  add(new THREE.CylinderGeometry(.27, .27, .03, 48), marble, -1.62, .56, -.55);
  add(new THREE.CylinderGeometry(.02, .02, .55, 12), gold, -1.62, .28, -.55);
  add(new THREE.CylinderGeometry(.18, .2, .015, 40), gold, -1.62, .008, -.55);
  add(new THREE.BoxGeometry(.24, .035, .17), std({ color: '#2f3b4a', roughness: .8 }), -1.66, .593, -.55);
  add(new THREE.BoxGeometry(.21, .03, .15), std({ color: '#c7a27a', roughness: .8 }), -1.65, .625, -.55).rotation.y = .3;
  const vase = add(new THREE.LatheGeometry([[0, 0], [.05, 0], [.07, .06], [.05, .16], [.03, .2], [.035, .22]].map(([x, y]) => new THREE.Vector2(x, y)), 32), std({ color: '#b4613f', roughness: .6 }), -1.52, .575, -.48);
  vase.material.side = THREE.DoubleSide;

  /* floor lamp (right) */
  const lamp = new THREE.Group(); lamp.position.set(1.85, 0, -1.25); group.add(lamp);
  const black = std({ color: '#141212', roughness: .4, metalness: .6 });
  add(new THREE.CylinderGeometry(.16, .17, .03, 40), black, 0, .015, 0, { parent: lamp });
  add(new THREE.CylinderGeometry(.012, .012, 1.42, 10), black, 0, .73, 0, { parent: lamp });
  const shadeMat = std({ color: '#f2e6d3', roughness: 1, side: THREE.DoubleSide, emissive: '#ffb070', emissiveIntensity: 0 });
  add(new THREE.CylinderGeometry(.16, .24, .3, 40, 1, true), shadeMat, 0, 1.5, 0, { parent: lamp, cast: false });
  const bulb = new THREE.PointLight('#ffb36b', 0, 7, 1.6); bulb.position.set(0, 1.42, 0); lamp.add(bulb);
  bulb.castShadow = true; bulb.shadow.mapSize.set(mobile ? 512 : 1024, mobile ? 512 : 1024); bulb.shadow.bias = -.002; bulb.shadow.radius = 6;

  /* olive tree in a pot (far right) */
  const tree = new THREE.Group(); tree.position.set(2.55, 0, -1.45); group.add(tree);
  add(new THREE.CylinderGeometry(.2, .16, .42, 36), std({ color: '#d9cdbd', roughness: .9 }), 0, .21, 0, { parent: tree });
  const trunk = std({ color: '#5a4636', roughness: 1 });
  [[0, .9, 0, .03, 1, .15], [.1, 1.25, .02, .018, .5, -.5], [-.08, 1.3, 0, .016, .5, .55]].forEach(([x, y, zz, r, h, rz]) => { add(new THREE.CylinderGeometry(r * .7, r, h, 8), trunk, x, y, zz, { parent: tree }).rotation.z = rz; });
  const leafGeo = new THREE.SphereGeometry(1, 6, 4); leafGeo.scale(.05, .012, .02);
  const leaves = new THREE.InstancedMesh(leafGeo, std({ color: '#5d6b45', roughness: .7, side: THREE.DoubleSide }), mobile ? 260 : 520);
  leaves.castShadow = true;
  const r = rng(5), m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), e = new THREE.Euler();
  for (let i = 0; i < leaves.count; i++) {
    const cl = [[.15, 1.55, 0], [-.18, 1.6, .05], [0, 1.85, -.03], [.05, 1.4, .12]][i % 4];
    const v = new THREE.Vector3(r() - .5, r() - .5, r() - .5).normalize().multiplyScalar(.08 + r() * .2);
    q.setFromEuler(e.set(r() * 3, r() * 6.3, r() * 3));
    m4.compose(new THREE.Vector3(cl[0] + v.x * 1.3, cl[1] + v.y, cl[2] + v.z), q, new THREE.Vector3(1, 1, 1).multiplyScalar(.8 + r() * .5));
    leaves.setMatrixAt(i, m4);
    leaves.setColorAt(i, new THREE.Color().setHSL(.22 + r() * .05, .2 + r() * .15, .26 + r() * .14));
  }
  tree.add(leaves);

  /* lights owned by the room */
  const sun = new THREE.DirectionalLight('#ffe2b8', 0);
  sun.position.set(wcx - 1.2, 3.6, -WALL - 4.5); sun.target.position.set(.2, 0, .6);
  sun.castShadow = true; sun.shadow.mapSize.set(mobile ? 1024 : 2048, mobile ? 1024 : 2048);
  Object.assign(sun.shadow.camera, { left: -4, right: 4, top: 4, bottom: -4, near: .5, far: 14 });
  sun.shadow.bias = -.0005; sun.shadow.radius = 3;
  group.add(sun, sun.target);
  const fill = new THREE.HemisphereLight('#fff6ea', '#7a5a40', 0); group.add(fill);
  const front = new THREE.DirectionalLight('#ffe6c8', 0); front.position.set(1.5, 2.4, 5); group.add(front);
  const glow = new THREE.SpotLight('#ff9a5c', 0, 6, .7, .9, 1.5); glow.position.set(0, 2.9, -WALL + .4); glow.target.position.set(0, 1.6, -WALL); group.add(glow, glow.target);

  const MODES = {
    day: { sun: 4.2, front: 1.2, fill: .55, sky: '#fff4e2', bulb: 0, shade: 0, glow: 0, env: .5, exposure: .9, bg: '#d9cfc2' },
    night: { sun: 0, front: .35, fill: .1, sky: '#1d2340', bulb: 7, shade: 1.6, glow: 2, env: .12, exposure: 1.0, bg: '#201a1c' },
  };
  function setMode(mode) {
    const M = MODES[mode] || MODES.day;
    sun.intensity = M.sun; front.intensity = M.front; fill.intensity = M.fill; skyMat.color.set(M.sky);
    bulb.intensity = M.bulb; shadeMat.emissiveIntensity = M.shade; glow.intensity = M.glow;
    return M;
  }
  setMode('day');
  return { group, setMode, MODES };
}
