import { render, parseSjdon, createElement } from "./lib/suiweb.min.js";

const SERVICE = "http://localhost:3000/api/data?api-key=c4game";

const Player = {
  red: "r",
  blue: "b",
  green: "g",
};

let state = {
  board: [
    ["-", "-", "-", "-", "-", "-", "-"],

    ["-", "-", "-", "-", "-", "-", "-"],

    ["-", "-", "-", "-", "-", "-", "-"],

    ["-", "-", "-", "-", "-", "-", "-"],

    ["-", "-", "-", "-", "-", "-", "-"],

    ["-", "-", "-", "-", "-", "-", "-"],
  ],
  current: Player.red,
  previous: Player.blue,
  winner: false,
  isServerConnected: false,
  winningStones: [],
};

let stateSeq = [];

function shouldButtonBeVisible() {
  checkServerAvailability();
  let loadFromServerButton = document.querySelector(".loadFromServerButton");
  loadFromServerButton.style.visibility = state.isServerConnected
    ? "visible"
    : "hidden";
  let saveToServerButton = document.querySelector(".saveToServerButton");
  saveToServerButton.style.visibility = state.isServerConnected
    ? "visible"
    : "hidden";
}

function setStone(column) {
  let rowElements = getRowElementsInArray(column);
  for (let i = 5; i >= 0; i--) {
    if (rowElements[i] === "-") {
      state.board[i][column] = state.current;
      break;
    }
  }

  state.previous = state.current;
  if (state.current === Player.red) {
    state.current = Player.blue;
  } else {
    state.current = Player.red;
  }

  // how to push a copy of the array to a array
  stateSeq.push(state.board.map((arr) => arr.slice()));

  showBoard();

  //  Check for winner
  if (connect4Winner(state.previous, state.board)) {
    document.getElementById("winner").textContent =
      getPreviousPlayer() + " wins!";
    state.winner = true;
  }
  if (state.winner) {

    //color it green
    state.winningStones.forEach(([row, col]) => {
      // Assuming you have a way to select a specific stone on the board,
      // change its color to green.
      const stoneElement = document.getElementById(`stone-${row}-${col}`);
      stoneElement.style.backgroundColor = 'green';
    });


    setTimeout(() => {
      // alert the winner
      alert("Player " + getPreviousPlayer() + " has won the game!");
      //  Reset game
      state.board = Array(6)
        .fill("-")
        .map((el) => Array(7).fill("-"));
      state.current = Player.red;
      document.getElementById("winner").textContent = "you both are loosers";
      stateSeq = [];
      initGame();
    }, 300);
  }
}




function getRowElementsInArray(column) {
  let rowElements = [];
  for (let i = 0; i < 6; i++) {
    rowElements.push(state.board[i][column]);
  }
  return rowElements;
}

function getCurrentPlayer() {
  if (state.current === Player.red) {
    return "red";
  } else {
    return "blue";
  }
}

function getPreviousPlayer() {
  if (state.previous === Player.red) {
    return "red";
  } else {
    return "blue";
  }
}

function initGame() {
  stateSeq.push(state.board.map((arr) => arr.slice()));
  showBoard();
  state.winner = false;
}

document.getElementById("reset").addEventListener("click", function (event) {
  state.board = Array(6)
    .fill("-")
    .map((el) => Array(7).fill("-"));
  state.current = Player.red;
  document.getElementById("winner").textContent = "you both are loosers";
  stateSeq = [];
  initGame();
});

document.getElementById("undo").addEventListener("click", function (event) {
  if (stateSeq.length > 1) {
    state.current = state.previous;
    stateSeq.pop();
    state.board = stateSeq[stateSeq.length - 1];
  }
  showBoard();
});

function checkServerAvailability() {
  fetch(SERVICE, {
    method: "GET",
  })
    .then((response) => {
      console.log("Server is available");
      state.isServerConnected = true;
      // Server is available, you can enable the buttons here
    })
    .catch((error) => {
      console.log("Server is not available");
      state.isServerConnected = false;
      // Server is not available, you can disable the buttons here
    });
}

// Save current state to LocalStorage
document
  .getElementById("saveState")
  .addEventListener("click", function (event) {
    localStorage.setItem("boardState", JSON.stringify(state.board));
  });

// Load state from LocalStorage
document
  .getElementById("loadState")
  .addEventListener("click", function (event) {
    const savedState = localStorage.getItem("boardState");
    if (savedState) {
      state.board = JSON.parse(savedState);
      showBoard();
    }
  });

document
  .getElementById("loadStateFromServer")
  .addEventListener("click", function (event) {
    fetch(SERVICE, {
      method: "GET",
    })
      .then((response) => response.json())
      .then((data) => {
        state.board = data.board;
        showBoard();
      });
  });

//  Put current state to server
//
document
  .getElementById("saveStateToServer")
  .addEventListener("click", function (event) {
    fetch(SERVICE, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        // replace with the actual id
        board: state.board,
      }),
    });
  });

function countStones(colour) {
  let count = 0;
  for (let i = 0; i < 6; i++) {
    for (let j = 0; j < 7; j++) {
      if (state.board[i][j] === colour) {
        count++;
      }
    }
  }
  return count;
}

function connect4Winner(colour, board) {
  let winner = false;
  for (let i = 0; i < 6; i++) {
    for (let j = 0; j < 4; j++) {
      if (
        board[i][j] === colour &&
        board[i][j + 1] === colour &&
        board[i][j + 2] === colour &&
        board[i][j + 3] === colour
      ) {
        winner = true;
        state.winningStones = [
          [i, j],
          [i, j + 1],
          [i, j + 2],
          [i, j + 3],
        ];
      }
    }
  }
  for (let i = 0; i < 3; i++) {
    for (let j = 0; j < 7; j++) {
      if (
        board[i][j] === colour &&
        board[i + 1][j] === colour &&
        board[i + 2][j] === colour &&
        board[i + 3][j] === colour
      ) {
        winner = true;
        state.winningStones = [
          [i, j],
          [i + 1, j],
          [i + 2, j],
          [i + 3, j],
        ];
      }
    }
  }
  for (let i = 0; i < 3; i++) {
    for (let j = 0; j < 4; j++) {
      if (
        board[i][j] === colour &&
        board[i + 1][j + 1] === colour &&
        board[i + 2][j + 2] === colour &&
        board[i + 3][j + 3] === colour
      ) {
        winner = true;
        state.winningStones = [
          [i, j],
          [i + 1, j + 1],
          [i + 2, j + 2],
          [i + 3, j + 3],
        ];
      }
    }
  }
  for (let i = 0; i < 3; i++) {
    for (let j = 3; j < 7; j++) {
      if (
        board[i][j] === colour &&
        board[i + 1][j - 1] === colour &&
        board[i + 2][j - 2] === colour &&
        board[i + 3][j - 3] === colour
      ) {
        winner = true;
        state.winningStones = [
          [i, j],
          [i + 1, j - 1],
          [i + 2, j - 2],
          [i + 3, j - 3],
        ];
      }
    }
  }
  return winner;
}

//  Components
//
const App = () => [Board, { board: state.board }];

const Field = ({ type, column, id }) => {
  const attributes = {
    class: "field",
    onclick: () => setStone(column),
  };

  if (type == "r") {
    return ["div", attributes, ["div", { class: "red piece", id: id}]];
  } else if (type == "b") {
    return ["div", attributes, ["div", { class: "blue piece", id: id }]];
  } else if (type == "g") {
    return ["div", attributes, ["div", { class: "green piece", id: id }]];
  } else {
    return ["div", attributes];
  }
};

const Board = ({ board }) => {
  let rows = [];
  for (let i = 0; i < 7; i++) {
    let cols = [];
    for (let j = 0; j < 6; j++) {
      cols.push([Field, { type: board[j][i], column: i , id: `stone-${j}-${i}`}]);
    }
    rows.push(["div", { class: "row" }, ...cols]);
  }
  return ["div", { class: "board" }, ...rows];
};

//  Show board:
//  render [App]
//
function showBoard() {
  const app = document.getElementById("app");
  render(parseSjdon([App], createElement), app);

  if (countStones("r") > countStones("b")) {
    state.current = Player.blue;
  } else {
    state.current = Player.red;
  }


  const currPlay = document.getElementById("currentPlayer");
  
  if (countStones("r") > countStones("b")) {
    state.current = Player.blue;
  } else {
    state.current = Player.red;
  }
  currPlay.textContent = getCurrentPlayer();

  shouldButtonBeVisible();

  return app;
}

stateSeq.push(state.board.map((arr) => arr.slice()));
showBoard();
state.board.winner = false;
