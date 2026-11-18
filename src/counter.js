/* Contragolpe: si rodás justo cuando un enemigo te pega, esquivás el golpe y le devolvés uno al instante
   que hace 2,5 veces el daño de tu arma. A los enemigos comunes además los empuja; a los jefes, no.
   Sale una vez por rodada y el personaje brilla dorado. No guarda nada en la partida. */
(function () {
'use strict';
const Z = window.Zak;
const C = Z.COUNTER = {multiplier: 2.5, push: 46, glow: .6, reach: 40};
const P = Z.Game.prototype;
const isBoss = e => !!(Z.ENEMY_TYPES[e.type] && Z.ENEMY_TYPES[e.type].boss);

// El daño de un golpe normal con el arma que tenés en la mano (sin crítico).
P.weaponDamage = function () {
 const stats = this.stats(), weapon = Z.WEAPON_TYPES[this.player.weapon];
 return stats.power * weapon.damageMultiplier * stats.damageMultiplier * this.weaponLevelMultiplier();
};
// Quién te tiró el golpe: el enemigo vivo más cercano de ese tipo, si está al alcance de tu arma.
P.counterTarget = function (source) {
 if (!source || !Z.ENEMY_TYPES[source]) return null;
 const p = this.player, weapon = Z.WEAPON_TYPES[p.weapon], reach = Math.max(60, weapon.range || 0) + C.reach;
 let best = null, bestDistance = reach;
 for (const e of this.enemies) {
  if (e.type !== source || e.dead || e.latched > 0 || e.biome !== this.biome) continue;
  const d = Math.hypot(e.x - p.x, e.y - p.y);
  if (d <= bestDistance) { best = e; bestDistance = d; }
 }
 return best;
};
P.counterStrike = function (source) {
 const p = this.player;
 if (this.counterUsed || this.state !== 'playing') return false;
 const e = this.counterTarget(source);
 if (!e) return false;
 this.counterUsed = true; this.counterGlow = C.glow;
 const dx = e.x - p.x, dy = e.y - p.y, len = Math.hypot(dx, dy) || 1;
 this.effect(p.x + dx / len * 22, p.y - 7 + dy / len * 22, 'slash', .22, {dir: this.dirOf(dx / len, dy / len), radius: 40, own: true});
 this.effect(p.x, p.y - 42, 'level', 1, {text: '¡Contragolpe!'});
 this.sound.play('crit'); this.shake(3, .2);
 this.hitEnemy(e, this.weaponDamage() * C.multiplier, false, true, 'counter');
 // A los comunes los empuja; los jefes no se mueven.
 if (!e.dead && !isBoss(e)) this.move(e, dx / len * C.push, dy / len * C.push, 8, e.biome);
 return true;
};

// Cada rodada nueva habilita un contragolpe.
const baseRoll = P.roll;
P.roll = function () {
 const before = this.player ? this.player.roll || 0 : 0, result = baseRoll.apply(this, arguments);
 if (this.player && (this.player.roll || 0) > before) this.counterUsed = false;
 return result;
};
// Se esquiva igual que antes; si había alguien que te pegó, además sale el contragolpe.
const baseHurt = P.hurtPlayer;
P.hurtPlayer = function (raw, source, poison = false, opts = {}) {
 const p = this.player;
 const dodged = this.state === 'playing' && !Z.isSafe(this.biome) && !(p.invuln > 0) && !poison && !opts.unavoidable && p.roll > 0;
 const result = baseHurt.apply(this, arguments);
 if (dodged && !result) this.counterStrike(source);
 return result;
};
const baseUpdate = P.update;
P.update = function (dt) {
 const result = baseUpdate.apply(this, arguments);
 if (this.counterGlow > 0) this.counterGlow = Math.max(0, this.counterGlow - (Number.isFinite(dt) ? dt : 0));
 return result;
};
})();
