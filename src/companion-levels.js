/* Niveles de los compañeros (v2.25). Suben con los enemigos que vencés mientras te acompañan, hasta el nivel 10.
   La idea es que ayuden un poco: el daño casi no crece; lo que mejora son sus efectos (duran más y salen más seguido),
   y al nivel 5 aprenden una habilidad que no hace daño. Al nivel 10 brillan y dan una medalla. */
(function () {
'use strict';
const Z = window.Zak;
const finite = n => Number.isFinite(Number(n)) ? Number(n) : 0;
const distance = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);
const isBoss = e => !!(Z.ENEMY_TYPES[e.type] && Z.ENEMY_TYPES[e.type].boss);
// `damage`: +1,5% de daño por nivel (+13,5% al 10). `cooldown`: especiales 3% más seguido por nivel. `effect`: efectos 4% más largos por nivel.
// `xp`: experiencia para pasar del nivel n al n+1. `assist`: parte de la experiencia si el compañero no le pegó a ese enemigo.
const L = Z.PET_LEVELS = {max: 10, damage: .015, cooldown: .03, effect: .04, xp: n => 400 * n, assist: .4, skillAt: 5, skillEvery: 24,
 howl: {radius: 100, time: 3}, coil: {time: 2.5, bossTime: 1}, rocks: {radius: 55, time: 1.5, bossTime: .6, hit: .3}, leech: .3,
 train: {price: n => 150 * n, part: .5}};
Z.PET_SKILLS = {
 dog: {name: 'Aullido', detail: 'Aúlla y los enemigos comunes de alrededor se asustan: huyen y no atacan durante 3 s. A los jefes no les hace nada.'},
 bat: {name: 'Sangre compartida', detail: 'Lo que desangra te cura: cada segundo del desangrado te devuelve un 30% de ese daño.'},
 snake: {name: 'Abrazo', detail: 'Se enrosca a un enemigo y lo deja quieto 2,5 s (a los jefes, 1 s; a Zak, nada). No le saca vida.'},
 golem: {name: 'Avalancha', detail: 'Hace caer piedras alrededor de un enemigo: los de ahí quedan aturdidos 1,5 s (los jefes, 0,6 s; Zak, nada). Pegan poquito.'}
};

const P = Z.Game.prototype;
Object.assign(P, {
 petLevel(id) { const pet = this.player.pets && this.player.pets[id]; return pet ? Math.max(1, Math.min(L.max, Math.floor(finite(pet.level) || 1))) : 0; },
 petXp(id) { const pet = this.player.pets && this.player.pets[id]; return pet ? Math.max(0, finite(pet.xp)) : 0; },
 petFactor(id, kind) { return 1 + L[kind] * (Math.max(1, this.petLevel(id)) - 1) * (kind === 'cooldown' ? -1 : 1); },
 // Suma experiencia al compañero; devuelve cuántos niveles subió.
 petGainXp(id, amount) {
  const pet = this.player.pets && this.player.pets[id]; if (!pet || amount <= 0) return 0;
  pet.level = this.petLevel(id); pet.xp = this.petXp(id) + amount; let ups = 0;
  while (pet.level < L.max && pet.xp >= L.xp(pet.level)) { pet.xp -= L.xp(pet.level); pet.level++; ups++; }
  if (pet.level >= L.max) pet.xp = 0;
  if (ups) {
   const name = this.petName(id), lv = pet.level;
   if (this.pet && this.pet.id === id) { this.effect(this.pet.x, this.pet.y - 30, 'miss', 1.4, {text: '¡Nivel ' + lv + '!'}); this.effect(this.pet.x, this.pet.y - 16, 'heart', 1.2); }
   this.sound.play('legend');
   this.emit('toast', {message: Z.PETS[id].icon + ' ¡' + name + ' subió al nivel ' + lv + '!' + (lv === L.skillAt ? ' Aprendió «' + Z.PET_SKILLS[id].name + '»: ' + Z.PET_SKILLS[id].detail : lv === L.max ? ' Llegó al máximo: ya son uña y carne.' : ' Sus efectos duran un poco más y salen más seguido.')});
   if (lv >= L.max && this.awardMedal) this.awardMedal('bestfriend');
   this.emit('progress');
  }
  return ups;
 },
 // Doña Herminia entrena a los que esperan en la guardería: medio nivel por vez.
 trainPet(id) {
  const p = this.player; if (!this.ownsPet(id)) return {ok: false, message: 'Ese compañero no es tuyo.'};
  if (p.pet === id) return {ok: false, message: '«Al que llevás con vos lo entrenás vos, querido.»'};
  const lv = this.petLevel(id); if (lv >= L.max) return {ok: false, message: '«A ' + this.petName(id) + ' ya no le puedo enseñar nada más.»'};
  const price = L.train.price(lv); if (p.coins < price) return {ok: false, message: 'Te faltan ◉ ' + (price - p.coins) + '.'};
  p.coins -= price; this.sound.play('buy'); this.petGainXp(id, Math.ceil(L.xp(lv) * L.train.part));
  return {ok: true, message: '«Lo hice correr toda la tarde por el patio.» ' + this.petName(id) + ': nivel ' + this.petLevel(id) + '.'};
 },
 // Habilidad del nivel 5. Devuelve true si la usó.
 petSkill(pet) {
  const p = this.player, id = pet.id; if (this.petLevel(id) < L.skillAt || Z.isSafe(this.biome)) return false;
  const fighting = this.enemies.filter(e => this.petCanHit(e) && e.alert && distance(e, p) < 220);
  if (!fighting.length) return false;
  const eff = this.petFactor(id, 'effect');
  if (id === 'dog') {
   const scared = this.enemies.filter(e => this.petCanHit(e) && !isBoss(e) && distance(e, p) <= L.howl.radius); if (!scared.length) return false;
   for (const e of scared) { const t = L.howl.time * eff; e.charm = Math.max(e.charm || 0, t); e.feared = Math.max(e.feared || 0, t); e.latched = 0; e.act = null; e.telegraph = 0; e.dash = 0; this.effect(e.x, e.y - 30, 'miss', .9, {text: '¡!'}); }
   this.effect(pet.x, pet.y - 24, 'miss', 1.2, {text: '¡Auuuu!'}); this.effect(p.x, p.y, 'wave', .6, {radius: L.howl.radius}); this.sound.play('woof'); return true;
  }
  if (id === 'snake') {
   const e = fighting.filter(m => m.type !== 'zak').sort((a, b) => distance(a, pet) - distance(b, pet))[0]; if (!e) return false;
   const t = (isBoss(e) ? L.coil.bossTime : L.coil.time) * eff; e.stun = Math.max(e.stun || 0, t); if (!isBoss(e)) { e.act = null; e.dash = 0; e.telegraph = 0; }
   e.coiled = t; this.effect(e.x, e.y - 30, 'miss', 1.1, {text: '¡Abrazo de serpiente!'}); this.sound.play('drain'); return true;
  }
  if (id === 'golem') {
   const e = fighting.sort((a, b) => distance(a, p) - distance(b, p))[0];
   this.effect(e.x, e.y, 'avalanche', .9, {seed: Math.random() * 99, radius: L.rocks.radius}); this.shake(3, .25); this.sound.play('crumble');
   for (const m of this.enemies) if (this.petCanHit(m) && Math.hypot(m.x - e.x, (m.y - e.y) / .75) <= L.rocks.radius) {
    if (m.type !== 'zak') { m.stun = Math.max(m.stun || 0, (isBoss(m) ? L.rocks.bossTime : L.rocks.time) * eff); if (!isBoss(m)) { m.act = null; m.dash = 0; m.telegraph = 0; } }
    this.hitEnemy(m, this.petDamage('golem') * L.rocks.hit, false, false, 'pet');
   }
   this.effect(e.x, e.y - 40, 'miss', 1.1, {text: '¡Avalancha!'}); return true;
  }
  return false; // el murciélago la tiene siempre puesta
 }
});

// Daño: casi no crece con el nivel.
const basePetDamage = P.petDamage;
P.petDamage = function (id) { return basePetDamage.call(this, id) * this.petFactor(id, 'damage'); };
// Especiales: duran más y salen más seguido.
const baseStrike = P.petStrike;
P.petStrike = function (pet, e) {
 const before = pet.special, bleed = e.bleeding, venom = e.venom, stun = e.stun || 0;
 const r = baseStrike.call(this, pet, e);
 if (before <= 0 && pet.special > 0) {
  const id = pet.id, eff = this.petFactor(id, 'effect');
  pet.special *= this.petFactor(id, 'cooldown');
  if (id === 'dog' && e.stun > stun) e.stun = stun + (e.stun - stun) * eff;
  if (id === 'bat' && e.bleeding && e.bleeding !== bleed) { e.bleeding.time *= eff; if (this.petLevel(id) >= L.skillAt) e.bleeding.leech = true; }
  if (id === 'snake' && e.venom && e.venom !== venom) e.venom.time *= eff;
 }
 return r;
};
// Qué enemigos tocó el compañero (para darle toda la experiencia).
const baseHit = P.hitEnemy;
P.hitEnemy = function (e, damage, ...rest) { if (rest[2] === 'pet' && e) e.petHit = true; return baseHit.call(this, e, damage, ...rest); };
// Murciélago, nivel 5: el desangrado te cura.
const baseAilments = P.updateEnemyAilments;
P.updateEnemyAilments = function (dt) {
 const leeching = this.enemies.filter(e => !e.dead && e.bleeding && e.bleeding.leech && e.bleeding.tick - dt <= 1e-8).map(e => e.bleeding.damage);
 baseAilments.call(this, dt);
 if (!leeching.length || this.state !== 'playing') return;
 const p = this.player, max = this.stats().maxHealth, heal = leeching.reduce((a, b) => a + b, 0) * L.leech;
 if (p.hp < max) { p.hp = Math.min(max, p.hp + heal); this.effect(p.x, p.y - 32, 'heal', .7, {text: '+' + this.number(heal)}); }
};
// Golemsín: el escudo dura más y sale más seguido; habilidad del nivel 5 y miedo del aullido.
const baseUpdate = P.updatePets;
P.updatePets = function (dt) {
 const pet = this.pet, shieldBefore = pet ? pet.shieldCd : 0;
 for (const e of this.enemies) if (e.feared > 0) e.feared = Math.max(0, e.feared - dt);
 baseUpdate.call(this, dt);
 const now = this.pet; if (!now || now !== pet || this.state !== 'playing') return;
 if (now.id === 'golem' && shieldBefore <= 0 && now.shieldCd > 0) {
  const p = this.player, extra = Z.PET_GOLEM.shield * (this.petFactor('golem', 'effect') - 1);
  now.shieldCd *= this.petFactor('golem', 'cooldown'); p.invuln = (p.invuln || 0) + extra; p.stoneShield = (p.stoneShield || 0) + extra;
 }
 now.skill = (now.skill === undefined ? 4 : now.skill) - dt;
 if (now.skill <= 0 && now.eat <= 0) now.skill = this.petSkill(now) ? L.skillEvery * this.petFactor(now.id, 'cooldown') : 1;
};
// Experiencia: la de cada enemigo vencido mientras te acompaña (toda si le pegó, una parte si no).
const baseKill = P.onKill;
P.onKill = function (e) {
 const r = baseKill.call(this, e), p = this.player, pet = this.pet;
 if (pet && p.pet === pet.id && this.ownsPet(pet.id) && e.biome === this.biome && !e.illusion && distance(pet, p) < 320) {
  const xp = finite(e.stats && e.stats.xp) * (e.petHit ? 1 : L.assist);
  this.petGainXp(pet.id, Math.round(xp));
 }
 e.petHit = false;
 return r;
};
const baseEnsure = P.ensurePet;
P.ensurePet = function () { const pet = baseEnsure.call(this); if (pet && pet.skill === undefined) pet.skill = 4; return pet; };
// Guardados: el nivel y la experiencia van con cada compañero. Las partidas de antes arrancan en el nivel 1.
const baseRestore = P.restoreInventory;
P.restoreInventory = function (p, source) {
 baseRestore.call(this, p, source);
 const src = source.pets && typeof source.pets === 'object' ? source.pets : {};
 for (const id of Object.keys(p.pets || {})) {
  const s = src[id] || {}, level = Math.max(1, Math.min(L.max, Math.floor(finite(s.level) || 1)));
  p.pets[id].level = level; p.pets[id].xp = level >= L.max ? 0 : Math.max(0, Math.min(L.xp(level) - 1, finite(s.xp)));
 }
};
const baseTame = P.tamePet;
P.tamePet = function (id) { const r = baseTame.call(this, id); if (r && this.player.pets[id]) Object.assign(this.player.pets[id], {level: this.petLevel(id) || 1, xp: this.petXp(id)}); return r; };

/* ---------- Dibujo ---------- */
const D = () => Z.Draw, Px = Z.Pixel;
// Nivel 10: brillitos dorados alrededor del compañero. Asustados por el aullido: gotitas de sudor.
const baseExtras = Z.extraRenderables;
Z.extraRenderables = function (game, visible, time) {
 const list = baseExtras ? baseExtras(game, visible, time) : [];
 const pet = game.pet;
 if (pet && game.petLevel && game.petLevel(pet.id) >= L.max && visible(pet.x, pet.y, 40)) list.push({y: pet.y + .6, kind: 'custom', draw: (c, t) => {
  const {rect} = D();
  for (let k = 0; k < 4; k++) { const a = t * 2.2 + k * Math.PI / 2, x = pet.x + Math.cos(a) * 11, y = pet.y - 10 + Math.sin(a) * 5 - (pet.id === 'bat' ? 12 : 0), on = Math.sin(t * 6 + k * 2) > 0;
   c.globalAlpha = on ? 1 : .5; rect(c, x, y, 1, 1, '#fff0a6'); if (on) { rect(c, x - 1, y, 3, 1, '#e2b23c'); rect(c, x, y - 1, 1, 3, '#e2b23c'); } }
  c.globalAlpha = 1;
 }});
 for (const e of game.enemies || []) if (e.feared > 0 && !e.dead && visible(e.x, e.y, 30)) list.push({y: e.y + .5, kind: 'custom', draw: (c, t) => {
  const {rect} = D(), drop = (t * 2 + e.x * .01) % 1; c.globalAlpha = 1 - drop; rect(c, e.x + 8, e.y - 30 + drop * 8, 2, 3, '#8fd0ff'); rect(c, e.x + 9, e.y - 31 + drop * 8, 1, 1, '#d8f0ff'); c.globalAlpha = 1;
 }});
 return list;
};
// Avalancha del Golemsín: piedras que caen en el círculo.
const baseEffect = Z.drawExtraEffect;
Z.drawExtraEffect = function (c, e, time, progress) {
 if (e.type === 'avalanche') {
  const {rect, hash} = D(), r = e.radius || 50, seed = (e.seed || 0) | 0;
  c.globalAlpha = (1 - progress) * .35; Px.oval(c, e.x, e.y, r, r * .75, '#3a2e22'); c.globalAlpha = 1 - progress * .6;
  for (let k = 0; k < 9; k++) {
   const a = hash(k, seed, 1) * Math.PI * 2, d = Math.sqrt(hash(k, seed, 2)) * r * .85, x = e.x + Math.cos(a) * d, y = e.y + Math.sin(a) * d * .75;
   const fall = Math.max(0, 1 - (progress * 1.6 - hash(k, seed, 3) * .5)), s = 3 + Math.round(hash(k, seed, 4) * 3);
   rect(c, x - s / 2, y - s - fall * 70, s, s, '#8a8f96'); rect(c, x - s / 2, y - s - fall * 70, s, 1, '#b8bcc2');
   if (fall < .1) rect(c, x - 3, y - 1, 6, 2, '#5a4632');
  }
  return true;
 }
 return baseEffect ? baseEffect(c, e, time, progress) : false;
};
})();
