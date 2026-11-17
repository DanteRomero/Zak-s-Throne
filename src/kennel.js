/* Adentro de La guardería (v2.32): seis corrales separados por vallas, cuatro con su compañero y su decoración,
   el mostrador de Doña Herminia, que camina de corral en corral, y la puerta a la calle. También el portal del
   Santuario para salir de la dimensión de Zak y el nido de la Yarará, rediseñado.
   Todo se agrega al final del mapa: no mueve ninguna veta ni árbol de los que recuerdan las partidas guardadas. */
(function () {
'use strict';
const Z = window.Zak, Px = Z.Pixel, D = () => Z.Draw;
const R = (c, x, y, w, h, col) => Px.rect(c, x, y, w, h, col), POLY = (c, pts, col) => Px.poly(c, pts, col);
const K = Z.KENNEL, ZONE = Z.KENNEL_ZONE, LADY = 'Doña Herminia';
// La habitación: pared del fondo alta, paredes de los costados y de abajo finitas. La puerta va en la pared derecha.
const ROOM = {left: ZONE.x, top: ZONE.y, right: ZONE.x + ZONE.w, bottom: ZONE.y + ZONE.h, wall: 48, side: 12, door: [2814, 2854]};
const FLOOR_TOP = ROOM.top + ROOM.wall, FLOOR_BOTTOM = ROOM.bottom - ROOM.side;
// Corrales: tres columnas y dos filas, separadas por un pasillo. Cada uno tiene una tranquera abierta de 32 px.
const COLS = [[-724, -577], [-571, -427], [-421, -277]], FENCES = [-577, -427, -277], TOP_FRONT = 2774, BOTTOM_FRONT = 2888, GATE = 16;
const PENS = [{col: 0, row: 0, pet: null}, {col: 1, row: 0, pet: 'bat'}, {col: 2, row: 0, pet: 'dog'}, {col: 0, row: 1, pet: null}, {col: 1, row: 1, pet: 'snake'}, {col: 2, row: 1, pet: 'golem'}];
const gateX = col => Math.round((COLS[col][0] + COLS[col][1]) / 2);
// El portal de salida del Santuario: te devuelve a la plaza de Palihue City.
const HOME_PORTAL = {x: 886, y: 3540, w: 28, h: 28};
Z.isIndoors = biome => biome === 'kennel';
Z.KENNEL_ROOM = ROOM; Z.KENNEL_PENS = PENS;

Z.buildKennel = function (world, object, path) {
 // Puertas: afuera, sobre la de la casa; adentro, en la pared derecha. Se usan con E, como las bajadas.
 object('stairs', K.door.x, K.door.y, K.door.w, K.door.h, false, {dir: 'in', door: true, to: 'kennel', arrive: K.inside, label: 'Entrar a La guardería'});
 object('stairs', ROOM.right - 22, ROOM.door[0], 20, ROOM.door[1] - ROOM.door[0], false, {dir: 'out', door: true, inner: true, to: 'village', arrive: K.outside, label: 'Salir de La guardería'});
 // Paredes.
 object('kwall', ROOM.left, ROOM.top, ZONE.w, ROOM.wall, true, {face: 'top'});
 object('kwall', ROOM.left, FLOOR_TOP, ROOM.side, FLOOR_BOTTOM - FLOOR_TOP, true, {face: 'side'});
 object('kwall', ROOM.right - ROOM.side, FLOOR_TOP, ROOM.side, ROOM.door[0] - FLOOR_TOP, true, {face: 'side'});
 object('kwall', ROOM.right - ROOM.side, ROOM.door[1], ROOM.side, FLOOR_BOTTOM - ROOM.door[1], true, {face: 'side'});
 object('kwall', ROOM.right - 4, ROOM.door[0], 4, ROOM.door[1] - ROOM.door[0], true, {face: 'hidden'});
 object('kwall', ROOM.left, FLOOR_BOTTOM, ZONE.w, ROOM.side, true, {face: 'bottom'});
 // Pisos de cada corral (se dibujan debajo de todo): paja en los libres, arena para la serpiente, piedritas para el Golemsín.
 const penBox = pen => { const [x0, x1] = COLS[pen.col]; return pen.row ? {x: x0 + (pen.col ? 6 : 0), y: BOTTOM_FRONT + 6, w: x1 - x0 - (pen.col ? 6 : 0), h: FLOOR_BOTTOM - BOTTOM_FRONT - 6} : {x: x0 + (pen.col ? 6 : 0), y: FLOOR_TOP, w: x1 - x0 - (pen.col ? 6 : 0), h: TOP_FRONT - FLOOR_TOP}; };
 for (const pen of PENS) { const b = penBox(pen), kind = !pen.pet || pen.pet === 'dog' || pen.pet === 'bat' ? 'kstraw' : pen.pet === 'snake' ? 'ksand' : 'kgravel'; object(kind, b.x, b.y, b.w, b.h, false, {variant: pen.col + pen.row * 3, light: pen.pet === 'bat'}); }
 // Alfombras: un camino por el pasillo y una frente a la puerta.
 object('krug', -700, 2820, 410, 30, false, {variant: 0}); object('krug', -214, 2806, 120, 56, false, {variant: 1});
 // Vallas: entre corrales, y adelante con la tranquera abierta en el medio. Cada corral tiene su cartel.
 for (const [y0, y1] of [[FLOOR_TOP, TOP_FRONT + 6], [BOTTOM_FRONT, FLOOR_BOTTOM]]) for (const x of FENCES) object('kfence', x, y0, 6, y1 - y0, true, {vertical: true});
 for (const pen of PENS) {
  const [x0, x1] = COLS[pen.col], gx = gateX(pen.col), y = pen.row ? BOTTOM_FRONT : TOP_FRONT;
  object('kfence', x0, y, gx - GATE - x0, 6, true, {plate: pen.pet || 'free', left: true});
  object('kfence', gx + GATE, y, x1 - gx - GATE, 6, true, {});
 }
 // Murciélago: un rincón oscuro con estalactitas de tela, la percha donde cuelga, frutas y agua.
 object('kcave', -478, FLOOR_TOP, 46, 26, false); object('kperch', -548, 2686, 8, 6, true);
 object('kfruit', -462, 2748, 18, 10, false); object('kbowl', -540, 2752, 12, 8, false, {water: true});
 // Perro: cucha, camita, plato de comida, agua, hueso y pelota.
 object('kdoghouse', -318, 2652, 34, 24, true); object('kbed', -410, 2682, 32, 18, false);
 object('kbowl', -330, 2752, 12, 8, false, {food: true}); object('kbowl', -312, 2752, 12, 8, false, {water: true});
 object('ktoy', -396, 2744, 12, 6, false, {variant: 0}); object('ktoy', -366, 2696, 6, 6, false, {variant: 1});
 // Serpiente: arena, piedra para tomar sol, tronco, lámpara de calor, cactus y su piel vieja.
 object('krock', -560, 2992, 24, 14, true); object('klog', -548, 2918, 36, 10, false); object('klamp', -444, 2906, 10, 8, true);
 object('kplant', -446, 3006, 12, 10, true, {variant: 1}); object('kskin', -478, 2996, 26, 8, false); object('kbowl', -540, 2960, 12, 8, false, {water: true});
 // Golemsín: montaña de mineral, una zorra de mina con piedras, cristales y un yunque chiquito.
 object('kores', -306, 2998, 26, 16, true); object('kcart', -412, 2994, 30, 16, true); object('kcrystal', -300, 2912, 12, 10, false);
 object('kanvil', -360, 3008, 16, 10, true);
 // Corrales libres: fardos de pasto y un cartel.
 object('khay', -712, 2690, 28, 18, true); object('khay', -708, 2990, 28, 18, true); object('khay', -680, 3004, 26, 16, true);
 // El mostrador de Doña Herminia, en el rincón, con la campanita. Entre el mostrador y la pared queda el paso.
 object('kcounter', -240, FLOOR_TOP, 10, 78, true, {vertical: true});
 object('kcounter', -240, 2716, 136, 10, true, {});
 object('kbell', -150, 2711, 8, 6, false, {label: 'Tocar la campanita del mostrador'});
 // Sala de espera: banco, bolsas de comida, plantas.
 object('kbench', -250, 3006, 64, 14, true); object('ksacks', -130, 2988, 40, 22, true);
 object('kplant', -262, 2742, 12, 10, true, {variant: 0}); object('kplant', -98, 3004, 12, 10, true, {variant: 0});
 // El portal del Santuario: la salida de la dimensión de Zak.
 object('portal', HOME_PORTAL.x, HOME_PORTAL.y, HOME_PORTAL.w, HOME_PORTAL.h, false, {kind: 'home'});
 const sign = world.objects.find(o => o.type === 'sign' && o.label === 'Leer la inscripción');
 if (sign) sign.text = 'SANTUARIO · Acá nada te lastima. ↑ Pueblo Mágico. → El portal verde te lleva de vuelta a Palihue City. La puerta del trono solo se abre con la llave del Rey Mago.';
};

const P = Z.Game.prototype;
Object.assign(P, {
 // Doña Herminia sigue su recorrido de punto en punto y se queda un rato en cada corral.
 walkRoute(n, dt) {
  // `queue`: un camino de vuelta al mostrador (la campanita); si no, el recorrido de siempre.
  const pts = n.route, leg = (n.leg || 0) % pts.length, t = n.queue && n.queue.length ? n.queue[0] : pts[leg];
  if (n.wait > 0) { n.moving = false; return; }
  const dx = t.x - n.x, dy = t.y - n.y, len = Math.hypot(dx, dy), p = this.player, speed = n.speed || 18, radius = n.radius || 9;
  if (len < 3) {
   n.moving = false; n.blocked = 0;
   if (n.queue && n.queue.length) { n.queue.shift(); if (!n.queue.length) { n.queue = null; n.leg = 1; n.wait = 8; n.dir = 'down'; } return; }
   n.leg = (leg + 1) % pts.length;
   if (t.rest) { n.wait = t.rest[0] + Math.random() * (t.rest[1] - t.rest[0]); n.dir = t.y < 2800 && t.x < -250 ? 'up' : 'down'; }
   return;
  }
  const step = Math.min(len, speed * dt), nx = n.x + dx / len * step, ny = n.y + dy / len * step, before = {x: n.x, y: n.y};
  // Nunca te encierra: si estás en el camino, espera a que te corras.
  if (Math.hypot(nx - p.x, ny - p.y) > Math.max(20, radius + 11)) this.move(n, nx - n.x, ny - n.y, radius, n.zone || 'kennel', n.id);
  n.moving = Math.hypot(n.x - before.x, n.y - before.y) > .01;
  if (n.moving) { n.blocked = 0; n.dir = this.dirOf(dx, dy); if (Math.abs(dx) > 1) n.faceLeft = dx < 0; n.walk = (n.walk || 0) + dt * speed * .23; }
  else if ((n.blocked = (n.blocked || 0) + dt) > 4) { n.blocked = 0; if (n.queue && n.queue.length) n.queue.shift(); else n.leg = (leg + 1) % pts.length; }
 },
 // La campanita del mostrador: Doña Herminia vuelve a atenderte.
 ringBell() {
  const n = this.world.npcs.find(m => m.id === 'herminia'); this.sound.play('ding');
  const o = this.world.objects.find(m => m.type === 'kbell'); if (o) { o.rang = this.time; this.effect(o.x + 4, o.y - 6, 'spark', .4, {seed: 3}); }
  if (!n) return;
  const home = n.route[0];
  if (Math.hypot(n.x - home.x, n.y - home.y) < 6 || n.x > -250 && n.y < 2716) { this.emit('toast', {message: '«Acá estoy, querido. ¿Qué necesitás?»'}); n.wait = Math.max(n.wait || 0, 6); return; }
  // Vuelve por un camino seguro: si está en un corral sale por la tranquera, después el pasillo, el paso y su lugar.
  const inPen = n.x < -271 && (n.y < TOP_FRONT || n.y > BOTTOM_FRONT + 6), col = COLS.findIndex(([a, b]) => n.x >= a && n.x <= b);
  n.queue = [...(inPen && col >= 0 ? [{x: gateX(col), y: 2834}] : []), {x: -90, y: 2760}, {x: -90, y: 2704}, {x: home.x, y: home.y}]; n.wait = 0; n.blocked = 0;
  this.emit('toast', {message: '«¡Ya voy, ya voy!»'});
 }
});
const baseInteract = P.interact, baseNearby = P.nearbyAction;
P.interact = function () {
 if (this.state === 'playing' && !this.cutscene && !this.player.fishing) {
  const item = Z.nearbyInteractable(this.world, this.player.x, this.player.y, 46, this.player);
  if (item && item.type === 'kbell' && !(this.petTarget && this.petTarget())) { this.ringBell(); return; }
 }
 return baseInteract.call(this);
};
// El portal verde del Santuario: de vuelta a la plaza. El del altar sigue abierto para volver.
const basePortals = P.updatePortals;
P.updatePortals = function (dt) {
 const p = this.player;
 if (this.biome === 'sanctum' && !this.cutscene) {
  const o = this.world.objects.find(m => m.type === 'portal' && m.kind === 'home');
  if (o && Math.hypot(p.x - (o.x + o.w / 2), p.y - (o.y + o.h / 2)) < 18) { this.leaveDimension(); return; }
 }
 return basePortals.call(this, dt);
};
P.leaveDimension = function () {
 const p = this.player; this.resetZak(); p.poison = null; p.bleed = null; p.burn = null; p.slow = 0; p.heavySlow = 0;
 this.sound.play('portal'); this.travel(this.world.spawn, 'village');
 this.emit('toast', {message: 'Volviste a Palihue City. El portal del altar sigue abierto: podés volver a la dimensión cuando quieras.'});
};

/* ---------- Dibujo ---------- */
const WOOD = {base: '#8a5a32', light: '#b07a45', dark: '#5a3a20', top: '#c99a62'};
const sky = () => { const g = Z.currentGame, h = g && g.player ? Z.dayClock(g.player.playTime).hour : 12; return h >= 20 || h < 6 ? 'night' : h >= 18 ? 'dusk' : 'day'; };
function window_(c, x, y, time) {
 const s = sky(), glass = s === 'night' ? '#1d2a4a' : s === 'dusk' ? '#d98a5a' : '#8ec6e6';
 R(c, x - 2, y - 2, 28, 22, WOOD.dark); R(c, x, y, 24, 18, glass);
 if (s === 'night') { R(c, x + 16, y + 3, 4, 4, '#efe6c0'); R(c, x + 17, y + 3, 3, 3, '#1d2a4a'); R(c, x + 4, y + 5, 1, 1, '#ffffff'); R(c, x + 9, y + 11, 1, 1, '#cfd8ff'); }
 else { R(c, x + 3, y + 3, 6, 2, '#ffffff'); R(c, x + 13, y + 9, 8, 2, s === 'dusk' ? '#f2c27a' : '#e6f4fb'); }
 R(c, x + 11, y, 2, 18, WOOD.light); R(c, x, y + 8, 24, 2, WOOD.light);
 R(c, x - 3, y + 18, 30, 3, WOOD.top); R(c, x - 4, y - 4, 32, 3, '#b5383f'); R(c, x - 4, y - 1, 5, 12, '#c84a4f'); R(c, x + 23, y - 1, 5, 12, '#c84a4f');
}
function frame(c, x, y, draw) { R(c, x - 1, y - 1, 16, 14, '#6a4a2a'); R(c, x, y, 14, 12, '#efe6cf'); draw(); }
function wall(c, o, time) {
 const {x, y, w, h} = o;
 if (o.face === 'hidden') return;
 if (o.face === 'side') { R(c, x, y - 4, w, h + 4, '#5a3a24'); R(c, x + 2, y - 4, w - 4, h + 4, '#704a2e'); R(c, x + 2, y - 4, 2, h + 4, '#8a5f3a'); return; }
 if (o.face === 'bottom') { R(c, x, y, w, h, '#4a301c'); R(c, x, y, w, 3, '#8a5f3a'); R(c, x, y + 3, w, 1, '#3a2414'); return; }
 // Pared del fondo: empapelado a rayas, zócalo de madera, ventanas con cortinas, cuadros y estantes.
 R(c, x, y, w, h, '#e8d9b4');
 for (let k = 0; k < w; k += 12) { R(c, x + k, y + 4, 4, h - 20, '#dcc89c'); R(c, x + k + 6, y + 10, 1, 1, '#c9a46a'); }
 R(c, x, y, w, 4, '#5a3a24'); R(c, x, y + 4, w, 1, '#3a2414');
 R(c, x, y + h - 18, w, 18, '#8a5f3a'); R(c, x, y + h - 18, w, 2, '#b07a45'); R(c, x, y + h - 2, w, 2, '#4a301c');
 for (let k = 4; k < w; k += 24) R(c, x + k, y + h - 15, 1, 12, '#704a2e');
 // Ventanas: arriba de los corrales libres y en la sala de espera.
 window_(c, -662, y + 10, time); window_(c, -268, y + 10, time);
 // Murciélago: la pared pintada de cueva oscura, con una luna.
 R(c, -566, y + 5, 134, h - 23, '#2e2838'); R(c, -566, y + 5, 134, 2, '#4a4058'); R(c, -548, y + 12, 6, 6, '#e8e2c4'); R(c, -546, y + 12, 5, 5, '#2e2838');
 for (let k = 0; k < 9; k++) POLY(c, [[-562 + k * 15, y + 7], [-556 + k * 15, y + 7], [-559 + k * 15, y + 14 + (k % 3) * 3]], '#3e3550');
 // Perro: un cuadro con un hueso, la correa colgada y su nombre.
 frame(c, -404, y + 12, () => { R(c, -400, y + 18, 8, 2, '#f4efe0'); R(c, -401, y + 17, 2, 2, '#f4efe0'); R(c, -401, y + 19, 2, 2, '#f4efe0'); R(c, -393, y + 17, 2, 2, '#f4efe0'); R(c, -393, y + 19, 2, 2, '#f4efe0'); R(c, -400, y + 15, 8, 1, '#b5383f'); });
 R(c, -360, y + 12, 2, 2, '#4a4a4a'); Px.line(c, -359, y + 14, -356, y + 26, '#b5383f'); Px.line(c, -356, y + 26, -362, y + 24, '#b5383f');
 // Rincón de Doña Herminia: estantes con frascos, un reloj y un cartel.
 for (const sy of [y + 10, y + 22]) { R(c, -226, sy + 8, 132, 2, WOOD.dark); R(c, -226, sy + 8, 132, 1, WOOD.top); for (let k = 0; k < 8; k++) { const jx = -222 + k * 16, col = ['#d9708a', '#9ad16a', '#f2c94c', '#7fb7e6'][(k + sy) % 4]; R(c, jx, sy + 1, 7, 7, '#e6eef0'); R(c, jx + 1, sy + 4, 5, 4, col); R(c, jx, sy, 7, 1, '#8a5f3a'); } }
 Px.oval(c, -110, y + 8, 5, 5, '#5a3a24'); Px.oval(c, -110, y + 8, 4, 4, '#f4efe0'); R(c, -110, y + 5, 1, 3, '#2a2420'); R(c, -110, y + 8, 3, 1, '#2a2420');
 // Cartel de la guardería, en el medio de la pared.
 R(c, -722, y + 8, 50, 14, WOOD.dark); R(c, -721, y + 9, 48, 12, '#d8b67a');
 Z.Draw.pixelText(c, 'GUARDERÍA', -697, y + 18, '#5a3a24', 6);
 // Apliques de luz.
 for (const lx of [-590, -440, -290, -150]) { R(c, lx - 1, y + 20, 3, 6, '#5a4a3a'); R(c, lx - 3, y + 14, 7, 6, '#f6d27a'); R(c, lx - 2, y + 15, 5, 3, '#fff2c0'); }
}
function fence(c, o) {
 const {x, y, w, h} = o;
 if (o.vertical) {
  R(c, x + 1, y - 10, 4, h + 10, WOOD.dark); R(c, x + 2, y - 10, 2, h + 10, WOOD.base);
  for (let yy = y; yy <= y + h; yy += 16) { R(c, x, yy - 14, 6, 16, WOOD.dark); R(c, x + 1, yy - 14, 4, 15, WOOD.light); R(c, x + 1, yy - 14, 4, 2, WOOD.top); }
  return;
 }
 // Valla de frente: dos travesaños y postes con capuchón.
 R(c, x, y - 11, w, 3, WOOD.dark); R(c, x, y - 11, w, 2, WOOD.light); R(c, x, y - 5, w, 3, WOOD.dark); R(c, x, y - 5, w, 2, WOOD.light);
 for (let xx = x; xx <= x + w - 4; xx += Math.max(10, (w - 4) / Math.max(1, Math.round((w - 4) / 14)))) { R(c, xx, y - 15, 5, 20, WOOD.dark); R(c, xx + 1, y - 15, 3, 19, WOOD.base); R(c, xx + 1, y - 15, 3, 2, WOOD.top); }
 R(c, x + w - 5, y - 15, 5, 20, WOOD.dark); R(c, x + w - 4, y - 15, 3, 19, WOOD.base); R(c, x + w - 4, y - 15, 3, 2, WOOD.top);
 // El cartel de cada corral, del lado de la tranquera, con el nombre del compañero.
 if (o.plate) {
  // El cartel se hace a la medida del nombre, centrado sobre la valla. Letra normal y sin sombra: sobre la madera
  // clara la sombra la ensuciaba. Si el nombre no entra, pasa a la letra chiquita.
  const g = Z.currentGame, id = o.plate, room = w - 4;
  let text = id === 'free' ? 'Libre' : g && g.ownsPet && g.ownsPet(id) ? g.petName(id) : Z.PETS[id].species;
  const size = Px.textWidth(text, 9) + 8 <= room ? 9 : 7;
  while (text.length > 1 && Px.textWidth(text, size) + 6 > room) text = text.slice(0, -1);
  const tw = Math.min(room, Px.textWidth(text, size) + 8), th = size === 9 ? 13 : 10;
  const px = Math.round(x + w / 2 - tw / 2), top = y - 16 - th, ink = '#4a2e1a';
  R(c, px + 3, top + th, 2, 3, WOOD.dark); R(c, px + tw - 5, top + th, 2, 3, WOOD.dark);
  R(c, px, top, tw, th, WOOD.dark); R(c, px + 1, top + 1, tw - 2, th - 2, '#e8d9b4'); R(c, px + 1, top + 1, tw - 2, 1, '#f6ead0'); R(c, px + 1, top + th - 2, tw - 2, 1, '#cbb68a');
  Px.text(c, text, px + tw / 2, top + th / 2, ink, size, 'center', '#e8d9b4');
 }
}
function bowl(c, o) {
 const {x, y} = o; R(c, x, y + 3, 12, 5, '#2a4f7a'); R(c, x + 1, y + 2, 10, 2, o.food ? '#b5383f' : '#3f6d9c'); R(c, x + 1, y + 2, 10, 1, o.food ? '#d9605a' : '#5f8dbc');
 if (o.food) { R(c, x + 2, y + 1, 8, 2, '#8a5a2a'); R(c, x + 3, y, 2, 1, '#a8743a'); R(c, x + 7, y, 2, 1, '#a8743a'); }
 else { R(c, x + 2, y + 2, 8, 1, '#8ec6e6'); R(c, x + 3, y + 2, 2, 1, '#e6f4fb'); }
}
function drawPiece(c, o, time) {
 const {x, y, w, h} = o, v = o.variant || 0, d = D();
 switch (o.type) {
  case 'kwall': return wall(c, o, time);
  case 'kfence': return fence(c, o);
  case 'kstraw': {
   for (let k = 0; k < 70; k++) { const sx = x + d.hash(k, v, 31) * (w - 6), sy = y + 4 + d.hash(k, v, 37) * (h - 8); R(c, sx, sy, 4 + k % 4, 1, o.light ? (k % 2 ? '#6a5a3a' : '#5a4a30') : (k % 2 ? '#d8bf6a' : '#c2a654')); }
   if (o.light) { c.globalAlpha = .28; R(c, x, y, w, h, '#1e1a28'); c.globalAlpha = 1; }
   return;
  }
  case 'ksand': { R(c, x, y, w, h, '#d9c08a'); for (let k = 0; k < 60; k++) R(c, x + d.hash(k, 2, 41) * w, y + d.hash(k, 3, 43) * h, 2, 1, k % 3 ? '#c9ad74' : '#eedaa6'); for (let k = 0; k < 4; k++) Px.line(c, x + 10 + k * 30, y + 30 + k * 18, x + 26 + k * 30, y + 26 + k * 18, '#c2a46a'); return; }
  case 'kgravel': { R(c, x, y, w, h, '#8a8478'); for (let k = 0; k < 90; k++) { const sx = x + d.hash(k, 4, 47) * (w - 3), sy = y + d.hash(k, 5, 53) * (h - 3); R(c, sx, sy, 3, 2, ['#a19b8e', '#6f6a60', '#b8b2a4'][k % 3]); } return; }
  case 'krug': {
   if (v === 0) { R(c, x, y, w, h, '#8a2f35'); R(c, x + 3, y + 3, w - 6, h - 6, '#b5443f'); for (let k = 8; k < w - 8; k += 16) { R(c, x + k, y + h / 2 - 2, 6, 4, '#e8c47a'); R(c, x + k + 2, y + h / 2 - 1, 2, 2, '#8a2f35'); } R(c, x + 3, y + 5, w - 6, 1, '#e8c47a'); R(c, x + 3, y + h - 6, w - 6, 1, '#e8c47a'); }
   else { Px.oval(c, x + w / 2, y + h / 2, w / 2, h / 2, '#3f6d4a'); Px.oval(c, x + w / 2, y + h / 2, w / 2 - 5, h / 2 - 4, '#5a8a5a'); Px.oval(c, x + w / 2, y + h / 2, w / 2 - 12, h / 2 - 9, '#3f6d4a'); Z.Draw.pixelText(c, 'BIENVENIDOS', x + w / 2, y + h / 2 + 3, '#e8d9b4', 5); }
   return;
  }
  case 'kcave': {
   // Un toldo de tela oscura con flecos: el rincón donde el murciélago duerme de día.
   R(c, x, y - 2, w, h, '#1e1a28'); R(c, x + 2, y, w - 4, h - 6, '#2e2838');
   for (let k = 0; k < w; k += 6) POLY(c, [[x + k, y + h - 6], [x + k + 6, y + h - 6], [x + k + 3, y + h + 1 + (k % 12 ? 0 : 3)]], '#2e2838');
   for (let k = 0; k < 3; k++) if (Math.sin(time * 2 + k * 2) > .4) R(c, x + 10 + k * 12, y + 6, 1, 1, '#f1d36b');
   return;
  }
  case 'kperch': {
   d.shadow(c, x + 4, y + 6, 14, 3); R(c, x + 3, y - 30, 3, 36, WOOD.dark); R(c, x + 4, y - 30, 1, 36, WOOD.light);
   R(c, x - 8, y - 32, 25, 3, WOOD.dark); R(c, x - 8, y - 32, 25, 1, WOOD.top); R(c, x - 2, y + 4, 13, 3, WOOD.dark);
   return;
  }
  case 'kfruit': {
   Px.oval(c, x + 9, y + 6, 9, 4, '#c9b07a'); Px.oval(c, x + 9, y + 5, 7, 3, '#e8d9b4');
   R(c, x + 3, y + 1, 6, 3, '#f2c94c'); R(c, x + 4, y, 4, 1, '#ffe27a'); Px.oval(c, x + 12, y + 3, 3, 2, '#e0683a'); for (let k = 0; k < 4; k++) R(c, x + 6 + (k % 2) * 2, y - 1 + Math.floor(k / 2) * 2, 2, 2, '#7a3a9a');
   return;
  }
  case 'kbowl': return bowl(c, o);
  case 'kdoghouse': {
   d.shadow(c, x + w / 2, y + h, w + 6, 5);
   R(c, x, y + 4, w, h - 4, '#a8743a'); for (let k = 0; k < h - 4; k += 4) R(c, x, y + 4 + k, w, 1, '#8a5a2a');
   POLY(c, [[x - 4, y + 6], [x + w / 2, y - 12], [x + w + 4, y + 6]], '#b5383f'); POLY(c, [[x - 1, y + 5], [x + w / 2, y - 9], [x + w + 1, y + 5]], '#d04a45');
   R(c, x - 4, y + 5, w + 8, 2, '#8a2a2f'); R(c, x + w / 2 - 7, y + 8, 14, h - 8, '#2a1f18'); Px.oval(c, x + w / 2, y + 9, 7, 4, '#2a1f18');
   R(c, x + w / 2 - 8, y - 2, 16, 6, '#e8d9b4'); R(c, x + w / 2 - 3, y, 6, 2, '#8a5a2a');
   return;
  }
  case 'kbed': {
   Px.oval(c, x + w / 2, y + h / 2 + 1, w / 2, h / 2, '#7a2a2f'); Px.oval(c, x + w / 2, y + h / 2, w / 2 - 1, h / 2 - 1, '#c84a4f');
   Px.oval(c, x + w / 2, y + h / 2 + 1, w / 2 - 5, h / 2 - 4, '#efe2c4'); for (let k = 0; k < 3; k++) R(c, x + 8 + k * 6, y + h / 2, 2, 2, '#d8c9a4');
   return;
  }
  case 'ktoy': {
   if (v === 0) { R(c, x + 2, y + 2, 8, 2, '#f4efe0'); R(c, x, y + 1, 3, 2, '#f4efe0'); R(c, x, y + 3, 3, 2, '#f4efe0'); R(c, x + 9, y + 1, 3, 2, '#f4efe0'); R(c, x + 9, y + 3, 3, 2, '#f4efe0'); R(c, x + 2, y + 4, 8, 1, '#cfc6b0'); }
   else { Px.oval(c, x + 3, y + 3, 3, 3, '#9ad16a'); R(c, x + 1, y + 2, 4, 1, '#f4f4e0'); }
   return;
  }
  case 'krock': { d.shadow(c, x + w / 2, y + h, w + 4, 4); POLY(c, [[x, y + h], [x + 3, y + 3], [x + 10, y - 2], [x + 20, y + 1], [x + w, y + h]], '#8a8478'); POLY(c, [[x + 4, y + 4], [x + 10, y], [x + 18, y + 3], [x + 12, y + 6]], '#b8b2a4'); return; }
  case 'klog': { R(c, x, y + 2, w, h - 2, '#6a4a2a'); R(c, x, y + 2, w, 2, '#8a6a40'); Px.oval(c, x + w - 3, y + h / 2 + 1, 4, h / 2 - 1, '#c9a46a'); Px.oval(c, x + w - 3, y + h / 2 + 1, 2, h / 2 - 3, '#8a6a40'); R(c, x + 8, y + 4, 6, 1, '#4a301c'); R(c, x + 18, y + 6, 5, 1, '#4a301c'); return; }
  case 'klamp': {
   d.shadow(c, x + 5, y + 8, 12, 3); R(c, x + 4, y - 30, 2, 38, '#4a4a4a'); R(c, x + 4, y - 32, 12, 2, '#4a4a4a');
   POLY(c, [[x + 10, y - 30], [x + 20, y - 30], [x + 18, y - 24], [x + 12, y - 24]], '#7a7a7a'); R(c, x + 13, y - 24, 4, 2, '#ff9a4a'); Px.glow(c, x + 15, y - 22, 26, '#ff8a3a', .25 + Math.sin(time * 3) * .03);
   return;
  }
  case 'kplant': {
   d.shadow(c, x + 6, y + 10, 14, 3); R(c, x + 1, y + 2, 10, 8, '#b0603a'); R(c, x, y + 1, 12, 2, '#c8784a');
   if (v === 1) { R(c, x + 4, y - 14, 4, 16, '#5a9a4a'); R(c, x + 1, y - 10, 3, 2, '#5a9a4a'); R(c, x, y - 12, 2, 4, '#5a9a4a'); R(c, x + 8, y - 8, 3, 2, '#5a9a4a'); R(c, x + 10, y - 11, 2, 4, '#5a9a4a'); R(c, x + 5, y - 15, 2, 1, '#e06a8a'); }
   else for (let k = 0; k < 5; k++) { const a = -Math.PI / 2 + (k - 2) * .45; Px.line(c, x + 6, y + 1, x + 6 + Math.cos(a) * 10, y + 1 + Math.sin(a) * 13, k % 2 ? '#4f8a4a' : '#6aa860', 2); }
   return;
  }
  case 'kskin': { for (let k = 0; k < 6; k++) R(c, x + k * 4, y + 2 + (k % 2) * 2, 5, 3, k % 2 ? '#d8cdb8' : '#c9bda4'); R(c, x + 23, y + 2, 4, 3, '#d8cdb8'); return; }
  case 'kores': {
   d.shadow(c, x + w / 2, y + h, w + 6, 5); POLY(c, [[x, y + h], [x + 5, y + 4], [x + 13, y - 3], [x + 21, y + 3], [x + w, y + h]], '#6b6e72');
   for (const [ox, oy, col] of [[5, 6, '#b0703f'], [12, 1, '#f2c94c'], [17, 7, '#7fe6f2'], [9, 10, '#cfd6de'], [19, 11, '#f2c94c']]) { R(c, x + ox, y + oy, 3, 3, col); R(c, x + ox, y + oy, 1, 1, '#ffffff'); }
   return;
  }
  case 'kcart': {
   d.shadow(c, x + w / 2, y + h, w + 4, 4); R(c, x, y + 2, w, h - 6, '#5e6268'); R(c, x + 1, y + 3, w - 2, 2, '#8a8f96'); R(c, x, y + 2, w, 1, '#3f4247');
   for (let k = 0; k < 5; k++) Px.oval(c, x + 5 + k * 5, y + 1 - (k % 2), 3, 2, ['#8a8f96', '#b8bcc2', '#6b6e72'][k % 3]);
   Px.oval(c, x + 6, y + h - 3, 3, 3, '#2a2a2a'); Px.oval(c, x + w - 6, y + h - 3, 3, 3, '#2a2a2a');
   return;
  }
  case 'kcrystal': { POLY(c, [[x + 2, y + h], [x + 4, y + 2], [x + 6, y + h]], '#7fe6f2'); POLY(c, [[x + 5, y + h], [x + 8, y - 3], [x + 11, y + h]], '#a77bff'); R(c, x + 7, y, 1, 5, '#ffffff'); return; }
  case 'kanvil': { R(c, x + 4, y + 4, 8, 6, '#3f4247'); R(c, x, y, 16, 4, '#5e6268'); R(c, x - 2, y + 1, 3, 2, '#5e6268'); R(c, x, y, 16, 1, '#8a8f96'); return; }
  case 'khay': {
   d.shadow(c, x + w / 2, y + h, w + 4, 4); R(c, x, y, w, h, '#b8983a'); R(c, x, y, w, 3, '#e0c46a');
   for (let k = 0; k < w; k += 5) R(c, x + k, y + 3, 1, h - 3, '#9a7e2a'); R(c, x + 6, y, 2, h, '#7a5a2a'); R(c, x + w - 8, y, 2, h, '#7a5a2a');
   return;
  }
  case 'kcounter': {
   if (o.vertical) { R(c, x, y - 6, w, h + 6, WOOD.dark); R(c, x + 1, y - 6, w - 2, 3, WOOD.top); R(c, x + 1, y - 3, w - 2, h + 3, WOOD.base); return; }
   // Tapa del mostrador y frente de madera, con un libro, un frasco de galletitas y una planta.
   R(c, x, y - 8, w, 8, WOOD.top); R(c, x, y - 8, w, 1, '#e8c48a'); R(c, x, y, w, h + 4, WOOD.dark); R(c, x + 1, y + 1, w - 2, h + 2, WOOD.base);
   for (let k = 6; k < w; k += 22) R(c, x + k, y + 2, 14, h - 1, WOOD.light);
   R(c, x + 14, y - 12, 14, 5, '#3f6d9c'); R(c, x + 15, y - 12, 12, 1, '#f4efe0'); R(c, x + 20, y - 12, 1, 5, '#2a4f7a');
   R(c, x + 50, y - 18, 10, 11, '#e6eef0'); R(c, x + 51, y - 14, 8, 6, '#c9a46a'); R(c, x + 50, y - 19, 10, 2, '#b5383f');
   R(c, x + 118, y - 12, 10, 6, '#b0603a'); for (let k = 0; k < 3; k++) Px.line(c, x + 123, y - 12, x + 119 + k * 4, y - 22, '#6aa860', 2);
   return;
  }
  case 'kbell': {
   const ring = Z.currentGame && Number.isFinite(o.rang) ? Math.max(0, 1 - (Z.currentGame.time - o.rang) / .6) : 0, sway = ring > 0 ? Math.round(Math.sin(time * 40) * ring * 2) : 0;
   R(c, x, y + 4, 8, 2, '#5a4a3a'); POLY(c, [[x + 1 + sway, y + 4], [x + 2 + sway, y], [x + 6 + sway, y], [x + 7 + sway, y + 4]], '#e5b636'); R(c, x + 3 + sway, y - 1, 2, 1, '#e5b636'); R(c, x + 2 + sway, y + 1, 1, 2, '#fff1a6');
   return;
  }
  case 'kbench': { d.shadow(c, x + w / 2, y + h, w + 4, 4); R(c, x, y - 4, w, 6, WOOD.top); R(c, x, y + 2, w, 3, WOOD.dark); R(c, x + 3, y + 5, 4, h - 5, WOOD.dark); R(c, x + w - 7, y + 5, 4, h - 5, WOOD.dark); R(c, x, y - 14, w, 4, WOOD.base); R(c, x + 4, y - 10, 2, 6, WOOD.dark); R(c, x + w - 6, y - 10, 2, 6, WOOD.dark); return; }
  case 'ksacks': {
   for (const [ox, col] of [[0, '#c9b07a'], [14, '#b8983a'], [26, '#c9b07a']]) { d.shadow(c, x + ox + 7, y + h, 16, 3); R(c, x + ox, y + 4, 14, h - 4, col); R(c, x + ox + 3, y, 8, 5, col); R(c, x + ox + 4, y + 3, 6, 1, '#7a5a2a'); R(c, x + ox + 3, y + 10, 8, 5, '#f4efe0'); R(c, x + ox + 5, y + 11, 4, 3, '#b5383f'); }
   return;
  }
  case 'stairs': {
   if (!o.door) return false;
   if (o.inner) {
    // Puerta de calle vista desde adentro, en la pared derecha: marco, hoja de madera y picaporte.
    R(c, x + 6, y - 16, 16, h + 16, '#4a301c'); R(c, x + 9, y - 13, 12, h + 12, '#795b3e'); R(c, x + 11, y - 11, 2, h + 8, '#a27d51'); R(c, x + 10, y + h / 2 - 6, 2, 2, '#dfbd67');
    return true;
   }
   // Afuera: felpudo y un cartelito con una huella colgado al lado de la puerta.
   R(c, x, y + 2, w, 6, '#7a5a2a'); R(c, x + 1, y + 3, w - 2, 4, '#a8743a'); for (let k = 2; k < w - 2; k += 3) R(c, x + k, y + 3, 1, 4, '#8a5a2a');
   R(c, x + w + 2, y - 24, 12, 10, WOOD.dark); R(c, x + w + 3, y - 23, 10, 8, '#e8d9b4'); Px.oval(c, x + w + 8, y - 18, 2, 2, '#5a3a24'); R(c, x + w + 5, y - 22, 1, 1, '#5a3a24'); R(c, x + w + 8, y - 23, 1, 1, '#5a3a24'); R(c, x + w + 11, y - 22, 1, 1, '#5a3a24');
   return true;
  }
  case 'nest': return nest(c, o, time);
 }
 return false;
}
// El nido de la Yarará: un nido de ramas y pasto seco, con su hueco y huevos moteados. Si ya nació la viborita, uno está roto.
function nest(c, o, time) {
 const {x, y, w, h} = o, d = D(), cx = x + w / 2, cy = y + h / 2 + 1, g = Z.currentGame;
 const hatched = !!(g && g.player && g.player.petProgress && g.player.petProgress.snake && g.player.petProgress.snake.state !== 'none');
 const scene = g && g.cutscene && g.cutscene.id === 'hatch';
 d.shadow(c, cx, y + h + 2, w + 18, 7);
 // Ramitas que asoman por fuera, hacia todos lados.
 for (let k = 0; k < 26; k++) { const a = k / 26 * Math.PI * 2 + d.hash(k, 7) * .3, r0 = 20, r1 = 27 + d.hash(k, 9) * 6; Px.line(c, cx + Math.cos(a) * r0, cy + Math.sin(a) * r0 * .42, cx + Math.cos(a) * r1, cy + Math.sin(a) * r1 * .42, ['#5a4128', '#7b5a36', '#8a6a40'][k % 3]); }
 // El nido: aro de ramas tejidas, el hueco oscuro adentro y pasto seco en el fondo.
 Px.oval(c, cx, cy, 29, 12, '#4a3622'); Px.oval(c, cx, cy - 1, 27, 10, '#6b4f30');
 for (let k = 0; k < 40; k++) { const a = k / 40 * Math.PI * 2, r = 19 + (k % 3) * 2; R(c, cx + Math.cos(a) * r - 2, cy - 1 + Math.sin(a) * r * .38, 4 + k % 3, 1, ['#8a6a40', '#a8865a', '#5a4128', '#c9a46a'][k % 4]); }
 Px.oval(c, cx, cy - 1, 19, 7, '#2e2014'); for (let k = 0; k < 14; k++) R(c, cx - 16 + d.hash(k, 3) * 32, cy - 4 + d.hash(k, 5) * 6, 4, 1, k % 2 ? '#c9b07a' : '#a89058');
 // Huevos: blancos y algo ovalados, con sombra, brillo y manchitas violetas como la Yarará.
 const eggs = [[-11, -3], [0, -5], [11, -3], [-6, 2], [6, 2]];
 eggs.forEach(([ex, ey], i) => {
  const px = cx + ex, py = cy + ey;
  if (hatched && i === 4 && !scene) {
   // El cascarón roto: dos mitades con el borde en serrucho.
   Px.oval(c, px, py, 6, 4, '#6a5a3a'); Px.oval(c, px, py, 5, 3, '#2e2014');
   POLY(c, [[px - 5, py + 1], [px - 5, py - 3], [px - 3, py - 1], [px - 1, py - 4], [px + 1, py - 1], [px + 3, py - 4], [px + 5, py - 2], [px + 5, py + 1]], '#ece3c6'); R(c, px - 4, py, 8, 2, '#c9bd98');
   POLY(c, [[px + 8, py + 3], [px + 10, py - 1], [px + 12, py + 1], [px + 13, py - 1], [px + 14, py + 3]], '#ece3c6'); return;
  }
  if (scene && i === 4) return; // en la escena del cascarón, ese huevo lo dibuja la escena
  Px.oval(c, px, py - 4, 6, 7, '#5a4a30'); Px.oval(c, px, py - 4, 5, 6, '#c9bd98'); Px.oval(c, px - 1, py - 5, 4, 5, '#ece3c6');
  R(c, px - 3, py - 9, 2, 3, '#fffaf0'); R(c, px + 2, py - 5, 2, 1, '#8a6bb0'); R(c, px - 2, py - 2, 1, 1, '#7a5ca0'); R(c, px + 1, py - 8, 1, 1, '#9a80c0'); R(c, px + 3, py - 2, 1, 1, '#7a5ca0');
 });
 // El borde de adelante tapa la base de los huevos: así se ve que están adentro del nido.
 for (let k = 0; k < 18; k++) { const a = Math.PI * (.08 + k / 18 * .84), r = 20 + (k % 2) * 3; R(c, cx + Math.cos(a) * r - 3, cy + Math.sin(a) * r * .42, 6 + k % 3, 2, ['#6b4f30', '#8a6a40', '#5a4128'][k % 3]); }
 R(c, cx - 22, cy + 3, 44, 2, '#4a3622');
 // Un par de hojas y una pluma caídas al lado.
 R(c, x - 6, y + h - 2, 4, 2, '#6aa860'); R(c, x - 4, y + h - 3, 2, 1, '#9fd07c'); R(c, x + w + 4, y + 2, 5, 1, '#e8e2c4'); R(c, x + w + 5, y + 1, 3, 1, '#c9bfa2');
 return true;
}
Z.drawExtraObject = function (c, o, time) { return o.type === 'stairs' || o.type === 'nest' || o.type[0] === 'k' ? drawPiece(c, o, time) !== false : false; };
// Luz de adentro: un tinte tibio, los apliques que alumbran y un poco de sombra en las esquinas.
Z.drawIndoorLight = function (c, game, ox, oy, W, H, time) {
 c.fillStyle = 'rgba(255,190,110,.06)'; c.fillRect(0, 0, W, H);
 const s = sky();
 if (s === 'night') { c.fillStyle = 'rgba(20,24,50,.16)'; c.fillRect(0, 0, W, H); }
 for (const lx of [-590, -440, -290, -150]) Px.glow(c, lx - ox, ROOM.top + 18 - oy, 80, '#ffd28a', s === 'night' ? .22 : .12);
 for (const o of game.world.objects) if (o.type === 'klamp') Px.glow(c, o.x + 15 - ox, o.y - 20 - oy, 40, '#ff8a3a', .1);
 Px.shade(c, W / 2, H / 2, W, H, [[220, 0], [420, .22]], '#1a1008');
};
})();
