const test = require("tape");
const Db = require("./leveldown");

test("it should create a db if it does not exist", async assert => {
    let db = new Db("/tmp/foo" + Date.now());

    await db.put("foo", {
        foo: 1,
        bar: 2
    });

    let value = await db.get("foo");

    assert.deepEqual(value, {
        foo: 1,
        bar: 2
    });
    assert.end();
});

test("it should create a db for reading if it does not exist", async assert => {
    let db = new Db("/tmp/foo" + Date.now() + Math.random());


    let value = await db.get("foo");

    assert.ok(!value, "no value");
    assert.end();
});