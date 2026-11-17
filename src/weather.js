/* Lluvia en la superficie: charcos, pasto que brilla mojado y peces que pican más rápido.
   El clima sale del reloj de la partida y de su identificador: no se guarda nada nuevo para saber si llueve. */
(function () {
'use strict';
const Z = window.Zak;
// Cada bloque de 4 minutos reales tiene un 22% de lluvia. Entra y sale en 20 s. Los charcos y el pasto mojado son solo de la lluvia:
// se llenan en 20 s y, cuando para, se secan en 10.
const RAIN = Z.RAIN = {block: 240, chance: .22, fade: 20, fill: 20, dry: 10, bite: .6, wet: .3};
const OUTDOORS = {village: true, weeds: true, altar: true};
Z.isOutdoors = biome => !!OUTDOORS[biome];
const seedOf = id => { let h = 2166136261; for (const ch of String(id || 'zak')) h = Math.imul(h ^ ch.charCodeAt(0), 16777619); return h >>> 0; };
const roll = (a, b) => { let n = Math.imul(a + 40503, 374761393) ^ Math.imul(b + 9127, 668265263); n = Math.imul(n ^ n >>> 13, 1274126177); return ((n ^ n >>> 16) >>> 0) / 4294967296; };
// Intensidad de la lluvia (de 0 a 1) en un momento de la partida. Los primeros 4 minutos nunca llueve.
Z.rainAt = function (playTime, runId) {
 const t = Math.max(0, Number(playTime) || 0), block = Math.floor(t / RAIN.block);
 if (block < 1 || roll(block, seedOf(runId)) >= RAIN.chance) return 0;
 const into = t - block * RAIN.block;
 return Math.max(0, Math.min(1, into / RAIN.fade, (RAIN.block - into) / RAIN.fade));
};
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

Object.assign(Z.Game.prototype, {
 // Llueve de verdad (no las primeras gotas) y estás al aire libre.
 raining() { return (this.rain || 0) > RAIN.wet && Z.isOutdoors(this.biome); },
 puddleAt(x, y) {
  const k = Math.min(1, (this.wetness || 0) * 1.3); if (k < .25) return null;
  return Z.puddlesOf(this.world).find(p => ((x - p.x) / (p.rx * k)) ** 2 + ((y - p.y) / (p.ry * k + 2)) ** 2 < 1) || null;
 },
 updateWeather(dt) {
  const p = this.player, rain = Z.rainAt(p.playTime, p.runId), outside = Z.isOutdoors(this.biome);
  this.rain = rain;
  this.wetness = rain > .05 ? Math.min(1, (this.wetness || 0) + dt / RAIN.fill) : Math.max(0, (this.wetness || 0) - dt / RAIN.dry);
  const on = rain > .5;
  if (on !== !!this.rainNotified) {
   this.rainNotified = on;
   if (outside && this.settings.notices) this.emit('toast', {message: on ? 'Se largó a llover. Los peces pican más rápido y se forman charcos.' : 'Paró de llover.'});
  }
  // Gotas: un tic suave y aleatorio mientras llueve afuera.
  if (outside && rain > .2 && this.sound.enabled) { this.rainTick = (this.rainTick || 0) - dt; if (this.rainTick <= 0) { this.rainTick = .06 + Math.random() * .12; this.sound.tone(2200 + Math.random() * 2600, .02, 'triangle', .006 * rain); } }
  // Pisar un charco salpica. Cada charco cuenta una vez hasta que salís de él.
  if (outside && p.moving && p.roll <= 0) {
   const puddle = this.puddleAt(p.x, p.y);
   if (puddle && puddle !== this.lastPuddle) { p.puddles = Math.floor(Number(p.puddles) || 0) + 1; this.sound.play('splash'); this.effect(p.x, p.y, 'splash', .5, {seed: Math.random() * 99}); }
   this.lastPuddle = puddle;
  } else if (!outside) this.lastPuddle = null;
 }
});
Z.UPDATERS = Z.UPDATERS || []; Z.UPDATERS.push(function (dt) { this.updateWeather(dt); });

// Con lluvia, los peces pican antes.
const baseFishing = Z.Game.prototype.startFishing;
Z.Game.prototype.startFishing = function (pond) {
 const started = baseFishing.call(this, pond);
 if (started && this.player.fishing && this.raining()) { this.player.fishing.bite *= RAIN.bite; this.player.fishing.rain = true; }
 return started;
};
const baseRestore = Z.Game.prototype.restoreInventory;
Z.Game.prototype.restoreInventory = function (p, source) {
 baseRestore.call(this, p, source);
 p.puddles = Math.floor(Math.max(0, Math.min(1e6, Number(source.puddles) || 0)));
 this.wetness = Z.rainAt(p.playTime, p.runId) > 0 ? 1 : 0; this.rainNotified = Z.rainAt(p.playTime, p.runId) > .5;
};
const baseNew = Z.Game.prototype.newGame;
Z.Game.prototype.newGame = function (id) { this.wetness = 0; this.rain = 0; this.rainNotified = false; this.lastPuddle = null; return baseNew.call(this, id); };

/* ---------- Dibujo ---------- */
const D = () => Z.Draw, Px = Z.Pixel;
// Charcos con el cielo reflejado, ondas cuando llueve y brillitos en el pasto mojado.
Z.drawFloorExtras = function (c, game, visible, time) {
 const wet = game.wetness || 0; if (wet < .02 || !Z.isOutdoors(game.biome)) return;
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
// Cielo nublado, gotas que caen en diagonal y salpicaduras en el piso.
Z.drawWeather = function (c, game, ox, oy, W, H, time) {
 const rain = game.rain || 0, wet = game.wetness || 0; if (!Z.isOutdoors(game.biome) || (rain < .02 && wet < .02)) return;
 const {rect, hash} = D();
 c.save();
 if (wet > .02) { c.fillStyle = 'rgba(28,48,66,' + (wet * .08) + ')'; c.fillRect(0, 0, W, H); }
 if (rain > .02) {
  c.fillStyle = 'rgba(38,52,78,' + (rain * .2) + ')'; c.fillRect(0, 0, W, H);
  const drops = Math.round(150 * rain);
  for (let k = 0; k < drops; k++) {
   const speed = 320 + hash(k, 3) * 160, x = ((hash(k, 1) * (W + 80) - time * speed * .25 + ox * .2) % (W + 80) + W + 80) % (W + 80) - 40, y = ((hash(k, 2) * H + time * speed) % (H + 20)) - 10;
   c.globalAlpha = .28 + hash(k, 4) * .3; rect(c, x, y, 1, 4, '#c8dcea'); rect(c, x - 1, y + 4, 1, 3, '#c8dcea');
  }
  const beat = Math.floor(time * 8);
  for (let k = 0; k < Math.round(26 * rain); k++) {
   const x = hash(k, beat, 7) * W, y = 20 + hash(k, beat, 8) * (H - 20); c.globalAlpha = .55;
   rect(c, x - 2, y - 1, 1, 1, '#dbeaf2'); rect(c, x + 2, y - 1, 1, 1, '#dbeaf2'); rect(c, x - 1, y, 3, 1, '#a9c4d6');
  }
 }
 c.restore();
};
// Salpicadura al pisar un charco.
const baseEffect = Z.drawExtraEffect;
Z.drawExtraEffect = function (c, e, time, progress) {
 if (e.type === 'splash') {
  const {rect} = D();
  for (let k = 0; k < 8; k++) { const a = k * .78 + (e.seed || 0), r = 3 + progress * 12; c.globalAlpha = 1 - progress; rect(c, e.x + Math.cos(a) * r, e.y - 2 + Math.sin(a) * r * .45 - Math.sin(progress * Math.PI) * 6, 2, 2, k % 2 ? '#d6eef2' : '#8fc3cf'); }
  c.globalAlpha = 1 - progress; c.strokeStyle = '#d6eef2'; c.lineWidth = 1; c.beginPath(); c.ellipse(e.x, e.y, 4 + progress * 10, 2 + progress * 4, 0, 0, Math.PI * 2); c.stroke();
  return true;
 }
 return baseEffect ? baseEffect(c, e, time, progress) : false;
};
})();
