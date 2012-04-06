atom.declare('hydrogen.Router', {

    parent: hydrogen.Base,

    history: [],

    initialize: function parent (settings){

        parent.previous.apply(this, arguments);

        window.addEventListener('hashchange', this.route.bind(this));
    },

    get current () {
        return this.history.last;
    },

    set current (value) { },

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
        this.history.pop();
        this.navigate(this.current);
    }
    
});
