const {MaildirFolder} = require("./dir");
const HeaderStream = require("./header-stream");
const {EventEmitter} = require("events");
const fs = require("fs");

class Maildir {
    constructor({maildir}) {
        this.maildir = maildir;
    }

    async folders() {
        const folders = new MaildirFolder(this);
        return await folders.list();
    }

    async files() {
        const dirs = await this.folders();
        const files = [];

        for (let dirname of dirs) {
            let contents = await this.list(dirname);
            files.push(...contents);
        }

        return files;
    }

    async list(dir) {
        const folders = new MaildirFolder(this);
        return await folders.list(dir);
    }

    async counts() {
        const folders = new MaildirFolder(this);
        return await folders.counts();
    }

    async scan() {
        let files = await this.files();

        return new HeaderStream(files);
    }

    async watch() {
        const {maildir} = this;
        const emitter = new EventEmitter();

        fs.watch(maildir, (eventType, path) => {
            emitter.emit(eventType, {
                maildir: this,
                path,
            });
        });

        return emitter;
    }

}

module.exports = Maildir;