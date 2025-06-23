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
    let getReset = AuxiFunc.checkReset(document.querySelector(".check_reset").checked)
    console.log(`Valor do getReset: ${getReset}`);
    const formData = {
        nome: document.getElementById('nome').value,
        cargo: document.getElementById('status').value,
        nivel: status,
        categoria: document.getElementById('categoria').value,
        senha: document.getElementById('senha').value,
        reset: getReset
    }
    console.log(`Valor do reset antes de passado pro php: ${formData.reset}`);
    fetch(`${AuxiFunc.address}cadastrar_usuario.php`, {
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