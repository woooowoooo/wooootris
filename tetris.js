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
// Done with https://css.land/lch
const COLORS = {
	"_": "hsla(0, 0%, 100%, 50%)",
	"Z": "rgb(90.69%, 7.63%, 14.36%)", // lch(50%, 90, 35)
	"L": "rgb(94.33%, 48.8%, 0%)", // lch(65%, 90, 60)
	"O": "rgb(88.84%, 76.94%, 0%)", // lch(80%, 90, 90)
	"S": "rgb(20.91%, 83.23%, 17.82%)", // lch(75%, 90, 135)
	"I": "rgb(0%, 73.81%, 88.63%)", // lch(70%, 60, 225)
	"J": "rgb(19.55%, 36.7%, 98.71%)", // lch(45%, 90, 290)
	"T": "rgb(90.6%, 29.73%, 93.32%)" // lch(60%, 90, 325)
};
// Scores
const LINE_SCORES = [0, 100, 300, 500, 800];
const T_SPIN_MINI_SCORES = [100, 200, 400];
const T_SPIN_SCORES = [400, 800, 1200, 1600];
const PERFECT_CLEAR_SCORE = 3500;
const BACK_TO_BACK_MULTIPLIER = 1.5;
const COMBO_SCORE = 50;
// Limits (speeds are in frames)
const GRAVITY_SPEED = 60;
const LOCK_MOVE_LIMIT = 10;
const LOCK_SPEED = 40;
const MOVE_TEXT_DURATION = 60;
// Graphic constants
const CELL_SIZE = 60;
const CELL_AMOUNT = COLS * (ROWS + 2);
const START_X = (1920 - TCOLS * CELL_SIZE) / 2;
const START_Y = (1280 - ROWS * CELL_SIZE) / 2;
const OUTLINE_WIDTH = 8;
const GRID_WIDTH = 4;
const NEXT_AMOUNT = 6;
const QUEUE_GAP = 180;
const QUEUE_WIDTH = 2.5 * CELL_SIZE;
const QUEUE_CENTER_X = START_X + TCOLS * CELL_SIZE + 300;
const QUEUE_START_Y = (1280 - (NEXT_AMOUNT - 1) * QUEUE_GAP - 2 * CELL_SIZE) / 2;
const HELD_CENTER_X = START_X - 300;
const SCORE_START_Y = QUEUE_START_Y + 3 * CELL_SIZE + QUEUE_GAP;
const TEXT_LINE_HEIGHT = CELL_SIZE;
// State variables
let highScores = new Proxy(JSON.parse(localStorage.getItem("wooootrisHighScores")) ?? {}, {
	set: function (target, property, value) {
		console.log(`${property} has been set to ${value}`);
		const valid = Reflect.set(...arguments);
		localStorage.setItem("wooootrisHighScores", JSON.stringify(target));
		return valid;
	}
});
let settings = null;
let mode = null;
const heldKeys = new Set();
let cells = Array(CELL_AMOUNT).fill(" ");
let queue = Array(7);
let held = null;
let current = null;
let ghost = null;
let moveText = null;
let endGameText = null;
let hasHeld = false;
let changed = true;
// Scoring
let startTime = 0;
let time = 0;
let score = 0;
let totalLines = 0;
let combo = 0;
let tSpin = false;
let hardMove = false;
// Timers
let gravityTimer = 0;
let lockMoves = 0;
let lockTimer = 0;
let autorepeatTimer = 0;
let moveTextTimer = 0;
// Piece class
class Piece {
	constructor (type, center, rotation, isGhost = false) {
		changed = true;
		this.type = type;
		this.ghost = isGhost;
		this.center = center ?? MID;
		this.rotation = rotation ?? 0;
		this.blocks = newPosition(type, center ?? MID, rotation ?? 0);
		if (!isGhost) {
			if (queue.length < NEXT_AMOUNT) {
				queue.push(...newBag());
			}
			updateGhost(this);
			ghost.fill();
		}
		this.fill();
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
		changed = true;
		tSpin = this.type === "T" && rOffset !== 0;
		// Remove old piece
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
function displayPiece(context, type, x, y) {
	x -= CELL_SIZE * (type === "I" || type === "O" ? 1 : 0.5);
	y += CELL_SIZE * (type === "I" ? 0.5 : 1);
	context.fillStyle = COLORS[type];
	for (const block of BLOCKS[type][0]) {
		context.fillRect(x + ((block + MID + COLS) % COLS - MID) * CELL_SIZE, y + Math.round(block / COLS) * CELL_SIZE, CELL_SIZE, CELL_SIZE);
	}
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
export function newGame(newMode, newSettings = settings) {
	settings = newSettings;
	mode = newMode;
	heldKeys.clear();
	cells = Array(CELL_AMOUNT).fill(" ");
	queue = newBag();
	held = null;
	current = new Piece(queue.shift());
	moveText = null;
	endGameText = null;
	hasHeld = false;
	changed = true;
	// Scoring
	startTime = window.performance.now();
	time = 0;
	score = 0;
	totalLines = 0;
	combo = 0;
	tSpin = false;
	hardMove = false;
	// Timers
	gravityTimer = 0;
	lockMoves = 0;
	lockTimer = 0;
	autorepeatTimer = 0;
}
function endGame(win) {
	if (!win) {
		endGameText = ["Retry?"];
		return;
	}
	highScores[mode ?? newMode] = mode === "fortyLines" ? Math.min(time, highScores[mode] ?? Infinity) : Math.max(score, highScores[mode] ?? 0);
	let endText = {
		default: [`Score: ${score}`, `High Score: ${highScores[mode]}`],
		fortyLines: [`Time: ${time / 1000} seconds`, `Fastest Time: ${highScores[mode] / 1000} seconds`]
	};
	endGameText = endText[mode];
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
function scoreMove(linesCleared) {
	if (tSpin) {
		const corners = [-COLS - 1, -COLS + 1, COLS + 1, COLS - 1].map(offset => current.center + offset);
		const amountNames = ["", " Single", " Double", " Triple"];
		const filled = corners.map(cell => cells[cell] !== " ");
		if (filled.filter(Boolean).length >= 3) { // 3-corner rule
			hardMove = true;
			moveTextTimer = MOVE_TEXT_DURATION;
			const facing = [current.rotation, (current.rotation + 1) % 4].filter(corner => filled[corner]);
			if (facing.length === 2) { // 2-corner rule
				moveText = `T-Spin${amountNames[linesCleared]}`;
				return T_SPIN_SCORES[linesCleared];
			}
			moveText = `T-Spin Mini${amountNames[linesCleared]}`;
			return T_SPIN_MINI_SCORES[linesCleared];
		}
	}
	if (linesCleared > 0) {
		hardMove = linesCleared === 4;
		if (linesCleared === 4) {
			moveTextTimer = MOVE_TEXT_DURATION;
			moveText = "Tetris";
		}
	}
	return LINE_SCORES[linesCleared];
}
function lock() { // Returns whether the game is over
	// Count full lines
	const lines = new Set(current.blocks.map(block => Math.floor(block / COLS)));
	if (lines.has(1)) {
		endGame(mode === "default");
		return;
	}
	const fullLines = [...lines].filter(line => cells.slice(line * COLS + 1, (line + 1) * COLS).every(cell => cell !== " "));
	totalLines += fullLines.length;
	// Update score
	const backToBack = hardMove;
	score += ((backToBack && hardMove && fullLines.length > 0) ? BACK_TO_BACK_MULTIPLIER : 1) * scoreMove(fullLines.length);
	if (fullLines.length > 0) {
		score += combo * COMBO_SCORE;
		combo++;
	} else {
		combo = 0;
	}
	// Clear lines
	for (const line of fullLines) {
		cells.splice(line * COLS, COLS);
		cells.unshift(...Array(COLS).fill(" "));
	}
	// Perfect clear bonus
	if (cells.every(cell => cell === " ")) {
		moveText = "Perfect Clear";
		moveTextTimer = MOVE_TEXT_DURATION;
		score += PERFECT_CLEAR_SCORE;
	}
	// End game on 40 line mode
	if (mode === "fortyLines" && totalLines >= 40) {
		endGame(true);
		return;
	}
	// New piece
	current = new Piece(queue.shift());
	gravityTimer = 0;
	lockMoves = 0;
	lockTimer = 0;
	hasHeld = false;
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
	if (key === "Escape") {
		endGame(mode === "default");
		heldKeys.clear();
	} else if (key === "r" || key === "R") {
		newGame(mode);
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
	time = window.performance.now() - startTime;
	// Handle held keys
	if (heldKeys.has("ArrowLeft") !== heldKeys.has("ArrowRight")) {
		if (autorepeatTimer === 0 || autorepeatTimer > settings.das && autorepeatTimer % settings.arr === 0) {
			current.update(heldKeys.has("ArrowLeft") ? -1 : 1);
		}
		if (settings.arr === 0 && autorepeatTimer > settings.das) {
			while (current.update(heldKeys.has("ArrowLeft") ? -1 : 1)) {}
		}
		autorepeatTimer++;
	} else {
		autorepeatTimer = 0;
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
		lock();
	}
	if (moveTextTimer > 0) {
		changed = true; // Text color changes
		moveTextTimer--;
	} else if (moveText != null) {
		moveText = null;
	}
	return [mode === "fortyLines" ? true : changed, endGameText];
}
export function render(context) {
	changed = false;
	context.fillStyle = "white";
	context.fillRect(START_X - OUTLINE_WIDTH, START_Y - OUTLINE_WIDTH, TCOLS * CELL_SIZE + 2 * OUTLINE_WIDTH, ROWS * CELL_SIZE + 2 * OUTLINE_WIDTH);
	context.fillRect(QUEUE_CENTER_X - QUEUE_WIDTH - OUTLINE_WIDTH, QUEUE_START_Y - CELL_SIZE - OUTLINE_WIDTH, 2 * (QUEUE_WIDTH + OUTLINE_WIDTH), NEXT_AMOUNT * QUEUE_GAP + CELL_SIZE + 2 * OUTLINE_WIDTH);
	context.fillRect(HELD_CENTER_X - QUEUE_WIDTH - OUTLINE_WIDTH, QUEUE_START_Y - OUTLINE_WIDTH, 2 * (QUEUE_WIDTH + OUTLINE_WIDTH), 4 * CELL_SIZE + 2 * OUTLINE_WIDTH);
	context.fillStyle = "hsl(30, 5%, 15%)";
	context.fillRect(START_X, START_Y, TCOLS * CELL_SIZE, ROWS * CELL_SIZE);
	context.fillStyle = "hsl(30, 5%, 85%)";
	context.fillRect(QUEUE_CENTER_X - QUEUE_WIDTH, QUEUE_START_Y - CELL_SIZE, 2 * QUEUE_WIDTH, NEXT_AMOUNT * QUEUE_GAP + CELL_SIZE);
	context.fillRect(HELD_CENTER_X - QUEUE_WIDTH, QUEUE_START_Y, 2 * QUEUE_WIDTH, 4 * CELL_SIZE);
	if (settings.grid) {
		context.fillStyle = "hsla(0, 0%, 100%, 10%)";
		for (let i = 1; i < TCOLS; i++) {
			context.fillRect(START_X + i * CELL_SIZE - GRID_WIDTH / 2, START_Y, GRID_WIDTH, ROWS * CELL_SIZE);
		}
		for (let i = 1; i < ROWS; i++) {
			context.fillRect(START_X, START_Y + i * CELL_SIZE - GRID_WIDTH / 2, TCOLS * CELL_SIZE, GRID_WIDTH);
		}
	}
	for (const [position, cell] of cells.entries()) {
		if (cell !== " ") {
			context.fillStyle = COLORS[cell];
			context.fillRect(START_X + (position % COLS - 1) * CELL_SIZE, START_Y + Math.floor(position / COLS - 2) * CELL_SIZE, CELL_SIZE, CELL_SIZE);
		}
	}
	for (const [position, tetromino] of Array.from(queue.entries()).slice(0, NEXT_AMOUNT)) {
		displayPiece(context, tetromino, QUEUE_CENTER_X, QUEUE_START_Y + QUEUE_GAP * position);
	}
	if (held != null) {
		displayPiece(context, held, HELD_CENTER_X, QUEUE_START_Y + CELL_SIZE);
	}
	context.fontSize = 5;
	context.textAlign = "right";
	context.fillStyle = "white";
	const texts = {
		Score: score,
		HScore: (highScores[mode] ?? "None"),
		Lines: totalLines,
		Combo: combo,
		B2B: hardMove
	};
	const fortyLineTexts = {
		Time: (time / 1000).toFixed(3) + "s",
		FTime: (highScores[mode] != null) ? ((highScores[mode] / 1000).toFixed(3) + "s") : "None",
		Lines: `${totalLines} | 40`,
		Combo: combo,
		B2B: hardMove
	};
	let textY = SCORE_START_Y;
	for (const [key, value] of Object.entries(mode === "default" ? texts : fortyLineTexts)) {
		context.fillText(key, HELD_CENTER_X + 4 * CELL_SIZE - (mode === "default" ? 320 : 360), textY);
		context.fillText(value, HELD_CENTER_X + 4 * CELL_SIZE, textY);
		textY += TEXT_LINE_HEIGHT;
	}
	if (moveText != null) {
		context.fillStyle = `hsla(0, 0%, 100%, ${Math.min(1, 2 * moveTextTimer / MOVE_TEXT_DURATION)})`;
		context.fillText(moveText, HELD_CENTER_X + 4 * CELL_SIZE, textY);
	}
}