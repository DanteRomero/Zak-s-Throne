/* Ventanas de la v2.24: el bestiario (con su luna roja en el borde de cada página), el desafío semanal
   en el diario y lo que dice el vendedor ambulante. */
(function () {
'use strict';
const Zak = window.Zak, game = window.zakGame, UI = Zak.UI, {el, button, paragraph, openModal} = UI;
const canvasOf = (w, h, cls) => { const c = el('canvas', cls); c.width = w; c.height = h; return c; };

/* ---------- Bestiario ---------- */
const STAT_ROWS = [['health', 'Vida'], ['strength', 'Fuerza'], ['speed', 'Velocidad'], ['armor', 'Armadura'], ['poison', 'Veneno'], ['xp', 'EXP']];
function moonButton(on, onClick) {
 const b = button('', onClick, 'bestiary-moon' + (on ? ' on' : '')); b.setAttribute('aria-label', on ? 'Volver a su forma normal' : 'Ver su forma de luna roja'); b.setAttribute('aria-pressed', String(on));
 b.title = on ? 'Forma normal' : 'Forma de luna roja'; return b;
}
function showBestiary(index = 0, moon = false, back = null) {
 const order = Zak.BESTIARY_ORDER, n = order.length; index = ((index % n) + n) % n;
 const type = order[index], def = Zak.ENEMY_TYPES[type], known = game.bestiaryKnown(type), moonKnown = game.bestiaryMoon(type), open = moon ? moonKnown : known;
 const total = order.filter(t => game.bestiaryKnown(t)).length;
 openModal('Bestiario', 'PÁGINA ' + (index + 1) + ' DE ' + n + ' · CONOCÉS ' + total, parent => {
  const page = el('div', 'bestiary-page' + (moon ? ' moon' : '') + (open ? '' : ' locked'));
  page.append(moonButton(moon, () => showBestiary(index, !moon, back)));
  const head = el('div', 'bestiary-head'), portrait = canvasOf(150, 150, 'bestiary-portrait');
  Zak.drawEnemyPortrait(portrait, type, {moon, silhouette: !open}); portrait.setAttribute('aria-label', open ? def.name : 'Silueta de un enemigo que todavía no venciste');
  const title = el('div', 'bestiary-title');
  title.append(el('span', 'bestiary-kind', def.boss ? (moon ? 'JEFE · LUNA ROJA' : 'JEFE') : moon ? 'LUNA ROJA' : 'ENEMIGO'), el('h3', '', open ? def.name : '???'));
  title.append(el('small', '', open ? (moon ? 'Vencido con luna roja: ' + game.player.moonKills[type] : 'Vencidos: ' + (game.bestiaryKills(type) || 'alguno')) : moon ? 'Vencelo durante una luna roja para completar esta página.' : 'Vencelo para completar esta página.'));
  head.append(portrait, title); page.append(head);
  page.append(el('p', 'bestiary-story', open ? (moon ? Zak.moonStory(type) : Zak.BESTIARY[type].story) : '???'));
  const stats = game.bestiaryStats(type, moon), table = el('div', 'bestiary-stats');
  table.append(el('span', 'bestiary-th', ''), el('span', 'bestiary-th', 'Base'), el('span', 'bestiary-th', 'Ahora (nivel ' + stats.level + ')'));
  for (const [key, label] of STAT_ROWS) {
   if (key === 'poison' && !stats.base.poison) continue;
   table.append(el('span', 'bestiary-label', label), el('b', '', open ? String(stats.base[key]) : '—'), el('b', '', open ? String(stats.now[key]) : '—'));
  }
  page.append(table);
  if (open && !moon) page.append(el('p', 'bestiary-note', def.description));
  parent.append(page);
  const nav = el('div', 'bestiary-nav');
  nav.append(button('◀', () => showBestiary(index - 1, false, back), 'shop-buy bestiary-prev'), el('span', '', (index + 1) + ' / ' + n), button('▶', () => showBestiary(index + 1, false, back), 'shop-buy bestiary-next'));
  parent.append(nav);
  const strip = el('div', 'bestiary-strip');
  order.forEach((t, i) => {
   const b = button('', () => showBestiary(i, false, back), 'bestiary-thumb' + (i === index ? ' selected' : '')), c = canvasOf(48, 48);
   Zak.drawEnemyPortrait(c, t, {silhouette: !game.bestiaryKnown(t)}); b.append(c); b.setAttribute('aria-label', game.bestiaryKnown(t) ? Zak.ENEMY_TYPES[t].name : 'Página ' + (i + 1) + ', sin completar');
   if (game.bestiaryMoon(t)) b.append(el('i', 'bestiary-thumb-moon'));
   strip.append(b);
  });
  parent.append(strip);
 }, back);
}

/* ---------- Desafío semanal ---------- */
const leftText = ms => { const h = Math.floor(ms / 36e5), d = Math.floor(h / 24); return d ? d + ' día' + (d > 1 ? 's' : '') + ' y ' + (h % 24) + ' h' : h + ' h ' + Math.floor(ms % 36e5 / 6e4) + ' min'; };
function weeklyBox(parent) {
 const w = game.weekly(), c = game.weeklyChallenge(), box = el('div', 'weekly-box' + (w.done ? ' done' : ''));
 box.append(el('span', 'weekly-kind', '📅 DESAFÍO SEMANAL · QUEDAN ' + leftText(Zak.weekLeft()).toUpperCase()), el('strong', '', c.name), el('small', '', c.detail));
 const bar = el('div', 'weekly-bar'), fill = el('i'); fill.style.width = Math.round(100 * w.count / c.goal) + '%'; bar.append(fill); box.append(bar);
 box.append(el('small', 'weekly-count', w.count + ' de ' + c.goal));
 const prize = '◉ ' + Zak.WEEKLY.coins + ' y ' + Zak.WEEKLY.xp + ' EXP (x1,5 para el primero)';
 box.append(el('small', '', w.paid ? (w.first ? '🥇 ¡Fuiste el primero! Cobraste x1,5.' : '✓ Cumplido y cobrado.') : w.done ? 'Cumplido. Cobrando el premio...' : 'Premio: ' + prize + '.'));
 parent.append(box);
}
function journalSection(parent, back, blocks) {
 const known = Zak.BESTIARY_ORDER.filter(t => game.bestiaryKnown(t)).length, n = Zak.BESTIARY_ORDER.length;
 if (blocks && UI.journalBlock) { const block = UI.journalBlock(blocks, '📖', 'Bestiario', known + ' de ' + n + ' · K', known / n, () => showBestiary(0, false, back), 'journal-bestiary'); blocks.insertBefore(block, blocks.children[1] || null); }
 else parent.append(button('📖 Bestiario · ' + known + ' de ' + n + ' (K)', () => showBestiary(0, false, back), 'button secondary journal-bestiary'));
 weeklyBox(parent);
}

/* ---------- Vendedor ambulante ---------- */
function wandererSection(n, parent) {
 if (game.npcShop(n) !== 'wanderer') return;
 const now = game.wanderer(); if (!now) return;
 paragraph(parent, '«Me quedo ' + Math.max(1, Math.ceil(now.left / 60)) + ' minuto' + (Math.ceil(now.left / 60) > 1 ? 's' : '') + ' más y me voy. Lo que no compres ahora, capaz no lo veas nunca más.»', 'hint');
}

UI.journalSections = [...(UI.journalSections || []), journalSection];
UI.npcSections = [...(UI.npcSections || []), wandererSection];
UI.showBestiary = showBestiary;
const baseEvent = game.onEvent;
game.onEvent = (type, detail = {}) => {
 if (type === 'bestiary') return showBestiary();
 return baseEvent(type, detail);
};
})();
