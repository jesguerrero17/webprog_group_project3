<?php
session_start();
require_once "../db/db.php";

$username = trim($_POST['username']);
$password = trim($_POST['password']);

// Check if username exists
$stmt = $conn->prepare("SELECT id FROM users WHERE username = ?");
$stmt->bind_param("s", $username);
$stmt->execute();
$result = $stmt->get_result();

if ($result->num_rows > 0) {
    die("Username already taken");
}

$hash = password_hash($password, PASSWORD_DEFAULT);

$stmt = $conn->prepare("INSERT INTO users (username, password_hash) VALUES (?, ?)");
$stmt->bind_param("ss", $username, $hash);   // ✅ FIXED
$stmt->execute();

$newUserId = $stmt->insert_id;

$_SESSION['UserData'] = [
    "UserID" => $newUserId,
    "Username" => $username
];

header("Location: ../public/index.php");
exit;