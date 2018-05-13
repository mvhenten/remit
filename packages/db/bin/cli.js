const config = require("config");
const collectStream = require("drawers/util/collect-stream");
const { pluck, build, mixin, limit } = require("../../api/stream/util");


const Db = require("../db");
const yargs = require("yargs");


yargs.command("streamFromInboxAndDate", "Call streamFromInboxAndDate", () => {}, (argv) => {
    let user = {
        name: argv._[1]
    };

    let folder = argv._[2];


    let db = Db.load(user);
    const collect = collectStream();

    console.log("streamFromInboxAndDate", folder);


    db.Message.streamFromInboxAndDate(folder)
        // .pipe(build("messages"))
        // .pipe(mixin({ folder }))
        // .pipe(limit(50))
        .pipe(collect).on("finish", (res) => {
            console.log(JSON.stringify(collect.values, null, 2));
        });

}).argv;

yargs.command("streamFromParentIdAndDate", "Call streamFromParentIdAndDate", () => {}, (argv) => {
    let user = {
        name: argv._[1]
    };

    let pid = argv._[2];


    let db = Db.load(user);
    const collect = collectStream();

    console.log("streamFromParentIdAndDate", pid);


    db.Message.streamFromParentIdAndDate(pid)
        // .pipe(build("messages"))
        // .pipe(mixin({ folder }))
        // .pipe(limit(50))
        .pipe(collect).on("finish", (res) => {
            console.log(JSON.stringify(collect.values, null, 2));
        });

}).argv;


yargs.command("loadByRawMessageId", "Call loadByRawMessageId", () => {}, async (argv) => {
    let user = {
        name: argv._[1]
    };

    let id = argv._[2];
    let db = Db.load(user);

    console.log("loadByRawMessageId", id);


    let msg = await db.Message.loadByRawMessageId(id);
    console.log(msg && msg.toJSON());

}).argv;
// let db = Db.load("mvhenten");