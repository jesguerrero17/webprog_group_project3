# Development Journal for webprog_group_project3

Dev Journal contains the problem solving process used in the development of Group Project 3

Format is as follows:

# Problem Description

# Associated Code

# Problem Solution Description

# Associated Code

Example

# Puzzle mechanics currently allow for random shuffle but do not limit the moves to only solvable iterations. We are using a shuffle function that randomizes the alloted numbers pre assignment without considering the restrictions of board movement. In this way the numbers are shuffled and subsequently assigned to a tile upon render.

// Shuffle helper
function shuffle(array) {
for (let i = array.length - 1; i > 0; i--) {
const j = Math.floor(Math.random() \* (i + 1));
[array[i], array[j]] = [array[j], array[i]];
}
}


# In order to improve shuffle ability and remove the possibility of unsolvable sequences, a relay shuffle was implemented. This method utilizes the current board restrictions and position as a startting point from which to produce a new game iteration by applying a set number of moves determined by the difficulty choice of the user. With this method we are able to provide a customizable gameboard that does not produce usolvable starting sequences.


// Relay shuffle helper
function relayShuffle(deck, size, moves = 200) {
  let emptyIndex = deck.indexOf(0);

  for (let i = 0; i < moves; i++) {
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