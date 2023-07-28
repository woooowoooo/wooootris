import {settings} from "./index.js";
// Constants
export const ROWS = 20;
export const TCOLS = 10;
export const COLS = TCOLS + 1;
export const MID = Math.floor(COLS / 2);
export const CELL_AMOUNT = COLS * (ROWS + 2);
export const NEXT_AMOUNT = 6;
export const BLOCKS = {
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
// State variables
export const highScores = new Proxy(JSON.parse(localStorage.getItem("wooootrisHighScores")) ?? {}, {
	set: function (target, property, value) {
		console.log(`${property} has been set to ${value}`);
		const valid = Reflect.set(...arguments);
		localStorage.setItem("wooootrisHighScores", JSON.stringify(target));
		return valid;
	}
});
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
export function newGame(newMode = mode) {
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
	highScores[mode] = mode === "fortyLines" ? Math.min(time, highScores[mode] ?? Infinity) : Math.max(score, highScores[mode] ?? 0);
	const endText = {
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
export function getInfo() {
	if (mode === "default") {
		return {
			Score: score,
			HScore: (highScores[mode] ?? "None"),
			Lines: totalLines,
			Combo: combo,
			B2B: hardMove
		};
	} else { // Forty lines
		return {
			Time: (time / 1000).toFixed(3) + "s",
			FTime: (highScores[mode] != null) ? ((highScores[mode] / 1000).toFixed(3) + "s") : "None",
			Lines: `${totalLines} / 40`,
			Combo: combo,
			B2B: hardMove
		};
	}
}