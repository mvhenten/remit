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