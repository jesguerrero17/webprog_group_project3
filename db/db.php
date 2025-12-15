<?php
$host = "localhost";
$user = "jguerrero11";
$pass = "jguerrero11";
$dbname = "jguerrero11";

$conn = new mysqli($host, $user, $pass, $dbname);

if ($conn->connect_error) {
    die("Connection failed: " . $conn->connect_error);
}
?>