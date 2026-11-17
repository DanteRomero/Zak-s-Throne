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
    test('The bow reaches twice as far as the stone and no further', () => {
      const p = fixture(); p.weapon = 'bow'; p.weapons.push('bow'); p.dir = 'right'; equal(Z.WEAPON_TYPES.bow.range, 330); equal(Z.WEAPON_TYPES.stone.range, 165, 'The stone keeps its reach');
      const far = enemy('thief', p.x + 360); far.stun = 100; const hp = far.hp; ok(game.attack()); advance(1.2); equal(far.hp, hp, 'Too far'); equal(game.projectiles.length, 0);
    });
    test('The bow hits an enemy well past the stone reach', () => {
      const p = fixture(); p.weapon = 'bow'; p.weapons.push('bow'); p.dir = 'right';
      const far = enemy('thief', p.x + 320); far.stun = 100; const hp = far.hp; ok(game.attack()); advance(1.2); ok(far.hp < hp, 'Hit at 320'); equal(game.projectiles.length, 0);
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
      advance(.05); equal(game.cutscene && game.cutscene.id, 'portal', 'Crossing plays a scene'); equal(game.biome, 'altar'); game.finishCutscene();
      equal(game.biome, 'sanctum', 'The portal leads to the Sanctum'); equal(q.portal, true, 'It stays lit'); ok(q.discovered.includes('sanctum')); equal(game.cutscene, null);
    });
    test('The lit portal can be crossed again without offerings, but not while Cerbero lives', () => {
      const p = fixture('gero', true), toasts = [], onEvent = game.onEvent; game.onEvent = (type, detail) => { if (type === 'toast') toasts.push(detail.message); return onEvent.call(game, type, detail); };
      const portal = game.world.objects.find(o => o.type === 'portal'), stand = () => { Object.assign(p, {x: portal.x + portal.w / 2, y: portal.y + portal.h / 2}); game.biome = 'altar'; };
      p.portal = true; p.stats.health = 1e5; p.hp = 1e5; game.enemies = game.enemies.filter(e => e.type === 'cerbero'); game.enemies[0].stun = 99; stand(); advance(.5); equal(game.biome, 'altar', 'Cerbero blocks it'); equal(game.cutscene, null); equal(toasts.length, 1, 'One warning, not one per frame');
      p.x += 60; advance(.05); stand(); advance(.05); equal(toasts.length, 2, 'Warns again when you come back'); equal(p.portal, true);
      killBoss('cerbero'); advance(.05); equal(game.cutscene && game.cutscene.id, 'portal');
      game.keys.add('d'); advance(.5); game.keys.clear(); near(p.x, portal.x + portal.w / 2, 'Pulled in, not walking'); ok(!game.attack() && !game.roll(), 'No acting during the scene');
      advance(1); equal(game.biome, 'sanctum', 'Changes zone mid-scene'); near(p.x, Z.DIMENSION_SPOTS.arrive.x); ok(game.cutscene); advance(1.5); equal(game.cutscene, null, 'The scene ends by itself'); equal(p.portal, true);
      const save = game.snapshot(); game.restore(save, 1); equal(game.player.portal, true, 'Saved lit');
    });
    test('Old saves: a portal already opened turns back on and returns offerings left on the altar', () => {
      fixture('gero', true); const save = JSON.parse(JSON.stringify(game.snapshot())); save.questFlags.altar = true; save.player.portal = false; save.player.altar.ring = true; save.player.offerings.ring = 1;
      game.restore(save, 1); const q = game.player; equal(q.portal, true); equal(q.altar.ring, false); equal(q.offerings.ring, 2);
      fixture('gero', true); const fresh = JSON.parse(JSON.stringify(game.snapshot())); fresh.player.altar.ring = true; game.restore(fresh, 1); equal(game.player.portal, false, 'Never opened: nothing changes'); equal(game.player.altar.ring, true);
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

    // Pone el reloj en una hora de la primera noche (o del día) y decide la tirada de la luna.
    const NIGHT = 11 * 60, DAWN = 23 * 60;
    function nightfall(roll) { Math.random = () => roll; game.player.playTime = NIGHT; game.update(1 / 60); Math.random = original.random; }
    test('The day has morning, afternoon and night, and nights are numbered', () => {
      const at = minutes => Z.dayClock(minutes * 60);
      equal(Z.dayClock(0).phase, 'day'); near(Z.dayClock(0).hour, 8); equal(Z.dayClock(0).night, -1);
      equal(at(5.99).phase, 'day'); equal(at(6).phase, 'afternoon'); equal(at(10.99).phase, 'afternoon');
      equal(at(11).phase, 'night'); equal(at(11).night, 0); equal(at(16).night, 0, 'Past midnight is the same night'); equal(at(22.99).night, 0);
      equal(at(23).phase, 'day'); equal(at(23).night, -1); equal(at(35).night, 1); equal(at(59).night, 2);
      ok(Z.dayClock(NaN).hour === 8 && Z.dayClock(-5).hour === 8, 'Bad clocks fall back to the start');
    });
    test('The red moon rolls 5 percent once per night and lasts until dawn', () => {
      const p = fixture(); near(Z.BLOOD_MOON.chance, .05);
      nightfall(.0499); equal(p.bloodMoon, true, 'Just under 5 percent'); equal(p.moonNight, 0);
      p.playTime = DAWN - 1; Math.random = () => .99; game.update(1 / 60); equal(p.bloodMoon, true, 'Lasts the whole night, no reroll');
      p.playTime = DAWN; game.update(1 / 60); equal(p.bloodMoon, false, 'Dawn ends it');
      fixture(); nightfall(.05); equal(game.player.bloodMoon, false, 'Exactly 5 percent is not enough');
      Math.random = () => 0; game.update(1 / 60); equal(game.player.bloodMoon, false, 'Only one roll per night');
      game.player.playTime = 35 * 60; game.update(1 / 60); equal(game.player.bloodMoon, true, 'The next night rolls again'); equal(game.player.moonNight, 1);
    });
    test('Red moon enemies are stronger, faster and tougher, and go back at dawn', () => {
      const p = fixture(), rat = enemy('rat', p.x + 200), boss = enemy('capo', p.x + 400), before = {...rat.stats}, bossBefore = {...boss.stats}; rat.hp = rat.maxHp / 2;
      nightfall(0); const s = rat.stats, m = Z.BLOOD_MOON;
      near(s.strength, before.strength * m.strength, 'Strength'); near(s.moveSpeed, before.moveSpeed * m.speed, 'Speed'); near(s.attackCooldown, before.attackCooldown / m.speed, 'Attack rate');
      near(s.armor, before.armor + m.armor, 'Armor'); near(rat.maxHp, before.health * m.health, 'Health'); near(rat.hp, rat.maxHp / 2, 'Keeps its share of health');
      ok(s.strength > before.strength && s.moveSpeed > before.moveSpeed && s.armor > before.armor && rat.maxHp > before.health, 'All of them go up');
      near(boss.stats.strength, bossBefore.strength * m.strength, 'Bosses too');
      const late = enemy('snake', p.x + 300); equal(late.stats.bloodMoon, true, 'Enemies that appear during the night are affected');
      p.playTime = DAWN; game.update(1 / 60); near(rat.stats.strength, before.strength, 'Back to normal'); near(rat.maxHp, before.health); near(rat.hp, rat.maxHp / 2); ok(!rat.stats.bloodMoon);
    });
    test('Red moon kills pay double experience and coins', () => {
      let p = fixture(); Math.random = () => 0; const normal = enemy('thief', p.x + 40); game.hitEnemy(normal, 1e6, true);
      const xp = p.xp, coins = game.drops.reduce((n, d) => n + d.value, 0); ok(xp > 0 && coins > 0);
      p = fixture(); nightfall(0); Math.random = () => 0; const moon = enemy('thief', p.x + 40); game.hitEnemy(moon, 1e6, true);
      near(p.xp, xp * 2, 'Double experience'); near(game.drops.reduce((n, d) => n + d.value, 0), coins * 2, 'Double coins');
    });
    test('The Golem keeps the red moon when it rises with its next life', () => {
      const p = fixture(); nightfall(0); const golem = enemy('golem', p.x + 300); golem.cd = {quake: 99, rock: 99, fortify: 99, ready: 1};
      game.hitEnemy(golem, 1e7, true); advance(2.4); equal(golem.life, 1); equal(golem.stats.bloodMoon, true);
    });
    test('v2.24: the red moon also reaches Zak dimension: its enemies and bosses get stronger', () => {
      const p = fixture('gero', true); const toasts = []; game.onEvent = (type, detail) => { if (type === 'toast') toasts.push(detail.message); };
      const inside = game.enemies.filter(e => Z.isZakDimension(e.biome)), outside = game.enemies.filter(e => !Z.isZakDimension(e.biome) && !e.dead);
      ok(inside.length && outside.length); ok(['sanctum', 'magic', 'throne'].every(Z.isZakDimension)); ok(!['village', 'cave', 'weeds', 'cave2', 'cave3', 'altar'].some(Z.isZakDimension));
      game.biome = 'magic'; Object.assign(p, Z.DIMENSION_SPOTS.arrive); p.y = Z.MAGIC_ZONE.y + 300; nightfall(0);
      equal(p.bloodMoon, true, 'The clock keeps running outside'); const moonToasts = () => toasts.filter(m => /Luna roja/i.test(m)).length; equal(moonToasts(), 1, 'Warned inside the dimension too'); ok(toasts.some(m => /Zak se vuelve/.test(m)));
      ok(inside.every(e => e.stats.bloodMoon), 'Dimension enemies change too'); ok(outside.every(e => e.stats.bloodMoon), 'Normal world ones do');
      ok(game.enemyStatsFor('archmage', 0, 'library').bloodMoon, 'The Rey Mago too'); ok(game.enemyStatsFor('zak', 0, 'throne').bloodMoon, 'And Zak');
      const spawned = game.makeEnemy({id: 'mage-test', type: 'mage', x: 600, y: Z.MAGIC_ZONE.y + 200}); ok(spawned.stats.bloodMoon, 'New ones too');
      Object.assign(p, game.world.spawn); game.biome = 'village'; game.update(1 / 60); equal(moonToasts(), 1, 'No second warning when coming back');
    });
    test('The red moon survives a save and old or stale saves stay valid', () => {
      const p = fixture('gero', true); nightfall(0); const target = game.enemies.find(e => e.biome === 'cave'); target.hp = target.maxHp * .5; const hp = target.hp, save = game.snapshot();
      game.newGame('tena'); game.restore(save, 1); equal(game.player.bloodMoon, true); equal(game.player.moonNight, 0);
      Math.random = () => .99; game.update(1 / 60); equal(game.player.bloodMoon, true, 'Loading does not roll again');
      const loaded = game.enemies.find(e => e.id === target.id); equal(loaded.stats.bloodMoon, true); near(loaded.hp, hp, 'Health is kept');
      const old = game.snapshot(); delete old.player.bloodMoon; delete old.player.moonNight; game.restore(old, 1); equal(game.player.bloodMoon, false); equal(game.player.moonNight, -1);
      const stale = game.snapshot(); stale.player.bloodMoon = true; stale.player.moonNight = 0; stale.player.playTime = 60; game.restore(stale, 1); equal(game.player.bloodMoon, false, 'A red moon during the day is ignored');
      const wrong = game.snapshot(); wrong.player.bloodMoon = true; wrong.player.moonNight = 3; wrong.player.playTime = NIGHT; game.restore(wrong, 1); equal(game.player.bloodMoon, false, 'From another night is ignored');
    });
    test('Red moon eyes glow red on every enemy of the normal world', () => {
      // Sin temblor: si la cámara se mueve al azar entre los dos dibujos, el conteo de píxeles no se puede comparar.
      const p = fixture(); p.playTime = 0; game.shakeTime = 0;
      const reds = () => { const c = game.renderer.ctx, d = c.getImageData(0, 0, c.canvas.width, c.canvas.height).data; let n = 0; for (let i = 0; i < d.length; i += 4) if (d[i] - d[i + 1] > 90 && d[i] - d[i + 2] > 90) n++; return n; };
      for (const type of ['thief', 'dog', 'snake', 'rat', 'bat', 'spider', 'worm', 'skeleton', 'archer', 'capo', 'yarara', 'vampire', 'golem', 'cerbero']) {
        game.enemies = []; p.bloodMoon = false; p.playTime = 0; const e = enemy(type, p.x + 30, p.y + 10); e.alert = false; e.stun = 5;
        game.renderer.draw(game, 0); const before = reds();
        p.bloodMoon = true; p.moonNight = 0; game.refreshEnemyStats(); game.renderer.draw(game, 0);
        ok(reds() > before, type + ' should show red eyes');
      }
    });

    // Vecinos, animales y diálogos.
    const GAUCHO_LINE = 'Como me gustaría que haya un lugar pa jugar al truco... será que se arme algún torneito. *ruido de mate*';
    const npc = name => game.world.npcs.find(n => n.name === name);
    const talkers = () => game.world.npcs.filter(n => n.lines), people = () => game.world.npcs.filter(n => n.look);
    const standNear = n => { Object.assign(game.player, {x: n.x, y: n.y + (n.radius || 9) + 12}); game.biome = Z.biomeAt(game.player.x, game.player.y); };
    test('Saved games: new neighbors do not move any vein or tree', () => {
      // Huella tomada en v2.16: si cambia, las partidas guardadas recordarían vetas y árboles equivocados.
      // Las vetas de cristal arcano (v2.19) se agregan al final: no cuentan en la huella de antes.
      const nodes = Z.createWorld().objects.filter(o => (o.type === 'ore' || o.type === 'tree') && o.ore !== 'arcane'); let hash = 0;
      for (const o of nodes) for (const ch of [o.id, o.type, o.x, o.y].join('|') + ';') hash = Math.imul(hash, 31) + ch.charCodeAt(0) | 0;
      equal(nodes.length, 307, 'veins and trees'); equal(hash, 1825658723, 'fingerprint');
    });
    test('Saved games: a v2.16 save restores the same harvested nodes and carries no NPC data', () => {
      const p = fixture('gero', true); p.level = 7; p.xp = 0; const data = JSON.parse(JSON.stringify(game.snapshot()));
      ok(!Object.keys(data).some(k => /npc|talk|said/i.test(k)) && !Object.keys(data.player).some(k => /npc|talk|said/i.test(k)), 'the save format did not change');
      data.nodes = [{id: 'object-161', regrow: 20}, {id: 'object-86', regrow: 20}];
      game.restore(data);
      const ore = game.world.objects.find(o => o.id === 'object-161'), tree = game.world.objects.find(o => o.id === 'object-86');
      ok(ore.type === 'ore' && ore.x === 319 && ore.y === 261 && ore.harvested, 'same vein'); ok(tree.type === 'tree' && tree.x === 988 && tree.y === 947 && tree.harvested, 'same tree'); equal(game.player.level, 7);
    });
    test('Saved games: standing where a new neighbor lives only moves you to the village', () => {
      const p = fixture('gero', true); p.level = 7; p.xp = 0; const gaucho = npc('El Gaucho'); const data = JSON.parse(JSON.stringify(game.snapshot()));
      data.player.x = gaucho.x; data.player.y = gaucho.y; game.restore(data);
      equal(game.player.level, 7); ok(!Z.collides(game.world, game.player.x, game.player.y, 8), 'player is free to walk');
    });
    test('The village has neighbors and every requested animal', () => {
      fixture('gero', true); const count = species => game.world.npcs.filter(n => n.species === species).length;
      ok(people().length >= 16, 'neighbors'); ok(count('horse') >= 3 && count('chicken') >= 5 && count('cat') >= 3 && count('dog') >= 3, 'animals');
    });
    test('Each neighbor has their own clothes, not a playable skin', () => {
      fixture('gero', true); const list = people(), shot = draw => { const cv = document.createElement('canvas'); cv.width = cv.height = 64; const c = Z.Pixel.install(cv.getContext('2d')); draw(c); return cv.toDataURL(); };
      ok(list.every(n => !n.characterId), 'no neighbor borrows a character'); equal(new Set(list.map(n => JSON.stringify(n.look))).size, list.length, 'different looks');
      const skins = new Set(Z.CHARACTERS.map(ch => shot(c => Z.drawCharacter(c, {x: 32, y: 54, characterId: ch.id, dir: 'down'}, 1))));
      const seen = list.map(n => shot(c => Z.drawNpc(c, {...n, x: 32, y: 54, dir: 'down', moving: false}, 1)));
      equal(new Set(seen).size, list.length, 'different sprites'); ok(seen.every(image => !skins.has(image)), 'no sprite equals a playable one');
    });
    test('The gaucho drinks mate with his horse and says the exact line', () => {
      fixture('gero', true); const gaucho = npc('El Gaucho'), horse = npc('Malacara');
      ok(gaucho.static && horse.static && horse.saddle && distance2(gaucho, horse) < 60, 'gaucho next to his saddled horse');
      standNear(gaucho); equal(Z.nearbyInteractable(game.world, game.player.x, game.player.y, 46, game.player), gaucho);
      game.interact(); advance(.1); equal(game.cutscene.id, 'talk'); equal(game.cutscene.line.speaker, 'El Gaucho'); equal(game.cutscene.line.text, GAUCHO_LINE);
    });
    test('The mate sound plays once, when the text reaches it', () => {
      fixture('gero', true); standNear(npc('El Gaucho')); const played = [], play = game.sound.play; game.sound.play = kind => played.push(kind);
      try { game.interact(); advance(1); equal(played.includes('mate'), false, 'too early'); advance(3); equal(played.filter(k => k === 'mate').length, 1, 'once'); } finally { game.sound.play = play; }
    });
    test('A talk freezes the world until you dismiss it, and frees the player afterwards', () => {
      const p = fixture('gero', true), rosa = npc('Doña Rosa'); standNear(rosa); const clock = p.playTime; p.moving = true;
      game.interact(); advance(.5); near(p.playTime, clock, 'the clock stops'); equal(p.moving, false); const line = game.cutscene.line.text; equal(line, rosa.lines[0]);
      game.advanceCutscene(); ok(game.cutscene, 'first press only completes the text'); near((game.cutscene.t - game.cutscene.line.at) * Z.CUTSCENE_CPS, line.length);
      game.advanceCutscene(); equal(game.cutscene, null); equal(game.cutsceneFade, 0); const before = p.playTime; advance(.2); ok(p.playTime > before, 'time runs again');
    });
    test('Lines take turns and start over', () => {
      fixture('gero', true); const n = npc('Tito'); standNear(n);
      for (const expected of [...n.lines, n.lines[0]]) { game.interact(); advance(.1); equal(game.cutscene.line.text, expected); game.finishCutscene(); n.x = n.homeX; n.y = n.homeY; standNear(n); }
    });
    test('Chickens treat Pepe with respect; other characters get the regular lines', () => {
      fixture('pepe', true); const hen = npc('Turuleca'); standNear(hen); game.interact(); advance(.1); ok(hen.linesFor.pepe.includes(game.cutscene.line.text), 'Pepe'); game.finishCutscene();
      fixture('gero', true); const other = npc('Turuleca'); standNear(other); game.interact(); advance(.1); ok(other.lines.includes(game.cutscene.line.text), 'Gero');
    });
    test('Whoever you talk to turns to face you', () => {
      const p = fixture('gero', true), n = npc('Juli'); Object.assign(p, {x: n.x + 22, y: n.y}); game.biome = 'village'; game.interact(); advance(.1);
      equal(game.cutscene.speaker, 'Juli'); equal(n.dir, 'right'); equal(p.dir, 'left'); equal(n.moving, false);
    });
    test('A neighbor only beats a place when closer, and never beats pickups, gathering or the smith', () => {
      const p = fixture('gero', true), stall = game.world.objects.find(o => o.type === 'stall'), near2 = (x, y, who = p) => Z.nearbyInteractable(game.world, x, y, 46, who);
      equal(near2(640, 1222), stall, 'buying'); equal(near2(668, 1225), npc('Tito'), 'talking');
      const bow = game.world.pickups.find(i => i.type === 'bow'), dog = npc('Chicho'); dog.x = bow.x + 9; dog.y = bow.y; equal(near2(bow.x, bow.y), bow, 'pickup first');
      dog.x = dog.homeX; dog.y = dog.homeY; equal(near2(dog.x, dog.y + 16), dog, 'dog alone'); ok(near2(dog.x, dog.y + 16, {gather: {id: 1}, axe: 0}) !== dog, 'gathering is not interrupted');
      equal(npc('El Herrero').lines, undefined); equal(near2(1062, 1476).type, 'forge', 'the smith keeps his shop');
    });
    test('Every neighbor starts on free ground in the village and cannot reach the respawn point', () => {
      fixture('gero', true); const w = game.world;
      for (const n of game.world.npcs) { if (n.kind === 'smith') continue; const r = n.radius || 9; equal(Z.biomeAt(n.x, n.y), n.zone || 'village', n.name); ok(!Z.collides(w, n.x, n.y, r, n.id), n.name + ' starts stuck');
        if (n.zone) continue;
        if (n.static) { ok(Math.hypot(n.x - w.spawn.x, n.y - w.spawn.y) > r + 11, n.name + ' on spawn'); continue; }
        const [rx, ry] = n.roam || [65, 55], dx = Math.max(0, Math.abs(n.homeX - w.spawn.x) - rx), dy = Math.max(0, Math.abs(n.homeY - w.spawn.y) - ry); ok(Math.hypot(dx, dy) > r + 11, n.name + ' can step on spawn'); }
    });
    test('Wandering keeps everyone in the village, near home and out of solid objects', () => {
      fixture('gero', true); const w = game.world, p = game.player; Object.assign(p, w.spawn);
      for (let i = 0; i < 900; i++) { game.time += 1 / 15; game.updateNpcs(1 / 15); }
      const moved = w.npcs.filter(n => !n.static && n.kind !== 'smith' && (n.x !== n.homeX || n.y !== n.homeY)); ok(moved.length > 20, 'most of them walked: ' + moved.length);
      for (const n of w.npcs) { if (n.kind === 'smith') continue; const r = n.radius || 9, [rx, ry] = n.roam || [65, 55]; equal(Z.biomeAt(n.x, n.y), n.zone || 'village', n.name); ok(!Z.collides(w, n.x, n.y, r, n.id), n.name + ' got stuck');
        if (!n.static) ok(Math.abs(n.x - n.homeX) <= rx + 4 && Math.abs(n.y - n.homeY) <= ry + 4, n.name + ' wandered off'); else ok(n.x === n.homeX && n.y === n.homeY, n.name + ' must stay'); }
    });
    test('No animal or neighbor can trap the player, not even a horse', () => {
      fixture('gero', true); const w = game.world, p = game.player;
      for (const name of ['Zaino', 'Moro', 'Chicho', 'Turuleca', 'Michi', 'Don Ramón']) {
        const n = npc(name), guard = Math.max(20, (n.radius || 9) + 11) + 2; let placed = false;
        for (let a = 0; a < 6.28 && !placed; a += .4) { const x = n.x + Math.cos(a) * guard, y = n.y + Math.sin(a) * guard; if (!Z.collides(w, x, y, 8)) { Object.assign(p, {x, y}); placed = true; } }
        ok(placed, name + ': free spot');
        for (let i = 0; i < 300; i++) { game.time += 1 / 15; game.updateNpcs(1 / 15); ok(!Z.collides(w, p.x, p.y, 8), name + ' stepped onto the player'); }
      }
    });
    test('Everything they say can be drawn and fits in the dialog box, even on a phone', () => {
      fixture('gero', true); const widths = [Math.min(640 - 32, 470) - 28, Math.min(350 - 32, 470) - 28];
      for (const n of talkers()) {
        ok(n.label && n.lines.length >= 2, n.name + ' has a hint and lines');
        for (const ch of Array.from(n.name.toUpperCase())) ok(Z.Pixel.hasGlyph(ch, 8), 'name glyph ' + ch);
        for (const line of [...n.lines, ...Object.values(n.linesFor || {}).flat()]) {
          for (const ch of Array.from(line)) ok(Z.Pixel.hasGlyph(ch), 'glyph ' + ch + ' in ' + line);
          for (const width of widths) { const rows = Z.dialogLines(line, width); equal(rows.join(' '), line, 'rows keep the text'); ok(rows.length <= 3, 'too long: ' + line); ok(rows.every(r => Z.Pixel.textWidth(r, 9) <= width), 'too wide: ' + line); }
        }
      }
      ok(Z.dialogLines(GAUCHO_LINE, widths[0]).some(row => row.includes('*ruido de mate*')), 'the punchline is not split');
    });
    function distance2(a, b) { return Math.hypot(a.x - b.x, a.y - b.y); }

    // Mer y Madre tierra.
    test('Madre tierra summons three spirits for 7 s and waits 45 s', () => {
      const p = fixture('mer'); game.ability();
      equal(game.spirits.length, 3); near(p.abilityCooldown, 45);
      advance(6.9); equal(game.spirits.length, 3); advance(.2); equal(game.spirits.length, 0);
      game.ability(); equal(game.spirits.length, 0, 'still on cooldown');
      advance(38); game.ability(); equal(game.spirits.length, 3);
    });
    test('Each spirit hits twice per second for 150% of Mer damage, without knockback', () => {
      const p = fixture('mer'), dog = enemy('dog', p.x + 40); dog.stun = 30; dog.stats.armor = 0; dog.hp = dog.maxHp = 1e6;
      const each = game.spiritDamage(), s = game.stats(), w = Z.WEAPON_TYPES[p.weapon];
      near(each, s.power * w.damageMultiplier * s.damageMultiplier * game.weaponLevelMultiplier() * 1.5, 'x1.5');
      const x = dog.x, y = dog.y; game.ability(); advance(3);
      near(dog.hp, 1e6 - 3 * 6 * each, 'six hits per spirit in 3 s'); near(dog.x, x, 'no knockback'); near(dog.y, y);
      advance(5); near(dog.hp, 1e6 - 3 * 14 * each, '14 hits per spirit in 7 s'); equal(game.spirits.length, 0);
    });
    test('Spirits spread over the nearby enemies and leave the far ones alone', () => {
      const p = fixture('mer'), list = [40, -40, 0].map((dx, i) => enemy('thief', p.x + dx, p.y + (i === 2 ? 45 : 0))), far = enemy('thief', p.x + 400);
      for (const e of [...list, far]) { e.stun = 30; e.hp = e.maxHp = 1e6; }
      game.ability(); advance(2); ok(list.every(e => e.hp < 1e6), 'each nearby enemy gets hit'); equal(far.hp, 1e6, 'far one untouched');
    });
    test('Spirits follow Mer, enemies never see them and they leave with a knockout', () => {
      const p = fixture('mer'); game.ability(); advance(.5); p.x += 300; advance(1);
      ok(game.spirits.every(s => distance2(s, {x: p.x, y: p.y - 14}) < 40), 'they follow her');
      ok(game.spirits.every(s => !game.enemies.includes(s)), 'they are not enemies');
      const thief = enemy('thief', p.x + 15); advance(.3); ok(thief.alert, 'the thief chases Mer'); game.knockout('thief'); equal(game.spirits.length, 0);
    });
    test('Snakes ignore Mer until she or her spirits hit them; fire burns her 50% more', () => {
      const p = fixture('mer'), snake = enemy('snake', p.x + 60); advance(.2); equal(snake.alert, false, 'ignored');
      game.hitEnemy(snake, 1); advance(.1); equal(snake.alert, true, 'provoked');
      game.burnPlayer(2); equal(p.burn.damage, 3); fixture('gero'); game.burnPlayer(2); equal(game.player.burn.damage, 2);
    });
    test('A Mer save keeps the 45 s cooldown and loads without spirits', () => {
      fixture('mer', true); game.ability(); advance(1); const save = JSON.parse(JSON.stringify(game.snapshot()));
      game.newGame('tena'); game.restore(save, 1); equal(game.player.characterId, 'mer'); ok(game.player.abilityCooldown > 43, 'cooldown kept');
      equal(game.spirits.length, 0); const old = JSON.parse(JSON.stringify(save)); old.player.characterId = 'gero'; old.player.abilityCooldown = 40;
      game.restore(old, 1); near(game.player.abilityCooldown, 30, 'other characters keep the old limit');
    });

    // v2.19: consumibles, amuletos, pedidos, pesca y la dimensión ampliada.
    const realm = (spot, biome) => { const p = fixture('gero', true); game.travel(spot, biome); game.state = 'playing'; Object.assign(p, {level: 10, hp: 1e6}); p.stats.health = 1e6; game.refreshEnemyStats(); return p; };
    const pondNear = () => { const pond = game.world.objects.find(o => o.type === 'pond' && o.label === 'Laguna de las Libélulas'); Object.assign(game.player, {x: pond.x + pond.w / 2, y: pond.y + pond.h + 14}); game.biome = 'village'; return pond; };
    test('Fishing: E casts, a bite must be answered in time, and moving lifts the line', () => {
      const p = fixture('gero', true); pondNear(); equal(Z.nearbyInteractable(game.world, p.x, p.y, 46, p) && Z.nearbyInteractable(game.world, p.x, p.y, 46, p).type === 'pond', false, 'no rod, no fishing');
      p.rod = true; game.world.npcs = game.world.npcs.filter(n => n.name !== 'Don Chiche'); equal(Z.nearbyInteractable(game.world, p.x, p.y, 46, p).type, 'pond');
      Math.random = () => .5; game.interact(); ok(p.fishing, 'line cast'); advance(p.fishing.bite + .05); ok(p.fishing.bit, 'it bites');
      game.interact(); equal(p.fishing, null); equal(game.itemCount('pejerrey'), 1, '.5 → pejerrey');
      game.interact(); advance(p.fishing.bite + 1.4); equal(p.fishing, null, 'it got away'); equal(game.itemCount('pejerrey'), 1);
      game.interact(); advance(.5); game.keys.add('d'); advance(.1); game.keys.clear(); equal(p.fishing, null, 'walking lifts the line');
    });
    test('The Dorado is exactly a 5% catch', () => {
      fixture('gero'); const rolls = [[0, 'dorado'], [.0499, 'dorado'], [.05, 'bagre'], [.2499, 'bagre'], [.25, 'pejerrey'], [.5999, 'pejerrey'], [.6, 'mojarra'], [.9999, 'mojarra']];
      for (const [r, fish] of rolls) { Math.random = () => r; equal(game.catchFish(), fish, 'roll ' + r); }
    });
    test('The Dorado cures everything, gives 3 s without damage and 5 s of endless stamina', () => {
      const p = fixture('gero'), max = game.stats().maxHealth; game.addItem('dorado', 1);
      Object.assign(p, {hp: 5, stamina: 0, exhausted: 6, slow: 3, heavySlow: 2, stunned: 1, frozen: 1, poison: {time: 5, tick: 1, damage: 3}, bleed: {time: 5, tick: 1, damage: 5}, burn: {time: 5, tick: 1, damage: 2}});
      ok(game.useItem('dorado').ok); near(p.hp, max); equal(p.stamina, 1); equal(p.exhausted, 0);
      ok(!p.poison && !p.bleed && !p.burn && !p.slow && !p.heavySlow && !p.stunned && !p.frozen, 'no ailments left');
      equal(game.hurtPlayer(50, 'thief'), false, 'immune'); equal(game.hurtPlayer(50, 'snake', true), false, 'poison too'); near(p.hp, max);
      game.keys.add('d'); game.keys.add('Shift'); advance(2.9); equal(p.stamina, 1, 'running does not tire'); game.keys.clear();
      equal(game.hurtPlayer(50, 'thief'), false, 'still immune at 2.9 s'); advance(.2); ok(game.hurtPlayer(50, 'thief'), 'damage again after 3 s');
      p.rollCooldown = 0; ok(game.roll()); equal(p.stamina, 1, 'rolling is free'); advance(2); equal(p.buffs.dorado, 0, 'endless stamina lasts 5 s');
      p.rollCooldown = 0; p.roll = 0; game.roll(); ok(p.stamina < 1, 'rolling costs again');
    });
    test('Consumables: holy water, bandages, choripán, wine and mate con yuyos', () => {
      const p = fixture('gero'), max = game.stats().maxHealth;
      for (const id of ['water', 'bandage', 'choripan', 'wine', 'mateyuyos']) game.addItem(id, 2);
      game.burnPlayer(3); ok(p.burn); game.useItem('water'); equal(p.burn, null); game.burnPlayer(3); equal(p.burn, null, 'fireproof'); advance(10.1); game.burnPlayer(3); ok(p.burn, 'fire again after 10 s'); p.burn = null;
      p.bleed = {time: 5, tick: 1, damage: 5}; p.hp = 50; game.useItem('bandage'); equal(p.bleed, null); near(p.hp, 60);
      const strength = game.stats().strength; game.useItem('choripan'); near(game.stats().strength, strength * 1.2); advance(45.1); near(game.stats().strength, strength);
      const armor = game.stats().armor; game.useItem('wine'); near(game.stats().armor, armor + 3); advance(40.1); near(game.stats().armor, armor);
      p.hp = 10; p.stamina = .1; game.useItem('mateyuyos'); equal(p.stamina, 1); advance(10.05); near(p.hp, 10 + max * .4, 'heals 40% in 10 s');
      equal(game.itemCount('water'), 1); for (let i = 0; i < 20; i++) game.addItem('water', 1); equal(game.itemCount('water'), Z.ITEM_STACK, 'bag holds 10 of each');
    });
    test('The return scroll takes you to the square, but not out of Zak’s dimension', () => {
      const p = realm({x: 1800, y: 3060}, 'library'); game.addItem('scroll', 2);
      equal(game.useItem('scroll').ok, false); equal(game.itemCount('scroll'), 2, 'not spent');
      game.travel({x: 300, y: 300}, 'cave'); ok(game.useItem('scroll').ok); equal(game.biome, 'village'); equal(p.x, game.world.spawn.x); equal(game.itemCount('scroll'), 1);
    });
    test('A firecracker stuns common enemies around it, but not bosses', () => {
      const p = fixture('gero'); p.dir = 'right'; const thief = enemy('thief', p.x + 110, p.y), boss = enemy('capo', p.x + 120, p.y + 20), far = enemy('thief', p.x + 300, p.y);
      for (const e of [thief, boss, far]) { e.hp = e.maxHp = 1e5; e.cooldown = 99; e.stats.moveSpeed = 0; e.special = 99; e.rainCd = 99; }
      game.addItem('firecracker', 1); game.useItem('firecracker'); equal(game.itemCount('firecracker'), 0); advance(.75);
      ok(thief.stun > 1.3 && thief.hp < 1e5, 'thief stunned and hurt'); ok(!(boss.stun > 0) && boss.hp < 1e5, 'boss hurt, not stunned'); equal(far.hp, 1e5);
    });
    test('Amulets: the Yarará fang stops poison, the Capo ring pays 25% more and slots limit how many you wear', () => {
      const p = fixture('gero'); game.grantAmulet('fang'); ok(Z.hasAmulet(p, 'fang'), 'first amulet is worn right away'); game.poisonPlayer(5); equal(p.poison, null);
      game.grantAmulet('ring'); equal(Z.hasAmulet(p, 'ring'), false, 'only one slot'); equal(game.equipAmulet('ring').ok, false);
      game.unequipAmulet('fang'); ok(game.equipAmulet('ring').ok); game.poisonPlayer(5); ok(p.poison, 'poison again without the fang'); p.poison = null;
      Math.random = () => 0; const thief = enemy('thief'); thief.hp = 1; game.hitEnemy(thief, 999, true);
      const def = Z.ENEMY_TYPES.thief, base = def.coins[0] + Math.floor((thief.level - 1) / 2), total = game.drops.reduce((sum, d) => sum + d.value, 0); equal(total, Math.floor(base * 1.25));
      p.amuletSlots = 2; ok(game.equipAmulet('fang').ok); ok(Z.hasAmulet(p, 'fang') && Z.hasAmulet(p, 'ring'), 'two slots');
    });
    test('The Virgin medal heals 1 per second after 5 s without damage', () => {
      const p = fixture('gero'); game.grantAmulet('medal'); p.hp = 50; game.hurtPlayer(1, 'thief'); const hurt = p.hp;
      advance(4.9); near(p.hp, hurt, 'nothing before 5 s'); advance(1.2); near(p.hp, hurt + 1); advance(2); near(p.hp, hurt + 3);
    });
    test('Ten pets to the horses give the Herradura de Zaino; the Cerbero eye replaces the torch', () => {
      const p = fixture('gero', true), zaino = npc('Zaino'); for (let i = 0; i < 9; i++) game.petHorse(zaino); equal(game.hasAmuletOwned('horseshoe'), false); game.petHorse(zaino); ok(game.hasAmuletOwned('horseshoe'));
      const stairs = game.world.objects.find(o => o.type === 'stairs' && o.to === 'cave2'); game.enemies.find(e => e.type === 'capo').dead = true; p.torch = false;
      equal(game.takeStairs(stairs), false, 'no torch'); p.amulets.push('eye'); p.equipped = ['eye']; ok(game.takeStairs(stairs), 'the eye sees in the dark');
    });
    test('Requests: kills count only after accepting, deliveries take the goods and pay', () => {
      const p = fixture('gero'); const kill = () => { const t = enemy('thief'); t.hp = 1; game.hitEnemy(t, 999, true); };
      kill(); equal(game.requestState('funes'), 'new'); ok(game.acceptRequest('funes').ok); equal(game.acceptRequest('funes').ok, false);
      for (let i = 0; i < 9; i++) kill(); equal(game.requestProgress('funes').ready, false); equal(game.completeRequest('funes').ok, false);
      kill(); ok(game.requestProgress('funes').ready); const coins = p.coins; ok(game.completeRequest('funes').ok); equal(p.coins, coins + 150); equal(game.itemCount('firecracker'), 3); equal(game.requestState('funes'), 'done');
      game.acceptRequest('tito'); p.materials.wood = 25; ok(game.completeRequest('tito').ok); equal(p.materials.wood, 5); equal(game.itemCount('choripan'), 3);
      game.acceptRequest('ines'); for (let i = 0; i < 8; i++) { const s = enemy(i % 2 ? 'archer' : 'skeleton'); s.hp = 1; game.hitEnemy(s, 999, true); } ok(game.completeRequest('ines').ok); ok(game.hasAmuletOwned('medal'), 'Sor Inés gives the medal');
    });
    test('A neighbor with a request opens their menu when the talk ends; one without keeps just talking', () => {
      fixture('gero', true); const events = []; game.onEvent = (type, d) => events.push([type, d]);
      standNear(npc('Tito')); game.interact(); advance(.1); game.finishCutscene(); ok(events.some(([t, d]) => t === 'npc' && d.npc.name === 'Tito'), 'menu after the talk');
      events.length = 0; standNear(npc('Juli')); game.interact(); advance(.1); game.finishCutscene(); ok(!events.some(([t]) => t === 'npc'), 'Juli only talks');
      game.player.requests.tito = {state: 'done', count: 0}; equal(game.npcHasMenu(npc('Tito')), false, 'after the request, back to talking');
      ok(game.npcHasMenu(npc('El Gaucho')) && game.npcHasMenu(npc('Don Chiche')), 'the gaucho and Don Chiche always sell something');
    });
    test('Shops: El Almacén, the gaucho, Don Chiche and the void merchant', () => {
      const p = fixture('gero', true); p.coins = 20000;
      ok(game.buy('water').ok); equal(game.itemCount('water'), 1); for (let i = 0; i < 12; i++) game.buy('water'); equal(game.itemCount('water'), 10); equal(game.buy('water').ok, false, 'full bag');
      const gaucho = npc('El Gaucho'), chiche = npc('Don Chiche'), merchant = game.world.npcs.find(n => n.shop === 'merchant');
      ok(game.npcTrade(gaucho, 'buy:mateyuyos').ok); equal(game.itemCount('mateyuyos'), 1);
      ok(game.npcTrade(chiche, 'rod').ok); ok(p.rod); equal(game.npcTrade(chiche, 'rod').ok, false, 'one rod');
      game.addItem('dorado', 1); const coins = p.coins; ok(game.npcTrade(chiche, 'sell:dorado').ok); equal(p.coins, coins + Z.ITEMS.dorado.price); equal(game.itemCount('dorado'), 0);
      const points = p.points; ok(game.npcTrade(merchant, 'stardust').ok); equal(p.points, points + 1); equal(game.npcOffers(merchant).find(o => o.id === 'stardust').cost.coins, 750, 'each one costs more');
      ok(game.npcTrade(merchant, 'slot').ok); equal(p.amuletSlots, 2);
      equal(game.npcTrade(merchant, 'amulet:eye').ok, false, 'needs an Ojo del alma and crystals'); p.offerings.eye = 1; p.materials.arcane = 8; ok(game.npcTrade(merchant, 'amulet:eye').ok); ok(Z.hasAmulet(p, 'eye')); equal(p.offerings.eye, 0); equal(p.materials.arcane, 0);
      const vs = game.world.objects.find(o => o.type === 'voidstall'), events = []; game.onEvent = (type, d) => events.push([type, d]); Object.assign(p, {x: vs.x + vs.w / 2, y: vs.y + vs.h + 12}); game.biome = 'bazaar'; game.interact(); ok(events.some(([t, d]) => t === 'npc' && d.npc === merchant), 'the stall opens the merchant');
    });
    test('The smith makes firecrackers and carves the Yarará fang', () => {
      const p = fixture('gero'); p.coins = 500; p.materials.coal = 4; p.materials.gold = 5; p.offerings.fang = 3;
      ok(game.craft('item:firecracker').ok); ok(game.craft('item:firecracker').ok); equal(game.itemCount('firecracker'), 2); equal(game.craft('item:firecracker').ok, false, 'out of coal');
      ok(game.craft('amulet:fang').ok); ok(game.hasAmuletOwned('fang')); equal(p.offerings.fang, 0); equal(game.craft('amulet:fang').ok, false, 'only once');
    });
    test('The imp splits in three: copies vanish in one hit and give nothing', () => {
      const p = fixture('gero'), imp = enemy('imp', p.x + 60); imp.hp = imp.maxHp = 500; advance(1);
      const copies = game.enemies.filter(e => e.illusion && !e.dead); equal(copies.length, 2); ok(copies.every(c => c.hp === imp.hp && c.maxHp === imp.maxHp), 'copies look the same');
      const coins = game.drops.length, kills = p.kills, xp = p.xp; game.hitEnemy(copies[0], 1); ok(copies[0].dead); equal(game.drops.length, coins); equal(p.kills, kills); equal(p.xp, xp);
      imp.hp = 1; game.hitEnemy(imp, 999, true); advance(.1); ok(copies[1].dead, 'the other copy goes with it');
    });
    test('Gargoyles are stone until you come close or hit them', () => {
      const p = fixture('gero'), g = enemy('gargoyle', p.x + 200); advance(.5); game.hitEnemy(g, 50, true); equal(g.hp, g.maxHp, 'stone takes no damage');
      advance(.1); equal(g.statue, false, 'the hit wakes it up'); advance(1); game.hitEnemy(g, 50, true); near(g.hp, g.maxHp - 50);
      const g2 = enemy('gargoyle', p.x + 70); advance(.2); equal(g2.statue, false, 'walking close wakes it up');
    });
    test('A Zak shadow copies your last attack', () => {
      const p = fixture('gero'), sh = enemy('shadow', p.x + 40); sh.cooldown = 99; advance(.3); const hp = p.hp;
      p.attackCooldown = 0; game.attack([1, 0]); advance(.2); ok(sh.act && sh.act.id === 'mimic', 'it copies'); advance(.5); ok(p.hp < hp, 'the copy hurts');
    });
    test('Runes: a lit one explodes, a dark one gives +15% damage', () => {
      const p = realm({x: 600, y: 3000}, 'magic'); game.enemies = []; const rune = game.world.objects.find(o => o.type === 'rune' && Z.biomeAt(o.x, o.y) === 'magic');
      p.hp = 100; p.stats.health = 100; const step = () => { Object.assign(p, {x: rune.x + rune.w / 2, y: rune.y + rune.h / 2}); game.updateRealm(0); };
      game.time = Z.RUNE_CYCLE * 10 - (rune.phase || 0) + .5; step(); ok(p.hp < 100, 'lit: it explodes'); const after = p.hp; step(); near(p.hp, after, 'then it rests');
      rune.rest = 0; game.time = Z.RUNE_CYCLE * 20 - (rune.phase || 0) + 3; p.buffs.rune = 0; step(); ok(p.buffs.rune > 0, 'dark: +15% damage');
    });
    test('Tents: a mimic, nothing or loot, and then a 5 minute wait', () => {
      const p = realm({x: 600, y: 3000}, 'magic'); game.enemies = []; const tent = game.world.objects.find(o => o.type === 'tent' && !o.decor);
      Object.assign(p, {x: tent.x + tent.w / 2, y: tent.y + tent.h + 10}); equal(Z.nearbyInteractable(game.world, p.x, p.y, 46, p), tent);
      Math.random = () => .1; equal(game.searchTent(tent), 'mimic'); ok(game.enemies.some(e => e.type === 'mimic' && e.summoned)); ok(Z.nearbyInteractable(game.world, p.x, p.y, 46, p) !== tent, 'searched tents wait');
      tent.searched = 0; Math.random = () => .3; equal(game.searchTent(tent), 'empty');
      tent.searched = 0; let n = 0; Math.random = () => [.9, .4][n++ % 2]; equal(game.searchTent(tent), 'water'); equal(game.itemCount('water'), 1);
      const mimic = game.enemies.find(e => e.type === 'mimic'); mimic.hp = 1; game.drops = []; Math.random = original.random; game.hitEnemy(mimic, 999, true); ok(game.drops.length > 0, 'the mimic drops coins');
    });
    test('Holy water puts out a campfire; a nearby mage relights it faster', () => {
      const p = realm({x: 600, y: 3000}, 'magic'), fire = game.world.objects.find(o => o.type === 'campfire'); game.enemies = [];
      Object.assign(p, {x: fire.x + fire.w / 2, y: fire.y + 30}); ok(Z.nearbyInteractable(game.world, p.x, p.y, 46, p) !== fire, 'without water you cannot');
      game.addItem('water', 1); equal(Z.nearbyInteractable(game.world, p.x, p.y, 46, p), fire); game.interact(); equal(game.itemCount('water'), 0); equal(fire.out, Z.FIRE_OUT);
      Object.assign(p, {x: fire.x + fire.w / 2, y: fire.y + fire.h / 2}); game.updateCampfires(); equal(p.burn, null, 'a dead fire does not burn');
      game.updateRealm(10); near(fire.out, Z.FIRE_OUT - 10); const mage = enemy('mage', fire.x + 30, fire.y); mage.stun = 99; game.updateRealm(5); near(fire.out, Z.FIRE_OUT - 30, 'four times faster');
      game.updateRealm(20); equal(fire.out, 0); game.updateCampfires(); ok(p.burn, 'lit again');
    });
    test('The new zones: the Feria is safe, the rest is Zak’s dimension and every spawn has room', () => {
      fixture('gero', true); const w = game.world;
      equal(Z.biomeAt(1800, 2700), 'gargoyles'); equal(Z.biomeAt(1800, 3100), 'library'); equal(Z.biomeAt(1800, 3500), 'bazaar'); equal(Z.biomeAt(1100, 3500), 'sanctum'); equal(Z.biomeAt(1100, 2700), 'magic');
      ok(Z.isSafe('bazaar') && !Z.isSafe('library') && !Z.isSafe('gargoyles')); ok(['gargoyles', 'library', 'bazaar'].every(Z.isZakDimension));
      for (const s of w.enemySpawns.filter(s => s.id.startsWith('realm-'))) { ok(!Z.collides(w, s.x, s.y, 7), s.id + ' stuck'); ok(['gargoyles', 'library'].includes(Z.biomeAt(s.x, s.y)), s.id + ' zone'); }
      for (const [x, y] of [[1190, 2830], [1190, 3500], [1800, 2957], [1800, 3317]]) ok(!Z.collides(w, x, y, 8), 'passage at ' + x + ',' + y);
      equal(w.npcs.filter(n => n.zone === 'bazaar').length, 8); ok(w.npcs.some(n => n.zone === 'sanctum'), 'a soul in the Sanctuary');
    });
    test('Saves keep the bag, amulets, requests and rod; a v2.18 save loads with everything empty', () => {
      const p = fixture('gero', true); game.addItem('dorado', 1); game.addItem('water', 3); game.grantAmulet('fang'); game.acceptRequest('funes'); p.requests.funes.count = 4; p.rod = true; p.materials.arcane = 7; p.buffs.chori = 20; p.amuletSlots = 2; p.stardust = 2;
      const save = JSON.parse(JSON.stringify(game.snapshot())); game.newGame('tena'); game.restore(save, 1); const q = game.player;
      equal(game.itemCount('dorado'), 1); equal(game.itemCount('water'), 3); ok(Z.hasAmulet(q, 'fang')); equal(q.requests.funes.count, 4); equal(q.rod, true); equal(q.materials.arcane, 7); near(q.buffs.chori, 20); equal(q.amuletSlots, 2); equal(q.stardust, 2);
      const old = JSON.parse(JSON.stringify(save)); for (const k of ['items', 'selectedItem', 'amulets', 'equipped', 'amuletSlots', 'requests', 'rod', 'horsePets', 'invuln', 'calm', 'fishing', 'stardust']) delete old.player[k];
      delete old.player.materials.arcane; old.player.buffs = {gero: 0, pepe: 0, paco: 0, pacoAnimals: 0, mate: 3};
      game.restore(old, 1); const r = game.player; equal(Object.keys(r.items).length, 0); equal(r.amulets.length, 0); equal(r.amuletSlots, 1); equal(r.rod, false); equal(r.materials.arcane, 0); near(r.buffs.mate, 3); equal(r.buffs.chori, 0);
      const bad = JSON.parse(JSON.stringify(save)); bad.player.items = {water: 999, nope: 4}; bad.player.equipped = ['ring']; bad.player.requests = {funes: {state: 'active', count: 9999}, fake: {state: 'done'}};
      game.restore(bad, 1); equal(game.itemCount('water'), Z.ITEM_STACK); equal(game.player.items.nope, undefined); equal(Z.hasAmulet(game.player, 'ring'), false, 'cannot wear what you do not own'); equal(game.player.requests.funes.count, 10); equal(game.player.requests.fake, undefined);
    });

    test('v2.20: the smith makes armors in order and they cut the damage of each hit', () => {
      const p = fixture('gero'); p.coins = 5000; Object.assign(p.materials, {wood: 25, iron: 25, gold: 35, diamond: 30}); p.offerings.elemental = 3;
      const opt = () => game.craftOptions().find(o => o.id === 'armor');
      equal(opt().name, 'Armadura de madera'); p.stats.endurance = 100; const hp = p.hp; game.hurtPlayer(10, 'thief'); near(hp - p.hp, 10, 'endurance does not protect');
      for (const name of ['wood', 'iron', 'gold', 'diamond', 'elemental']) { ok(game.craft('armor').ok, name); equal(Z.ARMORS[p.armorTier].id, name); }
      equal(opt().done, true); equal(game.craft('armor').ok, false, 'nothing above elemental'); equal(p.offerings.elemental, 0);
      const before = p.hp; game.hurtPlayer(20, 'thief'); near(before - p.hp, 7, '20 - 13 of armor');
      const save = JSON.parse(JSON.stringify(game.snapshot())); game.newGame('tena'); game.restore(save, 1); equal(game.player.armorTier, 5, 'saved');
      delete save.player.armorTier; game.restore(save, 1); equal(game.player.armorTier, 0, 'old saves start without armor');
    });

    // v2.21: compañeros, lluvia, medallas, Zak furioso y truco.
    const wild = id => game.world.npcs.find(n => n.id === id);
    const nearNpc = n => { Object.assign(game.player, {x: n.x, y: n.y + (n.radius || 7) + 10}); game.biome = Z.biomeAt(game.player.x, game.player.y); };
    const keepPet = id => { const p = game.player; p.pets[id] = {name: 'Prueba'}; p.pet = id; game.pet = null; return game.ensurePet(); };
    test('v2.21: old saves load with no companions, medals or truco and bad data is cleaned', () => {
      fixture('gero', true); const save = JSON.parse(JSON.stringify(game.snapshot()));
      for (const k of ['pets', 'pet', 'petProgress', 'carrying', 'petEats', 'medals', 'trucoWins', 'trucoLosses', 'trucoRematchWins', 'puddles', 'furyWins', 'zakFuryBest']) delete save.player[k];
      game.restore(save, 1); const r = game.player;
      equal(Object.keys(r.pets).length, 0); equal(r.pet, null); equal(r.carrying, null); equal(r.medals.length, 0); equal(r.trucoWins, 0); equal(r.puddles, 0);
      equal(r.petProgress.dog.fed, 0); equal(r.petProgress.snake.state, 'none'); equal(r.petProgress.golem.found, false);
      const bad = JSON.parse(JSON.stringify(save)); bad.player.pets = {dog: {name: '<b>Toby</b>'}, dragon: {name: 'x'}}; bad.player.pet = 'bat'; bad.player.carrying = 'dragon'; bad.player.medals = ['zak', 'nope', 'zak'];
      bad.player.petProgress = {dog: {fed: 99, next: 1e12}, snake: {state: 'carried', readyAt: 5}, golem: {found: true, x: 5, y: 5, given: {stone: 99}}};
      game.restore(bad, 1); const b = game.player;
      equal(b.pets.dog.name, 'bToby/b'); equal(b.pets.dragon, undefined); equal(b.pet, null, 'cannot follow you if you do not own it'); equal(b.medals.join(), 'zak');
      equal(b.petProgress.dog.fed, 5); equal(b.carrying, null, 'nothing in your arms without the state'); equal(b.petProgress.snake.state, 'hatched');
      equal(b.petProgress.golem.x, 1905, 'golemsín stays in Las Entrañas'); equal(b.petProgress.golem.given.stone, 2);
    });
    test('v2.21: the kennel, its dog and Doña Herminia stand on free ground and move no vein or tree', () => {
      const world = Z.createWorld(), dog = world.npcs.find(n => n.id === 'pet-wild-dog'), lady = world.npcs.find(n => n.name === 'Doña Herminia'), bat = world.npcs.find(n => n.id === 'pet-wild-bat');
      ok(world.objects.some(o => o.type === 'house' && o.label === 'La guardería')); equal(Z.biomeAt(dog.x, dog.y), 'village'); equal(Z.biomeAt(bat.x, bat.y), 'cave2');
      for (const n of [dog, lady, bat]) equal(Z.collides(world, n.x, n.y, 7, n.id), false, n.name + ' is not inside a wall');
      for (const [x, y] of Z.KENNEL.spots) equal(Z.collides({...world, npcs: []}, x, y, 7), false, 'kennel spot ' + x + ',' + y);
      const kennel = world.objects.find(o => o.label === 'La guardería'); ok(world.objects.indexOf(kennel) > world.objects.findIndex(o => o.type === 'ore' && o.ore === 'arcane'), 'added after everything else');
    });
    test('v2.21: the hungry dog eats five plates two minutes apart, licks you and follows you', () => {
      const p = fixture('gero', true), events = []; game.onEvent = (type, d) => events.push(type); const dog = wild('pet-wild-dog'); nearNpc(dog);
      equal(game.nearbyAction().label.includes('perro'), true); game.interact(); equal(game.cutscene.id, 'talk', 'without food it only looks at you'); game.finishCutscene();
      ok(game.shopItems().some(i => i.id === 'dogfood' && i.price === 15), 'El Almacén sells dog food'); p.coins = 100; ok(game.buy('dogfood').ok); game.addItem('dogfood', 4);
      equal(game.useItem('dogfood').ok, false, 'not for you');
      game.interact(); game.finishCutscene(); equal(p.petProgress.dog.fed, 1); equal(game.itemCount('dogfood'), 4);
      game.interact(); game.finishCutscene(); equal(p.petProgress.dog.fed, 1, 'still eating'); equal(game.itemCount('dogfood'), 4);
      for (let k = 2; k <= 4; k++) { p.playTime += 120; game.feedDog(dog); game.finishCutscene(); equal(p.petProgress.dog.fed, k); }
      p.playTime += 120; game.feedDog(dog); equal(game.cutscene.id, 'lick', 'the lick scene'); advance(0); game.update(1.3); ok(Math.hypot(dog.x - p.x, dog.y - p.y) < 40, 'the dog runs to you');
      game.finishCutscene(); ok(game.ownsPet('dog')); equal(p.pet, 'dog'); ok(game.pet && game.pet.id === 'dog'); ok(events.includes('namePet'));
      advance(.1); equal(wild('pet-wild-dog'), undefined, 'it left the kennel door');
      ok(game.namePet('dog', 'Firulais <3').ok); equal(game.petName('dog'), 'Firulais 3');
    });
    test('v2.21: the dog bites and every 13 s immobilizes an enemy for 3 s; bosses 1,5 s and Zak nothing', () => {
      const p = fixture('gero'); const pet = keepPet('dog'); pet.special = 0; Object.assign(pet, {x: p.x + 20, y: p.y});
      const thief = enemy('thief', p.x + 40); thief.cooldown = 9; const hp = thief.hp; advance(1.1);
      ok(thief.hp < hp, 'bites'); ok(thief.stun > 2.5 && thief.stun <= 3, 'immobilized 3 s'); ok(pet.special > 11, 'special every 13 s');
      thief.stun = 0; const before = thief.hp; advance(1.1); ok(thief.hp < before && !(thief.stun > 0), 'plain bites in between');
      game.enemies = []; const capo = enemy('capo', p.x + 30); pet.special = 0; game.petStrike(pet, capo); near(capo.stun, 1.5);
      const zak = enemy('zak', p.x + 30); pet.special = 0; game.petStrike(pet, zak); ok(!(zak.stun > 0), 'Zak is not immobilized');
    });
    test('v2.21: the baby bat needs full health, three times your blood, and then bleeds enemies', () => {
      const p = fixture('gero', true), bat = wild('pet-wild-bat'); nearNpc(bat); p.hp = 50;
      game.interact(); equal(game.cutscene.text, 'Un murciélago chiquito... el pobre parece tener hambre.'); game.finishCutscene();
      equal(game.feedBat().ok, false, 'needs full health');
      for (let k = 1; k <= 3; k++) { p.hp = game.stats().maxHealth; const r = game.feedBat(); ok(r.ok); equal(p.hp, 1, 'leaves you at 1'); }
      ok(game.ownsPet('bat')); equal(p.pet, 'bat');
      fixture('gero'); const pet = keepPet('bat'); pet.special = 0; Object.assign(pet, {x: game.player.x + 20, y: game.player.y}); const rat = enemy('thief', game.player.x + 35); rat.cooldown = 99; rat.stats.armor = 50;
      advance(.9); ok(rat.bleeding && rat.bleeding.time > 4, 'bleeding 5 s'); const hp = rat.hp; rat.stun = 99; Object.assign(pet, {x: rat.x + 400}); game.pet.clock = -99;
      advance(1.02); ok(rat.hp < hp, 'bleeding ignores armor'); advance(5); equal(rat.bleeding, null);
    });
    test('v2.21: damage order is bat < dog < snake < golemsín', () => {
      fixture('gero'); const d = id => game.petDamage(id);
      ok(d('bat') < d('dog') && d('dog') < d('snake') && d('snake') < d('golem'));
      const dps = id => d(id) / Z.PETS[id].every; ok(dps('bat') < dps('dog') && dps('dog') < dps('snake') && dps('snake') < dps('golem'), 'also per second');
    });
    test('v2.21: a golemsín appears 5% after the cave golem, throws 5-damage stones and takes the materials', () => {
      const p = fixture('gero', true); Math.random = () => .05; equal(game.maybeGolemsin({x: 1850, y: 2290, summoned: false}), false, 'exactly 5%');
      Math.random = () => 0; equal(game.maybeGolemsin({x: 1850, y: 2290, summoned: true}), false, 'not from Zak');
      ok(game.maybeGolemsin({x: 1850, y: 2290, summoned: false})); const g = wild('pet-wild-golem'); ok(g); equal(Z.biomeAt(g.x, g.y), 'cave3');
      Math.random = original.random; game.enemies = game.enemies.filter(e => e.biome !== 'cave3'); Object.assign(p, {x: g.x - 60, y: g.y}); game.biome = 'cave3'; p.armorTier = 5; p.stats.health = 400; p.hp = 400;
      advance(2.4); near(400 - p.hp, 5, 'one stone, ignoring 13 of armor'); advance(2); near(400 - p.hp, 10, 'one every 2 s');
      nearNpc(g); p.hp = 400; Object.assign(p.materials, {stone: 2, iron: 1}); game.interact(); game.finishCutscene();
      equal(p.petProgress.golem.given.stone, 2); equal(p.petProgress.golem.given.iron, 1); equal(game.ownsPet('golem'), false);
      Object.assign(p.materials, {iron: 1, gold: 2, diamond: 2}); p.offerings.elemental = 3; game.interact(); game.finishCutscene();
      ok(game.ownsPet('golem')); equal(p.offerings.elemental, 1); equal(p.materials.diamond, 0); advance(.1); equal(wild('pet-wild-golem'), undefined);
    });
    test('v2.21: the golemsín shields you 3 s every 20 s in a fight and gives +1 of every material', () => {
      const p = fixture('gero'); const pet = keepPet('golem'); pet.shieldCd = 0; const thief = enemy('thief', p.x + 60); thief.alert = true; thief.cooldown = 99;
      advance(.05); ok(p.invuln > 2.9, 'protected'); equal(game.hurtPlayer(99999, 'zak', false, {pierce: true, unavoidable: true}), false, 'blocks everything, even Zak'); ok(pet.shieldCd > 19);
      equal(game.gatherBonus(), 1); const before = p.offerings.elemental || 0; game.drops.push({x: p.x, y: p.y - 6, vx: 0, vy: 0, item: 'elemental', value: 0, life: 9, delay: 0, seed: 1}); game.updateDrops(0);
      equal(p.offerings.elemental, before + 2, 'Piedra Elemental +1');
      advance(3); const hp = thief.hp; thief.stun = 99; advance(2.2); ok(thief.hp < hp, 'throws stones from far away');
    });
    test('v2.21: the Yarará egg hatches 5%, you carry the baby without attacking and Herminia raises it for 2000 in 10 minutes', () => {
      const p = fixture('gero', true); Math.random = () => .06; equal(game.maybeHatch({summoned: false}), false);
      Math.random = () => 0; ok(game.maybeHatch({summoned: false})); equal(game.cutscene.id, 'hatch'); game.finishCutscene(); Math.random = original.random;
      const baby = wild('pet-wild-snake'); ok(baby); nearNpc(baby); game.enemies = []; game.interact(); equal(p.carrying, 'snake'); equal(game.attack(), false, 'no attacks while carrying');
      game.knockout('snake'); game.resume(); equal(p.carrying, null); equal(p.petProgress.snake.state, 'hatched', 'it goes back to the nest');
      game.syncPetNpcs(); nearNpc(wild('pet-wild-snake')); game.interact(); equal(p.carrying, 'snake');
      const lady = game.world.npcs.find(n => n.name === 'Doña Herminia'); ok(game.npcHasMenu(lady)); game.talkTo(lady); ok(game.cutscene.text.includes('muy rara, leal y letal')); game.finishCutscene();
      p.coins = 500; ok(game.leaveSnake().ok); equal(p.coins, 500, 'pays later'); equal(p.carrying, null);
      equal(game.collectSnake().ok, false, 'needs 10 minutes'); p.playTime += 600; equal(game.collectSnake().ok, false, 'needs the money');
      p.coins = 2500; ok(game.collectSnake().ok); equal(p.coins, 500); ok(game.ownsPet('snake')); equal(p.pet, 'snake');
    });
    test('v2.21: the snake poisons every 15 s and eats a common enemy 15% of the time, taking 3 s', () => {
      const p = fixture('gero'); const pet = keepPet('snake'); Math.random = () => .2; pet.special = 0; const thief = enemy('thief', p.x + 30); thief.cooldown = 99;
      game.petStrike(pet, thief); ok(thief.venom && thief.venom.time === 5); ok(!thief.dead);
      Math.random = () => .1; const kills = p.kills; game.petStrike(pet, thief); ok(thief.dead, 'eaten'); equal(p.kills, kills + 1); near(pet.eat, 3); equal(p.petEats, 1);
      const other = enemy('thief', p.x + 30); other.cooldown = 99; const hp = other.hp; Object.assign(pet, {x: other.x - 14, y: other.y}); advance(2.5); equal(other.hp, hp, 'swallowing'); advance(1.5); ok(other.hp < hp, 'back to work');
      const capo = enemy('capo', p.x + 30); game.petStrike(pet, capo); ok(!capo.dead, 'bosses are not eaten');
    });
    test('v2.21: the kennel keeps the companions you are not taking and swaps them', () => {
      const p = fixture('gero', true); p.pets = {dog: {name: 'Toby'}, bat: {name: 'Draco'}}; p.pet = 'dog'; advance(.05);
      ok(game.world.npcs.some(n => n.id === 'kennel-bat') && !game.world.npcs.some(n => n.id === 'kennel-dog'));
      const events = []; game.onEvent = (t, d) => events.push([t, d]); nearNpc(game.world.npcs.find(n => n.id === 'kennel-bat')); game.interact(); ok(events.some(([t, d]) => t === 'kennel' && d.pet === 'bat'));
      ok(game.equipPet('bat').ok); equal(p.pet, 'bat'); advance(.05); ok(game.world.npcs.some(n => n.id === 'kennel-dog' && n.name === 'Toby'));
      const save = JSON.parse(JSON.stringify(game.snapshot())); game.newGame('tena'); game.restore(save, 1); advance(.05); equal(game.player.pet, 'bat'); equal(game.petName('dog'), 'Toby'); ok(game.pet && game.pet.id === 'bat');
    });
    test('v2.21: rain comes from the clock, leaves puddles where you can walk and makes fish bite sooner', () => {
      const p = fixture('gero', true); let t = 240; while (Z.rainAt(t + 60, p.runId) < 1 && t < 240 * 500) t += 240; ok(Z.rainAt(t + 60, p.runId) === 1, 'it rains sometimes');
      equal(Z.rainAt(100, p.runId), 0, 'never in the first minutes'); equal(Z.rainAt(t + 60, p.runId), Z.rainAt(t + 60, p.runId));
      const puddles = Z.puddlesOf(game.world); ok(puddles.length > 40);
      for (const q of puddles) ok(!game.world.objects.some(o => o.solid && q.x > o.x - 2 && q.x < o.x + o.w + 2 && q.y > o.y - 2 && q.y < o.y + o.h + 2), 'puddle on free ground');
      p.playTime = t + 60; advance(.1); ok(game.raining()); p.rod = true; const pond = game.world.objects.find(o => o.type === 'pond');
      Object.assign(p, {x: pond.x - 10, y: pond.y + pond.h / 2}); Math.random = () => .5; game.startFishing(pond); near(p.fishing.bite, (2.5 + .5 * 4.5) * Z.RAIN.bite);
      game.wetness = 1; p.fishing = null; const q = puddles.find(q => Z.biomeAt(q.x, q.y) === 'village'); Object.assign(p, {x: q.x, y: q.y, moving: true}); game.biome = 'village'; game.lastPuddle = null; game.updateWeather(0); equal(p.puddles, 1, 'splash'); game.updateWeather(0); equal(p.puddles, 1, 'once per puddle');
    });
    test('v2.23: at the table the ghost plays one move at a time, and a whole match still ends', () => {
      const p = fixture('gero'); p.coins = 1000; Math.random = () => .9; ok(game.trucoStart(100, 'Truco', false, true).ok);
      const m = game.truco.match; equal(m.mano, 'ghost'); ok(game.trucoGhostTurn(), 'the ghost is mano'); equal(m.hand.played.ghost.length + (m.hand.pending ? 1 : 0), 0, 'it waits for the window');
      ok(game.trucoGhostStep(), 'one move'); ok(m.hand.played.ghost.length === 1 || m.hand.pending, 'only one');
      for (let k = 0; k < 400 && !m.over; k++) {
       if (game.trucoGhostTurn()) { game.trucoGhostStep(); continue; }
       if (m.hand.finished) { game.trucoAct('next'); continue; }
       const o = Z.Truco.options(m, 'player'); if (o.answer) game.trucoAct('quiero'); else if (o.play) game.trucoAct('play', m.hand.cards.player[0].id);
      }
      ok(m.over && game.truco.settled, 'the match ends'); ok(game.trucoRematch().ok || !game.truco.offer); if (game.truco.rematch) equal(game.truco.paced, true, 'the rematch keeps the pace');
    });
    test('v2.23: puddles and wet grass only while it rains, and dry seconds after it stops', () => {
      const p = fixture('gero', true); let t = 240; while (Z.rainAt(t + 60, p.runId) < 1 && t < 240 * 500) t += 240;
      let dry = 240; while (Z.rainAt(dry + 60, p.runId) > 0 && dry < 240 * 500) dry += 240;
      game.biome = 'village'; game.wetness = 0; p.playTime = dry + 60; game.updateWeather(30); equal(game.wetness, 0, 'no rain, no puddles');
      const q = Z.puddlesOf(game.world)[0]; equal(game.puddleAt(q.x, q.y), null, 'nothing to step on');
      p.playTime = t + 60; for (let k = 0; k < 25; k++) game.updateWeather(1); ok(game.wetness > .9 && game.puddleAt(q.x, q.y), 'puddles fill while it rains');
      p.playTime = dry + 60; for (let k = 0; k < 11; k++) game.updateWeather(1); equal(game.wetness, 0, 'dry ten seconds after it stops'); equal(game.puddleAt(q.x, q.y), null);
    });
    // v2.24: tormenta, niebla, vendedor ambulante, desafío semanal, bestiario y luna roja en la dimensión de Zak.
    const blockOf = (kind, runId) => { let t = 240; while (Z.weatherAt(t + 60, runId).kind !== kind && t < 240 * 2000) t += 240; return t + 60; };
    test('v2.24: storms and fog are rarer than rain and cover the whole surface', () => {
      const p = fixture('gero', true); ok(Z.STORM.chance < Z.RAIN.chance && Z.FOG.chance < Z.RAIN.chance, 'harsh weather is rarer');
      const kinds = {}; for (let b = 1; b < 3000; b++) { const k = Z.weatherAt(b * 240 + 60, p.runId).kind; kinds[k] = (kinds[k] || 0) + 1; }
      ok(kinds.rain > kinds.storm && kinds.rain > kinds.fog && kinds.storm > 100 && kinds.fog > 100, JSON.stringify(kinds));
      p.playTime = blockOf('storm', p.runId); equal(Z.rainAt(p.playTime, p.runId), 1, 'a storm also rains');
      for (const biome of ['village', 'weeds', 'altar']) { game.biome = biome; game.updateWeather(0); equal(game.weatherNow(), 'storm', biome); }
      for (const biome of ['cave', 'cave2', 'magic']) { game.biome = biome; equal(game.weatherNow(), null, biome + ' is under a roof'); }
      p.playTime = blockOf('fog', p.runId); game.biome = 'village'; game.updateWeather(0); ok(game.foggy() && !game.raining());
    });
    test('v2.24: lightning takes a lot of health and paralyzes; in Los Yuyos it sets the grass on fire', () => {
      const p = fixture('gero', true); game.enemies = []; p.playTime = blockOf('storm', p.runId); Object.assign(p, {x: 2000, y: 900, invuln: 0, roll: 0}); game.biome = 'weeds'; game.updateWeather(0);
      const max = game.stats().maxHealth; p.hp = max; game.boltClock = .01; Math.random = () => 0; advance(1.3);
      near(p.hp, max * (1 - Z.STORM.damage), 'a third of the health, armor or not'); ok(p.stunned > 1.5, 'paralyzed'); ok(game.hasMedal('struck'));
      equal(game.fires.length, 1, 'the grass catches fire'); p.stunned = 0; p.burn = null; game.updateGrassFire(.05); ok(p.burn, 'walking on it burns'); ok(game.hasMedal('burned'));
      game.fires = []; p.burn = null; Object.assign(p, game.world.spawn); game.biome = 'village'; p.hp = max; game.strike({x: p.x, y: p.y, t: 1, warn: 1, biome: 'village', seed: 1});
      equal(p.hp, max, 'the village is safe'); equal(game.fires.length, 0, 'and does not burn');
      Object.assign(p, {x: -400, y: 900}); game.biome = 'altar'; game.strike({x: p.x, y: p.y, t: 1, warn: 1, biome: 'altar', seed: 1}); ok(p.hp < max, 'the graveyard is not'); equal(game.fires.length, 0, 'only the weeds burn');
    });
    test('v2.24: in the graveyard fog a skeleton rises right next to you, with a scare', () => {
      const p = fixture('gero', true); p.playTime = blockOf('fog', p.runId); Object.assign(p, {x: -400, y: 1000}); game.biome = 'altar'; game.updateWeather(0); ok(game.foggy());
      const e = game.fogAmbush(); ok(e && e.type === 'skeleton' && Math.hypot(e.x - p.x, e.y - p.y) < 55, 'very close'); ok(game.scare > 0, 'scare on screen'); ok(game.hasMedal('ambush'));
      for (let k = 0; k < 8; k++) { game.ambushClock = .001; game.updateFogAmbush(.01); }
      ok(game.enemies.filter(m => m.fogAmbush && !m.dead).length <= Z.FOG.max, 'no more than three');
      ok(!game.snapshot().enemies.some(m => /^fog-/.test(m.id)), 'they are not saved');
      Object.assign(p, game.world.spawn); game.biome = 'village'; const before = game.enemies.length; for (let k = 0; k < 4; k++) { game.ambushClock = .001; game.updateFogAmbush(.01); } equal(game.enemies.length, before, 'only in the graveyard');
    });
    test('v2.24: the wandering merchant shows up only in danger zones, sells rare things dear and leaves', () => {
      const p = fixture('gero', true);
      for (const s of Z.WANDERER.spots) { equal(Z.biomeAt(s.x, s.y), s.zone); ok(!Z.isSafe(s.zone) && !Z.isZakDimension(s.zone), s.zone + ' is a danger zone'); ok(!Z.collides(game.world, s.x, s.y, 9), 'free ground at ' + s.x + ',' + s.y); }
      let t = 0; while (!Z.wandererAt(t, p.runId) && t < 1e6) t += 30; ok(Z.wandererAt(t, p.runId), 'he shows up sometimes');
      p.playTime = t; game.syncWanderer(); const n = game.world.npcs.find(m => m.id === 'wanderer'); ok(n && game.npcShop(n) === 'wanderer' && game.npcHasMenu(n));
      const offers = game.npcOffers(n); ok(offers.some(o => o.id === 'heal') && offers.some(o => o.id === 'cure')); equal(offers.length, 2 + Z.WANDERER.stock);
      const elixir = Z.wandererStock(1, 'x').concat(Z.wandererStock(2, 'x')); ok(elixir.length === 6);
      p.coins = 100000; equal(game.npcTrade(n, 'heal').ok, false, 'no cure when healthy'); p.hp = 1; ok(game.npcTrade(n, 'heal').ok); near(p.hp, game.stats().maxHealth); ok(p.coins < 100000); ok(game.hasMedal('scam'));
      const rare = offers.find(o => o.id !== 'heal' && o.id !== 'cure' && !o.done); const coins = p.coins; ok(game.npcTrade(n, rare.id).ok); equal(p.coins, coins - rare.cost.coins);
      const at = Z.wandererAt(t, p.runId); p.playTime = t + at.left + 1; game.syncWanderer(); ok(!game.world.npcs.some(m => m.id === 'wanderer'), 'and he leaves');
    });
    test('v2.24: the weekly challenge is the same for everyone, counts this week and pays x1,5 to the first', () => {
      equal(Z.weekId(new Date(2026, 10, 16, 0, 1)), '2026-W47'); equal(Z.weekId(new Date(2026, 10, 22, 23, 59)), '2026-W47'); equal(Z.weekId(new Date(2026, 10, 23)), '2026-W48'); equal(Z.weekId(new Date(2026, 0, 1)), '2026-W01');
      equal(Z.weeklyFor('2026-W47').id, Z.weeklyFor('2026-W47').id); ok(Z.weekLeft(new Date(2026, 10, 22, 23, 0)) === 36e5, 'one hour left on Sunday 23:00');
      const p = fixture('gero'); p.coins = 0; const w = game.weekly(); equal(w.count, 0); equal(w.week, Z.weekId());
      Object.assign(w, {id: 'hunter', count: Z.WEEKLY_LIST[0].goal - 1}); const xp = p.xp, level = p.level; let rat = enemy('rat'); game.hitEnemy(rat, 1e7, true);
      ok(w.done && w.paid, 'done and paid'); equal(p.coins >= Z.WEEKLY.coins, true); ok(p.level > level || p.xp > xp); ok(game.hasMedal('weekly')); equal(w.first, false, 'offline: normal prize');
      const coins = p.coins; game.player.weekly = {week: Z.weekId(), id: 'fisher', count: 60, done: true, at: Date.now(), paid: false, first: false}; game.payWeekly(true);
      equal(p.coins - coins, Math.round(Z.WEEKLY.coins * Z.WEEKLY.first), 'the first one gets x1,5'); ok(game.hasMedal('weeklyfirst'));
      Object.assign(game.player.weekly, {id: 'graves', done: false, paid: false, count: 0}); const skel = enemy('skeleton'); game.hitEnemy(rat = enemy('rat'), 1e7, true); equal(game.player.weekly.count, 0, 'rats do not count for graves'); game.hitEnemy(skel, 1e7, true); equal(game.player.weekly.count, 1);
      const next = game.weekly(new Date(Date.now() + 7 * 864e5)); equal(next.count, 0, 'a new week starts from zero');
      const save = JSON.parse(JSON.stringify(game.snapshot())); save.player.weekly = {week: 'nope', id: 'hunter', count: 9}; game.restore(save, 1); equal(game.player.weekly, null, 'bad data is dropped');
      delete save.player.weekly; game.restore(save, 1); equal(game.player.weekly, null); ok(game.weekly().week, 'and it starts when needed');
    });
    test('v2.24: the bestiary knows what you beat (also in old saves) and its red moon page', () => {
      for (const t of Object.keys(Z.ENEMY_TYPES)) { ok(Z.BESTIARY[t] && Z.BESTIARY[t].story.length > 60, t + ' has a story'); ok(Z.BESTIARY_ORDER.includes(t), t + ' has a page'); }
      equal(Z.BESTIARY_ORDER.length, Object.keys(Z.ENEMY_TYPES).length); ok(/creador/.test(Z.BESTIARY.zak.story) && /dimensiones alternas/.test(Z.BESTIARY.zak.story) && /por encima de todos/.test(Z.BESTIARY.zak.story));
      ok(/^Es parecido al esqueleto con escudo normal\./.test(Z.moonStory('skeleton')) && /salvaje y fuerte/.test(Z.moonStory('skeleton')));
      const p = fixture('gero'); ok(!game.bestiaryKnown('rat')); game.hitEnemy(enemy('rat'), 1e7, true); ok(game.bestiaryKnown('rat')); equal(game.bestiaryKills('rat'), 1); ok(!game.bestiaryMoon('rat'));
      p.bloodMoon = true; game.refreshEnemyStats(); const moonRat = enemy('rat'); ok(moonRat.stats.bloodMoon); game.hitEnemy(moonRat, 1e7, true); ok(game.bestiaryMoon('rat'), 'the red moon page');
      const normal = game.bestiaryStats('skeleton'), moon = game.bestiaryStats('skeleton', true); ok(moon.base.health > normal.base.health && moon.now.strength > normal.now.strength && moon.base.speed > normal.base.speed);
      ok(normal.now.health >= normal.base.health, 'current stats grow with your level');
      const save = JSON.parse(JSON.stringify(game.snapshot())); delete save.player.bestiary; delete save.player.moonKills; save.questFlags.defeat_cerbero = true;
      game.restore(save, 1); ok(game.bestiaryKnown('cerbero') && game.bestiaryKnown('rat'), 'old saves: what you defeated is known'); ok(!game.bestiaryMoon('rat')); equal(game.bestiaryKills('cerbero'), 0);
      save.player.moonKills = {rat: 2, nope: 4, dog: -1}; game.restore(save, 1); equal(JSON.stringify(game.player.moonKills), '{"rat":2}', 'bad data is cleaned');
      const c = document.createElement('canvas'); c.width = c.height = 60;
      for (const t of Z.BESTIARY_ORDER) { Z.drawEnemyPortrait(c, t, {moon: true}); const px = c.getContext('2d').getImageData(0, 0, 60, 60).data; let on = 0; for (let i = 3; i < px.length; i += 4) on += px[i] > 0; ok(on > 20, t + ' portrait'); }
      Z.drawEnemyPortrait(c, 'zak', {silhouette: true}); const px = c.getContext('2d').getImageData(0, 0, 60, 60).data; let light = 0; for (let i = 0; i < px.length; i += 4) if (px[i + 3] > 0 && px[i] + px[i + 1] + px[i + 2] > 120) light++; equal(light, 0, 'a silhouette shows nothing');
    });
    test('v2.24: new medals for lightning, the graveyard, the fire, the merchant and the week; old saves keep loading', () => {
      for (const id of ['struck', 'ambush', 'burned', 'scam', 'weekly', 'weeklyfirst', 'bestiary']) ok(Z.MEDALS.some(m => m.id === id), id);
      ok(Z.MEDALS.find(m => m.id === 'scam').name === 'Me siento estafado...');
      const p = fixture('gero'); const save = JSON.parse(JSON.stringify(game.snapshot())); for (const k of ['weekly', 'bestiary', 'moonKills']) delete save.player[k]; save.player.medals = ['struck', 'nope'];
      game.restore(save, 1); equal(JSON.stringify(game.player.medals), '["struck"]'); equal(JSON.stringify(game.player.bestiary), '{}');
    });
    test('v2.21: medals arrive for what you already did, for events and stay in the save', () => {
      const p = fixture('gero', true), toasts = []; game.onEvent = (t, d) => { if (t === 'toast') toasts.push(d.message); };
      game.questFlags.defeat_golem = true; game.questFlags.defeat_capo = true; const save = JSON.parse(JSON.stringify(game.snapshot())); delete save.player.medals;
      game.restore(save, 1); game.onEvent = (t, d) => { if (t === 'toast') toasts.push(d.message); }; advance(.05);
      ok(game.hasMedal('golem') && game.hasMedal('capo')); equal(toasts.filter(m => m.includes('medalla')).length, 1, 'one notice for all of them');
      Math.random = () => 0; game.addItem('mojarra', 0); game.catchFish(); ok(game.hasMedal('dorado'), 'Dorado'); Math.random = original.random;
      game.knockout('execute'); ok(game.hasMedal('executed'));
      ok(Z.MEDALS.every(m => typeof Z.drawMedal === 'function' && m.name && m.detail && ['bronze', 'silver', 'gold'].includes(m.tier)));
      const canvas = document.createElement('canvas'); canvas.width = 88; canvas.height = 96; for (const m of Z.MEDALS) Z.drawMedalCanvas(canvas, m.id, false);
      const again = JSON.parse(JSON.stringify(game.snapshot())); game.restore(again, 1); ok(game.player.medals.includes('executed'));
    });
    test('v2.21: Zak furioso is a rematch for whoever beat him: 50% more health, 30% faster and its own record', () => {
      const p = fixture('gero', true), events = []; game.onEvent = t => events.push(t); p.throneKeys = 2;
      game.openThroneDoor(); equal(game.biome, 'throne', 'the first time there is no choice'); game.leaveThrone(); p.throneKeys = 2; game.questFlags.defeat_zak = true;
      equal(game.openThroneDoor(), false); ok(events.includes('throneChoice')); equal(p.throneKeys, 2, 'choosing does not spend the key');
      ok(game.openThroneDoor('normal')); const normal = game.enemies.find(e => e.type === 'zak').maxHp; equal(game.zakFury, false); game.leaveThrone();
      ok(game.openThroneDoor('fury')); equal(p.throneKeys, 0); const zak = game.enemies.find(e => e.type === 'zak'); near(zak.maxHp, normal * 1.5); game.finishCutscene();
      const coins = p.coins; game.time += 200; zak.life = 2; game.hitEnemy(zak, 1e9, true); ok(p.zakFuryBest > 199 && p.zakFuryBest < 201); equal(p.zakBest, 0, 'the normal record is untouched'); equal(p.furyWins, 1);
      game.leaveThrone(); equal(game.zakFury, false); advance(.05); ok(game.hasMedal('fury'));
    });
    test('v2.21: truco bets pay double; the ghost may ask a rematch that costs double or gives a random item', () => {
      const p = fixture('gero'); p.coins = 1000;
      equal(game.trucoStart(5000).ok, false); ok(game.trucoStart(100, 'Truco').ok); equal(p.coins, 900, 'the bet is on the table');
      Math.random = () => .29; Object.assign(game.truco.match, {over: true, winner: 'player'}); game.trucoSettle(); equal(p.coins, 1100); ok(game.truco.offer, '30% rematch'); equal(p.trucoWins, 1);
      ok(game.trucoRematch().ok); equal(game.truco.rematch, true); equal(p.coins, 1100, 'nothing up front');
      Object.assign(game.truco.match, {over: true, winner: 'player'}); game.trucoSettle(); ok(game.truco.prize && game.truco.prize.name, 'random item'); equal(p.trucoRematchWins, 1);
      Math.random = () => .31; game.trucoStart(100); Object.assign(game.truco.match, {over: true, winner: 'player'}); game.trucoSettle(); equal(game.truco.offer, false, 'not always');
      Math.random = () => 0; game.trucoStart(100); Object.assign(game.truco.match, {over: true, winner: 'player'}); game.trucoSettle(); const before = p.coins; game.trucoRematch();
      Object.assign(game.truco.match, {over: true, winner: 'ghost'}); game.trucoSettle(); equal(p.coins, before - 200, 'losing the rematch costs double');
      Math.random = original.random; const left = p.coins; game.trucoStart(50); game.trucoLeave(); equal(p.coins, left - 50, 'leaving the table loses the bet');
      game.trucoStart(50); const t = game.truco; for (let guard = 0; guard < 400 && !t.match.over; guard++) { const h = t.match.hand; if (h.finished) { game.trucoAct('next'); continue; } const o = Z.Truco.options(t.match, 'player'); if (o.answer) game.trucoAct('quiero'); else if (o.play) game.trucoAct('play', h.cards.player[0].id); }
      ok(t.match.over && t.settled, 'a whole match against the ghost ends');
    });
    game.pause(); cancelAnimationFrame(game.frame);
    return {passed: results.filter(r=>r.pass).length, failed: results.filter(r=>!r.pass).length, results};
  };
})(window);

// Allows browser_check.py --script tests/engine.test.js to read the completed browser report.
window.zakTestResults || null;
