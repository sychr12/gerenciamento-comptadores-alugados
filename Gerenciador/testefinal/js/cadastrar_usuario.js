document.getElementById('formCadastroUsuario').addEventListener('submit', function(e) {
    e.preventDefault();
    
    let status;
    let statusValue = document.getElementById("status");

    if(statusValue.value === "Estagiario" || statusValue.value === "Jovem Aprendiz"){
        status = 1;
    }else if(statusValue.value === "Acessor" || statusValue.value === "Supervisor"){
        status = 2;
    }else if(statusValue.value === "Gestor"){
        status = 3;
    }
    const formData = {
        nome: document.getElementById('nome').value,
        cargo: document.getElementById('status').value,
        nivel: status,
        categoria: document.getElementById('categoria').value,
        senha: document.getElementById('senha').value
    }
    console.log(formData.nome);
    console.log(formData.cargo);
    console.log(formData.nivel);
    console.log(formData.categoria);
    console.log(formData.senha);
    
    fetch('http://192.168.1.6/php/cadastrar_usuario.php', {
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