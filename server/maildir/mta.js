const debug = require("debug")("remit:mta");
const filter = require("./filter");

const getTarget = async message => {
    if (message.spam) 
        return ".spam";

    await message.parseHeaders();
    const match = filter.match(message.user, message);

    if (match) return match.target;
    return "cur";
};

module.exports = async function mta({maildir}) {
    maildir.on("received", async message => {
        const target = await getTarget(message);
        await message.move(target);

        debug("delivered to: ", target);
        maildir.emit("delivered", message);
    });
    
    debug("loaded");
};