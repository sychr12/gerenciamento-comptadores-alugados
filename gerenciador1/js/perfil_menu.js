document.addEventListener("DOMContentLoaded", function(){
    let pnome = document.querySelector(".nome-user");
    pnome.innerHTML = `Usuário atual: ${sessionStorage.getItem("nome")}`;

    let fotoPerfil = document.querySelector(".icone-foto");
    fotoPerfil.src = sessionStorage.getItem("image");
})
function toggleMenu() {
    const menu = document.getElementById('menu-perfil');
    menu.style.display = menu.style.display === 'block' ? 'none' : 'block';
}
let link = document.querySelector(".menu-registro");
link.addEventListener("click", function(){
    if(Number(sessionStorage.getItem("nivel")) < 2){
        alert("Você não tem permissão para isso")
    }else{
        window.location.href = "cadastrar_ususario.html";
    }
})
let altFoto = document.querySelector(".alt-foto");
altFoto.addEventListener("click", function(){
    let menuFoto = document.querySelector(".alt-foto-box");
    menuFoto.style.display = "flex";
    let buttonEnv = document.querySelector(".btn-env-imagem");
    buttonEnv.addEventListener("click", async function(){
        let arquivo = document.querySelector(".input-img").files[0];
        let resultado = await AuxiFunc.uploadImg(arquivo, Number(sessionStorage.getItem("id")));
        if(resultado.status){
            menuFoto.style.display = "none";
            location.reload();
        }else{
            console.log(`Mensagem de erro: ${resultado.message}`)
            alert("Ocorreu algum erro");
        }
    })

})
// Fecha o menu ao clicar fora
document.addEventListener('click', function(event) {
    const menu = document.getElementById('menu-perfil');
    const perfil = document.querySelector('.foto-perfil');
    if (menu && !perfil.contains(event.target)) {
        menu.style.display = 'none';
    }
});