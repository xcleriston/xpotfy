class Game2048 {
    constructor() {
        this.grid = document.querySelector('.grid-container');
        this.scoreContainer = document.querySelector('.score-container');
        this.gameMessage = document.querySelector('.game-message');
        this.retryButton = document.querySelector('.retry-button');
        this.score = 0;
        this.tiles = [];
        this.gameOver = false;
        this.initializeGame();
    }

    initializeGame() {
        this.grid.innerHTML = '';
        this.score = 0;
        this.scoreContainer.textContent = '0';
        this.gameOver = false;
        this.addNewTile();
        this.addNewTile();
        this.setupEventListeners();
    }

    setupEventListeners() {
        document.addEventListener('keydown', (e) => this.handleKeyPress(e));
        this.retryButton.addEventListener('click', () => this.initializeGame());
    }

    handleKeyPress(e) {
        if (this.gameOver) return;
        
        const moves = {
            ArrowUp: () => this.moveUp(),
            ArrowDown: () => this.moveDown(),
            ArrowLeft: () => this.moveLeft(),
            ArrowRight: () => this.moveRight()
        };

        if (moves[e.key]) {
            moves[e.key]();
            if (this.canAddTile()) {
                this.addNewTile();
            }
            this.updateScore();
            this.checkGameOver();
        }
    }

    addNewTile() {
        const emptyCells = this.getEmptyCells();
        if (emptyCells.length === 0) return;

        const randomCell = emptyCells[Math.floor(Math.random() * emptyCells.length)];
        const value = Math.random() < 0.9 ? 2 : 4;
        
        const tile = document.createElement('div');
        tile.className = `tile tile-${value}`;
        tile.textContent = value;
        tile.style.left = `${randomCell.x * 116}px`;
        tile.style.top = `${randomCell.y * 116}px`;
        this.grid.appendChild(tile);
        this.tiles.push({ element: tile, value: value, x: randomCell.x, y: randomCell.y });
    }

    getEmptyCells() {
        const cells = [];
        for (let x = 0; x < 4; x++) {
            for (let y = 0; y < 4; y++) {
                if (!this.tiles.some(tile => tile.x === x && tile.y === y)) {
                    cells.push({ x, y });
                }
            }
        }
        return cells;
    }

    canAddTile() {
        return this.getEmptyCells().length > 0;
    }

    moveUp() {
        this.move('y', -1);
    }

    moveDown() {
        this.move('y', 1);
    }

    moveLeft() {
        this.move('x', -1);
    }

    moveRight() {
        this.move('x', 1);
    }

    move(axis, direction) {
        const sortedTiles = [...this.tiles].sort((a, b) => {
            return direction * (a[axis] - b[axis]);
        });

        // Create a map of target positions
        const targets = new Map();
        
        for (let i = 0; i < sortedTiles.length; i++) {
            const tile = sortedTiles[i];
            let targetX = tile.x;
            let targetY = tile.y;
            
            // Find target position
            while (this.canMove(tile, axis, direction)) {
                targetX += axis === 'x' ? direction : 0;
                targetY += axis === 'y' ? direction : 0;
            }
            
            const targetKey = `${targetX},${targetY}`;
            
            if (targets.has(targetKey)) {
                const targetTile = targets.get(targetKey);
                if (targetTile.value === tile.value && !targetTile.merged) {
                    // Merge tiles
                    targetTile.value *= 2;
                    targetTile.element.textContent = targetTile.value;
                    targetTile.element.className = `tile tile-${targetTile.value}`;
                    targetTile.merged = true;
                    this.score += targetTile.value;
                    tile.element.remove();
                    this.tiles = this.tiles.filter(t => t !== tile);
                }
            } else {
                targets.set(targetKey, tile);
                
                // Create animation
                const targetPos = {
                    x: targetX * 116,
                    y: targetY * 116
                };
                
                // Add scale animation
                tile.element.style.transform = 'scale(1.2)';
                setTimeout(() => {
                    tile.element.style.transform = 'scale(1)';
                }, 100);
                
                // Smooth movement
                tile.element.style.transition = 'all 0.3s cubic-bezier(0.4, 0.0, 0.2, 1)';
                tile.element.style.left = `${targetPos.x}px`;
                tile.element.style.top = `${targetPos.y}px`;
                
                // Update tile position
                tile.x = targetX;
                tile.y = targetY;
            }
        }

        // Reset merged flags
        this.tiles.forEach(tile => tile.merged = false);

        // Wait for animations to complete before adding new tile
        setTimeout(() => {
            if (this.canAddTile()) {
                this.addNewTile();
            }
        }, 300);
    }

    canMove(tile, axis, direction) {
        const nextPos = tile[axis] + direction;
        if (nextPos < 0 || nextPos > 3) return false;
        
        const existingTile = this.tiles.find(t => 
            t[axis] === nextPos && t[direction === 1 ? 'y' : 'x'] === tile[direction === 1 ? 'y' : 'x']
        );
        
        return !existingTile || (existingTile.value === tile.value && !existingTile.merged);
    }

    updateScore() {
        this.scoreContainer.textContent = this.score;
    }

    checkGameOver() {
        if (!this.canAddTile()) {
            for (let x = 0; x < 4; x++) {
                for (let y = 0; y < 4; y++) {
                    if (this.canMoveTile(x, y)) return;
                }
            }
            this.gameOver = true;
            this.gameMessage.querySelector('p').textContent = 'Game Over!';
            this.gameMessage.classList.add('visible');
        }
    }

    canMoveTile(x, y) {
        const directions = [{x: 0, y: -1}, {x: 0, y: 1}, {x: -1, y: 0}, {x: 1, y: 0}];
        for (const dir of directions) {
            const newX = x + dir.x;
            const newY = y + dir.y;
            if (newX >= 0 && newX < 4 && newY >= 0 && newY < 4) {
                const tile = this.tiles.find(t => t.x === x && t.y === y);
                const targetTile = this.tiles.find(t => t.x === newX && t.y === newY);
                if (!targetTile || (targetTile.value === tile.value && !targetTile.merged)) {
                    return true;
                }
            }
        }
        return false;
    }
}

// Initialize the game
const game = new Game2048();
