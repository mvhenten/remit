const test = require("tape");
const { promisify } = require('util');
const { parseHeaders } = require("./headers");
const { composeEmail } = require("./fixtures/message");
const fs = require("fs");
const writeFile = promisify(fs.writeFile);

test("parse headers from file", async assert => {
    const filename = "/tmp/tmp.eml";

    const email = await composeEmail();
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