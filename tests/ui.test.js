(async () => {
  'use strict';
  window.ZAK_CONFIG = {supabaseUrl: '', supabaseKey: ''}; // Las pruebas nunca publican en el ranking real.
  const g=window.zakGame,results=[];
  const assert=(name,condition)=>{results.push({name,pass:!!condition});if(!condition)throw Error(name);};
  const clickText=text=>{const b=[...document.querySelectorAll('#modal-content button')].find(b=>b.textContent.trim()===text);if(!b)throw Error('No existe botón: '+text);b.click();};
  const close=()=>document.getElementById('close-modal').click();
  const wait=()=>new Promise(resolve=>setTimeout(resolve,40));
  cancelAnimationFrame(g.frame);g.settings.tutorial=false;
  assert('Menú inicial',g.state==='menu');
  document.getElementById('load-game').click();
  assert('Tres ranuras vacías deshabilitadas',document.querySelectorAll('.save-slot:disabled').length===3);close();
  document.getElementById('new-game').click();
  assert('Siete personajes seleccionables',document.querySelectorAll('.character-card').length===7);
  document.querySelector('[data-character="gero"]').click();document.getElementById('player-name').value='   ';document.getElementById('begin-adventure').click();
  assert('Sin apodo no se puede empezar',g.state!=='playing'&&document.getElementById('player-name').classList.contains('invalid'));
  document.getElementById('player-name').value='Probador';document.getElementById('begin-adventure').click();
  assert('Nueva partida de Gero nivel 1',g.state==='playing'&&g.player.characterId==='gero'&&g.player.level===1);
  const bow=g.world.pickups.find(p=>p.type==='bow');g.player.x=bow.x;g.player.y=bow.y;g.interact();
  assert('Recoger arco actualiza inventario y mapa',g.player.weapons.includes('bow')&&bow.collected&&g.player.weapon==='bow');
  const save=index=>{document.getElementById('pause-button').click();clickText('Guardar partida');document.querySelectorAll('.save-slot')[index-1].click();};
  save(1);assert('Ranura 1 guarda personaje y arma',JSON.parse(localStorage.getItem('zak.throne.save.1')).player.weapons.includes('bow'));close();
  const first=localStorage.getItem('zak.throne.save.1');
  g.newGame('dante');assert('Juego nuevo conserva guardado previo',localStorage.getItem('zak.throne.save.1')===first);save(2);close();
  g.newGame('paco');save(3);close();
  assert('Tres guardados independientes',['gero','dante','paco'].every((id,i)=>JSON.parse(localStorage.getItem('zak.throne.save.'+(i+1))).player.characterId===id));
  save(1);assert('Reemplazo pide confirmación concreta',document.getElementById('modal-title').textContent.includes('Reemplazar la ranura 1'));
  assert('No se sobrescribe antes de confirmar',localStorage.getItem('zak.throne.save.1')===first);clickText('Volver');close();close();
  const doomed=JSON.parse(localStorage.getItem('zak.throne.save.3')).player.runId;
  Zak.Ranking.saveLocal({run_id:doomed,player_id:'probador',name:'Paco',character:'paco',level:3,kills:5,bosses:0});
  document.getElementById('load-game').click();document.querySelector('[aria-label="Borrar la ranura 3"]').click();
  assert('Borrar avisa que sale del ranking',document.getElementById('modal-title').textContent.includes('Borrar la ranura 3')&&document.getElementById('modal-content').textContent.includes('eliminar del ranking'));
  clickText('Volver');assert('Volver no borra',!!localStorage.getItem('zak.throne.save.3'));
  document.querySelector('[aria-label="Borrar la ranura 3"]').click();clickText('Borrar partida');await wait();
  assert('Borrar quita la ranura y su fila del ranking',!localStorage.getItem('zak.throne.save.3')&&!Zak.Ranking.local().some(e=>e.run_id===doomed)&&document.querySelectorAll('.save-slot:disabled').length===1);close();
  document.getElementById('load-game').click();document.querySelectorAll('.save-slot')[0].click();
  assert('Cargar recupera personaje e inventario',g.state==='playing'&&g.player.characterId==='gero'&&g.player.weapons.includes('bow')&&g.currentSlot===1);
  g.player.points=1;document.getElementById('stats-button').click();const strength=g.player.stats.strength;document.querySelector('[aria-label="Mejorar Fuerza"]').click();
  assert('Mejorar atributo consume un punto',g.player.stats.strength===strength+1&&g.player.points===0);
  // v2.26: la ficha muestra solo al personaje: retrato, estadísticas, habilidad, ventaja y desventaja.
  {const sheet=document.getElementById('modal-content'),text=sheet.textContent,c=character=>Zak.CHARACTERS.find(x=>x.id===character);
   assert('La ficha tiene el retrato del personaje en un recuadro',!!sheet.querySelector('.sheet-frame canvas.sheet-portrait'));
   assert('La ficha muestra habilidad, ventaja y desventaja',text.includes(c(g.player.characterId).ability)&&text.includes(c(g.player.characterId).advantage)&&text.includes(c(g.player.characterId).disadvantage));
   assert('La ficha ya no muestra guita, objetos ni reliquias',!/◉|Monedas|Materiales|Ofrendas|Bolsa:|Llaves del trono|Amuletos/.test(text));
   assert('La ficha tiene dos páginas: tu personaje y tu compañero',document.querySelectorAll('.sheet-tab').length===2);}
  close();
  assert('Ya no hay mapa',!document.getElementById('map-button'));
  g.state='playing';document.getElementById('world').dispatchEvent(new KeyboardEvent('keydown',{key:'m',bubbles:true}));window.dispatchEvent(new KeyboardEvent('keyup',{key:'m'}));
  assert('La M no abre nada',document.getElementById('modal-overlay').classList.contains('hidden'));
  document.getElementById('journal-button').click();assert('El diario muestra los objetivos (los enemigos están en el bestiario)',document.querySelectorAll('.journal-task').length===g.quests().length);
  assert('El diario tiene los bloques de medallero, bestiario y misiones',['journal-medals','journal-bestiary','journal-missions'].every(c=>document.querySelector('.journal-blocks .'+c)));close();
  const coins=g.player.coins;assert('Hay recompensas para reclamar',!document.getElementById('journal-badge').classList.contains('hidden')||g.unclaimedRewards().length>0);
  document.getElementById('journal-button').click();const claim=document.querySelector('.quest-claim');claim.click();
  assert('Reclamar en el diario suma guita',g.player.coins>coins&&document.querySelector('.shop-message').textContent.includes('guita'));close();
  g.emit('toast',{message:'Primero'});g.emit('toast',{message:'Segundo'});
  const toasts=document.querySelectorAll('#toast-container .toast');assert('Un aviso nuevo reemplaza al anterior',toasts.length===1&&toasts[0].textContent==='Segundo');
  document.getElementById('toast-container').replaceChildren();g.settings.notices=false;g.emit('toast',{message:'Oculto'});
  assert('Sin avisos no aparecen carteles',!document.querySelector('#toast-container .toast'));g.settings.notices=true;
  const hudWait=()=>new Promise(r=>setTimeout(()=>{g.emit('tick');r();},120));g.settings.tips=false;g.player.x=1062;g.player.y=1462;await hudWait();
  assert('Sin tips no se muestra la tecla para interactuar',!!g.nearbyAction()&&document.getElementById('interaction-hint').classList.contains('hidden'));
  g.settings.tips=true;await hudWait();assert('Con tips vuelve la tecla',!document.getElementById('interaction-hint').classList.contains('hidden'));
  // El reloj del HUD: día, tarde, noche, luna roja y dimensión de Zak.
  const clock=document.getElementById('hud-time'),clockAt=async(minutes,moon=false,place=null)=>{const biome=g.biome;g.player.playTime=minutes*60;g.player.bloodMoon=moon;g.player.moonNight=moon?0:-1;if(place)g.biome=place;await hudWait();const shown=clock.textContent,red=clock.classList.contains('blood-moon'),statuses=document.getElementById('status-effects').textContent;g.biome=biome;return{shown,red,statuses};};
  assert('A la mañana el reloj dice Día',/☀ DÍA · 08:00/.test((await clockAt(0)).shown));
  assert('A las 15:00 dice Tarde',/TARDE · 15:00/.test((await clockAt(7)).shown));
  const plainNight=await clockAt(13);assert('A las 21:00 dice Noche, sin luna roja',/☾ NOCHE · 21:00/.test(plainNight.shown)&&!plainNight.red&&!/Luna roja/.test(plainNight.statuses));
  const redNight=await clockAt(13,true);assert('Con luna roja se ve en rojo y entre los estados',/LUNA ROJA · 21:00/.test(redNight.shown)&&redNight.red&&/Luna roja/.test(redNight.statuses));
  const eternal=await clockAt(1,false,'magic');assert('En la dimensión de Zak siempre es de noche, aunque afuera sea de día',/NOCHE ETERNA/.test(eternal.shown)&&!/☀/.test(eternal.shown));
  const realmMoon=await clockAt(13,true,'throne');assert('Desde la v2.24 la luna roja también llega a la dimensión de Zak',/NOCHE ETERNA · LUNA ROJA/.test(realmMoon.shown)&&realmMoon.red&&/Luna roja/.test(realmMoon.statuses));
  await clockAt(0);
  // Charla con un vecino: el aviso en pantalla, la tecla de verdad y el cuadro de diálogo.
  const press=key=>{for(const type of ['keydown','keyup'])document.body.dispatchEvent(new KeyboardEvent(type,{key,bubbles:true}));};
  const gaucho=g.world.npcs.find(n=>n.kind==='gaucho');Object.assign(g.player,{x:gaucho.x,y:gaucho.y+24});g.biome='village';await hudWait();
  assert('Cerca del gaucho, el aviso invita a hablar',document.getElementById('interaction-hint').textContent.includes('Hablar con el gaucho'));
  press('e');g.update(.4);await hudWait();
  assert('La E abre el diálogo y se esconde el HUD',g.cutscene&&g.cutscene.line.text.startsWith('Como me gustaría')&&document.body.classList.contains('cutscene'));
  g.renderer.draw(g,0);press(' ');g.renderer.draw(g,0);
  assert('Con Espacio se completa el texto sin cerrar',!!g.cutscene);
  press('e');await hudWait();
  assert('Otra tecla cierra el diálogo y vuelve el HUD',!g.cutscene&&!document.body.classList.contains('cutscene'));
  localStorage.setItem('zak.throne.save.3','{roto');document.getElementById('load-game').click();
  assert('Ranura dañada no puede cargarse',document.querySelectorAll('.save-slot')[2].disabled);close();close();
  const time=g.time;document.getElementById('pause-button').click();g.update(1);
  assert('Pausa detiene la simulación',g.time===time&&g.state==='paused');close();
  await wait();
  // Pixel art: nada de suavizado, escala entera y letra propia para todos los textos del juego.
  const Px=Zak.Pixel,sheet=document.createElement('canvas');sheet.width=sheet.height=120;const pen=Px.install(sheet.getContext('2d'));
  const onlySolid=()=>{const data=pen.getImageData(0,0,120,120).data;for(let i=3;i<data.length;i+=4)if(data[i]!==0&&data[i]!==255)return false;return true;};
  Px.scale=1.6;Zak.drawCharacter(pen,{x:40,y:70,characterId:'dante',dir:'right'},0,true);Px.scale=1;
  assert('Un sprite escalado no deja píxeles semitransparentes',onlySolid());
  pen.fillStyle='#fff';pen.strokeStyle='#fff';pen.lineWidth=3;pen.setLineDash([5,4]);pen.beginPath();pen.ellipse(70,70,30,18,.4,0,Math.PI*2);pen.stroke();pen.setLineDash([]);pen.beginPath();pen.moveTo(10,10);pen.arc(10,10,25,.2,1.2);pen.closePath();pen.fill();
  assert('Trazos y rellenos curvos salen sin antialiasing',onlySolid());
  {// v2.31: al picar solo se ve el pico, con la cabeza del material de la herramienta, y no el arma.
   const colors=player=>{pen.clearRect(0,0,120,120);Zak.drawCharacter(pen,{x:60,y:80,characterId:'dante',dir:'right',weapon:'sword',...player},0,false);const d=pen.getImageData(0,0,120,120).data,set=new Set();for(let i=0;i<d.length;i+=4)if(d[i+3])set.add('#'+[d[i],d[i+1],d[i+2]].map(v=>v.toString(16).padStart(2,'0')).join(''));return set;};
   const armed=colors({}),gold=colors({gather:{tool:'pickaxe',tick:.2},pickaxe:4}),stone=colors({gather:{tool:'pickaxe',tick:.2},pickaxe:2}),axe=colors({gather:{tool:'axe',tick:.2},axe:5});
   assert('Con la espada en la mano se ve la espada',armed.has('#8faeaf'));
   assert('Picando se guarda la espada',!gold.has('#8faeaf')&&!gold.has('#d9e5cc'));
   assert('El pico de oro es dorado y el de piedra, gris',gold.has('#e5b636')&&!gold.has('#8a8f96')&&stone.has('#8a8f96')&&!stone.has('#e5b636'));
   assert('El hacha de diamante es celeste',axe.has('#6fdcec'));}
  {// v2.32: las partículas de ambiente viven en celdas fijas del mundo: mover la cámara no las mueve.
   const cells=ox=>{const list=[];Zak.Draw.ambientCells(ox,0,640,360,(bx,by)=>list.push(bx+','+by));return list;},a=cells(0),b=cells(64);
   assert('Mover la cámara no corre las celdas de las partículas',a.filter(k=>b.includes(k)).length>=a.length-6&&a.every(k=>Number(k.split(',')[0])%Zak.Draw.AMBIENT_CELL===0));
   // El nido tiene huevos (blancos con manchitas violetas) y las piezas de la guardería se dibujan.
   pen.clearRect(0,0,120,120);Zak.drawExtraObject(pen,{type:'nest',x:30,y:50,w:46,h:18},0);const d=pen.getImageData(0,0,120,120).data,set=new Set();for(let i=0;i<d.length;i+=4)if(d[i+3])set.add('#'+[d[i],d[i+1],d[i+2]].map(v=>v.toString(16).padStart(2,'0')).join(''));
   assert('El nido de la Yarará muestra sus huevos moteados',set.has('#ece3c6')&&set.has('#8a6bb0')&&set.has('#4a3622'));
   assert('Las piezas de la guardería tienen su dibujo',['kwall','kfence','kcounter','kbell','kdoghouse','kbed','kperch','kfruit','kores','kcart','klamp','khay','krug','kstraw','ksand','kgravel'].every(type=>Zak.drawExtraObject(pen,{type,x:10,y:60,w:30,h:12},0)));}
  const missing=[];
  for(const text of ['abcdefghijklmnñopqrstuvwxyzáéíóúü¿?¡!.,:;-+/()%0123456789','ABCDEFGHIJKLMNÑOPQRSTUVWXYZÁÉÍÓÚÜ«»…$',...g.world.objects.map(o=>o.label||''),...g.world.npcs.map(n=>n.name||''),...Zak.CHARACTERS.map(c=>c.name),...Object.values(Zak.OFFERINGS).map(o=>o.icon),'♪♫☠✦▸▼▲⚒✝≈✓🗝'])
    for(const ch of Array.from(text))if(!Px.hasGlyph(ch))missing.push(ch);
  assert('La fuente de píxeles dibuja todos los textos del juego: '+missing.join(''),missing.length===0);
  assert('La fuente chica también escribe nombres y carteles',[...g.world.objects.map(o=>o.label||''),...g.world.npcs.map(n=>n.name||'')].every(text=>Array.from(text).every(ch=>Px.hasGlyph(ch,6))));
  g.renderer.resize(true);const world=document.getElementById('world'),scale=world.getBoundingClientRect().width*devicePixelRatio/world.width;
  assert('Con lugar suficiente, cada píxel del juego mide un número entero de píxeles reales',Math.abs(scale-Math.round(scale))<.01);
  // v2.19: bolsa, amuletos, pedidos y tiendas de los vecinos.
  if(!document.getElementById('modal-overlay').classList.contains('hidden'))close();
  g.state='playing';g.addItem('water',2);g.addItem('dorado',1);g.player.selectedItem='water';await new Promise(resolve=>setTimeout(resolve,120));g.emit('tick');
  assert('El HUD muestra el objeto elegido',document.getElementById('hud-item').textContent.includes('💧'));
  document.getElementById('bag-button').click();
  assert('La bolsa muestra los objetos y todos los amuletos',document.querySelectorAll('#modal-content .bag-item').length===2+Object.keys(Zak.AMULETS).length);
  {const text=document.getElementById('modal-content').textContent;
   assert('La bolsa muestra armas, equipo, materiales y reliquias',['Armas','Equipo y herramientas','Materiales','Reliquias','Llave del trono'].every(t=>text.includes(t))&&document.querySelectorAll('.bag-tile').length>=Object.keys(Zak.MATERIALS).length+Object.keys(Zak.OFFERINGS).length);
   assert('La bolsa no muestra la guita, los pedidos ni los compañeros',!new RegExp('◉ '+g.player.coins+'(?!\\d)').test(text)&&!/Tu guita|Pedidos en curso|Compañeros|Firulais/.test(text)&&!document.querySelector('#modal-content .bag-coins'));}
  clickText('Usar');assert('Usar desde la bolsa gasta uno y la bolsa sigue abierta',g.itemCount('water')===1&&!document.getElementById('modal-overlay').classList.contains('hidden'));close();
  const tito=g.world.npcs.find(n=>n.name==='Tito');g.emit('npc',{npc:tito});
  assert('Tito cuenta su pedido',(document.querySelector('.request-box')||{}).textContent?.includes('Leña para el horno'));
  clickText('Aceptar el pedido');assert('Aceptar el pedido lo deja en curso',g.requestState('tito')==='active');close();
  g.state='playing';document.getElementById('journal-button').click();document.querySelector('.journal-missions').click();
  assert('El bloque de misiones del diario muestra los pedidos en curso',document.getElementById('modal-title').textContent==='Misiones'&&document.getElementById('modal-content').textContent.includes('Leña para el horno')&&document.getElementById('modal-content').textContent.includes('Para Tito'));
  close();assert('Cerrar las misiones vuelve al diario',/DIARIO DE VIAJE/.test(document.querySelector('.modal-eyebrow').textContent)&&!!document.querySelector('.journal-blocks'));close();
  const merchant=g.world.npcs.find(n=>n.shop==='merchant');g.player.coins=5000;g.emit('npc',{npc:merchant});
  document.querySelector('#modal-content [aria-label="Conseguir Segundo engarce"]').click();
  assert('El Mercader del Vacío vende el segundo engarce',g.player.amuletSlots===2&&g.player.coins===1000);close();

  // v2.21: medallero, truco con las almas, nombre de los compañeros y la puerta del trono.
  if(!document.getElementById('modal-overlay').classList.contains('hidden'))close();
  g.state='playing';g.awardMedal('capo',true);document.getElementById('world').dispatchEvent(new KeyboardEvent('keydown',{key:'l',bubbles:true}));window.dispatchEvent(new KeyboardEvent('keyup',{key:'l'}));
  assert('L abre el medallero con todas las medallas',document.querySelectorAll('#modal-content .medal-card').length===Zak.MEDALS.length&&document.querySelectorAll('#modal-content .medal-card.locked').length===Zak.MEDALS.length-g.player.medals.length);
  assert('El medallero muestra primero las que ganaste, con su barra',!document.querySelector('#modal-content .medal-card').classList.contains('locked')&&!!document.querySelector('.medal-progress .sheet-xp'));close();
  g.state='playing';document.getElementById('journal-button').click();
  assert('El diario lleva al medallero',[...document.querySelectorAll('#modal-content button')].some(b=>b.textContent.includes('Medallero')));close();
  const soul=g.world.npcs.find(n=>n.id==='truco');g.player.coins=600;g.emit('npc',{npc:soul});
  assert('Las almas ofrecen jugar al truco con apuestas',document.querySelectorAll('#modal-content .truco-bets button').length===Zak.TRUCO.bets.length&&document.querySelector('[aria-label="Apostar 1000 de guita"]').disabled);
  document.querySelector('[aria-label="Apostar 100 de guita"]').click();
  assert('La mesa de truco muestra tus cartas y el tanteador',g.truco&&g.player.coins===500&&document.querySelector('.truco-score')&&document.querySelectorAll('.truco-card').length+g.truco.match.hand.played.player.length===3);
  {const m=g.truco.match;if(!g.trucoGhostTurn()){document.querySelector('.truco-card:not(:disabled)')&&document.querySelector('.truco-card:not(:disabled)').click();}
   const moves=()=>m.log.length+'/'+m.hand.played.ghost.length+'/'+JSON.stringify(m.hand.pending)+'/'+m.hand.finished;const before=moves();const turn=g.trucoGhostTurn();await new Promise(r=>setTimeout(r,300));
   assert('El alma no juega al instante',!turn||moves()===before);
   if(turn){await new Promise(r=>setTimeout(r,1300));assert('El alma juega después de pensarlo',moves()!==before&&document.querySelector('.truco-felt'));}
   assert('Los tantos se anotan con fósforos',document.querySelectorAll('.truco-tally canvas').length===2);}
  close();assert('Levantarse a la mitad pide confirmación',document.getElementById('modal-title').textContent.includes('levantás'));
  clickText('Levantarme');assert('Al levantarte perdés lo apostado',!g.truco&&g.player.coins===500);
  g.state='playing';g.player.pets.bat={name:'Draco'};g.emit('namePet',{pet:'bat'});
  const petInput=document.getElementById('pet-name');assert('Al domesticar se le pone nombre',petInput&&petInput.value==='Draco');
  petInput.value='Batito';clickText('Ponerle el nombre');assert('El nombre queda guardado',g.petName('bat')==='Batito');
  // v2.26: segunda página de la ficha: el compañero, sus números y su nombre.
  g.state='playing';g.player.pet='bat';document.getElementById('stats-button').click();[...document.querySelectorAll('.sheet-tab')][1].click();
  {const text=document.getElementById('modal-content').textContent;
   assert('La página del compañero tiene su retrato, nivel y estadísticas',!!document.querySelector('.sheet-frame.pet canvas')&&text.includes('Batito')&&text.includes('Daño por golpe')&&text.includes('Especial cada')&&text.includes(Zak.PET_SKILLS.bat.name));
   const input=document.getElementById('pet-sheet-name');input.value='Nocturno';clickText('Cambiar nombre');
   assert('Desde la ficha se le cambia el nombre',g.petName('bat')==='Nocturno'&&document.getElementById('pet-sheet-name').value==='Nocturno');
   const locked=[...document.querySelectorAll('.pet-chip.locked')];locked[0].click();
   assert('Los compañeros que no tenés se ven como silueta, con la pista',/TODAVÍA NO LO TENÉS/.test(document.getElementById('modal-content').textContent)&&!document.getElementById('pet-sheet-name'));}
  close();
  g.state='playing';g.player.throneKeys=1;g.questFlags.defeat_zak=true;g.openThroneDoor();
  assert('Quien venció a Zak elige entre la pelea de siempre y la revancha',[...document.querySelectorAll('#modal-content button')].some(b=>b.textContent.includes('Zak furioso'))&&g.player.throneKeys===1);
  clickText('Todavía no');

  // v2.22: el apodo del ranking es de cada partida.
  if(!document.getElementById('modal-overlay').classList.contains('hidden'))close();
  g.state='playing';g.player.rankName='Primera';const firstRun=JSON.parse(JSON.stringify(g.snapshot()));
  Zak.Ranking.setName('Prueba-mer');g.newGame('mer');g.player.rankName='Prueba-mer';g.restore(firstRun,1);
  assert('Empezar otra partida con otro apodo no le cambia el nombre a la anterior',g.player.rankName==='Primera'&&Zak.Ranking.entryFor(g).name==='Primera');
  delete firstRun.player.rankName;Zak.Ranking.saveLocal({...Zak.Ranking.entryFor(g),name:'Original'});localStorage.setItem('zak.throne.save.3',JSON.stringify(firstRun));
  g.state='menu';document.getElementById('load-game').click();document.querySelectorAll('.save-slot')[2].click();
  assert('Una partida vieja conserva el apodo con el que figuraba en el ranking',g.player.rankName==='Original');
  document.getElementById('pause-button').click();[...document.querySelectorAll('#modal-content button')].find(b=>b.textContent.startsWith('Nombre en el ranking')).click();
  document.getElementById('rank-name').value='Dante';clickText('Guardar el nombre');
  assert('El apodo de la partida se cambia desde la pausa',g.player.rankName==='Dante'&&Zak.Ranking.profile().name==='Prueba-mer');close();

  // v2.24: bestiario, medallas secretas, desafío semanal, vendedor ambulante y clima en el reloj.
  if(!document.getElementById('modal-overlay').classList.contains('hidden'))close();
  g.state='playing';g.player.medals=[];document.getElementById('world').dispatchEvent(new KeyboardEvent('keydown',{key:'l',bubbles:true}));window.dispatchEvent(new KeyboardEvent('keyup',{key:'l'}));
  const scamCard=[...document.querySelectorAll('.medal-card')].find(c=>c.textContent.includes('Me siento estafado'));
  assert('Las medallas que faltan muestran el nombre pero no cómo se consiguen',scamCard&&scamCard.classList.contains('locked')&&!scamCard.textContent.includes('vendedor')&&/secreto/.test(scamCard.textContent));close();
  g.state='playing';g.questFlags={};g.player.bestiary={};g.player.moonKills={};document.getElementById('world').dispatchEvent(new KeyboardEvent('keydown',{key:'k',bubbles:true}));window.dispatchEvent(new KeyboardEvent('keyup',{key:'k'}));
  assert('K abre el bestiario; sin vencerlo, una silueta sin datos',document.querySelector('.bestiary-page.locked')&&document.querySelector('.bestiary-title h3').textContent==='???'&&document.querySelector('.bestiary-story').textContent==='???');
  close();g.questFlags.defeat_rat=true;g.state='playing';Zak.UI.showBestiary(0);
  assert('Al vencerlo, su historia y sus estadísticas',!document.querySelector('.bestiary-page.locked')&&document.querySelector('.bestiary-title h3').textContent===Zak.ENEMY_TYPES.rat.name&&document.querySelectorAll('.bestiary-stats b').length>=10);
  document.querySelector('.bestiary-moon').click();
  assert('La luna roja del borde muestra su forma de noche sangrienta, que todavía falta',document.querySelector('.bestiary-page.moon.locked'));
  g.player.moonKills={rat:1};Zak.UI.showBestiary(0,true);
  assert('Vencido con luna roja: la historia cambia al principio y al final',/^Es parecido a la rata normal/.test(document.querySelector('.bestiary-story').textContent)&&/salvaje y fuerte/.test(document.querySelector('.bestiary-story').textContent));
  document.querySelector('.bestiary-next').click();assert('Se pasa de página',/PÁGINA 2/.test(document.getElementById('modal-content').parentNode.textContent));
  assert('Hay una miniatura por enemigo',document.querySelectorAll('.bestiary-thumb').length===Zak.BESTIARY_ORDER.length);close();
  g.state='playing';document.getElementById('journal-button').click();
  assert('El diario muestra el bestiario y el desafío semanal',[...document.querySelectorAll('#modal-content button')].some(b=>b.textContent.includes('Bestiario'))&&document.querySelector('.weekly-box strong').textContent===g.weeklyChallenge().name);close();
  g.state='playing';document.getElementById('ranking-button').click();await wait();
  assert('El ranking tiene la pestaña del desafío semanal',[...document.querySelectorAll('.rank-tab')].some(b=>b.textContent==='Desafío'));close();
  {let t=0;while(!Zak.wandererAt(t,g.player.runId)&&t<1e6)t+=30;g.player.playTime=t;g.syncWanderer();const n=g.world.npcs.find(m=>m.id==='wanderer');g.state='playing';g.emit('npc',{npc:n});
   assert('El vendedor ambulante vende curas y cosas raras, caras',/Cosas raras/.test(document.getElementById('modal-content').textContent)&&/Curación completa/.test(document.getElementById('modal-content').textContent)&&/me voy/i.test(document.getElementById('modal-content').textContent));close();}
  {let t=240;while(Zak.weatherAt(t+60,g.player.runId).kind!=='storm')t+=240;g.state='playing';g.player.playTime=t+60;g.biome='weeds';g.updateWeather(0);Zak.UI.updateHud&&Zak.UI.updateHud(true);g.emit('tick');await new Promise(r=>setTimeout(r,150));
   assert('El reloj avisa la tormenta',/TORMENTA/.test(document.getElementById('hud-time').textContent));}
  // v2.27: la pausa muestra al personaje y sus botones llevan íconos sin cambiar el texto.
  if(!document.getElementById('modal-overlay').classList.contains('hidden'))close();
  g.state='playing';Zak.UI.showPause();
  assert('La pausa muestra al personaje y botones con íconos',!!document.querySelector('.pause-card canvas')&&document.querySelectorAll('#modal-content .button[data-icon]').length>=5&&[...document.querySelectorAll('#modal-content button')].some(b=>b.textContent==='Guardar partida'));close();
  return {passed:results.filter(r=>r.pass).length,failed:results.filter(r=>!r.pass).length,results};
})()
