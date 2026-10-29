/* Controles táctiles: ejecutar con browser_check.py index.html --touch --width 844 --height 390 --script tests/touch.test.js */
(async () => {
  'use strict';
  window.ZAK_CONFIG = {supabaseUrl: '', supabaseKey: ''}; // Las pruebas nunca publican en el ranking real.
  const g = window.zakGame, results = [];
  const wait = ms => new Promise(resolve => setTimeout(resolve, ms));
  const assert = (name, condition) => results.push({name, pass: !!condition});
  const pointer = (node, type, x, y, id = 7) => node.dispatchEvent(new PointerEvent(type, {bubbles: true, cancelable: true, pointerId: id, pointerType: 'touch', clientX: x, clientY: y, isPrimary: true}));
  g.settings.tutorial = false;
  document.getElementById('new-game').click();
  document.getElementById('player-name').value = 'Pulgar';
  document.getElementById('begin-adventure').click();
  const zone = document.getElementById('joystick-zone'), box = zone.getBoundingClientRect();
  assert('Joystick visible en pantalla táctil', box.width > 100 && getComputedStyle(document.getElementById('touch-controls')).display !== 'none');
  const startX = g.player.x, cx = box.left + 90, cy = box.bottom - 90;
  pointer(zone, 'pointerdown', cx, cy); pointer(zone, 'pointermove', cx + 60, cy);
  assert('Arrastrar el joystick produce dirección analógica', g.stick.x > .9 && Math.abs(g.stick.y) < .05);
  await wait(500);
  assert('El personaje camina con el joystick', g.player.x > startX + 20);
  pointer(zone, 'pointerup', cx + 60, cy);
  assert('Soltar el joystick frena', g.stick.x === 0 && g.stick.y === 0);
  const run = document.getElementById('touch-run'); pointer(run, 'pointerdown', 0, 0);
  assert('Correr se activa con un toque', g.runToggle === true);
  pointer(run, 'pointerdown', 0, 0); assert('Correr se desactiva con otro toque', g.runToggle === false);
  const thief = g.enemies.find(e => e.type === 'thief');
  Object.assign(g.player, {x: thief.x - 25, y: thief.y + 10, dir: 'down'}); g.biome = thief.biome; thief.stun = 50;
  const hp = thief.hp, attack = document.getElementById('touch-attack');
  pointer(attack, 'pointerdown', 0, 0, 9); pointer(attack, 'pointerup', 0, 0, 9);
  assert('El ataque táctil apunta solo al enemigo cercano', thief.hp < hp && g.player.dir === 'right');
  g.player.weapons.push('bow'); g.player.weapon = 'fists'; pointer(document.getElementById('touch-weapon'), 'pointerdown', 0, 0);
  assert('El botón de arma rota entre las conseguidas', g.player.weapon === 'bow');
  g.player.rollCooldown = 0; pointer(document.getElementById('touch-roll'), 'pointerdown', 0, 0);
  assert('Rodar desde el botón', g.player.roll > 0);
  const actions = document.querySelector('.touch-actions'), small = actions.getBoundingClientRect().width;
  assert('Los controles arrancan en tamaño chico', getComputedStyle(document.documentElement).getPropertyValue('--tc').trim() === '0.7' && small < 170);
  document.getElementById('pause-button').click();
  [...document.querySelectorAll('#modal-content button')].find(b => b.textContent === 'Opciones y controles').click();
  const size = document.querySelector('[aria-label="Tamaño de los controles táctiles"]'); size.click();
  assert('Opciones permite agrandar los controles', size.textContent === 'MEDIANOS' && actions.getBoundingClientRect().width > small && JSON.parse(localStorage.getItem('zak.throne.settings.v1')).controls === 'medium');
  size.click(); size.click();
  assert('El tamaño vuelve a chico al recorrer las opciones', size.textContent === 'CHICOS');
  document.getElementById('close-modal').click(); document.getElementById('close-modal').click();
  g.pause(); g.resume();
  return {passed: results.filter(r => r.pass).length, failed: results.filter(r => !r.pass).length, results};
})()
