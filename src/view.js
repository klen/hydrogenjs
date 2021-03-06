/*global atom, hydrogen, console */

(function () {
    "use strict";

    var eventSplitter = /^(\S+)\s*(.*)$/;

    atom.declare('hydrogen.View', hydrogen.Base, {

        properties: ['model', 'collection', 'el', 'id', 'attrs', 'className', 'tagName', 'template'],

        template: null,

        tagName: 'div',

        attributes: {},

        actions: {},

        initialize: function parent(settings) {

            parent.previous.apply(this, arguments);

            this.bindMethods('render');

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
            if (this.template && this.el) {
                var html = this.template.render(this.settings.values);
                this.el.html(html);
            }
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
    });

}());
