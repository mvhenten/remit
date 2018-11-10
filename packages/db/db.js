const db = require("drawers/adapter/hyper");
const Path = require("path");
const Message = require("./message");

const State = new WeakMap();

class RemitDB {
    constructor(config) {
        const stores = new Map();

        State.set(this, {
            config,
            stores
        });
    }

    load(user) {
        const {config, stores} = State.get(this);

        if (!stores.has(user.name)) {
            const path = Path.resolve(Path.join(config.db.path, user.name));
            const store = db(path);

            store.Message = new Message(store);

            stores.set(user.name, store);
        }

        return stores.get(user.name);
    }

    async destroy() {
        const {config, stores} = State.get(this);

        for (let user of config.users) {
            await this.load(user).destroy();
            stores.delete(user.name);
        }
    }
}

module.exports = RemitDB;