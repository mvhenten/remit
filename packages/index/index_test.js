const test = require("tape");
const sinon = require("sinon");
const db = require("../db/db");
const fs = require("fs");

const testStore = require("drawers/adapter/level").testDb();
const Message = require("../db/message");
testStore.Message = new Message(testStore);

const MaildirMessage = require("../maildir/message");
const { composeEmail } = require("../maildir/fixtures/message");

const EventEmitter = require("events");
const Index = require("./index");

test("it parses headers", async assert => {
    const filename = `/tmp/tmp-${Math.random()}.eml:2,X`;
    const email = await composeEmail();

    fs.writeFileSync(filename, email);
    
    sinon.stub(db, "load").returns(testStore);

    const message = new MaildirMessage({}, filename);
    
    const maildir = new EventEmitter();
    
    Index.init({maildir});
    
    maildir.emit("delivered", message);
    
    maildir.on("indexed", msg => {
        const {flags, inbox, to} = msg.values;
        
        assert.deepEqual(flags, message.flags);
        assert.equal(to, message.headers.to);
        assert.equal(inbox, message.inbox);


        assert.end();
    });
});

