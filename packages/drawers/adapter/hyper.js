"use strict";

const level = require('level-hyper');
const sublevel = require('level-sublevel/bytewise');

module.exports = (path) => {
    const db = level(path);
    const subleveldb = sublevel(db, { valueEncoding: "json" });

    subleveldb.destroy = async() => new Promise((resolve, reject) => {
        db.close(() => {
            db.options.db.destroy(path, err => {
                if (err) return reject(err);
                resolve();
            });
        });
    });

    return subleveldb;
};