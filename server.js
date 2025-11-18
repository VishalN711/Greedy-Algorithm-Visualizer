const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const path = require('path');

const kruskalRoute = require('./routes/kruskal');
const primRoute = require('./routes/prim');
const dijkstraRoute = require('./routes/dijkstra');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors({
    origin: '*',
    methods: ['GET', 'POST'],
    allowedHeaders: ['Content-Type', 'Accept']
}));

app.use(bodyParser.json({ limit: '10mb' }));
app.use(bodyParser.urlencoded({ extended: true, limit: '10mb' }));

// Serve static files
app.use(express.static(path.join(__dirname, 'public')));

// API Routes
app.use('/api/kruskal', kruskalRoute);
app.use('/api/prim', primRoute);
app.use('/api/dijkstra', dijkstraRoute);

// Main page
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Health check
app.get('/health', (req, res) => {
    res.json({ 
        status: 'OK', 
        message: 'Server is running',
        timestamp: new Date().toISOString()
    });
});

// Error handling
app.use((err, req, res, next) => {
    console.error('Server Error:', err);
    res.status(500).json({ 
        error: 'Internal server error', 
        message: err.message
    });
});

// Start server
const server = app.listen(PORT, () => {
    console.log('='.repeat(50));
    console.log('🚀 Greedy Algorithm Visualizer - FIXED');
    console.log('='.repeat(50));
    console.log(`📍 Server: http://localhost:${PORT}`);
    console.log(`🌐 Browser: http://localhost:${PORT}`);
    console.log('='.repeat(50));
    console.log('✅ Dijkstra null error FIXED');
    console.log('✅ Download button removed');
    console.log('✅ Icons cleaned up');
    console.log('='.repeat(50));
}).on('error', (err) => {
    if (err.code === 'EADDRINUSE') {
        console.error(`❌ Port ${PORT} is already in use!`);
        console.error('Solutions:');
        console.error('1. Kill process: lsof -ti:3000 | xargs kill');
        console.error('2. Use different port: PORT=3001 npm start');
    } else {
        console.error('❌ Server error:', err.message);
    }
    process.exit(1);
});

module.exports = app;
