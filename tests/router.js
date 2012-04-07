/*global atom, hydrogen, console, module, test, equal, raises, ok, asyncTest, start */

atom.dom(function () {
    "use strict";

    var router = null,
        lastRoute = null,
        lastArgs = [],
        Router = hydrogen.Router.extend({

            count: 0,

            routes: {
                "noCallback":                 "noCallback",
                "counter":                    "counter",
                "search/:query":              "search",
                "search/:query/p:page":       "search",
                "contacts":                   "contacts",
                "contacts/new":               "newContact",
                "contacts/:id":               "loadContact",
                "splat/*args/end":            "splat",
                "*first/complex-:part/*rest": "complex",
                ":entity?*args":              "query",
                "*anything":                  "anything"
            },

            configure : function () {
                this.testing = this.settings.get('testing');
                this.route('implicit', 'implicit');
            },

            counter: function () {
                this.count++;
            },

            implicit: function () {
                this.count++;
            },

            search : function (query, page) {
                this.query = query;
                this.page = page;
            },

            contacts: function () {
                this.contact = 'index';
            },

            newContact: function () {
                this.contact = 'new';
            },

            loadContact: function () {
                this.contact = 'load';
            },

            splat : function (args) {
                this.args = args;
            },

            complex : function (first, part, rest) {
                this.first = first;
                this.part = part;
                this.rest = rest;
            },

            query : function (entity, args) {
                this.entity    = entity;
                this.queryArgs = args;
            },

            anything : function (whatever) {
                this.anything = whatever;
            }

        });

    function onRoute(name, router, route, args) {
        lastRoute = name;
        lastArgs = args;
    }

    module("hydrogen.Router", {

        setup: function () {
            router = new Router({testing: 101});
            router.events.add('all', onRoute);
            lastRoute = null;
            lastArgs = [];
        },

        teardown: function () {
            router.fire('stop');
            window.location.hash = '';
        }

    });

    test("Router: initialize", function () {
        equal(router.testing, 101);
    });

    asyncTest("Router: routes (simple)", 4, function () {
        window.location.hash = 'search/news';
        setTimeout(function () {
            equal(router.query, 'news');
            equal(router.page, undefined);
            equal(lastRoute, 'search');
            equal(lastArgs[0], 'news');
            start();
        }, 10);
    });

    asyncTest("Router: routes (two part)", 2, function () {
        window.location.hash = 'search/nyc/p10';
        setTimeout(function () {
            equal(router.query, 'nyc');
            equal(router.page, '10');
            start();
        }, 10);
    });

    test("Router: routes via navigate", 2, function () {
        router.navigate('search/manhattan/p20', {trigger: true});
        equal(router.query, 'manhattan');
        equal(router.page, '20');
    });

    test("Router: doesn't fire routes to the same place twice", function () {
        equal(router.count, 0);
        router.navigate('counter', {trigger: true});
        equal(router.count, 1);
        router.navigate('/counter', {trigger: true});
        router.navigate('/counter', {trigger: true});
        equal(router.count, 1);
        router.navigate('search/counter', {trigger: true});
        router.navigate('counter', {trigger: true});
        equal(router.count, 2);
    });

});
