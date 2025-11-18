const express = require('express');
const { UnionFind, validateGraph } = require('../utils/graph-utils');

const router = express.Router();

function kruskalAlgorithm(graph) {
    try {
        console.log('Starting Kruskal algorithm...');

        validateGraph(graph);

        const steps = [];
        const mstEdges = [];
        let totalCost = 0;

        const edges = [...graph.edges].sort((a, b) => (a.weight || 0) - (b.weight || 0));
        const nodeCount = graph.nodes.length;
        const uf = new UnionFind(nodeCount);

        const nodeMap = {};
        graph.nodes.forEach((node, index) => {
            if (node && node.id) {
                nodeMap[node.id] = index;
            }
        });

        steps.push({
            step: 0,
            description: "Starting Kruskal's Algorithm. Edges sorted by weight.",
            currentEdge: null,
            sortedEdges: edges.map(e => ({...e, status: 'pending'})),
            mstEdges: [],
            unionFindState: getUnionFindState(uf, graph.nodes),
            totalCost: 0,
            action: 'initialize'
        });

        edges.forEach((edge, index) => {
            if (!edge || !edge.from || !edge.to) return;

            const fromNode = nodeMap[edge.from];
            const toNode = nodeMap[edge.to];

            if (fromNode === undefined || toNode === undefined) {
                console.error(`Node not found: ${edge.from} or ${edge.to}`);
                return;
            }

            const wouldCreateCycle = uf.connected(fromNode, toNode);

            let action, status;
            if (wouldCreateCycle) {
                action = 'reject';
                status = 'rejected';
            } else {
                uf.union(fromNode, toNode);
                mstEdges.push({...edge, status: 'accepted'});
                totalCost += (edge.weight || 0);
                action = 'accept';
                status = 'accepted';
            }

            steps.push({
                step: index + 1,
                description: wouldCreateCycle 
                    ? `Edge ${edge.from}-${edge.to} (weight: ${edge.weight || 0}) would create a cycle. Rejected.`
                    : `Edge ${edge.from}-${edge.to} (weight: ${edge.weight || 0}) added to MST.`,
                currentEdge: {...edge, status},
                sortedEdges: edges.map((e, i) => ({
                    ...e,
                    status: i < index ? (mstEdges.find(mst => mst.id === e.id) ? 'accepted' : 'rejected')
                          : i === index ? status
                          : 'pending'
                })),
                mstEdges: [...mstEdges],
                unionFindState: getUnionFindState(uf, graph.nodes),
                totalCost,
                action,
                wouldCreateCycle
            });

            if (mstEdges.length === nodeCount - 1) {
                steps.push({
                    step: index + 2,
                    description: `MST completed! Total cost: ${totalCost}`,
                    currentEdge: null,
                    sortedEdges: edges.map((e, i) => ({
                        ...e,
                        status: i <= index ? (mstEdges.find(mst => mst.id === e.id) ? 'accepted' : 'rejected') : 'pending'
                    })),
                    mstEdges: [...mstEdges],
                    unionFindState: getUnionFindState(uf, graph.nodes),
                    totalCost,
                    action: 'complete'
                });
                return;
            }
        });

        return {
            algorithm: 'Kruskal',
            steps,
            finalResult: {
                mstEdges,
                totalCost,
                edgeCount: mstEdges.length
            }
        };
    } catch (error) {
        console.error('Kruskal algorithm error:', error);
        throw new Error(`Kruskal algorithm error: ${error.message}`);
    }
}

function getUnionFindState(uf, nodes) {
    const components = {};
    nodes.forEach((node, index) => {
        if (node && node.id) {
            const root = uf.find(index);
            if (!components[root]) components[root] = [];
            components[root].push(node.id);
        }
    });
    return Object.values(components);
}

router.post('/', (req, res) => {
    try {
        const { graph } = req.body;

        if (!graph) {
            return res.status(400).json({ 
                error: 'Missing graph data', 
                message: 'Please provide graph data in request body' 
            });
        }

        const result = kruskalAlgorithm(graph);
        res.json(result);
    } catch (error) {
        console.error('Kruskal route error:', error);
        res.status(400).json({ 
            error: 'Kruskal algorithm failed', 
            message: error.message 
        });
    }
});

router.get('/info', (req, res) => {
    res.json({
        algorithm: 'Kruskal\'s Algorithm',
        description: 'Finds the Minimum Spanning Tree by sorting edges and using Union-Find to avoid cycles.',
        timeComplexity: 'O(E log E)',
        spaceComplexity: 'O(V)',
        useCase: 'Network design, clustering, minimum cost connectivity'
    });
});

module.exports = router;
