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

$stmtEspace = $pdo->prepare("SELECT id, type, capacite FROM espaces WHERE id = ?");
$stmtEspace->execute([$espaceId]);
$espace = $stmtEspace->fetch(PDO::FETCH_ASSOC);

if (!$espace) {
    echo json_encode(["success" => false, "message" => "Espace introuvable."]);
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

if ($espace['type'] === 'open_space' && empty($tables)) {
    $stmtTable = $pdo->prepare("INSERT INTO tables_espace (espace_id, nom, capacite, pos_x, pos_y) VALUES (?, ?, ?, ?, ?)");
    $stmtPoste = $pdo->prepare("INSERT INTO postes (table_id, nom) VALUES (?, ?)");

    $remaining = max(1, (int) $espace['capacite']);
    $tableIndex = 1;
    while ($remaining > 0) {
        $tableCapacite = min(4, $remaining);
        $posX = 40 + (($tableIndex - 1) % 3) * 130;
        $posY = 60 + floor(($tableIndex - 1) / 3) * 160;

        $stmtTable->execute([
            $espaceId,
            'T-' . str_pad((string) $tableIndex, 2, '0', STR_PAD_LEFT),
            $tableCapacite,
            $posX,
            $posY
        ]);

        $tableId = (int) $pdo->lastInsertId();
        for ($posteIndex = 1; $posteIndex <= $tableCapacite; $posteIndex++) {
            $stmtPoste->execute([$tableId, 'S' . $posteIndex]);
        }

        $remaining -= $tableCapacite;
        $tableIndex++;
    }

    $stmtTables->execute([$espaceId]);
    $tables = $stmtTables->fetchAll(PDO::FETCH_ASSOC);
}

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
