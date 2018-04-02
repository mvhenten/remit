"use strict";

const memdown = require("memdown");
const BaseWrapper = require("./base");

class MemDownWrapper extends BaseWrapper {
    constructor() {
        super(memdown());
    }
}

module.exports = MemDownWrapper;