/* ─────────────────────────────────────────────────────────────
   Réseau des outils — graphe force-directed, SVG, sans dépendance.
   Le site est servi tel quel par GitHub Pages : pas de bundler,
   pas de CDN. Le solveur tient en ~80 lignes, largement suffisant
   pour la vingtaine de nœuds du graphe.
   ───────────────────────────────────────────────────────────── */
(function () {
  const root = document.getElementById('tool-network');
  if (!root) return;

  const svg     = root.querySelector('.tn-svg');
  const gEdges  = svg.querySelector('.tn-edges');
  const gNodes  = svg.querySelector('.tn-nodes');
  const panel   = root.querySelector('.tn-panel');
  const legend  = root.querySelector('.tn-legend');

  const GH = 'https://github.com/OwenGriere/';

  // ── Modèle ────────────────────────────────────────────────
  // kind: 'tool'    → outil développé par Owen (nœud plein, cliquable)
  //       'dep'     → brique externe réutilisée (nœud creux)
  //       'data'    → donnée d'entrée (nœud carré, en pointillés)
  const NODES = [
    // Suite MOSNA
    { id:'mosna-gui',  label:'MOSNA GUI',       group:'mosna', kind:'tool', r:23,
      desc:'Graphical interface wrapping Tysserand and MOSNA, so wet-lab researchers can build and analyse spatial networks without writing code.',
      tags:['Python'], url:GH + 'MOSNA_GUI' },
    { id:'mosna-enh',  label:'MOSNA Enhanced',  group:'mosna', kind:'tool', r:23,
      desc:'MOSNA and the network-building step rewritten in Rust, with a new graphical interface — same analyses, far larger tissues.',
      tags:['Rust'], private:true },
    { id:'mosna-clu',  label:'MOSNA Cluster',   group:'mosna', kind:'tool', r:20,
      desc:'Job orchestration to run MOSNA on HPC clusters such as Genotoul, for cohort-scale batches.',
      tags:['Bash','Python'], private:true },

    // Segmentation
    { id:'cytoseg',    label:'CytoSeg',         group:'seg',   kind:'tool', r:21,
      desc:'Segmentation by ellipse optimisation, designed to isolate cancer-associated fibroblasts from marker signal.',
      tags:['Python'], private:true },
    { id:'pdacseg',    label:'PDACSeg',         group:'seg',   kind:'tool', r:21,
      desc:'Segmentation pipeline for spatial proteomics of PDAC tissues — from raw acquisition to labelled cells.',
      tags:['Python'], private:true },

    // Modélisation
    { id:'pdac-model', label:'PDAC Modeling',   group:'model', kind:'tool', r:24,
      desc:'Agent-based model of the pancreatic tumor microenvironment built on PhysiCell, simulating EMT, hypoxia and immunosuppression.',
      tags:['C++','Python'], private:true },
    { id:'synet',      label:'SyNetBuilder',    group:'model', kind:'tool', r:21,
      desc:'Reconstruction of synthetic cell networks that reproduce measured assortativity — a controlled null model for spatial statistics.',
      tags:['Python'], private:true },

    // Données & génomique
    { id:'anndata',    label:'AnnData Tools',   group:'data',  kind:'tool', r:22,
      desc:'Building and exploring AnnData objects, with Scanpy and Squidpy computations wired in. The common data layer between segmentation and network analysis.',
      tags:['Python','Rust'], private:true },
    { id:'morfee',     label:'MORFEE Wrapper',  group:'data',  kind:'tool', r:22,
      desc:'Nextflow pipeline wrapping MORFEE and ANNOVAR to annotate 5′UTR variants across VCF datasets of any size — up to 200,000 UK Biobank individuals.',
      tags:['Nextflow','Python','Bash'], private:true },

    // Briques externes
    { id:'tysserand',  label:'Tysserand',       group:'dep',   kind:'dep', r:15,
      desc:'Reference Python library for reconstructing spatial networks from cell coordinates.',
      url:'https://github.com/VeraPancaldiLab/tysserand' },
    { id:'mosna-pkg',  label:'MOSNA',           group:'dep',   kind:'dep', r:15,
      desc:'Python package for the statistical analysis of spatial omics networks — niches, assortativity, cross-patient comparison.',
      url:'https://github.com/VeraPancaldiLab/mosna' },
    { id:'physicell',  label:'PhysiCell',       group:'dep',   kind:'dep', r:15,
      desc:'Open-source agent-based simulation framework for multicellular systems.',
      url:'http://physicell.org/' },
    { id:'scanpy',     label:'Scanpy / Squidpy',group:'dep',   kind:'dep', r:15,
      desc:'Single-cell and spatial omics analysis toolkits built on the AnnData format.',
      url:'https://scanpy.readthedocs.io/' },
    { id:'morfee-r',   label:'MORFEE',          group:'dep',   kind:'dep', r:14,
      desc:'R package annotating variants that create upstream ORFs in 5′UTR regions (D.-A. Trégouët, Inserm Bordeaux).',
      url:'https://github.com/daltrega/MORFEE' },

    // Données d'entrée
    { id:'imaging',    label:'mIF / IMC imaging',   group:'input', kind:'data', r:16,
      desc:'Multiplex immunofluorescence and Imaging Mass Cytometry acquisitions of PDAC tissue sections.' },
    { id:'spatial',    label:'Spatial omics',       group:'input', kind:'data', r:16,
      desc:'Spatial transcriptomic and proteomic measurements — cell coordinates plus per-cell expression.' },
    { id:'vcf',        label:'VCF / UK Biobank',    group:'input', kind:'data', r:16,
      desc:'Population-scale variant call sets, including 200,000+ UK Biobank individuals.' }
  ];

  // rel: 'flow'  → la donnée circule d'un nœud vers l'autre
  //      'uses'  → dépendance logicielle
  //      'kin'   → variantes d'un même outil
  const EDGES = [
    ['imaging','cytoseg','flow'], ['imaging','pdacseg','flow'],
    ['spatial','anndata','flow'],
    ['cytoseg','anndata','flow'], ['pdacseg','anndata','flow'],
    ['scanpy','anndata','uses'],
    ['anndata','mosna-gui','flow'], ['anndata','mosna-enh','flow'], ['anndata','mosna-clu','flow'],
    ['tysserand','mosna-gui','uses'], ['tysserand','mosna-enh','uses'],
    ['mosna-pkg','mosna-gui','uses'], ['mosna-pkg','mosna-enh','uses'], ['mosna-pkg','mosna-clu','uses'],
    ['mosna-gui','mosna-enh','kin'], ['mosna-enh','mosna-clu','kin'],
    ['mosna-gui','synet','flow'], ['mosna-enh','pdac-model','flow'],
    ['physicell','pdac-model','uses'],
    ['synet','pdac-model','flow'],
    ['vcf','morfee','flow'], ['morfee-r','morfee','uses']
  ];

  const GROUPS = [
    { id:'mosna', label:'MOSNA suite' },
    { id:'seg',   label:'Segmentation' },
    { id:'model', label:'Modeling' },
    { id:'data',  label:'Data & genomics' },
    { id:'dep',   label:'Building blocks' },
    { id:'input', label:'Input data' }
  ];

  // ── Mise en page ──────────────────────────────────────────
  const W = 900, H = 600;
  svg.setAttribute('viewBox', `0 0 ${W} ${H}`);

  const byId = new Map(NODES.map(n => [n.id, n]));
  const links = EDGES.map(([s, t, rel]) => ({ source: byId.get(s), target: byId.get(t), rel }));

  // Degré : sert à la fois au tri visuel et au ressort de centrage.
  NODES.forEach(n => { n.deg = 0; });
  links.forEach(l => { l.source.deg++; l.target.deg++; });

  const neighbours = new Map(NODES.map(n => [n.id, new Set([n.id])]));
  links.forEach(l => {
    neighbours.get(l.source.id).add(l.target.id);
    neighbours.get(l.target.id).add(l.source.id);
  });

  // Encombrement réel d'un nœud : le disque, plus le libellé centré dessous.
  // La largeur est d'abord estimée d'après le nombre de caractères, puis
  // remplacée par la mesure exacte du texte une fois le SVG rendu.
  NODES.forEach(n => {
    const em = n.kind === 'tool' ? 5.7 : 5.2;
    n.hw = Math.max(n.r, n.label.length * em / 2 + 5);
    n.hh = n.r + 14;
  });

  // Position de départ en ellipse : évite les symétries dégénérées d'un départ aléatoire.
  NODES.forEach((n, i) => {
    const a = (i / NODES.length) * Math.PI * 2;
    n.x = W / 2 + Math.cos(a) * 210 + (Math.random() - .5) * 30;
    n.y = H / 2 + Math.sin(a) * 160 + (Math.random() - .5) * 30;
    n.vx = 0; n.vy = 0;
  });

  // Familles masquées via la légende (lu par fit()).
  const hidden = new Set();

  // Le graphe n'est pas connexe : la branche génomique (VCF → MORFEE) ne
  // partage aucune brique avec la branche spatiale. Traitées ensemble, la
  // répulsion les éloigne sans limite et le recadrage tasse alors la grosse
  // composante dans un coin. On les dispose donc séparément, puis on les
  // range côte à côte dans le cadre.
  let comps = [];
  function computeComponents() {
    const vis = NODES.filter(n => !hidden.has(n.group));
    const seen = new Set();
    comps = [];
    for (const start of vis) {
      if (seen.has(start.id)) continue;
      const queue = [start], group = [];
      seen.add(start.id);
      while (queue.length) {
        const n = queue.pop();
        group.push(n);
        for (const id of neighbours.get(n.id)) {
          const m = byId.get(id);
          if (seen.has(id) || hidden.has(m.group)) continue;
          seen.add(id); queue.push(m);
        }
      }
      comps.push(group);
    }
    comps.sort((a, b) => b.length - a.length);
    comps.forEach((c, i) => c.forEach(n => { n.comp = i; }));
  }
  // Nœud en cours de glissement : la simulation et le recadrage le laissent tranquille.
  let dragging = null;

  const LINK_DIST = { flow: 120, uses: 100, kin: 84 };

  // Ancrage horizontal par famille : donne au graphe une lecture de gauche
  // à droite qui suit la chaîne réelle (image → cellules → objet de données
  // → réseau → modèle). La force est faible : elle oriente la disposition
  // sans figer les nœuds sur des colonnes.
  const XPULL = { input: 0.09, seg: 0.28, data: 0.46, mosna: 0.66, model: 0.88 };

  // Marges de cadrage : plus larges à gauche/droite et en bas, car les
  // libellés sont centrés sous les nœuds et débordent de leur cercle.
  const PAD = { x: 78, top: 30, bottom: 44 };

  function step(alpha) {
    // Étendue courante du graphe : l'ancrage par famille s'exprime en
    // fraction de cette étendue, pas en pixels absolus — sinon il entrerait
    // en conflit avec le recadrage, qui recentre et redimensionne à chaque image.
    // Étendue et barycentre, mesurés par composante : l'ordre des familles
    // n'a de sens qu'à l'intérieur d'une même chaîne.
    const stats = comps.map(c => {
      let lo = Infinity, hi = -Infinity, sx = 0, sy = 0;
      for (const n of c) {
        if (n.x < lo) lo = n.x;
        if (n.x > hi) hi = n.x;
        sx += n.x; sy += n.y;
      }
      return { lo, w: Math.max(hi - lo, 1), gx: sx / c.length, gy: sy / c.length };
    });

    // Répulsion : O(n²) assumé, on est à moins de 20 nœuds.
    for (let i = 0; i < NODES.length; i++) {
      for (let j = i + 1; j < NODES.length; j++) {
        const a = NODES[i], b = NODES[j];
        let dx = b.x - a.x, dy = b.y - a.y;
        let d2 = dx * dx + dy * dy;
        if (d2 < 1) { d2 = 1; dx = Math.random() - .5; dy = Math.random() - .5; }
        const d = Math.sqrt(d2);
        // Force renforcée sous la distance de contact : ni les disques ni
        // les libellés qui les suivent ne doivent se chevaucher.
        // Deux composantes ne se repoussent pas : l'empaquetage leur réserve
        // déjà des zones disjointes du cadre.
        if (a.comp !== b.comp || hidden.has(a.group) || hidden.has(b.group)) continue;
        const min = a.r + b.r + 34;
        const f = (5400 + (d < min ? 11000 : 0)) / d2 * alpha;
        const ux = dx / d, uy = dy / d;
        // Répulsion volontairement aplatie : le cadre est en 3/2, un
        // graphe isotrope y laisserait de larges bandes vides sur les côtés.
        a.vx -= ux * f; a.vy -= uy * f * 0.55;
        b.vx += ux * f; b.vy += uy * f * 0.55;
      }
    }
    // Ressorts sur les arêtes
    for (const l of links) {
      const a = l.source, b = l.target;
      const dx = b.x - a.x, dy = b.y - a.y;
      const d = Math.hypot(dx, dy) || 1;
      const f = (d - LINK_DIST[l.rel]) * 0.05 * alpha;
      const ux = dx / d, uy = dy / d;
      a.vx += ux * f; a.vy += uy * f;
      b.vx -= ux * f; b.vy -= uy * f;
    }
    // Intégration
    for (const n of NODES) {
      if (hidden.has(n.group)) continue;
      if (n.fixed) { n.vx = n.vy = 0; continue; }
      // Les briques externes n'ont pas d'ancre : elles se posent d'elles-mêmes
      // à côté de l'outil qui les consomme.
      const st = stats[n.comp];
      if (!st) continue;
      const anchor = XPULL[n.group];
      if (anchor !== undefined) n.vx += (st.lo + st.w * anchor - n.x) * 0.10 * alpha;
      // Cohésion vers le barycentre de la composante : évite qu'un nœud
      // périphérique ne parte seul et n'étire toute la boîte englobante.
      n.vx += (st.gx - n.x) * 0.006 * alpha;
      n.vy += (st.gy - n.y) * 0.012 * alpha;
      n.vx *= 0.82; n.vy *= 0.82;
      n.x += n.vx; n.y += n.vy;
    }
    separate();
  }

  // Correction de position (et non de vitesse) : deux libellés ne doivent
  // jamais se superposer, même quand les ressorts tirent fort. On dégage
  // selon l'axe où le recouvrement est le plus faible.
  function separate() {
    for (let i = 0; i < NODES.length; i++) {
      for (let j = i + 1; j < NODES.length; j++) {
        const a = NODES[i], b = NODES[j];
        if (hidden.has(a.group) || hidden.has(b.group)) continue;
        const dx = b.x - a.x, dy = b.y - a.y;
        const ox = (a.hw + b.hw + 8) - Math.abs(dx);
        const oy = (a.hh + b.hh + 4) - Math.abs(dy);
        if (ox <= 0 || oy <= 0) continue;
        // Un nœud tenu par l'utilisateur ne bouge pas : l'autre encaisse tout.
        const wa = a.fixed ? 0 : 1, wb = b.fixed ? 0 : 1, tot = wa + wb;
        if (!tot) continue;
        if (ox < oy) {
          const push = dx < 0 ? -ox : ox;
          a.x -= push * wa / tot; b.x += push * wb / tot;
        } else {
          const push = dy < 0 ? -oy : oy;
          a.y -= push * wa / tot; b.y += push * wb / tot;
        }
      }
    }
  }

  // Recadrage : plutôt que de contraindre la simulation à la taille du
  // cadre — ce qui l'écrase — on la laisse trouver sa géométrie, puis on
  // ramène doucement l'ensemble au centre et à l'échelle du viewBox.
  // Les positions elles-mêmes sont transformées : les libellés gardent
  // donc leur taille, contrairement à un zoom sur le SVG.
  function fit(strength) {
    if (!comps.length) return;
    // Séparation minimale entre composantes, pour qu'on lise deux branches
    // distinctes et non un seul nuage.
    const GAP = 30;
    const availW = W - 2 * PAD.x - GAP * (comps.length - 1);
    const availH = H - PAD.top - PAD.bottom;
    const boxes = comps.map(bounds);
    const totalW = boxes.reduce((t, b) => t + b.w, 0) || 1;
    const maxH = Math.max(...boxes.map(b => b.h));

    // Une seule échelle pour toutes les composantes : en appliquer une par
    // composante grossirait la petite branche et fausserait la lecture des
    // distances, qui doivent rester comparables d'un bout à l'autre du graphe.
    // L'étirement anisotrope reste plafonné : un graphe force-dirigé est
    // naturellement plus haut que large alors que le cadre est en 3/2.
    const MAX_ANISO = 1.45;
    let sx = Math.min(availW / totalW, 1.8);
    let sy = Math.min(availH / maxH, 1.8);
    if (sx > sy * MAX_ANISO) sx = sy * MAX_ANISO;
    if (sy > sx * MAX_ANISO) sy = sx * MAX_ANISO;

    // Largeur restante répartie en gouttières égales, bords compris.
    const slack = Math.max(availW - totalW * sx, 0);
    const gutter = slack / (comps.length + 1);
    let x = PAD.x + gutter;
    comps.forEach((c, i) => {
      const w = boxes[i].w * sx;
      place(c, boxes[i], x + w / 2, PAD.top + availH / 2, sx, sy, strength);
      x += w + gutter + GAP;
    });
  }

  function bounds(nodes) {
    let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
    for (const n of nodes) {
      minX = Math.min(minX, n.x - n.r); maxX = Math.max(maxX, n.x + n.r);
      minY = Math.min(minY, n.y - n.r); maxY = Math.max(maxY, n.y + n.r);
    }
    return { minX, maxX, minY, maxY, w: Math.max(maxX - minX, 1), h: Math.max(maxY - minY, 1) };
  }

  // Recentre une composante sur (tcx, tcy) à l'échelle demandée.
  function place(nodes, b, tcx, tcy, sx, sy, strength) {
    const cx = (b.minX + b.maxX) / 2, cy = (b.minY + b.maxY) / 2;
    for (const n of nodes) {
      if (n.fixed) continue;
      n.x += (tcx + (n.x - cx) * sx - n.x) * strength;
      n.y += (tcy + (n.y - cy) * sy - n.y) * strength;
    }
  }

  function settle(iterations) {
    for (let i = 0; i < iterations; i++) {
      const a = Math.max(0.02, Math.pow(0.985, i));
      step(a);
      fit(0.14);
    }
    separate();
  }

  // ── Rendu ─────────────────────────────────────────────────
  const NS = 'http://www.w3.org/2000/svg';
  const el = (tag, attrs) => {
    const e = document.createElementNS(NS, tag);
    for (const k in attrs) e.setAttribute(k, attrs[k]);
    return e;
  };

  links.forEach(l => {
    l.el = el('line', { class: `tn-edge tn-edge-${l.rel}` });
    gEdges.appendChild(l.el);
  });

  NODES.forEach(n => {
    const g = el('g', {
      class: `tn-node tn-g-${n.group} tn-k-${n.kind}`,
      tabindex: '0', role: 'button',
      'aria-label': `${n.label} — ${n.desc}`
    });
    // Deux formes superposées : un fond opaque qui masque les arêtes passant
    // dessous, puis la forme teintée de la famille par-dessus.
    const mk = cls => n.kind === 'data'
      ? el('rect', { x: -n.r, y: -n.r, width: n.r * 2, height: n.r * 2, rx: 5, class: cls })
      : el('circle', { r: n.r, class: cls });
    g.appendChild(mk('tn-bg'));
    g.appendChild(mk('tn-shape'));
    const label = el('text', { class: 'tn-label', y: n.r + 15 });
    label.textContent = n.label;
    g.appendChild(label);
    n.el = g;
    gNodes.appendChild(g);
    // Remplace l'estimation par la largeur réelle du texte rendu.
    try {
      const w = label.getComputedTextLength();
      if (w > 0) n.hw = Math.max(n.r, w / 2 + 5);
    } catch (_) { /* on garde l'estimation */ }
  });

  function draw() {
    for (const l of links) {
      l.el.setAttribute('x1', l.source.x); l.el.setAttribute('y1', l.source.y);
      l.el.setAttribute('x2', l.target.x); l.el.setAttribute('y2', l.target.y);
    }
    for (const n of NODES) n.el.setAttribute('transform', `translate(${n.x},${n.y})`);
  }

  // ── Boucle de simulation ──────────────────────────────────
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  let alpha = 1, raf = null;

  function tick() {
    step(alpha);
    if (!dragging) fit(0.14);
    draw();
    alpha *= 0.975;
    if (alpha > 0.02) raf = requestAnimationFrame(tick);
    else { raf = null; alpha = 0; }
  }
  function reheat(a = 0.45) {
    alpha = Math.max(alpha, a);
    if (!raf) raf = requestAnimationFrame(tick);
  }

  // La disposition est résolue en une passe synchrone (quelques millisecondes
  // pour 17 nœuds) plutôt qu'au fil des images : une simulation animée dépend
  // du nombre d'images réellement rendues, et donnait des compositions
  // inégales selon la machine ou si l'onglet passait à l'arrière-plan.
  // L'animation ne sert donc plus qu'à l'apparition, et elle est en CSS.
  computeComponents();
  settle(420);
  draw();

  if (reduced) {
    root.classList.add('tn-in');
  } else {
    const io = new IntersectionObserver((entries, obs) => {
      entries.forEach(e => { if (e.isIntersecting) { root.classList.add('tn-in'); obs.disconnect(); } });
    }, { threshold: 0.15 });
    io.observe(root);
  }

  // ── Sélection & mise en avant ─────────────────────────────
  let active = null;

  function highlight(node) {
    active = node;
    const near = node ? neighbours.get(node.id) : null;
    root.classList.toggle('tn-focused', !!node);
    NODES.forEach(n => {
      n.el.classList.toggle('tn-on',  !!near && near.has(n.id));
      n.el.classList.toggle('tn-sel', node === n);
    });
    links.forEach(l => {
      l.el.classList.toggle('tn-on', !!node && (l.source === node || l.target === node));
    });
    renderPanel(node);
  }

  const PANEL_IDLE = `
    <span class="tn-p-eyebrow">Ecosystem</span>
    <p class="tn-p-hint">Hover or tap a node to see what it does and how it connects. Drag to rearrange, and use the legend to filter by family.</p>`;

  function renderPanel(n) {
    if (!n) { panel.innerHTML = PANEL_IDLE; return; }
    const group = GROUPS.find(g => g.id === n.group);
    const tags = (n.tags || []).map(t => `<span class="badge">${t}</span>`).join('');
    let action = '';
    if (n.url) {
      const label = n.kind === 'tool' ? 'View on GitHub &rarr;' : 'Learn more &rarr;';
      action = `<a class="tn-p-link" href="${n.url}" target="_blank" rel="noopener">${label}</a>`;
    } else if (n.private) {
      action = '<span class="tn-p-private">Private repository — available on request</span>';
    }
    panel.innerHTML = `
      <span class="tn-p-eyebrow tn-g-${n.group}">${group.label}</span>
      <h3 class="tn-p-title">${n.label}</h3>
      <p class="tn-p-desc">${n.desc}</p>
      ${tags ? `<div class="tn-p-tags">${tags}</div>` : ''}
      ${action}`;
  }
  renderPanel(null);

  NODES.forEach(n => {
    n.el.addEventListener('mouseenter', () => { if (!dragging) highlight(n); });
    n.el.addEventListener('focus',      () => highlight(n));
    n.el.addEventListener('click', e => {
      // Un clic ne doit pas suivre un glissé.
      if (moved) { moved = false; return; }
      highlight(n);
      if (e.detail === 2 && n.url) window.open(n.url, '_blank', 'noopener');
    });
    n.el.addEventListener('keydown', e => {
      if (e.key === 'Enter' && n.url) { e.preventDefault(); window.open(n.url, '_blank', 'noopener'); }
    });
  });
  svg.addEventListener('mouseleave', () => { if (!dragging) highlight(null); });

  // ── Glisser-déposer ───────────────────────────────────────
  let moved = false, pointerOffset = { x: 0, y: 0 };

  function svgPoint(evt) {
    const r = svg.getBoundingClientRect();
    return { x: (evt.clientX - r.left) / r.width * W, y: (evt.clientY - r.top) / r.height * H };
  }

  NODES.forEach(n => {
    n.el.addEventListener('pointerdown', e => {
      e.preventDefault();
      dragging = n; moved = false; n.fixed = true;
      const p = svgPoint(e);
      pointerOffset = { x: n.x - p.x, y: n.y - p.y };
      n.el.setPointerCapture(e.pointerId);
      root.classList.add('tn-dragging');
      highlight(n);
    });
    n.el.addEventListener('pointermove', e => {
      if (dragging !== n) return;
      const p = svgPoint(e);
      const nx = p.x + pointerOffset.x, ny = p.y + pointerOffset.y;
      if (Math.hypot(nx - n.x, ny - n.y) > 2) moved = true;
      n.x = nx; n.y = ny;
      draw();
      reheat(0.35);
    });
    const end = e => {
      if (dragging !== n) return;
      dragging = null; n.fixed = false;
      root.classList.remove('tn-dragging');
      try { n.el.releasePointerCapture(e.pointerId); } catch (_) {}
      reheat(0.3);
    };
    n.el.addEventListener('pointerup', end);
    n.el.addEventListener('pointercancel', end);
  });

  // ── Légende / filtre ──────────────────────────────────────

  GROUPS.forEach(g => {
    const b = document.createElement('button');
    b.className = `tn-leg tn-g-${g.id}`;
    b.type = 'button';
    b.setAttribute('aria-pressed', 'true');
    b.innerHTML = `<i class="tn-swatch"></i>${g.label}`;
    b.addEventListener('click', () => {
      hidden.has(g.id) ? hidden.delete(g.id) : hidden.add(g.id);
      b.setAttribute('aria-pressed', String(!hidden.has(g.id)));
      b.classList.toggle('tn-leg-off', hidden.has(g.id));
      applyFilter();
    });
    legend.appendChild(b);
  });

  function applyFilter() {
    NODES.forEach(n => {
      const off = hidden.has(n.group);
      n.el.classList.toggle('tn-hidden', off);
      n.el.setAttribute('tabindex', off ? '-1' : '0');
    });
    links.forEach(l => {
      l.el.classList.toggle('tn-hidden', hidden.has(l.source.group) || hidden.has(l.target.group));
    });
    if (active && hidden.has(active.group)) highlight(null);
    computeComponents();
    settle(200);
    draw();
  }

  // Bouton de réagencement
  root.querySelector('.tn-shuffle')?.addEventListener('click', () => {
    NODES.forEach((n, i) => {
      const a = (i / NODES.length) * Math.PI * 2 + Math.random();
      n.fixed = false;
      n.x = W / 2 + Math.cos(a) * 210; n.y = H / 2 + Math.sin(a) * 160;
      n.vx = n.vy = 0;
    });
    if (reduced) { settle(420); draw(); }
    else reheat(1);
  });
})();
