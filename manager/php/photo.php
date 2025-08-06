<?php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, POST, DELETE, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");
header("Content-Type: application/json; charset=UTF-8");

require_once "conexao.php";

if($conn->connect_error){
    echo json_encode(["success" => false, "message" => "Falha na conexão"]);
    exit();
}

$method = $_SERVER["REQUEST_METHOD"];

if($method === "POST"){
    if(isset($_FILES["photo"]) && isset($_POST["id"])){
        $idUser = intval($_POST["id"]);
        $photo = $_FILES["photo"];

        $nameFile = uniqid() . "-" . basename($photo["name"]);
        $directory = "../img/";

        $path = $directory . $nameFile;

        $comandVerfify = $conn->prepare("SELECT path_img FROM usuarios WHERE id = ?");
        $comandVerfify->bind_param("i", $idUser);

        if($comandVerfify->execute()){
            $result = $comandVerfify->get_result();
            if($result->num_rows > 0){
                $data = $result->fetch_assoc();
                $oldPhoto = $data["path_img"];
                if(file_exists($oldPhoto) && strpos($oldPhoto, "default.png") === false){
                    unlink($oldPhoto);
                }
            }else{
                json_encode(["message" => "Linhas query vazias"]);
                exit();
            }
        }else{
            echo json_encode(["message" => "Comando não executado"]);
            exit();
        }

        if(is_dir($directory)){
            if(move_uploaded_file($photo["tmp_name"], $path)){
                $comandUpdate = $conn->prepare("UPDATE usuarios SET path_img = ? WHERE id = ?");
                $comandUpdate->bind_param("si", $path, $idUser);

                if($comandUpdate->execute()){
                    echo json_encode(["message" => "Imagem salva com sucesso"]);
                }else{
                    echo json_encode(["message" => "Erro no comando"]);
                }
            }
        }else{
            echo json_encode(["message" => "Diretorio não existe"]);
        }
    }else{
        echo json_encode(["message" => "Dados incompletos"]);
    }
}else if($method === "GET"){
    $id = intval($_GET["id"]);

    $comand = $conn->prepare("SELECT path_img FROM usuarios WHERE id = ?");
    $comand->bind_param("i", $id);

    if($comand->execute()){
        $result = $comand->get_result();
        $data = $result->fetch_assoc();
        $path_img = $data["path_img"];

        echo json_encode(["path_img" => $path_img]);
    }else{
        echo json_encode(["message" => "Comando não executado"]);
    }
}
