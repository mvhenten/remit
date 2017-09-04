"use strict";


const test = require("tape");
const testDb = require("./adapter/level").testDb();
const Person = require("./fixtures/person");
const createPersons = require("./fixtures/batch");
const collectStream = require("./util/collect-stream");

function uuid() {
    return `${Date.now().toString(36)}-${Math.random().toString(36)}`;
}

test("A db model is stored and can be loaded", (assert) => {
    let values = {
        id: uuid(),
        name: "Matt",
        age: 36,
        date: new Date("03-19-1979")
    };

    let person = new Person(testDb);

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

test("A db model is stored and loaded with async", async (assert) => {
    let values = {
        id: uuid(),
        name: "Matt",
        age: 36,
        date: new Date("03-19-1979")
    };

    let person = new Person(testDb);

    person = await person.store(values);

    assert.equal(person.name, values.name);

    person = await person.loadById(values);

    assert.equal(person.name, values.name);

    person.delete(assert.end);
});

test("a model stores a secondary index", assert => {
    let values = {
        id: uuid(),
        name: Math.random().toString(36),
        age: 36,
        date: new Date("03-19-1979")
    };

    let person = new Person(testDb);

    person.store(values, err => {
        assert.ok(!err, "no error");
        let key = `bydate~${values.name}~${values.date.getTime().toString(36)}~${values.id}`;

        testDb.get(key, (err, result) => {
            assert.ok(!err, "no error");
            assert.equal(result, values.id);
            assert.end();
        });
    });
});

test("A db model can be updated", (assert) => {
    let values = {
        id: uuid(),
        name: "Matt",
        age: 36,
        date: new Date("03-19-1979")
    };

    let person = new Person(testDb);

    person.store(values, err => {
        assert.ok(!err, "no error");
        let newValues = values;
        values.date = new Date();

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
        id: uuid(),
        name: "Matt2",
        age: 36,
        date: new Date("03-19-1979")
    };

    let person = new Person(testDb);

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
        id: uuid(),
        name: "Matt2",
        age: 36,
        date: new Date("03-19-1979")
    };

    let person = new Person(testDb);

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

    let person = new Person(testDb);

    let expect = [{
        type: 'put',
        key: `person~${values.id}`,
        value: {
            id: values.id,
            name: values.name,
            age: values.age,
            date: values.date
        }
    }, {
        type: 'put',
        key: `bydate~Matt2~${values.date.getTime().toString(36)}~${values.id}`,
        value: values.id
    }, {
        type: "put",
        key: `byage~36~${values.id}`,
        value: values.id
    }];

    person.batch("put", values, (err, batch) => {
        assert.ok(!err, "found no error: " + err);
        assert.deepEqual(batch, expect);
        assert.end();
    });
});


test("can stream all joes between a given date", assert => {
    let start = Date.now();
    let end = start + (1000 * 1000);

    let batch = createPersons(testDb, {
        name: "joe",
        start
    });

    batch.create(99, err => {
        let skey = `bydate~joe~${(start - 1).toString(36)}`;
        let ekey = `bydate~joe~${end.toString(36)}`;

        let count = 0;

        assert.ok(!err);

        testDb
            .createReadStream({
                gte: skey,
                lte: ekey
            })
            .on("data", ({key, value}) => {
                count++;
            })
            .on("end", () => {
                assert.ok(count, 99, "got all results back");
                batch.teardown(assert.end);
            });
    });
});

test("can stream all henries", assert => {
    let start = Date.now();

    const N_CREATE = 9;

    let batch = createPersons(testDb, {
        name: "henry",
        start
    });

    batch.create(N_CREATE, err => {
        assert.ok(!err, "no error");
        const person = new Person(testDb);
        const collect = collectStream();

        let query = {
            gte: {
                name: "henry",
                date: new Date(start)
            },
            lte: {
                name: "henry",
                date: new Date(start + 10000)
            }
        };

        person.streamByNameAndDate(query).pipe(collect).on("finish", (x) => {
            assert.equal(collect.values.length, N_CREATE);
            batch.teardown(assert.end);
        });
    });
});

