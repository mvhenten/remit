const EventEmitter = require("events");
const MailComposer = require("nodemailer/lib/mail-composer");
const { parseMessage } = require("./parser");
const Flags = require("maildir-flags");
const Path = require("path");
const { promisify } = require('util');
const fs = require("graceful-fs");

const debug = require("debug")("remit:mta:message");

const rename = promisify(fs.rename);
const unlink = promisify(fs.unlink);
const mkdirp = promisify(require("mkdirp"));

const State = new WeakMap();

State.update = (key, values) => {
    State.set(key, Object.assign(State.get(key), values));
};

class MaildirMessage extends EventEmitter {
    constructor(user, headers, path) {
        super();

        let { flags } = Flags.parse(path);

        State.set(this, { user, headers, path, flags });
    }

    get headers() {
        State.get(this).headers;
    }

    // static async compose(user, { messageId = uuid(), references, text, subject, from, to, bcc }) {
    //     let options = {
    //         messageId,
    //         references,
    //         text,
    //         subject,
    //         from,
    //         to,
    //         bcc,
    //         date: new Date()
    //     };

    //     const email = await compose(options);
    //     const path = Path.join(user.maildir, '.drafts', messageId);

    //     await mkdirp(Path.dirname(path));
    //     await writeFile(path, email);

    //     return new MaildirMessage(user, path);
    // }

    get flags() {
        return Object.assign({}, State.get(this).flags);
    }

    set flags(flags) {
        let origFlags = State.get(this).flags;
        flags = Object.assign(origFlags, flags);
        State.update(this, { flags });
    }

    // get owner() {
    //     const { maildir } = State.get(this);
    //     return maildir.owner;
    // }

    get inbox() {
        const dirname = Path.dirname(this.path);
        const inbox = Path.basename(dirname);

        return inbox;
    }

    set inbox(inbox) {
        if (inbox.charAt(0) != ".")
            inbox = "." + inbox;

        const filename = Path.basename(this.path);
        const dirname = Path.dirname(this.path);

        const basename = Path.dirname(dirname);
        const target = Path.join(basename, inbox, filename);

        State.update(this, { target });
    }

    get path() {
        return State.get(this).path;
    }

    get filename() {
        return Path.basename(this.path);
    }

    get isValid() {
        return ["to", "messageId", "from"].every(key => {
            return this.headers[key];
        });
    }

    delete() {
        return unlink(this.path);
    }

    async store() {
        const source = this.path;
        let target = State.get(this).target;

        if (!target) target = source;

        await mkdirp(Path.dirname(target));

        let path = Flags.format(target, this.flags);

        if (path == source)
            return;

        State.set(this, Object.assign(State.get(this), { path }));

        debug("Store message: ", this.path);

        return rename(source, this.path);
    }

    async parseMessage() {
        return parseMessage(this.path);
    }
}

["seen", "spam"].forEach(key => {
    Object.defineProperty(MaildirMessage.prototype, key, {
        set: function(val) {
            const flags = State.get(this).flags;

            flags[key] = val;

            State.update(this, flags);
        },
        get: function() {
            return State.get(this).flags[key];
        }
    });
});


module.exports = MaildirMessage;