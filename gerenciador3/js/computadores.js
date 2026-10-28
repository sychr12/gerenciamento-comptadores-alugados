document.addEventListener('DOMContentLoaded', () => {
  const address = window.AuxiFunc?.address;
  if (!address) {
    console.error('O endereço da API não foi configurado.');
    return;
  }

  const form = document.getElementById('computerForm');
  const tableBody = document.querySelector('#computerTable tbody');
  const submitButton = form?.querySelector('button[type="submit"]');
  const editButton = document.getElementById('edit-computer');
  const deleteButton = document.getElementById('delete-computer');
  const temSubstituicao = document.getElementById('temSubstituicao');
  const campoPatrimonioSubstituicao = document.getElementById('campoPatrimonioSubstituicao');
  const camposSubstituicao = ['Patrimonio', 'replacementName', 'replacementModel', 'replacementDate']
    .map(id => document.getElementById(id))
    .filter(Boolean);
  let computers = [];

  function togglePatrimonioSubstituicao() {
    if (!temSubstituicao || !campoPatrimonioSubstituicao) return;
    const isChecked = temSubstituicao.checked;
    campoPatrimonioSubstituicao.hidden = !isChecked;
    campoPatrimonioSubstituicao.classList.toggle('visible', isChecked);
    camposSubstituicao.forEach(field => {
      field.required = isChecked;
      if (!isChecked) field.value = '';
    });
  }
  temSubstituicao?.addEventListener('change', togglePatrimonioSubstituicao);
  togglePatrimonioSubstituicao();

  function clearSelection() {
    editButton && (editButton.disabled = true);
    deleteButton && (deleteButton.disabled = true);
  }

  const api = async (url = `${address}api.php`, options = {}) => {
    return window.AuxiFunc.requestJSON(url, options);
  };

  const value = id => document.getElementById(id)?.value.trim() || '';
  const setValue = (id, content) => { document.getElementById(id).value = content || ''; };
  const normalize = content => String(content ?? '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim().toLocaleLowerCase('pt-BR');
  const formatDate = date => {
    if (!date || date === '-') return '—';
    const parsed = new Date(`${date}T00:00:00`);
    return Number.isNaN(parsed.getTime()) ? date : parsed.toLocaleDateString('pt-BR');
  };
  const normalizedStatus = value => ({
    ativo: 'ativo',
    danificado: 'danificado',
    desativado: 'desativado',
    substituido: 'Substituído'
  })[normalize(value)] || value || '';

  async function loadComputers() {
    try {
      const result = await api();
      computers = Array.isArray(result) ? result : [];
      const active = computers.filter(computer => normalize(computer.pronto) === 'ativo').length;
      document.getElementById('metric-total')?.replaceChildren(String(computers.length));
      document.getElementById('metric-active')?.replaceChildren(String(active));
      document.getElementById('metric-attention')?.replaceChildren(String(computers.length - active));
      search();
    } catch (error) {
      console.error(error);
      clearSelection();
      if (tableBody) {
        tableBody.replaceChildren();
        const row = tableBody.insertRow();
        const cell = row.insertCell();
        cell.colSpan = 15;
        cell.textContent = error.message || 'Não foi possível carregar os computadores.';
        cell.setAttribute('role', 'alert');
      }
    }
  }

  function renderTable(rows) {
    if (!tableBody) return;
    clearSelection();
    tableBody.replaceChildren();
    if (!rows.length) {
      const row = tableBody.insertRow();
      const cell = row.insertCell();
      cell.colSpan = 15;
      cell.textContent = 'Nenhum computador encontrado.';
      return;
    }

    rows.forEach((computer, index) => {
      const row = tableBody.insertRow();
      row.dataset.id = computer.id;
      row.style.setProperty('--row-index', String(Math.min(index, 11)));
      row.tabIndex = 0;
      row.setAttribute('aria-label', `Selecionar computador patrimônio ${computer.id}`);
      row.setAttribute('aria-selected', 'false');
      [computer.id, computer.status, computer.ownership || 'Alugado', computer.model, computer.entryDate, computer.Resp,
        computer.Setor, computer.pronto, computer.exitDate, computer.saidamt,
        computer.Patrimonio, computer.replacementName, computer.replacementModel,
        computer.replacementDate, computer.obs].forEach((item, index) => {
        const cell = row.insertCell();
        if (index === 4 || index === 8 || index === 13) {
          cell.textContent = formatDate(item);
        } else if (index === 7 && item) {
          const badge = document.createElement('span');
          badge.className = `computer-status ${String(item).toLocaleLowerCase('pt-BR').replace(/[^a-z0-9-]/g, '-')}`;
          badge.textContent = item;
          cell.append(badge);
        } else {
          cell.textContent = item || '—';
        }
      });
    });
  }

  function search() {
    const term = normalize(value('pesquisa'));
    const model = normalize(value('filtro-modelo'));
    const reason = normalize(value('filtro-motivo'));
    const ownership = normalize(value('filtro-vinculo'));
    const filtered = computers.filter(computer => {
      const searchable = normalize([computer.id, computer.status, computer.ownership || 'Alugado', computer.model, computer.Resp, computer.Setor,
        computer.pronto, computer.saidamt, computer.Patrimonio, computer.replacementName,
        computer.replacementModel, computer.obs].join(' '));
      return (!term || searchable.includes(term)) &&
        (!model || normalize(computer.model).includes(model)) &&
        (!reason || normalize(computer.saidamt) === reason) &&
        (!ownership || normalize(computer.ownership || 'Alugado') === ownership);
    });
    renderTable(filtered);
  }

  window.pesquisar = search;
  document.getElementById('pesquisa')?.addEventListener('input', search);
  document.getElementById('filtro-modelo')?.addEventListener('change', search);
  document.getElementById('filtro-motivo')?.addEventListener('change', search);
  document.getElementById('filtro-vinculo')?.addEventListener('change', search);
  document.getElementById('limpar-filtros')?.addEventListener('click', () => {
    document.getElementById('pesquisa').value = '';
    document.getElementById('filtro-modelo').value = '';
    document.getElementById('filtro-motivo').value = '';
    document.getElementById('filtro-vinculo').value = '';
    search();
  });

  window.botaodlt = async () => {
    const id = tableBody?.querySelector('tr.selected')?.dataset.id;
    if (!id) return alert('Selecione um computador para excluir.');
    if (!confirm('Tem certeza de que deseja excluir este computador?')) return;
    try {
      const result = await api(`${address}api.php?id=${encodeURIComponent(id)}`, { method: 'DELETE' });
      alert(result.mensagem || 'Computador excluído.');
      await loadComputers();
    } catch (error) { alert(error.message); }
  };

  window.botaoedit = () => {
    const id = tableBody?.querySelector('tr.selected')?.dataset.id;
    const computer = computers.find(item => String(item.id) === String(id));
    if (!computer) return alert('Selecione um computador para editar.');
    localStorage.setItem('computadorEdicao', JSON.stringify(computer));
    window.location.href = 'novo_computador.html';
  };

  const selectRow = row => {
    if (!row) return;
    tableBody.querySelectorAll('tr.selected').forEach(selected => selected.classList.remove('selected'));
    tableBody.querySelectorAll('tr[aria-selected="true"]').forEach(selected => selected.setAttribute('aria-selected', 'false'));
    row.classList.add('selected');
    row.setAttribute('aria-selected', 'true');
    if (editButton) editButton.disabled = false;
    if (deleteButton) deleteButton.disabled = false;
  };
  tableBody?.addEventListener('click', event => selectRow(event.target.closest('tr[data-id]')));
  tableBody?.addEventListener('keydown', event => {
    if (event.key !== 'Enter' && event.key !== ' ') return;
    const row = event.target.closest('tr[data-id]');
    if (!row) return;
    event.preventDefault();
    selectRow(row);
  });

  form?.addEventListener('submit', async event => {
    event.preventDefault();
    const computer = {
      id: value('id'), status: value('status'), ownership: value('ownership'), model: value('model'), entryDate: value('entryDate'),
      Resp: value('Resp'), Setor: value('Setor'), pronto: value('pronto'),
      exitDate: value('exitDate'), saidamt: value('saidamt'), Patrimonio: value('Patrimonio'),
      replacementName: value('replacementName'), replacementModel: value('replacementModel'),
      replacementDate: value('replacementDate'), obs: value('obs')
    };
    if (!temSubstituicao?.checked) {
      computer.Patrimonio = '';
      computer.replacementName = '';
      computer.replacementModel = '';
      computer.replacementDate = '';
    }
    if (submitButton) submitButton.disabled = true;
    try {
      const result = await api(`${address}api.php`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(computer)
      });
      alert(result.mensagem || 'Computador salvo com sucesso.');
      localStorage.removeItem('computadorEdicao');
      form.reset();
      if (temSubstituicao) {
        temSubstituicao.checked = false;
      }
      togglePatrimonioSubstituicao();
      const idField = document.getElementById('id');
      if (idField) idField.readOnly = false;
      if (submitButton) submitButton.textContent = 'Adicionar';
      if (tableBody) await loadComputers();
    } catch (error) { alert(error.message); }
    finally { if (submitButton) submitButton.disabled = false; }
  });

  document.getElementById('export-computers')?.addEventListener('click', () => {
    AuxiFunc.downloadCSV('computadores.csv',
      ['Patrimônio', 'Tipo', 'Vínculo', 'Modelo', 'Data de entrada', 'Responsável', 'Setor', 'Status', 'Data de saída', 'Motivo da saída', 'Patrimônio substituído', 'Nome da máquina substituta', 'Modelo da máquina substituta', 'Data de substituição', 'Observações'],
      computers.map(computer => [computer.id, computer.status, computer.ownership || 'Alugado', computer.model, computer.entryDate,
        computer.Resp, computer.Setor, computer.pronto, computer.exitDate, computer.saidamt,
        computer.Patrimonio, computer.replacementName, computer.replacementModel,
        computer.replacementDate, computer.obs])
    );
  });

  if (tableBody) loadComputers();

  const editData = localStorage.getItem('computadorEdicao');
  if (form && editData) {
    try {
      const computer = JSON.parse(editData);
      ['id', 'status', 'model', 'entryDate', 'Resp', 'Setor'].forEach(key => setValue(key, computer[key]));
      setValue('ownership', computer.ownership || 'Alugado');
      setValue('pronto', normalizedStatus(computer.pronto));
      ['exitDate', 'saidamt', 'obs'].forEach(key => setValue(key, computer[key] === '-' ? '' : computer[key]));
      const hasSubstituicao = [computer.Patrimonio, computer.replacementName,
        computer.replacementModel, computer.replacementDate]
        .some(item => item && String(item).trim() !== '' && item !== '-');
      if (temSubstituicao) {
        temSubstituicao.checked = hasSubstituicao;
      }
      camposSubstituicao.forEach(field => {
        const key = field.id;
        setValue(key, computer[key] === '-' ? '' : computer[key]);
      });
      togglePatrimonioSubstituicao();
      document.getElementById('id').readOnly = true;
      if (submitButton) submitButton.textContent = 'Salvar alterações';
    } catch (error) {
      console.error('Não foi possível abrir os dados para edição.', error);
      localStorage.removeItem('computadorEdicao');
    }
  }
});
