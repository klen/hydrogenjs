// ==========
// From: '/home/klen/Projects/hydrogen/hydrogen.js'
// Zeta import: '/home/klen/Projects/hydrogen/src/init.js'
/*global atom, hydrogen, console */

(function (atom) {
    "use strict";

    var methodMap = {
        'create': 'POST',
        'update': 'PUT',
        'delete': 'DELETE',
        'read':   'GET'
    }, getValue = function (object, prop) {
        if (!(object && object[prop])) { return null; }
        return atom.core.isFunction(object[prop]) ? object[prop]() : object[prop];
    },
        idCounter = 0,
        uniqueID = function (prefix) {
            idCounter += 1;
            return prefix ? prefix + idCounter : idCounter;
        };

    atom.declare('hydrogen', {
        own: {
            sync: function (type, model, settings) {
                var method = methodMap[type],
                    params = {method: method, dataType: 'json'};

                settings = settings || {};
                if (!settings.url) {
                    params.url = getValue(model, 'url');
                }
                if (!settings.data && model && (type === 'create' || type === 'update')) {
                    params.headers = {
                        'Content-type': 'application/json'
                    };
                    params.type = 'json';
                    params.data = JSON.stringify(model);
                }
                params = atom.core.extend(params, settings);
                return atom.ajax(params);
            },

            escape: function (string) {
                return (string.toString()).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#x27;').replace(/\//g, '&#x2F;');
            }
        }
    });


    atom.declare('hydrogen.Base', {

        own: {
            extend: function (proto) {
                return atom.declare({
                    parent: this,
                    proto: proto
                });
            }
        },

        proto: {

            properties: ['id'],

            initialize: function (settings) {
                this.events = atom.Events(this);
                this.settings = atom.Settings()
                    .set(settings)
                    .addEvents(this.events);
                this._configure();
            },

            configure: function () { },

            fire: function (event, args) {
                this.events.fire(event, args);
                this.events.fire('all', [event].concat(args));
            },

            bind: function (event, listener, context) {
                if (context !== undefined) {
                    this.events.add(event, listener.bind(context));
                } else {
                    this.events.add(event, listener);
                }
            },

            unbind: function (event, listener) {
                this.events.remove(event, listener);
            },

            sync: function () {
                return hydrogen.sync.apply(this, arguments);
            },

            /** @private */
            _configure: function () {
                var i, l = this.properties.length, attr, value;
                for (i = 0; i < l; i++) {
                    attr = this.properties[i];
                    value = this.settings.get(attr);
                    if (value) {
                        this[attr] = value;
                        this[attr] = getValue(this, attr);
                    }
                }
                this.cid = uniqueID(this.constructor.NAME);
            }
        }
    });

}(atom));

// ==========
// From: '/home/klen/Projects/hydrogen/hydrogen.js'
// Zeta import: '/home/klen/Projects/hydrogen/src/router.js'
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
            this.navigate(atom.uri().anchor, { trigger: true });
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
            settings = settings || {};
            if (this.history[this.history.length - 1] == frag) { return; }
            this.push(frag);
            if (settings.replace) {
                location.replace(location.toString().replace(/(javascript:|#).*$/, '') + '#' + frag);
            } else {
                location.hash = frag;
            }
            if (settings.trigger) {
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

// ==========
// From: '/home/klen/Projects/hydrogen/hydrogen.js'
// Zeta import: '/home/klen/Projects/hydrogen/src/template.js'
// JavaScript micro-templating, similar to John Resig's implementation.
//
/*global atom, hydrogen, console */

(function (atom) {
    "use strict";
    var evaluate = /<%([\s\S]+?)%>/g,
        interpolate = /<%=([\s\S]+?)%>/g,
        escape = /<%-([\s\S]+?)%>/g,
        noMatch = /.^/,
        unescape = function (code) { return code.replace(/\\\\/g, '\\').replace(/\\'/g, "'"); };

    atom.declare('hydrogen.Template', {

        tmpl: null,

        initialize: function (el, defaults) {
            var elem = typeof el === 'string' ? atom.dom(el) : el,
                str = elem.html();

            this.defaults = defaults || {};
            this.tmpl = this.constructor.compile(str);
        },

        render: function (data) {
            var tmpl = this.tmpl || this.compile(),
                context = atom.core.append(this.defaults, data || {});

            return tmpl(data);
        },

        own: {

            compile: function (str, data) {
                var tmpl = 'var __p=[],print=function(){__p.push.apply(__p,arguments);};' +
                    'with(obj||{}){__p.push(\'' +
                    str.replace(/\\/g, '\\\\')
                    .replace(/'/g, "\\'")
                    .replace(escape || noMatch, function (match, code) {
                        return "',hydrogen.escape(" + unescape(code) + "),'";
                    })
                    .replace(interpolate || noMatch, function (match, code) {
                        return "'," + unescape(code) + ",'";
                    })
                    .replace(evaluate || noMatch, function (match, code) {
                        return "');" + unescape(code).replace(/[\r\n\t]/g, ' ') + ";__p.push('";
                    })
                    .replace(/\r/g, '\\r')
                    .replace(/\n/g, '\\n')
                    .replace(/\t/g, '\\t') + "');}return __p.join('');",
                    func = new Function('obj', 'hydrogen', tmpl);
                if (data) { return func(data, hydrogen); }
                return function (data) { return func.call(this, data, hydrogen); };
            }
        }
    });

}(atom));

// ==========
// From: '/home/klen/Projects/hydrogen/hydrogen.js'
// Zeta import: '/home/klen/Projects/hydrogen/src/view.js'
/*global atom, hydrogen, console */

(function () {
    "use strict";

    var eventSplitter = /^(\S+)\s*(.*)$/;

    atom.declare('hydrogen.View', {

        parent: hydrogen.Base,

        // own: {
            // extend: function (proto) {
                // return atom.declare({
                    // parent: hydrogen.Collection,
                    // proto: proto
                // });
            // }
        // },

        proto: {

            properties: ['model', 'collection', 'el', 'id', 'attrs', 'className', 'tagName', 'template'],

            template: null,

            tagName: 'div',

            attributes: {},

            actions: {},

            initialize: function parent(settings) {

                parent.previous.apply(this, arguments);

                this.setElement(this.el || atom.dom.create(this.tagName, this.attributes));

                if (this.template !== null) {
                    this.template = new hydrogen.Template(this.template);
                }

                this.configure();
            },

            configure: function () {
                return this;
            },

            render: function () {
                return this;
            },

            destroy: function () {
                this.el.destroy();
                return this;
            },

            setElement: function (el) {
                this.el = atom.dom(el);
                this._bindEvents();
            },

            find: function (selector) {
                return this.el.find(selector);
            },

            /** @private */
            _bindEvents: function () {
                var method, key, match, name, selector,
                    actions = this.actions;
                for (key in actions) {
                    method = actions[key];
                    if (!atom.core.isFunction(method)) { method = this[actions[key]]; }
                    if (!method) { continue; }
                    match = key.match(eventSplitter);
                    name = match[1];
                    selector = match[2];
                    if (selector === '') {
                        this.el.bind(name, method.bind(this));
                    } else {
                        this.el.delegate(selector, name, method.bind(this));
                    }
                }
            }
        }
    });

}());

// ==========
// From: '/home/klen/Projects/hydrogen/hydrogen.js'
// Zeta import: '/home/klen/Projects/hydrogen/src/model.js'
/*global atom, hydrogen, console */

(function () {
    "use strict";

    atom.declare('hydrogen.Model', {

        parent: hydrogen.Base,

        // own: {
            // extend: function (proto) {
                // return atom.declare({
                    // parent: hydrogen.Model,
                    // proto: proto
                // });
            // }
        // },

        proto: {

            properties: ['collection'],

            idAttribute: 'id',

            initialize: function parent(attrs, settings) {
                parent.previous.call(this, settings);

                this.attrs = new atom.Settings()
                                .set(this.defaults)
                                .set(attrs);
                this.configure();
            },

            get id() { return this.get(this.idAttribute); },

            set id(value) { this.set(this.idAttribute, value); },

            get: function (name) {
                return this.attrs.get(name);
            },

            set: function (name, value, settings) {
                var options = settings || {};
                this._id = this.id;
                this.attrs.set(name, value);
                if (!options.silent) { this.fire('change', [this, this.collection, arguments]); }
            },

            unset: function (name, settings) {
                this.set(name, null, settings);
            },

            has: function (name) {
                return this.get(name) !== undefined;
            },

            toJSON: function () {
                return atom.clone(this.attrs.values);
            },

            parse: function (resp, xhr) {
                return resp;
            },

            isNew: function () {
                return this.id === undefined || this.id === null;
            },

            url: function () {
                var base = this.urlRoot || this.collection.url;
                if (this.isNew()) { return base; }
                return base + (base.charAt(base.length - 1) == '/' ? '' : '/') + encodeURIComponent(this.id);
            },

            clone: function () {
                return new this.constructor(this.attrs.values, this.settings.values);
            },

            save: function (key, value, settings) {
                var attrs, current, model = this, onLoad, method;

                if (typeof key === 'object' || key === null) {
                    attrs = key;
                    settings = value;
                } else {
                    attrs = {};
                    attrs[key] = value;
                }
                if (attrs) {
                    this.set(attrs);
                }
                settings = atom.clone(settings || {});
                onLoad = settings.onLoad;
                settings.onLoad = function (resp) {
                    var serverAttrs = model.parse(resp);
                    model.set(model.parse(resp));
                    if (onLoad) {
                        onLoad(model, resp);
                    } else {
                        model.fire('sync', [resp, settings]);
                    }
                };
                method = this.isNew() ? 'create' : 'update';
                return this.sync(method, this, settings);
            },

            destroy: function (settings) {
                var model = this, onLoad, triggerDestroy, xhr;

                settings = atom.clone(settings || {});

                onLoad = settings.onLoad;

                triggerDestroy = function () {
                    model.fire('destroy', [model, model.collection, settings]);
                };

                if (this.isNew()) {
                    triggerDestroy();
                    return false;
                }

                settings.onLoad = function (resp) {
                    if (onLoad) {
                        onLoad(model, resp);
                    } else {
                        model.fire('sync', [resp, settings]);
                    }
                };

                xhr = this.sync('delete', this, settings);
                triggerDestroy();
                return xhr;
            }
        }
    });
}());

// ==========
// From: '/home/klen/Projects/hydrogen/hydrogen.js'
// Zeta import: '/home/klen/Projects/hydrogen/src/collection.js'
/*global atom, hydrogen, console */

(function () {
    "use strict";

    atom.declare('hydrogen.Collection', {

        parent: hydrogen.Base,

        // own: {
            // extend: function (proto) {
                // return atom.declare({
                    // parent: hydrogen.Collection,
                    // proto: proto
                // });
            // }
        // },

        proto: {

            properties: ['id', 'model', 'comparator', 'url'],

            model: hydrogen.Model,

            initialize: function parent(models, settings) {

                this.bindMethods(['_onModelEvent', '_removeReference']);

                parent.previous.call(this, settings);

                this.models = [];
                this.reset(models || [], settings);
                this.configure();
            },

            toJSON: function () {
                return this.models.map(function (model) { return model.toJSON(); });
            },

            get length () {
                return this.models.length;
            },

            set length (value) {
                this.models.length = value;
            },

            get first() { return this.models[0]; },

            set first(value) { throw "Not allowed"; },

            get last() { return this.models[this.length - 1]; },

            set last(value) { throw "Not allowed"; },

            get: function (id) {
                if (id == null) { return undefined; }
                return this._byId[id.id != null ? id.id : id];
            },

            getByCid: function (cid) {
                return cid && this._byCid[cid.cid || cid];
            },

            at: function (index) {
                return this.models[index];
            },

            pluck: function (name) {
                return this.models.map(function (model) { return model.get(name); });
            },

            sort: function (settings) {
                settings = settings || {};
                if (!this.comparator) { throw new Error('Cannot sort a set without a comparator'); }
                var boundComparator = this.comparator.bind(this);
                this.models.sort(boundComparator);
                if (!settings.silent) { this.fire('reset', [this, settings]); }
                return this;
            },

            add: function (models, settings) {
                settings = atom.clone(settings || {});

                var mds = [], index,
                    _byId = this._byId, _byCid = this._byCid, col = this,
                    _onModelEvent = this._onModelEvent,
                    _prepareModel = this._prepareModel.bind(this);

                models = atom.isArrayLike(models) ? models.slice() : [models];
                models.forEach(function (model) {
                    model = _prepareModel(model);
                    model.bind('all', _onModelEvent);
                    if (!_byId[model.id] && !_byCid[model.cid]) {
                        _byCid[model.cid] = model;
                        if (model.id != null) { _byId[model.id] = model; }
                        mds.push(model);
                    }
                });
                index = settings.at != null ? settings.at : this.length;
                Array.prototype.splice.apply(this.models, [index, 0].concat(mds));
                mds.forEach(function (model) {
                    settings.index = index++;
                    if (!settings.silent) { model.fire('add', [model, col, settings]); }
                });
                return this;
            },

            create: function (model, settings) {
                settings = atom.clone(settings || {});

                var coll = this, onLoad = settings.onLoad;
                model = this._prepareModel(model, settings);
                if (!model) { return false; }
                this.add(model, settings);
                settings.onLoad = function (nextModel, resp, xhr) {
                    if (onLoad) {
                        onLoad(nextModel, resp);
                    } else {
                        nextModel.fire('sync', [resp, settings]);
                    }
                };
                model.save(null, settings);
                return model;
            },

            remove: function (models, settings) {
                var i, l, index, model;
                settings = atom.clone(settings || {});
                models = atom.isArrayLike(models) ? models.slice() : [models];
                for (i = 0, l = models.length; i < l; i++) {
                    model = this.getByCid(models[i]) || this.get(models[i]);
                    if (!model) { continue; }
                    delete this._byId[model.id];
                    delete this._byCid[model.cid];
                    index = this.models.indexOf(model);
                    this.models.splice(index, 1);
                    if (!settings.silent) {
                        settings.index = index;

                        // Not fire 'all' event here
                        model.events.fire('remove', [model, this, settings]);
                        this.fire('remove', [model, this, settings]);
                    }
                    this._removeReference(model);
                }
                return this;
            },

            fetch: function (settings) {
                settings = atom.clone(settings || {});
                if (settings.parse === undefined) { settings.parse = true; }

                var collection = this,
                    onLoad = settings.onLoad;

                settings.onLoad = function (resp) {
                    collection[settings.add ? 'add' : 'reset'](collection.parse(resp), settings);
                    if (onLoad) { onLoad(collection, resp); }
                };
                return this.sync('read', this, settings);
            },

            parse: function (resp) {
                return resp;
            },

            reset: function (models, settings) {
                settings = settings || {};
                this.models.forEach(this._removeReference);
                this._reset();
                this.add(models, atom.extend({silent: true}, settings));
                if (!settings.silent) { this.fire('reset', [models, settings]); }
            },

            /** @private */
            _reset: function () {
                this.length = 0;
                this.models = [];
                this._byId  = {};
                this._byCid = {};
            },

            /** @private */
            _prepareModel: function (model, settings) {
                settings = atom.clone(settings || {});
                if (!(model instanceof hydrogen.Model)) {
                    var args = model;
                    settings.collection = this;
                    model = new this.model(args, settings);
                } else if (!model.collection) {
                    model.collection = this;
                }
                return model;
            },

            /** @private */
            _onModelEvent: function (event, model, collection, settings) {
                if ((event == 'add' || event == 'remove') && collection != this) { return; }
                if (event == 'destroy') {
                    this.remove(model, settings);
                }
                if (event == 'change') {
                    delete this._byId[model._id];
                    this._byId[model.id] = model;
                }
                this.fire(event, [model, collection, settings]);
            },

            /** @private */
            _removeReference: function (model) {
                var _onModelEvent = this._onModelEvent;
                if (this == model.collection) {
                    delete model.collection;
                }
                model.unbind('all', _onModelEvent);
            }
        }
    });
}());


