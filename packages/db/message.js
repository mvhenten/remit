"use strict";

const Schema = require("drawers");
const Types = require("izza/types");
const uuidv5 = require('uuid/v5');
const {pullStream} = require("./util/stream");
const { Transform } = require('stream');
const ms = require("milliseconds");
const threadStream = require("./transform/thread");
const {CoercedAddress, CoercedDate, CoercedMessageId, DefaultValue} = require("./util/coerce");

function createSortDate(dt) {
    if (!dt) return;
    let key = dt.getTime().toString(36);
    return ( "000000" + key).slice(-14);
}

function createLoadMessageStream(self) {
    return new Transform({
        objectMode: true,
        async transform(chunk, encoding, next) {
            let messageId = chunk.value;
            let key  = chunk.key;
            let value = await self.loadByMessageId({messageId});

            next(null, { value, key });
        }
    });
}

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
                to: DefaultValue(Array, []),
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
                messageId: CoercedMessageId,
            },

            indexes: [{
                name: "byMessageId",
                key: "message:$messageId",
                value: (values) => values
            }, {
                name: "byDateAndInbox",
                key: "inboxdate:$inbox:$sortDate:$messageId",
                value: values => values.messageId,
                transform: self => createLoadMessageStream(self),
                prepare: ({date, inbox, messageId}) => ({
                    sortDate: createSortDate(date),
                    inbox,
                    messageId
                })

            }, {
                name: "byParent",
                key: "parent:$parentId:$sortDate:$messageId",
                value: ({messageId}) => messageId,
                transform: self => createLoadMessageStream(self),
                prepare: ({parentId, date, messageId}) =>  ({
                    parentId,
                    messageId,
                    sortDate: createSortDate(date)
                })
            }]
        };
    }

    loadByRawMessageId(rawMessageId) {
        let messageId = CoercedMessageId.coerce(rawMessageId);
        return this.loadByMessageId({messageId});
    }

    loadMessagesByParentId(parentId) {
        return pullStream(this.streamFromParentIdAndDate(parentId));
    }

    streamByThread(inbox, options) {
        return this.streamFromInboxAndDate(inbox, options).pipe(threadStream(this, options));
    }

    streamFromInboxAndDate(inbox, options={}) {
        let {end=Date.now(), start=Date.now() - ms.days(10000), keys=true} = options;

        const query = {
            reverse: true,
            keys,
            gte: {
                date: new Date(start),
                inbox,
            },
            lte: {
                date: new Date(end),
                inbox: inbox,
            },
        };

        return this.streamByDateAndInbox(query);
    }
}

module.exports = Message;