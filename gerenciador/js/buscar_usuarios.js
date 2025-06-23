document.addEventListener("DOMContentLoaded", function () {
    const container = document.querySelector(".grid_container");
    const btnCancelar = document.querySelector("#cancelar");
    const btnSalvar = document.querySelector("#salvar");
    const settingsContainer = document.querySelector(".settings-container");

    if (!container) {
        console.error("Elemento '.grid_container' não encontrado.");
        return;
    }

    fetch(`${AuxiFunc.address}buscar_usuarios.php`)
        .then(response => response.json())
        .then(dados => {
            dados.forEach(usuario => {
                const row = document.createElement("div");
                row.className = "row_grid";

                row.innerHTML = `
                    <div class="perfil-container">
                        <img src="/gerenciador/imagens/default.png" alt="foto de perfil" class="perfil-foto"/>
                    </div>
                    <p>${usuario.id}</p>
                    <p>${usuario.nome}</p>
                    <p>${usuario.cargo}</p>
                    <p>${usuario.nivel}</p>
                    <p>${usuario.categoria}</p>
                    <p>${usuario.data_cadastro}</p>
                    <p class="p-btn">
                        <button class="btn-editar">Editar</button>
                        <button class="btn-excluir">Excluir</button>
                    </p>
                `;
                container.appendChild(row);

                // Botão Editar
                row.querySelector(".btn-editar").addEventListener("click", () => {
                    console.log(`Seu nivel é ${Number(sessionStorage.getItem("nivel"))}`);
                    if(Number(sessionStorage.getItem("nivel")) < 2){
                        alert("Você não tem permissão para isso")
                    }else{
                        document.querySelector("#user-id").value = usuario.id;
                        document.querySelector("#name").value = usuario.nome;
                        document.querySelector("#cargo-select").value = usuario.cargo;
                        document.querySelector("#categoria").value = usuario.categoria;
                        document.querySelector("#profile-nome").innerText = usuario.nome;

                        if (settingsContainer) {
                            settingsContainer.style.display = "flex";
                        }
                    }
                });

                // Botão Excluir
                row.querySelector(".btn-excluir").addEventListener("click", () => {
                    if(Number(sessionStorage.getItem("nivel")) < 2){
                        alert("Você não tem permissão para isso");
                    }else{
                        if (confirm(`Deseja realmente excluir o usuário ${usuario.nome}?`)) {
                        fetch(`${AuxiFunc.address}editarExcluir.php`, {
                            method: "DELETE",
                            headers: {
                                "Content-Type": "application/json"
                            },
                            body: JSON.stringify({id: usuario.id})
                        })
                        .then(response => response.json())
                        .then(result => {
                            alert(result.message);
                            location.reload();
                        })
                        .catch(error => console.error("Erro ao excluir usuário:", error));
                        }
                    }
                });
            });
        })
        .catch(error => console.error("Erro ao carregar usuários:", error));

    // Botão Cancelar
    if (btnCancelar) {
        btnCancelar.addEventListener("click", function () {
            if (settingsContainer) {
                settingsContainer.style.display = "none";
            }
        });
    }

    // Botão Salvar
    if (btnSalvar) {
        btnSalvar.addEventListener("click", function () {
            alert("Entrou no evendo do botão de salvar");
            let getReset = AuxiFunc.checkReset(document.querySelector("#reset").checked);
            let getNivel = AuxiFunc.checkLevel(document.querySelector("#cargo-select").value);
            let usuarioUp = {
                id: document.querySelector("#user-id").value,
                nome: document.querySelector("#name").value,
                cargo: document.querySelector("#cargo-select").value,
                categoria: document.querySelector("#categoria").value,
                nivel: getNivel,
                senha: document.querySelector("#senha").value,
                resetar: getReset
            }
            console.log(usuarioUp);

            fetch(`${AuxiFunc.address}editarExcluir.php`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify(usuarioUp)
            })
            .then(response => response.json())
            .then(result => {
                alert(result.message);
                location.reload();
            })
            .catch(error => console.error("Erro ao salvar alterações:", error));
        });
    }
});
