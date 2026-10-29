<?php
require_once __DIR__ . '/conexao.php';

$method = $_SERVER['REQUEST_METHOD'] ?? 'GET';
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');
if ($method === 'OPTIONS') {
    http_response_code(204);
    exit;
}

exigirAutenticacao(1);

function validarMaterial(array $data): array
{
    $categories = ['Teclado', 'Mouse', 'Monitor', 'Headset', 'Cabo', 'Adaptador', 'Tinta', 'Toner', 'Outro'];
    $colors = ['', 'Preto', 'Ciano', 'Magenta', 'Amarelo', 'Colorida'];
    $category = textoMaterial($data, 'category');
    $name = textoMaterial($data, 'name');
    $color = textoMaterial($data, 'color');
    $compatibility = textoMaterial($data, 'compatibility');
    $location = textoMaterial($data, 'location');
    $quantity = inteiroMaterial($data['quantity'] ?? null);
    $minimum = inteiroMaterial($data['minimum_quantity'] ?? null);

    if (!in_array($category, $categories, true)) {
        enviarJson(['success' => false, 'message' => 'Selecione uma categoria válida.'], 422);
    }
    if ($name === '' || tamanhoTexto($name) > 150) {
        enviarJson(['success' => false, 'message' => 'Informe o nome ou modelo (até 150 caracteres).'], 422);
    }
    if ($quantity === false || $quantity < 0 || $quantity > 1000000
        || $minimum === false || $minimum < 0 || $minimum > 1000000) {
        enviarJson(['success' => false, 'message' => 'Quantidade e estoque mínimo devem ser números inteiros entre 0 e 1.000.000.'], 422);
    }
    if (!in_array($color, $colors, true)) {
        enviarJson(['success' => false, 'message' => 'Selecione uma cor válida.'], 422);
    }
    if (tamanhoTexto($compatibility) > 150 || tamanhoTexto($location) > 150) {
        enviarJson(['success' => false, 'message' => 'Compatibilidade e localização aceitam até 150 caracteres.'], 422);
    }
    if (!in_array($category, ['Tinta', 'Toner'], true)) {
        $color = '';
        $compatibility = '';
    }

    return [
        'category' => $category,
        'name' => $name,
        'color' => $color === '' ? null : $color,
        'compatibility' => $compatibility === '' ? null : $compatibility,
        'quantity' => $quantity,
        'minimum_quantity' => $minimum,
        'location' => $location === '' ? null : $location,
    ];
}

function textoMaterial(array $data, string $field): string
{
    $value = $data[$field] ?? '';
    if (!is_string($value)) {
        enviarJson(['success' => false, 'message' => 'Os campos de texto devem conter valores válidos.'], 422);
    }
    return trim($value);
}

function inteiroMaterial($value): int|false
{
    if (!is_int($value) && !is_string($value)) {
        return false;
    }
    return filter_var($value, FILTER_VALIDATE_INT);
}

function tamanhoTexto(string $value): int
{
    $length = preg_match_all('/./us', $value);
    return $length === false ? PHP_INT_MAX : $length;
}

function validarId(): int
{
    $id = filter_var($_GET['id'] ?? null, FILTER_VALIDATE_INT, ['options' => ['min_range' => 1]]);
    if (!$id) {
        enviarJson(['success' => false, 'message' => 'Identificador de material inválido.'], 400);
    }
    return $id;
}

try {
    $db = conectarBanco();
    $db->exec('CREATE TABLE IF NOT EXISTS componentes (
        id BIGSERIAL PRIMARY KEY,
        category VARCHAR(30) NOT NULL,
        name VARCHAR(150) NOT NULL,
        color VARCHAR(30),
        compatibility VARCHAR(150),
        quantity INTEGER NOT NULL DEFAULT 0 CHECK (quantity >= 0),
        minimum_quantity INTEGER NOT NULL DEFAULT 1 CHECK (minimum_quantity >= 0),
        location VARCHAR(150),
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )');

    if ($method === 'GET') {
        $rows = $db->query('SELECT id, category, name, color, compatibility, quantity, minimum_quantity, location, created_at, updated_at
            FROM componentes ORDER BY category, name')->fetchAll();
        enviarJson($rows);
    }

    if ($method === 'POST') {
        $data = validarMaterial(lerJson());
        $statement = $db->prepare('INSERT INTO componentes (category, name, color, compatibility, quantity, minimum_quantity, location)
            VALUES (:category, :name, :color, :compatibility, :quantity, :minimum_quantity, :location) RETURNING id');
        $statement->execute($data);
        enviarJson(['success' => true, 'id' => $statement->fetchColumn(), 'message' => 'Material cadastrado.'], 201);
    }

    if ($method === 'PUT') {
        $id = validarId();
        $data = validarMaterial(lerJson());
        $data['id'] = $id;
        $statement = $db->prepare('UPDATE componentes SET category = :category, name = :name, color = :color,
            compatibility = :compatibility, quantity = :quantity, minimum_quantity = :minimum_quantity,
            location = :location, updated_at = NOW() WHERE id = :id');
        $statement->execute($data);
        if ($statement->rowCount() === 0) {
            $exists = $db->prepare('SELECT 1 FROM componentes WHERE id = :id');
            $exists->execute(['id' => $id]);
            if (!$exists->fetchColumn()) {
                enviarJson(['success' => false, 'message' => 'Material não encontrado.'], 404);
            }
        }
        enviarJson(['success' => true, 'message' => 'Material atualizado.']);
    }

    if ($method === 'DELETE') {
        $statement = $db->prepare('DELETE FROM componentes WHERE id = :id');
        $statement->execute(['id' => validarId()]);
        if ($statement->rowCount() === 0) {
            enviarJson(['success' => false, 'message' => 'Material não encontrado.'], 404);
        }
        enviarJson(['success' => true, 'message' => 'Material excluído.']);
    }

    enviarJson(['success' => false, 'message' => 'Método não permitido.'], 405);
} catch (PDOException $error) {
    erroBanco($error);
}
