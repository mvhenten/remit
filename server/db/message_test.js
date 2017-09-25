const test = require("tape");
const db = require("drawers/adapter/level").testDb();
const Message = require("./message");
const faker = require("faker");
const ms = require("milliseconds");

function randomDate() {
    return new Date(Date.now() - ms.days(Math.round(Math.random() * 100)));
}

const randomAddress = () => `${faker.name.findName()} <${faker.internet.email()}>`;

const getFakeId = () => (Math.random() * 10e16).toString(36);

const getMockData = (fakeId) => ({
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

