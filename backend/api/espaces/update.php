<?php
require_once '../../config/database.php';

$data = json_decode(file_get_contents("php://input"), true);

if (empty($data['id']) || empty($data['nom']) || empty($data['type']) || empty($data['capacite'])) {
    echo json_encode(["success" => false, "message" => "Donnees manquantes ou invalides."]);
    exit();
}

$description = $data['description'] ?? '';
$statut = $data['statut'] ?? 'actif';

$stmt = $pdo->prepare("UPDATE espaces SET nom = ?, type = ?, capacite = ?, description = ?, statut = ? WHERE id = ?");
$stmt->execute([$data['nom'], $data['type'], $data['capacite'], $description, $statut, $data['id']]);

echo json_encode([
    "success" => true,
    "message" => "Espace mis a jour."
]);
?>
