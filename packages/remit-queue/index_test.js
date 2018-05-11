const test = require("tape");
const Queue = require("./index");
const memdown = require("memdown");
const sublevel = require('level-sublevel/bytewise');

const memdownAdapter = () => {
    return sublevel(memdown(), { valueEncoding: "json" });
};



test("We can create a new queue", assert => {
    const queues = new Queue(null, memdownAdapter);

    let value = {
        foo: [1, 2, 3]
    };

    queues.subscribe("foo", (data, queue) => {
        assert.deepEqual(data, value);
        queue.resolve();
        assert.end();
    });

    queues.publish("foo", value);
});

test("worker must resolve a queue", assert => {
    const queues = new Queue(null, memdownAdapter);

    let value = {
        foo: [1, 2, 3]
    };

    queues.subscribe("foo", (data, queue) => {});

    queues.publish("foo", value);

    queues.on("error", err => {
        assert.ok(err instanceof Error);
        assert.equal(err.message, "Failed to handle a message for foo");
        assert.end();
    });
});

test("worker is retryied resolve a queue", assert => {
    const queues = new Queue(null, memdownAdapter);

    let value = {
        foo: [1, 2, 3]
    };

    let tries = 0;

    queues.subscribe("foo", (data, queue) => {
        tries++;

        if (tries < 5)
            return;

        assert.deepEqual(data, value);
        queue.resolve();
        assert.end();
    });

    queues.publish("foo", value);

    queues.on("error", err => {
        assert.fail(err);
    });
});

test("One worker is executed", assert => {
    const queues = new Queue(null, memdownAdapter);

    let value = {
        foo: [1, 2, 3]
    };

    queues.subscribe("foo1", (data, queue) => {
        assert.deepEqual(data, value);
        queue.resolve();
        assert.end();
    });

    queues.subscribe("foo1", (data, queue) => {
        assert.fail("Should not execute a second worker");
    });

    queues.publish("foo1", value);
});

test("Second worker is executed", assert => {
    const queues = new Queue(null, memdownAdapter);

    let value = {
        foo: [1, 2, 3]
    };

    queues.subscribe("foo2", (data, queue) => {
        queue.reject();
    });

    queues.subscribe("foo2", (data, queue) => {
        assert.deepEqual(data, value);
        queue.resolve();
        assert.end();
    });

    queues.publish("foo2", value);
});

test("It awaits a promise", assert => {
    const queues = new Queue(null, memdownAdapter);

    let value = {
        foo: [1, 2, 3]
    };


    queues.subscribe("foo2", (data, queue) => {

        return new Promise((resolve, reject) => {
            setTimeout(() => {
                assert.deepEqual(data, value);
                queue.resolve();
                assert.end();

            }, 100);
        });
    });

    queues.publish("foo2", value);
});

test("We can reschedule", assert => {
    const queues = new Queue(null, memdownAdapter);

    let value = {
        foo: [1, 2, 3]
    };

    let reschedule = true;

    queues.subscribe("foo", (data, queue) => {
        if (data.job == 2) {
            reschedule = false;
            queue.resolve();
            return;
        }

        if (reschedule) {
            queue.reschedule();
            return;
        }

        assert.deepEqual(data, { job: 1, value });
        queue.resolve();
        assert.end();
    });

    queues.publish("foo", { job: 1, value });
    queues.publish("foo", { job: 2, value });
});