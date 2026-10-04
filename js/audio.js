// ============ SOUND: synthesised engines, pops, screech, crashes ============
const SFX = (() => {
  let ctx = null, master = null, noise = null, muted = false;
  try { muted = localStorage.getItem('toyRacersMute') === '1'; } catch (e) {}
  const ENG = {
    v8:     {cyl: 8,  sub: 0.9, harm: 0.35, cut: 500,  lope: 0.55, vol: 0.5},
    v8big:  {cyl: 8,  sub: 1.0, harm: 0.3,  cut: 420,  lope: 0.7,  vol: 0.55},
    flat4:  {cyl: 4,  sub: 0.4, harm: 0.7,  cut: 900,  lope: 0.25, vol: 0.4},
    i4:     {cyl: 4,  sub: 0.5, harm: 0.4,  cut: 650,  lope: 0.1,  vol: 0.35},
    i6:     {cyl: 6,  sub: 0.6, harm: 0.5,  cut: 750,  lope: 0.2,  vol: 0.45},
    turbo4: {cyl: 4,  sub: 0.5, harm: 0.6,  cut: 900,  lope: 0.15, vol: 0.42, turbo: true},
    v10:    {cyl: 10, sub: 0.3, harm: 0.9,  cut: 1600, lope: 0.0,  vol: 0.36},
    v12:    {cyl: 12, sub: 0.4, harm: 0.8,  cut: 1300, lope: 0.0,  vol: 0.38},
    jet:    {jet: true, vol: 0.5},
    warp:   {jet: true, vol: 0.55},
  };
  function init(){
    if (ctx) { if (ctx.state === 'suspended') ctx.resume(); return; }
    try {
      ctx = new (window.AudioContext || window.webkitAudioContext)();
      master = ctx.createGain(); master.gain.value = muted ? 0 : 0.55; master.connect(ctx.destination);
      const len = ctx.sampleRate * 2, buf = ctx.createBuffer(1, len, ctx.sampleRate), d = buf.getChannelData(0);
      for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
      noise = buf;
    } catch (e) { ctx = null; }
  }
  const noiseSrc = () => { const s = ctx.createBufferSource(); s.buffer = noise; s.loop = true; s.start(ctx.currentTime, Math.random()); return s; };
  const shaper = () => { const w = ctx.createWaveShaper(), c = new Float32Array(256); for (let i = 0; i < 256; i++) { const x = i / 128 - 1; c[i] = Math.tanh(x * 2.2); } w.curve = c; return w; };

  // One engine "voice": three oscillators at the firing frequency + intake noise + (turbo whistle)
  function voice(type){
    const P = ENG[type] || ENG.v8, v = {P, out: ctx.createGain()};
    v.out.gain.value = 0; v.out.connect(master);
    if (P.jet) {
      const n = noiseSrc(), lp = ctx.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 600;
      const bp = ctx.createBiquadFilter(); bp.type = 'bandpass'; bp.frequency.value = 2500; bp.Q.value = 2;
      const g1 = ctx.createGain(), g2 = ctx.createGain(); g1.gain.value = 1; g2.gain.value = 0.25;
      n.connect(lp).connect(g1).connect(v.out); n.connect(bp).connect(g2).connect(v.out);
      const wh = ctx.createOscillator(); wh.type = 'sine'; const wg = ctx.createGain(); wg.gain.value = 0.06; wh.connect(wg).connect(v.out); wh.start();
      Object.assign(v, {lp, bp, wh, g2});
      return v;
    }
    const mix = ctx.createGain(), dist = shaper(), lp = ctx.createBiquadFilter(), am = ctx.createGain();
    lp.type = 'lowpass'; lp.Q.value = 1.2;
    const o1 = ctx.createOscillator(), o2 = ctx.createOscillator(), o3 = ctx.createOscillator();
    o1.type = 'sawtooth'; o2.type = 'square'; o3.type = 'sawtooth'; o3.detune.value = 8;
    const g1 = ctx.createGain(), g2 = ctx.createGain(), g3 = ctx.createGain();
    g1.gain.value = 0.5; g2.gain.value = 0.3 * P.sub; g3.gain.value = 0.25 * P.harm;
    o1.connect(g1).connect(mix); o2.connect(g2).connect(mix); o3.connect(g3).connect(mix);
    mix.connect(dist).connect(lp).connect(am).connect(v.out);
    // lumpy-cam lope: the gain wobbles at idle
    const lfo = ctx.createOscillator(), lfoG = ctx.createGain(); lfo.frequency.value = 6; lfoG.gain.value = 0; lfo.connect(lfoG).connect(am.gain); lfo.start();
    am.gain.value = 1;
    const n = noiseSrc(), nb = ctx.createBiquadFilter(), ng = ctx.createGain(); nb.type = 'bandpass'; nb.Q.value = 1.5; ng.gain.value = 0;
    n.connect(nb).connect(ng).connect(v.out);
    [o1, o2, o3].forEach(o => o.start());
    Object.assign(v, {o1, o2, o3, lp, lfo, lfoG, nb, ng});
    if (P.turbo) { const t = ctx.createOscillator(); t.type = 'sine'; const tg = ctx.createGain(); tg.gain.value = 0; t.connect(tg).connect(v.out); t.start(); v.tw = t; v.tg = tg; }
    return v;
  }
  function setVoice(v, rpm, throttle, red, vol, boost = 0){
    if (!v) return;
    const now = ctx.currentTime, P = v.P, rn = clamp(rpm / red, 0, 1.1);
    v.out.gain.setTargetAtTime(vol * P.vol * (0.4 + throttle * 0.35 + rn * 0.35), now, 0.04);
    if (P.jet) {
      v.lp.frequency.setTargetAtTime(300 + rn * 2500, now, 0.08);
      v.bp.frequency.setTargetAtTime(1500 + rn * 4000, now, 0.08);
      v.wh.frequency.setTargetAtTime(400 + rn * 3000, now, 0.08);
      v.g2.gain.setTargetAtTime(0.15 + throttle * 0.4, now, 0.05);
      return;
    }
    const f = rpm / 60 * P.cyl / 2;
    v.o1.frequency.setTargetAtTime(f, now, 0.012);
    v.o2.frequency.setTargetAtTime(f / 2, now, 0.012);
    v.o3.frequency.setTargetAtTime(f * 2, now, 0.012);
    v.lp.frequency.setTargetAtTime(P.cut + throttle * P.cut * 2.4 + rn * 1800, now, 0.03);
    v.lfo.frequency.setTargetAtTime(Math.max(3, f / 8), now, 0.05);
    v.lfoG.gain.setTargetAtTime(P.lope * Math.max(0, 1 - rn * 2.5) * 0.6, now, 0.05);
    v.nb.frequency.setTargetAtTime(400 + rn * 2400, now, 0.05);
    v.ng.gain.setTargetAtTime(throttle * rn * 0.12, now, 0.05);
    if (v.tw) { v.tw.frequency.setTargetAtTime(1800 + boost * 4500, now, 0.06); v.tg.gain.setTargetAtTime(boost * 0.05, now, 0.06); }
  }
  function kill(v){ if (!v) return; v.out.gain.setTargetAtTime(0, ctx.currentTime, 0.05); const o = v.out; setTimeout(() => { try { o.disconnect(); } catch (e) {} }, 400); }

  let player = null, playerType = null, ai = null, screech = null;
  function burst(freq, q, dur, vol, type = 'bandpass'){
    if (!ctx) return;
    const s = ctx.createBufferSource(); s.buffer = noise;
    const f = ctx.createBiquadFilter(); f.type = type; f.frequency.value = freq; f.Q.value = q;
    const g = ctx.createGain(), t = ctx.currentTime;
    g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(0.001, t + dur);
    s.connect(f).connect(g).connect(master); s.start(t, Math.random()); s.stop(t + dur + 0.05);
  }
  function tone(freq, dur, type = 'square', vol = 0.12, slide = 0){
    if (!ctx) return;
    const o = ctx.createOscillator(), g = ctx.createGain(), t = ctx.currentTime;
    o.type = type; o.frequency.setValueAtTime(freq, t); if (slide) o.frequency.exponentialRampToValueAtTime(Math.max(20, freq * slide), t + dur);
    g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(0.001, t + dur);
    o.connect(g).connect(master); o.start(t); o.stop(t + dur + 0.02);
  }
  return {
    init,
    get muted(){ return muted; },
    toggleMute(){ muted = !muted; try { localStorage.setItem('toyRacersMute', muted ? '1' : '0'); } catch (e) {} if (master) master.gain.setTargetAtTime(muted ? 0 : 0.55, ctx.currentTime, 0.05); return muted; },
    engine(type, rpm, throttle, red, boost){
      if (!ctx) return;
      if (playerType !== type) { kill(player); player = voice(type); playerType = type; }
      setVoice(player, rpm, throttle, red, 1, boost);
    },
    aiEngine(type, rpm, red, vol){
      if (!ctx) return;
      if (!ai || ai.type !== type) { kill(ai && ai.v); ai = {type, v: voice(type)}; }
      setVoice(ai.v, rpm, 0.6, red, vol);
    },
    stopEngines(){ if (!ctx) return; kill(player); player = null; playerType = null; if (ai) kill(ai.v); ai = null; this.screech(0); },
    screech(level){
      if (!ctx) return;
      if (!screech) { const n = noiseSrc(), bp = ctx.createBiquadFilter(), g = ctx.createGain(); bp.type = 'bandpass'; bp.frequency.value = 2300; bp.Q.value = 7; g.gain.value = 0; n.connect(bp).connect(g).connect(master); screech = {g, bp}; }
      screech.g.gain.setTargetAtTime(clamp(level, 0, 1) * 0.22, ctx.currentTime, 0.05);
      screech.bp.frequency.setTargetAtTime(2000 + level * 600, ctx.currentTime, 0.1);
    },
    pop(big){ burst(big ? 700 : 1100, 1.4, big ? 0.12 : 0.07, big ? 0.9 : 0.5); tone(90, 0.08, 'sine', big ? 0.5 : 0.25, 0.5); },
    blowoff(){ burst(3500, 0.8, 0.35, 0.18, 'highpass'); },
    shift(){ tone(220, 0.03, 'square', 0.04); },
    thud(power){ tone(110, 0.25, 'sine', clamp(power, 0.1, 1) * 0.6, 0.4); burst(400, 0.8, 0.15, clamp(power, 0.1, 1) * 0.4); },
    coin(){ tone(988, 0.07, 'square', 0.08); setTimeout(() => tone(1319, 0.12, 'square', 0.08), 70); },
    beep(hi){ tone(hi ? 880 : 440, hi ? 0.5 : 0.18, 'square', 0.12); },
    land(){ tone(70, 0.18, 'sine', 0.4, 0.5); },
    cheer(){ burst(1200, 0.4, 1.4, 0.25); },
  };
})();
