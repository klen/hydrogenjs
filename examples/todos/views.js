atom.declare('Todo.View', {

    parent: hydrogen.View,

    tagName:  "li",

    template: '#item-template',

    actions: {
        "click .toggle"   : "toggleDone",
        "dblclick .view"  : "edit",
        "click a.destroy" : "clear",
        "keypress .edit"  : "updateOnEnter",
        "blur .edit"      : "close"
    },

    configure: function(){
        this.model.events.add('change', this.render.bind(this));
        this.model.events.add('destroy', this.destroy.bind(this));
    },

    render: function() {
        var html = this.template.render(this.model.toJSON());
        this.el.html(html);
        if (this.model.get('done')){
            this.el.toggleClass('done');
        }
        this.input = this.el.find('.edit').first;
        return this;
    },
        
    toggleDone: function() {
        this.model.toggle();
    },

    edit: function() {
        this.el.addClass("editing");
        this.input.focus();
    },

    close: function() {
      var value = this.input.value;
      if (!value) { this.clear(); }
      this.model.save({title: value});
      this.el.removeClass("editing");
    },

    updateOnEnter: function(e) {
        if (e.keyCode == 13) { this.close(); }
    },

    clear: function() {
        this.model.clear();
    }

});

atom.declare('Todo.AppView', {

    parent: hydrogen.View,

    el: '#todoapp',

    template: '#stats-template',

    actions: {
        "keypress .new-todo":  "createOnEnter",
        "click .clear-completed": "clearCompleted",
        "click .toggle-all": "toggleAllComplete"
    },

    configure: function(){
        this.input = this.find(".new-todo").get(0);
        this.main = this.find('.main');
        this.allCheckbox = this.find(".toggle-all");
        this.footer = this.find('footer');

        // Init Todo Collection
        this.todos = new Todo.List();
        this.todos.events.add('add', this.addOne.bind(this));
        this.todos.events.add('reset', this.addAll.bind(this));
        this.todos.events.add('all', this.render.bind(this));
        this.todos.fetch();
    },

    render: function() {
        var done = this.todos.done().length;
        var remaining = this.todos.remaining().length;

        if (this.todos.length) {
            this.main.css({ display: 'block' });
            this.footer.css({ display: 'block' });
            this.footer.html(this.template.render({done: done, remaining: remaining}));
        } else {
            this.main.css({ display: 'hide' });
            this.footer.css({ display: 'hide' });
        }

        this.allCheckbox.checked = !remaining;
    },

    createOnEnter: function(e) {
        if (e.keyCode != 13) { return; }
        if (!this.input.value) { return; }

        this.todos.create({title: this.input.value});
        this.input.value = '';
    },

    addOne: function(todo) {
        var view = new Todo.View({model: todo});
        view.render();
        view.el.appendTo('.todo-list');
    },

    addAll: function() {
        this.todos.models.forEach(this.addOne.bind(this));
    },

    clearCompleted: function() {
        this.todos.done().forEach(function(todo){
            todo.clear();
        });
      return false;
    },

    toggleAllComplete: function () {
        var done = this.allCheckbox.checked;
        this.todos.models.forEach(function (todo) { todo.save({'done': done}); });
    }
    
});

