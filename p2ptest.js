import "https://unpkg.com/peerjs@1.4.7/dist/peerjs.min.js";
import {canvas, settings} from "./index.js";
let Peer = window.Peer; // Terrible workaround for importing PeerJS
let peer = new Peer("wooootris-" + settings.id);
peer.on("open", () => {
	console.log(`My PeerJS ID is ${peer.id}`);
});
peer.on("connection", channel => {
	console.log(`Connecting to ${channel.peer}…`);
	channel.on("data", data => {
		console.log(data);
		window.alert(data);
	});
});
peer.on("error", e => {
	console.error(e);
});
export function connect(peerId) {
	let channel = peer.connect(peerId);
	console.log(`Connecting to ${peerId}…`);
	channel.on("open", () => {
		console.log(`Connected to ${peerId}`);
		canvas.addEventListener("click", () => channel.send("Hi"));
	});
}