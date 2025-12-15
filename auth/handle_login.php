<?php
session_start();
require_once "../db/db.php";   // Correct path

$username = trim($_POST['username']);
$password = trim($_POST['password']);

$stmt = $conn->prepare("SELECT id, username, password_hash FROM users WHERE username = ?");
$stmt->bind_param("s", $username);
$stmt->execute();
$result = $stmt->get_result();

if ($result->num_rows === 0) {
    die("Invalid username or password");
}

$user = $result->fetch_assoc();

if (!password_verify($password, $user['password_hash'])) {
    die("Invalid username or password");
}

$_SESSION['UserData'] = [
    "UserID" => $user['id'],
    "Username" => $user['username']
];

header("Location: ../public/index.php");
exit;