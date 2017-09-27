const fs = require("fs");
const path = require("path");
const {promisify} = require("util");
const readdir = promisify(fs.readdir);
const stat = promisify(fs.stat);
const Flags = require("./flags");


const folders = async base => {
    const files = await readdir(base);
    const result = [];
    
    for (let file of files) {
        const fullPath = path.join(base, file);
        const fileStat = await stat(fullPath);
        
        if (fileStat.isFile())
            continue;
            
        result.push(fullPath);
    }
    
    return result;
};

const count = async folder => {
    const files = await readdir(folder);
    const info  = files.map(file => Flags.parse(file));
    const count = info.filter(flags => !flags.seen);
    
    return {
        folder: path.basename(folder),
        unseen: count.length,
        total: info.length
    };
};

const counts = async basename => {
    const dirs = await folders(basename);
    const info = await Promise.all(dirs.map(count));
    
    return info;
};

module.exports.folders = function(user) {
    return counts(user.maildir);
};
