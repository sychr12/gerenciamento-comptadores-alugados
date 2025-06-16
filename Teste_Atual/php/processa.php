<?php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, POST, DELETE, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");
header("Content-Type: application/json; charset=UTF-8");

ini_set('display_errors', 1);
error_reporting(E_ALL);

header('Content-Type: application/json');
require_once 'conexao.php';

$dados = json_decode(file_get_contents('php://input'), true);
$usuario = $dados['usuario'] ?? '';
$senha = $dados['senha'] ?? '';

$conn = conectarBanco($host, $user, $pass, $db);

$sql = "SELECT * FROM usuarios WHERE nome = ? AND senha = ?";
$stmt = $conn->prepare($sql);
$stmt->bind_param('ss', $usuario, $senha);
$stmt->execute();
$result = $stmt->get_result();

$senhaHash = sha1($senha . 'salt_aleatorio');

if ($result->num_rows > 0) {
    echo json_encode(['sucesso' => true, 'mensagem' => 'Login bem-sucedido!']);
} else {
    echo json_encode(['sucesso' => false, 'mensagem' => 'Usuário ou senha incorretos.']);
}

$conn->close();