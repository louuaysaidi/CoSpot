<?php

header("Access-Control-Allow-Origin: http://localhost:4200");
header("Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization");
header("Content-Type: application/json");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

$host = "localhost";
$db_name = "cospot_db";
$username = "root";
$password = "";

try {
    $pdo = new PDO(
        "mysql:host=$host;dbname=$db_name;charset=utf8mb4",
        $username,
        $password,
        [
            PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
            PDO::ATTR_EMULATE_PREPARES => false
        ]
    );

    error_log('[DB] Connected successfully to ' . $db_name . ' at ' . $host);

} catch (PDOException $e) {
    error_log('[DB] Connection failed: ' . $e->getMessage());

    http_response_code(500);
    echo json_encode([
        "success" => false,
        "message" => "Erreur connexion base de donnees. Verificatioin rapide : \n" .
                     "1. Est-ce que MySQL est lancé?\n" .
                     "2. Est-ce que la base 'cospot_db' existe?\n" .
                     "3. Est-ce que l'utilisateur 'root' est correct?",
        "error" => $e->getMessage()
    ]);
    exit();
}
?>