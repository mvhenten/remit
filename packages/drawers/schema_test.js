"use strict";

const test = require("tape");
const Person = require("./fixtures/person");
const ms = require("milliseconds");
const collectStream = require("./util/collect-stream");
const Schema = require("./schema");
const { Transform } = require("stream");

const testDb = require("./adapter/memdown");

function fakeId() {
    return `${Date.now().toString(36)}-${Math.random().toString(36)}`;
}

test("A db model is stored and can be loaded", (assert) => {
    let values = {
        id: fakeId(),
        name: "Matt",
        age: 36,
        date: new Date("03-19-1979")
    };
    let person = new Person(testDb());

    person.store(values, (err, person) => {
        assert.ok(!err, "no err");
        assert.equal(person.name, values.name);

        person.loadById(values, (err, person) => {
            assert.ok(!err, "no error" + err);
            assert.equal(person.name, values.name);

            person.delete(err => {
                assert.ok(!err, "no error");
                assert.end();
            });
        });
    });
});

test("A db model is stored and loaded with async", async(assert) => {
    let values = {
        id: fakeId(),
        name: "Matt",
        age: 36,
        date: new Date("03-19-1979")
    };

    let person = new Person(testDb());

    person = await person.store(values);

    assert.equal(person.name, values.name);

    person = await person.loadById(values);

    assert.equal(person.name, values.name);

    person.delete(assert.end);
});

test("a model stores a secondary index", assert => {
    let values = {
        id: fakeId(),
        name: Math.random().toString(36),
        age: 36,
        date: new Date("03-19-1979")
    };

    let person = new Person(testDb());

    person.store(values, err => {
        assert.ok(!err, "no error");

        person.loadByDate(values, function(err, id) {
            assert.ok(!err, "no error");
            assert.equal(id, values.id);
            assert.end();
        });
    });
});

test("A db model can be updated", (assert) => {
    let values = {
        id: fakeId(),
        name: "Matt",
        age: 36,
        date: new Date("03-19-1979")
    };

    let person = new Person(testDb());

    person.store(values, err => {
        assert.ok(!err, "no error");
        let newValues = values;
        values.date = new Date("03-19-1980");

        person.update(newValues, (err, person) => {
            assert.ok(!err, "no error:" + err);
            assert.equal(person.date, newValues.date);

            person.loadById(values, (err, person) => {
                assert.ok(!err, "no error loadById");
                assert.equal(new Date(person.date).getTime(), newValues.date.getTime());
                assert.end();
            });
        });
    });
});

test("A db model can define getters", assert => {
    let values = {
        id: fakeId(),
        name: "Matt2",
        age: 36,
        date: new Date("03-19-1979")
    };

    let person = new Person(testDb());

    person.store(values, err => {
        assert.ok(!err);

        person.loadById(values, (err, person) => {
            assert.ok(!err, "found no error: " + err);
            assert.ok(person.date instanceof Date, "Date was converted");
            assert.deepEqual(person.date, values.date, "we got a real date");
            assert.end();
        });
    });
});

test("load does not throw errors", assert => {
    let values = {
        id: fakeId(),
        name: "Matt2",
        age: 36,
        date: new Date("03-19-1979")
    };

    let person = new Person(testDb());

    person.loadById(values, (err, person) => {
        assert.ok(!err, "found no error: " + err);
        assert.ok(!person, "no result found");
        assert.end();
    });
});

test("it can return batch operations", assert => {
    let values = {
        id: (Math.random() * 10e16).toString(36),
        name: "Matt2",
        age: 36,
        date: new Date("03-19-1979")
    };

    let db = testDb();
    let person = new Person(db);

    let expect = [{
            type: 'put',
            key: [values.id],
            value: values,
            prefix: db.sublevel("person")
        },
        {
            type: 'put',
            key: [values.date, values.id],
            value: values.id,
            prefix: db.sublevel("byDate")
        },
        {
            type: 'put',
            key: [values.age, values.id],
            value: values.id,
            prefix: db.sublevel("byAge")
        }
    ];

    person.batch("put", values, (err, batch) => {
        assert.ok(!err, "found no error: " + err);
        assert.deepEqual(batch, expect);
        assert.end();
    });
});

test("it can stream by date", async assert => {
    let db = testDb();
    let person = new Person(db);
    const collect = collectStream();

    let batch = [];
    const N_TO_CREATE = 10;

    for (let i = 0; i < N_TO_CREATE; i++) {
        let values = await person.batch("put", {
            id: (Math.random() * 10e16).toString(36),
            name: "Batched person " + i,
            age: 36,
            date: new Date(Date.now() - ms.days(N_TO_CREATE - i))
        });

        batch = batch.concat(values);
    }

    await db.batch(batch);

    person.streamByDate({
        reverse: true,
        start: {
            date: new Date()
        },
        end: {
            date: new Date(Date.now() - ms.days(22))
        }
    }).pipe(collect);

    collect.on("finish", () => {
        assert.deepEqual(collect.values.length, N_TO_CREATE);
        assert.end();
    });
});

test("it can query results between two keys", async assert => {
    let db = testDb();
    let person = new Person(db);
    const collect = collectStream();

    let batch = [];

    const N_TO_CREATE = 10;
    const rawValues = [];

    for (let i = 0; i < N_TO_CREATE; i++) {
        let data = {
            id: (Math.random() * 10e16).toString(36),
            name: "Batched person " + i,
            age: 10 + i,
            date: new Date()
        };

        let values = await person.batch("put", data);

        rawValues.push(data);
        batch = batch.concat(values);
    }

    await db.batch(batch);

    person.streamByAge({
        start: {
            age: 9
        },
        end: {
            age: 14
        }
    }).pipe(collect);

    collect.on("finish", () => {
        let expect = rawValues.slice(0, 5).map(value => ({
            key: [value.age, value.id],
            value: value.id
        }));

        assert.deepEqual(collect.values, expect);
        assert.end();
    });
});

async function createPersonsBatch(person, N_TO_CREATE = 10) {
    let batch = [];

    const rawValues = [];

    for (let i = 0; i < N_TO_CREATE; i++) {
        let data = {
            id: (Math.random() * 10e16).toString(36),
            name: "Batched person " + i,
            age: 10 + i,
            date: new Date()
        };

        let values = await person.batch("put", data);

        rawValues.push(data);
        batch = batch.concat(values);
    }

    return [batch, rawValues];
}

test("it can query results between two keys", async assert => {
    let db = testDb();
    let person = new Person(db);
    const collect = collectStream();

    const N_TO_CREATE = 10;

    const [batch, rawValues] = await createPersonsBatch(person, N_TO_CREATE);
    await db.batch(batch);

    person.streamByAge({
        start: {
            age: 9
        },
        end: {
            age: 14
        }
    }).pipe(collect);

    collect.on("finish", () => {
        let expect = rawValues.slice(0, 5).map(value => ({
            key: [value.age, value.id],
            value: value.id
        }));

        assert.deepEqual(collect.values, expect);
        assert.end();
    });
});

test("it can limit results", async assert => {
    let db = testDb();
    let person = new Person(db);
    const collect = collectStream();

    const N_TO_CREATE = 10;

    const [batch, rawValues] = await createPersonsBatch(person, N_TO_CREATE);
    await db.batch(batch);

    person.streamByAge({ reverse: true })
        .limit(5)
        .pipe(collect);

    collect.on("finish", () => {
        let values = collect.values;
        let paginationKey = values.pop();

        let lastExpected = rawValues[4];

        assert.deepEqual(paginationKey, {
            paginationKey: [lastExpected.age, lastExpected.id]
        });

        let expect = rawValues.slice(-5).map(value => ({
            key: [value.age, value.id],
            value: value.id
        })).reverse();

        assert.deepEqual(values, expect);
        assert.end();
    });
});

test("it can transform results", async assert => {
    let db = testDb();
    let person = new Person(db);
    const collect = collectStream();

    const N_TO_CREATE = 10;

    const [batch, rawValues] = await createPersonsBatch(person, N_TO_CREATE);
    await db.batch(batch);

    person.streamByAge({ reverse: true })
        .transform(chunk => chunk.value)
        .pipe(collect);

    collect.on("finish", () => {
        let values = collect.values;
        let expected = rawValues.map(value => value.id);

        assert.deepEqual(values, expected.reverse());
        assert.end();
    });
});


test("it can apply a transform", async assert => {
    function loadCarStream(self) {
        return new Transform({
            objectMode: true,
            async transform(chunk, encoding, next) {
                let id = chunk.value;
                let key = chunk.key;
                let value = await self.loadById({ id });
                next(null, { value, key });
            }
        });
    }


    class Car extends Schema {
        get storage() {
            return {
                index: "byId",

                schema: {
                    id: String,
                    brand: String,
                },

                indexes: [{
                    name: "byId",
                    key: "car:$id",
                    value: (values) => values
                }, {
                    name: "byBrand",
                    key: "byBrand:$brand:$id",
                    transform: loadCarStream,
                    value: (values) => values.id
                }]
            };
        }
    }

    let db = testDb();
    let car = new Car(db);

    let values = [{
            id: Math.random().toString(36),
            brand: "Mercedes"
        },
        {
            id: Math.random().toString(36),
            brand: "Opel"
        },
        {
            id: Math.random().toString(36),
            brand: "Mazda"
        }
    ];

    let batch = [];

    for (let value of values) {
        batch = batch.concat(await car.batch("put", value));
    }

    await db.batch(batch);
    const collect = collectStream();

    car.streamByBrand().pipe(collect);

    collect.on("finish", () => {
        let values = collect.values.map(res => res.value);

        assert.ok(values.length, 3);
        assert.ok(values.every(value => value instanceof Car));

        assert.end();
    });
});