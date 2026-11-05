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
  const Px = Z.Pixel, rect = Px.rect, poly = Px.poly, rrect = Px.rrect;
  function shadow(c, x, y, w = 18, h = 5) {
    Px.oval(c, x, y, w / 2, Math.max(1.5, h / 2), P.shadow);
  }
  function outlined(c, x, y, w, h, color, outline = P.ink) {
    rect(c, x, y, w, h, outline); rect(c, x + 1, y + 1, w - 2, h - 2, color);
  }
  // Dibuja un sprite en dos pasadas: primero su contorno y encima el sprite (o su destello blanco).
  function sprite(c, outline, flash, draw) {
    const scale = Px.scale;
    if (outline) { Px.mode = "outline"; Px.outlineColor = outline; c.save(); draw(); c.restore(); Px.scale = scale; }
    Px.mode = flash ? "flash" : null; c.save(); draw(); c.restore(); Px.scale = scale; Px.mode = null;
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
      for (const id of ["sanctum", "magic", "throne", "cave3", "cave2", "altar", "cave", "weeds", "village"]) {
        const z = world.zones.find(a => a.id === id);
        if (z && x >= z.x && y >= z.y && x < z.x + z.w && y < z.y + z.h) return id;
      }
      return "void";
    }
    return x < 1000 && y < 520 ? "cave" : x >= 1550 ? "weeds" : "village";
  }
  const isCaveZone = zone => /^cave/.test(zone || "");
  // Área que puede mostrar la cámara: la superficie o la zona cerrada (cueva profunda o trono) donde estás.
  function viewArea(world, biome) {
    // El Santuario y el Pueblo Mágico comparten la vista de toda la dimensión.
    const id = (Z.VIEW_ZONES && Z.VIEW_ZONES[biome]) || biome;
    const enclosed = Z.ENCLOSED_ZONES && Z.ENCLOSED_ZONES[id] && world.zones && world.zones.find(z => z.id === id);
    const left = world.left || 0;
    return enclosed || { x: left, y: 0, w: world.width - left, h: Math.min(world.height, Z.SURFACE_HEIGHT || world.height) };
  }
  function pixelText(c, text, x, y, color = P.cream, size = 7, align = "center") {
    Px.text(c, text, x, y, color, size, align);
  }
  const TAU = Math.PI * 2;
  const LOOKS = {
    dante: { shirt: "#405968", shade: "#293d4c", light: "#567a8c", pants: "#384749", pantsShade: "#2a3638", boot: "#293330", skin: "#d9a476", skinShade: "#b47c55", hair: "#4a3830", fat: 1 },
    gero: { shirt: "#6b8d91", shade: "#45676f", light: "#8db0b0", pants: "#384749", pantsShade: "#2a3638", boot: "#293330", skin: "#d9a476", skinShade: "#b47c55", hair: "#523e2f", fat: 0 },
    paco: { shirt: "#937044", shade: "#684f36", light: "#b18d59", pants: "#384749", pantsShade: "#2a3638", boot: "#293330", skin: "#bf8861", skinShade: "#946547", hair: "#554633", fat: 0 },
    fede: { shirt: "#ba434a", shade: "#873747", light: "#d9625f", pants: "#3f597a", pantsShade: "#2f4460", boot: "#293330", skin: "#d9a476", skinShade: "#b47c55", hair: "#554633", fat: 0 },
    pepe: { shirt: "#e3c95f", shade: "#b89742", light: "#f4e394", pants: "#cf9b44", pantsShade: "#a67a32", boot: "#de8e3f", skin: "#f0dc87", skinShade: "#d1b95f", hair: "#554633", fat: 0 },
    tena: { shirt: "#ede6cb", shade: "#b5b8a6", light: "#fffbea", pants: "#384749", pantsShade: "#2a3638", boot: "#293330", skin: "#d9a476", skinShade: "#b47c55", hair: "#5d4831", fat: 0 }
  };
  const FACING = { down: [0, 1], up: [0, -1], left: [-1, 0], right: [1, 0] };
  const SEEDS = { dante: .3, gero: 1.1, paco: 2.3, fede: 3.7, pepe: 4.4, tena: 5.2 };
  const weaponId = player => typeof player.weapon === "string" ? player.weapon : player.weapon && player.weapon.id;
  const elementalHue = time => ["#7fe6f2", "#f2c94c", "#9ad16a", "#e0574b"][Math.floor(time * 3) % 4];
  // El arma en la mano, con la empuñadura a la altura de ox; se mueve con el brazo.
  function heldWeapon(c, weapon, ox, dy, time) {
    if (weapon === "sword") {
      rect(c, ox, -14 + dy, 2, 10, "#8faeaf"); rect(c, ox + 1, -15 + dy, 1, 9, "#d9e5cc");
      rect(c, ox - 2, -6 + dy, 6, 2, "#c19a54"); rect(c, ox, -4 + dy, 2, 3, "#80573b");
    } else if (weapon === "bow") {
      rect(c, ox + 1, -15 + dy, 2, 2, "#b18349"); rect(c, ox + 3, -13 + dy, 2, 8, "#b18349");
      rect(c, ox + 1, -5 + dy, 2, 2, "#b18349"); rect(c, ox + 1, -13 + dy, 1, 8, "#d7c791");
    } else if (weapon === "stone") {
      rect(c, ox - 1, -9 + dy, 5, 4, "#606a70"); rect(c, ox, -10 + dy, 3, 3, "#929d98");
    } else if (weapon === "elemental") {
      rect(c, ox, -19 + dy, 3, 15, "#2c3a4a"); rect(c, ox + 1, -20 + dy, 2, 15, elementalHue(time)); rect(c, ox + 1, -20 + dy, 1, 14, "#ffffff");
      rect(c, ox - 3, -6 + dy, 8, 2, "#7b4fc0"); rect(c, ox, -4 + dy, 2, 3, "#3a2a52");
    }
  }
  // Cuerpo del personaje: un solo dibujo para el contorno, el color y el destello.
  function characterBody(c, id, L, v, time) {
    const { side, back, frame, moving, attacking, weapon, blink, up } = v, fat = L.fat;
    const swing = moving ? (frame === 0 ? 1 : frame === 2 ? -1 : 0) : 0;
    // Piernas: de frente una se levanta; de costado se abren como un paso real.
    if (side) {
      const stride = swing * 3, passLift = moving && frame % 2 ? 1 : 0;
      rect(c, -2 - stride, -7, 4, 5, L.pantsShade); rect(c, -2 - stride, -2, 5, 2, L.boot);
      rect(c, -2 + stride, -7, 4, 5 - passLift, L.pants); rect(c, -2 + stride, -2 - passLift, 5, 2, L.boot);
    } else {
      const liftL = swing > 0 ? 2 : 0, liftR = swing < 0 ? 2 : 0;
      rect(c, -5 - fat, -7, 4, 5 - liftL, L.pants); rect(c, 1, -7, 4 + fat, 5 - liftR, L.pants);
      rect(c, -2 - fat, -7, 1, 5 - liftL, L.pantsShade); rect(c, 4 + fat, -7, 1, 5 - liftR, L.pantsShade);
      rect(c, id === "pepe" ? -6 : -5 - fat, -2 - liftL, id === "pepe" ? 6 : 5, 2, L.boot); rect(c, 1, -2 - liftR, id === "pepe" ? 6 : 5 + fat, 2, L.boot);
    }
    c.translate(0, up);
    const hand = id === "fede" ? "#b4424b" : id === "pepe" ? "#ebd776" : L.skin, sleeve = id === "pepe" ? "#ebd776" : L.shade;
    const armL = moving ? swing : 0, armR = moving ? -swing : 0, reach = attacking ? (side ? 5 : 0) : 0;
    const showWeapon = weapon && !attacking && weapon !== "fists";
    if (back && showWeapon) heldWeapon(c, weapon, 9 + fat, armR, time);
    if (side) { rect(c, -1 - swing * 2, -14, 3, 6, L.shade); rect(c, -1 - swing * 2, -9, 3, 2, L.skinShade); }
    // Torso
    const tx = side ? -4 - fat : -5 - fat, tw = side ? 8 + fat * 2 : 10 + fat * 2;
    rect(c, tx, -15, tw, 9, L.shirt); rect(c, tx, -8, tw, 2, L.shade); rect(c, tx + tw - 1, -15, 1, 8, L.shade); rect(c, tx, -15, 1, 7, L.light);
    if (!back && !side) {
      if (id === "tena") { rect(c, -4, -15, 2, 8, "#b94e46"); rect(c, 1, -15, 2, 8, "#b94e46"); rect(c, 3, -13, 1, 2, "#dcbe72"); }
      if (id === "dante") { rect(c, -2, -12, 4, 1, "#d1dfc7"); rect(c, -1, -11, 2, 2, "#93b7a7"); }
      if (id === "fede") { rect(c, -1, -14, 2, 5, "#422e39"); rect(c, -3, -13, 6, 1, "#422e39"); rect(c, -2, -11, 4, 1, "#422e39"); rect(c, -5, -8, 3, 2, "#344e72"); rect(c, 2, -8, 3, 2, "#344e72"); }
    } else if (side && !back) {
      if (id === "tena") rect(c, 0, -15, 2, 8, "#b94e46");
      if (id === "fede") { rect(c, -1, -14, 2, 5, "#422e39"); rect(c, -4, -8, 8, 2, "#344e72"); }
    } else if (back && id === "tena") { rect(c, -3, -14, 1, 5, "#aa453f"); rect(c, 2, -14, 1, 5, "#aa453f"); rect(c, -1, -12, 2, 1, "#b69753"); }
    // Brazos
    if (side) {
      const ax = -1 + swing * 2;
      if (reach) { rect(c, 0, -13, 7, 3, sleeve); rect(c, 7, -13, 3, 3, hand); }
      else { rect(c, ax, -14, 3, 6, sleeve); rect(c, ax, -9, 3, 2, hand); if (showWeapon) heldWeapon(c, weapon, ax + 1, 1, time); }
    } else {
      rect(c, -8 - fat, -14 + armL, 3, 6, sleeve); rect(c, -8 - fat, -9 + armL, 3, 3, hand);
      if (attacking) { rect(c, 5 + fat, -15, 3, 5, sleeve); rect(c, 5 + fat, -11, 3, 2, hand); }
      else { rect(c, 5 + fat, -14 + armR, 3, 6, sleeve); rect(c, 5 + fat, -9 + armR, 3, 3, hand); if (!back && showWeapon) heldWeapon(c, weapon, 9 + fat, armR, time); }
      if (id === "pepe") { rect(c, -9, -14 + armL, 3, 6, "#ebd776"); if (!attacking) rect(c, 7, -14 + armR, 3, 6, "#ebd776"); }
    }
    // Cabeza
    const fx = side ? 2 : 0;
    if (id === "fede") {
      rect(c, -5, -24, 10, 10, "#c54a4c"); rect(c, -6, -22, 12, 6, "#c54a4c"); rect(c, -5, -23, 10, 1, "#e1695b"); rect(c, -6, -19, 12, 1, "#8d3c48");
      rect(c, side ? -3 : -1, -24, 1, 9, "#8d3c48");
      if (!back) {
        if (side) { rect(c, 1, -22, 4, 3, "#edebd5"); rect(c, 3, blink ? -21 : -22, 2, blink ? 1 : 2, "#262f37"); }
        else { rect(c, -4, -22, 3, 3, "#edebd5"); rect(c, 2, -22, 3, 3, "#edebd5"); rect(c, -3, blink ? -21 : -22, 2, blink ? 1 : 2, "#262f37"); rect(c, 2, blink ? -21 : -22, 2, blink ? 1 : 2, "#262f37"); }
      }
    } else if (id === "pepe") {
      rect(c, -6, -24, 12, 10, "#f0dc87"); rect(c, -7, -21, 14, 6, "#f0dc87"); rect(c, -6, -16, 12, 2, "#d9c26b"); rect(c, -6, -24, 2, 3, "#f8eaa8");
      rect(c, -3, -26, 2, 3, "#c74f45"); rect(c, 0, -27, 2, 4, "#e1644b"); rect(c, 3, -25, 2, 2, "#c74f45");
      if (!back) {
        if (side) { rect(c, 2, blink ? -19 : -20, 2, blink ? 1 : 2, "#31392f"); rect(c, 5, -18, 5, 2, "#d68e3d"); rect(c, 5, -16, 4, 1, "#ebaa48"); rect(c, 4, -15, 2, 2, "#c64d46"); }
        else { rect(c, -4, blink ? -19 : -20, 2, blink ? 1 : 2, "#31392f"); rect(c, 3, blink ? -19 : -20, 2, blink ? 1 : 2, "#31392f"); rect(c, -2, -18, 5, 2, "#d68e3d"); rect(c, -1, -16, 3, 2, "#ebaa48"); rect(c, -1, -14, 2, 2, "#c64d46"); }
      }
    } else {
      rect(c, -5, -24, 10, 10, L.skin); rect(c, -6, -22, 12, 6, L.skin); rect(c, -4, -16, 8, 2, L.skinShade); rect(c, -6, -18, 1, 2, L.skinShade);
      if (!back) {
        if (side) { rect(c, 1, blink ? -19 : -20, 2, blink ? 1 : 2, "#303831"); rect(c, 5, -19, 2, 2, L.skinShade); rect(c, 2, -16, 3, 1, "#855c4b"); }
        else {
          rect(c, -4, blink ? -19 : -20, 2, blink ? 1 : 2, "#303831"); rect(c, 3, blink ? -19 : -20, 2, blink ? 1 : 2, "#303831");
          rect(c, 0, -18, 1, 2, L.skinShade); rect(c, -1, -16, 3, 1, "#855c4b");
        }
      }
      const hair = L.hair;
      rect(c, -5, -24, 10, 3, hair); rect(c, -6, -22, 2, 4, hair);
      if (back) rect(c, -5, -22, 11, 7, hair); else if (side) rect(c, -5, -22, 4, 6, hair); else rect(c, 4, -22, 2, 2, hair);
      rect(c, -3, -24, 5, 1, "#ffffff22");
      if (id === "gero") {
        rect(c, -6, -25, 3, 3, hair); rect(c, -2, -25, 3, 3, hair); rect(c, 3, -24, 3, 3, hair);
        rect(c, -3, -26, 7, 2, "#2c3d51"); rect(c, -2, -27, 5, 1, "#507786");
        rect(c, -6, -19, 2, 3, hair); if (!side) rect(c, 5, -19, 2, 3, hair);
      }
      if (id === "paco") {
        rect(c, -5, -27, 10, 5, "#78613f"); rect(c, -4, -28, 8, 2, "#a0804d"); rect(c, -5, -24, 10, 2, "#564837"); rect(c, -9, -23, 18, 2, "#b19660"); rect(c, -7, -21, 14, 1, "#6d583d");
        rect(c, -3 + fx, -15, 6, 2, "#c45245"); if (!back) rect(c, -1 + fx, -13, 2, 3, "#c45245");
      }
      if (id === "dante") {
        if (!back) {
          if (side) {
            rect(c, 0, -20, 6, 3, "#273331"); rect(c, 1, -19, 4, 1, "#86b5b4"); rect(c, -5, -19, 5, 1, "#273331");
            rect(c, -1, -16, 7, 2, hair); rect(c, 0, -14, 6, 2, hair); rect(c, 1, -12, 3, 1, hair); rect(c, 2, -16, 3, 1, "#c8956e");
          } else {
            rect(c, -5, -20, 4, 3, "#273331"); rect(c, 2, -20, 4, 3, "#273331"); rect(c, -4, -19, 2, 1, "#86b5b4"); rect(c, 3, -19, 2, 1, "#86b5b4"); rect(c, -1, -19, 3, 1, "#273331");
            rect(c, -5, -16, 10, 2, hair); rect(c, -4, -14, 8, 2, hair); rect(c, -2, -12, 4, 1, hair); rect(c, -2, -16, 4, 1, "#c8956e");
          }
        }
        rect(c, -4, -25, 7, 1, hair);
      }
    }
  }
  // Tajo, golpe o disparo del personaje, en la dirección exacta del ataque.
  function drawAttack(c, p, time) {
    const weapon = weaponId(p) || "fists", raw = 1 - p.attackAnim / .24, k = Math.min(1, Math.ceil(raw * 6) / 6);
    const facing = FACING[p.dir] || FACING.down, ax = p.attackX !== undefined ? p.attackX : facing[0], ay = p.attackY !== undefined ? p.attackY : facing[1], angle = Math.atan2(ay, ax);
    c.save(); c.translate(Math.round(p.x), Math.round(p.y - 10));
    if (weapon === "sword" || weapon === "elemental") {
      const sign = (p.combo || 0) % 2 ? -1 : 1, R = weapon === "elemental" ? 33 : 29, ease = 1 - (1 - k) * (1 - k);
      const start = angle - sign * 1.35, head = start + sign * 2.7 * ease, tail = start + sign * 2.7 * Math.max(0, (k - .34) / .66);
      const color = weapon === "elemental" ? elementalHue(time * 4) : "#f5e9b9", steps = 9, outer = [], inner = [], core = [];
      for (let i = 0; i <= steps; i++) {
        const t = i / steps, a = tail + (head - tail) * t;
        outer.push([Math.cos(a) * R, Math.sin(a) * R * .92]); inner.push([Math.cos(a) * (R - t * 12), Math.sin(a) * (R - t * 12) * .92]); core.push([Math.cos(a) * (R - t * 4), Math.sin(a) * (R - t * 4) * .92]);
      }
      if (head !== tail) { poly(c, outer.concat(inner.reverse()), color); poly(c, outer.concat(core.reverse()), "#ffffff"); }
      const cos = Math.cos(head), sin = Math.sin(head);
      Px.line(c, cos * 8, sin * 8, cos * (R - 1), sin * (R - 1), "#46585b", 3); Px.line(c, cos * 8, sin * 8, cos * (R - 2), sin * (R - 2), weapon === "elemental" ? color : "#e4eedd", 1);
      Px.line(c, cos * 4, sin * 4, cos * 8, sin * 8, "#80573b", 2); Px.line(c, cos * 8 - sin * 3, sin * 8 + cos * 3, cos * 8 + sin * 3, sin * 8 - cos * 3, "#c19a54", 2);
    } else if (weapon === "bow") {
      const cos = Math.cos(angle), sin = Math.sin(angle), pull = k < .34 ? 4 : 0, points = [];
      for (let i = -2; i <= 2; i++) { const b = i * .42; points.push([cos * (6 + 7 * Math.cos(b)) - sin * 8 * Math.sin(b), sin * (6 + 7 * Math.cos(b)) + cos * 8 * Math.sin(b)]); }
      for (let i = 0; i < 4; i++) Px.line(c, points[i][0], points[i][1], points[i + 1][0], points[i + 1][1], "#8a5f33", 2);
      Px.line(c, points[0][0], points[0][1], cos * (6 - pull), sin * (6 - pull), "#e7dcae"); Px.line(c, cos * (6 - pull), sin * (6 - pull), points[4][0], points[4][1], "#e7dcae");
    } else if (weapon === "stone") {
      if (k < .5) { const r = 4 + k * 22; rect(c, Math.cos(angle) * r - 2, Math.sin(angle) * r - 2, 5, 4, "#606a70"); rect(c, Math.cos(angle) * r - 1, Math.sin(angle) * r - 2, 3, 2, "#a8b3ad"); }
    } else {
      const look = LOOKS[p.characterId] || LOOKS.pepe, r = 7 + Math.sin(k * Math.PI) * 13, sx = -Math.sin(angle) * 6, sy = Math.cos(angle) * 4, fx = sx + Math.cos(angle) * r, fy = sy + Math.sin(angle) * r;
      sprite(c, P.ink, false, () => { Px.line(c, sx + Math.cos(angle) * 3, sy + Math.sin(angle) * 3, fx, fy, look.shade, 3); rect(c, fx - 3, fy - 3, 6, 6, p.characterId === "fede" ? "#b4424b" : look.skin); rect(c, fx - 2, fy - 3, 3, 1, "#ffffff55"); });
      if (k >= .34 && k <= .67) for (let i = 0; i < 4; i++) { const a = angle + i * Math.PI / 2 + .78, d = 4 + k * 5; rect(c, fx + Math.cos(angle) * 6 + Math.cos(a) * d, fy + Math.sin(angle) * 6 + Math.sin(a) * d, 2, 2, "#f6e2b8"); }
    }
    c.restore();
  }
  // Hacha o pico mientras se junta material.
  function drawTool(c, p, time) {
    const axe = p.gather.tool === "axe", right = p.dir === "right" || p.dir === "down", beat = Math.sin(time * 11), a = (right ? -.9 : Math.PI + .9) + (right ? 1 : -1) * Math.max(-.4, beat) * .9;
    const cos = Math.cos(a), sin = Math.sin(a), ox = Math.round(p.x) + (right ? 5 : -5), oy = Math.round(p.y) - 12;
    Px.line(c, ox, oy, ox + cos * 12, oy + sin * 12, "#80573b", 2);
    if (axe) { rrect(c, ox + cos * 11, oy + sin * 11, a, -2, -1, 5, 5, "#6d7276"); rrect(c, ox + cos * 11, oy + sin * 11, a, 0, 1, 3, 2, "#c7cdd2"); }
    else rrect(c, ox + cos * 12, oy + sin * 12, a, -1, -6, 3, 12, "#8d949a");
  }
  function drawCharacter(c, player, time = 0, portrait = false) {
    const id = player.characterId || player.id || "dante", L = LOOKS[id] || LOOKS.pepe, dir = player.dir || "down";
    const side = dir === "left" || dir === "right", back = dir === "up", moving = !!player.moving && !portrait && !(player.roll > 0);
    // Cuatro cuadros de caminata; en los de paso el cuerpo sube un píxel.
    const cycle = (player.walk !== undefined && player.walk !== null ? player.walk : time * 8) * 1.4 / TAU, frame = moving ? ((Math.floor(cycle * 4) % 4) + 4) % 4 : 0;
    const seed = SEEDS[id] || 0, breathing = !moving && !portrait && !(player.frozen > 0) && Math.sin(time * 2.2 + seed + (player.x || 0) * .01) > .55;
    const blink = !portrait && ((time + seed * 1.7) % 3.4) < .12, attacking = !portrait && player.attackAnim > 0;
    const facing = FACING[dir] || FACING.down, ax = attacking && player.attackX !== undefined ? player.attackX : facing[0], ay = attacking && player.attackY !== undefined ? player.attackY : facing[1];
    const v = { side, back, frame, moving, attacking, weapon: portrait ? null : weaponId(player), blink, up: moving && frame % 2 ? -1 : breathing ? 1 : 0 };
    const flash = !portrait && (player.hitFlash || player.hurt) > 0 && Math.floor(time * 14) % 2 === 0;
    const rolling = !portrait && player.roll > 0, blade = v.weapon === "sword" || v.weapon === "elemental", behind = attacking && blade && ay < -.45;
    if (behind) drawAttack(c, player, time);
    c.save(); c.translate(Math.round(player.x || 0), Math.round(player.y || 0));
    if (!portrait) shadow(c, 0, 0, id === "dante" ? 19 : 16, 5);
    if (attacking) { const lunge = Math.sin(player.attackAnim / .24 * Math.PI) * 2; c.translate(Math.round(ax * lunge), Math.round(ay * lunge)); }
    const body = () => { if (dir === "left") c.scale(-1, 1); characterBody(c, id, L, v, time); };
    if (rolling) {
      // Vuelta en cuatro cuadros de 90°: girar de a cuartos no deforma los píxeles.
      const sign = (player.rollX || 0) < 0 ? -1 : 1, turn = (Math.floor((1 - player.roll / .3) * 4) * sign % 4 + 4) % 4, q = [[1, 0], [0, 1], [-1, 0], [0, -1]][turn];
      const spin = () => { c.translate(0, -10); c.transform(q[0], q[1], -q[1], q[0], 0, 0); c.translate(0, 10); body(); };
      for (let k = 2; k > 0; k--) {
        c.save(); c.translate(Math.round(-(player.rollX || 0) * k * 8), Math.round(-(player.rollY || 0) * k * 8)); c.globalAlpha *= .32 / k;
        Px.mode = "flash"; Px.flashColor = L.light; c.save(); spin(); c.restore(); Px.mode = null; Px.flashColor = "#ffffff"; c.restore();
      }
      sprite(c, "#1b2321", flash, spin);
    } else sprite(c, "#1b2321", flash, body);
    if (dir === "left") c.scale(-1, 1);
    if (!portrait && player.tobi > 0) {
      const raised = Math.floor(player.tobi * 4) % 2 === 0, a = raised ? -.75 : .55;
      rrect(c, 10, -6, a, -2, -29, 5, 32, "#6d4840"); rrect(c, 10, -6, a, -5, -30, 11, 15, "#a95f54"); rrect(c, 10, -6, a, -4, -32, 9, 3, "#ce8a73");
      rrect(c, 10, -6, a, -4, -28, 4, 10, "#d2937c"); rrect(c, 10, -6, a, 2, -26, 3, 9, "#87443f"); rrect(c, 10, -6, a, -1, -10, 2, 11, "#c08b6e");
    }
    if (!portrait && player.dance > 0) { pixelText(c, "?", -12, -30 - Math.sin(time * 5) * 3, "#e5c574", 10); pixelText(c, "?", 12, -27 + Math.sin(time * 5) * 3, "#d1b5d5", 8); }
    if (!portrait && player.buffs && player.buffs.gero > 0) for (let k = 0; k < 5; k++) { const phase = (time * .8 + k / 5) % 1; rect(c, -10 + k * 5, -phase * 31, 1, 3, "#e7d18c"); }
    if (!portrait && player.poison) { const a = Math.floor(time * 6) % 2; rect(c, -7, -29 - a, 2, 2, "#b798d4"); rect(c, 5, -31 + a, 2, 2, "#9f81bf"); }
    if (!portrait && player.bleed) { rect(c, -6, -27 + (time * 20) % 6, 2, 2, "#c43a4a"); rect(c, 4, -25 + (time * 16) % 6, 2, 2, "#a12a3a"); }
    if (!portrait && player.frozen > 0) {
      // Bloque de hielo, con facetas y un brillo que lo recorre.
      poly(c, [[-13, 1], [-15, -15], [-10, -30], [-2, -35], [8, -32], [14, -21], [14, -5], [10, 1]], "#8fdcff88");
      poly(c, [[-11, -2], [-13, -15], [-8, -27], [-3, -31], [-4, -14], [-8, -2]], "#e8fbff55");
      poly(c, [[6, -29], [12, -20], [12, -6], [7, -2], [8, -16]], "#3f8fc055");
      Px.line(c, -10, -30, -2, -35, "#ffffff"); Px.line(c, -2, -35, 8, -32, "#e8fbff"); Px.line(c, -15, -15, -10, -30, "#e8fbff"); Px.line(c, 8, -32, 14, -21, "#b8ecff");
      const shine = Math.floor(time * 2.5) % 8; if (shine < 3) { const sx = -8 + shine * 7, sy = -22 + shine * 5; rect(c, sx, sy, 1, 5, "#ffffff"); rect(c, sx - 2, sy + 2, 5, 1, "#ffffff"); }
      for (const [fx, fy] of [[-14, 1], [-4, 2], [6, 1], [13, 2]]) { rect(c, fx - 2, fy - 1, 5, 2, "#b8ecff"); }
    }
    if (!portrait && player.stunned > 0 && !(player.frozen > 0)) for (let k = 0; k < 3; k++) { const a = time * 5 + k * 2.1; pixelText(c, "✦", Math.cos(a) * 9, -31 + Math.sin(a) * 3, "#f2d16b", 7); }
    c.restore();
    if (attacking && !behind) drawAttack(c, player, time);
    if (!portrait && player.gather && player.gather.tool) drawTool(c, player, time);
  }
  // Indicador mientras se mantiene el analógico de ataque.
  // A distancia: la línea del recorrido real del tiro. Cuerpo a cuerpo: el área que alcanza el golpe.
  // Si el ataque todavía no está listo se ve apagado.
  function drawAimGuide(c, game, p, time) {
    const [dx, dy] = game.attackVector(), angle = Math.atan2(dy, dx), weapon = Z.WEAPON_TYPES[p.weapon];
    const ready = !(p.attackCooldown > 0) && !(p.stunned > 0) && !(p.weapon === "stone" && !p.stoneAmmo), color = ready ? "#ffe9a8" : "#b9ae8c", dark = "#2a2118", alpha = ready ? .55 : .3;
    const stroke = (shape, width, tone) => { c.strokeStyle = tone; c.lineWidth = width; c.beginPath(); shape(); c.stroke(); };
    c.save(); c.globalAlpha = alpha;
    if (p.weapon === "bow" || p.weapon === "stone") {
      const path = game.attackPath(), length = Math.hypot(path.x1 - path.x0, path.y1 - path.y0), line = () => { c.moveTo(path.x0, path.y0); c.lineTo(path.x1, path.y1); };
      stroke(line, 4, dark); stroke(line, 2, color);
      if (ready && length > 0) { const d = (time * 170) % length; rect(c, path.x0 + dx * d - 1, path.y0 + dy * d - 1, 3, 3, "#ffffff"); }
      if (path.target) {
        // Mira sobre el enemigo que va a recibir el tiro.
        const tx = Math.round(path.target.x), ty = Math.round(path.target.y - 12), r = 13, red = "#ff7a5c";
        for (const [sx, sy] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) {
          rect(c, tx + sx * r - (sx < 0 ? 0 : 4), ty + sy * r - (sy < 0 ? 0 : 1), 5, 2, red);
          rect(c, tx + sx * r - (sx < 0 ? 0 : 1), ty + sy * r - (sy < 0 ? 0 : 4), 2, 5, red);
        }
      } else if (path.blocked) {
        // Barra: el tiro se frena contra un obstáculo.
        const bar = () => { c.moveTo(path.x1 - dy * 6, path.y1 + dx * 6); c.lineTo(path.x1 + dy * 6, path.y1 - dx * 6); };
        stroke(bar, 4, dark); stroke(bar, 2, color);
      } else {
        const arrow = () => { c.moveTo(path.x1 - Math.cos(angle - .55) * 8, path.y1 - Math.sin(angle - .55) * 8); c.lineTo(path.x1, path.y1); c.lineTo(path.x1 - Math.cos(angle + .55) * 8, path.y1 - Math.sin(angle + .55) * 8); };
        stroke(arrow, 4, dark); stroke(arrow, 2, color);
      }
    } else {
      // El área es la misma que usa el daño, medida desde los pies: recta (puños) o abanico de ±78° (espadas).
      const cx = Math.round(p.x), cy = Math.round(p.y), half = Math.acos(.2), reach = weapon.range, side = (weapon.width || 0) / 2;
      const area = weapon.width
        ? () => { c.moveTo(cx - dy * side, cy + dx * side); c.lineTo(cx - dy * side + dx * reach, cy + dx * side + dy * reach); c.lineTo(cx + dy * side + dx * reach, cy - dx * side + dy * reach); c.lineTo(cx + dy * side, cy - dx * side); c.closePath(); }
        : () => { c.moveTo(cx, cy); c.arc(cx, cy, reach, angle - half, angle + half); c.closePath(); };
      c.globalAlpha = alpha * .28; c.fillStyle = color; c.beginPath(); area(); c.fill();
      c.globalAlpha = alpha; stroke(area, 3, dark); stroke(area, 1, color);
    }
    c.restore();
  }

  // El herrero: sin remera, musculoso, barbudo y con el martillo en la mano derecha.
  function drawSmith(c, n, time, portrait = false) {
    const skin = "#c98d62", shade = "#a8704b", light = "#e2a879", beard = "#3b2a1f";
    const beat = portrait ? 0 : (time * 1.1) % 1, lift = beat > .78 ? -5 : beat > .7 ? -3 : beat > .62 ? -1 : 0, breath = !portrait && Math.sin(time * 2) > .5 ? 1 : 0;
    c.save(); c.translate(Math.round(n.x || 0), Math.round(n.y || 0));
    if (!portrait) shadow(c, 0, 0, 24, 6);
    const outer = Px.scale; Px.scale = outer * 1.15;
    rect(c,-6,-8,5,7,"#4a3b30");rect(c,1,-8,5,7,"#4a3b30");rect(c,-7,-2,6,2,"#2b2420");rect(c,1,-2,6,2,"#2b2420");
    c.translate(0,breath);
    rect(c,-10,-24,20,15,P.ink);rect(c,-9,-23,18,13,skin);
    rect(c,-7,-19,6,1,shade);rect(c,1,-19,6,1,shade);rect(c,-1,-18,2,7,shade);
    rect(c,-4,-15,3,1,shade);rect(c,1,-15,3,1,shade);rect(c,-4,-12,3,1,shade);rect(c,1,-12,3,1,shade);
    rect(c,-7,-22,4,2,light);rect(c,3,-22,4,2,light);
    rect(c,-9,-11,18,3,"#5b3a22");rect(c,-1,-11,2,2,"#d8b860");
    // Brazo derecho (a la izquierda de la pantalla) con el martillo en alto.
    rect(c,-15,-23,6,11,P.ink);rect(c,-14,-22,5,9,skin);rect(c,-13,-21,2,3,light);rect(c,-14,-13,5,3,shade);
    rect(c,-13,-25+lift,2,14,"#7a5634");rect(c,-17,-30+lift,10,6,"#3d4247");rect(c,-16,-29+lift,8,4,"#8d949a");rect(c,-16,-29+lift,8,1,"#c7cdd2");
    rect(c,9,-23,6,11,P.ink);rect(c,10,-22,5,9,skin);rect(c,11,-21,2,3,light);rect(c,10,-13,5,3,shade);
    rect(c,-3,-26,6,3,skin);
    rect(c,-7,-36,14,12,P.ink);rect(c,-6,-35,12,10,skin);rect(c,-6,-36,12,2,"#2b1d15");
    rect(c,-4,-31,3,1,"#2b1d15");rect(c,1,-31,3,1,"#2b1d15");rect(c,-4,-30,2,1,"#1d1d1d");rect(c,2,-30,2,1,"#1d1d1d");
    rect(c,-7,-29,14,6,beard);rect(c,-6,-23,12,3,beard);rect(c,-4,-20,8,2,beard);rect(c,-2,-28,4,1,"#7a3f33");
    rect(c,-5,-27,2,1,"#5a4232");rect(c,3,-25,2,1,"#5a4232");
    Px.scale = outer;
    c.restore();
  }
  function drawSmithPortrait(canvas) {
    const c = canvas.getContext("2d"); c.imageSmoothingEnabled = false;
    rect(c,0,0,canvas.width,canvas.height,"#3a2a22");rect(c,3,3,canvas.width-6,canvas.height-6,"#5a3d2c");
    Px.glow(c,canvas.width*.5,canvas.height*.85,canvas.width*.8,"#ffa046",.5);
    rect(c,0,0,canvas.width,3,"#3a2a22");rect(c,0,canvas.height-3,canvas.width,3,"#3a2a22");rect(c,0,0,3,canvas.height,"#3a2a22");rect(c,canvas.width-3,0,3,canvas.height,"#3a2a22");
    const s = Math.floor(Math.min(canvas.width / 30, canvas.height / 44)) || 1;
    c.save(); c.translate(Math.round(canvas.width / 2), canvas.height - 6); Px.scale = s; drawSmith(c, { x: 0, y: 0 }, 0, true); Px.scale = 1; c.restore();
  }
  // Vecinos: tienen su propia ropa y no comparten dibujo con los personajes jugables.
  function villagerBody(c, L, v, time) {
    const { side, back, frame, moving, blink, up } = v, fat = L.fat || 0, shoe = L.shoe || "#293330", swing = moving ? (frame === 0 ? 1 : frame === 2 ? -1 : 0) : 0;
    const ink = "#303831", shirt = L.top, shade = L.topShade, light = L.topLight;
    if (back && L.rod) rect(c, 8, -24, 1, 18, "#7a5634");
    // Piernas o pollera.
    if (L.skirt) {
      const w = side ? 10 : 12 + fat * 2, x0 = -w / 2;
      rect(c, side ? -2 - swing * 2 : -4 + swing, -2, side ? 5 : 3, 2, shoe); rect(c, side ? -2 + swing * 2 : 1 - swing, -2, side ? 5 : 3, 2, shoe);
      rect(c, x0, -9, w, 7, L.legs); rect(c, x0, -3, w, 1, L.legsShade); rect(c, x0 + w - 1, -9, 1, 6, L.legsShade);
    } else if (side) {
      const stride = swing * 3, lift = moving && frame % 2 ? 1 : 0, low = L.shorts ? L.skin : L.legs;
      rect(c, -2 - stride, -7, 4, 5, L.shorts ? L.skinShade : L.legsShade); rect(c, -2 - stride, -2, 5, 2, shoe);
      rect(c, -2 + stride, -7, 4, 5 - lift, low); rect(c, -2 + stride, -2 - lift, 5, 2, shoe);
      if (L.shorts) rect(c, -3, -8, 6, 3, L.legs);
    } else {
      const liftL = swing > 0 ? 2 : 0, liftR = swing < 0 ? 2 : 0, low = L.shorts ? L.skin : L.legs;
      rect(c, -5 - fat, -7, 4, 5 - liftL, low); rect(c, 1, -7, 4 + fat, 5 - liftR, low);
      rect(c, -2 - fat, -7, 1, 5 - liftL, L.shorts ? L.skinShade : L.legsShade); rect(c, 4 + fat, -7, 1, 5 - liftR, L.shorts ? L.skinShade : L.legsShade);
      rect(c, -5 - fat, -2 - liftL, 5, 2, shoe); rect(c, 1, -2 - liftR, 5 + fat, 2, shoe);
      if (L.shorts) { rect(c, -5 - fat, -8, 10 + fat * 2, 3, L.legs); rect(c, -1, -6, 2, 1, L.legsShade); }
    }
    c.translate(0, up);
    if (back && L.pack) rect(c, -5, -15, 10, 9, L.pack);
    // Torso.
    const tx = side ? -4 - fat : -5 - fat, tw = side ? 8 + fat * 2 : 10 + fat * 2;
    rect(c, tx, -15, tw, 9, shirt); rect(c, tx, -8, tw, 2, shade); rect(c, tx + tw - 1, -15, 1, 8, shade); rect(c, tx, -15, 1, 7, light);
    if (L.stripes) for (let k = tx + 1; k < tx + tw - 1; k += 3) rect(c, k, -15, 1, 7, L.stripes);
    if (L.plaid) for (let k = -13; k < -7; k += 3) rect(c, tx, k, tw, 1, L.plaid);
    if (L.stripe) { rect(c, tx, -15, 1, 9, L.stripe); rect(c, tx + tw - 1, -15, 1, 9, L.stripe); }
    if (L.flowers) { rect(c, tx + 1, -13, 1, 1, L.flowers); rect(c, tx + tw - 3, -12, 1, 1, L.flowers); }
    if (back && L.hood) rect(c, -4, -16, 8, 4, shade);
    if (!back) {
      if (L.apron) { const ax = side ? -1 : -4 - fat, aw = side ? 5 : 8 + fat * 2; rect(c, ax, -14, aw, L.skirt ? 13 : 11, L.apron); rect(c, ax, -11, aw, 1, "#00000022"); if (!side) { rect(c, ax, -15, 1, 1, L.apron); rect(c, ax + aw - 1, -15, 1, 1, L.apron); } }
      if (!side && L.tie) { rect(c, -1, -15, 2, 5, L.tie); rect(c, -2, -15, 4, 1, light); }
      if (!side && L.sash) Px.line(c, -5 - fat, -14, 4 + fat, -8, L.sash, 2);
      if (!side && L.print) { rect(c, -2, -13, 4, 3, L.print); rect(c, -1, -12, 2, 1, shirt); }
      if (!side && L.pack) { rect(c, -4, -15, 1, 7, L.pack); rect(c, 3, -15, 1, 7, L.pack); }
      if (!side && L.badge) rect(c, 2, -13, 2, 2, "#e7be72");
      if (!side && L.cross) { rect(c, -1, -14, 2, 6, "#d8d4c8"); rect(c, -2, -12, 4, 1, "#d8d4c8"); }
      if (!side && L.whistle) { Px.line(c, -2, -15, 0, -11, "#e9e4d6"); Px.line(c, 2, -15, 0, -11, "#e9e4d6"); rect(c, -1, -11, 3, 2, "#c7cdd2"); }
      if (!side && L.hood) rect(c, -2, -12, 4, 2, shade);
    }
    if (L.bag) { if (!side) Px.line(c, -5 - fat, -15, 4 + fat, -8, "#5a3f26", 1); rect(c, side ? -5 : 3, -10, 6, 5, L.bag); rect(c, side ? -5 : 3, -10, 6, 1, "#5a3f26"); }
    // Brazos y lo que llevan en la mano.
    if (side) {
      const ax = -1 + swing * 2;
      if (L.rod) {
        rect(c, 0, -14, 6, 3, shade); rect(c, 6, -14, 2, 3, L.skin);
        Px.line(c, 7, -13, 22, -21, "#7a5634");
      } else { rect(c, ax, -14, 3, 6, shade); rect(c, ax, -9, 3, 2, L.skin); }
    } else {
      const armL = moving ? swing : 0, armR = moving ? -swing : 0;
      rect(c, -8 - fat, -14 + armL, 3, 6, shade); rect(c, -8 - fat, -9 + armL, 3, 3, L.skin);
      if (L.laptop && !back && !moving) {
        rect(c, 5 + fat, -14, 3, 4, shade); rect(c, -5, -11, 10, 1, shade);
        rect(c, -5, -10, 10, 5, "#3b3f47"); rect(c, -4, -9, 8, 3, "#8fd3e8"); rect(c, -4 + (Math.floor(time * 2) % 6), -8, 2, 1, "#ffffff");
      } else { rect(c, 5 + fat, -14 + armR, 3, 6, shade); rect(c, 5 + fat, -9 + armR, 3, 3, L.skin); }
      if (L.cane && !back) { rect(c, 8 + fat, -11 + armR, 1, 11 - armR, "#6b4a2a"); rect(c, 7 + fat, -12 + armR, 3, 1, "#6b4a2a"); }
    }
    // Cabeza.
    rect(c, -5, -24, 10, 10, L.skin); rect(c, -6, -22, 12, 6, L.skin); rect(c, -4, -16, 8, 2, L.skinShade); rect(c, -6, -18, 1, 2, L.skinShade);
    if (!back) {
      if (side) { rect(c, 1, blink ? -19 : -20, 2, blink ? 1 : 2, ink); rect(c, 5, -19, 2, 2, L.skinShade); if (!L.mustache && !L.beard) rect(c, 2, -16, 3, 1, "#855c4b"); }
      else { rect(c, -4, blink ? -19 : -20, 2, blink ? 1 : 2, ink); rect(c, 3, blink ? -19 : -20, 2, blink ? 1 : 2, ink); rect(c, 0, -18, 1, 2, L.skinShade); if (!L.mustache && !L.beard) rect(c, -1, -16, 3, 1, "#855c4b"); }
      if (L.beard) { if (side) { rect(c, -1, -17, 7, 3, L.beard); rect(c, 0, -14, 5, 1, L.beard); } else { rect(c, -5, -17, 10, 3, L.beard); rect(c, -4, -14, 8, 1, L.beard); } }
      if (L.mustache) { if (side) rect(c, 2, -17, 4, 1, L.mustache); else { rect(c, -3, -17, 6, 1, L.mustache); rect(c, -3, -16, 1, 1, L.mustache); rect(c, 2, -16, 1, 1, L.mustache); } }
      if (L.glasses) { if (side) { rect(c, 0, -21, 5, 1, L.glasses); rect(c, 0, -21, 1, 3, L.glasses); rect(c, 4, -21, 1, 3, L.glasses); rect(c, -5, -21, 5, 1, L.glasses); } else { rect(c, -5, -21, 4, 1, L.glasses); rect(c, 2, -21, 4, 1, L.glasses); rect(c, -5, -21, 1, 3, L.glasses); rect(c, -2, -21, 1, 3, L.glasses); rect(c, 2, -21, 1, 3, L.glasses); rect(c, 5, -21, 1, 3, L.glasses); rect(c, -1, -20, 3, 1, L.glasses); } }
      if (L.earrings && !side) { rect(c, -7, -17, 1, 2, L.earrings); rect(c, 6, -17, 1, 2, L.earrings); }
    }
    // Pelo.
    const hair = L.hair, style = L.hairStyle;
    if (style === "bald") { rect(c, -6, -21, 2, 3, hair); if (!side) rect(c, 4, -21, 2, 3, hair); if (back) rect(c, -5, -20, 10, 3, hair); rect(c, -3, -24, 3, 1, "#ffffff44"); }
    else if (style === "long") { rect(c, -5, -24, 10, 3, hair); rect(c, -6, -22, 2, 10, hair); if (back) rect(c, -6, -22, 12, 12, hair); else if (side) rect(c, -5, -22, 4, 10, hair); else rect(c, 4, -22, 2, 10, hair); }
    else if (style === "curly") { rect(c, -7, -26, 14, 5, hair); rect(c, -8, -24, 3, 6, hair); rect(c, -5, -27, 10, 1, hair); if (back) rect(c, -7, -21, 14, 6, hair); else if (side) rect(c, -6, -21, 5, 5, hair); else rect(c, 5, -24, 3, 6, hair); rect(c, -3, -26, 2, 1, "#ffffff33"); rect(c, 2, -25, 2, 1, "#ffffff33"); }
    else if (style !== "none") {
      rect(c, -5, -24, 10, 3, hair); rect(c, -6, -22, 2, 4, hair);
      if (back) rect(c, -5, -22, 11, 7, hair); else if (side) rect(c, -5, -22, 4, 6, hair); else rect(c, 4, -22, 2, 2, hair);
      rect(c, -3, -24, 5, 1, "#ffffff22");
      if (style === "bun") { rect(c, -2, -27, 5, 3, hair); rect(c, -1, -27, 2, 1, "#ffffff33"); }
    }
    if (L.rollers) for (const [rx, ry] of [[-6, -26], [-2, -27], [2, -27], [5, -25]]) { rect(c, rx, ry, 3, 3, L.rollers); rect(c, rx + 1, ry + 1, 1, 1, "#ffffff"); }
    // Sombreros.
    const hat = L.hatColor;
    if (L.hat === "boina") { rect(c, -7, -25, 14, 3, hat); rect(c, -6, -26, 12, 1, hat); rect(c, -1, -27, 2, 1, hat); rect(c, -6, -23, 12, 1, "#00000044"); }
    if (L.hat === "cap") { rect(c, -6, -26, 12, 4, hat); rect(c, -5, -27, 10, 1, hat); if (back) rect(c, -5, -22, 10, 1, "#00000033"); else if (side) rect(c, 3, -23, 6, 2, hat); else rect(c, -6, -22, 12, 1, "#20293f"); }
    if (L.hat === "police") { rect(c, -7, -27, 14, 3, "#2c3f63"); rect(c, -6, -28, 12, 1, "#41598a"); rect(c, -6, -24, 12, 2, "#17161b"); if (!back) rect(c, -1, -27, 2, 2, "#e7be72"); if (side) rect(c, 3, -23, 5, 1, "#17161b"); }
    if (L.hat === "chef") { rect(c, -5, -28, 10, 6, "#f4f1e6"); rect(c, -7, -32, 14, 5, "#ffffff"); rect(c, -6, -23, 12, 1, "#c8c5b6"); }
    if (L.hat === "piluso") { rect(c, -6, -27, 12, 4, hat); rect(c, -9, -23, 18, 2, hat); rect(c, -9, -22, 18, 1, "#00000022"); rect(c, -6, -24, 12, 1, "#8f8159"); }
    if (L.hat === "veil") {
      rect(c, -7, -26, 14, 5, shirt); rect(c, -8, -24, 3, 13, shirt); rect(c, 5, -24, 3, 13, shirt);
      if (back) rect(c, -8, -24, 16, 14, shirt); else if (side) rect(c, -8, -24, 8, 14, shirt);
      if (!back) rect(c, side ? 0 : -5, -23, side ? 6 : 10, 2, "#f2efe4");
    }
    if (L.ball && !moving) { const bounce = Math.round(Math.abs(Math.sin(time * 4.2 + 1)) * 7); rect(c, -11, -7 - bounce, 5, 5, "#f4f4f0"); rect(c, -9, -6 - bounce, 2, 2, "#23232a"); }
  }
  function drawVillager(c, n, time) {
    const L = n.look, dir = n.dir || "down", side = dir === "left" || dir === "right", moving = !!n.moving, seed = (n.homeX || 0) * .013;
    const cycle = (n.walk || 0) * 1.4 / TAU, frame = moving ? ((Math.floor(cycle * 4) % 4) + 4) % 4 : 0, breathing = !moving && Math.sin(time * 2.2 + seed) > .55;
    const v = { side, back: dir === "up", frame, moving, blink: ((time + seed * 1.7) % 3.4) < .12, up: moving && frame % 2 ? -1 : breathing ? 1 : 0 };
    c.save(); c.translate(Math.round(n.x), Math.round(n.y)); shadow(c, 0, 0, L.kid ? 13 : 16 + (L.fat || 0) * 2, 5);
    const outer = Px.scale; if (L.kid) Px.scale = outer * .84;
    sprite(c, "#1b2321", false, () => { if (dir === "left") c.scale(-1, 1); villagerBody(c, L, v, time); });
    Px.scale = outer;
    // La línea de la caña cae al agua, y el corcho se hunde de vez en cuando.
    if (L.rod) { const f = dir === "left" ? -1 : 1, bite = Math.sin(time * .7 + seed) > .85 ? 2 : Math.round(Math.sin(time * 2) * .6); rect(c, Math.min(f * 22, f * 22 + 1), -21, 1, 21 + bite, "#e9e4d699"); rect(c, f * 22 - 1, bite - 1, 3, 2, "#d9503f"); }
    c.restore();
  }
  // El gaucho, sentado en un tronco, se ceba mates sin apuro al lado de su pava.
  function gauchoBody(c, sip) {
    const skin = "#b97f55", shade = "#94613f", poncho = "#8f3a2e", dark = "#6b2a22", light = "#ad5040", cloth = "#4c5157", clothDark = "#393d42", boot = "#241c18", hat = "#26201d";
    // Pava sobre el piso.
    rect(c, -22, -7, 8, 7, "#596066"); rect(c, -22, -7, 8, 1, "#8b939a"); rect(c, -20, -8, 4, 1, "#3d4247"); rect(c, -14, -6, 3, 1, "#596066"); rect(c, -12, -7, 2, 1, "#596066"); rect(c, -20, -11, 1, 3, "#3d4247"); rect(c, -17, -11, 1, 3, "#3d4247"); rect(c, -20, -11, 4, 1, "#3d4247");
    // Tronco.
    rect(c, -9, -8, 18, 8, "#6f5234"); rect(c, -9, -8, 18, 2, "#a98a5c"); rect(c, -6, -7, 12, 1, "#8c6f46"); rect(c, -7, -4, 1, 4, "#57402a"); rect(c, 5, -5, 1, 5, "#57402a");
    // Bombachas de campo y botas con espuelas.
    rect(c, -8, -12, 7, 6, cloth); rect(c, 1, -12, 7, 6, cloth); rect(c, -2, -12, 1, 6, clothDark); rect(c, 7, -12, 1, 6, clothDark);
    rect(c, -7, -6, 5, 5, boot); rect(c, 2, -6, 5, 5, boot); rect(c, -8, -2, 6, 2, boot); rect(c, 2, -2, 6, 2, boot); rect(c, -6, -5, 1, 3, "#3d322b"); rect(c, 3, -5, 1, 3, "#3d322b"); rect(c, -9, -2, 1, 1, "#d8c078"); rect(c, 8, -2, 1, 1, "#d8c078");
    // Rastra con monedas.
    rect(c, -6, -13, 12, 2, "#241c18"); rect(c, -4, -13, 2, 2, "#d7dbde"); rect(c, -1, -13, 2, 2, "#d7dbde"); rect(c, 2, -13, 2, 2, "#d7dbde");
    // Poncho con guarda pampa.
    poly(c, [[-6, -24], [6, -24], [11, -14], [-11, -14]], poncho); rect(c, -6, -24, 12, 1, light); rect(c, -8, -20, 2, 3, light);
    rect(c, -10, -16, 20, 1, "#e4d6a2"); rect(c, -11, -15, 22, 1, "#1f1a17"); for (let k = -9; k < 10; k += 4) rect(c, k, -15, 2, 1, "#e4d6a2");
    rect(c, 7, -20, 2, 3, dark);
    // Mano libre sobre la rodilla.
    rect(c, -9, -13, 3, 2, skin);
    // Pañuelo al cuello.
    rect(c, -5, -25, 10, 2, "#dcd6c2"); rect(c, -2, -23, 4, 2, "#dcd6c2"); rect(c, -1, -21, 2, 1, "#b9b39f");
    // Cabeza, barba y bigote.
    rect(c, -5, -34, 10, 10, skin); rect(c, -6, -32, 12, 6, skin); rect(c, -6, -30, 1, 2, shade);
    const closed = sip > 4; rect(c, -4, closed ? -29 : -30, 2, closed ? 1 : 2, "#24201c"); rect(c, 3, closed ? -29 : -30, 2, closed ? 1 : 2, "#24201c"); rect(c, 0, -28, 1, 2, shade);
    rect(c, -5, -27, 10, 2, "#3a2c22"); rect(c, -6, -28, 2, 3, "#3a2c22"); rect(c, 4, -28, 2, 3, "#3a2c22"); rect(c, -4, -25, 8, 1, "#3a2c22"); rect(c, -3, -28, 6, 1, "#4c3a2c");
    // Sombrero de ala ancha.
    rect(c, -11, -34, 22, 2, hat); rect(c, -9, -35, 18, 1, hat); rect(c, -6, -40, 12, 5, hat); rect(c, -6, -36, 12, 1, poncho); rect(c, -5, -40, 4, 1, "#3d342f"); rect(c, -10, -33, 20, 1, "#17120f");
    // Brazo con el mate: sube hasta que la bombilla llega a la boca.
    const up = Math.round(sip * 1.15), side = Math.round(sip * .8), mx = 5 - side, my = -15 - up;
    rect(c, 7, -22, 4, 6, poncho); Px.line(c, 9, -16, mx + 3, my + 3, dark, 3);
    rect(c, mx - 1, my + 2, 3, 3, skin);
    rect(c, mx, my, 5, 5, "#6d4a2a"); rect(c, mx + 1, my + 3, 3, 1, "#553819"); rect(c, mx, my - 1, 5, 1, "#d8c078"); rect(c, mx + 1, my - 2, 3, 1, "#59703a");
    rect(c, mx + 1, my - 5, 1, 4, "#d7dbde"); rect(c, mx, my - 5, 1, 1, "#d7dbde");
  }
  function drawGaucho(c, n, time) {
    // Ciclo de 7 s: el mate descansa, sube, se toma y vuelve a bajar.
    const t = (time + 2) % 7, sip = t < 4 ? 0 : t < 4.5 ? (t - 4) * 10 : t < 6.2 ? 5 : t < 6.7 ? (6.7 - t) * 10 : 0;
    c.save(); c.translate(Math.round(n.x), Math.round(n.y)); shadow(c, 0, 0, 28, 6); shadow(c, -18, 0, 12, 3);
    sprite(c, "#1b2321", false, () => gauchoBody(c, sip));
    // Vapor del agua caliente, en la pava y en el mate.
    for (let k = 0; k < 2; k++) { const f = (time * .55 + k * .5) % 1; rect(c, -11 + Math.round(Math.sin(f * 8)), -8 - Math.round(f * 11), 1, 2, "#ffffff55"); }
    if (sip === 0) { const f = (time * .7) % 1; rect(c, 7 + Math.round(Math.sin(f * 7)), -22 - Math.round(f * 7), 1, 2, "#ffffff44"); }
    c.restore();
  }
  // Animales de la aldea: de perfil, mirando a la derecha; hacia la izquierda se espejan.
  function horseBody(c, n, time) {
    const A = n.coat, seed = n.homeX || 0, hoof = "#2a211b", walk = n.moving ? Math.round(Math.sin(time * 7 + seed) * 2) : 0;
    const swish = Math.sin(time * 1.1 + seed) > .55 ? Math.round(Math.sin(time * 9)) : 0, low = horseGrazing(n, time);
    rect(c, -19, -24, 3, 3, A.mane); rect(c, -21 - swish, -22, 3, 10, A.mane); rect(c, -20 - swish * 2, -12, 2, 4, A.mane);
    for (const [x, d] of [[-14, -walk], [8, walk]]) { rect(c, x + d, -12, 3, 10, A.shade); rect(c, x + d, -2, 3, 2, hoof); }
    rect(c, -18, -25, 27, 13, A.coat); rect(c, -17, -26, 25, 2, A.light); rect(c, -18, -14, 27, 2, A.shade); rect(c, -19, -23, 1, 8, A.coat); rect(c, 9, -24, 1, 9, A.coat);
    if (A.dapple) for (const [x, y] of [[-14, -22], [-9, -19], [-4, -23], [2, -20], [5, -16], [-12, -16]]) rect(c, x, y, 2, 2, A.dapple);
    for (const [x, d] of [[-18, walk], [4, -walk]]) { rect(c, x + d, -14, 4, 12, A.coat); rect(c, x + d, -2, 4, 2, hoof); rect(c, x + d, -14, 1, 12, A.light); }
    if (n.saddle) {
      rect(c, -10, -27, 14, 12, "#7f2f28"); rect(c, -10, -18, 14, 1, "#e4d6a2"); rect(c, -10, -16, 14, 1, "#e4d6a2"); for (let k = -9; k < 4; k += 3) rect(c, k, -17, 1, 1, "#e4d6a2");
      rect(c, -8, -30, 10, 4, "#4a3222"); rect(c, -9, -31, 3, 2, "#6b4a2a"); rect(c, 0, -31, 3, 2, "#6b4a2a"); rect(c, -2, -15, 1, 5, "#3a2a1c"); rect(c, -4, -10, 5, 2, "#c7cdd2");
    }
    if (low) {
      // Pastando: el cuello baja hacia adelante y el hocico llega al piso.
      poly(c, [[1, -26], [18, -14], [15, -7], [7, -14]], A.coat); Px.line(c, 1, -27, 16, -16, A.mane, 2);
      rect(c, 14, -14, 7, 6, A.coat); rect(c, 18, -10, 6, 7, A.coat); rect(c, 22, -5, 2, 2, "#2a211b"); rect(c, 15, -17, 2, 3, A.coat); rect(c, 18, -16, 2, 2, A.shade); rect(c, 17, -12, 2, 1, "#1a1512");
      if (A.blaze) Px.line(c, 20, -13, 23, -6, "#f4efe0");
      rect(c, 25, -2, 1, 2, "#6f9a4a"); rect(c, 23, -1, 1, 1, "#88b05a"); rect(c, 27, -2, 1, 2, "#88b05a");
    } else {
      // Con la cabeza alta: cuello grueso y hocico largo, inclinado hacia abajo.
      poly(c, [[0, -26], [10, -38], [17, -33], [10, -15]], A.coat); Px.line(c, 0, -27, 10, -39, A.mane, 2); rect(c, 9, -40, 3, 2, A.mane);
      rect(c, 10, -41, 9, 7, A.coat); rect(c, 15, -38, 7, 6, A.coat); rect(c, 19, -35, 6, 6, A.coat); rect(c, 19, -30, 6, 1, A.shade); rect(c, 23, -33, 1, 1, "#2a211b");
      rect(c, 11, -44, 2, 3, A.coat); rect(c, 14, -44, 2, 3, A.shade); rect(c, 14, -39, 2, 1, "#1a1512"); rect(c, 14, -38, 2, 1, "#00000044");
      if (A.blaze) Px.line(c, 18, -41, 23, -32, "#f4efe0");
      if (n.saddle) { rect(c, 16, -36, 7, 1, "#3a2a1c"); rect(c, 15, -40, 1, 4, "#3a2a1c"); }
    }
  }
  const horseGrazing = (n, time) => !n.moving && Math.sin(time * .33 + (n.homeX || 0)) > .15;
  function chickenBody(c, n, time) {
    const A = n.coat, seed = (n.homeX || 0) + (n.homeY || 0), step = n.moving ? Math.round(Math.sin(time * 14 + seed)) : 0, peck = !n.moving && Math.sin(time * 2.6 + seed) > .5, dx = peck ? 2 : 0, dy = peck ? 6 : 0;
    rect(c, -2 - step, -3, 1, 3, "#d9a03f"); rect(c, 1 + step, -3, 1, 3, "#d9a03f"); rect(c, -3 - step, -1, 3, 1, "#d9a03f"); rect(c, 0 + step, -1, 3, 1, "#d9a03f");
    rect(c, -7, -11, 2, 3, A.shade); rect(c, -8, -13, 2, 3, A.coat); rect(c, -6, -9, 2, 3, A.coat);
    rect(c, -5, -8, 9, 5, A.coat); rect(c, -4, -9, 7, 1, A.light); rect(c, -4, -4, 7, 1, A.shade); rect(c, -3, -7, 4, 3, A.shade); rect(c, -2, -7, 2, 1, A.light);
    rect(c, 2 + dx, -13 + dy, 4, 6, A.coat); rect(c, 3 + dx, -15 + dy, 2, 2, "#c9382f"); rect(c, 5 + dx, -14 + dy, 1, 1, "#c9382f"); rect(c, 6 + dx, -11 + dy, 2, 1, "#e8a93a"); rect(c, 5 + dx, -9 + dy, 1, 2, "#c9382f"); rect(c, 4 + dx, -12 + dy, 1, 1, "#1a1512");
  }
  function catBody(c, n, time) {
    const A = n.coat, seed = n.homeX || 0, eye = A.eyes || "#2c3a26", wave = Math.round(Math.sin(time * 1.6 + seed) * 1.4);
    if (n.moving) {
      const step = Math.round(Math.sin(time * 11 + seed));
      rect(c, -9, -14 + wave, 2, 6, A.coat); rect(c, -8, -9, 2, 2, A.coat);
      rect(c, -7 + step, -3, 2, 3, A.shade); rect(c, 3 - step, -3, 2, 3, A.shade); rect(c, -5 - step, -3, 2, 3, A.coat); rect(c, 1 + step, -3, 2, 3, A.coat);
      rect(c, -7, -8, 12, 5, A.coat); rect(c, -6, -8, 10, 1, A.light); rect(c, -7, -4, 12, 1, A.shade);
      if (A.tabby) for (let k = -5; k < 4; k += 3) rect(c, k, -8, 1, 3, A.tabby);
      rect(c, 3, -12, 7, 6, A.coat); rect(c, 3, -14, 2, 2, A.coat); rect(c, 8, -14, 2, 2, A.coat); rect(c, 7, -10, 1, 1, eye); rect(c, 9, -8, 1, 1, "#d98a8a");
    } else {
      // Sentado, con la cola enroscada en el piso y las orejas atentas.
      rect(c, -8, -2, 8, 2, A.coat); rect(c, -9, -4 - (wave > 0 ? 1 : 0), 2, 3, A.coat);
      rect(c, -4, -9, 8, 9, A.coat); rect(c, -3, -9, 6, 1, A.light); rect(c, 3, -8, 1, 8, A.shade); rect(c, -1, -3, 2, 3, A.light);
      if (A.tabby) { rect(c, -4, -6, 3, 1, A.tabby); rect(c, -4, -3, 3, 1, A.tabby); }
      rect(c, -3, -15, 8, 7, A.coat); rect(c, -3, -17, 2, 2, A.coat); rect(c, 3, -17, 2, 2, A.coat); rect(c, -2, -16, 1, 1, A.shade); rect(c, 4, -16, 1, 1, A.shade);
      const shut = Math.sin(time * .9 + seed) > .4;
      rect(c, -1, shut ? -12 : -13, 1, shut ? 1 : 2, eye); rect(c, 3, shut ? -12 : -13, 1, shut ? 1 : 2, eye); rect(c, 1, -11, 1, 1, "#d98a8a");
      if (A.tabby) { rect(c, 0, -15, 1, 2, A.tabby); rect(c, 2, -15, 1, 2, A.tabby); }
    }
  }
  function dogBody(c, n, time) {
    const A = n.coat, seed = n.homeX || 0, step = n.moving ? Math.round(Math.sin(time * 12 + seed) * 2) : 0, wag = Math.round(Math.sin(time * 10 + seed) * 1.4), pant = !n.moving && Math.sin(time * 1.1 + seed) > -.1;
    rect(c, -12, -14 + wag, 2, 6, A.coat); rect(c, -11, -10, 3, 2, A.coat);
    rect(c, -9 + step, -4, 2, 4, A.shade); rect(c, 4 - step, -4, 2, 4, A.shade); rect(c, -7 - step, -4, 3, 4, A.coat); rect(c, 2 + step, -4, 3, 4, A.coat);
    rect(c, -9, -11, 15, 7, A.coat); rect(c, -8, -12, 13, 1, A.light); rect(c, -9, -5, 15, 1, A.shade);
    if (A.patch) { rect(c, -7, -10, 5, 4, A.patch); rect(c, -6, -11, 3, 1, A.patch); }
    rect(c, 3, -17, 8, 8, A.coat); rect(c, 4, -18, 6, 1, A.light); rect(c, 9, -13, 5, 4, A.muzzle || A.coat); rect(c, 13, -13, 2, 2, "#1f1a18"); rect(c, 3, -18, 3, 6, A.shade);
    if (A.patch) rect(c, 6, -16, 4, 4, A.patch);
    rect(c, 7, -15, 2, 2, A.patch ? "#ece6d6" : "#1f1a18"); if (A.patch) rect(c, 8, -15, 1, 1, "#1f1a18"); else rect(c, 7, -15, 1, 1, "#ffffff");
    if (A.collar) { rect(c, 3, -10, 7, 2, A.collar); rect(c, 6, -8, 2, 1, "#e7be72"); }
    if (pant) rect(c, 11, -9, 2, 2, "#d9708a");
  }
  const ANIMAL_ART = { horse: [horseBody, 40, 7, "#22180f"], chicken: [chickenBody, 12, 3, "#26201a"], cat: [catBody, 15, 4, "#201c1a"], dog: [dogBody, 22, 5, "#241c15"] };
  function drawAnimal(c, n, time) {
    const [body, w, h, outline] = ANIMAL_ART[n.kind];
    c.save(); c.translate(Math.round(n.x), Math.round(n.y)); shadow(c, 0, 0, w, h);
    if (n.tied) { const f = n.faceLeft ? -1 : 1; rect(c, f * 31, -17, 3, 17, "#5a4128"); rect(c, f * 31, -17, 3, 1, "#8a6a44"); }
    sprite(c, outline, false, () => { if (n.faceLeft) c.scale(-1, 1); body(c, n, time); });
    // La rienda queda floja cuando baja la cabeza a pastar y se tensa cuando la levanta.
    if (n.tied) { const f = n.faceLeft ? -1 : 1, low = horseGrazing(n, time); Px.line(c, f * 22, low ? -8 : -31, f * 32, -15, "#2c2118"); }
    c.restore();
  }
  function drawNpc(c, n, time) {
    if (n.kind === "gaucho") return drawGaucho(c, n, time);
    if (ANIMAL_ART[n.kind]) return drawAnimal(c, n, time);
    drawVillager(c, n, time);
  }
  // Parte un diálogo en renglones que entran en el cuadro. Lo usan el cuadro de texto y las pruebas.
  function dialogLines(text, width) {
    const lines = [""];
    // Una acotación corta entre asteriscos no se corta: «*ruido de mate*» va entera, si no, se pierde el remate.
    for (const word of String(text).match(/\*[^*]{1,30}\*|[^ ]+/g) || []) { const test = lines[lines.length - 1] ? lines[lines.length - 1] + " " + word : word; if (Px.textWidth(test, 9) > width && lines[lines.length - 1]) lines.push(word); else lines[lines.length - 1] = test; }
    return lines;
  }
  function drawTelegraph(c, e, time) {
    const x=Math.round(e.x), y=Math.round(e.y), pulse=.35+Math.abs(Math.sin(time*18))*.4;
    c.save();c.globalAlpha=pulse;
    if(e.type==="capo"){
      c.strokeStyle="#e0574b";c.lineWidth=12;c.lineCap="round";c.globalAlpha=pulse*.35;
      c.beginPath();c.moveTo(x,y-6);c.lineTo(x+e.aimX*180,y-6+e.aimY*180);c.stroke();
      c.globalAlpha=pulse;c.lineWidth=2;c.setLineDash([6,5]);c.strokeStyle="#ffb09a";
      c.beginPath();c.moveTo(x,y-6);c.lineTo(x+e.aimX*180,y-6+e.aimY*180);c.stroke();
    }else if(e.kind==="tail"){
      // El anillo del colazo coincide con la zona que golpea (elipse en perspectiva).
      const r=62,grow=1-Math.max(0,e.telegraph)/.75;
      c.fillStyle="#b04a6a";c.globalAlpha=pulse*.28;c.beginPath();c.ellipse(x,y-3,r,r*.65,0,0,Math.PI*2);c.fill();
      c.globalAlpha=pulse;c.strokeStyle="#e98fb0";c.lineWidth=2;c.setLineDash([6,5]);c.beginPath();c.ellipse(x,y-3,r,r*.65,0,0,Math.PI*2);c.stroke();
      c.setLineDash([]);c.globalAlpha=.6;c.beginPath();c.ellipse(x,y-3,r*grow,r*grow*.65,0,0,Math.PI*2);c.stroke();
    }else{
      const base=Math.atan2(e.aimY,e.aimX);c.strokeStyle="#c79be3";c.lineWidth=2;c.setLineDash([4,6]);
      for(const o of [-.32,0,.32]){c.beginPath();c.moveTo(x,y-8);c.lineTo(x+Math.cos(base+o)*150,y-8+Math.sin(base+o)*150);c.stroke();}
    }
    c.restore();
    pixelText(c,"!!",x,y-(e.type==="capo"?58:46)-Math.abs(Math.sin(time*12))*3,"#ff8f7a",12);
  }
  /* ---------- Jefes: dibujados a su tamaño real, con poses que siguen el estado de cada ataque. ---------- */
  const toneCache = new Map();
  function tone(hex, k) {
    const key = hex + k; let value = toneCache.get(key);
    if (!value) { value = "#" + Px.rgb(hex).map(v => Math.max(0, Math.min(255, Math.round(k <= 1 ? v * k : v + (255 - v) * (k - 1)))).toString(16).padStart(2, "0")).join(""); toneCache.set(key, value); }
    return value;
  }
  // Bloque con luz arriba a la izquierda y sombra abajo a la derecha.
  function box(c, x, y, w, h, col) {
    rect(c, x, y, w, h, col); rect(c, x, y, w, 1, tone(col, 1.2)); rect(c, x, y, 1, h, tone(col, 1.12)); rect(c, x, y + h - 1, w, 1, tone(col, .7)); rect(c, x + w - 1, y, 1, h, tone(col, .78));
  }
  // Brazo o pata: un segmento girado que devuelve dónde termina.
  function limb(c, x, y, a, len, w, col) {
    rrect(c, x, y, a, 0, -w / 2, len, w, col);
    if (w >= 3) { rrect(c, x, y, a, 1, -w / 2, Math.max(1, len - 2), 1, tone(col, 1.22)); rrect(c, x, y, a, 1, w / 2 - 1, Math.max(1, len - 2), 1, tone(col, .7)); }
    return [x + Math.cos(a) * len, y + Math.sin(a) * len];
  }
  const armTo = (c, sx, sy, fx, fy, w, col) => limb(c, sx, sy, Math.atan2(fy - sy, fx - sx), Math.max(1, Math.hypot(fx - sx, fy - sy)), w, col);
  function blob(c, x, y, rx, ry, col) {
    for (let row = 0; row < ry * 2; row++) { const f = (row + .5) / ry - 1, half = Math.max(.5, Math.round(rx * Math.sqrt(Math.max(0, 1 - f * f)))); rect(c, x - half, y - ry + row, half * 2, 1, col); }
  }
  // Medialuna de un tajo: fina en la cola y gruesa en la punta.
  function crescent(c, cx, cy, r, from, to, thick, color, core) {
    const outer = [], inner = [], bright = [], steps = 10;
    for (let k = 0; k <= steps; k++) {
      const t = k / steps, a = from + (to - from) * t;
      outer.push([cx + Math.cos(a) * r, cy + Math.sin(a) * r]); inner.push([cx + Math.cos(a) * (r - t * thick), cy + Math.sin(a) * (r - t * thick)]); bright.push([cx + Math.cos(a) * (r - t * thick * .3), cy + Math.sin(a) * (r - t * thick * .3)]);
    }
    poly(c, outer.concat(inner.reverse()), color);
    if (core) poly(c, outer.concat(bright.reverse()), core);
  }
  // Silueta de un solo color, para estelas.
  function ghost(c, x, y, color, alpha, body) {
    c.save(); c.translate(Math.round(x), Math.round(y)); c.globalAlpha *= alpha; Px.mode = "flash"; Px.flashColor = color; body(); c.restore(); Px.mode = null; Px.flashColor = "#ffffff";
  }
  const localAim = e => Math.atan2(e.aimY || 0, (e.aimX === undefined ? 1 : e.aimX) * (e.dir === "left" ? -1 : 1));
  // Luna roja: los ojos del enemigo que se está dibujando se vuelven rojos y brillan.
  let moonEyes = false;
  function eye(c, x, y, w, h, color) {
    if (!moonEyes) return rect(c, x, y, w, h, color);
    rect(c, x, y, w, h, "#ff2a2a");
    if (!Px.mode) { Px.glow(c, x + w / 2, y + h / 2, w + 2, "#ff1e1e", .6); rect(c, x, y, w, h, "#ff4a3c"); if (w > 1) rect(c, x, y, 1, 1, "#ffd8cc"); }
  }

  // El Capo del Eco: traje a rayas, sombrero, anteojos negros, bigote y faca.
  function capoBody(c, e, time, walk) {
    const r = e.rain, wind = e.telegraph > 0, dash = e.dash > 0, throwing = r && r.t >= r.wind, aim = localAim(e);
    const spread = dash ? 4 : 0, leg = (x, lift, back) => {
      rect(c, x, -12, 6, 10 - lift, back ? "#25222b" : "#2e2a33"); rect(c, x + 2, -12, 1, 10 - lift, "#47434f");
      rect(c, x - 1, -2 - lift, 8, 2, "#141318"); rect(c, x, -2 - lift, 3, 1, "#3d3b46");
    };
    leg(-7 - spread, walk > 0 ? 2 : 0, true); leg(1 + spread, walk < 0 ? 2 : 0, false);
    c.translate(dash ? 3 : wind ? -2 : 0, wind ? 2 : r && !throwing ? 1 : 0);
    let ra = 1.4 + walk * .22, la = 1.75 - walk * .22, activeRight = true, snap = false;
    if (wind) { ra = -2.5; la = .5; }
    if (dash) { ra = .05; la = 2.7; }
    if (r && !throwing) { const k = Math.min(1, r.t / r.wind); ra = 1.4 - 3 * k; la = 1.75 - 3.2 * k; }
    if (throwing) {
      activeRight = r.thrown % 2 === 1; snap = ((r.t - r.wind) * 3) % 1 < .38;
      ra = activeRight && snap ? aim : -1.55; la = !activeRight && snap ? aim : -1.3;
    }
    const held = (hand, a, empty) => {
      rect(c, hand[0] - 2, hand[1] - 2, 4, 4, "#b88b63");
      if (r && !empty) for (const o of [-.55, 0, .55]) { rrect(c, hand[0], hand[1], a + o, 2, -1, 9, 2, "#b9c6c2"); rrect(c, hand[0], hand[1], a + o, 3, -1, 7, 1, "#f4f6f0"); }
    };
    const left = limb(c, -10, -28, la, 13, 5, "#42232b"); held(left, la, !activeRight && snap);
    poly(c, [[-9, -21], [9, -21], [11, -9], [3, -9], [0, -16], [-3, -9], [-11, -9]], "#4b2830");
    box(c, -9, -31, 18, 11, "#5a2f38");
    for (const x of [-7, -4, 3, 6]) rect(c, x, -31, 1, 21, "#ffffff16");
    poly(c, [[-3, -31], [3, -31], [0, -22]], "#e0d8bf"); rect(c, -1, -29, 2, 6, "#b23a3f"); rect(c, -1, -30, 2, 1, "#d9565a");
    poly(c, [[-5, -31], [-1, -24], [-6, -22]], "#6d3b45"); poly(c, [[5, -31], [1, -24], [6, -22]], "#6d3b45");
    rect(c, -9, -21, 18, 2, "#1c1b22"); rect(c, -2, -21, 4, 2, "#e7c35c"); rect(c, 3, -26, 4, 1, "#e7c35c"); rect(c, 6, -25, 1, 2, "#e7c35c");
    box(c, -13, -32, 6, 5, "#6d3b45"); box(c, 7, -32, 6, 5, "#6d3b45");
    rect(c, -3, -32, 6, 2, "#a07c5a");
    rect(c, -6, -41, 12, 9, "#b88b63"); rect(c, -5, -33, 10, 2, "#a07a55"); rect(c, 5, -41, 1, 8, "#9c7450");
    rect(c, -5, -38, 4, 3, "#14161a"); rect(c, 1, -38, 4, 3, "#14161a"); rect(c, -1, -37, 2, 1, "#14161a"); rect(c, -4, -38, 1, 1, "#8aa3a8"); rect(c, 2, -38, 1, 1, "#8aa3a8");
    if (moonEyes) { eye(c, -4, -37, 2, 1); eye(c, 2, -37, 2, 1); }
    rect(c, -4, -34, 8, 1, "#3b2d27"); rect(c, 3, -38, 1, 5, "#8a5d44");
    rect(c, 4, -33, 4, 1, "#efe9d6"); rect(c, 8, -33, 1, 1, wind || r ? "#ff7a3a" : "#c9502a");
    if (Px.mode !== "outline") { const puff = (time * .9) % 1; rect(c, 8 + Math.round(Math.sin(time * 3)), -35 - puff * 8, 1, 2, "#e6dec533"); }
    rect(c, -11, -42, 22, 2, "#1e1c24"); rect(c, -11, -42, 22, 1, "#34313d"); rect(c, -7, -48, 14, 6, "#26242d"); rect(c, -7, -44, 14, 2, "#b23a3f"); rect(c, -7, -48, 1, 4, "#3e3b47"); rect(c, -5, -49, 10, 1, "#26242d"); rect(c, -1, -49, 2, 2, "#17161c");
    const right = limb(c, 10, -28, ra, 13, 5, "#4b2830"); held(right, ra, activeRight && snap);
    if (!r) {
      const b = dash ? .05 : wind ? -2.1 : ra - 1;
      rrect(c, right[0], right[1], b, 0, -2, 19, 3, "#6d7a76"); rrect(c, right[0], right[1], b, 1, -1, 17, 1, "#f1efe3"); rrect(c, right[0], right[1], b, -1, -3, 2, 6, "#a07a3a");
      if (wind && Math.floor(time * 10) % 2 === 0 && Px.mode !== "outline") { const tx = right[0] + Math.cos(b) * 18, ty = right[1] + Math.sin(b) * 18; rect(c, tx - 2, ty, 5, 1, "#ffffff"); rect(c, tx, ty - 2, 1, 5, "#ffffff"); }
    }
  }
  // La Yarará Madre: cuerpo por segmentos con su dibujo de rombos; se yergue para escupir y azota la cola.
  function yararaBody(c, e, time, walk) {
    const spit = e.telegraph > 0 && e.kind !== "tail", lash = e.telegraph > 0 && e.kind === "tail", N = 20, speed = e.moving ? 10 : 2.4;
    const back = spit ? Math.min(1, Math.max(0, (.7 - e.telegraph) / .3)) : 0, turn = lash ? (1 - Math.max(0, e.telegraph) / .75) : 0;
    const points = [];
    for (let i = 0; i < N; i++) {
      const t = i / (N - 1), neck = Math.max(0, (t - .6) / .4), wave = Math.sin(time * speed - t * 7) * (1 - neck) * (e.moving ? 3 : 1.5);
      let x = -30 + t * 40 - back * 7 * neck, y = -5 + wave - neck * neck * (22 + back * 5);
      if (lash && t < .55) { const k = (.55 - t) / .55, a = Math.PI + turn * Math.PI * 2 * k; x = -6 + Math.cos(a) * 22 * k; y = -6 + Math.sin(a) * 11 * k; }
      points.push([Math.round(x), Math.round(y), t < .24 ? 1 + t * 13 : t > .86 ? 3 : 4 + Math.sin((t - .24) / .62 * Math.PI) * 1.6]);
    }
    points.forEach(([x, y, r], i) => {
      const radius = Math.max(lash ? 2 : 1, Math.round(r));
      if (i) { const prev = points[i - 1], gaps = Math.floor(Math.hypot(x - prev[0], y - prev[1]) / 2); for (let g = 1; g < gaps; g++) blob(c, Math.round(prev[0] + (x - prev[0]) * g / gaps), Math.round(prev[1] + (y - prev[1]) * g / gaps), radius, radius, "#6a4e8f"); }
      blob(c, x, y, radius, radius, i % 6 < 3 ? "#7a5ca0" : "#6a4e8f");
      rect(c, x - radius + 1, y + radius - 1, Math.max(1, radius * 2 - 2), 1, "#c7b1de");
      rect(c, x - radius + 1, y - radius, Math.max(1, radius * 2 - 2), 1, "#9d80c6");
      if (i % 3 === 0 && radius > 2) { rect(c, x - 1, y - 2, 3, 3, "#33244d"); rect(c, x, y - 1, 1, 1, "#e1c46a"); }
    });
    const [hx, hy] = points[N - 1], open = spit && e.telegraph < .5 ? 3 : spit ? 1 : 0;
    poly(c, [[hx - 6, hy - 4], [hx + 3, hy - 6], [hx + 12, hy - 2], [hx + 11, hy + 1], [hx + 3, hy + 2], [hx - 6, hy + 3]], "#8a6bb0");
    poly(c, [[hx - 4, hy - 4], [hx + 3, hy - 6], [hx + 10, hy - 3], [hx + 2, hy - 2]], "#b294d4");
    if (moonEyes) eye(c, hx + 3, hy - 4, 3, 2);
    else { rect(c, hx + 3, hy - 4, 3, 2, spit ? "#ff8f7a" : "#f1d36b"); rect(c, hx + 4, hy - 4, 1, 2, "#1d1626"); }
    poly(c, [[hx - 4, hy + 2 + open], [hx + 3, hy + 3 + open], [hx + 10, hy + 2 + open], [hx + 3, hy + 5 + open], [hx - 4, hy + 5 + open]], "#7a5ca0");
    if (open) {
      rect(c, hx - 2, hy + 2, 12, open, "#3d1830"); rect(c, hx + 7, hy + 2, 1, 2, "#ffffff"); rect(c, hx + 3, hy + 2, 1, 2, "#ffffff");
      if (Px.mode !== "outline") { Px.glow(c, hx + 8, hy + 3, 6 + open, "#b5f08d", .8); rect(c, hx + 5, hy + 2, 3, open, "#b5f08d"); rect(c, hx + 6, hy + 3 + open + Math.floor(time * 12) % 4, 1, 2, "#94d36a"); }
    } else if (Math.sin(time * 6 + 2) > .4 && Px.mode !== "outline") { rect(c, hx + 12, hy, 4, 1, "#d65f6b"); rect(c, hx + 16, hy - 1, 1, 1, "#d65f6b"); rect(c, hx + 16, hy + 1, 1, 1, "#d65f6b"); }
  }
  function bossBody(c, e, time, walk) { (e.type === "capo" ? capoBody : yararaBody)(c, e, time, walk); }
  function drawBoss(c, e, time) {
    const x = Math.round(e.x), y = Math.round(e.y), speed = e.dash > 0 ? 24 : 10, wave = Math.sin(time * speed + x);
    const walk = e.moving ? Math.round(wave * 1.5) : 0, bob = e.moving && Math.abs(wave) > .7 ? -1 : 0;
    if (e.telegraph > 0) drawTelegraph(c, e, time);
    const body = () => { if (e.dir === "left") c.scale(-1, 1); bossBody(c, e, time, walk); };
    if (e.dash > 0) for (let k = 3; k > 0; k--) ghost(c, x - e.aimX * k * 11, y - e.aimY * k * 11, "#9c5a68", .42 - k * .1, body);
    c.save(); c.translate(x, y);
    shadow(c, 0, 0, e.type === "capo" ? 30 : 40, 6);
    c.translate(e.hitFlash > .08 ? (Math.floor(time * 40) % 2 ? 1 : -1) : 0, bob);
    sprite(c, e.type === "capo" ? "#141218" : "#1f1729", e.hitFlash > .05, body);
    c.restore();
    if (e.rain) {
      const r = e.rain;
      if (r.t < r.wind) pixelText(c, "!!", x, y - 58 - Math.abs(Math.sin(time * 12)) * 3, "#ff8f7a", 12);
      // Cuántos cuchillos faltan para el nocaut, sobre la cabeza del jugador.
      const p = currentGame && currentGame.player;
      if (p) for (let k = 0; k < 5; k++) { const px = Math.round(p.x) - 12 + k * 5; rect(c, px - 1, p.y - 39, 4, 5, "#1b1215"); rect(c, px, p.y - 38, 2, 3, k < r.hits ? "#ff5a48" : "#6b5a58"); }
    } else if (e.stun > 0) pixelText(c, "♪", x + Math.sin(time * 4) * 7, y - 56, "#e2c578", 11);
    else if (e.alert && !e.telegraph) pixelText(c, "☠", x, y - 56, "#edb977", 10);
  }
  // Juego que se está dibujando: algunos objetos (altar, portal) dependen del progreso.
  let currentGame = null;
  const VIOLET = "#a77bff";
  function bones(c, e, time, walk) {
    const bone="#e6e0cc", shade="#b9b29b", dark="#4d4a40";
    rect(c,-4,-8,2,8+walk,shade);rect(c,2,-8,2,8-walk,shade);rect(c,-5,-1+walk,3,2,dark);rect(c,2,-1-walk,3,2,dark);
    rect(c,-4,-10,8,2,shade);rect(c,-1,-18,2,8,bone);
    for(let k=0;k<3;k++)rect(c,-5,-18+k*2.5,10,1,bone);
    rect(c,-8,-17,2,8,shade);rect(c,6,-17,2,8,shade);
    rect(c,-5,-27,10,8,P.ink);rect(c,-4,-26,8,7,"#efe9d6");eye(c,-3,-23,2,2,"#1d1a17");eye(c,1,-23,2,2,"#1d1a17");
    rect(c,-2,-20,4,1,dark);if(e.alert&&!moonEyes){rect(c,-3,-23,1,1,"#c6a2ff");rect(c,1,-23,1,1,"#c6a2ff");}
    if(e.type==="skeleton"){
      rect(c,-12,-19,6,11,"#3a3226");rect(c,-11,-18,4,9,"#6b5a3e");rect(c,-10,-15,2,2,"#b7b9be");
      rect(c,7,-23,2,13,"#c9d1d6");rect(c,8,-24,1,11,"#eef2f3");rect(c,5,-11,6,2,"#7a6a4a");
    } else {
      rect(c,8,-22,2,2,"#9b7a4a");rect(c,10,-20,2,10,"#9b7a4a");rect(c,8,-10,2,2,"#9b7a4a");rect(c,8,-20,1,9,"#d7c791");
    }
  }
  // El Chupasangre: capa que se abre como alas, garras y colmillos.
  function drawVampire(c, e, time, walk) {
    const a = e.act || {}, id = a.id, t = a.t || 0, aim = localAim(e), flutter = Math.round(Math.sin(time * 5 + e.x * .1) * 1.5);
    const lungeWind = id === "lunge" && t < .9, lungeRun = id === "lunge" && t >= .9, drain = id === "drain", swipeWind = id === "swipe" && t < .42, summon = id === "summon", retreat = id === "retreat";
    const spread = lungeWind ? Math.min(1, t / .4) : summon ? Math.min(1, t / .3) : drain ? .55 : 0;
    if (lungeRun) { poly(c, [[-3, -35], [-26, -33], [-33, -14 + flutter], [-23, -6 - flutter], [-3, -6]], "#17111c"); poly(c, [[-4, -33], [-23, -31], [-29, -14 + flutter], [-21, -8 - flutter], [-4, -8]], "#6e1b28"); }
    else for (const s of [-1, 1]) {
      const w = retreat ? 8 : 10;
      poly(c, [[s * 4, -35], [s * (w + spread * 27), -37 - spread * 7], [s * (w + 3 + spread * 28), -15], [s * (w + 2 + spread * 18), -1 + flutter], [s * (5 + spread * 9), -5 - flutter], [s * 4, -2]], "#17111c");
      poly(c, [[s * 4, -33], [s * (w - 1 + spread * 25), -34 - spread * 6], [s * (w + 1 + spread * 25), -15], [s * (w + spread * 16), -3 + flutter], [s * (5 + spread * 8), -7 - flutter], [s * 4, -4]], "#6e1b28");
      if (spread > .4) { Px.line(c, s * 6, -34, s * (10 + spread * 24), -16, "#3d0f1a"); Px.line(c, s * 6, -34, s * (8 + spread * 15), -4, "#3d0f1a"); }
    }
    rect(c, -6, -12, 5, 11, "#1d1b22"); rect(c, 1, -12, 5, 11, "#1d1b22"); rect(c, -5, -12, 1, 10, "#33303a"); rect(c, 2, -12, 1, 10, "#33303a");
    const footL = walk > 0 ? 1 : 0, footR = walk < 0 ? 1 : 0;
    rect(c, -7, -2 - footL, 7, 2, "#0f0d12"); rect(c, 1, -2 - footR, 7, 2, "#0f0d12"); rect(c, -6, -2 - footL, 3, 1, "#3a3744"); rect(c, 2, -2 - footR, 3, 1, "#3a3744");
    c.translate(lungeRun ? 4 : drain ? 3 : lungeWind ? -2 : retreat ? -2 : 0, lungeWind ? 3 : drain ? 2 : 0);
    let la = 1.8 - walk * .2, ra = 1.35 + walk * .2;
    if (swipeWind) { const k = Math.min(1, t / .42); la = 1.8 - 3.6 * k; ra = 1.35 - 3.6 * k; }
    if (id === "swipe" && !swipeWind) { const second = t >= .7; ra = second ? -1.5 : aim; la = second ? aim : -1.7; if (t > .95) { ra = 1.2; la = 1.9; } }
    if (lungeWind) { la = 2.5; ra = .7; }
    if (lungeRun) { la = aim - .25; ra = aim + .25; }
    if (drain) { la = .1; ra = -.1; }
    if (summon) { la = -2.1; ra = -1; }
    const claws = (hand, angle) => { rect(c, hand[0] - 2, hand[1] - 2, 4, 4, "#d9d4dc"); for (const o of [-.55, 0, .55]) rrect(c, hand[0], hand[1], angle + o, 1, -.5, 6, 1, "#f4f0f6"); };
    const left = limb(c, -8, -28, la, 12, 4, "#231c29"); claws(left, la);
    box(c, -7, -31, 14, 19, "#2a2230"); rect(c, -3, -31, 6, 15, "#8c2232"); rect(c, -3, -31, 1, 15, "#b33245"); rect(c, -1, -31, 2, 4, "#e9e3ea"); rect(c, -1, -24, 2, 2, "#d8b860"); rect(c, -7, -14, 14, 2, "#17121c");
    const hunch = drain ? 2 : 0;
    poly(c, [[-7, -32], [-12, -46], [-4, -35]], "#5a1622"); poly(c, [[7, -32], [12, -46], [4, -35]], "#5a1622"); poly(c, [[-7, -33], [-10, -42], [-5, -35]], "#8c2232"); poly(c, [[7, -33], [10, -42], [5, -35]], "#8c2232");
    const hx = hunch, skin = "#e0dbe4";
    rect(c, hx - 5, -42 + hunch, 10, 10, skin); rect(c, hx - 4, -33 + hunch, 8, 2, "#c2bcc8"); rect(c, hx + 4, -41 + hunch, 1, 8, "#bcb5c2");
    rect(c, hx - 7, -40 + hunch, 2, 3, skin); rect(c, hx + 5, -40 + hunch, 2, 3, skin); rect(c, hx - 8, -41 + hunch, 1, 2, skin); rect(c, hx + 7, -41 + hunch, 1, 2, skin);
    rect(c, hx - 6, -44 + hunch, 12, 3, "#15121a"); rect(c, hx - 6, -42 + hunch, 2, 3, "#15121a"); rect(c, hx + 4, -42 + hunch, 2, 3, "#15121a"); rect(c, hx - 1, -42 + hunch, 2, 2, "#15121a"); rect(c, hx - 3, -44 + hunch, 4, 1, "#33303f");
    const hungry = lungeWind || lungeRun || drain || swipeWind;
    rect(c, hx - 4, -38 + hunch, 3, 2, "#2a0a12"); rect(c, hx + 1, -38 + hunch, 3, 2, "#2a0a12"); eye(c, hx - 3, -38 + hunch, 2, 1, hungry ? "#ff6a4a" : "#ff3b3b"); eye(c, hx + 2, -38 + hunch, 2, 1, hungry ? "#ff6a4a" : "#ff3b3b");
    if (hungry) { rect(c, hx - 3, -35 + hunch, 6, 3, "#3d0a14"); rect(c, hx - 3, -35 + hunch, 1, 2, "#ffffff"); rect(c, hx + 2, -35 + hunch, 1, 2, "#ffffff"); }
    else { rect(c, hx - 2, -34 + hunch, 4, 1, "#7a5a6a"); rect(c, hx - 2, -34 + hunch, 1, 2, "#ffffff"); rect(c, hx + 1, -34 + hunch, 1, 2, "#ffffff"); }
    const right = limb(c, 8, -28, ra, 12, 4, "#2a2230"); claws(right, ra);
  }
  // El Gólem Minero: roca en bloques con vetas, casco de minero y puños enormes.
  function drawGolem(c, e, time, walk) {
    const life = (Z.GOLEM_LIVES || [])[e.life || 0] || { color: "#8a8f96" }, col = life.color, dark = tone(col, .5), mid = tone(col, .78), hi = tone(col, 1.28);
    const a = e.act || {}, t = a.t || 0, glow = e.act ? "#ff5a3c" : "#ffb347";
    if (a.id === "rise") {
      // Se rearma: la pila de escombros sube y los pedazos vuelan hacia el centro.
      const k = Math.min(1, t / 2.2), next = (Z.GOLEM_LIVES || [])[Math.min(3, (e.life || 0) + 1)] || life, pile = 8 + Math.round(k * 40);
      for (let i = 0; i < 18; i++) { const an = i * .9 + time * 2, r = 36 * (1 - k) + 6, s = 4 + i % 4; box(c, Math.cos(an) * r - s / 2, -pile * .6 + Math.sin(an) * r * .55 - s, s, s, i % 2 ? next.color : col); }
      const rock = tone(k > .5 ? next.color : col, .8), seam = tone(rock, .55); box(c, -22, -pile, 44, pile, rock); box(c, -14, -pile - 8, 28, 10, k > .5 ? next.color : col);
      for (let i = 0; i < Math.floor(pile / 9); i++) { rect(c, -20, -pile + 7 + i * 9, 40, 1, seam); rect(c, -14 + (i % 2) * 16, -pile + i * 9, 1, 7, seam); rect(c, -8 + (i % 3) * 12, -pile + 3 + i * 9, 3, 2, "#ffd97a"); }
      eye(c, -8, -pile - 4, 5, 3, "#ffb347"); eye(c, 3, -pile - 4, 5, 3, "#ffb347");
      return;
    }
    const quake = a.id === "quake", ph = quake ? t % 1.15 : 0, slam = quake && ph >= .9, lift = quake && !slam ? Math.min(1, ph / .55) : 0, thrown = a.id === "throw", tk = thrown ? Math.min(1, t / .7) : 0;
    const shake = quake && ph > .55 && !slam ? (Math.floor(time * 30) % 2 ? 1 : -1) : 0, sink = slam ? 5 : Math.round(lift * -3);
    const foot = (x, w, step) => { box(c, x, -18 - step, w, 14, mid); box(c, x - 2, -6 - step, w + 4, 6, dark); rect(c, x + 2, -14 - step, w - 4, 1, dark); };
    foot(-17, 13, walk > 0 ? 2 : 0); foot(4, 13, walk < 0 ? 2 : 0);
    c.translate(shake, sink);
    let lx = -28, ly = -24 - walk, rx = 28, ry = -24 + walk;
    if (lift) { lx = -28 + 14 * lift; ly = -24 - 54 * lift; rx = 28 - 14 * lift; ry = -24 - 54 * lift; }
    if (slam) { lx = -30; ly = -9 - sink; rx = 30; ry = -9 - sink; }
    if (thrown) { lx = -28 + 18 * tk; ly = -14 - 70 * tk; rx = 28 - 18 * tk; ry = -14 - 70 * tk; }
    armTo(c, -22, -50, lx, ly, 11, dark); armTo(c, 22, -50, rx, ry, 11, dark);
    box(c, -24, -60, 48, 42, mid); box(c, -21, -58, 42, 18, col); rect(c, -21, -58, 42, 2, hi); rect(c, -3, -58, 1, 40, dark); rect(c, -21, -40, 42, 1, dark);
    rect(c, -18, -36, 12, 1, dark); rect(c, 7, -48, 1, 8, dark); rect(c, 8, -44, 8, 1, dark); rect(c, -14, -52, 1, 7, dark); rect(c, -14, -46, 6, 1, dark);
    // Vetas de mineral incrustadas.
    for (const [gx, gy, s] of [[-16, -32, 4], [12, -30, 3], [6, -54, 3], [-8, -26, 2], [17, -52, 2]]) { rect(c, gx, gy, s, s, "#ffd97a"); rect(c, gx, gy, 1, 1, "#fff6cf"); rect(c, gx + s - 1, gy + s - 1, 1, 1, "#a8742a"); }
    box(c, -24, -22, 48, 5, dark);
    box(c, -31, -64, 16, 15, col); box(c, 15, -64, 16, 15, col); rect(c, -29, -62, 6, 2, hi); rect(c, 17, -62, 6, 2, hi);
    const head = lift > .5 ? -1 : 0;
    box(c, -11, -72 + head, 22, 14, mid); box(c, -9, -71 + head, 18, 11, col);
    rect(c, -7, -66 + head, 5, 3, "#1a1412"); rect(c, 2, -66 + head, 5, 3, "#1a1412"); eye(c, -6, -66 + head, 3, 2, glow); eye(c, 3, -66 + head, 3, 2, glow); rect(c, -4, -61 + head, 8, 1, dark);
    // Casco con linterna.
    box(c, -13, -77 + head, 26, 7, "#c9a23c"); rect(c, -15, -71 + head, 30, 2, "#8a6c22"); rect(c, -13, -77 + head, 26, 1, "#ecd27a"); box(c, -3, -80 + head, 6, 5, "#5a5040"); rect(c, -2, -79 + head, 4, 3, "#fff2b0");
    if (Px.mode !== "outline") Px.glow(c, 0, -77 + head, 9, "#ffe9a0", .55);
    const fist = (x, y) => { box(c, x - 9, y - 8, 18, 15, col); rect(c, x - 7, y - 6, 8, 2, hi); for (const k of [-5, 0, 5]) rect(c, x + k - 1, y + 3, 1, 4, dark); };
    fist(lx, ly); fist(rx, ry);
    if (thrown) { const by = ly - 14; box(c, -15, by - 12, 30, 24, "#6a6e74"); rect(c, -11, by - 10, 14, 5, "#a4a8ae"); rect(c, 2, by, 8, 1, "#3f4247"); rect(c, -8, by + 4, 7, 1, "#3f4247"); }
  }
  // Cabeza de perro de perfil: cráneo con stop, hocico largo, orejas paradas y lengua afuera.
  function dogHead(c, x, y, open, alert, pant, seed, time) {
    const fur = "#3d3139", mid = "#57484f", light = "#7c6b73", dark = "#231b20";
    const o = Math.round(open);
    poly(c, [[x - 1, y - 6], [x + 3, y - 18], [x + 7, y - 6]], dark);
    poly(c, [[x + 1, y + 3], [x + 16, y + 4 + o], [x + 18, y + 6 + o], [x + 5, y + 8 + Math.round(o * .5)], [x - 3, y + 7]], fur);
    rect(c, x + 5, y + 7 + Math.round(o * .5), 10, 1, "#6b5a62");
    if (o > 0) {
      poly(c, [[x + 3, y + 3], [x + 19, y + 3], [x + 16, y + 4 + o], [x + 4, y + 6 + Math.round(o * .4)]], "#5a1218");
      for (const k of [9, 13, 16]) rect(c, x + k, y + 3, 1, Math.min(3, o), "#f4ead6");
      rect(c, x + 12, y + 3 + o - 1, 1, 2, "#f4ead6"); rect(c, x + 8, y + 3 + o, 1, 2, "#f4ead6");
    }
    if (pant) {
      // Lengua afuera, jadeando: lo más perro que tiene un perro.
      const drip = Math.floor(time * 7 + seed) % 2;
      rect(c, x + 7, y + 4 + o, 7, 2, "#d9606a"); rect(c, x + 11, y + 5 + o, 3, 3 + drip, "#d9606a"); rect(c, x + 12, y + 6 + o, 1, 2 + drip, "#a83f4c");
    }
    poly(c, [[x - 8, y - 4], [x - 2, y - 9], [x + 5, y - 8], [x + 8, y - 4], [x + 19, y - 2], [x + 22, y], [x + 21, y + 3], [x + 8, y + 4], [x - 1, y + 6], [x - 8, y + 3]], mid);
    poly(c, [[x - 6, y - 5], [x - 1, y - 8], [x + 5, y - 7], [x + 8, y - 3], [x + 19, y - 1], [x + 19, y], [x + 7, y - 1], [x - 3, y - 3]], light);
    poly(c, [[x + 8, y + 1], [x + 20, y + 1], [x + 20, y + 3], [x + 8, y + 4]], fur);
    rect(c, x + 19, y - 2, 4, 3, "#0f0b0d"); rect(c, x + 20, y - 2, 1, 1, "#6d6268");
    rect(c, x + 3, y - 5, 5, 1, dark); rect(c, x + 4, y - 4, 3, 2, "#1a1012"); eye(c, x + 5, y - 4, 2, 2, alert ? "#ff5a3c" : "#f0b040"); if (!moonEyes) rect(c, x + 5, y - 4, 1, 1, "#ffe0a0");
    poly(c, [[x - 7, y - 5], [x - 6, y - 19], [x + 1, y - 7]], fur); poly(c, [[x - 5, y - 7], [x - 5, y - 15], [x - 1, y - 7]], "#7a4a52");
    poly(c, [[x - 8, y + 1], [x - 13, y + 7], [x - 7, y + 5], [x - 8, y + 9], [x - 3, y + 6]], fur);
  }
  // Cerbero: un perrazo de tres cabezas con collares de púas, pecho profundo, cintura fina y patas de perro.
  function drawCerbero(c, e, time, walk) {
    const a = e.act || {}, t = a.t || 0, id = a.id, biteWind = id === "bite" && t < .47, biting = id === "bite" && t >= .47, dig = id === "dig", jump = id === "jump";
    const air = jump ? Math.min(1, t / 1.5) : 0, crouch = jump && air < .1 ? 5 : 0, flying = jump && air >= .1 && air < .95, gait = time * (e.alert ? 13 : 9) + e.x * .1, run = e.moving && !id;
    const pitch = dig ? 7 : 0, wag = Math.sin(time * (e.alert ? 14 : 6)), far = "#2b2228", near = "#3d3139", hi = "#57484f", paw = "#181215";
    const foot = (x, y, lit) => { rect(c, x - 3, y - 3, 8, 3, paw); rect(c, x - 3, y - 3, 8, 1, lit); for (const k of [0, 2, 4]) rect(c, x - 2 + k, y - 1, 1, 1, "#a89a8a"); };
    const frontLeg = (sx, sy, phase, color, lit) => {
      if (flying) { const k = armTo(c, sx, sy, sx + 10, sy + 7, 6, color); armTo(c, k[0], k[1], k[0] + 7, k[1] + 7, 4, color); foot(k[0] + 7, k[1] + 9, lit); return; }
      const fx = sx + 1 + (run ? Math.sin(phase) * 9 : 0), lift = run ? Math.max(0, Math.cos(phase)) * 4 : 0, fy = -lift;
      armTo(c, sx, sy, fx + 1, sy + (fy - 3 - sy) * .55, 7, color); armTo(c, fx + 1, sy + (fy - 3 - sy) * .55, fx, fy - 2, 4, color); foot(fx, fy, lit);
    };
    const rearLeg = (hx, hy, phase, color, lit) => {
      if (flying) { const k = armTo(c, hx, hy, hx - 11, hy + 5, 8, color); armTo(c, k[0], k[1], k[0] - 9, k[1] + 5, 4, color); foot(k[0] - 10, k[1] + 7, lit); return; }
      const fx = hx + 2 + (run ? Math.sin(phase) * 10 : 0), lift = run ? Math.max(0, Math.cos(phase)) * 4 : 0, fy = -lift, hock = [fx - 7, fy - 10 + crouch / 2], knee = [hx + 5, hy + (hock[1] - hy) * .45];
      armTo(c, hx, hy, knee[0], knee[1], 10, color); armTo(c, knee[0], knee[1], hock[0], hock[1], 5, color); armTo(c, hock[0], hock[1], fx, fy - 2, 3, color); foot(fx, fy, lit);
    };
    // Cola peluda que se menea.
    let tx = -30, ty = -26 + crouch, ta = Math.PI + (e.alert ? .85 : .45) + wag * .3;
    for (const [len, w] of [[8, 5], [7, 5], [6, 3]]) { const end = limb(c, tx, ty, ta, len, w, near); tx = end[0]; ty = end[1]; ta -= (e.alert ? -.25 : .3); }
    poly(c, [[tx, ty - 3], [tx + Math.cos(ta) * 6, ty + Math.sin(ta) * 6], [tx, ty + 3]], hi);
    rearLeg(-22, -20 + crouch, gait + Math.PI, far, "#3d3139"); frontLeg(12, -22 + crouch + pitch, gait, far, "#3d3139");
    // Cuerpo: anca redonda, lomo, cintura recogida y pecho hondo.
    const y0 = crouch;
    poly(c, [[-33, -23 + y0], [-30, -32 + y0], [-20, -35 + y0], [-4, -32 + y0 + pitch / 3], [12, -37 + y0 + pitch], [20, -32 + y0 + pitch], [21, -19 + y0 + pitch], [14, -12 + y0 + pitch], [2, -13 + y0 + pitch / 2], [-12, -19 + y0], [-26, -15 + y0]], near);
    poly(c, [[-30, -31 + y0], [-20, -34 + y0], [-4, -31 + y0 + pitch / 3], [12, -36 + y0 + pitch], [18, -33 + y0 + pitch], [14, -28 + y0 + pitch], [-4, -26 + y0 + pitch / 3], [-22, -29 + y0]], hi);
    poly(c, [[-4, -14 + y0 + pitch / 3], [14, -13 + y0 + pitch], [19, -20 + y0 + pitch], [6, -19 + y0 + pitch / 2]], "#2b2228");
    // Pelo del lomo y del pecho, a mechones.
    for (let k = 0; k < 7; k++) { const fx = -27 + k * 7, fy = -33 + y0 + (k > 3 ? pitch * (k - 3) / 4 - 1 : 0) + (k > 2 && k < 5 ? 2 : 0), rise = 3 + (k % 2) + Math.round(Math.sin(time * 5 + k) * .6); poly(c, [[fx - 3, fy + 2], [fx - 2, fy - rise], [fx + 3, fy + 2]], k % 2 ? near : hi); }
    for (let k = 0; k < 4; k++) poly(c, [[12 + k * 3, -19 + y0 + pitch], [13 + k * 3, -10 + y0 + pitch + (k % 2) * 2], [15 + k * 3, -19 + y0 + pitch]], k % 2 ? near : hi);
    rearLeg(-20, -21 + crouch, gait, near, hi);
    const pawDig = dig ? Math.round(Math.sin(time * 24) * 5) : 0;
    frontLeg(10 + pawDig * .4, -21 + crouch + pitch, dig ? time * 24 : gait + Math.PI, near, hi);
    // Tres cabezas en abanico, cada una con su cuello y su collar de púas.
    const heads = [[-5, -62, 0], [20, -44, 2.1], [13, -21, 4.2]];
    heads.forEach(([hx, hy, seed], i) => {
      let dx = 0, dy = Math.round(Math.sin(time * 3 + seed) * 1.5) + pitch, open = 0, pant = false;
      const breath = e.alert ? Math.sin(time * 8 + seed) : 0;
      if (e.alert && !id) { open = 2 + (breath > 0 ? 1 : 0); pant = i !== 0; }
      else if (!id && Math.sin(time * 1.6 + seed) > .2) { open = 1; pant = true; }
      if (biteWind) { const k = Math.min(1, t / .47); dx = -7 * k; dy += (i - 1) * -2 * k; open = Math.round(k * 7); }
      if (biting) { const k = Math.min(1, (t - .47) / .08); dx = -7 + 19 * k; open = t < .54 ? 8 : 1; }
      if (dig) { dy += i === 2 ? 7 : 3; dx += i === 2 ? 4 : 0; open = i === 2 ? (Math.floor(time * 10) % 2 ? 3 : 0) : 0; }
      if (flying) { dx += 3; dy -= 2; open = 4; }
      if (jump && crouch) { dy += 3; open = 2; }
      const cx = hx + dx, cy = hy + dy, nx = 8, ny = -26 + y0 + pitch, neck = Math.atan2(cy - ny, cx - nx), mx = nx + (cx - nx) * .62, my = ny + (cy - ny) * .62;
      armTo(c, nx, ny, cx - 1, cy + 1, 11, i === 1 ? hi : near);
      rrect(c, mx, my, neck + Math.PI / 2, -7, -2, 14, 4, "#6e1f28"); rrect(c, mx, my, neck + Math.PI / 2, -7, -2, 14, 1, "#a8323c");
      for (const k of [-5, 0, 5]) { const px = mx + Math.cos(neck + Math.PI / 2) * k, py = my + Math.sin(neck + Math.PI / 2) * k; rrect(c, px, py, neck, 2, -1, 4, 2, "#d9d2c0"); }
      dogHead(c, cx, cy, open, e.alert, pant, seed, time);
    });
  }
  // La espada de Zak: guarda curva violeta, gema, empuñadura trenzada y una hoja oscura con filos encendidos.
  function zakSword(c, x, y, a, time, sunk = 0) {
    const part = (px, py, w, h, color) => rrect(c, x, y, a, px, py, w, h, color), at = (u, v) => [x + Math.cos(a) * u - Math.sin(a) * v, y + Math.sin(a) * u + Math.cos(a) * v];
    const shape = (points, color) => poly(c, points.map(p => at(p[0], p[1])), color), flame = Math.floor(time * 11) % 3;
    if (Px.mode !== "outline") { for (const u of sunk ? [24, 40] : [30, 58, 84]) { const p = at(u, 0); Px.glow(c, p[0], p[1], 15, "#a040ff", .42); } }
    // Hoja
    if (sunk) {
      shape([[13, -7], [sunk, -6], [sunk, 6], [13, 7]], "#c95cff"); shape([[13, -5], [sunk, -4], [sunk, 4], [13, 5]], "#7a2fd0"); shape([[13, -4], [sunk, -3], [sunk, 3], [13, 4]], "#1b1530"); shape([[13, -1], [sunk, -1], [sunk, 1], [13, 1]], "#44365f"); shape([[13, -7], [sunk, -6], [sunk, -5], [13, -6]], "#f4d8ff");
      const tip = at(sunk, 0); rect(c, tip[0] - 11, tip[1] - 1, 22, 2, "#0e0a14"); rect(c, tip[0] - 16, tip[1], 5, 1, "#0e0a14"); rect(c, tip[0] + 11, tip[1], 6, 1, "#0e0a14");
    } else {
      shape([[13, -7], [76, -6], [98, 0], [76, 6], [13, 7]], "#c95cff");
      shape([[13, -5], [75, -4], [93, 0], [75, 4], [13, 5]], "#7a2fd0");
      shape([[13, -4], [74, -3], [88, 0], [74, 3], [13, 4]], "#1b1530");
      shape([[13, -1], [80, 0], [13, 1]], "#44365f");
      shape([[13, -7], [76, -6], [98, 0], [76, -5], [13, -6]], "#f4d8ff");
    }
    if (Px.mode !== "outline") for (let k = 0; k < 5; k++) { const u = 20 + ((k * 17 + flame * 6) % (sunk ? Math.max(10, sunk - 22) : 72)), s = k % 2 ? 1 : -1, p = at(u, s * (8 + (k + flame) % 3)); rect(c, p[0], p[1], 1, 2, k % 2 ? "#f4d8ff" : "#c95cff"); }
    // Guarda: dos cuernos curvados hacia la hoja.
    for (const s of [-1, 1]) {
      shape([[8, 0], [13, s * 2], [14, s * 13], [22, s * 21], [15, s * 20], [7, s * 15], [3, s * 7]], "#2b2350");
      shape([[9, s * 1], [12, s * 3], [13, s * 13], [19, s * 19], [14, s * 18], [8, s * 14], [5, s * 7]], "#5b4bb0");
      shape([[10, s * 3], [11, s * 4], [12, s * 13], [16, s * 17], [13, s * 16], [9, s * 12]], "#a59af0");
    }
    shape([[3, -6], [15, -6], [18, 0], [15, 6], [3, 6], [0, 0]], "#2b2350"); shape([[5, -4], [13, -4], [15, 0], [13, 4], [5, 4], [3, 0]], "#6a2fb0"); shape([[7, -2], [11, -2], [12, 0], [11, 2], [7, 2], [6, 0]], "#f0a0ff");
    // Empuñadura trenzada y pomo con gema.
    part(-15, -3, 18, 6, "#1d1630");
    for (let u = -14; u < 2; u += 4) { part(u, -3, 2, 6, "#6a3fc0"); part(u + 1, -3, 1, 3, "#a77bff"); }
    shape([[-21, 0], [-18, -4], [-14, -4], [-13, 0], [-14, 4], [-18, 4]], "#3a2c6a"); shape([[-19, 0], [-17, -2], [-15, 0], [-17, 2]], "#e090ff");
  }
  const ZAK = { deep: "#121014", dark: "#232026", steel: "#3a363e", mid: "#5b565f", light: "#8d888e", shine: "#c6c1c3", red0: "#4c0d15", red1: "#7e1620", red2: "#b3242c", red3: "#dd4247", eye: "#ff3b30" };
  const zakGem = (c, x, y) => { rect(c, x - 2, y - 2, 4, 4, ZAK.deep); rect(c, x - 1, y - 1, 2, 2, ZAK.red3); rect(c, x - 1, y - 1, 1, 1, "#ffb0a8"); };
  // Cuerno curvo; s=1 a la derecha.
  function zakHorn(c, x, y, s, reach, up) {
    poly(c, [[x, y + 6], [x + s * reach * .6, y + 2], [x + s * reach, y - up * .4], [x + s * reach * .82, y - up], [x + s * reach * .62, y - up * .5], [x + s * reach * .28, y - 6], [x, y - 4]], ZAK.mid);
    poly(c, [[x + s * 1, y], [x + s * reach * .5, y - 3], [x + s * reach * .66, y - up * .5], [x + s * reach * .78, y - up * .85], [x + s * reach * .84, y - up * .5], [x + s * reach * .55, y - 1]], ZAK.shine);
    poly(c, [[x + s * reach, y - up * .45], [x + s * reach * .82, y - up], [x + s * reach * .78, y - up * .62]], ZAK.steel);
  }
  // Hombrera de placas superpuestas con púa y gema roja.
  function zakPauldron(c, x, y, s) {
    poly(c, [[x + s * 2, y + 1], [x + s * 12, y - 21], [x + s * 13, y - 5]], ZAK.mid); poly(c, [[x + s * 3, y], [x + s * 11, y - 17], [x + s * 10, y - 5]], ZAK.shine);
    poly(c, [[x - s * 9, y - 4], [x + s * 4, y - 9], [x + s * 15, y - 2], [x + s * 18, y + 9], [x + s * 10, y + 15], [x - s * 7, y + 10]], ZAK.steel);
    poly(c, [[x - s * 8, y - 3], [x + s * 4, y - 8], [x + s * 13, y - 2], [x + s * 3, y - 2]], ZAK.light);
    for (const k of [5, 11]) { poly(c, [[x - s * 7, y + k], [x + s * 5, y + k - 2], [x + s * 18, y + k + 2], [x + s * 15, y + k + 5], [x + s * 4, y + k + 2], [x - s * 6, y + k + 4]], k === 5 ? ZAK.mid : ZAK.steel); Px.line(c, x - s * 6, y + k, x + s * 5, y + k - 2, ZAK.shine); Px.line(c, x + s * 5, y + k - 2, x + s * 17, y + k + 2, ZAK.light); }
    Px.line(c, x - s * 8, y - 3, x + s * 4, y - 8, ZAK.shine); Px.line(c, x + s * 4, y - 8, x + s * 13, y - 2, ZAK.shine);
    zakGem(c, x + s * 3, y + 3);
  }
  // Pierna de placas de frente; lift la levanta.
  function zakLegFront(c, x, lift, s) {
    box(c, x, -36, 13, 15 - lift, ZAK.dark); rect(c, x + 2, -36, 3, 13 - lift, ZAK.steel);
    poly(c, [[x - 1, -23 - lift], [x + 6, -27 - lift], [x + 14, -23 - lift], [x + 11, -15 - lift], [x + 2, -15 - lift]], ZAK.mid); poly(c, [[x + 1, -23 - lift], [x + 6, -26 - lift], [x + 12, -23 - lift], [x + 6, -21 - lift]], ZAK.shine); zakGem(c, x + 6, -19 - lift);
    box(c, x + 1, -15 - lift, 11, 12, ZAK.steel); rect(c, x + 3, -14 - lift, 2, 10, ZAK.light); rect(c, x + 8, -13 - lift, 1, 9, ZAK.deep);
    poly(c, [[x - 1 - (s > 0 ? 0 : 3), -3 - lift], [x + 13 + (s > 0 ? 3 : 0), -3 - lift], [x + 14 + (s > 0 ? 3 : 0), 0 - lift], [x - 2 - (s > 0 ? 0 : 3), 0 - lift]], ZAK.dark); rect(c, x + 1, -3 - lift, 10, 1, ZAK.mid);
  }
  // Pierna de perfil, con la rodilla doblada según el paso.
  function zakLegSide(c, hipX, footX, lift, tone1, tone2) {
    const footY = -lift, kneeX = (hipX + footX) / 2 + 6, kneeY = (-34 + footY) / 2 - 2, k = armTo(c, hipX, -34, kneeX, kneeY, 12, tone1); armTo(c, k[0], k[1], footX, footY - 2, 10, tone2);
    poly(c, [[k[0] - 3, k[1] - 5], [k[0] + 6, k[1] - 4], [k[0] + 6, k[1] + 4], [k[0] - 3, k[1] + 4]], ZAK.mid); rect(c, k[0], k[1] - 4, 4, 2, ZAK.shine);
    poly(c, [[footX - 6, footY - 4], [footX + 7, footY - 4], [footX + 13, footY], [footX - 6, footY]], ZAK.dark); rect(c, footX - 4, footY - 4, 9, 1, ZAK.mid);
  }
  function zakHelmFront(c, y, glow) {
    zakHorn(c, -11, y - 19, -1, 18, 25); zakHorn(c, 11, y - 19, 1, 18, 25);
    poly(c, [[-12, y - 20], [0, y - 31], [12, y - 20], [13, y - 6], [7, y + 2], [-7, y + 2], [-13, y - 6]], ZAK.dark);
    poly(c, [[-10, y - 20], [0, y - 29], [-2, y - 12], [-11, y - 9]], ZAK.steel); poly(c, [[-8, y - 20], [-1, y - 27], [-2, y - 19]], ZAK.light);
    poly(c, [[-2, y - 31], [2, y - 31], [2, y - 12], [0, y - 9], [-2, y - 12]], ZAK.mid); rect(c, -1, y - 30, 1, 17, ZAK.shine);
    poly(c, [[-10, y - 11], [10, y - 11], [8, y - 4], [-8, y - 4]], ZAK.deep);
    poly(c, [[-9, y - 11], [-3, y - 8], [-3, y - 6], [-8, y - 9]], glow); poly(c, [[9, y - 11], [3, y - 8], [3, y - 6], [8, y - 9]], glow);
    rect(c, -7, y - 9, 2, 1, "#ffc0b0"); rect(c, 5, y - 9, 2, 1, "#ffc0b0");
    for (const k of [-5, -2, 1, 4]) rect(c, k, y - 3, 1, 4, ZAK.deep);
    if (Px.mode !== "outline") { Px.glow(c, -6, y - 8, 7, "#ff3b30", .6); Px.glow(c, 6, y - 8, 7, "#ff3b30", .6); }
  }
  // Zak: armadura de acero oscuro, cuernos curvos, bufanda y capa rojas. Tiene vistas de frente, costado y espalda.
  function drawZak(c, e, time, walk) {
    const a = e.act || {}, t = a.t || 0, id = a.id, seated = e.seated || (e.yielding && e.yielding.seatedAt), aim = localAim(e), flap = Math.sin(time * 2.6);
    const planted = id === "storm" || id === "purple", raised = id === "raise" || id === "major" || e.pose === "raise", roar = id === "roar", boom = id === "boomerang", rise = id === "rise";
    const chase = !!(currentGame && currentGame.cutscene && currentGame.cutscene.chase), stride = e.moving ? Math.sin(time * (chase ? 15 : 9) + e.x * .05) : 0, hem = k => Math.round(Math.sin(time * 3.2 + k * 1.7) * 3), hurt = e.hitFlash > 0 && !id;
    const view = seated ? "front" : e.dir === "up" ? "back" : e.dir === "down" ? "front" : "side";
    if (rise) {
      // Se desploma, queda en el piso y se vuelve a levantar envuelto en violeta.
      const stage = t < .25 ? 1 : t < 1.5 ? 2 : t < 2.2 ? 1 : 0;
      if (stage === 2) {
        poly(c, [[-40, -3], [-28, -14], [-6, -17], [18, -13], [34, -3], [20, 0], [8, -2], [-4, 0], [-18, -2], [-30, 0]], ZAK.red0); poly(c, [[-34, -3], [-24, -12], [-6, -14], [14, -11], [26, -4], [8, -5], [-10, -4]], ZAK.red1);
        poly(c, [[-22, -8], [-6, -19], [18, -18], [22, -8], [0, -3]], ZAK.steel); poly(c, [[-14, -11], [-4, -18], [14, -17], [8, -12], [-6, -9]], ZAK.mid); zakGem(c, 4, -12);
        poly(c, [[16, -15], [30, -18], [38, -9], [32, -2], [18, -3]], ZAK.dark); poly(c, [[20, -14], [30, -16], [33, -11], [22, -10]], ZAK.mid); rect(c, 29, -8, 4, 2, ZAK.red2);
        zakHorn(c, 26, -16, 1, 14, 14); zakHorn(c, 22, -15, -1, 10, 11); zakSword(c, -30, -2, .03, time);
        return;
      }
      if (stage === 1) {
        // De rodillas, apoyado en la espada.
        poly(c, [[-26, -44], [24, -44], [34 + flap * 3, -8], [18, -1], [6, -8], [-6, -1], [-18, -8], [-34 - flap * 3, -1]], ZAK.red1);
        box(c, -19, -26, 16, 12, ZAK.dark); box(c, -19, -14, 14, 14, ZAK.steel); box(c, 4, -26, 14, 10, ZAK.dark); poly(c, [[4, -17], [18, -17], [24, -3], [24, 0], [6, 0]], ZAK.steel); rect(c, 6, -3, 18, 3, ZAK.deep);
        box(c, -19, -56, 38, 32, ZAK.steel); poly(c, [[-15, -56], [15, -56], [12, -42], [0, -34], [-12, -42]], ZAK.mid); poly(c, [[-13, -55], [13, -55], [11, -50], [-11, -50]], ZAK.light);
        poly(c, [[-13, -62], [13, -62], [15, -54], [0, -45], [-15, -54]], ZAK.red1); rect(c, -12, -62, 24, 2, ZAK.red3);
        zakPauldron(c, -23, -60, -1); zakPauldron(c, 23, -60, 1); zakHelmFront(c, -57, ZAK.eye);
        zakSword(c, 30, -46, Math.PI / 2 - .1, time, 46); armTo(c, 24, -52, 30, -46, 9, ZAK.dark); box(c, 25, -51, 11, 11, ZAK.mid);
        return;
      }
    }
    // Poses de la espada: mano fuerte (hx,hy), ángulo de la hoja y mano de apoyo (sx,sy).
    let hx = view === "side" ? 12 : 27, hy = -40 - Math.round(stride * 2), blade = view === "side" ? -.7 : -1.1, sx = view === "side" ? -8 : -27, sy = -40 + Math.round(stride * 2), both = false;
    if (view === "back") { hx = 22; hy = -44; blade = -1.9; sx = -26; }
    if (chase) { hx = 22; hy = -42; blade = 2.7; }
    if (id === "slash") {
      const ph = t % .7;
      if (ph < .45) { const k = Math.min(1, ph / .3); hx = 20 - 26 * k; hy = -42 - 46 * k; blade = -1.1 - 1.55 * k; }
      else { const k = Math.min(1, (ph - .45) / .09); hx = -6 + (Math.cos(aim) * 30 + 6) * k; hy = -88 + (42 + Math.sin(aim) * 24) * k; blade = -2.65 + (aim + 2.65) * k; }
      both = true;
    } else if (boom) { const k = Math.min(1, t / .55); hx = 22 - 22 * k; hy = -42 - 52 * k; blade = -1.1 - .47 * k; both = true; }
    else if (raised) { const k = Math.min(1, t / .4 + (e.pose === "raise" ? 1 : 0)); hx = 26 - 20 * k; hy = -40 - 56 * k; blade = -1.1 - .47 * k; sx = -30; sy = -72; }
    else if (planted) { hx = view === "side" ? 16 : 0; hy = -44; blade = Math.PI / 2; both = true; }
    else if (seated) { hx = 19; hy = -34; blade = Math.PI + .06; sx = -21; sy = -34; }
    else if (roar) { hx = 38; hy = -70; blade = -1; sx = -38; sy = -70; }
    if (both) { sx = hx - 3; sy = hy + 6; }
    const swordFirst = view === "back" || (id === "slash" && t % .7 < .45) || boom;
    const lean = chase ? 9 : view === "side" && e.moving ? 3 : hurt ? -3 : id === "slash" && t % .7 >= .45 ? 4 : 0, drop = planted ? 5 : roar ? -2 : seated ? 8 : Math.abs(stride) > .7 ? 0 : -1;
    const f = flap * 3, wind = chase ? 22 : e.moving && view === "side" ? 9 : 0;
    // Capa roja rota: detrás de todo salvo de espaldas.
    const cape = (top, spread) => {
      poly(c, [[-spread, top], [spread, top], [spread + 12 + f, -13], [spread + 2, -1 + hem(1)], [spread - 8, -10], [spread - 15, 1 + hem(2)], [3, -9], [-5, 2 + hem(3)], [-spread + 11, -10], [-spread - 1, 0 + hem(4)], [-spread - 12 - f, -13]], "#1d0a10");
      poly(c, [[-spread + 3, top + 2], [spread - 3, top + 2], [spread + 8 + f, -15], [spread, -5 + hem(1)], [spread - 8, -14], [spread - 15, -3 + hem(2)], [3, -13], [-5, -2 + hem(3)], [-spread + 11, -14], [-spread + 1, -4 + hem(4)], [-spread - 8 - f, -15]], ZAK.red0);
      for (const x of [-spread + 3, spread - 4]) poly(c, [[x - 3, top + 8], [x + 3, top + 8], [x + (x > 0 ? 9 : 2) + f * .6, -17], [x + (x > 0 ? 4 : -3), -6 + hem(5)], [x - (x > 0 ? 1 : 9) - f * .6, -17]], ZAK.red1);
      for (const x of [-spread - 2, spread + 3]) poly(c, [[x - 1, top + 30], [x + 1, top + 30], [x + (x > 0 ? 5 : -1) + f * .6, -16], [x + (x > 0 ? 2 : -3) + f * .6, -11 + hem(6)]], ZAK.red2);
    };
    if (view === "front") cape(-74, 20);
    else if (view === "side") {
      const back = -6 - wind, flow = wind * .5;
      poly(c, [[10, -76], [-12, -76], [back - 26, -30 - flow * 1.1], [back - 34 - f, -6 - flow * .8], [back - 22, -11 - flow * .6 + hem(1)], [back - 18, 1 - flow * .4 + hem(2)], [back - 6, -9 - flow * .3], [back + 2, 2 + hem(3)], [4, -10], [8, -30]], "#1d0a10");
      poly(c, [[7, -74], [-10, -74], [back - 21, -30 - flow * 1.1], [back - 28 - f, -10 - flow * .8], [back - 20, -15 - flow * .6 + hem(1)], [back - 16, -3 - flow * .4 + hem(2)], [back - 5, -13 - flow * .3], [back + 2, -2 + hem(3)], [2, -14], [5, -30]], ZAK.red0);
      poly(c, [[-2, -72], [-6, -72], [back - 13, -28 - flow], [back - 12, -12 - flow * .6], [back - 7, -24 - flow * .6]], ZAK.red1); poly(c, [[-7, -60], [-9, -60], [back - 21, -26 - flow], [back - 24, -14 - flow * .7], [back - 18, -24 - flow * .8]], ZAK.red2);
    }
    // Piernas
    if (seated) {
      box(c, -19, -30, 16, 11, ZAK.dark); box(c, 3, -30, 16, 11, ZAK.dark); poly(c, [[-22, -22], [-6, -24], [-5, -14], [-20, -14]], ZAK.mid); poly(c, [[22, -22], [6, -24], [5, -14], [20, -14]], ZAK.mid); zakGem(c, -13, -19); zakGem(c, 13, -19);
      box(c, -19, -14, 13, 14, ZAK.steel); box(c, 6, -14, 13, 14, ZAK.steel); rect(c, -21, -3, 16, 3, ZAK.deep); rect(c, 5, -3, 16, 3, ZAK.deep);
    } else if (view === "side") {
      const reach = chase ? 20 : 13;
      zakLegSide(c, -2, -2 - Math.round(stride * reach), stride > .15 ? Math.round(stride * 5) : 0, ZAK.deep, ZAK.dark);
      zakLegSide(c, 3, 3 + Math.round(stride * reach), stride < -.15 ? Math.round(-stride * 5) : 0, ZAK.dark, ZAK.steel);
    } else {
      zakLegFront(c, -17, stride > .25 ? 4 : 0, -1); zakLegFront(c, 4, stride < -.25 ? 4 : 0, 1);
    }
    if (view === "back") cape(-76, 22);
    c.translate(lean, drop);
    if (swordFirst) zakSword(c, hx, hy, blade, time, planted ? 40 - drop : 0);
    if (view === "side") {
      // Costado: torso de perfil, una hombrera adelante y el casco mirando hacia adelante.
      armTo(c, -4, -68, sx, sy, 8, ZAK.deep); box(c, sx - 5, sy - 5, 10, 10, ZAK.dark);
      poly(c, [[-14, -74], [13, -74], [16, -56], [11, -38], [-11, -38], [-15, -56]], ZAK.dark);
      poly(c, [[-4, -73], [13, -73], [15, -56], [10, -40], [0, -40]], ZAK.steel); poly(c, [[2, -71], [12, -71], [13, -60], [4, -58]], ZAK.mid); poly(c, [[5, -70], [11, -70], [12, -64], [6, -64]], ZAK.light);
      for (const y of [-56, -50, -44]) { rect(c, 0, y, 13, 1, ZAK.deep); rect(c, 1, y + 1, 11, 1, ZAK.light); }
      poly(c, [[-11, -40], [11, -40], [14, -26], [6, -22], [-6, -22], [-13, -26]], ZAK.deep); poly(c, [[-1, -38], [10, -38], [12, -27], [1, -24]], ZAK.steel); rect(c, -11, -41, 22, 3, ZAK.dark); zakGem(c, 7, -40);
      poly(c, [[3, -38], [10, -38], [11, -19 + hem(2)], [6, -23], [3, -17 + hem(3)]], ZAK.red1);
      poly(c, [[-14, -80], [12, -80], [14, -71], [3, -66], [-13, -71]], ZAK.red1); rect(c, -12, -80, 23, 2, ZAK.red3); rect(c, -11, -74, 18, 1, ZAK.red0);
      const tail = chase ? 34 : 18 + wind; poly(c, [[-11, -77], [-14, -68], [-14 - tail, -60 + hem(1)], [-20 - tail, -56 + hem(2)], [-13 - tail * .6, -55], [-9, -64]], ZAK.red1); poly(c, [[-11, -75], [-14 - tail * .8, -60 + hem(1)], [-12 - tail * .5, -58], [-10, -68]], ZAK.red3);
      // Casco de perfil
      const hy0 = -80, tilt = roar ? -3 : hurt ? -2 : 0;
      zakHorn(c, -6, hy0 - 19 + tilt, -1, 14, 19); zakHorn(c, 3, hy0 - 19 + tilt, 1, 21, 27);
      poly(c, [[-13, hy0 - 16 + tilt], [-4, hy0 - 29 + tilt], [8, hy0 - 25 + tilt], [14, hy0 - 12 + tilt], [17, hy0 - 3 + tilt], [11, hy0 + 3 + tilt], [-4, hy0 + 3 + tilt], [-13, hy0 - 4 + tilt]], ZAK.dark);
      poly(c, [[-10, hy0 - 17 + tilt], [-3, hy0 - 27 + tilt], [7, hy0 - 23 + tilt], [11, hy0 - 13 + tilt], [-2, hy0 - 12 + tilt], [-10, hy0 - 8 + tilt]], ZAK.steel); poly(c, [[-7, hy0 - 18 + tilt], [-2, hy0 - 25 + tilt], [5, hy0 - 22 + tilt], [-2, hy0 - 18 + tilt]], ZAK.light);
      poly(c, [[0, hy0 - 11 + tilt], [14, hy0 - 11 + tilt], [16, hy0 - 4 + tilt], [3, hy0 - 4 + tilt]], ZAK.deep); poly(c, [[6, hy0 - 10 + tilt], [13, hy0 - 10 + tilt], [13, hy0 - 7 + tilt], [7, hy0 - 8 + tilt]], ZAK.eye); rect(c, 10, hy0 - 10 + tilt, 2, 1, "#ffc0b0");
      for (const k of [6, 9, 12]) rect(c, k, hy0 - 3 + tilt, 1, 5, ZAK.deep);
      if (Px.mode !== "outline") Px.glow(c, 10, hy0 - 8 + tilt, 8, "#ff3b30", .6);
      zakPauldron(c, 1, -74, 1);
    } else if (view === "back") {
      armTo(c, -22, -66, sx, sy, 9, ZAK.deep); box(c, sx - 5, sy - 5, 10, 10, ZAK.dark);
      box(c, -19, -74, 38, 18, ZAK.steel);
      poly(c, [[-22, -78], [22, -78], [20, -66], [5, -58], [0, -36 + hem(1)], [-5, -58], [-20, -66]], ZAK.red1); poly(c, [[-20, -78], [20, -78], [18, -72], [-18, -72]], ZAK.red2); rect(c, -20, -78, 40, 2, ZAK.red3); poly(c, [[-2, -66], [2, -66], [1, -34 + hem(1)], [-1, -34 + hem(1)]], ZAK.red2);
      zakPauldron(c, -24, -74, -1); zakPauldron(c, 24, -74, 1);
      const y = -80; zakHorn(c, -11, y - 19, -1, 18, 25); zakHorn(c, 11, y - 19, 1, 18, 25);
      poly(c, [[-13, y - 20], [0, y - 31], [13, y - 20], [13, y - 2], [7, y + 3], [-7, y + 3], [-13, y - 2]], ZAK.dark); poly(c, [[-10, y - 20], [0, y - 28], [-3, y - 3], [-10, y - 5]], ZAK.steel); poly(c, [[-2, y - 31], [2, y - 31], [2, y], [-2, y]], ZAK.mid); rect(c, -1, y - 30, 1, 29, ZAK.shine);
      for (let k = 0; k < 3; k++) rect(c, -10, y - 13 + k * 5, 20, 1, ZAK.deep);
    } else {
      armTo(c, -23, -66, sx, sy, 9, ZAK.dark);
      { const ex = (-23 + sx) / 2, ey = (-66 + sy) / 2; rect(c, ex - 4, ey - 4, 8, 7, ZAK.mid); rect(c, ex - 3, ey - 4, 6, 1, ZAK.shine); zakGem(c, sx, sy - 7); }
      // Cintura, faldones y paño rojo al frente.
      poly(c, [[-14, -42], [14, -42], [19, -31], [8, -27], [-8, -27], [-19, -31]], ZAK.deep);
      poly(c, [[-14, -40], [-4, -40], [-6, -28], [-18, -31]], ZAK.steel); poly(c, [[14, -40], [4, -40], [6, -28], [18, -31]], ZAK.steel); poly(c, [[-13, -39], [-7, -39], [-9, -32], [-16, -32]], ZAK.light); poly(c, [[13, -39], [7, -39], [9, -32], [16, -32]], ZAK.mid);
      poly(c, [[-4, -40], [4, -40], [5, -17 + hem(2)], [1, -21], [0, -13 + hem(1)], [-2, -21], [-5, -16 + hem(3)]], ZAK.red1); poly(c, [[-1, -40], [2, -40], [1, -20], [-1, -20]], ZAK.red2);
      rect(c, -15, -44, 30, 4, ZAK.dark); rect(c, -15, -44, 30, 1, ZAK.mid); zakGem(c, 0, -42);
      // Peto en capas, en punta.
      poly(c, [[-20, -76], [20, -76], [18, -58], [8, -46], [0, -42], [-8, -46], [-18, -58]], ZAK.deep);
      poly(c, [[-18, -74], [18, -74], [16, -60], [0, -44], [-16, -60]], ZAK.steel);
      poly(c, [[-17, -72], [0, -72], [0, -60], [-15, -60]], ZAK.mid); poly(c, [[17, -72], [1, -72], [1, -60], [15, -60]], ZAK.steel);
      for (const y of [-66, -60, -54, -48]) { const w = (y + 42) * -.72 + 1; poly(c, [[-w, y - 2], [0, y + 4], [w, y - 2], [w, y], [0, y + 6], [-w, y]], y < -56 ? ZAK.mid : ZAK.light); poly(c, [[-w, y - 2], [0, y + 4], [0, y + 5], [-w, y - 1]], ZAK.shine); }
      rect(c, -1, -72, 2, 30, ZAK.deep);
      // Bufanda roja cruzada y su caída.
      poly(c, [[-17, -82], [17, -82], [19, -74], [8, -67], [0, -62], [-8, -67], [-19, -74]], ZAK.red0);
      poly(c, [[-16, -82], [16, -82], [17, -75], [7, -69], [0, -65], [-7, -69], [-17, -75]], ZAK.red1);
      poly(c, [[-15, -81], [15, -81], [13, -77], [0, -72], [-13, -77]], ZAK.red2); rect(c, -14, -82, 28, 2, ZAK.red3); poly(c, [[-12, -76], [0, -70], [-2, -67], [-12, -73]], ZAK.red2);
      zakPauldron(c, -24, -74, -1); zakPauldron(c, 24, -74, 1);
      const tilt = roar ? -3 : hurt ? -2 : 0;
      zakHelmFront(c, -80 + tilt, ZAK.eye);
    }
    // Brazo fuerte y guantelete.
    const shoulderX = view === "side" ? 3 : 23, shoulderY = view === "side" ? -66 : -66;
    armTo(c, shoulderX, shoulderY, hx, hy, 9, ZAK.dark);
    const mx = (shoulderX + hx) / 2, my = (shoulderY + hy) / 2; rect(c, mx - 4, my - 4, 8, 7, ZAK.mid); rect(c, mx - 3, my - 4, 6, 1, ZAK.shine);
    if (!swordFirst) zakSword(c, hx, hy, blade, time, planted ? 40 - drop : 0);
    box(c, hx - 6, hy - 6, 12, 12, ZAK.steel); rect(c, hx - 5, hy - 5, 10, 2, ZAK.light); zakGem(c, hx, hy + 1);
    if (both || view === "front" || view === "back") { box(c, sx - 5, sy - 5, 10, 10, ZAK.steel); rect(c, sx - 4, sy - 4, 8, 1, ZAK.light); }
  }
  // El Rey Mago: túnica real con estrellas, barba larga, corona y báculo. Flota al usar magia.
  function drawArchmage(c, e, time, walk) {
    const a = e.act || {}, t = a.t || 0, id = a.id, heal = id === "heal", nova = id === "nova", summon = id === "summon", laser = id === "laser", overload = id === "overload", charge = overload ? Math.min(1, (a.time || 0) / (Z.OVERLOAD_TIME || 8)) : 0, casting = nova || summon || laser || overload;
    const hover = laser ? 6 + Math.round(Math.sin(time * 4) * 1.5) : Math.round(Math.sin(time * 2.4) + 1), sway = Math.sin(time * 2 + e.x * .1), k = nova ? Math.min(1, t / .7) : summon ? Math.min(1, t / .6) : laser ? Math.min(1, t / .8) : heal ? 1 : overload ? Math.min(1, t / .5) : 0;
    if (charge > .75) c.translate(Math.floor(time * 30) % 2 ? 1 : -1, 0);
    const kneel = heal ? 5 : 0;
    c.translate(0, -hover + kneel);
    const skirt = Math.round(sway * 2);
    poly(c, [[-11, -38], [11, -38], [15 + skirt, hover - kneel], [-15 + skirt, hover - kneel]], "#140f26");
    poly(c, [[-10, -37], [10, -37], [13 + skirt, hover - kneel - 1], [-13 + skirt, hover - kneel - 1]], "#3e2f86");
    poly(c, [[-10, -37], [-3, -37], [-5 + skirt, hover - kneel - 1], [-13 + skirt, hover - kneel - 1]], "#4d3ca3");
    poly(c, [[5, -37], [10, -37], [13 + skirt, hover - kneel - 1], [7 + skirt, hover - kneel - 1]], "#2a1f55");
    rect(c, -13 + skirt, hover - kneel - 4, 26, 3, "#f2c94c"); rect(c, -13 + skirt, hover - kneel - 4, 26, 1, "#ffe9a0");
    rect(c, -2, -37, 4, 34, "#f2c94c"); rect(c, -1, -37, 1, 34, "#ffe9a0");
    for (const [x, y] of [[-8, -20], [6, -24], [-6, -9], [8, -11]]) { rect(c, x, y, 2, 2, "#c9a6ff"); if (Math.sin(time * 3 + x) > .6) { rect(c, x - 1, y, 4, 1, "#ffffff"); rect(c, x, y - 1, 1, 4, "#ffffff"); } }
    // Brazo libre
    let la = 2 - sway * .1, ra = 1.1;
    if (casting) { la = 2 - 3.8 * k; ra = 1.1 - 2.5 * k; }
    if (heal) { la = 1; ra = 2.1; }
    const sleeve = limb(c, -10, -36, la, 13, 6, "#2a1f55"); rect(c, sleeve[0] - 2, sleeve[1] - 2, 4, 4, "#c9a27e");
    box(c, -11, -40, 22, 7, "#4d3ca3"); rect(c, -14, -41, 6, 5, "#f2c94c"); rect(c, 8, -41, 6, 5, "#f2c94c"); rect(c, -8, -39, 16, 2, "#e8e2d6");
    rect(c, -6, -51, 12, 11, "#c9a27e"); rect(c, 5, -51, 1, 8, "#a8835f");
    // Barba que se mueve con el aire.
    const curl = Math.round(sway * 1.5);
    poly(c, [[-7, -44], [7, -44], [4 + curl, -28], [curl, -22], [-4 + curl, -28]], "#e8e2d6"); poly(c, [[-3, -44], [3, -44], [1 + curl, -26], [-1 + curl, -26]], "#ffffff"); rect(c, -6, -46, 12, 2, "#e8e2d6"); rect(c, -2, -44, 4, 1, "#9a7a68");
    rect(c, -4, -48, 3, 1, "#3d2f50"); rect(c, 1, -48, 3, 1, "#3d2f50"); rect(c, -3, -48, 1, 1, casting || heal ? "#ffffff" : "#c9a6ff"); rect(c, 2, -48, 1, 1, casting || heal ? "#ffffff" : "#c9a6ff"); rect(c, -6, -50, 12, 1, "#e8e2d6");
    // Corona
    rect(c, -7, -55, 14, 4, "#f2c94c"); rect(c, -7, -55, 14, 1, "#ffe9a0"); rect(c, -7, -52, 14, 1, "#a8842a");
    for (let p = 0; p < 4; p++) poly(c, [[-7 + p * 4, -55], [-5 + p * 4, -61], [-3 + p * 4, -55]], "#f2c94c");
    rect(c, -1, -54, 2, 2, "#c43a4a"); rect(c, -5, -54, 1, 2, "#5ac7e0"); rect(c, 4, -54, 1, 2, "#5ac7e0");
    // Báculo y orbe
    const hand = limb(c, 10, -36, ra, 13, 6, "#3e2f86"); rect(c, hand[0] - 2, hand[1] - 2, 5, 5, "#c9a27e");
    const staffTop = -22 - 34, sx = Math.round(hand[0]) + 1, top = casting ? hand[1] - 30 - k * 4 : staffTop;
    rect(c, sx, top, 3, hover - kneel - top + (casting ? -8 : 0), "#4a2e1a"); rect(c, sx, top, 1, hover - kneel - top + (casting ? -8 : 0), "#7a5230");
    rect(c, sx - 3, top, 9, 2, "#f2c94c");
    const orb = overload ? "#9fe8ff" : heal ? "#6ad18a" : casting ? "#ffb347" : "#a77bff", size = overload ? 6 + Math.round(charge * 9) : 6 + Math.round(k * (nova ? 4 : 2));
    if (Px.mode !== "outline") Px.glow(c, sx + 1, top - size, 10 + size + Math.round(Math.sin(time * 8) * 2), orb, .75);
    blob(c, sx + 1, top - size, size, size, tone(orb, .7)); blob(c, sx + 1, top - size, size - 1, size - 1, orb); rect(c, sx - 2, top - size - 3, 2, 2, "#ffffff");
  }
  function drawBigTelegraph(c, e, time) {
    const a=e.act;if(!a)return;const x=Math.round(e.x), y=Math.round(e.y), pulse=.35+Math.abs(Math.sin(time*18))*.4;
    c.save();
    const ring=(r,color,fill=.22)=>{c.globalAlpha=pulse*fill;c.fillStyle=color;c.beginPath();c.ellipse(x,y-3,r,r*.75,0,0,Math.PI*2);c.fill();c.globalAlpha=pulse;c.strokeStyle=color;c.lineWidth=2;c.setLineDash([6,5]);c.beginPath();c.ellipse(x,y-3,r,r*.75,0,0,Math.PI*2);c.stroke();c.setLineDash([]);};
    const cone=(range,half,color)=>{const base=Math.atan2(e.aimY,e.aimX);c.globalAlpha=pulse*.35;c.fillStyle=color;c.beginPath();c.moveTo(x,y-8);c.arc(x,y-8,range,base-half,base+half);c.closePath();c.fill();c.globalAlpha=pulse;c.strokeStyle=color;c.lineWidth=2;c.stroke();};
    const line=(len,color)=>{c.strokeStyle=color;c.lineWidth=12;c.lineCap="round";c.globalAlpha=pulse*.35;c.beginPath();c.moveTo(x,y-6);c.lineTo(x+e.aimX*len,y-6+e.aimY*len);c.stroke();c.globalAlpha=pulse;c.lineWidth=2;c.setLineDash([6,5]);c.beginPath();c.moveTo(x,y-6);c.lineTo(x+e.aimX*len,y-6+e.aimY*len);c.stroke();c.setLineDash([]);};
    let warn=true;
    if(e.type==="vampire"){
      if(a.id==="lunge"&&a.t<.9)line(190,"#e0574b");else if(a.id==="swipe"&&a.t<.42)cone(54,1.2,"#e0574b");
      else if(a.id==="retreat"||a.id==="summon")ring(48+Math.sin(time*8)*4,"#8a4fb0",.15);else warn=false;
    } else if(e.type==="golem"){
      if(a.id==="quake"){const ph=a.t%1.15;if(ph<.9){ring(100,"#e0874b");c.globalAlpha=.7;c.strokeStyle="#ffd0a0";c.beginPath();c.ellipse(x,y-3,100*ph/.9,75*ph/.9,0,0,Math.PI*2);c.stroke();}else warn=false;}
      else if(a.id==="throw"&&a.t<.8)line(220,"#c8a060");else warn=false;
    } else if(e.type==="cerbero"){
      if(a.id==="bite"&&a.t<.47)cone(58,1.3,"#e0574b");
      else if(a.id==="jump"){const tx=Math.round(a.tx),ty=Math.round(a.ty);c.globalAlpha=pulse*.3;c.fillStyle="#e0574b";c.beginPath();c.ellipse(tx,ty-3,72,54,0,0,Math.PI*2);c.fill();c.globalAlpha=pulse;c.strokeStyle="#ffb09a";c.lineWidth=2;c.setLineDash([6,5]);c.beginPath();c.ellipse(tx,ty-3,72,54,0,0,Math.PI*2);c.stroke();c.setLineDash([]);c.restore();pixelText(c,"!!",tx,ty-20,"#ff8f7a",12);return;}
      else if(a.id==="dig"){const k=Math.min(1,a.t/3);c.globalAlpha=.9;c.strokeStyle="#3a2a20";c.lineWidth=5;c.beginPath();c.arc(x,y-54,9,0,Math.PI*2);c.stroke();c.strokeStyle="#9ad16a";c.lineWidth=3;c.beginPath();c.arc(x,y-54,9,-Math.PI/2,-Math.PI/2+k*Math.PI*2);c.stroke();}
      else warn=false;
    } else if(e.type==="zak"){
      if(a.id==="slash"&&a.t-Math.floor(a.t/.7)*.7<.45)cone(105,Math.PI/6,"#b05cff");
      else if(a.id==="raise"||a.id==="major"){c.globalAlpha=.6;c.strokeStyle=VIOLET;c.lineWidth=2;for(let k=0;k<2;k++){c.beginPath();c.ellipse(x,y-2,40+k*16+Math.sin(time*6)*3,(40+k*16)*.6,time*(k?1:-1),0,Math.PI*2);c.stroke();}}
      else if(a.id==="roar"){ring(60+a.t*80,"#5a2a8a",.15);}
      else if(a.id==="boomerang"){const base=Math.atan2(e.aimY,e.aimX);c.strokeStyle="#b05cff";c.lineCap="round";for(const o of[-.38,0,.38]){const dx=Math.cos(base+o)*150,dy=Math.sin(base+o)*150;c.globalAlpha=pulse*.3;c.lineWidth=10;c.beginPath();c.moveTo(x,y-14);c.lineTo(x+dx,y-14+dy);c.stroke();c.globalAlpha=pulse;c.lineWidth=2;c.setLineDash([6,5]);c.beginPath();c.moveTo(x,y-14);c.lineTo(x+dx,y-14+dy);c.stroke();c.setLineDash([]);}}
      else warn=false;
    } else if(e.type==="archmage"){
      if(a.id==="nova"&&a.t<.7){const base=Math.atan2(e.aimY,e.aimX);c.strokeStyle="#ff9a3a";c.lineWidth=2;c.setLineDash([5,5]);c.globalAlpha=pulse;for(let k=0;k<5;k++){const an=base+k*Math.PI*2/5;c.beginPath();c.moveTo(x,y-16);c.lineTo(x+Math.cos(an)*160,y-16+Math.sin(an)*160);c.stroke();}c.setLineDash([]);}
      else if(a.id==="heal"){ring(Z.ARCHMAGE_HEAL_RADIUS||85,"#6ad18a",.3);c.globalAlpha=.9;c.strokeStyle="#bff5cf";c.lineWidth=3;c.beginPath();c.arc(x,y-70,9,-Math.PI/2,-Math.PI/2+Math.max(0,1-(a.time||0)/10)*Math.PI*2);c.stroke();}
      else if(a.id==="overload"){
        const R=Z.OVERLOAD_RADIUS||150,k=Math.min(1,(a.time||0)/(Z.OVERLOAD_TIME||8));
        ring(R,"#7fd8ff",.16+k*.3);c.globalAlpha=.9;c.strokeStyle="#e0f7ff";c.lineWidth=2;c.beginPath();c.ellipse(x,y-3,R*k,R*k*.75,0,0,Math.PI*2);c.stroke();
        c.globalAlpha=1;pixelText(c,String(Math.max(1,Math.ceil((Z.OVERLOAD_TIME||8)-(a.time||0)))),x,y-bossTop(e)-14,k>.75?"#ff8f7a":"#d5f4ff",12);
      }
      else if(a.id==="summon"){c.globalAlpha=.6;c.strokeStyle="#c9d1d6";c.lineWidth=2;for(let k=0;k<2;k++){c.beginPath();c.ellipse(x,y-2,40+k*18+Math.sin(time*6)*3,(40+k*18)*.6,time*(k?1:-1),0,Math.PI*2);c.stroke();}}
      else if(a.id==="laser"){
        const L=Z.LASER_LENGTH||520,ox=x,oy=y-20;
        if(a.t<1){c.globalAlpha=pulse;c.strokeStyle="#ff6a5a";c.lineWidth=1;c.setLineDash([6,6]);for(let k=0;k<4;k++){const an=a.angle+k*Math.PI/2;c.beginPath();c.moveTo(ox,oy);c.lineTo(ox+Math.cos(an)*L,oy+Math.sin(an)*L);c.stroke();}c.setLineDash([]);}
        else if(a.t<6){c.lineCap="round";for(let k=0;k<4;k++){const an=a.angle+k*Math.PI/2,ex=ox+Math.cos(an)*L,ey=oy+Math.sin(an)*L;c.globalAlpha=.35;c.strokeStyle="#ff4a3a";c.lineWidth=12;c.beginPath();c.moveTo(ox,oy);c.lineTo(ex,ey);c.stroke();c.globalAlpha=1;c.strokeStyle="#ffd0b0";c.lineWidth=3;c.beginPath();c.moveTo(ox,oy);c.lineTo(ex,ey);c.stroke();}}
        else if(a.wave!==undefined){const r=a.wave;c.globalAlpha=.8;c.strokeStyle="#e6d6ff";c.lineWidth=5;c.beginPath();c.ellipse(x,y-3,r,r*.75,0,0,Math.PI*2);c.stroke();c.globalAlpha=.35;c.strokeStyle="#a77bff";c.lineWidth=14;c.stroke();}
        else warn=false;
      } else warn=false;
    } else warn=false;
    c.restore();
    if(warn)pixelText(c,"!!",x,y-bossTop(e)-Math.abs(Math.sin(time*12))*3,"#ff8f7a",12);
  }
  const BIG_BOSSES = { vampire: 1, golem: 1, cerbero: 1, zak: 1, archmage: 1 };
  const BIG_OUTLINE = { vampire: "#120c14", golem: "#191a1d", cerbero: "#120d10", zak: "#0a090d", archmage: "#0e0a1c" };
  function bigBossBody(c, e, time, walk) {
    if (e.type === "vampire") drawVampire(c, e, time, walk);
    else if (e.type === "golem") drawGolem(c, e, time, walk);
    else if (e.type === "cerbero") drawCerbero(c, e, time, walk);
    else if (e.type === "archmage") drawArchmage(c, e, time, walk);
    else drawZak(c, e, time, walk);
  }
  // Efectos de cada ataque que van fuera del cuerpo, en el momento en que pega el golpe.
  function bigBossFx(c, e, time, x, y) {
    const a = e.act; if (!a) return;
    const t = a.t || 0, aim = Math.atan2(e.aimY || 0, e.aimX === undefined ? 1 : e.aimX);
    if (e.type === "zak") {
      if (a.id === "slash") {
        const ph = t % .7, k = (ph - .45) / .16;
        // El tajo cubre lo mismo que el daño: 105 de alcance y ±30° desde los pies.
        if (k >= 0 && k <= 1) { const from = aim - Math.PI / 6, to = aim + Math.PI / 6, head = from + (to - from) * Math.min(1, k * 2.2), tail = from + (to - from) * Math.max(0, k * 2 - 1); const mid = (head + tail) / 2; c.save();
          for (const f of [.15, .5, .85]) { const an = tail + (head - tail) * f; Px.glow(c, x + Math.cos(an) * 88, y - 14 + Math.sin(an) * 88, 30, "#a040ff", .6 * (1 - k * .5)); }
          c.globalAlpha = 1 - k * .35; crescent(c, x, y - 14, 106, tail, head, 64, "#5a1fb0"); crescent(c, x, y - 14, 104, tail, head, 44, "#a040ff"); crescent(c, x, y - 14, 102, tail, head, 22, "#d98cff", "#fbeaff");
          c.globalAlpha = 1 - k * .6; for (let n = 0; n < 9; n++) { const an = tail + (head - tail) * hash(n, 6), r = 74 + hash(n, 7) * 42 + k * 12, px = x + Math.cos(an) * r, py = y - 14 + Math.sin(an) * r; rect(c, px, py, 1, 3, n % 2 ? "#fbeaff" : "#c95cff"); if (n % 3 === 0) rect(c, px - 1, py + 1, 3, 1, "#fbeaff"); }
          c.restore(); }
      } else if (a.id === "raise" || a.id === "major" || e.pose === "raise") {
        for (let k = 0; k < 12; k++) { const f = (time * .9 + k / 12) % 1, px = x - 36 + hash(k, 3) * 72, py = y - f * 104; c.globalAlpha = 1 - f; rect(c, px, py, 1, 3, k % 2 ? "#c95cff" : "#fbeaff"); if (k % 3 === 0) rect(c, px - 1, py + 1, 3, 1, "#fbeaff"); } c.globalAlpha = 1;
      } else if (a.id === "storm" || a.id === "purple") {
        for (let k = 0; k < 3; k++) { const an = time * 7 + k * 2.1, r = 22 + Math.sin(time * 11 + k) * 8; Px.line(c, x, y - 3, x + Math.cos(an) * r, y - 3 + Math.sin(an) * r * .55, k % 2 ? VIOLET : "#e6d6ff"); }
      } else if (a.id === "rise") {
        // Vuelve a levantarse envuelto en violeta.
        const power = Math.min(1, Math.max(0, (t - .6) / 1.2));
        if (power > 0) { Px.glow(c, x, y - 34, 46, "#a040ff", .55 * power); c.save(); c.globalAlpha = power; c.strokeStyle = "#c95cff"; c.lineWidth = 2; c.beginPath(); const spin = time * 3; c.ellipse(x, y - 4, 40, 15, 0, spin, spin + 2.1); c.stroke(); c.beginPath(); c.ellipse(x, y - 4, 40, 15, 0, spin + Math.PI, spin + Math.PI + 2.1); c.stroke(); c.restore();
          for (let k = 0; k < 14; k++) { const f = (time * 1.1 + k / 14) % 1, px = x - 38 + hash(k, 9) * 76, py = y - f * 84; c.globalAlpha = (1 - f) * power; rect(c, px, py, 1, 3, k % 2 ? "#c95cff" : "#fbeaff"); if (k % 4 === 0) { rect(c, px - 2, py + 1, 5, 1, "#fbeaff"); } } c.globalAlpha = 1; }
      } else if (a.id === "roar") {
        const r = 30 + (t % .45) / .45 * 70; c.save(); c.globalAlpha = 1 - (t % .45) / .45; c.strokeStyle = "#b48cff"; c.lineWidth = 2; c.beginPath(); c.ellipse(x, y - 80, r, r * .7, 0, 0, Math.PI * 2); c.stroke(); c.restore();
      }
    } else if (e.type === "vampire") {
      if (a.id === "swipe" && t >= .42 && t < 1) {
        const second = t >= .7, k = (t - (second ? .7 : .42)) / .18;
        if (k <= 1) { const from = aim + (second ? 1 : -1), to = aim - (second ? 1 : -1) * Math.min(1, k * 1.4); for (let n = 0; n < 3; n++) crescent(c, x + (e.aimX || 0) * 4, y - 18 + (e.aimY || 0) * 4, 44 - n * 7, from, to, 3, n === 1 ? "#ffd0d6" : "#e0506a"); }
      } else if (a.id === "drain" && currentGame && currentGame.player) {
        // Gotas de sangre que van del jugador a la boca del Chupasangre.
        const p = currentGame.player, mx = x, my = y - 34;
        for (let k = 0; k < 7; k++) { const f = (time * 1.6 + k / 7) % 1; rect(c, p.x + (mx - p.x) * f + Math.sin(k * 3 + time * 7) * 2, p.y - 16 + (my - p.y + 16) * f - Math.sin(f * Math.PI) * 8, 2, 2, k % 2 ? "#c43a4a" : "#ff5a6a"); }
      } else if (a.id === "summon") {
        for (let k = 0; k < 5; k++) { const f = (t * 1.5 + k * .2) % 1, bx = x + Math.cos(k * 1.26) * 12 * (1 + f * 2), by = y - 40 - f * 26, flap = Math.floor(time * 14 + k) % 2 ? 2 : -1; c.globalAlpha = 1 - f; Px.line(c, bx - 4, by + flap, bx, by, "#2e2638"); Px.line(c, bx + 4, by + flap, bx, by, "#2e2638"); } c.globalAlpha = 1;
      }
    } else if (e.type === "golem") {
      if (a.id === "quake" && t % 1.15 >= .9) {
        // Grietas y piedras que saltan donde caen los puños.
        const k = ((t % 1.15) - .9) / .25;
        for (const side of [-1, 1]) for (let n = 0; n < 5; n++) {
          const an = (n - 2) * .55 + (side < 0 ? Math.PI : 0), len = 12 + k * 34 + hash(n, side + 5) * 16, ox = x + side * 30;
          Px.line(c, ox, y - 2, ox + Math.cos(an) * len, y - 2 + Math.sin(an) * len * .5, "#17120e", 2);
          const f = k, sx = ox + Math.cos(an) * (6 + f * 30), sy = y - 4 - Math.sin(f * Math.PI) * (16 + n * 4); box(c, sx, sy, 4, 3, "#8a8074");
        }
      } else if (a.id === "throw" && t < .25) {
        for (let n = 0; n < 6; n++) { const f = t / .25, an = n * 1.05; box(c, x + Math.cos(an) * (10 + f * 18), y - 4 - f * 18 + Math.sin(an) * 4, 3, 3, "#7a7064"); }
      }
    } else if (e.type === "cerbero") {
      if (a.id === "bite" && t >= .47 && t < .6) {
        // Babas que saltan con el mordiscón.
        const k = (t - .47) / .13, f = e.dir === "left" ? -1 : 1;
        for (let n = 0; n < 6; n++) rect(c, x + f * (42 + k * (10 + n * 3)), y - 52 + n * 7 + k * 10, 1, 2, "#dfe9ee");
      } else if (a.id === "dig") {
        const f = e.dir === "left" ? 1 : -1;
        for (let n = 0; n < 8; n++) { const k = (time * 1.8 + n / 8) % 1; rect(c, x + f * (6 + k * 34) + hash(n, 2) * 8 - 4, y - 2 - Math.sin(k * Math.PI) * (14 + hash(n, 4) * 12), 3, 2, n % 2 ? "#5a4632" : "#7a6246"); }
      }
    } else if (e.type === "archmage") {
      if (a.id === "nova" && t < .7 || a.id === "summon") {
        const r = 14 + ((t * 2.2) % 1) * 26; c.save(); c.globalAlpha = .7; c.strokeStyle = a.id === "nova" ? "#ffb347" : "#c9d1d6"; c.lineWidth = 1; c.setLineDash([3, 3]); c.beginPath(); c.ellipse(x, y - 30, r, r * .65, time * 2, 0, Math.PI * 2); c.stroke(); c.setLineDash([]); c.restore();
      } else if (a.id === "overload") {
        const charge = Math.min(1, (a.time || 0) / (Z.OVERLOAD_TIME || 8));
        for (let k = 0; k < 10; k++) { const an = k * Math.PI * 2 / 10 + .3, cx = x + Math.cos(an) * (24 + (k % 2) * 8), cy = y - 2 + Math.sin(an) * (13 + (k % 2) * 6), tall = Math.round((3 + (k % 3) * 3) * Math.min(1, charge * 1.4 + .1) + charge * 6); if (cy < y) { poly(c, [[cx - 3, cy], [cx, cy - tall], [cx + 3, cy]], "#5aa8d0"); poly(c, [[cx - 2, cy], [cx - 1, cy - tall + 1], [cx + 1, cy]], "#d5f4ff"); } }
        // Copos que suben hacia el orbe, cada vez más.
        for (let k = 0; k < 6 + Math.round(charge * 14); k++) { const f = (time * (.5 + charge) + k / 20) % 1, sx = x - 44 + hash(k, 13) * 88, sy = y - hash(k, 17) * 20, px = sx + (x + 14 - sx) * f, py = sy + (y - 74 - sy) * f; c.globalAlpha = .4 + f * .6; rect(c, px - 1, py, 3, 1, "#d5f4ff"); rect(c, px, py - 1, 1, 3, "#d5f4ff"); } c.globalAlpha = 1;
        for (let k = 0; k < 10; k++) { const an = k * Math.PI * 2 / 10 + .3, cx = x + Math.cos(an) * (24 + (k % 2) * 8), cy = y - 2 + Math.sin(an) * (13 + (k % 2) * 6), tall = Math.round((3 + (k % 3) * 3) * Math.min(1, charge * 1.4 + .1) + charge * 6); if (cy >= y) { poly(c, [[cx - 3, cy], [cx, cy - tall], [cx + 3, cy]], "#5aa8d0"); poly(c, [[cx - 2, cy], [cx - 1, cy - tall + 1], [cx + 1, cy]], "#d5f4ff"); } }
      } else if (a.id === "heal") {
        for (let k = 0; k < 8; k++) { const f = (time * .7 + k / 8) % 1, px = x - 24 + hash(k, 8) * 48, py = y - f * 60; c.globalAlpha = 1 - f; rect(c, px - 1, py, 3, 1, "#bff5cf"); rect(c, px, py - 1, 1, 3, "#bff5cf"); } c.globalAlpha = 1;
      }
    }
  }
  function drawBigBoss(c, e, time) {
    const x = Math.round(e.x), y = Math.round(e.y), wave = Math.sin(time * 10 + x);
    const walk = e.moving ? Math.round(wave * 1.5) : 0, bob = e.moving ? (Math.abs(wave) > .7 ? -1 : 0) : Math.sin(time * 2 + x) > .6 ? 1 : 0;
    drawBigTelegraph(c, e, time);
    const body = () => { if (e.dir === "left") c.scale(-1, 1); bigBossBody(c, e, time, walk); };
    if (e.act && e.act.id === "lunge" && e.act.t >= .9) for (let k = 3; k > 0; k--) ghost(c, x - e.aimX * k * 12, y - e.aimY * k * 12, "#7a1f33", .42 - k * .1, body);
    c.save(); c.translate(x, y);
    shadow(c, 0, 0, (e.type === "zak" ? 56 : e.type === "golem" ? 56 : e.type === "cerbero" ? 58 : 30) * (e.lift ? Math.max(.45, 1 - e.lift / 90) : 1), 7);
    // El Rey Mago se desvanece y reaparece al teletransportarse.
    if (e.act && e.act.id === "teleport") { const t = e.act.t; c.globalAlpha *= t < .35 ? Math.max(0, 1 - t / .35) : Math.min(1, (t - .35) / .35); }
    if (e.shield > 0) { c.save(); c.globalAlpha = .28 + Math.sin(time * 8) * .08; c.fillStyle = "#9fd6ff"; c.beginPath(); c.ellipse(0, -38, 42, 50, 0, 0, Math.PI * 2); c.fill(); c.globalAlpha = .7; c.strokeStyle = "#d5efff"; c.lineWidth = 1; c.stroke(); c.restore(); }
    c.translate(e.hitFlash > .08 ? (Math.floor(time * 40) % 2 ? 1 : -1) : 0, -Math.round(e.lift || 0) + bob);
    sprite(c, BIG_OUTLINE[e.type] || "#14121a", e.hitFlash > .05, body);
    c.restore();
    bigBossFx(c, e, time, x, y);
    if (e.act && e.act.id === "rise") pixelText(c, "✦", x + Math.sin(time * 6) * 10, y - bossTop(e) - Math.abs(Math.sin(time * 4)) * 6, e.type === "zak" ? "#e6c8ff" : "#e7d18c", 12);
    if (e.stun > 0) pixelText(c, "♪", x + Math.sin(time * 4) * 7, y - 70, "#e2c578", 11);
    else if (e.alert && !e.act && !e.yielding) pixelText(c, "☠", x, y - bossTop(e), "#edb977", 10);
  }
  const bossTop = e => e.type === "zak" ? 130 : e.type === "golem" ? 90 : e.type === "archmage" ? 78 : e.type === "vampire" ? 56 : 84;
  // Objetos de la dimensión de Zak: carpas, fogatas, la puerta del trono y la fuente del Santuario.
  function drawDimensionObject(c, o, time) {
    const x=o.x,y=o.y,w=o.w,h=o.h;
    if(o.type==="tent"){
      const pal=[["#4b3fa0","#2f2766","#8a6ad0"],["#7a2a4a","#4a1830","#c25a7a"],["#2f6a6a","#1a4040","#5aa0a0"]][o.variant||0];
      shadow(c,x+w/2,y+h,w+10,7);
      poly(c,[[x-3,y+h],[x+w/2,y-24],[x+w+3,y+h]],pal[1]);poly(c,[[x+1,y+h],[x+w/2,y-20],[x+w-1,y+h]],pal[0]);
      for(let k=1;k<4;k++){const t=k/4;rect(c,x+w/2-(w/2)*t,y-20+(h+20)*t,w*t,1,pal[2]);}
      poly(c,[[x+w/2-7,y+h],[x+w/2,y+3],[x+w/2+7,y+h]],"#0c0a12");
      rect(c,x+w/2-1,y-29,2,6,"#8a6a4a");rect(c,x+w/2+1,y-29,6,3,"#f2c94c");
      return true;
    }
    if(o.type==="campfire"){
      const cx=x+w/2,cy=y+h/2,f=Math.sin(time*14+x)*1.5;
      Px.glow(c,cx,cy-6,30+Math.round(f),"#ff963c",.5);
      for(let k=0;k<7;k++){const a=k*Math.PI*2/7;rect(c,cx+Math.cos(a)*8-2,cy+Math.sin(a)*4-1,4,3,"#3a3540");}
      rect(c,cx-7,cy+1,14,3,"#4a2e1a");rect(c,cx-5,cy-1,10,2,"#6b4226");
      poly(c,[[cx-6,cy+1],[cx-1,cy-13-f],[cx+6,cy+1]],"#e8501e");poly(c,[[cx-4,cy+1],[cx+1,cy-9+f],[cx+4,cy+1]],"#ff9a3a");poly(c,[[cx-2,cy+1],[cx,cy-5],[cx+2,cy+1]],"#ffe08a");
      for(let k=0;k<3;k++){const t=(time*1.3+k*.33)%1;c.globalAlpha=1-t;rect(c,cx-3+k*3+Math.sin(time*5+k)*2,cy-10-t*18,1,1,"#ffd36a");}
      c.globalAlpha=1;return true;
    }
    if(o.type==="door"){
      // Portón de 70 px apoyado en el piso (base del objeto), con arco gótico y runas.
      const g=currentGame,open=g&&g.player&&g.player.throneKeys>0,pulse=.5+Math.sin(time*4)*.3,b=y+h,t=b-70;
      shadow(c,x+w/2,b,w+20,8);
      rect(c,x-8,t-8,w+16,78,"#0a090d");poly(c,[[x-8,t-8],[x+w/2,t-30],[x+w+8,t-8]],"#0a090d");
      rect(c,x-5,t-5,w+10,75,"#1d1a24");poly(c,[[x-5,t-5],[x+w/2,t-25],[x+w+5,t-5]],"#1d1a24");
      rect(c,x,t,w/2-1,70,"#3a1530");rect(c,x+w/2+1,t,w/2-1,70,"#3a1530");poly(c,[[x,t],[x+w/2,t-20],[x+w,t]],"#3a1530");
      for(let k=1;k<4;k++){rect(c,x+k*w/8,t,1,70,"#2a0f22");rect(c,x+w/2+k*w/8,t,1,70,"#2a0f22");}
      for(const yy of [t+12,t+34,t+56])rect(c,x,yy,w,3,"#5a5560");
      c.globalAlpha=pulse;for(let k=0;k<5;k++)rect(c,x+8+k*(w-16)/4,t-12+Math.abs(k-2)*3,3,3,"#a77bff");c.globalAlpha=1;
      rect(c,x+w/2-5,t+32,10,12,open?"#ffe08a":"#c9a24c");rect(c,x+w/2-1,t+35,2,5,"#120f18");
      if(open){c.globalAlpha=pulse*.6;c.fillStyle="#ffe08a";c.beginPath();c.arc(x+w/2,t+38,12,0,Math.PI*2);c.fill();c.globalAlpha=1;}
      return true;
    }
    if(o.type==="well"&&o.dark){
      Px.glow(c,x+w/2,y+h-8,36,"#a77bff",.5);
      shadow(c,x+w/2,y+h,w+12,7);outlined(c,x-3,y+h-13,w+6,14,"#2a2236","#0c0b10");
      rect(c,x,y+h-11,w,7,"#5a3a8a");rect(c,x+2+((time*8)%(w-6)),y+h-10,3,1,"#e6d6ff");
      rect(c,x+w/2-3,y-14,6,h,"#1d1a24");rect(c,x+w/2-9,y-17,18,4,"#2a2236");rect(c,x+w/2-7,y-16,14,2,"#7b4fc0");
      for(let k=0;k<4;k++){const t=(time*1.5+k*.25)%1;rect(c,x+w/2-8+(k%2)*15,y-14+t*18,1,3,"#c9a6ff");}
      return true;
    }
    return false;
  }
  function drawCemeteryObject(c, o, time) {
    const x=o.x,y=o.y,w=o.w,h=o.h,v=o.variant||0;
    if(o.type==="wall"){
      const vertical=v===1;
      rect(c,x-1,y-15,w+2,h+16,"#24232a");rect(c,x,y-14,w,h+13,"#4d4a55");
      for(let yy=y-14;yy<y+h-2;yy+=8)for(let xx=x+((yy-y)%16?0:6);xx<x+w;xx+=12)rect(c,xx,yy,Math.min(11,x+w-xx),7,hash(xx,yy)>.5?"#5d5966":"#55525e");
      rect(c,x,y-15,w,3,"#7a7684");if(!vertical)for(let xx=x;xx<x+w;xx+=26)rect(c,xx+3,y-19,4,4,"#6a6674");
      return true;
    }
    if(o.type==="grave"){
      shadow(c,x+w/2,y+h,w+6,4);
      if(v===0){rect(c,x+5,y-14,4,22,"#6d6a73");rect(c,x,y-9,14,4,"#6d6a73");rect(c,x+6,y-14,2,20,"#8e8a95");}
      else if(v===1){rect(c,x,y-12,w,h+12,"#4c4a52");rect(c,x+1,y-14,w-2,3,"#4c4a52");rect(c,x+1,y-12,w-2,h+10,"#77737f");rect(c,x+3,y-8,w-6,1,"#55525c");rect(c,x+3,y-5,w-6,1,"#55525c");}
      else if(v===2){rect(c,x-2,y+2,w+4,h-2,"#3e3c44");rect(c,x-1,y+3,w+2,h-4,"#5c5964");rect(c,x+3,y-8,w-6,11,"#6d6a73");rect(c,x+4,y-7,w-8,2,"#8e8a95");}
      else{rect(c,x,y-6,w,h+6,"#4c4a52");rect(c,x+1,y-5,w-4,h+4,"#77737f");rect(c,x+w-4,y-8,4,3,"#4c4a52");}
      if(hash(x,y)>.6)rect(c,x+2,y+h-1,3,2,"#6f7a4a");
      return true;
    }
    if(o.type==="deadtree"){
      shadow(c,x+w/2+3,y+h,30,6);
      rect(c,x+5,y-30,6,30+h,"#2e2620");rect(c,x+6,y-28,3,26+h,"#4a3d32");
      const b=[[x+8,y-24,x-6,y-38],[x+8,y-18,x+24,y-30],[x+8,y-30,x+12,y-46],[x+4,y-36,x-2,y-48]];
      c.strokeStyle="#2e2620";c.lineWidth=2;for(const [a1,b1,a2,b2] of b){c.beginPath();c.moveTo(a1,b1);c.lineTo(a2,b2);c.stroke();}
      if(v===1){rect(c,x+18,y-31,3,2,"#1b1a1f");rect(c,x+19,y-33,1,2,"#1b1a1f");}
      return true;
    }
    if(o.type==="altar"){
      const placed=currentGame&&currentGame.player&&currentGame.player.altar||{};
      shadow(c,x+w/2,y+h,w+16,8);
      rect(c,x-4,y+h-10,w+8,10,"#25232b");rect(c,x-2,y+h-9,w+4,3,"#4a4654");
      rect(c,x,y-14,w,h+6,"#2e2b36");rect(c,x+2,y-12,w-4,h+2,"#4d4858");rect(c,x,y-18,w,6,"#635d70");rect(c,x+2,y-18,w-4,1,"#8a84a0");
      const glow=.5+Math.sin(time*2)*.3;
      ["fang","ring","claw","elemental","eye"].forEach((k,i)=>{const sx=x+6+i*12,sy=y-10;rect(c,sx,sy,8,8,"#1c1a22");
        if(placed[k]){c.globalAlpha=glow;rect(c,sx-1,sy-1,10,10,"#b78cff");c.globalAlpha=1;rect(c,sx+2,sy+2,4,4,["#9ad16a","#f2c94c","#c43a4a","#7fe6f2","#e9e3ea"][i]);}});
      for(let k=0;k<4;k++)rect(c,x+6+k*15,y+4,6,1,"#8a6ad0");
      return true;
    }
    if(o.type==="portal"){
      const g=currentGame,open=o.kind==="altar"?g&&g.player&&g.player.portal:false;
      if(!open)return true;
      // En la escena del altar el portal aparece recién después de la explosión y crece con rebote.
      const s=g.cutscene&&g.cutscene.id==="altar"?g.cutscene:null,start=(Z.ALTAR_SCENE||{}).open||0;
      if(s&&s.t<start)return true;
      const k=s?Math.min(1,(s.t-start)/1.2):1,grow=k<1?1+2.7*Math.pow(k-1,3)+1.7*Math.pow(k-1,2):1;
      // Con Cerbero vivo se ve rojo y apagado: no deja pasar. Al cruzarlo se agranda y gira cada vez más rápido.
      const cross=g.cutscene&&g.cutscene.id==="portal"?Math.min(1,g.cutscene.t/Z.PORTAL_SCENE.travel):0,cx=Math.round(x+w/2),cy=Math.round(y+h/2);
      c.save();c.translate(cx,cy);if(cross){const size=1+cross*cross*.7;c.translate(0,-14);c.scale(size,size);c.translate(0,14);}Px.scale=grow;
      if(g.cerberoGuards())drawPortal(c,0,0,time*.2,"#8a2a3a","#d0606a","#2a0a14");else drawPortal(c,0,0,time*(s?1+(1-k)*3:1+cross*5),"#a77bff");
      Px.scale=1;c.restore();return true;
    }
    if(o.type==="pillar"){
      shadow(c,x+w/2,y+h,w+10,6);
      rect(c,x-2,y+h-6,w+4,6,"#0e0d12");rect(c,x,y-56,w,h+50,"#16141c");rect(c,x+2,y-54,4,h+46,"#25222d");rect(c,x+w-4,y-54,2,h+46,"#0b0a0e");
      rect(c,x-3,y-62,w+6,7,"#0e0d12");poly(c,[[x-3,y-62],[x+w/2,y-74],[x+w+3,y-62]],"#1c1a24");
      const f=Math.sin(time*12+x)>0?1:0;rect(c,x+w/2-3,y-82-f,6,8,"#6b3fb0");rect(c,x+w/2-2,y-84-f,4,5,"#c9a6ff");
      return true;
    }
    if(o.type==="zakthrone"){
      shadow(c,x+w/2,y+h,w+24,10);
      rect(c,x-10,y+h-10,w+20,10,"#0c0b10");rect(c,x-8,y+h-12,w+16,3,"#2a2733");
      rect(c,x+6,y-60,w-12,h+52,"#100e15");rect(c,x+10,y-56,w-20,h+44,"#3a1530");rect(c,x+14,y-52,w-28,h+36,"#4a1838");
      for(let k=0;k<5;k++){const px=x+6+k*(w-12)/4;poly(c,[[px-4,y-60],[px,y-78-(k%2)*10],[px+4,y-60]],"#1c1a24");}
      rect(c,x-2,y-8,12,h+2,"#16141c");rect(c,x+w-10,y-8,12,h+2,"#16141c");rect(c,x-2,y-10,12,3,"#5a3a8a");rect(c,x+w-10,y-10,12,3,"#5a3a8a");
      rect(c,x+w/2-4,y-48,8,8,Math.sin(time*2)>0?"#c9a6ff":"#8a5ad0");
      return true;
    }
    return false;
  }
  function drawPortal(c,x,y,time,color,light="#e6d6ff",core="#3a1a6a") {
    c.save();
    for(let k=0;k<4;k++){c.globalAlpha=.25+k*.15;c.strokeStyle=k%2?color:light;c.lineWidth=2;c.beginPath();c.ellipse(x,y-14,16-k*3,24-k*4,0,time*(k%2?2:-2),time*(k%2?2:-2)+Math.PI*1.6);c.stroke();}
    c.globalAlpha=.5+Math.sin(time*5)*.15;c.fillStyle=core;c.beginPath();c.ellipse(x,y-14,10,17,0,0,Math.PI*2);c.fill();
    for(let k=0;k<6;k++){const a=time*2+k,r=20+Math.sin(time*3+k)*4;c.globalAlpha=.7;rect(c,x+Math.cos(a)*r,y-14+Math.sin(a)*r*1.3,2,2,light);}
    c.restore();
  }
  const SMALL_OUTLINE={thief:"#191922",skeleton:"#26251f",archer:"#26251f",mage:"#120e24",armor:"#1a1d21",bat:"#1a1522",spider:"#150f0d",worm:"#2e1a14",dog:"#2e241a",snake:"#17261c",rat:"#22232a"};
  const SHARD={thief:"#555165",dog:"#ac9470",snake:"#789955",rat:"#7b7c82",bat:"#5b4d6b",spider:"#7a4e7e",worm:"#b87a6a",skeleton:"#efe9d6",archer:"#efe9d6",mage:"#6a5cc0",armor:"#8a929c",capo:"#6d3b45",yarara:"#8d6bb0",vampire:"#8c2232",golem:"#8a8f96",cerbero:"#55434d",archmage:"#c9a6ff",zak:"#a77bff"};
  function enemyBody(c,e,time,walk,x) {
    if(e.type==="skeleton"||e.type==="archer"){bones(c,e,time,walk);}
    else if(e.type==="mage"){
      const cast=e.act&&e.act.id==="cast",k=cast?Math.min(1,e.act.t/2):0;
      rect(c,-5,-3,4,3+walk,"#1d1830");rect(c,1,-3,4,3-walk,"#1d1830");
      poly(c,[[-7,-18],[7,-18],[9,-1],[-9,-1]],"#221a44");poly(c,[[-6,-17],[6,-17],[8,-2],[-8,-2]],"#4b3fa0");
      rect(c,-1,-17,2,15,"#c9a6ff");rect(c,-8,-3,16,2,"#221a44");
      rect(c,-9,-16,3,8,"#3b318a");rect(c,6,-16-(cast?4:0),3,8,"#3b318a");rect(c,-9,-9,3,2,"#c9a27e");rect(c,6,-9-(cast?4:0),3,2,"#c9a27e");
      rect(c,-4,-24,8,7,"#c9a27e");rect(c,-4,-19,8,4,"#d8d2c4");rect(c,-2,-22,1,1,"#1d1a17");rect(c,2,-22,1,1,"#1d1a17");
      poly(c,[[-8,-23],[8,-23],[3,-37],[-1,-35]],"#221a44");poly(c,[[-6,-24],[6,-24],[2,-35]],"#4b3fa0");rect(c,-8,-25,16,2,"#221a44");rect(c,0,-31,2,2,"#f2c94c");
      rect(c,9,-27-(cast?4:0),2,27,"#6b4a2a");
      const orb=cast?"#ffb347":"#a77bff",oy=-31-(cast?4:0);
      if(cast&&Px.mode!=="outline")Px.glow(c,10,oy+2,4+k*9,"#ff7a2a",.5+k*.4);
      rect(c,8,oy,4,4,orb);rect(c,9,oy+1,1,1,"#fff6d0");
    } else if(e.type==="armor"){
      Px.scale*=1.25;const spin=e.act&&e.act.id==="spin",raised=spin&&e.act.t<1.1;
      rect(c,-6,-8,5,8+walk,"#4a5058");rect(c,1,-8,5,8-walk,"#4a5058");rect(c,-7,-1+walk,6,2,"#2a2e33");rect(c,1,-1-walk,6,2,"#2a2e33");
      rect(c,-9,-22,18,15,"#2e3238");rect(c,-8,-21,16,13,"#8a929c");rect(c,-6,-20,4,10,"#b7bec7");rect(c,-8,-10,16,2,"#4a3a2a");
      rect(c,-12,-23,5,6,"#5d636b");rect(c,7,-23,5,6,"#5d636b");rect(c,-11,-22,3,2,"#a4acb6");rect(c,8,-22,3,2,"#a4acb6");
      rect(c,-11,-17,3,7,"#6d747d");rect(c,8,-17,3,7,"#6d747d");
      rect(c,-5,-31,10,9,"#2e3238");rect(c,-4,-30,8,8,"#9aa2ac");rect(c,-3,-27,6,1,e.alert?"#ff6a3a":"#3a2a20");rect(c,-1,-35,2,4,"#7a2030");
      if(raised){rect(c,9,-44,3,24,"#c9d1d6");rect(c,10,-45,1,22,"#eef2f3");rect(c,6,-21,9,2,"#6b4a2a");}
      else if(!spin){rect(c,10,-26,3,22,"#c9d1d6");rect(c,11,-27,1,20,"#eef2f3");rect(c,7,-6,9,2,"#6b4a2a");}
    }
    else if(e.type==="bat"){
      // Tres cuadros de aleteo: arriba, medio y abajo.
      const wingFrame=Math.floor((time*14+x*.1)%4),hover=-12+Math.round(Math.sin(time*4+x)*2)+(wingFrame===1?-1:wingFrame===3?1:0);c.translate(0,hover);
      const wing=wingFrame===0?[[-3,-3],[-13,-10],[-10,-4],[-14,-1],[-4,1]]:wingFrame===2?[[-3,-2],[-12,3],[-9,2],[-11,7],[-4,2]]:[[-3,-3],[-14,-3],[-11,-1],[-14,2],[-4,1]];
      poly(c,wing,"#4a3e58");poly(c,wing.map(([a,b])=>[-a,b]),"#4a3e58");
      rect(c,-4,-5,8,7,"#2e2638");rect(c,-3,-4,6,5,"#5b4d6b");rect(c,-3,-7,2,3,"#2e2638");rect(c,1,-7,2,3,"#2e2638");
      eye(c,-2,-3,1,1,e.alert?"#ff6a5a":"#d8c27a");eye(c,1,-3,1,1,e.alert?"#ff6a5a":"#d8c27a");rect(c,-1,0,2,1,"#e9e2d0");
    } else if(e.type==="spider"){
      const skitter=Math.round(Math.sin(time*(e.alert?22:9)+x)*1);
      for(let k=0;k<4;k++){const lx=-6+k*4,swing=(k%2?skitter:-skitter);rect(c,lx-3,-6+swing,2,6,"#241c1a");rect(c,lx+1,-6-swing,2,6,"#241c1a");rect(c,lx-4,-1+swing,2,2,"#241c1a");rect(c,lx+2,-1-swing,2,2,"#241c1a");}
      rect(c,-9,-10,11,8,"#2e2420");rect(c,-8,-9,9,6,"#4a3b34");rect(c,-6,-8,4,2,"#7a4e7e");rect(c,-5,-6,2,1,"#9a6a9e");
      rect(c,2,-8,7,6,"#3b2f2a");rect(c,3,-7,5,4,"#5a4a42");
      eye(c,6,-7,1,1,e.alert?"#ff6a4a":"#e0b050");eye(c,8,-6,1,1,e.alert?"#ff6a4a":"#e0b050");rect(c,8,-3,2,2,"#d9d2c0");
    } else if(e.type==="worm"){
      if(!e.alert){
        poly(c,[[-12,0],[-8,-5],[0,-7],[8,-5],[12,0]],"#4a3a2e");poly(c,[[-9,-1],[-6,-4],[0,-5],[6,-4],[9,-1]],"#6e5643");
        rect(c,-5,-4,2,1,"#8a725c");rect(c,3,-3,2,1,"#8a725c");rect(c,-1,-6,2,2,"#3a2c22");
        if(moonEyes){eye(c,-3,-4,1,1);eye(c,2,-4,1,1);}
      } else {
        const sway=Math.round(Math.sin(time*5+x)*2),gape=Math.sin(time*7+x)>.3?1:0;
        poly(c,[[-13,0],[-9,-4],[9,-4],[13,0]],"#4a3a2e");
        rect(c,-7,-7,14,6,"#7a4a40");rect(c,-6,-7,12,5,"#a86c5e");
        rect(c,-6+sway/2,-14,12,7,"#7a4a40");rect(c,-5+sway/2,-14,10,6,"#b87a6a");
        rect(c,-6+sway,-22,12,8,"#7a4a40");rect(c,-5+sway,-22,10,7,"#c88878");
        rect(c,-6+sway,-24,12,3,"#9a5e52");rect(c,-3+sway,-21,6,4+gape,"#4a1e1e");
        rect(c,-3+sway,-21,1,2,"#efe2c8");rect(c,2+sway,-21,1,2,"#efe2c8");rect(c,0+sway,-18+gape,1,1,"#efe2c8");
        rect(c,-5,-10,10,1,"#8a564a");rect(c,-5+sway/2,-17,10,1,"#9a6458");
        if(moonEyes){eye(c,-5+sway,-23,2,1);eye(c,3+sway,-23,2,1);}
      }
    } else if(e.type==="thief"){
      rect(c,-5,-6,4,6+walk,"#3b3b4d");rect(c,1,-6,4,6-walk,"#3b3b4d");
      rect(c,-6,-1+walk,6,2,"#272c32");rect(c,1,-1-walk,6,2,"#272c32");
      rect(c,-6,-16,12,10,"#555165");
      rect(c,-4,-15,3,8,"#666273");rect(c,-6,-8,12,2,"#7d6254");
      rect(c,-9,-14-walk,3,7,"#39394a");rect(c,7,-14+walk,3,7,"#39394a");
      rect(c,-9,-8-walk,3,3,"#b48768");rect(c,7,-8+walk,3,3,"#b48768");
      rect(c,9,-15+walk,2,9,"#b8c7bd");rect(c,10,-16+walk,1,7,"#e0ded0");
      rect(c,7,-8+walk,6,1,"#9e8260");
      rect(c,-6,-24,12,9,"#2c2f3b");rect(c,-4,-25,8,2,"#393a49");
      rect(c,-4,-21,8,5,"#ba8c65");rect(c,-5,-18,10,4,"#965258");
      eye(c,-3,-20,2,1,"#21282c");eye(c,2,-20,2,1,"#21282c");
      rect(c,-5,-24,10,3,"#4d485c");rect(c,4,-22,2,5,"#4d485c");
    } else if(e.type==="dog"){
      // Galope: las patas de adelante y de atrás se alternan; la cola se menea.
      const gallop=e.moving===false?0:Math.round(Math.sin(time*(e.alert?18:9)+x)*2),wag=Math.round(Math.sin(time*(e.alert?20:8)+x));
      rect(c,-11,-9,15,7,"#7b6550");rect(c,-10,-10,13,5,"#ac9470");
      rect(c,-8,-9,8,2,"#c0aa85");rect(c,-6,-6,7,2,"#806953");
      rect(c,-10+gallop,-3,2,4,"#6f5b45");rect(c,-5-gallop,-3,2,4,"#8d7659");
      rect(c,1-gallop,-4,2,5,"#6f5b45");rect(c,5+gallop,-4,2,5,"#8d7659");
      rect(c,0,-15,9,11,"#927855");rect(c,1,-14,7,8,"#b59c73");
      rect(c,0,-17,3,5,"#614f40");rect(c,6,-17,3,5,"#614f40");
      rect(c,5,-9,7,4,"#bba47d");rect(c,10,-9,3,3,"#373b35");
      eye(c,5,-12,2,2,e.alert?"#db8456":"#373b35");
      rect(c,9,-5,2,e.alert?3:2,"#c58072");
      rect(c,-14,-12+wag,3,6,"#80694e");rect(c,-12,-10,3,3,"#9c825e");
    } else if(e.type==="snake"){
      // Reptar: cada segmento sigue una onda que corre hacia la cola.
      const speed=e.alert?11:5;
      for(let k=0;k<7;k++){const sx=-13+k*3,sy=-3+Math.round(Math.sin(time*speed+x*.1-k*.95)*1.4);rect(c,sx,sy,4,3,k%2?"#789955":"#557947");rect(c,sx,sy,3,1,k%2?"#adc375":"#789955");}
      const hy=Math.round(Math.sin(time*speed+x*.1)*1);
      rect(c,4,-8+hy,5,6,"#557947");rect(c,6,-11+hy,6,5,"#93ae63");rect(c,6,-11+hy,5,1,"#bad27b");eye(c,9,-10+hy,1,1,"#2b331f");
      if(Math.sin(time*7+x)>.2){rect(c,12,-8+hy,2,1,"#c56f68");rect(c,14,-9+hy,1,1,"#c56f68");rect(c,14,-7+hy,1,1,"#c56f68");}
    } else {
      const wiggle=Math.round(Math.sin(time*9+x)*1);
      rect(c,-10,-2+wiggle,6,1,"#ba8a86");rect(c,-13,-3,4,1,"#ba8a86");rect(c,-14,-5-wiggle,2,2,"#ba8a86");
      rect(c,-6,-7,12,7,"#494b53");rect(c,-5,-8,9,6,"#7b7c82");
      rect(c,-4,-7,7,3,"#949196");rect(c,3,-6,6,4,"#a29b9a");
      rect(c,8,-4,2,1,"#d39a94");eye(c,5,-5,1,1,"#252f2a");
      rect(c,1,-9,4,4,"#6a6470");rect(c,2,-8,2,2,"#b78b93");
      rect(c,-4,-1+walk,3,2,"#b08f8b");rect(c,3,-1-walk,3,2,"#b08f8b");
    }
  }
  function drawEnemy(c, e, time) {
    if(e.dead || e.hp <= 0) return;
    moonEyes=e.stats?.bloodMoon===true;
    if(e.type==="capo"||e.type==="yarara") return drawBoss(c,e,time);
    if(BIG_BOSSES[e.type]) return drawBigBoss(c,e,time);
    const x=Math.round(e.x), y=Math.round(e.y);
    const speed=e.alert?14:7, wave=Math.sin(time*speed+x), active=e.moving!==false;
    const walk=active?Math.round(wave):0, bob=active&&Math.abs(wave)>.75&&e.type!=="snake"&&e.type!=="worm"&&e.type!=="bat"?-1:!active&&Math.sin(time*2+x)>.7?1:0;
    // Avisos: el mago carga su conjuro (2 s); la armadura levanta la espada y gira.
    if(e.act&&e.type==="mage"){const k=Math.min(1,e.act.t/2),pulse=.4+Math.abs(Math.sin(time*14))*.4;c.save();c.globalAlpha=pulse*.6;c.strokeStyle="#ff9a3a";c.lineWidth=2;c.beginPath();c.ellipse(x,y-2,15,9,0,0,Math.PI*2);c.stroke();c.globalAlpha=.95;c.strokeStyle="#ffd36a";c.beginPath();c.ellipse(x,y-2,15,9,0,-Math.PI/2,-Math.PI/2+k*Math.PI*2);c.stroke();c.restore();if(k>.6)pixelText(c,"!!",x,y-46,"#ff8f7a",10);}
    if(e.act&&e.type==="armor"){const a=e.act,pulse=.35+Math.abs(Math.sin(time*16))*.4;c.save();
      if(a.t<1.1){c.globalAlpha=pulse*.3;c.fillStyle="#e0574b";c.beginPath();c.ellipse(x,y-3,58,58*.75,0,0,Math.PI*2);c.fill();c.globalAlpha=pulse;c.strokeStyle="#ffb09a";c.lineWidth=2;c.setLineDash([6,5]);c.beginPath();c.ellipse(x,y-3,58,58*.75,0,0,Math.PI*2);c.stroke();c.setLineDash([]);}
      else{const k=(a.t-1.1)/.5;c.globalAlpha=Math.max(0,1-k);c.strokeStyle="#e6eef5";c.lineWidth=4;c.beginPath();c.ellipse(x,y-10,50,36,0,k*Math.PI*4,k*Math.PI*4+Math.PI*1.4);c.stroke();}
      c.restore();if(a.t<1.1)pixelText(c,"!!",x,y-54,"#ff8f7a",10);}
    c.save(); c.translate(x,y);
    shadow(c,0,0,e.type==="thief"?19:e.type==="dog"?23:e.type==="worm"?22:e.type==="spider"?20:14,4);
    const hurt=e.hitFlash||e.hurt||0;
    c.translate(hurt>.08?(Math.floor(time*40)%2?1:-1):0,bob);
    sprite(c,SMALL_OUTLINE[e.type]||"#1b2321",hurt>.05,()=>{if(e.dir==="left")c.scale(-1,1);enemyBody(c,e,time,walk,x);});
    c.restore();
    const top=e.type==="armor"?46:e.type==="mage"?40:e.type==="thief"||e.type==="bat"||e.type==="skeleton"||e.type==="archer"||e.type==="worm"&&e.alert?32:23;
    if(e.alert && !e.stun && !e.charm && !e.latched) pixelText(c,"!",x,y-top-Math.max(0,Math.round(Math.sin(time*6+x))),"#edb977",9);
    if(e.hp<e.maxHp && e.maxHp>0) {
      const by=y-top+3,share=Math.max(0,e.hp/e.maxHp);
      rect(c,x-11,by-1,22,5,"#1b2321");rect(c,x-10,by,20,3,"#3a2a28");rect(c,x-10,by,Math.max(1,20*share),3,share>.5?"#a8c46a":share>.25?"#e0b04e":"#dd6b58");rect(c,x-10,by,Math.max(1,20*share),1,"#ffffff44");
    }
    if(e.charm>0) heart(c,x,y-28-Math.round(Math.abs(Math.sin(time*4))*2), "#efb0aa");
    if(e.stun>0){
      pixelText(c,"♪",x+Math.sin(time*4)*5,y-28,"#e2c578",10);
      pixelText(c,"♫",x-6,y-23,"#d5b8df",9);
    }
  }
  // Vida de fondo: polen y mariposas de día, luciérnagas de noche, polvo en las cuevas y hojas que vuelan.
  function drawAmbient(c,game,ox,oy,W,H,time,night) {
    const zoneOf=(x,y)=>zoneAt(game.world,x,y),span=W+80,tall=H+60,wrap=(v,size)=>((v%size)+size)%size;
    for(let k=0;k<20;k++){
      const wx=ox-40+wrap(hash(k,1)*span*2+time*(2+k%3),span),wy=oy-30+wrap(hash(k,2)*tall*2+time*(k%2?.9:-.8),tall),zone=zoneOf(wx,wy);
      if(isCaveZone(zone)||zone==="altar"){c.globalAlpha=.16+Math.sin(time+k)*.08;rect(c,wx,wy,1,1,"#e4dcc8");}
      else if(zone==="village"||zone==="weeds"){c.globalAlpha=(.25+Math.sin(time+k)*.12)*(1-night);rect(c,wx,wy,k%3?1:2,1,"#f9e9b1");}
    }
    c.globalAlpha=1;
    for(let k=0;k<6;k++){
      const wx=ox-40+wrap(hash(k,21)*span*3+time*(13+k*2),span),wy=oy-30+wrap(hash(k,22)*tall*3+time*(9+k),tall)+Math.sin(time*1.6+k)*5;
      if(zoneOf(wx,wy)==="weeds"||zoneOf(wx,wy)==="village"){const turn=Math.floor(time*4+k)%2;rect(c,wx,wy,turn?3:2,turn?1:2,k%2?"#4f7a43":"#9a8a42");}
    }
    if(night<.45)for(let k=0;k<4;k++){
      const wx=ox-40+wrap(hash(k,31)*span*3+Math.sin(time*.23+k*2)*90+time*(k%2?5:-5),span),wy=oy-30+wrap(hash(k,32)*tall*3+Math.cos(time*.31+k)*50,tall)+Math.sin(time*2.3+k)*6;
      if(zoneOf(wx,wy)!=="village"&&zoneOf(wx,wy)!=="weeds")continue;
      const open=Math.floor(time*9+k*3)%2,color=["#f4dc91","#eabca1","#c49abc","#d7d5ac"][k];
      rect(c,wx,wy,1,3,"#3a3028");
      if(open){rect(c,wx-2,wy,2,2,color);rect(c,wx+1,wy,2,2,color);}else{rect(c,wx-1,wy-1,1,3,color);rect(c,wx+1,wy-1,1,3,color);}
    }
    if(night>.25)for(let k=0;k<14;k++){
      const wx=ox-40+wrap(hash(k,41)*span*3+Math.sin(time*.4+k*1.3)*40,span),wy=oy-30+wrap(hash(k,42)*tall*3+Math.cos(time*.33+k)*30,tall),beat=Math.sin(time*2.2+k*1.9);
      if(beat<.05||(zoneOf(wx,wy)!=="village"&&zoneOf(wx,wy)!=="weeds"))continue;
      c.globalAlpha=Math.min(1,beat*1.6)*Math.min(1,night*2);Px.glow(c,wx,wy,5,"#e8f07a",.7);rect(c,wx,wy,1,1,"#fbffc0");
    }
    c.globalAlpha=1;
  }
  function heart(c,x,y,color) {
    rect(c,x-3,y-2,2,2,color);rect(c,x+1,y-2,2,2,color);
    rect(c,x-4,y,8,2,color);rect(c,x-3,y+2,6,1,color);rect(c,x-2,y+3,4,1,color);rect(c,x-1,y+4,2,1,color);
  }
  // Copa de árbol pintada una vez, píxel a píxel: racimos con luz arriba a la izquierda y tramado.
  const canopyCache = new Map();
  function leafySprite(W, H, blobs, palette, shape) {
    const colors = palette.map(Px.rgb), grid = new Int8Array(W * H).fill(-1);
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
      for (let i = blobs.length - 1; i >= 0; i--) {
        const b = blobs[i], nx = (x + .5 - b[0]) / b[2], ny = (y + .5 - b[1]) / b[3], d = nx * nx + ny * ny, rough = (hash(x >> 1, y >> 1, shape + 31) - .5) * .4;
        if (d >= 1 + rough) continue;
        const lit = .5 - .42 * nx - .62 * ny - Math.max(0, d - .72) * .35 + (hash(x, y, shape + 90) - .5) * .16;
        grid[y * W + x] = Math.max(1, Math.min(colors.length - 1, Math.floor(lit * (colors.length - 1) + Px.bayer(x, y) * .9)));
        break;
      }
    }
    const canvas = Px.layer(W, H), g = canvas.getContext("2d"), image = g.createImageData(W, H);
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
      let v = grid[y * W + x];
      if (v < 0 && ((x && grid[y * W + x - 1] >= 0) || (x < W - 1 && grid[y * W + x + 1] >= 0) || (y && grid[(y - 1) * W + x] >= 0) || (y < H - 1 && grid[(y + 1) * W + x] >= 0))) v = 0;
      if (v < 0) continue;
      const i = (y * W + x) * 4, col = colors[v]; image.data[i] = col[0]; image.data[i + 1] = col[1]; image.data[i + 2] = col[2]; image.data[i + 3] = 255;
    }
    g.putImageData(image, 0, 0);
    return canvas;
  }
  function canopySprite(shape, palette, fruit) {
    const key = shape + "|" + palette.join() + "|" + fruit;
    let canvas = canopyCache.get(key);
    if (canvas) return canvas;
    const W = 78, H = 68, cx = 39, cy = 40, base = [[0, -22, 15, 11], [-13, -14, 13, 10], [13, -13, 13, 10], [-20, -1, 12, 9], [20, 0, 12, 9], [-6, -5, 15, 11], [8, -3, 14, 11], [-12, 9, 14, 8], [10, 10, 15, 8], [0, 4, 13, 9]];
    const blobs = base.map((b, i) => [cx + b[0] + (hash(i, shape, 3) - .5) * 5, cy + b[1] + (hash(i, shape, 8) - .5) * 4, b[2] + (hash(i, shape, 5) - .5) * 3, b[3] + (hash(i, shape, 6) - .5) * 2]);
    canvas = leafySprite(W, H, blobs, palette, shape); const g = canvas.getContext("2d");
    if (fruit) for (let k = 0; k < 7; k++) { const px = cx - 22 + hash(k, shape, 8) * 44, py = cy - 22 + hash(k, shape, 7) * 32; rect(g, px, py, 3, 3, "#a85a38"); rect(g, px, py, 2, 2, "#d9794e"); rect(g, px, py, 1, 1, "#f2b27c"); }
    canopyCache.set(key, canvas); return canvas;
  }
  // Arbusto: el mismo follaje que los árboles, en chico.
  function bush(c, o) {
    const v = o.variant || 0, w = Math.round(o.w), h = Math.round(o.h), W = w + 8, H = h + 14, shape = v % 4, berries = v % 3 === 1, key = "bush" + w + "x" + h + "|" + shape + berries;
    let canvas = canopyCache.get(key);
    if (!canvas) {
      const blobs = [[W * .28, H * .55, W * .27, H * .3], [W * .72, H * .55, W * .27, H * .3], [W * .5, H * .38, W * .32, H * .3], [W * .36, H * .66, W * .28, H * .26], [W * .66, H * .68, W * .28, H * .24]];
      canvas = leafySprite(W, H, blobs, ["#1f3a2a", "#2e5139", "#3f683d", "#5a8246", "#83a053"], shape + 200);
      if (berries) { const g = canvas.getContext("2d"); for (let k = 0; k < 6; k++) { const px = W * .2 + hash(k, shape, 4) * W * .6, py = H * .3 + hash(k, shape, 5) * H * .45; rect(g, px, py, 2, 2, "#b5523f"); rect(g, px, py, 1, 1, "#e8927a"); } }
      canopyCache.set(key, canvas);
    }
    shadow(c, o.x + w / 2, o.y + h, w + 6, 5);
    c.drawImage(canvas, Math.round(o.x) - 4, Math.round(o.y + h - H + 2));
  }
  function pineSprite(shape) {
    const key = "pine" + shape; let canvas = canopyCache.get(key);
    if (canvas) return canvas;
    const W = 66, H = 62, cx = 33, palette = ["#1b352b", "#274a39", "#35603f", "#4a7747", "#6b8c4e"].map(Px.rgb);
    const tiers = [[42, 62, 31], [24, 46, 25], [8, 30, 19], [0, 16, 11]], grid = new Int8Array(W * H).fill(-1);
    tiers.forEach((tier, t) => {
      for (let y = tier[0]; y < tier[1] && y < H; y++) {
        const k = (y - tier[0]) / (tier[1] - tier[0]);
        for (let x = 0; x < W; x++) {
          const halfWidth = tier[2] * k + 1 + (hash(y, t, shape + 3) - .5) * 3.5, nx = (x + .5 - cx) / Math.max(1, halfWidth);
          if (Math.abs(nx) > 1 || (k > .9 && hash(x >> 1, t, shape) > .7)) continue;
          const lit = .55 - nx * .42 - k * .32 + (hash(x, y, shape + 40) - .5) * .16;
          grid[y * W + x] = Math.max(1, Math.min(4, Math.floor(lit * 4 + Px.bayer(x, y) * .9)));
        }
      }
    });
    canvas = Px.layer(W, H); const g = canvas.getContext("2d"), image = g.createImageData(W, H);
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
      let v = grid[y * W + x];
      if (v < 0 && ((x && grid[y * W + x - 1] >= 0) || (x < W - 1 && grid[y * W + x + 1] >= 0) || (y && grid[(y - 1) * W + x] >= 0) || (y < H - 1 && grid[(y + 1) * W + x] >= 0))) v = 0;
      if (v < 0) continue;
      const i = (y * W + x) * 4, col = palette[v]; image.data[i] = col[0]; image.data[i + 1] = col[1]; image.data[i + 2] = col[2]; image.data[i + 3] = 255;
    }
    g.putImageData(image, 0, 0); canopyCache.set(key, canvas); return canvas;
  }
  function tree(c,o,time) {
    const x=Math.round(o.x+o.w/2), base=o.y+o.h, v=o.variant||0;
    if(o.harvested){
      shadow(c,x+2,base-1,22,6);
      rect(c,x-6,base-8,13,8,"#493d30");rect(c,x-5,base-9,11,3,"#c9a873");rect(c,x-3,base-8,7,1,"#a8855a");
      rect(c,x-8,base-2,5,2,"#816342");rect(c,x+4,base-2,6,2,"#816342");
      if(o.regrow<15){rect(c,x+1,base-14,2,6,"#6e9a4e");rect(c,x-1,base-14,2,2,"#8ab35d");}
      return;
    }
    const pine=v%5===4, wind=Math.sin(time*.9+x*.02)+Math.sin(time*2.1+x*.05)*.35;
    shadow(c,x+4,base-1,54,12);
    rect(c,x-4,base-30,9,30,"#3a2f26");rect(c,x-3,base-30,7,30,"#5f4a33");rect(c,x-2,base-30,3,29,"#836444");
    rect(c,x+2,base-22,1,20,"#4c3b2a");rect(c,x-1,base-17,2,1,"#4c3b2a");
    rect(c,x-6,base-4,15,4,"#493a2c");rect(c,x-7,base-2,5,2,"#6d5238");rect(c,x+4,base-2,6,2,"#6d5238");
    const canvas=pine?pineSprite(v%3):canopySprite(v%4===2?2:v%3,v%4===2?["#34391f","#535c39","#707542","#929451","#afb465"]:["#1f3a2a","#2e5139","#456e40","#638749","#8a9f58"],v%6===3);
    const W=canvas.width,H=canvas.height,left=x-Math.floor(W/2),top=base-H-(pine?8:5);
    // La copa se dibuja en tres franjas: arriba se mueve más con el viento que abajo.
    const bands=[[0,Math.floor(H*.38),Math.round(wind*1.1)],[Math.floor(H*.38),Math.floor(H*.72),Math.round(wind*.55)],[Math.floor(H*.72),H,0]];
    for(const [y0,y1,dx] of bands)c.drawImage(canvas,0,y0,W,y1-y0,left+dx,top+y0,W,y1-y0);
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
      const plate=Px.textWidth(o.label,6)+8;outlined(c,Math.round(x+w/2-plate/2),y+9,plate,10,"#665641","#baa171");
      pixelText(c,o.label,x+w/2,y+14,"#ecddb1",6);
    }
  }
  const pondCache = new WeakMap();
  // Distancia normalizada al borde de la laguna: 0 en el centro, 1 en la orilla.
  function pondDistance(o, x, y) {
    const nx = Math.abs((x - o.x - o.w / 2) / (o.w / 2)), ny = Math.abs((y - o.y - o.h / 2) / (o.h / 2));
    return Math.pow(Math.pow(nx, 2.5) + Math.pow(ny, 2.5), 1 / 2.5);
  }
  function pondSprite(o) {
    let canvas = pondCache.get(o); if (canvas) return canvas;
    const pad = 8, W = Math.ceil(o.w) + pad * 2, H = Math.ceil(o.h) + pad * 2, colors = ["#46603f", "#7c8a58", "#b5b07a", "#6aa0a2", "#578f98", "#487d87", "#3c6c79"].map(Px.rgb);
    canvas = Px.layer(W, H); const g = canvas.getContext("2d"), image = g.createImageData(W, H);
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
      const wx = o.x - pad + x, wy = o.y - pad + y, wobble = (Px.noise(wx / 13, wy / 13) - .5) * .09, d = pondDistance(o, wx, wy) + wobble, edge = 1 - d, gap = 7 / Math.min(o.w, o.h) * .5;
      let band = -1;
      if (edge < -gap * 1.1) continue;
      if (edge < -gap * .35) band = 0; else if (edge < gap * .1) band = 1; else if (edge < gap * .6) band = 2;
      else { const depth = (edge - gap * .6) / (1 - gap * .6); band = Math.min(6, 3 + Math.floor(depth * 4.2 + Px.bayer(x, y) * .9)); }
      const i = (y * W + x) * 4, col = colors[band]; image.data[i] = col[0]; image.data[i + 1] = col[1]; image.data[i + 2] = col[2]; image.data[i + 3] = 255;
    }
    g.putImageData(image, 0, 0); pondCache.set(o, canvas); return canvas;
  }
  function pond(c,o,time=0) {
    const x=Math.round(o.x),y=Math.round(o.y),w=o.w,h=o.h,cx=x+w/2,cy=y+h/2;
    c.drawImage(pondSprite(o),x-8,y-8);
    // Ondas: rayitas claras que van y vienen; destellos sueltos.
    for(let k=0;k<30;k++){
      const px=x+12+hash(k,4)*Math.max(1,w-34),py=y+12+hash(k,2)*Math.max(1,h-25),phase=Math.sin(time*.8+k*1.7),len=Math.round(4+hash(k,3)*9+phase*3);
      const sx=Math.round(px+Math.sin(time*.5+k)*3);
      if(pondDistance(o,sx,py)<.86&&pondDistance(o,sx+len,py)<.86)rect(c,sx,py,len,1,k%3?"#67a0a6":"#a2c9c2");
    }
    for(let k=0;k<7;k++){
      const t=(time*.55+hash(k,6))%1,px=cx+(hash(k,12)-.5)*w*.7,py=cy+(hash(k,13)-.5)*h*.6;
      if(t<.16&&pondDistance(o,px,py)<.8){const big=t>.05&&t<.11;rect(c,px,py,1,1,"#ffffff");if(big){rect(c,px-1,py,3,1,"#e4f4ee");rect(c,px,py-1,1,3,"#e4f4ee");}}
    }
    for(let k=0;k<5;k++){
      const px=x+w*.25+hash(k,1)*w*.5,py=y+h*.22+hash(k,8)*h*.56,bob=Math.round(Math.sin(time*.9+k*2));
      rect(c,px,py+bob,9,4,"#3a6646");rect(c,px+1,py-1+bob,7,1,"#75a568");rect(c,px+1,py+bob,6,2,"#507f55");rect(c,px+4,py+2+bob,2,2,P.water);
      if(k%2===0)flower(c,px+3,py+bob,0);
    }
    // Juncos a lo largo de la orilla de abajo.
    for(let k=0;k<13;k++){
      const t=hash(k,9)*2-1,px=cx+t*w*.46,py=cy+Math.pow(Math.max(0,1-Math.pow(Math.abs(t*.92),2.5)),1/2.5)*h*.5+hash(k,15)*3-1;
      tuft(c,px,py,"#4d6a3f",true,Math.sin(time*1.2+k)>.3?1:0);
      if(k%3===0){rect(c,px,py-11,2,5,"#8c7347");rect(c,px,py-11,1,1,"#a98d5c");}
    }
  }
  const ORE_COLORS={
    stone:{base:"#6b6e72",dark:"#3f4247",light:"#9fa2a4"},
    coal:{base:"#5e6064",dark:"#36383d",light:"#8b8d90",spot:"#141518"},
    iron:{base:"#7e8792",dark:"#4b525c",light:"#cfd6de",spot:"#b0703f"},
    gold:{base:"#b8902c",dark:"#6d5218",light:"#ffe27a",spot:"#fff3b0"},
    diamond:{base:"#4f5560",dark:"#2c3038",light:"#7c8390",spot:"#7fe6f2"}
  };
  function ore(c,o,time) {
    const x=o.x,y=o.y,w=o.w,h=o.h,col=ORE_COLORS[o.ore]||ORE_COLORS.stone;
    if(o.harvested){
      for(let k=0;k<7;k++){const px=x+2+hash(k,o.x,4)*(w-6),py=y+h-6+hash(k,o.y,5)*5;rect(c,px,py,3+k%2,2,k%3?col.dark:col.base);}
      if(col.spot)rect(c,x+w/2,y+h-4,2,1,col.spot);return;
    }
    shadow(c,x+w/2+2,y+h,w+8,6);
    poly(c,[[x-3,y+h],[x-2,y+4],[x+4,y-9],[x+w*.45,y-15],[x+w-3,y-10],[x+w+3,y+2],[x+w+2,y+h]],col.dark);
    poly(c,[[x-1,y+h-2],[x,y+4],[x+5,y-7],[x+w*.45,y-12],[x+w-4,y-8],[x+w+1,y+3],[x+w,y+h-2]],col.base);
    poly(c,[[x+2,y+2],[x+6,y-6],[x+w*.45,y-10],[x+w*.35,y-2],[x+3,y+8]],col.light);
    rect(c,x+w*.6,y-2,2,h-2,col.dark);rect(c,x+2,y+h-3,w-3,2,col.dark);
    if(col.spot)for(let k=0;k<6;k++){
      const px=x+3+hash(k,o.x,9)*(w-6),py=y-7+hash(k,o.y,3)*(h+2);
      if(o.ore==="diamond"){poly(c,[[px,py-3],[px+3,py],[px,py+3],[px-3,py]],col.spot);rect(c,px-1,py-1,1,1,"#e8ffff");}
      else{rect(c,px,py,3,2,col.spot);if(o.ore==="gold")rect(c,px,py,1,1,"#fffbe0");}
    }
    if((o.ore==="gold"||o.ore==="diamond")&&Math.sin(time*3+x)>.85){const px=x+w*.3+hash(1,o.x)*w*.4,py=y-6;rect(c,px,py-2,1,5,"#ffffff");rect(c,px-2,py,5,1,"#ffffff");}
  }
  function stairs(c,o,time) {
    const x=o.x,y=o.y,w=o.w,h=o.h;
    rect(c,x-3,y-3,w+6,h+6,"#23262b");
    if(o.dir==="down"){
      rect(c,x,y,w,h,"#07090b");
      ["#6a6d73","#53565c","#3d4045","#28292d"].forEach((col,k)=>rect(c,x+3+k*2,y+2+k*5,w-6-k*4,4,col));
      rect(c,x-4,y-14,4,h+14,"#6b4f33");rect(c,x+w,y-14,4,h+14,"#6b4f33");rect(c,x-5,y-16,w+10,4,"#8a6a44");
      rect(c,x+w/2-1,y-15,2,2,"#f2c35a");
    } else {
      rect(c,x,y,w,h,"#3a3d43");
      ["#9a9da3","#83868c","#6d7076","#575a60"].forEach((col,k)=>rect(c,x+2+k,y+h-6-k*5,w-4-k*2,5,col));
      for(let k=0;k<4;k++){c.globalAlpha=.09*(4-k);rect(c,x,y-12+k*Math.ceil((h+12)/4),w,Math.ceil((h+12)/4),"#ffe2a0");}c.globalAlpha=1;
    }
  }
  function forge(c,o,time) {
    const x=o.x,y=o.y,w=o.w,h=o.h,flicker=Math.sin(time*11)>0?1:0;
    shadow(c,x+w/2,y+h,w+10,6);
    rect(c,x+2,y-4,4,h+4,"#4f3822");rect(c,x+w-6,y-4,4,h+4,"#4f3822");
    rect(c,x-1,y-11,w+2,8,"#4f3822");rect(c,x,y-11,w,6,"#9b7046");rect(c,x,y-11,w,1,"#c39463");
    rect(c,x+w-17,y-19,13,5,"#3d4247");rect(c,x+w-16,y-19,11,2,"#8d949a");rect(c,x+w-21,y-18,5,2,"#3d4247");rect(c,x+w-13,y-14,5,3,"#3d4247");
    rect(c,x+4,y-19,9,8,"#2f2f33");rect(c,x+5,y-17,7,5,"#7a2f1a");rect(c,x+6,y-21-flicker,5,5,"#f2a541");rect(c,x+7,y-22-flicker,3,3,"#ffd36b");
    rect(c,x+15,y-13,8,2,"#8d949a");rect(c,x+14,y-13,2,2,"#6b4f33");
  }
  function drawObject(c,o,time) {
    const x=o.x,y=o.y,w=o.w||16,h=o.h||12,v=o.variant||0;
    if(o.type==="ore")return ore(c,o,time);
    if(o.type==="stairs")return stairs(c,o,time);
    if(o.type==="forge")return forge(c,o,time);
    if(drawCemeteryObject(c,o,time))return;
    if(drawDimensionObject(c,o,time))return;
    if(o.type==="tree")return tree(c,o,time);
    if(o.type==="house")return house(c,o,time);
    if(o.type==="pond")return pond(c,o,time);
    if(o.type==="flower"){for(let k=0;k<5;k++)flower(c,x+hash(k,v)*w,y+hash(k,v,3)*h,k+v);return;}
    if(o.type==="grass"){for(let k=0;k<5;k++)tuft(c,x+hash(k,v)*w,y+hash(k,v,3)*h,"#517746",v%2===0,0);return;}
    if(o.type==="cliff"){
      const vertical=v===1,dk=o.dark;
      rect(c,x-3,y-27,w+6,h+29,dk?"#060509":"#282f35");
      rect(c,x,y-24,w,h+20,dk?"#121018":"#42464e");
      for(let yy=y-24;yy<y+h-3;yy+=12)for(let xx=x;xx<x+w;xx+=21){
        const ww=Math.min(20,x+w-xx),hh=Math.min(11,y+h-3-yy),shade=hash(xx,yy)>.5?(dk?"#1a1722":"#51545c"):(dk?"#15131c":"#484c54");
        rect(c,xx,yy,ww,hh,shade);rect(c,xx+1,yy+1,Math.max(1,ww-3),2,dk?"#2a2633":"#62646a");
      }
      for(let xx=x;xx<x+w;xx+=14){const rise=3+Math.floor(hash(xx,y)*7);rect(c,xx,y-26-rise,Math.min(14,x+w-xx),rise+7,dk?"#1c1a24":"#565960");rect(c,xx+2,y-26-rise,Math.min(10,x+w-xx),2,dk?"#3a2a52":"#747574");}
      rect(c,x,y+h-3,w,4,dk?"#050407":"#242e30");
      if(!vertical&&!dk)for(let k=0;k<w/28;k++)rect(c,x+k*28+3,y+h-1,9,3,"#45583d");
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
      const deep=v>=10;
      poly(c,[[x+2,y+h-5],[x+4,y+6],[x+w*.32,y+2],[x+w*.7,y+3],[x+w-3,y+h*.45],[x+w-6,y+h-3]],deep?(v%2?"#6e5a52":"#64524b"):v%2?"#8d9486":"#838c89");
      poly(c,[[x+4,y+6],[x+w*.3,y+2],[x+w*.65,y+3],[x+w*.46,y+8],[x+4,y+h-7]],deep?"#87736a":"#a3a99a");
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
      if(label&&Px.textWidth(label,6)<=w+5) pixelText(c,label,x+w/2,y-10,"#f1deb0",6);
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
      bush(c,o);
    } else if(o.type==="stall"){
      shadow(c,x+w/2+3,y+h+2,w+14,6);
      rect(c,x+1,y-24,3,h+24,"#5d4630");rect(c,x+w-4,y-24,3,h+24,"#5d4630");
      outlined(c,x-2,y-4,w+4,h+4,"#a07a4b","#4f3b28");rect(c,x,y-3,w,2,"#c49a63");
      for(let k=0;k<4;k++){const fx=x+3+k*8;rect(c,fx,y-8,6,5,["#d36c4f","#e2b549","#7aa253","#c9573f"][k]);rect(c,fx+1,y-9,3,1,"#f6e3a6");}
      const seg=Math.ceil((w+10)/6);
      for(let k=0;k<6;k++)rect(c,x-5+k*seg,y-31,seg,9,k%2?"#e9dfc2":"#b84d42");
      for(let k=0;k<6;k++)rect(c,x-5+k*seg,y-22,seg,3,k%2?"#cfc4a5":"#8f3a33");
      rect(c,x-6,y-33,w+12,2,"#6b4a32");
      outlined(c,x+w/2-19,y-46,38,12,"#e7cf8e","#5c4630");Px.text(c,"ALMACÉN",x+w/2,y-40,"#5b3b24",6,"center","#c9ad6c");
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
    } else if(o.type==="arch"&&v===2){
      rect(c,x,y-40,10,h+40,"#3d3b44");rect(c,x+w-10,y-40,10,h+40,"#3d3b44");rect(c,x+2,y-38,5,h+36,"#625e6c");rect(c,x+w-8,y-38,5,h+36,"#625e6c");
      rect(c,x-4,y-46,w+8,9,"#2a2930");rect(c,x-2,y-46,w+4,2,"#77737f");
      for(let k=0;k<6;k++)rect(c,x+12+k*8,y-37,1,30,"#2a2930");
      rect(c,x+w/2-4,y-56,8,10,"#3d3b44");rect(c,x+w/2-1,y-62,2,10,"#625e6c");rect(c,x+w/2-4,y-58,8,2,"#625e6c");
      if(o.label)pixelText(c,o.label,x+w/2,y-41,"#d8d2e6",6);
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
    Px.glow(c,0,0,13+Math.round(Math.sin(time*3+p.x)),"#e5bd63",.45);
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
    if(d.item){
      Px.glow(c,x,y-8,18,"#c7a0ff",.8);pixelText(c,d.item==="key"?"🗝":(Z.OFFERINGS&&Z.OFFERINGS[d.item]||{}).icon||"✦",x,y-9+bob,({key:"#ffe08a",fang:"#f4efdc",ring:"#f2c94c",claw:"#e0505e",elemental:"#7fe6f2",eye:"#e9e3ea",sphere:"#c9a6ff"})[d.item]||"#ffffff",11);return;
    }
    if(d.life<5&&Math.floor(time*8)%2===0)return;
    rect(c,x-3,y+2,6,2,P.shadow);
    const spin=Math.abs(Math.sin(time*4+d.seed)),w=Math.max(1,Math.round(5*spin));
    rect(c,x-Math.ceil(w/2)-1,y-6+bob,w+2,7,"#8a6424");rect(c,x-Math.ceil(w/2),y-5+bob,w,5,"#f2cb5b");
    if(w>2)rect(c,x-Math.ceil(w/2)+1,y-5+bob,1,2,"#fff2b5");
  }
  class Renderer {
    constructor(canvas) {
      this.canvas=canvas;this.ctx=Px.install(canvas.getContext("2d",{alpha:false}));
      canvas.width=640;canvas.height=360;this.ctx.imageSmoothingEnabled=false;
      this.background=null;this.worldRef=null;this.camera={x:0,y:0};this.elapsed=0;
    }
    resize(dynamic = false) {
      const host=this.canvas.parentElement||this.canvas,bounds=host.getBoundingClientRect(),dpr=window.devicePixelRatio||1;
      const base=dynamic && bounds.width>0 && bounds.width<700 && bounds.height>bounds.width ? 400 : 640;
      let width=base,height=dynamic && bounds.width>0 ? Math.max(200,Math.min(1200,Math.round(base*bounds.height/bounds.width))) : 360,zoom=0;
      if(dynamic&&bounds.width>0){
        // Si la pantalla lo permite, cada píxel del juego mide un número entero de píxeles reales:
        // así todos quedan iguales. La vista cambia poco (±12,5%); si no se puede, se escala como antes.
        const real=bounds.width*dpr,k=Math.max(1,Math.round(real/base)),fit=Math.ceil(real/k);
        if(fit>=base*.875&&fit<=base*1.125){zoom=k;width=fit;height=Math.max(200,Math.min(1200,Math.ceil(bounds.height*dpr/k)));}
      }
      if(this.canvas.width!==width || this.canvas.height!==height){this.canvas.width=width;this.canvas.height=height;this.initialized=false;}
      this.canvas.style.width=zoom?width*zoom/dpr+"px":"";this.canvas.style.height=zoom?height*zoom/dpr+"px":"";
      this.ctx.imageSmoothingEnabled=false;
    }
    // Terreno natural con ruido y tramado, sin grilla; caminos de borde irregular.
    paintGround(c,world) {
      const left=world.left||0,W=world.width-left,H=world.height,surface=Z.SURFACE_HEIGHT||H;
      const ids=["void","throne","sanctum","magic","altar","cave","cave2","cave3","weeds","village"],soft={altar:1,cave:1,weeds:1,village:1};
      const hexes={
        village:["#658549","#6e8d4e","#739353","#7c9a56","#869f5a"],weeds:["#54723e","#5d7b43","#668348","#6f8b4c","#7a9250"],
        cave:["#3d4146","#44484d","#4a4d52","#505257","#585a5e"],cave2:["#2a2d34","#2f323a","#33363f","#383b44","#3f424c"],cave3:["#2e2523","#352b29","#3b302d","#40342f","#4b3d37"],
        altar:["#333a2e","#394135","#3f4738","#454d3d","#4c5443"],magic:["#16131d","#1a1723","#1e1a29","#231e2f"],void:["#222428","#26282d","#2a2c31"]
      };
      const toRaw=hex=>{const [r,g,b]=Px.rgb(hex);return (255<<24|b<<16|g<<8|r)>>>0;};
      const table={};for(const id in hexes)table[id]=hexes[id].map(toRaw);
      const dirt=["#b9a26e","#bfa874","#c4ad78","#cab37f","#d0ba88"].map(toRaw),rock=["#58585c","#626265","#68686b","#707073"].map(toRaw),dirtEdge=toRaw("#8b8854"),rockEdge=toRaw("#3f454b"),deep=toRaw("#07090c");
      const cols=Math.ceil(W/16),rows=Math.ceil(H/16),zones=new Uint8Array(cols*rows),seam=new Uint8Array(cols*rows);
      for(let r=0;r<rows;r++)for(let q=0;q<cols;q++)zones[r*cols+q]=ids.indexOf(zoneAt(world,left+q*16+8,r*16+8));
      for(let r=0;r<rows;r++)for(let q=0;q<cols;q++){const z=zones[r*cols+q];for(let a=-1;a<=1;a++)for(let b=-1;b<=1;b++){const n=zones[Math.max(0,Math.min(rows-1,r+a))*cols+Math.max(0,Math.min(cols-1,q+b))];if(n!==z)seam[r*cols+q]=1;}}
      // Máscara de caminos de tierra y de cueva, en celdas de 4 px.
      const mw=Math.ceil(W/4),mh=Math.ceil(H/4),mask=new Uint8Array(mw*mh),near=new Uint8Array(cols*rows);
      for(const path of world.paths||[]){
        const kind=path.material==="cave"?2:!path.material||path.material==="dirt"?1:0;if(!kind)continue;
        const x0=Math.max(0,Math.floor((path.x-left)/4)),x1=Math.min(mw,Math.ceil((path.x+path.w-left)/4)),y0=Math.max(0,Math.floor(path.y/4)),y1=Math.min(mh,Math.ceil((path.y+path.h)/4));
        for(let y=y0;y<y1;y++)mask.fill(kind,y*mw+x0,y*mw+x1);
        const q0=Math.max(0,Math.floor((path.x-left-16)/16)),q1=Math.min(cols,Math.ceil((path.x+path.w-left+16)/16)),r0=Math.max(0,Math.floor((path.y-16)/16)),r1=Math.min(rows,Math.ceil((path.y+path.h+16)/16));
        for(let r=r0;r<r1;r++)near.fill(1,r*cols+q0,r*cols+q1);
      }
      this.pathMask=(x,y)=>{const mx=Math.floor((x-left)/4),my=Math.floor(y/4);return mx>=0&&my>=0&&mx<mw&&my<mh?mask[my*mw+mx]:0;};
      const bandHeight=128,image=c.createImageData(W,bandHeight),pixels=new Uint32Array(image.data.buffer),noise=Px.noise,bayer=Px.bayer;
      for(let top=0;top<H;top+=bandHeight){
        const limit=Math.min(H,top+bandHeight);pixels.fill(0);
        for(let y=top;y<limit;y+=2){
          const row=y>>4,by=(y>>1);
          for(let px=0;px<W;px+=2){
            const cell=row*cols+(px>>4),x=px+left;let zone=zones[cell],color=0;
            if(zone===1||zone===2)continue;
            if(y>=surface&&zone===0)color=deep;
            else{
              if(seam[cell]&&soft[ids[zone]]){
                const zx=px+(noise(x/19,y/19)-.5)*26,zy=y+(noise(x/19+40,y/19+40)-.5)*26,cq=Math.max(0,Math.min(cols-1,zx>>4)),cr=Math.max(0,Math.min(rows-1,zy>>4)),other=zones[cr*cols+cq];
                if(soft[ids[other]])zone=other;
              }
              let kind=0,edge=false;
              if(near[cell]){
                const wx=x+(noise(x/11,y/11)-.5)*9,wy=y+(noise(x/11+70,y/11+70)-.5)*9;kind=this.pathMask(wx,wy);
                if(kind&&(!this.pathMask(wx-3,wy)||!this.pathMask(wx+3,wy)||!this.pathMask(wx,wy-3)||!this.pathMask(wx,wy+3)))edge=true;
              }
              const value=noise(x/54,y/54)*.55+noise(x/15+9,y/15+9)*.3+noise(x/5,y/5)*.15,t=Math.max(0,Math.min(.999,(value-.22)/.56));
              if(kind){const list=kind===2?rock:dirt;color=edge?(kind===2?rockEdge:dirtEdge):list[Math.min(list.length-1,Math.floor(t*(list.length-1)+bayer(px>>1,by)))];}
              else{const list=table[ids[zone]]||table.village;color=list[Math.min(list.length-1,Math.floor(t*(list.length-1)+bayer(px>>1,by)))];}
            }
            const at=(y-top)*W+px;pixels[at]=color;pixels[at+1]=color;
            if(y+1<limit){pixels[at+W]=color;pixels[at+W+1]=color;}
          }
        }
        c.putImageData(image,0,top,0,0,W,limit-top);
      }
    }
    makeBackground(world) {
      const left=world.left||0,b=document.createElement("canvas");b.width=world.width-left;b.height=world.height;
      const c=b.getContext("2d");c.imageSmoothingEnabled=false;
      this.paintGround(c,world);c.translate(-left,0);
      const onPath=(x,y)=>this.pathMask(x,y)>0;
      for(let y=0;y<world.height;y+=16)for(let x=left;x<world.width;x+=16){
        const zone=zoneAt(world,x+8,y+8), n=hash(x,y,18);
        if(zone==="void"){if(y<(Z.SURFACE_HEIGHT||1800)&&n>.8)rect(c,x+4,y+6,3,2,"#34363c");continue;}
        if(zone==="throne"){
          const row=Math.floor(y/8);rect(c,x,y,16,16,n>.7?"#1a1720":"#15131b");
          for(let r=0;r<2;r++){rect(c,x,y+r*8,16,1,"#0a090d");const off=((row+r)%2)*8;rect(c,x+off,y+r*8,1,8,"#0a090d");rect(c,x+off+1,y+r*8+1,7,1,"#201c29");}
          if(n>.93)rect(c,x+3,y+5,5,1,"#2a2236");continue;
        }
        if(zone==="sanctum"){
          rect(c,x,y,16,16,(Math.floor(x/16)+Math.floor(y/16))&1?"#1e1a2a":"#241f33");rect(c,x,y,16,1,"#110e18");rect(c,x,y,1,16,"#110e18");rect(c,x+1,y+1,15,1,"#2d2740");
          if(n>.9)rect(c,x+4,y+6,6,1,"#3a2f52");continue;
        }
        if(zone==="magic"){
          for(let k=0;k<3;k++)rect(c,x+Math.floor(hash(x+k,y,1)*15),y+Math.floor(hash(x,y+k,2)*15),2+k%2,1,k%2?"#2c2440":"#30263f");
          if(n>.96)rect(c,x+6,y+8,2,2,"#5a3a8a");continue;
        }
        if(zone==="altar"){
          for(let k=0;k<3;k++){const px=x+Math.floor(hash(x+k,y,1)*15),py=y+Math.floor(hash(x,y+k,2)*15);if(!onPath(px,py))tuft(c,px,py,k%2?"#4f5940":"#5b6447",false);}
          if(n>.9)rect(c,x+5,y+7,4,2,"#4a3f4a");continue;
        }
        if(zone==="cave2"||zone==="cave3"){
          const pal=zone==="cave2"?["#4a4e58","#22252b"]:["#584640","#261e1c"];
          for(let k=0;k<3;k++){const px=x+Math.floor(hash(x+k,y,1)*15),py=y+Math.floor(hash(x,y+k,2)*15);if(!onPath(px,py)){rect(c,px,py,2+k%3,1,pal[k%2]);if(k===1&&n>.82){rect(c,px,py+1,3,1,pal[1]);rect(c,px,py,3,1,pal[0]);}}}
          continue;
        }
        for(let k=0;k<(zone==="weeds"?7:2);k++){
          const px=x+Math.floor(hash(x+k,y,1)*15),py=y+Math.floor(hash(x,y+k,2)*15);
          if(onPath(px,py)||onPath(px,py-6))continue;
          if(zone==="cave"){
            rect(c,px,py,2+k%3,1,k%2?"#5b5c60":"#373e44");
            if(n>.9&&k===1){rect(c,px,py,3,2,"#6c6f72");rect(c,px,py,2,1,"#8d9091");rect(c,px,py+2,3,1,"#33383d");}
          } else tuft(c,px,py,k%2?(zone==="weeds"?"#4e6d3f":"#5f8046"):(zone==="weeds"?"#8b9b56":"#8ca45d"),zone==="weeds");
        }
        if(zone==="village"&&n>.975&&!onPath(x+7,y+9))flower(c,x+7,y+9,Math.floor(n*200)%4);
        // Manchones de trébol para cortar la repetición del pasto.
        if((zone==="village"||zone==="weeds")&&hash(x,y,44)>.94&&!onPath(x+6,y+6))for(let k=0;k<5;k++){const px=x+2+hash(k,x,y)*10,py=y+2+hash(k,y,x)*10;rect(c,px,py,2,1,"#8fae62");rect(c,px+1,py+1,1,1,"#527440");}
      }
      const paths=world.paths||[{x:735,y:500,w:62,h:1300},{x:180,y:940,w:1550,h:65}];
      for(const path of paths){
        const {x,y,w,h}=path;
        if(path.material==="grave"){
          rect(c,x-2,y-2,w+4,h+4,"#2c2b31");rect(c,x,y,w,h,"#46444c");
          for(let yy=y;yy<y+h;yy+=10)for(let xx=x+((yy-y)%20?5:0);xx<x+w;xx+=14){const ww=Math.min(12,x+w-xx-1),hh=Math.min(8,y+h-yy-1),light=hash(xx,yy)>.5;rect(c,xx+1,yy+1,ww,hh,light?"#64616b":"#5b5862");rect(c,xx+1,yy+1,ww,1,light?"#74717b":"#68656f");}
          continue;
        }
        if(path.material==="rune"){
          rect(c,x-2,y-2,w+4,h+4,"#0c0b10");rect(c,x,y,w,h,"#2a2236");
          for(let yy=y;yy<y+h;yy+=10)for(let xx=x+((yy-y)%20?5:0);xx<x+w;xx+=12){const ww=Math.min(10,x+w-xx-1),hh=Math.min(8,y+h-yy-1);rect(c,xx+1,yy+1,ww,hh,hash(xx,yy)>.5?"#352b47":"#2f2740");rect(c,xx+1,yy+1,ww,1,"#3f3454");if(hash(xx,yy,7)>.93){rect(c,xx+4,yy+3,2,2,"#7b4fc0");rect(c,xx+4,yy+3,1,1,"#b18cf0");}}
          continue;
        }
        if(path.material==="carpet"){
          rect(c,x-3,y,w+6,h,"#0c0b10");rect(c,x,y,w,h,"#4a1626");rect(c,x+6,y,w-12,h,"#541a2c");rect(c,x+3,y,2,h,"#7b4fc0");rect(c,x+w-5,y,2,h,"#7b4fc0");
          for(let yy=y+10;yy<y+h;yy+=24){poly(c,[[x+w/2,yy-3],[x+w/2+6,yy+4],[x+w/2,yy+11],[x+w/2-6,yy+4]],"#6c2239");poly(c,[[x+w/2,yy+1],[x+w/2+3,yy+4],[x+w/2,yy+7],[x+w/2-3,yy+4]],"#8b3350");}
          continue;
        }
        if(path.material==="stone"){
          // Adoquines con luz arriba, sombra abajo y juntas oscuras.
          rect(c,x-3,y-3,w+6,h+6,"#6a7450");rect(c,x-1,y-1,w+2,h+2,"#77776a");rect(c,x,y,w,h,"#8a8874");
          for(let yy=y,row=0;yy<y+h;yy+=12,row++)for(let xx=x-(row%2?9:0);xx<x+w;xx+=18){
            const sx=Math.max(x,xx),ww=Math.min(17,x+w-sx,xx+17-sx),hh=Math.min(11,y+h-yy);if(ww<=0)continue;
            const tone=hash(xx,yy),base=tone>.66?"#b9b398":tone>.33?"#aeaa90":"#a4a188";
            rect(c,sx,yy,ww,hh,base);rect(c,sx,yy,ww,1,"#c9c3a8");rect(c,sx,yy+hh-1,ww,1,"#92907a");rect(c,sx+ww-1,yy,1,hh,"#9a9880");
            if(tone>.8){rect(c,sx+4,yy+4,3,1,"#9c9a82");rect(c,sx+7,yy+5,2,1,"#9c9a82");}
          }
          for(let k=0;k<w/12;k++){rect(c,x+k*12,y-2+(k%3),5,2,"#869251");rect(c,x+k*12+4,y+h-1,4,2,"#82904f");}
          for(let k=0;k<h/14;k++){rect(c,x-2,y+k*14,2,5,"#849253");rect(c,x+w-1,y+k*14+4,2,5,"#859151");}
          continue;
        }
        // Tierra y roca: piedritas y huellas sueltas sobre el terreno ya pintado.
        const cave=path.material==="cave";
        for(let yy=y+3;yy<y+h;yy+=9)for(let xx=x+2;xx<x+w;xx+=10){
          const r=hash(xx,yy,21),px=xx+r*4;if(r<.52||!onPath(px,yy)||!onPath(px+4,yy))continue;
          rect(c,px,yy,2+r*3,1,cave?(r>.75?"#7c7b7e":"#505458"):(r>.75?"#dfc993":"#a8925f"));
          if(r>.93){rect(c,px,yy,3,2,cave?"#808285":"#9b8a62");rect(c,px,yy,2,1,cave?"#a0a2a4":"#cdbd8e");}
        }
      }
      // Hand-cut stepping stones and tiny clover soften the meeting of biomes.
      for(let y=30;y<Math.min(world.height,Z.SURFACE_HEIGHT||world.height);y+=23){
        const x=1544+Math.floor(hash(y,5)*17);
        if(!onPath(x,y))for(let k=0;k<4;k++)tuft(c,x+k*4,y+k*2,"#4f713e",true);
      }
      this.background=b;this.worldRef=world;
    }
    draw(game,dt=0) {
      const c=this.ctx, world=game.world, W=this.canvas.width, H=this.canvas.height;
      this.elapsed+=Math.min(.1,Number.isFinite(dt)?dt:0);
      const time=Number.isFinite(game.time)?game.time:this.elapsed;
      if(!world){c.fillStyle="#22372c";c.fillRect(0,0,W,H);return;}
      if(this.worldRef!==world||!this.background){
        const layout=JSON.stringify([world.left,world.width,world.height,world.zones,world.paths]);
        if(!this.background||layout!==this.backgroundLayout){this.makeBackground(world);this.backgroundLayout=layout;}
        this.worldRef=world;
      }
      const p=game.player||{x:770,y:960,characterId:"dante"};currentGame=game;
      const menu=["menu","title","character","characters","select","load","exited"].includes(game.state);
      // En las escenas la cámara mira a lo que indique la escena (Zak, el altar) y se mueve más lento.
      const scene=!menu&&game.cutscene,focus=scene&&scene.focus;
      const tx=menu?770+Math.sin(time*.07)*22:focus?focus.x:p.x,ty=menu?955+Math.cos(time*.055)*12:focus?focus.y:p.y;
      const area=viewArea(world,menu?"village":game.biome),cinema=!menu&&(game.cutscene||game.cutsceneFade>0)?Math.round(H*.1):0;
      // En las escenas la cámara puede pasarse del borde lo que miden las franjas negras: esa parte queda tapada.
      const clampX=v=>Math.max(area.x,Math.min(area.x+area.w-W,v)),clampY=v=>Math.max(area.y-cinema,Math.min(area.y+area.h-H+cinema,v));
      const cx=clampX(tx-(W/2)),cy=clampY(ty-(H/2+4));
      const smoothing=menu?.018:scene?.06:game.cutsceneFade>0?.08:.16;
      if(!this.initialized||(!scene&&!(game.cutsceneFade>0)&&Math.hypot(cx-this.camera.x,cy-this.camera.y)>H)){this.camera.x=cx;this.camera.y=cy;this.initialized=true;}
      else{this.camera.x+=(cx-this.camera.x)*smoothing;this.camera.y+=(cy-this.camera.y)*smoothing;}
      let ox=Math.round(this.camera.x),oy=Math.round(this.camera.y);
      game.camera={x:ox,y:oy};
      if(game.shakeTime>0&&!menu){
        const power=game.shakePower*Math.min(1,game.shakeTime/.15);
        ox=Math.round(clampX(ox+(Math.random()-.5)*2*power));
        oy=Math.round(clampY(oy+(Math.random()-.5)*2*power));
      }
      game.shakeTime=Math.max(0,(game.shakeTime||0)-Math.min(.1,dt||0));
      game.hurtFlash=Math.max(0,(game.hurtFlash||0)-Math.min(.1,dt||0));
      c.globalAlpha=1;c.setTransform(1,0,0,1,0,0);c.imageSmoothingEnabled=false;
      c.drawImage(this.background,ox-(world.left||0),oy,W,H,0,0,W,H);
      c.save();c.translate(-ox,-oy);
      const visible=(x,y,pad=90)=>x>ox-pad&&x<ox+W+pad&&y>oy-pad&&y<oy+H+pad;
      const objects=world.objects||[];
      for(const o of objects)if(["pond","flower","grass"].includes(o.type)&&visible(o.x+o.w/2,o.y+o.h/2,Math.max(o.w||0,o.h||0)+80))drawObject(c,o,time);
      for(const item of world.pickups||[])if(visible(item.x,item.y,30))pickup(c,item,time);
      for(const d of game.drops||[])if(visible(d.x,d.y,20))coin(c,d,time);
      const renderables=[];
      for(const o of objects)if(!["pond","flower","grass"].includes(o.type)&&visible(o.x+o.w/2,o.y+o.h/2,Math.max(o.w||0,o.h||0)+80))renderables.push({y:o.y+o.h,kind:"object",data:o});
      for(const npc of world.npcs||[])if(visible(npc.x,npc.y,50))renderables.push({y:npc.y,kind:"npc",data:npc});
      for(const e of game.enemies||[])if(!e.dead&&visible(e.x,e.y,35))renderables.push({y:e.y,kind:"enemy",data:e});
      if(game.player&&!menu)renderables.push({y:p.y,kind:"player",data:p});
      renderables.sort((a,b)=>a.y-b.y);
      for(const item of renderables){
        if(item.kind==="object"){
          const o=item.data;
          const hiding=p.x>o.x-18&&p.x<o.x+o.w+18&&p.y<o.y+o.h&&p.y>o.y-40;
          c.globalAlpha=!menu&&hiding&&["tree","house","arch","cliff","pillar","deadtree","zakthrone","wall"].includes(o.type)?.62:1;
          drawObject(c,o,time);c.globalAlpha=1;
        }else if(item.kind==="enemy")drawEnemy(c,item.data,time);
        else if(item.kind==="npc"&&item.data.kind==="smith"){
          const n=item.data;drawSmith(c,n,time);
          if(Math.hypot(p.x-n.x,p.y-n.y)<60&&!menu)pixelText(c,n.name,n.x,n.y-44,"#f2c98a",6);
        }
        else if(item.kind==="npc"){
          const n=item.data;
          drawNpc(c,n,time);
          if(n.name&&Math.hypot(p.x-n.x,p.y-n.y)<(n.radius||9)+33&&!menu)pixelText(c,n.name,n.x,n.y-(n.tag||33),"#e1d6af",6);
        } else if(scene&&scene.id==="portal"){
          // Se achica hasta desaparecer al entrar y vuelve a crecer al salir.
          const P=Z.PORTAL_SCENE,t=scene.t,before=Math.max(0,(t-.45)/(P.travel-.45)),size=t<P.travel?1-before*before:Math.min(1,(t-P.travel-.15)/.6);
          if(size>.02){c.save();c.translate(p.x,p.y-10);c.scale(size,size);c.translate(-p.x,-p.y+10);c.globalAlpha=Math.min(1,size*1.6);drawCharacter(c,p,time);c.restore();}
        } else drawCharacter(c,p,time);
      }
      if(p.burn&&!menu){for(let k=0;k<4;k++){const t=(time*2.2+k*.25)%1;c.globalAlpha=1-t;rect(c,p.x-6+k*4,p.y-12-t*16,2,3,k%2?"#ff8a2a":"#ffd36a");}c.globalAlpha=1;}
      for(const projectile of game.projectiles||[]){
        const x=projectile.x,y=projectile.y;
        if(!visible(x,y,20))continue;
        c.save();c.translate(Math.round(x),Math.round(y));
        const ang=Math.atan2(projectile.dy||projectile.vy||0,projectile.dx||projectile.vx||1),ca=Math.cos(ang),sa=Math.sin(ang),quarter=Math.floor(time*12)%4;
        // Sombra en el piso: separa el tiro del suelo y ayuda a calcularlo.
        if(!["boomerang","fireball"].includes(projectile.type))rect(c,-2,7,4,1,P.shadow);
        if(projectile.type==="stone"){
          // La piedra gira de a cuartos: cuatro cuadros exactos.
          const q=[[0,0],[1,0],[1,1],[0,1]][quarter];rect(c,-3,-3,6,5,"#3f5154");rect(c,-3+1,-3+1,4,3,"#7f938f");rect(c,-2+q[0],-3+q[1],2,2,"#c3d0c6");
        }
        else if(projectile.type==="boulder"){
          const q=[[-4,-4],[1,-4],[1,1],[-4,1]][Math.floor(time*8)%4];
          rect(c,-6,-7,12,14,"#2f3135");rect(c,-7,-5,14,10,"#2f3135");rect(c,-5,-6,10,12,"#8a8f96");rect(c,-6,-4,12,8,"#8a8f96");rect(c,-5,3,10,3,"#5e6268");rect(c,q[0],q[1],4,3,"#b8bcc2");
        }
        else if(projectile.type==="boomerang"){
          Px.glow(c,0,0,14,VIOLET,.6);
          const a=projectile.spin||0,step=Math.round(a/(Math.PI/4))*Math.PI/4;
          for(const o of [0,Math.PI/2]){rrect(c,0,0,step+o,-10,-2,20,4,"#3c1768");rrect(c,0,0,step+o,-9,-1,18,2,"#c99bff");}
          rect(c,-2,-2,4,4,"#f1e2ff");
        }
        else if(projectile.type==="fireball"){
          const f=Math.floor(time*24)%3;
          Px.glow(c,0,0,13+f,"#ff7a2a",.75);
          for(let k=1;k<=4;k++){c.globalAlpha=.8-k*.17;const tx=-projectile.dx*k*5+Math.sin(time*30+k*2)*1.2,ty=-projectile.dy*k*5+Math.cos(time*27+k*2)*1.2,s=5-k;rect(c,tx-s/2,ty-s/2,s,s,k<2?"#ffc35a":"#ff7a2a");}
          c.globalAlpha=1;
          rect(c,-4,-3,8,6,"#c6421e");rect(c,-3,-4,6,8,"#c6421e");rect(c,-3,-3,6,6,"#ff8a2a");rect(c,-2-(f===1?1:0),-2,4,4,"#ffc35a");rect(c,-1,-1,2,2,"#fff6d0");
        }
        else if(projectile.type==="venom"){
          const w=Math.floor(time*16)%2;
          for(let k=1;k<=3;k++){c.globalAlpha=.55-k*.13;rect(c,-projectile.dx*k*5-1,-projectile.dy*k*5-1,3,3,"#9fdc72");}
          c.globalAlpha=1;rect(c,-4-w,-3,8+w*2,6,"#3c5a2a");rect(c,-3,-2-w,6,4+w*2,"#94d36a");rect(c,-1,-2,2,2,"#e4ffc4");
        }
        else if(projectile.type==="knife"){
          c.globalAlpha=.3;Px.line(c,-ca*18,-sa*18,-ca*9,-sa*9,"#dfe6e2");c.globalAlpha=1;
          Px.line(c,-ca*7,-sa*7,ca*7,sa*7,"#1b1a20",3);Px.line(c,-ca*1,-sa*1,ca*7,sa*7,"#f4f6f0");Px.line(c,-ca*6,-sa*6,-ca*2,-sa*2,"#7a4a2a",2);
          Px.line(c,-ca*2-sa*3,-sa*2+ca*3,-ca*2+sa*3,-sa*2-ca*3,"#e7c35c");
        }
        else{
          // Flecha: línea de píxeles en su ángulo real, con punta, plumas y estela.
          c.globalAlpha=.3;Px.line(c,-ca*16,-sa*16,-ca*8,-sa*8,"#f4ecd0");c.globalAlpha=1;
          Px.line(c,-ca*8,-sa*8,ca*6,sa*6,"#c4a878");Px.line(c,ca*6,sa*6,ca*9,sa*9,"#e6efe2",2);
          Px.line(c,-ca*8,-sa*8,-ca*5-sa*2,-sa*5+ca*2,"#e8ddc2");Px.line(c,-ca*8,-sa*8,-ca*5+sa*2,-sa*5-ca*2,"#e8ddc2");
        }
        c.restore();
      }
      if(p.gather&&!menu){
        const g=p.gather,k=Math.min(1,g.time/g.total),bx=Math.round(p.x-14),by=Math.round(p.y-44);
        rect(c,bx-1,by-1,30,6,"#1b2621");rect(c,bx,by,28,4,"#33463c");rect(c,bx,by,28*k,4,g.tool==="axe"?"#c49a5a":"#a9c3d0");rect(c,bx,by,28*k,1,"#ffffff44");
      }
      if((game.attackStick||game.attackPreview)&&!menu&&!scene&&game.state==="playing")drawAimGuide(c,game,p,time);
      if(!menu)this.drawThroneHazards(c,game,time);
      if(scene&&scene.id==="altar")this.drawAltarScene(c,scene,time);
      if(scene&&scene.id==="portal")this.drawPortalScene(c,scene,time);
      for(const effect of game.effects||[])this.drawEffect(c,effect,time);
      if(game.biome==="weeds"&&!menu)for(let k=0;k<4;k++)tuft(c,p.x-8+k*5,p.y+2,"#587a43",true,Math.sin(time*2)>0?1:0);
      c.restore();
      const hour=Z.dayClock(menu?0:p.playTime).hour,night=Math.max(0,Math.cos((hour-1)*Math.PI/12)),outdoors=!["throne","sanctum","magic","altar"].includes(game.biome)&&!isCaveZone(game.biome);
      if(game.settings?.particles!==false&&!["throne","sanctum","magic"].includes(game.biome)){c.save();c.translate(-ox,-oy);drawAmbient(c,game,ox,oy,W,H,time,outdoors||menu?night:0);c.restore();}
      // Luna roja: aparece y se va de a poco durante la primera y la última hora de la noche.
      const nightHours=hour>=19?hour-19:hour+5,moonLight=!menu&&p.bloodMoon===true?Math.max(0,Math.min(1,nightHours,12-nightHours)):0;
      const redSky=()=>{
        if(moonLight<=0)return;
        c.fillStyle="rgba(138,12,28,"+(moonLight*.2)+")";c.fillRect(0,0,W,H);
        Px.shade(c,W/2,H*.445,W,H,[[150,0],[400,.34]],"#3a0410",moonLight);
        const mx=Math.round(W*.72),my=30;c.save();c.globalAlpha=moonLight;
        Px.glow(c,mx,my,34,"#ff2a2a",.45);Px.oval(c,mx,my,13,13,"#b3202a");Px.oval(c,mx-2,my-2,10,10,"#e0433f");
        rect(c,mx-6,my-6,4,3,"#b3202a");rect(c,mx+2,my+1,5,3,"#b3202a");rect(c,mx-3,my+5,3,2,"#b3202a");c.restore();
      };
      if(["throne","sanctum","magic"].includes(game.biome)&&!menu){
        c.fillStyle="rgba(22,10,44,.30)";c.fillRect(0,0,W,H);
        if(game.biome==="magic")for(const o of objects)if(o.type==="campfire"&&visible(o.x,o.y,80))Px.glow(c,o.x-ox+o.w/2,o.y-oy,70,"#ff8c3c",.3+Math.sin(time*9+o.x)*.03);
        for(let k=0;k<16;k++){const ex=(hash(k,3)*W+time*(8+k%5)*(k%2?1:-1))%W,ey=H-((time*(14+k%7)+hash(k,9)*H)%H);c.globalAlpha=.35+Math.sin(time*3+k)*.2;rect(c,(ex+W)%W,ey,k%4?1:2,k%4?1:2,k%3?"#a77bff":"#e6d6ff");}
        c.globalAlpha=1;
        if(game.darkness>0)Px.shade(c,p.x-ox,p.y-oy-10,W,H,[[30,0],[63,.75],[105,.985]],"#040208");
        const zak=(game.enemies||[]).find(e=>e.type==="zak"&&e.act&&e.act.id==="purple");
        if(zak){const a=zak.act,sx=a.safe.x-ox,sy=a.safe.y-oy,pulse=.18+Math.abs(Math.sin(time*10))*.14;
          c.fillStyle="rgba(120,40,190,"+pulse+")";c.beginPath();c.rect(0,0,W,H);c.ellipse(sx,sy,a.r,a.r*.8,0,0,Math.PI*2);c.fill("evenodd");
          c.fillStyle="rgba(242,232,255,.12)";c.beginPath();c.ellipse(sx,sy,a.r,a.r*.8,0,0,Math.PI*2);c.fill();
          c.strokeStyle="#f2e8ff";c.lineWidth=2;c.setLineDash([5,4]);c.beginPath();c.ellipse(sx,sy,a.r,a.r*.8,0,0,Math.PI*2);c.stroke();c.setLineDash([]);
          pixelText(c,"¡ACÁ!",sx,sy-a.r-8,"#f2e8ff",10);}
      } else if(game.biome==="altar"&&!menu){
        c.fillStyle="rgba(40,34,58,.30)";c.fillRect(0,0,W,H);
        // Bruma en bandas: elipses de bordes duros, en pixel art.
        for(let k=0;k<7;k++){const fx=((hash(k,4)*W*1.5+time*(6+k))%(W+200))-100,fy=hash(k,6)*H;c.globalAlpha=.05;Px.oval(c,fx,fy,90,14,"#cfc8e0");c.globalAlpha=.04;Px.oval(c,fx+12,fy+2,60,8,"#cfc8e0");}
        c.globalAlpha=1;
        Px.shade(c,p.x-ox,p.y-oy-10,W,H,[[120,0],[340,.55]],"#0a0810");
        redSky();
      } else if(isCaveZone(game.biome)&&game.biome!=="cave"&&!menu){
        const px=Math.round(p.x-ox),py=Math.round(p.y-oy-10),flicker=Math.sin(time*13)*3+Math.sin(time*7)*2,outer=235+Math.round(flicker/3)*3;
        Px.shade(c,px,py,W,H,[[55,0],[Math.round(outer*.72),.36],[outer,.88]],"#07080a");
        Px.glow(c,px,py,145,"#ffaa50",.26);
        const fx=px+8,fy=py-2,up=flicker>0?1:0;rect(c,fx,fy,2,7,"#6b4f33");rect(c,fx-1,fy-4,4,4,"#d9772a");rect(c,fx,fy-5-up,2,4,"#f2a541");rect(c,fx,fy-3-up,1,2,"#ffe08a");Px.glow(c,fx+1,fy-3,14,"#ffc26a",.5);
        for(const o of objects)if(o.type==="ore"&&!o.harvested&&(o.ore==="gold"||o.ore==="diamond")&&visible(o.x,o.y,20)&&Math.sin(time*2.5+o.x)>.6){
          const sx=o.x-ox+o.w*.5,sy=o.y-oy-4;c.globalAlpha=.8;rect(c,sx,sy-2,1,5,o.ore==="gold"?"#ffe9a0":"#c8faff");rect(c,sx-2,sy,5,1,o.ore==="gold"?"#ffe9a0":"#c8faff");c.globalAlpha=1;
        }
      } else if(game.biome==="cave"&&!menu){
        Px.shade(c,p.x-ox,p.y-oy-10,W,H,[[50,0],[162,.18],[270,.6]],"#0d121a");
        for(const o of objects)if(o.type==="lantern"&&visible(o.x,o.y,60))Px.glow(c,o.x-ox+o.w/2,o.y-oy-20,40,"#f3bc59",.3+Math.sin(time*7+o.x)*.03);
      } else {
        Px.shade(c,W/2,H*.445,W,H,[[135,0],[380,.16]],"#1d2d1e");
        // Tarde: la luz se vuelve dorada desde las 14:00, llega al máximo a las 18:00 y se apaga a las 20:00.
        const sunset=hour<14||hour>=20?0:hour<18?(hour-14)/4:(20-hour)/2;
        if(night>.01){c.fillStyle="rgba(24,34,67,"+(night*.34)+")";c.fillRect(0,0,W,H);}
        if(sunset>.01){c.fillStyle="rgba(217,122,69,"+(sunset*.18)+")";c.fillRect(0,0,W,H);}
        redSky();
        if(night>.05)for(const o of objects){
          if(!visible(o.x,o.y,(H*.445)))continue;
          if(o.type==="lantern")Px.glow(c,o.x-ox+o.w/2,o.y-oy-20,46,"#ffd272",night*.42);
          else if(o.type==="house"){
            const wy=o.y+Math.max(9,o.h*.3)-oy;
            c.globalAlpha=night*.53;
            for(const wx of [o.x+15,o.x+o.w-29]){rect(c,wx-ox,wy+2,6,7,"#edc97e");rect(c,wx-ox+8,wy+2,6,7,"#edc97e");rect(c,wx-ox,wy+11,6,5,"#dbab68");rect(c,wx-ox+8,wy+11,6,5,"#dbab68");}
            c.globalAlpha=1;
          }
        }
      }
      if(game.hurtFlash>0&&!menu){c.fillStyle="rgba(190,52,44,"+(game.hurtFlash*.55)+")";c.fillRect(0,0,W,H);}
      const maxHealth=p.maxHp||(game.stats?game.stats().maxHealth:0);
      if(p.hp>0&&maxHealth&&p.hp/maxHealth<.3&&!menu)Px.shade(c,W/2,H/2,W,H,[[130,0],[370,.2]],"#882d2a",.8+Math.sin(time*3)*.2);
      if(!menu&&(scene||game.cutsceneFade>0))this.drawCutsceneOverlay(c,game,W,H,time);
    }
    // Ofrendas de la escena del altar: suben de sus huecos, giran, se juntan y estallan.
    drawAltarScene(c,s,time) {
      const A=Z.ALTAR_SCENE,a=s.altar,cx=a.x+a.w/2,cy=a.y-52,t=s.t,colors=["#9ad16a","#f2c94c","#c43a4a","#7fe6f2","#e9e3ea"];
      c.save();
      if(t<A.burst){
        const k=Math.max(0,Math.min(1,(t-A.converge)/(A.burst-A.converge))),pull=Math.min(1,Math.max(0,(t-A.converge)/.4));
        if(t>=A.converge){const r=4+k*14+Math.sin(time*20)*2;c.globalAlpha=.25+k*.35;c.fillStyle="#a77bff";c.beginPath();c.arc(cx,cy,r*2.2,0,Math.PI*2);c.fill();c.globalAlpha=.9;c.fillStyle="#f1e2ff";c.beginPath();c.arc(cx,cy,r*.6,0,Math.PI*2);c.fill();}
        A.lit.forEach((at,i)=>{
          if(t<at)return;const rise=1-Math.pow(1-Math.min(1,(t-at)/.5),3),sx=a.x+10+i*12,sy=a.y-6,lx=sx,ly=sy-34*rise;
          const ang=i*Math.PI*2/5+Math.max(0,t-A.converge)*(3+k*9),rad=38*(1-k),ox=cx+Math.cos(ang)*rad*1.3,oy=cy+Math.sin(ang)*rad*.7;
          const x=lx+(ox-lx)*pull,y=ly+(oy-ly)*pull;
          if(pull<1){c.globalAlpha=.22*(1-pull);rect(c,sx-3,y,6,sy-y,colors[i]);}
          c.globalAlpha=.35;c.fillStyle=colors[i];c.beginPath();c.arc(x,y,8+Math.sin(time*9+i)*1.5,0,Math.PI*2);c.fill();
          c.globalAlpha=1;rect(c,x-4,y-4,8,8,"#1c1a22");rect(c,x-3,y-3,6,6,colors[i]);rect(c,x-1,y-2,2,2,"#ffffff");
        });
      } else {
        // Columna de luz y anillo violeta tras la explosión.
        const k=Math.min(1,(t-A.burst)/1.6);c.globalAlpha=(1-k)*.55;c.fillStyle="#e6d6ff";c.fillRect(cx-14+k*10,cy-260,28-k*20,330);
        c.globalAlpha=(1-k)*.8;c.strokeStyle="#a77bff";c.lineWidth=3;c.beginPath();c.ellipse(cx,a.y+a.h,20+k*260,(20+k*260)*.6,0,0,Math.PI*2);c.stroke();
      }
      c.restore();
    }
    // Cruce del portal: chispas que caen en espiral al entrar; al salir, un portal igual que se cierra girando.
    drawPortalScene(c,s,time) {
      const P=Z.PORTAL_SCENE,t=s.t;
      c.save();
      if(!s.arrived){
        const k=Math.min(1,t/P.travel),cx=s.to.x,cy=s.to.y-14;
        for(let n=0;n<28;n++){const life=(hash(n,5)+t*(.6+k*1.2))%1,r=(1-life)*(46+hash(n,8)*44),a=hash(n,3)*Math.PI*2+life*(5+k*5);
          c.globalAlpha=Math.min(1,life*2.4)*(.35+k*.65);rect(c,cx+Math.cos(a)*r,cy+Math.sin(a)*r*.8,n%4?2:3,n%4?2:3,n%3?"#c9a6ff":"#f1e2ff");}
        c.globalAlpha=k*k*.5;c.fillStyle="#e6d6ff";c.beginPath();c.ellipse(cx,cy,10+k*k*22,16+k*k*30,0,0,Math.PI*2);c.fill();
      } else {
        const k=Math.max(0,1-(t-P.travel-.6)/(P.end-P.travel-.6)),size=Math.min(k*(2-k),1);
        if(size>.02){c.translate(Math.round(s.arrived.x),Math.round(s.arrived.y));c.translate(0,-14);c.scale(size,size);c.translate(0,14);drawPortal(c,0,0,time*(1+(1-k)*5),"#a77bff");}
      }
      c.restore();
    }
    // Franjas de cine, destellos y el cuadro de diálogo con efecto de máquina de escribir.
    drawCutsceneOverlay(c,game,W,H,time) {
      // Las charlas con los vecinos no llevan franjas: se ve todo el mundo alrededor.
      const s=game.cutscene,k=s?Math.min(1,s.t/.5):Math.min(1,game.cutsceneFade/.5),bar=s&&s.plain?0:Math.round(H*.1*(1-(1-k)*(1-k)));
      c.save();
      if(s&&s.id==="altar"){const A=Z.ALTAR_SCENE,dim=s.t<A.burst?Math.max(0,Math.min(1,(s.t-A.converge)/1.2))*.4:0;if(dim>0){c.fillStyle="rgba(20,8,40,"+dim+")";c.fillRect(0,0,W,H);}}
      // La pantalla se va a blanco justo antes del cambio de zona, y el destello la devuelve.
      if(s&&s.id==="portal"&&!s.arrived){const f=(s.t-(Z.PORTAL_SCENE.travel-.35))/.35;if(f>0){c.fillStyle="rgba(244,236,255,"+Math.min(1,f)+")";c.fillRect(0,0,W,H);}}
      if(s&&s.flashAt!==undefined){const f=1-(s.t-s.flashAt)/.9;if(f>0){c.fillStyle="rgba("+s.flashColor+","+f+")";c.fillRect(0,0,W,H);}}
      if(bar>0){rect(c,0,0,W,bar,"#050308");rect(c,0,H-bar,W,bar,"#050308");}
      const l=s&&s.line;
      if(l){
        const shown=Math.min(l.text.length,Math.max(0,Math.floor((s.t-l.at)*(Z.CUTSCENE_CPS||32)))),zak=l.speaker==="Zak";
        // El texto se parte una sola vez, con la frase completa: así no salta de renglón mientras se escribe.
        const bw=Math.min(W-32,470),rows=dialogLines(l.text,bw-28),bh=44+Math.max(0,rows.length-2)*14,bx=Math.round((W-bw)/2),by=H-bar-bh-10,accent=zak?"#a77bff":"#e7be72";
        c.globalAlpha=.94;rect(c,bx-2,by-2,bw+4,bh+4,"#050308");rect(c,bx,by,bw,bh,"#1a1424");c.globalAlpha=1;rect(c,bx,by,bw,2,accent);
        if(l.speaker){const nw=Px.textWidth(l.speaker.toUpperCase(),8)+14;rect(c,bx+10,by-9,nw,13,"#050308");rect(c,bx+11,by-8,nw-2,11,accent);Px.text(c,l.speaker.toUpperCase(),bx+17,by-2,"#120f18",8,"left",accent);}
        let left=shown;rows.forEach((text,i)=>{if(left>0)pixelText(c,text.slice(0,left),bx+13,by+(rows.length>1?15:22)+i*14,"#f1e8d4",9,"left");left-=text.length+1;});
        if(shown>=l.text.length&&Math.sin(time*6)>0)pixelText(c,game.touchMode?"▸":"E ▸",bx+bw-8,by+bh-9,accent,9,"right");
      }
      c.restore();
    }
    // Rayos de la Tormenta de agonía y portal de salida del trono.
    drawThroneHazards(c,game,time) {
      for(const b of game.bolts||[]){const k=1-b.t/b.max,pulse=.4+Math.abs(Math.sin(time*16))*.4;
        c.save();c.globalAlpha=.25+k*.35;c.fillStyle="#7b3fd0";c.beginPath();c.ellipse(b.x,b.y,24,18,0,0,Math.PI*2);c.fill();
        c.globalAlpha=pulse;c.strokeStyle="#e6d6ff";c.lineWidth=2;c.beginPath();c.ellipse(b.x,b.y,24*k,18*k,0,0,Math.PI*2);c.stroke();c.restore();}
      const ex=game.exitPortal,s=game.cutscene;
      if(ex){
        // Cuando Zak lo cierra, el portal se encoge girando cada vez más rápido.
        const k=s&&s.closing!==undefined?Math.max(0,1-(s.t-s.closing)/1.2):1;
        if(k>0){c.save();c.translate(Math.round(ex.x),Math.round(ex.y));Px.scale=k;drawPortal(c,0,0,time*(1+(1-k)*5),"#7fe6f2");Px.scale=1;c.restore();}
        if(!s)pixelText(c,Math.ceil(ex.time)+" s",ex.x,ex.y-46,ex.time<10?"#ff8f7a":"#e6f7ff",9);
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
      else if(e.type==="bolt"){
        c.globalAlpha=1-progress;c.strokeStyle="#e6d6ff";c.lineWidth=3;c.beginPath();let bx=x,by=y-180;c.moveTo(bx,by);
        for(let k=1;k<=6;k++){bx=x+(hash(k,Math.floor(x),Math.floor(y))-.5)*18;by=y-180+k*30;c.lineTo(bx,by);}c.stroke();
        c.strokeStyle="#a77bff";c.lineWidth=7;c.globalAlpha=(1-progress)*.4;c.stroke();
        c.globalAlpha=(1-progress)*.6;c.fillStyle="#c9a6ff";c.beginPath();c.ellipse(x,y,26,18,0,0,Math.PI*2);c.fill();
      } else if(e.type==="speech"){
        c.globalAlpha=Math.min(1,(e.life||0)*2);
        const width=Px.textWidth(e.text,7)+12;rect(c,x-width/2,y-12,width,15,"#120f18");rect(c,x-width/2+1,y-11,width-2,13,"#2a2236");
        pixelText(c,e.text,x,y-4,"#e6d6ff",7);
      }
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
        // Medialuna de píxeles orientada hacia el golpe; el del jugador lo dibuja su animación.
        if(!e.own){
          const r=Math.max(12,(e.radius||24)*.55),a=e.ang===undefined?0:e.ang,head=a-1.2+2.4*Math.min(1,progress*1.6),tail=a-1.2+2.4*Math.max(0,progress*1.6-.5),outer=[],inner=[];
          for(let k=0;k<=7;k++){const t=k/7,an=tail+(head-tail)*t;outer.push([x+Math.cos(an)*r,y+Math.sin(an)*r]);inner.push([x+Math.cos(an)*(r-t*r*.4),y+Math.sin(an)*(r-t*r*.4)]);}
          if(head>tail)poly(c,outer.concat(inner.reverse()),"#f0e6bb");
        }
      } else if(e.type==="iceblast"){
        const R=e.radius||150,seed=Math.floor(e.seed||0),grow=1-(1-progress)*(1-progress),r=R*grow;
        c.globalAlpha=(1-progress)*.5;c.fillStyle="#9fe8ff";c.beginPath();c.ellipse(x,y-3,r,r*.75,0,0,Math.PI*2);c.fill();
        c.globalAlpha=1-progress;c.strokeStyle="#ffffff";c.lineWidth=3;c.beginPath();c.ellipse(x,y-3,r,r*.75,0,0,Math.PI*2);c.stroke();c.strokeStyle="#7fd8ff";c.lineWidth=2;c.beginPath();c.ellipse(x,y-3,r*.8,r*.6,0,0,Math.PI*2);c.stroke();
        // Picos de hielo que brotan del piso por toda el área.
        for(let k=0;k<26;k++){const an=hash(k,seed,4)*Math.PI*2,d=R*(.2+hash(k,seed,5)*.75);if(d>r)continue;const px=x+Math.cos(an)*d,py=y-3+Math.sin(an)*d*.75,tall=(8+hash(k,6)*16)*Math.sin(Math.min(1,progress*1.5)*Math.PI);c.globalAlpha=1-progress*.6;poly(c,[[px-4,py],[px,py-tall],[px+4,py]],"#5aa8d0");poly(c,[[px-2,py],[px-1,py-tall+1],[px+1,py]],"#e8fbff");}
        for(let k=0;k<22;k++){const an=hash(k,seed,8)*Math.PI*2,sp=R*(.3+hash(k,seed,9)*.9)*grow;c.globalAlpha=Math.max(0,1-progress*1.1);rect(c,x+Math.cos(an)*sp,y-16+Math.sin(an)*sp*.7-Math.sin(progress*Math.PI)*22+progress*progress*30,k%3?2:3,2,k%2?"#e8fbff":"#7fd8ff");}
        if(progress<.18){c.globalAlpha=(.18-progress)/.18*.9;Px.glow(c,x,y-30,70,"#d5f4ff",1);}
      } else if(e.type==="iceshatter"){
        const seed=Math.floor(e.seed||0);
        for(let k=0;k<14;k++){const an=hash(k,seed,3)*Math.PI*2,sp=8+hash(k,seed,6)*26;c.globalAlpha=1-progress;rect(c,x+Math.cos(an)*sp*progress,y+Math.sin(an)*sp*progress*.7+progress*progress*16,k%3?3:2,2,k%2?"#e8fbff":"#7fd8ff");}
      } else if(e.type==="corpse"){
        // Muerte: destello blanco, el cuerpo se encoge y salta en pedazos.
        const body=e.enemy;
        const shrink=progress<.25?1:Math.max(.05,1-(progress-.25)/.75);c.globalAlpha=1;
        if(progress<.7){
          c.save();c.translate(Math.round(x),Math.round(y));Px.scale=shrink;Px.mode="flash";
          if(body.dir==="left")c.scale(-1,1);
          if(BIG_BOSSES[body.type])bigBossBody(c,body,time,0);else if(body.type==="capo"||body.type==="yarara")bossBody(c,body,time,0);else enemyBody(c,body,time,0,x);
          Px.mode=null;Px.scale=1;c.restore();
        }
        const count=BIG_BOSSES[body.type]?26:12,height=BIG_BOSSES[body.type]?40:14,tint=SHARD[body.type]||"#e9e2cc";
        for(let k=0;k<count;k++){
          const a=hash(k,Math.floor(e.seed||0),6)*Math.PI*2,speed=14+hash(k,3,Math.floor(e.seed||0))*(BIG_BOSSES[body.type]?56:28),s=hash(k,9)>.6?3:2;
          c.globalAlpha=Math.max(0,1-progress*progress);
          rect(c,x+Math.cos(a)*speed*progress,y-height+Math.sin(a)*speed*.7*progress+progress*progress*height*1.5,s,s,k%3?tint:"#ffffff");
        }
      } else {
        const color=e.crit?"#ffd65c":e.type==="coin"?"#f4d36b":e.type==="heal"?"#b8d693":(e.type==="poison"||e.poison)?"#d3a7da":e.type==="miss"?"#bfe6f0":"#f1d0a3";
        if(e.text!==undefined){const pop=e.crit&&progress<.18?18:e.type==="heal"||e.type==="coin"?8:e.crit?12:9,rise=19+(1-(1-progress)*(1-progress))*24;Px.text(c,String(e.text),x,y-rise,color,pop,"center","#1f1712",true);}
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
    const bust=canvas.height<64,s=scale||(bust?2:Math.max(1,Math.floor(Math.min(canvas.width/17,canvas.height/29))));
    c.save();c.translate(Math.round(canvas.width/2),bust?s*29:canvas.height-5);Px.scale=s;
    drawCharacter(c,{x:0,y:0,characterId:id,dir:"down"},0,true);Px.scale=1;c.restore();
  }
  function drawMinimap(canvas,game) {
    if(!game.world)return;
    const c=canvas.getContext("2d"),w=canvas.width,h=canvas.height,world=game.world;
    const area=viewArea(world,game.biome),deep=!!area.id,enclosed=id=>!!(Z.ENCLOSED_ZONES&&Z.ENCLOSED_ZONES[id]);
    const inArea=(x,y)=>x>=area.x&&y>=area.y&&x<area.x+area.w&&y<area.y+area.h;
    const sx=(w-8)/area.w,sy=(h-8)/area.h;
    c.imageSmoothingEnabled=false;c.clearRect(0,0,w,h);
    rect(c,0,0,w,h,"#293b32");rect(c,3,3,w-6,h-6,deep?"#1c1e22":"#82916a");
    c.save();c.translate(-area.x*sx,-area.y*sy);
    for(const z of world.zones||[]){
      if(enclosed(z.id)!==deep||deep&&!(inArea(z.x,z.y)&&inArea(z.x+z.w-1,z.y+z.h-1)))continue;
      const col=z.id==="sanctum"?"#2e2740":z.id==="magic"?"#241d33":z.id==="dimension"?"#15131b":z.id==="cave"?"#59616b":z.id==="weeds"?"#a0a26a":z.id==="cave2"?"#3e424b":z.id==="cave3"?"#4a3c37":z.id==="altar"?"#4b5242":z.id==="throne"?"#1d1a24":"#789469";
      rect(c,4+z.x*sx,4+z.y*sy,z.w*sx,z.h*sy,col);
    }
    // Explicit ordering preserves the cave where it overlaps the village.
    const cave=world.zones?.find(z=>z.id==="cave");
    if(cave&&!deep)rect(c,4+cave.x*sx,4+cave.y*sy,cave.w*sx,cave.h*sy,"#59616b");
    for(const path of world.paths||[])if((path.y>=(Z.SURFACE_HEIGHT||1800))===deep&&(!deep||inArea(path.x+path.w/2,path.y+path.h/2)))rect(c,4+path.x*sx,4+path.y*sy,Math.max(1,path.w*sx),Math.max(1,path.h*sy),"#c5b180");
    for(const o of world.objects||[]){
      if(o.type==="house")rect(c,4+o.x*sx,4+o.y*sy,Math.max(2,o.w*sx),Math.max(2,o.h*sy),"#ad785c");
      if(o.type==="pond")rect(c,4+o.x*sx,4+o.y*sy,o.w*sx,o.h*sy,"#6294a0");
    }
    for(const p of world.pickups||[])if(!p.collected&&p.type!=="herb")rect(c,3+p.x*sx,3+p.y*sy,2,2,"#f4d385");
    for(const o of world.objects||[])if(o.type==="ore"&&!o.harvested&&(o.y>=(Z.SURFACE_HEIGHT||1800))===deep)rect(c,3+o.x*sx,3+o.y*sy,3,3,(ORE_COLORS[o.ore]||ORE_COLORS.stone).light);
    if(w>300){
      for(const o of world.objects||[])if(o.type==="stall")pixelText(c,"$",4+(o.x+o.w/2)*sx,4+o.y*sy-4,"#f4d36b",12);
      for(const o of world.objects||[])if(o.type==="forge")pixelText(c,"⚒",4+(o.x+o.w/2)*sx,4+o.y*sy-4,"#f4d36b",12);
      for(const o of world.objects||[])if(o.type==="stairs")pixelText(c,o.dir==="down"?"▼":"▲",4+(o.x+o.w/2)*sx,4+(o.y+o.h/2)*sy,"#f2c35a",12);
      for(const o of world.objects||[])if(o.type==="door"&&deep&&inArea(o.x,o.y))pixelText(c,"🗝",4+(o.x+o.w/2)*sx,4+o.y*sy,"#f2c94c",12);
      for(const o of world.objects||[])if(o.type==="well"&&o.dark&&deep&&inArea(o.x,o.y))pixelText(c,"≈",4+(o.x+o.w/2)*sx,4+o.y*sy,"#c9a6ff",14);
      for(const o of world.objects||[])if(o.type==="altar"&&!deep)pixelText(c,"✝",4+(o.x+o.w/2)*sx,4+o.y*sy-2,"#d8c2ff",12);
      for(const e of game.enemies||[])if(Z.ENEMY_TYPES[e.type]&&Z.ENEMY_TYPES[e.type].boss&&!e.summoned&&(deep?inArea(e.homeX,e.homeY):!enclosed(Z.biomeAt(e.homeX,e.homeY))))pixelText(c,e.dead?"✓":"☠",4+e.homeX*sx,4+e.homeY*sy,e.dead?"#bfe0a8":"#ff9b84",13);
    }
    if(game.player){const x=4+game.player.x*sx,y=4+game.player.y*sy;rect(c,x-2,y-2,5,5,"#344c3b");rect(c,x-1,y-1,3,3,"#fff0bd");}
    c.restore();
    if(w>300&&deep)pixelText(c,(area.name||"").toUpperCase(),w/2,22,"#e4ddd0",12);
    if(w>300&&!deep){
      const ax=v=>4+(v-area.x)*sx;
      pixelText(c,"PALIHUE CITY",ax(850),4+1260*sy,"#f3e9c1",11);
      pixelText(c,"CUEVA DEL ECO",ax(450),4+280*sy,"#e4ddd0",11);
      pixelText(c,"LOS YUYOS",ax(1950),4+900*sy,"#f1e5b6",11);
      pixelText(c,"ALTAR",ax(-390),4+1300*sy,"#d8c2ff",11);
      pixelText(c,"N",w-19,18,"#eadbb0",10);rect(c,w-20,27,2,15,"#ddc99a");
      poly(c,[[w-19,23],[w-24,30],[w-14,30]],"#ddc99a");
    }
    rect(c,0,0,w,1,"#b7ab7d");rect(c,0,h-1,w,1,"#b7ab7d");rect(c,0,0,1,h,"#b7ab7d");rect(c,w-1,0,1,h,"#b7ab7d");
  }
  Z.Renderer=Renderer;Z.drawPortrait=drawPortrait;Z.drawCharacter=drawCharacter;Z.drawEnemy=drawEnemy;Z.drawMinimap=drawMinimap;Z.drawSmithPortrait=drawSmithPortrait;Z.drawNpc=drawNpc;Z.dialogLines=dialogLines;
  Renderer.drawPortrait=drawPortrait;
})();

