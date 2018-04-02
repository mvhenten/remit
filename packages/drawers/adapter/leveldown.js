"use strict";

const leveldown = require("leveldown");
const BaseWrapper = require("./base");
const encode = require('encoding-down');

class MemDownWrapper extends BaseWrapper {
    constructor(path) {
        super(encode(leveldown(path)));
    }
}

module.exports = MemDownWrapper;