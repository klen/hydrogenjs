/*global atom, hydrogen, console, Todo */

(function () {
    "use strict";

    atom.declare('Todo.View', hydrogen.View, {

        tagName:  "li",

        template: '#item-template',

        actions: {
            "click .toggle"   : "toggleDone",
            "dblclick .view"  : "edit",
            "click a.destroy" : "clear",
            "keypress .edit"  : "updateOnEnter",
            "blur .edit"      : "close"
        },

        configure: function () {
            this.model.bind('change', this.render, this);
            this.model.bind('destroy', this.destroy, this);
        },

        render: function () {
            var html = this.template.render(this.model.toJSON());
            this.el.html(html);
            if (this.model.get('done')) {
                this.el.toggleClass('done');
            }
            this.input = this.el.find('.edit').first;
            return this;
        },

        toggleDone: function () {
            this.model.toggle();
        },

        edit: function () {
            this.el.addClass("editing");
            this.input.focus();
        },

        close: function () {
            var value = this.input.value;
            if (!value) { this.clear(); }
            this.model.save({title: value});
            this.el.removeClass("editing");
        },

        updateOnEnter: function (e) {
            if (e.keyCode == 13) { this.close(); }
        },

        clear: function () {
            this.model.clear();
        }

    });

    atom.declare('Todo.AppView', hydrogen.View, {

        el: '#todoapp',

        template: '#stats-template',

        actions: {
            "keypress .new-todo":  "createOnEnter",
            "click .clear-completed": "clearCompleted",
            "click .toggle-all": "toggleAllComplete"
        },

        configure: function () {
            this.input = this.find(".new-todo").get(0);
            this.main = this.find('.main');
            this.allCheckbox = this.find(".toggle-all").first;
            this.footer = this.find('footer');

            // Init Todo Collection
            this.todos = new Todo.List();
            this.todos.bind('add', this.addOne, this);
            this.todos.bind('reset', this.addAll, this);
            this.todos.bind('all', this.render, this);
            this.todos.fetch();
        },

        render: function () {
            var done = this.todos.done().length,
                remaining = this.todos.remaining().length;

            if (this.todos.length) {
                this.main.css({ display: 'block' });
                this.footer.css({ display: 'block' });
                this.footer.html(this.template.render({done: done, remaining: remaining}));
            } else {
                this.main.css({ display: 'none' });
                this.footer.css({ display: 'none' });
            }

            this.allCheckbox.checked = !remaining;
            console.log('Render done');
        },

        createOnEnter: function (e) {
            if (e.keyCode != 13) { return; }
            if (!this.input.value) { return; }

            this.todos.create({title: this.input.value});
            this.input.value = '';
        },

        addOne: function (todo) {
            var view = new Todo.View({model: todo});
            view.render();
            view.el.appendTo('.todo-list');
            console.log('Add done');
        },

        addAll: function () {
            this.todos.models.forEach(this.addOne.bind(this));
        },

        clearCompleted: function () {
            console.log('clear');
            this.todos.done().forEach(function (todo) {
                todo.clear();
            });
            return false;
        },

        toggleAllComplete: function () {
            var done = this.allCheckbox.checked;
            this.todos.models.forEach(function (todo) { todo.save({'done': done}); });
        }

    });
}());
