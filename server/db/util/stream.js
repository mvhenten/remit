const pullStream = async(stream) => {
    return new Promise((resolve, reject) => {
        const collect = [];

        stream.on("finish", () => resolve(collect));
        stream.on("error", () => reject(collect));
        stream.on("data", (chunk) => collect.push(chunk));
    });
};

module.exports.pullStream = pullStream;