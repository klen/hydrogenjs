atom.declare('hydrogen.Collection', {

    parent: hydrogen.Base,

    properties: 'id model'.split(' '),

    model: hydrogen.Model,

    initialize: function parent (models, settings){

        parent.previous.call(this, [settings]);

        this.reset(models, settings);
        this.configure();
    },

    toJSON: function() {
        return this.models.map(function(model){ return model.toJSON(); });
    },

    get length () {
        return this.models.length;
    },

    set length (value) {},

    add: function(models, options){
        options = options || {};

        var cids = {}, mds = [], index, prepareModel = this._prepareModel.bind(this);

        models = atom.isArrayLike(models) ? models.slice() : [models];
        models.forEach(function(model){
            model = prepareModel(model);
            if (!cids[model.cid]){ mds.push(model); }
        });

        index = options.at != null ? options.at : this.length;
        Array.prototype.splice.apply(this.models, [index, 0].concat(mds));
        this.models.forEach(function(model){
            if(cids[model.cid]) { 
                model.fire('add', [model, options]);
            }
        });
        return this;
    },

    fetch: function(options) {
        options = options ? atom.clone(options) : {};
        if (options.parse === undefined) { options.parse = true; }

        var collection = this;
        var onLoad = options.onLoad;

        options.onLoad = function(resp) {
            collection[options.add ? 'add' : 'reset'](collection.parse(resp), options);
            if (onLoad) {onLoad(collection, resp);}
        };
        return this.sync('read', this.model, options);
    },

    parse: function(resp) {
      return resp;
    },

    sync: function(){
        return hydrogen.sync.apply(this, arguments);
    },

    reset: function(models, settings){
        this._reset();
        this.add(models, settings);
        this.fire('reset');
    },

    /** @private */
    _reset: function(options) {
        this.length = 0;
        this.models = [];
        this._byId  = {};
        this._byCid = {};
    },

    /** @private */
    _prepareModel: function(model, options) {
        options = options || {};
        if (!(model instanceof hydrogen.Model)) {
            var attrs = model;
            options.collection = this;
            model = new this.model(attrs, options);
        } else if (!model.collection) {
            model.collection = this;
        }
        return model;
    }
});
