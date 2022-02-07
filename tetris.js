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
function collisionCheck(block) {
	return block + 10 > 199 || cells[block + 10] !== " " && !current.blocks.includes(block + 10);
}
export default function update(context) {
	context.fillStyle = "hsl(30, 5%, 20%)";
	context.fillRect(660, 40, 600, 1200);
	// Update
	if (!current.blocks.some(collisionCheck)) {
		// Operations separated so upper blocks don't affect lower blocks
		for (const block of current.blocks) {
			cells[block] = " ";
		}
		current.blocks = current.blocks.map(block => block + 10);
		for (const block of current.blocks) {
			cells[block] = current.type;
		}
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