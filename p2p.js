import "https://unpkg.com/peerjs@1.4.7/dist/peerjs.min.js";
import StateMachine from "./state-machine/module.js";
import {render, settings, stateMachines} from "./index.js";
const Peer = window.Peer; // Terrible workaround for importing PeerJS
const peer = new Peer("wooootris-" + settings.id);
peer.on("open", () => {
	console.log(`My PeerJS ID is ${peer.id}`);
});
peer.on("error", e => {
	console.error(e);
	stateMachine.error();
});
export function connect(peerId) {
	const channel = peer.connect(peerId);
	console.log(`Connecting to ${peerId}…`);
	stateMachine.request();
	channel.on("open", () => {
		console.log(`Can send messages to to ${peerId}`);
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
		name: "disconnect",
		from: ["error", "connecting", "received", "connected"],
		to: "disconnected"
	}, {
		name: "error",
		from: ["connecting", "received", "connected"],
		to: "error"
	}, {
		name: "request",
		from: ["disconnected", "error"],
		to: "connecting"
	}, {
		name: "receiveConnection",
		from: ["disconnected", "error"],
		to: "received"
	}, {
		name: "success",
		from: "connecting",
		to: "connected"
	}],
	methods: {
		onTransition(lifecycle) {
			console.log(`Connection transition: ${lifecycle.transition}\tNew State: ${lifecycle.to}`);
		},
		onAfterTransition() {
			render();
		},
		onReceiveConnection(_, receivedChannel) {
			console.log(`Connection received from ${receivedChannel.peer}.`);
			window.dispatchEvent(new CustomEvent("wooootris-connect", {detail: receivedChannel.peer}));
			// Establish the other connection
			const channel = peer.connect(receivedChannel.peer);
			console.log(`Connecting2 to ${receivedChannel.peer}…`);
			channel.on("data", data => {
				console.log(data);
				window.alert(data);
			});
			channel.on("open", () => {
				console.log(`Can send messages back to ${receivedChannel.peer}`);
				// stateMachine.success();
				channel.send("Hello there idiot");
			});
		}
	}
});
peer.on("connection", e => {
	if (stateMachine.state === "connecting") {
		stateMachine.success();
	} else {
		stateMachine.receiveConnection(e);
	}
});
stateMachines.connection = stateMachine;