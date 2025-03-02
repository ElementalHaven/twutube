let player: HTMLElement = null;

function initPage() {
	const pageInfo = getPageType();
	document.body.classList.add(pageInfo[0] + "-page");

	// done after setting page class so that there can be separate default themes
	applyTheming();

	switch(pageInfo[0]) {
		case "player":
			showPlayerPage(pageInfo[1]);
			break;
		case "videos":
			showVideosPage(pageInfo[1]);
			break;
		case "error":
			document.body.innerText = "You're on a 404 page as a result of trying to access " + pageInfo[1];
			break;
	}
}

function getPageType(): [string, string] {
	let path = document.location.pathname;

	let result = path.match(/([a-zA-Z0-9_]{4,25})\/videos\/?$/i);
	if(result) return ["videos", result[1]];

	result = path.match(/\/videos\/(\d+)\/?$/);
	if(result) return ["player", result[1]];

	return ["error", path];
}

function getTheme() {
	// TODO get theme from local storage

	let result = window.matchMedia("(prefers-color-scheme: dark)");
	if(result.matches) return "dark";

	result = window.matchMedia("(prefers-color-scheme: light)");
	if(result.matches) return "light";

	switch(document.body.className) {
		case "player-page":
			return "dark";
		default:
			return "light";
	}
}

function applyTheming() {
	const theme = getTheme();
	document.body.classList.add("theme-" + theme);
}

function showVideosPage(user: string) {
	document.body.innerText = user + "'s videos here";
}

function showPlayerPage(videoId: string) {
	player = document.createElement("div");
	player.className = "player-area";
	player.innerText = "Embed of video " + videoId + " here";
	document.body.append(player);
	let chat = document.createElement("div");
	chat.className = "chat-area";
	chat.innerText = "Chat goes here";
	document.body.append(chat);
}