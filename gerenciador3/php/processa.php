<?php
require_once __DIR__ . '/conexao.php';

// This legacy endpoint used to return every user's plaintext password.
// Login now uses login_api.php, which verifies one account server-side.
enviarJson([
    'success' => false,
    'message' => 'Este endpoint foi desativado. Use o fluxo de autenticação atualizado.'
], 410);