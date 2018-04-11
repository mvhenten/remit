const { Transform } = require('stream');
const JSONStream = require("./util/json-stream");
const collect = require("./util/collect-stream");

class StreamWrapper extends Transform {
    constructor(options) {
        super({ objectMode: true });

        this._counter = 0;
        this.values = [];
    }

    _transform(chunk, encoding, next) {
        if (this._limit)
            this._counter++;

        if (this._counter > this._limit) {
            this.push({ paginationKey: chunk.key });
            this.push(null);
            return;
        }

        if (this._transformer)
            chunk = this._transformer(chunk);

        this.push(chunk);
        next();
    }

    transform(transformer) {
        this._transformer = transformer;
        return this;
    }

    prepend(item) {
        this.push(item);
        return this;
    }

    limit(limit) {
        this._limit = limit;
        return this;
    }

    toJSONStream() {
        return this.pipe(new JSONStream());
    }

    collect() {
        return this.pipe(collect());
    }
}

module.exports = StreamWrapper;