document.addEventListener('DOMContentLoaded', () => {
  const container = document.querySelector('.grid_container');
  const settings = document.querySelector('.settings-container');
  const nameInput = document.querySelector('#name');
  const cargoInput = document.querySelector('#cargo-select');
  const categoryInput = document.querySelector('#categoria');
  const passwordInput = document.querySelector('#senha');
  const resetInput = document.querySelector('#reset');
  const userIdInput = document.querySelector('#user-id');
  const searchInput = document.querySelector('#user-search');
  const userCount = document.querySelector('#user-count');
  let users = [];

  if (!container) return;
  const newUserLink = document.querySelector('#new-user');
  if (newUserLink && Number(sessionStorage.getItem('nivel')) < 2) newUserLink.hidden = true;

  let settingsScrim = document.querySelector('.settings-scrim');
  if (settings && !settingsScrim) {
    settingsScrim = document.createElement('button');
    settingsScrim.type = 'button';
    settingsScrim.className = 'settings-scrim';
    settingsScrim.setAttribute('aria-label', 'Fechar edição de usuário');
    settingsScrim.hidden = true;
    settings.before(settingsScrim);
  }

  const closeSettings = () => {
    if (settings) settings.style.display = 'none';
    if (settingsScrim) settingsScrim.hidden = true;
  };
  const openSettings = user => {
    if (!settings) return;
    userIdInput.value = user.id;
    nameInput.value = user.nome || '';
    cargoInput.value = user.cargo || '';
    categoryInput.value = user.categoria || '';
    passwordInput.value = '';
    resetInput.checked = user.reset === 'sim' || user.reset === 1 || user.reset === '1';
    document.querySelector('#profile-nome').textContent = user.nome || 'Usuário';
    settings.style.display = 'flex';
    settingsScrim.hidden = false;
    nameInput.focus();
  };

  const requestJson = async (url, options = {}) => {
    const data = await AuxiFunc.requestJSON(url, options);
    if (data.success === false) throw new Error(data.message || data.error || 'Não foi possível concluir a operação.');
    return data;
  };

  const renderText = (row, text) => {
    const cell = document.createElement('p');
    cell.textContent = text || '—';
    row.append(cell);
  };

  function renderUsers() {
    container.querySelectorAll('.row_grid, .grid-empty').forEach(row => row.remove());
    const term = (searchInput?.value || '').trim().normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLocaleLowerCase('pt-BR');
    const filteredUsers = users.filter(user =>
      [user.id, user.nome, user.cargo, user.categoria].join(' ')
        .normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLocaleLowerCase('pt-BR').includes(term)
    );
    if (userCount) userCount.textContent = term
      ? `${filteredUsers.length} de ${users.length} usuários`
      : `${users.length} usuário${users.length === 1 ? '' : 's'}`;
    if (!filteredUsers.length) {
      const empty = document.createElement('p');
      empty.className = 'grid-empty';
      empty.textContent = users.length ? 'Nenhum usuário corresponde à busca.' : 'Nenhum usuário cadastrado.';
      container.append(empty);
      return;
    }

    filteredUsers.forEach(user => {
      const row = document.createElement('div');
      row.className = 'row_grid';
      row.dataset.userId = user.id;

      const photoCell = document.createElement('div');
      photoCell.className = 'perfil-container';
      const photo = document.createElement('img');
      photo.src = user.path_img || '../imagens/default.png';
      photo.alt = `Foto de ${user.nome || 'usuário'}`;
      photo.className = 'perfil-foto';
      photo.addEventListener('error', () => { photo.src = '../imagens/default.png'; }, { once: true });
      photoCell.append(photo);
      row.append(photoCell);

      [user.id, user.nome, user.cargo, user.nivel, user.categoria,
        user.data_cadastro ? new Date(user.data_cadastro).toLocaleDateString('pt-BR') : '—']
        .forEach(text => renderText(row, String(text ?? '')));

      const actions = document.createElement('div');
      actions.className = 'p-btn';
      const edit = document.createElement('button');
      edit.type = 'button';
      edit.className = 'btn-editar';
      edit.setAttribute('aria-label', `Editar ${user.nome}`);
      edit.title = 'Editar usuário';
      const editIcon = document.createElement('img');
      editIcon.src = '../imagens/ferramenta-lapis.png';
      editIcon.alt = '';
      edit.append(editIcon);
      const remove = document.createElement('button');
      remove.type = 'button';
      remove.className = 'btn-excluir';
      remove.setAttribute('aria-label', `Excluir ${user.nome}`);
      remove.title = 'Excluir usuário';
      const removeIcon = document.createElement('img');
      removeIcon.src = '../imagens/lata-de-lixo.png';
      removeIcon.alt = '';
      remove.append(removeIcon);
      actions.append(edit, remove);
      row.append(actions);
      container.append(row);

      edit.addEventListener('click', () => {
        if (Number(sessionStorage.getItem('nivel')) < 2) {
          alert('Você não tem permissão para editar usuários.');
          return;
        }
        openSettings(user);
      });
      remove.addEventListener('click', async () => {
        if (Number(sessionStorage.getItem('nivel')) < 2) {
          alert('Você não tem permissão para excluir usuários.');
          return;
        }
        if (!confirm(`Deseja realmente excluir o usuário ${user.nome}?`)) return;
        try {
          const result = await requestJson(`${AuxiFunc.address}editarExcluir.php`, {
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id: user.id })
          });
          users = users.filter(item => String(item.id) !== String(user.id));
          renderUsers();
          alert(result.message || 'Usuário excluído.');
        } catch (error) { alert(error.message); }
      });
    });
  }

  async function loadUsers() {
    container.querySelectorAll('.row_grid, .grid-empty').forEach(row => row.remove());
    const loading = document.createElement('p');
    loading.className = 'grid-empty';
    loading.textContent = 'Carregando usuários...';
    container.append(loading);
    try {
      const result = await requestJson(`${AuxiFunc.address}buscar_usuarios.php`);
      users = Array.isArray(result) ? result : [];
      renderUsers();
    } catch (error) {
      loading.textContent = error.message || 'Não foi possível carregar os usuários.';
      if (userCount) userCount.textContent = 'Falha ao carregar';
    }
  }

  document.querySelector('#cancelar')?.addEventListener('click', closeSettings);
  searchInput?.addEventListener('input', renderUsers);
  settingsScrim?.addEventListener('click', closeSettings);
  document.querySelector('#salvar')?.addEventListener('click', async () => {
    if (!nameInput.value.trim() || !cargoInput.value || !categoryInput.value.trim()) {
      alert('Preencha nome, cargo e categoria.');
      return;
    }
    const userUpdate = {
      id: userIdInput.value,
      nome: nameInput.value.trim(),
      cargo: cargoInput.value,
      categoria: categoryInput.value.trim(),
      nivel: AuxiFunc.checkLevel(cargoInput.value),
      senha: passwordInput.value,
      resetar: AuxiFunc.checkReset(resetInput.checked)
    };
    try {
      const result = await requestJson(`${AuxiFunc.address}editarExcluir.php`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(userUpdate)
      });
      alert(result.message || 'Usuário atualizado.');
      closeSettings();
      await loadUsers();
    } catch (error) { alert(error.message); }
  });
  document.querySelector('#excluir')?.addEventListener('click', async () => {
    const id = userIdInput?.value;
    const user = users.find(item => String(item.id) === String(id));
    if (!user) return alert('Selecione um usuário para excluir.');
    if (!confirm(`Deseja realmente excluir o usuário ${user.nome}?`)) return;
    try {
      const result = await requestJson(`${AuxiFunc.address}editarExcluir.php`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id })
      });
      users = users.filter(item => String(item.id) !== String(id));
      closeSettings();
      renderUsers();
      alert(result.message || 'Usuário excluído.');
    } catch (error) { alert(error.message); }
  });
  document.addEventListener('keydown', event => { if (event.key === 'Escape') closeSettings(); });

  document.getElementById('export-users')?.addEventListener('click', () => {
    AuxiFunc.downloadCSV('usuarios.csv',
      ['ID', 'Nome', 'Cargo', 'Nível', 'Categoria', 'Data de cadastro'],
      users.map(user => [user.id, user.nome, user.cargo, user.nivel, user.categoria, user.data_cadastro])
    );
  });

  loadUsers();
});
