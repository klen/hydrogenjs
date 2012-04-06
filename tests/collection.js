atom.dom(function(){
    
    var lastRequest = null;
    var sync = hydrogen.sync;

    var a, b, c, d, e, col, otherCol;

    module("hydrogen.Collection", {

        setup: function() {
            a         = new hydrogen.Model({id: 3, label: 'a'});
            b         = new hydrogen.Model({id: 2, label: 'b'});
            c         = new hydrogen.Model({id: 1, label: 'c'});
            d         = new hydrogen.Model({id: 0, label: 'd'});
            e         = null;
            col       = new hydrogen.Collection({models: [a,b,c,d]});
            otherCol  = new hydrogen.Collection();

            hydrogen.sync = function(method, model, options) {
                lastRequest = {
                    method: method,
                    model: model,
                    options: options
                };
            };
        },

        teardown: function() {
            hydrogen.sync = sync;
        }

    });

    test("Collection: new and sort", function() {
        equal(col.first, a, "a should be first");
        equal(col.last, d, "d should be last");
        col.comparator = function(a, b) {
            return a.id > b.id ? -1 : 1;
        };
        col.sort();
        equal(col.first, a, "a should be first");
        equal(col.last, d, "d should be last");
        col.comparator = function(model) { return model.id; };
        col.sort();
        equal(col.first, d, "d should be first");
        equal(col.last, a, "a should be last");
        equal(col.length, 4);
    });

    test("Collection: get, getByCid", function() {
        equal(col.get(0), d);
        equal(col.get(2), b);
        equal(col.getByCid(col.last.cid), col.last);
    });

    test("Collection: get with non-default ids", function() {
        var col = new hydrogen.Collection();
        var MongoModel = hydrogen.Model.extend({
            idAttribute: '_id'
        });
        var model = new MongoModel({_id: 100});
        equal(model.id, 100);
        col.add(model);
        equal(col.get(100), model);
        model.set({_id: 101});
        equal(col.get(101), model);
    });

    test("Collection: update index when id changes", function() {
        var col = new hydrogen.Collection();
        col.add([
            {id : 0, name : 'one'},
            {id : 1, name : 'two'}
        ]);
        var one = col.get(0);
        equal(one.get('name'), 'one');
        one.set({id : 101});
        equal(col.get(0), null);
        equal(col.get(101).get('name'), 'one');
    });

    test("Collection: at", function() {
        equal(col.at(2), c);
    });

    test("Collection: pluck", function() {
        equal(col.pluck('label').join(' '), 'a b c d');
    });

    test("Collection: add", function() {
        var added, opts, secondAdded;
        added = opts = secondAdded = null;
        e = new hydrogen.Model({id: 10, label : 'e'});
        otherCol.add(e);
        otherCol.events.add('add', function() {
            secondAdded = true;
        });
        col.events.add('add', function(model, collection, options){
            added = model.get('label');
            console.log(options);
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

        var f = new hydrogen.Model({id: 20, label : 'f'});
        var g = new hydrogen.Model({id: 21, label : 'g'});
        var h = new hydrogen.Model({id: 22, label : 'h'});
        var atCol = new hydrogen.Collection({models:[f, g, h]});
        equal(atCol.length, 3);
        atCol.add(e, {at: 1});
        equal(atCol.length, 4);
        equal(atCol.at(1), e);
        equal(atCol.last, h);
    });

    test("Collection: add multiple models", function() {
        var col = new hydrogen.Collection({models:[{at: 0}, {at: 1}, {at: 9}]});
        col.add([{at: 2}, {at: 3}, {at: 4}, {at: 5}, {at: 6}, {at: 7}, {at: 8}], {at: 2});
        for (var i = 0; i <= 5; i++) {
            equal(col.at(i).get('at'), i);
        }
    });

    test("Colllection: non-persisted model destroy removes from all collections", function() {
        var e = new hydrogen.Model({title: 'Othello'});
        e.sync = function(method, model, options) { throw "should not be called"; };
        var colE = new hydrogen.Collection({ models: [e] });
        var colF = new hydrogen.Collection({ models: [e] });
        e.destroy();
        ok(colE.length == 0);
        ok(colF.length == 0);
        equal(undefined, e.collection);
    });

    test("Collection: fetch", function() {
        col.fetch();
        equal(lastRequest.method, 'read');
        equal(lastRequest.model, col);
        equal(lastRequest.options.parse, true);

        col.fetch({parse: false});
        equal(lastRequest.options.parse, false);
    });

    test("Collection: create", function() {
        var model = col.create({label: 'f'}, {wait: true});
        equal(lastRequest.method, 'create');
        equal(lastRequest.model, model);
        equal(model.get('label'), 'f');
        equal(model.collection, col);
    });

    test("Collection: can't add different model with same id to collection twice", function() {
        var col = new hydrogen.Collection;
        col.add({id: 101});
        col.add({id: 101});
        equal(col.length, 1);
    });

    test("Collection: initialize", function() {
        var Collection = hydrogen.Collection.extend({
                initialize: function() {
                    this.one = 1;
                }
            });
        var coll = new Collection;
        equal(coll.one, 1);
    });

    test("Collection: toJSON", function() {
        equal(JSON.stringify(col), '[{"id":3,"label":"a"},{"id":2,"label":"b"},{"id":1,"label":"c"},{"id":0,"label":"d"}]');
    });

});
