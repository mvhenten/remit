"use strict";

const Schema = require("../schema");

console.log(Schema);

class Person extends Schema {
    get storage() {
        return {
            index: "byId",

            schema: {
                id: String,
                name: String,
                age: Number,
                date: {
                    type: Date,
                    coerce: (date) => typeof date == "string" ? new Date(date) : date
                }
            },

            indexes: [{
                name: "byId",
                key: "person:$id",
                value: (values) => values
            }, {
                name: "byNameAndDate",
                prepare: (values) => {
                    values.date = values.date.getTime().toString(36);
                    return values;
                },
                key: "bydate:$name:$date:$id",
                value: (values) => values.id
            }, {
                name: "byAge",
                key: "byage:$age:$id",
                value: (values) => values.id
            }]
        };
    }
}

module.exports = Person;
