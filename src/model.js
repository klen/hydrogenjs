atom.declare('atom.Model', {

    defaults: {},
    
    initialize: function(settings){

        this.events = atom.Events(this);

        this.settings = atom.Settings(this.defaults)
                            .set(settings)
                            .addEvents(this.events);

    },

    get: function(name){
        return this.settings.get(name);
    },

    set: function(name, value){
        this.settings.values[name] = value;
    },

    has: function(name){
        return this.get(name) !== null;
    },

    get json (){
        return atom.clone(this.settings.values);
    }

});
