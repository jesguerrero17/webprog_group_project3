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

// Check if username already exists
$stmt = $conn->prepare("SELECT id FROM users WHERE username = ?");
$stmt->bind_param("s", $username);
$stmt->execute();
$stmt->store_result();

if ($stmt->num_rows > 0) {
    echo json_encode(["success" => false, "error" => "username_taken"]);
    exit;
}

// Hash password
$hash = password_hash($password, PASSWORD_DEFAULT);

// Insert new user
$stmt2 = $conn->prepare("INSERT INTO users (username, password_hash) VALUES (?, ?)");
$stmt2->bind_param("ss", $username, $hash);
$stmt2->execute();

// Auto-login after registration
$newUserId = $stmt2->insert_id;
$_SESSION["user_id"] = $newUserId;
$_SESSION["username"] = $username;

echo json_encode([
    "success" => true,
    "user_id" => $newUserId,
    "username" => $username
]);