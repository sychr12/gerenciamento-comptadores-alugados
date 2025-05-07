document.addEventListener('DOMContentLoaded', function() {
    let computers = [];
    let editingIndex = null;
    let editingId = null;

    // Elementos do DOM
    const computerForm = document.getElementById('computerForm');
    const computerTable = document.getElementById('computerTable').getElementsByTagName('tbody')[0];
    const addButton = computerForm.querySelector('button[type="submit"]');
    const searchInput = document.getElementById('pesquisa');
    const modelFilter = document.getElementById('vinidobubumguloso');
    const reasonFilter = document.getElementById('edbrock');
    const loadingElement = document.getElementById('loading');

    // Inicializar a tabela
    updateTable();

    // Função para adicionar/editar um computador
    computerForm.addEventListener('submit', function(e) {
        e.preventDefault();

        const computer = {
            id: document.getElementById('id').value,
            status: document.getElementById('status').value,
            model: document.getElementById('model').value,
            entryDate: document.getElementById('entryDate').value,
            Resp: document.getElementById('Resp').value,
            Setor: document.getElementById('Setor').value,
            pronto: document.getElementById('pronto').value,
            exitDate: document.getElementById('exitDate').value || '-',
            saidamt: document.getElementById('saidamt').value || '-',
            Patrimonio: document.getElementById('Patrimonio').value || '-',
            obs: document.getElementById('obs').value || '-'
        };

        if (editingId !== null) {
            // Editar computador existente
            updateComputer(editingId, computer);
        } else {
            // Adicionar novo computador
            saveComputer(computer);
        }
    });

    // Função para carregar e atualizar a tabela
    function updateTable(filteredComputers = null) {
        loadingElement.style.display = 'block';

        fetch('http://localhost/gerenciamento/api.php')
            .then(res => res.json())
            .then(data => {
                computers = data;
                renderTable(filteredComputers || data);
            })
            .catch(err => {
                console.error('Erro ao carregar dados:', err);
                alert('Erro ao carregar dados: ' + err);
            })
            .finally(() => {
                loadingElement.style.display = 'none';
            });
    }

    // Função para renderizar a tabela
    function renderTable(data) {
        computerTable.innerHTML = '';

        data.forEach((computer, index) => {
            const row = computerTable.insertRow();
            row.dataset.index = index;

            row.innerHTML = `
                <td>${computer.id}</td>
                <td>${computer.status}</td>
                <td>${computer.model}</td>
                <td>${computer.entryDate}</td>
                <td>${computer.Resp}</td>
                <td>${computer.Setor}</td>
                <td>${computer.pronto}</td>
                <td>${computer.exitDate}</td>
                <td>${computer.saidamt}</td>
                <td>${computer.Patrimonio}</td>
                <td>${computer.obs}</td>
            `;
        });
    }

    // Função de pesquisa
    window.pesquisar = function() {
        const termo = searchInput.value.toLowerCase();
        const filtroModelo = modelFilter.value.toLowerCase();
        const filtroMotivo = reasonFilter.value.toLowerCase();

        const resultados = computers.filter(computer => {
            const id = (computer.id || '').toLowerCase();
            const model = (computer.model || '').toLowerCase();
            const resp = (computer.Resp || '').toLowerCase();
            const setor = (computer.Setor || '').toLowerCase();
            const saidamt = (computer.saidamt || '').toLowerCase();

            const matchTermo =
                id.includes(termo) ||
                model.includes(termo) ||
                resp.includes(termo) ||
                setor.includes(termo);

            const matchModelo = filtroModelo ? model.includes(filtroModelo) : true;
            const matchMotivo = filtroMotivo ? saidamt.includes(filtroMotivo) : true;

            return matchTermo && matchModelo && matchMotivo;
        });

        renderTable(resultados);
    };

    // Função para deletar computador
    window.botaodlt = function() {
        const selectedRow = document.querySelector('#computerTable tbody tr.selected');
        if (!selectedRow) {
            alert('Selecione um computador para deletar');
            return;
        }

        const index = selectedRow.dataset.index;
        const id = computers[index].id;

        if (confirm('Tem certeza que deseja excluir este computador?')) {
            deleteComputer(id);
        }
    };

    // Função para editar computador
    window.botaoedit = function() {
        const selectedRow = document.querySelector('#computerTable tbody tr.selected');
        if (!selectedRow) {
            alert('Selecione um computador para editar');
            return;
        }

        const index = selectedRow.dataset.index;
        const computer = computers[index];

        // Preencher formulário com os dados do computador
        document.getElementById('id').value = computer.id;
        document.getElementById('status').value = computer.status;
        document.getElementById('model').value = computer.model;
        document.getElementById('entryDate').value = computer.entryDate;
        document.getElementById('Resp').value = computer.Resp;
        document.getElementById('Setor').value = computer.Setor;
        document.getElementById('pronto').value = computer.pronto;
        document.getElementById('exitDate').value = computer.exitDate === '-' ? '' : computer.exitDate;
        document.getElementById('saidamt').value = computer.saidamt === '-' ? '' : computer.saidamt;
        document.getElementById('Patrimonio').value = computer.Patrimonio === '-' ? '' : computer.Patrimonio;
        document.getElementById('obs').value = computer.obs === '-' ? '' : computer.obs;

        // Configurar para edição
        editingIndex = index;
        editingId = computer.id;
        addButton.textContent = 'Salvar Edição';

        // Rolagem suave para o formulário
        computerForm.scrollIntoView({ behavior: 'smooth' });
    };

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

    // Funções para interação com a API
    function saveComputer(computer) {
        loadingElement.style.display = 'block';
        
        fetch('http://localhost/gerenciamento/api.php', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(computer)
        })
        .then(res => res.json())
        .then(data => {
            alert(data.mensagem || 'Computador adicionado com sucesso!');
            resetForm();
            updateTable();
        })
        .catch(err => {
            console.error('Erro ao salvar:', err);
            alert('Erro ao salvar: ' + err);
        })
        .finally(() => {
            loadingElement.style.display = 'none';
        });
    }

    function updateComputer(id, computer) {
        loadingElement.style.display = 'block';
        
        fetch(`http://localhost/gerenciamento/api.php?id=${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(computer)
        })
        .then(res => res.json())
        .then(data => {
            alert(data.mensagem || 'Computador atualizado com sucesso!');
            resetForm();
            updateTable();
        })
        .catch(err => {
            console.error('Erro ao atualizar:', err);
            alert('Erro ao atualizar: ' + err);
        })
        .finally(() => {
            loadingElement.style.display = 'none';
        });
    }

    function deleteComputer(id) {
        loadingElement.style.display = 'block';
        
        fetch(`http://localhost/gerenciamento/api.php?id=${id}`, {
            method: 'DELETE'
        })
        .then(res => res.json())
        .then(data => {
            alert(data.mensagem || 'Computador excluído com sucesso!');
            resetForm();
            updateTable();
        })
        .catch(err => {
            console.error('Erro ao deletar:', err);
            alert('Erro ao deletar: ' + err);
        })
        .finally(() => {
            loadingElement.style.display = 'none';
        });
    }

    function resetForm() {
        computerForm.reset();
        editingIndex = null;
        editingId = null;
        addButton.textContent = 'Adicionar';
    }
});