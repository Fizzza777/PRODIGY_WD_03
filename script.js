const X_CLASS = "x";
const O_CLASS = "o";
const WINNING_COMBINATIONS = [
  [0, 1, 2],
  [3, 4, 5],
  [6, 7, 8],
  [0, 3, 6],
  [1, 4, 7],
  [2, 5, 8],
  [0, 4, 8],
  [2, 4, 6],
];

const cellElements = document.querySelectorAll(".cell");
const board = document.getElementById("board");
const turnIndicator = document.getElementById("turn-indicator");
const restartBtn = document.getElementById("restart-btn");
const winnerModal = document.getElementById("winner-modal");
const winnerText = document.getElementById("winner-text");
const nextRoundBtn = document.getElementById("next-round-btn");
const quitBtn = document.getElementById("quit-btn");
const pvpBtn = document.getElementById("pvp-btn");
const aiBtn = document.getElementById("ai-btn");

const scoreXElement = document.getElementById("score-x");
const scoreOElement = document.getElementById("score-o");
const scoreTiesElement = document.getElementById("score-ties");

let oTurn;
let isAiMode = false;
let scores = { x: 0, o: 0, ties: 0 };
let gameActive = true;

startGame();

restartBtn.addEventListener("click", startGame);
nextRoundBtn.addEventListener("click", startGame);
quitBtn.addEventListener("click", () => {
  winnerModal.classList.remove("visible");
  startGame();
});

pvpBtn.addEventListener("click", () => {
  setMode(false);
});

aiBtn.addEventListener("click", () => {
  setMode(true);
});

function setMode(ai) {
  isAiMode = ai;
  pvpBtn.classList.toggle("active", !ai);
  aiBtn.classList.toggle("active", ai);
  scores = { x: 0, o: 0, ties: 0 };
  updateScoreboard();
  startGame();
}

function startGame() {
  gameActive = true;
  oTurn = false;
  winnerModal.classList.remove("visible");
  cellElements.forEach((cell) => {
    cell.classList.remove(X_CLASS);
    cell.classList.remove(O_CLASS);
    cell.removeEventListener("click", handleClick);
    cell.addEventListener("click", handleClick, { once: true });
  });
  setBoardHoverClass();
  updateTurnIndicator();
}

function handleClick(e) {
  if (!gameActive) return;
  const cell = e.target;
  // If cell occupied, ignore (though {once:true} handles most cases, AI might need check)
  if (cell.classList.contains(X_CLASS) || cell.classList.contains(O_CLASS))
    return;

  const currentClass = oTurn ? O_CLASS : X_CLASS;
  placeMark(cell, currentClass);

  if (checkWin(currentClass)) {
    endGame(false, currentClass);
  } else if (isDraw()) {
    endGame(true);
  } else {
    swapTurns();
    setBoardHoverClass();
    updateTurnIndicator();

    if (isAiMode && oTurn && gameActive) {
      // Slight delay for realism
      setTimeout(makeAiMove, 500);
    }
  }
}

function endGame(draw, winningClass) {
  gameActive = false;
  if (draw) {
    winnerText.innerText = "Draw!";
    scores.ties++;
  } else {
    winnerText.innerText = `${
      winningClass === X_CLASS ? "Player X" : "Player O"
    } Wins!`;
    if (winningClass === X_CLASS) {
      scores.x++;
    } else {
      scores.o++;
    }
  }
  updateScoreboard();
  winnerModal.classList.add("visible");
}

function isDraw() {
  return [...cellElements].every((cell) => {
    return cell.classList.contains(X_CLASS) || cell.classList.contains(O_CLASS);
  });
}

function placeMark(cell, currentClass) {
  cell.classList.add(currentClass);
}

function swapTurns() {
  oTurn = !oTurn;
}

function setBoardHoverClass() {
  board.classList.remove(X_CLASS);
  board.classList.remove(O_CLASS);
  if (oTurn) {
    board.classList.add(O_CLASS);
  } else {
    board.classList.add(X_CLASS);
  }
}

function updateTurnIndicator() {
  turnIndicator.innerText = `${oTurn ? "Player O's" : "Player X's"} Turn`;
}

function updateScoreboard() {
  scoreXElement.textContent = scores.x;
  scoreOElement.textContent = scores.o;
  scoreTiesElement.textContent = scores.ties;
}

function checkWin(currentClass) {
  return WINNING_COMBINATIONS.some((combination) => {
    return combination.every((index) => {
      return cellElements[index].classList.contains(currentClass);
    });
  });
}

// --- AI LOGIC (Minimax) ---

function makeAiMove() {
  const boardState = getBoardState();
  const bestMoveIndex = minimax(boardState, O_CLASS).index;
  const cell = cellElements[bestMoveIndex];

  // Simulate click
  placeMark(cell, O_CLASS);
  cell.removeEventListener("click", handleClick); // Remove listener since we manually placed it

  if (checkWin(O_CLASS)) {
    endGame(false, O_CLASS);
  } else if (isDraw()) {
    endGame(true);
  } else {
    swapTurns();
    setBoardHoverClass();
    updateTurnIndicator();
  }
}

function getBoardState() {
  return [...cellElements].map((cell) => {
    if (cell.classList.contains(X_CLASS)) return X_CLASS;
    if (cell.classList.contains(O_CLASS)) return O_CLASS;
    return null; // Empty
  });
}

function getEmptyIndices(boardState) {
  const indices = [];
  boardState.forEach((val, idx) => {
    if (val === null) indices.push(idx);
  });
  return indices;
}

function minimax(newBoard, player) {
  const availSpots = getEmptyIndices(newBoard);

  if (checkWinState(newBoard, X_CLASS)) {
    return { score: -10 };
  } else if (checkWinState(newBoard, O_CLASS)) {
    return { score: 10 };
  } else if (availSpots.length === 0) {
    return { score: 0 };
  }

  const moves = [];

  for (let i = 0; i < availSpots.length; i++) {
    const move = {};
    move.index = availSpots[i];
    newBoard[availSpots[i]] = player;

    if (player === O_CLASS) {
      const result = minimax(newBoard, X_CLASS);
      move.score = result.score;
    } else {
      const result = minimax(newBoard, O_CLASS);
      move.score = result.score;
    }

    newBoard[availSpots[i]] = null; // Reset
    moves.push(move);
  }

  let bestMove;
  if (player === O_CLASS) {
    let bestScore = -10000;
    for (let i = 0; i < moves.length; i++) {
      if (moves[i].score > bestScore) {
        bestScore = moves[i].score;
        bestMove = i;
      }
    }
  } else {
    let bestScore = 10000;
    for (let i = 0; i < moves.length; i++) {
      if (moves[i].score < bestScore) {
        bestScore = moves[i].score;
        bestMove = i;
      }
    }
  }

  return moves[bestMove];
}

// Helper for Minimax to check win on virtual board
function checkWinState(board, player) {
  return WINNING_COMBINATIONS.some((combination) => {
    return combination.every((index) => {
      return board[index] === player;
    });
  });
}
