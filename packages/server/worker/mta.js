const debug = require("debug")("remit:mta");
const fs = require("graceful-fs");
const config = require("config");
const Maildir = require("@remit-email/maildir/maildir");


module.exports = (queues, argv) => {
    const scan = async (Maildir) => {
        const dirs = await Maildir.folders();
        const user = Maildir.owner;

        for (let dir of dirs) {
            debug("scanning: ", dir);

            let files = await Maildir.list(dir);

            for (let path of files) {
                debug("found new message");
                queues.publish("spam", {path, user})
            }
        }
    }

    const watch = (Maildir) => {
        const dir = Maildir.path;

        debug("Watching: ", dir);

        fs.watch(dir, (eventType, filename) => {
            if (eventType !== "rename")
                return;

            this._message(Maildir, filename);
        });
    }

    const init = async () => {
        for (let user of config.users) {
            const maildir = new Maildir(user);

            if (argv.scan)
                await scan(Maildir);


            if (argv.watch)
                watch(maildir);
        }
    }

};
