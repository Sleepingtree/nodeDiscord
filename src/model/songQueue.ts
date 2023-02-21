export default class SongQueueItem {
    url: string;
    title: string;

    constructor(url: string, title: string) {
        this.url = url;
        this.title = title;
    }
}