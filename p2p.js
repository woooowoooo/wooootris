import "https://unpkg.com/peerjs@1.4.7/dist/peerjs.min.js";
import StateMachine from "./state-machine/module.js";
import {render, settings, stateMachines} from "./index.js";
const Peer = window.Peer; // Terrible workaround for importing PeerJS
const peer = new Peer("wooootris-" + settings.id);
const stateMachine = new StateMachine({
	init: "disconnected",
	transitions: [{
		name: "disconnect",
		from: ["disconnected", "error", "connecting", "received", "connected", "inGame"],
		to: "disconnected"
	}, {
		name: "error",
		from: ["disconnected", "error", "connecting", "received", "connected", "inGame"],
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
		onDisconnect() {
			console.log("Goodbye");
			// TODO
		},
		onError(_, error) {
			console.error(error);
			// TODO
		},
		onRequest(_, peerId) {
			const channel = peer.connect(peerId);
			console.log(`Connecting to ${peerId}…`);
			channel.on("open", () => {
				console.log(`Can send messages to to ${peerId}`);
				channel.send("Hi");
			});
		},
		onReceiveConnection(_, receivedChannel) {
			console.log(`Connection received from ${receivedChannel.peer}.`);
			window.dispatchEvent(new CustomEvent("wooootris-connect", {detail: receivedChannel.peer}));
			receivedChannel.on("data", data => {
				console.log(data);
				window.alert(data);
			});
			// Establish the other connection
			const channel = peer.connect(receivedChannel.peer);
			console.log(`Connecting2 to ${receivedChannel.peer}…`);
			channel.on("open", () => {
				console.log(`Can send messages back to ${receivedChannel.peer}`);
				// stateMachine.success();
				channel.send("Hello there idiot");
			});
		},
		onSuccess(_, receivedChannel) {
			receivedChannel.on("data", data => {
				console.log(data);
				window.alert(data);
			});
		}
	}
});
// Handle events
peer.on("open", () => console.log(`My PeerJS ID is ${peer.id}`));
peer.on("connection", channel => {
	if (stateMachine.state === "connecting") {
		stateMachine.success(channel);
	} else {
		stateMachine.receiveConnection(channel);
	}
});
peer.on("error", stateMachine.error);
// Exports
stateMachines.connection = stateMachine;
export const connect = stateMachine.request;
export const disconnect = stateMachine.disconnect;