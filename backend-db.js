const mysql = require('mysql2/promise');
require('dotenv').config();

const pool = mysql.createPool({
    host:               process.env.TIDB_HOST,
    port:               Number(process.env.TIDB_PORT) || 4000,
    user:               process.env.TIDB_USER,
    password:           process.env.TIDB_PASSWORD,
    database:           process.env.TIDB_DATABASE,
    ssl:                { rejectUnauthorized: true }, 
    waitForConnections: true,
    connectionLimit:    10,
    timezone:           '-03:00', // Horário de Brasília
});

// Testa a conexão ao iniciar
pool.getConnection()
    .then(conn => {
        console.log('✅ Conectado ao TiDB com sucesso');
        conn.release();
    })
    .catch(err => {
        console.error('❌ Erro ao conectar ao TiDB:', err.message);
    });

module.exports = pool;
