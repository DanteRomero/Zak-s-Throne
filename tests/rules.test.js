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
    const near = (actual, expected, message = '') => {
      if (Math.abs(actual - expected) > 1e-8) throw new Error(message + ': esperado ' + expected + ', recibido ' + actual);
    };
    const test = (name, fn) => { fn(); count++; results.push(name); };
    test('Los seis personajes tienen estadísticas independientes', () => {
      equal(Zak.CHARACTERS.length, 6);
      const a = Zak.createPlayer('gero'), b = Zak.createPlayer('gero');
      a.stats.health = 1; equal(b.stats.health, 110); equal(Zak.CHARACTERS[0].stats.health, 110);
    });
    test('Velocidad: cadencia por bandas y movimiento continuo', () => {
      [[0,3],[14.99,3],[15,2],[29.99,2],[30,1],[59.99,1],[60,.5],[100,.5],[125,.25]].forEach(([speed, cooldown]) => {
        const s = Zak.speedBand(speed); equal(s.attackCooldown,cooldown);
        equal(s.moveSpeed > Zak.speedBand(Math.max(0, speed - .01)).moveSpeed, speed > 0);
      });
      near(Zak.speedBand(30).moveSpeed,105); near(Zak.speedBand(35).moveSpeed,112.5);
    });
    test('Resistencia: duración y armadura en todos los límites', () => {
      [[0,3,0],[14.99,3,0],[15,5,2],[29.99,5,2],[30,7,4],[59.99,7,4],[60,10,6],[79.99,10,6],[80,12,8],[100,12,8]].forEach(([value,seconds,armor]) => {
        const s = Zak.enduranceBand(value); equal(s.runDuration,seconds); equal(s.armor,armor);
      });
    });
    test('Experiencia por nivel crece 50 y no tiene límite artificial', () => {
      equal(Zak.xpNeeded(1),100); equal(Zak.xpNeeded(2),150); equal(Zak.xpNeeded(3),200); equal(Zak.xpNeeded(10000),500050);
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
      const p=Zak.createPlayer('tena'); p.stats.intelligence=0; const before={...p.stats}; equal(Zak.grantXp(p,280),2);
      equal(p.level,3); equal(p.xp,30); equal(p.points,4); equal(p.stats.health,before.health+4); equal(p.hp,before.health+4); equal(p.stats.strength,before.strength+2);
    });
    test('Experiencia fraccionaria no pierde un ascenso en el límite', () => {
      const p=Zak.createPlayer('tena'); p.stats.intelligence=0; for(let i=0;i<1000;i++) Zak.grantXp(p,.1);
      equal(p.level,2); near(p.xp,0);
    });
    test('Dante obtiene fuerza automática doble y dos elecciones independientes', () => {
      const p=Zak.createPlayer('dante'); p.stats.intelligence=0; equal(Zak.grantXp(p,250),2);
      equal(p.stats.strength,16); equal(p.points,4);
      equal(Zak.upgradeStat(p,'strength'),true); equal(p.stats.strength,17); equal(p.points,3);
    });
    test('Vida automática y mejoras respetan el máximo de 500', () => {
      const p=Zak.createPlayer('tena'); p.stats.health=499; p.hp=499; Zak.grantXp(p,100);
      equal(p.stats.health,500); equal(p.hp,500); equal(Zak.upgradeStat(p,'health'),false); equal(p.points,2);
    });
    test('Las mejoras no gastan puntos si son inválidas o están al máximo', () => {
      const p=Zak.createPlayer('tena'); p.points=2; p.stats.speed=100;
      equal(Zak.upgradeStat(p,'speed'),false); equal(Zak.upgradeStat(p,'notAStat'),false); equal(Zak.upgradeStat(p,'toString'),false); equal(p.points,2);
      equal(Zak.upgradeStat(p,'health'),true); equal(p.stats.health,120); equal(p.hp,120); equal(p.points,1);
    });
    test('Mejorar vida conserva la vida temporal de Paco en Yuyos', () => {
      const p=Zak.createPlayer('paco'); p.hp=Zak.getStats(p,{biome:'weeds'}).maxHealth; p.points=1;
      const before=p.hp;
      equal(Zak.upgradeStat(p,'health'),true); equal(p.stats.health,120); near(p.hp,before+5);
    });
    test('Inteligencia no tiene máximo y exige puntos disponibles', () => {
      const p=Zak.createPlayer('tena'); p.stats.intelligence=100; p.points=1;
      equal(Zak.upgradeStat(p,'intelligence'),true); equal(p.stats.intelligence,101); equal(Zak.upgradeStat(p,'strength'),false);
    });
    test('Paco gana 15% en Yuyos sin acumular ni mutar estadísticas', () => {
      const p=Zak.createPlayer('paco'); const before=JSON.stringify(p.stats);
      const a=Zak.getStats(p,{biome:'weeds'}), b=Zak.getStats(p,{biome:'weeds'});
      near(a.maxHealth,p.stats.health*1.15); near(a.strength,p.stats.strength*1.15); near(a.speed,p.stats.speed*1.15); near(a.intelligence,p.stats.intelligence*1.15); near(a.endurance,p.stats.endurance*1.15); near(a.moveSpeed,Zak.getStats(p).moveSpeed*1.15);
      near(b.strength,a.strength); equal(JSON.stringify(p.stats),before); equal(Zak.getStats(p,{biome:'village'}).strength,p.stats.strength);
    });
    test('Pulmones: descuentos sobre duración y protección', () => {
      const paco=Zak.createPlayer('paco'), fede=Zak.createPlayer('fede');
      paco.stats.endurance=100; fede.stats.endurance=100;
      near(Zak.getStats(paco).runDuration,10.8); near(Zak.getStats(paco).armor,7.2);
      near(Zak.getStats(fede).runDuration,9.6); near(Zak.getStats(fede).armor,6.4);
    });
    test('Fede activa Último aliento exactamente al 30%', () => {
      const p=Zak.createPlayer('fede'); const normal=Zak.getStats(p); p.hp=27; near(Zak.getStats(p).speed,p.stats.speed*1.15); near(Zak.getStats(p).endurance,p.stats.endurance*1.15); near(Zak.getStats(p).moveSpeed,normal.moveSpeed*1.15);
      p.hp=27.01; equal(Zak.getStats(p).speed,p.stats.speed);
    });
    test('Tena pierde 10% con tres perseguidores, sin perder vida', () => {
      const p=Zak.createPlayer('tena'); const normal=Zak.getStats(p), s=Zak.getStats(p,{pursuers:3});
      equal(s.maxHealth,normal.maxHealth); near(s.strength,normal.strength*.9); near(s.speed,normal.speed*.9); near(s.endurance,normal.endurance*.9); near(s.intelligence,normal.intelligence*.9); near(s.moveSpeed,normal.moveSpeed*.9);
      equal(Zak.getStats(p,{pursuers:2}).strength,6); equal(p.stats.strength,6);
    });
    test('Gero alcanza 125 temporales y vuelve al valor original', () => {
      const p=Zak.createPlayer('gero'); p.stats.speed=100; p.buffs.gero=5;
      equal(Zak.getStats(p).speed,125); equal(Zak.getStats(p).attackCooldown,.25); equal(p.stats.speed,100);
      p.buffs.gero=0; equal(Zak.getStats(p).attackCooldown,.5);
    });
    test('Paco gana fuerza por animales encantados solo durante la habilidad', () => {
      const p=Zak.createPlayer('paco'); p.buffs.paco=10; p.buffs.pacoAnimals=3;
      equal(Zak.getStats(p).strength,p.stats.strength+6); p.buffs.paco=0; equal(Zak.getStats(p).strength,p.stats.strength);
    });
    test('Pepe activa el aumento temporal de velocidad al derrotar', () => {
      const p=Zak.createPlayer('pepe'); const normal=Zak.getStats(p); p.buffs.pepe=3; near(Zak.getStats(p).speed,p.stats.speed*1.15); near(Zak.getStats(p).moveSpeed,normal.moveSpeed*1.15);
      p.buffs.pepe=0; equal(Zak.getStats(p).speed,p.stats.speed);
    });
    test('Dante aplica 10% menos de movimiento en cualquier banda', () => {
      const p=Zak.createPlayer('dante'); near(Zak.getStats(p).moveSpeed,Zak.speedBand(p.stats.speed).moveSpeed*.9);
      p.stats.speed=60; near(Zak.getStats(p).moveSpeed,Zak.speedBand(60).moveSpeed*.9);
    });
    test('Mordedura ralentiza movimiento sin acelerar ni demorar el ataque', () => {
      const p=Zak.createPlayer('gero'); const geroBase=Zak.getStats(p).moveSpeed; p.slow=4; near(Zak.getStats(p).moveSpeed,geroBase*.85); equal(Zak.getStats(p).attackCooldown,2);
      const pepe=Zak.createPlayer('pepe'); const pepeBase=Zak.getStats(pepe).moveSpeed; pepe.slow=4; near(Zak.getStats(pepe).moveSpeed,pepeBase*.8);
    });
    test('Enemigos escalan cada tres niveles del personaje', () => {
      [1,2,3,4,5,6,7].forEach((level,index) => equal(Zak.enemyStats('thief',level).level,[1,1,1,2,2,2,3][index]));
      const thief=Zak.enemyStats('thief',4);
      near(thief.health,44.8); near(thief.strength,5.32); near(thief.speed,18.35); near(thief.endurance,5.4);
    });
    test('Crecimientos fraccionarios y daño de veneno se conservan', () => {
      const dog=Zak.enemyStats('dog',4), snake=Zak.enemyStats('snake',4), rat=Zak.enemyStats('rat',4);
      near(dog.health,31.8); near(dog.strength,3.28); near(dog.speed,32.2); near(dog.endurance,5.35);
      near(snake.health,25.2); near(snake.strength,4.22); near(snake.poison,2.1); near(snake.speed,25.25); near(snake.endurance,3.2);
      near(rat.health,12.8); near(rat.strength,2.2); near(rat.speed,36.22); near(rat.endurance,.15);
    });
    test('Enemigos respetan los máximos incluso a niveles muy altos', () => {
      Object.keys(Zak.ENEMY_TYPES).forEach(type => {
        const s=Zak.enemyStats(type,100000), limits=Zak.ENEMY_TYPES[type].limits;
        equal(s.health,limits.health); equal(s.strength,limits.strength); equal(s.speed,limits.speed); equal(s.endurance,limits.endurance);
        equal(s.health<=200 && s.strength<=22 && s.speed<=50 && s.endurance<=30,true);
      });
    });
    test('El veneno deja de crecer en seis puntos por segundo', () => { equal(Zak.enemyStats('snake',100000).poison,6); });
    test('Armadura resta daño y conserva mínimo de un punto', () => {
      equal(Zak.damageAfterArmor(10,4),6); equal(Zak.damageAfterArmor(3,8),1); near(Zak.damageAfterArmor(10,7.2),2.8); equal(Zak.damageAfterArmor(0,0),0);
    });
    test('La espada inflige 50% de daño adicional', () => { equal(Zak.WEAPON_TYPES.sword.damageMultiplier,1.5); });
    test('Experiencia inválida no corrompe el personaje', () => {
      const p=Zak.createPlayer('tena'); equal(Zak.grantXp(p,NaN),0); equal(Zak.grantXp(p,Infinity),0); equal(Zak.grantXp(p,-20),0); equal(p.xp,0);
    });
    test('Tena corre más que los otros salvo Fede, pega menos y tiene la mayor estamina', () => {
      const all=Object.fromEntries(Zak.CHARACTERS.map(c=>[c.id,Zak.getStats(Zak.createPlayer(c.id))]));
      equal(all.tena.moveSpeed<all.fede.moveSpeed,true);
      Object.keys(all).filter(id=>id!=='tena').forEach(id=>{
        equal(all.tena.runDuration>=all[id].runDuration,true,id+' no debe superar la estamina inicial de Tena');
        equal(all.tena.endurance>all[id].endurance,true);
        equal(all.tena.strength<all[id].strength,true,id+' debe pegar más fuerte que Tena');
      });
      Object.keys(all).filter(id=>!['tena','fede'].includes(id)).forEach(id=>equal(all.tena.moveSpeed>all[id].moveSpeed,true));
      equal(all.dante.strength>all.paco.strength && all.dante.moveSpeed<all.gero.moveSpeed,true);
    });
    test('Todos ganan daño aunque inviertan únicamente en inteligencia', () => {
      Zak.CHARACTERS.forEach(c=>{
        const p=Zak.createPlayer(c.id); p.stats.intelligence=0;
        const starting=p.stats.strength; Zak.grantXp(p,100/Zak.getStats(p).xpMultiplier);
        equal(p.stats.strength,starting+(c.id==='dante'?2:1)); equal(p.points,2);
        equal(Zak.upgradeStat(p,'intelligence'),true); equal(Zak.upgradeStat(p,'intelligence'),true);
        equal(p.points,0); equal(p.stats.intelligence,2);
      });
    });
    test('Velocidad y resistencia progresan de a dos sin desperdiciar puntos al llegar al límite', () => {
      const p=Zak.createPlayer('tena'); p.points=4; p.stats.speed=97; p.stats.endurance=98;
      Zak.upgradeStat(p,'speed'); equal(p.stats.speed,99); Zak.upgradeStat(p,'speed'); equal(p.stats.speed,100);
      Zak.upgradeStat(p,'endurance'); equal(p.stats.endurance,100); equal(p.points,1);
      equal(Zak.upgradeStat(p,'endurance'),false); equal(p.points,1);
    });
    test('Perros y chorros iniciales se vencen en como máximo siete golpes sin armas', () => {
      Zak.CHARACTERS.forEach(c=>['thief','dog'].forEach(type=>{
        const s=Zak.enemyStats(type,1), hits=Math.ceil(s.health/Zak.damageAfterArmor(c.stats.strength,s.armor));
        equal(hits<=7,true,c.id+' contra '+type);
      }));
    });
    test('Invertir fuera de combate no crea enemigos imposibles en niveles 10, 50, 100 o 500', () => {
      Zak.CHARACTERS.forEach(c=>[10,50,100,500].forEach(level=>{
        const p=Zak.createPlayer(c.id); p.stats.intelligence=0;
        // Toda la XP de los niveles previos en una sola concesión; no se gasta fuerza.
        Zak.grantXp(p,((level-1)*100+25*(level-1)*(level-2))/Zak.getStats(p).xpMultiplier);
        equal(p.level,level);
        ['thief','dog','snake','rat'].forEach(type=>{
          const first=Zak.enemyStats(type,1), now=Zak.enemyStats(type,level);
          const firstHits=Math.ceil(first.health/Zak.damageAfterArmor(c.stats.strength,first.armor));
          const nowHits=Math.ceil(now.health/Zak.damageAfterArmor(p.stats.strength,now.armor));
          equal(nowHits<=firstHits,true,c.id+' contra '+type+' en nivel '+level);
        });
      }));
    });
    test('Bonos especiales de daño y movimiento se multiplican sin alterar estadísticas permanentes', () => {
      const multipliers={gero:1,paco:1,fede:2,pepe:1.5,tena:2,dante:2};
      Zak.CHARACTERS.forEach(c=>{
        const p=Zak.createPlayer(c.id), original=JSON.stringify(p.stats), normal=Zak.getStats(p);
        p.special={id:c.id,time:5}; const special=Zak.getStats(p);
        near(special.speed,normal.speed*multipliers[c.id]); near(special.moveSpeed,normal.moveSpeed*multipliers[c.id]);
        near(special.strength,normal.strength*(['paco','tena'].includes(c.id)?2:1));
        near(special.armor,normal.armor+(c.id==='gero'?4:0));
        equal(JSON.stringify(Zak.getStats(p)),JSON.stringify(special)); equal(JSON.stringify(p.stats),original);
        p.special.time=0; equal(JSON.stringify(Zak.getStats(p)),JSON.stringify(normal));
      });
    });
    test('Especiales pueden exceder los topes temporalmente y no aceptar el objeto de otro personaje', () => {
      const p=Zak.createPlayer('tena'); p.stats.speed=100; p.stats.strength=100;
      const normal=Zak.getStats(p); p.special={id:'tena',time:5};
      equal(Zak.getStats(p).speed,200); equal(Zak.getStats(p).strength,200); near(Zak.getStats(p).moveSpeed,normal.moveSpeed*2);
      p.special.id='paco'; equal(JSON.stringify(Zak.getStats(p)),JSON.stringify(normal));
      equal(p.stats.speed,100); equal(p.stats.strength,100);
    });
    test('Puchito combina su porcentaje con la pasiva de Pepe sin duplicaciones', () => {
      const p=Zak.createPlayer('pepe'); const normal=Zak.getStats(p); p.buffs.pepe=3; p.special={id:'pepe',time:5};
      near(Zak.getStats(p).moveSpeed,normal.moveSpeed*1.15*1.5); near(Zak.getStats(p).speed,p.stats.speed*1.15*1.5);
    });
    test('Hacha intercambia cadencia por daño y Pico conserva la cadencia normal', () => {
      equal(Zak.WEAPON_TYPES.axe.damageMultiplier,2); equal(Zak.WEAPON_TYPES.axe.cooldownMultiplier,1.35);
      equal(Zak.WEAPON_TYPES.pickaxe.damageMultiplier,1.25); equal(Zak.WEAPON_TYPES.pickaxe.cooldownMultiplier,1);
      equal(Zak.CRAFTING_RECIPES.pickaxe.requires.includes('stone'),true); equal(Zak.CRAFTING_RECIPES.pickaxe.cost.wood,8);
      equal(Zak.CRAFTING_RECIPES.sword.cost.metal,6);
    });
    test('Cada partida comienza con recursos e inventario independientes y sin especiales activos', () => {
      const a=Zak.createPlayer('gero'),b=Zak.createPlayer('gero');
      a.resources.wood=9; a.weaponOrigins.axe='village-axe'; equal(b.resources.wood,0); equal(b.weaponOrigins.axe,undefined);
      equal(a.special,null); equal(a.stomach,0); equal(a.balanceVersion,Zak.BALANCE_VERSION);
      Zak.CHARACTERS.forEach(c=>equal(!!Zak.SPECIAL_ITEMS[c.id].description,true));
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

