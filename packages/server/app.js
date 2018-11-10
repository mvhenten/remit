const debug = require("debug")("remit:app");
const Queue = require("@remit-email/remit-queue");
const RemitDB = require("@remit-email/db/db");
const yargs = require("yargs");

const argv = yargs
    .describe("message", "process a single message")
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

process.on("unhandledRejection", (err) => {
    console.error(err);
    process.exit(1);
});

const config = require('rc')("remit", {
    users: []
});

const init = async() => {
    const queues = new Queue();
    const db = new RemitDB(config);

    queues.on("error", (err) => {
        console.error("Encountered unexpected error handling queued item: ", err);
        process.exit(1);
    });

    console.log(config.users[0].filters);


    if (argv.scan) {
        debug("Destroying database");
        await db.destroy();
        debug("Destroying queues");
        await queues.destroy();
    }

    require("./worker/maildir")(queues.pubSub("spam"), argv, config);
    require("./worker/rspamd")(queues.pubSub("message", "spam"));
    require("./worker/message")(queues.pubSub("delivery", "message"));
    require("./worker/delivery")(queues.pubSub("index", "delivery"));

    queues.subscribe("index", require("./worker/index")(db));
};

init();
