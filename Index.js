document.addEventListener("DOMContentLoaded", () => {
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

  // Get the 2D rendering context for the canvas
  const ctx = canvas.getContext("2d");

  // Calculate the number of rows and columns in the grid
  let difficulty = 20;
  const cellSize = Math.floor(canvas.width / difficulty);
  const noOfRows = Math.floor(canvas.height / cellSize);
  const noOfCols = Math.floor(canvas.width / cellSize);

  // Initialize arrays and image elements
  const gridCells = [];
  const stack = [];
  const solveMazeStack = [];
  const icons = [new Image(), new Image()];
  icons[0].src = "/d.svg";
  icons[1].src = "/b.svg";

  // Declare variables used in the game
  let currentCell, playerCell, availableUnvisitedCells;
  let gameOver = false;

  class Cell {
    constructor(x, y) {
      this.x = x;
      this.y = y;
      this.visited = false;
      this.visitedForSolution = false;
      this.isSolutionPath = false;
      this.walls = { top: true, right: true, bottom: true, left: true };
      this.drawCell();
    }

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
      if (this.isSolutionPath) {
        ctx.fillStyle = "orange";
        ctx.fillRect(xPos, yPos, cellSize, cellSize);
      }
      ctx.stroke();
    }

    removeWall(position, adjacentCell) {
      switch (position) {
        case "topCell":
          this.walls.top = false;
          adjacentCell.walls.bottom = false;
          break;
        case "rightCell":
          this.walls.right = false;
          adjacentCell.walls.left = false;
          break;
        case "bottomCell":
          this.walls.bottom = false;
          adjacentCell.walls.top = false;
          break;
        case "leftCell":
          this.walls.left = false;
          adjacentCell.walls.right = false;
          break;
        default:
          break;
      }
      reDraw();
    }
  }

  // Function to create grid cells
  function createCells() {
    ctx.strokeRect(0, 0, canvas.width, canvas.height);
    for (let y = 0; y < noOfRows; y++) {
      for (let x = 0; x < noOfCols; x++) {
        let cell = new Cell(x, y);
        gridCells.push(cell);
      }
    }
  }

  // Call the createCells function to generate the grid
  createCells();

  //dfs algo
  dfs(gridCells[0]);
  function dfs(startingCell) {
    currentCell = startingCell;
    currentCell.visited = true;
    availableUnvisitedCells = gridCells.some((e) => !e.visited);
    if (availableUnvisitedCells) {
      const cellNeighbors = getAdjacentCells(currentCell);
      const unvisitedNeighbors = Object.entries(cellNeighbors).filter(
        ([position, neighbor]) => !neighbor.visited
      );
      if (unvisitedNeighbors.length) {
        stack.push(currentCell);
        const [chosenPosition, nextCell] =
          unvisitedNeighbors[
            Math.floor(Math.random() * unvisitedNeighbors.length)
          ];
        currentCell.removeWall(chosenPosition, nextCell);
        currentCell = nextCell;
        setTimeout(dfs, 5, currentCell);
      } else if (stack.length > 0) {
        stack.pop();
        currentCell = stack[stack.length - 1];
        reDraw();
        setTimeout(dfs, 5, currentCell);
      }
    } else {
      addPlayers(gridCells[0], gridCells[gridCells.length - 1]);
      //solveMaze(gridCells[0], gridCells[gridCells.length - 1]);
    }
  }

  // Applying players
  function addPlayers(startCell, endCell) {
    reDraw(); //Clean-up
    playerCell = startCell;
    destinationCell = endCell;

    // for player
    //addIcons(playerCell, 0);
    highlight(playerCell, "orange")

    // For destination
    //addIcons(destinationCell, 1);
    highlight(destinationCell, "red")

    // Get the element you want to detect swipes on
    addControls();
  }

  // Solving the maze
  function solveMaze(start, end) {
    if (start.x === end.x && start.y === end.y) {
      alert("found end");
      return;
    }
    currentCell = start;
    currentCell.visitedForSolution = true;
    currentCell.isSolutionPath = true;
    const possiblePathCells = getPossiblePath(currentCell);
    const unvisitedPossibleCells = possiblePathCells.filter(
      ([direc, neighbor]) => !neighbor.visitedForSolution
    );
    if (unvisitedPossibleCells.length) {
      const [direc, nextCell] =
        unvisitedPossibleCells[
          Math.floor(Math.random() * unvisitedPossibleCells.length)
        ];
      nextCell.isSolutionPath = true;
      solveMazeStack.push(nextCell);
      reDraw();
      setTimeout(solveMaze, 5, nextCell, gridCells[gridCells.length - 1]);
    } else if (solveMazeStack.length > 0) {
      currentCell = solveMazeStack.pop();
      currentCell.isSolutionPath = false;
      currentCell = solveMazeStack[solveMazeStack.length - 1];
      reDraw();
      setTimeout(solveMaze, 5, currentCell, gridCells[gridCells.length - 1]);
    }
  }

  function getPossiblePath(cell) {
    const adjacentCells = Object.entries(getAdjacentCells(cell));
    const linkedWalls = Object.entries(cell.walls)
      .filter(([dir, hasWall]) => !hasWall)
      .map(([dir]) => `${dir}Cell`);
    const possiblePathCells = adjacentCells.filter(([key]) =>
      linkedWalls.includes(key)
    );

    return possiblePathCells;
  }

  function getAdjacentCells(cell) {
    const { x: col, y: row } = cell;
    const cellIndexInGrid = gridCells.indexOf(cell);
    const topCell = row > 0 ? gridCells[cellIndexInGrid - noOfCols] : undefined;
    const bottomCell =
      row < noOfRows - 1 ? gridCells[cellIndexInGrid + noOfCols] : undefined;
    const leftCell = col > 0 ? gridCells[cellIndexInGrid - 1] : undefined;
    const rightCell =
      col < noOfCols - 1 ? gridCells[cellIndexInGrid + 1] : undefined;

    let adjacentCells = { topCell, rightCell, bottomCell, leftCell };

    adjacentCells = Object.fromEntries(
      Object.entries(adjacentCells).filter(
        ([key, value]) => typeof value !== "undefined"
      )
    );
    return adjacentCells;
  }

  function reDraw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    gridCells.forEach((e) => e.drawCell());
    if (availableUnvisitedCells) highlight(currentCell);
  }

  function highlight(cell, color = "orange") {
    const xPos = cell.x * cellSize;
    const yPos = cell.y * cellSize;
    ctx.fillStyle = color;
    ctx.fillRect(xPos, yPos, cellSize, cellSize);
  }

  function addIcons(cell, value) {
    const xPos = cell.x * cellSize;
    const yPos = cell.y * cellSize;
    ctx.drawImage(icons[value], xPos, yPos, cellSize, cellSize);
  }

  function addControls() {
    // For touch users
    document.body.addEventListener("touchstart", (e) => {
      let touchStartX = e.changedTouches[0].clientX;
      let touchStartY = e.changedTouches[0].clientY;

      document.body.addEventListener(
        "touchend",
        (e) => {
          let touchEndX = e.changedTouches[0].clientX;
          let touchEndY = e.changedTouches[0].clientY;

          // Calculate swipe direction and distance
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

    // For keyboard users
    document.body.addEventListener("keydown", (event) => {
      let direction;
      switch (event.code) {
        case "ArrowUp":
        case "KeyW":
          direction = "top";
          break;
        case "ArrowRight":
        case "KeyD":
          direction = "right";
          break;
        case "ArrowDown":
        case "KeyS":
          direction = "bottom";
          break;
        case "ArrowLeft":
        case "KeyA":
          direction = "left";
          break;
        default:
          return;
      }
      moveTo(direction);
    });
  }

  function moveTo(playerDirec) {
    if (gameOver) return;
    let possiblePath = getPossiblePath(playerCell);
    let cellToMoveTo = possiblePath.find(
      ([possibleDirec]) => possibleDirec === `${playerDirec}Cell`
    );
    if (cellToMoveTo) {
      let [cellDirec, cell] = cellToMoveTo;
      playerCell = cell;
      reDraw();
      highlight(playerCell, "orange")
      highlight(destinationCell, "red")
      //addIcons(playerCell, 0);
      //addIcons(destinationCell, 1);
    }

    if (
      playerCell.x === destinationCell.x &&
      playerCell.y === destinationCell.y
    ) {
      gameOver = true;
      alert("You Escaped!!");
    }
  }

  function nextLevel() {}
});
