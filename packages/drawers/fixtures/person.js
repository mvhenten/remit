"use strict";

const Schema = require("../schema");

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

module.exports = Person;
