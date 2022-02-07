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
export default function update(context) {
	context.fillStyle = "hsl(30, 5%, 20%)";
	context.fillRect(660, 40, 600, 1200);
	// Render
	for (const [position, cell] of cells.entries()) {
		if (cell !== " ") {
			context.fillStyle = colors[cell];
			context.fillRect(660 + (position % 10) * 60, 40 + Math.floor(position / 10) * 60, 60, 60);
		}
	}
	tick++;
}