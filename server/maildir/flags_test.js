const test = require("tape");
const Flags = require("./flags");

test("parse", assert => {

    const testCases = [{
            label: "parse all the flags",
            filename: "/path/to/maildir/new/foo.bar.test,S=8238,W=8329:2,RSPTDFabc",
            expect: {
                basename: '/path/to/maildir/new/foo.bar.test,S=8238,W=8329',
                flags: {
                    replied: true,
                    seen: true,
                    passed: true,
                    trashed: true,
                    draft: true,
                    flag: true
                }
            }
        },
        {
            label: "parse all one flag",
            filename: "/path/to/maildir/new/foo.bar.test,S=8238,W=8329:2,S",
            expect: {
                basename: '/path/to/maildir/new/foo.bar.test,S=8238,W=8329',
                flags: {
                    seen: true,
                }
            }
        },
        {
            label: "parse with no flag",
            filename: "/path/to/maildir/new/foo.bar.test,S=8238,W=8329",
            expect: {
                basename: '/path/to/maildir/new/foo.bar.test,S=8238,W=8329',
                flags: {}
            }
        },
    ];

    testCases.forEach(({ filename, label, expect }) => {
        const result = Flags.parse(filename);
        assert.deepEqual(result, expect, label);
    });

    assert.end();
});

test("format", assert => {
    const testCases = [
        {
            label: "add a flag",
            expect: "/maildir/new/foo.bar.test,S=8238,W=8329:2,S",
            args: [
                "/maildir/new/foo.bar.test,S=8238,W=8329",
                {
                    seen: true,
                }
            ]
        },
        {
            label: "remove a flag",
            expect: "/maildir/new/foo.bar.test,S=8238,W=8329:2,S",
            args: [
                "/maildir/new/foo.bar.test,S=8238,W=8329:2,SR",
                {
                    seen: true,
                    replied: false
                }
            ]
        },
        {
            label: "remove and addd a flag",
            expect: "/maildir/new/foo.bar.test,S=8238,W=8329:2,FS",
            args: [
                "/maildir/new/foo.bar.test,S=8238,W=8329:2,SR",
                {
                    flag: true,
                    replied: false
                }
            ]
        },
        {
            label: "change basename",
            expect: "/maildir/new/foo.biz:2,FS",
            args: [
                "/maildir/new/foo.bar.test,S=8238,W=8329:2,SR",
                {
                    basename: "/maildir/new/foo.biz",
                    flag: true,
                    replied: false
                }
            ]
        },
    ];
    
    testCases.forEach(({label, args, expect}) => {
        const [filename, flags] = args;
        const result = Flags.format(filename, flags);
        
        assert.equal(result, expect, label);
    });


    assert.end();
});