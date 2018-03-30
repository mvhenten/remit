const test = require("tape");
const Selection = require("./selection");


let items = [1, 2, 3, 4, 5];

test("it should add to selection", assert => {
    let select = new Selection(items);

    select.add(0);
    select.add(2);
    select.add(4);

    assert.deepEqual(select.selected, [1, 3, 5]);
    assert.end();
});

test("it should increment selection", assert => {
    let select = new Selection(items);
    
    select.set(0);

    select.incr();
    select.incr();
    select.incr();

    assert.deepEqual(select.selected, [1, 2, 3]);
    assert.end();
});

test("it should decrement selection", assert => {
    let select = new Selection(items);

    select.set(4);
    select.decr();
    select.decr();
    select.decr();

    assert.deepEqual(select.selected, [2, 3, 4, 5]);
    assert.end();
});

test("it delete one from selection", assert => {
    let select = new Selection(items);

    select.set(4);
    select.decr();
    select.decr();
    select.decr();
    select.delete(4);

    assert.deepEqual(select.selected, [2, 3, 4]);
    assert.end();
});

