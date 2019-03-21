const { parseHeaders } = require("@remit-email/message/parser");
const { Readable } = require('stream');

class HeaderStream extends Readable {
    constructor(files = []) {
        super({
            objectMode: true
        });

        if (!Array.isArray(files))
            throw new Error("Expected array of files");

        this.total = files.length;
        this._files = files;

        Object.defineProperty(this, "size", {
            get: () => this._files.length
        });
    }

    async _read() {
        const filename = this._files.pop();
        if (!filename) return this.push(null);

        const headers = await parseHeaders(filename);
        this.push(headers);
    }
}

module.exports = HeaderStream;
