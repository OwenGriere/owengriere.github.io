/* ─────────────────────────────────────────────────────────────
   Fond animé de l'en-tête d'accueil : un réseau de nœuds qui
   dérive lentement, parsemé de brins d'ADN (double hélice),
   d'ARN (simple brin et ses bases) et de protéines (chaîne de
   résidus repliée). Canvas 2D, sans dépendance.

   Les couleurs sont lues dans les variables CSS du thème et
   relues à chaque bascule clair / sombre.
   ───────────────────────────────────────────────────────────── */
(function () {
  const canvas = document.querySelector('.hero-canvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const host = canvas.parentElement;
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');

  const TAU = Math.PI * 2;
  const rand = (a, b) => a + Math.random() * (b - a);
  const pick = arr => arr[Math.floor(Math.random() * arr.length)];

  // ── Couleurs du thème ─────────────────────────────────────
  let C = {};
  function rgb(v) {
    v = v.trim();
    if (v.startsWith('#')) {
      if (v.length === 4) v = '#' + [...v.slice(1)].map(c => c + c).join('');
      const n = parseInt(v.slice(1), 16);
      return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
    }
    const m = v.match(/[\d.]+/g);
    return m ? m.slice(0, 3).map(Number) : [120, 120, 120];
  }
  function readTheme() {
    const s = getComputedStyle(document.documentElement);
    const dark = document.documentElement.getAttribute('data-theme') === 'dark';
    C = {
      accent: rgb(s.getPropertyValue('--accent')),
      warm:   rgb(s.getPropertyValue('--accent-warm')),
      muted:  rgb(s.getPropertyValue('--border-hi')),
      blue:   dark ? [95, 165, 201] : [47, 111, 143],
      violet: dark ? [157, 140, 208] : [107, 91, 149],
      k: dark ? 1.15 : 1   // les traits fins se lisent moins sur fond sombre
    };
  }
  const col = (c, a) => `rgba(${c[0]},${c[1]},${c[2]},${Math.min(1, a * C.k)})`;

  // ── Dimensions ────────────────────────────────────────────
  let W = 0, H = 0, dpr = 1;
  function resize() {
    const r = host.getBoundingClientRect();
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    W = r.width; H = r.height;
    canvas.width = Math.round(W * dpr);
    canvas.height = Math.round(H * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  // ── Objets ────────────────────────────────────────────────
  // Chaque objet a une position, une vitesse très faible, un angle et une
  // vitesse de rotation. Il réapparaît du côté opposé quand il sort du cadre.
  function drifter(size) {
    const a = rand(0, TAU), v = rand(.04, .12);
    return {
      x: rand(0, W), y: rand(0, H),
      vx: Math.cos(a) * v, vy: Math.sin(a) * v,
      rot: rand(0, TAU), vr: rand(-.0006, .0006),
      size, phase: rand(0, TAU)
    };
  }
  function move(o, dt) {
    o.x += o.vx * dt; o.y += o.vy * dt; o.rot += o.vr * dt;
    const m = o.size;
    if (o.x < -m) o.x = W + m; else if (o.x > W + m) o.x = -m;
    if (o.y < -m) o.y = H + m; else if (o.y > H + m) o.y = -m;
  }

  let nodes = [], dnas = [], rnas = [], prots = [];
  const NODE_COLORS = ['accent', 'accent', 'warm', 'blue', 'violet'];

  function makeDNA() {
    const o = drifter(140);
    o.len = rand(150, 260); o.amp = rand(11, 15); o.pitch = rand(42, 56);
    o.spin = rand(.0005, .0009) * (Math.random() < .5 ? -1 : 1);
    o.alpha = rand(.35, .6);
    // Une base par rung, choisie une fois pour toutes : la séquence ne change pas.
    o.bases = Array.from({ length: 40 }, () => pick([0, 1, 2, 3]));
    return o;
  }
  function makeRNA() {
    const o = drifter(120);
    o.len = rand(110, 190); o.amp = rand(6, 10); o.wave = rand(55, 80);
    o.alpha = rand(.35, .55);
    o.bases = Array.from({ length: 30 }, () => pick([0, 1, 2, 3]));
    // Un tiers des ARN forment une tige-boucle (hairpin) à leur extrémité.
    o.hairpin = Math.random() < .35;
    return o;
  }
  function makeProtein() {
    const o = drifter(70);
    // Chaîne de résidus en marche aléatoire à pas constant, légèrement
    // auto-évitante et rappelée vers le centre : on obtient un repliement compact.
    const n = Math.floor(rand(14, 24)), step = 9;
    const pts = [{ x: 0, y: 0 }];
    let ang = rand(0, TAU);
    for (let i = 1; i < n; i++) {
      let best = null;
      for (let t = 0; t < 8; t++) {
        const a = ang + rand(-1.3, 1.3);
        const p = { x: pts[i - 1].x + Math.cos(a) * step, y: pts[i - 1].y + Math.sin(a) * step };
        let clash = 0;
        for (let j = 0; j < i - 1; j++) if (Math.hypot(p.x - pts[j].x, p.y - pts[j].y) < step * .9) clash++;
        const score = clash * 100 + Math.hypot(p.x, p.y) * .35 + rand(0, 12);
        if (!best || score < best.score) best = { p, a, score };
      }
      pts.push(best.p); ang = best.a;
    }
    let cx = 0, cy = 0;
    pts.forEach(p => { cx += p.x; cy += p.y; });
    cx /= n; cy /= n;
    o.res = pts.map(p => ({
      x: p.x - cx, y: p.y - cy,
      r: rand(2, 3.6),
      c: pick(['accent', 'warm', 'violet', 'blue']),
      ph: rand(0, TAU)
    }));
    o.alpha = rand(.4, .65);
    return o;
  }

  function populate() {
    const area = W * H;
    const small = W < 640;
    // Nœuds répartis sur une grille perturbée : le réseau couvre tout
    // l'en-tête au lieu de former des amas et des trous.
    const cell = Math.sqrt(small ? 11000 : 8500);
    const cols = Math.ceil(W / cell), rows = Math.ceil(H / cell);
    nodes = [];
    for (let i = 0; i < cols; i++) for (let j = 0; j < rows; j++) {
      const o = drifter(10);
      o.x = (i + rand(.1, .9)) * cell;
      o.y = (j + rand(.1, .9)) * cell;
      o.r = rand(1.6, 3.2);
      o.c = pick(NODE_COLORS);
      nodes.push(o);
    }
    const k = small ? .5 : 1;
    dnas  = Array.from({ length: Math.max(1, Math.round(area / 260000 * k)) }, makeDNA);
    rnas  = Array.from({ length: Math.max(1, Math.round(area / 330000 * k)) }, makeRNA);
    prots = Array.from({ length: Math.max(1, Math.round(area / 300000 * k)) }, makeProtein);
  }

  // ── Dessin ────────────────────────────────────────────────
  const BASE = ['accent', 'warm', 'blue', 'violet'];
  // Paires complémentaires : A–T / G–C, et A–U / G–C pour l'ARN.
  const PAIR = [1, 0, 3, 2];

  function drawDNA(o, t) {
    const ca = Math.cos(o.rot), sa = Math.sin(o.rot);
    const tf = (u, v) => [o.x + u * ca - v * sa, o.y + u * sa + v * ca];
    const ph = o.phase + t * o.spin;
    const half = o.len / 2, steps = 60;
    // Atténuation aux extrémités pour que le brin ne paraisse pas coupé net.
    const fade = u => Math.min(1, (half - Math.abs(u)) / 30);

    // Barreaux (paires de bases), dessinés d'abord pour passer sous les brins.
    const rungGap = o.pitch / 5;
    let i = 0;
    for (let u = -half + rungGap / 2; u < half; u += rungGap, i++) {
      const a = (u / o.pitch) * TAU + ph;
      const y1 = Math.sin(a) * o.amp, y2 = -y1;
      const depth = Math.abs(Math.cos(a));
      const al = o.alpha * fade(u) * (.25 + .45 * depth);
      const [x1, yy1] = tf(u, y1), [xm, ym] = tf(u, 0), [x2, yy2] = tf(u, y2);
      const b = o.bases[i % o.bases.length];
      ctx.lineWidth = 1.4;
      ctx.strokeStyle = col(C[BASE[b]], al);
      ctx.beginPath(); ctx.moveTo(x1, yy1); ctx.lineTo(xm, ym); ctx.stroke();
      ctx.strokeStyle = col(C[BASE[PAIR[b]]], al);
      ctx.beginPath(); ctx.moveTo(xm, ym); ctx.lineTo(x2, yy2); ctx.stroke();
    }

    // Deux squelettes sucre-phosphate, déphasés de π. On les trace par petits
    // segments pour moduler l'épaisseur selon la profondeur apparente.
    for (const off of [0, Math.PI]) {
      let prev = null;
      for (let s = 0; s <= steps; s++) {
        const u = -half + (s / steps) * o.len;
        const a = (u / o.pitch) * TAU + ph + off;
        const p = tf(u, Math.sin(a) * o.amp);
        if (prev) {
          const front = Math.cos(a) > 0;
          ctx.lineWidth = front ? 2.1 : 1.1;
          ctx.strokeStyle = col(C.accent, o.alpha * fade(u) * (front ? 1 : .45));
          ctx.beginPath(); ctx.moveTo(prev[0], prev[1]); ctx.lineTo(p[0], p[1]); ctx.stroke();
        }
        prev = p;
      }
    }
  }

  function drawRNA(o, t) {
    const ca = Math.cos(o.rot), sa = Math.sin(o.rot);
    const tf = (u, v) => [o.x + u * ca - v * sa, o.y + u * sa + v * ca];
    const ph = o.phase + t * .0007;
    const half = o.len / 2, steps = 50;
    const fade = u => Math.min(1, (half - Math.abs(u)) / 25);
    const ys = u => Math.sin((u / o.wave) * TAU + ph) * o.amp
                  + Math.sin((u / o.wave) * TAU * .5 - ph * .7) * o.amp * .5;

    // Bases : courts bâtonnets perpendiculaires au brin, tous du même côté.
    let i = 0;
    for (let u = -half + 6; u < half - 4; u += 9, i++) {
      const y = ys(u), dy = (ys(u + 1) - ys(u - 1)) / 2;
      const nlen = Math.hypot(1, dy);
      const nx = -dy / nlen, ny = 1 / nlen;
      const [x0, y0] = tf(u, y), [x1, y1] = tf(u + nx * 7, y + ny * 7);
      ctx.lineWidth = 1.5;
      ctx.strokeStyle = col(C[BASE[o.bases[i % o.bases.length]]], o.alpha * fade(u) * .8);
      ctx.beginPath(); ctx.moveTo(x0, y0); ctx.lineTo(x1, y1); ctx.stroke();
    }

    ctx.lineWidth = 1.6;
    ctx.strokeStyle = col(C.warm, o.alpha);
    ctx.beginPath();
    for (let s = 0; s <= steps; s++) {
      const u = -half + (s / steps) * o.len;
      const [x, y] = tf(u, ys(u));
      s ? ctx.lineTo(x, y) : ctx.moveTo(x, y);
    }
    // Tige-boucle : le brin revient sur lui-même en refermant une petite boucle.
    if (o.hairpin) {
      const u = half, y = ys(u);
      const [cx, cy] = tf(u + 9, y + 8);
      const r = 9;
      const start = o.rot - Math.PI / 2 - .9;
      ctx.arc(cx, cy, r, start, start + TAU * .8);
    }
    ctx.stroke();
  }

  function drawProtein(o, t) {
    const ca = Math.cos(o.rot), sa = Math.sin(o.rot);
    // « Respiration » : chaque résidu oscille un peu autour de sa position.
    const pts = o.res.map(r => {
      const wob = Math.sin(t * .0011 + r.ph) * 1.6;
      const u = r.x + wob, v = r.y + Math.cos(t * .0009 + r.ph) * 1.6;
      return { x: o.x + u * ca - v * sa, y: o.y + u * sa + v * ca, r };
    });

    // Squelette : courbe lissée par les milieux des segments.
    ctx.lineWidth = 2.4;
    ctx.lineJoin = ctx.lineCap = 'round';
    ctx.strokeStyle = col(C.violet, o.alpha * .55);
    ctx.beginPath();
    ctx.moveTo(pts[0].x, pts[0].y);
    for (let i = 1; i < pts.length - 1; i++) {
      const mx = (pts[i].x + pts[i + 1].x) / 2, my = (pts[i].y + pts[i + 1].y) / 2;
      ctx.quadraticCurveTo(pts[i].x, pts[i].y, mx, my);
    }
    const last = pts[pts.length - 1];
    ctx.lineTo(last.x, last.y);
    ctx.stroke();

    // Résidus.
    for (const p of pts) {
      ctx.fillStyle = col(C[p.r.c], o.alpha * .9);
      ctx.beginPath(); ctx.arc(p.x, p.y, p.r.r, 0, TAU); ctx.fill();
    }
  }

  // Le réseau : nœuds reliés entre eux et aux molécules proches.
  const LINK = 135;
  function drawNetwork() {
    const hubs = [...dnas, ...rnas, ...prots];
    ctx.lineWidth = .9;
    for (let i = 0; i < nodes.length; i++) {
      const a = nodes[i];
      for (let j = i + 1; j < nodes.length; j++) {
        const b = nodes[j];
        const d = Math.hypot(a.x - b.x, a.y - b.y);
        if (d < LINK) {
          // Couleur de l'arête : moyenne des deux extrémités.
          const ca = C[a.c], cb = C[b.c];
          ctx.strokeStyle = col([(ca[0] + cb[0]) >> 1, (ca[1] + cb[1]) >> 1, (ca[2] + cb[2]) >> 1],
                                (1 - d / LINK) * .5);
          ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke();
        }
      }
      for (const h of hubs) {
        const d = Math.hypot(a.x - h.x, a.y - h.y);
        if (d < LINK * 1.1) {
          ctx.strokeStyle = col(C.accent, (1 - d / (LINK * 1.1)) * .3);
          ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(h.x, h.y); ctx.stroke();
        }
      }
    }
    for (const n of nodes) {
      // Halo discret puis disque plein.
      ctx.fillStyle = col(C[n.c], .14);
      ctx.beginPath(); ctx.arc(n.x, n.y, n.r * 2.4, 0, TAU); ctx.fill();
      ctx.fillStyle = col(C[n.c], .9);
      ctx.beginPath(); ctx.arc(n.x, n.y, n.r, 0, TAU); ctx.fill();
    }
  }

  function frame(t, dt) {
    ctx.clearRect(0, 0, W, H);
    for (const o of nodes) move(o, dt);
    for (const o of dnas) move(o, dt);
    for (const o of rnas) move(o, dt);
    for (const o of prots) move(o, dt);
    drawNetwork();
    for (const o of rnas) drawRNA(o, t);
    for (const o of prots) drawProtein(o, t);
    for (const o of dnas) drawDNA(o, t);
  }

  // ── Boucle ────────────────────────────────────────────────
  // On ne dessine que lorsque l'en-tête est visible et l'onglet actif.
  let raf = 0, last = 0, onScreen = true;
  function loop(now) {
    const dt = Math.min(50, now - (last || now)) / 16.67;
    last = now;
    frame(now, dt);
    raf = requestAnimationFrame(loop);
  }
  function start() {
    if (raf || !onScreen || document.hidden || reduced.matches) return;
    last = 0;
    raf = requestAnimationFrame(loop);
  }
  function stop() { cancelAnimationFrame(raf); raf = 0; }
  function still() { frame(performance.now(), 0); }

  function init() {
    readTheme();
    resize();
    populate();
    still();
    start();
  }

  new IntersectionObserver(([e]) => {
    onScreen = e.isIntersecting;
    onScreen ? start() : stop();
  }).observe(host);
  document.addEventListener('visibilitychange', () => document.hidden ? stop() : start());
  reduced.addEventListener?.('change', () => { stop(); still(); start(); });

  new MutationObserver(() => { readTheme(); if (!raf) still(); })
    .observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });

  let rt;
  new ResizeObserver(() => {
    clearTimeout(rt);
    rt = setTimeout(() => {
      const w = W, h = H;
      resize();
      // Repeupler seulement si la taille a beaucoup changé ; sinon on garde
      // les objets en place pour éviter un saut visuel.
      if (Math.abs(W - w) > 120 || Math.abs(H - h) > 120) populate();
      if (!raf) still();
    }, 120);
  }).observe(host);

  init();
})();
