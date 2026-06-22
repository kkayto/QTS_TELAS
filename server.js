require('dotenv').config();

const express  = require('express');
const cors     = require('cors');
const bcrypt   = require('bcryptjs');
const pool     = require('./db');

const app  = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

app.post('/cadastro', async (req, res) => {
    const { nome, email, senha } = req.body;

    if (!nome || !email || !senha) {
        return res.status(400).json({ ok: false, erro: 'Preencha todos os campos.' });
    }

    try {
        // Verifica se email já existe
        const [rows] = await pool.query(
            'SELECT id FROM usuarios WHERE email = ?', [email.toLowerCase()]
        );

        if (rows.length > 0) {
            return res.status(409).json({ ok: false, erro: 'Este e-mail já está cadastrado.' });
        }

        // Hash da senha com bcrypt (salt 10)
        const senhaHash = await bcrypt.hash(senha, 10);

        // Insere usuário
        const [result] = await pool.query(
            'INSERT INTO usuarios (nome, email, senha_hash) VALUES (?, ?, ?)',
            [nome.trim(), email.trim().toLowerCase(), senhaHash]
        );

        // Busca o usuário recém-criado para retornar os dados
        const [novoUsuario] = await pool.query(
            'SELECT id, nome, email, criado_em FROM usuarios WHERE email = ?',
            [email.toLowerCase()]
        );

        return res.status(201).json({ ok: true, usuario: novoUsuario[0] });

    } catch (err) {
        console.error('Erro em /cadastro:', err);
        return res.status(500).json({ ok: false, erro: 'Erro interno do servidor.' });
    }
});

/* 
   POST /login
   Body: { email, senha } */
app.post('/login', async (req, res) => {
    const { email, senha } = req.body;

    if (!email || !senha) {
        return res.status(400).json({ ok: false, erro: 'Preencha todos os campos.' });
    }

    try {
        const [rows] = await pool.query(
            'SELECT id, nome, email, senha_hash, criado_em FROM usuarios WHERE email = ?',
            [email.trim().toLowerCase()]
        );

        if (rows.length === 0) {
            return res.status(401).json({ ok: false, erro: 'E-mail ou senha incorretos.' });
        }

        const usuario = rows[0];
        const senhaValida = await bcrypt.compare(senha, usuario.senha_hash);

        if (!senhaValida) {
            return res.status(401).json({ ok: false, erro: 'E-mail ou senha incorretos.' });
        }

        // Remove hash antes de retornar
        const { senha_hash, ...dadosPublicos } = usuario;

        return res.json({ ok: true, usuario: dadosPublicos });

    } catch (err) {
        console.error('Erro em /login:', err);
        return res.status(500).json({ ok: false, erro: 'Erro interno do servidor.' });
    }
});

/* 
   GET /ping — health check */
app.get('/ping', (req, res) => {
    res.json({ ok: true, mensagem: 'API Repre online 🟣' });
});

app.listen(PORT, () => {
    console.log(`🚀 Servidor rodando em http://localhost:${PORT}`);
});
