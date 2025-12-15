// ======================================================
// Reindeer Games 🎄
// Sliding Tile Puzzle (Local + Online)
// ======================================================

// ---------------- DOM ELEMENTS ----------------
const startBtn = document.getElementById("start-game");
const gameContainer = document.getElementById("memory-game-container");
const gameBoard = document.getElementById("game-board");
const timeLeftSpan = document.getElementById("time");
const gameTypeSelect = document.getElementById("play-mode");
const modeContainer = document.getElementById("mode-container");

// Background fade layer
const fadeLayer = document.getElementById("bg-fade-layer");

// User ID (online)
const userId = window.USER_ID_FROM_SERVER ?? null;

// ---------------- DIFFICULTY ----------------
const difficultyMoves = {
  easy: 50,
  medium: 200,
  hard: 400,
  grinch: 1000
};

// ---------------- SOUND EFFECTS ----------------
const moveSound = new Audio("../assets/whoosh.mp3");
moveSound.volume = 0.5;

const holidaySound = new Audio("../assets/soft_jingle.mp3");
holidaySound.volume = 0.6;

const winSound = new Audio("../assets/yay.mp3");
winSound.volume = 0.8;

// ---------------- SCOREBOARD ----------------
const scoreBoard = document.createElement("div");
scoreBoard.id = "score-board";
document.body.insertBefore(scoreBoard, gameContainer);

const leaderboardDiv = document.createElement("div");
leaderboardDiv.id = "leaderboard";
document.body.appendChild(leaderboardDiv);

// ---------------- GLOBAL STATE ----------------
let currentDeck = [];
let playMode = "local";
let gameMode = null;

let matchId = null;
let isHost = false;
let isMyTurn = true;

let timer = null;
let timeElapsed = 0;
let moveCount = 0;
let currentPlayer = 1;
let scores = { 1: 0 };
let holidaySoundPlayed = false;

// ======================================================
// MODE SELECTOR
// ======================================================
gameTypeSelect.addEventListener("change", () => {
  modeContainer.style.display =
    gameTypeSelect.value === "online" ? "block" : "none";
});

// ======================================================
// START GAME
// ======================================================
startBtn.addEventListener("click", () => {
  playMode = document.getElementById("play-mode").value;
  gameMode = document.getElementById("game-mode")?.value ?? "moves";

  if (playMode === "online") {
    isHost ? createOnlineMatch() : joinOnlineMatch();
    return;
  }

  // ----- LOCAL GAME -----
  startCounter();
  moveCount = 0;
  currentPlayer = 1;
  holidaySoundPlayed = false;
  updateScoreBoard();

  const size = parseInt(document.getElementById("tiles").value, 10);
  let deck = Array.from({ length: size * size }, (_, i) => i + 1);
  deck[deck.length - 1] = 0;

  const difficulty = document.getElementById("difficulty").value;
  deck = relayShuffle(deck, size, difficultyMoves[difficulty]);

  currentDeck = deck.slice();
  renderBoard(currentDeck);
  gameContainer.style.display = "block";
});

// ======================================================
// SHUFFLING + ADJACENCY
// ======================================================
function relayShuffle(deck, size, moves) {
  let emptyIndex = deck.indexOf(0);

  for (let i = 0; i < moves; i++) {
    const neighbors = getAdjacentIndexes(emptyIndex, size);
    const swapWith = neighbors[Math.floor(Math.random() * neighbors.length)];
    [deck[emptyIndex], deck[swapWith]] = [deck[swapWith], deck[emptyIndex]];
    emptyIndex = swapWith;
  }
  return deck;
}

function isAdjacent(i1, i2, size) {
  const r1 = Math.floor(i1 / size);
  const c1 = i1 % size;
  const r2 = Math.floor(i2 / size);
  const c2 = i2 % size;
  return Math.abs(r1 - r2) + Math.abs(c1 - c2) === 1;
}

function getAdjacentIndexes(index, size) {
  const row = Math.floor(index / size);
  const col = index % size;
  const neighbors = [];

  if (row > 0) neighbors.push(index - size);
  if (row < size - 1) neighbors.push(index + size);
  if (col > 0) neighbors.push(index - 1);
  if (col < size - 1) neighbors.push(index + 1);

  return neighbors;
}

// ======================================================
// RENDER BOARD
// ======================================================
function renderBoard(deck) {
  gameBoard.innerHTML = "";
  const size = parseInt(document.getElementById("tiles").value, 10);
  gameBoard.style.gridTemplateColumns = `repeat(${size}, 100px)`;

  deck.forEach((num, index) => {
    const tile = document.createElement("div");
    tile.className = "tile";
    tile.dataset.index = index;
    tile.dataset.value = num;

    if (num === 0) {
      tile.classList.add("empty");
    } else {
      tile.textContent = num;
    }

    tile.addEventListener("click", () => moveTile(tile));
    gameBoard.appendChild(tile);
  });
}

// ======================================================
// MOVE TILE
// ======================================================
function moveTile(tile) {
  if (playMode === "online" && !isMyTurn) return;

  const size = parseInt(document.getElementById("tiles").value, 10);
  const clickedIndex = parseInt(tile.dataset.index, 10);
  const emptyTile = document.querySelector(".tile.empty");
  const emptyIndex = parseInt(emptyTile.dataset.index, 10);

  if (!isAdjacent(clickedIndex, emptyIndex, size)) return;

  moveSound.currentTime = 0;
  moveSound.play();

  [currentDeck[clickedIndex], currentDeck[emptyIndex]] =
    [currentDeck[emptyIndex], currentDeck[clickedIndex]];

  moveCount++;
  updateScoreBoard();
  renderBoard(currentDeck);

  if (playMode === "online") {
    sendMoveToServer({ clickedIndex, emptyIndex, deck: currentDeck });
    isMyTurn = false;
  }

  checkWin();
}

// ======================================================
// WIN CHECK
// ======================================================
function isWinningDeck(deck) {
  for (let i = 0; i < deck.length - 1; i++) {
    if (deck[i] !== i + 1) return false;
  }
  return deck[deck.length - 1] === 0;
}

function checkWin() {
  if (!isWinningDeck(currentDeck)) return;

  winSound.play();
  stopCounter();
  resetBackground();

  if (playMode === "local") {
    alert("🎉 Well Done!");
    const name = prompt("Enter your name:");
    if (name) saveScore({ name, moves: moveCount, time: timeElapsed });
    showLeaderboard();
  }

  gameContainer.style.display = "none";
}

// ======================================================
// TIMER
// ======================================================
function startCounter() {
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

// ======================================================
// BACKGROUND + SCOREBOARD
// ======================================================
function resetBackground() {
  fadeLayer.style.opacity = "0";
  fadeLayer.style.backgroundImage = "";
}

function updateScoreBoard() {
  scoreBoard.innerHTML = `
    <h3>Stats</h3>
    <p>Moves: ${moveCount}</p>
    <p>Time: ${timeElapsed}s</p>
  `;

  if (moveCount >= 20) {
    fadeLayer.style.backgroundImage =
      "url('../assets/winter-holiday-desktop.jpg')";
    fadeLayer.style.opacity = "1";

    if (!holidaySoundPlayed) {
      holidaySound.play();
      holidaySoundPlayed = true;
    }
  }
}

// ======================================================
// LEADERBOARD (LOCAL)
// ======================================================
function saveScore(entry) {
  let leaderboard = JSON.parse(localStorage.getItem("leaderboard")) || [];
  leaderboard.push(entry);
  leaderboard.sort((a, b) =>
    a.moves !== b.moves ? a.moves - b.moves : a.time - b.time
  );
  localStorage.setItem("leaderboard", JSON.stringify(leaderboard.slice(0, 5)));
}

function showLeaderboard() {
  const leaderboard = JSON.parse(localStorage.getItem("leaderboard")) || [];
  leaderboardDiv.innerHTML = "<h3>Leaderboard</h3>";
  leaderboard.forEach((e, i) => {
    leaderboardDiv.innerHTML += `<p>${i + 1}. ${e.name} — ${e.moves} moves, ${e.time}s</p>`;
  });
}

// ======================================================
// ONLINE HELPERS (unchanged logic)
//
function createOnlineMatch() {
  matchId = crypto.randomUUID();
  isHost = true;
  isMyTurn = true;
  initOnlineListeners();
}

function joinOnlineMatch() {
  isHost = false;
  isMyTurn = false;
  initOnlineListeners();
}

function initOnlineListeners() {
  setInterval(pollForOpponentMove, 1000);
}

function pollForOpponentMove() {
  if (!matchId) return;
  fetch(`poll_match.php?matchId=${matchId}&isHost=${isHost}`)
    .then(res => res.json())
    .then(data => {
      if (!data) return;
      if (data.last_move_by !== (isHost ? "host" : "join")) {
        currentDeck = JSON.parse(
          data[isHost ? "join_deck" : "host_deck"]
        );
        renderBoard(currentDeck);
        isMyTurn = true;
        checkWin();
      }
    });
}

function sendMoveToServer(move) {
  fetch("send_move.php", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      matchId,
      isHost,
      clickedIndex: move.clickedIndex,
      emptyIndex: move.emptyIndex,
      deck: JSON.stringify(move.deck)
    })
  });
}
