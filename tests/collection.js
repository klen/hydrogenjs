/*global atom, hydrogen, console, module, test, equal, raises, ok */

atom.dom(function () {
    "use strict";

    var a, b, c, d, e, col, otherCol,
        lastRequest = null,
        sync = hydrogen.sync;

    module("hydrogen.Collection", {

        setup: function () {
            a         = new hydrogen.Model({id: 3, label: 'a'});
            b         = new hydrogen.Model({id: 2, label: 'b'});
            c         = new hydrogen.Model({id: 1, label: 'c'});
            d         = new hydrogen.Model({id: 0, label: 'd'});
            e         = null;
            col       = new hydrogen.Collection([a, b, c, d]);
            otherCol  = new hydrogen.Collection();

            hydrogen.sync = function (method, model, options) {
                lastRequest = {
                    method: method,
                    model: model,
                    options: options
                };
            };
        },

        teardown: function () {
            hydrogen.sync = sync;
        }

    });

    test("Collection: new and sort", function () {
        equal(col.first.cid, a.cid, "a should be first");
        equal(col.last.cid, d.cid, "d should be last");
        col.comparator = function (a, b) {
            return a.id > b.id ? -1 : 1;
        };
        col.sort();
        equal(col.first.cid, a.cid, "a should be first");
        equal(col.last.cid, d.cid, "d should be last");
        col.comparator = function (model) { return model.id; };
        col.sort();
        equal(col.first.cid, d.cid, "d should be first");
        equal(col.last.cid, a.cid, "a should be last");
        equal(col.length, 4);
    });

    test("Collection: get, getByCid", function () {
        equal(col.get(0).cid, d.cid);
        equal(col.get(2).cid, b.cid);
        equal(col.getByCid(col.last.cid).cid, col.last.cid);
    });

    test("Collection: get with non-default ids", function () {
        var col = new hydrogen.Collection(),
            MongoModel = hydrogen.Model.extend({
                idAttribute: '_id'
            }),
            model = new MongoModel({_id: 100});
        equal(model.id, 100);
        col.add(model);
        equal(col.get(100).cid, model.cid);
        model.set({_id: 101});
        equal(col.get(101).cid, model.cid);
    });

    test("Collection: update index when id changes", function () {
        var one, col = new hydrogen.Collection();
        col.add([
            {id : 0, name : 'one'},
            {id : 1, name : 'two'}
        ]);
        one = col.get(0);
        equal(one.get('name'), 'one');
        one.set({id : 101});
        equal(col.get(0), null);
        equal(col.get(101).get('name'), 'one');
    });

    test("Collection: at", function () {
        equal(col.at(2).cid, c.cid);
    });

    test("Collection: pluck", function () {
        equal(col.pluck('label').join(' '), 'a b c d');
    });

    test("Collection: add", function () {
        var added, opts, secondAdded,
            f = new hydrogen.Model({id: 20, label : 'f'}),
            g = new hydrogen.Model({id: 21, label : 'g'}),
            h = new hydrogen.Model({id: 22, label : 'h'}),
            atCol = new hydrogen.Collection([f, g, h]);
        added = opts = secondAdded = null;
        e = new hydrogen.Model({id: 10, label : 'e'});
        otherCol.add(e);
        otherCol.events.add('add', function () {
            secondAdded = true;
        });
        col.events.add('add', function (model, collection, options) {
            added = model.get('label');
            equal(options.index, 4);
            opts = options;
        });
        col.add(e, {amazing: true});

        equal(added, 'e');
        equal(col.length, 5);
        equal(col.last.cid, e.cid);
        equal(otherCol.length, 1);
        equal(secondAdded, null);
        ok(opts.amazing);

        equal(atCol.length, 3);
        atCol.add(e, {at: 1});
        equal(atCol.length, 4);
        equal(atCol.at(1), e);
        equal(atCol.last, h);
    });

    test("Collection: add multiple models", function () {
        var i, col = new hydrogen.Collection([{at: 0}, {at: 1}, {at: 9}]);
        col.add([{at: 2}, {at: 3}, {at: 4}, {at: 5}, {at: 6}, {at: 7}, {at: 8}], {at: 2});
        for (i = 0; i <= 5; i++) {
            equal(col.at(i).get('at'), i);
        }
    });

    test("Colllection: non-persisted model destroy removes from all collections", function () {
        var e = new hydrogen.Model({title: 'Othello'}),
            colE = new hydrogen.Collection([e]),
            colF = new hydrogen.Collection([e]);
        e.sync = function (method, model, options) { throw "should not be called"; };
        e.destroy();
        ok(colE.length == 0);
        ok(colF.length == 0);
        equal(undefined, e.collection);
    });

    test("Collection: fetch", function () {
        col.fetch();
        equal(lastRequest.method, 'read');
        equal(lastRequest.model, col);
        equal(lastRequest.options.parse, true);

        col.fetch({parse: false});
        equal(lastRequest.options.parse, false);
    });

    test("Collection: create", function () {
        var model = col.create({label: 'f'}, {wait: true});
        equal(lastRequest.method, 'create');
        equal(lastRequest.model.cid, model.cid);
        equal(model.get('label'), 'f');
        equal(model.collection.cid, col.cid);
    });

    test("Collection: can't add different model with same id to collection twice", function () {
        var col = new hydrogen.Collection();
        col.add({id: 101});
        col.add({id: 101});
        equal(col.length, 1);
    });

    test("Collection: add model to multiple collections", function () {
        var counter = 0,
            e = new hydrogen.Model({id: 10, label : 'e'}),
            colE = new hydrogen.Collection(),
            colF = new hydrogen.Collection();

        e.bind('add', function (model, collection) {
            counter += 1;
            equal(e, model);
            if (counter > 1) {
                equal(collection, colF);
            } else {
                equal(collection, colE);
            }
        });
        colE.bind('add', function (model, collection) {
            equal(e, model);
            equal(colE, collection);
        });
        colF.bind('add', function (model, collection) {
            equal(e, model);
            equal(colF, collection);
        });
        colE.add(e);
        equal(e.collection, colE);
        colF.add(e);
        equal(e.collection, colE);
    });

    test("Collection: remove", function () {
        var removed = null,
            otherRemoved = null;
        col.bind('remove', function (model, col, options) {
            removed = model.get('label');
            equal(options.index, 3);
        });
        otherCol.bind('remove', function (model, col, options) {
            otherRemoved = true;
        });
        col.remove(d);
        equal(removed, 'd');
        equal(col.length, 3);
        equal(col.first, a);
        equal(otherRemoved, null);
    });

    test("Collection: events are unbound on remove", function () {
        var counter = 0,
            dj = new hydrogen.Model(),
            emcees = new hydrogen.Collection([dj]);
        emcees.bind('change', function () { counter++; });
        dj.set({name : 'Kool'});
        equal(counter, 1);
        emcees.reset([]);
        equal(dj.collection, undefined);
        dj.set({name : 'Shadow'});
        equal(counter, 1);
    });

    test("Collection: remove in multiple collections", function () {
        var modelData = {
            id : 5,
            title : 'Othello'
        },
            passed = false,
            e = new hydrogen.Model(modelData),
            f = new hydrogen.Model(modelData),
            colE = new hydrogen.Collection([e]),
            colF = new hydrogen.Collection([f]);
        f.bind('remove', function () {
            passed = true;
        });
        ok(e != f);
        ok(colE.length == 1);
        ok(colF.length == 1);
        colE.remove(e);
        equal(passed, false);
        ok(colE.length == 0);
        colF.remove(e);
        ok(colF.length == 0);
        equal(passed, true);
    });

    test("Collection: remove same model in multiple collection", function () {
        var counter = 0,
            e = new hydrogen.Model({id: 5, title: 'Othello'}),
            colE = new hydrogen.Collection([e]),
            colF = new hydrogen.Collection([e]);

        e.bind('remove', function (model, collection) {
            counter++;
            equal(e, model);
            if (counter > 1) {
                equal(collection, colE);
            } else {
                equal(collection, colF);
            }
        });
        colE.bind('remove', function (model, collection) {
            equal(e, model);
            equal(colE, collection);
        });
        colF.bind('remove', function (model, collection) {
            equal(e, model);
            equal(colF, collection);
        });
        equal(colE, e.collection);
        colF.remove(e);
        ok(colF.length == 0);
        ok(colE.length == 1);
        equal(counter, 1);
        equal(colE, e.collection);
        colE.remove(e);
        equal(null, e.collection);
        ok(colE.length == 0);
        equal(counter, 2);
    });

    test("Collection: model destroy removes from all collections", function () {
        var e = new hydrogen.Model({id: 5, title: 'Othello'}),
            colE = new hydrogen.Collection([e]),
            colF = new hydrogen.Collection([e]);

        e.sync = function (method, model, options) { options.onLoad({}); };
        e.destroy();
        ok(colE.length == 0);
        ok(colF.length == 0);
        equal(undefined, e.collection);
    });

    test("Colllection: non-persisted model destroy removes from all collections", function () {
        var e = new hydrogen.Model({title: 'Othello'}),
            colE = new hydrogen.Collection([e]),
            colF = new hydrogen.Collection([e]);
        e.sync = function (method, model, options) { throw "should not be called"; };
        e.destroy();
        ok(colE.length == 0);
        ok(colF.length == 0);
        equal(undefined, e.collection);
    });

    test("Collection: initialize", function () {
        var Collection = hydrogen.Collection.extend({
                initialize: function () {
                    this.one = 1;
                }
            }),
            coll = new Collection();
        equal(coll.one, 1);
    });

    test("Collection: toJSON", function () {
        equal(JSON.stringify(col), '[{"id":3,"label":"a"},{"id":2,"label":"b"},{"id":1,"label":"c"},{"id":0,"label":"d"}]');
    });

});
