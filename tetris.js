// Constants
const ROWS = 20;
const TCOLS = 10;
const COLS = TCOLS + 1;
const MID = Math.floor(COLS / 2);
const BLOCKS = {
	"I": [
		[-1, 0, 1, 2],
		[-COLS, 0, COLS, 2 * COLS],
		[-2, -1, 0, 1],
		[-2 * COLS, -COLS, 0, COLS]
	],
	"O": [[-COLS, -COLS + 1, 0, 1]], // "O" blocks don't rotate
	"T": [
		[-COLS, -1, 0, 1],
		[-COLS, 0, 1, COLS],
		[-1, 0, 1, COLS],
		[-COLS, -1, 0, COLS]
	],
	"S": [
		[-COLS, -COLS + 1, -1, 0],
		[-COLS, 0, 1, COLS + 1],
		[0, 1, COLS - 1, COLS],
		[-COLS - 1, -1, 0, COLS]
	],
	"Z": [
		[-COLS - 1, -COLS, 0, 1],
		[-COLS + 1, 0, 1, COLS],
		[-1, 0, COLS, COLS + 1],
		[-COLS, -1, 0, COLS - 1]
	],
	"J": [
		[-COLS - 1, -1, 0, 1],
		[-COLS, -COLS + 1, 0, COLS],
		[-1, 0, 1, COLS + 1],
		[-COLS, 0, COLS - 1, COLS]
	],
	"L": [
		[-COLS + 1, -1, 0, 1],
		[-COLS, 0, COLS, COLS + 1],
		[-1, 0, 1, COLS - 1],
		[-COLS - 1, -COLS, 0, COLS]
	]
};
const OFFSETS = [
	[0, 0, 0, 0, 0],
	[0, 1, COLS + 1, -2 * COLS, -2 * COLS + 1],
	[0, 0, 0, 0, 0],
	[0, -1, COLS - 1, -2 * COLS, -2 * COLS - 1]
];
const I_OFFSETS = [
	[0, -1, 2, -1, 2],
	[-1, 0, 0, -COLS, 2 * COLS],
	[-COLS - 1, -COLS + 1, -COLS - 2, 1, -2],
	[-COLS, -COLS, -COLS, COLS, -2 * COLS]
];
const COLORS = {
	"_": "hsla(0, 0%, 100%, 50%)",
	"Z": "hsl(0, 70%, 50%)",
	"L": "hsl(30, 90%, 50%)",
	"O": "hsl(50, 90%, 50%)",
	"S": "hsl(120, 70%, 50%)",
	"I": "hsl(190, 90%, 50%)",
	"J": "hsl(230, 70%, 50%)",
	"T": "hsl(300, 90%, 50%)"
};
// Timers limits (in frames)
const GRAVITY_SPEED = 60;
const LOCK_SPEED = 60;
const AUTOREPEAT_SPEED = 8; // Speed to start autorepeat, not speed of autorepeat
// Position constants
const CELL_SIZE = 60;
const CELL_AMOUNT = COLS * (ROWS + 2);
const START_X = (1920 - TCOLS * CELL_SIZE) / 2;
const START_Y = (1280 - ROWS * CELL_SIZE) / 2;
const NEXT_AMOUNT = 6;
const QUEUE_GAP = 180;
const QUEUE_START_X = START_X + TCOLS * CELL_SIZE + 150;
const QUEUE_START_Y = (1280 - (NEXT_AMOUNT - 1) * QUEUE_GAP - 2 * CELL_SIZE) / 2;
const HELD_START_X = START_X - 4 * CELL_SIZE - 150;
const SCORE_START_Y = QUEUE_START_Y + 2 * CELL_SIZE + QUEUE_GAP;
// State variables
const heldKeys = new Set();
let cells = Array(CELL_AMOUNT).fill(" ");
let queue = Array(7);
let held = null;
let current = { // Will be filled in by newTetronimo()
	type: null,
	center: MID,
	rotation: 0,
	ghostCenter: CELL_AMOUNT - COLS + MID,
	blocks: []
};
let score = 0;
let gameOver = false;
let changed = true;
let hasHeld = false;
let gravityTimer = 0;
let lockTimer = 0;
let autorepeatTimer = 0;
// New game
function newBag() {
	const bag = ["I", "O", "T", "S", "Z", "J", "L"];
	for (let i = 0; i < 7; i++) {
		const j = Math.floor(Math.random() * 7);
		[bag[i], bag[j]] = [bag[j], bag[i]];
	}
	return bag;
}
function newPosition(type, center, rotation = 0) {
	return BLOCKS[type][type !== "O" ? rotation : 0].map(offset => center + offset);
}
function newTetronimo(type) {
	changed = true;
	current = {
		type,
		center: MID,
		rotation: 0,
		blocks: newPosition(type, MID + COLS)
	};
	for (const block of current.blocks) {
		cells[block] = current.type;
	}
	current.ghostCenter = findGhostCenter();
	for (const block of newPosition(current.type, current.ghostCenter, current.rotation)) {
		cells[block] = "_";
	}
}
export function newGame() {
	cells = Array(CELL_AMOUNT).fill(" ");
	queue = newBag();
	held = null;
	newTetronimo(queue.shift());
	score = 0;
	gameOver = false;
	changed = true;
	hasHeld = false;
	gravityTimer = 0;
	lockTimer = 0;
	autorepeatTimer = 0;
}
// Helper functions
function posMod(x, y) {
	return (x + y) % y;
}
function collisionCheck(cell) {
	return cells[cell] !== " " && cells[cell] !== "_" && !current.blocks.includes(cell) && cell >= 0;
}
function findGhostCenter() {
	let center = current.center;
	while (center < CELL_AMOUNT) {
		center += COLS;
		const position = newPosition(current.type, center, current.rotation);
		if (position.some(cell => cell > CELL_AMOUNT - 1 || collisionCheck(cell))) {
			return center - COLS;
		}
	}
	return center;
}
function updateTetronimo(offset, rOffset = 0) {
	const position = newPosition(current.type, current.center + offset, posMod(current.rotation + rOffset, 4));
	if (position.some(cell => cell % COLS === 0 || cell > CELL_AMOUNT - 1 || collisionCheck(cell))) {
		return false;
	}
	// Operations separated so upper blocks don't affect lower blocks
	// Remove old piece
	changed = true;
	for (const block of current.blocks) {
		cells[block] = " ";
	}
	if (offset % COLS !== 0 || rOffset !== 0) {
		for (const block of newPosition(current.type, current.ghostCenter, current.rotation)) {
			cells[block] = " ";
		}
	}
	// Change state
	current.blocks = position;
	current.center += offset;
	current.rotation += rOffset;
	current.rotation = posMod(current.rotation, 4);
	// Add new piece
	for (const block of current.blocks) {
		cells[block] = current.type;
	}
	if (offset % COLS !== 0 || rOffset !== 0) {
		current.ghostCenter = findGhostCenter();
		for (const block of newPosition(current.type, current.ghostCenter, current.rotation)) {
			if (cells[block] === " ") {
				cells[block] = "_";
			}
		}
	}
	return true;
}
function lock() { // Returns whether the game is over
	const rows = new Set(current.blocks.map(block => Math.floor(block / COLS)));
	if (rows.has(1)) {
		return true;
	}
	for (const row of rows) {
		if (cells.slice(row * COLS + 1, (row + 1) * COLS).every(cell => cell !== " ")) {
			score += 1;
			cells.splice(row * COLS, COLS);
			cells.unshift(...Array(COLS).fill(" "));
		}
	}
	newTetronimo(queue.shift());
	if (queue.length < NEXT_AMOUNT) {
		queue.push(...newBag());
	}
	gravityTimer = 0;
	lockTimer = 0;
	hasHeld = false;
	return false;
}
function rotate(counterclockwise) {
	if (current.type === "O") {
		return;
	}
	const dr = counterclockwise ? -1 : 1;
	const table = current.type === "I" ? I_OFFSETS : OFFSETS;
	[0, 1, 2, 3, 4].some(i => {
		const curOffset = table[current.rotation][i];
		const newOffset = table[posMod(current.rotation + dr, 4)][i];
		return updateTetronimo(curOffset - newOffset, dr);
	});
}
// Game loop
export function onKeyDown(e) {
	if (!heldKeys.has(e.key)) { // Prevent held key spam
		heldKeys.add(e.key);
		handle(e.key);
	}
}
export function onKeyUp(e) {
	heldKeys.delete(e.key);
}
export function handle(key) {
	changed = false;
	if (key === "Escape") {
		gameOver = true;
		heldKeys.clear();
	} else if (key === "r" || key === "R") {
		newGame();
	} else if (key === " ") {
		updateTetronimo(current.ghostCenter - current.center);
		lock();
	} else if (key === "X" || key === "x" || key === "ArrowUp") {
		rotate(false);
	} else if (key === "Z" || key === "z") {
		rotate(true);
	} else if (key === "C" || key === "c") {
		if (hasHeld) {
			return;
		}
		hasHeld = true;
		for (const block of current.blocks) {
			cells[block] = " ";
		}
		for (const block of newPosition(current.type, current.ghostCenter, current.rotation)) {
			cells[block] = " ";
		}
		const oldHeld = held;
		held = current.type;
		newTetronimo(oldHeld ?? queue.shift());
	}
}
export function update() {
	// Handle held keys
	if (heldKeys.has("ArrowLeft") !== heldKeys.has("ArrowRight")) {
		if (autorepeatTimer === 0) { // Move once before autorepeat
			updateTetronimo(heldKeys.has("ArrowLeft") ? -1 : 1);
		}
		autorepeatTimer += 1;
	} else {
		autorepeatTimer = 0;
	}
	if (autorepeatTimer >= AUTOREPEAT_SPEED) {
		updateTetronimo(heldKeys.has("ArrowLeft") ? -1 : 1);
	}
	if (heldKeys.has("ArrowDown")) {
		updateTetronimo(COLS);
	}
	// Update board
	if (current.blocks.some(block => block + COLS > (CELL_AMOUNT - 1) || collisionCheck(block + COLS))) {
		gravityTimer = 0;
		lockTimer++;
	} else {
		gravityTimer++;
		lockTimer = 0;
	}
	if (gravityTimer >= GRAVITY_SPEED) {
		gravityTimer = 0;
		updateTetronimo(COLS);
	}
	if (lockTimer >= LOCK_SPEED) {
		gameOver ||= lock();
	}
	return [gameOver, changed];
}
export function render(context) {
	context.fillStyle = "hsl(30, 5%, 20%)";
	context.fillRect(START_X, START_Y, TCOLS * CELL_SIZE, ROWS * CELL_SIZE);
	for (const [position, cell] of cells.entries()) {
		if (cell !== " ") {
			context.fillStyle = COLORS[cell];
			context.fillRect(START_X + (position % COLS - 1) * CELL_SIZE, START_Y + Math.floor(position / COLS - 2) * CELL_SIZE, CELL_SIZE, CELL_SIZE);
		}
	}
	context.fillStyle = "hsl(30, 5%, 80%)";
	context.fillRect(QUEUE_START_X - CELL_SIZE, QUEUE_START_Y - CELL_SIZE, 6 * CELL_SIZE, NEXT_AMOUNT * QUEUE_GAP + CELL_SIZE);
	for (const [position, tetromino] of Array.from(queue.entries()).slice(0, NEXT_AMOUNT)) {
		context.fillStyle = COLORS[tetromino];
		for (const block of BLOCKS[tetromino][0]) {
			context.fillRect(QUEUE_START_X + posMod(block + 1, COLS) * CELL_SIZE, QUEUE_START_Y + QUEUE_GAP * position + Math.floor((block + 1) / COLS + 1) * CELL_SIZE, CELL_SIZE, CELL_SIZE);
		}
	}
	context.fillStyle = "hsl(30, 5%, 80%)";
	context.fillRect(HELD_START_X - CELL_SIZE, QUEUE_START_Y - CELL_SIZE, 6 * CELL_SIZE, 4 * CELL_SIZE);
	if (held != null) {
		context.fillStyle = COLORS[held];
		for (const block of BLOCKS[held][0]) {
			context.fillRect(HELD_START_X + posMod(block + 1, COLS) * CELL_SIZE, QUEUE_START_Y + Math.floor((block + 1) / COLS + 1) * CELL_SIZE, CELL_SIZE, CELL_SIZE);
		}
	}
	context.fontSize = 6;
	context.textAlign = "right";
	context.fillStyle = "black";
	context.fillText("Score " + score.toString().padStart(4, "0"), HELD_START_X + 5 * CELL_SIZE, SCORE_START_Y);
}