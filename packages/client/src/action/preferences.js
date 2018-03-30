const Store = require("kabinet/store");
const persist = require("./store/persist");

const PrefStore = Store.create("PrefStore", {
    images: Array,
});

const prefStore = new PrefStore();
// persist("PrefStore", prefStore);

function trustImages(from) {
    let trusted = prefStore.getState() || {};
    
    if (!trusted.images)
        trusted.images = [];
    
    trusted.images.push(from);
    prefStore.setState(trusted);
}


module.exports = { trustImages, prefStore };