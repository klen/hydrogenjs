atom.declare('hydrogen.Router', {

    history: [],

    initialize: function(settings){

        window.addEventListener('hashchange', this.route.bind(this));

        this.events = atom.Events(this);

        this.settings = atom.Settings(this.settings)
                            .set(settings)
                            .addEvents(this.events);
    },

    get current () {
        return this.history.last;
    },

    route: function(){
        var uri = atom.uri();

        this.history.push(uri.anchor);
        this.events.fire(uri.anchor);
    },

    navigate: function(name){
        if (this.current == name){
            return false;
        }
        var base = window.location.href.split('#')[0];
        window.location.href = base + '#' + name;
    },

    back: function(){
        this.history.pop()
        this.navigate(this.current);
    }
    
});
