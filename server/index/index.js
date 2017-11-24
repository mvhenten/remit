const Db = require("../db/db");
const debug = require("debug")("remit:index");

function index({maildir}) {
    maildir.on("delivered", async maildirMessage => {
        await maildirMessage.parseHeaders();
        const {headers, flags, inbox, user, path} = maildirMessage;
        const db = Db.load(user);
        const data = Object.assign({}, {flags, inbox, path}, headers);

        try {
            let msg = await db.Message.store(data);
            maildir.emit("indexed", msg);
        }
        catch(err) {
            console.error(err);
            maildirMessage.unlink();
        }
    });
    
    maildir.on("unlink", async (maildir, message) => {
        await message.delete(() => {
            debug(`Mesage deleted: ${message.subject}`);
        });
    });

    maildir.on("update", async (maildir, message) => {
        let {path, inbox, flags} = maildir;
        
        flags = Object.assign(message.flags, flags);

        if (inbox == ".spam")
            flags.spam = true;

        await message.update(Object.assign(message.toJSON(), {flags, path, inbox}));
        
        debug("message updated: %s %s", message.messageId, JSON.stringify({flags, inbox, path}));
    });

    debug("indexer loaded");
}

module.exports.init = index;