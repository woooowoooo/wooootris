import StateMachine from "./state-machine/module.js";
import {onKeyDown, onKeyUp, update, render as tetrisRender, newGame} from "./tetris.js";
const canvas = document.getElementById("game");
canvas.width = 1920;
canvas.height = 1280;
const context = canvas.getContext("2d");
context.imageSmoothingEnabled = false;
// Variables
const mouse = {
	x: 0,
	y: 0
};
const images = {};
const sounds = {};
let paused = false;
let muted = false;
let highScore = localStorage.getItem("wooootrisHighScore") ?? 0;
const objects = new Map();
// Helper functions
Object.defineProperty(context, "fontSize", {
	set: size => {
		context.font = `${size * 1024 / 100}px "Commodore 64", sans-serif`;
	}
});
function clear() {
	context.clearRect(0, 0, 1920, 1280);
	for (const object of Array.from(objects.values()).filter(object => (object instanceof Button))) {
		canvas.removeEventListener("click", object.fullCallback);
	}
	objects.clear();
}
function render() {
	context.clearRect(0, 0, 1920, 1280);
	for (const object of objects.values()) {
		object.draw();
	}
}
function getMousePosition(event) {
	const bounds = canvas.getBoundingClientRect();
	mouse.x = (event.clientX - bounds.left) * 1920 / (bounds.right - bounds.left);
	mouse.y = (event.clientY - bounds.top) * 1280 / (bounds.bottom - bounds.top);
}
function wrapClickEvent(callback, condition = (() => true)) {
	// TODO: Figure out a way to use {once: true}
	function fullCallback(e) {
		if (condition(e)) {
			callback();
			canvas.removeEventListener("click", fullCallback);
		}
	};
	canvas.addEventListener("click", fullCallback);
	return fullCallback;
}
canvas.addEventListener("click", getMousePosition);
// Classes
class Drawable {
	constructor (draw) {
		this.draw = draw;
		draw();
	}
}
class Button extends Drawable {
	constructor (hitbox, draw, callback, ignorePause = false) {
		super(draw);
		this.callback = callback;
		this.hitbox = hitbox;
		this.fullCallback = wrapClickEvent(callback, () => context.isPointInPath(hitbox, mouse.x, mouse.y) && (!paused || ignorePause));
	}
}
class MuteButton extends Button {
	constructor () {
		const [X, Y, DX, DY] = [1920 - 96, 1280 - 96, 96, 96];
		const name = muted ? "unmute" : "mute";
		const hitbox = new Path2D();
		hitbox.rect(X, Y, DX, DY);
		hitbox.closePath();
		function draw() {
			context.drawImage(images[muted ? "soundOff" : "soundOn"], X, Y, DX, DY);
		}
		function callback() {
			muted = !muted;
			console.log(muted ? "Muted" : "Unmuted");
			for (const sound of Object.values(sounds)) {
				sound.muted = muted;
			}
			objects.delete(name);
			// Doesn't use name because muted has been toggled
			objects.set(muted ? "unmute" : "mute", new MuteButton());
			render();
		}
		super(hitbox, draw, callback);
	}
}
class TextButton extends Button {
	constructor (x, y, text, callback, width, ignorePause = false) {
		const buttonWidth = width ? width - 160 : Math.ceil(context.measureText(text).width / 32) * 32;
		const hitbox = new Path2D();
		hitbox.rect(x - buttonWidth / 2 - 64, y, buttonWidth + 128, 128);
		hitbox.rect(x - buttonWidth / 2 - 80, y + 16, buttonWidth + 160, 96);
		hitbox.closePath();
		function draw() {
			context.fontSize = 8;
			context.drawImage(images.buttonStart, x - buttonWidth / 2 - 80, y, 80, 128);
			context.drawImage(images.buttonMiddle, x - buttonWidth / 2, y, buttonWidth, 128);
			context.drawImage(images.buttonEnd, x + buttonWidth / 2, y, 80, 128);
			context.textAlign = "center";
			context.fillStyle = "black";
			context.fillText(text, x, y + 92);
		}
		super(hitbox, draw, callback, ignorePause);
	}
}
// Loading assets
async function loadResources() {
	const imageNames = ["background", "buttonStart", "buttonMiddle", "buttonEnd", "soundOn", "soundOff"];
	const soundNames = ["mainTheme"];
	const promises = [];
	const initialize = function (cache, id, path, type, eventType) {
		cache[id] = document.createElement(type);
		cache[id].src = path;
		promises.push(new Promise(resolve => {
			cache[id].addEventListener(eventType, resolve, {once: true});
		}));
	};
	for (const name of imageNames) {
		initialize(images, name, `images/${name}.png`, "img", "load");
	}
	for (const name of soundNames) {
		initialize(sounds, name, `sounds/${name}.mp3`, "audio", "canplaythrough");
	}
	return Promise.all(promises);
}
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
			name: "start",
			from: "menu",
			to: "main"
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
			context.textAlign = "center";
			context.fontSize = 16;
			context.fillStyle = "white";
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
			context.fontSize = 8;
			context.fillStyle = "white";
			context.fillText("Loading finished.", 960, 400);
			context.fillText("CLICK ANYWHERE", 960, 800);
			context.fillText("TO CONTINUE", 960, 960);
			wrapClickEvent(stateMachine.toMenu);
		},
		onMenu() {
			clear();
			sounds.mainTheme.play();
			objects.set("start", new TextButton(960, 720, "Start", stateMachine.start, 576));
			objects.set("credits", new TextButton(960, 912, "Credits", stateMachine.toCredits, 576));
			objects.set("background", new Drawable(() => context.drawImage(images.background, 0, 0, 1920, 1280)));
			objects.set(muted ? "unmute" : "mute", new MuteButton());
		},
		onCredits() {
			clear();
			objects.set("return", new TextButton(960, 912, "Return", stateMachine.toMenu, 576));
			objects.set("background", new Drawable(() => context.drawImage(images.background, 0, 0, 1920, 1280)));
			objects.set(muted ? "unmute" : "mute", new MuteButton());
		},
		onMain() {
			clear();
			newGame();
			window.addEventListener("keydown", onKeyDown);
			window.addEventListener("keyup", onKeyUp);
			objects.set("background", new Drawable(() => context.drawImage(images.background, 0, 0, 1920, 1280)));
			objects.set(muted ? "unmute" : "mute", new MuteButton());
			objects.set("tetris", new Drawable(() => tetrisRender(context)));
			requestAnimationFrame(loop);
		},
		onGameOver(_, score) {
			window.removeEventListener("keydown", onKeyDown);
			window.removeEventListener("keyup", onKeyUp);
			paused = true;
			for (const sound of Object.values(sounds).filter(sound => !sound.paused)) {
				sound.pause();
			}
			objects.set("endScreen", new Drawable(() => {
				context.fillStyle = "rgba(0, 0, 0, 0.5)";
				context.fillRect(0, 0, 1920, 1280);
				context.fontSize = 16;
				context.textAlign = "center";
				context.fillStyle = "white";
				context.fillText("GAME OVER", 960, 400);
				context.fontSize = 8;
				context.fillText(`Score: ${score}`, 960, 540);
				context.fillText(`High Score: ${highScore}`, 960, 640);
			}));
			objects.set("menu", new TextButton(672, 880, "Menu", stateMachine.toMenu, 480, true));
			objects.set("retry", new TextButton(1248, 880, "Retry", stateMachine.retry, 480, true));
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
function loop() {
	if (!stateMachine.is("main")) {
		return;
	}
	// Handling is done in tetris.js
	// Update game state
	const [changed, gameOver, score] = update();
	if (gameOver) {
		highScore = Math.max(score, highScore);
		localStorage.setItem("wooootrisHighScore", highScore);
		stateMachine.lose(score);
	}
	if (changed) { // If board has updated
		render();
	}
	requestAnimationFrame(loop);
}