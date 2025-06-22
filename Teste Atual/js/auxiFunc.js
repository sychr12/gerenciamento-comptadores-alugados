class AuxiFunc{
    static address = "http://192.168.1.8/php/";
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
            const resp = await fetch(`${AuxiFunc.address}processa.php`)
            const data = await resp.json();

            for(let user of data){
                if(user.nome === name && user.senha === password){
                    id = user.id
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
            return {getNivel: nivel, getReset: reset, getId: id};
        }catch(error){
            alert(`Esse ne requisição: ${error}`)
        }
    }
}