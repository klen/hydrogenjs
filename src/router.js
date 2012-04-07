/*global atom, hydrogen, console */

(function () {
    "use strict";

    var namedParam    = /:\w+/g,
        routeStripper = /^[#\/]/,
        splatParam    = /\*\w+/g,
        escapeRegExp  = /[-[\]{}()+?.,\\^$|#\s]/g,
        isRegExp = function (obj) {
            return Object.prototype.toString.call(obj) == '[object RegExp]';
        };

    atom.declare('hydrogen._History', {
        
        history: [],

        routes: [],

        initialize: function () {
            this.bindMethods('_parse');
            this.events = new atom.Events(this);
        },

        start: function (fragment) {
            this.started = true;
            window.addEventListener('hashchange', this._parse);
        },

        stop: function (fragment) {
            this.started = false;
            window.removeEventListener('hashchange', this._parse);
        },

        push: function (fragment) {
            this.history.push(fragment);
        },

        pop: function () {
            this.history.pop();
        },

        navigate: function (fragment, settings) {
            if (!this.started) { return false; }
            var frag = (fragment || '').replace(routeStripper, '');
            if (this.history[this.history.length - 1] == frag) { return; }
            this.push(frag);
            if (settings && settings.replace) {
                window.location.hash = fragment;
            }
            if (settings && settings.trigger) {
                this.loadUrl(fragment);
            }
        },

        loadUrl: function (fragment, settings) {
            var matched;
            this.routes.forEach(function (params) {
                if (!matched && params.route.test(fragment)) {
                    matched = params;
                }
            });
            if (matched) { matched.callback(fragment); }
        },

        _parse: function () {
            var fragment = atom.uri().anchor;
            this.navigate(fragment, {trigger: true});
        }

    });

    hydrogen.history = new hydrogen._History();

    atom.declare('hydrogen.Router', {

        parent: hydrogen.Base,

        own: {
            extend: function (proto) {
                return atom.declare({
                    parent: hydrogen.Router,
                    proto: proto
                });
            }
        },

        proto: {

            properties: ['routes'],

            routes: {},

            initialize: function parent(settings) {
                parent.previous.apply(this, arguments);
                this._bindRoutes();
                this.configure();
            },

            route: function (route, name, callback) {
                if (!isRegExp(route)) { route = this._routeToRegExp(route); }
                if (!callback) { callback = this[name]; }
                hydrogen.history.routes.unshift({ route: route, callback: function (fragment) {
                    var args = this._extractParameters(route, fragment);
                    if (callback) { callback.apply(this, args); }
                    this.fire(name, [this, route, args]);
                }.bind(this) });
            },

            navigate: function (fragment, settings) {
                hydrogen.history.navigate(fragment, settings);
            },

            /** @private */
            _extractParameters: function (route, fragment) {
                return route.exec(fragment).slice(1);
            },

            /** @private */
            _routeToRegExp: function (route) {
                route = route.replace(escapeRegExp, '\\$&')
                        .replace(namedParam, '([^\/]+)')
                        .replace(splatParam, '(.*?)');
                return new RegExp('^' + route + '$');
            },

            /** @private */
            _bindRoutes: function () {
                var route, i, l, routes = [];
                for (route in this.routes) {
                    routes.unshift([route, this.routes[route]]);
                }
                this.routes = [];
                for (i = 0, l = routes.length; i < l; i++) {
                    this.route(routes[i][0], routes[i][1], this[routes[i][1]]);
                }
            }
        }

    });

}());
