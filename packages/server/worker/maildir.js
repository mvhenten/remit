const debug = require("debug")("remit:mta");
const fs = require("graceful-fs");
const Maildir = require("@remit-email/maildir/maildir");

module.exports = (pubsub, argv, config) => {
    const scan = async(user) => {
        const maildir = new Maildir(user);
        const dirs = await maildir.folders();

        for (let dir of dirs) {
            debug("scanning: ", dir);

            let files = await maildir.list(dir);

            for (let path of files) {
                debug("found new message");
                pubsub.publish({ path, user });
            }
        }
    };

    const watch = (user) => {
        console.log(user);
        const maildir = new Maildir(user);
        const dir = maildir.maildir;

        debug("Watching: ", dir);

        fs.watch(dir, (eventType, path) => {
            if (eventType !== "rename")
                return;

            debug("found new message");
            pubsub.publish("spam", { path, user });
        });
    };

    const init = async() => {
        for (let user of config.users) {

            if (argv.watch)
                watch(user);

            if (argv.scan)
                await scan(user);


        }
    };

    init();
};
