const debug = require("debug")("remit:mta");
const fs = require("graceful-fs");
const util = require("util");
const Maildir = require("@remit-email/maildir/maildir");
const setImmediatePromise = util.promisify(setImmediate);


module.exports = (pubsub, argv, config) => {
    const scan = async(user) => {
        const maildir = new Maildir(user);
        const dirs = await maildir.folders();

        const counts = await maildir.counts();

        for (let info of counts) {
            console.error(`Indexing ${info.folder} ${info.unseen}/${info.total}`);
        }


        dirs.forEach(async (dir) => {
            debug("scanning: ", dir);

            let files = await maildir.list(dir);

            for (let path of files) {
                await setImmediatePromise();
                debug("found new message", path);
                pubsub.publish({ path, user });
            }
        });
    };

    const watch = (user) => {
        const maildir = new Maildir(user);
        const dir = maildir.maildir;

        debug("Watching: ", dir);

        fs.watch(dir, (eventType, path) => {
            if (eventType !== "rename")
                return;

            pubsub.publish("spam", { path, user });
        });
    };

    const init = async() => {
        for (let user of config.users) {
            if (argv.scan)
                await scan(user);

            if (argv.watch)
                watch(user);
        }
    };

    init();
};
