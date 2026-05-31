<?php
require_once '../../config/database.php';

$data = json_decode(file_get_contents("php://input"), true);

if (!$data) {
    http_response_code(400);
    echo json_encode(["success" => false, "message" => "Requête invalide. Données JSON manquantes."]);
    exit();
}

$email = strtolower(trim($data['email'] ?? ''));
$telephone = trim($data['telephone'] ?? '');

// Validation
if (empty($data['nom']) || empty($data['prenom']) || empty($email) || empty($telephone) || empty($data['mot_de_passe'])) {
    http_response_code(400);
    echo json_encode(["success" => false, "message" => "Tous les champs sont obligatoires, téléphone inclus."]);
    exit();
}

if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
    http_response_code(400);
    echo json_encode(["success" => false, "message" => "E-mail invalide."]);
    exit();
}

if (strlen($data['mot_de_passe']) < 6) {
    http_response_code(400);
    echo json_encode(["success" => false, "message" => "Mot de passe trop court (6 caractères minimum)."]);
    exit();
}

try {
    // Verifier si email existe deja
    $stmt = $pdo->prepare("SELECT id FROM utilisateurs WHERE email = ?");
    $stmt->execute([$email]);
    if ($stmt->rowCount() > 0) {
        echo json_encode(["success" => false, "message" => "Cet e-mail est déjà utilisé."]);
        exit();
    }

    // Creer le compte
    $hash = password_hash($data['mot_de_passe'], PASSWORD_BCRYPT);
    $stmt = $pdo->prepare("INSERT INTO utilisateurs (nom, prenom, email, telephone, mot_de_passe, role) VALUES (?, ?, ?, ?, ?, 'client')");
    $stmt->execute([trim($data['nom']), trim($data['prenom']), $email, $telephone, $hash]);

    $id = $pdo->lastInsertId();

    http_response_code(201);
    echo json_encode([
        "success" => true,
        "message" => "Compte créé avec succès.",
        "id" => (int)$id
    ]);

} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode([
        "success" => false,
        "message" => $e->getCode() === '23000' ? "Cet e-mail est déjà utilisé." : "Erreur du serveur. Veuillez réessayer plus tard."
    ]);
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        "success" => false,
        "message" => "Erreur du serveur. Veuillez réessayer plus tard."
    ]);
}
?>
