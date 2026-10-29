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
    function test(name, fn) {
      try { fn(); results.push({name, pass: true}); }
      catch (error) { results.push({name, pass: false, error: error.message, stack: error.stack}); }
      finally { Z.biomeAt = original.biomeAt; Z.collides = original.collides; Math.random = original.random; game.pause(); }
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
      near(thief.level,1); p.xp=149; const another=enemy('rat'); game.hitEnemy(another,100);
      equal(p.level,3); equal(p.points,2); near(thief.level,2); near(thief.maxHp,103); near(thief.hp,103);
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
        s=>s.player.xp=-1, s=>s.player.hp=NaN, s=>s.player.stats.speed=101,
        s=>s.player.weapons=['unknown'], s=>s.player.x=-100, s=>s.collected=null
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
      advance(.75); ok(capo.dash > 0 || capo.telegraph > 0); ok(game.roll()); p.rollX = 0; p.rollY = 0;
      advance(.45); near(p.hp, hp, 'Invulnerable while the dash passes through'); ok(capo.x < p.x, 'Capo dashed past the player');
      ok(capo.special > 3);
      const other = fixture(); const second = enemy('capo', other.x + 60); second.special = 0; const full = other.hp;
      game.update(1 / 60); advance(1.1); ok(other.hp < full, 'Standing still in the dash line hurts');
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
      advance(.65); ok(p.hp < hp, 'Standing in the ring hurts'); ok(Math.hypot(p.x - yarara.x, p.y - yarara.y) > 40, 'Knocked outward');
      const q = fixture(); const second = enemy('yarara', q.x, q.y - 40); second.special = 99; second.alert = true; const full = q.hp;
      game.update(1 / 60); advance(.45); q.rollCooldown = 0; ok(game.roll()); q.rollX = 0; q.rollY = 0; advance(.2); near(q.hp, full, 'Rolling dodges the sweep');
    });
    test('The Yarara spits a three-way venom fan that hurts the player', () => {
      const p = fixture(); const yarara = enemy('yarara', p.x + 150); yarara.special = 0; Math.random = () => .99;
      game.update(1 / 60); ok(yarara.backoff > 0); advance(.45); ok(yarara.telegraph > 0); advance(.7);
      ok(game.projectiles.filter(s => s.hostile).length >= 2, 'Venom fan spawned'); const hp = p.hp;
      advance(1.2); ok(p.hp < hp, 'Venom must reach the player');
    });
    test('Coins, herbs and shop upgrades survive a save round trip', () => {
      const p = fixture('pepe', true); p.coins = 77; p.herbs = 3; p.sharpen = 2; p.lessons = 1; game.questFlags.bought = true; game.questFlags.defeat_capo = true;
      const save = game.snapshot(); game.newGame('tena'); game.restore(save, 1);
      equal(game.player.coins, 77); equal(game.player.herbs, 3); equal(game.player.sharpen, 2); equal(game.player.lessons, 1);
      equal(game.questFlags.bought, true); equal(game.questFlags.defeat_capo, true);
    });

    game.pause(); cancelAnimationFrame(game.frame);
    return {passed: results.filter(r=>r.pass).length, failed: results.filter(r=>!r.pass).length, results};
  };
})(window);

// Allows browser_check.py --script tests/engine.test.js to read the completed browser report.
window.zakTestResults || null;
