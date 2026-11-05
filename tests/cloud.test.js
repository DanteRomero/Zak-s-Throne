/* Nube: python tests/browser_check.py index.html --script tests/cloud.test.js
   Usa un servidor simulado que imita a Supabase, incluida la separación por usuario. No usa Internet.
   Lo que NO prueba: las políticas reales de la base; esas se comprueban en el proyecto (docs/CLOUD.md). */
(async () => {
  'use strict';
  window.ZAK_CONFIG = {supabaseUrl: 'https://demo.supabase.co', supabaseKey: 'sb_publishable_demo', table: 'scores'};
  const g = window.zakGame, Z = window.Zak, C = Z.Cloud, results = [];
  const assert = (name, condition) => results.push({name, pass: !!condition});
  const wait = (ms = 20) => new Promise(resolve => setTimeout(resolve, ms));
  const SAVE = n => 'zak.throne.save.' + n, SESSION = 'zak.throne.cloud.session.v1', SYNC = 'zak.throne.cloud.sync.v1';
  cancelAnimationFrame(g.frame); g.settings.tutorial = false;

  // Decisiones por ranura.
  const plans = [
    [null, null, null, 'none'], ['a', 'a', null, 'none'], ['a', null, null, 'upload'], [null, 'a', null, 'download'],
    ['b', 'a', 'a', 'upload'], ['a', 'b', 'a', 'download'], ['b', 'c', 'a', 'conflict'], ['b', 'c', null, 'conflict'],
    [null, 'a', 'a', 'delete-cloud'], ['a', null, 'a', 'delete-local'], ['b', null, 'a', 'upload'], [null, 'b', 'a', 'download']
  ];
  assert('Cada caso de sincronización decide lo correcto', plans.every(([l, c, b, want]) => C.plan(l, c, b) === want));

  // Servidor simulado: cada usuario solo ve sus filas.
  const server = {users: {}, rows: [], requests: [], down: false, noTable: false, tokens: {}, serial: 0};
  const reply = (status, body) => new Response(body === undefined ? null : JSON.stringify(body), {status, headers: {'Content-Type': 'application/json'}});
  const tokensFor = user => { const access = 'access-' + (++server.serial), refresh = 'refresh-' + server.serial; server.tokens[access] = user.id; server.tokens[refresh] = user.id; return {access_token: access, refresh_token: refresh, expires_in: 3600, user: {id: user.id, email: user.email}}; };
  window.fetch = async (rawUrl, options = {}) => {
    const url = new URL(rawUrl), path = url.pathname, method = options.method || 'GET', headers = options.headers || {}, body = options.body ? JSON.parse(options.body) : null;
    server.requests.push({path, method, body, url: rawUrl});
    if (server.down) throw new TypeError('Failed to fetch');
    if (path.endsWith('/rest/v1/scores')) return reply(201);
    const bearer = String(headers.Authorization || '').replace('Bearer ', ''), who = server.tokens[bearer];
    if (path === '/auth/v1/signup') { if (server.users[body.email]) return reply(422, {error_code: 'user_already_exists'}); const user = server.users[body.email] = {id: 'user-' + (++server.serial), email: body.email, password: body.password}; return reply(200, tokensFor(user)); }
    if (path === '/auth/v1/token') {
      if (url.searchParams.get('grant_type') === 'password') { const user = server.users[body.email]; if (!user || user.password !== body.password) return reply(400, {error_code: 'invalid_credentials'}); return reply(200, tokensFor(user)); }
      const id = server.tokens[body.refresh_token]; if (!id) return reply(400, {error_code: 'refresh_token_not_found'}); delete server.tokens[body.refresh_token];
      return reply(200, tokensFor(Object.values(server.users).find(u => u.id === id)));
    }
    if (path === '/auth/v1/recover') return reply(200, {});
    if (path === '/auth/v1/logout') return reply(204);
    if (path === '/auth/v1/user') { if (!who) return reply(401, {}); const user = Object.values(server.users).find(u => u.id === who); if (method === 'PUT') user.password = body.password; return reply(200, {id: user.id, email: user.email}); }
    if (path === '/rest/v1/cloud_saves') {
      if (server.noTable) return reply(404, {code: 'PGRST205'});
      if (!who) return reply(401, {code: 'PGRST301'});
      const slot = Number((url.searchParams.get('slot') || '').replace('eq.', '')), mine = server.rows.filter(r => r.user_id === who && (!slot || r.slot === slot));
      if (method === 'GET') return reply(200, mine.map(r => url.searchParams.get('select') === 'data' ? {data: r.data} : {slot: r.slot, saved_at: r.saved_at}));
      if (method === 'DELETE') { server.rows = server.rows.filter(r => !mine.includes(r)); return reply(204); }
      if (body.user_id !== who) return reply(403, {code: '42501'}); // Lo que haría la política de la base.
      server.rows = server.rows.filter(r => !(r.user_id === who && r.slot === body.slot)); server.rows.push(JSON.parse(JSON.stringify(body))); return reply(201);
    }
    return reply(404, {});
  };

  // Una partida real en la ranura 1, sin cuenta.
  document.getElementById('new-game').click();
  document.getElementById('player-name').value = 'Pulgar';
  document.getElementById('begin-adventure').click();
  const modalButton = label => [...document.querySelectorAll('#modal-content button')].find(b => b.textContent.trim() === label);
  const saveInSlot = async n => { document.getElementById('pause-button').click(); modalButton('Guardar partida').click(); document.querySelectorAll('.save-slot')[n - 1].click(); const confirm = modalButton('Confirmar'); if (confirm) confirm.click(); await wait(); };
  const closeAll = () => { for (let k = 0; k < 4 && !document.getElementById('modal-overlay').classList.contains('hidden'); k++) document.getElementById('close-modal').click(); };
  g.player.level = 7; const before = server.requests.length; await saveInSlot(1); closeAll();
  assert('Sin cuenta, guardar no toca la nube', !server.requests.slice(before).some(r => r.path.includes('cloud_saves')) && !!localStorage.getItem(SAVE(1)));

  // Crear la cuenta desde la pantalla.
  const openCloud = () => { document.getElementById('pause-button').click(); modalButton('Cuenta y nube').click(); };
  const fill = (mail, pass) => { const inputs = document.querySelectorAll('.cloud-field input'); inputs[0].value = mail; inputs[1].value = pass; };
  openCloud(); fill('ana@demo.com', '123'); modalButton('Crear cuenta').click(); await wait();
  assert('Una contraseña corta se avisa sin llamar al servidor', document.querySelector('.cloud-error').textContent.includes('6 caracteres') && !server.users['ana@demo.com']);
  fill('ana@demo.com', 'secreta1'); modalButton('Crear cuenta').click(); await wait(60);
  assert('Crear cuenta inicia sesión', C.email() === 'ana@demo.com');
  assert('Al crear la cuenta sube las partidas que ya había', server.rows.length === 1 && server.rows[0].slot === 1 && server.rows[0].data.player.level === 7);
  assert('El apodo viaja con la partida', server.rows[0].data.rankName === 'Pulgar');
  assert('La contraseña no queda en el dispositivo', !JSON.stringify({...localStorage}).includes('secreta1'));
  assert('Se ve el estado de la sincronización', document.getElementById('cloud-state').textContent.includes('sincronizado'));
  closeAll();

  // Guardar sube solo.
  g.player.level = 9; await saveInSlot(1); closeAll(); await wait(40);
  assert('Guardar actualiza la nube', server.rows.find(r => r.slot === 1).data.player.level === 9);
  await saveInSlot(2); closeAll(); await wait(40);
  assert('Cada ranura se sube por separado', server.rows.length === 2);

  // Otro dispositivo: sin ranuras, sin apodo y sin sesión.
  const otherDevice = () => { [1, 2, 3].forEach(n => localStorage.removeItem(SAVE(n))); localStorage.removeItem(SESSION); localStorage.removeItem(SYNC); Z.Ranking.setName(''); };
  otherDevice(); await C.signIn('ana@demo.com', 'secreta1'); await C.sync();
  assert('En otro dispositivo bajan las partidas', JSON.parse(localStorage.getItem(SAVE(1))).player.level === 9 && !!localStorage.getItem(SAVE(2)));
  assert('Y también el apodo del ranking', Z.Ranking.profile().name === 'Pulgar');
  assert('Lo bajado queda sincronizado: no se vuelve a subir', await (async () => { const n = server.requests.length; await C.sync(); return !server.requests.slice(n).some(r => r.method === 'POST'); })());

  // Cambió en la nube y acá no: baja sola.
  const stored = n => JSON.parse(localStorage.getItem(SAVE(n)));
  const row = server.rows.find(r => r.slot === 1); row.data.player.level = 20; row.data.savedAt = '2030-01-01T00:00:00.000Z'; row.saved_at = row.data.savedAt;
  await C.sync(); assert('Lo que cambió en otro dispositivo baja solo', stored(1).player.level === 20);

  // Cambió en los dos lados: pregunta y no pisa nada.
  const mine = stored(1); mine.player.level = 30; mine.savedAt = '2031-01-01T00:00:00.000Z'; localStorage.setItem(SAVE(1), JSON.stringify(mine));
  row.data.player.level = 40; row.data.savedAt = '2032-01-01T00:00:00.000Z'; row.saved_at = row.data.savedAt;
  await C.sync(); await wait();
  assert('Si cambió en los dos lados, pregunta', document.getElementById('modal-title').textContent.includes('dos versiones'));
  assert('Mientras no elijas, no se pisa ninguna', stored(1).player.level === 30 && row.data.player.level === 40);
  modalButton('Decidir después').click(); await wait();
  assert('Decidir después deja las dos versiones', stored(1).player.level === 30 && server.rows.find(r => r.slot === 1).data.player.level === 40);
  const shown = document.getElementById('modal-title').textContent; await C.sync(); await wait();
  assert('Y no vuelve a preguntar enseguida', document.getElementById('modal-title').textContent === shown);
  C.resetSync(); await C.sync(); await wait();
  document.querySelectorAll('.save-slot')[0].click(); await wait(40);
  assert('Elegir la de este dispositivo la sube', server.rows.find(r => r.slot === 1).data.player.level === 30 && stored(1).player.level === 30);
  closeAll();
  const mine2 = stored(1); mine2.player.level = 31; mine2.savedAt = '2033-01-01T00:00:00.000Z'; localStorage.setItem(SAVE(1), JSON.stringify(mine2));
  const row2 = server.rows.find(r => r.slot === 1); row2.data.player.level = 41; row2.data.savedAt = '2034-01-01T00:00:00.000Z'; row2.saved_at = row2.data.savedAt;
  await C.sync(); await wait(); document.querySelectorAll('.save-slot')[1].click(); await wait(40);
  assert('Elegir la de la nube la baja', stored(1).player.level === 41);
  closeAll();

  // Borrar.
  localStorage.removeItem(SAVE(2)); await C.sync();
  assert('Borrar acá la borra de la nube', !server.rows.some(r => r.slot === 2));
  const uid = C.session().user.id; server.rows = server.rows.filter(r => !(r.user_id === uid && r.slot === 1)); await C.sync();
  assert('Borrar en otro dispositivo la borra acá', !localStorage.getItem(SAVE(1)));

  // Datos dañados en la nube: no reemplazan nada.
  localStorage.removeItem(SYNC); server.rows.push({user_id: uid, slot: 3, saved_at: 'x', data: {roto: true}}); await C.sync();
  assert('Una copia dañada de la nube no se baja', !localStorage.getItem(SAVE(3)) && C.state.status === 'error');
  server.rows = server.rows.filter(r => r.slot !== 3); await C.sync();

  // Guardado dañado en el dispositivo: no cuenta como borrado.
  await saveInSlot(1); closeAll(); await wait(40);
  localStorage.setItem(SAVE(1), '{dañado'); await C.sync();
  assert('Un guardado dañado acá no borra la copia sana: se recupera', server.rows.some(r => r.slot === 1) && JSON.parse(localStorage.getItem(SAVE(1))).player);

  // Sin conexión.
  server.down = true; const levelSaved = g.player.level = 12; await saveInSlot(1); closeAll(); await wait(40);
  assert('Sin conexión guarda igual en el dispositivo', stored(1).player.level === levelSaved && C.state.status === 'offline');
  assert('Sin conexión no cierra la sesión', !!C.session());
  server.down = false; await C.sync();
  assert('Cuando vuelve la conexión, sube lo pendiente', server.rows.find(r => r.slot === 1).data.player.level === levelSaved && C.state.status === 'ok');

  // Sesión.
  const session = JSON.parse(localStorage.getItem(SESSION)), oldToken = session.access_token; session.expires_at = 1; localStorage.setItem(SESSION, JSON.stringify(session));
  await C.sync(); assert('Una sesión vencida se renueva sola', C.state.status === 'ok' && C.session().access_token !== oldToken);
  const s2 = C.session(); delete server.tokens[s2.access_token]; await C.sync();
  assert('Un token rechazado se renueva y reintenta', C.state.status === 'ok');
  const s3 = C.session(); delete server.tokens[s3.access_token]; delete server.tokens[s3.refresh_token]; await C.sync();
  assert('Si ya no se puede renovar, pide entrar de nuevo sin perder partidas', !C.session() && C.state.status === 'error' && !!localStorage.getItem(SAVE(1)));

  // Datos de otra persona: el servidor los separa.
  await C.signUp('beto@demo.com', 'clave-beto'); const beto = C.session().user.id; [1, 2, 3].forEach(n => localStorage.removeItem(SAVE(n))); await C.sync();
  assert('Otra cuenta no recibe las partidas ajenas', !localStorage.getItem(SAVE(1)) && !server.rows.some(r => r.user_id === beto));
  await C.signOut();
  const fails = await C.signIn('ana@demo.com', 'mal').then(() => '', error => error.message);
  assert('Credenciales incorrectas se explican en castellano', fails.includes('contraseña no son correctos') && !C.session());
  const taken = await C.signUp('ana@demo.com', 'otra-clave').then(() => '', error => error.message);
  assert('Un mail ya usado se explica', taken.includes('Ya hay una cuenta'));

  // Cerrar sesión.
  await C.signIn('ana@demo.com', 'secreta1'); await C.sync(); await saveInSlot(2); closeAll(); await wait(40);
  await C.signOut();
  assert('Cerrar sesión deja las partidas en el dispositivo', !!localStorage.getItem(SAVE(2)) && !C.session() && !localStorage.getItem(SYNC));
  await saveInSlot(3); closeAll(); await wait(40);
  assert('Sin sesión deja de subir', !server.rows.some(r => r.slot === 3));

  // Sin la tabla creada: el juego sigue y avisa qué falta.
  await C.signIn('ana@demo.com', 'secreta1'); server.noTable = true; await C.sync();
  assert('Si falta preparar Supabase, avisa y no rompe nada', C.state.status === 'setup' && C.state.message.includes('docs/CLOUD.md') && !!localStorage.getItem(SAVE(3)));
  server.noTable = false; await C.signOut();

  // Enlaces de los mails.
  location.hash = '#access_token=' + tokensFor(server.users['ana@demo.com']).access_token + '&refresh_token=refresh-x&expires_in=3600&type=recovery';
  const redirect = await C.consumeRedirect();
  assert('El enlace de recuperar contraseña inicia sesión y sale de la dirección', redirect.type === 'recovery' && C.email() === 'ana@demo.com' && !location.hash);
  await C.updatePassword('nueva-clave'); assert('Se puede cambiar la contraseña', server.users['ana@demo.com'].password === 'nueva-clave');
  await C.signOut(); location.hash = '#error=access_denied&error_description=expired';
  assert('Un enlace vencido avisa', (await C.consumeRedirect()).error.includes('venció') && !location.hash);
  location.hash = '#seccion'; assert('Otros enlaces no se tocan', await C.consumeRedirect() === null && location.hash === '#seccion'); location.hash = '';

  // Sin Supabase configurado la opción no aparece.
  window.ZAK_CONFIG = {supabaseUrl: '', supabaseKey: ''};
  assert('Sin configuración la nube queda apagada', !C.available() && await C.sync() === false);
  document.getElementById('pause-button').click(); assert('Y no aparece en la pausa', !modalButton('Cuenta y nube')); closeAll();
  g.pause(); return {passed: results.filter(r => r.pass).length, failed: results.filter(r => !r.pass).length, results};
})()
