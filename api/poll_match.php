<?php
header("Content-Type: application/json");

// Database connection
require "../db/db.php";

$matchId = $_GET['matchId'] ?? null;
$isHost = $_GET['isHost'] ?? null;

if (!$matchId) {
    echo json_encode(null);
    exit;
}

// Fetch match row
$stmt = $db->prepare("
    SELECT 
        host_deck,
        join_deck,
        host_clicked,
        host_empty,
        join_clicked,
        join_empty,
        last_move_by
    FROM matches
    WHERE match_id = ?
");
$stmt->execute([$matchId]);
$row = $stmt->fetch(PDO::FETCH_ASSOC);

if (!$row) {
    echo json_encode(null);
    exit;
}

// Determine opponent move fields
if ($isHost === "true" || $isHost === "1") {
    // You are host → opponent is joiner
    $clicked = $row['join_clicked'];
    $empty = $row['join_empty'];
} else {
    // You are joiner → opponent is host
    $clicked = $row['host_clicked'];
    $empty = $row['host_empty'];
}

// Return JSON packet
echo json_encode([
    "last_move_by" => $row['last_move_by'],

    // Decks for both players
    "host_deck" => $row['host_deck'],
    "join_deck" => $row['join_deck'],

    // Opponent move metadata
    "clickedIndex" => $clicked,
    "emptyIndex" => $empty
]);