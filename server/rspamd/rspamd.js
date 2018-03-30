const debug = require("debug")("remit:rspamd");
const Rspamd = require("rspamd-client");
const EventEmitter = require("events");
const Queue = require("./queue");

const client = Rspamd();
const queue = new Queue();


class RspamdClient extends EventEmitter {

    async check(message) {
        queue.push(async () => {
            const result = await client.check(message.path);
            message.spam = result.isSpam;
            message.inbox = "spam";

            if (result.isSpam)
                debug("found spam: ", message.path);

            this.emit("message", message);
        });
    }
}

module.exports = RspamdClient;