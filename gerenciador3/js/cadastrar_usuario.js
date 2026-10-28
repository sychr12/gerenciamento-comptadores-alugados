const registrationForm = document.getElementById('formCadastroUsuario');
const roleSelect = document.getElementById('status');
if (roleSelect && Number(sessionStorage.getItem('nivel')) < 3) {
    const managerOption = roleSelect.querySelector('option[value="Gestor"]');
    if (managerOption) managerOption.disabled = true;
}

registrationForm?.addEventListener('submit', async event => {
    event.preventDefault();
    if (!registrationForm.reportValidity()) return;

    const submitButton = registrationForm.querySelector('button[type="submit"]');
    const originalLabel = submitButton.textContent;
    const role = document.getElementById('status').value;
    const levels = {
        Estagiario: 1,
        'Jovem Aprendiz': 1,
        Assessor: 2,
        Supervisor: 2,
        Gestor: 3
    };
    const formData = {
        nome: document.getElementById('nome').value.trim(),
        cargo: role,
        nivel: levels[role],
        categoria: document.getElementById('categoria').value.trim(),
        senha: document.getElementById('senha').value,
        reset: AuxiFunc.checkReset(document.querySelector('.check_reset').checked)
    };

    submitButton.disabled = true;
    submitButton.textContent = 'Cadastrando…';
    try {
        const data = await AuxiFunc.requestJSON(`${AuxiFunc.address}cadastrar_usuario.php`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(formData)
        });
        if (!data.success) throw new Error(data.message || 'Não foi possível cadastrar o usuário.');
        alert(data.message || 'Usuário cadastrado com sucesso!');
        registrationForm.reset();
        document.getElementById('nome').focus();
    } catch (error) {
        alert(error.message || 'Não foi possível concluir o cadastro.');
    } finally {
        submitButton.disabled = false;
        submitButton.textContent = originalLabel;
    }
});
