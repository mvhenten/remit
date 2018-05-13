const argv = require('yargs').argv;
const Queue = require("@remit-email/remit-queue");

require("@remit-email/api/routes");


process.on("unhandledRejection", (err) => {
    console.error(err);
    process.exit(1);
});

/**
 * TODO: simplify. MTA and Rspam can deal with simple data (user, path)
 * - move rspamd into a lib and inject queues directly
 * - after spam check move the message immediately
 * - after spam check create message
 * - parse headers and filter
 *   * Filter does IO and needs to be re-tried
 *  - push to queue a simple json message
 *  - inject into indexer
 *
 */

const init = async () => {
    const Db = require("@remit-email/db/db");
    const queues = new Queue();

    queues.create("spam");
    queues.create("message");
    queues.create("headers");
    queues.create("index");

    require("./worker/mta")(queues, argv);
    require("./worker/rspamd")(queues);
    require("./worker/message")(queues);
    require("./worker/headers")(queues);
    require("./worker/index")(queues, Db);

};

init();
