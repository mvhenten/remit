const Koa = require('koa');
const Router = require("koa-router");

const config = require("config");

const app = new Koa();
const router = new Router();

const Db = require("../db/db");
const MaildirMessage = require("../message/message");
const Maildir = require("../maildir/maildir");
const debug = require("debug")("remit:api");
const jwt = require('koa-jwt');
const webtoken = require("jsonwebtoken");
const bcrypt = require("bcrypt");

const bodyParser = require('koa-body');

const {
    HTTP_STATUS_UNAUTHORIZED,
    HTTP_STATUS_FORBIDDEN,
    HTTP_STATUS_NOT_FOUND,
    HTTP_STATUS_CONFLICT,
    HTTP_STATUS_CREATED,
    HTTP_STATUS_NO_CONTENT,
} = require("./lib/http-constant");

const { NotFound } = require("./lib/http-not-found");

app.use(async(ctx, next) => {
    ctx.append("Access-Control-Allow-Origin", "*");
    ctx.append("Content-Type", "application/json");
    await next();
});


app.use(async(ctx, next) => {
    const { method, url } = ctx.request;
    const start = Date.now();

    console.log("%s %s", new Date(), method, url);

    try {
        await next();
    }
    catch (err) {
        ctx.status = err.code || 500;
        ctx.append("Content-Type", "text/html");
        ctx.body = err.message;
        ctx.app.emit('error', err, ctx);
        console.error(err, "got error");
    }

    console.log("%s %sms %s %s", new Date(), Date.now() - start, ctx.response.status, JSON.stringify(ctx.params || {}));
});

const secret = config.auth.secret;
app.use(jwt({ secret, passthrough: true }));

const { counts } = require("../maildir/dir");

router.post("/api/auth", bodyParser({ multipart: true }), async(ctx) => {
    const { username, password } = ctx.request.body.fields;
    const user = config.users.find(user => user.name == username);

    if (!(username && password && user))
        return NotFound(ctx, "The username or password is incorrect");

    const authorized = bcrypt.compareSync(password, user.hash);

    if (!(authorized)) {
        ctx.status = HTTP_STATUS_UNAUTHORIZED;
        ctx.body = { error: "The username or password is invalid" };
        return;
    }

    const response = Object.assign({}, user);
    delete(response.hash);
    const token = webtoken.sign(response, secret);

    ctx.status = 200;
    ctx.body = { token };
});

router.use(async(ctx, next) => {
    if (!(ctx.state.user)) {
        ctx.status = HTTP_STATUS_FORBIDDEN;
        ctx.body = { error: "Please login first" };
        return;
    }

    const db = Db.load(ctx.state.user);

    ctx.user = ctx.state.user;
    ctx.db = db;

    await next();
});


router.get("/api/maildir", async ctx => {
    const maildir = await counts(ctx.user);
    ctx.body = { maildir };
});

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

    ctx.response.status = HTTP_STATUS_NO_CONTENT;
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
    ctx.response.status = HTTP_STATUS_NO_CONTENT;
});

router.put("/api/message/:messageId/:inbox", async ctx => {
    const { messageId, inbox } = ctx.params;
    const message = await ctx.db.Message.loadByMessageId({ messageId });

    if (!message) return;

    await Maildir.update(ctx.user, message, { inbox });
    ctx.response.status = HTTP_STATUS_NO_CONTENT;
});

router.delete("/api/message/:messageId", async ctx => {
    const message = await ctx.db.Message.loadByMessageId(ctx.params);

    if (!message) return;

    await Maildir.unlink(ctx.user, message);
    ctx.response.status = HTTP_STATUS_NO_CONTENT;
});

router.use(require("./route/thread").routes());


app
    // .use(require("./route/thread").routes())
    .use(router.routes())
    .use(router.allowedMethods())
    .listen(8082, () => {
        debug("http server listening on %s", 8082);
    });