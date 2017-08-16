"use strict";

const levelup = require("levelup");
const memdown = require("memdown");
const path = require("path");
const state = new Map();


const DB_PATH = path.resolve(__dirname, "../../");

function wrap(path) {
    let db = levelup(path);

    return {
        createReadStream: db.createReadStream.bind(db),

        reload: (done) => {
            db.createKeyStream()
                .on('data', function(data) {
                    db.del(data);
                })
                .on("close", done);
                // require("leveldown").destroy(path, () => {
                //   process.nextTick(() => {
                //     db = levelup(path);
                //     done();

        //   });
        // });
        },

        get: (key, done) => {
            let promise = new Promise((resolve, reject) => {
                db.get(key, (err, res) => {
                    if (err && err.name != "NotFoundError")
                        return reject(err);

                    if (res)
                        res = JSON.parse(res);

                    return resolve(res);
                });
            });

            if (!done) return promise;
            promise.then((result) => done(null, result)).catch(done);
        },

        del: (key, done) => {
            db.del(key, done);
        },

        put: (key, val, done) => {
            db.put(key, JSON.stringify(val), done);
        },

        batch: (ops, done) => {
            ops = ops.map(op => {
                if (op.value)
                    op.value = JSON.stringify(op.value);
                return op;
            });

            db.batch(ops, done);
        }
    };
}

function db(key) {
    if (!state.has(key)) {
        let path = `${DB_PATH}/${key}.db`;
        let db = wrap(path);
        state.set(key, db);
    }
    return state.get(key);
}

module.exports = db;

module.exports.testDb = function() {
    return wrap({
        db: memdown
    });
};