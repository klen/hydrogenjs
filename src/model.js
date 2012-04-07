atom.declare('hydrogen.Model', {

    parent: hydrogen.Base,

    own: {
        extend: function(proto) {
            return atom.declare({
                parent: hydrogen.Model,
                proto: proto
            });
        }
    },

    proto: {

        properties: 'collection'.split(' '),

        idAttribute: 'id',

        initialize: function parent (attrs, settings){
            parent.previous.call(this, settings);

            this.attrs = new atom.Settings()
                            .set(this.defaults)
                            .set(attrs);
            this.configure();
        },

        get id(){ return this.get(this.idAttribute); },

        set id(value){ this.set(this.idAttribute, value); },

        get: function(name){
            return this.attrs.get(name);
        },

        set: function(name, value){
            this._id = this.id;
            this.attrs.set(name, value);
            this.fire('change', [this, this.collection, arguments]);
        },

        unset: function(name){
            this.set(name, null);
        },

        has: function(name){
            return this.get(name) !== undefined;
        },

        sync: function(){
            return hydrogen.sync.apply(this, arguments);
        },

        toJSON: function() {
            return atom.clone(this.attrs.values);
        },

        parse: function(resp, xhr) {
            return resp;
        },

        isNew: function() {
            return this.id === undefined || this.id === null;
        },

        url: function() {
            var base = this.urlRoot || this.collection.url;
            if (this.isNew()) { return base; }
            return base + (base.charAt(base.length - 1) == '/' ? '' : '/') + encodeURIComponent(this.id);
        },

        clone: function(){
            return new this.constructor(this.attrs.values, this.settings.values);
        },

        save: function(key, value, settings) {
            var attrs, current, model=this;

            if (key === Object(key) || key === null) {
                attrs = key;
                settings = value;
            } else {
                attrs = {};
                attrs[key] = value;
            }
            settings = atom.append({}, settings);

            var onLoad = settings.onLoad;
            settings.onLoad = function(resp) {
                var serverAttrs = model.parse(resp);
                model.set(model.parse(resp));
                if (onLoad) {
                    onLoad(model, resp);
                } else {
                    model.fire('sync', [resp, settings]);
                }
            };

            var method = this.isNew() ? 'create' : 'update';
            return this.sync(method, this, settings);
        },

        destroy: function(settings) {
            var model = this;

            settings = atom.append({}, settings);

            var onLoad = settings.onLoad;

            var triggerDestroy = function() {
                model.fire('destroy', [model, model.collection, settings]);
            };

            if (this.isNew()) {
                triggerDestroy();
                return false;
            }

            settings.onLoad = function(resp) {
                if (onLoad) {
                    onLoad(model, resp);
                } else {
                    model.fire('sync', [resp, settings]);
                }
            };

            var xhr = this.sync('delete', this, settings);
            triggerDestroy();
            return xhr;
        }
    }
});
