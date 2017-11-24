const ptr = require("path-to-regexp");
const compose = require("koa-compose");
const state = new WeakMap();

class Router {
    constructor(options = {}) {
        const callbacks = [];
        const queue = [];
        state.set(this, { callbacks, queue });
    }

    use(path, callback) {
        if (!callback)
            [callback, path] = [path, callback];

        var keys = [];

        if (path) {
            path = ptr(path, keys);
        }

        state.get(this)
            .callbacks.push({ path, callback, keys });
    }

    routes(path, ctx) {
        return state.get(this).callbacks.reduce((routes, route) => {
            if (!route.path)
                return [...routes, route.callback];

            let match = route.path.exec(path);
            
            if (match) {
                route.keys.forEach((key, index) => {
                    ctx.params[key.name] = match[index + 1];
                });

                routes.push(route.callback);
            }

            return routes;
        }, []);
    }


    async drainQueue() {
        const { queue } = state.get(this);
        if (!queue.length)
            return;

        const [{ path, ctx = {} }] = queue;

        ctx.params = {};

        const routes = this.routes(path, ctx);
        const run = compose(routes);

        await run(ctx);

        queue.shift();
        this.drainQueue();
    }

    async route(path, ctx) {
        const { queue } = state.get(this);

        queue.push({ path, ctx });

        if (queue.length == 1)
            this.drainQueue();
    }
}

module.exports = Router;