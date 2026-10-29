/* Zak's Throne — menús, accesibilidad y guardados locales. */
(function () {
  'use strict';
  const Zak = window.Zak;
  const $ = id => document.getElementById(id);
  const game = window.zakGame = new Zak.Game($('world'));
  $('world').tabIndex = 0;
  const SAVE_PREFIX = 'zak.throne.save.';
  const SETTINGS_KEY = 'zak.throne.settings.v1';
  const WEAPONS = ['fists', 'bow', 'sword', 'stone'];
  const ICONS = { fists: '✊', bow: '➶', sword: '⚔', stone: '◆' };
  let selected = 'gero', modalResume = false, modalBack = null, lastFocus = null, modalVersion = 0, suppressPause = false;
  let lastPortrait = '', lastHud = 0, hasStarted = false;
  const number = value => Number.isFinite(Number(value)) ? Number(value) : 0;
  const fmt = value => Number(number(value).toFixed(1)).toLocaleString('es-AR');
  const character = id => Zak.CHARACTERS.find(c => c.id === id) || Zak.CHARACTERS[0];
  const visibleModal = () => !$('modal-overlay').classList.contains('hidden');
  function el(tag, className, text) {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (text !== undefined) node.textContent = String(text);
    return node;
  }
  function button(text, action, className = 'button secondary') {
    const node = el('button', className, text);
    node.type = 'button'; node.addEventListener('click', action);
    return node;
  }
  function paragraph(parent, text, className = '') { const node = el('p', className, text); parent.append(node); return node; }
  function text(id, value) { const node = $(id); if (node && node.textContent !== String(value)) node.textContent = String(value); }
  function toast(message, error = false) {
    const node = el('div', 'toast' + (error ? ' error' : ''), message);
    $('toast-container').append(node);
    setTimeout(() => { node.classList.add('leaving'); setTimeout(() => node.remove(), 350); }, error ? 6500 : 4300);
  }
  function safeSettings() {
    try { const value = JSON.parse(localStorage.getItem(SETTINGS_KEY) || '{}'); return value && typeof value === 'object' ? value : {}; }
    catch (_) { return {}; }
  }
  const preferences = safeSettings();
  Object.keys(game.settings).forEach(key => { if (typeof preferences[key] === 'boolean' && typeof game.settings[key] === 'boolean') game.settings[key] = preferences[key]; });
  const CONTROL_SIZES = { small: ['Chicos', .7], medium: ['Medianos', .85], large: ['Grandes', 1] };
  if (CONTROL_SIZES[preferences.controls]) game.settings.controls = preferences.controls;
  const controlScale = () => CONTROL_SIZES[game.settings.controls][1];
  function applyControls() { document.documentElement.style.setProperty('--tc', controlScale()); }
  applyControls();
  if (game.sound) game.sound.enabled = game.settings.sound;
  function updateSound() {
    const enabled = !!game.settings.sound;
    $('sound-toggle').setAttribute('aria-label', enabled ? 'Desactivar sonido' : 'Activar sonido');
    $('sound-toggle').setAttribute('aria-pressed', String(enabled));
    const slash = $('sound-toggle').querySelector('.sound-slash');
    if (slash) slash.classList.toggle('hidden', enabled);
    if (game.sound) {
      game.sound.enabled = enabled;
      if (enabled && typeof game.sound.unlock === 'function') {
        try { const promise = game.sound.unlock(); if (promise && promise.catch) promise.catch(() => {}); } catch (_) {}
      }
    }
  }
  function persistSettings() {
    updateSound();
    try { localStorage.setItem(SETTINGS_KEY, JSON.stringify(game.settings)); }
    catch (_) { toast('Esta sesión aplica las opciones, pero el navegador no permite guardarlas.', true); }
  }
  $('sound-toggle').addEventListener('click', () => { game.settings.sound = !game.settings.sound; persistSettings(); });
  function validate(data) {
    const result = Zak.Game.validateSave(data);
    if (result === false) throw new Error('El archivo no contiene una partida válida.');
    return data;
  }
  function readSlot(index) {
    try {
      const raw = localStorage.getItem(SAVE_PREFIX + index);
      if (!raw) return { state: 'empty', index };
      try { return { state: 'valid', index, data: validate(JSON.parse(raw)) }; }
      catch (_) { return { state: 'invalid', index }; }
    } catch (_) { return { state: 'unavailable', index }; }
  }
  function updateSaveCount() { text('save-count', [1,2,3].filter(index => readSlot(index).state === 'valid').length + ' / 3'); }
  function openModal(title, eyebrow, build, back = null) {
    const wasOpen = visibleModal();
    if (!wasOpen) {
      lastFocus = document.activeElement;
      modalResume = game.state === 'playing' || game.state === 'paused';
    }
    if (game.state === 'playing') {
      suppressPause = true;
      try { game.pause(); } finally { suppressPause = false; }
    }
    modalBack = back;
    $('modal-overlay').classList.remove('hidden');
    const content = $('modal-content');
    content.replaceChildren(el('div', 'modal-eyebrow', eyebrow), el('h2', '', title));
    content.querySelector('h2').id = 'modal-title';
    build(content);
    const version = ++modalVersion;
    requestAnimationFrame(() => {
      if (version !== modalVersion || !visibleModal()) return;
      const first = content.querySelector('button:not(:disabled), input, [tabindex="0"]');
      (first || $('close-modal')).focus();
    });
  }
  function hideModal(resume = true) {
    $('modal-overlay').classList.add('hidden'); modalVersion++;
    modalBack = null;
    const shouldResume = resume && modalResume && game.player;
    modalResume = false;
    if (shouldResume && game.state === 'paused') game.resume();
    if (shouldResume && game.state === 'playing') $('world').focus();
    else if (lastFocus && document.contains(lastFocus)) lastFocus.focus();
  }
  function closeModal() { if (modalBack) { const back = modalBack; modalBack = null; back(); } else hideModal(); }
  $('close-modal').addEventListener('click', closeModal);
  document.addEventListener('keydown', event => {
    if (!visibleModal()) {
      if (event.target.closest && event.target.closest('button') && (event.key === ' ' || event.key === 'Enter')) event.stopPropagation();
      return;
    }
    if (event.key === 'Escape') { event.preventDefault(); event.stopImmediatePropagation(); closeModal(); return; }
    if (event.key !== 'Tab') { event.stopPropagation(); return; }
    const focusable = Array.from($('modal').querySelectorAll('button:not(:disabled),a[href],input:not(:disabled),[tabindex="0"]')).filter(node => !node.hidden);
    if (!focusable.length) { event.preventDefault(); return; }
    const first = focusable[0], last = focusable[focusable.length - 1];
    if (event.shiftKey && (document.activeElement === first || !focusable.includes(document.activeElement))) { event.preventDefault(); last.focus(); }
    else if (!event.shiftKey && (document.activeElement === last || !focusable.includes(document.activeElement))) { event.preventDefault(); first.focus(); }
  }, true);
  function confirmAction(title, message, action, back, confirmLabel = 'Confirmar') {
    openModal(title, 'ANTES DE SEGUIR', parent => {
      paragraph(parent, message);
      const actions = el('div','modal-actions');
      actions.append(button(confirmLabel, action, 'button primary'), button('Volver', back));
      parent.append(actions);
    }, back);
  }
  function showMenu() {
    hideModal(false); game.state = 'menu'; game.renderer.resize(false);
    document.body.classList.remove('playing','exited','choosing');
    $('menu-screen').classList.remove('hidden'); $('character-screen').classList.add('hidden'); $('hud').classList.add('hidden');
    updateSaveCount(); $('new-game').focus();
  }
  function requestMenu() {
    confirmAction('¿Volver al inicio?', 'La partida sigue en memoria hasta que empieces otra. Los cambios que no guardaste se perderán al cerrar la pestaña o iniciar una aventura nueva.', showMenu, showPause);
  }
  function showCharacters() {
    hideModal(false); game.state = 'characters'; game.renderer.resize(false);
    document.body.classList.remove('playing','exited'); document.body.classList.add('choosing');
    $('menu-screen').classList.add('hidden'); $('character-screen').classList.remove('hidden'); $('hud').classList.add('hidden');
    renderCharacters();
  }
  function statRows(parent, stats) {
    Object.keys(Zak.STAT_LABELS).forEach(key => {
      const row = el('div','stat-row'); row.append(el('label','',Zak.STAT_LABELS[key]));
      const track = el('div','stat-track'), fill = el('i'); fill.style.width = Math.min(100, stats[key] / (key === 'health' ? 200 : 50) * 100) + '%';
      track.append(fill); row.append(track,el('b','',fmt(stats[key]))); parent.append(row);
    });
  }
  function traits(parent, c) {
    [['✦ ' + c.ability + (c.abilityPassive ? ' · Pasiva' : ''), c.abilityDescription, ''],
     ['＋ ' + c.advantage,c.advantageDescription,''], ['− ' + c.disadvantage,c.disadvantageDescription,'negative']].forEach(([title, description, cls]) => {
      const item = el('div','trait ' + cls); item.append(el('h3','',title)); paragraph(item,description); parent.append(item);
    });
  }
  function renderCharacters() {
    const grid = $('character-grid'); grid.replaceChildren();
    Zak.CHARACTERS.forEach(c => {
      const card = button('', () => { selected = c.id; renderCharacters(); grid.querySelector('[data-character="' + c.id + '"]').focus(); }, 'character-card' + (selected === c.id ? ' selected' : ''));
      card.dataset.character = c.id; card.setAttribute('aria-pressed', String(selected === c.id)); card.setAttribute('aria-label', c.name + '. ' + c.appearance);
      const portrait = el('canvas'); portrait.width = 88; portrait.height = 105;
      card.append(portrait,el('strong','',c.name),el('small','',c.abilityPassive ? 'HABILIDAD PASIVA' : 'HABILIDAD ACTIVA')); grid.append(card); Zak.drawPortrait(portrait,c.id);
    });
    const detail = $('character-detail'); detail.replaceChildren();
    const stats = el('div'), benefits = el('div','traits'), c = character(selected);
    statRows(stats,c.stats); traits(benefits,c); detail.append(stats,benefits);
  }
  $('new-game').addEventListener('click', showCharacters);
  document.querySelectorAll('[data-back="menu"]').forEach(node => node.addEventListener('click', showMenu));
  $('player-name').value = Zak.Ranking.profile().name;
  $('player-name').addEventListener('change', () => { $('player-name').value = Zak.Ranking.setName($('player-name').value); });
  $('player-name').addEventListener('input', () => $('player-name').classList.remove('invalid'));
  $('begin-adventure').addEventListener('click', () => {
    const name = Zak.Ranking.setName($('player-name').value); $('player-name').value = name;
    if (!name) { $('player-name').classList.add('invalid'); $('player-name').focus(); toast('Escribí tu apodo para el ranking antes de empezar.',true); return; }
    updateSound(); autoFullscreen(); game.newGame(selected); submitScore(); });
  function saveLabel(data) {
    const p = data.player || {};
    return character(p.characterId).name + ' · Nivel ' + Math.max(1,number(p.level));
  }
  function savedDate(data) {
    const date = new Date(data.savedAt || data.timestamp || Date.now());
    return Number.isFinite(date.getTime()) ? date.toLocaleString('es-AR',{ dateStyle:'short', timeStyle:'short' }) : 'Fecha no disponible';
  }
  function download(data) {
    try {
      validate(data);
      const blob = new Blob([JSON.stringify(data,null,2)],{type:'application/json'});
      const url = URL.createObjectURL(blob), a = el('a');
      a.href = url; a.download = 'zaks-throne-' + (data.player && data.player.characterId || 'partida') + '-' + new Date().toISOString().slice(0,10) + '.json';
      document.body.append(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(url),1000);
      toast('Respaldo exportado. Conservá el archivo JSON.');
    } catch (error) { toast('No se pudo exportar: ' + error.message,true); }
  }
  function storeSlot(index, imported) {
    try {
      const data = imported || game.snapshot(); validate(data);
      const save = { ...data, savedAt: new Date().toISOString() };
      localStorage.setItem(SAVE_PREFIX + index,JSON.stringify(save));
      if (!imported) { game.currentSlot = index; submitScore(); }
      updateSaveCount(); toast((imported ? 'Partida importada' : 'Partida guardada') + ' en la ranura ' + index + '.');
      if (imported) showSlots('load'); else showPause();
    } catch (error) {
      toast('No se pudo guardar. Podés exportar un respaldo JSON. ' + error.message,true);
    }
  }
  function chooseSlot(mode, index, imported) {
    const slot = readSlot(index);
    if (mode === 'load') {
      if (slot.state !== 'valid') return;
      try { autoFullscreen(); game.restore(slot.data,index); hideModal(false); showPlaying(); toast('Partida de la ranura ' + index + ' cargada.'); }
      catch (error) { toast('No se pudo cargar: ' + error.message,true); }
    } else if (mode === 'export') {
      if (slot.state === 'valid') download(slot.data);
    } else if (slot.state === 'valid' || slot.state === 'invalid') {
      const label = slot.state === 'valid' ? saveLabel(slot.data) : 'un guardado dañado';
      confirmAction('¿Reemplazar la ranura ' + index + '?', 'Esta ranura contiene ' + label + '. Confirmar reemplaza solamente esta partida; las otras dos ranuras quedan intactas.', () => storeSlot(index,imported), () => showSlots(mode,imported));
    } else if (slot.state === 'empty') storeSlot(index,imported);
    else toast('El navegador bloquea el almacenamiento local. Exportá un respaldo para conservar tu partida.',true);
  }
  const slotRunId = slot => slot.state === 'valid' && slot.data.player && /^[\w-]{6,64}$/.test(String(slot.data.player.runId || '')) ? slot.data.player.runId : null;
  function deleteSlot(index, mode) {
    const slot = readSlot(index), runId = slotRunId(slot);
    // Si la misma partida está guardada en otra ranura, sigue en el ranking.
    const shared = runId && [1,2,3].some(other => other !== index && slotRunId(readSlot(other)) === runId);
    const label = slot.state === 'valid' ? saveLabel(slot.data) : 'un guardado dañado';
    const warning = !runId ? 'Esta partida no figura en el ranking.' : shared ? 'Esta misma partida está guardada en otra ranura, así que se mantiene en el ranking.' : 'También se va a eliminar del ranking de amigos, con su nivel, enemigos y jefes. Esto no se puede deshacer.';
    confirmAction('¿Borrar la ranura ' + index + '?', 'Esta ranura contiene ' + label + '. ' + warning, async () => {
      try { localStorage.removeItem(SAVE_PREFIX + index); }
      catch (_) { toast('El navegador no permitió borrar la ranura.',true); showSlots(mode); return; }
      if (game.currentSlot === index) game.currentSlot = null;
      // La partida en curso que se borró del ranking empieza a contar como una nueva.
      if (runId && !shared && game.player && game.player.runId === runId) game.player.runId = null;
      updateSaveCount(); showSlots(mode);
      if (!runId || shared) { toast('Ranura ' + index + ' borrada.'); return; }
      try { const result = await Zak.Ranking.remove(runId); toast('Ranura ' + index + ' borrada' + (result.online ? ' y quitada del ranking.' : '.')); }
      catch (error) { toast('Ranura ' + index + ' borrada. No se pudo quitar del ranking online (' + error.message + '); se reintentará más tarde.',true); }
    }, () => showSlots(mode), 'Borrar partida');
  }
  function showSlots(mode = 'load', imported = null) {
    const titles = {load:'Cargar juego',save:'Guardar partida',import:'Importar partida',export:'Exportar un guardado'};
    openModal(titles[mode], 'TRES HISTORIAS, TRES RANURAS', parent => {
      paragraph(parent, mode === 'import' ? 'El archivo es válido. Elegí dónde conservar la partida importada.' : mode === 'save' ? 'Elegí una ranura. Si está ocupada, te vamos a pedir que confirmes el reemplazo.' : 'Cada ranura conserva una aventura independiente.');
      [1,2,3].forEach(index => {
        const slot = readSlot(index), btn = button('', () => chooseSlot(mode,index,imported),'save-slot');
        btn.append(el('span','slot-index','0' + index)); const content = el('span','slot-content');
        if (slot.state === 'valid') {
          content.append(el('strong','',saveLabel(slot.data)),el('small','',savedDate(slot.data) + (index === game.currentSlot ? ' · Partida actual' : '')));
        } else {
          const label = slot.state === 'empty' ? 'Ranura vacía' : slot.state === 'invalid' ? 'Guardado dañado' : 'Almacenamiento no disponible';
          content.append(el('strong','',label),el('small','',slot.state === 'empty' ? 'Un lugar para una nueva historia.' : slot.state === 'invalid' ? 'No se puede cargar. Guardar aquí requiere confirmación.' : 'Permití datos locales o usá un respaldo JSON.'));
        }
        btn.append(content,el('span','slot-arrow','→'));
        btn.disabled = slot.state === 'unavailable' || ((mode === 'load' || mode === 'export') && slot.state !== 'valid');
        if ((mode === 'load' || mode === 'save') && (slot.state === 'valid' || slot.state === 'invalid')) {
          const line = el('div','slot-line'), remove = button('🗑',() => deleteSlot(index,mode),'slot-delete');
          remove.title = 'Borrar la ranura ' + index; remove.setAttribute('aria-label','Borrar la ranura ' + index);
          line.append(btn,remove); parent.append(line);
        } else parent.append(btn);
      });
      const actions = el('div','inline-actions');
      actions.append(button('Importar JSON',pickImport));
      actions.append(button(mode === 'save' && game.player ? 'Exportar partida' : 'Exportar ranura',() => mode === 'save' && game.player ? download(game.snapshot()) : showSlots('export')));
      parent.append(actions);
      paragraph(parent,'Guardado manual en este navegador. Un respaldo JSON permite llevar tu partida a otro equipo.','hint');
    }, game.player && (game.state === 'paused' || game.state === 'playing') ? showPause : null);
  }
  function pickImport() {
    const input = el('input'); input.type = 'file'; input.accept = '.json,application/json'; input.hidden = true;
    input.addEventListener('change', async () => {
      try {
        const file = input.files[0]; if (!file) return;
        if (file.size > 1024 * 1024) throw new Error('El archivo supera el máximo de 1 MB.');
        const data = validate(JSON.parse(await file.text())); showSlots('import',data);
      } catch (error) { toast('No se importó el archivo: ' + error.message,true); }
      finally { input.remove(); }
    });
    input.addEventListener('cancel', () => input.remove(),{once:true});
    document.body.append(input); input.click();
  }
  $('load-game').addEventListener('click', () => showSlots('load'));
  function showPause() {
    openModal('Un respiro en el camino', 'PARTIDA EN PAUSA', parent => {
      if (game.player) paragraph(parent,saveLabel({player:game.player}) + ' · ' + (game.currentSlot ? 'Ranura ' + game.currentSlot : 'Todavía sin guardar'));
      const actions = el('div','modal-actions');
      actions.append(button('Continuar la aventura', () => hideModal(), 'button primary'), button('Guardar partida', () => showSlots('save')), button('Ranking de amigos', () => showRanking('level', showPause)), button('Opciones y controles',showSettings), button('Volver al inicio',requestMenu));
      parent.append(actions); paragraph(parent,'La partida se guarda manualmente. Cerrá la pausa para seguir explorando.','hint');
    });
  }
  function showSettings() {
    const returnToPause = !!game.player && (game.state === 'playing' || game.state === 'paused');
    openModal('A tu manera', 'OPCIONES Y CONTROLES', parent => {
      [['sound','Sonido ambiental y combate'],['particles','Partículas y efectos'],['shake','Sacudida de pantalla'],['tutorial','Consejos al empezar'],['fullscreen','Pantalla completa al jugar (celular)']].forEach(([key,label]) => {
        const row = el('div','setting-row'); row.append(el('span','',label));
        const toggle = button(game.settings[key] ? 'ACTIVADO' : 'DESACTIVADO', () => { game.settings[key] = !game.settings[key]; persistSettings(); toggle.textContent = game.settings[key] ? 'ACTIVADO' : 'DESACTIVADO'; toggle.setAttribute('aria-pressed',String(game.settings[key])); },'toggle');
        toggle.setAttribute('aria-label',label); toggle.setAttribute('aria-pressed',String(game.settings[key])); row.append(toggle); parent.append(row);
      });
      const sizes = Object.keys(CONTROL_SIZES), sizeRow = el('div','setting-row'); sizeRow.append(el('span','','Tamaño de los controles táctiles'));
      const sizeToggle = button(CONTROL_SIZES[game.settings.controls][0].toUpperCase(), () => {
        game.settings.controls = sizes[(sizes.indexOf(game.settings.controls) + 1) % sizes.length]; persistSettings(); applyControls();
        sizeToggle.textContent = CONTROL_SIZES[game.settings.controls][0].toUpperCase();
      },'toggle');
      sizeToggle.setAttribute('aria-label','Tamaño de los controles táctiles'); sizeRow.append(sizeToggle); parent.append(sizeRow);
      const help = el('div','help-grid');
      [['Moverte','WASD / flechas'],['Correr','Shift'],['Atacar','Espacio / clic'],['Rodar','F / clic derecho'],['Habilidad','Q'],['Interactuar','E'],['Usar hierba','R'],['Armas','1 — 4'],['Personaje','C'],['Diario','J'],['Mapa','M'],['Pausa','Esc']].forEach(([action,key]) => { const row = el('div'); row.append(el('span','',action),el('kbd','',key)); help.append(row); });
      parent.append(help);
      paragraph(parent,'Los controles táctiles aparecen en pantallas compatibles. En un teléfono, giralo horizontalmente para ver mejor. El sonido se activa después de tu primera interacción.','hint');
    },returnToPause ? showPause : null);
  }
  $('settings-button').addEventListener('click',showSettings);

  function showStats() {
    if (!game.player) return;
    const p = game.player, c = character(p.characterId), s = game.stats();
    openModal(c.name + ' · Nivel ' + p.level, 'FICHA DEL PERSONAJE', parent => {
      paragraph(parent,p.points ? p.points + ' punto' + (p.points === 1 ? '' : 's') + ' para mejorar. Vida suma 5; las otras estadísticas suman 1.' : 'Al subir de nivel recibís 2 de vida y un punto para mejorar.');
      Object.keys(Zak.STAT_LABELS).forEach(key => {
        const row = el('div','stats-upgrade'), cap = key === 'health' ? 500 : key === 'intelligence' ? Infinity : 100;
        row.append(el('span','',Zak.STAT_LABELS[key]),el('b','',fmt(p.stats[key]) + (cap < Infinity ? ' / ' + cap : '')));
        const upgrade = button('+',() => { if (Zak.upgradeStat(p,key)) { showStats(); updateHud(true); } },'upgrade-button');
        upgrade.setAttribute('aria-label','Mejorar ' + Zak.STAT_LABELS[key]); upgrade.disabled = p.points < 1 || p.stats[key] >= cap; row.append(upgrade); parent.append(row);
      });
      const summary = el('div','stats-summary');
      ['Vida efectiva: ' + fmt(s.maxHealth), 'Fuerza efectiva: ' + fmt(s.strength) + ' · Armadura: ' + fmt(s.armor),
       'Movimiento: ' + fmt(s.moveSpeed) + ' px/s · Golpe cada ' + fmt(s.attackCooldown) + ' s',
       'Carrera: ' + fmt(s.runDuration) + ' s · Experiencia: ×' + fmt(s.xpMultiplier),
       'Daño de armas: ×' + fmt(s.damageMultiplier) + ' · Cuarto golpe seguido: crítico ×1,75',
       'Monedas: ' + fmt(p.coins) + ' · Hierbas: ' + p.herbs + ' / ' + Zak.HERB_BAG + ' · Derrotas: ' + p.kills,
       'Próximo nivel: ' + fmt(p.xp) + ' / ' + Zak.xpNeeded(p.level) + ' XP'].forEach(line => summary.append(el('div','',line)));
      parent.append(summary); const benefits = el('div','traits'); benefits.style.marginTop = '20px'; traits(benefits,c); parent.append(benefits);
    });
  }
  function showJournal(completed = false) {
    if (!game.player) return;
    openModal(completed ? 'Los Aromos ya te conoce' : 'Cada paso deja una historia', 'DIARIO DE VIAJE', parent => {
      paragraph(parent,completed ? 'Completaste los objetivos del diario. Podés seguir explorando, mejorar tu personaje y guardar tu aventura.' : 'Explorá a tu ritmo. Tu progreso queda registrado al guardar la partida.');
      game.quests().forEach(quest => {
        const row = el('div','journal-task' + (quest.done ? ' done' : '')), body = el('div');
        body.append(el('strong','',quest.title),el('small','',quest.detail)); row.append(el('b','',quest.done ? '✓' : '◇'),body); parent.append(row);
      });
      const heading = el('h3','','Bichos y malas juntas'); heading.style.fontWeight = 'normal'; heading.style.color = 'var(--gold)'; parent.append(heading);
      Object.entries(Zak.ENEMY_TYPES).forEach(([type,enemy]) => {
        const s = Zak.enemyStats(type,game.player.level), row = el('div','journal-task' + (enemy.boss ? ' boss' : '')), body = el('div');
        if (enemy.boss) row.append(el('b','',game.questFlags['defeat_' + type] ? '✓' : '☠'));
        body.append(el('strong','',enemy.name + (enemy.boss ? ' · JEFE' : '') + ' · Nivel ' + s.level),el('small','',enemy.description),el('small','',fmt(s.health) + ' vida · ' + fmt(s.strength) + ' fuerza · ' + fmt(s.armor) + ' armadura')); row.append(body); parent.append(row);
      });
    });
  }
  function showMap() {
    if (!game.player) return;
    openModal('Los caminos de los Aromos', 'MAPA DE LA REGIÓN', parent => {
      const canvas = el('canvas','map-canvas'); canvas.width = 500; canvas.height = 300; canvas.setAttribute('aria-label','Mapa: aldea segura, cueva y Yuyos. Un punto marca tu posición.');
      parent.append(canvas); Zak.drawMinimap(canvas,game);
      const legend = el('div','map-legend'); ['● Vos','$ Almacén','☠ Jefe','Aldea · segura','Cueva y Yuyos · peligro'].forEach(label => legend.append(el('span','',label))); parent.append(legend);
      paragraph(parent,'Los enemigos no pueden entrar en la aldea. El pozo te espera cuando necesites recuperar vida.','hint');
    });
  }
  function showTutorial() {
    openModal('Primero, los pies en la tierra', 'BIENVENIDO A LOS AROMOS', parent => {
      if (isTouch()) {
        paragraph(parent,'La aldea es tu refugio. Apoyá el pulgar izquierdo en cualquier parte de la mitad izquierda y arrastralo para moverte. Buscá el arco y tocá E cerca de su brillo.');
        paragraph(parent,'⚔ ataca y apunta solo al enemigo más cercano: cada cuarto golpe seguido es crítico. ⟲ te hace rodar y esquivar cualquier golpe. ✦ es tu habilidad, » activa o desactiva la carrera, ❦ usa una hierba y el botón de arma cambia entre las que tengas.');
        paragraph(parent,'Los enemigos sueltan monedas: gastalas en el puesto de El Almacén, al oeste de la plaza. Arriba tenés la ficha, el diario, el mapa, la pausa para guardar y ⛶ para pantalla completa. Se juega mejor con el celular en horizontal.');
      } else {
        paragraph(parent,'La aldea es tu refugio. Movete con WASD o flechas y buscá el arco: acercate a su brillo y presioná E.');
        paragraph(parent,'Atacá con Espacio o clic: cada cuarto golpe seguido es crítico. F o clic derecho te hace rodar y esquivar cualquier golpe. Q activa tu habilidad; Fede y Pepe tienen habilidades pasivas. Shift te permite correr: cuidá la energía.');
        paragraph(parent,'Los enemigos sueltan monedas. Gastalas en el puesto de El Almacén, al oeste de la plaza. Las hierbas van a tu bolsa y se usan con R.');
        paragraph(parent,'C abre tus estadísticas; J, el diario; M, el mapa. Guardá manualmente en una de las tres ranuras desde Esc antes de irte.');
      }
      const actions = el('div','modal-actions'); actions.append(button('Ahora sí, a explorar',() => hideModal(),'button primary'),button('No mostrar este consejo otra vez',() => { game.settings.tutorial = false; persistSettings(); hideModal(); })); parent.append(actions);
    });
  }
  function showShop(message) {
    if (!game.player) return;
    openModal('El Almacén de Don Ramón', 'PUESTO DE LA PLAZA', parent => {
      const purse = el('p','shop-purse'); purse.append(el('span','','Tu guita'),el('strong','','◉ ' + game.player.coins)); parent.append(purse);
      if (message) paragraph(parent,message,'hint shop-message');
      game.shopItems().forEach(item => {
        const row = el('div','shop-item' + (item.soldOut ? ' sold-out' : '')), body = el('div');
        body.append(el('strong','',item.icon + ' ' + item.name),el('small','',item.detail));
        if (item.note) body.append(el('small','shop-note',item.note));
        const buy = button(item.soldOut ? 'Agotado' : '◉ ' + item.price, () => { const result = game.buy(item.id); showShop(result.message); updateHud(true); },'shop-buy');
        buy.disabled = item.soldOut || !item.affordable; buy.setAttribute('aria-label','Comprar ' + item.name + ' por ' + item.price + ' monedas');
        row.append(body,buy); parent.append(row);
      });
      paragraph(parent,'Chorros y jefes dejan más monedas. Si un chorro te noquea, se lleva parte de tu guita.','hint');
    });
  }
  // Publica el progreso como mucho cada 8 s; los pedidos que llegan antes se agrupan.
  let submitTimer = null, lastSubmit = 0, lastKills = 0, submitWarned = false;
  function submitScore() {
    if (!game.player) return;
    clearTimeout(submitTimer);
    submitTimer = setTimeout(() => {
      lastSubmit = Date.now(); lastKills = game.player.kills;
      Zak.Ranking.submit(game).catch(error => { if (!submitWarned) { submitWarned = true; toast('No se pudo publicar en el ranking online: ' + error.message + '. Se guardó en este dispositivo.',true); } });
    }, Math.max(0,8000 - (Date.now() - lastSubmit)));
  }
  const RANK_TABS = [['level','Nivel'],['kills','Enemigos'],['bosses','Jefes']];
  function showRanking(sort = 'level', back = null) {
    const own = Zak.Ranking.profile().id, version = modalVersion + 1;
    if (game.player && game.state !== 'menu') Zak.Ranking.saveLocal(Zak.Ranking.entryFor(game));
    openModal('Ranking de amigos', Zak.Ranking.online() ? 'EN LÍNEA · TODOS LOS DISPOSITIVOS' : 'SOLO ESTE DISPOSITIVO', parent => {
      const tabs = el('div','rank-tabs');
      RANK_TABS.forEach(([id,label]) => { const tab = button(label,() => showRanking(id,back),'rank-tab' + (sort === id ? ' selected' : '')); tab.setAttribute('aria-pressed',String(sort === id)); tabs.append(tab); });
      parent.append(tabs);
      const list = el('div','rank-list'); list.append(el('p','hint','Cargando…')); parent.append(list);
      if (!Zak.Ranking.online()) paragraph(parent,'Para compartir el ranking con tus amigos hay que conectar Supabase en src/config.js (ver docs/RANKING.md). Mientras tanto se muestran las partidas jugadas en este dispositivo.','hint');
      Zak.Ranking.list(sort).then(result => render(result.entries)).catch(error => {
        if (version !== modalVersion) return;
        list.replaceChildren(el('p','hint','No se pudo cargar el ranking online (' + error.message + '). Partidas de este dispositivo:'));
        render(Zak.Ranking.local().sort(Zak.Ranking.SORTS[sort]),true);
      });
      function render(entries,append = false) {
        if (version !== modalVersion) return;
        if (!append) list.replaceChildren();
        if (!entries.length) { list.append(el('p','hint','Todavía no hay partidas. ¡Salí a la aventura y estrená el ranking!')); return; }
        const head = el('div','rank-row rank-head'); ['#','Jugador','Nvl.','Enemigos','Jefes'].forEach(label => head.append(el('span','',label))); list.append(head);
        entries.slice(0,50).forEach((entry,index) => {
          const row = el('div','rank-row' + (entry.player_id === own ? ' mine' : '') + (index < 3 ? ' top' : ''));
          const who = el('span','rank-player'); who.append(el('strong','',entry.name),el('small','',character(entry.character).name + (entry.player_id === own ? ' · vos' : '')));
          row.append(el('span','rank-pos',index < 3 ? ['♛','②','③'][index] : index + 1),who,el('span','',entry.level),el('span','',entry.kills),el('span','',entry.bosses));
          list.append(row);
        });
      }
    }, back);
  }
  $('ranking-button').addEventListener('click',() => showRanking());
  function showPlaying() {
    document.body.classList.add('playing'); document.body.classList.remove('exited','choosing');
    $('menu-screen').classList.add('hidden'); $('character-screen').classList.add('hidden'); $('hud').classList.remove('hidden');
    lastPortrait = ''; updateHud(true); $('world').focus();
  }
  function renderWeapons() {
    const bar = $('weapon-bar'); bar.replaceChildren();
    WEAPONS.forEach((id,index) => {
      const definition = Zak.WEAPON_TYPES[id], slot = button('', () => game.equip(id),'weapon-slot');
      slot.dataset.weapon = id; slot.title = definition.name + ' (' + (index + 1) + ') · ' + definition.description;
      slot.setAttribute('aria-label',slot.title); slot.append(el('kbd','',index + 1),el('span','',ICONS[id]),el('span','ammo',''),el('i','weapon-recharge')); bar.append(slot);
    });
  }
  function updateHud(force = false) {
    if (!game.player) return;
    const now = performance.now(); if (!force && now - lastHud < 90) return; lastHud = now;
    const p = game.player, s = game.stats(), c = character(p.characterId);
    text('hud-name',c.name); text('hud-level','NVL. ' + p.level);
    $('health-fill').style.width = Math.max(0,Math.min(100,p.hp / s.maxHealth * 100)) + '%'; text('health-text',fmt(p.hp) + ' / ' + fmt(s.maxHealth));
    $('energy-fill').style.width = Math.max(0,Math.min(100,number(p.stamina) * 100)) + '%';
    text('energy-text',p.exhausted > 0 ? 'AGOTADO · ' + Math.ceil(p.exhausted) + ' s' : 'ENERGÍA');
    $('xp-fill').style.width = Math.min(100,p.xp / Zak.xpNeeded(p.level) * 100) + '%';
    text('points-badge',p.points); $('points-badge').classList.toggle('hidden',p.points < 1);
    const ctx = game.context(), biome = ctx.biome || 'village';
    const biomeNames = {village:'Palihue City',cave:'Cueva del Eco',weeds:'Los Yuyos',yuyos:'Los Yuyos'};
    text('hud-biome',biomeNames[biome] || biome); text('hud-safety',biome === 'village' ? 'ZONA SEGURA' : 'ZONA PELIGROSA');
    $('hud-safety').classList.toggle('danger',biome !== 'village');
    const hours = (8 + Math.floor(number(p.playTime) / 60)) % 24, minutes = Math.floor(number(p.playTime) % 60);
    text('hud-time',(hours >= 7 && hours < 19 ? '☀ ' : '☾ ') + String(hours).padStart(2,'0') + ':' + String(minutes).padStart(2,'0'));
    if (lastPortrait !== c.id) { Zak.drawPortrait($('hud-portrait'),c.id); lastPortrait = c.id; }
    const statuses = [];
    if (p.poison) statuses.push('☠ Veneno');
    if (p.slow > 0) statuses.push('↓ Mordedura ' + Math.ceil(p.slow) + ' s');
    if (p.exhausted > 0) statuses.push('Sin aliento ' + Math.ceil(p.exhausted) + ' s');
    if (p.buffs.gero > 0) statuses.push('✦ Fé Judía ' + Math.ceil(p.buffs.gero) + ' s');
    if (p.buffs.paco > 0) statuses.push('♥ ' + p.buffs.pacoAnimals + ' animales encantados');
    if (p.buffs.pepe > 0) statuses.push('✦ DeboraMundos');
    if (p.buffs.mate > 0) statuses.push('☕ Mate ' + Math.ceil(p.buffs.mate) + ' s');
    if (c.id === 'fede' && p.hp <= s.maxHealth * .3) statuses.push('✦ Último aliento');
    if (c.id === 'paco' && biome === 'weeds') statuses.push('↑ Campesino +15%');
    if (c.id === 'tena' && ctx.pursuers >= 3) statuses.push('↓ Miedoso −10%');
    const statusKey = statuses.join('|');
    if ($('status-effects').dataset.status !== statusKey) { $('status-effects').dataset.status = statusKey; $('status-effects').replaceChildren(...statuses.map(label => el('span','status-tag',label))); }
    text('hud-coins','◉ ' + p.coins); text('hud-herbs',p.herbs + '/' + Zak.HERB_BAG);
    $('herb-button').disabled = p.herbs < 1;
    const comboReady = p.comboTime > 0 && p.combo % 4 === 3;
    text('hud-combo',p.comboTime > 0 && p.combo > 1 ? '×' + p.combo + (comboReady ? ' ✦' : '') : '');
    $('hud-combo').classList.toggle('ready',comboReady);
    const boss = game.bossTarget();
    $('boss-bar').classList.toggle('hidden',!boss);
    if (boss) {
      text('boss-name',Zak.ENEMY_TYPES[boss.type].name + ' · Nivel ' + boss.level);
      $('boss-fill').style.width = Math.max(0,boss.hp / boss.maxHp * 100) + '%';
      text('boss-hint',boss.telegraph > 0 ? (boss.type === 'capo' ? '¡VA A EMBESTIR! RODÁ (F)' : boss.kind === 'tail' ? '¡COLAZO! ALEJATE O RODÁ (F)' : '¡VENENO! RODÁ (F)') : fmt(boss.hp) + ' / ' + fmt(boss.maxHp));
      $('boss-bar').classList.toggle('warning',boss.telegraph > 0);
    }
    const quests = game.quests(), next = quests.find(quest => !quest.done); text('quest-current',next ? next.title : 'Todos los caminos recorridos');
    const cooldown = Math.max(0,number(p.abilityCooldown));
    text('ability-label',c.ability + (c.abilityPassive ? ' · Pasiva' : cooldown > 0 ? ' · ' + Math.ceil(cooldown) + ' s' : ''));
    $('ability-button').disabled = c.abilityPassive || cooldown > 0; $('ability-button').title = c.abilityDescription;
    $('ability-cooldown').style.width = (c.abilityPassive ? 100 : Math.max(0,1 - cooldown / (c.abilityCooldown || 1)) * 100) + '%';
    WEAPONS.forEach(id => {
      const slot = $('weapon-bar').querySelector('[data-weapon="' + id + '"]'), owned = p.weapons.includes(id);
      slot.disabled = !owned; slot.classList.toggle('locked',!owned); slot.classList.toggle('selected',p.weapon === id); slot.setAttribute('aria-pressed',String(p.weapon === id));
      const recharge = slot.querySelector('.weapon-recharge'); if (recharge) recharge.style.width = (p.weapon === id && p.attackCooldown > 0 ? Math.max(0,1 - p.attackCooldown / Math.max(s.attackCooldown,id === 'bow' ? .7 : 0)) * 100 : 100) + '%';
      slot.querySelector('.ammo').textContent = id === 'stone' && owned ? p.stoneAmmo ? '1' : 'caminar' : '';
    });
    $('touch-ability').disabled = c.abilityPassive || cooldown > 0;
    text('touch-ability-label',c.abilityPassive ? 'Pasiva' : cooldown > 0 ? Math.ceil(cooldown) + ' s' : c.ability);
    text('touch-herb-count',p.herbs); $('touch-herb').disabled = p.herbs < 1;
    $('touch-weapon').firstChild.textContent = ICONS[p.weapon]; $('touch-weapon').disabled = p.weapons.length < 2;
    $('touch-run').classList.toggle('active',game.runToggle); $('touch-run').setAttribute('aria-pressed',String(game.runToggle));
    if (Zak.nearbyInteractable && game.world) {
      const nearby = Zak.nearbyInteractable(game.world,p.x,p.y,46);
      $('touch-interact').classList.toggle('available',!!nearby);
      $('interaction-hint').classList.toggle('hidden',!nearby);
      if (nearby) text('interaction-hint',(isTouch() ? 'Tocá E · ' : 'E · ') + (nearby.label || nearby.name || (nearby.type === 'well' ? 'Recuperar vida en el pozo' : 'Recoger')));
    }
  }
  $('stats-button').addEventListener('click',showStats); $('journal-button').addEventListener('click',() => showJournal()); $('map-button').addEventListener('click',showMap); $('pause-button').addEventListener('click',showPause);
  $('ability-button').addEventListener('click',() => game.ability());
  $('herb-button').addEventListener('click',() => { game.useHerb(); $('world').focus(); });
  const isTouch = () => game.touchMode || (window.matchMedia && matchMedia('(pointer:coarse)').matches);
  const capture = (node,id) => { try { node.setPointerCapture(id); } catch (_) {} };
  function setTouchKey(key,pressed) { if (pressed) game.keys.add(key); else game.keys.delete(key); }
  function touchButton(id,action) {
    $(id).addEventListener('pointerdown',event => {
      event.preventDefault(); if (game.state !== 'playing') return;
      game.touchMode = true; game.sound.unlock(); action(event);
    });
  }
  const zone = $('joystick-zone'), base = zone.querySelector('.stick-base'), knob = zone.querySelector('.stick-knob');
  let stickPointer = null, stickOrigin = null;
  function stickMove(event) {
    const max = 52 * controlScale(), dx = event.clientX - stickOrigin.x, dy = event.clientY - stickOrigin.y, len = Math.hypot(dx,dy) || 1, clamped = Math.min(max,len);
    knob.style.transform = 'translate(' + dx / len * clamped + 'px,' + dy / len * clamped + 'px)';
    game.stick = { x: dx / len * clamped / max, y: dy / len * clamped / max };
  }
  function stickEnd() {
    stickPointer = null; game.stick = { x: 0, y: 0 }; zone.classList.remove('active');
    knob.style.transform = ''; base.style.left = ''; base.style.top = '';
  }
  zone.addEventListener('pointerdown',event => {
    event.preventDefault(); if (game.state !== 'playing' || stickPointer !== null) return;
    game.touchMode = true; game.sound.unlock(); stickPointer = event.pointerId; capture(zone,event.pointerId);
    const bounds = zone.getBoundingClientRect(); stickOrigin = { x: event.clientX, y: event.clientY };
    base.style.left = event.clientX - bounds.left + 'px'; base.style.top = event.clientY - bounds.top + 'px'; zone.classList.add('active'); stickMove(event);
  });
  zone.addEventListener('pointermove',event => { if (event.pointerId === stickPointer) { event.preventDefault(); stickMove(event); } });
  ['pointerup','pointercancel','lostpointercapture'].forEach(type => zone.addEventListener(type,event => { if (event.pointerId === stickPointer) stickEnd(); }));
  touchButton('touch-attack',event => { capture($('touch-attack'),event.pointerId); setTouchKey(' ',true); game.attack(); });
  ['pointerup','pointercancel','lostpointercapture'].forEach(type => $('touch-attack').addEventListener(type,event => { event.preventDefault(); setTouchKey(' ',false); }));
  touchButton('touch-roll',() => game.roll());
  touchButton('touch-ability',() => game.ability());
  touchButton('touch-interact',() => game.interact());
  touchButton('touch-herb',() => game.useHerb());
  touchButton('touch-weapon',() => game.cycleWeapon());
  touchButton('touch-run',() => { game.runToggle = !game.runToggle; updateHud(true); });
  const standalone = () => (window.matchMedia && matchMedia('(display-mode: fullscreen), (display-mode: standalone)').matches) || navigator.standalone === true;
  function enterFullscreen(quiet) {
    const root = document.documentElement, request = root.requestFullscreen || root.webkitRequestFullscreen;
    if (document.fullscreenElement || document.webkitFullscreenElement || standalone()) return;
    // iPhone no tiene pantalla completa para páginas: solo instalándola en la pantalla de inicio.
    if (!request) { if (!quiet) toast(/iPhone|iPod/.test(navigator.userAgent) ? 'En iPhone: tocá Compartir → «Agregar a inicio» y abrí el juego desde ese ícono para verlo en pantalla completa.' : 'Este navegador no permite pantalla completa. Probá agregar el juego a la pantalla de inicio.'); return; }
    Promise.resolve(request.call(root,{ navigationUI: 'hide' })).then(() => {
      if (screen.orientation && screen.orientation.lock) screen.orientation.lock('landscape').catch(() => {});
    }).catch(() => { if (!quiet) toast('No se pudo activar la pantalla completa.'); });
  }
  function toggleFullscreen() {
    if (document.fullscreenElement || document.webkitFullscreenElement) { (document.exitFullscreen || document.webkitExitFullscreen).call(document); return; }
    enterFullscreen(false);
  }
  function autoFullscreen() { if (game.settings.fullscreen && isTouch()) enterFullscreen(true); }
  ['fullscreen-button','menu-fullscreen'].forEach(id => $(id).addEventListener('click',() => { toggleFullscreen(); if (game.state === 'playing') $('world').focus(); }));
  ['fullscreenchange','webkitfullscreenchange'].forEach(type => document.addEventListener(type,() => {
    game.renderer.resize(game.state === 'playing' || game.state === 'paused');
    const full = !!(document.fullscreenElement || document.webkitFullscreenElement);
    ['fullscreen-button','menu-fullscreen'].forEach(id => text(id,full ? '🗗' : '⛶'));
  }));
  function exitGame() {
    suppressPause = true; try { if (game.player) game.pause(); } finally { suppressPause = false; }
    try { window.close(); } catch (_) {}
    game.state = 'exited'; game.keys.clear(); game.mouseHeld = false;
    document.body.classList.add('exited');
    openModal('Hasta el próximo camino', 'ZAK’S THRONE',parent => {
      paragraph(parent,'La aventura queda en pausa. Podés cerrar esta pestaña.');
      if (game.player) paragraph(parent,'Si todavía no guardaste tus últimos pasos, volvé a la partida y usá Guardar desde la pausa.','hint');
      const actions = el('div','modal-actions'); actions.append(button('Volver al inicio',showMenu,'button primary')); parent.append(actions);
    },showMenu);
    modalResume = false;
  }
  $('exit-game').addEventListener('click',exitGame);
  document.querySelector('.brand').addEventListener('click',event => { event.preventDefault(); if (game.state === 'characters') showMenu(); });
  game.onEvent = (type, detail = {}) => {
    if (type === 'tick') { updateHud(); if (game.player && game.state === 'playing' && game.player.kills - lastKills >= 5) submitScore(); }
    else if (type === 'toast') toast(detail.message,detail.error);
    else if (type === 'start') {
      hasStarted = true;
      hideModal(false); showPlaying(); updateSound();
      if (!detail.loaded && game.settings.tutorial) showTutorial();
    } else if (type === 'escape') { if (visibleModal()) closeModal(); else if (game.player && game.state !== 'menu' && game.state !== 'characters') showPause(); }
    else if (type === 'pause' && !suppressPause) showPause();
    else if (type === 'stats') showStats();
    else if (type === 'map') showMap();
    else if (type === 'journal') showJournal();
    else if (type === 'shop') showShop();
    else if (type === 'progress') submitScore();
    else if (type === 'boss') toast('☠ ' + detail.name + ' te vio. Mirá sus avisos y rodá a tiempo.',true);
    else if (type === 'biome') { updateHud(true); toast(detail.name + (detail.safe ? ' · Zona segura' : ' · Mirá por dónde pisás')); }
    else if (type === 'knockout') {
      openModal('De vuelta en casa', 'UN TROPIEZO EN EL CAMINO',parent => {
        paragraph(parent,detail.quote || 'Un respiro, y volvemos a intentarlo.','death-quote');
        paragraph(parent,'Volviste a la aldea. Tu experiencia, mejoras y armas siguen con vos. El pozo puede ayudarte a recuperar vida.');
        if (detail.lost > 0) paragraph(parent,'En el tropiezo perdiste ◉ ' + detail.lost + ' monedas.','hint');
        const actions = el('div','modal-actions'); actions.append(button('Levantarme y seguir',() => hideModal(),'button primary')); parent.append(actions);
      });
    } else if (type === 'complete') showJournal(true);
  };
  renderWeapons(); updateSound(); updateSaveCount();
  window.addEventListener('beforeunload',event => {
    if (hasStarted && game.player && game.state !== 'menu') { event.preventDefault(); event.returnValue = ''; }
  });
})();

