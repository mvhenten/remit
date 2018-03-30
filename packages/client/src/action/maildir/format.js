const map = [{
        name: ".cur",
        title: "Inbox",
        index: 0,
    },
    {
        name: ".spam",
        title: "Spam",
        index: 1000,
    }
];

function format(maildir) {
    const formatted = maildir.map((folder) => {
        let def = map.find(def => def.name == folder.folder);

        const href = `/inbox/${folder.id}`;

        if (!def) {
            const name = folder.folder.replace(/^[.]/, "");
            const index = 10;
            const title = name;
            def = { name, index, title };
        }

        return Object.assign(def, folder, { href });
    });

    formatted.sort((a, b) => {
        if (a.name < b.name) return -1;
        if (a.name > b.name) return 1;
        return 0;
    });
    formatted.sort((a, b) => a.index - b.index);

    return formatted;
}

module.exports = format;