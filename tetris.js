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
// Scores
const LINE_SCORES = [0, 100, 300, 500, 800];
const PERFECT_CLEAR_SCORE = 3500;
const COMBO_SCORE = 50;
// Limits (speeds are in frames)
const GRAVITY_SPEED = 60;
const LOCK_MOVE_LIMIT = 10;
const LOCK_SPEED = 40;
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
let current = null;
let ghost = null;
let score = 0;
let combo = 0;
let gameOver = false;
let changed = true;
let hasHeld = false;
let gravityTimer = 0;
let lockMoves = 0;
let lockTimer = 0;
let autorepeatTimer = 0;
// Piece class
class Piece {
	constructor (type, center, rotation, isGhost = false) {
		changed = true;
		this.type = type;
		this.ghost = isGhost;
		this.center = center ?? MID;
		this.rotation = rotation ?? 0;
		this.blocks = newPosition(type, center ?? MID + COLS, rotation ?? 0);
		this.fill();
		if (!isGhost) {
			updateGhost(this);
			ghost.fill();
		}
	}
	clear() {
		this.fill(" ");
	}
	fill(color = (this.ghost ? "_" : this.type)) {
		for (const block of this.blocks) {
			cells[block] = color;
		}
	}
	update(offset, rOffset = 0) {
		const position = newPosition(this.type, this.center + offset, (this.rotation + rOffset) % 4);
		if (position.some(cell => cell % COLS === 0 || cell > CELL_AMOUNT - 1 || collisionCheck(this, cell))) {
			return false;
		}
		// Operations separated so upper blocks don't affect lower blocks
		// Remove old piece
		changed = true;
		this.clear();
		if (offset % COLS !== 0 || rOffset !== 0) {
			ghost.clear();
			if (lockTimer !== 0 && lockMoves < LOCK_MOVE_LIMIT) {
				lockMoves++;
				lockTimer = 0;
			}
		}
		// Change state
		this.blocks = position;
		this.center += offset;
		this.rotation += rOffset;
		this.rotation %= 4;
		// Add new piece
		if (offset % COLS !== 0 || rOffset !== 0) {
			updateGhost();
			ghost.fill();
		}
		this.fill();
		return true;
	}
	rotate(dr) {
		if (this.type === "O") {
			return;
		}
		const table = this.type === "I" ? I_OFFSETS : OFFSETS;
		[0, 1, 2, 3, 4].some(i => {
			const curOffset = table[this.rotation][i];
			const newOffset = table[(this.rotation + dr) % 4][i];
			return this.update(curOffset - newOffset, dr);
		});
	}
}
// Helper functions
function posMod(x, y) {
	return (x + y) % y;
}
function collisionCheck(piece, cell) {
	return cells[cell] !== " " && cells[cell] !== "_" && !piece.blocks.includes(cell) && cell >= 0;
}
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
export function newGame() {
	cells = Array(CELL_AMOUNT).fill(" ");
	queue = newBag();
	held = null;
	current = new Piece(queue.shift());
	score = 0;
	combo = 0;
	gameOver = false;
	changed = true;
	hasHeld = false;
	gravityTimer = 0;
	lockMoves = 0;
	lockTimer = 0;
	autorepeatTimer = 0;
}
// Game mechanics
function updateGhost(newPiece = current) {
	let ghostCenter = newPiece.center;
	while (ghostCenter < CELL_AMOUNT) {
		ghostCenter += COLS;
		const position = newPosition(newPiece.type, ghostCenter, newPiece.rotation);
		if (position.some(cell => cell > CELL_AMOUNT - 1 || collisionCheck(newPiece, cell))) {
			ghostCenter -= COLS;
			break;
		}
	}
	ghost = new Piece(newPiece.type, ghostCenter, newPiece.rotation, true);
}
function lock() { // Returns whether the game is over
	// Clear lines
	const lines = new Set(current.blocks.map(block => Math.floor(block / COLS)));
	let linesCleared = 0;
	if (lines.has(1)) {
		return true;
	}
	for (const line of lines) {
		if (cells.slice(line * COLS + 1, (line + 1) * COLS).every(cell => cell !== " ")) {
			linesCleared++;
			cells.splice(line * COLS, COLS);
			cells.unshift(...Array(COLS).fill(" "));
		}
	}
	// Update score
	score += LINE_SCORES[linesCleared];
	if (cells.every(cell => cell === " ")) {
		score += PERFECT_CLEAR_SCORE;
	}
	if (linesCleared > 0) {
		score += combo * COMBO_SCORE;
		combo++;
	} else {
		combo = 0;
	}
	// New piece
	current = new Piece(queue.shift());
	if (queue.length < NEXT_AMOUNT) {
		queue.push(...newBag());
	}
	gravityTimer = 0;
	lockMoves = 0;
	lockTimer = 0;
	hasHeld = false;
	return false;
}
// Game loop
export function onKeyDown(e) {
	if (!heldKeys.has(e.key)) { // Prevent held key spam
		heldKeys.add(e.key);
		handle(e);
	}
}
export function onKeyUp(e) {
	heldKeys.delete(e.key);
}
export function handle({key, location}) {
	changed = false;
	if (key === "Escape") {
		gameOver = true;
		heldKeys.clear();
	} else if (key === "r" || key === "R") {
		newGame();
	} else if (key === " ") {
		const offset = ghost.center - current.center;
		current.update(offset);
		score += 2 * (offset / COLS);
		lock();
	} else if (key === "X" || key === "x" || key === "ArrowUp") {
		current.rotate(1); // Clockwise
	} else if (key === "Z" || key === "z") {
		current.rotate(3); // Counterclockwise
	} else if (key === "A" || key === "a" || key === "Shift" && location === KeyboardEvent.DOM_KEY_LOCATION_LEFT) {
		current.rotate(2); // 180°
	} else if (key === "C" || key === "c") {
		if (hasHeld) {
			return;
		}
		hasHeld = true;
		current.clear();
		ghost.clear();
		[held, current] = [current.type, new Piece(held ?? queue.shift())];
	}
}
export function update() {
	// Handle held keys
	if (heldKeys.has("ArrowLeft") !== heldKeys.has("ArrowRight")) {
		if (autorepeatTimer === 0) { // Move once before autorepeat
			current.update(heldKeys.has("ArrowLeft") ? -1 : 1);
		}
		autorepeatTimer++;
	} else {
		autorepeatTimer = 0;
	}
	if (autorepeatTimer >= AUTOREPEAT_SPEED) {
		current.update(heldKeys.has("ArrowLeft") ? -1 : 1);
	}
	if (heldKeys.has("ArrowDown")) {
		const success = current.update(COLS);
		score += success ? 1 : 0;
	}
	// Update board
	if (current.blocks.some(block => block + COLS > (CELL_AMOUNT - 1) || collisionCheck(current, block + COLS))) {
		gravityTimer = 0;
		lockTimer++;
	} else {
		gravityTimer++;
	}
	if (gravityTimer >= GRAVITY_SPEED) {
		gravityTimer = 0;
		current.update(COLS);
	}
	if (lockTimer >= LOCK_SPEED) {
		gameOver ||= lock();
	}
	return [changed, gameOver, score];
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
	context.fontSize = 5;
	context.textAlign = "right";
	context.fillStyle = "black";
	context.fillText("Score " + score.toString().padStart(6, "0"), HELD_START_X + 5 * CELL_SIZE, SCORE_START_Y);
}