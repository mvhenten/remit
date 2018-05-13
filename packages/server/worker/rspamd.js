const debug = require("debug")("remit:rspamd");
const Rspamd = require("rspamd-client");
const client = Rspamd();


module.exports = (queues) => {

    queues.subscribe("spam", async({ user, path }, queue) => {
        try {
            const result = await client.check(path);

            debug("publishing message");

            queues.publish("message", {
                user,
                path,
                spam: result.isSpam
            });

            queue.resolve();
        }
        catch (err) {
            if (err.code == "ECONNREFUSED")
                console.error(`Could not connect to the rspam daemon. Is rspamd running? ${err}`);

            if (err.code == "EMFILE") {
                debug(`Too many files open: ${err}`);
                queue.reschedule();
                return;
            }

            if (err.code == "ECONNRESET") {
                debug(`Connection reset: ${err}`);
                queue.reschedule();
                return;
            }

            if (err.code == "EPIPE" || err.code == "ETIMEDOUT") {
                debug(`Failed to send to rspamd: ${err}`);
                queue.reschedule();
                return;
            }

            console.trace("Rspamd unexpected error: ", err);

            process.exit(1);
        }
    });
};