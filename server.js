require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs'); // Importando o módulo fs
const app = express();
const certificateRoutes = require('./src/routes/certificates');
const PDFService = require('./src/services/pdfService');
const http = require('http');

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Rotas
app.use('/api/certificates', certificateRoutes);

// Rota de saúde
app.get('/health', (req, res) => {
    res.json({ 
        status: 'OK', 
        message: 'Servidor está funcionando',
        timestamp: new Date().toISOString(),
        port: process.env.PORT
    });
});

// API de cursos
app.get('/api/courses', (req, res) => {
    res.json([
        {
            id: 1,
            title: "Introdução ao Linux",
            description: "Conceitos básicos do sistema operacional Linux",
            duration: "2 horas",
            lessons: 5,
            completed: false,
            progress: 0
        },
        {
            id: 2,
            title: "Comandos Terminal",
            description: "Domine o terminal Linux como um profissional",
            duration: "3 horas",
            lessons: 7,
            completed: false,
            progress: 0
        },
        {
            id: 3,
            title: "Administração Linux",
            description: "Gerencie sistemas Linux com eficiência",
            duration: "4 horas",
            lessons: 8,
            completed: false,
            progress: 0
        }
    ]);
});

// Servir páginas diferentes
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.get('/verificar', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'verificar.html'));
});

app.get('/cursos', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'cursos.html'));
});

// Inicialização do servidor
const PORT = process.env.PORT || 3001;

// Testar conexão com banco primeiro
const pool = require('./src/config/database');
const Certificate = require('./src/models/Certificate');

async function startServer() {
    try {
        // Testar conexão com PostgreSQL
        const client = await pool.connect();
        console.log('✅ Conectado ao PostgreSQL com sucesso!');
        client.release();
        
        // Verificar se o template existe
        const templatePath = path.join(__dirname, 'certificates', 'templates', 'certificado-template.html');
        if (!fs.existsSync(templatePath)) {
            console.warn('⚠️ Template não encontrado em:', templatePath, 'Tentando continuar sem ele.');
        } else {
            console.log('✅ Template encontrado em:', templatePath);
        }
        
        // Iniciar servidor
        const server = app.listen(PORT, () => {
            console.log(`✅ Servidor rodando na porta ${PORT}`);
            console.log(`📍 Acesse: http://localhost:${PORT}`);
            console.log(`📍 API Health: http://localhost:${PORT}/health`);
        });

        // Graceful shutdown
        process.on('SIGINT', async () => {
            console.log('\n🛑 Desligando servidor gracefully...');
            
            try {
                await PDFService.cleanup();
                console.log('✅ Serviço PDF limpo');
            } catch (error) {
                console.error('❌ Erro ao limpar PDF service:', error);
            }

            server.close(() => {
                console.log('✅ Servidor desligado');
                process.exit(0);
            });
        });

        process.on('SIGTERM', async () => {
            console.log('\n🛑 Recebido SIGTERM, desligando gracefully...');

            try {
                await PDFService.cleanup();
                console.log('✅ Serviço PDF limpo');
            } catch (error) {
                console.error('❌ Erro ao limpar PDF service:', error);
            }

            server.close(() => {
                console.log('✅ Servidor desligado');
                process.exit(0);
            });
        });
    } catch (error) {
        console.error('❌ Erro ao iniciar o servidor:', error.message, error.stack);
        process.exit(1);
    }
}

// Inicializar servidor
startServer();

// Tratamento de erros não capturados
process.on('uncaughtException', (error) => {
    console.error('❌ Erro não capturado:', error.message, error.stack);
});

process.on('unhandledRejection', (reason, promise) => {
    console.error('❌ Promise rejeitada não tratada:', reason, promise);
});