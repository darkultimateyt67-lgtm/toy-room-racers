// ============ THE BEDROOM (big: 170 x 170 units ≈ 6 m square at toy scale) ============
const ROOM = 85, WALL_H = 72;
const colliders = [];
const ceilings = [];   // undersides the camera must stay below (bed frame, desk top)
const solid = (x, z, hw, hd) => colliders.push({x, z, hw, hd});
function blocked(x, z, r){
  if (Math.abs(x) > ROOM - r || Math.abs(z) > ROOM - r) return true;
  for (const b of colliders) if (Math.abs(x - b.x) < b.hw + r && Math.abs(z - b.z) < b.hd + r) return true;
  return false;
}
const room = new THREE.Group(); scene.add(room);
// Box-project UVs so wood grain / fabric wraps any shape (rounded boxes included).
function projectUV(g, s = 0.1){
  if (g.userData.uvS === s) return g;
  const p = g.attributes.position, n = g.attributes.normal, uv = new Float32Array(p.count * 2);
  for (let i = 0; i < p.count; i++) {
    const ax = Math.abs(n.getX(i)), ay = Math.abs(n.getY(i)), az = Math.abs(n.getZ(i));
    const x = p.getX(i), y = p.getY(i), z = p.getZ(i);
    if (ax >= ay && ax >= az) { uv[i * 2] = z * s; uv[i * 2 + 1] = y * s; }
    else if (ay >= az) { uv[i * 2] = x * s; uv[i * 2 + 1] = z * s; }
    else { uv[i * 2] = x * s; uv[i * 2 + 1] = y * s; }
  }
  g.setAttribute('uv', new THREE.BufferAttribute(uv, 2)); g.userData.uvS = s;
  return g;
}
// rounded box sitting on y (bottom), centred on x,z
function rb(w, h, d, r, mat, x, y, z, ry = 0, parent = room){
  const g = rboxGeo(w, h, d, r);
  if (mat.map) projectUV(g, 1 / 24);
  return addMesh(parent, g, mat, x, y + h / 2, z, 0, ry, 0);
}

// ---------- textures ----------
function woodCanvas(base, w = 512, h = 512, plank = 0){
  return canvasTex(w, h, (g) => {
    g.fillStyle = base; g.fillRect(0, 0, w, h);
    for (let i = 0; i < 260; i++) {
      const y = srnd() * h, a = 0.04 + srnd() * 0.08;
      g.strokeStyle = `rgba(${srnd() < 0.5 ? '60,30,10' : '255,230,200'},${a})`; g.lineWidth = 1 + srnd() * 2.5;
      g.beginPath(); g.moveTo(0, y);
      for (let x = 0; x <= w; x += 32) g.lineTo(x, y + Math.sin(x * 0.012 + i) * 6 + Math.sin(x * 0.05 + i * 3) * 1.5);
      g.stroke();
    }
    for (let k = 0; k < 4; k++) { const x = srnd() * w, y = srnd() * h; const gr = g.createRadialGradient(x, y, 1, x, y, 18); gr.addColorStop(0, 'rgba(70,35,10,0.5)'); gr.addColorStop(1, 'rgba(70,35,10,0)'); g.fillStyle = gr; g.beginPath(); g.ellipse(x, y, 26, 10, 0, 0, 7); g.fill(); }
  }, [1, 1]);
}
const WOOD = {};
function woodMat(base, rough = 0.5){
  if (WOOD[base]) return WOOD[base];
  const t = woodCanvas(base); t.wrapS = t.wrapT = THREE.RepeatWrapping;
  const bump = dataTex(t, null, v => v); bump.wrapS = bump.wrapT = THREE.RepeatWrapping;
  return (WOOD[base] = new THREE.MeshPhysicalMaterial({map: t, bumpMap: bump, bumpScale: 0.6, roughness: rough, clearcoat: 0.35, clearcoatRoughness: 0.35}));
}

// ---------- floor: varnished planks with real gaps, grain bump and glossy sheen ----------
const floorTex = canvasTex(2048, 2048, (g, w, h) => {
  const rows = 10, rh = h / rows;
  for (let r = 0; r < rows; r++) {
    let x = -srnd() * 500;
    while (x < w) {
      const len = 420 + srnd() * 520, v = (srnd() - 0.5) * 30;
      g.fillStyle = `rgb(${172 + v},${118 + v * 0.8},${72 + v * 0.6})`;
      g.fillRect(x, r * rh, len, rh);
      for (let k = 0; k < 14; k++) {
        const yy = r * rh + 6 + srnd() * (rh - 12);
        g.strokeStyle = `rgba(${srnd() < 0.6 ? '80,40,15' : '235,200,160'},${0.06 + srnd() * 0.1})`; g.lineWidth = 1 + srnd() * 3;
        g.beginPath(); g.moveTo(x, yy);
        g.bezierCurveTo(x + len * 0.3, yy + srnd() * 12 - 6, x + len * 0.7, yy + srnd() * 12 - 6, x + len, yy); g.stroke();
      }
      if (srnd() < 0.3) { const kx = x + len * srnd(), ky = r * rh + rh / 2; const gr = g.createRadialGradient(kx, ky, 1, kx, ky, 16); gr.addColorStop(0, 'rgba(60,30,10,0.6)'); gr.addColorStop(1, 'rgba(60,30,10,0)'); g.fillStyle = gr; g.beginPath(); g.ellipse(kx, ky, 20, 9, 0, 0, 7); g.fill(); }
      g.fillStyle = 'rgba(30,15,5,0.75)'; g.fillRect(x, r * rh, 4, rh);
      x += len;
    }
    g.fillStyle = 'rgba(30,15,5,0.8)'; g.fillRect(0, r * rh + rh - 4, w, 4);
  }
}, [3, 3]);
const floorBump = dataTex(floorTex, [3, 3], v => v);
const floorRough = dataTex(floorTex, [3, 3], v => 0.55 - v * 0.35);
const floor = new THREE.Mesh(new THREE.PlaneGeometry(ROOM * 2, ROOM * 2),
  new THREE.MeshPhysicalMaterial({map: floorTex, bumpMap: floorBump, bumpScale: 1.2, roughnessMap: floorRough, roughness: 1, clearcoat: 0.5, clearcoatRoughness: 0.18}));
floor.rotation.x = -Math.PI / 2; floor.receiveShadow = true; room.add(floor);

// ---------- walls, skirting, ceiling ----------
const wallTex = canvasTex(512, 512, (g, w, h) => {
  g.fillStyle = '#d3e6da'; g.fillRect(0, 0, w, h);
  g.fillStyle = '#c6ddd0'; for (let i = 0; i < 8; i++) g.fillRect(i * 64, 0, 30, h);
  g.fillStyle = 'rgba(255,255,255,0.65)';
  for (let i = 0; i < 10; i++) { const x = (i * 131) % w + 16, y = (i * 211) % h + 14; g.beginPath(); for (let k = 0; k < 10; k++) { const a = k * Math.PI / 5 - Math.PI / 2, rr = k % 2 ? 4 : 9; g.lineTo(x + Math.cos(a) * rr, y + Math.sin(a) * rr); } g.fill(); }
  for (let i = 0; i < 3000; i++) { g.fillStyle = `rgba(0,0,0,${srnd() * 0.04})`; g.fillRect(srnd() * w, srnd() * h, 2, 2); }
}, [10, 4]);
const wallMat = new THREE.MeshStandardMaterial({map: wallTex, bumpMap: dataTex(wallTex, [10, 4], v => v), bumpScale: 0.3, roughness: 0.92});
[[0, -ROOM, 0], [0, ROOM, Math.PI], [-ROOM, 0, Math.PI / 2], [ROOM, 0, -Math.PI / 2]].forEach(([x, z, r]) => {
  const w = new THREE.Mesh(new THREE.PlaneGeometry(ROOM * 2, WALL_H), wallMat);
  w.position.set(x, WALL_H / 2, z); w.rotation.y = r; w.receiveShadow = true; room.add(w);
  const sk = addMesh(room, rboxGeo(ROOM * 2, 3.2, 1.2, 0.4), std(0xfbf8f2, 0.4), x, 1.6, z, 0, r, 0); sk.translateZ(0.3);
  const sk2 = addMesh(room, rboxGeo(ROOM * 2, 0.5, 1.5, 0.22), std(0xfbf8f2, 0.4), x, 3.3, z, 0, r, 0); sk2.translateZ(0.3);
});
const ceil = new THREE.Mesh(new THREE.PlaneGeometry(ROOM * 2, ROOM * 2), lam(0xf8f5ef));
ceil.rotation.x = Math.PI / 2; ceil.position.y = WALL_H; room.add(ceil);
// pendant lamp
addMesh(room, cylGeo(0.15, 0.15, 14, 8), std(0x222222, 0.5), 0, WALL_H - 7, 0);
const shadeP = []; for (let i = 0; i <= 16; i++) { const t = i / 16; shadeP.push(new V2(1.2 + Math.pow(t, 1.4) * 8, -t * 6)); }
addMesh(room, new THREE.LatheGeometry(shadeP, 40), new THREE.MeshStandardMaterial({color: 0xf4efe6, roughness: 0.6, side: THREE.DoubleSide}), 0, WALL_H - 13.5, 0);
addMesh(room, sphGeo(1.6), new THREE.MeshStandardMaterial({color: 0xfff2d0, emissive: 0xfff0c8, emissiveIntensity: 3}), 0, WALL_H - 18, 0);

// ---------- window (north wall): sash frame, sill, sky, folded curtains, radiator ----------
const WIN = {x: -4, y: 40, w: 36, h: 34, z: -ROOM};
(function(){
  const sky = canvasTex(1024, 768, (g, w, h) => {
    const gr = g.createLinearGradient(0, 0, 0, h); gr.addColorStop(0, '#4f9be6'); gr.addColorStop(0.75, '#bfe3ff'); gr.addColorStop(1, '#e8f6ff');
    g.fillStyle = gr; g.fillRect(0, 0, w, h);
    g.fillStyle = 'rgba(255,255,255,0.92)';
    [[180, 160, 1.2], [640, 110, 1.6], [860, 300, 0.9], [380, 330, 0.8]].forEach(([x, y, s]) => { for (let k = 0; k < 6; k++) { g.beginPath(); g.arc(x + k * 30 * s, y + Math.sin(k * 2) * 12 * s, 36 * s, 0, 7); g.fill(); } });
    g.fillStyle = '#7dbb68'; g.beginPath(); g.moveTo(0, h); for (let x = 0; x <= w; x += 16) g.lineTo(x, h - 120 - Math.sin(x * 0.006) * 50 - Math.sin(x * 0.03) * 12); g.lineTo(w, h); g.fill();
    g.fillStyle = '#4f8f45'; for (let i = 0; i < 16; i++) { const x = 30 + i * 64, y = h - 150 - Math.sin(x * 0.006) * 50; g.beginPath(); g.arc(x, y, 26 + (i % 3) * 8, 0, 7); g.fill(); g.fillRect(x - 4, y, 8, 40); }
    g.fillStyle = '#e8e0d0'; g.fillRect(620, h - 210, 90, 60); g.fillStyle = '#c0504d'; g.beginPath(); g.moveTo(610, h - 210); g.lineTo(665, h - 250); g.lineTo(720, h - 210); g.fill();
  });
  const glassM = new THREE.MeshBasicMaterial({map: sky}); glassM.color.setScalar(1.35);  // brighter than white: the window glows
  const glass = new THREE.Mesh(new THREE.PlaneGeometry(WIN.w, WIN.h), glassM);
  glass.position.set(WIN.x, WIN.y, WIN.z + 0.05); room.add(glass);
  const fr = std(0xffffff, 0.35);
  const {x, y, w, h, z} = WIN;
  addMesh(room, rboxGeo(w + 3, 1.8, 2, 0.5), fr, x, y + h / 2 + 0.9, z + 0.8);
  addMesh(room, rboxGeo(w + 6, 1.4, 5, 0.6), fr, x, y - h / 2 - 0.7, z + 2.2);
  addMesh(room, rboxGeo(1.8, h, 2, 0.5), fr, x - w / 2 - 0.9, y, z + 0.8);
  addMesh(room, rboxGeo(1.8, h, 2, 0.5), fr, x + w / 2 + 0.9, y, z + 0.8);
  addMesh(room, rboxGeo(1.1, h, 1.2, 0.3), fr, x, y, z + 0.6);
  addMesh(room, rboxGeo(w, 1.1, 1.2, 0.3), fr, x, y + 4, z + 0.6);
  addMesh(room, cylGeo(0.4, 0.4, 0.8, 12), std(0xd4af37, 0.3, 1), x + 1, y + 2, z + 1.3, Math.PI / 2, 0, 0);
  const chrome = std(0xd8d8d8, 0.22, 1);
  addMesh(room, cylGeo(0.45, 0.45, w + 26, 16), chrome, x, y + h / 2 + 5, z + 3.5, 0, 0, Math.PI / 2);
  [-1, 1].forEach(s => addMesh(room, sphGeo(1), chrome, x + s * (w / 2 + 13), y + h / 2 + 5, z + 3.5));
  for (let i = 0; i < 14; i++) { const s = i < 7 ? -1 : 1, k = i % 7; addMesh(room, new THREE.TorusGeometry(0.75, 0.12, 6, 16), chrome, x + s * (w / 2 + 2 + k * 1.5), y + h / 2 + 5, z + 3.5, 0, Math.PI / 2, 0); }
  const curtTex = canvasTex(128, 512, (g, cw, ch) => { g.fillStyle = '#d9604a'; g.fillRect(0, 0, cw, ch); g.fillStyle = '#efa15a'; for (let yy = 0; yy < ch; yy += 64) g.fillRect(0, yy, cw, 18); for (let i = 0; i < 400; i++) { g.fillStyle = `rgba(0,0,0,${srnd() * 0.05})`; g.fillRect(srnd() * cw, srnd() * ch, 2, 6); } }, [1, 3]);
  const curtMat = new THREE.MeshPhysicalMaterial({map: curtTex, side: THREE.DoubleSide, roughness: 0.9, sheen: 1, sheenRoughness: 0.5, sheenColor: new THREE.Color(0xffc9a8)});
  [-1, 1].forEach(s => {
    const cw = 11, ch = h + 18, geo = new THREE.PlaneGeometry(cw, ch, 64, 12), p = geo.attributes.position;
    for (let i = 0; i < p.count; i++) { const px = p.getX(i), py = p.getY(i), bunch = 1 + (ch / 2 - py) / ch * 0.6; p.setZ(i, Math.sin(px * 1.9) * 0.9 * bunch); p.setX(i, px * (0.85 + (ch / 2 - py) / ch * 0.3)); }
    geo.computeVertexNormals();
    const c = new THREE.Mesh(geo, curtMat); c.castShadow = true; c.receiveShadow = true;
    c.position.set(x + s * (w / 2 + 6.5), y + h / 2 + 4 - ch / 2, z + 3.6); room.add(c);
  });
  // radiator under the window, fins and pipes
  const rad = std(0xf6f6f2, 0.35, 0.2);
  for (let i = 0; i < 18; i++) addMesh(room, rboxGeo(1.4, 14, 2.6, 0.6), rad, x - 15.5 + i * 1.82, 12, z + 2.4);
  addMesh(room, cylGeo(0.5, 0.5, 34, 12), rad, x, 5.6, z + 2.4, 0, 0, Math.PI / 2);
  addMesh(room, cylGeo(0.5, 0.5, 34, 12), rad, x, 18.6, z + 2.4, 0, 0, Math.PI / 2);
  addMesh(room, cylGeo(0.35, 0.35, 5, 10), chrome, x - 18, 3, z + 2.4);
  addMesh(room, rboxGeo(1.4, 1.4, 1.4, 0.4), std(0xffffff, 0.3), x - 18, 5.6, z + 2.4);
  solid(x, z + 2.4, 17.5, 1.6);
  // a little dust floating in the sunbeam
  const dn = 160, dp = new Float32Array(dn * 3);
  for (let i = 0; i < dn; i++) { const t = srnd() * 40; dp[i * 3] = x + (srnd() - 0.5) * w * 0.8 - SUN_DIR.x * t; dp[i * 3 + 1] = y + (srnd() - 0.5) * h * 0.8 - SUN_DIR.y * t; dp[i * 3 + 2] = z + 3 - SUN_DIR.z * t; }
  const dg = new THREE.BufferGeometry(); dg.setAttribute('position', new THREE.BufferAttribute(dp, 3));
  const dust = new THREE.Points(dg, new THREE.PointsMaterial({map: softTex, color: 0xfff1d6, size: 0.18, transparent: true, opacity: 0.3, depthWrite: false, blending: THREE.AdditiveBlending}));
  dust.userData.keep = true; room.add(dust); room.userData.dust = dust;
})();

// ---------- bed (north-west) on legs — you can race underneath ----------
(function(){
  const wood = woodMat('#9a6440'), cx = -67, cz = -55, W = 36, L = 60, legH = 7;
  const legP = []; for (let i = 0; i <= 12; i++) { const t = i / 12; legP.push(new V2(1.1 + Math.sin(t * Math.PI * 2) * 0.18 + (t < 0.1 ? 0.3 : 0), t * legH)); }
  const legG = new THREE.LatheGeometry(legP, 20);
  [[-1, -1], [1, -1], [-1, 0], [1, 0], [-1, 1], [1, 1]].forEach(([sx, sz]) => {
    const x = cx + sx * (W / 2 - 1.6), z = cz + sz * (L / 2 - 1.6);
    addMesh(room, legG, wood, x, 0, z); solid(x, z, 1.4, 1.4);
  });
  rb(W, 4, L, 0.8, wood, cx, legH, cz);
  ceilings.push({x0: cx - W / 2, x1: cx + W / 2, z0: cz - L / 2, z1: cz + L / 2, y: legH});
  addMesh(room, new THREE.PlaneGeometry(W - 2, L - 2), lam(0x2a1d14), cx, legH + 0.02, cz, Math.PI / 2, 0, 0);
  rb(W - 1, 6, L - 1, 2.2, fabric(0xf7f4ee), cx, legH + 4, cz);
  // patchwork quilt with stitching, draped over the sides with folds
  const quiltTex = canvasTex(1024, 1024, (g, w, h) => {
    const cols = ['#3d5a80', '#98c1d9', '#ee6c4d', '#e0fbfc', '#f4d35e', '#5b8e7d'];
    for (let i = 0; i < 8; i++) for (let j = 0; j < 8; j++) {
      g.fillStyle = cols[(i * 3 + j * 5) % cols.length]; g.fillRect(i * 128, j * 128, 128, 128);
      if ((i + j) % 3 === 0) { g.fillStyle = 'rgba(255,255,255,0.25)'; for (let k = 0; k < 4; k++) { g.beginPath(); g.arc(i * 128 + 32 + (k % 2) * 64, j * 128 + 32 + Math.floor(k / 2) * 64, 12, 0, 7); g.fill(); } }
      g.strokeStyle = 'rgba(255,255,255,0.55)'; g.lineWidth = 3; g.setLineDash([10, 7]); g.strokeRect(i * 128 + 7, j * 128 + 7, 114, 114);
    }
  });
  const qMat = fabric(0xffffff, quiltTex);
  const qy = legH + 10;
  const top = new THREE.Mesh(new THREE.PlaneGeometry(W + 1, L * 0.7, 30, 30), qMat);
  const tp = top.geometry.attributes.position;
  for (let i = 0; i < tp.count; i++) tp.setZ(i, Math.sin(tp.getX(i) * 0.5) * Math.sin(tp.getY(i) * 0.4) * 0.25);
  top.geometry.computeVertexNormals();
  top.rotation.x = -Math.PI / 2; top.position.set(cx, qy + 0.3, cz + L * 0.15); top.receiveShadow = true; room.add(top);
  const drape = (len, x, z, ry) => {
    const geo = new THREE.PlaneGeometry(len, 9, 80, 6), p = geo.attributes.position;
    for (let i = 0; i < p.count; i++) { const xx = p.getX(i), yy = p.getY(i), f = (4.5 - yy) / 9; p.setZ(i, Math.sin(xx * 1.2) * 0.55 * f + f * f * 0.8); }
    geo.computeVertexNormals();
    const m = new THREE.Mesh(geo, new THREE.MeshPhysicalMaterial({map: quiltTex, side: THREE.DoubleSide, roughness: 0.95, sheen: 1, sheenRoughness: 0.45}));
    m.position.set(x, qy - 4.2, z); m.rotation.y = ry; m.castShadow = true; m.receiveShadow = true; room.add(m);
  };
  drape(L * 0.7, cx + W / 2 + 0.6, cz + L * 0.15, Math.PI / 2);
  drape(W + 1, cx, cz + L / 2 + 0.6, 0);
  [-8, 8].forEach(dx => { const p = addMesh(room, sphGeo(1, 36, 24), fabric(0xffffff), cx + dx, qy + 1.6, cz - L / 2 + 6); p.scale.set(7.2, 1.8, 4); });
  // curved headboard
  const s = new THREE.Shape(); s.moveTo(-W / 2 - 1, 0); s.lineTo(W / 2 + 1, 0); s.lineTo(W / 2 + 1, 26); s.quadraticCurveTo(W / 2 + 1, 29, W / 2 - 2, 29.5); s.quadraticCurveTo(0, 36, -W / 2 + 2, 29.5); s.quadraticCurveTo(-W / 2 - 1, 29, -W / 2 - 1, 26); s.lineTo(-W / 2 - 1, 0);
  const hg = new THREE.ExtrudeGeometry(s, {depth: 1.4, bevelEnabled: true, bevelThickness: 0.5, bevelSize: 0.5, bevelSegments: 4, curveSegments: 32});
  addMesh(room, projectUV(smoothGeo(hg), 1 / 24), woodMat('#7d4f30'), cx, 0, -ROOM + 0.8);
  // plush bunny
  const pink = fabric(0xf6c1cc);
  const bx = cx + 9, by = qy + 0.6, bz = cz - 6;
  addMesh(room, sphGeo(2.3, 28, 20), pink, bx, by + 2.2, bz).scale.set(1, 1.15, 0.9);
  addMesh(room, sphGeo(1.6, 28, 20), pink, bx, by + 5.4, bz);
  [-0.65, 0.65].forEach(dx => { const e = addMesh(room, sphGeo(0.55), pink, bx + dx, by + 7.7, bz); e.scale.set(0.75, 2.3, 0.5); });
  [-0.55, 0.55].forEach(dx => addMesh(room, sphGeo(0.18), std(0x111111, 0.2), bx + dx, by + 5.7, bz + 1.4));
})();

// ---------- desk + chair (north-east) ----------
const deskLamp = new THREE.PointLight(0xffcf8a, 90, 0, 2);
(function(){
  const wood = woodMat('#b07a52'), cx = 46, cz = -75.5, top = 20, W = 36, D = 19;
  rb(W, 1.8, D, 0.5, wood, cx, top, cz);
  ceilings.push({x0: cx - W / 2, x1: cx + W / 2, z0: cz - D / 2, z1: cz + D / 2, y: top});
  [[29.5, -83.5], [62.5, -83.5], [29.5, -67.5], [62.5, -67.5]].forEach(([x, z]) => {
    addMesh(room, cylGeo(1.0, 0.8, top, 18), wood, x, top / 2, z);
    addMesh(room, cylGeo(1.15, 1.15, 0.5, 18), std(0x222222, 0.5), x, 0.25, z);
    solid(x, z, 1.2, 1.2);
  });
  addMesh(room, projectUV(rboxGeo(31, 2, 1, 0.4), 1 / 24), wood, cx, 14, -83.5);
  RBdrawer(cx + 10, top - 3.5, cz);
  function RBdrawer(x, y, z){ addMesh(room, projectUV(rboxGeo(12, 3.6, D - 1, 0.3), 1 / 24), wood, x, y, z); addMesh(room, rboxGeo(4, 0.6, 0.8, 0.25), std(0xc9a14a, 0.25, 1), x, y, z + D / 2); }
  const y0 = top + 1.8;
  // articulated desk lamp + its light
  const metal = std(0x2a9d8f, 0.3, 0.6);
  addMesh(room, cylGeo(2.4, 2.8, 0.8, 32), metal, 58, y0 + 0.4, -81);
  const a1 = addMesh(room, cylGeo(0.28, 0.28, 10, 12), metal, 58, y0 + 5.2, -79.4); a1.rotation.x = 0.35;
  addMesh(room, sphGeo(0.6), metal, 58, y0 + 9.8, -77.7);
  const a2 = addMesh(room, cylGeo(0.26, 0.26, 8, 12), metal, 55.6, y0 + 11.2, -75.6); a2.rotation.z = 1.05; a2.rotation.x = 0.4;
  const shadePts = []; for (let i = 0; i <= 16; i++) { const t = i / 16; shadePts.push(new V2(0.8 + Math.pow(t, 1.6) * 3.3, -t * 3.6)); }
  const shade = addMesh(room, new THREE.LatheGeometry(shadePts, 32), new THREE.MeshStandardMaterial({color: 0x2a9d8f, roughness: 0.3, metalness: 0.6, side: THREE.DoubleSide}), 52.6, y0 + 13, -74.4);
  shade.rotation.z = 0.5;
  addMesh(room, sphGeo(1.1), new THREE.MeshStandardMaterial({color: 0xfff1c9, emissive: 0xfff1c9, emissiveIntensity: 4}), 52.1, y0 + 10.8, -74.4);
  deskLamp.position.set(51.8, y0 + 9.8, -74); scene.add(deskLamp);
  // laptop with a racing game on screen
  const scr = canvasTex(512, 320, (g, w, h) => {
    g.fillStyle = '#1b1f3b'; g.fillRect(0, 0, w, h);
    g.lineWidth = 26; g.strokeStyle = '#ff7a1a'; g.beginPath(); g.ellipse(w / 2, h / 2 + 10, 170, 95, 0, 0, 7); g.stroke();
    g.fillStyle = '#ffb627'; g.font = 'bold 44px sans-serif'; g.fillText('TOY GP', 30, 60);
    g.fillStyle = '#e63946'; g.fillRect(w / 2 + 120, h / 2 - 30, 26, 14); g.fillStyle = '#3a86ff'; g.fillRect(w / 2 - 150, h / 2 + 50, 26, 14);
  });
  const lx = 38, lz = -76, alu = std(0xc5c9d1, 0.3, 0.85);
  addMesh(room, rboxGeo(13, 0.6, 9, 0.25), alu, lx, y0 + 0.3, lz);
  addMesh(room, new THREE.PlaneGeometry(11, 4.5), std(0x22252c, 0.6), lx, y0 + 0.62, lz + 0.6, -Math.PI / 2, 0, 0);
  const lid = new THREE.Group(); lid.position.set(lx, y0 + 0.6, lz - 4.4); lid.rotation.x = -0.28; room.add(lid);
  addMesh(lid, rboxGeo(13, 8.6, 0.4, 0.2), alu, 0, 4.3, 0);
  const sm = new THREE.Mesh(new THREE.PlaneGeometry(12, 7.6), new THREE.MeshStandardMaterial({map: scr, emissive: 0xffffff, emissiveMap: scr, emissiveIntensity: 1.1, roughness: 0.2}));
  sm.position.set(0, 4.35, 0.21); lid.add(sm);
  // pencil cup + pencils
  addMesh(room, cylGeo(1.6, 1.4, 4, 24, true), new THREE.MeshPhysicalMaterial({color: 0xe63946, roughness: 0.3, clearcoat: 0.8, side: THREE.DoubleSide}), 31, y0 + 2, -81);
  [0xffd166, 0x06d6a0, 0x3a86ff, 0x9b5de5].forEach((c, i) => {
    const p = new THREE.Group(); p.position.set(31 + Math.cos(i * 1.6) * 0.7, y0 + 4.2, -81 + Math.sin(i * 1.6) * 0.7);
    p.rotation.set(Math.sin(i) * 0.25, 0, Math.cos(i) * 0.25); room.add(p);
    addMesh(p, cylGeo(0.24, 0.24, 6, 6), std(c, 0.45), 0, 0, 0);
    addMesh(p, cylGeo(0.0, 0.24, 0.8, 6), std(0xf1d3a1, 0.7), 0, 3.4, 0);
  });
  [[0x264653, 0], [0xe9c46a, 0.15], [0xe76f51, -0.1]].forEach(([c, r], i) => { const b = rb(8, 1.3, 5.6, 0.2, std(c, 0.6), 32.5, y0 + i * 1.3, -70.5, r); addMesh(room, new THREE.BoxGeometry(7.6, 1.0, 0.05), lam(0xfdfaf0), b.position.x, b.position.y, b.position.z + 2.81, 0, r, 0); });
  // trophy shelf above the desk
  rb(30, 1, 6, 0.3, wood, 46, 40, -82);
  [[0xd4af37, 38], [0xc0c0c0, 46], [0xcd7f32, 54]].forEach(([c, x], i) => {
    const m = std(c, 0.2, 1), s = 1 - i * 0.12;
    const tp = []; for (let k = 0; k <= 14; k++) { const t = k / 14; tp.push(new V2(t < 0.15 ? 1.6 * s : t < 0.45 ? (0.35 + (0.45 - t) * 2) * s : (0.4 + Math.sin((t - 0.45) / 0.55 * Math.PI * 0.5) * 1.6) * s, t * 6 * s)); }
    addMesh(room, new THREE.LatheGeometry(tp, 28), m, x, 41, -82);
    [-1, 1].forEach(d => addMesh(room, new THREE.TorusGeometry(0.8 * s, 0.15 * s, 8, 16, Math.PI), m, x + d * 2.1 * s, 45 * 1 + (s - 1) * 3, -82, 0, 0, d * -Math.PI / 2));
  });
  // chair facing the desk, with a cushion
  const cw = woodMat('#8a5a3b');
  [[42.2, -61.8], [49.8, -61.8], [42.2, -54.2], [49.8, -54.2]].forEach(([x, z]) => { addMesh(room, cylGeo(0.6, 0.5, 12.5, 14), cw, x, 6.25, z); solid(x, z, 0.7, 0.7); });
  rb(10, 1.2, 10, 0.5, cw, 46, 12.5, -58);
  rb(9, 1.3, 9, 0.6, fabric(0x3d405b), 46, 13.7, -58);
  addMesh(room, projectUV(rboxGeo(10, 11, 1.2, 0.5), 1 / 24), cw, 46, 20, -53.2, -0.08, 0, 0);
  [-3.8, 3.8].forEach(dx => addMesh(room, cylGeo(0.55, 0.55, 10, 12), cw, 46 + dx, 18, -53.6, -0.08, 0, 0));
})();

// ---------- bookshelf (east wall) ----------
(function(){
  const wood = woodMat('#8d5a3b'), cx = 80.5, cz = -10, W = 9, D = 24, H = 52;
  rb(W, H, 1, 0.25, wood, cx, 0, cz - D / 2 + 0.5);
  rb(W, H, 1, 0.25, wood, cx, 0, cz + D / 2 - 0.5);
  rb(0.8, H, D, 0.1, woodMat('#7a4a2e'), cx + W / 2 - 0.4, 0, cz);
  [0, 10.5, 21, 31.5, 42, 51].forEach(y => rb(W, 1, D, 0.25, wood, cx, y, cz));
  solid(cx, cz, W / 2, D / 2);
  const cols = [0xe63946, 0x457b9d, 0xf4a261, 0x2a9d8f, 0xe9c46a, 0x6d597a, 0x1d3557, 0xffb4a2, 0x8d99ae];
  [1, 11.5, 22, 32.5].forEach((y) => {
    let z = cz - D / 2 + 1.4;
    while (z < cz + D / 2 - 2.6) {
      const t = 0.9 + srnd() * 1.1, h = 6.4 + srnd() * 2.6, c = cols[Math.floor(srnd() * cols.length)];
      const lean = srnd() < 0.1 ? 0.2 : 0;
      const b = addMesh(room, rboxGeo(6.6, h, t, 0.14), std(c, 0.55), cx - 0.6, y + h / 2, z + t / 2, lean, 0, 0);
      addMesh(room, new THREE.BoxGeometry(0.03, h * 0.08, t * 0.86), std(0xf0e6c8, 0.3, 0.6), cx - 3.92, y + h * 0.75, z + t / 2, lean, 0, 0);
      addMesh(room, new THREE.BoxGeometry(0.03, h * 0.05, t * 0.86), std(0xf0e6c8, 0.3, 0.6), cx - 3.92, y + h * 0.25, z + t / 2, lean, 0, 0);
      z += t + 0.1 + lean * 3;
    }
  });
  // globe, robot and rocket on the top shelves
  const globeTex = canvasTex(512, 256, (g, w, h) => { g.fillStyle = '#2f6fd6'; g.fillRect(0, 0, w, h); g.fillStyle = '#5bba6f'; [[80, 80, 60, 44], [140, 170, 36, 52], [280, 90, 80, 44], [320, 170, 32, 28], [420, 160, 40, 30]].forEach(([x, y, a, b]) => { g.beginPath(); g.ellipse(x, y, a, b, 0.4, 0, 7); g.fill(); }); g.fillStyle = '#fff'; g.fillRect(0, 0, w, 14); g.fillRect(0, h - 14, w, 14); });
  const gy = 42.6;
  addMesh(room, cylGeo(1.6, 2, 0.6, 24), std(0x333333, 0.4), cx - 0.6, gy + 0.3, cz - 6);
  addMesh(room, cylGeo(0.2, 0.2, 3, 8), std(0xcfa448, 0.25, 1), cx - 0.6, gy + 1.8, cz - 6);
  const globe = addMesh(room, new THREE.SphereGeometry(2.8, 40, 24), new THREE.MeshPhysicalMaterial({map: globeTex, roughness: 0.4, clearcoat: 0.8}), cx - 0.6, gy + 5.8, cz - 6);
  globe.rotation.z = 0.4; globe.userData.keep = true; room.userData.globe = globe;
  addMesh(room, new THREE.TorusGeometry(3.1, 0.13, 8, 48, Math.PI * 1.3), std(0xcfa448, 0.25, 1), cx - 0.6, gy + 5.8, cz - 6, 0, Math.PI / 2, 2.2);
  const rob = plastic(0xadb5bd), ry = 42.6, rz = cz + 5;
  rb(3.4, 3.2, 2.6, 0.4, rob, cx - 0.6, ry, rz);
  rb(4.4, 4.2, 3.2, 0.5, plastic(0xe63946), cx - 0.6, ry + 3.2, rz);
  rb(3.2, 2.6, 2.6, 0.5, rob, cx - 0.6, ry + 7.4, rz);
  [-0.7, 0.7].forEach(d => addMesh(room, sphGeo(0.4), new THREE.MeshStandardMaterial({color: 0x29d3ff, emissive: 0x29d3ff, emissiveIntensity: 2}), cx - 1.95, ry + 8.8, rz + d));
  addMesh(room, cylGeo(0.08, 0.08, 1.6, 6), rob, cx - 0.6, ry + 10.8, rz);
  addMesh(room, sphGeo(0.32), plastic(0xffd166), cx - 0.6, ry + 11.7, rz);
  const rp = []; for (let i = 0; i <= 20; i++) { const t = i / 20; rp.push(new V2(Math.sin(t * Math.PI * 0.95 + 0.1) * 1.4 * (1 - t * 0.25), t * 9)); }
  addMesh(room, new THREE.LatheGeometry(rp, 32), plastic(0xf1f1f1), cx - 0.6, 32.5, cz + 7);
  addMesh(room, cylGeo(0.0, 0.7, 1.8, 24), plastic(0xe63946), cx - 0.6, 41.5 - 0.5, cz + 7);
  [0, 2.1, 4.2].forEach(a => addMesh(room, rboxGeo(0.15, 2.4, 1.6, 0.06), plastic(0xe63946), cx - 0.6 + Math.cos(a) * 1.4, 33.6, cz + 7 + Math.sin(a) * 1.4, 0, -a, 0));
})();

// ---------- wardrobe (east wall, south) ----------
(function(){
  const wood = woodMat('#c8a27a', 0.45), cx = 76.5, cz = 43, W = 17, D = 30, H = 62;
  rb(W, H, D, 0.6, wood, cx, 0, cz);
  rb(W + 1, 1.6, D + 1.4, 0.5, wood, cx, H, cz);
  rb(W + 0.4, 2.4, D + 0.4, 0.4, woodMat('#a07a52'), cx, 0, cz);
  [-1, 1].forEach(s => {
    const z = cz + s * D / 4;
    addMesh(room, projectUV(rboxGeo(0.5, H - 8, D / 2 - 1.2, 0.3), 1 / 24), wood, cx - W / 2 - 0.1, H / 2 + 1, z);
    [H * 0.3, H * 0.68].forEach(y => addMesh(room, projectUV(rboxGeo(0.5, H * 0.3, D / 2 - 4, 0.6), 1 / 24), woodMat('#bd9670', 0.45), cx - W / 2 - 0.35, y, z));
    addMesh(room, cylGeo(0.25, 0.25, 6, 12), std(0xd8d8d8, 0.2, 1), cx - W / 2 - 1.1, H / 2 + 2, cz + s * 1.6);
  });
  solid(cx, cz, W / 2 + 0.8, D / 2);
})();

// ---------- toy chest (south-west) ----------
(function(){
  const cx = -74, cz = 66, wood = woodMat('#3c8d82', 0.5);
  rb(20, 12, 13, 0.8, wood, cx, 0, cz);
  [2.5, 8.8].forEach(y => rb(20.3, 0.9, 13.3, 0.35, woodMat('#2f6f66', 0.5), cx, y, cz));
  [[-1, -1], [1, -1], [-1, 1], [1, 1]].forEach(([sx, sz]) => addMesh(room, rboxGeo(1.4, 12.2, 1.4, 0.3), std(0xc9a14a, 0.3, 1), cx + sx * 9.6, 6.1, cz + sz * 6.1));
  const lid = new THREE.Group(); lid.position.set(cx, 12, cz - 6.5); lid.rotation.x = -0.4; room.add(lid);
  addMesh(lid, projectUV(rboxGeo(20.6, 1.6, 13.6, 0.6), 1 / 24), woodMat('#264653', 0.5), 0, 0.8, 6.8);
  const starTex = canvasTex(256, 256, (g) => { g.fillStyle = '#ffd166'; g.beginPath(); for (let k = 0; k < 10; k++) { const a = k * Math.PI / 5 - Math.PI / 2, r = k % 2 ? 44 : 108; g.lineTo(128 + Math.cos(a) * r, 128 + Math.sin(a) * r); } g.fill(); });
  const st = new THREE.Mesh(new THREE.PlaneGeometry(7, 7), new THREE.MeshStandardMaterial({map: starTex, transparent: true, roughness: 0.4, polygonOffset: true, polygonOffsetFactor: -2}));
  st.position.set(cx, 5.8, cz - 6.52); st.rotation.y = Math.PI; room.add(st);
  addMesh(room, sphGeo(3, 32, 20), plastic(0xe63946), cx + 4, 12.6, cz + 1);
  addMesh(room, rboxGeo(4, 4, 4, 0.4), plastic(0xffd166), cx - 4, 13.4, cz + 1, 0.3, 0.5, 0.2);
  solid(cx, cz, 10, 6.5);
})();

// ---------- teddy bear (soft fabric with sheen) ----------
(function(){
  const fur = fabric(0xb07946), light = fabric(0xe2c09a), dark = std(0x2b1d14, 0.3);
  const g = new THREE.Group(); g.position.set(-77, 0, -12); g.rotation.y = Math.PI / 2; g.scale.setScalar(1.25); room.add(g);
  addMesh(g, sphGeo(3.4, 32, 24), fur, 0, 3.4, 0).scale.set(1, 1.1, 0.9);
  addMesh(g, sphGeo(2.1, 28, 20), light, 0, 3.2, 2.0).scale.set(1, 1.2, 0.5);
  addMesh(g, sphGeo(2.6, 32, 24), fur, 0, 8.6, 0.3);
  addMesh(g, sphGeo(1.15, 24, 16), light, 0, 8.0, 2.5).scale.set(1, 0.8, 0.8);
  addMesh(g, sphGeo(0.45), dark, 0, 8.4, 3.35).scale.set(1.2, 0.8, 0.8);
  [-1, 1].forEach(s => {
    addMesh(g, sphGeo(0.32), std(0x0a0a0a, 0.1), s * 0.95, 9.3, 2.25);
    addMesh(g, sphGeo(0.95, 20, 14), fur, s * 1.9, 10.7, 0).scale.set(1, 1, 0.55);
    addMesh(g, sphGeo(0.55), light, s * 1.9, 10.7, 0.35).scale.set(1, 1, 0.3);
    const arm = addMesh(g, sphGeo(1.1, 20, 14), fur, s * 3.4, 4.6, 0.7); arm.scale.set(0.9, 2.0, 0.9); arm.rotation.z = s * 0.5;
    addMesh(g, sphGeo(1.3, 20, 14), fur, s * 1.9, 1.3, 2.6).scale.set(1, 1, 1.7);
    addMesh(g, sphGeo(0.9), light, s * 1.9, 1.3, 4.6).scale.set(1, 1, 0.3);
  });
  [-1, 1].forEach(s => { const c = addMesh(g, cylGeo(0.0, 0.8, 1.4, 16), fabric(0xe63946), s * 0.75, 6.6, 2.4); c.rotation.z = s * Math.PI / 2; });
  addMesh(g, sphGeo(0.35), fabric(0xe63946), 0, 6.6, 2.5);
  solid(-77, -12, 4.6, 4.6);
})();

// ---------- bean bag (south-east) ----------
(function(){
  const geo = new THREE.SphereGeometry(11, 64, 40), p = geo.attributes.position;
  for (let i = 0; i < p.count; i++) {
    let x = p.getX(i), y = p.getY(i), z = p.getZ(i);
    y = y < 0 ? y * 0.45 : y * 0.62 - Math.max(0, 1 - Math.hypot(x - 2, z) / 7) * 3.2;
    const wr = 1 + Math.sin(Math.atan2(z, x) * 7 + y) * 0.025;
    p.setXYZ(i, x * wr * (1.08 - y / 40), y, z * wr);
  }
  geo.computeVertexNormals();
  const bb = new THREE.Mesh(geo, fabric(0x3a86ff)); bb.position.set(52, 4.9, 70); bb.castShadow = bb.receiveShadow = true; room.add(bb);
  solid(52, 70, 10, 10);
})();

// ---------- plant in the corner ----------
(function(){
  const pp = []; for (let i = 0; i <= 18; i++) { const t = i / 18; pp.push(new V2(3.6 + t * 1.8 + Math.sin(t * Math.PI) * 0.35, t * 9)); }
  pp.push(new V2(4.9, 9));
  addMesh(room, new THREE.LatheGeometry(pp, 40), new THREE.MeshStandardMaterial({color: 0xc8643b, roughness: 0.75, side: THREE.DoubleSide}), 77, 0, 77);
  addMesh(room, cylGeo(5.2, 5.2, 0.4, 32), lam(0x4a3426), 77, 8.3, 77);
  const leafS = new THREE.Shape(); leafS.moveTo(0, 0); leafS.quadraticCurveTo(2.3, 5, 0, 11); leafS.quadraticCurveTo(-2.3, 5, 0, 0);
  const leafMat = new THREE.MeshPhysicalMaterial({color: 0x3c8d40, side: THREE.DoubleSide, roughness: 0.5, clearcoat: 0.4});
  for (let i = 0; i < 18; i++) {
    const geo = new THREE.ShapeGeometry(leafS, 16), lp = geo.attributes.position;
    for (let k = 0; k < lp.count; k++) { const y = lp.getY(k), x = lp.getX(k); lp.setZ(k, y * y * 0.045 + x * x * 0.15); }
    geo.computeVertexNormals();
    const l = new THREE.Mesh(geo, leafMat); l.castShadow = true;
    l.position.set(77, 8.5, 77); l.rotation.set(-0.3 - (i % 3) * 0.22, i * 2.4, 0, 'YXZ'); room.add(l);
  }
  solid(77, 77, 5.4, 5.4);
})();

// ---------- door (west wall) ----------
(function(){
  const z = 22, x = -ROOM + 0.2, dw = woodMat('#e8d7bf', 0.5);
  addMesh(room, rboxGeo(0.8, 60, 30, 0.3), std(0xf4efe6, 0.4), x + 0.2, 30, z);
  addMesh(room, projectUV(rboxGeo(0.7, 58, 27, 0.2), 1 / 24), dw, x + 0.5, 29, z);
  [[13, 6.2], [13, -6.2], [-13, 6.2], [-13, -6.2]].forEach(([y, dz]) => addMesh(room, projectUV(rboxGeo(0.4, 21, 9, 0.5), 1 / 24), woodMat('#dcc8ab', 0.5), x + 0.85, 29 + y, z + dz));
  const ch = std(0xd8d8d8, 0.2, 1);
  addMesh(room, cylGeo(0.6, 0.6, 0.8, 16), ch, x + 1.2, 28, z + 10.5, 0, 0, Math.PI / 2);
  addMesh(room, rboxGeo(0.5, 0.5, 3.2, 0.2), ch, x + 1.7, 28, z + 9.3);
})();

// ---------- posters, clock, switches ----------
const clockHands = {};
(function(){
  const poster = (w, h, draw, x, y, z, ry) => {
    const t = canvasTex(512, Math.round(512 * h / w), draw);
    const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshStandardMaterial({map: t, roughness: 0.45}));
    m.position.set(x, y, z); m.rotation.y = ry; room.add(m);
    [[-1, 1], [1, 1]].forEach(([sx, sy]) => { const pin = addMesh(room, sphGeo(0.35), plastic(0xe63946), 0, 0, 0); pin.position.copy(m.position); pin.rotation.y = ry; pin.translateX(sx * (w / 2 - 0.8)); pin.translateY(sy * (h / 2 - 0.8)); pin.translateZ(0.15); });
  };
  poster(16, 23, (g, w, h) => {
    const gr = g.createLinearGradient(0, 0, 0, h); gr.addColorStop(0, '#ff7a1a'); gr.addColorStop(1, '#c1121f'); g.fillStyle = gr; g.fillRect(0, 0, w, h);
    g.fillStyle = '#fff'; g.font = 'bold 110px sans-serif'; g.textAlign = 'center'; g.fillText('TOY', w / 2, 140); g.fillText('GP', w / 2, 245);
    g.fillStyle = '#222'; g.beginPath(); g.ellipse(w / 2, 500, 180, 50, 0, 0, 7); g.fill();
    g.fillStyle = '#ffd166'; g.beginPath(); g.moveTo(80, 490); g.quadraticCurveTo(140, 400, 260, 410); g.quadraticCurveTo(380, 410, 430, 490); g.fill();
    g.fillStyle = '#111'; [160, 360].forEach(x => { g.beginPath(); g.arc(x, 500, 40, 0, 7); g.fill(); });
    g.font = 'bold 38px sans-serif'; g.fillStyle = '#fff'; g.fillText('WORLD CHAMPIONSHIP', w / 2, h - 40);
  }, ROOM - 0.05, 38, -48, -Math.PI / 2);
  poster(20, 14, (g, w, h) => {
    g.fillStyle = '#0d1b3e'; g.fillRect(0, 0, w, h);
    for (let i = 0; i < 120; i++) { g.fillStyle = '#ffffff' + (srnd() > 0.5 ? 'ff' : '88'); g.fillRect(srnd() * w, srnd() * h, 2, 2); }
    g.fillStyle = '#f4a261'; g.beginPath(); g.arc(140, 180, 76, 0, 7); g.fill();
    g.strokeStyle = '#e9c46a'; g.lineWidth = 10; g.beginPath(); g.ellipse(140, 180, 124, 28, -0.3, 0, 7); g.stroke();
    g.fillStyle = '#90e0ef'; g.beginPath(); g.arc(380, 100, 36, 0, 7); g.fill();
  }, -ROOM + 0.05, 46, -55, Math.PI / 2);
  poster(24, 15, (g, w, h) => {
    g.fillStyle = '#a8dadc'; g.fillRect(0, 0, w, h);
    g.fillStyle = '#7fb069'; [[100, 100, 80, 50], [140, 220, 40, 60], [280, 90, 90, 44], [300, 200, 30, 44], [420, 230, 44, 24]].forEach(([x, y, a, b]) => { g.beginPath(); g.ellipse(x, y, a, b, 0.3, 0, 7); g.fill(); });
    g.strokeStyle = '#ffffff66'; g.lineWidth = 2; for (let i = 1; i < 6; i++) { g.beginPath(); g.moveTo(i * w / 6, 0); g.lineTo(i * w / 6, h); g.stroke(); }
  }, -36, 38, ROOM - 0.05, Math.PI);
  const face = canvasTex(512, 512, (g) => {
    g.fillStyle = '#fffdf6'; g.beginPath(); g.arc(256, 256, 252, 0, 7); g.fill();
    g.fillStyle = '#222'; g.font = 'bold 60px sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle';
    for (let i = 1; i <= 12; i++) { const a = i * Math.PI / 6; g.fillText(i, 256 + Math.sin(a) * 192, 256 - Math.cos(a) * 192); }
    for (let i = 0; i < 60; i++) { const a = i * Math.PI / 30, r0 = i % 5 ? 232 : 220; g.fillRect(256 + Math.sin(a) * r0 - 2, 256 - Math.cos(a) * r0 - 2, 4, 4); }
  });
  const cg = new THREE.Group(); cg.position.set(14, 48, ROOM - 0.5); cg.rotation.y = Math.PI; room.add(cg);
  addMesh(cg, new THREE.CircleGeometry(5.5, 64), new THREE.MeshStandardMaterial({map: face, roughness: 0.3}), 0, 0, 0.15);
  addMesh(cg, new THREE.TorusGeometry(5.7, 0.5, 16, 64), plastic(0xe63946), 0, 0, 0.12);
  const glassF = new THREE.Mesh(new THREE.CircleGeometry(5.5, 48), new THREE.MeshPhysicalMaterial({color: 0xffffff, transparent: true, opacity: 0.12, roughness: 0.02, clearcoat: 1}));
  glassF.position.z = 0.6; cg.add(glassF);
  const hand = (len, w, c, z) => { const p = new THREE.Group(); p.position.z = z; p.userData.keep = true; cg.add(p); const m = new THREE.Mesh(new THREE.BoxGeometry(w, len, 0.06), std(c, 0.4)); m.position.y = len / 2 - 0.4; p.add(m); return p; };
  clockHands.h = hand(3.2, 0.38, 0x222222, 0.25); clockHands.m = hand(4.5, 0.26, 0x222222, 0.32); clockHands.s = hand(4.8, 0.09, 0xe63946, 0.4);
  addMesh(cg, sphGeo(0.32), std(0x222222, 0.4), 0, 0, 0.45);
  rb(2.2, 3.4, 0.4, 0.25, std(0xffffff, 0.4), -ROOM + 0.25, 18, 40, Math.PI / 2);
  rb(2.4, 2.4, 0.4, 0.25, std(0xffffff, 0.4), -30, 4, -ROOM + 0.25);
})();

// ---------- rug ----------
const RUG = {x: 0, z: 10, r: 26};
(function(){
  const t = canvasTex(1024, 1024, (g, w) => {
    const c = w / 2, rings = ['#3d5a80', '#e0c068', '#ee6c4d', '#f7f1e3', '#3d5a80', '#98c1d9', '#e0c068'];
    rings.forEach((col, i) => { g.fillStyle = col; g.beginPath(); g.arc(c, c, c * (1 - i * 0.13), 0, 7); g.fill(); });
    g.strokeStyle = '#ffffff55'; g.lineWidth = 6;
    for (let k = 0; k < 3; k++) { g.beginPath(); for (let a = 0; a <= Math.PI * 2 + 0.01; a += Math.PI / 40) { const r = c * (0.9 - k * 0.26) + Math.sin(a * 20) * 10; g.lineTo(c + Math.cos(a) * r, c + Math.sin(a) * r); } g.stroke(); }
    for (let i = 0; i < 40000; i++) { g.fillStyle = `rgba(${srnd() < 0.5 ? 0 : 255},${srnd() < 0.5 ? 0 : 255},${srnd() < 0.5 ? 0 : 255},0.05)`; g.fillRect(srnd() * w, srnd() * w, 2, 2); }
  });
  const rugM = new THREE.MeshPhysicalMaterial({map: t, bumpMap: dataTex(t, null, v => v), bumpScale: 1.5, roughness: 1, sheen: 1, sheenRoughness: 0.8, sheenColor: new THREE.Color(0xffffff)});
  const rug = new THREE.Mesh(new THREE.CylinderGeometry(RUG.r, RUG.r + 0.15, 0.25, 128), [new THREE.MeshStandardMaterial({color: 0x2c4566, roughness: 1}), rugM, rugM]);
  rug.position.set(RUG.x, 0.125, RUG.z); rug.receiveShadow = true; room.add(rug);
  // the cylinder's cap UVs are radial, re-map so the pattern lies flat
  const uv = rug.geometry.attributes.uv, p = rug.geometry.attributes.position;
  for (let i = 0; i < p.count; i++) if (Math.abs(p.getY(i)) > 0.1) uv.setXY(i, p.getX(i) / (RUG.r * 2) + 0.5, p.getZ(i) / (RUG.r * 2) + 0.5);
})();

// ---------- showroom turntable (only shown in the menu) ----------
const turntable = new THREE.Group(); turntable.position.set(RUG.x, 0.25, RUG.z); scene.add(turntable);
addMesh(turntable, cylGeo(4.6, 4.8, 0.4, 72), new THREE.MeshPhysicalMaterial({color: 0x23253a, roughness: 0.25, metalness: 0.4, clearcoat: 1}), 0, 0.2, 0);
addMesh(turntable, new THREE.TorusGeometry(4.7, 0.09, 8, 72), new THREE.MeshStandardMaterial({color: 0xffb627, emissive: 0xffb627, emissiveIntensity: 1.6}), 0, 0.41, 0, Math.PI / 2, 0, 0);
const turnTop = new THREE.Group(); turnTop.position.y = 0.41; turntable.add(turnTop);

// ---------- scattered toys (never on a race track) ----------
function placeDecor(nearTrack){
  const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ', cols = ['#e63946', '#f4a261', '#2a9d8f', '#457b9d', '#ffd166', '#9b5de5'];
  const blockMats = [];
  for (let i = 0; i < 18; i++) {
    const L = letters[(i * 7) % 26], bg = cols[i % cols.length];
    blockMats.push(new THREE.MeshPhysicalMaterial({roughness: 0.5, clearcoat: 0.3, map: canvasTex(256, 256, (g, w) => {
      g.fillStyle = '#efe2c4'; g.fillRect(0, 0, w, w); g.fillStyle = bg; g.fillRect(18, 18, w - 36, w - 36);
      g.fillStyle = '#fff'; g.font = 'bold 170px sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(L, w / 2, w / 2 + 8);
    })}));
  }
  const ballTex = canvasTex(512, 256, (g, w, h) => { ['#e63946', '#ffffff', '#3a86ff', '#ffd166', '#ffffff', '#2a9d8f'].forEach((col, i) => { g.fillStyle = col; g.fillRect(i * w / 6, 0, w / 6 + 1, h); }); });
  const placed = [];
  const ok = (x, z, r) => {
    if (Math.abs(x) > ROOM - r - 3 || Math.abs(z) > ROOM - r - 3) return false;
    if (blocked(x, z, r + 2)) return false;
    if (Math.hypot(x - RUG.x, z - RUG.z) < 10 + r) return false;
    if (nearTrack(x, z, r + 3)) return false;
    for (const c of ceilings) if (x > c.x0 - r && x < c.x1 + r && z > c.z0 - r && z < c.z1 + r) return false;
    for (const d of placed) if (Math.hypot(d.x - x, d.z - z) < d.r + r + 2) return false;
    return true;
  };
  // toys live in a few natural play spots (by the chest, the beanbag, the rug, the teddy), not sprinkled everywhere
  const spots = [[-50, 72, 16], [30, 74, 14], [-40, 18, 12], [-58, -2, 10], [20, -48, 10]];
  const tryPlace = (r, make, n) => {
    for (let k = 0, got = 0; k < 900 && got < n; k++) {
      const sp = spots[Math.floor(srnd() * spots.length)], a = srnd() * Math.PI * 2, d = Math.sqrt(srnd()) * sp[2];
      const x = sp[0] + Math.cos(a) * d, z = sp[1] + Math.sin(a) * d;
      if (!ok(x, z, r)) continue;
      make(x, z); placed.push({x, z, r}); solid(x, z, r * 0.8, r * 0.8); got++;
    }
  };
  const blockG = new THREE.BoxGeometry(3.4, 3.4, 3.4, 1, 1, 1);
  let bi = 0;
  tryPlace(2.6, (x, z) => {
    const mats = []; for (let f = 0; f < 6; f++) mats.push(blockMats[(bi * 3 + f) % blockMats.length]);
    const m = new THREE.Mesh(blockG, mats); m.position.set(x, 1.7, z); m.rotation.y = srnd() * 3; m.castShadow = m.receiveShadow = true; room.add(m); bi++;
    if (srnd() < 0.35) { const m2 = m.clone(); m2.material = mats.slice().reverse(); m2.position.y = 5.1; m2.rotation.y += 0.5; room.add(m2); }
  }, 7);
  const legoCols = [0xe63946, 0x3a86ff, 0xffd166, 0x06d6a0, 0xf4f1ea];
  tryPlace(2.8, (x, z) => {
    const g = new THREE.Group(); g.position.set(x, 0, z); g.rotation.y = srnd() * 3; room.add(g);
    const mat = plastic(legoCols[Math.floor(srnd() * legoCols.length)], 0.22);
    addMesh(g, rboxGeo(4.6, 1.7, 2.3, 0.1), mat, 0, 0.85, 0);
    for (let i = 0; i < 4; i++) for (let j = 0; j < 2; j++) addMesh(g, cylGeo(0.42, 0.42, 0.4, 20), mat, -1.72 + i * 1.15, 1.9, -0.57 + j * 1.15);
  }, 6);
  const crayon = [0xe63946, 0x3a86ff, 0x06d6a0, 0x9b5de5, 0xff8c42];
  tryPlace(2.4, (x, z) => {
    const g = new THREE.Group(); g.position.set(x, 0.44, z); g.rotation.y = srnd() * 3; room.add(g);
    const c = crayon[Math.floor(srnd() * crayon.length)];
    addMesh(g, cylGeo(0.44, 0.44, 3.8, 6), std(c, 0.45), 0, 0, 0, 0, 0, Math.PI / 2);
    addMesh(g, cylGeo(0.46, 0.46, 2.4, 6), lam(0xf4f1ea), -0.2, 0, 0, 0, 0, Math.PI / 2);
    addMesh(g, cylGeo(0.14, 0.44, 0.9, 6), std(c, 0.45), 2.35, 0, 0, 0, 0, -Math.PI / 2);
  }, 5);
  tryPlace(3.4, (x, z) => { const b = addMesh(room, new THREE.SphereGeometry(3.2, 48, 32), new THREE.MeshPhysicalMaterial({map: ballTex, roughness: 0.3, clearcoat: 0.8}), x, 3.2, z); b.rotation.set(0.4, srnd() * 3, 0.3); }, 1);
  tryPlace(3.6, (x, z) => {
    const cs = [0x264653, 0xe9c46a, 0xe76f51, 0x6d597a];
    for (let i = 0; i < 3; i++) { const ry = srnd() * 0.5, b = rb(7 - i * 0.3, 1.3, 5, 0.18, std(cs[(i + Math.floor(srnd() * 4)) % 4], 0.6), x, i * 1.3, z, ry); addMesh(room, new THREE.BoxGeometry(6.4 - i * 0.3, 1.05, 0.05), lam(0xfdfaf0), b.position.x - Math.sin(ry) * 2.51, b.position.y, b.position.z + Math.cos(ry) * 2.51, 0, ry, 0); }
  }, 2);
}
// Once everything is in place, fold all static furniture into a handful of draw calls.
function finalizeRoom(){ mergeStatic(room); }

function updateRoom(dt){
  const d = new Date(), s = d.getSeconds() + d.getMilliseconds() / 1000, m = d.getMinutes() + s / 60, h = (d.getHours() % 12) + m / 60;
  clockHands.s.rotation.z = -Math.floor(s) * Math.PI / 30;
  clockHands.m.rotation.z = -m * Math.PI / 30;
  clockHands.h.rotation.z = -h * Math.PI / 6;
  if (room.userData.globe) room.userData.globe.rotation.y += dt * 0.15;
  const dust = room.userData.dust;
  if (dust) { const p = dust.geometry.attributes.position; for (let i = 0; i < p.count; i += 3) { p.array[i * 3 + 1] += Math.sin(gTime * 0.5 + i) * dt * 0.3; } p.needsUpdate = true; dust.rotation.y = Math.sin(gTime * 0.05) * 0.02; }
}
