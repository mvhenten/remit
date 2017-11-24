"use strict";

const {Transform} = require('stream');
const {pullStream} = require("../util/stream");

function threadStream(msg, query) {
    const seen = new Set();

    function isUnseenBeforeStart(message) {
        if (message.meta.flags.unseen)
            return message.Date > query.start;
    }

    function byDate(a, b) {
        return b.date - a.date;
    }

    return new Transform({
        objectMode: true,
        async transform(chunk, encoding, next) {
            const message = chunk.value;
            
            if (!message) {
                return next(null);
            }

            if (seen.has(message.messageId))
                return next();

            if (seen.has(message.parentId))
                return next();

            const threadStream = message.streamFromParentIdAndDate(message.parentId);
            let messages = (await pullStream(threadStream)).map(({value}) => value);

            /**
             * In case we are paginating, check if this thread
             * is within the current query. 
             * Any message earlier makes this stream fall outside 
             * of the query.
             */
            // if (messages.some(isUnseenBeforeStart))
            //     return next();

            messages.forEach(msg => seen.add(msg.messageId));

            return next(null, messages.sort(byDate));
        }
    });
}

module.exports = threadStream;
