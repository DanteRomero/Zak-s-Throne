/* Motor de simulación, combate, IA y persistencia de Zak's Throne. */
(function () {
'use strict';
const Z = window.Zak, clamp = (v,a,b) => Math.max(a,Math.min(b,v));
const distance = (a,b) => Math.hypot(a.x-b.x,a.y-b.y);
const dirs = {down:[0,1],up:[0,-1],left:[-1,0],right:[1,0]};
const names = Z.BIOME_NAMES = {village:'Aldea de los Aromos',cave:'Cueva del Eco',weeds:'Los Yuyos'};
const ROLL_TIME=.3,ROLL_COOLDOWN=.55,ROLL_COST=.2,COMBO_CRIT=4,CRIT_MULTIPLIER=1.75,HERB_REGROW=90,TAIL_RADIUS=62;
const isBoss = e => !!(Z.ENEMY_TYPES[e.type]&&Z.ENEMY_TYPES[e.type].boss);
class Sound {
 constructor(){this.enabled=false;this.ctx=null;this.ambientTime=0;this.lastCoin=0;}
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
  if(kind==='crit'){this.tone(520,.08,'square',.04,0,260);this.tone(160,.18,'triangle',.09,.03,50);}
  if(kind==='hurt')this.tone(110,.2,'sawtooth',.035,0,50);
  if(kind==='swing')this.tone(270,.08,'triangle',.035,0,90);
  if(kind==='bow')this.tone(360,.14,'triangle',.055,0,90);
  if(kind==='roll')this.tone(240,.16,'sine',.04,0,120);
  if(kind==='dodge')[660,880].forEach((n,i)=>this.tone(n,.08,'sine',.035,i*.05));
  if(kind==='coin'){const now=this.ctx?this.ctx.currentTime:0;if(now-this.lastCoin<.06)return;this.lastCoin=now;this.tone(988,.06,'square',.025);this.tone(1319,.12,'square',.025,.05);}
  if(kind==='buy')[523,784,1047].forEach((n,i)=>this.tone(n,.14,'square',.03,i*.06));
  if(kind==='alert')this.tone(440,.09,'triangle',.035,0,660);
  if(kind==='telegraph')this.tone(150,.5,'sawtooth',.04,0,300);
  if(kind==='spit')this.tone(300,.2,'sawtooth',.03,0,120);
  if(kind==='death')this.tone(220,.25,'triangle',.05,0,70);
  if(kind==='boss')[196,185,175,165].forEach((n,i)=>this.tone(n,.35,'sawtooth',.03,i*.18));
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
  this.settings={sound:false,particles:true,shake:true,tutorial:true,fullscreen:true,controls:'small'};this.keys=new Set();this.camera={x:0,y:0};this.state='menu';this.time=0;
  this.onEvent=()=>{};this.aim=null;this.mouseHeld=false;this.stick={x:0,y:0};this.runToggle=false;this.touchMode=false;this.effects=[];this.projectiles=[];this.drops=[];this.shakeTime=0;this.shakePower=0;this.hurtFlash=0;
  this.world=Z.createWorld();this.player=Z.createPlayer('paco');
  Object.assign(this.player,{x:770,y:950,dir:'down',walk:0,moving:false,attackAnim:0});
  this.biome='village';this.enemies=[];this.questFlags={};this.stepTime=0;this.last=0;this.accumulator=0;this.uiTimer=0;this.input();
  const loop=now=>{const dt=this.last?Math.min((now-this.last)/1000,.12):0;this.last=now;this.accumulator+=dt;
   while(this.accumulator>=1/60){this.update(1/60);this.accumulator-=1/60;}
   this.renderer.draw(this,dt);this.uiTimer+=dt;if(this.uiTimer>.09){this.uiTimer=0;this.emit('tick');}this.frame=requestAnimationFrame(loop);};
  this.frame=requestAnimationFrame(loop);
 }
 emit(type,detail={}){this.onEvent(type,detail);}
 context(){return{biome:this.biome,pursuers:this.enemies.filter(e=>!e.dead&&e.alert&&!e.charm&&!e.stun).length};}
 stats(){return Z.getStats(this.player,this.context());}
 input(){
  window.addEventListener('resize',()=>this.renderer.resize(this.state==='playing'||this.state==='paused'));
  window.addEventListener('keydown',event=>{
   if(event.target.matches('input,textarea,select'))return;
   const key=event.key.length===1?event.key.toLowerCase():event.key;
   if([' ','ArrowUp','ArrowDown','ArrowLeft','ArrowRight'].includes(key))event.preventDefault();
   this.keys.add(key);this.sound.unlock();if(event.repeat)return;
   if(key==='Escape'){this.emit('escape');return;}if(this.state!=='playing')return;
   if(key==='e')this.interact();if(key==='q')this.ability();if(key==='f')this.roll();if(key==='r')this.useHerb();
   if(key==='c')this.emit('stats');if(key==='m')this.emit('map');if(key==='j')this.emit('journal');
   if(['1','2','3','4'].includes(key))this.equip(['fists','bow','sword','stone'][+key-1]);
  });
  window.addEventListener('keyup',e=>this.keys.delete(e.key.length===1?e.key.toLowerCase():e.key));
  window.addEventListener('blur',()=>{this.clearInput();if(this.state==='playing')this.emit('pause');});
  document.addEventListener('visibilitychange',()=>{if(document.hidden){this.clearInput();if(this.state==='playing')this.emit('pause');}});
  this.canvas.addEventListener('pointerdown',e=>{if(this.state!=='playing')return;this.sound.unlock();if(e.pointerType==='touch')this.touchMode=true;
   if(e.button===2){this.setAim(e);const aim=this.aim;this.aim=null;this.roll(aim);return;}
   if(e.button!==0)return;this.mouseHeld=true;this.setAim(e);});
  this.canvas.addEventListener('pointermove',e=>{if(this.mouseHeld)this.setAim(e);});
  window.addEventListener('pointerup',()=>{this.mouseHeld=false;this.aim=null;});this.canvas.addEventListener('contextmenu',e=>e.preventDefault());
 }
 setAim(e){const r=this.canvas.getBoundingClientRect();this.aim={x:(e.clientX-r.left)/r.width*this.canvas.width+this.camera.x,y:(e.clientY-r.top)/r.height*this.canvas.height+this.camera.y};}
 newGame(id){
  this.world=Z.createWorld();this.player=Z.createPlayer(id);Object.assign(this.player,{...this.world.spawn,dir:'down',moving:false,walk:0,attackAnim:0,runId:(window.crypto&&crypto.randomUUID)?crypto.randomUUID():Date.now().toString(36)+Math.random().toString(36).slice(2,12)});
  this.biome='village';this.time=0;this.effects=[];this.projectiles=[];this.drops=[];this.queuedWaves=[];this.questFlags={};this.currentSlot=null;
  this.enemies=this.world.enemySpawns.map(s=>this.makeEnemy(s));this.clearInput();this.aim=null;this.state='playing';this.renderer.resize(true);this.emit('start');
 }
 makeEnemy(s){const stats=Z.enemyStats(s.type,this.player.level);return{...s,homeX:s.x,homeY:s.y,biome:Z.biomeAt(s.x,s.y),stats,hp:stats.health,maxHp:stats.health,level:stats.level,dir:'down',walk:0,moving:false,dead:false,respawn:0,cooldown:.6,stun:0,charm:0,latched:0,latchRest:0,alert:false,provoked:false,hitFlash:0,special:2.5,telegraph:0,dash:0,aimX:0,aimY:1};}
 pause(){if(this.state==='playing'){this.state='paused';this.clearInput();}}
 resume(){if(this.state==='paused'){this.state='playing';this.clearInput();}}
 vibrate(ms){if(this.touchMode&&this.settings.shake&&navigator.vibrate)try{navigator.vibrate(ms);}catch(_){}}
 shake(power,time=.25){if(!this.settings.shake)return;this.shakePower=Math.max(this.shakePower*(this.shakeTime>0?1:0),power);this.shakeTime=Math.max(this.shakeTime,time);}
 update(dt){
  if(this.state==='menu'||this.state==='characters'){this.time+=dt;this.updateNpcs(dt);return;}if(this.state!=='playing')return;
  this.time+=dt;const p=this.player;p.playTime+=dt;const stats=this.stats();p.hp=Math.min(p.hp,stats.maxHealth);
  for(const k of ['attackCooldown','abilityCooldown','attackAnim','hitFlash','slow','dance','tobi','roll','rollCooldown','comboTime'])p[k]=Math.max(0,(p[k]||0)-dt);
  if(p.comboTime<=0)p.combo=0;
  // Regeneración exacta: cinco pulsos en t=1,2,3,4,5, aun con delta fraccionado.
  if(p.buffs.gero>0){p.healClock=(p.healClock||0)+Math.min(dt,p.buffs.gero);if(p.healClock>=1-1e-8){p.healClock-=1;this.heal(5);}}
  for(const buff of ['gero','pepe','paco','mate'])p.buffs[buff]=Math.max(0,(p.buffs[buff]||0)-dt);
  if(p.poison){p.poison.time-=dt;p.poison.tick-=dt;if(p.poison.tick<=1e-8){p.poison.tick+=1;this.hurtPlayer(p.poison.damage,'snake',true);}if(p.poison&&p.poison.time<=.000001)p.poison=null;if(this.state!=='playing')return;}
  this.updateMovement(dt,stats);if((this.keys.has(' ')||this.mouseHeld)&&p.roll<=0)this.attack();
  if(this.queuedWaves&&this.queuedWaves.length)this.queuedWaves=this.queuedWaves.filter(w=>{w.delay-=dt;if(w.delay>0)return true;this.wave();return false;});
  this.updateNpcs(dt);this.updateEnemies(dt);if(this.state!=='playing')return;this.updateProjectiles(dt);if(this.state!=='playing')return;this.updateDrops(dt);
  for(const item of this.world.pickups)if(item.type==='herb'&&item.collected&&item.regrow>0){item.regrow-=dt;if(item.regrow<=0)item.collected=false;}
  this.effects.forEach(e=>e.life-=dt);this.effects=this.effects.filter(e=>e.life>0);this.sound.update(dt,this.biome);this.checkQuests();
 }
 movementInput(){
  let x=(this.keys.has('d')||this.keys.has('ArrowRight')?1:0)-(this.keys.has('a')||this.keys.has('ArrowLeft')?1:0);
  let y=(this.keys.has('s')||this.keys.has('ArrowDown')?1:0)-(this.keys.has('w')||this.keys.has('ArrowUp')?1:0);if(x&&y){x*=Math.SQRT1_2;y*=Math.SQRT1_2;}
  // El joystick táctil es analógico: inclinarlo poco camina más despacio.
  if(!x&&!y&&this.stick){const len=Math.hypot(this.stick.x,this.stick.y);if(len>.18){const scale=Math.min(1,(len-.18)/.55+.35)/len;x=this.stick.x*scale;y=this.stick.y*scale;}}
  return[x,y];
 }
 wantsToRun(){return this.keys.has('Shift')||this.runToggle;}
 clearInput(){this.keys.clear();this.mouseHeld=false;this.stick={x:0,y:0};}
 // En pantallas táctiles el ataque apunta solo al enemigo más cercano a tiro.
 autoAim(range){
  const p=this.player;let best=null,bestDistance=range;
  for(const e of this.enemies){if(e.dead||e.latched>0||e.biome!==this.biome)continue;const d=distance(e,p);if(d<=bestDistance){best=e;bestDistance=d;}}
  return best?{x:best.x,y:best.y-6}:null;
 }
 cycleWeapon(){const owned=['fists','bow','sword','stone'].filter(w=>this.player.weapons.includes(w));const next=owned[(owned.indexOf(this.player.weapon)+1)%owned.length];this.equip(next);return next;}
 updateMovement(dt,stats){
  const p=this.player;let[x,y]=this.movementInput();
  const before={x:p.x,y:p.y};let wantsRun=false;
  if(p.roll>0){const speed=Math.max(230,stats.moveSpeed*2.4);this.move(p,p.rollX*speed*dt,p.rollY*speed*dt,8);x=0;y=0;}
  else{wantsRun=this.wantsToRun()&&(x||y)&&p.exhausted<=0&&p.stamina>0;this.move(p,x*stats.moveSpeed*(wantsRun?1.25:1)*dt,y*stats.moveSpeed*(wantsRun?1.25:1)*dt,8);}
  p.moving=distance(before,p)>.01;p.running=!!wantsRun&&p.moving;if(x||y)p.dir=Math.abs(x)>Math.abs(y)?(x>0?'right':'left'):(y>0?'down':'up');
  if(p.moving){p.walk+=dt*(p.running?13:9);this.stepTime+=dt;if(this.stepTime>.36){this.stepTime=0;this.sound.play('step');if(p.running&&this.biome!=='village')this.effect(p.x-p.rollX*4,p.y,'dust',.4);}
   if(p.stoneAmmo===0){p.stoneWalkTime+=dt;if(p.stoneWalkTime>=2-1e-8){p.stoneAmmo=1;p.stoneWalkTime=0;this.emit('toast',{message:'Una piedra más para el camino.'});}}}
  if(p.exhausted>0){p.exhausted=Math.max(0,p.exhausted-dt);p.stamina=1-p.exhausted/10;if(p.exhausted<=0)p.stamina=1;}
  else if(p.running){p.stamina=Math.max(0,p.stamina-dt/stats.runDuration);p.restTime=0;if(p.stamina<=.0001){p.stamina=0;p.exhausted=10;this.emit('toast',{message:'Te quedaste sin aire. Recuperación: 10 segundos.'});}}
  else if(p.roll<=0){p.restTime+=dt;if(p.restTime>=2)p.stamina=Math.min(1,p.stamina+dt/10);}
  const newBiome=Z.biomeAt(p.x,p.y);if(newBiome!==this.biome){const oldMax=this.stats().maxHealth;this.biome=newBiome;const newMax=this.stats().maxHealth;
   if(p.characterId==='paco')p.hp=clamp(p.hp*newMax/oldMax,0,newMax);if(!p.discovered.includes(newBiome))p.discovered.push(newBiome);
   this.emit('biome',{name:names[newBiome],safe:newBiome==='village'});
   if(newBiome==='village'){p.poison=null;p.slow=0;this.projectiles=this.projectiles.filter(s=>!s.hostile);this.enemies.forEach(e=>{if(e.latched>0){e.x=e.homeX;e.y=e.homeY;}e.latched=0;e.alert=false;e.telegraph=0;e.dash=0;});}}
 }
 roll(target=null){
  const p=this.player;if(this.state!=='playing'||p.roll>0||p.rollCooldown>0)return false;
  if(p.exhausted>0||p.stamina<ROLL_COST){if(!this.noRollNotice||this.time-this.noRollNotice>2){this.noRollNotice=this.time;this.emit('toast',{message:'No te queda aire para rodar.'});}return false;}
  let[x,y]=this.movementInput();
  if(target){const len=distance(target,p);if(len>1){x=(target.x-p.x)/len;y=(target.y-p.y)/len;}}
  if(!x&&!y)[x,y]=dirs[p.dir];
  p.rollX=x;p.rollY=y;p.roll=ROLL_TIME;p.rollCooldown=ROLL_TIME+ROLL_COOLDOWN;p.stamina=Math.max(0,p.stamina-ROLL_COST);p.restTime=0;
  p.dir=Math.abs(x)>Math.abs(y)?(x>0?'right':'left'):(y>0?'down':'up');
  this.sound.play('roll');this.effect(p.x,p.y,'dust',.45);
  // Rodar sacude a las ratas prendidas.
  this.enemies.forEach(e=>{if(e.latched>0){e.latched=0;e.latchRest=1.6;e.cooldown=.6;e.x=p.x;e.y=p.y;this.move(e,-x*70,-y*70,7,e.biome);}});
  return true;
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
 // Cada golpe que conecta suma al combo; el cuarto seguido es crítico.
 landStrike(){const p=this.player;p.combo=(p.comboTime>0?p.combo:0)+1;p.comboTime=Math.max(1.6,this.stats().attackCooldown+.7);return p.combo%COMBO_CRIT===0;}
 attack(){
  const p=this.player;if(this.state!=='playing'||p.attackCooldown>0||p.roll>0)return false;const stats=this.stats(),weapon=Z.WEAPON_TYPES[p.weapon];
  if(p.weapon==='stone'&&!p.stoneAmmo){if(!this.noAmmoNotice||this.time-this.noAmmoNotice>3){this.noAmmoNotice=this.time;this.emit('toast',{message:'Caminá 2 segundos para recoger otra piedra.'});}return false;}
  let[dx,dy]=dirs[p.dir];const aim=this.aim||(this.touchMode?this.autoAim(weapon.range+(p.weapon==='bow'||p.weapon==='stone'?0:30)):null);
  if(aim){const len=distance(aim,p);if(len>0){dx=(aim.x-p.x)/len;dy=(aim.y-p.y)/len;p.dir=Math.abs(dx)>Math.abs(dy)?(dx>0?'right':'left'):(dy>0?'down':'up');}}
  p.attackCooldown=Math.max(stats.attackCooldown,p.weapon==='bow'?.7:0);p.attackAnim=.24;const damage=stats.strength*weapon.damageMultiplier*stats.damageMultiplier;
  if(p.weapon==='bow'||p.weapon==='stone'){
   this.projectiles.push({x:p.x+dx*12,y:p.y-7+dy*12,dx,dy,type:p.weapon,damage,traveled:0,range:weapon.range});
   if(p.weapon==='stone'){p.stoneAmmo=0;p.stoneWalkTime=0;}this.sound.play('bow');
  }else{
   this.effect(p.x+dx*22,p.y-7+dy*22,'slash',.2,{dir:p.dir,radius:weapon.range});
   const targets=this.enemies.filter(e=>{if(e.dead||e.latched>0)return false;const ex=e.x-p.x,ey=e.y-p.y,len=Math.hypot(ex,ey),reach=weapon.range+(isBoss(e)?8:0);return len<=reach&&(len<14||(ex*dx+ey*dy)/len>.2);});
   const crit=targets.length>0&&this.landStrike();targets.forEach(e=>this.hitEnemy(e,damage*(crit?CRIT_MULTIPLIER:1),false,crit));this.sound.play('swing');
  }return true;
 }
 hitEnemy(e,raw,exact=false,crit=false){
  if(e.dead||e.latched>0)return;const damage=exact?raw:Z.damageAfterArmor(raw,e.stats.armor);e.hp-=damage;e.hitFlash=.16;e.provoked=true;e.alert=true;
  this.effect(e.x,e.y-23,'hit',.8,{text:(crit?'¡':'')+this.number(damage)+(crit?'!':''),crit});this.effect(e.x,e.y-10,'spark',.35,{seed:Math.random()*99,crit});
  this.sound.play(crit?'crit':'hit');if(crit)this.shake(3,.2);
  const definition=Z.ENEMY_TYPES[e.type];
  if(definition.knockback&&!exact){const dx=e.x-this.player.x,dy=e.y-this.player.y,len=Math.hypot(dx,dy)||1;this.move(e,dx/len*18,dy/len*18,7,e.biome);}
  if(e.hp<=0){const first=!this.questFlags['defeat_'+e.type];e.hp=0;e.dead=true;e.respawn=definition.respawn||35;e.alert=false;e.telegraph=0;e.dash=0;this.player.kills++;this.questFlags['defeat_'+e.type]=true;
   this.effect(e.x,e.y-8,'poof',.6,{seed:Math.random()*99});this.sound.play(definition.boss?'boss':'death');
   const levels=Z.grantXp(this.player,e.stats.xp,this.context());this.effect(e.x,e.y-38,'heal',1.1,{text:'+'+this.number(e.stats.xp*this.stats().xpMultiplier)+' EXP'});
   const[min,max]=definition.coins||[0,0];this.dropCoins(e.x,e.y,min+Math.floor(Math.random()*(max-min+1))+(e.level-1));
   if(definition.boss){this.player.bossKills=(this.player.bossKills||0)+1;this.emit('progress');this.shake(6,.5);if(first){this.player.points+=1;this.emit('toast',{message:'¡Derrotaste a '+definition.name+'! Trofeo: +1 punto de mejora.'});}else this.emit('toast',{message:definition.name+' vuelve a caer.'});}
   if(this.player.characterId==='pepe'){this.heal(5);this.player.buffs.pepe=3;}if(levels)this.onLevel(levels);}
 }
 dropCoins(x,y,total){
  total=Math.max(0,Math.floor(total));const pieces=Math.min(6,Math.ceil(total/4));
  for(let i=0;i<pieces;i++){const value=Math.floor(total/pieces)+(i<total%pieces?1:0),angle=Math.random()*Math.PI*2,speed=40+Math.random()*50;
   this.drops.push({x,y:y-4,vx:Math.cos(angle)*speed,vy:Math.sin(angle)*speed*.7,value,life:30,delay:.35,seed:i*1.7});}
 }
 updateDrops(dt){
  const p=this.player;this.drops=this.drops.filter(d=>{d.life-=dt;d.delay=Math.max(0,d.delay-dt);
   if(d.delay>0){d.x+=d.vx*dt;d.y+=d.vy*dt;d.vx*=.9;d.vy*=.9;return true;}
   const len=Math.hypot(p.x-d.x,p.y-6-d.y);
   if(len<14){p.coins=(p.coins||0)+d.value;this.sound.play('coin');this.effect(p.x,p.y-30,'coin',.7,{text:'+'+d.value+' ◉'});return false;}
   if(len<75){const pull=Math.min(len,(260-len*1.6)*dt);d.x+=(p.x-d.x)/len*pull;d.y+=(p.y-6-d.y)/len*pull;}
   return d.life>0;});
 }
 onLevel(){
  this.sound.play('level');this.effect(this.player.x,this.player.y,'level',1.4,{radius:50});this.emit('progress');this.emit('toast',{message:'¡Nivel '+this.player.level+'! Tenés '+this.player.points+' punto(s) para mejorar. Presioná C.'});
  this.enemies.forEach(e=>{const stats=Z.enemyStats(e.type,this.player.level),ratio=e.hp/e.maxHp;e.stats=stats;e.level=stats.level;e.maxHp=stats.health;if(!e.dead)e.hp=Math.max(1,ratio*stats.health);});
 }
 updateEnemies(dt){
  const p=this.player;for(const e of this.enemies){
   if(e.dead){e.respawn-=dt;if(e.respawn<=0&&distance({x:e.homeX,y:e.homeY},p)>230)Object.assign(e,this.makeEnemy({id:e.id,type:e.type,x:e.homeX,y:e.homeY}));continue;}
   e.cooldown=Math.max(0,e.cooldown-dt);e.hitFlash=Math.max(0,e.hitFlash-dt);e.latchRest=Math.max(0,e.latchRest-dt);e.stun=Math.max(0,e.stun-dt);e.charm=Math.max(0,e.charm-dt);e.moving=false;
   if(e.stun>0){e.alert=false;e.telegraph=0;e.dash=0;e.backoff=0;continue;}const sameZone=e.biome===this.biome&&this.biome!=='village';
   if(isBoss(e)){this.updateBoss(e,dt,sameZone);if(this.state!=='playing')break;continue;}
   if(e.latched>0){
    if(!sameZone){e.latched=0;e.x=e.homeX;e.y=e.homeY;continue;}e.latched=Math.max(0,e.latched-dt);e.x=p.x+5;e.y=p.y-8;
    if(e.latched>1e-8&&e.cooldown<=0)this.enemyAttack(e);if(this.state!=='playing')break;
    if(e.latched<=1e-8){e.latched=0;e.latchRest=1.6;e.cooldown=.6;const[dx,dy]=dirs[p.dir];e.x=p.x;e.y=p.y;this.move(e,-dx*85,-dy*85,7,e.biome);if(distance(e,p)<28){e.x=e.homeX;e.y=e.homeY;}}continue;
   }
   const len=distance(e,p),ratFlees=e.type==='rat'&&p.characterId==='tena',ratIgnores=e.type==='rat'&&p.characterId==='gero'&&!e.provoked;
   const fleeing=sameZone&&len<210&&(e.charm>0||ratFlees),wasAlert=e.alert;e.alert=sameZone&&!ratIgnores&&!fleeing&&(len<195||(e.alert&&len<320));
   if(e.alert&&!wasAlert)this.sound.play('alert');
   let tx,ty,velocity=e.stats.moveSpeed;
   if(fleeing){tx=e.x+(e.x-p.x);ty=e.y+(e.y-p.y);}else if(e.alert){tx=p.x;ty=p.y;}else{tx=e.homeX+Math.sin(this.time*.2+e.homeX)*28;ty=e.homeY+Math.cos(this.time*.15+e.homeY)*22;velocity*=.28;}
   this.steer(e,tx,ty,velocity,dt,len);
   if(e.alert&&len<22&&e.cooldown<=0){if(e.type==='rat'){if(e.latchRest<=0&&p.roll<=0){e.latched=3;this.enemyAttack(e);this.emit('toast',{message:'¡Una rata se te prendió! Rodá (F) para sacártela.'});}}else this.enemyAttack(e);}
   if(this.state!=='playing')break;
  }
 }
 steer(e,tx,ty,velocity,dt,len){
  const dx=tx-e.x,dy=ty-e.y,targetDistance=Math.hypot(dx,dy);
  if(targetDistance>3&&!(e.alert&&len<16)){const before={x:e.x,y:e.y};this.move(e,dx/targetDistance*velocity*dt,dy/targetDistance*velocity*dt,7,e.biome);
   if(distance(before,e)<.05&&e.alert)this.move(e,-dy/targetDistance*velocity*dt,dx/targetDistance*velocity*dt,7,e.biome);
   e.dir=Math.abs(dx)>Math.abs(dy)?(dx>0?'right':'left'):(dy>0?'down':'up');e.moving=distance(before,e)>.01;e.walk+=dt*9;}
 }
 // Los jefes anuncian su ataque especial: una línea para la embestida, un abanico para el veneno.
 updateBoss(e,dt,sameZone){
  const p=this.player,len=distance(e,p),wasAlert=e.alert;
  e.alert=sameZone&&(len<230||(e.alert&&len<400));
  if(!e.alert){e.telegraph=0;e.dash=0;e.backoff=0;}
  e.tailCd=Math.max(0,(e.tailCd||0)-dt);
  if(e.alert&&!wasAlert){this.sound.play('telegraph');this.emit('boss',{name:Z.ENEMY_TYPES[e.type].name});}
  if(e.telegraph>0){e.telegraph-=dt;
   if(e.type==='capo'){const tl=Math.hypot(p.x-e.x,p.y-e.y)||1;if(e.telegraph>.35){e.aimX=(p.x-e.x)/tl;e.aimY=(p.y-e.y)/tl;}}
   if(e.telegraph<=0){e.telegraph=0;if(e.type==='capo'){e.dash=.5;e.dashHit=false;this.sound.play('swing');}else if(e.kind==='tail')this.tailSweep(e);else this.spit(e);}
   return;}
  if(e.dash>0){e.dash-=dt;const before={x:e.x,y:e.y};this.move(e,e.aimX*360*dt,e.aimY*360*dt,7,e.biome);e.moving=true;e.walk+=dt*16;
   if(this.time%.06<dt)this.effect(e.x,e.y,'dust',.35);
   if(!e.dashHit&&distance(e,p)<22){e.dashHit=true;if(this.hurtPlayer(e.stats.strength*1.6,e.type)){this.shake(5,.3);p.slow=Math.max(p.slow,1.5);}}
   if(distance(before,e)<1)e.dash=0;return;}
  if(e.backoff>0){e.backoff-=dt;const ox=(e.x-p.x)/(len||1),oy=(e.y-p.y)/(len||1);this.steer(e,e.x+ox*40,e.y+oy*40,e.stats.moveSpeed*1.5,dt,len);
   if(e.backoff<=0){e.backoff=0;e.kind='spit';e.telegraph=.55;e.aimX=(p.x-e.x)/(len||1);e.aimY=(p.y-e.y)/(len||1);this.sound.play('telegraph');}
   return;}
  e.special=Math.max(0,e.special-dt);
  let tx=e.homeX,ty=e.homeY,velocity=e.stats.moveSpeed*(e.type==='yarara'?.95:.8);
  if(e.alert){tx=p.x;ty=p.y;}else velocity*=.35;
  if(!e.alert&&Math.hypot(tx-e.x,ty-e.y)<4){e.moving=false;}else this.steer(e,tx,ty,velocity,dt,len);
  if(e.type==='yarara'&&e.alert){
   if(len<TAIL_RADIUS&&e.tailCd<=0){e.kind='tail';e.telegraph=.6;e.tailCd=2.8;this.sound.play('telegraph');return;}
   if(e.special<=0&&len<260){e.special=3.8;e.backoff=.4;return;}
  }else if(e.alert&&e.special<=0&&len<260){
   e.kind='dash';e.telegraph=.8;e.special=4.2;e.aimX=(p.x-e.x)/(len||1);e.aimY=(p.y-e.y)/(len||1);
   this.sound.play('telegraph');return;}
  if(e.alert&&len<26&&e.cooldown<=0)this.enemyAttack(e);
 }
 // Colazo: golpea todo el anillo alrededor de la Yarará y empuja hacia afuera. Se esquiva rodando o alejándose.
 tailSweep(e){
  const p=this.player;this.sound.play('swing');this.effect(e.x,e.y,'wave',.35,{radius:TAIL_RADIUS});this.shake(3,.2);
  const dx=p.x-e.x,dy=p.y-e.y;if(Math.hypot(dx,dy/.65)>TAIL_RADIUS+6)return;
  if(this.hurtPlayer(e.stats.strength*1.4,e.type)&&this.state==='playing'){const len=Math.hypot(dx,dy)||1;this.move(p,dx/len*38,dy/len*38,8);this.shake(5,.25);}
 }
 spit(e){
  const base=Math.atan2(this.player.y-6-(e.y-8),this.player.x-e.x);this.sound.play('spit');
  for(const offset of [-.32,0,.32]){const a=base+offset;
   this.projectiles.push({x:e.x+Math.cos(a)*10,y:e.y-8+Math.sin(a)*10,dx:Math.cos(a),dy:Math.sin(a),type:'venom',hostile:true,damage:e.stats.strength,poison:e.stats.poison,source:e.type,traveled:0,range:320});}
 }
 enemyAttack(e){
  if(this.biome==='village'||e.stun>0||e.charm>0)return;e.cooldown=e.stats.attackCooldown;const p=this.player;let raw=e.stats.strength;
  if(e.type==='dog'&&p.characterId==='pepe')raw*=1.1;if(!this.hurtPlayer(raw,e.type)||this.state!=='playing')return;
  if(e.type==='dog')p.slow=4;
  if(e.type==='snake'&&Math.random()<(p.characterId==='fede'?.15:.4))this.poisonPlayer(e.stats.poison);
 }
 poisonPlayer(damage){this.player.poison={time:5,tick:1,damage};this.emit('toast',{message:'Envenenado: '+damage+' de vida por segundo durante 5 s.',error:true});}
 hurtPlayer(raw,source,poison=false){
  if(this.state!=='playing'||this.biome==='village')return false;const p=this.player;
  if(!poison&&p.roll>0){if(!this.lastDodge||this.time-this.lastDodge>.25){this.lastDodge=this.time;this.effect(p.x,p.y-29,'miss',.7,{text:'¡Esquivado!'});this.sound.play('dodge');}return false;}
  const damage=poison?raw:Z.damageAfterArmor(raw,this.stats().armor);
  p.hp=Math.max(0,p.hp-damage);p.hitFlash=.22;this.hurtFlash=poison?.12:.3;this.effect(p.x,p.y-29,'hit',.8,{text:'-'+this.number(damage),poison});this.sound.play('hurt');if(!poison){this.shake(2.5,.18);this.vibrate(35);}
  if(p.hp<=0)this.knockout(source);return true;
 }
 knockout(source){
  const p=this.player;p.deaths++;
  const quotes={thief:'Uhh... este gil me sacó guita',dog:'¿Por qué Firulais? :c',snake:'La próxima miro dónde piso...',rat:'Me ganaron las ratas. No se lo cuenten a nadie.',capo:'El Capo me dejó en patas y sin un mango.',yarara:'La Yarará Madre me mandó a dormir la siesta.'};
  const quote=quotes[source]||quotes.rat;
  // Los chorros se llevan la guita de verdad; el resto se pierde en el apuro.
  const lost=Math.floor((p.coins||0)*(source==='thief'||source==='capo'?.3:.1));p.coins=Math.max(0,(p.coins||0)-lost);
  Object.assign(p,this.world.spawn,{hp:1,poison:null,slow:0,stamina:1,exhausted:0,restTime:0,attackCooldown:0,moving:false,roll:0,combo:0,comboTime:0});p.buffs={gero:0,pepe:0,paco:0,pacoAnimals:0,mate:0};this.biome='village';p.hp=this.stats().maxHealth;
  this.enemies.forEach(e=>{if(!e.dead){e.x=e.homeX;e.y=e.homeY;if(isBoss(e))e.hp=e.maxHp;}e.latched=0;e.alert=false;e.telegraph=0;e.dash=0;});this.queuedWaves=[];this.projectiles=[];this.state='paused';this.clearInput();this.emit('knockout',{source,quote,lost});
 }
 heal(amount){const before=this.player.hp;this.player.hp=Math.min(this.stats().maxHealth,before+amount);if(this.player.hp>before)this.effect(this.player.x,this.player.y-30,'heal',.9,{text:'+'+this.number(this.player.hp-before)});}
 updateProjectiles(dt){
  const p=this.player;
  this.projectiles=this.projectiles.filter(s=>{if(this.state!=='playing')return false;const speed=s.type==='bow'?330:s.type==='venom'?185:235,travel=speed*dt;s.x+=s.dx*travel;s.y+=s.dy*travel;s.traveled+=travel;
   if(s.traveled>s.range||Z.collides(this.world,s.x,s.y,2))return false;
   if(s.hostile){if(Math.hypot(p.x-s.x,p.y-8-s.y)<11){if(this.hurtPlayer(s.damage,s.source)&&this.state==='playing'&&Math.random()<(p.characterId==='fede'?.15:.5))this.poisonPlayer(s.poison);return p.roll>0;}return true;}
   const enemy=this.enemies.find(e=>!e.dead&&!e.latched&&Math.hypot(e.x-s.x,e.y-6-s.y)<(isBoss(e)?18:14));
   if(enemy){const crit=this.landStrike();this.hitEnemy(enemy,s.damage*(crit?CRIT_MULTIPLIER:1),false,crit);return false;}return true;});
 }
 ability(){
  if(this.state!=='playing')return;const p=this.player,c=Z.CHARACTERS.find(c=>c.id===p.characterId);
  if(c.abilityPassive){this.emit('toast',{message:c.ability+' es una habilidad pasiva: se activa sola.'});return;}
  if(p.abilityCooldown>0){this.emit('toast',{message:c.ability+' estará lista en '+Math.ceil(p.abilityCooldown)+' s.'});return;}
  p.abilityCooldown=c.abilityCooldown;this.sound.play('ability');
  if(p.characterId==='gero'){p.buffs.gero=5;p.healClock=0;}
  if(p.characterId==='paco'){let count=0;this.enemies.forEach(e=>{if(!e.dead&&e.type!=='thief'&&!isBoss(e)&&distance(e,p)<=c.abilityRadius&&e.biome===this.biome){e.charm=10;e.latched=0;e.alert=false;count++;this.effect(e.x,e.y-25,'heart',1.4);}});p.buffs.paco=10;p.buffs.pacoAnimals=count;this.effect(p.x,p.y,'wave',.8,{radius:c.abilityRadius});this.emit('toast',{message:count+' animales encantados. +'+count*2+' de fuerza por 10 s.'});}
  if(p.characterId==='tena'){this.enemies.forEach(e=>{if(!e.dead&&distance(e,p)<=c.abilityRadius&&e.biome===this.biome){e.stun=isBoss(e)?2.5:7;e.latched=0;e.alert=false;e.telegraph=0;e.dash=0;}});p.dance=7;this.effect(p.x,p.y,'wave',1,{radius:c.abilityRadius});}
  if(p.characterId==='dante'){this.wave();this.queuedWaves=[{delay:.55},{delay:1.1}];}this.emit('toast',{message:'✦ '+c.ability});
 }
 wave(){const p=this.player;p.attackAnim=.45;p.tobi=.45;this.effect(p.x,p.y,'wave',.65,{radius:165});this.sound.play('wave');this.shake(3,.2);this.enemies.forEach(e=>{if(!e.dead&&distance(e,p)<=165&&e.biome===this.biome)this.hitEnemy(e,10,true);});}
 equip(weapon){if(this.player.weapons.includes(weapon)){this.player.weapon=weapon;this.emit('tick');}else this.emit('toast',{message:'Todavía no encontraste esa arma.'});}
 useHerb(){
  if(this.state!=='playing')return false;const p=this.player;
  if(!(p.herbs>0)){this.emit('toast',{message:'No tenés hierbas en la bolsa. Buscalas en el campo o compralas en El Almacén.'});return false;}
  if(p.hp>=this.stats().maxHealth&&!p.poison){this.emit('toast',{message:'Guardala para después: ya tenés toda la vida.'});return false;}
  p.herbs--;this.heal(this.herbHealing());p.poison=null;this.sound.play('pickup');this.effect(p.x,p.y-10,'leaf',.8,{seed:Math.random()*99});return true;
 }
 herbHealing(){return Math.max(25,Math.round(this.stats().maxHealth*.2));}
 interact(){
  if(this.state!=='playing')return;const item=Z.nearbyInteractable(this.world,this.player.x,this.player.y,46);if(!item)return;const p=this.player;
  if(item.type==='well'){this.heal(this.stats().maxHealth);p.poison=null;p.stamina=1;p.exhausted=0;this.sound.play('pickup');this.emit('toast',{message:'Agua fresca, vida y energía renovadas.'});return;}
  if(item.type==='sign'){this.emit('toast',{message:item.text||'Todos los caminos empiezan en Los Aromos.'});return;}
  if(item.type==='stall'){this.emit('shop');return;}
  if(item.type==='herb'){
   if(p.herbs<Z.HERB_BAG){item.collected=true;item.regrow=HERB_REGROW;p.herbs++;this.sound.play('pickup');this.emit('toast',{message:'Hierba a la bolsa ('+p.herbs+'/'+Z.HERB_BAG+'). Usala con R.'});return;}
   if(p.hp>=this.stats().maxHealth&&!p.poison){this.emit('toast',{message:'La bolsa está llena y tenés toda la vida.'});return;}
   item.collected=true;item.regrow=HERB_REGROW;this.heal(this.herbHealing());p.poison=null;this.sound.play('pickup');this.emit('toast',{message:'Bolsa llena: la comiste ahí mismo.'});return;}
  if(Z.WEAPON_TYPES[item.type]){item.collected=true;if(!p.weapons.includes(item.type))p.weapons.push(item.type);this.equip(item.type);this.sound.play('pickup');this.emit('toast',{message:'¡Conseguiste '+Z.WEAPON_TYPES[item.type].name.toLowerCase()+'! '+Z.WEAPON_TYPES[item.type].description});}
 }
 shopItems(){const p=this.player;return Z.SHOP_ITEMS.map(item=>{
  const price=item.price(p),soldOut=(item.id==='herb'&&p.herbs>=Z.HERB_BAG)||(item.id==='sharpen'&&p.sharpen>=5);
  const note=item.id==='herb'?'En la bolsa: '+p.herbs+'/'+Z.HERB_BAG:item.id==='sharpen'?'Nivel '+p.sharpen+'/5':item.id==='lesson'?'Clases tomadas: '+p.lessons:item.id==='mate'&&p.buffs.mate>0?'Activo: '+Math.ceil(p.buffs.mate)+' s':'';
  return{...item,price,soldOut,affordable:p.coins>=price,note};});}
 buy(id){
  const p=this.player,item=this.shopItems().find(i=>i.id===id);if(!item)return{ok:false,message:'Ese artículo no existe.'};
  if(item.soldOut)return{ok:false,message:item.id==='herb'?'La bolsa ya está llena.':'Ya no se puede mejorar más.'};
  if(p.coins<item.price)return{ok:false,message:'Te faltan '+(item.price-p.coins)+' monedas. Acá no se fía.'};
  p.coins-=item.price;this.questFlags.bought=true;this.sound.play('buy');
  if(id==='herb')p.herbs++;
  if(id==='mate'){p.stamina=1;p.exhausted=0;p.restTime=2;p.buffs.mate=30;}
  if(id==='sharpen')p.sharpen++;
  if(id==='lesson'){p.lessons++;p.points++;}
  return{ok:true,message:item.name+': ¡listo!'};
 }
 effect(x,y,type,life,extra={}){if(!this.settings.particles&&!extra.text&&type!=='wave'&&type!=='slash')return;this.effects.push({x,y,type,life,maxLife:life,...extra});}
 number(n){return Number.isInteger(n)?String(n):n.toFixed(1).replace('.0','');}
 bossTarget(){return this.enemies.find(e=>isBoss(e)&&!e.dead&&e.alert&&e.biome===this.biome)||null;}
 quests(){const flags=this.questFlags;return[
  {id:'bow',title:'Un regalo para el camino',detail:'Recogé el arco junto a la plaza de la aldea.',done:this.player.weapons.includes('bow')},
  {id:'cave',title:'Donde no llega el sol',detail:'Seguí el camino al norte y entrá a la Cueva del Eco.',done:this.player.discovered.includes('cave')},
  {id:'stone',title:'Algo es algo',detail:'Encontrá las piedras cerca de la entrada de la cueva.',done:this.player.weapons.includes('stone')},
  {id:'weeds',title:'Más allá del último cerco',detail:'Tomá el camino al este para descubrir Los Yuyos.',done:this.player.discovered.includes('weeds')},
  {id:'sword',title:'El filo entre los pastos',detail:'Encontrá la espada en Los Yuyos.',done:this.player.weapons.includes('sword')},
  {id:'shop',title:'Acá no se fía',detail:'Juntá monedas de los enemigos y comprá algo en el puesto de El Almacén.',done:!!flags.bought},
  {id:'bestiary',title:'Anécdotas para el fogón',detail:'Derrotá al menos un chorro, perro, serpiente y rata.',done:['thief','dog','snake','rat'].every(t=>flags['defeat_'+t])},
  {id:'level5',title:'Ya no sos el mismo',detail:'Llegá al nivel 5 con tu personaje.',done:this.player.level>=5},
  {id:'capo',title:'El trono de la cueva',detail:'Alguien se sentó en el trono del fondo de la cueva. Derrotá al Capo del Eco. Recomendado: nivel 4.',done:!!flags.defeat_capo},
  {id:'yarara',title:'La madre de todas las víboras',detail:'Derrotá a la Yarará Madre en el rincón noreste de Los Yuyos. Recomendado: nivel 4.',done:!!flags.defeat_yarara}
 ];}
 checkQuests(){for(const q of this.quests())if(q.done&&!this.questFlags['quest_'+q.id]){this.questFlags['quest_'+q.id]=true;this.emit('toast',{message:'Diario actualizado: '+q.title});this.sound.play('pickup');}if(this.quests().every(q=>q.done)&&!this.questFlags.complete){this.questFlags.complete=true;this.emit('complete');}}
 snapshot(){return JSON.parse(JSON.stringify({version:1,savedAt:new Date().toISOString(),player:this.player,time:this.time,queuedWaves:this.queuedWaves||[],questFlags:this.questFlags,collected:this.world.pickups.filter(p=>p.collected).map(p=>p.id),enemies:this.enemies.map(e=>({id:e.id,hp:e.hp,dead:e.dead,respawn:e.respawn,x:e.x,y:e.y,provoked:e.provoked,cooldown:e.cooldown,stun:e.stun,charm:e.charm,latched:e.latched,latchRest:e.latchRest,alert:e.alert}))}));}
 static validateSave(data){
  if(!data||data.version!==1||!data.player||!Array.isArray(data.collected)||!Array.isArray(data.enemies))throw new Error('El archivo no es una partida válida de Zak’s Throne.');
  const p=data.player,isNumber=n=>typeof n==='number'&&Number.isFinite(n);if(!Z.CHARACTERS.some(c=>c.id===p.characterId))throw new Error('Personaje desconocido.');
  for(const k of ['level','xp','points','hp','x','y','stamina'])if(!isNumber(p[k]))throw new Error('La partida tiene datos incompletos.');
  if(!Number.isInteger(p.level)||p.level<1||!Number.isSafeInteger(p.level)||p.xp<0||p.xp>=Z.xpNeeded(p.level)||!Number.isInteger(p.points)||p.points<0||p.hp<=0||p.hp>500||p.x<10||p.x>2390||p.y<10||p.y>1790)throw new Error('La partida contiene valores fuera de rango.');
  if(!p.stats)throw new Error('Faltan las estadísticas.');
  for(const k of Object.keys(Z.STAT_LABELS))if(!isNumber(p.stats[k])||p.stats[k]<0||p.stats[k]>(k==='health'?500:k==='intelligence'?Number.MAX_SAFE_INTEGER:100))throw new Error('Estadísticas inválidas.');
  if(p.stats.health<1)throw new Error('La vida máxima debe ser positiva.');
  if(!Array.isArray(p.weapons)||!p.weapons.includes('fists')||!p.weapons.every(w=>Object.hasOwn(Z.WEAPON_TYPES,w))||!p.weapons.includes(p.weapon))throw new Error('Inventario inválido.');
  for(const k of ['coins','herbs','sharpen','lessons'])if(p[k]!==undefined&&(!isNumber(p[k])||p[k]<0))throw new Error('Inventario inválido.');
  if(data.enemies.length>100||data.collected.length>500)throw new Error('El archivo es demasiado grande.');return true;
 }
 restore(data,slot=null){
  Game.validateSave(data);const source=data.player,p=Z.createPlayer(source.characterId);
  for(const k of ['level','xp','points','hp','x','y','stamina'])p[k]=source[k];for(const k of Object.keys(Z.STAT_LABELS))p.stats[k]=source.stats[k];
  for(const k of ['kills','deaths','playTime','abilityCooldown','attackCooldown','stoneWalkTime','restTime','slow','exhausted'])p[k]=typeof source[k]==='number'&&Number.isFinite(source[k])?clamp(source[k],0,1e9):0;
  p.abilityCooldown=Math.min(p.abilityCooldown,30);p.attackCooldown=Math.min(p.attackCooldown,3);p.slow=Math.min(p.slow,4);p.exhausted=Math.min(p.exhausted,10);p.stamina=clamp(p.stamina,0,1);p.stoneWalkTime=clamp(p.stoneWalkTime,0,2);
  p.coins=Math.floor(clamp(Number(source.coins)||0,0,1e7));p.herbs=Math.floor(clamp(Number(source.herbs)||0,0,Z.HERB_BAG));p.sharpen=Math.floor(clamp(Number(source.sharpen)||0,0,5));p.lessons=Math.floor(clamp(Number(source.lessons)||0,0,1e4));
  p.bossKills=Math.floor(clamp(Number(source.bossKills)||0,0,1e4));if(typeof source.runId==='string'&&/^[\w-]{6,64}$/.test(source.runId))p.runId=source.runId;
  p.weapon=source.weapon;p.weapons=[...new Set(source.weapons)];p.stoneAmmo=source.stoneAmmo===0?0:1;
  p.discovered=Array.isArray(source.discovered)?source.discovered.filter(z=>Object.hasOwn(names,z)):['village'];p.dir=Object.hasOwn(dirs,source.dir)?source.dir:'down';p.walk=0;p.moving=false;p.attackAnim=0;
  if(source.buffs)for(const key of ['gero','pepe','paco','pacoAnimals','mate'])p.buffs[key]=clamp(Number(source.buffs[key])||0,0,key==='pacoAnimals'?25:key==='mate'?30:10);
  p.healClock=clamp(Number(source.healClock)||0,0,1);
  if(source.poison&&Number.isFinite(source.poison.damage))p.poison={time:clamp(Number(source.poison.time)||0,0,5),tick:clamp(Number(source.poison.tick)||1,.01,1),damage:clamp(source.poison.damage,0,100)};
  this.player=p;this.world=Z.createWorld();this.biome=Z.biomeAt(p.x,p.y);if(Z.collides(this.world,p.x,p.y,8)){Object.assign(p,this.world.spawn);this.biome='village';}
  if(this.biome==='village'){p.poison=null;p.slow=0;}this.time=Number.isFinite(data.time)?clamp(data.time,0,1e9):0;this.questFlags={};
  if(data.questFlags&&typeof data.questFlags==='object')for(const k of Object.keys(data.questFlags))if(/^(quest_(bow|cave|stone|weeds|sword|shop|bestiary|level5|capo|yarara)|defeat_(thief|dog|snake|rat|capo|yarara)|bought|complete)$/.test(k))this.questFlags[k]=data.questFlags[k]===true;
  if(!this.quests().every(q=>q.done))delete this.questFlags.complete;
  this.world.pickups.forEach(i=>{i.collected=data.collected.includes(i.id);if(i.collected&&i.type==='herb')i.regrow=HERB_REGROW;});this.enemies=this.world.enemySpawns.map(spawn=>{
   const e=this.makeEnemy(spawn),saved=data.enemies.find(i=>i&&i.id===e.id);if(saved){if(Number.isFinite(saved.hp))e.hp=clamp(saved.hp,0,e.maxHp);e.dead=saved.dead===true||e.hp<=0;e.respawn=clamp(Number(saved.respawn)||0,0,Z.ENEMY_TYPES[e.type].respawn||35);e.provoked=saved.provoked===true;e.cooldown=clamp(Number(saved.cooldown)||0,0,3);e.stun=clamp(Number(saved.stun)||0,0,7);e.charm=clamp(Number(saved.charm)||0,0,10);e.latched=clamp(Number(saved.latched)||0,0,3);e.latchRest=clamp(Number(saved.latchRest)||0,0,1.6);e.alert=saved.alert===true;if(this.biome==='village'||e.dead)e.latched=0;
    if(Number.isFinite(saved.x)&&Number.isFinite(saved.y)&&Z.biomeAt(saved.x,saved.y)===e.biome&&!Z.collides(this.world,saved.x,saved.y,7)){e.x=saved.x;e.y=saved.y;}}
   return e;});
  this.effects=[];this.projectiles=[];this.drops=[];this.queuedWaves=Array.isArray(data.queuedWaves)&&p.characterId==='dante'?data.queuedWaves.slice(0,2).filter(w=>w&&Number.isFinite(w.delay)).map(w=>({delay:clamp(w.delay,0,1.1)})):[];this.currentSlot=slot;this.clearInput();this.aim=null;this.state='playing';this.renderer.resize(true);this.emit('start',{loaded:true});
 }
}
Z.Game=Game;
})();
