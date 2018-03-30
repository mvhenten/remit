const Store = require("kabinet/store");
const api = require("../lib/api");
const { maildirStore } = require("./maildir");

const ThreadStoreBase = Store.create("ThreadStore", {
    threads: Object,
    selected: Object,
});

class ThreadStore extends ThreadStoreBase {
    constructor() {
        super();

        this.setState({
            threads: {},
            selected: {}
        });
    }

    get state() {
        return this.getState();
    }

    async fetch(id, prevId) {
        if (!id) return null;
        if (id == prevId) return null;

        const messages = await api.get("thread/" + id);

        this.set(id, messages);
    }

    set(id, messages) {
        const { threads } = this.state;
        threads[id] = messages;
        threadStore.setState({ threads });
    }

    selected(id) {
        let { selected } = this.state;
        return selected[id];
    }
    
    appendSelection(id) {
        let { selected } = this.state;

        selected[id] = true;
        
        console.log(selected);

        this.setState({ selected });
    }

    select(id) {
        let selected = {[id]: true};
        this.setState({ selected });
    }
    
    getThread(id) {
        const { threads } = this.state;
        
        return threads[id];
    }
    
    async markThreadRead(id) {
        const messages = this.getThread(id);
        if (!messages) return;
        
        for (let message of messages) {
            if (!message.flags.seen) {
                await api.post(`/message/${message.messageId}/seen`);
            }
        }
        
        this.set(id, messages);
    }
    
    async delete() {
        const { threads, selected} = this.state;
        const ids = Object.keys(selected);
        
        
        for (let id of ids) {
            await api.delete("thread/" + id);
            delete(threads[id]);
        }

        threadStore.setState({ threads });
    }
}

const threadStore = new ThreadStore();

module.exports = { threadStore };