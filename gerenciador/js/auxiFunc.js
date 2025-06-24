class AuxiFunc{
    static address = "../php/";
    static checkReset(checkox){
        if(checkox){
            return "sim";
        }else{
            return "nao";
        }
    }
    static checkLevel(cargo){
        if(cargo === "Administrador" || cargo === "Gestor"){
            return 3;
        }else if(cargo === "Acessor" || cargo === "Supervisor"){
            return 2;
        }else if(cargo === "Estagiario" || cargo === "Jovem Aprendiz"){
            return 1;
        }
    }
    static async changePass(id, senha){
        try{
            const resp = await fetch(`${AuxiFunc.address}editarExcluir.php`, {
                method: 'POST',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify({id: id, senha: senha, action: 'novSe'})
            })
            const respServidor =  await resp.json();
            return respServidor.success;
        }catch(error){
            alert(`Erro na requisição: ${error}`)
        }
    }
    static async validateUser(name, password){
        try{
            let nivel = 0;
            let reset = false;
            let id;
            let nome;
            const resp = await fetch(`${AuxiFunc.address}processa.php`)
            const data = await resp.json();

            for(let user of data){
                if(user.nome === name && user.senha === password){
                    id = user.id;
                    nome = user.nome;
                    if(user.reset === "sim"){
                        reset = true;
                    }
                    switch (user.nivel){
                        case 1:
                            nivel = 1;
                            break;
                        case 2:
                            nivel = 2;
                            break;
                        case 3:
                            nivel = 3;
                            break;
                        default:
                            nivel = 0;
                            break;
                    }
                    break;
                }
            }
            return {getNivel: nivel, getReset: reset, getId: id, getNome: nome};
        }catch(error){
            alert(`Esse ne requisição: ${error}`)
        }
    }
    static async uploadImg(file, id){
        if(!file){
            alert("Nenhum arquivo foi selecionado");
            return;
        }
        try{
            const infoData = new FormData();
            infoData.append("image", file);
            infoData.append("id", id);

            const resp = await fetch(`${AuxiFunc.address}uploadImg.php`,{
                method: "POST",
                body: infoData
            });
            const data = await resp.json();
            return {status: data.success, message: data.message};
        }catch(error){
            alert("Erro na requisição: " + error)
        }
        
    }
}