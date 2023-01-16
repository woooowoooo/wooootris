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
let mode = "";
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