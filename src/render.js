/* Zak's Throne — original procedural pixel art. No external assets. */
(function () {
  "use strict";
  const Z = window.Zak = window.Zak || {};
  const P = {
    ink: "#202c2b", grass: "#739353", grassLight: "#829e58", grassDark: "#628148",
    leaf: "#426b43", leafDark: "#2d513b", leafLight: "#72954e", earth: "#6e593c",
    path: "#c4ad78", cream: "#e4d6a2", water: "#487d87", waterLight: "#76acac",
    gold: "#f4cc73", shadow: "rgba(24,38,30,.23)", stone: "#686e79"
  };
  const hash = (x, y, seed = 0) => {
    let n = Math.imul(x + 71237, 374761393) ^ Math.imul(y + seed + 9127, 668265263);
    n = Math.imul(n ^ n >>> 13, 1274126177);
    return ((n ^ n >>> 16) >>> 0) / 4294967296;
  };
  const rect = (c, x, y, w, h, color) => {
    if (color) c.fillStyle = color;
    c.fillRect(Math.round(x), Math.round(y), Math.round(w), Math.round(h));
  };
  const poly = (c, points, color) => {
    c.fillStyle = color; c.beginPath();
    points.forEach((p, i) => i ? c.lineTo(Math.round(p[0]), Math.round(p[1])) : c.moveTo(Math.round(p[0]), Math.round(p[1])));
    c.closePath(); c.fill();
  };
  function shadow(c, x, y, w = 18, h = 5) {
    rect(c, x - w / 2 + 3, y - h / 2, w - 6, h, P.shadow);
    rect(c, x - w / 2, y - h / 2 + 1, w, h - 2, P.shadow);
  }
  function outlined(c, x, y, w, h, color, outline = P.ink) {
    rect(c, x, y, w, h, outline); rect(c, x + 1, y + 1, w - 2, h - 2, color);
  }
  function flower(c, x, y, seed) {
    const col = ["#f4dc91", "#eabca1", "#d7d5ac", "#c49abc"][seed % 4];
    rect(c, x, y, 1, 4, "#527440");
    rect(c, x - 1, y + 2, 3, 1, "#64884a");
    rect(c, x - 1, y - 1, 3, 1, col);
    rect(c, x, y - 2, 1, 3, col);
    rect(c, x, y - 1, 1, 1, "#eebc60");
  }
  function tuft(c, x, y, color, tall = false, wind = 0) {
    const h = tall ? 8 : 3;
    rect(c, x, y - h, 1, h, color);
    rect(c, x - 2, y - h + 2, 1, h - 2, color);
    rect(c, x + 2 + wind, y - h + 1, 1, h - 1, color);
    rect(c, x + 1, y - 2, 1, 2, color);
    if (tall) rect(c, x - 1, y - 5, 1, 5, color);
  }
  function zoneAt(world, x, y) {
    if (world.zones) {
      for (const id of ["cave", "weeds", "village"]) {
        const z = world.zones.find(a => a.id === id);
        if (z && x >= z.x && y >= z.y && x < z.x + z.w && y < z.y + z.h) return id;
      }
    }
    return x < 1000 && y < 520 ? "cave" : x >= 1550 ? "weeds" : "village";
  }
  function pixelText(c, text, x, y, color = P.cream, size = 7, align = "center") {
    c.font = size + 'px "Trebuchet MS", sans-serif';
    c.textAlign = align; c.textBaseline = "middle";
    c.fillStyle = "#26302c"; c.fillText(text, Math.round(x), Math.round(y + 1));
    c.fillStyle = color; c.fillText(text, Math.round(x), Math.round(y));
  }
  function drawCharacter(c, player, time = 0, portrait = false) {
    const id = player.characterId || player.id || "dante";
    const dir = player.dir || "down";
    const side = dir === "left" || dir === "right";
    const back = dir === "up";
    const stride = player.moving ? Math.sin((player.walk || time * 8) * 1.4) : 0;
    const step = Math.round(stride * 1.4);
    const bob = player.moving && Math.abs(stride) > .65 ? -1 : 0;
    c.save(); c.translate(Math.round(player.x || 0), Math.round(player.y || 0));
    if (!portrait) shadow(c, 0, 0, id === "dante" ? 19 : 16, 5);
    if ((player.hitFlash || player.hurt) > 0 && Math.floor(time * 14) % 2 === 0) c.globalAlpha = .6;
    c.translate(0, bob);
    if (!portrait && player.roll > 0) {
      const spin = (1 - player.roll / .3) * Math.PI * 2 * ((player.rollX || 0) < 0 ? -1 : 1);
      c.translate(0, -10); c.rotate(spin); c.scale(1, .85); c.translate(0, 10);
    }
    if (dir === "left") c.scale(-1, 1);
    const skin = id === "paco" ? "#bf8861" : "#d9a476";
    const darkSkin = id === "paco" ? "#946547" : "#b47c55";
    const fat = id === "dante" ? 1 : 0;
    const shirt = ({gero:"#6b8d91",paco:"#937044",fede:"#ba434a",pepe:"#e3c95f",tena:"#ede6cb",dante:"#405968"})[id] || "#e3c95f";
    const shirtShade = ({gero:"#45676f",paco:"#684f36",fede:"#873747",pepe:"#b89742",tena:"#b5b8a6",dante:"#293d4c"})[id] || "#b89742";
    const pants = id === "fede" ? "#3f597a" : id === "pepe" ? "#cf9b44" : "#384749";
    rect(c, -5-fat, -6, 4, 5+step, pants);
    rect(c, 1, -6, 4+fat, 5-step, pants);
    rect(c, -5-fat, -2+step, 5, 2, "#293330");
    rect(c, 1, -2-step, 5+fat, 2, "#293330");
    if (id === "pepe") {
      rect(c,-6,-1+step,6,2,"#de8e3f");rect(c,1,-1-step,6,2,"#de8e3f");
    }
    rect(c,-6-fat,-15,12+fat*2,10,P.ink);
    rect(c,-5-fat,-15,10+fat*2,8,shirt);
    rect(c,-5-fat,-8,10+fat*2,2,shirtShade);
    if (!back) {
      rect(c,-3,-14,1,6,shirt === "#ede6cb" ? "#b64743" : "#ffffff19");
      if (id==="tena") {
        rect(c,-4,-15,2,8,"#b94e46");rect(c,1,-15,2,8,"#b94e46");
        rect(c,3,-13,1,2,"#dcbe72");
      }
      if (id==="dante") {
        rect(c,-2,-12,4,1,"#d1dfc7");rect(c,-1,-11,2,2,"#93b7a7");
      }
      if (id==="fede") {
        rect(c,-1,-14,2,5,"#422e39");rect(c,-3,-13,6,1,"#422e39");
        rect(c,-2,-11,4,1,"#422e39");
        rect(c,-5,-8,3,2,"#344e72");rect(c,2,-8,3,2,"#344e72");
      }
    } else if(id==="tena") {
      rect(c,-3,-14,1,5,"#aa453f");rect(c,2,-14,1,5,"#aa453f");
      rect(c,-1,-12,2,1,"#b69753");
    }
    rect(c,-8-fat,-14-step,3,7,shirtShade);
    rect(c,5+fat,-14+step,3,7,shirtShade);
    rect(c,-8-fat,-9-step,3,3,id==="fede"?"#b4424b":skin);
    rect(c,5+fat,-9+step,3,3,id==="fede"?"#b4424b":skin);
    if (id==="pepe") {
      rect(c,-9,-14-step,3,6,"#ebd776");rect(c,7,-14+step,3,6,"#ebd776");
    }
    rect(c,-6,-24,12,10,P.ink);
    rect(c,-7,-22,14,6,P.ink);
    rect(c,-5,-23,10,8,skin);
    rect(c,-6,-21,12,5,skin);
    rect(c,-4,-16,8,2,darkSkin);
    if (id==="fede") {
      rect(c,-5,-23,10,8,"#c54a4c");rect(c,-6,-21,12,5,"#c54a4c");
      rect(c,-5,-22,10,1,"#e1695b");
      rect(c,-1,-23,1,8,"#8d3c48");
      rect(c,-5,-19,10,1,"#8d3c48");
      if(!back){rect(c,-4,-21,3,3,"#edebd5");rect(c,2,-21,3,3,"#edebd5");rect(c,-4,-19,1,1,"#262f37");}
    } else if (id==="pepe") {
      rect(c,-6,-24,12,10,"#f0dc87");rect(c,-7,-21,14,6,"#f0dc87");
      rect(c,-3,-26,2,3,"#c74f45");rect(c,0,-27,2,4,"#e1644b");
      rect(c,3,-25,2,2,"#c74f45");
      if(!back){
        rect(c,-4,-20,2,2,"#31392f");rect(c,3,-20,2,2,"#31392f");
        rect(c,-2,-18,5,2,"#d68e3d");rect(c,-1,-16,3,2,"#ebaa48");
        rect(c,-1,-14,2,2,"#c64d46");
      }
    } else {
      if (!back) {
        rect(c,side?1:-4,-20,2,2,"#303831");
        if(!side) rect(c,3,-20,2,2,"#303831");
        rect(c,side?5:0,-19,2,2,darkSkin);
        rect(c,-1,-16,3,1,"#855c4b");
      }
      const hair = id==="dante"?"#4a3830":id==="gero"?"#523e2f":id==="tena"?"#5d4831":"#554633";
      rect(c,-5,-24,10,3,hair);
      rect(c,-6,-22,2,4,hair);
      if(back)rect(c,-5,-22,10,7,hair);
      else rect(c,4,-22,2,2,hair);
      if(id==="gero"){
        rect(c,-6,-25,3,3,hair);rect(c,-2,-25,3,3,hair);rect(c,3,-24,3,3,hair);
        rect(c,-3,-26,7,2,"#2c3d51");rect(c,-2,-27,5,1,"#507786");
        rect(c,-6,-19,2,3,hair);rect(c,5,-19,2,3,hair);
      }
      if(id==="paco"){
        rect(c,-5,-27,10,5,"#78613f");rect(c,-4,-28,8,2,"#a0804d");
        rect(c,-5,-24,10,2,"#564837");rect(c,-9,-23,18,2,"#b19660");
        rect(c,-7,-21,14,1,"#6d583d");
        rect(c,-3,-15,6,2,"#c45245");rect(c,-1,-13,2,3,"#c45245");
      }
      if(id==="dante"){
        if(!back){
          rect(c,-5,-20,4,3,"#273331");rect(c,2,-20,4,3,"#273331");
          rect(c,-4,-19,2,1,"#86b5b4");rect(c,3,-19,2,1,"#86b5b4");rect(c,-1,-19,3,1,"#273331");
          rect(c,-5,-16,10,2,hair);rect(c,-4,-14,8,2,hair);rect(c,-2,-12,4,1,hair);
          rect(c,-2,-16,4,1,"#c8956e");
        }
        rect(c,-4,-25,7,1,hair);
      }
    }
    if (!portrait && player.weapon) {
      const weapon = typeof player.weapon === "string" ? player.weapon : player.weapon.id;
      if(weapon==="sword"){
        rect(c,9+fat,-14,2,10,"#8faeaf");rect(c,10+fat,-15,1,9,"#d9e5cc");
        rect(c,7+fat,-6,6,2,"#c19a54");rect(c,9+fat,-4,2,3,"#80573b");
      } else if(weapon==="bow"){
        rect(c,10+fat,-15,2,2,"#b18349");rect(c,12+fat,-13,2,8,"#b18349");
        rect(c,10+fat,-5,2,2,"#b18349");rect(c,10+fat,-13,1,8,"#d7c791");
      } else if(weapon==="stone"){
        rect(c,8+fat,-9,5,4,"#606a70");rect(c,9+fat,-10,3,3,"#929d98");
      }
    }
    if (!portrait && player.tobi>0) {
      const raised=Math.floor(player.tobi*4)%2===0;
      c.save();c.translate(10,-6);c.rotate(raised?-.75:.55);
      rect(c,-2,-29,5,32,"#6d4840");rect(c,-5,-30,11,15,"#a95f54");
      rect(c,-4,-32,9,3,"#ce8a73");rect(c,-4,-28,4,10,"#d2937c");
      rect(c,2,-26,3,9,"#87443f");rect(c,-1,-10,2,11,"#c08b6e");c.restore();
    }
    if (!portrait && player.dance>0) {
      pixelText(c,"?",-12,-30-Math.sin(time*5)*3,"#e5c574",10);
      pixelText(c,"?",12,-27+Math.sin(time*5)*3,"#d1b5d5",8);
    }
    if (!portrait && player.buffs?.gero>0) {
      for(let k=0;k<5;k++){const phase=(time*.8+k/5)%1;rect(c,-10+k*5,-phase*31,1,3,"#e7d18c");}
    }
    if (!portrait && player.poison) {
      rect(c,-7,-29,2,2,"#b798d4");rect(c,5,-31,2,2,"#9f81bf");
    }
    c.restore();
  }

  function drawTelegraph(c, e, time) {
    const x=Math.round(e.x), y=Math.round(e.y), pulse=.35+Math.abs(Math.sin(time*18))*.4;
    c.save();c.globalAlpha=pulse;
    if(e.type==="capo"){
      c.strokeStyle="#e0574b";c.lineWidth=12;c.lineCap="round";c.globalAlpha=pulse*.35;
      c.beginPath();c.moveTo(x,y-6);c.lineTo(x+e.aimX*180,y-6+e.aimY*180);c.stroke();
      c.globalAlpha=pulse;c.lineWidth=2;c.setLineDash([6,5]);c.strokeStyle="#ffb09a";
      c.beginPath();c.moveTo(x,y-6);c.lineTo(x+e.aimX*180,y-6+e.aimY*180);c.stroke();
    }else{
      const base=Math.atan2(e.aimY,e.aimX);c.strokeStyle="#c79be3";c.lineWidth=2;c.setLineDash([4,6]);
      for(const o of [-.32,0,.32]){c.beginPath();c.moveTo(x,y-8);c.lineTo(x+Math.cos(base+o)*150,y-8+Math.sin(base+o)*150);c.stroke();}
    }
    c.restore();
    pixelText(c,"!!",x,y-46-Math.abs(Math.sin(time*12))*3,"#ff8f7a",12);
  }
  function drawBoss(c, e, time) {
    const x=Math.round(e.x), y=Math.round(e.y);
    const walk=e.moving?Math.round(Math.sin(time*(e.dash>0?24:10)+x)*1.5):0;
    if(e.telegraph>0) drawTelegraph(c,e,time);
    if(e.dash>0){c.save();c.globalAlpha=.25;for(let k=1;k<4;k++){c.save();c.translate(x-e.aimX*k*10,y-e.aimY*k*10);c.scale(1.4,1.4);rect(c,-8,-26,16,24,"#4a3a46");c.restore();}c.restore();}
    c.save(); c.translate(x,y);
    if(e.hitFlash>0 && Math.floor(time*18)%2===0)c.globalAlpha=.55;
    shadow(c,0,0,e.type==="capo"?30:34,6);
    if(e.dir==="left")c.scale(-1,1);
    c.scale(1.4,1.4);
    if(e.type==="capo"){
      rect(c,-6,-7,5,7+walk,"#2e2a33");rect(c,1,-7,5,7-walk,"#2e2a33");
      rect(c,-7,-1+walk,7,2,"#1d1f24");rect(c,1,-1-walk,7,2,"#1d1f24");
      rect(c,-8,-19,16,13,"#1c1b22");rect(c,-7,-18,14,10,"#5a2f38");
      rect(c,-7,-18,4,11,"#6d3b45");rect(c,3,-18,4,11,"#6d3b45");
      rect(c,-2,-18,4,9,"#d9d1b8");rect(c,-1,-17,2,7,"#b23a3f");
      rect(c,-4,-10,8,1,"#e7c35c");rect(c,-3,-9,1,1,"#e7c35c");rect(c,2,-9,1,1,"#e7c35c");
      rect(c,-10,-16,3,9,"#4b2830");rect(c,7,-16,3,9,"#4b2830");
      rect(c,-10,-8,3,3,"#b48768");rect(c,7,-8,3,3,"#b48768");
      rect(c,10,-17,2,11,"#c5d2c9");rect(c,11,-18,1,8,"#f1efe3");rect(c,8,-8,6,2,"#a07a3a");
      rect(c,-5,-27,10,9,"#b88b63");rect(c,-6,-25,12,6,"#b88b63");
      rect(c,-4,-23,3,2,"#1d2220");rect(c,2,-23,3,2,"#1d2220");rect(c,-3,-20,7,1,"#5b3c33");
      rect(c,-5,-21,2,3,"#3b2d27");rect(c,-6,-28,12,2,"#2a2730");rect(c,-9,-26,18,2,"#2a2730");rect(c,-4,-31,8,4,"#2a2730");rect(c,-4,-28,8,1,"#b23a3f");
    } else {
      const sw=Math.round(Math.sin(time*3)*2);
      rect(c,-16,-4,12,5,"#3a2c48");rect(c,-19,-7,6,5,"#3a2c48");rect(c,-21,-9,4,4,"#5d4775");
      rect(c,-14,-3,10,2,"#8d6bb0");rect(c,-6,-6,14,7,"#3a2c48");rect(c,-5,-6,12,4,"#7a5ca0");
      for(let k=0;k<4;k++)rect(c,-13+k*5,-5+(k%2),2,2,"#e1c46a");
      rect(c,2,-16+sw,7,12,"#3a2c48");rect(c,3,-15+sw,5,10,"#8d6bb0");rect(c,4,-12+sw,3,6,"#c7b1de");
      rect(c,1,-23+sw,12,8,"#3a2c48");rect(c,2,-22+sw,10,6,"#9a78c0");rect(c,3,-24+sw,7,2,"#9a78c0");
      rect(c,8,-21+sw,2,2,e.telegraph>0?"#ff8f7a":"#f1d36b");rect(c,4,-21+sw,2,2,e.telegraph>0?"#ff8f7a":"#f1d36b");
      rect(c,11,-17+sw,4,1,"#d65f6b");rect(c,14,-18+sw,1,1,"#d65f6b");rect(c,14,-16+sw,1,1,"#d65f6b");
      if(e.telegraph>0){rect(c,10,-19+sw,4,3,"#b5f08d");}
    }
    c.restore();
    if(e.stun>0){pixelText(c,"♪",x+Math.sin(time*4)*7,y-48,"#e2c578",11);}
    else if(e.alert&&!e.telegraph)pixelText(c,"☠",x,y-48,"#edb977",10);
  }
  function drawEnemy(c, e, time) {
    if(e.dead || e.hp <= 0) return;
    if(e.type==="capo"||e.type==="yarara") return drawBoss(c,e,time);
    const x=Math.round(e.x), y=Math.round(e.y);
    const walk=Math.round(Math.sin(time*(e.alert?14:7)+x)*1);
    c.save(); c.translate(x,y);
    if((e.hitFlash || e.hurt)>0 && Math.floor(time*18)%2===0)c.globalAlpha=.55;
    shadow(c,0,0,e.type==="thief"?19:e.type==="dog"?23:14,4);
    if(e.dir==="left")c.scale(-1,1);
    if(e.type==="thief"){
      rect(c,-5,-6,4,6+walk,"#3b3b4d");rect(c,1,-6,4,6-walk,"#3b3b4d");
      rect(c,-6,-1+walk,6,2,"#272c32");rect(c,1,-1-walk,6,2,"#272c32");
      rect(c,-7,-17,14,12,"#2d2d39");rect(c,-6,-16,12,9,"#555165");
      rect(c,-4,-15,3,8,"#666273");rect(c,-6,-8,12,2,"#7d6254");
      rect(c,-9,-14,3,7,"#39394a");rect(c,7,-14,3,7,"#39394a");
      rect(c,-9,-8,3,3,"#b48768");rect(c,7,-8,3,3,"#b48768");
      rect(c,9,-15,2,9,"#b8c7bd");rect(c,10,-16,1,7,"#e0ded0");
      rect(c,7,-8,6,1,"#9e8260");
      rect(c,-6,-24,12,9,"#2c2f3b");rect(c,-4,-25,8,2,"#393a49");
      rect(c,-4,-21,8,5,"#ba8c65");rect(c,-5,-18,10,4,"#965258");
      rect(c,-3,-20,2,1,"#21282c");rect(c,2,-20,2,1,"#21282c");
      rect(c,-5,-24,10,3,"#4d485c");rect(c,4,-22,2,5,"#4d485c");
    } else if(e.type==="dog"){
      rect(c,-11,-9,15,7,"#7b6550");rect(c,-10,-10,13,5,"#ac9470");
      rect(c,-8,-9,8,2,"#c0aa85");rect(c,-6,-6,7,2,"#806953");
      rect(c,-10,-3,2,4+walk,"#8d7659");rect(c,-5,-3,2,3-walk,"#8d7659");
      rect(c,1,-4,2,5-walk,"#8d7659");rect(c,5,-4,2,4+walk,"#8d7659");
      rect(c,0,-15,9,11,"#927855");rect(c,1,-14,7,8,"#b59c73");
      rect(c,0,-17,3,5,"#614f40");rect(c,6,-17,3,5,"#614f40");
      rect(c,5,-9,7,4,"#bba47d");rect(c,10,-9,3,3,"#373b35");
      rect(c,5,-12,2,2,e.alert?"#db8456":"#373b35");
      rect(c,9,-5,2,2,"#c58072");
      rect(c,-14,-12-walk,3,6,"#80694e");rect(c,-12,-10,3,3,"#9c825e");
      rect(c,-5,-8,1,3,"#8d7659");rect(c,-2,-8,1,3,"#8d7659");
    } else if(e.type==="snake"){
      rect(c,-10,-3,15,4,"#385348");rect(c,-11,-6,5,4,"#385348");
      rect(c,-10,-6,3,3,"#739759");rect(c,-7,-2,10,2,"#789955");
      rect(c,-3,-7,7,4,"#355545");rect(c,-2,-7,5,2,"#88a858");
      rect(c,1,-9,4,6,"#557947");rect(c,2,-10,7,5,"#93ae63");
      rect(c,4,-11,5,4,"#769a50");rect(c,7,-9,1,1,"#ddc773");
      rect(c,9,-7,3,1,"#c56f68");
      rect(c,-5,-2,2,1,"#adc375");rect(c,0,-6,2,1,"#bad27b");
    } else {
      rect(c,-10,-2,6,1,"#ba8a86");rect(c,-13,-3,4,1,"#ba8a86");
      rect(c,-14,-5,2,2,"#ba8a86");
      rect(c,-6,-7,12,7,"#494b53");rect(c,-5,-8,9,6,"#7b7c82");
      rect(c,-4,-7,7,3,"#949196");rect(c,3,-6,6,4,"#a29b9a");
      rect(c,8,-4,2,1,"#d39a94");rect(c,5,-5,1,1,"#252f2a");
      rect(c,1,-9,4,4,"#6a6470");rect(c,2,-8,2,2,"#b78b93");
      rect(c,-4,-1+walk,3,2,"#b08f8b");rect(c,3,-1-walk,3,2,"#b08f8b");
    }
    c.restore();
    if(e.alert && !e.stun && !e.charm && !e.latched) pixelText(c,"!",x,y-(e.type==="thief"?32:23),"#edb977",9);
    if(e.hp<e.maxHp && e.maxHp>0) {
      const by=y-(e.type==="thief"?29:20);
      rect(c,x-10,by,20,3,"#293631");rect(c,x-9,by+1,18*Math.max(0,e.hp/e.maxHp),1,"#dd8b70");
    }
    if(e.charm>0) heart(c,x,y-28, "#efb0aa");
    if(e.stun>0){
      pixelText(c,"♪",x+Math.sin(time*4)*5,y-28,"#e2c578",10);
      pixelText(c,"♫",x-6,y-23,"#d5b8df",7);
    }
  }
  function heart(c,x,y,color) {
    rect(c,x-3,y-2,2,2,color);rect(c,x+1,y-2,2,2,color);
    rect(c,x-4,y,8,2,color);rect(c,x-3,y+2,6,1,color);rect(c,x-2,y+3,4,1,color);rect(c,x-1,y+4,2,1,color);
  }
  function tree(c,o,time) {
    const x=o.x+o.w/2, base=o.y+o.h, v=o.variant||0;
    const pine=v%5===4, sway=Math.sin(time*.7+x*.02)>.8?1:0;
    shadow(c,x+4,base-1,51,11);
    rect(c,x-4,base-30,9,30,"#493d30");rect(c,x-2,base-26,4,25,"#836444");
    rect(c,x+2,base-20,2,19,"#685035");rect(c,x-6,base-4,15,4,"#594735");
    rect(c,x-7,base-2,5,2,"#816342");rect(c,x+4,base-2,6,2,"#816342");
    if(pine){
      poly(c,[[x,base-64],[x-17,base-42],[x-10,base-42],[x-26,base-22],[x-20,base-22],[x-29,base-10],[x+30,base-10],[x+20,base-23],[x+26,base-23],[x+10,base-42],[x+17,base-42]],"#2b4e3c");
      poly(c,[[x-1,base-61],[x-13,base-42],[x-7,base-42],[x-22,base-24],[x-15,base-24],[x-24,base-14],[x+18,base-14],[x+6,base-28],[x+14,base-27],[x+2,base-43],[x+9,base-41]],"#446e46");
      rect(c,x-8,base-42,9,2,"#668549");rect(c,x-15,base-25,15,3,"#668549");rect(c,x-17,base-16,21,2,"#587d46");
    } else {
      const colors=v%4===2?["#535c39","#707542","#929451","#afb465"]:["#2e5139","#456e40","#638749","#8a9f58"];
      c.save();c.translate(sway,0);
      const clusters=[[-13,-43,27,20],[-25,-38,25,24],[0,-40,25,24],[-28,-25,31,16],[-4,-25,33,19],[-15,-48,26,17]];
      for(const a of clusters){rect(c,x+a[0],base+a[1],a[2],a[3],colors[0]);rect(c,x+a[0]+2,base+a[1]+2,a[2]-4,a[3]-5,colors[1]);}
      rect(c,x-13,base-47,24,8,colors[2]);rect(c,x-23,base-36,23,9,colors[2]);rect(c,x+2,base-34,20,8,colors[2]);
      rect(c,x-12,base-23,21,9,colors[2]);rect(c,x-10,base-44,15,3,colors[3]);rect(c,x-20,base-33,9,3,colors[3]);
      for(let k=0;k<22;k++){
        const px=x-24+hash(k,v,11)*47, py=base-43+hash(k,v,25)*27;
        rect(c,px,py,3+k%3,2,k%3===0?colors[3]:k%3===1?colors[1]:colors[2]);
      }
      if(v%6===3)for(let k=0;k<6;k++){const px=x-17+hash(k,v,8)*34,py=base-36+hash(k,v,7)*18;rect(c,px,py,3,3,"#c5754c");rect(c,px,py,1,1,"#e7a268");}
      c.restore();
    }
  }
  function house(c,o,time) {
    const x=o.x,y=o.y,w=o.w,h=o.h, v=(o.variant||0)%5;
    const roofs=[["#84483b","#ab6248","#cd805b"],["#695359","#8a6670","#ad8790"],["#526367","#708388","#94a2a0"],["#97613e","#b7844f","#d2a05e"],["#6c6540","#93834f","#bba366"]][v];
    rect(c,x+8,y+h-6,w+13,13,P.shadow);
    rect(c,x-2,y+3,w+4,h-1,"#5d5744");
    rect(c,x,y+4,w,h-7,"#d6c298");rect(c,x+4,y+8,w-8,h-16,"#e3d2a7");
    rect(c,x+3,y+6,4,h-11,"#b29b70");rect(c,x+w-7,y+6,4,h-11,"#b29b70");
    rect(c,x,y+h-9,w,9,"#89836b");rect(c,x+1,y+h-7,w-2,3,"#a4a08a");
    for(let by=y+12;by<y+h-10;by+=10) {
      rect(c,x+7,by,w-14,1,"#cbb78e");
      for(let bx=x+9+((by-y)%20?12:0);bx<x+w-7;bx+=23)rect(c,bx,by-7,1,7,"#d0bd97");
    }
    const dy=y+h-33;
    outlined(c,x+w/2-10,dy,20,32,"#594a39","#8d7b57");
    rect(c,x+w/2-7,dy+3,14,28,"#795b3e");rect(c,x+w/2-5,dy+5,1,24,"#a27d51");
    rect(c,x+w/2+2,dy+5,1,24,"#594936");rect(c,x+w/2+5,dy+18,2,2,"#dfbd67");
    rect(c,x+w/2-13,y+h-3,26,4,"#c2ba96");rect(c,x+w/2-15,y+h+1,30,3,"#8d8b72");
    const wy=y+Math.max(9,h*.3);
    for(const wx of [x+13,x+w-31]){
      outlined(c,wx,wy,18,20,"#475e64","#927951");
      rect(c,wx+2,wy+2,14,13,"#729599");rect(c,wx+3,wy+3,5,5,"#b4cac0");
      rect(c,wx+8,wy+1,2,16,"#e1d0a1");rect(c,wx+1,wy+9,16,2,"#e1d0a1");
      rect(c,wx-2,wy+19,22,3,"#ad8554");rect(c,wx-1,wy+22,20,4,"#80613e");
      for(let k=0;k<4;k++){rect(c,wx+k*4,wy+17-(k%2)*2,4,4,"#638044");flower(c,wx+k*4+1,wy+17-(k%2)*2,k+v);}
    }
    poly(c,[[x-9,y+9],[x-8,y+1],[x+12,y-27],[x+w-12,y-27],[x+w+9,y+1],[x+w+10,y+9]],"#54483a");
    poly(c,[[x-6,y+3],[x+14,y-25],[x+w-14,y-25],[x+w+6,y+3]],roofs[0]);
    for(let ry=0;ry<5;ry++){
      const top=y-23+ry*6, inset=14-ry*4;
      rect(c,x+inset,top,w-inset*2,4,roofs[1]);
      rect(c,x+inset,top,w-inset*2,1,roofs[2]);
      for(let tx=x+inset+((ry%2)*6);tx<x+w-inset;tx+=12)rect(c,tx,top+1,1,4,roofs[0]);
    }
    rect(c,x-7,y+4,w+14,4,roofs[0]);rect(c,x-5,y+4,w+10,1,roofs[2]);
    rect(c,x+13,y-29,w-26,4,roofs[2]);rect(c,x+14,y-25,w-28,1,roofs[0]);
    const chimney=x+w-29;
    rect(c,chimney,y-43,11,23,"#826956");rect(c,chimney+2,y-41,7,18,"#b29776");
    rect(c,chimney-2,y-45,15,4,"#6b6253");rect(c,chimney-1,y-45,13,1,"#b5a689");
    for(let k=0;k<3;k++){
      const phase=(time*.18+k*.33)%1;
      c.globalAlpha=(1-phase)*.2;
      rect(c,chimney-1+Math.sin(time+k)*3+phase*7,y-48-phase*28,8+phase*9,5+phase*4,"#e6dec5");
    }
    c.globalAlpha=1;
    if(o.label) {
      outlined(c,x+w/2-19,y+10,38,9,"#665641","#baa171");
      pixelText(c,o.label,x+w/2,y+14,"#ecddb1",5);
    }
  }
  function pond(c,o,time=0) {
    const x=o.x,y=o.y,w=o.w,h=o.h;
    const steps=12;
    for(let layer=0;layer<3;layer++)for(let i=0;i<steps;i++){
      const yy=i/(steps-1),inset=Math.round((1-Math.sqrt(Math.max(0,1-(yy*2-1)**2)))*w*.35/3)*3;
      const pad=layer===0?-4:layer===1?0:4,hh=h-pad*2;
      rect(c,x+inset+pad,y+pad+i*hh/steps,w-inset*2-pad*2,hh/steps+1,layer===0?"#5a704b":layer===1?"#a4aa70":P.water);
    }
    for(let k=0;k<28;k++){
      const px=x+12+hash(k,4)*Math.max(1,w-34),py=y+12+hash(k,2)*Math.max(1,h-25);
      rect(c,px+Math.sin(time*.5+k)*2,py,4+hash(k,3)*12,1,k%3?"#5d9199":"#90b6b0");
    }
    for(let k=0;k<5;k++){
      const px=x+w*.25+hash(k,1)*w*.5,py=y+h*.22+hash(k,8)*h*.56;
      rect(c,px,py,9,4,"#467750");rect(c,px+1,py-1,7,1,"#75a568");rect(c,px+4,py+2,2,2,P.water);
      if(k%2===0)flower(c,px+3,py,0);
    }
    for(let k=0;k<13;k++){
      const px=x+5+hash(k,9)*(w-10),py=y+h-3+hash(k,15)*5;
      tuft(c,px,py,"#536f43",true);
      if(k%3===0)rect(c,px,py-10,2,5,"#8c7347");
    }
  }
  function drawObject(c,o,time) {
    const x=o.x,y=o.y,w=o.w||16,h=o.h||12,v=o.variant||0;
    if(o.type==="tree")return tree(c,o,time);
    if(o.type==="house")return house(c,o,time);
    if(o.type==="pond")return pond(c,o,time);
    if(o.type==="flower"){for(let k=0;k<5;k++)flower(c,x+hash(k,v)*w,y+hash(k,v,3)*h,k+v);return;}
    if(o.type==="grass"){for(let k=0;k<5;k++)tuft(c,x+hash(k,v)*w,y+hash(k,v,3)*h,"#517746",v%2===0,0);return;}
    if(o.type==="cliff"){
      const vertical=v===1;
      rect(c,x-3,y-27,w+6,h+29,"#282f35");
      rect(c,x,y-24,w,h+20,"#42464e");
      for(let yy=y-24;yy<y+h-3;yy+=12)for(let xx=x;xx<x+w;xx+=21){
        const ww=Math.min(20,x+w-xx),hh=Math.min(11,y+h-3-yy),shade=hash(xx,yy)>.5?"#51545c":"#484c54";
        rect(c,xx,yy,ww,hh,shade);rect(c,xx+1,yy+1,Math.max(1,ww-3),2,"#62646a");
      }
      for(let xx=x;xx<x+w;xx+=14){const rise=3+Math.floor(hash(xx,y)*7);rect(c,xx,y-26-rise,Math.min(14,x+w-xx),rise+7,"#565960");rect(c,xx+2,y-26-rise,Math.min(10,x+w-xx),2,"#747574");}
      rect(c,x,y+h-3,w,4,"#242e30");
      if(!vertical)for(let k=0;k<w/28;k++)rect(c,x+k*28+3,y+h-1,9,3,"#45583d");
      return;
    }
    if(o.type==="crystal"){
      const glow=["#71b1b9","#a999c2","#8abb9c"][v%3];shadow(c,x+6,y+8,20,5);
      poly(c,[[x,y+6],[x-2,y-8],[x+3,y-14],[x+7,y-6],[x+7,y+7]],"#405b68");
      poly(c,[[x+1,y+5],[x,y-7],[x+3,y-12],[x+4,y+4]],glow);
      poly(c,[[x+7,y+7],[x+7,y-3],[x+11,y-8],[x+14,y-1],[x+13,y+8]],"#557989");
      rect(c,x+8,y-3,2,9,glow);rect(c,x+3,y-11,1,5,"#c5e7df");
      if(Math.sin(time*2+x)>0.5){rect(c,x+15,y-11,1,5,"#c3ddd1");rect(c,x+13,y-9,5,1,"#c3ddd1");}return;
    }
    if(o.type==="rock"){
      shadow(c,x+w/2+3,y+h,w+5,5);
      poly(c,[[x,y+h-4],[x+2,y+5],[x+w*.3,y],[x+w*.75,y+1],[x+w,y+h*.4],[x+w-2,y+h],[x+4,y+h]],"#474e50");
      poly(c,[[x+2,y+h-5],[x+4,y+6],[x+w*.32,y+2],[x+w*.7,y+3],[x+w-3,y+h*.45],[x+w-6,y+h-3]],v%2?"#8d9486":"#838c89");
      poly(c,[[x+4,y+6],[x+w*.3,y+2],[x+w*.65,y+3],[x+w*.46,y+8],[x+4,y+h-7]],"#a3a99a");
      rect(c,x+w*.68,y+h*.5,2,h*.35,"#656f6a");rect(c,x+4,y+h-2,w*.6,2,"#637252");
    } else if(o.type==="fence"){
      const horizontal=w>=h;
      if(horizontal){
        rect(c,x,y+h-12,w,4,"#7e6240");rect(c,x,y+h-5,w,3,"#a48653");
        for(let xx=x;xx<x+w;xx+=18){rect(c,xx,y+h-18,5,20,"#69583c");rect(c,xx+1,y+h-18,3,17,"#c0a16c");rect(c,xx,y+h-19,5,2,"#ddbd82");}
      } else {
        for(let yy=y;yy<y+h;yy+=18){rect(c,x,yy-13,5,19,"#796244");rect(c,x+1,yy-13,3,16,"#bb9e6a");}
        rect(c,x+4,y-9,3,h,"#917649");
      }
    } else if(o.type==="well"){
      shadow(c,x+w/2,y+h,w+8,7);
      outlined(c,x+3,y+h-14,w-6,15,"#929585","#555e50");
      rect(c,x+7,y+h-19,w-14,10,"#414f4a");rect(c,x+9,y+h-16,w-18,4,"#5a7e7b");
      rect(c,x+3,y+h-20,w-6,4,"#b0b19a");rect(c,x,y+h-16,5,6,"#b0b19a");rect(c,x+w-5,y+h-16,5,6,"#b0b19a");
      rect(c,x+4,y-18,4,h+3,"#76603f");rect(c,x+w-8,y-18,4,h+3,"#76603f");
      poly(c,[[x-3,y-16],[x+w/2,y-32],[x+w+3,y-16]],"#6b4940");
      poly(c,[[x,y-17],[x+w/2,y-29],[x+w,y-17]],"#bc7952");
      rect(c,x-3,y-16,w+6,3,"#84553e");rect(c,x+7,y-11,w-14,3,"#b49b65");
      rect(c,x+w/2,y-8,1,19,"#a69d7b");rect(c,x+w/2-3,y+9,7,5,"#876942");
      for(let xx=x+10;xx<x+w-6;xx+=10)rect(c,xx,y+h-10,1,9,"#69766d");
    } else if(o.type==="sign"){
      rect(c,x+w/2-2,y-6,4,h+8,"#79603b");
      outlined(c,x-3,y-19,w+6,17,"#ab8a54","#5c5139");
      rect(c,x-1,y-17,w+2,1,"#ccac72");
      const label=o.label||o.text;
      if(label) pixelText(c,label,x+w/2,y-10,"#f1deb0",Math.min(7,Math.max(4,(w+2)/String(label).length*1.7)));
      else{rect(c,x+3,y-12,w-8,2,"#685334");rect(c,x+7,y-9,w-13,1,"#685334");}
    } else if(o.type==="lantern"){
      shadow(c,x+w/2,y+h,12,4);rect(c,x+w/2-1,y-24,3,h+24,"#574e3b");
      rect(c,x+w/2-6,y-27,12,3,"#4d4b38");rect(c,x+w/2-4,y-25,8,10,"#574e3b");
      rect(c,x+w/2-3,y-24,6,7,"#d9aa5b");rect(c,x+w/2-2,y-23,3,5,"#f8d889");
      rect(c,x+w/2-5,y-16,10,2,"#5b4f3b");
    } else if(o.type==="crate"){
      shadow(c,x+w/2,y+h,w+5,4);
      outlined(c,x,y-6,w,h+6,"#a78451","#5d5038");rect(c,x+3,y-3,w-6,h,"#8e6a40");
      for(let xx=x+5;xx<x+w-2;xx+=7)rect(c,xx,y-3,1,h,"#ba945f");
      rect(c,x+1,y-5,w-2,3,"#c19a61");rect(c,x+1,y+h-4,w-2,3,"#b28e58");
      rect(c,x+2,y-2,3,h-1,"#b79a68");rect(c,x+w-5,y-2,3,h-1,"#b79a68");
    } else if(o.type==="bench"){
      rect(c,x+3,y+h-5,3,7,"#594e38");rect(c,x+w-6,y+h-5,3,7,"#594e38");
      rect(c,x,y-8,w,5,"#b49359");rect(c,x,y-1,w,4,"#b49359");
      rect(c,x-2,y+h-7,w+4,5,"#c7a56b");rect(c,x,y+h-2,w,2,"#82633f");
      rect(c,x+1,y-8,w-2,1,"#debd7c");
    } else if(o.type==="shrub"){
      shadow(c,x+w/2,y+h,w+6,5);
      rect(c,x+2,y-3,w-4,h+5,"#3c623d");rect(c,x-1,y+2,w+2,h-1,"#3c623d");
      rect(c,x+2,y-3,w-5,5,"#7a974e");rect(c,x,y+2,w-2,4,"#668a49");
      for(let k=0;k<5;k++)rect(c,x+hash(k,v)*w,y+hash(k,v,3)*h,3,2,v%3===1?"#b97464":"#7d9d50");
    } else if(o.type==="stall"){
      shadow(c,x+w/2+3,y+h+2,w+14,6);
      rect(c,x+1,y-24,3,h+24,"#5d4630");rect(c,x+w-4,y-24,3,h+24,"#5d4630");
      outlined(c,x-2,y-4,w+4,h+4,"#a07a4b","#4f3b28");rect(c,x,y-3,w,2,"#c49a63");
      for(let k=0;k<4;k++){const fx=x+3+k*8;rect(c,fx,y-8,6,5,["#d36c4f","#e2b549","#7aa253","#c9573f"][k]);rect(c,fx+1,y-9,3,1,"#f6e3a6");}
      const seg=Math.ceil((w+10)/6);
      for(let k=0;k<6;k++)rect(c,x-5+k*seg,y-31,seg,9,k%2?"#e9dfc2":"#b84d42");
      for(let k=0;k<6;k++)rect(c,x-5+k*seg,y-22,seg,3,k%2?"#cfc4a5":"#8f3a33");
      rect(c,x-6,y-33,w+12,2,"#6b4a32");
      outlined(c,x+w/2-15,y-45,30,11,"#e7cf8e","#5c4630");pixelText(c,"ALMACÉN",x+w/2,y-40,"#5b3b24",5);
      const bob=Math.round(Math.sin(time*3)*1.5);pixelText(c,"$",x+w+8,y-40+bob,"#f4d36b",9);
    } else if(o.type==="throne"){
      shadow(c,x+w/2,y+h,w+10,6);
      rect(c,x-4,y+h-8,w+8,8,"#2d2630");rect(c,x-3,y+h-7,w+6,2,"#5b4a5c");
      rect(c,x+2,y-26,w-4,h+18,"#3a3040");rect(c,x+5,y-23,w-10,h+12,"#6e3946");rect(c,x+7,y-21,w-14,h+8,"#8a4655");
      rect(c,x-1,y+2,6,h-6,"#4b3e50");rect(c,x+w-5,y+2,6,h-6,"#4b3e50");rect(c,x-1,y+1,6,2,"#c9a24e");rect(c,x+w-5,y+1,6,2,"#c9a24e");
      for(let k=0;k<5;k++){const px=x+4+k*(w-8)/4;poly(c,[[px-3,y-26],[px,y-34-(k%2)*4],[px+3,y-26]],"#d8b45a");}
      rect(c,x+2,y-27,w-4,2,"#c9a24e");rect(c,x+w/2-2,y-20,4,4,Math.sin(time*2)>0?"#8fd6d0":"#6fb5b0");
    } else if(o.type==="nest"){
      for(let k=0;k<14;k++){const px=x+hash(k,3)*w,py=y+hash(k,5)*h;rect(c,px,py,7+k%4,1,k%2?"#7b6a45":"#a28c5c");}
      rect(c,x+4,y+h-4,w-8,4,"#5b4c31");
      for(let k=0;k<4;k++){const ex=x+10+k*8,ey=y+4+(k%2)*3;rect(c,ex,ey,6,7,"#d9d0b2");rect(c,ex+1,ey+1,2,2,"#f3eedc");rect(c,ex+3,ey+4,2,1,"#a8a07f");}
    } else if(o.type==="arch"){
      rect(c,x,y-37,9,h+37,"#71766a");rect(c,x+w-9,y-37,9,h+37,"#71766a");
      rect(c,x+2,y-35,4,h+34,"#9da38a");rect(c,x+w-7,y-35,4,h+34,"#9da38a");
      rect(c,x-4,y-43,w+8,10,"#60695e");rect(c,x-2,y-43,w+4,3,"#b2b49a");
      if(o.label)pixelText(c,o.label,x+w/2,y-37,"#ddd6ae",6);
      for(let k=0;k<5;k++){rect(c,x+k*5-1,y-45+k%3,7,4,"#486f40");rect(c,x+w-k*4,y-43+k%4,5,4,"#5d8247");}
    }
  }
  function pickup(c,p,time) {
    if(p.collected)return;
    const x=Math.round(p.x),y=Math.round(p.y),bob=Math.round(Math.sin(time*2+p.x)*2);
    shadow(c,x,y,16,4);
    c.save();c.translate(x,y-7+bob);
    rect(c,-6,-5,12,12,"#e5bd6330");rect(c,-4,-7,8,16,"#e5bd631a");
    if(p.type==="bow"){
      rect(c,-4,-7,3,2,"#e0b877");rect(c,-1,-5,2,3,"#bc8d51");rect(c,1,-2,2,6,"#bc8d51");
      rect(c,-1,4,2,3,"#bc8d51");rect(c,-4,7,3,2,"#e0b877");rect(c,-4,-5,1,12,"#e7d3a0");
      rect(c,-7,0,13,1,"#c5b884");rect(c,5,-1,3,3,"#bac8b8");
    } else if(p.type==="sword"){
      rect(c,-2,-10,4,13,"#506e71");rect(c,-1,-11,2,13,"#d2dfd1");
      rect(c,-1,-11,1,12,"#f1eee0");rect(c,-5,2,10,2,"#d1aa56");rect(c,-1,4,2,5,"#8b6541");rect(c,-2,9,4,2,"#d1aa56");
    } else if(p.type==="stone"){
      poly(c,[[-6,-2],[-3,-6],[3,-6],[6,-2],[5,4],[-3,5],[-6,2]],"#657476");
      rect(c,-3,-5,6,3,"#9eaca4");rect(c,-4,-2,3,4,"#82938e");rect(c,2,1,3,3,"#4f6161");
    } else {
      rect(c,-1,-6,2,13,"#a1b67a");rect(c,-5,-5,5,3,"#77a761");rect(c,1,-2,5,3,"#8bb977");
      rect(c,-4,1,4,3,"#72a15b");rect(c,-3,-9,5,3,"#e2b2bb");rect(c,-2,-10,3,5,"#e2b2bb");
    }
    rect(c,8,-9+Math.round(Math.sin(time*3)*2),1,3,"#f0d599");rect(c,7,-8+Math.round(Math.sin(time*3)*2),3,1,"#f0d599");
    c.restore();
  }
  function coin(c,d,time) {
    const x=Math.round(d.x),y=Math.round(d.y),bob=d.delay>0?0:Math.round(Math.sin(time*5+d.seed)*1.5);
    if(d.life<5&&Math.floor(time*8)%2===0)return;
    rect(c,x-3,y+2,6,2,P.shadow);
    const spin=Math.abs(Math.sin(time*4+d.seed)),w=Math.max(1,Math.round(5*spin));
    rect(c,x-Math.ceil(w/2)-1,y-6+bob,w+2,7,"#8a6424");rect(c,x-Math.ceil(w/2),y-5+bob,w,5,"#f2cb5b");
    if(w>2)rect(c,x-Math.ceil(w/2)+1,y-5+bob,1,2,"#fff2b5");
  }
  class Renderer {
    constructor(canvas) {
      this.canvas=canvas;this.ctx=canvas.getContext("2d",{alpha:false});
      canvas.width=640;canvas.height=360;this.ctx.imageSmoothingEnabled=false;
      this.background=null;this.worldRef=null;this.camera={x:0,y:0};this.elapsed=0;
    }
    resize(dynamic = false) {
      const bounds=this.canvas.getBoundingClientRect();
      const width=dynamic && bounds.width>0 && bounds.width<700 && bounds.height>bounds.width ? 400 : 640;
      const height=dynamic && bounds.width>0 ? Math.max(200,Math.min(1200,Math.round(width*bounds.height/bounds.width))) : 360;
      if(this.canvas.width!==width || this.canvas.height!==height){this.canvas.width=width;this.canvas.height=height;this.initialized=false;}
      this.ctx.imageSmoothingEnabled=false;
    }
    makeBackground(world) {
      const b=document.createElement("canvas");b.width=world.width;b.height=world.height;
      const c=b.getContext("2d");c.imageSmoothingEnabled=false;
      for(let y=0;y<world.height;y+=16)for(let x=0;x<world.width;x+=16){
        const zone=zoneAt(world,x+8,y+8), n=hash(x,y,18);
        let color=zone==="cave"?(n>.65?"#474a50":n>.25?"#42464b":"#4d4e52"):zone==="weeds"?(n>.5?"#637f47":"#6c8649"):(n>.74?"#799954":n>.18?P.grass:"#6f8e4f");
        rect(c,x,y,16,16,color);
        for(let k=0;k<(zone==="weeds"?8:3);k++){
          const px=x+Math.floor(hash(x+k,y,1)*15),py=y+Math.floor(hash(x,y+k,2)*15);
          if(zone==="cave"){
            rect(c,px,py,2+k%3,1,k%2?"#5b5c60":"#373e44");
            if(n>.96&&k===1)rect(c,px,py,2,2,"#879087");
          } else tuft(c,px,py,k%2?(zone==="weeds"?"#4e6d3f":"#638448"):(zone==="weeds"?"#8b9b56":"#8ca45d"),zone==="weeds");
        }
        if(zone==="village"&&n>.988)flower(c,x+7,y+9,Math.floor(n*200)%4);
      }
      const paths=world.paths||[{x:735,y:500,w:62,h:1300},{x:180,y:940,w:1550,h:65}];
      for(const path of paths){
        const {x,y,w,h}=path;
        const stone=path.material==="stone", cave=path.material==="cave";
        rect(c,x-3,y-3,w+6,h+6,cave?"#3b4147":"#889058");rect(c,x-1,y-1,w+2,h+2,cave?"#616165":stone?"#8c8c74":"#ad9d68");rect(c,x,y,w,h,cave?"#68686b":stone?"#aaa78b":P.path);
        if(stone)for(let yy=y;yy<y+h;yy+=12)for(let xx=x;xx<x+w;xx+=18){const ww=Math.min(17,x+w-xx),hh=Math.min(11,y+h-yy);rect(c,xx,yy,ww,hh,hash(xx,yy)>.5?"#b8b297":"#a6a58d");rect(c,xx+1,yy+1,Math.max(0,ww-2),1,"#c4bea3");}
        for(let yy=y+3;yy<y+h;yy+=9)for(let xx=x+2;xx<x+w;xx+=10){
          const r=hash(xx,yy,21);
          if(r>.48)rect(c,xx+r*4,yy,2+r*3,1,cave?(r>.75?"#777679":"#52565a"):stone?(r>.75?"#c5bea2":"#9a9a82"):(r>.75?"#dbc48e":"#b29b68"));
        }
        for(let k=0;k<w/12;k++){rect(c,x+k*12,y-2+(k%3),5,2,"#869251");rect(c,x+k*12+4,y+h-1,4,2,"#82904f");}
        for(let k=0;k<h/14;k++){rect(c,x-2,y+k*14,2,5,"#849253");rect(c,x+w-1,y+k*14+4,2,5,"#859151");}
      }
      // Hand-cut stepping stones and tiny clover soften the meeting of biomes.
      for(let y=30;y<world.height;y+=23){
        const x=1544+Math.floor(hash(y,5)*17);
        for(let k=0;k<4;k++)tuft(c,x+k*4,y+k*2,"#4f713e",true);
      }
      this.background=b;this.worldRef=world;
    }
    draw(game,dt=0) {
      const c=this.ctx, world=game.world, W=this.canvas.width, H=this.canvas.height;
      this.elapsed+=Math.min(.1,Number.isFinite(dt)?dt:0);
      const time=Number.isFinite(game.time)?game.time:this.elapsed;
      if(!world){c.fillStyle="#22372c";c.fillRect(0,0,W,H);return;}
      if(this.worldRef!==world||!this.background)this.makeBackground(world);
      const p=game.player||{x:770,y:960,characterId:"dante"};
      const menu=["menu","title","character","characters","select","load","exited"].includes(game.state);
      const tx=menu?770+Math.sin(time*.07)*22:p.x,ty=menu?955+Math.cos(time*.055)*12:p.y;
      const cx=Math.max(0,Math.min(world.width-W,tx-(W/2))),cy=Math.max(0,Math.min(world.height-H,ty-(H/2+4)));
      const smoothing=menu?.018:.16;
      if(!this.initialized||Math.hypot(cx-this.camera.x,cy-this.camera.y)>H){this.camera.x=cx;this.camera.y=cy;this.initialized=true;}
      else{this.camera.x+=(cx-this.camera.x)*smoothing;this.camera.y+=(cy-this.camera.y)*smoothing;}
      let ox=Math.round(this.camera.x),oy=Math.round(this.camera.y);
      game.camera={x:ox,y:oy};
      if(game.shakeTime>0&&!menu){
        const power=game.shakePower*Math.min(1,game.shakeTime/.15);
        ox=Math.round(Math.max(0,Math.min(world.width-W,ox+(Math.random()-.5)*2*power)));
        oy=Math.round(Math.max(0,Math.min(world.height-H,oy+(Math.random()-.5)*2*power)));
      }
      game.shakeTime=Math.max(0,(game.shakeTime||0)-Math.min(.1,dt||0));
      game.hurtFlash=Math.max(0,(game.hurtFlash||0)-Math.min(.1,dt||0));
      c.globalAlpha=1;c.setTransform(1,0,0,1,0,0);c.imageSmoothingEnabled=false;
      c.drawImage(this.background,ox,oy,W,H,0,0,W,H);
      c.save();c.translate(-ox,-oy);
      const visible=(x,y,pad=90)=>x>ox-pad&&x<ox+W+pad&&y>oy-pad&&y<oy+H+pad;
      const objects=world.objects||[];
      for(const o of objects)if(["pond","flower","grass"].includes(o.type)&&visible(o.x+o.w/2,o.y+o.h/2,Math.max(o.w||0,o.h||0)+80))drawObject(c,o,time);
      for(const item of world.pickups||[])if(visible(item.x,item.y,30))pickup(c,item,time);
      for(const d of game.drops||[])if(visible(d.x,d.y,20))coin(c,d,time);
      const renderables=[];
      for(const o of objects)if(!["pond","flower","grass"].includes(o.type)&&visible(o.x+o.w/2,o.y+o.h/2,Math.max(o.w||0,o.h||0)+80))renderables.push({y:o.y+o.h,kind:"object",data:o});
      for(const npc of world.npcs||[])if(visible(npc.x,npc.y,35))renderables.push({y:npc.y,kind:"npc",data:npc});
      for(const e of game.enemies||[])if(!e.dead&&visible(e.x,e.y,35))renderables.push({y:e.y,kind:"enemy",data:e});
      if(game.player&&!menu)renderables.push({y:p.y,kind:"player",data:p});
      renderables.sort((a,b)=>a.y-b.y);
      for(const item of renderables){
        if(item.kind==="object"){
          const o=item.data;
          const hiding=p.x>o.x-18&&p.x<o.x+o.w+18&&p.y<o.y+o.h&&p.y>o.y-40;
          c.globalAlpha=!menu&&hiding&&["tree","house","arch","cliff"].includes(o.type)?.62:1;
          drawObject(c,o,time);c.globalAlpha=1;
        }else if(item.kind==="enemy")drawEnemy(c,item.data,time);
        else if(item.kind==="npc"){
          const n=item.data;
          drawCharacter(c,{...n,characterId:["paco","gero","tena","dante"][Math.abs(n.variant||0)%4],moving:n.moving===undefined?true:n.moving},time);
          if(n.name&&Math.hypot(p.x-n.x,p.y-n.y)<42&&!menu)pixelText(c,n.name,n.x,n.y-33,"#e1d6af",6);
        } else drawCharacter(c,p,time);
      }
      for(const projectile of game.projectiles||[]){
        const x=projectile.x,y=projectile.y;
        if(!visible(x,y,20))continue;
        c.save();c.translate(Math.round(x),Math.round(y));
        if(projectile.type==="stone"){rect(c,-3,-3,6,5,"#577073");rect(c,-2,-3,4,3,"#aebdb2");}
        else if(projectile.type==="venom"){
          const w=Math.sin(time*20)>0?1:0;c.globalAlpha=.35;rect(c,-projectile.dx*8-2,-projectile.dy*8-2,4,4,"#9fdc72");c.globalAlpha=1;
          rect(c,-4-w,-3,8+w*2,6,"#3c5a2a");rect(c,-3,-2-w,6,4+w*2,"#94d36a");rect(c,-1,-2,2,2,"#e4ffc4");
        }
        else{
          c.rotate(Math.atan2(projectile.dy||projectile.vy||0,projectile.dx||projectile.vx||1));
          rect(c,-7,0,13,1,"#dec69b");rect(c,5,-1,4,3,"#ced7c6");rect(c,-7,-2,3,2,"#b8a986");rect(c,-7,1,3,2,"#b8a986");
        }c.restore();
      }
      if(p.attackAnim>0&&!menu){
        const dir=p.dir||"down", angle={right:0,down:Math.PI/2,left:Math.PI,up:-Math.PI/2}[dir];
        c.save();c.translate(Math.round(p.x),Math.round(p.y-10));c.strokeStyle="#f5e9b9";c.lineWidth=3;
        c.beginPath();c.arc(0,0,23,angle-.85,angle+.85);c.stroke();c.strokeStyle="#b6ceba";c.lineWidth=1;
        c.beginPath();c.arc(0,0,27,angle-.6,angle+.6);c.stroke();c.restore();
      }
      for(const effect of game.effects||[])this.drawEffect(c,effect,time);
      // A few moving grass tips keep the prairie alive without hiding combat.
      if(game.settings?.particles!==false){
        for(let k=0;k<18;k++){
          const wx=ox+((hash(k,1)*700+time*(2+k%3))%700)-30,wy=oy+((hash(k,2)*400+time*(k%2?.9:-.8))%400)-20;
          if(zoneAt(world,wx,wy)!=="cave"){
            c.globalAlpha=.25+Math.sin(time+k)*.12;rect(c,wx,wy,2,1,"#f9e9b1");
          }
        }
        c.globalAlpha=1;
      }
      if(game.biome==="weeds"&&!menu){
        for(let k=0;k<4;k++)tuft(c,p.x-8+k*5,p.y+2,"#587a43",true,Math.sin(time*2)>0?1:0);
      }
      c.restore();
      if(game.biome==="cave"&&!menu){
        const px=p.x-ox,py=p.y-oy-10;
        const dark=c.createRadialGradient(px,py,38,px,py,220);
        dark.addColorStop(0,"rgba(17,23,31,0)");dark.addColorStop(.6,"rgba(15,20,28,.22)");dark.addColorStop(1,"rgba(10,15,23,.70)");
        c.fillStyle=dark;c.fillRect(0,0,W,H);
        for(const o of objects)if(o.type==="lantern"&&visible(o.x,o.y,60)){
          const glow=c.createRadialGradient(o.x-ox+o.w/2,o.y-oy-20,1,o.x-ox+o.w/2,o.y-oy-20,38);
          glow.addColorStop(0,"rgba(243,188,89,.14)");glow.addColorStop(1,"rgba(243,188,89,0)");
          c.fillStyle=glow;c.fillRect(o.x-ox-38,o.y-oy-58,76,76);
        }
      } else {
        const vignette=c.createRadialGradient((W/2),(H*.445),125,(W/2),(H/2),380);
        vignette.addColorStop(0,"rgba(36,49,29,0)");vignette.addColorStop(1,"rgba(29,45,30,.16)");
        c.fillStyle=vignette;c.fillRect(0,0,W,H);
        const hour=(8+(menu?0:(p.playTime||0))/60)%24;
        const night=Math.max(0,Math.cos((hour-1)*Math.PI/12));
        const sunset=Math.max(0,1-Math.abs(hour-18)/2);
        if(night>.01){c.fillStyle="rgba(24,34,67,"+(night*.34)+")";c.fillRect(0,0,W,H);}
        if(sunset>.01){c.fillStyle="rgba(217,122,69,"+(sunset*.09)+")";c.fillRect(0,0,W,H);}
        if(night>.05)for(const o of objects){
          if(!visible(o.x,o.y,(H*.445)))continue;
          if(o.type==="lantern"){
            const lx=o.x-ox+o.w/2,ly=o.y-oy-20;
            const glow=c.createRadialGradient(lx,ly,1,lx,ly,43);
            glow.addColorStop(0,"rgba(255,210,114,"+(night*.27)+")");glow.addColorStop(1,"rgba(255,191,88,0)");
            c.fillStyle=glow;c.fillRect(lx-43,ly-43,86,86);
          }else if(o.type==="house"){
            const wy=o.y+Math.max(9,o.h*.3)-oy;
            c.globalAlpha=night*.53;
            for(const wx of [o.x+15,o.x+o.w-29]){rect(c,wx-ox,wy+2,6,7,"#edc97e");rect(c,wx-ox+8,wy+2,6,7,"#edc97e");rect(c,wx-ox,wy+11,6,5,"#dbab68");rect(c,wx-ox+8,wy+11,6,5,"#dbab68");}
            c.globalAlpha=1;
          }
        }
      }
      if(game.hurtFlash>0&&!menu){c.fillStyle="rgba(190,52,44,"+(game.hurtFlash*.55)+")";c.fillRect(0,0,W,H);}
      const maxHealth=p.maxHp||(game.stats?game.stats().maxHealth:0);
      if(p.hp>0&&maxHealth&&p.hp/maxHealth<.3&&!menu){
        const danger=c.createRadialGradient((W/2),(H/2),130,(W/2),(H/2),370);
        danger.addColorStop(0,"rgba(136,45,42,0)");danger.addColorStop(1,"rgba(136,45,42,"+(.14+Math.sin(time*3)*.035)+")");
        c.fillStyle=danger;c.fillRect(0,0,W,H);
      }
    }
    drawEffect(c,e,time) {
      const max=e.maxLife||e.duration||.6;
      const progress=Math.min(1,Math.max(0,1-(e.life===undefined?max:e.life)/max));
      const x=e.x,y=e.y;
      c.save();c.globalAlpha=Math.max(0,Math.min(1,(1-progress)*1.8));
      if(e.type==="wave"){
        const radius=(e.radius||120)*Math.max(.06,progress);
        c.strokeStyle="#efd598";c.lineWidth=2;
        c.beginPath();c.ellipse(x,y-3,radius,radius*.65,0,0,Math.PI*2);c.stroke();
        c.strokeStyle="#b99c71";c.lineWidth=1;c.beginPath();c.ellipse(x,y-3,Math.max(0,radius-5),Math.max(0,radius*.65-3),0,0,Math.PI*2);c.stroke();
        for(let k=0;k<12;k++){const a=k*Math.PI/6;rect(c,x+Math.cos(a)*radius,y-3+Math.sin(a)*radius*.65,2,3,"#edd9a3");}
      } else if(e.type==="heart"){heart(c,x,y-12-progress*16,"#e9ac9a");}
      else if(e.type==="level"){
        for(let k=0;k<12;k++){
          const a=k*Math.PI/6,r=10+progress*35;
          rect(c,x+Math.cos(a)*r,y-12+Math.sin(a)*r*.7,2,3,"#f0d083");
        }
        pixelText(c,e.text||"¡NIVEL!",x,y-35-progress*16,"#f9dc88",9);
      } else if(e.type==="spark"){
        const n=e.crit?10:6,color=e.crit?"#ffe17d":"#f6e2b8";
        for(let k=0;k<n;k++){const a=hash(k,Math.floor(e.seed||0),4)*Math.PI*2,r=4+progress*(e.crit?26:16)*(.6+hash(k,7)*.6);rect(c,x+Math.cos(a)*r,y+Math.sin(a)*r*.8,e.crit?3:2,2,color);}
      } else if(e.type==="dust"){
        for(let k=0;k<4;k++){const a=k*1.7,r=2+progress*9;c.globalAlpha=(1-progress)*.5;rect(c,x+Math.cos(a)*r-2,y-2+Math.sin(a)*r*.4-progress*4,3+progress*3,2+progress*2,"#d8c99c");}
      } else if(e.type==="poof"){
        for(let k=0;k<9;k++){const a=hash(k,Math.floor(e.seed||0),9)*Math.PI*2,r=3+progress*20;c.globalAlpha=(1-progress)*.85;rect(c,x+Math.cos(a)*r-2,y+Math.sin(a)*r*.6-progress*10,4+progress*4,4+progress*3,k%3?"#e9e2cc":"#b7b09a");}
      } else if(e.type==="leaf"){
        for(let k=0;k<6;k++){const a=k*1.05+(e.seed||0),r=6+progress*14;rect(c,x+Math.cos(a)*r,y-10+Math.sin(a)*r*.6-progress*12,3,2,k%2?"#9fd07c":"#6fae58");}
      } else if(e.type==="slash"){
        c.strokeStyle="#f0e6bb";c.lineWidth=2;
        c.beginPath();c.arc(x,y-8,12+progress*12,-1.3,1.5);c.stroke();
      } else {
        const color=e.crit?"#ffd65c":e.type==="coin"?"#f4d36b":e.type==="heal"?"#b8d693":(e.type==="poison"||e.poison)?"#d3a7da":e.type==="miss"?"#bfe6f0":"#f1d0a3";
        if(e.text!==undefined){const pop=e.crit?1+Math.max(0,.25-progress)*2:1;pixelText(c,String(e.text),x,y-19-progress*21,color,Math.round((e.type==="heal"||e.type==="coin"?8:e.crit?12:9)*pop));}
        else for(let k=0;k<5;k++){
          const a=k*1.26+time,r=3+progress*12;
          rect(c,x+Math.cos(a)*r,y-9+Math.sin(a)*r,2,2,color);
        }
      }
      c.restore();
    }
  }
  function drawPortrait(canvas,id,scale) {
    const c=canvas.getContext("2d"),size=canvas.width||96;
    if(!canvas.width)canvas.width=96;
    if(!canvas.height)canvas.height=96;
    c.clearRect(0,0,canvas.width,canvas.height);c.imageSmoothingEnabled=false;
    const colors=({gero:["#779a8c","#3b5c56"],paco:["#b39b6e","#756745"],fede:["#967585","#514859"],pepe:["#b9a868","#797243"],tena:["#a68576","#66564e"],dante:["#7e95a0","#475c64"]})[id]||["#b9a868","#797243"];
    rect(c,0,0,canvas.width,canvas.height,colors[1]);
    rect(c,3,3,canvas.width-6,canvas.height-6,colors[0]);
    for(let k=0;k<12;k++)rect(c,hash(k,2)*canvas.width,hash(k,8)*canvas.height,2,2,"#e7dcc42b");
    const s=scale||Math.min(canvas.width/22,canvas.height/30);
    c.save();c.translate(canvas.width/2,canvas.height-5);c.scale(s,s);
    drawCharacter(c,{x:0,y:0,characterId:id,dir:"down"},0,true);c.restore();
  }
  function drawMinimap(canvas,game) {
    if(!game.world)return;
    const c=canvas.getContext("2d"),w=canvas.width,h=canvas.height,world=game.world;
    const sx=(w-8)/world.width,sy=(h-8)/world.height;
    c.imageSmoothingEnabled=false;c.clearRect(0,0,w,h);
    rect(c,0,0,w,h,"#293b32");rect(c,3,3,w-6,h-6,"#82916a");
    for(const z of world.zones||[]){
      const col=z.id==="cave"?"#59616b":z.id==="weeds"?"#a0a26a":"#789469";
      rect(c,4+z.x*sx,4+z.y*sy,z.w*sx,z.h*sy,col);
    }
    // Explicit ordering preserves the cave where it overlaps the village.
    const cave=world.zones?.find(z=>z.id==="cave");
    if(cave)rect(c,4+cave.x*sx,4+cave.y*sy,cave.w*sx,cave.h*sy,"#59616b");
    for(const path of world.paths||[])rect(c,4+path.x*sx,4+path.y*sy,Math.max(1,path.w*sx),Math.max(1,path.h*sy),"#c5b180");
    for(const o of world.objects||[]){
      if(o.type==="house")rect(c,4+o.x*sx,4+o.y*sy,Math.max(2,o.w*sx),Math.max(2,o.h*sy),"#ad785c");
      if(o.type==="pond")rect(c,4+o.x*sx,4+o.y*sy,o.w*sx,o.h*sy,"#6294a0");
    }
    for(const p of world.pickups||[])if(!p.collected&&p.type!=="herb")rect(c,3+p.x*sx,3+p.y*sy,2,2,"#f4d385");
    if(w>300){
      for(const o of world.objects||[])if(o.type==="stall")pixelText(c,"$",4+(o.x+o.w/2)*sx,4+o.y*sy-4,"#f4d36b",12);
      for(const e of game.enemies||[])if(e.type==="capo"||e.type==="yarara")pixelText(c,e.dead?"✓":"☠",4+e.homeX*sx,4+e.homeY*sy,e.dead?"#bfe0a8":"#ff9b84",13);
    }
    if(game.player){const x=4+game.player.x*sx,y=4+game.player.y*sy;rect(c,x-2,y-2,5,5,"#344c3b");rect(c,x-1,y-1,3,3,"#fff0bd");}
    if(w>300){
      pixelText(c,"ALDEA DE LOS AROMOS",4+850*sx,4+1260*sy,"#f3e9c1",11);
      pixelText(c,"CUEVA DEL ECO",4+450*sx,4+280*sy,"#e4ddd0",11);
      pixelText(c,"LOS YUYOS",4+1950*sx,4+900*sy,"#f1e5b6",11);
      pixelText(c,"N",w-19,18,"#eadbb0",10);rect(c,w-20,27,2,15,"#ddc99a");
      poly(c,[[w-19,23],[w-24,30],[w-14,30]],"#ddc99a");
    }
    rect(c,0,0,w,1,"#b7ab7d");rect(c,0,h-1,w,1,"#b7ab7d");rect(c,0,0,1,h,"#b7ab7d");rect(c,w-1,0,1,h,"#b7ab7d");
  }
  Z.Renderer=Renderer;Z.drawPortrait=drawPortrait;Z.drawMinimap=drawMinimap;
  Renderer.drawPortrait=drawPortrait;
})();

