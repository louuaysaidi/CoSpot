<?php
require_once '../../config/database.php';

$data = json_decode(file_get_contents("php://input"), true);

if (!$data || empty($data['email'])) {
    http_response_code(400);
    echo json_encode(["success" => false, "message" => "Email manquant"]);
    exit();
}

$email = strtolower(trim($data['email']));

if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
    http_response_code(400);
    echo json_encode(["success" => false, "message" => "Email invalide"]);
    exit();
}

try {
    $stmt = $pdo->prepare("SELECT id FROM utilisateurs WHERE email = ?");
    $stmt->execute([$email]);
    $exists = $stmt->rowCount() > 0;

    http_response_code(200);
    echo json_encode([
        "success" => true,
        "exists" => $exists
    ]);

} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode([
        "success" => false,
        "message" => "Erreur du serveur"
    ]);
}
?>
