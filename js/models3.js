// ============ CAR MODELS (part 3): two more cars for every tier ============
const M3 = {
  gold:   new THREE.MeshStandardMaterial({color: 0xd9a520, metalness: 1, roughness: 0.22, side: THREE.DoubleSide}),
  copper: new THREE.MeshStandardMaterial({color: 0xb8692e, metalness: 0.85, roughness: 0.3, emissive: 0xff4a00, emissiveIntensity: 0}),
  amber:  new THREE.MeshPhysicalMaterial({color: 0xffb020, transparent: true, opacity: 0.45, roughness: 0.08, clearcoat: 1, emissive: 0xff8800, emissiveIntensity: 0.5, depthWrite: false}),
  orange: new THREE.MeshStandardMaterial({color: 0xff7a00, roughness: 0.45}),
  brown:  new THREE.MeshStandardMaterial({color: 0x3b2414, roughness: 0.65}),
  plate:  new THREE.MeshStandardMaterial({color: 0xffffff, metalness: 0.85, roughness: 0.35, map: canvasTex(64, 64, (g, w) => {
    g.fillStyle = '#9ea4ad'; g.fillRect(0, 0, w, w); g.fillStyle = '#c9ced6';
    for (let i = 0; i < 4; i++) for (let j = 0; j < 4; j++) { g.save(); g.translate(i * 16 + (j % 2) * 8 + 4, j * 16 + 8); g.rotate(0.7); g.fillRect(-5, -1.5, 10, 3); g.restore(); }
  }, [3, 3])}),
};
const glowM = (c, k = 3) => new THREE.MeshBasicMaterial({color: new THREE.Color(c).multiplyScalar(k), toneMapped: false});
const addGlow = (c, opacity) => new THREE.MeshBasicMaterial({map: softTex, color: c, transparent: true, opacity, blending: THREE.AdditiveBlending, depthWrite: false, toneMapped: false});
const numDecal = (txt, fg = '#111', bg = '#fff') => (g, w) => { g.fillStyle = bg; g.beginPath(); g.arc(w / 2, w / 2, w / 2 - 6, 0, 7); g.fill(); g.fillStyle = fg; g.font = `bold ${txt.length > 1 ? 120 : 150}px sans-serif`; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(txt, w / 2, w / 2 + 9); };
const wordDecal = (txt, col, px = 44) => (g, w, h) => { g.fillStyle = col; g.font = `bold ${px}px sans-serif`; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(txt, w / 2, h / 2 + 2); };
// riveted bolt-on fender flare
function overfender(car, x, y, z, R, sd){
  const g = new THREE.TorusGeometry(R, 0.05, 8, 30, Math.PI); g.scale(1, 1, 1.6);
  addMesh(car.chassis, g, CM.black, x, y, z, 0, Math.PI / 2, 0);
  for (let i = 1; i < 9; i++) { const a = i / 9 * Math.PI; addMesh(car.chassis, sphGeo(0.014, 8, 6), CM.chrome, x + sd * 0.07, y + Math.sin(a) * R, z + Math.cos(a) * R); }
}
function ladder(parent, len, w, y, z, n, r = 0.012){
  [-1, 1].forEach(sd => RB(parent, 0.045, 0.08, len, 0.018, CM.alu, sd * w / 2, y, z));
  for (let i = 0; i < n; i++) addMesh(parent, cylGeo(r, r, w, 8), CM.alu, 0, y, z - len / 2 + (i + 0.5) * len / n, 0, 0, Math.PI / 2);
}

// ============ 12. POCKET RACER ============
BUILD.mini = car => {
  const C = car.chassis; car.freq = 8.5; car.damp = 0.3;
  const s = {L: 2.0, W: 1.35, yb: 0.19, wf: [0.56, 0.25], wr: [-0.56, 0.25], arch: 0.03, noseY: 0.52, hoodCtl: [0.82, 0.72], belt: 0.72,
    cab: {a: 0.38, b: 0.12, c: -0.44, d: -0.66, roof: 1.2, bulge: 0.06, w: 0.88, taper: 0.26}, deckY: 0.74, deckRise: 0.01, tailY: 0.7,
    cr: 0.16, taper: 0.2, plan: 0.17, planR: 0.1, bevel: 0.08, roofMat: CM.white};
  const I = sedanBody(car, s);
  [1, -1].forEach(sd => { addWheel(car, {x: sd * 0.55, z: 0.56, r: 0.25, w: 0.22, front: true, rim: 'steel'}); addWheel(car, {x: sd * 0.55, z: -0.56, r: 0.25, w: 0.22, rim: 'steel'}); });
  // round headlamps, chrome moustache, wrap-round bumpers, fog lamps
  [-1, 1].forEach(sd => { headlamp(C, sd * 0.38, 0.44, I.zf - 0.03, 0.085); RB(C, 0.08, 0.035, 0.02, 0.01, CM.amber, sd * 0.38, 0.33, I.zf - 0.015); });
  tube(C, [[-0.26, 0.44, I.zf - 0.025], [-0.1, 0.4, I.zf + 0.004], [0.1, 0.4, I.zf + 0.004], [0.26, 0.44, I.zf - 0.025]], 0.012, CM.chrome, 12);
  [[I.zf, 1], [I.zr, -1]].forEach(([z, f]) => tube(C, [[-0.58, 0.27, z - f * 0.22], [-0.5, 0.26, z + f * 0.025], [0.5, 0.26, z + f * 0.025], [0.58, 0.27, z - f * 0.22]], 0.026, CM.chrome, 20));
  [-0.2, 0.2].forEach(x => { addMesh(C, cylGeo(0.05, 0.045, 0.05, 16), CM.black, x, 0.36, I.zf + 0.03, Math.PI / 2, 0, 0); headlamp(C, x, 0.36, I.zf + 0.06, 0.04); });
  // engine lid propped wide open (a ducktail spoiler) over a buzzing little four
  const zr = I.zr;
  RB(C, 0.78, 0.28, 0.05, 0.03, CM.black, 0, 0.42, zr + 0.02);
  const E = new THREE.Group(); E.position.set(0, 0.42, zr); C.add(E);
  RB(E, 0.62, 0.2, 0.06, 0.03, CM.engine, 0, -0.01, 0);
  addMesh(E, cylGeo(0.1, 0.1, 0.05, 24), CM.black, -0.17, 0, -0.05, Math.PI / 2, 0, 0);
  const fan = new THREE.Group(); fan.position.set(-0.17, 0, -0.08); E.add(fan);
  for (let i = 0; i < 7; i++) { const a = i / 7 * Math.PI * 2; RB(fan, 0.03, 0.075, 0.01, 0.004, CM.alu, Math.cos(a) * 0.045, Math.sin(a) * 0.045, 0, 0.35, 0, a - Math.PI / 2); }
  addMesh(fan, cylGeo(0.02, 0.02, 0.03, 10), CM.chrome, 0, 0, 0, Math.PI / 2, 0, 0);
  car.spin.push({o: fan, ax: 'z', k: -1.4});
  pulley(car, E, 0.065, 0.12, -0.04, -0.06, 1);
  pulley(car, E, 0.04, 0.0, 0.06, -0.06, 1.6);
  beltBetween(E, [0.12, -0.04], 0.065, [0.0, 0.06], 0.04, -0.06);
  addMesh(E, cylGeo(0.075, 0.075, 0.07, 20), CM.chrome, 0.22, 0.1, -0.03);
  addMesh(E, cylGeo(0.05, 0.05, 0.075, 16), CM.red, 0.22, 0.1, -0.03);
  for (let i = 0; i < 4; i++) tube(E, [[-0.27 + i * 0.12, 0.09, -0.035], [-0.2 + i * 0.1, 0.12, -0.07], [0.05, 0.09, -0.06]], 0.006, CM.red, 8);
  car.shakers.push({o: E, base: E.position.clone()});
  const lid = new THREE.Group(); lid.position.set(0, 0.6, zr + 0.03); lid.rotation.x = 1.7; C.add(lid);
  RB(lid, 0.82, 0.3, 0.035, 0.03, car.paint, 0, -0.15, 0);
  for (let i = 0; i < 5; i++) RB(lid, 0.56, 0.012, 0.012, 0.005, CM.black, 0, -0.07 - i * 0.042, -0.02);
  [-0.35, 0.35].forEach(x => tube(C, [[x, 0.34, zr + 0.02], [x, 0.61, zr - 0.18]], 0.008, CM.chrome, 2));
  [-1, 1].forEach(sd => addMesh(C, cylGeo(0.05, 0.05, 0.03, 18), car.tailMat, sd * 0.5, 0.42, zr + 0.005, Math.PI / 2, 0, 0));
  [-0.14, 0.14].forEach(x => exhaustTip(car, [x, 0.22, zr - 0.02], [0, -0.05, -1], 0.03, 0.8));
  // roof rack with a little leather suitcase
  const rt = I.roofTop;
  [-1, 1].forEach(sd => tube(C, [[sd * 0.3, rt - 0.01, 0.06], [sd * 0.31, rt + 0.06, 0.02], [sd * 0.31, rt + 0.06, -0.36], [sd * 0.3, rt - 0.01, -0.4]], 0.011, CM.chrome, 16));
  [0.0, -0.17, -0.34].forEach(z => tube(C, [[-0.31, rt + 0.06, z], [0.31, rt + 0.06, z]], 0.009, CM.chrome, 2));
  RB(C, 0.42, 0.14, 0.28, 0.03, CM.leather, 0, rt + 0.14, -0.16);
  [-0.1, 0.1].forEach(x => RB(C, 0.03, 0.15, 0.29, 0.008, M3.brown, x, rt + 0.14, -0.16));
  RB(C, 0.1, 0.02, 0.03, 0.008, CM.chrome, 0, rt + 0.215, -0.04);
  // roundels and a pinstripe above the arches
  [-1, 1].forEach(sd => {
    decal(C, 0.28, 0.28, numDecal('12'), sd * (I.hw(0.46, -0.04) + 0.008), 0.46, -0.04, sd * Math.PI / 2);
    RB(C, 0.008, 0.022, 1.3, 0.004, CM.white, sd * (I.hw(0.655, 0) + 0.003), 0.655, 0);
  });
  mirrors(car, I, 0.36, 0.72);
};

// ============ 13. TOW TRUCK ============
BUILD.tow = car => {
  const C = car.chassis; car.freq = 7; car.damp = 0.32;
  const s = {L: 2.6, W: 1.5, yb: 0.3, wf: [0.74, 0.34], wr: [-0.74, 0.34], arch: 0.05, noseY: 0.98, hoodCtl: [1.12, 1.1], belt: 1.12,
    cab: {a: 0.36, b: 0.26, c: -0.16, d: -0.26, roof: 1.74, bulge: 0.04, w: 0.86, taper: 0.16}, deckY: 1.12, bed: {y: 0.9}, tailY: 1.0,
    cr: 0.16, taper: 0.1, plan: 0.12, planR: 0.04, bevel: 0.07};
  const I = sedanBody(car, s);
  [1, -1].forEach(sd => { addWheel(car, {x: sd * 0.6, z: 0.74, r: 0.34, w: 0.3, front: true, rim: 'steel'}); addWheel(car, {x: sd * 0.6, z: -0.74, r: 0.34, w: 0.36, rim: 'steel'}); });
  // chrome grille, round lamps, big bumper
  RB(C, 0.72, 0.42, 0.05, 0.05, CM.chrome, 0, 0.62, I.zf - 0.01);
  for (let i = 0; i < 9; i++) RB(C, 0.03, 0.36, 0.03, 0.01, CM.black, -0.28 + i * 0.07, 0.62, I.zf + 0.012);
  [-1, 1].forEach(sd => { headlamp(C, sd * 0.54, 0.66, I.zf - 0.01, 0.09); RB(C, 0.1, 0.05, 0.02, 0.01, CM.amber, sd * 0.54, 0.5, I.zf); });
  RB(C, 1.56, 0.14, 0.14, 0.05, CM.chrome, 0, 0.34, I.zf + 0.03);
  addMesh(C, sphGeo(0.035, 12, 8), CM.chrome, 0, 1.02, I.zf - 0.18);
  // roof clearance lights and two rotating beacons that sweep amber beams
  const rt = I.roofTop;
  [-0.25, 0, 0.25].forEach(x => RB(C, 0.07, 0.035, 0.04, 0.012, CM.amber, x, rt - 0.005, 0.25));
  RB(C, 0.9, 0.05, 0.16, 0.025, CM.black, 0, rt + 0.02, 0.02);
  const bulb = glowM(0xffa000, 4), beamGeo = new THREE.ConeGeometry(0.09, 0.5, 14, 1, true); beamGeo.rotateX(-Math.PI / 2); beamGeo.translate(0, 0, 0.25);
  const fade = canvasTex(4, 64, (g, w, h) => { const gr = g.createLinearGradient(0, 0, 0, h); gr.addColorStop(0, '#fff'); gr.addColorStop(1, '#000'); g.fillStyle = gr; g.fillRect(0, 0, w, h); });
  const beamM = new THREE.MeshBasicMaterial({map: fade, color: new THREE.Color(0xffa000).multiplyScalar(2), transparent: true, opacity: 0.3, blending: THREE.AdditiveBlending, depthWrite: false, toneMapped: false, side: THREE.DoubleSide});
  [-0.32, 0.32].forEach((x, k) => {
    addMesh(C, cylGeo(0.09, 0.1, 0.05, 20), CM.black, x, rt + 0.07, 0.02);
    const rot = new THREE.Group(); rot.position.set(x, rt + 0.15, 0.02); C.add(rot);
    addMesh(rot, sphGeo(0.03, 12, 8), bulb, 0, 0, 0);
    RB(rot, 0.1, 0.1, 0.012, 0.004, CM.chrome, 0, 0, -0.035);
    const bm = new THREE.Mesh(beamGeo, beamM); bm.renderOrder = 7; rot.add(bm);
    car.keep.push(rot); car.anim.push((st, t) => { rot.rotation.y = t * 7 + k * Math.PI; });
    const dome = new THREE.Mesh(new THREE.SphereGeometry(0.095, 20, 10, 0, Math.PI * 2, 0, Math.PI / 2), M3.amber);
    dome.position.set(x, rt + 0.095, 0.02); dome.scale.y = 1.35; dome.renderOrder = 6; C.add(dome);
  });
  // smoke stack with a rain flapper that bounces open on the throttle
  const sx = 0.6, sz = -0.36;
  addMesh(C, cylGeo(0.045, 0.045, 1.1, 16), CM.chrome, sx, 1.45, sz);
  addMesh(C, cylGeo(0.062, 0.062, 0.46, 16, true), CM.black, sx, 1.35, sz);
  for (let i = 0; i < 4; i++) addMesh(C, new THREE.TorusGeometry(0.063, 0.008, 6, 18), CM.chrome, sx, 1.14 + i * 0.14, sz, Math.PI / 2, 0, 0);
  exhaustTip(car, [sx, 2.0, sz], [0, 1, 0], 0.045, 0.9);
  const fl = new THREE.Group(); fl.position.set(sx, 2.085, sz - 0.05); C.add(fl);
  addMesh(fl, cylGeo(0.055, 0.055, 0.012, 16), CM.chrome, 0, 0, 0.05);
  car.flaps.push({o: fl, base: 0, amp: 0.8});
  // red boom, sheave, cable and a hook that swings about
  [-1, 1].forEach(sd => {
    tube(C, [[sd * 0.4, 0.97, -0.45], [sd * 0.1, 1.9, -1.1]], 0.04, CM.red, 2);
    tube(C, [[sd * 0.4, 0.97, -1.2], [sd * 0.1, 1.86, -1.12]], 0.034, CM.red, 2);
  });
  RB(C, 0.28, 0.12, 0.16, 0.04, CM.red, 0, 1.9, -1.12);
  addMesh(C, cylGeo(0.09, 0.09, 0.05, 20), CM.gun, 0, 1.92, -1.22, 0, 0, Math.PI / 2);
  tube(C, [[0, 1.13, -0.5], [0, 2.0, -1.18]], 0.01, CM.black, 2);
  const hk = new THREE.Group(); hk.position.set(0, 1.88, -1.3); C.add(hk);
  addMesh(hk, cylGeo(0.01, 0.01, 0.55, 6), CM.black, 0, -0.275, 0);
  RB(hk, 0.08, 0.1, 0.06, 0.02, CM.yellow, 0, -0.58, 0);
  addMesh(hk, new THREE.TorusGeometry(0.06, 0.016, 8, 20, Math.PI * 1.4), CM.chrome, 0, -0.7, 0, 0, Math.PI / 2, Math.PI * 0.8);
  car.sway.push({o: hk, vx: 0, vz: 0});
  // winch drum turned by the engine
  const wd = new THREE.Group(); wd.position.set(0, 1.1, -0.5); C.add(wd);
  addMesh(wd, cylGeo(0.08, 0.08, 0.44, 18), CM.black, 0, 0, 0, 0, 0, Math.PI / 2);
  [-0.23, 0.23].forEach(x => addMesh(wd, cylGeo(0.12, 0.12, 0.02, 20), CM.red, x, 0, 0, 0, 0, Math.PI / 2));
  for (let i = 0; i < 4; i++) RB(wd, 0.48, 0.022, 0.022, 0.008, CM.gun, 0, Math.cos(i * Math.PI / 2) * 0.1, Math.sin(i * Math.PI / 2) * 0.1);
  car.spin.push({o: wd, ax: 'x', k: 0.25});
  [-1, 1].forEach(sd => RB(C, 0.04, 0.18, 0.2, 0.015, CM.gun, sd * 0.26, 1.04, -0.5));
  // wheel-lift arm, toolboxes, lights, mud flaps
  RB(C, 0.16, 0.1, 0.5, 0.03, CM.red, 0, 0.42, I.zr - 0.15);
  RB(C, 1.0, 0.08, 0.1, 0.03, CM.black, 0, 0.4, I.zr - 0.42);
  [-1, 1].forEach(sd => RB(C, 0.08, 0.08, 0.3, 0.02, CM.black, sd * 0.46, 0.4, I.zr - 0.52));
  [-1, 1].forEach(sd => { RB(C, 0.2, 0.24, 0.6, 0.03, M3.plate, sd * 0.6, 1.09, -0.86); RB(C, 0.02, 0.03, 0.2, 0.01, CM.chrome, sd * 0.705, 1.12, -0.86); });
  [-1, 1].forEach(sd => { RB(C, 0.14, 0.1, 0.03, 0.02, car.tailMat, sd * 0.56, 0.82, I.zr + 0.01); RB(C, 0.1, 0.06, 0.03, 0.02, CM.amber, sd * 0.56, 0.7, I.zr + 0.01); });
  plate(C, I.zr - 0.01, 0.56, 'TOW 1', Math.PI);
  [-1, 1].forEach(sd => {
    const p = new THREE.Group(); p.position.set(sd * 0.6, 0.62, -1.2); C.add(p);
    RB(p, 0.3, 0.28, 0.02, 0.01, CM.black, 0, -0.14, 0);
    car.sway.push({o: p, vx: 0, vz: 0});
    decal(C, 0.46, 0.24, (g, w, h) => { g.fillStyle = '#1b1b1b'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.font = 'bold 62px sans-serif'; g.fillText('TOW', w / 2, h * 0.36); g.font = 'bold 34px sans-serif'; g.fillText('24 / 7', w / 2, h * 0.8); }, sd * (I.hw(0.86, 0.06) + 0.006), 0.86, 0.06, sd * Math.PI / 2);
    // tall truck mirrors on arms
    const x = sd * (I.hw(1.2, 0.3) + 0.02);
    tube(C, [[x, 1.18, 0.3], [x + sd * 0.16, 1.22, 0.32], [x + sd * 0.16, 1.5, 0.32]], 0.01, CM.chrome, 8);
    RB(C, 0.06, 0.26, 0.12, 0.02, CM.black, x + sd * 0.17, 1.36, 0.32);
    addMesh(C, new THREE.PlaneGeometry(0.1, 0.22), CM.chrome, x + sd * 0.17, 1.36, 0.258, 0, Math.PI, 0);
  });
};

// ============ 14. GO-KART ============
BUILD.kart = car => {
  const C = car.chassis; car.freq = 16; car.damp = 0.6;
  [1, -1].forEach(sd => {
    addWheel(car, {x: sd * 0.58, z: 0.56, r: 0.19, w: 0.15, front: true, tread: 'slick', rim: 'deep', rimF: 0.62, caliper: CM.gun});
    addWheel(car, {x: sd * 0.6, z: -0.56, r: 0.21, w: 0.24, tread: 'slick', rim: 'deep', rimF: 0.6, caliper: CM.gun});
  });
  // tube frame, floor tray, axles and steering
  [-1, 1].forEach(sd => {
    tube(C, [[sd * 0.2, 0.12, 0.82], [sd * 0.28, 0.12, 0.4], [sd * 0.3, 0.12, -0.2], [sd * 0.28, 0.13, -0.66]], 0.024, CM.gun, 20);
    tube(C, [[sd * 0.28, 0.12, 0.56], [sd * 0.5, 0.15, 0.56]], 0.02, CM.gun, 2);
    addMesh(C, cylGeo(0.02, 0.02, 0.16, 8), CM.gun, sd * 0.5, 0.19, 0.56);
    tube(C, [[0, 0.32, 0.38], [sd * 0.48, 0.2, 0.5]], 0.008, CM.chrome, 2);
  });
  tube(C, [[-0.28, 0.12, 0.62], [0.28, 0.12, 0.62]], 0.02, CM.gun, 2);
  tube(C, [[-0.3, 0.12, 0.0], [0.3, 0.12, 0.0]], 0.02, CM.gun, 2);
  RB(C, 0.52, 0.012, 1.0, 0.004, CM.black, 0, 0.1, 0.12);
  addMesh(car.root, cylGeo(0.022, 0.022, 1.24, 12), CM.chrome, 0, 0.21, -0.56, 0, 0, Math.PI / 2);
  // nose cone, steering shroud, side pods and the big rear bumper
  const nose = profShape([['m', 0.66, 0.08], ['l', 0.94, 0.08], ['q', 1.02, 0.1, 0.98, 0.2], ['q', 0.9, 0.3, 0.66, 0.32], ['l', 0.66, 0.08]]);
  addMesh(C, extrudeX(nose, 1.0, 0.04, makeTaper(1.75, 0.08, 0.32, 0.25, 0.4, 0)), car.paint);
  const shroud = profShape([['m', 0.24, 0.13], ['l', 0.64, 0.13], ['l', 0.64, 0.28], ['q', 0.46, 0.46, 0.28, 0.48], ['l', 0.24, 0.46], ['l', 0.24, 0.13]]);
  addMesh(C, extrudeX(shroud, 0.36, 0.04, makeTaper(1.75, 0.13, 0.48, 0.3, 0, 0)), car.paint);
  const pod = profShape([['m', -0.32, 0.1], ['l', 0.3, 0.1], ['q', 0.38, 0.12, 0.36, 0.2], ['q', 0.1, 0.28, -0.32, 0.25], ['l', -0.32, 0.1]]);
  const podG = extrudeX(pod, 0.2, 0.035);
  [-1, 1].forEach(sd => { addMesh(C, podG, car.paint, sd * 0.41, 0, 0); decal(C, 0.18, 0.18, numDecal('7'), sd * 0.517, 0.18, 0.0, sd * Math.PI / 2); });
  RB(C, 1.2, 0.12, 0.14, 0.06, CM.plastic, 0, 0.17, -0.86);
  [-1, 1].forEach(sd => tube(C, [[sd * 0.28, 0.13, -0.66], [sd * 0.4, 0.16, -0.8]], 0.018, CM.gun, 2));
  decal(C, 0.24, 0.16, (g, w, h) => { g.fillStyle = '#ffd400'; g.fillRect(0, 0, w, h); g.fillStyle = '#111'; g.font = 'bold 120px sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText('7', w / 2, h / 2 + 8); }, 0, 0.2, 1.035, 0).rotation.x = -0.5;
  // moulded seat, driver, steering wheel
  const seat = profShape([['m', -0.08, 0.12], ['l', -0.34, 0.12], ['q', -0.44, 0.14, -0.44, 0.3], ['l', -0.42, 0.62], ['q', -0.4, 0.66, -0.36, 0.62], ['l', -0.35, 0.3], ['q', -0.32, 0.2, -0.08, 0.19], ['l', -0.08, 0.12]]);
  addMesh(C, extrudeX(seat, 0.38, 0.035, makeTaper(1.75, 0.12, 0.66, 0.2, 0, 0)), CM.black);
  car.driverHead = driver(C, 0, 0.36, -0.26, CM.yellow);
  [-1, 1].forEach(sd => {
    RB(C, 0.1, 0.1, 0.5, 0.045, CM.suit, sd * 0.09, 0.22, 0.06, 0.15, 0, 0);
    tube(C, [[sd * 0.15, 0.64, -0.24], [sd * 0.17, 0.5, -0.05], [sd * 0.1, 0.5, 0.08]], 0.035, CM.suit, 8);
  });
  addMesh(C, cylGeo(0.012, 0.012, 0.36, 8), CM.gun, 0, 0.42, 0.24, 1.0, 0, 0);
  addMesh(C, new THREE.TorusGeometry(0.1, 0.016, 8, 24), CM.black, 0, 0.52, 0.1, -0.9, 0, 0);
  RB(C, 0.12, 0.05, 0.02, 0.01, CM.black, 0, 0.53, 0.11, -0.9, 0, 0);
  // two-stroke single beside the seat: finned barrel, pull-start, cone filter
  const E = new THREE.Group(); E.position.set(0.38, 0.14, -0.3); C.add(E);
  RB(E, 0.16, 0.14, 0.2, 0.04, CM.alu, 0, 0.08, 0);
  const bar = new THREE.Group(); bar.position.set(0, 0.17, 0.02); bar.rotation.x = 0.3; E.add(bar);
  for (let i = 0; i < 7; i++) RB(bar, 0.17, 0.012, 0.17, 0.02, CM.gun, 0, i * 0.024, 0);
  RB(bar, 0.14, 0.04, 0.14, 0.03, CM.alu, 0, 0.18, 0);
  addMesh(bar, cylGeo(0.012, 0.012, 0.06, 8), CM.chrome, 0, 0.22, 0);
  addMesh(bar, cylGeo(0.02, 0.016, 0.05, 10), CM.black, 0, 0.27, 0);
  addMesh(E, cylGeo(0.075, 0.075, 0.03, 20), CM.black, 0.09, 0.08, 0, 0, 0, Math.PI / 2);
  addMesh(E, cylGeo(0.02, 0.02, 0.02, 10), CM.red, 0.11, 0.08, 0, 0, 0, Math.PI / 2);
  addMesh(E, cylGeo(0.035, 0.035, 0.08, 12), CM.alu, -0.1, 0.18, -0.04, 0, 0, Math.PI / 2);
  addMesh(E, new THREE.ConeGeometry(0.06, 0.12, 16), CM.red, -0.18, 0.18, -0.12, -Math.PI / 2 - 0.4, 0, 0);
  tube(E, [[0, 0.44, 0.02], [0.05, 0.4, 0.18], [0.0, 0.3, 0.25]], 0.005, CM.red, 8);
  car.shakers.push({o: E, base: E.position.clone()});
  // chain drive: engine sprocket spins with the revs, axle sprocket with the wheels
  const cx = 0.27, se = new THREE.Group(); se.position.set(cx, 0.2, -0.3); C.add(se);
  addMesh(se, cylGeo(0.04, 0.04, 0.02, 12), CM.gun, 0, 0, 0, 0, 0, Math.PI / 2);
  for (let i = 0; i < 8; i++) RB(se, 0.02, 0.012, 0.016, 0.004, CM.gun, 0, Math.cos(i / 8 * Math.PI * 2) * 0.045, Math.sin(i / 8 * Math.PI * 2) * 0.045, i / 8 * Math.PI * 2);
  car.spin.push({o: se, ax: 'x', k: 1});
  const sa = new THREE.Group(); sa.position.set(cx, 0.21, -0.56); car.root.add(sa);
  addMesh(sa, cylGeo(0.1, 0.1, 0.015, 24), CM.alu, 0, 0, 0, 0, 0, Math.PI / 2);
  for (let i = 0; i < 6; i++) RB(sa, 0.02, 0.025, 0.07, 0.008, CM.black, 0, Math.cos(i / 6 * Math.PI * 2) * 0.055, Math.sin(i / 6 * Math.PI * 2) * 0.055, i / 6 * Math.PI * 2);
  for (let i = 0; i < 20; i++) RB(sa, 0.02, 0.012, 0.016, 0.004, CM.alu, 0, Math.cos(i / 20 * Math.PI * 2) * 0.105, Math.sin(i / 20 * Math.PI * 2) * 0.105, i / 20 * Math.PI * 2);
  car.keep.push(sa); car.anim.push((st, t, dt) => { sa.rotation.x += st.speed / 0.21 * dt; });
  const ch = new THREE.Group(); ch.position.set(cx, 0, 0); ch.rotation.y = Math.PI / 2; C.add(ch);
  beltBetween(ch, [0.3, 0.2], 0.05, [0.56, 0.21], 0.11, 0);
  // expansion-chamber exhaust curling behind the seat into a silencer
  tube(C, [[0.38, 0.47, -0.22], [0.36, 0.5, -0.4], [0.26, 0.4, -0.52], [0.14, 0.32, -0.56]], 0.04, CM.chrome, 18);
  addMesh(C, cylGeo(0.05, 0.05, 0.22, 16), CM.alu, 0.1, 0.3, -0.66, Math.PI / 2, 0, 0);
  exhaustTip(car, [0.1, 0.3, -0.8], [0, 0.1, -1], 0.03, 0.7);
  addMesh(C, cylGeo(0.1, 0.1, 0.012, 24), car.discMat, -0.2, 0.21, -0.56, 0, 0, Math.PI / 2);
};

// ============ 15. FIRE ENGINE ============
BUILD.fire = car => {
  const C = car.chassis; car.freq = 6.5; car.damp = 0.32;
  const s = {L: 3.0, W: 1.6, yb: 0.32, wf: [0.9, 0.38], wr: [-0.86, 0.38], arch: 0.04, noseY: 0.98, cr: 0.12, taper: 0.06, plan: 0.06, planR: 0.02, bevel: 0.07, yMax: 1.8,
    top: [['l', 1.36, 1.08], ['l', 1.24, 1.68], ['q', 1.2, 1.8, 1.08, 1.8], ['l', 0.44, 1.8], ['q', 0.32, 1.8, 0.32, 1.7], ['l', 0.32, 1.62], ['l', -1.38, 1.62], ['q', -1.5, 1.62, -1.5, 1.5]]};
  const I = sedanBody(car, s);
  [1, -1].forEach(sd => { addWheel(car, {x: sd * 0.64, z: 0.9, r: 0.38, w: 0.32, front: true, rim: 'steel'}); addWheel(car, {x: sd * 0.64, z: -0.86, r: 0.38, w: 0.4, rim: 'steel'}); });
  // windscreen, door windows, seams and grab rails
  RB(C, 1.22, 0.58, 0.03, 0.04, CM.glass, 0, 1.38, 1.375, -0.197, 0, 0);
  [-1, 1].forEach(sd => {
    RB(C, 0.03, 0.42, 0.46, 0.04, CM.glass, sd * (I.hw(1.44, 1.0) + 0.004), 1.44, 1.0);
    RB(C, 0.03, 0.36, 0.3, 0.04, CM.glass, sd * (I.hw(1.46, 0.56) + 0.004), 1.46, 0.56);
    for (const z of [1.27, 0.74, 0.36]) RB(C, 0.006, 0.9, 0.014, 0.003, CM.seam, sd * (I.hw(1.2, z) + 0.002), 1.2, z);
    tube(C, [[sd * (I.hw(1.3, 0.78) + 0.03), 0.95, 0.78], [sd * (I.hw(1.3, 0.78) + 0.05), 1.3, 0.78], [sd * (I.hw(1.3, 0.78) + 0.03), 1.6, 0.78]], 0.012, CM.chrome, 8);
    decal(C, 0.42, 0.16, wordDecal('FIRE', '#ffd166', 64), sd * (I.hw(1.05, 1.0) + 0.006), 1.05, 1.0, sd * Math.PI / 2);
  });
  // chrome grille, quad lamps, bumper and a brass bell that swings
  RB(C, 1.0, 0.36, 0.05, 0.04, CM.chrome, 0, 0.72, I.zf - 0.01);
  for (let i = 0; i < 6; i++) RB(C, 0.92, 0.02, 0.03, 0.008, CM.black, 0, 0.6 + i * 0.05, I.zf + 0.012);
  [-1, 1].forEach(sd => [0.56, 0.68].forEach(x => RB(C, 0.11, 0.09, 0.03, 0.025, CM.head, sd * x, 0.72, I.zf - 0.005)));
  RB(C, 1.66, 0.16, 0.16, 0.05, CM.chrome, 0, 0.4, I.zf + 0.04);
  decal(C, 0.3, 0.3, numDecal('7', '#d7191f', '#ffd166'), 0, 1.0, I.zf + 0.004, 0);
  tube(C, [[-0.5, 0.48, I.zf + 0.08], [-0.5, 0.7, I.zf + 0.1], [-0.5, 0.72, I.zf + 0.16]], 0.012, CM.gun, 8);
  const bell = new THREE.Group(); bell.position.set(-0.5, 0.71, I.zf + 0.17); C.add(bell);
  addMesh(bell, new THREE.LatheGeometry([[0.001, 0], [0.035, -0.005], [0.05, -0.04], [0.055, -0.09], [0.075, -0.12], [0.08, -0.13]].map(p => new V2(p[0], p[1])), 20), M3.gold, 0, -0.01, 0);
  addMesh(bell, sphGeo(0.018, 10, 8), M3.gold, 0, -0.13, 0);
  car.sway.push({o: bell, vx: 0, vz: 0});
  // light bar: red and white strobes
  const mR = new THREE.MeshStandardMaterial({color: 0x550000, emissive: 0xff1020, emissiveIntensity: 0.2, roughness: 0.2});
  const mW = new THREE.MeshStandardMaterial({color: 0x666666, emissive: 0xffffff, emissiveIntensity: 0.2, roughness: 0.2});
  RB(C, 1.3, 0.06, 0.22, 0.03, CM.black, 0, 1.9, 0.98);
  [-0.45, 0.15].forEach(x => RB(C, 0.28, 0.1, 0.2, 0.04, mR, x, 1.97, 0.98));
  [-0.15, 0.45].forEach(x => RB(C, 0.28, 0.1, 0.2, 0.04, mW, x, 1.97, 0.98));
  car.siren = [mR, mW];
  // roller-shutter lockers, white stripe, tread-plate steps
  [-1, 1].forEach(sd => {
    [-1.05, -0.5, 0.05].forEach(z => {
      const x = sd * (I.hw(1.25, z) + 0.006);
      RB(C, 0.02, 0.56, 0.5, 0.012, CM.alu, x, 1.24, z);
      for (let k = 0; k < 9; k++) RB(C, 0.026, 0.012, 0.49, 0.004, CM.gun, x, 1.0 + k * 0.06, z);
      RB(C, 0.03, 0.03, 0.3, 0.01, CM.chrome, x + sd * 0.01, 0.99, z);
    });
    RB(C, 0.012, 0.07, 2.9, 0.006, CM.white, sd * (I.hw(0.9, 0) + 0.004), 0.9, 0);
    RB(C, 0.2, 0.04, 0.4, 0.01, M3.plate, sd * 0.72, 0.36, 0.55);
    addMesh(C, cylGeo(0.05, 0.05, 0.26, 14), CM.red, sd * (I.hw(1.3, 0.25) + 0.05), 1.25, 0.24);
    addMesh(C, cylGeo(0.02, 0.025, 0.05, 10), CM.black, sd * (I.hw(1.3, 0.25) + 0.05), 1.4, 0.24);
  });
  // ladders on the roof: rear turntable, front cradle
  addMesh(C, cylGeo(0.32, 0.34, 0.12, 28), CM.gun, 0, 1.75, -1.0);
  RB(C, 0.5, 0.2, 0.42, 0.05, car.paint, 0, 1.88, -1.05);
  ladder(C, 2.3, 0.6, 2.0, -0.25, 13);
  ladder(C, 1.8, 0.48, 2.1, -0.4, 10, 0.01);
  RB(C, 0.7, 0.05, 0.08, 0.02, CM.black, 0, 1.9, 0.68);
  [-0.3, 0.3].forEach(x => RB(C, 0.05, 0.12, 0.05, 0.015, CM.black, x, 1.86, 0.68));
  // rear: shutter, step, handrails, lights, flashing ambers
  const zr = I.zr;
  RB(C, 1.0, 0.7, 0.02, 0.012, CM.alu, 0, 1.15, zr + 0.002);
  for (let k = 0; k < 11; k++) RB(C, 0.98, 0.012, 0.026, 0.004, CM.gun, 0, 0.83 + k * 0.064, zr - 0.004);
  RB(C, 1.4, 0.05, 0.28, 0.015, M3.plate, 0, 0.36, zr - 0.08);
  [-0.6, 0.6].forEach(x => tube(C, [[x, 0.9, zr], [x, 0.92, zr - 0.06], [x, 1.45, zr - 0.06], [x, 1.47, zr]], 0.014, CM.chrome, 10));
  const amb = new THREE.MeshStandardMaterial({color: 0x553300, emissive: 0xff9900, emissiveIntensity: 0.2});
  [-1, 1].forEach(sd => { RB(C, 0.12, 0.16, 0.03, 0.02, car.tailMat, sd * 0.68, 0.62, zr + 0.01); RB(C, 0.12, 0.08, 0.03, 0.02, amb, sd * 0.68, 1.55, zr + 0.01); });
  car.blink.push(amb);
  [-1, 1].forEach(sd => {
    const x = sd * (I.hw(1.3, 1.3) + 0.02);
    tube(C, [[x, 1.2, 1.3], [x + sd * 0.18, 1.24, 1.32], [x + sd * 0.18, 1.55, 1.32]], 0.01, CM.chrome, 8);
    RB(C, 0.06, 0.28, 0.13, 0.02, CM.black, x + sd * 0.19, 1.4, 1.32);
    addMesh(C, new THREE.PlaneGeometry(0.1, 0.24), CM.chrome, x + sd * 0.19, 1.4, 1.254, 0, Math.PI, 0);
  });
  exhaustTip(car, [0.62, 0.28, -0.3], [0.5, -0.2, -1], 0.045, 1);
};

// ============ 16. DRIFT COUPE ============
BUILD.drift = car => {
  const C = car.chassis; car.freq = 10; car.damp = 0.38;
  const s = {L: 2.45, W: 1.5, yb: 0.18, wf: [0.74, 0.3], wr: [-0.74, 0.3], arch: 0.04, noseY: 0.46, hoodCtl: [1.05, 0.66], belt: 0.7,
    cab: {a: 0.24, b: -0.1, c: -0.48, d: -0.88, roof: 1.08, bulge: 0.025, w: 0.82, taper: 0.3}, deckY: 0.76, deckRise: 0.02, tailY: 0.78,
    cr: 0.1, taper: 0.16, plan: 0.13, planR: 0.06, bevel: 0.06};
  const I = sedanBody(car, s);
  [1, -1].forEach(sd => { addWheel(car, {x: sd * 0.66, z: 0.74, r: 0.3, w: 0.32, front: true, rim: 'mesh'}); addWheel(car, {x: sd * 0.66, z: -0.74, r: 0.3, w: 0.36, rim: 'mesh'}); });
  [0.74, -0.74].forEach(z => [-1, 1].forEach(sd => overfender(car, sd * (I.hw(0.5, z) + 0.02), 0.3, z, 0.42, sd)));
  // pop-up headlights: they flip up when you drive or rev, and fold away when parked
  [-1, 1].forEach(sd => {
    const g = new THREE.Group(); g.position.set(sd * 0.42, 0.65, 0.84); C.add(g);
    RB(g, 0.32, 0.03, 0.2, 0.012, car.paint, 0, 0, 0.1);
    RB(g, 0.3, 0.12, 0.17, 0.03, CM.black, 0, -0.07, 0.1);
    [-0.07, 0.07].forEach(x => addMesh(g, cylGeo(0.05, 0.05, 0.02, 18), CM.head, x, -0.13, 0.1));
    let open = 0;
    car.keep.push(g); car.anim.push((st, t, dt) => { open = lerp(open, Math.abs(st.speed) > 0.5 || st.throttle > 0 ? 1 : 0, Math.min(1, dt * 5)); g.rotation.x = -1.25 * open; });
  });
  // turbo poking through the hood with a spinning compressor, screamer pipe that spits flame
  const T = new THREE.Group(); T.position.set(0.3, 0.7, 0.42); C.add(T);
  addMesh(T, cylGeo(0.12, 0.12, 0.02, 24), CM.black, 0, -0.01, 0);
  addMesh(T, new THREE.TorusGeometry(0.075, 0.035, 10, 24), CM.alu, 0, 0.03, 0, Math.PI / 2, 0, 0);
  addMesh(T, cylGeo(0.055, 0.065, 0.07, 20, true), CM.chrome, 0, 0.08, 0);
  const cw = new THREE.Group(); cw.position.set(0, 0.07, 0); T.add(cw);
  for (let i = 0; i < 8; i++) RB(cw, 0.008, 0.05, 0.045, 0.003, CM.alu, Math.cos(i / 8 * Math.PI * 2) * 0.025, 0, Math.sin(i / 8 * Math.PI * 2) * 0.025, 0, -i / 8 * Math.PI * 2, 0.5);
  addMesh(cw, cylGeo(0.012, 0.012, 0.03, 8), CM.chrome, 0, 0.015, 0);
  car.spin.push({o: cw, ax: 'y', k: 3});
  tube(C, [[0.38, 0.72, 0.36], [0.5, 0.8, 0.3], [0.56, 0.98, 0.26]], 0.028, CM.chrome, 12);
  exhaustTip(car, [0.565, 1.02, 0.25], [0.15, 1, -0.3], 0.032, 0.9);
  // intercooler, canards, tow strap, louvred hood vent
  RB(C, 0.86, 0.16, 0.04, 0.02, CM.alu, 0, 0.32, I.zf + 0.005);
  for (let i = 0; i < 6; i++) RB(C, 0.84, 0.008, 0.045, 0.003, CM.black, 0, 0.26 + i * 0.024, I.zf + 0.01);
  [-1, 1].forEach(sd => [0.26, 0.38].forEach((y, k) => RB(C, 0.16 - k * 0.03, 0.012, 0.12, 0.005, CM.carbon, sd * (0.58 - k * 0.02), y, I.zf - 0.08, 0, sd * 0.3, sd * 0.15)));
  RB(C, 0.05, 0.14, 0.02, 0.01, CM.red, 0.42, 0.22, I.zf + 0.02, 0.4, 0, 0);
  RB(C, 1.3, 0.025, 0.14, 0.01, CM.black, 0, 0.13, I.zf - 0.04);
  for (let i = 0; i < 5; i++) RB(C, 0.32, 0.012, 0.03, 0.005, CM.black, -0.22, 0.705 - i * 0.004, 0.62 - i * 0.06, -0.08, 0, 0);
  // GT wing on uprights, side skirts, quad round tail lights, one huge exhaust
  [-0.42, 0.42].forEach(x => RB(C, 0.03, 0.22, 0.12, 0.01, CM.black, x, 0.94, -1.0));
  addMesh(C, extrudeX(airfoil(0.3, 0.04), 1.36, 0.012), CM.carbon, 0, 1.06, -1.04);
  [-0.68, 0.68].forEach(x => RB(C, 0.02, 0.16, 0.34, 0.01, car.paint, x, 1.06, -1.04));
  [-1, 1].forEach(sd => {
    RB(C, 0.05, 0.06, 0.8, 0.02, CM.black, sd * (I.hw(0.22, 0) + 0.01), 0.22, 0);
    [0.36, 0.56].forEach(x => addMesh(C, cylGeo(0.06, 0.06, 0.03, 20), car.tailMat, sd * x, 0.66, I.zr + 0.02, Math.PI / 2, 0, 0));
    decal(C, 1.0, 0.18, wordDecal('SIDEWAYS', '#ff3b30', 46), sd * (I.hw(0.42, -0.05) + 0.006), 0.42, -0.05, sd * Math.PI / 2);
  });
  RB(C, 1.3, 0.1, 0.1, 0.04, CM.black, 0, 0.28, I.zr);
  exhaustTip(car, [0.42, 0.24, I.zr - 0.04], [0, 0.05, -1], 0.07, 1.4);
  plate(C, I.zr - 0.01, 0.46, 'DRIFT', Math.PI);
  // windscreen banner and an inside roll cage
  const wa = Math.atan2(s.cab.a - s.cab.b, s.cab.roof - s.belt);
  decal(C, 0.95, 0.09, (g, w, h) => { g.fillStyle = '#0d1b2a'; g.fillRect(0, 0, w, h); g.fillStyle = '#fff'; g.font = 'bold 22px sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText('TOY ROOM DRIFT CLUB', w / 2, h / 2 + 1); }, 0, s.cab.roof + 0.02, s.cab.b + 0.06, 0).rotation.x = -wa;
  [-1, 1].forEach(sd => tube(C, [[sd * 0.32, 0.78, 0.0], [sd * 0.3, 1.04, -0.15], [sd * 0.3, 1.04, -0.45], [sd * 0.32, 0.8, -0.7]], 0.014, CM.gun, 16));
  mirrors(car, I, 0.26, 0.72);
};

// ============ 17. BAJA TROPHY TRUCK ============
BUILD.baja = car => {
  const C = car.chassis; car.freq = 5.5; car.damp = 0.26;
  const s = {L: 2.9, W: 1.66, yb: 0.58, wf: [0.86, 0.42], wr: [-0.86, 0.42], arch: 0.07, noseY: 1.02, hoodCtl: [1.25, 1.16], belt: 1.18,
    cab: {a: 0.4, b: 0.16, c: -0.36, d: -0.5, roof: 1.72, bulge: 0.02, w: 0.84, taper: 0.22}, deckY: 1.2, bed: {y: 0.98}, tailY: 1.12,
    cr: 0.14, taper: 0.12, plan: 0.16, planR: 0.08, bevel: 0.06};
  const I = sedanBody(car, s);
  [1, -1].forEach(sd => { addWheel(car, {x: sd * 0.88, z: 0.86, r: 0.42, w: 0.36, front: true, tread: 'knobby', rim: 'beadlock', rimF: 0.52}); addWheel(car, {x: sd * 0.88, z: -0.86, r: 0.42, w: 0.38, tread: 'knobby', rim: 'beadlock', rimF: 0.52}); });
  // long-travel suspension: coilovers poke through the hood and stand up in the bed, bypass shocks beside them
  [-1, 1].forEach(sd => {
    addCoilover(car, [sd * 0.46, 1.36, 0.82], [sd * 0.66, 0.46, 0.82], 0.075, CM.red);
    addCoilover(car, [sd * 0.52, 1.3, 0.96], [sd * 0.68, 0.48, 0.92], 0.04, CM.alu);
    [-0.76, -0.96].forEach(z => addCoilover(car, [sd * 0.48, 1.42, z], [sd * 0.64, 0.46, z], 0.07, CM.red));
    addMesh(C, cylGeo(0.1, 0.1, 0.03, 18), CM.black, sd * 0.46, 1.21, 0.82);
  });
  [-0.86, 0.86].forEach(z => { addMesh(car.root, cylGeo(0.06, 0.06, 1.3, 14), CM.gun, 0, 0.42, z, 0, 0, Math.PI / 2); addMesh(car.root, sphGeo(0.15, 18, 12), CM.gun, 0, 0.42, z); });
  const sh = new THREE.Group(); sh.position.set(0, 0.48, 0); car.root.add(sh);
  addMesh(sh, cylGeo(0.04, 0.04, 1.4, 12), CM.alu, 0, 0, 0, Math.PI / 2, 0, 0);
  [-0.6, 0.6].forEach(z => RB(sh, 0.12, 0.035, 0.05, 0.01, CM.black, 0, 0, z));
  car.shafts.push(sh);
  // radiators in the bed with spinning fans, spare tyre, fuel filler
  [-1, 1].forEach(sd => {
    const R = new THREE.Group(); R.position.set(sd * 0.34, 1.28, -1.2); R.rotation.x = -0.55; C.add(R);
    RB(R, 0.56, 0.42, 0.06, 0.02, CM.alu, 0, 0, 0);
    for (let i = 0; i < 9; i++) RB(R, 0.012, 0.4, 0.07, 0.004, CM.gun, -0.24 + i * 0.06, 0, 0);
    addMesh(R, cylGeo(0.18, 0.18, 0.06, 24, true), CM.black, 0, 0, 0.05, Math.PI / 2, 0, 0);
    const fan = new THREE.Group(); fan.position.set(0, 0, 0.06); R.add(fan);
    for (let i = 0; i < 7; i++) RB(fan, 0.04, 0.16, 0.012, 0.005, CM.gun, Math.cos(i / 7 * Math.PI * 2) * 0.08, Math.sin(i / 7 * Math.PI * 2) * 0.08, 0, 0.4, 0, i / 7 * Math.PI * 2 - Math.PI / 2);
    addMesh(fan, cylGeo(0.03, 0.03, 0.03, 12), CM.chrome, 0, 0, 0, Math.PI / 2, 0, 0);
    car.spin.push({o: fan, ax: 'z', k: sd * 1.2});
  });
  addMesh(C, tyreGeo(0.32, 0.26, 0.18), tyreMat('knobby'), 0, 1.18, -0.82, 0, 0, Math.PI / 2);
  const spare = makeRim('beadlock', 0.18, 0.26, car); spare.position.set(0, 1.18, -0.82); spare.rotation.z = Math.PI / 2; C.add(spare);
  [-1, 1].forEach(sd => RB(C, 0.04, 0.1, 0.6, 0.02, CM.black, sd * 0.24, 1.1, -0.82));
  // light bar, tube bumper, skid plate, hood pins
  const rt = I.roofTop;
  RB(C, 1.1, 0.05, 0.08, 0.02, CM.black, 0, rt + 0.03, 0.12);
  for (let i = 0; i < 6; i++) { const x = -0.45 + i * 0.18; addMesh(C, cylGeo(0.065, 0.055, 0.08, 16), CM.black, x, rt + 0.11, 0.14, Math.PI / 2, 0, 0); headlamp(C, x, rt + 0.11, 0.185, 0.055); }
  tube(C, [[-0.62, 0.7, I.zf - 0.1], [-0.6, 0.62, I.zf + 0.08], [0.6, 0.62, I.zf + 0.08], [0.62, 0.7, I.zf - 0.1]], 0.035, CM.black, 18);
  RB(C, 0.56, 0.2, 0.03, 0.03, CM.black, 0, 0.84, I.zf - 0.005);
  for (let i = 0; i < 5; i++) RB(C, 0.52, 0.012, 0.035, 0.004, CM.gun, 0, 0.77 + i * 0.035, I.zf + 0.002);
  RB(C, 0.9, 0.04, 0.5, 0.02, M3.plate, 0, 0.58, I.zf - 0.22, 0.3, 0, 0);
  [-1, 1].forEach(sd => { RB(C, 0.26, 0.08, 0.03, 0.02, CM.head, sd * 0.5, 0.88, I.zf - 0.005); addMesh(C, cylGeo(0.016, 0.016, 0.03, 8), CM.chrome, sd * 0.3, 1.12, 1.2); });
  RB(C, 0.36, 0.08, 0.36, 0.03, car.paint, 0, 1.24, 0.62);
  RB(C, 0.3, 0.05, 0.02, 0.01, CM.black, 0, 1.25, 0.8);
  // livery, window nets, tail lights, flag whips, exhausts
  [-1, 1].forEach(sd => {
    decal(C, 0.28, 0.28, numDecal('71'), sd * (I.hw(1.0, 0.05) + 0.008), 1.0, 0.05, sd * Math.PI / 2);
    decal(C, 2.2, 0.36, (g, w, h) => { g.fillStyle = '#111111d0'; g.beginPath(); g.moveTo(0, h); g.lineTo(w * 0.1, 0); g.lineTo(w, 0); g.lineTo(w, h * 0.25); g.lineTo(w * 0.16, h * 0.25); g.lineTo(w * 0.08, h); g.fill(); g.fillStyle = '#fff'; g.font = 'bold 34px sans-serif'; g.textBaseline = 'middle'; g.fillText('DUST DEVIL', w * 0.6, h * 0.13); }, sd * (I.hw(0.72, 0) + 0.004), 0.72, 0, sd * Math.PI / 2);
    decal(C, 0.34, 0.28, (g, w, h) => { g.strokeStyle = '#111'; g.lineWidth = 5; for (let i = 0; i <= 8; i++) { g.beginPath(); g.moveTo(i * w / 8, 0); g.lineTo(i * w / 8, h); g.stroke(); g.beginPath(); g.moveTo(0, i * h / 8); g.lineTo(w, i * h / 8); g.stroke(); } }, sd * (I.hw(1.44, 0.1) + 0.03), 1.44, 0.12, sd * Math.PI / 2);
    RB(C, 0.14, 0.1, 0.03, 0.02, car.tailMat, sd * 0.6, 1.0, I.zr + 0.01);
    const wp = new THREE.Group(); wp.position.set(sd * 0.68, 1.16, -1.32); C.add(wp);
    addMesh(wp, cylGeo(0.007, 0.011, 1.2, 6), CM.black, 0, 0.6, 0);
    const fs = new THREE.Shape(); fs.moveTo(0, 0); fs.lineTo(0, 0.18); fs.lineTo(-0.26, 0.09); fs.lineTo(0, 0);
    addMesh(wp, new THREE.ShapeGeometry(fs), new THREE.MeshStandardMaterial({color: sd > 0 ? 0xffd400 : 0xff3b30, side: THREE.DoubleSide}), 0, 1.02, 0, 0, Math.PI / 2, 0);
    car.sway.push({o: wp, vx: 0, vz: 0});
    tube(C, [[sd * 0.56, 0.58, 0.0], [sd * 0.74, 0.56, -0.26], [sd * 0.8, 0.58, -0.34]], 0.04, CM.chrome, 10);
    exhaustTip(car, [sd * 0.82, 0.58, -0.38], [sd * 0.6, -0.05, -0.8], 0.05, 1.1);
  });
  mirrors(car, I, 0.42, 1.18);
};

// ============ 18. GT RACER ============
BUILD.gt = car => {
  const C = car.chassis; car.freq = 12; car.damp = 0.42;
  const s = {L: 2.75, W: 1.66, yb: 0.16, wf: [0.86, 0.31], wr: [-0.86, 0.32], arch: 0.04, noseY: 0.42, hoodCtl: [1.25, 0.64], belt: 0.7,
    cab: {a: 0.1, b: -0.24, c: -0.62, d: -1.0, roof: 1.04, bulge: 0.025, w: 0.78, taper: 0.34}, deckY: 0.78, deckRise: 0.02, tailY: 0.8,
    cr: 0.1, taper: 0.2, plan: 0.17, planR: 0.07, bevel: 0.06};
  const I = sedanBody(car, s);
  [1, -1].forEach(sd => { addWheel(car, {x: sd * 0.7, z: 0.86, r: 0.31, w: 0.36, front: true, tread: 'slick', rim: 'center', caliper: CM.red}); addWheel(car, {x: sd * 0.7, z: -0.86, r: 0.32, w: 0.4, tread: 'slick', rim: 'center', caliper: CM.red}); });
  // flat-plane V8 under a glass hood bubble: eight trumpets with butterflies, cam covers, belt drive
  const E = new THREE.Group(); E.position.set(0, 0.71, 0.64); E.rotation.x = 0.14; C.add(E);
  RB(E, 0.3, 0.05, 0.48, 0.02, CM.carbon, 0, 0.02, 0);
  [-0.17, 0.17].forEach(x => RB(E, 0.07, 0.06, 0.5, 0.02, CM.engRed, x, 0.03, 0));
  [-0.075, 0.075].forEach(x => { for (let i = 0; i < 4; i++) {
    const z = -0.17 + i * 0.113;
    addMesh(E, trumpetGeo(), CM.chrome, x, 0.04, z);
    const bf = new THREE.Group(); bf.position.set(x, 0.1, z); E.add(bf);
    addMesh(bf, cylGeo(0.027, 0.027, 0.004, 12), CM.gun, 0, 0, 0);
    car.flaps.push({o: bf, base: 0, amp: 1.3});
  } });
  pulley(car, E, 0.05, 0, 0.0, 0.27, 1); pulley(car, E, 0.035, 0.11, 0.04, 0.27, 1.6);
  beltBetween(E, [0, 0.0], 0.05, [0.11, 0.04], 0.035, 0.275);
  car.shakers.push({o: E, base: E.position.clone()});
  const bub = profShape([['m', 0.99, 0.63], ['q', 0.86, 0.87, 0.6, 0.89], ['q', 0.32, 0.9, 0.26, 0.72], ['l', 0.99, 0.63]]);
  addMesh(C, extrudeX(bub, 0.62, 0.04, makeTaper(2.75, 0.63, 0.9, 0.35, 0, 0)), CM.bubble).castShadow = false;
  // louvres over the front wheels, hood pins, splitter and canards
  [-1, 1].forEach(sd => { for (let i = 0; i < 6; i++) RB(C, 0.2, 0.012, 0.03, 0.005, CM.black, sd * 0.5, 0.71 - i * 0.008, 0.68 + i * 0.07, -0.25, 0, 0); });
  [-0.32, 0.32].forEach(x => addMesh(C, cylGeo(0.016, 0.016, 0.03, 10), CM.chrome, x, 0.66, 1.1));
  RB(C, s.W * 0.96, 0.03, 0.3, 0.012, CM.carbon, 0, 0.16, I.zf - 0.08);
  [-1, 1].forEach(sd => [0.27, 0.37].forEach((y, k) => RB(C, 0.16 - k * 0.04, 0.012, 0.14, 0.005, CM.carbon, sd * (0.68 - k * 0.02), y, I.zf - 0.14, 0, sd * 0.25, sd * 0.12)));
  [-1, 1].forEach(sd => { RB(C, 0.34, 0.09, 0.06, 0.03, CM.black, sd * 0.47, 0.45, 1.27, -0.45, sd * 0.25, 0); RB(C, 0.28, 0.05, 0.02, 0.02, CM.head, sd * 0.47, 0.455, 1.3, -0.45, sd * 0.25, 0); });
  RB(C, 0.8, 0.12, 0.04, 0.03, CM.black, 0, 0.27, I.zf - 0.02);
  for (let i = 0; i < 4; i++) RB(C, 0.78, 0.008, 0.045, 0.003, CM.gun, 0, 0.23 + i * 0.027, I.zf - 0.01);
  addMesh(C, new THREE.TorusGeometry(0.035, 0.01, 6, 14), CM.red, -0.4, 0.22, I.zf + 0.01);
  // swan-neck wing, roof scoop, diffuser, light bar
  [-0.4, 0.4].forEach(x => tube(C, [[x, 0.82, -1.02], [x, 1.06, -1.04], [x, 1.22, -1.14], [x, 1.16, -1.22]], 0.018, CM.black, 16));
  addMesh(C, extrudeX(airfoil(0.38, 0.045), 1.5, 0.012), CM.carbon, 0, 1.1, -1.24);
  [-0.76, 0.76].forEach(x => RB(C, 0.02, 0.24, 0.48, 0.01, car.paint, x, 1.06, -1.22));
  RB(C, 0.28, 0.08, 0.3, 0.03, CM.black, 0, I.roofTop + 0.035, -0.4);
  RB(C, 0.22, 0.05, 0.02, 0.01, CM.gun, 0, I.roofTop + 0.04, -0.25);
  for (let i = 0; i < 6; i++) RB(C, 0.02, 0.14, 0.32, 0.005, CM.carbon, -0.5 + i * 0.2, 0.22, I.zr + 0.08);
  RB(C, 1.3, 0.035, 0.02, 0.012, car.tailMat, 0, 0.7, I.zr + 0.012);
  addMesh(C, new THREE.TorusGeometry(0.035, 0.01, 6, 14), CM.red, 0.4, 0.3, I.zr - 0.01);
  // side pipes that spit fire just ahead of the rear wheels
  [-1, 1].forEach(sd => {
    const x = sd * (I.hw(0.27, -0.42) + 0.02);
    exhaustTip(car, [x, 0.27, -0.42], [sd * 1, 0, -0.45], 0.045, 1.2);
    decal(C, 0.36, 0.36, numDecal('44'), sd * (I.hw(0.48, -0.1) + 0.008), 0.48, -0.1, sd * Math.PI / 2);
    decal(C, 2.3, 0.3, (g, w, h) => { g.fillStyle = '#ffffffd8'; g.fillRect(0, h * 0.35, w, h * 0.16); g.fillStyle = '#ffd166d8'; g.fillRect(0, h * 0.58, w, h * 0.08); }, sd * (I.hw(0.62, 0) + 0.005), 0.62, 0, sd * Math.PI / 2);
  });
  const wa = Math.atan2(s.cab.a - s.cab.b, s.cab.roof - s.belt);
  decal(C, 0.9, 0.09, (g, w, h) => { g.fillStyle = '#111'; g.fillRect(0, 0, w, h); g.fillStyle = '#ffd166'; g.font = 'bold 24px sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText('TOY ROOM GT', w / 2, h / 2 + 1); }, 0, s.cab.roof + 0.02, s.cab.b + 0.06, 0).rotation.x = -wa;
  mirrors(car, I, 0.1, 0.7);
};

// ============ 19. SILVER ARROW ============
BUILD.arrow = car => {
  const C = car.chassis; car.freq = 8.5; car.damp = 0.3;
  [1, -1].forEach(sd => {
    addWheel(car, {x: sd * 0.64, z: 1.0, r: 0.36, w: 0.16, front: true, rim: 'wire', rimF: 0.66});
    addWheel(car, {x: sd * 0.66, z: -0.95, r: 0.38, w: 0.2, rim: 'wire', rimF: 0.64});
  });
  // cigar-shaped hull, open grille with a fan spinning behind the bars
  const hullG = new THREE.LatheGeometry([[0.001, -1.56], [0.1, -1.5], [0.22, -1.3], [0.31, -1.05], [0.37, -0.75], [0.4, -0.4], [0.41, 0], [0.4, 0.45], [0.37, 0.85], [0.33, 1.2], [0.3, 1.38], [0.27, 1.47], [0.21, 1.52]].map(p => new V2(p[0], p[1])), 44);
  hullG.rotateX(Math.PI / 2); hullG.scale(1, 0.82, 1);
  addMesh(C, hullG, car.paint, 0, 0.6, 0);
  const grille = addMesh(C, cylGeo(0.215, 0.215, 0.02, 28), CM.black, 0, 0.6, 1.48, Math.PI / 2, 0, 0); grille.scale.z = 0.82;
  const fan = new THREE.Group(); fan.position.set(0, 0.6, 1.5); C.add(fan);
  for (let i = 0; i < 4; i++) RB(fan, 0.05, 0.3, 0.012, 0.005, CM.gun, 0, 0, 0, 0.35, 0, i * Math.PI / 4);
  car.spin.push({o: fan, ax: 'z', k: 1.2});
  for (let i = 0; i < 7; i++) { const x = -0.15 + i * 0.05; RB(C, 0.012, Math.sqrt(0.045 - x * x) * 1.64, 0.02, 0.005, CM.chrome, x, 0.6, 1.53); }
  addMesh(C, new THREE.TorusGeometry(0.22, 0.016, 8, 32), CM.chrome, 0, 0.6, 1.52).scale.y = 0.82;
  // cockpit, leather rim, tiny windscreen, driver in a leather helmet and goggles
  addMesh(C, sphGeo(1, 24, 12), CM.black, 0, 0.9, -0.35).scale.set(0.22, 0.06, 0.4);
  const rim = addMesh(C, new THREE.TorusGeometry(1, 0.08, 8, 36), CM.leather, 0, 0.935, -0.35, -Math.PI / 2, 0, 0); rim.scale.set(0.23, 0.42, 0.3);
  RB(C, 0.32, 0.12, 0.012, 0.004, CM.glass, 0, 1.0, -0.03, -0.35, 0, 0);
  tube(C, [[-0.16, 0.94, -0.02], [-0.16, 1.05, -0.05], [0.16, 1.05, -0.05], [0.16, 0.94, -0.02]], 0.008, CM.chrome, 10);
  car.driverHead = driver(C, 0, 0.62, -0.38, CM.leather);
  [-0.055, 0.055].forEach(x => addMesh(car.driverHead, new THREE.TorusGeometry(0.035, 0.012, 6, 16), CM.chrome, x, 0.02, 0.13));
  RB(car.driverHead, 0.31, 0.02, 0.2, 0.008, CM.brown, 0, 0.02, 0.02);
  addMesh(C, sphGeo(1, 20, 12), car.paint, 0, 0.94, -0.78).scale.set(0.11, 0.09, 0.32);
  addMesh(C, cylGeo(0.035, 0.035, 0.02, 14), CM.chrome, 0.2, 0.88, -1.0, 0, 0, -0.4);
  // hood louvres and leather straps
  [-1, 1].forEach(sd => { for (let i = 0; i < 8; i++) RB(C, 0.012, 0.07, 0.03, 0.005, CM.black, sd * 0.385, 0.7, 0.2 + i * 0.08, 0, 0, -sd * 0.28); });
  [0.35, 0.85].forEach(z => { const R = z < 0.5 ? 0.408 : 0.375; addMesh(C, new THREE.TorusGeometry(R, 0.012, 6, 28, Math.PI), M3.brown, 0, 0.6, z).scale.y = 0.82; addMesh(C, cylGeo(0.022, 0.022, 0.01, 10), CM.chrome, 0, 0.6 + R * 0.82 + 0.01, z); });
  // four exhaust stubs sweep out of the left side into one long pipe
  for (let i = 0; i < 4; i++) { const z = 0.78 - i * 0.14; tube(C, [[-0.36, 0.6, z], [-0.47, 0.55, z - 0.05], [-0.48, 0.42, z - 0.16 - i * 0.02]], 0.026, CM.chrome, 10); }
  tube(C, [[-0.48, 0.43, 0.38], [-0.49, 0.4, 0.0], [-0.49, 0.38, -0.42]], 0.042, CM.chrome, 14);
  exhaustTip(car, [-0.5, 0.38, -0.48], [-0.6, 0, -1], 0.04, 1.3);
  // visible front wishbones, beam axle and rear de Dion tube
  [-1, 1].forEach(sd => {
    tube(car.root, [[sd * 0.2, 0.44, 1.12], [sd * 0.56, 0.36, 1.0]], 0.014, CM.black, 2);
    tube(car.root, [[sd * 0.2, 0.44, 0.88], [sd * 0.56, 0.36, 1.0]], 0.014, CM.black, 2);
    tube(car.root, [[sd * 0.25, 0.3, 1.0], [sd * 0.56, 0.32, 1.0]], 0.014, CM.black, 2);
    addMesh(C, cylGeo(0.07, 0.07, 0.03, 18), CM.gun, sd * 0.3, 0.6, 1.0, 0, 0, Math.PI / 2);
    tube(car.root, [[sd * 0.25, 0.48, -0.95], [sd * 0.56, 0.38, -0.95]], 0.016, CM.black, 2);
    decal(C, 0.3, 0.3, numDecal('8', '#d0262c'), sd * 0.4, 0.6, -0.4, sd * Math.PI / 2);
  });
  addMesh(car.root, cylGeo(0.03, 0.03, 1.1, 12), CM.gun, 0, 0.38, -0.95, 0, 0, Math.PI / 2);
  addMesh(C, cylGeo(0.05, 0.05, 0.03, 16), car.tailMat, 0, 0.6, -1.555, Math.PI / 2, 0, 0);
  const mr = new THREE.Group(); mr.position.set(0.22, 1.0, 0.02); C.add(mr);
  addMesh(mr, cylGeo(0.006, 0.006, 0.12, 6), CM.chrome, 0, -0.06, 0);
  addMesh(mr, cylGeo(0.04, 0.04, 0.012, 16), CM.chrome, 0, 0.02, 0, Math.PI / 2, 0, 0);
};

// ============ 20. LE MANS PROTOTYPE ============
BUILD.lmp = car => {
  const C = car.chassis; car.freq = 13; car.damp = 0.45;
  const L = 3.1;
  [1, -1].forEach(sd => { addWheel(car, {x: sd * 0.72, z: 0.95, r: 0.32, w: 0.36, front: true, tread: 'slick', rim: 'center', caliper: CM.yellow}); addWheel(car, {x: sd * 0.72, z: -0.92, r: 0.34, w: 0.42, tread: 'slick', rim: 'center', caliper: CM.yellow}); });
  RB(C, 1.5, 0.04, 2.9, 0.015, CM.carbon, 0, 0.12, 0);
  // centre tub, fender pods over each wheel, sidepods, glass canopy
  const tub = profShape([['m', -1.52, 0.12], ['l', 1.3, 0.12], ['q', 1.62, 0.12, 1.62, 0.2], ['q', 1.55, 0.3, 1.25, 0.36], ['q', 0.75, 0.44, 0.5, 0.56], ['l', -0.35, 0.62], ['q', -0.9, 0.66, -1.35, 0.6], ['q', -1.52, 0.58, -1.52, 0.4], ['l', -1.52, 0.12]]);
  addMesh(C, extrudeX(tub, 0.88, 0.06, makeTaper(L, 0.12, 0.66, 0.3, 0.4, 0.1)), car.paint);
  const fpod = profShape([['m', 0.42, 0.14], ['arch', 0.95, 0.32, 0.4, 0.14], ['l', 1.52, 0.14], ['q', 1.62, 0.16, 1.56, 0.28], ['q', 1.3, 0.64, 0.95, 0.8], ['q', 0.55, 0.78, 0.42, 0.5], ['l', 0.42, 0.14]]);
  const rpod = profShape([['m', -1.55, 0.14], ['arch', -0.92, 0.34, 0.42, 0.14], ['l', -0.3, 0.14], ['q', -0.15, 0.16, -0.2, 0.4], ['q', -0.35, 0.8, -0.92, 0.84], ['q', -1.4, 0.84, -1.55, 0.6], ['l', -1.55, 0.14]]);
  const fG = extrudeX(fpod, 0.46, 0.05, makeTaper(L, 0.14, 0.8, 0.3, 0.15, 0)), rG = extrudeX(rpod, 0.46, 0.05, makeTaper(L, 0.14, 0.84, 0.3, 0, 0.1));
  const ers = new THREE.MeshStandardMaterial({color: 0x002a33, emissive: 0x00e5ff, emissiveIntensity: 0.4, roughness: 0.3});
  [-1, 1].forEach(sd => {
    addMesh(C, fG, car.paint, sd * 0.67, 0, 0); addMesh(C, rG, car.paint, sd * 0.67, 0, 0);
    RB(C, 0.46, 0.28, 0.76, 0.08, car.paint, sd * 0.67, 0.28, 0.05);
    RB(C, 0.3, 0.12, 0.08, 0.03, CM.black, sd * 0.67, 0.42, -0.28);
    RB(C, 0.012, 0.014, 0.7, 0.005, ers, sd * 0.9, 0.38, 0.05);
    RB(C, 0.24, 0.06, 0.05, 0.02, CM.black, sd * 0.67, 0.52, 1.39, -0.9, 0, 0); RB(C, 0.2, 0.03, 0.02, 0.012, CM.head, sd * 0.67, 0.535, 1.4, -0.9, 0, 0);
    RB(C, 0.02, 0.1, 0.02, 0.008, CM.black, sd * 0.6, 0.86, 0.55);
    RB(C, 0.12, 0.06, 0.04, 0.02, car.paint, sd * 0.62, 0.92, 0.55);
  });
  car.anim.push(st => { ers.emissiveIntensity = 0.3 + st.throttle * 2.4 + (st.boost ? 3 : 0); });
  const can = addMesh(C, sphGeo(1, 32, 18), CM.glass, 0, 0.6, 0.05); can.scale.set(0.34, 0.29, 0.72);
  car.driverHead = driver(C, 0.12, 0.28, -0.02, CM.yellow);
  RB(C, 0.14, 0.07, 0.24, 0.03, CM.black, 0, 0.9, -0.3);
  // shark fin with a lit number panel, rear wing on big endplates, diffuser
  const fin = profShape([['m', -0.3, 0.8], ['q', -0.8, 1.0, -1.45, 1.04], ['l', -1.5, 0.62], ['l', -0.4, 0.64], ['l', -0.3, 0.8]]);
  addMesh(C, extrudeX(fin, 0.035, 0.012), car.paint);
  const numM = new THREE.MeshBasicMaterial({toneMapped: false, map: canvasTex(128, 96, (g, w, h) => { g.fillStyle = '#e8f4ff'; g.fillRect(0, 0, w, h); g.fillStyle = '#d0262c'; g.font = 'bold 84px sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText('24', w / 2, h / 2 + 6); })});
  [-1, 1].forEach(sd => { const m = new THREE.Mesh(new THREE.PlaneGeometry(0.3, 0.22), numM); m.position.set(sd * 0.022, 0.84, -0.95); m.rotation.y = sd * Math.PI / 2; C.add(m); });
  addMesh(C, extrudeX(airfoil(0.42, 0.05), 1.7, 0.012), CM.carbon, 0, 0.98, -1.5);
  [-0.86, 0.86].forEach(x => RB(C, 0.025, 0.44, 0.56, 0.01, car.paint, x, 0.8, -1.46));
  for (let i = 0; i < 6; i++) RB(C, 0.02, 0.14, 0.34, 0.005, CM.carbon, -0.5 + i * 0.2, 0.2, -1.5);
  RB(C, 0.9, 0.03, 0.02, 0.012, car.tailMat, 0, 0.56, -1.56);
  RB(C, 1.6, 0.03, 0.36, 0.012, CM.carbon, 0, 0.13, 1.45);
  // twin-turbo V6 under a glass engine window: spinning compressors, red plenum
  const E = new THREE.Group(); E.position.set(0, 0.62, -0.78); C.add(E);
  RB(E, 0.34, 0.06, 0.46, 0.02, CM.engRed, 0, 0.04, 0);
  [-1, 1].forEach(sd => {
    addMesh(E, new THREE.TorusGeometry(0.06, 0.028, 10, 22), CM.alu, sd * 0.13, 0.1, -0.16, Math.PI / 2, 0, 0);
    const cw = new THREE.Group(); cw.position.set(sd * 0.13, 0.12, -0.16); E.add(cw);
    for (let i = 0; i < 7; i++) RB(cw, 0.007, 0.04, 0.04, 0.003, CM.alu, Math.cos(i / 7 * Math.PI * 2) * 0.02, 0, Math.sin(i / 7 * Math.PI * 2) * 0.02, 0, -i / 7 * Math.PI * 2, 0.5);
    car.spin.push({o: cw, ax: 'y', k: sd * 3});
  });
  car.shakers.push({o: E, base: E.position.clone()});
  const eb = profShape([['m', -0.42, 0.62], ['q', -0.5, 0.82, -0.72, 0.82], ['q', -1.0, 0.82, -1.1, 0.64], ['l', -0.42, 0.62]]);
  addMesh(C, extrudeX(eb, 0.5, 0.03, makeTaper(L, 0.62, 0.83, 0.3, 0, 0)), CM.bubble).castShadow = false;
  exhaustTip(car, [0, 0.6, -1.55], [0, 0.3, -1], 0.05, 1.2);
};

// ============ 21. VOLT HYPER ============
BUILD.volt = car => {
  const C = car.chassis; car.freq = 11; car.damp = 0.42;
  const s = {L: 2.8, W: 1.72, yb: 0.15, wf: [0.88, 0.32], wr: [-0.88, 0.33], arch: 0.04, noseY: 0.34, cr: 0.12, taper: 0.24, plan: 0.24, planR: 0.12, bevel: 0.06, belt: 0.68, deckY: 0.78, yMax: 0.8,
    top: [['q', 1.38, 0.4, 1.1, 0.5], ['q', 0.85, 0.66, 0.5, 0.68], ['l', -0.45, 0.74], ['l', -1.2, 0.78], ['q', -1.4, 0.8, -1.4, 0.64]],
    cab: {a: 0.5, b: 0.08, c: -0.42, d: -0.72, roof: 1.04, bulge: 0.045, w: 0.8, taper: 0.38, baseD: 0.76}, roofMat: CM.glass};
  const I = sedanBody(car, s);
  [1, -1].forEach(sd => { addWheel(car, {x: sd * 0.7, z: 0.88, r: 0.32, w: 0.36, front: true, rim: 'aero', caliper: CM.blueM}); addWheel(car, {x: sd * 0.68, z: -0.88, r: 0.33, w: 0.42, rim: 'aero', caliper: CM.blueM}); });
  // light bars front and rear
  const led = new THREE.MeshStandardMaterial({color: 0xe8fbff, emissive: 0xbff4ff, emissiveIntensity: 2.4, roughness: 0.2});
  RB(C, 1.0, 0.022, 0.02, 0.01, led, 0, 0.42, I.zf - 0.06);
  [-1, 1].forEach(sd => RB(C, 0.34, 0.022, 0.02, 0.01, led, sd * 0.5, 0.47, I.zf - 0.14, -0.4, sd * 0.38, 0));
  RB(C, 1.36, 0.03, 0.02, 0.012, car.tailMat, 0, 0.68, I.zr + 0.012);
  // twin electric motors under a glass deck: coils glow with the throttle, rotors spin
  const coil = M3.copper.clone();
  [-0.22, 0.22].forEach(x => {
    const M = new THREE.Group(); M.position.set(x, 0.86, -1.0); C.add(M);
    addMesh(M, new THREE.TorusGeometry(0.11, 0.035, 10, 24), CM.alu, 0, 0, 0, 0, Math.PI / 2, 0);
    addMesh(M, new THREE.TorusGeometry(0.075, 0.022, 8, 24), coil, 0, 0, 0, 0, Math.PI / 2, 0);
    for (let i = 0; i < 10; i++) { const a = i / 10 * Math.PI * 2; RB(M, 0.075, 0.018, 0.03, 0.006, coil, 0, Math.cos(a) * 0.075, Math.sin(a) * 0.075, a); }
    const rot = new THREE.Group(); M.add(rot);
    for (let i = 0; i < 5; i++) RB(rot, 0.02, 0.12, 0.02, 0.006, CM.chrome, 0, 0, 0, i / 5 * Math.PI * 2);
    addMesh(rot, cylGeo(0.025, 0.025, 0.08, 12), CM.gun, 0, 0, 0, 0, 0, Math.PI / 2);
    car.spin.push({o: rot, ax: 'x', k: x > 0 ? 0.5 : -0.5});
  });
  RB(C, 0.16, 0.07, 0.22, 0.02, CM.black, 0, 0.84, -1.0);
  [-1, 1].forEach(sd => tube(C, [[sd * 0.06, 0.88, -0.92], [sd * 0.1, 0.92, -0.88], [sd * 0.16, 0.9, -0.95]], 0.012, M3.orange, 8));
  const deck = profShape([['m', -0.78, 0.8], ['q', -0.82, 0.98, -1.0, 0.98], ['q', -1.2, 0.98, -1.25, 0.82], ['l', -0.78, 0.8]]);
  addMesh(C, extrudeX(deck, 0.9, 0.04, makeTaper(2.8, 0.8, 0.98, 0.3, 0, 0)), CM.bubble).castShadow = false;
  const port = glowM(0x2bff88, 2), portC = new THREE.Color(0x2bff88);
  addMesh(C, cylGeo(0.035, 0.035, 0.01, 16), port, -(I.hw(0.62, -0.95) + 0.004), 0.62, -0.95, 0, 0, Math.PI / 2);
  car.anim.push((st, t) => { coil.emissiveIntensity = st.throttle * 1.6 + (st.rpmN || 0) * 1.2 + (st.boost ? 2 : 0); port.color.copy(portC).multiplyScalar(1 + Math.sin(t * 3) * 0.8); });
  // pop-up rear wing: rises with speed, flips into an air brake
  const wg = new THREE.Group(); wg.position.set(0, 0.8, -1.26); C.add(wg);
  [-0.38, 0.38].forEach(x => RB(wg, 0.03, 0.16, 0.06, 0.01, CM.black, x, 0, 0));
  const flap = new THREE.Group(); flap.position.set(0, 0.08, 0.1); wg.add(flap);
  addMesh(flap, extrudeX(airfoil(0.3, 0.03), 1.3, 0.01), car.paint, 0, 0, -0.12);
  car.wing = {o: wg, y0: 0.8, flap};
  // aero blades, camera mirrors, frunk shut line
  [-1, 1].forEach(sd => {
    RB(C, 0.02, 0.2, 0.3, 0.01, CM.carbon, sd * (I.hw(0.4, 0.34) + 0.012), 0.4, 0.34);
    const x = sd * (I.hw(0.7, 0.46) + 0.02);
    RB(C, 0.1, 0.02, 0.03, 0.008, CM.black, x + sd * 0.04, 0.72, 0.46);
    RB(C, 0.05, 0.04, 0.07, 0.015, car.paint, x + sd * 0.1, 0.73, 0.45);
  });
  RB(C, 0.9, 0.006, 0.012, 0.003, CM.seam, 0, 0.6, 0.9, -0.4, 0, 0);
  RB(C, 1.2, 0.12, 0.06, 0.03, CM.carbon, 0, 0.2, I.zr + 0.02);
  decal(C, 0.5, 0.1, wordDecal('V O L T', '#ffffff', 40), 0, 0.56, I.zr - 0.005, Math.PI);
};

// ============ 22. TOP FUEL DRAGSTER ============
BUILD.dragster = car => {
  const C = car.chassis; car.freq = 6; car.damp = 0.26;
  [1, -1].forEach(sd => {
    addWheel(car, {x: sd * 0.38, z: 1.62, r: 0.17, w: 0.07, front: true, rim: 'wire', rimF: 0.75, caliper: CM.gun});
    addWheel(car, {x: sd * 0.56, z: -1.15, r: 0.55, w: 0.52, tread: 'slick', rim: 'deep', rimF: 0.5});
  });
  // chrome-moly frame rails and bracing
  [-1, 1].forEach(sd => {
    tube(C, [[sd * 0.06, 0.2, 1.88], [sd * 0.15, 0.22, 1.0], [sd * 0.2, 0.26, 0.0], [sd * 0.22, 0.42, -0.9], [sd * 0.22, 0.52, -1.22]], 0.022, CM.chrome, 40);
    tube(C, [[sd * 0.1, 0.36, 1.2], [sd * 0.18, 0.44, 0.4], [sd * 0.22, 0.62, -0.2], [sd * 0.22, 0.7, -0.95]], 0.018, CM.chrome, 30);
    for (const z of [1.0, 0.4, -0.2, -0.75]) tube(C, [[sd * 0.17, 0.25 - z * 0.01, z], [sd * 0.18, 0.5 - z * 0.03, z - 0.25]], 0.012, CM.chrome, 2);
  });
  for (const [z, y] of [[1.4, 0.21], [0.6, 0.24], [-0.2, 0.3], [-0.95, 0.47]]) tube(C, [[-0.2, y, z], [0.2, y, z]], 0.014, CM.chrome, 2);
  addMesh(car.root, cylGeo(0.08, 0.08, 1.0, 16), CM.gun, 0, 0.55, -1.15, 0, 0, Math.PI / 2);
  addMesh(car.root, sphGeo(0.18, 20, 14), CM.alu, 0, 0.55, -1.15);
  addMesh(car.root, cylGeo(0.016, 0.016, 0.76, 8), CM.chrome, 0, 0.17, 1.62, 0, 0, Math.PI / 2);
  // nose cone, cowl, driver in a roll cage
  const nose = profShape([['m', 0.4, 0.16], ['l', 1.85, 0.16], ['q', 1.95, 0.18, 1.9, 0.24], ['q', 1.2, 0.36, 0.4, 0.46], ['l', 0.4, 0.16]]);
  addMesh(C, extrudeX(nose, 0.34, 0.04, makeTaper(3.8, 0.16, 0.46, 0.3, 0.5, 0)), car.paint);
  const cowl = profShape([['m', -0.18, 0.16], ['l', 0.42, 0.16], ['l', 0.42, 0.46], ['q', 0.2, 0.6, -0.18, 0.52], ['l', -0.18, 0.16]]);
  addMesh(C, extrudeX(cowl, 0.48, 0.05, makeTaper(3.8, 0.16, 0.6, 0.35, 0, 0)), car.paint);
  car.driverHead = driver(C, 0, 0.3, 0.06, CM.red);
  tube(C, [[-0.2, 0.42, -0.1], [-0.17, 0.86, -0.08], [0.17, 0.86, -0.08], [0.2, 0.42, -0.1]], 0.02, CM.chrome, 16);
  [-1, 1].forEach(sd => tube(C, [[sd * 0.17, 0.86, -0.08], [sd * 0.18, 0.6, 0.3]], 0.016, CM.chrome, 2));
  tube(C, [[0, 0.87, -0.08], [0, 0.6, -0.35]], 0.016, CM.chrome, 2);
  addMesh(C, new THREE.TorusGeometry(0.08, 0.012, 8, 20), CM.black, 0, 0.56, 0.32, -1.1, 0, 0);
  [-1, 1].forEach(sd => decal(C, 0.9, 0.16, wordDecal('NITRO', '#d0262c', 56), sd * 0.16, 0.3, 1.1, sd * Math.PI / 2 - sd * 0.06));
  // nitro Hemi: giant blower, hemi heads, sixteen zoomie pipes that spit fire
  const E = new THREE.Group(); E.position.set(0, 0.48, -0.55); C.add(E);
  RB(E, 0.34, 0.3, 0.7, 0.05, CM.alu, 0, 0, 0);
  RB(E, 0.3, 0.12, 0.6, 0.04, CM.black, 0, -0.18, 0);
  [-1, 1].forEach(sd => {
    RB(E, 0.16, 0.08, 0.68, 0.03, M3.gold, sd * 0.2, 0.18, 0, 0, 0, -sd * 0.55);
    for (let i = 0; i < 8; i++) {
      const z = -0.3 + i * 0.086;
      tube(E, [[sd * 0.25, 0.08, z], [sd * 0.36, 0.13, z - 0.04], [sd * 0.44, 0.26, z - 0.15]], 0.022, CM.chrome, 6);
      addMesh(E, cylGeo(0.017, 0.017, 0.01, 8), CM.black, sd * 0.445, 0.265, z - 0.152, -0.6, 0, -sd * 0.6);
    }
    for (const i of [1, 5]) car.exh.push({p: new V3(sd * 0.47, 0.78, -0.55 - 0.3 + i * 0.086 - 0.17), d: new V3(sd * 0.55, 0.9, -1), size: 1.7});
    tube(E, [[sd * 0.1, 0.2, 0.36], [sd * 0.12, 0.32, 0.3], [sd * 0.08, 0.42, 0.1]], 0.01, sd > 0 ? CM.blueM : CM.red, 10);
  });
  car.shakers.push({o: E, base: E.position.clone(), lope: true});
  blower(car, 0, 0.72, -0.55, 1.3);
  // towering rear wing, front wing, wheelie bars and a parachute pack
  [-1, 1].forEach(sd => tube(C, [[sd * 0.24, 0.58, -1.25], [sd * 0.3, 1.2, -1.55], [sd * 0.32, 1.7, -1.82]], 0.024, CM.black, 16));
  addMesh(C, extrudeX(airfoil(0.6, 0.07), 1.5, 0.014), car.paint, 0, 1.76, -1.9);
  addMesh(C, extrudeX(airfoil(0.36, 0.05), 1.46, 0.012), CM.black, 0, 1.6, -1.72);
  [-0.76, 0.76].forEach(x => RB(C, 0.022, 0.44, 0.76, 0.01, car.paint, x, 1.66, -1.84));
  decal(C, 1.0, 0.2, wordDecal('TOP FUEL', '#111', 56), 0, 1.81, -1.9, 0).rotation.x = -Math.PI / 2;
  addMesh(C, extrudeX(airfoil(0.24, 0.03), 0.8, 0.008), CM.black, 0, 0.28, 1.84);
  [-0.4, 0.4].forEach(x => RB(C, 0.016, 0.12, 0.26, 0.006, car.paint, x, 0.3, 1.84));
  [-1, 1].forEach(sd => { tube(C, [[sd * 0.2, 0.44, -1.4], [sd * 0.16, 0.28, -1.9], [sd * 0.14, 0.12, -2.25]], 0.018, CM.chrome, 10); addMesh(C, cylGeo(0.07, 0.07, 0.05, 14), CM.black, sd * 0.18, 0.07, -2.25, 0, 0, Math.PI / 2); });
  tube(C, [[-0.17, 0.28, -1.9], [0.17, 0.28, -1.9]], 0.012, CM.chrome, 2);
  RB(C, 0.22, 0.16, 0.36, 0.06, CM.red, 0, 0.44, -1.72);
  [-0.06, 0.06].forEach(x => tube(C, [[x, 0.52, -1.58], [x, 0.7, -1.2], [x * 2, 0.76, -0.2]], 0.006, CM.yellow, 10));
};

// ============ 23. HOVER RACER ============
BUILD.hover = car => {
  const C = car.chassis; car.freq = 4; car.damp = 0.25;
  const s = {L: 3.0, W: 1.5, yb: 0.36, noArch: true, noDoors: true, noseY: 0.5, cr: 0.08, taper: 0.3, plan: 0.34, planR: 0.14, bevel: 0.07, belt: 0.8, deckY: 0.86, yMax: 0.92,
    top: [['q', 1.42, 0.56, 1.05, 0.7], ['q', 0.8, 0.79, 0.55, 0.8], ['l', -0.6, 0.86], ['l', -1.3, 0.9], ['q', -1.5, 0.92, -1.5, 0.78]],
    cab: {a: 0.55, b: 0.15, c: -0.4, d: -0.66, roof: 1.12, bulge: 0.05, w: 0.72, taper: 0.4, baseD: 0.86}};
  const I = sedanBody(car, s);
  const neon = glowM(0xd04dff, 3);
  // four hover pads that glow onto the floor
  const padM = glowM(0xe070ff, 3.5), pool = [];
  [[1, 1], [-1, 1], [1, -1], [-1, -1]].forEach(([sx, sz], k) => {
    const x = sx * 0.56, z = sz * 0.95;
    addMesh(C, new THREE.TorusGeometry(0.15, 0.035, 10, 28), CM.gun, x, 0.27, z, Math.PI / 2, 0, 0);
    addMesh(C, new THREE.CircleGeometry(0.13, 24), padM, x, 0.26, z, Math.PI / 2, 0, 0);
    RB(C, 0.14, 0.08, 0.14, 0.03, CM.gun, x, 0.32, z);
    const gm = addGlow(0xc04dff, 0.5), g = new THREE.Mesh(new THREE.PlaneGeometry(1.1, 1.1), gm);
    g.rotation.x = -Math.PI / 2; g.position.set(x, 0.03, z); g.renderOrder = 3; car.root.add(g); pool.push([gm, k]);
  });
  // twin ducted fans with blue thrust, fins with blinking tips
  const sleeve = new THREE.MeshStandardMaterial({color: 0x1a1c22, metalness: 0.6, roughness: 0.4, side: THREE.DoubleSide});
  [-1, 1].forEach(sd => {
    const x = sd * 0.6, y = 0.62, z = -1.45;
    addMesh(C, new THREE.TorusGeometry(0.24, 0.05, 12, 32), car.paint, x, y, z);
    addMesh(C, cylGeo(0.24, 0.24, 0.3, 28, true), sleeve, x, y, z + 0.1, Math.PI / 2, 0, 0);
    addMesh(C, new THREE.TorusGeometry(0.245, 0.012, 6, 32), neon, x, y, z - 0.05);
    const fan = new THREE.Group(); fan.position.set(x, y, z + 0.08); C.add(fan);
    for (let i = 0; i < 9; i++) RB(fan, 0.05, 0.2, 0.012, 0.005, CM.alu, Math.cos(i / 9 * Math.PI * 2) * 0.12, Math.sin(i / 9 * Math.PI * 2) * 0.12, 0, 0.45, 0, i / 9 * Math.PI * 2 - Math.PI / 2);
    addMesh(fan, new THREE.ConeGeometry(0.05, 0.1, 16), CM.chrome, 0, 0, 0.05, Math.PI / 2, 0, 0);
    car.spin.push({o: fan, ax: 'z', k: sd * 2});
    for (let i = 0; i < 4; i++) RB(C, 0.012, 0.46, 0.04, 0.005, CM.gun, x, y, z - 0.02, 0, 0, i * Math.PI / 4);
    car.exh.push({p: new V3(x, y, z - 0.2), d: new V3(0, 0, -1), size: 2.1});
    RB(C, 0.22, 0.08, 0.5, 0.03, car.paint, sd * 0.5, 0.66, -1.15);
    const fin = profShape([['m', -1.2, 0.84], ['l', -1.58, 0.84], ['l', -1.66, 1.3], ['q', -1.45, 1.22, -1.2, 0.84]]);
    addMesh(C, extrudeX(fin, 0.04, 0.014), car.paint, x, 0, 0);
    const tip = new THREE.MeshStandardMaterial({color: 0x440055, emissive: 0xff40ff, emissiveIntensity: 0.2});
    RB(C, 0.05, 0.04, 0.08, 0.015, tip, x, 1.31, -1.64); car.blink.push(tip);
    for (let i = 0; i < 6; i++) { const z = -0.75 + i * 0.24; RB(C, 0.012, 0.02, 0.25, 0.008, neon, sd * (I.hw(0.48, z) + 0.005), 0.48, z); }
  });
  // headlight slits, intakes, big soft underglow
  RB(C, 1.0, 0.035, 0.02, 0.012, car.tailMat, 0, 0.72, I.zr + 0.012);
  RB(C, 0.9, 0.1, 0.06, 0.03, CM.carbon, 0, 0.36, I.zr + 0.02);
  [-1, 1].forEach(sd => { RB(C, 0.28, 0.03, 0.02, 0.01, CM.head, sd * 0.28, 0.46, I.zf - 0.01, 0, sd * 0.2, 0); RB(C, 0.03, 0.14, 0.4, 0.04, CM.black, sd * (I.hw(0.6, -0.3) + 0.006), 0.6, -0.3); });
  const glow = new THREE.Mesh(new THREE.PlaneGeometry(s.W * 1.5, s.L * 1.2), addGlow(0xb03dff, 0.35));
  glow.rotation.x = -Math.PI / 2; glow.position.y = 0.04; glow.renderOrder = 3; car.root.add(glow);
  // the whole body bobs gently on its air cushion, pads pulse with the throttle
  car.anim.push((st, t) => {
    C.position.y += 0.035 * Math.sin(t * 2.2); C.rotation.z += 0.012 * Math.sin(t * 1.7); C.rotation.x += 0.008 * Math.sin(t * 1.3);
    for (const [gm, k] of pool) gm.opacity = 0.35 + 0.12 * Math.sin(t * 9 + k * 1.7) + st.throttle * 0.25;
  });
  mirrors(car, I, 0.56, 0.8);
};
