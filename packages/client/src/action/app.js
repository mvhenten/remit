const Store = require("kabinet/store");

const { maildirStore } = require("./maildir");
const { threadStore } = require("./thread");
const { route } = require("preact-router");

const Selection = require("./selection/selection");

const AppStateBase = Store.create("AppState", {
    parentId: String,
    folderId: String,
    location: Object,
    threadSelection: Array,
});

class AppState extends AppStateBase {
    constructor() {
        super();
        
    //     let prevState = {};
        
    //     this.observe(({folderId, parentId}) => {
    //         if (folderId != prevState.folderId) {
    //             console.log(folderId, prevState);
    //             console.log("RESETTING SELECTION");                
    //             this._selection = new Selection(this.threads);
    //         }

    //         prevState = { folderId, parentId };
    //     });
    }

    get state() {
        return this.getState();
    }
    
    get selection() {
        return this._selection;
    }
    
    get location() {
        let {state} = this;
        if (!state) return {};
        let {location} = state;
        return location || {};
    }
    
    get lastSelectedParent() {
    }
    
    get threads() {
        const { folderId } = this.location;
        return maildirStore.getThreads(folderId);
    }

    get prevThread() {
        let parentId = this.lastSelectedParent;

        const {threads} = this;
        
        let index = threads.indexOf(parentId);
        index = index - 1;
        
        if (index < 0) index = 0;
        return threads[index];
    }
    
    get nextThread() {
        let parentId = this.lastSelectedParent;

        const {threads} = this;
        
        let index = threads.indexOf(parentId);
        index = index + 1;
        
        if (index > threads.length) index = 0;
        return threads[index];
    }
    
    isSelectedThread(id) {
        let {parentId} = this.state;

        if (!this.selection)
            return false;
            
        if (this.selection.has(id))
            return true;
    }
    
    selectThread(parentId, append=false) {
        let {threads, selection} = this;

        if (!threads) {
            console.error("Selecting thread before initialized");
            return;
        }

        if (!selection) {
            selection = new Selection(threads);
        }
        
        let index = threads.indexOf(parentId);
        
        if (!append) selection.set(index);
        else selection.add(index);

        this._selection = selection;
        this.setState({threadSelection: selection.selected});
        
    }

    selectPrevThread(evt) {
        let {selection} = this;
        const {folderId} = this.state;

        if (evt.shiftKey) {
            selection.shrink();
        }
        else {
            selection.prev();
        }
        this.setState({threadSelection: selection.selected});

        if (!evt.shiftKey) {
            let parentId = selection.last;
            route(`/inbox/${folderId}/${parentId}`);
        }
    }

    selectNextThread(evt) {
        let {selection} = this;
        const {folderId} = this.state;
        

        if (evt.shiftKey) {
            selection.grow();
        }
        else {
            selection.next();
        }

        this.setState({threadSelection: selection.selected});
        
        if (!evt.shiftKey) {
            let parentId = selection.last;
            route(`/inbox/${folderId}/${parentId}`);
        }
    }
    
    async deleteThread() {
        // await threadStore.delete();
        // this.selectNextThread();
    }
}

const appState = new AppState();

module.exports = { appState };