/* Pista del diario: hacia dónde queda el próximo objetivo sin cumplir.
   Si el objetivo está en otro nivel (la Cueva Profunda, Las Entrañas, la dimensión de Zak), apunta a la bajada,
   la subida o el portal que lleva hasta allá. No guarda nada: sale de los objetivos y del mapa. */
(function () {
'use strict';
const Z = window.Zak;
// La superficie (aldea, cueva, yuyos y cementerio) es un solo lugar; la dimensión de Zak, otro.
const SURFACE = {village: true, cave: true, weeds: true, altar: true};
const regionOf = biome => SURFACE[biome] ? 'surface' : Z.VIEW_ZONES[biome] ? 'realm' : biome;
// Un metro son 10 píxeles: más o menos lo que mide el personaje.
const METER = 10;
Z.GUIDE = {near: 60, meter: METER};

const P = Z.Game.prototype;
const center = o => ({x: o.x + (o.w || 0) / 2, y: o.y + (o.h || 0) / 2});
// Los lugares no se mueven: se buscan una vez por mapa (el mapa tiene miles de objetos y esto corre en cada cuadro).
P.guideObject = function (test, key) {
 const w = this.world; if (!w) return null;
 const cache = w.guideCache || (w.guideCache = {});
 if (key && key in cache) return cache[key];
 const o = w.objects.find(test), at = o ? center(o) : null;
 if (key) cache[key] = at;
 return at;
};
// Los pasos entre lugares: dónde está la bajada, la subida o el portal en cada lado.
P.guideLinks = function () {
 const stairs = (to, from, label) => { const at = this.guideObject(s => s.type === 'stairs' && s.to === to && regionOf(Z.biomeAt(s.x, s.y)) === from, 'stairs:' + from + '>' + to); return at ? {from, to: regionOf(to), ...at, label} : null; };
 const portal = this.guideObject(o => o.type === 'portal' && o.kind === 'altar', 'portal'), door = this.guideObject(o => o.type === 'door', 'door');
 // El portal verde del Santuario te deja en la plaza (kennel.js).
 const home = this.guideObject(o => o.type === 'portal' && o.kind === 'home', 'home');
 return [stairs('cave2', 'surface', 'la bajada'), stairs('cave', 'cave2', 'la subida'), stairs('cave3', 'cave2', 'la bajada'), stairs('cave2', 'cave3', 'la subida'),
  stairs('village', 'kennel', 'la salida de La guardería'),
  portal && {from: 'surface', to: 'realm', ...portal, label: 'el portal del altar'},
  home && {from: 'realm', to: 'surface', ...home, label: 'el portal verde a casa'},
  door && {from: 'realm', to: 'throne', ...door, label: 'la puerta del trono'}].filter(Boolean);
};
// El enemigo vivo de ese tipo más cercano; si no queda ninguno, donde aparece.
P.guideEnemy = function (types) {
 const p = this.player; let best = null, bestDistance = Infinity;
 for (const e of this.enemies || []) {
  if (!types.includes(e.type) || e.summoned) continue;
  const at = e.dead ? {x: e.homeX, y: e.homeY} : e, d = Math.hypot(at.x - p.x, at.y - p.y) + (regionOf(Z.biomeAt(at.x, at.y)) === regionOf(this.biome) ? 0 : 1e6);
  if (d < bestDistance) { best = at; bestDistance = d; }
 }
 return best && {x: best.x, y: best.y};
};
// Adónde lleva cada objetivo del diario. Los que no son un lugar (subir de nivel) no tienen flecha.
P.guideGoal = function (id) {
 const w = this.world, pickup = key => { const k = w.pickups.find(i => i.id === key); return k && !k.collected ? {x: k.x, y: k.y} : null; };
 const boss = type => { const at = this.guideEnemy([type]); return at && {...at, label: Z.ENEMY_TYPES[type].name}; };
 const arch = label => { const at = this.guideObject(o => o.type === 'arch' && o.label === label, 'arch:' + label); return at && {...at, label: label === 'LOS YUYOS' ? 'Los Yuyos' : 'la Cueva del Eco'}; };
 const forge = () => { const at = this.guideObject(o => o.type === 'forge', 'forge'); return at && {...at, label: 'el herrero de El Taller'}; };
 const place = (at, label) => at && {...at, label};
 switch (id) {
  case 'bow': return place(pickup('village-bow'), 'el arco');
  case 'cave': return arch('CUEVA DEL ECO');
  case 'stone': return place(pickup('cave-stone'), 'las piedras');
  case 'weeds': return arch('LOS YUYOS');
  case 'sword': return place(pickup('weeds-sword'), 'la espada');
  case 'shop': return place(this.guideObject(o => o.type === 'stall', 'stall'), 'El Almacén');
  case 'bestiary': {
   const type = ['thief', 'dog', 'snake', 'rat'].find(t => !this.questFlags['defeat_' + t]);
   return type ? place(this.guideEnemy([type]), Z.ENEMY_TYPES[type].name.toLowerCase()) : null;
  }
  case 'smith': case 'elemental': return forge();
  case 'deep': return place(this.guideObject(o => o.type === 'stairs' && o.to === 'cave2' && o.dir === 'down', 'deep'), 'la bajada a la Cueva Profunda');
  case 'deepest': return place(this.guideObject(o => o.type === 'stairs' && o.to === 'cave3', 'deepest'), 'la bajada a Las Entrañas');
  case 'altar': return place(this.guideObject(o => o.type === 'altar', 'altar'), 'el altar del cementerio');
  case 'capo': case 'yarara': case 'vampire': case 'golem': case 'cerbero': case 'archmage': case 'zak': return boss(id);
  default: return null;
 }
};
// El primer paso del camino hasta otro lugar (búsqueda en anchura sobre los pasos).
P.guideRoute = function (from, to) {
 if (from === to) return null;
 const links = this.guideLinks(), seen = new Set([from]), queue = [[from, null]];
 while (queue.length) {
  const [at, first] = queue.shift();
  for (const link of links) {
   if (link.from !== at || seen.has(link.to)) continue;
   const step = first || link;
   if (link.to === to) return step;
   seen.add(link.to); queue.push([link.to, step]);
  }
 }
 return null;
};
// {quest, label, x, y, distance, angle, near, via} o solo {quest} si no hay adónde apuntar; null si ya está todo.
P.guide = function () {
 if (!this.player || !this.world) return null;
 const quest = this.quests().find(q => !q.done);
 if (!quest) return null;
 const goal = this.guideGoal(quest.id);
 if (!goal) return {quest};
 const here = regionOf(this.biome), there = regionOf(Z.biomeAt(goal.x, goal.y));
 let target = goal, via = false;
 if (here !== there) {
  const step = this.guideRoute(here, there);
  if (!step) return {quest};
  target = step; via = true;
 }
 const p = this.player, dx = target.x - p.x, dy = target.y - p.y, distance = Math.hypot(dx, dy);
 return {quest, label: via ? target.label + ' (hacia ' + goal.label + ')' : goal.label, x: target.x, y: target.y, distance, meters: Math.round(distance / METER), angle: Math.atan2(dy, dx), near: distance < Z.GUIDE.near, via};
};
// Flechita de texto en ocho direcciones (la cámara no gira: arriba es el norte).
Z.guideArrow = angle => ['→', '↘', '↓', '↙', '←', '↖', '↑', '↗'][((Math.round(angle / (Math.PI / 4)) % 8) + 8) % 8];
})();
