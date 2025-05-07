<?php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, POST, DELETE, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");
header("Content-Type: application/json; charset=UTF-8");

$method = $_SERVER['REQUEST_METHOD'];
$conn = new mysqli("localhost", "root", "", "gerenciamento");

if ($conn->connect_error) {
    http_response_code(500);
    echo json_encode(["erro" => "Erro de conexão com o banco de dados."]);
    exit;
}

if ($method === 'GET') {
    $result = $conn->query("SELECT * FROM computadores ORDER BY id");
    $computadores = [];

    while ($row = $result->fetch_assoc()) {
        $computadores[] = $row;
    }

    echo json_encode($computadores);
    exit;
}

if ($method === 'POST') {
    $dados = json_decode(file_get_contents("php://input"), true);

    $stmt = $conn->prepare("REPLACE INTO computadores (id, status, model, entryDate, Resp, Setor, pronto, exitDate, saidamt, Patrimonio, obs) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)");
    $stmt->bind_param(
        "issssssssss",
        $dados['id'],
        $dados['status'],
        $dados['model'],
        $dados['entryDate'],
        $dados['Resp'],
        $dados['Setor'],
        $dados['pronto'],
        $dados['exitDate'],
        $dados['saidamt'],
        $dados['Patrimonio'],
        $dados['obs']
    );

    if ($stmt->execute()) {
        echo json_encode(["mensagem" => "Computador salvo com sucesso."]);
    } else {
        http_response_code(500);
        echo json_encode(["erro" => "Erro ao salvar no banco: " . $conn->error]);
    }

    $stmt->close();
    exit;
}

if ($method === 'DELETE') {
    $id = intval($_GET['id'] ?? 0);

    if ($id === 0) {
        http_response_code(400);
        echo json_encode(["erro" => "ID inválido"]);
        exit;
    }

    $stmt = $conn->prepare("DELETE FROM computadores WHERE id = ?");
    $stmt->bind_param("i", $id);

    if ($stmt->execute()) {
        echo json_encode(["mensagem" => "Computador deletado com sucesso."]);
    } else {
        http_response_code(500);
        echo json_encode(["erro" => "Erro ao deletar o computador: " . $conn->error]);
    }

    $stmt->close();
    exit;
}

$conn->close();