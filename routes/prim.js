const express = require('express');
const { validateGraph, createAdjacencyList } = require('../utils/graph-utils');

const router = express.Router();

function primAlgorithm(graph, startNodeId = null) {
    try {
        console.log('Starting Prim algorithm...');

        validateGraph(graph);

        if (graph.nodes.length === 0) {
            throw new Error('Graph must have at least one node');
        }

        const steps = [];
        const mstEdges = [];
        const visited = new Set();
        const adjList = createAdjacencyList(graph);
        let totalCost = 0;

        const startNode = startNodeId || (graph.nodes[0] ? graph.nodes[0].id : null);
        if (!startNode) {
            throw new Error('No valid start node found');
        }

        visited.add(startNode);

        let priorityQueue = [];
        const startNeighbors = adjList[startNode] || [];

        startNeighbors.forEach(edge => {
            if (edge && edge.to && !visited.has(edge.to)) {
                priorityQueue.push({
                    from: startNode,
                    to: edge.to,
                    weight: edge.weight || 0,
                    edgeId: edge.edgeId || `${startNode}-${edge.to}`
                });
            }
        });

        priorityQueue.sort((a, b) => (a.weight || 0) - (b.weight || 0));

        steps.push({
            step: 0,
            description: `Starting Prim's Algorithm from node ${startNode}`,
            currentEdge: null,
            visitedNodes: [...visited],
            priorityQueue: [...priorityQueue],
            mstEdges: [],
            totalCost: 0,
            action: 'initialize'
        });

        let stepCount = 1;

        while (priorityQueue.length > 0 && visited.size < graph.nodes.length) {
            const currentEdge = priorityQueue.shift();

            if (!currentEdge || !currentEdge.to) continue;

            if (visited.has(currentEdge.to)) {
                steps.push({
                    step: stepCount++,
                    description: `Edge ${currentEdge.from}-${currentEdge.to} (weight: ${currentEdge.weight || 0}) skipped - both nodes already in MST`,
                    currentEdge: {...currentEdge, status: 'skipped'},
                    visitedNodes: [...visited],
                    priorityQueue: [...priorityQueue],
                    mstEdges: [...mstEdges],
                    totalCost,
                    action: 'skip'
                });
                continue;
            }

            mstEdges.push({
                id: currentEdge.edgeId,
                from: currentEdge.from,
                to: currentEdge.to,
                weight: currentEdge.weight || 0,
                status: 'accepted'
            });

            totalCost += (currentEdge.weight || 0);
            visited.add(currentEdge.to);

            const newEdges = [];
            const newNeighbors = adjList[currentEdge.to] || [];

            newNeighbors.forEach(edge => {
                if (edge && edge.to && !visited.has(edge.to)) {
                    const newEdge = {
                        from: currentEdge.to,
                        to: edge.to,
                        weight: edge.weight || 0,
                        edgeId: edge.edgeId || `${currentEdge.to}-${edge.to}`
                    };
                    newEdges.push(newEdge);
                    priorityQueue.push(newEdge);
                }
            });

            priorityQueue = priorityQueue.filter(edge => edge && edge.to && !visited.has(edge.to));
            priorityQueue.sort((a, b) => (a.weight || 0) - (b.weight || 0));

            steps.push({
                step: stepCount++,
                description: `Added edge ${currentEdge.from}-${currentEdge.to} (weight: ${currentEdge.weight || 0}) to MST. Added ${newEdges.length} new edges to consider.`,
                currentEdge: {...currentEdge, status: 'accepted'},
                visitedNodes: [...visited],
                priorityQueue: [...priorityQueue],
                mstEdges: [...mstEdges],
                totalCost,
                action: 'accept',
                newEdgesAdded: newEdges
            });
        }

        if (visited.size === graph.nodes.length) {
            steps.push({
                step: stepCount,
                description: `MST completed! All nodes visited. Total cost: ${totalCost}`,
                currentEdge: null,
                visitedNodes: [...visited],
                priorityQueue: [],
                mstEdges: [...mstEdges],
                totalCost,
                action: 'complete'
            });
        }

        return {
            algorithm: 'Prim',
            steps,
            finalResult: {
                mstEdges,
                totalCost,
                edgeCount: mstEdges.length,
                startNode
            }
        };
    } catch (error) {
        console.error('Prim algorithm error:', error);
        throw new Error(`Prim algorithm error: ${error.message}`);
    }
}

router.post('/', (req, res) => {
    try {
        const { graph, startNode } = req.body;

        if (!graph) {
            return res.status(400).json({ 
                error: 'Missing graph data', 
                message: 'Please provide graph data in request body' 
            });
        }

        const result = primAlgorithm(graph, startNode);
        res.json(result);
    } catch (error) {
        console.error('Prim route error:', error);
        res.status(400).json({ 
            error: 'Prim algorithm failed', 
            message: error.message 
        });
    }
});

router.get('/info', (req, res) => {
    res.json({
        algorithm: 'Prim\'s Algorithm',
        description: 'Finds the Minimum Spanning Tree by growing from a starting vertex using a priority queue.',
        timeComplexity: 'O(E log V) with binary heap',
        spaceComplexity: 'O(V)',
        useCase: 'Network design, circuit design, minimum cost tree construction'
    });
});

module.exports = router;
