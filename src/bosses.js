/* Jefes de las profundidades: el Chupasangre, el Gólem Minero, Cerbero y Zak; el altar de ofrendas y los portales. */
(function () {
'use strict';
const Z = window.Zak, clamp = (v,a,b) => Math.max(a,Math.min(b,v));
const distance = (a,b) => Math.hypot(a.x-b.x,a.y-b.y);
// Cada vida del Gólem es de otro material: más vida y más fuerza que la anterior.
const GOLEM_LIVES = Z.GOLEM_LIVES = [
 {name:'piedra',hp:1,str:1,color:'#8a8f96'},{name:'hierro',hp:1.15,str:1.15,color:'#c3ccd6'},
 {name:'oro',hp:1.3,str:1.3,color:'#f2c94c'},{name:'diamante',hp:1.5,str:1.5,color:'#7fe6f2'}];
// Jefes que Zak puede traer con la Invocación mayor.
const MAJOR = ['capo','yarara','vampire','golem','cerbero'];
// Primeros ataques de cada jefe (segundos hasta que estén listos).
const OPENING = {
 vampire:{swipe:0,lunge:2,summon:10},
 golem:{quake:2,rock:1.5,fortify:15},
 cerbero:{bite:0,jump:3,dig:12},
 zak:{slash:0,raise:8,storm:18,wrath:6,purple:12}
};
const LINES = {
 yield:'Dejémoslo acá y volvé a tu dimensión, mortal.',
 execute:'¿Sabés lo que le pasa al que no sigue mis órdenes? Muere...'
};
Object.assign(Z.Game.prototype, {
 enemyStatsFor(type,life=0){
  const s=Z.enemyStats(type,this.player.level);
  if(type==='golem'){const l=GOLEM_LIVES[clamp(life,0,3)];s.health*=l.hp;s.maxHealth=s.health;s.strength*=l.str;}
  return s;
 },
 aimAt(e){const p=this.player,len=distance(e,p)||1;e.aimX=(p.x-e.x)/len;e.aimY=(p.y-e.y)/len;e.dir=Math.abs(e.aimX)>Math.abs(e.aimY)?(e.aimX>0?'right':'left'):(e.aimY>0?'down':'up');},
 // ¿El jugador está delante del jefe, a menos de `range` y dentro del ángulo indicado?
 inFront(e,range,cosine){const p=this.player,dx=p.x-e.x,dy=p.y-e.y,len=Math.hypot(dx,dy);return len<=range&&(len<12||(dx*e.aimX+dy*e.aimY)/len>=cosine);},
 inRadius(e,radius){const p=this.player;return Math.hypot(p.x-e.x,(p.y-e.y)/.75)<=radius;},
 // Busca un lugar libre cerca, en la misma zona.
 freeSpot(x,y,zone){
  for(let r=0;r<120;r+=12)for(let k=0;k<12;k++){const a=k*Math.PI/6,px=x+Math.cos(a)*r,py=y+Math.sin(a)*r;
   if(Z.biomeAt(px,py)===zone&&!Z.collides(this.world,px,py,9))return{x:px,y:py};}
  return{x,y};
 },
 summon(type,x,y,owner){
  const spot=this.freeSpot(x,y,owner.biome),m=this.makeEnemy({id:'summon-'+(this.summonSerial=(this.summonSerial||0)+1),type,x:spot.x,y:spot.y});
  Object.assign(m,{summoned:true,owner:owner.id,alert:true,provoked:true,cooldown:.8,special:2});
  this.enemies.push(m);this.effect(m.x,m.y-8,'poof',.7,{seed:Math.random()*99});return m;
 },
 summonsOf(e,filter=()=>true){return this.enemies.filter(m=>m.summoned&&m.owner===e.id&&!m.dead&&filter(m)).length;},
 // Golpes que el jefe no recibe: refuerzo del Gólem, saltos, resurrecciones y la Tormenta de Zak.
 bossShield(e,source){
  if(e.air)return'¡Fallaste!';
  if(e.yielding)return'…';
  if(e.act&&e.act.id==='rise')return'Inmune';
  if(e.shield>0)return'¡Refuerzo!';
  if(e.type==='zak'&&e.act&&e.act.id==='storm'&&source!=='stone')return'Solo la piedra';
  return null;
 },
 // Pegarle a Cerbero mientras escarba lo interrumpe.
 bossHitReact(e){
  if(e.type==='cerbero'&&e.act&&e.act.id==='dig'){e.act=null;e.cd.dig=14;this.effect(e.x,e.y-40,'miss',1,{text:'¡Lo interrumpiste!'});}
 },
 bossNextLife(e){
  const def=Z.ENEMY_TYPES[e.type];
  if(e.summoned&&e.type==='zak')return false;
  if(e.type==='zak'&&e.life>=def.lives-1){this.zakYield(e);return true;}
  if(!def.lives||e.life>=def.lives-1)return false;
  e.hp=1;e.act={id:'rise',t:0};e.shield=0;e.telegraph=0;e.dash=0;e.seated=false;
  this.sound.play('roar');this.shake(6,.5);this.player.grabbed=0;
  if(e.type==='golem')this.emit('toast',{message:'El Gólem se desarma… ¡y se rearma de '+GOLEM_LIVES[e.life+1].name+'!',error:true});
  if(e.type==='zak')this.emit('toast',{message:e.life+1===def.lives-1?'Zak se levanta por última vez. Ahora viene con todo.':'Zak se levanta otra vez.',error:true});
  return true;
 },
 riseComplete(e){
  e.life++;const stats=this.enemyStatsFor(e.type,e.life);e.stats=stats;e.maxHp=stats.health;e.hp=stats.health;e.act=null;e.lowFortified=false;
  this.effect(e.x,e.y-20,'level',1.4,{radius:60,text:e.type==='golem'?'¡GÓLEM DE '+GOLEM_LIVES[e.life].name.toUpperCase()+'!':'VIDA '+(e.life+1)+' DE 3'});
  this.sound.play('slam');this.shake(6,.4);
 },
 updateBigBoss(e,dt,sameZone){
  const p=this.player,len=distance(e,p),def=Z.ENEMY_TYPES[e.type],wasAlert=e.alert;
  if(!e.cd.ready)e.cd={...OPENING[e.type],ready:1};
  for(const k of Object.keys(e.cd))if(k!=='ready')e.cd[k]=Math.max(0,e.cd[k]-dt);
  e.shield=Math.max(0,(e.shield||0)-dt);
  if(e.yielding){this.updateZakYield(e,dt);return;}
  e.alert=sameZone&&(e.summoned||len<def.visionRange||(e.alert&&len<def.visionRange*1.7));
  if(e.alert&&!wasAlert){this.sound.play('telegraph');if(!e.summoned)this.emit('boss',{name:def.name});}
  if(e.act&&e.act.id==='rise'){e.act.t+=dt;if(e.act.t>=(e.type==='zak'?2.6:2.2))this.riseComplete(e);return;}
  if(!e.alert){
   if(e.act&&e.act.id==='drain')p.grabbed=0;
   e.act=null;e.air=false;e.lift=0;e.seated=false;
   if(Math.hypot(e.homeX-e.x,e.homeY-e.y)>4)this.steer(e,e.homeX,e.homeY,e.stats.moveSpeed*.4,dt,len);else e.moving=false;
   return;}
  if(e.type==='vampire')this.vampireAI(e,dt,len);
  else if(e.type==='golem')this.golemAI(e,dt,len);
  else if(e.type==='cerbero')this.cerberoAI(e,dt,len);
  else if(e.type==='zak')this.zakAI(e,dt,len);
 },
 // El Chupasangre: manotazo doble, embestida que agarra y chupa sangre, e invocación de murciélagos.
 vampireAI(e,dt,len){
  const p=this.player,a=e.act;
  if(a){a.t+=dt;
   if(a.id==='swipe'){
    if(a.t<.3)return;
    if(a.hits<2&&a.t>=.3+a.hits*.28){a.hits++;this.sound.play('swing');this.effect(e.x+e.aimX*22,e.y-10+e.aimY*22,'slash',.2,{radius:40});
     if(this.inFront(e,54,.3))this.hurtPlayer(e.stats.strength*.85,e.type);}
    if(a.t>.95)e.act=null;return;}
   if(a.id==='lunge'){
    if(a.t<.7){if(a.t<.45)this.aimAt(e);return;}
    if(a.t<1.15){const before={x:e.x,y:e.y};this.move(e,e.aimX*400*dt,e.aimY*400*dt,9,e.biome);e.moving=true;e.walk+=dt*16;
     if(this.time%.06<dt)this.effect(e.x,e.y,'dust',.35);
     if(distance(e,p)<24&&p.roll<=0){e.act={id:'drain',t:0,ticks:0};p.grabbed=1.7;p.gather=null;this.sound.play('drain');this.emit('toast',{message:'¡El Chupasangre te agarró y te chupa la sangre!',error:true});return;}
     if(distance(before,e)<1)e.act=null;return;}
    e.act=null;return;}
   if(a.id==='drain'){
    p.grabbed=Math.max(p.grabbed,.05);this.move(e,(p.x-e.aimX*14-e.x)*.3,(p.y-e.aimY*14-e.y)*.3,9,e.biome);
    if(a.ticks<3&&a.t>=.3+a.ticks*.5){a.ticks++;
     if(this.hurtPlayer(e.stats.strength*.7,e.type,false,{unavoidable:true})){const heal=Math.round(e.maxHp*.04);e.hp=Math.min(e.maxHp,e.hp+heal);this.effect(e.x,e.y-40,'heal',.9,{text:'+'+heal});}
     if(this.state!=='playing')return;}
    if(a.t>=1.7){e.act=null;p.grabbed=0;}return;}
   if(a.id==='retreat'){
    const ox=(e.x-p.x)/(len||1),oy=(e.y-p.y)/(len||1);this.steer(e,e.x+ox*50,e.y+oy*50,e.stats.moveSpeed*1.8,dt,len);
    if(a.t>.9){e.act={id:'summon',t:0};this.sound.play('telegraph');}return;}
   if(a.id==='summon'){
    if(a.t>.8){for(let i=0;i<5;i++){const ang=i*Math.PI*2/5;this.summon('bat',e.x+Math.cos(ang)*42,e.y+Math.sin(ang)*30,e);}
     this.sound.play('ability');e.act=null;e.cd.summon=20;}return;}
  }
  if(e.cd.summon<=0&&this.summonsOf(e)<6){e.act={id:'retreat',t:0};return;}
  if(len<46&&e.cd.swipe<=0){this.aimAt(e);e.act={id:'swipe',t:0,hits:0};e.cd.swipe=1.5;this.sound.play('telegraph');return;}
  if(len>70&&len<250&&e.cd.lunge<=0){this.aimAt(e);e.act={id:'lunge',t:0};e.cd.lunge=6;this.sound.play('telegraph');return;}
  this.steer(e,p.x,p.y,e.stats.moveSpeed*.85,dt,len);
 },
 // El Gólem Minero: terremoto de cuatro golpes, piedrazo que aturde y refuerzo invencible.
 golemAI(e,dt,len){
  const p=this.player,a=e.act;
  if(e.cd.fortify<=0||(e.hp<=e.maxHp*.3&&!e.lowFortified)){
   if(e.hp<=e.maxHp*.3)e.lowFortified=true;e.shield=5;e.cd.fortify=15;this.sound.play('block');this.effect(e.x,e.y-48,'miss',1.4,{text:'¡REFUERZO!'});}
  if(a){a.t+=dt;
   if(a.id==='quake'){
    const slam=Math.floor(a.t),phase=a.t-slam;a.slam=slam;
    if(slam>=4){e.act=null;e.cd.quake=7;return;}
    if(phase>=.75&&a.done!==slam){a.done=slam;this.sound.play('slam');this.shake(5,.25);this.effect(e.x,e.y,'wave',.4,{radius:100});
     if(this.inRadius(e,100))this.hurtPlayer(e.stats.strength*1.7,e.type);}
    return;}
   if(a.id==='throw'){
    if(a.t<.6){this.aimAt(e);return;}
    const p2=this.player,dx=p2.x-e.x,dy=p2.y-6-(e.y-20),l=Math.hypot(dx,dy)||1;
    this.projectiles.push({x:e.x+dx/l*14,y:e.y-20+dy/l*14,dx:dx/l,dy:dy/l,type:'boulder',hostile:true,damage:e.stats.strength,stun:3,source:e.type,traveled:0,range:360});
    this.sound.play('swing');e.act=null;e.cd.rock=4.5;return;}
  }
  if(len<105&&e.cd.quake<=0){e.act={id:'quake',t:0,done:-1,slam:0};this.sound.play('telegraph');return;}
  if(len>80&&len<330&&e.cd.rock<=0){e.act={id:'throw',t:0};this.sound.play('telegraph');return;}
  this.steer(e,p.x,p.y,e.stats.moveSpeed,dt,len);
  if(len<34&&e.cooldown<=0)this.enemyAttack(e);
 },
 // Cerbero: mordida que desangra, salto que aplasta y ralentiza, y escarbar para curarse.
 cerberoAI(e,dt,len){
  const p=this.player,a=e.act;
  if(a){a.t+=dt;
   if(a.id==='bite'){
    if(a.t<.35){this.aimAt(e);return;}
    if(!a.done){a.done=true;this.sound.play('bite');this.effect(e.x+e.aimX*24,e.y-12+e.aimY*24,'slash',.2,{radius:30});
     if(this.inFront(e,58,.2)&&this.hurtPlayer(e.stats.strength*1.1,e.type)&&this.state==='playing'){p.bleed={time:5,tick:1,damage:5};this.emit('toast',{message:'Te estás desangrando: 5 de vida por segundo durante 5 s.',error:true});}}
    if(a.t>.6)e.act=null;return;}
   if(a.id==='jump'){
    if(a.t<.85){a.tx=p.x;a.ty=p.y;}
    const k=clamp(a.t/1.25,0,1);e.air=true;e.x=a.sx+(a.tx-a.sx)*k;e.y=a.sy+(a.ty-a.sy)*k;e.lift=Math.sin(k*Math.PI)*70;e.moving=false;
    if(a.t>=1.25){e.air=false;e.lift=0;
     if(Z.collides(this.world,e.x,e.y,9)||Z.biomeAt(e.x,e.y)!==e.biome)Object.assign(e,this.freeSpot(a.tx,a.ty,e.biome));
     this.sound.play('slam');this.shake(6,.35);this.effect(e.x,e.y,'wave',.45,{radius:72});
     if(this.inRadius(e,72)&&this.hurtPlayer(e.stats.strength*1.4,e.type)&&this.state==='playing'){p.heavySlow=5;this.emit('toast',{message:'¡Te aplastó! Vas mucho más lento durante 5 s.',error:true});}
     e.act=null;e.cd.jump=6;}
    return;}
   if(a.id==='dig'){
    if(this.time%.25<dt)this.effect(e.x+e.aimX*16,e.y,'dust',.5);
    if(a.t>=3){e.hp=e.maxHp;this.effect(e.x,e.y-40,'heal',1.4,{text:'¡Vida completa!'});this.sound.play('roar');this.emit('toast',{message:'Cerbero encontró un hueso y se curó entero.',error:true});e.act=null;e.cd.dig=22;}
    return;}
  }
  if(e.cd.dig<=0&&e.hp<e.maxHp*.85&&len>55){this.aimAt(e);e.act={id:'dig',t:0};this.sound.play('telegraph');return;}
  if(len>110&&len<320&&e.cd.jump<=0){e.act={id:'jump',t:0,sx:e.x,sy:e.y,tx:p.x,ty:p.y};this.sound.play('telegraph');return;}
  if(len<48&&e.cd.bite<=0){e.act={id:'bite',t:0};e.cd.bite=1.3;return;}
  this.steer(e,p.x,p.y,e.stats.moveSpeed*.95,dt,len);
 },
 // Cualquier golpe de Zak se lleva más de la mitad de tu vida máxima: con dos alcanza.
 zakHit(e,mult=1,opts={}){
  const raw=Math.max(e.stats.strength*mult,this.stats().maxHealth*.55*mult);
  return this.hurtPlayer(raw,'zak',false,{pierce:true,...opts});
 },
 zakAI(e,dt,len){
  const p=this.player,a=e.act,third=e.life>=2,seat=Z.THRONE_SPOTS.seat;
  // Mientras su jefe invocado siga en pie, Zak se sienta en el trono y se cura 3 por segundo.
  if(e.seated){
   if(Math.hypot(seat.x-e.x,seat.y-e.y)>4)this.steer(e,seat.x,seat.y,e.stats.moveSpeed*1.2,dt,len);else{e.moving=false;e.dir='down';}
   e.hp=Math.min(e.maxHp,e.hp+3*dt);
   if(!this.enemies.some(m=>m.summoned&&m.major&&m.owner===e.id&&!m.dead)){e.seated=false;e.cd.major=40+Math.random()*40;this.emit('toast',{message:'Zak se levanta del trono.',error:true});}
   return;}
  if(a){a.t+=dt;
   if(a.id==='slash'){
    const n=Math.floor(a.t/.7),ph=a.t-n*.7;a.swing=n;
    if(n>=3){e.act=null;e.cd.slash=2;return;}
    if(ph<.3)this.aimAt(e);
    if(ph>=.45&&a.done!==n){a.done=n;this.sound.play('swing');this.shake(3,.15);this.effect(e.x+e.aimX*40,e.y-14+e.aimY*40,'slash',.25,{radius:70});
     this.move(e,e.aimX*10,e.aimY*10,10,e.biome);
     if(this.inFront(e,105,Math.cos(Math.PI/6)))this.zakHit(e,1);}
    return;}
   if(a.id==='raise'){
    if(a.t>1){[['skeleton',-60,30],['skeleton',60,30],['archer',-110,-30],['archer',110,-30]].forEach(([type,dx,dy])=>this.summon(type,e.x+dx,e.y+dy,e));
     this.sound.play('ability');e.act=null;e.cd.raise=24;}
    return;}
   if(a.id==='major'){
    if(a.t>1.5){const type=MAJOR[Math.floor(Math.random()*MAJOR.length)],m=this.summon(type,e.x,e.y+80,e);m.major=true;e.seated=true;e.act=null;
     this.sound.play('boss');this.shake(6,.5);this.emit('toast',{message:'Zak invoca a '+Z.ENEMY_TYPES[type].name+' y se sienta a mirar.',error:true});}
    return;}
   if(a.id==='storm'){
    a.next-=dt;
    if(a.next<=0&&a.t<9.2){a.next=.3;const ang=Math.random()*Math.PI*2,r=Math.random()<.35?0:30+Math.random()*130;this.bolts.push({x:p.x+Math.cos(ang)*r,y:p.y+Math.sin(ang)*r*.75,t:.85,max:.85});}
    if(a.t>=10){e.act=null;e.cd.storm=32;}
    return;}
   if(a.id==='roar'){
    if(a.t>.9){this.darkness=20;e.act=null;e.cd.wrath=40;this.emit('toast',{message:'Ira del gobernante: todo se oscurece durante 20 segundos.',error:true});}
    return;}
   if(a.id==='purple'){
    if(a.t>=2.8){
     this.sound.play('slam');this.shake(10,.7);this.effect(e.x,e.y,'wave',.6,{radius:220});
     if(Math.hypot(p.x-a.safe.x,p.y-a.safe.y)>a.r)this.zakHit(e,1.4,{unavoidable:true});
     e.act=null;e.cd.purple=30;}
    return;}
  }
  if(e.cd.major===undefined)e.cd.major=40+Math.random()*40;
  if(e.cd.major<=0&&!this.enemies.some(m=>m.summoned&&m.major&&!m.dead)){e.act={id:'major',t:0};this.sound.play('roar');return;}
  if(e.cd.storm<=0){e.act={id:'storm',t:0,next:.5};this.sound.play('thunder');this.emit('toast',{message:'Tormenta de agonía: un rayo te mata. Mientras dura, solo la piedra le hace daño.',error:true});return;}
  if(third&&e.cd.purple<=0){e.act={id:'purple',t:0,safe:this.safeSpot(),r:44};this.sound.play('roar');this.emit('toast',{message:'¡Terremoto morado! Parate en el círculo claro.',error:true});return;}
  if(third&&e.cd.wrath<=0&&this.darkness<=0){e.act={id:'roar',t:0};this.sound.play('roar');return;}
  if(e.cd.raise<=0&&this.summonsOf(e,m=>!m.major)<6){e.act={id:'raise',t:0};this.sound.play('telegraph');return;}
  if(len<90&&e.cd.slash<=0){this.aimAt(e);e.act={id:'slash',t:0,done:-1,swing:0};this.sound.play('telegraph');return;}
  this.steer(e,p.x,p.y,e.stats.moveSpeed,dt,len);
 },
 // Única zona sin daño del Terremoto morado: lejos, pero a tiro de una corrida.
 safeSpot(){
  const p=this.player,z=Z.THRONE_ZONE;
  // Siempre dentro de la pantalla: a los costados más lejos, arriba y abajo más cerca.
  for(let i=0;i<60;i++){const ang=Math.random()*Math.PI*2,r=110+Math.random()*110,x=p.x+Math.cos(ang)*r,y=p.y+Math.sin(ang)*r*.6;
   if(x>z.x+60&&x<z.x+z.w-60&&y>z.y+60&&y<z.y+z.h-50&&!Z.collides(this.world,x,y,18))return{x,y};}
  return{x:clamp(p.x+120,z.x+60,z.x+z.w-60),y:clamp(p.y,z.y+60,z.y+z.h-50)};
 },
 updateBolts(dt){
  if(!this.bolts||!this.bolts.length)return;const p=this.player;
  this.bolts=this.bolts.filter(b=>{b.t-=dt;if(b.t>0)return true;
   this.sound.play('thunder');this.effect(b.x,b.y,'bolt',.35);
   if(this.biome==='throne'&&Math.hypot(p.x-b.x,(p.y-b.y)/.75)<24)this.hurtPlayer(99999,'zak',false,{pierce:true});
   return false;});
 },
 // Al vaciar su última vida, Zak no muere: deja de pelear y abre un portal de vuelta.
 zakYield(e){
  const def=Z.ENEMY_TYPES.zak,first=!this.questFlags.defeat_zak,p=this.player;
  e.hp=1;e.act=null;e.seated=false;e.yielding={t:0,said:false,strikes:0};
  this.enemies=this.enemies.filter(m=>!m.summoned);this.bolts=[];this.darkness=0;p.grabbed=0;
  this.questFlags.defeat_zak=true;p.kills++;p.bossKills=(p.bossKills||0)+1;
  const levels=Z.grantXp(p,e.stats.xp,this.context());this.effect(e.x,e.y-60,'heal',1.4,{text:'+'+this.number(e.stats.xp*this.stats().xpMultiplier)+' EXP'});
  const[min,max]=def.coins;this.dropCoins(e.x,e.y,min+Math.floor(Math.random()*(max-min+1)));
  this.sound.play('boss');this.shake(8,.6);this.emit('progress');
  if(first){p.points+=1;this.emit('toast',{message:'¡Venciste a Zak! Trofeo: +1 punto de mejora.'});}
  if(levels)this.onLevel(levels);
 },
 updateZakYield(e,dt){
  const y=e.yielding,seat=Z.THRONE_SPOTS.seat;y.t+=dt;e.alert=true;
  if(!y.seatedAt){
   if(Math.hypot(seat.x-e.x,seat.y-e.y)>4){const before={x:e.x,y:e.y},dx=seat.x-e.x,dy=seat.y-e.y,l=Math.hypot(dx,dy);
    this.move(e,dx/l*Math.min(l,38*dt),dy/l*Math.min(l,38*dt),10,e.biome);e.moving=distance(before,e)>.01;e.walk+=dt*4;e.dir=Math.abs(dx)>Math.abs(dy)?(dx>0?'right':'left'):(dy>0?'down':'up');
    if(!e.moving||y.t>12){e.x=seat.x;e.y=seat.y;}return;}
   y.seatedAt=y.t;e.moving=false;e.dir='down';
   this.effect(e.x,e.y-70,'speech',4.5,{text:LINES.yield});this.emit('toast',{message:'Zak: «'+LINES.yield+'»'});return;}
  const since=y.t-y.seatedAt;
  if(y.strikes<2&&since>=1.6+y.strikes*.6){y.strikes++;this.sound.play('slam');this.shake(5,.3);this.effect(e.x,e.y+6,'wave',.4,{radius:60});
   if(y.strikes===2){const exit=Z.THRONE_SPOTS.exit;this.exitPortal={x:exit.x,y:exit.y,time:40};this.sound.play('portal');this.emit('toast',{message:'Se abrió un portal a la aldea. Tenés 40 segundos para cruzarlo.'});}}
 },
 resetZak(){
  this.enemies=this.enemies.filter(m=>!m.summoned);this.bolts=[];this.darkness=0;this.exitPortal=null;
  const zak=this.enemies.find(m=>m.type==='zak');if(zak)Object.assign(zak,this.makeEnemy({id:zak.id,type:'zak',x:zak.homeX,y:zak.homeY}));
 },
 // El altar recibe una ofrenda de cada jefe. Lo que ya dejaste queda guardado aunque te vayas.
 useAltar(){
  const p=this.player;
  if(this.enemies.some(e=>e.type==='cerbero'&&!e.dead&&!e.summoned)){this.emit('toast',{message:'Cerbero no te deja acercarte al altar. Derrotalo primero.',error:true});return false;}
  if(p.portal){this.emit('toast',{message:'El portal violeta ya está abierto. Entrá cuando estés listo.'});return false;}
  const placed=[];
  for(const [k,o] of Object.entries(Z.OFFERINGS))if(!p.altar[k]&&p.offerings[k]>0){p.offerings[k]--;p.altar[k]=true;placed.push(o.name);}
  const missing=Object.entries(Z.OFFERINGS).filter(([k])=>!p.altar[k]).map(([,o])=>o.name);
  if(!missing.length){
   p.altar=Z.emptyAltar();p.portal=true;this.questFlags.altar=true;this.sound.play('portal');this.shake(6,.5);
   const altar=this.world.objects.find(o=>o.type==='altar');if(altar)for(let k=0;k<5;k++)this.effect(altar.x+8+k*12,altar.y-6,'poof',.9,{seed:k*7});
   this.emit('toast',{message:'Las cinco ofrendas se rompen y se abre un portal violeta. Tocalo para ir al Trono de Zak.'});return true;}
  if(placed.length)this.sound.play('pickup');
  this.emit('toast',{message:(placed.length?'Dejaste: '+placed.join(', ')+'. ':'No tenés ofrendas nuevas para el altar. ')+'Faltan: '+missing.join(', ')+'.',error:!placed.length});
  return placed.length>0;
 },
 portalObject(){return this.world.objects.find(o=>o.type==='portal'&&o.kind==='altar');},
 updatePortals(dt){
  const p=this.player;
  if(p.portal&&this.biome==='altar'){const o=this.portalObject();if(o&&Math.hypot(p.x-(o.x+o.w/2),p.y-(o.y+o.h/2))<20){this.enterThrone();return;}}
  if(this.exitPortal&&this.biome==='throne'){
   const ex=this.exitPortal;ex.time-=dt;
   if(Math.hypot(p.x-ex.x,p.y-ex.y)<22){this.leaveThrone();return;}
   if(ex.time<=0){this.exitPortal=null;const zak=this.enemies.find(m=>m.type==='zak');
    if(zak)this.effect(zak.x,zak.y-70,'speech',3,{text:LINES.execute});this.emit('toast',{message:'Zak: «'+LINES.execute+'»',error:true});
    this.sound.play('thunder');this.resetZak();this.knockout('execute');}
  }
 },
 travel(spot,biome){
  const p=this.player;Object.assign(p,{x:spot.x,y:spot.y,gather:null,roll:0,moving:false,grabbed:0,stunned:0});
  this.projectiles=[];this.enemies.forEach(e=>{e.latched=0;if(!e.summoned)e.alert=false;e.telegraph=0;e.dash=0;});
  this.biome=biome;if(!p.discovered.includes(biome))p.discovered.push(biome);
  this.renderer.initialized=false;this.clearInput();this.emit('biome',{name:Z.BIOME_NAMES[biome],safe:biome==='village'});
 },
 enterThrone(){const p=this.player;p.portal=false;this.resetZak();this.sound.play('portal');this.travel(Z.THRONE_SPOTS.arrive,'throne');},
 leaveThrone(){const p=this.player;this.resetZak();p.poison=null;p.bleed=null;p.slow=0;p.heavySlow=0;this.sound.play('portal');this.travel(this.world.spawn,'village');}
});
})();
