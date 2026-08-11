/* =========================================================
   CAMPUS ROUTE PLANNER - WEB VERSION
   The algorithmic behavior mirrors the supplied C program:
   places[] + graph[][] + DFS all paths + Dijkstra shortest path.
   Browser persistence uses localStorage instead of data.txt.
   ========================================================= */

const MAX_PLACES = 100;
const INF = 999999999;
const STORAGE_KEY = "campusRoutePlannerData";

let places = [];
let graph = [];
let selectedNodes = [];
let activeNodes = new Set();
let activeEdges = new Set();

const $ = (id) => document.getElementById(id);

function initializeGraph() {
  graph = Array.from({ length: MAX_PLACES }, () => Array(MAX_PLACES).fill(0));
}

function clearHighlights() {
  activeNodes.clear();
  activeEdges.clear();
}

function saveData() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify({
    places,
    graph: graph.slice(0, places.length).map(row => row.slice(0, places.length))
  }));
}

function loadData() {
  initializeGraph();
  const raw = localStorage.getItem(STORAGE_KEY);

  if (!raw) {
    loadSampleData();
    return;
  }

  try {
    const data = JSON.parse(raw);
    places = Array.isArray(data.places) ? data.places.slice(0, MAX_PLACES) : [];
    graph = Array.from({ length: MAX_PLACES }, () => Array(MAX_PLACES).fill(0));

    for (let i = 0; i < places.length; i++) {
      for (let j = 0; j < places.length; j++) {
        graph[i][j] = Number(data.graph?.[i]?.[j] || 0);
      }
    }
  } catch {
    places = [];
    initializeGraph();
    loadSampleData();
  }
}

function loadSampleData() {
  places = [
    "DIU Main Gate",
    "Academic Building",
    "Library",
    "Canteen",
    "Auditorium",
    "Lab Complex"
  ];
  initializeGraph();

  addEdgeRaw(0, 1, 4);
  addEdgeRaw(1, 2, 3);
  addEdgeRaw(1, 3, 2);
  addEdgeRaw(2, 4, 5);
  addEdgeRaw(3, 4, 4);
  addEdgeRaw(3, 5, 6);
  addEdgeRaw(4, 5, 2);

  saveData();
}

function addEdgeRaw(a, b, cost) {
  graph[a][b] = cost;
  graph[b][a] = cost;
}

function findPlace(name) {
  return places.findIndex(p => p === name);
}

function routes() {
  const list = [];
  for (let i = 0; i < places.length; i++) {
    for (let j = i + 1; j < places.length; j++) {
      if (graph[i][j] !== 0) list.push({ a: i, b: j, cost: graph[i][j] });
    }
  }
  return list;
}

function addPlace(name) {
  name = name.trim();
  if (!name) return "Invalid name!";
  if (places.length >= MAX_PLACES) return "Maximum place limit reached!";
  if (findPlace(name) !== -1) return "This place already exists!";

  places.push(name);
  saveData();
  render();
  return `Place "${name}" added successfully.`;
}

function deletePlace(index) {
  if (index < 0 || index >= places.length) return "Invalid place number!";

  places.splice(index, 1);

  for (let i = index; i < places.length; i++) {
    for (let j = 0; j < places.length + 1; j++) {
      graph[i][j] = graph[i + 1][j];
    }
  }
  for (let i = 0; i < places.length; i++) {
    for (let j = index; j < places.length; j++) {
      graph[i][j] = graph[i][j + 1];
    }
  }
  for (let i = 0; i < MAX_PLACES; i++) {
    graph[places.length][i] = 0;
    graph[i][places.length] = 0;
  }

  selectedNodes = [];
  clearHighlights();
  saveData();
  render();
  return "Place deleted successfully. Related routes were also removed.";
}

function addRoute(source, destination, cost) {
  source = Number(source);
  destination = Number(destination);
  cost = Number(cost);

  if (places.length < 2) return "You need at least 2 places first.";
  if (!Number.isInteger(source) || !Number.isInteger(destination) ||
      source < 0 || source >= places.length || destination < 0 || destination >= places.length) {
    return "Invalid place.";
  }
  if (source === destination) return "Source and destination cannot be the same.";
  if (!Number.isFinite(cost) || cost <= 0) return "Cost must be a valid positive number.";

  graph[source][destination] = cost;
  graph[destination][source] = cost;
  saveData();
  render();
  return "Route added/updated successfully.";
}

function updateRoute(source, destination, cost) {
  if (graph[source]?.[destination] === 0) return "No direct route exists between these places to update.";
  return addRoute(source, destination, cost).replace("added/updated", "updated");
}

function deleteRoute(source, destination) {
  if (graph[source]?.[destination] === 0) return "No direct route exists between these places.";
  graph[source][destination] = 0;
  graph[destination][source] = 0;
  clearHighlights();
  saveData();
  render();
  return "Route deleted successfully.";
}

/* =========================================================
   DFS - ALL POSSIBLE ROUTES
   Mirrors findAllPaths() in the C source.
   ========================================================= */
function findAllPaths(source, destination) {
  const visited = Array(places.length).fill(false);
  const path = [];
  const found = [];

  function dfs(current) {
    visited[current] = true;
    path.push(current);

    if (current === destination) {
      found.push([...path]);
    } else {
      for (let i = 0; i < places.length; i++) {
        if (graph[current][i] !== 0 && !visited[i]) {
          dfs(i);
        }
      }
    }

    path.pop();
    visited[current] = false;
  }

  dfs(source);
  return found;
}

/* =========================================================
   DIJKSTRA - SHORTEST PATH
   Mirrors shortestPath() + findMinimum() in the C source.
   ========================================================= */
function dijkstra(source, destination) {
  const distance = Array(places.length).fill(INF);
  const parent = Array(places.length).fill(-1);
  const used = Array(places.length).fill(false);

  distance[source] = 0;

  for (let i = 0; i < places.length; i++) {
    let minimum = INF;
    let current = -1;

    for (let j = 0; j < places.length; j++) {
      if (!used[j] && distance[j] < minimum) {
        minimum = distance[j];
        current = j;
      }
    }

    if (current === -1) break;
    used[current] = true;

    for (let j = 0; j < places.length; j++) {
      if (
        graph[current][j] !== 0 &&
        !used[j] &&
        distance[current] + graph[current][j] < distance[j]
      ) {
        distance[j] = distance[current] + graph[current][j];
        parent[j] = current;
      }
    }
  }

  if (distance[destination] === INF) return null;

  const route = [];
  let current = destination;
  while (current !== -1) {
    route.push(current);
    current = parent[current];
  }
  route.reverse();

  return { route, cost: distance[destination], distance, parent };
}

/* ---------------- Visualization ---------------- */

function nodePositions() {
  const count = places.length;
  if (!count) return [];

  const cx = 500, cy = 305;
  const rx = Math.min(370, 150 + count * 23);
  const ry = Math.min(220, 110 + count * 12);

  return places.map((_, i) => {
    if (count === 1) return { x: cx, y: cy };
    const angle = -Math.PI / 2 + (2 * Math.PI * i / count);
    return { x: cx + rx * Math.cos(angle), y: cy + ry * Math.sin(angle) };
  });
}

function edgeKey(a, b) {
  return a < b ? `${a}-${b}` : `${b}-${a}`;
}

function renderGraph() {
  const edgeLayer = $("edgeLayer");
  const nodeLayer = $("nodeLayer");
  const svg = $("graphSvg");

  edgeLayer.innerHTML = "";
  nodeLayer.innerHTML = "";

  $("emptyGraph").style.display = places.length ? "none" : "grid";

  const positions = nodePositions();

  routes().forEach(({a, b, cost}) => {
    const p1 = positions[a], p2 = positions[b];
    const key = edgeKey(a, b);
    const active = activeEdges.has(key);

    const line = document.createElementNS("http://www.w3.org/2000/svg", "line");
    line.setAttribute("x1", p1.x); line.setAttribute("y1", p1.y);
    line.setAttribute("x2", p2.x); line.setAttribute("y2", p2.y);
    line.setAttribute("class", `edge ${active ? "active" : ""}`);
    line.dataset.edge = key;
    edgeLayer.appendChild(line);

    const label = document.createElementNS("http://www.w3.org/2000/svg", "text");
    label.setAttribute("x", (p1.x + p2.x) / 2);
    label.setAttribute("y", (p1.y + p2.y) / 2 - 7);
    label.setAttribute("class", "edge-label");
    label.textContent = cost;
    edgeLayer.appendChild(label);
  });

  places.forEach((name, i) => {
    const g = document.createElementNS("http://www.w3.org/2000/svg", "g");
    const selected = selectedNodes.includes(i);
    const active = activeNodes.has(i);
    g.setAttribute("class", `node ${selected ? "selected" : ""} ${active ? "active" : ""}`);
    g.dataset.index = i;

    const circle = document.createElementNS("http://www.w3.org/2000/svg", "circle");
    circle.setAttribute("cx", positions[i].x);
    circle.setAttribute("cy", positions[i].y);
    circle.setAttribute("r", 25);

    const text = document.createElementNS("http://www.w3.org/2000/svg", "text");
    text.setAttribute("x", positions[i].x);
    text.setAttribute("y", positions[i].y + 4);
    text.textContent = String(i + 1);

    const labelGroup = document.createElementNS("http://www.w3.org/2000/svg", "g");
    labelGroup.setAttribute("class", "node-label-group");

    const words = String(name).split(/\s+/);
    const lines = [];
    let currentLine = "";
    words.forEach(word => {
      const candidate = currentLine ? `${currentLine} ${word}` : word;
      if (candidate.length > 18 && currentLine) {
        lines.push(currentLine);
        currentLine = word;
      } else {
        currentLine = candidate;
      }
    });
    if (currentLine) lines.push(currentLine);

    const shownLines = lines.slice(0, 2);
    if (lines.length > 2) shownLines[1] = `${shownLines[1].slice(0, 15)}…`;

    const labelAbove = positions[i].y > 450;
    const lineHeight = 13;
    const labelHeight = shownLines.length * lineHeight + 8;
    const maxChars = Math.max(...shownLines.map(line => line.length), 6);
    const labelWidth = Math.min(170, Math.max(62, maxChars * 7 + 18));
    const labelCenterY = labelAbove
      ? positions[i].y - 44 - labelHeight / 2
      : positions[i].y + 44 + labelHeight / 2;

    const labelBg = document.createElementNS("http://www.w3.org/2000/svg", "rect");
    labelBg.setAttribute("x", positions[i].x - labelWidth / 2);
    labelBg.setAttribute("y", labelCenterY - labelHeight / 2);
    labelBg.setAttribute("width", labelWidth);
    labelBg.setAttribute("height", labelHeight);
    labelBg.setAttribute("rx", 7);
    labelBg.setAttribute("class", "node-name-bg");

    const nameText = document.createElementNS("http://www.w3.org/2000/svg", "text");
    nameText.setAttribute("x", positions[i].x);
    nameText.setAttribute("y", labelCenterY - ((shownLines.length - 1) * lineHeight) / 2 + 4);
    nameText.setAttribute("class", "node-name");

    shownLines.forEach((line, lineIndex) => {
      const tspan = document.createElementNS("http://www.w3.org/2000/svg", "tspan");
      tspan.setAttribute("x", positions[i].x);
      if (lineIndex > 0) tspan.setAttribute("dy", lineHeight);
      tspan.textContent = line;
      nameText.appendChild(tspan);
    });

    const title = document.createElementNS("http://www.w3.org/2000/svg", "title");
    title.textContent = `${i + 1}. ${name}`;

    labelGroup.append(labelBg, nameText);
    g.append(circle, text, labelGroup, title);
    g.addEventListener("click", () => selectNode(i));
    nodeLayer.appendChild(g);
  });
}

function renderRouteList() {
  const list = routes();
  $("routeListCount").textContent = list.length;
  $("routeList").innerHTML = list.length
    ? list.map(r => `
      <div class="route-item">
        <span>${escapeHtml(places[r.a])} ↔ ${escapeHtml(places[r.b])}</span>
        <span class="route-cost">${r.cost}</span>
      </div>
    `).join("")
    : `<div class="no-routes">No routes available.</div>`;
}

function renderStats() {
  $("placeCount").textContent = places.length;
  $("routeCount").textContent = routes().length;
  $("edgeCost").textContent = routes().reduce((sum, r) => sum + r.cost, 0);
}

function render() {
  renderGraph();
  renderRouteList();
  renderStats();
}

function selectNode(index) {
  if (selectedNodes.length >= 2) selectedNodes = [];
  selectedNodes.push(index);
  clearHighlights();
  renderGraph();

  if (selectedNodes.length === 1) {
    $("selectionHint").textContent = `Selected: ${places[index]}. Select one more place.`;
  } else {
    $("selectionHint").textContent = `${places[selectedNodes[0]]} → ${places[selectedNodes[1]]} selected.`;
  }
}

function getSelectedPair() {
  if (selectedNodes.length !== 2) {
    toast("Select two places on the graph first.");
    return null;
  }
  if (selectedNodes[0] === selectedNodes[1]) {
    toast("Source and destination cannot be the same.");
    return null;
  }
  return selectedNodes;
}

function setResult(html, badge = "Ready") {
  $("resultBadge").textContent = badge;
  $("resultContent").innerHTML = html;
}

function showAllPlaces() {
  if (!places.length) return setResult(`<div class="result-empty"><h3>No places added yet.</h3></div>`, "Places");
  setResult(`
    <div><b>All Places / Buildings</b></div>
    <div class="path-row">
      ${places.map((p, i) => `<span class="path-node">${i + 1}. ${escapeHtml(p)}</span>`).join("")}
    </div>
  `, `${places.length} Places`);
}

function showAllRoutes() {
  const list = routes();
  setResult(`
    <div><b>All Routes</b></div>
    <div class="path-row">
      ${list.length ? list.map(r => `<span class="path-node">${escapeHtml(places[r.a])} ↔ ${escapeHtml(places[r.b])} (${r.cost})</span>`).join("") : "<span>No routes available.</span>"}
    </div>
  `, `${list.length} Routes`);
}

function runDFS() {
  const pair = getSelectedPair();
  if (!pair) return;

  const [source, destination] = pair;
  const paths = findAllPaths(source, destination);

  clearHighlights();

  if (!paths.length) {
    renderGraph();
    return setResult(`
      <div><b>No possible routes found.</b></div>
      <p>${escapeHtml(places[source])} → ${escapeHtml(places[destination])}</p>
    `, "DFS • 0 paths");
  }

  paths[0].forEach(n => activeNodes.add(n));
  for (let i = 1; i < paths[0].length; i++) activeEdges.add(edgeKey(paths[0][i-1], paths[0][i]));
  renderGraph();

  setResult(`
    <div><b>All Possible Routes</b></div>
    <p>DFS found <b>${paths.length}</b> possible route(s).</p>
    ${paths.map((path, index) => `
      <div class="path-row">
        <span class="path-node">${index + 1}</span>
        ${path.map((n, i) => `<span class="path-node">${escapeHtml(places[n])}</span>${i < path.length - 1 ? '<span class="arrow">→</span>' : ''}`).join("")}
      </div>
    `).join("")}
  `, `DFS • ${paths.length} paths`);
}

function runDijkstra() {
  const pair = getSelectedPair();
  if (!pair) return;

  const [source, destination] = pair;
  const result = dijkstra(source, destination);

  clearHighlights();

  if (!result) {
    renderGraph();
    return setResult(`<div><b>No route exists between these places.</b></div>`, "Dijkstra • No path");
  }

  result.route.forEach(n => activeNodes.add(n));
  for (let i = 1; i < result.route.length; i++) {
    activeEdges.add(edgeKey(result.route[i-1], result.route[i]));
  }
  renderGraph();

  setResult(`
    <div class="result-main">
      <div class="result-number">${result.cost}</div>
      <div><b>Total Cost / Distance</b><br><small>Dijkstra shortest route</small></div>
    </div>
    <div class="path-row">
      ${result.route.map((n, i) => `<span class="path-node">${escapeHtml(places[n])}</span>${i < result.route.length - 1 ? '<span class="arrow">→</span>' : ''}`).join("")}
    </div>
  `, "Dijkstra • Shortest");
}

/* ---------------- Modal UI ---------------- */

function openModal(content) {
  $("modalContent").innerHTML = content;
  $("modalBackdrop").classList.add("open");
}

function closeModal() {
  $("modalBackdrop").classList.remove("open");
}

function placeOptions(selected = "") {
  return places.map((p, i) =>
    `<option value="${i}" ${String(i) === String(selected) ? "selected" : ""}>${i + 1}. ${escapeHtml(p)}</option>`
  ).join("");
}

function addPlaceModal() {
  openModal(`
    <h3>Add Place / Building</h3>
    <p>Add a new vertex to the campus graph.</p>
    <div class="form-row">
      <label>Place / Building Name</label>
      <input id="placeNameInput" maxlength="99" placeholder="e.g. Library">
    </div>
    <div class="form-actions">
      <button class="secondary-btn" onclick="closeModal()">Cancel</button>
      <button class="primary-btn" id="modalSubmit">Add Place</button>
    </div>
  `);
  $("placeNameInput").focus();
  $("modalSubmit").onclick = () => {
    const msg = addPlace($("placeNameInput").value);
    closeModal();
    toast(msg);
  };
}

function routeModal(mode) {
  if (places.length < 2) return toast("Add at least two places first.");

  openModal(`
    <h3>${mode === "add" ? "Add Route" : mode === "update" ? "Update Route Cost" : "Delete Route"}</h3>
    <p>Choose source and destination from the current graph.</p>
    <div class="form-row"><label>Source</label><select id="sourceInput">${placeOptions()}</select></div>
    <div class="form-row"><label>Destination</label><select id="destinationInput">${placeOptions()}</select></div>
    ${mode !== "delete" ? `<div class="form-row"><label>${mode === "update" ? "New " : ""}Route Cost / Distance</label><input id="costInput" type="number" min="1" step="1" placeholder="e.g. 10"></div>` : ""}
    <div class="form-actions">
      <button class="secondary-btn" onclick="closeModal()">Cancel</button>
      <button class="${mode === "delete" ? "danger-outline" : "primary-btn"}" id="modalSubmit">${mode === "add" ? "Add Route" : mode === "update" ? "Update Cost" : "Delete Route"}</button>
    </div>
  `);

  $("modalSubmit").onclick = () => {
    const a = Number($("sourceInput").value);
    const b = Number($("destinationInput").value);
    let msg;

    if (mode === "add") msg = addRoute(a, b, $("costInput").value);
    if (mode === "update") msg = updateRoute(a, b, $("costInput").value);
    if (mode === "delete") msg = deleteRoute(a, b);

    closeModal();
    toast(msg);
  };
}

function deletePlaceModal() {
  if (!places.length) return toast("No places added yet.");
  openModal(`
    <h3>Delete Place / Building</h3>
    <p>Deleting a place also removes all connected routes.</p>
    <div class="form-row"><label>Place</label><select id="placeDeleteInput">${placeOptions()}</select></div>
    <div class="form-actions">
      <button class="secondary-btn" onclick="closeModal()">Cancel</button>
      <button class="danger-outline" id="modalSubmit">Delete Place</button>
    </div>
  `);
  $("modalSubmit").onclick = () => {
    const msg = deletePlace(Number($("placeDeleteInput").value));
    closeModal();
    toast(msg);
  };
}

// এই ফাংশনটি আপডেট করা হয়েছে যেন ডাটা মুছে না যায়
function resetData() {
  // আগের কোড: localStorage.removeItem(STORAGE_KEY); (এটি ডিলিট করে দেওয়া হয়েছে)
  
  selectedNodes = [];
  clearHighlights();
  render();
  setResult(`<div class="result-empty"><h3>View Reset</h3><p>Your saved data is intact.</p></div>`, "View Reset");
  toast("View cleared, data kept safe.");
}

function exportData() {
  const data = {
    places,
    graph: graph.slice(0, places.length).map(row => row.slice(0, places.length))
  };
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "campus-network.json";
  a.click();
  URL.revokeObjectURL(url);
}

function importData(file) {
  const reader = new FileReader();
  reader.onload = () => {
    try {
      const data = JSON.parse(reader.result);
      if (!Array.isArray(data.places) || data.places.length > MAX_PLACES) throw new Error();
      places = data.places;
      initializeGraph();
      for (let i = 0; i < places.length; i++) {
        for (let j = 0; j < places.length; j++) {
          graph[i][j] = Number(data.graph?.[i]?.[j] || 0);
        }
      }
      saveData();
      selectedNodes = [];
      clearHighlights();
      render();
      toast("Data imported successfully.");
    } catch {
      toast("Invalid JSON network file.");
    }
  };
  reader.readAsText(file);
}

function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, c => ({
    "&":"&amp;", "<":"&lt;", ">":"&gt;", '"':"&quot;", "'":"&#039;"
  }[c]));
}

let toastTimer;
function toast(message) {
  const el = $("toast");
  el.textContent = message;
  el.classList.add("show");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => el.classList.remove("show"), 2800);
}

/* ---------------- Event wiring ---------------- */

$("addPlaceBtn").onclick = addPlaceModal;
$("addRouteBtn").onclick = () => routeModal("add");
$("updateRouteBtn").onclick = () => routeModal("update");
$("deleteRouteBtn").onclick = () => routeModal("delete");
$("deletePlaceBtn").onclick = deletePlaceModal;
$("showPlacesBtn").onclick = showAllPlaces;
$("showRoutesBtn").onclick = showAllRoutes;
$("allPathsBtn").onclick = runDFS;
$("shortestBtn").onclick = runDijkstra;
$("modalClose").onclick = closeModal;
$("modalBackdrop").addEventListener("click", e => {
  if (e.target === $("modalBackdrop")) closeModal();
});
$("resetBtn").onclick = resetData;
$("exportBtn").onclick = exportData;
$("importFile").onchange = e => {
  if (e.target.files[0]) importData(e.target.files[0]);
};

document.addEventListener("keydown", e => {
  if (e.key === "Escape") closeModal();
});

loadData();
render();