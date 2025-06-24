<?php
header('Content-Type: application/json');

$host = "127.0.0.1";
$user = "root";
$password = "";
$db = "testelogin";

$conexao = new mysqli($host, $user, $password, $db);
$metodo = $_SERVER['REQUEST_METHOD'];

if(!($conexao->connect_error)){
    if($metodo === "POST"){
        if(isset($_FILES['image']) && isset($_POST['id'])){
            $id = intval($_POST['id']);
            $file = $_FILES['image'];

            $original_name = basename($file['name']);
            $extension = strtolower(pathinfo($original_name, PATHINFO_EXTENSION));
            $new_name = "img_".uniqid().".".$extension;

            $destination_folder = "../imagens/";
            $path_file = $destination_folder.$new_name;

            if(move_uploaded_file($file["tmp_name"], $path_file)){
                $comand = $conexao->prepare("UPDATE usuarios SET imagem_perfil = ? WHERE id = ?");
                $comand->bind_param("si", $path_file, $id);
                if($comand->execute()){
                    echo json_encode(["success"=> true, "message"=> "Imagem registrada com sucesso"]);
                }else{
                    echo json_encode(["success" => false, "message" => "Imagem não registrada"]);
                }
            }else{
                echo json_encode(["success" => false, "message" => "Não foi possivel mover para pasta"]);
            }

        }else{
            echo json_encode(["success" => false, "message" => "Variáveis ausentes"]);
        }
    }else{
        echo json_encode(["success" => false, "message" => "Metodo errado"]);
    }

}else{
    echo json_encode(["success"=> false, "message"=>"Conexão falhou".$conexao->connect_error]);
}


?>