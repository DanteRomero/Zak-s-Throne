/* Consumibles, amuletos, pedidos de los vecinos, pesca y las tiendas del Gaucho, Don Chiche y el Mercader del Vacío. */
(function () {
'use strict';
const Z = window.Zak, clamp = (v,a,b) => Math.max(a,Math.min(b,v));
const finite = n => Number.isFinite(Number(n)) ? Number(n) : 0;

// Consumibles de la bolsa (B). F usa el elegido y G cambia cuál.
Z.ITEMS = {
 water: {name: 'Agua bendita', icon: '💧', detail: 'Apaga la quemadura y te hace inmune al fuego durante 10 s. También apaga las fogatas del Pueblo Mágico.'},
 bandage: {name: 'Vendas', icon: '🩹', detail: 'Cortan el desangrado y curan 10 de vida.'},
 mateyuyos: {name: 'Mate con yuyos', icon: '🧉', detail: 'Energía al máximo y cura el 40% de tu vida de a poco, en 10 s.'},
 choripan: {name: 'Choripán', icon: '🌭', detail: '+20% de fuerza durante 45 s.'},
 wine: {name: 'Vino de la abuela', icon: '🍷', detail: '+3 de armadura, pero −10% de movimiento, durante 40 s.'},
 firecracker: {name: 'Petardo', icon: '🧨', detail: 'Lo tirás hacia adelante: explota y aturde 1,5 s a los enemigos cercanos (a los jefes, no).'},
 scroll: {name: 'Pergamino de regreso', icon: '📜', detail: 'Te lleva a la plaza de Palihue City. No anda en la dimensión de Zak.'},
 elixir: {name: 'Elixir del vacío', icon: '⚗', detail: 'Vida y energía al máximo, y te saca todos los males.'},
 mojarra: {name: 'Mojarra', icon: '🐟', fish: true, heal: 15, price: 4, detail: 'Cura 15 de vida.'},
 pejerrey: {name: 'Pejerrey', icon: '🐟', fish: true, heal: 30, price: 10, detail: 'Cura 30 de vida.'},
 bagre: {name: 'Bagre', icon: '🐡', fish: true, heal: 60, price: 20, detail: 'Cura 60 de vida y quita el veneno.'},
 dorado: {name: 'Dorado', icon: '🐠', fish: true, price: 300, legend: true, detail: 'El tigre del río. Te cura todo: vida, energía y cualquier mal. Además, 3 s sin recibir daño y 5 s de energía infinita.'}
};
Z.ITEM_ORDER = Object.keys(Z.ITEMS);
Z.ITEM_STACK = 10;
// Qué sale al pescar, en porcentajes: el Dorado tiene un 5% justo.
Z.FISH_TABLE = [['dorado', 5], ['bagre', 20], ['pejerrey', 35], ['mojarra', 40]];
Z.DORADO = {invuln: 3, stamina: 5};
Z.ROD_PRICE = 30;

// Amuletos: se ponen en la bolsa. Empezás con un engarce; el Mercader del Vacío vende el segundo.
Z.AMULETS = {
 medal: {name: 'Medallita de la Virgen', icon: '🏅', detail: 'Si pasás 5 s sin recibir daño, recuperás 1 de vida por segundo.', how: 'Te la da Sor Inés si cumplís su pedido.'},
 horseshoe: {name: 'Herradura de Zaino', icon: '🐴', detail: '+8% de movimiento.', how: 'Mimá a los caballos de la aldea 10 veces.'},
 fang: {name: 'Diente de la Yarará', icon: '🐍', detail: 'Inmune al veneno.', how: 'El herrero lo talla con 3 Colmillos Tóxicos, 5 de oro y ◉ 100.'},
 ring: {name: 'Anillo del Capo', icon: '💰', detail: '+25% de monedas de los enemigos.', how: 'El Mercader del Vacío lo arma con 2 Anillos de la mafia, 6 cristales arcanos y ◉ 300.'},
 eye: {name: 'Ojo de Cerbero', icon: '🧿', detail: 'Ves en la oscuridad de las cuevas profundas y podés bajar sin antorcha.', how: 'El Mercader del Vacío lo arma con 1 Ojo del alma, 8 cristales arcanos y ◉ 500.'}
};
Z.HORSE_PETS = 10;
Z.SLOT_PRICE = 4000;
Z.stardustPrice = p => 500 + 250 * Math.floor(finite(p.stardust));

// Pedidos de los vecinos: se aceptan hablando con ellos (E). Las muertes cuentan desde que aceptás.
Z.REQUESTS = {
 ines: {npc: 'Sor Inés', title: 'Descanso eterno', ask: 'Los esqueletos del cementerio no descansan, hijo. Mandame ocho al otro mundo y te doy la medallita de la Virgen.', kill: {types: ['skeleton', 'archer'], count: 8}, reward: {amulet: 'medal'}, thanks: 'Que la Virgen te acompañe. Y cuidá esa boca cuando se te cae la piedra.'},
 chiche: {npc: 'Don Chiche', title: 'Los del río', ask: 'Hace días que no saco un pejerrey. Traeme tres y te pago bien, que mi señora ya no me cree.', deliver: {items: {pejerrey: 3}}, reward: {coins: 80, items: {bagre: 1}}, thanks: '¡Eso es pescar! Ahora sí me cree la Negra. Tomá, un bagre de yapa.'},
 rosa: {npc: 'Doña Rosa', title: 'Empanadas de bagre', ask: 'Quiero hacer empanadas de bagre como las de mi mamá. ¿Me traés dos, nene?', deliver: {items: {bagre: 2}}, reward: {coins: 60, items: {wine: 3}}, thanks: '¡Ay, qué divino! Llevate unos vinitos de los míos. Uno por día, ¿eh?'},
 tito: {npc: 'Tito', title: 'Leña para el horno', ask: 'Se me terminó la leña y el horno de barro no se prende solo. Traeme 20 de madera.', deliver: {materials: {wood: 20}}, reward: {coins: 90, items: {choripan: 3}}, thanks: '¡Fenómeno! Tomá unos choris, que acá se paga con comida.'},
 funes: {npc: 'Cabo Funes', title: 'Operativo cueva', ask: 'Tengo cuarenta denuncias de chorros en la Cueva del Eco. Bajá diez, que yo hago el papeleo.', kill: {types: ['thief'], count: 10}, reward: {coins: 150, items: {firecracker: 3}}, thanks: 'Excelente procedimiento. Tomá unos petardos que secuestramos en Año Nuevo.'},
 clara: {npc: 'Clara', title: 'La clase de ciencias', ask: 'Mañana doy plantas medicinales y no tengo muestras. ¿Me traés cinco hierbas del campo?', deliver: {herbs: 5}, reward: {coins: 50, items: {water: 2}}, thanks: '¡Diez felicitado! Tomá, agua bendita de la capilla. Sor Inés me la regala.'},
 gaucho: {npc: 'El Gaucho', title: "Pa'l fogón", ask: 'Se me acabó el carbón pa la pava. Tráigame quince y le cebo unos con yuyos.', deliver: {materials: {coal: 15}}, reward: {coins: 60, items: {mateyuyos: 3}}, thanks: 'Gracias, amigo. Ahí tiene, pa cuando lo apuren.'},
 anima: {npc: 'Ánima', title: 'Que descansen', ask: 'Las sombras de Zak no me dejan irme. Deshacé seis en el Patio de las Gárgolas, por favor.', kill: {types: ['shadow'], count: 6}, reward: {coins: 300, materials: {arcane: 4}}, thanks: 'Ya casi me voy… Tomá estos cristales: allá donde voy no los necesito.'},
 pocha: {npc: 'La Bruja Pocha', title: 'Cristales pa la escoba', ask: 'Mi escoba anda a cristal arcano y está en reserva. Traeme cuatro del Patio de las Gárgolas.', deliver: {materials: {arcane: 4}}, reward: {coins: 150, items: {elixir: 2}}, thanks: '¡Vuela otra vez! Tomá dos elixires, recién hechos.'},
 merlin: {npc: 'Merlín de Quilmes', title: 'Biblioteca en orden', ask: 'Mis libros se escaparon de los estantes. Bajá doce, que yo los reencuaderno.', kill: {types: ['book'], count: 12}, reward: {coins: 350, items: {firecracker: 3}}, thanks: 'Gracias, aprendiz. Tomá unos petardos por las molestias.'}
};
const requestOf = name => Object.keys(Z.REQUESTS).find(id => Z.REQUESTS[id].npc === name) || null;
Z.requestOf = requestOf;
// Tiendas de los vecinos.
const SHOP_OF = {'El Gaucho': 'gaucho', 'Don Chiche': 'chiche'};

Object.assign(Z.Game.prototype, {
 itemCount(id) { return Math.max(0, Math.floor(finite((this.player.items || {})[id]))); },
 // Suma a la bolsa sin pasarse del tope y devuelve cuántos entraron.
 addItem(id, n = 1) {
  const p = this.player; if (!Z.ITEMS[id]) return 0; p.items = p.items || {};
  const room = Math.max(0, Z.ITEM_STACK - this.itemCount(id)), added = Math.min(room, Math.max(0, Math.floor(n)));
  if (added) { p.items[id] = this.itemCount(id) + added; if (!p.selectedItem || !this.itemCount(p.selectedItem)) p.selectedItem = id; }
  return added;
 },
 useCharge(id) { if (this.itemCount(id) < 1) return false; this.player.items[id]--; if (!this.player.items[id]) delete this.player.items[id]; return true; },
 ownedItems() { return Z.ITEM_ORDER.filter(id => this.itemCount(id) > 0); },
 selected() { const p = this.player; if (p.selectedItem && this.itemCount(p.selectedItem)) return p.selectedItem; const first = this.ownedItems()[0] || null; p.selectedItem = first; return first; },
 cycleItem() { const owned = this.ownedItems(); if (!owned.length) { this.emit('toast', {message: 'La bolsa está vacía. Comprá en El Almacén, pescá o revisá carpas.'}); return null; } const now = this.selected(), next = owned[(owned.indexOf(now) + 1) % owned.length]; this.player.selectedItem = next; this.emit('tick'); return next; },
 useSelected() { const id = this.selected(); if (!id) { this.emit('toast', {message: 'La bolsa está vacía. Comprá en El Almacén, pescá o revisá carpas.'}); return false; } const result = this.useItem(id); if (!result.ok) this.emit('toast', {message: result.message}); return result.ok; },
 // Saca todos los estados negativos (los que curan el pozo y la fuente, y algunos más).
 cleanse() { Object.assign(this.player, {poison: null, bleed: null, burn: null, slow: 0, heavySlow: 0, stunned: 0, frozen: 0, grabbed: 0, exhausted: 0}); },
 useItem(id) {
  const p = this.player, item = Z.ITEMS[id], stats = this.stats();
  if (!item) return {ok: false, message: 'Eso no existe.'};
  if (this.state !== 'playing' && this.state !== 'paused' || this.cutscene) return {ok: false, message: 'Ahora no se puede.'};
  if (!this.itemCount(id)) return {ok: false, message: 'No tenés ' + item.name.toLowerCase() + '.'};
  const full = p.hp >= stats.maxHealth;
  if (id === 'scroll' && Z.isZakDimension(this.biome)) return {ok: false, message: 'Acá el pergamino no anda: de la dimensión de Zak no se sale así nomás.'};
  if (item.fish && !item.legend && full && !(id === 'bagre' && p.poison)) return {ok: false, message: 'Guardalo para después: ya tenés toda la vida.'};
  this.useCharge(id); p.restTime = Math.max(p.restTime || 0, 0);
  if (id === 'water') { p.burn = null; p.buffs.fireproof = Z.BUFF_LIMITS.fireproof; }
  else if (id === 'bandage') { p.bleed = null; this.heal(10); }
  else if (id === 'mateyuyos') { p.stamina = 1; p.exhausted = 0; p.restTime = 2; p.buffs.yuyos = Z.BUFF_LIMITS.yuyos; p.yuyosClock = 0; this.sound.play('mate'); }
  else if (id === 'choripan') p.buffs.chori = Z.BUFF_LIMITS.chori;
  else if (id === 'wine') p.buffs.wine = Z.BUFF_LIMITS.wine;
  else if (id === 'firecracker') this.throwFirecracker();
  else if (id === 'scroll') { this.travel(this.world.spawn, 'village'); this.sound.play('portal'); this.effect(p.x, p.y, 'level', 1, {radius: 30}); }
  else if (id === 'elixir') { this.cleanse(); p.hp = stats.maxHealth; p.stamina = 1; p.restTime = 2; this.effect(p.x, p.y, 'level', 1, {radius: 34}); }
  else if (id === 'dorado') this.eatDorado();
  else if (item.fish) { this.heal(item.heal); if (id === 'bagre') p.poison = null; }
  if (id !== 'dorado' && id !== 'scroll' && id !== 'firecracker') { this.sound.play('pickup'); this.effect(p.x, p.y - 10, 'leaf', .7, {seed: Math.random() * 99}); }
  this.emit('tick');
  return {ok: true, message: item.icon + ' ' + item.name + ': ¡listo!'};
 },
 // El Dorado: todo al máximo, ningún mal, 3 s sin daño y 5 s de energía infinita.
 eatDorado() {
  const p = this.player; this.cleanse();
  p.hp = this.stats().maxHealth; p.stamina = 1; p.restTime = 2; p.invuln = Z.DORADO.invuln; p.buffs.dorado = Z.DORADO.stamina;
  this.sound.play('legend'); this.shake(3, .3); this.effect(p.x, p.y, 'level', 1.4, {radius: 46, text: '¡DORADO!'});
 },
 throwFirecracker() {
  const p = this.player, [dx, dy] = this.attackVector(); this.bombs = this.bombs || [];
  this.bombs.push({x: p.x + dx * 10, y: p.y - 8 + dy * 10, dx, dy, t: 0, travel: 0}); this.sound.play('swing');
 },
 updateBombs(dt) {
  if (!this.bombs || !this.bombs.length) return;
  this.bombs = this.bombs.filter(b => {
   b.t += dt; const step = Math.min(220 * dt, Math.max(0, 110 - b.travel)), nx = b.x + b.dx * step, ny = b.y + b.dy * step;
   if (step > 0 && !Z.collides(this.world, nx, ny, 3)) { b.x = nx; b.y = ny; b.travel += step; } else b.travel = 110;
   if (b.t < .7) return true;
   this.sound.play('boom'); this.shake(4, .25); this.effect(b.x, b.y + 6, 'wave', .45, {radius: 55}); this.effect(b.x, b.y, 'poof', .7, {seed: b.x}); this.effect(b.x, b.y, 'spark', .4, {seed: b.y, crit: true});
   for (const e of this.enemies) {
    if (e.dead || e.biome !== this.biome || Math.hypot(e.x - b.x, e.y - 6 - b.y) > 55) continue;
    const boss = Z.ENEMY_TYPES[e.type] && Z.ENEMY_TYPES[e.type].boss;
    this.hitEnemy(e, 8 + this.player.level, true, false, 'firecracker');
    if (!boss && !e.dead) { e.stun = Math.max(e.stun || 0, 1.5); e.act = null; e.dash = 0; e.telegraph = 0; }
    if (this.state !== 'playing') return false;
   }
   return false;
  });
 },
 // Vida de a poco del mate con yuyos y de la medallita.
 updateItemBuffs(dt) {
  const p = this.player;
  if (p.buffs.yuyos > 0) { p.yuyosClock = (p.yuyosClock || 0) + Math.min(dt, p.buffs.yuyos); if (p.yuyosClock >= 1 - 1e-8) { p.yuyosClock -= 1; this.heal(this.stats().maxHealth * .04); } }
  p.calm = (p.calm || 0) + dt;
  if (Z.hasAmulet(p, 'medal') && p.calm >= 5) { p.medalClock = (p.medalClock || 0) + dt; if (p.medalClock >= 1 - 1e-8) { p.medalClock -= 1; if (p.hp < this.stats().maxHealth) this.heal(1); } }
  else p.medalClock = 0;
  this.updateBombs(dt);
 },
 seesInDark() { return !!this.player.torch || Z.hasAmulet(this.player, 'eye'); },
 // Amuletos.
 hasAmuletOwned(id) { return (this.player.amulets || []).includes(id); },
 grantAmulet(id) {
  const p = this.player, a = Z.AMULETS[id]; if (!a || this.hasAmuletOwned(id)) return false;
  p.amulets = [...(p.amulets || []), id];
  const auto = (p.equipped || []).length < (p.amuletSlots || 1); if (auto) p.equipped = [...(p.equipped || []), id];
  this.sound.play('level'); this.effect(p.x, p.y - 30, 'coin', 1.4, {text: a.icon + ' ' + a.name});
  this.emit('toast', {message: '¡Amuleto nuevo: ' + a.name + '! ' + a.detail + (auto ? ' Ya lo tenés puesto.' : ' Ponételo desde la bolsa (B).')});
  return true;
 },
 equipAmulet(id) {
  const p = this.player; if (!this.hasAmuletOwned(id)) return {ok: false, message: 'No tenés ese amuleto.'};
  if ((p.equipped || []).includes(id)) return {ok: false, message: 'Ya lo tenés puesto.'};
  if ((p.equipped || []).length >= (p.amuletSlots || 1)) return {ok: false, message: 'No te quedan engarces libres: sacate otro primero.'};
  p.equipped = [...(p.equipped || []), id]; this.sound.play('pickup'); return {ok: true, message: Z.AMULETS[id].name + ': puesto.'};
 },
 unequipAmulet(id) { const p = this.player; p.equipped = (p.equipped || []).filter(a => a !== id); return {ok: true, message: Z.AMULETS[id].name + ': guardado.'}; },
 // Diez mimadas a los caballos y Zaino te deja una herradura.
 petHorse() {
  const p = this.player; p.horsePets = (p.horsePets || 0) + 1;
  if (p.horsePets >= Z.HORSE_PETS && !this.hasAmuletOwned('horseshoe')) { this.grantAmulet('horseshoe'); this.emit('toast', {message: 'Zaino se sacudió y te dejó una herradura de regalo. ¡Herradura de Zaino: +8% de movimiento!'}); }
 },
 // Pedidos de los vecinos.
 requestState(id) { const r = (this.player.requests || {})[id]; return r ? r.state : 'new'; },
 requestProgress(id) {
  const q = Z.REQUESTS[id], r = (this.player.requests || {})[id] || {}, p = this.player;
  if (q.kill) return {have: Math.min(q.kill.count, r.count || 0), need: q.kill.count, ready: (r.count || 0) >= q.kill.count};
  const parts = [];
  for (const [k, n] of Object.entries(q.deliver.items || {})) parts.push([this.itemCount(k), n, Z.ITEMS[k].name]);
  for (const [k, n] of Object.entries(q.deliver.materials || {})) parts.push([p.materials[k] || 0, n, Z.MATERIALS[k].name]);
  if (q.deliver.herbs) parts.push([p.herbs || 0, q.deliver.herbs, 'Hierbas']);
  return {parts, ready: parts.every(([have, need]) => have >= need)};
 },
 requestText(id) {
  const q = Z.REQUESTS[id], pr = this.requestProgress(id);
  if (q.kill) return 'Derrotá ' + q.kill.count + ' ' + q.kill.types.map(t => Z.ENEMY_TYPES[t].name.toLowerCase()).join(' o ') + ' · ' + pr.have + '/' + pr.need;
  return 'Traé ' + pr.parts.map(([have, need, name]) => need + ' ' + name.toLowerCase() + ' (' + Math.min(have, need) + '/' + need + ')').join(', ');
 },
 rewardText(id) {
  const r = Z.REQUESTS[id].reward, parts = [];
  if (r.coins) parts.push('◉ ' + r.coins);
  for (const [k, n] of Object.entries(r.items || {})) parts.push(n + ' ' + Z.ITEMS[k].icon + ' ' + Z.ITEMS[k].name);
  for (const [k, n] of Object.entries(r.materials || {})) parts.push(n + ' ' + Z.MATERIALS[k].name.toLowerCase());
  if (r.amulet) parts.push(Z.AMULETS[r.amulet].icon + ' ' + Z.AMULETS[r.amulet].name);
  return parts.join(' · ');
 },
 acceptRequest(id) {
  const p = this.player; if (!Z.REQUESTS[id]) return {ok: false, message: 'Ese pedido no existe.'};
  if (this.requestState(id) !== 'new') return {ok: false, message: 'Ese pedido ya lo tomaste.'};
  p.requests = {...(p.requests || {}), [id]: {state: 'active', count: 0}}; this.sound.play('pickup');
  return {ok: true, message: 'Pedido aceptado: ' + Z.REQUESTS[id].title + '.'};
 },
 completeRequest(id) {
  const p = this.player, q = Z.REQUESTS[id]; if (!q) return {ok: false, message: 'Ese pedido no existe.'};
  if (this.requestState(id) !== 'active') return {ok: false, message: 'Primero aceptá el pedido.'};
  const pr = this.requestProgress(id);
  if (!pr.ready) return {ok: false, message: 'Todavía te falta: ' + this.requestText(id) + '.'};
  if (q.deliver) {
   for (const [k, n] of Object.entries(q.deliver.items || {})) { p.items[k] -= n; if (!p.items[k]) delete p.items[k]; }
   for (const [k, n] of Object.entries(q.deliver.materials || {})) p.materials[k] -= n;
   if (q.deliver.herbs) p.herbs -= q.deliver.herbs;
  }
  p.requests[id] = {state: 'done', count: 0};
  const r = q.reward; let lost = 0;
  if (r.coins) p.coins = (p.coins || 0) + r.coins;
  for (const [k, n] of Object.entries(r.items || {})) lost += n - this.addItem(k, n);
  for (const [k, n] of Object.entries(r.materials || {})) p.materials[k] = (p.materials[k] || 0) + n;
  this.sound.play('buy');
  if (r.amulet) this.grantAmulet(r.amulet);
  return {ok: true, message: q.thanks + ' (' + this.rewardText(id) + ')' + (lost ? ' Algunas cosas no entraron en la bolsa.' : '')};
 },
 // Cada enemigo derrotado suma a los pedidos activos que lo piden.
 onKill(e) {
  const p = this.player;
  for (const [id, q] of Object.entries(Z.REQUESTS)) {
   const r = (p.requests || {})[id]; if (!q.kill || !r || r.state !== 'active' || !q.kill.types.includes(e.type)) continue;
   const before = r.count || 0; r.count = Math.min(q.kill.count, before + 1);
   if (r.count >= q.kill.count && before < q.kill.count) this.emit('toast', {message: 'Pedido listo: «' + q.title + '». Volvé a hablar con ' + q.npc + '.'});
  }
 },
 // Vecinos con algo para ofrecer: un pedido, una tienda o las dos cosas.
 npcRequest(n) { return requestOf(n.name); },
 npcShop(n) { return n.shop || SHOP_OF[n.name] || null; },
 npcHasMenu(n) { const id = this.npcRequest(n); return !!this.npcShop(n) || !!(id && this.requestState(id) !== 'done'); },
 npcMenuHint(n) {
  const id = this.npcRequest(n), state = id ? this.requestState(id) : 'done';
  if (state === 'new') return 'tiene un pedido';
  if (state === 'active') return this.requestProgress(id).ready ? '¡pedido listo!' : 'pedido en curso';
  return 'vende cosas';
 },
 npcOffers(n) {
  const p = this.player, shop = this.npcShop(n), list = [];
  const buy = (id, price, extra = {}) => { const item = Z.ITEMS[id]; list.push({id: 'buy:' + id, kind: 'buy', icon: item.icon, name: item.name, detail: item.detail, cost: {coins: price, materials: {}}, done: this.itemCount(id) >= Z.ITEM_STACK, doneText: 'Bolsa llena', note: 'En la bolsa: ' + this.itemCount(id) + '/' + Z.ITEM_STACK, ...extra}); };
  if (shop === 'gaucho') buy('mateyuyos', 20);
  if (shop === 'chiche') {
   list.push({id: 'rod', kind: 'buy', icon: '🎣', name: 'Caña de pescar', detail: 'Con E al lado de una laguna tirás la línea. Cuando pica, apretá E otra vez. Dicen que hay dorados.', cost: {coins: Z.ROD_PRICE, materials: {}}, done: !!p.rod, doneText: 'Ya la tenés'});
   for (const id of Z.ITEM_ORDER) if (Z.ITEMS[id].fish) list.push({id: 'sell:' + id, kind: 'sell', icon: Z.ITEMS[id].icon, name: Z.ITEMS[id].name, detail: Z.ITEMS[id].detail, price: Z.ITEMS[id].price, count: this.itemCount(id)});
  }
  if (shop === 'merchant') {
   buy('elixir', 150);
   list.push({id: 'stardust', kind: 'buy', icon: '✨', name: 'Polvo de estrellas', detail: '+1 punto de mejora para tu ficha. Cada uno sale más caro.', cost: {coins: Z.stardustPrice(p), materials: {}}, done: false, note: 'Comprados: ' + Math.floor(finite(p.stardust))});
   list.push({id: 'slot', kind: 'buy', icon: '◈', name: 'Segundo engarce', detail: 'Podés llevar dos amuletos puestos a la vez.', cost: {coins: Z.SLOT_PRICE, materials: {}}, done: (p.amuletSlots || 1) >= 2, doneText: 'Ya lo tenés'});
   list.push({id: 'amulet:ring', kind: 'craft', icon: Z.AMULETS.ring.icon, name: Z.AMULETS.ring.name, detail: 'Amuleto: ' + Z.AMULETS.ring.detail, cost: {coins: 300, materials: {arcane: 6}, offerings: {ring: 2}}, done: this.hasAmuletOwned('ring'), doneText: 'Ya lo tenés'});
   list.push({id: 'amulet:eye', kind: 'craft', icon: Z.AMULETS.eye.icon, name: Z.AMULETS.eye.name, detail: 'Amuleto: ' + Z.AMULETS.eye.detail, cost: {coins: 500, materials: {arcane: 8}, offerings: {eye: 1}}, done: this.hasAmuletOwned('eye'), doneText: 'Ya lo tenés'});
  }
  return list.map(o => o.cost ? {...o, missing: this.missingFor(o.cost)} : o);
 },
 npcTrade(n, offerId) {
  const p = this.player, offer = this.npcOffers(n).find(o => o.id === offerId); if (!offer) return {ok: false, message: 'Eso no lo tengo.'};
  if (offer.kind === 'sell') {
   const id = offerId.slice(5); if (!this.useCharge(id)) return {ok: false, message: 'No tenés ' + Z.ITEMS[id].name.toLowerCase() + '.'};
   p.coins += offer.price; this.sound.play('buy'); return {ok: true, message: Z.ITEMS[id].name + ' vendido por ◉ ' + offer.price + '.'};
  }
  if (offer.done) return {ok: false, message: offer.doneText + '.'};
  if (offer.missing.length) return {ok: false, message: 'Te falta: ' + offer.missing.join(', ') + '.'};
  p.coins -= offer.cost.coins; for (const [k, v] of Object.entries(offer.cost.materials)) p.materials[k] -= v; for (const [k, v] of Object.entries(offer.cost.offerings || {})) p.offerings[k] -= v;
  this.sound.play('buy');
  if (offerId.startsWith('buy:')) this.addItem(offerId.slice(4), 1);
  else if (offerId === 'rod') p.rod = true;
  else if (offerId === 'stardust') { p.stardust = Math.floor(finite(p.stardust)) + 1; p.points++; }
  else if (offerId === 'slot') p.amuletSlots = 2;
  else if (offerId.startsWith('amulet:')) this.grantAmulet(offerId.slice(7));
  return {ok: true, message: offer.name + ': ¡listo!'};
 },
 // El herrero también hace petardos y talla el Diente de la Yarará.
 smithItemOptions() {
  return [
   {id: 'item:firecracker', group: 'items', icon: '🧨', name: 'Petardo', detail: Z.ITEMS.firecracker.detail + ' En la bolsa: ' + this.itemCount('firecracker') + '/' + Z.ITEM_STACK + '.', cost: {coins: 15, materials: {coal: 2}}, done: this.itemCount('firecracker') >= Z.ITEM_STACK, doneText: 'Bolsa llena'},
   {id: 'amulet:fang', group: 'items', icon: Z.AMULETS.fang.icon, name: Z.AMULETS.fang.name, detail: 'Amuleto: ' + Z.AMULETS.fang.detail, cost: {coins: 100, materials: {gold: 5}, offerings: {fang: 3}}, done: this.hasAmuletOwned('fang'), doneText: 'Ya lo tenés'}
  ];
 },
 craftItem(option) { if (option.id.startsWith('item:')) this.addItem(option.id.slice(5), 1); else if (option.id.startsWith('amulet:')) this.grantAmulet(option.id.slice(7)); },
 // Pesca: E al lado de una laguna tira la línea; cuando pica, E otra vez para sacarlo.
 startFishing(pond) {
  const p = this.player; if (!p.rod) return false;
  const cx = pond.x + pond.w / 2, cy = pond.y + pond.h / 2, ex = clamp(p.x, pond.x, pond.x + pond.w), ey = clamp(p.y, pond.y, pond.y + pond.h), len = Math.hypot(cx - ex, cy - ey) || 1;
  p.fishing = {pond: pond.id, t: 0, bite: 2.5 + Math.random() * 4.5, bit: false, window: 0, x: ex + (cx - ex) / len * Math.min(22, len), y: ey + (cy - ey) / len * Math.min(22, len)};
  p.gather = null; p.dir = this.dirOf(p.fishing.x - p.x, p.fishing.y - p.y); this.sound.play('cast-line');
  this.emit('toast', {message: 'Tiraste la línea. Quedate quieto y, cuando pique, apretá E.'}); return true;
 },
 updateFishing(dt) {
  const p = this.player, f = p.fishing; if (!f) return;
  const [x, y] = this.movementInput();
  if (x || y || p.roll > 0 || p.stunned > 0) { p.fishing = null; return; }
  f.t += dt;
  if (!f.bit && f.t >= f.bite) { f.bit = true; f.window = 1.3; this.sound.play('splash'); this.effect(f.x, f.y - 6, 'miss', 1, {text: '¡Pica!'}); return; }
  if (f.bit) { f.window -= dt; if (f.window <= 0) { p.fishing = null; this.emit('toast', {message: 'Se escapó. Para la próxima, apretá E apenas pique.'}); } }
 },
 reelIn() {
  const p = this.player, f = p.fishing; if (!f) return null;
  p.fishing = null;
  if (!f.bit) { this.emit('toast', {message: 'Levantaste la línea antes de tiempo.'}); return null; }
  return this.catchFish();
 },
 catchFish() {
  const p = this.player, roll = Math.random() * 100; let fish = 'mojarra', sum = 0;
  for (const [id, chance] of Z.FISH_TABLE) { sum += chance; if (roll < sum) { fish = id; break; } }
  const item = Z.ITEMS[fish]; this.sound.play(fish === 'dorado' ? 'legend' : 'splash'); this.questFlags.fished = true;
  if (!this.addItem(fish, 1)) { this.emit('toast', {message: 'Sacaste ' + (fish === 'dorado' ? 'un dorado' : 'un' + (fish === 'mojarra' ? 'a ' : ' ') + item.name.toLowerCase()) + ', pero no te entra en la bolsa. Lo devolviste al agua.'}); return fish; }
  if (fish === 'dorado') { this.shake(3, .3); this.effect(p.x, p.y - 34, 'coin', 1.6, {text: '🐠 ¡DORADO!'}); this.emit('toast', {message: '¡Sacaste un DORADO, el tigre del río! Comelo cuando estés en las malas: te cura todo y te deja 3 s sin recibir daño.'}); }
  else { this.effect(p.x, p.y - 30, 'coin', 1, {text: item.icon + ' ' + item.name}); this.emit('toast', {message: '¡Sacaste ' + (fish === 'mojarra' ? 'una ' : 'un ') + item.name.toLowerCase() + '! Va a la bolsa (B).'}); }
  return fish;
 },
 // Guardados: bolsa, amuletos, pedidos y pesca. Las partidas viejas arrancan con todo vacío.
 restoreInventory(p, source) {
  p.items = {};
  if (source.items && typeof source.items === 'object') for (const id of Z.ITEM_ORDER) { const n = Math.floor(clamp(finite(source.items[id]), 0, Z.ITEM_STACK)); if (n) p.items[id] = n; }
  p.selectedItem = typeof source.selectedItem === 'string' && p.items[source.selectedItem] ? source.selectedItem : null;
  p.amulets = Array.isArray(source.amulets) ? [...new Set(source.amulets.filter(a => Object.hasOwn(Z.AMULETS, a)))] : [];
  p.amuletSlots = source.amuletSlots === 2 ? 2 : 1;
  p.equipped = Array.isArray(source.equipped) ? [...new Set(source.equipped.filter(a => p.amulets.includes(a)))].slice(0, p.amuletSlots) : [];
  p.requests = {};
  if (source.requests && typeof source.requests === 'object') for (const id of Object.keys(Z.REQUESTS)) { const r = source.requests[id]; if (r && (r.state === 'active' || r.state === 'done')) p.requests[id] = {state: r.state, count: r.state === 'active' ? Math.floor(clamp(finite(r.count), 0, Z.REQUESTS[id].kill ? Z.REQUESTS[id].kill.count : 0)) : 0}; }
  p.rod = source.rod === true; p.horsePets = Math.floor(clamp(finite(source.horsePets), 0, 1e4)); p.stardust = Math.floor(clamp(finite(source.stardust), 0, 1e4));
  p.invuln = clamp(finite(source.invuln), 0, Z.DORADO.invuln); p.calm = 0; p.fishing = null;
 }
});
})();
