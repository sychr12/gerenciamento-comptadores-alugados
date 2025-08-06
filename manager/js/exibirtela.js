document.addEventListener('DOMContentLoaded', function() {
    let computers = [];
    let editingIndex = null;

    const computerForm = document.getElementById('computerForm');
    const computerTable = document.getElementById('computerTable').getElementsByTagName('tbody')[0];

    updateTable();

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

        salvarNoBanco(computer);
        editingIndex = null;
        addButton.textContent = 'Adicionar';
        computerForm.reset();
    });

    function updateTable(lista = null) {
        fetch(`${AuxiFunc.address}api.php`)
            .then(res => res.json())
            .then(data => {
                computers = data;
                renderTable(lista || data);
            })
            .catch(err => {
                console.error('Erro ao carregar dados:', err);
                alert('Erro ao carregar dados: ' + err);
            });
    }

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

    window.pesquisar = function() {
        const termo = document.getElementById('pesquisa').value.toLowerCase();
        const filtroModelo = document.getElementById('vinidobubumguloso').value.toLowerCase();
        const filtroMotivo = document.getElementById('edbrock').value.toLowerCase();

        const resultados = computers.filter(computer => {
            const campos = `${computer.id} ${computer.model} ${computer.Resp} ${computer.Setor}`.toLowerCase();
            const matchTermo = termo ? campos.includes(termo) : true;
            const matchModelo = filtroModelo ? computer.model.toLowerCase() === filtroModelo : true;
            const matchMotivo = filtroMotivo && filtroMotivo !== 'selecione' ? computer.saidamt.toLowerCase() === filtroMotivo : true;

            return matchTermo && matchModelo && matchMotivo;
        });

        renderTable(resultados);
    }
    



        const index = selectedRow.dataset.index;
        const computer = computers[index];

        document.getElementById('id').value = computer.id;
        document.getElementById('status').value = computer.status;
        document.getElementById('model').value = computer.model;
        document.getElementById('entryDate').value = computer.entryDate;
        document.getElementById('Resp').value = computer.Resp;
        document.getElementById('Setor').value = computer.Setor;
        document.getElementById('pronto').value = computer.pronto;
        document.getElementById('exitDate').value = computer.exitDate !== '-' ? computer.exitDate : '';
        document.getElementById('saidamt').value = computer.saidamt !== '-' ? computer.saidamt : '';
        document.getElementById('Patrimonio').value = computer.Patrimonio !== '-' ? computer.Patrimonio : '';
        document.getElementById('obs').value = computer.obs !== '-' ? computer.obs : '';


});
