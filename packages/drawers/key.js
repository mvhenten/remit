"use strict";

const inspect = (v) => console.log(JSON.stringify(v, null, 2));


function format(ast, source) {
    if (typeof ast == "function")
        return ast(source);


    if (typeof ast == "string")
        ast = parse(ast);

    // const sublevel = ast.shift();

    let values = ast.map(key => {
        if (!key.name)
            return key;

        if (key.name && !key.node)
            return source[key.name];

        if (key.node)
            return format(key.node, source[key.name]);
    });

    return values;

    // return {
    //     prefix: sublevel,
    //     key: values
    // };
}

module.exports.format = format;


function parseKey(str) {
    let parts = str.substring(1).split(".");

    let nodes = [];
    let cur = nodes;

    for (let i = 0; i < parts.length; i++) {
        let part = parts[i];
        let node = {
            name: part
        };

        cur.push(node);

        if (i != parts.length - 1) {
            node.node = [];
            cur = node.node;
        }
    }

    return nodes[0];
}


function parse(fmt) {
    if (typeof fmt == "function")
        return fmt;

    let keys = fmt.split(/[~:]/);

    let parsedKeys = [];

    for (let i = 0; i < keys.length; i++) {
        let key = keys[i];

        if (!/^\$/.test(key)) {
            parsedKeys.push(key);
            continue;
        }

        parsedKeys.push(parseKey(key));
    }

    return parsedKeys;
}

module.exports.parse = parse;

function generate(fmt, values) {
    return format(parse(fmt), values);
}

module.exports.generate = generate;