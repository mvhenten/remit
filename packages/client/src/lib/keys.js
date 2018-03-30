const kb = require("keyboardjs");



class Keyboard {
    constructor() {
        console.log("CONSTRUCTOR");
        this.contexts = [];
        this.current = null;
        kb.reset();
    }
    
    on(event, cb) {
        console.log("on", event);
        kb.on(event, cb);
    }
    
    reset() {
        this.contexts = [];
        kb.reset();
    }
    
    nextContext() {
        let {cur, contexts} = this;
        let index = contexts.indexOf(cur) + 1;

        if (index >= contexts.length)
            index = 0;
            
        cur = contexts[index];

        kb.setContext(contexts[index]);
        this.cur = cur;
    }
    
    context(name, context) {
        kb.withContext(name, () => {
            context(kb);
        });
        console.log("CREATED CONTEXT", name);
        
        this.contexts.push(name);
    }
    
    setContext(name) {
        this.cur = name;
        kb.setContext(name);
    }
}


module.exports = new Keyboard();