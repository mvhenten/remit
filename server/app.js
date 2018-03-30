const argv = require('yargs').argv;
const config = require("config");
const Maildir = require("./maildir/maildir");
const Mta = require("./mta/mta");
const Indexer = require("./index/index");
const Rspamd = require("./rspamd/rspamd");

require("./api/routes");

const init = async () => {

    const Db = require("./db/db");
    const mta = new Mta();
    const rspamd = new Rspamd();
    const indexer = new Indexer(Db);

    mta.on("message", message => rspamd.check(message));

    rspamd.on("message", async message =>  {
        message.filter();
        await message.store();
        indexer.index(message);
    });

    for (let user of config.users) {
        const maildir = new Maildir(user);

        if (argv.scan)
            await mta.scan(maildir);

        if (argv.watch)
            mta.watch(maildir);
    }
};

init();
