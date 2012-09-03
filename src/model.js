/*global atom, hydrogen, console */

(function () {
    "use strict";

    atom.declare('hydrogen.Model', {

        parent: hydrogen.Base,

        prototype: {

            properties: ['collection'],

            idAttribute: 'id',

            initialize: function parent(attrs, settings) {
                parent.previous.call(this, settings);

                var parse = this.settings.get('parse');
                if (parse) { attrs = this.parse(attrs); }

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
                var a, options = settings || {},
                    attrs = atom.core.objectize(name, value),
                    changes = options.changes = {};

                if (!this._validate(attrs, options)) {
                    return false;
                }

                this._id = this.id;

                Object.map(attrs, function (v, k) {
                    if (v != this.get(k)) {
                        changes[k] = v;
                    }
                }.bind(this));

                this.attrs.set(attrs);

                if (!options.silent) {
                    for (a in changes) { this.events.fire('change:' + a, [this, this.get(a), options]); }
                    this.fire('change', [this, this.collection, attrs]);
                }
                return this;
            },

            unset: function (name, settings) {
                this.set(name, null, settings);
            },

            has: function (name) {
                return this.get(name) !== undefined && this.get(name) !== null;
            },

            escape: function (attr) {
                var val = this.get(attr);
                return hydrogen.escape(val == null ? '' : val.toString());
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

            fetch: function (settings) {
                settings = settings ? atom.clone(settings) : {};
                var model = this,
                    onLoad = settings.onLoad;

                settings.onLoad = function (resp) {
                    if (!model.set(model.parse(resp), settings)) { return false; }
                    if (onLoad) { onLoad(model, resp); }
                };
                return this.sync('read', this, settings);
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
            },

            _validate: function (attrs, settings) {
                if (settings.silent || !this.validate) { return true; }
                attrs = atom.core.append(atom.clone(this.attrs.values), attrs);
                var error = this.validate(attrs, settings);
                if (!error) { return true; }
                if (settings && settings.error) {
                    settings.error(this, error, settings);
                } else {
                    this.fire('error', [this, error, settings]);
                }
                return false;
            }
        }
    });
}());
