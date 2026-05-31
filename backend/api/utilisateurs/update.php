<?php
require_once '../../config/database.php';

$data = json_decode(file_get_contents("php://input"), true);

if (empty($data['id']) || empty($data['statut'])) {
    echo json_encode(["success" => false, "message" => "Donnees manquantes."]);
    exit();
}

$stmt = $pdo->prepare("UPDATE utilisateurs SET statut = ? WHERE id = ?");
$stmt->execute([$data['statut'], $data['id']]);

echo json_encode([
    "success" => true,
    "message" => "Statut mis a jour."
]);
?>
