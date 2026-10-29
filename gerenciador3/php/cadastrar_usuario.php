<?php
require_once __DIR__ . '/conexao.php';
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

if (($_SERVER['REQUEST_METHOD'] ?? 'GET') === 'OPTIONS') {
    http_response_code(204);
    exit;
}
if (($_SERVER['REQUEST_METHOD'] ?? '') !== 'POST') {
    enviarJson(['success' => false, 'message' => 'Método não permitido.'], 405);
}

$actor = exigirAutenticacao(2);

$data = lerJson();
$nome = trim((string)($data['nome'] ?? ''));
$cargo = trim((string)($data['cargo'] ?? ''));
$categoria = trim((string)($data['categoria'] ?? ''));
$senha = (string)($data['senha'] ?? '');
$nivel = filter_var($data['nivel'] ?? null, FILTER_VALIDATE_INT);
$reset = (string)($data['reset'] ?? 'nao');

if ($nome === '' || $cargo === '' || $categoria === '' || strlen($senha) < 8 || !$nivel || !in_array($nivel, [1, 2, 3], true) || !in_array($reset, ['sim', 'nao'], true)) {
    enviarJson(['success' => false, 'message' => 'Preencha todos os campos obrigatórios.'], 400);
}
if (strlen($nome) > 100 || strlen($cargo) > 50 || strlen($categoria) > 50 || strlen($senha) > 128) {
    enviarJson(['success' => false, 'message' => 'Confira os limites: usuário até 100, cargo e categoria até 50, senha até 128 caracteres.'], 422);
}

if ($nivel > $actor['nivel']) {
    enviarJson(['success' => false, 'message' => 'Não é permitido criar uma conta com nível superior ao seu.'], 403);
}

try {
    $db = conectarBanco();
    $duplicate = $db->prepare('SELECT 1 FROM usuarios WHERE LOWER(nome) = LOWER(:nome) LIMIT 1');
    $duplicate->execute(['nome' => $nome]);
    if ($duplicate->fetchColumn()) {
        enviarJson(['success' => false, 'message' => 'Já existe uma conta com esse nome de usuário.'], 409);
    }
    $senha = password_hash($senha, PASSWORD_DEFAULT);
    $statement = $db->prepare('INSERT INTO usuarios (nome, cargo, nivel, categoria, senha, "reset") VALUES (:nome, :cargo, :nivel, :categoria, :senha, :reset)');
    $statement->execute(compact('nome', 'cargo', 'nivel', 'categoria', 'senha', 'reset'));
    enviarJson(['success' => true, 'message' => 'Usuário cadastrado com sucesso.'], 201);
} catch (PDOException $error) {
    erroBanco($error);
}
