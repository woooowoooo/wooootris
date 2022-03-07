import StateMachine from "./state-machine/module.js";
import {newGame, onKeyDown, onKeyUp, update, render as tetrisRender} from "./tetris.js";
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
const objects = new Map();
const defaultSettings = {
	muted: false,
	volume: 100,
	grid: false,
	arr: 2,
	das: 10
};
const settings = new Proxy(JSON.parse(localStorage.getItem("wooootrisSettings")) ?? defaultSettings, {
	get: function (target, property) {
		return Reflect.get(...arguments) ?? defaultSettings[property];
	},
	set: function (target, property, value) {
		console.log(`${property} has been set to ${value}`);
		const valid = Reflect.set(...arguments);
		localStorage.setItem("wooootrisSettings", JSON.stringify(target));
		return valid;
	}
});
let highScore = localStorage.getItem("wooootrisHighScore") ?? 0;
// Helper functions
Object.defineProperty(context, "fontSize", {
	set: size => {
		context.font = `${size * 1024 / 100}px "Commodore 64", sans-serif`;
	}
});
function clear() {
	context.clearRect(0, 0, 1920, 1280);
	for (const object of Array.from(objects.values()).filter(object => object.clear != null)) {
		object.clear();
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
function wrapClickEvent(callback, condition = () => true) {
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
	clear() {
		canvas.removeEventListener("click", this.fullCallback);
	}
}
class MuteButton extends Button {
	constructor () {
		const [X, Y, DX, DY] = [1920 - 96, 1280 - 96, 96, 96];
		const hitbox = new Path2D();
		hitbox.rect(X, Y, DX, DY);
		hitbox.closePath();
		function draw() {
			context.drawImage(images[settings.muted ? "soundOff" : "soundOn"], X, Y, DX, DY);
		}
		function callback() {
			settings.muted = !settings.muted;
			console.log(settings.muted ? "Muted" : "Unmuted");
			for (const sound of Object.values(sounds)) {
				sound.muted = settings.muted;
			}
			objects.set("mute", new MuteButton());
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
class TextToggle extends TextButton {
	constructor (x, y, settingName) {
		function callback() {
			settings[settingName] = !settings[settingName];
			objects.set(settingName, new TextToggle(x, y, settingName));
			render();
		}
		super(x, y, settings[settingName], callback, 480);
	}
}
class Slider extends Drawable {
	constructor (x, y, width, settingName, start, end, step = 1, intValues = true, callback) {
		function draw() {
			context.fillStyle = "hsl(30, 5%, 80%)";
			context.fillRect(x - width / 2, y - 4, width, 8);
			const divisions = (end - start) / step;
			for (let i = 0; i <= divisions; i++) {
				context.fillRect(x - width / 2 + i * width / divisions - 8, y - 16, 16, 32);
			}
			context.fillStyle = "white";
			const position = (settings[settingName] - start) / (end - start) * width + x - width / 2;
			context.fillRect(position - 20, y - 32, 40, 64);
			context.fontSize = 4;
			context.textAlign = "right";
			context.fillText(start, x - width / 2 - 40, y + 16);
			context.textAlign = "left";
			context.fillText(end, x + width / 2 + 40, y + 16);
		}
		super(draw);
		// Add sliding
		let isSliding = false;
		const hitbox = new Path2D();
		hitbox.rect(x - width / 2 - 20, y - 32, width + 40, 64);
		hitbox.closePath();
		this.onMouseDown = e => {
			getMousePosition(e);
			if (context.isPointInPath(hitbox, mouse.x, mouse.y)) {
				isSliding = true;
				this.update(e);
			}
		};
		this.update = e => {
			getMousePosition(e);
			if (isSliding) {
				let value = (mouse.x - (x - width / 2)) / width * (end - start) + start;
				let constrainedValue = Math.max(start, Math.min(end, value));
				settings[settingName] = intValues ? Math.round(constrainedValue) : constrainedValue;
				if (callback != null) {
					callback();
				}
				render();
			}
		};
		this.onMouseUp = e => {
			isSliding = false;
			this.update(e);
		};
		canvas.addEventListener("mousedown", this.onMouseDown);
		canvas.addEventListener("mousemove", this.update);
		canvas.addEventListener("mouseup", this.onMouseUp);
	}
	clear() {
		canvas.removeEventListener("mousedown", this.onMouseDown);
		canvas.removeEventListener("mousemove", this.update);
		canvas.removeEventListener("mouseup", this.onMouseUp);
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
		sounds[name].muted = settings.muted;
		sounds[name].volume = settings.volume / 100;
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
			name: "toSettings",
			from: "menu",
			to: "settings"
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
				context.fillText("wooootris", 960, 420);
			}));
			objects.set("start", new TextButton(960, 640, "Start", stateMachine.start, 640));
			objects.set("settings", new TextButton(960, 800, "Settings", stateMachine.toSettings, 640));
			objects.set("credits", new TextButton(960, 960, "Credits", stateMachine.toCredits, 640));
			objects.set("mute", new MuteButton());
		},
		onSettings() {
			clear();
			objects.set("background", new Drawable(() => context.drawImage(images.background, 0, 0, 1920, 1280)));
			objects.set("text", new Drawable(() => {
				context.fillStyle = "white";
				context.textAlign = "right";
				context.fillText("Grid:", 600, 200 + 92);
				context.fillText("ARR:", 600, 450 + 28);
				context.fillText("DAS:", 600, 600 + 28);
				context.fillText("Volume:", 600, 750 + 28);
			}));
			objects.set("grid", new TextToggle(1200, 200, "grid"));
			objects.set("arr", new Slider(1200, 450, 960, "arr", 0, 5));
			objects.set("das", new Slider(1200, 600, 960, "das", 0, 20));
			objects.set("volume", new Slider(1200, 750, 960, "volume", 0, 100, 10, false, () => {
				for (const sound of Object.values(sounds)) {
					sound.volume = settings.volume / 100;
				}
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
		onMain() {
			clear();
			newGame(highScore, settings);
			window.addEventListener("keydown", onKeyDown);
			window.addEventListener("keyup", onKeyUp);
			objects.set("background", new Drawable(() => context.drawImage(images.background, 0, 0, 1920, 1280)));
			objects.set("mute", new MuteButton());
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
				context.fillStyle = "white";
				context.fontSize = 16;
				context.textAlign = "center";
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