/* El vendedor ambulante: aparece de vez en cuando en alguna zona peligrosa (nunca en las aldeas), se queda un rato
   y se va. Vende cosas raras y curas, todo carísimo. Comprarle algo da la medalla «Me siento estafado...».
   Cuándo y dónde aparece sale del reloj de la partida: no se guarda nada nuevo. */
(function () {
'use strict';
const Z = window.Zak;
const finite = n => Number.isFinite(Number(n)) ? Number(n) : 0;
// Cada 7 minutos de juego hay un 60% de que aparezca; llega al minuto y medio y se queda 3 minutos y medio.
const W = Z.WANDERER = {block: 420, chance: .6, arrive: 90, stay: 210, name: 'Don Anselmo', stock: 3,
 spots: [
  {x: 1960, y: 640, zone: 'weeds'}, {x: 2240, y: 1290, zone: 'weeds'},
  {x: -430, y: 930, zone: 'altar'}, {x: -610, y: 1520, zone: 'altar'},
  {x: 520, y: 330, zone: 'cave'}, {x: 640, y: 2230, zone: 'cave2'}, {x: 1700, y: 2190, zone: 'cave3'}
 ]};
const seedOf = id => { let h = 2166136261; for (const ch of String(id || 'zak')) h = Math.imul(h ^ ch.charCodeAt(0), 16777619); return h >>> 0; };
const roll = (a, b, c = 0) => { let n = Math.imul(a + 7919, 374761393) ^ Math.imul(b + 104729, 668265263) ^ Math.imul(c + 31, 2246822519); n = Math.imul(n ^ n >>> 13, 1274126177); return ((n ^ n >>> 16) >>> 0) / 4294967296; };
// ¿Está el ambulante? Devuelve {visit, spot, left (segundos que le quedan)} o null.
Z.wandererAt = function (playTime, runId, luck = 0) {
 const t = Math.max(0, finite(playTime)), visit = Math.floor(t / W.block), seed = seedOf(runId);
 if (visit < 1 || roll(visit, seed) >= Z.withLuck(W.chance, luck)) return null;
 const into = t - visit * W.block; if (into < W.arrive || into >= W.arrive + W.stay) return null;
 return {visit, spot: W.spots[Math.floor(roll(visit, seed, 1) * W.spots.length)], left: W.arrive + W.stay - into};
};
// Lo raro que trae en cada visita: tres cosas al azar de esta lista, a precio de estafa.
const RARE = [
 {id: 'buy:dorado', price: 900}, {id: 'buy:elixir', price: 450}, {id: 'buy:scroll', price: 260}, {id: 'buy:water', price: 200},
 {id: 'offering:fang', price: 1600, name: 'Colmillo Tóxico'}, {id: 'offering:ring', price: 3000, name: 'Anillo de la mafia'}, {id: 'offering:claw', price: 3000, name: 'Garra Sangrienta'},
 {id: 'offering:elemental', price: 6500, name: 'Piedra Elemental'}, {id: 'offering:eye', price: 6500, name: 'Ojo del alma'},
 {id: 'mat:diamond', price: 900, amount: 3}, {id: 'mat:gold', price: 500, amount: 4},
 {id: 'amulet:horseshoe', price: 5000}, {id: 'amulet:medal', price: 5000}, {id: 'amulet:fang', price: 7000}
];
// Curas: siempre las tiene, y caras.
const HEALS = [
 {id: 'heal', icon: '❤', name: 'Curación completa', detail: 'Te deja con toda la vida. «Receta de mi abuela.»', price: p => 220 + 12 * Math.max(0, finite(p.level) - 1)},
 {id: 'cure', icon: '✚', name: 'Sacarte los males', detail: 'Te saca el veneno, el desangrado y la quemadura. «No preguntes qué tiene.»', price: () => 160}
];
const MAT_NAMES = {diamond: 'Diamante', gold: 'Oro'};
Z.wandererStock = function (visit, runId) {
 const seed = seedOf(runId), pool = RARE.map((r, i) => ({r, k: roll(visit, seed, 10 + i)})).sort((a, b) => a.k - b.k);
 return pool.slice(0, W.stock).map(x => x.r);
};
const NPC_ID = 'wanderer';
const look = {skin: '#c99a72', skinShade: '#a77a55', top: '#5a4632', topShade: '#43331f', topLight: '#7a6248', legs: '#3a3026', legsShade: '#2a221a', shoe: '#2a1f18', hair: '#8a8070', hairStyle: 'short', beard: '#8a8070', hood: true, pack: '#7a5a2a', sash: '#b5383f'};
const LINES = ['Pasá, pasá, que no muerdo. Todo original, eh. Bueno, casi todo.',
 'Lo barato sale caro, amigo. Por eso yo vendo directamente caro: te ahorro el paso.',
 'No me quedo mucho en ningún lado. Los clientes... se enojan.'];

const P = Z.Game.prototype;
Object.assign(P, {
 wanderer() { return Z.wandererAt(this.player.playTime, this.player.runId, this.luck()); },
 // Pone o saca al ambulante del mapa según el reloj.
 syncWanderer() {
  const npcs = this.world.npcs, now = this.wanderer(), old = npcs.find(n => n.id === NPC_ID), key = now ? now.visit : null;
  if (old && (!now || old.visit !== key)) npcs.splice(npcs.indexOf(old), 1);
  if (now && (!old || old.visit !== key)) {
   const s = now.spot;
   npcs.push({id: NPC_ID, name: W.name, shop: 'wanderer', visit: key, label: 'Hablar con ' + W.name + ', el vendedor ambulante', x: s.x, y: s.y, homeX: s.x, homeY: s.y, targetX: s.x, targetY: s.y,
    dir: 'down', walk: 0, moving: false, wait: 2, roam: [10, 5], rest: [3, 7], speed: 22, look, lines: LINES});
  }
  const here = !!now && now.spot.zone === this.biome;
  // Al empezar o cargar una partida solo anota la visita de ahora: el aviso es para las que llegan después.
  if (this.wandererSeen === undefined) this.wandererSeen = key;
  else if (key !== this.wandererSeen) {
   if (now && !here && this.state === 'playing') this.emit('toast', {message: 'Dicen que anda un vendedor ambulante por ' + (Z.BIOME_NAMES[now.spot.zone] || 'ahí') + '... y que no se queda mucho.'});
   this.wandererSeen = key;
  }
  // Campanitas: cuando llega a la zona donde estás, o cuando entrás a la zona donde está él.
  const bell = here ? key : null;
  if (bell !== (this.wandererBell === undefined ? null : this.wandererBell) && (bell === null || this.state === 'playing')) {
   if (bell !== null) { this.sound.play('bells'); this.emit('toast', {message: '🔔 Se escuchan campanitas: ' + W.name + ', el vendedor ambulante, anda por esta zona... y no se queda mucho.'}); }
   this.wandererBell = bell;
  }
 },
 wandererOffers() {
  const p = this.player, now = this.wanderer(); if (!now) return [];
  const list = HEALS.map(h => ({id: h.id, kind: 'buy', icon: h.icon, name: h.name, detail: h.detail, cost: {coins: h.price(p), materials: {}}, done: false}));
  // El Dado cargado: siempre lo tiene. «No está cargado. Bueno, un poquito.»
  const dice = Z.AMULETS.dice; list.push({id: 'amulet:dice', kind: 'buy', icon: dice.icon, name: dice.name, detail: 'Amuleto: ' + dice.detail + ' «No está cargado. Bueno, un poquito.»', cost: {coins: Z.LUCK.price, materials: {}}, done: this.hasAmuletOwned('dice'), doneText: 'Ya lo tenés'});
  for (const r of Z.wandererStock(now.visit, p.runId)) {
   const [kind, id] = r.id.split(':');
   if (kind === 'buy') { const item = Z.ITEMS[id]; list.push({id: r.id, kind: 'buy', icon: item.icon, name: item.name, detail: item.detail, cost: {coins: r.price, materials: {}}, done: this.itemCount(id) >= Z.ITEM_STACK, doneText: 'Bolsa llena', note: 'En la bolsa: ' + this.itemCount(id) + '/' + Z.ITEM_STACK}); }
   if (kind === 'offering') { const o = Z.OFFERINGS[id]; list.push({id: r.id, kind: 'buy', icon: o.icon, name: o.name, detail: 'Ofrenda de jefe. «La encontré tirada, te juro.»', cost: {coins: r.price, materials: {}}, done: false, note: 'Tenés: ' + finite(p.offerings && p.offerings[id])}); }
   if (kind === 'mat') list.push({id: r.id, kind: 'buy', icon: id === 'diamond' ? '💎' : '🪙', name: MAT_NAMES[id] + ' ×' + r.amount, detail: 'Material. «Recién sacado de la mina... de alguien.»', cost: {coins: r.price, materials: {}}, done: false});
   if (kind === 'amulet') { const a = Z.AMULETS[id]; list.push({id: r.id, kind: 'buy', icon: a.icon, name: a.name, detail: 'Amuleto: ' + a.detail, cost: {coins: r.price, materials: {}}, done: this.hasAmuletOwned(id), doneText: 'Ya lo tenés'}); }
  }
  return list.map(o => ({...o, missing: this.missingFor(o.cost)}));
 },
 wandererTrade(offerId) {
  const p = this.player, offer = this.wandererOffers().find(o => o.id === offerId);
  if (!offer) return {ok: false, message: '«Eso ya lo vendí. Si querés, te consigo otro... por el doble.»'};
  if (offer.done) return {ok: false, message: offer.doneText + '.'};
  if (offer.missing.length) return {ok: false, message: '«Sin guita no hay negocio, amigo.» Te falta: ' + offer.missing.join(', ') + '.'};
  const max = this.stats().maxHealth;
  if (offerId === 'heal' && p.hp >= max - 1e-6) return {ok: false, message: '«Estás sano como un roble. Igual te lo cobro si querés.» Mejor no.'};
  if (offerId === 'cure' && !p.poison && !p.bleed && !p.burn) return {ok: false, message: 'No tenés ningún mal para sacarte.'};
  p.coins -= offer.cost.coins; this.sound.play('buy');
  const [kind, id] = offerId.split(':');
  if (offerId === 'heal') { p.hp = max; this.effect(p.x, p.y - 22, 'heart', 1.2); }
  else if (offerId === 'cure') { p.poison = null; p.bleed = null; p.burn = null; }
  else if (kind === 'buy') this.addItem(id, 1);
  else if (kind === 'offering') p.offerings[id] = finite(p.offerings[id]) + 1;
  else if (kind === 'mat') p.materials[id] = finite(p.materials[id]) + (RARE.find(r => r.id === offerId).amount || 1);
  else if (kind === 'amulet') this.grantAmulet(id);
  if (this.awardMedal) this.awardMedal('scam');
  this.emit('progress');
  return {ok: true, message: offer.name + ': ¡listo! «Un placer hacer negocios con vos.»'};
 }
});
const baseOffers = P.npcOffers, baseTrade = P.npcTrade, baseHint = P.npcMenuHint;
P.npcOffers = function (n) { return this.npcShop(n) === 'wanderer' ? this.wandererOffers() : baseOffers.call(this, n); };
P.npcTrade = function (n, offerId) { return this.npcShop(n) === 'wanderer' ? this.wandererTrade(offerId) : baseTrade.call(this, n, offerId); };
P.npcMenuHint = function (n) { return this.npcShop(n) === 'wanderer' ? 'vende cosas raras (y caras)' : baseHint.call(this, n); };
Z.UPDATERS = Z.UPDATERS || []; Z.UPDATERS.push(function () { this.syncWanderer(); });
const baseNew = P.newGame;
P.newGame = function (id) { this.wandererSeen = undefined; this.wandererBell = undefined; return baseNew.call(this, id); };
const baseRestore = P.restoreInventory;
P.restoreInventory = function (p, source) { baseRestore.call(this, p, source); this.wandererSeen = undefined; this.wandererBell = undefined; };
})();
