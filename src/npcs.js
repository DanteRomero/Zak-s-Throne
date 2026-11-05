/* Vecinos y animales de Palihue City: quién es cada uno, dónde anda, cómo se ve y qué dice.
   Los diálogos no se guardan: la partida no cambia de formato. */
(function(){
'use strict';
const Z=window.Zak=window.Zak||{};
// Tonos de piel: color y sombra.
const PALE={skin:'#ecc39a',skinShade:'#c99a72'},LIGHT={skin:'#d9a476',skinShade:'#b47c55'},TAN={skin:'#bf8861',skinShade:'#946547'},BROWN={skin:'#9c6a46',skinShade:'#7a4f33'};
const top=(top,topShade,topLight)=>({top,topShade,topLight});
const pants=(legs,legsShade)=>({legs,legsShade}),skirt=(legs,legsShade)=>({legs,legsShade,skirt:true});
// Los seis vecinos de siempre conservan su lugar (ver createWorld): acá solo se visten y hablan.
const PEOPLE=[
 {name:'Don Ramón',look:{...TAN,...top('#8a6d4f','#5f4a36','#a98b68'),...pants('#4b4640','#37332e'),hair:'#d9d6cc',hairStyle:'short',hat:'boina',hatColor:'#2b2b33',mustache:'#e4e1d8',plaid:'#5f4a36',cane:true},lines:[
  'En mis tiempos, con dos mangos te comprabas una casa y te sobraba para el asado.',
  'Cobro la jubilación y el día 3 ya estoy seco. Por eso vengo a la plaza: ver pasar gente es gratis.',
  '¿Vos sos de acá? Porque a tu abuelo lo conocí. Un caradura bárbaro.']},
 {name:'Clara',roam:[50,45],look:{...PALE,...top('#f2efe4','#c8c5b6','#ffffff'),...skirt('#f2efe4','#c8c5b6'),shoe:'#3a2c26',hair:'#6b4a2e',hairStyle:'bun',glasses:'#3b3532',tie:'#3f6d9c'},lines:[
  'Soy la seño de la escuelita. ¿Hiciste la tarea? No me digas nada, te miro y ya sé.',
  'Si vas para Los Yuyos, llevá hierbas: curan el veneno. Y la víbora no te avisa, querido.',
  'No se corre en la plaza, nene. Bueno, corré, pero después no me vengas llorando.']},
 {name:'Juli',look:{...LIGHT,...top('#2f2f38','#1f1f26','#4a4a57'),...pants('#3f597a','#2f4460'),shoe:'#d8d4c8',hair:'#c2562c',hairStyle:'long',pack:'#7a3f6d',print:'#e7be72'},lines:[
  'Che, ¿tenés señal? Acá no agarra ni para mandar un audio de cuatro minutos.',
  'Estoy juntando guita para irme al recital. Si ves a alguien vendiendo entradas, me chiflás.',
  'Ni en pedo voy a la cueva, boludo. Hay perros, chorros y un tipo al que le dicen el Capo.']},
 {name:'Beto',look:{...TAN,...top('#2f5fa8','#234a85','#4b7cc8'),...pants('#2f5fa8','#234a85'),shoe:'#e8e4d8',hair:'#3a2c22',hairStyle:'bald',whistle:true,stripe:'#f1ede0',mustache:'#3a2c22'},lines:[
  '¡Vamos, vamos, arriba esas rodillas! Mis clases se pagan en El Almacén, ¿eh? Te dejo hecho un fierro.',
  'Rodar te salva la vida, campeón. Una rata prendida se saca rodando, no llorando.',
  'Yo a tu edad hacía cien abdominales por día. Bueno, diez. Pero bien hechas.']},
 {name:'Lola',look:{...PALE,...top('#c9477f','#9c3462','#e36a9c'),...skirt('#c9477f','#9c3462'),shoe:'#7a2c50',hair:'#e8c75a',hairStyle:'curly',earrings:'#f4cc73'},lines:[
  'Vení que te emparejo esas puntas. Así no podés andar por la vida, corazón.',
  'En mi peluquería se sabe todo antes que en la radio. Todo.',
  'Ese corte te lo hiciste vos, ¿no? Se nota, mi amor. Se nota.']},
 {name:'Nico',look:{...LIGHT,...top('#f4f4f0','#c9c9c2','#ffffff'),...pants('#23314f','#1a2540'),shoe:'#d8d4c8',hair:'#2b211b',hairStyle:'short',stripes:'#79b4e0',shorts:true,kid:true,ball:true},lines:[
  '¿Jugamos un picadito? Falta uno. Vos vas al arco.',
  'Cuando sea grande voy a jugar en Primera. O voy a ser herrero. O las dos.',
  '¡La pelota es mía! Si me enojo, me la llevo y se termina el partido.']},
 // Vecinos nuevos.
 {name:'Doña Rosa',x:885,y:955,roam:[12,8],rest:[4,10],speed:14,look:{...PALE,...top('#6d8fb0','#4f6d8a','#8aa9c7'),...skirt('#6d8fb0','#4f6d8a'),shoe:'#3a2c26',hair:'#cfcac0',hairStyle:'bun',apron:'#efe6cf',flowers:'#d9708a'},lines:[
  '¡Ay, nene, estás en los huesos! Pasá que hay empanadas. Y llevate unas para el camino.',
  '¿No vas a tomar nada? Mirá que no es molestia. Sentate, sentate.',
  'Abrigate, que refresca. Sí, ya sé que hace calor. Abrigate igual.']},
 {name:'Tito',x:668,y:1208,roam:[10,6],rest:[4,9],speed:14,label:'Hablar con Tito, el almacenero',look:{...TAN,...top('#6a7f5a','#4e5f42','#869c74'),...pants('#3b3a36','#2a2926'),hair:'#2b2622',hairStyle:'short',apron:'#f0ebdc',mustache:'#2b2622',fat:1},lines:[
  'Fiado no, pibe. Mirá el cartel: «Hoy no se fía, mañana sí». Y mañana el cartel dice lo mismo.',
  'Si encontrás esas cosas raras de los jefes, traémelas, que te las compro. No preguntes para qué.',
  'El mate cebado de acá te pone las pilas. Seis mangos y salís corriendo.']},
 {name:'Rulo',x:900,y:1302,roam:[120,8],rest:[1,4],speed:26,label:'Hablar con Rulo, el cartero',look:{...LIGHT,...top('#d6b34a','#a88a33','#ecd070'),...pants('#34466a','#27354f'),hair:'#3a2c22',hairStyle:'curly',hat:'cap',hatColor:'#34466a',bag:'#7a5634'},lines:[
  'Hace dos años que traigo una carta para un tal Zak. No abre nadie y no tiene timbre.',
  '¿Sabés hace cuánto que no me pagan el presentismo? Yo tampoco.',
  'Dicen que perro que ladra no muerde. Se nota que nunca repartieron cartas.']},
 {name:'Cacho',x:660,y:1012,roam:[28,22],rest:[3,8],speed:16,label:'Hablar con Cacho, el intendente',look:{...PALE,...top('#50545c','#3a3d43','#6a6f78'),...pants('#50545c','#3a3d43'),shoe:'#1d1b1a',hair:'#8f8a80',hairStyle:'short',tie:'#b5383f',sash:'#79b4e0',fat:2},lines:[
  '¡Vecino! Cacho, su intendente. El pozo lo arreglo yo, tiene mi palabra. Después de las elecciones.',
  'Lo de la Cueva del Eco es un tema que estamos evaluando. Ya armamos una comisión.',
  'Acá se hizo mucho, ¿eh? Mucho. No me preguntes qué.']},
 {name:'Mirta',x:925,y:1046,roam:[20,12],rest:[3,8],speed:15,label:'Hablar con Mirta, la chusma',look:{...LIGHT,...top('#8ec2c9','#6a9ba2','#aedbe0'),...skirt('#8ec2c9','#6a9ba2'),shoe:'#d97fa0',hair:'#7a4a2c',hairStyle:'short',rollers:'#e88fb0'},lines:[
  '¿Viste lo de la del Molino? No, no, yo no digo nada. Pero bueno, vos sabrás.',
  'Yo no soy chusma, ¿eh? Me entero, que es distinto.',
  'Dicen que con luna roja los bichos se ponen como locos, pero dan el doble de guita. Yo no dije nada.']},
 {name:'Carmelo',x:575,y:705,roam:[35,8],rest:[2,6],label:'Hablar con el Tano Carmelo',look:{...TAN,...top('#f4f1e6','#c8c5b6','#ffffff'),...pants('#3b3a36','#2a2926'),hair:'#2b2622',hairStyle:'short',hat:'chef',mustache:'#2b2622',apron:'#b5383f',fat:1},lines:[
  'La muzza no se negocia, ¿me entendés? Con la fainá arriba y a otra cosa.',
  '¡Mamma mia! Comé algo, flaco. Con esa cara no le ganás ni a una rata.',
  'Mi nonno vino en barco con una valija y una receta. La valija la perdió.']},
 {name:'Facu',x:835,y:705,roam:[30,10],rest:[2,6],look:{...PALE,...top('#6c7079','#50535a','#858993'),...pants('#2f3a4a','#222b38'),shoe:'#d8d4c8',hair:'#3f2f25',hairStyle:'short',glasses:'#22252a',beard:'#3f2f25',hood:true,laptop:true},lines:[
  'Estoy laburando remoto, boludo. Pero el wifi llega hasta el pozo nomás.',
  'Largué todo para venirme a vivir al campo. Ahora extraño el delivery.',
  '¿Vos también sos de sistemas? Tenés cara de haber reiniciado algo alguna vez.']},
 {name:'Sor Inés',x:92,y:1030,roam:[25,15],rest:[3,8],speed:14,look:{...PALE,...top('#26252c','#17161b','#3a3943'),...skirt('#26252c','#17161b'),shoe:'#17161b',hair:'#26252c',hairStyle:'none',hat:'veil',cross:true},lines:[
  'Dios te bendiga, hijo. Y conseguite una antorcha, que la fe no alumbra las cuevas.',
  'Del cementerio para allá rezo el doble. Por las dudas y por los esqueletos.',
  'Te escuché lo que dijiste cuando se te cayó la piedra, ¿eh? Te escuché.']},
 {name:'Cabo Funes',x:760,y:590,roam:[12,22],rest:[3,8],speed:16,look:{...TAN,...top('#2c3f63','#1f2e4a','#41598a'),...pants('#2c3f63','#1f2e4a'),shoe:'#17161b',hair:'#2b2622',hairStyle:'short',hat:'police',badge:true,mustache:'#2b2622'},lines:[
  'Ya tomamos la denuncia del chorro. Pero hoy no salimos, que el patrullero no tiene nafta.',
  'Circule, circule. Más para allá está la Cueva del Eco, y ahí no me hago cargo.',
  '¿Documentos? Dale, es un chiste. ¿Tenés para un cafecito, igual?']},
 {name:'Don Chiche',x:1168,y:1026,static:true,dir:'left',label:'Hablar con Don Chiche, el pescador',look:{...BROWN,...top('#5f7a55','#46593f','#7a966f'),...pants('#6d5a43','#524332'),hair:'#d9d6cc',hairStyle:'short',hat:'piluso',hatColor:'#c9b98c',beard:'#d9d6cc',rod:true},lines:[
  'Hace tres días que no pica nada. Pero mirá qué paz, che.',
  'Ayer saqué uno así de grande. Testigos no hay, pero era así.',
  'Shhh. Me espantás las libélulas. Y a los pescados, si hubiera.']}
];
// El gaucho toma mate al costado del camino a Los Yuyos, con su caballo.
const GAUCHO={id:'gaucho',kind:'gaucho',name:'El Gaucho',label:'Hablar con el gaucho',x:1283,y:975,static:true,radius:11,tag:45,lines:[
 'Como me gustaría que haya un lugar pa jugar al truco... será que se arme algún torneito. *ruido de mate*',
 'Este es Malacara. Flaco, mañero y más terco que mi suegra. Lo quiero como a un hijo.',
 'Despacito, amigo, que la vida no se apura. Y el agua que no hierva, ¿eh?']};
const SPECIES={
 horse:{verb:'Acariciar a',radius:12,tag:45,speed:11,roam:[22,14],rest:[6,15],voice:'neigh',lines:[
  '*resopla* Te mira de reojo y sigue masticando, como si le debieras plata.',
  '*relincha* Mueve las orejas. No te da bola, pero con mucha elegancia.',
  '*te huele los bolsillos* Buscaba azúcar. No traés. Decepción total.']},
 chicken:{verb:'Saludar a',radius:5,tag:19,speed:24,roam:[28,22],rest:[.5,3],voice:'cluck',lines:[
  '¡Cocó! *te mira con un ojo, después con el otro, y no le cierra ninguno*',
  '¡Cooo-co-co-có! *sale corriendo sin motivo, frena y se olvida por qué*',
  '*picotea el piso* Tiene una agenda muy apretada.'],
  linesFor:{pepe:['*se queda dura* Sos un pollo como ella, pero algo en tu mirada le da miedo.','¡Cocó! *te hace una reverencia y da tres pasos para atrás, sin darte la espalda*']}},
 cat:{verb:'Acariciar a',radius:6,tag:20,speed:18,roam:[30,20],rest:[4,14],voice:'meow',lines:[
  '*te mira, bosteza y se da vuelta* Miau.',
  'Mrrrau. *se deja acariciar tres segundos exactos y te muerde, con cariño*',
  '*ronronea* Felicitaciones: ahora sos de su propiedad.']},
 dog:{verb:'Acariciar a',radius:7,tag:24,speed:34,roam:[45,30],rest:[1,5],voice:'woof',lines:[
  '¡Guau! *te trae un palo, pero no te lo quiere dar*',
  '¡Guau, guau! *mueve la cola tan fuerte que se mueve el perro entero*',
  '*te olfatea* Olés a los perros de la cueva. Te perdona igual.']}
};
const COATS={
 malacara:{coat:'#7a4a2b',shade:'#5a3620',light:'#96603a',mane:'#2a1c14',blaze:true},
 zaino:{coat:'#4a2f22',shade:'#352118',light:'#60402f',mane:'#17110e'},
 moro:{coat:'#6f7680',shade:'#535962',light:'#8d949e',mane:'#2b2e33',dapple:'#9aa1aa'},
 white:{coat:'#f0ead8',shade:'#c9c1a8',light:'#ffffff'},red:{coat:'#b5592f',shade:'#8a4322',light:'#d07a48'},black:{coat:'#3a3633',shade:'#262422',light:'#55504b'},gold:{coat:'#c99a4a',shade:'#a07a36',light:'#e0b868'},
 orange:{coat:'#d98a3a',shade:'#b06a28',light:'#eba95c',tabby:'#a85f22'},snow:{coat:'#ece7da',shade:'#c4bdac',light:'#ffffff'},soot:{coat:'#2b2a30',shade:'#1c1b20',light:'#403f47',eyes:'#d8c64a'},
 caramel:{coat:'#c98f4e',shade:'#a06f38',light:'#e0ad70',collar:'#b5383f'},spot:{coat:'#ece6d6',shade:'#c6bea8',light:'#ffffff',patch:'#4a3324',collar:'#3f6d9c'},negro:{coat:'#3a3330',shade:'#272220',light:'#544b47',collar:'#d6b34a',muzzle:'#8a6a4a'}
};
const ANIMALS=[
 ['horse','Malacara',1330,972,'malacara',{static:true,faceLeft:true,saddle:true,tied:true}],
 ['horse','Zaino',1250,1250,'zaino'],['horse','Moro',1306,1248,'moro',{faceLeft:true}],
 ['chicken','Turuleca',690,1238,'white'],['chicken','Cocó',722,1252,'red'],['chicken','La Pocha',700,1272,'gold'],['chicken','Clotilde',660,1362,'black'],['chicken','La Colorada',692,1386,'red'],
 ['cat','Michi',1045,1205,'orange'],['cat','Pelusa',672,978,'snow',{faceLeft:true}],['cat','Morocho',122,1078,'soot'],
 ['dog','Chicho',800,1062,'caramel'],['dog','Pirata',470,1032,'spot',{roam:[60,18]}],['dog','El Negro',905,742,'negro',{faceLeft:true,roam:[40,28]}]
];
// Corral de los caballos, con la entrada del lado del camino.
const CORRAL={x:1210,y:1205,w:130,h:80,gate:1280};
Z.NPC_SPECIES=SPECIES;
Z.addVillagers=function(world,object){
 const fresh=(id,n)=>({id,x:n.x,y:n.y,homeX:n.x,homeY:n.y,targetX:n.x,targetY:n.y,dir:'down',walk:0,moving:false,wait:1+world.npcs.length*.17,...n});
 PEOPLE.forEach((person,i)=>{
  const old=world.npcs.find(n=>n.name===person.name);
  if(old)Object.assign(old,person,{label:person.label||'Hablar con '+person.name});
  else world.npcs.push(fresh('villager-'+i,{...person,label:person.label||'Hablar con '+person.name}));
 });
 world.npcs.push(fresh('gaucho',GAUCHO));
 ANIMALS.forEach(([species,name,x,y,coat,extra],i)=>{const S=SPECIES[species];world.npcs.push(fresh('animal-'+i,{kind:species,species,name,label:S.verb+' '+name,x,y,radius:S.radius,tag:S.tag,speed:S.speed,roam:S.roam,rest:S.rest,voice:S.voice,lines:S.lines,linesFor:S.linesFor,coat:COATS[coat],said:i,...extra}));});
 const{x,y,w,h,gate}=CORRAL;
 for(let fx=x;fx<x+w;fx+=35){object('fence',fx,y+h,30,8,true,{variant:0});if(fx<gate-5||fx>gate+5)object('fence',fx,y,30,8,true,{variant:0});}
 for(let fy=y+8;fy<y+h;fy+=34){object('fence',x,fy,9,27,true,{variant:2});object('fence',x+w-5,fy,9,27,true,{variant:2});}
};
})();
