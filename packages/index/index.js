const debug = require("debug")("remit:index");

class Indexer {
    constructor(db) {
        this.db = db;
    }

    async index(message) {
        debug("received message: ", message.path);

        const db = this.db.load(message.owner);

        let headers = await message.parseHeaders();

        if (!headers.messageId)
            return;

        const dbMessage = await db.Message.loadByRawMessageId(headers.messageId);

        // optimization, if path matches do nothing
        if (dbMessage && message.path == dbMessage.path)
            return;

        const { flags, inbox, path } = message;
        const data = Object.assign({}, { flags, inbox, path }, headers);


        await db.Message.store(data);
    }
}

module.exports = Indexer;