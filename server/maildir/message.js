const EventEmitter = require("events");
const MailComposer = require("nodemailer/lib/mail-composer");
const { parseHeaders, parseMessage } = require("./message/parser");
const Flags = require("./flags");
const Path = require("path");
const {promisify} = require('util');
const fs = require("fs");
const uuid = require("uuid");

const debug = require("debug")("remit:maildir:message");

const rename = promisify(fs.rename);
const unlink = promisify(fs.unlink);
const mkdirp = promisify(require("mkdirp"));
const writeFile = promisify(fs.writeFile);

const State = new WeakMap();

State.update = (key, values) => {
    State.set(key, Object.assign(State.get(key), values));
};

function compose(options) {
    return new Promise((resolve, reject) => {
        new MailComposer(options).compile().build(function(err, msg){
            if (err) return reject(err);
            resolve(msg);
        });
    });
}

class MaildirMessage extends EventEmitter {
    constructor(user, path) {
        super();
        
        let {flags} = Flags.parse(path);
        
        State.set(this, {user, path, flags});
    }
    
    /**
     * Compose a new email.
     * 
     * @constructor - returns a new instance of MaildirMessage
     */
    static async compose(user, {messageId=uuid(), references, text, subject, from, to, bcc}) {
        let options = {
            messageId,
            references,
            text,
            subject,
            from,
            to,
            bcc,
            date: new Date()
        }
        
        const email = await compose(options);
        const path = Path.join(user.maildir, '.drafts', messageId);

        await mkdirp(Path.dirname(path));
        await writeFile(path, email);
        
        return new MaildirMessage(user, path);
    }
    
    get flags() {
        return Object.assign({}, State.get(this).flags);
    }

    set flags(flags) {
        let origFlags = State.get(this).flags;
        flags = Object.assign(origFlags, flags);
        State.update(this, {flags});
    }

    get inbox() {
        const dirname = Path.dirname(this.path);
        const inbox = Path.basename(dirname);
        
        return inbox;
    }
    
    set inbox(inbox) {
        if (inbox.charAt(0) != ".")
            inbox = "." + inbox;

        const filename = Path.basename(this.path);
        const dirname = Path.dirname(this.path);

        const basename = Path.dirname(dirname);
        const target = Path.join(basename, inbox, filename);
        
        State.update(this, {target});
    }
    
    get maildir() {
        return this.user.maildir;
    }

    get path() {
        return State.get(this).path;
    }
    
    get filename() {
        return Path.basename(this.path);
    }
    
    get user() {
        return Object.assign({}, State.get(this).user);
    }
    
    get isValid() {
        if (!this.headers)
            throw new Error("Can't validate without headers");

        return ["to", "messageId", "from"].every(key => {
            return this.headers[key];
        });
    }

    continue() {
        this.emit("continue");
    }

    unlink() {
        return unlink(this.path);
    }
    
    async store() {
        const source = this.path;
        let target = State.get(this).target;
        
        if (!target) target = source;
        
        await mkdirp(Path.dirname(target));


        let path = Flags.format(target, this.flags);
        State.set(this, Object.assign(State.get(this), {path}));
        
        debug("Store message: ", this.path);

        return rename(source, this.path);
    }

    async parseHeaders(done) {
        if (!this.headers) {
            this.headers = await parseHeaders(this.path);
        }
        
        return this.headers;
    }
    
    async parseMessage() {
        return parseMessage(this.path);
    }
}

["seen", "spam"].forEach(key => {
    Object.defineProperty(MaildirMessage.prototype, key, {
        set: function(val) {
            const flags = State.get(this).flags;
            
            flags[key] = val;
            
            State.update(this, flags);
        },
        get: function() {
            return State.get(this).flags[key];
        }
    });
});


module.exports = MaildirMessage;