# Campus Route Planner — Web Visualization Version

This version keeps the core behavior of the supplied terminal program but gives it a browser UI.

## What stays logically the same

- Places/buildings are vertices.
- Routes are undirected weighted edges.
- The graph uses an adjacency matrix.
- Add/Delete place.
- Add/Update/Delete route.
- Show all places/routes.
- DFS for all possible routes.
- Dijkstra for the shortest route.
- Positive route cost.
- A deleted place removes its connected routes.

The supplied C program's `findAllPaths()` and `shortestPath()` logic is mirrored in `js/app.js`.

## Important web difference

The original C program writes to `data.txt`. A browser page cannot safely write arbitrary local files in the same way.

So the web version uses **localStorage** for automatic persistence:
- Close the browser → data remains.
- Reload the page → data remains.
- Reset → sample network is restored.
- Export Data → saves a JSON file.
- Import Data → loads a JSON network.

## Run in VS Code

1. Extract/open this folder in VS Code.
2. Open `index.html`.
3. Install/use **Live Server** extension if you have it.
4. Right-click `index.html` → **Open with Live Server**.
5. The browser will open the project.
6. Click graph nodes to select source/destination.
7. Click **All Possible Routes** for DFS.
8. Click **Shortest Route** for Dijkstra.

You can also open `index.html` directly in a browser, but Live Server is recommended.

## Files

- `index.html` — UI structure
- `css/style.css` — dashboard/graph styling
- `js/app.js` — graph management + DFS + Dijkstra + persistence
- `data/sample-network.json` — sample network reference
- `cpp/main_original.c` — original supplied terminal C code for reference

## Algorithms

### DFS
Finds every simple path from source to destination by recursive backtracking.

### Dijkstra
Finds the minimum total positive edge cost from source to destination.

Both operate on the same weighted graph data used by the UI.


### Node names in the visualization
The number inside each node is its internal graph ID. The actual place/building name is displayed next to the node, while DFS, Dijkstra, and the adjacency matrix continue to use the same internal numeric indexes.
