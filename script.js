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
    // TO DO: Here we need to understand how to refference the numbers used in the gameboard, Are they pics?
  const size = parseInt(document.getElementById("tiles").value);
    const deck = Array.from({ length: size * size }, (_, i) => i + 1);

  
  // TO DO: Here how do we avoid unsovable shuffles?
  shuffle(deck);

  // Render board
  renderBoard(deck);
  

  // Show container
  gameContainer.style.display = "block";

});

// Shuffle helper
// TO DO: Here how do we avoid unsovable shuffles?
function shuffle(array) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
}

// Render board
function renderBoard(deck) {
  gameBoard.innerHTML = "";

  const size = parseInt(document.getElementById("tiles").value);

  gameBoard.style.gridTemplateColumns = `repeat(${size}, 100px)`;

  deck.forEach((num,index) => {
    const tile = document.createElement("div");
    tile.classList.add("tile");

    if (index === deck.length-1){
      tile.classList.add("empty");
      tile.textContent = "";
    }

    else{
      tile.textContent = num;
    }

    tile.dataset.index = index;
    tile.dataset.value = num;
    tile.addEventListener("click", () => moveTile(tile));
    gameBoard.appendChild(tile);
  });

}

function isAdjacent(i1, i2, size) {
  const r1 = Math.floor(i1 / size);
  const c1 = i1 % size;
  const r2 = Math.floor(i2 / size);
  const c2 = i2 % size;

  return Math.abs(r1 - r2) + Math.abs(c1 - c2) === 1;
}


// TO DO: Set up the tile move function
function moveTile(tile){
    console.log("Tile clicked:",tile);

    // Gather tile info and size
    const tiles = document.querySelectorAll(".tile");
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

    // Make Tile Swap visually
    emptyTile.textContent = tile.textContent;
    tile.textContent = "";

    // Update empty tile visually
    emptyTile.classList.remove("empty");
    tile.classList.add("empty");

    // Swap tile indexes
    emptyTile.dataset.value = tile.dataset.value;
    tile.dataset.value = "";


  // TO DO: check for win here

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