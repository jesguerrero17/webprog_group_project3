<?php
session_start();
require "../db/db.php";

header("Content-Type: application/json");

$username = trim($_POST["username"] ?? "");
$password = trim($_POST["password"] ?? "");

if ($username === "" || $password === "") {
    echo json_encode(["success" => false, "error" => "missing_fields"]);
    exit;
}

// Look up user
$stmt = $conn->prepare("SELECT id, password_hash FROM users WHERE username = ?");
$stmt->bind_param("s", $username);
$stmt->execute();
$stmt->store_result();

if ($stmt->num_rows === 0) {
    echo json_encode(["success" => false, "error" => "invalid_credentials"]);
    exit;
}

$stmt->bind_result($userId, $hash);
$stmt->fetch();

// Verify password
if (!password_verify($password, $hash)) {
    echo json_encode(["success" => false, "error" => "invalid_credentials"]);
    exit;
}

// Login success
$_SESSION["user_id"] = $userId;
$_SESSION["username"] = $username;

echo json_encode([
    "success" => true,
    "user_id" => $userId,
    "username" => $username
]);