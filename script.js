// Reindeer Games

// Sliding piece puzzle game

// Dom Elements

const startBtn = document.getElementById('start-game');
const gameContainer = document.getElementById("memory-game-container");
const gameBoard = document.getElementById("game-board");
const timeLeftSpan = document.getElementById("time");

// Scorebard and leaderbaord
const scoreBoard = document.createElement("div");
scoreBoard.id = "score-board";
document.body.insertBefore(scoreBoard, gameContainer);

const leaderboardDiv = document.createElement("div");
leaderboardDiv.id = "leaderboard";
document.body.appendChild(leaderboardDiv);

// Global Deck Variable
let currentDeck = [];


// Start game
startBtn.addEventListener("click", () => {
    // Start counter
  startCounter();

    // Initialize move Count
  moveCount = 0;

  // Reset scores and player turn
  // TO DO: this should reset the game and have the scorebaord set to 0
  currentPlayer = 1;
  updateScoreBoard();

  // Build deck
  const size = parseInt(document.getElementById("tiles").value);
  let deck = Array.from({ length: size * size }, (_, i) => i + 1);
  deck[deck.length - 1] = 0;

  // real shuffle
  //deck = relayShuffle(deck, size, 200);
  //currentDeck = deck.slice();

  // Create a deck that is one move from winning to test win functionality
  deck = oneMoveFromWinDeck(size);
  currentDeck = deck.slice();


  // Render board
  renderBoard(deck);
  

  // Show container
  gameContainer.style.display = "block";

});

function oneMoveFromWinDeck(size) {
  // solved deck: 1..(n*n-1), 0 at the end
  const deck = Array.from({ length: size * size }, (_, i) => i + 1);
  deck[deck.length - 1] = 0;

  // make exactly 1 legal move (swap empty with one neighbor)
  const emptyIndex = deck.indexOf(0); // last index
  const neighbors = getAdjacentIndexes(emptyIndex, size);
  const swapWith = neighbors[Math.floor(Math.random() * neighbors.length)];

  [deck[emptyIndex], deck[swapWith]] = [deck[swapWith], deck[emptyIndex]];
  return deck;
}

// Relay shuffle helper
function relayShuffle(deck, size, moves = 200) {
  let emptyIndex = deck.indexOf(0);

  for (let i = 0; i < moves; i++) {
    // Gets valid neighbors
    const neighbors = getAdjacentIndexes(emptyIndex, size);

    // Pick a random legal move
    const swapWith = neighbors[Math.floor(Math.random() * neighbors.length)];

    // Swap tiles
    [deck[emptyIndex], deck[swapWith]] = [deck[swapWith], deck[emptyIndex]];

    // Update empty index
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

  if (row > 0) neighbors.push(emptyIndex - size);     // up
  if (row < size - 1) neighbors.push(emptyIndex + size); // down
  if (col > 0) neighbors.push(emptyIndex - 1);        // left
  if (col < size - 1) neighbors.push(emptyIndex + 1); // right

  return neighbors;
}


// Render board
function renderBoard(deck) {
  gameBoard.innerHTML = "";

  const size = parseInt(document.getElementById("tiles").value);

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



// TO DO: Set up the tile move function
function moveTile(tile){
    console.log("Tile clicked:",tile);

    // Gather tile info and size
    const size = parseInt(document.getElementById("tiles").value);

    // Identify clicked tile and empty tile index
    const clickedIndex = parseInt(tile.dataset.index);
    const emptyTile = document.querySelector(".tile.empty");
    const emptyIndex = parseInt(emptyTile.dataset.index);

    // Check for adjacency to prevent illegal moves
    if (!isAdjacent(clickedIndex, emptyIndex, size)) return;

    // Move Count Incremeant
    moveCount++;
    updateScoreBoard();

    // Swap text
    const tempText = tile.textContent;
    tile.textContent = "";
    emptyTile.textContent = tempText;

    // Swap classes
    tile.classList.add("empty");
    emptyTile.classList.remove("empty");

    // Swap dataset.value
    const tempValue = tile.dataset.value;
    tile.dataset.value = emptyTile.dataset.value;
    emptyTile.dataset.value = tempValue;

    // Swap dataset.index
    tile.dataset.index = emptyIndex;
    emptyTile.dataset.index = clickedIndex;

    // Update the underlying deck array
    const temp = currentDeck[clickedIndex];
    currentDeck[clickedIndex] = currentDeck[emptyIndex];
    currentDeck[emptyIndex] = temp;

    renderBoard(currentDeck);
    checkWin();


    console.log("Empty now at:", emptyTile.dataset.index);


}
function isWinningDeck(deck) {
  // winning: 1..(n*n-1), then 0 at the end
  for (let i = 0; i < deck.length - 1; i++) {
    if (deck[i] !== i + 1) return false;
  }
  return deck[deck.length - 1] === 0;
}

function checkWin() {
  if (isWinningDeck(currentDeck)) {
    endGame(true);
  }
}


let timeElapsed = 0;
let timer = null;
let scores = { 1: 0 }; // simple single-player scoreboard
let currentPlayer = 1;


// Move Counter

let moveCount = 0;


// Timer
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

// End game
// TO DO: Modify to complete our game
function endGame(won) {
  // Stop counter
  stopCounter();


// TO DO : Is there a case where game ends and a display should be made?
  alert(won ? "Well Done!" : "Try again!");

  // Prompt for name
  const playerName = prompt("Enter your name:");

  saveScore({
    name: playerName,
    moves: moveCount,
    time: timeElapsed,
  });

  showLeaderboard();
  gameContainer.style.display = "none";
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

  if (moveCount >= threshold) {
    fadeLayer.style.backgroundImage = "url('winter-holiday-desktop.jpg')";
    fadeLayer.style.opacity = "1";
  } else {
    fadeLayer.style.opacity = "0";
  }
}


function saveScore(entry) {
  let leaderboard = JSON.parse(localStorage.getItem("leaderboard")) || [];

  leaderboard.push(entry);
  leaderboard.sort((a, b) => {
    if (a.moves !== b.moves) return a.moves - b.moves;
    return a.time - b.time;
  });

  leaderboard = leaderboard.slice(0, 5); // keep top 5
  localStorage.setItem("leaderboard", JSON.stringify(leaderboard));
}

function showLeaderboard() {
  let leaderboard = JSON.parse(localStorage.getItem("leaderboard")) || [];
  leaderboardDiv.innerHTML = "<h3>Leaderboard</h3>";
  leaderboard.forEach((entry, index) => {
    leaderboardDiv.innerHTML += `
     <p>${index + 1}. ${entry.name} — ${entry.moves} moves, ${entry.time}s</p>
`;

  });
}
