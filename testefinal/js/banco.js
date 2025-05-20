const express = require('express');
const bodyParser = require('body-parser');
const app = express();
const PORT = 3000;

// Simulando um banco de dados
let computers = [];

app.use(bodyParser.json());

// GET /computers - Listar todos
app.get('/computers', (req, res) => {
    res.json(computers);
});

// POST /computers - Criar novo
app.post('/computers', (req, res) => {
    const computer = req.body;
    computers.push(computer);
    res.status(201).json(computer);
});

// PUT /computers/:id - Atualizar
app.put('/computers/:id', (req, res) => {
    const id = req.params.id;
    const index = computers.findIndex(c => c.id === id);
    
    if (index === -1) {
        return res.status(404).json({ error: 'Computador não encontrado' });
    }
    
    computers[index] = req.body;
    res.json(computers[index]);
});

// DELETE /computers/:id - Remover
app.delete('/computers/:id', (req, res) => {
    const id = req.params.id;
    computers = computers.filter(c => c.id !== id);
    res.status(204).send();
});

app.listen(PORT, () => {
    console.log(`Servidor rodando na porta ${PORT}`);
});