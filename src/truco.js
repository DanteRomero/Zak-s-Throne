/* Truco a 15 con las almas de la Feria: envido, real envido, falta envido, truco, retruco, vale cuatro y al mazo (sin flor).
   El motor del partido es puro (se prueba con node); la apuesta, la revancha y las cartas dibujadas van abajo. */
(function (root) {
'use strict';
const Z = root.Zak = root.Zak || {};
const SUITS = ['espada', 'basto', 'oro', 'copa'], NUMBERS = [1, 2, 3, 4, 5, 6, 7, 10, 11, 12];
const other = side => side === 'player' ? 'ghost' : 'player';
// Jerarquía: ancho de espada, ancho de basto, siete de espada, siete de oro, treses, doses, anchos falsos, reyes…
const rank = c => c.n === 1 && c.s === 'espada' ? 14 : c.n === 1 && c.s === 'basto' ? 13 : c.n === 7 && c.s === 'espada' ? 12 : c.n === 7 && c.s === 'oro' ? 11
 : ({3: 10, 2: 9, 1: 8, 12: 7, 11: 6, 10: 5, 7: 4, 6: 3, 5: 2, 4: 1})[c.n];
const envidoValue = n => n >= 10 ? 0 : n;
function envidoPoints(cards) {
 let best = 0; for (const c of cards) best = Math.max(best, envidoValue(c.n));
 for (const s of SUITS) { const v = cards.filter(c => c.s === s).map(c => envidoValue(c.n)).sort((a, b) => b - a); if (v.length >= 2) best = Math.max(best, 20 + v[0] + v[1]); }
 return best;
}
// Puntos del truco según el nivel cantado y querido: nada, truco, retruco, vale cuatro.
const TRUCO_POINTS = [1, 2, 3, 4], TRUCO_NAMES = ['', 'Truco', 'Retruco', 'Vale cuatro'];
const ENVIDO_NAMES = {envido: 'Envido', real: 'Real envido', falta: 'Falta envido'};
function shuffled(rng) {
 const d = []; for (const s of SUITS) for (const n of NUMBERS) d.push({n, s, id: n + '-' + s});
 for (let i = d.length - 1; i > 0; i--) { const j = Math.floor(rng() * (i + 1)); [d[i], d[j]] = [d[j], d[i]]; }
 return d;
}
function say(m, side, text) { m.log.push({side, text}); }
function award(m, side, points, why) {
 if (m.over || points <= 0) return;
 m.score[side] = Math.min(m.target, m.score[side] + points); say(m, side, '+' + points + ' · ' + why);
 if (m.score[side] >= m.target) { m.over = true; m.winner = side; if (m.hand) m.hand.finished = true; }
}
function deal(m) {
 const d = shuffled(m.rng);
 m.hand = {cards: {player: d.slice(0, 3), ghost: d.slice(3, 6)}, start: {player: d.slice(0, 3), ghost: d.slice(3, 6)}, played: {player: [], ghost: []}, bazas: [], turn: m.mano,
  truco: {level: 0, owner: null}, envido: {done: false, calls: [], caller: null, points: null}, pending: null, suspended: null, finished: false, winner: null};
 m.hands++;
}
function createMatch(opts = {}) {
 const m = {target: opts.target || 15, rng: opts.rng || Math.random, score: {player: 0, ghost: 0}, mano: opts.mano || 'player', hand: null, over: false, winner: null, log: [], hands: 0};
 deal(m); return m;
}
function nextHand(m) { if (m.over || !m.hand.finished) return false; m.mano = other(m.mano); deal(m); return true; }
// Quién gana la mano según las bazas: con las pardas decide la siguiente; si todo es parda, gana el mano.
function handWinner(bazas, mano) {
 const wins = s => bazas.filter(b => b === s).length, [a, b, c] = bazas;
 if (bazas.length < 2) return null;
 if (wins('player') >= 2) return 'player'; if (wins('ghost') >= 2) return 'ghost';
 if (bazas.length === 2) { if (a === 'parda' && b !== 'parda') return b; if (a !== 'parda' && b === 'parda') return a; return null; }
 if (c === 'parda') return a !== 'parda' ? a : b !== 'parda' ? b : mano;
 return c;
}
const faltaValue = m => Math.max(1, m.target - Math.max(m.score.player, m.score.ghost));
function envidoValueOf(m, calls) { if (calls.includes('falta')) return faltaValue(m); return calls.reduce((sum, k) => sum + (k === 'real' ? 3 : 2), 0); }
// Lo que puede hacer cada lado ahora.
function options(m, side) {
 const h = m.hand, o = {play: false, envido: [], truco: false, answer: false, fold: false};
 if (m.over || h.finished) return o;
 const pend = h.pending, mine = pend && pend.to === side, myTurn = !pend && h.turn === side;
 o.play = myTurn; o.answer = !!mine; o.fold = myTurn || mine;
 const firstBaza = h.bazas.length === 0 && h.played[side].length === 0 && !h.envido.done;
 if (firstBaza) {
  if (myTurn && h.truco.level === 0) o.envido = ['envido', 'real', 'falta'];
  else if (mine && pend.type === 'envido') { const last = h.envido.calls[h.envido.calls.length - 1], twice = h.envido.calls.filter(k => k === 'envido').length >= 2; o.envido = last === 'falta' ? [] : last === 'real' ? ['falta'] : twice ? ['real', 'falta'] : ['envido', 'real', 'falta']; }
  // El envido está primero: se puede cantar en vez de contestar el truco.
  else if (mine && pend.type === 'truco' && pend.level === 1) o.envido = ['envido', 'real', 'falta'];
 }
 const level = pend && pend.type === 'truco' ? pend.level : h.truco.level;
 o.truco = level < 3 && (myTurn ? (h.truco.owner === null || h.truco.owner === side) : !!(mine && pend.type === 'truco'));
 o.trucoName = TRUCO_NAMES[level + 1] || '';
 return o;
}
function resolveBaza(m) {
 const h = m.hand, i = h.bazas.length, a = rank(h.played.player[i]), b = rank(h.played.ghost[i]);
 const w = a > b ? 'player' : b > a ? 'ghost' : 'parda'; h.bazas.push(w);
 say(m, w === 'parda' ? null : w, w === 'parda' ? 'Parda.' : (w === 'player' ? 'Ganaste' : 'Ganó el alma') + ' la ' + ['primera', 'segunda', 'tercera'][i] + '.');
 const winner = handWinner(h.bazas, m.mano);
 if (winner) { h.finished = true; h.winner = winner; award(m, winner, TRUCO_POINTS[h.truco.level], h.truco.level ? TRUCO_NAMES[h.truco.level] + ' querido' : 'la mano'); return; }
 h.turn = w === 'parda' ? m.mano : w;
}
// Aplica una acción. Devuelve false si no vale.
function act(m, side, action, arg) {
 const h = m.hand, o = options(m, side), pend = h.pending, foe = other(side);
 if (action === 'play') {
  if (!o.play) return false; const idx = h.cards[side].findIndex(c => c.id === arg); if (idx < 0) return false;
  const [card] = h.cards[side].splice(idx, 1); h.played[side].push(card);
  if (h.played[foe].length < h.played[side].length) h.turn = foe; else resolveBaza(m);
  return true;
 }
 if (action === 'envido') {
  if (!o.envido.includes(arg)) return false;
  if (pend && pend.type === 'truco') { h.suspended = pend; h.pending = null; }
  h.envido.calls.push(arg); h.envido.caller = side; h.pending = {type: 'envido', by: side, to: foe}; say(m, side, '¡' + ENVIDO_NAMES[arg] + '!');
  return true;
 }
 if (action === 'truco') {
  if (!o.truco) return false; const level = (pend && pend.type === 'truco' ? pend.level : h.truco.level) + 1;
  if (pend && pend.type === 'truco') { h.truco.level = pend.level; h.truco.owner = side; }
  h.pending = {type: 'truco', by: side, to: foe, level}; say(m, side, '¡' + TRUCO_NAMES[level] + '!');
  return true;
 }
 if (action === 'quiero' || action === 'noquiero') {
  if (!o.answer) return false; const want = action === 'quiero';
  say(m, side, want ? 'Quiero.' : 'No quiero.');
  if (pend.type === 'envido') {
   const calls = h.envido.calls; h.envido.done = true; h.pending = h.suspended; h.suspended = null;
   if (want) {
    const pts = {player: envidoPoints(h.start.player), ghost: envidoPoints(h.start.ghost)}, win = pts.player > pts.ghost ? 'player' : pts.ghost > pts.player ? 'ghost' : m.mano;
    h.envido.points = pts; say(m, null, 'Envido: vos ' + pts.player + ', el alma ' + pts.ghost + '.');
    award(m, win, envidoValueOf(m, calls), ENVIDO_NAMES[calls[calls.length - 1]] + ' querido');
   } else award(m, pend.by, Math.max(1, calls.length > 1 ? envidoValueOf(m, calls.slice(0, -1)) : 1), ENVIDO_NAMES[calls[calls.length - 1]] + ' no querido');
   return true;
  }
  h.pending = null;
  if (want) { h.truco.level = pend.level; h.truco.owner = side; return true; }
  h.finished = true; h.winner = pend.by; award(m, pend.by, TRUCO_POINTS[pend.level - 1], TRUCO_NAMES[pend.level] + ' no querido');
  return true;
 }
 if (action === 'fold') {
  if (!o.fold) return false; say(m, side, 'Me voy al mazo.');
  // Irse con un envido sin contestar es no quererlo; con un truco cantado, también.
  if (pend && pend.type === 'envido') { h.envido.done = true; award(m, pend.by, Math.max(1, h.envido.calls.length > 1 ? envidoValueOf(m, h.envido.calls.slice(0, -1)) : 1), 'envido no querido'); }
  const call = pend && pend.type === 'truco' ? pend : h.suspended, points = call ? TRUCO_POINTS[call.level - 1] : TRUCO_POINTS[h.truco.level];
  h.pending = null; h.suspended = null; h.finished = true; h.winner = foe; award(m, foe, points, 'al mazo');
  return true;
 }
 return false;
}
// El alma juega con sus cartas y un poco de suerte. Devuelve la acción que elige, o null si no le toca.
function ghostChoice(m) {
 const h = m.hand, side = 'ghost', o = options(m, side), rng = m.rng; if (m.over || h.finished) return null;
 const env = envidoPoints(h.start.ghost), cards = h.cards.ghost.slice().sort((a, b) => rank(a) - rank(b)), i = h.played.ghost.length;
 const won = h.bazas.filter(b => b === 'ghost').length, lost = h.bazas.filter(b => b === 'player').length;
 const power = cards.reduce((s, c) => s + (rank(c) - 6) / 2, 0) + won * 4 - lost * 4;
 const behind = m.score.player - m.score.ghost;
 if (o.answer) {
  const pend = h.pending;
  if (pend.type === 'envido') {
   const last = h.envido.calls[h.envido.calls.length - 1];
   if (o.envido.includes('real') && env >= 30 && rng() < .55) return ['envido', env >= 32 && o.envido.includes('falta') ? 'falta' : 'real'];
   if (last === 'falta') return [env >= 30 || (behind >= 6 && env >= 27) ? 'quiero' : 'noquiero'];
   return [env >= 27 || (env >= 24 && rng() < .4) ? 'quiero' : 'noquiero'];
  }
  if (o.envido.length && env >= 28 && rng() < .8) return ['envido', env >= 31 ? 'real' : 'envido'];
  if (o.truco && power > 6 && rng() < .55) return ['truco'];
  return [power + rng() * 3 > pend.level * 1.5 ? 'quiero' : (power < -4 && rng() < .3 ? 'fold' : 'noquiero')];
 }
 if (!o.play) return null;
 if (o.envido.length) { if (env >= 27 && rng() < .85) return ['envido', env >= 31 && rng() < .5 ? 'real' : 'envido']; if (env <= 20 && rng() < .06) return ['envido', 'envido']; }
 if (o.truco && ((power > 4 && rng() < .55) || rng() < .07)) return ['truco'];
 const foeCard = h.played.player[i];
 let card;
 if (foeCard) card = cards.find(c => rank(c) > rank(foeCard)) || (won && cards.find(c => rank(c) === rank(foeCard))) || cards[0];
 else card = i === 0 ? cards[Math.floor(cards.length / 2)] : won ? cards[0] : cards[cards.length - 1];
 return ['play', card.id];
}
Z.Truco = {SUITS, NUMBERS, rank, envidoPoints, handWinner, createMatch, nextHand, options, act, ghostChoice, TRUCO_NAMES, ENVIDO_NAMES, TRUCO_POINTS, faltaValue};
Z.TRUCO = {bets: [50, 100, 250, 500, 1000], rematch: .3, target: 15};
if (!Z.Game) return;

/* ---------- En la Feria: la apuesta, la revancha y el premio ---------- */
const P = Z.Game.prototype, T = Z.TRUCO;
const baseCreate = Z.createPlayer;
Z.createPlayer = function (id) { return Object.assign(baseCreate(id), {trucoWins: 0, trucoLosses: 0, trucoRematchWins: 0}); };
Object.assign(P, {
 // Empezar un partido apostando guita. La apuesta se pone sobre la mesa: si ganás, te la llevás doble.
 trucoStart(bet, opponent = 'Truco', rematch = false, paced = false) {
  const p = this.player; bet = Math.floor(Number(bet) || 0);
  if (!rematch) { if (bet < 1) return {ok: false, message: 'Elegí cuánto apostar.'}; if (p.coins < bet) return {ok: false, message: 'No te alcanza para apostar ◉ ' + bet + '.'}; p.coins -= bet; }
  else if (p.coins < bet * 2) return {ok: false, message: 'Para la revancha tenés que poder cubrir ◉ ' + bet * 2 + '.'};
  this.truco = {match: Z.Truco.createMatch({target: T.target, mano: Math.random() < .5 ? 'player' : 'ghost'}), bet, opponent, rematch, settled: false, offer: false, prize: null, paced: !!paced};
  // En la mesa (paced) el alma juega de a una jugada, con pausas que pone la ventana.
  this.sound.play('pickup'); if (!paced) this.trucoGhost(); return {ok: true};
 },
 // El alma juega hasta que te toque a vos (o termine la mano).
 trucoGhost() {
  const t = this.truco; if (!t) return;
  for (let guard = 0; guard < 12; guard++) if (!this.trucoGhostStep()) break;
  if (t.match.over) this.trucoSettle();
 },
 // ¿Le toca jugar o contestar al alma?
 trucoGhostTurn() {
  const t = this.truco; if (!t || t.settled) return false; const m = t.match;
  if (m.over || m.hand.finished) return false; const o = Z.Truco.options(m, 'ghost'); return !!(o.answer || o.play);
 },
 // Una sola jugada del alma. Devuelve lo que hizo, o null si no le tocaba.
 trucoGhostStep() {
  const t = this.truco; if (!t || t.settled) return null;
  const m = t.match, choice = Z.Truco.ghostChoice(m); if (!choice) { if (m.over) this.trucoSettle(); return null; }
  let done = choice;
  if (!Z.Truco.act(m, 'ghost', choice[0], choice[1])) {
   const o = Z.Truco.options(m, 'ghost');
   if (o.answer) { Z.Truco.act(m, 'ghost', 'quiero'); done = ['quiero']; } else if (o.play) { done = ['play', m.hand.cards.ghost[0].id]; Z.Truco.act(m, 'ghost', 'play', done[1]); } else return null;
  }
  this.sound.play(done[0] === 'play' ? 'blip' : 'pickup');
  if (m.over) this.trucoSettle();
  return done;
 },
 trucoAct(action, arg) {
  const t = this.truco; if (!t || t.settled) return false;
  if (action === 'next') { if (!Z.Truco.nextHand(t.match)) return false; if (!t.paced) this.trucoGhost(); return true; }
  if (!Z.Truco.act(t.match, 'player', action, arg)) return false;
  this.sound.play(action === 'play' ? 'blip' : 'pickup');
  if (t.match.over) this.trucoSettle(); else if (!t.match.hand.finished && !t.paced) this.trucoGhost();
  return true;
 },
 // Fin del partido: se paga la apuesta. Si el alma pierde, un 30% de las veces te pide la revancha.
 trucoSettle() {
  const t = this.truco, p = this.player; if (!t || t.settled || !t.match.over) return;
  t.settled = true; const won = t.match.winner === 'player';
  if (won) { p.trucoWins = (p.trucoWins || 0) + 1; this.sound.play('legend'); }
  else { p.trucoLosses = (p.trucoLosses || 0) + 1; this.sound.play('death'); }
  if (!t.rematch) { if (won) p.coins += t.bet * 2; t.offer = won && this.chance(T.rematch); }
  else if (won) { p.trucoRematchWins = (p.trucoRematchWins || 0) + 1; t.prize = this.trucoPrize(); }
  else p.coins = Math.max(0, p.coins - t.bet * 2);
  this.emit('progress');
 },
 // Te levantás de la mesa a mitad del partido: perdés lo apostado.
 trucoLeave() {
  const t = this.truco; if (!t) return; this.truco = null;
  if (t.settled) return; this.player.trucoLosses = (this.player.trucoLosses || 0) + 1;
  if (t.rematch) this.player.coins = Math.max(0, this.player.coins - t.bet * 2);
 },
 trucoRematch() { const t = this.truco; if (!t || !t.offer) return {ok: false, message: 'No hay revancha.'}; return this.trucoStart(t.bet, t.opponent, true, t.paced); },
 // Premio de la revancha: un objeto al azar del juego (un consumible, un pescado o un amuleto que no tengas).
 trucoPrize() {
  const pool = Z.ITEM_ORDER.filter(id => !Z.ITEMS[id].pet && this.itemCount(id) < Z.ITEM_STACK).map(id => ['item', id]).concat(Object.keys(Z.AMULETS).filter(id => !this.hasAmuletOwned(id)).map(id => ['amulet', id]));
  if (!pool.length) { this.player.coins += 500; return {kind: 'coins', id: 'coins', name: '◉ 500', icon: '◉'}; }
  const [kind, id] = pool[Math.floor(Math.random() * pool.length)];
  if (kind === 'amulet') { this.grantAmulet(id); return {kind, id, name: Z.AMULETS[id].name, icon: Z.AMULETS[id].icon}; }
  this.addItem(id, 1); return {kind, id, name: Z.ITEMS[id].name, icon: Z.ITEMS[id].icon};
 }
});
// Las dos almas de la mesa juegan; el resto de la Feria, no.
const baseHint = P.npcMenuHint, baseShop = P.npcShop, baseRestore = P.restoreInventory;
P.npcShop = function (n) { return n.id === 'truco' || n.id === 'retruco' ? 'truco' : baseShop.call(this, n); };
P.npcMenuHint = function (n) { return this.npcShop(n) === 'truco' ? 'juega al truco' : baseHint.call(this, n); };
P.restoreInventory = function (p, source) {
 baseRestore.call(this, p, source);
 for (const k of ['trucoWins', 'trucoLosses', 'trucoRematchWins']) p[k] = Math.floor(Math.max(0, Math.min(1e6, Number(source[k]) || 0)));
 this.truco = null;
};

/* ---------- Cartas españolas en pixel art ---------- */
const Px = Z.Pixel;
const SUIT_ART = {
 oro(c, x, y) { const R = (a, b, w, h, col) => Px.rect(c, x + a, y + b, w, h, col); R(-4, -6, 8, 12, '#8a6418'); R(-6, -4, 12, 8, '#8a6418'); R(-5, -5, 10, 10, '#e2b23c'); R(-3, -3, 6, 6, '#c9902a'); R(-2, -2, 4, 4, '#ffe08a'); R(-4, -5, 3, 1, '#fff0a6'); },
 copa(c, x, y) { const R = (a, b, w, h, col) => Px.rect(c, x + a, y + b, w, h, col); R(-6, -7, 12, 2, '#8a2030'); R(-5, -5, 10, 4, '#c43a4a'); R(-3, -1, 6, 2, '#c43a4a'); R(-1, 1, 2, 4, '#e2b23c'); R(-4, 5, 8, 2, '#e2b23c'); R(-4, -5, 2, 3, '#e8707a'); },
 espada(c, x, y) { const R = (a, b, w, h, col) => Px.rect(c, x + a, y + b, w, h, col); R(-1, -8, 3, 11, '#6d8794'); R(0, -8, 1, 11, '#d6e2e8'); R(-4, 3, 9, 2, '#e2b23c'); R(-1, 5, 3, 3, '#6b4a2a'); R(-2, 8, 5, 1, '#e2b23c'); },
 basto(c, x, y) { const R = (a, b, w, h, col) => Px.rect(c, x + a, y + b, w, h, col); Px.rrect(c, x, y, .35, -2, -8, 5, 16, '#6b4a2a'); Px.rrect(c, x, y, .35, -1, -8, 2, 16, '#9a6a3a'); R(-5, -6, 3, 2, '#4a7a3a'); R(2, 1, 3, 2, '#4a7a3a'); R(-4, -1, 2, 2, '#5a8a44'); }
};
// Una carta de 40×60. Boca abajo, el dorso violeta de la Feria.
Z.drawCard = function (canvas, card, faceDown = false) {
 const c = canvas.getContext('2d'), W = canvas.width, H = canvas.height, s = Math.max(1, Math.floor(Math.min(W / 40, H / 60))), w = 40, h = 60;
 c.imageSmoothingEnabled = false; c.clearRect(0, 0, W, H); c.save(); c.translate(Math.round((W - w * s) / 2), Math.round((H - h * s) / 2)); const before = Px.scale; Px.scale = s;
 const R = (x, y, ww, hh, col) => Px.rect(c, x, y, ww, hh, col);
 R(1, 0, w - 2, h, '#2a2236'); R(0, 1, w, h - 2, '#2a2236');
 if (faceDown || !card) {
  R(2, 2, w - 4, h - 4, '#4b3a72'); R(4, 4, w - 8, h - 8, '#3a2a5a');
  for (let y = 6; y < h - 6; y += 8) for (let x = 6 + ((y / 8) % 2) * 4; x < w - 6; x += 8) { R(x, y, 2, 2, '#a77bff'); R(x + 1, y - 1, 1, 1, '#c9a6ff'); }
 } else {
  R(2, 2, w - 4, h - 4, '#f4ecd4'); R(3, 3, w - 6, 1, '#ffffff'); R(3, h - 4, w - 6, 1, '#d8ccb0');
  const ink = {oro: '#8a6418', copa: '#8a2030', espada: '#2f4a5c', basto: '#3f5a2a'}[card.s];
  Px.text(c, String(card.n), 8, 10, ink, 9, 'center'); Px.text(c, String(card.n), w - 8, h - 7, ink, 9, 'center');
  SUIT_ART[card.s](c, w / 2, h / 2);
  if (card.n >= 10) { R(w / 2 - 6, 12, 12, 2, ink); R(w / 2 - 6, h - 14, 12, 2, ink); }
 }
 Px.scale = before; c.restore();
};
Z.cardName = card => ({1: 'Ancho', 10: 'Sota', 11: 'Caballo', 12: 'Rey'}[card.n] ? ({1: 'Ancho', 10: 'Sota', 11: 'Caballo', 12: 'Rey'}[card.n] + ' de ' + card.s) : card.n + ' de ' + card.s);
})(typeof window !== 'undefined' ? window : globalThis);
