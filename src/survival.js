/* Recolección, inventario perdido y consumibles. Todos los relojes usan tiempo de juego. */
(function () {
'use strict';
const Z = window.Zak, G = Z.Game.prototype;
const EPS = 1e-8, RESOURCE_KEYS = ['wood', 'stone', 'metal'];
const SPECIAL_IDS = ['gero', 'paco', 'fede', 'pepe', 'tena', 'dante'];
const KNOWN_WEAPONS = ['bow', 'sword', 'stone', 'axe', 'pickaxe'];
const spawnPointCache = new Map();
const distance = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);
const freshResources = () => ({wood: 0, stone: 0, metal: 0});
const resourcesCopy = source => Object.fromEntries(RESOURCE_KEYS.map(k => [k, source?.[k] || 0]));
const aliveSpecial = (p, id) => p.special?.id === id && p.special.time > EPS;
const regionOf = (x, y) => Z.biomeAt(x, y);
const notify = (game, message) => game.emit('toast', {message});

// Flood fill over walkable cells prevents random consumables appearing behind cave walls.
// The cells are cached for this world; exact collision is checked again on every spawn.
G.specialSpawnPoints = function () {
 if (this._specialSpawnWorld === this.world && this._specialSpawnPoints) return this._specialSpawnPoints;
 const world = this.world, step = 24, cols = Math.ceil(world.width / step), rows = Math.ceil(world.height / step);
 const signature = JSON.stringify([world.width, world.height, world.spawn,
  world.objects.filter(o => o.solid || o.resource).map(o => [o.x, o.y, o.w, o.h, o.solid, o.resource]), world.npcs.map(n => [n.x, n.y])]);
 if (spawnPointCache.has(signature)) {
  this._specialSpawnWorld = world; this._specialSpawnPoints = spawnPointCache.get(signature); return this._specialSpawnPoints;
 }
 const points = {village: [], cave: [], weeds: []}, seen = new Set(), queue = [];
 const add = (cx, cy) => {
  const key = cy * cols + cx;
  if (cx < 1 || cy < 1 || cx >= cols - 1 || cy >= rows - 1 || seen.has(key)) return;
  seen.add(key); const x = cx * step + step / 2, y = cy * step + step / 2;
  if (Z.collides(world, x, y, 11)) return;
  queue.push({cx, cy, x, y});
 };
 add(Math.floor(world.spawn.x / step), Math.floor(world.spawn.y / step));
 for (let index = 0; index < queue.length; index++) {
  const p = queue[index];
  // Regrowing resources keep their footprint, including while they are depleted.
  if (!world.objects.some(o => o.resource && p.x > o.x - 16 && p.x < o.x + o.w + 16 && p.y > o.y - 16 && p.y < o.y + o.h + 16))
   points[regionOf(p.x, p.y)]?.push({x: p.x, y: p.y});
  for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
   if (!Z.collides(world, p.x + dx * step / 2, p.y + dy * step / 2, 11)) add(p.cx + dx, p.cy + dy);
  }
 }
 if (spawnPointCache.size >= 4) spawnPointCache.delete(spawnPointCache.keys().next().value);
 spawnPointCache.set(signature, points); this._specialSpawnWorld = world; this._specialSpawnPoints = points; return points;
};

G.placeSpecial = function (pickup) {
 const points = this.specialSpawnPoints()[pickup.biome] || [];
 const start = Math.floor(Math.random() * Math.max(1, points.length));
 for (let i = 0; i < points.length; i++) {
  const point = points[(start + i) % points.length];
  if (pickup.x > 0 && distance(point, pickup) < 65) continue;
  if (distance(point, this.player) < 55 || Z.collides(this.world, point.x, point.y, 11)) continue;
  if (this.world.pickups.some(other => other !== pickup && !other.collected && distance(other, point) < 65)) continue;
  pickup.x = point.x; pickup.y = point.y; return true;
 }
 // If every candidate is temporarily occupied, retry next simulation step instead of spawning in a wall.
 return false;
};

G.initSurvival = function (saved = null) {
 const p = this.player;
 p.resources = freshResources(); p.weaponOrigins = {};
 for (const weapon of p.weapons) if (KNOWN_WEAPONS.includes(weapon)) p.weaponOrigins[weapon] = weapon === 'pickaxe' ? 'crafted' : 'world';
 p.special = null; p.stomach = 0;
 this.lootBags = []; this.world.lootBags = this.lootBags; this.groundEffects = []; this._lootSerial = 0; this._groundSerial = 0;
 this._smokeEmission = 0; this._pendingWeaponRespawns = new Set(); this._survivalPosition = {x: p.x, y: p.y};
 this.world.pickups = this.world.pickups.filter(pickup => pickup.type !== 'special');
 for (const item of this.world.pickups) if (item.type === 'herb' && item.collected) item.respawn = 10;
 for (const o of this.world.objects) {
  if (o.type === 'tree' && !o.resource) o.resource = 'wood';
  if (!RESOURCE_KEYS.includes(o.resource)) continue;
  o.maxHits = o.resource === 'wood' ? 3 : o.resource === 'stone' ? 4 : 7;
  o.hits = o.maxHits; o.depleted = false; o.regrow = 0; o.solid = true;
 }
 const definition = Z.SPECIAL_ITEMS?.[p.characterId] || {name: p.characterId, color: '#edc47a'};
 ['village', 'village', 'cave', 'cave', 'weeds', 'weeds', 'weeds', 'weeds'].forEach((biome, index) => {
  const item = {id: 'special-' + p.characterId + '-' + index, type: 'special', characterId: p.characterId,
   biome, x: 0, y: 0, label: 'Consumir ' + definition.name, color: definition.color, collected: true, respawn: 0};
  this.world.pickups.push(item); item.collected = !this.placeSpecial(item);
 });
 if (saved) this.restoreSurvival(saved);
};

G.harvest = function (dx, dy, range) {
 const p = this.player;
 if (this.state !== 'playing' || p.stomach > EPS || !['axe', 'pickaxe'].includes(p.weapon)) return false;
 const eligible = this.world.objects.filter(o => !o.depleted && o.resource &&
  (p.weapon === 'axe' ? o.resource === 'wood' : o.resource === 'stone' || o.resource === 'metal'));
 let nearest = null, nearestDistance = Number.isFinite(range) ? range : 46;
 for (const o of eligible) {
  const x = Math.max(o.x, Math.min(p.x, o.x + o.w)), y = Math.max(o.y, Math.min(p.y, o.y + o.h));
  const ex = x - p.x, ey = y - p.y, len = Math.hypot(ex, ey);
  if (len <= nearestDistance && (len < 10 || (ex * dx + ey * dy) / len > .2)) {nearest = o; nearestDistance = len;}
 }
 if (!nearest) return false;
 nearest.hits = Math.max(0, (nearest.hits ?? nearest.maxHits) - 1);
 this.effect(nearest.x + nearest.w / 2, nearest.y - 12, 'hit', .55, {text: nearest.hits ? nearest.hits + ' golpes' : '+ recurso'});
 this.sound.play('hit');
 if (!nearest.hits) {
  const quantity = nearest.resource === 'metal' ? 3 : 4;
  p.resources[nearest.resource] += quantity; nearest.depleted = true; nearest.regrow = 30; nearest.solid = false;
  const names = {wood: 'madera', stone: 'piedra', metal: 'metal'};
  notify(this, '+' + quantity + ' de ' + names[nearest.resource] + '. El recurso se recupera en 30 s.');
  this.sound.play('pickup'); this.emit('tick');
 }
 return true;
};

G.craft = function (recipeId) {
 if (this.state !== 'playing' && this.state !== 'paused') return false;
 const recipe = Z.CRAFTING_RECIPES?.[recipeId], p = this.player;
 if (!recipe || !KNOWN_WEAPONS.includes(recipeId)) return false;
 if (p.weapons.includes(recipeId) || this.lootBags.some(bag => bag.weapons.includes(recipeId))) {
  notify(this, 'Ya tenés ese objeto o está en una mochila por recuperar.'); return false;
 }
 const missing = (recipe.requires || []).find(required => !p.weapons.includes(required));
 if (missing) {notify(this, 'Necesitás llevar ' + Z.WEAPON_TYPES[missing].name.toLowerCase() + ' para fabricarlo.'); return false;}
 const cost = recipe.cost;
 if (!cost || RESOURCE_KEYS.some(key => (cost[key] || 0) > p.resources[key])) {notify(this, 'Todavía faltan recursos para esa receta.'); return false;}
 for (const key of RESOURCE_KEYS) p.resources[key] -= cost[key] || 0;
 p.weapons.push(recipeId); p.weaponOrigins[recipeId] = 'crafted'; p.weapon = recipeId;
 this.sound.play('pickup'); notify(this, 'Fabricaste ' + Z.WEAPON_TYPES[recipeId].name.toLowerCase() + '.'); this.emit('tick'); return true;
};

G.dropInventory = function (x, y) {
 const p = this.player, weapons = p.weapons.filter(id => KNOWN_WEAPONS.includes(id));
 if (!weapons.length && !RESOURCE_KEYS.some(key => p.resources[key] > 0)) return null;
 const origins = Object.fromEntries(weapons.map(id => [id, p.weaponOrigins[id] === 'crafted' ? 'crafted' : 'world']));
 const bag = {id: 'loot-' + ++this._lootSerial, type: 'lootBag', x, y, time: 300, weapons, origins, resources: resourcesCopy(p.resources)};
 this.lootBags.push(bag); p.weapons = ['fists']; p.weapon = 'fists'; p.weaponOrigins = {}; p.resources = freshResources();
 p.stoneAmmo = 1; p.stoneWalkTime = 0; this.emit('tick'); return bag;
};

G.recoverBag = function (bag) {
 if (this.state !== 'playing' || !this.lootBags.includes(bag) || bag.time <= EPS || distance(bag, this.player) > 52) return false;
 const p = this.player;
 for (const id of bag.weapons) {
  if (!p.weapons.includes(id)) p.weapons.push(id);
  // Unique weapons merge without losing the original map provenance.
  p.weaponOrigins[id] = p.weaponOrigins[id] === 'world' || bag.origins[id] === 'world' ? 'world' : 'crafted';
 }
 for (const key of RESOURCE_KEYS) p.resources[key] += bag.resources[key];
 this.lootBags = this.lootBags.filter(other => other !== bag); this.world.lootBags = this.lootBags;
 this.sound.play('pickup'); notify(this, 'Recuperaste tu mochila: armas, herramientas y recursos.'); this.emit('tick'); return true;
};

G.releaseWorldWeapons = function (expiredBags) {
 for (const bag of expiredBags) for (const id of bag.weapons) if (bag.origins[id] === 'world') this._pendingWeaponRespawns.add(id);
 for (const item of this.world.pickups) {
  if (!this._pendingWeaponRespawns.has(item.type)) continue;
  if (this.player.weapons.includes(item.type) || this.lootBags.some(bag => bag.weapons.includes(item.type))) continue;
  item.collected = false; this._pendingWeaponRespawns.delete(item.type);
 }
};

G.consumeSpecial = function (item) {
 const p = this.player;
 if (this.state !== 'playing' || !item || item.type !== 'special' || item.collected || item.characterId !== p.characterId || p.stomach > EPS) return false;
 item.collected = true; item.respawn = 10;
 p.special = {id: p.characterId, time: 5};
 if (p.characterId === 'gero') p.special.shield = this.stats().maxHealth * .4;
 if (p.characterId === 'paco') {
  this.heal(this.stats().maxHealth); this.addGroundEffect('milk', p.x, p.y, 55, 5);
 }
 if (p.characterId === 'fede') {p.stamina = 1; p.exhausted = 0; p.restTime = 0;}
 if (p.characterId === 'pepe') {this.heal(this.stats().maxHealth * .35); this._smokeEmission = .12;}
 if (p.characterId === 'dante') {
  for (const e of this.enemies) if (!e.dead && e.biome === this.biome && distance(e, p) <= 170) {
   e.freeze = 5; e.latched = 0; e.alert = false; this.effect(e.x, e.y - 18, 'heal', .7, {text: '❄'});
  }
  this.effect(p.x, p.y, 'wave', .65, {radius: 170, color: '#acd9ee'});
 }
 this.sound.play('pickup'); const definition = Z.SPECIAL_ITEMS?.[p.characterId];
 notify(this, (definition?.name || p.characterId) + ': efecto activo durante 5 s.'); this.emit('tick'); return true;
};

G.addGroundEffect = function (type, x, y, radius, time) {
 const effect = {id: 'ground-' + ++this._groundSerial, type, x, y, radius, time, maxTime: time};
 this.groundEffects.push(effect); return effect;
};

G.specialContact = function (enemy) {
 const p = this.player;
 if (!aliveSpecial(p, 'fede') || !p.running || enemy.dead || enemy.trampleCooldown > EPS || enemy.biome !== this.biome || distance(enemy, p) > 27) return false;
 enemy.trampleCooldown = .5; this.hitEnemy(enemy, this.stats().strength, true); return true;
};

G.fireStomachWave = function () {
 const p = this.player;
 this.effect(p.x, p.y, 'wave', .8, {radius: 145, color: '#ff8c48', fire: true}); this.sound.play('wave');
 for (const e of this.enemies) if (!e.dead && e.biome === this.biome && distance(e, p) <= 145) {
  this.hitEnemy(e, 15, true); if (!e.dead) e.burn = {time: 3, tick: 1};
 }
 this.hurtPlayer(10, 'self', true, true);
};

G.updateSurvival = function (dt) {
 if (this.state !== 'playing' || !Number.isFinite(dt) || dt <= 0) return;
 const p = this.player, stomachBefore = p.stomach || 0;
 for (const item of this.world.pickups) if (item.collected && (item.type === 'herb' || item.type === 'special')) {
  item.respawn = Math.max(0, (item.respawn || 0) - dt);
  if (item.respawn <= EPS && (item.type === 'herb' || this.placeSpecial(item))) item.collected = false;
 }
 for (const o of this.world.objects) if (o.resource && o.depleted) {
  o.regrow = Math.max(0, o.regrow - dt);
  const occupied = [p, ...this.world.npcs, ...this.lootBags, ...this.enemies.filter(e => !e.dead)]
   .some(entity => entity.x > o.x - 20 && entity.x < o.x + o.w + 20 && entity.y > o.y - 20 && entity.y < o.y + o.h + 20);
  if (o.regrow <= EPS && !occupied) {o.depleted = false; o.hits = o.maxHits; o.solid = true;}
 }
 const expiredBags = [];
 this.lootBags = this.lootBags.filter(bag => {bag.time = Math.max(0, bag.time - dt); if (bag.time <= EPS) {expiredBags.push(bag); return false;} return true;});
 this.world.lootBags = this.lootBags;
 this.releaseWorldWeapons(expiredBags);
 if (expiredBags.length) notify(this, 'Una mochila se perdió. Las armas originales disponibles volvieron a su lugar.');
 // Each enemy has one smoke clock: overlapping clouds never multiply its damage.
 for (const e of this.enemies) {
  e.trampleCooldown = Math.max(0, (e.trampleCooldown || 0) - dt);
  e.freeze = Math.max(0, (e.freeze || 0) - dt);
  if (e.dead) {e.burn = null; continue;}
  if (e.burn) {
   const active = Math.min(dt, e.burn.time); e.burn.time = Math.max(0, e.burn.time - dt); e.burn.tick -= active;
   while (e.burn.tick <= EPS && !e.dead) {e.burn.tick += 1; this.hitEnemy(e, 3, true);}
   if (e.burn.time <= EPS || e.dead) e.burn = null;
  }
  const smoke = this.groundEffects.filter(g => g.type === 'smoke' && g.time > EPS && distance(g, e) <= g.radius);
  if (smoke.length && !e.dead) {
   e.smokeTick = (e.smokeTick ?? .2) - Math.min(dt, Math.max(...smoke.map(g => g.time)));
   while (e.smokeTick <= EPS && !e.dead) {e.smokeTick += .2; this.hitEnemy(e, 2, true);}
  } else e.smokeTick = .2;
 }
 this.groundEffects.forEach(effect => effect.time = Math.max(0, effect.time - dt));
 this.groundEffects = this.groundEffects.filter(effect => effect.time > EPS);
 if (p.special) {
  const active = Math.min(dt, p.special.time), id = p.special.id;
  if (id === 'fede') {p.stamina = 1; p.exhausted = 0;}
  if (id === 'pepe' && p.moving && distance(p, this._survivalPosition || p) > .01) {
   this._smokeEmission += active;
   if (this._smokeEmission >= .12 - EPS) {this._smokeEmission %= .12; this.addGroundEffect('smoke', p.x, p.y, 22, 2);}
  }
  p.special.time = Math.max(0, p.special.time - dt);
  if (p.special.time <= EPS) {
   p.special = null;
   if (id === 'tena') {
    p.stomach = 1; p.running = false; p.moving = false;
    this.sound.tone(75, .28, 'sawtooth', .035, 0, 40); this.sound.tone(60, .3, 'triangle', .05, .35, 25);
    notify(this, 'Ese chaufa... ¡preparate!');
   }
   if (id === 'dante') this.hurtPlayer(3, 'self', true, true);
  }
 }
 if (stomachBefore > EPS && this.state === 'playing') {
  p.stomach = Math.max(0, stomachBefore - dt); if (p.stomach <= EPS) {p.stomach = 0; this.fireStomachWave();}
 }
 this._survivalPosition = {x: p.x, y: p.y};
};

G.serializeSurvival = function () {
 const p = this.player;
 return JSON.parse(JSON.stringify({version: 1, resources: resourcesCopy(p.resources), origins: p.weaponOrigins,
  special: p.special, stomach: p.stomach || 0, smokeEmission: this._smokeEmission || 0, pendingWeapons: [...this._pendingWeaponRespawns],
  lootBags: this.lootBags, groundEffects: this.groundEffects,
  pickups: this.world.pickups.filter(i => i.type === 'herb' || i.type === 'special').map(i => ({id: i.id, x: i.x, y: i.y, collected: i.collected, respawn: i.respawn || 0})),
  nodes: this.world.objects.filter(o => o.resource).map(o => ({id: o.id, hits: o.hits, depleted: o.depleted, regrow: o.regrow})),
  enemies: this.enemies.map(e => ({id: e.id, freeze: e.freeze || 0, burn: e.burn || null, smokeTick: e.smokeTick ?? .2, trampleCooldown: e.trampleCooldown || 0}))}));
};

// Reject malformed extension data before restoration, and never spread user-controlled objects.
Z.validateSurvivalSave = function (saved, player) {
 if (saved == null) return true;
 const bad = () => {throw new Error('La partida contiene datos inválidos de recursos o consumibles.');};
 const object = value => !!value && typeof value === 'object' && !Array.isArray(value);
 const number = (value, min, max) => typeof value === 'number' && Number.isFinite(value) && value >= min && value <= max;
 const resources = value => object(value) && RESOURCE_KEYS.every(k => Number.isSafeInteger(value[k]) && number(value[k], 0, 1e9));
 const origins = value => object(value) && Object.keys(value).every(k => KNOWN_WEAPONS.includes(k) && ['world', 'crafted'].includes(value[k]));
 const position = value => number(value.x, 12, 2388) && number(value.y, 12, 1788);
 const burn = value => value === null || (object(value) && number(value.time, 0, 3) && number(value.tick, 0, 1 + EPS));
 const unique = items => items.every(object) && new Set(items.map(i => i.id)).size === items.length;
 if (!object(saved) || saved.version !== 1 || !resources(saved.resources) || !origins(saved.origins) || !number(saved.stomach, 0, 1) || !number(saved.smokeEmission, 0, .120001)) bad();
 if (!Array.isArray(saved.pendingWeapons) || saved.pendingWeapons.length > 5 || !saved.pendingWeapons.every(id => KNOWN_WEAPONS.includes(id))) bad();
 if (saved.special !== null) {
  const s = saved.special;
  if (!object(s) || !SPECIAL_IDS.includes(s.id) || (player && s.id !== player.characterId) || !number(s.time, 0, 5) || (s.id === 'gero' && !number(s.shield, 0, 200))) bad();
 }
 if (player && saved.stomach > 0 && player.characterId !== 'tena') bad();
 if (!Array.isArray(saved.lootBags) || saved.lootBags.length > 100 || !unique(saved.lootBags)) bad();
 for (const b of saved.lootBags) if (!object(b) || !/^loot-\d+$/.test(b.id) || !position(b) || !number(b.time, 0, 300) || !resources(b.resources) || !origins(b.origins) || !Array.isArray(b.weapons) || b.weapons.length > 5 || new Set(b.weapons).size !== b.weapons.length || !b.weapons.every(id => KNOWN_WEAPONS.includes(id) && ['world', 'crafted'].includes(b.origins[id]))) bad();
 if (!Array.isArray(saved.groundEffects) || saved.groundEffects.length > 200 || !unique(saved.groundEffects)) bad();
 for (const g of saved.groundEffects) if (!object(g) || !/^ground-\d+$/.test(g.id) || !position(g) || !['milk', 'smoke'].includes(g.type) || g.radius !== (g.type === 'milk' ? 55 : 22) || !number(g.time, 0, g.type === 'milk' ? 5 : 2) || g.maxTime !== (g.type === 'milk' ? 5 : 2)) bad();
 if (!Array.isArray(saved.pickups) || saved.pickups.length > 100 || !unique(saved.pickups)) bad();
 for (const item of saved.pickups) if (!object(item) || !/^herb-\d+$|^special-(gero|paco|fede|pepe|tena|dante)-[0-7]$/.test(item.id) || !position(item) || typeof item.collected !== 'boolean' || !number(item.respawn, 0, 10)) bad();
 if (!Array.isArray(saved.nodes) || saved.nodes.length > 1000 || !unique(saved.nodes)) bad();
 for (const n of saved.nodes) if (!object(n) || !/^(object-\d+|ore-(stone|metal)-\d+)$/.test(n.id) || !Number.isInteger(n.hits) || !number(n.hits, 0, 7) || typeof n.depleted !== 'boolean' || !number(n.regrow, 0, 30)) bad();
 if (!Array.isArray(saved.enemies) || saved.enemies.length > 100 || !unique(saved.enemies)) bad();
 for (const e of saved.enemies) if (!object(e) || !/^(thief|dog|snake|rat)-\d+$/.test(e.id) || !number(e.freeze, 0, 5) || !burn(e.burn) || !number(e.smokeTick, 0, .2 + EPS) || !number(e.trampleCooldown, 0, .5)) bad();
 return true;
};

G.restoreSurvival = function (saved) {
 if (!saved) return;
 Z.validateSurvivalSave(saved, this.player);
 const p = this.player; p.resources = resourcesCopy(saved.resources); p.weaponOrigins = {};
 for (const id of p.weapons) if (KNOWN_WEAPONS.includes(id)) p.weaponOrigins[id] = saved.origins[id] === 'crafted' ? 'crafted' : 'world';
 p.special = saved.special?.time > EPS ? {id: saved.special.id, time: saved.special.time} : null;
 if (p.special?.id === 'gero') p.special.shield = saved.special.shield;
 p.stomach = saved.stomach; this._smokeEmission = saved.smokeEmission; this._pendingWeaponRespawns = new Set(saved.pendingWeapons);
 this.lootBags = saved.lootBags.filter(b => b.time > EPS).map(b => ({id: b.id, type: 'lootBag', x: b.x, y: b.y, time: b.time,
  weapons: [...b.weapons], origins: Object.fromEntries(b.weapons.map(id => [id, b.origins[id]])), resources: resourcesCopy(b.resources)}));
 this.world.lootBags = this.lootBags;
 this.groundEffects = saved.groundEffects.filter(g => g.time > EPS).map(g => ({id: g.id, type: g.type, x: g.x, y: g.y, radius: g.radius, time: g.time, maxTime: g.maxTime}));
 this._lootSerial = Math.max(0, ...this.lootBags.map(b => +b.id.slice(5))); this._groundSerial = Math.max(0, ...this.groundEffects.map(g => +g.id.slice(7)));
 for (const data of saved.pickups) {
  const item = this.world.pickups.find(i => i.id === data.id); if (!item) continue;
  item.collected = data.collected; item.respawn = data.respawn;
  if (item.type === 'special' && regionOf(data.x, data.y) === item.biome && !Z.collides(this.world, data.x, data.y, 11)) {item.x = data.x; item.y = data.y;}
 }
 for (const data of saved.nodes) {
  const node = this.world.objects.find(o => o.id === data.id && o.resource); if (!node) continue;
  node.hits = Math.min(node.maxHits, data.hits); node.depleted = data.depleted; node.regrow = data.regrow; node.solid = !node.depleted;
  if (!node.depleted && !node.hits) node.hits = node.maxHits;
 }
 for (const data of saved.enemies) {
  const e = this.enemies.find(enemy => enemy.id === data.id); if (!e) continue;
  e.freeze = data.freeze; e.smokeTick = data.smokeTick; e.trampleCooldown = data.trampleCooldown;
  e.burn = data.burn && !e.dead ? {time: data.burn.time, tick: data.burn.tick} : null;
 }
 this._survivalPosition = {x: p.x, y: p.y};
};
})();
