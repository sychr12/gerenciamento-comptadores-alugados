document.addEventListener('DOMContentLoaded', () => {
  const grid = document.querySelector('.impressoras-lista');
  const form = document.getElementById('printer-form');
  const dialog = document.getElementById('printer-dialog');
  if (!grid || !form || !dialog) return;

  const endpoint = '../php/impressoras_api.php';
  const search = document.getElementById('printer-search');
  const empty = document.querySelector('.printer-empty');
  const filterButtons = [...document.querySelectorAll('[data-printer-filter]')];
  const toast = document.createElement('div');
  toast.className = 'app-toast';
  toast.setAttribute('role', 'status');
  toast.setAttribute('aria-live', 'polite');
  document.body.append(toast);

  let printers = [];
  let activeFilter = 'all';
  let toastTimer;
  const normalize = value => String(value ?? '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLocaleLowerCase('pt-BR');
  const isAvailable = value => value === true || value === 1 || value === '1' || value === 't' || value === 'true';

  function notify(message) {
    toast.textContent = message;
    toast.classList.add('is-visible');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toast.classList.remove('is-visible'), 2200);
  }

  async function request(url = endpoint, options = {}) {
    const response = await fetch(url, options);
    const text = await response.text();
    let result;
    try { result = JSON.parse(text); }
    catch { throw new Error('O servidor não retornou uma resposta válida. Verifique se o PHP está iniciado.'); }
    if (!response.ok) throw new Error(result.message || 'Não foi possível concluir a operação.');
    return result;
  }

  function field(label, value) {
    const line = document.createElement('p');
    const strong = document.createElement('strong');
    strong.textContent = `${label}: `;
    line.append(strong);
    const panelUrl = label === 'IP' ? getPrinterPanelUrl(value) : null;
    if (panelUrl) {
      const link = document.createElement('a');
      link.className = 'printer-ip-link';
      link.href = panelUrl;
      link.target = '_blank';
      link.rel = 'noopener noreferrer';
      link.textContent = String(value).trim();
      link.setAttribute('aria-label', `Abrir painel da impressora no endereço ${link.textContent} em nova aba`);
      link.title = 'Abrir painel web da impressora em nova aba';
      line.append(link);
    } else {
      line.append(document.createTextNode(value || '—'));
    }
    return line;
  }

  function getPrinterPanelUrl(value) {
    const match = /^(\d{1,3}(?:\.\d{1,3}){3})(?::(\d{1,5}))?$/.exec(String(value ?? '').trim());
    if (!match) return null;

    const octets = match[1].split('.').map(Number);
    if (octets.some(octet => octet > 255)) return null;

    const port = match[2] ? Number(match[2]) : null;
    if (port !== null && (port < 1 || port > 65535)) return null;

    const address = octets.join('.');
    return `http://${address}${port ? `:${port}` : ''}/`;
  }

  function updateSummary() {
    document.getElementById('printer-total').textContent = String(printers.length);
    document.getElementById('printer-available').textContent = String(printers.filter(printer => isAvailable(printer.disponivel)).length);
  }

  function render() {
    const term = normalize(search?.value.trim());
    let visibleCount = 0;
    grid.replaceChildren();
    printers.forEach(printer => {
      const available = isAvailable(printer.disponivel);
      const searchable = normalize([printer.modelo, printer.patrimonio, printer.ip, printer.mac, printer.localizacao, printer.tipo].join(' '));
      const matches = searchable.includes(term) && (activeFilter === 'all' || (activeFilter === 'available' && available) || (activeFilter === 'unavailable' && !available));
      if (!matches) return;
      visibleCount++;

      const card = document.createElement('article');
      card.className = 'impressora-card';
      card.dataset.available = String(available);
      card.dataset.id = printer.id;
      const heading = document.createElement('div');
      heading.className = 'printer-card-heading';
      const title = document.createElement('h3');
      title.textContent = printer.modelo;
      const actions = document.createElement('div');
      actions.className = 'printer-card-actions';
      const edit = document.createElement('button');
      edit.type = 'button';
      edit.className = 'printer-card-edit';
      edit.innerHTML = '<i class="bx bx-edit-alt" aria-hidden="true"></i><span>Editar</span>';
      edit.setAttribute('aria-label', `Editar ${printer.modelo}`);
      edit.addEventListener('click', () => openForm(printer));
      const remove = document.createElement('button');
      remove.type = 'button';
      remove.className = 'printer-card-delete';
      remove.innerHTML = '<i class="bx bx-trash" aria-hidden="true"></i>';
      remove.setAttribute('aria-label', `Excluir ${printer.modelo}`);
      remove.addEventListener('click', () => deletePrinter(printer));
      actions.append(edit, remove);
      heading.append(title, actions);

      const status = document.createElement('div');
      status.className = `status ${available ? 'disponivel' : 'indisponivel'}`;
      const statusIcon = document.createElement('i');
      statusIcon.className = `bx ${available ? 'bx-check-circle' : 'bx-x-circle'}`;
      statusIcon.setAttribute('aria-hidden', 'true');
      status.append(statusIcon, document.createTextNode(available ? ' Disponível' : ' Indisponível'));
      card.append(heading, field('Patrimônio', printer.patrimonio), field('IP', printer.ip), field('MAC', printer.mac), field('Localização', printer.localizacao), field('Tipo', printer.tipo), status);

      const copy = document.createElement('button');
      copy.type = 'button';
      copy.className = 'copy-ip';
      copy.innerHTML = '<i class="bx bx-copy" aria-hidden="true"></i> Copiar IP';
      copy.addEventListener('click', async () => {
        try {
          await navigator.clipboard.writeText(printer.ip);
        } catch {
          const helper = document.createElement('textarea');
          helper.value = printer.ip;
          helper.style.position = 'fixed';
          helper.style.opacity = '0';
          document.body.append(helper);
          helper.select();
          document.execCommand('copy');
          helper.remove();
        }
        notify(`IP ${printer.ip} copiado`);
      });
      const suppliesButton = document.createElement('button');
      suppliesButton.type = 'button';
      suppliesButton.className = 'printer-supplies-check';
      suppliesButton.innerHTML = '<i class="bx bx-droplet" aria-hidden="true"></i> Consultar nível de tinta';
      suppliesButton.setAttribute('aria-label', `Consultar nível de tinta e toner de ${printer.modelo}`);
      const suppliesPanel = document.createElement('section');
      suppliesPanel.className = 'printer-supplies-panel';
      suppliesPanel.hidden = true;
      suppliesPanel.setAttribute('aria-live', 'polite');
      suppliesPanel.setAttribute('aria-label', `Níveis de suprimentos de ${printer.modelo}`);
      suppliesButton.addEventListener('click', async () => {
        suppliesButton.disabled = true;
        suppliesPanel.hidden = false;
        suppliesPanel.replaceChildren();
        const loading = document.createElement('p');
        loading.className = 'printer-supplies-message';
        loading.textContent = 'Consultando suprimentos pelo IP...';
        suppliesPanel.append(loading);
        try {
          const result = await request(`${endpoint}?action=supplies&id=${encodeURIComponent(printer.id)}`);
          suppliesPanel.replaceChildren();
          if (!Array.isArray(result.supplies) || result.supplies.length === 0) {
            const unavailable = document.createElement('p');
            unavailable.className = 'printer-supplies-message';
            unavailable.textContent = 'A impressora não informou níveis de tinta ou toner.';
            suppliesPanel.append(unavailable);
            return;
          }
          result.supplies.forEach(supply => {
            const item = document.createElement('div');
            item.className = 'printer-supply';
            const heading = document.createElement('div');
            heading.className = 'printer-supply-heading';
            const name = document.createElement('strong');
            name.textContent = supply.description || 'Suprimento';
            const level = document.createElement('span');
            if (Number.isInteger(supply.percentage)) {
              level.textContent = `aprox. ${supply.percentage}%`;
              level.className = `printer-supply-level ${supply.percentage <= 15 ? 'is-critical' : supply.percentage <= 30 ? 'is-low' : ''}`;
            } else {
              level.textContent = 'Nível indisponível';
              level.className = 'printer-supply-level is-unknown';
            }
            heading.append(name, level);
            item.append(heading);
            if (Number.isInteger(supply.percentage)) {
              const progress = document.createElement('progress');
              progress.className = `printer-supply-progress ${supply.percentage <= 15 ? 'is-critical' : supply.percentage <= 30 ? 'is-low' : ''}`;
              progress.max = 100;
              progress.value = supply.percentage;
              progress.setAttribute('aria-label', `${supply.description}: aproximadamente ${supply.percentage}%`);
              item.append(progress);
            }
            suppliesPanel.append(item);
          });
          const checkedAt = new Date(result.checked_at);
          const timestamp = document.createElement('p');
          timestamp.className = 'printer-supplies-updated';
          timestamp.textContent = Number.isNaN(checkedAt.getTime())
            ? 'Leitura concluída agora.'
            : `Consultado em ${checkedAt.toLocaleString('pt-BR')}`;
          suppliesPanel.append(timestamp);
        } catch (error) {
          suppliesPanel.replaceChildren();
          const failure = document.createElement('p');
          failure.className = 'printer-supplies-message is-error';
          failure.textContent = error.message || 'Não foi possível consultar os suprimentos.';
          suppliesPanel.append(failure);
        } finally {
          suppliesButton.disabled = false;
        }
      });
      card.append(copy, suppliesButton, suppliesPanel);
      grid.append(card);
    });
    empty.hidden = visibleCount > 0;
    updateSummary();
  }

  async function loadPrinters() {
    grid.innerHTML = '<p class="printer-loading" role="status">Carregando impressoras...</p>';
    try {
      printers = await request();
      render();
    } catch (error) {
      printers = [];
      updateSummary();
      grid.replaceChildren();
      empty.textContent = error.message;
      empty.hidden = false;
    }
  }

  function openForm(printer = null) {
    form.reset();
    form.elements.id.value = printer?.id ?? '';
    form.elements.patrimonio.value = printer?.patrimonio ?? '';
    form.elements.modelo.value = printer?.modelo ?? '';
    form.elements.ip.value = printer?.ip ?? '';
    form.elements.mac.value = printer?.mac ?? '';
    form.elements.localizacao.value = printer?.localizacao ?? '';
    form.elements.tipo.value = printer?.tipo ?? '';
    form.elements.disponivel.checked = printer ? isAvailable(printer.disponivel) : true;
    document.getElementById('printer-dialog-title').textContent = printer ? 'Editar impressora' : 'Nova impressora';
    form.querySelector('.printer-save').textContent = printer ? 'Salvar alterações' : 'Salvar impressora';
    const message = form.querySelector('.printer-form-message');
    message.hidden = true;
    message.textContent = '';
    dialog.showModal();
    form.elements.patrimonio.focus();
  }

  async function deletePrinter(printer) {
    if (!window.confirm(`Excluir a impressora ${printer.modelo}?`)) return;
    try {
      await request(`${endpoint}?id=${encodeURIComponent(printer.id)}`, { method: 'DELETE' });
      notify('Impressora excluída.');
      await loadPrinters();
    } catch (error) { notify(error.message); }
  }

  document.getElementById('new-printer').addEventListener('click', () => openForm());
  document.querySelector('.printer-dialog-close').addEventListener('click', () => dialog.close());
  document.querySelector('.printer-cancel').addEventListener('click', () => dialog.close());
  dialog.addEventListener('click', event => {
    if (event.target === dialog) dialog.close();
  });
  search.addEventListener('input', render);
  filterButtons.forEach(button => button.addEventListener('click', () => {
    activeFilter = button.dataset.printerFilter;
    filterButtons.forEach(item => {
      const selected = item === button;
      item.classList.toggle('is-active', selected);
      item.setAttribute('aria-pressed', String(selected));
    });
    render();
  }));

  form.addEventListener('submit', async event => {
    event.preventDefault();
    const save = form.querySelector('.printer-save');
    const message = form.querySelector('.printer-form-message');
    const id = form.elements.id.value;
    const payload = Object.fromEntries(new FormData(form).entries());
    payload.disponivel = form.elements.disponivel.checked;
    delete payload.id;
    save.disabled = true;
    message.hidden = true;
    try {
      await request(id ? `${endpoint}?id=${encodeURIComponent(id)}` : endpoint, {
        method: id ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      dialog.close();
      notify(id ? 'Impressora atualizada.' : 'Impressora cadastrada.');
      await loadPrinters();
    } catch (error) {
      message.textContent = error.message;
      message.hidden = false;
    } finally { save.disabled = false; }
  });

  document.getElementById('export-printers').addEventListener('click', () => {
    AuxiFunc.downloadCSV('impressoras.csv',
      ['Patrimônio', 'Modelo', 'IP', 'MAC', 'Localização', 'Tipo', 'Disponibilidade'],
      printers.map(printer => [printer.patrimonio, printer.modelo, printer.ip, printer.mac,
        printer.localizacao, printer.tipo, isAvailable(printer.disponivel) ? 'Disponível' : 'Indisponível'])
    );
  });

  loadPrinters();
});
