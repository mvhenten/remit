const Router = require("koa-router");
const router = new Router();

const { Transform } = require('stream');
const MaildirMessage = require("../../maildir/message");
const maildir = require("../../maildir/dir");

const streamJSON = require("drawers/util/json-stream");
const { NotFound } = require("../lib/http-not-found");

const { pluck, build, mixin, limit } = require("../stream/util");

router.get("/api/threads/:id", async ctx => {
    const { id } = ctx.params;

    const folders = await maildir.folders(ctx.user);
    const folder = folders.find(folder => folder.id == id);

    if (!folder) return NotFound(ctx);

    ctx.body = ctx.db.Message.streamByThread(folder.folder)
        .pipe(build("messages"))
        .pipe(mixin({ folder }))
        .pipe(limit(50))
        .pipe(streamJSON());
});

function mixinMessage(user) {
    return new Transform({
        objectMode: true,
        async transform(chunk, encoding, next) {
            // if (!chunk) return next();
            const message = chunk.toJSON();
            const messageSource = new MaildirMessage(user, message.path);

            console.log(message.path);

            // const folder = folders.find(({folder}) => message.inbox == folder);
            const { body } = await messageSource.parseMessage();

            next(null, Object.assign(message, { body }));
        }
    });
}


router.get("/api/thread/:id", async ctx => {
    ctx.body = ctx.db.Message.streamFromParentIdAndDate(ctx.params.id)
        .pipe(pluck("value"))
        .pipe(mixinMessage(ctx.user))
        .pipe(streamJSON());
});

module.exports = router;