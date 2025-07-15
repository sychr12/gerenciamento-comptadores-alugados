<?php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, POST, DELETE, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");
header("Content-Type: application/json; charset=UTF-8");

$conection = new PDO("mysql:host=localhost;dbname=testelogin", "root", "");

$comand = $conection->query("SELECT id, nome, senha, nivel, reset FROM usuarios");
$users = $comand->fetchAll(PDO::FETCH_ASSOC);

echo json_encode($users);
?>