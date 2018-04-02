const db = require("drawers/adapter/level");
const cache = new Map();
const Message = require("./message");

function load(user){
    if (!cache.has(user.name)) {
        const store = db(user.name, __dirname + "/../");
        store.Message = new Message(store);

        cache.set(user.name, store);
    }

    return cache.get(user.name);
}

module.exports.load = load;
