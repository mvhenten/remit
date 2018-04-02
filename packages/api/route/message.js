const Router = require("koa-router");
const router = new Router();
const bodyParser = require('koa-body');

const MaildirMessage = require("@remit-email/message/message");
const Maildir = require("@remit-email/maildir/maildir");


const { NotFound } = require("../lib/http-not-found");
const { counts } = require("@remit-email/maildir/dir");

const {
    NO_CONTENT
} = require("http-status-codes");


router.get("/api/message/:messageId", async ctx => {
    const message = await ctx.db.Message.loadByMessageId(ctx.params);

    if (!message)
        return NotFound(ctx);

    const folders = await counts(ctx.user);
    const folder = folders.find(({ folder }) => message.inbox == folder);
    const messageSource = new MaildirMessage(ctx.user, message.path);
    const { body } = await messageSource.parseMessage();

    ctx.body = Object.assign(message.toJSON(), { folder, body });
});

router.post("/api/message/:messageId/seen", async ctx => {
    const message = await ctx.db.Message.loadByMessageId(ctx.params);

    if (!message)
        return NotFound(ctx);

    const flags = {};
    flags.seen = true;

    const maildir = new Maildir(ctx.user);
    const mailMessage = new MaildirMessage(maildir, message.path);

    mailMessage.flags = flags;

    await mailMessage.store();

    ctx.response.status = NO_CONTENT;
});


router.put("/api/message/:messageId", bodyParser(), async ctx => {
    const { messageId } = ctx.params;
    const flags = ctx.request.body;

    for (let flag in flags) {
        flags[flag] = (flags[flag] == "true");
    }

    const message = await ctx.db.Message.loadByMessageId({ messageId });

    if (!message) return;

    await Maildir.update(ctx.user, message, { flags });
    ctx.response.status = NO_CONTENT;
});

router.put("/api/message/:messageId/:inbox", async ctx => {
    const { messageId, inbox } = ctx.params;
    const message = await ctx.db.Message.loadByMessageId({ messageId });

    if (!message) return;

    await Maildir.update(ctx.user, message, { inbox });
    ctx.response.status = NO_CONTENT;
});

router.delete("/api/message/:messageId", async ctx => {
    const message = await ctx.db.Message.loadByMessageId(ctx.params);

    if (!message) return;

    await Maildir.unlink(ctx.user, message);
    ctx.response.status = NO_CONTENT;
});

module.exports = router;