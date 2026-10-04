// ============ CAR MODELS (part 1): shared body builder, engines, first five cars ============

// Body from a curved side profile: wheel arches, nose, hood, cabin, deck — then tapered so the
// top tucks in and the nose/tail narrow in plan view. Glass cabin, roof panel and pillars on top.
function sedanBody(car, s){
  const C = car.chassis, z0 = -s.L / 2, z1 = s.L / 2, cr = s.cr || 0.14, cb = 0.06, yb = s.yb, bev = s.bevel || 0.06;
  const cmds = [['m', z0 + cb, yb]];
  if (!s.noArch) for (const [wz, wr] of [s.wr, s.wf]) cmds.push(['arch', wz, wr, wr + s.arch + bev, yb]);
  cmds.push(['l', z1 - cb, yb], ['q', z1, yb, z1, yb + cb], ['l', z1, s.noseY - cr * 0.8], ['q', z1, s.noseY, z1 - cr, s.noseY]);
  if (s.top) cmds.push(...s.top);
  else {
    cmds.push(['q', s.hoodCtl[0], s.hoodCtl[1], s.cab.a, s.belt], ['l', s.cab.d, s.deckY]);
    if (s.bed) cmds.push(['l', s.cab.d - 0.03, s.bed.y], ['l', z0 + 0.1, s.bed.y], ['l', z0 + 0.1, s.tailY]);
    else cmds.push(['q', (s.cab.d + z0) / 2, s.deckY + (s.deckRise || 0), z0 + cr, s.tailY]);
    cmds.push(['q', z0, s.tailY, z0, s.tailY - cr]);
  }
  cmds.push(['l', z0, yb + cb], ['q', z0, yb, z0 + cb, yb]);
  const yMax = s.yMax || Math.max(s.noseY, s.belt || 0, s.deckY || 0, s.tailY || 0);
  const tp = makeTaper(s.L, yb, yMax + bev, s.taper, s.plan, s.planR ?? s.plan * 0.6);
  addMesh(C, extrudeX(profShape(cmds), s.W, bev, tp), car.paint);
  const info = {z0, z1, zf: z1 + bev, zr: z0 - bev, bev, tp, hw: (y, z) => tp(s.W / 2, y, z)};
  if (s.cab && !s.noGlass) {
    const {a, b, c, d, roof} = s.cab, bulge = s.cab.bulge || 0.03;
    const baseA = s.belt - 0.05, baseD = (s.cab.baseD ?? s.deckY) - 0.05;
    const ctl = (za, ya, zb, yb2, k) => { const dz = zb - za, dy = yb2 - ya, l = Math.hypot(dz, dy); return [(za + zb) / 2 + dy / l * k, (ya + yb2) / 2 - dz / l * k]; };
    const w1 = ctl(a, baseA, b, roof, 0.035), w2 = ctl(c, roof, d, baseD, 0.03);
    const gcmds = [['m', a, baseA], ['q', w1[0], w1[1], b, roof], ['q', (b + c) / 2, roof + bulge, c, roof], ['q', w2[0], w2[1], d, baseD], ['l', a, baseA]];
    const gw = s.W * (s.cab.w || 0.84), gt = s.cab.taper || 0.32;
    addMesh(C, extrudeX(profShape(gcmds), gw, 0.07, makeTaper(s.L, baseA, roof + 0.07, gt, 0, 0)), CM.glass);
    // painted roof panel following the roof curve
    const rp = [];
    for (let i = 0; i <= 12; i++) { const t = 0.12 + i / 12 * 0.76, u = 1 - t; rp.push([u * u * b + 2 * u * t * (b + c) / 2 + t * t * c, u * u * roof + 2 * u * t * (roof + bulge) + t * t * roof + 0.07]); }
    const rc = [['m', rp[0][0], rp[0][1] + 0.012]];
    rp.forEach(p => rc.push(['l', p[0], p[1] + 0.012])); rp.slice().reverse().forEach(p => rc.push(['l', p[0], p[1] - 0.03]));
    addMesh(C, extrudeX(profShape(rc), gw * (1 - gt) + 0.05, 0.02), car.paint);
    // A and C pillars
    const pillar = (za, ya, zb, yb2) => {
      const dz = zb - za, dy = yb2 - ya, len = Math.hypot(dz, dy), ym = (ya + yb2) / 2 + 0.035;
      const hwB = gw / 2, hwT = gw / 2 * (1 - gt), hwM = gw / 2 * (1 - gt * 0.3);
      [-1, 1].forEach(sd => {
        const p = RB(C, 0.036, len + 0.04, 0.06, 0.016, car.paint, sd * (hwM + 0.003), ym, (za + zb) / 2);
        p.rotation.set(Math.atan2(dz, dy), 0, sd * Math.atan2(hwB - hwT, len) * 0.9);
      });
    };
    pillar(a, baseA, b, roof); pillar(d, baseD, c, roof);
    info.roofTop = roof + 0.07 + 0.012 + bulge;
    // interior seen through the tinted glass: dash, wheel, seats with headrests, a driver
    if (!s.noInterior) {
      const by = s.belt + bev, mid = (a + d) / 2, gwh = gw / 2 * 0.62;
      RB(C, gw * 0.8, 0.07, 0.16, 0.03, CM.plastic, 0, by + 0.02, a - 0.1);
      [-1, 1].forEach(sd => {
        const sx = sd * gwh * 0.62;
        const back = RB(C, gwh * 0.75, 0.32, 0.08, 0.035, CM.seat, sx, by + 0.08, mid - 0.06); back.rotation.x = -0.2;
        RB(C, gwh * 0.45, 0.12, 0.07, 0.03, CM.seat, sx, by + 0.3, mid - 0.1);
      });
      car.driverHead = car.driverHead || driver(C, gwh * 0.62, by - 0.3, mid + 0.04, car.paint);
      addMesh(C, new THREE.TorusGeometry(0.09, 0.014, 8, 24), CM.black, gwh * 0.62, by + 0.1, a - 0.2, -1.1, 0, 0);
      RB(C, 0.08, 0.03, 0.02, 0.01, CM.black, 0, roof - 0.02, b - 0.06);
      // wipers resting at the base of the windscreen
      const wa = Math.atan2(b - a, roof - baseA);
      [-0.12, 0.22].forEach(x => RB(C, gw * 0.36, 0.014, 0.022, 0.006, CM.black, x * s.W, baseA + 0.12, a - 0.02, wa, 0.12, 0));
      // dash gauges glowing at the driver, gear lever, seatbelt
      const dx = gwh * 0.62;
      [-0.055, 0.055].forEach(o => addMesh(C, new THREE.CircleGeometry(0.03, 16), CM.gauge, dx + o, by + 0.075, a - 0.185, -0.4, Math.PI, 0));
      addMesh(C, cylGeo(0.008, 0.008, 0.1, 6), CM.chrome, 0, by + 0.02, a - 0.32, 0.3, 0, 0);
      addMesh(C, sphGeo(0.022, 12, 8), CM.black, 0, by + 0.07, a - 0.3);
      RB(C, 0.024, 0.3, 0.006, 0.003, CM.belt, dx - 0.02, by + 0.1, mid - 0.02, 0, 0, 0.55);
    }
    // chrome window trim where the glass meets the body
    const bl = Math.hypot(a - d, s.deckY - s.belt), bang = Math.atan2(s.deckY - s.belt, a - d);
    [-1, 1].forEach(sd => RB(C, 0.014, 0.014, bl, 0.006, CM.chrome, sd * (gw / 2 + 0.002), (s.belt + s.deckY) / 2 + bev + 0.004, (a + d) / 2, bang, 0, 0));
  }
  // ---- details every road car shares ----
  // dark inner wheel arches (no more body-coloured tunnels)
  if (!s.noArch) for (const [wz, wr] of [s.wr, s.wf]) {
    const R = wr + s.arch + bev, rl = R - bev - 0.015, a0 = s.yb > wr ? Math.asin(Math.min(1, (s.yb - wr) / rl)) : 0;
    const lg = new THREE.CylinderGeometry(rl, rl, s.W * 0.86 - 2 * bev, 28, 1, true, a0, Math.PI - 2 * a0); lg.rotateZ(Math.PI / 2);
    addMesh(C, lg, CM.liner, 0, wr, wz);
  }
  // underbody tray, driveshaft, differential, exhaust muffler
  const ub = yb - bev;
  RB(C, s.W * 0.8, 0.03, s.L * 0.82, 0.012, CM.black, 0, ub - 0.005, 0);
  if (!s.noArch) {
    addMesh(C, cylGeo(0.035, 0.035, Math.abs(s.wf[0] - s.wr[0]) - 0.3, 10), CM.gun, 0, ub - 0.04, (s.wf[0] + s.wr[0]) / 2, Math.PI / 2, 0, 0);
    addMesh(C, sphGeo(0.09, 14, 10), CM.gun, 0, ub - 0.05, s.wr[0]);
    RB(C, 0.26, 0.09, 0.42, 0.04, CM.gun, 0.28, ub - 0.06, z0 * 0.62);
  }
  // door shut-lines, chrome handles, side markers, fuel cap, badges
  if (s.cab && !s.noDoors) {
    const {a, d} = s.cab, y0 = yb + 0.14, y1 = s.belt - 0.03, ym = (y0 + y1) / 2;
    const seams = [a - 0.03, d + 0.1]; if (s.doors === 4) seams.push((a + d) / 2 + 0.02);
    [-1, 1].forEach(sd => {
      for (const z of seams) RB(C, 0.006, y1 - y0, 0.014, 0.003, CM.seam, sd * (info.hw(ym, z) + 0.001), ym, z);
      const hz = d + 0.26; RB(C, 0.014, 0.026, 0.1, 0.008, CM.chrome, sd * (info.hw(s.belt - 0.08, hz) + 0.006), s.belt - 0.08, hz);
      if (s.doors === 4) RB(C, 0.014, 0.026, 0.1, 0.008, CM.chrome, sd * (info.hw(s.belt - 0.08, (a + d) / 2 + 0.2) + 0.006), s.belt - 0.08, (a + d) / 2 + 0.2);
    });
  }
  if (!s.noArch) [-1, 1].forEach(sd => {
    const fz = Math.min(z1 - 0.12, s.wf[0] + s.wf[1] + s.arch + bev + 0.1), rz = Math.max(z0 + 0.12, s.wr[0] - s.wr[1] - s.arch - bev - 0.1), my = yb + 0.24;
    RB(C, 0.01, 0.035, 0.085, 0.006, CM.amber, sd * (info.hw(my, fz) + 0.003), my, fz);
    RB(C, 0.01, 0.035, 0.085, 0.006, car.tailMat, sd * (info.hw(my, rz) + 0.003), my, rz);
  });
  if (s.cab) addMesh(C, cylGeo(0.05, 0.05, 0.012, 20), CM.alu, info.hw(s.belt - 0.12, s.cab.d - 0.06) + 0.004, s.belt - 0.12, s.cab.d - 0.06, 0, 0, Math.PI / 2);
  addMesh(C, cylGeo(0.042, 0.042, 0.012, 20), CM.chrome, 0, s.noseY - 0.07, info.zf + 0.004, Math.PI / 2, 0, 0);
  addMesh(C, cylGeo(0.036, 0.036, 0.012, 20), CM.chrome, 0, (s.tailY || s.deckY || 0.8) - 0.12, info.zr - 0.004, Math.PI / 2, 0, 0);
  return info;
}
function mirrors(car, info, z, y){
  [-1, 1].forEach(sd => {
    const x = sd * (info.hw(y, z) + 0.02);
    RB(car.chassis, 0.1, 0.03, 0.04, 0.012, CM.black, x + sd * 0.04, y + 0.02, z);
    const h = RB(car.chassis, 0.06, 0.09, 0.12, 0.03, car.paint, x + sd * 0.1, y + 0.06, z - 0.02);
    addMesh(h, new THREE.PlaneGeometry(0.075, 0.1), CM.chrome, 0, 0, -0.061, 0, Math.PI, 0);
  });
}
// thin painted stripe that follows a curve over the bodywork
function stripe(car, pts, x, w, mat){
  const c = [['m', pts[0][0], pts[0][1] + 0.008]];
  pts.forEach(p => c.push(['l', p[0], p[1] + 0.008])); pts.slice().reverse().forEach(p => c.push(['l', p[0], p[1] - 0.025]));
  const m = addMesh(car.chassis, extrudeX(profShape(c), w, 0.004), mat); m.position.x = x; return m;
}
const quadPts = (p0, c, p1, n = 14, t0 = 0, t1 = 1) => { const r = []; for (let i = 0; i <= n; i++) { const t = t0 + (t1 - t0) * i / n, u = 1 - t; r.push([u * u * p0[0] + 2 * u * t * c[0] + t * t * p1[0], u * u * p0[1] + 2 * u * t * c[1] + t * t * p1[1]]); } return r; };

// ---------- ENGINES ----------
function pulley(car, parent, r, x, y, z, k, mat = CM.alu){
  const p = new THREE.Group(); p.position.set(x, y, z); parent.add(p);
  addMesh(p, cylGeo(r, r, 0.04, 24), mat, 0, 0, 0, Math.PI / 2, 0, 0);
  addMesh(p, cylGeo(r * 0.75, r * 0.75, 0.045, 24), CM.black, 0, 0, 0, Math.PI / 2, 0, 0);
  for (let i = 0; i < 3; i++) RB(p, r * 1.5, r * 0.18, 0.05, r * 0.06, mat, 0, 0, 0, 0, 0, i * Math.PI / 3);
  car.spin.push({o: p, ax: 'z', k});
  return p;
}
function beltBetween(parent, a, ra, b, rb2, z){
  const dx = b[0] - a[0], dy = b[1] - a[1], l = Math.hypot(dx, dy), ang = Math.atan2(dy, dx);
  [-1, 1].forEach(s => {
    const off = s * (ra + rb2) / 2, nx = -Math.sin(ang) * off, ny = Math.cos(ang) * off;
    RB(parent, l, 0.022, 0.03, 0.008, CM.belt, (a[0] + b[0]) / 2 + nx, (a[1] + b[1]) / 2 + ny, z, 0, 0, ang);
  });
}
// Supercharger that pokes through the hood: belt drive, ribbed case, butterfly scoop that flaps open with the throttle.
function blower(car, x, y, z, sc = 1){
  const g = new THREE.Group(); g.position.set(x, y, z); g.scale.setScalar(sc); car.chassis.add(g);
  RB(g, 0.3, 0.07, 0.5, 0.02, CM.alu, 0, 0.0, 0);
  RB(g, 0.3, 0.24, 0.46, 0.07, CM.alu, 0, 0.15, -0.01);
  for (let i = 0; i < 7; i++) RB(g, 0.32, 0.018, 0.03, 0.008, CM.chrome, 0, 0.15, -0.2 + i * 0.065);
  RB(g, 0.27, 0.12, 0.24, 0.03, CM.black, 0, 0.33, 0.03);
  RB(g, 0.29, 0.03, 0.26, 0.01, CM.chrome, 0, 0.395, 0.03);
  for (let i = 0; i < 3; i++) {
    const pv = new THREE.Group(); pv.position.set(0, 0.405, -0.06 + i * 0.07); g.add(pv);
    RB(pv, 0.23, 0.012, 0.062, 0.005, CM.alu, 0, 0, 0.03);
    car.flaps.push({o: pv, base: 0, amp: 1.2});
  }
  const pu = pulley(car, g, 0.085, 0, 0.15, 0.26, 1.7);
  const cr = pulley(car, g, 0.07, 0, -0.18, 0.28, 1.0);
  beltBetween(g, [0, 0.15], 0.085, [0, -0.18], 0.07, 0.27);
  car.shakers.push({o: g, base: g.position.clone(), lope: true});
  return g;
}

// Air-cooled flat-four: finned cylinders, fan shroud with a spinning fan, belt-driven generator.
function flat4(car, x, y, z){
  const g = new THREE.Group(); g.position.set(x, y, z); car.chassis.add(g);
  RB(g, 0.34, 0.2, 0.36, 0.05, CM.alu, 0, 0.1, 0);
  [-1, 1].forEach(s => {
    [-0.085, 0.085].forEach(j => { for (let k = 0; k < 6; k++) addMesh(g, cylGeo(0.072, 0.072, 0.012, 18), CM.gun, s * (0.19 + k * 0.024), 0.12, j, 0, 0, Math.PI / 2); });
    RB(g, 0.06, 0.15, 0.34, 0.02, CM.alu, s * 0.34, 0.12, 0);
    tube(g, [[s * 0.36, 0.06, 0.1], [s * 0.36, -0.02, -0.05], [s * 0.2, -0.04, -0.2]], 0.02, CM.gun, 12);
  });
  RB(g, 0.5, 0.17, 0.3, 0.07, CM.black, 0, 0.3, 0.01);
  addMesh(g, cylGeo(0.13, 0.13, 0.07, 28), CM.black, 0, 0.33, -0.16, Math.PI / 2, 0, 0);
  const fan = new THREE.Group(); fan.position.set(0, 0.33, -0.2); g.add(fan);
  for (let i = 0; i < 9; i++) { const a = i / 9 * Math.PI * 2; RB(fan, 0.035, 0.1, 0.012, 0.004, CM.alu, Math.cos(a) * 0.06, Math.sin(a) * 0.06, 0, 0.3, 0, a - Math.PI / 2); }
  addMesh(fan, cylGeo(0.03, 0.03, 0.03, 12), CM.chrome, 0, 0, 0, Math.PI / 2, 0, 0);
  car.spin.push({o: fan, ax: 'z', k: -1.5});
  pulley(car, g, 0.07, 0, 0.04, -0.2, 1);
  pulley(car, g, 0.045, 0, 0.33, -0.24, 1.6);
  beltBetween(g, [0, 0.04], 0.07, [0, 0.33], 0.045, -0.23);
  addMesh(g, cylGeo(0.1, 0.1, 0.09, 24), CM.chrome, 0.12, 0.46, 0.06);
  addMesh(g, cylGeo(0.03, 0.03, 0.08, 10), CM.black, 0.12, 0.4, 0.06);
  addMesh(g, cylGeo(0.03, 0.03, 0.06, 10), CM.black, -0.1, 0.42, 0.1);
  [[0.25, 0.05], [0.25, -0.1], [-0.25, 0.05], [-0.25, -0.1]].forEach(([px, pz]) => tube(g, [[-0.1, 0.45, 0.1], [px * 0.6, 0.42, pz * 0.8], [px * 1.3, 0.2, pz]], 0.008, CM.red, 10));
  car.shakers.push({o: g, base: g.position.clone()});
  return g;
}

// ============ 1. SAND BUGGY ============
BUILD.buggy = car => {
  const C = car.chassis, gun = CM.gun;
  car.freq = 7; car.damp = 0.3;
  addWheel(car, {x: 0.62, z: 0.68, r: 0.3, w: 0.26, front: true, tread: 'knobby', rim: 'beadlock', rimF: 0.55});
  addWheel(car, {x: -0.62, z: 0.68, r: 0.3, w: 0.26, front: true, tread: 'knobby', rim: 'beadlock', rimF: 0.55});
  addWheel(car, {x: 0.67, z: -0.62, r: 0.4, w: 0.42, tread: 'knobby', rim: 'beadlock', rimF: 0.5});
  addWheel(car, {x: -0.67, z: -0.62, r: 0.4, w: 0.42, tread: 'knobby', rim: 'beadlock', rimF: 0.5});
  RB(C, 0.86, 0.06, 1.75, 0.02, CM.plastic, 0, 0.41, -0.05);
  const nose = profShape([['m', 0.28, 0.38], ['l', 0.98, 0.42], ['q', 1.1, 0.44, 1.07, 0.55], ['q', 1.03, 0.65, 0.9, 0.67], ['q', 0.6, 0.76, 0.28, 0.8], ['l', 0.28, 0.38]]);
  addMesh(C, extrudeX(nose, 0.8, 0.05, makeTaper(2.0, 0.38, 0.85, 0.25, 0.3, 0)), car.paint);
  [-1, 1].forEach(s => RB(C, 0.14, 0.22, 0.62, 0.06, car.paint, s * 0.41, 0.52, -0.06));
  // curved tube cage
  [-1, 1].forEach(s => {
    tube(C, [[s * 0.36, 0.44, 0.45], [s * 0.33, 0.95, 0.18], [s * 0.3, 1.14, -0.12], [s * 0.32, 1.05, -0.46], [s * 0.38, 0.52, -0.82]], 0.035, gun, 40);
    tube(C, [[s * 0.32, 0.42, 1.0], [s * 0.36, 0.44, 0.45]], 0.028, gun, 4);
    tube(C, [[s * 0.38, 0.5, -0.82], [s * 0.3, 0.45, -1.12]], 0.028, gun, 4);
  });
  tube(C, [[-0.33, 0.95, 0.18], [0, 0.97, 0.19], [0.33, 0.95, 0.18]], 0.032, gun, 8);
  tube(C, [[-0.3, 1.14, -0.12], [0, 1.16, -0.12], [0.3, 1.14, -0.12]], 0.032, gun, 8);
  tube(C, [[-0.32, 1.05, -0.46], [0.32, 1.05, -0.46]], 0.03, gun, 4);
  tube(C, [[0.3, 1.14, -0.12], [-0.32, 1.05, -0.46]], 0.026, gun, 4);
  tube(C, [[-0.32, 0.42, 1.0], [-0.34, 0.37, 1.1], [0, 0.34, 1.15], [0.34, 0.37, 1.1], [0.32, 0.42, 1.0]], 0.03, gun, 20);
  // seat, driver, steering wheel
  RB(C, 0.42, 0.08, 0.42, 0.04, CM.black, 0, 0.48, -0.13);
  RB(C, 0.42, 0.46, 0.07, 0.04, CM.black, 0, 0.72, -0.35, -0.15, 0, 0);
  car.driverHead = driver(C, 0, 0.5, -0.14, car.paint);
  addMesh(C, new THREE.TorusGeometry(0.1, 0.018, 8, 24), CM.black, 0, 0.8, 0.16, -0.9, 0, 0);
  addMesh(C, cylGeo(0.015, 0.015, 0.4, 8), CM.gun, 0, 0.7, 0.32, 0.65, 0, 0);
  [-0.09, 0.09].forEach(x => RB(C, 0.04, 0.42, 0.012, 0.004, CM.red, x, 0.78, -0.31, -0.15, 0, 0));
  RB(C, 0.3, 0.12, 0.03, 0.02, CM.black, 0, 0.74, 0.27, -0.5, 0, 0);
  [-0.07, 0.07].forEach(x => addMesh(C, new THREE.CircleGeometry(0.035, 16), CM.gauge, x, 0.75, 0.25, -2.07, 0, 0));
  addMesh(C, cylGeo(0.045, 0.045, 0.24, 14), CM.red, 0.3, 0.62, -0.42, 0, 0, 0);
  addMesh(C, cylGeo(0.02, 0.02, 0.04, 8), CM.black, 0.3, 0.76, -0.42);
  [-1, 1].forEach(sd => decal(C, 0.3, 0.18, (g, w, h) => { g.fillStyle = '#fff'; g.beginPath(); g.ellipse(w / 2, h / 2, w / 2 - 4, h / 2 - 4, 0, 0, 7); g.fill(); g.fillStyle = '#111'; g.font = 'bold 90px sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText('7', w / 2, h / 2 + 6); }, sd * 0.483, 0.53, -0.06, sd * Math.PI / 2));
  // lamps on the cage
  [-0.17, 0.17].forEach(x => { addMesh(C, cylGeo(0.07, 0.06, 0.08, 16), CM.black, x, 1.02, 0.21, Math.PI / 2, 0, 0); headlamp(C, x, 1.02, 0.255, 0.058); });
  // rear engine, muffler and curly quiet-pack pipes
  flat4(car, 0, 0.4, -0.86);
  addMesh(C, cylGeo(0.07, 0.07, 0.4, 18), CM.chrome, 0, 0.5, -1.13, 0, 0, Math.PI / 2);
  [-1, 1].forEach(s => { tube(C, [[s * 0.13, 0.5, -1.15], [s * 0.15, 0.6, -1.22], [s * 0.16, 0.78, -1.2]], 0.03, CM.chrome, 14); exhaustTip(car, [s * 0.16, 0.8, -1.19], [0, 0.8, -0.6], 0.035, 0.8); });
  [-0.3, 0.3].forEach(x => RB(C, 0.08, 0.06, 0.03, 0.01, car.tailMat, x, 0.56, -1.02));
  addCoilover(car, [0.3, 0.92, 0.6], [0.5, 0.3, 0.68], 0.05); addCoilover(car, [-0.3, 0.92, 0.6], [-0.5, 0.3, 0.68], 0.05);
  addCoilover(car, [0.36, 0.98, -0.55], [0.52, 0.4, -0.62], 0.06); addCoilover(car, [-0.36, 0.98, -0.55], [-0.52, 0.4, -0.62], 0.06);
  // whip antenna with a flag
  const wp = new THREE.Group(); wp.position.set(-0.34, 1.06, -0.47); C.add(wp);
  addMesh(wp, cylGeo(0.008, 0.012, 1.3, 6), CM.black, 0, 0.65, 0);
  const fs = new THREE.Shape(); fs.moveTo(0, 0); fs.lineTo(0, 0.2); fs.lineTo(-0.3, 0.1); fs.lineTo(0, 0);
  addMesh(wp, new THREE.ShapeGeometry(fs), new THREE.MeshStandardMaterial({color: 0xff6b00, side: THREE.DoubleSide}), 0, 1.1, 0, 0, Math.PI / 2, 0);
  car.sway.push({o: wp, vx: 0, vz: 0});
};

// ============ 2. ICE CREAM VAN ============
BUILD.van = car => {
  const C = car.chassis; car.freq = 7.5; car.damp = 0.3;
  const s = {L: 2.3, W: 1.45, yb: 0.2, wf: [0.64, 0.3], wr: [-0.62, 0.3], arch: 0.05, noseY: 0.72, cr: 0.16, taper: 0.12, plan: 0.1, bevel: 0.07, yMax: 1.5,
    top: [['q', 0.97, 0.84, 0.88, 0.86], ['l', 0.68, 1.42], ['q', 0.6, 1.5, 0.48, 1.5], ['l', -1.0, 1.5], ['q', -1.15, 1.5, -1.15, 1.38]]};
  const I = sedanBody(car, s);
  [[0.64, 1], [-0.64, 1], [0.64, -1], [-0.64, -1]].forEach(([z, sd]) => addWheel(car, {x: sd * 0.6, z: z < 0 ? -0.62 : 0.64, r: 0.3, w: 0.28, front: z > 0, rim: 'steel'}));
  // windscreen and side windows set into the body
  const wz = (0.88 + 0.68) / 2 + 0.06, wy = (0.86 + 1.42) / 2 + 0.03, wa = Math.atan2(0.68 - 0.88, 1.42 - 0.86);
  RB(C, 1.1, 0.6, 0.03, 0.03, CM.glass, 0, wy, wz, wa, 0, 0);
  [-1, 1].forEach(sd => RB(C, 0.03, 0.34, 0.36, 0.04, CM.glass, sd * (I.hw(1.15, 0.45) + 0.004), 1.15, 0.45));
  // serving hatch, awning and counter on the right side
  const hx = -(I.hw(1.05, -0.35) + 0.004);
  RB(C, 0.03, 0.44, 0.9, 0.04, CM.glass, hx, 1.06, -0.35);
  const awTex = canvasTex(256, 64, (g, w, h) => { for (let i = 0; i < 8; i++) { g.fillStyle = i % 2 ? '#ffffff' : '#ff6fa3'; g.fillRect(i * 32, 0, 32, h); } g.fillStyle = '#ff6fa3'; for (let i = 0; i < 8; i++) { g.beginPath(); g.arc(i * 32 + 16, h - 4, 16, 0, Math.PI); g.fill(); } });
  const aw = new THREE.Group(); aw.position.set(hx, 1.33, -0.35); aw.rotation.y = -Math.PI / 2; C.add(aw);
  const awm = new THREE.Mesh(new THREE.PlaneGeometry(1.0, 0.3), new THREE.MeshStandardMaterial({map: awTex, side: THREE.DoubleSide, roughness: 0.6}));
  awm.position.set(0, -0.06, 0.13); awm.rotation.x = 0.95; aw.add(awm);
  RB(C, 0.13, 0.03, 0.92, 0.01, CM.white, hx - 0.06, 0.82, -0.35);
  decal(C, 1.3, 0.34, (g, w, h) => { g.fillStyle = '#ff6fa3'; g.font = 'bold 50px sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.strokeStyle = '#fff'; g.lineWidth = 8; g.strokeText('ICE CREAM', w / 2, h / 2); g.fillText('ICE CREAM', w / 2, h / 2); }, I.hw(0.62, -0.2) + 0.006, 0.6, -0.25, Math.PI / 2);
  // giant soft-serve cone on the roof
  const waffle = canvasTex(64, 64, (g, w) => { g.fillStyle = '#d9a35b'; g.fillRect(0, 0, w, w); g.strokeStyle = '#a8732e'; g.lineWidth = 3; for (let i = -64; i < 128; i += 12) { g.beginPath(); g.moveTo(i, 0); g.lineTo(i + 64, 64); g.stroke(); g.beginPath(); g.moveTo(i, 64); g.lineTo(i + 64, 0); g.stroke(); } }, [3, 2]);
  const cy = 1.47;
  addMesh(C, new THREE.ConeGeometry(0.2, 0.5, 24, 1, true), new THREE.MeshStandardMaterial({map: waffle, roughness: 0.7, side: THREE.DoubleSide}), 0, cy + 0.25, -0.35, Math.PI, 0, 0);
  const cream = std(0xffd6e8, 0.4);
  [[0.19, 0.075, 0.52], [0.145, 0.065, 0.62], [0.095, 0.055, 0.71]].forEach(([R, t, y]) => addMesh(C, new THREE.TorusGeometry(R, t, 12, 28), cream, 0, cy + y, -0.35, Math.PI / 2, 0, 0));
  addMesh(C, new THREE.ConeGeometry(0.07, 0.14, 16), cream, 0, cy + 0.8, -0.35);
  addMesh(C, sphGeo(0.05), CM.red, 0.03, cy + 0.87, -0.33);
  // lights, chrome, plates, mirror, exhaust
  RB(C, 1.32, 0.1, 0.12, 0.04, CM.chrome, 0, 0.3, I.zf - 0.02);
  RB(C, 1.32, 0.1, 0.12, 0.04, CM.chrome, 0, 0.3, I.zr + 0.02);
  RB(C, 0.48, 0.14, 0.03, 0.03, CM.chrome, 0, 0.52, I.zf);
  [-0.44, 0.44].forEach(x => headlamp(C, x, 0.55, I.zf + 0.005, 0.085));
  [-0.55, 0.55].forEach(x => RB(C, 0.1, 0.22, 0.03, 0.02, car.tailMat, x, 0.66, I.zr));
  plate(C, I.zr - 0.01, 0.46, 'YUM 1', Math.PI);
  mirrors(car, I, 0.84, 0.9);
  exhaustTip(car, [0.4, 0.2, I.zr - 0.02], [0, -0.1, -1], 0.04);
};

// ============ 3. MUSCLE COUPE ============
BUILD.muscle = car => {
  const C = car.chassis; car.freq = 8.5; car.damp = 0.32;
  const s = {L: 2.5, W: 1.45, yb: 0.2, wf: [0.72, 0.32], wr: [-0.7, 0.36], arch: 0.04, noseY: 0.62, hoodCtl: [0.95, 0.86], belt: 0.84,
    cab: {a: 0.18, b: -0.14, c: -0.62, d: -0.92, roof: 1.2, bulge: 0.025}, deckY: 0.88, deckRise: 0.01, tailY: 0.93, cr: 0.14, taper: 0.16, plan: 0.12, bevel: 0.07};
  const I = sedanBody(car, s);
  [1, -1].forEach(sd => {
    addWheel(car, {x: sd * 0.6, z: 0.72, r: 0.32, w: 0.3, front: true, rim: 'mesh'});
    addWheel(car, {x: sd * 0.56, z: -0.7, r: 0.36, w: 0.4, rim: 'mesh'});
  });
  blower(car, 0, 0.88, 0.5);
  // racing stripes over hood and deck
  const hood = quadPts([1.11, 0.62], [0.95, 0.86], [0.18, 0.84], 16, 0.04, 1).map(p => [p[0], p[1] + I.bev]);
  const deck = quadPts([-0.92, 0.88], [(-0.92 - 1.25) / 2, 0.89], [-1.11, 0.93], 8).map(p => [p[0], p[1] + I.bev]);
  [-0.12, 0.12].forEach(x => { stripe(car, hood, x, 0.12, CM.white); stripe(car, deck, x, 0.12, CM.white); RB(C, 0.12, 0.012, 0.42, 0.005, CM.white, x, I.roofTop + 0.004, -0.38); });
  // grille with quad round headlamps, chrome bumpers
  RB(C, 1.0, 0.2, 0.05, 0.03, CM.black, 0, 0.47, I.zf - 0.01);
  RB(C, 1.04, 0.02, 0.06, 0.01, CM.chrome, 0, 0.58, I.zf - 0.01);
  [-0.38, -0.24, 0.24, 0.38].forEach(x => headlamp(C, x, 0.47, I.zf + 0.02, 0.06));
  RB(C, 1.3, 0.1, 0.12, 0.05, CM.chrome, 0, 0.29, I.zf);
  RB(C, 1.3, 0.1, 0.12, 0.05, CM.chrome, 0, 0.32, I.zr);
  [-0.3, 0.3].forEach(x => RB(C, 0.46, 0.08, 0.03, 0.02, car.tailMat, x, 0.76, I.zr + 0.01));
  plate(C, I.zr - 0.02, 0.5, 'V8 GO', Math.PI);
  mirrors(car, I, 0.2, 0.86);
  // side-exit pipes along the sills
  [-1, 1].forEach(sd => {
    const x = sd * 0.78;
    tube(C, [[sd * 0.66, 0.26, 0.44], [x, 0.28, 0.32], [x, 0.28, -0.25]], 0.04, CM.chrome, 18);
    exhaustTip(car, [x, 0.28, -0.3], [0, 0, -1], 0.05, 1.1);
  });
};

// ============ 4. MONSTER TRUCK ============
BUILD.monster = car => {
  const C = car.chassis; car.freq = 5; car.damp = 0.22;
  const s = {L: 2.3, W: 1.5, yb: 1.32, noArch: true, noseY: 1.74, hoodCtl: [0.85, 1.86], belt: 1.86,
    cab: {a: 0.3, b: 0.12, c: -0.32, d: -0.42, roof: 2.3, bulge: 0.02}, deckY: 1.88, bed: {y: 1.56}, tailY: 1.88, cr: 0.12, taper: 0.1, plan: 0.08, bevel: 0.06};
  const I = sedanBody(car, s);
  [[0.95, 0.78], [-0.95, 0.78], [0.95, -0.78], [-0.95, -0.78]].forEach(([x, z]) => addWheel(car, {x, z, r: 0.62, w: 0.55, front: z > 0, tread: 'knobby', rim: 'beadlock', rimF: 0.5, caliper: CM.yellow}));
  // frame, bed walls, liner
  [-0.38, 0.38].forEach(x => RB(C, 0.1, 0.14, 2.2, 0.03, CM.black, x, 1.08, 0));
  [-1, 1].forEach(sd => RB(C, 0.06, 0.34, 0.74, 0.02, car.paint, sd * 0.72, 1.73, -0.78));
  RB(C, 1.32, 0.02, 0.7, 0.01, CM.black, 0, 1.63, -0.78);
  // axles, diffs and a spinning driveshaft live on the wheels, not the body
  [-0.78, 0.78].forEach(z => { addMesh(car.root, cylGeo(0.07, 0.07, 1.5, 14), CM.gun, 0, 0.62, z, 0, 0, Math.PI / 2); addMesh(car.root, sphGeo(0.17, 20, 14), CM.gun, 0, 0.62, z); });
  const sh = new THREE.Group(); sh.position.set(0, 0.66, 0); car.root.add(sh);
  addMesh(sh, cylGeo(0.045, 0.045, 1.2, 12), CM.alu, 0, 0, 0, Math.PI / 2, 0, 0);
  [-0.5, 0.5].forEach(z => RB(sh, 0.13, 0.04, 0.05, 0.01, CM.black, 0, 0, z));
  car.shafts.push(sh);
  [[0.95, 0.78], [-0.95, 0.78], [0.95, -0.78], [-0.95, -0.78]].forEach(([x, z]) => addCoilover(car, [Math.sign(x) * 0.45, 1.2, z * 0.8], [x * 0.62, 0.62, z], 0.09, CM.red));
  // blower and zoomie headers that spit fire straight up
  blower(car, 0, 1.92, 0.55, 1.15);
  [-1, 1].forEach(sd => [0.75, 0.45].forEach((z, k) => {
    tube(C, [[sd * 0.62, 1.8, z], [sd * 0.74, 1.95, z - 0.04], [sd * 0.8, 2.12, z - 0.12]], 0.04, CM.chrome, 12);
    exhaustTip(car, [sd * 0.8, 2.15, z - 0.13], [sd * 0.25, 1, -0.45], 0.05, 1.2);
  }));
  // roof light bar, grille, lights
  tube(C, [[-0.52, 2.0, -0.32], [-0.5, 2.48, -0.25], [0.5, 2.48, -0.25], [0.52, 2.0, -0.32]], 0.035, CM.chrome, 24);
  [-0.3, -0.1, 0.1, 0.3].forEach(x => { addMesh(C, cylGeo(0.07, 0.06, 0.08, 16), CM.black, x, 2.48, -0.2, Math.PI / 2, 0, 0); headlamp(C, x, 2.48, -0.155, 0.055); });
  RB(C, 1.1, 0.24, 0.05, 0.04, CM.chrome, 0, 1.55, I.zf - 0.01);
  for (let i = 0; i < 4; i++) RB(C, 1.0, 0.025, 0.06, 0.01, CM.black, 0, 1.47 + i * 0.055, I.zf);
  [-0.55, 0.55].forEach(x => RB(C, 0.2, 0.12, 0.03, 0.03, CM.head, x, 1.62, I.zf + 0.01));
  [-0.6, 0.6].forEach(x => RB(C, 0.1, 0.18, 0.03, 0.02, car.tailMat, x, 1.75, I.zr));
  RB(C, 1.4, 0.14, 0.14, 0.05, CM.black, 0, 1.36, I.zf + 0.02);
  mirrors(car, I, 0.3, 1.86);
};

// ============ 5. POLICE CRUISER ============
BUILD.police = car => {
  const C = car.chassis; car.freq = 9; car.damp = 0.38;
  const s = {L: 2.5, W: 1.5, yb: 0.2, wf: [0.74, 0.32], wr: [-0.74, 0.32], arch: 0.05, noseY: 0.64, hoodCtl: [0.9, 0.84], belt: 0.82,
    cab: {a: 0.3, b: 0, c: -0.6, d: -0.9, roof: 1.24, bulge: 0.03}, deckY: 0.84, tailY: 0.84, cr: 0.13, taper: 0.15, plan: 0.1, bevel: 0.06, doors: 4};
  const I = sedanBody(car, s);
  [1, -1].forEach(sd => { addWheel(car, {x: sd * 0.62, z: 0.74, r: 0.32, w: 0.3, front: true, rim: 'steel'}); addWheel(car, {x: sd * 0.62, z: -0.74, r: 0.32, w: 0.3, rim: 'steel'}); });
  // white doors with POLICE lettering
  [-1, 1].forEach(sd => {
    const x = sd * (I.hw(0.52, 0) + 0.003);
    RB(C, 0.012, 0.22, 0.98, 0.004, CM.white, x, 0.56, -0.08);
    decal(C, 0.8, 0.17, (g, w, h) => { g.fillStyle = '#1d3557'; g.font = 'bold 40px sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText('POLICE', w / 2, h / 2 + 2); }, x + sd * 0.008, 0.56, -0.08, sd * Math.PI / 2);
  });
  // strobing light bar
  const rT = I.roofTop;
  RB(C, 0.9, 0.07, 0.22, 0.03, CM.black, 0, rT + 0.035, -0.3);
  const mR = new THREE.MeshStandardMaterial({color: 0x550000, emissive: 0xff1020, emissiveIntensity: 0.2, roughness: 0.2});
  const mB = new THREE.MeshStandardMaterial({color: 0x000a55, emissive: 0x1050ff, emissiveIntensity: 0.2, roughness: 0.2});
  RB(C, 0.38, 0.1, 0.2, 0.04, mR, 0.22, rT + 0.11, -0.3);
  RB(C, 0.38, 0.1, 0.2, 0.04, mB, -0.22, rT + 0.11, -0.3);
  RB(C, 0.06, 0.1, 0.2, 0.02, CM.chrome, 0, rT + 0.11, -0.3);
  car.siren = [mR, mB];
  // push bar
  [-0.3, 0.3].forEach(x => tube(C, [[x, 0.26, I.zf], [x, 0.3, I.zf + 0.12], [x, 0.66, I.zf + 0.12], [x, 0.7, I.zf + 0.02]], 0.03, CM.black, 16));
  tube(C, [[-0.36, 0.5, I.zf + 0.13], [0.36, 0.5, I.zf + 0.13]], 0.028, CM.black, 4);
  // lights, grille, plates
  RB(C, 0.6, 0.14, 0.04, 0.03, CM.black, 0, 0.5, I.zf - 0.01);
  [-0.46, 0.46].forEach(x => RB(C, 0.26, 0.1, 0.03, 0.03, CM.head, x, 0.55, I.zf - 0.005));
  [-0.5, 0.5].forEach(x => RB(C, 0.26, 0.12, 0.03, 0.03, car.tailMat, x, 0.66, I.zr + 0.005));
  RB(C, 1.4, 0.12, 0.12, 0.05, CM.black, 0, 0.28, I.zf);
  RB(C, 1.4, 0.12, 0.12, 0.05, CM.black, 0, 0.3, I.zr);
  plate(C, I.zr - 0.01, 0.46, 'COP 99', Math.PI);
  mirrors(car, I, 0.32, 0.82);
  addMesh(C, cylGeo(0.05, 0.06, 0.1, 14), CM.chrome, 0.66, 0.95, 0.3, Math.PI / 2, 0, 0);
  // whippy antenna
  const ap = new THREE.Group(); ap.position.set(-0.42, 0.9, -1.0); C.add(ap);
  addMesh(ap, cylGeo(0.006, 0.01, 0.9, 6), CM.black, 0, 0.45, 0);
  car.sway.push({o: ap, vx: 0, vz: 0});
  exhaustTip(car, [0.45, 0.22, I.zr - 0.02], [0, -0.1, -1], 0.045);
  exhaustTip(car, [-0.45, 0.22, I.zr - 0.02], [0, -0.1, -1], 0.045);
};
