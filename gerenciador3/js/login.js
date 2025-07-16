let button = document.querySelector("#btnEnviar");

button.addEventListener("click", async function(){
    let usuario = {
        nome: document.querySelector("#usuario").value,
        senha: document.querySelector("#senha").value
    }

    let loginInfo = await AuxiFunc.validateUser(usuario.nome, usuario.senha);

    if(loginInfo.getNivel != 0){
        if(loginInfo.getReset){
            const boxReset = document.querySelector(".reset-box");
            boxReset.style.display = "flex";

            document.querySelector(".reset-login").addEventListener("click", async function(){
                let senhaInfo = {
                novSenha: document.querySelector(".rest_senha").value,
                confSenha: document.querySelector(".reset_conf").value
                }
                if(senhaInfo.novSenha === senhaInfo.confSenha){
                    if(await AuxiFunc.changePass(loginInfo.getId, senhaInfo.novSenha)){
                        alert("Senha alterada");
                        boxReset.style.display = "none";
                        window.location.href = "info_computadores.html";
                    }else{
                        alert("Deu tudo errado nessa porra");
                    }

                }else{
                    alert("As senhas não conferem");
                }
            })
            
        }else{
            window.location.href = "info_computadores.html";
        }
        sessionStorage.setItem("nome", loginInfo.getNome);
        sessionStorage.setItem("id", loginInfo.getId.toString());
        sessionStorage.setItem("nivel", loginInfo.getNivel.toString());
        
    }else{
        alert("Usuário ou senha incorretos");
    }
})