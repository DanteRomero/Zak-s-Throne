/* Zak's Throne — herramientas de pixel art: todo cae en píxeles enteros, sin suavizado.
   Rectángulos y polígonos con escala de sprite, contorno y destello; trazos y rellenos sin antialiasing;
   fuente de píxeles propia; brillos y sombras con tramado (dither). */
(function () {
  "use strict";
  const Z = window.Zak = window.Zak || {};
  const Px = Z.Pixel = { scale: 1, mode: null, outlineColor: "#1b2321", flashColor: "#ffffff" };
  const BAYER = [[0, 8, 2, 10], [12, 4, 14, 6], [3, 11, 1, 9], [15, 7, 13, 5]].map(row => row.map(v => (v + .5) / 16));
  Px.bayer = (x, y) => BAYER[y & 3][x & 3];
  const translucent = color => color.length === 9 || color.length === 5 || color[0] === "r";

  // Pinta un bloque según el modo: normal, contorno (crece 1 px en cruz, sin esquinas) o destello.
  function paint(c, x, y, w, h, color) {
    if (Px.mode === "outline") {
      if (color && translucent(color)) return;
      c.fillStyle = Px.outlineColor; c.fillRect(x - 1, y, w + 2, h); c.fillRect(x, y - 1, w, h + 2); return;
    }
    if (Px.mode === "flash") { if (color && translucent(color)) return; c.fillStyle = Px.flashColor; }
    else if (color) c.fillStyle = color;
    c.fillRect(x, y, w, h);
  }
  Px.rect = (c, x, y, w, h, color) => {
    const S = Px.scale, x0 = Math.round(x * S), y0 = Math.round(y * S);
    let x1 = Math.round((x + w) * S), y1 = Math.round((y + h) * S);
    if (S !== 1) { if (x1 === x0 && w > 0) x1++; if (y1 === y0 && h > 0) y1++; }
    if (x1 !== x0 && y1 !== y0) paint(c, x0, y0, x1 - x0, y1 - y0, color);
  };

  // Relleno por barrido de líneas (par-impar). rings: listas planas [x0,y0,x1,y1,...].
  const crossings = [];
  function scan(rings, emit) {
    let top = Infinity, bottom = -Infinity;
    for (const ring of rings) for (let i = 1; i < ring.length; i += 2) { if (ring[i] < top) top = ring[i]; if (ring[i] > bottom) bottom = ring[i]; }
    if (!Number.isFinite(top) || !Number.isFinite(bottom)) return;
    for (let y = Math.floor(top); y < Math.ceil(bottom); y++) {
      const line = y + .5; crossings.length = 0;
      for (const ring of rings) {
        const n = ring.length;
        for (let i = 0; i < n; i += 2) {
          const ax = ring[i], ay = ring[i + 1], bx = ring[(i + 2) % n], by = ring[(i + 3) % n];
          if ((ay <= line) !== (by <= line)) crossings.push(ax + (line - ay) / (by - ay) * (bx - ax));
        }
      }
      crossings.sort((a, b) => a - b);
      for (let i = 0; i + 1 < crossings.length; i += 2) {
        const a = crossings[i], b = crossings[i + 1], x0 = Math.round(a); let x1 = Math.round(b);
        if (x1 === x0 && b - a > .2) x1 = x0 + 1;
        if (x1 > x0) emit(x0, y, x1 - x0);
      }
    }
  }
  Px.poly = (c, points, color) => {
    const S = Px.scale, ring = [];
    for (const p of points) ring.push(Math.round(p[0] * S), Math.round(p[1] * S));
    scan([ring], (x, y, w) => paint(c, x, y, w, 1, color));
  };
  // Rectángulo girado alrededor de (px,py): reemplaza a c.rotate, que deja bordes borrosos.
  Px.rrect = (c, px, py, angle, x, y, w, h, color) => {
    const cos = Math.cos(angle), sin = Math.sin(angle), at = (a, b) => [px + a * cos - b * sin, py + a * sin + b * cos];
    Px.poly(c, [at(x, y), at(x + w, y), at(x + w, y + h), at(x, y + h)], color);
  };
  // Línea de grosor entero, sin suavizado.
  Px.line = (c, x0, y0, x1, y1, color, width = 1) => {
    const dx = x1 - x0, dy = y1 - y0, steps = Math.max(1, Math.ceil(Math.max(Math.abs(dx), Math.abs(dy))));
    const off = Math.floor(width / 2);
    for (let i = 0; i <= steps; i++) Px.rect(c, Math.round(x0 + dx * i / steps) - off, Math.round(y0 + dy * i / steps) - off, width, width, i ? null : color);
  };
  // Sombra o mancha elíptica sin suavizado.
  Px.oval = (c, x, y, rx, ry, color) => {
    const top = Math.round(y - ry), rows = Math.max(1, Math.round(ry * 2));
    for (let i = 0; i < rows; i++) {
      const t = (i + .5) / rows * 2 - 1, half = Math.round(rx * Math.sqrt(Math.max(0, 1 - t * t)));
      if (half > 0) paint(c, Math.round(x) - half, top + i, half * 2, 1, color);
    }
  };

  // Hace que las rutas del contexto (arc, ellipse, stroke, fill...) se dibujen sin suavizado.
  Px.install = ctx => {
    let rings = [], current = null;
    const point = (x, y) => { if (!current) { current = { pts: [], closed: false }; rings.push(current); } current.pts.push(x * Px.scale, y * Px.scale); };
    ctx.beginPath = () => { rings = []; current = null; };
    ctx.moveTo = (x, y) => { current = null; point(x, y); };
    ctx.lineTo = point;
    ctx.closePath = () => { if (current) current.closed = true; current = null; };
    ctx.rect = (x, y, w, h) => { current = null; point(x, y); point(x + w, y); point(x + w, y + h); point(x, y + h); current.closed = true; current = null; };
    ctx.ellipse = (x, y, rx, ry, rotation, start, end, ccw = false) => {
      let sweep = end - start; const TAU = Math.PI * 2;
      if (ccw) sweep = -sweep;
      const full = Math.abs(sweep) >= TAU - 1e-6; if (!full && sweep < 0) sweep += TAU;
      if (ccw) sweep = -sweep; if (full) sweep = ccw ? -TAU : TAU;
      const detail = Math.max(10, Math.min(72, (Math.abs(rx) + Math.abs(ry)) * Px.scale * 1.1));
      const steps = Math.max(2, Math.ceil(Math.abs(sweep) / TAU * detail)), cos = Math.cos(rotation), sin = Math.sin(rotation);
      if (full) current = null;
      for (let i = 0; i <= steps - (full ? 1 : 0); i++) {
        const a = start + sweep * i / steps, ex = rx * Math.cos(a), ey = ry * Math.sin(a);
        point(x + ex * cos - ey * sin, y + ex * sin + ey * cos);
      }
      if (full) { current.closed = true; current = null; }
    };
    ctx.arc = (x, y, r, start, end, ccw) => ctx.ellipse(x, y, r, r, 0, start, end, ccw);
    ctx.fill = () => {
      if (Px.mode === "outline") return;
      scan(rings.map(r => r.pts), (x, y, w) => paint(ctx, x, y, w, 1));
    };
    ctx.stroke = () => {
      if (Px.mode === "outline") return;
      const half = Math.max(.5, (ctx.lineWidth || 1) / 2), dash = ctx.getLineDash(), rows = new Map();
      const segment = (ax, ay, bx, by) => {
        const len = Math.hypot(bx - ax, by - ay); if (!(len > 0)) return;
        const ux = (bx - ax) / len, uy = (by - ay) / len, grow = half > 1 ? half * .5 : 0, nx = -uy * half, ny = ux * half;
        const sx = ax - ux * grow, sy = ay - uy * grow, ex = bx + ux * grow, ey = by + uy * grow;
        scan([[sx + nx, sy + ny, ex + nx, ey + ny, ex - nx, ey - ny, sx - nx, sy - ny]], (x, y, w) => { let row = rows.get(y); if (!row) rows.set(y, row = []); row.push(x, x + w); });
      };
      for (const ring of rings) {
        const p = ring.pts, n = p.length / 2, count = ring.closed ? n : n - 1;
        let index = 0, left = dash.length ? dash[0] : Infinity, on = true;
        for (let i = 0; i < count; i++) {
          let ax = p[i * 2], ay = p[i * 2 + 1]; const bx = p[(i + 1) % n * 2], by = p[(i + 1) % n * 2 + 1];
          let len = Math.hypot(bx - ax, by - ay);
          while (len > left) {
            const k = left / len, mx = ax + (bx - ax) * k, my = ay + (by - ay) * k;
            if (on) segment(ax, ay, mx, my);
            ax = mx; ay = my; len -= left; on = !on; index = (index + 1) % dash.length; left = dash[index] || 1;
          }
          if (on) segment(ax, ay, bx, by);
          left -= len;
        }
      }
      // Se pinta la unión de los segmentos para que el alfa no se acumule en las uniones.
      const previous = ctx.fillStyle; ctx.fillStyle = ctx.strokeStyle;
      for (const [y, row] of rows) {
        const spans = [];
        for (let i = 0; i < row.length; i += 2) spans.push([row[i], row[i + 1]]);
        spans.sort((a, b) => a[0] - b[0]);
        let [x0, x1] = spans[0];
        for (let i = 1; i < spans.length; i++) {
          if (spans[i][0] <= x1) x1 = Math.max(x1, spans[i][1]);
          else { paint(ctx, x0, y, x1 - x0, 1); [x0, x1] = spans[i]; }
        }
        paint(ctx, x0, y, x1 - x0, 1);
      }
      ctx.fillStyle = previous;
    };
    return ctx;
  };

  const rgbOf = color => {
    const hex = color.replace("#", ""), full = hex.length === 3 ? [...hex].map(v => v + v).join("") : hex;
    return [parseInt(full.slice(0, 2), 16), parseInt(full.slice(2, 4), 16), parseInt(full.slice(4, 6), 16)];
  };
  Px.rgb = rgbOf;
  const layer = (w, h) => { const canvas = document.createElement("canvas"); canvas.width = w; canvas.height = h; return canvas; };
  Px.layer = layer;
  const cache = new Map();
  // Disco de luz con tramado; se calcula una vez por color y radio.
  Px.glow = (c, x, y, radius, color, alpha = 1) => {
    if (Px.mode === "outline" || alpha <= 0) return;
    const r = Math.max(2, Math.round(radius)), key = "g" + r + color;
    let sprite = cache.get(key);
    if (!sprite) {
      sprite = layer(r * 2, r * 2); const g = sprite.getContext("2d"), image = g.createImageData(r * 2, r * 2), [cr, cg, cb] = rgbOf(color), levels = 4;
      for (let py = 0; py < r * 2; py++) for (let px = 0; px < r * 2; px++) {
        const f = Math.max(0, 1 - Math.hypot(px + .5 - r, py + .5 - r) / r), v = f * f * levels, level = Math.min(levels, Math.floor(v + Px.bayer(px, py))), i = (py * r * 2 + px) * 4;
        image.data[i] = cr; image.data[i + 1] = cg; image.data[i + 2] = cb; image.data[i + 3] = level / levels * 255;
      }
      g.putImageData(image, 0, 0); cache.set(key, sprite);
    }
    const previous = c.globalAlpha; c.globalAlpha = previous * alpha; c.drawImage(sprite, Math.round(x) - r, Math.round(y) - r); c.globalAlpha = previous;
  };
  // Oscuridad o tinte alrededor de un punto. stops: [[radio,alfa],...] con radios crecientes.
  Px.shade = (c, x, y, W, H, stops, color, alpha = 1) => {
    const R = stops[stops.length - 1][0], key = "s" + color + stops.join("/");
    let sprite = cache.get(key);
    if (!sprite) {
      sprite = layer(R * 2, R * 2); const g = sprite.getContext("2d"), image = g.createImageData(R * 2, R * 2), [cr, cg, cb] = rgbOf(color), levels = 12;
      for (let py = 0; py < R * 2; py++) for (let px = 0; px < R * 2; px++) {
        const d = Math.hypot(px + .5 - R, py + .5 - R); let a = stops[stops.length - 1][1];
        for (let k = 0; k < stops.length; k++) {
          if (d <= stops[k][0]) { if (!k) a = stops[0][1]; else { const t = (d - stops[k - 1][0]) / (stops[k][0] - stops[k - 1][0]); a = stops[k - 1][1] + (stops[k][1] - stops[k - 1][1]) * t; } break; }
        }
        const v = a * levels, level = Math.min(levels, Math.floor(v + Px.bayer(px, py))), i = (py * R * 2 + px) * 4;
        image.data[i] = cr; image.data[i + 1] = cg; image.data[i + 2] = cb; image.data[i + 3] = level / levels * 255;
      }
      g.putImageData(image, 0, 0); cache.set(key, sprite);
    }
    const left = Math.round(x) - R, top = Math.round(y) - R, outer = stops[stops.length - 1][1], previous = c.globalAlpha;
    c.globalAlpha = previous * alpha; c.drawImage(sprite, left, top);
    if (outer > 0) {
      const [cr, cg, cb] = rgbOf(color); c.fillStyle = "rgba(" + cr + "," + cg + "," + cb + "," + outer + ")";
      if (top > 0) c.fillRect(0, 0, W, top);
      if (top + R * 2 < H) c.fillRect(0, top + R * 2, W, H - top - R * 2);
      const y0 = Math.max(0, top), y1 = Math.min(H, top + R * 2);
      if (y1 > y0) { if (left > 0) c.fillRect(0, y0, left, y1 - y0); if (left + R * 2 < W) c.fillRect(left + R * 2, y0, W - left - R * 2, y1 - y0); }
    }
    c.globalAlpha = previous;
  };

  /* ---------- Fuente de píxeles ---------- */
  const rows = text => text.split("/");
  const NORMAL = {
    A: ".##./#..#/#..#/####/#..#/#..#/#..#", B: "###./#..#/#..#/###./#..#/#..#/###.", C: ".###/#.../#.../#.../#.../#.../.###", D: "###./#..#/#..#/#..#/#..#/#..#/###.",
    E: "####/#.../#.../###./#.../#.../####", F: "####/#.../#.../###./#.../#.../#...", G: ".###/#.../#.../#.##/#..#/#..#/.###", H: "#..#/#..#/#..#/####/#..#/#..#/#..#",
    I: "###/.#./.#./.#./.#./.#./###", J: "..##/...#/...#/...#/...#/#..#/.##.", K: "#..#/#..#/#.#./##../#.#./#..#/#..#", L: "#.../#.../#.../#.../#.../#.../####",
    M: "#...#/##.##/#.#.#/#.#.#/#...#/#...#/#...#", N: "#..#/##.#/##.#/#.##/#.##/#..#/#..#", O: ".##./#..#/#..#/#..#/#..#/#..#/.##.", P: "###./#..#/#..#/###./#.../#.../#...",
    Q: ".##./#..#/#..#/#..#/#..#/#.#./.#.#", R: "###./#..#/#..#/###./#.#./#..#/#..#", S: ".###/#.../#.../.##./...#/...#/###.", T: "#####/..#../..#../..#../..#../..#../..#..",
    U: "#..#/#..#/#..#/#..#/#..#/#..#/.##.", V: "#...#/#...#/#...#/.#.#./.#.#./..#../..#..", W: "#...#/#...#/#...#/#.#.#/#.#.#/##.##/#...#", X: "#..#/#..#/.##./.##./.##./#..#/#..#",
    Y: "#...#/#...#/.#.#./..#../..#../..#../..#..", Z: "####/...#/..#./.#../.#../#.../####",
    a: "..../..../.##./...#/.###/#..#/.###", b: "#.../#.../###./#..#/#..#/#..#/###.", c: ".../.../.##/#../#../#../.##", d: "...#/...#/.###/#..#/#..#/#..#/.###",
    e: "..../..../.##./#..#/####/#.../.###", f: "..#/.#./###/.#./.#./.#./.#.", g: "..../..../.###/#..#/#..#/#..#/.###/...#/.##.", h: "#.../#.../###./#..#/#..#/#..#/#..#",
    i: "#/./#/#/#/#/#", "ı": "././#/#/#/#/#", j: "..#/.../..#/..#/..#/..#/..#/#.#/.#.", k: "#.../#.../#..#/#.#./##../#.#./#..#", l: "##/.#/.#/.#/.#/.#/.#",
    m: "...../...../####./#.#.#/#.#.#/#.#.#/#.#.#", n: "..../..../###./#..#/#..#/#..#/#..#", o: "..../..../.##./#..#/#..#/#..#/.##.", p: "..../..../###./#..#/#..#/#..#/###./#.../#...",
    q: "..../..../.###/#..#/#..#/#..#/.###/...#/...#", r: ".../.../#.#/##./#../#../#..", s: "..../..../.###/#.../.##./...#/###.", t: ".#./.#./###/.#./.#./.#./..#",
    u: "..../..../#..#/#..#/#..#/#..#/.###", v: "..../..../#..#/#..#/#..#/.##./.##.", w: "...../...../#...#/#.#.#/#.#.#/#.#.#/.#.#.", x: "..../..../#..#/#..#/.##./#..#/#..#",
    y: "..../..../#..#/#..#/#..#/#..#/.###/...#/.##.", z: "..../..../####/..#./.#../#.../####",
    0: ".##./#..#/#.##/#..#/##.#/#..#/.##.", 1: ".#./##./.#./.#./.#./.#./###", 2: ".##./#..#/...#/..#./.#../#.../####", 3: "###./...#/...#/.##./...#/...#/###.", 4: "#..#/#..#/#..#/####/...#/...#/...#",
    5: "####/#.../###./...#/...#/#..#/.##.", 6: ".##./#.../#.../###./#..#/#..#/.##.", 7: "####/...#/..#./..#./.#../.#../.#..", 8: ".##./#..#/#..#/.##./#..#/#..#/.##.", 9: ".##./#..#/#..#/.###/...#/...#/.##.",
    ".": "././././././#", ",": "../../../../../.#/.#/#.", ":": "././#/././#", ";": "../../.#/../../.#/#.", "!": "#/#/#/#/#/./#", "¡": "#/./#/#/#/#/#",
    "?": ".##./#..#/...#/..#./.#../..../.#..", "¿": "..#./..../..#./.#../#.../#..#/.##.", "-": ".../.../.../###", "+": "...../..#../..#../#####/..#../..#..", "/": "...#/..#./..#./.#../.#../#.../#...",
    "'": "#/#", '"': "#.#/#.#", "(": ".#/#./#./#./#./#./.#", ")": "#./.#/.#/.#/.#/.#/#.", "%": "#..#/...#/..#./..#./.#../.#../#..#", "=": ".../.../###/.../###", "*": ".../#.#/.#./#.#",
    "«": ".../.../.#.#/#.#./.#.#", "»": ".../.../#.#./.#.#/#.#.", "$": "..#../.####/#.#../.###./..#.#/####./..#..", "…": "...../...../...../...../...../...../#.#.#", "·": "./././#",
    "♪": "..##/..#./..#./..#./.##./###./.#..", "♫": ".####/.#..#/.#..#/.#..#/##.##/##.##", "☠": ".###./#####/#.#.#/#####/.###./.#.#.", "✦": "...#.../...#.../..###../#######/..###../...#.../...#...", "✧": "...#.../...#.../..#.#../###.###/..#.#../...#.../...#...",
    "▸": "#../##./###/##./#..", "▼": "#####/.###./..#..", "▲": "..#../.###./#####", "⚒": "##.##/####./.##../####./##.##", "✝": "..#../..#../#####/..#../..#../..#../..#..", "≈": "...../.##.#/#..#./...../.##.#/#..#.",
    "✓": "....#/....#/...#./#.#../.#...", "🗝": ".##..../#..#.../#..####/.##..##", "🦷": "#####/#####/#####/##.##/#...#", "💍": "..#../.###./#...#/#...#/#...#/.###.", "🩸": "..#../..#../.###./#####/#####/.###.", "🔮": ".###./#####/#####/.###./#####",
    "👁": ".###./#.#.#/#.#.#/.###.", "🌀": ".###./#...#/#.#.#/#..#./.##..", "◉": ".###./#...#/#.#.#/#...#/.###."
  };
  const TINY = {
    A: ".#./#.#/###/#.#/#.#", B: "##./#.#/##./#.#/##.", C: ".##/#../#../#../.##", D: "##./#.#/#.#/#.#/##.", E: "###/#../##./#../###", F: "###/#../##./#../#..", G: ".##/#../#.#/#.#/.##", H: "#.#/#.#/###/#.#/#.#", I: "###/.#./.#./.#./###",
    J: "..#/..#/..#/#.#/.#.", K: "#.#/#.#/##./#.#/#.#", L: "#../#../#../#../###", M: "#...#/##.##/#.#.#/#...#/#...#", N: "#..#/##.#/#.##/#..#/#..#", O: ".#./#.#/#.#/#.#/.#.", P: "##./#.#/##./#../#..", Q: ".#./#.#/#.#/##./.##", R: "##./#.#/##./#.#/#.#",
    S: ".##/#../.#./..#/##.", T: "###/.#./.#./.#./.#.", U: "#.#/#.#/#.#/#.#/###", V: "#.#/#.#/#.#/#.#/.#.", W: "#...#/#...#/#.#.#/##.##/#...#", X: "#.#/#.#/.#./#.#/#.#", Y: "#.#/#.#/.#./.#./.#.", Z: "###/..#/.#./#../###",
    0: "###/#.#/#.#/#.#/###", 1: ".#./##./.#./.#./###", 2: "##./..#/.#./#../###", 3: "##./..#/.#./..#/##.", 4: "#.#/#.#/###/..#/..#", 5: "###/#../##./..#/##.", 6: ".##/#../###/#.#/###", 7: "###/..#/.#./.#./.#.", 8: "###/#.#/###/#.#/###", 9: "###/#.#/###/..#/##.",
    ".": "././././#", ",": "../../../.#/#.", ":": "./#/./#/.", "!": "#/#/#/./#", "¡": "#/./#/#/#", "?": "##./..#/.#./.../.#.", "¿": ".#./.../.#./#../.##", "-": ".../.../###", "+": ".../.#./###/.#.", "/": "..#/..#/.#./#../#..", "'": "#/#", "«": ".../.#/#./.#", "»": ".../#./.#/#.", "(": ".#/#./#./#./.#", ")": "#./.#/.#/.#/#.", "$": ".##/##./.#./.##/##.", "…": ".../.../.../.../#.#", "·": "././#"
  };
  const ACCENTS = { "\u0301": ["..#", ".#."], "\u0303": ["#.#.", ".#.#"], "\u0308": ["#.#", "..."] };
  function compile(source, accent) {
    const glyph = { w: 0, runs: [] };
    const addRows = (list, offsetY, offsetX = 0) => list.forEach((row, ry) => {
      glyph.w = Math.max(glyph.w, row.length + offsetX);
      for (let i = 0; i < row.length; i++) if (row[i] === "#") { let n = 1; while (row[i + n] === "#") n++; glyph.runs.push(i + offsetX, ry + offsetY, n); i += n - 1; }
    });
    addRows(rows(source), 0);
    if (accent) addRows(accent.rows, accent.y, Math.max(0, Math.floor((glyph.w - accent.rows[0].length) / 2)));
    return glyph;
  }
  const compiled = { normal: new Map(), tiny: new Map() };
  function glyphFor(ch, tiny) {
    const store = tiny ? compiled.tiny : compiled.normal;
    if (store.has(ch)) return store.get(ch);
    const table = tiny ? TINY : NORMAL; let glyph = null, key = tiny ? ch.toUpperCase() : ch;
    if (key === " ") glyph = { w: tiny ? 2 : 3, runs: [] };
    else if (table[key]) glyph = compile(table[key]);
    else {
      const parts = key.normalize("NFD"), base = parts[0], mark = ACCENTS[parts[1]];
      if (parts.length > 1 && (tiny ? TINY[base] : NORMAL[base === "i" ? "ı" : base])) {
        const source = tiny ? TINY[base] : NORMAL[base === "i" ? "ı" : base], upper = base === base.toUpperCase();
        // En la letra chiquita solo la Ñ lleva marca: no hay lugar para tildes.
        glyph = compile(source, !mark || (tiny && parts[1] !== "\u0303") ? null : { rows: tiny ? [mark[0]] : mark, y: upper || tiny ? (tiny ? -2 : -3) : 0 });
      }
    }
    store.set(ch, glyph); return glyph;
  }
  const skip = ch => ch === "\uFE0F" || ch === "\u200D";
  Px.hasGlyph = (ch, size = 9) => skip(ch) || !!glyphFor(ch, size < 8);
  const styleFor = size => ({ tiny: size < 8, bold: size >= 12, zoom: size >= 18 ? 2 : 1 });
  Px.textWidth = (text, size = 9) => {
    const s = styleFor(size); let w = 0;
    for (const ch of Array.from(String(text))) {
      if (skip(ch)) continue;
      const g = glyphFor(ch, s.tiny); w += ((g ? g.w : size) + (s.bold ? 2 : 1)) * s.zoom;
    }
    return Math.max(0, w - s.zoom);
  };
  function run(c, list, x, y, zoom, bold) {
    for (const [ch, g] of list) {
      if (g) for (let i = 0; i < g.runs.length; i += 3) c.fillRect(x + g.runs[i] * zoom, y + g.runs[i + 1] * zoom, (g.runs[i + 2] + (bold ? 1 : 0)) * zoom, zoom);
      x += ((g ? g.w : 0) + (bold ? 2 : 1)) * zoom;
    }
  }
  // Texto con el mismo punto de anclaje que fillText con textBaseline "middle". halo: contorno completo.
  Px.text = (c, text, x, y, color = "#e4d6a2", size = 7, align = "center", dark = "#1f2925", halo = false) => {
    const s = styleFor(size), list = [];
    for (const ch of Array.from(String(text))) if (!skip(ch)) list.push([ch, glyphFor(ch, s.tiny)]);
    const width = Px.textWidth(text, size), height = (s.tiny ? 5 : 7) * s.zoom;
    const left = Math.round(align === "center" ? x - width / 2 : align === "right" || align === "end" ? x - width : x), top = Math.round(y - height / 2);
    c.fillStyle = dark;
    if (halo) { run(c, list, left - 1, top, s.zoom, s.bold); run(c, list, left + 1, top, s.zoom, s.bold); run(c, list, left, top - 1, s.zoom, s.bold); }
    run(c, list, left, top + 1, s.zoom, s.bold);
    c.fillStyle = color; run(c, list, left, top, s.zoom, s.bold);
    // Un signo sin dibujo propio cae en la letra del sistema para no perder información.
    let cursor = left;
    for (const [ch, g] of list) {
      if (!g) { c.font = size + 'px sans-serif'; c.textAlign = "left"; c.textBaseline = "middle"; c.fillStyle = color; c.fillText(ch, cursor, y); }
      cursor += ((g ? g.w : size) + (s.bold ? 2 : 1)) * s.zoom;
    }
  };

  /* ---------- Ruido para el terreno ---------- */
  const NOISE = new Float32Array(65536);
  { let seed = 1234567; for (let i = 0; i < 65536; i++) { seed = Math.imul(seed ^ seed >>> 15, 2246822519) + 3266489917 | 0; NOISE[i] = ((seed ^ seed >>> 13) >>> 0) / 4294967296; } }
  Px.noise = (x, y) => {
    const ix = Math.floor(x), iy = Math.floor(y), fx = x - ix, fy = y - iy, sx = fx * fx * (3 - 2 * fx), sy = fy * fy * (3 - 2 * fy);
    const a = NOISE[(ix & 255) | (iy & 255) << 8], b = NOISE[(ix + 1 & 255) | (iy & 255) << 8], d = NOISE[(ix & 255) | (iy + 1 & 255) << 8], e = NOISE[(ix + 1 & 255) | (iy + 1 & 255) << 8];
    return a + (b - a) * sx + (d - a) * sy + (a - b - d + e) * sx * sy;
  };
})();
