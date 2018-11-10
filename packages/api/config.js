
module.exports = {
    auth: {
        secret: [
            Date.now(),
            (Math.random() * 10e16).toString(36),
            (Math.random() * 10e16).toString(36),
            (Math.random() * 10e16).toString(36)
        ].join("-")
    }
};