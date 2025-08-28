const express = require('express');
const cors = require('cors');
const path = require('path');
const certificateRoutes = require('./routes/certificates');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('../public'));

// Rotas
app.use('/api/certificates', certificateRoutes);

// Rota de saúde
app.get('/health', (req, res) => {
    res.json({ 
        status: 'OK', 
        message: 'Servidor está funcionando',
        timestamp: new Date().toISOString()
    });
});

// Rota principal
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '../public/index.html'));
});

// Middleware de erro
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ 
        error: 'Erro interno do servidor' 
    });
});

// Rota não encontrada
app.use('*', (req, res) => {
    res.status(404).json({ 
        error: 'Rota não encontrada' 
    });
});

module.exports = app;