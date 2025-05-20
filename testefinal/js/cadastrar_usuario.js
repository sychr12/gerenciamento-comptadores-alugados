document.getElementById('formCadastroUsuario').addEventListener('submit', function(e) {
    e.preventDefault();
    
    const formData = {
        nome: document.getElementById('nome').value,
        status: document.getElementById('status').value,
        Categoria: document.getElementById('Categoria').value,
        senha: document.getElementById('senha').value
    };
    
    fetch('/testefinal/php/cadastrar_usuario.php', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData)
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            alert('Usuário cadastrado com sucesso!');
            document.getElementById('formCadastroUsuario').reset();
        } else {
            alert('Erro: ' + data.message);
        }
    })
    .catch(error => {
        console.error('Error:', error);
        alert('Ocorreu um erro ao processar a requisição');
    });
});