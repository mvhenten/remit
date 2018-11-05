const debug = require("debug")("remit:headers");
const { parseHeaders } = require("@remit-email/message/parser");

module.exports = (pubsub) => {

    pubsub.subscribe(async(message, queue) => {
        try {
            message.headers = await parseHeaders(message.path);
            debug("Parsed headers: ", message.path);
            pubsub.publish(message);
            queue.resolve();
        }
        catch (err) {
            if (err.code == "EMFILE") {
                debug(`Too many files open: ${err}`);
                queue.reschedule();
                return;
            }

            if (err.code == "ENOENT") {
                debug(`Message no longer exists, ignoring: ${message.path}`);
                queue.resolve();
                return;
            }

            console.trace("Unepected error parsing headers: ", err);

            process.exit(1);
        }
    });
};
