// Todo model
atom.declare('Todo.Model', {

    parent: hydrogen.Model,

    proto: {
        defaults: {
            title: "empty todo...",
            done: false
        },
    
        toggle: function() {
            this.save({done: !this.get("done")});
        },
    
        clear: function() {
            this.destroy();
        }
    }

});

atom.declare('Todo.List', {

    // Reference to this collection's model.
    parent: hydrogen.Collection,

    proto: {

        model: Todo.Model,
    
        // Save all of the todo items under the `"todos"` namespace.
        localStorage: new hydrogen.Store("todos-hydrogen"),
            
        // Filter down the list of all todo items that are finished.
        done: function() {
            return this.models.filter(function(todo){ return todo.get('done'); });
        },
        
        // Filter down the list to only todo items that are still not finished.
        remaining: function() {
            return this.models.filter(function(todo){ return !todo.get('done'); });
        }
    }

});