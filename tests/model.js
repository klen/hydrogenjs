/*global atom, hydrogen, console, module, test, equal, raises, ok, expect */

atom.dom(function () {
    "use strict";

    var doc, collection,
        ajaxParams,
        Proxy = hydrogen.Model,
        Klass = hydrogen.Collection,
        sync = hydrogen.sync,
        ajax = atom.ajax,
        lastRequest = null;

    module("hydrogen.Model", {

        setup: function () {
            doc = new Proxy({
                id     : '1-the-tempest',
                title  : "The Tempest",
                author : "Bill Shakespeare",
                length : 123
            });
            collection = new Klass([], {
                url: '/collection'
            });
            collection.add(doc);
            hydrogen.sync = function (method, model, options) {
                lastRequest = {
                    method: method,
                    model: model,
                    options: options
                };
                sync.apply(this, arguments);
            };
            atom.ajax = function (params) { ajaxParams = params; };
        },

        teardown: function () {
            hydrogen.sync = sync;
            atom.ajax = ajax;
        }

    });

    test("Model: configure", function () {
        var Model = hydrogen.Model.extend({
                configure: function () {
                    this.one = 1;
                    equal(this.collection.cid, collection.cid);
                }
            }),
            model = new Model({}, {collection: collection});
        equal(model.one, 1);
        equal(model.collection.cid, collection.cid);
    });

    test("Model: initialize with attributes and options", function () {
        var Model = hydrogen.Model.extend({
            configure: function () {
                this.one = this.settings.get('one');
            }
        }),
            model = new Model({}, {one: 1});
        equal(model.one, 1);
    });

    test("Model: initialize with parsed attributes", function () {
        var Model = hydrogen.Model.extend({
            parse: function (obj) {
                obj.value += 1;
                return obj;
            }
        }),
            model = new Model({value: 1}, {parse: true});
        equal(model.get('value'), 2);
    });

    test("Model: url", function () {
        doc.urlRoot = null;
        equal(doc.url(), '/collection/1-the-tempest');
        doc.collection.url = '/collection/';
        equal(doc.url(), '/collection/1-the-tempest');
        doc.collection = null;
        raises(function () { doc.url(); });
        doc.collection = collection;
    });

    test("Model: clone", function () {
        var a = new hydrogen.Model({ 'foo': 1, 'bar': 2, 'baz': 3}),
            b = a.clone();
        equal(a.get('foo'), 1);
        equal(a.get('bar'), 2);
        equal(a.get('baz'), 3);
        equal(b.get('foo'), a.get('foo'), "Foo should be the same on the clone.");
        equal(b.get('bar'), a.get('bar'), "Bar should be the same on the clone.");
        equal(b.get('baz'), a.get('baz'), "Baz should be the same on the clone.");
        a.set({foo : 100});
        equal(a.get('foo'), 100);
        equal(b.get('foo'), 1, "Changing a parent attribute does not change the clone.");
    });

    test("Model: isNew", function () {
        var a = new hydrogen.Model({ 'foo': 1, 'bar': 2, 'baz': 3});
        ok(a.isNew(), "it should be new");
        a = new hydrogen.Model({ 'foo': 1, 'bar': 2, 'baz': 3, 'id': -5 });
        ok(!a.isNew(), "any defined ID is legal, negative or positive");
        a = new hydrogen.Model({ 'foo': 1, 'bar': 2, 'baz': 3, 'id': 0 });
        ok(!a.isNew(), "any defined ID is legal, including zero");
        ok(new hydrogen.Model({          }).isNew(), "is true when there is no id");
        ok(!new hydrogen.Model({ 'id': 2  }).isNew(), "is false for a positive integer");
        ok(!new hydrogen.Model({ 'id': -5 }).isNew(), "is false for a negative integer");
    });

    test("Model: get", function () {
        equal(doc.get('title'), 'The Tempest');
        equal(doc.get('author'), 'Bill Shakespeare');
    });

    test("Model: escape", function () {
        equal(doc.escape('title'), 'The Tempest');
        doc.set({audience: 'Bill & Bob'});
        equal(doc.escape('audience'), 'Bill &amp; Bob');
        doc.set({audience: 'Tim > Joan'});
        equal(doc.escape('audience'), 'Tim &gt; Joan');
        doc.set({audience: 10101});
        equal(doc.escape('audience'), '10101');
        doc.unset('audience');
        equal(doc.escape('audience'), '');
    });

    test("Model: has", function () {
        var a = new hydrogen.Model();
        equal(a.has("name"), false);
        [true, "Truth!", 1, false, '', 0].forEach(function (value) {
            a.set({'name': value});
            equal(a.has("name"), true);
        });
        a.unset('name');
        equal(a.has('name'), false);
        [null, undefined].forEach(function (value) {
            a.set({'name': value});
            equal(a.has("name"), false);
        });
    });

    test("Model: set and unset", function () {
        expect(8);
        var a = new hydrogen.Model({id: 'id', foo: 1, bar: 2, baz: 3}),
            changeCount = 0;
        a.bind("change:foo", function () { changeCount += 1; });
        a.set({'foo': 2});
        ok(a.get('foo') == 2, "Foo should have changed.");
        ok(changeCount == 1, "Change count should have incremented.");
        a.set({'foo': 2}); // set with value that is not new shouldn't fire change event
        ok(a.get('foo') == 2, "Foo should NOT have changed, still 2");
        ok(changeCount == 1, "Change count should NOT have incremented.");

        a.validate = function (attrs) {
            equal(attrs.foo, undefined, "don't ignore values when unsetting");
        };
        a.unset('foo');
        equal(a.get('foo'), undefined, "Foo should have changed");
        delete a.validate;
        ok(changeCount == 2, "Change count should have incremented for unset.");

        a.unset('id');
        equal(a.id, undefined, "Unsetting the id should remove the id property.");
    });

    test("Model: multiple unsets", function () {
        var i = 0, counter = function () { i++; }, model = new hydrogen.Model({a: 1});
        model.bind("change:a", counter);
        model.set({a: 2});
        model.unset('a');
        model.unset('a');
        equal(i, 2, 'Unset does not fire an event for missing attributes.');
    });

    test("Model: using a non-default id attribute.", function () {
        var MongoModel = hydrogen.Model.extend({idAttribute : '_id'}),
            model = new MongoModel({id: 'eye-dee', _id: 25, title: 'Model'});
        equal(model.get('id'), 'eye-dee');
        equal(model.id, 25);
        equal(model.isNew(), false);
        model.unset('_id');
        equal(model.id, null);
        equal(model.isNew(), true);
    });

    test("Model: save", function () {
        doc.save({title : "Henry V"});
        equal(lastRequest.method, 'update');
        equal(lastRequest.model, doc);
    });

    test("Model: save in positional style", function () {
        var model = new hydrogen.Model();
        model.sync = function (method, model, options) {
            console.log(method, model, options);
            options.onLoad();
        };
        model.save('title', 'Twelfth Night');
        equal(model.get('title'), 'Twelfth Night');
    });

    test("Model: fetch", function () {
        doc.fetch();
        equal(lastRequest.method, 'read');
        ok(lastRequest.model ==  doc);
    });

    test("Model: destroy", function () {
        doc.destroy();
        equal(lastRequest.method, 'delete');
        ok(lastRequest.model ==  doc);

        var newModel = new hydrogen.Model();
        equal(newModel.destroy(), false);
    });

});
