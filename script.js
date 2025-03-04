import * as React from './Scripts/react/react.js';
let player = null;
// change to "/twutube/" once on github
const basePath = "/";
const pageRenderers = {
    "player": showPlayerPage,
    "videos": showVideosPage,
    "error": showErrorPage,
    "userlist": showUsersPage
};
class Video {
    // game ids
    game;
    title;
    // MMM d, YYYY
    created;
    // [h:]m:ss
    length;
}
class Collection {
    name;
    // ids of all videos pre-sorted
    // playlists oldest to newest; all videos newest to oldest
    videos;
}
class SerializedVideos {
    user;
    videos;
    collections;
    // map of ids to names
    games;
}
function initPage() {
    const pageInfo = getPageType();
    document.body.className = pageInfo[0] + "-page";
    // apply theming
    // done after setting page class so that there can be separate default themes
    const theme = getTheme(pageInfo[0]);
    document.body.classList.add("theme-" + theme);
    pageRenderers[pageInfo[0]](pageInfo[1]);
}
function nt(tagName, parent, cls) {
    let elem = document.createElement(tagName);
    if (cls)
        elem.className = cls;
    parent.append(elem);
    return elem;
}
function getPageType() {
    let path = document.location.pathname;
    path = path.substring(basePath.length);
    if (path.length == 0) {
        // TODO have as the videos page instead if only 1 user
        return ["userlist", null];
    }
    let result = path.match(/^([a-zA-Z0-9_]{4,25})\/videos\/?$/i);
    if (result)
        return ["videos", result[1]];
    result = path.match(/^videos\/(\d+)\/?$/);
    if (result)
        return ["player", result[1]];
    return ["error", path];
}
function getTheme(page) {
    // TODO get theme from local storage based on page
    let result = window.matchMedia("(prefers-color-scheme: dark)");
    if (result.matches)
        return "dark";
    result = window.matchMedia("(prefers-color-scheme: light)");
    if (result.matches)
        return "light";
    return page == "player" ? "dark" : "light";
}
function showUsersPage() {
    document.body.innerText = "List of users with profile pictures, video counts, and collection counts goes here";
}
function showErrorPage(requested) {
    document.body.innerText = "You're on a 404 page as a result of trying to access " + requested;
}
async function showVideosPage(user) {
    const root = document.body;
    root.innerText = "Loading...";
    const id = user.toLowerCase();
    const response = await fetch(`${basePath}users/${id}.json`);
    if (!response.ok) {
        root.innerText = `User ${user} not found`;
        return;
    }
    try {
        let data = await response.json();
        document.title = data.user + "'s Videos - Twutube";
        root.innerText = "";
        let pic = nt("img", root, "profile-pic");
        pic.src = `${basePath}users/${id}.jpeg`;
        nt("h1", root).innerText = data.user + "'s Videos";
        for (let collection of data.collections) {
            let tag = nt("div", root, "collection");
            const count = collection.videos.length;
            // no need for special pluralization logic.
            // if there was only 1 video it wouldn't be a collection
            nt("h1", tag).innerText = `${collection.name} (${count} videos)`;
            let container = nt("div", tag);
            for (let vidId of collection.videos) {
                const video = data.videos[vidId];
                manualVideoTile(video, vidId, data.games, container);
            }
        }
    }
    catch {
        document.body.innerText = `Failed to parse data for ${user}'s videos and collections`;
    }
}
//* This felt like a great opportunity to learn & use react
// but the mountain of issues I'm experiencing makes me want to curl up in a ball
// everything out there expects a specific setup
// and assumes you're already well aquainted with that stuff -Liz (3/2/25)
// I feel like I'm so close. It properly gives me a .js file and resolves the react import,
// but then it says React.createElement is not a function
function playerPage(videoId) {
    return (React.createElement(React.Fragment, null,
        React.createElement("div", { class: "player-area" },
            "Embed of video ",
            videoId,
            " here"),
        React.createElement("div", { class: "chat-area" }, "Chat goes here")));
}
// even if I can't use react atm, it at least lets me visualize the resulting code
// and maybe one day in the future I'll actually get it sorted -Liz (3/3/25)
function videoTile(video, id, games) {
    return (React.createElement("div", { class: "video-tile" },
        React.createElement("div", { class: "thumbnail", style: { background: `url("${basePath}thumbs/${id}.jpg")` } },
            React.createElement("div", null, video.length),
            React.createElement("div", null, video.created)),
        React.createElement("div", { class: "boxart", style: { background: `url("${basePath}boxart/${video.game}.jpg")` } }),
        React.createElement("div", { class: "title", title: video.title }, "video.title"),
        React.createElement("div", null, games[video.game])));
}
//*/
function manualVideoTile(video, id, games, parent) {
    let tile = nt("a", parent, "video-tile");
    tile.href = `${basePath}videos/${id}`;
    let thumb = nt("div", tile, "thumbnail");
    thumb.style.background = `url("${basePath}thumbs/${id}.jpg")`;
    /* change these 2 to be below title? */
    nt("div", thumb).innerText = video.length;
    nt("div", thumb).innerText = video.created;
    if (video.game) {
        nt("div", tile, "boxart").style.background = `url("${basePath}boxart/${video.game}.jpg")`;
    }
    let title = nt("div", tile, "title");
    title.title = video.title;
    title.innerText = video.title;
    if (video.game)
        nt("div", tile).innerText = games[video.game];
}
function showPlayerPage(videoId) {
    //let page = playerPage(videoId);
    //document.body.append(page);
    player = nt("div", document.body, "player-area");
    player.innerText = "Embed of video " + videoId + " here";
    let chat = nt("div", document.body, "chat-area");
    chat.innerText = "Chat goes here";
}
window["initPage"] = initPage;
//# sourceMappingURL=script.js.map