<?php
require_once '../../config/database.php';

$id = isset($_GET['id']) ? intval($_GET['id']) : 0;
if (!$id) {
    echo json_encode(['success' => false, 'message' => 'ID manquant']);
    exit;
}

// Main reservation info with espace details and user
$stmt = $pdo->prepare("
    SELECT r.*,
           u.nom, u.prenom, u.email, u.telephone,
           e.nom         AS espace_nom,
           e.type        AS espace_type,
           e.capacite    AS espace_capacite,
           e.description AS espace_description
    FROM reservations r
    JOIN utilisateurs u ON r.utilisateur_id = u.id
    JOIN espaces e      ON r.espace_id      = e.id
    WHERE r.id = ?
");
$stmt->execute([$id]);
$reservation = $stmt->fetch(PDO::FETCH_ASSOC);

if (!$reservation) {
    echo json_encode(['success' => false, 'message' => 'Réservation introuvable']);
    exit;
}

// Postes réservés avec table et salle
$stmt2 = $pdo->prepare("
    SELECT p.id   AS poste_id,
           p.nom  AS poste_nom,
           t.id   AS table_id,
           t.nom  AS table_nom,
           t.capacite AS table_capacite
    FROM reservation_postes rp
    JOIN postes          p ON rp.poste_id = p.id
    JOIN tables_espace   t ON p.table_id  = t.id
    WHERE rp.reservation_id = ?
    ORDER BY t.nom, p.nom
");
$stmt2->execute([$id]);
$postes = $stmt2->fetchAll(PDO::FETCH_ASSOC);

// Group postes by table
$tables = [];
foreach ($postes as $p) {
    $tid = $p['table_id'];
    if (!isset($tables[$tid])) {
        $tables[$tid] = [
            'id'       => $p['table_id'],
            'nom'      => $p['table_nom'],
            'capacite' => $p['table_capacite'],
            'postes'   => []
        ];
    }
    $tables[$tid]['postes'][] = [
        'id'  => $p['poste_id'],
        'nom' => $p['poste_nom']
    ];
}

$reservation['postes']  = $postes;
$reservation['tables']  = array_values($tables);
$reservation['nb_postes'] = count($postes);

echo json_encode(['success' => true, 'data' => $reservation]);
?>
