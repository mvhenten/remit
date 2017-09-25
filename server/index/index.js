
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
    
    debug("indexer loaded");
}

module.exports.init = index;