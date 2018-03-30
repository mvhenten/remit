const { Transform } = require('stream');

function pluck(key) {
    return new Transform({
        objectMode: true,
        async transform(chunk, encoding, next) {
            next(null, chunk[key]);
        }
    });
}

function build(key) {
    return new Transform({
        objectMode: true,
        async transform(chunk, encoding, next) {
            let obj = { [key]: chunk };
            next(null, obj);
        }
    });
}

function mixin(value) {
    return new Transform({
        objectMode: true,
        async transform(chunk, encoding, next) {
            next(null, Object.assign(chunk, value));
        }
    });
}

function limit(limit=50) {
    let count = 0;
    
    return new Transform({
        objectMode: true,
        async transform(chunk, encoding, next) {
            count++;
            
            if (count > limit)
                this.end();

            next(null, chunk);
        }
    });
}

module.exports = {pluck, build, mixin, limit};
