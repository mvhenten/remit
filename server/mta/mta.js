const debug = require("debug")("remit:mta");
const EventEmitter = require("events");
const fs = require("graceful-fs");

const Message = require("../message/message");

class MTA extends EventEmitter {
    async scan(Maildir) {
        const dirs = await Maildir.folders();

        for (let dir of dirs) {
            debug("scanning: ", dir);

            let files = await Maildir.list(dir);

            for (let fileName of files) {
                const message = new Message(Maildir, fileName);
                await message.parseHeaders();

                this.emit("message", message);
            }
        }
    }

    async watch(Maildir) {
        const dir = Maildir.path;

        debug("Watching: ", dir);

        fs.watch(dir, (eventType, filename) => {
            if (eventType !== "rename")
                return;

            this._message(Maildir, filename);
        });
    }

    async create(Maildir, options) {
        const message = await Message.compose(Maildir, options);
        this.emit("message", message);
    }

    _message(Maildir, filename) {
        debug("Found message:", filename);
        const message = new Message(Maildir, filename);
        this.emit("message", message);
    }
}

module.exports = MTA;