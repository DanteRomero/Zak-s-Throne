/* El clima de la superficie: lluvia, tormenta eléctrica y niebla. Cada uno cubre toda la superficie a la vez
   (la aldea, Los Yuyos y el cementerio); las cuevas y la dimensión de Zak quedan bajo techo.
   - Lluvia: charcos, pasto brilloso y peces que pican más rápido.
   - Tormenta: llueve y caen rayos que sacan mucha vida y paralizan. En Los Yuyos, donde cae un rayo se prende fuego el pasto.
   - Niebla: se ve poco. En el cementerio, de vez en cuando sale un esqueleto de la tierra pegado a vos.
   El clima sale del reloj de la partida y de su identificador: no se guarda nada nuevo para saber qué clima hay. */
(function () {
'use strict';
const Z = window.Zak;
// Cada bloque de 4 minutos reales tiene un clima. Entra y sale en 20 s. Los charcos y el pasto mojado son solo de la lluvia:
// se llenan en 20 s y, cuando para, se secan en 10.
const RAIN = Z.RAIN = {block: 240, chance: .2, fade: 20, fill: 20, dry: 10, bite: .6, wet: .3};
// Los climas que complican son menos probables que la lluvia.
// `bolt`: cada cuántos segundos cae un rayo cerca; `aimed`: parte de los rayos que caen justo donde estás.
const STORM = Z.STORM = {chance: .09, bolt: [3.5, 7], warn: 1, radius: 24, damage: .35, stun: 2.5, aimed: .35, fire: 14, fireRadius: 26, burn: .03};
const FOG = Z.FOG = {chance: .09, clear: 70, edge: 190, ambush: [22, 40], near: [34, 50], max: 3};
const OUTDOORS = {village: true, weeds: true, altar: true};
Z.isOutdoors = biome => !!OUTDOORS[biome];
const seedOf = id => { let h = 2166136261; for (const ch of String(id || 'zak')) h = Math.imul(h ^ ch.charCodeAt(0), 16777619); return h >>> 0; };
const roll = (a, b) => { let n = Math.imul(a + 40503, 374761393) ^ Math.imul(b + 9127, 668265263); n = Math.imul(n ^ n >>> 13, 1274126177); return ((n ^ n >>> 16) >>> 0) / 4294967296; };
const between = ([a, b]) => a + Math.random() * (b - a);
// El clima en un momento de la partida: {kind: 'rain' | 'storm' | 'fog' | null, k: intensidad de 0 a 1}. Los primeros 4 minutos nunca hay.
// `luck`: con el Dado cargado, cada clima suma 10 puntos.
Z.weatherAt = function (playTime, runId, luck = 0) {
 const t = Math.max(0, Number(playTime) || 0), block = Math.floor(t / RAIN.block);
 if (block < 1) return {kind: null, k: 0};
 const r = roll(block, seedOf(runId));
 const rain = Z.withLuck(RAIN.chance, luck), storm = Z.withLuck(STORM.chance, luck), fog = Z.withLuck(FOG.chance, luck);
 const kind = r < rain ? 'rain' : r < rain + storm ? 'storm' : r < rain + storm + fog ? 'fog' : null;
 if (!kind) return {kind: null, k: 0};
 const into = t - block * RAIN.block;
 return {kind, k: Math.max(0, Math.min(1, into / RAIN.fade, (RAIN.block - into) / RAIN.fade))};
};
// Intensidad de la lluvia (la tormenta también llueve).
Z.rainAt = function (playTime, runId, luck = 0) { const w = Z.weatherAt(playTime, runId, luck); return w.kind === 'rain' || w.kind === 'storm' ? w.k : 0; };
// Lugares de los charcos: siempre los mismos en cada mapa, sobre pasto o tierra y lejos de casas, árboles y lagunas.
Z.puddlesOf = function (world) {
 if (world.puddles) return world.puddles;
 let seed = 5113; const random = () => { seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0; return seed / 4294967296; };
 const blocked = (x, y, rx, ry) => world.objects.some(o => (o.solid || o.type === 'pond' || o.type === 'stairs') && x + rx + 8 > o.x && x - rx - 8 < o.x + o.w && y + ry + 8 > o.y && y - ry - 8 < o.y + o.h)
  || world.paths.some(p => p.material === 'stone' && x > p.x - 4 && x < p.x + p.w + 4 && y > p.y - 4 && y < p.y + p.h + 4);
 const list = [];
 for (const [biome, count, area] of [['village', 34, {x: 40, y: 560, w: 1460, h: 1180}], ['weeds', 22, {x: 1570, y: 60, w: 800, h: 1680}], ['altar', 12, {x: -760, y: 540, w: 720, h: 1220}]]) {
  for (let placed = 0, tries = 0; placed < count && tries < 900; tries++) {
   const x = Math.round(area.x + random() * area.w), y = Math.round(area.y + random() * area.h), rx = 8 + Math.round(random() * 10), ry = 3 + Math.round(random() * 4);
   if (Z.biomeAt(x, y) !== biome || blocked(x, y, rx, ry) || list.some(p => Math.hypot(p.x - x, p.y - y) < 46)) continue;
   list.push({id: 'puddle-' + list.length, x, y, rx, ry, seed: random() * 99}); placed++;
  }
 }
 world.puddles = list; return list;
};
Z.WEATHER_NAMES = {rain: '🌧 LLUVIA', storm: '⛈ TORMENTA', fog: '🌫 NIEBLA'};

Object.assign(Z.Game.prototype, {
 // El clima que se nota ahora (afuera y ya entrado, no las primeras gotas). null bajo techo o con cielo despejado.
 weatherNow() { return this.weather && this.weather.k > RAIN.wet && Z.isOutdoors(this.biome) ? this.weather.kind : null; },
 raining() { const w = this.weatherNow(); return w === 'rain' || w === 'storm'; },
 storming() { return this.weatherNow() === 'storm'; },
 foggy() { return this.weatherNow() === 'fog'; },
 puddleAt(x, y) {
  const k = Math.min(1, (this.wetness || 0) * 1.3); if (k < .25) return null;
  return Z.puddlesOf(this.world).find(p => ((x - p.x) / (p.rx * k)) ** 2 + ((y - p.y) / (p.ry * k + 2)) ** 2 < 1) || null;
 },
 updateWeather(dt) {
  const p = this.player, w = Z.weatherAt(p.playTime, p.runId, this.luck()), outside = Z.isOutdoors(this.biome);
  this.weather = w; this.rain = w.kind === 'rain' || w.kind === 'storm' ? w.k : 0; this.fog = w.kind === 'fog' ? w.k : 0;
  this.wetness = this.rain > .05 ? Math.min(1, (this.wetness || 0) + dt / RAIN.fill) : Math.max(0, (this.wetness || 0) - dt / RAIN.dry);
  if (this.flash > 0) this.flash = Math.max(0, this.flash - dt * 2.5);
  const now = w.k > .5 ? w.kind : null;
  if (now !== (this.weatherNotified || null)) {
   const before = this.weatherNotified; this.weatherNotified = now;
   const msg = now === 'rain' ? 'Se largó a llover. Los peces pican más rápido y se forman charcos.'
    : now === 'storm' ? '¡Tormenta eléctrica! Caen rayos: si ves la marca en el piso, salí de ahí.'
    : now === 'fog' ? 'Bajó una niebla espesa. No se ve nada... y en el cementerio algo se mueve.'
    : before === 'fog' ? 'Se levantó la niebla.' : before === 'storm' ? 'Pasó la tormenta.' : before === 'rain' ? 'Paró de llover.' : '';
   if (msg && outside && this.settings.notices) this.emit('toast', {message: msg, error: now === 'storm' || now === 'fog'});
  }
  // Gotas: un tic suave y aleatorio mientras llueve afuera.
  if (outside && this.rain > .2 && this.sound.enabled) { this.rainTick = (this.rainTick || 0) - dt; if (this.rainTick <= 0) { this.rainTick = .06 + Math.random() * .12; this.sound.tone(2200 + Math.random() * 2600, .02, 'triangle', .006 * this.rain); } }
  // Pisar un charco salpica. Cada charco cuenta una vez hasta que salís de él.
  if (outside && p.moving && p.roll <= 0) {
   const puddle = this.puddleAt(p.x, p.y);
   if (puddle && puddle !== this.lastPuddle) { p.puddles = Math.floor(Number(p.puddles) || 0) + 1; this.sound.play('splash'); this.effect(p.x, p.y, 'splash', .5, {seed: Math.random() * 99}); }
   this.lastPuddle = puddle;
  } else if (!outside) this.lastPuddle = null;
  this.updateLightning(dt); this.updateGrassFire(dt); this.updateFogAmbush(dt);
  if (this.scare > 0) this.scare = Math.max(0, this.scare - dt);
 },
 /* ---------- Tormenta: rayos ---------- */
 updateLightning(dt) {
  this.strikes = (this.strikes || []).filter(s => s.t < s.warn + .6);
  for (const s of this.strikes) { const was = s.t; s.t += dt; if (was < s.warn && s.t >= s.warn) this.strike(s); }
  if (!this.storming() || this.state !== 'playing' || this.cutscene) { this.boltClock = Math.max(this.boltClock || 0, 1.5); return; }
  this.boltClock = (this.boltClock || between(STORM.bolt)) - dt; if (this.boltClock > 0) return;
  this.boltClock = between(STORM.bolt);
  const p = this.player, safe = Z.isSafe(this.biome);
  // En la aldea (zona segura) los rayos caen lejos y no lastiman.
  let x = p.x, y = p.y;
  if (safe || !this.chance(STORM.aimed)) { const a = Math.random() * Math.PI * 2, r = (safe ? 120 : 50) + Math.random() * 170; x = p.x + Math.cos(a) * r; y = p.y + Math.sin(a) * r * .7; }
  if (Z.biomeAt(x, y) !== this.biome) { if (safe) return; x = p.x; y = p.y; }
  this.strikes.push({x, y, t: 0, warn: STORM.warn, biome: this.biome, seed: Math.random() * 99});
  this.sound.tone(90, .5, 'sawtooth', .012, 0, 60);
 },
 strike(s) {
  const p = this.player;
  this.sound.play('thunder'); this.shake(5, .35); this.flash = .5; this.effect(s.x, s.y, 'skybolt', .6, {seed: s.seed});
  if (this.biome === s.biome && Math.hypot(p.x - s.x, (p.y - s.y) / .75) <= STORM.radius) {
   const max = this.stats().maxHealth;
   if (this.hurtPlayer(max * STORM.damage, 'lightning', false, {pierce: true})) {
    if (this.state === 'playing') { p.stunned = Math.max(p.stunned || 0, STORM.stun); p.gather = null; this.emit('toast', {message: '¡Te partió un rayo! Quedaste paralizado un rato.', error: true}); }
    if (this.awardMedal) this.awardMedal('struck');
   }
  }
  if (s.biome === 'weeds') (this.fires = this.fires || []).push({x: s.x, y: s.y, t: STORM.fire, r: STORM.fireRadius, seed: s.seed});
 },
 // Pasto prendido fuego en Los Yuyos: si lo pisás, te quemás.
 updateGrassFire(dt) {
  if (!this.fires || !this.fires.length) return;
  for (const f of this.fires) f.t -= dt;
  this.fires = this.fires.filter(f => f.t > 0);
  const p = this.player; if (this.biome !== 'weeds' || this.state !== 'playing') return;
  const fire = this.fires.find(f => Math.hypot(p.x - f.x, (p.y - f.y) / .75) < f.r * Math.min(1, f.t / 2));
  if (!fire) return;
  const before = p.burn; this.burnPlayer(Math.max(2, Math.round(this.stats().maxHealth * STORM.burn)));
  if (!before && p.burn && this.awardMedal) this.awardMedal('burned');
 },
 /* ---------- Niebla: esqueletos en el cementerio ---------- */
 updateFogAmbush(dt) {
  if (this.enemies.some(e => e.fogAmbush && e.dead)) this.enemies = this.enemies.filter(e => !(e.fogAmbush && e.dead));
  if (!this.foggy() || this.biome !== 'altar' || this.state !== 'playing' || this.cutscene) { this.ambushClock = Math.max(this.ambushClock || 0, 8); return; }
  this.ambushClock = (this.ambushClock || between(FOG.ambush)) - dt; if (this.ambushClock > 0) return;
  this.ambushClock = between(FOG.ambush);
  if (this.enemies.filter(e => e.fogAmbush && !e.dead).length >= FOG.max) return;
  this.fogAmbush();
 },
 fogAmbush() {
  const p = this.player;
  for (let tries = 0; tries < 16; tries++) {
   const a = Math.random() * Math.PI * 2, r = between(FOG.near), x = p.x + Math.cos(a) * r, y = p.y + Math.sin(a) * r * .75;
   if (Z.biomeAt(x, y) !== 'altar' || Z.collides(this.world, x, y, 9)) continue;
   const e = this.makeEnemy({id: 'fog-skeleton-' + (this.summonSerial = (this.summonSerial || 0) + 1), type: 'skeleton', x, y});
   Object.assign(e, {summoned: true, owner: 'fog', fogAmbush: true, alert: true, provoked: true, cooldown: 1});
   this.enemies.push(e);
   this.effect(x, y, 'graverise', .9, {seed: Math.random() * 99}); this.effect(p.x, p.y - 40, 'miss', .9, {text: '¡!'});
   this.scare = 1.4; this.shake(4, .3); this.sound.play('roar'); if (this.vibrate) this.vibrate(80);
   if (this.awardMedal) this.awardMedal('ambush');
   return e;
  }
  return null;
 }
});
Z.UPDATERS = Z.UPDATERS || []; Z.UPDATERS.push(function (dt) { this.updateWeather(dt); });

// Con lluvia (o tormenta), los peces pican antes.
const baseFishing = Z.Game.prototype.startFishing;
Z.Game.prototype.startFishing = function (pond) {
 const started = baseFishing.call(this, pond);
 if (started && this.player.fishing && this.raining()) { this.player.fishing.bite *= RAIN.bite; this.player.fishing.rain = true; }
 return started;
};
const baseRestore = Z.Game.prototype.restoreInventory;
const resetSky = g => { g.strikes = []; g.fires = []; g.scare = 0; g.flash = 0; g.boltClock = 0; g.ambushClock = 0; g.lastPuddle = null; };
Z.Game.prototype.restoreInventory = function (p, source) {
 baseRestore.call(this, p, source);
 p.puddles = Math.floor(Math.max(0, Math.min(1e6, Number(source.puddles) || 0)));
 const w = Z.weatherAt(p.playTime, p.runId, this.luck()); this.weather = w;
 this.wetness = (w.kind === 'rain' || w.kind === 'storm') && w.k > 0 ? 1 : 0; this.weatherNotified = w.k > .5 ? w.kind : null; resetSky(this);
};
const baseNew = Z.Game.prototype.newGame;
Z.Game.prototype.newGame = function (id) { this.wetness = 0; this.rain = 0; this.fog = 0; this.weather = {kind: null, k: 0}; this.weatherNotified = null; resetSky(this); return baseNew.call(this, id); };

/* ---------- Dibujo ---------- */
const D = () => Z.Draw, Px = Z.Pixel;
// Charcos con el cielo reflejado, ondas cuando llueve, brillitos en el pasto mojado, pasto en llamas y marcas de rayo.
Z.drawFloorExtras = function (c, game, visible, time) {
 if (!Z.isOutdoors(game.biome)) return;
 drawStrikeMarks(c, game, visible, time);
 drawFires(c, game, visible, time);
 const wet = game.wetness || 0; if (wet < .02) return;
 const {rect, hash, zoneAt} = D(), k = Math.min(1, wet * 1.3), rain = game.rain || 0;
 for (const p of Z.puddlesOf(game.world)) {
  if (!visible(p.x, p.y, 30)) continue;
  const rx = p.rx * k, ry = p.ry * k + 1; if (rx < 2) continue;
  c.save(); c.globalAlpha = .55 + .3 * k;
  Px.oval(c, p.x, p.y, rx + 1, ry + 1, '#33505a'); Px.oval(c, p.x, p.y, rx, ry, '#4d7884'); Px.oval(c, p.x - rx * .2, p.y - ry * .15, rx * .62, ry * .55, '#6d9ba6');
  c.globalAlpha = .8; rect(c, p.x - rx * .5, p.y - ry * .4, Math.max(2, rx * .45), 1, '#d6eef2'); rect(c, p.x + rx * .2, p.y + ry * .2, Math.max(1, rx * .25), 1, '#a9d1da');
  if (rain > .2) for (let r = 0; r < 2; r++) {
   const phase = (time * 1.3 + p.seed + r * .5) % 1, ox = (hash(Math.floor(time * 1.3 + p.seed + r * .5), r, p.x | 0) - .5) * rx, rr = 1 + phase * Math.min(6, rx * .5);
   c.globalAlpha = (1 - phase) * .7; c.strokeStyle = '#d6eef2'; c.lineWidth = 1; c.beginPath(); c.ellipse(Math.round(p.x + ox), Math.round(p.y), rr, rr * .45, 0, 0, Math.PI * 2); c.stroke();
  }
  c.restore();
 }
 // Gotitas sobre el pasto: titilan al azar.
 const cam = game.camera || {x: 0, y: 0}, W = (game.canvas && game.canvas.width) || 640, H = (game.canvas && game.canvas.height) || 360;
 for (let y = Math.floor(cam.y / 18) * 18; y < cam.y + H + 18; y += 18) for (let x = Math.floor(cam.x / 18) * 18; x < cam.x + W + 18; x += 18) {
  const n = hash(x, y, 77); if (n < .62) continue; const zone = zoneAt(game.world, x, y); if (zone !== 'village' && zone !== 'weeds' && zone !== 'altar') continue;
  const gx = x + Math.floor(hash(x, y, 5) * 16), gy = y + Math.floor(hash(x, y, 6) * 16), shine = Math.sin(time * (2 + n * 3) + n * 40);
  if (shine < .1) continue; c.globalAlpha = Math.min(1, shine) * wet * .9;
  rect(c, gx, gy, 1, 1, '#f4fbff'); if (shine > .8) { rect(c, gx - 1, gy, 3, 1, '#d8f0ff'); rect(c, gx, gy - 1, 1, 3, '#d8f0ff'); }
  rect(c, gx + 1, gy + 2, 1, 1, '#9fd6e0');
 }
 c.globalAlpha = 1;
};
// La marca del rayo: un círculo que titila cada vez más rápido antes de que caiga.
function drawStrikeMarks(c, game, visible, time) {
 const {rect} = D();
 for (const s of game.strikes || []) {
  if (s.biome !== game.biome || s.t >= s.warn || !visible(s.x, s.y, 40)) continue;
  const k = s.t / s.warn, blink = Math.sin(time * (10 + k * 30)) > 0 ? 1 : .55, r = STORM.radius;
  c.save(); c.globalAlpha = (.18 + k * .3) * blink; c.fillStyle = '#fff2a6'; c.beginPath(); c.ellipse(s.x, s.y, r, r * .75, 0, 0, Math.PI * 2); c.fill();
  c.globalAlpha = .9 * blink; c.strokeStyle = '#ffe066'; c.lineWidth = 2; c.setLineDash([4, 3]); c.beginPath(); c.ellipse(s.x, s.y, r, r * .75, 0, 0, Math.PI * 2); c.stroke(); c.setLineDash([]);
  c.globalAlpha = blink; rect(c, s.x - 1, s.y - 5, 2, 4, '#fff6c8'); rect(c, s.x - 1, s.y + 1, 2, 2, '#fff6c8');
  c.restore();
 }
}
function drawFires(c, game, visible, time) {
 if (game.biome !== 'weeds') return;
 const {rect, hash} = D();
 for (const f of game.fires || []) {
  if (!visible(f.x, f.y, 40)) continue;
  const life = Math.min(1, f.t / 2), r = f.r * life;
  c.save(); c.globalAlpha = .55 * life; Px.oval(c, f.x, f.y, r + 2, r * .75 + 2, '#2a1a10'); Px.oval(c, f.x, f.y, r, r * .75, '#4a2a14');
  Px.glow(c, f.x, f.y - 8, r + 22, '#ff8c3c', .6 * life);
  // Llamas de atrás para adelante, para que las de abajo tapen a las de arriba.
  const flames = [];
  for (let k = 0; k < 12; k++) { const a = hash(k, f.seed | 0, 3) * Math.PI * 2, d = Math.sqrt(hash(k, f.seed | 0, 4)) * r * .85; flames.push([f.x + Math.cos(a) * d, f.y + Math.sin(a) * d * .75, k]); }
  flames.sort((a, b) => a[1] - b[1]);
  for (const [fx, fy, k] of flames) {
   const flick = Math.sin(time * 13 + k * 1.7), h = (9 + hash(k, f.seed | 0, 6) * 7 + flick * 3) * life, w = 4 + hash(k, f.seed | 0, 7) * 3, lean = Math.sin(time * 5 + k) * 2;
   c.globalAlpha = life;
   Px.poly(c, [[fx - w, fy], [fx + lean, fy - h], [fx + w, fy]], '#c8341c');
   Px.poly(c, [[fx - w * .6, fy], [fx + lean * .8, fy - h * .72], [fx + w * .6, fy]], '#ff8c2a');
   Px.poly(c, [[fx - w * .28, fy], [fx + lean * .5, fy - h * .42], [fx + w * .28, fy]], '#ffd36a');
  }
  // Chispas que suben y humo.
  for (let k = 0; k < 6; k++) { const up = (time * .9 + k / 6) % 1, sx = f.x + (hash(k, f.seed | 0, 8) - .5) * r * 1.4 + Math.sin(time * 3 + k) * 3; c.globalAlpha = (1 - up) * life; rect(c, sx, f.y - 10 - up * 34, 1, 1, k % 2 ? '#ffe08a' : '#ff8c2a'); }
  for (let k = 0; k < 3; k++) { const up = (time * .35 + k / 3) % 1; c.globalAlpha = (1 - up) * .28 * life; Px.oval(c, f.x + Math.sin(time + k * 2) * 6, f.y - 22 - up * 40, 7 + up * 9, 4 + up * 5, '#3a3436'); }
  c.restore();
 }
}
// Cielo de tormenta o niebla, gotas que caen en diagonal y el destello de los rayos.
Z.drawWeather = function (c, game, ox, oy, W, H, time) {
 const rain = game.rain || 0, wet = game.wetness || 0, fog = game.fog || 0, storm = game.weather && game.weather.kind === 'storm' ? game.weather.k : 0;
 const {rect, hash} = D(), outside = Z.isOutdoors(game.biome);
 c.save();
 if (outside && fog > .02) drawFog(c, game, ox, oy, W, H, time, fog);
 if (outside && (rain > .02 || wet > .02)) {
  if (wet > .02) { c.fillStyle = 'rgba(28,48,66,' + (wet * .08) + ')'; c.fillRect(0, 0, W, H); }
  if (storm > .02) { c.fillStyle = 'rgba(14,18,34,' + (storm * .25) + ')'; c.fillRect(0, 0, W, H); }
  if (rain > .02) {
   c.fillStyle = 'rgba(38,52,78,' + (rain * .2) + ')'; c.fillRect(0, 0, W, H);
   const drops = Math.round((storm > .02 ? 230 : 150) * rain), slant = storm > .02 ? .45 : .25;
   for (let k = 0; k < drops; k++) {
    const speed = 320 + hash(k, 3) * 160, x = ((hash(k, 1) * (W + 80) - time * speed * slant + ox * .2) % (W + 80) + W + 80) % (W + 80) - 40, y = ((hash(k, 2) * H + time * speed) % (H + 20)) - 10;
    c.globalAlpha = .28 + hash(k, 4) * .3; rect(c, x, y, 1, 4, '#c8dcea'); rect(c, x - 1, y + 4, 1, 3, '#c8dcea');
   }
   const beat = Math.floor(time * 8);
   for (let k = 0; k < Math.round(26 * rain); k++) {
    const x = hash(k, beat, 7) * W, y = 20 + hash(k, beat, 8) * (H - 20); c.globalAlpha = .55;
    rect(c, x - 2, y - 1, 1, 1, '#dbeaf2'); rect(c, x + 2, y - 1, 1, 1, '#dbeaf2'); rect(c, x - 1, y, 3, 1, '#a9c4d6');
   }
  }
 }
 c.globalAlpha = 1;
 // Destello del rayo: toda la pantalla se pone blanca un instante.
 if (game.flash > 0 && outside) { c.fillStyle = 'rgba(238,244,255,' + Math.min(.75, game.flash) + ')'; c.fillRect(0, 0, W, H); }
 // Susto: la pantalla se cierra en negro, late y se tiñe de rojo un instante.
 if (game.scare > 0) {
  const k = Math.min(1, game.scare / 1.4), beat = .5 + Math.abs(Math.sin(time * 18)) * .5, px = game.player.x - ox, py = game.player.y - oy - 14;
  Px.shade(c, px, py, W, H, [[40 + (1 - k) * 80, 0], [120 + (1 - k) * 140, .92 * k * beat], [Math.max(W, H) * 1.5, .92 * k * beat]], '#050208');
  c.fillStyle = 'rgba(120,10,20,' + (.18 * k * beat) + ')'; c.fillRect(0, 0, W, H);
 }
 c.restore();
};
function drawFog(c, game, ox, oy, W, H, time, fog) {
 const {hash} = D(), p = game.player, px = p.x - ox, py = p.y - oy - 12, grave = game.biome === 'altar';
 // Cerca tuyo se ve; más allá, todo blanco grisáceo.
 Px.shade(c, px, py, W, H, [[FOG.clear, 0], [FOG.edge, .82 * fog], [FOG.edge * 1.8, .94 * fog], [Math.max(W, H) * 1.5, .94 * fog]], grave ? '#8d8a9e' : '#a9b2b6');
 for (let k = 0; k < 9; k++) {
  const fx = ((hash(k, 4) * W * 1.5 + time * (5 + k * 1.5) - ox * .3) % (W + 240) + W + 240) % (W + 240) - 120, fy = hash(k, 6) * H;
  c.globalAlpha = .08 * fog; Px.oval(c, fx, fy, 110, 18, '#e6eaee'); c.globalAlpha = .06 * fog; Px.oval(c, fx + 14, fy + 3, 70, 10, '#f4f6f8');
 }
 c.globalAlpha = 1;
}
// Efectos: salpicadura, el rayo que baja del cielo y el esqueleto que sale de la tierra.
const baseEffect = Z.drawExtraEffect;
Z.drawExtraEffect = function (c, e, time, progress) {
 const {rect, hash} = D();
 if (e.type === 'splash') {
  for (let k = 0; k < 8; k++) { const a = k * .78 + (e.seed || 0), r = 3 + progress * 12; c.globalAlpha = 1 - progress; rect(c, e.x + Math.cos(a) * r, e.y - 2 + Math.sin(a) * r * .45 - Math.sin(progress * Math.PI) * 6, 2, 2, k % 2 ? '#d6eef2' : '#8fc3cf'); }
  c.globalAlpha = 1 - progress; c.strokeStyle = '#d6eef2'; c.lineWidth = 1; c.beginPath(); c.ellipse(e.x, e.y, 4 + progress * 10, 2 + progress * 4, 0, 0, Math.PI * 2); c.stroke();
  return true;
 }
 if (e.type === 'skybolt') {
  const fade = 1 - progress, top = e.y - 260, seed = (e.seed || 0) | 0;
  // Zigzag del rayo, con una rama.
  const pts = [[e.x, top]]; for (let k = 1; k <= 8; k++) pts.push([e.x + (k === 8 ? 0 : (hash(k, seed, 1) - .5) * 34), top + (e.y - top) * k / 8]);
  c.globalAlpha = fade; Px.glow(c, e.x, e.y - 4, 46, '#fff2a6', .7 * fade);
  for (const [w, col] of [[5, '#8fb4ff'], [3, '#e8f0ff'], [1, '#ffffff']]) { c.strokeStyle = col; c.lineWidth = w; c.beginPath(); pts.forEach(([x, y], i) => i ? c.lineTo(x, y) : c.moveTo(x, y)); c.stroke(); }
  const [bx, by] = pts[3]; c.strokeStyle = '#e8f0ff'; c.lineWidth = 1; c.beginPath(); c.moveTo(bx, by); c.lineTo(bx + 18, by + 22); c.lineTo(bx + 12, by + 40); c.stroke();
  for (let k = 0; k < 10; k++) { const a = k * .63 + seed, r = 4 + progress * 26; rect(c, e.x + Math.cos(a) * r, e.y + Math.sin(a) * r * .5 - Math.sin(progress * Math.PI) * 8, 2, 2, k % 2 ? '#fff2a6' : '#8fb4ff'); }
  c.strokeStyle = '#fff2a6'; c.lineWidth = 2; c.beginPath(); c.ellipse(e.x, e.y, 6 + progress * 28, 3 + progress * 14, 0, 0, Math.PI * 2); c.stroke();
  return true;
 }
 if (e.type === 'graverise') {
  const fade = 1 - progress, seed = (e.seed || 0) | 0;
  c.globalAlpha = fade; Px.oval(c, e.x, e.y + 1, 14, 6, '#2a2018');
  for (let k = 0; k < 12; k++) { const a = hash(k, seed, 2) * Math.PI * 2, r = 4 + progress * 16; rect(c, e.x + Math.cos(a) * r, e.y + Math.sin(a) * r * .5 - Math.sin(progress * Math.PI) * 10 * hash(k, seed, 3), 2, 2, k % 3 ? '#5a4632' : '#e6e0cc'); }
  c.globalAlpha = .6 * fade; Px.glow(c, e.x, e.y - 10, 28, '#b8f0c8', .4 * fade);
  return true;
 }
 return baseEffect ? baseEffect(c, e, time, progress) : false;
};
})();
