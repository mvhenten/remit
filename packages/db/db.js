const db = require("drawers/adapter/hyper");
const Path = require("path");
const cache = new Map();
const Message = require("./message");

module.exports = (config) => {

    function load(user) {
        if (!cache.has(user.name)) {
            const path = Path.resolve(Path.join(config.db.path, user.name));
            const store = db(path);

            store.Message = new Message(store);

            cache.set(user.name, store);
        }

        return cache.get(user.name);
    }


    return {load};
};