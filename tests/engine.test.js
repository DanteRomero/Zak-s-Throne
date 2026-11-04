/* Engine integration tests. Open tests/index.html in a real browser. */
(function (root) {
  'use strict';
  root.runZakEngineTests = function () {
    const Z = root.Zak, results = [];
    const original = { biomeAt: Z.biomeAt, collides: Z.collides, random: Math.random };
    const canvas = document.createElement('canvas'); canvas.width = 640; canvas.height = 360;
    const game = new Z.Game(canvas); cancelAnimationFrame(game.frame);
    const ok = (value, message) => { if (!value) throw new Error(message || 'Assertion failed'); };
    const near = (actual, expected, message = '') => {
      if (!Number.isFinite(actual) || Math.abs(actual - expected) > 1e-6)
        throw new Error(message + ': expected ' + expected + ', received ' + actual);
    };
    const equal = (actual, expected, message = '') => {
      if (actual !== expected) throw new Error(message + ': expected ' + expected + ', received ' + actual);
    };
    const advance = seconds => { const frames = Math.round(seconds * 60); for (let i = 0; i < frames; i++) game.update(1 / 60); };
    function fixture(id = 'gero', realWorld = false) {
      Z.biomeAt = original.biomeAt; Z.collides = original.collides;
      game.onEvent = () => {}; game.newGame(id); game.sound.enabled = false;
      if (!realWorld) {
        // Only geometry is replaced: all movement, damage, AI, timers and persistence are real.
        Z.biomeAt = (x, y) => x < 900 ? 'village' : y < 300 ? 'cave' : 'weeds';
        Z.collides = () => false;
        game.world.npcs = []; game.enemies = [];
        Object.assign(game.player, {x: 1100, y: 700}); game.biome = 'weeds';
      }
      return game.player;
    }
    function enemy(type, x = game.player.x + 80, y = game.player.y) {
      const e = game.makeEnemy({id: 'test-' + game.enemies.length, type, x, y});
      game.enemies.push(e); return e;
    }
    // Las pruebas del motor miden daño contra la vida de la ficha: los multiplicadores de vida
    // (ENEMY_HEALTH y BOSS_HEALTH) se prueban aparte en las reglas.
    function test(name, fn) {
      const health = [Z.ENEMY_HEALTH, Z.BOSS_HEALTH]; Z.ENEMY_HEALTH = 1; Z.BOSS_HEALTH = 1;
      try { fn(); results.push({name, pass: true}); }
      catch (error) { results.push({name, pass: false, error: error.message, stack: error.stack}); }
      finally { Z.biomeAt = original.biomeAt; Z.collides = original.collides; Math.random = original.random; [Z.ENEMY_HEALTH, Z.BOSS_HEALTH] = health; game.pause(); }
    }

    test('Poison ticks five times in five seconds and bypasses armor', () => {
      const p = fixture(); p.stats.endurance = 100; Math.random = () => 0;
      const snake = enemy('snake'); game.enemyAttack(snake); game.enemies = [];
      const bitten = p.hp;
      for (let second = 1; second <= 5; second++) { advance(1); near(p.hp, bitten - second * 2); }
      equal(p.poison, null); advance(2); near(p.hp, bitten - 10);
    });
    test('Repeated poisoning resets the full five-second clock', () => {
      const p = fixture(); p.stats.endurance = 100; Math.random = () => 0;
      const snake = enemy('snake'); game.enemyAttack(snake); game.enemies = []; advance(2.5);
      game.enemyAttack(snake); const afterSecondBite = p.hp;
      advance(.5); near(p.hp, afterSecondBite);
      advance(4.5); near(p.hp, afterSecondBite - 10); equal(p.poison, null);
    });
    test('Fede uses 15 percent poison chance; other characters use 40 percent', () => {
      let p = fixture('fede'), snake = enemy('snake'); Math.random = () => .15;
      game.enemyAttack(snake); equal(p.poison, null); Math.random = () => .149;
      game.enemyAttack(snake); ok(p.poison);
      p = fixture('gero'); snake = enemy('snake'); Math.random = () => .4;
      game.enemyAttack(snake); equal(p.poison, null); Math.random = () => .399;
      game.enemyAttack(snake); ok(p.poison);
    });
    test('Gero restores exactly 25 HP in five seconds and cannot overheal', () => {
      const p = fixture('gero'); p.hp = 40; game.ability();
      for (let second = 1; second <= 5; second++) { advance(1); near(p.hp, 40 + second * 5); }
      advance(1); near(p.hp, 65); equal(p.buffs.gero, 0);
      p.abilityCooldown = 0; p.hp = 103; game.ability(); advance(5); near(p.hp, 105);
    });
    test('Tena immobilizes nearby enemies for seven seconds without contact damage', () => {
      const p = fixture('tena'), thief = enemy('thief', p.x + 10);
      thief.cooldown = 0; game.ability(); const x = thief.x, hp = p.hp;
      advance(7); near(thief.x, x); near(p.hp, hp); near(thief.stun, 0);
      advance(2 / 60); ok(p.hp < hp, 'Enemy must attack after stun expires');
    });
    test('Dante produces exactly three waves of ten damage, bypassing armor', () => {
      fixture('dante'); const thief = enemy('thief'); thief.stats.armor = 8; thief.stun = 5;
      game.ability(); near(thief.hp, 90);
      advance(.5); near(thief.hp, 90); advance(.1); near(thief.hp, 80);
      advance(.6); near(thief.hp, 70); advance(1); near(thief.hp, 70);
      equal(game.queuedWaves.length, 0);
    });
    test('Rat latches for three seconds, cannot be struck while latched, then jumps away', () => {
      const p = fixture('paco'), rat = enemy('rat', p.x + 10); rat.cooldown = 0;
      game.update(1 / 60); near(rat.latched, 3); const hp = rat.hp;
      game.hitEnemy(rat, 100); near(rat.hp, hp);
      advance(2.9); ok(rat.latched > 0); advance(.15);
      near(rat.latched, 0); ok(Math.hypot(rat.x - p.x, rat.y - p.y) > 28, 'Rat must jump a meaningful distance');
      ok(rat.latchRest > 1, 'Rat needs time before another latch');
    });
    test('Gero is ignored by rats until he hits them; Tena makes rats flee', () => {
      let p = fixture('gero'), rat = enemy('rat'); advance(.2); equal(rat.alert, false);
      game.hitEnemy(rat, 1); game.update(1 / 60); equal(rat.alert, true);
      p = fixture('tena'); rat = enemy('rat'); const initial = Math.hypot(rat.x-p.x, rat.y-p.y);
      advance(.5); equal(rat.alert, false); ok(Math.hypot(rat.x-p.x,rat.y-p.y) > initial);
    });
    test('Paco charms only nearby animals for ten seconds and gains two strength per animal', () => {
      fixture('paco'); const baseline = game.stats().strength;
      const dog = enemy('dog'), rat = enemy('rat'), snake = enemy('snake'), thief = enemy('thief');
      const distant = enemy('dog', game.player.x + 400);
      game.ability(); [dog,rat,snake].forEach(e => near(e.charm,10)); near(thief.charm,0); near(distant.charm,0);
      near(game.stats().strength,baseline + 6);
      game.enemies = []; advance(10); near(game.stats().strength,baseline);
    });
    test('Pepe heals and gains speed after an actual defeat', () => {
      const p = fixture('pepe'); p.hp = 60; const rat = enemy('rat'); const initialSpeed = game.stats().moveSpeed;
      game.hitEnemy(rat, 20); equal(rat.dead,true); equal(p.kills,1); near(p.hp,65);
      near(game.stats().moveSpeed,initialSpeed*1.15); advance(3.05); near(game.stats().moveSpeed,initialSpeed);
    });
    test('Normal enemies are pushed away by hits while thieves keep their position', () => {
      fixture(); const dog = enemy('dog'), thief = enemy('thief'); const dogX = dog.x, thiefX = thief.x;
      game.hitEnemy(dog,5); game.hitEnemy(thief,5); ok(dog.x > dogX); near(thief.x,thiefX);
    });
    test('The village blocks damage and enemies cannot cross its boundary', () => {
      const p = fixture(); p.x = 880; game.biome = 'village'; const thief = enemy('thief',901);
      const hp = p.hp; game.hurtPlayer(500,'thief'); game.enemyAttack(thief); near(p.hp,hp);
      advance(10); ok(thief.x >= 900, 'Enemy crossed into safe village'); near(p.hp,hp); equal(thief.alert,false);
    });
    test('Returning to the village clears poison, slow and attached rats', () => {
      const p = fixture(); p.x = 901; p.poison = {time:5,tick:1,damage:2}; p.slow = 4;
      const rat = enemy('rat',920); rat.latched = 2; game.keys.add('a'); advance(.1);
      equal(game.biome,'village'); equal(p.poison,null); equal(p.slow,0); equal(rat.latched,0);
      ok(rat.x >= 900);
    });
    test('Knockout returns to village with full health and the requested thief dialogue', () => {
      const p = fixture(); let quote; game.onEvent = (type,detail) => { if(type === 'knockout') quote = detail.quote; };
      game.hurtPlayer(1000,'thief'); equal(game.state,'paused'); equal(game.biome,'village');
      near(p.x,game.world.spawn.x); near(p.y,game.world.spawn.y); near(p.hp,game.stats().maxHealth);
      equal(p.deaths,1); equal(quote,'Uhh... este gil me sacó guita');
    });
    test('Attack cooldown uses all four speed bands during actual combat', () => {
      [[5,3],[15,2],[30,1],[60,.5]].forEach(([speed,seconds]) => {
        const p = fixture(); p.stats.speed = speed; p.dir = 'right';
        const thief = enemy('thief',p.x+20); thief.stun = 100;
        ok(game.attack()); near(p.attackCooldown,seconds); near(thief.hp,95);
        equal(game.attack(),false); advance(seconds-2/60); equal(game.attack(),false);
        advance(3/60); ok(game.attack()); near(thief.hp,90);
      });
    });
    test('Holding attack obeys cooldown and sword deals 50 percent extra damage', () => {
      const p = fixture(); p.stats.speed = 30; p.weapon='sword'; p.weapons.push('sword'); p.dir='right';
      const thief = enemy('thief',p.x+20); thief.stun = 100;
      game.keys.add(' '); advance(2.1); near(thief.hp,100-3*7.5);
    });
    test('Knife rain: five seconds, three knives a second, and the Capo stays put aiming at you', () => {
      const p = fixture(); p.rollX = 0; p.rollY = 0; const capo = enemy('capo', p.x + 90); capo.rainCd = 0; capo.special = 99;
      game.update(1 / 60); ok(capo.rain, 'The rain starts'); const spot = {x: capo.x, y: capo.y};
      advance(.8); equal(game.projectiles.filter(s => s.type === 'knife').length, 0, 'Warns before the first knife');
      p.y -= 30; advance(.15); const first = game.projectiles.find(s => s.type === 'knife'); ok(first, 'First knife'); ok(first.dy < 0, 'Aims at where you are now');
      const knives = new Set(); let frames = 0; while (capo.rain && frames++ < 400) { game.projectiles.forEach(s => { if (s.type === 'knife') knives.add(s); }); p.roll = .1; game.update(1 / 60); }
      game.projectiles.forEach(s => { if (s.type === 'knife') knives.add(s); });
      equal(knives.size, 15, 'Exactly 15 knives'); equal(capo.rain, null, 'Ends by itself'); ok(Math.abs((frames + 54) / 60 - 5.9) < .1, 'Lasts five seconds after the warning'); near(capo.x, spot.x, 'Does not chase'); near(capo.y, spot.y, 'Does not flee');
    });
    test('Knives pass through walls, have no range limit and never leave the zone', () => {
      const p = fixture(); p.y = 1500; Z.collides = () => true;
      const knife = {x: 1500, y: 700, dx: -1, dy: 0, type: 'knife', hostile: true, zone: 'weeds', tally: {hits: 0}, damage: 1, source: 'capo', traveled: 0, range: Infinity};
      game.projectiles = [knife]; for (let k = 0; k < 60; k++) game.updateProjectiles(1 / 60);
      ok(game.projectiles.includes(knife), 'Walls do not stop it');
      for (let k = 0; k < 600 && game.projectiles.includes(knife); k++) game.updateProjectiles(1 / 60);
      ok(!game.projectiles.includes(knife), 'It does not leave the zone'); ok(knife.traveled > 350, 'Flies further than any shot'); ok(knife.x < 900 && knife.x > 880, 'Dropped right at the zone edge');
    });
    test('Five knife hits in one rain knock you out; rolling dodges', () => {
      const p = fixture(); const tally = {hits: 0}; p.coins = 100;
      const throwAt = () => game.projectiles.push({x: p.x, y: p.y - 8, dx: 1, dy: 0, type: 'knife', hostile: true, zone: game.biome, tally, damage: 1, source: 'capo', traveled: 0, range: Infinity});
      p.roll = .2; throwAt(); game.updateProjectiles(1 / 60); equal(tally.hits, 0, 'A roll dodges and does not count'); p.roll = 0; game.projectiles = [];
      for (let k = 0; k < 4; k++) { throwAt(); game.updateProjectiles(1 / 60); } equal(tally.hits, 4); equal(game.state, 'playing');
      throwAt(); game.updateProjectiles(1 / 60); equal(p.coins, 70, 'Knocked out by the Capo: loses 30%'); equal(game.biome, 'village'); equal(game.projectiles.length, 0);
    });
    test('Leaving the zone or stunning the Capo stops the rain; his summoned copy never uses it', () => {
      const p = fixture(); const capo = enemy('capo', p.x + 90); capo.rainCd = 0; capo.special = 99; game.update(1 / 60); ok(capo.rain);
      capo.stun = 1; game.update(1 / 60); equal(capo.rain, null, 'Stun cancels');
      capo.stun = 0; capo.rain = {t: 0, wind: .9, thrown: 0, hits: 0}; p.x = 800; game.update(1 / 60); equal(capo.rain, null, 'Leaving the zone cancels');
      const q = fixture(); const minion = enemy('capo', q.x + 90); minion.summoned = true; minion.rainCd = 0; minion.special = 99; game.update(1 / 60); equal(minion.rain, null);
    });
    test('Fists hit a straight area; swords hit a fan with the same reach', () => {
      const hits = (weapon, along, side) => {
        const p = fixture(); p.weapons.push(weapon); p.weapon = weapon; p.dir = 'right'; p.attackCooldown = 0;
        const target = enemy('thief', p.x + along, p.y + side); target.stun = 100; const hp = target.hp; game.attack(); return target.hp < hp;
      };
      equal(Z.WEAPON_TYPES.sword.range, Z.WEAPON_TYPES.fists.range, 'Same reach');
      equal(Z.WEAPON_TYPES.fists.range, 45); equal(Z.WEAPON_TYPES.fists.width, 24);
      ok(hits('fists', 40, 10), 'Fists: inside the straight area');
      ok(!hits('fists', 25, 20), 'Fists: too far to the side');
      ok(!hits('fists', 50, 0), 'Fists: past the reach');
      ok(hits('sword', 25, 20), 'Sword: the fan does reach that side');
      ok(!hits('sword', 50, 0), 'Sword: past the reach');
    });
    test('The bow reaches three old sword lengths and no further', () => {
      const p = fixture(); p.weapon = 'bow'; p.weapons.push('bow'); p.dir = 'right'; equal(Z.WEAPON_TYPES.bow.range, 165); equal(Z.WEAPON_TYPES.stone.range, Z.WEAPON_TYPES.bow.range, 'Stone and bow share their reach');
      const far = enemy('thief', p.x + 195); far.stun = 100; const hp = far.hp; ok(game.attack()); advance(1.2); equal(far.hp, hp, 'Too far'); equal(game.projectiles.length, 0);
    });
    test('Bow projectile reaches and damages an enemy at range', () => {
      const p = fixture(); p.weapon='bow'; p.weapons.push('bow'); p.dir='right';
      const thief = enemy('thief',p.x+110); thief.stun = 3; ok(game.attack()); equal(game.projectiles.length,1);
      advance(.5); near(thief.hp,95); equal(game.projectiles.length,0);
    });
    test('Stone reload requires two seconds of real movement; standing and walls do not count', () => {
      const p = fixture(); p.weapon='stone'; p.weapons.push('stone'); ok(game.attack()); equal(p.stoneAmmo,0);
      advance(3); near(p.stoneWalkTime,0); game.keys.add('d'); Z.collides=()=>true;
      advance(3); near(p.stoneWalkTime,0); equal(p.stoneAmmo,0); Z.collides=()=>false;
      advance(1.9); equal(p.stoneAmmo,0); advance(.1); equal(p.stoneAmmo,1); near(p.stoneWalkTime,0);
    });
    test('Sprint is 25 percent faster and full exhaustion locks running for ten seconds', () => {
      const p = fixture(); p.stats.endurance=5; game.keys.add('d'); const x=p.x;
      advance(1); near(p.x-x,92); const start=p.x; game.keys.add('Shift'); advance(1);
      near(p.x-start,92*1.25); advance(2); near(p.exhausted,10); near(p.stamina,0);
      advance(9); ok(p.exhausted>0); near(p.stamina,.9); equal(p.running,false);
      advance(1.05); near(p.exhausted,0); ok(p.stamina>.98);
    });
    test('Releasing sprint waits two seconds before gradual stamina recovery', () => {
      const p = fixture(); game.keys.add('d'); game.keys.add('Shift'); advance(1); const stamina=p.stamina;
      game.keys.clear(); advance(1.9); near(p.stamina,stamina); advance(1.1);
      ok(p.stamina>stamina && p.stamina<1);
    });
    test('Experience from kills levels the player and rescales existing enemies', () => {
      const p = fixture('dante'); p.xp=90; const thief=enemy('thief'), rat=enemy('rat');
      game.hitEnemy(rat,100); equal(p.level,2); equal(p.points,1); near(p.stats.health,112); near(p.stats.strength,9);
      near(thief.level,2); p.xp=149; const another=enemy('rat'); game.hitEnemy(another,100);
      equal(p.level,3); equal(p.points,2); near(thief.level,3); near(thief.maxHp,103); near(thief.hp,103);
      ok(Z.upgradeStat(p,'strength')); near(p.stats.strength,11); equal(p.points,1);
    });
    test('Pause freezes damage, cooldowns, stamina and queued ability waves', () => {
      const p=fixture('dante'); const thief=enemy('thief'); thief.stun=20; game.ability();
      p.poison={time:5,tick:1,damage:2}; p.stamina=.3; game.pause();
      const before=JSON.stringify({player:p,enemy:thief,time:game.time,waves:game.queuedWaves});
      advance(15); equal(JSON.stringify({player:p,enemy:thief,time:game.time,waves:game.queuedWaves}),before);
      game.resume(); advance(.6); near(thief.hp,80); ok(p.poison.time<5);
    });
    test('New game does not mutate an existing save snapshot', () => {
      const p=fixture('paco',true); p.weapons.push('bow'); p.weapon='bow'; p.stats.strength=12;
      const save=game.snapshot(), serialized=JSON.stringify(save); game.newGame('dante');
      equal(JSON.stringify(save),serialized); equal(game.player.characterId,'dante'); equal(game.player.level,1);
      game.restore(save,2); equal(game.player.characterId,'paco'); equal(game.player.weapon,'bow'); near(game.player.stats.strength,12); equal(game.currentSlot,2);
    });
    test('Snapshot round trip preserves progress, pickups, enemy health and player location', () => {
      const p=fixture('gero',true); p.level=3; p.xp=34; p.points=2; p.stats.health=109; p.hp=78;
      const pickup=game.world.pickups.find(i=>i.type==='bow'); ok(pickup); pickup.collected=true;
      p.weapons.push('bow'); p.weapon='bow'; const first=game.enemies[0]; ok(first); first.hp=12; first.provoked=true;
      game.questFlags.defeat_rat=true; game.time=123; const x=p.x,y=p.y; const save=game.snapshot();
      game.newGame('tena'); game.restore(save,1); equal(game.player.characterId,'gero'); near(game.player.x,x); near(game.player.y,y);
      near(game.player.hp,78); equal(game.player.level,3); near(game.player.xp,34); equal(game.player.points,2);
      equal(game.world.pickups.find(i=>i.id===pickup.id).collected,true); near(game.enemies.find(e=>e.id===first.id).hp,12);
      equal(game.questFlags.defeat_rat,true); near(game.time,123);
    });
    test('Malformed save data is rejected without mutating the current game', () => {
      fixture('gero',true); const valid=game.snapshot(), before=game.player;
      const mutations=[
        s=>s.version=999, s=>s.player.characterId='missing', s=>s.player.level=0,
        s=>s.player.xp=-1, s=>s.player.hp=NaN, s=>s.player.stats.speed=-1,
        s=>s.player.weapons=['unknown'], s=>s.player.x=-1000, s=>s.collected=null
      ];
      mutations.forEach(mutate=>{const save=JSON.parse(JSON.stringify(valid)); mutate(save); let threw=false;
        try{game.restore(save);}catch(error){threw=true;} ok(threw,'Malformed data accepted'); equal(game.player,before);
      });
    });
    test('Real world starts safely and contains weapons only in their assigned biomes', () => {
      fixture('paco',true); equal(Z.biomeAt(game.player.x,game.player.y),'village');
      ok(!Z.collides(game.world,game.player.x,game.player.y,8),'Spawn must be walkable');
      game.world.enemySpawns.forEach(e=>ok(Z.biomeAt(e.x,e.y)!=='village','Enemy spawned in village'));
      ['bow','stone','sword'].forEach(type=>{const pickup=game.world.pickups.find(i=>i.type===type); ok(pickup,'Missing '+type); equal(Z.biomeAt(pickup.x,pickup.y),Z.WEAPON_TYPES[type].biome);});
    });


    test('Restoring combat preserves poison clocks, enemy disable timers and queued waves', () => {
      const p=fixture('dante',true), thief=game.enemies.find(e=>e.type==='thief'); ok(thief);
      Z.collides=()=>false; p.x=thief.x; p.y=thief.y; game.biome=thief.biome;
      p.hp=80; p.poison={time:3.5,tick:.5,damage:2}; p.abilityCooldown=17;
      thief.stun=4; thief.cooldown=1.25; game.queuedWaves=[{delay:.55},{delay:1.1}];
      const save=game.snapshot(); game.newGame('gero'); game.restore(save,3);
      near(game.player.poison.time,3.5); near(game.player.poison.tick,.5); near(game.player.abilityCooldown,17);
      const restored=game.enemies.find(e=>e.id===thief.id); near(restored.stun,4); near(restored.cooldown,1.25);
      equal(game.queuedWaves.length,2); near(game.queuedWaves[0].delay,.55);
      game.enemies=[restored]; advance(.6); near(restored.hp,90); near(game.player.hp,78);
      near(game.player.poison.time,2.9); near(restored.stun,3.4);
    });


    test('Real map paths reach bow, stone and sword with player-sized collision', () => {
      fixture('paco',true);
      const world={...game.world,npcs:[]}, start={x:game.player.x,y:game.player.y};
      const remaining=game.world.pickups.filter(i=>['bow','stone','sword'].includes(i.type));
      equal(remaining.length,3,'Expected exactly one of each weapon');
      const queue=[start], visited=new Set([start.x+','+start.y]); let head=0;
      while(head<queue.length && remaining.length){
        const point=queue[head++];
        for(let i=remaining.length-1;i>=0;i--)if(Math.hypot(point.x-remaining[i].x,point.y-remaining[i].y)<=46)remaining.splice(i,1);
        [[16,0],[-16,0],[0,16],[0,-16]].forEach(([dx,dy])=>{
          const x=point.x+dx,y=point.y+dy,key=x+','+y;
          if(x<8||x>2392||y<8||y>1792||visited.has(key))return;
          visited.add(key);
          if(!Z.collides(world,x,y,8)&&!Z.collides(world,point.x+dx/2,point.y+dy/2,8))queue.push({x,y});
        });
      }
      ok(!remaining.length,'Unreachable weapons: '+remaining.map(i=>i.type+' ('+i.x+','+i.y+')').join(', ')+'; visited '+queue.length+' walkable cells');
    });

    test('Rolling dodges physical damage, costs energy and shakes off a latched rat', () => {
      const p = fixture(), thief = enemy('thief', p.x + 10), rat = enemy('rat', p.x + 5);
      rat.latched = 2; thief.stun = 100; const hp = p.hp;
      ok(game.roll()); near(p.stamina, .8); equal(rat.latched, 0); ok(rat.latchRest > 1);
      equal(game.hurtPlayer(50, 'thief'), false); near(p.hp, hp);
      p.poison = {time: 5, tick: 1, damage: 2}; advance(.2); ok(p.roll > 0); equal(game.roll(), false, 'Cannot roll while rolling');
      advance(.2); equal(p.roll, 0); ok(game.hurtPlayer(10, 'thief')); ok(p.hp < hp);
    });
    test('Every fourth consecutive landed strike is a 1.75x critical', () => {
      const p = fixture(); p.stats.speed = 60; p.dir = 'right';
      const thief = enemy('thief', p.x + 20); thief.stun = 100; thief.stats.armor = 0;
      for (let i = 0; i < 3; i++) { ok(game.attack()); advance(.52); }
      near(thief.hp, 100 - 3 * 5); ok(game.attack()); near(thief.hp, 100 - 3 * 5 - 5 * 1.75); equal(p.combo, 4);
      advance(2); equal(p.combo, 0, 'Combo resets after its window');
    });
    test('Defeated enemies drop coins that are collected by walking near them', () => {
      const p = fixture(); Math.random = () => 0; const thief = enemy('thief', p.x + 40);
      game.hitEnemy(thief, 1000, true); ok(game.drops.length > 0); near(game.drops.reduce((n, d) => n + d.value, 0), 5);
      advance(2); equal(game.drops.length, 0); equal(p.coins, 5);
    });
    test('A thief knockout steals 30 percent of the coins', () => {
      const p = fixture(); p.coins = 100; let lost;
      game.onEvent = (type, detail) => { if (type === 'knockout') lost = detail.lost; };
      game.hurtPlayer(1000, 'thief'); equal(p.coins, 70); equal(lost, 30);
    });
    test('Shop charges coins and applies herbs, sharpening and lessons', () => {
      const p = fixture(); p.coins = 5; equal(game.buy('herb').ok, false); equal(p.coins, 5);
      p.coins = 200; ok(game.buy('herb').ok); equal(p.herbs, 1); equal(p.coins, 190);
      const before = game.stats().strength; ok(game.buy('sharpen').ok); near(game.stats().damageMultiplier, 1.1); equal(p.coins, 160);
      ok(game.buy('lesson').ok); equal(p.points, 1); equal(p.coins, 100); near(game.stats().strength, before);
      equal(game.shopItems().find(i => i.id === 'sharpen').price, 60); equal(game.questFlags.bought, true);
    });
    test('Herb bag stores up to five herbs and R heals and cures poison', () => {
      const p = fixture(); p.herbs = 1; p.hp = 50; p.poison = {time: 5, tick: 1, damage: 2};
      ok(game.useHerb()); near(p.hp, 75); equal(p.poison, null); equal(p.herbs, 0); equal(game.useHerb(), false);
    });
    test('The Capo telegraphs, dashes and can be dodged by rolling', () => {
      const p = fixture(); const capo = enemy('capo', p.x + 60); capo.special = 0;
      game.update(1 / 60); ok(capo.telegraph > 0, 'Boss must telegraph before dashing'); const hp = p.hp;
      advance(.9); ok(capo.dash > 0 || capo.telegraph > 0); ok(game.roll()); p.rollX = 0; p.rollY = 0;
      advance(.45); near(p.hp, hp, 'Invulnerable while the dash passes through'); ok(capo.x < p.x, 'Capo dashed past the player');
      ok(capo.special > 3);
      const other = fixture(); const second = enemy('capo', other.x + 60); second.special = 0; const full = other.hp;
      game.update(1 / 60); advance(1.5); ok(other.hp < full, 'Standing still in the dash line hurts');
    });
    test('The Yarara chases instead of fleeing', () => {
      const p = fixture(); const yarara = enemy('yarara', p.x + 200); yarara.special = 99; yarara.alert = true;
      const before = yarara.x - p.x; advance(.5); ok(yarara.x - p.x < before - 10, 'She closes the distance');
    });
    test('The Yarara backs off a little before spitting', () => {
      const p = fixture(); const yarara = enemy('yarara', p.x + 120); yarara.special = 0; yarara.alert = true;
      game.update(1 / 60); ok(yarara.backoff > 0); const start = yarara.x; advance(.3);
      ok(yarara.x > start + 5 && yarara.x < start + 60, 'Retreats only a few steps'); advance(.15); ok(yarara.telegraph > 0 && yarara.kind === 'spit');
    });
    test('The Yarara tail sweep hits around her and can be rolled through', () => {
      const p = fixture(); const yarara = enemy('yarara', p.x, p.y - 40); yarara.special = 99; yarara.alert = true;
      game.update(1 / 60); ok(yarara.telegraph > 0 && yarara.kind === 'tail', 'Tail sweep is telegraphed'); const hp = p.hp;
      advance(.9); ok(p.hp < hp, 'Standing in the ring hurts'); ok(Math.hypot(p.x - yarara.x, p.y - yarara.y) > 40, 'Knocked outward');
      const q = fixture(); const second = enemy('yarara', q.x, q.y - 40); second.special = 99; second.alert = true; const full = q.hp;
      game.update(1 / 60); advance(.55); q.rollCooldown = 0; ok(game.roll()); q.rollX = 0; q.rollY = 0; advance(.2); near(q.hp, full, 'Rolling dodges the sweep');
    });
    test('The Yarara spits a three-way venom fan that hurts the player', () => {
      const p = fixture(); const yarara = enemy('yarara', p.x + 150); yarara.special = 0; Math.random = () => .99;
      game.update(1 / 60); ok(yarara.backoff > 0); advance(.45); ok(yarara.telegraph > 0); advance(.85);
      ok(game.projectiles.filter(s => s.hostile).length >= 2, 'Venom fan spawned'); const hp = p.hp;
      advance(1.2); ok(p.hp < hp, 'Venom must reach the player');
    });
    test('Coins, herbs and shop upgrades survive a save round trip', () => {
      const p = fixture('pepe', true); p.coins = 77; p.herbs = 3; p.sharpen = 2; p.lessons = 1; game.questFlags.bought = true; game.questFlags.defeat_capo = true;
      const save = game.snapshot(); game.newGame('tena'); game.restore(save, 1);
      equal(game.player.coins, 77); equal(game.player.herbs, 3); equal(game.player.sharpen, 2); equal(game.player.lessons, 1);
      equal(game.questFlags.bought, true); equal(game.questFlags.defeat_capo, true);
    });

    // Recolección, El Taller y cuevas profundas usan el mapa real.
    const node = (type, ore) => game.world.objects.find(o => o.type === type && (!ore || o.ore === ore) && !o.harvested);
    const standBy = o => { Object.assign(game.player, {x: o.x + o.w / 2, y: o.y + o.h + 9}); game.biome = Z.biomeAt(game.player.x, game.player.y); game.enemies = []; };
    test('Trees need an axe, take time to chop, give wood and regrow after a minute', () => {
      const p = fixture('gero', true), tree = node('tree'); standBy(tree);
      equal(Z.nearbyInteractable(game.world, p.x, p.y, 46, p) === tree, false, 'Without an axe trees are not interactable');
      ok(!game.startGather(tree), 'No axe, no wood');
      p.axe = 1; ok(game.startGather(tree)); advance(2.5); equal(p.materials.wood, 0, 'Still chopping');
      advance(.6); equal(p.materials.wood, 2); ok(tree.harvested && tree.solid, 'Stump stays solid');
      advance(59); ok(tree.harvested); advance(1.2); ok(!tree.harvested, 'Tree regrows after 60 s');
    });
    test('Better axes chop faster and moving cancels the work', () => {
      const p = fixture('gero', true), tree = node('tree'); standBy(tree); p.axe = 5;
      game.startGather(tree); advance(1.3); equal(p.materials.wood, 2, 'Diamond axe: 3 s / 2.4');
      const other = node('tree'); standBy(other); game.startGather(other); advance(.3); game.keys.add('d'); advance(.1); game.keys.clear();
      equal(p.gather, null, 'Walking away cancels'); advance(2); equal(p.materials.wood, 2);
    });
    test('Ore veins need the right pickaxe tier, shatter and stop blocking', () => {
      const p = fixture('gero', true), stone = node('ore', 'stone'); standBy(stone);
      ok(!game.startGather(stone), 'Needs a pickaxe'); p.pickaxe = 1; ok(game.startGather(stone)); advance(3.3);
      equal(p.materials.stone, 2); ok(stone.harvested && !stone.solid); ok(stone.regrow > 170, 'Stone regrows in 3 minutes');
      const iron = node('ore', 'iron'); standBy(iron); ok(!game.startGather(iron), 'Iron needs a stone pickaxe');
      p.pickaxe = 2; ok(game.startGather(iron)); advance(3.2); equal(p.materials.iron, 2);
      const gold = node('ore', 'gold'), diamond = node('ore', 'diamond'); standBy(gold); ok(!game.startGather(gold)); p.pickaxe = 3; ok(game.startGather(gold));
      standBy(diamond); ok(!game.startGather(diamond)); p.pickaxe = 4; ok(game.startGather(diamond));
    });
    test('A hit interrupts gathering', () => {
      const p = fixture(); p.axe = 1; const tree = {id: 'x-tree', type: 'tree', x: p.x - 10, y: p.y - 30, w: 20, h: 16, solid: true}; game.world.objects.push(tree);
      game.startGather(tree); advance(.5); game.hurtPlayer(5, 'bat'); equal(p.gather, null);
    });
    test('The smith crafts torch, tools and weapon upgrades in order and charges for them', () => {
      const p = fixture('gero', true); p.coins = 1000; Object.assign(p.materials, {wood: 40, stone: 30, coal: 3, iron: 30, gold: 30, diamond: 30});
      equal(game.craft('axe').ok, true); equal(p.axe, 1); equal(p.coins, 970);
      equal(game.craft('pickaxe').ok, true); equal(p.pickaxe, 1); equal(p.materials.wood, 30);
      equal(game.craft('torch').ok, true); ok(p.torch); equal(p.materials.coal, 0); equal(game.craft('torch').ok, false, 'Only one torch');
      equal(game.craft('pickaxe').ok, true); equal(p.pickaxe, 2); equal(p.materials.stone, 20); equal(p.coins, 895);
      equal(game.craft('weapon:sword').ok, false, 'Needs the sword first');
      p.weapons.push('sword'); const base = game.weaponLevelMultiplier('sword');
      equal(game.craft('weapon:sword').ok, true); equal(p.weaponLevels.sword, 2); near(game.weaponLevelMultiplier('sword'), base * 1.2);
      p.coins = 10; const result = game.craft('weapon:sword'); equal(result.ok, false); ok(result.message.includes('guita'));
      equal(p.weaponLevels.sword, 2); ok(game.questFlags.crafted);
    });
    test('Weapon level raises real damage', () => {
      const p = fixture(); p.weapon = 'fists'; p.dir = 'down'; const a = enemy('dog', p.x, p.y + 20); game.attack(); const first = a.maxHp - a.hp;
      a.dead = true; const b = enemy('dog', p.x, p.y + 20); p.weaponLevels.fists = 6; p.attackCooldown = 0; p.combo = 0; game.attack();
      ok(b.maxHp - b.hp > first, 'Level 6 hits harder');
    });
    test('Stairs down need a torch and lead to the deep caves', () => {
      const p = fixture('gero', true), down = game.world.objects.find(o => o.type === 'stairs' && o.to === 'cave2');
      p.torch = true; ok(!game.takeStairs(down), 'The Capo guards the way down'); p.torch = false;
      game.enemies.filter(e => e.type === 'capo' || e.type === 'vampire').forEach(e => { e.dead = true; e.respawn = 999; });
      ok(!game.takeStairs(down), 'Too dark without a torch'); p.torch = true; ok(game.takeStairs(down));
      advance(.1); equal(game.biome, 'cave2'); ok(p.discovered.includes('cave2'));
      equal(game.world.pickups.some(i => i.type === 'herb' && /cave[23]/.test(Z.biomeAt(i.x, i.y))), false, 'No healing herbs down here');
      const deeper = game.world.objects.find(o => o.type === 'stairs' && o.to === 'cave3'); ok(game.takeStairs(deeper)); advance(.1); equal(game.biome, 'cave3');
      const up = game.world.objects.find(o => o.type === 'stairs' && o.to === 'cave'); ok(game.takeStairs(up)); advance(.1); equal(game.biome, 'cave');
    });
    test('Deep cave enemies: spiders poison 15%, worms wait buried', () => {
      const p = fixture(); Math.random = () => .1; const spider = enemy('spider'); game.enemyAttack(spider); ok(p.poison, '0.1 < 15%');
      p.poison = null; Math.random = () => .2; spider.cooldown = 0; game.enemyAttack(spider); equal(p.poison, null, '0.2 > 15%');
      game.enemies = []; const worm = enemy('worm', p.x + 150); const x = worm.x; advance(1); equal(worm.alert, false); near(worm.x, x, 'Buried worm does not wander');
      worm.x = p.x + 100; advance(.1); ok(worm.alert, 'Worm emerges when you get close');
      equal(Z.enemyStats('worm', 1).health, 100); near(Z.enemyStats('worm', 1).strength, 7.2, 'Worm damage is 72%');
    });
    test('Materials, tools, upgrades and harvested nodes survive a save round trip', () => {
      const p = fixture('gero', true); Object.assign(p, {axe: 2, pickaxe: 3, torch: true}); p.materials.gold = 7; p.weaponLevels.fists = 4;
      const tree = node('tree'); tree.harvested = true; tree.regrow = 30; const save = game.snapshot();
      game.newGame('tena'); game.restore(save, 1); const q = game.player;
      equal(q.axe, 2); equal(q.pickaxe, 3); equal(q.torch, true); equal(q.materials.gold, 7); equal(q.weaponLevels.fists, 4);
      const again = game.world.objects.find(o => o.id === tree.id); ok(again.harvested); near(again.regrow, 30);
      const deep = game.snapshot(); deep.player.x = 105; deep.player.y = 1975; game.restore(deep, 1); equal(game.biome, 'cave2', 'Saving in a deep cave works');
    });

    test('Journal goals pay coins once, harder goals pay more', () => {
      const p = fixture(); p.coins = 0;
      equal(game.claimQuest('bow').ok, false, 'Not done yet'); p.weapons.push('bow'); game.checkQuests();
      equal(game.claimQuest('bow').ok, true); equal(p.coins, 5); equal(game.claimQuest('bow').ok, false, 'Only once'); equal(p.coins, 5);
      const rewards = Object.fromEntries(game.questsWithRewards().map(q => [q.id, q.reward]));
      ok(rewards.deepest > rewards.capo && rewards.capo > rewards.level5 && rewards.level5 > rewards.sword && rewards.sword > rewards.bow);
      ok(rewards.zak > rewards.cerbero && rewards.cerbero > rewards.golem && rewards.golem > rewards.vampire && rewards.vampire > rewards.deepest);
      ok(Object.values(rewards).reduce((a, b) => a + b, 0) <= 1200, 'Total stays modest');
    });
    test('Goals completed before rewards existed can still be claimed after loading', () => {
      const p = fixture('gero', true); p.weapons.push('bow', 'sword'); game.questFlags.defeat_capo = true; game.checkQuests();
      const save = game.snapshot(); Object.keys(save.questFlags).filter(k => k.startsWith('claimed_')).forEach(k => delete save.questFlags[k]);
      game.newGame('tena'); game.restore(save, 1);
      equal(game.unclaimedRewards().map(q => q.id).sort().join(','), 'bow,capo,sword');
      game.claimQuest('capo'); equal(game.player.coins, 40);
      const again = game.snapshot(); game.restore(again, 1); equal(game.questFlags.claimed_capo, true, 'Claims are saved'); equal(game.claimQuest('capo').ok, false);
    });

    // Jefes nuevos, ofrendas, altar y Trono de Zak.
    const killBoss = type => { const e = game.enemies.find(m => m.type === type && !m.summoned); e.dead = true; e.respawn = 999; return e; };
    const collectDrops = () => { const p = game.player; game.drops.forEach(d => { d.delay = 0; d.x = p.x; d.y = p.y - 6; }); game.updateDrops(1 / 60); };
    test('Bosses drop their offering and El Almacén buys it', () => {
      const p = fixture(); const yarara = enemy('yarara', p.x + 30); game.hitEnemy(yarara, 1e6, true);
      ok(yarara.dead); ok(game.drops.some(d => d.item === 'fang'), 'Fang dropped'); collectDrops(); equal(p.offerings.fang, 1);
      const coins = p.coins; ok(game.sell('fang').ok); equal(p.offerings.fang, 0); equal(p.coins, coins + 500); equal(game.sell('fang').ok, false);
    });
    test('Rats latched on bite softer and slower', () => {
      const p = fixture(); p.level = 40; p.stats.endurance = 0; const rat = enemy('rat', p.x + 5); rat.latched = 2; const hp = p.hp;
      game.enemyAttack(rat); near(hp - p.hp, rat.stats.strength * .6, 'Latched bite is 60%'); ok(rat.cooldown >= .9);
    });
    test('Zak slams the ground and throws three boomerangs that come back', () => {
      const p = fixture('gero', true); p.stats.health = 400; p.hp = 400; game.enterThrone(); game.finishCutscene(); const zak = game.enemies.find(e => e.type === 'zak');
      zak.cd = {slash: 99, raise: 99, storm: 99, wrath: 99, purple: 99, major: 99, boomerang: 0, ready: 1}; Object.assign(zak, {x: p.x + 220, y: p.y});
      advance(.05); equal(zak.act.id, 'boomerang'); advance(.7);
      const thrown = game.projectiles.filter(s => s.type === 'boomerang'); equal(thrown.length, 3); ok(thrown.every(s => s.hostile && s.pierce));
      const hurt = game.hurtPlayer; let hits = 0; game.hurtPlayer = () => { hits++; return true; };
      try { advance(1.4); ok(game.projectiles.some(s => s.type === 'boomerang' && s.back), 'They turn around'); advance(3); equal(game.projectiles.filter(s => s.type === 'boomerang').length, 0, 'They return to Zak'); ok(hits > 0, 'They hit on the way'); }
      finally { game.hurtPlayer = hurt; }
    });
    test('Old saves drop to half their level once and get compensation', () => {
      const p = fixture('gero', true); p.level = 41; p.xp = 2000; p.coins = 50; p.points = 7; p.stats.strength = 33; const save = game.snapshot();
      equal(save.balance >= 2, true, 'New saves are already balanced'); delete save.balance;
      ok(Z.Game.migrateSave(save)); equal(save.player.level, 21); equal(save.player.coins, 50 + Z.REBALANCE_GIFT); equal(save.player.points, 7); equal(save.player.stats.strength, 33);
      ok(Z.Game.validateSave(save)); equal(Z.Game.migrateSave(save), false, 'Only once');
    });
    test('Ctrl and right click roll where you are moving, not toward the mouse', () => {
      const p = fixture(); const key = (type, k, extra = {}) => document.body.dispatchEvent(new KeyboardEvent(type, {key: k, bubbles: true, ...extra}));
      key('keydown', 'f'); equal(p.roll, 0, 'F no longer rolls'); key('keyup', 'f');
      key('keydown', 'd'); key('keydown', 'Control', {ctrlKey: true}); ok(p.roll > 0, 'Ctrl rolls'); near(p.rollX, 1); near(p.rollY, 0);
      key('keyup', 'Control'); key('keyup', 'd'); advance(1.2);
      game.keys.add('w'); const r = game.canvas.getBoundingClientRect();
      game.canvas.dispatchEvent(new PointerEvent('pointerdown', {button: 2, clientX: r.right - 1, clientY: r.top + r.height / 2, bubbles: true}));
      ok(p.roll > 0, 'Right click rolls'); near(p.rollX, 0, 'Not toward the mouse'); near(p.rollY, -1, 'Toward where you move'); game.keys.clear(); advance(1.2);
      p.dir = 'left'; ok(game.roll()); near(p.rollX, -1, 'Standing still: where you look');
    });
    test('The skeleton archer keeps its distance and shoots arrows', () => {
      const p = fixture(); const archer = enemy('archer', p.x + 90); archer.cooldown = 0; const start = archer.x;
      advance(.05); ok(game.projectiles.some(s => s.hostile && s.type === 'arrow'), 'Shoots'); advance(.3); ok(archer.x > start, 'Backs away');
      game.hitEnemy(archer, 1); equal(archer.dead, true, 'One hit breaks it');
    });
    test('The skeleton shield sometimes blocks a hit', () => {
      const p = fixture(); const skeleton = enemy('skeleton', p.x + 20); Math.random = () => .1; const hp = skeleton.hp;
      game.hitEnemy(skeleton, 50); near(skeleton.hp, hp, 'Blocked'); Math.random = () => .9; game.hitEnemy(skeleton, 50); ok(skeleton.hp < hp);
    });
    test('The Golem has four lives, each one stronger, and a 5 second shield', () => {
      const p = fixture(); const golem = enemy('golem', p.x + 200); golem.cd = {quake: 99, rock: 99, fortify: 99, ready: 1};
      const first = golem.maxHp; game.hitEnemy(golem, 1e7, true); equal(golem.dead, false); equal(golem.act.id, 'rise');
      game.hitEnemy(golem, 10, true); equal(golem.hp, 1, 'Invulnerable while rising'); advance(2.4);
      equal(golem.life, 1); ok(golem.maxHp > first, 'Iron is tougher than stone'); near(golem.hp, golem.maxHp);
      golem.hp = golem.maxHp * .25; advance(1 / 60); ok(golem.shield > 4.9, 'Low health triggers the shield at once');
      const shielded = golem.hp; game.hitEnemy(golem, 1000, true); near(golem.hp, shielded);
      for (let k = 0; k < 3; k++) { golem.shield = 0; game.hitEnemy(golem, 1e7, true); if (!golem.dead) advance(2.4); }
      equal(golem.dead, true, 'Diamond is the last life');
    });
    test('Golem rock stuns for three seconds', () => {
      const p = fixture(); const golem = enemy('golem', p.x + 150); golem.cd = {quake: 99, rock: 0, fortify: 99, ready: 1};
      advance(1); const rock = game.projectiles.find(s => s.type === 'boulder'); ok(rock, 'Throws a rock');
      golem.cd.rock = 99; advance(1); ok(p.stunned > 2); const x = p.x; game.keys.add('d'); advance(.3); near(p.x, x, 'Cannot move while stunned'); game.keys.clear();
    });
    test('Cerbero digs to heal fully unless you hit him first', () => {
      const p = fixture(); const cerbero = enemy('cerbero', p.x + 120); cerbero.hp = cerbero.maxHp * .5; cerbero.cd = {bite: 99, jump: 99, dig: 0, ready: 1};
      advance(1 / 60); equal(cerbero.act.id, 'dig'); game.hitEnemy(cerbero, 5, true); equal(cerbero.act, null, 'A hit cancels the dig');
      cerbero.cd.dig = 0; advance(1 / 60); equal(cerbero.act.id, 'dig'); advance(3.1); near(cerbero.hp, cerbero.maxHp, 'Healed in full');
    });
    test('Cerbero bite makes you bleed 5 per second for 5 seconds', () => {
      const p = fixture(); p.stats.endurance = 100; const cerbero = enemy('cerbero', p.x + 30); cerbero.cd = {bite: 0, jump: 99, dig: 99, ready: 1};
      advance(.6); ok(p.bleed, 'Bleeding'); const hp = p.hp; cerbero.stun = 99; advance(5.1); near(hp - p.hp, 25); equal(p.bleed, null);
    });
    test('The Bloodsucker grabs, drains and heals; then summons five bats', () => {
      const p = fixture(); const vampire = enemy('vampire', p.x + 120); vampire.hp = vampire.maxHp * .5; vampire.cd = {swipe: 99, lunge: 0, summon: 99, ready: 1};
      advance(1.35); ok(p.grabbed > 0, 'Grabbed'); const hp = vampire.hp; advance(1.8); ok(vampire.hp > hp, 'Heals by draining'); equal(p.grabbed, 0);
      vampire.cd = {swipe: 99, lunge: 99, summon: 0, ready: 1}; advance(2); equal(game.enemies.filter(e => e.type === 'bat' && e.summoned).length, 5);
      const save = game.snapshot(); ok(!save.enemies.some(e => /^summon-/.test(e.id)), 'Summons are not saved');
    });
    test('Guarded stairs: the Capo blocks the way down to the deep cave', () => {
      const p = fixture('gero', true); p.torch = true; const down = game.world.objects.find(o => o.type === 'stairs' && o.to === 'cave2');
      ok(!game.takeStairs(down)); killBoss('capo'); ok(game.takeStairs(down)); advance(.1); equal(game.biome, 'cave2');
      const up = game.world.objects.find(o => o.type === 'stairs' && o.to === 'cave'); game.enemies.find(e => e.type === 'capo').dead = false; ok(game.takeStairs(up), 'Going up always works');
    });
    test('The altar takes one offering of each boss, keeps them and opens the portal', () => {
      const p = fixture('gero', true); const altar = game.world.objects.find(o => o.type === 'altar');
      Object.assign(p, {x: altar.x + altar.w / 2, y: altar.y + altar.h + 10}); game.biome = 'altar';
      p.offerings = {fang: 3, ring: 1, claw: 0, elemental: 0, eye: 0}; ok(!game.useAltar(), 'Cerbero guards it');
      killBoss('cerbero'); ok(game.useAltar()); equal(p.offerings.fang, 2, 'Only one of each'); equal(p.altar.fang, true); equal(p.altar.ring, true);
      const save = game.snapshot(); game.restore(save, 1); const q = game.player; equal(q.altar.ring, true, 'Placed offerings are saved'); equal(q.portal, false);
      killBoss('cerbero'); Object.assign(q.offerings, {claw: 1, elemental: 1, eye: 1}); ok(game.useAltar()); equal(q.portal, true); equal(Object.values(q.altar).some(Boolean), false, 'They break');
      equal(game.cutscene && game.cutscene.id, 'altar', 'Epic scene plays'); game.finishCutscene(); equal(game.cutscene, null);
      const portal = game.world.objects.find(o => o.type === 'portal'); Object.assign(q, {x: portal.x + portal.w / 2, y: portal.y + portal.h / 2}); game.biome = 'altar';
      advance(.05); equal(game.biome, 'sanctum', 'The portal leads to the Sanctum'); equal(q.portal, false); ok(q.discovered.includes('sanctum')); equal(game.cutscene, null);
    });
    test('During the storm only the stone hurts Zak, and a bolt kills', () => {
      const p = fixture('gero', true); game.enterThrone(); game.finishCutscene(); const zak = game.enemies.find(e => e.type === 'zak');
      zak.cd = {slash: 99, raise: 99, storm: 0, wrath: 99, purple: 99, major: 99, ready: 1}; advance(.05); equal(zak.act.id, 'storm');
      const hp = zak.hp; game.hitEnemy(zak, 500, true, false, 'sword'); near(zak.hp, hp, 'Sword does nothing'); game.hitEnemy(zak, 500, true, false, 'stone'); ok(zak.hp < hp, 'Stone works');
      game.bolts = [{x: p.x, y: p.y, t: .01, max: .85}]; advance(.05); equal(game.state, 'paused', 'Knocked out by lightning'); equal(game.biome, 'village');
    });
    test('Two Zak hits are enough to knock you out', () => {
      const p = fixture('gero', true); p.stats.health = 400; p.hp = 400; p.stats.endurance = 100; game.enterThrone(); game.finishCutscene(); const zak = game.enemies.find(e => e.type === 'zak');
      game.zakHit(zak, 1); ok(p.hp > 0 && p.hp <= 400 * .48 + 1e-6, 'One hit takes more than half'); game.zakHit(zak, 1); equal(game.state, 'paused');
    });
    test('Zak stands still after an attack, leaving an opening for melee', () => {
      const p = fixture('gero', true); game.enterThrone(); game.finishCutscene(); const zak = game.enemies.find(e => e.type === 'zak');
      Object.assign(zak, {x: p.x + 60, y: p.y, act: {id: 'slash', t: 2.09, done: 2, swing: 2}, cd: {slash: 0, raise: 99, storm: 99, wrath: 99, purple: 99, major: 99, boomerang: 99, ready: 1}});
      advance(.05); equal(zak.act, null, 'The combo ended'); ok(zak.cd.rest > 0, 'He rests'); const x = zak.x, y = zak.y; zak.cd.slash = 0;
      advance(1.5); equal(zak.act, null, 'No attack while resting'); near(zak.x, x, 'He does not chase'); near(zak.y, y, 'He does not chase'); equal(zak.moving, false);
      advance(.6); equal(zak.act && zak.act.id, 'slash', 'Then he attacks again');
    });
    test('Major summon: Zak sits on his throne and heals until the boss falls', () => {
      const p = fixture('gero', true); game.enterThrone(); game.finishCutscene(); const zak = game.enemies.find(e => e.type === 'zak'); Math.random = () => 0;
      zak.cd = {slash: 99, raise: 99, storm: 99, wrath: 99, purple: 99, major: 0, ready: 1}; zak.hp -= 500; advance(1.6);
      const minion = game.enemies.find(e => e.summoned && e.major); ok(minion, 'A boss appears'); equal(minion.type, 'capo'); equal(zak.seated, true);
      equal(minion.level, p.level, 'Same level as that boss'); const hp = zak.hp; advance(2); ok(zak.hp > hp + 5, 'Heals 3 per second');
      game.hitEnemy(minion, 1e7, true); advance(.1); equal(zak.seated, false); ok(zak.cd.major >= 39 && zak.cd.major <= 80);
    });
    test('Beating Zak: he yields, opens a portal for 40 s and executes you if you stay', () => {
      const p = fixture('gero', true); game.enterThrone(); game.finishCutscene(); const zak = game.enemies.find(e => e.type === 'zak');
      p.coins = 900; p.materials.gold = 20; p.offerings.eye = 2; p.weapons.push('sword'); p.pickaxe = 3; zak.life = 2; game.hitEnemy(zak, 1e9, true);
      ok(zak.yielding, 'He stops fighting'); equal(zak.dead, false); equal(game.questFlags.defeat_zak, true); collectDrops(); zak.x = Z.THRONE_SPOTS.seat.x; zak.y = Z.THRONE_SPOTS.seat.y;
      advance(3.5); ok(game.exitPortal, 'Portal opens'); ok(game.exitPortal.time <= 40 && game.exitPortal.time > 37);
      advance(40.5); equal(game.cutscene && game.cutscene.id, 'execute', 'Zak closes the portal in a scene'); equal(game.biome, 'throne');
      const x = p.x; game.keys.add('d'); advance(1); equal(p.x, x, 'The player cannot move'); game.keys.clear(); ok(!game.roll() && !game.attack(), 'Nor roll or attack');
      advance(3); equal(game.exitPortal, null, 'The portal is closed'); advance(6); equal(game.state, 'paused'); equal(game.biome, 'village'); equal(p.coins, 0); equal(p.materials.gold, 0); equal(p.offerings.eye, 0);
      ok(p.weapons.includes('sword') && p.pickaxe === 3, 'Weapons and tools stay');
    });
    test('Before the fight Zak asks who you are; you cannot move and the camera looks at him', () => {
      const p = fixture('gero', true); game.enterThrone(); const zak = game.enemies.find(e => e.type === 'zak'), said = [];
      const x = p.x, y = p.y; game.keys.add('w'); game.keys.add(' ');
      for (let i = 0; i < 60 * 12 && game.cutscene; i++) { game.update(1 / 60); const l = game.cutscene && game.cutscene.line; if (l && !said.includes(l.text)) said.push(l.text); }
      game.keys.clear(); equal(game.cutscene, null, 'The scene ends by itself');
      equal(said.join(' | '), '¿Y vos quién sos? | ¿Qué hacés acá? | No importa… ahora vas a ser mi juguete por un rato.');
      equal(p.x, x); equal(p.y, y); ok(zak.hp === zak.maxHp && !zak.act, 'Zak waits'); advance(.1); ok(zak.alert, 'Then the fight starts');
      game.enterThrone(); advance(1); near(game.cutscene.focus.x, zak.x); ok(game.cutscene.focus.y < zak.y, 'The camera looks at Zak');
      advance(1.2); const line = game.cutscene.line; ok((game.cutscene.t - line.at) * Z.CUTSCENE_CPS < line.text.length, 'Still typing');
      game.advanceCutscene(); ok((game.cutscene.t - line.at) * Z.CUTSCENE_CPS >= line.text.length, 'E completes the line'); equal(game.cutscene.line, line);
      game.advanceCutscene();
      equal(game.cutscene.line.text, '¿Qué hacés acá?', 'E skips to the next line');
    });
    test('The altar portal leads to the Sanctum: safe, with a fountain, and the Magic Village up north', () => {
      const p = fixture('gero', true); game.enterDimension(); equal(game.biome, 'sanctum'); ok(Z.isSafe('sanctum'));
      const hp = p.hp; ok(!game.hurtPlayer(50, 'mage'), 'Nothing hurts in the Sanctum'); equal(p.hp, hp);
      p.hp = 10; p.burn = {time: 5, tick: 1, damage: 2}; const well = game.world.objects.find(o => o.type === 'well' && o.dark);
      Object.assign(p, {x: well.x + well.w / 2, y: well.y + well.h + 12}); game.interact(); equal(p.hp, game.stats().maxHealth, 'The fountain heals'); equal(p.burn, null);
      Object.assign(p, {x: 600, y: 3300}); advance(.05); equal(game.biome, 'magic'); ok(!Z.isSafe('magic'));
      ok(game.enemies.some(e => e.type === 'archmage') && game.enemies.filter(e => e.type === 'mage').length >= 5 && game.enemies.filter(e => e.type === 'armor').length >= 4);
    });
    test('Campfires burn 2 per second for 5 seconds', () => {
      const p = fixture('gero', true); game.enterDimension(); game.enemies = []; const fire = game.world.objects.find(o => o.type === 'campfire');
      Object.assign(p, {x: fire.x + fire.w / 2, y: fire.y + fire.h / 2}); game.biome = 'magic'; advance(.05); ok(p.burn && p.burn.damage === 2, 'Burning');
      p.x += 60; const hp = p.hp; advance(5.2); near(hp - p.hp, 10, '2 per second for 5 s'); equal(p.burn, null);
    });
    test('Mages stand still 2 s casting, then throw a fireball that burns; they keep their distance', () => {
      const p = fixture(); const mage = enemy('mage', p.x + 250); mage.cooldown = 0; mage.alert = true;
      advance(.1); equal(mage.act && mage.act.id, 'cast'); const x = mage.x; advance(1.5); equal(mage.x, x, 'Still while casting');
      ok(!game.projectiles.some(s => s.type === 'fireball'), 'Not yet'); advance(.5); ok(game.projectiles.some(s => s.type === 'fireball' && s.burn >= 2), 'Fireball');
      advance(2); ok(p.burn, 'It burns'); const near2 = enemy('mage', p.x + 60); near2.cooldown = 9; near2.alert = true; const d = Math.abs(near2.x - p.x); advance(.5); ok(Math.abs(near2.x - p.x) > d, 'Backs away');
    });
    test('Living armors are very slow and spin their sword around them', () => {
      const p = fixture(); const armor = enemy('armor', p.x + 40); armor.cooldown = 0; ok(armor.stats.moveSpeed < 40, 'Extremely slow');
      advance(.05); equal(armor.act && armor.act.id, 'spin'); const hp = p.hp; advance(.9); equal(p.hp, hp, 'Slow to hit');
      advance(.3); ok(p.hp < hp, 'Spin hits around'); const behind = p.hp; armor.act = null; armor.cooldown = 0; p.x = armor.x - 30; advance(1.3); ok(p.hp < behind, 'Also behind it');
    });
    test('Overload: eight seconds standing still and hittable, then an ice blast that freezes you for five', () => {
      const p = fixture('gero', true); game.enterDimension(); const king = game.enemies.find(e => e.type === 'archmage');
      game.enemies = [king]; Object.assign(p, {x: king.x + 140, y: king.y}); game.biome = 'magic'; p.stats.health = 9000; p.hp = 9000; p.weapon = 'fists'; Math.random = () => .1;
      king.cd = {nova: 99, heal: 99, summon: 99, laser: 99, overload: 0, ready: 1}; advance(.05); equal(king.act && king.act.id, 'overload', 'Starts right there, without teleporting');
      const spot = {x: king.x, y: king.y}, hp = king.hp; game.hitEnemy(king, 500, true); ok(king.hp < hp, 'He can be hit'); equal(king.act.id, 'overload', 'Hits do not stop it');
      king.cd.nova = 0; king.cd.heal = 0; king.cd.laser = 0; advance(7.8); equal(king.act.id, 'overload', 'Still charging'); near(king.x, spot.x, 'Does not move'); near(king.y, spot.y, 'Does not move'); near(p.hp, 9000, 'No damage yet');
      equal(Z.OVERLOAD_RADIUS, 150, 'One and a half times the Golem quake');
      king.cd.nova = 99; king.cd.heal = 99; king.cd.laser = 99; advance(.2); equal(king.act, null, 'It ends'); ok(p.hp < 9000, 'The blast hurts'); ok(p.frozen > 4.5 && p.frozen <= 5, 'Frozen for five seconds');
      const x = p.x, frozenAt = p.frozen; p.attackCooldown = 0; p.rollCooldown = 0; game.keys.add('d'); advance(.3); game.keys.clear(); near(p.x, x, 'Cannot move'); ok(!game.attack(), 'Cannot attack'); ok(!game.roll(), 'Cannot roll'); ok(p.frozen < frozenAt);
      const before = p.hp; game.hurtPlayer(10, 'mage'); ok(p.hp < before, 'Enemies can hit you while frozen');
      advance(4.8); equal(p.frozen, 0, 'Thaws after five seconds'); equal(p.stunned, 0); ok(game.attack(), 'Attacks again');
    });
    test('Overload only reaches inside its area and rolling dodges it', () => {
      const blast = (dx, dy, roll) => {
        const p = fixture('gero', true); game.enterDimension(); const king = game.enemies.find(e => e.type === 'archmage');
        game.enemies = [king]; Object.assign(p, {x: king.x + dx, y: king.y + dy}); game.biome = 'magic'; p.stats.health = 9000; p.hp = 9000; p.rollX = 0; p.rollY = 0;
        king.alert = true; king.cd = {nova: 99, heal: 99, summon: 99, laser: 99, overload: 99, ready: 1}; king.act = {id: 'overload', t: 0, time: 7.99}; p.roll = roll ? .2 : 0; advance(.05); equal(king.act, null); return {frozen: p.frozen > 0, hurt: p.hp < 9000};
      };
      ok(blast(148, 0, false).frozen, 'Inside'); ok(!blast(155, 0, false).hurt, 'Just outside'); ok(blast(0, 110, false).frozen, 'The area is an ellipse: inside'); ok(!blast(0, 116, false).frozen, 'The area is an ellipse: outside');
      const rolled = blast(60, 0, true); ok(!rolled.frozen && !rolled.hurt, 'A roll dodges it');
    });
    test('The Archmage teleports, heals unless you hit him, summons armors and ends the clock laser with a wave you must roll', () => {
      const p = fixture('gero', true); game.enterDimension(); const king = game.enemies.find(e => e.type === 'archmage');
      game.enemies = [king]; Object.assign(p, {x: king.x, y: king.y + 120}); game.biome = 'magic'; p.stats.health = 5000; p.hp = 5000; let calls = 0; Math.random = () => calls++ ? original.random() : .1;
      king.cd = {nova: 0, heal: 99, summon: 99, laser: 99, ready: 1}; advance(.05); equal(king.act.id, 'teleport'); const from = {x: king.x, y: king.y};
      const hp = king.hp; game.hitEnemy(king, 500, true); equal(king.hp, hp, 'Untouchable while vanishing'); advance(.7);
      ok(Math.hypot(king.x - from.x, king.y - from.y) > 50, 'He moved'); ok(Math.hypot(king.x - p.x, king.y - p.y) >= 200, 'Far from you');
      const thrown = []; game.fireball = function (...args) { thrown.push(args); return Z.Game.prototype.fireball.apply(this, args); };
      advance(.8); delete game.fireball; equal(thrown.length, 5, 'Five fireballs around'); ok(thrown.every(t => t[3] >= 2), 'They burn');
      game.projectiles = []; Math.random = () => .9; king.act = null; king.hp = king.maxHp * .5; king.cd = {nova: 99, heal: 0, summon: 99, laser: 99, ready: 1};
      advance(.05); equal(king.act.id, 'heal'); const low = king.hp; advance(2); ok(king.hp > low + 250, 'Heals ~150/s'); game.hitEnemy(king, 1, true); equal(king.act, null, 'A hit cancels it');
      king.cd = {nova: 99, heal: 99, summon: 0, laser: 99, ready: 1}; advance(1.2); equal(game.enemies.filter(e => e.type === 'armor' && e.summoned).length, 5, 'Five armors');
      game.enemies = [king]; king.act = null; king.cd = {nova: 99, heal: 99, summon: 99, laser: 0, ready: 1}; Object.assign(p, {x: king.x + (king.x < 600 ? 200 : -200), y: king.y});
      advance(.05); equal(king.act.id, 'laser'); p.hp = 5000; advance(5.05);
      const a = king.act; ok(a && a.wave !== undefined, 'Wave after the lasers'); const d = Math.hypot(p.x - king.x, (p.y - king.y) / .75);
      while (king.act && a.wave + 60 < d) advance(1 / 60); const before = p.hp; p.rollCooldown = 0; p.stamina = 1; ok(game.roll()); advance(.25); equal(p.hp, before, 'Rolling dodges the wave');
    });
    test('The Archmage drops the Magic Sphere and the throne key; the key opens the door to Zak', () => {
      const p = fixture('gero', true); game.enterDimension(); const king = game.enemies.find(e => e.type === 'archmage'); game.biome = 'magic';
      game.hitEnemy(king, 1e9, true); equal(king.dead, true); collectDrops(); collectDrops(); equal(p.offerings.sphere, 1); equal(p.throneKeys, 1); ok(game.questFlags.defeat_archmage);
      ok(Z.Game.prototype.sellOptions.call(game).some(o => o.id === 'sphere' && o.price === 3000), 'It sells');
      const door = game.world.objects.find(o => o.type === 'door'); Object.assign(p, {x: door.x + door.w / 2, y: door.y + door.h + 14});
      p.throneKeys = 0; game.interact(); equal(game.biome, 'magic', 'Locked without the key'); p.throneKeys = 1; game.interact();
      equal(game.biome, 'throne'); equal(p.throneKeys, 0, 'The key is used'); equal(game.cutscene.id, 'zakIntro');
      ok(!Z.ALTAR_OFFERINGS.includes('sphere'), 'The sphere is not an altar offering');
    });
    test('Beating Zak saves the fastest fight as a record', () => {
      const p = fixture('gero', true); game.enterThrone(); game.finishCutscene(); const zak = game.enemies.find(e => e.type === 'zak');
      game.time += 125; zak.life = 2; game.hitEnemy(zak, 1e9, true); ok(Math.abs(p.zakBest - 125) < .1, 'Record');
      game.resetZak(); game.enterThrone(); game.finishCutscene(); game.time += 300; const z2 = game.enemies.find(e => e.type === 'zak'); z2.life = 2; game.hitEnemy(z2, 1e9, true);
      ok(Math.abs(p.zakBest - 125) < .1, 'A slower win keeps the record');
      const save = game.snapshot(); game.restore(save, 1); ok(Math.abs(game.player.zakBest - 125) < .1, 'Saved'); equal(Z.formatTime(125), '2:05'); equal(Z.formatTime(3725), '1:02:05');
    });
    test('Taking the exit portal brings you home and resets Zak', () => {
      const p = fixture('gero', true); game.enterThrone(); game.finishCutscene(); const zak = game.enemies.find(e => e.type === 'zak'); zak.life = 2; game.hitEnemy(zak, 1e9, true);
      zak.x = Z.THRONE_SPOTS.seat.x; zak.y = Z.THRONE_SPOTS.seat.y; advance(3.5); Object.assign(p, {x: game.exitPortal.x, y: game.exitPortal.y}); advance(.05);
      equal(game.biome, 'village'); equal(game.state, 'playing'); const fresh = game.enemies.find(e => e.type === 'zak'); equal(fresh.life, 0); ok(!fresh.yielding && !fresh.seated);
    });
    test('The Elemental Sword needs five Elemental Stones and hits harder than a maxed sword', () => {
      const p = fixture(); p.weapons.push('sword'); p.weaponLevels.sword = 6; Object.assign(p.materials, {wood: 10, stone: 25, iron: 20, gold: 15, diamond: 10});
      p.dir = 'right'; p.offerings.elemental = 4; equal(game.craft('elemental').ok, false); p.offerings.elemental = 5; ok(game.craft('elemental').ok);
      ok(p.weapons.includes('elemental')); equal(p.offerings.elemental, 0); equal(p.materials.iron, 0);
      const target = enemy('thief', p.x + 20); target.stats.armor = 0; p.weapon = 'sword'; p.attackCooldown = 0; p.combo = 0; game.attack(); const swordHit = target.maxHp - target.hp;
      target.hp = target.maxHp; p.weapon = 'elemental'; p.attackCooldown = 0; p.combo = 0; game.attack(); ok(target.maxHp - target.hp > swordHit * 1.4, 'Much stronger');
    });

    game.pause(); cancelAnimationFrame(game.frame);
    return {passed: results.filter(r=>r.pass).length, failed: results.filter(r=>!r.pass).length, results};
  };
})(window);

// Allows browser_check.py --script tests/engine.test.js to read the completed browser report.
window.zakTestResults || null;
