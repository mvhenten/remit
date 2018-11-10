const Koa = require('koa');
const Router = require("koa-router");
const jwt = require('koa-jwt');
const config = require("./config");
const status = require("http-status");

const app = new Koa();
const router = new Router();
const debug = require("debug")("remit:api");


app.use(async(ctx, next) => {
    ctx.append("Access-Control-Allow-Origin", "*");
    ctx.append("Content-Type", "application/json");
    await next();
});

app.use(jwt({ secret: config.auth.secret, passthrough: true }));

router.use(async(ctx, next) => {
    if (ctx.state.user)
        return next();

    ctx.status = status.FORBIDDEN;
});

router.get("/ping", async ctx => {
    const ok = "ok";
   ctx.status = 200;
   ctx.body = { ok };
});

app.use(router.routes());

if (!module.parent)  app.listen(3000);
module.exports = app;
