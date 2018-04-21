# drawers

Basic schema implementation for leveldb databases

## Installation

    npm install drawers

## Usage

Drawers implements a schema for your leveldb database, allowing you to manage our
indexes in a declarative way:

```javascript
    const Schema = require("drawers/schema");

    class Person extends Schema {
        get storage() {
            return {
                index: "byId",

                schema: {
                    id: String,
                    name: String,
                    age: Number,
                    date: Date
                },

                indexes: [{
                    name: "byId",
                    key: "person:$id",
                    value: (values) => values
                }, {
                    name: "byDate",
                    key: "byDate:$date:$id",
                    value: (values) => values.id
                }, {
                    name: "byAge",
                    key: "byAge:$age:$id",
                    value: (values) => values.id
                }]
            };
        }
    }
```

The above example validates input and introduces a set of helper methods for querying
your dataset:

```javascript
    const run = async () {
        let db = require("drawers/adapter/memdown");

        let values = {
            id: fakeId(),
            name: "Matt",
            age: 36,
            date: new Date("03-19-1979")
        };

        let person = new Person(db());

        // validate input and stores indexes
        await person.store(values);

        // load person from db
        let myPerson = await person.loadById({ id: values.id });

        // schema values have getters
        console.log(myPerson.name);

        // deletes all keys and indexes
        await person.delete();

        // stream key/values stored in the index "byAge"
        // we can query values between keys thanks to "bytewise"
        person.streamByAge({
            start: {
                age: 9
            },
            end: {
                age: 14
            }
        }).on("data", result => {
            console.log(result.key, result.value);
        })
        .on("finish", console.log);

    }

```

## Pagination

Pagination is supported. The last result will be a pagination key, see [./schema_test.js#L323].

```javascript
        person.streamByAge()
        .limit(5)
        .on("data", result => {
            console.log(result.key, result.value);
        })
        .on("finish", console.log);
```

## Features

Drawers supports a bunch of handy features:

* Type validation using [https://github.com/mvhenten/izza](izza).
* Declarative indexes
* Tansform streams for results from indexes
* Pagination on streams
* Coerce values from input
* Stream JSON fragments (for http chunking)
* Stream utilities for transforming data
* sublevel indexes

see [/fixtures/person.js](./fixtures/person.js) for schema implemenation
see [/schema_test.js](./schema_test.js) for tests
