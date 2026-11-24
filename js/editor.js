/* Editor de diagramas de arquitectura con corrección automática.
   Editor.mount(root, { caseId, key }) → { grade(), model } */
const Editor = (() => {
  const BW = 150, BH = 54, W = 1300, H = 900;
  const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  const short = n => n.replace(/^(Amazon|AWS) /, '');
  const typeName = t => t === 'actor' ? 'Actor' : SVC[t].name;
  const catOf = t => t === 'actor' ? 'cliente' : SVC[t].cat;
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
    const center = n => [n.x + BW / 2, n.y + BH / 2];
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
  function mount(root, opts = {}) {
    const key = 'ed:' + (opts.key || opts.caseId || 'libre');
    let model = Store.get(key, null) || { nodes: [], edges: [] };
    model.groups = model.groups || [];
    let mode = 'move', sel = null, pending = null, seq = Date.now();
    const save = () => Store.set(key, model);

    const cats = Object.keys(CATS);
    root.innerHTML = `<div class="ed">
      <div class="ed-bar">
        <div class="seg"><button data-m="move" class="on" title="Mover y seleccionar">✋ Mover</button><button data-m="connect" title="Clic en el origen y luego en el destino">➜ Conectar</button></div>
        <button class="eb" data-a="rename" title="Renombrar el nodo o la flecha seleccionada (o doble clic)">✎ Renombrar</button>
        <button class="eb" data-a="del" title="Borrar lo seleccionado (tecla Supr)">🗑 Borrar</button>
        <button class="eb" data-a="clear">Limpiar todo</button>
        <span class="ed-hint"></span>
      </div>
      <div class="ed-pal"><div class="pg"><small>▢ Zonas (arrástralas por el título y cambia su tamaño desde la esquina inferior derecha)</small><div class="chips">${['cloud', 'vpc', 'pub', 'priv', 'onprem'].map(k => `<button class="chip pz" data-z="${k}" style="border-color:${ZONES[k].stroke}">+ ${ZONES[k].name}</button>`).join('')}</div></div>${cats.map(c => `<div class="pg"><small><span class="cat" style="background:${CATS[c].color}"></span>${CATS[c].name}</small><div class="chips">`
        + (c === 'cliente' ? `<button class="chip pa" data-t="actor">+ Actor (usuario, sensor, tablet…)</button>` : SERVICES.filter(s => s.cat === c && !s.nopal).map(s => `<button class="chip pa" data-t="${s.id}">+ ${short(s.name)}</button>`).join(''))
        + `</div></div>`).join('')}</div>
      <div class="ed-wrap"><svg class="ed-svg" viewBox="0 0 ${W} ${H}">
        <defs><marker id="ed-ah" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0,0 L10,5 L0,10 z" style="fill:var(--muted)"/></marker>
        <marker id="ed-ahs" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0,0 L10,5 L0,10 z" style="fill:var(--accent)"/></marker>
        <pattern id="ed-grid" width="20" height="20" patternUnits="userSpaceOnUse"><circle cx="1" cy="1" r="1" style="fill:var(--line)"/></pattern></defs>
        <rect class="ed-bg" width="${W}" height="${H}" fill="url(#ed-grid)"/><g class="ed-g"></g></svg></div>
    </div>`;
    const svg = root.querySelector('.ed-svg'), g = root.querySelector('.ed-g'), hint = root.querySelector('.ed-hint');
    const setHint = () => hint.textContent = mode === 'connect' ? (pending ? 'Ahora haz clic en el destino…' : 'Haz clic en el nodo de origen') : (model.nodes.length ? 'Arrastra para mover · doble clic para renombrar' : 'Agrega servicios desde la paleta de arriba');

    const pt = e => { const p = svg.createSVGPoint(); p.x = e.clientX; p.y = e.clientY; return p.matrixTransform(svg.getScreenCTM().inverse()); };
    const border = (n, tx, ty) => {
      const cx = n.x + BW / 2, cy = n.y + BH / 2, dx = tx - cx, dy = ty - cy;
      if (!dx && !dy) return [cx, cy];
      const s = Math.min(dx ? (BW / 2 + 4) / Math.abs(dx) : 1e9, dy ? (BH / 2 + 4) / Math.abs(dy) : 1e9);
      return [cx + dx * s, cy + dy * s];
    };

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
        const [x1, y1] = border(a, b.x + BW / 2, b.y + BH / 2), [x2, y2] = border(b, a.x + BW / 2, a.y + BH / 2);
        const on = sel && sel.kind === 'e' && sel.id === e.id;
        s += `<g class="ed-e" data-e="${e.id}"><line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" style="stroke:transparent;stroke-width:14"/>`
          + `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" style="stroke:${on ? 'var(--accent)' : 'var(--muted)'};stroke-width:${on ? 2.5 : 1.6}" marker-end="url(#${on ? 'ed-ahs' : 'ed-ah'})"/>`;
        if (e.label) wrap(e.label, 18).forEach((ln, i, arr) => s += `<text x="${(x1 + x2) / 2}" y="${(y1 + y2) / 2 - 6 - (arr.length - 1 - i) * 12}" text-anchor="middle" style="fill:var(--ink);font-size:11px;paint-order:stroke;stroke:var(--bg);stroke-width:4px;stroke-linejoin:round">${esc(ln)}</text>`);
        s += '</g>';
      }
      for (const n of model.nodes) {
        const c = CATS[catOf(n.type)].color, on = sel && sel.kind === 'n' && sel.id === n.id, pen = pending === n.id;
        const main = wrap(n.label, 20), sub = n.type !== 'actor' && n.label !== short(SVC[n.type].name) ? [short(SVC[n.type].name)] : [];
        const tot = main.length * 14 + sub.length * 12; let ty = n.y + BH / 2 - tot / 2 + 11;
        s += `<g class="ed-n" data-n="${n.id}" style="cursor:${mode === 'connect' ? 'crosshair' : 'grab'};touch-action:none">`
          + (on || pen ? `<rect x="${n.x - 5}" y="${n.y - 5}" width="${BW + 10}" height="${BH + 10}" rx="11" style="fill:none;stroke:var(--accent);stroke-width:2;${pen ? 'stroke-dasharray:5 4' : ''}"/>` : '')
          + `<rect x="${n.x}" y="${n.y}" width="${BW}" height="${BH}" rx="8" style="fill:var(--card);stroke:${c};stroke-width:2"/><rect x="${n.x}" y="${n.y}" width="6" height="${BH}" rx="3" style="fill:${c}"/>`;
        for (const ln of main) { s += `<text x="${n.x + BW / 2 + 3}" y="${ty}" text-anchor="middle" style="fill:var(--ink);font-size:12px;font-weight:600;pointer-events:none">${esc(ln)}</text>`; ty += 14; }
        for (const ln of sub) { s += `<text x="${n.x + BW / 2 + 3}" y="${ty}" text-anchor="middle" style="fill:var(--muted);font-size:10px;pointer-events:none">${esc(ln)}</text>`; ty += 12; }
        s += '</g>';
      }
      g.innerHTML = s; setHint();
      root.querySelector('[data-a="del"]').disabled = root.querySelector('[data-a="rename"]').disabled = !sel;
    }

    function addNode(type) {
      let label = type === 'actor' ? prompt('¿Quién es? (ej. Paciente, Sensores del camión, Tablet)', 'Usuario') : short(SVC[type].name);
      if (label == null || !label.trim()) return;
      const k = model.nodes.length, x = 40 + (k % 6) * 185, y = 40 + Math.floor(k / 6) * 105 % (H - 100);
      const n = { id: 'n' + (seq++), type, label: label.trim(), x, y };
      model.nodes.push(n); sel = { kind: 'n', id: n.id }; save(); draw();
    }
    function addZone(kind) {
      const k = model.groups.length, big = { cloud: [1200, 820], vpc: [900, 600], onprem: [260, 260] }[kind] || [380, 300];
      const z = { id: 'z' + (seq++), kind, label: ZONES[kind].name, x: 20 + (k % 4) * 30, y: 20 + (k % 4) * 30, w: big[0], h: big[1] };
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

    root.querySelectorAll('.pa').forEach(b => b.addEventListener('click', () => addNode(b.dataset.t)));
    root.querySelectorAll('.pz').forEach(b => b.addEventListener('click', () => addZone(b.dataset.z)));
    root.querySelectorAll('.seg button').forEach(b => b.addEventListener('click', () => {
      mode = b.dataset.m; pending = null; root.querySelectorAll('.seg button').forEach(x => x.classList.toggle('on', x === b)); draw();
    }));
    root.querySelector('[data-a="rename"]').addEventListener('click', rename);
    root.querySelector('[data-a="del"]').addEventListener('click', del);
    root.querySelector('[data-a="clear"]').addEventListener('click', () => { if ((model.nodes.length || model.groups.length) && confirm('¿Borrar todo el diagrama?')) { model = { nodes: [], edges: [], groups: [] }; sel = pending = null; save(); draw(); } });

    let drag = null;
    svg.addEventListener('pointerdown', e => {
      const ng = e.target.closest('.ed-n'), eg = e.target.closest('.ed-e'), zg = e.target.closest('.ed-z');
      if (zg && !ng && mode === 'move') {
        const z = model.groups.find(x => x.id === zg.dataset.z), p = pt(e);
        sel = { kind: 'g', id: z.id };
        if (e.target.classList.contains('ed-zr')) drag = { zr: z, sx: p.x, sy: p.y, w0: z.w, h0: z.h };
        else if (e.target.classList.contains('ed-zh')) {
          const inside = (x, y) => x >= z.x && x <= z.x + z.w && y >= z.y && y <= z.y + z.h;
          const nodes = model.nodes.filter(n => inside(n.x + BW / 2, n.y + BH / 2)).map(n => [n, n.x, n.y]);
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
      sel = null; pending = null; draw();
    });
    const snap = v => Math.round(v / 10) * 10;
    const move = e => {
      if (!drag) return; const p = pt(e);
      if (drag.zr) { drag.zr.w = Math.max(160, snap(drag.w0 + p.x - drag.sx)); drag.zr.h = Math.max(100, snap(drag.h0 + p.y - drag.sy)); draw(); return; }
      if (drag.zm) {
        const dx = snap(p.x - drag.sx), dy = snap(p.y - drag.sy);
        drag.zm.x = drag.x0 + dx; drag.zm.y = drag.y0 + dy;
        for (const [o, x, y] of [...drag.nodes, ...drag.zs]) { o.x = x + dx; o.y = y + dy; }
        draw(); return;
      } drag.n.x = Math.max(0, Math.min(W - BW, Math.round((p.x - drag.dx) / 10) * 10)); drag.n.y = Math.max(0, Math.min(H - BH, Math.round((p.y - drag.dy) / 10) * 10)); draw(); };
    const up = () => { if (drag) { drag = null; save(); } };
    document.addEventListener('pointermove', move); document.addEventListener('pointerup', up);
    svg.addEventListener('dblclick', e => { const ng = e.target.closest('.ed-n'), eg = e.target.closest('.ed-e'), zg = e.target.closest('.ed-z'); if (ng) sel = { kind: 'n', id: ng.dataset.n }; else if (eg) sel = { kind: 'e', id: eg.dataset.e }; else if (zg) sel = { kind: 'g', id: zg.dataset.z }; else return; rename(); });
    const onKey = e => { if (!document.body.contains(root)) { document.removeEventListener('keydown', onKey); return; } if ((e.key === 'Delete' || e.key === 'Backspace') && sel && !/INPUT|TEXTAREA/.test(document.activeElement.tagName)) { e.preventDefault(); del(); } };
    document.addEventListener('keydown', onKey);
    draw();
    return { grade: () => grade(model, opts.caseId), model: () => model, renderGrade };
  }

  return { mount, grade, renderGrade };
})();
