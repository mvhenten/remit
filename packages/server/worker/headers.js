const debug = require("debug")("remit:headers");
const filter = require("@remit-email/message/filter");
const Message = require("@remit-email/message");


module.exports = (queues) => {

    queues.subscribe("headers", async(payload, queue) => {
        let { user, headers, path, spam } = payload;
        let message = new Message(user, headers, path);

        try {
            if (spam) {
                message.spam = true;
                message.inbox = "spam";
                await message.store();
            }
            else {
                let match = filter.match(user.filters, this);
                if (match) message.inbox = match.target;
                await message.store();
            }

            path = message.path;

            debug("Processed message:", path);

            queues.publish("index", {
                user,
                headers,
                path
            });

            queue.resolve();
        }
        catch (err) {
            if (err.code == "EMFILE") {
                debug(`Too many files open: ${err}`);
                queue.reschedule();
                return;
            }

            if (err.code == "ENOENT") {
                debug(`Message is gone: ${err}`);
                queue.resolve();
                return;
            }
            console.trace("Found error:", err);

            process.exit(1);
        }
    });
};
