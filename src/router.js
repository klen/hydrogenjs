/*global atom, hydrogen, console */

(function () {
    "use strict";

    var namedParam    = /:\w+/g,
        splatParam    = /\*\w+/g,
        escapeRegExp  = /[-[\]{}()+?.,\\^$|#\s]/g,
        isRegExp = function (obj) {
            return Object.prototype.toString.call(obj) == '[object RegExp]';
        };

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

            history: [],

            initialize: function parent(settings) {

                parent.previous.apply(this, arguments);

                this.bindMethods('_parse');

                this._bindRoutes();

                this.configure();

                var router = this;
                this.events.add('start', function () {
                    window.addEventListener('hashchange', router._parse);
                });
                this.events.add('stop', function () {
                    window.removeEventListener('hashchange', router._parse);
                });
                this.fire('start');

            },

            route: function (route, name, callback) {
                if (!isRegExp(route)) { route = this._routeToRegExp(route); }
                if (!callback) { callback = this[name]; }
                this.routes.unshift({ route: route, callback: function (fragment) {
                    var args = this._extractParameters(route, fragment);
                    if (callback) { callback.apply(this, args); }
                    this.fire(name, [this, route, args]);
                }.bind(this) });
            },

            navigate: function (fragment, settings) {
                this._loadUrl(fragment, settings);
            },

            /** @private */
            _parse: function () {
                var fragment = atom.uri().anchor;
                this._loadUrl(fragment);
            },

            /** @private */
            _loadUrl: function (fragment, settings) {
                var matched, history = this.history;

                this.routes.forEach(function (params) {
                    if (!matched && params.route.test(fragment)) {
                        history.push(fragment);
                        matched = params;
                    }
                });
                matched.callback(fragment);
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
                if (!this.routes) { return; }
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
