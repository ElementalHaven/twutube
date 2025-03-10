
// types and methods shared between twutube and the github action for generating json files

export class MessageFragment {
	text: string;
	// index of the emote in the image list
	emote?: number;
}

export class ChatMessage {
	user: string;
	color: string;
	// offset in seconds
	offset: number;
	// indice of the badges in the image list
	badges: number[];
	fragments: MessageFragment[];
	system?: boolean;
}

export class Video {
	// game ids
	game: string;
	title: string;
	created: Date | string;
	length: number;
}

/* unfinished prototyping for better establishing badges/emotes */
export class ChatImage {
	title?: string;
	path: string;
	// will contain stuff like "ffz-emote", "sub-badge", and "animated"
	classes: string[];
}

export class Stream extends Video {
	description: string;
	// friendly name
	// same as the game values in SerializedVideos but for a standalone json
	gameName: string;
	ytid: string;
	chat: ChatMessage[];
	images: ChatImage[];
}

export class Collection {
	name: string;
	// ids of all videos pre-sorted
	// playlists oldest to newest; all videos newest to oldest
	videos: string[];
}

export class SerializedVideos {
	user: string;
	socials: Map<string, string>;
	videos: Map<string, Video>;
	collections: Collection[];
	// map of ids to names
	games: Map<string, string>;
}

export class UserSummary {
	name: string;
	videos: number;
	playlists: number;
}

export function formatTimestamp(time: number) {
	let secs = time % 60;
	let str = secs.toString();
	if(secs < 10) str = '0' + str;
	str = ':' + str;
	time = (time - secs) / 60;
	if(time > 0) {
		let mins = time % 60;
		str = mins + str;
		time = (time - mins) / 60;
		if(time > 0) {
			if(mins < 10) str = '0' + str;
			str = time + ':' + str;
		}
	} else {
		str = '0' + str;
	}
	return str;
}