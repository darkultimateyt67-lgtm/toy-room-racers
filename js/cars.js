// ============ CAR SYSTEM: materials, wheels, suspension, animation ============
const CM = {
  glass:  new THREE.MeshPhysicalMaterial({color: 0x0c1520, metalness: 0.1, roughness: 0.02, clearcoat: 1, clearcoatRoughness: 0.02, transparent: true, opacity: 0.74, envMapIntensity: 2.4}),
  bubble: new THREE.MeshPhysicalMaterial({color: 0xbfdcff, metalness: 0, roughness: 0.02, transparent: true, opacity: 0.22, clearcoat: 1, depthWrite: false, side: THREE.DoubleSide}),
  chrome: new THREE.MeshStandardMaterial({color: 0xf6f6f6, metalness: 1, roughness: 0.1}),
  alu:    new THREE.MeshStandardMaterial({color: 0xb8bfc8, metalness: 0.9, roughness: 0.3}),
  gun:    new THREE.MeshStandardMaterial({color: 0x4a4f57, metalness: 0.8, roughness: 0.35}),
  black:  new THREE.MeshStandardMaterial({color: 0x16171b, roughness: 0.55}),
  plastic:new THREE.MeshStandardMaterial({color: 0x26282e, roughness: 0.45}),
  white:  new THREE.MeshStandardMaterial({color: 0xf3f3f3, roughness: 0.35}),
  red:    new THREE.MeshStandardMaterial({color: 0xd0262c, roughness: 0.35}),
  yellow: new THREE.MeshStandardMaterial({color: 0xffc83d, roughness: 0.35}),
  blueM:  new THREE.MeshStandardMaterial({color: 0x2f6fe0, roughness: 0.35}),
  leather:new THREE.MeshStandardMaterial({color: 0x7a3e1d, roughness: 0.65}),
  engine: new THREE.MeshStandardMaterial({color: 0x535960, metalness: 0.65, roughness: 0.42}),
  engRed: new THREE.MeshStandardMaterial({color: 0xb3261e, metalness: 0.3, roughness: 0.35}),
  belt:   new THREE.MeshStandardMaterial({color: 0x101010, roughness: 0.8}),
  head:   new THREE.MeshStandardMaterial({color: 0xfffbe8, emissive: 0xfff0c0, emissiveIntensity: 2.6, roughness: 0.15}),
  amber:  new THREE.MeshStandardMaterial({color: 0xffa000, emissive: 0xff8800, emissiveIntensity: 1.2, roughness: 0.2}),
  seat:   new THREE.MeshPhysicalMaterial({color: 0x2a2b30, roughness: 0.8, sheen: 0.6, sheenRoughness: 0.5}),
  gauge:  new THREE.MeshStandardMaterial({color: 0x0a0f14, emissive: 0x7fe3ff, emissiveIntensity: 1.6, roughness: 0.2}),
  liner:  new THREE.MeshStandardMaterial({color: 0x101113, roughness: 0.95, side: THREE.DoubleSide}),
  seam:   new THREE.MeshStandardMaterial({color: 0x08080a, roughness: 0.8}),
  skin:   new THREE.MeshStandardMaterial({color: 0xf1c27d, roughness: 0.6}),
  suit:   new THREE.MeshStandardMaterial({color: 0x2b2d42, roughness: 0.6}),
  visor:  new THREE.MeshPhysicalMaterial({color: 0x111111, metalness: 0.6, roughness: 0.05, clearcoat: 1}),
};
CM.carbon = new THREE.MeshStandardMaterial({color: 0xffffff, roughness: 0.3, metalness: 0.3, map: canvasTex(64, 64, (g) => {
  for (let i = 0; i < 8; i++) for (let j = 0; j < 8; j++) { g.fillStyle = (i + j) % 2 ? '#2a2c31' : '#1a1b1f'; g.fillRect(i * 8, j * 8, 8, 8); g.fillStyle = '#ffffff10'; g.fillRect(i * 8, j * 8, (i + j) % 2 ? 8 : 2, (i + j) % 2 ? 2 : 8); }
}, [6, 6])});

// ---------- tyres: lathe profile with rounded shoulders and real tread ----------
function treadTex(kind){
  return canvasTex(1024, 256, (g, w, h) => {
    g.fillStyle = '#1c1c1e'; g.fillRect(0, 0, w, h);
    const sw = h * 0.12;
    g.fillStyle = '#232326'; g.fillRect(0, 0, w, sw); g.fillRect(0, h - sw, w, sw);
    g.font = `bold ${Math.round(sw * 0.55)}px sans-serif`; g.textBaseline = 'middle'; g.fillStyle = kind === 'slick' ? '#ffc83d' : '#5a5a5e';
    for (const yy of [sw * 0.42, h - sw * 0.42]) for (let i = 0; i < 2; i++) { g.save(); g.translate(i * w / 2 + 30, yy); if (yy > h / 2) g.scale(1, -1); g.fillText('TOY RACING  ★  205/55 R13', 0, 0); g.restore(); }
    if (kind === 'whitewall') { g.fillStyle = '#f4f1e8'; g.fillRect(0, sw * 0.25, w, sw * 0.5); g.fillRect(0, h - sw * 0.75, w, sw * 0.5); }
    if (kind === 'slick') { g.fillStyle = '#ffc83d'; g.fillRect(0, sw * 0.45, w, sw * 0.3); g.fillRect(0, h - sw * 0.75, w, sw * 0.3); return; }
    g.fillStyle = '#0c0c0d';
    if (kind === 'knobby') {
      for (let i = 0; i < 24; i++) { const x = i * w / 24; g.fillRect(x, sw, 6, h - 2 * sw); g.fillRect(x + 6, h / 2 - 3, w / 24 - 6, 6); g.fillRect(x + (i % 2 ? 4 : 10), sw + 8, 3, h - 2 * sw - 16); }
    } else {
      [0.32, 0.5, 0.68].forEach(v => g.fillRect(0, h * v - 2, w, 4));
      for (let i = 0; i < 48; i++) { const x = i * w / 48; g.save(); g.translate(x, h / 2); g.rotate(0.35); g.fillRect(-1, -h * 0.36, 3, h * 0.2); g.fillRect(-1, h * 0.16, 3, h * 0.2); g.restore(); }
    }
  }, [1, 1]);
}
const TREAD = {};
function tyreMat(kind){
  if (!TREAD[kind]) { const t = treadTex(kind); t.wrapS = THREE.RepeatWrapping; t.repeat.set(kind === 'knobby' ? 1 : 2, 1); TREAD[kind] = new THREE.MeshStandardMaterial({map: t, roughness: 0.9, metalness: 0}); }
  return TREAD[kind];
}
const _tyre = {};
function tyreGeo(r, w, rimR){
  const key = [r, w, rimR].join('|'); if (_tyre[key]) return _tyre[key];
  const hw = w / 2, b = Math.min(hw * 0.55, (r - rimR) * 0.55), pts = [];
  pts.push(new V2(rimR, -hw * 0.92));
  for (let k = 0; k <= 6; k++) { const t = k / 6; pts.push(new V2(lerp(rimR, r - b, t), -hw + Math.sin(t * Math.PI) * 0.015 * -1)); }
  for (let k = 1; k <= 6; k++) { const a = k / 6 * Math.PI / 2; pts.push(new V2(r - b + Math.sin(a) * b, -hw + b - Math.cos(a) * b)); }
  for (let k = 1; k <= 5; k++) pts.push(new V2(r + Math.sin(k / 6 * Math.PI) * 0.01, lerp(-hw + b, hw - b, k / 6)));
  pts.push(new V2(r, hw - b));
  for (let k = 1; k <= 6; k++) { const a = k / 6 * Math.PI / 2; pts.push(new V2(r - b + Math.cos(a) * b, hw - b + Math.sin(a) * b)); }
  for (let k = 1; k <= 6; k++) { const t = k / 6; pts.push(new V2(lerp(r - b, rimR, t), hw)); }
  pts.push(new V2(rimR, hw * 0.92));
  const g = new THREE.LatheGeometry(pts, 40);
  // remap v: sidewalls get a radial band, the tread gets the middle of the texture
  const p = g.attributes.position, uv = g.attributes.uv;
  for (let i = 0; i < p.count; i++) {
    const ax = p.getY(i), rad = Math.hypot(p.getX(i), p.getZ(i));
    let v;
    if (rad < r - b * 0.98) { const f = clamp((rad - rimR) / (r - b - rimR), 0, 1) * 0.12; v = ax < 0 ? f : 1 - f; }
    else v = 0.12 + 0.76 * clamp((ax + hw) / w, 0, 1);
    uv.setY(i, v);
  }
  g.rotateZ(Math.PI / 2);
  g.computeVertexNormals();
  return (_tyre[key] = g);
}

// ---------- rims ----------
function makeRim(style, R, w, car){
  const g = new THREE.Group(), face = w / 2 - 0.035;
  const ax = (geo, mat, x, rx = 0, ry = 0, rz = Math.PI / 2) => addMesh(g, geo, mat, x, 0, 0, rx, ry, rz);
  const barrelMat = style === 'chrome' || style === 'mesh' ? CM.chrome : CM.alu;
  ax(cylGeo(R, R, w * 0.86, 28, true), new THREE.MeshStandardMaterial({color: 0x2a2c30, metalness: 0.6, roughness: 0.4, side: THREE.DoubleSide}), 0);
  ax(new THREE.TorusGeometry(R * 0.98, R * 0.06, 8, 32), barrelMat, face, 0, Math.PI / 2, 0);
  const spoke = (n, wid, mat, twist = 0) => {
    for (let i = 0; i < n; i++) {
      const a = i / n * Math.PI * 2, s = new THREE.Mesh(rboxGeo(0.03, R * 0.78, wid, Math.min(0.012, wid / 2.2)), mat);
      s.position.set(face - 0.01, Math.cos(a) * R * 0.5, Math.sin(a) * R * 0.5); s.rotation.x = a + twist; g.add(s);
    }
  };
  if (style === 'spoke5') { spoke(5, R * 0.32, CM.alu, 0.18); }
  else if (style === 'mesh') { spoke(10, R * 0.12, CM.chrome, 0.35); spoke(10, R * 0.12, CM.chrome, -0.35); }
  else if (style === 'deep') { ax(cylGeo(R * 0.92, R * 0.92, 0.02, 28), CM.black, face - 0.04); spoke(6, R * 0.22, CM.gun, 0.4); }
  else if (style === 'steel') { ax(cylGeo(R * 0.94, R * 0.94, 0.03, 28), car.paint, face - 0.03); for (let i = 0; i < 6; i++) { const a = i / 6 * Math.PI * 2; addMesh(g, cylGeo(R * 0.12, R * 0.12, 0.035, 12), CM.black, face - 0.02, Math.cos(a) * R * 0.62, Math.sin(a) * R * 0.62, 0, 0, Math.PI / 2); } ax(sphGeo(R * 0.42, 20, 10), CM.chrome, face - 0.05).scale.set(0.35, 1, 1); }
  else if (style === 'chrome') { ax(cylGeo(R * 0.94, R * 0.94, 0.03, 28), CM.engRed, face - 0.03); ax(sphGeo(R * 0.55, 24, 12), CM.chrome, face - 0.04).scale.set(0.4, 1, 1); }
  else if (style === 'wire') { spoke(18, R * 0.05, CM.chrome, 0.55); spoke(18, R * 0.05, CM.chrome, -0.55); ax(new THREE.TorusGeometry(R * 0.3, R * 0.05, 6, 20), CM.chrome, face - 0.02, 0, Math.PI / 2, 0); for (let i = 0; i < 2; i++) addMesh(g, rboxGeo(0.03, R * 0.7, R * 0.12, 0.01), CM.chrome, face + 0.03, 0, 0, i * Math.PI / 2 + Math.PI / 4, 0, 0); }
  else if (style === 'aero') { ax(cylGeo(R * 0.95, R * 0.95, 0.03, 32), CM.alu, face - 0.03); ax(cylGeo(R * 0.7, R * 0.7, 0.035, 32), CM.gun, face - 0.025); for (let i = 0; i < 5; i++) { const a = i / 5 * Math.PI * 2; addMesh(g, rboxGeo(0.04, R * 0.42, R * 0.13, 0.02), CM.black, face - 0.01, Math.cos(a) * R * 0.74, Math.sin(a) * R * 0.74, a, 0, 0); } }
  else if (style === 'center') { spoke(10, R * 0.13, CM.gun, 0.25); ax(cylGeo(R * 0.3, R * 0.3, 0.07, 6), CM.red, face + 0.01); }
  else if (style === 'beadlock') { ax(cylGeo(R * 0.95, R * 0.95, 0.03, 28), CM.gun, face - 0.03); for (let i = 0; i < 6; i++) { const a = i / 6 * Math.PI * 2; addMesh(g, cylGeo(R * 0.16, R * 0.16, 0.04, 14), CM.black, face - 0.02, Math.cos(a) * R * 0.55, Math.sin(a) * R * 0.55, 0, 0, Math.PI / 2); } for (let i = 0; i < 16; i++) { const a = i / 16 * Math.PI * 2; addMesh(g, cylGeo(0.016, 0.016, 0.04, 6), CM.chrome, face, Math.cos(a) * R * 0.86, Math.sin(a) * R * 0.86, 0, 0, Math.PI / 2); } }
  // centre hub and wheel nuts
  ax(cylGeo(R * 0.22, R * 0.26, 0.05, 20), style === 'deep' ? CM.red : CM.chrome, face);
  if (style !== 'deep' && style !== 'center' && style !== 'wire') for (let i = 0; i < 5; i++) { const a = i / 5 * Math.PI * 2; addMesh(g, cylGeo(0.014, 0.014, 0.06, 6), CM.chrome, face + 0.01, Math.cos(a) * R * 0.15, Math.sin(a) * R * 0.15, 0, 0, Math.PI / 2); }
  return g;
}

// ---------- wheel assembly: knuckle (steers) > mirror > spin (rolls) ----------
function addWheel(car, o){
  const side = o.x >= 0 ? 1 : -1, rimR = o.r * (o.rimF || 0.62);
  const k = new THREE.Group(); k.position.set(o.x, o.r, o.z); car.root.add(k);
  const mir = new THREE.Group(); mir.scale.x = side; k.add(mir);
  const spin = new THREE.Group(); mir.add(spin);
  addMesh(spin, tyreGeo(o.r, o.w, rimR), tyreMat(o.tread || 'street'));
  spin.add(makeRim(o.rim || 'spoke5', rimR, o.w, car));
  // brake disc spins, caliper stays put
  const disc = addMesh(spin, cylGeo(rimR * 0.8, rimR * 0.8, 0.035, 28), car.discMat, o.w / 2 - 0.13, 0, 0, 0, 0, Math.PI / 2);
  const cal = addMesh(mir, rboxGeo(0.07, rimR * 0.55, rimR * 0.35, 0.02), o.caliper || CM.red, o.w / 2 - 0.1, rimR * 0.48, -rimR * 0.36);
  cal.rotation.x = -0.6;
  const w = {k, spin, r: o.r, x: o.x, z: o.z, front: !!o.front, side, w: o.w, last: null};
  car.wheels.push(w);
  return w;
}

// ---------- coil-over springs that really compress ----------
const _coil = {};
function coilGeo(R, turns, wire){
  const key = R + '|' + turns + '|' + wire; if (_coil[key]) return _coil[key];
  const pts = []; for (let i = 0; i <= turns * 16; i++) { const a = i / 16 * Math.PI * 2; pts.push(new V3(Math.cos(a) * R, i / (turns * 16), Math.sin(a) * R)); }
  return (_coil[key] = new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), turns * 24, wire, 6, false));
}
function addCoilover(car, top, bottom, R = 0.07, mat){
  const g = new THREE.Group(); car.root.add(g);
  const spr = new THREE.Mesh(coilGeo(R, 6, R * 0.16), mat || CM.yellow); spr.castShadow = false; g.add(spr);
  const body = new THREE.Mesh(cylGeo(R * 0.55, R * 0.55, 0.5, 12), CM.alu); body.position.y = 0.75; g.add(body);
  const rod = new THREE.Mesh(cylGeo(R * 0.25, R * 0.25, 0.5, 8), CM.chrome); rod.position.y = 0.25; g.add(rod);
  car.springs.push({g, top: new V3(...top), bottom: new V3(...bottom), spr, body, rod});
}

// ---------- exhaust flames ----------
function makeFlames(car){
  for (const e of car.exh) {
    const g = new THREE.Group(); g.position.copy(e.p);
    g.quaternion.setFromUnitVectors(new V3(0, 1, 0), e.d.clone().normalize());
    const outerM = new THREE.MeshBasicMaterial({color: 0xff7a1a, transparent: true, opacity: 0.85, blending: THREE.AdditiveBlending, depthWrite: false, toneMapped: false});
    const innerM = new THREE.MeshBasicMaterial({color: 0xfff1b0, transparent: true, opacity: 0.95, blending: THREE.AdditiveBlending, depthWrite: false, toneMapped: false});
    const cg = new THREE.ConeGeometry(1, 1, 14, 1, true); cg.translate(0, 0.5, 0);
    const outer = new THREE.Mesh(cg, outerM), inner = new THREE.Mesh(cg, innerM);
    outer.renderOrder = inner.renderOrder = 6;
    g.add(outer, inner); g.visible = false; car.chassis.add(g);
    const mk = new THREE.Object3D(); mk.position.copy(e.p); car.chassis.add(mk);
    e.flame = {g, outer, inner, outerM, innerM}; e.mark = mk; e.size = e.size || 1;
  }
}

// ---------- helpers used by the model builders ----------
function profShape(cmds){
  const s = new THREE.Shape();
  for (const c of cmds) {
    const [k, ...a] = c;
    if (k === 'm') s.moveTo(a[0], a[1]);
    else if (k === 'l') s.lineTo(a[0], a[1]);
    else if (k === 'q') s.quadraticCurveTo(a[0], a[1], a[2], a[3]);
    else if (k === 'b') s.bezierCurveTo(a[0], a[1], a[2], a[3], a[4], a[5]);
    else if (k === 'arch') {
      const [cz, cy, R, yb] = a, a0 = yb > cy ? Math.asin(Math.min(1, (yb - cy) / R)) : 0;
      s.lineTo(cz - R * Math.cos(a0), yb); s.absarc(cz, cy, R, Math.PI - a0, a0, true); s.lineTo(cz + R * Math.cos(a0), yb);
    }
  }
  return s;
}
// Extrude a side profile (z,y) across the car's width (x), round every edge, then taper.
function extrudeX(shape, width, bevel = 0.05, taper = null, curveSeg = 20){
  const depth = Math.max(0.002, width - 2 * bevel);
  const g = new THREE.ExtrudeGeometry(shape, {depth, bevelEnabled: true, bevelThickness: bevel, bevelSize: bevel, bevelSegments: 4, curveSegments: curveSeg});
  g.rotateY(-Math.PI / 2); g.translate(depth / 2, 0, 0);
  if (taper) { const p = g.attributes.position; for (let i = 0; i < p.count; i++) p.setX(i, taper(p.getX(i), p.getY(i), p.getZ(i))); }
  return smoothGeo(g);
}
function makeTaper(L, yMin, yMax, top, front, rear){
  return (x, y, z) => {
    const hy = clamp((y - yMin) / (yMax - yMin), 0, 1), zn = (z + L / 2) / L;
    return x * (1 - top * hy * hy) * (1 - front * smooth(0.72, 1.02, zn) - rear * smooth(0.28, -0.02, zn));
  };
}
function tube(parent, pts, r, mat, seg = 32){
  const m = new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts.map(p => new V3(p[0], p[1], p[2]))), seg, r, 8, false), mat);
  m.castShadow = true; parent.add(m); return m;
}
function RB(parent, w, h, d, r, mat, x, y, z, rx = 0, ry = 0, rz = 0){ return addMesh(parent, rboxGeo(w, h, d, r), mat, x, y, z, rx, ry, rz); }
function headlamp(parent, x, y, z, r, bezel = CM.chrome){
  addMesh(parent, cylGeo(r, r, 0.04, 20), CM.head, x, y, z, Math.PI / 2, 0, 0);
  addMesh(parent, new THREE.TorusGeometry(r, r * 0.18, 8, 24), bezel, x, y, z + 0.01);
}
function plate(parent, z, y, text, ry = 0){
  const t = canvasTex(128, 48, (g, w, h) => { g.fillStyle = '#f5f2e8'; g.fillRect(0, 0, w, h); g.strokeStyle = '#333'; g.lineWidth = 4; g.strokeRect(3, 3, w - 6, h - 6); g.fillStyle = '#222'; g.font = 'bold 30px sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(text, w / 2, h / 2 + 2); });
  const m = new THREE.Mesh(new THREE.PlaneGeometry(0.36, 0.13), new THREE.MeshStandardMaterial({map: t, roughness: 0.4}));
  m.position.set(0, y, z); m.rotation.y = ry; parent.add(m); return m;
}
function decal(parent, w, h, draw, x, y, z, ry){
  const t = canvasTex(256, Math.round(256 * h / w), draw);
  const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshStandardMaterial({map: t, transparent: true, roughness: 0.3, polygonOffset: true, polygonOffsetFactor: -2}));
  m.position.set(x, y, z); m.rotation.y = ry; parent.add(m); return m;
}
function exhaustTip(car, p, d, r = 0.045, size = 1){
  const q = new THREE.Quaternion().setFromUnitVectors(new V3(0, 1, 0), new V3(...d).normalize());
  const tip = addMesh(car.chassis, cylGeo(r, r * 0.9, 0.16, 16, true), new THREE.MeshStandardMaterial({color: 0xe8e8e8, metalness: 1, roughness: 0.15, side: THREE.DoubleSide}), ...p);
  tip.quaternion.copy(q);
  const inner = addMesh(car.chassis, cylGeo(r * 0.8, r * 0.8, 0.02, 12), CM.black, ...p); inner.quaternion.copy(q); inner.translateY(-0.02);
  car.exh.push({p: new V3(...p).add(new V3(...d).normalize().multiplyScalar(0.08)), d: new V3(...d), size});
}
function driver(parent, x, y, z, helmetMat){
  const g = new THREE.Group(); g.position.set(x, y, z); parent.add(g);
  RB(g, 0.32, 0.3, 0.22, 0.08, CM.suit, 0, 0.15, 0);
  const head = new THREE.Group(); head.position.y = 0.42; g.add(head);
  addMesh(head, sphGeo(0.15, 24, 18), helmetMat || CM.white, 0, 0, 0);
  const v = addMesh(head, new THREE.SphereGeometry(0.152, 24, 10, Math.PI / 2 - 0.9, 1.8, 1.15, 0.55), CM.visor, 0, 0, 0); v.rotation.y = 0;
  return head;
}

// ============ BUILD + ANIMATE ============
const BUILD = {};
function buildCar(def, paint){
  const car = {def, root: new THREE.Group(), chassis: new THREE.Group(), wheels: [], springs: [], spin: [], flaps: [], shakers: [],
    exh: [], sway: [], blink: [], keep: [], anim: [], siren: null, wing: null, drs: null, driverHead: null, shafts: [],
    susp: {p: 0, pv: 0, r: 0, rv: 0, h: 0, hv: 0}, freq: 9, damp: 0.35, t: Math.random() * 10, brakeHeat: 0};
  car.root.rotation.order = 'YXZ';
  car.root.add(car.chassis);
  car.paint = new THREE.MeshPhysicalMaterial({color: paint, metalness: 0.45, roughness: 0.3, clearcoat: 1, clearcoatRoughness: 0.05});
  car.tailMat = new THREE.MeshStandardMaterial({color: 0x5a0000, emissive: 0xff1a1a, emissiveIntensity: 0.8, roughness: 0.25});
  car.discMat = new THREE.MeshStandardMaterial({color: 0x8a8d92, metalness: 0.85, roughness: 0.35, emissive: 0xff3300, emissiveIntensity: 0});
  BUILD[def.id](car);
  makeFlames(car);
  batchCar(car);
  return car;
}

// Fold every non-moving part into a few draw calls; moving parts stay separate.
function batchCar(car){
  const keep = new Set([...car.keep, ...car.spin.map(p => p.o), ...car.flaps.map(f => f.o), ...car.sway.map(s => s.o), ...car.shakers.map(e => e.o),
    car.drs, car.wing && car.wing.o, car.wing && car.wing.flap, car.driverHead, ...car.shafts,
    ...car.exh.map(e => e.flame.g), ...car.springs.map(s => s.g), ...car.wheels.flatMap(w => [w.k, w.spin, w.spin.parent])].filter(Boolean));
  for (const o of keep) if (o.children && o.children.length && !car.springs.some(s => s.g === o) && !car.exh.some(e => e.flame.g === o)) mergeStatic(o, keep);
  mergeStatic(car.chassis, keep);
  keep.add(car.chassis);
  mergeStatic(car.root, keep);
}

const _v = new V3(), _q = new THREE.Quaternion(), _up = new V3(0, 1, 0);
// s: {speed, steer, throttle, brake, rpm, rpmN, boost, aLong, aLat, air, bump, backfire, dt}
function animateCar(car, s, dt){
  car.t += dt;
  const t = car.t;
  // wheels roll and steer
  for (const w of car.wheels) {
    w.spin.rotation.x += s.speed / w.r * dt;
    if (w.front) w.k.rotation.y = s.steer * 0.42;
  }
  car.brakeHeat = clamp(car.brakeHeat + (s.brake * Math.abs(s.speed) * 0.02 - 0.25) * dt, 0, 1);
  car.discMat.emissiveIntensity = car.brakeHeat * 3;
  // body on springs: squat, dive, lean, bounce
  const S = car.susp, w0 = car.freq, z = car.damp;
  const pT = clamp(-s.aLong * 0.0045, -0.09, 0.09) + (s.revTwistP || 0);
  const rT = clamp(s.aLat * 0.0042, -0.11, 0.11) + clamp(s.throttle * (s.rpmN || 0) * 0.025 * (Math.abs(s.speed) < 1 ? 1 : 0.2), 0, 0.03);
  const acc = (x, v, tgt) => -w0 * w0 * (x - tgt) - 2 * z * w0 * v;
  S.pv += acc(S.p, S.pv, pT) * dt; S.p += S.pv * dt;
  S.rv += acc(S.r, S.rv, rT) * dt; S.r += S.rv * dt;
  if (s.bump) S.hv -= s.bump;
  S.hv += acc(S.h, S.hv, s.air ? 0.06 : 0) * dt; S.h += S.hv * dt;
  const idle = 1 - (s.rpmN || 0);
  const vib = (0.004 + s.throttle * 0.003) * (0.4 + idle * 0.8);
  car.chassis.position.set(Math.sin(t * 61) * vib * 0.5, S.h + Math.sin(t * 47 + Math.sin(t * 9) * 2) * vib, 0);
  car.chassis.rotation.set(S.p, 0, S.r);
  car.chassis.updateMatrix();
  // coil-overs follow the body
  for (const sp of car.springs) {
    _v.copy(sp.top).applyMatrix4(car.chassis.matrix);
    const d = _v.sub(sp.bottom), len = d.length();
    sp.g.position.copy(sp.bottom);
    sp.g.quaternion.setFromUnitVectors(_up, d.divideScalar(len));
    sp.spr.scale.set(1, len * 0.86, 1); sp.spr.position.y = len * 0.07;
    sp.body.position.y = len - 0.25; sp.rod.position.y = len * 0.45; sp.rod.scale.y = len * 0.9 / 0.5;
  }
  // engine parts spin with the revs, scoops flap with the throttle, block rocks on its mounts
  const rpm = s.rpm || 0;
  for (const p of car.spin) p.o.rotation[p.ax] += rpm * p.k * dt * 0.0045;
  for (const f of car.flaps) f.o.rotation.x = f.base - (s.throttle * 0.9 + 0.1) * f.amp + Math.sin(t * 40) * 0.03 * s.throttle;
  for (const e of car.shakers) {
    const lope = e.lope ? Math.max(0, Math.sin(t * 9) * Math.sin(t * 13)) * idle : 0;
    e.o.position.x = e.base.x + Math.sin(t * 71) * (0.004 + lope * 0.012);
    e.o.position.y = e.base.y + Math.sin(t * 53) * (0.003 + lope * 0.008);
    e.o.rotation.z = s.throttle * 0.06 * (0.6 + idle) + Math.sin(t * 37) * 0.012 * idle + lope * 0.03;
  }
  for (const sh of car.shafts) sh.rotation.z += s.speed * dt * 4;
  // exhaust: smoke, backfire flames, nitro and jet flames
  const fl = s.backfire || 0, boost = s.boost;
  for (const e of car.exh) {
    const F = e.flame;
    let f = 0, blue = false;
    if (isJet(car.def)) { f = 0.35 + s.throttle * 0.7 + (boost ? 0.7 : 0); blue = boost || car.def.engine !== 'jet'; }
    else if (boost) { f = 0.9 + Math.random() * 0.3; blue = true; }
    else if (fl > 0) f = fl * (0.6 + Math.random() * 0.7);
    F.g.visible = f > 0.03;
    if (F.g.visible) {
      const len = 0.35 * e.size * f * (0.8 + Math.random() * 0.4), wid = 0.06 * e.size * (0.7 + f * 0.6);
      F.outer.scale.set(wid, len, wid); F.inner.scale.set(wid * 0.55, len * 0.65, wid * 0.55);
      F.outerM.color.setHex(blue ? 0x3a7bff : 0xff7a1a).multiplyScalar(3); F.innerM.color.setHex(blue ? 0xbfe6ff : 0xfff1b0).multiplyScalar(4);
    }
    e.acc = (e.acc || 0) + dt * (isJet(car.def) ? 0 : (2 + s.throttle * 9 * (1 - (s.rpmN || 0) * 0.4)));
    if (e.acc > 1 || fl > 0.5 && Math.random() < 0.5) {
      e.acc = 0;
      e.mark.getWorldPosition(_v);
      _q.setFromRotationMatrix(e.mark.matrixWorld);
      const dir = e.d.clone().applyQuaternion(_q).normalize();
      if (fl > 0.5) puff(_v.x, _v.y, _v.z, {vx: dir.x * 3, vy: dir.y * 3 + 0.5, vz: dir.z * 3, life: 0.25, s0: 0.15, s1: 0.5, a: 0.9, color: 0xffa64d, add: true, drag: 4});
      else puff(_v.x, _v.y, _v.z, {vx: dir.x * 1.5, vy: 0.6 + dir.y, vz: dir.z * 1.5, life: 1.1, s0: 0.12, s1: 0.9 + s.throttle * 0.6, a: 0.16 + s.throttle * 0.18, color: s.throttle > 0.7 && (s.rpmN || 0) < 0.4 ? 0x6b6b6b : 0xcfcfcf, drag: 1.2});
    }
  }
  car.tailMat.emissiveIntensity = 0.8 + s.brake * 4;
  if (car.siren) { const ph = Math.floor(t * 7) % 4; car.siren[0].emissiveIntensity = ph < 2 ? (ph === 0 ? 7 : 0.4) : 0.15; car.siren[1].emissiveIntensity = ph >= 2 ? (ph === 2 ? 7 : 0.4) : 0.15; }
  for (const b of car.blink) b.emissiveIntensity = Math.sin(t * 12) > 0 ? 5 : 0.1;
  if (car.wing) { const W = car.wing; W.o.position.y = lerp(W.o.position.y, W.y0 + clamp(Math.abs(s.speed) / 25, 0, 1) * 0.16, dt * 4); W.flap.rotation.x = lerp(W.flap.rotation.x, -s.brake * 0.9, dt * 8); }
  if (car.drs) car.drs.rotation.x = lerp(car.drs.rotation.x, boost ? -0.7 : 0, dt * 10);
  for (const sw of car.sway) {
    const tx = clamp(-s.aLong * 0.012, -0.5, 0.5), tz = clamp(s.aLat * 0.012, -0.5, 0.5);
    sw.vx += (-(sw.o.rotation.x - tx) * 60 - sw.vx * 3) * dt; sw.o.rotation.x += sw.vx * dt;
    sw.vz += (-(sw.o.rotation.z - tz) * 60 - sw.vz * 3) * dt; sw.o.rotation.z += sw.vz * dt;
    if (s.bump) sw.vx += s.bump * 4;
  }
  for (const f of car.anim) f(s, t, dt);
  if (car.driverHead) { car.driverHead.rotation.z = lerp(car.driverHead.rotation.z, clamp(-s.aLat * 0.01, -0.3, 0.3), dt * 6); car.driverHead.rotation.y = lerp(car.driverHead.rotation.y, s.steer * 0.35, dt * 5); }
}
