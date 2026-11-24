/* Editor de diagramas de arquitectura con corrección automática.
   Editor.mount(root, { caseId, key }) → { grade(), model } */
const Editor = (() => {
  const BW = 150, BH = 54, W = 1300, H = 900;
  const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  const short = n => n.replace(/^(Amazon|AWS) /, '');
  const typeName = t => t === 'actor' ? 'Actor' : SVC[t].name;
  const catOf = t => t === 'actor' ? 'cliente' : SVC[t].cat;
  const dims = (model, n) => { const k = (model.ns || 1) * (n.s || 1); return [BW * k, BH * k, k]; };
  const ENTRADAS = ['apigw', 'kinesis', 's3', 'amplify', 'appsync', 'cognito', 'route53', 'eventbridge'];

  function wrap(text, max) {
    const out = []; let cur = '';
    for (const w of String(text).split(' ')) { if ((cur + ' ' + w).trim().length > max && cur) { out.push(cur); cur = w; } else cur = (cur + ' ' + w).trim(); }
    if (cur) out.push(cur); return out.slice(0, 3);
  }

  /* ───── corrección ───── */
  function grade(model, caseId) {
    const G = caseId ? GRADING[caseId] : null, cs = caseId ? findCase(caseId) : null;
    const groups = model.groups || [];
    const center = n => { const [w, h] = dims(model, n); return [n.x + w / 2, n.y + h / 2]; };
    const inZone = (n, kind) => { const [cx, cy] = center(n); const kinds = kind === 'vpc' ? ['vpc', 'pub', 'priv'] : [kind]; return groups.some(g => kinds.includes(g.kind) && cx >= g.x && cx <= g.x + g.w && cy >= g.y && cy <= g.y + g.h); };
    const byId = Object.fromEntries(model.nodes.map(n => [n.id, n]));
    const E = model.edges.map(e => ({ ...e, ft: byId[e.from]?.type, tt: byId[e.to]?.type })).filter(e => e.ft && e.tt);
    const types = new Set(model.nodes.map(n => n.type));
    const res = { sections: [], pts: 0, max: 0 };

    if (cs) {   // 1. servicios clave (40 %)
      const items = cs.req.map(id => ({ ok: types.has(id), text: SVC[id].name }));
      const hit = items.filter(i => i.ok).length;
      res.sections.push({ title: `Servicios clave (${hit}/${cs.req.length})`, items: items.map(i => ({ st: i.ok ? 'ok' : 'bad', text: i.ok ? i.text : `Falta ${i.text}` })) });
      res.pts += 40 * hit / cs.req.length; res.max += 40;
    }
    if (G) {    // 2. conexiones esperadas (50 %)
      const all = [...G.conn.map(c => ({ ...c, kind: 'conn' })), ...(G.text || []).map(t => ({ ...t, kind: 'text' })), ...(G.inside || []).map(t => ({ ...t, zone: t.kind, kind: 'inside' }))];
      let got = 0;
      const items = all.map(c => {
        if (c.kind === 'text') {
          const ok = [...model.nodes.map(n => n.label), ...model.edges.map(e => e.label || '')].some(s => c.re.test(s));
          got += ok ? 1 : 0;
          return { st: ok ? 'ok' : 'bad', text: c.why, src: c.src };
        }
        if (c.kind === 'inside') {
          const zn = (ZONES[c.zone] || {}).name || c.zone;
          const ns = model.nodes.filter(n => c.types.includes(n.type) && (!c.label || c.label.test(n.label)));
          if (!ns.length) return { st: 'bad', text: `<b>Ubicación:</b> no hay nodos para revisar. ${c.why}` };
          const ok = ns.filter(n => inZone(n, c.zone));
          got += ok.length === ns.length ? 5 : 0;
          const bad = ns.filter(n => !inZone(n, c.zone)).map(n => '“' + n.label + '”');
          return { st: bad.length ? (ok.length ? 'warn' : 'bad') : 'ok', text: `<b>Dentro de ${zn}</b>: ${bad.length ? 'fuera: ' + bad.join(', ') + '. ' : ''}${c.why}` };
        }
        const need = c.min || 1;
        const n = E.filter(e => c.f.includes(e.ft) && c.t.includes(e.tt)).length;
        const rev = E.filter(e => c.t.includes(e.ft) && c.f.includes(e.tt)).length;
        const name = `${c.f.map(typeName).join(' / ')} → ${c.t.map(typeName).join(' / ')}`;
        if (n >= need) { got += 1; return { st: 'ok', text: `<b>${name}</b>${need > 1 ? ` (${n})` : ''}: ${c.why}`, src: c.src }; }
        if (n > 0) { got += n / need; return { st: 'warn', text: `<b>${name}</b>: tienes ${n} de ${need}. ${c.why}`, src: c.src }; }
        if (rev > 0) { got += 0.5; return { st: 'warn', text: `<b>${name}</b>: la flecha está al revés. ${c.why}`, src: c.src }; }
        return { st: 'bad', text: `<b>Falta ${name}</b>: ${c.why}`, src: c.src };
      });
      const total = all.reduce((t, c) => t + (c.kind === 'inside' ? 5 : 1), 0);
      res.sections.push({ title: `Conexiones, ubicación y anotaciones (${Math.round(got * 10) / 10}/${total})`, items });
      res.pts += 50 * got / total; res.max += 50;
    }

    // 3. buenas prácticas de clase (10 %, o 100 % en modo libre)
    const tips = [];
    const out = id => E.filter(e => e.from === id), inn = id => E.filter(e => e.to === id);
    for (const n of model.nodes) {
      const nm = `“${n.label}”`;
      if (!out(n.id).length && !inn(n.id).length && n.type !== 'cloudwatch') tips.push({ st: 'bad', text: `${nm} no está conectado a nada.` });
      if (n.type === 'sqs' && !out(n.id).length) tips.push({ st: 'bad', text: `La cola ${nm} no tiene consumidor: alguien debe leerla (“application to queue to application”).`, src: 'EV p.15' });
      if ((n.type === 'sns' || n.type === 'eventbridge') && !out(n.id).length) tips.push({ st: 'bad', text: `${nm} no entrega a nadie: un enrutador necesita suscriptores o consumidores.`, src: 'EV p.6, p.22' });
      if (n.type === 'kinesis' && out(n.id).some(e => e.tt !== 'lambda')) tips.push({ st: 'warn', text: `En clase Kinesis siempre dispara una Lambda que procesa el stream.`, src: 'SV p.20, p.22' });
      if (n.type === 'apigw' && !out(n.id).some(e => e.tt === 'lambda' || e.tt === 'fargate')) tips.push({ st: 'warn', text: `${nm} debería disparar una Lambda (lógica de negocio).`, src: 'SV p.15, p.21' });
    }
    for (const e of E) {
      const a = byId[e.from].label, b = byId[e.to].label;
      if (e.ft === 'actor' && ['dynamodb', 'aurora', 'rdsproxy', 'elasticache', 'neptune', 'redshift', 'opensearch'].includes(e.tt))
        tips.push({ st: 'bad', text: `“${a}” accede directo a la base de datos “${b}”. En clase el cliente pasa por API Gateway → Lambda.`, src: 'SV p.21' });
      if (e.ft === 'actor' && e.tt === 'lambda')
        tips.push({ st: 'warn', text: `“${a}” llama directo a la Lambda “${b}”. En clase la entrada es API Gateway (REST), Kinesis (stream) o S3 (archivo).`, src: 'SV p.19–23' });
      if (e.ft === 'vpclink' && e.tt === 'lambda')
        tips.push({ st: 'warn', text: `“${a}” → “${b}”: una Lambda no necesita VPC Link. API Gateway la invoca directamente. El VPC Link es para contenedores o EC2 detrás de un balanceador interno.`, src: 'fuera de las diapositivas' });
      if (e.ft === 'lambda' && e.tt === 'lambda')
        tips.push({ st: 'warn', text: `“${a}” → “${b}” es una llamada directa entre funciones: síncrona y acoplada. Si no necesitas la respuesta, usa una cola o un evento.`, src: 'EV p.16–19' });
    }
    for (const n of model.nodes) if (['lambda', 'ecs', 'ec2', 'fargate', 'eks', 'rds', 'aurora'].includes(n.type) && inZone(n, 'pub') && !inZone(n, 'priv'))
      tips.push({ st: 'bad', text: `“${n.label}” está en una subnet pública: el cómputo y las bases de datos van en subnets privadas.`, src: 'fuera de las diapositivas' });
    for (const n of model.nodes) if (n.type === 'nat' && groups.length && !inZone(n, 'pub')) tips.push({ st: 'warn', text: 'El NAT Gateway debe estar en una subnet pública.', src: 'fuera de las diapositivas' });
    if (model.nodes.length && !types.has('cloudwatch')) tips.push({ st: 'warn', text: 'No hay monitoreo: agrega CloudWatch (métricas, logs y alarmas por umbral).', src: 'MO p.9–12' });
    const unl = model.edges.filter(e => !e.label).length;
    if (model.edges.length && unl > model.edges.length / 2) tips.push({ st: 'warn', text: `${unl} de ${model.edges.length} flechas no tienen etiqueta. Rotúlalas (POST, “evento X”, “guarda”…): el profesor las lee.` });
    if (!model.nodes.some(n => n.type === 'actor')) tips.push({ st: 'warn', text: 'No hay actores (usuario, dispositivo, sensor): ¿quién inicia el flujo?', src: 'SV p.5' });
    if (model.nodes.some(n => n.type === 'actor') && !E.some(e => e.ft === 'actor' && ENTRADAS.includes(e.tt))) tips.push({ st: 'warn', text: 'Ningún actor entra por un servicio de entrada (API Gateway, Kinesis, S3, Amplify).', src: 'SV p.15–23' });
    const bad = tips.filter(t => t.st === 'bad').length, warn = tips.filter(t => t.st === 'warn').length;
    const wBP = cs ? 10 : 100;
    res.sections.push({ title: `Buenas prácticas de clase${tips.length ? ` (${bad} errores, ${warn} sugerencias)` : ''}`, items: tips.length ? tips : [{ st: 'ok', text: 'Sin observaciones.' }] });
    res.pts += model.nodes.length ? Math.max(0, wBP - bad * (cs ? 3 : 20) - warn * (cs ? 1 : 8)) : 0; res.max += wBP;
    res.pct = Math.round(100 * res.pts / res.max);
    return res;
  }

  function renderGrade(r) {
    const ic = { ok: '<span class="good">✓</span>', bad: '<span class="badc">✗</span>', warn: '<span style="color:var(--warn);font-weight:700">!</span>' };
    return `<div class="card"><div class="score">Nota del diagrama: ${r.pct}%</div>
      ${r.sections.map(s => `<h3>${s.title}</h3><ul class="glist">${s.items.map(i => `<li>${ic[i.st]} ${i.text}${i.src ? ` <span class="src" style="display:inline">${i.src}</span>` : ''}</li>`).join('')}</ul>`).join('')}
      <div class="note">La corrección automática revisa servicios, conexiones y buenas prácticas de clase, pero no lee tus justificaciones. Si usaste otra solución válida y puedes defenderla con la clase, también cuenta en el examen.</div></div>`;
  }

  /* ───── editor ───── */
  const ES = { straight: '╱ Recta', curve: '∿ Curva', ortho: '┐ Ortogonal' };

  /* Recorrido de una flecha entre dos nodos según el estilo */
  function route(A, B, style) {
    const [ax, ay, aw, ah] = A, [bx, by, bw, bh] = B;
    const acx = ax + aw / 2, acy = ay + ah / 2, bcx = bx + bw / 2, bcy = by + bh / 2, dx = bcx - acx, dy = bcy - acy;
    if (style === 'straight') {
      const bd = (cx, cy, w, h, tx, ty) => { const ddx = tx - cx, ddy = ty - cy; if (!ddx && !ddy) return [cx, cy]; const k = Math.min(ddx ? (w / 2 + 4) / Math.abs(ddx) : 1e9, ddy ? (h / 2 + 4) / Math.abs(ddy) : 1e9); return [cx + ddx * k, cy + ddy * k]; };
      const [x1, y1] = bd(acx, acy, aw, ah, bcx, bcy), [x2, y2] = bd(bcx, bcy, bw, bh, acx, acy);
      return { d: `M${x1},${y1} L${x2},${y2}`, lx: (x1 + x2) / 2, ly: (y1 + y2) / 2 - 6 };
    }
    // ¿se conectan por los lados (horizontal) o por arriba/abajo (vertical)?
    const horiz = Math.abs(dx) - (aw + bw) / 2 >= Math.abs(dy) - (ah + bh) / 2;
    let x1, y1, x2, y2;
    if (horiz) { const sg = Math.sign(dx) || 1; x1 = acx + sg * (aw / 2 + 2); y1 = acy; x2 = bcx - sg * (bw / 2 + 4); y2 = bcy; }
    else { const sg = Math.sign(dy) || 1; x1 = acx; y1 = acy + sg * (ah / 2 + 2); x2 = bcx; y2 = bcy - sg * (bh / 2 + 4); }
    if (style === 'curve') {
      const k = horiz ? Math.max(40, Math.abs(x2 - x1) / 2) * Math.sign(x2 - x1 || 1) : Math.max(40, Math.abs(y2 - y1) / 2) * Math.sign(y2 - y1 || 1);
      const c1 = horiz ? [x1 + k, y1] : [x1, y1 + k], c2 = horiz ? [x2 - k, y2] : [x2, y2 - k];
      return { d: `M${x1},${y1} C${c1[0]},${c1[1]} ${c2[0]},${c2[1]} ${x2},${y2}`, lx: (x1 + 3 * c1[0] + 3 * c2[0] + x2) / 8, ly: (y1 + 3 * c1[1] + 3 * c2[1] + y2) / 8 - 6 };
    }
    if (horiz) { const mx = (x1 + x2) / 2; return { d: `M${x1},${y1} H${mx} V${y2} H${x2}`, lx: mx, ly: (y1 + y2) / 2 - 6 }; }
    const my = (y1 + y2) / 2; return { d: `M${x1},${y1} V${my} H${x2} V${y2}`, lx: (x1 + x2) / 2, ly: my - 6 };
  }

  function mount(root, opts = {}) {
    const key = 'ed:' + (opts.key || opts.caseId || 'libre');
    let model = Store.get(key, null) || { nodes: [], edges: [] };
    model.groups = model.groups || [];
    let mode = 'move', sel = null, pending = null, seq = Date.now();
    let vb = { x: 0, y: 0, w: W, h: H };
    const save = () => Store.set(key, model);

    const cats = Object.keys(CATS);
    root.innerHTML = `<div class="ed">
      <div class="ed-bar">
        <div class="seg"><button data-m="move" class="on" title="Mover y seleccionar · arrastra el fondo para desplazar la vista">✋ Mover</button><button data-m="connect" title="Clic en el origen y luego en el destino">➜ Conectar</button></div>
        <button class="eb" data-a="rename" title="Renombrar el nodo o la flecha seleccionada (o doble clic)">✎ Renombrar</button>
        <button class="eb" data-a="del" title="Borrar lo seleccionado (tecla Supr)">🗑 Borrar</button>
        <button class="eb" data-a="clear">Limpiar todo</button>
        <span class="ed-hint"></span>
      </div>
      <div class="ed-bar ed-bar2">
        <span class="ed-lbl">Flechas</span><div class="seg es">${Object.entries(ES).map(([k, v]) => `<button data-es="${k}" title="${k === 'ortho' ? 'En ángulo recto: sale por el lado más cercano según la posición de cada servicio' : k === 'curve' ? 'Curva que se estira entre los servicios' : 'Línea recta'}">${v}</button>`).join('')}</div>
        <span class="ed-lbl">Tamaño</span><button class="eb" data-a="sm" title="Achicar (el nodo seleccionado o todos)">A−</button><span class="ed-val" id="ed-sz"></span><button class="eb" data-a="sp" title="Agrandar (el nodo seleccionado o todos)">A+</button>
        <span class="ed-lbl">Zoom</span><button class="eb" data-a="zo" title="Alejar">−</button><button class="eb ed-val" data-a="z1" title="Volver a 100%" id="ed-zm">100%</button><button class="eb" data-a="zi" title="Acercar">+</button><button class="eb" data-a="fit" title="Encuadrar todo el diagrama">⤢ Ajustar</button>
        <span class="ed-hint2"></span>
      </div>
      <div class="ed-pal"><div class="pg"><small>▢ Zonas (arrástralas por el título y cambia su tamaño desde la esquina inferior derecha)</small><div class="chips">${['cloud', 'vpc', 'pub', 'priv', 'onprem'].map(k => `<button class="chip pz" data-z="${k}" style="border-color:${ZONES[k].stroke}">+ ${ZONES[k].name}</button>`).join('')}</div></div>${cats.map(c => `<div class="pg"><small><span class="cat" style="background:${CATS[c].color}"></span>${CATS[c].name}</small><div class="chips">`
        + (c === 'cliente' ? `<button class="chip pa" data-t="actor">+ Actor (usuario, sensor, tablet…)</button>` : SERVICES.filter(s => s.cat === c && !s.nopal).map(s => `<button class="chip pa" data-t="${s.id}">+ ${short(s.name)}</button>`).join(''))
        + `</div></div>`).join('')}</div>
      <div class="ed-wrap"><svg class="ed-svg" viewBox="0 0 ${W} ${H}">
        <defs><marker id="ed-ah" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0,0 L10,5 L0,10 z" style="fill:var(--muted)"/></marker>
        <marker id="ed-ahs" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0,0 L10,5 L0,10 z" style="fill:var(--accent)"/></marker>
        <pattern id="ed-grid" width="20" height="20" patternUnits="userSpaceOnUse"><circle cx="1" cy="1" r="1" style="fill:var(--line)"/></pattern></defs>
        <rect class="ed-bg" x="-4000" y="-4000" width="12000" height="12000" fill="url(#ed-grid)"/><g class="ed-g"></g></svg></div>
    </div>`;
    const svg = root.querySelector('.ed-svg'), g = root.querySelector('.ed-g'), hint = root.querySelector('.ed-hint'), hint2 = root.querySelector('.ed-hint2');
    const setHint = () => hint.textContent = mode === 'connect' ? (pending ? 'Ahora haz clic en el destino…' : 'Haz clic en el nodo de origen') : (model.nodes.length ? 'Arrastra para mover · doble clic para renombrar · arrastra el fondo para desplazar' : 'Agrega servicios desde la paleta de abajo');
    const D = n => { const [w, h, k] = dims(model, n); return [n.x, n.y, w, h, k]; };
    const edgeStyle = e => e.style || model.es || 'straight';

    /* ── vista (zoom y desplazamiento) ── */
    const applyVB = () => { svg.setAttribute('viewBox', `${vb.x} ${vb.y} ${vb.w} ${vb.h}`); root.querySelector('#ed-zm').textContent = Math.round(100 * W / vb.w) + '%'; };
    const zoomAt = (f, cx, cy) => {
      const nw = Math.min(W * 4, Math.max(W / 5, vb.w / f)), nh = nw * H / W;
      if (cx == null) { cx = vb.x + vb.w / 2; cy = vb.y + vb.h / 2; }
      vb = { x: cx - (cx - vb.x) * nw / vb.w, y: cy - (cy - vb.y) * nh / vb.h, w: nw, h: nh }; applyVB();
    };
    const fit = () => {
      const boxes = [...model.nodes.map(n => { const [x, y, w, h] = D(n); return [x, y, x + w, y + h]; }), ...model.groups.map(z => [z.x, z.y, z.x + z.w, z.y + z.h])];
      if (!boxes.length) { vb = { x: 0, y: 0, w: W, h: H }; applyVB(); return; }
      const x0 = Math.min(...boxes.map(b => b[0])) - 40, y0 = Math.min(...boxes.map(b => b[1])) - 40, x1 = Math.max(...boxes.map(b => b[2])) + 40, y1 = Math.max(...boxes.map(b => b[3])) + 40;
      let w = Math.max(x1 - x0, (y1 - y0) * W / H, W / 4), h = w * H / W;
      vb = { x: (x0 + x1) / 2 - w / 2, y: (y0 + y1) / 2 - h / 2, w, h }; applyVB();
    };

    const pt = e => { const p = svg.createSVGPoint(); p.x = e.clientX; p.y = e.clientY; return p.matrixTransform(svg.getScreenCTM().inverse()); };

    function draw() {
      const byId = Object.fromEntries(model.nodes.map(n => [n.id, n]));
      let s = '';
      const order = { cloud: 0, vpc: 1, onprem: 1, pub: 2, priv: 2 };
      for (const z of [...model.groups].sort((a, b) => order[a.kind] - order[b.kind])) {
        const st = ZONES[z.kind], on = sel && sel.kind === 'g' && sel.id === z.id;
        s += `<g class="ed-z" data-z="${z.id}"><rect x="${z.x}" y="${z.y}" width="${z.w}" height="${z.h}" rx="10" style="fill:${st.fill};stroke:${on ? 'var(--accent)' : st.stroke};stroke-width:${on ? 2.5 : 1.5};${st.dash ? 'stroke-dasharray:6 4;' : ''}pointer-events:none"/>`
          + `<rect class="ed-zh" x="${z.x}" y="${z.y}" width="${z.w}" height="22" rx="10" style="fill:transparent;cursor:move;touch-action:none"/>`
          + `<text x="${z.x + 10}" y="${z.y + 15}" style="fill:${st.stroke};font-size:12px;font-weight:700;pointer-events:none">${esc(z.label)}</text>`
          + `<rect class="ed-zr" x="${z.x + z.w - 14}" y="${z.y + z.h - 14}" width="14" height="14" rx="3" style="fill:${st.stroke};opacity:.6;cursor:nwse-resize;touch-action:none"/></g>`;
      }
      for (const e of model.edges) {
        const a = byId[e.from], b = byId[e.to]; if (!a || !b) continue;
        const r = route(D(a), D(b), edgeStyle(e));
        const on = sel && sel.kind === 'e' && sel.id === e.id;
        s += `<g class="ed-e" data-e="${e.id}"><path d="${r.d}" style="fill:none;stroke:transparent;stroke-width:14"/>`
          + `<path d="${r.d}" style="fill:none;stroke:${on ? 'var(--accent)' : 'var(--muted)'};stroke-width:${on ? 2.5 : 1.6}" marker-end="url(#${on ? 'ed-ahs' : 'ed-ah'})"/>`;
        if (e.label) wrap(e.label, 18).forEach((ln, i, arr) => s += `<text x="${r.lx}" y="${r.ly - (arr.length - 1 - i) * 12}" text-anchor="middle" style="fill:var(--ink);font-size:11px;paint-order:stroke;stroke:var(--bg);stroke-width:4px;stroke-linejoin:round">${esc(ln)}</text>`);
        s += '</g>';
      }
      for (const n of model.nodes) {
        const [x, y, w, h, k] = D(n);
        const c = CATS[catOf(n.type)].color, on = sel && sel.kind === 'n' && sel.id === n.id, pen = pending === n.id;
        const main = wrap(n.label, 20), sub = n.type !== 'actor' && n.label !== short(SVC[n.type].name) ? [short(SVC[n.type].name)] : [];
        const f1 = 12 * k, f2 = 10 * k, tot = main.length * f1 * 1.15 + sub.length * f2 * 1.2; let ty = y + h / 2 - tot / 2 + f1 * 0.9;
        s += `<g class="ed-n" data-n="${n.id}" style="cursor:${mode === 'connect' ? 'crosshair' : 'grab'};touch-action:none">`
          + (on || pen ? `<rect x="${x - 5}" y="${y - 5}" width="${w + 10}" height="${h + 10}" rx="11" style="fill:none;stroke:var(--accent);stroke-width:2;${pen ? 'stroke-dasharray:5 4' : ''}"/>` : '')
          + `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${8 * k}" style="fill:var(--card);stroke:${c};stroke-width:2"/><rect x="${x}" y="${y}" width="${6 * k}" height="${h}" rx="${3 * k}" style="fill:${c}"/>`;
        for (const ln of main) { s += `<text x="${x + w / 2 + 3 * k}" y="${ty}" text-anchor="middle" style="fill:var(--ink);font-size:${f1}px;font-weight:600;pointer-events:none">${esc(ln)}</text>`; ty += f1 * 1.15; }
        for (const ln of sub) { s += `<text x="${x + w / 2 + 3 * k}" y="${ty}" text-anchor="middle" style="fill:var(--muted);font-size:${f2}px;pointer-events:none">${esc(ln)}</text>`; ty += f2 * 1.2; }
        s += '</g>';
      }
      g.innerHTML = s; setHint();
      root.querySelector('[data-a="del"]').disabled = root.querySelector('[data-a="rename"]').disabled = !sel;
      // controles que dependen de la selección
      const selE = sel && sel.kind === 'e' ? model.edges.find(x => x.id === sel.id) : null, selN = sel && sel.kind === 'n' ? model.nodes.find(x => x.id === sel.id) : null;
      const curES = selE ? edgeStyle(selE) : (model.es || 'straight');
      root.querySelectorAll('.es button').forEach(b => b.classList.toggle('on', b.dataset.es === curES));
      root.querySelector('#ed-sz').textContent = Math.round(100 * (selN ? (model.ns || 1) * (selN.s || 1) : (model.ns || 1))) + '%';
      hint2.textContent = selE ? 'El tipo de flecha se aplica solo a la flecha seleccionada' : selN ? 'El tamaño se aplica solo al nodo seleccionado' : 'Sin selección: el tipo de flecha y el tamaño se aplican a todo';
    }

    function addNode(type) {
      let label = type === 'actor' ? prompt('¿Quién es? (ej. Paciente, Sensores del camión, Tablet)', 'Usuario') : short(SVC[type].name);
      if (label == null || !label.trim()) return;
      const k = model.nodes.length, sc = vb.w / W;
      const x = Math.round((vb.x + (40 + (k % 5) * 190) * sc) / 10) * 10, y = Math.round((vb.y + (40 + (Math.floor(k / 5) % 6) * 110) * sc) / 10) * 10;
      const n = { id: 'n' + (seq++), type, label: label.trim(), x, y };
      model.nodes.push(n); sel = { kind: 'n', id: n.id }; save(); draw();
    }
    function addZone(kind) {
      const k = model.groups.length, big = { cloud: [1200, 820], vpc: [900, 600], onprem: [260, 260] }[kind] || [380, 300];
      const z = { id: 'z' + (seq++), kind, label: ZONES[kind].name, x: Math.round(vb.x + 20 + (k % 4) * 30), y: Math.round(vb.y + 20 + (k % 4) * 30), w: big[0], h: big[1] };
      model.groups.push(z); sel = { kind: 'g', id: z.id }; save(); draw();
    }
    function rename() {
      if (!sel) return;
      if (sel.kind === 'g') { const z = model.groups.find(x => x.id === sel.id); const v = prompt('Nombre de la zona (ej. “Subnet privada AZ-a”, “Datacenter San Isidro”)', z.label); if (v != null && v.trim()) z.label = v.trim(); save(); draw(); return; }
      if (sel.kind === 'n') { const n = model.nodes.find(x => x.id === sel.id); const v = prompt('Nombre del nodo (ej. “Lambda registrarCaso”)', n.label); if (v != null && v.trim()) n.label = v.trim(); }
      else { const e = model.edges.find(x => x.id === sel.id); const v = prompt('Etiqueta de la flecha (ej. POST /casos, evento CasoRegistrado, guarda)', e.label || ''); if (v != null) e.label = v.trim(); }
      save(); draw();
    }
    function del() {
      if (!sel) return;
      if (sel.kind === 'g') model.groups = model.groups.filter(z => z.id !== sel.id);
      else if (sel.kind === 'n') { model.nodes = model.nodes.filter(n => n.id !== sel.id); model.edges = model.edges.filter(e => e.from !== sel.id && e.to !== sel.id); }
      else model.edges = model.edges.filter(e => e.id !== sel.id);
      sel = null; save(); draw();
    }
    function resize(f) {
      const n = sel && sel.kind === 'n' ? model.nodes.find(x => x.id === sel.id) : null;
      if (n) n.s = Math.min(2, Math.max(0.5, Math.round(((n.s || 1) * f) * 100) / 100));
      else model.ns = Math.min(2, Math.max(0.5, Math.round(((model.ns || 1) * f) * 100) / 100));
      save(); draw();
    }

    root.querySelectorAll('.pa').forEach(b => b.addEventListener('click', () => addNode(b.dataset.t)));
    root.querySelectorAll('.pz').forEach(b => b.addEventListener('click', () => addZone(b.dataset.z)));
    root.querySelectorAll('.seg button[data-m]').forEach(b => b.addEventListener('click', () => {
      mode = b.dataset.m; pending = null; root.querySelectorAll('.seg button[data-m]').forEach(x => x.classList.toggle('on', x === b)); draw();
    }));
    root.querySelectorAll('.es button').forEach(b => b.addEventListener('click', () => {
      const selE = sel && sel.kind === 'e' ? model.edges.find(x => x.id === sel.id) : null;
      if (selE) selE.style = b.dataset.es; else { model.es = b.dataset.es; model.edges.forEach(e => delete e.style); }
      save(); draw();
    }));
    root.querySelector('[data-a="sm"]').addEventListener('click', () => resize(1 / 1.15));
    root.querySelector('[data-a="sp"]').addEventListener('click', () => resize(1.15));
    root.querySelector('[data-a="zi"]').addEventListener('click', () => zoomAt(1.25));
    root.querySelector('[data-a="zo"]').addEventListener('click', () => zoomAt(1 / 1.25));
    root.querySelector('[data-a="z1"]').addEventListener('click', () => { const cx = vb.x + vb.w / 2, cy = vb.y + vb.h / 2; vb = { x: cx - W / 2, y: cy - H / 2, w: W, h: H }; applyVB(); });
    root.querySelector('[data-a="fit"]').addEventListener('click', fit);
    root.querySelector('[data-a="rename"]').addEventListener('click', rename);
    root.querySelector('[data-a="del"]').addEventListener('click', del);
    root.querySelector('[data-a="clear"]').addEventListener('click', () => { if ((model.nodes.length || model.groups.length) && confirm('¿Borrar todo el diagrama?')) { model = { nodes: [], edges: [], groups: [] }; sel = pending = null; save(); draw(); fit(); } });
    svg.addEventListener('wheel', e => { if (!(e.ctrlKey || e.metaKey)) return; e.preventDefault(); const p = pt(e); zoomAt(Math.exp(-e.deltaY * 0.01), p.x, p.y); }, { passive: false });

    let drag = null;
    svg.addEventListener('pointerdown', e => {
      const ng = e.target.closest('.ed-n'), eg = e.target.closest('.ed-e'), zg = e.target.closest('.ed-z');
      if (zg && !ng && mode === 'move' && (e.target.classList.contains('ed-zr') || e.target.classList.contains('ed-zh'))) {
        const z = model.groups.find(x => x.id === zg.dataset.z), p = pt(e);
        sel = { kind: 'g', id: z.id };
        if (e.target.classList.contains('ed-zr')) drag = { zr: z, sx: p.x, sy: p.y, w0: z.w, h0: z.h };
        else {
          const inside = (x, y) => x >= z.x && x <= z.x + z.w && y >= z.y && y <= z.y + z.h;
          const nodes = model.nodes.filter(n => { const [x, y, w, h] = D(n); return inside(x + w / 2, y + h / 2); }).map(n => [n, n.x, n.y]);
          const zs = model.groups.filter(o => o !== z && inside(o.x, o.y) && inside(o.x + o.w, o.y + o.h)).map(o => [o, o.x, o.y]);
          drag = { zm: z, sx: p.x, sy: p.y, x0: z.x, y0: z.y, nodes, zs };
        }
        e.preventDefault(); draw(); return;
      }
      if (ng) {
        const id = ng.dataset.n;
        if (mode === 'connect') {
          if (!pending) pending = id;
          else if (pending !== id) {
            if (!model.edges.some(x => x.from === pending && x.to === id)) {
              const lab = prompt('Etiqueta de la flecha (opcional): ej. POST, evento X, guarda, notifica', '');
              const ed = { id: 'e' + (seq++), from: pending, to: id, label: (lab || '').trim() };
              model.edges.push(ed); sel = { kind: 'e', id: ed.id }; save();
            }
            pending = null;
          }
          draw(); return;
        }
        sel = { kind: 'n', id }; const n = model.nodes.find(x => x.id === id), p = pt(e);
        drag = { n, dx: p.x - n.x, dy: p.y - n.y }; e.preventDefault(); draw(); return;
      }
      if (eg) { sel = { kind: 'e', id: eg.dataset.e }; draw(); return; }
      // fondo: deselecciona y desplaza la vista
      sel = null; pending = null; draw();
      if (mode === 'move') { drag = { pan: true, sx: e.clientX, sy: e.clientY, vx: vb.x, vy: vb.y }; e.preventDefault(); }
    });
    const snap = v => Math.round(v / 10) * 10;
    const move = e => {
      if (!drag) return;
      if (drag.pan) { const k = vb.w / svg.clientWidth; vb.x = drag.vx - (e.clientX - drag.sx) * k; vb.y = drag.vy - (e.clientY - drag.sy) * k; applyVB(); return; }
      const p = pt(e);
      if (drag.zr) { drag.zr.w = Math.max(160, snap(drag.w0 + p.x - drag.sx)); drag.zr.h = Math.max(100, snap(drag.h0 + p.y - drag.sy)); draw(); return; }
      if (drag.zm) {
        const dx = snap(p.x - drag.sx), dy = snap(p.y - drag.sy);
        drag.zm.x = drag.x0 + dx; drag.zm.y = drag.y0 + dy;
        for (const [o, x, y] of [...drag.nodes, ...drag.zs]) { o.x = x + dx; o.y = y + dy; }
        draw(); return;
      }
      drag.n.x = snap(p.x - drag.dx); drag.n.y = snap(p.y - drag.dy); draw();
    };
    const up = () => { if (drag) { if (!drag.pan) save(); drag = null; } };
    document.addEventListener('pointermove', move); document.addEventListener('pointerup', up);
    svg.addEventListener('dblclick', e => { const ng = e.target.closest('.ed-n'), eg = e.target.closest('.ed-e'), zg = e.target.closest('.ed-z'); if (ng) sel = { kind: 'n', id: ng.dataset.n }; else if (eg) sel = { kind: 'e', id: eg.dataset.e }; else if (zg) sel = { kind: 'g', id: zg.dataset.z }; else return; rename(); });
    const onKey = e => { if (!document.body.contains(root)) { document.removeEventListener('keydown', onKey); return; } if ((e.key === 'Delete' || e.key === 'Backspace') && sel && !/INPUT|TEXTAREA/.test(document.activeElement.tagName)) { e.preventDefault(); del(); } };
    document.addEventListener('keydown', onKey);
    draw();
    if (model.nodes.length || model.groups.length) fit(); else applyVB();
    return { grade: () => grade(model, opts.caseId), model: () => model, renderGrade };
  }
  return { mount, grade, renderGrade };
})();
