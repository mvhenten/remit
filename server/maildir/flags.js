"use strict";

const FLAG_NAMES = {
    R: "replied",
    S: "seen",
    P: "passed",
    T: "trashed",
    D: "draft",
    F: "flag",
    X: "spam"
};

const FLAG_VALUES = {};

for (let key in FLAG_NAMES) {
    let val = FLAG_NAMES[key];
    FLAG_VALUES[val] = key;
}

function split(filename) {
    let cur = "";

    let basename = "";
    let flags = [];

    const state = {};
    
    state.basename = true;

    for (let i = 0; i < filename.length; i++) {
        let c = filename[i];
        switch (true) {
            case /:/.test(c):
                state.basename = false;
                break;
            case /:2,/.test(cur):
                state.flags = true;
            case state.flags:
                flags.push(c);
                break;
            case state.basename:
                basename += c;
                break;
        }
        cur += c;
    }

    return { basename, flags };
}

function parse(filename) {
    let { basename, flags } = split(filename);

    flags = flags.reduce((flags, flag) => {
        let key = FLAG_NAMES[flag];
        
        if (key) flags[key] = true;
        
        return flags;
    }, {});

    return { basename, flags };
}

module.exports.parse = parse;

function format(filename, update) {
    let { basename, flags } = parse(filename);

    flags = Object.assign(flags, update);

    flags = Object.keys(flags)
        .map(key => flags[key] ? FLAG_VALUES[key] : null)
        .filter(Boolean);

    if (update.basename)
        basename = update.basename;

    if (!flags.length)
        return basename;

    return `${basename}:2,${flags.sort().join("")}`;
}

module.exports.format = format;