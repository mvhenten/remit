"use strict";

const exec = require("child_process").exec;
const debug = require("debug")("remit:spam");
const Queue = require("./queue");

function dspam(path, user, done) {
    exec(`cat "${path}" | dspam --mode=teft ==user=${user} --classify`, (err, buf) => {
        if (err) return done(err);

        const str = buf.toString();
        const result = str.split(/; /).reduce((collect, str) => {
            const kv = str.split(/=/).map(s => s.replace(/"/g, ""));
            return Object.assign(collect, {[kv[0]]: kv[1]});
        }, {});
        
        done(null, result);
    });
}

function init(imports) {
    const { maildir } = imports;

    const queue = new Queue();
    
    queue.on("error", err => {
        console.error(err);
    });
    
    queue.on("task", messageState => {
        maildir.emit("received", messageState); 
    });

    maildir.on("file", (messageState) => {
        const { user, path } = messageState;

        debug(`received: ${user.name}, ${path}`);
        
        queue.enqueue(messageState, (messageState, next) => {
            const { user, path } = messageState;
            
            debug(`processing: ${user.name}, ${path}`);
    
            dspam(path, user.name, (err, result) => {
                if (err) return next(err);
                
                debug(`processed: ${user.name}, ${path}, ${result.class}`);
    
                messageState.spam = result.class == "Spam";

                next();
            });
        });
    });
    
    debug("loaded");
}

module.exports = init;