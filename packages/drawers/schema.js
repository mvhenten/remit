"use strict";

const Key = require("./key");
const izza = require("izza");
const promisify = require("util").promisify;

function promise(done, callback) {
    let p = promisify(callback);

    if (done) return p(done);
    return p();
}

function coerce(schema, values) {
    let coercedValues = {};

    for (let key in schema) {
        let value = values[key];
        let type = schema[key];

        if (izza.isa(Object, type) && type.coerce) {
            value = type.coerce(value);
            type = type.type;
        }

        coercedValues[key] = value;
    }

    return coercedValues;
}


function validate(schema, values, done) {
    values = coerce(schema, values);

    for (let key in schema) {
        let value = values[key];
        let type = schema[key];

        if (izza.isa(Object, type) && type.type) {
            type = type.type;
        }

        let err = izza.check(type, value);
        if (err) {
            err.message = `Validation failed for ${key}: ${err.message}`;
            if (done) return done(err);
            throw err;
        }
    }

    if (done)
        return done(null, values);

    return values;
}


function operation(type, key, value) {
    if (type == "put") {
        return {
            type,
            key,
            value
        };
    }

    if (type == "del") {
        return {
            type,
            key
        };
    }
}

function generateKey(index, values) {
    if (index.prepare)
        values = index.prepare(Object.assign({}, values));

    return Key.generate(index.key, values);
}

function operations(op, model, values) {
    let {indexes} = model.storage;

    let ops = indexes.map(index => operation(op, generateKey(index, values), index.value(values)));

    return ops;
}


const ucfirst = str => `${str.substr(0, 1).toUpperCase()}${str.substr(1)}`;

function generateLoaders() {
    let {indexes} = this.storage;

    indexes.forEach(index => {
        if (!index.name) return;

        let loaderName = "load" + ucfirst(index.name);

        this.constructor.prototype[loaderName] = function(values, done) {
            return this.loadByKey(index.key, values, done);
        };

        let streamName = "stream" + ucfirst(index.name);

        this.constructor.prototype[streamName] = function(query, next) {
            return this.streamByKey(index.name, query, next);
        };
    });
}

const self = new WeakMap();

function generateGetters() {
    let {schema} = this.storage;

    Object.keys(schema).forEach(key => {
        if (key in this.constructor.prototype)
            return;

        Object.defineProperty(this.constructor.prototype, key, {
            get: function() {
                return this.values[key];
            }
        });
    });
}



class Schema {
    constructor(db, values) {
        if (values)
            values = validate(this.storage.schema, values);


        self.set(this, {
            db,
            values
        });

        if (Object.isFrozen(this.constructor.prototype))
            return;

        generateGetters.call(this);
        generateLoaders.call(this);

        Object.freeze(this.constructor.prototype);
    }

    get values() {
        let {values} = self.get(this);

        let {schema} = this.storage;

        if (!values)
            throw new Error(`${this.constructor.name} has not been initialized!`);

        return coerce(schema, values);
    }

    loadByKey(key, values, done) {
        return promise(done, done => {
            let {db} = self.get(this);

            let index = this.storage.indexes.find(index => index.key == key);
            if (!index) return done(new Error("Invalid key: " + key));

            let err = izza.check(Object, values);

            if (err) return done(err);

            db.get(generateKey(index, values), (err, result) => {
                if (err) return done(err);
                if (!result) return done();

                done(null, new this.constructor(db, result));
            });
        });
    }

    streamByKey(keyName, query, next) {
        let index = this.storage.indexes.find(index => index.name == keyName);
        if (!index) return next(new Error("Invalid key name: " + keyName));

        let {db} = self.get(this);
        let parsedQuery = Object.assign({}, query);

        ["lt", "gt", "lte", "gte"].forEach(key => {
            if (!query[key])
                return;

            let parsedKey = generateKey(index, query[key]);
            parsedQuery[key] = parsedKey.replace(/::?$/, '');
        });

        parsedQuery.valueEncoding = "json";

        let stream = db.createReadStream(parsedQuery);

        if (index.transform)
            return stream.pipe(index.transform(this));

        return stream;
    }

    batch(operation, values, done) {
        let {schema} = this.storage;

        if (!/^(put|del)$/.test(operation))
            return done(new Error("You can only batch 'put' and 'del'"));

        validate(schema, values, (err, values) => {
            if (err) return done(err);
            return done(null, operations(operation, this, values));
        });
    }


    store(values, done) {
        return promise(done, done => {
            let {db, } = self.get(this);

            let {schema} = this.storage;

            validate(schema, values, (err, values) => {
                if (err) return done(err);

                db.batch(operations("put", this, values), err => {
                    let me = new this.constructor(db, values);
                    done(err, me);
                });
            });
        });
    }

    update(values, done) {
        return promise(done, done => {
            let {schema, indexes} = this.storage;

            let index = indexes.find(index => index.name == this.storage.index);

            if (!index)
                return done(new Error(`Cannot update ${this.name} without a primary key`));

            validate(schema, values, (err, values) => {
                if (err) return done(err);

                this.loadByKey(index.key, values, (err, result) => {
                    if (err) return done(err);
                    if (!result) this.store(values, done);

                    result.delete(err => {
                        if (err) return done(err);
                        this.store(values, done);
                    });
                });
            });
        });
    }

    delete(values, done) {
        if (!done)
            return this.delete(this.values, values);

        let {db} = self.get(this);

        let {schema} = this.storage;

        validate(schema, values, (err, values) => {
            if (err) return done(err);

            db.batch(operations("del", this, values), err => {
                if (err) return done(err);
                done(err, new this.constructor(db, values));
            });
        });
    }

    toJSON() {
        return Object.assign({}, this.values);
    }
}

module.exports = Schema;