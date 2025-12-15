<?php
session_start();

// If already logged in, go straight to game
if (isset($_SESSION['UserData']['UserID'])) {
    header("Location: ../public/index.php");
    exit;
}
?>

<!DOCTYPE html>
<html>

<head>
    <title>Login</title>
    <link rel="stylesheet" href="../public/css/style.css">
</head>

<body>

    <h2>Login</h2>

    <form action="handle_login.php" method="POST">
        <label>Username:</label>
        <input type="text" name="username" required>

        <label>Password:</label>
        <input type="password" name="password" required>

        <button type="submit">Login</button>
    </form>

    <p>Don't have an account?
        <a href="register.php">Register here</a>
    </p>

</body>

</html>