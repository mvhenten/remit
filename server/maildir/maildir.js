const {MaildirFolder} = require("./dir");

class Maildir {
    constructor(user) {
        this._user = user;
    }

    get path() {
        return this._user.maildir;
    }

    get owner() {
        return this._user;
    }

    get filters() {
        return this._user.filters;
    }

    async folders() {
        const maildir = this.path;
        const folders = new MaildirFolder({maildir});
        return await folders.list();
    }

    async list(dir) {
        const maildir = this.path;
        const folders = new MaildirFolder({maildir});

        return await folders.list(dir);
    }
}

module.exports = Maildir;