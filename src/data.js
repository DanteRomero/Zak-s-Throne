/* Zak's Throne — reglas de combate y progresión sin dependencias. */
(function (root) {
  'use strict';
  const Zak = root.Zak = root.Zak || {};
  const clamp = (n, min, max) => Math.max(min, Math.min(max, n));
  const finite = (n, fallback = 0) => Number.isFinite(Number(n)) ? Number(n) : fallback;
  const caps = { health: 500, strength: 100, speed: 100, endurance: 100, intelligence: Infinity };

  Zak.STAT_LABELS = { health: 'Vida', strength: 'Fuerza', speed: 'Velocidad', endurance: 'Resistencia', intelligence: 'Inteligencia' };
  Zak.CHARACTERS = [
    {
      id: 'gero', name: 'Gero', title: 'El gaucho de la buena fe', color: '#83b8d3',
      stats: { health: 105, strength: 5, speed: 15, endurance: 15, intelligence: 5 },
      ability: 'Fé Judía', abilityDescription: 'Durante 5 s recupera 5 de vida por segundo y gana 25 de velocidad. Puede alcanzar una banda adicional sobre 100.',
      abilityCooldown: 25, abilityDuration: 5, abilityPassive: false,
      advantage: 'Entre gauchos no nos pisamos los ponchos',
      advantageDescription: 'Las ratas lo ignoran hasta que él las golpea.',
      disadvantage: 'Inseguridad',
      disadvantageDescription: 'Su multiplicador de experiencia empieza en ×0,75. Cada 10 de inteligencia suma ×0,20.',
      appearance: 'Atlético, de rulos oscuros y pequeña kipá azul.'
    },
    {
      id: 'paco', name: 'Paco', title: 'El amigo de los bichos', color: '#d6ac65',
      stats: { health: 100, strength: 6, speed: 15, endurance: 20, intelligence: 10 },
      ability: 'Afecto animal', abilityDescription: 'Los animales cercanos se apartan durante 10 s. Gana 2 de fuerza por cada animal encantado.',
      abilityCooldown: 30, abilityDuration: 10, abilityRadius: 180, abilityPassive: false,
      advantage: 'Campesino', advantageDescription: 'En los Yuyos aumenta todas sus estadísticas un 15%. El efecto termina al salir.',
      disadvantage: 'Pulmones desgastados', disadvantageDescription: 'Los beneficios de resistencia para correr y absorber daño son un 10% menores.',
      appearance: 'Atlético, con boina, pañuelo rojo, bombachas de campo y ropa gaucha.'
    },
    {
      id: 'fede', name: 'Fede', title: 'Una última oportunidad', color: '#df6d64',
      stats: { health: 90, strength: 4, speed: 30, endurance: 5, intelligence: 15 },
      ability: 'Último aliento', abilityDescription: 'Pasiva: al quedar con 30% de vida o menos gana 15% de velocidad y resistencia.',
      abilityCooldown: 0, abilityPassive: true,
      advantage: 'Acostumbrado a las mujeres', advantageDescription: 'Las mordeduras de serpiente tienen solo un 15% de probabilidad de envenenarlo.',
      disadvantage: 'Asmático crónico', disadvantageDescription: 'Los beneficios de resistencia para correr y absorber daño son un 20% menores.',
      appearance: 'Flaco, con traje rojo y azul inspirado en un superhéroe arácnido.'
    },
    {
      id: 'pepe', name: 'Pepe', title: 'El pollo que devora mundos', color: '#f3cd77',
      stats: { health: 100, strength: 6, speed: 15, endurance: 15, intelligence: 15 },
      ability: 'DeboraMundos', abilityDescription: 'Pasiva: cada enemigo derrotado le devuelve 5 de vida y le da 15% de velocidad durante 3 s.',
      abilityCooldown: 0, abilityDuration: 3, abilityPassive: true,
      advantage: 'Genética pura', advantageDescription: 'Gana un 50% más de experiencia, incluido el aumento de inteligencia.',
      disadvantage: 'Sarnoso', disadvantageDescription: 'Los perros le hacen 10% más daño y lo ralentizan un 20% en total.',
      appearance: 'Atlético, con disfraz amarillo de pollo, cresta roja y zapatillas.'
    },
    {
      id: 'tena', name: 'Tena', title: 'Siete razones para bailar', color: '#df7c7c',
      stats: { health: 100, strength: 2, speed: 20, endurance: 5, intelligence: 5 },
      ability: 'Baile del 7-0', abilityDescription: 'Los enemigos en un radio de 145 píxeles bailan durante 7 s: no se mueven ni atacan.',
      abilityCooldown: 26, abilityDuration: 7, abilityRadius: 145, abilityPassive: false,
      advantage: 'Felino en serie', advantageDescription: 'Las ratas huyen de él.',
      disadvantage: 'Miedoso', disadvantageDescription: 'Con 3 o más enemigos persiguiéndolo, pierde 10% en todas las estadísticas salvo vida.',
      appearance: 'Flaco, de pelo oscuro, con camiseta roja y blanca de Estudiantes de La Plata.'
    },
    {
      id: 'dante', name: 'Dante', title: 'Pocas palabras, tres golpes', color: '#b9a0dc',
      stats: { health: 110, strength: 8, speed: 5, endurance: 20, intelligence: 15 },
      ability: 'Tobi', abilityDescription: 'Golpea el suelo con un enorme bastón de carne tres veces. Cada onda inflige 10 de daño a los enemigos cercanos.',
      abilityCooldown: 28, abilityDuration: 1.6, abilityRadius: 165, abilityPassive: false,
      advantage: 'Fuerza estratégica', advantageDescription: 'Cada nivel suma 1 de fuerza automáticamente y concede un punto para la estadística elegida.',
      disadvantage: 'Paso pesado', disadvantageDescription: 'Su velocidad de movimiento final es un 10% menor.',
      appearance: 'Robusto, con barba, anteojos y remera violeta de informático.'
    }
  ];

  Zak.ENEMY_TYPES = {
    thief: {
      name: 'Chorro', base: { health: 100, strength: 5, speed: 15, endurance: 10 },
      growth: { health: 3, strength: 1, speed: 2, endurance: 2 },
      xp: 48, coins: [5, 9], color: '#bb707e', visionRange: 195, knockback: false,
      description: 'Persigue y ataca con su cuchillo. No retrocede al recibir golpes.'
    },
    dog: {
      name: 'Perro callejero', base: { health: 90, strength: 3, speed: 30, endurance: 20 },
      growth: { health: 2, strength: 0.5, speed: 3, endurance: 2 },
      xp: 40, coins: [2, 4], color: '#b68a63', visionRange: 195, knockback: true,
      description: 'Su mordedura reduce 15% el movimiento durante 4 s.'
    },
    snake: {
      name: 'Serpiente', base: { health: 35, strength: 5, poison: 2, speed: 25, endurance: 5 },
      growth: { health: 1, strength: 2, poison: 1, speed: 2, endurance: 0.5 },
      xp: 28, coins: [2, 5], color: '#83b35b', visionRange: 195, knockback: true,
      description: '40% de probabilidad de aplicar veneno durante 5 s. El veneno ignora la armadura.'
    },
    rat: {
      name: 'Rata', base: { health: 10, strength: 1, speed: 40, endurance: 0 },
      growth: { health: 0.5, strength: 2, speed: 2, endurance: 0.5 },
      xp: 16, coins: [1, 2], color: '#a6a0b7', visionRange: 195, knockback: true,
      description: 'Se prende del cuerpo durante 3 s y después salta para volver a acercarse.'
    },
    capo: {
      name: 'El Capo del Eco', boss: true, base: { health: 340, strength: 9, speed: 20, endurance: 30 },
      growth: { health: 40, strength: 2, speed: 2, endurance: 3 },
      xp: 240, coins: [45, 60], color: '#c99a5c', visionRange: 230, knockback: false, respawn: 180,
      description: 'Jefe de la cueva. Avisa con una línea roja y embiste: rodá hacia un costado.'
    },
    yarara: {
      name: 'La Yarará Madre', boss: true, base: { health: 260, strength: 7, poison: 4, speed: 25, endurance: 15 },
      growth: { health: 30, strength: 2, poison: 1, speed: 2, endurance: 2 },
      xp: 220, coins: [40, 55], color: '#9d7fc4', visionRange: 230, knockback: false, respawn: 180,
      description: 'Jefa de Los Yuyos. Mantiene distancia y escupe tres chorros de veneno en abanico.'
    }
  };

  // Precios de El Almacén. Las mejoras permanentes encarecen con cada compra.
  Zak.SHOP_ITEMS = [
    { id: 'herb', name: 'Hierba medicinal', icon: '❦', detail: 'Va a la bolsa (máx. 5). R la usa: cura y quita el veneno.', price: () => 10 },
    { id: 'mate', name: 'Mate cebado', icon: '☕', detail: 'Energía al máximo y +10% de movimiento durante 30 s.', price: () => 6 },
    { id: 'sharpen', name: 'Afilar y tensar', icon: '⚒', detail: '+10% de daño con todas las armas. Hasta 5 veces.', price: p => 30 + p.sharpen * 30 },
    { id: 'lesson', name: 'Clase con Beto', icon: '✎', detail: '+1 punto de mejora para tu ficha.', price: p => 60 + p.lessons * 40 }
  ];
  Zak.HERB_BAG = 5;

  Zak.WEAPON_TYPES = {
    fists: { name: 'Puños', damageMultiplier: 1, range: 36, description: 'Un buen golpe a corta distancia.' },
    sword: { name: 'Espada', damageMultiplier: 1.5, range: 55, biome: 'weeds', description: '50% de daño adicional y mayor alcance.' },
    bow: { name: 'Arco', damageMultiplier: 1, range: 350, chargeTime: 0.7, biome: 'village', description: 'Dispara a distancia. Hay que tensarlo entre flechas.' },
    stone: { name: 'Piedra', damageMultiplier: 1, range: 220, walkToReload: 2, biome: 'cave', description: 'Una munición; caminar durante 2 s recarga el siguiente tiro.' }
  };

  Zak.speedBand = function (speed) {
    speed = Math.max(0, finite(speed));
    if (speed < 15) return { tier: 0, moveSpeed: 72, attackCooldown: 3, label: 'Lenta' };
    if (speed < 30) return { tier: 1, moveSpeed: 92, attackCooldown: 2, label: 'Moderada' };
    if (speed < 60) return { tier: 2, moveSpeed: 118, attackCooldown: 1, label: 'Normal' };
    if (speed <= 100) return { tier: 3, moveSpeed: 148, attackCooldown: 0.5, label: 'Rápida' };
    return { tier: 4, moveSpeed: 178, attackCooldown: 0.25, label: 'Extraordinaria' };
  };

  Zak.enduranceBand = function (endurance) {
    endurance = clamp(finite(endurance), 0, 100);
    if (endurance < 15) return { tier: 0, runDuration: 3, armor: 0 };
    if (endurance < 30) return { tier: 1, runDuration: 5, armor: 2 };
    if (endurance < 60) return { tier: 2, runDuration: 7, armor: 4 };
    if (endurance < 80) return { tier: 3, runDuration: 10, armor: 6 };
    return { tier: 4, runDuration: 12, armor: 8 };
  };

  Zak.createPlayer = function (id) {
    const character = Zak.CHARACTERS.find(c => c.id === id) || Zak.CHARACTERS[0];
    return {
      characterId: character.id, name: character.name, level: 1, xp: 0, points: 0,
      stats: { ...character.stats }, hp: character.stats.health,
      stamina: 1, exhausted: 0, restTime: 0, poison: null, slow: 0,
      buffs: { gero: 0, pepe: 0, paco: 0, pacoAnimals: 0, mate: 0 },
      weapon: 'fists', weapons: ['fists'], kills: 0, deaths: 0,
      abilityCooldown: 0, attackCooldown: 0,
      stoneAmmo: 1, stoneWalkTime: 0, bowCharge: 0,
      playTime: 0, discovered: ['village'],
      coins: 0, herbs: 0, sharpen: 0, lessons: 0,
      combo: 0, comboTime: 0, roll: 0, rollCooldown: 0, rollX: 0, rollY: 1
    };
  };

  Zak.getStats = function (player, context = {}) {
    const id = player.characterId;
    const s = player.stats || {};
    const buffs = player.buffs || {};
    const biome = context.biome || 'village';
    let health = clamp(finite(s.health, 100), 1, 500);
    let strength = clamp(finite(s.strength, 1), 0, 100);
    let speed = clamp(finite(s.speed, 1), 0, 100);
    const baseSpeed = speed;
    let endurance = clamp(finite(s.endurance), 0, 100);
    let intelligence = Math.max(0, finite(s.intelligence));

    if (id === 'paco' && (biome === 'weeds' || biome === 'yuyos')) {
      health *= 1.15; strength *= 1.15; speed *= 1.15; endurance *= 1.15; intelligence *= 1.15;
    }
    if (id === 'tena' && finite(context.pursuers) >= 3) {
      strength *= 0.9; speed *= 0.9; endurance *= 0.9; intelligence *= 0.9;
    }
    if (id === 'fede' && finite(player.hp) <= Math.min(500, health) * 0.3) {
      speed *= 1.15; endurance *= 1.15;
    }
    if (id === 'pepe' && finite(buffs.pepe) > 0) speed *= 1.15;
    if (id === 'paco' && finite(buffs.paco) > 0) strength += Math.max(0, finite(buffs.pacoAnimals)) * 2;
    strength = Math.min(100, strength);
    speed = Math.min(100, speed);
    endurance = Math.min(100, endurance);
    if (id === 'gero' && finite(buffs.gero) > 0) speed += 25;
    const movement = Zak.speedBand(speed);
    const resistance = Zak.enduranceBand(endurance);
    const resistanceFactor = id === 'paco' ? 0.9 : id === 'fede' ? 0.8 : 1;
    const intelligenceBonus = Math.floor(intelligence / 10) * 0.2;
    const xpMultiplier = (id === 'gero' ? 0.75 + intelligenceBonus : 1 + intelligenceBonus) * (id === 'pepe' ? 1.5 : 1);
    // Las bandas fijan el paso base. Los porcentajes temporales afectan directamente
    // al movimiento, incluso cuando el valor de velocidad sigue en la misma banda.
    const movementBase = Zak.speedBand(baseSpeed + (id === 'gero' && finite(buffs.gero) > 0 ? 25 : 0)).moveSpeed;
    const temporaryMovementFactor = id === 'gero' || baseSpeed === 0 ? 1 : speed / baseSpeed;
    let moveSpeed = movementBase * temporaryMovementFactor * (id === 'dante' ? 0.9 : 1);
    if (finite(player.slow) > 0) moveSpeed *= (id === 'pepe' ? 0.8 : 0.85);
    if (finite(buffs.mate) > 0) moveSpeed *= 1.1;
    return {
      maxHealth: Math.min(500, health), strength, speed, endurance, intelligence,
      moveSpeed, attackCooldown: movement.attackCooldown,
      runDuration: resistance.runDuration * resistanceFactor,
      armor: resistance.armor * resistanceFactor,
      xpMultiplier, speedTier: movement.tier, speedLabel: movement.label,
      damageMultiplier: 1 + 0.1 * clamp(Math.floor(finite(player.sharpen)), 0, 5)
    };
  };

  Zak.enemyStats = function (type, playerLevel) {
    const definition = Zak.ENEMY_TYPES[type];
    if (!definition) throw new Error('Tipo de enemigo desconocido: ' + type);
    const level = 1 + Math.floor((Math.max(1, Math.floor(finite(playerLevel, 1))) - 1) / 2);
    const increases = level - 1;
    const stats = { level, intelligence: 0 };
    Object.keys(definition.base).forEach(key => {
      stats[key] = Math.min(key === 'poison' ? 100 : caps[key] || Infinity, definition.base[key] + definition.growth[key] * increases);
    });
    stats.maxHealth = stats.health;
    stats.moveSpeed = Zak.speedBand(stats.speed).moveSpeed;
    stats.attackCooldown = Zak.speedBand(stats.speed).attackCooldown;
    stats.armor = Zak.enduranceBand(stats.endurance).armor;
    stats.xp = definition.xp + increases * Math.ceil(definition.xp * 0.15);
    return stats;
  };

  Zak.xpNeeded = function (level) {
    return 100 + (Math.max(1, Math.floor(finite(level, 1))) - 1) * 50;
  };

  Zak.grantXp = function (player, raw, context = {}) {
    const amount = Math.max(0, finite(raw)) * Zak.getStats(player, context).xpMultiplier;
    player.xp = Math.max(0, finite(player.xp)) + amount;
    player.level = Math.max(1, Math.floor(finite(player.level, 1)));
    player.points = Math.max(0, Math.floor(finite(player.points)));
    let gained = 0;
    while (player.xp + 1e-9 >= Zak.xpNeeded(player.level)) {
      player.xp = Math.max(0, player.xp - Zak.xpNeeded(player.level));
      player.level += 1;
      player.points += 1;
      player.stats.health = Math.min(500, player.stats.health + 2);
      if (player.characterId === 'dante') player.stats.strength = Math.min(100, player.stats.strength + 1);
      player.hp = Math.min(Zak.getStats(player, context).maxHealth, player.hp + 2);
      gained += 1;
    }
    return gained;
  };

  Zak.upgradeStat = function (player, key) {
    if (!(key in caps) || !Object.prototype.hasOwnProperty.call(caps, key) || player.points < 1) return false;
    const old = finite(player.stats[key]);
    if (old >= caps[key]) return false;
    const increase = key === 'health' ? 5 : 1;
    player.stats[key] = Math.min(caps[key], old + increase);
    player.points -= 1;
    if (key === 'health') player.hp = Math.min(500, player.hp + player.stats.health - old);
    return true;
  };

  Zak.damageAfterArmor = function (raw, armor) {
    raw = Math.max(0, finite(raw));
    if (!raw) return 0;
    return Math.max(1, raw - Math.max(0, finite(armor)));
  };
})(typeof window !== 'undefined' ? window : globalThis);

