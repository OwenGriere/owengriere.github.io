/* ─────────────────────────────────────────────────────────────
   Réseau des outils — graphe force-dirigé, SVG, sans dépendance.
   Le site est servi tel quel par GitHub Pages : pas de bundler,
   pas de CDN. Le solveur est écrit ici, il n'a qu'une vingtaine
   de nœuds à placer.

   Pour ajouter un outil, ne toucher que le modèle ci-dessous
   (NODES / HULLS / EDGES) : tout le reste s'en déduit.
   ───────────────────────────────────────────────────────────── */
(function () {
  const root = document.getElementById('tool-network');
  if (!root) return;

  const svg    = root.querySelector('.tn-svg');
  const gHulls = svg.querySelector('.tn-hulls');
  const gEdges = svg.querySelector('.tn-edges');
  const gNodes = svg.querySelector('.tn-nodes');
  const panel  = root.querySelector('.tn-panel');
  const legend = root.querySelector('.tn-legend');

  const GH = 'https://github.com/OwenGriere/';

  // ── Modèle ────────────────────────────────────────────────
  // kind: 'tool' → outil développé par Owen (disque plein, cliquable)
  //       'dep'  → brique externe réutilisée (disque creux)
  //       'data' → jeu ou objet de données (carré en pointillés)
  //
  // lane: position visée sur l'axe horizontal, en fraction de la largeur
  //       de la composante. C'est ce qui donne au graphe une lecture de
  //       gauche à droite ; la force reste faible, elle oriente sans figer.
  const NODES = [
    // ── Données ──
    { id:'spatial', label:'Spatial omics', group:'data-obj', kind:'data', r:17, lane:0.02,
      desc:'Spatial transcriptomic and proteomic acquisitions of tissue sections — cell coordinates plus per-cell marker intensities.' },
    { id:'singlecell', label:'SingleCell', group:'data-obj', kind:'data', r:19, lane:0.38,
      desc:'The per-cell table produced by segmentation: coordinates, marker intensities and phenotypes. This is the common input every downstream branch reads from.' },
    { id:'vcf', label:'VCF / UK Biobank', group:'data-obj', kind:'data', r:17, lane:0.04,
      desc:'Population-scale variant call sets, including 200,000+ UK Biobank individuals.' },

    // ── Segmentation ──
    { id:'cytoseg', label:'CytoSeg', group:'seg', kind:'tool', r:21, lane:0.20,
      desc:'Segmentation by ellipse optimisation, designed to isolate cancer-associated fibroblasts from marker signal.',
      tags:['Python'], private:true },
    { id:'pdacseg', label:'PDACSeg', group:'seg', kind:'tool', r:21, lane:0.20,
      desc:'Segmentation pipeline for spatial proteomics of PDAC tissues — from raw acquisition to labelled cells.',
      tags:['Python'], private:true },

    // ── Suite MOSNA (dans le super-nœud g-mosna) ──
    { id:'mosna-gui', label:'MOSNA GUI', group:'mosna', kind:'tool', r:23,
      desc:'Graphical interface wrapping Tysserand and MOSNA, so wet-lab researchers can build and analyse spatial networks without writing code.',
      tags:['Python'], url:GH + 'MOSNA_GUI' },
    { id:'mosna-enh', label:'MOSNA Enhanced', group:'mosna', kind:'tool', r:23,
      desc:'MOSNA and the network-building step rewritten in Rust, with a new graphical interface — same analyses, far larger tissues.',
      tags:['Rust'], private:true },
    { id:'mosna-clu', label:'MOSNA Cluster', group:'mosna', kind:'tool', r:20,
      desc:'Job orchestration to run MOSNA on HPC clusters such as Genotoul, for cohort-scale batches.',
      tags:['Bash','Python'], private:true },
    { id:'tysserand', label:'Tysserand', group:'dep', kind:'dep', r:15,
      desc:'Reference Python library for reconstructing spatial networks from cell coordinates.',
      url:'https://github.com/VeraPancaldiLab/tysserand' },
    { id:'mosna-pkg', label:'MOSNA', group:'dep', kind:'dep', r:15,
      desc:'Python package for the statistical analysis of spatial omics networks — niches, assortativity, cross-patient comparison.',
      url:'https://github.com/VeraPancaldiLab/mosna' },

    // ── Objets de données & génomique ──
    { id:'anndata', label:'AnnData Tools', group:'data', kind:'tool', r:22, lane:0.60,
      desc:'Building and exploring AnnData objects from the single-cell table, ready for Scanpy and Squidpy computations.',
      tags:['Python','Rust'], private:true },
    { id:'scanpy', label:'Scanpy / Squidpy', group:'dep', kind:'dep', r:15, lane:0.84,
      desc:'Single-cell and spatial omics analysis toolkits built on the AnnData format.',
      url:'https://scanpy.readthedocs.io/' },
    { id:'morfee', label:'MORFEE Wrapper', group:'data', kind:'tool', r:22, lane:0.50,
      desc:'Nextflow pipeline wrapping MORFEE and ANNOVAR to annotate 5′UTR variants across VCF datasets of any size — up to 200,000 UK Biobank individuals.',
      tags:['Nextflow','Python','Bash'], private:true },
    { id:'morfee-r', label:'MORFEE', group:'dep', kind:'dep', r:14, lane:0.92,
      desc:'R package annotating variants that create upstream ORFs in 5′UTR regions (D.-A. Trégouët, Inserm Bordeaux).',
      url:'https://github.com/daltrega/MORFEE' },

    // ── Modélisation (dans le super-nœud g-model) ──
    { id:'pdac-model', label:'PDAC Modeling', group:'model', kind:'tool', r:24,
      desc:'Agent-based model of the pancreatic tumor microenvironment built on PhysiCell, simulating EMT, hypoxia and immunosuppression.',
      tags:['C++','Python'], private:true },
    { id:'synet', label:'SyNetBuilder', group:'model', kind:'tool', r:21,
      desc:'Reconstruction of synthetic cell networks that reproduce measured assortativity — a controlled null model for spatial statistics.',
      tags:['Python'], private:true },
    { id:'physicell', label:'PhysiCell', group:'dep', kind:'dep', r:15,
      desc:'Open-source agent-based simulation framework for multicellular systems.',
      url:'http://physicell.org/' }
  ];

  // Super-nœuds : un cercle tracé autour d'un groupe de nœuds. Leur position
  // et leur rayon sont dérivés des membres, ils ne sont pas simulés. Une arête
  // peut les prendre pour extrémité : elle s'attache alors au bord du cercle.
  const HULLS = [
    { id:'g-mosna', label:'MOSNA suite', group:'mosna', lane:0.62,
      desc:'Tysserand and MOSNA, plus the three tools built around them: a graphical interface, a Rust rewrite, and cluster execution. Together they turn a single-cell table into spatial networks and their statistics.',
      members:['mosna-gui','mosna-enh','mosna-clu','tysserand','mosna-pkg'] },
    { id:'g-model', label:'Modeling', group:'model', lane:0.84,
      desc:'Simulation side of the work: an agent-based PDAC model on top of PhysiCell, and the synthetic-network generator used to produce controlled null models.',
      members:['pdac-model','synet','physicell'] }
  ];

  // rel: 'flow'  → la donnée circule d'un nœud vers l'autre (trait plein)
  //      'uses'  → dépendance logicielle (tirets)
  //      'info'  → l'un renseigne l'autre sans échange direct (pointillés)
  const EDGES = [
    // Branche spatiale
    ['spatial','cytoseg','flow'], ['spatial','pdacseg','flow'],
    ['cytoseg','singlecell','flow'], ['pdacseg','singlecell','flow'],
    ['singlecell','g-mosna','flow'],
    ['singlecell','anndata','flow'], ['anndata','scanpy','flow'],
    ['singlecell','g-model','flow'],
    ['g-mosna','synet','info'],

    // Intérieur de la suite MOSNA
    ['tysserand','mosna-gui','uses'], ['tysserand','mosna-enh','uses'], ['tysserand','mosna-clu','uses'],
    ['mosna-pkg','mosna-gui','uses'], ['mosna-pkg','mosna-enh','uses'], ['mosna-pkg','mosna-clu','uses'],

    // Intérieur de la modélisation
    ['physicell','pdac-model','uses'],

    // Branche génomique
    ['vcf','morfee','flow'], ['morfee-r','morfee','uses']
  ];

  const GROUPS = [
    { id:'mosna',    label:'MOSNA suite' },
    { id:'seg',      label:'Segmentation' },
    { id:'model',    label:'Modeling' },
    { id:'data',     label:'Data & genomics' },
    { id:'dep',      label:'Building blocks' },
    { id:'data-obj', label:'Data' }
  ];

  // ── Structures dérivées ───────────────────────────────────
  const W = 900, H = 600;
  svg.setAttribute('viewBox', `0 0 ${W} ${H}`);

  const byId = new Map(NODES.map(n => [n.id, n]));
  HULLS.forEach(h => {
    h.isHull = true;
    h.x = W / 2; h.y = H / 2; h.r = 60;
    h.nodes = h.members.map(id => byId.get(id));
    h.nodes.forEach(n => { n.hull = h; });
    byId.set(h.id, h);
  });

  const links = EDGES.map(([s, t, rel]) => ({ a: byId.get(s), b: byId.get(t), rel }));

  // Voisinage, pour la mise en avant au survol et pour les composantes.
  // Une arête branchée sur un super-nœud relie en réalité chacun de ses membres.
  const expand = e => e.isHull ? e.nodes : [e];
  const neighbours = new Map(NODES.map(n => [n.id, new Set([n.id])]));
  const bond = (a, b) => { neighbours.get(a.id).add(b.id); neighbours.get(b.id).add(a.id); };
  for (const l of links) {
    for (const a of expand(l.a)) for (const b of expand(l.b)) bond(a, b);
  }
  // Appartenir au même super-nœud est en soi un lien. Sans cela, un filtre
  // qui coupe les arêtes internes scinderait le groupe en plusieurs
  // composantes — or elles sont empaquetées dans des zones disjointes du
  // cadre, ce qui déchirerait le cercle censé les entourer.
  for (const h of HULLS) {
    for (let i = 0; i < h.nodes.length; i++)
      for (let j = i + 1; j < h.nodes.length; j++) bond(h.nodes[i], h.nodes[j]);
  }

  // Familles masquées via la légende.
  const hidden = new Set();
  const visible = n => !hidden.has(n.group);
  // Nœud en cours de glissement : la simulation et le recadrage le laissent tranquille.
  let dragging = null;

  // Le graphe n'est pas connexe : la branche génomique (VCF → MORFEE) ne
  // partage aucune brique avec la branche spatiale. Traitées ensemble, la
  // répulsion les éloigne sans limite et le recadrage tasse alors la grosse
  // composante dans un coin. On les dispose donc séparément, puis on les
  // range côte à côte dans le cadre.
  let comps = [];
  function computeComponents() {
    const seen = new Set();
    comps = [];
    for (const start of NODES) {
      if (seen.has(start.id) || !visible(start)) continue;
      const queue = [start], group = [];
      seen.add(start.id);
      while (queue.length) {
        const n = queue.pop();
        group.push(n);
        for (const id of neighbours.get(n.id)) {
          const m = byId.get(id);
          if (seen.has(id) || !visible(m)) continue;
          seen.add(id); queue.push(m);
        }
      }
      comps.push(group);
    }
    comps.sort((a, b) => b.length - a.length);
    comps.forEach((c, i) => c.forEach(n => { n.comp = i; }));
  }

  // ── Forces ────────────────────────────────────────────────
  const LINK_DIST = { flow: 120, uses: 92, info: 215 };
  const PAD = { x: 78, top: 32, bottom: 46 };

  // Encombrement réel d'un nœud : le disque, plus le libellé centré dessous.
  // Largeur d'abord estimée d'après le nombre de caractères, puis remplacée
  // par la mesure exacte du texte une fois le SVG rendu.
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

  // Géométrie des super-nœuds, recalculée à chaque pas : centre au barycentre
  // des membres visibles, rayon assez grand pour englober leurs libellés.
  function updateHulls() {
    for (const h of HULLS) {
      h.live = h.nodes.filter(visible);
      // Un cercle autour d'un seul nœud ne veut rien dire : quand un filtre
      // ne laisse qu'un membre, on efface le groupe plutôt que de l'entourer.
      h.on = h.live.length > 1;
      if (!h.on) { h.r = 0; continue; }
      let cx = 0, cy = 0;
      for (const m of h.live) { cx += m.x; cy += m.y; }
      h.x = cx / h.live.length; h.y = cy / h.live.length;
      // Rayon au plus juste : on ajoute, pour chaque membre, l'extension de sa
      // boîte dans la direction radiale — et non son plus grand côté, qui
      // gonflait le cercle d'une demi-largeur de libellé dans toutes les
      // directions, y compris à la verticale où le texte ne déborde pas.
      let r = 0;
      for (const m of h.live) {
        const dx = m.x - h.x, dy = m.y - h.y;
        const d = Math.hypot(dx, dy) || 1;
        r = Math.max(r, d + Math.abs(dx / d) * m.hw + Math.abs(dy / d) * m.hh);
      }
      h.r = r + 14;
    }
  }

  // Une arête branchée sur un super-nœud pousse ses membres, pas un point fictif.
  function push(e, fx, fy) {
    if (!e.isHull) { e.vx += fx; e.vy += fy; return; }
    const k = e.live.length || 1;
    for (const m of e.live) { m.vx += fx / k; m.vy += fy / k; }
  }
  const alive = e => e.isHull ? e.on : visible(e);

  function step(alpha) {
    updateHulls();

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
        // Deux composantes ne se repoussent pas : l'empaquetage leur réserve
        // déjà des zones disjointes du cadre.
        if (a.comp !== b.comp || !visible(a) || !visible(b)) continue;
        let dx = b.x - a.x, dy = b.y - a.y;
        let d2 = dx * dx + dy * dy;
        if (d2 < 1) { d2 = 1; dx = Math.random() - .5; dy = Math.random() - .5; }
        const d = Math.sqrt(d2);
        // Deux membres d'un même super-nœud doivent rester groupés : on
        // atténue la répulsion entre eux, sinon le cercle enfle démesurément.
        const same = a.hull && a.hull === b.hull;
        const min = a.r + b.r + 34;
        const f = ((same ? 1500 : 5400) + (d < min ? 11000 : 0)) / d2 * alpha;
        const ux = dx / d, uy = dy / d;
        // Répulsion volontairement aplatie : le cadre est en 3/2, un graphe
        // isotrope y laisserait de larges bandes vides sur les côtés.
        a.vx -= ux * f; a.vy -= uy * f * 0.55;
        b.vx += ux * f; b.vy += uy * f * 0.55;
      }
    }

    // Ressorts sur les arêtes. Quand une extrémité est un super-nœud, la
    // longueur au repos part du bord du cercle et non de son centre.
    for (const l of links) {
      const a = l.a, b = l.b;
      if (!alive(a) || !alive(b)) continue;
      const dx = b.x - a.x, dy = b.y - a.y;
      const d = Math.hypot(dx, dy) || 1;
      const rest = LINK_DIST[l.rel] + (a.isHull ? a.r : 0) + (b.isHull ? b.r : 0);
      const f = (d - rest) * 0.05 * alpha;
      const ux = dx / d, uy = dy / d;
      push(a,  ux * f,  uy * f);
      push(b, -ux * f, -uy * f);
    }

    // Cohésion interne des super-nœuds
    for (const h of HULLS) {
      if (!h.on) continue;
      for (const m of h.live) {
        m.vx += (h.x - m.x) * 0.055 * alpha;
        // Cible légèrement décalée vers le bas : garde la bande haute du
        // cercle libre pour son titre, qui est écrit à l'intérieur.
        m.vy += (h.y + 10 - m.y) * 0.055 * alpha;
      }
    }

    // Ancrage horizontal, cohésion de composante, intégration
    for (const n of NODES) {
      if (!visible(n)) continue;
      if (n.fixed) { n.vx = n.vy = 0; continue; }
      const st = stats[n.comp];
      if (!st) continue;
      // Les membres d'un super-nœud suivent l'ancrage du groupe, pas le leur :
      // leur agencement interne reste libre.
      const lane = n.hull ? n.hull.lane : n.lane;
      const from = n.hull ? n.hull.x : n.x;
      if (lane !== undefined) n.vx += (st.lo + st.w * lane - from) * 0.10 * alpha;
      // Cohésion vers le barycentre de la composante : évite qu'un nœud
      // périphérique ne parte seul et n'étire toute la boîte englobante.
      n.vx += (st.gx - n.x) * 0.006 * alpha;
      n.vy += (st.gy - n.y) * 0.012 * alpha;
      n.vx *= 0.82; n.vy *= 0.82;
      n.x += n.vx; n.y += n.vy;
    }

    updateHulls();
    separate();
  }

  // Correction de position (et non de vitesse) : deux libellés ne doivent
  // jamais se superposer, et rien d'étranger ne doit entrer dans un cercle
  // de super-nœud. On dégage selon l'axe où le recouvrement est le plus faible.
  function separate() {
    for (let i = 0; i < NODES.length; i++) {
      for (let j = i + 1; j < NODES.length; j++) {
        const a = NODES[i], b = NODES[j];
        if (!visible(a) || !visible(b)) continue;
        const dx = b.x - a.x, dy = b.y - a.y;
        const ox = (a.hw + b.hw + 8) - Math.abs(dx);
        const oy = (a.hh + b.hh + 4) - Math.abs(dy);
        if (ox <= 0 || oy <= 0) continue;
        // Un nœud tenu par l'utilisateur ne bouge pas : l'autre encaisse tout.
        const wa = a.fixed ? 0 : 1, wb = b.fixed ? 0 : 1, tot = wa + wb;
        if (!tot) continue;
        if (ox < oy) {
          const p = dx < 0 ? -ox : ox;
          a.x -= p * wa / tot; b.x += p * wb / tot;
        } else {
          const p = dy < 0 ? -oy : oy;
          a.y -= p * wa / tot; b.y += p * wb / tot;
        }
      }
    }

    updateHulls();

    // Dégagement autour des super-nœuds : un nœud extérieur qui empiète sur
    // le cercle rendrait l'appartenance au groupe illisible.
    for (const h of HULLS) {
      if (!h.on) continue;
      for (const n of NODES) {
        if (n.hull === h || !visible(n) || n.fixed) continue;
        const dx = n.x - h.x, dy = n.y - h.y;
        const d = Math.hypot(dx, dy) || 1;
        const want = h.r + Math.max(n.hw, n.hh) + 10;
        if (d >= want) continue;
        const k = (want - d) * 0.6;
        n.x += dx / d * k; n.y += dy / d * k;
      }
    }

    // Deux super-nœuds ne doivent pas se chevaucher non plus.
    for (let i = 0; i < HULLS.length; i++) {
      for (let j = i + 1; j < HULLS.length; j++) {
        const a = HULLS[i], b = HULLS[j];
        if (!a.on || !b.on) continue;
        const dx = b.x - a.x, dy = b.y - a.y;
        const d = Math.hypot(dx, dy) || 1;
        const want = a.r + b.r + 22;
        if (d >= want) continue;
        const k = (want - d) / 2 * 0.6, ux = dx / d, uy = dy / d;
        for (const m of a.live) if (!m.fixed) { m.x -= ux * k; m.y -= uy * k; }
        for (const m of b.live) if (!m.fixed) { m.x += ux * k; m.y += uy * k; }
      }
    }
    updateHulls();
  }

  // ── Recadrage ─────────────────────────────────────────────
  // Plutôt que de contraindre la simulation à la taille du cadre — ce qui
  // l'écrase — on la laisse trouver sa géométrie, puis on ramène doucement
  // l'ensemble au centre et à l'échelle du viewBox. Les positions elles-mêmes
  // sont transformées : les libellés gardent donc leur taille, contrairement
  // à un zoom sur le SVG.
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
    updateHulls();
  }

  // Boîte englobante d'une composante, libellés et cercles de super-nœuds compris.
  function bounds(nodes) {
    let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
    const seen = new Set();
    for (const n of nodes) {
      minX = Math.min(minX, n.x - n.hw); maxX = Math.max(maxX, n.x + n.hw);
      minY = Math.min(minY, n.y - n.r);  maxY = Math.max(maxY, n.y + n.hh);
      if (n.hull && n.hull.on && !seen.has(n.hull.id)) {
        seen.add(n.hull.id);
        const h = n.hull;
        minX = Math.min(minX, h.x - h.r); maxX = Math.max(maxX, h.x + h.r);
        minY = Math.min(minY, h.y - h.r); maxY = Math.max(maxY, h.y + h.r);
      }
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
      step(Math.max(0.02, Math.pow(0.985, i)));
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

  HULLS.forEach(h => {
    const g = el('g', { class: `tn-hull tn-g-${h.group}` });
    h.circle = el('circle', { class: 'tn-hull-ring' });
    h.text = el('text', { class: 'tn-hull-label' });
    h.text.textContent = h.label;
    g.appendChild(h.circle); g.appendChild(h.text);
    h.el = g;
    gHulls.appendChild(g);
  });

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
    for (const h of HULLS) {
      h.el.classList.toggle('tn-hidden', !h.on);
      if (!h.on) continue;
      h.circle.setAttribute('cx', h.x); h.circle.setAttribute('cy', h.y);
      h.circle.setAttribute('r', h.r);
      h.text.setAttribute('x', h.x); h.text.setAttribute('y', h.y - h.r + 15);
    }
    for (const l of links) {
      // Une arête branchée sur un super-nœud s'arrête au bord du cercle.
      const [x1, y1, x2, y2] = trim(l.a, l.b);
      l.el.setAttribute('x1', x1); l.el.setAttribute('y1', y1);
      l.el.setAttribute('x2', x2); l.el.setAttribute('y2', y2);
      l.el.classList.toggle('tn-hidden', !alive(l.a) || !alive(l.b));
    }
    for (const n of NODES) n.el.setAttribute('transform', `translate(${n.x},${n.y})`);
  }

  function trim(a, b) {
    const dx = b.x - a.x, dy = b.y - a.y;
    const d = Math.hypot(dx, dy) || 1;
    const ux = dx / d, uy = dy / d;
    const ra = a.isHull ? a.r : 0, rb = b.isHull ? b.r : 0;
    return [a.x + ux * ra, a.y + uy * ra, b.x - ux * rb, b.y - uy * rb];
  }

  // ── Boucle de simulation ──────────────────────────────────
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  let alpha = 0, raf = null;

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
  // pour une vingtaine de nœuds) plutôt qu'au fil des images : une simulation
  // animée dépend du nombre d'images réellement rendues, et donnait des
  // compositions inégales selon la machine ou si l'onglet passait à
  // l'arrière-plan. L'animation ne sert donc plus qu'à l'apparition, en CSS.
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
      // Le second argument de classList.toggle() doit être un vrai booléen :
      // avec `undefined` — ce que renvoie `e.isHull && …` sur un nœud ordinaire —
      // il bascule la classe au lieu de la forcer, et toutes les arêtes
      // s'allument. D'où le !! sur le prédicat comme sur le résultat.
      const touches = e => e === node || !!(e.isHull && e.nodes.includes(node));
      l.el.classList.toggle('tn-on', !!node && (touches(l.a) || touches(l.b)));
    });
    HULLS.forEach(h => h.el.classList.toggle('tn-on', !!node && h.nodes.includes(node)));
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
    const part = n.hull ? `<span class="tn-p-part">Part of ${n.hull.label}</span>` : '';
    panel.innerHTML = `
      <span class="tn-p-eyebrow tn-g-${n.group}">${group.label}</span>
      <h3 class="tn-p-title">${n.label}</h3>
      ${part}
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
      updateHulls();
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
      const off = !visible(n);
      n.el.classList.toggle('tn-hidden', off);
      n.el.setAttribute('tabindex', off ? '-1' : '0');
    });
    if (active && !visible(active)) highlight(null);
    computeComponents();
    // Relaxation synchrone, comme au premier rendu : compter sur l'animation
    // rendrait le résultat dépendant des images réellement rendues.
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
