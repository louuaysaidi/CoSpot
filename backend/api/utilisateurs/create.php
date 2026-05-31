<?php
require_once '../../config/database.php';

$data = json_decode(file_get_contents("php://input"), true);

$role = $data['role'] ?? 'client';
$telephone = trim($data['telephone'] ?? '');

if (empty($data['nom']) || empty($data['prenom']) || empty($data['email']) || empty($data['mot_de_passe'])
    || ($role === 'client' && $telephone === '')) {
    echo json_encode(["success" => false, "message" => "Tous les champs sont obligatoires pour un client, téléphone inclus."]);
    exit();
}

$stmt = $pdo->prepare("SELECT id FROM utilisateurs WHERE email = ?");
$stmt->execute([$data['email']]);
if ($stmt->rowCount() > 0) {
    echo json_encode(["success" => false, "message" => "Cet e-mail est déjà utilisé."]);
    exit();
}

$hash = password_hash($data['mot_de_passe'], PASSWORD_BCRYPT);

$stmt = $pdo->prepare("INSERT INTO utilisateurs (nom, prenom, email, telephone, mot_de_passe, role) VALUES (?, ?, ?, ?, ?, ?)");
$stmt->execute([$data['nom'], $data['prenom'], $data['email'], $telephone ?: null, $hash, $role]);

echo json_encode([
    "success" => true,
    "message" => "Utilisateur créé avec succès."
]);
?>
