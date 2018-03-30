const Store = require("kabinet/store");
const api = require("../lib/api");
const format = require("./maildir/format");

const MaildirStoreBase = Store.create("MaildirStore", {
    maildir: Array,
    messages: Object,
});

const lastActiveParent = new Map();

class MaildirStore extends MaildirStoreBase {
    constructor() {
        super();

        this.lastActiveIndex = 0;

        this.setState({
            messages: {},
            maildir: []
        });
    }

    get state() {
        return this.getState();
    }

    getMaildir(uuid) {
        const { maildir } = this.getState();

        if (!maildir) return;
        if (!uuid) return maildir[0];

        return maildir.find(item => item.id == uuid);
    }

    getMessages(uuid) {
        const { messages } = this.state;
        const folder = this.getMaildir(uuid);

        if (!folder) return null;
        return messages[folder.id];
    }
    
    getThreads(folderId) {
        const items = this.getMessages(folderId);
        
        if (!items) return [];
        
        return items.map((item) => {
            return item.messages[0].parentId;
        });
    }
    
    getActiveThread(folderId) {
        const messages = this.getMessages(folderId);
        return messages[0];
    }

    findIndex(folderId, parentId) {
        const items = this.getMessages(folderId);

        return items.findIndex((item, i) => {
            let messageIndex = item.messages.findIndex(message => {
                return message.parentId == parentId;
            });
            
            return messageIndex != -1;
        });
    }

    async fetchThreads(folderId) {
        let items = await api.get("threads/" + folderId);
        let messages = {};
        
        messages[folderId] = items;
        this.setState({messages});
    }

    async fetch(cached) {
        if (cached && this.getState().maildir && this.getState().maildir.length)
            return;

        let {maildir, error} = await api.get("maildir");

        if (error) 
            return;

        maildir = format(maildir);

        this.setState({ maildir });
    }
}

const maildirStore = new MaildirStore();

module.exports = { maildirStore };