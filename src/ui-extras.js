/* Ventanas de la v2.21: la mesa de truco, el medallero, el nombre de los compañeros, la guardería,
   el murcielaguito, Doña Herminia y la puerta del trono para la revancha. */
(function () {
'use strict';
const Zak = window.Zak, game = window.zakGame, UI = Zak.UI, {el, button, paragraph, openModal, hideModal, toast, updateHud} = UI;
const T = Zak.Truco;
const canvasOf = (w, h, cls) => { const c = el('canvas', cls); c.width = w; c.height = h; return c; };
const actions = (parent, ...buttons) => { const box = el('div', 'modal-actions'); box.append(...buttons); parent.append(box); return box; };

/* ---------- Truco ---------- */
// En la mesa el alma juega de a una jugada y se toma su tiempo, para que se vea qué hace.
const PACE = {play: 1000, answer: 1400, start: 1200};
let ghostTimer = 0, shout = null, seen = new Set();
const trucoOpen = () => !!document.querySelector('#modal-content .truco-board');
function scheduleGhost(first) {
 clearTimeout(ghostTimer); ghostTimer = 0; if (!game.trucoGhostTurn()) return;
 const answering = T.options(game.truco.match, 'ghost').answer;
 ghostTimer = setTimeout(() => {
  ghostTimer = 0; const t = game.truco; if (!t || !trucoOpen()) return; // con la confirmación abierta, el alma espera
  const before = t.match.log.length, step = game.trucoGhostStep();
  const said = t.match.log.slice(before).find(line => line.side === 'ghost');
  shout = step && step[0] !== 'play' && said ? said.text : null;
  updateHud(true); showTruco();
 }, answering ? PACE.answer : first ? PACE.start : PACE.play);
}
// Los tantos con fósforos, de a cinco: un cuadrado y la diagonal, como en la mesa del boliche.
function drawTally(canvas, points, target) {
 const c = canvas.getContext('2d'), groups = Math.ceil(target / 5); c.imageSmoothingEnabled = false; c.clearRect(0, 0, canvas.width, canvas.height);
 const stick = (x1, y1, x2, y2, lit) => {
  const steps = Math.max(Math.abs(x2 - x1), Math.abs(y2 - y1));
  for (let k = 0; k <= steps; k++) { const x = Math.round(x1 + (x2 - x1) * k / steps), y = Math.round(y1 + (y2 - y1) * k / steps); c.fillStyle = lit ? '#e8d2a0' : 'rgba(232,210,160,.13)'; c.fillRect(x, y, 2, 2); }
  if (lit) { c.fillStyle = '#c43a2a'; c.fillRect(Math.round(x2) - 1, Math.round(y2) - 1, 3, 3); }
 };
 for (let g = 0; g < groups; g++) {
  const x = 3 + g * 22, y = 3, n = Math.max(0, Math.min(5, points - g * 5)), s = 15;
  stick(x, y + s, x, y, n > 0); stick(x, y, x + s, y, n > 1); stick(x + s, y, x + s, y + s, n > 2); stick(x + s, y + s, x, y + s, n > 3); stick(x, y + s, x + s, y, n > 4);
 }
}
function tally(points, target, who, cls) {
 const box = el('div', 'truco-tally ' + cls), c = canvasOf(Math.ceil(target / 5) * 22 + 2, 22); drawTally(c, points, target);
 box.setAttribute('aria-label', who + ': ' + points + ' de ' + target); box.append(el('span', 'truco-tally-name', who), c, el('b', '', String(points))); return box;
}
function trucoLog(parent, match) {
 const box = el('div', 'truco-log');
 match.log.slice(-4).forEach(line => box.append(el('div', 'truco-line ' + (line.side || 'table'), (!/^(¡|Quiero|No quiero|Me voy)/.test(line.text) ? '' : line.side === 'player' ? 'Vos: ' : 'El alma: ') + line.text)));
 parent.append(box);
}
function cardButton(card, enabled, onClick, i, n) {
 const b = button('', onClick, 'truco-card'); b.disabled = !enabled; b.setAttribute('aria-label', 'Jugar el ' + Zak.cardName(card));
 b.style.setProperty('--tilt', ((i - (n - 1) / 2) * 6) + 'deg');
 const c = canvasOf(40, 60); Zak.drawCard(c, card); b.append(c); return b;
}
function tableRow(cards, label, side, bazas, now) {
 const row = el('div', 'truco-row ' + side); row.append(el('span', 'truco-who', label));
 for (let i = 0; i < 3; i++) {
  const slot = el('span', 'truco-slot'), card = cards[i];
  if (card) {
   const c = canvasOf(40, 60), key = side + card.id; Zak.drawCard(c, card); c.setAttribute('aria-label', Zak.cardName(card));
   if (!seen.has(key)) c.classList.add('fresh', side); now.add(key);
   if (bazas[i]) slot.classList.add(bazas[i] === side ? 'won' : bazas[i] === 'parda' ? 'parda' : 'lost');
   slot.append(c);
  }
  row.append(slot);
 }
 return row;
}
function showTruco() {
 const t = game.truco; if (!t) return;
 const m = t.match, h = m.hand, o = T.options(m, 'player'), p = game.player, thinking = game.trucoGhostTurn();
 // Cada jugada redibuja la mesa: en el celu, que no se vaya arriba de todo.
 const box = document.getElementById('modal'), wasOpen = trucoOpen(), scroll = box ? box.scrollTop : 0;
 openModal('Truco a ' + m.target, 'FERIA DE LAS ALMAS · CONTRA ' + t.opponent.toUpperCase(), parent => {
  const board = el('div', 'truco-board'); parent.append(board);
  const score = el('div', 'truco-score');
  score.append(tally(m.score.player, m.target, 'Vos', 'mine'), el('b', 'truco-stake', t.rematch ? 'REVANCHA\nsi perdés, ◉ ' + t.bet * 2 : 'En juego\n◉ ' + t.bet), tally(m.score.ghost, m.target, t.opponent, 'ghost'));
  board.append(score);
  const felt = el('div', 'truco-felt'); board.append(felt);
  const ghostSide = el('div', 'truco-ghost-side'), ghostHand = el('div', 'truco-hand ghost');
  for (let i = 0; i < h.cards.ghost.length; i++) { const c = canvasOf(40, 60); Zak.drawCard(c, null, true); c.style.setProperty('--tilt', ((i - (h.cards.ghost.length - 1) / 2) * -7) + 'deg'); ghostHand.append(c); }
  ghostSide.append(ghostHand);
  if (shout) ghostSide.append(el('div', 'truco-shout', shout));
  else if (thinking) { const dots = el('div', 'truco-thinking', 'El alma está pensando'); dots.append(el('span', 'truco-dots', '...')); ghostSide.append(dots); }
  felt.append(ghostSide);
  const now = new Set(), table = el('div', 'truco-table');
  table.append(tableRow(h.played.ghost, t.opponent, 'ghost', h.bazas, now), tableRow(h.played.player, 'Vos', 'player', h.bazas, now));
  felt.append(table); seen = now;
  trucoLog(board, m);
  if (m.over) {
   clearTimeout(ghostTimer); shout = null;
   const won = m.winner === 'player';
   paragraph(board, won ? (t.rematch ? '¡Le ganaste la revancha!' : '¡Ganaste el partido! Te llevás ◉ ' + t.bet * 2 + '.') : (t.rematch ? 'Perdiste la revancha: el alma se lleva ◉ ' + t.bet * 2 + '.' : 'Perdiste el partido y los ◉ ' + t.bet + ' de la apuesta.'), 'truco-result ' + (won ? 'won' : 'lost'));
   if (t.prize) paragraph(board, 'Premio de la revancha: ' + t.prize.icon + ' ' + t.prize.name + '.', 'hint shop-message');
   if (t.offer) {
    paragraph(board, '«¿Ah, sí? Revancha. Si gano yo, me das el doble: ◉ ' + t.bet * 2 + '. Si ganás vos, te doy algo del otro lado.»', 'truco-offer');
    const yes = button('Aceptar la revancha', () => { seen = new Set(); const r = game.trucoRematch(); if (!r.ok) { toast(r.message, true); return; } updateHud(true); showTruco(); }, 'button primary'); yes.disabled = p.coins < t.bet * 2;
    actions(board, yes, button('No, gracias', leaveTable)).classList.add('truco-later');
    if (yes.disabled) paragraph(board, 'Para aceptarla tenés que poder cubrir ◉ ' + t.bet * 2 + '.', 'hint');
   } else actions(board, button('Levantarme de la mesa', leaveTable, 'button primary')).classList.add('truco-later');
   return;
  }
  if (h.finished) {
   shout = null;
   paragraph(board, h.winner === 'player' ? 'Te llevaste la mano.' : 'La mano fue para el alma.', 'truco-hand-result ' + (h.winner === 'player' ? 'won' : 'lost'));
   actions(board, button('Siguiente mano', () => { seen = new Set(); game.trucoAct('next'); showTruco(); }, 'button primary')).classList.add('truco-later');
   return;
  }
  const mine = el('div', 'truco-hand mine');
  const play = card => { shout = null; game.trucoAct('play', card.id); showTruco(); };
  h.cards.player.forEach((card, i) => mine.append(cardButton(card, o.play, () => play(card), i, h.cards.player.length)));
  board.append(mine);
  const pend = h.pending;
  if (pend && pend.to === 'player') paragraph(board, 'El alma cantó ' + (pend.type === 'truco' ? T.TRUCO_NAMES[pend.level] : T.ENVIDO_NAMES[h.envido.calls[h.envido.calls.length - 1]]) + '. ¿Querés?', 'truco-call');
  else if (o.play) paragraph(board, 'Te toca jugar.' + (o.envido.length ? ' Tenés ' + T.envidoPoints(h.start.player) + ' de envido.' : ''), 'hint truco-turn');
  const bar = el('div', 'truco-actions'), act = (label, action, arg, cls = 'shop-buy') => bar.append(button(label, () => { shout = null; game.trucoAct(action, arg); updateHud(true); showTruco(); }, cls));
  if (o.answer) { act('Quiero', 'quiero', null, 'shop-buy truco-yes'); act('No quiero', 'noquiero'); }
  o.envido.forEach(kind => act(T.ENVIDO_NAMES[kind], 'envido', kind));
  if (o.truco) act(o.trucoName, 'truco');
  if (o.fold) act('Me voy al mazo', 'fold', null, 'shop-buy truco-fold');
  board.append(bar);
  paragraph(board, 'Sin flor. Pardas: decide la mano siguiente; si son todas pardas, gana el que es mano. Esta mano sos ' + (m.mano === 'player' ? 'mano' : 'pie') + '.', 'hint truco-rules');
 }, confirmLeave);
 if (wasOpen && box) box.scrollTop = scroll;
 scheduleGhost(!h.played.ghost.length && !h.played.player.length && !h.pending);
}
function leaveTable() { clearTimeout(ghostTimer); shout = null; seen = new Set(); game.trucoLeave(); hideModal(); updateHud(true); }
function confirmLeave() {
 const t = game.truco; if (!t || t.settled) { leaveTable(); return; }
 UI.confirmAction('¿Te levantás de la mesa?', t.rematch ? 'Si dejás la revancha a la mitad, el alma se lleva ◉ ' + t.bet * 2 + '.' : 'Si te vas a la mitad, el alma se queda con los ◉ ' + t.bet + ' de la apuesta.', leaveTable, showTruco, 'Levantarme');
}
// En la mesa de las almas: elegí cuánto apostar.
function trucoSection(n, parent) {
 if (game.npcShop(n) !== 'truco') return;
 parent.append(el('h3', 'smith-heading', 'Truco a 15 · apostá guita'));
 paragraph(parent, 'Si ganás, te llevás el doble de lo que apostaste. Si el alma pierde, a veces (3 de cada 10) te pide la revancha: si gana ella, te saca el doble; si ganás vos, te da un objeto al azar.', 'hint');
 const bets = el('div', 'truco-bets');
 Zak.TRUCO.bets.forEach(bet => { const b = button('◉ ' + bet, () => { seen = new Set(); shout = null; const r = game.trucoStart(bet, n.name, false, true); if (!r.ok) { toast(r.message, true); return; } updateHud(true); showTruco(); }, 'shop-buy'); b.disabled = game.player.coins < bet; b.setAttribute('aria-label', 'Apostar ' + bet + ' de guita'); bets.append(b); });
 parent.append(bets);
 const p = game.player; if ((p.trucoWins || 0) + (p.trucoLosses || 0)) paragraph(parent, 'Partidos: ' + (p.trucoWins || 0) + ' ganados · ' + (p.trucoLosses || 0) + ' perdidos · revanchas ganadas: ' + (p.trucoRematchWins || 0) + '.', 'hint');
}

/* ---------- Medallero ---------- */
function showMedals(back = null) {
 const p = game.player; if (!p) return;
 const owned = p.medals || [];
 openModal('Medallero', 'MEDALLAS · ' + owned.length + ' DE ' + Zak.MEDALS.length, parent => {
  paragraph(parent, 'Cada logro tiene su medalla. Las grises todavía te faltan, y cómo se consiguen es un secreto: solo se ve el nombre. Probá cosas.', 'hint');
  const progress = el('div', 'medal-progress'), bar = el('div', 'sheet-xp'), fill = el('i'); fill.style.width = Math.round(100 * owned.length / Zak.MEDALS.length) + '%'; bar.append(fill);
  progress.append(el('span', '', '🏅'), bar, el('b', '', owned.length + ' / ' + Zak.MEDALS.length)); parent.append(progress);
  const grid = el('div', 'medal-grid');
  // Primero las que ya ganaste.
  [...Zak.MEDALS].sort((a, b) => owned.includes(b.id) - owned.includes(a.id)).forEach(m => {
   const has = owned.includes(m.id), card = el('div', 'medal-card' + (has ? '' : ' locked'), ''), c = canvasOf(88, 96);
   Zak.drawMedalCanvas(c, m.id, !has); c.setAttribute('aria-label', (has ? 'Medalla ' : 'Medalla bloqueada ') + m.name);
   card.append(c, el('strong', '', m.name), el('small', '', has ? m.detail : '¿Cómo se consigue? Es un secreto.')); grid.append(card);
  });
  parent.append(grid);
 }, back);
}

/* ---------- Compañeros ---------- */
// Nivel, experiencia y la habilidad del nivel 5.
function petLevelInfo(body, id) {
 const L = Zak.PET_LEVELS; if (!L || !game.ownsPet(id)) return;
 const lv = game.petLevel(id), skill = Zak.PET_SKILLS[id], bar = el('div', 'pet-xp'), fill = el('i');
 fill.style.width = (lv >= L.max ? 100 : Math.min(100, Math.round(100 * game.petXp(id) / game.petXpNeeded(lv)))) + '%'; bar.append(fill);
 body.append(el('small', 'pet-level', 'Nivel ' + lv + (lv >= L.max ? ' (máximo)' : ' · ' + Math.floor(game.petXp(id)) + '/' + game.petXpNeeded(lv) + ' EXP')), bar);
 body.append(el('small', 'pet-skill' + (lv >= L.skillAt ? '' : ' locked'), (lv >= L.skillAt ? '✦ ' : '🔒 Nivel ' + L.skillAt + ': ') + skill.name + '. ' + skill.detail));
}
function petCard(parent, id) {
 const card = el('div', 'pet-card'), c = canvasOf(90, 102, 'pet-portrait'); Zak.drawPetPortrait(c, id);
 const body = el('div'); body.append(el('strong', '', game.petName(id) + ' · ' + Zak.PETS[id].species), el('small', '', Zak.PETS[id].detail)); petLevelInfo(body, id);
 card.append(c, body); parent.append(card);
}
function showNamePet(id, back = null) {
 if (!game.ownsPet(id)) return;
 const pet = Zak.PETS[id];
 openModal('¿Cómo se llama?', 'COMPAÑERO NUEVO · ' + pet.species.toUpperCase(), parent => {
  petCard(parent, id);
  const label = el('label', 'cloud-field'), input = el('input'); label.append(el('span', '', 'Nombre (hasta 14 letras)')); input.maxLength = 14; input.value = game.petName(id); input.spellcheck = false; input.id = 'pet-name';
  label.append(input); parent.append(label);
  const save = () => { const r = game.namePet(id, input.value); toast(r.message); hideModal(); updateHud(true); };
  input.addEventListener('keydown', event => { if (event.key === 'Enter') { event.preventDefault(); save(); } });
  actions(parent, button('Ponerle el nombre', save, 'button primary'));
  requestAnimationFrame(() => { input.focus(); input.select(); });
 }, back);
}
function showKennel(id) {
 const p = game.player; if (!game.ownsPet(id)) return;
 openModal('La guardería', 'DOÑA HERMINIA CUIDA A TUS COMPAÑEROS', parent => {
  petCard(parent, id);
  paragraph(parent, p.pet ? 'Ahora te acompaña ' + game.petName(p.pet) + '. Si salís con ' + game.petName(id) + ', ' + game.petName(p.pet) + ' se queda acá.' : 'Ahora no te acompaña nadie.', 'hint');
  const go = UI.iconed(button('Salir con ' + game.petName(id), () => { const r = game.equipPet(id); toast(r.message); hideModal(); updateHud(true); }, 'button primary'), '🐾');
  const rename = UI.iconed(button('Cambiarle el nombre', () => showNamePet(id, () => showKennel(id))), '✎');
  if (p.pet !== id && game.petLevel(id) < Zak.PET_LEVELS.max) { const price = Zak.PET_LEVELS.train.price(game.petLevel(id)), train = UI.iconed(button('Que Doña Herminia lo entrene · ◉ ' + price, () => { const r = game.trainPet(id); updateHud(true); toast(r.message, !r.ok); showKennel(id); }), '★'); train.disabled = p.coins < price; parent.append(train); paragraph(parent, 'Cada entrenamiento le da medio nivel. Al que llevás con vos lo entrenás peleando.', 'hint'); }
  const extra = p.pet ? [button('Dejar a ' + game.petName(p.pet) + ' acá y salir sin compañero', () => { const r = game.equipPet(null); toast(r.message); hideModal(); updateHud(true); })] : [];
  actions(parent, go, rename, ...extra, button('Listo', () => hideModal()));
 });
}
function showBatFeed() {
 const prog = game.petData().bat;
 openModal('Un murciélago chiquito', 'CUEVA PROFUNDA', parent => {
  paragraph(parent, 'Un murciélago chiquito... el pobre parece tener hambre.');
  paragraph(parent, '¿Le das de tu sangre? Te deja con 1 de vida, en plena cueva. (' + prog.fed + '/' + Zak.PET_BAT.feeds + ')', 'hint');
  actions(parent, button('Darle de mi sangre', () => { const r = game.feedBat(); updateHud(true); if (r.tamed) { toast(r.message); return; } hideModal(); toast(r.message, !r.ok); }, 'button primary'), button('Mejor no', () => hideModal()));
 });
}
// Doña Herminia: dejarle la viborita, ver cuánto falta y buscarla.
function herminiaSection(n, parent) {
 if (n.name !== 'Doña Herminia') return;
 const p = game.player, s = game.snakeState(), price = Zak.PET_SNAKE.price;
 if (p.carrying === 'snake') {
  parent.append(el('h3', 'smith-heading', 'La viborita'));
  paragraph(parent, p.coins >= price ? 'Le pagás ◉ ' + price + ' ahora y en 10 minutos te la devuelve criada.' : 'No te alcanza para los ◉ ' + price + ': te la cuida igual y se los pagás cuando la busques. Hasta entonces no te la devuelve.', 'hint');
  actions(parent, button(p.coins >= price ? 'Dejársela · ◉ ' + price : 'Dejársela y pagar después', () => { const r = game.leaveSnake(); updateHud(true); UI.showNpc(n, r.message); }, 'button primary'));
 } else if (s.state === 'nursery') {
  const left = game.snakeReadyIn();
  parent.append(el('h3', 'smith-heading', 'Tu viborita'));
  if (left > 0) paragraph(parent, 'Todavía le falta: ' + Zak.formatTime(left) + '. ' + (s.paid ? 'Ya está paga.' : 'Te falta pagarle ◉ ' + price + '.'), 'hint');
  else {
   const go = button(s.paid ? 'Llevármela' : 'Pagar ◉ ' + price + ' y llevármela', () => { const r = game.collectSnake(); updateHud(true); if (r.ok) toast(r.message); else UI.showNpc(n, r.message); }, 'button primary');
   go.disabled = !s.paid && p.coins < price; actions(parent, go);
  }
 }
}
// Puerta del trono: la pelea de siempre o la revancha contra Zak furioso.
function showThroneChoice() {
 openModal('La puerta del trono', 'YA VENCISTE A ZAK', parent => {
  paragraph(parent, 'La llave entra en la cerradura. Del otro lado, Zak te está esperando. ¿Cómo querés entrar?');
  paragraph(parent, 'Revancha: Zak viene furioso, con 50% más de vida, y hace todo un 30% más rápido. Tu tiempo va al ranking «Revancha Zak».', 'hint');
  actions(parent, button('Revancha: Zak furioso', () => { hideModal(); game.openThroneDoor('fury'); }, 'button primary'), button('La pelea de siempre', () => { hideModal(); game.openThroneDoor('normal'); }), button('Todavía no', () => hideModal()));
 });
}
// Segunda página de la ficha: tu compañero, sus números, su habilidad y su nombre.
// Los que todavía no tenés se ven como silueta, con la pista de cómo se consiguen.
const HOW = Zak.PET_HOW = Object.assign({dog: 'Un perro con el plato vacío espera en la puerta de La guardería. Comprá comida para perro en El Almacén.', bat: 'En la Cueva Profunda, arriba a la derecha, cuelga un murcielaguito con hambre.', snake: 'A veces, al caer la Yarará Madre, uno de sus huevos se rompe.', golem: 'A veces, al caer el Gólem Minero, entre los escombros queda uno chiquito.'}, Zak.PET_HOW || {});
const num = n => (Math.round(n * 10) / 10).toLocaleString('es-AR');
function petSilhouette(c, id) {
 Zak.drawPetPortrait(c, id); const x = c.getContext('2d'); x.save(); x.globalCompositeOperation = 'source-in'; x.fillStyle = '#0b1d17'; x.fillRect(0, 0, c.width, c.height); x.restore();
}
function petSheet(parent, wanted, show) {
 const p = game.player, owned = Zak.PET_ORDER.filter(id => game.ownsPet(id));
 const id = Zak.PET_ORDER.includes(wanted) ? wanted : p.pet && game.ownsPet(p.pet) ? p.pet : owned[0] || Zak.PET_ORDER[0], has = game.ownsPet(id), def = Zak.PETS[id], L = Zak.PET_LEVELS;
 const chips = el('div', 'pet-chips');
 Zak.PET_ORDER.forEach(k => {
  const mine = game.ownsPet(k), chip = button((mine ? Zak.PETS[k].icon + ' ' + game.petName(k) : '❔ ???') + (p.pet === k ? ' ★' : ''), () => show(k), 'pet-chip' + (k === id ? ' selected' : '') + (mine ? '' : ' locked'));
  chip.setAttribute('aria-label', mine ? game.petName(k) + ', ' + Zak.PETS[k].species + (p.pet === k ? ', te acompaña' : '') : 'Compañero que todavía no tenés'); chip.setAttribute('aria-pressed', String(k === id)); chips.append(chip);
 });
 parent.append(chips);
 const hero = el('div', 'sheet-hero'), frame = el('div', 'sheet-frame pet'), c = canvasOf(120, 136, 'sheet-portrait');
 if (has) Zak.drawPetPortrait(c, id); else petSilhouette(c, id);
 c.setAttribute('aria-label', has ? 'Retrato de ' + game.petName(id) : 'Silueta de un compañero que todavía no tenés'); frame.append(c);
 if (has) frame.append(el('span', 'sheet-frame-level', 'NVL ' + game.petLevel(id)));
 hero.append(frame);
 const info = el('div', 'sheet-info');
 if (!has) {
  info.append(el('span', 'sheet-kicker', 'TODAVÍA NO LO TENÉS'), el('strong', 'sheet-name', '???'), el('p', 'pet-how', HOW[id]));
  hero.append(info); parent.append(hero);
  if (!owned.length) paragraph(parent, 'Los compañeros te ayudan un poco en las peleas, sobre todo con sus efectos. Hay cuatro para encontrar.', 'hint');
  return;
 }
 const lv = game.petLevel(id), max = lv >= L.max, bar = el('div', 'sheet-xp'), fill = el('i');
 fill.style.width = (max ? 100 : Math.min(100, Math.round(100 * game.petXp(id) / game.petXpNeeded(lv)))) + '%'; bar.append(fill);
 info.append(el('span', 'sheet-kicker', def.species.toUpperCase() + ' · ' + (p.pet === id ? 'TE ACOMPAÑA' : 'EN LA GUARDERÍA')), el('strong', 'sheet-name', game.petName(id)),
  el('small', 'sheet-xp-text', max ? 'Nivel máximo: son uña y carne' : 'Experiencia · ' + Math.floor(game.petXp(id)) + ' / ' + game.petXpNeeded(lv)), bar);
 const rename = el('form', 'pet-rename'), input = el('input'), save = button('Cambiar nombre', () => {}, 'shop-buy');
 input.maxLength = 14; input.value = game.petName(id); input.spellcheck = false; input.id = 'pet-sheet-name'; input.setAttribute('aria-label', 'Nombre del compañero (hasta 14 letras)'); save.type = 'submit';
 rename.append(input, save); rename.addEventListener('submit', event => { event.preventDefault(); const r = game.namePet(id, input.value); toast(r.message, r.ok === false); updateHud(true); show(id); });
 info.append(rename); hero.append(info); parent.append(hero);
 parent.append(el('h3', 'sheet-heading', 'Estadísticas'));
 const tiles = el('div', 'sheet-now three'), special = def.special * game.petFactor(id, 'cooldown');
 [['⚔', 'Daño por golpe', num(game.petDamage(id))], ['⏱', 'Golpe cada', num(def.every) + ' s'], ['✦', 'Especial cada', num(special) + ' s'], ['⌛', 'Efectos', '+' + Math.round((game.petFactor(id, 'effect') - 1) * 100) + '%'], [def.range ? '🎯' : '✋', 'Alcance', def.range ? 'de lejos' : 'cuerpo a cuerpo'], ['▲', 'Daño por nivel', '+' + num(L.damage * 100) + '%']]
  .forEach(([icon, label, value]) => { const tile = el('div', 'sheet-tile'); tile.append(el('span', 'sheet-tile-icon', icon), el('small', '', label), el('b', '', value)); tiles.append(tile); });
 parent.append(tiles);
 paragraph(parent, 'El daño sale de tu golpe con el arma que tenés en la mano. Al subir de nivel casi no pega más: lo que mejora son sus efectos.', 'hint sheet-hint');
 parent.append(el('h3', 'sheet-heading', 'Lo que sabe hacer'));
 const skills = el('div', 'traits sheet-traits pet'), skill = Zak.PET_SKILLS[id], learned = lv >= L.skillAt;
 const trait = (title, text, cls) => { const t = el('div', 'trait ' + cls); t.append(el('h3', '', title)); paragraph(t, text); skills.append(t); };
 trait('✦ Especial', def.detail, '');
 trait((learned ? '★ ' : '🔒 ') + skill.name + (learned ? '' : ' · nivel ' + L.skillAt), skill.detail, learned ? 'skill' : 'locked');
 parent.append(skills);
 if (p.pet !== id) paragraph(parent, 'Está en La guardería: para salir con él, hablá con Doña Herminia.', 'hint');
 if (p.carrying === 'snake') paragraph(parent, '🐍 Llevás a la viborita en brazos: llevala con Doña Herminia, en La guardería.', 'hint shop-message');
}
function statusTags(list) {
 const p = game.player;
 if (p.pet && game.ownsPet(p.pet)) list.push(Zak.PETS[p.pet].icon + ' ' + game.petName(p.pet));
 if (p.carrying === 'snake') list.push('🐍 Viborita en brazos: no podés atacar');
 if (p.stoneShield > 0) list.push('🪨 Escudo de piedra ' + Math.ceil(p.stoneShield) + ' s');
 if (game.zakFury && game.biome === 'throne') list.push('☠ Zak furioso');
}
UI.npcSections = [...(UI.npcSections || []), trucoSection, herminiaSection];
UI.statusTags = [...(UI.statusTags || []), statusTags];
UI.petSheet = petSheet; UI.showMedals = showMedals; UI.showTruco = showTruco; UI.showNamePet = showNamePet; UI.showKennel = showKennel;

const baseEvent = game.onEvent;
game.onEvent = (type, detail = {}) => {
 if (type === 'medals') return showMedals();
 if (type === 'namePet') return showNamePet(detail.pet);
 if (type === 'kennel') return showKennel(detail.pet);
 if (type === 'batFeed') return showBatFeed();
 if (type === 'throneChoice') return showThroneChoice();
 return baseEvent(type, detail);
};
})();
