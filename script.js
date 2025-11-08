// Client-side Dijkstra with Tamil Nadu defaults

function parseEdges(text, undirected = true) {
  const graph = new Map();
  const ensure = (u) => { if (!graph.has(u)) graph.set(u, new Map()); };

  for (const raw of text.split(/\r?\n/)) {
    const line = raw.trim();
    if (!line || line.startsWith('#')) continue;
    const parts = line.split(/\s+/);
    if (parts.length < 2) throw new Error(`Invalid edge line (need at least u v): ${line}`);
    const u = parts[0];
    const v = parts[1];
    const w = parts.length >= 3 ? Number(parts[2]) : 1;
    if (!Number.isFinite(w) || w < 0) throw new Error(`Invalid weight at line: ${line}`);
    ensure(u); ensure(v);
    graph.get(u).set(v, w);
    if (undirected) graph.get(v).set(u, w);
  }
  return graph;
}

function dijkstra(graph, source) {
  const dist = new Map();
  const prev = new Map();
  const visited = new Set();
  for (const u of graph.keys()) { dist.set(u, Infinity); prev.set(u, null); }
  if (!graph.has(source)) throw new Error(`Source '${source}' not in graph.`);
  dist.set(source, 0);

  // Simple priority queue
  const pq = [[0, source]];
  const push = (d, u) => { pq.push([d, u]); };
  const pop = () => { pq.sort((a,b)=>a[0]-b[0]); return pq.shift(); };

  while (pq.length) {
    const [dCur, u] = pop();
    if (visited.has(u)) continue;
    visited.add(u);
    const adj = graph.get(u) || new Map();
    for (const [v, w] of adj.entries()) {
      const alt = dCur + w;
      if (alt < (dist.get(v) ?? Infinity)) {
        dist.set(v, alt);
        prev.set(v, u);
        push(alt, v);
      }
    }
  }
  return { dist, prev };
}

function reconstructPath(prev, target) {
  const path = [];
  let cur = target;
  while (cur != null) { path.push(cur); cur = prev.get(cur) ?? null; }
  path.reverse();
  return path;
}

function extractNodes(text) {
  const nodes = new Set();
  for (const raw of text.split(/\r?\n/)) {
    const line = raw.trim();
    if (!line || line.startsWith('#')) continue;
    const parts = line.split(/\s+/);
    if (parts.length >= 2) { nodes.add(parts[0]); nodes.add(parts[1]); }
  }
  return Array.from(nodes).sort();
}

const defaultEdges = [
  'Chennai Chengalpattu 52',
  'Chennai Tiruvallur 48',
  'Chengalpattu Kanchipuram 35',
  'Tiruvallur Kanchipuram 60',
  'Kanchipuram Vellore 80',
  'Vellore Ranipet 20',
  'Vellore Tirupattur 85',
  'Ranipet Tiruvannamalai 95',
  'Tiruvannamalai Villupuram 65',
  'Villupuram Cuddalore 25',
  'Cuddalore Mayiladuthurai 110',
  'Mayiladuthurai Nagapattinam 40',
  'Nagapattinam Tiruvarur 25',
  'Tiruvarur Thanjavur 55',
  'Thanjavur Ariyalur 50',
  'Ariyalur Perambalur 30',
  'Perambalur Tiruchirappalli 60',
  'Tiruchirappalli Karur 80',
  'Karur Namakkal 45',
  'Namakkal Salem 55',
  'Salem Dharmapuri 65',
  'Dharmapuri Krishnagiri 45',
  'Salem Erode 70',
  'Erode Tiruppur 55',
  'Tiruppur Coimbatore 45',
  'Coimbatore Nilgiris 85',
  'Karur Dindigul 75',
  'Dindigul Madurai 65',
  'Madurai Theni 75',
  'Madurai Sivaganga 50',
  'Sivaganga Ramanathapuram 55',
  'Ramanathapuram Thoothukudi 115',
  'Thoothukudi Tirunelveli 50',
  'Tirunelveli Tenkasi 55',
  'Tenkasi Virudhunagar 85',
  'Virudhunagar Madurai 45',
  'Cuddalore Pudukkottai 160',
  'Pudukkottai Sivaganga 70',
  'Thanjavur Pudukkottai 60',
].join('\n');

function renderResult(ok, html) {
  const container = document.getElementById('result');
  const content = document.getElementById('resultContent');
  content.innerHTML = html;
  container.hidden = false;
}

function escapeHtml(s) {
  return s.replace(/[&<>\\"']/g, c=>({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;' }[c]));
}

window.addEventListener('DOMContentLoaded', () => {
  const edgesEl = document.getElementById('edges');
  const sourceEl = document.getElementById('source');
  const targetEl = document.getElementById('target');
  const undirectedEl = document.getElementById('undirected');
  const nodesDl = document.getElementById('nodes');
  const form = document.getElementById('form');

  // preload
  edgesEl.value = defaultEdges;
  sourceEl.value = 'Chennai';
  targetEl.value = 'Madurai';

  const refillNodes = () => {
    nodesDl.innerHTML = '';
    const nodes = extractNodes(edgesEl.value);
    for (const n of nodes) {
      const opt = document.createElement('option');
      opt.value = n; nodesDl.appendChild(opt);
    }
  };
  refillNodes();
  edgesEl.addEventListener('input', refillNodes);

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    try {
      const graph = parseEdges(edgesEl.value.trim(), undirectedEl.checked);
      const { dist, prev } = dijkstra(graph, sourceEl.value.trim());
      const total = dist.get(targetEl.value.trim());
      if (total === undefined || !isFinite(total)) {
        renderResult(false, `<div class="error">No path found between ${escapeHtml(sourceEl.value)} and ${escapeHtml(targetEl.value)}.</div>`);
        return;
      }
      const path = reconstructPath(prev, targetEl.value.trim());
      const html = `
        <div class="kv">
          <div>Shortest Path</div>
          <div class="path">${path.map(escapeHtml).join(' → ')}</div>
          <div>Total Distance (km)</div>
          <div>${total.toFixed(3)} km</div>
          <div>All Distances</div>
          <div class="muted">${escapeHtml(JSON.stringify(Object.fromEntries(dist), null, 0))}</div>
        </div>`;
      renderResult(true, html);
    } catch (err) {
      renderResult(false, `<div class="error">${escapeHtml(String(err.message || err))}</div>`);
    }
  });
});