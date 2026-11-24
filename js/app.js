/* Router y páginas */
const $ = s => document.querySelector(s);
const app = $('#app');
const src = s => `<div class="src">${s}</div>`;
const read = () => Store.get('read', {});
const best = () => Store.get('best', {});

/* ───── Inicio ───── */
function pageInicio() {
  const r = read(), b = best();
  const nRead = LESSONS.filter(l => r[l.id]).length;
  app.innerHTML = `
<h1>Prepárate para el Examen Final de Cloud Computing</h1>
<p class="lead">Todo lo que hay aquí sale de las ${LESSONS.length} clases que están en <code>Clases/</code>. Primero aprendes qué hace cada servicio y cuándo usarlo; después practicas preguntas y <b>diagramas de arquitectura de solución</b>, que es lo que pedirá el examen.</p>
<div class="card"><b>Tu avance:</b> ${nRead} / ${LESSONS.length} clases leídas
<div class="progress"><i style="width:${100 * nRead / LESSONS.length}%"></i></div>
${Object.keys(b).length ? 'Mejores notas en simulacros: ' + EXAMS.map(e => `${e.title}: <b>${b[e.id] != null ? b[e.id] + '%' : '—'}</b>`).join(' · ') : 'Aún no rindes ningún simulacro.'}</div>

<h2>Ruta de estudio</h2>
<div class="grid">
 <a class="tile" href="#/aprende"><span class="wk">Paso 1</span><b>Aprende desde cero</b><span>Las ${LESSONS.length} clases explicadas con sus diagramas y la fuente de cada dato.</span></a>
 <a class="tile" href="#/servicios"><span class="wk">Paso 2</span><b>Qué hace cada servicio</b><span>Lambda, API Gateway, SNS, SQS, EventBridge, DynamoDB, S3, CloudWatch…: para qué sirve, cuándo usarlo y en qué ejemplo de clase aparece.</span></a>
 <a class="tile" href="#/diagramas"><span class="wk">Paso 3</span><b>Diagramas de arquitectura</b><span>Método para dibujarlos y 7 casos resueltos (incluidos los 3 temas del proyecto).</span></a>
 <a class="tile" href="#/examen"><span class="wk">Paso 3b</span><b>Casos tipo examen</b><span>Como el examen: VPC, subnets, endpoints, NAT, on-premise, Saga, idempotencia y tablas PK/SK. 3 ejemplos resueltos y 3 problemas de práctica.</span></a>
 <a class="tile" href="#/practica"><span class="wk">Paso 4</span><b>Práctica</b><span>${QUESTIONS.length} preguntas de opción múltiple y ${OPEN.length} preguntas abiertas del profesor.</span></a>
 <a class="tile" href="#/simulacros"><span class="wk">Paso 5</span><b>Simulacros de examen</b><span>3 exámenes con tiempo: opción múltiple, preguntas abiertas y un diagrama.</span></a>
</div>

<h2>Las clases y dónde están en el sílabo</h2>
<div class="tablewrap"><table>
<tr><th>Clase (diapositivas)</th><th>Semana</th><th>Tema del sílabo</th></tr>
${[['vm','VM','6.2 Virtualización con máquinas virtuales'],['contenedores','CT','6.3 Virtualización con contenedores'],['bd','BD','6.4.4–6.4.6 Bases de datos SQL, NoSQL y casos de uso'],['multitenancy','MT','6.6 Multi-tenancy'],['serverless','SV','6.8.4 y 6.9 Arquitectura sin servidor'],['lambdas','LM','6.9.2 Funciones como servicio (FaaS)'],['monitoreo','MO','6.11 Monitoreo de infraestructura y aplicaciones'],['eventos','EV','6.8.5 y 6.10 Arquitectura orientada a eventos']]
  .map(([id, d, s]) => `<tr><td><a href="#/aprende/${id}">${DECKS[d].name}</a> ${r[id] ? '<span class="tag ok">leída</span>' : ''}</td><td>${DECKS[d].week}</td><td>${s}</td></tr>`).join('')}
</table></div>
<div class="note">Esta web <b>no</b> cubre temas del sílabo que no tienen diapositivas en <code>Clases/</code>, por ejemplo 6.5 Escalabilidad, 6.7 Seguridad o 6.12 Well-Architected. Si el profesor los incluye en el examen, repásalos con su material.</div>`;
}

/* ───── Aprende ───── */
function pageAprende(id) {
  const lesson = LESSONS.find(l => l.id === id);
  const r = read();
  const side = `<div class="side">${LESSONS.map(l => `<a href="#/aprende/${l.id}" class="${l.id === id ? 'on' : ''}">${r[l.id] ? '✓ ' : ''}${l.title}</a>`).join('')}</div>`;
  if (!lesson) {
    app.innerHTML = `<h1>Aprende desde cero</h1><p class="lead">Una clase por tema. Empieza por máquinas virtuales y contenedores (la base de la nube) y sigue con serverless, porque casi todo lo demás se arma sobre él.</p>
    <div class="grid">${LESSONS.map(l => `<a class="tile" href="#/aprende/${l.id}"><span class="wk">${DECKS[l.deck].week}</span><b>${r[l.id] ? '✓ ' : ''}${l.title}</b><span>${l.short}</span></a>`).join('')}</div>
    <h2>Leyenda de colores de los diagramas</h2>${Diagram.legend()}`;
    return;
  }
  const i = LESSONS.indexOf(lesson), next = LESSONS[i + 1];
  app.innerHTML = `<div class="sidebar">${side}<article>
    <span class="tag">${DECKS[lesson.deck].week}</span>
    <h1>${lesson.title}</h1>
    ${src(`Diapositivas: ${DECKS[lesson.deck].file}`)}
    ${Diagram.legend()}
    ${Diagram.fill(lesson.html)}
    <div class="row" style="margin-top:20px">
      <button class="btn" id="mark">${r[id] ? '✓ Leída' : 'Marcar como leída'}</button>
      <a class="btn ghost" href="#/practica/mcq/${lesson.id}" style="text-decoration:none">Practicar este tema</a>
      ${next ? `<a class="btn ghost" href="#/aprende/${next.id}" style="text-decoration:none">Siguiente: ${next.title} →</a>` : ''}
    </div></article></div>`;
  if (id === 'vm') initEc2Calc();
  $('#mark').addEventListener('click', () => { const x = read(); x[id] = true; Store.set('read', x); pageAprende(id); });
}

/* ───── Servicios ───── */
const GUIA = [
  ['Recibir peticiones REST de una web, app o dispositivo (síncrono)', 'apigw', 'SV p.21, p.23'],
  ['Ejecutar lógica sin servidores', 'lambda', 'SV p.11'],
  ['Guardar archivos (fotos, PDF, Markdown) o el frontend estático', 's3', 'SV p.13, p.19, p.21'],
  ['Base de datos serverless rápida (NoSQL)', 'dynamodb', 'SV p.13 · BD p.12'],
  ['Base de datos SQL serverless (datos consistentes)', 'aurora', 'SV p.13 · BD p.15'],
  ['Datos en streaming en tiempo real (IoT, clics, logs)', 'kinesis', 'SV p.20, p.22'],
  ['Que el productor no espere al consumidor (cola)', 'sqs', 'EV p.15'],
  ['Un mensaje a muchos receptores / notificar a personas (email, SMS)', 'sns', 'EV p.12, p.20, p.22'],
  ['Rutear o filtrar eventos según su contenido · tareas programadas', 'eventbridge', 'EV p.12 · SV p.17'],
  ['Flujo de varios pasos en orden (ETL, lotes)', 'stepfunctions', 'SV p.17'],
  ['Medir, alarmas por umbral, logs, escalar automáticamente', 'cloudwatch', 'MO p.9–12'],
  ['Analizar imágenes', 'rekognition', 'SV p.18'],
  ['Analizar texto (sentimiento, entidades)', 'comprehend', 'SV p.16, p.18'],
  ['Indexar y buscar resultados', 'opensearch', 'SV p.18'],
  ['No perder mensajes que fallaron', 'dlq', 'SV p.16'],
];
function svcCard(s) {
  return `<div class="card" id="svc-${s.id}"><div class="svc-h">${iconImg(iconFor(s.id), 'svc-ic') || `<span class="cat" style="background:${CATS[s.cat].color};width:14px;height:14px"></span>`}<h3>${s.name}</h3><span class="tag">${CATS[s.cat].name}</span>${s.fuera === 'general' ? '<span class="tag warn">fuera de las diapositivas · conocimiento general de AWS</span>' : s.fuera ? '<span class="tag warn">solo aparece en un diagrama</span>' : ''}</div>
  <p><b>¿Qué hace?</b> ${s.que}</p>${src(s.src)}
  <p><b>¿Cuándo usarlo?</b></p><ul>${s.cuando.map(c => `<li>${c}</li>`).join('')}</ul>
  ${s.datos ? `<p><b>Datos que pueden preguntar:</b></p><ul>${s.datos.map(c => `<li>${c}</li>`).join('')}</ul>` : ''}
  <p><b>Ejemplos de clase donde aparece:</b></p><ul>${s.ejemplos.map(c => `<li>${c}</li>`).join('')}</ul></div>`;
}
function pageServicios() {
  app.innerHTML = `<h1>¿Qué hace cada servicio?</h1>
  <p class="lead">Primero, la <b>guía para el examen</b>: qué servicios usar, dónde dibujarlos y qué frase del enunciado los pide. Abajo está el <b>catálogo</b> completo: en los servicios de clase, la definición es la cita de la diapositiva; los demás están marcados como “fuera de las diapositivas”.</p>
  ${examGuideHtml()}
  <h2>Guía rápida de clase: “necesito… → uso…”</h2>
  <div class="tablewrap"><table><tr><th>Necesito…</th><th>Servicio</th><th>Fuente</th></tr>
  ${GUIA.map(([n, id, s]) => `<tr><td>${n}</td><td><a href="#/servicios" data-j="${id}"><span class="cat" style="background:${CATS[SVC[id].cat].color}"></span>${SVC[id].name}</a></td><td class="src" style="margin:0">${s}</td></tr>`).join('')}</table></div>
  <h2>Catálogo</h2>
  <div class="row"><input id="q" placeholder="Buscar servicio…" style="flex:1;min-width:180px;padding:8px 10px;border:1px solid var(--line);border-radius:8px;background:var(--card);color:var(--ink);font:inherit"></div>
  <div class="chips" id="cf"><button class="chip on" data-c="">Todos</button>${Object.entries(CATS).filter(([k]) => k !== 'cliente').map(([k, c]) => `<button class="chip" data-c="${k}"><span class="cat" style="background:${c.color}"></span>${c.name}</button>`).join('')}</div>
  <div id="list"></div>`;
  let cat = '', q = '';
  const draw = () => { $('#list').innerHTML = SERVICES.filter(s => (!cat || s.cat === cat) && (!q || (s.name + s.que).toLowerCase().includes(q))).map(svcCard).join('') || '<p>Sin resultados.</p>'; };
  $('#q').addEventListener('input', e => { q = e.target.value.toLowerCase(); draw(); });
  document.querySelectorAll('#cf .chip').forEach(b => b.addEventListener('click', () => { cat = b.dataset.c; document.querySelectorAll('#cf .chip').forEach(x => x.classList.toggle('on', x === b)); draw(); }));
  document.querySelectorAll('[data-j]').forEach(a => a.addEventListener('click', e => { e.preventDefault(); cat = ''; q = ''; $('#q').value = ''; draw(); document.getElementById('svc-' + a.dataset.j).scrollIntoView({ behavior: 'smooth' }); }));
  draw();
}

/* ───── Diagramas ───── */
const METODO = `
<div class="card"><h3 style="margin-top:0">Método para dibujar el diagrama en el examen</h3>
<div class="note design"><span class="tag design">método de estudio</span> Estos pasos no son una diapositiva: son una forma ordenada de aplicar lo que viste en clase. Cada paso dice de qué clase sale.</div>
<ol class="steps">
 <li><b>Actores y fuentes de datos.</b> ¿Quién o qué genera información? Usuario web/móvil, dispositivo IoT, tablet, tarea programada. Son los “eventos/solicitudes” del flujo serverless (SV p.5).</li>
 <li><b>Entrada síncrona o streaming.</b> Si alguien pide algo y espera respuesta: <b>API Gateway → Lambda</b> (SV p.21, p.23). Si son datos continuos de sensores: <b>Kinesis → Lambda</b> (SV p.20, p.22). Si se sube un archivo: <b>S3 → evento → Lambda</b> (SV p.19).</li>
 <li><b>Dónde se guarda.</b> Archivos → <b>S3</b>. Registros → <b>DynamoDB</b> (NoSQL: rápido, escala horizontal, IoT y redes sociales) o <b>SQL / Aurora</b> si los datos deben ser consistentes, como los financieros (BD p.15–16).</li>
 <li><b>Qué pasa después: eventos.</b> Lo que no tiene que responderse al instante se desacopla. Si hay que filtrar o rutear por contenido → <b>EventBridge</b>; si un mensaje va a muchos receptores o personas → <b>SNS</b>; si cada consumidor procesa a su ritmo → <b>SQS</b> (o <b>SNS + SQS fan out</b>) (EV p.12–21).</li>
 <li><b>Notificaciones.</b> A personas por email/SMS → <b>SNS</b> (EV p.22).</li>
 <li><b>Monitoreo.</b> <b>CloudWatch</b>: métricas, logs, alarmas por umbral → SNS o Auto Scaling. Si no se debe perder nada: <b>DLQ + alarma</b> (MO p.9–12, SV p.16).</li>
 <li><b>Multi-tenancy (si hay varias empresas o sedes).</b> Indica el patrón de BD: TENANT_ID (Patrón 1), schema por tenant (2) o BD por tenant (3), y justifícalo con costo vs aislamiento (MT p.10–14).</li>
 <li><b>Lambda.</b> Si hay picos o la latencia es crítica, menciona la concurrencia (1000 por región) y la simultaneidad aprovisionada contra el cold start. Recuerda el máximo de 15 min (LM).</li>
 <li><b>Rotula las flechas</b> (POST, “evento X”, “regla: …”, “guarda”) y <b>justifica cada servicio en una línea</b> con la idea de clase.</li>
</ol></div>`;
function pageDiagramas(id) {
  const cs = CASES.find(c => c.id === id);
  if (!cs) {
    app.innerHTML = `<h1>Diagramas de arquitectura de solución</h1>
    <p class="lead">El examen pedirá dibujar una arquitectura. Primero aprende el método, después practica: <b>dibuja en papel</b>, marca los servicios que usaste y compáralo con la solución.</p>
    ${METODO}
    <h2>Casos para practicar</h2>
    <div class="grid">${CASES.map(c => `<a class="tile" href="#/diagramas/${c.id}"><span class="wk">${c.level} · ${c.origin}</span><b>${c.title}</b><span>${c.enunciado.replace(/<[^>]+>/g, '').slice(0, 120)}…</span></a>`).join('')}</div>
    <h2>Leyenda de colores</h2>${Diagram.legend()}`;
    return;
  }
  app.innerHTML = `<p><a href="#/diagramas">← Todos los casos</a></p>
  <span class="tag">${cs.level} · ${cs.origin}</span><h1>${cs.title}</h1>
  <div class="card"><b>Enunciado:</b> ${cs.enunciado}</div>
  <h2>1. Dibújalo en papel</h2>
  <p>Toma 10–15 minutos y sigue el <a href="#/diagramas">método</a>. ¿Te trabaste? Abre las pistas una por una:</p>
  ${cs.pistas.map((p, i) => `<details><summary>Pista ${i + 1}</summary>${p}</details>`).join('')}
  <h2>2. Ármalo en el editor y corrígelo</h2>
  <p>Agrega servicios, conéctalos con <b>➜ Conectar</b>, rotula las flechas y presiona <b>Corregir</b>. Tu diagrama se guarda en este navegador.</p>
  <div id="ed"></div>
  <div class="row" style="margin:10px 0"><button class="btn" id="corr">✔ Corregir mi diagrama</button><a class="btn ghost" href="#/editor/${cs.id}" style="text-decoration:none">Abrir en pantalla completa</a></div>
  <div id="gr"></div>
  <details><summary>¿Lo dibujaste en papel? Marca solo los servicios que usaste</summary><div id="pick"></div></details>
  <h2>3. Compara con la solución</h2>
  <button class="btn" id="sol">Mostrar solución</button>
  <div id="solbox" hidden>
    ${Diagram.legend()}
    ${Diagram.render(cs.diagram)}
    <h3>Por qué cada pieza</h3><ol class="steps">${cs.explica.map(e => `<li>${e}</li>`).join('')}</ol>
    ${cs.notas.map(n => `<div class="note">${n}</div>`).join('')}
    <h3>Autoevaluación del dibujo</h3>
    <div class="card">${['Identifiqué a todos los actores y fuentes de datos', 'Usé entrada síncrona (API Gateway) o streaming (Kinesis) según corresponde', 'Separé archivos (S3) de registros (BD) y justifiqué SQL vs NoSQL', 'Desacoplé con eventos o colas lo que no tiene que ser inmediato', 'Notifico a las personas que el enunciado menciona', 'Incluí monitoreo (CloudWatch)', 'Rotulé las flechas y justifiqué cada servicio', 'Si hay varias empresas o sedes, indiqué el patrón multi-tenant'].map(t => `<label style="display:block"><input type="checkbox"> ${t}</label>`).join('')}</div>
  </div>`;
  Quiz.picker($('#pick'), cs);
  const ed = Editor.mount($('#ed'), { caseId: cs.id });
  $('#corr').addEventListener('click', () => { $('#gr').innerHTML = Editor.renderGrade(ed.grade()); });
  $('#sol').addEventListener('click', () => { $('#solbox').hidden = false; $('#sol').remove(); });
}

/* ───── Editor ───── */
function pageEditor(id) {
  const cs = findCase(id);
  app.innerHTML = `<h1>Editor de diagramas</h1>
  <p class="lead">Arma tu arquitectura de solución y el editor la corrige: revisa <b>servicios clave</b>, <b>conexiones esperadas</b> y <b>buenas prácticas de clase</b>, cada una con su diapositiva.</p>
  <div class="chips"><a class="chip ${!cs ? 'on' : ''}" href="#/editor" style="text-decoration:none">Modo libre</a>${CASES.map(c => `<a class="chip ${cs === c ? 'on' : ''}" href="#/editor/${c.id}" style="text-decoration:none">${c.title}</a>`).join('')}</div>
  <div class="chips"><small style="color:var(--muted);align-self:center">Casos tipo examen:</small>${XCASES.map(c => `<a class="chip ${cs === c ? 'on' : ''}" href="#/editor/${c.id}" style="text-decoration:none">${c.title}</a>`).join('')}</div>
  ${cs ? (cs.flujo ? xEnunciado(cs) : `<div class="card"><b>Enunciado:</b> ${cs.enunciado}</div>`) : `<div class="card">En <b>modo libre</b> no hay solución de referencia: se revisan solo las buenas prácticas de clase. Úsalo para practicar con tus propios enunciados, por ejemplo una pregunta de examen.</div>`}
  <details class="card" style="padding:8px 14px"><summary>Cómo usar el editor</summary><ul>
    <li>Haz clic en un servicio de la paleta para agregarlo. Con <b>+ Actor</b> agregas personas o dispositivos (paciente, sensor, tablet…).</li>
    <li><b>✋ Mover</b>: arrastra los nodos. <b>Doble clic</b> para renombrarlos (ej. “Lambda registrarCaso”).</li>
    <li><b>➜ Conectar</b>: clic en el origen y luego en el destino. Te pide la etiqueta de la flecha (POST, evento X, guarda…).</li>
    <li>Para borrar, selecciona y usa <b>🗑 Borrar</b> o la tecla Supr. Todo se guarda automáticamente en este navegador.</li></ul></details>
  <div id="ed"></div>
  <div class="row" style="margin:10px 0"><button class="btn" id="corr">✔ Corregir</button>${cs ? '<button class="btn ghost" id="sol">Ver solución de referencia</button>' : ''}</div>
  <div id="gr"></div><div id="solbox"></div>`;
  const ed = Editor.mount($('#ed'), { caseId: cs ? cs.id : null });
  $('#corr').addEventListener('click', () => { $('#gr').innerHTML = Editor.renderGrade(ed.grade()); $('#gr').scrollIntoView({ behavior: 'smooth' }); });
  if (cs) $('#sol').addEventListener('click', () => {
    $('#solbox').innerHTML = cs.flujo ? xSolucion(cs) : `<h2>Solución de referencia</h2>${Diagram.legend()}${Diagram.render(cs.diagram)}<ol class="steps">${cs.explica.map(e => `<li>${e}</li>`).join('')}</ol>${cs.notas.map(n => `<div class="note">${n}</div>`).join('')}`;
    $('#sol').remove();
  });
}

/* ───── Práctica ───── */
function pagePractica(kind, topic) {
  const tabs = `<div class="chips"><a class="chip ${kind !== 'abiertas' ? 'on' : ''}" href="#/practica/mcq" style="text-decoration:none">Opción múltiple</a><a class="chip ${kind === 'abiertas' ? 'on' : ''}" href="#/practica/abiertas" style="text-decoration:none">Preguntas abiertas del profesor</a></div>`;
  if (kind === 'abiertas') {
    const ts = Object.keys(TOPIC_NAMES).filter(t => OPEN.some(o => o.t === t));
    app.innerHTML = `<h1>Práctica</h1>${tabs}<p class="lead">Son las preguntas “Explique con sus propias palabras” del cierre de cada clase. Escribe tu respuesta y luego compárala con la respuesta modelo.</p>
    <div class="chips" id="tf"><button class="chip ${!topic ? 'on' : ''}" data-t="">Todas</button>${ts.map(t => `<button class="chip ${topic === t ? 'on' : ''}" data-t="${t}">${TOPIC_NAMES[t]}</button>`).join('')}</div><div id="ql"></div>`;
    Quiz.open($('#ql'), OPEN.map((o, i) => [o, i]).filter(([o]) => !topic || o.t === topic).map(([, i]) => i));
    document.querySelectorAll('#tf .chip').forEach(b => b.addEventListener('click', () => location.hash = '#/practica/abiertas' + (b.dataset.t ? '/' + b.dataset.t : '')));
    return;
  }
  const pool = QUESTIONS.map((q, i) => [q, i]).filter(([q]) => !topic || q.t === topic).map(([, i]) => i);
  app.innerHTML = `<h1>Práctica</h1>${tabs}<p class="lead">Elige un tema. Las opciones se mezclan en cada intento y cada respuesta muestra su explicación y la diapositiva de donde sale.</p>
  <div class="chips" id="tf"><button class="chip ${!topic ? 'on' : ''}" data-t="">Todos (${QUESTIONS.length})</button>${Object.keys(TOPIC_NAMES).map(t => `<button class="chip ${topic === t ? 'on' : ''}" data-t="${t}">${TOPIC_NAMES[t]} (${QUESTIONS.filter(q => q.t === t).length})</button>`).join('')}</div>
  <div class="row"><button class="btn ghost" id="again">🔀 Nuevo orden</button><span style="color:var(--muted);font-size:14px">${topic ? 'Todas las preguntas del tema' : '15 preguntas al azar de todos los temas'}</span></div>
  <div id="ql"></div>`;
  const go = () => Quiz.mcq($('#ql'), topic ? shuffle(pool) : shuffle(pool).slice(0, 15));
  document.querySelectorAll('#tf .chip').forEach(b => b.addEventListener('click', () => location.hash = '#/practica/mcq' + (b.dataset.t ? '/' + b.dataset.t : '')));
  $('#again').addEventListener('click', go);
  go();
}

/* ───── Simulacros ───── */
let timerId = null;
function pageSimulacros(id) {
  clearInterval(timerId);
  const ex = EXAMS.find(e => e.id === id), b = best();
  if (!ex) {
    app.innerHTML = `<h1>Simulacros de examen</h1>
    <p class="lead">Cada simulacro tiene 3 partes: <b>opción múltiple</b> (se corrige sola), <b>preguntas abiertas</b> (te autoevalúas con la respuesta modelo) y un <b>diagrama de arquitectura</b> que armas en el editor y se corrige solo. Las preguntas no se repiten entre simulacros.</p>
    <div class="note">Son exámenes de práctica <b>armados con el contenido de clase</b>, no exámenes pasados reales: en <code>Clases/</code> no hay exámenes anteriores del curso.</div>
    <div class="grid">${EXAMS.map(e => { const c = CASES.find(x => x.id === e.case); return `<a class="tile" href="#/simulacros/${e.id}"><span class="wk">${e.min} min · ${e.mcq.length} MC + ${e.open.length} abiertas + 1 diagrama</span><b>${e.title}</b><span>Diagrama: ${c.title}. Mejor nota: ${b[e.id] != null ? b[e.id] + '%' : '—'}</span></a>`; }).join('')}</div>`;
    return;
  }
  const cs = CASES.find(c => c.id === ex.case);
  app.innerHTML = `<p><a href="#/simulacros">← Simulacros</a></p>
  <div class="row" style="justify-content:space-between"><h1 style="margin:0">${ex.title}</h1><span class="timer" id="tm"></span></div>
  <p class="lead">Parte A: ${ex.mcq.length} preguntas de opción múltiple (60%) · Parte B: ${ex.open.length} preguntas abiertas (20%) · Parte C: diagrama (20%).</p>
  <h2>Parte A · Opción múltiple</h2><div id="pa"></div>
  <h2>Parte B · Preguntas abiertas</h2><div id="pb"></div>
  <h2>Parte C · Diagrama de arquitectura de solución</h2>
  <div class="card"><b>Enunciado:</b> ${cs.enunciado}<br><br>Arma la arquitectura de solución en AWS en el editor. Rotula las flechas. Se corrige al terminar el examen.</div>
  <div id="pc"></div>
  <div class="row" style="margin:20px 0"><button class="btn" id="fin">Terminar y corregir</button></div>
  <div id="res"></div>`;
  const A = Quiz.mcq($('#pa'), ex.mcq, 'exam');
  const B = Quiz.open($('#pb'), ex.open, { label: 'Abierta' });
  $('#pb').querySelectorAll('.show').forEach(x => x.remove());
  Store.set('ed:exam-' + ex.id, null);
  const C = Editor.mount($('#pc'), { caseId: cs.id, key: 'exam-' + ex.id });
  let left = ex.min * 60;
  const tick = () => { const m = Math.floor(left / 60), s = left % 60; $('#tm').textContent = `⏱ ${m}:${String(s).padStart(2, '0')}`; if (left-- <= 0) { clearInterval(timerId); finish(); } };
  tick(); timerId = setInterval(tick, 1000);
  const finish = () => {
    clearInterval(timerId);
    $('#fin').remove();
    const a = A.grade();
    B.revealAll();
    const g = C.grade();
    $('#res').innerHTML = `<div class="card"><div class="score">Parte A: ${a.ok} / ${a.total} · Parte C (diagrama): ${g.pct}%</div>
      <h3>Corrección del diagrama</h3>${Editor.renderGrade(g)}
      <p>Para la Parte B, marca tu autoevaluación en cada pregunta (Completa / Parcial / No la sabía) y presiona “Calcular nota final”.</p>
      <button class="btn" id="calc">Calcular nota final</button><div id="final"></div>
      <h3>Solución del diagrama</h3>${Diagram.legend()}${Diagram.render(cs.diagram)}<ol class="steps">${cs.explica.map(e => `<li>${e}</li>`).join('')}</ol>${cs.notas.map(n => `<div class="note">${n}</div>`).join('')}</div>`;
    $('#calc').addEventListener('click', () => {
      const self = B.selfScore();
      if (self.some(v => v == null)) { $('#final').innerHTML = '<p class="badc">Te falta autoevaluar alguna pregunta abierta.</p>'; return; }
      const pct = Math.round(60 * a.ok / a.total + 20 * self.reduce((x, y) => x + y, 0) / (2 * self.length) + 20 * g.pct / 100);
      const bb = best(); if (bb[ex.id] == null || pct > bb[ex.id]) { bb[ex.id] = pct; Store.set('best', bb); }
      $('#final').innerHTML = `<p class="score">Nota estimada: ${pct}% (≈ ${(pct / 5).toFixed(1)} / 20)</p>`;
    });
    $('#res').scrollIntoView({ behavior: 'smooth' });
  };
  $('#fin').addEventListener('click', () => { if (A.answered() < ex.mcq.length && !confirm(`Respondiste ${A.answered()} de ${ex.mcq.length} preguntas de opción múltiple. ¿Terminar de todos modos?`)) return; finish(); });
}

/* ───── Router ───── */
function route() {
  const [, page = 'inicio', a, b] = (location.hash || '#/inicio').split('/');
  document.querySelectorAll('#nav a').forEach(x => x.classList.toggle('on', x.dataset.r === page));
  if (page !== 'simulacros') clearInterval(timerId);
  ({ inicio: pageInicio, aprende: () => pageAprende(a), servicios: pageServicios, diagramas: () => pageDiagramas(a), editor: () => pageEditor(a), examen: () => pageExamen(a),practica: () => pagePractica(a, b), simulacros: () => pageSimulacros(a) }[page] || pageInicio)();
  window.scrollTo(0, 0);
}
window.addEventListener('hashchange', route);

/* tema claro/oscuro */
const savedTheme = Store.get('theme', null);
if (savedTheme) document.documentElement.dataset.theme = savedTheme;
$('#theme').addEventListener('click', () => {
  const dark = document.documentElement.dataset.theme ? document.documentElement.dataset.theme === 'dark' : matchMedia('(prefers-color-scheme: dark)').matches;
  document.documentElement.dataset.theme = dark ? 'light' : 'dark';
  Store.set('theme', document.documentElement.dataset.theme);
});

/* ───── Casos tipo examen ───── */
function xEnunciado(cs) {
  return `<div class="card"><span class="tag">${KLABEL[cs.kind]} · ${cs.pts} puntos</span>
    <p><b>${cs.title}</b></p><p>${cs.enunciado}</p>
    <p><b>Requerimientos:</b></p><ul>${cs.requisitos.map(r => `<li>${r}</li>`).join('')}</ul>
    <p><b>Se pide:</b> ${cs.sepide}</p></div>`;
}
function xSolucion(cs) {
  return `<h2>Solución</h2>${Diagram.legend(['cliente', 'computo', 'integracion', 'datos', 'red', 'seguridad', 'monitoreo', 'web'])}
    <div class="legend">${['cloud', 'vpc', 'pub', 'priv', 'onprem'].map(k => `<span><span class="cat" style="background:${ZONES[k].stroke}"></span>${ZONES[k].name}</span>`).join('')}</div>
    ${Diagram.render(cs.diagram)}
    <h3>Flujo paso a paso</h3><ol class="steps">${cs.flujo.map(f => `<li>${f}</li>`).join('')}</ol>
    <h3>Cómo se cumple cada requerimiento</h3><div class="tablewrap"><table><tr><th>Requerimiento</th><th>Solución</th></tr>${cs.tabla.map(([a, b]) => `<tr><td>${a}</td><td>${b}</td></tr>`).join('')}</table></div>
    ${cs.ddb.length ? `<h3>Tablas de DynamoDB</h3><div class="tablewrap"><table><tr><th>Tabla</th><th>PK</th><th>SK</th><th>Atributos</th><th>Patrón de acceso</th></tr>${cs.ddb.map(t => `<tr><td><b>${t.tabla}</b></td><td><code>${t.pk}</code></td><td><code>${t.sk}</code></td><td>${t.attrs}</td><td>${t.uso}</td></tr>`).join('')}</table></div>` : ''}
    ${cs.notas.map(n => `<div class="note">${n}</div>`).join('')}`;
}
const KLABEL = { ejemplo: 'Ejemplo resuelto', practica: 'Práctica', real: 'Examen Final real' };
function pageExamen(id) {
  if (id === 'final') return pageExamenFinal();
  const cs = XCASES.find(c => c.id === id);
  if (!cs) {
    const tile = c => `<a class="tile" href="#/examen/${c.id}"><span class="wk">${KLABEL[c.kind]} · ${c.pts} pts</span><b>${c.title}</b><span>${c.enunciado.replace(/<[^>]+>/g, '').slice(0, 130)}…</span></a>`;
    app.innerHTML = `<h1>Casos tipo examen</h1>
    <p class="lead">Problemas con el formato del examen: un enunciado de negocio, requerimientos no funcionales y “se pide el diagrama 100% AWS con VPC, subnets, endpoints, NAT, conexión on-premise y tablas PK/SK”.</p>
    <div class="note"><span class="tag warn">fuera de las diapositivas</span> VPC, subnets, NAT, VPC Endpoints, VPN y Direct Connect, Secrets Manager, KMS, ALB, ECS y EC2, el patrón Saga, la idempotencia y el diseño PK/SK <b>no están en <code>Clases/</code></b>. Es conocimiento general de AWS, agregado porque el examen lo pide. Revisa estas soluciones con criterio y con tu profesor.</div>
    <h2>1. Conceptos que necesitas para estos problemas</h2>
    ${CONCEPTS.map(c => `<details><summary>${c.t}</summary>${Diagram.fill(c.h)}</details>`).join('')}
    <h2>2. Examen Final real (Prof. Santiago Silva)</h2><p>Las 3 preguntas del examen. La 1 está resuelta como ejemplo; la 2 y la 3 tienen la solución oculta hasta que la pidas.</p>
    <div class="grid">${XCASES.filter(c => c.real).sort((a, b) => a.real - b.real).map(tile).join('')}<a class="tile" href="#/examen/final" style="border-color:var(--accent)"><span class="wk">Simulacro · ${EXAMEN_REAL.min} min · 20 pts</span><b>⏱ Rendir el examen completo</b><span>Las 3 preguntas con tiempo, en el editor. Al terminar ves tu nota estimada sobre 20 y las soluciones.</span></a></div>
    <h2>3. Ejemplos resueltos</h2><p>Lee el enunciado, intenta el diagrama y luego compáralo con la solución completa.</p>
    <div class="grid">${XCASES.filter(c => c.kind === 'ejemplo').map(tile).join('')}</div>
    <h2>4. Problemas de práctica</h2><p>Ármalos en el editor (con zonas VPC y subnets). El corrector revisa servicios, conexiones, ubicación en la red y que anotes PK/SK, idempotencia y reintentos.</p>
    <div class="grid">${XCASES.filter(c => c.kind === 'practica').map(tile).join('')}</div>`;
    return;
  }
  const ej = cs.kind === 'ejemplo';
  app.innerHTML = `<p><a href="#/examen">← Casos tipo examen</a></p>
  <h1>${cs.title}</h1>${xEnunciado(cs)}
  ${ej ? `<div id="solbox">${xSolucion(cs)}</div>
    <h2>Practícalo en el editor</h2><p>Dibújalo tú sin mirar la solución y presiona Corregir.</p>`
  : `<h2>Pistas</h2>${cs.pistas.map((p, i) => `<details><summary>Pista ${i + 1}</summary>${p}</details>`).join('')}
    <h2>Arma tu diagrama</h2>
    <div class="note">Tip: primero agrega las <b>zonas</b> (AWS Cloud, VPC, subnet pública y privada, on-premise) y luego pon los servicios dentro. Anota PK/SK en el nombre del nodo DynamoDB (doble clic), por ejemplo “Pagos PK=USER#id SK=PAGO#fecha”.</div>`}
  <div id="ed"></div>
  <div class="row" style="margin:10px 0"><button class="btn" id="corr">✔ Corregir</button>${ej ? '' : '<button class="btn ghost" id="sol">Ver solución</button>'}</div>
  <div id="gr"></div>${ej ? '' : '<div id="solx"></div>'}`;
  const ed = Editor.mount($('#ed'), { caseId: cs.id });
  $('#corr').addEventListener('click', () => { $('#gr').innerHTML = Editor.renderGrade(ed.grade()); $('#gr').scrollIntoView({ behavior: 'smooth' }); });
  if (!ej) $('#sol').addEventListener('click', () => { $('#solx').innerHTML = xSolucion(cs); $('#sol').remove(); });
}

/* ───── Simulacro del Examen Final real ───── */
function pageExamenFinal() {
  clearInterval(timerId);
  const E = EXAMEN_REAL, items = E.items.map(it => ({ ...it, cs: findCase(it.id) }));
  app.innerHTML = `<p><a href="#/examen">← Casos tipo examen</a></p>
  <div class="row" style="justify-content:space-between"><h1 style="margin:0">${E.title}</h1><span class="timer" id="tm"></span></div>
  <div class="card"><b>Instrucciones</b><ul>${E.instrucciones.map(i => `<li>${i}</li>`).join('')}</ul>
    <p>Cada pregunta se arma en el editor. Al terminar se corrige sola y la nota de cada pregunta es <i>% del corrector × puntaje</i>. Es una <b>estimación</b>: tu profesor también evalúa tus justificaciones.</p>
    <button class="btn" id="start">Empezar (${E.min} min)</button></div>
  <div id="exam" hidden>${items.map((it, i) => `<h2>Pregunta ${i + 1} (${it.pts} puntos)</h2>${xEnunciado(it.cs)}<div id="ed${i}"></div>`).join('')}
    <div class="row" style="margin:20px 0"><button class="btn" id="fin">Terminar y corregir</button></div></div>
  <div id="res"></div>`;
  let eds = [];
  $('#start').addEventListener('click', () => {
    $('#start').closest('.card').querySelector('button').remove();
    $('#exam').hidden = false;
    eds = items.map((it, i) => { Store.set('ed:final-' + it.id, null); return Editor.mount($('#ed' + i), { caseId: it.id, key: 'final-' + it.id }); });
    let left = E.min * 60;
    const tick = () => { const m = Math.floor(left / 60), s = left % 60; $('#tm').textContent = `⏱ ${m}:${String(s).padStart(2, '0')}`; if (left-- <= 0) { clearInterval(timerId); finish(); } };
    tick(); timerId = setInterval(tick, 1000);
    $('#fin').addEventListener('click', () => { if (confirm('¿Terminar el examen y ver tu nota?')) finish(); });
  });
  const finish = () => {
    clearInterval(timerId);
    $('#fin')?.remove();
    const grades = eds.map(ed => ed.grade());
    const pts = grades.map((g, i) => Math.round(g.pct * items[i].pts) / 100);
    const total = Math.round(pts.reduce((a, b) => a + b, 0) * 10) / 10;
    const bb = best(); if (bb.final == null || total > bb.final) { bb.final = total; Store.set('best', bb); }
    $('#res').innerHTML = `<div class="card"><div class="score">Nota estimada: ${total} / 20</div>
      <p>${items.map((it, i) => `Pregunta ${i + 1}: <b>${pts[i]} / ${it.pts}</b> (${grades[i].pct}%)`).join(' · ')}</p></div>
      ${items.map((it, i) => `<details class="card"><summary>Pregunta ${i + 1}: corrección y solución</summary>${Editor.renderGrade(grades[i])}${xSolucion(it.cs)}</details>`).join('')}`;
    $('#res').scrollIntoView({ behavior: 'smooth' });
  };
}

route();
