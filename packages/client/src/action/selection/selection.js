class Selection {
    constructor(items) {
        this.items = items;
        this.length = items.length;
        this.selection = new Set();
        this.pos = 0;
    }

    get selected() {
        return Array.from(this.selection).sort();
    }

    get last() {
        const { items } = this;
        return items[this.pos];
    }

    grow() {
        let { pos, length } = this;
        let index = Math.min(length - 1, pos + 1);

        this.toggle(index);
    }

    shrink() {
        let { pos } = this;
        let index = Math.max(0, pos - 1);
        
        this.toggle(index);
    }
    
    toggle(index) {
        let { pos, items } = this;
        let value = items[index];

        if (this.has(value)) {
            this.remove(pos);
        }
        else {
            this.add(index);
        }
        this.pos = index;
    }

    has(value) {
        return this.selection.has(value);
    }

    set(index) {
        this.clear();
        this.add(index);
        this.pos = index;
    }

    add(index) {
        const { items } = this;
        const value = items[index];

        if (value) {
            this.selection.add(value);
            this.pos = index;
        }
    }

    remove(index) {
        const { items } = this;
        const value = items[index];

        if (value) {
            this.selection.delete(value);
            this.pos = Math.max(0, index - 1);
        }
    }

    next() {
        const {length} = this;
        this.set(Math.min(length - 1, this.pos + 1));
    }

    prev() {
        this.set(Math.max(0, this.pos - 1));
    }

    clear() {
        this.selection.clear();
    }
}

module.exports = Selection;