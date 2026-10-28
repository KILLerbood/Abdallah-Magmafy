// Loader: a volcano under a night sky. Lava climbs down its slopes as the page loads, a tap makes it
// spit lava, and when everything is ready it erupts and a ring of molten lava opens up to reveal the site.
// Plain 2D canvas (no WebGL) so it is up before the 3D scenes have even started loading.
export function initVolcano(root, { reduced = false } = {}) {
  const cv = root.querySelector('canvas'), ctx = cv.getContext('2d');
  const dpr = Math.min(devicePixelRatio || 1, 1.5);
  let W = 0, H = 0, V = null;
  let progress = 0, shown = 0, heat = 0, shake = 0, t = 0, raf = 0, last = performance.now();
  let reveal = -1, onRevealDone = null;
  const blobs = [], smoke = [], stars = [];

  // a soft glowing dot, pre-rendered once and stamped for every blob and ember
  const glow = document.createElement('canvas'); glow.width = glow.height = 64;
  { const g = glow.getContext('2d'), gr = g.createRadialGradient(32, 32, 0, 32, 32, 32);
    gr.addColorStop(0, 'rgba(255,240,200,1)'); gr.addColorStop(.25, 'rgba(254,170,70,.95)'); gr.addColorStop(.55, 'rgba(214,41,118,.35)'); gr.addColorStop(1, 'rgba(214,41,118,0)');
    g.fillStyle = gr; g.fillRect(0, 0, 64, 64); }

  let seed = 9; const rnd = () => ((seed = (seed * 16807) % 2147483647) - 1) / 2147483646;

  function layout() {
    W = innerWidth; H = innerHeight; cv.width = W * dpr; cv.height = H * dpr;
    seed = 9;
    const base = W < 700 ? W * 1.35 : Math.min(W * .95, 980), h = Math.min(H * .4, 360, base * .5);
    const cx = W / 2, by = H + 4, ty = by - h, crater = base * .11;
    // irregular cone outline: left slope, crater lip, right slope
    const left = [], right = [];
    for (let i = 0; i <= 10; i++) {
      const k = i / 10, e = Math.pow(k, 1.35);
      left.push([cx - crater - (base / 2 - crater) * e + (rnd() - .5) * 10, ty + h * k + (rnd() - .5) * 6]);
      right.push([cx + crater + (base / 2 - crater) * e + (rnd() - .5) * 10, ty + h * k + (rnd() - .5) * 6]);
    }
    // three lava streams that wind down the slopes
    const streams = [-.62, .08, .7].map((side) => {
      const pts = []; let x = cx + side * crater * .9, y = ty + 4;
      for (let i = 0; i <= 24; i++) {
        const k = i / 24; pts.push([x, y]);
        y += h / 24; x += side * (base / 2 - crater) / 24 * (.55 + Math.abs(side) * .5) + (rnd() - .5) * 14;
      }
      return { pts, w: 5 + rnd() * 4, delay: rnd() * .25 };
    });
    const ridges = [0, 1].map((n) => { const pts = []; for (let x = -20; x <= W + 40; x += 40) pts.push([x, H - h * (.45 + n * .2) - Math.sin(x * .004 + n * 2) * 40 - rnd() * 22]); return pts; });
    V = { cx, ty, h, base, crater, left, right, streams, ridges };
    stars.length = 0;
    for (let i = 0; i < Math.round(W * H / 9000); i++) stars.push([rnd() * W, rnd() * H * .7, rnd() * 1.4 + .3, rnd() * 6]);
  }
  layout(); addEventListener('resize', layout);

  function spit(n, power = 1) {
    for (let i = 0; i < n; i++) {
      const a = -Math.PI / 2 + (rnd() - .5) * 1.1;
      const sp = (260 + rnd() * 380) * power * Math.min(1, H / 700 + .3);
      blobs.push({ x: V.cx + (rnd() - .5) * V.crater, y: V.ty + 6, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp, r: 3 + rnd() * 7 * power, life: 0, max: 1.4 + rnd() * 1.4 });
    }
  }

  // tap the volcano (or anywhere on the loader) to make it erupt a little
  root.addEventListener('pointerdown', () => { if (reveal >= 0) return; spit(26, .9); shake = .35; heat = Math.min(1.4, heat + .35); root.classList.add('is-played'); });

  function path(pts) { ctx.beginPath(); ctx.moveTo(pts[0][0], pts[0][1]); for (const p of pts) ctx.lineTo(p[0], p[1]); }

  function draw(dt) {
    const { cx, ty, h, crater } = V;
    shown += (progress - shown) * Math.min(1, dt * 4);
    heat += ((.35 + shown * .65) - heat) * Math.min(1, dt * 1.5);
    shake = Math.max(0, shake - dt);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    if (shake) ctx.translate((Math.random() - .5) * 10 * shake, (Math.random() - .5) * 10 * shake);

    // sky with a glow that grows with the heat of the volcano
    const sky = ctx.createLinearGradient(0, 0, 0, H);
    sky.addColorStop(0, '#0b0612'); sky.addColorStop(.55, '#1a0f27'); sky.addColorStop(1, `rgba(${90 + heat * 60 | 0},20,${60 + heat * 20 | 0},1)`);
    ctx.fillStyle = sky; ctx.fillRect(-20, -20, W + 40, H + 40);
    for (const s of stars) { ctx.globalAlpha = .35 + .35 * Math.sin(t * 1.5 + s[3]); ctx.fillStyle = '#fff'; ctx.fillRect(s[0], s[1], s[2], s[2]); }
    ctx.globalAlpha = 1;
    const halo = ctx.createRadialGradient(cx, ty, 0, cx, ty, h * 1.6);
    halo.addColorStop(0, `rgba(250,126,30,${.32 * heat})`); halo.addColorStop(.4, `rgba(214,41,118,${.18 * heat})`); halo.addColorStop(1, 'rgba(79,91,213,0)');
    ctx.fillStyle = halo; ctx.fillRect(0, 0, W, H);

    // far hills
    V.ridges.forEach((r, n) => { ctx.fillStyle = n ? '#170c22' : '#120a1b'; path(r); ctx.lineTo(W + 40, H); ctx.lineTo(-20, H); ctx.closePath(); ctx.fill(); });

    // smoke from the crater
    if (smoke.length < 26 && Math.random() < dt * 9) smoke.push({ x: cx + (Math.random() - .5) * crater, y: ty, r: crater * .5, a: .22, vx: (Math.random() - .3) * 14 });
    for (let i = smoke.length - 1; i >= 0; i--) {
      const s = smoke[i]; s.y -= dt * 34; s.x += s.vx * dt; s.r += dt * 26; s.a -= dt * .045;
      if (s.a <= 0) { smoke.splice(i, 1); continue; }
      ctx.fillStyle = `rgba(120,90,140,${s.a * .5})`; ctx.beginPath(); ctx.arc(s.x, s.y, s.r, 0, 7); ctx.fill();
    }

    // the cone
    const cone = ctx.createLinearGradient(0, ty, 0, H);
    cone.addColorStop(0, '#2b1530'); cone.addColorStop(1, '#0f0815');
    ctx.fillStyle = cone;
    ctx.beginPath(); ctx.moveTo(V.left[V.left.length - 1][0], H + 10);
    for (let i = V.left.length - 1; i >= 0; i--) ctx.lineTo(V.left[i][0], V.left[i][1]);
    ctx.quadraticCurveTo(cx, ty + 14, V.right[0][0], V.right[0][1]);
    for (const p of V.right) ctx.lineTo(p[0], p[1]);
    ctx.lineTo(V.right[V.right.length - 1][0], H + 10); ctx.closePath(); ctx.fill();
    // rim light from the lava
    ctx.strokeStyle = `rgba(250,126,30,${.25 + heat * .35})`; ctx.lineWidth = 2;
    path(V.left.slice(0, 5)); ctx.stroke(); path(V.right.slice(0, 5)); ctx.stroke();

    // crater pool
    const pool = ctx.createRadialGradient(cx, ty + 4, 0, cx, ty + 4, crater * 1.4);
    pool.addColorStop(0, '#fff1c4'); pool.addColorStop(.3, '#feb04a'); pool.addColorStop(.7, `rgba(214,41,118,${.6 + heat * .3})`); pool.addColorStop(1, 'rgba(214,41,118,0)');
    ctx.fillStyle = pool; ctx.beginPath(); ctx.ellipse(cx, ty + 6, crater * (1.05 + Math.sin(t * 3) * .03), 12 + heat * 6, 0, 0, 7); ctx.fill();

    // lava streams grow with loading progress
    ctx.lineCap = ctx.lineJoin = 'round';
    for (const s of V.streams) {
      const k = Math.max(0, Math.min(1, (shown - s.delay) / (1 - s.delay)));
      const n = Math.max(1, Math.floor(k * (s.pts.length - 1)));
      if (k <= 0) continue;
      const pts = s.pts.slice(0, n + 1);
      ctx.globalCompositeOperation = 'lighter';
      ctx.strokeStyle = 'rgba(214,41,118,.35)'; ctx.lineWidth = s.w * 3.2; path(pts); ctx.stroke();
      ctx.globalCompositeOperation = 'source-over';
      const lg = ctx.createLinearGradient(0, ty, 0, ty + h);
      lg.addColorStop(0, '#ffe39a'); lg.addColorStop(.5, '#fa7e1e'); lg.addColorStop(1, '#d62976');
      ctx.strokeStyle = lg; ctx.lineWidth = s.w; path(pts); ctx.stroke();
      const tip = pts[pts.length - 1];
      ctx.globalCompositeOperation = 'lighter'; ctx.drawImage(glow, tip[0] - 14, tip[1] - 14, 28, 28); ctx.globalCompositeOperation = 'source-over';
    }

    // embers and lava blobs
    if (reveal < 0 && Math.random() < dt * (2 + shown * 10)) spit(1, .45);
    ctx.globalCompositeOperation = 'lighter';
    for (let i = blobs.length - 1; i >= 0; i--) {
      const b = blobs[i]; b.life += dt;
      if (b.life > b.max || b.y > H + 40) { blobs.splice(i, 1); continue; }
      b.vy += 520 * dt; b.x += b.vx * dt; b.y += b.vy * dt;
      const s = b.r * 4 * (1 - b.life / b.max * .5);
      ctx.globalAlpha = 1 - b.life / b.max * .6;
      ctx.drawImage(glow, b.x - s / 2, b.y - s / 2, s, s);
    }
    ctx.globalAlpha = 1; ctx.globalCompositeOperation = 'source-over';

    // the reveal: a molten ring opens from the crater and cuts through the loader
    if (reveal >= 0) {
      reveal += dt / 1.05;
      const e = reveal < 1 ? 1 - Math.pow(1 - reveal, 3) : 1;
      const R = e * Math.hypot(W, H) * 1.05;
      const ring = (r) => { ctx.beginPath(); for (let a = 0; a <= 64; a++) { const th = a / 64 * Math.PI * 2, w = r + Math.sin(th * 7 + t * 6) * 10 + Math.sin(th * 3 - t * 4) * 14; ctx.lineTo(cx + Math.cos(th) * w, ty + Math.sin(th) * w); } ctx.closePath(); };
      ctx.globalCompositeOperation = 'destination-out'; ring(R); ctx.fill();
      ctx.globalCompositeOperation = 'source-over';
      const rg = ctx.createRadialGradient(cx, ty, Math.max(0, R - 6), cx, ty, R + 46);
      rg.addColorStop(0, 'rgba(255,240,200,.95)'); rg.addColorStop(.25, 'rgba(250,126,30,.9)'); rg.addColorStop(.6, 'rgba(214,41,118,.55)'); rg.addColorStop(1, 'rgba(150,47,191,0)');
      ctx.strokeStyle = rg; ctx.lineWidth = 46; ring(R + 20); ctx.stroke();
      if (reveal >= 1) { cancelAnimationFrame(raf); onRevealDone && onRevealDone(); return false; }
    }
    return true;
  }

  function loop(now) {
    const dt = Math.min(.05, (now - last) / 1000); last = now; t += dt;
    if (draw(dt) !== false) raf = requestAnimationFrame(loop);
  }
  if (!reduced) raf = requestAnimationFrame(loop);

  return {
    set(v) { progress = Math.max(progress, Math.min(1, v)); },
    // big eruption, then the lava ring reveals the page; onReveal fires as the ring starts to open
    finish(onReveal, onDone) {
      if (reduced) { onReveal && onReveal(); onDone && onDone(); return; }
      progress = 1; heat = 1.6; shake = .8; spit(innerWidth < 700 ? 50 : 90, 1.35);
      root.classList.add('is-erupting');
      setTimeout(() => { reveal = 0; onRevealDone = onDone; onReveal && onReveal(); }, 550);
    },
  };
}
