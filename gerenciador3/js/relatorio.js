document.addEventListener('DOMContentLoaded', async () => {
  const rowsElement = document.getElementById('report-rows');
  const searchInput = document.getElementById('report-search');
  const typeSelect = document.getElementById('report-type');
  const resultCount = document.getElementById('report-result-count');
  const exportButton = document.getElementById('report-export');
  if (!rowsElement || !searchInput || !typeSelect || !resultCount || !exportButton) return;

  const normalize = value => String(value ?? '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
    .toLocaleLowerCase('pt-BR');
  const isAvailable = value => value === true || value === 1 || value === '1' || value === 't' || value === 'true';
  const formatDate = value => {
    const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(String(value ?? ''));
    if (!match) return '—';
    const [, year, month, day] = match;
    return `${day}/${month}/${year}`;
  };
  const setText = (id, value) => {
    const element = document.getElementById(id);
    if (element) element.textContent = String(value);
  };

  let reportData = [];

  function render() {
    const term = normalize(searchInput.value);
    const type = typeSelect.value;
    const filtered = reportData.filter(item =>
      (type === 'all' || item.typeKey === type) &&
      normalize([item.type, item.patrimonio, item.equipment, item.location, item.date, item.status].join(' ')).includes(term)
    );

    rowsElement.replaceChildren();
    if (!filtered.length) {
      const row = rowsElement.insertRow();
      const cell = row.insertCell();
      cell.colSpan = 6;
      cell.textContent = reportData.length ? 'Nenhum equipamento corresponde aos filtros.' : 'Nenhum equipamento cadastrado.';
    } else {
      filtered.forEach(item => {
        const row = rowsElement.insertRow();
        [item.type, item.patrimonio, item.equipment, item.location, item.date, item.status].forEach((value, index) => {
          const cell = row.insertCell();
          cell.textContent = value || '—';
          if (index === 5) {
            const badge = document.createElement('span');
            badge.className = `report-status ${normalize(item.status).replace(/[^a-z0-9-]/g, '-')}`;
            badge.textContent = value || '—';
            cell.replaceChildren(badge);
          }
        });
      });
    }

    resultCount.textContent = `${filtered.length} de ${reportData.length} equipamento${reportData.length === 1 ? '' : 's'}`;
    exportButton.disabled = filtered.length === 0;
    exportButton.dataset.rows = String(filtered.length);
  }

  try {
    const [computerResponse, printerResponse] = await Promise.all([
      AuxiFunc.requestJSON(`${AuxiFunc.address}api.php`),
      AuxiFunc.requestJSON(`${AuxiFunc.address}impressoras_api.php`)
    ]);
    if (!Array.isArray(computerResponse) || !Array.isArray(printerResponse)) {
      throw new Error('O servidor retornou dados inválidos para o relatório.');
    }

    const computers = computerResponse.map(item => ({
      typeKey: 'computer',
      type: item.ownership === 'Próprio' ? 'Computador próprio' : 'Computador alugado',
      patrimonio: item.id,
      equipment: [item.status, item.model].filter(Boolean).join(' · '),
      location: [item.Setor && `Setor: ${item.Setor}`, item.Resp && `Responsável: ${item.Resp}`].filter(Boolean).join(' · '),
      date: formatDate(item.entryDate),
      status: item.pronto || 'Sem status'
    }));
    const printers = printerResponse.map(item => ({
      typeKey: 'printer',
      type: 'Impressora',
      patrimonio: item.patrimonio,
      equipment: item.modelo,
      location: [item.localizacao, item.ip && `IP: ${item.ip}`].filter(Boolean).join(' · '),
      date: formatDate(item.created_at),
      status: isAvailable(item.disponivel) ? 'Disponível' : 'Indisponível'
    }));
    reportData = [...computers, ...printers];

    setText('report-total', reportData.length);
    setText('report-active', computers.filter(item => normalize(item.status) === 'ativo').length);
    setText('report-printers', printers.filter(item => item.status === 'Disponível').length);
    render();
  } catch (error) {
    console.error('Não foi possível carregar o relatório:', error);
    rowsElement.replaceChildren();
    const row = rowsElement.insertRow();
    const cell = row.insertCell();
    cell.colSpan = 6;
    cell.textContent = error.message || 'Falha ao carregar o relatório. Atualize a página.';
    cell.setAttribute('role', 'alert');
    resultCount.textContent = 'Falha ao carregar';
    exportButton.disabled = true;
  }

  searchInput.addEventListener('input', render);
  typeSelect.addEventListener('change', render);
  exportButton.addEventListener('click', () => {
    const term = normalize(searchInput.value);
    const type = typeSelect.value;
    const filtered = reportData.filter(item =>
      (type === 'all' || item.typeKey === type) &&
      normalize([item.type, item.patrimonio, item.equipment, item.location, item.date, item.status].join(' ')).includes(term)
    );
    if (!filtered.length) return;
    AuxiFunc.downloadCSV('relatorio-equipamentos.csv',
      ['Tipo', 'Patrimônio', 'Equipamento', 'Local / responsável', 'Data', 'Status'],
      filtered.map(item => [item.type, item.patrimonio, item.equipment, item.location, item.date, item.status])
    );
  });
});
