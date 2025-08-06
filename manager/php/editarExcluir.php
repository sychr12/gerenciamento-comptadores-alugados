<?php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, POST, DELETE, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");
header("Content-Type: application/json; charset=UTF-8");



$servername = "127.0.0.1";
$username = "root";
$password = "";
$dbname = "testelogin";

$conection = new mysqli($servername, $username, $password, $dbname);

$metodo = $_SERVER['REQUEST_METHOD'];

if($metodo === 'POST'){

    $data = json_decode(file_get_contents('php://input'),true);
    $action = $data['action'] ?? '';

    if(empty($action)){
        $id = $data['id'] ?? '';
        $nome = $data['nome'] ?? '';
        $cargo = $data['cargo'] ?? '';
        $nivel = $data['nivel'] ?? '';
        $categoria = $data['categoria'] ?? '';
        $senha = $data['senha'] ?? '';
        $resetar = $data['resetar'] ?? 'nao';

        if(empty($nome) || empty($cargo) || empty($nivel) || empty($categoria)){
            echo json_encode(['sucess' => false, 'message' => "Todos os campos são obrigatorios"]);
            exit;
        }

        $comand = $conection->prepare("UPDATE usuarios SET nome = ?, cargo = ?, nivel = ?, categoria = ?, reset = ? WHERE id = ?");
        $comand->bind_param("ssissi", $nome , $cargo, $nivel, $categoria, $resetar, $id);

        if($comand->execute()){
            echo json_encode(['success' => true, 'message' => 'Usuário atualizado']);
        }else{
            echo json_encode(['success' => false, 'message' => 'Usuário não atualizado']);
        }
        if(!empty($senha)){
            $comand3 = $conection->prepare("UPDATE usuarios SET senha = ?  WHERE id = ?");
            $comand3->bind_param("si", $senha, $id);
            $comand3->execute();

        }
    }else{
        $id = $data['id'] ?? '';
        $senha = $data['senha'] ?? '';

        if(empty($id) || empty($senha)){
            echo json_encode(['success' => false, 'message' => 'Id ou senha vazio']);
            exit;
        }
        $comand = $conection->prepare("UPDATE usuarios SET senha = ? WHERE id = ?");
        $comand->bind_param("si", $senha, $id);

        if($comand->execute()){
            echo json_encode(['success' => true, 'message' => 'Senha alterada com sucesso']);
            $comand2 = $conection->prepare("UPDATE usuarios SET reset = 'nao' WHERE id = ?");
            $comand2->bind_param("i",$id);
            $comand2->execute();
        }else{
            echo json_encode(['success' => false, 'message' => 'Não foi possivel alterar a senha']);
        }
    }
}else if ($metodo === 'DELETE'){
    $data = json_decode(file_get_contents('php://input'),true);

    $id = $data['id'] ?? '';
    if(empty($id)){
        echo json_encode(['success' => false, 'message' => 'Campo de id vazio']);
        exit;
    }

    $comand = $conection->prepare("DELETE FROM usuarios WHERE id = ?");
    $comand->bind_param("i", $id);

    if($comand->execute()){
        echo json_encode(['success' => true, 'message' => 'Usuário deletado com sucesso']);
    }else{
        echo json_encode(['success' => false, 'message' => 'Usuário não deletado, erro no comando mysql']);
    }
}
?>