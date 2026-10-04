// ============ CAR MODELS (part 2): rally, F1, hot rod, hyper, rocket ============
const airfoil = (c, t) => profShape([['m', c / 2, 0], ['q', c * 0.2, t * 1.4, -c / 2, t * 0.25], ['q', -c * 0.1, -t * 0.4, c / 2, 0]]);
function flareArc(car, x, y, z, R){
  const g = new THREE.TorusGeometry(R, 0.045, 8, 28, Math.PI);
  addMesh(car.chassis, g, CM.black, x, y, z, 0, Math.PI / 2, 0);
}
function trumpetGeo(){
  if (trumpetGeo.g) return trumpetGeo.g;
  const p = []; for (let i = 0; i <= 10; i++) { const t = i / 10; p.push(new V2(0.03 + Math.pow(t, 3) * 0.035, t * 0.11)); }
  return (trumpetGeo.g = new THREE.LatheGeometry(p, 18));
}

// ============ 6. RALLY HATCH ============
BUILD.rally = car => {
  const C = car.chassis; car.freq = 9; car.damp = 0.34;
  const s = {L: 2.15, W: 1.5, yb: 0.22, wf: [0.57, 0.32], wr: [-0.58, 0.32], arch: 0.05, noseY: 0.66, belt: 0.86, deckY: 0.9, yMax: 0.92,
    top: [['q', 0.85, 0.86, 0.34, 0.86], ['l', -0.86, 0.9], ['l', -0.95, 0.9], ['q', -1.075, 0.9, -1.075, 0.76]],
    cab: {a: 0.34, b: 0.04, c: -0.72, d: -0.9, roof: 1.32, bulge: 0.03}, cr: 0.14, taper: 0.16, plan: 0.1, bevel: 0.06};
  const I = sedanBody(car, s);
  [1, -1].forEach(sd => { addWheel(car, {x: sd * 0.62, z: 0.57, r: 0.32, w: 0.3, front: true, rim: 'spoke5', caliper: CM.yellow}); addWheel(car, {x: sd * 0.62, z: -0.58, r: 0.32, w: 0.3, rim: 'spoke5', caliper: CM.yellow}); });
  [[0.57], [-0.58]].forEach(([z]) => [-1, 1].forEach(sd => flareArc(car, sd * (I.hw(0.6, z) + 0.01), 0.32, z, 0.45)));
  // hood vent, roof scoop, intercooler in the bumper
  RB(C, 0.42, 0.04, 0.3, 0.02, CM.black, 0, 0.92, 0.55, -0.08, 0, 0);
  for (let i = 0; i < 5; i++) RB(C, 0.38, 0.015, 0.03, 0.005, CM.gun, 0, 0.945, 0.43 + i * 0.055, -0.08, 0, 0);
  RB(C, 0.3, 0.09, 0.26, 0.04, CM.black, 0, I.roofTop + 0.04, 0.05);
  RB(C, 0.9, 0.16, 0.04, 0.02, CM.alu, 0, 0.36, I.zf + 0.005);
  for (let i = 0; i < 6; i++) RB(C, 0.88, 0.008, 0.045, 0.003, CM.black, 0, 0.3 + i * 0.024, I.zf + 0.01);
  // spotlight pod
  RB(C, 0.9, 0.04, 0.05, 0.02, CM.black, 0, 0.6, I.zf + 0.08);
  [-0.33, -0.11, 0.11, 0.33].forEach(x => { addMesh(C, cylGeo(0.075, 0.065, 0.08, 16), CM.black, x, 0.6, I.zf + 0.13, Math.PI / 2, 0, 0); headlamp(C, x, 0.6, I.zf + 0.175, 0.06); });
  [-0.5, 0.5].forEach(x => RB(C, 0.2, 0.08, 0.03, 0.03, CM.head, x, 0.6, I.zf - 0.02));
  // big rear wing on the hatch
  const wy = I.roofTop - 0.02;
  [-0.4, 0.4].forEach(x => RB(C, 0.03, 0.16, 0.1, 0.01, CM.black, x, wy + 0.06, -0.72));
  addMesh(C, extrudeX(airfoil(0.32, 0.04), 1.3, 0.012), CM.black, 0, wy + 0.14, -0.8);
  [-0.65, 0.65].forEach(x => RB(C, 0.02, 0.14, 0.34, 0.01, car.paint, x, wy + 0.14, -0.8));
  // livery: number roundels and stripes
  [-1, 1].forEach(sd => {
    const x = sd * (I.hw(0.55, -0.05) + 0.004);
    decal(C, 0.34, 0.34, (g, w) => { g.fillStyle = '#fff'; g.beginPath(); g.arc(w / 2, w / 2, w / 2 - 4, 0, 7); g.fill(); g.fillStyle = '#111'; g.font = 'bold 130px sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText('27', w / 2, w / 2 + 8); }, x + sd * 0.004, 0.56, -0.05, sd * Math.PI / 2);
    decal(C, 1.9, 0.5, (g, w, h) => { g.fillStyle = '#ffffffdd'; g.beginPath(); g.moveTo(0, h * 0.75); g.lineTo(w, h * 0.15); g.lineTo(w, h * 0.38); g.lineTo(0, h * 0.98); g.fill(); g.fillStyle = '#ffc83ddd'; g.beginPath(); g.moveTo(0, h * 0.55); g.lineTo(w, 0); g.lineTo(w, h * 0.1); g.lineTo(0, h * 0.68); g.fill(); }, x, 0.6, -0.02, sd * Math.PI / 2);
  });
  // mud flaps that swing about
  [[0.57], [-0.58]].forEach(([z]) => [-1, 1].forEach(sd => {
    const p = new THREE.Group(); p.position.set(sd * 0.62, 0.42, z - 0.4); C.add(p);
    RB(p, 0.3, 0.26, 0.02, 0.01, CM.red, 0, -0.13, 0);
    car.sway.push({o: p, vx: 0, vz: 0});
  }));
  [-0.55, 0.55].forEach(x => RB(C, 0.18, 0.14, 0.03, 0.03, car.tailMat, x, 0.74, I.zr + 0.01));
  RB(C, 1.4, 0.12, 0.12, 0.05, CM.black, 0, 0.3, I.zr);
  mirrors(car, I, 0.36, 0.86);
  const ap = new THREE.Group(); ap.position.set(0.25, I.roofTop, -0.55); C.add(ap);
  addMesh(ap, cylGeo(0.006, 0.01, 0.6, 6), CM.black, 0, 0.3, 0);
  car.sway.push({o: ap, vx: 0, vz: 0});
  exhaustTip(car, [-0.42, 0.26, I.zr - 0.02], [0, 0.05, -1], 0.065, 1.4);
};

// ============ 7. FORMULA TOY ============
BUILD.f1 = car => {
  const C = car.chassis; car.freq = 14; car.damp = 0.45;
  [1, -1].forEach(sd => {
    addWheel(car, {x: sd * 0.74, z: 0.88, r: 0.3, w: 0.32, front: true, tread: 'slick', rim: 'deep', rimF: 0.6});
    addWheel(car, {x: sd * 0.72, z: -0.92, r: 0.34, w: 0.44, tread: 'slick', rim: 'deep', rimF: 0.58});
  });
  const nose = profShape([['m', 0.25, 0.2], ['l', 1.22, 0.18], ['q', 1.4, 0.18, 1.4, 0.26], ['q', 1.38, 0.33, 1.2, 0.35], ['q', 0.75, 0.47, 0.25, 0.55], ['l', 0.25, 0.2]]);
  addMesh(C, extrudeX(nose, 0.36, 0.05, makeTaper(2.8, 0.18, 0.6, 0.35, 0.5, 0)), car.paint);
  const tub = profShape([['m', 0.35, 0.2], ['l', -0.55, 0.2], ['l', -0.55, 0.6], ['q', -0.3, 0.67, -0.15, 0.62], ['q', -0.08, 0.54, 0.05, 0.54], ['l', 0.22, 0.55], ['q', 0.35, 0.55, 0.35, 0.45], ['l', 0.35, 0.2]]);
  addMesh(C, extrudeX(tub, 0.6, 0.06, makeTaper(2.8, 0.2, 0.67, 0.3, 0, 0)), car.paint);
  const pod = profShape([['m', 0.08, 0.17], ['l', -0.95, 0.17], ['l', -0.95, 0.3], ['q', -0.5, 0.47, -0.02, 0.45], ['q', 0.1, 0.44, 0.08, 0.17]]);
  const podG = extrudeX(pod, 0.3, 0.07, makeTaper(2.8, 0.17, 0.5, 0.3, 0, 0));
  [-1, 1].forEach(sd => { addMesh(C, podG, car.paint, sd * 0.36, 0, 0); RB(C, 0.24, 0.18, 0.02, 0.04, CM.black, sd * 0.37, 0.32, 0.1); });
  const cover = profShape([['m', -0.25, 0.5], ['l', -0.12, 0.92], ['q', -0.2, 1.0, -0.42, 0.93], ['q', -0.9, 0.66, -1.22, 0.42], ['l', -1.22, 0.3], ['l', -0.25, 0.3], ['l', -0.25, 0.5]]);
  addMesh(C, extrudeX(cover, 0.34, 0.06, makeTaper(2.8, 0.3, 1.0, 0.45, 0, 0)), car.paint);
  RB(C, 0.17, 0.11, 0.02, 0.04, CM.black, 0, 0.88, -0.1, -0.35, 0, 0);
  RB(C, 0.12, 0.05, 0.07, 0.02, CM.yellow, 0, 1.01, -0.26);
  // rear wing with a DRS flap that opens on nitro
  [-0.64, 0.64].forEach(x => RB(C, 0.03, 0.45, 0.46, 0.015, car.paint, x, 0.82, -1.2));
  addMesh(C, extrudeX(airfoil(0.36, 0.05), 1.26, 0.012), CM.black, 0, 0.76, -1.16);
  const drs = new THREE.Group(); drs.position.set(0, 0.9, -1.06); C.add(drs);
  addMesh(drs, extrudeX(airfoil(0.24, 0.035), 1.24, 0.01), car.paint, 0, 0, -0.12);
  car.drs = drs;
  RB(C, 0.04, 0.36, 0.1, 0.015, CM.black, 0, 0.6, -1.14);
  // front wing
  addMesh(C, extrudeX(airfoil(0.34, 0.035), 1.56, 0.01), CM.black, 0, 0.11, 1.3);
  addMesh(C, extrudeX(airfoil(0.22, 0.03), 1.5, 0.01), car.paint, 0, 0.18, 1.2, 0.3, 0, 0);
  [-0.79, 0.79].forEach(x => RB(C, 0.025, 0.17, 0.42, 0.01, car.paint, x, 0.17, 1.25));
  // halo, driver, mirrors
  tube(C, [[-0.2, 0.6, -0.26], [-0.17, 0.74, -0.1], [0, 0.79, 0.06], [0.17, 0.74, -0.1], [0.2, 0.6, -0.26]], 0.022, CM.black, 30);
  tube(C, [[0, 0.79, 0.06], [0, 0.6, 0.24]], 0.02, CM.black, 4);
  car.driverHead = driver(C, 0, 0.32, -0.12, CM.yellow);
  [-1, 1].forEach(sd => decal(C, 0.6, 0.14, (g, w, h) => { g.fillStyle = '#fff'; g.font = 'bold 40px sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText('TOY RACING', w / 2, h / 2 + 2); }, sd * 0.515, 0.33, -0.45, sd * Math.PI / 2));
  decal(C, 0.2, 0.2, (g, w) => { g.fillStyle = '#fff'; g.font = 'bold 170px sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText('1', w / 2, w / 2 + 12); }, 0, 0.49, 0.62, 0).rotation.x = -Math.PI / 2 + 0.22;
  [-1, 1].forEach(sd => { RB(C, 0.02, 0.12, 0.02, 0.008, CM.black, sd * 0.36, 0.52, 0.12); RB(C, 0.09, 0.05, 0.04, 0.015, car.paint, sd * 0.38, 0.6, 0.12); });
  // suspension wishbones
  [[0.88, 0.62, 0.3], [-0.92, 0.6, 0.34]].forEach(([z, wx, wy]) => [-1, 1].forEach(sd => {
    tube(car.root, [[sd * 0.2, wy + 0.08, z + 0.15], [sd * wx, wy, z]], 0.012, CM.black, 2);
    tube(car.root, [[sd * 0.2, wy + 0.08, z - 0.15], [sd * wx, wy, z]], 0.012, CM.black, 2);
    tube(car.root, [[sd * 0.2, wy - 0.06, z], [sd * wx, wy - 0.03, z]], 0.012, CM.black, 2);
  }));
  // flashing rain light and exhaust
  const rain = new THREE.MeshStandardMaterial({color: 0x550000, emissive: 0xff1a1a, emissiveIntensity: 0.2});
  RB(C, 0.08, 0.06, 0.03, 0.01, rain, 0, 0.3, -1.26);
  car.blink.push(rain);
  exhaustTip(car, [0, 0.47, -1.24], [0, 0.25, -1], 0.05, 1.1);
};

// ============ 8. HOT ROD ============
BUILD.roadster = car => {
  const C = car.chassis; car.freq = 8; car.damp = 0.3;
  [1, -1].forEach(sd => {
    addWheel(car, {x: sd * 0.62, z: 0.98, r: 0.3, w: 0.2, front: true, tread: 'whitewall', rim: 'chrome', rimF: 0.55});
    addWheel(car, {x: sd * 0.68, z: -0.78, r: 0.42, w: 0.42, tread: 'whitewall', rim: 'chrome', rimF: 0.5});
  });
  [-1, 1].forEach(sd => tube(C, [[sd * 0.32, 0.42, 1.12], [sd * 0.32, 0.38, 0.6], [sd * 0.34, 0.38, -0.35], [sd * 0.36, 0.64, -0.78], [sd * 0.34, 0.48, -1.18]], 0.045, CM.black, 40));
  // body tub with open cockpit
  const tubS = profShape([['m', 0.22, 0.42], ['l', 0.22, 0.9], ['q', 0.12, 0.97, -0.02, 0.93], ['l', -0.12, 0.9], ['q', -0.2, 0.72, -0.35, 0.72], ['l', -0.62, 0.72], ['q', -0.72, 0.72, -0.75, 0.88], ['q', -0.95, 0.93, -1.15, 0.75], ['q', -1.22, 0.6, -1.15, 0.42], ['l', 0.22, 0.42]]);
  addMesh(C, extrudeX(tubS, 0.86, 0.07, makeTaper(2.6, 0.42, 1.0, 0.22, 0, 0.25)), car.paint);
  RB(C, 0.7, 0.12, 0.32, 0.05, CM.leather, 0, 0.8, -0.48);
  RB(C, 0.7, 0.3, 0.08, 0.04, CM.leather, 0, 0.94, -0.64, -0.2, 0, 0);
  car.driverHead = driver(C, 0.17, 0.66, -0.42, CM.white);
  RB(C, 0.74, 0.1, 0.06, 0.03, car.paint, 0, 0.93, -0.06);
  [-1, 1].forEach(sd => RB(C, 0.012, 0.02, 1.2, 0.006, CM.chrome, sd * 0.425, 0.66, -0.5));
  RB(C, 0.16, 0.05, 0.02, 0.012, CM.chrome, 0, 1.24, 0.12);
  [-0.12, 0.08].forEach(x => addMesh(C, new THREE.CircleGeometry(0.035, 20), CM.white, x + 0.12, 0.93, -0.095, 0, Math.PI, 0));
  addMesh(C, new THREE.TorusGeometry(0.12, 0.016, 8, 28), CM.black, 0.17, 0.96, -0.2, -0.6, 0, 0);
  // chopped windscreen
  [-0.38, 0.38].forEach(x => tube(C, [[x, 0.92, 0.2], [x, 1.2, 0.13]], 0.016, CM.chrome, 2));
  tube(C, [[-0.38, 1.2, 0.13], [0.38, 1.2, 0.13]], 0.016, CM.chrome, 2);
  RB(C, 0.76, 0.27, 0.012, 0.004, CM.glass, 0, 1.06, 0.165, -0.24, 0, 0);
  // classic grille shell
  const gs = new THREE.Shape(); gs.moveTo(-0.24, 0.35); gs.lineTo(0.24, 0.35); gs.lineTo(0.27, 0.82); gs.quadraticCurveTo(0.27, 0.97, 0.12, 0.99); gs.lineTo(-0.12, 0.99); gs.quadraticCurveTo(-0.27, 0.97, -0.27, 0.82); gs.lineTo(-0.24, 0.35);
  addMesh(C, smoothGeo(new THREE.ExtrudeGeometry(gs, {depth: 0.08, bevelEnabled: true, bevelThickness: 0.025, bevelSize: 0.025, bevelSegments: 3, curveSegments: 16})), CM.chrome, 0, 0, 1.1);
  RB(C, 0.42, 0.52, 0.02, 0.04, car.paint, 0, 0.66, 1.21);
  for (let i = 0; i < 9; i++) RB(C, 0.012, 0.5, 0.02, 0.005, CM.chrome, -0.18 + i * 0.045, 0.66, 1.225);
  addMesh(C, cylGeo(0.03, 0.035, 0.06, 12), CM.chrome, 0, 1.04, 1.15);
  // exposed straight-six
  const E = new THREE.Group(); E.position.set(0, 0, 0.62); C.add(E);
  RB(E, 0.28, 0.3, 0.72, 0.05, CM.engRed, 0, 0.56, 0);
  RB(E, 0.26, 0.09, 0.6, 0.03, CM.engRed, 0, 0.38, 0);
  RB(E, 0.22, 0.08, 0.68, 0.035, CM.chrome, 0, 0.75, 0);
  for (let i = 0; i < 6; i++) RB(E, 0.2, 0.02, 0.025, 0.008, CM.chrome, 0, 0.8, -0.27 + i * 0.11);
  [-0.22, 0, 0.22].forEach(z => {
    RB(E, 0.08, 0.1, 0.1, 0.02, CM.alu, 0.18, 0.74, z);
    addMesh(E, trumpetGeo(), CM.chrome, 0.18, 0.79, z);
    const bf = new THREE.Group(); bf.position.set(0.18, 0.85, z); E.add(bf);
    addMesh(bf, cylGeo(0.026, 0.026, 0.004, 12), CM.gun, 0, 0, 0);
    car.flaps.push({o: bf, base: 0, amp: 1.3});
  });
  addMesh(E, cylGeo(0.008, 0.008, 0.5, 6), CM.chrome, 0.24, 0.8, 0, Math.PI / 2, 0, 0);
  for (let i = 0; i < 6; i++) { const z = -0.27 + i * 0.11; tube(E, [[-0.14, 0.6, z], [-0.26, 0.58, z], [-0.33, 0.48, z * 0.7], [-0.38, 0.42, -0.42]], 0.02, CM.chrome, 14); }
  addMesh(E, cylGeo(0.035, 0.03, 0.1, 12), CM.black, -0.08, 0.84, -0.3);
  for (let i = 0; i < 6; i++) tube(E, [[-0.08, 0.89, -0.3], [-0.12, 0.9, -0.1 + i * 0.03], [-0.115, 0.72, -0.27 + i * 0.11]], 0.006, CM.red, 10);
  RB(E, 0.42, 0.5, 0.06, 0.03, CM.black, 0, 0.66, 0.45);
  const fan = new THREE.Group(); fan.position.set(0, 0.6, 0.39); E.add(fan);
  for (let i = 0; i < 4; i++) RB(fan, 0.05, 0.3, 0.012, 0.005, CM.gun, 0, 0, 0, 0.35, 0, i * Math.PI / 4);
  car.spin.push({o: fan, ax: 'z', k: 1});
  pulley(car, E, 0.06, 0, 0.42, 0.38, 1);
  pulley(car, E, 0.04, 0.15, 0.56, 0.37, 1.6);
  addMesh(E, cylGeo(0.06, 0.06, 0.12, 16), CM.alu, 0.15, 0.56, 0.3, Math.PI / 2, 0, 0);
  beltBetween(E, [0, 0.42], 0.06, [0.15, 0.56], 0.04, 0.37);
  car.shakers.push({o: E, base: E.position.clone(), lope: true});
  tube(C, [[-0.38, 0.42, 0.2], [-0.42, 0.36, -0.3], [-0.44, 0.34, -1.0]], 0.035, CM.chrome, 20);
  exhaustTip(car, [-0.44, 0.34, -1.05], [0, 0, -1], 0.045, 1.2);
  // front beam axle, leaf spring and shocks; rear shocks
  addMesh(car.root, cylGeo(0.035, 0.035, 1.24, 12), CM.chrome, 0, 0.3, 0.98, 0, 0, Math.PI / 2);
  tube(car.root, [[-0.5, 0.36, 0.98], [0, 0.44, 0.98], [0.5, 0.36, 0.98]], 0.02, CM.gun, 12);
  [-1, 1].forEach(sd => { addCoilover(car, [sd * 0.32, 0.56, 0.88], [sd * 0.5, 0.3, 0.98], 0.04, CM.chrome); addCoilover(car, [sd * 0.36, 0.72, -0.68], [sd * 0.5, 0.42, -0.78], 0.05, CM.chrome); });
  // bowl headlights on stalks
  [-1, 1].forEach(sd => {
    const x = sd * 0.38;
    tube(C, [[sd * 0.32, 0.42, 1.05], [x, 0.6, 1.04], [x, 0.74, 1.02]], 0.015, CM.chrome, 10);
    addMesh(C, new THREE.SphereGeometry(0.11, 24, 12, 0, Math.PI * 2, 0, Math.PI / 2), CM.chrome, x, 0.8, 1.02, -Math.PI / 2, 0, 0);
    addMesh(C, new THREE.CircleGeometry(0.1, 24), CM.head, x, 0.8, 1.022);
  });
  [-0.3, 0.3].forEach(x => addMesh(C, cylGeo(0.05, 0.05, 0.04, 16), car.tailMat, x, 0.62, -1.24, Math.PI / 2, 0, 0));
  tube(C, [[-0.4, 0.4, -1.22], [-0.42, 0.36, -1.28], [0.42, 0.36, -1.28], [0.4, 0.4, -1.22]], 0.018, CM.chrome, 14);
  plate(C, -1.25, 0.52, 'HOT 32', Math.PI);
};

// ============ 9. HYPER WEDGE ============
BUILD.hyper = car => {
  const C = car.chassis; car.freq = 11; car.damp = 0.4;
  const s = {L: 2.75, W: 1.66, yb: 0.15, wf: [0.82, 0.29], wr: [-0.86, 0.31], arch: 0.04, noseY: 0.36, cr: 0.1, taper: 0.22, plan: 0.2, planR: 0.1, bevel: 0.06, belt: 0.74, deckY: 0.81, yMax: 0.8,
    top: [['q', 1.16, 0.46, 1.1, 0.62], ['q', 0.82, 0.8, 0.42, 0.74], ['l', -0.6, 0.76], ['l', -1.22, 0.78], ['q', -1.375, 0.8, -1.375, 0.68]],
    cab: {a: 0.42, b: 0.02, c: -0.36, d: -0.58, roof: 1.06, bulge: 0.03, w: 0.8, taper: 0.38}};
  const I = sedanBody(car, s);
  [1, -1].forEach(sd => { addWheel(car, {x: sd * 0.68, z: 0.82, r: 0.29, w: 0.34, front: true, rim: 'deep', caliper: CM.yellow}); addWheel(car, {x: sd * 0.66, z: -0.86, r: 0.31, w: 0.44, rim: 'deep', caliper: CM.yellow}); });
  // V12 under a glass bubble: twelve trumpets with throttle butterflies, red cam covers, spinning pulleys
  const E = new THREE.Group(); E.position.set(0, 0.84, -0.92); E.scale.setScalar(0.9); C.add(E);
  RB(E, 0.44, 0.08, 0.58, 0.02, CM.carbon, 0, 0.04, 0);
  [-0.2, 0.2].forEach(x => RB(E, 0.08, 0.06, 0.58, 0.02, CM.engRed, x, 0.1, 0));
  [-0.08, 0.08].forEach(x => { for (let i = 0; i < 6; i++) {
    const z = -0.22 + i * 0.088;
    addMesh(E, trumpetGeo(), CM.chrome, x, 0.08, z);
    const bf = new THREE.Group(); bf.position.set(x, 0.14, z); E.add(bf);
    addMesh(bf, cylGeo(0.027, 0.027, 0.004, 12), CM.gun, 0, 0, 0);
    car.flaps.push({o: bf, base: 0, amp: 1.3});
  } });
  pulley(car, E, 0.06, 0, 0.08, -0.33, 1); pulley(car, E, 0.045, 0.14, 0.13, -0.33, 1.5);
  beltBetween(E, [0, 0.08], 0.06, [0.14, 0.13], 0.045, -0.335);
  car.shakers.push({o: E, base: E.position.clone()});
  const bubble = profShape([['m', -0.58, 0.8], ['q', -0.68, 1.03, -0.9, 1.03], ['q', -1.16, 1.01, -1.25, 0.82], ['l', -0.58, 0.8]]);
  addMesh(C, extrudeX(bubble, 0.86, 0.05, makeTaper(2.75, 0.8, 1.06, 0.35, 0, 0)), CM.bubble).castShadow = false;
  for (let i = 0; i < 3; i++) RB(C, 0.74 - i * 0.04, 0.012, 0.03, 0.006, CM.black, 0, 1.06 - i * 0.004, -0.8 - i * 0.12);
  // active rear wing: rises with speed, flips up as an air brake
  const wg = new THREE.Group(); wg.position.set(0, 0.86, -1.24); C.add(wg);
  [-0.4, 0.4].forEach(x => RB(wg, 0.03, 0.2, 0.08, 0.01, CM.black, x, 0.0, 0));
  const flap = new THREE.Group(); flap.position.set(0, 0.1, 0.12); wg.add(flap);
  addMesh(flap, extrudeX(airfoil(0.32, 0.035), 1.5, 0.01), CM.carbon, 0, 0, -0.14);
  car.wing = {o: wg, y0: 0.86, flap};
  // lights and intakes
  RB(C, 1.1, 0.03, 0.02, 0.01, new THREE.MeshStandardMaterial({color: 0x99f0ff, emissive: 0x66e8ff, emissiveIntensity: 1.2}), 0, 0.4, I.zf - 0.02);
  [-0.42, 0.42].forEach(x => RB(C, 0.22, 0.05, 0.03, 0.02, CM.head, x, 0.43, I.zf - 0.05, 0, 0, 0));
  RB(C, 1.3, 0.04, 0.03, 0.015, car.tailMat, 0, 0.66, I.zr + 0.01);
  [-1, 1].forEach(sd => RB(C, 0.03, 0.18, 0.46, 0.06, CM.black, sd * (I.hw(0.48, -0.35) + 0.008), 0.48, -0.35));
  for (let i = 0; i < 5; i++) RB(C, 0.02, 0.14, 0.3, 0.005, CM.carbon, -0.4 + i * 0.2, 0.22, I.zr + 0.1);
  mirrors(car, I, 0.36, 0.75);
  [-0.1, 0.1].forEach(x => exhaustTip(car, [x, 0.36, I.zr - 0.02], [0, 0.1, -1], 0.045, 1.1));
};

// ============ 10. ROCKET CAR ============
BUILD.rocket = car => {
  const C = car.chassis; car.freq = 13; car.damp = 0.45;
  const fp = [[0, -1.5], [0.3, -1.5], [0.38, -1.3], [0.42, -0.9], [0.43, -0.2], [0.42, 0.4], [0.38, 0.8], [0.3, 1.15], [0.18, 1.42], [0.06, 1.58], [0.001, 1.62]].map(p => new V2(p[0], p[1]));
  const fus = new THREE.LatheGeometry(fp, 40); fus.rotateX(Math.PI / 2);
  addMesh(C, fus, car.paint, 0, 0.66, 0);
  addMesh(C, new THREE.TorusGeometry(0.345, 0.02, 8, 40), CM.red, 0, 0.66, 1.0);
  addMesh(C, new THREE.TorusGeometry(0.43, 0.02, 8, 40), CM.red, 0, 0.66, -0.55);
  const can = addMesh(C, sphGeo(1, 32, 20), CM.glass, 0, 1.0, 0.3); can.scale.set(0.22, 0.17, 0.5);
  car.driverHead = driver(C, 0, 0.62, 0.25, CM.red);
  car.driverHead.scale.setScalar(0.9);
  // twin turbines: visible fans spin with the revs, nozzles blast flame
  const nacG = new THREE.LatheGeometry([[0.17, -0.85], [0.2, -0.65], [0.21, 0.4], [0.19, 0.78], [0.175, 0.85]].map(p => new V2(p[0], p[1])), 32); nacG.rotateX(Math.PI / 2);
  const inner = new THREE.MeshStandardMaterial({color: 0x222326, metalness: 0.6, roughness: 0.4, side: THREE.BackSide});
  [-1, 1].forEach(sd => {
    const x = sd * 0.52;
    addMesh(C, nacG, car.paint, x, 0.55, -0.25);
    addMesh(C, nacG, inner, x, 0.55, -0.25);
    addMesh(C, new THREE.TorusGeometry(0.175, 0.025, 10, 32), CM.chrome, x, 0.55, 0.6);
    const fan = new THREE.Group(); fan.position.set(x, 0.55, 0.5); C.add(fan);
    for (let i = 0; i < 12; i++) RB(fan, 0.03, 0.15, 0.01, 0.004, CM.alu, Math.cos(i / 12 * Math.PI * 2) * 0.085, Math.sin(i / 12 * Math.PI * 2) * 0.085, 0, 0.5, 0, i / 12 * Math.PI * 2 - Math.PI / 2);
    addMesh(fan, new THREE.ConeGeometry(0.05, 0.12, 16), CM.chrome, 0, 0, 0.04, Math.PI / 2, 0, 0);
    car.spin.push({o: fan, ax: 'z', k: sd * 1.6});
    const noz = new THREE.LatheGeometry([[0.19, 0], [0.17, -0.08], [0.14, -0.18]].map(p => new V2(p[0], p[1])), 24); noz.rotateX(Math.PI / 2);
    addMesh(C, noz, new THREE.MeshStandardMaterial({color: 0x6a6f78, metalness: 0.9, roughness: 0.35, side: THREE.DoubleSide}), x, 0.55, -1.1);
    RB(C, Math.abs(x) - 0.3, 0.05, 0.6, 0.02, car.paint, sd * 0.38, 0.6, -0.3);
    car.exh.push({p: new V3(x, 0.55, -1.3), d: new V3(0, 0, -1), size: 2.4});
  });
  // tail fin, stabiliser, canards
  const fin = profShape([['m', -1.5, 0.95], ['l', -0.95, 0.95], ['q', -1.2, 1.4, -1.4, 1.78], ['l', -1.62, 1.78], ['l', -1.5, 0.95]]);
  addMesh(C, extrudeX(fin, 0.05, 0.015), CM.red, 0, 0, 0);
  RB(C, 1.5, 0.04, 0.3, 0.015, CM.red, 0, 0.72, -1.36);
  RB(C, 0.7, 0.03, 0.14, 0.012, CM.red, 0, 0.62, 1.18);
  addMesh(C, cylGeo(0.008, 0.012, 0.5, 8), CM.chrome, 0, 0.66, 1.84, Math.PI / 2, 0, 0);
  [-1, 1].forEach(sd => decal(C, 0.9, 0.16, (g, w, h) => { g.fillStyle = '#d0262c'; g.font = 'bold 44px sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText('TOY AERO  X-1', w / 2, h / 2 + 2); }, sd * 0.43, 0.66, 0.2, sd * Math.PI / 2));
  decal(C, 0.32, 0.32, (g, w) => { g.fillStyle = '#fff'; g.beginPath(); g.arc(w / 2, w / 2, w / 2 - 4, 0, 7); g.fill(); g.fillStyle = '#d0262c'; g.font = 'bold 150px sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText('1', w / 2, w / 2 + 10); }, 0.0, 1.11, -0.9, 0).rotation.x = -Math.PI / 2;
  // outrigger wheels in teardrop spats
  const spat = profShape([['m', -0.4, 0.27], ['q', -0.36, 0.6, 0, 0.62], ['q', 0.36, 0.6, 0.42, 0.27], ['l', -0.4, 0.27]]);
  const spatG = extrudeX(spat, 0.26, 0.05);
  [[0.95], [-0.95]].forEach(([z]) => [-1, 1].forEach(sd => {
    addWheel(car, {x: sd * 0.82, z, r: 0.26, w: 0.18, front: z > 0, rim: 'deep'});
    addMesh(C, spatG, car.paint, sd * 0.82, 0, z);
    RB(C, 0.2, 0.05, 0.2, 0.02, CM.gun, sd * 0.68, 0.5, z);
  }));
};

// ============ 11. WARP PHANTOM (creator only) ============
BUILD.warp = car => {
  const C = car.chassis; car.freq = 15; car.damp = 0.5;
  const s = {L: 3.0, W: 1.75, yb: 0.14, wf: [0.9, 0.3], wr: [-0.95, 0.31], arch: 0.04, noseY: 0.32, cr: 0.1, taper: 0.3, plan: 0.3, planR: 0.12, bevel: 0.06, belt: 0.74, deckY: 0.8, yMax: 0.84,
    top: [['q', 1.36, 0.5, 1.26, 0.58], ['q', 1.0, 0.84, 0.55, 0.72], ['l', -0.55, 0.78], ['l', -1.2, 0.82], ['q', -1.5, 0.84, -1.5, 0.66]],
    cab: {a: 0.5, b: 0.05, c: -0.4, d: -0.62, roof: 1.02, bulge: 0.03, w: 0.74, taper: 0.42, baseD: 0.8}};
  const I = sedanBody(car, s);
  const neon = new THREE.MeshBasicMaterial({color: new THREE.Color(0x00e5ff).multiplyScalar(3), toneMapped: false});
  [1, -1].forEach(sd => {
    const f = addWheel(car, {x: sd * 0.76, z: 0.9, r: 0.3, w: 0.36, front: true, rim: 'deep', caliper: CM.blueM});
    const r = addWheel(car, {x: sd * 0.74, z: -0.95, r: 0.31, w: 0.46, rim: 'deep', caliper: CM.blueM});
    for (const w of [f, r]) addMesh(w.spin, new THREE.TorusGeometry(w.r * 0.6, 0.014, 6, 40), neon, w.w / 2 - 0.02, 0, 0, 0, Math.PI / 2, 0);
  });
  // neon strips along the sills, side intakes, camera mirrors
  [-1, 1].forEach(sd => {
    RB(C, 0.012, 0.028, 2.1, 0.01, neon, sd * (I.hw(0.3, 0) + 0.006), 0.3, -0.05);
    RB(C, 0.03, 0.17, 0.52, 0.06, CM.black, sd * (I.hw(0.52, -0.3) + 0.006), 0.52, -0.3);
    for (let i = 0; i < 4; i++) RB(C, 0.034, 0.012, 0.46, 0.004, CM.gun, sd * (I.hw(0.52, -0.3) + 0.012), 0.45 + i * 0.045, -0.3);
  });
  // carbon splitter, headlight slits, LED nose bar
  RB(C, s.W * 0.92, 0.04, 0.34, 0.015, CM.carbon, 0, 0.17, I.zf - 0.1);
  [-1, 1].forEach(sd => RB(C, 0.4, 0.035, 0.03, 0.012, CM.head, sd * 0.42, 0.47, 1.37, -0.55, sd * 0.12, 0));
  RB(C, 0.9, 0.018, 0.02, 0.008, neon, 0, 0.36, I.zf - 0.01);
  // twin plasma thrusters with spinning turbines and glowing cores
  const nozzle = new THREE.LatheGeometry([[0.2, 0.0], [0.21, -0.08], [0.19, -0.22], [0.165, -0.3]].map(p => new V2(p[0], p[1])), 32); nozzle.rotateX(Math.PI / 2);
  const inner = new THREE.MeshStandardMaterial({color: 0x15171c, metalness: 0.7, roughness: 0.35, side: THREE.BackSide});
  const core = new THREE.MeshBasicMaterial({color: new THREE.Color(0x4fd8ff).multiplyScalar(4), toneMapped: false});
  [-0.42, 0.42].forEach(x => {
    const z = I.zr + 0.08;
    addMesh(C, nozzle, new THREE.MeshStandardMaterial({color: 0x8a909b, metalness: 1, roughness: 0.25, side: THREE.DoubleSide}), x, 0.52, z);
    addMesh(C, nozzle, inner, x, 0.52, z);
    addMesh(C, new THREE.TorusGeometry(0.2, 0.025, 10, 32), neon, x, 0.52, z);
    const fan = new THREE.Group(); fan.position.set(x, 0.52, z - 0.12); C.add(fan);
    for (let i = 0; i < 10; i++) RB(fan, 0.03, 0.15, 0.01, 0.004, CM.gun, Math.cos(i / 10 * Math.PI * 2) * 0.075, Math.sin(i / 10 * Math.PI * 2) * 0.075, 0, 0.5, 0, i / 10 * Math.PI * 2 - Math.PI / 2);
    addMesh(fan, sphGeo(0.05), core, 0, 0, 0);
    car.spin.push({o: fan, ax: 'z', k: x > 0 ? 2.2 : -2.2});
    addMesh(C, new THREE.CircleGeometry(0.16, 24), core, x, 0.52, z - 0.2, 0, Math.PI, 0);
    car.exh.push({p: new V3(x, 0.52, z - 0.32), d: new V3(0, 0, -1), size: 2.6});
  });
  // shark fins carrying an LED wing, diffuser, tail light bar
  const fin = profShape([['m', -0.62, 0.8], ['l', -1.3, 0.82], ['l', -1.44, 1.26], ['q', -1.12, 1.18, -0.62, 0.8]]);
  [-0.46, 0.46].forEach(x => addMesh(C, extrudeX(fin, 0.045, 0.015), car.paint, x, 0, 0));
  addMesh(C, extrudeX(airfoil(0.34, 0.035), 1.08, 0.01), CM.carbon, 0, 1.2, -1.34);
  RB(C, 1.0, 0.014, 0.02, 0.006, neon, 0, 1.2, -1.52);
  for (let i = 0; i < 6; i++) RB(C, 0.02, 0.14, 0.34, 0.005, CM.carbon, -0.5 + i * 0.2, 0.2, I.zr + 0.16);
  RB(C, 1.36, 0.035, 0.02, 0.012, car.tailMat, 0, 0.72, I.zr + 0.012);
  // cyan underglow pooling on the floor
  const glow = new THREE.Mesh(new THREE.PlaneGeometry(s.W * 1.5, s.L * 1.3), new THREE.MeshBasicMaterial({map: softTex, color: 0x00d9ff, transparent: true, opacity: 0.55, blending: THREE.AdditiveBlending, depthWrite: false, toneMapped: false}));
  glow.rotation.x = -Math.PI / 2; glow.position.y = 0.04; glow.renderOrder = 3; car.root.add(glow);
  mirrors(car, I, 0.52, 0.74);
};
