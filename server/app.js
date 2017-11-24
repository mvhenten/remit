

const Maildir = require("./maildir/maildir");


const maildir = Maildir.init();

require("./api/routes");
require("./maildir/mta")({maildir});
require("./index/index").init({maildir});