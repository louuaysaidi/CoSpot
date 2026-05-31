<?php
require_once '../../config/database.php';

$data = json_decode(file_get_contents("php://input"), true);

// Validation
if (empty($data['utilisateur_id']) || empty($data['espace_id']) || empty($data['date_reservation'])
    || empty($data['duree']) || empty($data['heure_debut']) || empty($data['heure_fin'])) {
    echo json_encode(["success" => false, "message" => "Tous les champs sont obligatoires."]);
    exit();
}

try {
    $pdo->beginTransaction();

    $posteIds = [];
    if (!empty($data['postes']) && is_array($data['postes'])) {
        $posteIds = array_values(array_unique(array_map('intval', $data['postes'])));
        $placeholders = implode(',', array_fill(0, count($posteIds), '?'));

        $stmtPostesInfo = $pdo->prepare("
            SELECT COUNT(*) AS nb_postes, COUNT(DISTINCT p.table_id) AS nb_tables
            FROM postes p
            JOIN tables_espace t ON p.table_id = t.id
            WHERE p.id IN ($placeholders)
              AND t.espace_id = ?
        ");
        $stmtPostesInfo->execute([...$posteIds, $data['espace_id']]);
        $postesInfo = $stmtPostesInfo->fetch(PDO::FETCH_ASSOC);

        if ((int) $postesInfo['nb_postes'] !== count($posteIds)) {
            echo json_encode(["success" => false, "message" => "Un ou plusieurs postes ne correspondent pas a l'espace choisi."]);
            $pdo->rollBack();
            exit();
        }

        if ((int) $postesInfo['nb_tables'] > 1) {
            echo json_encode(["success" => false, "message" => "Vous pouvez reserver des postes dans une seule table."]);
            $pdo->rollBack();
            exit();
        }

        $stmtReserved = $pdo->prepare("
            SELECT COUNT(*)
            FROM reservation_postes rp
            JOIN reservations r ON rp.reservation_id = r.id
            WHERE rp.poste_id IN ($placeholders)
              AND r.espace_id = ?
              AND r.date_reservation = ?
              AND r.statut = 'active'
        ");
        $stmtReserved->execute([...$posteIds, $data['espace_id'], $data['date_reservation']]);
        if ((int) $stmtReserved->fetchColumn() > 0) {
            echo json_encode(["success" => false, "message" => "Un ou plusieurs postes sont deja reserves pour cette date."]);
            $pdo->rollBack();
            exit();
        }
    }

    // Insert reservation
    $stmt = $pdo->prepare("
        INSERT INTO reservations (utilisateur_id, espace_id, date_reservation, duree, heure_debut, heure_fin, statut)
        VALUES (?, ?, ?, ?, ?, ?, 'active')
    ");
    $stmt->execute([
        $data['utilisateur_id'],
        $data['espace_id'],
        $data['date_reservation'],
        $data['duree'],
        $data['heure_debut'],
        $data['heure_fin']
    ]);

    $reservationId = $pdo->lastInsertId();

    // Insert reserved postes if provided
    if (!empty($posteIds)) {
        $stmtPoste = $pdo->prepare("INSERT INTO reservation_postes (reservation_id, poste_id) VALUES (?, ?)");
        foreach ($posteIds as $posteId) {
            $stmtPoste->execute([$reservationId, $posteId]);
        }
    }

    $pdo->commit();

    echo json_encode([
        "success" => true,
        "message" => "Reservation creee avec succes.",
        "reservation_id" => $reservationId
    ]);

} catch (Exception $e) {
    $pdo->rollBack();
    echo json_encode(["success" => false, "message" => "Erreur: " . $e->getMessage()]);
}
?>
