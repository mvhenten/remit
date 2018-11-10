const {MaildirFolder} = require("./dir");

class Maildir {
    constructor({maildir}) {
        this.maildir = maildir;
    }

    async folders() {
        const folders = new MaildirFolder(this);
        return await folders.list();
    }

    async list(dir) {
        const folders = new MaildirFolder(this);
        return await folders.list(dir);
    }

    async counts() {
        const folders = new MaildirFolder(this);
        return await folders.counts();
    }
}

module.exports = Maildir;