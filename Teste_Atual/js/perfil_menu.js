
function toggleMenu() {
    const menu = document.getElementById('menu-perfil');
    menu.style.display = menu.style.display === 'block' ? 'none' : 'block';
}

// Fecha o menu ao clicar fora
document.addEventListener('click', function(event) {
    const menu = document.getElementById('menu-perfil');
    const perfil = document.querySelector('.foto-perfil');
    if (menu && !perfil.contains(event.target)) {
        menu.style.display = 'none';
    }
});