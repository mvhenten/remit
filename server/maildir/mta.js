const debug = require("debug")("remit:mta");
const filter = require("./filter");

module.exports = async function mta({maildir}) {
    maildir.on("received", async message => {
        
        const target = "cur";
        
        if (message.spam)
            target = ".spam";
        else {
            await message.parseHeaders();
            const match = filter.match(message.user, message);
            
            if (match)
                target = match.target;
        }
        
        await message.move(target);

        debug("delivered to: ", target);
        maildir.emit("delivered", message);
    });
    
    debug("loaded");
};