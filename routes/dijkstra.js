const express = require('express');
const { validateGraph, createAdjacencyList } = require('../utils/graph-utils');

const router = express.Router();

function dijkstraAlgorithm(graph, sourceNodeId, targetNodeId = null) {
    try {
        console.log('Starting Dijkstra algorithm...');
        console.log('Source:', sourceNodeId, 'Target:', targetNodeId);

        validateGraph(graph);

        if (!sourceNodeId) {
            throw new Error('Source node ID is required');
        }

        // Validate source node exists
        const sourceExists = graph.nodes.some(node => node && node.id === sourceNodeId);
        if (!sourceExists) {
            throw new Error(`Source node '${sourceNodeId}' not found in graph`);
        }

        const steps = [];
        const distances = {};
        const previous = {};
        const visited = new Set();
        const adjList = createAdjacencyList(graph);

        // Initialize all distances and previous pointers
        graph.nodes.forEach(node => {
            if (node && node.id) {
                distances[node.id] = node.id === sourceNodeId ? 0 : Infinity;
                previous[node.id] = null;
            }
        });

        console.log('Initial distances:', distances);

        let priorityQueue = [{
            nodeId: sourceNodeId,
            distance: 0
        }];

        // Initial step
        steps.push({
            step: 0,
            description: `Starting Dijkstra's Algorithm from node ${sourceNodeId}`,
            currentNode: null,
            distances: safeCloneDistances(distances),
            previous: safeClonePrevious(previous),
            visited: [...visited],
            priorityQueue: [...priorityQueue],
            shortestPaths: {},
            action: 'initialize'
        });

        let stepCount = 1;

        while (priorityQueue.length > 0) {
            // Sort by distance (ascending)
            priorityQueue.sort((a, b) => (a.distance || 0) - (b.distance || 0));
            const current = priorityQueue.shift();

            if (!current || !current.nodeId) {
                continue;
            }

            const currentNodeId = current.nodeId;

            // Skip if already visited
            if (visited.has(currentNodeId)) {
                continue;
            }

            // Mark as visited
            visited.add(currentNodeId);

            const currentDistance = distances[currentNodeId];
            const distanceStr = currentDistance === Infinity ? '∞' : String(currentDistance || 0);

            steps.push({
                step: stepCount++,
                description: `Processing node ${currentNodeId} with distance ${distanceStr}`,
                currentNode: currentNodeId,
                distances: safeCloneDistances(distances),
                previous: safeClonePrevious(previous),
                visited: [...visited],
                priorityQueue: [...priorityQueue],
                shortestPaths: getShortestPaths(previous, sourceNodeId, [...visited], distances),
                action: 'process_node'
            });

            // Stop if target reached
            if (targetNodeId && currentNodeId === targetNodeId) {
                break;
            }

            // Process neighbors
            const updatedNeighbors = [];
            const neighbors = adjList[currentNodeId] || [];

            neighbors.forEach(edge => {
                if (!edge || !edge.to) return;

                const neighborId = edge.to;

                if (!visited.has(neighborId)) {
                    const edgeWeight = edge.weight || 0;
                    const currentDist = distances[currentNodeId];
                    const newDistance = (currentDist === Infinity ? Infinity : currentDist + edgeWeight);
                    const oldDistance = distances[neighborId];

                    if (newDistance < oldDistance) {
                        distances[neighborId] = newDistance;
                        previous[neighborId] = currentNodeId;

                        updatedNeighbors.push({
                            nodeId: neighborId,
                            oldDistance: oldDistance === Infinity ? '∞' : String(oldDistance || 0),
                            newDistance: newDistance === Infinity ? '∞' : String(newDistance || 0),
                            via: currentNodeId
                        });

                        // Update priority queue
                        priorityQueue = priorityQueue.filter(item => item.nodeId !== neighborId);
                        priorityQueue.push({
                            nodeId: neighborId,
                            distance: newDistance
                        });
                    }
                }
            });

            if (updatedNeighbors.length > 0) {
                steps.push({
                    step: stepCount++,
                    description: `Updated distances for ${updatedNeighbors.length} neighbor(s) of node ${currentNodeId}`,
                    currentNode: currentNodeId,
                    distances: safeCloneDistances(distances),
                    previous: safeClonePrevious(previous),
                    visited: [...visited],
                    priorityQueue: [...priorityQueue],
                    shortestPaths: getShortestPaths(previous, sourceNodeId, [...visited], distances),
                    action: 'update_distances',
                    updatedNeighbors
                });
            }
        }

        // Final results
        const finalPaths = getShortestPaths(previous, sourceNodeId, graph.nodes.map(n => n.id), distances);

        // Build final description
        let finalDescription = `All shortest paths from ${sourceNodeId} computed`;
        if (targetNodeId) {
            const targetDistance = distances[targetNodeId];
            const targetPath = finalPaths[targetNodeId];

            if (targetDistance === Infinity) {
                finalDescription = `No path exists from ${sourceNodeId} to ${targetNodeId}`;
            } else {
                const pathStr = (targetPath && targetPath.path && targetPath.path.length > 0) 
                    ? targetPath.path.join(' → ') 
                    : 'No path';
                const distStr = targetDistance === Infinity ? '∞' : String(targetDistance || 0);
                finalDescription = `Shortest path from ${sourceNodeId} to ${targetNodeId}: ${pathStr} (distance: ${distStr})`;
            }
        }

        steps.push({
            step: stepCount,
            description: finalDescription,
            currentNode: null,
            distances: safeCloneDistances(distances),
            previous: safeClonePrevious(previous),
            visited: [...visited],
            priorityQueue: [],
            shortestPaths: finalPaths,
            action: 'complete'
        });

        const result = {
            algorithm: 'Dijkstra',
            steps,
            finalResult: {
                sourceNode: sourceNodeId,
                targetNode: targetNodeId || null,
                distances: safeCloneDistances(distances),
                shortestPaths: finalPaths,
                pathExists: targetNodeId ? (distances[targetNodeId] !== Infinity) : true
            }
        };

        console.log('Dijkstra algorithm completed successfully');
        return result;

    } catch (error) {
        console.error('Dijkstra algorithm error:', error);
        throw new Error(`Dijkstra algorithm error: ${error.message}`);
    }
}

function safeCloneDistances(distances) {
    const cloned = {};
    for (const [nodeId, dist] of Object.entries(distances)) {
        cloned[nodeId] = dist;
    }
    return cloned;
}

function safeClonePrevious(previous) {
    const cloned = {};
    for (const [nodeId, prev] of Object.entries(previous)) {
        cloned[nodeId] = prev;
    }
    return cloned;
}

function getShortestPaths(previous, source, processedNodes, distances) {
    const paths = {};

    if (!previous || !source || !processedNodes || !distances) {
        return paths;
    }

    processedNodes.forEach(nodeId => {
        if (!nodeId) return;

        if (nodeId === source) {
            paths[nodeId] = { 
                path: [source], 
                distance: 0 
            };
        } else {
            // Build path backwards from nodeId to source
            const path = [];
            let current = nodeId;
            const maxSteps = processedNodes.length + 1; // Prevent infinite loops
            let steps = 0;

            while (current !== null && current !== undefined && steps < maxSteps) {
                path.unshift(current);
                steps++;

                if (current === source) {
                    // Found complete path
                    break;
                }

                current = previous[current];
            }

            // Validate path - must start with source
            if (path.length > 0 && path[0] === source) {
                paths[nodeId] = { 
                    path: [...path],
                    distance: distances[nodeId] !== undefined ? distances[nodeId] : Infinity
                };
            } else {
                // No valid path
                paths[nodeId] = {
                    path: [],
                    distance: Infinity
                };
            }
        }
    });

    return paths;
}

// Routes
router.post('/', (req, res) => {
    try {
        console.log('Dijkstra POST request received');

        const { graph, sourceNode, targetNode } = req.body;

        if (!graph) {
            return res.status(400).json({ 
                error: 'Missing graph data', 
                message: 'Please provide graph data in request body' 
            });
        }

        if (!sourceNode) {
            return res.status(400).json({ 
                error: 'Source node is required',
                message: 'Please specify a source node for Dijkstra\'s algorithm'
            });
        }

        const result = dijkstraAlgorithm(graph, sourceNode, targetNode);
        res.json(result);

    } catch (error) {
        console.error('Dijkstra route error:', error);
        res.status(400).json({ 
            error: 'Dijkstra algorithm failed', 
            message: error.message 
        });
    }
});

router.get('/info', (req, res) => {
    res.json({
        algorithm: 'Dijkstra\'s Algorithm',
        description: 'Finds shortest paths from a source vertex to all other vertices using a priority queue.',
        timeComplexity: 'O((V + E) log V) with binary heap',
        spaceComplexity: 'O(V)',
        useCase: 'GPS navigation, network routing, social networks, game pathfinding'
    });
});

module.exports = router;
