const Router = require("koa-router");
const router = new Router();

const { Transform } = require('stream');
const MaildirMessage = require("@remit-email/message/message");
const Maildir = require("@remit-email/maildir/maildir");
const { counts } = require("@remit-email/maildir/dir");

const streamJSON = require("drawers/util/json-stream");
const { NotFound } = require("../lib/http-not-found");

const { CONFLICT, NO_CONTENT } = require("http-status-codes");

const { pluck, build, mixin, limit } = require("../stream/util");

router.get("/api/threads/:id", async ctx => {
    const { id } = ctx.params;

    const folders = await counts(ctx.user);
    const folder = folders.find(folder => folder.id == id);

    if (!folder) return NotFound(ctx);

    ctx.body = ctx.db.Message.streamFromInboxAndDate(folder.id)
        // .pipe(build("messages"))
        // .pipe(mixin({ folder }))
        // .pipe(limit(50))
        .transform(chunk => ({message: chunk.value}))
        .limit(10)
        // .tranform(chunk => ({message: chunk.value}))
        .toJSONStream()
        // .pipe(streamJSON());
});

function mixinMessage(user) {
    return new Transform({
        objectMode: true,
        async transform(chunk, encoding, next) {
            const message = chunk.toJSON();

            console.log("FOO", message);

            const messageSource = new MaildirMessage(user, message.path);
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

router.delete("/api/thread/:id", async ctx => {
    const messages = await ctx.db.Message.loadMessagesByParentId(ctx.params.id);

    for (let message of messages) {
        try {
            await Maildir.unlink(ctx.user, message.value);
        }
        catch(err) {
            console.log(err);
        }
    }

    ctx.response.status = NO_CONTENT;
});

module.exports = router;