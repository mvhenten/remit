const test = require("tape");
const db = require("drawers/adapter/level").testDb();
const Message = require("./message");
const faker = require("faker");
const ms = require("milliseconds");
const {pullStream} = require("./util/stream");

function randomDate() {
    return new Date(Date.now() - ms.days(Math.round(Math.random() * 100)));
}

const randomAddress = () => `${faker.name.findName()} <${faker.internet.email()}>`;

const getFakeId = () => (Math.random() * 10e16).toString(36);

const getMockData = (fakeId=getFakeId()) => ({
        path: "/tmp",
        subject: faker.company.catchPhrase(),
        messageId: fakeId,
        inbox: "important",
        references: [],
        flags: {
            unseen: true
        },
        date: randomDate(),
        from: randomAddress(),
        to: [randomAddress()]
});

test("it should store an article", async assert => {
    const message = new Message(db);
    
    const fakeId = getFakeId();
    const mockData = getMockData(fakeId);

    try {
        const { messageId } = await message.store(mockData);
        const result = await message.loadByMessageId({ messageId });

        assert.deepEqual(result.values, {
            path: "/tmp",   
            contentType: undefined,
            mimeVersion: undefined,
            subject: mockData.subject,
            inbox: 'important',
            flags: { unseen: true },
            from: mockData.from,
            to: mockData.to,
            date: mockData.date,
            references: [],
            parentId: Message.coerceMessageId(fakeId),
            messageId: Message.coerceMessageId(fakeId)
        });

    }
    catch (err) {
        assert.fail(err);
    }

    assert.end();
});

test("it should store parentId", async assert => {
    const message = new Message(db);
    
    const fakeId = getFakeId();
    const fakeParent = getFakeId();
    const mockData = getMockData(fakeId);
    
    mockData.references = fakeParent;

    try {
        const { messageId } = await message.store(mockData);
        const result = await message.loadByMessageId({ messageId });

        assert.deepEqual(result.values, {
            path: "/tmp",   
            contentType: undefined,
            mimeVersion: undefined,
            subject: mockData.subject,
            inbox: 'important',
            flags: { unseen: true },
            from: mockData.from,
            to: mockData.to,
            date: mockData.date,
            references: [fakeParent],
            parentId: Message.coerceMessageId(fakeParent),
            messageId: Message.coerceMessageId(fakeId)
        });

    }
    catch (err) {
        assert.fail(err);
    }

    assert.end();
});

test("it should stream all children of a parent", async assert => {
    const message = new Message(db);
    
    const fakeParent = getFakeId();
    const expect = [];

    for (var i = 0; i < 10; i++) {
        let fakeId = getFakeId();
        let mockData = getMockData(fakeId);
        mockData.references = fakeParent;
        let result = await message.store(mockData);
        expect.push(result);
    }
    
    const bydate = expect.sort((a, b) => a.date.getTime() - b.date.getTime());
    
    const start = bydate[0];
    const [end] = bydate.slice(-1);
    
    try {
        const {messageId} = expect[0];
        const result = await message.loadByMessageId({ messageId });
        const stream = message.streamFromParentIdAndDate(result.parentId, {
            start: start.date,
            end: end.date.getTime() + 100
        });

        let messages = await pullStream(stream);
        
        messages = messages.map(msg => msg.value);
        assert.ok(messages.length, expect.length);

        expect.forEach(({messageId}) => {
            let present = messages.find(msg => msg.messageId == messageId);
            assert.ok(present, "found message for id " + messageId);
        });
    }
    catch (err) {
        assert.fail(err);
    }

    assert.end();
});

test("it should stream messages by thread", async assert => {
    const message = new Message(db);
    
    const expect = [];
    const inbox = "superthread";

    for (var i = 0; i < 10; i++) {
        const fakeParent = getFakeId();
        
        const thread = [];

        for (var j = 0; j < 10; j++) {
            let mockData = getMockData();
            mockData.inbox = inbox;
            mockData.references = fakeParent;
            let result = await message.store(mockData);
            thread.push(result);
        }
        
        expect.push(thread);
    }

    try {
        let start = Date.now() - ms.days(200);
        let end   = Date.now() + ms.days(200);

        const stream = message.streamByThread(inbox, {start, end});
        let messages = await pullStream(stream);

        assert.ok(messages.length, expect.length);
        
        expect.forEach(expected => {
           let expectedParent = expected[0].parentId;
           
           const messagesForParent = messages.find(thread => {
               const {parentId} = thread[0];
               return parentId == expectedParent;
           });
           
          expected.forEach(({messageId}) => {
              const present = messagesForParent.find(message => message.messageId == messageId);
              
              assert.ok(present, `message ${messageId} present`);
          });
        });
    }
    catch (err) {
        assert.fail(err);
    }

    assert.end();
    
});

