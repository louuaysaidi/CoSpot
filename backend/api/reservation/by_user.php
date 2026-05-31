<?php
require_once '../../config/database.php';

$userId = $_GET['user_id'] ?? null;

if (!$userId) {
    echo json_encode(["success" => false, "message" => "user_id est requis."]);
    exit();
}

$stmt = $pdo->prepare("
    SELECT r.*,
           e.nom as espace_nom, e.type as espace_type
    FROM reservations r
    JOIN espaces e ON r.espace_id = e.id
    WHERE r.utilisateur_id = ?
    ORDER BY r.date_creation DESC
");
$stmt->execute([$userId]);

echo json_encode([
    "success" => true,
    "data"    => $stmt->fetchAll(PDO::FETCH_ASSOC)
]);
?>
