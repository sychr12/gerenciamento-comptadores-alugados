<?php
require_once __DIR__ . '/conexao.php';

if (($_SERVER['REQUEST_METHOD'] ?? '') !== 'POST') {
    enviarJson(['success' => false, 'message' => 'Método não permitido.'], 405);
}

$data = lerJson();
$nome = trim((string)($data['nome'] ?? ''));
$senha = (string)($data['senha'] ?? '');
if ($nome === '' || $senha === '') {
    enviarJson(['success' => false, 'message' => 'Informe usuário e senha.'], 400);
}

try {
    $db = conectarBanco();
    $statement = $db->prepare('SELECT id, nome, senha, nivel, "reset" FROM usuarios WHERE LOWER(nome) = LOWER(:nome) LIMIT 1');
    $statement->execute(['nome' => $nome]);
    $user = $statement->fetch();
    if (!$user || !senhaValida($senha, (string)$user['senha'])) {
        enviarJson(['success' => false, 'message' => 'Usuário ou senha incorretos.'], 401);
    }

    // Upgrade older plaintext records automatically after a successful login.
    if (password_get_info((string)$user['senha'])['algoName'] === 'unknown') {
        $update = $db->prepare('UPDATE usuarios SET senha = :senha WHERE id = :id');
        $update->execute(['senha' => password_hash($senha, PASSWORD_DEFAULT), 'id' => $user['id']]);
    }

    iniciarSessaoSegura();
    session_regenerate_id(true);
    $_SESSION['usuario_id'] = (int)$user['id'];
    $_SESSION['nivel'] = (int)$user['nivel'];
    $_SESSION['nome'] = $user['nome'];
    $_SESSION['reset'] = $user['reset'] ?? 'nao';
    enviarJson([
        'success' => true,
        'user' => [
            'id' => (int)$user['id'],
            'nome' => $user['nome'],
            'nivel' => (int)$user['nivel'],
            'reset' => $user['reset'] ?? 'nao',
        ],
    ]);
} catch (PDOException $error) {
    erroBanco($error);
}

function senhaValida(string $senha, string $armazenada): bool
{
    $info = password_get_info($armazenada);
    if (($info['algoName'] ?? 'unknown') !== 'unknown') {
        return password_verify($senha, $armazenada);
    }
    return hash_equals($armazenada, $senha);
}
