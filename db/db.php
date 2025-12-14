<?php
$host = "localhost";
$user = "root";
$pass = "your_password";
$dbname = "reindeer_games";

$conn = new mysqli($host, $user, $pass, $dbname);

if ($conn->connect_error) {
    die("Connection failed: " . $conn->connect_error);
}
?>