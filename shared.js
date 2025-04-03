// types and methods shared between twutube and the github action for generating json files
export class MessageFragment {
    text;
    // index of the emote in the image list
    emote;
}
export class ChatMessage {
    user;
    color;
    // offset in seconds
    offset;
    // indice of the badges in the image list
    badges;
    fragments;
    system;
}
export class Video {
    // game ids
    game;
    title;
    created;
    length;
}
/* unfinished prototyping for better establishing badges/emotes */
export class ChatImage {
    title;
    path;
    // will contain stuff like "ffz-emote", "sub-badge", and "animated"
    classes;
}
export class Stream extends Video {
    description;
    // friendly name
    // same as the game values in SerializedVideos but for a standalone json
    gameName;
    globalOffset;
    ytid;
    chat;
    images;
}
export class Collection {
    name;
    // ids of all videos pre-sorted
    // playlists oldest to newest; all videos newest to oldest
    videos;
}
export class SerializedVideos {
    user;
    // used as Map<string, string>
    socials;
    // used as Map<string, Video>
    videos;
    collections;
    // map of ids to names
    // used as Map<string, string>
    games;
}
export class UserSummary {
    name;
    videos;
    playlists;
}
export function formatTimestamp(time) {
    let secs = time % 60;
    let str = secs.toString();
    if (secs < 10)
        str = '0' + str;
    str = ':' + str;
    time = (time - secs) / 60;
    if (time > 0) {
        let mins = time % 60;
        str = mins + str;
        time = (time - mins) / 60;
        if (time > 0) {
            if (mins < 10)
                str = '0' + str;
            str = time + ':' + str;
        }
    }
    else {
        str = '0' + str;
    }
    return str;
}
//# sourceMappingURL=shared.js.map