import "https://unpkg.com/peerjs@1.4.7/dist/peerjs.min.js";
import {canvas} from "./index.js";
let Peer = window.Peer; // Terrible workaround for importing PeerJS
export let peer = new Peer("wooootris-" + Math.floor(Math.random() * 1_000_000).toString().padStart("0", 6));
peer.on("open", () => {
	console.log(`My PeerJS ID is ${peer.id}`);
});
peer.on("connection", channel => {
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
	channel.on("open", () => {
		console.log(`Connected to ${peerId}`);
		canvas.addEventListener("click", () => channel.send("Hi"));
	});
}