/* Dibujo de los compañeros, de los bichos por domesticar, de la viborita en brazos y del aura de Zak furioso. */
(function () {
'use strict';
const Z = window.Zak, Px = Z.Pixel, D = () => Z.Draw;
const R = (c, x, y, w, h, col) => Px.rect(c, x, y, w, h, col), POLY = (c, pts, col) => Px.poly(c, pts, col);
const COAT = () => Z.PET_COATS.dog;
const BAT = {wing: '#5a4638', body: '#6e5444', light: '#8f6e58', eye: '#f1d36b'};
const STONE = {base: '#8a8f96', dark: '#5e6268', light: '#b8bcc2'};
const SNAKE = {a: '#7a5ca0', b: '#6a4e8f', belly: '#c7b1de', spot: '#e1c46a', head: '#8a6bb0'};

// Perro: el mismo de la aldea, con su plato o saltando a lamerte.
function dog(c, n, time, opts = {}) {
 const {sprite, shadow, dogBody} = D(), lick = opts.lick || 0, jump = lick > 0 ? -Math.round(Math.abs(Math.sin(lick * 9)) * 5) : opts.lunge ? -2 : 0;
 c.save(); c.translate(Math.round(n.x), Math.round(n.y)); shadow(c, 0, 0, 22, 5);
 if (opts.bowl) { const f = n.faceLeft ? -1 : 1, x = f * -16; R(c, x - 5, -3, 10, 3, '#3f6d9c'); R(c, x - 4, -4, 8, 1, '#5f8dbc'); if (opts.full) { R(c, x - 3, -5, 6, 1, '#8a5a2a'); R(c, x - 2, -6, 4, 1, '#a8743a'); } }
 c.translate(0, jump * Px.scale);
 const body = {coat: opts.coat || COAT(), homeX: n.homeX || 0, moving: !!n.moving};
 sprite(c, '#241c15', false, () => { if (n.faceLeft) c.scale(-1, 1); dogBody(c, body, time); if (lick > 0 && Math.sin(lick * 14) > 0) { R(c, 13, -12, 3, 2, '#e07a92'); R(c, 15, -13, 2, 3, '#e07a92'); } });
 c.restore();
}
// Murciélago: chiquito y marrón. En la cueva cuelga cabeza abajo; de compañero vuela al lado tuyo.
function bat(c, n, time, opts = {}) {
 const {shadow} = D(); c.save(); c.translate(Math.round(n.x), Math.round(n.y));
 if (opts.hanging) {
  shadow(c, 0, 14, 8, 2); R(c, -1, -30, 2, 4, '#3a3028');
  const sway = Math.round(Math.sin(time * 1.6) * 1); c.translate(sway, 0);
  R(c, -4, -26, 8, 9, BAT.wing); R(c, -3, -25, 6, 7, BAT.body); R(c, -2, -24, 4, 2, BAT.light);
  R(c, -3, -17, 2, 2, BAT.body); R(c, 1, -17, 2, 2, BAT.body); const blink = (time % 3.1) < .15; R(c, -2, blink ? -19 : -20, 1, blink ? 1 : 2, BAT.eye); R(c, 1, blink ? -19 : -20, 1, blink ? 1 : 2, BAT.eye);
  if (Math.sin(time * 2.3) > .6) Px.text(c, '…', 7, -28, '#e1d6af', 7, 'center');
  c.restore(); return;
 }
 const flap = Math.floor((time * 14 + (n.x || 0) * .1) % 4), hover = -18 + Math.round(Math.sin(time * 4) * 2) + (opts.lunge ? 4 : 0);
 shadow(c, 0, 0, 10, 3); c.translate(0, hover * Px.scale); if (n.faceLeft) c.scale(-1, 1);
 const wing = flap === 0 ? [[-2, -2], [-10, -8], [-8, -3], [-11, -1], [-3, 1]] : flap === 2 ? [[-2, -1], [-9, 3], [-7, 2], [-9, 6], [-3, 2]] : [[-2, -2], [-11, -2], [-8, 0], [-11, 2], [-3, 1]];
 POLY(c, wing, BAT.wing); POLY(c, wing.map(([a, b]) => [-a, b]), BAT.wing);
 R(c, -3, -4, 6, 6, BAT.body); R(c, -2, -3, 4, 3, BAT.light); R(c, -3, -6, 2, 2, BAT.body); R(c, 1, -6, 2, 2, BAT.body);
 R(c, -2, -2, 1, 1, BAT.eye); R(c, 1, -2, 1, 1, BAT.eye); R(c, -1, 1, 1, 1, '#f4efe0'); R(c, 1, 1, 1, 1, '#f4efe0');
 c.restore();
}
// Golemsín: un gólem minero de bolsillo, con su casquito y la linterna.
function golem(c, n, time, opts = {}) {
 const {shadow, sprite} = D(), angry = !!opts.angry, step = n.moving ? Math.round(Math.sin(time * 10 + (n.x || 0)) * 1) : 0, toss = opts.toss || 0;
 c.save(); c.translate(Math.round(n.x), Math.round(n.y)); shadow(c, 0, 0, 16, 4);
 sprite(c, '#22201f', false, () => {
  if (n.faceLeft) c.scale(-1, 1);
  R(c, -6, -5 - (step > 0 ? 1 : 0), 4, 5, STONE.dark); R(c, 2, -5 - (step < 0 ? 1 : 0), 4, 5, STONE.dark);
  R(c, -7, -15, 14, 11, STONE.base); R(c, -6, -14, 12, 3, STONE.light); R(c, -1, -14, 1, 10, STONE.dark); R(c, -5, -8, 2, 2, '#ffd97a'); R(c, 3, -10, 2, 2, '#ffd97a');
  R(c, -10, -13, 3, 7, STONE.dark); R(c, 7, -13 - toss * 6, 3, 7, STONE.dark); R(c, -10, -7, 3, 3, STONE.base); R(c, 7, -7 - toss * 6, 3, 3, STONE.base);
  if (toss) { R(c, 7, -13 - toss * 6, 4, 4, '#6a6e74'); R(c, 8, -12 - toss * 6, 2, 1, STONE.light); }
  R(c, -5, -22, 10, 8, STONE.base); R(c, -4, -21, 8, 2, STONE.light);
  const eye = angry ? '#ff4a2a' : '#ffb347'; R(c, -3, -19, 2, 2, eye); R(c, 1, -19, 2, 2, eye); if (angry) { R(c, -4, -20, 3, 1, STONE.dark); R(c, 1, -20, 3, 1, STONE.dark); }
  R(c, -6, -24, 12, 3, '#c9a23c'); R(c, -6, -24, 12, 1, '#ecd27a'); R(c, -1, -26, 3, 2, '#5a5040'); R(c, 0, -26, 1, 1, '#fff2b0');
 });
 if (Px.mode !== 'outline' && Px.glow) Px.glow(c, 0, -25, 5, '#ffe9a0', .45);
 c.restore();
}
// Serpiente: la viborita recién nacida, o grande como vos cuando Doña Herminia te la devuelve.
function snake(c, n, time, opts = {}) {
 const {shadow, blob} = D(), baby = !!opts.baby, N = baby ? 7 : 16, len = baby ? 12 : 30, speed = n.moving ? 10 : 2.4, f = n.faceLeft ? -1 : 1;
 c.save(); c.translate(Math.round(n.x), Math.round(n.y)); shadow(c, 0, 0, baby ? 10 : 26, 4); if (f < 0) c.scale(-1, 1);
 const pts = [];
 for (let i = 0; i < N; i++) { const t = i / (N - 1), neck = Math.max(0, (t - .7) / .3), wave = Math.sin(time * speed - t * 7) * (1 - neck) * (baby ? 1.2 : 2.4); pts.push([Math.round(-len / 2 + t * len), Math.round(-3 + wave - neck * neck * (baby ? 5 : 12) - (opts.lunge ? neck * 3 : 0)), t < .25 ? 1 + t * 6 : baby ? 2 : 3]); }
 const gulp = opts.gulp ? Math.round(N * .45) : -1;
 pts.forEach(([x, y, r], i) => { const rad = Math.max(1, Math.round(r + (i === gulp ? 3 : 0))); blob(c, x, y, rad, rad, i % 4 < 2 ? SNAKE.a : SNAKE.b); R(c, x - rad + 1, y + rad - 1, Math.max(1, rad * 2 - 2), 1, SNAKE.belly); if (i % 3 === 0 && rad > 1) R(c, x, y - 1, 1, 1, SNAKE.spot); });
 const [hx, hy] = pts[N - 1], s = baby ? .6 : 1;
 POLY(c, [[hx - 4 * s, hy - 3 * s], [hx + 2 * s, hy - 4 * s], [hx + 8 * s, hy - 1 * s], [hx + 2 * s, hy + 2 * s], [hx - 4 * s, hy + 2 * s]], SNAKE.head);
 R(c, hx + 2 * s, hy - 3 * s, 2, 1, SNAKE.spot); R(c, hx + 3 * s, hy - 3 * s, 1, 1, '#1d1626');
 if (Math.sin(time * 6 + (n.x || 0)) > .4) { R(c, hx + 8 * s, hy, 3, 1, '#d65f6b'); R(c, hx + 11 * s, hy - 1, 1, 1, '#d65f6b'); R(c, hx + 11 * s, hy + 1, 1, 1, '#d65f6b'); }
 c.restore();
}
// Otros módulos suman los suyos (Monin, en forest.js).
const ART = Z.PET_ART = Object.assign(Z.PET_ART || {}, {dog, bat, golem, snake});

// NPC de compañeros: el perro del plato, el murcielaguito colgado, el Golemsín salvaje, la viborita y los de la guardería.
Z.drawPetNpc = function (c, n, time) {
 const game = window.zakGame || Z.currentGame, cut = game && game.cutscene, p = game && game.player;
 if (n.pet === 'dog') {
  const prog = p && p.petProgress, full = !!(prog && p.playTime < prog.dog.next);
  return dog(c, n, time, n.wild ? {bowl: !(cut && cut.id === 'lick'), full, lick: n.lick, coat: n.coat} : {});
 }
 if (n.pet === 'bat') return bat(c, n, time, {hanging: !!n.wild});
 if (n.pet === 'golem') { if (n.wild && n.throwing > 0) n.throwing = Math.max(0, n.throwing - 1 / 60); return golem(c, {...n, faceLeft: n.dir === 'left'}, time, {angry: !!n.wild, toss: n.throwing > 0 ? 1 : 0}); }
 if (n.pet === 'snake') { if (n.baby && cut && cut.id === 'hatch' && !cut.out) return; return snake(c, n, time, {baby: !!n.baby}); }
 if (ART[n.pet]) return ART[n.pet](c, {...n, faceLeft: n.faceLeft || n.dir === 'left'}, time, {});
};
// El compañero que te sigue, sus piedras, la viborita en brazos, el escudo de piedra y el aura de Zak furioso.
Z.extraRenderables = function (game, visible, time) {
 const list = [], p = game.player, pet = game.pet;
 Z.currentGame = game;
 if (pet && visible(pet.x, pet.y, 40)) {
  const n = {x: pet.x, y: pet.y, homeX: 0, moving: pet.moving, faceLeft: pet.dir < 0};
  list.push({y: pet.y, kind: 'custom', draw: (c, t) => ART[pet.id](c, n, t, {lunge: pet.strike > 0, gulp: pet.eat > 0, toss: pet.strike > 0 ? 1 : 0})});
 }
 for (const s of game.petStones || []) if (visible(s.x, s.y, 20)) list.push({y: s.y + 12, kind: 'custom', draw: c => { const q = Math.floor((s.spin || 0)) % 4, o = [[0, 0], [1, 0], [1, 1], [0, 1]][q]; R(c, s.x - 3, s.y - 3, 6, 5, '#3f4247'); R(c, s.x - 2, s.y - 2, 4, 3, '#8a8f96'); R(c, s.x - 2 + o[0], s.y - 3 + o[1], 2, 2, '#c3c8cc'); }});
 if (p && p.carrying === 'snake') list.push({y: p.y + .5, kind: 'custom', draw: (c, t) => {
  // En brazos: la viborita enroscada adelante del pecho, asomando la cabeza.
  const x = Math.round(p.x), y = Math.round(p.y) - 12, bob = p.moving ? Math.round(Math.sin(t * 9)) : 0;
  for (let k = 0; k < 6; k++) R(c, x - 6 + k * 2, y + bob + (k % 2), 3, 3, k % 2 ? SNAKE.b : SNAKE.a);
  R(c, x + 5, y - 3 + bob, 4, 3, SNAKE.head); R(c, x + 7, y - 3 + bob, 1, 1, '#1d1626'); if (Math.sin(t * 6) > .5) R(c, x + 9, y - 2 + bob, 2, 1, '#d65f6b');
 }});
 if (p && p.stoneShield > 0) list.push({y: p.y + .7, kind: 'custom', draw: (c, t) => {
  c.save(); c.globalAlpha = .35 + Math.abs(Math.sin(t * 8)) * .25; c.strokeStyle = '#c3c8cc'; c.lineWidth = 2; c.beginPath(); c.ellipse(p.x, p.y - 12, 14, 20, 0, 0, Math.PI * 2); c.stroke(); c.restore();
  for (let k = 0; k < 6; k++) { const a = t * 3 + k * Math.PI / 3; R(c, p.x + Math.cos(a) * 14 - 1, p.y - 12 + Math.sin(a) * 20 - 1, 3, 3, k % 2 ? '#8a8f96' : '#b8bcc2'); }
 }});
 if (game.zakFury) for (const e of game.enemies) if (e.type === 'zak' && !e.dead && !e.summoned && visible(e.x, e.y, 80)) list.push({y: e.y - .5, kind: 'custom', draw: (c, t) => {
  if (Px.glow) Px.glow(c, e.x, e.y - 40, 70, '#ff2a2a', .35 + Math.sin(t * 6) * .08);
  for (let k = 0; k < 10; k++) { const ph = (t * 1.4 + k * .1) % 1; c.globalAlpha = 1 - ph; R(c, e.x - 28 + k * 6, e.y - 10 - ph * 70, 2, 4, k % 2 ? '#ff5a48' : '#ffb39a'); }
  c.globalAlpha = 1;
 }});
 // El huevo de la escena: tiembla, se raja y se rompe.
 const cut = game.cutscene;
 if (cut && cut.id === 'hatch' && !cut.out && cut.nest) list.push({y: cut.nest.y + 1, kind: 'custom', draw: (c, t) => {
  const x = Math.round(cut.nest.x), y = Math.round(cut.nest.y), k = cut.t, wob = k > .4 ? Math.round(Math.sin(t * (k > 1.6 ? 40 : 22)) * (k > 1.6 ? 2 : 1)) : 0;
  R(c, x - 6 + wob, y - 14, 12, 14, '#2a2420'); R(c, x - 5 + wob, y - 15, 10, 15, '#e9e2cc'); R(c, x - 4 + wob, y - 14, 3, 6, '#ffffff'); R(c, x + 2 + wob, y - 8, 3, 3, '#c9bfa2'); R(c, x - 3 + wob, y - 4, 2, 2, '#9d80c6');
  if (k > 1.1) { Px.line(c, x - 4 + wob, y - 9, x - 1 + wob, y - 7, '#3a3028'); Px.line(c, x - 1 + wob, y - 7, x + 1 + wob, y - 10, '#3a3028'); }
  if (k > 1.9) { Px.line(c, x + 1 + wob, y - 10, x + 4 + wob, y - 8, '#3a3028'); Px.line(c, x - 4 + wob, y - 9, x - 2 + wob, y - 13, '#3a3028'); }
 }});
 return list;
};
// Cascarón que salta en pedazos y anillo del escudo de piedra.
const baseEffect = Z.drawExtraEffect;
Z.drawExtraEffect = function (c, e, time, progress) {
 if (e.type === 'hatch') {
  for (let k = 0; k < 12; k++) { const a = k * .52 + (e.seed || 0), sp = 8 + (k % 4) * 6; c.globalAlpha = 1 - progress; R(c, e.x + Math.cos(a) * sp * progress, e.y + Math.sin(a) * sp * .6 * progress - Math.sin(progress * Math.PI) * 10, k % 3 ? 3 : 2, 2, k % 2 ? '#e9e2cc' : '#c9bfa2'); }
  return true;
 }
 if (e.type === 'stoneshield') {
  c.globalAlpha = 1 - progress; c.strokeStyle = '#b8bcc2'; c.lineWidth = 2; c.beginPath(); c.ellipse(e.x, e.y, 10 + progress * 30, 14 + progress * 24, 0, 0, Math.PI * 2); c.stroke();
  for (let k = 0; k < 8; k++) { const a = k * Math.PI / 4; R(c, e.x + Math.cos(a) * (8 + progress * 26), e.y + Math.sin(a) * (10 + progress * 20), 3, 3, '#8a8f96'); }
  return true;
 }
 return baseEffect ? baseEffect(c, e, time, progress) : false;
};
// Retrato chico de un compañero para la interfaz (guardería, nombre, bolsa).
Z.drawPetPortrait = function (canvas, id) {
 const c = canvas.getContext('2d'); c.imageSmoothingEnabled = false; c.clearRect(0, 0, canvas.width, canvas.height);
 const s = Math.max(1, Math.floor(Math.min(canvas.width / 30, canvas.height / 34))), before = Px.scale;
 c.save(); c.translate(Math.round(canvas.width / 2), canvas.height - 4 * s + (id === 'bat' ? 8 * s : 0)); Px.scale = s;
 ART[id](c, {x: 0, y: 0, homeX: 0, moving: false, faceLeft: false}, 0, {}); Px.scale = before; c.restore();
};
})();
