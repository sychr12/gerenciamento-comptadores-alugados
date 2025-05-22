<?php
session_start();

// Inicializa o contador se não existir
if (!isset($_SESSION['contador'])) {
    $_SESSION['contador'] = 0;
}

// Aumenta o contador
$_SESSION['contador']++;

// Retorna os dados novos
header('Content-Type: application/json');
echo json_encode([
    'contador' => $_SESSION['contador'],
    'hora' => date('H:i:s')
]);
exit; // Boa prática para garantir que nada mais seja enviado
?>