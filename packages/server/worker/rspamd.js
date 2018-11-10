const debug = require("debug")("remit:rspamd");
const Rspamd = require("rspamd-client");
const Path = require("path");
const client = Rspamd();


module.exports = (pubsub) => {
    const check = async(path) => {
        const dirname = Path.dirname(path);

        if (/[.]spam$/.test(dirname))
            return true;

        if (!/\/new$/.test(dirname))
            return false;

        const result = await client.check(path);

        debug("checked %s: ", path, JSON.stringify(result));

        return result.isSpam;
    };

    pubsub.subscribe(async({ user, path }, queue) => {
        if (!path) {
            queue.resolve();
            return console.error("invalid path");
        }

        try {
            const spam = await check(path);

            debug("publishing message", path, spam);
            pubsub.publish({
                user,
                path,
                spam,
            });

            queue.resolve();
        }
        catch (err) {
            if (err.code == "ECONNREFUSED") {
                console.error(`Could not connect to the rspam daemon. Is rspamd running? ${err}`);
                process.exit(1);
            }

            if (err.code == "EMFILE") {
                debug(`Too many files open: ${err}`);
                queue.reschedule();
                return;
            }

            if (err.code == "ENOENT" ||
                err.code == "ENOTFOUND") {
                debug(`Message deleted: ${err}`);
                queue.resolve();
                return;

            }

            if (err.code == "EPIPE" ||
                err.code == "ETIMEDOUT" ||
                err.code == "ECONNRESET") {
                debug(`Failed to send to rspamd: ${err}`);
                queue.reschedule();
                return;
            }

            console.trace("Rspamd unexpected error: ", err);

            process.exit(1);
        }
    });
};
