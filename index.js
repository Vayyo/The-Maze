// Get the canvas element and set its dimensions
const canvas = document.querySelector("#canvas");
const dimension = Math.floor(
  Math.min(
    document.documentElement.clientWidth,
    document.documentElement.clientHeight
  ) * 0.9
);
canvas.width = dimension;
canvas.height = dimension;

// Get the drawing context for the canvas
const ctx = canvas.getContext("2d");

// Set the number of cells and cell size
let cellCount = 10;
const cellSize = canvas.width / cellCount;

// Cell class to create cells
class Cell {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.visited = false;
    this.walls = { top: true, right: true, bottom: true, left: true };
    this.drawCell();
  }

  // Draw the cell on the canvas
  drawCell() {
    const xPos = this.x * cellSize;
    const yPos = this.y * cellSize;
    ctx.beginPath();
    if (this.walls.top) {
      ctx.moveTo(xPos, yPos);
      ctx.lineTo(xPos + cellSize, yPos);
    }
    if (this.walls.right) {
      ctx.moveTo(xPos + cellSize, yPos);
      ctx.lineTo(xPos + cellSize, yPos + cellSize);
    }
    if (this.walls.bottom) {
      ctx.moveTo(xPos + cellSize, yPos + cellSize);
      ctx.lineTo(xPos, yPos + cellSize);
    }
    if (this.walls.left) {
      ctx.moveTo(xPos, yPos + cellSize);
      ctx.lineTo(xPos, yPos);
    }
    ctx.stroke();
  }

  // Remove the walls between two cells
  removeWalls(direction, adjacentCell) {
    const opposite = {
      top: "bottom",
      right: "left",
      bottom: "top",
      left: "right",
    };
    this.walls[direction] = false;
    adjacentCell.walls[opposite[direction]] = false;
  }
}

// The number of rows and columns in the grid
const noOfRows = cellCount;
const noOfCols = cellCount;
const gridCells = []; // array to store the cells

// Function to create grid cells
function createCells() {
  ctx.strokeRect(0, 0, canvas.width, canvas.height);
  for (let y = 0; y < noOfRows; y++) {
    for (let x = 0; x < noOfCols; x++) {
      const cell = new Cell(x, y);
      gridCells.push(cell);
    }
  }
}
createCells();

let currentCell, gridHasUnvisitedCells;
const stack = []; // Array to keep track of visited cells

// The Depth-First algorithm
function dfs(cell) {
  currentCell = cell;
  currentCell.visited = true;
  gridHasUnvisitedCells = gridCells.some((e) => !e.visited);

  // If there are unvisited cells, continue exploring
  if (gridHasUnvisitedCells) {
    const adjacentCells = getAdjacentCells(currentCell);
    const unvisitedAdjacentCells = Object.values(adjacentCells).some(
      (e) => !e.visited
    );
    if (unvisitedAdjacentCells) {
      // pick an adjacent cell and move there to continue exploring
      stack.push(currentCell);
      const unvisitedDirections = Object.keys(adjacentCells).filter(
        (e) => !adjacentCells[e].visited
      );
      const nextCellDirection =
        unvisitedDirections[
          Math.floor(Math.random() * unvisitedDirections.length)
        ];
      const nextCell = adjacentCells[nextCellDirection];
      currentCell.removeWalls(nextCellDirection, nextCell);
      redraw();
      currentCell = nextCell;
      setTimeout(dfs, 50, currentCell);
    } else {
      // backtrack to the previous cell if at dead end
      stack.pop();
      currentCell = stack[stack.length - 1];
      redraw();
      setTimeout(dfs, 50, currentCell);
    }
  } else {
    // maze generated... add the player and destination
    addPlayer(gridCells[0], gridCells[gridCells.length - 1]);
  }
}

// Start the depth-first search from the first cell
dfs(gridCells[0]);

// Get the adjacent cells of a cell
function getAdjacentCells(cell) {
  const { x: col, y: row } = cell;
  const cellIndex = gridCells.indexOf(cell);
  const adjacentCells = {};

  if (row > 0) adjacentCells.top = gridCells[cellIndex - noOfCols];

  if (row < noOfRows - 1)
    adjacentCells.bottom = gridCells[cellIndex + noOfCols];

  if (col > 0) adjacentCells.left = gridCells[cellIndex - 1];

  if (col < noOfCols - 1) adjacentCells.right = gridCells[cellIndex + 1];

  return adjacentCells;
}

// Redraw the grid on the canvas
function redraw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  gridCells.forEach((e) => e.drawCell());
  if (gridHasUnvisitedCells) highlight(currentCell, "green");
}

// Highlight a cell with a color
function highlight(cell, color) {
  const xPos = cell.x * cellSize;
  const yPos = cell.y * cellSize;
  ctx.fillStyle = color;
  ctx.fillRect(xPos, yPos, cellSize, cellSize);
}

// Function to add player and destination after maze generation
let playerCell, destinationCell;
function addPlayer(startCell, endCell) {
  redraw();
  playerCell = startCell;
  destinationCell = endCell;

  // Highlight the player cell & destination cell
  highlight(playerCell, "orange");
  highlight(destinationCell, "red");

  // Add controls for the player's movement
  addControls();
}

// Move player to the direction specified
function moveTo(direction) {
  const possiblePaths = Object.keys(playerCell.walls).filter(
    (e) => !playerCell.walls[e]
  );

  if (possiblePaths.includes(direction)) {
    playerCell = getAdjacentCells(playerCell)[direction];
    redraw();
    highlight(playerCell, "orange");
    highlight(destinationCell, "red");
  }
}

// Add touch and keyboard controls
function addControls() {
  // For touch controls
  document.body.addEventListener("touchstart", (e) => {
    let touchStartX = e.changedTouches[0].clientX;
    let touchStartY = e.changedTouches[0].clientY;

    document.body.addEventListener(
      "touchend",
      (e) => {
        let touchEndX = e.changedTouches[0].clientX;
        let touchEndY = e.changedTouches[0].clientY;

        let swipeX = touchEndX - touchStartX;
        let swipeY = touchEndY - touchStartY;

        if (Math.abs(swipeX) > Math.abs(swipeY)) {
          moveTo(swipeX > 0 ? "right" : "left");
        } else {
          moveTo(swipeY > 0 ? "bottom" : "top");
        }
      },
      { once: true }
    );
  });

  // For keyboard controls
  document.body.addEventListener("keydown", (event) => {
    const directions = {
      ArrowUp: "top",
      ArrowRight: "right",
      ArrowDown: "bottom",
      ArrowLeft: "left",
      KeyW: "top",
      KeyD: "right",
      KeyS: "bottom",
      KeyA: "left",
    };

    const direction = directions[event.code];
    if (direction) moveTo(direction);
  });
}
