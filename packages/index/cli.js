const RemitDB = require("@remit-email/db/db");
const ora = require('ora');

const config = require('rc')("remit", {
    users: []
});

const db = new RemitDB(config);
const index = require("./index");

process.on("unhandledRejection", (err) => {
    console.error(err);
    process.exit(1);
});

const eta = (start, total, done) => {
    const now = Date.now();
    const elapsed = now - start;
    const tps = elapsed / done;
    const est = (total - done) * tps;
    return new Date(now + est);
};

const run = async () => {
    const spinner = ora('Reading messages').start();
    const start = Date.now();
    const name = process.argv.pop();
    const maildir = process.argv.pop();
    await db.destroy();
    const client = db.load({ name });

    const headers = await index(maildir, client);


    headers.on("data", () => {
        let { total, size } = headers;
        let cur = total - size;

        spinner.text = `[${new Date()}] Reading message ${cur}/${total} eta ${eta(start, total, cur).toTimeString()}`;
    });

    headers.on("end", () => {
        const end = Date.now();
        const sec = Math.round((end - start) / 1000);
        let { total } = headers;

        spinner.succeed(`Processed ${total} messges in ${sec}s`);
    });
};

run();


