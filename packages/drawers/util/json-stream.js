"use strict";

const {Transform} = require('stream');


class JSONStream extends Transform {
    constructor() {
        super({
            writableObjectMode: true,
        });
        this.setEncoding("utf8");
        this.first = true;
    }

    _flush(callback) {
        if (!this.first)
            this.push("]");
        callback();
    }

    _transform(chunk, encoding, callback) {
        let data = JSON.stringify(chunk, null, 1);

        if (this.first)
            data = "[" + data;
        else
            data = "," + data;

        callback(null, data);
        this.first = false;
    }
}

module.exports = function streamJSON(){
    return new JSONStream();
};

module.exports.JSONStream = JSONStream;
