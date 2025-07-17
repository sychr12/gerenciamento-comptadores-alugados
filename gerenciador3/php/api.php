<?php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, POST, DELETE, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");
header("Content-Type: application/json; charset=UTF-8");

$method = $_SERVER['REQUEST_METHOD'];
$conn = new mysqli("127.0.0.1", "root", "", "testelogin");

if ($conn->connect_error) {
    http_response_code(500);
    echo json_encode(["erro" => "Erro de conexão com o banco de dados."]);
    exit;
}

// GET: Lista todos os computadores
if ($method === 'GET') {
    $result = $conn->query("SELECT * FROM computadores ORDER BY id");
    $computadores = [];

    while ($row = $result->fetch_assoc()) {
        $computadores[] = $row;
    }

    echo json_encode($computadores);
    exit;
}

// POST: Adiciona ou atualiza um computador
if ($method === 'POST') {
    $dados = json_decode(file_get_contents("php://input"), true);

    // Corrige o tipo dos dados para evitar erros de binding
    $id = isset($dados['id']) ? intval($dados['id']) : 0;
    $status = $dados['status'] ?? '';
    $model = $dados['model'] ?? '';
    $entryDate = $dados['entryDate'] ?? '';
    $Resp = $dados['Resp'] ?? '';
    $Setor = $dados['Setor'] ?? '';
    $pronto = $dados['pronto'] ?? '';
    $exitDate = $dados['exitDate'] ?? '';
    $saidamt = $dados['saidamt'] ?? '';
    $Patrimonio = isset($dados['Patrimonio']) && $dados['Patrimonio'] !== '-' ? strval($dados['Patrimonio']) : '';
    $obs = $dados['obs'] ?? '';

    $stmt = $conn->prepare("REPLACE INTO computadores (id, status, model, entryDate, Resp, Setor, pronto, exitDate, saidamt, Patrimonio, obs) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)");
    $stmt->bind_param(
        "issssssssss",
        $id,
        $status,
        $model,
        $entryDate,
        $Resp,
        $Setor,
        $pronto,
        $exitDate,
        $saidamt,
        $Patrimonio,
        $obs
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

// DELETE: Remove um computador pelo ID
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