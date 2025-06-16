document.addEventListener("DOMContentLoaded", function () {
    const container = document.querySelector(".grid_container");
    const btnCancelar = document.querySelector("#cancelar");
    const btnSalvar = document.querySelector("#salvar");
    const settingsContainer = document.querySelector(".settings-container");

    if (!container) {
        console.error("Elemento '.grid_container' não encontrado.");
        return;
    }

    fetch('http://10.46.11.26/php/buscar_usuarios.php')
        .then(response => response.json())
        .then(dados => {
            dados.forEach(usuario => {
                const row = document.createElement("div");
                row.className = "row_grid";

                row.innerHTML = `
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
                    document.querySelector("#user-id").value = usuario.id;
                    document.querySelector("#name").value = usuario.nome;
                    document.querySelector("#cargo-select").value = usuario.cargo;
                    document.querySelector("#nivel").value = usuario.nivel;
                    document.querySelector("#categoria").value = usuario.categoria;
                    document.querySelector("#profile-nome").innerText = usuario.nome;

                    if (settingsContainer) {
                        settingsContainer.style.display = "flex";
                    }
                });

                // Botão Excluir
                row.querySelector(".btn-excluir").addEventListener("click", () => {
                    if (confirm(`Deseja realmente excluir o usuário ${usuario.nome}?`)) {
                        fetch(`http://10.46.11.26/php/editarExcluir.php`, {
                            method: "DELETE",
                            headers: {
                                "Content-Type": "application/x-www-form-urlencoded"
                            },
                            body: `id=${usuario.id}`
                        })
                        .then(response => response.json())
                        .then(result => {
                            alert(result.message);
                            location.reload();
                        })
                        .catch(error => console.error("Erro ao excluir usuário:", error));
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
            const id = document.querySelector("#user-id").value;
            const nome = document.querySelector("#name").value;
            const cargo = document.querySelector("#cargo-select").value;
            const nivel = document.querySelector("#nivel").value;
            const categoria = document.querySelector("#categoria").value;

            fetch("http://10.46.11.26/php/editarExcluir.php", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({ id, nome, cargo, nivel, categoria })
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
