
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
})
// Fecha o menu ao clicar fora
document.addEventListener('click', function(event) {
    const menu = document.getElementById('menu-perfil');
    const perfil = document.querySelector('.foto-perfil');
    if (menu && !perfil.contains(event.target)) {
        menu.style.display = 'none';
    }
});

document.addEventListener("DOMContentLoaded", function(){
    let perfilFoto = document.getElementById("pf-foto");
    perfilFoto.src = sessionStorage.getItem("pathPf");
});

let button = document.getElementById("salvar-foto-perfil");
let inputFile = document.getElementById("foto-perfil-input");

if(button){
    button.addEventListener("click", async function(){
        const formData = new FormData();

        if(inputFile.files.length > 0){
            formData.append("photo", inputFile.files[0]);
            formData.append("id", sessionStorage.getItem("id"));

            await AuxiFunc.upPhoto(formData);
            sessionStorage.setItem("pathPf", await AuxiFunc.getPhoto(sessionStorage.getItem("id")));
            window.location.reload();
        }
    });
}



