const test = require("tape");
const levelup = require('levelup');
const memdown = require('memdown');

const StreamWrapper = require("./stream");

function testDb() {
    return levelup(memdown());
}

test("we can limit results and get a pagination key", async assert => {
    let data = Array(10).fill("").map((value, index) => ({
        type: "put",
        key: "testKey-" + index,
        value: "testValue-" + index
    }));

    const db = testDb();
    await db.batch(data);
    const collect = [];

    db.createReadStream({
            keyAsBuffer: false,
            valueAsBuffer: false
        })
        .pipe(new StreamWrapper())
        .limit(5)
        .on("data", (chunk) => collect.push(chunk))
        .on("end", () => {
            let expect = data.slice(0, 5).map(({ key, value }) => ({ key, value }));
            let last = collect.pop();

            assert.deepEqual(last, { paginationKey: "testKey-5" });
            assert.deepEqual(collect, expect);

            assert.end();
        });
});

test("we can use the paginationKey to query the next set", async assert => {
    let data = Array(10).fill("").map((value, index) => ({
        type: "put",
        key: "testKey-" + index,
        value: "testValue-" + index
    }));

    const db = testDb();
    await db.batch(data);
    let collect = [];

    db.createReadStream({
            keyAsBuffer: false,
            valueAsBuffer: false
        })
        .pipe(new StreamWrapper())
        .limit(5)
        .on("data", (chunk) => collect.push(chunk))
        .on("end", () => {
            let last = collect.pop();
            let newCollect = [];

            db.createReadStream({
                    start: last.paginationKey,
                    keyAsBuffer: false,
                    valueAsBuffer: false
                })
                .pipe(new StreamWrapper())
                .limit(5)
                .on("data", (chunk) => newCollect.push(chunk))
                .on("end", () => {
                    let expect = data.slice(5).map(({ key, value }) => ({ key, value }));
                    assert.deepEqual(newCollect, expect);
                    assert.end();
                });
        });
});

test("transform changes the stream", async assert => {
    let data = Array(10).fill("").map((value, index) => ({
        type: "put",
        key: "testKey-" + index,
        value: "testValue-" + index
    }));

    const db = testDb();
    await db.batch(data);

    let collect = [];

    db.createReadStream({
            keyAsBuffer: false,
            valueAsBuffer: false
        })
        .pipe(new StreamWrapper())
        .transform((chunk) => {
            return { chunk };
        })
        .on("data", (chunk) => collect.push(chunk))
        .on("end", () => {
            let expect = data.map(({ key, value }) => ({ chunk: { key, value } }));
            assert.deepEqual(collect, expect);
            assert.end();
        });
});

test("prepend adds to the beginning of the stream", async assert => {
    const db = testDb();

    await db.put("justakey", "just a value");

    let collect = [];

    db.createReadStream({
            keyAsBuffer: false,
            valueAsBuffer: false
        })
        .pipe(new StreamWrapper())
        .prepend({ foo: 1 })
        .on("data", (chunk) => collect.push(chunk))
        .on("end", () => {
            assert.deepEqual(collect, [{ foo: 1 }, { key: 'justakey', value: 'just a value' }]);
            assert.end();
        });
});

test("limit, transform and prepend are chainable", async assert => {
    let data = Array(10).fill("").map((value, index) => ({
        type: "put",
        key: "testKey-" + index,
        value: "testValue-" + index
    }));

    const db = testDb();
    await db.batch(data);

    let collect = [];

    db.createReadStream({
            keyAsBuffer: false,
            valueAsBuffer: false
        })
        .pipe(new StreamWrapper())
        .transform((chunk) => ({ chunk }))
        .limit(5)
        .prepend({ foo: 1 })
        .on("data", (chunk) => collect.push(chunk))
        .on("end", () => {
            let first = collect.shift();
            let last = collect.pop();

            assert.deepEqual(last, { paginationKey: 'testKey-5' });
            assert.deepEqual(first, { foo: 1 });

            let expect = data.slice(0, 5).map(({ key, value }) => ({ chunk: { key, value } }));
            assert.deepEqual(collect, expect);
            assert.end();
        });
});

test("collect values", async assert => {
    let data = Array(10).fill("").map((value, index) => ({
        type: "put",
        key: "testKey-" + index,
        value: "testValue-" + index
    }));

    const db = testDb();
    await db.batch(data);

    let collect = db.createReadStream({
            keyAsBuffer: false,
            valueAsBuffer: false
        })
        .pipe(new StreamWrapper())
        .collect()
        .on("finish", () => {
            let expect = data.map(({ key, value }) => ({ key, value }));
            assert.deepEqual(collect.values, expect);
            assert.end();
        });
});

test("stream values as valid JSON", async assert => {
    let data = Array(10).fill("").map((value, index) => ({
        type: "put",
        key: "testKey-" + index,
        value: "testValue-" + index
    }));

    const db = testDb();
    await db.batch(data);

    let collect = "";

    db.createReadStream({
            keyAsBuffer: false,
            valueAsBuffer: false
        })
        .pipe(new StreamWrapper())
        .toJSONStream()
        .on("data", string => collect += string)
        .on("finish", () => {
            let expect = data.map(({ key, value }) => ({ key, value }));
            let json = JSON.parse(collect);
            assert.deepEqual(json, expect);
            assert.end();
        });
});