/* Bosque profundo (v2.41): una zona de la dimensión normal, cerrada, llena de árboles y de un verde oscuro.
   Se entra por un sendero en el borde este de Los Yuyos. Hay monos en los árboles que te saltan encima
   (no se les puede pegar), caníbales con lanza que andan de a 2 o 3 y te pueden robar algo al noquearte,
   árboles frutales (banana, mango y coco) y Monin, un mono que se domestica con 10 bananas y 2 vendas.
   Todo se agrega al final del mapa: no mueve ninguna veta ni árbol de los que recuerdan las partidas guardadas. */
(function () {
'use strict';
const Z = window.Zak, Px = Z.Pixel, D = () => Z.Draw;
const R = (c, x, y, w, h, col) => Px.rect(c, x, y, w, h, col), POLY = (c, pts, col) => Px.poly(c, pts, col);
const finite = n => Number.isFinite(Number(n)) ? Number(n) : 0, clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const distance = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);
const isBoss = e => !!(Z.ENEMY_TYPES[e.type] && Z.ENEMY_TYPES[e.type].boss);

// La zona: abajo de La guardería, aislada. Se llega solo por el sendero de Los Yuyos.
const ZONE = Z.FOREST_ZONE = {x: -780, y: 3080, w: 760, h: 600};
const INSIDE = {x: -120, y: 3600}, OUTSIDE = {x: 2290, y: 1482};
const inForest = (x, y) => x >= ZONE.x && x < ZONE.x + ZONE.w && y >= ZONE.y && y < ZONE.y + ZONE.h;
const baseBiome = Z.biomeAt;
Z.biomeAt = function (x, y) { return inForest(x, y) ? 'forest' : baseBiome(x, y); };
Z.ENCLOSED_ZONES.forest = ZONE;
Z.BIOME_NAMES.forest = 'Bosque profundo';
// Es de este mundo: hay día, noche y clima.
const baseOutdoors = Z.isOutdoors;
Z.isOutdoors = biome => biome === 'forest' || (baseOutdoors ? baseOutdoors(biome) : false);

// Caníbales: la vida de un chorro, pero pegan más. Lanza de media distancia, avisada.
Z.ENEMY_TYPES.cannibal = {
 name: 'Caníbal', base: {health: 100, strength: 8, speed: 20, endurance: 12},
 growth: {health: 1.5, strength: .9, speed: .8, endurance: 1},
 xp: 65, coins: [6, 11], color: '#7a5038', visionRange: 200, knockback: true,
 description: 'Andan de a 2 o 3 con lanzas: apuntan y la clavan a media distancia. Con poca vida, a veces huyen. Si te noquean, a veces te roban algo que llevás encima.'
};
Z.DIMENSION_AI.cannibal = true; Z.REALM_AI.cannibal = 'cannibalAI';
if (Z.BESTIARY) {
 Z.BESTIARY.cannibal = {like: 'al caníbal', story: 'Llegaron al Bosque profundo antes que la aldea y nunca se fueron. Se pintan con barro blanco, cazan de a dos o tres y clavan la lanza desde lejos. Lo que te sacan no lo venden: lo cuelgan en el campamento, de trofeo, hasta que alguien les gane a todos.'};
 if (Z.BESTIARY_ORDER && !Z.BESTIARY_ORDER.includes('cannibal')) Z.BESTIARY_ORDER.push('cannibal');
}
const SPEAR = Z.SPEAR = {reach: 56, width: 12, power: 1.25, aim: .5, thrust: .3, rest: 1.3, keep: 36};
// Con menos del 15% de vida, un 35% de las veces sale corriendo un rato.
const FLEE = Z.CANNIBAL_FLEE = {below: .15, chance: .35, time: 6};
// Si un caníbal te noquea, un 10% de las veces te roba una cosa (una sola unidad).
const THEFT = Z.CANNIBAL_THEFT = {chance: .1};
const GROUPS = ['g1', 'g2', 'g3'];

// Monos: no se les pega. Si pasás al lado de su árbol, avisan y te saltan encima; después huyen a otro árbol.
const MONKEY = Z.MONKEY = {count: 3, trigger: 52, warn: .5, leap: .35, flee: .8, rest: 7, radius: 20, share: .08, min: 6};

// Frutas: curan y tienen un efecto. Se juntan de los árboles del bosque (vuelven a dar en 2 minutos).
const FRUITS = Z.FRUITS = {
 banana: {heal: .15, gives: 2, detail: 'Cura el 15% de tu vida y te llena la energía.'},
 mango: {heal: .2, gives: 1, detail: 'Cura el 20% de tu vida y +15% de daño durante 20 s.'},
 coco: {heal: .2, gives: 1, detail: 'Cura el 20% de tu vida y +3 de armadura durante 30 s.'}
};
const FRUIT_REGROW = Z.FRUIT_REGROW = 120, BANANA_PRICE = Z.BANANA_PRICE = 30;
Z.ITEMS.banana = {name: 'Banana', icon: '🍌', fruit: true, detail: FRUITS.banana.detail};
Z.ITEMS.mango = {name: 'Mango', icon: '🥭', fruit: true, detail: FRUITS.mango.detail};
Z.ITEMS.coco = {name: 'Coco', icon: '🥥', fruit: true, detail: FRUITS.coco.detail};
Z.ITEM_ORDER.push('banana', 'mango', 'coco');
Z.BUFF_LIMITS.mango = 20; Z.BUFF_LIMITS.coco = 30;
Z.SHOP_ITEMS.push({id: 'banana', item: true, name: 'Banana', icon: '🍌', detail: 'Del Bosque profundo, traída en carreta. Cura el 15% y te llena la energía.', price: () => BANANA_PRICE});
const baseStats = Z.getStats;
Z.getStats = function (player) {
 const s = baseStats.apply(this, arguments), b = player && player.buffs || {};
 if (b.mango > 0) s.damageMultiplier *= 1.15;
 if (b.coco > 0) s.armor += 3;
 return s;
};

// Monin: pega más que el perro y menos que la serpiente. Te da de comer frutas de tu bolsa mientras peleás.
Z.PETS.monin = {species: 'Mono', icon: '🐒', hit: .125, every: .9, special: 20, reach: 20, speed: 175, name: 'Monin', detail: 'Pega rápido. Cada 20 s, si peleás herido, se acerca y te da de comer una fruta de tu bolsa: te cura y te hace su efecto.'};
Z.PET_ORDER.push('monin');
Z.PET_SKILLS.monin = {name: 'Distracción', detail: 'Llama a los enemigos comunes de alrededor: durante 4 s todos van a pegarle a él, y él los esquiva saltando. A los jefes no les hace nada.'};
const MONIN = Z.PET_MONIN = {bananas: 10, bandages: 2, feedEvery: 20, feedBelow: .85, taunt: 4, radius: 200};
Z.KENNEL.pens.monin = {x: -650, y: 2716};
Z.PET_HOW = Object.assign(Z.PET_HOW || {}, {monin: 'En el Bosque profundo (el sendero del este de Los Yuyos) hay un mono que se deja domesticar con 10 bananas y 2 vendas.'});
const MONIN_SPOT = {x: -140, y: 3480};

const baseCreate = Z.createPlayer;
Z.createPlayer = function (id) { const p = baseCreate(id); p.petProgress = p.petProgress || {}; p.petProgress.monin = {bananas: 0, bandages: 0}; p.stolen = []; return p; };

/* ---------- El mapa ---------- */
const baseWorld = Z.createWorld;
Z.createWorld = function () {
 const world = baseWorld.apply(this, arguments);
 let serial = 0;
 const object = (type, x, y, w, h, solid = true, extra = {}) => { const o = {id: 'forest-' + serial++, type, x, y, w, h, solid, ...extra}; world.objects.push(o); return o; };
 const path = (x, y, w, h, material = 'dirt') => world.paths.push({x, y, w, h, material});
 const spawn = (type, x, y, extra = {}) => world.enemySpawns.push({id: 'forest-' + type + '-' + world.enemySpawns.length, type, x, y, ...extra});
 world.zones.push({id: 'forest', ...ZONE, name: 'Bosque profundo'});
 // Los Yuyos: el sendero sale del camino de abajo hacia el borde este, con su cartel. No se saca ningún árbol del borde
 // (los guardados los recuerdan por id): el arco queda justo antes.
 path(2190, 1460, 140, 34);
 object('stairs', 2318, 1446, 30, 34, false, {dir: 'in', door: true, trail: true, to: 'forest', arrive: INSIDE, label: 'Entrar al Bosque profundo'});
 object('sign', 2270, 1426, 16, 12, true, {label: 'Leer el cartel del bosque', text: 'BOSQUE PROFUNDO → Monos en los árboles y caníbales con lanza. Dicen que te roban lo que llevás encima.'});
 // Adentro: cerco de monte cerrado y la salida en el rincón de abajo a la derecha.
 object('jhedge', ZONE.x, ZONE.y, ZONE.w, 26, true); object('jhedge', ZONE.x, ZONE.y + ZONE.h - 26, ZONE.w, 26, true);
 object('jhedge', ZONE.x, ZONE.y + 26, 22, ZONE.h - 52, true, {side: true}); object('jhedge', ZONE.x + ZONE.w - 22, ZONE.y + 26, 22, ZONE.h - 52, true, {side: true});
 object('stairs', -98, 3622, 40, 30, false, {dir: 'out', door: true, trail: true, inner: true, to: 'weeds', arrive: OUTSIDE, label: 'Volver a Los Yuyos'});
 path(-720, 3586, 640, 30); path(-420, 3130, 30, 470); path(-700, 3290, 300, 26); path(-420, 3206, 280, 26);
 // Campamentos de los caníbales: una fogata y su grupo.
 const camps = [['g1', -195, 3215, [[-220, 3196], [-170, 3238]]], ['g2', -640, 3250, [[-664, 3228], [-618, 3272], [-600, 3222]]], ['g3', -560, 3470, [[-584, 3450], [-540, 3492], [-520, 3452]]]];
 for (const [group, cx, cy, members] of camps) { object('fcamp', cx - 10, cy - 6, 20, 12, false); for (const [x, y] of members) spawn('cannibal', x, y, {group}); }
 // Árboles frutales: se juntan con E y vuelven a dar a los 2 minutos.
 const fruit = (kind, x, y) => object('fruittree', x - 11, y - 8, 22, 16, true, {fruit: kind, label: 'Juntar ' + (kind === 'banana' ? 'bananas' : kind === 'mango' ? 'un mango' : 'un coco')});
 [[-300, 3545], [-160, 3400], [-720, 3420], [-470, 3160]].forEach(([x, y]) => fruit('banana', x, y));
 [[-350, 3360], [-700, 3140]].forEach(([x, y]) => fruit('mango', x, y));
 [[-640, 3612], [-90, 3330]].forEach(([x, y]) => fruit('coco', x, y));
 // Árboles con mono: siempre los mismos.
 [[-560, 3150], [-300, 3140], [-120, 3160], [-740, 3530], [-450, 3420], [-260, 3300], [-640, 3380]].forEach(([x, y]) => object('jtree', x - 11, y - 7, 22, 14, true, {monkey: true, variant: 1}));
 // Monte: árboles con semilla propia, que dejan libres caminos, campamentos, frutales y al mono.
 let seed = 4713; const random = () => { seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0; return seed / 4294967296; };
 const points = [INSIDE, MONIN_SPOT, ...camps.flatMap(([, x, y, m]) => [{x, y}, ...m.map(([a, b]) => ({x: a, y: b}))])];
 const clear = o => !world.paths.some(p => o.x < p.x + p.w + 12 && o.x + o.w > p.x - 12 && o.y < p.y + p.h + 12 && o.y + o.h > p.y - 12)
  && !world.objects.some(p => p.solid && inForest(p.x + 1, p.y + 1) && p.type !== 'jhedge' && o.x < p.x + p.w + 16 && o.x + o.w > p.x - 16 && o.y < p.y + p.h + 18 && o.y + o.h > p.y - 18)
  && !points.some(p => Math.hypot(p.x - (o.x + o.w / 2), p.y - (o.y + o.h / 2)) < 44);
 for (let i = 0, placed = 0; i < 400 && placed < 70; i++) {
  const o = {x: ZONE.x + 30 + Math.floor(random() * (ZONE.w - 82)), y: ZONE.y + 40 + Math.floor(random() * (ZONE.h - 90)), w: 22, h: 14};
  if (!clear(o)) continue; object('jtree', o.x, o.y, o.w, o.h, true, {variant: Math.floor(random() * 3)}); placed++;
 }
 for (let i = 0; i < 90; i++) { const x = ZONE.x + 30 + Math.floor(random() * (ZONE.w - 60)), y = ZONE.y + 34 + Math.floor(random() * (ZONE.h - 70)); if (world.paths.some(p => x < p.x + p.w + 4 && x + 10 > p.x - 4 && y < p.y + p.h + 4 && y + 6 > p.y - 4)) continue; object('fern', x, y, 10, 6, false, {variant: i % 3}); }
 world.npcs.push({id: 'pet-wild-monin', kind: 'pet', pet: 'monin', wild: true, name: 'Mono', x: MONIN_SPOT.x, y: MONIN_SPOT.y, homeX: MONIN_SPOT.x, homeY: MONIN_SPOT.y, targetX: MONIN_SPOT.x, targetY: MONIN_SPOT.y, dir: 'down', static: true, radius: 7, tag: 24, walk: 0, moving: false, zone: 'forest'});
 return world;
};

const P = Z.Game.prototype;
Object.assign(P, {
 moninData() { const prog = this.petData(); if (!prog.monin) prog.monin = {bananas: 0, bandages: 0}; return prog.monin; },
 // Darle al mono lo que tengas: primero las 10 bananas, después las 2 vendas.
 giveMonin(n) {
  const m = this.moninData(), say = text => this.petSay(n, text);
  if (m.bananas < MONIN.bananas) {
   const give = Math.min(this.itemCount('banana'), MONIN.bananas - m.bananas);
   if (!give) { say(m.bananas ? '*te mira la mano y se rasca la cabeza* Quiere más bananas (' + m.bananas + '/' + MONIN.bananas + '). Hay en los árboles del bosque y en El Almacén.' : '*te mira desde arriba de un tronco y se come una uña* Tiene cara de hambre. Las bananas crecen en el bosque y las vende El Almacén.'); return 'empty'; }
   for (let k = 0; k < give; k++) this.useCharge('banana');
   m.bananas += give; this.sound.play('pickup'); this.effect(n.x, n.y - 22, 'heart', 1.2);
   say(m.bananas >= MONIN.bananas ? '*se come la última banana y se le ve una raspadura en el brazo* Te muestra la herida: necesita ' + MONIN.bananas + ' bananas ✓ y ' + MONIN.bandages + ' vendas.' : '*pela las bananas con una mano y se las come de a dos* (' + m.bananas + '/' + MONIN.bananas + ')');
   return 'fed';
  }
  const give = Math.min(this.itemCount('bandage'), MONIN.bandages - m.bandages);
  if (!give) { say('*te extiende el brazo raspado y espera* Le faltan ' + (MONIN.bandages - m.bandages) + ' vendas. El Almacén y las carpas tienen.'); return 'missing'; }
  for (let k = 0; k < give; k++) this.useCharge('bandage');
  m.bandages += give; this.sound.play('pickup');
  if (m.bandages >= MONIN.bandages) { this.tamePet('monin'); this.effect(n.x, n.y - 22, 'heart', 1.4); say('*se mira el brazo vendado, pega un grito de alegría y se te sube al hombro* ¡Monin ya es tu compañero!'); return 'tamed'; }
  say('*se deja vendar sin chistar* (' + m.bandages + '/' + MONIN.bandages + ' vendas)'); return 'bandaged';
 },
 // Comer una fruta: cura y hace su efecto. La usa la bolsa (F) y la usa Monin.
 eatFruit(id) {
  const p = this.player, f = FRUITS[id]; if (!f || !this.useCharge(id)) return false;
  this.heal(this.stats().maxHealth * f.heal);
  if (id === 'banana') { p.stamina = 1; p.exhausted = 0; p.restTime = Math.max(p.restTime || 0, 1); }
  if (id === 'mango') p.buffs.mango = Z.BUFF_LIMITS.mango;
  if (id === 'coco') p.buffs.coco = Z.BUFF_LIMITS.coco;
  this.sound.play('pickup'); this.effect(p.x, p.y - 10, 'leaf', .7, {seed: Math.random() * 99});
  this.emit('tick'); return true;
 },
 // La que más te cura de las que tenés (si empatan, cualquiera).
 bestFruit() { const have = Object.keys(FRUITS).filter(id => this.itemCount(id) > 0); if (!have.length) return null; const top = Math.max(...have.map(id => FRUITS[id].heal)), best = have.filter(id => FRUITS[id].heal === top); return best[Math.floor(Math.random() * best.length)]; },
 harvestFruit(o) {
  const f = FRUITS[o.fruit], item = Z.ITEMS[o.fruit];
  if (o.harvested) { this.emit('toast', {message: 'Ya no le quedan frutas. Vuelve a dar en ' + Math.ceil(o.regrow) + ' s.'}); return false; }
  const got = this.addItem(o.fruit, f.gives);
  if (!got) { this.emit('toast', {message: 'Ya llevás ' + Z.ITEM_STACK + ' de ' + item.name.toLowerCase() + ': no te entran más.', error: true}); return false; }
  o.harvested = true; o.regrow = FRUIT_REGROW; this.sound.play('pickup'); this.effect(o.x + o.w / 2, o.y - 20, 'leaf', .8, {seed: o.x});
  this.emit('toast', {message: 'Juntaste ' + item.icon + ' ' + got + ' ' + (got > 1 ? item.name.toLowerCase().replace(/a$/, 'as') : item.name.toLowerCase()) + '. Van a la bolsa (B).'});
  return true;
 },
 fruitTarget() {
  const p = this.player; if (this.biome !== 'forest') return null; let best = null, gap = 26;
  for (const o of this.world.objects) { if (o.type !== 'fruittree') continue; const nx = clamp(p.x, o.x, o.x + o.w), ny = clamp(p.y, o.y, o.y + o.h), d = Math.hypot(p.x - nx, p.y - ny); if (d < gap) { best = o; gap = d; } }
  return best;
 },
 /* ---------- Monos ---------- */
 monkeyTrees() { const w = this.world; if (!w.monkeyTrees) w.monkeyTrees = w.objects.filter(o => o.type === 'jtree' && o.monkey).map(o => ({id: o.id, x: o.x + o.w / 2, y: o.y + o.h})); return w.monkeyTrees; },
 monkeyList() {
  if (this.monkeysWorld !== this.world) { const trees = this.monkeyTrees(); this.monkeysWorld = this.world; this.monkeys = [0, 4, 2].slice(0, MONKEY.count).map((k, i) => ({id: i, tree: trees[k].id, x: trees[k].x, y: trees[k].y, cd: 1 + i, act: null})); }
  return this.monkeys;
 },
 updateMonkeys(dt) {
  if (!this.world || this.biome !== 'forest') return;
  const p = this.player, trees = this.monkeyTrees(), list = this.monkeyList(), at = id => trees.find(t => t.id === id);
  for (const m of list) {
   m.cd = Math.max(0, m.cd - dt); const a = m.act;
   if (a) {
    a.t += dt;
    if (a.id === 'warn') { if (a.t >= MONKEY.warn) { m.act = {id: 'leap', t: 0, from: {x: m.x, y: m.y - 34}, to: a.to}; this.sound.play('swing'); } continue; }
    // Salto en arco: del árbol a donde estabas, y de ahí a otro árbol.
    const span = a.id === 'leap' ? MONKEY.leap : MONKEY.flee, k = Math.min(1, a.t / span);
    m.x = a.from.x + (a.to.x - a.from.x) * k; m.y = a.from.y + (a.to.y - a.from.y) * k - Math.sin(k * Math.PI) * 18;
    if (k < 1) continue;
    if (a.id === 'leap') {
     if (Math.hypot(p.x - a.to.x, p.y - a.to.y) < MONKEY.radius) this.hurtPlayer(Math.max(MONKEY.min, this.stats().maxHealth * MONKEY.share), 'monkey');
     if (this.state !== 'playing') return;
     this.effect(a.to.x, a.to.y, 'dust', .5);
     const free = trees.filter(t => t.id !== m.tree && !list.some(o => o !== m && (o.tree === t.id || (o.act && o.act.tree === t.id))));
     const next = free.sort((u, v) => distance(v, a.to) - distance(u, a.to))[Math.floor(Math.random() * Math.min(3, free.length))] || at(m.tree);
     m.act = {id: 'flee', t: 0, from: {x: a.to.x, y: a.to.y}, to: {x: next.x, y: next.y - 34}, tree: next.id}; this.sound.play('pickup');
    } else { m.tree = a.tree; m.act = null; m.cd = MONKEY.rest; }
    continue;
   }
   const t = at(m.tree); if (!t) continue; m.x = t.x; m.y = t.y;
   if (m.cd <= 0 && !this.cutscene && Math.hypot(p.x - t.x, p.y - t.y) < MONKEY.trigger) { m.act = {id: 'warn', t: 0, to: {x: p.x, y: p.y}}; this.sound.play('telegraph'); }
  }
 },
 /* ---------- Caníbales ---------- */
 cannibalAI(e, dt, len, sameZone) {
  const p = this.player, a = e.act, def = Z.ENEMY_TYPES.cannibal;
  e.flee = Math.max(0, (e.flee || 0) - dt);
  if (e.flee > 0 && sameZone) { e.act = null; e.alert = true; this.steer(e, e.x + (e.x - p.x), e.y + (e.y - p.y), e.stats.moveSpeed * 1.15, dt, 99); return; }
  if (!this.realmAlert(e, len, sameZone, def.visionRange)) { e.called = false; this.idleDrift(e, dt, len); return; }
  // Cuando uno te ve, avisa a los de su grupo.
  if (!e.called) { e.called = true; for (const m of this.enemies) if (m !== e && m.type === 'cannibal' && m.group === e.group && !m.dead) m.provoked = true; }
  if (a && a.id === 'aim') { a.t += dt; e.moving = false; if (a.t < SPEAR.aim * .6) this.aimAt(e); if (a.t >= SPEAR.aim) { e.act = {id: 'thrust', t: 0, dx: e.aimX, dy: e.aimY, hit: false}; this.sound.play('swing'); } return; }
  if (a && a.id === 'thrust') {
   a.t += dt; e.moving = false;
   if (!a.hit) {
    a.hit = true; const dx = p.x - e.x, dy = p.y - e.y, along = dx * a.dx + dy * a.dy;
    if (along > -4 && along <= SPEAR.reach && Math.abs(dx * a.dy - dy * a.dx) <= SPEAR.width) this.hurtPlayer(e.stats.strength * SPEAR.power, 'cannibal');
    if (this.state !== 'playing') return;
   }
   if (a.t >= SPEAR.thrust) { e.act = null; e.cooldown = Math.max(SPEAR.rest, e.stats.attackCooldown); }
   return;
  }
  // Se queda a la distancia de la lanza.
  if (len > SPEAR.keep + 6) this.steer(e, p.x, p.y, e.stats.moveSpeed, dt, len);
  else if (len < SPEAR.keep - 14) this.steer(e, e.x + (e.x - p.x), e.y + (e.y - p.y), e.stats.moveSpeed * .5, dt, 99);
  else { e.moving = false; this.aimAt(e); e.dir = Math.abs(e.aimX) > Math.abs(e.aimY) ? (e.aimX > 0 ? 'right' : 'left') : (e.aimY > 0 ? 'down' : 'up'); }
  if (e.cooldown <= 0 && len < SPEAR.reach - 4) { e.act = {id: 'aim', t: 0}; this.aimAt(e); this.sound.play('telegraph'); }
 },
 // Te roba una cosa: un arma (menos los puños), la armadura, un amuleto puesto o una unidad de un consumible.
 cannibalTheft(group) {
  const p = this.player, options = [];
  for (const w of p.weapons || []) if (w !== 'fists') options.push({kind: 'weapon', id: w});
  if ((p.armorTier || 0) > 0) options.push({kind: 'armor', id: p.armorTier});
  for (const a of p.equipped || []) options.push({kind: 'amulet', id: a});
  for (const id of Object.keys(p.items || {})) if (this.itemCount(id) > 0) options.push({kind: 'item', id});
  if ((p.herbs || 0) > 0) options.push({kind: 'herb', id: 'herb'});
  if (!options.length) return null;
  const s = options[Math.floor(Math.random() * options.length)];
  if (s.kind === 'weapon') { p.weapons = p.weapons.filter(w => w !== s.id); if (p.weapon === s.id) p.weapon = 'fists'; }
  else if (s.kind === 'armor') p.armorTier = 0;
  else if (s.kind === 'amulet') { p.equipped = p.equipped.filter(a => a !== s.id); p.amulets = (p.amulets || []).filter(a => a !== s.id); }
  else if (s.kind === 'item') this.useCharge(s.id);
  else p.herbs--;
  const loot = {group, kind: s.kind, id: s.id}; p.stolen = [...(p.stolen || []), loot];
  return loot;
 },
 stolenName(s) {
  if (s.kind === 'weapon') return '⚔ ' + (Z.WEAPON_TYPES[s.id] ? Z.WEAPON_TYPES[s.id].name.toLowerCase() : s.id);
  if (s.kind === 'armor') return (Z.ARMORS[s.id] ? Z.ARMORS[s.id].icon + ' la ' + Z.ARMORS[s.id].name.toLowerCase() : 'la armadura');
  if (s.kind === 'amulet') return (Z.AMULETS[s.id] ? Z.AMULETS[s.id].icon + ' ' + Z.AMULETS[s.id].name : s.id);
  if (s.kind === 'item') return (Z.ITEMS[s.id] ? Z.ITEMS[s.id].icon + ' 1 de ' + Z.ITEMS[s.id].name.toLowerCase() : s.id);
  return '❦ 1 hierba medicinal';
 },
 // Vencer a todo el grupo devuelve lo que se llevó.
 recoverStolen(group) {
  const p = this.player, mine = (p.stolen || []).filter(s => s.group === group); if (!mine.length) return [];
  p.stolen = p.stolen.filter(s => s.group !== group);
  for (const s of mine) {
   if (s.kind === 'weapon' && !p.weapons.includes(s.id)) p.weapons.push(s.id);
   else if (s.kind === 'armor') p.armorTier = Math.max(p.armorTier || 0, s.id);
   else if (s.kind === 'amulet' && !(p.amulets || []).includes(s.id)) { p.amulets = [...(p.amulets || []), s.id]; if ((p.equipped || []).length < (p.amuletSlots || 1)) p.equipped = [...(p.equipped || []), s.id]; }
   else if (s.kind === 'item') this.addItem(s.id, 1);
   else if (s.kind === 'herb') p.herbs = Math.min(Z.HERB_BAG, (p.herbs || 0) + 1);
  }
  this.sound.play('legend'); this.effect(p.x, p.y - 34, 'level', 1.2, {text: '¡Recuperado!'});
  this.emit('toast', {message: 'Les ganaste a los caníbales que te robaron. Recuperaste: ' + mine.map(s => this.stolenName(s)).join(', ') + '.'});
  this.emit('progress');
  return mine;
 },
 /* ---------- Monin ---------- */
 moninFeed(pet) {
  const fruit = this.bestFruit(); if (!fruit) return false;
  const item = Z.ITEMS[fruit]; this.eatFruit(fruit);
  this.effect(pet.x, pet.y - 26, 'miss', 1, {text: '¡Ñam!'}); this.effect(this.player.x, this.player.y - 20, 'heart', 1);
  this.emit('toast', {message: Z.PETS.monin.icon + ' ' + this.petName('monin') + ' te dio de comer ' + item.icon + ' ' + item.name.toLowerCase() + '.'});
  return true;
 },
 // Los que están distraídos van a pegarle a Monin, que los esquiva saltando. A vos no te pegan.
 tauntedStep(e, dt) {
  const pet = this.pet;
  e.taunt = Math.max(0, e.taunt - dt); e.cooldown = Math.max(0, e.cooldown - dt); e.hitFlash = Math.max(0, (e.hitFlash || 0) - dt); e.moving = false;
  if (e.stun > 0) { e.stun = Math.max(0, e.stun - dt); return; }
  if (!pet) { e.taunt = 0; return; }
  e.alert = true; e.act = null; e.telegraph = 0; e.dash = 0;
  const len = distance(e, pet);
  if (len > 16) this.steer(e, pet.x, pet.y, e.stats.moveSpeed, dt, len);
  if (len < 24 && e.cooldown <= 0) {
   e.cooldown = Math.max(1, e.stats.attackCooldown || 1); pet.hop = .35; this.sound.play('swing');
   if (!this.lastDodgeText || this.time - this.lastDodgeText > .6) { this.lastDodgeText = this.time; this.effect(pet.x, pet.y - 26, 'miss', .7, {text: '¡Esquivó!'}); }
  }
 }
});
Z.UPDATERS.push(function (dt) { this.updateMonkeys(dt); });

/* ---------- Ganchos sobre lo que ya existía ---------- */
const baseInteract = P.interact, baseNearby = P.nearbyAction, basePetInteract = P.petInteract, baseSync = P.syncPetNpcs, baseUse = P.useItem;
const baseKnockout = P.knockout, baseEmit = P.emit, baseKill = P.onKill, baseHit = P.hitEnemy, baseRestore = P.restoreInventory;
const basePets = P.updatePets, baseSkill = P.petSkill, baseEnemies = P.updateEnemies;
P.interact = function () {
 if (this.state === 'playing' && !this.cutscene && !this.player.fishing && !(this.petTarget && this.petTarget())) { const o = this.fruitTarget(); if (o) { this.harvestFruit(o); return; } }
 return baseInteract.call(this);
};
P.nearbyAction = function () {
 const pet = !this.player.fishing && this.petTarget && this.petTarget();
 if (pet && pet.pet === 'monin' && pet.wild) {
  const m = this.moninData();
  return {item: pet, label: m.bananas < MONIN.bananas ? 'Darle bananas al mono (🍌 ' + this.itemCount('banana') + ' · ' + m.bananas + '/' + MONIN.bananas + ')' : 'Vendarle el brazo al mono (🩹 ' + this.itemCount('bandage') + ' · ' + m.bandages + '/' + MONIN.bandages + ')'};
 }
 if (!pet && !this.player.fishing) { const o = this.fruitTarget(); if (o) return {item: o, label: o.harvested ? 'Sin frutas · vuelve a dar en ' + Math.ceil(o.regrow) + ' s' : o.label + ' (' + Z.ITEMS[o.fruit].icon + ' ' + this.itemCount(o.fruit) + ')'}; }
 return baseNearby.call(this);
};
P.petInteract = function (n) { if (n.pet === 'monin' && n.wild) { this.player.dir = this.dirOf(n.x - this.player.x, n.y - this.player.y); return this.giveMonin(n); } return basePetInteract.call(this, n); };
P.syncPetNpcs = function () {
 baseSync.call(this);
 const npcs = this.world.npcs, i = npcs.findIndex(n => n.id === 'pet-wild-monin');
 if (this.ownsPet('monin') && i >= 0) npcs.splice(i, 1);
 else if (!this.ownsPet('monin') && i < 0) npcs.push({id: 'pet-wild-monin', kind: 'pet', pet: 'monin', wild: true, name: 'Mono', x: MONIN_SPOT.x, y: MONIN_SPOT.y, homeX: MONIN_SPOT.x, homeY: MONIN_SPOT.y, targetX: MONIN_SPOT.x, targetY: MONIN_SPOT.y, dir: 'down', static: true, radius: 7, tag: 24, walk: 0, moving: false, zone: 'forest'});
};
P.useItem = function (id) {
 if (!FRUITS[id]) return baseUse.call(this, id);
 const p = this.player, item = Z.ITEMS[id];
 if (this.state !== 'playing' && this.state !== 'paused' || this.cutscene) return {ok: false, message: 'Ahora no se puede.'};
 if (!this.itemCount(id)) return {ok: false, message: 'No tenés ' + item.name.toLowerCase() + '.'};
 if (id === 'banana' && p.hp >= this.stats().maxHealth && p.stamina >= 1) return {ok: false, message: 'Guardala para después: tenés toda la vida y la energía.'};
 this.eatFruit(id);
 return {ok: true, message: item.icon + ' ' + item.name + ': ¡listo!'};
};
// Robo de los caníbales: se decide antes de volver a casa, y el aviso de la derrota dice qué se llevaron.
P.knockout = function (source) {
 this.knockoutNote = null;
 if (source === 'cannibal' && this.chance(THEFT.chance)) {
  const p = this.player; let near = null, best = Infinity;
  for (const e of this.enemies) if (e.type === 'cannibal' && !e.dead) { const d = distance(e, p); if (d < best) { best = d; near = e; } }
  const loot = this.cannibalTheft(near ? near.group : 'g1');
  if (loot) this.knockoutNote = {stolen: 'Antes de que te arrastraran a la aldea, los caníbales te robaron ' + this.stolenName(loot) + '. Vencé a todo su grupo en el Bosque profundo para recuperarlo.'};
 }
 for (const e of this.enemies) e.taunt = 0;
 return baseKnockout.call(this, source);
};
const QUOTES = {cannibal: 'Me querían de almuerzo. Casi lo logran.', monkey: 'Me tumbó un mono. Un mono.'};
P.emit = function (type, detail = {}) {
 if (type === 'knockout') { if (QUOTES[detail.source]) detail.quote = QUOTES[detail.source]; if (this.knockoutNote) { Object.assign(detail, this.knockoutNote); this.knockoutNote = null; } }
 return baseEmit.call(this, type, detail);
};
P.onKill = function (e) {
 const r = baseKill.call(this, e);
 if (e.type === 'cannibal' && e.group && !e.summoned && this.enemies.filter(m => m.type === 'cannibal' && m.group === e.group).every(m => m.dead)) this.recoverStolen(e.group);
 return r;
};
P.hitEnemy = function (e, raw, ...rest) {
 const r = baseHit.call(this, e, raw, ...rest);
 if (e && e.type === 'cannibal' && !e.dead && !e.fleeRolled && e.hp < e.maxHp * FLEE.below) {
  e.fleeRolled = true;
  if (this.chance(FLEE.chance)) { e.flee = FLEE.time; e.act = null; this.effect(e.x, e.y - 34, 'miss', 1, {text: '¡Huye!'}); }
 }
 return r;
};
P.updatePets = function (dt) {
 const pet = this.pet; if (pet && pet.id === 'monin' && pet.feed) pet.eat = Math.max(pet.eat || 0, dt * 2);
 basePets.call(this, dt);
 const now = this.pet; if (!now || now.id !== 'monin' || this.state !== 'playing') return;
 const p = this.player, max = this.stats().maxHealth;
 now.hop = Math.max(0, (now.hop || 0) - dt);
 now.feedCd = (now.feedCd === undefined ? 6 : now.feedCd) - dt;
 if (now.feed) {
  now.feed.t += dt; const dx = p.x - now.x, dy = p.y - now.y, len = Math.hypot(dx, dy);
  if (len > 12) { const step = Math.min(len - 10, 240 * dt); now.x += dx / len * step; now.y += dy / len * step; now.moving = true; now.walk = (now.walk || 0) + dt * 12; now.dir = dx > 0 ? 1 : -1; }
  else { this.moninFeed(now); now.feed = null; now.eat = 0; now.feedCd = MONIN.feedEvery * this.petFactor('monin', 'cooldown'); }
  if (now.feed && now.feed.t > 2.5) { now.feed = null; now.eat = 0; now.feedCd = 3; }
  return;
 }
 if (now.feedCd > 0) return;
 const fighting = !Z.isSafe(this.biome) && this.enemies.some(e => !e.dead && e.alert && e.biome === this.biome && distance(e, p) < 260);
 if (fighting && p.hp < max * MONIN.feedBelow && this.bestFruit()) now.feed = {t: 0}; else now.feedCd = 1;
};
// Habilidad del nivel 5 de Monin: Distracción.
P.petSkill = function (pet) {
 if (pet.id !== 'monin') return baseSkill.call(this, pet);
 const p = this.player; if (this.petLevel('monin') < Z.PET_LEVELS.skillAt || Z.isSafe(this.biome)) return false;
 const called = this.enemies.filter(e => this.petCanHit(e) && !isBoss(e) && !e.illusion && !this.effectImmune(e) && e.alert && distance(e, p) <= MONIN.radius);
 if (!called.length) return false;
 const t = MONIN.taunt * this.petFactor('monin', 'effect');
 for (const e of called) { e.taunt = t; e.latched = 0; e.act = null; if (this.interruptEnemy) this.interruptEnemy(e); }
 this.effect(pet.x, pet.y - 28, 'miss', 1.2, {text: '¡Eh, por acá!'}); this.sound.play('alert'); pet.hop = .4;
 return true;
};
P.updateEnemies = function (dt) {
 const pet = this.pet;
 for (const e of this.enemies) if (e.taunt > 0 && (!pet || e.dead || e.biome !== this.biome)) e.taunt = 0;
 const taunted = this.enemies.filter(e => e.taunt > 0);
 if (!taunted.length) return baseEnemies.call(this, dt);
 this.enemies = this.enemies.filter(e => !(e.taunt > 0));
 try { baseEnemies.call(this, dt); } finally { this.enemies = [...this.enemies, ...taunted.filter(e => !this.enemies.includes(e))]; }
 if (this.state !== 'playing') return;
 for (const e of taunted) this.tauntedStep(e, dt);
};
// Guardados: las partidas de antes arrancan sin progreso con el mono y sin nada robado.
P.restoreInventory = function (p, source) {
 baseRestore.call(this, p, source);
 const sp = source.petProgress && source.petProgress.monin || {};
 p.petProgress = p.petProgress || {};
 p.petProgress.monin = {bananas: Math.floor(clamp(finite(sp.bananas), 0, MONIN.bananas)), bandages: Math.floor(clamp(finite(sp.bandages), 0, MONIN.bandages))};
 const valid = s => s && GROUPS.includes(s.group) && (s.kind === 'weapon' ? !!Z.WEAPON_TYPES[s.id] && s.id !== 'fists' : s.kind === 'armor' ? Number.isInteger(s.id) && s.id > 0 && s.id <= Z.MAX_ARMOR : s.kind === 'amulet' ? !!Z.AMULETS[s.id] : s.kind === 'item' ? !!Z.ITEMS[s.id] : s.kind === 'herb');
 p.stolen = Array.isArray(source.stolen) ? source.stolen.filter(valid).slice(0, 30).map(s => ({group: s.group, kind: s.kind, id: s.id})) : [];
};

/* ---------- Dibujo ---------- */
const LEAF = ['#16301a', '#1d3b20', '#244827', '#2c5530', '#36633a'];
function jungleTree(c, o, time) {
 const x = Math.round(o.x + o.w / 2), y = Math.round(o.y + o.h), v = o.variant || 0, sway = Math.round(Math.sin(time * .8 + x * .05));
 Px.oval(c, x, y - 1, 13, 4, '#0c1a0e');
 R(c, x - 3, y - 26, 6, 26, '#3a2a1a'); R(c, x - 2, y - 26, 2, 26, '#5a4028'); R(c, x - 5, y - 3, 3, 3, '#3a2a1a'); R(c, x + 2, y - 3, 3, 3, '#3a2a1a');
 const cy = y - 34 - v * 2;
 Px.oval(c, x + sway, cy, 20 + v * 2, 14, LEAF[0]); Px.oval(c, x - 7 + sway, cy - 3, 12, 9, LEAF[1]); Px.oval(c, x + 8 + sway, cy - 2, 12, 9, LEAF[2]);
 Px.oval(c, x + sway, cy - 8, 12, 8, LEAF[3]); Px.oval(c, x - 3 + sway, cy - 10, 6, 4, LEAF[4]);
 // Lianas.
 for (const k of [-12, 5, 13]) { const len = 10 + ((x + k) % 7); R(c, x + k + sway, cy + 4, 1, len, '#2f5a2a'); R(c, x + k - 1 + sway, cy + 4 + len, 3, 2, '#3f7a34'); }
 if (o.monkey) { R(c, x - 10 + sway, cy + 2, 20, 2, '#2a4a24'); }
}
function hedge(c, o) {
 const step = 14;
 if (o.side) for (let y = o.y; y < o.y + o.h; y += step) { const x = o.x + o.w / 2; Px.oval(c, x, y + 7, 14, 10, LEAF[(y >> 4) % 2]); Px.oval(c, x - 2, y + 4, 8, 5, LEAF[3]); }
 else for (let x = o.x; x < o.x + o.w; x += step) { const y = o.y + o.h / 2; Px.oval(c, x + 7, y, 10, 15, LEAF[(x >> 4) % 2]); Px.oval(c, x + 5, y - 6, 6, 6, LEAF[3]); }
}
function fruitTree(c, o, time) {
 const x = Math.round(o.x + o.w / 2), y = Math.round(o.y + o.h), ready = !o.harvested;
 Px.oval(c, x, y - 1, 11, 4, '#0c1a0e');
 if (o.fruit === 'banana') {
  R(c, x - 2, y - 22, 4, 22, '#6b7a3a'); R(c, x - 1, y - 22, 1, 22, '#8a9a4a');
  for (const [a, b] of [[-14, -30], [14, -30], [-10, -38], [10, -38], [0, -42]]) POLY(c, [[x, y - 22], [x + a, y + b], [x + a * .6, y + b + 6]], '#3f8a38');
  if (ready) { for (let k = 0; k < 4; k++) R(c, x + 2 + k, y - 20 + k * 2, 3, 2, '#f2d34a'); R(c, x + 2, y - 21, 1, 1, '#5a4a1a'); }
 } else if (o.fruit === 'mango') {
  R(c, x - 3, y - 18, 6, 18, '#4a3420'); Px.oval(c, x, y - 26, 16, 12, '#2f6a2e'); Px.oval(c, x - 4, y - 30, 9, 6, '#3f7e38');
  if (ready) for (const [a, b] of [[-8, -24], [6, -28], [2, -20], [9, -22]]) { R(c, x + a, y + b, 3, 4, '#f2a33a'); R(c, x + a, y + b, 3, 1, '#e0602a'); }
 } else {
  for (let k = 0; k < 6; k++) R(c, x - 2 + Math.round(Math.sin(k * .6) * 2), y - 6 - k * 6, 4, 6, k % 2 ? '#7a5a38' : '#8a6a44');
  const ty = y - 40;
  for (const [a, b] of [[-18, 6], [18, 6], [-14, -4], [14, -4], [-6, 8], [6, 8]]) POLY(c, [[x, ty], [x + a, ty + b], [x + a * .7, ty + b + 3]], '#3f8a38');
  if (ready) for (const a of [-3, 2]) { Px.oval(c, x + a, ty + 4, 3, 3, '#5a3a1e'); R(c, x + a - 1, ty + 2, 1, 1, '#8a6a44'); }
 }
}
function camp(c, o, time) {
 const x = Math.round(o.x + o.w / 2), y = Math.round(o.y + o.h / 2), flick = Math.sin(time * 12 + x);
 R(c, x - 9, y + 1, 18, 3, '#4a301c'); R(c, x - 6, y - 1, 12, 3, '#5a3a20');
 POLY(c, [[x - 6, y], [x, y - 12 - flick * 2], [x + 6, y]], '#e2502a'); POLY(c, [[x - 3, y], [x, y - 7 - flick], [x + 3, y]], '#ffb347');
 if (Px.glow) Px.glow(c, x, y - 4, 26, '#ff8c3c', .25);
 R(c, x + 10, y + 2, 5, 2, '#efe6cf'); R(c, x + 10, y + 1, 1, 4, '#efe6cf'); R(c, x + 14, y + 1, 1, 4, '#efe6cf');
}
function trail(c, o, time) {
 const x = Math.round(o.x + o.w / 2), y = Math.round(o.y + o.h);
 // Un arco de ramas sobre el sendero.
 R(c, x - 14, y - 30, 4, 30, '#3a2a1a'); R(c, x + 10, y - 30, 4, 30, '#3a2a1a');
 Px.oval(c, x, y - 32, 20, 8, LEAF[1]); Px.oval(c, x - 10, y - 30, 8, 6, LEAF[2]); Px.oval(c, x + 10, y - 30, 8, 6, LEAF[2]); Px.oval(c, x, y - 36, 10, 4, LEAF[3]);
 R(c, x - 14, y - 24, 28, 8, '#6b4a2e'); R(c, x - 14, y - 24, 28, 1, '#8a6a44'); Px.text(c, o.inner ? 'YUYOS' : 'BOSQUE', x, y - 22, '#efe6cf', 5, 'center');
}
const baseObject = Z.drawExtraObject;
Z.drawExtraObject = function (c, o, time) {
 if (o.type === 'jtree') { jungleTree(c, o, time); return true; }
 if (o.type === 'jhedge') { hedge(c, o); return true; }
 if (o.type === 'fruittree') { fruitTree(c, o, time); return true; }
 if (o.type === 'fcamp') { camp(c, o, time); return true; }
 if (o.type === 'fern') { const x = o.x, y = o.y; POLY(c, [[x, y + 6], [x + 3, y], [x + 5, y + 6]], LEAF[3 + (o.variant % 2)]); POLY(c, [[x + 3, y + 6], [x + 8, y + 1], [x + 9, y + 6]], LEAF[2]); return true; }
 if (o.type === 'stairs' && o.trail) { trail(c, o, time); return true; }
 return baseObject ? baseObject(c, o, time) : false;
};
// Mono: marrón, cara clara y cola enrulada. Monin es más claro y tiene un pañuelo rojo.
function monkey(c, n, time, opts = {}) {
 const {shadow} = D(), tame = opts.tame !== false && !opts.jungle, fur = tame ? '#8a5a32' : '#5a3a22', dark = tame ? '#6a4224' : '#3e2716', face = '#e0bc8e';
 const game = Z.currentGame, hop = opts.hop || (game && game.pet && n.isPet && game.pet.hop > 0 ? game.pet.hop : 0);
 c.save(); c.translate(Math.round(n.x), Math.round(n.y));
 if (!opts.air) shadow(c, 0, 0, 12, 3);
 const lift = hop > 0 ? -Math.round(Math.sin(hop / .35 * Math.PI) * 8) : opts.lunge ? -2 : 0, walk = n.moving ? Math.round(Math.sin(time * 14)) : 0;
 c.translate(0, lift * Px.scale); if (n.faceLeft) c.scale(-1, 1);
 // Cola.
 R(c, -7, -8, 2, 5, dark); R(c, -9, -12, 2, 5, dark); R(c, -8, -13, 3, 2, dark);
 R(c, -4, -3, 3, 3 + walk, dark); R(c, 1, -3, 3, 3 - walk, dark);
 R(c, -5, -11, 10, 9, fur); R(c, -3, -9, 6, 6, face);
 R(c, -5, -18, 10, 8, fur); R(c, -4, -16, 8, 5, face); R(c, -7, -17, 2, 3, face); R(c, 5, -17, 2, 3, face);
 R(c, -2, -15, 1, 1, '#1a1410'); R(c, 2, -15, 1, 1, '#1a1410'); R(c, -1, -13, 3, 1, '#a07050');
 if (tame) { R(c, -5, -11, 10, 2, '#b5383f'); R(c, 4, -10, 2, 3, '#b5383f'); }
 if (opts.banana) { R(c, 5, -10, 2, 4, '#f2d34a'); R(c, 5, -11, 1, 1, '#5a4a1a'); }
 c.restore();
}
if (Z.PET_ART) Z.PET_ART.monin = (c, n, time, opts = {}) => monkey(c, {...n, isPet: !n.wild}, time, {...opts, banana: !!n.wild});
// Caníbal: piel oscura, pintura blanca, pollera de hojas, un hueso en el pelo y la lanza.
const baseBody = Z.drawExtraEnemyBody;
Z.drawExtraEnemyBody = function (c, e, time, walk) {
 if (e.type !== 'cannibal') return baseBody ? baseBody(c, e, time, walk) : false;
 const skin = '#7a5038', shade = '#5a3a28', a = e.act, poke = a && a.id === 'thrust' ? 9 : a && a.id === 'aim' ? -3 : 0;
 R(c, -4, -5, 3, 5 + walk, shade); R(c, 1, -5, 3, 5 - walk, shade);
 POLY(c, [[-6, -10], [6, -10], [7, -4], [3, -6], [0, -3], [-3, -6], [-7, -4]], '#4f7a2e'); R(c, -6, -10, 12, 1, '#3a5a22');
 R(c, -4, -18, 8, 8, skin); R(c, -3, -17, 2, 6, '#8a6046'); R(c, -3, -15, 6, 1, '#e8e0d0'); R(c, -3, -13, 6, 1, '#e8e0d0');
 R(c, -3, -25, 7, 7, skin); R(c, -3, -26, 7, 2, '#1e1410'); R(c, -4, -25, 1, 3, '#1e1410');
 R(c, -1, -30, 1, 5, '#efe6cf'); R(c, -2, -30, 3, 1, '#efe6cf'); R(c, -2, -26, 3, 1, '#efe6cf');
 R(c, 2, -22, 2, 1, '#f4efe0'); R(c, 3, -22, 1, 1, '#1a1410'); R(c, 0, -19, 3, 1, '#e8e0d0');
 // Brazo y lanza (apunta hacia adelante; al clavarla, sale para adelante).
 R(c, 2, -16, 3, 5, shade);
 R(c, -8 + poke, -14, 24, 2, '#8a6438'); R(c, -8 + poke, -14, 24, 1, '#a8804a');
 POLY(c, [[16 + poke, -16], [22 + poke, -13], [16 + poke, -10]], '#cfd6de'); R(c, 15 + poke, -15, 2, 4, '#6b4a2e');
 return true;
};
// Monos en los árboles y el aviso de su salto; aviso de la lanza; caníbales que huyen.
const baseExtras = Z.extraRenderables;
Z.extraRenderables = function (game, visible, time) {
 const list = baseExtras ? baseExtras(game, visible, time) : [];
 if (game.biome === 'forest' && game.world && game.monkeys) for (const m of game.monkeys) {
  const a = m.act, perched = !a || a.id === 'warn';
  if (a && a.id === 'warn') list.push({y: a.to.y - 1, kind: 'custom', draw: (c, t) => {
   const k = a.t / MONKEY.warn, pulse = .45 + Math.abs(Math.sin(t * 18)) * .45; c.save(); c.globalAlpha = pulse; c.strokeStyle = '#ff7a5c'; c.lineWidth = 2; c.setLineDash([4, 3]);
   c.beginPath(); c.ellipse(a.to.x, a.to.y, MONKEY.radius * (1.3 - k * .3), MONKEY.radius * .75 * (1.3 - k * .3), 0, 0, Math.PI * 2); c.stroke(); c.restore();
  }});
  const x = m.x, y = perched ? m.y - 34 : m.y;
  if (!visible(x, y, 40)) continue;
  list.push({y: perched ? m.y + 1 : m.y + 2, kind: 'custom', draw: (c, t) => {
   monkey(c, {x, y: perched ? y + 4 : y, moving: !!a && a.id !== 'warn', faceLeft: game.player && game.player.x < x}, t, {jungle: true, air: true});
   if (a && a.id === 'warn') D().pixelText(c, '!', x, y - 18, '#ff8f7a', 10);
  }});
 }
 for (const e of game.enemies || []) {
  if (e.type !== 'cannibal' || e.dead || !visible(e.x, e.y, 70)) continue;
  if (e.act && e.act.id === 'aim') list.push({y: e.y + .4, kind: 'custom', draw: (c, t) => {
   const pulse = .4 + Math.abs(Math.sin(t * 16)) * .4, dx = e.aimX || 0, dy = e.aimY || 0; c.save(); c.globalAlpha = pulse; c.strokeStyle = '#ff8f7a'; c.lineWidth = 3; c.setLineDash([5, 4]);
   c.beginPath(); c.moveTo(e.x + dx * 8, e.y - 8 + dy * 8); c.lineTo(e.x + dx * SPEAR.reach, e.y - 8 + dy * SPEAR.reach); c.stroke(); c.restore(); D().pixelText(c, '!', e.x, e.y - 44, '#ff8f7a', 10);
  }});
  // Huyendo: gotitas de sudor.
  if (e.flee > 0) list.push({y: e.y + .5, kind: 'custom', draw: (c, t) => { const drop = (t * 2 + e.x * .01) % 1; c.globalAlpha = 1 - drop; R(c, e.x + 8, e.y - 32 + drop * 8, 2, 3, '#8fd0ff'); c.globalAlpha = 1; }});
 }
 return list;
};
})();
