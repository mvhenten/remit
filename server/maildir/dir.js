const fs = require("fs");
const path = require("path");
const { promisify } = require("util");
const exists = fs.existsSync;
const readdir = promisify(fs.readdir);
const stat = promisify(fs.stat);
const Flags = require("./flags");
const uuid = require("uuid/v5");

const count = async folder => {
    const files = await readdir(folder);
    const info = files.map(file => Flags.parse(file).flags);
    const count = info.filter(flags => !flags.seen);

    return {
        id: uuid(folder, uuid.URL),
        folder: path.basename(folder),
        unseen: count.length,
        total: info.length
    };
};


const state = new WeakMap();

class MaildirFolder {
    constructor({ maildir }) {
        state.set(this, maildir);
    }

    get maildir() {
        return state.get(this);
    }

    async counts() {
        const dirs = await this.list();
        const info = await Promise.all(dirs.map(count));

        return info;
    }

    async list(dir) {
        if (dir) return this.listDir(dir);

        const { maildir } = this;
        const files = await readdir(maildir);
        const result = [];

        for (let file of files) {
            const fullPath = path.join(maildir, file);
            const fileStat = await stat(fullPath);

            if (fileStat.isFile())
                continue;

            result.push(fullPath);
        }

        return result;
    }

    async listDir(dir) {
        const { maildir } = this;
        const folderPath = path.join(maildir, path.basename(dir));

        if (!exists(folderPath))
            return;

        const files = await readdir(folderPath);
        const result = [];

        for (let file of files) {
            const fullPath = path.join(folderPath, file);
            const fileStat = await stat(fullPath);

            if (!fileStat.isFile())
                continue;

            result.push(fullPath);
        }

        return result;
    }
}

module.exports.MaildirFolder = MaildirFolder;


module.exports.counts = function(user) {
    const { maildir } = user;

    return new MaildirFolder({ maildir }).counts();
};
