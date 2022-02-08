// Constants
const COLS = 10;
const ROWS = 20;
const MID = Math.floor((COLS - 1) / 2);
const BLOCKS = {
	"I": [-1, 0, 1, 2],
	"O": [0, 1, COLS, COLS + 1],
	"T": [0, COLS - 1, COLS, COLS + 1],
	"S": [0, 1, COLS - 1, COLS],
	"Z": [-1, 0, COLS, COLS + 1],
	"J": [-1, COLS - 1, COLS, COLS + 1],
	"L": [1, COLS - 1, COLS, COLS + 1]
};
const COLORS = {
	"Z": "hsl(0, 70%, 50%)",
	"L": "hsl(30, 90%, 50%)",
	"O": "hsl(50, 90%, 50%)",
	"S": "hsl(120, 70%, 50%)",
	"I": "hsl(190, 90%, 50%)",
	"J": "hsl(230, 70%, 50%)",
	"T": "hsl(300, 90%, 50%)"
};
const SPEED = 60; // Animation frames per Tetris frame
const LOCK_SPEED = 60;
// Position constants
const CELL_SIZE = 60;
const CELL_AMOUNT = COLS * (ROWS + 2);
const START_X = (1920 - COLS * CELL_SIZE) / 2;
const START_Y = (1280 - ROWS * CELL_SIZE) / 2;
const NEXT_AMOUNT = 6;
const QUEUE_GAP = 200;
const QUEUE_START_X = START_X + COLS * CELL_SIZE + 150;
const QUEUE_START_Y = (1280 - (NEXT_AMOUNT - 1) * QUEUE_GAP - 2 * CELL_SIZE) / 2;
// State variables
let cells = Array(CELL_AMOUNT).fill(" ");
let subFrame = 1; // Starts at 1 so the tetronimo doesn't immediately fall
let lockTimer = 0;
let queue = Array(7);
let current = { // Will be filled in by newTetronimo()
	type: "",
	blocks: []
};
let gameOver = false;
let changed = false;
// New game
function newBag() {
	const bag = ["I", "O", "T", "S", "Z", "J", "L"];
	for (let i = 0; i < 7; i++) {
		const j = Math.floor(Math.random() * 7);
		[bag[i], bag[j]] = [bag[j], bag[i]];
	}
	return bag;
}
function newTetronimo(type) {
	const newCurrent = {type, blocks: newPosition(type, MID)};
	for (const block of newCurrent.blocks) {
		cells[block] = newCurrent.type;
	}
	return newCurrent;
}
export function newGame() {
	cells = Array(CELL_AMOUNT).fill(" ");
	subFrame = 1;
	lockTimer = 0;
	queue = newBag();
	current = newTetronimo(queue.shift());
	gameOver = false;
}
// Helper functions
function newPosition(type, position) {
	return BLOCKS[type].map(offset => position + offset);
}
function collisionCheck(cell) {
	return cells[cell] !== " " && !current.blocks.includes(cell);
}
function updateTetronimo(position) {
	// Operations separated so upper blocks don't affect lower blocks
	for (const block of current.blocks) {
		cells[block] = " ";
	}
	current.blocks = position;
	for (const block of current.blocks) {
		cells[block] = current.type;
	}
}
function lock() { // Returns whether the game is over
	const rows = new Set(current.blocks.map(block => Math.floor(block / COLS)));
	if (rows.has(1)) {
		return true;
	}
	for (const row of rows) {
		if (cells.slice(row * COLS, (row + 1) * COLS).every(cell => cell !== " ")) {
			cells.splice(row * COLS, COLS);
			cells.unshift(...Array(COLS).fill(" "));
		}
	}
	current = newTetronimo(queue.shift());
	if (queue.length < NEXT_AMOUNT) {
		queue.push(...newBag());
	}
	subFrame = 1;
	lockTimer = 0;
	return false;
}
// Game loop
export function handle(keys) {
	changed = true; // Set to false later if applicable
	for (const key of keys) {
		if (key === "r" || key === "R") {
			newGame();
			return;
		} else if (key === "ArrowLeft" && !current.blocks.some(block => (block - 1) % COLS === COLS - 1 || collisionCheck(block - 1))) {
			updateTetronimo(current.blocks.map(block => block - 1));
		} else if (key === "ArrowRight" && !current.blocks.some(block => (block + 1) % COLS === 0 || collisionCheck(block + 1))) {
			updateTetronimo(current.blocks.map(block => block + 1));
		} else if (key === "ArrowDown" && !current.blocks.some(block => block + COLS > (CELL_AMOUNT - 1) || collisionCheck(block + COLS))) {
			updateTetronimo(current.blocks.map(block => block + COLS));
		} else {
			changed = false;
		}
		// TODO: Rotation
	}
}
export function update() {
	const canFall = !current.blocks.some(block => block + COLS > (CELL_AMOUNT - 1) || collisionCheck(block + COLS));
	if (subFrame === 0) {
		changed = true;
		if (canFall) {
			updateTetronimo(current.blocks.map(block => block + COLS));
		}
	}
	if (!canFall) {
		lockTimer++;
	} else {
		lockTimer = 0;
	}
	if (lockTimer >= LOCK_SPEED) {
		changed = true;
		gameOver = lock();
	}
	subFrame++;
	subFrame %= SPEED;
	return [gameOver, changed];
}
export function render(context) {
	context.fillStyle = "hsl(30, 5%, 20%)";
	context.fillRect(START_X, START_Y, COLS * CELL_SIZE, ROWS * CELL_SIZE);
	for (const [position, cell] of cells.entries()) {
		if (cell !== " ") {
			context.fillStyle = COLORS[cell];
			context.fillRect(START_X + (position % COLS) * CELL_SIZE, START_Y + Math.floor(position / COLS - 2) * CELL_SIZE, CELL_SIZE, CELL_SIZE);
		}
	}
	for (const [position, tetromino] of queue.entries()) {
		context.fillStyle = COLORS[tetromino];
		for (const block of BLOCKS[tetromino]) {
			context.fillRect(QUEUE_START_X + ((block + 1) % COLS) * CELL_SIZE, QUEUE_START_Y + QUEUE_GAP * position + Math.floor((block + 1) / COLS) * CELL_SIZE, CELL_SIZE, CELL_SIZE);
		}
	}
}