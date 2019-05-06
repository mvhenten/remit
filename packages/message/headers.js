const fs = require("fs");
const BUF_SIZE = 512;

async function parseHeaders(buffer) {
    let result = {};
    let key = "";
    let cur = "";

    let state = "key";
    let index = 0;

    let email = buffer.get().toString();

    while (index < email.length) {
        let char = email[index];

        index++;

        if (index == email.length) {
            let str = buffer.get().toString();
            email += str;
        }

        if (/\n/.test(char) && state == "break") {
            if (result[key] && !Array.isArray(result[key]))
                result[key] = [result[key]];

            if (Array.isArray(result[key]))
                result[key].push(cur);
            else
                result[key] = cur;
            break;
        }
        if (/\n/.test(char)) {
            state = "break";
            continue;
        }
        if (/\S/.test(char) && state == "break") {
            state = "key";

            if (result[key] && !Array.isArray(result[key]))
                result[key] = [result[key]];

            if (Array.isArray(result[key]))
                result[key].push(cur);
            else
                result[key] = cur;

            cur = char;
            continue;
        }
        if (/:/.test(char) && state == "key") {
            key = cur;
            cur = "";
            state = "value";
            continue;
        }
        if (state == "break") {
            state = "value";
        }

        cur += char;
    }

    buffer.close();

    return result;
}

const buffer = (filename) => {
    const fd = fs.openSync(filename);
    return {
        get() {
            const contents = Buffer.from(new Array(BUF_SIZE).fill(" "));
            fs.readSync(fd, contents, 0, BUF_SIZE, null);
            return contents;
        },

        close() {
            fs.closeSync(fd);
        }
    };
};

module.exports.parse = async (filename) => {
    let contents = buffer(filename);
    return parseHeaders(contents);
};