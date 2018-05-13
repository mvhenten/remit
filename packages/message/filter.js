const {parse} = require("email-filter");

function matchCheck(value, check) {
    let accept = new RegExp(check);

    if (Array.isArray(value))
        return value.some(val => accept.test(val.text));

    return accept.test(value);
}

function matchValue(value, check) {
    if (!value) return false;

    if (check.value)
        return matchCheck(value, check.value);

    if (check.reject && matchCheck(value, check.reject))
        return false;

    if (check.accept)
        return matchCheck(value, check.accept);

    return false;
}

function matchFilter({filter}, headers) {
    return filter.every(check => {
        switch (check.key) {
            case "match":
                return ["to", "from", "subject"].some(key => matchValue(headers[key], check));
            case "to":
                return matchValue(headers.to, check);
            case "from":
                return matchValue(headers.from, check);
            case "subject":
                return matchValue(headers.subject, check);
        }
        return false;
    });
}


module.exports.match = function match(filters, headers) {
    let normalized = filters.map(({ filter, target }) => ({
        filter: parse(filter),
        target
    }));

    return normalized.find(filter => matchFilter(filter, headers));
};