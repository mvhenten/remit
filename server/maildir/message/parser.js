"use strict";

const fs = require("fs");
const MailParser = require("mailparser").MailParser;

const promisfy = require("util").promisify;
const readFile = promisfy(fs.readFile);
const devNull = require("dev-null");
const sanitizeHtml = require("sanitize-html");

function sanitize(html) {
    return sanitizeHtml(html, {
      allowedTags: sanitizeHtml.defaults.allowedTags.concat([])
    });    
}


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

const parseMessage = async (email) => {
    let parser = new MailParser();

    if (typeof email == "string")
        email = await readFile(email);

    return new Promise((resolve, reject) => {
        const attachments = [];
        const result = {attachments};
        
        parser.on("headers", headers => {
            result.headers = processHeaders(headers); 
        });

        parser.on("data", data => {
            if (data.type == "text") {
                let {text, html} = data;
                html = sanitize(html);
                result.body = {text, html};
                return;
            }
            
            data.content.on('end', () => {
                attachments.push(data);
                data.release();
            });

            return data.content.pipe(devNull());
        });
        
        parser.on("end", () => resolve(result));
        parser.end(email);
    });
};

module.exports.parseMessage = parseMessage;