// Constants
const COLS = 10;
const ROWS = 20;
const MID = Math.floor((COLS - 1) / 2);
const STARTING_BLOCKS = { // How much generalization is too much?
	"I": [MID - 1, MID, MID + 1, MID + 2],
	"O": [MID, MID + 1, COLS + MID, COLS + MID + 1],
	"T": [MID, COLS + MID - 1, COLS + MID, COLS + MID + 1],
	"S": [MID, MID + 1, COLS + MID - 1, COLS + MID],
	"Z": [MID - 1, MID, COLS + MID, COLS + MID + 1],
	"J": [MID - 1, COLS + MID - 1, COLS + MID, COLS + MID + 1],
	"L": [MID + 1, COLS + MID - 1, COLS + MID, COLS + MID + 1]
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
let queue = Array(7);
let current = { // Will be filled in by newTetronimo()
	type: "",
	blocks: []
};
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
	const newCurrent = {type, blocks: STARTING_BLOCKS[type]};
	for (const block of newCurrent.blocks) {
		cells[block] = newCurrent.type;
	}
	return newCurrent;
}
export function newGame() {
	cells = Array(CELL_AMOUNT).fill(" ");
	subFrame = 1;
	queue = newBag();
	current = newTetronimo(queue.shift());
}
// Helper functions
function collisionCheck(cell) {
	return cells[cell] !== " " && !current.blocks.includes(cell);
}
function updateTetronimo(newPosition) {
	// Operations separated so upper blocks don't affect lower blocks
	for (const block of current.blocks) {
		cells[block] = " ";
	}
	current.blocks = newPosition;
	for (const block of current.blocks) {
		cells[block] = current.type;
	}
}
function gravity() {
	const canFall = !current.blocks.some(block => block + COLS > (CELL_AMOUNT - 1) || collisionCheck(block + COLS));
	if (canFall) {
		updateTetronimo(current.blocks.map(block => block + COLS));
	}
	return canFall;
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
		} else if (key === "ArrowDown") {
			gravity();
		} else {
			changed = false;
		}
		// TODO: Rotation
	}
}
export function update() {
	if (subFrame === 0) {
		if (!gravity() && lock()) {
			// If the tetronimo can't fall and can't lock, game over
			return [true, true];
		}
		changed = true;
	}
	subFrame++;
	subFrame %= SPEED;
	return [false, changed];
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
		for (const block of STARTING_BLOCKS[tetromino]) {
			context.fillRect(QUEUE_START_X + (block % COLS - (MID - 1)) * CELL_SIZE, QUEUE_START_Y + QUEUE_GAP * position + Math.floor(block / COLS) * CELL_SIZE, CELL_SIZE, CELL_SIZE);
		}
	}
}