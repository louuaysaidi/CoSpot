<?php
require_once '../../config/database.php';

$stmt = $pdo->query("
    SELECT id, nom, type, capacite, description, statut, date_creation
    FROM espaces
    ORDER BY date_creation DESC
");

echo json_encode([
    "success" => true,
    "data"    => $stmt->fetchAll(PDO::FETCH_ASSOC)
]);
?>
