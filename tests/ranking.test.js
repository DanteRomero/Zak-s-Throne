/* Ranking: python tests/browser_check.py index.html --script tests/ranking.test.js
   Prueba el modo local y el modo online con un servidor simulado (no usa Internet). */
(async () => {
  'use strict';
  window.ZAK_CONFIG = {supabaseUrl: '', supabaseKey: ''}; // Las pruebas nunca publican en el ranking real.
  const g = window.zakGame, Z = window.Zak, results = [];
  const wait = ms => new Promise(resolve => setTimeout(resolve, ms));
  const assert = (name, condition) => results.push({name, pass: !!condition});
  const rows = () => [...document.querySelectorAll('.rank-row:not(.rank-head)')];
  const close = () => document.getElementById('close-modal').click();
  cancelAnimationFrame(g.frame); g.settings.tutorial = false;

  document.getElementById('new-game').click();
  document.getElementById('player-name').value = '  <b>Dantecito</b> con nombre larguísimo ';
  document.querySelector('[data-character="tena"]').click();
  document.getElementById('begin-adventure').click();
  assert('El nombre se limpia y se recorta a 16 caracteres', Z.Ranking.profile().name === 'bDantecito/b con');
  g.player.kills = 12; g.player.level = 4; g.player.bossKills = 1;
  document.getElementById('pause-button').click();
  [...document.querySelectorAll('#modal-content button')].find(b => b.textContent === 'Ranking de amigos').click();
  await wait(50);
  assert('Sin configuración muestra el ranking de este dispositivo', document.querySelector('.modal-eyebrow').textContent.includes('SOLO ESTE DISPOSITIVO'));
  assert('La partida actual aparece marcada como propia', rows().length === 1 && rows()[0].classList.contains('mine') && rows()[0].textContent.includes('Tena'));
  close(); close();

  const sent = [];
  window.ZAK_CONFIG = {supabaseUrl: 'https://demo.supabase.co/', supabaseKey: 'sb_publishable_demo', table: 'scores'};
  const realFetch = window.fetch;
  window.fetch = async (url, options = {}) => {
    sent.push({url, options});
    if ((options.method || 'GET') === 'POST') return new Response(null, {status: 201});
    return new Response(JSON.stringify([
      {run_id: 'friend-run-1', player_id: 'friend-1', name: 'Paco <script>', character: 'paco', level: 9, kills: 80, bosses: 3},
      {run_id: 'x', name: 'inválido'},
      {run_id: g.player.runId, player_id: Z.Ranking.profile().id, name: 'yo', character: 'tena', level: 4, kills: 12, bosses: 1}
    ]), {status: 200, headers: {'Content-Type': 'application/json'}});
  };
  try {
    await Z.Ranking.submit(g);
    const post = sent.find(r => r.options.method === 'POST'), body = JSON.parse(post.options.body);
    assert('Publica con upsert por partida', post.url === 'https://demo.supabase.co/rest/v1/scores?on_conflict=run_id' && post.options.headers.Prefer.includes('merge-duplicates'));
    assert('La clave publishable va en apikey y sin Bearer', post.options.headers.apikey === 'sb_publishable_demo' && !post.options.headers.Authorization);
    assert('Envía nivel, enemigos y jefes', body.level === 4 && body.kills === 12 && body.bosses === 1 && body.character === 'tena');
    document.getElementById('ranking-button').click(); await wait(50);
    assert('Con configuración el ranking es en línea', document.querySelector('.modal-eyebrow').textContent.includes('EN LÍNEA'));
    assert('Descarta filas inválidas y ordena por nivel', rows().length === 2 && rows()[0].textContent.includes('Paco'));
    assert('Los nombres se muestran como texto, sin HTML', !document.querySelector('.rank-list script') && rows()[0].textContent.includes('Paco script'));
    [...document.querySelectorAll('.rank-tab')].find(b => b.textContent === 'Jefes').click(); await wait(50);
    assert('Las pestañas piden otro orden al servidor', sent.some(r => String(r.url).includes('order=bosses.desc')));
    close();
    await Z.Ranking.remove('friend-run-1');
    const del = sent.find(r => r.options.method === 'DELETE');
    assert('Borrar una partida la quita del servidor por run_id', del && del.url === 'https://demo.supabase.co/rest/v1/scores?run_id=eq.friend-run-1' && del.options.headers.apikey === 'sb_publishable_demo');
    window.fetch = async () => { throw new Error('sin conexión'); };
    await Z.Ranking.remove('otra-partida-1').catch(() => {});
    assert('Sin conexión el borrado queda pendiente', JSON.parse(localStorage.getItem('zak.throne.ranking.deleted.v1')).includes('otra-partida-1'));
    document.getElementById('ranking-button').click(); await wait(50);
    assert('Sin conexión muestra las partidas locales', document.querySelector('.rank-list').textContent.includes('No se pudo cargar') && rows().length >= 1);
    close();
  } finally { window.fetch = realFetch; window.ZAK_CONFIG = {supabaseUrl: '', supabaseKey: ''}; }
  return {passed: results.filter(r => r.pass).length, failed: results.filter(r => !r.pass).length, results};
})()
