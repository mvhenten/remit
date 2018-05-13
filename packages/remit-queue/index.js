"use strict";

const level = require('level-hyper');
const sublevel = require('level-sublevel/bytewise');
const Queue = require('level-jobs');

const EventEmitter = require("events").EventEmitter;

const DEFAULT_PATH="/tmp/remit-queue";
const State = new WeakMap();

const hyperAdapater = (path) => {
    return sublevel(level(path), { valueEncoding: "json" });
};

class RemitQueue extends EventEmitter {
    constructor(path=DEFAULT_PATH, adapter) {
        super();

        const db = (adapter || hyperAdapater)(path);
        State.set(this, {db, queues: new Map(), subscribers: new Map()});
    }

    create(name) {
        const {db, queues, subscribers} = State.get(this);

        if (queues.has(name))
            throw new Error(`Queue ${name} already exists`);

        const sub = db.sublevel(name);
        const queue = Queue(sub, this.handleQueue.bind(this, name));

        queue.on("error", (err) => {
            this.emit("error", Object.assign(new Error(), {
                message: `Failed to handle a message for ${name}`,
                error: err
            }));
        });

        queues.set(name, queue);

        State.set(this, {db, queues, subscribers});
    }

    subscribe(name, worker) {
        const {queues} = State.get(this);

        if (!queues.has(name))
            this.create(name);

        this.addSubscriber(name, worker);
    }

    publish(name, payload) {
        const {queues} = State.get(this);

        if (!queues.has(name))
            this.create(name);

        queues.get(name).push(payload);
    }

    addSubscriber(name, worker) {
        const {subscribers} = State.get(this);
        const handlers = subscribers.get(name) || new Set();

        handlers.add(worker);
        subscribers.set(name, handlers);
    }

    async handleQueue(name, id, payload, done) {
        const {subscribers, queues} = State.get(this);

        const queue = queues.get(name);

        const envelope = new QueueMessageEnvelope(queue, payload);
        let handlers = subscribers.get(name);

        if (!handlers) {
            console.error("WARNING: no listeners found for: ", name);
            return;
        }


        for (let worker of handlers) {
            await envelope.handle(worker);

            if (envelope.done)
                return done();

            if (!envelope.lock)
                continue;

            return done(Error("Worker finished but never resolved"));
        }
    }
}

class QueueMessageEnvelope {
    constructor(queue, payload) {
        Object.assign(this, {queue, payload, lock: false, done: false });
    }

    /**
     * retry: message is published back to the queue, envelope is resolved
     * resolve: message is processed, stop processing
     * reject: message is not processed, can process further
     * handle: message is locked, must be unlocked
     */

    reschedule() {
        if (!this.lock)
            throw new Error("Envelope is not locked, cannot retry");

        this.done = true;
        this.queue.push(this.payload);
    }

    resolve() {
        if (!this.lock)
            throw new Error("Envelope is not locked, cannot resolve");

        this.done = true;
    }

    reject() {
        if (!this.lock)
            throw new Error("Envelope is not locked, cannot resolve");

        this.lock = false;
    }

    async handle(worker) {
        this.lock = true;
        await worker(this.payload, this);
    }
}

let instance = null;

RemitQueue.getInstance = (path, adapter) => {
    if (!instance)
        instance = new RemitQueue(path, adapter);

    return instance;
};


module.exports = RemitQueue;