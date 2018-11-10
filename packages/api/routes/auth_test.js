const test = require("tape");
const request = require("supertest");
const status = require("http-status");
const bcrypt = require("bcrypt");
const Koa = require("koa");
const server = new Koa();

const routes = require("./auth");
const config = {
    auth: {
        secret: "geheim"
    },
    users: []
};

server.use(async(ctx, next) => {
    ctx.state.config = config;
    await next();
});

server.use(routes.routes());

test("expects authentication", async assert => {
    const app = server.listen(0);
    const res = await request(app).post("/api/auth");

    assert.equal(res.status, status.FORBIDDEN);
    app.close();
    assert.end();
});

test("expects a valid password", async assert => {
    const app = server.listen(0);
    const res = await request(app)
        .post("/api/auth")
        .send({ username: "foo", password: "bar" });

    assert.equal(res.status, status.FORBIDDEN);
    app.close();
    assert.end();
});

test("it rewards a valid password", async assert => {
    const app = server.listen(0);
    const hash = await bcrypt.hash("foobar", 10);

    config.users.push({
        name: "foo",
        hash
    });

    const res = await request(app)
        .post("/api/auth")
        .send({ username: "foo", password: "foobar" });

    assert.ok(res.ok);
    assert.ok(res.body.token);

    app.close();
    assert.end();
});