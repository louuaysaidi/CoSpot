<?php
require_once '../../config/database.php';

$stmt = $pdo->query("
    SELECT id, nom, prenom, email, telephone, role, statut, date_inscription
    FROM utilisateurs
    ORDER BY date_inscription DESC
");

echo json_encode([
    "success" => true,
    "data"    => $stmt->fetchAll(PDO::FETCH_ASSOC)
]);
?>
