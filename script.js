//import * as React from 'react';
import { formatTimestamp } from "./shared.js";
let player = null;
let chat = null;
let streamData = null;
let vidPageJson = null;
// active timer that will add the next chat message
let messageTimer = -1;
// index of the last message currently shown
let msgLast = -1;
let timeLast = -1;
let playAnimations = true;
let autoplay = false;
let msgCount = 0;
let atBottom = true;
const basePath = window.location.hostname.includes("github") ? "/twutube/" : "/";
// maximum number of chat messages to show at a time
// older messages will be removed from the DOM as newer ones appear
const MAX_MESSAGES = 200;
const pageRenderers = {
    "player": showPlayerPage,
    "videos": showVideosPage,
    "error": showErrorPage,
    "userlist": showUsersPage,
    "boxart": listBoxart
};
const ALL_THEMES = ["light", "dark"];
// results in Jan 1, 1970 or the like for en-US users, which is what I was using for strings
const DATE_FORMAT = Intl.DateTimeFormat(undefined, { month: "short", day: "numeric", year: "numeric" });
function initPage() {
    const [page, arg] = getPageType();
    document.body.className = page + "-page";
    // apply theming
    // done after setting page class so that there can be separate default themes
    const theme = getTheme(page);
    document.body.classList.add("theme-" + theme);
    useAltIcon(getBoolStorage("alt_icon"));
    pageRenderers[page](arg);
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
    if (path.length == 0)
        return ["userlist", null];
    let result = path.match(/^([a-zA-Z0-9_]{4,25})\/videos\/?$/i);
    if (result)
        return ["videos", result[1]];
    result = path.match(/^videos\/(\d+)\/?$/);
    if (result)
        return ["player", result[1]];
    if (path == "boxarttest.html")
        return ["boxart", null];
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
        if (users.length == 1) {
            showVideosPage(users[0].name);
            return;
        }
        root.innerText = "";
        addThemeButton("userlist");
        for (let user of users) {
            manualUserTile(user, root);
        }
    }
    catch {
        showError(`Failed to parse data for user list`);
    }
}
async function listBoxart() {
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
        addThemeButton("boxart");
        let allArt = [];
        for (let user of users) {
            // async issues may occur. duplicates are fine
            const name = user.name.toLowerCase();
            const path = `${basePath}users/${name}.json`;
            console.log(`Getting user page "${path}" to extract games list`);
            fetch(path).then(res => res.json()).then((data) => {
                let frag = document.createDocumentFragment();
                const games = Object.keys(data.games);
                console.log(games.length + " games for " + name);
                for (let game of games) {
                    if (!allArt.includes(game)) {
                        allArt.push(game);
                        let boxart = nt("img", frag, "boxart");
                        boxart.alt = game;
                        boxart.title = data.games[game];
                        boxart.src = `${basePath}boxart/${game}.jpg`;
                    }
                }
                console.log("Adding fragment with " + frag.childElementCount + " children");
                root.append(frag);
            });
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
function fillCollection(collection, container) {
    for (let vidId of collection.videos) {
        const video = vidPageJson.videos[vidId];
        manualVideoTile(video, vidId, container);
    }
}
async function showVideosPage(user) {
    const root = document.body;
    root.innerText = "Loading...";
    const id = user.toLowerCase();
    const response = await fetch(`${basePath}users/${id}.json`, { cache: "no-cache" });
    if (!response.ok) {
        showError(`User ${user} not found`);
        return;
    }
    try {
        vidPageJson = await response.json();
        document.title = vidPageJson.user + "'s Videos - Twutube";
        root.innerText = "";
        addThemeButton("videos");
        let pic = nt("img", root, "profile-pic");
        pic.src = `${basePath}users/${id}.jpeg`;
        nt("h1", root).innerText = vidPageJson.user + "'s Videos";
        if (vidPageJson.socials) {
            for (let platform in vidPageJson.socials) {
                let link = nt("a", root, "social-link");
                link.target = "_blank";
                link.referrerPolicy = "no-referrer";
                // TODO use appropriate image
                link.innerText = platform;
                link.href = vidPageJson.socials[platform];
            }
        }
        // I hate this so much. js is just shitting itself failing to iterate over it any normal way
        // I can do Map.prototype.forEach.call(); I can do new Map(Object.entries());
        // whatever I do it always says video is undefined -Liz (3/9/25)
        for (let k in vidPageJson.videos) {
            let video = vidPageJson.videos[k];
            video.created = new Date(video.created);
        }
        for (let collection of vidPageJson.collections) {
            let tag = nt("details", root, "collection");
            const open = collection.name == "All Videos";
            tag.open = open;
            const count = collection.videos.length;
            // no need for special pluralization logic.
            // if there was only 1 video it wouldn't be a collection
            nt("summary", tag).innerText = `${collection.name} (${count} videos)`;
            let container = nt("div", tag);
            if (open) {
                fillCollection(collection, container);
            }
            else {
                tag.addEventListener("toggle", _ => fillCollection(collection, container), { once: true });
            }
        }
    }
    catch (e) {
        console.log(e);
        showError(`Failed to parse data for ${user}'s videos and collections`);
    }
}
function addThemeButton(page) {
    let btn = nt("button", document.body, "btn-theme-toggle");
    btn.title = "Change Theme";
    btn.addEventListener("click", _ => {
        let classes = document.body.classList;
        for (let cls of classes) {
            if (cls.startsWith("theme-")) {
                let idx = ALL_THEMES.indexOf(cls.substring(6));
                let newTheme = ALL_THEMES[(idx + 1) % ALL_THEMES.length];
                setBoolStorage(page + "_dark", newTheme == "dark");
                classes.add("theme-" + newTheme);
                classes.remove(cls);
                return;
            }
        }
    });
}
/* This felt like a great opportunity to learn & use react
// but the mountain of issues I'm experiencing makes me want to curl up in a ball
// everything out there expects a specific setup
// and assumes you're already well aquainted with that stuff -Liz (3/2/25)
// I feel like I'm so close. It properly gives me a .js file and resolves the react import,
// but then it says React.createElement is not a function
function playerPage(videoId: string) {
    return (
        <>
            <div class="player-area">Embed of video {videoId} here</div>
            <div class="sidebar" data-tab="Chat">
                <div class="chat-header">
                    <span>Chat on Videos</span>
                    <input type="radio" name="tab" title="Chat" />
                    <input type="radio" name="tab" title="Info" />
                    <input type="radio" name="tab" title="Settings" />
                </div>
                <div class="chat-area">
                </div>
                <div>Stream info here(title, description, game, boxart, length, date)</div>
                <div>Settings here</div>
            </div>
        </>
    );
}

// even if I can't use react atm, it at least lets me visualize the resulting code
// and maybe one day in the future I'll actually get it sorted -Liz (3/3/25)
function videoTile(video: Video, id: string, games: Map<string, string>) {
    return (
        <div class="video-tile">
            <div class="thumbnail" style={{background: `url("${basePath}videos/${id}.jpg")`}}>
                <div>{video.length}</div>
                <div>{video.created}</div>
            </div>
            <div class="boxart" style={{background: `url("${basePath}boxart/${video.game}.jpg")`}}></div>
            <div class="title" title={video.title}>video.title</div>
            <div>{games[video.game]}</div>
        </div>
    );
}
//*/
function manualVideoTile(video, id, parent) {
    let tile = nt("a", parent, "video-tile");
    tile.href = `${basePath}videos/${id}`;
    let thumb = nt("div", tile, "thumbnail");
    let img = nt("img", thumb);
    img.loading = "lazy";
    img.src = `${basePath}videos/${id}.jpg`;
    /* change these 2 to be below title? */
    nt("div", thumb).innerText = formatTimestamp(video.length);
    let dateStr = video.created;
    // this has to stay like this for typescript validation reasons
    // even though it's guaranteed to always be a Date now
    // I don't feel like disabling typescript validation for this specific bit either -Liz (3/9/25)
    if (typeof dateStr != "string")
        dateStr = DATE_FORMAT.format(dateStr);
    nt("div", thumb).innerText = dateStr;
    /* I forgot this even existed. it seems to be visible only rarely and mess with the layout
    if(video.game) {
        nt("div", tile, "boxart").style.background = `url("${basePath}boxart/${video.game}.jpg")`;
    }
    */
    let title = nt("div", tile, "title");
    title.title = video.title;
    title.innerText = video.title;
    if (video.game)
        nt("div", tile).innerText = vidPageJson.games[video.game];
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
function settingsCombo(text, parent, storageName, onChange, options) {
    let wrapper = nt("div", parent, "option");
    let label = nt("label", wrapper);
    label.innerText = text;
    let cbox = nt("select", wrapper);
    for (let opt of options) {
        let tag = nt("option", cbox);
        let val = opt.toLowerCase();
        let idx = val.lastIndexOf(' ');
        tag.value = val.substring(idx + 1);
        tag.innerText = opt;
    }
    let existing = window.localStorage.getItem(storageName);
    if (existing)
        cbox.value = existing;
    cbox.addEventListener("change", _ => {
        window.localStorage.setItem(storageName, cbox.value);
        onChange(cbox.value);
    });
    let id = "setting_" + storageName;
    cbox.id = id;
    label.htmlFor = id;
    onChange(cbox.value);
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
    settingsCheckbox("Autoplay Videos", general, "autoplay", auto => autoplay = auto);
    settingsCheckbox("Disable Animations", general, "hide_anims", still => {
        playAnimations = !still;
        let imgs = document.querySelectorAll("img.animated");
        const ext = playAnimations ? "gif" : "png";
        for (let img of imgs) {
            let src = img.src;
            img.src = src.substring(0, src.length - 3) + ext;
        }
    });
    settingsCheckbox("Chat on Left", general, "chat_on_left", onLeft => {
        document.body.classList.toggle("chat-on-left", onLeft);
    });
    settingsCheckbox("Use Alternate Favicon", general, "alt_icon", useAltIcon);
    settingsCombo("Show Message Timestamps", general, "timestamps", val => {
        chat.dataset["timestamps"] = val;
    }, ["Always", "Never", "On Hover"]);
    let emotes = settingsGroup("Emotes", pane);
    chatViewSetting("Show Twitch Emotes", emotes, "ttv_emotes");
    chatViewSetting("Show FFZ Emotes", emotes, "ffz_emotes");
    chatViewSetting("Show BTTV Emotes", emotes, "bttv_emotes");
    chatViewSetting("Show 7TV Emotes", emotes, "7tv_emotes");
    // TODO ability to manually block specific emotes
    let badges = settingsGroup("Badges", pane);
    const opts = ["Never", "If Uncustomized", "Always"];
    settingsCombo("Hide Sub Badges", badges, "hide_subs", val => {
        chat.dataset["hide_subs"] = val;
    }, opts);
    settingsCombo("Hide Bit Badges", badges, "hide_bits", val => {
        chat.dataset["hide_bits"] = val;
    }, opts);
    chatViewSetting("Hide Prime/Turbo Badges", badges, "badges_prime", true, false);
    chatViewSetting("Hide Twitchcon Badges", badges, "badges_con", true, false);
    chatViewSetting("Hide Online Event Badges", badges, "badges_event", true, false);
    chatViewSetting("Hide Other Misc Badges", badges, "badges_misc", true, false);
    settingsCheckbox("Replace Founder with Sub Badge", badges, "replace_founder", rep => {
        chat.classList.toggle("no-founder-badges", rep);
    });
    settingsCheckbox("Use Alternate Default Badges", badges, "alt_badges", use => {
        chat.classList.toggle("alt-chat-badges", use);
        // TODO implement as multiple versions occupying a single image controlled with background properties
    });
    // TODO ability to manually add badges to block
}
async function showPlayerPage(videoId) {
    const root = document.body;
    root.innerText = "Loading...";
    const response = await fetch(`${basePath}videos/${videoId}.json`, { cache: "no-cache" });
    // content type check is because IIS is insisting on returning 200 with error page customized
    if (!response.ok || response.headers.get("content-type") == "text/html") {
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
    let playerArea = nt("div", document.body, "player-area");
    playerArea.innerText = "Loading...";
    let sidebar = nt("div", document.body, "sidebar");
    sidebar.dataset["tab"] = "Chat";
    let header = nt("div", sidebar, "chat-header");
    let label = nt("span", header);
    label.innerText = "Chat";
    const types = ["Chat", "Info", "Settings"];
    const bgPaths = ["chat", "game", "gear"];
    for (let i = 0; i < 3; ++i) {
        const type = types[i];
        let radio = nt("input", header);
        radio.style.backgroundImage = `url("${basePath}img/${bgPaths[i]}-ink.svg")`;
        radio.type = "radio";
        radio.name = "tab";
        radio.value = type.toLowerCase();
        radio.title = type;
        radio.addEventListener("change", _ => {
            sidebar.dataset["tab"] = type;
            label.innerText = type;
        });
        if (type == "Chat")
            radio.checked = true;
    }
    chat = nt("div", sidebar, "chat-area");
    // track and maintain chat being scrolled to bottom
    chat.addEventListener("scroll", _ => {
        atBottom = chat.scrollHeight - chat.clientHeight <= chat.scrollTop + 1;
    });
    window.addEventListener("resize", ev => { if (atBottom)
        scrollToBottom(); });
    let info = nt("div", sidebar, "info-pane");
    nt("div", info, "title").innerText = streamData.title;
    nt("div", info, "desc").innerText = streamData.description?.replace(/&#39;/g, "'") ?? "No Description Provided";
    nt("div", info).innerText = "Recorded: " + DATE_FORMAT.format(new Date(streamData.created));
    nt("div", info).innerText = "Duration: " + formatTimestamp(streamData.length);
    if (streamData.game) {
        nt("div", info).innerText = "Game: " + streamData.gameName;
        let boxart = nt("img", info, "boxart");
        boxart.loading = "lazy";
        boxart.src = `${basePath}boxart/${streamData.game}.jpg`;
    }
    manualSettings(sidebar);
    msgCount = streamData.chat.length;
    if (streamData.ytid) {
        // https://developers.google.com/youtube/iframe_api_reference
        nt("div", playerArea).id = "player";
        window["onYouTubeIframeAPIReady"] = initYoutube;
        nt("script", document.head).src = "https://www.youtube.com/iframe_api";
    }
    else {
        playerArea.innerText = "No Youtube video associated with this Twitch stream";
        if (msgCount) {
            advanceChatTo(streamData.chat[msgCount - 1].offset);
        }
    }
    if (msgCount == 0) {
        chat.classList.add("no-chat");
        chat.innerText = "No chat to display";
    }
}
function scrollToBottom() {
    chat.scrollTop = chat.scrollHeight - chat.clientHeight;
}
function addSingleMessage(msg) {
    // not currently supported
    if (msg.system)
        return;
    // not using nt to ensure line is complete first
    let line = document.createElement("div");
    line.classList.add("chat-line");
    let ts = nt("div", line, "timestamp");
    ts.innerText = formatTimestamp(msg.offset);
    ts.addEventListener("click", ev => player?.seekTo(msg.offset, true));
    let wrap = nt("div", line);
    let badgeList = nt("span", wrap);
    if (msg.badges) {
        for (let badge of msg.badges) {
            let b = nt("img", badgeList, "chat-badge");
            const idat = streamData.images[badge];
            b.title = idat.title;
            b.classList.add(...idat.classes);
            let ext = playAnimations && idat.classes.includes("animated") ? "gif" : "png";
            b.src = `${basePath}badges/${idat.path}.${ext}`;
        }
    }
    let user = nt("span", wrap, "author");
    user.innerText = msg.user;
    user.style.color = msg.color;
    let body = nt("div", wrap, "message");
    nt("span", body).innerText = ':';
    for (let frag of msg.fragments) {
        if (frag.emote !== undefined) {
            let box = nt("div", body);
            let e = nt("img", box, "emote");
            e.title = frag.text;
            let emote = streamData.images[frag.emote];
            e.classList.add(...emote.classes);
            let ext = playAnimations && emote.classes.includes("animated") ? "gif" : "png";
            e.src = `${basePath}emotes/${emote.path}.${ext}`;
            nt("span", box).innerText = frag.text;
            // images are treated as 0 height until loaded 
            // which causes the page to no longer be at the bottom once they load
            if (atBottom)
                e.addEventListener("load", scrollToBottom, { once: true });
        }
        else {
            nt("span", body, "fragment").innerText = frag.text;
        }
    }
    chat.append(line);
    while (chat.childElementCount > MAX_MESSAGES) {
        chat.firstElementChild.remove();
    }
    if (atBottom)
        scrollToBottom();
}
function clearChat() {
    while (chat.childElementCount) {
        chat.firstChild.remove();
    }
    timeLast = msgLast = -1;
}
function advanceChatTo(curTime) {
    if (msgCount == 0)
        return;
    for (let i = msgLast + 1; i < msgCount; ++i) {
        let message = streamData.chat[i];
        if (message.offset <= curTime) {
            addSingleMessage(message);
            msgLast = i;
        }
        else {
            return;
        }
    }
}
function queueUpcomingMessages() {
    if (msgCount == 0)
        return;
    // do this for safety reasons
    unqueueUpcomingMessages();
    // current time in seconds
    const now = player.getCurrentTime();
    if (now < timeLast)
        clearChat();
    advanceChatTo(now);
    let next = msgLast + 1;
    if (next < msgCount) {
        let timeOfNext = streamData.chat[next].offset;
        let ms = (timeOfNext - now) * 1000 / player.getPlaybackRate();
        messageTimer = setTimeout(queueUpcomingMessages, ms);
    }
    timeLast = now;
}
function unqueueUpcomingMessages() {
    clearTimeout(messageTimer);
    messageTimer = -1;
}
function onPlayerStateChange(ev) {
    switch (ev.data) {
        case YT.PlayerState.PLAYING:
            queueUpcomingMessages();
            break;
        case YT.PlayerState.PAUSED:
        case YT.PlayerState.ENDED:
            unqueueUpcomingMessages();
            break;
    }
}
function initYoutube() {
    player = new YT.Player("player", {
        height: '',
        width: '',
        videoId: streamData.ytid,
        playerVars: {
            'playsinline': 1
        },
        events: {
            'onReady': ev => { if (autoplay)
                ev.target.playVideo(); },
            'onStateChange': onPlayerStateChange,
            'onPlaybackRateChange': queueUpcomingMessages
        }
    });
    // remove the "Loading..." text
    document.querySelector(".player-area").firstChild.remove();
}
window["initPage"] = initPage;
//# sourceMappingURL=script.js.map