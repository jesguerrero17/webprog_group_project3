// Reindeer Games                                                                 // Project name
// Sliding piece puzzle game                                                      // Game description

// DOM Elements
const startBtn = document.getElementById("start-game");                          // Button the player clicks to begin a new game
const gameContainer = document.getElementById("memory-game-container");          // Main game area that becomes visible after starting
const gameBoard = document.getElementById("game-board");                         // The grid container where all puzzle tiles are rendered
const timeLeftSpan = document.getElementById("time");                            // UI element that displays the current elapsed time
const gameTypeSelect = document.getElementById("play-mode");                     // Dropdown that selects playMode: local or online
const modeContainer = document.getElementById("mode-container");                 // Wrapper that shows/hides the competitive mode selector

// User ID
const userId = window.USER_ID_FROM_SERVER;                                       // Logged‑in user’s ID injected from PHP (null if not logged in)

// Difficulty Setting
const difficultyMoves = {                                                        // Number of random shuffle moves applied based on difficulty
  easy: 50,                                                                      // Light scramble for easy mode
  medium: 200,                                                                   // Moderate scramble for medium mode
  hard: 400,                                                                     // Deep scramble for hard mode
  grinch: 1000                                                                   // Extreme scramble for “Grinch” difficulty
};

// Game Type selector (online toggle)
gameTypeSelect.addEventListener("change", () => {                                // Run this whenever the playMode dropdown changes
  if (gameTypeSelect.value === "online") {                                       // If the player chooses Online mode
    modeContainer.style.display = "block";                                       // Show the competitive mode selector (speed/moves)
  } else {                                                                       // Otherwise (Local mode)
    modeContainer.style.display = "none";                                        // Hide the competitive mode selector
  }
});

// Sound Effects
const moveSound = new Audio("../assets/whoosh.mp3");                             // Load the tile‑movement sound effect
moveSound.volume = 0.5;                                                          // Set the sound volume to 50%

// Scoreboard
const scoreBoard = document.createElement("div");                                // Create a new div to display the player's current score
scoreBoard.id = "score-board";                                                   // Assign it an ID for styling and access
document.body.insertBefore(scoreBoard, gameContainer);                           // Insert the scoreboard above the game container in the page

// Leaderboard container
const leaderboardDiv = document.createElement("div");                            // Create a div to hold leaderboard results
leaderboardDiv.id = "leaderboard";                                               // Assign it an ID for styling and JS access
document.body.appendChild(leaderboardDiv);                                       // Add the leaderboard to the bottom of the page

// Global State
let currentDeck = [];                                                            // The current puzzle layout as an array of tile positions
let playMode = "local";                                                          // Whether the game is local or online ("local" or "online")
let gameMode = null;                                                             // Competitive mode selected ("speed" or "moves")
let matchId = null;                                                              // Unique match identifier used for online multiplayer
let isHost = false;                                                              // True if this player created the match, false if they joined
let isMyTurn = true;                                                             // Tracks whose turn it is in online mode

let timeElapsed = 0;                                                             // Number of seconds since the game started
let timer = null;                                                                // Reference to the interval timer used for counting time
let scores = { 1: 0 };                                                           // Simple local scoreboard keyed by player number
let currentPlayer = 1;                                                           // Active player index (used for local multiplayer variants)
let moveCount = 0;                                                               // Number of moves made in the current game

// Online event listener (polling)
function initOnlineListeners() {                                                 // Starts periodic polling for opponent moves in online mode
  setInterval(() => {                                                            // Run a function repeatedly every second
    pollForOpponentMove();                                                       // Ask the server if the opponent has made a move
  }, 1000);                                                                      // Polling interval: 1 second
}

function pollForOpponentMove() {                                                 // Poll server for opponent moves
  if (!matchId) return;                                                          // If no match ID, stop

  fetch(`poll_match.php?matchId=${matchId}&isHost=${isHost}`)                    // Request match state from server
    .then(res => res.json())                                                     // Parse JSON
    .then(data => {
      if (!data) return;                                                         // No data means no update

      // If opponent moved
      if (data.last_move_by !== (isHost ? "host" : "join")) {                    // Check if opponent made the last move
        const deck = JSON.parse(                                                 // Parse opponent's deck
          data[isHost ? "join_deck" : "host_deck"]
        );

        applyOpponentMove({                                                      // Apply opponent move locally
          clickedIndex: data.clickedIndex,
          emptyIndex: data.emptyIndex,
          deck: deck
        });
      }
    });
}

// Create Online Match
function createOnlineMatch() {                                                   // Host creates a new online match
  matchId = crypto.randomUUID();                                                 // Generate unique match ID
  isHost = true;                                                                 // Mark as host
  isMyTurn = true;                                                               // Host starts first

  initOnlineListeners();                                                         // Begin polling for opponent moves
}

// Join Online Match
function joinOnlineMatch() {                                                     // Joiner enters an existing match
  isHost = false;                                                                // Mark as joiner
  isMyTurn = false;                                                              // Joiner waits for host's first move

  initOnlineListeners();                                                         // Begin polling for opponent moves
}

// Start game
startBtn.addEventListener("click", () => {                                       // Start button handler
  playMode = document.getElementById("play-mode").value;                         // Read playMode from dropdown
  gameMode = document.getElementById("game-mode").value;                         // Read gameMode from dropdown

  if (playMode === "online") {                                                   // ONLINE MODE
    if (isHost) {                                                                // If host
      createOnlineMatch();                                                       // Create match
    } else {                                                                     // If joiner
      joinOnlineMatch();                                                         // Join match
    }
    return;                                                                      // Stop local game start
  }

  // LOCAL MODE ONLY

  startCounter();                                                                // Start timer
  moveCount = 0;                                                                 // Reset move count
  currentPlayer = 1;                                                             // Reset player turn
  updateScoreBoard();                                                            // Update scoreboard UI

  const size = parseInt(document.getElementById("tiles").value, 10);             // Read board size
  let deck = Array.from({ length: size * size }, (_, i) => i + 1);               // Build solved deck
  deck[deck.length - 1] = 0;                                                     // Last tile is empty

  const difficulty = document.getElementById("difficulty").value;                // Read difficulty
  const shuffleMoves = difficultyMoves[difficulty];                              // Get shuffle depth

  deck = relayShuffle(deck, size, shuffleMoves);                                 // Shuffle deck legally
  currentDeck = deck.slice();                                                    // Store deck

  renderBoard(currentDeck);                                                      // Render puzzle board
  gameContainer.style.display = "block";                                         // Show game container
});

// Relay shuffle helper (legal moves only)
function relayShuffle(deck, size, moves = 200) {                                 // Shuffle deck using legal moves
  let emptyIndex = deck.indexOf(0);                                              // Track empty tile index

  for (let i = 0; i < moves; i++) {                                              // Perform N random moves
    const neighbors = getAdjacentIndexes(emptyIndex, size);                      // Get legal neighbors
    const swapWith = neighbors[Math.floor(Math.random() * neighbors.length)];    // Pick random neighbor

    [deck[emptyIndex], deck[swapWith]] = [deck[swapWith], deck[emptyIndex]];     // Swap tiles

    emptyIndex = swapWith;                                                       // Update empty index
  }

  return deck;                                                                   // Return shuffled deck
}

// Adjacency check for gameplay
function isAdjacent(i1, i2, size) {                                              // Check if two indexes are adjacent
  const r1 = Math.floor(i1 / size);                                              // Row of first tile
  const c1 = i1 % size;                                                          // Column of first tile
  const r2 = Math.floor(i2 / size);                                              // Row of second tile
  const c2 = i2 % size;                                                          // Column of second tile

  return Math.abs(r1 - r2) + Math.abs(c1 - c2) === 1;                            // Manhattan distance = 1
}

// Adjacency Check for shuffling
function getAdjacentIndexes(emptyIndex, size) {                                  // Get legal neighbors of empty tile
  const row = Math.floor(emptyIndex / size);                                     // Row of empty tile
  const col = emptyIndex % size;                                                 // Column of empty tile

  const neighbors = [];                                                          // List of valid neighbors

  if (row > 0) neighbors.push(emptyIndex - size);                                // Up
  if (row < size - 1) neighbors.push(emptyIndex + size);                         // Down
  if (col > 0) neighbors.push(emptyIndex - 1);                                   // Left
  if (col < size - 1) neighbors.push(emptyIndex + 1);                            // Right

  return neighbors;                                                               // Return neighbors
}

// Render board from deck
function renderBoard(deck) {                                                     // Draw puzzle tiles on screen
  gameBoard.innerHTML = "";                                                      // Clear board

  const size = parseInt(document.getElementById("tiles").value, 10);             // Read board size
  gameBoard.style.gridTemplateColumns = `repeat(${size}, 100px)`;                // Set grid layout

  deck.forEach((num, index) => {                                                 // Create each tile
    const tile = document.createElement("div");                                  // Create tile element
    tile.classList.add("tile");                                                  // Add tile class

    tile.dataset.index = index;                                                  // Store tile index
    tile.dataset.value = num;                                                    // Store tile value

    if (num === 0) {                                                             // Empty tile
      tile.classList.add("empty");                                               // Add empty class
      tile.textContent = "";                                                     // No text
    } else {
      tile.textContent = num;                                                    // Show tile number
    }

    tile.addEventListener("click", () => moveTile(tile));                        // Add click handler
    gameBoard.appendChild(tile);                                                 // Add tile to board
  });
}

// Move tile
function moveTile(tile) {                                                        // Handles tile movement
  if (playMode === "online" && !isMyTurn) return;                                // Block move if not player's turn

  const size = parseInt(document.getElementById("tiles").value, 10);             // Read board size

  const clickedIndex = parseInt(tile.dataset.index, 10);                         // Index of clicked tile
  const emptyTile = document.querySelector(".tile.empty");                       // Find empty tile
  if (!emptyTile) return;                                                        // Safety check

  const emptyIndex = parseInt(emptyTile.dataset.index, 10);                      // Index of empty tile

  if (!isAdjacent(clickedIndex, emptyIndex, size)) return;                       // Only allow legal moves

  moveSound.currentTime = 0;                                                     // Reset sound
  moveSound.play();                                                              // Play move sound

  const temp = currentDeck[clickedIndex];                                        // Swap tiles in deck
  currentDeck[clickedIndex] = currentDeck[emptyIndex];
  currentDeck[emptyIndex] = temp;

  if (playMode === "online") {                                                   // ONLINE MODE
    moveCount++;                                                                 // Increment moves
    updateScoreBoard();                                                          // Update UI
    renderBoard(currentDeck);                                                    // Re-render board

    sendMoveToServer({                                                           // Notify server
      clickedIndex,
      emptyIndex,
      deck: currentDeck
    });

    isMyTurn = false;                                                            // End turn
    checkWin();                                                                  // Check win condition
    return;
  }

  moveCount++;                                                                   // LOCAL MODE: increment moves
  updateScoreBoard();                                                            // Update UI
  renderBoard(currentDeck);                                                      // Re-render board
  checkWin();                                                                    // Check win condition
}

// General win checker
function isWinningDeck(deck) {                                                   // Check if deck is solved
  for (let i = 0; i < deck.length - 1; i++) {                                    // Check all tiles except last
    if (deck[i] !== i + 1) return false;                                         // Must be in order
  }
  return deck[deck.length - 1] === 0;                                            // Last tile must be empty
}

// Check win (local and online)
function checkWin() {                                                            // Called after every move
  if (!isWinningDeck(currentDeck)) return;                                       // Stop if not solved

  if (playMode === "local") {                                                    // LOCAL MODE
    endGame(true);                                                               // End game locally
    return;
  }

  fetch("finish_match.php", {                                                    // ONLINE MODE: notify server
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      match_id: matchId,
      moves: moveCount,
      time: timeElapsed,
      user_id: userId
    })
  })
    .then(res => res.json())                                                     // Parse response
    .then(data => {
      if (data.status === "waiting") {                                           // Opponent still playing
        alert("Waiting for your opponent to finish...");
        return;
      }

      if (data.status === "already_finished") {                                  // Match already processed
        alert("Match already finished.");
        return;
      }

      const isWinner = data.winner_id == userId;                                 // Determine win/loss
      alert(isWinner ? "🎉 You win!" : "😞 You lost this match.");               // Show result

      showLeaderboard();                                                         // Refresh leaderboard
      gameContainer.style.display = "none";                                      // Hide game board
    });
}

// Timer
function startCounter() {                                                        // Start local timer
  if (playMode === "online") return;                                             // Online timing handled separately
  clearInterval(timer);                                                          // Reset timer
  timeElapsed = 0;                                                               // Reset time
  timeLeftSpan.textContent = timeElapsed;                                        // Update UI
  timer = setInterval(() => {                                                    // Start ticking
    timeElapsed++;                                                               // Increment time
    timeLeftSpan.textContent = timeElapsed;                                      // Update UI
  }, 1000);
}

function stopCounter() {                                                         // Stop timer
  clearInterval(timer);
}

// End game (local only, plus legacy online path if needed)
function endGame(won) {                                                          // Handles end-of-game logic
  stopCounter();                                                                 // Stop timer

  if (playMode === "local") {                                                    // LOCAL MODE
    alert(won ? "Well Done!" : "Try again!");                                    // Show result

    const playerName = prompt("Enter your name:");                               // Ask for name
    if (!playerName) return;                                                     // Cancelled

    saveScore({                                                                  // Save score
      name: playerName,
      moves: moveCount,
      time: timeElapsed,
      playMode: playMode,
      gameMode: gameMode
    });

    showLeaderboard();                                                           // Update leaderboard
    gameContainer.style.display = "none";                                        // Hide game board
    return;
  }

  if (playMode === "online") {                                                   // ONLINE MODE fallback
    const payload = new URLSearchParams({
      match_id: matchId,
      moves: moveCount,
      time: timeElapsed
    });

    fetch("finish_match.php", {                                                  // Notify server
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: payload
    })
      .then(res => res.json())
      .then(data => {
        if (data.status === "waiting") {                                         // Opponent still playing
          alert("Waiting for your opponent to finish...");
          return;
        }

        if (data.status === "already_finished") {                                // Match already processed
          alert("Match already finished.");
          return;
        }

        const isWinner = data.winner_id == userId;                               // Determine win/loss
        alert(isWinner ? " You win!" : " You lost this match.");                 // Show result

        showLeaderboard();                                                       // Refresh leaderboard
        gameContainer.style.display = "none";                                    // Hide game board
      });
  }
}

// Scoreboard + Leaderboard
function updateScoreBoard() {                                                    // Updates stats panel
  scoreBoard.innerHTML = `
    <h3>Stats</h3>
    <p>Player 1: ${scores[1]} points</p>
    <p>Moves: ${moveCount}</p>
    <p>Current Turn: Player ${currentPlayer}</p>
  `;

  const threshold = 20;                                                          // Move threshold for fade effect
  const fadeLayer = document.getElementById("bg-fade-layer");                    // Background fade layer

  if (fadeLayer) {                                                               // If fade layer exists
    if (moveCount >= threshold) {                                                // Fade in
      fadeLayer.style.backgroundImage = "url('../assets/winter-holiday-desktop.jpg')";
      fadeLayer.style.opacity = "1";
    } else {                                                                     // Fade out
      fadeLayer.style.opacity = "0";
    }
  }
}


function saveScore(entry) {                                                      // Saves score locally or online
  // ONLINE MODE → send to backend
  if (entry.playMode === "online") {                                             // If score belongs to online mode
    const payload = new URLSearchParams({                                        // Prepare POST payload
      username: entry.name,
      moves: entry.moves,
      time: entry.time,
      playMode: "online",
      gameMode: entry.gameMode
    });

    fetch("save_score.php", {                                                    // Send score to backend
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: payload
    });

    return;                                                                      // Stop here for online mode
  }

  // LOCAL MODE → save to localStorage
  let leaderboard = JSON.parse(localStorage.getItem("leaderboard")) || {         // Load or initialize leaderboard structure
    local: {
      speed: [],                                                                 // Local speed-mode scores
      moves: []                                                                  // Local moves-mode scores
    },
    online: {
      speed: [],                                                                 // Online speed-mode scores (unused here)
      moves: []                                                                  // Online moves-mode scores (unused here)
    }
  };

  if (entry.playMode === "local") {                                              // LOCAL MODE scoring logic
    if (entry.gameMode === "speed") {                                            // Speed mode → sort by fastest time
      leaderboard.local.speed.push(entry);                                       // Add entry
      leaderboard.local.speed.sort((a, b) => a.time - b.time);                   // Sort ascending by time
      leaderboard.local.speed = leaderboard.local.speed.slice(0, 5);             // Keep top 5
    } else {                                                                     // Moves mode → sort by fewest moves
      leaderboard.local.moves.push(entry);                                       // Add entry
      leaderboard.local.moves.sort((a, b) => a.moves - b.moves);                 // Sort ascending by moves
      leaderboard.local.moves = leaderboard.local.moves.slice(0, 5);             // Keep top 5
    }
  }

  localStorage.setItem("leaderboard", JSON.stringify(leaderboard));              // Save updated leaderboard back to storage
}

// Build leaderboard HTML
function showLeaderboard() {                                                     // Fetches and displays leaderboard data
  fetch("get_leaderboard.php")                                                   // Request leaderboard from backend
    .then(res => res.json())                                                     // Parse JSON
    .then(data => {
      leaderboardDiv.innerHTML = `                                               
        <h2>Leaderboards</h2>

        <h3>Online — Speed Wins</h3>
        ${renderList(data.online.speed)}

        <h3>Online — Moves Wins</h3>
        ${renderList(data.online.moves)}

        <h3>Local — Best Times</h3>
        ${renderList(data.local.speed)}

        <h3>Local — Fewest Moves</h3>
        ${renderList(data.local.moves)}
      `;
    });
}

function renderList(list) {                                                      // Converts leaderboard array to HTML
  if (!list || list.length === 0) return "<p>No scores yet.</p>";                // Handle empty lists

  return list
    .map((entry, i) => {                                                         // Build each leaderboard row
      const name = entry.username || entry.name;                                 // Username may come from DB or local entry
      const value = entry.time ?? entry.moves;                                   // Show time or moves depending on mode
      return `<p>${i + 1}. ${name} — ${value}</p>`;                              // Format row
    })
    .join("");                                                                   // Combine into one HTML string
}

// Send move to server (online)
function sendMoveToServer(moveData) {                                            // Sends move details to backend
  fetch("send_move.php", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      matchId,                                                                   // Current match ID
      isHost,                                                                    // Whether this player is host
      clickedIndex: moveData.clickedIndex,                                       // Tile clicked
      emptyIndex: moveData.emptyIndex,                                           // Empty tile index
      deck: JSON.stringify(moveData.deck)                                        // Full deck state
    })
  });
}

// Apply opponent move (online)
function applyOpponentMove(data) {                                               // Applies move received from server
  const { clickedIndex, emptyIndex, deck } = data;                               // Extract move details

  currentDeck = deck.slice();                                                    // Replace local deck with opponent's deck
  renderBoard(currentDeck);                                                      // Update UI

  isMyTurn = true;                                                               // Player can now move

  checkWin();                                                                    // Evaluate win condition
}