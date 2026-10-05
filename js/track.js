// ============ TRACKS: curves, hills, bridges, jumps, tier colour themes ============
const TRACK_Y = 0.35, SAMPLE = 0.4, RAMP_LEN = 7, RAMP_H = 1.5;
// Every tier has its own look: road plastic colour, kerb colours, connector clips, banner.
const THEMES = [
  {road: 0xea580c, k1: 0xe11d2a, k2: 0xffffff, clip: 0x2b6cb0, banner: '#d62839'},            // D  classic orange
  {road: 0x16a34a, k1: 0xfacc15, k2: 0xffffff, clip: 0xf97316, banner: '#15803d'},            // C  green
  {road: 0x2563eb, k1: 0xffffff, k2: 0x1e3a8a, clip: 0xfacc15, banner: '#1d4ed8'},            // B  blue
  {road: 0x7c3aed, k1: 0xf472b6, k2: 0xffffff, clip: 0x22d3ee, banner: '#6d28d9'},            // A  purple
  {road: 0xd4a017, k1: 0x111111, k2: 0xffffff, clip: 0xdc2626, banner: '#a16207'},            // S  gold
  {road: 0x2a2a33, k1: 0xff1744, k2: 0x16161c, clip: 0x00e676, banner: '#b91c1c', neon: 0xff1744}, // M  neon night
];

function prepTrack(t){
  const curve = new THREE.CatmullRomCurve3(t.pts.map(p => new V3(p[0], p[2] || 0, p[1])), true, 'catmullrom', 0.5);
  const L = curve.getLength(), N = Math.round(L / SAMPLE), ds = L / N;
  const sp = curve.getSpacedPoints(N); sp.pop();
  const P = sp.map(v => ({x: v.x, z: v.z})), H = new Float32Array(sp.map(v => Math.max(0, v.y))), T = [], Nr = [];
  for (let i = 0; i < N; i++) {
    const a = P[(i - 1 + N) % N], b = P[(i + 1) % N];
    let dx = b.x - a.x, dz = b.z - a.z; const l = Math.hypot(dx, dz) || 1; dx /= l; dz /= l;
    T.push({x: dx, z: dz}); Nr.push({x: -dz, z: dx}); // Nr = right-hand side of travel
  }
  const Kraw = new Float32Array(N), turn = new Float32Array(N), K = new Float32Array(N);
  for (let i = 0; i < N; i++) {
    const a = T[(i - 3 + N) % N], b = T[(i + 3) % N];
    Kraw[i] = Math.acos(clamp(a.x * b.x + a.z * b.z, -1, 1)) / (6 * ds);
    turn[i] = a.x * b.z - a.z * b.x;
  }
  for (let i = 0; i < N; i++) { let s = 0; for (let k = -6; k <= 6; k++) s += Kraw[(i + k + N) % N]; K[i] = s / 13; }
  Object.assign(t, {curve, L, N, ds, P, H, T, Nr, K, turn, hw: t.hw || 5, theme: THEMES[t.tier]});
  t.minR = 1 / Math.max(...K);
  t.maxH = Math.max(...H);
  t.hasBridge = false;
  for (let i = 0; i < N && !t.hasBridge; i += 4) for (let j = i + 40; j < N; j += 4) {
    if (N - (j - i) < 40) continue;
    if (Math.hypot(P[j].x - P[i].x, P[j].z - P[i].z) < t.hw && Math.abs(H[j] - H[i]) > 4) { t.hasBridge = true; break; }
  }
  if (t.ramp) {
    t.rampI = nearestIdxGlobal(t, t.ramp[0], t.ramp[1]);
    t.rampLen = Math.round(RAMP_LEN / ds);
    t.ramp0 = (t.rampI - Math.round(t.rampLen / 2) + N) % N;
  }
  t.corners = [];
  for (let i = 0; i < N; i++) {
    if (K[i] < 1 / 15) continue;
    let isMax = true;
    for (let k = -30; k <= 30 && isMax; k++) if (K[(i + k + N) % N] > K[i]) isMax = false;
    if (isMax && !t.corners.some(c => Math.min(Math.abs(c - i), N - Math.abs(c - i)) < 40)) t.corners.push(i);
  }
}
function nearestIdxGlobal(t, x, z){ let b = 0, bd = 1e9; for (let i = 0; i < t.N; i++) { const d = (t.P[i].x - x) ** 2 + (t.P[i].z - z) ** 2; if (d < bd) { bd = d; b = i; } } return b; }
function nearestIdx(t, x, z, guess, win = 30){
  let best = guess, bd = 1e9;
  for (let k = -win; k <= win; k++) { const i = (guess + k + t.N) % t.N, q = t.P[i], d = (q.x - x) ** 2 + (q.z - z) ** 2; if (d < bd) { bd = d; best = i; } }
  return best;
}
// Road surface height at a (fractional) sample index — hills, bridges and the book ramp.
function baseGround(t, fidx){
  const N = t.N, f = ((fidx % N) + N) % N, i0 = Math.floor(f) % N, i1 = (i0 + 1) % N, fr = f - Math.floor(f);
  return TRACK_Y + t.H[i0] + (t.H[i1] - t.H[i0]) * fr;
}
// How far along the book ramp this point is (0..rampLen), or -1 when not on it.
function rampPos(t, fidx, lat){
  if (t.ramp0 == null || Math.abs(lat) > t.hw - 0.2) return -1;
  const k = ((fidx - t.ramp0) % t.N + t.N) % t.N;
  return k < t.rampLen ? k : -1;
}
function groundAt(t, fidx, lat){
  if (!t) return 0;
  const k = rampPos(t, fidx, lat);
  return baseGround(t, fidx) + (k >= 0 ? RAMP_H * (k / t.rampLen) : 0);
}
// Slope of the road under the car. The ramp's own slope is added separately so the sudden drop
// at its lip is never mistaken for a downhill — that used to slam cars down instead of launching them.
function slopeAt(t, fidx, lat = 0){
  const base = (baseGround(t, fidx + 1) - baseGround(t, fidx - 1)) / (2 * t.ds);
  return base + (rampPos(t, fidx, lat) >= 0 ? RAMP_H / (t.rampLen * t.ds) : 0);
}
function trackNear(x, z, r){
  for (const t of TRACKS) for (let i = 0; i < t.N; i += 2) { const q = t.P[i]; if ((q.x - x) ** 2 + (q.z - z) ** 2 < (t.hw + r) ** 2) return true; }
  return false;
}
function ownTrackNear(t, x, z, r){ for (let i = 0; i < t.N; i += 2) { const q = t.P[i]; if ((q.x - x) ** 2 + (q.z - z) ** 2 < (t.hw + r) ** 2) return true; } return false; }
// AI speed profile: corner speed limit plus braking distance before each corner
function computeVmax(t, tier){
  const N = t.N, v = new Float32Array(N), B = 36;
  for (let i = 0; i < N; i++) v[i] = Math.min(tier.top, Math.sqrt(tier.lat / Math.max(t.K[i], 1e-4)));
  for (let pass = 0; pass < 2; pass++) for (let i = N - 1; i >= 0; i--) { const j = (i + 1) % N; v[i] = Math.min(v[i], Math.sqrt(v[j] * v[j] + 2 * B * t.ds)); }
  return v;
}
// Dev check: furniture, walls, low ceilings (bed/desk), crossings without enough bridge height, steepness.
function validateTracks(){
  const out = [];
  for (const t of TRACKS) {
    const issues = [];
    for (let i = 0; i < t.N; i += 2) {
      const q = t.P[i], h = t.H[i];
      for (const s of [-1, 0, 1]) { const x = q.x + t.Nr[i].x * s * (t.hw - 0.3), z = q.z + t.Nr[i].z * s * (t.hw - 0.3); if (h < 12 && blocked(x, z, 0.7)) { issues.push(`blocked @(${x.toFixed(0)},${z.toFixed(0)})`); break; } }
      for (const c of ceilings) if (q.x > c.x0 - t.hw && q.x < c.x1 + t.hw && q.z > c.z0 - t.hw && q.z < c.z1 + t.hw && h + 3.2 > c.y) issues.push(`too high under ceiling @(${q.x.toFixed(0)},${q.z.toFixed(0)}) h${h.toFixed(1)}`);
      const sl = Math.abs(t.H[(i + 1) % t.N] - t.H[i]) / t.ds; if (sl > 0.34) issues.push(`steep ${sl.toFixed(2)} @${i}`);
      for (let j = i + 1; j < t.N; j += 2) {
        const gap = Math.min(j - i, t.N - (j - i)) * t.ds; if (gap < t.hw * 2 + 6) continue;
        const d = Math.hypot(t.P[j].x - q.x, t.P[j].z - q.z);
        if (d < t.hw * 2 + 2 && Math.abs(t.H[j] - h) < 4.6) { issues.push(`self-overlap @(${q.x.toFixed(0)},${q.z.toFixed(0)}) dh ${Math.abs(t.H[j] - h).toFixed(1)}`); break; }
      }
    }
    if (t.minR < t.hw + 0.9) issues.push(`tight corner R=${t.minR.toFixed(1)}`);
    out.push(`${t.tier}:${t.id} L=${t.L.toFixed(0)} R=${t.minR.toFixed(1)} maxH=${t.maxH.toFixed(1)} → ${issues.length ? [...new Set(issues)].slice(0, 6).join('; ') : 'OK'}`);
  }
  return out.join('\n');
}

// ---------- textures (neutral, tinted per theme) ----------
const roadTex = canvasTex(256, 512, (g, w, h) => {
  const gr = g.createLinearGradient(0, 0, w, 0);
  gr.addColorStop(0, '#d8d8d8'); gr.addColorStop(0.5, '#ffffff'); gr.addColorStop(1, '#d8d8d8');
  g.fillStyle = gr; g.fillRect(0, 0, w, h);
  g.fillStyle = 'rgba(255,255,255,0.5)'; g.fillRect(w * 0.28, 0, 10, h); g.fillRect(w * 0.68, 0, 10, h);
  g.fillStyle = 'rgba(0,0,0,0.16)'; g.fillRect(w * 0.28 + 10, 0, 3, h); g.fillRect(w * 0.68 + 10, 0, 3, h);
  for (let y = 40; y < h; y += 90) { g.fillStyle = 'rgba(255,255,255,0.9)'; g.fillRect(w / 2 - 3, y, 6, 40); }
  g.fillStyle = 'rgba(0,0,0,0.45)'; g.fillRect(0, 0, w, 4);
  for (let i = 0; i < 2500; i++) { g.fillStyle = `rgba(0,0,0,${Math.random() * 0.04})`; g.fillRect(Math.random() * w, Math.random() * h, 2, 2); }
}, [1, 1]);
const checkTex = canvasTex(256, 64, (g, w, h) => { for (let i = 0; i < 16; i++) for (let j = 0; j < 4; j++) { g.fillStyle = (i + j) % 2 ? '#111' : '#fff'; g.fillRect(i * 16, j * 16, 16, 16); } });
const chevTex = canvasTex(256, 96, (g, w, h) => {
  g.fillStyle = '#ffd166'; g.fillRect(0, 0, w, h); g.fillStyle = '#111';
  for (let i = 0; i < 4; i++) { const x = 20 + i * 58; g.beginPath(); g.moveTo(x, 10); g.lineTo(x + 30, 48); g.lineTo(x, 86); g.lineTo(x + 18, 86); g.lineTo(x + 48, 48); g.lineTo(x + 18, 10); g.fill(); }
});
const _banners = {};
function bannerTex(col){
  return _banners[col] || (_banners[col] = canvasTex(512, 96, (g, w, h) => {
    g.fillStyle = col; g.fillRect(0, 0, w, h);
    for (let i = 0; i < 32; i++) for (let j = 0; j < 2; j++) { g.fillStyle = (i + j) % 2 ? '#111' : '#fff'; g.fillRect(i * 16, j * 12, 16, 12); g.fillRect(i * 16, h - 24 + j * 12, 16, 12); }
    g.fillStyle = '#fff'; g.font = 'bold 46px sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText('START  ★  FINISH', w / 2, h / 2 + 2);
  }));
}

const trackGroups = {};
function getTrackGroup(t){
  if (trackGroups[t.id]) return trackGroups[t.id];
  const g = new THREE.Group(); g.visible = false; scene.add(g);
  const {N, P, H, Nr, T, hw, ds} = t, TH = t.theme, PIECE = 12;
  // ---- road ribbon (and its underside where the track is lifted) ----
  const ribbon = (y0, down) => {
    const pos = [], uv = [], nor = [], idx = [];
    for (let i = 0; i <= N; i++) {
      const k = i % N, q = P[k], n = Nr[k], v = i * ds / PIECE, y = y0 + H[k];
      pos.push(q.x - n.x * hw, y, q.z - n.z * hw, q.x + n.x * hw, y, q.z + n.z * hw);
      uv.push(0, v, 1, v); nor.push(0, down ? -1 : 1, 0, 0, down ? -1 : 1, 0);
      if (i < N) { const a = i * 2; if (down) idx.push(a, a + 2, a + 1, a + 1, a + 2, a + 3); else idx.push(a, a + 1, a + 2, a + 1, a + 3, a + 2); }
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
    geo.setAttribute('normal', new THREE.Float32BufferAttribute(nor, 3));
    geo.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
    geo.setIndex(idx); geo.computeBoundingSphere();
    return geo;
  };
  const roadT = roadTex.clone(); roadT.needsUpdate = true; roadT.wrapS = roadT.wrapT = THREE.RepeatWrapping;
  const roadM = new THREE.MeshPhysicalMaterial({map: roadT, color: TH.road, roughness: 0.45, clearcoat: 0.4, clearcoatRoughness: 0.3, envMapIntensity: 0.5});
  const road = new THREE.Mesh(ribbon(TRACK_Y, false), roadM); road.receiveShadow = true; road.castShadow = t.maxH > 0.5; g.add(road);
  if (t.maxH > 0.3) { const under = new THREE.Mesh(ribbon(0.03, true), new THREE.MeshStandardMaterial({color: new THREE.Color(TH.road).multiplyScalar(0.55), roughness: 0.7})); under.castShadow = true; g.add(under); }
  // ---- rounded rails with kerb stripes, following every hill ----
  const prof = [[-0.02, 0.0], [-0.02, 0.65], [0.04, 0.8], [0.18, 0.88], [0.4, 0.87], [0.55, 0.77], [0.62, 0.57], [0.62, 0.0]];
  const M = prof.length, rp = [], rc = [], ri = [], c1 = new THREE.Color(TH.k1), c2 = new THREE.Color(TH.k2);
  [-1, 1].forEach(s => {
    const base = rp.length / 3;
    for (let i = 0; i <= N; i++) {
      const k = i % N, q = P[k], n = Nr[k], col = Math.floor(i * ds / 2.4) % 2 ? c2 : c1;
      for (const [lx, ly] of prof) { const o = s * (hw + lx); rp.push(q.x + n.x * o, H[k] + ly, q.z + n.z * o); rc.push(col.r, col.g, col.b); }
    }
    for (let i = 0; i < N; i++) for (let k = 0; k < M - 1; k++) {
      const a = base + i * M + k, b = a + M;
      if (s > 0) ri.push(a, a + 1, b, a + 1, b + 1, b); else ri.push(a, b, a + 1, a + 1, b, b + 1);
    }
  });
  const railG = new THREE.BufferGeometry();
  railG.setAttribute('position', new THREE.Float32BufferAttribute(rp, 3));
  railG.setAttribute('color', new THREE.Float32BufferAttribute(rc, 3));
  railG.setIndex(ri); railG.computeVertexNormals();
  const rails = new THREE.Mesh(railG, new THREE.MeshPhysicalMaterial({vertexColors: true, roughness: 0.3, clearcoat: 0.7, clearcoatRoughness: 0.2}));
  rails.castShadow = true; rails.receiveShadow = true; g.add(rails);
  // Master tier: glowing neon tubes along the rail tops
  if (TH.neon) {
    const neonM = new THREE.MeshBasicMaterial({color: new THREE.Color(TH.neon).multiplyScalar(3), toneMapped: false});
    [-1, 1].forEach(s => {
      const pts = []; for (let i = 0; i < N; i += 3) { const q = P[i], n = Nr[i]; pts.push(new V3(q.x + n.x * s * (hw + 0.25), H[i] + 0.92, q.z + n.z * s * (hw + 0.25))); }
      g.add(new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts, true), Math.round(N / 2), 0.07, 5, true), neonM));
    });
  }
  // ---- connector clips where track pieces join ----
  const clipM = plastic(TH.clip, 0.3), step = Math.round(PIECE / ds);
  for (let i = 0; i < N; i += step) {
    const q = P[i], n = Nr[i], ang = Math.atan2(T[i].x, T[i].z);
    [-1, 1].forEach(s => addMesh(g, rboxGeo(0.9, 1.0, 0.7, 0.18), clipM, q.x + n.x * s * (hw + 0.3), H[i] + 0.5, q.z + n.z * s * (hw + 0.3), 0, ang, 0));
  }
  // ---- support stands under lifted track (never in the way of the road underneath) ----
  const standM = plastic(TH.clip, 0.35), footM = std(0x2a2a30, 0.5);
  for (let i = 0; i < N; i += Math.round(5 / ds)) {
    if (H[i] < 0.9) continue;
    const q = P[i];
    let clear = true;
    for (let j = 0; j < N && clear; j += 2) { if (Math.min(Math.abs(j - i), N - Math.abs(j - i)) < 30) continue; if (H[j] < H[i] - 2 && Math.hypot(P[j].x - q.x, P[j].z - q.z) < hw + 2.4) clear = false; }
    if (!clear) continue;
    const ang = Math.atan2(T[i].x, T[i].z), hh = H[i] + TRACK_Y - 0.25;
    addMesh(g, cylGeo(0.32, 0.38, hh, 14), standM, q.x, hh / 2, q.z);
    addMesh(g, cylGeo(1.0, 1.15, 0.25, 18), footM, q.x, 0.12, q.z);
    addMesh(g, rboxGeo(hw * 1.7, 0.3, 0.8, 0.12), standM, q.x, hh, q.z, 0, ang, 0);
  }
  // ---- start line, gantry with countdown lights ----
  const q0 = P[0], h0 = H[0], a0 = Math.atan2(T[0].x, T[0].z);
  const sl = new THREE.Mesh(new THREE.PlaneGeometry(hw * 2, 1.6), new THREE.MeshLambertMaterial({map: checkTex, polygonOffset: true, polygonOffsetFactor: -2}));
  sl.rotation.x = -Math.PI / 2;
  const slg = new THREE.Group(); slg.position.set(q0.x, TRACK_Y + h0 + 0.01, q0.z); slg.rotation.y = a0; slg.add(sl); g.add(slg);
  const gant = new THREE.Group(); gant.position.set(q0.x, 0, q0.z); gant.rotation.y = a0; g.add(gant);
  const postM = std(0xeeeeee, 0.35, 0.3), dark = std(0x22252e, 0.5, 0.3), gh = 9 + h0;
  [-1, 1].forEach(s => { addMesh(gant, cylGeo(0.35, 0.4, gh, 16), postM, s * (hw + 1.4), gh / 2, 0); addMesh(gant, cylGeo(0.7, 0.8, 0.4, 16), dark, s * (hw + 1.4), 0.2, 0); });
  addMesh(gant, rboxGeo(hw * 2 + 3.4, 0.6, 0.6, 0.2), postM, 0, gh, 0);
  const ban = new THREE.Mesh(rboxGeo(hw * 2 + 1.6, 1.6, 0.25, 0.08), new THREE.MeshStandardMaterial({color: new THREE.Color(TH.banner), roughness: 0.5}));
  ban.position.set(0, gh - 1.1, 0); gant.add(ban);
  [0.14, -0.14].forEach((z, k) => { const p = new THREE.Mesh(new THREE.PlaneGeometry(hw * 2 + 1.4, 1.45), new THREE.MeshLambertMaterial({map: bannerTex(TH.banner)})); p.position.set(0, gh - 1.1, z); if (k) p.rotation.y = Math.PI; gant.add(p); });
  addMesh(gant, rboxGeo(4.2, 1.1, 0.7, 0.2), dark, 0, gh + 0.85, 0);
  t.lights = [];
  for (let i = 0; i < 5; i++) {
    const m = new THREE.MeshStandardMaterial({color: 0x330000, emissive: 0x000000, emissiveIntensity: 3, roughness: 0.3});
    [-1, 1].forEach(s => addMesh(gant, sphGeo(0.3, 16, 12), m, -1.6 + i * 0.8, gh + 0.85, s * 0.36));
    t.lights.push(m);
  }
  t.flags = [];
  [-1, 1].forEach(s => {
    const fx = s * (hw + 3.4);
    addMesh(gant, cylGeo(0.1, 0.1, 6, 8), postM, fx, 3, -1.8);
    const geo = new THREE.PlaneGeometry(2.6, 1.7, 16, 8); geo.translate(1.3, 0, 0);
    const f = new THREE.Mesh(geo, new THREE.MeshLambertMaterial({map: checkTex, side: THREE.DoubleSide}));
    f.position.set(fx, 5.1, -1.8); f.rotation.y = s > 0 ? 0 : Math.PI; f.castShadow = true; f.userData.keep = true; gant.add(f);
    t.flags.push({geo, base: geo.attributes.position.array.slice()});
  });
  // ---- toy spectators by the start ----
  t.fans = [];
  const skin = std(0xffd166, 0.35), shirtC = [0xe63946, 0x3a86ff, 0x06d6a0, 0x9b5de5, 0xff8c42, 0xf4f1ea];
  for (let k = 0; k < 7; k++) {
    const i = (k * 5 - 14 + N) % N, q = P[i], n = Nr[i], side = k % 2 ? 1 : -1, off = hw + 2.2 + (k % 3) * 1.0;
    const x = q.x + n.x * side * off, z = q.z + n.z * side * off;
    if (blocked(x, z, 1) || ownTrackNear(t, x, z, 0.5)) continue;
    const f = new THREE.Group(); f.position.set(x, 0, z); f.scale.setScalar(0.6); f.rotation.y = Math.atan2(-n.x * side, -n.z * side); g.add(f);
    const shirt = std(shirtC[k % shirtC.length], 0.35);
    [-0.32, 0.32].forEach(dx => addMesh(f, rboxGeo(0.55, 1.3, 0.7, 0.08), std(0x1d3557, 0.4), dx, 0.65, 0));
    addMesh(f, rboxGeo(1.4, 1.3, 0.75, 0.12), shirt, 0, 1.95, 0);
    const arms = [];
    [-1, 1].forEach(s => { const pv = new THREE.Group(); pv.position.set(s * 0.82, 2.45, 0); f.add(pv); addMesh(pv, rboxGeo(0.34, 1.2, 0.4, 0.12), shirt, 0, -0.5, 0); addMesh(pv, sphGeo(0.2), skin, 0, -1.15, 0); arms.push(pv); });
    addMesh(f, cylGeo(0.45, 0.45, 0.85, 20), skin, 0, 3.05, 0);
    addMesh(f, cylGeo(0.22, 0.22, 0.25, 12), skin, 0, 3.55, 0);
    [-0.16, 0.16].forEach(dx => addMesh(f, sphGeo(0.06), std(0x111111), dx, 3.12, 0.44));
    f.userData.keep = true; mergeStatic(f, new Set(arms)); arms.forEach(a => mergeStatic(a));
    t.fans.push({f, arms, ph: k * 1.3});
  }
  // ---- chevron signs on the outside of tight corners ----
  for (const ci of t.corners) {
    const q = P[ci], n = Nr[ci], s = Math.sign(t.turn[ci]) || 1, ap = T[(ci - 18 + N) % N];
    const x = q.x - n.x * s * (hw + 2.4), z = q.z - n.z * s * (hw + 2.4);
    if (blocked(x, z, 0.6) || ownTrackNear(t, x, z, 0.6)) continue;
    const sg = new THREE.Group(); sg.position.set(x, H[ci], z); sg.rotation.y = Math.atan2(-ap.x, -ap.z); g.add(sg);
    [-1.4, 1.4].forEach(dx => addMesh(sg, cylGeo(0.09, 0.09, 2.6 + H[ci], 8), postM, dx, 1.3 - H[ci] / 2, -0.05));
    const b = new THREE.Mesh(new THREE.PlaneGeometry(4, 1.5), new THREE.MeshLambertMaterial({map: chevTex, side: THREE.DoubleSide}));
    b.position.y = 2.2; if (s < 0) b.scale.x = -1; sg.add(b);
  }
  // ---- book ramp ----
  if (t.rampI != null) {
    const i0 = t.ramp0, i1 = (t.ramp0 + t.rampLen) % N, a = P[i0], b = P[i1], hb = H[i0];
    const mid = {x: (a.x + b.x) / 2, z: (a.z + b.z) / 2}, ang = Math.atan2(b.x - a.x, b.z - a.z);
    const len = Math.hypot(b.x - a.x, b.z - a.z), slope = Math.atan2(RAMP_H, len);
    const rg2 = new THREE.Group(); rg2.position.set(mid.x, hb, mid.z); rg2.rotation.y = ang; g.add(rg2);
    const book = new THREE.Group(); book.position.set(0, RAMP_H / 2 + TRACK_Y - 0.12, 0); book.rotation.x = -slope; rg2.add(book);
    addMesh(book, rboxGeo(hw * 2 + 0.6, 0.24, len / Math.cos(slope) + 0.4, 0.08), std(0x6a4c93, 0.45), 0, 0, 0);
    addMesh(book, new THREE.BoxGeometry(hw * 2 + 0.2, 0.18, len / Math.cos(slope)), lam(0xfdfaf0), 0, -0.18, 0);
    addMesh(rg2, rboxGeo(hw * 2 + 0.8, RAMP_H, 2.4, 0.15), std(0xe9c46a, 0.45), 0, RAMP_H / 2 - 0.12, len / 2 - 1.0);
  }
  mergeStatic(g);
  t.mini = document.createElement('canvas'); t.mini.width = t.mini.height = 190;
  drawTrackMap(t.mini.getContext('2d'), t, 190, 190, 14);
  return (trackGroups[t.id] = g);
}

function mapFit(t, w, h, pad){
  let x0 = 1e9, x1 = -1e9, z0 = 1e9, z1 = -1e9;
  for (const q of t.P) { x0 = Math.min(x0, q.x); x1 = Math.max(x1, q.x); z0 = Math.min(z0, q.z); z1 = Math.max(z1, q.z); }
  const s = Math.min((w - pad * 2) / (x1 - x0), (h - pad * 2) / (z1 - z0));
  const ox = (w - (x1 - x0) * s) / 2, oz = (h - (z1 - z0) * s) / 2;
  return (x, z) => [ox + (x - x0) * s, oz + (z - z0) * s];
}
// Map drawn low-to-high so bridges sit visibly on top of the road they cross.
function drawTrackMap(g, t, w, h, pad){
  const f = mapFit(t, w, h, pad), N = t.N, CH = 10, chunks = [];
  for (let i = 0; i < N; i += CH) { let hs = 0; for (let k = 0; k <= CH; k++) hs += t.H[(i + k) % N]; chunks.push({i, h: hs / (CH + 1)}); }
  chunks.sort((a, b) => a.h - b.h);
  const col = '#' + new THREE.Color(t.theme.road).getHexString(), hi = t.theme.neon ? '#ff5a7a' : col;
  g.clearRect(0, 0, w, h); g.lineJoin = 'round'; g.lineCap = 'round';
  const seg = c => { g.beginPath(); for (let k = 0; k <= CH; k++) { const q = t.P[(c.i + k) % N], [x, y] = f(q.x, q.z); k ? g.lineTo(x, y) : g.moveTo(x, y); } };
  // ground level first, then raised track on top; outline pass then colour pass so the line stays solid
  for (const level of [chunks.filter(c => c.h <= 2), chunks.filter(c => c.h > 2)]) {
    for (const c of level) { seg(c); g.strokeStyle = '#000'; g.lineWidth = 11; g.stroke(); }
    for (const c of level) { seg(c); g.strokeStyle = c.h > 2 ? hi : col; g.lineWidth = 6; g.stroke(); if (c.h > 2) { g.strokeStyle = '#ffffff55'; g.lineWidth = 2; g.stroke(); } }
  }
  const [sx, sy] = f(t.P[0].x, t.P[0].z), n = t.Nr[0];
  g.strokeStyle = '#fff'; g.lineWidth = 3; g.beginPath(); g.moveTo(sx - n.x * 7, sy - n.z * 7); g.lineTo(sx + n.x * 7, sy + n.z * 7); g.stroke();
  t.mapF = t.mapF || {}; t.mapF[w] = f;
}

function updateTrackFX(t, time){
  if (!t || !t.flags) return;
  for (const fl of t.flags) {
    const p = fl.geo.attributes.position, b = fl.base;
    for (let i = 0; i < p.count; i++) { const x = b[i * 3]; p.array[i * 3 + 2] = Math.sin(x * 2.4 - time * 7) * 0.22 * (x / 2.6); }
    p.needsUpdate = true; fl.geo.computeVertexNormals();
  }
  for (const f of t.fans) {
    const cheer = race && (race.finished || race.count <= 0 && race.time < 1.5);
    f.arms.forEach((a, k) => { a.rotation.z = (k ? 1 : -1) * (cheer ? 2.6 + Math.sin(time * 14 + f.ph) * 0.4 : 0.15 + Math.sin(time * 2 + f.ph + k) * 0.1); });
    f.f.position.y = cheer ? Math.abs(Math.sin(time * 9 + f.ph)) * 0.5 : 0;
  }
}
