<?php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, POST, DELETE, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");
header("Content-Type: application/json; charset=UTF-8");

// Conexão com o banco
$host = 'localhost';
$db = 'testelogin';
$user = 'root';
$pass = '';

$conn = new mysqli($host, $user, $pass, $db);

if ($conn->connect_error) {
    echo json_encode(["error" => "Erro de conexão"]);
    exit();
}

$sql = "SELECT id, nome, cargo, nivel, categoria, data_cadastro FROM usuarios";
$result = $conn->query($sql);

$dados = [];

if ($result->num_rows > 0) {
    while($row = $result->fetch_assoc()) {
        $dados[] = $row;
    }
}

echo json_encode($dados);
$conn->close();
?>