/* Mapa original, determinista y sin recursos externos. Las coordenadas son píxeles del mundo. */
(function(){
'use strict';
const Z=window.Zak=window.Zak||{};
Z.biomeAt=function(x,y){return x<1000&&y<520?'cave':x>=1550?'weeds':'village';};
Z.createWorld=function(){
 const world={width:2400,height:1800,spawn:{x:770,y:960},zones:[
  {id:'village',x:0,y:0,w:1550,h:1800,name:'Aldea de los Aromos'},
  {id:'weeds',x:1550,y:0,w:850,h:1800,name:'Los Yuyos'},
  {id:'cave',x:0,y:0,w:1000,h:520,name:'Cueva del Eco'}
 ],objects:[],npcs:[],pickups:[],enemySpawns:[],paths:[]};
 let serial=0,seed=1873;
 const random=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;};
 const object=(type,x,y,w,h,solid=true,extra={})=>{const o={id:'object-'+serial++,type,x,y,w,h,solid,...extra};world.objects.push(o);return o;};
 const path=(x,y,w,h,material='dirt')=>world.paths.push({x,y,w,h,material});
 const pickup=(id,type,x,y,label)=>world.pickups.push({id,type,x,y,collected:false,label});
 // La plaza conecta los tres destinos. Ninguna decoración sólida corta estos caminos.
 path(744,480,54,1160);path(370,998,1560,64);path(665,908,215,206,'stone');
 path(445,1280,710,45);path(443,640,46,680);path(1100,690,46,630);
 path(380,680,765,40);path(737,70,70,450,'cave');path(150,330,680,42,'cave');path(280,160,520,35,'cave');
 path(1640,1010,54,515);path(1650,1460,555,34);path(1945,550,38,995);
 // Ocho viviendas: tejas, patios y acceso claro a la calle.
 const houses=[
  [555,875,92,54,0,'Casa del Ceibo'],[898,878,102,58,1,'La casa de Doña Rosa'],
  [548,1128,97,57,2,'El Almacén'],[922,1137,91,55,3,'Los Tilos'],
  [523,628,93,57,1,'El Molino'],[891,634,99,55,0,'Casa de los Amigos'],
  [505,1379,101,56,3,'La Querencia'],[918,1390,97,55,2,'El Taller']
 ];
 houses.forEach(([x,y,w,h,variant,label])=>{
  object('house',x,y,w,h,true,{variant,label});
  const road=y<800?718:y<1050?998:y<1300?1280:1490;
  if(road>=y+h)path(x+w/2-13,y+h,26,road-y-h+16);
  else path(x+w+2,y+20,30,Math.max(20,1325-y));
  for(let k=0;k<6;k++)object('flower',x-10+k*20,y+h+9,4,5,false,{variant:k%4});
  object('crate',x+w+8,y+h-18,15,14,true,{variant:variant%2});
 });
 object('stall',620,1198,36,16,true,{label:'Comprar en El Almacén'});
 object('well',837,946,27,23,true,{label:'Recuperar vida en el pozo',text:'El agua de Los Aromos siempre te devuelve las ganas.'});
 object('pond',1000,975,150,115,true,{variant:0,label:'Laguna de las Libélulas'});
 object('pond',235,1165,146,112,true,{variant:1});
 object('pond',1200,1440,146,100,true,{variant:0});
 object('bench',682,949,34,14,true);object('bench',822,1080,36,13,true,{variant:1});
 object('bench',963,1095,35,13,true,{variant:0});
 object('tree',988,947,20,16,true,{variant:0});object('tree',1051,928,21,17,true,{variant:2});
 object('tree',935,960,19,16,true,{variant:1});object('tree',632,1040,21,17,true,{variant:2});
 object('tree',865,850,21,18,true,{variant:0});object('tree',1090,880,24,19,true,{variant:1});
 object('tree',670,1143,21,17,true,{variant:1});object('tree',869,1160,22,17,true,{variant:0});
 object('tree',965,1215,23,18,true,{variant:2});object('tree',492,941,21,17,true,{variant:1});
 // Paredes de piedra delimitan la cueva; el portal conserva una entrada amplia.
 object('cliff',18,502,696,22,true);object('cliff',824,502,176,22,true);
 object('cliff',981,18,19,480,true,{variant:1});
 [[79,94],[414,93],[926,78],[960,418],[460,469],[215,473],[115,213],[900,264]].forEach(([x,y],i)=>object('crystal',x,y,12,10,false,{variant:i%3}));
 // Señales y arcos: el jugador descubre cada zona caminando, sin pantallas de carga.
 object('sign',816,810,16,12,true,{label:'Leer el cartel',text:'↑ Cueva del Eco · Chorros y perros. → Los Yuyos · Ojo con las víboras. La aldea siempre es segura.'});
 object('sign',1404,978,16,12,true,{label:'Leer el cartel de Los Yuyos',text:'LOS YUYOS → Pasto alto, ratas y serpientes. Dicen que hay una espada cerca del camino.'});
 object('sign',808,540,16,12,true,{label:'Leer el cartel de la cueva',text:'CUEVA DEL ECO ↑ Llevá un arma y mirá tu energía. Los bichos no cruzan hacia la aldea.'});
 object('sign',726,1175,16,12,true,{label:'Leer el cartel del pozo',text:'El pozo de la plaza restaura vida y energía. Las hierbas medicinales también curan el veneno.'});
 object('arch',713,542,106,14,false,{label:'CUEVA DEL ECO',variant:1});
 object('arch',1527,1072,66,13,false,{label:'LOS YUYOS',variant:0});
 for(const [x,y] of [[717,931],[887,1090],[801,598],[714,441],[811,261],[390,366],[1049,956],[1420,1020],[462,1270],[798,1460]])object('lantern',x,y,8,9,true);
 for(let x=346;x<646;x+=35)object('fence',x,1085,30,8,true,{variant:0});
 for(let x=875;x<1080;x+=35)object('fence',x,1246,30,8,true,{variant:1});
 for(let y=1100;y<1450;y+=34)object('fence',1516,y,9,27,true,{variant:2});
 for(let y=638;y<950;y+=34)object('fence',1516,y,9,27,true,{variant:2});
 pickup('village-bow','bow',820,1030,'Recoger el arco');
 pickup('cave-stone','stone',750,450,'Recoger piedras');
 pickup('weeds-sword','sword',1710,1030,'Recoger la espada');
 [[698,1117],[1153,793],[1350,1230],[795,570],[684,472],[918,386],[1790,1120],[1930,745],[2250,1495],[1900,1350]].forEach(([x,y],i)=>pickup('herb-'+i,'herb',x,y,'Recoger hierba medicinal'));
 [[740,1080,0,'Don Ramón'],[699,894,1,'Clara'],[885,1000,2,'Juli'],[1061,1130,3,'Beto'],[562,1028,0,'Lola'],[801,1201,1,'Nico']].forEach(([x,y,variant,name],i)=>world.npcs.push({id:'neighbor-'+i,x,y,homeX:x,homeY:y,targetX:x,targetY:y,dir:'down',variant,name,walk:0,moving:false,wait:1+i*.7}));
 const enemy=(type,x,y)=>world.enemySpawns.push({id:type+'-'+world.enemySpawns.length,type,x,y});
 [[340,170],[570,180],[840,175],[370,395]].forEach(([x,y])=>enemy('thief',x,y));
 [[220,300],[555,390],[840,310],[170,140]].forEach(([x,y])=>enemy('dog',x,y));
 [[1850,850],[2180,680],[1760,1380],[2180,1420]].forEach(([x,y])=>enemy('snake',x,y));
 [[1840,1150],[2060,980],[2240,1180],[2030,1520]].forEach(([x,y])=>enemy('rat',x,y));
 // Guaridas de los jefes: el fondo de la cueva y el rincón más alto de Los Yuyos.
 enemy('capo',125,430);enemy('yarara',2170,265);
 object('throne',108,384,34,26,false);object('nest',2142,262,46,18,false);
 const rectNear=(a,b,pad=0)=>a.x<b.x+b.w+pad&&a.x+a.w>b.x-pad&&a.y<b.y+b.h+pad&&a.y+a.h>b.y-pad;
 const clearFor=o=>{
  if(world.paths.some(p=>rectNear(o,p,15)))return false;
  if(world.objects.some(p=>p.solid&&rectNear(o,p,17)))return false;
  if([...world.pickups,...world.enemySpawns,...world.npcs,world.spawn].some(p=>p.x>o.x-40&&p.x<o.x+o.w+40&&p.y>o.y-40&&p.y<o.y+o.h+40))return false;
  return true;
 };
 // Detalle sembrado: cada partida comparte lugares, armas y rutas reconocibles.
 for(let i=0;i<430;i++){
  const x=45+Math.floor(random()*2310),y=50+Math.floor(random()*1680),zone=Z.biomeAt(x,y);
  const type=zone==='cave'?'rock':zone==='weeds'?(random()<.6?'shrub':'tree'):(random()<.76?'tree':'shrub');
  const o={x,y,w:type==='rock'?24:20,h:type==='rock'?18:16};
  if(clearFor(o))object(type,x,y,o.w,o.h,true,{variant:Math.floor(random()*4)});
 }
 // Rocas del techo y bosque exterior cierran visualmente los bordes del mapa.
 for(let x=20;x<2370;x+=45){
  const top={x,y:18,w:24,h:18},bottom={x,y:1760,w:22,h:17};
  if(clearFor(top))object(x<1000?'rock':'tree',x,18,24,18,true,{variant:x%3});
  if(clearFor(bottom))object('tree',x,1760,22,17,true,{variant:x%3});
 }
 for(let y=75;y<1760;y+=45){
  object(y<520?'rock':'tree',17,y,22,18,true,{variant:y%3});object('tree',2361,y,23,18,true,{variant:y%3});
 }
 for(let i=0;i<130;i++){
  const x=400+Math.floor(random()*1060),y=560+Math.floor(random()*1110);
  if(!world.objects.some(o=>o.solid&&x>o.x-7&&x<o.x+o.w+7&&y>o.y-7&&y<o.y+o.h+7)&&!world.paths.some(o=>x>o.x&&x<o.x+o.w&&y>o.y&&y<o.y+o.h))object('flower',x,y,4,5,false,{variant:i%4});
 }
 // Puntos de entrada, vecinos y recogibles siempre tienen espacio libre alrededor.
 const anchors=[world.spawn,...world.pickups,...world.npcs,...world.enemySpawns];
 world.objects=world.objects.filter(o=>!o.solid||!anchors.some(p=>{
  const nx=Math.max(o.x,Math.min(p.x,o.x+o.w)),ny=Math.max(o.y,Math.min(p.y,o.y+o.h));return Math.hypot(p.x-nx,p.y-ny)<18;
 }));
 return world;
};
Z.collides=function(world,x,y,radius=8,ignoreNpc=null){
 if(!Number.isFinite(x)||!Number.isFinite(y)||x-radius<12||y-radius<12||x+radius>world.width-12||y+radius>world.height-12)return true;
 for(const o of world.objects){if(!o.solid)continue;if(x+radius<o.x||x-radius>o.x+o.w||y+radius<o.y||y-radius>o.y+o.h)continue;
  const nx=Math.max(o.x,Math.min(x,o.x+o.w)),ny=Math.max(o.y,Math.min(y,o.y+o.h));if((x-nx)**2+(y-ny)**2<radius*radius)return true;}
 const ignoreId=typeof ignoreNpc==='object'&&ignoreNpc?ignoreNpc.id:ignoreNpc;
 for(const n of world.npcs){if(n.id===ignoreId)continue;if((x-n.x)**2+(y-n.y)**2<(radius+9)**2)return true;}
 return false;
};
Z.nearbyInteractable=function(world,x,y,maxDistance=46){
 let nearest=null,best=maxDistance;
 for(const p of world.pickups){if(p.collected)continue;const d=Math.hypot(p.x-x,p.y-y);if(d<best){nearest=p;best=d;}}
 if(nearest)return nearest;
 for(const o of world.objects){if(o.type!=='well'&&o.type!=='sign'&&o.type!=='stall')continue;const nx=Math.max(o.x,Math.min(x,o.x+o.w)),ny=Math.max(o.y,Math.min(y,o.y+o.h)),d=Math.hypot(x-nx,y-ny);if(d<best){nearest=o;best=d;}}
 return nearest;
};
})();
