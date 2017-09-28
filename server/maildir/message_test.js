const test = require("tape");
const Message = require("./message");
const fs = require("fs");

const { promisify } = require('util');
const { composeEmail } = require("./fixtures/message");

const mkdirp = promisify(require("mkdirp"));
const writeFile = promisify(fs.writeFile);
const access = promisify(fs.access);


test("it parses headers", async assert => {
    const filename = `/tmp/tmp-${Math.random()}.eml`;
    const email = await composeEmail();

    fs.writeFileSync(filename, email);

    const message = new Message({}, filename);
    await message.parseHeaders();

    assert.ok(message.headers, "headers populated");

    assert.end();
});

test("it creates a new message", async assert => {
    const fakeMaildir = `/tmp/${Math.random()}/`;
    const fakeInbox = "important";
    const filename = `${fakeMaildir}${fakeInbox}/tmp-${Math.random()}.eml:2,S`;
    const email = await composeEmail();
    const fakeUser = { maildir: fakeMaildir };

    await mkdirp(fakeMaildir + fakeInbox);
    await writeFile(filename, email);

    const message = new Message(fakeUser, filename);

    assert.equal(message.inbox, fakeInbox, "got expected inbox");
    assert.deepEqual(message.flags, { seen: true }, "got expected flags");

    message.seen = false;

    await message.store();

    assert.equal(message.path, filename.replace(/:.+/, ""));
    assert.ok(!await access(message.path), "message was moved");

    assert.end();
});

test("it updates inbox", async assert => {
    const fakeMaildir = `/tmp/${Math.random()}/`;
    const fakeInbox = "important";
    const filename = `${fakeMaildir}${fakeInbox}/tmp-${Math.random()}.eml:2,S`;
    const email = await composeEmail();
    const fakeUser = { maildir: fakeMaildir };

    await mkdirp(fakeMaildir + fakeInbox);
    await writeFile(filename, email);

    const message = new Message(fakeUser, filename);

    assert.equal(message.inbox, fakeInbox, "got expected inbox");
    
    message.inbox = "new";
    message.flags = { seen: false };
    
    await message.store();
    
    assert.ok(!await access(message.path), "message was moved");
    assert.equal(message.inbox, ".new");
    assert.deepEqual(message.flags, { seen: false });

    assert.end();
})

test("it creates new message", async assert => {
    // const fakeInbox = "important";
    // const filename = `${fakeMaildir}${fakeInbox}/tmp-${Math.random()}.eml:2,S`;
    // const email = await composeEmail();
    const fakeMaildir = `/tmp/${Math.random()}/`;
    const fakeUser = { maildir: fakeMaildir };

    // await mkdirp(fakeMaildir + fakeInbox);
    // await writeFile(filename, email);

    // const message = new Message(fakeUser, filename);
    
    console.log(Message.compose);
    

    // assert.equal(message.inbox, fakeInbox, "got expected inbox");
    
    // message.inbox = "new";
    // message.flags = { seen: false };
    
    // await message.store();
    
    // assert.ok(!await access(message.path), "message was moved");
    // assert.equal(message.inbox, ".new");
    // assert.deepEqual(message.flags, { seen: false });

    assert.end();
})