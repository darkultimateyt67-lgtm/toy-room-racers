// ============ GAME DATA ============
const TIERS = [
  {id:'D', name:'Rookie',    color:'#9aa5b8', top:19, lat:26, mult:1,   pr:95},
  {id:'C', name:'Club',      color:'#4cd37a', top:24, lat:34, mult:1.5, pr:120},
  {id:'B', name:'Pro',       color:'#3a9bff', top:29, lat:43, mult:2.2, pr:150},
  {id:'A', name:'Elite',     color:'#b15cff', top:34, lat:52, mult:3,   pr:180},
  {id:'S', name:'Superstar', color:'#ffb627', top:39, lat:61, mult:4,   pr:215},
  {id:'M', name:'Master',    color:'#ff4d6d', top:45, lat:70, mult:5.5, pr:245},
];

// engine: sound + visual engine type. gears: gearbox. idle/red: rpm range. turbo: whistle + boost gauge.
// cam: chase-camera size factor for big cars. showY/showD: showroom framing.
const CARS = [
  // ---- D · Rookie ----
  {id:'buggy',   name:'Sand Buggy',     tier:0, price:0,    color:0xff8c42, desc:'Air-cooled flat-four hanging out the back. Light and nimble.',
   top:22, accel:16, grip:2.6, mass:0.8, w:1.5, l:2.0, engine:'flat4', gears:4, idle:900,  red:6500,  cyl:4},
  {id:'van',     name:'Ice Cream Van',  tier:0, price:150,  color:0xf7c6d9, desc:'Slow and heavy, but shrugs off every bump.',
   top:20, accel:15, grip:2.4, mass:1.6, w:1.45,l:2.3, engine:'i4',    gears:4, idle:750,  red:5200,  cyl:4},
  {id:'mini',    name:'Pocket Racer',   tier:0, price:250,  color:0x3fb8af, desc:'Tiny bubble car with its engine lid propped open. Watch the fan belt whirr.',
   top:22, accel:17, grip:2.75,mass:0.75,w:1.35,l:2.0, engine:'i4',    gears:4, idle:900,  red:7200,  cyl:4},
  {id:'muscle',  name:'Muscle Coupe',   tier:0, price:350,  color:0xd62839, desc:'Supercharged V8 bursting through the hood. Watch the belt spin.',
   top:27, accel:18, grip:2.2, mass:1.1, w:1.45,l:2.5, engine:'v8',    gears:4, idle:750,  red:6800,  cyl:8},
  {id:'tow',     name:'Tow Truck',      tier:0, price:450,  color:0xffb000, desc:'Spinning beacons, a swinging hook and a smoke-stack flapper. Bulldozes through crashes.',
   top:25, accel:17, grip:2.4, mass:1.8, w:1.55,l:2.6, engine:'diesel',gears:5, idle:650,  red:4200,  cyl:6, turbo:true, cam:1.15},
  // ---- C · Club ----
  {id:'monster', name:'Monster Truck',  tier:1, price:600,  color:0x2a9d8f, desc:'Giant tyres, long-travel shocks, zoomie headers that spit fire.',
   top:25, accel:20, grip:2.3, mass:1.7, w:2.3, l:2.4, engine:'v8big', gears:3, idle:700,  red:6000,  cyl:8, cam:1.45, showY:1.3, showD:8.6},
  {id:'kart',    name:'Go-Kart',        tier:1, price:700,  color:0x8ac926, desc:'Two-stroke single screaming next to your elbow. Chain drive, no suspension, pure grip.',
   top:25, accel:21, grip:3.1, mass:0.6, w:1.4, l:1.75,engine:'kart',  gears:1, idle:2200, red:14500, cyl:1},
  {id:'police',  name:'Police Cruiser', tier:1, price:850,  color:0x1d3557, desc:'Interceptor V8, strobing light bar and a push bar.',
   top:29, accel:19, grip:2.6, mass:1.2, w:1.5, l:2.5, engine:'v8',    gears:5, idle:700,  red:6200,  cyl:8},
  {id:'fire',    name:'Fire Engine',    tier:1, price:950,  color:0xd7191f, desc:'Ladder on the roof, flashing lights and a swinging brass bell. Nothing pushes it around.',
   top:28, accel:19, grip:2.5, mass:2.1, w:1.65,l:3.05,engine:'diesel',gears:5, idle:600,  red:4000,  cyl:6, turbo:true, cam:1.25, showY:0.9},
  // ---- B · Pro ----
  {id:'rally',   name:'Rally Hatch',    tier:2, price:1200, color:0x06d6a0, desc:'Turbo four with anti-lag pops. Grips like glue.',
   top:30, accel:22, grip:3.0, mass:1.0, w:1.5, l:2.15,engine:'turbo4',gears:6, idle:950,  red:7800,  cyl:4},
  {id:'drift',   name:'Drift Coupe',    tier:2, price:1450, color:0xf4f1ea, desc:'Pop-up headlights, a turbo poking through the hood and a screamer pipe that spits flame.',
   top:31, accel:23, grip:2.9, mass:0.95,w:1.6, l:2.45,engine:'rotary',gears:6, idle:1100, red:9500,  cyl:2, turbo:true},
  {id:'f1',      name:'Formula Toy',    tier:2, price:1700, color:0x3a86ff, desc:'Screaming V10, wings everywhere, DRS flap opens on nitro.',
   top:34, accel:24, grip:3.3, mass:0.9, w:1.7, l:2.8, engine:'v10',   gears:7, idle:4000, red:15000, cyl:10},
  {id:'baja',    name:'Baja Trophy Truck',tier:2,price:1900,color:0xff6b35, desc:'Long-travel shocks at every corner and radiator fans whirring in the bed.',
   top:32, accel:24, grip:3.0, mass:1.5, w:1.9, l:2.9, engine:'v8',    gears:5, idle:800,  red:6800,  cyl:8, engName:'Big-block V8', cam:1.15},
  // ---- A · Elite ----
  {id:'roadster',name:'Hot Rod',        tier:3, price:2400, color:0xe9c46a, desc:'Chrome straight-six out in the open, whitewall tyres.',
   top:36, accel:26, grip:3.2, mass:1.0, w:1.6, l:2.6, engine:'i6',    gears:5, idle:800,  red:7000,  cyl:6},
  {id:'gt',      name:'GT Racer',       tier:3, price:2900, color:0x2b9348, desc:'Flat-plane V8 under a glass hood bubble, side pipes that spit fire, swan-neck wing.',
   top:37, accel:27, grip:3.35,mass:1.0, w:1.75,l:2.75,engine:'v8fp',  gears:6, idle:1100, red:9000,  cyl:8},
  {id:'arrow',   name:'Silver Arrow',   tier:3, price:3200, color:0xc9ccd1, desc:'1930s streamliner: supercharged straight-eight, wire wheels and leather straps.',
   top:39, accel:26, grip:3.1, mass:1.0, w:1.55,l:3.0, engine:'i8',    gears:4, idle:900,  red:8000,  cyl:8},
  // ---- S · Superstar ----
  {id:'hyper',   name:'Hyper Wedge',    tier:4, price:3500, color:0x9b5de5, desc:'V12 under a glass bubble and an active rear wing.',
   top:40, accel:29, grip:3.5, mass:1.0, w:1.7, l:2.75,engine:'v12',   gears:7, idle:1000, red:9200,  cyl:12},
  {id:'lmp',     name:'Le Mans Prototype',tier:4,price:4200,color:0xe63946, desc:'Hybrid twin-turbo V6, shark fin, lit-up number panels. Built for 24 hours flat out.',
   top:42, accel:31, grip:3.7, mass:0.95,w:1.8, l:3.1, engine:'v6t',   gears:7, idle:1300, red:10000, cyl:6, turbo:true},
  {id:'volt',    name:'Volt Hyper',     tier:4, price:4700, color:0x00b4d8, desc:'Silent electric thrust. Glowing motors under glass, light bars and a pop-up wing.',
   top:41, accel:36, grip:3.6, mass:1.15,w:1.8, l:2.8, engine:'ev',    gears:1, idle:0,    red:18000, cyl:0},
  // ---- M · Master ----
  {id:'rocket',  name:'Rocket Car',     tier:5, price:5000, color:0xc9ccd1, desc:'Twin jet turbines with wheels bolted on.',
   top:46, accel:33, grip:3.6, mass:1.1, w:1.6, l:3.2, engine:'jet',   gears:1, idle:3000, red:12000, cyl:0, cam:1.15},
  {id:'dragster',name:'Top Fuel Dragster',tier:5,price:5800,color:0xffd23f, desc:'Nitro Hemi with a giant blower and sixteen zoomie pipes. Huge rear slicks, wheelie bars.',
   top:50, accel:38, grip:3.2, mass:1.0, w:1.6, l:3.8, engine:'fuel',  gears:2, idle:1800, red:8400,  cyl:8, turnFall:36, cam:1.2},
  {id:'hover',   name:'Hover Racer',    tier:5, price:6800, color:0x7b2cbf, desc:'No wheels at all: four glowing hover pads and twin ducted fans.',
   top:48, accel:35, grip:4.0, mass:1.0, w:1.8, l:3.0, engine:'hover', gears:1, idle:2500, red:11000, cyl:0, hover:true},
  // Creator-only prototype: never sold, never driven by the AI, only exists in Creator Mode.
  {id:'warp',    name:'Warp Phantom',   tier:5, price:0, creatorOnly:true, color:0x12151f, desc:'Creator-only prototype. Twin plasma thrusters — the speedo breaks 70,000 km/h.',
   top:130, accel:95, grip:7.5, mass:1.2, w:1.75,l:3.0, engine:'warp',  gears:1, idle:4000, red:30000, cyl:0, kmh:560, turnFall:260},
];
const isJet = d => d.engine === 'jet' || d.engine === 'warp' || d.engine === 'hover';
const hasTurbo = d => d.engine === 'turbo4' || !!d.turbo;
const kmhOf = d => d.kmh || 4.5;

const PARTS = [
  {id:'engine', name:'Engine',  desc:'Top speed',            icon:'⚙️'},
  {id:'battery',name:'Battery', desc:'Acceleration',         icon:'🔋'},
  {id:'tires',  name:'Tyres',   desc:'Grip & turning',       icon:'🛞'},
  {id:'nitro',  name:'Nitro',   desc:'Boost size & refill',  icon:'🔥'},
  {id:'bumper', name:'Bumper',  desc:'Keep speed in crashes',icon:'🛡️'},
  {id:'traction',name:'Traction',desc:'Launch, hills & drifts',icon:'🧲'},
];
const MAXLV = 5;
const PAINTS = [0xd62839,0xff8c42,0xffd166,0x06d6a0,0x2a9d8f,0x3a86ff,0x1d3557,0x9b5de5,0xf7c6d9,0xf4f1ea,0xc9ccd1,0x222831];
const AI_NAMES = ['Blaze','Zippy','Rusty','Nova','Bolt','Turbo','Comet','Pebble','Jinx','Dash','Sprocket','Fizz','Ziggy','Nugget'];

// Figure-of-eight generator: crossing point gets a bridge of height hB (optional coaster bumps).
function lemni(cx, cz, ax, az, vertical, hB, extra = 0, n = 16, start = 10){
  const pts = [];
  for (let k = 0; k < n; k++) {
    const t = k / n * Math.PI * 2, a = Math.cos(t), b = Math.sin(2 * t);
    const h = hB / 2 * (1 + Math.sin(t)) + extra * Math.sin(3 * t) ** 2;
    pts.push(vertical ? [cx + ax * b, cz + az * a, +h.toFixed(2)] : [cx + ax * a, cz + az * b, +h.toFixed(2)]);
  }
  return pts.slice(start).concat(pts.slice(0, start));
}
// Every tier has its own 3 tracks. Points are [x, z, height]; height makes hills, jumps and bridges.
const TRACKS = [
  // ---- D · Rookie: wide, flat, friendly ----
  {id:'rug', tier:0, name:'Rug Ring', laps:4, hw:5.5, desc:'A fast flowing loop around the big rug.',
   pts:[[0,-23],[24,-17],[35,6],[30,30],[10,43],[-14,42],[-32,28],[-36,4],[-24,-15]]},
  {id:'desk', tier:0, name:'Desk Dash', laps:3, hw:5.5, desc:'Under the desk between its legs, past the chair.',
   pts:[[8,-38],[34,-34],[58,-38],[71,-52],[71,-70],[60,-76],[40,-76],[20,-74],[7,-62]]},
  {id:'playmat', tier:0, name:'Playmat Loop', laps:4, hw:5.5, desc:'A gentle lap along the toy-strewn south wall.',
   pts:[[-22,54],[6,48],[26,50],[34,60],[28,73],[8,76],[-14,76],[-28,66]]},
  // ---- C · Club: first hills and a jump ----
  {id:'bed', tier:1, name:'Under the Bed', laps:3, hw:5.2, desc:'Dive into the dark under the bed, out past the toy chest.',
   pts:[[-64,-8],[-64,-32],[-64,-56],[-60,-72],[-48,-75],[-34,-70],[-24,-52],[-18,-26],[-16,2],[-24,28],[-36,46],[-52,51],[-63,38],[-66,16]]},
  {id:'hills', tier:1, name:'Rolling Hills', laps:4, hw:5.2, desc:'Up and over gentle humps in the middle of the room.',
   pts:[[-44,0,0],[-30,-14,1.5],[-12,-20,3],[4,-8,1.5],[2,14,0],[-12,30,2.5],[-34,34,4],[-48,18,2]]},
  {id:'window', tier:1, name:'Window Sprint', laps:4, hw:5.2, desc:'Flat-out past the radiator with a book jump in the sun.',
   pts:[[-40,-70],[-10,-73],[14,-68],[18,-50],[0,-42],[-28,-44],[-42,-55]], ramp:[-25,-72]},
  // ---- B · Pro: bridges and longer climbs ----
  {id:'eight', tier:2, name:'Figure Eight', laps:4, hw:5, desc:'A figure-of-eight that crosses itself on a bridge.',
   pts: lemni(0, 10, 36, 22, false, 5.8)},
  {id:'shelf', tier:2, name:'Bookshelf Run', laps:4, hw:5, desc:'Climb along the bookshelf and dive back down.',
   pts:[[34,-30,0],[58,-36,2],[68,-20,3.5],[68,-2,3.5],[64,16,2],[46,22,0],[34,8,0.5],[30,-12,0]]},
  {id:'chest', tier:2, name:'Toy Chest Trail', laps:4, hw:5, desc:'Twisting hills round the toy chest corner.',
   pts:[[-58,30,0],[-40,22,1],[-22,30,2.5],[-18,50,1],[-30,70,0],[-50,76,0],[-58,54,2],[-62,40,1]]},
  // ---- A · Elite: big air and crossovers ----
  {id:'grand', tier:3, name:'Grand Tour', laps:2, hw:4.8, desc:'The whole room: under the desk, round the wardrobe, over a book jump.',
   pts:[[-12,-30],[8,-44],[14,-64],[22,-75],[36,-76],[48,-76.5],[58,-76],[68,-73],[73,-60],[71,-40],[65,-20],[62,6],[58,28],[54,46],[38,53],[18,62],[0,72],[-24,74],[-46,66],[-56,46],[-60,22],[-60,0],[-50,-14],[-34,-30]], ramp:[-12,73.5]},
  {id:'coaster', tier:3, name:'Hill Climb Coaster', laps:4, hw:4.8, desc:'Steep crests that throw you into the air.',
   pts:[[-40,-16,0],[-20,-24,4.5],[0,-22,0],[18,-10,5.4],[20,14,0],[6,34,4.6],[-16,40,0],[-36,30,4.2],[-46,8,0]]},
  {id:'overpass', tier:3, name:'Overpass', laps:3, hw:4.8, desc:'Loop round, climb high and fly over your own start straight.',
   pts:[[-40,20,0],[-10,20,0],[16,18,0],[30,0,0],[22,-22,0],[0,-30,1],[-20,-16,3.5],[-18,20,5.6],[-22,42,3],[-38,50,0.5],[-52,36,0]]},
  // ---- S · Superstar: long, technical, fast ----
  {id:'serpent', tier:4, name:'Serpent', laps:3, hw:4.6, desc:'A wriggling snake of S-bends across the floor.',
   pts:[[-60,18,0],[-46,38,1],[-26,30,2],[-8,48,1],[12,36,2.5],[32,50,1],[46,36,0],[32,14,1.5],[10,20,0],[-10,8,1.5],[-32,6,0],[-50,0,0.5]]},
  {id:'deskdive', tier:4, name:'Bed & Desk Dive', laps:3, hw:4.6, desc:'Under the bed, along the window, under the desk — all in one lap.',
   pts:[[10,-40],[-14,-42],[-34,-41],[-56,-42],[-68,-50],[-68,-64],[-58,-71],[-38,-72],[-14,-73],[12,-73],[30,-76],[48,-76],[60,-77],[70,-74],[73,-58],[68,-46],[50,-40],[30,-38]]},
  {id:'bigeight', tier:4, name:'Big Eight', laps:3, hw:4.6, desc:'A giant figure-of-eight running the length of the room.',
   pts: lemni(-4, 10, 26, 40, true, 6)},
  // ---- M · Master: the hardest of everything ----
  {id:'mega', tier:5, name:'Mega Tour', laps:2, hw:4.4, desc:'The entire room in one lap: under the bed, the desk, hills and a jump.',
   pts:[[-36,-41],[-56,-42],[-68,-52],[-68,-64],[-58,-71],[-38,-72],[-14,-73],[12,-73],[30,-76],[48,-76],[64,-75],[72,-62],[71,-40],[65,-20,2],[62,6,4],[58,26,2],[54,46,0],[38,53,0],[18,62,0],[0,72,0],[-24,74,0],[-46,66,0],[-56,46,2],[-58,22,3],[-50,2,1],[-36,-14,0],[-28,-30,0]], ramp:[-12,73.5]},
  {id:'rollercoaster', tier:5, name:'Rollercoaster', laps:4, hw:4.4, desc:'A towering figure-of-eight with coaster drops.',
   pts: lemni(40, 2, 18, 34, true, 6.2, 2.2)},
  {id:'gauntlet', tier:5, name:'The Gauntlet', laps:3, hw:4.4, desc:'Hairpin after hairpin. One mistake and it is over.',
   pts:[[-46,-16],[-14,-16],[-5,-8],[-14,0],[-44,0],[-52,8],[-44,16],[-14,16],[-5,24],[-14,32],[-44,32],[-58,45],[-71,35],[-71,14],[-66,-4],[-58,-14]]},
];
const tierTracks = ti => TRACKS.filter(t => t.tier === ti);

// ============ SAVE ============
const SAVE_KEY = 'toyRacersSave';
let save = {coins:0, owned:['buggy'], sel:'buggy', up:{}, best:0, paint:{}, tiers:1, res:{}, times:{}};
try {
  const s = JSON.parse(localStorage.getItem(SAVE_KEY));
  if (s && typeof s === 'object') save = Object.assign(save, s);
} catch (e) {}
// ---------- Creator Mode: every vehicle free, only on the creator's own PC ----------
// On automatically when the game runs from the creator's folder on this computer (double-click)
// or from a local server on this computer (the app's preview window). Anywhere else it's off,
// unless the secret word is typed in the menu. Unlocks every car, every tier and free upgrades.
const CREATOR_PATH = '/Users/admin/Desktop/CLAUDE%20CODE/toy-racers/';
let creator = false;
try {
  const f = localStorage.getItem('toyRacersCreator');
  const local = (location.protocol === 'file:' && location.pathname.includes(CREATOR_PATH)) || ['localhost', '127.0.0.1', '[::1]'].includes(location.hostname);
  creator = f === '1' || (f !== '0' && local);
} catch (e) {}
function setCreator(on){ creator = on; try { localStorage.setItem('toyRacersCreator', on ? '1' : '0'); } catch (e) {} }
const owns = id => creator || save.owned.includes(id);
const carUnlocked = c => creator || save.tiers > c.tier;
const tierOpen = ti => creator || ti < save.tiers;

save.owned = save.owned.filter(id => CARS.some(c => c.id === id));
if (!save.owned.includes('buggy')) save.owned.unshift('buggy');
if (!owns(save.sel)) save.sel = 'buggy';
function persist(){ try { localStorage.setItem(SAVE_KEY, JSON.stringify(save)); } catch (e) {} }

const carById = id => CARS.find(c => c.id === id);
const lvl = (cid, pid) => (save.up[cid] && save.up[cid][pid]) || 0;
const paintOf = c => (save.paint[c.id] ?? c.color);
function stats(c){
  const L = p => lvl(c.id, p);
  return {
    top:   c.top   * (1 + 0.10 * L('engine')),
    accel: c.accel * (1 + 0.11 * L('battery')),
    grip:  c.grip  * (1 + 0.09 * L('tires')),
    nitroMax:   2 + 0.6 * L('nitro'),
    nitroRegen: 0.25 + 0.08 * L('nitro'),
    crashKeep:  Math.max(0.2, Math.min(0.9, 0.3 + 0.1 * L('bumper') + (c.mass - 1) * 0.25)),
    // traction: extra pull off the line, less speed lost climbing and sliding, less wheelspin
    traction:   1 + 0.15 * L('traction'),
    tracLv:     L('traction'),
  };
}
const PR = s => Math.round(s.top * 2 + s.accel + s.grip * 15 + (s.traction - 1) * 30);
const upCost = (c, lv) => Math.round((30 + c.price * 0.06) * Math.pow(1.5, lv) / 5) * 5;
const lapsFor = t => t.laps;
const tierRes = ti => save.res[TIERS[ti].id] || {};
const tierWins = ti => tierTracks(ti).filter(t => tierRes(ti)[t.id] === 1).length;
function tierMastery(ti){
  let pts = 0;
  const list = tierTracks(ti);
  for (const t of list) { const p = tierRes(ti)[t.id]; if (p) pts += Math.max(0, 4 - p); }
  return pts / (list.length * 3);
}
const ORD = ['1st','2nd','3rd','4th'];
const MEDAL = ['🥇','🥈','🥉','4th'];
const fmtTime = t => { const m = Math.floor(t / 60), s = t - m * 60; return m + ':' + (s < 10 ? '0' : '') + s.toFixed(2); };
