import "https://unpkg.com/peerjs@1.4.7/dist/peerjs.min.js";
import StateMachine from "./state-machine/module.js";
import {render, settings, stateMachines} from "./index.js";
let Peer = window.Peer; // Terrible workaround for importing PeerJS
let peer = new Peer("wooootris-" + settings.id);
peer.on("open", () => {
	console.log(`My PeerJS ID is ${peer.id}`);
});
peer.on("connection", channel => {
	console.log(`Connected to ${channel.peer}.`);
	window.dispatchEvent(new CustomEvent("wooootris-connect", {detail: channel.peer}));
	channel.on("data", data => {
		console.log(data);
		window.alert(data);
	});
});
peer.on("error", e => {
	console.error(e);
	stateMachine.error();
});
export function connect(peerId) {
	let channel = peer.connect(peerId);
	console.log(`Connecting to ${peerId}…`);
	stateMachine.connect();
	channel.on("open", () => {
		console.log(`Connected to ${peerId}`);
		stateMachine.success();
		// channel.send("Hi");
	});
}
export function disconnect() {
	console.log("Goodbye");
	stateMachine.disconnect();
	// TODO
}
const stateMachine = new StateMachine({
	init: "disconnected",
	transitions: [{
		name: "connect",
		from: ["disconnected", "error"],
		to: "connecting"
	}, {
		name: "disconnect",
		from: "*",
		to: "disconnected"
	}, {
		name: "success",
		from: "connecting",
		to: "waiting"
	}, {
		name: "error",
		from: "*",
		to: "error"
	}],
	methods: {
		onTransition(lifecycle) {
			console.log(`Connection transition: ${lifecycle.transition}\tNew State: ${lifecycle.to}`);
		},
		onAfterTransition() {
			render();
		}
	}
});
stateMachines.connection = stateMachine;