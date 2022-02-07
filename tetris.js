const cells = Array(200).fill(" ");
const colors = {
	"Z": "hsl(0, 70%, 50%)",
	"L": "hsl(30, 90%, 50%)",
	"O": "hsl(50, 90%, 50%)",
	"S": "hsl(120, 70%, 50%)",
	"I": "hsl(190, 90%, 50%)",
	"J": "hsl(230, 70%, 50%)",
	"T": "hsl(300, 90%, 50%)"
};
let tick = 0;
cells[4] = "O";
cells[5] = "O";
cells[14] = "O";
cells[15] = "O";
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
}
export function update(context) {
	context.fillStyle = "hsl(30, 5%, 20%)";
	context.fillRect(660, 40, 600, 1200);
	// Update
	if (!current.blocks.some(block => block + 10 > 199 || collisionCheck(block + 10))) {
		updateTetronimo(current.blocks.map(block => block + 10));
	}
	// Render
	for (const [position, cell] of cells.entries()) {
		if (cell !== " ") {
			context.fillStyle = colors[cell];
			context.fillRect(660 + (position % 10) * 60, 40 + Math.floor(position / 10) * 60, 60, 60);
		}
	}
	tick++;
}
export function handle(keys) {
	for (const key of keys) {
		if (key === "ArrowLeft" && !current.blocks.some(block => (block - 1) % 10 === 9 || collisionCheck(block - 1))) {
			updateTetronimo(current.blocks.map(block => block - 1));
		} else if (key === "ArrowRight" && !current.blocks.some(block => (block + 1) % 10 === 0 || collisionCheck(block + 1))) {
			updateTetronimo(current.blocks.map(block => block + 1));
		} else if (key === "ArrowDown" && !current.blocks.some(block => block + 10 > 199 || collisionCheck(block + 10))) {
			// Repeat of lines 52-54
			updateTetronimo(current.blocks.map(block => block + 10));
		}
		// TODO: Rotation
	}
}