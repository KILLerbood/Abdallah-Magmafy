// Site-wide 3D backdrop: a silk "magma wave" of glowing strands that lives behind every section.
// Scrolling carries the wave around the screen (it sweeps from top to bottom and back, tilting as it
// goes); each time it crosses the header it lights up the Magmafy wordmark and the Book button, and at
// the end of the page it settles behind the booking form and the footer wordmark and burns brighter.
import * as THREE from 'three';

export function initBackdrop() {
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const mobile = matchMedia('(max-width: 960px)').matches;
  const canvas = document.createElement('canvas');
  canvas.className = 'bg3d'; canvas.setAttribute('aria-hidden', 'true');
  document.body.prepend(canvas);

  let renderer;
  try { renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: !mobile, powerPreference: 'low-power' }); }
  catch (err) { canvas.remove(); return; }
  renderer.setPixelRatio(Math.min(devicePixelRatio, mobile ? 1 : 1.5));
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(45, 1, .1, 50);
  camera.position.set(0, 0, 8);

  /* the wave: S strands x P points, all motion done in the vertex shader */
  const S = mobile ? 22 : 40, P = mobile ? 120 : 200;
  const u = {
    uTime: { value: 0 }, uY: { value: 0 }, uTilt: { value: 0 }, uHalfW: { value: 6 }, uGlow: { value: .6 },
    uAmp: { value: .7 }, uSpread: { value: .9 },
  };
  const vert = /* glsl */`
    uniform float uTime, uY, uTilt, uHalfW, uAmp, uSpread;
    attribute float aU; attribute float aS;
    varying float vU; varying float vS; varying float vDepth;
    void main(){
      float x = (aU*2.-1.) * uHalfW * 1.25;
      float k = aS - .5;
      float w = sin(aU*6.2 + uTime*.55 + aS*1.7) * uAmp + sin(aU*13. - uTime*.8 + aS*4.) * uAmp*.25;
      float y = w + k * uSpread * (1. + .6*sin(aU*3.1 + uTime*.3));
      float z = cos(aU*5. + uTime*.4 + aS*3.) * 1.2 * (k + .2);
      // tilt the whole band, then move it to its scroll position
      float c = cos(uTilt), s = sin(uTilt);
      vec3 p = vec3(x*c - y*s, x*s + y*c + uY, z);
      vU = aU; vS = aS; vDepth = z;
      vec4 mv = modelViewMatrix * vec4(p, 1.);
      gl_Position = projectionMatrix * mv;
      gl_PointSize = (1.5 + 2.5*fract(aS*31.7 + aU*17.3)) * (8. / -mv.z);
    }`;
  const frag = (points) => /* glsl */`
    uniform float uTime, uGlow; varying float vU; varying float vS; varying float vDepth;
    vec3 ramp(float t){
      vec3 a=vec3(.31,.36,.84), b=vec3(.59,.18,.75), c=vec3(.84,.16,.46), d=vec3(.98,.49,.12), e=vec3(1.,.86,.46);
      t=clamp(t,0.,1.);
      if(t<.25) return mix(a,b,t/.25); if(t<.5) return mix(b,c,(t-.25)/.25); if(t<.75) return mix(c,d,(t-.5)/.25); return mix(d,e,(t-.75)/.25);
    }
    void main(){
      ${points ? 'float r = length(gl_PointCoord-.5); if (r > .5) discard; float soft = smoothstep(.5, 0., r);' : 'float soft = 1.;'}
      float edge = smoothstep(0., .12, vU) * smoothstep(1., .88, vU);
      float pulse = exp(-pow((fract(vU*.5 - uTime*.09) - .5) * 9., 2.));
      float mid = 1. - abs(vS - .5) * 1.4;
      vec3 col = ramp(vU*.85 + .1 + vDepth*.05);
      float a = edge * mid * (${points ? '.55' : '.16'} + pulse * .5) * uGlow * soft;
      gl_FragColor = vec4(col * (1. + pulse*.8), a);
    }`;
  const geo = new THREE.BufferGeometry();
  const aU = new Float32Array(S * P), aS = new Float32Array(S * P), idx = [];
  for (let s = 0; s < S; s++) for (let p = 0; p < P; p++) {
    const i = s * P + p; aU[i] = p / (P - 1); aS[i] = s / (S - 1);
    if (p < P - 1) idx.push(i, i + 1);
  }
  geo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(S * P * 3), 3));
  geo.setAttribute('aU', new THREE.BufferAttribute(aU, 1));
  geo.setAttribute('aS', new THREE.BufferAttribute(aS, 1));
  const lineGeo = geo.clone(); lineGeo.setIndex(idx);
  const common = { uniforms: u, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending };
  const lines = new THREE.LineSegments(lineGeo, new THREE.ShaderMaterial({ ...common, vertexShader: vert, fragmentShader: frag(false) }));
  const dots = new THREE.Points(geo, new THREE.ShaderMaterial({ ...common, vertexShader: vert, fragmentShader: frag(true) }));
  lines.frustumCulled = dots.frustumCulled = false;
  scene.add(lines, dots);

  let halfH = 3;
  function resize() {
    renderer.setSize(innerWidth, innerHeight, false);
    camera.aspect = innerWidth / innerHeight; camera.updateProjectionMatrix();
    halfH = Math.tan(THREE.MathUtils.degToRad(camera.fov / 2)) * camera.position.z;
    u.uHalfW.value = halfH * camera.aspect;
  }
  resize(); addEventListener('resize', resize);

  /* things the wave lights up */
  const topLit = [...document.querySelectorAll('.logo, .header__cta, .fab')];
  const endLit = [...document.querySelectorAll('#book-submit, .footer__made, .pword, .footer__big')];
  let topOn = false, endOn = false;
  const setLit = (els, on) => els.forEach((el) => el.classList.toggle('wave-lit', on));

  const cycles = 3.5; // top → bottom → top … ends at the bottom
  let y = halfH * .78, tilt = 0, glow = .6, t = 0, run = !document.hidden;
  document.addEventListener('visibilitychange', () => { run = !document.hidden; });
  const hero = document.querySelector('.hero');
  const clock = new THREE.Clock();
  function frame() {
    requestAnimationFrame(frame);
    const dt = Math.min(clock.getDelta(), .05);
    if (!run) return;
    // the hero has its own 3D scene: skip the backdrop while the hero fills the screen
    if (hero && scrollY < hero.offsetHeight - innerHeight * 1.05) return;
    if (!reduced) t += dt;
    const max = Math.max(1, document.documentElement.scrollHeight - innerHeight);
    const p = Math.min(1, scrollY / max), ph = p * cycles * Math.PI * 2;
    const ty = Math.cos(ph) * halfH * .78, tt = Math.sin(ph) * .32 * (mobile ? .6 : 1);
    const end = THREE.MathUtils.smoothstep(p, .86, .99);
    const tg = (mobile ? .5 : .6) + end * 1.1 + Math.max(0, Math.cos(ph) - .9) * 4;
    y += (ty * (1 - end) + (-halfH * .55) * end - y) * .08;
    tilt += (tt * (1 - end) - tilt) * .08;
    glow += (tg - glow) * .06;
    u.uTime.value = t; u.uY.value = y; u.uTilt.value = tilt; u.uGlow.value = glow;
    u.uAmp.value = .55 + end * .35; u.uSpread.value = (mobile ? .7 : .95) + end * .5;
    const nearTop = y > halfH * .62 && p > .02;
    if (nearTop !== topOn) setLit(topLit, topOn = nearTop);
    const atEnd = end > .5;
    if (atEnd !== endOn) setLit(endLit, endOn = atEnd);
    renderer.render(scene, camera);
  }
  frame();
}
