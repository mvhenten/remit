class Queue {
    constructor(maxConcurrent=500, delay=10) {
        this.concurrent = 0;
        this.maxConcurrent = maxConcurrent;
        this.delay = delay;
        this.tasks = [];
    }

    push(task) {
        this.tasks.push(task);

        if (!this.active)
            this.drain();
    }

    async drain() {
        this.active = true;

        if (!this.tasks.length) {
            this.active = false;
            return;
        }

        if (this.concurrent <= this.maxConcurrent) {
            this.concurrent++;
            let task = this.tasks.shift();
            this.drain();
            await task();
            this.concurrent--;
            return;
        }

        setTimeout(() => this.drain(), this.delay);
    }
}

module.exports = Queue;