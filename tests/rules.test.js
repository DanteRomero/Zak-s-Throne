/* Ejecutar: node tests/rules.test.js; o cargar tras data.js y usar runZakRulesTests(). */
(function (root) {
  'use strict';
  const node = typeof module !== 'undefined' && module.exports;
  if (node) require('../src/data.js');
  const Zak = root.Zak;
  function runZakRulesTests() {
    let count = 0;
    const results = [];
    const equal = (actual, expected, message = '') => {
      if (actual !== expected) throw new Error(message + ': esperado ' + expected + ', recibido ' + actual);
    };
    const ok = (value, message = 'Falló la condición') => { if (!value) throw new Error(message); };
    const near = (actual, expected, message = '') => {
      if (Math.abs(actual - expected) > 1e-8) throw new Error(message + ': esperado ' + expected + ', recibido ' + actual);
    };
    const test = (name, fn) => { fn(); count++; results.push(name); };
    test('Los siete personajes tienen estadísticas independientes', () => {
      equal(Zak.CHARACTERS.length, 7);
      const a = Zak.createPlayer('gero'), b = Zak.createPlayer('gero');
      a.stats.health = 1; equal(b.stats.health, 105); equal(Zak.CHARACTERS[0].stats.health, 105);
    });
    test('Mer: poca vida, veloz, fuerza normal, buena resistencia y Madre tierra cada 45 s', () => {
      const mer = Zak.CHARACTERS.find(c => c.id === 'mer'), others = Zak.CHARACTERS.filter(c => c.id !== 'mer');
      ok(mer, 'Mer existe'); ok(others.every(c => mer.stats.health < c.stats.health), 'la que menos vida tiene');
      ok(others.every(c => mer.stats.speed >= c.stats.speed), 'de las más rápidas'); equal(mer.stats.strength, 5);
      ok(others.every(c => mer.stats.endurance >= c.stats.endurance), 'de las más resistentes');
      equal(mer.abilityCooldown, 45); equal(mer.abilityDuration, 7); equal(mer.abilityPassive, false);
      equal(Zak.SPIRITS.count, 3); equal(Zak.SPIRITS.interval, .5); equal(Zak.SPIRITS.multiplier, 1.5);
      const p = Zak.createPlayer('mer'); equal(p.hp, 85); equal(p.characterId, 'mer');
    });
    test('Velocidad: límites exactos de todas las bandas', () => {
      [[0,3,72],[14.99,3,72],[15,2,92],[29.99,2,92],[30,1,118],[59.99,1,118],[60,.5,148],[100,.5,148],[200,.375,163],[400,.3125,170.5]].forEach(([speed, cooldown, movement]) => {
        const s = Zak.speedBand(speed); equal(s.attackCooldown,cooldown); equal(s.moveSpeed,movement);
      });
    });
    test('Resistencia: duración y armadura en todos los límites', () => {
      [[0,3,0],[14.99,3,0],[15,5,2],[29.99,5,2],[30,7,4],[59.99,7,4],[60,10,6],[79.99,10,6],[80,12,8],[100,12,8]].forEach(([value,seconds,armor]) => {
        const s = Zak.enduranceBand(value); equal(s.runDuration,seconds); equal(s.armor,armor);
      });
    });
    test('Experiencia por nivel: cada vez más cara y sin límite artificial', () => {
      equal(Zak.xpNeeded(1),100); equal(Zak.xpNeeded(2),155); equal(Zak.xpNeeded(3),220); equal(Zak.xpNeeded(50),14555);
      ok(Zak.xpNeeded(100) > 230000, 'El nivel 100 es extremadamente caro');
      for (let level = 1; level < 300; level++) ok(Zak.xpNeeded(level + 1) - Zak.xpNeeded(level) > Zak.xpNeeded(level) - Zak.xpNeeded(level - 1 || 1) - 1e-9, 'Cada salto cuesta más: ' + level);
      ok(Number.isFinite(Zak.xpNeeded(10000)));
    });
    test('Los jefes dan mucha más experiencia que los enemigos comunes', () => {
      [1, 50, 100].forEach(level => { const common = Math.max(...['thief','worm','spider','skeleton'].map(t => Zak.enemyStats(t, level).xp));
        ['capo','yarara','vampire','golem','cerbero','zak'].forEach(t => ok(Zak.enemyStats(t, level).xp >= common * 4, t + ' en nivel ' + level)); });
    });
    test('La fuerza rinde cada vez menos en el poder de golpe', () => {
      near(Zak.strikePower(5), 5); near(Zak.strikePower(10), 10); ok(Zak.strikePower(100) < 45 && Zak.strikePower(100) > Zak.strikePower(50));
      ok(Zak.strikePower(50) - Zak.strikePower(40) < Zak.strikePower(20) - Zak.strikePower(10));
    });
    test('El arquero pega mucho más que el esqueleto con escudo', () => {
      [1, 30, 80].forEach(level => ok(Zak.enemyStats('archer', level).strength > Zak.enemyStats('skeleton', level).strength * 1.4, 'Nivel ' + level));
    });
    test('Inteligencia usa escalones de 10', () => {
      const p = Zak.createPlayer('tena');
      [[0,1],[9,1],[10,1.2],[19,1.2],[20,1.4],[100,3]].forEach(([intel,mult]) => { p.stats.intelligence=intel; near(Zak.getStats(p).xpMultiplier,mult); });
    });
    test('Gero suma inteligencia a su base de 0,75', () => {
      const p=Zak.createPlayer('gero'); near(Zak.getStats(p).xpMultiplier,.75);
      p.stats.intelligence=10; near(Zak.getStats(p).xpMultiplier,.95);
      p.stats.intelligence=20; near(Zak.getStats(p).xpMultiplier,1.15);
    });
    test('Pepe multiplica por 1,5 la experiencia con inteligencia', () => {
      const p=Zak.createPlayer('pepe'); near(Zak.getStats(p).xpMultiplier,1.8);
      p.stats.intelligence=20; near(Zak.getStats(p).xpMultiplier,2.1);
    });
    test('Subir varios niveles conserva el sobrante y entrega puntos', () => {
      const p=Zak.createPlayer('tena'); equal(Zak.grantXp(p,280),2);
      equal(p.level,3); equal(p.xp,25); equal(p.points,2); equal(p.stats.health,104); equal(p.hp,104);
    });
    test('Experiencia fraccionaria no pierde un ascenso en el límite', () => {
      const p=Zak.createPlayer('tena'); for(let i=0;i<1000;i++) Zak.grantXp(p,.1);
      equal(p.level,2); near(p.xp,0);
    });
    test('Dante obtiene fuerza automática y una elección independiente', () => {
      const p=Zak.createPlayer('dante'); p.stats.intelligence=0; equal(Zak.grantXp(p,255),2);
      equal(p.stats.strength,10); equal(p.points,2);
      equal(Zak.upgradeStat(p,'strength'),true); equal(p.stats.strength,11); equal(p.points,1);
    });
    test('Vida, fuerza, velocidad y resistencia no tienen tope', () => {
      const p=Zak.createPlayer('tena'); p.stats.health=499; p.hp=499; Zak.grantXp(p,100);
      equal(p.stats.health,501); equal(p.hp,501); equal(Zak.upgradeStat(p,'health'),true); equal(p.stats.health,506); equal(Zak.getStats(p).maxHealth,506);
      p.stats.strength=150; p.stats.speed=200; p.stats.endurance=150; const s=Zak.getStats(p);
      equal(s.strength,150); equal(s.speed,200); equal(s.attackCooldown,.375); equal(s.runDuration,12); equal(s.armor,0,'la resistencia ya no da armadura');
    });
    test('Las mejoras no gastan puntos si son inválidas', () => {
      const p=Zak.createPlayer('tena'); p.points=2; p.stats.speed=100;
      equal(Zak.upgradeStat(p,'notAStat'),false); equal(Zak.upgradeStat(p,'toString'),false); equal(p.points,2);
      equal(Zak.upgradeStat(p,'speed'),true); equal(p.stats.speed,101); equal(p.points,1);
      equal(Zak.upgradeStat(p,'health'),true); equal(p.stats.health,105); equal(p.hp,105); equal(p.points,0);
      equal(Zak.upgradeStat(p,'health'),false);
    });
    test('Veteranía: desde el nivel 8 el daño crece como la vida extra de los enemigos', () => {
      const p=Zak.createPlayer('dante'); p.level=8; near(Zak.getStats(p).damageMultiplier,1);
      p.level=20; near(Zak.getStats(p).veteran,1.48); p.sharpen=2; near(Zak.getStats(p).damageMultiplier,1.2*1.48);
      near(Zak.getStats(p).veteran,Zak.lateFactor(20).health);
      near(Zak.getStats(p).maxHealth,p.stats.health*1.06,'La vida crece como la fuerza extra de los enemigos');
    });
    test('Mejorar vida conserva la vida temporal de Paco en Yuyos', () => {
      const p=Zak.createPlayer('paco'); p.hp=115; p.points=1;
      equal(Zak.upgradeStat(p,'health'),true); equal(p.stats.health,105); equal(p.hp,120);
    });
    test('Inteligencia no tiene máximo y exige puntos disponibles', () => {
      const p=Zak.createPlayer('tena'); p.stats.intelligence=100; p.points=1;
      equal(Zak.upgradeStat(p,'intelligence'),true); equal(p.stats.intelligence,101); equal(Zak.upgradeStat(p,'strength'),false);
    });
    test('Paco gana 15% en Yuyos sin acumular ni mutar estadísticas', () => {
      const p=Zak.createPlayer('paco'); const before=JSON.stringify(p.stats);
      const a=Zak.getStats(p,{biome:'weeds'}), b=Zak.getStats(p,{biome:'weeds'});
      near(a.maxHealth,115); near(a.strength,6.9); near(a.speed,17.25); near(a.intelligence,11.5); near(a.endurance,23); near(a.moveSpeed,92*1.15);
      near(b.strength,a.strength); equal(JSON.stringify(p.stats),before); equal(Zak.getStats(p,{biome:'village'}).strength,6);
    });
    test('Pulmones: descuento sobre la carrera, no sobre la armadura', () => {
      const paco=Zak.createPlayer('paco'), fede=Zak.createPlayer('fede');
      paco.stats.endurance=100; fede.stats.endurance=100;
      near(Zak.getStats(paco).runDuration,10.8); paco.armorTier=4; near(Zak.getStats(paco).armor,9);
      near(Zak.getStats(fede).runDuration,9.6); equal(Zak.getStats(fede).armor,0);
    });
    test('Fede activa Último aliento exactamente al 30%', () => {
      const p=Zak.createPlayer('fede'); p.hp=27; near(Zak.getStats(p).speed,34.5); near(Zak.getStats(p).endurance,5.75); near(Zak.getStats(p).moveSpeed,118*1.15);
      p.hp=27.01; equal(Zak.getStats(p).speed,30);
    });
    test('Tena pierde 10% con tres perseguidores, sin perder vida', () => {
      const p=Zak.createPlayer('tena'); const s=Zak.getStats(p,{pursuers:3});
      equal(s.maxHealth,100); near(s.strength,1.8); near(s.speed,18); near(s.endurance,4.5); near(s.intelligence,4.5); near(s.moveSpeed,92*.9);
      equal(Zak.getStats(p,{pursuers:2}).strength,2); equal(p.stats.strength,2);
    });
    test('Gero alcanza 125 temporales y vuelve al valor original', () => {
      const p=Zak.createPlayer('gero'); p.stats.speed=100; p.buffs.gero=5;
      equal(Zak.getStats(p).speed,125); equal(Zak.getStats(p).attackCooldown,.25); equal(p.stats.speed,100);
      p.buffs.gero=0; equal(Zak.getStats(p).attackCooldown,.5);
    });
    test('Paco gana fuerza por animales encantados solo durante la habilidad', () => {
      const p=Zak.createPlayer('paco'); p.buffs.paco=10; p.buffs.pacoAnimals=3;
      equal(Zak.getStats(p).strength,12); p.buffs.paco=0; equal(Zak.getStats(p).strength,6);
    });
    test('Pepe activa el aumento temporal de velocidad al derrotar', () => {
      const p=Zak.createPlayer('pepe'); p.buffs.pepe=3; near(Zak.getStats(p).speed,17.25); near(Zak.getStats(p).moveSpeed,92*1.15);
      p.buffs.pepe=0; equal(Zak.getStats(p).speed,15);
    });
    test('Dante aplica 10% menos de movimiento en cualquier banda', () => {
      const p=Zak.createPlayer('dante'); near(Zak.getStats(p).moveSpeed,64.8);
      p.stats.speed=60; near(Zak.getStats(p).moveSpeed,133.2);
    });
    test('Mordedura ralentiza movimiento sin acelerar ni demorar el ataque', () => {
      const p=Zak.createPlayer('gero'); p.slow=4; near(Zak.getStats(p).moveSpeed,92*.85); equal(Zak.getStats(p).attackCooldown,2);
      const pepe=Zak.createPlayer('pepe'); pepe.slow=4; near(Zak.getStats(pepe).moveSpeed,92*.8);
    });
    test('Enemigos tienen el mismo nivel que el personaje', () => {
      [1,2,3,4,5].forEach(level => equal(Zak.enemyStats('thief',level).level,level));
      const thief=Zak.enemyStats('thief',3);
      near(thief.health,103*1.2); near(thief.strength,6*.72); equal(thief.speed,17); equal(thief.endurance,12);
    });
    test('Crecimientos fraccionarios y daño de veneno se conservan', () => {
      const dog=Zak.enemyStats('dog',3), snake=Zak.enemyStats('snake',3), rat=Zak.enemyStats('rat',3);
      near(dog.health,61.5*1.2); near(dog.strength,3.5*.72); equal(dog.speed,33); equal(dog.endurance,22);
      near(snake.health,36*1.2); near(snake.strength,7*.72); equal(snake.poison,3); equal(snake.speed,27); equal(snake.endurance,5.5);
      near(rat.health,10.5*1.2); near(rat.strength,1.8*.72); equal(rat.speed,42); equal(rat.endurance,.5);
    });
    test('Desde el nivel 8 los enemigos ganan vida y fuerza extra', () => {
      const base=Zak.enemyStats('thief',8), late=Zak.enemyStats('thief',20);
      near(base.health,110.5*1.2); near(base.strength,8.5*.72);
      near(late.health,(100+1.5*19)*1.48*1.2); near(late.strength,(5+.5*19)*1.06*.72);
      equal(Zak.enemyStats('archer',40).health,1,'El arquero siempre se rompe de un golpe');
      near(Zak.enemyStats('zak',40).health,(20000+400*39)*2.28*1.1,'Zak gana la vida tardía');
      near(Zak.enemyStats('zak',40).strength,(40+1.5*39)*.68,'pero no la fuerza tardía');
    });
    test('Las ratas ya no son letales en el final del juego', () => {
      ok(Zak.enemyStats('rat',40).strength<Zak.enemyStats('thief',40).strength,'Una rata pega menos que un chorro');
      ok(Zak.enemyStats('rat',40).strength<40);
    });
    test('Enemigos respetan los máximos incluso a niveles muy altos', () => {
      Object.keys(Zak.ENEMY_TYPES).forEach(type => {
        const s=Zak.enemyStats(type,100000); ok(s.strength<=100*Zak.lateFactor(100000).strength*(Zak.ENEMY_TYPES[type].power||1),type); ok(s.speed<=100); ok(s.endurance<=100);
      });
    });
    test('Cada jefe suelta su ofrenda y El Almacén la paga', () => {
      const prices={fang:500,ring:1000,claw:1000,elemental:2000,eye:2000};
      Object.entries(prices).forEach(([id,price]) => { equal(Zak.OFFERINGS[id].price,price); equal(Zak.ENEMY_TYPES[Zak.OFFERINGS[id].boss].drop,id); });
      equal(Zak.ELEMENTAL_RECIPE.offerings.elemental,5); equal(Zak.ELEMENTAL_RECIPE.materials.iron,20);
      ok(Zak.WEAPON_TYPES.elemental.damageMultiplier>Zak.WEAPON_TYPES.sword.damageMultiplier*Zak.weaponLevelMultiplier(6));
    });
    test('El veneno respeta el máximo de fuerza', () => { equal(Zak.enemyStats('snake',100000).poison,100); });
    test('Armadura resta daño y conserva mínimo de un punto', () => {
      equal(Zak.damageAfterArmor(10,4),6); equal(Zak.damageAfterArmor(3,8),1); near(Zak.damageAfterArmor(10,7.2),2.8); equal(Zak.damageAfterArmor(0,0),0);
    });
    test('La espada inflige 50% de daño adicional', () => { equal(Zak.WEAPON_TYPES.sword.damageMultiplier,1.5); });
    test('Experiencia inválida no corrompe el personaje', () => {
      const p=Zak.createPlayer('tena'); equal(Zak.grantXp(p,NaN),0); equal(Zak.grantXp(p,Infinity),0); equal(Zak.grantXp(p,-20),0); equal(p.xp,0);
    });
    test('v2.19: choripán, vino, runa y Herradura cambian la ficha; partidas nuevas arrancan sin nada', () => {
      const p=Zak.createPlayer('gero'), base=Zak.getStats(p);
      p.buffs.chori=10; near(Zak.getStats(p).strength,base.strength*1.2,'choripán'); p.buffs.chori=0;
      p.buffs.wine=10; near(Zak.getStats(p).armor,base.armor+3,'vino: armadura'); near(Zak.getStats(p).moveSpeed,base.moveSpeed*.9,'vino: paso'); p.buffs.wine=0;
      p.buffs.rune=5; near(Zak.getStats(p).damageMultiplier,base.damageMultiplier*1.15,'runa'); p.buffs.rune=0;
      p.amulets=['horseshoe']; p.equipped=['horseshoe']; near(Zak.getStats(p).moveSpeed,base.moveSpeed*1.08,'herradura');
      p.equipped=['eye','horseshoe']; equal(Zak.hasAmulet(p,'horseshoe'),false,'un solo engarce: cuenta el primero'); p.amuletSlots=2; equal(Zak.hasAmulet(p,'horseshoe'),true,'con dos engarces cuentan los dos');
      const fresh=Zak.createPlayer('mer'); equal(Object.keys(fresh.items).length,0); equal(fresh.amulets.length,0); equal(fresh.amuletSlots,1); equal(fresh.rod,false); equal(fresh.materials.arcane,0);
      ok(Object.keys(Zak.BUFF_LIMITS).every(k => fresh.buffs[k]===0),'todos los efectos en cero');
    });
    test('v2.19: los cinco enemigos nuevos de la dimensión y el cristal arcano', () => {
      for (const t of ['book','imp','gargoyle','shadow','mimic']) { ok(Zak.ENEMY_TYPES[t],t); ok(!Zak.ENEMY_TYPES[t].boss,t+' no es jefe'); }
      equal(Zak.ENEMY_TYPES.mimic.loot,true); equal(Zak.NODES.arcane.tier,5); equal(Zak.NODES.arcane.material,'arcane'); ok(Zak.MATERIALS.arcane);
      ok(['water','bandage','choripan','wine','scroll'].every(id => Zak.SHOP_ITEMS.some(i => i.id===id && i.item)),'El Almacén vende los consumibles');
    });
    test('v2.20: cada armadura protege más que la anterior y la resistencia solo alarga la carrera', () => {
      equal(Zak.MAX_ARMOR,5); equal(Zak.ARMORS.slice(1).map(a=>a.id).join(),'wood,iron,gold,diamond,elemental');
      for (let t=2;t<=5;t++) { ok(Zak.ARMORS[t].armor>Zak.ARMORS[t-1].armor,'mejor que la anterior: '+t); ok(Zak.ARMORS[t].recipe.coins>Zak.ARMORS[t-1].recipe.coins,'más cara: '+t); }
      equal(Zak.ARMORS[5].recipe.offerings.elemental,3,'la elemental lleva Piedras Elementales');
      const p=Zak.createPlayer('gero'); equal(p.armorTier,0); equal(Zak.getStats(p).armor,0);
      p.stats.endurance=90; equal(Zak.getStats(p).armor,0,'con mucha resistencia, igual sin armadura'); equal(Zak.getStats(p).runDuration,12);
      [0,2,4,6,9,13].forEach((value,tier) => { p.armorTier=tier; equal(Zak.getStats(p).armor,value,'nivel '+tier); });
      p.armorTier=99; equal(Zak.getStats(p).armor,13,'tope'); equal(Zak.enduranceBand(80).armor,8,'los enemigos siguen igual');
    });
    return { passed: count, results };
  }
  root.runZakRulesTests = runZakRulesTests;
  if (node) {
    const result=runZakRulesTests();
    console.log('✓ ' + result.passed + ' pruebas de reglas completadas.');
    module.exports=runZakRulesTests;
  }
})(typeof window !== 'undefined' ? window : globalThis);

