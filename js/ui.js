// ============ MENUS, GARAGE SHOWROOM, INPUT, MAIN LOOP ============
const ui = {tab: 'career', tier: save.tiers - 1, view: save.sel};
const show = {car: null, id: null, paint: null, az: 0.75, el: 0.3, dist: 0, drag: false, rev: false, eng: null, x: 0, y: 0, voiced: false};

function renderMenu(){
  $('bank').textContent = '🪙 ' + save.coins;
  $('creatorBadge').classList.toggle('hidden', !creator);
  document.querySelectorAll('.tab').forEach(b => b.classList.toggle('on', b.dataset.tab === ui.tab));
  ['career', 'garage', 'rush', 'settings'].forEach(t => $('tab-' + t).classList.toggle('hidden', ui.tab !== t));
  if (ui.tab === 'career') renderCareer(); else if (ui.tab === 'garage') renderGarage(); else if (ui.tab === 'rush') renderRush(); else renderSettings();
  const v = carById(ui.view);
  $('showName').textContent = v.name;
}
document.querySelectorAll('.tab').forEach(b => b.onclick = () => { ui.tab = b.dataset.tab; if (ui.tab !== 'garage') ui.view = save.sel; renderMenu(); });

function renderCareer(){
  const el = $('tab-career'), rk = TIERS[save.tiers - 1];
  let h = `<div class="rank">Driver rank: <b style="color:${rk.color}">${rk.id} Tier · ${rk.name}</b></div><div class="tiers">`;
  TIERS.forEach((t, i) => {
    const locked = !tierOpen(i), m = tierMastery(i);
    h += `<button class="tier ${ui.tier === i ? 'on' : ''} ${locked ? 'locked' : ''}" data-ti="${i}" style="--tc:${t.color}"><span class="tl">${locked ? '🔒' : t.id}</span><span class="tn">${t.name}</span><span class="tm"><i style="width:${m * 100}%"></i></span></button>`;
  });
  h += '</div>';
  const T = TIERS[ui.tier], car = carById(save.sel), pr = PR(stats(car));
  if (!tierOpen(ui.tier)) {
    h += `<p class="lockmsg">🔒 Win 2 different races in <b style="color:${TIERS[ui.tier - 1].color}">${TIERS[ui.tier - 1].id} Tier</b> to unlock ${T.id} Tier.</p>`;
  } else {
    h += `<div class="tinfo" style="--tc:${T.color}"><div><b style="font-size:20px">${T.id} Tier — ${T.name}</b><br><small>Rewards ×${T.mult} · Mastery ${Math.round(tierMastery(ui.tier) * 100)}%</small></div>
      <div class="pr ${pr < T.pr ? 'low' : ''}">${car.name} PR <b>${pr}</b><br><small>Recommended ${T.pr}+</small></div></div>`;
    if (ui.tier === save.tiers - 1 && ui.tier < TIERS.length - 1) h += `<p class="hintline">🏆 Wins here: ${tierWins(ui.tier)}/2 — win 2 different tracks to unlock <b style="color:${TIERS[ui.tier + 1].color}">${TIERS[ui.tier + 1].id} Tier</b> and its cars</p>`;
    h += '<div class="tracks">';
    tierTracks(ui.tier).forEach(tr => {
      const p = tierRes(ui.tier)[tr.id], bt = save.times[T.id + '-' + tr.id];
      h += `<div class="track"><canvas data-map="${tr.id}" width="240" height="140"></canvas><div class="trow"><b>${tr.name}</b><span class="medal">${p ? MEDAL[p - 1] : ''}</span></div>
        <small>${tr.desc}</small><small>${lapsFor(tr)} laps${tr.maxH > 2 ? ' · hills' : ''}${tr.ramp ? ' · jump' : ''}${tr.hasBridge ? ' · bridge' : ''}${bt ? ' · best ' + fmtTime(bt) : ''}</small><button data-race="${tr.id}">Race ▶</button></div>`;
    });
    h += '</div>';
  }
  el.innerHTML = h;
  el.querySelectorAll('[data-ti]').forEach(b => b.onclick = () => { ui.tier = +b.dataset.ti; renderMenu(); });
  el.querySelectorAll('[data-race]').forEach(b => b.onclick = () => startRace(TRACKS.find(t => t.id === b.dataset.race), ui.tier));
  el.querySelectorAll('[data-map]').forEach(c => drawTrackMap(c.getContext('2d'), TRACKS.find(t => t.id === c.dataset.map), 240, 140, 14));
}

function renderGarage(){
  const el = $('tab-garage'), v = carById(ui.view), owned = owns(v.id), unlocked = carUnlocked(v);
  // tier tabs keep the list short: only the viewed car's tier is shown
  const list = ti => CARS.filter(c => c.tier === ti && (!c.creatorOnly || creator));
  let h = '<div class="tiers gtiers">' + TIERS.map((t, i) => `<button class="tier ${v.tier === i ? 'on' : ''} ${tierOpen(i) ? '' : 'locked'}" data-gt="${i}" style="--tc:${t.color}"><span class="tl">${t.id}</span><span class="tn">${list(i).filter(c => owns(c.id)).length}/${list(i).length} cars</span></button>`).join('') + '</div><div class="cars">';
  list(v.tier).forEach(c => {
    const o = owns(c.id), ul = carUnlocked(c);
    h += `<div class="car ${ui.view === c.id ? 'view' : ''} ${save.sel === c.id ? 'sel' : ''} ${!ul ? 'locked' : ''}" data-car="${c.id}">
      <div class="swatch" style="background:${hexStr(paintOf(c))}"></div><b>${c.name}</b>
      <div class="cmeta"><span class="tb" style="--tc:${TIERS[c.tier].color}">${TIERS[c.tier].id}</span>PR ${PR(stats(c))}</div>
      <small>${o ? (save.sel === c.id ? '✔ Driving' : creator && !save.owned.includes(c.id) && !c.creatorOnly ? '🪙 ' + c.price + ' · 🛠 Free' : 'Owned') : ul ? '🪙 ' + c.price : '🔒 ' + TIERS[c.tier].id + ' Tier'}</small></div>`;
  });
  h += '</div>';
  const s = stats(v), mx = {top: v.top * 1.5, accel: v.accel * 1.55, grip: v.grip * 1.45};
  const bar = (label, val, max, cap, txt) => `<div class="stat"><span>${label}</span><div class="bar"><u style="width:${Math.min(100, max / cap * 100)}%"></u><i style="width:${Math.min(100, val / cap * 100)}%"></i></div><b>${txt}</b></div>`;
  const both = creator && !v.creatorOnly && !save.owned.includes(v.id), earned = save.tiers > v.tier;
  h += `<div class="detail"><div class="row"><h2>${v.name}</h2>${both ? `<div class="buy2"><button id="buy" ${save.coins < v.price || !earned ? 'disabled' : ''} title="${earned ? 'Pay with coins you earned' : 'Win your way to ' + TIERS[v.tier].id + ' Tier first'}">Buy 🪙 ${v.price}${earned ? '' : ' 🔒'}</button>${save.sel === v.id ? '<span class="tag">🛠 Driving free</span>' : '<button id="drive" class="alt">🛠 Free</button>'}</div>` : owned ? (save.sel === v.id ? '<span class="tag">✔ Driving</span>' : '<button id="drive">Drive this</button>') :
    unlocked ? `<button id="buy" ${save.coins < v.price ? 'disabled' : ''}>Buy 🪙 ${v.price}</button>` : `<span class="tag">🔒 Unlocks in ${TIERS[v.tier].id} Tier</span>`}</div>
    <p class="desc">${v.desc}</p>
    ${bar('Top speed', s.top, mx.top, 70, Math.round(s.top * kmhOf(v)).toLocaleString())}
    ${bar('Acceleration', s.accel, mx.accel, 52, s.accel.toFixed(0))}
    ${bar('Handling', s.grip, mx.grip, 5.3, s.grip.toFixed(1))}
    ${bar('Nitro', s.nitroMax, 5, 5, s.nitroMax.toFixed(1) + 's')}
    ${bar('Toughness', s.crashKeep, 0.9, 0.9, Math.round(s.crashKeep * 100) + '%')}
    ${bar('Traction', s.traction, 1.75, 1.75, '+' + Math.round((s.traction - 1) * 100) + '%')}
    <div class="stat"><span>Engine</span><small>${v.engName || ({flat4: 'Air-cooled flat-4', i4: 'Inline-4', v8: 'Supercharged V8', v8big: 'Blown big-block V8', turbo4: 'Turbo inline-4', v10: 'V10', i6: 'Straight-6', v12: 'V12', jet: 'Twin jet turbines', warp: 'Twin plasma thrusters',
      diesel: 'Turbo-diesel straight-6', kart: '2-stroke single', rotary: 'Turbo twin-rotor', v8fp: 'Flat-plane V8', i8: 'Supercharged straight-8', v6t: 'Hybrid twin-turbo V6', ev: 'Twin electric motors', fuel: 'Blown nitro Hemi V8', hover: 'Twin hover fans'})[v.engine]} · ${v.hover ? 'no wheels' : v.gears === 1 ? 'direct drive' : v.gears + '-speed'} · ${(v.red / 1000).toFixed(1)}k ${v.engine === 'ev' ? 'max rpm' : 'redline'}</small></div>`;
  if (owned) {
    h += `<div class="sub">Paint</div><div class="paints">${[v.color, ...PAINTS.filter(p => p !== v.color)].map(p => `<button class="paint ${paintOf(v) === p ? 'on' : ''}" data-paint="${p}" style="background:${hexStr(p)}"></button>`).join('')}</div>`;
    h += `<div class="sub">Upgrades</div>`;
    PARTS.forEach(p => {
      const lv = lvl(v.id, p.id), cost = upCost(v, lv);
      h += `<div class="part"><span class="ic">${p.icon}</span><div><b>${p.name}</b><br><small>${p.desc}</small></div>
        <div class="pips">${Array.from({length: MAXLV}, (_, i) => `<span class="${i < lv ? 'on' : ''}"></span>`).join('')}</div>
        ${lv >= MAXLV ? '<button disabled>MAX</button>' : `<div class="buy2"><button data-up="${p.id}" data-pay="1" ${save.coins < cost ? 'disabled' : ''}>🪙 ${cost}</button>${creator ? `<button data-up="${p.id}" class="alt">🛠 Free</button>` : ''}</div>`}</div>`;
    });
  }
  h += '</div>';
  el.innerHTML = h;
  el.querySelectorAll('[data-gt]').forEach(b => b.onclick = () => { const ti = +b.dataset.gt; if (ti === v.tier) return; const c = list(ti).find(c => c.id === save.sel) || list(ti)[0]; ui.view = c.id; renderMenu(); });
  el.querySelectorAll('[data-car]').forEach(d => d.onclick = () => { ui.view = d.dataset.car; if (owns(ui.view)) { save.sel = ui.view; persist(); } renderMenu(); });
  if ($('buy')) $('buy').onclick = () => { if (save.coins < v.price) return; save.coins -= v.price; save.owned.push(v.id); save.sel = v.id; persist(); SFX.init(); SFX.coin(); renderMenu(); };
  if ($('drive')) $('drive').onclick = () => { save.sel = v.id; persist(); renderMenu(); };
  el.querySelectorAll('[data-paint]').forEach(b => b.onclick = () => { save.paint[v.id] = +b.dataset.paint; persist(); renderMenu(); });
  el.querySelectorAll('[data-up]').forEach(b => b.onclick = () => {
    const pid = b.dataset.up, lv = lvl(v.id, pid), cost = upCost(v, lv), pay = !!b.dataset.pay;
    if (pay) { if (save.coins < cost) return; save.coins -= cost; }      // the hard-work way: spend earned coins
    else if (!creator) return;                                         // free is for creators only
    save.up[v.id] = save.up[v.id] || {}; save.up[v.id][pid] = lv + 1; persist();
    SFX.init(); SFX.coin(); renderMenu();
  });
}
function renderSettings(){
  const opts = [['auto', 'Auto'], ...QORDER.map(k => [k, QUALITY[k].label])];
  $('tab-settings').innerHTML = `<div class="rushbox"><h2>⚙️ Graphics</h2>
    <p>Auto starts on High and steps down by itself if your computer struggles. Ultra adds sharper shadows and full-resolution ambient occlusion.</p>
    <div class="qrow">${opts.map(([k, l]) => `<button class="qbtn ${gfx.mode === k ? 'on' : ''}" data-q="${k}">${l}</button>`).join('')}</div>
    <div class="fps">Now running: <b>${QUALITY[gfx.level].label}</b> · <span id="fpsNow">measuring…</span></div></div>
    <div class="rushbox" style="margin-top:10px"><h2>🏁 Made by</h2><p>darkultimateyt67 &amp; AAAMAQ (BiG MAQ Studio)</p></div>
    <div class="rushbox" style="margin-top:10px"><h2>🔊 Sound</h2><p>Engines, pops, tyres and crashes are all synthesised live.</p><button id="muteBtn" class="alt">${SFX.muted ? '🔇 Sound is off — turn on' : '🔊 Sound is on — turn off'}</button></div>`;
  $('tab-settings').querySelectorAll('[data-q]').forEach(b => b.onclick = () => { setQuality(b.dataset.q); renderMenu(); });
  $('muteBtn').onclick = () => { SFX.toggleMute(); renderMenu(); };
}
function renderRush(){
  $('tab-rush').innerHTML = `<div class="rushbox"><h2>🪙 Coin Rush</h2><p>Free-roam the whole room for 60 seconds and grab as many coins as you can. Great for earning upgrade money and learning how your car drifts.</p>
    <div class="rrow"><span>Your best</span><b>🪙 ${save.best}</b></div><div class="rrow"><span>Car</span><b>${carById(save.sel).name}</b></div><br><button id="rushGo">Start Coin Rush ▶</button></div>
    <div class="rushbox" style="margin-top:10px"><h2>Controls</h2><p>W/↑ throttle · S/↓ brake & reverse · A/D or ←/→ steer<br>Shift nitro · Space handbrake drift · R reset<br>C change camera · M mute · Esc pause<br>Tip: hold throttle on the start line to rev the engine.</p></div>`;
  $('rushGo').onclick = startRush;
}

// ---------- showroom: the selected car spins on the turntable ----------
function updateShowroom(dt){
  const def = carById(ui.view), paint = paintOf(def);
  if (show.id !== def.id || show.paint !== paint) {
    if (show.car) { turnTop.remove(show.car.root); disposeCar(show.car); }
    show.car = buildCar(def, paint); turnTop.add(show.car.root);
    show.id = def.id; show.paint = paint; show.eng = makeEngineState(def); show.def = def;
    show.dist = def.showD || 4.2 + def.l * 1.15;
  }
  const revKey = keys.KeyW || keys.ArrowUp;
  const thr = show.rev || revKey ? 1 : 0;
  if (!show.drag) turnTop.rotation.y += dt * 0.22;
  engineStep(show.eng, def, 0, thr, def.top, dt);
  if (show.voiced) { SFX.engine(def.engine, show.eng.rpm, thr, def.red, show.eng.boost); engineSFX(show, 1); }
  animateCar(show.car, {speed: 0, steer: Math.sin(gTime * 0.7) * 0.5, throttle: thr, brake: 0, rpm: show.eng.rpm, rpmN: show.eng.rpm / def.red, boost: false,
    aLong: 0, aLat: 0, air: false, bump: 0, backfire: show.eng.backfire}, dt);
  const ty = def.showY || 0.6, c = turntable.position;
  camera.position.set(c.x + Math.sin(show.az) * Math.cos(show.el) * show.dist, c.y + ty + Math.sin(show.el) * show.dist, c.z + Math.cos(show.az) * Math.cos(show.el) * show.dist);
  camera.lookAt(c.x, c.y + ty, c.z);
  aimSun(c.x, c.z, 9);
  if (camera.fov !== 45) { camera.fov = 45; camera.updateProjectionMatrix(); }
  if (innerWidth > 900) camera.setViewOffset(innerWidth, innerHeight, -innerWidth * 0.2, 0, innerWidth, innerHeight); else camera.clearViewOffset();
}
const cv = renderer.domElement;
cv.addEventListener('pointerdown', e => { if (mode !== 'menu') return; show.drag = true; show.x = e.clientX; show.y = e.clientY; cv.setPointerCapture(e.pointerId); });
cv.addEventListener('pointermove', e => {
  if (!show.drag) return;
  turnTop.rotation.y += (e.clientX - show.x) * 0.01;
  show.el = clamp(show.el + (e.clientY - show.y) * 0.005, 0.02, 1.2);
  show.x = e.clientX; show.y = e.clientY;
});
cv.addEventListener('pointerup', () => { show.drag = false; });
cv.addEventListener('wheel', e => { if (mode !== 'menu') return; show.dist = clamp(show.dist * (1 + Math.sign(e.deltaY) * 0.08), 2.5, 14); }, {passive: true});
const revBtn = $('revBtn');
const revOn = e => { e.preventDefault(); SFX.init(); show.voiced = true; show.rev = true; };
const revOff = () => { show.rev = false; };
revBtn.addEventListener('pointerdown', revOn); revBtn.addEventListener('pointerup', revOff); revBtn.addEventListener('pointerleave', revOff);

function toMenu(){
  cleanupRun();
  mode = 'menu';
  $('hud').classList.add('hidden'); $('results').classList.add('hidden'); $('pause').classList.add('hidden');
  $('menu').classList.remove('hidden');
  turntable.visible = true; show.voiced = false;
  ui.view = save.sel;
  renderMenu();
}
function pause(){ if (mode !== 'race' && mode !== 'rush') return; prevMode = mode; mode = 'paused'; SFX.stopEngines(); $('pause').classList.remove('hidden'); }
function resume(){ if (mode !== 'paused') return; mode = prevMode; $('pause').classList.add('hidden'); last = performance.now(); }
$('pResume').onclick = resume;
$('pRestart').onclick = () => { $('pause').classList.add('hidden'); if (prevMode === 'race' && race) startRace(race.t, race.ti); else startRush(); };
$('pQuit').onclick = toMenu;

addEventListener('keydown', e => {
  keys[e.code] = true;
  if (mode === 'race' || mode === 'rush') { if (['Space', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.code)) e.preventDefault(); }
  if (e.repeat) return;
  if (e.code === 'Escape') { if (mode === 'paused') resume(); else pause(); }
  if (e.code === 'KeyC') camMode = (camMode + 1) % 3;
  if (e.code === 'KeyM') SFX.toggleMute();
  if (e.code === 'KeyR' && (mode === 'race' || mode === 'rush')) resetCar();
  if (mode === 'menu' && (e.code === 'KeyW' || e.code === 'ArrowUp')) { SFX.init(); show.voiced = true; }
});
addEventListener('keyup', e => { keys[e.code] = false; });
// Secret word typed in the menu toggles Creator Mode on this browser (only its fingerprint is stored here).
let typed = '';
const fnv = str => { let h = 0x811c9dc5; for (const c of str) { h ^= c.charCodeAt(0); h = Math.imul(h, 0x01000193) >>> 0; } return h; };
addEventListener('keydown', e => {
  if (mode !== 'menu' || e.key.length !== 1) return;
  typed = (typed + e.key.toLowerCase()).slice(-7);
  if (fnv(typed) === 668295191) {
    typed = '';
    setCreator(!creator);
    if (!owns(save.sel)) { save.sel = 'buggy'; persist(); }
    ui.view = save.sel; renderMenu(); SFX.init(); SFX.coin();
    toast(creator ? '🛠 Creator Mode ON — all cars, tiers & upgrades unlocked' : 'Creator Mode OFF');
  }
});
function toast(msg){ const t = $('toast'); t.textContent = msg; t.classList.remove('show'); void t.offsetWidth; t.classList.add('show'); }
addEventListener('blur', () => { for (const k in keys) keys[k] = false; });

// ---------- main loop ----------
let last = performance.now();
function step(dt){
  gTime += dt;
  if (mode === 'race') updateRace(dt);
  else if (mode === 'rush') updateRush(dt);
  else if (mode === 'menu') updateShowroom(dt);
  else if (mode === 'results') orbitResults(dt);
  if (mode !== 'paused') { updatePFX(dt); updateRoom(dt); if (race) updateTrackFX(race.t, gTime); }
}
function frame(now){
  const dt = Math.min(0.05, (now - last) / 1000); last = now;
  step(dt);
  render();
  watchPerf(dt);
  fpsMeter(dt);
  requestAnimationFrame(frame);
}
const fpsM = {t: 0, n: 0};
function fpsMeter(dt){ fpsM.t += dt; fpsM.n++; if (fpsM.t > 1) { const el = $('fpsNow'); if (el) el.textContent = Math.round(fpsM.n / fpsM.t) + ' fps'; fpsM.t = 0; fpsM.n = 0; } }
function boot(){
  TRACKS.forEach(prepTrack);
  placeDecor(trackNear);
  finalizeRoom();
  // Reflections: a painted copy of this bedroom (wood floor, mint walls, white ceiling) with a
  // glowing window and ceiling lamp, so paint and chrome mirror the room they drive in.
  const envScene = new THREE.Scene();
  const envTex = canvasTex(1024, 512, (g, w, h) => {
    const gr = g.createLinearGradient(0, 0, 0, h);
    gr.addColorStop(0, '#fbf8f2'); gr.addColorStop(0.3, '#f2efe8'); gr.addColorStop(0.33, '#c9dfd2'); gr.addColorStop(0.49, '#b9d2c4');
    gr.addColorStop(0.5, '#f0ece4'); gr.addColorStop(0.515, '#9a6a44'); gr.addColorStop(1, '#5e3d26');
    g.fillStyle = gr; g.fillRect(0, 0, w, h);
    g.fillStyle = '#8d5a3b'; g.fillRect(w * 0.55, h * 0.36, w * 0.06, h * 0.14); g.fillRect(w * 0.08, h * 0.4, w * 0.1, h * 0.1);
  });
  const envM = new THREE.MeshBasicMaterial({map: envTex, side: THREE.BackSide}); envM.color.setScalar(0.3);
  envScene.add(new THREE.Mesh(new THREE.SphereGeometry(50, 48, 24), envM));
  const glow = (w, h, x, y, z, k) => { const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({color: new THREE.Color(1, 0.97, 0.9).multiplyScalar(k), side: THREE.DoubleSide})); m.position.set(x, y, z); m.lookAt(0, 0, 0); envScene.add(m); };
  glow(22, 16, 5, 12, -45, 2.2);     // window
  glow(10, 10, 0, 46, 0, 2.5);       // ceiling lamp
  glow(30, 10, 44, 20, 10, 0.5);     // soft bounce off the far wall
  scene.environment = pmrem.fromScene(envScene, 0.03).texture;
  toMenu();
  $('loading').classList.add('hidden');
  requestAnimationFrame(frame);
}
setTimeout(boot, 30);
