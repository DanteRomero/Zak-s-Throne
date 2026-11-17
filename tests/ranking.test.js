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
    assert('Sin récord contra Zak no manda la columna', !('zak_time' in body));
    g.player.zakBest = 95.4; sent.length = 0; await Z.Ranking.submit(g);
    assert('Con récord manda zak_time en segundos', JSON.parse(sent.find(r => r.options.method === 'POST').options.body).zak_time === 95);
    // Servidor sin la columna nueva: responde 400 y se reintenta sin zak_time.
    const okFetch = window.fetch; sent.length = 0;
    window.fetch = async (url, options = {}) => { sent.push({url, options}); if ((options.method || 'GET') === 'POST') return new Response(null, {status: String(options.body).includes('zak_time') ? 400 : 201}); return okFetch(url, options); };
    await Z.Ranking.submit(g); const posts = sent.filter(r => r.options.method === 'POST');
    assert('Sin la columna en Supabase reintenta sin zak_time', posts.length === 2 && !posts[1].options.body.includes('zak_time'));
    window.fetch = okFetch; g.player.zakBest = 0;
    // v2.22: cada partida publica con su propio apodo.
    const mine = g.player.rankName; g.player.rankName = 'Otro apodo'; sent.length = 0; await Z.Ranking.submit(g);
    assert('Cada partida publica con su propio apodo', JSON.parse(sent.find(r => r.options.method === 'POST').options.body).name === 'Otro apodo');
    g.player.rankName = mine;
    // v2.24: desafío semanal. Solo se manda cuando está cumplido; sin las columnas, se reintenta sin ellas.
    g.player.weekly = {week: Z.weekId(), id: 'hunter', count: 10, done: false, at: 0, paid: false, first: false}; sent.length = 0; await Z.Ranking.submit(g);
    assert('Sin cumplir, no manda el desafío', !/weekly/.test(sent.find(r => r.options.method === 'POST').options.body));
    Object.assign(g.player.weekly, {count: 500, done: true, at: 1763300000000}); sent.length = 0; await Z.Ranking.submit(g);
    const v224 = JSON.parse(sent.find(r => r.options.method === 'POST').options.body);
    assert('Cumplido, manda la semana y cuándo', v224.weekly === Z.weekId() && v224.weekly_at === 1763300000000);
    sent.length = 0; window.fetch = async (url, options = {}) => { sent.push({url, options}); if ((options.method || 'GET') === 'POST') return new Response(null, {status: /weekly/.test(String(options.body)) ? 400 : 201}); return okFetch(url, options); };
    await Z.Ranking.submit(g); const weeklyRetry = sent.filter(r => r.options.method === 'POST');
    assert('Sin las columnas del desafío reintenta sin ellas', weeklyRetry.length === 2 && !/weekly/.test(weeklyRetry[1].options.body));
    const firstOf = rowsBack => async (url, options = {}) => { sent.push({url, options}); if (/weekly=eq/.test(url)) return new Response(JSON.stringify(rowsBack), {status: 200}); return okFetch(url, options); };
    window.fetch = firstOf([]); assert('Si nadie lo cumplió antes, sos el primero', await Z.Ranking.weeklyFirst(Z.weekId(), g.player.runId) === true);
    window.fetch = firstOf([{run_id: g.player.runId, weekly: Z.weekId(), weekly_at: 1}]); assert('Si el primero sos vos, también', await Z.Ranking.weeklyFirst(Z.weekId(), g.player.runId) === true);
    window.fetch = firstOf([{run_id: 'otra-partida-123', weekly: Z.weekId(), weekly_at: 1}]); assert('Si alguien lo cumplió antes, no', await Z.Ranking.weeklyFirst(Z.weekId(), g.player.runId) === false);
    assert('La consulta pide el más temprano de esta semana', /weekly=eq\.\d{4}-W\d{2}/.test(sent[sent.length - 1].url) && /order=weekly_at\.asc/.test(sent[sent.length - 1].url));
    window.fetch = async (url, options = {}) => /weekly=eq/.test(url) ? new Response('', {status: 400}) : okFetch(url, options);
    assert('Sin las columnas no se sabe (null)', await Z.Ranking.weeklyFirst(Z.weekId(), g.player.runId) === null);
    window.fetch = okFetch; g.player.weekly = null;
    // v2.21: revancha contra Zak furioso y medallas, con su propia columna.
    g.player.zakFuryBest = 130.2; g.player.medals = ['capo', 'golem']; sent.length = 0; await Z.Ranking.submit(g);
    const v221 = JSON.parse(sent.find(r => r.options.method === 'POST').options.body);
    assert('Manda el récord de la revancha y la cantidad de medallas', v221.zak_fury_time === 130 && v221.medals === 2);
    sent.length = 0; window.fetch = async (url, options = {}) => { sent.push({url, options}); if ((options.method || 'GET') === 'POST') return new Response(null, {status: /medals|zak_fury_time/.test(String(options.body)) ? 400 : 201}); return okFetch(url, options); };
    await Z.Ranking.submit(g); const retried = sent.filter(r => r.options.method === 'POST');
    assert('Sin las columnas nuevas reintenta sin ellas', retried.length === 2 && !/medals|zak_fury_time/.test(retried[1].options.body));
    window.fetch = okFetch; g.player.zakFuryBest = 0; g.player.medals = [];
    document.getElementById('ranking-button').click(); await wait(50);
    [...document.querySelectorAll('.rank-tab')].find(b => b.textContent === 'Récord Zak').click(); await wait(50);
    assert('La pestaña Récord Zak pide solo quienes lo vencieron, del más rápido al más lento', sent.some(r => String(r.url).includes('zak_time=not.is.null') && String(r.url).includes('order=zak_time.asc')));
    assert('Sin récords muestra un aviso', document.querySelector('.rank-list').textContent.includes('nadie venció a Zak'));
    close();
    document.getElementById('ranking-button').click(); await wait(50);
    assert('Con configuración el ranking es en línea', document.querySelector('.modal-eyebrow').textContent.includes('EN LÍNEA'));
    assert('Descarta filas inválidas y ordena por nivel', rows().length === 2 && rows()[0].textContent.includes('Paco'));
    assert('Los nombres se muestran como texto, sin HTML', !document.querySelector('.rank-list script') && rows()[0].textContent.includes('Paco script'));
    [...document.querySelectorAll('.rank-tab')].find(b => b.textContent === 'Jefes').click(); await wait(50);
    assert('Las pestañas piden otro orden al servidor', sent.some(r => String(r.url).includes('order=bosses.desc')));
    [...document.querySelectorAll('.rank-tab')].find(b => b.textContent === 'Revancha Zak').click(); await wait(50);
    assert('La pestaña Revancha Zak pide solo quienes ganaron la revancha', sent.some(r => String(r.url).includes('zak_fury_time=not.is.null') && String(r.url).includes('order=zak_fury_time.asc')));
    [...document.querySelectorAll('.rank-tab')].find(b => b.textContent === 'Medallas').click(); await wait(50);
    assert('La pestaña Medallas ordena por medallas', sent.some(r => String(r.url).includes('order=medals.desc')));
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
