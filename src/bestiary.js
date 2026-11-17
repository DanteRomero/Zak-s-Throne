/* Bestiario: una página por cada enemigo, con su mini historia y sus estadísticas (las de base y las de ahora).
   Una página se completa al vencer a ese enemigo; hasta entonces se ve su silueta. Cada página tiene, en el borde,
   una luna roja: su forma de la noche sangrienta, que se completa al vencerlo durante una luna roja. */
(function () {
'use strict';
const Z = window.Zak;
const finite = n => Number.isFinite(Number(n)) ? Number(n) : 0;
// `like`: cómo empieza la historia de su forma de luna roja («Es parecido al …»).
Z.BESTIARY = {
 thief: {like: 'al chorro', story: 'Antes de Zak, la Cueva del Eco era un atajo de los arrieros. Ahora es la oficina de los chorros: esperan en la oscuridad, te sacan la billetera y se ríen con el eco. No retroceden cuando les pegás, porque dicen que el que retrocede pierde el turno.'},
 dog: {like: 'al perro callejero', story: 'Eran los perros de la aldea, hasta que el humo del altar los volvió desconfiados. Muerden las piernas para que no los sigas. Si les das de comer no te lo agradecen... salvo uno, que todavía espera con el plato vacío.'},
 snake: {like: 'a la serpiente', story: 'Hijas de la Yarará Madre. Se esconden entre los yuyos y esperan que pises cerca. Su veneno no entiende de armaduras: entra igual, y quema despacito.'},
 rat: {like: 'a la rata', story: 'Viven de lo que se cae en la Cueva del Eco. Son tantas que nadie las cuenta. Se te prenden del cuerpo, muerden un rato y saltan para tomar carrera. No son peligrosas: son insoportables.'},
 bat: {like: 'al murciélago', story: 'Cuelgan del techo de la Cueva Profunda y bajan en zigzag apenas olés a sangre. Dicen que son los ojos del Chupasangre: todo lo que ven, él lo sabe.'},
 spider: {like: 'a la araña', story: 'Tejen en los rincones más húmedos de la Cueva Profunda. Su caparazón aguanta golpes de madera como si nada; con hierro, la cosa cambia. Algunos mineros juran que tejen mapas.'},
 worm: {like: 'al gusano de tierra', story: 'Duerme enterrado en Las Entrañas y sale cuando siente pasos encima. Es puro músculo y tierra: blindado, pesado, y con hambre de siglos. Los mineros lo llaman «el que no se ve».'},
 skeleton: {like: 'al esqueleto con escudo', story: 'Soldados que juraron cuidar el cementerio aun después de muertos, y Zak les tomó la palabra. Caminan lento, pero cuando pegan, pegan. El escudo lo siguen usando por costumbre.'},
 archer: {like: 'al esqueleto arquero', story: 'Los arqueros del mismo regimiento. No les quedó carne, pero sí la puntería. Se mantienen lejos, tiran fuerte y se desarman de un solo golpe: lo saben, por eso no se acercan.'},
 mage: {like: 'al mago', story: 'Aprendices del Rey Mago que nunca terminaron la escuela. Conjuran bolas de fuego quietos como estatuas, porque moverse y conjurar a la vez no se lo enseñaron.'},
 armor: {like: 'a la armadura viviente', story: 'Nadie sabe quién la usaba. Ahora está vacía, y Zak la llena con su voluntad. Es lentísima, pero cuando levanta la espada y gira, no queda nada en pie alrededor.'},
 book: {like: 'al libro volador', story: 'Los libros de la Biblioteca del Rey Mago se cansaron de que nadie los leyera y salieron a buscar lectores. Andan de a cuatro y pican con las hojas. Mejor no preguntarles el final.'},
 imp: {like: 'al duende ilusionista', story: 'Un bromista del Pueblo Mágico que aprendió a partirse en tres. Dos son mentira y uno es verdad, como en todo buen chisme. Si le pegás al equivocado, se ríe de vos en las tres versiones.'},
 gargoyle: {like: 'a la gárgola', story: 'Durante el día finge ser decoración del patio. Mientras es de piedra no le entra nada; si pasás cerca, se despierta con mal humor, vuela alto y se tira en picada.'},
 shadow: {like: 'a la sombra de Zak', story: 'Un pedazo de Zak que se le escapó y aprendió a imitar. Copia tus ataques con un poco de demora y atraviesa paredes. Lo único que no copia es el miedo.'},
 mimic: {like: 'al mimic', story: 'Un cofre que se cansó de que lo abrieran y empezó a morder. Se esconde en las carpas del Pueblo Mágico entre cofres de verdad. Adentro tiene guita... la de los que no se dieron cuenta.'},
 capo: {like: 'al Capo del Eco', story: 'El jefe de los chorros de la Cueva del Eco. Anteojos negros, cuchillos en todos los bolsillos y una regla: nadie baja a la Cueva Profunda sin pagarle peaje. Cuando se planta, llueven cuchillos.'},
 yarara: {like: 'a la Yarará Madre', story: 'La madre de todas las serpientes de Los Yuyos. Cuida su nido como solo una madre puede: a los colazos y escupiendo veneno. Algunos de sus huevos esconden una viborita distinta, más mansa.'},
 vampire: {like: 'al Chupasangre', story: 'Custodia la bajada a Las Entrañas desde antes de que existiera la aldea. Se alimenta de los que se pierden en la Cueva Profunda, y cuando se cansa, llama a sus murciélagos.'},
 golem: {like: 'al Gólem Minero', story: 'Los mineros lo armaron para que cavara por ellos, piedra sobre piedra. Cavó tanto que encontró hierro, oro y diamante, y se los puso encima. Ahora la mina es suya y tiene cuatro vidas para defenderla.'},
 cerbero: {like: 'a Cerbero', story: 'Tres cabezas y ninguna con piedad. Cuida el altar del gobernante y no deja que nadie se acerque a la puerta de la otra dimensión. Si lo dejás escarbar tranquilo, se cura entero.'},
 archmage: {like: 'al Rey Mago', story: 'Fue el mago más grande de este mundo, hasta que conoció a Zak y aceptó ser el segundo. Guarda la puerta del trono y su biblioteca. Se teletransporta, cura, invoca y congela: le sobra magia y le falta humildad.'},
 zak: {like: 'a Zak', story: 'Zak es el creador de este mundo y de todas las dimensiones alternas. Todo lo que pisás, todo lo que respira y todo lo que te ataca existe porque él quiso. Es el ser que está por encima de todos: se sienta en su trono a mirar, y cuando alguien llega hasta él, se levanta con la Espada del Caos solo por curiosidad.'}
};
Z.BESTIARY_ORDER = ['rat', 'thief', 'dog', 'snake', 'bat', 'spider', 'worm', 'skeleton', 'archer', 'capo', 'yarara', 'vampire', 'golem', 'cerbero', 'mage', 'armor', 'book', 'imp', 'gargoyle', 'shadow', 'mimic', 'archmage', 'zak'];
// La historia de la forma de luna roja: la misma, con un principio y un final propios.
Z.moonStory = (type, title) => 'Es parecido ' + Z.BESTIARY[type].like + ' normal. ' + Z.BESTIARY[type].story + ' Bajo la luna roja es mucho más salvaje y fuerte: no siente dolor, no tiene apuro en morirse y ve en la oscuridad con sus ojos rojos.';

const baseCreate = Z.createPlayer;
Z.createPlayer = function (id) { return Object.assign(baseCreate(id), {bestiary: {}, moonKills: {}}); };
const P = Z.Game.prototype;
Object.assign(P, {
 // Una página se completa al vencer a ese enemigo alguna vez (las partidas de antes ya lo tenían anotado).
 bestiaryKnown(type) { return !!this.questFlags['defeat_' + type] || finite(this.player.bestiary && this.player.bestiary[type]) > 0; },
 bestiaryMoon(type) { return finite(this.player.moonKills && this.player.moonKills[type]) > 0; },
 bestiaryKills(type) { return finite(this.player.bestiary && this.player.bestiary[type]); },
 // Estadísticas para la página: de base (nivel 1) y las de ahora (tu nivel), con o sin luna roja.
 bestiaryStats(type, moon = false) {
  const pack = s => { if (moon) Z.applyBloodMoon(s); return {health: Math.round(s.maxHealth), strength: Math.round(s.strength * 10) / 10, speed: Math.round(s.moveSpeed), armor: Math.round(s.armor * 10) / 10, poison: s.poison ? Math.round(s.poison * 10) / 10 : 0, xp: Math.round(s.xp)}; };
  return {base: pack(Z.enemyStats(type, 1)), now: pack(Z.enemyStats(type, this.player.level)), level: this.player.level};
 }
});
const baseKill = P.onKill, baseRestore = P.restoreInventory;
P.onKill = function (e) {
 const r = baseKill.call(this, e), p = this.player;
 if (Z.BESTIARY[e.type] && !e.illusion) {
  p.bestiary = p.bestiary || {}; p.bestiary[e.type] = finite(p.bestiary[e.type]) + 1;
  if (e.stats && e.stats.bloodMoon) {
   p.moonKills = p.moonKills || {}; const first = !p.moonKills[e.type]; p.moonKills[e.type] = finite(p.moonKills[e.type]) + 1;
   if (first) this.emit('toast', {message: '📖 Bestiario: se completó la página de luna roja de ' + Z.ENEMY_TYPES[e.type].name + '.'});
  }
 }
 return r;
};
const counts = src => { const out = {}; if (src && typeof src === 'object') for (const k of Object.keys(src)) if (Z.BESTIARY[k]) { const n = Math.floor(finite(src[k])); if (n > 0) out[k] = Math.min(1e7, n); } return out; };
P.restoreInventory = function (p, source) { baseRestore.call(this, p, source); p.bestiary = counts(source.bestiary); p.moonKills = counts(source.moonKills); };
})();
