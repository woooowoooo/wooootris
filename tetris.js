// Constants
const colors = {
	"Z": "hsl(0, 70%, 50%)",
	"L": "hsl(30, 90%, 50%)",
	"O": "hsl(50, 90%, 50%)",
	"S": "hsl(120, 70%, 50%)",
	"I": "hsl(190, 90%, 50%)",
	"J": "hsl(230, 70%, 50%)",
	"T": "hsl(300, 90%, 50%)"
};
const startingBlocks = {
	"I": [3, 4, 5, 6],
	"O": [4, 5, 14, 15],
	"T": [4, 13, 14, 15],
	"S": [4, 5, 13, 14],
	"Z": [3, 4, 14, 15],
	"J": [3, 13, 14, 15],
	"L": [5, 13, 14, 15]
};
const CELL_SIZE = 60;
const CELL_AMOUNT = 220;
const START_X = 960 - 5 * CELL_SIZE;
const START_Y = 640 - 10 * CELL_SIZE;
const SPEED = 60; // Animation frames per Tetris frame
// State variables
let cells = Array(CELL_AMOUNT).fill(" ");
let subFrame = 1; // Starts at 1 so the tetronimo doesn't immediately fall
let queue = Array(7);
let current = { // Will be filled in by newTetronimo()
	type: "",
	blocks: []
};
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
	const newCurrent = {type, blocks: startingBlocks[type]};
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
// Game
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
	if (!current.blocks.some(block => block + 10 > (CELL_AMOUNT - 1) || collisionCheck(block + 10))) {
		updateTetronimo(current.blocks.map(block => block + 10));
	}
}
export function update(context) {
	context.fillStyle = "hsl(30, 5%, 20%)";
	context.fillRect(START_X, START_Y, 10 * CELL_SIZE, 20 * CELL_SIZE);
	// Update
	if (subFrame === 0) {
		gravity();
	}
	// Render
	for (const [position, cell] of cells.entries()) {
		if (cell !== " ") {
			context.fillStyle = colors[cell];
			context.fillRect(START_X + (position % 10) * CELL_SIZE, START_Y + Math.floor(position / 10 - 2) * CELL_SIZE, CELL_SIZE, CELL_SIZE);
		}
	}
	subFrame++;
	subFrame %= SPEED;
}
export function handle(keys) {
	for (const key of keys) {
		if (key === "r" || key === "R") {
			newGame();
			return;
		} else if (key === "ArrowLeft" && !current.blocks.some(block => (block - 1) % 10 === 9 || collisionCheck(block - 1))) {
			updateTetronimo(current.blocks.map(block => block - 1));
		} else if (key === "ArrowRight" && !current.blocks.some(block => (block + 1) % 10 === 0 || collisionCheck(block + 1))) {
			updateTetronimo(current.blocks.map(block => block + 1));
		} else if (key === "ArrowDown") {
			gravity();
		}
		// TODO: Rotation
	}
}