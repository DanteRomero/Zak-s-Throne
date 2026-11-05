/* Partidas en la nube: cuentas de Supabase y sincronización de las tres ranuras. Ver docs/CLOUD.md.
   El juego siempre guarda primero en el dispositivo: la nube es una copia, y sin conexión todo sigue andando. */
(function () {
'use strict';
const Z = window.Zak = window.Zak || {};
const SESSION_KEY = 'zak.throne.cloud.session.v1', SYNC_KEY = 'zak.throne.cloud.sync.v1', TABLE = 'cloud_saves', SLOTS = [1, 2, 3];
const config = () => window.ZAK_CONFIG || {};
const baseUrl = () => String(config().supabaseUrl || '').replace(/\/+$/, '');
function readJson(key) { try { return JSON.parse(localStorage.getItem(key) || 'null'); } catch (_) { return null; } }
function writeJson(key, value) { try { if (value === null) localStorage.removeItem(key); else localStorage.setItem(key, JSON.stringify(value)); } catch (_) {} }
class CloudError extends Error { constructor(message, kind = 'server') { super(message); this.kind = kind; } }

// Decide qué hacer con una ranura, según su versión acá (local), en la nube (cloud) y la última vez que coincidieron (base).
// Solo compara si cambiaron, nunca cuál es más nueva: los relojes de dos dispositivos pueden no coincidir.
function plan(local, cloud, base) {
  if (local === cloud) return 'none';
  if (local && !cloud) return base && local === base ? 'delete-local' : 'upload';
  if (!local && cloud) return base && cloud === base ? 'delete-cloud' : 'download';
  if (local === base) return 'download';
  if (cloud === base) return 'upload';
  return 'conflict';
}

const FRIENDLY = {
  invalid_credentials: 'El mail o la contraseña no son correctos.', invalid_grant: 'El mail o la contraseña no son correctos.',
  email_not_confirmed: 'Falta confirmar tu mail: revisá tu correo.', user_already_exists: 'Ya hay una cuenta con ese mail. Probá entrar.',
  email_exists: 'Ya hay una cuenta con ese mail. Probá entrar.', weak_password: 'La contraseña es muy corta: usá al menos 6 caracteres.',
  validation_failed: 'Revisá que el mail esté bien escrito.', email_address_invalid: 'Revisá que el mail esté bien escrito.',
  over_email_send_rate_limit: 'Se enviaron demasiados mails. Probá de nuevo en un rato.', over_request_rate_limit: 'Demasiados intentos. Probá de nuevo en un rato.',
  signup_disabled: 'La creación de cuentas está desactivada.', same_password: 'Elegí una contraseña distinta de la anterior.'
};
async function failure(response) {
  let body = {}; try { body = await response.json(); } catch (_) {}
  const code = body.error_code || body.code || body.error;
  return new CloudError(FRIENDLY[code] || (response.status >= 500 ? 'El servidor no responde. Probá más tarde.' : 'No se pudo completar (' + response.status + ').'), response.status === 401 || response.status === 403 ? 'auth' : response.status === 404 ? 'setup' : 'server');
}
async function send(url, options) {
  try { return await fetch(url, options); }
  catch (_) { throw new CloudError('Sin conexión. Tus partidas quedan en este dispositivo y se suben cuando vuelva.', 'offline'); }
}
const authHeaders = () => ({ apikey: config().supabaseKey, 'Content-Type': 'application/json' });
function keep(data) {
  if (!data || !data.access_token || !data.refresh_token) return null;
  const previous = readJson(SESSION_KEY) || {}, user = data.user || previous.user || {};
  const session = { access_token: data.access_token, refresh_token: data.refresh_token, expires_at: Number(data.expires_at) || Math.floor(Date.now() / 1000) + (Number(data.expires_in) || 3600), user: { id: user.id, email: user.email } };
  writeJson(SESSION_KEY, session); return session;
}

let adapter = null, running = null, again = false;
const snoozed = new Set();
const state = { status: 'idle', message: '', lastSync: 0 };
const notify = () => { if (adapter && adapter.onStatus) adapter.onStatus(state); };
function setState(status, message = '') { state.status = status; state.message = message; notify(); }

const Cloud = Z.Cloud = {
  plan, state,
  available: () => !!(baseUrl() && config().supabaseKey),
  session: () => { const s = readJson(SESSION_KEY); return s && s.access_token && s.refresh_token && s.user && s.user.id ? s : null; },
  email() { const s = this.session(); return s ? s.user.email || '' : ''; },
  attach(value) { adapter = value; },
  async signIn(email, password) {
    const response = await send(baseUrl() + '/auth/v1/token?grant_type=password', { method: 'POST', headers: authHeaders(), body: JSON.stringify({ email, password }) });
    if (!response.ok) throw await failure(response);
    const session = keep(await response.json()); if (!session) throw new CloudError('La respuesta del servidor no es válida.');
    this.resetSync(); return session;
  },
  // Devuelve la sesión, o null si el proyecto pide confirmar el mail antes de entrar.
  async signUp(email, password) {
    const response = await send(baseUrl() + '/auth/v1/signup', { method: 'POST', headers: authHeaders(), body: JSON.stringify({ email, password }) });
    if (!response.ok) throw await failure(response);
    const session = keep(await response.json()); if (session) this.resetSync();
    return session;
  },
  async recover(email) {
    const back = location.origin + location.pathname, response = await send(baseUrl() + '/auth/v1/recover?redirect_to=' + encodeURIComponent(back), { method: 'POST', headers: authHeaders(), body: JSON.stringify({ email }) });
    if (!response.ok) throw await failure(response);
  },
  async updatePassword(password) {
    const response = await this.api('/auth/v1/user', { method: 'PUT', body: JSON.stringify({ password }) });
    if (!response.ok) throw await failure(response);
  },
  // Cerrar sesión deja las partidas en este dispositivo; solo se olvida de la cuenta.
  async signOut() {
    const session = this.session();
    writeJson(SESSION_KEY, null); this.resetSync(); setState('idle');
    if (session) { try { await fetch(baseUrl() + '/auth/v1/logout', { method: 'POST', headers: { ...authHeaders(), Authorization: 'Bearer ' + session.access_token } }); } catch (_) {} }
  },
  resetSync() { writeJson(SYNC_KEY, null); snoozed.clear(); },
  // Lee lo que vuelve de los mails de Supabase (recuperar contraseña, confirmar cuenta) y lo saca de la dirección.
  async consumeRedirect() {
    const raw = location.hash.replace(/^#/, ''); if (!/(^|&)(access_token|error_description|error)=/.test(raw)) return null;
    const params = new URLSearchParams(raw); history.replaceState(null, '', location.pathname + location.search);
    if (params.get('error') || params.get('error_description')) return { error: 'El enlace del mail no es válido o ya venció. Pedí uno nuevo.' };
    const session = keep({ access_token: params.get('access_token'), refresh_token: params.get('refresh_token'), expires_in: params.get('expires_in'), expires_at: params.get('expires_at') });
    if (!session) return { error: 'El enlace del mail no es válido.' };
    this.resetSync();
    try { const response = await send(baseUrl() + '/auth/v1/user', { headers: { ...authHeaders(), Authorization: 'Bearer ' + session.access_token } }); if (response.ok) keep({ ...session, user: await response.json() }); else throw await failure(response); }
    catch (error) { writeJson(SESSION_KEY, null); return { error: error.message }; }
    return { type: params.get('type') || 'login' };
  },
  async refresh() {
    const session = this.session(); if (!session) throw new CloudError('Tu sesión terminó. Volvé a entrar.', 'auth');
    const response = await send(baseUrl() + '/auth/v1/token?grant_type=refresh_token', { method: 'POST', headers: authHeaders(), body: JSON.stringify({ refresh_token: session.refresh_token }) });
    if (!response.ok) {
      // Un error del servidor no cierra la sesión; un token rechazado, sí.
      if (response.status >= 500) throw await failure(response);
      writeJson(SESSION_KEY, null); this.resetSync(); throw new CloudError('Tu sesión terminó. Volvé a entrar.', 'auth');
    }
    return keep(await response.json());
  },
  // Pedido autenticado: renueva la sesión si está por vencer y reintenta una vez si el servidor la rechaza.
  async api(path, options = {}) {
    let session = this.session(); if (!session) throw new CloudError('Tu sesión terminó. Volvé a entrar.', 'auth');
    if (session.expires_at - Date.now() / 1000 < 60) session = await this.refresh();
    const call = token => send(baseUrl() + path, { ...options, headers: { ...authHeaders(), Authorization: 'Bearer ' + token, ...(options.headers || {}) } });
    let response = await call(session.access_token);
    if (response.status === 401) { session = await this.refresh(); response = await call(session.access_token); }
    return response;
  },
  async rows() {
    const response = await this.api('/rest/v1/' + TABLE + '?select=slot,saved_at');
    if (!response.ok) throw await failure(response);
    const list = await response.json(); return Array.isArray(list) ? list : [];
  },
  async fetchSlot(slot) {
    const response = await this.api('/rest/v1/' + TABLE + '?select=data&slot=eq.' + slot);
    if (!response.ok) throw await failure(response);
    const list = await response.json(); return Array.isArray(list) && list[0] ? list[0].data : null;
  },
  async upload(slot, data, savedAt) {
    // El apodo viaja con la partida, para no perder el nombre del ranking en un dispositivo nuevo.
    const body = { user_id: this.session().user.id, slot, saved_at: savedAt, data: { ...data, rankName: Z.Ranking ? Z.Ranking.profile().name : '' } };
    const response = await this.api('/rest/v1/' + TABLE + '?on_conflict=user_id,slot', { method: 'POST', headers: { Prefer: 'resolution=merge-duplicates,return=minimal' }, body: JSON.stringify(body) });
    if (!response.ok) throw await failure(response);
  },
  async removeSlot(slot) {
    const response = await this.api('/rest/v1/' + TABLE + '?slot=eq.' + slot, { method: 'DELETE', headers: { Prefer: 'return=minimal' } });
    if (!response.ok) throw await failure(response);
  },
  baseOf(userId) { const sync = readJson(SYNC_KEY); return sync && sync.user === userId && sync.base && typeof sync.base === 'object' ? sync.base : {}; },
  storeDownload(slot, data) {
    if (!adapter.accept(data)) throw new CloudError('La copia de la ranura ' + slot + ' en la nube está dañada: no se bajó.');
    const name = String(data.rankName || '');
    if (name && Z.Ranking && !Z.Ranking.profile().name) Z.Ranking.setName(name);
    adapter.write(slot, data);
  },
  // Compara las tres ranuras y aplica lo que corresponda. Una ranura con problemas no frena a las otras.
  async runOnce() {
    const session = this.session(); if (!session) return;
    const user = session.user.id, cloud = {}, conflicts = [], problems = []; let changed = false;
    (await this.rows()).forEach(row => { cloud[row.slot] = row.saved_at; });
    const base = { ...this.baseOf(user) }, save = () => writeJson(SYNC_KEY, { user, base });
    for (const slot of SLOTS) {
      const local = adapter.read(slot);
      if (local.state === 'unavailable') throw new CloudError('El navegador bloquea el almacenamiento local.');
      // Un guardado dañado no cuenta como borrado: no debe eliminar la copia sana de la nube.
      if (local.state === 'invalid') delete base[slot];
      const mine = local.state === 'valid' ? String(local.data.savedAt || 'sin-fecha') : null, theirs = cloud[slot] || null;
      const action = plan(mine, theirs, base[slot] || null);
      try {
        if (action === 'none') { if (mine) base[slot] = mine; else delete base[slot]; }
        else if (action === 'upload') { await this.upload(slot, local.data, mine); base[slot] = mine; }
        else if (action === 'download') { this.storeDownload(slot, await this.fetchSlot(slot)); base[slot] = theirs; changed = true; }
        else if (action === 'delete-cloud') { await this.removeSlot(slot); delete base[slot]; }
        else if (action === 'delete-local') { adapter.remove(slot); delete base[slot]; changed = true; }
        else if (!snoozed.has(slot + '|' + mine + '|' + theirs)) { const data = await this.fetchSlot(slot); if (adapter.accept(data)) conflicts.push({ slot, local: local.data, cloud: data, localAt: mine, cloudAt: theirs }); else problems.push('La copia de la ranura ' + slot + ' en la nube está dañada.'); }
      } catch (error) { if (error.kind === 'offline' || error.kind === 'auth' || error.kind === 'setup') { save(); throw error; } problems.push(error.message); }
      save();
    }
    if (changed && adapter.onChange) adapter.onChange();
    if (conflicts.length && adapter.onConflict) adapter.onConflict(conflicts);
    if (problems.length) throw new CloudError(problems[0]);
  },
  // Sincroniza; si ya hay una en curso, repite al terminar para no perder cambios. Nunca rechaza: el error queda en state.
  sync() {
    if (!this.available() || !this.session() || !adapter) return Promise.resolve(false);
    if (running) { again = true; return running; }
    setState('syncing');
    running = (async () => {
      try {
        do { again = false; await this.runOnce(); } while (again);
        state.lastSync = Date.now(); setState('ok'); return true;
      } catch (error) {
        if (error.kind === 'setup') setState('setup', 'Falta preparar la nube del juego (ver docs/CLOUD.md).');
        else setState(error.kind === 'offline' ? 'offline' : 'error', error.message);
        return false;
      } finally { running = null; }
    })();
    return running;
  },
  // Resuelve una ranura con dos versiones distintas. 'later' no toca nada y no vuelve a preguntar hasta que algo cambie.
  async resolve(conflict, choice) {
    const session = this.session(); if (!session) return;
    const user = session.user.id, base = { ...this.baseOf(user) };
    if (choice === 'later') { snoozed.add(conflict.slot + '|' + conflict.localAt + '|' + conflict.cloudAt); return; }
    if (choice === 'cloud') { this.storeDownload(conflict.slot, conflict.cloud); base[conflict.slot] = conflict.cloudAt; if (adapter.onChange) adapter.onChange(); }
    else { await this.upload(conflict.slot, conflict.local, conflict.localAt); base[conflict.slot] = conflict.localAt; }
    writeJson(SYNC_KEY, { user, base });
  }
};
})();
