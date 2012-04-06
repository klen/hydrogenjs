atom.dom(function(){

    var proxy = hydrogen.Model,
        klass = hydrogen.Collection,
        sync = hydrogen.sync,
        ajax = atom.ajax,
        lastRequest = null;

    var doc, collection;

    module("hydrogen.Model", {

        setup: function() {
            doc = new proxy({
                id     : '1-the-tempest',
                title  : "The Tempest",
                author : "Bill Shakespeare",
                length : 123
            });
            collection = new klass({
                url: '/collection'
            });
            collection.add(doc);
            hydrogen.sync = function(method, model, options) {
                lastRequest = {
                    method: method,
                    model: model,
                    options: options
                };
                sync.apply(this, arguments);
            };
            atom.ajax = function(params) { ajaxParams = params; };
        },

        teardown: function() {
            hydrogen.sync = sync;
            atom.ajax = ajax;
        }

    });

    test("Model: configure", function() {
        var Model = hydrogen.Model.extend({
            configure: function(){
                this.one = 1;
                equal(this.collection.cid, collection.cid);
            }
        });
        var model = new Model({collection: collection});
        equal(model.one, 1);
        equal(model.collection.cid, collection.cid);
    });

    test("Model: url", function() {
        doc.urlRoot = null;
        equal(doc.url(), '/collection/1-the-tempest');
        doc.collection.url = '/collection/';
        equal(doc.url(), '/collection/1-the-tempest');
        doc.collection = null;
        raises(function() { doc.url(); });
        doc.collection = collection;
    });
});
