/*global atom, hydrogen, console */

(function () {
    "use strict";

    atom.declare('hydrogen.Store', {

        own: {

            S4: function () {
                return (((1 + Math.random()) * 0x10000) | 0).toString(16).substring(1);
            },

            guid: function () {
                var S4 = hydrogen.Store.S4;
                return (S4() + S4() + "-" + S4() + "-" + S4() + "-" + S4() + "-" + S4() + S4() + S4());
            }

        },

        prototype: {

            initialize: function (name) {
                var store = localStorage.getItem(name);

                this.name = name;
                this.data = (store && JSON.parse(store)) || {};
            },

            save: function () {
                localStorage.setItem(this.name, JSON.stringify(this.data));
            },

            create: function (model) {
                if (!model.id) { model.set('id', this.constructor.guid(), {
                    silent: true
                }); }
                this.data[model.id] = model;
                this.save();
                return model.toJSON();
            },

            update: function (model) {
                this.data[model.id] = model;
                this.save();
                return model.toJSON();
            },

            find: function (model) {
                return this.data[model.id];
            },

            findAll: function () {
                return Object.values(this.data);
            },

            destroy: function (model) {
                delete this.data[model.id];
                this.save();
                return model;
            }

        }
    });

    hydrogen.sync = function (method, model, options) {

        var resp,
            store = model.localStorage || model.collection.localStorage;

        switch (method) {
        case "read":
            resp = model.id ? store.find(model) : store.findAll();
            break;
        case "create":
            resp = store.create(model);
            break;
        case "update":
            resp = store.update(model);
            break;
        case "delete":
            resp = store.destroy(model);
            break;
        }

        if (resp) {
            options.onLoad(resp);
        }
    };
}());
