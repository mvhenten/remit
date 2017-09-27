
const Db = require("../db/db");
const debug = require("debug")("remit:index");

function index({maildir}) {

    maildir.on("delivered", async message => {
        await message.parseHeaders();
        
        const {headers, flags, inbox, user, path} = message;
        
        const db = Db.load(user);
        const data = Object.assign({}, {flags, inbox, path}, headers);
        const msg = await db.Message.store(data);
        
        debug("indexed: %s %s", msg.from, msg.subject);
        maildir.emit("indexed", msg);
    });
    
    maildir.on("unlink", async (maildir, message) => {
        await message.delete(() => {
            debug(`Mesage deleted: ${message.subject}`);
        });
    });
    
    maildir.on("move", async (maildir, message) => {
        const {path, inbox} = maildir;
        const flags = message.flags;
        
        if (inbox == ".spam")
            flags.spam = true;
    
        await message.update(Object.assign(message.toJSON(), {flags, path, inbox}));
    });

    maildir.on("update", async (maildir, message) => {
        let {path, inbox, flags} = maildir;
        
        flags = Object.assign(message.flags, flags);
        
        await message.update(Object.assign(message.toJSON(), {flags, path, inbox}));
        
        debug("message updated: %s %s", message.messageId, JSON.stringify({flags, inbox, path}));
    });

    debug("indexer loaded");
}

module.exports.init = index;