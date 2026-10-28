class AuxiFunc{
    static address = "../php/";
    static async requestJSON(url, options = {}){
        const response = await fetch(url, options);
        const body = await response.text();
        let data;
        try{
            data = JSON.parse(body);
        }catch{
            if(body.trimStart().startsWith("<?php")){
                throw new Error("O servidor está exibindo PHP como texto. Inicie pelo arquivo iniciar.bat e abra http://127.0.0.1:8000.");
            }
            throw new Error("O servidor respondeu em um formato inesperado. Confira o PHP e tente novamente.");
        }
        if(!response.ok){
            throw new Error(data.message || data.error || data.erro || "Não foi possível concluir a operação.");
        }
        return data;
    }
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
        }else if(cargo === "Assessor" || cargo === "Acessor" || cargo === "Supervisor"){
            return 2;
        }else if(cargo === "Estagiario" || cargo === "Jovem Aprendiz"){
            return 1;
        }
    }
    static async changePass(id, senha){
        try{
            const respServidor = await AuxiFunc.requestJSON(`${AuxiFunc.address}editarExcluir.php`, {
                method: 'POST',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify({id: id, senha: senha, action: 'novSe'})
            })
            return respServidor.success;
        }catch(error){
            throw error;
        }
    }
    static async validateUser(name, password){
        const response = await AuxiFunc.requestJSON(`${AuxiFunc.address}login_api.php`, {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({nome: name, senha: password})
        });
        const user = response.user;
        return {
            getNivel: Number(user.nivel) || 0,
            getReset: user.reset === 'sim',
            getId: user.id,
            getNome: user.nome
        };
    }

    static downloadCSV(filename, headers, rows){
        const escapeCell = value => {
            let text = String(value ?? '');
            if (/^[\t\r ]*[=+\-@]/.test(text)) text = `'${text}`;
            return `"${text.replace(/"/g, '""')}"`;
        };
        const csv = [headers, ...rows].map(row => row.map(escapeCell).join(';')).join('\r\n');
        const blob = new Blob([`\uFEFF${csv}`], {type: 'text/csv;charset=utf-8'});
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = filename;
        document.body.append(link);
        link.click();
        link.remove();
        window.setTimeout(() => URL.revokeObjectURL(url), 1000);
    }
}

window.AuxiFunc = AuxiFunc;
