atom.declare('atom.View', {

    initialize: function(settings){

        this.events = atom.Events(this);

        this.settings = atom.Settings(settings)
                            .addEvents(this.events);

        var el = this.settings.get('el'),
            extend = this.settings.get('extend');

        this.el = el && atom.dom(el);
        this._bindEvents();

        if (typeof extend === 'object'){
            atom.core.extend(this, extend);
        }

    },

    create: function(){
        this.el = atom.dom.create.apply(this, arguments);
        this._bindEvents();
        return this;
    },

    render: function(){
        return this;
    },

    destroy: function(){
        if (this.el){ this.el.destroy(); }
        return this;
    },

    _bindEvents: function(){

        if (!this.el){ return false; }

        var view = this,
            el = this.el,
            events = this.events.events;

        Object.map(events, function(callbacks, name, obj){
            el.bind(name, function(){
                view.events.fire(name, arguments);
            });
        });
    },

    _unbindEvents: function(){
        // TODO
    }
});
