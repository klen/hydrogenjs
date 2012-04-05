atom.declare('hydrogen.View', {

    bindEventsList: 'click contextmenu mouseup mousedown mouseover mouseout'.split(' '),

    initialize: function(settings){
        this.bindMethods( 'eventHandler' );

        this.events = atom.Events(this);
        this.settings = atom.Settings(settings).addEvents(this.events);

        var el = this.settings.get('el'),
            extend = this.settings.get('extend');

        this.el = el && atom.dom(el);
        this.bindEvents();

        if (typeof extend === 'object'){
            atom.core.append(this, extend);
        }
    },

    create: function(){
        this.el && this.unbindEvents();
        this.el = atom.dom.create.apply(atom.dom, arguments);
        this.bindEvents();
        return this;
    },

    render: function(){
        return this;
    },

    destroy: function(){
        this.el && this.unbindEvents() && this.el.destroy();
        return this;
    },

    /** @private */
    eventHandler: function (e) {
        var view = this;
        var name = e.type;
        var targetElem = e.target;

        this.events.fire(name, [ e, this ]);
    },

    /** @private */
    bindEvents: function(){
        return this.changeEventsStatus('bind');
    },

    /** @private */
    unbindEvents: function(){
        return this.changeEventsStatus('unbind');
    },

    /** @private */
    changeEventsStatus: function (action) {
        for (var i = this.bindEventsList.length; i--;) {
            this.el[action](this.bindEventsList[i], this.eventHandler);
        }
        return this;
    }
});
