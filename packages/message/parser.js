"use strict";

const fs = require("graceful-fs");
const MailParser = require("mailparser").MailParser;

const promisfy = require("util").promisify;
const readFile = promisfy(fs.readFile);
const devNull = require("dev-null");
const sanitizeHtml = require("sanitize-html");
const Url = require("url");

function sanitize(html) {
    return sanitizeHtml(html, {
        allowedTags: ['h3', 'h4', 'h5', 'h6', 'blockquote', 'p', 'a', 'ul', 'ol',
            'nl', 'li', 'b', 'i', 'strong', 'em', 'strike', 'code', 'hr', 'br', 'div',
            'table', 'thead', 'caption', 'tbody', 'tr', 'th', 'td', 'pre', 'img'
        ],
        allowedAttributes: {
            "*": ["style"],
            img: ["alt", "width", "data-*", "class"],
            a: ['href', 'name', 'target'],
        },
        selfClosing: ['img', 'br', 'hr', 'area', 'base', 'basefont', 'input', 'link', 'meta'],
        allowedSchemes: ['https', 'mailto'],
        allowedSchemesByTag: {},
        allowProtocolRelative: true,
        transformTags: {
            'img': function(tagName, attribs) {
                const parsed = Url.parse(attribs.src);

                if (!/(png|jpg|gif)$/.test(parsed.pathname))
                    return {};

                attribs["data-src"] = attribs.src || "";
                attribs["data-style"] = attribs.style || "";
                attribs.class = "remit-image-placeholder";

                return {
                    tagName: 'img',
                    attribs: attribs
                };
            }
        }
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

async function parseHeaders(email) {
    let parser = new MailParser();

    if (typeof email == "string")
        email = await readFile(email);

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

const parseMessage = async(email) => {
    let parser = new MailParser();

    if (typeof email == "string")
        email = await readFile(email);

    return new Promise((resolve, reject) => {
        const attachments = [];
        const result = { attachments };

        parser.on("headers", headers => {
            result.headers = processHeaders(headers);
        });

        parser.on("data", data => {
            if (data.type == "text") {
                let { text, html } = data;
                html = sanitize(html);
                result.body = { text, html };
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