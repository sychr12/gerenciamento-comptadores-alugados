document.addEventListener('DOMContentLoaded', async () => {
  const userName = sessionStorage.getItem('nome');
  document.getElementById('dashboard-user').textContent = userName || 'bem-vindo';
  if (Number(sessionStorage.getItem('nivel')) < 2) {
    document.getElementById('dashboard-users-link')?.remove();
  }

  const put = (id, value) => {
    const element = document.getElementById(id);
    if (element) element.textContent = String(value);
  };
  const normalize = value => String(value ?? '').trim().toLocaleLowerCase('pt-BR');
  const recent = document.getElementById('dashboard-recent');
  const alertPanel = document.getElementById('dashboard-inactive-alerts');
  const alertList = document.getElementById('dashboard-alert-list');

  function daysSinceExit(dateValue) {
    const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(dateValue ?? '').trim());
    if (!match) return null;
    const [, year, month, day] = match.map(Number);
    const exitDay = Date.UTC(year, month - 1, day);
    const parsedDate = new Date(exitDay);
    if (parsedDate.getUTCFullYear() !== year || parsedDate.getUTCMonth() !== month - 1 || parsedDate.getUTCDate() !== day) {
      return null;
    }
    const today = new Date();
    const todayDay = Date.UTC(today.getFullYear(), today.getMonth(), today.getDate());
    return Math.floor((todayDay - exitDay) / 86400000);
  }

  function renderInactiveAlerts(computers) {
    if (!alertPanel || !alertList) return;
    const overdue = computers
      .filter(computer => normalize(computer.pronto) !== 'ativo')
      .map(computer => ({ computer, days: daysSinceExit(computer.exitDate) }))
      .filter(item => item.days !== null && item.days > 2)
      .sort((a, b) => b.days - a.days);

    alertList.replaceChildren();
    alertPanel.hidden = overdue.length === 0;
    put('dashboard-alert-count', overdue.length);
    overdue.forEach(({ computer, days }) => {
      const row = document.createElement('a');
      row.className = 'dashboard-alert-row';
      row.href = 'info_computadores.html';

      const icon = document.createElement('span');
      icon.className = 'dashboard-alert-icon';
      icon.innerHTML = '<i class="bx bx-time-five" aria-hidden="true"></i>';

      const info = document.createElement('span');
      info.className = 'dashboard-alert-info';
      const title = document.createElement('strong');
      title.textContent = computer.model || `Computador #${computer.id}`;
      const detail = document.createElement('small');
      detail.textContent = `Patrimônio ${computer.id} · ${computer.Setor || 'Setor não informado'} · ${days} dias desde a saída`;

      const status = document.createElement('span');
      status.className = 'dashboard-alert-status';
      status.textContent = computer.pronto || 'Sem status';
      info.append(title, detail);
      row.append(icon, info, status);
      alertList.append(row);
    });
  }

  try {
    const [computerResponse, printerResponse] = await Promise.all([
      AuxiFunc.requestJSON(`${AuxiFunc.address}api.php`),
      AuxiFunc.requestJSON(`${AuxiFunc.address}impressoras_api.php`)
    ]);
    const computers = Array.isArray(computerResponse) ? computerResponse : [];
    const printers = Array.isArray(printerResponse) ? printerResponse : [];
    const activeCount = computers.filter(item => normalize(item.pronto) === 'ativo').length;
    const attentionCount = computers.length - activeCount;
    const percent = computers.length ? Math.round(activeCount / computers.length * 100) : 0;
    const availablePrinters = printers.filter(item => item.disponivel === true || item.disponivel === 1 || item.disponivel === '1' || item.disponivel === 't' || item.disponivel === 'true').length;

    put('dashboard-computers', computers.length);
    put('dashboard-computers-note', `${computers.length === 1 ? 'equipamento cadastrado' : 'equipamentos cadastrados'}`);
    put('dashboard-active', activeCount);
    put('dashboard-attention', attentionCount);
    put('dashboard-printers', availablePrinters);
    put('dashboard-printers-note', `de ${printers.length} ${printers.length === 1 ? 'impressora' : 'impressoras'}`);
    put('dashboard-active-percent', `${percent}%`);
    put('legend-active', activeCount);
    put('legend-attention', attentionCount);
    const bar = document.getElementById('dashboard-active-bar');
    bar.style.width = `${percent}%`;
    bar.parentElement.setAttribute('aria-valuenow', String(percent));
    renderInactiveAlerts(computers);

    recent.replaceChildren();
    const latest = [...computers].sort((a, b) => {
      const dateA = Date.parse(a.entryDate || '') || 0;
      const dateB = Date.parse(b.entryDate || '') || 0;
      return dateB - dateA || Number(b.id) - Number(a.id);
    }).slice(0, 5);
    if (!latest.length) {
      const empty = document.createElement('p');
      empty.className = 'dashboard-empty';
      empty.textContent = 'Ainda não há computadores cadastrados.';
      recent.append(empty);
    }
    latest.forEach(item => {
      const row = document.createElement('a');
      row.className = 'recent-equipment';
      row.href = 'info_computadores.html';
      const icon = document.createElement('span');
      icon.className = 'recent-equipment-icon';
      icon.innerHTML = '<i class="bx bx-desktop" aria-hidden="true"></i>';
      const info = document.createElement('span');
      info.className = 'recent-equipment-info';
      const title = document.createElement('strong');
      title.textContent = item.model || `Computador #${item.id}`;
      const detail = document.createElement('small');
      detail.textContent = `Patrimônio ${item.id} · ${item.Setor || 'Setor não informado'}`;
      const badge = document.createElement('span');
      badge.className = `recent-status ${normalize(item.pronto) === 'ativo' ? 'is-active' : 'is-attention'}`;
      badge.textContent = item.pronto || 'Sem status';
      info.append(title, detail);
      row.append(icon, info, badge);
      recent.append(row);
    });
  } catch (error) {
    console.error('Não foi possível carregar os dados do painel:', error);
    put('dashboard-computers-note', 'Falha ao carregar');
    put('dashboard-printers-note', 'Falha ao carregar');
    if (alertPanel) alertPanel.hidden = true;
    recent.replaceChildren();
    const failure = document.createElement('p');
    failure.className = 'dashboard-empty dashboard-error';
    failure.textContent = error.message || 'Não foi possível carregar os dados. Atualize a página.';
    recent.append(failure);
  }
});
