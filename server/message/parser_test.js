const test = require("tape");
const { promisify } = require('util');
const { parseHeaders, parseMessage } = require("./parser");
const { composeEmail } = require("../fixtures/message");
const fs = require("fs");
const writeFile = promisify(fs.writeFile);

test("parse headers from file", async assert => {
    const filename = "/tmp/tmp.eml";
    const [email] = await composeEmail();
    await writeFile(filename, email);
    const headers = await parseHeaders(filename);

    const keys = [
        "contentType",
        "from",
        "to",
        "references",
        "subject",
        "date",
        "messageId",
        "contentTransferEncoding",
        "mimeVersion"
    ];

    assert.ok(keys.every(key => headers[key]), `all ${keys} present`);
    assert.end();
});

test("parse headers and body from file", async assert => {
    const filename = "/tmp/tmp.eml";
    const [email, options] = await composeEmail();
    await writeFile(filename, email);

    const {headers, body, attachments} = await parseMessage(filename);

    assert.equal(body.text.trim(), options.text.trim());

    const keys = [
        "contentType",
        "from",
        "to",
        "references",
        "subject",
        "date",
        "messageId",
        "contentTransferEncoding",
        "mimeVersion"
    ];

    assert.ok(keys.every(key => headers[key]), `all ${keys} present`);
    assert.deepEqual(attachments, []);

    assert.end();
});

test("parse headers from file, catch errors", async assert => {
    const filename = "/tmp/tmp.eml";
    await writeFile(filename, "sadfwsdfsdfsfsfs\nsadfsfs\nsfsdfds");
    const headers = await parseHeaders(filename);

    // assert.end();

    console.log(headers);

    setTimeout(assert.end, 1000);
});