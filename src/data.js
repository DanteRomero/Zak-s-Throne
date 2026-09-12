/* Zak's Throne — reglas de combate y progresión sin dependencias. */
(function (root) {
  'use strict';
  const Zak = root.Zak = root.Zak || {};
  const clamp = (n, min, max) => Math.max(min, Math.min(max, n));
  const finite = (n, fallback = 0) => Number.isFinite(Number(n)) ? Number(n) : fallback;
  const caps = { health: 500, strength: 100, speed: 100, endurance: 100, intelligence: Infinity };
  Zak.BALANCE_VERSION = 2;
  // Bases previas para adaptar partidas sin perder las mejoras que ya compraron.
  Zak.LEGACY_CHAR_STATS = {
    gero: { health: 105, strength: 5, speed: 15, endurance: 15, intelligence: 5 },
    paco: { health: 100, strength: 6, speed: 15, endurance: 20, intelligence: 10 },
    fede: { health: 90, strength: 4, speed: 30, endurance: 5, intelligence: 15 },
    pepe: { health: 100, strength: 6, speed: 15, endurance: 15, intelligence: 15 },
    tena: { health: 100, strength: 2, speed: 20, endurance: 5, intelligence: 5 },
    dante: { health: 110, strength: 8, speed: 5, endurance: 20, intelligence: 15 }
  };

  Zak.STAT_LABELS = { health: 'Vida', strength: 'Fuerza', speed: 'Velocidad', endurance: 'Resistencia', intelligence: 'Inteligencia' };
  Zak.CHARACTERS = [
    {
      id: 'gero', name: 'Gero', title: 'El gaucho de la buena fe', color: '#83b8d3',
      stats: { health: 110, strength: 8, speed: 22, endurance: 22, intelligence: 5 },
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
      stats: { health: 115, strength: 9, speed: 22, endurance: 28, intelligence: 10 },
      ability: 'Afecto animal', abilityDescription: 'Los animales cercanos se apartan durante 10 s. Gana 2 de fuerza por cada animal encantado.',
      abilityCooldown: 30, abilityDuration: 10, abilityRadius: 180, abilityPassive: false,
      advantage: 'Campesino', advantageDescription: 'En los Yuyos aumenta todas sus estadísticas un 15%. El efecto termina al salir.',
      disadvantage: 'Pulmones desgastados', disadvantageDescription: 'Los beneficios de resistencia para correr y absorber daño son un 10% menores.',
      appearance: 'Atlético, con boina, pañuelo rojo, bombachas de campo y ropa gaucha.'
    },
    {
      id: 'fede', name: 'Fede', title: 'Una última oportunidad', color: '#df6d64',
      stats: { health: 90, strength: 7, speed: 35, endurance: 8, intelligence: 15 },
      ability: 'Último aliento', abilityDescription: 'Pasiva: al quedar con 30% de vida o menos gana 15% de velocidad y resistencia.',
      abilityCooldown: 0, abilityPassive: true,
      advantage: 'Acostumbrado a las mujeres', advantageDescription: 'Las mordeduras de serpiente tienen solo un 15% de probabilidad de envenenarlo.',
      disadvantage: 'Asmático crónico', disadvantageDescription: 'Los beneficios de resistencia para correr y absorber daño son un 20% menores.',
      appearance: 'Flaco, con traje rojo y azul inspirado en un superhéroe arácnido.'
    },
    {
      id: 'pepe', name: 'Pepe', title: 'El pollo que devora mundos', color: '#f3cd77',
      stats: { health: 110, strength: 9, speed: 24, endurance: 22, intelligence: 15 },
      ability: 'DeboraMundos', abilityDescription: 'Pasiva: cada enemigo derrotado le devuelve 5 de vida y le da 15% de velocidad durante 3 s.',
      abilityCooldown: 0, abilityDuration: 3, abilityPassive: true,
      advantage: 'Genética pura', advantageDescription: 'Gana un 50% más de experiencia, incluido el aumento de inteligencia.',
      disadvantage: 'Sarnoso', disadvantageDescription: 'Los perros le hacen 10% más daño y lo ralentizan un 20% en total.',
      appearance: 'Atlético, con disfraz amarillo de pollo, cresta roja y zapatillas.'
    },
    {
      id: 'tena', name: 'Tena', title: 'Siete razones para bailar', color: '#df7c7c',
      stats: { health: 115, strength: 6, speed: 30, endurance: 45, intelligence: 10 },
      ability: 'Baile del 7-0', abilityDescription: 'Los enemigos en un radio de 145 píxeles bailan durante 7 s: no se mueven ni atacan.',
      abilityCooldown: 26, abilityDuration: 7, abilityRadius: 145, abilityPassive: false,
      advantage: 'Felino en serie', advantageDescription: 'Las ratas huyen de él.',
      disadvantage: 'Miedoso', disadvantageDescription: 'Con 3 o más enemigos persiguiéndolo, pierde 10% en todas las estadísticas salvo vida.',
      appearance: 'Flaco, de pelo oscuro, con camiseta roja y blanca de Estudiantes de La Plata.'
    },
    {
      id: 'dante', name: 'Dante', title: 'Pocas palabras, tres golpes', color: '#b9a0dc',
      stats: { health: 130, strength: 12, speed: 12, endurance: 32, intelligence: 15 },
      ability: 'Tobi', abilityDescription: 'Golpea el suelo con un enorme bastón de carne tres veces. Cada onda inflige 10 de daño a los enemigos cercanos.',
      abilityCooldown: 28, abilityDuration: 1.6, abilityRadius: 165, abilityPassive: false,
      advantage: 'Fuerza estratégica', advantageDescription: 'Cada nivel gana 2 de fuerza automática (los demás ganan 1), además de 2 puntos para elegir mejoras.',
      disadvantage: 'Paso pesado', disadvantageDescription: 'Su velocidad de movimiento final es un 10% menor.',
      appearance: 'Robusto, con barba, anteojos y remera violeta de informático.'
    }
  ];

  Zak.ENEMY_TYPES = {
    thief: {
      name: 'Chorro', base: { health: 42, strength: 5, speed: 18, endurance: 5 },
      growth: { health: 2.8, strength: 0.32, speed: 0.35, endurance: 0.4 },
      limits: { health: 180, strength: 20, speed: 40, endurance: 28 },
      xp: 48, color: '#bb707e', visionRange: 195, knockback: false,
      description: 'Persigue y ataca con su cuchillo. No retrocede al recibir golpes.'
    },
    dog: {
      name: 'Perro callejero', base: { health: 30, strength: 3, speed: 32, endurance: 5 },
      growth: { health: 1.8, strength: 0.28, speed: 0.2, endurance: 0.35 },
      limits: { health: 130, strength: 16, speed: 48, endurance: 24 },
      xp: 40, color: '#b68a63', visionRange: 195, knockback: true,
      description: 'Su mordedura reduce 15% el movimiento durante 4 s.'
    },
    snake: {
      name: 'Serpiente', base: { health: 24, strength: 4, poison: 2, speed: 25, endurance: 3 },
      growth: { health: 1.2, strength: 0.22, poison: 0.1, speed: 0.25, endurance: 0.2 },
      limits: { health: 100, strength: 14, poison: 6, speed: 42, endurance: 18 },
      xp: 28, color: '#83b35b', visionRange: 195, knockback: true,
      description: '40% de probabilidad de aplicar veneno durante 5 s. El veneno ignora la armadura.'
    },
    rat: {
      name: 'Rata', base: { health: 12, strength: 2, speed: 36, endurance: 0 },
      growth: { health: 0.8, strength: 0.2, speed: 0.22, endurance: 0.15 },
      limits: { health: 70, strength: 12, speed: 50, endurance: 15 },
      xp: 16, color: '#a6a0b7', visionRange: 195, knockback: true,
      description: 'Se prende del cuerpo durante 3 s y después salta para volver a acercarse.'
    }
  };

  Zak.WEAPON_TYPES = {
    fists: { name: 'Puños', damageMultiplier: 1, range: 36, description: 'Un buen golpe a corta distancia.' },
    sword: { name: 'Espada', damageMultiplier: 1.5, range: 55, biome: 'weeds', description: '50% de daño adicional y mayor alcance.' },
    bow: { name: 'Arco', damageMultiplier: 1, range: 350, chargeTime: 0.7, biome: 'village', description: 'Dispara a distancia. Hay que tensarlo entre flechas.' },
    stone: { name: 'Piedra', damageMultiplier: 1, range: 220, walkToReload: 2, biome: 'cave', description: 'Una munición; caminar durante 2 s recarga el siguiente tiro.' },
    axe: { name: 'Hacha', damageMultiplier: 2, range: 48, cooldownMultiplier: 1.35, biome: 'village', description: 'El doble de daño, con 35% más tiempo entre golpes. Permite talar árboles.' },
    pickaxe: { name: 'Pico', damageMultiplier: 1.25, range: 44, cooldownMultiplier: 1, description: '25% de daño adicional. Permite extraer piedra y metal en la cueva.' }
  };

  Zak.CRAFTING_RECIPES = {
    pickaxe: { name: 'Pico', requires: ['stone'], cost: { wood: 8 }, weapon: 'pickaxe' },
    sword: { name: 'Espada', requires: ['pickaxe'], cost: { wood: 4, metal: 6 }, weapon: 'sword' }
  };

  Zak.SPECIAL_ITEMS = {
    gero: { name: 'Capuchón', color: '#edb5a5', description: '5 s: +4 de defensa y escudo de 40% de vida máxima. El escudo recibe daño sin reducción.' },
    paco: { name: 'Leche de ¿Vaca?', color: '#f6f1d6', description: 'Cura toda la vida y duplica el daño durante 5 s. Deja un charco que ralentiza enemigos 50%.' },
    fede: { name: 'Puff', color: '#76c6e5', description: '5 s: energía infinita y velocidad doble. Correr sobre un enemigo le hace daño.' },
    pepe: { name: 'Puchito', color: '#c7c2ba', description: 'Cura 35% de vida máxima. 5 s: +50% de velocidad y humo que daña y reduce la visión enemiga.' },
    tena: { name: 'Arroz Chufa Picante', color: '#f5a153', description: '5 s de daño y velocidad dobles; después 1 s de retorcijones y una explosión que quema enemigos y cuesta 10 de vida.' },
    dante: { name: 'Caramelo Media-Hora', color: '#a995d7', description: 'Congela enemigos cercanos y duplica la velocidad por 5 s. Al terminar causa 3 de daño por intoxicación.' }
  };

  Zak.speedBand = function (speed) {
    speed = Math.max(0, finite(speed));
    // Cada punto mejora el movimiento; las bandas conservan su cadencia de ataque.
    const moveSpeed = 60 + speed * 1.5;
    if (speed < 15) return { tier: 0, moveSpeed, attackCooldown: 3, label: 'Lenta' };
    if (speed < 30) return { tier: 1, moveSpeed, attackCooldown: 2, label: 'Moderada' };
    if (speed < 60) return { tier: 2, moveSpeed, attackCooldown: 1, label: 'Normal' };
    if (speed <= 100) return { tier: 3, moveSpeed, attackCooldown: 0.5, label: 'Rápida' };
    return { tier: 4, moveSpeed, attackCooldown: 0.25, label: 'Extraordinaria' };
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
      characterId: character.id, name: character.name, level: 1, xp: 0, points: 0, balanceVersion: Zak.BALANCE_VERSION,
      stats: { ...character.stats }, hp: character.stats.health,
      stamina: 1, exhausted: 0, restTime: 0, poison: null, slow: 0,
      buffs: { gero: 0, pepe: 0, paco: 0, pacoAnimals: 0 },
      weapon: 'fists', weapons: ['fists'], weaponOrigins: {}, resources: { wood: 0, stone: 0, metal: 0 }, special: null, stomach: 0, kills: 0, deaths: 0,
      abilityCooldown: 0, attackCooldown: 0,
      stoneAmmo: 1, stoneWalkTime: 0, bowCharge: 0,
      playTime: 0, discovered: ['village']
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
    const special = player.special && player.special.id === id && finite(player.special.time) > 0;
    const specialSpeedFactor = special ? (id === 'pepe' ? 1.5 : id === 'gero' || id === 'paco' ? 1 : 2) : 1;
    speed *= specialSpeedFactor;
    if (special && (id === 'paco' || id === 'tena')) strength *= 2;
    const movement = Zak.speedBand(speed);
    const resistance = Zak.enduranceBand(endurance);
    const resistanceFactor = id === 'paco' ? 0.9 : id === 'fede' ? 0.8 : 1;
    const intelligenceBonus = Math.floor(intelligence / 10) * 0.2;
    const xpMultiplier = (id === 'gero' ? 0.75 + intelligenceBonus : 1 + intelligenceBonus) * (id === 'pepe' ? 1.5 : 1);
    // Los porcentajes de habilidades multiplican el movimiento real, incluso
    // dentro de una banda. Un Puff duplica tanto la stat como el paso final.
    const movementBase = Zak.speedBand(baseSpeed + (id === 'gero' && finite(buffs.gero) > 0 ? 25 : 0)).moveSpeed;
    const temporaryMovementFactor = id === 'gero' || baseSpeed === 0 ? specialSpeedFactor : speed / baseSpeed;
    let moveSpeed = movementBase * temporaryMovementFactor * (id === 'dante' ? 0.9 : 1);
    if (finite(player.slow) > 0) moveSpeed *= (id === 'pepe' ? 0.8 : 0.85);
    return {
      maxHealth: Math.min(500, health), strength, speed, endurance, intelligence,
      moveSpeed, attackCooldown: movement.attackCooldown,
      runDuration: resistance.runDuration * resistanceFactor,
      armor: resistance.armor * resistanceFactor + (special && id === 'gero' ? 4 : 0),
      xpMultiplier, speedTier: movement.tier, speedLabel: movement.label
    };
  };

  Zak.enemyStats = function (type, playerLevel) {
    const definition = Zak.ENEMY_TYPES[type];
    if (!definition) throw new Error('Tipo de enemigo desconocido: ' + type);
    const level = 1 + Math.floor((Math.max(1, Math.floor(finite(playerLevel, 1))) - 1) / 3);
    const increases = level - 1;
    const stats = { level, intelligence: 0 };
    Object.keys(definition.base).forEach(key => {
      stats[key] = Math.min(definition.limits[key], definition.base[key] + definition.growth[key] * increases);
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
      player.points += 2;
      player.stats.health = Math.min(500, player.stats.health + 2);
      player.stats.strength = Math.min(100, player.stats.strength + (player.characterId === 'dante' ? 2 : 1));
      player.hp = Math.min(Zak.getStats(player, context).maxHealth, player.hp + 2);
      gained += 1;
    }
    return gained;
  };

  Zak.upgradeStat = function (player, key) {
    if (!(key in caps) || !Object.prototype.hasOwnProperty.call(caps, key) || player.points < 1) return false;
    const old = finite(player.stats[key]);
    if (old >= caps[key]) return false;
    const increase = key === 'health' ? 5 : key === 'speed' || key === 'endurance' ? 2 : 1;
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

