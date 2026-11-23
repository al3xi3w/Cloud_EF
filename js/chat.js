/* Chat de IA sobre el curso. Llama a la API de Claude desde el navegador con la clave del propio usuario.
   La clave NUNCA está en el repositorio: el usuario la pega y se guarda solo en su navegador. */
import Anthropic from 'https://cdn.jsdelivr.net/npm/@anthropic-ai/sdk@1.6.0/+esm';

const MODEL = 'claude-opus-5-5';
const KEY_NAME = 'cloudef:apikey';

/* ───── Prompt de sistema: todo el material de clase (estable → se cachea) ───── */
const strip = h => h.replace(/\{\{dia:[\w-]+\}\}|\{\{lambda-timeline\}\}/g, '[diagrama]').replace(/<li>/g, '\n- ').replace(/<\/(p|h\d|tr|div|ol|ul)>/g, '\n').replace(/<(td|th)[^>]*>/g, ' | ').replace(/<[^>]+>/g, '').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&').replace(/\n\s*\n+/g, '\n').trim();

function buildMaterial() {
  const lessons = LESSONS.map(l => `## CLASE: ${l.title} (${DECKS[l.deck].week}, abreviatura ${l.deck})\n${strip(l.html)}`).join('\n\n');
  const svcs = SERVICES.map(s => `### ${s.name} [${CATS[s.cat].name}]${s.fuera ? ' (solo aparece en un diagrama, sin descripción en las diapositivas)' : ''}\nQué hace: ${strip(s.que)} (${s.src})\nCuándo usarlo:\n${s.cuando.map(c => '- ' + strip(c)).join('\n')}${s.datos ? '\nDatos:\n' + s.datos.map(c => '- ' + strip(c)).join('\n') : ''}\nEjemplos de clase:\n${s.ejemplos.map(c => '- ' + c).join('\n')}`).join('\n\n');
  const open = OPEN.map(o => `P: ${o.q}\nR: ${strip(o.a)} (${o.src})`).join('\n\n');
  const cases = CASES.map(c => `### Caso: ${c.title} (${c.origin})\nEnunciado: ${strip(c.enunciado)}\nServicios clave: ${c.req.map(id => SVC[id].name).join(', ')}\nSolución de referencia:\n${c.explica.map(e => '- ' + strip(e)).join('\n')}${c.notas.length ? '\nNotas:\n' + c.notas.map(n => '- ' + strip(n)).join('\n') : ''}`).join('\n\n');
  return `# MATERIAL DEL CURSO CS2032 Cloud Computing (UTEC), Prof. Geraldo Colchado
Abreviaturas de las fuentes: ${Object.entries(DECKS).map(([k, d]) => `${k} = ${d.name} (${d.week})`).join('; ')}.

${lessons}

# CATÁLOGO DE SERVICIOS DE AWS VISTOS EN CLASE
${svcs}

# PREGUNTAS DE CIERRE DEL PROFESOR CON RESPUESTA MODELO
${open}

# CASOS DE DIAGRAMA DE ARQUITECTURA Y SUS SOLUCIONES DE REFERENCIA
${cases}`;
}

const INSTRUCTIONS = `Eres el asistente de estudio de una web para preparar el Examen Final del curso CS2032 Cloud Computing (UTEC). Ayudas a una estudiante a entender los temas y a diseñar diagramas de arquitectura de solución en AWS, que es lo que pedirá el examen.

Reglas:
- Responde en español, claro y directo, como un buen tutor. Explica desde cero cuando te lo pidan y usa ejemplos de la clase.
- Basa tus respuestas en el MATERIAL DEL CURSO de abajo. Cita la diapositiva entre paréntesis con su abreviatura, por ejemplo (SV p.15) o (EV p.12).
- Si algo no está en el material, dilo explícitamente ("esto no está en las diapositivas de clase"). Solo entonces puedes dar una explicación general breve, marcada como "(fuera de las diapositivas)". No inventes datos, cifras ni nombres de diapositivas.
- Cuando te pidan diseñar o revisar una arquitectura, usa los servicios y patrones de clase, justifica cada servicio en una línea con su diapositiva y describe el diagrama como flujo (Actor → API Gateway → Lambda → …).
- Si el mensaje incluye "Contexto de la página" o "Mi diagrama", úsalo para responder sobre lo que la estudiante está viendo o armando.
- Usa formato breve: párrafos cortos, listas con "-", **negritas** para lo clave. No uses tablas ni encabezados grandes.`;

let SYSTEM = null;
const system = () => SYSTEM || (SYSTEM = [{ type: 'text', text: INSTRUCTIONS + '\n\n' + buildMaterial(), cache_control: { type: 'ephemeral' } }]);

/* ───── clave ───── */
const getKey = () => { try { return sessionStorage.getItem(KEY_NAME) || localStorage.getItem(KEY_NAME) || ''; } catch { return ''; } };
const setKey = (k, remember) => { try { sessionStorage.setItem(KEY_NAME, k); if (remember) localStorage.setItem(KEY_NAME, k); else localStorage.removeItem(KEY_NAME); } catch {} };
const forgetKey = () => { try { sessionStorage.removeItem(KEY_NAME); localStorage.removeItem(KEY_NAME); } catch {} };

/* ───── contexto de la página actual (va en el mensaje, no en el system, para no romper la caché) ───── */
function pageContext() {
  const [, page = 'inicio', a] = (location.hash || '#/inicio').split('/');
  const parts = [];
  if (page === 'aprende' && a) { const l = LESSONS.find(x => x.id === a); if (l) parts.push(`Estoy leyendo la clase "${l.title}".`); }
  if ((page === 'diagramas' || page === 'editor') && a) { const c = CASES.find(x => x.id === a); if (c) parts.push(`Estoy en el caso "${c.title}".`); }
  if (page === 'editor' || (page === 'diagramas' && a)) {
    const m = Store.get('ed:' + (a || 'libre'), null);
    if (m && m.nodes.length) {
      const by = Object.fromEntries(m.nodes.map(n => [n.id, n]));
      const tn = n => `${n.label} [${n.type === 'actor' ? 'Actor' : SVC[n.type].name}]`;
      parts.push('Mi diagrama:\nNodos: ' + m.nodes.map(tn).join('; ') + '\nFlechas:\n' + (m.edges.map(e => by[e.from] && by[e.to] ? `- ${tn(by[e.from])} → ${tn(by[e.to])}${e.label ? ` ("${e.label}")` : ''}` : '').filter(Boolean).join('\n') || '(ninguna)'));
    }
  }
  return parts.length ? `Contexto de la página:\n${parts.join('\n')}` : '';
}
const inExam = () => /^#\/simulacros\/s\d/.test(location.hash) && document.getElementById('fin');

/* ───── markdown mínimo ───── */
function md(t) {
  const esc = t.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  const lines = esc.split('\n'); let html = '', inList = false;
  for (const raw of lines) {
    let l = raw.replace(/\*\*(.+?)\*\*/g, '<b>$1</b>').replace(/`([^`]+)`/g, '<code>$1</code>').replace(/^#{1,4}\s*(.*)$/, '<b>$1</b>');
    if (/^\s*([-*]|\d+\.)\s+/.test(l)) { if (!inList) { html += '<ul>'; inList = true; } html += `<li>${l.replace(/^\s*([-*]|\d+\.)\s+/, '')}</li>`; }
    else { if (inList) { html += '</ul>'; inList = false; } html += l.trim() ? `<p>${l}</p>` : ''; }
  }
  return html + (inList ? '</ul>' : '');
}

/* ───── UI ───── */
const SUGG = ['¿Cuándo uso SNS y cuándo EventBridge?', 'Explícame el cold start desde cero', 'Revisa mi diagrama y dime qué le falta', '¿Qué patrón multi-tenant conviene para datos sensibles?'];
const box = document.createElement('div');
box.innerHTML = `
<button id="chat-fab" aria-label="Abrir chat de IA">💬 Pregúntale a la IA</button>
<section id="chat" hidden aria-label="Chat de IA">
  <header><b>Asistente del curso</b><span class="chat-sub">Responde con el material de clase</span>
    <button id="chat-set" title="Configurar clave">⚙</button><button id="chat-new" title="Nueva conversación">↺</button><button id="chat-x" title="Cerrar">✕</button></header>
  <div id="chat-key" hidden>
    <p>Para usar el chat necesitas tu propia <b>clave de API de Anthropic</b> (<a href="https://console.anthropic.com/settings/keys" target="_blank" rel="noopener">console.anthropic.com</a>). Cada pregunta se cobra a tu cuenta.</p>
    <input id="chat-k" type="password" placeholder="sk-ant-…" autocomplete="off">
    <label><input type="checkbox" id="chat-rem"> Recordarla en este navegador</label>
    <p class="chat-warn">La clave solo se guarda en tu navegador y se envía directo a la API de Anthropic. No la uses en computadoras compartidas. Si no marcas “recordar”, se borra al cerrar la pestaña.</p>
    <div class="row"><button class="btn" id="chat-save">Guardar</button><button class="btn ghost" id="chat-forget">Olvidar clave</button></div>
  </div>
  <div id="chat-log"></div>
  <div id="chat-sugg">${SUGG.map(s => `<button class="chip">${s}</button>`).join('')}</div>
  <form id="chat-f"><label class="chat-ctx"><input type="checkbox" id="chat-usectx" checked> Incluir la página que estoy viendo (y mi diagrama)</label>
    <div class="chat-in"><textarea id="chat-q" rows="2" placeholder="Escribe tu pregunta…"></textarea><button class="btn" id="chat-send">Enviar</button></div></form>
</section>`;
document.body.appendChild(box);
const $c = id => document.getElementById(id);
const log = $c('chat-log');
let history = [], busy = false, controller = null;

const showKey = show => { $c('chat-key').hidden = !show; if (show) $c('chat-k').value = getKey(); };
const add = (role, html) => { const d = document.createElement('div'); d.className = 'msg ' + role; d.innerHTML = html; log.appendChild(d); log.scrollTop = log.scrollHeight; return d; };
const hello = () => { log.innerHTML = ''; add('ai', md('¡Hola! Pregúntame cualquier cosa de las clases (serverless, Lambdas, eventos, multi-tenancy, bases de datos, monitoreo) o pídeme que revise tu diagrama. Respondo con el material de clase y te digo de qué diapositiva sale.')); $c('chat-sugg').hidden = false; };

$c('chat-fab').addEventListener('click', () => { $c('chat').hidden = false; $c('chat-fab').hidden = true; if (!log.children.length) hello(); if (!getKey()) showKey(true); $c('chat-q').focus(); });
$c('chat-x').addEventListener('click', () => { $c('chat').hidden = true; $c('chat-fab').hidden = false; });
$c('chat-set').addEventListener('click', () => showKey($c('chat-key').hidden));
$c('chat-new').addEventListener('click', () => { controller?.abort(); history = []; hello(); });
$c('chat-save').addEventListener('click', () => { const k = $c('chat-k').value.trim(); if (!k) return; setKey(k, $c('chat-rem').checked); showKey(false); });
$c('chat-forget').addEventListener('click', () => { forgetKey(); $c('chat-k').value = ''; });
$c('chat-sugg').querySelectorAll('.chip').forEach(b => b.addEventListener('click', () => { $c('chat-q').value = b.textContent; send(); }));
$c('chat-q').addEventListener('keydown', e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); } });
$c('chat-f').addEventListener('submit', e => { e.preventDefault(); send(); });

async function send() {
  const q = $c('chat-q').value.trim();
  if (!q || busy) return;
  if (inExam()) { add('ai', md('El chat está desactivado mientras rindes un simulacro. Termínalo y luego pregúntame lo que quieras.')); return; }
  const key = getKey();
  if (!key) { showKey(true); return; }
  $c('chat-q').value = ''; $c('chat-sugg').hidden = true;
  add('me', md(q));
  const ctx = $c('chat-usectx').checked ? pageContext() : '';
  const userMsg = { role: 'user', content: ctx ? `${ctx}\n\nPregunta: ${q}` : q };
  const out = add('ai', '<span class="chat-dots">Pensando…</span>');
  busy = true; $c('chat-send').disabled = true;
  controller = new AbortController();
  let text = '';
  const client = new Anthropic({ apiKey: key, dangerouslyAllowBrowser: true });
  // Si Claude declina una pregunta, la API la reintenta en otro modelo (fallbacks: 'default').
  const run = async withFallback => {
    const params = { model: MODEL, max_tokens: 16000, output_config: { effort: 'medium' }, system: system(), messages: [...history, userMsg] };
    if (withFallback) Object.assign(params, { betas: ['server-side-fallback-2026-07-01'], fallbacks: 'default' });
    const stream = client.beta.messages.stream(params, { signal: controller.signal });
    for await (const ev of stream) {
      if (ev.type === 'content_block_delta' && ev.delta.type === 'text_delta') { text += ev.delta.text; out.innerHTML = md(text); log.scrollTop = log.scrollHeight; }
    }
    return stream.finalMessage();
  };
  try {
    let final;
    try { final = await run(true); }
    catch (e) { if (e?.status === 400 && /fallback/i.test(e.message || '') && !text) final = await run(false); else throw e; }
    if (final.stop_reason === 'refusal') { out.innerHTML = md(text + '\n\n_No puedo responder esa pregunta. Intenta reformularla sobre los temas del curso._'); }
    else {
      if (final.stop_reason === 'max_tokens') out.innerHTML += '<p class="chat-warn">(La respuesta se cortó por largo.)</p>';
      history.push(userMsg, { role: 'assistant', content: final.content });
    }
  } catch (err) {
    const s = err?.status;
    const msg = s === 401 ? 'La clave de API no es válida. Revísala en ⚙.' : s === 429 ? 'Demasiadas solicitudes o sin saldo. Espera un momento o revisa tu cuenta.' : s === 400 && /credit/i.test(err.message) ? 'Tu cuenta de Anthropic no tiene saldo.' : err?.name === 'AbortError' ? 'Cancelado.' : 'Error: ' + (err?.message || err);
    out.innerHTML = (text ? md(text) : '') + `<p class="chat-warn">${msg}</p>`;
    if (s === 401) showKey(true);
  } finally { busy = false; $c('chat-send').disabled = false; controller = null; }
}
