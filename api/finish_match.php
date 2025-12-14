<?php
session_start();
require "../db/db.php";

if (!isset($_SESSION["user_id"])) {
    echo json_encode(["success" => false, "error" => "not_logged_in"]);
    exit;
}

$userId = $_SESSION["user_id"];
$matchId = $_POST["match_id"];   // string
$moves = (int) $_POST["moves"];
$time = (int) $_POST["time"];

// 1) Save player result
$stmt = $conn->prepare("
    UPDATE match_players
    SET moves = ?, time = ?, finished = 1
    WHERE match_id = ? AND user_id = ?
");
$stmt->bind_param("iisi", $moves, $time, $matchId, $userId);
$stmt->execute();

// 2) Check if both players finished
$stmt2 = $conn->prepare("
    SELECT mp.user_id, mp.moves, mp.time, u.username
    FROM match_players mp
    JOIN users u ON mp.user_id = u.id
    WHERE mp.match_id = ? AND mp.finished = 1
");
$stmt2->bind_param("s", $matchId);
$stmt2->execute();
$result = $stmt2->get_result();

$players = [];
while ($row = $result->fetch_assoc()) {
    $players[] = $row;
}

if (count($players) < 2) {
    echo json_encode(["success" => true, "status" => "waiting"]);
    exit;
}

// 3) Prevent duplicate match_results
$stmtCheck = $conn->prepare("SELECT COUNT(*) FROM match_results WHERE match_id = ?");
$stmtCheck->bind_param("s", $matchId);
$stmtCheck->execute();
$stmtCheck->bind_result($count);
$stmtCheck->fetch();

if ($count > 0) {
    echo json_encode(["success" => true, "status" => "already_finished"]);
    exit;
}

// 4) Determine winner — get gameMode from matches table
$stmt3 = $conn->prepare("SELECT mode FROM matches WHERE match_id = ?");
$stmt3->bind_param("s", $matchId);
$stmt3->execute();
$stmt3->bind_result($gameMode);
$stmt3->fetch();

// Determine winner based on gameMode
$p1 = $players[0];
$p2 = $players[1];

if ($gameMode === "moves") {
    $winner = ($p1["moves"] <= $p2["moves"]) ? $p1 : $p2;
} else {
    $winner = ($p1["time"] <= $p2["time"]) ? $p1 : $p2;
}

$loser = ($winner["user_id"] === $p1["user_id"]) ? $p2 : $p1;

// 5) Save match result
$stmt4 = $conn->prepare("
    INSERT INTO match_results (match_id, winner_id, loser_id, mode)
    VALUES (?, ?, ?, ?)
");
$stmt4->bind_param("siis", $matchId, $winner["user_id"], $loser["user_id"], $gameMode);
$stmt4->execute();

// 6) Save both players to leaderboard
// ✅ playMode replaces gameType
$playMode = "online";  // always online for this script

$stmtLB = $conn->prepare("
    INSERT INTO leaderboard (username, moves, time, playMode, gameMode)
    VALUES (?, ?, ?, ?, ?)
");

foreach ($players as $p) {
    $stmtLB->bind_param(
        "siiss",
        $p["username"],
        $p["moves"],
        $p["time"],
        $playMode,
        $gameMode
    );
    $stmtLB->execute();
}

// 7) Mark match finished
$stmt5 = $conn->prepare("UPDATE matches SET status = 'finished' WHERE match_id = ?");
$stmt5->bind_param("s", $matchId);
$stmt5->execute();

echo json_encode([
    "success" => true,
    "status" => "finished",
    "winner_id" => $winner["user_id"],
    "loser_id" => $loser["user_id"],
    "gameMode" => $gameMode,
    "playMode" => $playMode
]);