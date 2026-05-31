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

    $heureDebut = $data['heure_debut'];
    $heureFin = $data['heure_fin'];

    if ($heureDebut >= $heureFin) {
        echo json_encode(["success" => false, "message" => "Horaire de reservation invalide."]);
        $pdo->rollBack();
        exit();
    }

    $stmtEspace = $pdo->prepare("SELECT id, type FROM espaces WHERE id = ?");
    $stmtEspace->execute([$data['espace_id']]);
    $espace = $stmtEspace->fetch(PDO::FETCH_ASSOC);

    if (!$espace) {
        echo json_encode(["success" => false, "message" => "Espace introuvable."]);
        $pdo->rollBack();
        exit();
    }

    if ($espace['type'] !== 'open_space') {
        $stmtUserConflict = $pdo->prepare("
            SELECT COUNT(*)
            FROM reservations
            WHERE utilisateur_id = ?
              AND date_reservation = ?
              AND heure_debut < ?
              AND heure_fin > ?
              AND statut = 'active'
        ");
        $stmtUserConflict->execute([
            $data['utilisateur_id'],
            $data['date_reservation'],
            $heureFin,
            $heureDebut
        ]);

        if ((int) $stmtUserConflict->fetchColumn() > 0) {
            echo json_encode(["success" => false, "message" => "Vous avez deja une reservation sur ce jour et ce creneau horaire."]);
            $pdo->rollBack();
            exit();
        }

        $stmtEspaceConflict = $pdo->prepare("
            SELECT COUNT(*)
            FROM reservations
            WHERE espace_id = ?
              AND date_reservation = ?
              AND heure_debut < ?
              AND heure_fin > ?
              AND statut = 'active'
        ");
        $stmtEspaceConflict->execute([
            $data['espace_id'],
            $data['date_reservation'],
            $heureFin,
            $heureDebut
        ]);

        if ((int) $stmtEspaceConflict->fetchColumn() > 0) {
            echo json_encode(["success" => false, "message" => "Cet espace est deja reserve sur ce creneau horaire."]);
            $pdo->rollBack();
            exit();
        }
    }

    $posteIds = [];
    $selectedTableId = null;
    if (!empty($data['postes']) && is_array($data['postes'])) {
        $posteIds = array_values(array_unique(array_map('intval', $data['postes'])));
        $placeholders = implode(',', array_fill(0, count($posteIds), '?'));

        $stmtPostesInfo = $pdo->prepare("
            SELECT COUNT(*) AS nb_postes, COUNT(DISTINCT p.table_id) AS nb_tables, MIN(p.table_id) AS table_id
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

        $selectedTableId = (int) $postesInfo['table_id'];

        $stmtRoomConflict = $pdo->prepare("
            SELECT COUNT(*)
            FROM reservations r
            LEFT JOIN reservation_postes rp ON rp.reservation_id = r.id
            WHERE r.utilisateur_id = ?
              AND r.date_reservation = ?
              AND r.statut = 'active'
              AND rp.id IS NULL
        ");
        $stmtRoomConflict->execute([$data['utilisateur_id'], $data['date_reservation']]);

        if ((int) $stmtRoomConflict->fetchColumn() > 0) {
            echo json_encode(["success" => false, "message" => "Vous avez deja une reservation d'espace sur cette date."]);
            $pdo->rollBack();
            exit();
        }

        $stmtUserTables = $pdo->prepare("
            SELECT DISTINCT p.table_id
            FROM reservations r
            JOIN reservation_postes rp ON rp.reservation_id = r.id
            JOIN postes p ON p.id = rp.poste_id
            WHERE r.utilisateur_id = ?
              AND r.date_reservation = ?
              AND r.statut = 'active'
        ");
        $stmtUserTables->execute([$data['utilisateur_id'], $data['date_reservation']]);
        $reservedTableIds = array_map('intval', $stmtUserTables->fetchAll(PDO::FETCH_COLUMN));

        if (!empty($reservedTableIds) && !in_array($selectedTableId, $reservedTableIds, true)) {
            echo json_encode(["success" => false, "message" => "Vous pouvez reserver une seule table par jour. Continuez sur la meme table."]);
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
              AND r.heure_debut < ?
              AND r.heure_fin > ?
              AND r.statut = 'active'
        ");
        $stmtReserved->execute([...$posteIds, $data['espace_id'], $data['date_reservation'], $heureFin, $heureDebut]);
        if ((int) $stmtReserved->fetchColumn() > 0) {
            echo json_encode(["success" => false, "message" => "Un ou plusieurs postes sont deja reserves pour ce creneau horaire."]);
            $pdo->rollBack();
            exit();
        }
    } elseif ($espace['type'] === 'open_space') {
        echo json_encode(["success" => false, "message" => "Veuillez selectionner au moins un poste."]);
        $pdo->rollBack();
        exit();
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
        $heureDebut,
        $heureFin
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
