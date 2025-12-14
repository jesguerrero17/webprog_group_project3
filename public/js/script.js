// Reindeer Games
// Sliding piece puzzle game

// DOM Elements
const startBtn = document.getElementById("start-game");
const gameContainer = document.getElementById("memory-game-container");
const gameBoard = document.getElementById("game-board");
const timeLeftSpan = document.getElementById("time");
const gameTypeSelect = document.getElementById("play-mode");
const modeContainer = document.getElementById("mode-container");

// User ID
const userId = window.USER_ID_FROM_SERVER;

// Difficulty Setting
const difficultyMoves = {
  easy: 50,
  medium: 200,
  hard: 400,
  grinch: 1000
};

// Game Type selector (online toggle)
gameTypeSelect.addEventListener("change", () => {
  if (gameTypeSelect.value === "online") {
    modeContainer.style.display = "block";
  } else {
    modeContainer.style.display = "none";
  }
});

// Sound Effects
const moveSound = new Audio("../assets/whoosh.mp3");
moveSound.volume = 0.5;

// Scoreboard
const scoreBoard = document.createElement("div");
scoreBoard.id = "score-board";
document.body.insertBefore(scoreBoard, gameContainer);

// Leaderboard container
const leaderboardDiv = document.createElement("div");
leaderboardDiv.id = "leaderboard";
document.body.appendChild(leaderboardDiv);

// Global State
let currentDeck = [];
let playMode = "local";   // "local" or "online"
let gameMode = null;      // "speed" or "moves"
let matchId = null;       // online match ID
let isHost = false;       // online: host or joiner
let isMyTurn = true;      // online: whose turn

let timeElapsed = 0;
let timer = null;
let scores = { 1: 0 };    // simple single-player scoreboard
let currentPlayer = 1;
let moveCount = 0;

// Online event listener (polling)
function initOnlineListeners() {
  setInterval(() => {
    pollForOpponentMove();
  }, 1000); // 1 second polling
}

function pollForOpponentMove() {
  if (!matchId) return;

  fetch(`poll_match.php?matchId=${matchId}&isHost=${isHost}`)
    .then(res => res.json())
    .then(data => {
      if (!data) return;

      // If opponent moved
      if (data.last_move_by !== (isHost ? "host" : "join")) {
        const deck = JSON.parse(
          data[isHost ? "join_deck" : "host_deck"]
        );

        applyOpponentMove({
          clickedIndex: data.clickedIndex,
          emptyIndex: data.emptyIndex,
          deck: deck
        });
      }
    });
}

// Create Online Match
function createOnlineMatch() {
  matchId = crypto.randomUUID();
  isHost = true;
  isMyTurn = true; // host starts

  // TODO: send match to server if needed
  initOnlineListeners();
}

// Join Online Match
function joinOnlineMatch() {
  // matchId should come from input in your UI
  isHost = false;
  isMyTurn = false; // joiner waits

  // TODO: connect to server / register join
  initOnlineListeners();
}

// Start game
startBtn.addEventListener("click", () => {
  playMode = document.getElementById("play-mode").value;
  gameMode = document.getElementById("game-mode").value;

  if (playMode === "online") {
    // Host or join is determined elsewhere (UI)
    if (isHost) {
      createOnlineMatch();
    } else {
      joinOnlineMatch();
    }
    // Online game: board will be set up consistently on server side
    // or you can still build the deck here and sync it.
    return; // stop local game start
  }

  // LOCAL MODE ONLY

  // Start counter
  startCounter();

  // Initialize move Count
  moveCount = 0;

  // Reset scores and player turn
  currentPlayer = 1;
  updateScoreBoard();

  // Build deck
  const size = parseInt(document.getElementById("tiles").value, 10);
  let deck = Array.from({ length: size * size }, (_, i) => i + 1);
  deck[deck.length - 1] = 0;

  // Get difficulty setting
  const difficulty = document.getElementById("difficulty").value;
  const shuffleMoves = difficultyMoves[difficulty];

  // Real shuffle based on difficulty
  deck = relayShuffle(deck, size, shuffleMoves);
  currentDeck = deck.slice();

  // Render board
  renderBoard(currentDeck);

  // Show container
  gameContainer.style.display = "block";
});

// Relay shuffle helper (legal moves only)
function relayShuffle(deck, size, moves = 200) {
  let emptyIndex = deck.indexOf(0);

  for (let i = 0; i < moves; i++) {
    const neighbors = getAdjacentIndexes(emptyIndex, size);
    const swapWith = neighbors[Math.floor(Math.random() * neighbors.length)];

    [deck[emptyIndex], deck[swapWith]] = [deck[swapWith], deck[emptyIndex]];

    emptyIndex = swapWith;
  }

  return deck;
}

// Adjacency check for gameplay
function isAdjacent(i1, i2, size) {
  const r1 = Math.floor(i1 / size);
  const c1 = i1 % size;
  const r2 = Math.floor(i2 / size);
  const c2 = i2 % size;

  return Math.abs(r1 - r2) + Math.abs(c1 - c2) === 1;
}

// Adjacency Check for shuffling
function getAdjacentIndexes(emptyIndex, size) {
  const row = Math.floor(emptyIndex / size);
  const col = emptyIndex % size;

  const neighbors = [];

  if (row > 0) neighbors.push(emptyIndex - size);      // up
  if (row < size - 1) neighbors.push(emptyIndex + size); // down
  if (col > 0) neighbors.push(emptyIndex - 1);         // left
  if (col < size - 1) neighbors.push(emptyIndex + 1);  // right

  return neighbors;
}

// Render board from deck
function renderBoard(deck) {
  gameBoard.innerHTML = "";

  const size = parseInt(document.getElementById("tiles").value, 10);

  gameBoard.style.gridTemplateColumns = `repeat(${size}, 100px)`;

  deck.forEach((num, index) => {
    const tile = document.createElement("div");
    tile.classList.add("tile");

    tile.dataset.index = index;
    tile.dataset.value = num;

    if (num === 0) {
      tile.classList.add("empty");
      tile.textContent = "";
    } else {
      tile.textContent = num;
    }

    tile.addEventListener("click", () => moveTile(tile));
    gameBoard.appendChild(tile);
  });
}

// Move tile
function moveTile(tile) {
  // Block illegal turn in online mode
  if (playMode === "online" && !isMyTurn) return;

  const size = parseInt(document.getElementById("tiles").value, 10);

  const clickedIndex = parseInt(tile.dataset.index, 10);
  const emptyTile = document.querySelector(".tile.empty");
  if (!emptyTile) return;

  const emptyIndex = parseInt(emptyTile.dataset.index, 10);

  if (!isAdjacent(clickedIndex, emptyIndex, size)) return;

  // Play sound
  moveSound.currentTime = 0;
  moveSound.play();

  // Update deck (authoritative state)
  const temp = currentDeck[clickedIndex];
  currentDeck[clickedIndex] = currentDeck[emptyIndex];
  currentDeck[emptyIndex] = temp;

  // LOCAL vs ONLINE branches

  if (playMode === "online") {
    // ONLINE MODE

    moveCount++;
    updateScoreBoard();

    // Re-render board to keep DOM consistent
    renderBoard(currentDeck);

    // Notify server of the move
    sendMoveToServer({
      clickedIndex,
      emptyIndex,
      deck: currentDeck
    });

    // End your turn
    isMyTurn = false;

    // Check if this move solved the puzzle (server will decide winner)
    checkWin();

    return;
  }

  // LOCAL MODE ONLY
  moveCount++;
  updateScoreBoard();

  renderBoard(currentDeck);
  checkWin();
}

// General win checker
function isWinningDeck(deck) {
  // winning: 1..(n*n-1), then 0 at the end
  for (let i = 0; i < deck.length - 1; i++) {
    if (deck[i] !== i + 1) return false;
  }
  return deck[deck.length - 1] === 0;
}

// Check win (local and online)
function checkWin() {
  if (!isWinningDeck(currentDeck)) return;

  if (playMode === "local") {
    endGame(true);
    return;
  }

  // ONLINE MODE — notify server only
  fetch("finish_match.php", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      match_id: matchId,
      moves: moveCount,
      time: timeElapsed,
      user_id: userId
    })
  })
    .then(res => res.json())
    .then(data => {
      if (data.status === "waiting") {
        alert("Waiting for your opponent to finish...");
        return;
      }

      if (data.status === "already_finished") {
        alert("Match already finished.");
        return;
      }

      const isWinner = data.winner_id == userId;
      alert(isWinner ? "🎉 You win!" : "😞 You lost this match.");

      showLeaderboard();
      gameContainer.style.display = "none";
    });
}

// Timer
function startCounter() {
  if (playMode === "online") return; // online timing comes from server or separate logic
  clearInterval(timer);
  timeElapsed = 0;
  timeLeftSpan.textContent = timeElapsed;
  timer = setInterval(() => {
    timeElapsed++;
    timeLeftSpan.textContent = timeElapsed;
  }, 1000);
}

function stopCounter() {
  clearInterval(timer);
}

// End game (local only, plus legacy online path if needed)
function endGame(won) {
  stopCounter();

  // LOCAL MODE
  if (playMode === "local") {
    alert(won ? "Well Done!" : "Try again!");

    const playerName = prompt("Enter your name:");
    if (!playerName) return;

    saveScore({
      name: playerName,
      moves: moveCount,
      time: timeElapsed,
      playMode: playMode,
      gameMode: gameMode
    });

    showLeaderboard();
    gameContainer.style.display = "none";
    return;
  }

  // ONLINE MODE
  // You can keep this as a fallback or remove it entirely
  if (playMode === "online") {
    const payload = new URLSearchParams({
      match_id: matchId,
      moves: moveCount,
      time: timeElapsed
    });

    fetch("finish_match.php", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: payload
    })
      .then(res => res.json())
      .then(data => {
        if (data.status === "waiting") {
          alert("Waiting for your opponent to finish...");
          return;
        }

        if (data.status === "already_finished") {
          alert("Match already finished.");
          return;
        }

        const isWinner = data.winner_id == userId;
        alert(isWinner ? " You win!" : " You lost this match.");

        showLeaderboard();
        gameContainer.style.display = "none";
      });
  }
}

// Scoreboard + Leaderboard
function updateScoreBoard() {
  scoreBoard.innerHTML = `
    <h3>Stats</h3>
    <p>Player 1: ${scores[1]} points</p>
    <p>Moves: ${moveCount}</p>
    <p>Current Turn: Player ${currentPlayer}</p>
  `;

  const threshold = 20; // change when background appears
  const fadeLayer = document.getElementById("bg-fade-layer");

  if (fadeLayer) {
    if (moveCount >= threshold) {
      fadeLayer.style.backgroundImage = "url('../assets/winter-holiday-desktop.jpg')";
      fadeLayer.style.opacity = "1";
    } else {
      fadeLayer.style.opacity = "0";
    }
  }
}

function saveScore(entry) {
  // ONLINE MODE → send to backend
  if (entry.playMode === "online") {
    const payload = new URLSearchParams({
      username: entry.name,
      moves: entry.moves,
      time: entry.time,
      playMode: "online",
      gameMode: entry.gameMode
    });

    fetch("save_score.php", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: payload
    });

    return;
  }

  // LOCAL MODE → save to localStorage
  let leaderboard = JSON.parse(localStorage.getItem("leaderboard")) || {
    local: {
      speed: [],
      moves: []
    },
    online: {
      speed: [],
      moves: []
    }
  };

  if (entry.playMode === "local") {
    if (entry.gameMode === "speed") {
      leaderboard.local.speed.push(entry);
      leaderboard.local.speed.sort((a, b) => a.time - b.time);
      leaderboard.local.speed = leaderboard.local.speed.slice(0, 5);
    } else {
      leaderboard.local.moves.push(entry);
      leaderboard.local.moves.sort((a, b) => a.moves - b.moves);
      leaderboard.local.moves = leaderboard.local.moves.slice(0, 5);
    }
  }

  localStorage.setItem("leaderboard", JSON.stringify(leaderboard));
}

function showLeaderboard() {
  fetch("get_leaderboard.php")
    .then(res => res.json())
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

function renderList(list) {
  if (!list || list.length === 0) return "<p>No scores yet.</p>";

  return list
    .map((entry, i) => {
      const name = entry.username || entry.name;
      const value = entry.time ?? entry.moves;
      return `<p>${i + 1}. ${name} — ${value}</p>`;
    })
    .join("");
}

// Send move to server (online)
function sendMoveToServer(moveData) {
  fetch("send_move.php", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      matchId,
      isHost,
      clickedIndex: moveData.clickedIndex,
      emptyIndex: moveData.emptyIndex,
      deck: JSON.stringify(moveData.deck)
    })
  });
}

// Apply opponent move (online)
function applyOpponentMove(data) {
  const { clickedIndex, emptyIndex, deck } = data;

  // Update deck
  currentDeck = deck.slice();

  // Re-render board (same method as local)
  renderBoard(currentDeck);

  // Opponent finished their turn
  isMyTurn = true;

  // Check if opponent just won
  checkWin();
}