<?php
require_once __DIR__ . '/conexao.php';
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

$method = $_SERVER['REQUEST_METHOD'] ?? '';
if ($method === 'OPTIONS') {
    http_response_code(204);
    exit;
}

$actor = exigirAutenticacao(1, true);

try {
    $db = conectarBanco();
    $data = lerJson();

    if ($actor['reset'] === 'sim' && (($data['action'] ?? '') !== 'novSe' || (int)($data['id'] ?? 0) !== (int)$actor['id'])) {
        enviarJson(['success' => false, 'message' => 'Altere sua senha antes de continuar.'], 403);
    }

    if ($method === 'DELETE') {
        if ($actor['nivel'] < 2) {
            enviarJson(['success' => false, 'message' => 'Você não tem permissão para excluir usuários.'], 403);
        }
        $id = filter_var($data['id'] ?? null, FILTER_VALIDATE_INT, ['options' => ['min_range' => 1]]);
        if ($id && $id === (int)$actor['id']) {
            enviarJson(['success' => false, 'message' => 'Não é permitido excluir a conta em uso.'], 409);
        }
        if (!$id) {
            enviarJson(['success' => false, 'message' => 'Informe um usuário válido.'], 400);
        }
        $target = $db->prepare('SELECT nivel FROM usuarios WHERE id = :id');
        $target->execute(['id' => $id]);
        $targetLevel = $target->fetchColumn();
        if ($targetLevel === false) {
            enviarJson(['success' => false, 'message' => 'Usuário não encontrado.'], 404);
        }
        if ((int)$targetLevel > $actor['nivel']) {
            enviarJson(['success' => false, 'message' => 'Não é permitido remover uma conta com nível superior ao seu.'], 403);
        }
        $statement = $db->prepare('DELETE FROM usuarios WHERE id = :id');
        $statement->execute(['id' => $id]);
        if ($statement->rowCount() === 0) {
            enviarJson(['success' => false, 'message' => 'Usuário não encontrado.'], 404);
        }
        enviarJson(['success' => true, 'message' => 'Usuário excluído com sucesso.']);
    }

    if ($method !== 'POST') {
        enviarJson(['success' => false, 'message' => 'Método não permitido.'], 405);
    }

    $id = filter_var($data['id'] ?? null, FILTER_VALIDATE_INT, ['options' => ['min_range' => 1]]);
    if (!$id) {
        enviarJson(['success' => false, 'message' => 'Informe um usuário válido.'], 400);
    }

    $target = $db->prepare('SELECT nivel FROM usuarios WHERE id = :id');
    $target->execute(['id' => $id]);
    $targetLevel = $target->fetchColumn();
    if ($targetLevel === false) {
        enviarJson(['success' => false, 'message' => 'Usuário não encontrado.'], 404);
    }
    $isOwnPasswordReset = ($data['action'] ?? '') === 'novSe' && (int)$actor['id'] === $id;
    if (!$isOwnPasswordReset && $actor['nivel'] < 2) {
        enviarJson(['success' => false, 'message' => 'Você não tem permissão para editar usuários.'], 403);
    }
    if ((int)$targetLevel > $actor['nivel'] && !$isOwnPasswordReset) {
        enviarJson(['success' => false, 'message' => 'Não é permitido alterar uma conta com nível superior ao seu.'], 403);
    }

    if (($data['action'] ?? '') === 'novSe') {
        if ((int)$actor['id'] !== $id) {
            enviarJson(['success' => false, 'message' => 'Só é permitido trocar a própria senha nesta operação.'], 403);
        }
        $senha = (string)($data['senha'] ?? '');
        if (strlen($senha) < 8 || strlen($senha) > 128) {
            enviarJson(['success' => false, 'message' => 'A senha deve ter entre 8 e 128 caracteres.'], 400);
        }
        $statement = $db->prepare('UPDATE usuarios SET senha = :senha, "reset" = :reset WHERE id = :id');
        $statement->execute(['senha' => password_hash($senha, PASSWORD_DEFAULT), 'reset' => 'nao', 'id' => $id]);
        $_SESSION['reset'] = 'nao';
    } else {
        $nome = trim((string)($data['nome'] ?? ''));
        $cargo = trim((string)($data['cargo'] ?? ''));
        $nivel = filter_var($data['nivel'] ?? null, FILTER_VALIDATE_INT);
        $categoria = trim((string)($data['categoria'] ?? ''));
        $reset = (string)($data['resetar'] ?? 'nao');
        if ($nome === '' || $cargo === '' || $categoria === '' || !$nivel || !in_array($nivel, [1, 2, 3], true) || !in_array($reset, ['sim', 'nao'], true)) {
            enviarJson(['success' => false, 'message' => 'Preencha todos os campos obrigatórios.'], 400);
        }
        if (strlen($nome) > 100 || strlen($cargo) > 50 || strlen($categoria) > 50) {
            enviarJson(['success' => false, 'message' => 'Usuário pode ter até 100 caracteres; cargo e categoria, até 50.'], 422);
        }
        if ($nivel > $actor['nivel']) {
            enviarJson(['success' => false, 'message' => 'Não é permitido definir um nível superior ao seu.'], 403);
        }

        $duplicate = $db->prepare('SELECT 1 FROM usuarios WHERE LOWER(nome) = LOWER(:nome) AND id <> :id LIMIT 1');
        $duplicate->execute(['nome' => $nome, 'id' => $id]);
        if ($duplicate->fetchColumn()) {
            enviarJson(['success' => false, 'message' => 'Já existe uma conta com esse nome de usuário.'], 409);
        }

        $senha = (string)($data['senha'] ?? '');
        if ($senha !== '') {
            if (strlen($senha) < 8 || strlen($senha) > 128) {
                enviarJson(['success' => false, 'message' => 'A senha deve ter entre 8 e 128 caracteres.'], 400);
            }
            $senha = password_hash($senha, PASSWORD_DEFAULT);
            $statement = $db->prepare('UPDATE usuarios SET nome = :nome, cargo = :cargo, nivel = :nivel, categoria = :categoria, senha = :senha, "reset" = :reset WHERE id = :id');
            $statement->execute(compact('nome', 'cargo', 'nivel', 'categoria', 'senha', 'reset') + ['id' => $id]);
        } else {
            $statement = $db->prepare('UPDATE usuarios SET nome = :nome, cargo = :cargo, nivel = :nivel, categoria = :categoria, "reset" = :reset WHERE id = :id');
            $statement->execute(compact('nome', 'cargo', 'nivel', 'categoria', 'reset') + ['id' => $id]);
        }
    }

    if ($statement->rowCount() === 0) {
        $exists = $db->prepare('SELECT 1 FROM usuarios WHERE id = :id');
        $exists->execute(['id' => $id]);
        if (!$exists->fetchColumn()) {
            enviarJson(['success' => false, 'message' => 'Usuário não encontrado.'], 404);
        }
    }
    enviarJson(['success' => true, 'message' => 'Usuário atualizado com sucesso.']);
} catch (PDOException $error) {
    erroBanco($error);
}
