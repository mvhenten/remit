"use strict";

const levelup = require("levelup");
const debug = require("debug")("drawers");

class DbWrapper {

    constructor(db) {
        this.db = levelup(db);
    }

    createReadStream(...args) {
        return this.db.createReadStream(...args);
    }

    get(key, done) {
        debug("GET", key);
        let promise = new Promise((resolve, reject) => {
            this.db.get(key, (err, res) => {
                if (err && err.name != "NotFoundError")
                    return reject(err);

                if (res)
                    res = JSON.parse(res);

                return resolve(res);
            });
        });

        if (!done) return promise;
        promise.then((result) => done(null, result)).catch(done);
    }

    del(key, done) {
        return this.db.del(key, done);
    }

    put(key, val, done) {
        debug("PUT", key);
        return this.db.put(key, JSON.stringify(val), done);
    }

    batch(ops, done) {
        ops = ops.map(op => {
            if (op.value)
                op.value = JSON.stringify(op.value);
            return op;
        });

        return this.db.batch(ops, done);
    }
}

module.exports = DbWrapper;