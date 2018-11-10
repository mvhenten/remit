const Router = require("koa-router");
const router = new Router();
const bodyParser = require('koa-body');
const status = require("http-status");
const bcrypt = require("bcrypt");
const webtoken = require("jsonwebtoken");

router.post("/api/auth", bodyParser(), async ctx => {
    const { username, password } = ctx.request.body;
    const config = ctx.state.config;
    const user = config.users.find(user => user.name == username);


    if (!(username && password && user)) {
        ctx.status = status.FORBIDDEN;
        ctx.body = "Incorrect username or password";
        return;
    }

    const authorized = await bcrypt.compare(password, user.hash);

    if (!(authorized)) {
        ctx.status = status.FORBIDDEN;
        ctx.body = "Incorrect username or password";
        return;
    }

    const response = Object.assign({}, user);
    delete(response.hash);
    const token = webtoken.sign(response, config.auth.secret);
    ctx.status = 200;
    ctx.body = { token };

});

module.exports = router;