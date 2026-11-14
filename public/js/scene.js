// Cena 3D: partículas que se formam em esculturas diferentes a cada seção
// + um nó de vidro físico (transmissão, iridescência) que nasce no topo.
import * as THREE from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';

const canvas = document.getElementById('gl');
const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
const small = innerWidth < 760;

let renderer;
try {
  renderer = new THREE.WebGLRenderer({ canvas, antialias: !small, powerPreference: 'high-performance' });
} catch (e) {
  document.documentElement.classList.add('no-gl');
  throw e;
}
renderer.setPixelRatio(Math.min(devicePixelRatio, small ? 1.5 : 2));
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 0.85;
renderer.setClearColor(0x07070a, 1);

const scene = new THREE.Scene();
const pmrem = new THREE.PMREMGenerator(renderer);
scene.environment = pmrem.fromScene(new RoomEnvironment(renderer), 0.04).texture;

const camera = new THREE.PerspectiveCamera(38, 1, 0.1, 200);
camera.position.set(0, 0, 11);

const world = new THREE.Group();
scene.add(world);

// ---------- luzes coloridas (refletem no vidro) ----------
const lime = new THREE.PointLight(0xc8ff3d, 40, 30);
const violet = new THREE.PointLight(0x8a6bff, 60, 30);
scene.add(lime, violet);

// ---------- nó de vidro ----------
const KR = 1.15, TR = 0.38;
const glass = new THREE.Mesh(
  new THREE.TorusKnotGeometry(KR, TR, small ? 200 : 360, small ? 32 : 64),
  new THREE.MeshPhysicalMaterial({
    color: 0xffffff, metalness: 0, roughness: 0.06,
    transmission: 1, thickness: 1.4, ior: 1.45,
    iridescence: 1, iridescenceIOR: 1.35, iridescenceThicknessRange: [120, 480],
    clearcoat: 1, clearcoatRoughness: 0.05, envMapIntensity: 1.6,
    attenuationColor: new THREE.Color(0xd9ffe0), attenuationDistance: 3,
  })
);
glass.scale.setScalar(0.0001);
world.add(glass);

// ---------- partículas ----------
const N = small ? 7000 : 16000;
const rnd = (a = 1) => (Math.random() * 2 - 1) * a;
const shapes = [];

// 0 — casca de partículas em volta do nó de vidro
shapes[0] = make(i => {
  if (i % 6 === 0) return sphereShell(3 + Math.random() * 4);
  const u = Math.random() * Math.PI * 4; // p = 2
  const c = knot(u), c2 = knot(u + 0.01);
  const T = c2.clone().sub(c).normalize();
  const A = new THREE.Vector3(rnd(), rnd(), rnd()).cross(T).normalize();
  return c.add(A.multiplyScalar(TR * (1.08 + Math.random() * 0.5)));
});
// 1 — cérebro (dois hemisférios com dobras)
shapes[1] = make(() => {
  const v = new THREE.Vector3(rnd(), rnd(), rnd()).normalize();
  const f = 1 + 0.13 * Math.sin(v.x * 11) * Math.sin(v.y * 9) * Math.sin(v.z * 10);
  v.multiply(new THREE.Vector3(1.15, 0.95, 1.3)).multiplyScalar(2.1 * f * (0.92 + Math.random() * 0.08));
  v.x += Math.sign(v.x) * 0.14;
  return v;
});
// 2 — cubo de dados (estrutura de produto)
shapes[2] = make(() => {
  const q = s => Math.round(s * 9) / 9;
  const v = [q(rnd()), q(rnd()), q(rnd())];
  v[Math.random() * 3 | 0] = Math.random() < 0.5 ? -1 : 1;
  return new THREE.Vector3(...v).multiplyScalar(1.7).add(new THREE.Vector3(rnd(.015), rnd(.015), rnd(.015)));
});
// 3 — três anéis entrelaçados (três redes)
shapes[3] = make(i => {
  const k = i % 3, a = Math.random() * Math.PI * 2, b = Math.random() * Math.PI * 2, tr = 0.16 * Math.sqrt(Math.random());
  const r = 1.9 + Math.cos(b) * tr;
  const v = new THREE.Vector3(Math.cos(a) * r, Math.sin(a) * r, Math.sin(b) * tr);
  v.applyEuler(new THREE.Euler(0.5 + k * 0.55, k * 1.15 - 0.6, k * 0.4));
  v.x += (k - 1) * 0.9;
  return v;
});
// 4 — onda (aprendizado contínuo)
shapes[4] = make(() => {
  const x = rnd(5), z = rnd(3);
  return new THREE.Vector3(x, Math.sin(x * 1.2) * 0.6 + Math.cos(z * 1.6) * 0.4, z);
});
// 5 — galáxia espiral
shapes[5] = make(i => {
  const arm = i % 3, d = Math.pow(Math.random(), 0.7) * 4.5;
  const a = d * 1.4 + arm * (Math.PI * 2 / 3) + rnd(0.35);
  return new THREE.Vector3(Math.cos(a) * d, rnd(0.18) * (5 - d) * 0.15, Math.sin(a) * d);
});

function knot(u) {
  const qu = 1.5 * u, cs = Math.cos(qu);
  return new THREE.Vector3(KR * (2 + cs) * 0.5 * Math.cos(u), KR * (2 + cs) * 0.5 * Math.sin(u), KR * Math.sin(qu) * 0.5);
}
function sphereShell(r) { return new THREE.Vector3(rnd(), rnd(), rnd()).normalize().multiplyScalar(r); }
function make(fn) {
  const a = new Float32Array(N * 3);
  for (let i = 0; i < N; i++) { const v = fn(i); a[i * 3] = v.x; a[i * 3 + 1] = v.y; a[i * 3 + 2] = v.z; }
  return a;
}

const pos = new Float32Array(N * 3), from = new Float32Array(N * 3), seed = new Float32Array(N);
for (let i = 0; i < N; i++) {
  const v = sphereShell(14 + Math.random() * 16);
  from[i * 3] = pos[i * 3] = v.x; from[i * 3 + 1] = pos[i * 3 + 1] = v.y; from[i * 3 + 2] = pos[i * 3 + 2] = v.z;
  seed[i] = Math.random();
}
const geo = new THREE.BufferGeometry();
geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
geo.setAttribute('aSeed', new THREE.BufferAttribute(seed, 1));
const pMat = new THREE.ShaderMaterial({
  transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
  uniforms: { uTime: { value: 0 }, uPix: { value: renderer.getPixelRatio() }, uSize: { value: small ? 26 : 30 } },
  vertexShader: `
    attribute float aSeed; uniform float uTime, uPix, uSize; varying vec3 vCol; varying float vA;
    void main(){
      vec3 p = position;
      p += 0.025 * vec3(sin(uTime*1.3 + aSeed*40.), cos(uTime*1.1 + aSeed*30.), sin(uTime*.9 + aSeed*20.));
      vec4 mv = modelViewMatrix * vec4(p,1.);
      gl_Position = projectionMatrix * mv;
      float s = mix(.35, 1.25, pow(aSeed, 3.));
      gl_PointSize = uSize * s * uPix / -mv.z;
      vec3 a = vec3(.78,1.,.24), b = vec3(.54,.42,1.), w = vec3(1.);
      vCol = aSeed < .45 ? a : (aSeed < .8 ? b : w);
      vA = .55 + .45*sin(uTime*2. + aSeed*60.);
    }`,
  fragmentShader: `
    varying vec3 vCol; varying float vA;
    void main(){ float d = length(gl_PointCoord-.5); if(d>.5) discard;
      float a = smoothstep(.5,.0,d); gl_FragColor = vec4(vCol, a*a*vA*.9); }`,
});
const points = new THREE.Points(geo, pMat);
world.add(points);

// ---------- pós-processamento (bloom) ----------
const composer = new EffectComposer(renderer);
composer.addPass(new RenderPass(scene, camera));
const bloom = new UnrealBloomPass(new THREE.Vector2(1, 1), small ? 0.4 : 0.5, 0.5, 0.42);
composer.addPass(bloom);
composer.addPass(new OutputPass());

// ---------- estado e scroll ----------
let shape = 0, morph = 0, side = 0, sideT = 0, glassT = 0;
const MORPH = reduce ? 0.001 : 1.8;
function goTo(s) {
  if (s === shape) return;
  from.set(pos); shape = s; morph = 0;
}
const sections = [...document.querySelectorAll('[data-shape]')];
const io = new IntersectionObserver(es => {
  es.forEach(e => {
    if (!e.isIntersecting) return;
    goTo(+e.target.dataset.shape);
    sideT = { l: -1, r: 1, c: 0 }[e.target.dataset.side || 'c'];
  });
}, { rootMargin: '-45% 0px -45% 0px' });
sections.forEach(s => io.observe(s));

let mx = 0, my = 0;
addEventListener('pointermove', e => { mx = e.clientX / innerWidth - 0.5; my = e.clientY / innerHeight - 0.5; });

function resize() {
  const w = Math.max(innerWidth, 1), h = Math.max(innerHeight, 1);
  renderer.setSize(w, h, false); composer.setSize(w, h);
  camera.aspect = w / h; camera.updateProjectionMatrix();
}
addEventListener('resize', resize); resize();

const ease = t => t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
const clock = new THREE.Clock();
let introDelay = reduce ? 0 : 0.25;

function tick() {
  const raw = clock.getDelta(), t = clock.elapsedTime;
  if (t > introDelay) morph = Math.min(1, morph + Math.min(raw, 0.25) / MORPH);

  // partículas se formando com atraso individual
  const to = shapes[shape];
  for (let i = 0; i < N; i++) {
    const k = ease(Math.min(1, Math.max(0, (morph * 1.6 - seed[i] * 0.6))));
    const j = i * 3;
    pos[j] = from[j] + (to[j] - from[j]) * k;
    pos[j + 1] = from[j + 1] + (to[j + 1] - from[j + 1]) * k;
    pos[j + 2] = from[j + 2] + (to[j + 2] - from[j + 2]) * k;
  }
  geo.attributes.position.needsUpdate = true;
  pMat.uniforms.uTime.value = t;

  // vidro nasce depois das partículas
  const want = shape === 0 && morph > 0.55 ? 1 : 0;
  glassT += (want - glassT) * (reduce ? 1 : 0.045);
  glass.scale.setScalar(Math.max(0.0001, ease(glassT)));
  glass.rotation.x = t * 0.15; glass.rotation.y = t * 0.22;

  // posicionamento lateral e parallax
  const wide = innerWidth > 900, offset = !wide ? 0 : innerWidth > 1250 ? 2.9 : 3.3;
  side += (sideT - side) * 0.04;
  world.position.x = side * offset;
  world.position.y = wide ? 0 : 1.4;
  world.scale.setScalar(!wide ? 0.78 : innerWidth > 1250 ? 1 : 0.82);
  world.rotation.y += reduce ? 0 : 0.0025;
  world.rotation.x += ((my * 0.35 + (shape === 4 ? 0.45 : shape === 5 ? 0.6 : 0)) - world.rotation.x) * 0.04;
  camera.position.x += (mx * 0.8 - camera.position.x) * 0.04;
  camera.lookAt(world.position.x * 0.3, 0, 0);

  lime.position.set(Math.cos(t * 0.7) * 4, 2, Math.sin(t * 0.7) * 4);
  violet.position.set(Math.cos(t * 0.5 + 3) * 4, -2, Math.sin(t * 0.5 + 3) * 4);
  lime.position.add(world.position); violet.position.add(world.position);

  composer.render();
  requestAnimationFrame(tick);
}
document.documentElement.classList.add('gl-ready');
tick();
