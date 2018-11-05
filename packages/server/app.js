const config = require('rc')("remit", {
    users: []
});

const Queue = require("@remit-email/remit-queue");
const queues = new Queue();
const Db = require("@remit-email/db/db")(config);
const yargs = require("yargs");



const argv = yargs
    .describe("scan", "re-index")
    .default("scan", false)
    .option("watch")
    .describe("watch", "re-index")
    .default("watch", true)
    .alias('h', 'help')
    .help('help')
    .usage('Usage: $0 -x [num]')
    .showHelpOnFail(false, "Specify --help for available options")
    .argv;

require('events').EventEmitter.defaultMaxListeners = 25;

process.on("unhandledRejection", (err) => {
    console.error(err);
    process.exit(1);
});

queues.on("error", (err) => {
    console.error("Encountered unexpected error handling queued item: ", err);
    process.exit(1);
});

const init = async() => {
    require("./worker/maildir")(queues.pubSub("spam"), argv, config);
    require("./worker/rspamd")(queues.pubSub("message", "spam"));
    require("./worker/message")(queues.pubSub("headers", "message"));
    require("./worker/headers")(queues.pubSub("index", "headers"));

    queues.subscribe("index", require("./worker/index")(Db));
};

init();
