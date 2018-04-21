"use strict";

const memdown = require("memdown");
const sublevel = require('level-sublevel/bytewise');
const encode = require('encoding-down');

module.exports = () => {
    const root = encode(memdown(), { valueEncoding: 'json' });
    const db = sublevel(root, { valueEncoding: "json" });

    return db;
};

