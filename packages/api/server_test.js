const test = require("tape");
const request = require("supertest");
const config = require("./config");
const status = require("http-status");
const webtoken = require("jsonwebtoken");

const server = require("./server");

test("expects authentication", async assert => {
    const app = server.listen(0);
    const res = await request(app).get("/foo");

    assert.equal(res.code, status.FORBIDEN);
    app.close();
    assert.end();
});

test("responds when authenticated", async assert => {
    const app = server.listen(0);
    const token = webtoken.sign({ test: "ok" }, config.auth.secret);

    const res = await request(app)
        .get("/ping")
        .set('Authorization', `Bearer ${token}`);

    assert.ok(res.ok);
    app.close();
    assert.end();
});