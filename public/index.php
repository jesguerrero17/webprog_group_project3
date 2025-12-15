<?php
session_start();

if (!isset($_SESSION['UserData']['UserID'])) {
    header("Location: ../auth/login.php");
    exit;
}
?>

<!DOCTYPE html>
<html lang="en">

<head>
    <meta charset="UTF-8">
    <title>Reindeer Games</title>
    <link rel="stylesheet" href="css/style.css">
</head>

<body>
    <div id="bg-fade-layer"></div>
    <h1>Reindeer Games</h1>

    <div class="auth-box">
        <h3>Login</h3>

        <form action="../auth/handle_login.php" method="POST">

            <label>Username</label>
            <input type="text" name="username" required>

            <label>Password</label>
            <input type="password" name="password" required>

            <button class="auth-btn" type="submit">Login</button>
        </form>

        <a class="auth-link" href="../auth/register.php">Create an account</a>
    </div>

    <!-- Game Setup Controls -->
    <div id="memory-game-controls">
        <h3>Reindeer Games Setup</h3>

        <div>
            <label for="play-mode">Game Type:</label>
            <select id="play-mode">
                <option value="local">Local</option>
                <option value="online">Online</option>
            </select>
        </div>
        <div>
            <label for="tiles">Matrix:</label>
            <select id="tiles">
                <option value="3">3 x 3</option>
                <option value="4" selected>4 x 4</option>
                <option value="6">6 x 6</option>
                <option value="8">8 x 8</option>
                <option value="10">10 x 10</option>
            </select>
        </div>
        <div>
            <label for="difficulty">Difficulty:</label>
            <select id="difficulty">
                <option value="easy">Easy</option>
                <option value="medium">Medium</option>
                <option value="hard">Hard</option>
                <option value="grinch">Grinch</option>
            </select>
        </div>
        <div>
            <div id="mode-container" style="display:none;">
                <label for="game-mode">Competitive Mode:</label>
                <select id="game-mode">
                    <option value="speed">Speed Solving</option>
                    <option value="moves">Fewest Moves</option>
                </select>
            </div>

        </div>
        <button id="start-game" class="btn">Start Game</button>
    </div>


    <!-- Game Container -->
    <!-- TO DO: Change to counter not timer  -->
    <div id="memory-game-container" style="display: none;">
        <h3>Memory Game</h3>
        <p>Time: <span id="time">0</span> seconds</p>
        <div id="game-board"></div>
    </div>

    <script>
        window.USER_ID_FROM_SERVER = <?= json_encode($_SESSION["user_id"] ?? null) ?>;
    </script>
    <script src="js/script.js"></script>
</body>

</html>