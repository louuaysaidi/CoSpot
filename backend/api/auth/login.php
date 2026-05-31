<?php
require_once '../../config/database.php';

// Log incoming request (for debugging)
error_log('[LOGIN] Request received at ' . date('Y-m-d H:i:s'));

$data = json_decode(file_get_contents("php://input"), true);

if (!$data) {
    http_response_code(400);
    echo json_encode(["success" => false, "message" => "Requete invalide. Donnees JSON manquantes."]);
    error_log('[LOGIN] Invalid JSON data');
    exit();
}

if (empty($data['email']) || empty($data['mot_de_passe'])) {
    http_response_code(400);
    echo json_encode(["success" => false, "message" => "Email et mot de passe obligatoires."]);
    error_log('[LOGIN] Missing email or password for: ' . ($data['email'] ?? 'unknown'));
    exit();
}

try {
    // Chercher l'utilisateur
    $stmt = $pdo->prepare("SELECT * FROM utilisateurs WHERE email = ?");
    $stmt->execute([$data['email']]);
    $user = $stmt->fetch(PDO::FETCH_ASSOC);

    if (!$user) {
        http_response_code(401);
        echo json_encode(["success" => false, "message" => "Email ou mot de passe incorrect."]);
        error_log('[LOGIN] User not found: ' . $data['email']);
        exit();
    }

    // Verifier le statut du compte
    if (!isset($user['statut']) || $user['statut'] === 'gele') {
        http_response_code(403);
        echo json_encode(["success" => false, "message" => "Votre compte est gele. Contactez l'administrateur."]);
        error_log('[LOGIN] Account frozen: ' . $data['email']);
        exit();
    }

    // Verifier le mot de passe
    if (!password_verify($data['mot_de_passe'], $user['mot_de_passe'])) {
        http_response_code(401);
        echo json_encode(["success" => false, "message" => "Email ou mot de passe incorrect."]);
        error_log('[LOGIN] Invalid password for: ' . $data['email']);
        exit();
    }

    // Generer un token (base64)
    $payload = [
        "id"     => (int)$user['id'],
        "nom"    => $user['nom'],
        "prenom" => $user['prenom'],
        "email"  => $user['email'],
        "role"   => $user['role'],
        "exp"    => time() + (60 * 60 * 24) // 24h
    ];

    $token = base64_encode(json_encode($payload));

    http_response_code(200);
    echo json_encode([
        "success" => true,
        "message" => "Connexion reussie.",
        "token"   => $token,
        "user"    => [
            "id"     => (int)$user['id'],
            "nom"    => $user['nom'],
            "prenom" => $user['prenom'],
            "email"  => $user['email'],
            "role"   => $user['role']
        ]
    ]);

    error_log('[LOGIN] Successful login for: ' . $data['email'] . ' (role: ' . $user['role'] . ')');

} catch (PDOException $e) {
    http_response_code(500);
    error_log('[LOGIN] Database error: ' . $e->getMessage());
    echo json_encode([
        "success" => false,
        "message" => "Erreur du serveur. Veuillez reessayer plus tard."
    ]);
} catch (Exception $e) {
    http_response_code(500);
    error_log('[LOGIN] Unexpected error: ' . $e->getMessage());
    echo json_encode([
        "success" => false,
        "message" => "Erreur du serveur. Veuillez reessayer plus tard."
    ]);
}
?>