const { distanceInWords, differenceInDays, format} = require("date-fns");

function displayDate (date) {
    let dt = new Date(date);
    let now = new Date();
    
    let diff = differenceInDays(now, dt);

    if (diff < 1) return format(dt, "HH:MM");
    if (diff < 5) return distanceInWords(dt, now);
    return format(dt, "DD/MM/YY");
}

module.exports = {displayDate};