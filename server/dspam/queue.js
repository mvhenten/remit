const EventEmitter = require("events");

class Queue extends EventEmitter {
    constructor() {
        super();
        this.queue = [];
    }
    
    enqueue(value, operation) {
        this.queue.push({value, operation});
        this.drain();
    }
    
    drain() {
        if (!this.queue.length)
            return;
            
        if (this.running)
            return;
            
        this.running = true;
            
        const task = this.queue.pop();
        
        task.operation(task.value, (err) => {
            if (err) {
                this.emit("error", err, task.value);                
            }
            else {
                this.emit("task", task.value);
            }

            this.running = false;

            setTimeout(() => this.drain(), 50);
        });
    }
}

module.exports = Queue;