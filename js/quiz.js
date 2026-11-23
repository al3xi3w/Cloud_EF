/* Preguntas, selector de servicios y progreso guardado (localStorage, opcional). */
const Store = {
  get(k, def) { try { const v = localStorage.getItem('cloudef:' + k); return v == null ? def : JSON.parse(v); } catch { return def; } },
  set(k, v) { try { localStorage.setItem('cloudef:' + k, JSON.stringify(v)); } catch {} },
};

const shuffle = a => { a = a.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };

const Quiz = {
  /* Opción múltiple. mode 'practice' = corrige al hacer clic; 'exam' = solo selecciona, se corrige con grade() */
  mcq(root, idxs, mode = 'practice', onChange) {
    const state = idxs.map(i => ({ i, order: shuffle(QUESTIONS[i].o.map((_, k) => k)), pick: null }));
    const html = state.map((s, n) => {
      const q = QUESTIONS[s.i];
      return `<div class="q" data-n="${n}"><div class="qn">${n + 1} / ${state.length} · ${TOPIC_NAMES[q.t]}</div><div class="qt">${q.q}</div>`
        + s.order.map(k => `<button class="opt" data-k="${k}">${q.o[k]}</button>`).join('')
        + `<div class="fb"></div></div>`;
    }).join('');
    root.innerHTML = html + (mode === 'practice' ? '<div class="card score" id="qscore"></div>' : '');
    const showFb = (box, s) => {
      const q = QUESTIONS[s.i];
      box.querySelectorAll('.opt').forEach(b => {
        const k = +b.dataset.k; b.disabled = true;
        if (k === q.a) b.classList.add('right'); else if (k === s.pick) b.classList.add('wrong');
      });
      box.querySelector('.fb').innerHTML = `<div class="exp">${s.pick === q.a ? '<span class="good">✓ Correcto.</span>' : '<span class="badc">✗ Incorrecto.</span>'} ${q.exp}<div class="src">${q.src}</div></div>`;
    };
    const tally = () => {
      const done = state.filter(s => s.pick != null), ok = done.filter(s => s.pick === QUESTIONS[s.i].a).length;
      const el = root.querySelector('#qscore');
      if (el) el.innerHTML = `${ok} / ${done.length} correctas` + (done.length === state.length ? ` · <span style="font-weight:400">terminado (${Math.round(100 * ok / state.length)}%)</span>` : '');
      return { ok, done: done.length, total: state.length };
    };
    root.querySelectorAll('.q').forEach(box => {
      const s = state[+box.dataset.n];
      box.querySelectorAll('.opt').forEach(b => b.addEventListener('click', () => {
        s.pick = +b.dataset.k;
        if (mode === 'practice') { showFb(box, s); const t = tally(); onChange && onChange(t); }
        else { box.querySelectorAll('.opt').forEach(x => x.classList.toggle('sel', x === b)); onChange && onChange(); }
      }));
    });
    if (mode === 'practice') tally();
    return {
      grade() { root.querySelectorAll('.q').forEach(box => { const s = state[+box.dataset.n]; showFb(box, s); }); return { ok: state.filter(s => s.pick === QUESTIONS[s.i].a).length, total: state.length }; },
      answered() { return state.filter(s => s.pick != null).length; },
    };
  },

  /* Pregunta abierta: escribe tu respuesta y compárala con la respuesta modelo */
  open(root, idxs, opts = {}) {
    root.innerHTML = idxs.map((i, n) => {
      const o = OPEN[i];
      return `<div class="q" data-i="${i}"><div class="qn">${opts.label || 'Pregunta abierta'} ${n + 1} · ${TOPIC_NAMES[o.t]}</div><div class="qt">${o.q}</div>
        <textarea placeholder="Escribe tu respuesta con tus palabras…"></textarea>
        <div class="row" style="margin-top:8px"><button class="btn ghost show">Ver respuesta modelo</button></div><div class="fb"></div></div>`;
    }).join('');
    const reveal = box => {
      const o = OPEN[+box.dataset.i];
      box.querySelector('.fb').innerHTML = `<div class="exp"><b>Respuesta modelo:</b> ${o.a}<div class="src">${o.src}</div>
        <div class="row" style="margin-top:8px">Autoevalúate: <button class="chip self" data-v="2">Completa</button><button class="chip self" data-v="1">Parcial</button><button class="chip self" data-v="0">No la sabía</button></div></div>`;
      box.querySelectorAll('.self').forEach(c => c.addEventListener('click', () => {
        box.querySelectorAll('.self').forEach(x => x.classList.toggle('on', x === c)); box.dataset.self = c.dataset.v;
      }));
    };
    root.querySelectorAll('.q').forEach(box => box.querySelector('.show').addEventListener('click', () => reveal(box)));
    return {
      revealAll() { root.querySelectorAll('.q').forEach(box => { if (!box.querySelector('.exp')) reveal(box); box.querySelector('.show')?.remove(); }); },
      selfScore() { const v = [...root.querySelectorAll('.q')].map(b => b.dataset.self == null ? null : +b.dataset.self); return v; },
    };
  },

  /* Selector de servicios para un caso: marca los que pondrías en tu diagrama */
  picker(root, cs, onCheck) {
    const chosen = new Set();
    const cats = Object.keys(CATS).filter(k => k !== 'cliente');
    root.innerHTML = `<p>Marca los servicios que pondrías en tu diagrama y luego presiona <b>Revisar</b>.</p>`
      + cats.map(c => `<div><small style="color:var(--muted)"><span class="cat" style="background:${CATS[c].color}"></span>${CATS[c].name}</small><div class="chips">`
        + SERVICES.filter(s => s.cat === c).map(s => `<button class="chip pk" data-id="${s.id}">${s.name}</button>`).join('') + '</div></div>').join('')
      + `<div class="row"><button class="btn chk">Revisar</button><button class="btn ghost rst">Reiniciar</button></div><div class="res"></div>`;
    root.querySelectorAll('.pk').forEach(b => b.addEventListener('click', () => {
      if (chosen.has(b.dataset.id)) chosen.delete(b.dataset.id); else chosen.add(b.dataset.id);
      b.classList.toggle('on'); b.classList.remove('ok', 'bad', 'opt');
    }));
    const check = () => {
      const req = new Set(cs.req), opt = new Set(cs.opt);
      let hit = 0;
      root.querySelectorAll('.pk').forEach(b => {
        const id = b.dataset.id; b.classList.remove('ok', 'bad', 'opt', 'on');
        if (req.has(id)) { b.classList.add(chosen.has(id) ? 'ok' : 'bad'); if (chosen.has(id)) hit++; }
        else if (chosen.has(id)) b.classList.add(opt.has(id) ? 'opt' : 'bad');
      });
      const missing = cs.req.filter(id => !chosen.has(id)).map(id => SVC[id].name);
      const extra = [...chosen].filter(id => !req.has(id) && !opt.has(id)).map(id => SVC[id].name);
      const optional = [...chosen].filter(id => opt.has(id)).map(id => SVC[id].name);
      root.querySelector('.res').innerHTML = `<div class="exp"><b>${hit} / ${cs.req.length}</b> servicios clave.
        ${missing.length ? `<br><span class="badc">Te faltó:</span> ${missing.join(', ')}` : '<br><span class="good">¡Tienes todos los servicios clave!</span>'}
        ${optional.length ? `<br><span style="color:var(--warn);font-weight:600">Válidos pero opcionales:</span> ${optional.join(', ')}` : ''}
        ${extra.length ? `<br><span class="badc">No hacen falta en la solución de referencia:</span> ${extra.join(', ')} (puedes defenderlos si los justificas con la clase)` : ''}
        <div class="legend"><span><span class="cat" style="background:var(--ok)"></span>clave</span><span><span class="cat" style="background:var(--warn)"></span>opcional</span><span><span class="cat" style="background:var(--bad)"></span>faltó / sobra</span></div></div>`;
      onCheck && onCheck(hit, cs.req.length);
    };
    root.querySelector('.chk').addEventListener('click', check);
    root.querySelector('.rst').addEventListener('click', () => { chosen.clear(); root.querySelectorAll('.pk').forEach(b => b.classList.remove('on', 'ok', 'bad', 'opt')); root.querySelector('.res').innerHTML = ''; });
    return { check, score: () => cs.req.filter(id => chosen.has(id)).length };
  },
};
