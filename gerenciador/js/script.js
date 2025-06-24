function enviarDados(event) {
    event.preventDefault(); // Impede o recarregamento do formulário

    const dados = {
        usuario: document.getElementById('usuario').value,
        senha: document.getElementById('senha').value
    };

    fetch(`${AuxiFunc.address}processa.php`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(dados)
    })
    .then(response => {
        if (!response.ok) {
            throw new Error('Erro na resposta do servidor.');
        }
        return response.json();
    })
    .then(data => {
        alert(data.mensagem);
        if (data.sucesso) {
            window.location.href = "index.html"; // Redireciona para a página inicial
        }
    })
    .catch(error => {
        alert('Erro ao processar login. Tente novamente.');
        console.error('Erro:', error);
    });
}

// Adiciona o evento ao formulário
document.getElementById('loginForm').addEventListener('submit', enviarDados);