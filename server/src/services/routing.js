export function buildAdjacency(edges, useRisk = false, riskPenaltyMetres = 0) {
  const graph = new Map();
  const add = (from, to, edge) => {
    if (!graph.has(from)) graph.set(from, []);
    const risk = Number(edge.risk_count ?? 0);
    graph.get(from).push({
      to,
      edgeId: edge.id,
      cost: Number(edge.length_m) + (useRisk ? risk * riskPenaltyMetres : 0),
      baseLength: Number(edge.length_m),
      riskCount: risk,
    });
  };
  for (const edge of edges) {
    add(String(edge.from_node), String(edge.to_node), edge);
    add(String(edge.to_node), String(edge.from_node), edge);
  }
  return graph;
}

export function dijkstra(nodes, edges, startId, endId, options = {}) {
  const start = String(startId);
  const end = String(endId);
  const nodeIds = new Set(nodes.map((n) => String(n.id)));
  if (!nodeIds.has(start) || !nodeIds.has(end)) return null;

  const graph = buildAdjacency(edges, options.useRisk, options.riskPenaltyMetres ?? 0);
  const distances = new Map([...nodeIds].map((id) => [id, Number.POSITIVE_INFINITY]));
  const previous = new Map();
  const unvisited = new Set(nodeIds);
  distances.set(start, 0);

  while (unvisited.size) {
    let current = null;
    let currentDistance = Number.POSITIVE_INFINITY;
    for (const id of unvisited) {
      const value = distances.get(id);
      if (value < currentDistance) {
        current = id;
        currentDistance = value;
      }
    }
    if (current === null || currentDistance === Number.POSITIVE_INFINITY) break;
    unvisited.delete(current);
    if (current === end) break;

    for (const edge of graph.get(current) ?? []) {
      if (!unvisited.has(edge.to)) continue;
      const candidate = currentDistance + edge.cost;
      if (candidate < distances.get(edge.to)) {
        distances.set(edge.to, candidate);
        previous.set(edge.to, { from: current, edge });
      }
    }
  }

  if (distances.get(end) === Number.POSITIVE_INFINITY) return null;
  const nodePath = [end];
  const edgePath = [];
  let cursor = end;
  let baseDistance = 0;
  let riskHits = 0;
  while (cursor !== start) {
    const step = previous.get(cursor);
    if (!step) return null;
    edgePath.push(step.edge.edgeId);
    baseDistance += step.edge.baseLength;
    riskHits += step.edge.riskCount;
    cursor = step.from;
    nodePath.push(cursor);
  }
  nodePath.reverse();
  edgePath.reverse();

  return {
    nodePath,
    edgePath,
    baseDistanceMetres: Math.round(baseDistance),
    weightedCost: Math.round(distances.get(end)),
    riskHits,
  };
}

export function pathCoordinates(route, nodes) {
  const byId = new Map(nodes.map((n) => [String(n.id), n]));
  return route.nodePath.map((id) => {
    const node = byId.get(String(id));
    return [Number(node.lat), Number(node.lng)];
  });
}
