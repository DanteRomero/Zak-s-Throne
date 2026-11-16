/* Ventanas de la v2.21: la mesa de truco, el medallero, el nombre de los compañeros, la guardería,
   el murcielaguito, Doña Herminia y la puerta del trono para la revancha. */
(function () {
'use strict';
const Zak = window.Zak, game = window.zakGame, UI = Zak.UI, {el, button, paragraph, openModal, hideModal, toast, updateHud} = UI;
const T = Zak.Truco;
const canvasOf = (w, h, cls) => { const c = el('canvas', cls); c.width = w; c.height = h; return c; };
const actions = (parent, ...buttons) => { const box = el('div', 'modal-actions'); box.append(...buttons); parent.append(box); return box; };

/* ---------- Truco ---------- */
// Lo que dice el alma: su última frase, para que se lea qué cantó.
const LAST = 6;
function trucoLog(parent, match) {
 const box = el('div', 'truco-log');
 match.log.slice(-LAST).forEach(line => box.append(el('div', 'truco-line ' + (line.side || 'table'), (line.side === 'player' ? 'Vos: ' : line.side === 'ghost' ? 'El alma: ' : '') + line.text)));
 parent.append(box);
}
function cardButton(card, enabled, onClick) {
 const b = button('', onClick, 'truco-card'); b.disabled = !enabled; b.setAttribute('aria-label', 'Jugar el ' + Zak.cardName(card));
 const c = canvasOf(40, 60); Zak.drawCard(c, card); b.append(c); return b;
}
function tableRow(cards, label) {
 const row = el('div', 'truco-row'); row.append(el('span', 'truco-who', label));
 for (let i = 0; i < 3; i++) { const slot = el('span', 'truco-slot'); if (cards[i]) { const c = canvasOf(40, 60); Zak.drawCard(c, cards[i]); c.setAttribute('aria-label', Zak.cardName(cards[i])); slot.append(c); } row.append(slot); }
 return row;
}
function showTruco() {
 const t = game.truco; if (!t) return;
 const m = t.match, h = m.hand, o = T.options(m, 'player'), p = game.player;
 openModal('Truco a ' + m.target, 'FERIA DE LAS ALMAS · CONTRA ' + t.opponent.toUpperCase(), parent => {
  const score = el('div', 'truco-score');
  score.append(el('span', '', 'Vos ' + m.score.player), el('b', '', t.rematch ? 'REVANCHA · si perdés, ◉ ' + t.bet * 2 : 'En juego: ◉ ' + t.bet), el('span', '', m.score.ghost + ' ' + t.opponent));
  parent.append(score);
  const ghostHand = el('div', 'truco-hand ghost'); for (let i = 0; i < h.cards.ghost.length; i++) { const c = canvasOf(40, 60); Zak.drawCard(c, null, true); ghostHand.append(c); } parent.append(ghostHand);
  const table = el('div', 'truco-table'); table.append(tableRow(h.played.ghost, t.opponent), tableRow(h.played.player, 'Vos')); parent.append(table);
  trucoLog(parent, m);
  if (m.over) {
   const won = m.winner === 'player';
   paragraph(parent, won ? (t.rematch ? '¡Le ganaste la revancha!' : '¡Ganaste el partido! Te llevás ◉ ' + t.bet * 2 + '.') : (t.rematch ? 'Perdiste la revancha: el alma se lleva ◉ ' + t.bet * 2 + '.' : 'Perdiste el partido y los ◉ ' + t.bet + ' de la apuesta.'), 'truco-result ' + (won ? 'won' : 'lost'));
   if (t.prize) paragraph(parent, 'Premio de la revancha: ' + t.prize.icon + ' ' + t.prize.name + '.', 'hint shop-message');
   if (t.offer) {
    paragraph(parent, '«¿Ah, sí? Revancha. Si gano yo, me das el doble: ◉ ' + t.bet * 2 + '. Si ganás vos, te doy algo del otro lado.»', 'truco-offer');
    const yes = button('Aceptar la revancha', () => { const r = game.trucoRematch(); if (!r.ok) { toast(r.message, true); return; } updateHud(true); showTruco(); }, 'button primary'); yes.disabled = p.coins < t.bet * 2;
    actions(parent, yes, button('No, gracias', leaveTable));
    if (yes.disabled) paragraph(parent, 'Para aceptarla tenés que poder cubrir ◉ ' + t.bet * 2 + '.', 'hint');
   } else actions(parent, button('Levantarme de la mesa', leaveTable, 'button primary'));
   return;
  }
  if (h.finished) { paragraph(parent, h.winner === 'player' ? 'Te llevaste la mano.' : 'La mano fue para el alma.', 'hint shop-message'); actions(parent, button('Siguiente mano', () => { game.trucoAct('next'); showTruco(); }, 'button primary')); return; }
  const mine = el('div', 'truco-hand mine');
  h.cards.player.forEach(card => mine.append(cardButton(card, o.play, () => { game.trucoAct('play', card.id); showTruco(); })));
  parent.append(mine);
  const pend = h.pending;
  if (pend && pend.to === 'player') paragraph(parent, 'El alma cantó: ' + (pend.type === 'truco' ? T.TRUCO_NAMES[pend.level] : T.ENVIDO_NAMES[h.envido.calls[h.envido.calls.length - 1]]) + '. ¿Querés?', 'truco-call');
  else if (o.play) paragraph(parent, 'Te toca jugar.' + (o.envido.length ? ' Tenés ' + T.envidoPoints(h.start.player) + ' de envido.' : ''), 'hint');
  const bar = el('div', 'truco-actions'), act = (label, action, arg, cls = 'shop-buy') => bar.append(button(label, () => { game.trucoAct(action, arg); updateHud(true); showTruco(); }, cls));
  if (o.answer) { act('Quiero', 'quiero', null, 'shop-buy truco-yes'); act('No quiero', 'noquiero'); }
  o.envido.forEach(kind => act(T.ENVIDO_NAMES[kind], 'envido', kind));
  if (o.truco) act(o.trucoName, 'truco');
  if (o.fold) act('Me voy al mazo', 'fold', null, 'shop-buy truco-fold');
  parent.append(bar);
  paragraph(parent, 'Se juega sin flor. Pardas: decide la mano siguiente; si son todas pardas, gana el que es mano. Esta mano sos ' + (m.mano === 'player' ? 'mano vos' : 'pie') + '.', 'hint');
 }, confirmLeave);
}
function leaveTable() { game.trucoLeave(); hideModal(); updateHud(true); }
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
 Zak.TRUCO.bets.forEach(bet => { const b = button('◉ ' + bet, () => { const r = game.trucoStart(bet, n.name); if (!r.ok) { toast(r.message, true); return; } updateHud(true); showTruco(); }, 'shop-buy'); b.disabled = game.player.coins < bet; b.setAttribute('aria-label', 'Apostar ' + bet + ' de guita'); bets.append(b); });
 parent.append(bets);
 const p = game.player; if ((p.trucoWins || 0) + (p.trucoLosses || 0)) paragraph(parent, 'Partidos: ' + (p.trucoWins || 0) + ' ganados · ' + (p.trucoLosses || 0) + ' perdidos · revanchas ganadas: ' + (p.trucoRematchWins || 0) + '.', 'hint');
}

/* ---------- Medallero ---------- */
function showMedals(back = null) {
 const p = game.player; if (!p) return;
 const owned = p.medals || [];
 openModal('Medallero', 'MEDALLAS · ' + owned.length + ' DE ' + Zak.MEDALS.length, parent => {
  paragraph(parent, 'Cada logro tiene su medalla. Las grises todavía te faltan: abajo dice cómo se consiguen.', 'hint');
  const grid = el('div', 'medal-grid');
  Zak.MEDALS.forEach(m => {
   const has = owned.includes(m.id), card = el('div', 'medal-card' + (has ? '' : ' locked'), ''), c = canvasOf(88, 96);
   Zak.drawMedalCanvas(c, m.id, !has); c.setAttribute('aria-label', (has ? 'Medalla ' : 'Medalla bloqueada ') + m.name);
   card.append(c, el('strong', '', has ? m.name : '¿?'), el('small', '', m.detail)); grid.append(card);
  });
  parent.append(grid);
 }, back);
}

/* ---------- Compañeros ---------- */
function petCard(parent, id) {
 const card = el('div', 'pet-card'), c = canvasOf(90, 102, 'pet-portrait'); Zak.drawPetPortrait(c, id);
 const body = el('div'); body.append(el('strong', '', game.petName(id) + ' · ' + Zak.PETS[id].species), el('small', '', Zak.PETS[id].detail));
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
  const go = button('Salir con ' + game.petName(id), () => { const r = game.equipPet(id); toast(r.message); hideModal(); updateHud(true); }, 'button primary');
  const rename = button('Cambiarle el nombre', () => showNamePet(id, () => showKennel(id)));
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
// Compañeros en la bolsa: quién te acompaña y cómo se consiguen los demás.
const HOW = {dog: 'Un perro con el plato vacío espera en la puerta de La guardería. Comprá comida para perro en El Almacén.', bat: 'En la Cueva Profunda, arriba a la derecha, cuelga un murcielaguito con hambre.', snake: 'A veces, al caer la Yarará Madre, uno de sus huevos se rompe.', golem: 'A veces, al caer el Gólem Minero, entre los escombros queda uno chiquito.'};
function bagSection(parent) {
 const p = game.player;
 parent.append(el('h3', 'smith-heading', 'Compañeros'));
 Zak.PET_ORDER.forEach(id => {
  const has = game.ownsPet(id), row = el('div', 'shop-item' + (has ? '' : ' sold-out')), body = el('div');
  body.append(el('strong', '', Zak.PETS[id].icon + ' ' + (has ? game.petName(id) + ' · ' : '') + Zak.PETS[id].species + (p.pet === id ? ' · te acompaña' : has ? ' · en La guardería' : '')), el('small', '', has ? Zak.PETS[id].detail : HOW[id]));
  row.append(body);
  if (has) row.append(button('Nombre', () => showNamePet(id, () => UI.showBag()), 'shop-buy'));
  parent.append(row);
 });
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
UI.bagSections = [...(UI.bagSections || []), bagSection];
UI.statusTags = [...(UI.statusTags || []), statusTags];
UI.showMedals = showMedals; UI.showTruco = showTruco; UI.showNamePet = showNamePet; UI.showKennel = showKennel;

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
