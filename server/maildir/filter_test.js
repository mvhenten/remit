const Filters = require("./filter");
const test = require("tape");

test("it should return the filter matching", assert => {
    const headers = {
        to: "someone@example.com"
    };

    const message = { headers };

    const filter = {
        filter: "to:" + headers.to,
        target: "important"
    };

    const user = {
        filters: [filter]
    };

    const match = Filters.match(user, message);

    assert.deepEqual(match, {
        filter: [{ key: "to", value: headers.to }],
        target: filter.target
    });

    assert.end();
});

test("it should return partial match", assert => {
    const headers = {
        to: "someone@example.com"
    };

    const message = { headers };

    const filter = {
        filter: "to:" + "someone",
        target: "important"
    };

    const user = {
        filters: [filter]
    };

    const match = Filters.match(user, message);

    assert.deepEqual(match, {
        filter: [{ key: "to", value: "someone" }],
        target: filter.target
    });

    assert.end();
});

test("it should return first filter matching", assert => {
    const headers = {
        to: "someone@example.com"
    };

    const message = { headers };

    const filter = {
        filter: "to:" + headers.to,
        target: "important"
    };

    const user = {
        filters: [{
            filter: "from:" + headers.from
        }, filter]
    };

    const match = Filters.match(user, message);

    assert.deepEqual(match, {
        filter: [{ key: "to", value: headers.to }],
        target: filter.target
    });

    assert.end();
});

test("it should match text", assert => {
    const headers = {
        to: "someone@example.com"
    };

    const message = { headers };

    const filter = {
        filter: "someone",
        target: "important"
    };

    const user = {
        filters: [filter]
    };

    const match = Filters.match(user, message);

    assert.deepEqual(match, {
        filter: [{ key: "match", accept: "someone" }],
        target: filter.target
    });

    assert.end();
});

test("reject text", assert => {
    const headers = {
        to: "someone@example.com"
    };

    const message = { headers };

    const filter = {
        filter: "-someone",
        target: "important"
    };

    const user = {
        filters: [filter]
    };

    const match = Filters.match(user, message);

    assert.ok(!match, "no match found");
    assert.end();
});

test("reject text with matching", assert => {
    const headers = {
        to: "someone@example.com"
    };

    const message = { headers };

    const filter = {
        filter: "-someone example",
        target: "important"
    };

    const user = {
        filters: [filter]
    };

    const match = Filters.match(user, message);

    assert.ok(!match, "no match found");
    assert.end();
});
