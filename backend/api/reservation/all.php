<?php
require_once '../../config/database.php';

$stmt = $pdo->query("
    SELECT r.*, 
           u.nom, u.prenom, u.email,
           e.nom as espace_nom
    FROM reservations r
    JOIN utilisateurs u ON r.utilisateur_id = u.id
    JOIN espaces e      ON r.espace_id = e.id
    ORDER BY r.date_creation DESC
");

echo json_encode([
    "success" => true,
    "data"    => $stmt->fetchAll(PDO::FETCH_ASSOC)
]);
?>