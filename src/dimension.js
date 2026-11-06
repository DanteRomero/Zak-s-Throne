/* Dimensión de Zak: Santuario, Pueblo Mágico (magos, armaduras vivientes, fogatas), el Rey Mago y la puerta del trono. */
(function () {
'use strict';
const Z = window.Zak, distance = (a,b) => Math.hypot(a.x-b.x,a.y-b.y);
const CAST_TIME=2, SPIN_WINDUP=1.1, SPIN_RADIUS=58, CAMPFIRE_RADIUS=13, HEAL_RADIUS=Z.ARCHMAGE_HEAL_RADIUS=85, LASER_LENGTH=Z.LASER_LENGTH=520;
// Sobrecarga del Rey Mago: el área es 1,5 veces la del terremoto del Gólem (100).
const OVERLOAD_TIME=Z.OVERLOAD_TIME=8, OVERLOAD_RADIUS=Z.OVERLOAD_RADIUS=150, OVERLOAD_FREEZE=5;
// Quemadura por segundo según la fuerza de quien la causa; nunca menos que la fogata (2).
const burnFrom = e => Math.max(2,Math.round(e.stats.strength*.08));
Object.assign(Z.Game.prototype, {
 burnPlayer(damage){
  const p=this.player,fresh=!p.burn;
  // El agua bendita te deja un rato a salvo del fuego.
  if(p.buffs&&p.buffs.fireproof>0)return;
  // Hoja seca: a Mer el fuego la quema 50% más.
  if(p.characterId==='mer')damage=Math.ceil(damage*1.5);
  p.burn={time:5,tick:p.burn?p.burn.tick:1,damage:Math.max(damage,p.burn?p.burn.damage:0)};
  if(fresh)this.emit('toast',{message:'¡Te quemaste! '+damage+' de vida por segundo durante 5 s.',error:true});
 },
 // Congelado: como el aturdimiento, no deja moverse, atacar, rodar ni usar la habilidad.
 freezePlayer(){
  const p=this.player;p.frozen=OVERLOAD_FREEZE;p.stunned=Math.max(p.stunned||0,OVERLOAD_FREEZE);p.gather=null;
  this.emit('toast',{message:'¡Te congeló! No podés moverte ni atacar durante 5 segundos.',error:true});
 },
 // Pisar una fogata del Pueblo Mágico quema (rodar no salva: es fuego, no un golpe).
 updateCampfires(){
  if(this.biome!=='magic')return;const p=this.player;
  for(const o of this.world.objects)if(o.type==='campfire'&&!(o.out>0)&&Math.hypot(p.x-(o.x+o.w/2),p.y-(o.y+o.h/2))<CAMPFIRE_RADIUS){this.burnPlayer(2);return;}
 },
 fireball(e,angle,damage,burn){
  this.projectiles.push({x:e.x+Math.cos(angle)*14,y:e.y-16+Math.sin(angle)*14,dx:Math.cos(angle),dy:Math.sin(angle),type:'fireball',hostile:true,damage,burn,source:e.type,traveled:0,range:420});
 },
 aimAngle(e){const p=this.player;return Math.atan2(p.y-8-(e.y-16),p.x-e.x);},
 updateDimensionEnemy(e,dt,sameZone){
  if(Z.REALM_AI[e.type]){this[Z.REALM_AI[e.type]](e,dt,distance(e,this.player),sameZone);return;}
  const p=this.player,def=Z.ENEMY_TYPES[e.type],len=distance(e,p),wasAlert=e.alert;
  e.alert=sameZone&&!(e.charm>0)&&(e.summoned||len<def.visionRange||(e.alert&&len<def.visionRange*1.5));
  if(e.alert&&!wasAlert)this.sound.play('alert');
  if(e.charm>0&&sameZone&&len<210){e.act=null;this.steer(e,e.x+(e.x-p.x),e.y+(e.y-p.y),e.stats.moveSpeed,dt,len);return;}
  if(!e.alert){e.act=null;this.steer(e,e.homeX+Math.sin(this.time*.2+e.homeX)*28,e.homeY+Math.cos(this.time*.15+e.homeY)*22,e.stats.moveSpeed*.28,dt,len);return;}
  if(e.type==='mage')this.mageAI(e,dt,len);else this.armorAI(e,dt,len);
 },
 // Mago: se queda quieto 2 s conjurando y tira una bola de fuego. Siempre busca distancia.
 mageAI(e,dt,len){
  const p=this.player,a=e.act;
  if(a){a.t+=dt;e.moving=false;this.aimAt(e);
   if(a.t>=CAST_TIME){this.fireball(e,this.aimAngle(e),e.stats.strength,burnFrom(e));this.sound.play('fire');e.act=null;e.cooldown=1.6;}
   return;}
  const ux=(e.x-p.x)/(len||1),uy=(e.y-p.y)/(len||1);let tx=p.x,ty=p.y,velocity=e.stats.moveSpeed;
  if(len<190){tx=e.x+ux*60;ty=e.y+uy*60;}
  else if(len<300){const side=Math.sin(this.time*.8+e.homeX);tx=e.x-uy*40*side;ty=e.y+ux*40*side;velocity*=.5;}
  this.steer(e,tx,ty,velocity,dt,len);
  if(e.cooldown<=0&&len<340){e.act={id:'cast',t:0};this.sound.play('cast');}
 },
 // Armadura viviente: muy lenta; tarda en pegar, pero gira con la espada y golpea todo a su alrededor.
 armorAI(e,dt,len){
  const a=e.act,p=this.player;
  if(a){a.t+=dt;e.moving=false;
   if(!a.done&&a.t>=SPIN_WINDUP){a.done=true;this.sound.play('swing');this.shake(3,.2);this.effect(e.x,e.y,'wave',.35,{radius:SPIN_RADIUS});
    if(this.inRadius(e,SPIN_RADIUS))this.hurtPlayer(e.stats.strength*1.5,e.type);}
   if(a.t>=SPIN_WINDUP+.5){e.act=null;e.cooldown=2;}
   return;}
  this.steer(e,p.x,p.y,e.stats.moveSpeed,dt,len);
  if(len<48&&e.cooldown<=0){e.act={id:'spin',t:0};this.sound.play('telegraph');}
 },
 // El Rey Mago: casi siempre se teletransporta lejos antes de atacar.
 archmageAI(e,dt,len){
  const p=this.player,a=e.act,realDt=dt/Z.BOSS_TEMPO;
  if(a){a.t+=dt;
   if(a.id==='teleport'){
    if(a.t>=.35&&!a.moved){a.moved=true;Object.assign(e,this.archmageSpot(e));this.effect(e.x,e.y-20,'poof',.6,{seed:5});this.sound.play('teleport');}
    if(a.t>=.7){e.act=null;this.archmageStart(e,a.next);}
    return;}
   if(a.id==='nova'){
    if(a.t<.7){this.aimAt(e);return;}
    const base=this.aimAngle(e);for(let k=0;k<5;k++)this.fireball(e,base+k*Math.PI*2/5,e.stats.strength*1.3,burnFrom(e));
    this.sound.play('fire');e.act=null;e.cd.nova=3.2;return;}
   // Zona de curación: 150 de vida por segundo durante 10 s (tiempo real). Pegarle la corta (bossHitReact).
   if(a.id==='heal'){
    a.time+=realDt;a.tick-=realDt;a.shown-=realDt;e.hp=Math.min(e.maxHp,e.hp+150*realDt);
    if(a.shown<=0){a.shown=1;this.effect(e.x,e.y-70,'heal',.8,{text:'+150'});}
    if(a.tick<=0){a.tick=.5;if(this.inRadius(e,HEAL_RADIUS))this.hurtPlayer(e.stats.strength*.5,e.type);}
    if(a.time>=10){e.act=null;e.cd.heal=25;}
    return;}
   if(a.id==='summon'){
    if(a.t>=1){for(let k=0;k<5;k++){const ang=k*Math.PI*2/5;this.summon('armor',e.x+Math.cos(ang)*70,e.y+Math.sin(ang)*50,e);}this.sound.play('ability');e.act=null;e.cd.summon=30;}
    return;}
   // Sobrecarga: 8 s (tiempo real) cargando, quieto y sin protección: es la ventana para pegarle de cerca.
   if(a.id==='overload'){
    a.time+=realDt;e.moving=false;
    if(a.time>=OVERLOAD_TIME){
     this.sound.play('slam');this.sound.play('thunder');this.shake(8,.5);this.effect(e.x,e.y,'wave',.5,{radius:OVERLOAD_RADIUS});this.effect(e.x,e.y,'iceblast',.8,{radius:OVERLOAD_RADIUS,seed:Math.random()*99});
     if(this.inRadius(e,OVERLOAD_RADIUS)&&this.hurtPlayer(e.stats.strength*2.5,e.type)&&this.state==='playing')this.freezePlayer();
     e.act=null;e.cd.overload=30;
    }
    return;}
   // Láser reloj: 1 s de aviso, 5 s de cuatro rayos que giran cada vez más rápido y una onda sin límite que solo se esquiva rodando.
   if(a.id==='laser'){
    if(a.t<1)return;
    if(a.t<6){const k=(a.t-1)/5;a.speed=.5+k*k*3.2;a.angle+=a.speed*dt;a.hitCd-=dt;
     if(a.hitCd<=0&&this.onLaser(e,a.angle)){a.hitCd=.4;this.hurtPlayer(e.stats.strength*.6,e.type);}
     if(this.time%.5<dt)this.sound.play('laser');
     return;}
    if(a.wave===undefined){a.wave=0;this.sound.play('slam');this.shake(6,.4);}
    a.wave+=420*dt;const d=Math.hypot(p.x-e.x,(p.y-e.y)/.75);
    if(!a.hit&&a.wave>=d){a.hit=true;this.hurtPlayer(e.stats.strength*1.8,e.type);}
    if((a.hit&&a.wave>d+200)||a.wave>2400){e.act=null;e.cd.laser=20;}
    return;}
  }
  let next=null;
  if(e.cd.heal<=0&&e.hp<e.maxHp*.7)next='heal';
  else if(e.cd.overload<=0)next='overload';
  else if(e.cd.laser<=0)next='laser';
  else if(e.cd.summon<=0&&this.summonsOf(e)<3)next='summon';
  else if(e.cd.nova<=0)next='nova';
  // La Sobrecarga arranca donde está: tiene que dar tiempo a llegarle cuerpo a cuerpo.
  if(next==='overload'){this.archmageStart(e,next);return;}
  if(next){
   if(Math.random()<.8){e.act={id:'teleport',t:0,next};this.sound.play('teleport');this.effect(e.x,e.y-20,'poof',.6,{seed:2});}
   else this.archmageStart(e,next);
   return;}
  // Entre ataques mantiene una distancia media y da vueltas alrededor tuyo.
  const ux=(e.x-p.x)/(len||1),uy=(e.y-p.y)/(len||1);
  if(len<140)this.steer(e,e.x+ux*60,e.y+uy*60,e.stats.moveSpeed,dt,len);
  else if(len>240)this.steer(e,p.x,p.y,e.stats.moveSpeed,dt,len);
  else{const side=Math.sin(this.time*.7);this.steer(e,e.x-uy*50*side,e.y+ux*50*side,e.stats.moveSpeed*.6,dt,len);}
 },
 archmageStart(e,id){
  this.aimAt(e);
  if(id==='heal'){e.act={id,t:0,time:0,tick:.5,shown:0};this.sound.play('ability');}
  else if(id==='overload'){e.act={id,t:0,time:0};this.sound.play('roar');this.emit('toast',{message:'¡Sobrecarga! Está indefenso 8 s: pegale, y salí del círculo antes de que explote.',error:true});}
  else if(id==='laser'){e.act={id,t:0,angle:Math.random()*Math.PI/2,speed:0,hitCd:0};this.sound.play('roar');}
  else{e.act={id,t:0};this.sound.play('telegraph');}
 },
 // Un lugar lejos del jugador (pero no tanto) dentro del Pueblo Mágico.
 archmageSpot(e){
  const p=this.player,z=Z.MAGIC_ZONE;
  for(let i=0;i<40;i++){const x=z.x+60+Math.random()*(z.w-120),y=z.y+60+Math.random()*(z.h-110),d=Math.hypot(x-p.x,y-p.y);
   if(d>=230&&d<=420&&Z.biomeAt(x,y)===e.biome&&!Z.collides(this.world,x,y,10))return{x,y};}
  return{x:e.x,y:e.y};
 },
 onLaser(e,angle){
  const p=this.player,px=p.x-e.x,py=p.y-8-(e.y-20);
  for(let k=0;k<4;k++){const a=angle+k*Math.PI/2,dx=Math.cos(a),dy=Math.sin(a),along=px*dx+py*dy;if(along>=0&&along<=LASER_LENGTH&&Math.abs(px*dy-py*dx)<10)return true;}
  return false;
 },
 // La puerta del trono se abre con la llave del Rey Mago; del otro lado espera Zak.
 openThroneDoor(){
  const p=this.player;
  if(!(p.throneKeys>0)){this.emit('toast',{message:'La puerta no se mueve. La llave la tiene el Rey Mago.',error:true});return false;}
  p.throneKeys--;this.shake(5,.4);this.enterThrone();return true;
 }
});
})();
