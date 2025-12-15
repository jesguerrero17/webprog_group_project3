<?php
session_start();

if (isset($_SESSION['UserData']['UserID'])) {
    header("Location: ../public/index.php");
    exit;
}
?>

<!DOCTYPE html>
<html>

<head>
    <title>Register</title>
    <link rel="stylesheet" href="../public/css/style.css">
</head>

<body>

    <h2>Create Account</h2>

    <form action="handle_register.php" method="POST">
        <label>Username:</label>
        <input type="text" name="username" required>

        <label>Password:</label>
        <input type="password" name="password" required>

        <button type="submit">Register</button>
    </form>

    <p>Already have an account?
        <a href="login.php">Login here</a>
    </p>

</body>

</html>