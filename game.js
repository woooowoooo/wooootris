import StateMachine from "./state-machine/module.js";
import {
	canvas, context, images, sounds, stateMachines, objects, settings,
	clear, render, loadResources,
	Drawable, MuteButton, TextButton, TextToggle, Slider, TextInput
} from "./index.js";
import {newGame, onKeyDown, onKeyUp, update, render as tetrisRender} from "./tetris.js";
import {connect, disconnect} from "./p2p.js";
// State machine
const stateMachine = new StateMachine({
	init: "boot",
	transitions: [{
		name: "toMenu",
		from: "*",
		to: "menu"
	}, {
		name: "toSingleplayer",
		from: "menu",
		to: "singleplayer"
	}, {
		name: "start",
		from: "singleplayer",
		to: "main"
	}, {
		name: "toMultiplayer",
		from: "menu",
		to: "multiplayer"
	}, {
		name: "multiplayerToMenu",
		from: "multiplayer",
		to: "menu"
	}, {
		name: "connect",
		from: "multiplayer",
		to: "confirm"
	}, {
		name: "cancel",
		from: "confirm",
		to: "multiplayer"
	}, {
		name: "accept",
		from: "confirm",
		to: "menu" // TODO: Change
	}, {
		name: "toSettings",
		from: "menu",
		to: "settings"
	}, {
		name: "toControls",
		from: "menu",
		to: "controls"
	}, {
		name: "toHelp",
		from: "menu",
		to: "help"
	}, {
		name: "toCredits",
		from: "menu",
		to: "credits"
	}, {
		name: "lose",
		from: "main",
		to: "gameOver"
	}, {
		name: "retry",
		from: "gameOver",
		to: "main"
	}],
	methods: {
		onTransition(lifecycle) {
			console.log(`Transition: ${lifecycle.transition}\tNew State: ${lifecycle.to}`);
		},
		onAfterTransition() {
			render();
		},
		async onBoot() {
			// Loading screen
			objects.set("background", new Drawable(() => {
				context.fillStyle = "black";
				context.fillRect(0, 0, 1920, 1280);
			}));
			objects.set("loading", new Drawable(() => {
				context.fillStyle = "white";
				context.fontSize = 16;
				context.textAlign = "center";
				context.fillText("LOADING", 960, 400);
				context.fontSize = 8;
				context.fillText("If this doesn't go away,", 960, 800);
				context.fillText("refresh the page.", 960, 960);
			}));
			render();
			await loadResources();
			console.log("Resources loaded.", images, sounds);
			objects.delete("loading");
			// Prompt for user interaction so autoplay won't get blocked
			objects.set("prompt", new Drawable(() => {
				context.fillStyle = "white";
				context.fontSize = 8;
				context.textAlign = "center";
				context.fillText("Loading finished.", 960, 400);
				context.fillText("CLICK ANYWHERE", 960, 800);
				context.fillText("TO CONTINUE", 960, 960);
			}));
			canvas.addEventListener("click", stateMachine.toMenu, {once: true});
		},
		onMenu() {
			clear();
			sounds.mainTheme.play();
			objects.set("background", new Drawable(() => context.drawImage(images.background, 0, 0, 1920, 1280)));
			objects.set("title", new Drawable(() => {
				context.fillStyle = "white";
				context.fontSize = 20;
				context.fillText("wooootris", 960, 400);
			}));
			objects.set("singleplayer", new TextButton(560, 640, "1-player", stateMachine.toSingleplayer, 640));
			objects.set("multiplayer", new TextButton(1360, 640, "2-player", stateMachine.toMultiplayer, 640));
			objects.set("settings", new TextButton(560, 800, "Settings", stateMachine.toSettings, 640));
			objects.set("controls", new TextButton(1360, 800, "Controls", stateMachine.toControls, 640));
			objects.set("help", new TextButton(560, 960, "Help", stateMachine.toHelp, 640));
			objects.set("credits", new TextButton(1360, 960, "Credits", stateMachine.toCredits, 640));
			objects.set("mute", new MuteButton());
		},
		onSingleplayer() {
			clear();
			objects.set("background", new Drawable(() => context.drawImage(images.background, 0, 0, 1920, 1280)));
			objects.set("title", new Drawable(() => {
				context.fillStyle = "white";
				context.fontSize = 12;
				context.fillText("Select mode", 960, 400);
			}));
			objects.set("regular", new TextButton(960, 600, "Regular", () => stateMachine.start("default"), 640));
			objects.set("fortyLines", new TextButton(960, 760, "40 Lines", () => stateMachine.start("fortyLines"), 640));
			objects.set("return", new TextButton(960, 960, "Return", stateMachine.toMenu, 640));
			objects.set("mute", new MuteButton());
		},
		onMultiplayer() {
			clear();
			objects.set("background", new Drawable(() => context.drawImage(images.background, 0, 0, 1920, 1280)));
			objects.set("title", new Drawable(() => {
				context.fillStyle = "white";
				context.fontSize = 12;
				context.fillText("Connect", 960, 320);
			}));
			objects.set("descriptions", new Drawable(() => {
				context.fontSize = 8;
				context.textAlign = "right";
				context.fillText("Your ID:", 680, 480 + 28);
				context.fillText("Other ID:", 680, 600 + 28);
				context.fontSize = 6;
				context.textAlign = "left";
				context.fillText("wooootris-", 720, 480 + 20, 960);
				context.fillText("wooootris-", 720, 600 + 20, 960);
			}));
			objects.set("idInput", new TextInput(1200, 480, 540, "id"));
			objects.set("otherIdInput", new TextInput(1200, 600, 540));
			objects.set("connect", new TextButton(960, 760, "Connect", () => connect("wooootris-" + objects.get("otherIdInput").buffer), 640));
			const feedbacks = {
				"connected": "Connected",
				"connecting": "Connecting...",
				"decline": "Opponent declined",
				"error": "Error",
				"received": "Connection received"
			};
			objects.set("connectFeedback", new Drawable(() => {
				if (stateMachines.connection.state !== "disconnected") {
					context.fillStyle = "white";
					context.fontSize = 4;
					context.textAlign = "center";
					context.fillText(feedbacks[stateMachines.connection.state], 960, 920);
				}
			}));
			window.addEventListener("wooootris-connect", stateMachine.connect, {once: true});
			objects.set("return", new TextButton(960, 960, "Return", stateMachine.multiplayerToMenu, 640));
			objects.set("mute", new MuteButton());
		},
		onMultiplayerToMenu() {
			disconnect();
			window.removeEventListener("wooootris-connect", stateMachine.connect, {once: true});
		},
		onConfirm(_, e) {
			objects.set("modal", new Drawable(() => {
				context.fillStyle = "rgba(0, 0, 0, 0.5)";
				context.fillRect(0, 0, 1920, 1280);
				context.fillStyle = "white";
				context.fontSize = 8;
				context.textAlign = "center";
				context.fillText(e.detail, 960, 400);
				context.fillText("wants to play you", 960, 480);
			}));
			objects.set("decline", new TextButton(560, 880, "Decline", stateMachine.cancel, 640));
			objects.set("accept", new TextButton(1380, 880, "Accept", stateMachine.accept, 640));
		},
		onSettings() {
			clear();
			objects.set("background", new Drawable(() => context.drawImage(images.background, 0, 0, 1920, 1280)));
			objects.set("text", new Drawable(() => {
				context.fillStyle = "white";
				context.textAlign = "right";
				context.fillText("Grid:", 600, 280 - 20 + 28);
				context.fillText("ARR:", 600, 440 + 28);
				context.fillText("DAS:", 600, 600 + 28);
				context.fillText("Volume:", 600, 760 + 28);
			}));
			objects.set("grid", new TextToggle(1200, 280 - 20 + 28 - 92, "grid"));
			objects.set("arr", new Slider(720, 440, 960, "arr", 0, 5));
			objects.set("das", new Slider(720, 600, 960, "das", 0, 20));
			objects.set("volume", new Slider(720, 760, 960, "volume", 0, 100, 10, false, () => {
				for (const sound of Object.values(sounds)) {
					sound.volume = settings.volume / 100;
				}
			}));
			objects.set("return", new TextButton(960, 960, "Return", stateMachine.toMenu, 640));
			objects.set("mute", new MuteButton());
		},
		onControls() {
			clear();
			objects.set("background", new Drawable(() => context.drawImage(images.background, 0, 0, 1920, 1280)));
			const texts = {
				"Move Left": "Left",
				"Move Right": "Right",
				"Rotate CW": "Up / X",
				"Rotate CCW": "Z",
				"Rotate Twice": "Left Shift",
				"Soft Drop": "Down",
				"Hard Drop": "Space",
				"Hold": "C",
				"Restart": "R",
				"Quit": "Esc"
			};
			objects.set("controls", new Drawable(() => {
				context.fillStyle = "white";
				context.fontSize = 8;
				let textY = 200;
				for (const [name, keybind] of Object.entries(texts)) {
					context.textAlign = "right";
					context.fillText(name + ":", 960, textY);
					context.textAlign = "left";
					context.fillText(keybind, 1080, textY);
					textY += 80;
				}
			}));
			objects.set("return", new TextButton(960, 1040, "Return", stateMachine.toMenu, 640));
			objects.set("mute", new MuteButton());
		},
		onHelp() {
			clear();
			objects.set("background", new Drawable(() => context.drawImage(images.background, 0, 0, 1920, 1280)));
			objects.set("help", new Drawable(() => {
				context.fillStyle = "white";
				context.fontSize = 6;
				context.fillText("ARR (Auto-Repeat Rate) is how fast a", 960, 320);
				context.fillText("piece moves when a move key is held", 960, 400);
				context.fillText("DAS (Delayed Auto Shift) is how many", 960, 560);
				context.fillText("frames happen before autorepeat engages", 960, 640);
				context.fillText("2-player currently does not work", 960, 800);
			}));
			objects.set("return", new TextButton(960, 960, "Return", stateMachine.toMenu, 640));
			objects.set("mute", new MuteButton());
		},
		onCredits() {
			clear();
			objects.set("background", new Drawable(() => context.drawImage(images.background, 0, 0, 1920, 1280)));
			objects.set("credits", new Drawable(() => {
				context.fillStyle = "white";
				context.fontSize = 8;
				context.fillText("Everything", 960, 360);
				context.fillText("woooowoooo", 960, 440);
				context.fillText("Inspiration and testing", 960, 640);
				context.fillText("yayuuuhhhh", 960, 720);
			}));
			objects.set("return", new TextButton(960, 960, "Return", stateMachine.toMenu, 640));
			objects.set("mute", new MuteButton());
		},
		onMain(_, newMode) {
			clear();
			newGame(newMode);
			window.addEventListener("keydown", onKeyDown);
			window.addEventListener("keyup", onKeyUp);
			objects.set("background", new Drawable(() => context.drawImage(images.background, 0, 0, 1920, 1280)));
			objects.set("mute", new MuteButton());
			objects.set("tetris", new Drawable(tetrisRender));
			requestAnimationFrame(loop);
		},
		onGameOver(_, text) {
			window.removeEventListener("keydown", onKeyDown);
			window.removeEventListener("keyup", onKeyUp);
			for (const sound of Object.values(sounds).filter(sound => !sound.paused)) {
				sound.pause();
			}
			objects.set("endScreen", new Drawable(() => {
				context.fillStyle = "rgba(0, 0, 0, 0.5)";
				context.fillRect(0, 0, 1920, 1280);
				context.fillStyle = "white";
				context.fontSize = 16;
				context.textAlign = "center";
				context.fillText("GAME OVER", 960, 400);
				context.fontSize = 8;
				let textY = 540;
				for (const line of text) {
					context.fillText(line, 960, textY);
					textY += 100;
				}
			}));
			objects.set("menu", new TextButton(672, 880, "Menu", stateMachine.toMenu, 480));
			objects.set("retry", new TextButton(1248, 880, "Retry", stateMachine.retry, 480));
		},
		onLeaveGameOver() {
			for (const sound of Object.values(sounds).filter(sound => sound.paused)) {
				sound.play();
			}
		}
	}
});
stateMachines.main = stateMachine;
// Main loop
const FPS = 60;
const FRAME_TIME = 1000 / FPS;
let lastTime = window.performance.now();
function loop(time) {
	// Lock to 60 fps
	if (time - lastTime < FRAME_TIME) {
		requestAnimationFrame(loop);
		return;
	}
	lastTime = time - (time % FRAME_TIME);
	frames++;
	// Break on game loss
	if (!stateMachine.is("main")) {
		return;
	}
	// Handling is done in tetris.js
	// Update game state
	const [changed, endText] = update();
	if (endText != null) {
		stateMachine.lose(endText);
	}
	if (changed) { // If board has updated
		render();
	}
	requestAnimationFrame(loop);
}