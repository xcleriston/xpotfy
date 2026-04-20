const gameContainer = document.querySelector('.game-container');
const scoreContainer = document.querySelector('.score-container');
const bestContainer = document.querySelector('.best-container');
const gameMessage = document.querySelector('.game-message');
const retryButton = document.querySelector('.retry-button');

let grid = [];
let score = 0;
let bestScore = localStorage.getItem('2048_best_score') || 0;

function initGame() {
    grid = Array(4).fill().map(() => Array(4).fill(0));
    score = 0;
    scoreContainer.textContent = score;
    bestContainer.textContent = bestScore;
    setupGrid();
    addRandomTile();
    addRandomTile();
    updateGrid();
}

function setupGrid() {
    const gridContainer = document.querySelector('.grid-container');
    gridContainer.innerHTML = '';
    for (let i = 0; i < 4; i++) {
        const row = document.createElement('div');
        row.className = 'grid-row';
        for (let j = 0; j < 4; j++) {
            const cell = document.createElement('div');
            cell.className = 'grid-cell';
            row.appendChild(cell);
        }
        gridContainer.appendChild(row);
    }
}

function addRandomTile() {
    const emptyCells = [];
    for (let i = 0; i < 4; i++) {
        for (let j = 0; j < 4; j++) {
            if (grid[i][j] === 0) {
                emptyCells.push({ row: i, col: j });
            }
        }
    }

    if (emptyCells.length === 0) return;

    const randomCell = emptyCells[Math.floor(Math.random() * emptyCells.length)];
    const value = Math.random() < 0.9 ? 2 : 4;
    grid[randomCell.row][randomCell.col] = value;
}

function updateGrid() {
    const gridContainer = document.querySelector('.grid-container');
    gridContainer.innerHTML = '';
    
    for (let i = 0; i < 4; i++) {
        const row = document.createElement('div');
        row.className = 'grid-row';
        for (let j = 0; j < 4; j++) {
            const cell = document.createElement('div');
            cell.className = 'grid-cell';
            if (grid[i][j] !== 0) {
                const tile = document.createElement('div');
                tile.className = `tile tile-${grid[i][j]}`;
                tile.style.left = j * 125 + 'px';
                tile.style.top = i * 125 + 'px';
                tile.innerHTML = `<div class="tile-inner">${grid[i][j]}</div>`;
                cell.appendChild(tile);
            }
            row.appendChild(cell);
        }
        gridContainer.appendChild(row);
    }
}

function moveTiles(direction) {
    let moved = false;
    let merged = Array(4).fill().map(() => Array(4).fill(false));

    for (let i = 0; i < 4; i++) {
        let row = [];
        let col = [];

        for (let j = 0; j < 4; j++) {
            if (direction === 'left') row.push(grid[i][j]);
            if (direction === 'right') row.unshift(grid[i][j]);
            if (direction === 'up') col.push(grid[j][i]);
            if (direction === 'down') col.unshift(grid[j][i]);
        }

        const processed = processRow(row);
        moved = moved || processed.moved;

        for (let j = 0; j < 4; j++) {
            if (direction === 'left') grid[i][j] = processed.row[j];
            if (direction === 'right') grid[i][3-j] = processed.row[j];
            if (direction === 'up') grid[j][i] = processed.row[j];
            if (direction === 'down') grid[3-j][i] = processed.row[j];
        }
    }

    if (moved) {
        addRandomTile();
        updateGrid();
        checkGameOver();
    }
}

function processRow(row) {
    let moved = false;
    let merged = Array(4).fill(false);
    let newRow = [];

    // Move non-zero tiles to the front
    for (let i = 0; i < 4; i++) {
        if (row[i] !== 0) newRow.push(row[i]);
    }

    // Merge adjacent tiles
    for (let i = 0; i < newRow.length - 1; i++) {
        if (newRow[i] === newRow[i + 1] && !merged[i]) {
            newRow[i] *= 2;
            score += newRow[i];
            newRow.splice(i + 1, 1);
            merged[i] = true;
            moved = true;
        }
    }

    // Fill remaining spaces with zeros
    while (newRow.length < 4) newRow.push(0);

    if (score > bestScore) {
        bestScore = score;
        bestContainer.textContent = score;
        localStorage.setItem('2048_best_score', score);
    }

    return { row: newRow, moved: moved };
}

function checkGameOver() {
    for (let i = 0; i < 4; i++) {
        for (let j = 0; j < 4; j++) {
            if (grid[i][j] === 0) return;
            if (i < 3 && grid[i][j] === grid[i + 1][j]) return;
            if (j < 3 && grid[i][j] === grid[i][j + 1]) return;
        }
    }
    gameMessage.style.display = 'block';
    gameMessage.querySelector('p').textContent = 'Game Over!';
}

function handleKeyPress(event) {
    switch (event.key) {
        case 'ArrowUp':
            moveTiles('up');
            break;
        case 'ArrowDown':
            moveTiles('down');
            break;
        case 'ArrowLeft':
            moveTiles('left');
            break;
        case 'ArrowRight':
            moveTiles('right');
            break;
    }
}

retryButton.addEventListener('click', () => {
    gameMessage.style.display = 'none';
    initGame();
});

document.addEventListener('keydown', handleKeyPress);

initGame();
