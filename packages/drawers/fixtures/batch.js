const Person = require("./person");

function uuid() {
    return `${Date.now().toString(36)}-${Math.random().toString(36)}`;
}

function createTestPersons(db, {name = "joe", start}) {
    let person = new Person(db);
    let batches = [];

    start = start || Date.now();

    function createBatch(n, done) {
        let values = {
            id: uuid(),
            name,
            age: Math.round(Math.random() * 99),
            date: new Date(start + n * 1000)
        };

        person.batch("put", values, done);
    }


    function create(n, done) {
        createBatch(n, (e, batch) => {
            n--;
            batches = batches.concat(batch);
            if (n) return create(n, done);
            db.batch(batches, done);
        });
    }

    function teardown(done) {
        let deleteBatch = batches.map(batch => {
            let op = Object.assign({}, batch);
            op.type = "del";
            return op;
        });

        db.batch(deleteBatch, done);
    }

    return {
        create,
        teardown
    };
}

module.exports = createTestPersons;
