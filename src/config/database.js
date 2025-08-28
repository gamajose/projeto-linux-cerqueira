const { Pool } = require('pg');

const pool = new Pool({
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    database: process.env.DB_NAME,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
});

// Testar conexão com o banco
pool.on('connect', () => {
    console.log('Conectado ao PostgreSQL:', process.env.DB_HOST);
});

pool.on('error', (err) => {
    console.error('Erro na conexão com o PostgreSQL:', err);
});

module.exports = pool;