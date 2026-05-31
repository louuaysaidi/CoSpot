<?php
require_once '../../config/database.php';

$today = date('Y-m-d');

// 1. Espaces actifs
$q1 = $pdo->query("SELECT COUNT(*) FROM espaces WHERE statut = 'actif'");
$espaces_actifs = (int) $q1->fetchColumn();

// 2. Réservations aujourd'hui (statut active)
$q2 = $pdo->prepare("
    SELECT COUNT(*) FROM reservations
    WHERE date_reservation = ? AND statut = 'active'
");
$q2->execute([$today]);
$reservations_today = (int) $q2->fetchColumn();

// 3. Utilisateurs inscrits (clients only)
$q3 = $pdo->query("SELECT COUNT(*) FROM utilisateurs WHERE role = 'client'");
$utilisateurs = (int) $q3->fetchColumn();

// 4. Taux d'occupation :
//    = nombre de postes réservés aujourd'hui (active) / total postes disponibles * 100
//    Total postes = sum of capacite of all active espaces
$q4 = $pdo->query("SELECT COALESCE(SUM(capacite), 0) FROM espaces WHERE statut = 'actif'");
$total_postes = (int) $q4->fetchColumn();

// Count distinct postes reserved today via reservation_postes joined to reservations
$q5 = $pdo->prepare("
    SELECT COUNT(DISTINCT rp.poste_id)
    FROM reservation_postes rp
    JOIN reservations r ON rp.reservation_id = r.id
    WHERE r.date_reservation = ? AND r.statut = 'active'
");
$q5->execute([$today]);
$postes_reserves = (int) $q5->fetchColumn();

// For espaces that have no postes (salle_reunion, bureau_prive),
// count the reservation itself as occupying the full capacite
$q6 = $pdo->prepare("
    SELECT COALESCE(SUM(e.capacite), 0)
    FROM reservations r
    JOIN espaces e ON r.espace_id = e.id
    WHERE r.date_reservation = ?
      AND r.statut = 'active'
      AND e.type IN ('salle_reunion', 'bureau_prive')
");
$q6->execute([$today]);
$postes_salle = (int) $q6->fetchColumn();

$total_occupied = $postes_reserves + $postes_salle;
$taux = $total_postes > 0 ? round(($total_occupied / $total_postes) * 100) : 0;

echo json_encode([
    'success'            => true,
    'espaces_actifs'     => $espaces_actifs,
    'reservations_today' => $reservations_today,
    'utilisateurs'       => $utilisateurs,
    'taux_occupation'    => $taux,
    'debug' => [
        'today'           => $today,
        'total_postes'    => $total_postes,
        'postes_reserves' => $postes_reserves,
        'postes_salle'    => $postes_salle,
    ]
]);
?>
