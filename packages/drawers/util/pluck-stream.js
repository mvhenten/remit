"use strict";

const {Transform} = require('stream');

function pluck(key) {
    return new Transform({
        objectMode: true,
        async transform(chunk, encoding, next) {
            next(null, chunk[key]);
        }
    });
}

module.exports = pluck;
