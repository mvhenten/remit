const debug = require("debug")("remit:delivery");
const filter = require("@remit-email/message/filter");
const Message = require("@remit-email/message");


module.exports = (pubsub) => {

    pubsub.subscribe(async(payload, queue) => {
        let { user, headers, path, spam } = payload;
        let message = new Message(user, headers, path);

        try {
            let match = filter.match(user.filters, {headers});

            debug("Matching: ", path, match);

            /**
             * Our filters presumably act as a whitelist
             *
             * TODO we need better logic for whitelists
             * and spam handling.
             */
            if (match) message.inbox = match.target;
            else if (spam) {
                message.spam = true;
                message.inbox = "spam";
            }
            await message.store();

            path = message.path;

            debug("Processed message:", path);

            pubsub.publish({
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
