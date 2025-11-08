from __future__ import annotations
from typing import Dict, List, Tuple, Any, Optional
from flask import Flask, render_template, request

app = Flask(__name__)

# ------------- Dijkstra (Data Structures) -------------
def dijkstra(graph: Dict[str, Dict[str, float]], source: str) -> Tuple[Dict[str, float], Dict[str, Optional[str]]]:
    import heapq

    dist: Dict[str, float] = {node: float('inf') for node in graph}
    prev: Dict[str, Optional[str]] = {node: None for node in graph}
    dist[source] = 0.0

    pq: List[Tuple[float, str]] = [(0.0, source)]
    visited: set[str] = set()

    while pq:
        current_dist, u = heapq.heappop(pq)
        if u in visited:
            continue
        visited.add(u)

        for v, w in graph[u].items():
            alt = current_dist + w
            if alt < dist[v]:
                dist[v] = alt
                prev[v] = u
                heapq.heappush(pq, (alt, v))

    return dist, prev

def reconstruct_path(prev: Dict[str, Optional[str]], target: str) -> List[str]:
    path: List[str] = []
    cur: Optional[str] = target
    while cur is not None:
        path.append(cur)
        cur = prev[cur]
    path.reverse()
    return path

# ------------- Helpers -------------
def parse_edges(text: str, undirected: bool = True) -> Dict[str, Dict[str, float]]:
    """
    Parse edges from lines like:
    A B 7
    B C 2
    C D 3
    If weight is missing, default to 1.
    """
    graph: Dict[str, Dict[str, float]] = {}
    def ensure(node: str) -> None:
        if node not in graph:
            graph[node] = {}

    for raw in text.strip().splitlines():
        line = raw.strip()
        if not line or line.startswith('#'):
            continue
        parts = line.split()
        if len(parts) < 2:
            raise ValueError(f"Invalid edge line (need at least u v): {line}")
        u, v = parts[0], parts[1]
        w = float(parts[2]) if len(parts) >= 3 else 1.0

        ensure(u); ensure(v)
        graph[u][v] = w
        if undirected:
            graph[v][u] = w

    return graph

def extract_nodes_from_edges(text: str) -> List[str]:
    """Extract a sorted unique list of node names from an edges text block."""
    nodes: set[str] = set()
    for raw in text.strip().splitlines():
        line = raw.strip()
        if not line or line.startswith('#'):
            continue
        parts = line.split()
        if len(parts) >= 2:
            nodes.add(parts[0])
            nodes.add(parts[1])
    return sorted(nodes)

# ------------- Routes -------------
@app.route("/", methods=["GET", "POST"])
def index():
    result: Dict[str, Any] = {}
    # Tamil Nadu districts (approximate road distances in km between neighboring districts)
    # Replace with your authoritative dataset if available.
    default_edges = (
        "Chennai Chengalpattu 52\n"
        "Chennai Tiruvallur 48\n"
        "Chengalpattu Kanchipuram 35\n"
        "Tiruvallur Kanchipuram 60\n"
        "Kanchipuram Vellore 80\n"
        "Vellore Ranipet 20\n"
        "Vellore Tirupattur 85\n"
        "Ranipet Tiruvannamalai 95\n"
        "Tiruvannamalai Villupuram 65\n"
        "Villupuram Cuddalore 25\n"
        "Cuddalore Mayiladuthurai 110\n"
        "Mayiladuthurai Nagapattinam 40\n"
        "Nagapattinam Tiruvarur 25\n"
        "Tiruvarur Thanjavur 55\n"
        "Thanjavur Ariyalur 50\n"
        "Ariyalur Perambalur 30\n"
        "Perambalur Tiruchirappalli 60\n"
        "Tiruchirappalli Karur 80\n"
        "Karur Namakkal 45\n"
        "Namakkal Salem 55\n"
        "Salem Dharmapuri 65\n"
        "Dharmapuri Krishnagiri 45\n"
        "Salem Erode 70\n"
        "Erode Tiruppur 55\n"
        "Tiruppur Coimbatore 45\n"
        "Coimbatore Nilgiris 85\n"
        "Karur Dindigul 75\n"
        "Dindigul Madurai 65\n"
        "Madurai Theni 75\n"
        "Madurai Sivaganga 50\n"
        "Sivaganga Ramanathapuram 55\n"
        "Ramanathapuram Thoothukudi 115\n"
        "Thoothukudi Tirunelveli 50\n"
        "Tirunelveli Tenkasi 55\n"
        "Tenkasi Virudhunagar 85\n"
        "Virudhunagar Madurai 45\n"
        "Cuddalore Pudukkottai 160\n"
        "Pudukkottai Sivaganga 70\n"
        "Thanjavur Pudukkottai 60\n"
    )
    edges_text = default_edges
    source = "Chennai"
    target = "Madurai"
    undirected = True
    nodes = extract_nodes_from_edges(edges_text)

    if request.method == "POST":
        edges_text = request.form.get("edges", "").strip()
        source = request.form.get("source", "").strip()
        target = request.form.get("target", "").strip()
        undirected = request.form.get("undirected") == "on"

        try:
            graph = parse_edges(edges_text, undirected=undirected)
            if source not in graph:
                raise ValueError(f"Source '{source}' not in graph.")
            if target not in graph:
                raise ValueError(f"Target '{target}' not in graph.")
            dist, prev = dijkstra(graph, source)
            total = dist.get(target, float('inf'))
            path = reconstruct_path(prev, target) if total != float('inf') else []
            result = {
                "ok": True,
                "path": path,
                "total": None if total == float('inf') else total,
                "distances": dist,
            }
        except Exception as e:
            result = {"ok": False, "error": str(e)}
        nodes = extract_nodes_from_edges(edges_text)

    return render_template(
        "index.html",
        edges_text=edges_text,
        source=source,
        target=target,
        undirected=undirected,
        unit="km",
        nodes=nodes,
        result=result,
    )

if __name__ == "__main__":
    app.run(debug=True)
