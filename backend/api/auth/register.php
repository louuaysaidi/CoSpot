<?php
require_once '../../config/database.php';

error_log('[REGISTER] Request received at ' . date('Y-m-d H:i:s'));

$data = json_decode(file_get_contents("php://input"), true);

if (!$data) {
    http_response_code(400);
    echo json_encode(["success" => false, "message" => "Requete invalide. Donnees JSON manquantes."]);
    error_log('[REGISTER] Invalid JSON data');
    exit();
}

// Validation
if (empty($data['nom']) || empty($data['prenom']) || empty($data['email']) || empty($data['mot_de_passe'])) {
    http_response_code(400);
    echo json_encode(["success" => false, "message" => "Tous les champs sont obligatoires."]);
    error_log('[REGISTER] Missing required fields');
    exit();
}

if (!filter_var($data['email'], FILTER_VALIDATE_EMAIL)) {
    http_response_code(400);
    echo json_encode(["success" => false, "message" => "Email invalide."]);
    error_log('[REGISTER] Invalid email format: ' . $data['email']);
    exit();
}

if (strlen($data['mot_de_passe']) < 6) {
    http_response_code(400);
    echo json_encode(["success" => false, "message" => "Mot de passe trop court (6 caracteres minimum)."]);
    error_log('[REGISTER] Password too short');
    exit();
}

try {
    // Verifier si email existe deja
    $stmt = $pdo->prepare("SELECT id FROM utilisateurs WHERE email = ?");
    $stmt->execute([$data['email']]);
    if ($stmt->rowCount() > 0) {
        http_response_code(409);
        echo json_encode(["success" => false, "message" => "Cet email est deja utilise."]);
        error_log('[REGISTER] Email already exists: ' . $data['email']);
        exit();
    }

    // Creer le compte
    $hash = password_hash($data['mot_de_passe'], PASSWORD_BCRYPT);
    $stmt = $pdo->prepare("INSERT INTO utilisateurs (nom, prenom, email, mot_de_passe, role) VALUES (?, ?, ?, ?, 'client')");
    $stmt->execute([$data['nom'], $data['prenom'], $data['email'], $hash]);

    $id = $pdo->lastInsertId();

    http_response_code(201);
    echo json_encode([
        "success" => true,
        "message" => "Compte cree avec succes.",
        "id" => (int)$id
    ]);

    error_log('[REGISTER] New user registered: ' . $data['email'] . ' (ID: ' . $id . ')');

} catch (PDOException $e) {
    http_response_code(500);
    error_log('[REGISTER] Database error: ' . $e->getMessage());
    echo json_encode([
        "success" => false,
        "message" => "Erreur du serveur. Veuillez reessayer plus tard."
    ]);
} catch (Exception $e) {
    http_response_code(500);
    error_log('[REGISTER] Unexpected error: ' . $e->getMessage());
    echo json_encode([
        "success" => false,
        "message" => "Erreur du serveur. Veuillez reessayer plus tard."
    ]);
}
?>