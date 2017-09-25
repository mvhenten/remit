"use strict";

const fs = require("fs");
const MailParser = require("mailparser").MailParser;

function ucfirst(str) {
    return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
}

function lcfirst(str) {
    return str.charAt(0).toLowerCase() + str.slice(1);
}

function processHeaders(headers) {
    const pairs = Array.from(headers);

    return pairs.reduce((headers, kv) => {
        let [key, value] = kv;

        key = lcfirst(key.split(/-/g).map(ucfirst).join(""));

        if (key == "from")
            value = value.text;

        if (key == "to")
            value = value.value;


        headers[key] = value;

        return headers;
    }, {});

}

function parseHeaders(email) {
    let parser = new MailParser();

    if (typeof email == "string")
        email = fs.readFileSync(email);

    return new Promise((resolve, reject) => {
        parser.on("headers", headers => {
            parser.end();
            
            const parsedHeaders = processHeaders(headers);
            
            resolve(parsedHeaders);
        });

        parser.end(email);
    });
}

module.exports.parseHeaders = parseHeaders;