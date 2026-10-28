<?php
require_once __DIR__ . '/conexao.php';
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

$method = $_SERVER['REQUEST_METHOD'] ?? 'GET';
if ($method === 'OPTIONS') {
    http_response_code(204);
    exit;
}

exigirAutenticacao(1);

function campoTexto(array $data, string $key): string
{
    $value = $data[$key] ?? '';
    return is_scalar($value) ? trim((string)$value) : '';
}

function comprimentoTexto(string $value): int
{
    if (function_exists('mb_strlen')) {
        return mb_strlen($value, 'UTF-8');
    }
    preg_match_all('/./us', $value, $matches);
    return count($matches[0]);
}

function dataValida(string $value): bool
{
    if ($value === '') {
        return true;
    }
    $date = DateTimeImmutable::createFromFormat('!Y-m-d', $value);
    return $date !== false && $date->format('Y-m-d') === $value;
}

function atualizarSchemaComputadores(PDO $db): void
{
    $db->exec('ALTER TABLE computadores
        ADD COLUMN IF NOT EXISTS "replacementName" VARCHAR(150) NOT NULL DEFAULT \'\',
        ADD COLUMN IF NOT EXISTS "replacementModel" VARCHAR(100) NOT NULL DEFAULT \'\',
        ADD COLUMN IF NOT EXISTS "replacementDate" DATE,
        ADD COLUMN IF NOT EXISTS ownership VARCHAR(20) NOT NULL DEFAULT \'Alugado\'');
}

try {
    $db = conectarBanco();

    if ($method === 'GET') {
        atualizarSchemaComputadores($db);
        $statement = $db->query('SELECT id, status, model, ownership, "entryDate", "Resp", "Setor", pronto, "exitDate", saidamt, "Patrimonio", "replacementName", "replacementModel", "replacementDate", obs FROM computadores ORDER BY id');
        enviarJson($statement->fetchAll());
    }

    if ($method === 'POST') {
        atualizarSchemaComputadores($db);
        $data = lerJson();
        $id = filter_var($data['id'] ?? null, FILTER_VALIDATE_INT, ['options' => ['min_range' => 1]]);
        if (!$id) {
            enviarJson(['success' => false, 'erro' => 'Informe um patrimônio válido.'], 400);
        }

        $computer = [
            'status' => campoTexto($data, 'status'),
            'model' => campoTexto($data, 'model'),
            'ownership' => campoTexto($data, 'ownership') ?: 'Alugado',
            'entryDate' => campoTexto($data, 'entryDate'),
            'Resp' => campoTexto($data, 'Resp'),
            'Setor' => campoTexto($data, 'Setor'),
            'pronto' => campoTexto($data, 'pronto'),
            'exitDate' => campoTexto($data, 'exitDate'),
            'saidamt' => campoTexto($data, 'saidamt'),
            'Patrimonio' => campoTexto($data, 'Patrimonio'),
            'replacementName' => campoTexto($data, 'replacementName'),
            'replacementModel' => campoTexto($data, 'replacementModel'),
            'replacementDate' => campoTexto($data, 'replacementDate'),
            'obs' => campoTexto($data, 'obs'),
        ];
        if (!in_array($computer['status'], ['Notebook', 'Desktop'], true)
            || !in_array($computer['model'], ['Compaq', 'Positivo'], true)
            || !in_array($computer['ownership'], ['Alugado', 'Próprio'], true)
            || !in_array($computer['pronto'], ['ativo', 'danificado', 'desativado', 'Substituído', 'substituído', 'substituido'], true)
            || !in_array($computer['saidamt'], ['', 'Defeito', 'Upgrade', 'Troca'], true)
            || $computer['entryDate'] === '' || $computer['Resp'] === '' || $computer['Setor'] === '') {
            enviarJson(['success' => false, 'message' => 'Confira tipo, modelo, status, responsável e setor.'], 422);
        }
        if (!dataValida($computer['entryDate']) || !dataValida($computer['exitDate'])
            || !dataValida($computer['replacementDate'])) {
            enviarJson(['success' => false, 'message' => 'Informe as datas no formato válido.'], 422);
        }
        $hasSubstitutionData = $computer['Patrimonio'] !== '' || $computer['replacementName'] !== ''
            || $computer['replacementModel'] !== '' || $computer['replacementDate'] !== '';
        if ($hasSubstitutionData && ($computer['Patrimonio'] === '' || $computer['replacementName'] === ''
            || $computer['replacementModel'] === '' || $computer['replacementDate'] === '')) {
            enviarJson(['success' => false, 'message' => 'Preencha patrimônio, nome, modelo e data da máquina substituta.'], 422);
        }
        if (comprimentoTexto($computer['status']) > 30 || comprimentoTexto($computer['model']) > 100
            || comprimentoTexto($computer['ownership']) > 20
            || comprimentoTexto($computer['Resp']) > 150 || comprimentoTexto($computer['Setor']) > 120
            || comprimentoTexto($computer['pronto']) > 30 || comprimentoTexto($computer['saidamt']) > 80
            || comprimentoTexto($computer['Patrimonio']) > 100 || comprimentoTexto($computer['replacementName']) > 150
            || comprimentoTexto($computer['replacementModel']) > 100) {
            enviarJson(['success' => false, 'message' => 'Um ou mais campos excedem o limite permitido.'], 422);
        }

        $sql = 'INSERT INTO computadores (id, status, model, ownership, "entryDate", "Resp", "Setor", pronto, "exitDate", saidamt, "Patrimonio", "replacementName", "replacementModel", "replacementDate", obs)
                VALUES (:id, :status, :model, :ownership, :entryDate, :Resp, :Setor, :pronto, :exitDate, :saidamt, :Patrimonio, :replacementName, :replacementModel, :replacementDate, :obs)
                ON CONFLICT (id) DO UPDATE SET status = EXCLUDED.status, model = EXCLUDED.model, ownership = EXCLUDED.ownership,
                "entryDate" = EXCLUDED."entryDate", "Resp" = EXCLUDED."Resp", "Setor" = EXCLUDED."Setor",
                pronto = EXCLUDED.pronto, "exitDate" = EXCLUDED."exitDate", saidamt = EXCLUDED.saidamt,
                "Patrimonio" = EXCLUDED."Patrimonio", "replacementName" = EXCLUDED."replacementName",
                "replacementModel" = EXCLUDED."replacementModel", "replacementDate" = EXCLUDED."replacementDate",
                obs = EXCLUDED.obs';
        $statement = $db->prepare($sql);
        $statement->execute([
            'id' => $id,
            'status' => $computer['status'],
            'model' => $computer['model'],
            'ownership' => $computer['ownership'],
            'entryDate' => $computer['entryDate'],
            'Resp' => $computer['Resp'],
            'Setor' => $computer['Setor'],
            'pronto' => $computer['pronto'],
            'exitDate' => $computer['exitDate'] !== '' ? $computer['exitDate'] : null,
            'saidamt' => $computer['saidamt'],
            'Patrimonio' => $computer['Patrimonio'] !== '' && $computer['Patrimonio'] !== '-' ? $computer['Patrimonio'] : null,
            'replacementName' => $computer['replacementName'],
            'replacementModel' => $computer['replacementModel'],
            'replacementDate' => $computer['replacementDate'] !== '' ? $computer['replacementDate'] : null,
            'obs' => $computer['obs'],
        ]);
        enviarJson(['success' => true, 'mensagem' => 'Computador salvo com sucesso.']);
    }

    if ($method === 'DELETE') {
        $id = filter_var($_GET['id'] ?? null, FILTER_VALIDATE_INT, ['options' => ['min_range' => 1]]);
        if (!$id) {
            enviarJson(['success' => false, 'erro' => 'ID inválido.'], 400);
        }
        $statement = $db->prepare('DELETE FROM computadores WHERE id = :id');
        $statement->execute(['id' => $id]);
        if ($statement->rowCount() === 0) {
            enviarJson(['success' => false, 'erro' => 'Computador não encontrado.'], 404);
        }
        enviarJson(['success' => true, 'mensagem' => 'Computador excluído com sucesso.']);
    }

    enviarJson(['success' => false, 'erro' => 'Método não permitido.'], 405);
} catch (PDOException $error) {
    erroBanco($error);
}
