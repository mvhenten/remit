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


function init() {
    const maildir = new Maildir();
    
    config.users.forEach((user) => {
        maildir.watch(user);
    });
    
    return maildir;
}

module.exports.init = init;