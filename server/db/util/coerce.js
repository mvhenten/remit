"use strict";
const uuidv5 = require('uuid/v5');
const uuid = require("uuid");


const CoercedMessageId = {
    type: String,
    coerce: value => {
        if (!value) value = uuid();

        if (!/^\w{8}-\w{4}-\w{4}-\w{4}-\w{12}$/.test(value))
            value = uuidv5(value, uuidv5.DNS);
        return value;
    }
};

const CoercedDate = {
    type: Date,
    coerce: value => {
        return new Date(value);
    }
};


const CoercedAddress = {
    type: String,
    coerce: value => {
        if (typeof value == "object")
            value = value.text;

        return value || "nobody";
    }
};

function DefaultValue(type, defaultValue) {
    return {
        type: type,
        coerce: value => value || defaultValue
    };
}



module.exports = { CoercedAddress, CoercedDate, CoercedMessageId, DefaultValue };