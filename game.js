import StateMachine from "./state-machine/module.js";
import {context, images, sounds, paused, objects, settings, clear, render, wrapClickEvent, Drawable, MuteButton, TextButton, TextToggle, Slider, loadResources} from "./index.js";
import {newGame, onKeyDown, onKeyUp, update, render as tetrisRender} from "./tetris.js";
// State machine
const stateMachine = new StateMachine({
	init: "boot",
	transitions: [
		{
			name: "toMenu",
			from: "*",
			to: "menu"
		},
		{
			name: "toSingleplayer",
			from: "menu",
			to: "singleplayer"
		},
		{
			name: "start",
			from: "singleplayer",
			to: "main"
		},
		{
			name: "toSettings",
			from: "menu",
			to: "settings"
		},
		{
			name: "toControls",
			from: "menu",
			to: "controls"
		},
		{
			name: "toCredits",
			from: "menu",
			to: "credits"
		},
		{
			name: "lose",
			from: "main",
			to: "gameOver"
		},
		{
			name: "retry",
			from: "gameOver",
			to: "main"
		}
	],
	methods: {
		onTransition(lifecycle) {
			console.log(`Transition: ${lifecycle.transition}\tNew State: ${lifecycle.to}`);
		},
		async onBoot() {
			// Loading screen
			context.fillStyle = "black";
			context.fillRect(0, 0, 1920, 1280);
			context.fillStyle = "white";
			context.fontSize = 16;
			context.textAlign = "center";
			context.fillText("LOADING", 960, 400);
			context.fontSize = 8;
			context.fillText("If this doesn't go away,", 960, 800);
			context.fillText("refresh the page.", 960, 960);
			await loadResources();
			console.log("Resources loaded.", images, sounds);
			// Prompt for user interaction so autoplay won't get blocked
			clear();
			context.fillStyle = "black";
			context.fillRect(0, 0, 1920, 1280);
			context.fillStyle = "white";
			context.fontSize = 8;
			context.fillText("Loading finished.", 960, 400);
			context.fillText("CLICK ANYWHERE", 960, 800);
			context.fillText("TO CONTINUE", 960, 960);
			wrapClickEvent(stateMachine.toMenu);
		},
		onMenu() {
			clear();
			sounds.mainTheme.play();
			objects.set("background", new Drawable(() => context.drawImage(images.background, 0, 0, 1920, 1280)));
			objects.set("title", new Drawable(() => {
				context.fillStyle = "white";
				context.fontSize = 20;
				context.fillText("wooootris", 960, 320);
			}));
			objects.set("singleplayer", new TextButton(960, 520, "1-player", stateMachine.toSingleplayer, 640));
			objects.set("settings", new TextButton(960, 680, "Settings", stateMachine.toSettings, 640));
			objects.set("controls", new TextButton(960, 840, "Controls", stateMachine.toControls, 640));
			objects.set("credits", new TextButton(960, 1000, "Credits", stateMachine.toCredits, 640));
			objects.set("mute", new MuteButton());
		},
		onSingleplayer() {
			clear();
			objects.set("background", new Drawable(() => context.drawImage(images.background, 0, 0, 1920, 1280)));
			objects.set("title", new Drawable(() => {
				context.fillStyle = "white";
				context.fontSize = 20;
				context.fillText("wooootris", 960, 320);
			}));
			objects.set("regular", new TextButton(960, 520, "Regular", () => stateMachine.start("default"), 640));
			objects.set("fortyLines", new TextButton(960, 680, "40 Lines", () => stateMachine.start("fortyLines"), 640));
			objects.set("return", new TextButton(960, 1000, "Return", stateMachine.toMenu, 640));
			objects.set("mute", new MuteButton());
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
			objects.set("arr", new Slider(1200, 440, 960, "arr", 0, 5));
			objects.set("das", new Slider(1200, 600, 960, "das", 0, 20));
			objects.set("volume", new Slider(1200, 760, 960, "volume", 0, 100, 10, false, () => {
				for (const sound of Object.values(sounds)) {
					sound.volume = settings.volume / 100;
				}
			}));
			objects.set("return", new TextButton(960, 1000, "Return", stateMachine.toMenu, 640));
			objects.set("mute", new MuteButton());
		},
		onControls() {
			clear();
			objects.set("background", new Drawable(() => context.drawImage(images.background, 0, 0, 1920, 1280)));
			objects.set("controls", new Drawable(() => {
				context.fillStyle = "white";
				context.fontSize = 8;
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
				let textY = 200;
				for (const [name, keybind] of Object.entries(texts)) {
					context.textAlign = "right";
					context.fillText(name + ":", 960, textY);
					context.textAlign = "left";
					context.fillText(keybind, 1080, textY);
					textY += 80;
				}
			}));
			objects.set("return", new TextButton(960, 1000, "Return", stateMachine.toMenu, 640));
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
			objects.set("return", new TextButton(960, 1000, "Return", stateMachine.toMenu, 640));
			objects.set("mute", new MuteButton());
		},
		onMain(_, newMode = mode) {
			mode = newMode;
			clear();
			newGame(mode, settings);
			window.addEventListener("keydown", onKeyDown);
			window.addEventListener("keyup", onKeyUp);
			objects.set("background", new Drawable(() => context.drawImage(images.background, 0, 0, 1920, 1280)));
			objects.set("mute", new MuteButton());
			objects.set("tetris", new Drawable(() => tetrisRender(context)));
			requestAnimationFrame(loop);
		},
		onGameOver(_, text) {
			window.removeEventListener("keydown", onKeyDown);
			window.removeEventListener("keyup", onKeyUp);
			paused = true;
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
			objects.set("menu", new TextButton(672, 920, "Menu", stateMachine.toMenu, 480, true));
			objects.set("retry", new TextButton(1248, 920, "Retry", stateMachine.retry, 480, true));
		},
		onLeaveGameOver() {
			paused = false;
			for (const sound of Object.values(sounds).filter(sound => sound.paused)) {
				sound.play();
			}
		}
	}
});
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