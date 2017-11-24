const Router = require("./router");
const { route } = require("preact-router");
const router = new Router();

const { maildirStore } = require("../action/maildir");
const { threadStore } = require("../action/thread");

const { appState } = require("../action/app");
const { authStore } = require("../action/auth");

const keyboard = require("../lib/keys");


keyboard.reset();

keyboard.context("messages", kb => {
    keyboard.on("tab", (evt) => {
        evt.preventDefault();
        keyboard.nextContext();
    });

    kb.on("up", (evt) => {
        evt.preventDefault();
        appState.selectPrevThread(evt);
    });

    kb.on("down", (evt) => {
        evt.preventDefault();
        appState.selectNextThread(evt);
    });

    kb.on("del", (evt) => {
        evt.preventDefault();
        appState.deleteThread();
    });
});

keyboard.context("thread", kb => {
    keyboard.on("tab", (evt) => {
        evt.preventDefault();
        keyboard.nextContext();
    });

    kb.on("up", (evt) => {
        evt.preventDefault();

        console.log("up thread..");
    });

    kb.on("down", (evt) => {
        evt.preventDefault();
        console.log("down thread");
    });

    kb.on("del", (evt) => {
        evt.preventDefault();
        // appState.deleteThread();
    });
});

keyboard.context("header", kb => {
   kb.on("tab", (evt) => {
       console.log(evt.target.tagName);
       console.log("TAB");

        evt.preventDefault();
        keyboard.nextContext();
   });
});

keyboard.setContext("messages");


router.use((ctx, next) => {
    if (!authStore.authenticated) {
        route("/login");
    }
    next();
});

router.use((ctx, next) => {
    maildirStore.fetch(true);
    next();
});

router.use("/login", (ctx, next) => {
    if (authStore.authenticated) {
        route("/login");
    }
    next();
});

router.use("/", (ctx, next) => {
    route("/inbox");
    next();
});

router.use("/inbox", async(ctx, next) => {
    await maildirStore.fetch(true);
    const folder = maildirStore.getMaildir();

    route(`/inbox/${folder.id}`);
    next();
});

router.use("/inbox/:folderId", async(ctx, next) => {
    const { folderId } = ctx.params;

    await maildirStore.fetch(true);
    await maildirStore.fetchThreads(folderId);

    const thread = maildirStore.getActiveThread(folderId);
    const { messages } = thread;
    const [activeParent] = messages;

    route(`/inbox/${folderId}/${activeParent.parentId}`);
    next();
});

router.use("/inbox/:folderId/:parentId", async(ctx, next) => {
    const { folderId, parentId } = ctx.params;


    appState.setState({
        location: {
            folderId,
            parentId
        }
    });


    await maildirStore.fetchThreads(folderId);

    appState.selectThread(parentId);

    await threadStore.fetch(parentId);
    await threadStore.markThreadRead(parentId);

    next();
});

module.exports = function(evt) {
    router.route(evt.url);
};