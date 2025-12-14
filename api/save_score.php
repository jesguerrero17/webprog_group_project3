<?php
require "../db/db.php";

$username = $_POST['username'] ?? null;
$moves = $_POST['moves'] ?? null;
$time = $_POST['time'] ?? null;
$playMode = $_POST['playMode'] ?? 'local';   // 'local' or 'online'
$gameMode = $_POST['gameMode'] ?? 'speed';   // 'speed' or 'moves'

if (!$username || $moves === null || $time === null) {
    http_response_code(400);
    echo "Missing required fields";
    exit;
}

$stmt = $conn->prepare("
    INSERT INTO leaderboard (username, moves, time, playMode, gameMode)
    VALUES (?, ?, ?, ?, ?)
");
$stmt->bind_param("siiss", $username, $moves, $time, $playMode, $gameMode);
$stmt->execute();

echo "OK";