<?php
require_once __DIR__ . '/conexao.php';

$method = $_SERVER['REQUEST_METHOD'] ?? 'GET';
if ($method === 'OPTIONS') {
    header('Access-Control-Allow-Origin: *');
    header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
    header('Access-Control-Allow-Headers: Content-Type');
    http_response_code(204);
    exit;
}
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

exigirAutenticacao(1);

function validarImpressora(array $data): array
{
    $fields = ['patrimonio', 'modelo', 'ip', 'mac', 'localizacao', 'tipo'];
    $result = [];
    foreach ($fields as $field) {
        $value = trim((string)($data[$field] ?? ''));
        if ($value === '') {
            enviarJson(['success' => false, 'message' => 'Preencha todos os campos obrigatórios.'], 422);
        }
        $result[$field] = $value;
    }
    $result['disponivel'] = filter_var($data['disponivel'] ?? true, FILTER_VALIDATE_BOOLEAN);
    return $result;
}

function validarIpPrivado(string $ip): bool
{
    if (filter_var($ip, FILTER_VALIDATE_IP, FILTER_FLAG_IPV4) === false) {
        return false;
    }

    return filter_var(
        $ip,
        FILTER_VALIDATE_IP,
        FILTER_FLAG_IPV4 | FILTER_FLAG_NO_PRIV_RANGE | FILTER_FLAG_NO_RES_RANGE
    ) === false;
}

function mapaSnmp(array|false $values, string $columnOid): array
{
    if (!is_array($values)) {
        return [];
    }

    $result = [];
    foreach ($values as $oid => $value) {
        $oid = preg_replace('/^iso\./', '1.', (string)$oid);
        $oid = ltrim($oid, '.');
        $prefix = '1.3.6.1.2.1.43.11.1.1.' . $columnOid . '.';
        if (!str_starts_with($oid, $prefix)) {
            continue;
        }
        $index = substr($oid, strlen($prefix));
        if ($index !== '' && preg_match('/^\d+(?:\.\d+)*$/', $index)) {
            $result[$index] = $value;
        }
    }
    return $result;
}

function inteiroSnmp($value): ?int
{
    if (is_int($value)) {
        return $value;
    }
    if (is_string($value) && preg_match('/-?\d+/', $value, $match)) {
        return (int)$match[0];
    }
    return null;
}

function consultarSuprimentos(string $ip, string $community): array
{
    if (!function_exists('snmp2_real_walk')) {
        enviarJson(['success' => false, 'message' => 'A leitura SNMP não está instalada. Reconstrua o container da aplicação.'], 503);
    }
    if (!validarIpPrivado($ip)) {
        enviarJson(['success' => false, 'message' => 'O IP cadastrado não é um endereço IPv4 privado válido.'], 422);
    }
    if ($community === '' || strlen($community) > 128) {
        enviarJson(['success' => false, 'message' => 'Configure uma comunidade SNMP válida no arquivo .env.'], 503);
    }

    $warning = null;
    set_error_handler(static function (int $severity, string $message) use (&$warning): bool {
        $warning = $message;
        return true;
    });
    try {
        snmp_set_oid_output_format(SNMP_OID_OUTPUT_NUMERIC);
        snmp_set_valueretrieval(SNMP_VALUE_PLAIN);
        $baseOid = '.1.3.6.1.2.1.43.11.1.1.';
        $descriptions = mapaSnmp(snmp2_real_walk($ip, $community, $baseOid . '6', 500000, 0), '6');
        $levels = mapaSnmp(snmp2_real_walk($ip, $community, $baseOid . '9', 500000, 0), '9');
        $capacities = mapaSnmp(snmp2_real_walk($ip, $community, $baseOid . '8', 500000, 0), '8');
    } finally {
        restore_error_handler();
    }

    if ($warning !== null) {
        error_log(sprintf('Falha SNMP ao consultar impressora %s: %s', $ip, $warning));
        enviarJson([
            'success' => false,
            'message' => 'Não foi possível ler os suprimentos. Verifique se SNMP v2c está habilitado na impressora e se SNMP_COMMUNITY está correta.',
        ], 502);
    }
    if (!$descriptions && !$levels && !$capacities) {
        enviarJson([
            'success' => false,
            'message' => 'A impressora não retornou dados de suprimentos. Confirme se ela oferece a Printer-MIB e se o SNMP está habilitado.',
        ], 422);
    }

    $indices = array_unique(array_merge(array_keys($descriptions), array_keys($levels), array_keys($capacities)));
    $supplies = [];
    foreach ($indices as $index) {
        $level = inteiroSnmp($levels[$index] ?? null);
        $capacity = inteiroSnmp($capacities[$index] ?? null);
        $percentage = $level !== null && $capacity !== null && $level >= 0 && $capacity > 0
            ? max(0, min(100, (int)round($level / $capacity * 100)))
            : null;
        $supplies[] = [
            'description' => trim((string)($descriptions[$index] ?? 'Suprimento')),
            'level' => $level,
            'max_capacity' => $capacity,
            'percentage' => $percentage,
        ];
    }

    return $supplies;
}

try {
    $db = conectarBanco();
    $tableExistedValue = $db->query("SELECT to_regclass('public.impressoras') IS NOT NULL")->fetchColumn();
    $tableExisted = in_array($tableExistedValue, [true, 1, '1', 't', 'true'], true);
    $db->exec('CREATE TABLE IF NOT EXISTS impressoras (
        id BIGSERIAL PRIMARY KEY,
        patrimonio VARCHAR(80) NOT NULL UNIQUE,
        modelo VARCHAR(180) NOT NULL,
        ip VARCHAR(80) NOT NULL,
        mac VARCHAR(80) NOT NULL,
        localizacao VARCHAR(180) NOT NULL,
        tipo VARCHAR(80) NOT NULL,
        disponivel BOOLEAN NOT NULL DEFAULT TRUE,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )');

    // Import the four examples that were previously hardcoded in the cards.
    if (!$tableExisted) {
        $seed = $db->prepare('INSERT INTO impressoras (patrimonio, modelo, ip, mac, localizacao, tipo, disponivel)
            VALUES (:patrimonio, :modelo, :ip, :mac, :localizacao, :tipo, :disponivel) ON CONFLICT (patrimonio) DO NOTHING');
        foreach ([
            ['12345', 'HP LaserJet Pro M404dn', '19.90.1.03', '11231dd34ef4', 'Sala 101', 'Laser', true],
            ['67890', 'Brother HL-1202', '19.90.1.04', '11231dd34ef5', 'Sala 202', 'Laser', false],
            ['11223', 'Epson EcoTank L3150', '19.90.1.05', '11231dd34ef6', 'Sala 303', 'Jato de tinta', true],
            ['44556', 'Canon G3111', '19.90.1.06', '11231dd34ef7', 'Sala 404', 'Jato de tinta', false],
        ] as [$patrimonio, $modelo, $ip, $mac, $localizacao, $tipo, $disponivel]) {
            $seed->execute(compact('patrimonio', 'modelo', 'ip', 'mac', 'localizacao', 'tipo', 'disponivel'));
        }
    }

    if ($method === 'GET' && ($_GET['action'] ?? '') === 'supplies') {
        $id = filter_var($_GET['id'] ?? null, FILTER_VALIDATE_INT, ['options' => ['min_range' => 1]]);
        if (!$id) {
            enviarJson(['success' => false, 'message' => 'Identificador de impressora inválido.'], 400);
        }
        $statement = $db->prepare('SELECT modelo, ip FROM impressoras WHERE id = :id');
        $statement->execute(['id' => $id]);
        $printer = $statement->fetch();
        if (!$printer) {
            enviarJson(['success' => false, 'message' => 'Impressora não encontrada.'], 404);
        }

        enviarJson([
            'success' => true,
            'printer' => ['modelo' => $printer['modelo'], 'ip' => $printer['ip']],
            'checked_at' => date(DATE_ATOM),
            'supplies' => consultarSuprimentos($printer['ip'], getenv('SNMP_COMMUNITY') ?: 'public'),
        ]);
    }

    if ($method === 'GET') {
        $rows = $db->query('SELECT id, patrimonio, modelo, ip, mac, localizacao, tipo, disponivel, created_at FROM impressoras ORDER BY modelo')->fetchAll();
        enviarJson($rows);
    }

    if ($method === 'POST') {
        $data = validarImpressora(lerJson());
        $statement = $db->prepare('INSERT INTO impressoras (patrimonio, modelo, ip, mac, localizacao, tipo, disponivel)
            VALUES (:patrimonio, :modelo, :ip, :mac, :localizacao, :tipo, :disponivel) RETURNING id');
        $statement->execute($data);
        enviarJson(['success' => true, 'id' => $statement->fetchColumn(), 'message' => 'Impressora cadastrada.'], 201);
    }

    if ($method === 'PUT') {
        $id = filter_var($_GET['id'] ?? null, FILTER_VALIDATE_INT, ['options' => ['min_range' => 1]]);
        if (!$id) enviarJson(['success' => false, 'message' => 'Identificador de impressora inválido.'], 400);
        $data = validarImpressora(lerJson());
        $data['id'] = $id;
        $statement = $db->prepare('UPDATE impressoras SET patrimonio = :patrimonio, modelo = :modelo, ip = :ip,
            mac = :mac, localizacao = :localizacao, tipo = :tipo, disponivel = :disponivel WHERE id = :id');
        $statement->execute($data);
        if ($statement->rowCount() === 0) {
            $exists = $db->prepare('SELECT 1 FROM impressoras WHERE id = :id');
            $exists->execute(['id' => $id]);
            if (!$exists->fetchColumn()) enviarJson(['success' => false, 'message' => 'Impressora não encontrada.'], 404);
        }
        enviarJson(['success' => true, 'message' => 'Impressora atualizada.']);
    }

    if ($method === 'DELETE') {
        $id = filter_var($_GET['id'] ?? null, FILTER_VALIDATE_INT, ['options' => ['min_range' => 1]]);
        if (!$id) enviarJson(['success' => false, 'message' => 'Identificador de impressora inválido.'], 400);
        $statement = $db->prepare('DELETE FROM impressoras WHERE id = :id');
        $statement->execute(['id' => $id]);
        if ($statement->rowCount() === 0) enviarJson(['success' => false, 'message' => 'Impressora não encontrada.'], 404);
        enviarJson(['success' => true, 'message' => 'Impressora excluída.']);
    }

    enviarJson(['success' => false, 'message' => 'Método não permitido.'], 405);
} catch (PDOException $error) {
    if ($error->getCode() === '23505') {
        enviarJson(['success' => false, 'message' => 'Já existe uma impressora com esse patrimônio.'], 409);
    }
    erroBanco($error);
}
