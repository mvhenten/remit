const Koa = require('koa');
const Router = require("koa-router");

const config = require("config");

const app = new Koa();
const router = new Router();

const { Transform } = require('stream');
const Db = require("../db/db");
const MaildirMessage = require("../maildir/message");
const Maildir = require("../maildir/maildir");
const debug = require("debug")("remit:api");

const streamJSON = require("drawers/util/json-stream");
// const pluck = require("drawers/util/pluck-stream");

const bodyParser = require('koa-body');

const {
    HTTP_STATUS_NOT_FOUND,
    HTTP_STATUS_CONFLICT,
    HTTP_STATUS_CREATED,
    HTTP_STATUS_NO_CONTENT,
} = require("./lib/http-constant");

const {NotFound} = require("./lib/http-not-found");


const {pluck, build, mixin, limit} = require("./stream/util");


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

router.get("/api/message/:messageId", async ctx => {
    const message = await ctx.db.Message.loadByMessageId(ctx.params);
    
    if (!message)
        return NotFound(ctx);
    
    const folders = await maildir.folders(ctx.user);
    const folder = folders.find(({folder}) => message.inbox == folder);
    const messageSource = new MaildirMessage(ctx.user, message.path);
    const {body} = await messageSource.parseMessage();

    ctx.body = Object.assign(message.toJSON(), {folder, body});
});

router.post("/api/message/:messageId/seen", async ctx => {
    const message = await ctx.db.Message.loadByMessageId(ctx.params);

    if (!message)
        return NotFound(ctx);

    const flags = {};
    flags.seen = true;

    await Maildir.update(ctx.user, message, {flags});
    ctx.response.status = HTTP_STATUS_NO_CONTENT;
});


router.put("/api/message/:messageId",  bodyParser(), async ctx => {
    const {messageId} = ctx.params;
    const flags = ctx.request.body;
    
    for (let flag in flags) {
        flags[flag] = (flags[flag] == "true");
    }
    
    const message = await ctx.db.Message.loadByMessageId({messageId});

    if (!message) return;

    await Maildir.update(ctx.user, message, {flags});
    ctx.response.status = HTTP_STATUS_NO_CONTENT;
});

router.put("/api/message/:messageId/:inbox", async ctx => {
    const {messageId, inbox} = ctx.params;
    const message = await ctx.db.Message.loadByMessageId({messageId});
    
    if (!message) return;

    await Maildir.update(ctx.user, message, {inbox});
    ctx.response.status = HTTP_STATUS_NO_CONTENT;
});

router.delete("/api/message/:messageId", async ctx => {
    const message = await ctx.db.Message.loadByMessageId(ctx.params);
    
    if (!message) return;

    await Maildir.unlink(ctx.user, message);
    ctx.response.status = HTTP_STATUS_NO_CONTENT;
});


app
  .use(require("./route/thread").routes())
  .use(router.routes())
  .use(router.allowedMethods())
  .listen(8082, () => {
      debug("http server listening on %s", 8082);
  });