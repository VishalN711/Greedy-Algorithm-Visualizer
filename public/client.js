/**
 * Greedy Algorithm Visualizer - Client JavaScript
 * FIXED VERSION - Handles null values properly
 */

class AlgorithmVisualizer {
    constructor() {
        this.canvas = document.getElementById('graph-canvas');
        this.ctx = this.canvas.getContext('2d');
        this.currentAlgorithm = 'kruskal';
        this.currentGraph = null;
        this.algorithmSteps = [];
        this.currentStep = 0;
        this.animationSpeed = 800;
        this.isAnimating = false;
        this.animationTimeout = null;

        this.initializeEventListeners();
        this.loadSampleGraph();
        this.setupCanvas();
        this.updateAlgorithmInfo();
    }

    initializeEventListeners() {
        // Navigation
        document.querySelectorAll('.nav-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.switchAlgorithm(e.target.dataset.algorithm);
            });
        });

        // Theme toggle
        document.getElementById('theme-btn').addEventListener('click', this.toggleTheme);

        // Control buttons
        document.getElementById('sample-graph-btn').addEventListener('click', () => this.loadSampleGraph());
        document.getElementById('random-graph-btn').addEventListener('click', () => this.generateRandomGraph());
        document.getElementById('custom-graph-btn').addEventListener('click', () => this.toggleCustomInput());
        document.getElementById('load-graph-btn').addEventListener('click', () => this.loadCustomGraph());
        document.getElementById('run-algorithm-btn').addEventListener('click', () => this.runAlgorithm());
        document.getElementById('step-btn').addEventListener('click', () => this.nextStep());
        document.getElementById('reset-btn').addEventListener('click', () => this.resetVisualization());

        // Animation speed
        document.getElementById('animation-speed').addEventListener('input', (e) => {
            this.animationSpeed = parseInt(e.target.value);
            document.getElementById('speed-value').textContent = `${this.animationSpeed}ms`;
        });

        // Help modal
        document.getElementById('help-btn').addEventListener('click', () => {
            document.getElementById('help-modal').classList.add('active');
        });

        document.getElementById('modal-close').addEventListener('click', () => {
            document.getElementById('help-modal').classList.remove('active');
        });

        document.getElementById('help-modal').addEventListener('click', (e) => {
            if (e.target.id === 'help-modal') {
                document.getElementById('help-modal').classList.remove('active');
            }
        });

        window.addEventListener('resize', () => this.setupCanvas());
    }

    setupCanvas() {
        const rect = this.canvas.getBoundingClientRect();
        const dpr = window.devicePixelRatio || 1;

        this.canvas.width = rect.width * dpr;
        this.canvas.height = rect.height * dpr;

        this.ctx.scale(dpr, dpr);
        this.canvas.style.width = rect.width + 'px';
        this.canvas.style.height = rect.height + 'px';

        this.redrawGraph();
    }

    switchAlgorithm(algorithm) {
        if (this.currentAlgorithm === algorithm) return;

        document.querySelectorAll('.nav-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.algorithm === algorithm);
        });

        this.currentAlgorithm = algorithm;
        this.resetVisualization();
        this.updateAlgorithmInfo();
        this.updateAlgorithmInputs();
    }

    updateAlgorithmInfo() {
        const info = this.getAlgorithmInfo(this.currentAlgorithm);

        document.getElementById('algorithm-title').textContent = info.algorithm || 'Algorithm';
        document.getElementById('algorithm-description').textContent = info.description || 'Description';
        document.getElementById('time-complexity').textContent = info.timeComplexity || 'O(?)';
        document.getElementById('space-complexity').textContent = info.spaceComplexity || 'O(?)';
    }

    getAlgorithmInfo(algorithm) {
        const info = {
            'kruskal': {
                algorithm: "Kruskal's Algorithm",
                description: "Finds the Minimum Spanning Tree by sorting edges and using Union-Find to avoid cycles.",
                timeComplexity: "O(E log E)",
                spaceComplexity: "O(V)"
            },
            'prim': {
                algorithm: "Prim's Algorithm", 
                description: "Finds the Minimum Spanning Tree by growing from a starting vertex using a priority queue.",
                timeComplexity: "O(E log V)",
                spaceComplexity: "O(V)"
            },
            'dijkstra': {
                algorithm: "Dijkstra's Algorithm",
                description: "Finds shortest paths from a source vertex to all other vertices using a priority queue.",
                timeComplexity: "O((V + E) log V)",
                spaceComplexity: "O(V)"
            }
        };
        return info[algorithm] || info['kruskal'];
    }

    updateAlgorithmInputs() {
        document.querySelectorAll('.algo-input').forEach(input => {
            input.style.display = 'none';
        });

        const inputElement = document.getElementById(`${this.currentAlgorithm}-inputs`);
        if (inputElement) {
            inputElement.style.display = 'block';
            this.populateNodeSelects();
        }
    }

    populateNodeSelects() {
        if (!this.currentGraph || !this.currentGraph.nodes) return;

        const selects = ['source-node', 'target-node', 'start-node'];
        selects.forEach(selectId => {
            const select = document.getElementById(selectId);
            if (select) {
                const currentValue = select.value;
                select.innerHTML = selectId === 'target-node' ? '<option value="">All nodes</option>' 
                                 : selectId === 'start-node' ? '<option value="">Auto select</option>'
                                 : '<option value="">Select source...</option>';

                this.currentGraph.nodes.forEach(node => {
                    if (node && node.id) {
                        const option = document.createElement('option');
                        option.value = node.id;
                        option.textContent = node.label || `Node ${node.id}`;
                        select.appendChild(option);
                    }
                });

                if (currentValue && [...select.options].some(opt => opt.value === currentValue)) {
                    select.value = currentValue;
                }
            }
        });
    }

    toggleTheme() {
        const body = document.body;
        const currentTheme = body.getAttribute('data-theme');
        const newTheme = currentTheme === 'dark' ? 'light' : 'dark';

        body.setAttribute('data-theme', newTheme);
        document.getElementById('theme-btn').textContent = newTheme === 'dark' ? '☀️' : '🌙';

        localStorage.setItem('theme', newTheme);
    }

    toggleCustomInput() {
        const customInput = document.getElementById('custom-input');
        const isVisible = customInput.style.display !== 'none';
        customInput.style.display = isVisible ? 'none' : 'block';

        if (!isVisible) {
            document.getElementById('graph-input').value = JSON.stringify(this.getSampleGraphData(), null, 2);
        }
    }

    loadSampleGraph() {
        this.currentGraph = this.getSampleGraphData();
        this.populateNodeSelects();
        this.redrawGraph();
        this.enableControls();
        this.resetVisualization();
    }

    generateRandomGraph() {
        const nodeCount = Math.floor(Math.random() * 4) + 4;
        const nodes = [];
        const edges = [];

        for (let i = 0; i < nodeCount; i++) {
            nodes.push({
                id: String.fromCharCode(65 + i),
                label: `Node ${String.fromCharCode(65 + i)}`,
                x: Math.random() * 600 + 100,
                y: Math.random() * 300 + 100
            });
        }

        const edgeSet = new Set();

        for (let i = 1; i < nodeCount; i++) {
            const from = Math.floor(Math.random() * i);
            const to = i;
            const fromId = nodes[from].id;
            const toId = nodes[to].id;
            const weight = Math.floor(Math.random() * 9) + 1;

            const edgeKey = `${fromId}-${toId}`;
            edgeSet.add(edgeKey);

            edges.push({
                id: edgeKey,
                from: fromId,
                to: toId,
                weight: weight
            });
        }

        const additionalEdges = Math.floor(nodeCount * 0.3);
        for (let i = 0; i < additionalEdges; i++) {
            const from = Math.floor(Math.random() * nodeCount);
            let to = Math.floor(Math.random() * nodeCount);

            if (from !== to) {
                const fromId = nodes[from].id;
                const toId = nodes[to].id;
                const edgeKey = `${fromId}-${toId}`;
                const reverseKey = `${toId}-${fromId}`;

                if (!edgeSet.has(edgeKey) && !edgeSet.has(reverseKey)) {
                    edgeSet.add(edgeKey);
                    edges.push({
                        id: edgeKey,
                        from: fromId,
                        to: toId,
                        weight: Math.floor(Math.random() * 9) + 1
                    });
                }
            }
        }

        this.currentGraph = { nodes, edges };
        this.populateNodeSelects();
        this.redrawGraph();
        this.enableControls();
        this.resetVisualization();
    }

    loadCustomGraph() {
        try {
            const graphData = JSON.parse(document.getElementById('graph-input').value);

            if (!graphData || !graphData.nodes || !graphData.edges || !Array.isArray(graphData.nodes) || !Array.isArray(graphData.edges)) {
                throw new Error('Invalid graph format');
            }

            this.currentGraph = graphData;
            this.populateNodeSelects();
            this.redrawGraph();
            this.enableControls();
            this.resetVisualization();

            document.getElementById('custom-input').style.display = 'none';
        } catch (error) {
            alert('Error loading custom graph: ' + error.message);
        }
    }

    async runAlgorithm() {
        if (!this.currentGraph) {
            alert('Please load a graph first');
            return;
        }

        try {
            this.setLoading(true);

            const requestData = {
                graph: this.currentGraph
            };

            if (this.currentAlgorithm === 'dijkstra') {
                const sourceNode = document.getElementById('source-node').value;
                const targetNode = document.getElementById('target-node').value;

                if (!sourceNode) {
                    alert('Please select a source node for Dijkstra\'s algorithm');
                    this.setLoading(false);
                    return;
                }

                requestData.sourceNode = sourceNode;
                if (targetNode) requestData.targetNode = targetNode;
            } else if (this.currentAlgorithm === 'prim') {
                const startNode = document.getElementById('start-node').value;
                if (startNode) requestData.startNode = startNode;
            }

            console.log('Making API request to:', `/api/${this.currentAlgorithm}`);

            const response = await fetch(`/api/${this.currentAlgorithm}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                },
                body: JSON.stringify(requestData)
            });

            if (!response.ok) {
                const errorText = await response.text();
                let errorMessage;
                try {
                    const errorJson = JSON.parse(errorText);
                    errorMessage = errorJson.message || errorJson.error || 'Unknown server error';
                } catch {
                    errorMessage = `Server returned ${response.status}: ${response.statusText}`;
                }
                throw new Error(errorMessage);
            }

            const result = await response.json();
            console.log('Algorithm result received:', result);

            this.algorithmSteps = result.steps || [];
            this.currentStep = 0;

            this.updateStepInfo();
            this.enableStepControls();
            this.showResults(result.finalResult);

        } catch (error) {
            console.error('Algorithm execution error:', error);

            let errorMessage = 'Error running algorithm: ';

            if (error.name === 'TypeError' && (error.message.includes('fetch') || error.message.includes('Failed to fetch'))) {
                errorMessage += 'Cannot connect to server. Please make sure the server is running with "npm start"';
            } else {
                errorMessage += error.message;
            }

            alert(errorMessage);
        } finally {
            this.setLoading(false);
        }
    }

    nextStep() {
        if (this.currentStep < this.algorithmSteps.length - 1) {
            this.currentStep++;
            this.updateStepInfo();
            this.redrawGraph();
        }
    }

    updateStepInfo() {
        if (!this.algorithmSteps || this.algorithmSteps.length === 0) {
            document.getElementById('step-title').textContent = 'Step 0: Initialize';
            document.getElementById('step-description').textContent = 'Ready to visualize algorithm...';
            document.getElementById('current-step').textContent = '0';
            document.getElementById('total-steps').textContent = '0';
            document.getElementById('algorithm-state').innerHTML = '';
            return;
        }

        const step = this.algorithmSteps[this.currentStep];
        if (!step) return;

        document.getElementById('step-title').textContent = `Step ${step.step || 0}: ${this.getStepTitle(step.action)}`;
        document.getElementById('step-description').textContent = step.description || 'Processing...';
        document.getElementById('current-step').textContent = String(this.currentStep);
        document.getElementById('total-steps').textContent = String(this.algorithmSteps.length - 1);

        this.updateAlgorithmState(step);
    }

    getStepTitle(action) {
        const titles = {
            'initialize': 'Initialize',
            'accept': 'Accept Edge',
            'reject': 'Reject Edge',
            'skip': 'Skip Edge',
            'process_node': 'Process Node',
            'update_distances': 'Update Distances',
            'complete': 'Complete'
        };
        return titles[action] || 'Processing';
    }

    // FIXED: This function now handles null values properly
    updateAlgorithmState(step) {
        const stateDiv = document.getElementById('algorithm-state');
        if (!stateDiv || !step) return;

        let stateHTML = '';

        try {
            if (this.currentAlgorithm === 'kruskal' && step.unionFindState) {
                stateHTML = '<strong>Connected Components:</strong><br>';
                step.unionFindState.forEach((component, index) => {
                    if (component && Array.isArray(component)) {
                        stateHTML += `Component ${index + 1}: [${component.join(', ')}]<br>`;
                    }
                });
                if (step.totalCost !== undefined && step.totalCost !== null) {
                    stateHTML += `<br><strong>MST Cost:</strong> ${step.totalCost}`;
                }
            } else if (this.currentAlgorithm === 'prim') {
                if (step.visitedNodes && Array.isArray(step.visitedNodes)) {
                    stateHTML = `<strong>Visited Nodes:</strong> [${step.visitedNodes.join(', ')}]<br>`;
                }
                if (step.totalCost !== undefined && step.totalCost !== null) {
                    stateHTML += `<strong>MST Cost:</strong> ${step.totalCost}`;
                }
            } else if (this.currentAlgorithm === 'dijkstra') {
                if (step.distances && typeof step.distances === 'object') {
                    stateHTML = '<strong>Distances:</strong><br>';
                    Object.entries(step.distances).forEach(([node, dist]) => {
                        // FIXED: Proper null handling for distance values
                        let distStr;
                        if (dist === null || dist === undefined) {
                            distStr = 'undefined';
                        } else if (dist === Infinity) {
                            distStr = '∞';
                        } else {
                            distStr = String(dist);
                        }
                        stateHTML += `${node || 'unknown'}: ${distStr}<br>`;
                    });
                }
            }
        } catch (error) {
            console.error('Error updating algorithm state:', error);
            stateHTML = '<strong>Error displaying state</strong>';
        }

        stateDiv.innerHTML = stateHTML;
    }

    showResults(finalResult) {
        if (!finalResult) return;

        const resultsPanel = document.getElementById('results-panel');
        const resultsContent = document.getElementById('results-content');

        let resultsHTML = '';

        try {
            if (this.currentAlgorithm === 'kruskal' || this.currentAlgorithm === 'prim') {
                resultsHTML = `
                    <strong>Minimum Spanning Tree Found!</strong><br><br>
                    <strong>Total Cost:</strong> ${finalResult.totalCost || 0}<br>
                    <strong>Edges in MST:</strong> ${finalResult.edgeCount || 0}<br><br>
                    <strong>Selected Edges:</strong><br>
                `;

                if (finalResult.mstEdges && Array.isArray(finalResult.mstEdges)) {
                    resultsHTML += finalResult.mstEdges.map(edge => 
                        `${edge.from || '?'} - ${edge.to || '?'} (weight: ${edge.weight || 0})`
                    ).join('<br>');
                }
            } else if (this.currentAlgorithm === 'dijkstra') {
                resultsHTML = `<strong>Shortest Paths from ${finalResult.sourceNode || '?'}:</strong><br><br>`;

                if (finalResult.distances && typeof finalResult.distances === 'object') {
                    Object.entries(finalResult.distances).forEach(([node, dist]) => {
                        const distStr = dist === Infinity ? 'No path' : (dist !== null && dist !== undefined ? String(dist) : 'undefined');
                        const pathInfo = finalResult.shortestPaths && finalResult.shortestPaths[node] && finalResult.shortestPaths[node].path
                            ? ` (${finalResult.shortestPaths[node].path.join(' → ')})` 
                            : '';
                        resultsHTML += `<strong>${node || '?'}:</strong> ${distStr}${pathInfo}<br>`;
                    });
                }
            }
        } catch (error) {
            console.error('Error showing results:', error);
            resultsHTML = '<strong>Error displaying results</strong>';
        }

        resultsContent.innerHTML = resultsHTML;
        resultsPanel.style.display = 'block';
    }

    resetVisualization() {
        this.algorithmSteps = [];
        this.currentStep = 0;
        this.isAnimating = false;

        if (this.animationTimeout) {
            clearTimeout(this.animationTimeout);
            this.animationTimeout = null;
        }

        this.updateStepInfo();
        this.redrawGraph();

        document.getElementById('results-panel').style.display = 'none';

        this.enableControls();
        this.disableStepControls();
    }

    redrawGraph() {
        if (!this.currentGraph || !this.currentGraph.nodes || !this.currentGraph.edges) return;

        const ctx = this.ctx;
        const canvas = this.canvas;
        const rect = canvas.getBoundingClientRect();

        ctx.clearRect(0, 0, rect.width, rect.height);

        const currentStep = this.algorithmSteps[this.currentStep];

        // Draw edges
        this.currentGraph.edges.forEach(edge => {
            if (!edge || !edge.from || !edge.to) return;

            const fromNode = this.currentGraph.nodes.find(n => n && n.id === edge.from);
            const toNode = this.currentGraph.nodes.find(n => n && n.id === edge.to);

            if (fromNode && toNode) {
                let color = '#94a3b8';
                let width = 2;

                if (currentStep) {
                    if (this.currentAlgorithm === 'kruskal') {
                        const mstEdge = currentStep.mstEdges?.find(e => e && e.id === edge.id);
                        if (mstEdge && mstEdge.status === 'accepted') {
                            color = '#10b981';
                            width = 4;
                        } else if (currentStep.sortedEdges) {
                            const sortedEdge = currentStep.sortedEdges.find(e => e && e.id === edge.id);
                            if (sortedEdge?.status === 'rejected') {
                                color = '#ef4444';
                            } else if (sortedEdge?.status === 'accepted') {
                                color = '#10b981';
                                width = 4;
                            } else if (currentStep.currentEdge?.id === edge.id) {
                                color = '#f59e0b';
                                width = 3;
                            }
                        }
                    } else if (this.currentAlgorithm === 'prim') {
                        const mstEdge = currentStep.mstEdges?.find(e => e && e.id === edge.id);
                        if (mstEdge) {
                            color = '#10b981';
                            width = 4;
                        } else if (currentStep.currentEdge?.edgeId === edge.id) {
                            color = '#f59e0b';
                            width = 3;
                        }
                    } else if (this.currentAlgorithm === 'dijkstra') {
                        if (currentStep.shortestPaths) {
                            let isInPath = false;
                            Object.values(currentStep.shortestPaths).forEach(pathData => {
                                if (pathData && pathData.path && pathData.path.length > 1) {
                                    for (let i = 0; i < pathData.path.length - 1; i++) {
                                        if ((pathData.path[i] === edge.from && pathData.path[i + 1] === edge.to) ||
                                            (pathData.path[i] === edge.to && pathData.path[i + 1] === edge.from)) {
                                            isInPath = true;
                                            break;
                                        }
                                    }
                                }
                            });
                            if (isInPath) {
                                color = '#10b981';
                                width = 4;
                            }
                        }
                    }
                }

                this.drawEdge(fromNode, toNode, edge.weight || 0, color, width);
            }
        });

        // Draw nodes
        this.currentGraph.nodes.forEach(node => {
            if (!node || !node.id) return;

            let color = '#3b82f6';
            let borderColor = '#1e40af';

            if (currentStep) {
                if (this.currentAlgorithm === 'prim' && currentStep.visitedNodes?.includes(node.id)) {
                    color = '#10b981';
                    borderColor = '#059669';
                } else if (this.currentAlgorithm === 'dijkstra') {
                    if (currentStep.visited?.includes(node.id)) {
                        color = '#10b981';
                        borderColor = '#059669';
                    } else if (currentStep.currentNode === node.id) {
                        color = '#f59e0b';
                        borderColor = '#d97706';
                    }
                }
            }

            this.drawNode(node, color, borderColor);
        });
    }

    drawEdge(fromNode, toNode, weight, color = '#94a3b8', width = 2) {
        const ctx = this.ctx;

        ctx.strokeStyle = color;
        ctx.lineWidth = width;
        ctx.beginPath();
        ctx.moveTo(fromNode.x || 0, fromNode.y || 0);
        ctx.lineTo(toNode.x || 0, toNode.y || 0);
        ctx.stroke();

        const midX = ((fromNode.x || 0) + (toNode.x || 0)) / 2;
        const midY = ((fromNode.y || 0) + (toNode.y || 0)) / 2;

        ctx.fillStyle = getComputedStyle(document.body).getPropertyValue('--bg-primary');
        ctx.fillRect(midX - 15, midY - 10, 30, 20);

        ctx.fillStyle = color;
        ctx.font = '14px Inter, sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(String(weight || 0), midX, midY);
    }

    drawNode(node, fillColor = '#3b82f6', borderColor = '#1e40af') {
        const ctx = this.ctx;
        const radius = 25;

        ctx.fillStyle = fillColor;
        ctx.strokeStyle = borderColor;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(node.x || 0, node.y || 0, radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = 'white';
        ctx.font = 'bold 14px Inter, sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(String(node.id || ''), node.x || 0, node.y || 0);
    }

    enableControls() {
        document.getElementById('run-algorithm-btn').disabled = false;
    }

    enableStepControls() {
        document.getElementById('step-btn').disabled = false;
        document.getElementById('reset-btn').disabled = false;
    }

    disableStepControls() {
        document.getElementById('step-btn').disabled = true;
        document.getElementById('reset-btn').disabled = true;
    }

    setLoading(isLoading) {
        const btn = document.getElementById('run-algorithm-btn');
        if (isLoading) {
            btn.innerHTML = 'Running Algorithm...';
            btn.disabled = true;
        } else {
            btn.innerHTML = 'Run Algorithm';
            btn.disabled = false;
        }
    }

    getSampleGraphData() {
        return {
            nodes: [
                { id: "A", label: "Node A", x: 150, y: 100 },
                { id: "B", label: "Node B", x: 300, y: 80 },
                { id: "C", label: "Node C", x: 450, y: 120 },
                { id: "D", label: "Node D", x: 200, y: 250 },
                { id: "E", label: "Node E", x: 350, y: 280 },
                { id: "F", label: "Node F", x: 500, y: 300 }
            ],
            edges: [
                { id: "A-B", from: "A", to: "B", weight: 4 },
                { id: "A-D", from: "A", to: "D", weight: 2 },
                { id: "B-C", from: "B", to: "C", weight: 3 },
                { id: "B-D", from: "B", to: "D", weight: 1 },
                { id: "B-E", from: "B", to: "E", weight: 7 },
                { id: "C-E", from: "C", to: "E", weight: 5 },
                { id: "C-F", from: "C", to: "F", weight: 2 },
                { id: "D-E", from: "D", to: "E", weight: 6 },
                { id: "E-F", from: "E", to: "F", weight: 4 }
            ]
        };
    }
}

// Initialize the application
document.addEventListener('DOMContentLoaded', () => {
    const savedTheme = localStorage.getItem('theme') || 'light';
    document.body.setAttribute('data-theme', savedTheme);
    document.getElementById('theme-btn').textContent = savedTheme === 'dark' ? '☀️' : '🌙';

    const visualizer = new AlgorithmVisualizer();
    window.visualizer = visualizer;
});
