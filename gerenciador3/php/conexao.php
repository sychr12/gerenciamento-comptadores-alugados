<?php
function conectarBanco(): PDO
{
    //depois trocar para getenv('PGHOST') e etc, para pegar do .env
    $host = getenv('PGHOST') ?: '127.0.0.1';
    $port = getenv('PGPORT') ?: '5432';
    $database = getenv('PGDATABASE') ?: 'gerenciamento';
    $user = getenv('PGUSER') ?: 'postgres';
    $password = getenv('PGPASSWORD') ?: '';

    $dsn = sprintf('pgsql:host=%s;port=%s;dbname=%s', $host, $port, $database);
    return new PDO($dsn, $user, $password, [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
        PDO::ATTR_EMULATE_PREPARES => false,
    ]);
}

function enviarJson(array $data, int $status = 200): void
{
    http_response_code($status);
    header('Content-Type: application/json; charset=UTF-8');
    header('Cache-Control: no-store, private');
    echo json_encode($data, JSON_UNESCAPED_UNICODE | JSON_INVALID_UTF8_SUBSTITUTE);
    exit;
}

function lerJson(): array
{
    $data = json_decode(file_get_contents('php://input'), true);
    return is_array($data) ? $data : [];
}

function iniciarSessaoSegura(): void
{
    if (session_status() === PHP_SESSION_ACTIVE) {
        return;
    }

    session_set_cookie_params([
        'httponly' => true,
        'secure' => !empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off',
        'samesite' => 'Lax',
        'path' => '/',
    ]);
    session_start();
}

function exigirAutenticacao(int $nivelMinimo = 1, bool $permitirResetPendente = false): array
{
    iniciarSessaoSegura();
    $usuarioId = filter_var($_SESSION['usuario_id'] ?? null, FILTER_VALIDATE_INT, ['options' => ['min_range' => 1]]);
    if (!$usuarioId) {
        enviarJson(['success' => false, 'message' => 'Faça login para continuar.'], 401);
    }

    try {
        $statement = conectarBanco()->prepare('SELECT nome, nivel, "reset" FROM usuarios WHERE id = :id');
        $statement->execute(['id' => $usuarioId]);
        $usuario = $statement->fetch();
    } catch (PDOException $error) {
        erroBanco($error);
    }
    if (!$usuario) {
        $_SESSION = [];
        session_destroy();
        enviarJson(['success' => false, 'message' => 'A conta não está mais ativa. Faça login novamente.'], 401);
    }

    $nivel = (int)$usuario['nivel'];
    $_SESSION['nivel'] = $nivel;
    $_SESSION['nome'] = $usuario['nome'];
    $_SESSION['reset'] = $usuario['reset'] ?? 'nao';
    if (!$nivel || $nivel < $nivelMinimo) {
        enviarJson(['success' => false, 'message' => 'Você não tem permissão para realizar esta ação.'], 403);
    }
    if (!$permitirResetPendente && $_SESSION['reset'] === 'sim') {
        enviarJson(['success' => false, 'message' => 'Altere sua senha antes de continuar.'], 403);
    }

    return ['id' => $usuarioId, 'nivel' => $nivel, 'nome' => $usuario['nome'], 'reset' => $_SESSION['reset']];
}
function erroBanco(PDOException $error): void
{
    error_log($error->getMessage());
    if (stripos($error->getMessage(), 'could not find driver') !== false) {
        $message = 'A imagem da aplicação está sem o driver pdo_pgsql. Reconstrua os containers com docker compose up --build.';
    } elseif ($error->getCode() === '42703') {
        $message = 'A estrutura de uma tabela está desatualizada. Atualize o esquema do banco de dados e tente novamente.';
    } elseif ($error->getCode() === '42P01') {
        $message = 'Uma tabela necessária não existe. Importe os esquemas SQL em gerenciador3/bancotxt para o banco configurado.';
    } else {
        $message = 'Falha no PostgreSQL. Confira se o serviço está ativo, o banco e as tabelas foram criados e as variáveis PGHOST, PGPORT, PGUSER e PGPASSWORD estão corretas.';
    }
    enviarJson([
        'success' => false,
        'message' => $message,
    ], 500);
}
