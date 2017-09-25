"use strict";

const Schema = require("drawers");
const Types = require("izza/types");
const uuidv5 = require('uuid/v5');
const { Transform } = require('stream');

function createLoadMessageStream(self) {
    return new Transform({
        objectMode: true,
        async transform(chunk, encoding, next) {
            let messageId = chunk.value;
            let value = await self.loadByMessageId({messageId});

            next(null, { value });
        }
    });
}

const coerceMessageId = value => {
    if (!/^\w{8}-\w{4}-\w{4}-\w{4}-\w{12}$/.test(value))
        value = uuidv5(value, uuidv5.DNS);
    return value;
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
            
        return value;
    }
};

class Message extends Schema {
    get storage() {
        return {
            index: "byMessageId",

            schema: {
                contentType: Types.Maybe(Object),
                mimeVersion: Types.Maybe(String),
                subject: Types.Maybe(String),
                path: String,
                inbox: String,
                flags: Object,
                from: CoercedAddress,
                to: Array,
                date: CoercedDate,
                references: {
                    type: Array,
                    coerce(value) {
                        if (!Array.isArray(value))
                            value = [value];
                            
                        return value;
                    }
                },
                parentId: {
                    type: String,
                    coerce(value, values) {
                        if (value) return value;
                        
                        if (values.references)
                            value = typeof values.references == "string" ? values.references : values.references[0];
                            
                        return uuidv5(value || values.messageId, uuidv5.DNS);
                    }
                },
                messageId: {
                    type: String,
                    coerce: coerceMessageId,
                },
            },

            indexes: [{
                name: "byMessageId",
                key: "message:$messageId",
                value: (values) => values
            }, {
                name: "byDateAndInbox",
                key: "inboxdate:$sortDate:$inbox:$unseen:$messageId",
                value: values => values.messageId,
                transform: self => createLoadMessageStream(self),
                prepare: ({date, flags, inbox, messageId}) => ({
                    unseen: flags.seen || false,
                    sortDate: date.getTime().toString(36),
                    inbox,
                    messageId
                })
                
            }, {
                name: "byParent",
                key: "parent:$parentId:$sortDate:$messageId",
                value: values => values.messageId,
                transform: self => createLoadMessageStream(self),
                prepare: ({parentId, date, messageId}) => ({
                    parentId,
                    messageId,
                    sortDate: date.getTime().toString(36)
                })
            }]
        };
    }
}

Message.coerceMessageId = coerceMessageId;

module.exports = Message;