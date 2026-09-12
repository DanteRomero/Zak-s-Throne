/* Integration checks for gathering, timed consumables and dropped inventories. */
(function (root) {
'use strict';
root.runZakSurvivalTests = function () {
 const Z = root.Zak, results = [], canvas = document.createElement('canvas');
 canvas.width = 640; canvas.height = 360;
 const game = new Z.Game(canvas); cancelAnimationFrame(game.frame);
 const originalCollision = Z.collides;
 const ok = (value, message = 'Assertion failed') => {if (!value) throw new Error(message);};
 const equal = (a, b, message = '') => {if (a !== b) throw new Error(message + ': expected ' + b + ', received ' + a);};
 const near = (a, b, message = '') => {if (!Number.isFinite(a) || Math.abs(a - b) > 1e-5) throw new Error(message + ': expected ' + b + ', received ' + a);};
 function test(name, fn) {
  try {fn(); results.push({name, pass: true});} catch (error) {results.push({name, pass: false, error: error.message, stack: error.stack});}
  finally {Z.collides = originalCollision; game.pause();}
 }
 function fixture(id = 'gero', geometry = false) {
  Z.collides = originalCollision; game.onEvent = () => {}; game.newGame(id); game.sound.enabled = false;
  if (!geometry) {game.world.objects = []; game.world.npcs = []; game.enemies = []; Z.collides = () => false; Object.assign(game.player, {x: 1850, y: 1200}); game.biome = 'weeds';}
  game._survivalPosition = {x: game.player.x, y: game.player.y}; return game.player;
 }
 function advance(seconds, movement = false) {
  const frames = Math.round(seconds * 60);
  for (let i = 0; i < frames; i++) {if (movement) {game.player.x += .5; game.player.moving = true;} game.updateSurvival(1 / 60);}
 }
 function consume() {
  const item = game.world.pickups.find(i => i.type === 'special' && !i.collected);
  ok(item, 'A consumable must be available'); ok(game.consumeSpecial(item)); return item;
 }
 function own(id, origin = 'world') {
  if (!game.player.weapons.includes(id)) game.player.weapons.push(id);
  game.player.weaponOrigins[id] = origin; game.player.weapon = id;
  if (origin === 'world') game.world.pickups.filter(i => i.type === id).forEach(i => i.collected = true);
 }
 function enemy(type = 'thief', x = game.player.x + 10, y = game.player.y) {
  const e = game.makeEnemy({id: type + '-' + game.enemies.length, type, x, y}); e.hp = e.maxHp = 500; game.enemies.push(e); return e;
 }
 function node(resource, x = game.player.x + 15) {
  const n = {id: 'object-999', type: resource === 'wood' ? 'tree' : resource === 'stone' ? 'oreStone' : 'oreMetal', resource,
   x, y: game.player.y - 8, w: 20, h: 16, maxHits: resource === 'wood' ? 3 : resource === 'stone' ? 4 : 7,
   solid: true, depleted: false, regrow: 0}; n.hits = n.maxHits; game.world.objects.push(n); return n;
 }

 test('Eight personal consumables spawn at separated, reachable positions in all three biomes', () => {
  const p = fixture('gero', true), items = game.world.pickups.filter(i => i.type === 'special');
  equal(items.length, 8); equal(items.filter(i => i.biome === 'village').length, 2); equal(items.filter(i => i.biome === 'cave').length, 2);
  equal(items.filter(i => i.biome === 'weeds').length, 4);
  for (const item of items) {equal(item.characterId, p.characterId); ok(!item.collected); ok(!Z.collides(game.world, item.x, item.y, 11)); equal(Z.biomeAt(item.x, item.y), item.biome);}
  for (let i = 0; i < items.length; i++) for (let j = i + 1; j < items.length; j++) ok(Math.hypot(items[i].x - items[j].x, items[i].y - items[j].y) >= 65);
 });
 test('Medicinal flowers respawn after exactly ten seconds of active play; pausing freezes the timer', () => {
  fixture(); const herb = game.world.pickups.find(i => i.type === 'herb'); herb.collected = true; herb.respawn = 10;
  advance(9.9); ok(herb.collected); game.pause(); game.updateSurvival(60); ok(herb.collected); game.resume(); advance(.1); equal(herb.collected, false);
 });
 test('Personal consumables relocate after ten seconds and reject another character', () => {
  fixture('fede', true); const item = consume(), before = {x: item.x, y: item.y};
  equal(game.consumeSpecial(item), false); advance(9.9); ok(item.collected); advance(.1); equal(item.collected, false);
  ok(!Z.collides(game.world, item.x, item.y, 11)); ok(item.x !== before.x || item.y !== before.y);
  equal(game.consumeSpecial({...item, characterId: 'gero'}), false);
 });
 test('Harvesting requires the matching tool and facing the node: wood 3 hits, stone 4, metal 7', () => {
  const p = fixture(); const tree = node('wood');
  equal(game.harvest(1, 0, 48), false); own('pickaxe', 'crafted'); equal(game.harvest(1, 0, 48), false); own('axe');
  equal(game.harvest(-1, 0, 48), false); for (let i = 0; i < 3; i++) ok(game.harvest(1, 0, 48));
  equal(tree.depleted, true); equal(tree.solid, false); equal(p.resources.wood, 4); equal(game.harvest(1, 0, 48), false);
  game.world.objects = []; const stone = node('stone'); own('pickaxe', 'crafted');
  for (let i = 0; i < 4; i++) ok(game.harvest(1, 0, 44)); equal(stone.depleted, true); equal(p.resources.stone, 4);
  game.world.objects = []; const metal = node('metal'); for (let i = 0; i < 6; i++) ok(game.harvest(1, 0, 44));
  equal(metal.depleted, false); equal(p.resources.metal, 0); ok(game.harvest(1, 0, 44)); equal(p.resources.metal, 3);
 });
 test('Resources regrow after thirty seconds but never on top of a player or dropped bag', () => {
  const p = fixture(); const tree = node('wood'); own('axe'); for (let i = 0; i < 3; i++) game.harvest(1, 0, 48);
  p.x = tree.x + 5; advance(30); ok(tree.depleted); own('bow'); const bag = game.dropInventory(p.x, p.y);
  p.x += 100; advance(1); ok(tree.depleted); p.x = bag.x; ok(game.recoverBag(bag)); p.x += 100; advance(.1);
  equal(tree.depleted, false); equal(tree.solid, true); equal(tree.hits, 3);
 });
 test('Pickaxe crafting consumes eight wood, retains the throwing stone and records crafted provenance', () => {
  const p = fixture(); p.resources.wood = 8; equal(game.craft('pickaxe'), false); equal(p.resources.wood, 8);
  own('stone'); game.pause(); ok(game.craft('pickaxe')); equal(p.resources.wood, 0); ok(p.weapons.includes('stone'));
  equal(p.weaponOrigins.pickaxe, 'crafted'); equal(p.weapon, 'pickaxe'); equal(game.craft('pickaxe'), false);
 });
 test('Metal sword crafting needs the pickaxe and exact resources, and cannot duplicate a recoverable weapon', () => {
  const p = fixture(); p.resources = {wood: 4, stone: 0, metal: 6}; equal(game.craft('sword'), false); own('pickaxe', 'crafted');
  ok(game.craft('sword')); equal(p.resources.wood, 0); equal(p.resources.metal, 0); equal(p.weaponOrigins.sword, 'crafted');
  const bag = game.dropInventory(p.x, p.y); p.resources = {wood: 8, stone: 0, metal: 12}; own('pickaxe', 'crafted');
  equal(game.craft('sword'), false); equal(p.resources.metal, 12); ok(bag.weapons.includes('sword'));
 });
 test('Knockout drops all carried tools and resources at the death location, and recovery restores them', () => {
  const p = fixture(); own('bow'); own('pickaxe', 'crafted'); p.resources = {wood: 7, stone: 5, metal: 2}; const x = p.x, y = p.y;
  p.hp = 1; game.hurtPlayer(50, 'thief'); equal(game.state, 'paused'); equal(game.lootBags.length, 1);
  const bag = game.lootBags[0]; equal(bag.x, x); equal(bag.y, y); equal(bag.time, 300); equal(bag.type, 'lootBag'); equal(game.world.lootBags, game.lootBags);
  equal(p.weapons.length, 1); equal(p.weapon, 'fists'); equal(p.resources.wood, 0); equal(bag.origins.pickaxe, 'crafted');
  game.resume(); equal(game.recoverBag(bag), false); p.x = x; p.y = y; game.biome = 'weeds'; ok(game.recoverBag(bag));
  equal(p.resources.wood, 7); equal(p.resources.stone, 5); equal(p.resources.metal, 2); ok(p.weapons.includes('bow')); equal(p.weaponOrigins.pickaxe, 'crafted'); equal(game.lootBags.length, 0);
 });
 test('World weapons stay absent during the five-minute recovery window and return only on loss', () => {
  const p = fixture(); own('bow'); const mapBow = game.world.pickups.find(i => i.type === 'bow'); game.dropInventory(p.x, p.y);
  advance(299.9); equal(mapBow.collected, true); equal(game.lootBags.length, 1); advance(.1);
  equal(game.lootBags.length, 0); equal(mapBow.collected, false); equal(game.world.lootBags, game.lootBags);
 });
 test('Repeated knockouts keep independent bags and crafted losses do not respawn map originals', () => {
  const p = fixture(); own('bow'); const first = game.dropInventory(p.x, p.y); advance(100); own('sword', 'crafted'); const second = game.dropInventory(p.x, p.y);
  const mapSword = game.world.pickups.find(i => i.type === 'sword'); mapSword.collected = true;
  advance(200); equal(game.lootBags.length, 1); equal(game.lootBags[0], second); near(second.time, 100); equal(first.time, 0); equal(mapSword.collected, true);
  advance(100); equal(game.lootBags.length, 0); equal(mapSword.collected, true);
 });
 test('A blocked original respawn waits until every remaining weapon of its type disappears', () => {
  const p = fixture(); own('bow'); const first = game.dropInventory(p.x, p.y); first.time = .1;
  own('bow', 'crafted'); const second = game.dropInventory(p.x, p.y); second.time = .3;
  const mapBow = game.world.pickups.find(i => i.type === 'bow'); advance(.1); ok(mapBow.collected); advance(.2); equal(mapBow.collected, false);
 });
 test('An original sword can coexist with a dropped crafted one without respawning while either is carried', () => {
  const p = fixture(); own('pickaxe', 'crafted'); p.resources = {wood: 4, stone: 0, metal: 6}; ok(game.craft('sword'));
  const craftedBag = game.dropInventory(p.x, p.y), mapSword = game.world.pickups.find(i => i.type === 'sword');
  advance(10); p.x = mapSword.x; p.y = mapSword.y; game.interact(); equal(p.weaponOrigins.sword, 'world'); ok(mapSword.collected);
  const originalBag = game.dropInventory(p.x, p.y); p.x = craftedBag.x; p.y = craftedBag.y; ok(game.recoverBag(craftedBag));
  equal(p.weaponOrigins.sword, 'crafted'); advance(300); ok(!game.lootBags.includes(originalBag)); ok(mapSword.collected);
  ok(game._pendingWeaponRespawns.has('sword')); game.restore(game.snapshot());
  ok(game._pendingWeaponRespawns.has('sword')); equal(game.player.weaponOrigins.sword, 'crafted');
  const finalBag = game.dropInventory(game.player.x, game.player.y); equal(finalBag.origins.sword, 'crafted');
  advance(300); equal(game.world.pickups.find(i => i.type === 'sword').collected, false); equal(game._pendingWeaponRespawns.size, 0);
 });
 test('Recovering overlapping crafted and original swords preserves the original source on the next loss', () => {
  const p = fixture(); own('sword', 'crafted'); const bag = game.dropInventory(p.x, p.y);
  const mapSword = game.world.pickups.find(i => i.type === 'sword'); p.x = mapSword.x; p.y = mapSword.y; game.interact();
  equal(p.weaponOrigins.sword, 'world'); p.x = bag.x; p.y = bag.y; ok(game.recoverBag(bag));
  equal(p.weapons.filter(id => id === 'sword').length, 1); equal(p.weaponOrigins.sword, 'world');
  const lost = game.dropInventory(p.x, p.y); equal(lost.origins.sword, 'world'); advance(300); equal(mapSword.collected, false);
 });
 test('The complete update loop pauses bag deadlines and E recovers a bag before consuming a nearby item', () => {
  const p = fixture(); own('axe'); p.resources.wood = 8; p.hp = 1; game.hurtPlayer(20, 'thief');
  const bag = game.lootBags[0]; game.update(30); near(bag.time, 300); game.resume();
  for (let i = 0; i < 60; i++) game.update(1 / 60); near(bag.time, 299);
  p.x = bag.x; p.y = bag.y; game.biome = 'weeds'; const item = game.world.pickups.find(i => i.type === 'special' && !i.collected);
  item.x = p.x; item.y = p.y; game.interact(); equal(game.lootBags.length, 0); ok(!item.collected);
  equal(p.resources.wood, 8); ok(p.weapons.includes('axe')); game.interact(); ok(item.collected); near(item.respawn, 10);
 });
 test('Gero shield uses maximum life, takes unmitigated damage and refreshes without stacking', () => {
  const p = fixture('gero'); p.hp = 30; const armor = game.stats().armor, maximum = game.stats().maxHealth; consume();
  near(p.special.shield, maximum * .4); near(game.stats().armor, armor + 4); game.hurtPlayer(20, 'thief'); near(p.hp, 30); near(p.special.shield, maximum * .4 - 20);
  advance(2); consume(); near(p.special.shield, maximum * .4); near(p.special.time, 5); advance(5); equal(p.special, null); near(game.stats().armor, armor);
 });
 test('Paco milk heals completely and doubles damage; puddles keep independent five-second clocks', () => {
  const p = fixture('paco'); p.hp = 20; const base = game.stats(); consume(); near(p.hp, base.maxHealth); near(game.stats().strength, base.strength * 2); near(game.stats().moveSpeed, base.moveSpeed);
  advance(2); p.x += 80; p.hp = 20; consume(); near(p.hp, base.maxHealth); near(game.stats().strength, base.strength * 2); equal(game.groundEffects.length, 2);
  near(game.groundEffects[0].time, 3); near(game.groundEffects[1].time, 5); advance(3); equal(game.groundEffects.length, 1); near(p.special.time, 2); advance(2); equal(p.special, null); equal(game.groundEffects.length, 0);
 });
 test('Fede Puff clears exhaustion, doubles speed and tramples once per enemy each half-second', () => {
  const p = fixture('fede'); p.stamina = 0; p.exhausted = 9; const base = game.stats(); const e = enemy(); consume();
  near(p.stamina, 1); near(p.exhausted, 0); near(game.stats().moveSpeed, base.moveSpeed * 2); near(game.stats().speed, base.speed * 2);
  p.running = true; const before = e.hp; ok(game.specialContact(e)); near(e.hp, before - game.stats().strength); equal(game.specialContact(e), false);
  advance(.5); ok(game.specialContact(e)); near(e.hp, before - game.stats().strength * 2); advance(4.5); equal(p.special, null); equal(game.specialContact(e), false);
 });
 test('Fede can run through a full five-second Puff without consuming energy', () => {
  const p = fixture('fede'); consume(); game.keys.add('Shift'); game.keys.add('d');
  for (let frame = 0; frame < 300; frame++) {game.updateMovement(1 / 60, game.stats()); game.updateSurvival(1 / 60); near(p.stamina, 1); near(p.exhausted, 0);}
  equal(p.special, null); game.updateMovement(1 / 60, game.stats()); ok(p.stamina < 1);
 });
 test('Puff running contact also damages a latched rat and keeps the half-second hit limit', () => {
  const p = fixture('fede'), e = enemy('rat'); e.latched = 3; e.cooldown = 1; consume();
  const hp = e.hp, damage = game.stats().strength; game.keys.add('Shift'); game.keys.add('d');
  game.update(1 / 60); ok(p.running); ok(e.latched > 0); near(e.hp, hp - damage); near(e.trampleCooldown, .5);
  game.update(1 / 60); near(e.hp, hp - damage); near(p.stamina, 1);
 });
 test('Pepe heals 35 percent of maximum life, moves 50 percent faster and emits only while moving', () => {
  const p = fixture('pepe'); p.hp = 10; const base = game.stats(); consume(); near(p.hp, 10 + base.maxHealth * .35); near(game.stats().moveSpeed, base.moveSpeed * 1.5);
  advance(.5); equal(game.groundEffects.length, 0); advance(.3, true); ok(game.groundEffects.length >= 2);
  const first = game.groundEffects[0]; advance(1, true); ok(first.time < game.groundEffects.at(-1).time); p.moving = false; advance(2); ok(!game.groundEffects.includes(first));
  consume(); near(p.special.time, 5); near(game.stats().moveSpeed, base.moveSpeed * 1.5);
 });
 test('Overlapping smoke inflicts two damage per 0.2 seconds, never one dose per cloud', () => {
  fixture('pepe'); const e = enemy(); const before = e.hp; game.addGroundEffect('smoke', e.x, e.y, 22, 2); game.addGroundEffect('smoke', e.x, e.y, 22, 2);
  advance(.2); near(e.hp, before - 2); advance(1.8); near(e.hp, before - 20); equal(game.groundEffects.length, 0); advance(1); near(e.hp, before - 20);
 });
 test('Tena gets five seconds of speed and force, one second of cramps, then fire with three burn ticks', () => {
  const p = fixture('tena'), e = enemy(); const base = game.stats(), hp = p.hp, enemyHp = e.hp; consume();
  near(game.stats().strength, base.strength * 2); near(game.stats().moveSpeed, base.moveSpeed * 2); advance(5); equal(p.special, null); near(p.stomach, 1);
  equal(game.attack(), false); equal(game.consumeSpecial(game.world.pickups.find(i => i.type === 'special' && !i.collected)), false);
  game.keys.add('d'); const x = p.x; game.updateMovement(.5, game.stats()); near(p.x, x); advance(.9); near(e.hp, enemyHp); advance(.1);
  near(p.stomach, 0); near(p.hp, hp - 10); near(e.hp, enemyHp - 15); ok(e.burn); advance(3); near(e.hp, enemyHp - 24); equal(e.burn, null);
 });
 test('Dante freezes nearby enemies, refreshes speed without stacking and takes one final intoxication hit', () => {
  const p = fixture('dante'), nearEnemy = enemy(), farEnemy = enemy('dog', p.x + 250), hp = p.hp, base = game.stats(); consume();
  near(nearEnemy.freeze, 5); near(farEnemy.freeze || 0, 0); near(game.stats().moveSpeed, base.moveSpeed * 2); advance(4); consume();
  near(p.special.time, 5); near(nearEnemy.freeze, 5); near(game.stats().moveSpeed, base.moveSpeed * 2); advance(4.9); near(p.hp, hp); advance(.1); near(p.hp, hp - 3); equal(p.special, null); advance(5); near(p.hp, hp - 3);
 });
 test('Self-damage works inside the village and freezing detaches latched rats', () => {
  const p = fixture('dante'), e = enemy('rat'); e.latched = 2; consume(); equal(e.latched, 0); game.biome = 'village'; const hp = p.hp; advance(5); near(p.hp, hp - 3);
 });
 test('Saving and restoring preserves consumable, bag, regrowth and enemy timers without using wall-clock time', () => {
  const p = fixture('paco', true); game.enemies = game.enemies.slice(0, 1); own('bow'); p.resources.wood = 9;
  game.dropInventory(p.x, p.y); consume(); const herb = game.world.pickups.find(i => i.type === 'herb'); herb.collected = true; herb.respawn = 10;
  const n = game.world.objects.find(o => o.resource); n.depleted = true; n.regrow = 30; n.hits = 0; n.solid = false;
  const e = game.enemies[0]; e.freeze = 5; e.burn = {time: 3, tick: 1}; advance(.5);
  const save = game.snapshot(); ok(Z.validateSurvivalSave(save.survival, save.player)); save.savedAt = '2000-01-01T00:00:00Z';
  game.restore(save); near(game.player.special.time, 4.5); near(game.lootBags[0].time, 299.5); near(game.groundEffects[0].time, 4.5);
  near(game.world.pickups.find(i => i.id === herb.id).respawn, 9.5); near(game.world.objects.find(o => o.id === n.id).regrow, 29.5);
  near(game.enemies.find(enemy => enemy.id === e.id).freeze, 4.5); equal(game.world.lootBags, game.lootBags);
 });
 test('Saving an enemy on a depleted resource preserves its position after restoring resource collisions', () => {
  fixture('dante', true); const n = game.world.objects.find(o => o.resource === 'stone'), e = game.enemies.find(enemy => enemy.biome === 'cave');
  n.depleted = true; n.solid = false; n.hits = 0; n.regrow = 20;
  e.x = n.x + n.w / 2; e.y = n.y + n.h / 2; e.freeze = 4; const position = {x: e.x, y: e.y};
  ok(!Z.collides(game.world, e.x, e.y, 7)); game.restore(game.snapshot()); const restored = game.enemies.find(enemy => enemy.id === e.id);
  near(restored.x, position.x); near(restored.y, position.y); near(restored.freeze, 4);
  equal(game.world.objects.find(o => o.id === n.id).depleted, true);
 });
 test('Every personal buff survives saving with its remaining duration and expires exactly once', () => {
  for (const id of ['gero', 'paco', 'fede', 'pepe', 'tena', 'dante']) {
   fixture(id, true); consume(); advance(2); const hp = game.player.hp; game.restore(game.snapshot());
   equal(game.player.special.id, id); near(game.player.special.time, 3); advance(2.9); ok(game.player.special);
   advance(.1); equal(game.player.special, null);
   if (id === 'tena') {near(game.player.stomach, 1); advance(1); near(game.player.hp, hp - 10); advance(2); near(game.player.hp, hp - 10);}
   else if (id === 'dante') {near(game.player.hp, hp - 3); advance(3); near(game.player.hp, hp - 3);}
   else near(game.player.hp, hp);
  }
 });
 test('Malformed save extensions reject non-finite timers, unknown weapons and character-mismatched buffs', () => {
  fixture(); const source = game.serializeSurvival();
  for (const mutation of [s => s.resources.wood = -1, s => s.stomach = Infinity, s => s.special = {id: 'paco', time: 5},
   s => s.origins.hacked = 'world', s => s.groundEffects.push({id: 'ground-1', type: 'smoke', x: 10, y: 10, radius: 9999, time: 2, maxTime: 2})]) {
   const save = JSON.parse(JSON.stringify(source)); mutation(save); let rejected = false; try {Z.validateSurvivalSave(save, game.player);} catch {rejected = true;} ok(rejected);
  }
 });
 test('Legacy initialization gives zero resources and correctly classifies existing original weapons', () => {
  fixture(); own('bow'); own('sword'); game.player.resources.wood = 100; game.initSurvival(); equal(game.player.resources.wood, 0);
  equal(game.player.weaponOrigins.bow, 'world'); equal(game.player.weaponOrigins.sword, 'world'); equal(game.player.special, null); equal(game.lootBags.length, 0);
 });
 return {passed: results.filter(r => r.pass).length, failed: results.filter(r => !r.pass).length, results};
};
})(window);
