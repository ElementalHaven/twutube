var player = null;
function initPage() {
    var pageInfo = getPageType();
    document.body.classList.add(pageInfo[0] + "-page");
    // done after setting page class so that there can be separate default themes
    applyTheming();
    switch (pageInfo[0]) {
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
function getPageType() {
    var path = document.location.pathname;
    var result = path.match(/([a-zA-Z0-9_]{4,25})\/videos\/?$/i);
    if (result)
        return ["videos", result[1]];
    result = path.match(/\/videos\/(\d+)\/?$/);
    if (result)
        return ["player", result[1]];
    return ["error", path];
}
function getTheme() {
    // TODO get theme from local storage
    var result = window.matchMedia("(prefers-color-scheme: dark)");
    if (result.matches)
        return "dark";
    result = window.matchMedia("(prefers-color-scheme: light)");
    if (result.matches)
        return "light";
    switch (document.body.className) {
        case "player-page":
            return "dark";
        default:
            return "light";
    }
}
function applyTheming() {
    var theme = getTheme();
    document.body.classList.add("theme-" + theme);
}
function showVideosPage(user) {
    document.body.innerText = user + "'s videos here";
}
function showPlayerPage(videoId) {
    player = document.createElement("div");
    player.className = "player-area";
    player.innerText = "Embed of video " + videoId + " here";
    document.body.append(player);
    var chat = document.createElement("div");
    chat.className = "chat-area";
    chat.innerText = "Chat goes here";
    document.body.append(chat);
}
//# sourceMappingURL=script.js.map