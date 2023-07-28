import {context, settings} from "./index.js";
import {
	ROWS, TCOLS, COLS, MID, CELL_AMOUNT, NEXT_AMOUNT, BLOCKS,
	getInfo
} from "./tetris.js";
// Colors (Done with https://css.land/lch)
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
// Graphic constants
const CELL_SIZE = 60;
const START_X = (1920 - TCOLS * CELL_SIZE) / 2;
const START_Y = (1280 - ROWS * CELL_SIZE) / 2;
const OUTLINE_WIDTH = 8;
const GRID_WIDTH = 4;
const QUEUE_GAP = 180;
const QUEUE_WIDTH = 2.5 * CELL_SIZE;
const QUEUE_CENTER_X = START_X + TCOLS * CELL_SIZE + 300;
const QUEUE_START_Y = (1280 - (NEXT_AMOUNT - 1) * QUEUE_GAP - 2 * CELL_SIZE) / 2;
const HELD_CENTER_X = START_X - 300;
const SCORE_START_Y = QUEUE_START_Y + 3 * CELL_SIZE + QUEUE_GAP;
const TEXT_LINE_HEIGHT = CELL_SIZE;
// Move text
let moveText = null;
let moveTextTimer = 0;
const MOVE_TEXT_DURATION = 60;
// State variables
let mode = null;
let cells = Array(CELL_AMOUNT).fill(" ");
let queue = Array(7);
let held = null;
let changed = true;
// Functions
function displayPiece(context, type, x, y) {
	x -= CELL_SIZE * (type === "I" || type === "O" ? 1 : 0.5);
	y += CELL_SIZE * (type === "I" ? 0.5 : 1);
	context.fillStyle = COLORS[type];
	for (const block of BLOCKS[type][0]) {
		context.fillRect(x + ((block + MID + COLS) % COLS - MID) * CELL_SIZE, y + Math.round(block / COLS) * CELL_SIZE, CELL_SIZE, CELL_SIZE);
	}
}
export function render() {
	changed = false;
	// Draw outlines
	context.fillStyle = "white";
	context.fillRect(START_X - OUTLINE_WIDTH, START_Y - OUTLINE_WIDTH, TCOLS * CELL_SIZE + 2 * OUTLINE_WIDTH, ROWS * CELL_SIZE + 2 * OUTLINE_WIDTH);
	context.fillRect(QUEUE_CENTER_X - QUEUE_WIDTH - OUTLINE_WIDTH, QUEUE_START_Y - CELL_SIZE - OUTLINE_WIDTH, 2 * (QUEUE_WIDTH + OUTLINE_WIDTH), NEXT_AMOUNT * QUEUE_GAP + CELL_SIZE + 2 * OUTLINE_WIDTH);
	context.fillRect(HELD_CENTER_X - QUEUE_WIDTH - OUTLINE_WIDTH, QUEUE_START_Y - OUTLINE_WIDTH, 2 * (QUEUE_WIDTH + OUTLINE_WIDTH), 4 * CELL_SIZE + 2 * OUTLINE_WIDTH);
	// Fill rectangles
	context.fillStyle = "hsl(30, 5%, 15%)";
	context.fillRect(START_X, START_Y, TCOLS * CELL_SIZE, ROWS * CELL_SIZE);
	context.fillStyle = "hsl(30, 5%, 85%)";
	context.fillRect(QUEUE_CENTER_X - QUEUE_WIDTH, QUEUE_START_Y - CELL_SIZE, 2 * QUEUE_WIDTH, NEXT_AMOUNT * QUEUE_GAP + CELL_SIZE);
	context.fillRect(HELD_CENTER_X - QUEUE_WIDTH, QUEUE_START_Y, 2 * QUEUE_WIDTH, 4 * CELL_SIZE);
	// Draw gridlines
	if (settings.grid) {
		context.fillStyle = "hsla(0, 0%, 100%, 10%)";
		for (let i = 1; i < TCOLS; i++) {
			context.fillRect(START_X + i * CELL_SIZE - GRID_WIDTH / 2, START_Y, GRID_WIDTH, ROWS * CELL_SIZE);
		}
		for (let i = 1; i < ROWS; i++) {
			context.fillRect(START_X, START_Y + i * CELL_SIZE - GRID_WIDTH / 2, TCOLS * CELL_SIZE, GRID_WIDTH);
		}
	}
	// Fill cells
	for (const [position, cell] of cells.entries()) {
		if (cell !== " ") {
			context.fillStyle = COLORS[cell];
			context.fillRect(START_X + (position % COLS - 1) * CELL_SIZE, START_Y + Math.floor(position / COLS - 2) * CELL_SIZE, CELL_SIZE, CELL_SIZE);
		}
	}
	// Draw queue
	for (const [position, tetromino] of Array.from(queue.entries()).slice(0, NEXT_AMOUNT)) {
		displayPiece(context, tetromino, QUEUE_CENTER_X, QUEUE_START_Y + QUEUE_GAP * position);
	}
	// Draw held piece
	if (held != null) {
		displayPiece(context, held, HELD_CENTER_X, QUEUE_START_Y + CELL_SIZE);
	}
	// Draw info
	context.fontSize = 5;
	context.textAlign = "right";
	context.fillStyle = "white";
	let textY = SCORE_START_Y;
	for (const [key, value] of Object.entries(getInfo())) {
		context.fillText(key, HELD_CENTER_X + 4 * CELL_SIZE - (mode === "default" ? 320 : 360), textY);
		context.fillText(value, HELD_CENTER_X + 4 * CELL_SIZE, textY);
		textY += TEXT_LINE_HEIGHT;
	}
	// Draw ephemeral text
	if (moveText != null) {
		context.fillStyle = `hsla(0, 0%, 100%, ${Math.min(1, 2 * moveTextTimer / MOVE_TEXT_DURATION)})`;
		context.fillText(moveText, HELD_CENTER_X + 4 * CELL_SIZE, textY);
	}
}