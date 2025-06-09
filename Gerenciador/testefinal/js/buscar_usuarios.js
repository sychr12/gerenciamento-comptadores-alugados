
document.addEventListener("DOMContentLoaded", function () {
    fetch('http://192.168.1.6/php/buscar_usuarios.php')
        .then(response => response.json())
        .then(dados => {
            const container = document.querySelector(".grid_conteiner");

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
            });
        })
        .catch(error => console.error("Erro ao carregar usuários:", error));
});
