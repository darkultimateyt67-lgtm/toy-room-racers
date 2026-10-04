// ============ RENDERER / SCENE / POST-PROCESSING / SHARED HELPERS ============
const V3 = THREE.Vector3, V2 = THREE.Vector2;
const $ = id => document.getElementById(id);
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const lerp = (a, b, t) => a + (b - a) * t;
const smooth = (e0, e1, x) => { const t = clamp((x - e0) / (e1 - e0), 0, 1); return t * t * (3 - 2 * t); };
const hexStr = c => '#' + c.toString(16).padStart(6, '0');
let seed = 1337;
const srnd = () => (seed = (seed * 16807) % 2147483647, (seed - 1) / 2147483646);

const renderer = new THREE.WebGLRenderer({antialias: false, powerPreference: 'high-performance', stencil: false});
renderer.setSize(innerWidth, innerHeight);
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 0.95;
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.domElement.id = 'gl';
document.body.prepend(renderer.domElement);

const scene = new THREE.Scene();
scene.background = new THREE.Color(0xe9e2d6);
const camera = new THREE.PerspectiveCamera(60, innerWidth / innerHeight, 0.08, 700);

// ---------- lighting ----------
// Soft image-based light from a studio "room" + warm sun through the window + sky fill.
const pmrem = new THREE.PMREMGenerator(renderer);
scene.environment = pmrem.fromScene(new THREE.RoomEnvironment(renderer), 0.04).texture;
const hemi = new THREE.HemisphereLight(0xfff3e2, 0x7a5c44, 0.5);
scene.add(hemi);
const SUN_DIR = new V3(0.28, 1, -0.62).normalize();
const sun = new THREE.DirectionalLight(0xffe7c4, 3.1);
sun.castShadow = true;
sun.shadow.bias = -0.0003;
sun.shadow.normalBias = 0.035;
sun.shadow.radius = 3;
scene.add(sun, sun.target);
// The shadow box follows the action so shadows stay razor sharp in a big room.
let shadowSpan = 40;
function aimSun(x, z, span){
  shadowSpan = span;
  const texel = span * 2 / sun.shadow.mapSize.x;
  x = Math.round(x / texel) * texel; z = Math.round(z / texel) * texel;
  sun.target.position.set(x, 0, z);
  sun.position.set(x + SUN_DIR.x * 220, SUN_DIR.y * 220, z + SUN_DIR.z * 220);
  const c = sun.shadow.camera;
  if (c.right !== span) { c.left = -span; c.right = span; c.top = span; c.bottom = -span; c.near = 60; c.far = 420; c.updateProjectionMatrix(); }
}

// ---------- graphics quality presets + post-processing ----------
const QUALITY = {
  ultra:  {label: 'Ultra',  pr: 1.5,  ao: 0.75, bloom: true,  shadow: 4096, msaa: 4},
  high:   {label: 'High',   pr: 1.25, ao: 0.5,  bloom: true,  shadow: 2048, msaa: 4},
  medium: {label: 'Medium', pr: 1.0,  ao: 0,    bloom: true,  shadow: 2048, msaa: 2},
  low:    {label: 'Low',    pr: 0.8,  ao: 0,    bloom: false, shadow: 1024, msaa: 0},
};
const QORDER = ['ultra', 'high', 'medium', 'low'];
let gfx = {mode: 'auto', level: 'high'};
try { const g = JSON.parse(localStorage.getItem('toyRacersGfx')); if (g && (g.mode === 'auto' || QUALITY[g.mode])) gfx = {mode: g.mode, level: g.mode === 'auto' ? 'high' : g.mode}; } catch (e) {}
let composer = null, aoPass = null, bloomPass = null;
// The AO pre-pass must ignore smoke, flames, glass and other see-through things.
THREE.GTAOPass.prototype.overrideVisibility = function(){
  const cache = this._visibilityCache;
  this.scene.traverse(o => { cache.set(o, o.visible); if (o.isPoints || o.isLine || o.isSprite || (o.material && o.material.transparent)) o.visible = false; });
};
function applyQuality(){
  const Q = QUALITY[gfx.level];
  const pr = Math.min(devicePixelRatio || 1, Q.pr);
  renderer.setPixelRatio(pr);
  renderer.setSize(innerWidth, innerHeight);
  if (sun.shadow.mapSize.x !== Q.shadow) { sun.shadow.mapSize.set(Q.shadow, Q.shadow); if (sun.shadow.map) { sun.shadow.map.dispose(); sun.shadow.map = null; } }
  if (composer) { composer.renderTarget1.dispose(); composer.renderTarget2.dispose(); composer = null; }
  const w = Math.floor(innerWidth * pr), h = Math.floor(innerHeight * pr);
  const rt = new THREE.WebGLRenderTarget(w, h, {type: THREE.HalfFloatType, samples: Q.msaa});
  composer = new THREE.EffectComposer(renderer, rt);
  composer.setPixelRatio(pr); composer.setSize(innerWidth, innerHeight);
  composer.addPass(new THREE.RenderPass(scene, camera));
  aoPass = null; bloomPass = null;
  if (Q.ao) {
    aoPass = new THREE.GTAOPass(scene, camera, Math.floor(w * Q.ao), Math.floor(h * Q.ao));
    const ss = aoPass.setSize.bind(aoPass); aoPass.setSize = (W, H) => ss(Math.floor(W * Q.ao), Math.floor(H * Q.ao));
    aoPass.updateGtaoMaterial({radius: 2.2, distanceExponent: 1.4, thickness: 1.2, scale: 1.15, samples: 12, distanceFallOff: 1, screenSpaceRadius: false});
    aoPass.updatePdMaterial({lumaPhi: 10, depthPhi: 2, normalPhi: 3, radius: 5, radiusExponent: 1, rings: 2, samples: 12});
    aoPass.blendIntensity = 0.9;
    composer.addPass(aoPass);
  }
  if (Q.bloom) { bloomPass = new THREE.UnrealBloomPass(new V2(w / 2, h / 2), 0.35, 0.45, 1.05); composer.addPass(bloomPass); }
  composer.addPass(new THREE.OutputPass());
}
function setQuality(mode){
  gfx.mode = mode;
  if (mode !== 'auto') gfx.level = mode;
  try { localStorage.setItem('toyRacersGfx', JSON.stringify({mode: gfx.mode})); } catch (e) {}
  applyQuality();
}
// Auto mode: step quality down when frames are slow, and back up (never above High) once it runs smoothly again.
const perf = {acc: 0, n: 0, slow: 0, fast: 0, cool: 3};
function watchPerf(dt){
  if (gfx.mode !== 'auto') return;
  perf.cool -= dt; if (perf.cool > 0) return;
  perf.acc += dt; perf.n++;
  if (perf.acc < 2) return;
  const avg = perf.acc / perf.n; perf.acc = 0; perf.n = 0;
  perf.slow = avg > 1 / 42 ? perf.slow + 1 : 0;
  perf.fast = avg < 1 / 75 ? perf.fast + 1 : 0;
  const i = QORDER.indexOf(gfx.level);
  if (perf.slow >= 2 && i < QORDER.length - 1) { gfx.level = QORDER[i + 1]; applyQuality(); perf.cool = 3; perf.slow = 0; }
  else if (perf.fast >= 4 && i > QORDER.indexOf('high')) { gfx.level = QORDER[i - 1]; applyQuality(); perf.cool = 4; perf.fast = 0; }
}
function render(){ composer.render(); }
addEventListener('resize', () => { camera.aspect = innerWidth / innerHeight; camera.updateProjectionMatrix(); applyQuality(); });

// ---------- material helpers (all physically based) ----------
const _mats = {};
function std(c, r = 0.6, m = 0){
  const k = 's' + c + '_' + r + '_' + m;
  return _mats[k] || (_mats[k] = new THREE.MeshStandardMaterial({color: c, roughness: r, metalness: m}));
}
const lam = c => std(c, 0.85, 0);               // matte (paint, wood, card)
function plastic(c, r = 0.32){                   // shiny toy plastic with a clear coat
  const k = 'p' + c + '_' + r;
  return _mats[k] || (_mats[k] = new THREE.MeshPhysicalMaterial({color: c, roughness: r, clearcoat: 0.6, clearcoatRoughness: 0.25}));
}
function fabric(c, map){                         // soft cloth with velvety sheen
  const k = 'f' + c + (map ? map.uuid : '');
  return _mats[k] || (_mats[k] = new THREE.MeshPhysicalMaterial({color: c, map: map || null, roughness: 0.95, sheen: 1, sheenRoughness: 0.45, sheenColor: new THREE.Color(0xffffff).lerp(new THREE.Color(c), 0.4)}));
}

// Merge duplicate vertices so curved shapes shade smoothly instead of faceted.
function smoothGeo(g){
  const pos = g.attributes.position, map = new Map(), idx = [], out = [];
  const src = g.index ? g.index.array : null, n = src ? src.length : pos.count;
  for (let k = 0; k < n; k++) {
    const i = src ? src[k] : k;
    const x = pos.getX(i), y = pos.getY(i), z = pos.getZ(i);
    const key = Math.round(x * 1e4) + ',' + Math.round(y * 1e4) + ',' + Math.round(z * 1e4);
    let j = map.get(key);
    if (j === undefined) { j = out.length / 3; out.push(x, y, z); map.set(key, j); }
    idx.push(j);
  }
  const r = new THREE.BufferGeometry();
  r.setAttribute('position', new THREE.Float32BufferAttribute(out, 3));
  r.setIndex(idx);
  r.computeVertexNormals();
  r.computeBoundingSphere();
  return r;
}
// Rounded box: every edge and corner is curved.
const _rbox = {};
function rboxGeo(w, h, d, r = 0.1, seg = 3){
  r = Math.max(0.001, Math.min(r, w / 2 - 0.001, h / 2 - 0.001, d / 2 - 0.001));
  const key = [w, h, d, r, seg].map(v => v.toFixed(3)).join('|');
  if (_rbox[key]) return _rbox[key];
  const e = 0.0004, s = new THREE.Shape(), iw = w / 2 - r, ih = h / 2 - r;
  s.moveTo(-iw, -ih - e); s.lineTo(iw, -ih - e); s.absarc(iw, -ih, e, -Math.PI / 2, 0, false);
  s.lineTo(iw + e, ih); s.absarc(iw, ih, e, 0, Math.PI / 2, false);
  s.lineTo(-iw, ih + e); s.absarc(-iw, ih, e, Math.PI / 2, Math.PI, false);
  s.lineTo(-iw - e, -ih); s.absarc(-iw, -ih, e, Math.PI, Math.PI * 1.5, false);
  const depth = Math.max(0.0005, d - 2 * r);
  const g = new THREE.ExtrudeGeometry(s, {depth, bevelEnabled: true, bevelThickness: r, bevelSize: r, bevelSegments: seg, curveSegments: 3});
  g.translate(0, 0, -depth / 2);
  return (_rbox[key] = smoothGeo(g));
}
const _cyl = {};
function cylGeo(rt, rb, h, seg = 20, open = false){
  const k = [rt, rb, h, seg, open].join('|');
  return _cyl[k] || (_cyl[k] = new THREE.CylinderGeometry(rt, rb, h, seg, 1, open));
}
const _sph = {};
function sphGeo(r, ws = 24, hs = 16){ const k = r + '|' + ws + '|' + hs; return _sph[k] || (_sph[k] = new THREE.SphereGeometry(r, ws, hs)); }

function canvasTex(w, h, draw, repeat, data){
  const c = document.createElement('canvas'); c.width = w; c.height = h;
  draw(c.getContext('2d'), w, h);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = data ? THREE.NoColorSpace : THREE.SRGBColorSpace;
  t.anisotropy = Math.min(8, renderer.capabilities.getMaxAnisotropy());
  if (repeat) { t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(repeat[0], repeat[1]); }
  return t;
}
// A grey-scale copy of a texture canvas, for bump / roughness maps.
function dataTex(src, repeat, f){
  const c = document.createElement('canvas'); c.width = src.image.width; c.height = src.image.height;
  const g = c.getContext('2d'); g.drawImage(src.image, 0, 0);
  const im = g.getImageData(0, 0, c.width, c.height), d = im.data;
  for (let i = 0; i < d.length; i += 4) { const v = f((d[i] + d[i + 1] + d[i + 2]) / 765); d[i] = d[i + 1] = d[i + 2] = clamp(v * 255, 0, 255); }
  g.putImageData(im, 0, 0);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.NoColorSpace;
  if (repeat) { t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(repeat[0], repeat[1]); }
  return t;
}

// Generic mesh adder. Tiny parts skip shadow casting.
function addMesh(parent, geo, mat, x = 0, y = 0, z = 0, rx = 0, ry = 0, rz = 0){
  const m = new THREE.Mesh(geo, mat);
  m.position.set(x, y, z); m.rotation.set(rx, ry, rz);
  if (!geo.boundingSphere) geo.computeBoundingSphere();
  m.castShadow = geo.boundingSphere.radius > 0.12;
  m.receiveShadow = true;
  parent.add(m);
  return m;
}

// ---------- batching: fold static meshes that share a material into one draw call ----------
// `keep` = objects that animate (they, and everything under them, stay separate).
function mergeStatic(root, keep = new Set()){
  root.updateMatrixWorld(true);
  const inv = new THREE.Matrix4().copy(root.matrixWorld).invert();
  const buckets = new Map(), victims = [], gone = new Set();
  const visit = o => {
    for (const c of o.children.slice()) {
      if (keep.has(c) || c.userData.keep) continue;
      if (c.children.length) visit(c);
      const childless = c.children.every(ch => gone.has(ch));
      if (c.isMesh && !c.isInstancedMesh && !Array.isArray(c.material) && childless && !c.material.transparent && !c.material.vertexColors && !c.geometry.morphAttributes.position) {
        gone.add(c);
        const m = c.material, hasMap = !!(m.map || m.bumpMap || m.roughnessMap);
        const key = m.uuid + (c.castShadow ? 'S' : '') + (hasMap ? 'U' : '');
        if (!buckets.has(key)) buckets.set(key, {mat: m, cast: c.castShadow, uv: hasMap, list: []});
        buckets.get(key).list.push(c); victims.push(c);
      } else if (!c.isMesh && c.type === 'Group' && childless) gone.add(c);
    }
  };
  visit(root);
  for (const b of buckets.values()) {
    const geos = [];
    for (const m of b.list) {
      let g = m.geometry.clone();
      for (const a of Object.keys(g.attributes)) if (a !== 'position' && a !== 'normal' && !(b.uv && a === 'uv')) g.deleteAttribute(a);
      if (!g.attributes.normal) g.computeVertexNormals();
      if (b.uv && !g.attributes.uv) g.setAttribute('uv', new THREE.Float32BufferAttribute(new Float32Array(g.attributes.position.count * 2), 2));
      if (!g.index) { const n = g.attributes.position.count, ix = new Uint32Array(n); for (let i = 0; i < n; i++) ix[i] = i; g.setIndex(new THREE.BufferAttribute(ix, 1)); }
      g.applyMatrix4(new THREE.Matrix4().multiplyMatrices(inv, m.matrixWorld));
      geos.push(g);
    }
    const merged = THREE.BufferGeometryUtils.mergeGeometries(geos, false);
    geos.forEach(g => g.dispose());
    if (!merged) { b.list.forEach(m => victims.splice(victims.indexOf(m), 1)); continue; }
    const mesh = new THREE.Mesh(merged, b.mat); mesh.castShadow = b.cast; mesh.receiveShadow = true;
    root.add(mesh);
  }
  for (const v of victims) v.parent && v.parent.remove(v);
  // drop now-empty plain groups
  const prune = o => { for (const c of o.children.slice()) { if (keep.has(c) || c.userData.keep) continue; prune(c); if (!c.isMesh && !c.isSprite && !c.isLight && c.children.length === 0 && c.type === 'Group') o.remove(c); } };
  prune(root);
}

// ============ PARTICLES (smoke, tyre smoke, flames, sparks) ============
const softTex = canvasTex(64, 64, (g, w) => {
  const gr = g.createRadialGradient(w / 2, w / 2, 0, w / 2, w / 2, w / 2);
  gr.addColorStop(0, 'rgba(255,255,255,1)'); gr.addColorStop(0.45, 'rgba(255,255,255,0.55)'); gr.addColorStop(1, 'rgba(255,255,255,0)');
  g.fillStyle = gr; g.fillRect(0, 0, w, w);
});
const PFX = [];
for (let i = 0; i < 220; i++) {
  const m = new THREE.SpriteMaterial({map: softTex, transparent: true, depthWrite: false, opacity: 0});
  const s = new THREE.Sprite(m); s.visible = false; s.renderOrder = 5; scene.add(s);
  PFX.push({s, m, life: 0, max: 1, v: new V3(), s0: 1, s1: 2, a: 0.5, drag: 1, grav: 0, hdr: 1});
}
let pfxI = 0;
function puff(x, y, z, o){
  const p = PFX[pfxI++ % PFX.length];
  p.s.position.set(x, y, z); p.s.visible = true;
  p.v.set(o.vx || 0, o.vy || 0, o.vz || 0);
  p.life = 0; p.max = o.life || 1; p.s0 = o.s0 || 0.3; p.s1 = o.s1 || 1.2; p.a = o.a ?? 0.5;
  p.drag = o.drag ?? 1.5; p.grav = o.grav || 0;
  p.m.color.setHex(o.color ?? 0xbbbbbb);
  if (o.add) p.m.color.multiplyScalar(4);          // glowing sparks feed the bloom
  p.m.blending = o.add ? THREE.AdditiveBlending : THREE.NormalBlending;
  p.m.opacity = p.a; p.s.scale.setScalar(p.s0);
}
function updatePFX(dt){
  for (const p of PFX) {
    if (!p.s.visible) continue;
    p.life += dt;
    const t = p.life / p.max;
    if (t >= 1) { p.s.visible = false; continue; }
    p.v.multiplyScalar(Math.exp(-p.drag * dt)); p.v.y -= p.grav * dt;
    p.s.position.addScaledVector(p.v, dt);
    p.s.scale.setScalar(lerp(p.s0, p.s1, Math.sqrt(t)));
    p.m.opacity = p.a * (1 - t) * Math.min(1, t * 8);
  }
}

// ============ SKID MARKS (ring buffer of quads) ============
const SKN = 900;
const skidPos = new Float32Array(SKN * 6 * 3);
const skidGeo = new THREE.BufferGeometry();
skidGeo.setAttribute('position', new THREE.BufferAttribute(skidPos, 3));
const skidMesh = new THREE.Mesh(skidGeo, new THREE.MeshBasicMaterial({color: 0x111111, transparent: true, opacity: 0.3, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -4, polygonOffsetUnits: -4}));
skidMesh.frustumCulled = false; skidMesh.renderOrder = 2;
scene.add(skidMesh);
let skidI = 0;
function skidQuad(a, b, w, y){
  const dx = b.x - a.x, dz = b.z - a.z, l = Math.hypot(dx, dz);
  if (l < 0.01 || l > 2) return;
  const nx = -dz / l * w / 2, nz = dx / l * w / 2, o = (skidI++ % SKN) * 18;
  skidPos.set([a.x - nx, y, a.z - nz, a.x + nx, y, a.z + nz, b.x + nx, y, b.z + nz,
               a.x - nx, y, a.z - nz, b.x + nx, y, b.z + nz, b.x - nx, y, b.z - nz], o);
  skidGeo.attributes.position.needsUpdate = true;
}
function clearSkids(){ skidPos.fill(0); skidGeo.attributes.position.needsUpdate = true; }

applyQuality();
