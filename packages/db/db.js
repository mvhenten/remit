const Db = require("drawers/adapter/leveldown");
const Path = require("path");
const cache = new Map();
const Message = require("./message");
const config = require("config");

function load(user){
    if (!cache.has(user.name)) {
        const path = Path.resolve(Path.join(config.db.path, user.name));
        const store = new Db(path);

        store.Message = new Message(store);

        cache.set(user.name, store);
    }

    return cache.get(user.name);
}

module.exports.load = load;
