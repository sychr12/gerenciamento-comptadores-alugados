<?php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, POST, DELETE, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");
header("Content-Type: application/json; charset=UTF-8");
header('Content-Type: application/json');

// Configurações do banco de dados
$servername = "127.0.0.1";
$username = "root";
$password = "";
$dbname = "testelogin";

// Criar conexão
$conn = new mysqli($servername, $username, $password, $dbname);

// Verificar conexão
if ($conn->connect_error) {
    die(json_encode(['success' => false, 'message' => 'Conexão falhou: ' . $conn->connect_error]));
}

// Receber dados do formulário
$data = json_decode(file_get_contents('php://input'), true);

$nome = $data['nome'] ?? '';
$cargo = $data['status'] ?? '';
$categoria = $data['Categoria'] ?? '';
$senha = $data['senha'] ?? '';

// Validar dados
if (empty($nome) || empty($cargo) || empty($categoria) || empty($senha)) {
    echo json_encode(['success' => false, 'message' => 'Todos os campos são obrigatórios']);
    exit;
}

// Preparar e executar a query (sem criptografia)
$stmt = $conn->prepare("INSERT INTO usuarios (nome, cargo, categoria, senha) VALUES (?, ?, ?, ?)");
$stmt->bind_param("ssss", $nome, $cargo, $categoria, $senha);

if ($stmt->execute()) {
    echo json_encode(['success' => true, 'message' => 'Usuário cadastrado com sucesso']);
} else {
    echo json_encode(['success' => false, 'message' => 'Erro ao cadastrar usuário: ' . $stmt->error]);
}

$stmt->close();
$conn->close();
?>