atom.declare('hydrogen.Store', {

    initialize: function(name){
        var store = localStorage.getItem(name);

        this.name = name;
        this.data = (store && JSON.parse(store)) || {};
    },

    save: function() {
        localStorage.setItem(this.name, JSON.stringify(this.data));
    },

    create: function(model) {
        if (!model.id) model.id = this.constructor.guid();
        this.data[model.id] = model;
        this.save();
        return model;
    },

    update: function(model) {
        this.data[model.id] = model;
        this.save();
        return model;
    },

    find: function(model) {
        return this.data[model.id];
    },

    findAll: function() {
        return Object.values(this.data);
    },

    destroy: function(model) {
        delete this.data[model.id];
        this.save();
        return model;
    },

    own: {

        S4: function(){
            return (((1+Math.random())*0x10000)|0).toString(16).substring(1);
        },

        guid: function(){
            var S4 = hydrogen.Store.S4;
            return (S4()+S4()+"-"+S4()+"-"+S4()+"-"+S4()+"-"+S4()+S4()+S4());
        }

    }

});


hydrogen.sync = function(method, model, options) {

    var resp;
    var store = model.localStorage || model.collection.localStorage;

    switch (method) {
        case "read":    resp = model.id ? store.find(model) : store.findAll(); break;
        case "create":  resp = store.create(model);                            break;
        case "update":  resp = store.update(model);                            break;
        case "delete":  resp = store.destroy(model);                           break;
    }

    if (resp) {
        options.onLoad(resp);
    } 
};
