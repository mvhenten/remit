const EventEmitter = require("events");
const config = require("config");
const fs = require("fs");
const debug = require("debug")("remit:maildir");
const argv = require('yargs').argv;
const promisify = require("util").promisify;
const readdir = promisify(fs.readdir);


const isDir = (path) =>
    fs.statSync(path).isDirectory();
    
console.log(argv, argv.index);

const MaildirMessage = require("./message");

class Maildir extends EventEmitter {
    getDir(user) {
        return user.maildir + "/new";
    }
    
    async index(user) {
        const dir = this.getDir(user);
        
        debug(`Indexing ${dir}`);
        
        const files = await readdir(dir);
        
        files.forEach(filename => {
            const path = `${dir}/${filename}`;

            debug(`Found new message ${path}`);

            const messageState = new MaildirMessage(user, path);

            this.emit("file", messageState);
        });
    }
    
    watch(user) {
        const dir = this.getDir(user);

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

module.exports.update = async(user, message, {flags, inbox}) => {
    const maildir = new MaildirMessage(user, message.path);
    
    if (flags)
        maildir.flags = flags;
        
    if (inbox)
        maildir.inbox = inbox;

    await maildir.store();

    instance.emit("update", maildir, message);
};

function init() {
    instance = new Maildir();

    config.users.forEach((user) => {
        instance.watch(user);
        
        if (argv.index)
            instance.index(user);
    });

    return instance;
}

module.exports.init = init;