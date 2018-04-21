"use strict";

const level = require('level-hyper');
const sublevel = require('level-sublevel/bytewise');

module.exports = (path) => {
    const db = sublevel(level(path), { valueEncoding: "json" });
    return db;
};