import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(__dirname));

// Routes
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'login.html'));
});

app.get('/app', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// Health check endpoint
app.get('/api/health', (req, res) => {
    res.json({ 
        status: 'OK', 
        message: 'Elaraby Maintenance System API',
        timestamp: new Date().toISOString(),
        version: '1.0.0'
    });
});

// Serve static files with proper MIME types
app.use('/css', express.static(path.join(__dirname, 'css'), {
    setHeaders: (res, path) => {
        if (path.endsWith('.css')) {
            res.setHeader('Content-Type', 'text/css');
        }
    }
}));

app.use('/js', express.static(path.join(__dirname, 'js'), {
    setHeaders: (res, path) => {
        if (path.endsWith('.js')) {
            res.setHeader('Content-Type', 'application/javascript');
        }
    }
}));

app.use('/audio', express.static(path.join(__dirname, 'audio')));

// Catch all handler
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'login.html'));
});

app.listen(PORT, () => {
    console.log('🚀 Elaraby Maintenance System Server Started');
    console.log(`📍 Port: ${PORT}`);
    console.log(`🌐 Local: http://localhost:${PORT}`);
    console.log(`🔧 Environment: ${process.env.NODE_ENV || 'development'}`);
});