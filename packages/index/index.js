const Flags = require("maildir-flags");
const Path = require("path");

const { Writable } = require('stream');
const Maildir = require("@remit-email/maildir/maildir");



const _client = Symbol("_client");

class MaildirDbAdapter extends Writable {
    constructor(client) {
        super({
            objectMode: true
        });

        this[_client] = client;
    }

    _write(data, encoding, next) {
        let { path, messageId } = data;

        if (!messageId) return next();

        let { flags } = Flags.parse(path);
        const dirname = Path.dirname(path);
        const inbox = Path.basename(dirname);

        this[_client].Message.store({ flags, inbox, ...data }, next);
    }
}

const index = async (maildir, client) => {
    const writeToDbStream = new MaildirDbAdapter(client);
    const mdir = new Maildir({ maildir });
    const headers = await mdir.scan();


    headers.pipe(writeToDbStream);

    return headers;
};

module.exports = index;
