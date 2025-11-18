class UnionFind {
    constructor(n) {
        this.parent = Array.from({ length: n }, (_, i) => i);
        this.rank = new Array(n).fill(0);
    }

    find(x) {
        if (this.parent[x] !== x) {
            this.parent[x] = this.find(this.parent[x]);
        }
        return this.parent[x];
    }

    union(x, y) {
        const rootX = this.find(x);
        const rootY = this.find(y);

        if (rootX === rootY) return false;

        if (this.rank[rootX] < this.rank[rootY]) {
            this.parent[rootX] = rootY;
        } else if (this.rank[rootX] > this.rank[rootY]) {
            this.parent[rootY] = rootX;
        } else {
            this.parent[rootY] = rootX;
            this.rank[rootX]++;
        }
        return true;
    }

    connected(x, y) {
        return this.find(x) === this.find(y);
    }
}

function validateGraph(graph) {
    if (!graph || !graph.nodes || !graph.edges) {
        throw new Error('Graph must contain nodes and edges arrays');
    }

    if (!Array.isArray(graph.nodes) || !Array.isArray(graph.edges)) {
        throw new Error('Nodes and edges must be arrays');
    }

    if (graph.nodes.length === 0) {
        throw new Error('Graph must have at least one node');
    }

    for (const edge of graph.edges) {
        if (!edge || !edge.from || !edge.to || edge.weight === undefined) {
            throw new Error('Each edge must have from, to, and weight properties');
        }

        if (typeof edge.weight !== 'number' || edge.weight < 0) {
            throw new Error('Edge weights must be non-negative numbers');
        }
    }

    return true;
}

function createAdjacencyList(graph) {
    const adjList = {};

    graph.nodes.forEach(node => {
        if (node && node.id) {
            adjList[node.id] = [];
        }
    });

    graph.edges.forEach(edge => {
        if (edge && edge.from && edge.to && adjList[edge.from] && adjList[edge.to]) {
            adjList[edge.from].push({
                to: edge.to,
                weight: edge.weight || 0,
                edgeId: edge.id || `${edge.from}-${edge.to}`
            });

            if (!edge.directed) {
                adjList[edge.to].push({
                    to: edge.from,
                    weight: edge.weight || 0,
                    edgeId: edge.id || `${edge.from}-${edge.to}`
                });
            }
        }
    });

    return adjList;
}

module.exports = {
    UnionFind,
    validateGraph,
    createAdjacencyList
};
