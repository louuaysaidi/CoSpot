<?php
require_once '../../config/database.php';

$data = json_decode(file_get_contents("php://input"), true);

if (empty($data['id'])) {
    echo json_encode(["success" => false, "message" => "ID manquant."]);
    exit();
}

$stmt = $pdo->prepare("DELETE FROM espaces WHERE id = ?");
$stmt->execute([$data['id']]);

echo json_encode([
    "success" => true,
    "message" => "Espace supprime."
]);
?>
