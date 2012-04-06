atom.declare('hydrogen.Model', {

    parent: hydrogen.Base,

    initialize: function parent (settings){
        parent.previous.apply(this, arguments);
        this.configure();
    },

    get: function(name){
        return this.settings.get(name);
    },

    set: function(name, value){
        this.settings.set(name, value);
    },

    has: function(name){
        return this.get(name) !== null;
    },

    sync: function(){
        return hydrogen.sync.apply(this, arguments);
    },

    toJSON: function(options) {
        return atom.clone(this.settings.values);
    },

    parse: function(resp, xhr) {
        return resp;
    },

    isNew: function() {
        return this.get('id') === null;
    },

    save: function(key, value, options) {
        var attrs, current, model=this, onLoad=options.onLoad;

        if ('key' in key || !key) {
            attrs = key;
            options = value;
        } else {
            attrs = {};
            attrs[key] = value;
        }
        options = options ? atom.clone(options) : {};

        options.onLoad = function(resp) {
            var serverAttrs = model.parse(resp);
            model.set(model.parse(resp));
            if (onLoad) {
                onLoad(model, resp);
            } else {
                model.fire('sync', [resp, options]);
            }
        };

        var method = this.isNew() ? 'create' : 'update';
        return this.sync(method, this, options);
    },

    destroy: function(options) {
        var model = this, onLoad = options.onLoad;

        options = atom.clone(options || {});

        var triggerDestroy = function() {
            model.fire('destroy', [options]);
        };

        if (this.isNew()) {
            triggerDestroy();
            return false;
        }

        options.onLoad = function(resp) {
            if (onLoad) {
                onLoad(model, resp);
            } else {
                model.fire('sync', [resp, options]);
            }
        };

        var xhr = this.sync(method, this, options);
        triggerDestroy();
        return xhr;
    }

});
