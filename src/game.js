/* Motor de simulación, combate, IA y persistencia de Zak's Throne. */
(function () {
'use strict';
const Z = window.Zak, clamp = (v,a,b) => Math.max(a,Math.min(b,v));
const distance = (a,b) => Math.hypot(a.x-b.x,a.y-b.y);
const dirs = {down:[0,1],up:[0,-1],left:[-1,0],right:[1,0]};
const names = Z.BIOME_NAMES = {village:'Aldea de los Aromos',cave:'Cueva del Eco',weeds:'Los Yuyos'};
class Sound {
 constructor(){this.enabled=false;this.ctx=null;this.ambientTime=0;}
 unlock(){if(!this.ctx){const Audio=window.AudioContext||window.webkitAudioContext;if(Audio)this.ctx=new Audio();}if(this.ctx&&this.ctx.state==='suspended')this.ctx.resume().catch(()=>{});}
 tone(freq,duration=.12,type='sine',volume=.06,delay=0,end){
  if(!this.enabled||!this.ctx)return;
  const t=this.ctx.currentTime+delay,o=this.ctx.createOscillator(),g=this.ctx.createGain();
  o.type=type;o.frequency.setValueAtTime(freq,t);if(end)o.frequency.exponentialRampToValueAtTime(end,t+duration);
  g.gain.setValueAtTime(0,t);g.gain.linearRampToValueAtTime(volume,t+.015);g.gain.exponentialRampToValueAtTime(.001,t+duration);
  o.connect(g);g.connect(this.ctx.destination);o.start(t);o.stop(t+duration+.02);
 }
 play(kind){
  if(kind==='hit')this.tone(180,.1,'triangle',.08,0,65);
  if(kind==='hurt')this.tone(110,.2,'sawtooth',.035,0,50);
  if(kind==='swing')this.tone(270,.08,'triangle',.035,0,90);
  if(kind==='bow')this.tone(360,.14,'triangle',.055,0,90);
  if(kind==='pickup')[523,659,784].forEach((n,i)=>this.tone(n,.18,'sine',.06,i*.09));
  if(kind==='level')[392,523,659,784,1047].forEach((n,i)=>this.tone(n,.3,'triangle',.05,i*.1));
  if(kind==='ability')[220,330,440,660].forEach((n,i)=>this.tone(n,.35,'sine',.05,i*.08));
  if(kind==='wave')this.tone(90,.5,'triangle',.1,0,35);
  if(kind==='step')this.tone(95+Math.random()*35,.04,'triangle',.012);
 }
 update(dt,biome){if(!this.enabled)return;this.ambientTime-=dt;if(this.ambientTime<=0){this.ambientTime=3+Math.random()*3;if(biome==='cave')this.tone(65,2.5,'sine',.018);else{const n=[262,330,392,440,523][Math.floor(Math.random()*5)];this.tone(n,1.8,'sine',.016);this.tone(n*1.5,1.5,'sine',.009,.7);}}}
}
class Game {
 constructor(canvas){
  this.canvas=canvas;this.renderer=new Z.Renderer(canvas);this.sound=new Sound();
  this.settings={sound:false,particles:true,tutorial:true};this.keys=new Set();this.camera={x:0,y:0};this.state='menu';this.time=0;
  this.onEvent=()=>{};this.aim=null;this.mouseHeld=false;this.effects=[];this.projectiles=[];this.world=Z.createWorld();this.player=Z.createPlayer('paco');
  Object.assign(this.player,{x:770,y:950,dir:'down',walk:0,moving:false,attackAnim:0});
  this.biome='village';this.enemies=[];this.questFlags={};this.stepTime=0;this.last=0;this.accumulator=0;this.uiTimer=0;this.input();
  if(this.initSurvival)this.initSurvival();
  const loop=now=>{const dt=this.last?Math.min((now-this.last)/1000,.12):0;this.last=now;this.accumulator+=dt;
   while(this.accumulator>=1/60){this.update(1/60);this.accumulator-=1/60;}
   this.renderer.draw(this,dt);this.uiTimer+=dt;if(this.uiTimer>.09){this.uiTimer=0;this.emit('tick');}this.frame=requestAnimationFrame(loop);};
  this.frame=requestAnimationFrame(loop);
 }
 emit(type,detail={}){this.onEvent(type,detail);}
 context(){return{biome:this.biome,pursuers:this.enemies.filter(e=>!e.dead&&e.alert&&!e.charm&&!e.stun&&!e.freeze).length};}
 stats(){return Z.getStats(this.player,this.context());}
 input(){
  window.addEventListener('resize',()=>this.renderer.resize(this.state==='playing'||this.state==='paused'));
  window.addEventListener('keydown',event=>{
   if(event.target.matches?.('input,textarea,select'))return;
   const key=event.key.length===1?event.key.toLowerCase():event.key;
   if([' ','ArrowUp','ArrowDown','ArrowLeft','ArrowRight'].includes(key))event.preventDefault();
   this.keys.add(key);this.sound.unlock();if(event.repeat)return;
   if(key==='Escape'){this.emit('escape');return;}if(this.state!=='playing')return;
   if(key==='e')this.interact();if(key==='q')this.ability();if(key==='c')this.emit('stats');if(key==='m')this.emit('map');if(key==='j')this.emit('journal');
   if(key==='b')this.emit('craft');if(key==='i')this.emit('inventory');
   if(['1','2','3','4','5','6'].includes(key))this.equip(['fists','bow','sword','stone','axe','pickaxe'][+key-1]);
  });
  window.addEventListener('keyup',e=>this.keys.delete(e.key.length===1?e.key.toLowerCase():e.key));
  window.addEventListener('blur',()=>{this.keys.clear();this.mouseHeld=false;if(this.state==='playing')this.emit('pause');});
  document.addEventListener('visibilitychange',()=>{if(document.hidden){this.keys.clear();this.mouseHeld=false;if(this.state==='playing')this.emit('pause');}});
  this.canvas.addEventListener('pointerdown',e=>{if(this.state!=='playing'||e.button!==0)return;this.sound.unlock();this.mouseHeld=true;this.setAim(e);});
  this.canvas.addEventListener('pointermove',e=>{if(this.mouseHeld)this.setAim(e);});
  window.addEventListener('pointerup',()=>{this.mouseHeld=false;this.aim=null;});this.canvas.addEventListener('contextmenu',e=>e.preventDefault());
 }
 setAim(e){const r=this.canvas.getBoundingClientRect();this.aim={x:(e.clientX-r.left)/r.width*this.canvas.width+this.camera.x,y:(e.clientY-r.top)/r.height*this.canvas.height+this.camera.y};}
 newGame(id){
  this.world=Z.createWorld();this.player=Z.createPlayer(id);Object.assign(this.player,{...this.world.spawn,dir:'down',moving:false,walk:0,attackAnim:0});
  this.biome='village';this.time=0;this.effects=[];this.projectiles=[];this.queuedWaves=[];this.questFlags={};this.currentSlot=null;
  this.enemies=this.world.enemySpawns.map(s=>this.makeEnemy(s));if(this.initSurvival)this.initSurvival();this.keys.clear();this.mouseHeld=false;this.aim=null;this.state='playing';this.renderer.resize(true);this.emit('start');
 }
 makeEnemy(s){const stats=Z.enemyStats(s.type,this.player.level);return{...s,homeX:s.x,homeY:s.y,biome:Z.biomeAt(s.x,s.y),stats,hp:stats.health,maxHp:stats.health,level:stats.level,dir:'down',walk:0,moving:false,dead:false,respawn:0,cooldown:.6,stun:0,charm:0,latched:0,latchRest:0,alert:false,provoked:false,hitFlash:0};}
 pause(){if(this.state==='playing'){this.state='paused';this.keys.clear();this.mouseHeld=false;}}
 resume(){if(this.state==='paused'){this.state='playing';this.keys.clear();this.mouseHeld=false;}}
 update(dt){
  if(this.state==='menu'||this.state==='characters'){this.time+=dt;this.updateNpcs(dt);return;}if(this.state!=='playing')return;
  this.time+=dt;const p=this.player;p.playTime+=dt;const stats=this.stats();p.hp=Math.min(p.hp,stats.maxHealth);
  for(const k of ['attackCooldown','abilityCooldown','attackAnim','hitFlash','slow','dance','tobi'])p[k]=Math.max(0,(p[k]||0)-dt);
  // Regeneración exacta: cinco pulsos en t=1,2,3,4,5, aun con delta fraccionado.
  if(p.buffs.gero>0){p.healClock=(p.healClock||0)+Math.min(dt,p.buffs.gero);if(p.healClock>=1-1e-8){p.healClock-=1;this.heal(5);}}
  for(const buff of ['gero','pepe','paco'])p.buffs[buff]=Math.max(0,(p.buffs[buff]||0)-dt);
  if(p.poison){p.poison.time-=dt;p.poison.tick-=dt;if(p.poison.tick<=1e-8){p.poison.tick+=1;this.hurtPlayer(p.poison.damage,'snake',true);}if(p.poison&&p.poison.time<=.000001)p.poison=null;if(this.state!=='playing')return;}
  this.updateMovement(dt,stats);if(this.updateSurvival)this.updateSurvival(dt);if(this.state!=='playing')return;
  if(this.keys.has(' ')||this.mouseHeld)this.attack();
  if(this.queuedWaves&&this.queuedWaves.length)this.queuedWaves=this.queuedWaves.filter(w=>{w.delay-=dt;if(w.delay>0)return true;this.wave();return false;});
  this.updateNpcs(dt);this.updateEnemies(dt);if(this.state!=='playing')return;this.updateProjectiles(dt);
  this.effects.forEach(e=>e.life-=dt);this.effects=this.effects.filter(e=>e.life>0);this.sound.update(dt,this.biome);this.checkQuests();
 }
 updateMovement(dt,stats){
  const p=this.player;let x=(this.keys.has('d')||this.keys.has('ArrowRight')?1:0)-(this.keys.has('a')||this.keys.has('ArrowLeft')?1:0);
  let y=(this.keys.has('s')||this.keys.has('ArrowDown')?1:0)-(this.keys.has('w')||this.keys.has('ArrowUp')?1:0);if(p.stomach>0){x=0;y=0;}if(x&&y){x*=Math.SQRT1_2;y*=Math.SQRT1_2;}
  const wantsRun=this.keys.has('Shift')&&(x||y)&&p.exhausted<=0&&p.stamina>0,before={x:p.x,y:p.y};
  this.move(p,x*stats.moveSpeed*(wantsRun?1.25:1)*dt,y*stats.moveSpeed*(wantsRun?1.25:1)*dt,8);
  p.moving=distance(before,p)>.01;p.running=!!wantsRun&&p.moving;if(x||y)p.dir=Math.abs(x)>Math.abs(y)?(x>0?'right':'left'):(y>0?'down':'up');
  if(p.moving){p.walk+=dt*(p.running?13:9);this.stepTime+=dt;if(this.stepTime>.36){this.stepTime=0;this.sound.play('step');}
   if(p.stoneAmmo===0){p.stoneWalkTime+=dt;if(p.stoneWalkTime>=2-1e-8){p.stoneAmmo=1;p.stoneWalkTime=0;this.emit('toast',{message:'Una piedra más para el camino.'});}}}
  if(p.characterId==='fede'&&p.special?.time>0){p.stamina=1;p.exhausted=0;p.restTime=0;}
  else if(p.exhausted>0){p.exhausted=Math.max(0,p.exhausted-dt);p.stamina=1-p.exhausted/10;if(p.exhausted<=0)p.stamina=1;}
  else if(p.running){p.stamina=Math.max(0,p.stamina-dt/stats.runDuration);p.restTime=0;if(p.stamina<=.0001){p.stamina=0;p.exhausted=10;this.emit('toast',{message:'Te quedaste sin aire. Recuperación: 10 segundos.'});}}
  else{p.restTime+=dt;if(p.restTime>=2)p.stamina=Math.min(1,p.stamina+dt/10);}
  const newBiome=Z.biomeAt(p.x,p.y);if(newBiome!==this.biome){const oldMax=this.stats().maxHealth;this.biome=newBiome;const newMax=this.stats().maxHealth;
   if(p.characterId==='paco')p.hp=clamp(p.hp*newMax/oldMax,0,newMax);if(!p.discovered.includes(newBiome))p.discovered.push(newBiome);
   this.emit('biome',{name:names[newBiome],safe:newBiome==='village'});
   if(newBiome==='village'){p.poison=null;p.slow=0;this.enemies.forEach(e=>{if(e.latched>0){e.x=e.homeX;e.y=e.homeY;}e.latched=0;e.alert=false;});}}
 }
 move(entity,dx,dy,radius=8,zone=null,ignoreNpc=null){
  const steps=Math.max(1,Math.ceil(Math.max(Math.abs(dx),Math.abs(dy))/6));for(let i=0;i<steps;i++){
   const nx=entity.x+dx/steps;if((!zone||Z.biomeAt(nx,entity.y)===zone)&&!Z.collides(this.world,nx,entity.y,radius,ignoreNpc))entity.x=nx;
   const ny=entity.y+dy/steps;if((!zone||Z.biomeAt(entity.x,ny)===zone)&&!Z.collides(this.world,entity.x,ny,radius,ignoreNpc))entity.y=ny;}
 }
 updateNpcs(dt){
  this.world.npcs.forEach((n,index)=>{n.wait=(n.wait||0)-dt;
   if(n.wait<=0&&Math.hypot(n.targetX-n.x,n.targetY-n.y)<7){n.wait=2+Math.random()*5;n.targetX=n.homeX+Math.sin(this.time*.17+index*3)*65;n.targetY=n.homeY+Math.cos(this.time*.21+index*2)*55;}
   if(n.wait>0){n.moving=false;return;}const dx=n.targetX-n.x,dy=n.targetY-n.y,len=Math.hypot(dx,dy),before={x:n.x,y:n.y};
   if(len>3){const nx=n.x+dx/len*22*dt,ny=n.y+dy/len*22*dt;if(Math.hypot(nx-this.player.x,ny-this.player.y)>20)this.move(n,nx-n.x,ny-n.y,9,'village',n.id);n.dir=Math.abs(dx)>Math.abs(dy)?(dx>0?'right':'left'):(dy>0?'down':'up');n.walk+=dt*5;}
   n.moving=distance(before,n)>.01;if(!n.moving&&len>7){n.targetX=n.x;n.targetY=n.y;n.wait=1;}
  });
 }
 attack(){
  const p=this.player;if(this.state!=='playing'||p.attackCooldown>0||p.stomach>0)return false;const stats=this.stats(),weapon=Z.WEAPON_TYPES[p.weapon];
  if(p.weapon==='stone'&&!p.stoneAmmo){if(!this.noAmmoNotice||this.time-this.noAmmoNotice>3){this.noAmmoNotice=this.time;this.emit('toast',{message:'Caminá 2 segundos para recoger otra piedra.'});}return false;}
  let[dx,dy]=dirs[p.dir];if(this.aim){const len=distance(this.aim,p);if(len>0){dx=(this.aim.x-p.x)/len;dy=(this.aim.y-p.y)/len;p.dir=Math.abs(dx)>Math.abs(dy)?(dx>0?'right':'left'):(dy>0?'down':'up');}}
  p.attackCooldown=Math.max(stats.attackCooldown*(weapon.cooldownMultiplier||1),p.weapon==='bow'?.7:0);p.attackAnim=.24;const damage=stats.strength*weapon.damageMultiplier;
  if(p.weapon==='bow'||p.weapon==='stone'){
   this.projectiles.push({x:p.x+dx*12,y:p.y-7+dy*12,dx,dy,type:p.weapon,damage,traveled:0,range:weapon.range});
   if(p.weapon==='stone'){p.stoneAmmo=0;p.stoneWalkTime=0;}this.sound.play('bow');
  }else{
   this.effect(p.x+dx*22,p.y-7+dy*22,'slash',.2,{dir:p.dir,radius:weapon.range});
   if(this.harvest)this.harvest(dx,dy,weapon.range);
   this.enemies.forEach(e=>{if(e.dead||e.latched>0)return;const ex=e.x-p.x,ey=e.y-p.y,len=Math.hypot(ex,ey);if(len<=weapon.range&&(len<14||(ex*dx+ey*dy)/len>.2))this.hitEnemy(e,damage);});this.sound.play('swing');
  }return true;
 }
 hitEnemy(e,raw,exact=false){
  if(e.dead||(e.latched>0&&!exact))return;const damage=exact?raw:Z.damageAfterArmor(raw,e.stats.armor);e.hp-=damage;e.hitFlash=.16;e.provoked=true;e.alert=true;
  this.effect(e.x,e.y-23,'hit',.8,{text:this.number(damage)});this.sound.play('hit');
  if(e.type!=='thief'&&!exact){const dx=e.x-this.player.x,dy=e.y-this.player.y,len=Math.hypot(dx,dy)||1;this.move(e,dx/len*18,dy/len*18,7,e.biome);}
  if(e.hp<=0){e.hp=0;e.dead=true;e.respawn=35;e.alert=false;this.player.kills++;this.questFlags['defeat_'+e.type]=true;
   const levels=Z.grantXp(this.player,e.stats.xp,this.context());this.effect(e.x,e.y-38,'heal',1.1,{text:'+'+this.number(e.stats.xp*this.stats().xpMultiplier)+' EXP'});
   if(this.player.characterId==='pepe'){this.heal(5);this.player.buffs.pepe=3;}if(levels)this.onLevel(levels);}
 }
 onLevel(){
  this.sound.play('level');this.effect(this.player.x,this.player.y,'level',1.4,{radius:50});this.emit('toast',{message:'¡Nivel '+this.player.level+'! Tenés '+this.player.points+' punto(s) para mejorar. Presioná C.'});
  this.enemies.forEach(e=>{const stats=Z.enemyStats(e.type,this.player.level),ratio=e.hp/e.maxHp;e.stats=stats;e.level=stats.level;e.maxHp=stats.health;if(!e.dead)e.hp=Math.max(1,ratio*stats.health);});
 }
 updateEnemies(dt){
  const p=this.player;for(const e of this.enemies){
   if(e.dead){e.respawn-=dt;if(e.respawn<=0&&distance({x:e.homeX,y:e.homeY},p)>230)Object.assign(e,this.makeEnemy({id:e.id,type:e.type,x:e.homeX,y:e.homeY}));continue;}
   e.cooldown=Math.max(0,e.cooldown-dt);e.hitFlash=Math.max(0,e.hitFlash-dt);e.latchRest=Math.max(0,e.latchRest-dt);e.stun=Math.max(0,e.stun-dt);e.charm=Math.max(0,e.charm-dt);e.moving=false;
   if(e.stun>0||e.freeze>0){e.alert=false;continue;}const sameZone=e.biome===this.biome&&this.biome!=='village';
   if(e.latched>0){
    if(!sameZone){e.latched=0;e.x=e.homeX;e.y=e.homeY;continue;}e.latched=Math.max(0,e.latched-dt);e.x=p.x+5;e.y=p.y-8;
    if(this.specialContact)this.specialContact(e);if(e.dead){e.latched=0;continue;}
    if(e.latched>1e-8&&e.cooldown<=0)this.enemyAttack(e);if(this.state!=='playing')break;
    if(e.latched<=1e-8){e.latched=0;e.latchRest=1.6;e.cooldown=.6;const[dx,dy]=dirs[p.dir];e.x=p.x;e.y=p.y;this.move(e,-dx*85,-dy*85,7,e.biome);if(distance(e,p)<28){e.x=e.homeX;e.y=e.homeY;}}continue;
   }
   const len=distance(e,p),ratFlees=e.type==='rat'&&p.characterId==='tena',ratIgnores=e.type==='rat'&&p.characterId==='gero'&&!e.provoked;
   const smoky=this.inGroundEffect(e,'smoke'),vision=smoky?88:195,leash=smoky?120:320;
   const fleeing=sameZone&&len<210&&(e.charm>0||ratFlees);e.alert=sameZone&&!ratIgnores&&!fleeing&&(len<vision||(e.alert&&len<leash));
   let tx,ty,velocity=e.stats.moveSpeed*(this.inGroundEffect(e,'milk')?.5:1);
   if(fleeing){tx=e.x+(e.x-p.x);ty=e.y+(e.y-p.y);}else if(e.alert){tx=p.x;ty=p.y;}else{tx=e.homeX+Math.sin(this.time*.2+e.homeX)*28;ty=e.homeY+Math.cos(this.time*.15+e.homeY)*22;velocity*=.28;}
   const dx=tx-e.x,dy=ty-e.y,targetDistance=Math.hypot(dx,dy);
   if(targetDistance>3&&!(e.alert&&len<16)){const before={x:e.x,y:e.y};this.move(e,dx/targetDistance*velocity*dt,dy/targetDistance*velocity*dt,7,e.biome);
    if(distance(before,e)<.05&&e.alert)this.move(e,-dy/targetDistance*velocity*dt,dx/targetDistance*velocity*dt,7,e.biome);
    e.dir=Math.abs(dx)>Math.abs(dy)?(dx>0?'right':'left'):(dy>0?'down':'up');e.moving=distance(before,e)>.01;e.walk+=dt*9;}
   if(this.specialContact)this.specialContact(e,dt);if(e.dead)continue;
   if(e.alert&&distance(e,p)<22&&e.cooldown<=0){if(e.type==='rat'){if(e.latchRest<=0){e.latched=3;this.enemyAttack(e);this.emit('toast',{message:'¡Una rata se te prendió! Se suelta en 3 segundos.'});}}else this.enemyAttack(e);}
   if(this.state!=='playing')break;
  }
 }
 inGroundEffect(entity,type){return(this.groundEffects||[]).some(effect=>effect.type===type&&effect.time>0&&distance(effect,entity)<=effect.radius);}
 enemyAttack(e){
  if(this.biome==='village'||e.stun>0||e.freeze>0||e.charm>0)return;e.cooldown=this.inGroundEffect(e,'milk')?Z.speedBand(e.stats.speed*.5).attackCooldown:e.stats.attackCooldown;const p=this.player;let raw=e.stats.strength;
  if(e.type==='dog'&&p.characterId==='pepe')raw*=1.1;this.hurtPlayer(raw,e.type);if(this.state!=='playing')return;
  if(e.type==='dog')p.slow=4;
  if(e.type==='snake'&&Math.random()<(p.characterId==='fede'?.15:.4)){p.poison={time:5,tick:1,damage:e.stats.poison};this.emit('toast',{message:'Envenenado: '+e.stats.poison+' de vida por segundo durante 5 s.',error:true});}
 }
 hurtPlayer(raw,source,poison=false,self=false){
  if(this.state!=='playing'||(this.biome==='village'&&!self)||!Number.isFinite(raw)||raw<=0)return;
  const special=this.player.special;
  if(special?.id==='gero'&&special.time>0&&special.shield>0){const absorbed=Math.min(raw,special.shield);special.shield-=absorbed;raw-=absorbed;this.effect(this.player.x,this.player.y-32,'shield',.65,{text:'−'+this.number(absorbed)});}
  if(raw<=0)return;const damage=poison?raw:Z.damageAfterArmor(raw,this.stats().armor);
  this.player.hp=Math.max(0,this.player.hp-damage);this.player.hitFlash=.22;this.effect(this.player.x,this.player.y-29,'hit',.8,{text:'-'+this.number(damage),poison});this.sound.play('hurt');if(this.player.hp<=0)this.knockout(source);
 }
 knockout(source){
  const p=this.player;p.deaths++;const quote=source==='thief'?'Uhh... este gil me sacó guita':source==='dog'?'¿Por qué Firulais? :c':source==='snake'?'La próxima miro dónde piso...':source==='self'?'Me ganó el estómago. Hay días y días.':'Me ganaron las ratas. No se lo cuenten a nadie.';
  const dropX=p.x,dropY=p.y;if(this.dropInventory)this.dropInventory(dropX,dropY);p.special=null;p.stomach=0;p.dance=0;p.tobi=0;
  Object.assign(p,this.world.spawn,{hp:1,poison:null,slow:0,stamina:1,exhausted:0,restTime:0,attackCooldown:0,moving:false});p.buffs={gero:0,pepe:0,paco:0,pacoAnimals:0};this.biome='village';p.hp=this.stats().maxHealth;
  this.enemies.forEach(e=>{if(!e.dead){e.x=e.homeX;e.y=e.homeY;}e.latched=0;e.alert=false;});this.queuedWaves=[];this.projectiles=[];this.state='paused';this.keys.clear();this.mouseHeld=false;this.emit('knockout',{source,quote,x:dropX,y:dropY});
 }
 heal(amount){const before=this.player.hp;this.player.hp=Math.min(this.stats().maxHealth,before+amount);if(this.player.hp>before)this.effect(this.player.x,this.player.y-30,'heal',.9,{text:'+'+this.number(this.player.hp-before)});}
 updateProjectiles(dt){
  this.projectiles=this.projectiles.filter(p=>{const speed=p.type==='bow'?330:235,travel=speed*dt;p.x+=p.dx*travel;p.y+=p.dy*travel;p.traveled+=travel;
   if(p.traveled>p.range||Z.collides(this.world,p.x,p.y,2))return false;const enemy=this.enemies.find(e=>!e.dead&&!e.latched&&Math.hypot(e.x-p.x,e.y-6-p.y)<14);if(enemy){this.hitEnemy(enemy,p.damage);return false;}return true;});
 }
 ability(){
  if(this.state!=='playing'||this.player.stomach>0)return;const p=this.player,c=Z.CHARACTERS.find(c=>c.id===p.characterId);
  if(c.abilityPassive){this.emit('toast',{message:c.ability+' es una habilidad pasiva: se activa sola.'});return;}
  if(p.abilityCooldown>0){this.emit('toast',{message:c.ability+' estará lista en '+Math.ceil(p.abilityCooldown)+' s.'});return;}
  p.abilityCooldown=c.abilityCooldown;this.sound.play('ability');
  if(p.characterId==='gero'){p.buffs.gero=5;p.healClock=0;}
  if(p.characterId==='paco'){let count=0;this.enemies.forEach(e=>{if(!e.dead&&e.type!=='thief'&&distance(e,p)<=c.abilityRadius&&e.biome===this.biome){e.charm=10;e.latched=0;e.alert=false;count++;this.effect(e.x,e.y-25,'heart',1.4);}});p.buffs.paco=10;p.buffs.pacoAnimals=count;this.effect(p.x,p.y,'wave',.8,{radius:c.abilityRadius});this.emit('toast',{message:count+' animales encantados. +'+count*2+' de fuerza por 10 s.'});}
  if(p.characterId==='tena'){this.enemies.forEach(e=>{if(!e.dead&&distance(e,p)<=c.abilityRadius&&e.biome===this.biome){e.stun=7;e.latched=0;e.alert=false;}});p.dance=7;this.effect(p.x,p.y,'wave',1,{radius:c.abilityRadius});}
  if(p.characterId==='dante'){this.wave();this.queuedWaves=[{delay:.55},{delay:1.1}];}this.emit('toast',{message:'✦ '+c.ability});
 }
 wave(){const p=this.player;p.attackAnim=.45;p.tobi=.45;this.effect(p.x,p.y,'wave',.65,{radius:165});this.sound.play('wave');this.enemies.forEach(e=>{if(!e.dead&&distance(e,p)<=165&&e.biome===this.biome)this.hitEnemy(e,10,true);});}
 equip(weapon){if(this.player.weapons.includes(weapon)){this.player.weapon=weapon;this.emit('tick');}else this.emit('toast',{message:'Todavía no encontraste esa arma.'});}
 interact(){
  if(this.state!=='playing')return;const item=Z.nearbyInteractable(this.world,this.player.x,this.player.y,46);if(!item)return;
  if(item.type==='lootBag'){if(this.recoverBag)this.recoverBag(item);return;}
  if(item.type==='special'){if(this.consumeSpecial)this.consumeSpecial(item);return;}
  if(item.type==='well'){this.heal(this.stats().maxHealth);this.player.poison=null;this.player.stamina=1;this.player.exhausted=0;this.sound.play('pickup');this.emit('toast',{message:'Agua fresca, vida y energía renovadas.'});return;}
  if(item.type==='sign'){this.emit('toast',{message:item.text||'Todos los caminos empiezan en Los Aromos.'});return;}
  if(item.type==='herb'){if(this.player.hp>=this.stats().maxHealth&&!this.player.poison){this.emit('toast',{message:'Guardala para después: ya tenés toda la vida.'});return;}item.collected=true;item.respawn=10;this.heal(25);this.player.poison=null;this.sound.play('pickup');this.emit('toast',{message:'Hierba medicinal: +25 vida y veneno curado.'});return;}
  if(Z.WEAPON_TYPES[item.type]){if(this.player.weapons.includes(item.type)){this.emit('toast',{message:'Ya tenés '+Z.WEAPON_TYPES[item.type].name.toLowerCase()+'.'});return;}item.collected=true;this.player.weapons.push(item.type);this.player.weaponOrigins=this.player.weaponOrigins||{};this.player.weaponOrigins[item.type]='world';this.equip(item.type);this.sound.play('pickup');this.emit('toast',{message:'¡Conseguiste '+Z.WEAPON_TYPES[item.type].name.toLowerCase()+'! '+Z.WEAPON_TYPES[item.type].description});}
 }
 effect(x,y,type,life,extra={}){if(!this.settings.particles&&!extra.text&&type!=='wave'&&type!=='slash')return;this.effects.push({x,y,type,life,maxLife:life,...extra});}
 number(n){return Number.isInteger(n)?String(n):n.toFixed(1).replace('.0','');}
 quests(){return[
  {id:'bow',title:'Un regalo para el camino',detail:'Recogé el arco junto a la plaza de la aldea.',done:this.player.weapons.includes('bow')},
  {id:'cave',title:'Donde no llega el sol',detail:'Seguí el camino al norte y entrá a la Cueva del Eco.',done:this.player.discovered.includes('cave')},
  {id:'stone',title:'Algo es algo',detail:'Encontrá las piedras cerca de la entrada de la cueva.',done:this.player.weapons.includes('stone')},
  {id:'weeds',title:'Más allá del último cerco',detail:'Tomá el camino al este para descubrir Los Yuyos.',done:this.player.discovered.includes('weeds')},
  {id:'sword',title:'El filo entre los pastos',detail:'Encontrá la espada en Los Yuyos.',done:this.player.weapons.includes('sword')},
  {id:'bestiary',title:'Anécdotas para el fogón',detail:'Derrotá al menos un chorro, perro, serpiente y rata.',done:['thief','dog','snake','rat'].every(t=>this.questFlags['defeat_'+t])},
  {id:'level5',title:'Ya no sos el mismo',detail:'Llegá al nivel 5 con tu personaje.',done:this.player.level>=5}
 ].map(quest=>({...quest,done:quest.done||!!this.questFlags['quest_'+quest.id]}));}
 checkQuests(){for(const q of this.quests())if(q.done&&!this.questFlags['quest_'+q.id]){this.questFlags['quest_'+q.id]=true;this.emit('toast',{message:'Diario actualizado: '+q.title});this.sound.play('pickup');}if(this.quests().every(q=>q.done)&&!this.questFlags.complete){this.questFlags.complete=true;this.emit('complete');}}
 snapshot(){return JSON.parse(JSON.stringify({version:2,balanceVersion:Z.BALANCE_VERSION||2,savedAt:new Date().toISOString(),player:this.player,time:this.time,queuedWaves:this.queuedWaves||[],questFlags:this.questFlags,collected:this.world.pickups.filter(p=>p.collected).map(p=>p.id),enemies:this.enemies.map(e=>({id:e.id,hp:e.hp,dead:e.dead,respawn:e.respawn,x:e.x,y:e.y,provoked:e.provoked,cooldown:e.cooldown,stun:e.stun,charm:e.charm,latched:e.latched,latchRest:e.latchRest,alert:e.alert})),survival:this.serializeSurvival?this.serializeSurvival():null}));}
 static validateSave(data){
  if(!data||![1,2].includes(data.version)||!data.player||!Array.isArray(data.collected)||!Array.isArray(data.enemies))throw new Error('El archivo no es una partida válida de Zak’s Throne.');
  const p=data.player,isNumber=n=>typeof n==='number'&&Number.isFinite(n);if(!Z.CHARACTERS.some(c=>c.id===p.characterId))throw new Error('Personaje desconocido.');
  for(const k of ['level','xp','points','hp','x','y','stamina'])if(!isNumber(p[k]))throw new Error('La partida tiene datos incompletos.');
  if(!Number.isInteger(p.level)||p.level<1||!Number.isSafeInteger(p.level)||p.xp<0||p.xp>=Z.xpNeeded(p.level)||!Number.isInteger(p.points)||p.points<0||p.hp<=0||p.hp>500||p.x<10||p.x>2390||p.y<10||p.y>1790)throw new Error('La partida contiene valores fuera de rango.');
  if(!p.stats)throw new Error('Faltan las estadísticas.');
  for(const k of Object.keys(Z.STAT_LABELS))if(!isNumber(p.stats[k])||p.stats[k]<0||p.stats[k]>(k==='health'?500:k==='intelligence'?Number.MAX_SAFE_INTEGER:100))throw new Error('Estadísticas inválidas.');
  if(p.stats.health<1)throw new Error('La vida máxima debe ser positiva.');
  if(!Array.isArray(p.weapons)||!p.weapons.includes('fists')||!p.weapons.every(w=>Object.hasOwn(Z.WEAPON_TYPES,w))||!p.weapons.includes(p.weapon))throw new Error('Inventario inválido.');
  if(data.enemies.length>100||data.collected.length>500)throw new Error('El archivo es demasiado grande.');
  if(data.survival!=null){if(!Z.validateSurvivalSave)throw new Error('No se pudo cargar el sistema de inventario.');Z.validateSurvivalSave(data.survival,p);}
  return true;
 }
 restore(data,slot=null){
  Game.validateSave(data);const source=data.player,p=Z.createPlayer(source.characterId);
  for(const k of ['level','xp','points','hp','x','y','stamina'])p[k]=source[k];for(const k of Object.keys(Z.STAT_LABELS))p.stats[k]=source.stats[k];
  for(const k of ['kills','deaths','playTime','abilityCooldown','attackCooldown','stoneWalkTime','restTime','slow','exhausted'])p[k]=typeof source[k]==='number'&&Number.isFinite(source[k])?clamp(source[k],0,1e9):0;
  p.abilityCooldown=Math.min(p.abilityCooldown,30);p.attackCooldown=Math.min(p.attackCooldown,4.05);p.slow=Math.min(p.slow,4);p.exhausted=Math.min(p.exhausted,10);p.stamina=clamp(p.stamina,0,1);p.stoneWalkTime=clamp(p.stoneWalkTime,0,2);
  p.weapon=source.weapon;p.weapons=[...new Set(source.weapons)];p.stoneAmmo=source.stoneAmmo===0?0:1;
  p.discovered=Array.isArray(source.discovered)?source.discovered.filter(z=>Object.hasOwn(names,z)):['village'];p.dir=Object.hasOwn(dirs,source.dir)?source.dir:'down';p.walk=0;p.moving=false;p.attackAnim=0;
  if(source.buffs)for(const key of ['gero','pepe','paco','pacoAnimals'])p.buffs[key]=clamp(Number(source.buffs[key])||0,0,key==='pacoAnimals'?25:10);
  p.healClock=clamp(Number(source.healClock)||0,0,1);
  if(source.poison&&Number.isFinite(source.poison.damage))p.poison={time:clamp(Number(source.poison.time)||0,0,5),tick:clamp(Number(source.poison.tick)||1,.01,1),damage:clamp(source.poison.damage,0,100)};
  this.player=p;this.world=Z.createWorld();this.biome=Z.biomeAt(p.x,p.y);
  if(data.version===1)this.migrateLegacyPlayer(p);
  if(this.biome==='village'){p.poison=null;p.slow=0;}this.time=Number.isFinite(data.time)?clamp(data.time,0,1e9):0;this.questFlags={};
  if(data.questFlags&&typeof data.questFlags==='object')for(const k of Object.keys(data.questFlags))if(/^(quest_(bow|cave|stone|weeds|sword|bestiary|level5)|defeat_(thief|dog|snake|rat)|complete)$/.test(k))this.questFlags[k]=data.questFlags[k]===true;
  this.world.pickups.forEach(i=>i.collected=data.collected.includes(i.id));this.enemies=this.world.enemySpawns.map(spawn=>{
   const e=this.makeEnemy(spawn),saved=data.enemies.find(i=>i&&i.id===e.id);if(saved){if(Number.isFinite(saved.hp)){const oldHealth={thief:[100,3],dog:[90,2],snake:[35,1],rat:[10,.5]}[e.type];const oldMax=Math.min(500,oldHealth[0]+oldHealth[1]*Math.floor((p.level-1)/2));e.hp=clamp(data.version===1?saved.hp/oldMax*e.maxHp:saved.hp,0,e.maxHp);}e.dead=saved.dead===true||e.hp<=0;e.respawn=clamp(Number(saved.respawn)||0,0,35);e.provoked=saved.provoked===true;e.cooldown=clamp(Number(saved.cooldown)||0,0,3);e.stun=clamp(Number(saved.stun)||0,0,7);e.charm=clamp(Number(saved.charm)||0,0,10);e.latched=clamp(Number(saved.latched)||0,0,3);e.latchRest=clamp(Number(saved.latchRest)||0,0,1.6);e.alert=saved.alert===true;if(this.biome==='village'||e.dead)e.latched=0;
   }
   return e;});
  if(this.initSurvival)this.initSurvival();if(this.restoreSurvival)this.restoreSurvival(data.survival||null);
  for(const e of this.enemies){const saved=data.enemies.find(i=>i&&i.id===e.id);if(saved&&Number.isFinite(saved.x)&&Number.isFinite(saved.y)&&Z.biomeAt(saved.x,saved.y)===e.biome&&!Z.collides(this.world,saved.x,saved.y,7)){e.x=saved.x;e.y=saved.y;}}
  if(Z.collides(this.world,p.x,p.y,8)){Object.assign(p,this.world.spawn);this.biome='village';}
  if(this.biome==='village'){p.poison=null;p.slow=0;}
  this.effects=[];this.projectiles=[];this.queuedWaves=Array.isArray(data.queuedWaves)&&p.characterId==='dante'?data.queuedWaves.slice(0,2).filter(w=>w&&Number.isFinite(w.delay)).map(w=>({delay:clamp(w.delay,0,1.1)})):[];this.currentSlot=slot;this.keys.clear();this.mouseHeld=false;this.aim=null;this.state='playing';this.renderer.resize(true);this.emit('start',{loaded:true,migrated:data.version===1});
 }
 migrateLegacyPlayer(p){
  const old=Z.LEGACY_CHAR_STATS?.[p.characterId],base=Z.CHARACTERS.find(c=>c.id===p.characterId)?.stats;if(!old||!base)return;
  const oldMax=Math.min(500,p.stats.health*(p.characterId==='paco'&&this.biome==='weeds'?1.15:1)),healthRatio=p.hp/oldMax;
  for(const key of Object.keys(Z.STAT_LABELS)){
   const investment=Math.max(0,p.stats[key]-old[key]);
   const increased=base[key]+investment*(key==='speed'||key==='endurance'?2:1)+(key==='strength'?p.level-1:0);
   p.stats[key]=Math.min(key==='health'?500:key==='intelligence'?Number.MAX_SAFE_INTEGER:100,increased);
  }
  p.points+=p.level-1;p.hp=Math.min(this.stats().maxHealth,Math.max(1,this.stats().maxHealth*healthRatio));
 }
}
Z.Game=Game;
})();
