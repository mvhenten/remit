const { Writable } = require('stream');


module.exports = function collectStream() {
    const writable = new Writable({
      objectMode: true,
      write(chunk, encoding, next) {
          this.values.push(chunk);
          next();
      },
    });

    writable.values = [];

    return writable;    
}