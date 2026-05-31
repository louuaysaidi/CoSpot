<?php
require_once '../../config/database.php';

$data = json_decode(file_get_contents("php://input"), true);

if (empty($data['nom']) || empty($data['type']) || empty($data['capacite'])) {
    echo json_encode(["success" => false, "message" => "Les champs Nom, Type et Capacite sont obligatoires."]);
    exit();
}

$description = $data['description'] ?? '';
$statut = $data['statut'] ?? 'actif';
$capacite = max(1, (int) $data['capacite']);

try {
    $pdo->beginTransaction();

    $stmt = $pdo->prepare("INSERT INTO espaces (nom, type, capacite, description, statut) VALUES (?, ?, ?, ?, ?)");
    $stmt->execute([$data['nom'], $data['type'], $capacite, $description, $statut]);
    $espaceId = (int) $pdo->lastInsertId();

    if ($data['type'] === 'open_space') {
        $stmtTable = $pdo->prepare("INSERT INTO tables_espace (espace_id, nom, capacite, pos_x, pos_y) VALUES (?, ?, ?, ?, ?)");
        $stmtPoste = $pdo->prepare("INSERT INTO postes (table_id, nom) VALUES (?, ?)");

        $remaining = $capacite;
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
    }

    $pdo->commit();

    echo json_encode([
        "success" => true,
        "message" => "Espace cree avec succes."
    ]);
} catch (Exception $e) {
    $pdo->rollBack();
    echo json_encode(["success" => false, "message" => "Erreur: " . $e->getMessage()]);
}
?>
