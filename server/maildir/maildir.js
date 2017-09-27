const EventEmitter = require("events");
const config = require("config");
const fs = require("fs");
const debug = require("debug")("remit:maildir");

const isDir = (path) =>
    fs.statSync(path).isDirectory();

const MaildirMessage = require("./message");

class Maildir extends EventEmitter {
    watch(user) {
        const dir = user.maildir + "/new";

        debug(`Watching maildir: ${dir}`);


        fs.watch(dir, (eventType, filename) => {
            if (eventType !== "rename")
                return;


            if (filename.charAt(0) == ".")
                return;

            const path = `${dir}/${filename}`;

            if (!fs.existsSync(path))
                return;

            if (isDir(path))
                return;

            debug(`Found new message ${path}`);

            const messageState = new MaildirMessage(user, path);

            this.emit("file", messageState);
        });
    }
}

let instance;

module.exports.unlink = async(user, message) => {
    const maildir = new MaildirMessage(user, message.path);

    try {
        await maildir.unlink();
    }
    catch(err) {
        console.error(err);
    }

    instance.emit("unlink", maildir, message);
};

module.exports.move = async(user, message, target) => {
    const maildir = new MaildirMessage(user, message.path);
    await maildir.move(target);

    instance.emit("move", maildir, message);
};

module.exports.update = async(user, message, {flags}) => {
    const maildir = new MaildirMessage(user, message.path);
    
    maildir.flags = flags;
    await maildir.store();

    instance.emit("update", maildir, message);
};

function init() {
    instance = new Maildir();

    config.users.forEach((user) => {
        instance.watch(user);
    });

    return instance;
}

module.exports.init = init;