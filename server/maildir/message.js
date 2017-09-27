const EventEmitter = require("events");
const { parseHeaders } = require("./headers");
const Flags = require("./flags");
const Path = require("path");
const {promisify} = require('util');
const fs = require("fs");

const rename = promisify(fs.rename);
const unlink = promisify(fs.unlink);
const mkdirp = promisify(require("mkdirp"));

const State = new WeakMap();

State.update = (key, values) => {
    State.set(key, Object.assign(State.get(key), values));
};

class MaildirMessage extends EventEmitter {
    constructor(user, path) {
        super();
        
        let {flags} = Flags.parse(path);
        
        State.set(this, {user, path, flags});
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
        const maildir = this.maildir;
        const basedir = this.path.replace(new RegExp(`^${maildir}`), "");
        return Path.dirname(basedir).replace(/^\//, "");
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
    
    async move(inbox) {
        if (inbox.charAt(0) != ".")
            inbox = "." + inbox;
        
        let target = Path.join(this.maildir, inbox, this.filename);
        
        await mkdirp(Path.dirname(target));
        
        return this.store(target);
    }
    
    unlink() {
        return unlink(this.path);
    }
    
    store(target=this.path) {
        const source = this.path;

        let path = Flags.format(target, this.flags);
        State.set(this, Object.assign(State.get(this), {path}));

        return rename(source, this.path);
    }

    async parseHeaders(done) {
        if (!this.headers) {
            this.headers = await parseHeaders(this.path);
        }
        
        return this.headers;
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