document.addEventListener('DOMContentLoaded', () => {
  const endpoint = '../php/componentes_api.php';
  const rowsElement = document.getElementById('materials-rows');
  const form = document.getElementById('materials-form');
  const dialog = document.getElementById('materials-dialog');
  const search = document.getElementById('materials-search');
  const filter = document.getElementById('materials-filter');
  const resultCount = document.getElementById('materials-result-count');
  const exportButton = document.getElementById('export-materials');
  if (!rowsElement || !form || !dialog || !search || !filter || !resultCount || !exportButton) return;

  const normalize = value => String(value ?? '').normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '').trim().toLocaleLowerCase('pt-BR');
  const isInk = item => item.category === 'Tinta' || item.category === 'Toner';
  const isLow = item => Number(item.quantity) <= Number(item.minimum_quantity);
  let materials = [];

  async function request(url = endpoint, options = {}) {
    const response = await fetch(url, options);
    const text = await response.text();
    let result;
    try { result = JSON.parse(text); }
    catch { throw new Error('O servidor não retornou uma resposta válida. Verifique se o PHP está iniciado.'); }
    if (!response.ok) throw new Error(result.message || 'Não foi possível concluir a operação.');
    return result;
  }

  function getFiltered() {
    const term = normalize(search.value);
    const selected = filter.value;
    return materials.filter(item => {
      const matchesTerm = normalize([
        item.category, item.name, item.color, item.compatibility, item.location
      ].join(' ')).includes(term);
      const matchesFilter = selected === 'all'
        || (selected === 'component' && !isInk(item))
        || (selected === 'ink' && isInk(item))
        || (selected === 'low' && isLow(item));
      return matchesTerm && matchesFilter;
    });
  }

  function updateSummary() {
    document.getElementById('materials-total').textContent = String(materials.length);
    document.getElementById('materials-ink-total').textContent = String(materials.filter(isInk).length);
    document.getElementById('materials-low-total').textContent = String(materials.filter(isLow).length);
  }

  function render() {
    const filtered = getFiltered();
    rowsElement.replaceChildren();
    if (!filtered.length) {
      const row = rowsElement.insertRow();
      const cell = row.insertCell();
      cell.colSpan = 8;
      cell.textContent = materials.length ? 'Nenhum material corresponde aos filtros.' : 'Nenhum material cadastrado.';
    } else {
      filtered.forEach(item => {
        const row = rowsElement.insertRow();
        const status = isLow(item) ? (Number(item.quantity) === 0 ? 'Esgotado' : 'Estoque baixo') : 'Disponível';
        [
          item.category,
          item.name,
          item.color || '—',
          item.compatibility || '—',
          `${item.quantity} un. (mín. ${item.minimum_quantity})`,
          item.location || '—',
          status
        ].forEach((value, index) => {
          const cell = row.insertCell();
          if (index === 6) {
            const badge = document.createElement('span');
            badge.className = `materials-stock-status ${isLow(item) ? 'is-low' : 'is-ok'}`;
            badge.textContent = value;
            cell.append(badge);
          } else {
            cell.textContent = String(value);
          }
        });
        const actions = row.insertCell();
        actions.className = 'materials-row-actions';
        const edit = document.createElement('button');
        edit.type = 'button';
        edit.className = 'materials-edit';
        edit.title = `Editar ${item.name}`;
        edit.setAttribute('aria-label', `Editar ${item.name}`);
        edit.innerHTML = '<i class="bx bx-edit-alt" aria-hidden="true"></i>';
        edit.addEventListener('click', () => openForm(item));
        const remove = document.createElement('button');
        remove.type = 'button';
        remove.className = 'materials-delete';
        remove.title = `Excluir ${item.name}`;
        remove.setAttribute('aria-label', `Excluir ${item.name}`);
        remove.innerHTML = '<i class="bx bx-trash" aria-hidden="true"></i>';
        remove.addEventListener('click', () => deleteMaterial(item));
        actions.append(edit, remove);
      });
    }
    resultCount.textContent = `${filtered.length} de ${materials.length} item${materials.length === 1 ? '' : 's'}`;
    exportButton.disabled = filtered.length === 0;
  }

  async function loadMaterials() {
    rowsElement.innerHTML = '<tr><td colspan="8">Carregando materiais...</td></tr>';
    try {
      const result = await request();
      if (!Array.isArray(result)) throw new Error('O servidor retornou uma lista de materiais inválida.');
      materials = result;
      updateSummary();
      render();
    } catch (error) {
      materials = [];
      updateSummary();
      rowsElement.replaceChildren();
      const row = rowsElement.insertRow();
      const cell = row.insertCell();
      cell.colSpan = 8;
      cell.textContent = error.message || 'Não foi possível carregar os materiais.';
      cell.setAttribute('role', 'alert');
      resultCount.textContent = 'Falha ao carregar';
      exportButton.disabled = true;
    }
  }

  function openForm(item = null) {
    form.reset();
    form.elements.id.value = item?.id ?? '';
    form.elements.category.value = item?.category ?? '';
    form.elements.name.value = item?.name ?? '';
    form.elements.color.value = item?.color ?? '';
    form.elements.compatibility.value = item?.compatibility ?? '';
    form.elements.quantity.value = item?.quantity ?? 0;
    form.elements.minimum_quantity.value = item?.minimum_quantity ?? 1;
    form.elements.location.value = item?.location ?? '';
    const editing = Boolean(item);
    document.getElementById('materials-dialog-title').textContent = editing ? 'Editar material' : 'Adicionar material';
    form.querySelector('.materials-save').textContent = editing ? 'Salvar alterações' : 'Salvar material';
    const message = form.querySelector('.materials-form-message');
    message.hidden = true;
    message.textContent = '';
    updateInkFields();
    dialog.showModal();
    form.elements.category.focus();
  }

  function updateInkFields() {
    const ink = ['Tinta', 'Toner'].includes(form.elements.category.value);
    form.querySelectorAll('.ink-field').forEach(field => {
      field.hidden = !ink;
      field.querySelectorAll('input, select').forEach(control => {
        control.disabled = !ink;
        if (!ink) control.value = '';
      });
    });
  }

  async function deleteMaterial(item) {
    if (!window.confirm(`Excluir ${item.name} (${item.category})?`)) return;
    try {
      await request(`${endpoint}?id=${encodeURIComponent(item.id)}`, { method: 'DELETE' });
      await loadMaterials();
    } catch (error) {
      window.alert(error.message);
    }
  }

  document.getElementById('new-material').addEventListener('click', () => openForm());
  document.querySelector('.materials-dialog-close').addEventListener('click', () => dialog.close());
  document.querySelector('.materials-cancel').addEventListener('click', () => dialog.close());
  dialog.addEventListener('click', event => { if (event.target === dialog) dialog.close(); });
  form.elements.category.addEventListener('change', updateInkFields);
  search.addEventListener('input', render);
  filter.addEventListener('change', render);

  form.addEventListener('submit', async event => {
    event.preventDefault();
    const save = form.querySelector('.materials-save');
    const message = form.querySelector('.materials-form-message');
    const id = form.elements.id.value;
    const payload = Object.fromEntries(new FormData(form).entries());
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
      await loadMaterials();
    } catch (error) {
      message.textContent = error.message;
      message.hidden = false;
    } finally {
      save.disabled = false;
    }
  });

  exportButton.addEventListener('click', () => {
    const filtered = getFiltered();
    if (!filtered.length) return;
    AuxiFunc.downloadCSV('componentes-e-suprimentos.csv',
      ['Categoria', 'Nome / modelo', 'Cor', 'Compatível com', 'Quantidade', 'Estoque mínimo', 'Localização', 'Situação'],
      filtered.map(item => [
        item.category, item.name, item.color, item.compatibility, item.quantity,
        item.minimum_quantity, item.location,
        isLow(item) ? (Number(item.quantity) === 0 ? 'Esgotado' : 'Estoque baixo') : 'Disponível'
      ])
    );
  });

  loadMaterials();
});
