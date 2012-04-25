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
            extend: function (name, proto) {
                if (typeof name != 'string') {
                    proto = name;
                    name = null;
                }
                return atom.declare({
                    parent: this,
                    name: name,
                    proto: proto || {}
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
