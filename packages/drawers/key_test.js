const test = require("tape");
const Key = require("./key");

test("It parse a formatter", (assert) => {
    let expect = ['pfx', {
        name: 'foo'
    }, {
        name: 'foo',
        node: [{
            name: "bar"
        }]
    }];

    let result = Key.parse("pfx:$foo:$foo.bar");

    assert.deepEqual(result, expect);
    assert.end();
});

test("It formats a parsed key", (assert) => {
    let fmt = Key.parse("pfx:$foo:$biz.bar");
    let expect = ['pfx', 123, 456].join("~");

    let result = Key.format(fmt, {
        foo: 123,
        biz: {
            bar: 456
        }
    });

    assert.deepEqual(result, expect);
    assert.end();
});



test("It formats a string key", (assert) => {
    let fmt = "pfx:$foo:$biz.bar";
    let expect = ['pfx', 123, 456].join("~");


    let result = Key.format(fmt, {
        foo: 123,
        biz: {
            bar: 456
        }
    });

    assert.deepEqual(result, expect);
    assert.end();
});

test("It formats a nested string key", (assert) => {
    let fmt = "pfx:$foo:$biz.bar.baz";
    let expect = ['pfx', 123, 456].join("~");


    let result = Key.format(fmt, {
        foo: 123,
        biz: {
            bar: {
                baz: 456
            }
        }
    });

    assert.deepEqual(result, expect);
    assert.end();
});

test("It formats a double nested key", assert => {
    let fmt = "pfx:$biz.barnode:$biz.baz";

    let values = {
        biz: {
            barnode: 1,
            baz: 2
        }
    };

    let result = Key.format(fmt, values);

    assert.equal(result, "pfx~1~2");
    assert.end();
});

test("It formats deeper into the object", assert => {
    let fmt = "pfx:$foo.bar.biz:$foo.bar.baz";
    let values = {
        foo: {
            bar: {
                baz: 2,
                biz: 1
            }
        }
    };

    let result = Key.format(fmt, values);

    assert.equal(result, "pfx~1~2");
    assert.end();
});