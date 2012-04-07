/*global atom, hydrogen, console, module, test, equal, raises, ok */

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
});
