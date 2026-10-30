/* Zak's Throne — reglas de combate y progresión sin dependencias. */
(function (root) {
  'use strict';
  const Zak = root.Zak = root.Zak || {};
  const clamp = (n, min, max) => Math.max(min, Math.min(max, n));
  const finite = (n, fallback = 0) => Number.isFinite(Number(n)) ? Number(n) : fallback;
  // Topes solo para los enemigos: el personaje no tiene máximos en ninguna estadística.
  const caps = { strength: 100, speed: 100, endurance: 100 };

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

  // Los enemigos tienen el mismo nivel que el personaje; los crecimientos son por nivel.
  Zak.ENEMY_TYPES = {
    thief: {
      name: 'Chorro', base: { health: 100, strength: 5, speed: 15, endurance: 10 },
      growth: { health: 1.5, strength: 0.5, speed: 1, endurance: 1 },
      xp: 48, coins: [5, 9], color: '#bb707e', visionRange: 195, knockback: false,
      description: 'Persigue y ataca con su cuchillo. No retrocede al recibir golpes.'
    },
    dog: {
      name: 'Perro callejero', base: { health: 60, strength: 3, speed: 30, endurance: 20 },
      growth: { health: 0.75, strength: 0.25, speed: 1.5, endurance: 1 },
      xp: 40, coins: [2, 4], color: '#b68a63', visionRange: 195, knockback: true,
      description: 'Su mordedura reduce 15% el movimiento durante 4 s.'
    },
    snake: {
      name: 'Serpiente', base: { health: 35, strength: 5, poison: 2, speed: 25, endurance: 5 },
      growth: { health: 0.5, strength: 1, poison: 0.5, speed: 1, endurance: 0.25 },
      xp: 28, coins: [2, 5], color: '#83b35b', visionRange: 195, knockback: true,
      description: '40% de probabilidad de aplicar veneno durante 5 s. El veneno ignora la armadura.'
    },
    rat: {
      name: 'Rata', base: { health: 10, strength: 1, speed: 40, endurance: 0 },
      growth: { health: 0.25, strength: 0.4, speed: 1, endurance: 0.25 },
      xp: 16, coins: [1, 2], color: '#a6a0b7', visionRange: 195, knockback: true,
      description: 'Se prende del cuerpo durante 3 s y después salta para volver a acercarse. Prendida muerde más despacio y más suave.'
    },
    bat: {
      name: 'Murciélago', base: { health: 40, strength: 6, speed: 45, endurance: 15 },
      growth: { health: 1.5, strength: 0.5, speed: 1, endurance: 0.5 },
      xp: 50, coins: [4, 8], color: '#7d6f96', visionRange: 210, knockback: true,
      description: 'Vuela en zigzag y muerde rápido. Vive en la Cueva Profunda.'
    },
    spider: {
      name: 'Araña', base: { health: 35, strength: 6, poison: 4, speed: 26, endurance: 35 },
      growth: { health: 0.5, strength: 0.4, poison: 0.5, speed: 0.5, endurance: 1 },
      xp: 70, coins: [6, 10], color: '#6b5a52', visionRange: 195, knockback: true,
      description: '15% de probabilidad de envenenar durante 5 s. Caparazón duro: conviene un arma mejorada.'
    },
    worm: {
      name: 'Gusano de tierra', base: { health: 100, strength: 10, speed: 18, endurance: 62 },
      growth: { health: 4, strength: 0.75, speed: 0.5, endurance: 1 },
      xp: 140, coins: [12, 20], color: '#b87a6a', visionRange: 170, knockback: false, respawn: 90,
      description: 'Espera enterrado y sale cuando te acercás. Muy fuerte y blindado: entrá con armas de hierro o mejores.'
    },
    skeleton: {
      name: 'Esqueleto con escudo', base: { health: 100, strength: 14, speed: 8, endurance: 35 },
      growth: { health: 1.5, strength: 0.8, speed: 0.2, endurance: 1 },
      xp: 60, coins: [5, 9], color: '#d8d2bd', visionRange: 195, knockback: false, block: 0.15,
      description: 'Lento, pero pega fuerte. Tiene 15% de probabilidad de bloquear tu golpe con el escudo.'
    },
    archer: {
      name: 'Esqueleto arquero', base: { health: 1, strength: 7, speed: 30, endurance: 0 },
      growth: { health: 0, strength: 0.5, speed: 0.5, endurance: 0 },
      xp: 30, coins: [2, 4], color: '#cfc8b0', visionRange: 260, knockback: true, ranged: true, fixedHealth: true,
      description: 'Dispara flechas y siempre trata de mantener la distancia. Se rompe de un golpe.'
    },
    capo: {
      name: 'El Capo del Eco', boss: true, base: { health: 520, strength: 12, speed: 22, endurance: 35 },
      growth: { health: 30, strength: 0.8, speed: 1, endurance: 1.5 },
      xp: 260, coins: [45, 60], color: '#c99a5c', visionRange: 230, knockback: false, respawn: 180, drop: 'ring',
      description: 'Custodia la bajada a la Cueva Profunda: mientras esté vivo no se baja. Avisa con una línea roja y embiste: rodá hacia un costado.'
    },
    yarara: {
      name: 'La Yarará Madre', boss: true, base: { health: 480, strength: 10, poison: 5, speed: 28, endurance: 20 },
      growth: { health: 28, strength: 0.8, poison: 0.5, speed: 1, endurance: 1 },
      xp: 240, coins: [40, 55], color: '#9d7fc4', visionRange: 230, knockback: false, respawn: 180, drop: 'fang',
      description: 'Jefa de Los Yuyos. Te persigue y da colazos alrededor suyo; antes de escupir tres chorros de veneno, retrocede un poco.'
    },
    vampire: {
      name: 'El Chupasangre', boss: true, base: { health: 900, strength: 15, speed: 35, endurance: 40 },
      growth: { health: 40, strength: 0.9, speed: 0.8, endurance: 1 },
      xp: 420, coins: [70, 95], color: '#a13a4a', visionRange: 240, knockback: false, respawn: 240, drop: 'claw',
      description: 'Custodia la bajada a Las Entrañas. Embestida sangrienta: si te agarra te chupa la sangre y se cura. Manotazo doble de cerca. Se aleja e invoca cinco murciélagos.'
    },
    golem: {
      name: 'El Gólem Minero', boss: true, base: { health: 420, strength: 22, speed: 10, endurance: 65 },
      growth: { health: 28, strength: 1, speed: 0.2, endurance: 0.8 },
      xp: 600, coins: [90, 120], color: '#8a8f96', visionRange: 230, knockback: false, respawn: 300, drop: 'elemental', lives: 4,
      description: 'Cuatro vidas: piedra, hierro, oro y diamante, cada una más fuerte. Terremoto de cuatro golpes, piedrazo que aturde 3 s y refuerzo invencible por 5 s.'
    },
    cerbero: {
      name: 'Cerbero', boss: true, base: { health: 1600, strength: 20, speed: 62, endurance: 50 },
      growth: { health: 70, strength: 0.9, speed: 0.5, endurance: 1 },
      xp: 800, coins: [120, 160], color: '#5a4652', visionRange: 250, knockback: false, respawn: 600, drop: 'eye',
      description: 'Custodia el altar de ofrendas: mientras vive, el altar está cerrado. Su mordida desangra; salta y aterriza encima tuyo; si escarba 3 s sin que le pegues, se cura entero.'
    },
    zak: {
      name: 'Zak', boss: true, base: { health: 10000, strength: 40, speed: 22, endurance: 85 },
      growth: { health: 180, strength: 1.5, speed: 0.2, endurance: 0.3 },
      xp: 3000, coins: [300, 400], color: '#6d4ba0', visionRange: 2000, knockback: false, respawn: 0, lives: 3, noLate: true,
      description: 'El gobernante. Tres vidas, la Espada del Caos y dos golpes alcanzan para tumbarte. Espadazos, esqueletos, jefes invocados y la Tormenta de agonía (solo la piedra lo daña). En su última vida: la Ira del gobernante y el Terremoto morado.'
    }
  };
  // Ofrendas: las sueltan los jefes, se venden en El Almacén y abren el portal del altar.
  Zak.OFFERINGS = {
    fang: { name: 'Colmillo Tóxico', icon: '🦷', price: 500, boss: 'yarara' },
    ring: { name: 'Anillo de la mafia', icon: '💍', price: 1000, boss: 'capo' },
    claw: { name: 'Garra Sangrienta', icon: '🩸', price: 1000, boss: 'vampire' },
    elemental: { name: 'Piedra Elemental', icon: '🔮', price: 2000, boss: 'golem' },
    eye: { name: 'Ojo del alma', icon: '👁', price: 2000, boss: 'cerbero' }
  };
  Zak.emptyOfferings = () => ({ fang: 0, ring: 0, claw: 0, elemental: 0, eye: 0 });
  Zak.emptyAltar = () => ({ fang: false, ring: false, claw: false, elemental: false, eye: false });
  Zak.ELEMENTAL_RECIPE = { coins: 0, materials: { wood: 10, stone: 25, iron: 20, gold: 15, diamond: 10 }, offerings: { elemental: 5 } };
  // Parte de la fuerza que se convierte en daño: 72% para los enemigos comunes y 68% para los jefes.
  // Los jefes caminan un 30% más lento que su banda de velocidad.
  Zak.ENEMY_DAMAGE = 0.72;
  Zak.BOSS_DAMAGE = 0.68;
  Zak.BOSS_PACE = 0.7;
  // Los jefes (menos Zak) tienen un 15% menos de vida.
  Zak.BOSS_HEALTH = 0.85;
  // Desde el nivel 8 los enemigos ganan vida y fuerza extra: así el final del juego no se vuelve un paseo.
  Zak.lateFactor = function (level) {
    const extra = Math.max(0, Math.floor(Number(level) || 1) - 8);
    return { health: 1 + 0.04 * extra, strength: 1 + 0.005 * extra };
  };

  // Precios de El Almacén. Las mejoras permanentes encarecen con cada compra.
  Zak.SHOP_ITEMS = [
    { id: 'herb', name: 'Hierba medicinal', icon: '❦', detail: 'Va a la bolsa (máx. 5). R la usa: cura y quita el veneno.', price: () => 10 },
    { id: 'mate', name: 'Mate cebado', icon: '☕', detail: 'Energía al máximo y +10% de movimiento durante 30 s.', price: () => 6 },
    { id: 'sharpen', name: 'Afilar y tensar', icon: '⚒', detail: '+10% de daño con todas las armas. Hasta 5 veces.', price: p => 30 + p.sharpen * 30 },
    { id: 'lesson', name: 'Clase con Beto', icon: '✎', detail: '+1 punto de mejora para tu ficha.', price: p => 60 + p.lessons * 40 }
  ];
  Zak.HERB_BAG = 5;

  // Materiales que se recolectan con hacha o pico.
  Zak.MATERIALS = {
    wood: { name: 'Madera', icon: '🪵' }, stone: { name: 'Piedra', icon: '🪨' }, coal: { name: 'Carbón', icon: '⬛' },
    iron: { name: 'Hierro', icon: '⛓' }, gold: { name: 'Oro', icon: '🟨' }, diamond: { name: 'Diamante', icon: '💎' }
  };
  Zak.emptyMaterials = () => ({ wood: 0, stone: 0, coal: 0, iron: 0, gold: 0, diamond: 0 });
  // Vetas y árboles: herramienta, nivel mínimo, segundos base de trabajo, botín y regeneración.
  Zak.NODES = {
    tree: { material: 'wood', tool: 'axe', tier: 1, time: 3, yield: 2, regrow: 60, name: 'árbol' },
    stone: { material: 'stone', tool: 'pickaxe', tier: 1, time: 3.2, yield: 2, regrow: 180, name: 'piedra' },
    coal: { material: 'coal', tool: 'pickaxe', tier: 1, time: 3.2, yield: 2, regrow: 180, name: 'carbón' },
    iron: { material: 'iron', tool: 'pickaxe', tier: 2, time: 4, yield: 2, regrow: 300, name: 'hierro' },
    gold: { material: 'gold', tool: 'pickaxe', tier: 3, time: 4.5, yield: 2, regrow: 420, name: 'oro' },
    diamond: { material: 'diamond', tool: 'pickaxe', tier: 4, time: 5.5, yield: 2, regrow: 600, name: 'diamante' }
  };
  Zak.TIER_NAMES = ['', 'madera', 'piedra', 'hierro', 'oro', 'diamante'];
  // Cada nivel de herramienta trabaja más rápido que el anterior.
  Zak.TOOL_SPEED = [0, 1, 1.3, 1.6, 1.95, 2.4];
  Zak.TOOLS = {
    pickaxe: { name: 'Pico', icon: '⛏', recipes: [null,
      { coins: 30, materials: { wood: 10 } }, { coins: 45, materials: { stone: 10 } }, { coins: 60, materials: { iron: 10 } },
      { coins: 75, materials: { gold: 10 } }, { coins: 90, materials: { diamond: 10 } }] },
    axe: { name: 'Hacha', icon: '🪓', recipes: [null,
      { coins: 30, materials: {} }, { coins: 45, materials: { stone: 5 } }, { coins: 60, materials: { iron: 5 } },
      { coins: 75, materials: { gold: 5 } }, { coins: 90, materials: { diamond: 5 } }] }
  };
  Zak.TORCH_RECIPE = { coins: 0, materials: { wood: 1, coal: 3 } };
  Zak.MAX_WEAPON_LEVEL = 6;
  // Receta para llevar un arma al nivel indicado (2 a 6).
  Zak.WEAPON_UPGRADES = [null, null,
    { coins: 30, materials: { wood: 15 } }, { coins: 45, materials: { stone: 15 } }, { coins: 60, materials: { iron: 15 } },
    { coins: 75, materials: { gold: 15 } }, { coins: 90, materials: { diamond: 15 } }];
  // Cada nivel de mejora suma 20% de daño a esa arma: nivel 6 = ×2.
  Zak.weaponLevelMultiplier = level => 1 + 0.2 * (clamp(Math.floor(finite(level, 1)), 1, Zak.MAX_WEAPON_LEVEL) - 1);

  Zak.WEAPON_TYPES = {
    fists: { name: 'Puños', damageMultiplier: 1, range: 36, description: 'Un buen golpe a corta distancia.' },
    sword: { name: 'Espada', damageMultiplier: 1.5, range: 55, biome: 'weeds', description: '50% de daño adicional y mayor alcance.' },
    bow: { name: 'Arco', damageMultiplier: 1, range: 350, chargeTime: 0.7, biome: 'village', description: 'Dispara a distancia. Hay que tensarlo entre flechas.' },
    stone: { name: 'Piedra', damageMultiplier: 1, range: 220, walkToReload: 2, biome: 'cave', description: 'Una munición; caminar durante 2 s recarga el siguiente tiro.' },
    elemental: { name: 'Espada Elemental', damageMultiplier: 4.5, range: 62, crafted: true, description: 'Forjada con cinco Piedras Elementales. Mucho más daño que la espada mejorada al máximo.' }
  };

  Zak.speedBand = function (speed, burst = false) {
    speed = Math.max(0, finite(speed));
    if (speed < 15) return { tier: 0, moveSpeed: 72, attackCooldown: 3, label: 'Lenta' };
    if (speed < 30) return { tier: 1, moveSpeed: 92, attackCooldown: 2, label: 'Moderada' };
    if (speed < 60) return { tier: 2, moveSpeed: 118, attackCooldown: 1, label: 'Normal' };
    if (speed <= 100) return { tier: 3, moveSpeed: 148, attackCooldown: 0.5, label: 'Rápida' };
    // La Fé Judía de Gero salta directo a la banda extraordinaria.
    if (burst) return { tier: 4, moveSpeed: 178, attackCooldown: 0.25, label: 'Extraordinaria' };
    // Más allá de 100 sigue mejorando, cada vez menos: el golpe tiende a 0,25 s y el paso a 178.
    const rest = 100 / speed;
    return { tier: 4, moveSpeed: 178 - 30 * rest, attackCooldown: 0.25 + 0.25 * rest, label: 'Veloz' };
  };

  Zak.enduranceBand = function (endurance) {
    endurance = Math.max(0, finite(endurance));
    if (endurance < 15) return { tier: 0, runDuration: 3, armor: 0 };
    if (endurance < 30) return { tier: 1, runDuration: 5, armor: 2 };
    if (endurance < 60) return { tier: 2, runDuration: 7, armor: 4 };
    if (endurance < 80) return { tier: 3, runDuration: 10, armor: 6 };
    // Pasado 100, cada 10 puntos suman 1 de armadura.
    return { tier: 4, runDuration: 12, armor: 8 + Math.max(0, endurance - 100) / 10 };
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
      materials: Zak.emptyMaterials(), axe: 0, pickaxe: 0, torch: false,
      offerings: Zak.emptyOfferings(), altar: Zak.emptyAltar(), portal: false,
      stunned: 0, grabbed: 0, bleed: null, heavySlow: 0,
      weaponLevels: { fists: 1, bow: 1, sword: 1, stone: 1 }, gather: null,
      combo: 0, comboTime: 0, roll: 0, rollCooldown: 0, rollX: 0, rollY: 1
    };
  };

  Zak.getStats = function (player, context = {}) {
    const id = player.characterId;
    const s = player.stats || {};
    const buffs = player.buffs || {};
    const biome = context.biome || 'village';
    // Veteranía: desde el nivel 8 el personaje crece al mismo ritmo que los enemigos.
    // El daño sube como la vida extra de ellos y la vida, como su fuerza extra.
    const late = Zak.lateFactor(player.level);
    let health = Math.max(1, finite(s.health, 100)) * late.strength;
    let strength = Math.max(0, finite(s.strength, 1));
    let speed = Math.max(0, finite(s.speed, 1));
    const baseSpeed = speed;
    let endurance = Math.max(0, finite(s.endurance));
    let intelligence = Math.max(0, finite(s.intelligence));

    if (id === 'paco' && (biome === 'weeds' || biome === 'yuyos')) {
      health *= 1.15; strength *= 1.15; speed *= 1.15; endurance *= 1.15; intelligence *= 1.15;
    }
    if (id === 'tena' && finite(context.pursuers) >= 3) {
      strength *= 0.9; speed *= 0.9; endurance *= 0.9; intelligence *= 0.9;
    }
    if (id === 'fede' && finite(player.hp) <= health * 0.3) {
      speed *= 1.15; endurance *= 1.15;
    }
    if (id === 'pepe' && finite(buffs.pepe) > 0) speed *= 1.15;
    if (id === 'paco' && finite(buffs.paco) > 0) strength += Math.max(0, finite(buffs.pacoAnimals)) * 2;
    const geroBurst = id === 'gero' && finite(buffs.gero) > 0;
    if (geroBurst) speed += 25;
    const movement = Zak.speedBand(speed, geroBurst);
    const resistance = Zak.enduranceBand(endurance);
    const resistanceFactor = id === 'paco' ? 0.9 : id === 'fede' ? 0.8 : 1;
    const intelligenceBonus = Math.floor(intelligence / 10) * 0.2;
    const veteran = late.health;
    const xpMultiplier = (id === 'gero' ? 0.75 + intelligenceBonus : 1 + intelligenceBonus) * (id === 'pepe' ? 1.5 : 1);
    // Las bandas fijan el paso base. Los porcentajes temporales afectan directamente
    // al movimiento, incluso cuando el valor de velocidad sigue en la misma banda.
    const movementBase = Zak.speedBand(baseSpeed + (geroBurst ? 25 : 0), geroBurst).moveSpeed;
    const temporaryMovementFactor = id === 'gero' || baseSpeed === 0 ? 1 : speed / baseSpeed;
    let moveSpeed = movementBase * temporaryMovementFactor * (id === 'dante' ? 0.9 : 1);
    if (finite(player.slow) > 0) moveSpeed *= (id === 'pepe' ? 0.8 : 0.85);
    if (finite(player.heavySlow) > 0) moveSpeed *= 0.5;
    if (finite(buffs.mate) > 0) moveSpeed *= 1.1;
    return {
      maxHealth: health, strength, speed, endurance, intelligence,
      moveSpeed, attackCooldown: movement.attackCooldown,
      runDuration: resistance.runDuration * resistanceFactor,
      armor: resistance.armor * resistanceFactor,
      xpMultiplier, speedTier: movement.tier, speedLabel: movement.label,
      veteran, damageMultiplier: (1 + 0.1 * clamp(Math.floor(finite(player.sharpen)), 0, 5)) * veteran
    };
  };

  Zak.enemyStats = function (type, playerLevel) {
    const definition = Zak.ENEMY_TYPES[type];
    if (!definition) throw new Error('Tipo de enemigo desconocido: ' + type);
    const level = Math.max(1, Math.floor(finite(playerLevel, 1)));
    const increases = level - 1;
    const stats = { level, intelligence: 0 };
    // La vida de los enemigos no tiene techo; fuerza, velocidad y resistencia sí.
    Object.keys(definition.base).forEach(key => {
      const cap = key === 'poison' ? 100 : key === 'health' ? Infinity : caps[key] || Infinity;
      stats[key] = Math.min(cap, definition.base[key] + definition.growth[key] * increases);
    });
    if (!definition.noLate) {
      const late = Zak.lateFactor(level);
      if (!definition.fixedHealth) stats.health *= late.health * (definition.boss ? Zak.BOSS_HEALTH : 1);
      stats.strength *= late.strength;
    }
    stats.strength *= definition.boss ? Zak.BOSS_DAMAGE : Zak.ENEMY_DAMAGE;
    stats.maxHealth = stats.health;
    stats.moveSpeed = Zak.speedBand(stats.speed).moveSpeed * (definition.boss ? Zak.BOSS_PACE : 1);
    stats.attackCooldown = Zak.speedBand(stats.speed).attackCooldown;
    stats.armor = Zak.enduranceBand(stats.endurance).armor;
    stats.xp = definition.xp + increases * Math.ceil(definition.xp * 0.075);
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
      player.stats.health += 2;
      if (player.characterId === 'dante') player.stats.strength += 1;
      player.hp = Math.min(Zak.getStats(player, context).maxHealth, player.hp + 2);
      gained += 1;
    }
    return gained;
  };

  Zak.upgradeStat = function (player, key) {
    if (!Object.prototype.hasOwnProperty.call(Zak.STAT_LABELS, key) || player.points < 1) return false;
    const old = finite(player.stats[key]);
    const increase = key === 'health' ? 5 : 1;
    player.stats[key] = old + increase;
    player.points -= 1;
    if (key === 'health') player.hp += increase;
    return true;
  };

  Zak.damageAfterArmor = function (raw, armor) {
    raw = Math.max(0, finite(raw));
    if (!raw) return 0;
    return Math.max(1, raw - Math.max(0, finite(armor)));
  };
})(typeof window !== 'undefined' ? window : globalThis);

