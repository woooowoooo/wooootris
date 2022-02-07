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
const CELL_SIZE = 60;
const CELL_AMOUNT = 220;
const START_X = 960 - 5 * CELL_SIZE;
const START_Y = 640 - 10 * CELL_SIZE;
const SPEED = 60; // Animation frames per Tetris frame
// State variables
let cells = Array(200).fill(" ");
cells[4] = "O";
cells[5] = "O";
cells[14] = "O";
cells[15] = "O";
let tick = 0;
let current = {
	type: "O",
	blocks: [4, 5, 14, 15]
};
// Functions
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
export function newGame() {
	cells = Array(200).fill(" ");
	cells[4] = "O";
	cells[5] = "O";
	cells[14] = "O";
	cells[15] = "O";
	tick = 0;
	current = {
		type: "O",
		blocks: [4, 5, 14, 15]
	};
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