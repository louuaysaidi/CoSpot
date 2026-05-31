<?php
require_once '../../config/database.php';

$data = json_decode(file_get_contents("php://input"), true);

if (!$data) {
    http_response_code(400);
    echo json_encode(["success" => false, "message" => "Requete invalide. Donnees JSON manquantes."]);
    exit();
}

if (empty($data['email']) || empty($data['mot_de_passe'])) {
    http_response_code(400);
    echo json_encode(["success" => false, "message" => "Email et mot de passe obligatoires."]);
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
        exit();
    }

    // Verifier le statut du compte
    if (!isset($user['statut']) || $user['statut'] === 'gele') {
        http_response_code(403);
        echo json_encode(["success" => false, "message" => "Votre compte est gele. Contactez l'administrateur."]);
        exit();
    }

    // Verifier le mot de passe
    if (!password_verify($data['mot_de_passe'], $user['mot_de_passe'])) {
        http_response_code(401);
        echo json_encode(["success" => false, "message" => "Email ou mot de passe incorrect."]);
        exit();
    }

    // Generer un token (base64)
    $payload = [
        "id"     => (int)$user['id'],
        "nom"    => $user['nom'],
        "prenom" => $user['prenom'],
        "email"  => $user['email'],
        "telephone" => $user['telephone'] ?? null,
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
            "telephone" => $user['telephone'] ?? null,
            "role"   => $user['role']
        ]
    ]);

} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode([
        "success" => false,
        "message" => "Erreur du serveur. Veuillez reessayer plus tard."
    ]);
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        "success" => false,
        "message" => "Erreur du serveur. Veuillez reessayer plus tard."
    ]);
}
?>
