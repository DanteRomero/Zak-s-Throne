/* Más dimensión de Zak: Patio de las Gárgolas, Biblioteca del Rey Mago y Feria de las Almas.
   Enemigos nuevos (libros voladores, duendes ilusionistas, gárgolas, sombras de Zak y mimics),
   runas en el piso, carpas para revisar y fogatas que se apagan. */
(function () {
'use strict';
const Z = window.Zak, distance = (a,b) => Math.hypot(a.x-b.x,a.y-b.y);
// Enemigos que maneja la IA de la dimensión (dimension.js). Los nuevos tienen su propia función.
Z.DIMENSION_AI = {mage:true,armor:true,book:true,imp:true,gargoyle:true,shadow:true,mimic:true};
Z.REALM_AI = {book:'bookAI',imp:'impAI',gargoyle:'gargoyleAI',shadow:'shadowAI',mimic:'mimicAI'};
// Runas: se prenden 2 s de cada 6. Pisar una prendida explota; pisar una apagada da +15% de daño 8 s.
const RUNE_CYCLE = Z.RUNE_CYCLE = 6, RUNE_LIT = Z.RUNE_LIT = 2, RUNE_REST = 12, RUNE_BLAST = .15;
// Carpas del Pueblo Mágico: se revisan cada 5 minutos. A veces adentro hay un mimic.
const TENT_REST = Z.TENT_REST = 300, MIMIC_CHANCE = Z.MIMIC_CHANCE = .15, EMPTY_CHANCE = .3;
const TENT_LOOT = Z.TENT_LOOT = [['coins',.35],['water',.15],['bandage',.15],['firecracker',.15],['arcane',.12],['elixir',.08]];
// Una fogata apagada vuelve a prender sola en 45 s; con un mago cerca, cuatro veces más rápido.
const FIRE_OUT = Z.FIRE_OUT = 45;

Z.runeLit = (o, time) => ((time + (o.phase || 0)) % RUNE_CYCLE) < RUNE_LIT;

// Se arma después de todo lo demás, para no cambiar los identificadores de lo que ya existía.
Z.buildRealm = function (world, object, path, spawn) {
 const left = Z.REALM_LEFT, right = 2400, top = Z.GARGOYLE_ZONE.y, bottom = top + Z.REALM_VIEW.h, mid = Z.LIBRARY_TOP, low = Z.SANCTUM_TOP;
 const cliff = (x,y,w,h,vertical) => object('cliff',x,y,w,h,true,{dark:true,...(vertical?{variant:1}:{})});
 // La pared este del Pueblo Mágico y del Santuario se abre en dos pasos.
 const east = world.objects.find(o => o.type==='cliff' && o.dark && o.x===Z.DIMENSION_ZONE.x+Z.DIMENSION_ZONE.w-19 && o.y===Z.DIMENSION_ZONE.y+22);
 const GATE_MAGIC = [2800,2860], GATE_SANCTUM = [3470,3530];
 if (east) {
  const x = east.x, end = east.y + east.h; east.h = GATE_MAGIC[0] - east.y;
  cliff(x, GATE_MAGIC[1], 19, GATE_SANCTUM[0] - GATE_MAGIC[1], true); cliff(x, GATE_SANCTUM[1], 19, end - GATE_SANCTUM[1], true);
 }
 // Bordes de las zonas nuevas y los muros que las separan, con un paso en el medio.
 cliff(left, top, right-left, 22); cliff(left, bottom-22, right-left, 22); cliff(right-19, top+22, 19, bottom-top-44, true);
 const DOOR = [1770,1830];
 for (const y of [mid-14, low-14]) { cliff(left, y, DOOR[0]-left, 22); cliff(DOOR[1], y, right-19-DOOR[1], 22); }
 const sign = (x,y,label,text) => object('sign',x,y,16,12,true,{label,text,dark:true});
 const rune = (x,y,phase) => object('rune',x,y,24,16,false,{phase});

 // Patio de las Gárgolas: estatuas que despiertan, sombras de Zak y vetas de cristal arcano.
 path(left, 2812, right-left-19, 40, 'rune'); path(DOOR[0]+5, 2852, 50, mid-2852, 'rune');
 sign(1240, 2780, 'Leer la inscripción', 'PATIO DE LAS GÁRGOLAS · No toques las estatuas. Las sombras de Zak copian lo que hacés. ↓ Biblioteca del Rey Mago.');
 for (const [x,y] of [[1350,2700],[1650,2660],[2000,2700],[2250,2760],[1500,2900]]) { object('pedestal',x-14,y-4,28,12,false); spawn('gargoyle',x,y); }
 [[1300,2890],[1960,2885],[2200,2650],[1740,2725],[2320,2895]].forEach(([x,y],i) => object('ore',x,y,28,20,true,{ore:'arcane',variant:i%3}));
 for (const [x,y] of [[1600,2770],[2100,2890],[1880,2650]]) spawn('shadow',x,y);
 [[1440,2822,0],[2060,2822,2],[1788,2900,4]].forEach(([x,y,ph]) => rune(x,y,ph));
 for (const [x,y] of [[1260,2640],[2340,2640],[1260,2920],[2150,2920]]) object('deadtree',x,y,16,12,true,{variant:x%3});
 for (const [x,y] of [[1450,2640],[2120,2770],[1560,2720]]) object('crystal',x,y,12,10,false,{variant:4});

 // Biblioteca del Rey Mago: estantes sueltos (no es un laberinto), atriles, libros voladores y duendes.
 path(DOOR[0]+5, mid+8, 50, low-mid-8, 'carpet');
 for (let x = 1230; x < 2340; x += 92) if (x+64 < DOOR[0]-30 || x > DOOR[1]+30) object('shelf',x,mid+18,64,18,true,{variant:Math.floor(x/92)%3});
 for (const x of [1300,1440,1580,1990,2130,2270]) object('shelf',x,3120,64,18,true,{variant:x%3});
 for (const [x,y] of [[1480,3250],[2110,3250],[1290,3030],[2310,3030]]) object('lectern',x,y,20,14,true);
 [[1650,3205,1],[1950,3205,3],[1788,3060,5]].forEach(([x,y,ph]) => rune(x,y,ph));
 sign(1840, 3280, 'Leer la inscripción', 'BIBLIOTECA DEL REY MAGO · Silencio. Los libros muerden y los duendes mienten: solo uno es el de verdad.');
 for (const [cx,cy] of [[1450,3050],[2150,3060],[1800,3170]]) for (const [dx,dy] of [[-24,-12],[24,-12],[-24,14],[24,14]]) spawn('book',cx+dx,cy+dy);
 for (const [x,y] of [[1350,3240],[2250,3240],[1640,3050]]) spawn('imp',x,y);

 // Feria de las Almas: segura, con vecinos de la dimensión y el Mercader del Vacío.
 path(left, 3482, 1100, 40, 'carpet'); path(DOOR[0]+5, low+8, 50, 3482-low-8, 'carpet');
 object('voidstall',1870,3422,44,16,true,{label:'Hablar con el Mercader del Vacío'});
 for (const [x,y] of [[1290,3370],[2280,3370],[1290,3590],[2280,3590]]) object('tent',x,y,44,30,true,{variant:Math.floor(x/7)%3,decor:true});
 for (const [x,y] of [[1420,3430],[2160,3430],[1420,3560],[2160,3560],[1700,3560],[1980,3400]]) object('brazier',x,y,12,10,true);
 object('trucotable',2040,3572,40,18,true);
 sign(1240, 3440, 'Leer el cartel de la feria', 'FERIA DE LAS ALMAS · Acá nadie pelea. El Mercader del Vacío compra y vende cosas que no hay del otro lado.');
 // En el Pueblo Mágico también hay runas, sobre los caminos.
 [[588,2790,1],[588,3140,4],[300,2962,2],[880,2962,5]].forEach(([x,y,ph]) => rune(x,y,ph));
 Z.addRealmPeople(world);
};

Object.assign(Z.Game.prototype, {
 // Runas, carpas, fogatas y copias del duende.
 updateRealm(dt) {
  const p = this.player, objects = this.world.objects;
  for (const o of objects) {
   if (o.type === 'tent' && o.searched > 0) o.searched = Math.max(0, o.searched - dt);
   if (o.type === 'rune' && o.rest > 0) o.rest = Math.max(0, o.rest - dt);
   if (o.type === 'campfire' && o.out > 0) {
    const mage = this.enemies.some(e => e.type === 'mage' && !e.dead && Math.hypot(e.x - o.x, e.y - o.y) < 140);
    o.out = Math.max(0, o.out - dt * (mage ? 4 : 1));
    if (o.out === 0) { this.effect(o.x + o.w/2, o.y, 'poof', .5, {seed: o.x}); if (this.biome === 'magic' && Math.hypot(p.x - o.x, p.y - o.y) < 260) this.sound.play('fire'); }
   }
  }
  // Las copias tienen la misma vida que el duende y desaparecen con él.
  for (const e of this.enemies) if (e.illusion && !e.dead) {
   const owner = this.enemies.find(m => m.id === e.owner);
   if (!owner || owner.dead || owner.biome !== this.biome) { e.dead = true; this.effect(e.x, e.y - 12, 'poof', .5, {seed: e.x}); continue; }
   e.hp = owner.hp; e.maxHp = owner.maxHp;
  }
  if (p.roll > 0 || !Z.isZakDimension(this.biome)) return;
  for (const o of objects) {
   if (o.type !== 'rune' || o.rest > 0 || Math.abs(p.x - (o.x + o.w/2)) > 12 || Math.abs(p.y - (o.y + o.h/2)) > 9) continue;
   o.rest = RUNE_REST; this.stepOnRune(o); if (this.state !== 'playing') return;
  }
 },
 stepOnRune(o) {
  const p = this.player, cx = o.x + o.w/2, cy = o.y + o.h/2;
  if (Z.runeLit(o, this.time)) {
   this.sound.play('boom'); this.shake(4, .25); this.effect(cx, cy, 'wave', .4, {radius: 34}); this.effect(cx, cy - 8, 'poof', .6, {seed: cx});
   this.hurtPlayer(this.stats().maxHealth * RUNE_BLAST, 'rune', false, {pierce: true});
   if (this.state === 'playing' && !this.player.invuln) this.emit('toast', {message: '¡Pisaste una runa prendida! Esperá a que se apague y pisala para potenciarte.', error: true});
  } else {
   p.buffs.rune = Z.BUFF_LIMITS.rune; this.sound.play('rune'); this.effect(cx, cy - 6, 'level', .9, {radius: 22});
   this.emit('toast', {message: 'Runa apagada: +15% de daño durante 8 s.'});
  }
 },
 // Revisar una carpa: guita, un consumible, cristal arcano, nada… o un mimic.
 searchTent(o) {
  const p = this.player; o.searched = TENT_REST;
  const roll = Math.random();
  if (roll < MIMIC_CHANCE) {
   const m = this.summon('mimic', o.x + o.w/2, o.y + o.h + 16, {id: 'tent-' + o.id, biome: Z.biomeAt(o.x + o.w/2, o.y + o.h + 16)});
   m.cooldown = 1; this.sound.play('roar'); this.shake(4, .3);
   this.emit('toast', {message: '¡No era un cofre! Un mimic salió de la carpa.', error: true}); return 'mimic';
  }
  if (roll < MIMIC_CHANCE + EMPTY_CHANCE) { this.emit('toast', {message: 'La carpa está vacía. Alguien pasó antes que vos.'}); return 'empty'; }
  let pick = Math.random() * TENT_LOOT.reduce((sum, [, w]) => sum + w, 0), found = TENT_LOOT[0][0];
  for (const [id, w] of TENT_LOOT) { if (pick < w) { found = id; break; } pick -= w; }
  this.sound.play('pickup');
  if (found === 'coins') { const n = 15 + Math.floor(Math.random() * 26); this.dropCoins(o.x + o.w/2, o.y + o.h + 8, n); this.emit('toast', {message: 'Adentro había un cofrecito con ◉ ' + n + '.'}); return found; }
  if (found === 'arcane') { p.materials.arcane = (p.materials.arcane || 0) + 1; this.emit('toast', {message: 'Encontraste 1 cristal arcano.'}); return found; }
  if (!this.addItem(found, 1)) { this.emit('toast', {message: 'Había ' + Z.ITEMS[found].name.toLowerCase() + ', pero tu bolsa está llena.'}); return 'full'; }
  this.emit('toast', {message: 'Encontraste ' + Z.ITEMS[found].icon + ' ' + Z.ITEMS[found].name + '. Va a la bolsa (B).'}); return found;
 },
 douseCampfire(o) {
  if (o.out > 0) return false;
  if (!this.useCharge('water')) { this.emit('toast', {message: 'Para apagarla necesitás agua bendita.', error: true}); return false; }
  o.out = FIRE_OUT; this.sound.play('splash'); this.effect(o.x + o.w/2, o.y - 4, 'poof', .8, {seed: o.x});
  this.emit('toast', {message: 'Fogata apagada. Si un mago anda cerca, la vuelve a prender.'}); return true;
 },
 realmAlert(e, len, sameZone, range) {
  const wasAlert = e.alert;
  e.alert = sameZone && !(e.charm > 0) && (e.summoned || e.provoked && len < range * 2 || len < range || (e.alert && len < range * 1.6));
  if (e.alert && !wasAlert) this.sound.play('alert');
  return e.alert;
 },
 idleDrift(e, dt, len, speed = .28) {
  e.act = null; this.steer(e, e.homeX + Math.sin(this.time * .2 + e.homeX) * 28, e.homeY + Math.cos(this.time * .15 + e.homeY) * 22, e.stats.moveSpeed * speed, dt, len);
 },
 // Libro volador: da vueltas alrededor tuyo y se tira en picada.
 bookAI(e, dt, len, sameZone) {
  const p = this.player, a = e.act;
  if (!this.realmAlert(e, len, sameZone, Z.ENEMY_TYPES.book.visionRange)) { this.idleDrift(e, dt, len, .4); return; }
  if (a) {
   a.t += dt;
   if (a.t < .35) { e.moving = false; return; }
   const before = {x: e.x, y: e.y}; this.move(e, a.dx * 270 * dt, a.dy * 270 * dt, 6, e.biome); e.moving = true;
   if (!a.hit && distance(e, p) < 16) { a.hit = true; this.hurtPlayer(e.stats.strength, e.type); }
   if (a.t > .75 || distance(before, e) < .5) { e.act = null; e.cooldown = 1.8 + Math.random() * 1.4; }
   return;
  }
  const orbit = this.time * 1.4 + (e.homeX + e.homeY) * .07, tx = p.x + Math.cos(orbit) * 58, ty = p.y + Math.sin(orbit) * 40;
  this.steer(e, tx, ty, e.stats.moveSpeed * .9, dt, 99);
  if (e.cooldown <= 0 && len < 110) { const l = len || 1; e.act = {id: 'dive', t: 0, dx: (p.x - e.x) / l, dy: (p.y - e.y) / l}; this.sound.play('swing'); }
 },
 // Duende ilusionista: se divide en tres (dos copias) y salta de lado.
 impAI(e, dt, len, sameZone) {
  const p = this.player;
  if (!this.realmAlert(e, len, sameZone, Z.ENEMY_TYPES.imp.visionRange)) { this.idleDrift(e, dt, len); return; }
  e.cd.split = (e.cd.split === undefined ? .8 : e.cd.split) - dt; e.cd.blink = (e.cd.blink === undefined ? 3 : e.cd.blink) - dt;
  if (!e.illusion && e.cd.split <= 0 && !this.enemies.some(m => m.illusion && m.owner === e.id && !m.dead)) {
   e.cd.split = 14; this.sound.play('teleport');
   const spots = [0, 1, 2].map(k => { const a = k * Math.PI * 2 / 3 + Math.random(); return this.freeSpot(e.x + Math.cos(a) * 46, e.y + Math.sin(a) * 34, e.biome); });
   spots.sort(() => Math.random() - .5);
   Object.assign(e, spots[0]); this.effect(e.x, e.y - 12, 'poof', .6, {seed: 3});
   for (const s of spots.slice(1)) { const m = this.summon('imp', s.x, s.y, e); Object.assign(m, {illusion: true, hp: e.hp, maxHp: e.maxHp, cd: {split: 99, blink: 2 + Math.random() * 2}}); }
   return;
  }
  if (e.cd.blink <= 0 && len < 70) {
   e.cd.blink = 3.5 + Math.random() * 2; const side = Math.random() < .5 ? -1 : 1, l = len || 1;
   const spot = this.freeSpot(e.x - (p.y - e.y) / l * 55 * side, e.y + (p.x - e.x) / l * 40 * side, e.biome);
   this.effect(e.x, e.y - 12, 'poof', .4, {seed: e.x}); Object.assign(e, spot); this.sound.play('teleport');
  }
  this.steer(e, p.x, p.y, e.stats.moveSpeed, dt, len);
  if (len < 22 && e.cooldown <= 0) {
   e.cooldown = e.stats.attackCooldown; this.sound.play('swing');
   this.hurtPlayer(e.stats.strength * (e.illusion ? .5 : 1), e.type);
  }
 },
 // Gárgola: estatua invulnerable hasta que te acercás o le pegás.
 gargoyleAI(e, dt, len, sameZone) {
  const p = this.player, a = e.act;
  if (e.statue === undefined) e.statue = true;
  if (e.statue) {
   e.moving = false; e.alert = false;
   if (sameZone && (len < Z.ENEMY_TYPES.gargoyle.visionRange || e.provoked)) {
    e.statue = false; e.provoked = true; e.alert = true; e.act = {id: 'wake', t: 0}; e.cd.dive = 1.5; e.away = 0;
    this.sound.play('crumble'); this.shake(3, .25); this.effect(e.x, e.y - 14, 'poof', .7, {seed: e.x});
   }
   return;
  }
  if (a && a.id === 'wake') { a.t += dt; if (a.t > .7) e.act = null; return; }
  // Si te alejás un buen rato, vuelve a su pedestal y se hace piedra otra vez.
  e.away = (!sameZone || len > 300) ? (e.away || 0) + dt : 0;
  if (e.away > 5) {
   const home = {x: e.homeX, y: e.homeY}; this.steer(e, home.x, home.y, e.stats.moveSpeed, dt, 999);
   if (distance(e, home) < 6 || e.away > 15) { Object.assign(e, home, {statue: true, provoked: false, alert: false, act: null, hp: e.maxHp}); this.effect(e.x, e.y - 14, 'poof', .6, {seed: 7}); }
   return;
  }
  e.alert = true;
  if (a && a.id === 'aim') { a.t += dt; e.moving = false; this.aimAt(e); if (a.t >= .6) { e.act = {id: 'dive', t: 0, dx: e.aimX, dy: e.aimY}; this.sound.play('swing'); } return; }
  if (a && a.id === 'dive') {
   a.t += dt; const before = {x: e.x, y: e.y}; this.move(e, a.dx * 290 * dt, a.dy * 290 * dt, 8, e.biome); e.moving = true;
   if (!a.hit && distance(e, p) < 20) { a.hit = true; if (this.hurtPlayer(e.stats.strength * 1.4, e.type)) this.shake(4, .2); }
   if (a.t > .5 || distance(before, e) < .5) { e.act = null; e.cd.dive = 3.5; e.cooldown = .6; }
   return;
  }
  e.cd.dive = (e.cd.dive || 0) - dt;
  this.steer(e, p.x, p.y, e.stats.moveSpeed, dt, len);
  if (e.cd.dive <= 0 && len > 60 && len < 220) { e.act = {id: 'aim', t: 0}; this.sound.play('telegraph'); return; }
  if (len < 24 && e.cooldown <= 0) { e.cooldown = e.stats.attackCooldown; this.sound.play('swing'); this.hurtPlayer(e.stats.strength, e.type); }
 },
 // Sombra de Zak: copia tu último ataque con demora y atraviesa las paredes.
 shadowAI(e, dt, len, sameZone) {
  const p = this.player, a = e.act;
  if (!this.realmAlert(e, len, sameZone, Z.ENEMY_TYPES.shadow.visionRange)) { this.idleDrift(e, dt, len); e.copied = this.lastStrike ? this.lastStrike.time : 0; return; }
  if (a) {
   a.t += dt; e.moving = false; this.aimAt(e);
   if (!a.done && a.t >= .55) {
    a.done = true; this.sound.play(a.ranged ? 'bow' : 'swing');
    if (a.ranged) this.projectiles.push({x: e.x + e.aimX * 12, y: e.y - 10 + e.aimY * 12, dx: e.aimX, dy: e.aimY, type: 'shadowbolt', hostile: true, damage: e.stats.strength, source: e.type, traveled: 0, range: 360});
    else { this.effect(e.x + e.aimX * 14, e.y - 8 + e.aimY * 14, 'slash', .22, {ang: Math.atan2(e.aimY, e.aimX), radius: 52}); if (len < 54) this.hurtPlayer(e.stats.strength * 1.2, e.type); }
   }
   if (a.t >= .9) e.act = null;
   return;
  }
  const strike = this.lastStrike;
  if (strike && strike.time > (e.copied || 0) && len < 260) {
   e.copied = strike.time; e.act = {id: 'mimic', t: 0, ranged: strike.weapon === 'bow' || strike.weapon === 'stone'}; return;
  }
  // Ronda alrededor tuyo a media distancia, sin chocar con nada.
  const orbit = this.time * .9 + e.homeX * .01, tx = p.x + Math.cos(orbit) * 46, ty = p.y + Math.sin(orbit) * 34, dx = tx - e.x, dy = ty - e.y, d = Math.hypot(dx, dy);
  if (d > 2) { const step = Math.min(d, e.stats.moveSpeed * dt), nx = e.x + dx / d * step, ny = e.y + dy / d * step; if (Z.biomeAt(nx, ny) === e.biome) { e.x = nx; e.y = ny; } e.moving = true; e.walk += dt * 9; e.dir = Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? 'right' : 'left') : (dy > 0 ? 'down' : 'up'); }
  // Si no atacás, igual cada tanto te tira un zarpazo.
  if (e.cooldown <= 0 && len < 60) { e.cooldown = 3.2; e.act = {id: 'mimic', t: 0, ranged: false}; }
 },
 // Mimic: lento, muerde fuerte y te frena.
 mimicAI(e, dt, len, sameZone) {
  const p = this.player;
  if (!this.realmAlert(e, len, sameZone, Z.ENEMY_TYPES.mimic.visionRange)) { e.moving = false; return; }
  this.steer(e, p.x, p.y, e.stats.moveSpeed, dt, len);
  if (len < 24 && e.cooldown <= 0) { e.cooldown = Math.max(1.2, e.stats.attackCooldown); this.sound.play('bite'); if (this.hurtPlayer(e.stats.strength * 1.3, e.type) && this.state === 'playing') p.slow = Math.max(p.slow, 2); }
 }
});
// Las gárgolas de piedra no reciben daño.
const baseShield = Z.Game.prototype.bossShield;
Z.Game.prototype.bossShield = function (e, source) {
 if (e.type === 'gargoyle' && e.statue !== false) return 'Es de piedra';
 return baseShield.call(this, e, source);
};
})();
