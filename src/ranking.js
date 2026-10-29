/* Ranking entre amigos: online con Supabase si está configurado; si no, en este dispositivo. */
(function () {
'use strict';
const Z = window.Zak = window.Zak || {};
const LOCAL_KEY = 'zak.throne.ranking.v1', PROFILE_KEY = 'zak.throne.profile.v1', DELETE_KEY = 'zak.throne.ranking.deleted.v1';
const ID_PATTERN = /^[\w-]{6,64}$/;
const config = () => window.ZAK_CONFIG || {};
const online = () => !!(config().supabaseUrl && config().supabaseKey);
const uid = () => (window.crypto && crypto.randomUUID) ? crypto.randomUUID() : Date.now().toString(36) + Math.random().toString(36).slice(2, 12);
const int = (value, max) => Math.max(0, Math.min(max, Math.floor(Number(value) || 0)));
function readJson(key, fallback) { try { const value = JSON.parse(localStorage.getItem(key) || 'null'); return value === null ? fallback : value; } catch (_) { return fallback; } }
function writeJson(key, value) { try { localStorage.setItem(key, JSON.stringify(value)); } catch (_) {} }
function cleanName(name) { return String(name || '').replace(/[\u0000-\u001f<>]/g, '').replace(/\s+/g, ' ').trim().slice(0, 16); }
function endpoint() { return String(config().supabaseUrl).replace(/\/+$/, '') + '/rest/v1/' + encodeURIComponent(config().table || 'scores'); }
function headers() {
  const key = config().supabaseKey, result = { apikey: key };
  // Las claves "anon" antiguas son JWT y también van como Bearer; las "publishable" nuevas, no.
  if (/^eyJ/.test(key)) result.Authorization = 'Bearer ' + key;
  return result;
}
// Lo que llega del servidor se normaliza antes de mostrarlo.
function normalize(entry) {
  if (!entry || typeof entry !== 'object' || !ID_PATTERN.test(String(entry.run_id || ''))) return null;
  return {
    run_id: String(entry.run_id), player_id: String(entry.player_id || ''), name: cleanName(entry.name) || 'Anónimo',
    character: Z.CHARACTERS.some(c => c.id === entry.character) ? entry.character : 'gero',
    level: Math.max(1, int(entry.level, 500)), kills: int(entry.kills, 1e5), bosses: int(entry.bosses, 1e4),
    play_time: int(entry.play_time, 1e7), updated_at: String(entry.updated_at || '')
  };
}
// Partidas borradas que todavía no se pudieron quitar del servidor (por ejemplo, sin conexión).
function pendingDeletes() { const list = readJson(DELETE_KEY, []); return Array.isArray(list) ? list.filter(id => ID_PATTERN.test(String(id))) : []; }
const SORTS = {
  level: (a, b) => b.level - a.level || b.kills - a.kills || b.bosses - a.bosses,
  kills: (a, b) => b.kills - a.kills || b.level - a.level,
  bosses: (a, b) => b.bosses - a.bosses || b.level - a.level || b.kills - a.kills
};
Z.Ranking = {
  online, SORTS,
  profile() {
    let profile = readJson(PROFILE_KEY, null);
    if (!profile || !ID_PATTERN.test(String(profile.id || ''))) { profile = { id: uid(), name: '' }; writeJson(PROFILE_KEY, profile); }
    return profile;
  },
  setName(name) { const profile = this.profile(); profile.name = cleanName(name); writeJson(PROFILE_KEY, profile); return profile.name; },
  entryFor(game) {
    const p = game.player; if (!ID_PATTERN.test(String(p.runId || ''))) p.runId = uid();
    const profile = this.profile();
    return normalize({ run_id: p.runId, player_id: profile.id, name: profile.name, character: p.characterId, level: p.level, kills: p.kills, bosses: p.bossKills, play_time: p.playTime, updated_at: new Date().toISOString() });
  },
  local() { const list = readJson(LOCAL_KEY, []); return Array.isArray(list) ? list.map(normalize).filter(Boolean) : []; },
  saveLocal(entry) { const list = this.local().filter(e => e.run_id !== entry.run_id); list.push(entry); writeJson(LOCAL_KEY, list.slice(-200)); },
  async remove(runId) {
    if (!ID_PATTERN.test(String(runId || ''))) return { online: online(), removed: false };
    writeJson(LOCAL_KEY, this.local().filter(e => e.run_id !== runId));
    if (!online()) return { online: false, removed: true };
    writeJson(DELETE_KEY, [...new Set([...pendingDeletes(), runId])].slice(-50));
    await this.flushDeletes();
    return { online: true, removed: true };
  },
  async flushDeletes() {
    for (const id of pendingDeletes()) {
      const response = await fetch(endpoint() + '?run_id=eq.' + encodeURIComponent(id), { method: 'DELETE', headers: { ...headers(), Prefer: 'return=minimal' } });
      if (!response.ok) throw new Error('el servidor respondió ' + response.status);
      writeJson(DELETE_KEY, pendingDeletes().filter(other => other !== id));
    }
  },
  async submit(game) {
    const entry = this.entryFor(game); this.saveLocal(entry);
    if (!online()) return { online: false, entry };
    this.flushDeletes().catch(() => {});
    const response = await fetch(endpoint() + '?on_conflict=run_id', {
      method: 'POST', body: JSON.stringify(entry),
      headers: { ...headers(), 'Content-Type': 'application/json', Prefer: 'resolution=merge-duplicates,return=minimal' }
    });
    if (!response.ok) throw new Error('el servidor respondió ' + response.status);
    return { online: true, entry };
  },
  async list(sort = 'level') {
    const order = { level: 'level.desc,kills.desc', kills: 'kills.desc,level.desc', bosses: 'bosses.desc,level.desc' }[sort] || 'level.desc';
    if (!online()) return { online: false, entries: this.local().sort(SORTS[sort] || SORTS.level) };
    const response = await fetch(endpoint() + '?select=run_id,player_id,name,character,level,kills,bosses,play_time,updated_at&order=' + order + '&limit=100', { headers: headers() });
    if (!response.ok) throw new Error('el servidor respondió ' + response.status);
    const data = await response.json(), hidden = new Set(pendingDeletes());
    return { online: true, entries: (Array.isArray(data) ? data : []).map(normalize).filter(entry => entry && !hidden.has(entry.run_id)).sort(SORTS[sort] || SORTS.level) };
  }
};
})();
