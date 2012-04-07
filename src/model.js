/*global atom, hydrogen, console */

(function () {
    "use strict";

    atom.declare('hydrogen.Model', {

        parent: hydrogen.Base,

        own: {
            extend: function (proto) {
                return atom.declare({
                    parent: hydrogen.Model,
                    proto: proto
                });
            }
        },

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
