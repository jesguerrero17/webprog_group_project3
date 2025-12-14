<?php
require "../db/db.php";

$response = [
    "success" => true,
    "online" => [
        "speed" => [],
        "moves" => [],
        "speed_scores" => [],
        "moves_scores" => []
    ],
    "local" => [
        "speed" => [],
        "moves" => []
    ]
];

// =====================================
// ONLINE COMPETITIVE WINS (match_results)
// =====================================

// Speed wins (fastest solver wins)
$response["online"]["speed"] = $conn->query("
    SELECT u.username, COUNT(*) AS wins
    FROM match_results r
    JOIN users u ON u.id = r.winner_id
    WHERE r.mode = 'speed'
    GROUP BY r.winner_id
    ORDER BY wins DESC
    LIMIT 10
")->fetch_all(MYSQLI_ASSOC);

// Moves wins (fewest moves wins)
$response["online"]["moves"] = $conn->query("
    SELECT u.username, COUNT(*) AS wins
    FROM match_results r
    JOIN users u ON u.id = r.winner_id
    WHERE r.mode = 'moves'
    GROUP_BY r.winner_id
    ORDER BY wins DESC
    LIMIT 10
")->fetch_all(MYSQLI_ASSOC);


// =====================================
// LOCAL SCORES (leaderboard)
// Sorted by performance
// =====================================

// Local speed (fastest time)
$response["local"]["speed"] = $conn->query("
    SELECT username, moves, time
    FROM leaderboard
    WHERE playMode = 'local' AND gameMode = 'speed'
    ORDER BY time ASC, moves ASC
    LIMIT 10
")->fetch_all(MYSQLI_ASSOC);

// Local moves (fewest moves)
$response["local"]["moves"] = $conn->query("
    SELECT username, moves, time
    FROM leaderboard
    WHERE playMode = 'local' AND gameMode = 'moves'
    ORDER BY moves ASC, time ASC
    LIMIT 10
")->fetch_all(MYSQLI_ASSOC);


// =====================================
// ONLINE SCORE ENTRIES (not wins)
// Sorted by performance
// =====================================

// Online speed (fastest time)
$response["online"]["speed_scores"] = $conn->query("
    SELECT username, moves, time
    FROM leaderboard
    WHERE playMode = 'online' AND gameMode = 'speed'
    ORDER BY time ASC, moves ASC
    LIMIT 10
")->fetch_all(MYSQLI_ASSOC);

// Online moves (fewest moves)
$response["online"]["moves_scores"] = $conn->query("
    SELECT username, moves, time
    FROM leaderboard
    WHERE playMode = 'online' AND gameMode = 'moves'
    ORDER BY moves ASC, time ASC
    LIMIT 10
")->fetch_all(MYSQLI_ASSOC);


echo json_encode($response);