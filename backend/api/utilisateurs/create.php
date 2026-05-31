<?php
require_once '../../config/database.php';

$data = json_decode(file_get_contents("php://input"), true);

if (empty($data['nom']) || empty($data['prenom']) || empty($data['email']) || empty($data['mot_de_passe'])) {
    echo json_encode(["success" => false, "message" => "Tous les champs sont obligatoires."]);
    exit();
}

$stmt = $pdo->prepare("SELECT id FROM utilisateurs WHERE email = ?");
$stmt->execute([$data['email']]);
if ($stmt->rowCount() > 0) {
    echo json_encode(["success" => false, "message" => "Email deja utilise."]);
    exit();
}

$hash = password_hash($data['mot_de_passe'], PASSWORD_BCRYPT);
$role = $data['role'] ?? 'client';

$stmt = $pdo->prepare("INSERT INTO utilisateurs (nom, prenom, email, mot_de_passe, role) VALUES (?, ?, ?, ?, ?)");
$stmt->execute([$data['nom'], $data['prenom'], $data['email'], $hash, $role]);

echo json_encode([
    "success" => true,
    "message" => "Utilisateur cree avec succes."
]);
?>
