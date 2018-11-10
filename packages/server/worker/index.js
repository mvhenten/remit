const debug = require("debug")("remit:index");
const Message = require("@remit-email/message");


module.exports = (Db) => {
    const index = async (headers, user, path) => {
        const db = Db.load(user);
        let message = new Message(user, headers, path);

        if (!headers.messageId)
            return;

        const dbMessage = await db.Message.loadByRawMessageId(headers.messageId);


        // optimization, if path matches do nothing
        if (dbMessage && path == dbMessage.path)
            return;

        const { flags, inbox } = message;
        const data = Object.assign({}, { flags, inbox, path }, headers);


        await db.Message.store(data);
        debug("Message indexed: ", message.path);
    };

    return async(payload, queue) => {
        let {user, headers, path} = payload;
        debug("Indexing: ", path);

        try {
            await index(headers, user, path);
            debug("Index written");
            queue.resolve();
        }
        catch (err) {
            console.trace("Unexpected error writing index:", err);

            process.exit(1);
        }
    };
};
