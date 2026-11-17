/* Compañeros: el perro del plato vacío, el murcielaguito de la Cueva Profunda, el Golemsín de Las Entrañas
   y la viborita de la Yarará. Los que no llevás esperan en La guardería, con Doña Herminia. */
(function () {
'use strict';
const Z = window.Zak, clamp = (v, a, b) => Math.max(a, Math.min(b, v)), finite = n => Number.isFinite(Number(n)) ? Number(n) : 0;
const distance = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);
const isBoss = e => !!(Z.ENEMY_TYPES[e.type] && Z.ENEMY_TYPES[e.type].boss);
// `hit`: parte del daño de tu golpe con el arma que tenés en la mano. `every`: segundos entre golpes. `special`: segundos entre especiales.
// Daño de menor a mayor: murciélago, perro, serpiente y Golemsín. Ayudan un poco: entre los cuatro, un 5 a 20% de tu daño.
Z.PETS = {
 bat: {species: 'Murciélago', icon: '🦇', hit: .08, every: .8, special: 15, reach: 16, speed: 175, fly: true, name: 'Drácula', detail: 'Muerde rápido. Cada 15 s deja al enemigo desangrándose 5 s.'},
 dog: {species: 'Perro', icon: '🐕', hit: .105, every: 1, special: 22, reach: 22, speed: 160, name: 'Firulais', detail: 'Muerde, y cada 22 s inmoviliza al enemigo 3 s (a los jefes, 1,5 s; a Zak, nada) y le corta el ataque que estaba haciendo.'},
 snake: {species: 'Serpiente', icon: '🐍', hit: .14, every: 1.2, special: 15, reach: 24, speed: 130, name: 'Yarita', detail: 'Pega cuerpo a cuerpo. Cada 15 s envenena 5 s, y a veces (4%) se come de un bocado a un enemigo que no sea jefe: tarda 3 s en tragarlo.'},
 golem: {species: 'Golemsín', icon: '🪨', hit: .26, every: 2, special: 20, range: 210, speed: 120, name: 'Piedrita', detail: 'Tira piedras de lejos. Cada 20 s, en plena pelea, te protege 3 s de todo daño, también de los jefes. Mientras lo llevás, juntás +1 de cada material (y de cada Piedra Elemental).'}
};
Z.PET_ORDER = ['dog', 'bat', 'snake', 'golem'];
const DOG = Z.PET_DOG = {feeds: 5, wait: 120, price: 15, stun: 3, bossStun: 1.5};
// Desangrado: cada segundo, lo mismo que una mordida; la armadura lo frena.
const BAT = Z.PET_BAT = {feeds: 3, bleed: 5, tick: 1};
const GOLEM = Z.PET_GOLEM = {chance: .05, gift: {stone: 2, iron: 2, gold: 2, diamond: 2, elemental: 2}, throwEvery: 2, damage: 5, range: 220, shield: 3};
const SNAKE = Z.PET_SNAKE = {chance: .05, time: 600, price: 2000, eat: .04, eatTime: 3, venom: 5};
const LADY = 'Doña Herminia';
// La guardería queda al noreste de la plaza, sobre la calle que va al norte. Desde la v2.32 se entra:
// adentro (Z.KENNEL_ZONE) cada compañero tiene su corral y Doña Herminia atiende detrás del mostrador.
// `pens`: el centro de cada corral; `roam`: cuánto se mueve el bicho adentro sin salirse.
const KENNEL = Z.KENNEL = {house: {x: 1182, y: 700, w: 98, h: 52}, dog: {x: 1258, y: 772}, lady: {x: -170, y: 2704},
 door: {x: 1219, y: 750, w: 24, h: 6}, outside: {x: 1222, y: 778}, inside: {x: -104, y: 2834},
 pens: {bat: {x: -499, y: 2708}, dog: {x: -349, y: 2716}, snake: {x: -499, y: 2966}, golem: {x: -349, y: 2966}}, roam: [44, 30]};
// Recorrido de Doña Herminia: del mostrador a cada corral (entra por la tranquera) y de vuelta. `rest`: segundos que se queda.
KENNEL.route = (() => {
 const P = KENNEL.pens, gate = x => ({x, y: 2834}), visit = (pen, y) => [gate(pen.x), {x: pen.x, y, rest: [3, 6]}, gate(pen.x)];
 return [{x: -170, y: 2704, rest: [6, 12]}, {x: -90, y: 2704}, {x: -90, y: 2760}, ...visit(P.dog, 2742), ...visit(P.bat, 2742), ...visit(P.snake, 2930), ...visit(P.golem, 2930), {x: -90, y: 2760}, {x: -90, y: 2704}];
})();
const BAT_SPOT = {x: 1040, y: 1996}, NEST_SPOT = {x: 2165, y: 283}, GOLEM_SPOT = {x: 1905, y: 2300};
const STRAY = {coat: '#b07a45', shade: '#8a5c32', light: '#cf9a62', muzzle: '#e8d2b0'};
Z.PET_COATS = {dog: {...STRAY, collar: '#b5383f'}};
const GIFT_NAMES = {stone: 'piedra', iron: 'hierro', gold: 'oro', diamond: 'diamante', elemental: 'Piedra Elemental'};

// Comida para perro: se compra en El Almacén y no se come.
Z.ITEMS.dogfood = {name: 'Comida para perro', icon: '🦴', pet: true, detail: 'Para el perro del plato vacío, en la puerta de La guardería. Cada vez que come, hay que esperar 2 minutos.'};
Z.ITEM_ORDER.push('dogfood');
Z.SHOP_ITEMS.push({id: 'dogfood', item: true, name: 'Comida para perro', icon: '🦴', detail: 'Para el perro del plato vacío de La guardería.', price: () => DOG.price});

const emptyProgress = () => ({dog: {fed: 0, next: 0}, bat: {fed: 0}, golem: {found: false, x: GOLEM_SPOT.x, y: GOLEM_SPOT.y, given: {stone: 0, iron: 0, gold: 0, diamond: 0, elemental: 0}}, snake: {state: 'none', readyAt: 0, paid: false}});
const baseCreate = Z.createPlayer;
Z.createPlayer = function (id) { return Object.assign(baseCreate(id), {pets: {}, pet: null, petProgress: emptyProgress(), carrying: null, petEats: 0}); };

// La guardería y Doña Herminia van al final del mapa: no mueven nada de lo que recuerdan los guardados.
Z.buildExtras = function (world, object, path) {
 const h = KENNEL.house;
 object('house', h.x, h.y, h.w, h.h, true, {variant: 4, label: 'La guardería'});
 path(h.x + h.w / 2 - 13, h.y + h.h, 26, 16); path(1146, h.y + h.h + 8, h.x + h.w / 2 - 1146, 20);
 world.npcs.push({id: 'herminia', name: LADY, label: 'Hablar con ' + LADY + ', la de las víboras', x: KENNEL.lady.x, y: KENNEL.lady.y, homeX: KENNEL.lady.x, homeY: KENNEL.lady.y, targetX: KENNEL.lady.x, targetY: KENNEL.lady.y, dir: 'down', walk: 0, moving: false, wait: 4, zone: 'kennel', route: KENNEL.route, leg: 0, speed: 18,
  look: {skin: '#d9a476', skinShade: '#b47c55', top: '#4f8a4a', topShade: '#386638', topLight: '#6aa860', legs: '#4f8a4a', legsShade: '#386638', skirt: true, shoe: '#3a2c26', hair: '#bdb7aa', hairStyle: 'bun', earrings: '#9dd16a', snake: '#7a5ca0'},
  lines: ['Yo cuido a los bichos que la gente no quiere. Perros, murciélagos, piedras con patas… y víboras, mis preferidas.',
   'Esta es Norma. Es mansita, ¿ves? Bueno, no la toques igual.',
   'Si algún día encontrás una víbora rara, traémela. Las serpientes son leales, pero hay que enseñarles a vivir entre la gente.']});
 world.npcs.push({id: 'pet-wild-dog', kind: 'pet', pet: 'dog', wild: true, name: 'Perro con hambre', x: KENNEL.dog.x, y: KENNEL.dog.y, homeX: KENNEL.dog.x, homeY: KENNEL.dog.y, targetX: KENNEL.dog.x, targetY: KENNEL.dog.y, dir: 'left', faceLeft: true, static: true, radius: 7, tag: 24, walk: 0, moving: false, coat: STRAY});
 world.npcs.push({id: 'pet-wild-bat', kind: 'pet', pet: 'bat', wild: true, name: 'Murcielaguito', x: BAT_SPOT.x, y: BAT_SPOT.y, homeX: BAT_SPOT.x, homeY: BAT_SPOT.y, targetX: BAT_SPOT.x, targetY: BAT_SPOT.y, dir: 'down', static: true, radius: 6, tag: 26, walk: 0, moving: false, zone: 'cave2'});
};

const P = Z.Game.prototype;
Object.assign(P, {
 petData() {
  const p = this.player; if (!p.pets || typeof p.pets !== 'object') p.pets = {}; if (!p.petProgress) p.petProgress = emptyProgress();
  return p.petProgress;
 },
 ownsPet(id) { return !!(this.player.pets && this.player.pets[id]); },
 petName(id) { const p = this.player; return (p.pets && p.pets[id] && p.pets[id].name) || Z.PETS[id].name; },
 // +1 de cada material (y de cada Piedra Elemental) mientras el Golemsín te acompaña.
 gatherBonus() { return this.player.pet === 'golem' && this.ownsPet('golem') ? 1 : 0; },
 // Los NPC de los compañeros dependen de tu partida: se agregan y se sacan solos.
 syncPetNpcs() {
  const p = this.player, prog = this.petData(), want = new Map(), npcs = this.world.npcs;
  if (prog.dog.fed >= DOG.feeds && !this.ownsPet('dog') && !(this.cutscene && this.cutscene.id === 'lick')) this.tamePet('dog');
  if (prog.golem.found && !this.ownsPet('golem')) want.set('pet-wild-golem', {kind: 'pet', pet: 'golem', wild: true, name: 'Golemsín', x: prog.golem.x, y: prog.golem.y, static: true, radius: 9, tag: 28, zone: 'cave3'});
  if (prog.snake.state === 'hatched') want.set('pet-wild-snake', {kind: 'pet', pet: 'snake', wild: true, baby: true, name: 'Viborita', x: NEST_SPOT.x, y: NEST_SPOT.y, static: true, radius: 5, tag: 18, zone: 'weeds'});
  // Los que no llevás esperan adentro de La guardería, cada uno en su corral.
  for (const id of Z.PET_ORDER) if (this.ownsPet(id) && p.pet !== id) { const {x, y} = KENNEL.pens[id]; want.set('kennel-' + id, {kind: 'pet', pet: id, kennel: true, name: this.petName(id), x, y, radius: 7, tag: id === 'snake' ? 24 : 26, roam: KENNEL.roam, rest: [2, 6], speed: id === 'golem' ? 10 : 16, zone: 'kennel'}); }
  const gone = id => (id === 'pet-wild-dog' && this.ownsPet('dog')) || (id === 'pet-wild-bat' && this.ownsPet('bat'));
  for (let i = npcs.length - 1; i >= 0; i--) { const n = npcs[i]; if (gone(n.id) || ((/^kennel-|^pet-wild-(golem|snake)$/).test(n.id) && !want.has(n.id))) npcs.splice(i, 1); }
  for (const [id, n] of want) {
   const old = npcs.find(m => m.id === id);
   if (old) { old.name = n.name; continue; }
   npcs.push({id, homeX: n.x, homeY: n.y, targetX: n.x, targetY: n.y, dir: 'down', walk: 0, moving: false, wait: 1, ...n});
  }
 },
 // El compañero o el bicho por domesticar más cercano, a distancia de charla.
 petTarget() {
  const p = this.player; let best = null, gap = 24;
  for (const n of this.world.npcs) { if (n.kind !== 'pet' || Z.biomeAt(n.x, n.y) !== this.biome) continue; const d = Math.max(0, distance(n, p) - (n.radius || 7)); if (d <= gap) { best = n; gap = d; } }
  return best;
 },
 petSay(n, text, extra = {}) { this.startCutscene('talk', {speaker: n.wild ? n.name : this.petName(n.pet), text, focus: {x: (this.player.x + n.x) / 2, y: (this.player.y + n.y) / 2}, ...extra}); },
 petInteract(n) {
  const p = this.player, prog = this.petData();
  p.dir = this.dirOf(n.x - p.x, n.y - p.y);
  if (n.kennel) { this.sound.play(n.pet === 'dog' ? 'woof' : 'pickup'); this.effect(n.x, n.y - 22, 'heart', 1.2); this.emit('kennel', {pet: n.pet}); return 'kennel'; }
  if (n.pet === 'dog') return this.feedDog(n);
  if (n.pet === 'bat') {
   if (p.hp < this.stats().maxHealth - 1e-6) { this.petSay(n, 'Un murciélago chiquito... el pobre parece tener hambre.'); return 'hungry'; }
   this.emit('batFeed', {npc: n}); return 'ask';
  }
  if (n.pet === 'golem') return this.giveGolem(n);
  if (n.pet === 'snake' && n.baby) return this.pickSnake(n);
  return null;
 },
 // El perro del plato vacío: cinco platos de comida, con dos minutos entre uno y otro.
 feedDog(n = this.world.npcs.find(m => m.id === 'pet-wild-dog')) {
  const p = this.player, dog = this.petData().dog; if (this.ownsPet('dog') || !n) return null;
  if (p.playTime < dog.next) { this.petSay(n, '*sigue comiendo y ni te mira* Todavía le queda comida. Volvé en ' + Math.ceil(dog.next - p.playTime) + ' s.'); return 'eating'; }
  if (!this.itemCount('dogfood')) { this.petSay(n, dog.fed ? '*te reconoce y mueve la cola* El plato está vacío otra vez. (' + dog.fed + '/' + DOG.feeds + ' · El Almacén vende comida para perro.)' : '*está sentado al lado de un plato vacío y te mira con ojos de hambre* (El Almacén vende comida para perro.)'); return 'empty'; }
  this.useCharge('dogfood'); dog.fed++; dog.next = p.playTime + DOG.wait; this.sound.play('woof'); this.effect(n.x, n.y - 22, 'heart', 1.3);
  if (dog.fed >= DOG.feeds) { this.startCutscene('lick', {dog: n, from: {x: n.x, y: n.y}, focus: {x: (p.x + n.x) / 2, y: (p.y + n.y) / 2}}); return 'tamed'; }
  this.petSay(n, '*se tira de cabeza al plato* (' + dog.fed + '/' + DOG.feeds + ') Volvé en 2 minutos para el próximo plato.');
  return 'fed';
 },
 // Murcielaguito: tres veces de tu sangre, con la vida llena. Cada vez te deja con 1 de vida.
 feedBat() {
  const p = this.player, bat = this.petData().bat, n = this.world.npcs.find(m => m.id === 'pet-wild-bat');
  if (this.ownsPet('bat') || !n) return {ok: false, message: 'El murcielaguito ya está con vos.'};
  if (p.hp < this.stats().maxHealth - 1e-6) return {ok: false, message: 'Un murciélago chiquito... el pobre parece tener hambre.'};
  bat.fed++; p.hp = 1; p.hitFlash = .3; this.hurtFlash = .35; this.sound.play('drain'); this.effect(p.x, p.y - 29, 'hit', .9, {text: '-' + this.number(Math.max(0, this.stats().maxHealth - 1))});
  for (let k = 0; k < 3; k++) this.effect(n.x - 4 + k * 4, n.y - 16, 'spark', .5, {seed: k * 11, crit: false});
  if (bat.fed >= BAT.feeds) { this.tamePet('bat'); this.effect(n.x, n.y - 22, 'heart', 1.4); return {ok: true, tamed: true, message: '¡El murcielaguito se te prendió del hombro y no se quiere ir! Ahora te sigue.'}; }
  return {ok: true, message: 'Tomó un poquito y se relamió (' + bat.fed + '/' + BAT.feeds + '). Te quedó 1 de vida: curate antes de seguir.'};
 },
 // Golemsín: le das 2 de piedra, hierro, oro, diamante y Piedra Elemental. Lo que tengas, se lo vas dando.
 giveGolem(n) {
  const p = this.player, g = this.petData().golem, given = [];
  for (const [k, need] of Object.entries(GOLEM.gift)) {
   const have = k === 'elemental' ? (p.offerings.elemental || 0) : (p.materials[k] || 0), give = Math.min(have, need - (g.given[k] || 0)); if (give <= 0) continue;
   if (k === 'elemental') p.offerings.elemental -= give; else p.materials[k] -= give;
   g.given[k] = (g.given[k] || 0) + give; given.push(give + ' de ' + GIFT_NAMES[k]);
  }
  const missing = Object.entries(GOLEM.gift).filter(([k, need]) => (g.given[k] || 0) < need).map(([k, need]) => (need - (g.given[k] || 0)) + ' de ' + GIFT_NAMES[k]);
  if (!missing.length) { this.tamePet('golem'); this.sound.play('crumble'); this.effect(n.x, n.y - 26, 'heart', 1.4); this.petSay(n, '*se come todo, hace un ruido de piedras contentas y te sigue* ¡El Golemsín ya es tu compañero!'); return 'tamed'; }
  if (given.length) { this.sound.play('mine'); this.petSay(n, '*se lo traga y deja de tirarte piedras un segundo* Le diste ' + given.join(', ') + '. Todavía quiere: ' + missing.join(', ') + '.'); return 'given'; }
  this.petSay(n, '*te mira con los ojos naranjas y agarra otra piedra* Quiere: ' + missing.join(', ') + '.'); return 'missing';
 },
 // La viborita se lleva en brazos hasta la aldea: mientras tanto no podés atacar.
 pickSnake(n) {
  const p = this.player, s = this.petData().snake; if (s.state !== 'hatched') return null;
  s.state = 'carried'; p.carrying = 'snake'; this.sound.play('pickup'); this.syncPetNpcs();
  this.emit('toast', {message: 'Agarraste a la viborita. Llevala a la aldea, con ' + LADY + ' de La guardería. Mientras la tengas en brazos no podés atacar.'});
  return 'carried';
 },
 snakeState() { return this.petData().snake; },
 // Doña Herminia la cuida 10 minutos por ◉ 2000. Si no te alcanza, se los pagás cuando la vas a buscar.
 leaveSnake() {
  const p = this.player, s = this.snakeState(); if (p.carrying !== 'snake') return {ok: false, message: 'No traés ninguna víbora.'};
  p.carrying = null; s.state = 'nursery'; s.readyAt = p.playTime + SNAKE.time; s.paid = p.coins >= SNAKE.price; if (s.paid) p.coins -= SNAKE.price;
  this.sound.play(s.paid ? 'buy' : 'pickup');
  return {ok: true, message: s.paid ? 'Le pagaste ◉ ' + SNAKE.price + '. «En diez minutos te la devuelvo hecha una señorita.»' : '«No te alcanza, ¿no? No importa: me pagás los ◉ ' + SNAKE.price + ' cuando la vengas a buscar. Hasta entonces, se queda conmigo.»'};
 },
 snakeReadyIn() { const s = this.snakeState(); return Math.max(0, s.readyAt - this.player.playTime); },
 collectSnake() {
  const p = this.player, s = this.snakeState(); if (s.state !== 'nursery') return {ok: false, message: 'No te está cuidando ninguna víbora.'};
  if (this.snakeReadyIn() > 0) return {ok: false, message: 'Todavía está aprendiendo a vivir entre la gente. Volvé en ' + Math.ceil(this.snakeReadyIn() / 60) + ' min.'};
  if (!s.paid) { if (p.coins < SNAKE.price) return {ok: false, message: 'Te faltan ◉ ' + (SNAKE.price - p.coins) + '. «Sin la plata no te la doy, querido.»'}; p.coins -= SNAKE.price; s.paid = true; }
  s.state = 'done'; this.tamePet('snake'); this.sound.play('legend');
  return {ok: true, message: '«Mirá lo grande que está. Ya sabe vivir entre la gente… y se comería a cualquiera por vos.»'};
 },
 // Domesticar: queda con un nombre por defecto (después lo cambiás) y sale a acompañarte. El anterior va a la guardería.
 tamePet(id) {
  const p = this.player; this.petData(); if (this.ownsPet(id)) return false;
  p.pets[id] = {name: Z.PETS[id].name};
  const before = p.pet; p.pet = id; this.pet = null; this.ensurePet(); this.syncPetNpcs();
  this.emit('toast', {message: '¡' + Z.PETS[id].species + ' domesticado! Ahora te sigue.' + (before && before !== id ? ' ' + this.petName(before) + ' se quedó en La guardería.' : '')});
  this.emit('namePet', {pet: id}); this.emit('progress');
  return true;
 },
 namePet(id, name) {
  const clean = String(name || '').replace(/[\u0000-\u001f<>]/g, '').replace(/\s+/g, ' ').trim().slice(0, 14);
  if (!this.ownsPet(id)) return {ok: false, message: 'Ese compañero no es tuyo.'};
  this.player.pets[id].name = clean || Z.PETS[id].name; this.syncPetNpcs();
  return {ok: true, message: 'Se llama ' + this.player.pets[id].name + '.'};
 },
 // Cambiar de compañero en la guardería: el que llevabas se queda ahí.
 equipPet(id) {
  const p = this.player; if (id !== null && !this.ownsPet(id)) return {ok: false, message: 'Ese compañero no es tuyo.'};
  const before = p.pet; p.pet = id; this.pet = null; this.ensurePet(); this.syncPetNpcs(); this.sound.play('pickup');
  if (id === null) return {ok: true, message: (before ? this.petName(before) : 'Tu compañero') + ' se queda en La guardería.'};
  return {ok: true, message: this.petName(id) + ' sale con vos.' + (before && before !== id ? ' ' + this.petName(before) + ' se queda en La guardería.' : '')};
 },
 ensurePet() {
  const p = this.player;
  if (!p.pet || !this.ownsPet(p.pet)) { this.pet = null; return null; }
  if (!this.pet || this.pet.id !== p.pet) this.pet = {id: p.pet, x: p.x - 14, y: p.y + 6, dir: 1, moving: false, walk: 0, clock: 0, special: 3, shieldCd: 2, eat: 0, strike: 0, target: null};
  return this.pet;
 },
 // Daño de un golpe del compañero: una parte del de tu golpe con el arma en la mano.
 petDamage(id) { const p = this.player, stats = this.stats(), weapon = Z.WEAPON_TYPES[p.weapon] || Z.WEAPON_TYPES.fists; return stats.power * weapon.damageMultiplier * stats.damageMultiplier * this.weaponLevelMultiplier() * Z.PETS[id].hit; },
 petCanHit(e) { return !e.dead && !(e.latched > 0) && !e.air && e.biome === this.biome && !(e.type === 'gargoyle' && e.statue !== false) && !e.yielding; },
 updatePets(dt) {
  this.syncPetNpcs();
  this.updateEnemyAilments(dt); if (this.state !== 'playing') return;
  this.updateWildGolem(dt); if (this.state !== 'playing') return;
  this.updatePetStones(dt);
  const pet = this.ensurePet(); if (!pet) return;
  const p = this.player, def = Z.PETS[pet.id], safe = Z.isSafe(this.biome);
  if (Z.biomeAt(pet.x, pet.y) !== this.biome || distance(pet, p) > 320) Object.assign(pet, {x: p.x - 14, y: p.y + 6, target: null, eat: 0});
  pet.clock = Math.min(def.every, pet.clock + dt); pet.special = Math.max(0, pet.special - dt); pet.eat = Math.max(0, pet.eat - dt); pet.strike = Math.max(0, pet.strike - dt); pet.shieldCd = Math.max(0, pet.shieldCd - dt);
  const near = safe ? [] : this.enemies.filter(e => this.petCanHit(e) && distance(e, p) <= (def.range || 150) + 20);
  // Golemsín: en plena pelea, cada 20 s, te deja 3 s sin recibir ningún daño.
  if (pet.id === 'golem' && pet.shieldCd <= 0 && !safe && this.enemies.some(e => !e.dead && e.alert && e.biome === this.biome && distance(e, p) < 260)) {
   pet.shieldCd = def.special; p.invuln = Math.max(p.invuln || 0, GOLEM.shield); p.stoneShield = GOLEM.shield;
   this.sound.play('block'); this.effect(p.x, p.y - 12, 'stoneshield', .7, {seed: Math.random() * 99}); this.effect(p.x, p.y - 44, 'miss', 1, {text: '¡Escudo de piedra!'});
  }
  p.stoneShield = Math.max(0, (p.stoneShield || 0) - dt);
  if (pet.eat > 0) { pet.moving = false; return; }
  let target = pet.target && near.find(e => e.id === pet.target) || null;
  if (!target && near.length) target = near.slice().sort((a, b) => distance(a, pet) - distance(b, pet))[0];
  pet.target = target ? target.id : null;
  const facing = {down: [0, 1], up: [0, -1], left: [-1, 0], right: [1, 0]}[p.dir] || [0, 1];
  let tx = p.x - facing[0] * 18 + (facing[1] ? 14 : 0), ty = p.y - facing[1] * 14 + 4, speed = def.speed;
  if (target && !def.range) { const side = pet.x <= target.x ? -1 : 1; tx = target.x + side * (def.reach - 6); ty = target.y; }
  else if (target && def.range) { const len = distance(target, p) || 1; tx = p.x + (p.x - target.x) / len * 16; ty = p.y + (p.y - target.y) / len * 10 + 4; }
  const dx = tx - pet.x, dy = ty - pet.y, len = Math.hypot(dx, dy), before = {x: pet.x, y: pet.y};
  if (len > 3) { const step = Math.min(len, (len > 140 ? speed * 1.8 : speed) * dt), nx = pet.x + dx / len * step, ny = pet.y + dy / len * step; if (def.fly || Z.biomeAt(nx, ny) === this.biome) { pet.x = nx; pet.y = ny; } }
  pet.moving = distance(before, pet) > .05; if (pet.moving) pet.walk += dt * 9; if (Math.abs(dx) > 1) pet.dir = dx > 0 ? 1 : -1;
  if (!target) return;
  if (target.x !== pet.x) pet.dir = target.x > pet.x ? 1 : -1;
  if (def.range) { if (pet.clock >= def.every && distance(target, pet) <= def.range) { pet.clock = 0; pet.strike = .25; this.throwPetStone(pet, target); } return; }
  if (pet.clock >= def.every && Math.hypot(target.x - pet.x, target.y - pet.y) <= def.reach + 4) { pet.clock = 0; pet.strike = .2; this.petStrike(pet, target); }
 },
 petStrike(pet, e) {
  const id = pet.id, dmg = this.petDamage(id), boss = isBoss(e);
  this.sound.play(id === 'dog' ? 'bite' : id === 'bat' ? 'bite' : 'swing');
  // Mientras el enemigo es inmune (el refuerzo del Gólem, por ejemplo), no le hace ningún efecto: el especial queda para después.
  const immune = this.effectImmune(e);
  if (id === 'snake' && !boss && !immune && !e.illusion && !e.summoned && this.chance(SNAKE.eat)) {
   this.hitEnemy(e, e.hp + 1e6, true, false, 'pet');
   if (e.dead) { pet.eat = SNAKE.eatTime; pet.gulp = e.type; this.player.petEats = (this.player.petEats || 0) + 1; this.effect(e.x, e.y - 30, 'miss', 1.2, {text: '¡Ñam! De un bocado'}); this.sound.play('drain'); return 'eaten'; }
  }
  if (pet.special <= 0 && !immune) {
   pet.special = Z.PETS[id].special;
   if (id === 'dog' && e.type !== 'zak') { e.stun = Math.max(e.stun || 0, boss ? DOG.bossStun : DOG.stun); this.interruptEnemy(e); this.effect(e.x, e.y - 30, 'miss', 1, {text: '¡Mordida! Inmovilizado'}); }
   if (id === 'bat') { e.bleeding = {time: BAT.bleed, tick: 1, damage: dmg * BAT.tick}; this.effect(e.x, e.y - 30, 'miss', 1, {text: '¡Desangrado!'}); }
   if (id === 'snake') { e.venom = {time: SNAKE.venom, tick: 1, damage: dmg * .5}; this.effect(e.x, e.y - 30, 'miss', 1, {text: '¡Envenenado!'}); }
  }
  this.hitEnemy(e, dmg, false, false, 'pet');
  return 'hit';
 },
 throwPetStone(pet, e) { this.petStones = this.petStones || []; this.petStones.push({x: pet.x, y: pet.y - 12, target: e.id, damage: this.petDamage('golem'), life: 2}); this.sound.play('swing'); },
 updatePetStones(dt) {
  if (!this.petStones || !this.petStones.length) return;
  this.petStones = this.petStones.filter(s => {
   const e = this.enemies.find(m => m.id === s.target); s.life -= dt; if (!e || e.dead || s.life <= 0) return false;
   const dx = e.x - s.x, dy = e.y - 8 - s.y, len = Math.hypot(dx, dy), step = 260 * dt;
   if (len <= step + 6) { if (this.petCanHit(e)) { this.hitEnemy(e, s.damage, false, false, 'pet'); this.effect(e.x, e.y - 10, 'spark', .3, {seed: s.x}); } return false; }
   s.x += dx / len * step; s.y += dy / len * step; s.spin = (s.spin || 0) + dt * 12; return true;
  });
 },
 // Desangrado del murciélago (la armadura lo frena) y veneno de la serpiente (la ignora): daño por segundo.
 // `dealt` guarda lo que sacó el último segundo, para la Sangre compartida.
 updateEnemyAilments(dt) {
  for (const e of this.enemies) {
   if (e.dead) { e.bleeding = null; e.venom = null; continue; }
   for (const key of ['bleeding', 'venom']) {
    const a = e[key]; if (!a) continue; a.time -= dt; a.tick -= dt;
    if (a.tick <= 1e-8) { a.tick += 1; const hp = e.hp; this.hitEnemy(e, a.damage, key !== 'bleeding', false, 'pet'); a.dealt = Math.max(0, hp - e.hp); if (this.state !== 'playing') return; }
    if (e[key] && e[key].time <= 1e-6) e[key] = null;
   }
  }
 },
 // El Golemsín salvaje te tira una piedra cada 2 s: 5 de vida, sin importar la armadura.
 updateWildGolem(dt) {
  const n = this.world.npcs.find(m => m.id === 'pet-wild-golem'); if (!n || this.biome !== 'cave3') return;
  const p = this.player, len = distance(n, p); n.throwCd = Math.max(0, (n.throwCd === undefined ? 1 : n.throwCd) - dt);
  if (len > GOLEM.range || n.throwCd > 0) return;
  n.throwCd = GOLEM.throwEvery; n.dir = p.x < n.x ? 'left' : 'right'; n.throwing = .3;
  const dx = (p.x - n.x) / (len || 1), dy = (p.y - 6 - (n.y - 14)) / (len || 1);
  this.projectiles.push({x: n.x + dx * 8, y: n.y - 14 + dy * 8, dx, dy, type: 'pebble', hostile: true, pierce: true, damage: GOLEM.damage, source: 'golemsin', traveled: 0, range: GOLEM.range + 40});
  this.sound.play('swing');
 },
 // 5%: al caer el Gólem en Las Entrañas, entre los escombros aparece un Golemsín.
 maybeGolemsin(e) {
  const g = this.petData().golem; if (this.ownsPet('golem') || g.found || e.summoned || !this.chance(GOLEM.chance)) return false;
  const spot = this.freeSpot(e.x + 50, e.y + 10, 'cave3'); g.found = true; g.x = Math.round(spot.x); g.y = Math.round(spot.y);
  this.syncPetNpcs(); this.effect(g.x, g.y - 10, 'poof', .8, {seed: 5}); this.sound.play('crumble');
  this.emit('toast', {message: 'Entre los escombros del Gólem se mueve algo chiquito… ¡y te tira piedras! Es un Golemsín: dale 2 de piedra, hierro, oro, diamante y Piedra Elemental.'});
  return true;
 },
 // 5%: al caer la Yarará, uno de sus huevos se rompe y sale una viborita.
 maybeHatch(e) {
  const s = this.petData().snake; if (this.ownsPet('snake') || s.state !== 'none' || e.summoned || !this.chance(SNAKE.chance)) return false;
  s.state = 'hatched'; this.syncPetNpcs();
  this.startCutscene('hatch', {focus: {x: NEST_SPOT.x, y: NEST_SPOT.y - 20}, nest: {...NEST_SPOT}});
  return true;
 }
});
Z.UPDATERS = Z.UPDATERS || []; Z.UPDATERS.push(function (dt) { this.updatePets(dt); });

// Ganchos sobre lo que ya existía.
const baseInteract = P.interact, baseNearby = P.nearbyAction, baseAttack = P.attack, baseKnockout = P.knockout, baseOnKill = P.onKill, baseUse = P.useItem;
const baseTalk = P.talkTo, baseHasMenu = P.npcHasMenu, baseHint = P.npcMenuHint, baseRestore = P.restoreInventory, baseNew = P.newGame, baseTravel = P.travel, baseStairs = P.takeStairs;
P.interact = function () {
 if (this.state !== 'playing' || this.cutscene) return;
 if (!this.player.fishing) { const n = this.petTarget(); if (n) { this.petInteract(n); return; } }
 return baseInteract.call(this);
};
P.nearbyAction = function () {
 const n = !this.player.fishing && this.petTarget();
 if (n) {
  if (n.kennel) return {item: n, label: 'Ver a ' + this.petName(n.pet) + ' (' + Z.PETS[n.pet].species.toLowerCase() + ')'};
  const prog = this.petData();
  if (n.pet === 'dog') return {item: n, label: 'Darle de comer al perro (🦴 ' + this.itemCount('dogfood') + ' · ' + prog.dog.fed + '/' + DOG.feeds + ')'};
  if (n.pet === 'bat') return {item: n, label: 'Mirar al murcielaguito (' + prog.bat.fed + '/' + BAT.feeds + ')'};
  if (n.pet === 'golem') return {item: n, label: 'Darle materiales al Golemsín'};
  if (n.pet === 'snake') return {item: n, label: 'Agarrar a la viborita'};
 }
 return baseNearby.call(this);
};
P.attack = function (direction) {
 if (this.player.carrying && this.state === 'playing' && !this.cutscene) {
  if (!this.carryNotice || this.time - this.carryNotice > 3) { this.carryNotice = this.time; this.emit('toast', {message: 'Con la viborita en brazos no podés atacar. Llevala a la aldea.'}); }
  return false;
 }
 return baseAttack.call(this, direction);
};
// Si te noquean con la viborita en brazos, se vuelve sola al nido.
P.knockout = function (source) {
 const p = this.player; if (p.carrying === 'snake') { p.carrying = null; this.petData().snake.state = 'hatched'; }
 this.petStones = []; if (this.pet) Object.assign(this.pet, {target: null, eat: 0});
 const result = baseKnockout.call(this, source); if (this.pet) Object.assign(this.pet, {x: p.x - 14, y: p.y + 6}); return result;
};
P.onKill = function (e) {
 baseOnKill.call(this, e);
 if (e.type === 'golem' && e.biome === 'cave3') this.maybeGolemsin(e);
 if (e.type === 'yarara') this.maybeHatch(e);
};
P.useItem = function (id) {
 if (id === 'dogfood') return {ok: false, message: 'La comida para perro es para el perro del plato vacío, en La guardería. Acercate y apretá E.'};
 return baseUse.call(this, id);
};
// Doña Herminia: si le traés la viborita o la tiene ella, te cuenta cómo va.
P.talkTo = function (n) {
 if (n.name === LADY) {
  const p = this.player, s = this.snakeState(); let text = null;
  if (p.carrying === 'snake') text = '¡Pero mirá lo que traés! Es una serpiente muy rara, leal y letal. Por ◉ ' + SNAKE.price + ' te la cuido y le enseño a vivir entre humanos. Son diez minutos.';
  else if (s.state === 'nursery') text = this.snakeReadyIn() > 0 ? 'Tu viborita está aprendiendo modales. Volvé en ' + Math.ceil(this.snakeReadyIn() / 60) + ' min.' : s.paid ? '¡Ya está lista! Vení que te la doy.' : 'Ya está lista, pero primero los ◉ ' + SNAKE.price + ', querido.';
  if (text) { p.dir = this.dirOf(n.x - p.x, n.y - p.y); n.dir = this.dirOf(p.x - n.x, p.y - n.y); n.wait = Math.max(n.wait || 0, 2.5); this.startCutscene('talk', {speaker: n.name, text, focus: {x: (p.x + n.x) / 2, y: (p.y + n.y) / 2}, menu: n}); return; }
 }
 return baseTalk.call(this, n);
};
P.npcHasMenu = function (n) { if (n.name === LADY) return this.player.carrying === 'snake' || this.snakeState().state === 'nursery'; return baseHasMenu.call(this, n); };
P.npcMenuHint = function (n) { if (n.name === LADY) return this.player.carrying === 'snake' ? 'cuida víboras' : this.snakeReadyIn() > 0 ? 'cuida tu viborita' : '¡tu viborita está lista!'; return baseHint.call(this, n); };
P.newGame = function (id) { this.pet = null; this.petStones = []; return baseNew.call(this, id); };
P.travel = function (spot, biome) { const r = baseTravel.call(this, spot, biome); if (this.pet) Object.assign(this.pet, {x: spot.x - 14, y: spot.y + 6, target: null}); this.petStones = []; return r; };
P.takeStairs = function (stairs) { const r = baseStairs.call(this, stairs); if (r && this.pet) Object.assign(this.pet, {x: this.player.x - 14, y: this.player.y + 6, target: null}); if (r) this.petStones = []; return r; };
// Guardados: las partidas viejas arrancan sin compañeros y sin progreso.
P.restoreInventory = function (p, source) {
 baseRestore.call(this, p, source);
 const prog = emptyProgress(), sp = source.petProgress && typeof source.petProgress === 'object' ? source.petProgress : {};
 p.pets = {};
 if (source.pets && typeof source.pets === 'object') for (const id of Z.PET_ORDER) { const pet = source.pets[id]; if (pet && typeof pet === 'object') p.pets[id] = {name: String(pet.name || Z.PETS[id].name).replace(/[\u0000-\u001f<>]/g, '').trim().slice(0, 14) || Z.PETS[id].name}; }
 p.pet = typeof source.pet === 'string' && p.pets[source.pet] ? source.pet : null;
 if (sp.dog) { prog.dog.fed = Math.floor(clamp(finite(sp.dog.fed), 0, DOG.feeds)); prog.dog.next = clamp(finite(sp.dog.next), 0, p.playTime + DOG.wait); }
 if (sp.bat) prog.bat.fed = Math.floor(clamp(finite(sp.bat.fed), 0, BAT.feeds));
 if (sp.golem) {
  prog.golem.found = sp.golem.found === true;
  if (Number.isFinite(sp.golem.x) && Number.isFinite(sp.golem.y) && Z.biomeAt(sp.golem.x, sp.golem.y) === 'cave3') { prog.golem.x = sp.golem.x; prog.golem.y = sp.golem.y; }
  if (sp.golem.given) for (const k of Object.keys(GOLEM.gift)) prog.golem.given[k] = Math.floor(clamp(finite(sp.golem.given[k]), 0, GOLEM.gift[k]));
 }
 if (sp.snake && ['none', 'hatched', 'carried', 'nursery', 'done'].includes(sp.snake.state)) { prog.snake.state = sp.snake.state; prog.snake.readyAt = clamp(finite(sp.snake.readyAt), 0, p.playTime + SNAKE.time); prog.snake.paid = sp.snake.paid === true; }
 if (prog.snake.state === 'done' && !p.pets.snake) prog.snake.state = 'none';
 p.petProgress = prog; p.carrying = source.carrying === 'snake' && prog.snake.state === 'carried' ? 'snake' : null;
 if (prog.snake.state === 'carried' && !p.carrying) prog.snake.state = 'hatched';
 p.petEats = Math.floor(clamp(finite(source.petEats), 0, 1e6));
 this.pet = null; this.petStones = [];
};

// La escena del perro: se acerca corriendo, salta y te llena la cara de lengüetazos.
Z.SCENES.lick = {plain: true, steps: [
 {at: 0, run(s) { this.sound.play('woof'); }},
 {at: 1.2, run(s) { this.sound.play('woof'); s.licking = true; }},
 {at: 3.4, skip: true, run(s) { this.say(s, 'Perro', '*te llena la cara de baba y mueve la cola tan fuerte que se mueve entero* ¡Ahora te sigue a todos lados!'); }},
 {at: 3600, skip: true, run(s) { this.endCutscene(); this.cutsceneFade = 0; this.tamePet('dog'); }}
], tick(s, dt) {
 const n = s.dog, p = this.player; if (!n) return;
 const dx = p.x + (n.x < p.x ? -10 : 10) - n.x, dy = p.y + 2 - n.y, len = Math.hypot(dx, dy);
 if (len > 1) { const step = Math.min(len, 90 * dt); n.x += dx / len * step; n.y += dy / len * step; n.moving = true; n.walk = (n.walk || 0) + dt * 12; n.faceLeft = dx < 0; } else n.moving = false;
 n.lick = s.licking ? s.t - 1.2 : 0;
 if (s.licking && Math.floor(s.t * 5) !== Math.floor((s.t - dt) * 5)) { this.effect(p.x + (Math.random() - .5) * 10, p.y - 26, 'heart', 1); if (Math.random() < .5) this.sound.play('woof'); }
}};
// El cascarón: el huevo tiembla, se raja y salta en pedazos.
Z.SCENES.hatch = {steps: [
 {at: 0, run() { this.sound.play('telegraph'); }},
 {at: 1.1, run() { this.sound.play('crumble'); }},
 {at: 1.9, run() { this.sound.play('crumble'); this.shake(2, .2); }},
 {at: 2.5, run(s) { s.out = true; this.sound.play('pickup'); this.effect(s.nest.x, s.nest.y - 8, 'hatch', .9, {seed: 7}); }},
 {at: 3.4, skip: true, run(s) { this.say(s, '', '¡Del nido de la Yarará salió una viborita! Agarrala con E y llevala a la aldea, con ' + LADY + '.'); }},
 {at: 3600, skip: true, run() { this.endCutscene(); }}
]};
})();
