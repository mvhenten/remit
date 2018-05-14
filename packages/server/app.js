const argv = require('yargs').argv;
const Queue = require("@remit-email/remit-queue");
const queues = new Queue();

const Db = require("@remit-email/db/db");

require("@remit-email/api/routes");


require('events').EventEmitter.defaultMaxListeners = 25;

const queueOptions = {
    maxConcurrency: Infinity
};


process.on("unhandledRejection", (err) => {
    console.error(err);
    process.exit(1);
});

queues.on("error", (err) => {
    console.error("Encountered unexpected error handling queued item: ", err);
    process.exit(1);
});

const init = async () => {

    queues.create("spam");
    queues.create("message");
    queues.create("headers");
    queues.create("index");

    require("./worker/maildir")(queues, argv);
    require("./worker/rspamd")(queues);
    require("./worker/message")(queues);
    require("./worker/headers")(queues);
    require("./worker/index")(queues, Db);

};

init();
