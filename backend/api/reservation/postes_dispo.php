<?php
require_once '../../config/database.php';

$espaceId = $_GET['espace_id'] ?? null;
$date     = $_GET['date'] ?? null;
$heureDebut = $_GET['heure_debut'] ?? '08:00';
$heureFin   = $_GET['heure_fin'] ?? '18:00';

if (!$espaceId || !$date) {
    echo json_encode(["success" => false, "message" => "espace_id et date sont requis."]);
    exit();
}

// Get tables for this espace
$stmtTables = $pdo->prepare("
    SELECT t.*, e.nom as espace_nom
    FROM tables_espace t
    JOIN espaces e ON t.espace_id = e.id
    WHERE t.espace_id = ?
    ORDER BY t.pos_y, t.pos_x
");
$stmtTables->execute([$espaceId]);
$tables = $stmtTables->fetchAll(PDO::FETCH_ASSOC);

// Get all postes for these tables
$tableIds = array_column($tables, 'id');
$postes = [];

if (!empty($tableIds)) {
    $placeholders = implode(',', array_fill(0, count($tableIds), '?'));
    $stmtPostes = $pdo->prepare("SELECT * FROM postes WHERE table_id IN ($placeholders)");
    $stmtPostes->execute($tableIds);
    $postes = $stmtPostes->fetchAll(PDO::FETCH_ASSOC);
}

// Get reserved poste IDs for this date
$stmtReserved = $pdo->prepare("
    SELECT rp.poste_id
    FROM reservation_postes rp
    JOIN reservations r ON rp.reservation_id = r.id
    WHERE r.espace_id = ?
      AND r.date_reservation = ?
      AND r.heure_debut < ?
      AND r.heure_fin > ?
      AND r.statut = 'active'
");
$stmtReserved->execute([$espaceId, $date, $heureFin, $heureDebut]);
$reservedIds = $stmtReserved->fetchAll(PDO::FETCH_COLUMN);

// Build result: tables with postes and availability
$result = [];
foreach ($tables as $table) {
    $tablePostes = array_filter($postes, fn($p) => $p['table_id'] == $table['id']);
    $enriched = [];
    foreach ($tablePostes as $p) {
        $p['disponible'] = !in_array($p['id'], $reservedIds);
        $enriched[] = $p;
    }
    $table['postes'] = array_values($enriched);
    $result[] = $table;
}

echo json_encode([
    "success" => true,
    "data"    => $result
]);
?>
