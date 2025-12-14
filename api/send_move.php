<?php
require "../db/db.php";

$matchId = $_POST['matchId'] ?? null;
$isHost = $_POST['isHost'] ?? null;
$deck = $_POST['deck'] ?? null;          // JSON string
$clicked = $_POST['clickedIndex'] ?? null;  // int
$empty = $_POST['emptyIndex'] ?? null;    // int

if (!$matchId || $deck === null || $clicked === null || $empty === null) {
    http_response_code(400);
    echo "Missing required fields";
    exit;
}

// Determine which columns to update
if ($isHost === "true" || $isHost === "1") {
    $deckColumn = "host_deck";
    $clickedColumn = "host_clicked";
    $emptyColumn = "host_empty";
    $player = "host";
} else {
    $deckColumn = "join_deck";
    $clickedColumn = "join_clicked";
    $emptyColumn = "join_empty";
    $player = "join";
}

// Build dynamic SQL safely
$sql = "
    UPDATE matches
    SET $deckColumn = ?,
        $clickedColumn = ?,
        $emptyColumn = ?,
        last_move_by = ?,
        updated_at = NOW()
    WHERE match_id = ?
";

$stmt = $conn->prepare($sql);
$stmt->bind_param("siiss", $deck, $clicked, $empty, $player, $matchId);
$stmt->execute();

echo "OK";