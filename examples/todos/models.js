/*global atom, hydrogen, console, Todo */

(function () {
    "use strict";

    // Todo model
    atom.declare('Todo.Model', hydrogen.Model, {

        defaults: {
            title: "empty todo...",
            done: false
        },

        toggle: function () {
            this.save({done: !this.get("done")});
        },

        clear: function () {
            console.log('clear');
            this.destroy();
        }

    });

    atom.declare('Todo.List', hydrogen.Collection, {

        model: Todo.Model,

        // Save all of the todo items under the `"todos"` namespace.
        localStorage: new hydrogen.Store("todos-hydrogen"),

        // Filter down the list of all todo items that are finished.
        done: function () {
            return this.models.filter(function (todo) { return todo.get('done'); });
        },

        // Filter down the list to only todo items that are still not finished.
        remaining: function () {
            return this.models.filter(function (todo) { return !todo.get('done'); });
        }

    });
}());
