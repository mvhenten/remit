const NotFound = (ctx, message) => {
    ctx.status = 404;
    ctx.body = { error: message || "Not Found" };
};

module.exports = { NotFound };