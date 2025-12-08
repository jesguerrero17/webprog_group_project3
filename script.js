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

    // TO DO: Make timer to start at 0 and count up
  timeLeftSpan.textContent = timeRemaining;

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

  deck.forEach((img, index) => {
    const tile = document.createElement("div");
    tile.classList.add("tile");

    tile.addEventListener("click", () => moveTile(tile));
    gameBoard.appendChild(tile);
  });

  tile = document.querySelectorAll(".tile");
}

// TO DO: Set up the tile move function
function moveTile(tile){
    console.log("Tile clicked:",tile);
}

let timeRemaining = 0;
let timer = null;
let scores = { 1: 0 }; // simple single-player scoreboard
let currentPlayer = 1;


// Timer
// TO DO: change timer to counter 
function startCounter() {
  clearInterval(timer);
  timeRemaining = 0;
  timer = setInterval(() => {
    timeRemaining++;
    timeLeftSpan.textContent = timeRemaining;
  }, 1000);
}


// End game
// TO DO: Modify to complete our game
function endGame(won) {
  clearInterval(timer);

// TO DO : Is there a case where game ends and a display should be made?
  alert(won ? "Well Done!" : "Try again!");

  // Prompt for name
  const p1Name = prompt("Enter name for Player 1:");

  saveScore(p1Name, scores[1]);

  showLeaderboard();
  gameContainer.style.display = "none";
}

// Scoreboard + Leaderboard
function updateScoreBoard() {
  scoreBoard.innerHTML = `
    <h3>Scores</h3>
    <p>Player 1: ${scores[1]} points</p>
    <p>Current Turn: Player ${currentPlayer}</p>
  `;
}

function saveScore(name, score) {
  let leaderboard = JSON.parse(localStorage.getItem("leaderboard")) || [];
  leaderboard.push({ name, score });
  leaderboard.sort((a, b) => b.score - a.score);
  leaderboard = leaderboard.slice(0, 5); // keep top 5
  localStorage.setItem("leaderboard", JSON.stringify(leaderboard));
}

function showLeaderboard() {
  let leaderboard = JSON.parse(localStorage.getItem("leaderboard")) || [];
  leaderboardDiv.innerHTML = "<h3>Leaderboard</h3>";
  leaderboard.forEach((entry, index) => {
    leaderboardDiv.innerHTML += `<p>P${index + 1} - ${entry.name}: ${entry.score}</p>`;
  });
}