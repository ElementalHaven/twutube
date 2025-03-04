import * as React from './Scripts/react/react.js';
let player = null;
let chat = null;
let streamData = null;
// change to "/twutube/" once on github
const basePath = "/";
const pageRenderers = {
    "player": showPlayerPage,
    "videos": showVideosPage,
    "error": showErrorPage,
    "userlist": showUsersPage
};
class MessageFragment {
    text;
    emote;
}
class ChatMessage {
    author;
    color;
    // offset in seconds
    offset;
    badges;
    fragments;
    system;
}
class Video {
    // game ids
    game;
    title;
    // MMM d, YYYY
    created;
    // [h:]m:ss
    length;
}
class Stream extends Video {
    description;
    ytid;
    chat;
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
class UserSummary {
    name;
    videos;
    playlists;
}
function initPage() {
    const pageInfo = getPageType();
    document.body.className = pageInfo[0] + "-page";
    // apply theming
    // done after setting page class so that there can be separate default themes
    const theme = getTheme(pageInfo[0]);
    document.body.classList.add("theme-" + theme);
    useAltIcon(getBoolStorage("alt_icon"));
    pageRenderers[pageInfo[0]](pageInfo[1]);
}
function nt(tagName, parent, cls) {
    let elem = document.createElement(tagName);
    if (cls)
        elem.className = cls;
    parent.append(elem);
    return elem;
}
function getBoolStorage(name) {
    let val = window.localStorage.getItem(name);
    return val === null ? null : val === "1";
}
function setBoolStorage(name, val) {
    window.localStorage.setItem(name, val ? '1' : '0');
}
function useAltIcon(use) {
    let links = document.querySelectorAll('link[rel="shortcut icon"]');
    let pair = ["c.", "b."];
    if (use)
        pair = pair.reverse();
    for (let link of links) {
        link.href = link.href.replace(pair[0], pair[1]);
    }
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
    let dark = getBoolStorage(page + "_dark");
    if (dark !== null)
        return dark ? "dark" : "light";
    let result = window.matchMedia("(prefers-color-scheme: dark)");
    if (result.matches)
        return "dark";
    result = window.matchMedia("(prefers-color-scheme: light)");
    if (result.matches)
        return "light";
    return page == "player" ? "dark" : "light";
}
async function showUsersPage() {
    const root = document.body;
    root.innerText = "Loading...";
    const response = await fetch(basePath + "users.json");
    if (!response.ok) {
        showError("Failed to fetch list of users");
        return;
    }
    try {
        let users = await response.json();
        root.innerText = "";
        for (let user of users) {
            manualUserTile(user, root);
        }
    }
    catch {
        showError(`Failed to parse data for user list`);
    }
}
function showError(msg) {
    document.title = "Twutube Error";
    document.body.innerText = msg;
}
function showErrorPage(requested) {
    showError("You're on a 404 page as a result of trying to access " + requested);
}
async function showVideosPage(user) {
    const root = document.body;
    root.innerText = "Loading...";
    const id = user.toLowerCase();
    const response = await fetch(`${basePath}users/${id}.json`);
    if (!response.ok) {
        showError(`User ${user} not found`);
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
        showError(`Failed to parse data for ${user}'s videos and collections`);
    }
}
function addThemeButton() {
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
        React.createElement("div", { class: "sidebar", "data-tab": "Chat" },
            React.createElement("div", { class: "chat-header" },
                React.createElement("span", null, "Chat on Videos"),
                React.createElement("input", { type: "radio", name: "tab", title: "Chat" }),
                React.createElement("input", { type: "radio", name: "tab", title: "Info" }),
                React.createElement("input", { type: "radio", name: "tab", title: "Settings" })),
            React.createElement("div", { class: "chat-area" }),
            React.createElement("div", null, "Stream info here(title, description, game, boxart, length, date)"),
            React.createElement("div", null, "Settings here"))));
}
// even if I can't use react atm, it at least lets me visualize the resulting code
// and maybe one day in the future I'll actually get it sorted -Liz (3/3/25)
function videoTile(video, id, games) {
    return (React.createElement("div", { class: "video-tile" },
        React.createElement("div", { class: "thumbnail", style: { background: `url("${basePath}videos/${id}.jpg")` } },
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
    thumb.style.background = `url("${basePath}videos/${id}.jpg")`;
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
function manualUserTile(user, parent) {
    const id = user.name.toLowerCase();
    let tile = nt("a", parent, "user-tile");
    tile.href = basePath + id + "/videos";
    let pic = nt("img", tile, "profile-pic");
    pic.src = `${basePath}users/${id}.jpeg`;
    nt("h1", tile).innerText = user.name;
    nt("div", tile).innerText = `${user.videos} videos, ${user.playlists} collections`;
}
function settingsCheckbox(text, parent, storageName, onChange, defVal = false) {
    let wrapper = nt("div", parent, "option");
    let label = nt("label", wrapper);
    label.innerText = text;
    let cbox = nt("input", wrapper);
    cbox.type = "checkbox";
    cbox.checked = getBoolStorage(storageName) ?? defVal;
    cbox.addEventListener("change", _ => {
        setBoolStorage(storageName, cbox.checked);
        onChange(cbox.checked);
    });
    let id = "setting_" + storageName;
    cbox.id = id;
    label.htmlFor = id;
    onChange(cbox.checked);
}
function chatViewSetting(text, parent, name, invert = false, defVal = true) {
    name = (invert ? "hide_" : "show_") + name;
    settingsCheckbox(text, parent, name, show => {
        chat.classList.toggle(name, show);
    }, defVal);
}
function settingsGroup(text, parent) {
    let tag = nt("details", parent);
    tag.open = true;
    nt("summary", tag).innerText = text;
    return tag;
}
function manualSettings(parent) {
    let pane = nt("div", parent, "settings");
    let general = settingsGroup("General", pane);
    settingsCheckbox("Dark Theme", general, "player_dark", (checked) => {
        let cls = document.body.classList;
        cls.toggle("theme-dark", checked);
        cls.toggle("theme-light", !checked);
    });
    chatViewSetting("Disable Animations", general, "anims", true, false);
    settingsCheckbox("Chat on Left", general, "chat_on_left", onLeft => {
        document.body.classList.toggle("chat-on-left", onLeft);
    });
    settingsCheckbox("Use Alternate Favicon", general, "alt_icon", useAltIcon);
    // "Show Message Timestamps": ["Always", "Never", "On Hover"]
    let emotes = settingsGroup("Emotes", pane);
    chatViewSetting("Show Twitch Emotes", emotes, "ttv_emotes");
    chatViewSetting("Show FFZ Emotes", emotes, "ffz_emotes");
    chatViewSetting("Show 7tv Emotes", emotes, "7tv_emotes");
    // ability to manually block specific emotes
    let badges = settingsGroup("Badges", pane);
    // checkboxes for bit badges, sub badges, twitchcon, event badges, prime/turbo
    // "Hide Uncustomized Sub/Bit Badges"
    // "Use Alternate Default Badges"
    // "Use sub badge in place of founder badge"
    // ability to manually add badges to block
}
async function showPlayerPage(videoId) {
    const root = document.body;
    root.innerText = "Loading...";
    const response = await fetch(`${basePath}videos/${videoId}.json`);
    if (!response.ok) {
        showError("Failed to fetch video metadata");
        return;
    }
    try {
        streamData = await response.json();
        root.innerText = "";
        document.title = `${streamData.title} - Twutube`;
    }
    catch {
        showError(`Failed to parse video metadata`);
        return;
    }
    //let page = playerPage(videoId);
    //document.body.append(page);
    player = nt("div", document.body, "player-area");
    player.innerText = "Loading...";
    let sidebar = nt("div", document.body, "sidebar");
    sidebar.dataset["tab"] = "Chat";
    let header = nt("div", sidebar, "chat-header");
    let label = nt("span", header);
    label.innerText = "Chat";
    const types = ["Chat", "Info", "Settings"];
    for (let type of types) {
        let radio = nt("input", header);
        radio.type = "radio";
        radio.name = "tab";
        radio.value = type.toLowerCase();
        radio.title = type;
        radio.addEventListener("change", ev => {
            sidebar.dataset["tab"] = type;
            label.innerText = type;
        });
        if (type == "Chat")
            radio.checked = true;
    }
    chat = nt("div", sidebar, "chat-area");
    chat.innerText = "Chat goes here";
    manualSettings(sidebar);
    if (streamData.ytid) {
    }
    else {
        player.innerText = "No Youtube video associated with this Twitch stream";
    }
}
window["initPage"] = initPage;
//# sourceMappingURL=script.js.map