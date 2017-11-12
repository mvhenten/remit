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
    maildir.on("file", async message => {
        const target = await getTarget(message);
        
        message.inbox = target;
        
        // await message.move(target);
        await message.store();

        debug("delivered to: ", message.path);
        maildir.emit("delivered", message);
    });
    
    debug("loaded");
};