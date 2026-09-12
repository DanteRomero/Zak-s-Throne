/* Zak's Throne — menús, accesibilidad y guardados locales. */
(function () {
  'use strict';
  const Zak = window.Zak;
  const $ = id => document.getElementById(id);
  const game = window.zakGame = new Zak.Game($('world'));
  $('world').tabIndex = 0;
  const SAVE_PREFIX = 'zak.throne.save.';
  const SETTINGS_KEY = 'zak.throne.settings.v1';
  const WEAPONS = ['fists', 'bow', 'sword', 'stone', 'axe', 'pickaxe'];
  const ICONS = { fists: '✊', bow: '➶', sword: '⚔', stone: '◆', axe: '🪓', pickaxe: '⛏' };
  const RESOURCE_NAMES = {wood:'Madera',stone:'Piedra',metal:'Metal'};
  const eventHistory = [], toastQueue = [];
  let activeToast = null, toastTimer = 0;
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
  function nextToast() {
    clearTimeout(toastTimer);
    activeToast = toastQueue.shift() || null;
    $('toast-container').replaceChildren();
    if (!activeToast) return;
    const node = el('div', 'toast' + (activeToast.error ? ' error' : ''));
    node.append(el('span','toast-message',activeToast.message),el('small','', 'J · Historial en el diario' + (toastQueue.length ? ' · +' + toastQueue.length : '')));
    $('toast-container').append(node);
    toastTimer = setTimeout(nextToast, activeToast.error ? 5200 : 3600);
  }
  function toast(message, error = false) {
    message = String(message || '');
    if (!message) return;
    const last = eventHistory[eventHistory.length - 1];
    if (last && last.message === message) last.count++;
    else eventHistory.push({message,error,count:1,time:number(game.player?.playTime)});
    if (eventHistory.length > 40) eventHistory.shift();
    if (activeToast?.message === message || toastQueue.some(item => item.message === message)) return;
    const item = {message,error};
    if (error) {
      toastQueue.unshift(item);
      if (toastQueue.length > 4) toastQueue.pop();
      nextToast();
    } else {
      if (toastQueue.length >= 4) toastQueue.shift();
      toastQueue.push(item);
      if (!activeToast) nextToast();
    }
  }
  function clearToasts() {
    clearTimeout(toastTimer); toastQueue.length = 0; eventHistory.length = 0;
    activeToast = null; $('toast-container').replaceChildren();
  }
  function countdown(seconds) {
    const remaining = Math.ceil(Math.max(0,number(seconds)));
    return Math.floor(remaining / 60) + ':' + String(remaining % 60).padStart(2,'0');
  }
  function safeSettings() {
    try { const value = JSON.parse(localStorage.getItem(SETTINGS_KEY) || '{}'); return value && typeof value === 'object' ? value : {}; }
    catch (_) { return {}; }
  }
  const preferences = safeSettings();
  Object.keys(game.settings).forEach(key => { if (typeof preferences[key] === 'boolean') game.settings[key] = preferences[key]; });
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
  function confirmAction(title, message, action, back) {
    openModal(title, 'ANTES DE SEGUIR', parent => {
      paragraph(parent, message);
      const actions = el('div','modal-actions');
      actions.append(button('Confirmar', action, 'button primary'), button('Volver', back));
      parent.append(actions);
    }, back);
  }
  function showMenu() {
    hideModal(false); game.state = 'menu'; game.renderer.resize(false);
    document.body.classList.remove('playing','exited');
    $('menu-screen').classList.remove('hidden'); $('character-screen').classList.add('hidden'); $('hud').classList.add('hidden');
    updateSaveCount(); $('new-game').focus();
  }
  function requestMenu() {
    confirmAction('¿Volver al inicio?', 'La partida sigue en memoria hasta que empieces otra. Los cambios que no guardaste se perderán al cerrar la pestaña o iniciar una aventura nueva.', showMenu, showPause);
  }
  function showCharacters() {
    hideModal(false); game.state = 'characters'; game.renderer.resize(false);
    document.body.classList.remove('playing','exited');
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
  $('begin-adventure').addEventListener('click', () => { updateSound(); game.newGame(selected); });
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
      if (!imported) game.currentSlot = index;
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
      try { game.restore(slot.data,index); hideModal(false); showPlaying(); toast('Partida de la ranura ' + index + ' cargada.'); }
      catch (error) { toast('No se pudo cargar: ' + error.message,true); }
    } else if (mode === 'export') {
      if (slot.state === 'valid') download(slot.data);
    } else if (slot.state === 'valid' || slot.state === 'invalid') {
      const label = slot.state === 'valid' ? saveLabel(slot.data) : 'un guardado dañado';
      confirmAction('¿Reemplazar la ranura ' + index + '?', 'Esta ranura contiene ' + label + '. Confirmar reemplaza solamente esta partida; las otras dos ranuras quedan intactas.', () => storeSlot(index,imported), () => showSlots(mode,imported));
    } else if (slot.state === 'empty') storeSlot(index,imported);
    else toast('El navegador bloquea el almacenamiento local. Exportá un respaldo para conservar tu partida.',true);
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
        parent.append(btn);
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
      actions.append(button('Continuar la aventura', () => hideModal(), 'button primary'), button('Guardar partida', () => showSlots('save')), button('Opciones y controles',showSettings), button('Volver al inicio',requestMenu));
      parent.append(actions); paragraph(parent,'La partida se guarda manualmente. Cerrá la pausa para seguir explorando.','hint');
    });
  }
  function showSettings() {
    const returnToPause = !!game.player && (game.state === 'playing' || game.state === 'paused');
    openModal('A tu manera', 'OPCIONES Y CONTROLES', parent => {
      [['sound','Sonido ambiental y combate'],['particles','Partículas y efectos'],['tutorial','Consejos al empezar']].forEach(([key,label]) => {
        const row = el('div','setting-row'); row.append(el('span','',label));
        const toggle = button(game.settings[key] ? 'ACTIVADO' : 'DESACTIVADO', () => { game.settings[key] = !game.settings[key]; persistSettings(); toggle.textContent = game.settings[key] ? 'ACTIVADO' : 'DESACTIVADO'; toggle.setAttribute('aria-pressed',String(game.settings[key])); },'toggle');
        toggle.setAttribute('aria-label',label); toggle.setAttribute('aria-pressed',String(game.settings[key])); row.append(toggle); parent.append(row);
      });
      const help = el('div','help-grid');
      [['Moverte','WASD / flechas'],['Correr','Shift'],['Atacar / recolectar','Espacio / clic'],['Habilidad','Q'],['Recoger / consumir','E'],['Armas y herramientas','1 — 6'],['Mochila / fabricar','B / I'],['Personaje','C'],['Diario','J'],['Mapa','M'],['Pausa','Esc']].forEach(([action,key]) => { const row = el('div'); row.append(el('span','',action),el('kbd','',key)); help.append(row); });
      parent.append(help);
      paragraph(parent,'Buscá el hacha en la aldea y golpeá árboles para juntar madera. Con una piedra equipada o guardada y 8 de madera fabricás un pico desde B; el pico extrae piedra y metal de la cueva.','hint');
      paragraph(parent,'E consume tu objeto especial, recupera mochilas y recoge flores medicinales. Las flores y los objetos especiales vuelven a los 10 s. Si caés, tenés 5 minutos de juego para recuperar tu mochila; la pausa detiene el reloj.','hint');
      paragraph(parent,'Los controles táctiles aparecen en pantallas compatibles. En un teléfono, giralo horizontalmente para ver mejor. El sonido se activa después de tu primera interacción.','hint');
    },returnToPause ? showPause : null);
  }
  $('settings-button').addEventListener('click',showSettings);

  function showStats() {
    if (!game.player) return;
    const p = game.player, c = character(p.characterId), s = game.stats();
    openModal(c.name + ' · Nivel ' + p.level, 'FICHA DEL PERSONAJE', parent => {
      paragraph(parent,p.points ? p.points + ' punto' + (p.points === 1 ? '' : 's') + ' para mejorar. Vida suma 5; velocidad y resistencia, 2; fuerza e inteligencia, 1.' : 'Cada nivel suma 2 de vida, 1 de fuerza y 2 puntos para mejorar. Dante recibe 1 de fuerza adicional.');
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
        const s = Zak.enemyStats(type,game.player.level), row = el('div','journal-task'), body = el('div');
        body.append(el('strong','',enemy.name + ' · Nivel ' + s.level),el('small','',enemy.description),el('small','',fmt(s.health) + ' vida · ' + fmt(s.strength) + ' fuerza · ' + fmt(s.armor) + ' armadura')); row.append(body); parent.append(row);
      });
      const history = el('section','event-history');
      history.append(el('h3','','Lo que pasó en este viaje'));
      paragraph(history,'Últimos 40 avisos de esta sesión. Los avisos repetidos se agrupan.','hint');
      if (!eventHistory.length) paragraph(history,'Todavía no hay novedades.');
      [...eventHistory].reverse().forEach(entry => {
        const row = el('div','event-entry' + (entry.error ? ' urgent' : ''));
        row.append(el('small','',countdown(entry.time)),el('span','',entry.message + (entry.count > 1 ? ' (×' + entry.count + ')' : ''))); history.append(row);
      });
      parent.append(history);
    });
  }
  function showInventory() {
    if (!game.player) return;
    const p = game.player, bags = game.lootBags || [];
    openModal('Todo lo que llevás', 'MOCHILA Y FABRICACIÓN', parent => {
      const materials = el('div','resource-grid');
      Object.entries(RESOURCE_NAMES).forEach(([id,label]) => {
        const card = el('div','resource-card'); card.dataset.resource = id;
        card.append(el('span','',label),el('strong','',fmt(p.resources?.[id] || 0))); materials.append(card);
      });
      parent.append(materials,el('h3','inventory-heading','Armas y herramientas'));
      const owned = el('div','inventory-tools');
      WEAPONS.filter(id => p.weapons.includes(id)).forEach(id => {
        const tool = button(ICONS[id] + ' ' + Zak.WEAPON_TYPES[id].name,() => { game.equip(id); showInventory(); },'tool-chip' + (p.weapon === id ? ' selected' : ''));
        tool.setAttribute('aria-pressed',String(p.weapon === id)); tool.title = Zak.WEAPON_TYPES[id].description; owned.append(tool);
      });
      parent.append(owned,el('h3','inventory-heading','Fabricar'));
      Object.entries(Zak.CRAFTING_RECIPES || {}).forEach(([id,recipe]) => {
        const row = el('div','recipe-card'); row.dataset.recipe = id;
        const weapon = recipe.weapon || id, alreadyOwned = p.weapons.includes(weapon), inBag = bags.some(bag => bag.weapons.includes(weapon));
        row.append(el('strong','',ICONS[weapon] + ' ' + recipe.name));
        const ingredients = el('div','recipe-ingredients');
        (recipe.requires || []).forEach(required => {
          const have = p.weapons.includes(required);
          ingredients.append(el('span',have ? 'ready' : 'missing',(have ? '✓ ' : '○ ') + Zak.WEAPON_TYPES[required].name + ' · herramienta, no se consume'));
        });
        Object.entries(recipe.cost || {}).forEach(([resource,amount]) => {
          const have = number(p.resources?.[resource]);
          ingredients.append(el('span',have >= amount ? 'ready' : 'missing',(have >= amount ? '✓ ' : '○ ') + RESOURCE_NAMES[resource] + ' ' + fmt(have) + ' / ' + amount));
        });
        row.append(ingredients);
        const ready = !alreadyOwned && !inBag && (recipe.requires || []).every(required => p.weapons.includes(required)) && Object.entries(recipe.cost || {}).every(([resource,amount]) => number(p.resources?.[resource]) >= amount);
        const craft = button(alreadyOwned ? 'Ya está en tu mochila' : inBag ? 'Recuperá tu mochila del suelo' : 'Fabricar ' + recipe.name,() => { if (game.craft(id)) { showInventory(); updateHud(true); } },'button secondary craft-button');
        craft.disabled = !ready; craft.dataset.craft = id; row.append(craft); parent.append(row);
      });
      paragraph(parent,'Primeros pasos: recogé el hacha en la aldea con E, equipala con 5 y golpeá un árbol. Buscá la piedra arrojadiza en la entrada de la cueva; es la herramienta que necesitás para fabricar tu primer pico.','hint');
      paragraph(parent,'Equipá el pico con 6 y golpeá las vetas de la cueva. El metal requiere más golpes. Los recursos agotados vuelven a crecer; las armas que recogés esperan a que se pierdan para volver a aparecer.','hint');
      if (bags.length) {
        parent.append(el('h3','inventory-heading','Mochilas por recuperar'));
        bags.forEach(bag => {
          const row = el('div','lost-bag');
          row.append(el('strong','','◈ ' + countdown(bag.time) + ' para recuperarla'));
          const contents = bag.weapons.map(id => Zak.WEAPON_TYPES[id]?.name || id).concat(Object.entries(bag.resources || {}).filter(([,amount]) => amount > 0).map(([id,amount]) => amount + ' ' + RESOURCE_NAMES[id]));
          paragraph(row,contents.join(' · ')); parent.append(row);
        });
      }
      const special = Zak.SPECIAL_ITEMS?.[p.characterId];
      if (special) { parent.append(el('h3','inventory-heading','Tu hallazgo especial: ' + special.name)); paragraph(parent,special.description,'hint'); }
    });
  }
  function showMap() {
    if (!game.player) return;
    openModal('Los caminos de los Aromos', 'MAPA DE LA REGIÓN', parent => {
      const canvas = el('canvas','map-canvas'); canvas.width = 500; canvas.height = 300; canvas.setAttribute('aria-label','Mapa: aldea segura, cueva y Yuyos. Un punto marca tu posición.');
      parent.append(canvas); Zak.drawMinimap(canvas,game);
      const legend = el('div','map-legend'); ['● Vos','◆ Herramienta','✦ Especial','◈ Mochila','Aldea · segura','Cueva / Yuyos · peligro'].forEach(label => legend.append(el('span','',label))); parent.append(legend);
      paragraph(parent,'Los enemigos no pueden entrar en la aldea. El pozo te espera cuando necesites recuperar vida.','hint');
    });
  }
  function showTutorial() {
    openModal('Primero, los pies en la tierra', 'BIENVENIDO A LOS AROMOS', parent => {
      paragraph(parent,'La aldea es tu refugio. Movete con WASD o flechas y buscá el arco: acercate a su brillo y presioná E.');
      paragraph(parent,'Atacá con Espacio o clic. Q activa tu habilidad; Fede y Pepe tienen habilidades pasivas. Shift te permite correr: cuidá la energía.');
      paragraph(parent,'Encontrá el hacha en la aldea: equipala con 5 y golpeá árboles para juntar madera. B abre tu mochila y las recetas; con madera y la piedra de la cueva podés fabricar el pico y extraer minerales.');
      paragraph(parent,'E también consume objetos especiales de tu personaje. Si caés, tus armas, herramientas y materiales quedan en una mochila: tenés 5 minutos para volver a buscarla. M señala dónde está.');
      paragraph(parent,'C abre tus estadísticas; J, el diario y el historial de avisos; M, el mapa. Guardá manualmente en una de las tres ranuras desde Esc antes de irte.');
      const actions = el('div','modal-actions'); actions.append(button('Ahora sí, a explorar',() => hideModal(),'button primary'),button('No mostrar este consejo otra vez',() => { game.settings.tutorial = false; persistSettings(); hideModal(); })); parent.append(actions);
    });
  }
  function showPlaying() {
    document.body.classList.add('playing'); document.body.classList.remove('exited');
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
    const biomeNames = {village:'Aldea de los Aromos',cave:'Cueva del Eco',weeds:'Los Yuyos',yuyos:'Los Yuyos'};
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
    if (c.id === 'fede' && p.hp <= s.maxHealth * .3) statuses.push('✦ Último aliento');
    if (c.id === 'paco' && biome === 'weeds') statuses.push('↑ Campesino +15%');
    if (c.id === 'tena' && ctx.pursuers >= 3) statuses.push('↓ Miedoso −10%');
    if (p.special && p.special.time > 0) {
      const special = Zak.SPECIAL_ITEMS?.[p.special.id || c.id];
      statuses.unshift('✦ ' + (special?.name || 'Efecto especial') + ' · ' + Math.ceil(p.special.time) + ' s' + (p.special.shield > 0 ? ' · Escudo ' + fmt(p.special.shield) : ''));
    }
    if (p.stomach > 0) statuses.unshift('🔥 ¡Retorcijones! ' + Math.ceil(p.stomach) + ' s');
    const statusKey = statuses.join('|');
    if ($('status-effects').dataset.status !== statusKey) { $('status-effects').dataset.status = statusKey; $('status-effects').replaceChildren(...statuses.map(label => el('span','status-tag',label))); }
    const bags = game.lootBags || [], closestBag = bags.reduce((best,bag) => !best || Math.hypot(bag.x-p.x,bag.y-p.y) < Math.hypot(best.x-p.x,best.y-p.y) ? bag : best,null);
    $('bag-hint').classList.toggle('hidden',!closestBag);
    if (closestBag) text('bag-hint','◈ Mochila · ' + countdown(closestBag.time) + ' · M para ubicar' + (bags.length > 1 ? ' · +' + (bags.length-1) : ''));
    const quests = game.quests(), next = quests.find(quest => !quest.done); text('quest-current',next ? next.title : 'Todos los caminos recorridos');
    const cooldown = Math.max(0,number(p.abilityCooldown));
    text('ability-label',c.ability + (c.abilityPassive ? ' · Pasiva' : cooldown > 0 ? ' · ' + Math.ceil(cooldown) + ' s' : ''));
    $('ability-button').disabled = c.abilityPassive || cooldown > 0; $('ability-button').title = c.abilityDescription;
    $('ability-cooldown').style.width = (c.abilityPassive ? 100 : Math.max(0,1 - cooldown / (c.abilityCooldown || 1)) * 100) + '%';
    WEAPONS.forEach(id => {
      const slot = $('weapon-bar').querySelector('[data-weapon="' + id + '"]'), owned = p.weapons.includes(id);
      slot.disabled = !owned; slot.classList.toggle('locked',!owned); slot.classList.toggle('selected',p.weapon === id); slot.setAttribute('aria-pressed',String(p.weapon === id));
      const recharge = slot.querySelector('.weapon-recharge'); if (recharge) recharge.style.width = (p.weapon === id && p.attackCooldown > 0 ? Math.max(0,1 - p.attackCooldown / Math.max(s.attackCooldown * (Zak.WEAPON_TYPES[id].cooldownMultiplier || 1),id === 'bow' ? .7 : 0)) * 100 : 100) + '%';
      slot.querySelector('.ammo').textContent = id === 'stone' && owned ? p.stoneAmmo ? '1' : 'caminar' : '';
    });
    if (Zak.nearbyInteractable && game.world) {
      const nearby = Zak.nearbyInteractable(game.world,p.x,p.y,46);
      let hint = nearby ? 'E · ' + (nearby.label || nearby.name || (nearby.type === 'well' ? 'Recuperar vida en el pozo' : nearby.type === 'lootBag' ? 'Recuperar mochila · ' + countdown(nearby.time) : 'Recoger')) : '';
      if (!nearby) {
        const node = game.world.objects.filter(o => o.resource && !o.depleted).map(o => ({node:o,distance:Math.hypot(p.x-Math.max(o.x,Math.min(p.x,o.x+o.w)),p.y-Math.max(o.y,Math.min(p.y,o.y+o.h)))})).filter(o => o.distance <= 44).sort((a,b) => a.distance-b.distance)[0]?.node;
        if (node) {
          const tool = node.resource === 'wood' ? 'axe' : 'pickaxe', action = node.resource === 'wood' ? 'Talar árbol' : 'Extraer ' + RESOURCE_NAMES[node.resource].toLowerCase();
          hint = p.weapon === tool ? 'Espacio / clic · ' + action + ' · ' + node.hits + ' golpes' : action + ' · ' + (p.weapons.includes(tool) ? 'Equipá ' : 'Necesitás ') + (tool === 'axe' ? 'el hacha (5)' : 'el pico (6)');
        }
      }
      $('interaction-hint').classList.toggle('hidden',!hint);
      if (hint) text('interaction-hint',hint);
    }
  }
  $('stats-button').addEventListener('click',showStats); $('journal-button').addEventListener('click',() => showJournal()); $('map-button').addEventListener('click',showMap); $('pause-button').addEventListener('click',showPause);
  $('inventory-button').addEventListener('click',showInventory);
  $('ability-button').addEventListener('click',() => game.ability());
  function setTouchKey(key,pressed) {
    if (game.keys && typeof game.keys.add === 'function') { if (pressed) game.keys.add(key); else game.keys.delete(key); }
    else if (game.keys) game.keys[key] = pressed;
  }
  document.querySelectorAll('[data-touch]').forEach(node => {
    const key = node.dataset.touch;
    node.addEventListener('pointerdown',event => { event.preventDefault(); if (game.state !== 'playing') return; node.setPointerCapture(event.pointerId); setTouchKey(key,true); });
    ['pointerup','pointercancel','lostpointercapture'].forEach(type => node.addEventListener(type,event => { event.preventDefault(); setTouchKey(key,false); }));
  });
  $('touch-interact').addEventListener('click',() => game.interact());
  $('touch-attack').addEventListener('pointerdown',event => { event.preventDefault(); if (game.state !== 'playing') return; event.currentTarget.setPointerCapture(event.pointerId); setTouchKey(' ',true); if (game.attack) game.attack(); });
  ['pointerup','pointercancel','lostpointercapture'].forEach(type => $('touch-attack').addEventListener(type,event => { event.preventDefault(); setTouchKey(' ',false); }));
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
    if (type === 'tick') updateHud();
    else if (type === 'toast') toast(detail.message,detail.error);
    else if (type === 'start') {
      hasStarted = true;
      clearToasts();
      hideModal(false); showPlaying(); updateSound();
      if (!detail.loaded && game.settings.tutorial) showTutorial();
    } else if (type === 'escape') { if (visibleModal()) closeModal(); else if (game.player && game.state !== 'menu' && game.state !== 'characters') showPause(); }
    else if (type === 'pause' && !suppressPause) showPause();
    else if (type === 'stats') showStats();
    else if (type === 'map') showMap();
    else if (type === 'journal') showJournal();
    else if (type === 'craft' || type === 'inventory') showInventory();
    else if (type === 'biome') { updateHud(true); toast(detail.name + (detail.safe ? ' · Zona segura' : ' · Mirá por dónde pisás')); }
    else if (type === 'knockout') {
      openModal('De vuelta en casa', 'UN TROPIEZO EN EL CAMINO',parent => {
        paragraph(parent,detail.quote || 'Un respiro, y volvemos a intentarlo.','death-quote');
        paragraph(parent,'Volviste a la aldea. Tus armas, herramientas y materiales quedaron en una mochila donde caíste. Tenés 5 minutos de juego para recuperarla con E; el mapa M señala su ubicación.');
        paragraph(parent,'Si se acaba el tiempo, el contenido se pierde. Las armas y herramientas encontradas vuelven a su lugar original; las fabricadas hay que hacerlas de nuevo. Tu experiencia y mejoras se conservan. La pausa detiene el reloj.','hint');
        const actions = el('div','modal-actions'); actions.append(button('Levantarme y seguir',() => hideModal(),'button primary')); parent.append(actions);
      });
    } else if (type === 'complete') showJournal(true);
  };
  renderWeapons(); updateSound(); updateSaveCount();
  window.addEventListener('beforeunload',event => {
    if (hasStarted && game.player && game.state !== 'menu') { event.preventDefault(); event.returnValue = ''; }
  });
})();

