const NotFound = (ctx) => {
    ctx.status = 404;
    ctx.body = { error: "Not Found" };
};

module.exports = { NotFound };