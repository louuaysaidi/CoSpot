<?php
require_once '../../config/database.php';

$data = json_decode(file_get_contents("php://input"), true);

if (empty($data['nom']) || empty($data['type']) || empty($data['capacite'])) {
    echo json_encode(["success" => false, "message" => "Les champs Nom, Type et Capacite sont obligatoires."]);
    exit();
}

$description = $data['description'] ?? '';
$statut = $data['statut'] ?? 'actif';

$stmt = $pdo->prepare("INSERT INTO espaces (nom, type, capacite, description, statut) VALUES (?, ?, ?, ?, ?)");
$stmt->execute([$data['nom'], $data['type'], $data['capacite'], $description, $statut]);

echo json_encode([
    "success" => true,
    "message" => "Espace cree avec succes."
]);
?>
