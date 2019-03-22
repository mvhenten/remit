const test = require("tape");
const os = require("os");
const path = require("path");
const level = require("./multilevel-hyper");

test("it can open two databases", async assert => {
    const dir = path.join(os.tmpdir(), Math.random().toString(36));
    const server = level(dir).listen();


    const a = level.createClient();
    const b = level.createClient();

    const value = Math.random();

    await a.put("foo", value);

    const resa = await a.get("foo");
    const resb = await b.get("foo");

    assert.equal(resa, value);
    assert.equal(resb, value);

    a.close();

    await server.close();
    assert.end();
});

test("clients can create levels", async assert => {
    const dir = path.join(os.tmpdir(), Math.random().toString(36));
    const server = level(dir).listen();

    const a = level.createClient("levelb");
    const b = level.createClient("levelb");

    const value = Math.random();

    await a.put("foo", value);

    const resa = await a.get("foo");
    const resb = await b.get("foo");

    assert.equal(resa, value);
    assert.equal(resb, value);

    server.close();
    assert.end();
});

test("server can destroy", async assert => {
    const dir = path.join(os.tmpdir(), Math.random().toString(36));
    const server = level(dir).listen();
    await server.destroy();
    assert.end();
});

test("keys are stored in range", async assert => {
    const dir = path.join(os.tmpdir(), Math.random().toString(36));
    const server = level(dir).listen();

    const client = level.createClient();
    let keys = [];

    for (let i = 0; i < 10; i++) {
        keys.push(new Date(Date.now()+(i*3000)).toISOString());
    }

    // bad random, enough to prove a point
    keys = keys.sort(() => Math.random() - 0.5);

    for (let key of keys) {
        await client.put(key.toString(), "one");
    }

    const stream = client.createReadStream();
    const results = [];

    stream.on('data', ({key, value}) => {
        results.push(key.toString());
    });

    stream.on("error", () => console.log("err", arguments));

    stream.on("end", () => {
        stream.destroy();
        // stream.end();
        assert.deepEqual(keys.sort(), results);
        server.close();
        assert.end();
    });
});