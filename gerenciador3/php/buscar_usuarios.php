<?php
require_once __DIR__ . '/conexao.php';
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, OPTIONS');

if (($_SERVER['REQUEST_METHOD'] ?? 'GET') === 'OPTIONS') {
    http_response_code(204);
    exit;
}

exigirAutenticacao(2);

try {
    $db = conectarBanco();
    $statement = $db->query('SELECT id, nome, cargo, nivel, categoria, data_cadastro, "reset" FROM usuarios ORDER BY nome');
    enviarJson($statement->fetchAll());
} catch (PDOException $error) {
    erroBanco($error);
}
