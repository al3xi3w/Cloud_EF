/* Dibuja los diagramas de DIAGRAMS como SVG. */
/* Estilo de las zonas (grupos) en diagramas y en el editor */
const ZONES = {
  cloud:   { name: 'AWS Cloud / Región', pad: 48, stroke: '#f08c00', fill: 'none', sw: 1.5, dash: false },
  vpc:     { name: 'VPC', pad: 30, stroke: '#7048e8', fill: 'color-mix(in srgb,#7048e8 4%,transparent)', sw: 1.5, dash: false },
  pub:     { name: 'Subnet pública', pad: 12, stroke: '#2f9e44', fill: 'color-mix(in srgb,#2f9e44 9%,transparent)', sw: 1.2, dash: false },
  priv:    { name: 'Subnet privada', pad: 12, stroke: '#1c7ed6', fill: 'color-mix(in srgb,#1c7ed6 8%,transparent)', sw: 1.2, dash: false },
  onprem:  { name: 'On-premise / Datacenter', pad: 14, stroke: '#868e96', fill: 'color-mix(in srgb,#868e96 8%,transparent)', sw: 1.2, dash: true },
  default: { name: 'Grupo', pad: 10, stroke: 'var(--muted)', fill: 'none', sw: 1, dash: true },
};

const Diagram = (() => {
  const BW = 150, BH = 54;          // tamaño de cada caja
  const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

  function wrap(text, max) {
    const words = String(text).split(' '), lines = [];
    let cur = '';
    for (const w of words) {
      if ((cur + ' ' + w).trim().length > max && cur) { lines.push(cur); cur = w; }
      else cur = (cur + ' ' + w).trim();
    }
    if (cur) lines.push(cur);
    return lines;
  }

  function render(id) {
    const d = DIAGRAMS[id];
    if (!d) return `<div class="note">Diagrama “${esc(id)}” no encontrado.</div>`;
    const vert = d.dir === 'v';
    const cw = d.cw || (vert ? 170 : 215), rh = vert ? 120 : 82;
    const minC = Math.min(...d.nodes.map(n => n[3])), minR = Math.min(...d.nodes.map(n => n[4]));
    const P = (d.groups || []).some(g => g[5] === 'cloud') ? 72 : (d.groups || []).some(g => g[5]) ? 50 : 30;
    const N = {};
    for (const [nid, label, cat, c, r, sub] of d.nodes) {
      const x = P + (c - minC) * cw, y = P + 18 + (r - minR) * rh;
      N[nid] = { nid, label, cat, sub, x, y, cx: x + BW / 2, cy: y + BH / 2, r: x + BW, b: y + BH };
    }
    const parts = [], labels = [];
    const col = c => (CATS[c] || CATS.cliente).color;

    // grupos
    let gMaxX = 0, gMaxY = 0;
    for (const [gl, c1, r1, c2, r2, kind] of d.groups || []) {
      const st = ZONES[kind] || ZONES.default, pad = st.pad;
      const x = P + (c1 - minC) * cw - pad, y = P + 18 + (r1 - minR) * rh - pad - 16;
      const w = (c2 - c1) * cw + BW + 2 * pad, h = (r2 - r1) * rh + BH + 2 * pad + 16;
      gMaxX = Math.max(gMaxX, x + w); gMaxY = Math.max(gMaxY, y + h);
      parts.push(`<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="10" style="fill:${st.fill};stroke:${st.stroke};stroke-width:${st.sw};${st.dash ? 'stroke-dasharray:6 4;' : ''}"/>`);
      const zi = kind && typeof iconSvg === 'function' ? 'z-' + kind : null;
      if (zi) parts.push(`<image href="${ICON_DIR}${zi}.svg" x="${x + 1}" y="${y + 1}" width="18" height="18"/>`);
      parts.push(`<text x="${x + (zi ? 24 : 8)}" y="${y + 13}" style="fill:${st.stroke};font-size:11px;font-weight:700">${esc(gl)}</text>`);
    }

    // aristas
    const inLabeled = {};
    for (const [a, b, lab] of d.edges) if (lab && N[a] && N[b] && N[b].x > N[a].x + BW / 2) inLabeled[b] = (inLabeled[b] || 0) + 1;
    for (const [a, b, lab, opt] of d.edges) {
      const s = N[a], t = N[b];
      if (!s || !t) continue;
      let path, lx, ly, anchor = 'middle';
      if (vert) {
        if (t.y > s.y) { const my = s.b + (t.y - s.b) / 2; path = `M${s.cx},${s.b} V${my} H${t.cx} V${t.y}`; lx = t.cx + 6; ly = my + (t.y - my) / 2 + 4; anchor = 'start'; }
        else { path = `M${s.r},${s.cy} H${t.x}`; lx = (s.r + t.x) / 2; ly = s.cy - 6; }
      } else if (Math.abs(t.x - s.x) < BW / 2) {               // misma columna: vertical
        const down = t.y > s.y;
        const y1 = down ? s.b : s.y, y2 = down ? t.y : t.b;
        path = `M${s.cx},${y1} V${y2}`; lx = s.cx + 6; ly = (y1 + y2) / 2 + 4; anchor = 'start';
      } else if (t.x > s.x) {                                   // hacia la derecha
        if (Math.abs(t.cy - s.cy) < 1) { path = `M${s.r},${s.cy} H${t.x}`; lx = (s.r + t.x) / 2; ly = s.cy - 7; }
        else {
          const mx = s.r + Math.min((t.x - s.r) * 0.5, (cw - BW) * 0.5); path = `M${s.r},${s.cy} H${mx} V${t.cy} H${t.x}`;
          // si varias flechas con etiqueta llegan al mismo nodo, la etiqueta va en el tramo de salida
          if (inLabeled[b] > 1) { lx = (s.r + mx) / 2; ly = s.cy - 7; } else { lx = (mx + t.x) / 2 + 4; ly = t.cy - 7; }
        }
      } else {                                                  // hacia la izquierda
        if (Math.abs(t.cy - s.cy) < 1) { path = `M${s.x},${s.cy} H${t.r}`; lx = (s.x + t.r) / 2; ly = s.cy - 7; }
        else { const up = t.cy < s.cy; const y1 = up ? s.y : s.b; path = `M${s.cx},${y1} V${t.cy} H${t.r}`; lx = (s.cx + t.r) / 2; ly = t.cy - 7; }
      }
      const dash = opt && opt.dash ? 'stroke-dasharray:5 4;' : '';
      parts.push(`<path d="${path}" style="fill:none;stroke:var(--muted);stroke-width:1.4;${dash}" marker-end="url(#ah-${id})"/>`);
      if (lab) {
        const lines = wrap(lab, 16);
        lines.forEach((ln, i) => labels.push(`<text x="${lx}" y="${ly - (lines.length - 1 - i) * 11}" text-anchor="${anchor}" style="fill:var(--ink);font-size:10px;paint-order:stroke;stroke:var(--card);stroke-width:4px;stroke-linejoin:round">${esc(ln)}</text>`));
      }
    }

    // nodos
    for (const n of Object.values(N)) {
      const c = col(n.cat);
      parts.push(`<g><rect x="${n.x}" y="${n.y}" width="${BW}" height="${BH}" rx="8" style="fill:var(--card);stroke:${c};stroke-width:2"/>`
        + `<rect x="${n.x}" y="${n.y}" width="6" height="${BH}" rx="3" style="fill:${c}"/>`);
      const ic = typeof labelIcon === 'function' ? labelIcon(n.label, n.cat) : null;
      if (ic) parts.push(iconSvg(ic, n.x + 13, n.cy - 15, 30));
      const tx = ic ? n.x + 48 + (BW - 52) / 2 : n.cx + 3;
      const avail = ic ? BW - 56 : BW - 14;
      const main = wrap(ic ? dropLambda(n.label, ic) : n.label, ic ? 14 : 20), sub = n.sub ? wrap(n.sub, ic ? 18 : 26) : [];
      const total = main.length * 14 + sub.length * 12;
      let ty = n.cy - total / 2 + 11;
      for (const ln of main) { parts.push(`<text x="${tx}" y="${ty}" text-anchor="middle" style="fill:var(--ink);font-size:${fitFont(ln, avail, ic ? 11.5 : 12).toFixed(1)}px;font-weight:600">${esc(ln)}</text>`); ty += 14; }
      for (const ln of sub) { parts.push(`<text x="${tx}" y="${ty}" text-anchor="middle" style="fill:var(--muted);font-size:${fitFont(ln, avail, ic ? 9.5 : 10).toFixed(1)}px">${esc(ln)}</text>`); ty += 12; }
      parts.push('</g>');
    }

    const W = Math.max(gMaxX + 10, Math.max(...Object.values(N).map(n => n.r)) + P + 10);
    const H = Math.max(gMaxY + 10, Math.max(...Object.values(N).map(n => n.b)) + P);
    return `<div class="dia"><svg viewBox="0 0 ${W} ${H}" style="width:100%;min-width:${Math.round(W * 0.62)}px;max-width:${W}px" role="img" aria-label="Diagrama ${esc(id)}">
<defs><marker id="ah-${id}" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0,0 L10,5 L0,10 z" style="fill:var(--muted)"/></marker></defs>
${parts.join('')}${labels.join('')}</svg></div>`;
  }

  function legend(cats) {
    return '<div class="legend">' + (cats || Object.keys(CATS)).map(k => `<span><span class="cat" style="background:${CATS[k].color}"></span>${CATS[k].name}</span>`).join('') + '</div>';
  }

  /* Gráfico de concurrencia de LM p.13 (10 solicitudes, entornos A–F) */
  function lambdaTimeline() {
    // [entorno, solicitud, inicio, init?, fin]  (unidades de tiempo aproximadas leídas del gráfico)
    const bars = [['A',1,0,1,4.6],['B',2,0.4,1,5],['C',3,0.4,1,5],['D',4,2.4,1,7],['E',5,3.4,1,8],['A',6,5.8,0,9.5],['B',7,6.4,0,10],['C',8,6.6,0,10.1],['F',9,7.8,1,11.6],['D',10,8.6,0,12.4]];
    const rows = ['A','B','C','D','E','F'], U = 52, X0 = 50, RH = 40, Y0 = 34;
    let s = `<line x1="${X0}" y1="16" x2="${X0 + 13 * U}" y2="16" style="stroke:var(--bad);stroke-width:2"/><text x="${X0}" y="12" style="fill:var(--bad);font-size:12px;font-style:italic">Tiempo →</text>`;
    rows.forEach((r, i) => s += `<circle cx="20" cy="${Y0 + i * RH + 14}" r="12" style="fill:var(--ok)"/><text x="20" y="${Y0 + i * RH + 18}" text-anchor="middle" style="fill:#fff;font-size:12px;font-weight:700">${r}</text>`);
    for (const [env, n, st, init, end] of bars) {
      const y = Y0 + rows.indexOf(env) * RH, x = X0 + st * U;
      s += `<circle cx="${x + 12}" cy="${y + 14}" r="11" style="fill:var(--warn)"/><text x="${x + 12}" y="${y + 18}" text-anchor="middle" style="fill:#fff;font-size:11px;font-weight:700">${n}</text>`;
      let bx = x + 26;
      if (init) { s += `<rect x="${bx}" y="${y + 2}" width="${U}" height="24" style="fill:color-mix(in srgb,#cc5de8 35%,var(--card));stroke:#cc5de8"/><text x="${bx + U / 2}" y="${y + 18}" text-anchor="middle" style="fill:var(--ink);font-size:11px">Init</text>`; bx += U; }
      const w = X0 + end * U - bx;
      s += `<rect x="${bx}" y="${y + 2}" width="${w}" height="24" style="fill:color-mix(in srgb,#5c7cfa 35%,var(--card));stroke:#5c7cfa"/><text x="${bx + w / 2}" y="${y + 18}" text-anchor="middle" style="fill:var(--ink);font-size:11px">Invoke</text>`;
    }
    const W = X0 + 13 * U + 10, H = Y0 + rows.length * RH;
    return `<div class="dia"><svg viewBox="0 0 ${W} ${H}" style="width:100%;min-width:520px;max-width:${W}px" role="img" aria-label="Concurrencia de 10 solicitudes en 6 entornos">${s}</svg></div>`;
  }

  function fill(html) {
    return html.replace(/\{\{dia:([\w-]+)\}\}/g, (_, k) => render(k)).replace(/\{\{lambda-timeline\}\}/g, lambdaTimeline);
  }

  return { render, legend, fill };
})();
