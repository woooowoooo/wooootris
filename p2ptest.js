import "https://unpkg.com/peerjs@1.4.7/dist/peerjs.min.js";
import {canvas} from "./index.js";
let Peer = window.Peer; // Terrible workaround for importing PeerJS
export let peer = new Peer(); // Change
peer.on("open", () => {
	console.log(`My peer ID is ${peer.id}`);
});
peer.on("connection", channel => {
	channel.on("data", data => {
		console.log(data);
		window.alert(data);
	});
});
export function connect(peerId) { // TODO: USE CONNECT IN GAME.JS
	let channel = peer.connect(peerId);
	channel.on("open", () => {
		console.log(`Connected to ${peerId}`);
		canvas.addEventListener("click", () => channel.send("Hi"));
	});
}
// BIG FLAW IN PLAN: NO BROWSER INTEROP