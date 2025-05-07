document.addEventListener('DOMContentLoaded', function() {
    // URL base da sua API (substitua pela sua URL real)
    const API_URL = 'http://localhost:3000/computers'; // Exemplo
    
    // Elementos do DOM
    const computerForm = document.getElementById('computerForm');
    const computerTable = document.getElementById('computerTable').querySelector('tbody');
    const searchInput = document.getElementById('pesquisa');
    const filterSelect = document.getElementById('vinidobubumguloso');
    
    // Variável para armazenar computadores
    let computers = [];
    
    // Inicializar a tabela
    fetchComputers();
    
    // Buscar computadores do banco de dados
    async function fetchComputers() {
        try {
            const response = await fetch(API_URL);
            if (!response.ok) throw new Error('Erro ao buscar computadores');
            
            computers = await response.json();
            updateTable();
        } catch (error) {
            console.error('Erro:', error);
            alert('Erro ao carregar computadores');
        }
    }
    
    // Adicionar/Atualizar computador
    computerForm.addEventListener('submit', async function(e) {
        e.preventDefault();
        
        const computer = {
            id: document.getElementById('id').value,
            status: document.getElementById('status').value,
            model: document.getElementById('model').value,
            entryDate: document.getElementById('entryDate').value,
            Resp: document.getElementById('Resp').value,
            Setor: document.getElementById('Setor').value,
            pronto: document.getElementById('pronto').value,
            exitDate: document.getElementById('exitDate').value || null,
            saidamt: document.getElementById('saidamt').value,
            Patrimonio: document.getElementById('Patrimonio').value,
            obs: document.getElementById('obs').value
        };
        
        try {
            const method = computer.id ? 'PUT' : 'POST';
            const url = computer.id ? `${API_URL}/${computer.id}` : API_URL;
            
            const response = await fetch(url, {
                method: method,
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(computer)
            });
            
            if (!response.ok) throw new Error('Erro ao salvar computador');
            
            await fetchComputers(); // Atualiza a lista
            computerForm.reset();
        } catch (error) {
            console.error('Erro:', error);
            alert('Erro ao salvar computador');
        }
    });
    
    // Atualizar tabela
    function updateTable(filteredComputers = null) {
        const data = filteredComputers || computers;
        computerTable.innerHTML = '';
        
        data.forEach((computer) => {
            const row = computerTable.insertRow();
            row.dataset.id = computer.id;
            
            row.innerHTML = `
                <td>${computer.id}</td>
                <td>${computer.status}</td>
                <td>${computer.model}</td>
                <td>${computer.entryDate}</td>
                <td>${computer.Resp}</td>
                <td>${computer.Setor}</td>
                <td>${computer.pronto}</td>
                <td>${computer.exitDate || '-'}</td>
                <td>${computer.saidamt}</td>
                <td>${computer.Patrimonio}</td>
                <td>${computer.obs}</td>
            `;
        });
    }
    
    // Pesquisar computadores (client-side)
    window.pesquisar = function() {
        const searchTerm = searchInput.value.toLowerCase();
        const filterValue = filterSelect.value;
        
        const results = computers.filter(computer => {
            const matchesSearch = 
                computer.id.toString().includes(searchTerm) ||
                computer.model.toLowerCase().includes(searchTerm) ||
                computer.Resp.toLowerCase().includes(searchTerm) ||
                computer.Setor.toLowerCase().includes(searchTerm);
            
            const matchesFilter = filterValue ? computer.model.includes(filterValue) : true;
            
            return matchesSearch && matchesFilter;
        });
        
        updateTable(results);
    }
    
    // Deletar computador
    window.botaodlt = async function() {
        const selectedRow = document.querySelector('#computerTable tbody tr.selected');
        if (!selectedRow) {
            alert('Selecione um computador para deletar');
            return;
        }
        
        const computerId = selectedRow.dataset.id;
        
        if (confirm('Tem certeza que deseja deletar este computador?')) {
            try {
                const response = await fetch(`${API_URL}/${computerId}`, {
                    method: 'DELETE'
                });
                
                if (!response.ok) throw new Error('Erro ao deletar computador');
                
                await fetchComputers(); // Atualiza a lista
            } catch (error) {
                console.error('Erro:', error);
                alert('Erro ao deletar computador');
            }
        }
    }
    
    // Editar computador
    window.botaoedit = function() {
        const selectedRow = document.querySelector('#computerTable tbody tr.selected');
        if (!selectedRow) {
            alert('Selecione um computador para editar');
            return;
        }
        
        const computerId = selectedRow.dataset.id;
        const computer = computers.find(c => c.id.toString() === computerId);
        
        if (computer) {
            // Preencher formulário com dados do computador selecionado
            document.getElementById('id').value = computer.id;
            document.getElementById('status').value = computer.status;
            document.getElementById('model').value = computer.model;
            document.getElementById('entryDate').value = computer.entryDate;
            document.getElementById('Resp').value = computer.Resp;
            document.getElementById('Setor').value = computer.Setor;
            document.getElementById('pronto').value = computer.pronto;
            document.getElementById('exitDate').value = computer.exitDate || '';
            document.getElementById('saidamt').value = computer.saidamt;
            document.getElementById('Patrimonio').value = computer.Patrimonio;
            document.getElementById('obs').value = computer.obs;
        }
    }
    
    // Selecionar linha da tabela
    computerTable.addEventListener('click', function(e) {
        const row = e.target.closest('tr');
        if (!row) return;
        
        // Remover seleção de todas as linhas
        document.querySelectorAll('#computerTable tbody tr').forEach(r => {
            r.classList.remove('selected');
        });
        
        // Adicionar seleção à linha clicada
        row.classList.add('selected');
    });
});