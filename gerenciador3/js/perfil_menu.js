document.addEventListener('DOMContentLoaded', () => {
  const menu = document.getElementById('menu-perfil');
  const profile = document.querySelector('.foto-perfil');
  const photoBox = document.querySelector('.alt-foto-box');
  let photoScrim = document.querySelector('.photo-scrim');
  if (photoBox && !photoScrim) {
    photoScrim = document.createElement('button');
    photoScrim.type = 'button';
    photoScrim.className = 'photo-scrim';
    photoScrim.setAttribute('aria-label', 'Fechar janela de foto');
    photoScrim.hidden = true;
    photoBox.before(photoScrim);
  }
  const fileInput = photoBox?.querySelector('input[type="file"]');
  const savePhoto = photoBox?.querySelector('.btn-env-imagem');
  let previewUrl = null;
  let photoPreview = null;
  const userName = sessionStorage.getItem('nome');
  profile?.setAttribute('role', 'button');
  profile?.setAttribute('aria-expanded', 'false');
  profile?.setAttribute('aria-haspopup', 'menu');
  menu?.setAttribute('role', 'menu');
  menu?.querySelectorAll('a').forEach(link => link.setAttribute('role', 'menuitem'));
  // Menu actions must not bubble to .foto-perfil's inline toggle handler.
  menu?.addEventListener('click', event => event.stopPropagation());

  document.querySelectorAll('.nome-user').forEach(node => {
    node.textContent = userName ? `Olá, ${userName}` : 'Minha conta';
  });

  document.querySelectorAll('nav.submenu a').forEach(link => {
    const icon = link.querySelector('i');
    const iconClass = icon?.className || '';
    const label = iconClass.includes('printer') ? 'Impressoras'
      : iconClass.includes('desktop') ? 'Novo computador'
      : iconClass.includes('plus-circle') ? 'Novo computador'
      : iconClass.includes('home') ? 'Painel inicial' : 'Computadores';
    if (!link.hasAttribute('aria-label')) link.setAttribute('aria-label', label);
    link.title = label;
    if (new URL(link.href, window.location.href).pathname === window.location.pathname) {
      link.setAttribute('aria-current', 'page');
    }
  });

  const storedPhoto = localStorage.getItem('fotoPerfil');
  if (storedPhoto) document.querySelectorAll('.foto-perfil > img').forEach(img => { img.src = storedPhoto; });

  window.toggleMenu = () => {
    if (!menu) return;
    const isOpen = menu.classList.toggle('is-open');
    menu.style.display = isOpen ? 'block' : 'none';
    profile?.setAttribute('aria-expanded', String(isOpen));
  };
  profile?.addEventListener('keydown', event => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      window.toggleMenu();
    }
  });

  const closePhotoDialog = () => {
    photoBox?.classList.remove('is-open');
    if (photoBox) photoBox.style.display = 'none';
    if (photoScrim) photoScrim.hidden = true;
  };

  document.querySelector('.menu-registro')?.addEventListener('click', event => {
    event.preventDefault();
    if (Number(sessionStorage.getItem('nivel')) < 2) {
      alert('Você não tem permissão para cadastrar usuários.');
      return;
    }
    window.location.href = 'cadastrar_ususario.html';
  });

  document.querySelector('.alt-foto')?.addEventListener('click', event => {
    event.preventDefault();
    if (!photoBox) return;
    menu?.classList.remove('is-open');
    if (menu) menu.style.display = 'none';
    photoBox.classList.add('is-open');
    photoBox.style.display = 'flex';
    if (photoScrim) photoScrim.hidden = false;
    fileInput?.focus();
  });

  if (photoBox) {
    photoBox.setAttribute('role', 'dialog');
    photoBox.setAttribute('aria-modal', 'true');
    photoBox.setAttribute('aria-label', 'Alterar foto de perfil');
    if (!photoBox.querySelector('h3')) {
      const heading = document.createElement('h3');
      heading.textContent = 'Sua foto de perfil';
      photoBox.prepend(heading);
    }
    if (!photoBox.querySelector('.photo-help')) {
      const help = document.createElement('p');
      help.className = 'photo-help';
      help.textContent = 'Escolha uma imagem quadrada de até 2 MB.';
      photoBox.querySelector('h3').after(help);
    }
    photoPreview = photoBox.querySelector('.profile-photo-preview');
    if (!photoPreview) {
      photoPreview = document.createElement('img');
      photoPreview.className = 'profile-photo-preview';
      photoPreview.alt = 'Prévia da nova foto de perfil';
      photoPreview.hidden = true;
      photoBox.querySelector('.photo-help').after(photoPreview);
    }
    fileInput?.addEventListener('change', () => {
      const file = fileInput.files?.[0];
      if (previewUrl) URL.revokeObjectURL(previewUrl);
      previewUrl = null;
      if (!file || !file.type.startsWith('image/')) {
        photoPreview.hidden = true;
        return;
      }
      previewUrl = URL.createObjectURL(file);
      photoPreview.src = previewUrl;
      photoPreview.hidden = false;
    });
    if (!photoBox.querySelector('.btn-cancelar-foto')) {
      const cancel = document.createElement('button');
      cancel.type = 'button';
      cancel.className = 'btn-cancelar-foto';
      cancel.textContent = 'Cancelar';
      photoBox.append(cancel);
      cancel.addEventListener('click', () => {
        closePhotoDialog();
        if (fileInput) fileInput.value = '';
        if (previewUrl) URL.revokeObjectURL(previewUrl);
        previewUrl = null;
        if (photoPreview) photoPreview.hidden = true;
      });
    }
  }

  savePhoto?.addEventListener('click', () => {
    const file = fileInput?.files?.[0];
    if (!file) {
      alert('Escolha uma imagem antes de salvar.');
      return;
    }
    if (!file.type.startsWith('image/')) {
      alert('Selecione um arquivo de imagem válido.');
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      alert('A imagem precisa ter até 2 MB.');
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = String(reader.result);
      localStorage.setItem('fotoPerfil', dataUrl);
      document.querySelectorAll('.foto-perfil > img').forEach(img => { img.src = dataUrl; });
      closePhotoDialog();
      if (previewUrl) URL.revokeObjectURL(previewUrl);
      previewUrl = null;
      if (photoPreview) photoPreview.hidden = true;
    };
    reader.onerror = () => alert('Não foi possível abrir essa imagem.');
    reader.readAsDataURL(file);
  });

  document.querySelectorAll('a[href$="index.html"]').forEach(link => {
    if (!link.closest('.menu-perfil')) return;
    link.addEventListener('click', async event => {
      event.preventDefault();
      try {
        const response = await fetch('../php/logout_api.php', { method: 'POST' });
        if (!response.ok) throw new Error('Não foi possível encerrar a sessão.');
        sessionStorage.clear();
        window.location.href = link.href;
      } catch (error) {
        alert(error.message || 'Não foi possível encerrar a sessão.');
      }
    });
  });

  document.addEventListener('click', event => {
    if (menu && profile && !profile.contains(event.target)) {
      menu.classList.remove('is-open');
      menu.style.display = 'none';
      profile.setAttribute('aria-expanded', 'false');
    }
    if (event.target === photoScrim) closePhotoDialog();
  });

  document.addEventListener('keydown', event => {
    if (event.key === 'Escape') {
      menu?.classList.remove('is-open');
      if (menu) menu.style.display = 'none';
      closePhotoDialog();
    }
  });
});
