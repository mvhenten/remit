const Koa = require('koa');
const Router = require("koa-router");

const config = require("config");

const app = new Koa();
const router = new Router();
const Url = require("url");

const { Transform } = require('stream');
const Db = require("../db/db");
const MaildirMessage = require("../maildir/message");
const Maildir = require("../maildir/maildir");
const debug = require("debug")("remit:api");

const streamJSON = require("drawers/util/json-stream");
// const pluck = require("drawers/util/pluck-stream");

const bodyParser = require('koa-body');

const HTTP_STATUS_NOT_FOUND = 404;
const HTTP_STATUS_CONFLICT = 409;
const HTTP_STATUS_CREATED = 201;
const HTTP_STATUS_NO_CONTENT = 204;

app.use(async (ctx, next) => {
    ctx.append("Access-Control-Allow-Origin", "*");
    ctx.append("Content-Type", "application/json");
    await next();
});


app.use(async (ctx, next) => {
  const {method, url} = ctx.request;
  const start = Date.now();
   
  console.log("%s %s", new Date(), method, url);
   
  try {
      await next(); 
  }
  catch(err) {
        ctx.status = err.code || 500;
        ctx.append("Content-Type", "text/html");
        ctx.body = err.message;
        ctx.app.emit('error', err, ctx);
        console.error(err, "got error");
  }
   
  console.log("%s %sms %s %s", new Date(), Date.now() - start, ctx.response.status, JSON.stringify(ctx.params || {}));
});

app.use(async (ctx, next) => {
    const user = config.users[0];
    const db = Db.load(user);
    
    ctx.user = user;
    ctx.db = db;
    await next(); 
});

const maildir = require("../maildir/dir");

router.get("/api/maildir", async ctx => {
    ctx.body = await maildir.folders(ctx.user);
});

router.get("/api/maildir/:inbox", async ctx => {
   ctx.body = ctx.db.Message.streamFromInboxAndDate(ctx.params.inbox, ctx.query).pipe(streamJSON());
});

router.get("/api/thread/:parentId", async ctx => {
   ctx.body = ctx.db.Message.streamFromParentIdAndDate(ctx.params.parentId).pipe(streamJSON());
});

router.get("/api/message/:messageId", async ctx => {
    const message = await ctx.db.Message.loadByMessageId(ctx.params);
    if (message) ctx.body = message;
});

router.post("/api/message/:messageId/seen", async ctx => {
    const message = await ctx.db.Message.loadByMessageId(ctx.params);

    if (!message) return;
    
    const flags = { seen: true };

    await Maildir.update(ctx.user, message, {flags});
    ctx.response.status = HTTP_STATUS_NO_CONTENT;
});

router.put("/api/message/:messageId/:inbox", async ctx => {
    const {messageId, inbox} = ctx.params;
    const message = await ctx.db.Message.loadByMessageId({messageId});
    
    if (!message) return;

    await Maildir.move(ctx.user, message, inbox);
    ctx.response.status = HTTP_STATUS_NO_CONTENT;
});

router.delete("/api/message/:messageId", async ctx => {
    const message = await ctx.db.Message.loadByMessageId(ctx.params);
    
    if (!message) return;

    await Maildir.unlink(ctx.user, message);
    ctx.response.status = HTTP_STATUS_NO_CONTENT;
});

app
  .use(router.routes())
  .use(router.allowedMethods())
  .listen(8082, () => {
      debug("http server listening on %s", 8082);
  });