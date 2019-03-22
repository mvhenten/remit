/**
 * Small abstraction around multileveldown and sublevel...
 */

const net = require("net");
const level = require("level-hyper");
const sublevel = require("subleveldown");
const multileveldown = require("multileveldown");

const defaultOptions = {
    port: 9003,
    keyEncoding: "binary",
    valueEncoding: "json"
};

const defaultLevelName = "main";

const State = new WeakMap();

class LevelDBServer {
    constructor(path, options = defaultOptions) {
        State.set(this, { path, ...options });
    }

    get db() {
        const { path } = State.get(this);
        if (!this._db)
            this._db = level(path);
        return this._db;
    }

    get server() {
        const db = this.db;

        if (!this._server) {
            const clients = new Set();
            const server = net.createServer((sock) => {
                clients.add(sock);

                sock.on("error", () => sock.destroy());
                sock.on("close", () => clients.delete(sock));

                sock.pipe(multileveldown.server(db)).pipe(sock);
            });

            this.db.on("closing", () => {
                for (let client of clients) {
                    client.destroy();
                }

                server.close();
            });
            this._server = server;
        }

        return this._server;
    }

    listen(port = defaultOptions.port) {
        const state = State.get(this);
        state.port = port;
        this.server.listen(port);
        return this;
    }

    close() {
        return this.db.close();
    }

    destroy() {
        const { db } = this;
        const { path } = State.get(this);

        return new Promise((resolve, reject) => {
            db.close(() => {
                level.destroy(path, err => {
                    if (err) return reject(err);
                    resolve();
                });
            });
        });
    }
}

function server(path, options = defaultOptions) {
    return new LevelDBServer(path, options);
}

function createClient(subLevelName = defaultLevelName, options = defaultOptions) {
    const { port, keyEncoding, valueEncoding } = options;
    const db = multileveldown.client();
    const sub = sublevel(db, subLevelName, { keyEncoding, valueEncoding });

    const sock = net.connect(port);

    const stream = sock.pipe(db.connect()).pipe(sock);;
    sock.on("close", () => {
        stream.cork();
        console.log('socket');
        stream.end();
    });

    sock.on("error", (err) => { sock.destroy();
        console.log('err', err) });

    sub.on("close", () => {
        console.log('sub close");');
    })

    const close = sub.close.bind(sub);

    sub.close = () => {
        console.log("clsing");
        stream.unpipe();
    };

    return sub;
}

module.exports = server;
module.exports.createClient = createClient;