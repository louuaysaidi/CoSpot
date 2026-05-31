<?php
require_once '../../config/database.php';

$data = json_decode(file_get_contents("php://input"), true);

$id = $data['id'] ?? null;
$userId = $data['utilisateur_id'] ?? null;

if (!$id || !$userId) {
    echo json_encode(["success" => false, "message" => "id et utilisateur_id sont requis."]);
    exit();
}

// Only allow cancelling own reservation
$stmt = $pdo->prepare("UPDATE reservations SET statut = 'annulee' WHERE id = ? AND utilisateur_id = ? AND statut = 'active'");
$stmt->execute([$id, $userId]);

if ($stmt->rowCount() > 0) {
    echo json_encode(["success" => true, "message" => "Reservation annulee."]);
} else {
    echo json_encode(["success" => false, "message" => "Reservation introuvable ou deja annulee."]);
}
?>
