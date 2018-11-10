"use strict";

const level = require('level-hyper');
const sublevel = require('level-sublevel/bytewise');
const Queue = require('level-jobs');
const debug = require("debug")("remit:queue");

const EventEmitter = require("events").EventEmitter;

const DEFAULT_PATH = "/tmp/remit-queue";
const State = new WeakMap();

const hyperAdapater = (path) => {
    const db = level(path);
    const subleveldb = sublevel(db, { valueEncoding: "json" });

    subleveldb.destroy = async() => new Promise((resolve, reject) => {
        db.close(() => {
            db.options.db.destroy(path, err => {
                if (err) return reject(err);
                resolve();
            });
        });
    });

    return subleveldb;
};

const DEFAULT_MAX_CONCURRENCY = 9;

class RemitQueue extends EventEmitter {
    constructor(path = DEFAULT_PATH, adapter) {
        super();
        State.set(this, { adapter, path, queues: new Map(), subscribers: new Map() });
    }

    get db() {
        const state = State.get(this);
        let { adapter, path } = state;

        if (!state.db) {
            state.db = (adapter || hyperAdapater)(path);
            State.set(this, state);
        }

        return state.db;
    }

    async destroy() {
        await this.db.destroy();
        State.get(this).db = null;
    }

    create(name, maxConcurrency = DEFAULT_MAX_CONCURRENCY) {
        const { queues } = State.get(this);

        if (queues.has(name))
            throw new Error(`Queue ${name} already exists`);

        const sub = this.db.sublevel(name);
        this.db.setMaxListeners(22);

        const queue = Queue(sub, this.handleQueue.bind(this, name), maxConcurrency);

        queue.on("error", (err) => {
            this.emit("error", Object.assign(new Error(), {
                message: `Failed to handle a message for ${name}`,
                error: err
            }));
        });

        queues.set(name, queue);
    }

    subscribe(name, worker) {
        const { queues } = State.get(this);

        if (!queues.has(name))
            this.create(name);

        this.addSubscriber(name, worker);
    }

    publish(name, payload) {
        const { queues } = State.get(this);

        if (!queues.has(name))
            this.create(name);

        queues.get(name).push(payload);
    }

    pubSub(pubName, subName) {
        return new RemitPubSub(this, pubName, subName);
    }

    addSubscriber(name, worker) {
        const { subscribers } = State.get(this);
        const handlers = subscribers.get(name) || new Set();

        handlers.add(worker);
        subscribers.set(name, handlers);
    }

    async handleQueue(name, id, payload, done) {
        const { subscribers, queues } = State.get(this);

        const queue = queues.get(name);

        const envelope = new QueueMessageEnvelope(queue, payload);
        let handlers = subscribers.get(name);

        if (!handlers) {
            debug("WARNING: no listeners found for: ", name);
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
        Object.assign(this, { queue, payload, lock: false, done: false });
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

class RemitPubSub {
    constructor(queues, pubName, subName) {
        State.set(this, { queues, pubName, subName });
    }

    subscribe(handler) {
        const { queues, subName } = State.get(this);
        queues.subscribe(subName, handler);
    }

    publish(payload) {
        const { queues, pubName } = State.get(this);
        queues.publish(pubName, payload);
    }
}

module.exports = RemitQueue;