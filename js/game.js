// ============ GAME: engine sim, driving, AI, races, coin rush, camera, HUD ============
let mode = 'loading', prevMode = null;
let player = null, race = null, rush = null;
const keys = {};
let camMode = 0, camShake = 0, gTime = 0;
const camPos = new V3(0, 20, 40), camLook = new V3();

// ---------- engine: rpm, gears, rev limiter, backfires ----------
function makeEngineState(def){ return {rpm: def.idle, gear: 1, shiftT: 0, backfire: 0, crackle: 0, lastThrottle: 0, boost: 0, ev: null}; }
function engineStep(e, def, speed, throttle, top, dt){
  const G = def.gears, idle = def.idle, red = def.red, v = Math.abs(speed);
  e.ev = null;
  if (isJet(def)) {
    const tgt = idle + (red - idle) * clamp(throttle * 0.75 + v / top * 0.3, 0, 1);
    e.rpm += (tgt - e.rpm) * Math.min(1, dt * 2.2); e.gear = 1; return;
  }
  const gTop = g => top * Math.pow(g / G, 0.78) * 1.03;
  if (e.shiftT > 0) e.shiftT -= dt;
  else if (e.gear < G && v > gTop(e.gear) * 0.97 && throttle > 0.3) {
    e.gear++; e.shiftT = 0.17; e.ev = 'up';
    if (def.engine !== 'ev' && Math.random() < 0.65) { e.backfire = 0.6 + Math.random() * 0.5; e.ev = 'upPop'; }
  } else if (e.gear > 1 && v < gTop(e.gear - 1) * 0.72) {
    e.gear--; e.shiftT = 0.06; e.ev = 'down';
    if (throttle < 0.2 && Math.random() < 0.6) { e.backfire = 0.5; e.ev = 'downPop'; }
  }
  const free = v < 1.2;
  let tgt = free ? idle + throttle * (red - idle) * 1.03 : idle * 0.9 + (red - idle * 0.9) * clamp(v / gTop(e.gear), 0, 1.04);
  tgt = Math.max(idle, tgt);
  if (e.shiftT > 0 && e.ev !== 'down') tgt *= 0.74;
  e.rpm += (tgt - e.rpm) * Math.min(1, dt * (tgt > e.rpm ? (free ? 5 : 14) : 9));
  const ev = def.engine === 'ev';
  if (e.rpm > red * 0.985 && throttle > 0.5) {
    e.rpm = red * (0.92 + Math.random() * 0.04);
    if (!ev && Math.random() < 0.18) { e.backfire = Math.max(e.backfire, 0.55); e.ev = e.ev || 'pop'; }
  }
  if (!ev && e.lastThrottle > 0.6 && throttle < 0.1 && e.rpm > red * 0.5) e.crackle = 0.8;
  if (e.crackle > 0) { e.crackle -= dt; if (Math.random() < dt * 11) { e.backfire = Math.max(e.backfire, 0.4 + Math.random() * 0.5); e.ev = e.ev || 'pop'; } }
  e.backfire = Math.max(0, e.backfire - dt * 4.5);
  e.lastThrottle = throttle;
  const boostT = hasTurbo(def) ? throttle * clamp((e.rpm - 2500) / 3500, 0, 1) : 0;
  e.boost += (boostT - e.boost) * Math.min(1, dt * 3);
}
function engineSFX(o, vol = 1){
  const ev = o.eng.ev; if (!ev || vol < 0.15) return;
  if (ev === 'up' || ev === 'upPop') { SFX.shift(); if (hasTurbo(o.def) && vol > 0.9) SFX.blowoff(); }
  if (ev.endsWith('op') || ev === 'pop') SFX.pop(ev === 'upPop' && vol > 0.9);
}

// ---------- the player's car ----------
function makePlayer(def){
  const st = stats(def), car = buildCar(def, paintOf(def)); scene.add(car.root);
  return {def, st, car, x: 0, z: 0, y: 0, vy: 0, head: 0, speed: 0, side: 0, steer: 0, nitro: st.nitroMax,
    r: Math.max(def.w, def.l) * 0.36, rw: def.w / 2, idx: 0, fidx: 0, lap: -1, s: 0, lat: 0,
    eng: makeEngineState(def), aLong: 0, aLat: 0, boost: false, throttle: 0, brake: 0, air: false, onRamp: false, bump: 0, yawRate: 0, slip: 0};
}
function placeOnTrack(o, t, idx, lat){
  const q = t.P[idx], n = t.Nr[idx], T = t.T[idx];
  o.x = q.x + n.x * lat; o.z = q.z + n.z * lat; o.head = Math.atan2(T.x, T.z);
  o.idx = idx; o.fidx = idx; o.lat = lat; o.y = groundAt(t, idx, lat); o.vy = 0; o.speed = 0; o.side = 0;
}
function hitFX(o, impact, quiet){
  const p = clamp(impact / 30, 0, 1);
  if (!quiet) { SFX.thud(p); camShake = Math.max(camShake, p * 0.5); }
  for (let i = 0; i < 6 + p * 10; i++) puff(o.x + (Math.random() - 0.5), o.y + 0.4, o.z + (Math.random() - 0.5), {vx: (Math.random() - 0.5) * 9, vy: 2 + Math.random() * 4, vz: (Math.random() - 0.5) * 9, life: 0.35, s0: 0.12, s1: 0.04, a: 1, color: 0xffb347, add: true, drag: 2, grav: 14});
}
function drivePlayer(p, dt, ctl, t){
  const st = p.st;
  const up = ctl && (keys.KeyW || keys.ArrowUp), dn = ctl && (keys.KeyS || keys.ArrowDown);
  const lf = ctl && (keys.KeyA || keys.ArrowLeft), rt = ctl && (keys.KeyD || keys.ArrowRight), hb = ctl && keys.Space;
  p.boost = !!(ctl && (keys.ShiftLeft || keys.ShiftRight) && p.nitro > 0.05 && up);
  const top = st.top * (p.boost ? 1.4 : 1), v0 = p.speed;
  const g0 = t ? groundAt(t, p.fidx, p.lat) : 0, grounded = p.y <= g0 + 0.06, tr = grounded ? 1 : 0.15;
  const shiftCut = p.eng.shiftT > 0 ? 0.3 : 1; // the car really pauses for each gear change
  if (up) { if (p.speed < top) p.speed = Math.min(top, p.speed + st.accel * (p.boost ? 1.7 : 1) * (p.speed < 0 ? 2.5 : shiftCut) * tr * dt); }
  else if (dn) p.speed -= (p.speed > 0 ? st.accel * 1.8 : st.accel * 0.6) * tr * dt;
  else p.speed -= Math.sign(p.speed) * Math.min(Math.abs(p.speed), 7 * dt);
  if (p.speed > top) p.speed = Math.max(top, p.speed - 14 * dt);
  p.speed = Math.max(-st.top * 0.35, p.speed);
  p.nitro = p.boost ? Math.max(0, p.nitro - dt) : Math.min(st.nitroMax, p.nitro + st.nitroRegen * dt);
  const revOnLine = !ctl && race && race.count > 0 && (keys.KeyW || keys.ArrowUp);
  p.throttle = up || revOnLine ? 1 : 0;
  p.brake = dn && p.speed > 0.5 ? 1 : (hb ? 0.6 : 0);
  const si = (lf ? 1 : 0) - (rt ? 1 : 0);
  p.steer += (si - p.steer) * Math.min(1, dt * 9);
  const av = Math.abs(p.speed);
  const turn = st.grip * 0.95 * Math.min(1, av / 5) / (1 + av / (p.def.turnFall || 45)) * (hb ? 1.5 : 1) * (grounded ? 1 : 0.3);
  p.yawRate = p.steer * turn * (p.speed >= 0 ? 1 : -1);
  p.head += p.yawRate * dt;
  p.side += p.steer * p.speed * (hb ? 0.9 : 0.22) * dt;
  p.side *= Math.exp(-st.grip * (hb ? 0.5 : 2.6) * dt);
  if (hb) p.speed *= Math.exp(-0.7 * dt);
  p.slip = clamp(Math.abs(p.side) / 5 + (hb && av > 6 ? 0.5 : 0) + (up && av < 6 && p.def.accel > 20 ? 0.4 : 0), 0, 1.5);
  // move, collide with furniture
  const fx = Math.sin(p.head), fz = Math.cos(p.head);
  let vx = fx * p.speed - fz * p.side, vz = fz * p.speed + fx * p.side;
  let nx = p.x + vx * dt, nz = p.z + vz * dt;
  if (p.y < 1.2 && blocked(nx, nz, p.r)) {
    const impact = Math.abs(p.speed);
    if (!blocked(nx, p.z, p.r)) { nz = p.z; vz = 0; }
    else if (!blocked(p.x, nz, p.r)) { nx = p.x; vx = 0; }
    else { nx = p.x; nz = p.z; vx *= -0.3; vz *= -0.3; }
    p.speed = (vx * fx + vz * fz) * lerp(0.55, 0.95, st.crashKeep);
    p.side = (-vx * fz + vz * fx) * 0.5;
    if (impact > 8) hitFX(p, impact);
  }
  p.x = nx; p.z = nz;
  // stay inside the track rails
  if (t) {
    const ni = nearestIdx(t, p.x, p.z, p.idx, 30), dI = ni - p.idx;
    if (dI < -t.N / 2) p.lap++; else if (dI > t.N / 2) p.lap--;
    p.idx = ni;
    const q = t.P[ni], n = t.Nr[ni], T = t.T[ni];
    p.fidx = ni + ((p.x - q.x) * T.x + (p.z - q.z) * T.z) / t.ds;
    let d = (p.x - q.x) * n.x + (p.z - q.z) * n.z;
    const lim = t.hw - p.rw;
    p.scrape = false;
    if (Math.abs(d) > lim) {
      const sg = Math.sign(d), over = Math.abs(d) - lim;
      p.x -= n.x * sg * over; p.z -= n.z * sg * over; d = sg * lim;
      vx = fx * p.speed - fz * p.side; vz = fz * p.speed + fx * p.side;
      const vn = (vx * n.x + vz * n.z) * sg;
      if (vn > 0) {
        vx -= n.x * sg * vn * 1.3; vz -= n.z * sg * vn * 1.3;
        p.speed = vx * fx + vz * fz; p.side = -vx * fz + vz * fx;
        p.speed *= 1 - (1 - st.crashKeep) * Math.min(1, vn / 25);
        if (vn > 5) hitFX(p, vn * 1.5);
      }
      p.speed *= Math.exp(-0.5 * dt); p.scrape = true;
      if (Math.random() < dt * 20 && Math.abs(p.speed) > 6) puff(p.x + n.x * sg * p.rw, p.y + 0.3, p.z + n.z * sg * p.rw, {vx: -fx * 3, vy: 2, vz: -fz * 3, life: 0.3, s0: 0.1, s1: 0.03, a: 1, color: 0xffc04d, add: true, grav: 10});
    }
    p.lat = d;
    p.s = p.lap * t.L + p.fidx * t.ds;
  }
  // gravity, hills, crests, jumps and landings
  const gnd = t ? groundAt(t, p.fidx, p.lat) : 0;
  const along = t ? Math.sin(p.head) * t.T[p.idx].x + Math.cos(p.head) * t.T[p.idx].z : 1;
  const slope = t ? slopeAt(t, p.fidx, p.lat) * along : 0, ev = p.speed * slope;
  p.vy -= 32 * dt; p.y += p.vy * dt; p.bump = 0;
  if (p.y <= gnd || (p.y < gnd + 0.12 && p.vy <= ev + 0.5)) {
    if (p.vy < ev - 5) { p.bump = Math.min(2.5, (ev - p.vy) * 0.12); SFX.land(); camShake = Math.max(camShake, 0.15); }
    p.vy = ev; p.y = gnd;
    p.speed -= 20 * slope * dt;        // uphill slows you, downhill pulls you along
  }
  p.air = p.y > gnd + 0.08;
  p.pitchSlope = p.air ? 0 : slope;
  p.aLong = lerp(p.aLong, (p.speed - v0) / Math.max(dt, 1e-3), Math.min(1, dt * 8));
  p.aLat = lerp(p.aLat, p.speed * p.yawRate, Math.min(1, dt * 8));
  engineStep(p.eng, p.def, p.speed, p.throttle, st.top, dt);
  engineSFX(p);
}
// Very fast cars are simulated in several small steps per frame so they never skip through rails or furniture.
function driveSub(p, dt, ctl, t){
  const n = clamp(Math.ceil(Math.abs(p.speed) * dt / 0.9), 1, 10);
  for (let k = 0; k < n; k++) drivePlayer(p, dt / n, ctl, t);
  const fx = clamp((Math.abs(p.speed) - 40) / 90, 0, 0.85) + (p.boost ? 0.15 : 0);
  $('warpFX').style.opacity = fx.toFixed(2);
}
function tyreFX(o, dt, slip){
  if (slip < 0.35 || o.air || Math.abs(o.isAI ? o.v : o.speed) < 2) { for (const w of o.car.wheels) w.last = null; return; }
  const c = Math.cos(o.head), s = Math.sin(o.head);
  for (const w of o.car.wheels) {
    if (w.front && slip < 0.9) { w.last = null; continue; }
    const wx = o.x + w.x * c + w.z * s, wz = o.z - w.x * s + w.z * c, pt = {x: wx, z: wz};
    if (w.last) skidQuad(w.last, pt, w.w * 0.85, o.y + 0.015);
    w.last = pt;
    if (Math.random() < slip * dt * 12) puff(wx, o.y + 0.25, wz, {vx: (Math.random() - 0.5) * 1.5, vy: 0.9, vz: (Math.random() - 0.5) * 1.5, life: 1.5, s0: 0.35, s1: 2.2, a: 0.26, color: 0xf2f2f2, drag: 1.6});
  }
}
function poseAndAnimate(o, dt){
  const r = o.car.root, isP = !o.isAI;
  r.position.set(o.x, o.y, o.z); r.rotation.y = o.head;
  const tx = o.air ? clamp(-o.vy * 0.03, -0.4, 0.4) : -Math.atan(o.pitchSlope || 0);
  r.rotation.x = lerp(r.rotation.x, tx, Math.min(1, dt * 10));
  animateCar(o.car, {speed: isP ? o.speed : o.v, steer: o.steer, throttle: o.throttle, brake: o.brake, rpm: o.eng.rpm, rpmN: o.eng.rpm / o.def.red,
    boost: isP && o.boost, aLong: o.aLong, aLat: o.aLat, air: o.air, bump: o.bump, backfire: o.eng.backfire}, dt);
}

// ---------- AI drivers ----------
function makeAI(def, paint, name, skill, idx, lat, t, tier){
  const car = buildCar(def, paint); scene.add(car.root);
  const a = {def, car, name, color: paint, skill, s: idx * t.ds - t.L, v: 0, speed: 0, off: lat, wander: lat, lineT: 1 + Math.random() * 2,
    y: TRACK_Y, vy: 0, bump: 0, hitT: 0, r: Math.max(def.w, def.l) * 0.36, lat, x: 0, z: 0, head: Math.atan2(t.T[idx].x, t.T[idx].z),
    eng: makeEngineState(def), acc: tier.top * 0.9, offMax: t.hw - def.w / 2 - 0.3, aLong: 0, aLat: 0, throttle: 0, brake: 0, steer: 0, air: false, onRamp: false, isAI: true};
  a.x = t.P[idx].x + t.Nr[idx].x * lat; a.z = t.P[idx].z + t.Nr[idx].z * lat;
  return a;
}
function driveAI(a, dt){
  const r = race, t = r.t, L = t.L, N = t.N;
  const sm = (((a.s % L) + L) % L) / t.ds, i0 = Math.floor(sm) % N, f = sm - Math.floor(sm), i1 = (i0 + 1) % N;
  let k = a.skill; const gap = (a.s - player.s) / L;
  if (gap > 0.3) k *= 0.93; else if (gap < -0.2) k *= 1.07;
  let target = r.vmax[i0] * k;
  if (r.count > 0) target = 0;
  if (a.s >= r.laps * L) target *= 0.55;
  if (a.hitT > 0) { a.hitT -= dt; target *= 0.7; }
  const ia = (i0 + Math.round(9 / t.ds)) % N;
  const line = Math.sign(t.turn[ia]) * Math.min(1, t.K[ia] * 14) * (t.hw - 1.7);
  a.lineT -= dt; if (a.lineT <= 0) { a.wander = (Math.random() * 2 - 1) * (t.hw - 2.2); a.lineT = 2 + Math.random() * 3; }
  let offT = Math.abs(line) > 0.6 ? line : a.wander;
  // traffic: pass cars ahead on whichever side has room, and give room to cars alongside
  for (const c of r.cars) if (c !== a) {
    const g = c.s - a.s, dl = c.lat - a.off, side = (a.def.w + c.def.w) / 2 + 0.9, len = (a.def.l + c.def.l) / 2;
    if (Math.abs(dl) > side + 0.6) continue;
    if (g > 0.4 && g < len + 6) {
      const opts = [c.lat - side, c.lat + side].filter(o => Math.abs(o) <= a.offMax);
      if (opts.length) offT = opts.sort((p, q) => Math.abs(p - a.off) - Math.abs(q - a.off))[0];
      if (g < len + 1.2 && (!opts.length || Math.abs(dl) < side * 0.8)) target = Math.min(target, Math.max(0, c.isAI ? c.v : c.speed) * 0.97);
    } else if (g > -len - 0.5 && g <= 0.4) offT = c.lat + (dl > 0 ? -side : side);
  }
  offT = clamp(offT, -a.offMax, a.offMax);
  const prevOff = a.off, v0 = a.v;
  a.off = clamp(a.off + clamp(offT - a.off, -3.4 * dt, 3.4 * dt), -a.offMax, a.offMax);
  a.v += clamp(target - a.v, -38 * dt, a.acc * dt * (a.eng.shiftT > 0 ? 0.35 : 1));
  a.s += a.v * dt; a.speed = a.v;
  a.throttle = target > a.v + 0.5 ? 1 : 0.2; a.brake = target < a.v - 1.5 ? 1 : 0;
  const P0 = t.P[i0], P1 = t.P[i1], n0 = t.Nr[i0], T0 = t.T[i0];
  a.x = lerp(P0.x, P1.x, f) + n0.x * a.off; a.z = lerp(P0.z, P1.z, f) + n0.z * a.off;
  const offRate = (a.off - prevOff) / Math.max(dt, 1e-3);
  const nh = a.v > 0.5 ? Math.atan2(T0.x * a.v + n0.x * offRate, T0.z * a.v + n0.z * offRate) : Math.atan2(T0.x, T0.z);
  let dh = Math.atan2(Math.sin(nh - a.head), Math.cos(nh - a.head));
  const yaw = dh / Math.max(dt, 1e-3); a.head += dh;
  a.steer = lerp(a.steer, clamp(yaw / Math.max(2, a.v) * 5, -1, 1), Math.min(1, dt * 8));
  a.lat = a.off;
  a.aLong = lerp(a.aLong, (a.v - v0) / Math.max(dt, 1e-3), Math.min(1, dt * 8)); a.aLat = lerp(a.aLat, a.v * yaw, Math.min(1, dt * 8));
  const gnd = groundAt(t, i0 + f, a.off), slope = slopeAt(t, i0 + f, a.off), ev = a.v * slope;
  a.vy -= 32 * dt; a.y += a.vy * dt; a.bump = 0;
  if (a.y <= gnd || (a.y < gnd + 0.12 && a.vy <= ev + 0.5)) { if (a.vy < ev - 5) a.bump = Math.min(2.5, (ev - a.vy) * 0.12); a.vy = ev; a.y = gnd; a.v = Math.max(0, a.v - 12 * slope * dt); }
  a.air = a.y > gnd + 0.08; a.pitchSlope = a.air ? 0 : slope;
  engineStep(a.eng, a.def, a.v, a.throttle, r.tier.top * 1.25, dt);
}
// Every car is two circles along its length (nose and tail), so long, short and wide cars all
// collide properly. All pairs are solved — AI against AI too — so nobody drives through anybody.
function carCircles(c){
  const L = c.def.l, W = c.def.w, fx = Math.sin(c.head), fz = Math.cos(c.head), r = Math.min(W, L) * 0.47, o = Math.max(0, L / 2 - r);
  return [{x: c.x + fx * o, z: c.z + fz * o, r}, {x: c.x - fx * o, z: c.z - fz * o, r}];
}
function trackFrame(c, t){ const i = Math.floor((((c.s % t.L) + t.L) % t.L) / t.ds) % t.N; return {T: t.T[i], N: t.Nr[i]}; }
function carVel(c, t){
  if (c.isAI) { const F = trackFrame(c, t); return {x: F.T.x * c.v, z: F.T.z * c.v}; }
  const fx = Math.sin(c.head), fz = Math.cos(c.head); return {x: fx * c.speed - fz * c.side, z: fz * c.speed + fx * c.side};
}
function shove(c, dx, dz, t){
  c.x += dx; c.z += dz;
  if (c.isAI) { const F = trackFrame(c, t); c.s += dx * F.T.x + dz * F.T.z; c.off = clamp(c.off + dx * F.N.x + dz * F.N.z, -c.offMax, c.offMax); }
}
function kick(c, vx, vz, t){
  if (c.isAI) { const F = trackFrame(c, t); c.v = Math.max(0, c.v + vx * F.T.x + vz * F.T.z); }
  else { const fx = Math.sin(c.head), fz = Math.cos(c.head); c.speed += vx * fx + vz * fz; c.side += (-vx * fz + vz * fx) * 0.6; }
}
function carContacts(){
  const t = race.t, cars = race.cars;
  for (let pass = 0; pass < 3; pass++) for (let i = 0; i < cars.length; i++) for (let j = i + 1; j < cars.length; j++) {
    const a = cars[i], b = cars[j];
    if (Math.abs(a.y - b.y) > 1.2 || (a.x - b.x) ** 2 + (a.z - b.z) ** 2 > 49) continue;
    let best = null;
    for (const p of carCircles(a)) for (const q of carCircles(b)) {
      const dx = q.x - p.x, dz = q.z - p.z, d = Math.hypot(dx, dz), ov = p.r + q.r - d;
      if (ov > 0 && (!best || ov > best.ov)) best = {ov, nx: d > 1e-4 ? dx / d : 1, nz: d > 1e-4 ? dz / d : 0};
    }
    if (!best) continue;
    const ma = a.def.mass, mb = b.def.mass, sa = mb / (ma + mb), sb = ma / (ma + mb);
    shove(a, -best.nx * best.ov * sa, -best.nz * best.ov * sa, t);
    shove(b, best.nx * best.ov * sb, best.nz * best.ov * sb, t);
    if (pass) continue;
    const va = carVel(a, t), vb = carVel(b, t), vrel = (vb.x - va.x) * best.nx + (vb.z - va.z) * best.nz;
    if (vrel < 0) {
      const J = -1.2 * vrel / (1 / ma + 1 / mb);
      kick(a, -best.nx * J / ma, -best.nz * J / ma, t);
      kick(b, best.nx * J / mb, best.nz * J / mb, t);
      if (a.isAI) a.hitT = 0.4; if (b.isAI) b.hitT = 0.4;
      if (-vrel > 3) hitFX({x: (a.x + b.x) / 2, y: Math.max(a.y, b.y), z: (a.z + b.z) / 2}, -vrel * 1.5, a !== player && b !== player);
    }
  }
}

// ---------- coins ----------
const coinGeo = new THREE.CylinderGeometry(0.7, 0.7, 0.16, 28); coinGeo.rotateX(Math.PI / 2);
const coinMat = new THREE.MeshStandardMaterial({color: 0xffc83d, metalness: 0.9, roughness: 0.25, emissive: 0x6b4500, emissiveIntensity: 0.6});
const coinRim = new THREE.TorusGeometry(0.7, 0.07, 8, 28);
function coinMesh(x, y, z){
  const m = new THREE.Mesh(coinGeo, coinMat); m.position.set(x, y, z); m.castShadow = true;
  m.add(new THREE.Mesh(coinRim, coinMat)); scene.add(m); return m;
}

// ---------- race flow ----------
function cleanupRun(){
  if (player) { scene.remove(player.car.root); disposeCar(player.car); player = null; }
  if (race) { race.ais.forEach(a => { scene.remove(a.car.root); disposeCar(a.car); }); race.items.forEach(c => scene.remove(c.m)); getTrackGroup(race.t).visible = false; race = null; }
  if (rush) { rush.coins.forEach(c => scene.remove(c)); rush = null; }
  clearSkids(); SFX.stopEngines();
  PFX.forEach(p => p.s.visible = false);
  camShake = 0;
}
function shuffle(a){ for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; }
function startRace(track, ti = track.tier){
  cleanupRun(); SFX.init();
  const t = track, T = TIERS[ti];
  getTrackGroup(t).visible = true;
  race = {t, ti, tier: T, laps: lapsFor(t), count: 3.99, time: 0, finished: false, finT: 0, lapStart: 0, bestLap: null, coins: 0,
    maxLap: -1, wrong: 0, place: 4, vmax: computeVmax(t, T), ais: [], cars: [], items: [], boardT: 0};
  player = makePlayer(carById(save.sel));
  const slot = k => ({idx: (t.N - 8 - Math.floor(k / 2) * 13 + t.N) % t.N, lat: (k % 2 ? 1 : -1) * t.hw * 0.45});
  const ps = slot(3); placeOnTrack(player, t, ps.idx, ps.lat);
  player.lap = -1; player.s = -t.L + player.fidx * t.ds;
  let pool = CARS.filter(c => !c.creatorOnly && c.tier <= ti && c.tier >= ti - 1);
  if (pool.length < 2) pool = CARS.filter(c => !c.creatorOnly && c.tier <= ti);
  const names = shuffle(AI_NAMES.slice()), skills = shuffle([0.92, 0.97, 1.0]);
  for (let k = 0; k < 3; k++) {
    const def = pool[Math.floor(Math.random() * pool.length)], sl = slot(k);
    const a = makeAI(def, PAINTS[Math.floor(Math.random() * PAINTS.length)], names[k], skills[k], sl.idx, sl.lat, t, T);
    race.ais.push(a);
  }
  race.cars = [player, ...race.ais];
  const val = Math.round(4 * T.mult);
  for (let k = 0; k < 10; k++) {
    let idx = Math.floor((k + 0.5) / 10 * t.N);
    if (t.ramp0 != null && Math.abs(idx - t.rampI) < t.rampLen * 1.5) idx = (idx + t.rampLen * 2) % t.N;
    const lat = (Math.random() * 2 - 1) * (t.hw - 1.6), q = t.P[idx], n = t.Nr[idx];
    race.items.push({m: coinMesh(q.x + n.x * lat, 1.1, q.z + n.z * lat), cd: 0, val});
  }
  t.lights.forEach(m => { m.color.setHex(0x330000); m.emissive.setHex(0x000000); });
  enterPlay('race');
  updateCam(player, 0, true);
}
function startRush(){
  cleanupRun(); SFX.init();
  player = makePlayer(carById(save.sel));
  player.x = 0; player.z = 10; player.head = Math.PI;
  rush = {time: 60, got: 0, coins: []};
  for (let i = 0; i < 25; i++) rushCoin();
  enterPlay('rush');
  updateCam(player, 0, true);
}
function rushCoin(){
  let x, z, k = 0;
  do { x = (Math.random() * 2 - 1) * (ROOM - 4); z = (Math.random() * 2 - 1) * (ROOM - 4); } while (blocked(x, z, 2) && k++ < 60);
  rush.coins.push(coinMesh(x, 1.2, z));
}
function enterPlay(m){
  mode = m;
  $('menu').classList.add('hidden'); $('results').classList.add('hidden'); $('pause').classList.add('hidden');
  $('hud').classList.remove('hidden');
  $('mini').classList.toggle('hidden', m !== 'race');
  $('board').classList.toggle('hidden', m !== 'race');
  $('hLap').classList.toggle('hidden', m !== 'race');
  turntable.visible = false;
  camera.clearViewOffset();
}
function centerMsg(txt, small){ const el = $('center'); el.textContent = txt; el.classList.toggle('small', !!small); el.classList.remove('show'); void el.offsetWidth; el.classList.add('show'); }

function updateRace(dt){
  const r = race, t = r.t, p = player;
  if (r.count > 0) {
    const prev = Math.ceil(r.count); r.count -= dt; const c = Math.ceil(r.count);
    if (c !== prev) { if (c > 0) { centerMsg(c); SFX.beep(false); } else { centerMsg('GO!'); SFX.beep(true); } }
    const lit = r.count > 0 ? Math.min(5, Math.floor((4 - r.count) * 5 / 3)) : 0;
    t.lights.forEach((m, i) => { if (r.count > 0) { m.color.setHex(i < lit ? 0xff2020 : 0x330000); m.emissive.setHex(i < lit ? 0xff0000 : 0x000000); } });
    if (r.count <= 0) t.lights.forEach(m => { m.color.setHex(0x20ff40); m.emissive.setHex(0x00ff30); });
  } else {
    r.time += dt;
    if (r.time > 2.5 && r.time - dt <= 2.5) t.lights.forEach(m => { m.color.setHex(0x330000); m.emissive.setHex(0x000000); });
  }
  const ctl = r.count <= 0 && !r.finished;
  driveSub(p, dt, ctl, t);
  if (p.lap > r.maxLap) {
    r.maxLap = p.lap;
    if (p.lap >= 1 && !r.finished) {
      const lt = r.time - r.lapStart; r.lapStart = r.time;
      if (!r.bestLap || lt < r.bestLap) r.bestLap = lt;
      if (p.lap >= r.laps) finishPlayer();
      else centerMsg(p.lap === r.laps - 1 ? 'FINAL LAP' : 'LAP ' + (p.lap + 1), true);
    }
  }
  for (const a of r.ais) driveAI(a, dt);
  carContacts();
  for (const c of r.items) {
    if (c.cd > 0) { c.cd -= dt; if (c.cd <= 0) c.m.visible = true; continue; }
    c.m.rotation.y += dt * 3;
    if (Math.hypot(c.m.position.x - p.x, c.m.position.z - p.z) < p.r + 1 && p.y < 2.5) { c.m.visible = false; c.cd = 9; r.coins += c.val; SFX.coin(); }
  }
  const fwd = Math.sin(p.head) * t.T[p.idx].x + Math.cos(p.head) * t.T[p.idx].z;
  r.wrong = fwd < -0.3 && Math.abs(p.speed) > 2 && !r.finished ? r.wrong + dt : 0;
  if (!r.finished) r.place = 1 + r.ais.filter(a => a.s > p.s).length;
  poseAndAnimate(p, dt); tyreFX(p, dt, p.slip);
  for (const a of r.ais) { poseAndAnimate(a, dt); tyreFX(a, dt, Math.abs(a.aLat) > 40 ? 0.5 : 0); }
  // sound
  SFX.engine(p.def.engine, p.eng.rpm, p.throttle, p.def.red, p.eng.boost);
  SFX.screech(p.air || p.def.hover ? 0 : clamp((p.slip - 0.3) * 1.2, 0, 1));
  let near = null, nd = 1e9;
  for (const a of r.ais) { const d = Math.hypot(a.x - p.x, a.z - p.z); if (d < nd) { nd = d; near = a; } engineSFX(a, 1 - d / 15); }
  if (near) SFX.aiEngine(near.def.engine, near.eng.rpm, near.def.red, clamp(1 - nd / 30, 0, 1) * 0.55);
  hudRace(dt);
  updateCam(p, dt);
  if (r.finished) { r.finT += dt; if (r.finT > 3.2) showResults(); }
}
function finishPlayer(){
  const r = race; r.finished = true;
  r.place = 1 + r.ais.filter(a => a.s > player.s).length;
  centerMsg(ORD[r.place - 1] + '!');
  SFX.cheer();
}
function updateRush(dt){
  const p = player;
  driveSub(p, dt, true, null);
  for (let i = rush.coins.length - 1; i >= 0; i--) {
    const c = rush.coins[i]; c.rotation.y += dt * 3;
    if (Math.hypot(c.position.x - p.x, c.position.z - p.z) < p.r + 1.1 && p.y < 3) { scene.remove(c); rush.coins.splice(i, 1); rush.got++; SFX.coin(); rushCoin(); }
  }
  rush.time -= dt;
  poseAndAnimate(p, dt); tyreFX(p, dt, p.slip);
  SFX.engine(p.def.engine, p.eng.rpm, p.throttle, p.def.red, p.eng.boost);
  SFX.screech(p.air || p.def.hover ? 0 : clamp((p.slip - 0.3) * 1.2, 0, 1));
  $('hPosN').textContent = '🪙' + rush.got; $('hPosOf').textContent = '';
  $('hTime').textContent = '⏱ ' + Math.max(0, Math.ceil(rush.time)) + 's';
  $('hCoins').textContent = 'Best: ' + save.best;
  $('nitroFill').style.width = (p.nitro / p.st.nitroMax * 100) + '%';
  drawTacho(p);
  updateCam(p, dt);
  if (rush.time <= 0) showResults();
}
function resetCar(){
  if (!player) return;
  if (race) { placeOnTrack(player, race.t, player.idx, 0); }
  else { player.speed = 0; player.side = 0; player.y = 0; player.vy = 0; }
}

// ---------- camera ----------
function updateCam(o, dt, snap){
  const fx = Math.sin(o.head), fz = Math.cos(o.head);
  const big = o.def.cam || 1;
  const P = [[6.2, 2.7], [12, 7], [3.0, 1.35]][camMode];
  const des = _v.set(o.x - fx * P[0] * big, o.y + P[1] * big, o.z - fz * P[0] * big);
  des.x = clamp(des.x, -ROOM + 1.5, ROOM - 1.5); des.z = clamp(des.z, -ROOM + 1.5, ROOM - 1.5);
  if (snap) camPos.copy(des); else camPos.lerp(des, 1 - Math.exp(-((camMode === 2 ? 14 : 5.5) + Math.abs(o.speed) * 0.15) * dt));
  // never poke the camera up through the bed or desk when the car is underneath
  for (const c of ceilings) if (camPos.x > c.x0 - 2 && camPos.x < c.x1 + 2 && camPos.z > c.z0 - 2 && camPos.z < c.z1 + 2 && o.y < c.y && camPos.y > c.y - 0.8) camPos.y = c.y - 0.8;
  camera.position.copy(camPos);
  aimSun(o.x + fx * 10, o.z + fz * 10, 32);
  if (camShake > 0) { camera.position.x += (Math.random() - 0.5) * camShake; camera.position.y += (Math.random() - 0.5) * camShake; camShake = Math.max(0, camShake - dt * 1.5); }
  camLook.set(o.x + fx * 3, o.y + 1.0 * big, o.z + fz * 3);
  camera.lookAt(camLook);
  const tf = 62 + clamp(Math.abs(o.speed) / 40, 0, 1) * 10 + clamp((Math.abs(o.speed) - 45) / 90, 0, 1) * 20 + (o.boost ? 8 : 0);
  camera.fov += (tf - camera.fov) * Math.min(1, dt * 4 + (snap ? 1 : 0)); camera.updateProjectionMatrix();
}

// ---------- HUD ----------
function hudRace(dt){
  const r = race, p = player, t = r.t;
  $('hPosN').textContent = r.place; $('hPosOf').textContent = '/4';
  $('hLap').textContent = 'LAP ' + clamp(p.lap + 1, 1, r.laps) + '/' + r.laps;
  $('hTime').textContent = fmtTime(r.time);
  $('hCoins').textContent = '🪙 +' + r.coins;
  $('nitroFill').style.width = (p.nitro / p.st.nitroMax * 100) + '%';
  $('wrong').classList.toggle('hidden', r.wrong < 0.8);
  r.boardT -= dt;
  if (r.boardT <= 0) {
    r.boardT = 0.2;
    const list = r.cars.slice().sort((a, b) => b.s - a.s);
    $('board').innerHTML = list.map(c => `<li class="${c === p ? 'me' : ''}"><i style="background:${hexStr(c === p ? paintOf(p.def) : c.color)}"></i>${c === p ? 'You' : c.name}<span>${c.def.name}</span></li>`).join('');
  }
  const g = $('mini').getContext('2d'), f = t.mapF[190];
  g.clearRect(0, 0, 190, 190); g.drawImage(t.mini, 0, 0);
  for (const c of r.cars) {
    const [x, y] = f(c.x, c.z), me = c === p;
    g.fillStyle = hexStr(me ? paintOf(p.def) : c.color); g.strokeStyle = me ? '#fff' : '#000'; g.lineWidth = 2;
    g.beginPath(); g.arc(x, y, me ? 6 : 4.5, 0, 7); g.fill(); g.stroke();
  }
  drawTacho(p);
}
function drawTacho(p){
  const c = $('tacho'), g = c.getContext('2d'), cx = 125, cy = 128, R = 98, e = p.eng, red = p.def.red;
  g.clearRect(0, 0, 250, 250);
  g.fillStyle = 'rgba(10,12,30,0.78)'; g.beginPath(); g.arc(cx, cy, R + 16, 0, 7); g.fill();
  g.strokeStyle = '#ffffff22'; g.lineWidth = 2; g.beginPath(); g.arc(cx, cy, R + 14, 0, 7); g.stroke();
  const maxK = Math.ceil(red / 1000) + 1, a0 = Math.PI * 0.75, a1 = Math.PI * 2.25, ang = v => a0 + clamp(v / (maxK * 1000), 0, 1) * (a1 - a0);
  g.strokeStyle = '#ff3b4d'; g.lineWidth = 9; g.beginPath(); g.arc(cx, cy, R - 6, ang(red), a1); g.stroke();
  g.font = 'bold 15px "Baloo 2", sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle';
  const step = Math.max(1, Math.ceil(maxK / 9));
  for (let k = 0; k <= maxK; k++) {
    const a = ang(k * 1000), major = k % step === 0;
    g.strokeStyle = k * 1000 >= red ? '#ff5d6c' : '#fff'; g.lineWidth = major ? 3 : 1.5;
    g.beginPath(); g.moveTo(cx + Math.cos(a) * (R - 2), cy + Math.sin(a) * (R - 2)); g.lineTo(cx + Math.cos(a) * (R - (major ? 16 : 10)), cy + Math.sin(a) * (R - (major ? 16 : 10))); g.stroke();
    if (major) { g.fillStyle = '#fffd'; g.fillText(k, cx + Math.cos(a) * (R - 30), cy + Math.sin(a) * (R - 30)); }
  }
  const na = ang(e.rpm);
  g.strokeStyle = '#ffb627'; g.lineWidth = 4; g.lineCap = 'round';
  g.beginPath(); g.moveTo(cx - Math.cos(na) * 14, cy - Math.sin(na) * 14); g.lineTo(cx + Math.cos(na) * (R - 12), cy + Math.sin(na) * (R - 12)); g.stroke();
  g.fillStyle = '#ffb627'; g.beginPath(); g.arc(cx, cy, 7, 0, 7); g.fill();
  // shift lights
  const rn = e.rpm / red, flash = rn > 0.95 && Math.floor(gTime * 14) % 2;
  for (let i = 0; i < 9; i++) {
    const on = rn > 0.6 + i * 0.04, col = flash ? '#3a9bff' : i < 4 ? '#4cd37a' : i < 7 ? '#ffb627' : '#ff3b4d';
    g.fillStyle = on ? col : '#ffffff18'; g.beginPath(); g.arc(cx - 64 + i * 16, cy - 46, 5, 0, 7); g.fill();
  }
  g.fillStyle = '#fff'; g.font = 'bold 46px "Baloo 2", sans-serif';
  g.fillText(p.def.engine === 'warp' ? 'W' : p.def.engine === 'jet' ? 'J' : p.def.gears === 1 ? 'D' : (p.speed < -0.5 ? 'R' : e.gear), cx, cy + 4);
  g.font = 'bold 26px "Baloo 2", sans-serif'; g.fillText(Math.round(Math.abs(p.speed) * kmhOf(p.def)).toLocaleString(), cx, cy + 46);
  g.font = '600 12px "Baloo 2", sans-serif'; g.fillStyle = '#fffa'; g.fillText('KM/H', cx, cy + 66); g.fillText('×1000 RPM', cx, cy + 82);
  if (hasTurbo(p.def)) { g.fillStyle = '#29d3ff'; g.fillRect(cx - 30, cy + 92, 60 * e.boost, 5); }
}

// ---------- results ----------
function showResults(){
  const box = $('resBox');
  if (race) {
    const r = race, T = r.tier, place = r.place;
    const reward = Math.round([150, 90, 50, 20][place - 1] * T.mult), total = reward + r.coins;
    save.coins += total;
    const res = save.res[T.id] = save.res[T.id] || {};
    if (!res[r.t.id] || place < res[r.t.id]) res[r.t.id] = place;
    const key = T.id + '-' + r.t.id, newBest = !save.times[key] || r.time < save.times[key];
    if (newBest) save.times[key] = r.time;
    let unlock = '';
    if (r.ti === save.tiers - 1 && r.ti < TIERS.length - 1 && tierWins(r.ti) >= 2) {
      save.tiers++;
      const nt = TIERS[save.tiers - 1], bonus = Math.round(200 * nt.mult);
      save.coins += bonus; ui.tier = save.tiers - 1;
      const newCars = CARS.filter(c => c.tier === save.tiers - 1).map(c => c.name).join(', ');
      unlock = `<div class="unlock">🎉 ${nt.id} Tier unlocked! +🪙${bonus} bonus<br><small>New cars to buy: ${newCars}</small></div>`;
    } else if (r.ti === save.tiers - 1 && r.ti < TIERS.length - 1) {
      unlock = `<div class="unlock" style="background:#ffb62718;border-color:#ffb62770">Wins in ${T.id} tier: ${tierWins(r.ti)}/2 to unlock ${TIERS[r.ti + 1].id} tier</div>`;
    }
    persist();
    const col = ['#ffd166', '#d9dde8', '#e0a96d', '#9aa5b8'][place - 1];
    box.innerHTML = `<div class="place" style="color:${col}">${ORD[place - 1]}</div><h2>${r.t.name} · <span style="color:${T.color}">${T.id} Tier</span></h2>
      <div class="rrow"><span>Race time</span><b>${fmtTime(r.time)}${newBest ? ' ⭐' : ''}</b></div>
      <div class="rrow"><span>Best lap</span><b>${r.bestLap ? fmtTime(r.bestLap) : '-'}</b></div>
      <div class="rrow"><span>Finish reward</span><b>🪙 ${reward}</b></div>
      <div class="rrow"><span>Track coins</span><b>🪙 ${r.coins}</b></div>
      <div class="rrow"><span>Total</span><b>🪙 ${total}</b></div>${unlock}
      <button id="rAgain">Race again</button><button id="rMenu" class="alt">Back to menu</button>`;
    const tr = r.t, ti = r.ti;
    $('rAgain').onclick = () => startRace(tr, ti);
  } else if (rush) {
    save.coins += rush.got; const nb = rush.got > save.best; save.best = Math.max(save.best, rush.got); persist();
    box.innerHTML = `<div class="place" style="color:var(--accent)">🪙 ${rush.got}</div><h2>Time's up!${nb ? ' New best!' : ''}</h2>
      <div class="rrow"><span>Coins banked</span><b>🪙 ${rush.got}</b></div><div class="rrow"><span>Bank</span><b>🪙 ${save.coins}</b></div>
      <button id="rAgain">Play again</button><button id="rMenu" class="alt">Back to menu</button>`;
    $('rAgain').onclick = () => startRush();
  }
  $('rMenu').onclick = () => toMenu();
  mode = 'results';
  SFX.stopEngines();
  $('hud').classList.add('hidden'); $('results').classList.remove('hidden');
}
let orbitA = 0;
function orbitResults(dt){
  if (!player) return;
  orbitA += dt * 0.35;
  if (race) { for (const a of race.ais) { driveAI(a, dt); poseAndAnimate(a, dt); } }
  player.speed *= Math.exp(-2 * dt);
  poseAndAnimate(player, dt);
  const under = ceilings.some(c => player.x > c.x0 - 3 && player.x < c.x1 + 3 && player.z > c.z0 - 3 && player.z < c.z1 + 3);
  camera.position.set(player.x + Math.sin(orbitA) * 7, player.y + (under ? 1.8 : 3), player.z + Math.cos(orbitA) * 7);
  aimSun(player.x, player.z, 16);
  camera.lookAt(player.x, player.y + 0.8, player.z);
}
