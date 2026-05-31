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
    if (!empty($data['postes']) && is_array($data['postes'])) {
        $stmtPoste = $pdo->prepare("INSERT INTO reservation_postes (reservation_id, poste_id) VALUES (?, ?)");
        foreach ($data['postes'] as $posteId) {
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
