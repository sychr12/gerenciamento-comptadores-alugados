const form = document.querySelector('#loginForm');
const passwordInput = document.querySelector('#senha');
const passwordToggle = document.querySelector('#toggle-password');
const message = document.querySelector('#login-message');
const submitButton = document.querySelector('#btnEnviar');
const resetForm = document.querySelector('#resetForm');
const resetBox = document.querySelector('.reset-box');
const resetMessage = document.querySelector('#reset-message');
const resetButton = document.querySelector('.reset-login');

function setMessage(element, text) {
  element.textContent = text;
  element.hidden = !text;
}

passwordToggle?.addEventListener('click', () => {
  const visible = passwordInput.type === 'password';
  passwordInput.type = visible ? 'text' : 'password';
  passwordToggle.setAttribute('aria-pressed', String(visible));
  passwordToggle.setAttribute('aria-label', visible ? 'Ocultar senha' : 'Mostrar senha');
  passwordToggle.innerHTML = `<i class="bx ${visible ? 'bx-hide' : 'bx-show'}" aria-hidden="true"></i>`;
});

form?.addEventListener('submit', async event => {
  event.preventDefault();
  setMessage(message, '');
  submitButton.disabled = true;
  submitButton.querySelector('span').textContent = 'Verificando acesso…';

  try {
    const username = document.querySelector('#usuario').value.trim();
    const login = await AuxiFunc.validateUser(username, passwordInput.value);

    if (!login || login.getNivel === 0) {
      setMessage(message, 'Usuário ou senha incorretos. Confira os dados e tente novamente.');
      passwordInput.focus();
      return;
    }

    sessionStorage.setItem('nome', login.getNome || username);
    sessionStorage.setItem('id', String(login.getId));
    sessionStorage.setItem('nivel', String(login.getNivel));

    if (login.getReset) {
      document.body.classList.add('login-reset-mode');
      resetBox.hidden = false;
      document.querySelector('#new-password').focus();
      return;
    }

    window.location.href = 'inicio.html';
  } catch (error) {
    console.error('Falha no login:', error);
    setMessage(message, error.message || 'Não foi possível conectar ao servidor. Tente novamente.');
  } finally {
    submitButton.disabled = false;
    submitButton.querySelector('span').textContent = 'Entrar no sistema';
  }
});

resetForm?.addEventListener('submit', async event => {
  event.preventDefault();
  setMessage(resetMessage, '');
  const password1 = document.querySelector('.rest_senha').value;
  const password2 = document.querySelector('.reset_conf').value;
  if (password1.length < 8 || password1.length > 128 || password1 !== password2) {
    setMessage(resetMessage, 'Use uma senha de 8 a 128 caracteres e confirme-a corretamente.');
    return;
  }

  resetButton.disabled = true;
  resetButton.querySelector('span').textContent = 'Salvando…';
  try {
    const updated = await AuxiFunc.changePass(sessionStorage.getItem('id'), password1);
    if (!updated) throw new Error('Não foi possível salvar sua senha. Tente novamente.');
    window.location.href = 'inicio.html';
  } catch (error) {
    setMessage(resetMessage, error.message || 'Não foi possível alterar a senha. Tente novamente.');
  } finally {
    resetButton.disabled = false;
    resetButton.querySelector('span').textContent = 'Salvar nova senha';
  }
});
